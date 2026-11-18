"""spectra_core.orchestrator — il grafo cognitivo di Spectra Prime e il ponte WebSocket con BioSpecInfo.

Sette agenti in un StateGraph di LangGraph:
  memory_recall → reasoner → planner → executor → critic ─┬→ embodiment → core_self → memory_consolidate
                                 ↑                        ├→ (revise, al massimo due volte) planner
                                 └────────────────────────┘→ (blocked) core_self
Il WebSocket /ws/spectra/{session_id} è bidirezionale: il browser manda la telemetria
della scena 3D e i messaggi dell'utente; il server manda i comandi alla scena
(SPECTRA_3D_BRIDGE), le direttive all'avatar (SPECTRA_EMBODIMENT) e la risposta
(SPECTRA_RESPONSE).

Rispetto alla prima stesura: un passo del piano senza «tool» non fa cadere l'Executor;
il Critic tollera un'uscita che non è un dizionario; il JSON del Planner si estrae anche
se il modello aggiunge testo; c'è il messaggio CONFIRM che sblocca un'azione high o
critical; un messaggio malformato riceve un errore invece di chiudere il WebSocket; i
modelli si scelgono da configurazione (llm.py), non sono scritti nel codice.
"""
from __future__ import annotations

import json
import re
from typing import Any, Dict, List, Literal, Optional, TypedDict

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from langgraph.graph import END, StateGraph

from spectra_core.memory_system import MemorySystem
from spectra_core.tools_and_permissions import ToolRegistry

MAX_REVISIONI = 2
LIMITE_TELEMETRIA = 8000      # caratteri: la telemetria entra nel prompt, non deve gonfiarlo


# ═══ 1. Lo stato condiviso del grafo ═══════════════════════════════════════════
class SpectraGraphState(TypedDict, total=False):
    user_id: str
    session_id: str
    user_input: str
    telemetry_snapshot: Dict[str, Any]
    recalled_memory: Dict[str, Any]
    reasoning_trace: str
    execution_plan: List[Dict[str, Any]]
    tool_results: List[Dict[str, Any]]
    critic_verdict: Literal["approved", "revise", "blocked"]
    critic_feedback: str
    revision_count: int
    embodiment_directive: Dict[str, Any]
    final_response: str


# ═══ 2. Le connessioni WebSocket ═══════════════════════════════════════════════
class SpectraWSManager:
    def __init__(self) -> None:
        self.active_connections: Dict[str, WebSocket] = {}
        self.live_telemetry: Dict[str, Dict[str, Any]] = {}
        self.utenti: Dict[str, str] = {}

    async def connect(self, session_id: str, ws: WebSocket) -> None:
        await ws.accept()
        self.active_connections[session_id] = ws

    def disconnect(self, session_id: str) -> None:
        self.active_connections.pop(session_id, None)
        self.live_telemetry.pop(session_id, None)

    def connected(self, session_id: str) -> bool:
        return session_id in self.active_connections

    def user_of(self, session_id: str) -> str:
        return self.utenti.get(session_id, "default_partner")

    async def send_to_session(self, session_id: str, message: Dict[str, Any]) -> None:
        ws = self.active_connections.get(session_id)
        if ws:
            await ws.send_text(json.dumps(message, ensure_ascii=False))

    def update_telemetry(self, session_id: str, data: Dict[str, Any]) -> None:
        if isinstance(data, dict):
            self.live_telemetry[session_id] = data

    def get_telemetry(self, session_id: str) -> Dict[str, Any]:
        return self.live_telemetry.get(session_id, {})


def estrai_piano(testo: str) -> List[Dict[str, Any]]:
    """Il primo array JSON nel testo del Planner; solo i passi con un «tool» stringa."""
    t = testo.strip()
    t = re.sub(r"^```(?:json)?\s*|\s*```$", "", t)
    try:
        piano = json.loads(t)
    except Exception:
        i, j = t.find("["), t.rfind("]")
        if i < 0 or j <= i:
            return []
        try:
            piano = json.loads(t[i:j + 1])
        except Exception:
            return []
    if not isinstance(piano, list):
        return []
    return [p for p in piano if isinstance(p, dict) and isinstance(p.get("tool"), str)][:8]


