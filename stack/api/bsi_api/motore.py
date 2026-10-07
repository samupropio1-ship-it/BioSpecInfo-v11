"""Il ponte verso il motore.

PERCHE' UN SOTTOPROCESSO E NON UNA LIBRERIA PYTHON

Il motore di predizione dell'applicazione e' scritto in JavaScript e usa la
compilazione WebAssembly di RDKit. Riscriverlo in Python darebbe due
programmi che fanno la stessa cosa: uno riceve le correzioni e l'altro no, e
dopo sei mesi danno due numeri diversi per la stessa molecola.

Qui si esegue quello vero, in un processo Node che resta vivo e risponde a
richieste JSON. Costa un processo in piu' e qualche millisecondo di
comunicazione; in cambio non esiste un secondo motore da tenere allineato.

Il processo si riavvia da solo se muore: un'API che smette di funzionare
perche' un sottoprocesso e' caduto, e non lo dice, e' peggio di una che
restituisce un errore.
"""
from __future__ import annotations

import json
import os
import subprocess
import threading
import time
from pathlib import Path
from typing import Any

QUI = Path(__file__).resolve().parent
RADICE = Path(os.environ.get("BSI_RADICE", QUI.parent.parent.parent))
WORKER = QUI.parent / "worker" / "motore.mjs"


class MotoreNonDisponibile(RuntimeError):
    """Il processo Node non e' partito o non risponde."""


class Motore:
    def __init__(self, avvio_timeout: float = 60.0, richiesta_timeout: float = 60.0):
        self._lock = threading.Lock()
        self._proc: subprocess.Popen | None = None
        self._id = 0
        self._avvio_timeout = avvio_timeout
        self._richiesta_timeout = richiesta_timeout
        self.moduli: dict[str, str] = {}

    # ── ciclo di vita ────────────────────────────────────────────────────
    def _avvia(self) -> None:
        if not WORKER.exists():
            raise MotoreNonDisponibile(f"manca {WORKER}")
        self._proc = subprocess.Popen(
            ["node", str(WORKER)],
            stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            text=True, bufsize=1,
            env={**os.environ, "BSI_RADICE": str(RADICE)},
        )
        scadenza = time.time() + self._avvio_timeout
        while time.time() < scadenza:
            riga = self._proc.stdout.readline()
            if not riga:
                errore = (self._proc.stderr.read() or "")[-2000:]
                raise MotoreNonDisponibile(f"il motore non e' partito: {errore}")
            try:
                msg = json.loads(riga)
            except json.JSONDecodeError:
                continue
            if msg.get("pronto"):
                self.moduli = msg.get("moduli", {})
                return
        raise MotoreNonDisponibile("il motore non ha dichiarato di essere pronto")

    def _vivo(self) -> bool:
        return self._proc is not None and self._proc.poll() is None

    def chiudi(self) -> None:
        with self._lock:
            if self._proc:
                try:
                    self._proc.terminate()
                    self._proc.wait(timeout=5)
                except Exception:
                    self._proc.kill()
                self._proc = None

    # ── la richiesta ─────────────────────────────────────────────────────
    def chiedi(self, azione: str, **parametri: Any) -> Any:
        with self._lock:
            if not self._vivo():
                self._avvia()
            self._id += 1
            richiesta = {"id": self._id, "azione": azione, "parametri": parametri}
            assert self._proc and self._proc.stdin and self._proc.stdout
            try:
                self._proc.stdin.write(json.dumps(richiesta) + "\n")
                self._proc.stdin.flush()
            except (BrokenPipeError, ValueError) as e:
                self._proc = None
                raise MotoreNonDisponibile(f"il motore ha chiuso la comunicazione: {e}")

            scadenza = time.time() + self._richiesta_timeout
            while time.time() < scadenza:
                riga = self._proc.stdout.readline()
                if not riga:
                    self._proc = None
                    raise MotoreNonDisponibile("il motore e' morto durante la richiesta")
                try:
                    msg = json.loads(riga)
                except json.JSONDecodeError:
                    continue
                if msg.get("id") != self._id:
                    continue        # un messaggio di servizio, non la risposta
                if "errore" in msg:
                    raise MotoreNonDisponibile(msg["errore"])
                return msg.get("risultato")
            raise MotoreNonDisponibile("il motore non ha risposto in tempo")


motore = Motore()
