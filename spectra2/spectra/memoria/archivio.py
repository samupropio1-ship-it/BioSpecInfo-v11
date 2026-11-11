"""L'archivio della memoria di Spectra: lo schema e le operazioni di scrittura.

Un solo file SQLite, perche' il cervello di Spectra deve poter stare su un
mini-PC e sopravvivere a un'interruzione di corrente: SQLite in modalita' WAL
e' transazionale, non ha un servizio da tenere in piedi e si copia come un file.

I cinque tipi di memoria sono righe della stessa tabella `ricordi`, distinte
dal campo `tipo`; cio' che le rende diverse non e' dove stanno ma COME nascono,
quanto durano e come si recuperano (vedi `recupero.py` e `cura.py`):

  episodio      che cosa e' successo, quando, dove          (nasce a ogni turno)
  fatto         che cosa e' vero, senza piu' la scena       (nasce dal consolidamento)
  procedura     come si fa una cosa                          (nasce dalle azioni riuscite)
  autobiografia il racconto di Spectra su se' e sull'utente  (nasce dal diario serale)
  riflessione   che cosa Spectra ha capito pensandoci        (nasce dalla riflessione)

La memoria di lavoro non e' un tipo di ricordo: e' un buffer a parte (tabella
`lavoro`), piccolo e volatile, che si svuota nel consolidamento.
"""
from __future__ import annotations

import json
import sqlite3
import threading
import time
import uuid
from dataclasses import dataclass, field
from typing import Any, Iterable

from .vettori import Incorporatore, impacchetta, spacchetta

TIPI = ("episodio", "fatto", "procedura", "autobiografia", "riflessione")
FONTI = ("utente", "osservazione", "strumento", "inferenza", "riflessione")
STATI = ("vivo", "compresso", "archiviato")