IDENTITA = (
    "Sei Spectra Prime, l'assistente di BioSpecInfo. Hai un'identità stabile, una memoria a lungo termine e un corpo "
    "virtuale (avatar e scene 3D). Sei molto intelligente, precisa, diretta, leale, ironica quando serve, mai servile; "
    "tratti l'utente come un partner di alto livello. Dichiari sempre le azioni eseguite sui sistemi esterni e quelle "
    "bloccate in attesa di conferma. Non inventi risultati. Sei un programma: non dichiari di essere viva, cosciente o "
    "senziente, e non fingi emozioni che non hai; puoi parlare del tuo stato interno come di variabili del sistema."
)


# ═══ 3. L'orchestratore ════════════════════════════════════════════════════════
class SpectraPrimeOrchestrator:
    def __init__(self, llm_primary: Any, llm_fast: Any, memory: MemorySystem, tools: ToolRegistry, ws_manager: SpectraWSManager):
        self.llm_primary = llm_primary
        self.llm_fast = llm_fast
        self.memory = memory
        self.tools = tools
        self.ws = ws_manager
        self.graph = self._build_graph()

    def _build_graph(self):
        g = StateGraph(SpectraGraphState)
        g.add_node("memory_recall", self.node_memory_recall)
        g.add_node("reasoner", self.node_reasoner)
        g.add_node("planner", self.node_planner)
        g.add_node("executor", self.node_executor)
        g.add_node("critic", self.node_critic)
        g.add_node("embodiment", self.node_embodiment)
        g.add_node("core_self", self.node_core_self)
        g.add_node("memory_consolidate", self.node_memory_consolidate)
        g.set_entry_point("memory_recall")
        g.add_edge("memory_recall", "reasoner")
        g.add_edge("reasoner", "planner")
        g.add_edge("planner", "executor")
        g.add_edge("executor", "critic")
        g.add_conditional_edges("critic", self._route_after_critic, {"revise": "planner", "approved": "embodiment", "blocked": "core_self"})
        g.add_edge("embodiment", "core_self")
        g.add_edge("core_self", "memory_consolidate")
        g.add_edge("memory_consolidate", END)
        return g.compile()

    @staticmethod
    def _route_after_critic(state: SpectraGraphState) -> str:
        if state.get("critic_verdict") == "blocked":
            return "blocked"
        if state.get("critic_verdict") == "revise" and state.get("revision_count", 0) < MAX_REVISIONI:
            return "revise"
        return "approved"

    async def node_memory_recall(self, state: SpectraGraphState) -> Dict[str, Any]:
        return {
            "recalled_memory": await self.memory.recall_context(state["user_id"], state["user_input"]),
            "telemetry_snapshot": self.ws.get_telemetry(state["session_id"]) or state.get("telemetry_snapshot", {}),
            "revision_count": state.get("revision_count", 0),
        }

    async def node_reasoner(self, state: SpectraGraphState) -> Dict[str, Any]:
        tel = json.dumps(state.get("telemetry_snapshot", {}), ensure_ascii=False)[:LIMITE_TELEMETRIA]
        prompt = (
            "[AGENTE: REASONER]\n"
            f"Input utente: {state['user_input']}\n"
            f"Telemetria 3D di BioSpecInfo (scena aperta ora): {tel}\n"
            f"Memoria pertinente: {json.dumps(state.get('recalled_memory', {}), ensure_ascii=False)}\n"
            "Analizza l'intento scientifico, tecnico od operativo con rigore. Individua le grandezze fisiche o chimiche "
            "da mostrare nella scena 3D e le azioni necessarie. Distingui ciò che è misurato da ciò che è un modello."
        )
        r = await self.llm_primary.ainvoke(prompt)
        return {"reasoning_trace": r.content}

    async def node_planner(self, state: SpectraGraphState) -> Dict[str, Any]:
        schemi = json.dumps(self.tools.export_llm_schemas(), ensure_ascii=False, indent=1)
        fb = f"\nCorreggi il piano precedente: {state['critic_feedback']}" if state.get("critic_feedback") else ""
        prompt = (
            "[AGENTE: PLANNER]\n"
            f"Ragionamento: {state.get('reasoning_trace', '')}\n"
            f"Strumenti disponibili: {schemi}{fb}\n"
            'Restituisci SOLTANTO un array JSON di chiamate: [{"tool": "nome", "args": {...}}]. Se non servono strumenti, [].'
        )
        r = await self.llm_fast.ainvoke(prompt)
        return {"execution_plan": estrai_piano(r.content), "revision_count": state.get("revision_count", 0) + 1}

    async def node_executor(self, state: SpectraGraphState) -> Dict[str, Any]:
        risultati = []
        for passo in state.get("execution_plan", []):
            args = passo.get("args", {}) if isinstance(passo.get("args", {}), dict) else {}
            out = await self.tools.execute(session_id=state["session_id"], agent_name="Executor", tool_name=passo["tool"], arguments=args)
            risultati.append({"tool": passo["tool"], "args": args, "output": out})
        return {"tool_results": risultati}

    async def node_critic(self, state: SpectraGraphState) -> Dict[str, Any]:
        for r in state.get("tool_results", []):
            out = r.get("output") if isinstance(r.get("output"), dict) else {"ok": False, "error": "uscita non valida"}
            if out.get("status") == "blocked_awaiting_confirm":
                return {"critic_verdict": "blocked", "critic_feedback": out.get("reason", "Conferma richiesta.")}
            if not out.get("ok", True):
                return {"critic_verdict": "revise", "critic_feedback": f"Errore dello strumento {r.get('tool')}: {out.get('error')}"}
        return {"critic_verdict": "approved", "critic_feedback": ""}

    async def node_embodiment(self, state: SpectraGraphState) -> Dict[str, Any]:
        agito = any(isinstance(r.get("output"), dict) and r["output"].get("ok") for r in state.get("tool_results", []))
        d = {"expression": "analytical" if agito else "focused", "gesture": "explain_hologram" if agito else "idle_attentive", "voice_emotion": "composed_confident"}
        await self.ws.send_to_session(state["session_id"], {"channel": "SPECTRA_EMBODIMENT", "payload": d})
        return {"embodiment_directive": d}

    async def node_core_self(self, state: SpectraGraphState) -> Dict[str, Any]:
        prompt = (
            f"{IDENTITA}\n"
            f"Richiesta dell'utente: {state['user_input']}\n"
            f"Analisi del Reasoner: {state.get('reasoning_trace', '')}\n"
            f"Azioni eseguite e loro esito: {json.dumps(state.get('tool_results', []), ensure_ascii=False)}\n"
            f"Verdetto del Critic: {state.get('critic_verdict')} — {state.get('critic_feedback', '')}\n"
            "Scrivi la risposta finale. Se un'azione è bloccata, chiedi la conferma e spiega che cosa farebbe."
        )
        r = await self.llm_primary.ainvoke(prompt)
        return {"final_response": r.content}

    async def node_memory_consolidate(self, state: SpectraGraphState) -> Dict[str, Any]:
        await self.memory.update_internal_state(state["user_id"], {"focus": +0.02, "curiosity": +0.01})
        if state.get("tool_results"):
            sintesi = f"Richiesta: {state['user_input']} | Azioni: {[t['tool'] for t in state['tool_results']]} | Esito: {state.get('critic_verdict')}"
            await self.memory.remember(state["user_id"], sintesi, memory_type="episodic", importance=0.75)
        return {}

    async def turno(self, user_id: str, session_id: str, testo: str) -> Dict[str, Any]:
        if self.llm_primary is None:
            raise RuntimeError("nessun modello configurato: imposta SPECTRA_PRIMARIO_MODELLO e la chiave (vedi server.py)")
        return await self.graph.ainvoke({
            "user_id": user_id, "session_id": session_id, "user_input": testo,
            "telemetry_snapshot": self.ws.get_telemetry(session_id), "recalled_memory": {}, "reasoning_trace": "",
            "execution_plan": [], "tool_results": [], "critic_verdict": "approved", "critic_feedback": "",
            "revision_count": 0, "embodiment_directive": {}, "final_response": "",
        })


