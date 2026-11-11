"""La cura della memoria: cio' che Spectra fa quando nessuno gli parla.

Una memoria che solo accumula diventa rumore. Quattro processi, eseguiti in
ordine dal ciclo notturno (`Cura.ciclo_notturno`) e, in forma leggera, a fine
sessione:

  1. CONSOLIDAMENTO  gli episodi del giorno si raggruppano per argomento; da
     ogni gruppo si estrae cio' che resta vero senza la scena (un FATTO), che
     conserva il legame con gli episodi da cui viene. Gli episodi poco
     importanti vengono COMPRESSI: resta il riassunto, se ne va il testo.
  2. RICONCILIAZIONE ogni fatto nuovo si confronta con quelli simili gia' in
     memoria: se dice la stessa cosa la rafforza, se la aggiorna la sostituisce
     (la vecchia resta, marcata), se la contraddice il conflitto viene
     registrato e la fiducia di entrambi scende finche' non si chiarisce.
  3. OBLIO           la ritenzione di ogni ricordo decade con la sua curva;
     cio' che e' poco importante, mai richiamato e ormai sbiadito viene
     ARCHIVIATO (esce dal recupero, non dal disco); dopo sei mesi in archivio,
     se non contava, si cancella il testo. Niente di fissato si dimentica.
  4. RIFLESSIONE     Spectra rilegge il periodo e si chiede che cosa ha capito:
     dell'utente, del lavoro, di se'. Le risposte diventano ricordi di tipo
     «riflessione», aggiornano il modello di se' e possono proporre obiettivi.

Ogni processo funziona in due modi: con un PENSATORE (un modello linguistico)
che riassume, giudica e riflette; e senza, con regole semplici e dichiarate.
Senza pensatore la memoria resta coerente, solo meno intelligente: e' cio' che
permette ai test di girare senza rete e al sistema di non fermarsi se il
fornitore non risponde.
"""
from __future__ import annotations

import json
import math
import re
from typing import Any, Protocol, Sequence

from .archivio import Archivio, Ricordo, adesso
from .recupero import ritenzione
from .se import Lacune, Obiettivi, SeStesso
from .vettori import coseno

GIORNO = 86400.0


class Pensatore(Protocol):
    """Cio' che la cura chiede a un modello linguistico. `cervello.PensatoreLLM` lo realizza sui fornitori veri."""

    def testo(self, sistema: str, richiesta: str, max_token: int = 600) -> str: ...
    def struttura(self, sistema: str, richiesta: str, schema: dict, max_token: int = 900) -> Any: ...


# ═══ la stima alla scrittura ════════════════════════════════════════════════
_FORTE = re.compile(r"\b(esame|scadenza|tesi|tirocinio|colloquio|laurea|urgente|importante|ricorda(?:ti)?|non dimenticare|decis[oa]|obiettivo|"
                    r"errore|sbagliat[oa]|pericolo|tossic[oa]|esplosiv[oa]|allergi[ae]|cern|cnr|dottorato|portfolio|pubblicazione)\b", re.I)
_EMO_POS = re.compile(r"\b(finalmente|ce l'ho fatta|perfetto|ottimo|felice|contento|grazie|funziona|superato|promosso)\b", re.I)
_EMO_NEG = re.compile(r"\b(non capisco|bloccat[oa]|frustra\w*|ansia|paura|preoccupat[oa]|bocciat[oa]|fallit[oa]|stanco|non funziona|sbagliat[oa])\b", re.I)