SCHEMA = """
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS ricordi (
    id            TEXT PRIMARY KEY,
    tipo          TEXT NOT NULL CHECK (tipo IN ('episodio','fatto','procedura','autobiografia','riflessione')),
    testo         TEXT NOT NULL,              -- il contenuto per esteso
    riassunto     TEXT,                       -- la forma compressa (resta quando il testo viene tolto)
    creato        REAL NOT NULL,              -- secondi Unix
    ultimo_accesso REAL NOT NULL,
    accessi       INTEGER NOT NULL DEFAULT 0, -- quante volte e' stato richiamato
    importanza    REAL NOT NULL DEFAULT 0.5,  -- 0..1: quanto conta (stimata alla scrittura, corretta dalla cura)
    valenza       REAL NOT NULL DEFAULT 0.0,  -- -1..1: negativo/positivo per l'utente
    attivazione   REAL NOT NULL DEFAULT 0.0,  -- 0..1: intensita' emotiva o cognitiva (sorpresa, urgenza)
    fiducia       REAL NOT NULL DEFAULT 0.7,  -- 0..1: quanto Spectra ci crede
    fonte         TEXT NOT NULL DEFAULT 'utente',
    stato         TEXT NOT NULL DEFAULT 'vivo' CHECK (stato IN ('vivo','compresso','archiviato')),
    stabilita     REAL NOT NULL DEFAULT 1.0,  -- giorni: la costante di tempo dell'oblio; cresce a ogni richiamo riuscito
    fissato       INTEGER NOT NULL DEFAULT 0, -- 1 = non si dimentica mai (l'utente o Spectra l'hanno deciso)
    sessione      TEXT,
    contesto      TEXT NOT NULL DEFAULT '{}', -- JSON: dispositivo, luogo, argomento, obiettivo…
    sostituito_da TEXT REFERENCES ricordi(id)
);
CREATE INDEX IF NOT EXISTS ricordi_tipo_stato ON ricordi(tipo, stato);
CREATE INDEX IF NOT EXISTS ricordi_creato ON ricordi(creato);
CREATE INDEX IF NOT EXISTS ricordi_sessione ON ricordi(sessione);

-- la ricerca per parole (BM25); il contenuto sta in `ricordi`, qui solo l'indice
CREATE VIRTUAL TABLE IF NOT EXISTS ricordi_fts USING fts5(testo, riassunto, content='ricordi', content_rowid='rowid', tokenize='unicode61 remove_diacritics 2');
CREATE TRIGGER IF NOT EXISTS ricordi_ai AFTER INSERT ON ricordi BEGIN
    INSERT INTO ricordi_fts(rowid, testo, riassunto) VALUES (new.rowid, new.testo, coalesce(new.riassunto, ''));
END;
CREATE TRIGGER IF NOT EXISTS ricordi_ad AFTER DELETE ON ricordi BEGIN
    INSERT INTO ricordi_fts(ricordi_fts, rowid, testo, riassunto) VALUES ('delete', old.rowid, old.testo, coalesce(old.riassunto, ''));
END;
CREATE TRIGGER IF NOT EXISTS ricordi_au AFTER UPDATE OF testo, riassunto ON ricordi BEGIN
    INSERT INTO ricordi_fts(ricordi_fts, rowid, testo, riassunto) VALUES ('delete', old.rowid, old.testo, coalesce(old.riassunto, ''));
    INSERT INTO ricordi_fts(rowid, testo, riassunto) VALUES (new.rowid, new.testo, coalesce(new.riassunto, ''));
END;

-- la ricerca per significato: un vettore per ricordo
CREATE TABLE IF NOT EXISTS vettori (
    ricordo_id TEXT PRIMARY KEY REFERENCES ricordi(id) ON DELETE CASCADE,
    modello    TEXT NOT NULL,
    dim        INTEGER NOT NULL,
    v          BLOB NOT NULL
);

-- il grafo: i ricordi non sono un elenco, si tengono per mano
CREATE TABLE IF NOT EXISTS legami (
    da    TEXT NOT NULL REFERENCES ricordi(id) ON DELETE CASCADE,
    a     TEXT NOT NULL REFERENCES ricordi(id) ON DELETE CASCADE,
    tipo  TEXT NOT NULL CHECK (tipo IN ('deriva_da','sostiene','contraddice','stesso_evento','riguarda','segue')),
    peso  REAL NOT NULL DEFAULT 1.0,
    creato REAL NOT NULL,
    PRIMARY KEY (da, a, tipo)
);
CREATE INDEX IF NOT EXISTS legami_a ON legami(a);

-- le cose di cui si parla (persone, molecole, corsi, luoghi, progetti)
CREATE TABLE IF NOT EXISTS entita (
    id    TEXT PRIMARY KEY,
    nome  TEXT NOT NULL,
    tipo  TEXT NOT NULL,
    nota  TEXT,
    UNIQUE (nome, tipo)
);
CREATE TABLE IF NOT EXISTS menzioni (
    ricordo_id TEXT NOT NULL REFERENCES ricordi(id) ON DELETE CASCADE,
    entita_id  TEXT NOT NULL REFERENCES entita(id) ON DELETE CASCADE,
    PRIMARY KEY (ricordo_id, entita_id)
);

-- la memoria di lavoro: il turno in corso e i pochi che lo precedono
CREATE TABLE IF NOT EXISTS lavoro (
    n         INTEGER PRIMARY KEY AUTOINCREMENT,
    sessione  TEXT NOT NULL,
    ruolo     TEXT NOT NULL,
    contenuto TEXT NOT NULL,
    quando    REAL NOT NULL,
    canale    TEXT NOT NULL DEFAULT 'testo'   -- testo | voce | visione | sistema
);
CREATE INDEX IF NOT EXISTS lavoro_sessione ON lavoro(sessione, n);

-- gli obiettivi: un albero, dal lungo periodo al prossimo passo
CREATE TABLE IF NOT EXISTS obiettivi (
    id         TEXT PRIMARY KEY,
    titolo     TEXT NOT NULL,
    descrizione TEXT,
    orizzonte  TEXT NOT NULL CHECK (orizzonte IN ('giorno','settimana','mese','anno','vita')),
    stato      TEXT NOT NULL DEFAULT 'attivo' CHECK (stato IN ('attivo','sospeso','raggiunto','abbandonato')),
    priorita   REAL NOT NULL DEFAULT 0.5,
    progresso  REAL NOT NULL DEFAULT 0.0,
    genitore   TEXT REFERENCES obiettivi(id),
    criteri    TEXT NOT NULL DEFAULT '[]',    -- JSON: come si capisce che e' raggiunto
    prossimo_passo TEXT,
    proprietario TEXT NOT NULL DEFAULT 'utente' CHECK (proprietario IN ('utente','spectra')),
    creato     REAL NOT NULL,
    scadenza   REAL,
    ultimo_esame REAL
);

-- il modello di se': sfaccettature con la loro fiducia e la loro storia
CREATE TABLE IF NOT EXISTS se (
    chiave     TEXT PRIMARY KEY,
    valore     TEXT NOT NULL,                 -- JSON
    fiducia    REAL NOT NULL DEFAULT 0.7,
    aggiornato REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS se_storia (
    n       INTEGER PRIMARY KEY AUTOINCREMENT,
    chiave  TEXT NOT NULL,
    valore  TEXT NOT NULL,
    quando  REAL NOT NULL,
    motivo  TEXT
);

-- le lacune: che cosa Spectra non sa, e il piano per saperlo
CREATE TABLE IF NOT EXISTS lacune (
    id       TEXT PRIMARY KEY,
    domanda  TEXT NOT NULL,
    argomento TEXT,
    stato    TEXT NOT NULL DEFAULT 'aperta' CHECK (stato IN ('aperta','in_corso','colmata','lasciata')),
    piano    TEXT NOT NULL DEFAULT '[]',      -- JSON: i passi per colmarla
    creato   REAL NOT NULL,
    chiusa   REAL,
    esito    TEXT
);

-- il diario tecnico: ogni operazione di cura lascia una riga (per poter spiegare «perche' non lo ricordi piu'»)
CREATE TABLE IF NOT EXISTS diario (
    n      INTEGER PRIMARY KEY AUTOINCREMENT,
    quando REAL NOT NULL,
    tipo   TEXT NOT NULL,
    dati   TEXT NOT NULL
);
"""


