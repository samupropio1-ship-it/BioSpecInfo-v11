"""Banco dell'API — nei due versi, come tutti gli altri di questo progetto.

PERCHE' ESISTE

Un'API di predizione risponde sempre 200 con dei numeri dentro: se il motore
non e' partito, se sta usando una copia vecchia dei moduli, se uno SMILES
illeggibile produce uno spettro vuoto invece di un errore, il chiamante non
se ne accorge. Qui si verifica che risponda bene quando deve e che si
RIFIUTI quando deve.

La prova piu' importante e' quella delle impronte: l'API deve eseguire gli
STESSI file che l'applicazione serve ai suoi utenti. Se qualcuno ne copiasse
una versione dentro `stack/`, le due implementazioni comincerebbero a
divergere e nessuno se ne accorgerebbe finche' non danno due numeri diversi
per la stessa molecola.

USO   cd stack/api && python -m pytest -q
"""
from __future__ import annotations

import hashlib
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from bsi_api.main import app            # noqa: E402
from bsi_api.motore import RADICE       # noqa: E402


@pytest.fixture(scope="module")
def c():
    with TestClient(app) as cl:
        yield cl


# ── §1 · Il servizio e' vivo, e dice con che cosa ────────────────────────
def test_salute(c):
    r = c.get("/salute")
    assert r.status_code == 200
    d = r.json()
    assert d["stato"] == "pronto"
    assert d["rdkit"]
    assert set(d["moduli"]) == {
        "bsi-pretsch.js", "bsi-nmr.js", "bsi-geom3d.js", "bsi-nmr2d.js"}


def test_i_moduli_sono_quelli_dell_applicazione(c):
    """La prova che non esiste un secondo motore.

    Se un giorno qualcuno copiasse i moduli dentro `stack/` «per comodita'»,
    questa prova fallirebbe il giorno stesso, invece che fra sei mesi quando
    i due danno due numeri diversi.
    """
    dichiarate = c.get("/salute").json()["moduli"]
    for nome, impronta in dichiarate.items():
        vero = hashlib.sha256((RADICE / nome).read_bytes()).hexdigest()[:16]
        assert impronta == vero, f"{nome}: l'API non usa il file del repository"


# ── §2 · La predizione ───────────────────────────────────────────────────
def test_nmr_13c(c):
    r = c.post("/nmr", json={"smiles": "CCOC(C)=O", "nucleo": "13C"})
    assert r.status_code == 200
    d = r.json()
    assert len(d["segnali"]) == 4            # C=O, OCH₂, CH₃ acetile, CH₃ etile
    assert d["incertezza"] and "ppm" in d["incertezza"]
    ppm = sorted((s["ppm"] for s in d["segnali"]), reverse=True)
    assert 165 < ppm[0] < 178               # il carbonile
    assert 55 < ppm[1] < 65                 # l'OCH₂
    # ogni segnale dice QUALI atomi lo producono: senza, non e' un'assegnazione
    assert all(s["atomi"] for s in d["segnali"])


def test_nmr_1h(c):
    d = c.post("/nmr", json={"smiles": "c1ccccc1", "nucleo": "1H"}).json()
    assert len(d["segnali"]) == 1           # sei protoni, un segnale
    assert d["segnali"][0]["nH"] == 6


def test_nmr2d_hsqc(c):
    d = c.post("/nmr2d", json={"smiles": "CCOC(C)=O", "tipo": "HSQC"}).json()
    assert d["tipo"] == "HSQC"
    assert len(d["picchi"]) == 3            # tre carboni protonati
    # il CH₂ ha segno opposto, come in un HSQC editato
    assert sorted(p["segno"] for p in d["picchi"]) == [-1, 1, 1]


def test_nmr2d_cosy_del_benzene_ha_solo_la_diagonale(c):
    """I sei protoni del benzene sono equivalenti: niente macchie fuori."""
    d = c.post("/nmr2d", json={"smiles": "c1ccccc1", "tipo": "COSY"}).json()
    assert len(d["diagonale"]) == 1
    assert len(d["picchi"]) == 0