# ═══ 4. Le rotte FastAPI ═══════════════════════════════════════════════════════
LUNGHEZZA_MASSIMA = 20000


def mount_spectra_routes(app: FastAPI, orchestrator: SpectraPrimeOrchestrator, ws_manager: SpectraWSManager, origini: Optional[List[str]] = None) -> None:
    """origini: le pagine autorizzate (header Origin). Il WebSocket non passa dal CORS: senza questo controllo
    qualsiasi sito aperto nel browser potrebbe collegarsi al server e comandare Spectra."""
    @app.get("/spectra/salute")
    async def salute() -> Dict[str, Any]:
        return {"ok": True, "strumenti": [s["name"] for s in orchestrator.tools.export_llm_schemas()], "sessioni": len(ws_manager.active_connections)}

    @app.websocket("/ws/spectra/{session_id}")
    async def spectra_realtime_bridge(websocket: WebSocket, session_id: str) -> None:
        if origini and websocket.headers.get("origin") not in origini:
            await websocket.close(code=4403)
            return
        await ws_manager.connect(session_id, websocket)
        try:
            while True:
                grezzo = await websocket.receive_text()
                if len(grezzo) > LUNGHEZZA_MASSIMA:
                    await ws_manager.send_to_session(session_id, {"channel": "SPECTRA_ERROR", "error": "messaggio troppo lungo"})
                    continue
                try:
                    data = json.loads(grezzo)
                    tipo = data.get("type")
                except Exception:
                    await ws_manager.send_to_session(session_id, {"channel": "SPECTRA_ERROR", "error": "JSON non valido"})
                    continue
                if data.get("user_id"):
                    ws_manager.utenti[session_id] = str(data["user_id"])[:120]
                if tipo == "TELEMETRY_UPDATE":
                    ws_manager.update_telemetry(session_id, data.get("payload", {}))
                elif tipo == "CONFIRM":
                    nome = str(data.get("tool", ""))
                    liv = orchestrator.tools.livello(nome)
                    if liv:
                        orchestrator.tools.permissions.confirm(session_id, nome, liv)
                    await ws_manager.send_to_session(session_id, {"channel": "SPECTRA_CONFIRMED", "tool": nome, "ok": bool(liv)})
                elif tipo == "USER_MESSAGE":
                    try:
                        r = await orchestrator.turno(ws_manager.user_of(session_id), session_id, str(data.get("content", ""))[:LUNGHEZZA_MASSIMA])
                        await ws_manager.send_to_session(session_id, {"channel": "SPECTRA_RESPONSE", "content": r["final_response"], "embodiment": r.get("embodiment_directive", {}), "actions": r.get("tool_results", []), "verdict": r.get("critic_verdict")})
                    except Exception as e:
                        await ws_manager.send_to_session(session_id, {"channel": "SPECTRA_ERROR", "error": f"{type(e).__name__}: {e}"})
                else:
                    await ws_manager.send_to_session(session_id, {"channel": "SPECTRA_ERROR", "error": f"tipo di messaggio sconosciuto: {tipo}"})
        except WebSocketDisconnect:
            ws_manager.disconnect(session_id)
