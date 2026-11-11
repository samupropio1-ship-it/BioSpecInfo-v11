"""I fornitori di modelli e l'orchestrazione.

Spectra non dipende da un modello. Ogni fornitore sa fare UNA cosa: un turno
completo, cioe' la richiesta, le chiamate agli strumenti che il modello decide,
e la risposta finale. Il ciclo degli strumenti resta dentro il fornitore,
perche' ogni protocollo lo esprime a modo suo (i blocchi `tool_use` di Claude,
le `tool_calls` del protocollo chat/completions, le `functionCall` di Gemini) e
tradurre a meta' turno da uno all'altro perde informazioni.

L'ORCHESTRATORE prova i fornitori in ordine. Se uno e' sovraccarico, senza
quota o irraggiungibile, il turno riparte DA CAPO sul successivo, con i
messaggi originali; chi ha fallito resta in pausa per un po'. Un errore che si
ripeterebbe identico ovunque (una richiesta malformata) non fa il giro: sale
subito.

Claude si chiama con l'SDK ufficiale `anthropic`. Gli altri fornitori parlano
protocolli propri, via HTTP: chat/completions (Groq, OpenRouter, xAI, OpenAI,
un modello locale con Ollama o llama.cpp) e l'API di Gemini.

Le chiavi non stanno mai nel codice ne' nel repository: si leggono
dall'ambiente (vedi `configurazione.py`).
"""
from __future__ import annotations

import json
import time
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from typing import Any, Callable, Sequence

Esecutore = Callable[[str, dict], str]          # (nome dello strumento, argomenti) → risultato in testo


@dataclass
class Strumento:
    nome: str
    descrizione: str
    schema: dict                                 # JSON Schema degli argomenti (type: object)


@dataclass
class Risposta:
    testo: str
    fornitore: str
    modello: str
    strumenti_usati: list[dict] = field(default_factory=list)   # [{nome, argomenti, esito}]
    motivo_fine: str = "fine"                    # fine | troncata | rifiuto | giri_esauriti
    uso: dict = field(default_factory=dict)


class ErroreFornitore(Exception):
    """passeggero=True: vale la pena provare un altro fornitore. False: l'errore e' nella richiesta, si ripeterebbe."""

    def __init__(self, messaggio: str, *, passeggero: bool, stato: int | None = None):
        super().__init__(messaggio)
        self.passeggero = passeggero
        self.stato = stato


def valida(argomenti: Any, schema: dict) -> str | None:
    """Un controllo minimo degli argomenti di uno strumento contro il suo schema: oggetto, campi richiesti, tipi semplici.
    Restituisce None se va bene, altrimenti la descrizione dell'errore (che torna al modello, cosi' si corregge)."""
    if not isinstance(argomenti, dict):
        return "gli argomenti non sono un oggetto"
    for campo in schema.get("required", []):
        if campo not in argomenti:
            return f"manca il campo richiesto «{campo}»"
    tipi = {"string": str, "number": (int, float), "integer": int, "boolean": bool, "array": list, "object": dict}
    for campo, valore in argomenti.items():
        atteso = schema.get("properties", {}).get(campo, {}).get("type")
        if atteso in tipi and (not isinstance(valore, tipi[atteso]) or (atteso in ("number", "integer") and isinstance(valore, bool))):
            return f"il campo «{campo}» dovrebbe essere {atteso}"
        scelte = schema.get("properties", {}).get(campo, {}).get("enum")
        if scelte and valore not in scelte:
            return f"il campo «{campo}» deve essere uno fra {scelte}"
    return None


def _esegui(esegui: Esecutore | None, strumenti: Sequence[Strumento], nome: str, argomenti: Any, registro: list[dict]) -> tuple[str, bool]:
    """Esegue uno strumento in sicurezza: argomenti validati, eccezioni trasformate in un risultato d'errore per il modello."""
    s = next((x for x in strumenti if x.nome == nome), None)
    if s is None or esegui is None:
        return f"strumento sconosciuto: {nome}", True
    errore = valida(argomenti, s.schema)
    if errore:
        registro.append({"nome": nome, "argomenti": argomenti, "esito": "argomenti non validi: " + errore})
        return "argomenti non validi: " + errore, True
    try:
        esito = esegui(nome, argomenti)
        registro.append({"nome": nome, "argomenti": argomenti, "esito": str(esito)[:500]})
        return str(esito), False
    except Exception as e:  # lo strumento e' fallito: il modello deve saperlo, non il processo morire
        registro.append({"nome": nome, "argomenti": argomenti, "esito": "errore: " + str(e)[:300]})
        return "errore dello strumento: " + str(e)[:500], True


