"""I vettori di significato.

Due strade, la stessa interfaccia:

· `Incorporatore()` senza argomenti: un incorporatore LOCALE e deterministico
  (il «trucco dell'hashing» su parole e trigrammi di caratteri, pesi
  sublineari, norma unitaria). Non capisce i sinonimi come un modello neurale,
  ma lavora senza rete, senza chiavi e senza dipendenze, e riconosce bene le
  parole rare di un dominio tecnico (nomi di molecole, sigle, formule), che e'
  cio' che serve a una memoria di chimica. E' anche cio' che rende i test
  ripetibili.

· `Incorporatore(funzione=..., nome=...)`: un modello vero, locale o remoto.
  `funzione` riceve una lista di testi e restituisce una lista di vettori.
  Esempi pronti: `con_sentence_transformers()` (locale, sul mini-PC) e
  `con_http()` (un servizio /embeddings compatibile).

Il nome del modello si salva accanto a ogni vettore: cambiando incorporatore i
vettori vecchi si riconoscono e si rifanno (`cura.reincorpora`), invece di
confrontare in silenzio vettori di spazi diversi.
"""
from __future__ import annotations

import hashlib
import json
import math
import re
import struct
import unicodedata
import urllib.request
from typing import Callable, Sequence

DIM_LOCALE = 768
_PAROLA = re.compile(r"[0-9a-zà-öø-ÿ₀-₉⁰-⁹]+", re.IGNORECASE)
_VUOTE = frozenset("""a ad al alla alle agli allo ai anche che chi ci con cui da dal dalla dei del della delle degli dello di e ed gli ho ha hai
i il in io la le lo ma mi nel nella non o per piu se si sono su tra fra un una uno the of and to is are was in on for with it this that""".split())


def _normalizza(testo: str) -> str:
    return unicodedata.normalize("NFKC", testo or "").lower()


def _indice(chiave: str, dim: int) -> tuple[int, float]:
    h = hashlib.blake2b(chiave.encode("utf-8"), digest_size=8).digest()
    n = int.from_bytes(h, "little")
    return n % dim, (1.0 if (n >> 63) & 1 else -1.0)


def incorpora_locale(testo: str, dim: int = DIM_LOCALE) -> list[float]:
    """Parole (peso 1), coppie di parole (0,6) e trigrammi di caratteri (0,35), con segno casuale ma fisso."""
    t = _normalizza(testo)
    parole = [p for p in _PAROLA.findall(t) if p not in _VUOTE]
    conti: dict[tuple[str, float], int] = {}
    for p in parole:
        conti[("p:" + p, 1.0)] = conti.get(("p:" + p, 1.0), 0) + 1
        if len(p) >= 4:
            q = "^" + p + "$"
            for i in range(len(q) - 2):
                k = ("c:" + q[i:i + 3], 0.35)
                conti[k] = conti.get(k, 0) + 1
    for a, b in zip(parole, parole[1:]):
        k = ("b:" + a + " " + b, 0.6)
        conti[k] = conti.get(k, 0) + 1
    v = [0.0] * dim
    for (chiave, peso), n in conti.items():
        i, segno = _indice(chiave, dim)
        v[i] += segno * peso * (1.0 + math.log(n))
    norma = math.sqrt(sum(x * x for x in v))
    return [x / norma for x in v] if norma > 0 else v


class Incorporatore:
    def __init__(self, funzione: Callable[[Sequence[str]], list[list[float]]] | None = None, nome: str | None = None):
        self._f = funzione
        self.nome = nome or ("locale-hash-768" if funzione is None else "esterno")
        self._cache: dict[str, list[float]] = {}

    def incorpora(self, testo: str) -> list[float]:
        return self.incorpora_molti([testo])[0]

    def incorpora_molti(self, testi: Sequence[str]) -> list[list[float]]:
        mancanti = [t for t in dict.fromkeys(testi) if t not in self._cache]
        if mancanti:
            nuovi = [incorpora_locale(t) for t in mancanti] if self._f is None else [_unitario(v) for v in self._f(mancanti)]
            for t, v in zip(mancanti, nuovi):
                self._cache[t] = v
            if len(self._cache) > 4096:  # la cache non cresce senza limite
                for k in list(self._cache)[:1024]:
                    del self._cache[k]
        return [self._cache[t] for t in testi]


def _unitario(v: Sequence[float]) -> list[float]:
    n = math.sqrt(sum(x * x for x in v))
    return [x / n for x in v] if n > 0 else list(v)


def coseno(a: Sequence[float], b: Sequence[float]) -> float:
    """Prodotto scalare: i vettori sono gia' a norma 1. Dimensioni diverse (modelli diversi) → 0, non un errore silenzioso."""
    if len(a) != len(b):
        return 0.0
    return sum(x * y for x, y in zip(a, b))


def impacchetta(v: Sequence[float]) -> bytes:
    return struct.pack(f"<{len(v)}f", *v)


def spacchetta(b: bytes) -> list[float]:
    return list(struct.unpack(f"<{len(b) // 4}f", b))


# ── incorporatori veri, pronti all'uso ──────────────────────────────────────
def con_sentence_transformers(modello: str = "intfloat/multilingual-e5-small") -> Incorporatore:
    """Un modello multilingue che gira sul mini-PC (pip install sentence-transformers). ~120 MB, niente rete dopo il primo avvio."""
    from sentence_transformers import SentenceTransformer  # importato qui: e' una dipendenza facoltativa
    m = SentenceTransformer(modello)
    return Incorporatore(lambda testi: [list(map(float, v)) for v in m.encode(list(testi), normalize_embeddings=True)], nome=modello)


def con_http(url: str, modello: str, chiave: str | None = None, attesa: float = 30.0) -> Incorporatore:
    """Un servizio che parla il protocollo /embeddings (Ollama, llama.cpp, vLLM, o un fornitore). La chiave non si scrive nel codice."""
    def chiama(testi: Sequence[str]) -> list[list[float]]:
        corpo = json.dumps({"model": modello, "input": list(testi)}).encode()
        intest = {"Content-Type": "application/json"}
        if chiave:
            intest["Authorization"] = "Bearer " + chiave
        with urllib.request.urlopen(urllib.request.Request(url, corpo, intest), timeout=attesa) as r:
            dati = json.load(r)
        return [d["embedding"] for d in sorted(dati["data"], key=lambda d: d.get("index", 0))]
    return Incorporatore(chiama, nome=modello)
