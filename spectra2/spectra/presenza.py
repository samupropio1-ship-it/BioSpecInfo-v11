"""La presenza: Spectra e' uno solo, su tutti i dispositivi, e sa quanto tempo e' passato.

Due problemi distinti, che insieme fanno la differenza fra un programma che
risponde e qualcosa che «c'e'»:

1. UNO SOLO, OVUNQUE. Il computer, il telefono e gli occhiali non hanno ognuno
   il proprio Spectra: parlano tutti con lo stesso servizio, la stessa memoria,
   la STESSA conversazione (la sessione e' una, «principale», a meno che si
   chieda altro). Cio' che dici agli occhiali alle 9 e' gia' nella testa di
   Spectra quando apri il computer alle 9 e un minuto.
   · Ogni dispositivo si fa vivo (`tocca`) e resta in ascolto degli EVENTI
     (`attendi`, un'attesa lunga): una risposta data su un dispositivo, un
     promemoria, un'iniziativa compaiono su tutti gli altri.
   · Spectra PARLA su un dispositivo solo: l'ultimo su cui l'utente ha fatto
     qualcosa (`dove_parlare`). Gli altri mostrano, non parlano: un promemoria
     che esce insieme dal telefono, dal computer e dagli occhiali non e'
     presenza, e' rumore.

2. IL TEMPO PASSA ANCHE PER LUI. Un modello linguistico, da solo, vive in un
   presente senza durata: ogni turno e' il primo. Qui ogni turno riceve il
   blocco [CONTINUITA'] (`continuita`), calcolato dai fatti: quanto tempo e'
   passato dall'ultima volta, da quale dispositivo, dove si era rimasti, che
   cosa Spectra ha fatto nel frattempo (la cura notturna, il diario), che cosa
   e' scaduto. E' la differenza fra «Come posso aiutarti?» e «Sono passate
   quattordici ore. Ieri sera eravamo fermi alla Diels–Alder; stanotte ho
   riordinato gli appunti sull'esame. Alle 11 hai il ricevimento».
"""
from __future__ import annotations

import json
import threading
import time

from .memoria.archivio import Archivio, adesso

SCHEMA_PRESENZA = """
CREATE TABLE IF NOT EXISTS dispositivi (
    id       TEXT PRIMARY KEY,               -- scelto dal client e ricordato da lui (es. «telefono-samuele»)
    tipo     TEXT NOT NULL DEFAULT 'browser', -- browser | android | iphone | occhiali | computer
    nome     TEXT,
    primo    REAL NOT NULL,
    visto    REAL NOT NULL,                  -- ultimo segno di vita (anche solo l'ascolto degli eventi)
    usato    REAL                            -- ultima volta che l'UTENTE ci ha fatto qualcosa
);
CREATE TABLE IF NOT EXISTS eventi (
    n       INTEGER PRIMARY KEY AUTOINCREMENT,
    quando  REAL NOT NULL,
    tipo    TEXT NOT NULL,                   -- turno | iniziativa | promemoria | stato
    dati    TEXT NOT NULL,
    origine TEXT                             -- il dispositivo da cui nasce (che non ha bisogno di riceverlo)
);
"""
TIPI = ("browser", "android", "iphone", "occhiali", "computer")
NOMI = {"browser": "il browser", "android": "il telefono", "iphone": "l'iPhone", "occhiali": "gli occhiali", "computer": "il computer"}


def _durata(s: float) -> str:
    if s < 90:
        return "meno di un minuto"
    if s < 5400:
        return f"{round(s / 60)} minuti"
    if s < 129600:
        return f"{round(s / 3600)} ore"
    return f"{round(s / 86400)} giorni"


