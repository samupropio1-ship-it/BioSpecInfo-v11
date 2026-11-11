"""La configurazione: tutta dall'ambiente, niente nel codice.

Le chiavi dei fornitori e il gettone del servizio sono SEGRETI: stanno in
variabili d'ambiente (o in un file .env fuori dal repository, caricato dal
servizio di sistema), mai in un file tracciato.

  SPECTRA_DB            percorso del file di memoria          (predefinito: ~/.spectra/memoria.db)
  SPECTRA_GETTONE       gettone richiesto da ogni chiamata al servizio (obbligatorio fuori da localhost)
  SPECTRA_PORTA         porta del servizio                    (predefinita: 8787)
  SPECTRA_FORNITORI     ordine dei fornitori, separati da virgola (predefinito: claude,groq,gemini,openrouter,xai,locale)
  ANTHROPIC_API_KEY     Claude (la legge l'SDK)
  GROQ_API_KEY · GEMINI_API_KEY · OPENROUTER_API_KEY · XAI_API_KEY
  SPECTRA_MODELLO_<NOME>  per cambiare il modello di un fornitore senza toccare il codice
  SPECTRA_LOCALE_URL    un modello locale che parla chat/completions (Ollama: http://127.0.0.1:11434/v1)
  SPECTRA_PIPER_MODELLO percorso della voce Piper (.onnx)
"""
from __future__ import annotations

import os

from .fornitori import FornitoreChat, FornitoreClaude, FornitoreGemini, Orchestratore

# i modelli predefiniti: nomi che cambiano nel tempo, per questo si possono sostituire dall'ambiente
MODELLI = {
    "claude": "claude-opus-5-5",
    "groq": "openai/gpt-oss-120b",
    "gemini": "gemini-flash-latest",
    "openrouter": "openrouter/auto",
    "xai": "grok-4",
    "locale": "qwen3:8b",
}
URL_CHAT = {"groq": "https://api.groq.com/openai/v1", "openrouter": "https://openrouter.ai/api/v1", "xai": "https://api.x.ai/v1"}


def _modello(nome: str) -> str:
    return os.environ.get("SPECTRA_MODELLO_" + nome.upper(), MODELLI[nome])


def fornitori_dall_ambiente() -> list:
    """Costruisce solo i fornitori per cui c'e' una chiave (o un indirizzo), nell'ordine chiesto."""
    ordine = [n.strip() for n in os.environ.get("SPECTRA_FORNITORI", "claude,groq,gemini,openrouter,xai,locale").split(",") if n.strip()]
    out = []
    for nome in ordine:
        try:
            if nome == "claude" and (os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_AUTH_TOKEN")):
                out.append(FornitoreClaude(_modello("claude")))
            elif nome == "gemini" and os.environ.get("GEMINI_API_KEY"):
                out.append(FornitoreGemini(_modello("gemini"), os.environ["GEMINI_API_KEY"]))
            elif nome in URL_CHAT and os.environ.get(nome.upper() + "_API_KEY"):
                out.append(FornitoreChat(nome, URL_CHAT[nome], _modello(nome), os.environ[nome.upper() + "_API_KEY"]))
            elif nome == "locale" and os.environ.get("SPECTRA_LOCALE_URL"):
                out.append(FornitoreChat("locale", os.environ["SPECTRA_LOCALE_URL"], _modello("locale"), None))
        except ImportError:
            continue        # manca la libreria di quel fornitore: si salta, gli altri restano
    return out


def orchestratore_dall_ambiente(annota=None) -> Orchestratore:
    f = fornitori_dall_ambiente()
    if not f:
        raise RuntimeError("nessun fornitore configurato: imposta almeno una chiave (vedi spectra/configurazione.py)")
    return Orchestratore(f, annota=annota)


def percorso_db() -> str:
    p = os.environ.get("SPECTRA_DB") or os.path.join(os.path.expanduser("~"), ".spectra", "memoria.db")
    os.makedirs(os.path.dirname(p), exist_ok=True)
    return p