# ═══ Claude, con l'SDK ufficiale ════════════════════════════════════════════
class FornitoreClaude:
    """Claude via `anthropic` (pip install anthropic). Le credenziali le risolve l'SDK dall'ambiente."""

    nome = "claude"

    def __init__(self, modello: str = "claude-opus-5-5", sforzo: str = "medium", max_token: int = 64000, giri: int = 12):
        import anthropic                        # importato qui: e' facoltativo, come ogni fornitore
        self._anthropic = anthropic
        self.client = anthropic.Anthropic()
        self.modello, self.sforzo, self.max_token, self.giri = modello, sforzo, max_token, giri

    def _richiesta(self, sistema: str, messaggi: list, strumenti: Sequence[Strumento], sforzo: str | None, schema: dict | None = None):
        config: dict[str, Any] = {"effort": sforzo or self.sforzo}
        if schema:
            config["format"] = {"type": "json_schema", "schema": schema}
        parametri: dict[str, Any] = dict(
            model=self.modello, max_tokens=self.max_token, messages=messaggi, output_config=config,
            # il prompt di sistema e' stabile: si mette in cache. Cio' che cambia a ogni turno (ricordi, obiettivi, ora) sta
            # nel messaggio dell'utente, dopo il punto di cache, altrimenti la cache non servirebbe mai.
            system=[{"type": "text", "text": sistema, "cache_control": {"type": "ephemeral"}}],
            # se il modello declina per i suoi filtri di sicurezza, l'API ripete la richiesta su un modello di riserva
            betas=["server-side-fallback-2026-07-01"], fallbacks="default",
        )
        if strumenti:
            parametri["tools"] = [{"name": s.nome, "description": s.descrizione, "input_schema": s.schema, "eager_input_streaming": True} for s in strumenti]
        # in streaming: una risposta lunga non scade per tempo; qui interessa il messaggio finale
        with self.client.beta.messages.stream(**parametri) as flusso:
            return flusso.get_final_message()

    def _chiama(self, *args, **kw):
        A = self._anthropic
        try:
            return self._richiesta(*args, **kw)
        except A.RateLimitError as e:
            raise ErroreFornitore(f"Claude: limite di frequenza ({e})", passeggero=True, stato=429) from e
        except A.APIConnectionError as e:
            raise ErroreFornitore(f"Claude: rete ({e})", passeggero=True) from e
        except A.APIStatusError as e:
            raise ErroreFornitore(f"Claude: HTTP {e.status_code} ({e})", passeggero=e.status_code >= 500 or e.status_code in (401, 403), stato=e.status_code) from e
        except ValueError as e:               # JSON degli argomenti non leggibile durante lo streaming
            raise ErroreFornitore(f"Claude: risposta non leggibile ({e})", passeggero=True) from e

    def turno(self, sistema: str, messaggi: Sequence[dict], strumenti: Sequence[Strumento] = (), esegui: Esecutore | None = None, sforzo: str | None = None) -> Risposta:
        storia: list = [_claude_messaggio(m) for m in messaggi]
        registro: list[dict] = []
        uso = {"ingresso": 0, "uscita": 0, "da_cache": 0}
        for _ in range(self.giri):
            r = self._chiama(sistema, storia, strumenti, sforzo)
            uso["ingresso"] += r.usage.input_tokens or 0; uso["uscita"] += r.usage.output_tokens or 0
            uso["da_cache"] += getattr(r.usage, "cache_read_input_tokens", 0) or 0
            testo = "".join(b.text for b in r.content if b.type == "text")
            if r.stop_reason == "refusal":
                return Risposta(testo, self.nome, r.model, registro, "rifiuto", uso)
            if r.stop_reason == "pause_turn":
                storia.append({"role": "assistant", "content": r.content}); continue
            chiamate = [b for b in r.content if b.type == "tool_use"]
            if r.stop_reason == "max_tokens":
                # troncata: gli argomenti di uno strumento potrebbero essere a meta'. Non si esegue niente.
                return Risposta(testo, self.nome, r.model, registro, "troncata", uso)
            if not chiamate:
                return Risposta(testo, self.nome, r.model, registro, "fine", uso)
            storia.append({"role": "assistant", "content": r.content})       # tutto il contenuto, pensiero compreso, invariato
            risultati = []
            for c in chiamate:
                esito, errore = _esegui(esegui, strumenti, c.name, c.input, registro)
                risultati.append({"type": "tool_result", "tool_use_id": c.id, "content": esito, **({"is_error": True} if errore else {})})
            storia.append({"role": "user", "content": risultati})             # tutti i risultati in UN messaggio
        return Risposta("", self.nome, self.modello, registro, "giri_esauriti", uso)

    def struttura(self, sistema: str, richiesta: str, schema: dict, sforzo: str | None = None) -> Any:
        r = self._chiama(sistema, [{"role": "user", "content": richiesta}], (), sforzo or "low", schema=schema)
        if r.stop_reason == "refusal":
            raise ErroreFornitore("Claude ha declinato la richiesta", passeggero=True)
        return json.loads(next(b.text for b in r.content if b.type == "text"))