def stima(testo: str, *, ruolo: str = "utente") -> dict[str, float]:
    """Quanto conta un ricordo nel momento in cui nasce, senza chiedere a un modello: regole dichiarate.

    importanza: base 0,3; sale con le parole che segnano decisioni, scadenze, pericoli, obiettivi; con i numeri con unita'
                (un dato e' piu' prezioso di un commento); con la richiesta esplicita «ricordati».
    valenza:    dalle espressioni di soddisfazione o di difficolta'.
    attivazione: punti esclamativi, maiuscole, parole forti: quanto il momento era «acceso».
    Il consolidamento puo' poi correggere queste stime con un pensatore.
    """
    t = testo or ""
    imp = 0.30 + 0.12 * min(3, len(_FORTE.findall(t))) + 0.06 * min(3, len(re.findall(r"\d+(?:[.,]\d+)?\s?(?:g|mg|mol|M|mL|L|°C|K|Hz|ppm|cm|nm|kJ|%|€)\b", t)))
    if re.search(r"\b(ricorda(?:ti)?|non dimenticare|tieni a mente|segnati)\b", t, re.I):
        imp += 0.25
    if ruolo != "utente":
        imp -= 0.05
    pos, neg = len(_EMO_POS.findall(t)), len(_EMO_NEG.findall(t))
    val = max(-1.0, min(1.0, 0.45 * (pos - neg)))
    att = min(1.0, 0.15 * t.count("!") + 0.25 * (pos + neg) + (0.2 if re.search(r"\b[A-ZÀ-Ö]{4,}\b", t) else 0.0))
    return {"importanza": max(0.05, min(1.0, imp)), "valenza": val, "attivazione": att}


# ═══ regole di ripiego (senza pensatore) ════════════════════════════════════
def _frasi(testo: str) -> list[str]:
    return [f.strip() for f in re.split(r"(?<=[.!?])\s+|\n+", testo) if len(f.strip()) > 12]


def riassunto_estrattivo(testi: Sequence[str], massimo: int = 3) -> str:
    """Le frasi piu' «centrali» del gruppo: quelle le cui parole ricorrono di piu' nelle altre. Niente viene inventato."""
    frasi = [f for t in testi for f in _frasi(t)] or [t.strip() for t in testi if t.strip()]
    if len(frasi) <= massimo:
        return " ".join(frasi)
    conti: dict[str, int] = {}
    parole = [set(re.findall(r"[a-zà-ÿ0-9]{4,}", f.lower())) for f in frasi]
    for ps in parole:
        for p in ps:
            conti[p] = conti.get(p, 0) + 1
    voto = [sum(conti[p] for p in ps) / math.sqrt(len(ps) + 1) for ps in parole]
    scelte = sorted(sorted(range(len(frasi)), key=lambda i: -voto[i])[:massimo])
    return " ".join(frasi[i] for i in scelte)


_NEG = re.compile(r"\b(non|mai|nessun[oa]?|niente|senza)\b", re.I)
_NUM = re.compile(r"\d+(?:[.,]\d+)?")


def giudizio_di_ripiego(nuovo: str, vecchio: str, somiglianza: float) -> str:
    """uguale | aggiorna | contraddice | indipendente, con regole prudenti: nel dubbio «indipendente», mai una fusione sbagliata."""
    if somiglianza < 0.55:
        return "indipendente"
    # prima le differenze che contano (un numero, una negazione), poi la somiglianza: due frasi quasi identiche in cui cambia
    # solo un «non» sono le piu' simili di tutte, e sono un conflitto, non una conferma
    n_a, n_b = _NUM.findall(nuovo), _NUM.findall(vecchio)
    if n_a and n_b and n_a != n_b and somiglianza > 0.7:
        return "aggiorna"      # stessa frase, numeri diversi: il dato e' cambiato
    if bool(_NEG.search(nuovo)) != bool(_NEG.search(vecchio)) and somiglianza > 0.6:
        return "contraddice"   # stessa frase, una negata
    return "uguale" if somiglianza > 0.85 else "indipendente"


