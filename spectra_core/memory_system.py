"""spectra_core.memory_system — la memoria di Spectra Prime.

Quattro livelli, gli stessi della memoria nel browser (bsi-spectra-memoria.js):
episodica (che cosa è successo), semantica (che cosa è vero), procedurale (come
preferisce lavorare l'utente) e lo stato interno (variabili numeriche fra 0 e 1).

Persistenza su SQLite (libreria standard, un file solo): basta per una persona e
non richiede servizi esterni. Lo schema PostgreSQL + Qdrant del progetto resta la
strada per più utenti: questa classe ha la stessa interfaccia asincrona
(recall_context, remember, update_internal_state), quindi si sostituisce senza
toccare l'orchestratore.

Il richiamo è lessicale (parole in comune pesate per importanza e recenza), non
vettoriale: dichiarato, ed è il punto da sostituire con gli embedding.
"""
from __future__ import annotations

import asyncio
import json
import math
import re
import sqlite3
import time
import unicodedata
from typing import Any, Dict, List, Optional

TIPI = ("episodic", "semantic", "procedural")
STATO_INIZIALE = {"focus": 0.5, "curiosity": 0.5, "confidence": 0.5, "fatigue": 0.0}
VUOTE = set("il lo la i gli le un una di da in con su per tra fra che e o ma non mi ti si ci the a an of to and or is are".split())


def _parole(testo: str) -> List[str]:
    t = unicodedata.normalize("NFD", testo.lower())
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return [p for p in re.split(r"[^a-z0-9]+", t) if len(p) > 2 and p not in VUOTE]


class MemorySystem:
    def __init__(self, percorso: str = ":memory:"):
        self._db = sqlite3.connect(percorso, check_same_thread=False)
        self._lock = asyncio.Lock()
        self._db.executescript(
            """
            CREATE TABLE IF NOT EXISTS memoria (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id TEXT NOT NULL, tipo TEXT NOT NULL, testo TEXT NOT NULL,
              importanza REAL NOT NULL, creato REAL NOT NULL, richiami INTEGER NOT NULL DEFAULT 0);
            CREATE INDEX IF NOT EXISTS memoria_utente ON memoria(user_id);
            CREATE TABLE IF NOT EXISTS stato_interno (user_id TEXT PRIMARY KEY, stato TEXT NOT NULL);
            """
        )
        self._db.commit()

    # ── scrittura ────────────────────────────────────────────────────────
    async def remember(self, user_id: str, testo: str, memory_type: str = "episodic", importance: float = 0.5) -> int:
        if memory_type not in TIPI:
            raise ValueError(f"tipo di memoria sconosciuto: {memory_type}")
        testo = testo.strip()
        if not testo:
            raise ValueError("ricordo vuoto")
        imp = max(0.0, min(1.0, float(importance)))
        async with self._lock:
            # un ricordo identico non si duplica: se ne alza l'importanza
            r = self._db.execute("SELECT id, importanza FROM memoria WHERE user_id=? AND tipo=? AND testo=?", (user_id, memory_type, testo)).fetchone()
            if r:
                self._db.execute("UPDATE memoria SET importanza=? WHERE id=?", (max(r[1], imp), r[0]))
                self._db.commit()
                return r[0]
            c = self._db.execute("INSERT INTO memoria(user_id, tipo, testo, importanza, creato) VALUES (?,?,?,?,?)", (user_id, memory_type, testo, imp, time.time()))
            self._db.commit()
            return int(c.lastrowid)

    async def forget(self, user_id: str, memory_id: int) -> bool:
        async with self._lock:
            c = self._db.execute("DELETE FROM memoria WHERE user_id=? AND id=?", (user_id, memory_id))
            self._db.commit()
            return c.rowcount > 0

    # ── lettura ──────────────────────────────────────────────────────────
    async def recall(self, user_id: str, query: str, limite: int = 5, tipo: Optional[str] = None) -> List[Dict[str, Any]]:
        q = set(_parole(query))
        ora = time.time()
        async with self._lock:
            righe = self._db.execute(
                "SELECT id, tipo, testo, importanza, creato FROM memoria WHERE user_id=?" + (" AND tipo=?" if tipo else ""),
                (user_id, tipo) if tipo else (user_id,),
            ).fetchall()
            punteggi = []
            for (mid, t, testo, imp, creato) in righe:
                comuni = len(q & set(_parole(testo)))
                if not comuni and q:
                    continue
                giorni = (ora - creato) / 86400.0
                s = comuni * (0.5 + imp) * math.exp(-giorni / 60.0) if q else imp
                punteggi.append((s, {"id": mid, "type": t, "text": testo, "importance": imp}))
            punteggi.sort(key=lambda x: -x[0])
            scelti = [p[1] for p in punteggi[:limite]]
            for s in scelti:
                self._db.execute("UPDATE memoria SET richiami = richiami + 1 WHERE id=?", (s["id"],))
            self._db.commit()
            return scelti

    async def internal_state(self, user_id: str) -> Dict[str, float]:
        async with self._lock:
            r = self._db.execute("SELECT stato FROM stato_interno WHERE user_id=?", (user_id,)).fetchone()
        return dict(STATO_INIZIALE, **(json.loads(r[0]) if r else {}))

    async def update_internal_state(self, user_id: str, variazioni: Dict[str, float]) -> Dict[str, float]:
        """Somma le variazioni allo stato e le tiene fra 0 e 1."""
        stato = await self.internal_state(user_id)
        for k, v in variazioni.items():
            stato[k] = max(0.0, min(1.0, stato.get(k, 0.5) + float(v)))
        async with self._lock:
            self._db.execute("INSERT INTO stato_interno(user_id, stato) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET stato=excluded.stato", (user_id, json.dumps(stato)))
            self._db.commit()
        return stato

    async def recall_context(self, user_id: str, query: str) -> Dict[str, Any]:
        """Il contesto che l'orchestratore passa agli agenti: ricordi pertinenti per tipo e stato interno."""
        return {
            "episodic": await self.recall(user_id, query, 4, "episodic"),
            "semantic": await self.recall(user_id, query, 4, "semantic"),
            "procedural": await self.recall(user_id, query, 3, "procedural"),
            "internal_state": await self.internal_state(user_id),
        }