def _claude_messaggio(m: dict) -> dict:
    ruolo = "assistant" if m["ruolo"] == "spectra" else "user"
    if m.get("immagini") and ruolo == "user":
        blocchi = [{"type": "image", "source": {"type": "base64", "media_type": i["mime"], "data": i["b64"]}} for i in m["immagini"]]
        return {"role": ruolo, "content": blocchi + [{"type": "text", "text": m["testo"]}]}
    return {"role": ruolo, "content": m["testo"]}


# ═══ il protocollo chat/completions (Groq, OpenRouter, xAI, OpenAI, modelli locali) ═════
def _http(url: str, corpo: dict, intestazioni: dict, attesa: float, nome: str) -> dict:
    richiesta = urllib.request.Request(url, json.dumps(corpo).encode(), {"Content-Type": "application/json", **intestazioni})
    try:
        with urllib.request.urlopen(richiesta, timeout=attesa) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        dettaglio = e.read().decode("utf-8", "replace")[:300]
        raise ErroreFornitore(f"{nome}: HTTP {e.code} — {dettaglio}", passeggero=e.code in (401, 402, 403, 408, 409, 429) or e.code >= 500, stato=e.code) from e
    except (urllib.error.URLError, TimeoutError, ConnectionError) as e:
        raise ErroreFornitore(f"{nome}: rete ({e})", passeggero=True) from e


