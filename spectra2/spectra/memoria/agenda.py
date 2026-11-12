"""L'agenda: impegni, promemoria, compiti. Cio' che fa di Spectra anche un assistente personale.

Tre generi, una tabella:

  promemoria  una cosa da ricordare a un'ora precisa      («alle 18 chiama il relatore»)
  compito     una cosa da fare, con o senza scadenza       («consegnare la relazione di laboratorio entro venerdi'»)
  evento      una cosa che accade in un momento            («esame di Organica 2, 12 febbraio alle 9»)

Ogni voce puo' ripetersi (ogni giorno, ogni settimana, ogni mese), puo' essere
legata a un obiettivo, e ha un ANTICIPO: quanto prima Spectra deve farsi vivo.
Un promemoria detto all'utente non viene ripetuto: resta «avvisato» finche' lui
lo completa o lo rimanda.

Le date arrivano dal modello come testo ISO («2026-02-12T09:00») o come
espressioni semplici che questo modulo capisce da solo («fra 2 ore», «domani
alle 18», «venerdi' alle 9»): cosi' un promemoria dettato a voce funziona anche
se il modello e' impreciso sulle date.
"""
from __future__ import annotations

import calendar
import datetime as dt
import re
from dataclasses import dataclass

from .archivio import Archivio, adesso, nuovo_id

SCHEMA_AGENDA = """
CREATE TABLE IF NOT EXISTS agenda (
    id         TEXT PRIMARY KEY,
    genere     TEXT NOT NULL CHECK (genere IN ('promemoria','compito','evento')),
    testo      TEXT NOT NULL,
    quando     REAL,                          -- secondi Unix; NULL = senza data (un compito aperto)
    anticipo   REAL NOT NULL DEFAULT 0,       -- secondi prima di `quando` in cui avvisare
    ripeti     TEXT CHECK (ripeti IN ('giorno','settimana','mese') OR ripeti IS NULL),
    stato      TEXT NOT NULL DEFAULT 'aperto' CHECK (stato IN ('aperto','avvisato','fatto','annullato')),
    obiettivo  TEXT REFERENCES obiettivi(id),
    creato     REAL NOT NULL,
    chiuso     REAL
);
CREATE INDEX IF NOT EXISTS agenda_quando ON agenda(stato, quando);
"""

_GIORNI = {"lunedi": 0, "martedi": 1, "mercoledi": 2, "giovedi": 3, "venerdi": 4, "sabato": 5, "domenica": 6}
_PARTI = {"mattina": 9, "pomeriggio": 15, "sera": 20, "stasera": 20, "stanotte": 23, "mezzogiorno": 12, "mezzanotte": 0}


def _senza_accenti(s: str) -> str:
    return s.lower().translate(str.maketrans("àèéìòù", "aeeiou"))


def capisci_quando(testo: str, ora: float | None = None) -> float | None:
    """Trasforma «fra 2 ore», «domani alle 18», «venerdi' alle 9:30», «il 12 febbraio alle 9», o una data ISO in secondi Unix.

    Restituisce None se non capisce: meglio un impegno senza data, che il modello puo' chiedere di precisare, che una data inventata.
    """
    if testo is None:
        return None
    t = _senza_accenti(str(testo).strip())
    if not t:
        return None
    base = dt.datetime.fromtimestamp(adesso() if ora is None else ora)
    if re.match(r"^\d{4}-\d{2}-\d{2}", t):   # ISO: 2026-02-12T09:00, 2026-02-12 09:00, 2026-02-12 (allora alle 9)
        try:
            d = dt.datetime.fromisoformat(t.rstrip("z").replace(" ", "T").upper().replace("T", "T", 1))
            return (d if len(t) > 10 else d.replace(hour=9)).timestamp()
        except ValueError:
            return None
    return _relativo(t, base)


def _ora_in(t: str) -> tuple[int, int] | None:
    m = re.search(r"\balle?\s+(\d{1,2})(?:[:.](\d{2}))?\b", t) or re.search(r"\b(\d{1,2})[:.](\d{2})\b", t)
    if m:
        h, mi = int(m.group(1)), int(m.group(2) or 0)
        if 0 <= h <= 23 and 0 <= mi <= 59:
            if h < 12 and re.search(r"\b(pomeriggio|sera|stasera)\b", t) and h >= 1:
                h += 12
            return h, mi
    for parola, h in _PARTI.items():
        if re.search(r"\b" + parola + r"\b", t):
            return h, 0
    return None