def adesso() -> float:
    return time.time()


def nuovo_id(prefisso: str = "r") -> str:
    return f"{prefisso}_{uuid.uuid4().hex[:16]}"


@dataclass
class Ricordo:
    id: str
    tipo: str
    testo: str
    riassunto: str | None = None
    creato: float = 0.0
    ultimo_accesso: float = 0.0
    accessi: int = 0
    importanza: float = 0.5
    valenza: float = 0.0
    attivazione: float = 0.0
    fiducia: float = 0.7
    fonte: str = "utente"
    stato: str = "vivo"
    stabilita: float = 1.0
    fissato: bool = False
    sessione: str | None = None
    contesto: dict[str, Any] = field(default_factory=dict)
    sostituito_da: str | None = None

    @classmethod
    def da_riga(cls, r: sqlite3.Row) -> "Ricordo":
        d = dict(r)
        d["contesto"] = json.loads(d.get("contesto") or "{}")
        d["fissato"] = bool(d.get("fissato"))
        return cls(**{k: d[k] for k in cls.__dataclass_fields__ if k in d})

    def mostra(self) -> str:
        """Il testo da dare al modello: per esteso se c'e' ancora, altrimenti il riassunto."""
        return self.testo if self.stato == "vivo" or not self.riassunto else self.riassunto


def _limita(x: float, a: float = 0.0, b: float = 1.0) -> float:
    return max(a, min(b, float(x)))


