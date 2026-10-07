"""BioSpecInfo API — FastAPI sopra il motore dell'applicazione.

CHE COSA E' E CHE COSA NON E'

E' un modo DIVERSO di raggiungere lo stesso motore: l'applicazione vera e'
una PWA che gira interamente nel browser, senza server, e continua a
funzionare offline. Questa API non la sostituisce e non la duplica — esegue
gli stessi file.

Serve a due cose che nel browser non si possono fare: chiamare la predizione
da un programma (uno script, un foglio di calcolo, un altro servizio) e
servire un'interfaccia separata, come quella React che sta in `../web`.

OGNI RISPOSTA DICHIARA LA PROPRIA INCERTEZZA

Il campo `incertezza` non e' decorativo: uno spettro previsto senza lo scarto
misurato accanto e' un numero che sembra una misura. Viene dal motore, dove
e' il banco a scriverlo.
"""
from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Any, AsyncIterator, Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from . import __version__
from .motore import MotoreNonDisponibile, motore

@asynccontextmanager
async def ciclo(_: FastAPI) -> AsyncIterator[None]:
    # Il motore si avvia alla prima richiesta, non qui: cosi' l'API risponde
    # subito e un motore che non parte da' un 503 leggibile invece di
    # impedire l'avvio del servizio senza spiegare perche'.
    yield
    motore.chiudi()


app = FastAPI(
    lifespan=ciclo,
    title="BioSpecInfo API",
    version=__version__,
    description=(
        "Predizione NMR ¹H/¹³C assegnata per atomo, mappe bidimensionali "
        "(COSY, HSQC, HMBC) e geometria 3D. Esegue gli stessi file della "
        "PWA: non e' una seconda implementazione."
    ),
)

# Il front end di sviluppo gira su un'altra porta: senza questo il browser
# rifiuta le richieste. In produzione si restringe a quello che serve.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class RichiestaSmiles(BaseModel):
    smiles: str = Field(..., min_length=1, max_length=4000,
                        description="la struttura, in notazione SMILES")


class RichiestaNMR(RichiestaSmiles):
    nucleo: Literal["1H", "13C"] = "13C"


class RichiestaNMR2D(RichiestaSmiles):
    tipo: Literal["HSQC", "COSY", "HMBC"] = "HSQC"


class RichiestaStruttura(RichiestaSmiles):
    atomi: list[int] = []
    larghezza: int = Field(420, ge=80, le=2000)
    altezza: int = Field(300, ge=80, le=2000)


def _chiedi(azione: str, **p: Any) -> Any:
    try:
        return motore.chiedi(azione, **p)
    except MotoreNonDisponibile as e:
        # 503 e non 500: il servizio c'e', il motore no. La differenza conta
        # per chi riprova automaticamente.
        raise HTTPException(status_code=503, detail=str(e)) from e


def _oNonMolecola(esito: Any, smiles: str) -> Any:
    """Un `null` dal motore vuol dire «questa non e' una molecola leggibile».

    Restituire 200 con un corpo vuoto farebbe sembrare riuscita una richiesta
    che non lo e': chi la riceve disegnerebbe uno spettro senza segnali invece
    di dire che lo SMILES e' sbagliato.
    """
    if esito is None:
        raise HTTPException(status_code=422,
                            detail=f"non e' una struttura leggibile: {smiles!r}")
    if isinstance(esito, dict) and esito.get("errore"):
        raise HTTPException(status_code=422, detail=esito["errore"])
    return esito


@app.get("/salute", summary="Stato del servizio e impronte dei moduli caricati")
def salute() -> dict[str, Any]:
    """Le impronte servono a VERIFICARE che l'API usi gli stessi file della
    PWA: se qualcuno ne copiasse una versione vecchia qui dentro, le impronte
    non coinciderebbero piu' con quelle del repository, e il banco lo dice."""
    dati = _chiedi("salute")
    return {"versione": __version__, "stato": "pronto", **dati}


@app.post("/identita", summary="SMILES canonico, InChI, chiave e descrittori")
def identita(r: RichiestaSmiles) -> dict[str, Any]:
    return _oNonMolecola(_chiedi("identita", smiles=r.smiles), r.smiles)


@app.post("/nmr", summary="Spettro ¹H o ¹³C, assegnato per atomo")
def nmr(r: RichiestaNMR) -> dict[str, Any]:
    return _oNonMolecola(_chiedi("nmr", smiles=r.smiles, nucleo=r.nucleo), r.smiles)


@app.post("/nmr2d", summary="Mappa di correlazioni COSY, HSQC o HMBC")
def nmr2d(r: RichiestaNMR2D) -> dict[str, Any]:
    return _oNonMolecola(_chiedi("nmr2d", smiles=r.smiles, tipo=r.tipo), r.smiles)


@app.post("/geometria", summary="Coordinate 3D con gli indici del predittore")
def geometria(r: RichiestaSmiles) -> dict[str, Any]:
    return _oNonMolecola(_chiedi("geometria", smiles=r.smiles), r.smiles)


@app.post("/struttura", summary="SVG della struttura, con atomi illuminati")
def struttura(r: RichiestaStruttura) -> dict[str, Any]:
    esito = _oNonMolecola(
        _chiedi("struttura", smiles=r.smiles, atomi=r.atomi,
                larghezza=r.larghezza, altezza=r.altezza), r.smiles)
    if not esito.get("svg"):
        raise HTTPException(status_code=422,
                            detail=f"non e' una struttura disegnabile: {r.smiles!r}")
    return esito