class Presenza:
    def __init__(self, archivio: Archivio):
        self.a = archivio
        with self.a._lucchetto:
            self.a.db.executescript(SCHEMA_PRESENZA)
        self._novita = threading.Condition()

    # ── i dispositivi ────────────────────────────────────────────────────
    def tocca(self, dispositivo: str, tipo: str = "browser", *, uso: bool = False, nome: str | None = None, ora: float | None = None) -> None:
        """Un dispositivo si fa vivo. `uso=True` quando l'utente ci ha davvero fatto qualcosa (un turno): e' cio' che decide dove parlare."""
        t = adesso() if ora is None else ora
        tipo = tipo if tipo in TIPI else "browser"
        with self.a._lucchetto:
            self.a.db.execute("INSERT INTO dispositivi(id, tipo, nome, primo, visto, usato) VALUES (?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET tipo = excluded.tipo, visto = excluded.visto,"
                              " nome = coalesce(excluded.nome, dispositivi.nome), usato = coalesce(excluded.usato, dispositivi.usato)",
                              (dispositivo, tipo, nome, t, t, t if uso else None))

    def dispositivi(self, ora: float | None = None) -> list[dict]:
        t = adesso() if ora is None else ora
        with self.a._lucchetto:
            righe = self.a.db.execute("SELECT * FROM dispositivi ORDER BY coalesce(usato, 0) DESC").fetchall()
        return [dict(r, collegato=(t - r["visto"]) < 90) for r in righe]

    def dove_parlare(self, ora: float | None = None) -> str | None:
        """Il dispositivo su cui far uscire la voce: l'ultimo usato fra quelli collegati adesso. Nessuno collegato → None (si aspetta)."""
        for d in self.dispositivi(ora):
            if d["collegato"] and d["usato"]:
                return d["id"]
        vivi = [d for d in self.dispositivi(ora) if d["collegato"]]
        return vivi[0]["id"] if vivi else None

    # ── gli eventi: cio' che deve arrivare a tutti i dispositivi ─────────
    def pubblica(self, tipo: str, dati: dict, origine: str | None = None, ora: float | None = None) -> int:
        with self.a._lucchetto:
            c = self.a.db.execute("INSERT INTO eventi(quando, tipo, dati, origine) VALUES (?,?,?,?)", (adesso() if ora is None else ora, tipo, json.dumps(dati, ensure_ascii=False), origine))
            n = c.lastrowid
            self.a.db.execute("DELETE FROM eventi WHERE n < ?", (n - 500,))      # la coda non cresce senza limite
        with self._novita:
            self._novita.notify_all()
        return n

    def ultimo(self) -> int:
        with self.a._lucchetto:
            r = self.a.db.execute("SELECT coalesce(max(n), 0) AS n FROM eventi").fetchone()
        return r["n"]

    def dopo(self, n: int, dispositivo: str | None = None) -> list[dict]:
        with self.a._lucchetto:
            righe = self.a.db.execute("SELECT * FROM eventi WHERE n > ? AND (origine IS NULL OR origine != ?) ORDER BY n LIMIT 50", (n, dispositivo or "")).fetchall()
        return [{"n": r["n"], "quando": r["quando"], "tipo": r["tipo"], "dati": json.loads(r["dati"])} for r in righe]

    def attendi(self, dispositivo: str, dopo: int, attesa: float = 20.0, tipo: str = "browser") -> list[dict]:
        """Attesa lunga: torna appena c'e' un evento nuovo per questo dispositivo, oppure a mani vuote allo scadere."""
        self.tocca(dispositivo, tipo)
        fine = time.time() + attesa
        while True:
            ev = self.dopo(dopo, dispositivo)
            if ev:
                return ev
            resta = fine - time.time()
            if resta <= 0:
                return []
            with self._novita:
                self._novita.wait(min(resta, 5.0))

    # ── la continuita' ───────────────────────────────────────────────────
    def continuita(self, sessione: str, dispositivo: str | None = None, ora: float | None = None) -> dict:
        """I fatti da cui nasce il blocco [CONTINUITA']: tempo passato, dispositivo di prima, filo, che cosa e' successo nel frattempo."""
        t = adesso() if ora is None else ora
        with self.a._lucchetto:
            ultimo = self.a.db.execute("SELECT quando, canale, contenuto FROM lavoro WHERE sessione = ? AND ruolo = 'utente' ORDER BY n DESC LIMIT 1", (sessione,)).fetchone()
            ep = self.a.db.execute("SELECT creato, contesto FROM ricordi WHERE tipo = 'episodio' ORDER BY creato DESC LIMIT 1").fetchone()
            conv = self.a.db.execute("SELECT count(*) AS n FROM ricordi WHERE tipo = 'episodio'").fetchone()["n"]
        ultimo_t = max(ultimo["quando"] if ultimo else 0, ep["creato"] if ep else 0) or None
        passato = (t - ultimo_t) if ultimo_t else None
        prima_canale = ultimo["canale"] if ultimo else (json.loads(ep["contesto"] or "{}").get("canale") if ep else None)
        nel_frattempo: list[str] = []
        if ultimo_t:
            with self.a._lucchetto:
                righe = self.a.db.execute("SELECT tipo, dati FROM diario WHERE quando > ? AND tipo IN ('ciclo_notturno','riflessione','consolidamento','oblio') ORDER BY n", (ultimo_t,)).fetchall()
                diario = self.a.db.execute("SELECT testo FROM ricordi WHERE tipo = 'autobiografia' AND creato > ? ORDER BY creato DESC LIMIT 1", (ultimo_t,)).fetchone()
                rifl = self.a.db.execute("SELECT testo FROM ricordi WHERE tipo = 'riflessione' AND creato > ? ORDER BY importanza DESC LIMIT 2", (ultimo_t,)).fetchall()
            fatti = sum(json.loads(r["dati"]).get("fatti", 0) for r in righe if r["tipo"] == "consolidamento")
            archiviati = sum(json.loads(r["dati"]).get("archiviati", 0) for r in righe if r["tipo"] == "oblio")
            if fatti:
                nel_frattempo.append(f"ho consolidato la memoria: {fatti} fatti nuovi dagli episodi")
            if archiviati:
                nel_frattempo.append(f"ho lasciato andare {archiviati} ricordi che non contavano")
            for r in rifl:
                nel_frattempo.append("ho capito: " + r["testo"][:200])
            if diario:
                nel_frattempo.append("diario: " + diario["testo"][:300])
        return {"passato": passato, "prima": prima_canale, "filo": (ultimo["contenuto"][:200] if ultimo else None), "nel_frattempo": nel_frattempo,
                "conversazioni": conv, "ritorno": bool(passato and passato > 4 * 3600), "primo_incontro": conv == 0}

    def blocco(self, sessione: str, canale: str, dispositivo: str | None = None, ora: float | None = None) -> str:
        c = self.continuita(sessione, dispositivo, ora)
        if c["primo_incontro"]:
            return "[CONTINUITÀ]\nÈ la prima conversazione: non hai ancora ricordi di lui. Dillo com'è, e comincia a conoscerlo."
        righe = [f"Dall'ultima volta che vi siete parlati: {_durata(c['passato'])}." if c["passato"] is not None else "Non risulta una conversazione precedente in questa sessione."]
        if c["prima"] and c["prima"] != canale:
            righe.append(f"Prima era su «{c['prima']}», ora è su «{canale}»: è la stessa conversazione, continua da lì.")
        if c["filo"]:
            righe.append(f"L'ultima cosa che ti ha detto: «{c['filo']}»")
        if c["nel_frattempo"]:
            righe.append("Nel frattempo, da solo: " + "; ".join(c["nel_frattempo"]) + ".")
        if c["ritorno"]:
            righe.append("È un ritorno dopo ore: se è naturale, riprendi il filo in una frase (che cosa era aperto, che cosa è cambiato) prima di rispondere. Non salutare come se fosse la prima volta.")
        righe.append(f"Conversazioni avute finora: {c['conversazioni']}.")
        return "[CONTINUITÀ]\n" + "\n".join(righe)
