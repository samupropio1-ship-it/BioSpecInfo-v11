"""Test di Spectra Prime con modelli finti: il grafo, i permessi, la memoria e il WebSocket.

    python -m pytest spectra_core/tests -q
"""
import asyncio
import json

import pytest
from fastapi.testclient import TestClient

from spectra_core.llm import FintoLLM
from spectra_core.memory_system import MemorySystem
from spectra_core.orchestrator import SpectraPrimeOrchestrator, SpectraWSManager, estrai_piano
from spectra_core.server import crea_app
from spectra_core.tools_and_permissions import ToolRegistry, strumenti_predefiniti


def esegui(c):
    return asyncio.run(c)


def piano_e_risposta(piani):
    """Primario: Reasoner e Core Self; veloce: Planner con i piani in ordine."""
    piani = list(piani)
    def primario(p):
        if "[AGENTE: REASONER]" in p:
            return "Serve la scena dell'eliosfera."
        return "Fatto: ho aperto la scena. [" + ("BLOCCATO" if "blocked" in p.split("Verdetto del Critic:")[-1][:20] else "OK") + "]"
    def veloce(p):
        return piani.pop(0) if piani else "[]"
    return FintoLLM(primario), FintoLLM(veloce)


# ── unità ──────────────────────────────────────────────────────────────────
def test_estrai_piano_tollera_testo_e_recinti():
    assert estrai_piano('```json\n[{"tool": "recall", "args": {"query": "x"}}]\n```') == [{"tool": "recall", "args": {"query": "x"}}]
    assert estrai_piano('Ecco il piano: [{"tool": "a"}, {"x": 1}, "no"] spero vada') == [{"tool": "a"}]
    assert estrai_piano("non è JSON") == []
    assert estrai_piano('{"tool": "a"}') == []


def test_memoria_richiamo_stato_e_duplicati(tmp_path):
    m = MemorySystem(str(tmp_path / "m.sqlite"))
    a = esegui(m.remember("u", "Preferisce la spettroscopia infrarossa", "procedural", 0.8))
    b = esegui(m.remember("u", "Preferisce la spettroscopia infrarossa", "procedural", 0.9))
    assert a == b
    esegui(m.remember("u", "Esame di chimica organica a febbraio", "episodic", 0.5))
    esegui(m.remember("altro", "spettroscopia di un altro utente", "semantic", 1.0))
    r = esegui(m.recall("u", "spettroscopia infrarossa"))
    assert [x["text"] for x in r] == ["Preferisce la spettroscopia infrarossa"] and r[0]["importance"] == 0.9
    s = esegui(m.update_internal_state("u", {"focus": 0.7, "fatigue": -1}))
    assert s["focus"] == 1.0 and s["fatigue"] == 0.0
    # persiste su disco
    m2 = MemorySystem(str(tmp_path / "m.sqlite"))
    assert esegui(m2.internal_state("u"))["focus"] == 1.0
    with pytest.raises(ValueError):
        esegui(m.remember("u", "x", "inventato"))


def test_permessi_quattro_livelli():
    reg = ToolRegistry()
    async def g(session_id, **k):
        return "fatto"
    for liv in ("low", "medium", "high", "critical"):
        reg.register(liv, liv, {"type": "object", "properties": {}}, liv, g)
    assert esegui(reg.execute("s", "t", "low", {}))["ok"]
    assert esegui(reg.execute("s", "t", "medium", {}))["ok"]
    h = esegui(reg.execute("s", "t", "high", {}))
    assert h["status"] == "blocked_awaiting_confirm" and not h["ok"]
    reg.permissions.confirm("s", "high", "high")
    assert esegui(reg.execute("s", "t", "high", {}))["ok"] and esegui(reg.execute("s", "t", "high", {}))["ok"]   # vale per la sessione
    assert not esegui(reg.execute("altra", "t", "high", {}))["ok"]                                             # non per un'altra
    reg.permissions.confirm("s", "critical", "critical")
    assert esegui(reg.execute("s", "t", "critical", {}))["ok"]
    assert esegui(reg.execute("s", "t", "critical", {}))["status"] == "blocked_awaiting_confirm"             # una volta sola
    assert len(reg.log) == 8


def test_validazione_degli_argomenti():
    ws, m = SpectraWSManager(), MemorySystem()
    reg = strumenti_predefiniti(ToolRegistry(), ws, m)
    assert "manca" in esegui(reg.execute("s", "t", "biospec_3d_load", {}))["error"]
    assert "fra" in esegui(reg.execute("s", "t", "biospec_3d_load", {"sceneType": "cucina"}))["error"]
    assert "sconosciuto" in esegui(reg.execute("s", "t", "biospec_3d_load", {"sceneType": "eliosfera", "rm": "-rf"}))["error"]
    assert "tipo" in esegui(reg.execute("s", "t", "biospec_3d_toggle_layer", {"layerName": "x", "visible": "sì"}))["error"]
    assert "nessun BioSpecInfo" in esegui(reg.execute("s", "t", "biospec_3d_load", {"sceneType": "eliosfera"}))["error"]
    assert "sconosciuto" in esegui(reg.execute("s", "t", "rm_rf", {}))["error"]


# ── il grafo attraverso il WebSocket ───────────────────────────────────────
def app_con(piani, memoria=None):
    p, v = piano_e_risposta(piani)
    return crea_app(p, v, memoria or MemorySystem()), p, v


def ricevi_fino(ws, canale, n=20):
    visti = []
    for _ in range(n):
        m = json.loads(ws.receive_text())
        visti.append(m)
        if m.get("channel") == canale:
            return m, visti
    raise AssertionError("canale non arrivato: " + canale)


