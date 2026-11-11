"""Il recupero: quali ricordi entrano nella testa di Spectra in questo momento.

Non e' «i k piu' simili alla domanda». Il punteggio di un ricordo e' la somma
pesata di sei segnali, ognuno fra 0 e 1:

  rilevanza   quanto c'entra con la domanda (significato E parole, insieme)
  recenza     quanto e' fresco: la ritenzione R = exp(−Δt/S), con S la
              stabilita' del ricordo (cresce a ogni richiamo: vedi archivio)
  importanza  quanto conta, stimata alla scrittura e corretta dalla cura
  emozione    intensita' × |valenza|: cio' che ha colpito si ricorda
  obiettivi   quanto serve agli obiettivi attivi dell'utente e di Spectra
  fiducia     quanto Spectra ci crede (un ricordo contraddetto pesa meno)

Poi tre passi che un database non fa:
  1. ATTIVAZIONE DIFFUSA: i ricordi legati (deriva_da, sostiene, riguarda…) a
     quelli forti ricevono parte del loro punteggio, cosi' un fatto porta con
     se' l'episodio da cui viene;
  2. DIVERSITA' (MMR): fra due ricordi quasi uguali ne entra uno;
  3. RINFORZO: i ricordi usati vengono segnati (accessi, stabilita'), quindi
     ricordare cambia la memoria, come nelle persone.

I pesi dipendono dal MODO della richiesta: una domanda di fatto vuole
rilevanza e fiducia; «che cosa stavamo facendo?» vuole recenza; la
pianificazione vuole obiettivi.
"""
from __future__ import annotations

import math
import re
from dataclasses import dataclass, field
from typing import Sequence

from .archivio import Archivio, Ricordo, adesso
from .vettori import coseno, spacchetta

PESI = {
    #               rilevanza recenza importanza emozione obiettivi fiducia
    "fatto":        (0.50,    0.08,   0.14,      0.04,    0.10,     0.14),
    "conversazione": (0.38,   0.24,   0.14,      0.08,    0.10,     0.06),
    "piano":        (0.30,    0.10,   0.16,      0.04,    0.34,     0.06),
    "ricordo":      (0.30,    0.30,   0.14,      0.16,    0.06,     0.04),
}
_PAROLA_Q = re.compile(r"[0-9A-Za-zÀ-ÖØ-öø-ÿ₀-₉]+")


@dataclass
class Trovato:
    ricordo: Ricordo
    punteggio: float
    parti: dict[str, float] = field(default_factory=dict)   # i sei segnali: per poter SPIEGARE perche' e' stato scelto
    via: str = "diretto"                                    # diretto | legame:<tipo>


def ritenzione(r: Ricordo, t: float) -> float:
    """La curva dell'oblio: R = exp(−giorni dall'ultimo accesso / stabilita'). Un ricordo fissato non decade."""
    if r.fissato:
        return 1.0
    giorni = max(0.0, (t - r.ultimo_accesso) / 86400.0)
    return math.exp(-giorni / max(r.stabilita, 1e-6))


def _interrogazione_fts(testo: str) -> str | None:
    parole = [p for p in _PAROLA_Q.findall(testo) if len(p) > 2][:24]
    return " OR ".join('"' + p.replace('"', "") + '"' for p in parole) if parole else None