class FornitoreChat:
    def __init__(self, nome: str, url: str, modello: str, chiave: str | None, max_token: int = 4096, giri: int = 8, attesa: float = 120.0):
        self.nome, self.url, self.modello, self.chiave = nome, url.rstrip("/"), modello, chiave
        self.max_token, self.giri, self.attesa = max_token, giri, attesa

    def _invia(self, corpo: dict) -> dict:
        return _http(self.url + "/chat/completions", corpo, {"Authorization": "Bearer " + self.chiave} if self.chiave else {}, self.attesa, self.nome)

    def turno(self, sistema: str, messaggi: Sequence[dict], strumenti: Sequence[Strumento] = (), esegui: Esecutore | None = None, sforzo: str | None = None) -> Risposta:
        storia: list[dict] = [{"role": "system", "content": sistema}]
        for m in messaggi:
            ruolo = "assistant" if m["ruolo"] == "spectra" else "user"
            if m.get("immagini") and ruolo == "user":
                storia.append({"role": ruolo, "content": [{"type": "text", "text": m["testo"]}] + [{"type": "image_url", "image_url": {"url": f"data:{i['mime']};base64,{i['b64']}"}} for i in m["immagini"]]})
            else:
                storia.append({"role": ruolo, "content": m["testo"]})
        registro: list[dict] = []
        uso = {"ingresso": 0, "uscita": 0}
        for _ in range(self.giri):
            corpo: dict[str, Any] = {"model": self.modello, "messages": storia, "max_tokens": self.max_token}
            if strumenti:
                corpo["tools"] = [{"type": "function", "function": {"name": s.nome, "description": s.descrizione, "parameters": s.schema}} for s in strumenti]
            d = self._invia(corpo)
            u = d.get("usage") or {}
            uso["ingresso"] += u.get("prompt_tokens", 0); uso["uscita"] += u.get("completion_tokens", 0)
            scelta = (d.get("choices") or [{}])[0]
            msg = scelta.get("message") or {}
            chiamate = msg.get("tool_calls") or []
            if not chiamate:
                return Risposta(msg.get("content") or "", self.nome, d.get("model", self.modello), registro, "troncata" if scelta.get("finish_reason") == "length" else "fine", uso)
            storia.append({"role": "assistant", "content": msg.get("content"), "tool_calls": chiamate})
            for c in chiamate:
                f = c.get("function") or {}
                try:
                    argomenti = json.loads(f.get("arguments") or "{}")
                except json.JSONDecodeError:
                    argomenti = None
                esito, _ = _esegui(esegui, strumenti, f.get("name", ""), argomenti, registro)
                storia.append({"role": "tool", "tool_call_id": c.get("id"), "content": esito})
        return Risposta("", self.nome, self.modello, registro, "giri_esauriti", uso)

    def struttura(self, sistema: str, richiesta: str, schema: dict, sforzo: str | None = None) -> Any:
        d = self._invia({"model": self.modello, "max_tokens": self.max_token, "response_format": {"type": "json_object"}, "messages": [
            {"role": "system", "content": sistema + "\nRispondi SOLO con un oggetto JSON che rispetti questo schema:\n" + json.dumps(schema, ensure_ascii=False)},
            {"role": "user", "content": richiesta}]})
        return json.loads(((d.get("choices") or [{}])[0].get("message") or {}).get("content") or "{}")


# ═══ Gemini ═════════════════════════════════════════════════════════════════
class FornitoreGemini:
    nome = "gemini"

    def __init__(self, modello: str, chiave: str, max_token: int = 8192, giri: int = 8, attesa: float = 120.0):
        self.modello, self.chiave, self.max_token, self.giri, self.attesa = modello, chiave, max_token, giri, attesa

    def _invia(self, corpo: dict) -> dict:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.modello}:generateContent"
        return _http(url, corpo, {"x-goog-api-key": self.chiave}, self.attesa, self.nome)   # la chiave nell'intestazione, non nell'indirizzo

    def turno(self, sistema: str, messaggi: Sequence[dict], strumenti: Sequence[Strumento] = (), esegui: Esecutore | None = None, sforzo: str | None = None) -> Risposta:
        storia: list[dict] = []
        for m in messaggi:
            parti: list[dict] = [{"text": m["testo"]}]
            for i in m.get("immagini", []) if m["ruolo"] != "spectra" else []:
                parti.append({"inlineData": {"mimeType": i["mime"], "data": i["b64"]}})
            storia.append({"role": "model" if m["ruolo"] == "spectra" else "user", "parts": parti})
        registro: list[dict] = []
        uso = {"ingresso": 0, "uscita": 0}
        for _ in range(self.giri):
            corpo: dict[str, Any] = {"systemInstruction": {"parts": [{"text": sistema}]}, "contents": storia, "generationConfig": {"maxOutputTokens": self.max_token}}
            if strumenti:
                corpo["tools"] = [{"functionDeclarations": [{"name": s.nome, "description": s.descrizione, "parameters": _schema_gemini(s.schema)} for s in strumenti]}]
            d = self._invia(corpo)
            u = d.get("usageMetadata") or {}
            uso["ingresso"] += u.get("promptTokenCount", 0); uso["uscita"] += u.get("candidatesTokenCount", 0)
            cand = (d.get("candidates") or [{}])[0]
            parti = (cand.get("content") or {}).get("parts") or []
            chiamate = [p["functionCall"] for p in parti if "functionCall" in p]
            testo = "".join(p.get("text", "") for p in parti if "text" in p and not p.get("thought"))
            if not chiamate:
                motivo = {"MAX_TOKENS": "troncata", "SAFETY": "rifiuto", "PROHIBITED_CONTENT": "rifiuto"}.get(cand.get("finishReason", ""), "fine")
                return Risposta(testo, self.nome, self.modello, registro, motivo, uso)
            storia.append({"role": "model", "parts": parti})                   # le parti cosi' come sono: portano le firme del ragionamento
            risposte = []
            for c in chiamate:
                esito, _ = _esegui(esegui, strumenti, c.get("name", ""), c.get("args") or {}, registro)
                risposte.append({"functionResponse": {"name": c.get("name", ""), "response": {"esito": esito}}})
            storia.append({"role": "user", "parts": risposte})
        return Risposta("", self.nome, self.modello, registro, "giri_esauriti", uso)

    def struttura(self, sistema: str, richiesta: str, schema: dict, sforzo: str | None = None) -> Any:
        d = self._invia({"systemInstruction": {"parts": [{"text": sistema + "\nRispondi SOLO con JSON che rispetti questo schema:\n" + json.dumps(schema, ensure_ascii=False)}]},
                         "contents": [{"role": "user", "parts": [{"text": richiesta}]}], "generationConfig": {"maxOutputTokens": self.max_token, "responseMimeType": "application/json"}})
        parti = ((d.get("candidates") or [{}])[0].get("content") or {}).get("parts") or []
        return json.loads("".join(p.get("text", "") for p in parti if not p.get("thought")) or "{}")


