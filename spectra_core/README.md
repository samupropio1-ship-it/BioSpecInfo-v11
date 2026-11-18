# Spectra Prime — l'orchestratore multi-agente

Il cervello a sette agenti di Spectra, su **FastAPI + LangGraph**, collegato in
tempo reale alle scene 3D di BioSpecInfo con un **WebSocket bidirezionale**.

| | |
|---|---|
| Codice | `orchestrator.py` (grafo e WebSocket), `memory_system.py`, `tools_and_permissions.py`, `llm.py`, `server.py` |
| Lato browser | `bsi-spectra-ponte.js` nella radice dell'app (motore `BSIMotore3D` + ponte `BSISpectraPonte`) |
| Prove | `python -m pytest spectra_core/tests -q`: 10 test con modelli finti, senza rete e senza chiavi; il lato browser è provato da `tools/banchi/test_spectra_ponte.js` con un server finto |
| Avvio | `pip install -r spectra_core/requirements.txt`, poi le variabili d'ambiente di `server.py` e `uvicorn spectra_core.server:app` |

## Il grafo

```
memory_recall → reasoner → planner → executor → critic ─┬─ approved → embodiment → core_self → memory_consolidate → fine
                              ↑                          ├─ revise (al massimo 2 piani) ─┘
                              └──────────────────────────┴─ blocked → core_self (chiede conferma)
```

- **memory_recall** — ricordi pertinenti (episodici, semantici, procedurali), stato interno, telemetria della scena.
- **reasoner** — analisi dell'intento con la telemetria 3D davanti; distingue misure e modelli.
- **planner** — un array JSON di chiamate agli strumenti; si estrae anche se il modello aggiunge testo.
- **executor** — esegue con `ToolRegistry`: argomenti controllati contro lo schema, permessi, registro delle azioni.
- **critic** — un'azione bloccata porta a `blocked`; un errore a `revise` (nuovo piano con il motivo), al massimo due volte.
- **embodiment** — la direttiva all'avatar (`SPECTRA_EMBODIMENT`).
- **core_self** — la risposta finale con l'identità di Spectra. Spectra dichiara le azioni eseguite e quelle bloccate, non inventa risultati, e **non dichiara di essere viva, cosciente o senziente**: è la stessa regola di tutta l'app.
- **memory_consolidate** — stato interno e un ricordo episodico delle azioni.

## Il protocollo WebSocket — `/ws/spectra/{sessione}`

Dal browser al server:

| `type` | contenuto |
|---|---|
| `TELEMETRY_UPDATE` | `payload`: sezione, scheda, camera, cursori, caselle, menu della scena aperta (inviata solo quando cambia, più un battito ogni 5 s) |
| `USER_MESSAGE` | `content`: la richiesta; avvia un turno del grafo |
| `CONFIRM` | `tool`: sblocca un'azione `high` (per la sessione) o `critical` (una volta) |

Dal server al browser:

| `channel` | contenuto |
|---|---|
| `SPECTRA_3D_BRIDGE` | `payload.action` = `load` (`sceneType`, `params`), `update` (`params`), `toggle_layer` (`layerName`, `visible`), `focus` (`pos`, `target`) |
| `SPECTRA_EMBODIMENT` | espressione, gesto, tono di voce |
| `SPECTRA_RESPONSE` | `content`, `actions`, `verdict`, `embodiment` |
| `SPECTRA_CONFIRMED`, `SPECTRA_ERROR` | esito di una conferma; errore senza chiudere il collegamento |

`sceneType`: `orbitale`, `eliosfera`, `materia_oscura`, `galassia`, `spaziotempo`, `buco_nero`,
`onde_gravitazionali`, `cosmo`, `sistema_solare`, `molecola`, `laboratorio_3d`, `morse_h2`,
`magnetosfera`, `reticolo` (oppure l'identificativo di una sezione). I `params` sono le etichette
dei cursori e dei menu della scena: il browser le cerca per nome e tiene i valori fra minimo e massimo.

## Sicurezza

- Le chiavi dei modelli stanno solo nelle variabili d'ambiente del server; il browser non ne vede nessuna.
- `SPECTRA_ORIGINI` elenca le pagine che possono collegarsi: il WebSocket non passa dal CORS, e
  senza questo controllo qualsiasi sito aperto potrebbe comandare Spectra.
- Il browser accetta solo `wss://` (`ws://` solo verso il proprio computer) e solo le quattro azioni.
- Strumenti verso il mondo esterno (domotica, robot, computer) si registrano con `register(...)` al
  livello `critical`: qui non ce ne sono, per non promettere azioni che nessun ponte saprebbe compiere.

## Rapporto con Spectra 2.0 (`spectra2/`)

`spectra2/` è il servizio sempre acceso in Python senza dipendenze (memoria cognitiva, modello di sé,
presenza su più dispositivi, ponte con gli occhiali). `spectra_core/` è l'orchestratore a sette agenti
con il ponte 3D in tempo reale. Convivono; il passo successivo naturale è far usare a `spectra_core`
la memoria di `spectra2` al posto di quella SQLite (stessa interfaccia asincrona: `recall_context`,
`remember`, `update_internal_state`).

## Che cosa è provato e che cosa no

- **Provato** (10 test Python + `test_spectra_ponte`): il grafo con modelli finti, il ciclo di revisione,
  il blocco e la conferma, la memoria persistente, la validazione degli argomenti, i messaggi
  malformati, l'origine rifiutata; nel browser, ogni comando cambia davvero la scena e la telemetria
  lo riporta, il ricollegamento, gli indirizzi rifiutati.
- **Non provato**: le risposte dei modelli veri (dipendono dal fornitore e dalla chiave), un server
  pubblicato su HTTPS, le prestazioni con molte sessioni. Il richiamo della memoria è lessicale, non
  vettoriale: è il punto da sostituire con gli embedding (Qdrant) per molti ricordi.