class Recupero:
    def __init__(self, archivio: Archivio):
        self.a = archivio

    # ── i candidati: per significato e per parole ─────────────────────────
    def _per_parole(self, domanda: str, limite: int) -> dict[str, float]:
        q = _interrogazione_fts(domanda)
        if not q:
            return {}
        with self.a._lucchetto:
            try:
                righe = self.a.db.execute(
                    "SELECT r.id AS id, bm25(ricordi_fts) AS s FROM ricordi_fts JOIN ricordi r ON r.rowid = ricordi_fts.rowid"
                    " WHERE ricordi_fts MATCH ? AND r.stato != 'archiviato' ORDER BY s LIMIT ?", (q, limite)).fetchall()
            except Exception:
                return {}
        if not righe:
            return {}
        # bm25 di SQLite: piu' negativo = migliore. Si porta fra 0 e 1 rispetto al migliore.
        migliore = min(r["s"] for r in righe) or -1e-9
        return {r["id"]: max(0.0, min(1.0, r["s"] / migliore)) for r in righe}

    def _per_significato(self, v: Sequence[float], limite: int, tipi: Sequence[str] | None) -> dict[str, float]:
        q, p = "SELECT v.ricordo_id AS id, v.v AS v FROM vettori v JOIN ricordi r ON r.id = v.ricordo_id WHERE r.stato != 'archiviato' AND v.modello = ?", [self.a.inc.nome]
        if tipi:
            q += " AND r.tipo IN (" + ",".join("?" * len(tipi)) + ")"; p += list(tipi)
        with self.a._lucchetto:
            righe = self.a.db.execute(q, p).fetchall()
        # Scansione lineare: fino a qualche decina di migliaia di ricordi (anni di uso personale) costa millisecondi.
        # Oltre, si mette un indice approssimato (sqlite-vec, hnswlib) dietro questa stessa funzione.
        punteggi = [(r["id"], coseno(v, spacchetta(r["v"]))) for r in righe]
        punteggi.sort(key=lambda x: -x[1])
        return {i: max(0.0, s) for i, s in punteggi[:limite]}

    # ── il recupero vero e proprio ───────────────────────────────────────
    def cerca(self, domanda: str, *, k: int = 8, modo: str = "conversazione", tipi: Sequence[str] | None = None,
              obiettivi: Sequence[str] = (), quando: float | None = None, rinforza: bool = True, soglia: float = 0.12,
              diffusione: float = 0.35, diversita: float = 0.72) -> list[Trovato]:
        """Restituisce al piu' k ricordi, in ordine di punteggio, ognuno con la spiegazione del punteggio.

        obiettivi: i testi degli obiettivi attivi (titolo + descrizione); il recupero favorisce cio' che li serve.
        soglia:    sotto questa rilevanza un ricordo non entra, per quanto recente o importante: meglio pochi ricordi
                   pertinenti che il contesto pieno di cose vere ma fuori tema.
        """
        t = adesso() if quando is None else quando
        w = PESI.get(modo, PESI["conversazione"])
        vq = self.a.inc.incorpora(domanda)
        vobi = self.a.inc.incorpora_molti(list(obiettivi)) if obiettivi else []
        sem = self._per_significato(vq, max(60, k * 8), tipi)
        lex = self._per_parole(domanda, max(60, k * 8))
        candidati: dict[str, Trovato] = {}
        vett: dict[str, list[float]] = {}
        # «Ti ricordi di cosa parlavamo?» non somiglia a nessun ricordo: per le domande sul passato i candidati sono anche
        # gli episodi piu' recenti, qualunque sia la loro somiglianza con la domanda (qui decide la recenza, non la rilevanza)
        recenti: set[str] = set()
        if modo == "ricordo" and (not tipi or "episodio" in tipi):
            with self.a._lucchetto:
                recenti = {r["id"] for r in self.a.db.execute(
                    "SELECT id FROM ricordi WHERE tipo IN ('episodio','autobiografia') AND stato != 'archiviato' AND creato <= ? ORDER BY creato DESC LIMIT 8", (t,)).fetchall()}
        for rid in set(sem) | set(lex) | recenti:
            r = self.a.leggi(rid)
            if not r or r.stato == "archiviato" or (tipi and r.tipo not in tipi):
                continue
            # significato e parole si completano: il massimo, con un premio se concordano
            s, l = sem.get(rid, 0.0), lex.get(rid, 0.0)
            ril = min(1.0, max(s, 0.85 * l) + 0.15 * min(s, l))
            if ril < soglia and rid not in recenti:
                continue
            if rid in recenti:
                ril = max(ril, 0.5)
            v = self.a.vettore(rid) or []
            vett[rid] = v
            parti = {
                "rilevanza": ril,
                "recenza": ritenzione(r, t),
                "importanza": r.importanza,
                "emozione": min(1.0, r.attivazione * (0.4 + 0.6 * abs(r.valenza))),
                "obiettivi": max((max(0.0, coseno(v, vo)) for vo in vobi), default=0.0),
                "fiducia": r.fiducia,
            }
            punteggio = sum(wi * parti[n] for wi, n in zip(w, ("rilevanza", "recenza", "importanza", "emozione", "obiettivi", "fiducia")))
            # un ricordo superato da uno piu' nuovo resta consultabile ma scende
            if r.sostituito_da:
                punteggio *= 0.5
            candidati[rid] = Trovato(r, punteggio, parti)

        # 1. attivazione diffusa: un passo lungo i legami, dai dodici piu' forti
        if diffusione > 0 and candidati:
            forti = sorted(candidati.values(), key=lambda x: -x.punteggio)[:12]
            for f in forti:
                for altro, tipo_l, peso in self.a.vicini(f.ricordo.id):
                    if tipo_l == "contraddice":
                        continue  # una contraddizione non «sostiene»: la si porta a galla a parte (vedi contraddizioni)
                    spinta = f.punteggio * diffusione * min(1.0, peso)
                    if altro in candidati:
                        candidati[altro].punteggio += 0.5 * spinta
                    else:
                        r2 = self.a.leggi(altro)
                        if r2 and r2.stato != "archiviato" and (not tipi or r2.tipo in tipi):
                            vett[altro] = self.a.vettore(altro) or []
                            candidati[altro] = Trovato(r2, spinta, {"rilevanza": 0.0, "da": f.punteggio}, via="legame:" + tipo_l)

        # 2. diversita': massima rilevanza marginale
        ordinati = sorted(candidati.values(), key=lambda x: -x.punteggio)
        scelti: list[Trovato] = []
        while ordinati and len(scelti) < k:
            migliore, valore = None, -1e9
            for c in ordinati[:40]:
                sim = max((coseno(vett.get(c.ricordo.id, []), vett.get(s.ricordo.id, [])) for s in scelti), default=0.0)
                m = diversita * c.punteggio - (1.0 - diversita) * max(0.0, sim)
                if m > valore:
                    migliore, valore = c, m
            scelti.append(migliore)
            ordinati.remove(migliore)

        # 3. ricordare rinforza
        if rinforza and scelti:
            self.a.segna_accesso([s.ricordo.id for s in scelti], t)
        return scelti

    def contraddizioni(self, trovati: Sequence[Trovato]) -> list[tuple[Ricordo, Ricordo]]:
        """Le coppie in conflitto fra i ricordi appena recuperati e il resto della memoria: Spectra deve saperlo PRIMA di rispondere."""
        out, visti = [], set()
        for tr in trovati:
            for altro, tipo_l, _ in self.a.vicini(tr.ricordo.id):
                if tipo_l != "contraddice":
                    continue
                chiave = tuple(sorted((tr.ricordo.id, altro)))
                if chiave in visti:
                    continue
                visti.add(chiave)
                r2 = self.a.leggi(altro)
                if r2:
                    out.append((tr.ricordo, r2))
        return out

    def contesto(self, trovati: Sequence[Trovato], *, limite_caratteri: int = 6000, quando: float | None = None) -> str:
        """Il blocco di testo per il modello: ogni ricordo con il tipo, l'eta', la fiducia e la fonte. Senza numeri finti."""
        t = adesso() if quando is None else quando
        righe, usati = [], 0
        for tr in trovati:
            r = tr.ricordo
            eta = _eta(t - r.creato)
            riga = f"[{r.tipo} · {eta} · fiducia {r.fiducia:.1f} · {r.fonte}{' · superato' if r.sostituito_da else ''}] {r.mostra()}"
            if usati + len(riga) > limite_caratteri:
                break
            righe.append(riga); usati += len(riga)
        for a, b in self.contraddizioni(trovati):
            righe.append(f"[CONFLITTO] «{a.mostra()[:160]}» contro «{b.mostra()[:160]}»: non scegliere in silenzio; dillo, e chiedi o verifica.")
        return "\n".join(righe)


def _eta(secondi: float) -> str:
    if secondi < 90:
        return "adesso"
    if secondi < 5400:
        return f"{round(secondi / 60)} min fa"
    if secondi < 129600:
        return f"{round(secondi / 3600)} ore fa"
    giorni = secondi / 86400
    if giorni < 45:
        return f"{round(giorni)} giorni fa"
    if giorni < 540:
        return f"{round(giorni / 30)} mesi fa"
    return f"{giorni / 365:.1f} anni fa"