def _schema_gemini(schema: dict) -> dict:
    """Gemini non accetta alcune parole dello JSON Schema (additionalProperties, $schema): si tolgono, in profondita'."""
    if isinstance(schema, dict):
        return {k: _schema_gemini(v) for k, v in schema.items() if k not in ("additionalProperties", "$schema")}
    if isinstance(schema, list):
        return [_schema_gemini(x) for x in schema]
    return schema


# ═══ l'orchestratore ════════════════════════════════════════════════════════
class Orchestratore:
    def __init__(self, fornitori: Sequence[Any], pausa: float = 120.0, annota: Callable[..., None] | None = None):
        if not fornitori:
            raise ValueError("serve almeno un fornitore")
        self.fornitori = list(fornitori)
        self.pausa = pausa
        self._in_pausa: dict[str, float] = {}
        self._annota = annota or (lambda *a, **k: None)

    def _ordine(self) -> list[Any]:
        ora = time.time()
        buoni = [f for f in self.fornitori if self._in_pausa.get(f.nome, 0) <= ora]
        fermi = [f for f in self.fornitori if self._in_pausa.get(f.nome, 0) > ora]
        return buoni + fermi                    # chi e' in pausa resta ultimo: se e' l'unico, lo si prova lo stesso

    def _prova(self, azione: Callable[[Any], Any]) -> Any:
        ultimo: Exception | None = None
        for f in self._ordine():
            try:
                esito = azione(f)
                self._in_pausa.pop(f.nome, None)
                return esito
            except ErroreFornitore as e:
                ultimo = e
                self._annota("fornitore_fallito", fornitore=f.nome, errore=str(e)[:300], passeggero=e.passeggero)
                if not e.passeggero:
                    raise
                self._in_pausa[f.nome] = time.time() + self.pausa
        raise ErroreFornitore(f"nessun fornitore ha risposto (ultimo errore: {ultimo})", passeggero=True)

    def turno(self, sistema: str, messaggi: Sequence[dict], strumenti: Sequence[Strumento] = (), esegui: Esecutore | None = None, sforzo: str | None = None) -> Risposta:
        return self._prova(lambda f: f.turno(sistema, messaggi, strumenti, esegui, sforzo))

    def struttura(self, sistema: str, richiesta: str, schema: dict, sforzo: str | None = None) -> Any:
        return self._prova(lambda f: f.struttura(sistema, richiesta, schema, sforzo))


class PensatoreLLM:
    """L'adattatore fra la cura della memoria (`memoria.cura.Pensatore`) e l'orchestratore."""

    def __init__(self, orchestratore: Orchestratore):
        self.o = orchestratore

    def testo(self, sistema: str, richiesta: str, max_token: int = 600) -> str:
        return self.o.turno(sistema, [{"ruolo": "utente", "testo": richiesta}], sforzo="low").testo

    def struttura(self, sistema: str, richiesta: str, schema: dict, max_token: int = 900) -> Any:
        return self.o.struttura(sistema, richiesta, schema, "low")