def _relativo(t: str, base: dt.datetime) -> float | None:
    m = re.search(r"\b(?:fra|tra|in)\s+(\d+|un|una|mezz)\s*'?\s*(minut[oi]|or[ae]|giorn[oi]|settiman[ae]|mes[ei])", t)
    if m:
        n = 0.5 if m.group(1) == "mezz" else 1 if m.group(1) in ("un", "una") else int(m.group(1))
        u = m.group(2)
        delta = dt.timedelta(minutes=n) if u.startswith("minut") else dt.timedelta(hours=n) if u.startswith("or") else dt.timedelta(days=n) if u.startswith("giorn") \
            else dt.timedelta(weeks=n) if u.startswith("settiman") else dt.timedelta(days=30 * n)
        return (base + delta).timestamp()
    hm = _ora_in(t)
    giorno: dt.date | None = None
    if re.search(r"\bdopodomani\b", t):
        giorno = base.date() + dt.timedelta(days=2)
    elif re.search(r"\bdomani\b", t):
        giorno = base.date() + dt.timedelta(days=1)
    elif re.search(r"\b(oggi|stasera|stanotte|stamattina)\b", t):
        giorno = base.date()
    else:
        for nome, n in _GIORNI.items():
            if re.search(r"\b" + nome + r"\b", t):
                avanti = (n - base.weekday()) % 7
                giorno = base.date() + dt.timedelta(days=avanti or 7)
                break
    if giorno is None:
        mesi = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"]
        m = re.search(r"\b(\d{1,2})\s+(" + "|".join(mesi) + r")(?:\s+(\d{4}))?", t)
        if m:
            g, me, a = int(m.group(1)), mesi.index(m.group(2)) + 1, int(m.group(3) or base.year)
            try:
                giorno = dt.date(a, me, g)
                if not m.group(3) and giorno < base.date():
                    giorno = dt.date(a + 1, me, g)
            except ValueError:
                return None
    if giorno is None and hm is None:
        return None
    if giorno is None:  # solo l'ora: oggi, o domani se e' gia' passata
        giorno = base.date()
        if dt.datetime.combine(giorno, dt.time(*hm)) <= base:
            giorno += dt.timedelta(days=1)
    h, mi = hm if hm else (9, 0)
    return dt.datetime.combine(giorno, dt.time(h, mi)).timestamp()


def _prossima(quando: float, ripeti: str) -> float:
    d = dt.datetime.fromtimestamp(quando)
    if ripeti == "giorno":
        return (d + dt.timedelta(days=1)).timestamp()
    if ripeti == "settimana":
        return (d + dt.timedelta(weeks=1)).timestamp()
    anno, mese = (d.year + 1, 1) if d.month == 12 else (d.year, d.month + 1)
    return d.replace(year=anno, month=mese, day=min(d.day, calendar.monthrange(anno, mese)[1])).timestamp()


@dataclass
class Impegno:
    id: str
    genere: str
    testo: str
    quando: float | None
    anticipo: float
    ripeti: str | None
    stato: str
    obiettivo: str | None
    creato: float
    chiuso: float | None

    def riga(self, ora: float | None = None) -> str:
        t = adesso() if ora is None else ora
        if self.quando is None:
            return f"[{self.genere}] {self.testo} (senza data)"
        d = dt.datetime.fromtimestamp(self.quando)
        fra = self.quando - t
        quanto = "scaduto da " + _durata(-fra) if fra < 0 else "fra " + _durata(fra)
        return f"[{self.genere}] {self.testo} — {d.strftime('%a %d/%m %H:%M')} ({quanto}){' · si ripete ogni ' + self.ripeti if self.ripeti else ''}"


def _durata(s: float) -> str:
    if s < 5400:
        return f"{max(1, round(s / 60))} min"
    if s < 129600:
        return f"{round(s / 3600)} ore"
    return f"{round(s / 86400)} giorni"


