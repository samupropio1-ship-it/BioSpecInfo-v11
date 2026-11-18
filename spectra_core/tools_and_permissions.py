"""spectra_core.tools_and_permissions — gli strumenti di Spectra Prime e i loro permessi.

Ogni strumento ha un livello:
  low       eseguito subito (leggere, muovere la scena 3D, cambiare espressione);
  medium    eseguito subito e registrato (scrivere nella memoria);
  high      bloccato finché l'utente non conferma per questa sessione (rete esterna);
  critical  bloccato e la conferma vale UNA volta sola (dispositivi fisici, codice).

Un'azione bloccata restituisce {"ok": False, "status": "blocked_awaiting_confirm",
"reason": ...}: il Critic dell'orchestratore la riconosce e la risposta finale chiede la
conferma invece di fingere di aver agito. Ogni chiamata finisce nel registro delle azioni.

Gli argomenti si controllano contro lo schema (campi obbligatori e tipi) prima di
eseguire: il piano viene da un modello linguistico e va trattato come input esterno.
"""
from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Any, Awaitable, Callable, Dict, List, Optional, Set, Tuple

LIVELLI = ("low", "medium", "high", "critical")
TIPI_JSON = {"string": str, "number": (int, float), "integer": int, "boolean": bool, "object": dict, "array": list}

Gestore = Callable[..., Awaitable[Any]]


@dataclass
class Strumento:
    nome: str
    descrizione: str
    parametri: Dict[str, Any]
    livello: str
    gestore: Gestore


class PermissionManager:
    def __init__(self) -> None:
        self._sessione: Set[Tuple[str, str]] = set()      # conferme «high», valgono per la sessione
        self._una_volta: Set[Tuple[str, str]] = set()     # conferme «critical», si consumano

    def confirm(self, session_id: str, tool_name: str, livello: str) -> None:
        (self._una_volta if livello == "critical" else self._sessione).add((session_id, tool_name))

    def revoke(self, session_id: str) -> None:
        self._sessione = {x for x in self._sessione if x[0] != session_id}
        self._una_volta = {x for x in self._una_volta if x[0] != session_id}

    def check(self, session_id: str, tool_name: str, livello: str) -> Optional[str]:
        """None se si può eseguire, altrimenti il motivo del blocco."""
        if livello in ("low", "medium"):
            return None
        chiave = (session_id, tool_name)
        if livello == "high" and chiave in self._sessione:
            return None
        if livello == "critical" and chiave in self._una_volta:
            self._una_volta.discard(chiave)
            return None
        return f"«{tool_name}» è di livello {livello}: serve la conferma esplicita dell'utente prima di eseguirlo."