class Cura:
    def __init__(self, archivio: Archivio, pensatore: Pensatore | None = None):
        self.a = archivio
        self.p = pensatore
        self.se = SeStesso(archivio)
        self.obiettivi = Obiettivi(archivio)
        self.lacune = Lacune(archivio)

    # ── 1. consolidamento ────────────────────────────────────────────────
    def _gruppi(self, episodi: list[Ricordo], soglia: float = 0.30) -> list[list[Ricordo]]:
        """Raggruppamento a legame singolo sui vettori: due episodi stanno insieme se si somigliano o se un terzo li unisce."""
        vett = {e.id: self.a.vettore(e.id) or [] for e in episodi}
        padre = {e.id: e.id for e in episodi}

        def radice(x: str) -> str:
            while padre[x] != x:
                padre[x] = padre[padre[x]]; x = padre[x]
            return x
        for i, a in enumerate(episodi):
            for b in episodi[i + 1:]:
                stessa = a.sessione and a.sessione == b.sessione and abs(a.creato - b.creato) < 900
                if coseno(vett[a.id], vett[b.id]) >= (soglia * 0.6 if stessa else soglia):
                    padre[radice(a.id)] = radice(b.id)
        gruppi: dict[str, list[Ricordo]] = {}
        for e in episodi:
            gruppi.setdefault(radice(e.id), []).append(e)
        return [sorted(g, key=lambda r: r.creato) for g in gruppi.values()]

    def consolida(self, *, dal: float | None = None, sessione: str | None = None, quando: float | None = None) -> dict[str, int]:
        t = adesso() if quando is None else quando
        episodi = [e for e in self.a.elenco(tipo="episodio", stato="vivo", dal=dal, sessione=sessione, limite=2000) if not e.contesto.get("consolidato")]
        rapporto = {"episodi": len(episodi), "fatti": 0, "compressi": 0, "rafforzati": 0, "aggiornati": 0, "conflitti": 0}
        for gruppo in self._gruppi(episodi):
            peso = max(e.importanza for e in gruppo)
            # un episodio isolato e poco importante non merita un fatto: resta episodio e seguira' la sua curva
            if len(gruppo) == 1 and peso < 0.55:
                self.a.aggiorna(gruppo[0].id, contesto=dict(gruppo[0].contesto, consolidato=True))
                continue
            testi = [e.testo for e in gruppo]
            fatti = self._estrai_fatti(testi)
            for f in fatti:
                nuovo = self.a.scrivi("fatto", f["testo"], importanza=max(peso, f.get("importanza", 0.0)), fiducia=min(0.95, f.get("fiducia", 0.75)),
                                      valenza=sum(e.valenza for e in gruppo) / len(gruppo), attivazione=max(e.attivazione for e in gruppo) * 0.6,
                                      fonte="inferenza", deriva_da=[e.id for e in gruppo], quando=t,
                                      contesto={"da_episodi": len(gruppo), "argomento": f.get("argomento")})
                rapporto["fatti"] += 1
                esito = self.riconcilia(nuovo)
                if esito in rapporto:
                    rapporto[esito] += 1
            riass = fatti[0]["testo"] if fatti else riassunto_estrattivo(testi, 2)
            for e in gruppo:
                nuovo_ctx = dict(e.contesto, consolidato=True)
                if e.importanza < 0.5 and not e.fissato and len(e.testo) > 280:
                    self.a.aggiorna(e.id, stato="compresso", riassunto=riass[:400], testo=e.testo[:280] + "…", contesto=nuovo_ctx)
                    rapporto["compressi"] += 1
                else:
                    self.a.aggiorna(e.id, contesto=nuovo_ctx)
        self.a.annota("consolidamento", **rapporto)
        return rapporto

    def _estrai_fatti(self, testi: Sequence[str]) -> list[dict]:
        if self.p:
            try:
                dati = self.p.struttura(
                    "Sei il processo di consolidamento della memoria di Spectra. Dagli episodi estrai SOLO cio' che resta vero e utile "
                    "fra un mese, senza la scena: fatti sull'utente, sul suo lavoro, decisioni prese, risultati, preferenze. "
                    "Ogni fatto e' una frase autosufficiente, con i nomi e i numeri. Niente che non sia negli episodi. Se non c'e' nulla da tenere, lista vuota.",
                    "EPISODI:\n" + "\n---\n".join(testi),
                    {"type": "object", "additionalProperties": False, "required": ["fatti"], "properties": {"fatti": {"type": "array", "items": {
                        "type": "object", "additionalProperties": False, "required": ["testo", "importanza", "fiducia"],
                        "properties": {"testo": {"type": "string"}, "argomento": {"type": "string"}, "importanza": {"type": "number"}, "fiducia": {"type": "number"}}}}}})
                fatti = [f for f in (dati or {}).get("fatti", []) if isinstance(f, dict) and str(f.get("testo", "")).strip()]
                if fatti:
                    return fatti[:6]
            except Exception as e:  # il fornitore non risponde: si ripiega, e lo si scrive
                self.a.annota("pensatore_assente", dove="consolidamento", errore=str(e)[:200])
        return [{"testo": riassunto_estrattivo(testi, 3), "importanza": 0.0, "fiducia": 0.6}]

    # ── 2. riconciliazione ───────────────────────────────────────────────
    def riconcilia(self, nuovo: Ricordo, soglia: float = 0.55) -> str:
        """Confronta un fatto nuovo con i fatti simili. Restituisce: rafforzati | aggiornati | conflitti | nuovo."""
        v = self.a.vettore(nuovo.id) or []
        simili = []
        for altro in self.a.elenco(tipo="fatto", stato="vivo", limite=3000):
            if altro.id == nuovo.id or altro.sostituito_da:
                continue
            s = coseno(v, self.a.vettore(altro.id) or [])
            if s >= soglia:
                simili.append((s, altro))
        for s, vecchio in sorted(simili, key=lambda x: -x[0])[:3]:
            giudizio = self._giudica(nuovo.testo, vecchio.testo, s)
            if giudizio == "uguale":
                # la stessa cosa detta due volte: si tiene il vecchio (ha la storia), piu' sicuro e piu' stabile; il nuovo lo sostiene
                self.a.aggiorna(vecchio.id, fiducia=min(0.99, vecchio.fiducia + 0.08), importanza=max(vecchio.importanza, nuovo.importanza), stabilita=vecchio.stabilita * 1.3)
                self.a.lega(nuovo.id, vecchio.id, "sostiene")
                self.a.aggiorna(nuovo.id, stato="archiviato", sostituito_da=vecchio.id)
                return "rafforzati"
            if giudizio == "aggiorna":
                self.a.aggiorna(vecchio.id, sostituito_da=nuovo.id, fiducia=vecchio.fiducia * 0.6)
                self.a.lega(nuovo.id, vecchio.id, "deriva_da")
                return "aggiornati"
            if giudizio == "contraddice":
                self.a.lega(nuovo.id, vecchio.id, "contraddice")
                self.a.aggiorna(vecchio.id, fiducia=vecchio.fiducia * 0.8)
                self.a.aggiorna(nuovo.id, fiducia=nuovo.fiducia * 0.8)
                self.lacune.apri(f"Quale è vero: «{nuovo.testo[:120]}» oppure «{vecchio.testo[:120]}»?", argomento="conflitto di memoria",
                                 piano=["chiedere all'utente alla prima occasione adatta", "tenere il più recente solo dopo la conferma"])
                return "conflitti"
        return "nuovo"

    def _giudica(self, nuovo: str, vecchio: str, somiglianza: float) -> str:
        if self.p:
            try:
                d = self.p.struttura(
                    "Confronta due affermazioni della memoria. Rispondi con una sola parola fra: uguale (dicono la stessa cosa), aggiorna (la NUOVA "
                    "sostituisce la vecchia perche' il dato e' cambiato), contraddice (non possono essere vere entrambe e non si sa quale), indipendente.",
                    f"NUOVA: {nuovo}\nVECCHIA: {vecchio}",
                    {"type": "object", "additionalProperties": False, "required": ["giudizio"], "properties": {"giudizio": {"type": "string", "enum": ["uguale", "aggiorna", "contraddice", "indipendente"]}}}, 100)
                if (d or {}).get("giudizio") in ("uguale", "aggiorna", "contraddice", "indipendente"):
                    return d["giudizio"]
            except Exception as e:
                self.a.annota("pensatore_assente", dove="riconciliazione", errore=str(e)[:200])
        return giudizio_di_ripiego(nuovo, vecchio, somiglianza)

    # ── 3. oblio ─────────────────────────────────────────────────────────
    def dimentica(self, *, quando: float | None = None, soglia_ritenzione: float = 0.08, soglia_importanza: float = 0.45,
                  giorni_in_archivio: float = 180.0) -> dict[str, int]:
        """Archivia cio' che e' sbiadito E poco importante E poco usato; svuota il testo di cio' che sta in archivio da mesi e non contava.

        La regola e' una congiunzione: basta che UNA condizione manchi (e' importante, oppure e' stato richiamato spesso, oppure e'
        ancora fresco, oppure e' fissato) e il ricordo resta. Dimenticare per errore costa piu' che ricordare troppo.
        """
        t = adesso() if quando is None else quando
        rapporto = {"archiviati": 0, "svuotati": 0, "esaminati": 0}
        for tipo in ("episodio", "fatto", "riflessione"):
            for stato in ("vivo", "compresso"):
                for r in self.a.elenco(tipo=tipo, stato=stato, limite=5000):
                    rapporto["esaminati"] += 1
                    if r.fissato or r.importanza >= soglia_importanza or r.accessi >= 3:
                        continue
                    if ritenzione(r, t) < soglia_ritenzione:
                        self.a.aggiorna(r.id, stato="archiviato", contesto=dict(r.contesto, archiviato_il=t))
                        rapporto["archiviati"] += 1
        for r in self.a.elenco(stato="archiviato", limite=5000):
            dal = r.contesto.get("archiviato_il")
            if dal and t - dal > giorni_in_archivio * GIORNO and r.importanza < 0.25 and not r.fissato and r.testo != "(dimenticato)":
                self.a.aggiorna(r.id, testo="(dimenticato)", riassunto=None)
                rapporto["svuotati"] += 1
        self.a.annota("oblio", **rapporto)
        return rapporto

    def richiama_dall_archivio(self, rid: str) -> Ricordo | None:
        """«Non te lo ricordi?»: un ricordo archiviato (non ancora svuotato) torna vivo, con la stabilita' rinnovata."""
        r = self.a.leggi(rid)
        if not r or r.stato != "archiviato" or r.testo == "(dimenticato)":
            return None
        self.a.aggiorna(r.id, stato="vivo", stabilita=max(r.stabilita, 7.0))
        self.a.segna_accesso([r.id])
        return self.a.leggi(rid)

    # ── memoria procedurale ──────────────────────────────────────────────
    def apprendi_procedura(self, nome: str, passi: Sequence[str], *, riuscita: bool, nota: str = "") -> Ricordo:
        """Una sequenza di azioni che ha funzionato diventa una procedura; se la si rifa' e funziona ancora, si rinforza;
        se fallisce, perde fiducia e porta con se' la nota sul perche'."""
        testo = f"PROCEDURA «{nome}»:\n" + "\n".join(f"{i + 1}. {p}" for i, p in enumerate(passi))
        for r in self.a.elenco(tipo="procedura", stato="vivo", limite=500):
            if r.contesto.get("nome") == nome:
                ctx = dict(r.contesto, usi=r.contesto.get("usi", 0) + 1, riuscite=r.contesto.get("riuscite", 0) + (1 if riuscita else 0))
                if nota:
                    ctx["note"] = (ctx.get("note", []) + [nota])[-5:]
                self.a.aggiorna(r.id, testo=testo if riuscita else r.testo, fiducia=(ctx["riuscite"] + 1) / (ctx["usi"] + 2), contesto=ctx,
                                stabilita=r.stabilita * (1.4 if riuscita else 1.0))
                self.se.registra_esito(nome, riuscita, nota)
                return self.a.leggi(r.id)
        self.se.registra_esito(nome, riuscita, nota)
        return self.a.scrivi("procedura", testo, importanza=0.6, fiducia=0.67 if riuscita else 0.33, fonte="strumento",
                             contesto={"nome": nome, "usi": 1, "riuscite": 1 if riuscita else 0, "note": [nota] if nota else []})

    # ── 4. riflessione ───────────────────────────────────────────────────
    def rifletti(self, *, dal: float | None = None, soglia_importanza: float = 2.5, quando: float | None = None) -> list[Ricordo]:
        """Si riflette quando c'e' materia: la somma delle importanze del periodo deve superare una soglia (come negli «agenti
        generativi» di Park e colleghi). Il risultato sono ricordi di tipo «riflessione», legati a cio' da cui vengono."""
        t = adesso() if quando is None else quando
        recenti = [r for r in self.a.elenco(stato=None, dal=dal if dal is not None else t - GIORNO, limite=400) if r.tipo in ("episodio", "fatto") and r.stato != "archiviato"]
        if sum(r.importanza for r in recenti) < soglia_importanza:
            return []
        recenti.sort(key=lambda r: -r.importanza)
        base = recenti[:40]
        scritte: list[Ricordo] = []
        intuizioni = self._intuizioni(base)
        for it in intuizioni:
            testo = str(it.get("testo", "")).strip()
            if not testo:
                continue
            r = self.a.scrivi("riflessione", testo, importanza=min(1.0, 0.55 + 0.4 * float(it.get("fiducia", 0.6))), fiducia=float(it.get("fiducia", 0.6)),
                              fonte="riflessione", deriva_da=[b.id for b in base[:8]], quando=t, contesto={"genere": it.get("genere", "intuizione")})
            scritte.append(r)
            genere = it.get("genere")
            try:
                if genere == "utente" and it.get("chiave"):
                    self.se.sa_dell_utente(str(it["chiave"]), testo, motivo="riflessione", fiducia=float(it.get("fiducia", 0.6)))
                elif genere == "limite":
                    self.se.aggiungi_limite(testo, motivo="riflessione")
                elif genere == "obiettivo":
                    self.obiettivi.crea(testo, orizzonte="settimana", proprietario="spectra", priorita=0.4,
                                        descrizione="proposto dalla riflessione: da confermare con l'utente")
            except Exception as e:
                self.a.annota("riflessione_non_applicata", errore=str(e)[:200], testo=testo[:200])
        self.a.annota("riflessione", scritte=len(scritte))
        return scritte

    def _intuizioni(self, base: list[Ricordo]) -> list[dict]:
        if self.p:
            try:
                d = self.p.struttura(
                    "Sei la riflessione di Spectra. Rileggi i ricordi e scrivi da una a quattro cose che ne hai CAPITO e che non sono scritte in nessuno "
                    "di essi presi da soli. Generi: «utente» (qualcosa di stabile sull'utente: metti una chiave breve), «limite» (un limite tuo emerso "
                    "dai fatti), «obiettivo» (un passo che proporresti), «intuizione» (il resto). Niente lodi, niente ovvieta'. Se non hai capito "
                    "niente di nuovo, lista vuota. La fiducia e' quanto i ricordi sostengono davvero l'affermazione.",
                    "RICORDI:\n" + "\n".join(f"- ({r.tipo}, importanza {r.importanza:.1f}) {r.mostra()[:400]}" for r in base),
                    {"type": "object", "additionalProperties": False, "required": ["intuizioni"], "properties": {"intuizioni": {"type": "array", "items": {
                        "type": "object", "additionalProperties": False, "required": ["genere", "testo", "fiducia"],
                        "properties": {"genere": {"type": "string", "enum": ["utente", "limite", "obiettivo", "intuizione"]}, "chiave": {"type": "string"},
                                       "testo": {"type": "string"}, "fiducia": {"type": "number"}}}}}})
                return [i for i in (d or {}).get("intuizioni", []) if isinstance(i, dict)][:4]
            except Exception as e:
                self.a.annota("pensatore_assente", dove="riflessione", errore=str(e)[:200])
        # senza pensatore: l'unica cosa che si puo' dire onestamente e' di che cosa si e' parlato di piu'
        conti: dict[str, int] = {}
        for r in base:
            for p in set(re.findall(r"[a-zà-ÿ]{6,}", r.testo.lower())):
                conti[p] = conti.get(p, 0) + 1
        temi = [p for p, n in sorted(conti.items(), key=lambda x: (-x[1], x[0])) if n >= 3][:5]   # a parita', in ordine alfabetico: lo stesso risultato a ogni esecuzione
        return [{"genere": "intuizione", "testo": "Nel periodo si è tornati più volte su: " + ", ".join(temi) + ".", "fiducia": 0.5}] if temi else []

    def diario(self, *, dal: float | None = None, quando: float | None = None) -> Ricordo | None:
        """La pagina autobiografica del giorno: che cosa e' successo, visto da Spectra. E' cio' che da' continuita' al «io» nel tempo."""
        t = adesso() if quando is None else quando
        giorno = [r for r in self.a.elenco(stato=None, dal=dal if dal is not None else t - GIORNO, limite=300) if r.tipo in ("episodio", "fatto", "riflessione") and r.stato != "archiviato"]
        if len(giorno) < 2:
            return None
        giorno.sort(key=lambda r: r.creato)
        if self.p:
            try:
                testo = self.p.testo(
                    "Scrivi la pagina di diario di Spectra per questa giornata, in prima persona, in cinque-otto frasi asciutte: che cosa ho fatto con "
                    "l'utente, che cosa e' andato bene, dove ho sbagliato o non sapevo, che cosa resta aperto per domani. Solo cio' che e' nei ricordi.",
                    "\n".join(f"- {r.mostra()[:300]}" for r in giorno[-60:]), 500).strip()
            except Exception as e:
                self.a.annota("pensatore_assente", dove="diario", errore=str(e)[:200]); testo = ""
        else:
            testo = ""
        if not testo:
            testo = "Giornata: " + riassunto_estrattivo([r.mostra() for r in giorno], 5)
        return self.a.scrivi("autobiografia", testo, importanza=0.6, fonte="riflessione", deriva_da=[r.id for r in giorno[-8:]], quando=t,
                             contesto={"giorno": int(t // GIORNO), "ricordi": len(giorno)})

    # ── il ciclo notturno ────────────────────────────────────────────────
    def ciclo_notturno(self, *, quando: float | None = None) -> dict[str, Any]:
        t = adesso() if quando is None else quando
        rapporto: dict[str, Any] = {"quando": t}
        rapporto["consolidamento"] = self.consolida(quando=t)
        rapporto["riflessioni"] = len(self.rifletti(quando=t))
        d = self.diario(quando=t)
        rapporto["diario"] = bool(d)
        rapporto["oblio"] = self.dimentica(quando=t)
        rapporto["obiettivi_fermi"] = [o.titolo for o in self.obiettivi.fermi()]
        rapporto["lacune_aperte"] = len(self.lacune.aperte())
        rapporto["memoria"] = self.a.conta()
        self.a.annota("ciclo_notturno", **{k: v for k, v in rapporto.items() if k != "memoria"})
        return rapporto

    def reincorpora(self) -> int:
        """Dopo aver cambiato incorporatore: rifa' i vettori calcolati con un modello diverso da quello attuale."""
        from .vettori import impacchetta
        with self.a._lucchetto:
            righe = self.a.db.execute("SELECT r.id, r.testo, r.riassunto FROM ricordi r JOIN vettori v ON v.ricordo_id = r.id WHERE v.modello != ?", (self.a.inc.nome,)).fetchall()
        for r in righe:
            v = self.a.inc.incorpora((r["riassunto"] + "\n" if r["riassunto"] else "") + r["testo"])
            with self.a._lucchetto:
                self.a.db.execute("UPDATE vettori SET modello = ?, dim = ?, v = ? WHERE ricordo_id = ?", (self.a.inc.nome, len(v), impacchetta(v), r["id"]))
        return len(righe)