class Agenda:
    def __init__(self, archivio: Archivio):
        self.a = archivio
        with self.a._lucchetto:
            self.a.db.executescript(SCHEMA_AGENDA)

    def _da(self, r) -> Impegno:
        return Impegno(**dict(r))

    def aggiungi(self, testo: str, *, genere: str = "promemoria", quando: float | str | None = None, anticipo_minuti: float = 0,
                 ripeti: str | None = None, obiettivo: str | None = None, ora: float | None = None) -> Impegno:
        testo = (testo or "").strip()
        if not testo:
            raise ValueError("un impegno vuoto non si segna")
        if genere not in ("promemoria", "compito", "evento"):
            raise ValueError(f"genere sconosciuto: {genere}")
        q = quando if isinstance(quando, (int, float)) or quando is None else capisci_quando(quando, ora)
        if isinstance(quando, str) and quando.strip() and q is None:
            raise ValueError(f"non capisco quando: «{quando}». Dimmi una data e un'ora, per esempio «domani alle 18» o «2026-02-12T09:00».")
        if genere == "promemoria" and q is None:
            raise ValueError("un promemoria ha bisogno di un momento: quando te lo devo ricordare?")
        iid = nuovo_id("i")
        with self.a._lucchetto:
            self.a.db.execute("INSERT INTO agenda(id, genere, testo, quando, anticipo, ripeti, obiettivo, creato) VALUES (?,?,?,?,?,?,?,?)",
                              (iid, genere, testo, q, max(0.0, anticipo_minuti) * 60, ripeti, obiettivo, adesso() if ora is None else ora))
        return self.leggi(iid)

    def leggi(self, iid: str) -> Impegno | None:
        with self.a._lucchetto:
            r = self.a.db.execute("SELECT * FROM agenda WHERE id = ?", (iid,)).fetchone()
        return self._da(r) if r else None

    def aperti(self, *, entro: float | None = None, ora: float | None = None) -> list[Impegno]:
        """Gli impegni non chiusi, i piu' vicini prima; quelli senza data in fondo. `entro`: solo quelli nei prossimi N secondi."""
        t = adesso() if ora is None else ora
        with self.a._lucchetto:
            righe = self.a.db.execute("SELECT * FROM agenda WHERE stato IN ('aperto','avvisato') ORDER BY quando IS NULL, quando").fetchall()
        out = [self._da(r) for r in righe]
        return [i for i in out if i.quando is not None and i.quando <= t + entro] if entro is not None else out

    def da_avvisare(self, ora: float | None = None) -> list[Impegno]:
        """Cio' di cui e' arrivato il momento (meno l'anticipo) e di cui Spectra non ha ancora parlato."""
        t = adesso() if ora is None else ora
        with self.a._lucchetto:
            righe = self.a.db.execute("SELECT * FROM agenda WHERE stato = 'aperto' AND quando IS NOT NULL AND quando - anticipo <= ? ORDER BY quando", (t,)).fetchall()
        return [self._da(r) for r in righe]

    def segna_avvisato(self, iid: str) -> None:
        with self.a._lucchetto:
            self.a.db.execute("UPDATE agenda SET stato = 'avvisato' WHERE id = ? AND stato = 'aperto'", (iid,))

    def trova(self, descrizione: str) -> list[Impegno]:
        d = _senza_accenti(descrizione)
        parole = [p for p in re.findall(r"[a-z0-9]{3,}", d)]
        return [i for i in self.aperti() if parole and all(p in _senza_accenti(i.testo) for p in parole)] or \
               [i for i in self.aperti() if any(p in _senza_accenti(i.testo) for p in parole if len(p) > 4)]

    def completa(self, iid: str, ora: float | None = None) -> Impegno | None:
        """Chiude un impegno. Se si ripete, ne apre subito il successivo: e' quello che viene restituito."""
        i = self.leggi(iid)
        if not i or i.stato in ("fatto", "annullato"):
            return None
        t = adesso() if ora is None else ora
        with self.a._lucchetto:
            self.a.db.execute("UPDATE agenda SET stato = 'fatto', chiuso = ? WHERE id = ?", (t, iid))
        if i.ripeti and i.quando is not None:
            prossimo = _prossima(i.quando, i.ripeti)
            while prossimo <= t:
                prossimo = _prossima(prossimo, i.ripeti)
            return self.aggiungi(i.testo, genere=i.genere, quando=prossimo, anticipo_minuti=i.anticipo / 60, ripeti=i.ripeti, obiettivo=i.obiettivo, ora=t)
        return None

    def rimanda(self, iid: str, quando: float | str, ora: float | None = None) -> Impegno:
        q = quando if isinstance(quando, (int, float)) else capisci_quando(quando, ora)
        if q is None:
            raise ValueError(f"non capisco a quando rimandare: «{quando}»")
        with self.a._lucchetto:
            self.a.db.execute("UPDATE agenda SET quando = ?, stato = 'aperto' WHERE id = ?", (q, iid))
        return self.leggi(iid)

    def annulla(self, iid: str) -> None:
        with self.a._lucchetto:
            self.a.db.execute("UPDATE agenda SET stato = 'annullato', chiuso = ? WHERE id = ?", (adesso(), iid))

    def estratto(self, ora: float | None = None, massimo: int = 8) -> str:
        """Le righe per il blocco [AGENDA] del turno: cio' che scade nelle prossime 48 ore, poi i compiti aperti."""
        t = adesso() if ora is None else ora
        tutti = self.aperti(ora=t)
        vicini = [i for i in tutti if i.quando is not None and i.quando <= t + 48 * 3600]
        resto = [i for i in tutti if i not in vicini]
        righe = [("! " if i.quando < t else "- ") + i.riga(t) for i in vicini[:massimo]]
        if resto and len(righe) < massimo:
            righe += ["- " + i.riga(t) for i in resto[:massimo - len(righe)]]
        return "\n".join(righe) or "(niente in agenda)"