class Archivio:
    """Tutte le scritture passano di qui. Un lucchetto solo: SQLite scrive una transazione alla volta."""

    def __init__(self, percorso: str = ":memory:", incorporatore: Incorporatore | None = None):
        self.percorso = percorso
        self.inc = incorporatore or Incorporatore()
        self._lucchetto = threading.RLock()
        self.db = sqlite3.connect(percorso, check_same_thread=False, isolation_level=None)
        self.db.row_factory = sqlite3.Row
        with self._lucchetto:
            self.db.executescript(SCHEMA)

    # ── transazioni ──────────────────────────────────────────────────────
    def _tx(self):
        return _Transazione(self)

    def annota(self, tipo: str, **dati: Any) -> None:
        with self._lucchetto:
            self.db.execute("INSERT INTO diario(quando, tipo, dati) VALUES (?,?,?)", (adesso(), tipo, json.dumps(dati, ensure_ascii=False)))

    # ── ricordi ──────────────────────────────────────────────────────────
    def scrivi(self, tipo: str, testo: str, *, importanza: float = 0.5, valenza: float = 0.0, attivazione: float = 0.0,
               fiducia: float = 0.7, fonte: str = "utente", sessione: str | None = None, contesto: dict | None = None,
               riassunto: str | None = None, fissato: bool = False, entita: Iterable[tuple[str, str]] = (),
               deriva_da: Iterable[str] = (), quando: float | None = None, stabilita: float | None = None) -> Ricordo:
        """Scrive un ricordo, il suo vettore, le sue entita' e i suoi legami in UNA transazione.

        La stabilita' iniziale dipende da quanto il ricordo conta: una cosa importante o emotivamente carica parte gia'
        piu' resistente all'oblio (un giorno la base; fino a ~15 giorni per importanza e attivazione massime).
        """
        if tipo not in TIPI:
            raise ValueError(f"tipo di ricordo sconosciuto: {tipo}")
        if fonte not in FONTI:
            raise ValueError(f"fonte sconosciuta: {fonte}")
        testo = (testo or "").strip()
        if not testo:
            raise ValueError("un ricordo vuoto non si scrive")
        t = adesso() if quando is None else quando
        importanza, attivazione, fiducia = _limita(importanza), _limita(attivazione), _limita(fiducia)
        valenza = _limita(valenza, -1.0, 1.0)
        if stabilita is None:
            base = {"episodio": 1.0, "fatto": 7.0, "procedura": 14.0, "autobiografia": 30.0, "riflessione": 10.0}[tipo]
            stabilita = base * (1.0 + 6.0 * importanza + 8.0 * attivazione * abs(valenza or 0.5))
        rid = nuovo_id()
        with self._tx():
            self.db.execute(
                "INSERT INTO ricordi(id,tipo,testo,riassunto,creato,ultimo_accesso,importanza,valenza,attivazione,fiducia,fonte,stabilita,fissato,sessione,contesto)"
                " VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                (rid, tipo, testo, riassunto, t, t, importanza, valenza, attivazione, fiducia, fonte, stabilita, int(fissato), sessione,
                 json.dumps(contesto or {}, ensure_ascii=False)))
            v = self.inc.incorpora(testo if not riassunto else riassunto + "\n" + testo)
            self.db.execute("INSERT INTO vettori(ricordo_id, modello, dim, v) VALUES (?,?,?,?)", (rid, self.inc.nome, len(v), impacchetta(v)))
            for nome, tipo_e in entita:
                self._lega_entita(rid, nome, tipo_e)
            for origine in deriva_da:
                self.lega(rid, origine, "deriva_da")
        return self.leggi(rid)

    def leggi(self, rid: str) -> Ricordo | None:
        with self._lucchetto:
            r = self.db.execute("SELECT * FROM ricordi WHERE id = ?", (rid,)).fetchone()
        return Ricordo.da_riga(r) if r else None

    def elenco(self, *, tipo: str | None = None, stato: str | None = "vivo", dal: float | None = None, sessione: str | None = None,
               limite: int = 200) -> list[Ricordo]:
        q, p = "SELECT * FROM ricordi WHERE 1=1", []
        if tipo:
            q += " AND tipo = ?"; p.append(tipo)
        if stato:
            q += " AND stato = ?"; p.append(stato)
        if dal is not None:
            q += " AND creato >= ?"; p.append(dal)
        if sessione:
            q += " AND sessione = ?"; p.append(sessione)
        q += " ORDER BY creato DESC LIMIT ?"; p.append(limite)
        with self._lucchetto:
            return [Ricordo.da_riga(r) for r in self.db.execute(q, p).fetchall()]

    def aggiorna(self, rid: str, **campi: Any) -> None:
        permessi = {"testo", "riassunto", "importanza", "valenza", "attivazione", "fiducia", "stato", "stabilita", "fissato", "sostituito_da", "contesto"}
        if not campi:
            return
        sconosciuti = set(campi) - permessi
        if sconosciuti:
            raise ValueError(f"campi non modificabili: {sorted(sconosciuti)}")
        if "contesto" in campi:
            campi["contesto"] = json.dumps(campi["contesto"], ensure_ascii=False)
        if "fissato" in campi:
            campi["fissato"] = int(bool(campi["fissato"]))
        with self._tx():
            self.db.execute(f"UPDATE ricordi SET {', '.join(k + ' = ?' for k in campi)} WHERE id = ?", [*campi.values(), rid])
            if "testo" in campi or "riassunto" in campi:
                r = self.leggi(rid)
                v = self.inc.incorpora((r.riassunto + "\n" if r.riassunto else "") + r.testo)
                self.db.execute("INSERT OR REPLACE INTO vettori(ricordo_id, modello, dim, v) VALUES (?,?,?,?)", (rid, self.inc.nome, len(v), impacchetta(v)))

    def segna_accesso(self, ids: Iterable[str], quando: float | None = None) -> None:
        """Il richiamo rinforza: ogni volta che un ricordo torna utile la sua stabilita' cresce (effetto del ripasso).

        La crescita e' maggiore se il ricordo stava per essere dimenticato (richiamo «difficile»): e' la curva dello
        spacing, in forma minima. S ← S · (1 + 0,6 · (1 − R)), con R la ritenzione al momento del richiamo.
        """
        t = adesso() if quando is None else quando
        with self._tx():
            for rid in ids:
                r = self.db.execute("SELECT ultimo_accesso, stabilita FROM ricordi WHERE id = ?", (rid,)).fetchone()
                if not r:
                    continue
                giorni = max(0.0, (t - r["ultimo_accesso"]) / 86400.0)
                ritenzione = pow(2.718281828, -giorni / max(r["stabilita"], 1e-6))
                nuova = min(r["stabilita"] * (1.0 + 0.6 * (1.0 - ritenzione)) + 0.05, 3650.0)
                self.db.execute("UPDATE ricordi SET accessi = accessi + 1, ultimo_accesso = ?, stabilita = ? WHERE id = ?", (t, nuova, rid))

    def vettore(self, rid: str) -> list[float] | None:
        with self._lucchetto:
            r = self.db.execute("SELECT v FROM vettori WHERE ricordo_id = ?", (rid,)).fetchone()
        return spacchetta(r["v"]) if r else None

    def cancella(self, rid: str, motivo: str = "") -> None:
        """Cancellazione vera (diritto all'oblio dell'utente): toglie il ricordo, il vettore, i legami. Lascia traccia solo del fatto."""
        with self._tx():
            self.db.execute("DELETE FROM ricordi WHERE id = ?", (rid,))
        self.annota("cancellazione", id=rid, motivo=motivo)

    # ── legami ed entita' ────────────────────────────────────────────────
    def lega(self, da: str, a: str, tipo: str, peso: float = 1.0) -> None:
        with self._lucchetto:
            self.db.execute("INSERT OR REPLACE INTO legami(da, a, tipo, peso, creato) VALUES (?,?,?,?,?)", (da, a, tipo, peso, adesso()))

    def vicini(self, rid: str) -> list[tuple[str, str, float]]:
        """I ricordi legati a questo, in entrambe le direzioni: (id, tipo del legame, peso)."""
        with self._lucchetto:
            righe = self.db.execute("SELECT a AS altro, tipo, peso FROM legami WHERE da = ? UNION ALL SELECT da AS altro, tipo, peso FROM legami WHERE a = ?", (rid, rid)).fetchall()
        return [(r["altro"], r["tipo"], r["peso"]) for r in righe]

    def _lega_entita(self, rid: str, nome: str, tipo: str) -> None:
        nome = nome.strip()
        if not nome:
            return
        r = self.db.execute("SELECT id FROM entita WHERE nome = ? AND tipo = ?", (nome, tipo)).fetchone()
        eid = r["id"] if r else nuovo_id("e")
        if not r:
            self.db.execute("INSERT INTO entita(id, nome, tipo) VALUES (?,?,?)", (eid, nome, tipo))
        self.db.execute("INSERT OR IGNORE INTO menzioni(ricordo_id, entita_id) VALUES (?,?)", (rid, eid))

    def ricordi_di(self, nome: str, limite: int = 50) -> list[Ricordo]:
        with self._lucchetto:
            righe = self.db.execute(
                "SELECT r.* FROM ricordi r JOIN menzioni m ON m.ricordo_id = r.id JOIN entita e ON e.id = m.entita_id"
                " WHERE e.nome = ? AND r.stato != 'archiviato' ORDER BY r.creato DESC LIMIT ?", (nome, limite)).fetchall()
        return [Ricordo.da_riga(r) for r in righe]

    # ── memoria di lavoro ────────────────────────────────────────────────
    def lavoro_aggiungi(self, sessione: str, ruolo: str, contenuto: str, canale: str = "testo") -> None:
        with self._lucchetto:
            self.db.execute("INSERT INTO lavoro(sessione, ruolo, contenuto, quando, canale) VALUES (?,?,?,?,?)", (sessione, ruolo, contenuto, adesso(), canale))

    def lavoro_leggi(self, sessione: str, ultimi: int = 12) -> list[dict]:
        with self._lucchetto:
            righe = self.db.execute("SELECT ruolo, contenuto, quando, canale FROM lavoro WHERE sessione = ? ORDER BY n DESC LIMIT ?", (sessione, ultimi)).fetchall()
        return [dict(r) for r in reversed(righe)]

    def lavoro_svuota(self, sessione: str, tieni: int = 0) -> int:
        with self._tx():
            if tieni:
                c = self.db.execute("DELETE FROM lavoro WHERE sessione = ? AND n NOT IN (SELECT n FROM lavoro WHERE sessione = ? ORDER BY n DESC LIMIT ?)", (sessione, sessione, tieni))
            else:
                c = self.db.execute("DELETE FROM lavoro WHERE sessione = ?", (sessione,))
            return c.rowcount

    # ── numeri ───────────────────────────────────────────────────────────
    def conta(self) -> dict[str, int]:
        with self._lucchetto:
            righe = self.db.execute("SELECT tipo, stato, count(*) AS n FROM ricordi GROUP BY tipo, stato").fetchall()
        out: dict[str, int] = {}
        for r in righe:
            out[f"{r['tipo']}:{r['stato']}"] = r["n"]
        return out

    def chiudi(self) -> None:
        with self._lucchetto:
            self.db.close()


class _Transazione:
    """BEGIN IMMEDIATE … COMMIT, rientrante: le operazioni composte restano atomiche anche se si chiamano fra loro."""

    def __init__(self, archivio: Archivio):
        self.a = archivio

    def __enter__(self):
        self.a._lucchetto.acquire()
        self.esterna = not self.a.db.in_transaction
        if self.esterna:
            self.a.db.execute("BEGIN IMMEDIATE")
        return self

    def __exit__(self, tipo, valore, traccia):
        try:
            if self.esterna:
                self.a.db.execute("ROLLBACK" if tipo else "COMMIT")
        finally:
            self.a._lucchetto.release()
        return False