def test_turno_completo_comanda_la_scena_e_risponde():
    app, primario, _ = app_con(['[{"tool": "biospec_3d_load", "args": {"sceneType": "eliosfera", "params": {"Forma": 1}}}, {"tool": "set_expression", "args": {"expression": "analytical"}}]'])
    with TestClient(app) as c, c.websocket_connect("/ws/spectra/sess1") as ws:
        ws.send_text(json.dumps({"type": "TELEMETRY_UPDATE", "user_id": "samu", "payload": {"sezione": "sastroelio", "camera": {"r": 42}}}))
        ws.send_text(json.dumps({"type": "USER_MESSAGE", "user_id": "samu", "content": "Mostrami l'eliosfera"}))
        r, visti = ricevi_fino(ws, "SPECTRA_RESPONSE")
    canali = [m["channel"] for m in visti]
    assert canali[0] == "SPECTRA_3D_BRIDGE" and visti[0]["payload"] == {"action": "load", "sceneType": "eliosfera", "params": {"Forma": 1}}
    assert "SPECTRA_EMBODIMENT" in canali
    assert r["verdict"] == "approved" and r["content"].endswith("[OK]") and [a["tool"] for a in r["actions"]] == ["biospec_3d_load", "set_expression"]
    assert '"sastroelio"' in primario.prompt[0]        # il Reasoner vede la telemetria della scena
    assert "non dichiari di essere viva, cosciente o senziente" in primario.prompt[-1]
    ricordi = esegui(app.state.memoria.recall("samu", "eliosfera"))
    assert ricordi and "biospec_3d_load" in ricordi[0]["text"]


def test_errore_dello_strumento_rivede_il_piano_al_massimo_due_volte():
    app, _, veloce = app_con(['[{"tool": "biospec_3d_load", "args": {"sceneType": "cucina"}}]'] * 5)
    with TestClient(app) as c, c.websocket_connect("/ws/spectra/s2") as ws:
        ws.send_text(json.dumps({"type": "USER_MESSAGE", "content": "apri la cucina"}))
        r, _ = ricevi_fino(ws, "SPECTRA_RESPONSE")
    assert len(veloce.prompt) == 2                        # due piani, poi si risponde comunque
    assert "Correggi il piano precedente" in veloce.prompt[1]
    assert not r["actions"][0]["output"]["ok"]


def test_azione_bloccata_chiede_conferma_e_conferma_sblocca():
    async def chiama(session_id, url):
        return {"status": 200}
    app, _, _ = app_con(['[{"tool": "api_request", "args": {"url": "https://example.org"}}]', '[{"tool": "api_request", "args": {"url": "https://example.org"}}]'])
    app.state.orchestratore.tools.register("api_request", "GET verso un indirizzo esterno", {"type": "object", "properties": {"url": {"type": "string"}}, "required": ["url"]}, "high", chiama)
    with TestClient(app) as c, c.websocket_connect("/ws/spectra/s3") as ws:
        ws.send_text(json.dumps({"type": "USER_MESSAGE", "content": "chiama example.org"}))
        r, visti = ricevi_fino(ws, "SPECTRA_RESPONSE")
        assert r["verdict"] == "blocked" and r["content"].endswith("[BLOCCATO]")
        assert "SPECTRA_EMBODIMENT" not in [m["channel"] for m in visti]       # bloccato: si salta l'embodiment
        ws.send_text(json.dumps({"type": "CONFIRM", "tool": "api_request"}))
        assert json.loads(ws.receive_text()) == {"channel": "SPECTRA_CONFIRMED", "tool": "api_request", "ok": True}
        ws.send_text(json.dumps({"type": "USER_MESSAGE", "content": "ora sì"}))
        r2, _ = ricevi_fino(ws, "SPECTRA_RESPONSE")
    assert r2["verdict"] == "approved" and r2["actions"][0]["output"] == {"ok": True, "result": {"status": 200}}


def test_messaggi_malformati_non_chiudono_il_ponte():
    app, _, _ = app_con(["[]"])
    with TestClient(app) as c, c.websocket_connect("/ws/spectra/s4") as ws:
        ws.send_text("{non json")
        assert json.loads(ws.receive_text())["error"] == "JSON non valido"
        ws.send_text(json.dumps({"type": "BOH"}))
        assert "sconosciuto" in json.loads(ws.receive_text())["error"]
        ws.send_text("x" * 30000)
        assert "troppo lungo" in json.loads(ws.receive_text())["error"]
        ws.send_text(json.dumps({"type": "USER_MESSAGE", "content": "ciao"}))
        r, _ = ricevi_fino(ws, "SPECTRA_RESPONSE")
        assert r["actions"] == []


def test_origine_non_autorizzata_rifiutata(monkeypatch):
    monkeypatch.setenv("SPECTRA_ORIGINI", "https://samupropio1-ship-it.github.io")
    app, _, _ = app_con(["[]"])
    with TestClient(app) as c:
        with pytest.raises(Exception):
            with c.websocket_connect("/ws/spectra/x", headers={"origin": "https://sito-maligno.example"}) as ws:
                ws.receive_text()
        with c.websocket_connect("/ws/spectra/y", headers={"origin": "https://samupropio1-ship-it.github.io"}) as ws:
            ws.send_text(json.dumps({"type": "USER_MESSAGE", "content": "ciao"}))
            assert ricevi_fino(ws, "SPECTRA_RESPONSE")[0]["verdict"] == "approved"


def test_senza_modello_lo_dice():
    app = crea_app(None, None, MemorySystem())
    with TestClient(app) as c, c.websocket_connect("/ws/spectra/z") as ws:
        ws.send_text(json.dumps({"type": "USER_MESSAGE", "content": "ciao"}))
        m = json.loads(ws.receive_text())
        assert m["channel"] == "SPECTRA_ERROR" and "nessun modello configurato" in m["error"]
