"""spectra_core.server — l'applicazione FastAPI di Spectra Prime.

Avvio:
    pip install -r spectra_core/requirements.txt
    export SPECTRA_PRIMARIO=anthropic            # oppure openai_compat
    export SPECTRA_PRIMARIO_MODELLO=<modello>    # quello del fornitore scelto
    export ANTHROPIC_API_KEY=...                 # mai nel repository
    export SPECTRA_VELOCE_BASE=https://api.groq.com/openai/v1    # facoltativo: modello veloce per Planner
    export SPECTRA_VELOCE_MODELLO=<modello>  SPECTRA_VELOCE_CHIAVE=...
    export SPECTRA_MEMORIA=spectra.sqlite        # facoltativo, altrimenti in memoria
    export SPECTRA_ORIGINI=https://samupropio1-ship-it.github.io   # pagine autorizzate a collegarsi
    uvicorn spectra_core.server:app --host 0.0.0.0 --port 8000

In BioSpecInfo: ✨ → Spectra → Occhiali e dispositivi → «Spectra Prime», indirizzo
wss://<host>/ws/spectra (serve HTTPS: la pagina è su HTTPS e il browser rifiuta ws:// in chiaro,
tranne su localhost).
"""
from __future__ import annotations

import os
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from spectra_core.llm import AnthropicLLM, OpenAICompatLLM
from spectra_core.memory_system import MemorySystem
from spectra_core.orchestrator import SpectraPrimeOrchestrator, SpectraWSManager, mount_spectra_routes
from spectra_core.tools_and_permissions import ToolRegistry, strumenti_predefiniti


def _llm(prefisso: str) -> Any:
    tipo = os.environ.get(f"SPECTRA_{prefisso}", "anthropic" if prefisso == "PRIMARIO" else "")
    modello = os.environ.get(f"SPECTRA_{prefisso}_MODELLO", "")
    if not modello:
        return None
    if tipo == "anthropic":
        return AnthropicLLM(modello, os.environ.get("ANTHROPIC_API_KEY", ""))
    base = os.environ.get(f"SPECTRA_{prefisso}_BASE", "")
    if base:
        return OpenAICompatLLM(modello, os.environ.get(f"SPECTRA_{prefisso}_CHIAVE", ""), base)
    return None


def crea_app(llm_primario: Any = None, llm_veloce: Any = None, memoria: MemorySystem | None = None) -> FastAPI:
    app = FastAPI(title="Spectra Prime")
    origini = [o for o in os.environ.get("SPECTRA_ORIGINI", "").split(",") if o]
    if origini:
        app.add_middleware(CORSMiddleware, allow_origins=origini, allow_methods=["GET"], allow_headers=["*"])
    ws = SpectraWSManager()
    memoria = memoria or MemorySystem(os.environ.get("SPECTRA_MEMORIA", ":memory:"))
    registro = strumenti_predefiniti(ToolRegistry(), ws, memoria)
    primario = llm_primario or _llm("PRIMARIO")
    orch = SpectraPrimeOrchestrator(primario, llm_veloce or _llm("VELOCE") or primario, memoria, registro, ws)
    app.state.orchestratore, app.state.ws, app.state.memoria = orch, ws, memoria
    mount_spectra_routes(app, orch, ws, origini or None)
    return app


app = crea_app()