@dataclass
class ToolRegistry:
    permissions: PermissionManager = field(default_factory=PermissionManager)
    _strumenti: Dict[str, Strumento] = field(default_factory=dict)
    log: List[Dict[str, Any]] = field(default_factory=list)

    def register(self, nome: str, descrizione: str, parametri: Dict[str, Any], livello: str, gestore: Gestore) -> None:
        if livello not in LIVELLI:
            raise ValueError(f"livello sconosciuto: {livello}")
        self._strumenti[nome] = Strumento(nome, descrizione, parametri, livello, gestore)

    def livello(self, nome: str) -> Optional[str]:
        s = self._strumenti.get(nome)
        return s.livello if s else None

    def export_llm_schemas(self) -> List[Dict[str, Any]]:
        return [{"name": s.nome, "description": s.descrizione, "permission_level": s.livello, "input_schema": s.parametri} for s in self._strumenti.values()]

    def _valida(self, s: Strumento, args: Dict[str, Any]) -> Optional[str]:
        if not isinstance(args, dict):
            return "gli argomenti devono essere un oggetto"
        props = s.parametri.get("properties", {})
        for k in s.parametri.get("required", []):
            if k not in args:
                return f"manca l'argomento obbligatorio «{k}»"
        for k, v in args.items():
            if k not in props:
                return f"argomento sconosciuto «{k}»"
            atteso = TIPI_JSON.get(props[k].get("type", ""))
            if atteso and not isinstance(v, atteso) or (props[k].get("type") in ("number", "integer") and isinstance(v, bool)):
                return f"«{k}» deve essere di tipo {props[k].get('type')}"
            if "enum" in props[k] and v not in props[k]["enum"]:
                return f"«{k}» deve essere uno fra {props[k]['enum']}"
        return None

    async def execute(self, session_id: str, agent_name: str, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        voce = {"t": time.time(), "session_id": session_id, "agent": agent_name, "tool": tool_name, "args": arguments}
        s = self._strumenti.get(tool_name)
        if not s:
            out: Dict[str, Any] = {"ok": False, "error": f"strumento sconosciuto: {tool_name}"}
        else:
            errore = self._valida(s, arguments)
            blocco = None if errore else self.permissions.check(session_id, tool_name, s.livello)
            if errore:
                out = {"ok": False, "error": errore}
            elif blocco:
                out = {"ok": False, "status": "blocked_awaiting_confirm", "reason": blocco, "level": s.livello}
            else:
                try:
                    risultato = await s.gestore(session_id, **arguments)
                    out = {"ok": True, "result": risultato}
                except Exception as e:  # l'errore torna al Critic, che chiede una revisione del piano
                    out = {"ok": False, "error": f"{type(e).__name__}: {e}"}
        voce["output"] = out
        self.log.append(voce)
        return out


# ═══ Gli strumenti predefiniti ══════════════════════════════════════════════
SCENE_3D = ["orbitale", "eliosfera", "materia_oscura", "galassia", "spaziotempo", "buco_nero", "onde_gravitazionali", "cosmo", "sistema_solare", "molecola", "laboratorio_3d", "morse_h2", "magnetosfera", "reticolo"]


def strumenti_predefiniti(registro: ToolRegistry, ws_manager: Any, memory: Any) -> ToolRegistry:
    """Registra gli strumenti che agiscono su BioSpecInfo (scena 3D, espressione) e sulla memoria.

    I comandi alla scena viaggiano sul canale SPECTRA_3D_BRIDGE del WebSocket: è il browser a
    eseguirli, con i suoi controlli. Strumenti verso il mondo esterno (domotica, robot, computer)
    si aggiungono con register() al livello «critical»: qui non ce ne sono, per non promettere
    azioni che nessun ponte saprebbe compiere.
    """
    async def invia(session_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        if not ws_manager.connected(session_id):
            raise RuntimeError("nessun BioSpecInfo collegato a questa sessione")
        await ws_manager.send_to_session(session_id, {"channel": "SPECTRA_3D_BRIDGE", "payload": payload})
        return {"sent": payload}

    async def carica(session_id: str, sceneType: str, params: Optional[Dict[str, Any]] = None) -> Any:
        return await invia(session_id, {"action": "load", "sceneType": sceneType, "params": params or {}})

    async def aggiorna(session_id: str, params: Dict[str, Any]) -> Any:
        return await invia(session_id, {"action": "update", "params": params})

    async def livello(session_id: str, layerName: str, visible: bool) -> Any:
        return await invia(session_id, {"action": "toggle_layer", "layerName": layerName, "visible": visible})

    async def fuoco(session_id: str, pos: List[float], target: Optional[List[float]] = None) -> Any:
        if len(pos) != 3 or (target is not None and len(target) != 3):
            raise ValueError("pos e target sono terne [x, y, z]")
        return await invia(session_id, {"action": "focus", "pos": pos, "target": target or [0, 0, 0]})

    async def espressione(session_id: str, expression: str) -> Any:
        await ws_manager.send_to_session(session_id, {"channel": "SPECTRA_EMBODIMENT", "payload": {"expression": expression}})
        return {"expression": expression}

    async def ricorda(session_id: str, text: str, memory_type: str = "semantic", importance: float = 0.6) -> Any:
        uid = ws_manager.user_of(session_id)
        return {"id": await memory.remember(uid, text, memory_type, importance)}

    async def richiama(session_id: str, query: str) -> Any:
        return await memory.recall(ws_manager.user_of(session_id), query, 5)

    registro.register("biospec_3d_load", "Apre in BioSpecInfo una scena 3D (sezione dell'app) con i parametri dati.",
                      {"type": "object", "properties": {"sceneType": {"type": "string", "enum": SCENE_3D}, "params": {"type": "object"}}, "required": ["sceneType"]}, "low", carica)
    registro.register("biospec_3d_update", "Cambia i cursori della scena 3D aperta (chiave = etichetta del cursore, valore = numero).",
                      {"type": "object", "properties": {"params": {"type": "object"}}, "required": ["params"]}, "low", aggiorna)
    registro.register("biospec_3d_toggle_layer", "Mostra o nasconde uno strato della scena 3D (una casella del pannello).",
                      {"type": "object", "properties": {"layerName": {"type": "string"}, "visible": {"type": "boolean"}}, "required": ["layerName", "visible"]}, "low", livello)
    registro.register("biospec_3d_focus", "Porta la camera della scena 3D in pos guardando target (coordinate della scena).",
                      {"type": "object", "properties": {"pos": {"type": "array"}, "target": {"type": "array"}}, "required": ["pos"]}, "low", fuoco)
    registro.register("set_expression", "Cambia l'espressione dell'avatar di Spectra.",
                      {"type": "object", "properties": {"expression": {"type": "string", "enum": ["focused", "analytical", "warm", "amused", "concerned", "neutral"]}}, "required": ["expression"]}, "low", espressione)
    registro.register("remember", "Salva un ricordo nella memoria a lungo termine.",
                      {"type": "object", "properties": {"text": {"type": "string"}, "memory_type": {"type": "string", "enum": ["episodic", "semantic", "procedural"]}, "importance": {"type": "number"}}, "required": ["text"]}, "medium", ricorda)
    registro.register("recall", "Cerca nella memoria a lungo termine.",
                      {"type": "object", "properties": {"query": {"type": "string"}}, "required": ["query"]}, "low", richiama)
    return registro