def test_geometria(c):
    d = c.post("/geometria", json={"smiles": "CCO"}).json()
    assert len(d["atomi"]) == 9             # 3 pesanti + 6 idrogeni
    assert d["nPesanti"] == 3
    # gli idrogeni stanno DOPO: l'indice di un atomo pesante e' quello del
    # predittore, ed e' cio' che rende lecito il collegamento picco↔atomo
    assert [a["el"] for a in d["atomi"][:3]] == ["C", "C", "O"]
    assert all(a["el"] == "H" for a in d["atomi"][3:])


def test_struttura_svg(c):
    d = c.post("/struttura", json={"smiles": "c1ccccc1", "atomi": [0, 1]}).json()
    assert d["svg"].lstrip().startswith("<?xml") or "<svg" in d["svg"]


def test_identita(c):
    d = c.post("/identita", json={"smiles": "OCC"}).json()
    assert d["canonico"] == "CCO"           # canonico, non come l'hai scritto
    assert d["inchi"].startswith("InChI=")
    assert d["chiave"] == "LFQSCWFLJHTTHZ-UHFFFAOYSA-N"


# ── §3 · I rifiuti: il verso opposto ─────────────────────────────────────
@pytest.mark.parametrize("rotta,corpo", [
    ("/nmr", {"smiles": "questo non e uno smiles"}),
    ("/nmr2d", {"smiles": "questo non e uno smiles"}),
    ("/geometria", {"smiles": "questo non e uno smiles"}),
    ("/struttura", {"smiles": "questo non e uno smiles"}),
    ("/identita", {"smiles": "questo non e uno smiles"}),
])
def test_uno_smiles_illeggibile_e_un_errore_non_uno_spettro_vuoto(c, rotta, corpo):
    r = c.post(rotta, json=corpo)
    assert r.status_code == 422
    assert "leggibile" in r.json()["detail"] or r.json()["detail"]


def test_una_stringa_vuota_non_passa_nemmeno_la_porta(c):
    """Il rifiuto arriva dalla validazione, prima di disturbare il motore."""
    assert c.post("/nmr", json={"smiles": ""}).status_code == 422


def test_un_nucleo_inventato_non_passa(c):
    assert c.post("/nmr", json={"smiles": "CCO", "nucleo": "31P"}).status_code == 422


def test_un_tipo_2d_inventato_non_passa(c):
    assert c.post("/nmr2d", json={"smiles": "CCO", "tipo": "NOESY"}).status_code == 422


# ── §4 · Gli stessi numeri del browser ───────────────────────────────────
def test_gli_stessi_numeri_che_vede_chi_usa_l_applicazione(c):
    """Il motore e' lo stesso, quindi i numeri devono essere identici.

    I valori qui sotto sono quelli che il banco `test_nmr` misura nel
    browser. Se divergessero vorrebbe dire che l'API sta eseguendo qualcosa
    di diverso da cio' che vede chi apre l'applicazione — che e' esattamente
    il guasto che questa architettura esiste per rendere impossibile.
    """
    d = c.post("/nmr", json={"smiles": "c1ccccc1", "nucleo": "13C"}).json()
    assert d["segnali"][0]["ppm"] == pytest.approx(128.5, abs=0.01)
    d = c.post("/nmr", json={"smiles": "C1CCCCC1", "nucleo": "13C"}).json()
    assert d["segnali"][0]["ppm"] == pytest.approx(26.9, abs=0.01)
    d = c.post("/nmr", json={"smiles": "COc1ccccc1", "nucleo": "1H"}).json()
    ppm = sorted(s["ppm"] for s in d["segnali"])
    # quattro segnali, non tre: OCH₃, orto, para e meta — l'anisolo li ha
    # distinti, ed e' esattamente la capacita' che le tabelle di Pretsch
    # hanno aggiunto alla `bsi-v189`. Prima erano tutti e tre a 7,26.
    assert ppm == pytest.approx([3.73, 6.90, 6.94, 7.29], abs=0.01)
