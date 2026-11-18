"""spectra_core.llm — i modelli linguistici, scelti da configurazione.

L'orchestratore chiede solo un oggetto con `await ainvoke(prompt)` che restituisce
qualcosa con `.content`. Qui ci sono due adattatori senza dipendenze oltre httpx:
  · AnthropicLLM — API Messages;
  · OpenAICompatLLM — qualsiasi servizio compatibile con /chat/completions
    (Groq, OpenRouter, Fireworks, un server locale).
Il modello e la chiave vengono dalle variabili d'ambiente (vedi server.py): nessun nome
di modello è scritto qui, e le chiavi non finiscono mai nel repository.
FintoLLM serve ai test: risponde con testi prestabiliti o con una funzione.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, List, Optional, Union

import httpx


@dataclass
class Risposta:
    content: str


class AnthropicLLM:
    def __init__(self, modello: str, chiave: str, max_tokens: int = 2048, base: str = "https://api.anthropic.com"):
        if not modello or not chiave:
            raise ValueError("servono modello e chiave")
        self.modello, self.chiave, self.max_tokens, self.base = modello, chiave, max_tokens, base.rstrip("/")

    async def ainvoke(self, prompt: str) -> Risposta:
        async with httpx.AsyncClient(timeout=120) as c:
            r = await c.post(f"{self.base}/v1/messages", headers={"x-api-key": self.chiave, "anthropic-version": "2023-06-01", "content-type": "application/json"},
                             json={"model": self.modello, "max_tokens": self.max_tokens, "messages": [{"role": "user", "content": prompt}]})
            r.raise_for_status()
            d = r.json()
        return Risposta("".join(b.get("text", "") for b in d.get("content", []) if b.get("type") == "text"))


class OpenAICompatLLM:
    def __init__(self, modello: str, chiave: str, base: str, max_tokens: int = 1024):
        if not modello or not chiave or not base:
            raise ValueError("servono modello, chiave e indirizzo")
        self.modello, self.chiave, self.base, self.max_tokens = modello, chiave, base.rstrip("/"), max_tokens

    async def ainvoke(self, prompt: str) -> Risposta:
        async with httpx.AsyncClient(timeout=60) as c:
            r = await c.post(f"{self.base}/chat/completions", headers={"authorization": f"Bearer {self.chiave}"},
                             json={"model": self.modello, "max_tokens": self.max_tokens, "messages": [{"role": "user", "content": prompt}]})
            r.raise_for_status()
            d = r.json()
        return Risposta(d["choices"][0]["message"]["content"] or "")


class FintoLLM:
    """Per i test: una lista di risposte in ordine, oppure una funzione prompt → testo."""
    def __init__(self, risposte: Union[List[str], Callable[[str], str]]):
        self.risposte = risposte
        self.prompt: List[str] = []

    async def ainvoke(self, prompt: str) -> Risposta:
        self.prompt.append(prompt)
        if callable(self.risposte):
            return Risposta(self.risposte(prompt))
        return Risposta(self.risposte.pop(0) if self.risposte else "")
