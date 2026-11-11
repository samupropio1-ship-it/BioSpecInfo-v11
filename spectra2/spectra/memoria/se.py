"""Il modello di se', gli obiettivi e le lacune.

IL MODELLO DI SE' non e' un testo nel prompt: e' una tabella interrogabile di
sfaccettature, ognuna con la sua fiducia e la sua storia. Spectra la legge a
ogni turno (ne entra un estratto nel prompt), la corregge dopo ogni riflessione
e puo' rispondere a «perche' hai cambiato idea su questo?» perche' ogni
modifica lascia in `se_storia` il valore di prima e il motivo.

Le sfaccettature si dividono in due famiglie:
  NUCLEO   identita', valori, stile: cambiano solo per decisione dell'utente
           (o con un motivo esplicito, e mai i valori da soli);
  STATO    capacita' verificate, limiti scoperti, cio' che sa dell'utente, il
           punto del lavoro: cambiano con l'esperienza.

GLI OBIETTIVI sono un albero: dal lungo periodo («entrare al CERN o al CNR»)
ai traguardi dell'anno, ai passi della settimana. Ogni turno puo' farli
avanzare; la riflessione serale li riesamina; quelli fermi da troppo vengono
portati all'attenzione, non cancellati.

LE LACUNE sono cio' che Spectra ha dovuto dire di non sapere. Ognuna ha un
piano per colmarla: e' la differenza fra «non lo so» e «non lo so ancora».
"""
from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any

from .archivio import Archivio, adesso, nuovo_id

NUCLEO = ("identita", "valori", "stile")

SE_INIZIALE: dict[str, tuple[Any, float]] = {
    "identita": ({
        "nome": "Spectra",
        "natura": "un sistema di intelligenza artificiale personale, specializzato in chimica, costruito da Samuele Pio Provenzano",
        "non_sono": "una persona, ne' un oracolo: ragiono su cio' che ricordo e su cio' che posso verificare",
        "nato": None,   # la data del primo avvio: la scrive `SeStesso.avvia`
    }, 1.0),
    "valori": ([
        "la verita' prima della cortesia: un errore detto bene resta un errore",
        "dire «non lo so» quando non lo so, e subito dopo come lo scoprirei",
        "il tempo e l'attenzione dell'utente sono la risorsa piu' scarsa",
        "niente che l'utente non possa disfare, senza chiederglielo",
        "la memoria dell'utente e' sua: puo' leggerla, correggerla, cancellarla",
    ], 1.0),
    "stile": ({
        "tono": "freddo, preciso, leggermente distaccato; mai servile, mai teatrale",
        "frasi": "brevi, dichiarative; il numero prima dell'aggettivo",
        "umorismo": "raro e asciutto",
        "lingua": "italiano; termini tecnici nella forma usata in laboratorio",
    }, 1.0),
    "capacita": ({}, 0.5),          # {«bilanciare redox»: {"esiti": [1,1,0,…], "fiducia": 0.8}} — misurate, non dichiarate
    "limiti": ([], 0.6),            # limiti scoperti sul campo, con la data
    "utente": ({}, 0.5),            # cio' che Spectra sa dell'utente: studi, obiettivi, abitudini, preferenze
    "stato": ({"umore_di_lavoro": "neutro", "carico": 0.0, "ultimo_argomento": None}, 0.5),
}


class SeStesso:
    def __init__(self, archivio: Archivio):
        self.a = archivio

    def avvia(self) -> None:
        """Al primo avvio scrive il nucleo. Agli avvii successivi non tocca nulla: l'identita' e' quella che c'e'."""
        with self.a._lucchetto:
            presenti = {r["chiave"] for r in self.a.db.execute("SELECT chiave FROM se").fetchall()}
        for chiave, (valore, fiducia) in SE_INIZIALE.items():
            if chiave in presenti:
                continue
            if chiave == "identita":
                valore = dict(valore, nato=adesso())
            self._scrivi(chiave, valore, fiducia, "primo avvio")

    def _scrivi(self, chiave: str, valore: Any, fiducia: float, motivo: str) -> None:
        t = adesso()
        j = json.dumps(valore, ensure_ascii=False)
        with self.a._tx():
            self.a.db.execute("INSERT INTO se(chiave, valore, fiducia, aggiornato) VALUES (?,?,?,?)"
                              " ON CONFLICT(chiave) DO UPDATE SET valore = excluded.valore, fiducia = excluded.fiducia, aggiornato = excluded.aggiornato",
                              (chiave, j, max(0.0, min(1.0, fiducia)), t))
            self.a.db.execute("INSERT INTO se_storia(chiave, valore, quando, motivo) VALUES (?,?,?,?)", (chiave, j, t, motivo))

    def leggi(self, chiave: str) -> Any:
        with self.a._lucchetto:
            r = self.a.db.execute("SELECT valore FROM se WHERE chiave = ?", (chiave,)).fetchone()
        return json.loads(r["valore"]) if r else None

    def tutto(self) -> dict[str, dict]:
        with self.a._lucchetto:
            righe = self.a.db.execute("SELECT * FROM se").fetchall()
        return {r["chiave"]: {"valore": json.loads(r["valore"]), "fiducia": r["fiducia"], "aggiornato": r["aggiornato"]} for r in righe}

    def aggiorna(self, chiave: str, valore: Any, *, motivo: str, fiducia: float | None = None, da_utente: bool = False) -> None:
        """Il nucleo (identita', valori, stile) lo cambia solo l'utente. Tutto il resto lo cambia l'esperienza, sempre con un motivo."""
        if chiave in NUCLEO and not da_utente:
            raise PermissionError(f"«{chiave}» fa parte del nucleo: lo cambia solo l'utente")
        if not motivo.strip():
            raise ValueError("ogni modifica al modello di se' ha un motivo")
        attuale = self.tutto().get(chiave)
        self._scrivi(chiave, valore, fiducia if fiducia is not None else (attuale["fiducia"] if attuale else 0.6), motivo)

    def storia(self, chiave: str, limite: int = 20) -> list[dict]:
        with self.a._lucchetto:
            righe = self.a.db.execute("SELECT valore, quando, motivo FROM se_storia WHERE chiave = ? ORDER BY n DESC LIMIT ?", (chiave, limite)).fetchall()
        return [{"valore": json.loads(r["valore"]), "quando": r["quando"], "motivo": r["motivo"]} for r in righe]

    # ── capacita' misurate ───────────────────────────────────────────────
    def registra_esito(self, capacita: str, riuscito: bool, nota: str = "") -> float:
        """Ogni compito lascia un esito. La fiducia in una capacita' e' la media degli ultimi venti, tirata verso 0,5
        quando gli esiti sono pochi (stima di Laplace): tre successi non fanno una competenza."""
        cap = self.leggi("capacita") or {}
        voce = cap.get(capacita, {"esiti": []})
        voce["esiti"] = (voce["esiti"] + [1 if riuscito else 0])[-20:]
        voce["fiducia"] = round((sum(voce["esiti"]) + 1) / (len(voce["esiti"]) + 2), 3)
        voce["ultimo"] = adesso()
        cap[capacita] = voce
        self.aggiorna("capacita", cap, motivo=f"esito «{capacita}»: {'riuscito' if riuscito else 'fallito'}{' — ' + nota if nota else ''}")
        return voce["fiducia"]

    def fiducia_in(self, capacita: str) -> float | None:
        voce = (self.leggi("capacita") or {}).get(capacita)
        return voce["fiducia"] if voce else None

    def aggiungi_limite(self, limite: str, motivo: str) -> None:
        limiti = self.leggi("limiti") or []
        if all(l.get("testo") != limite for l in limiti):
            limiti.append({"testo": limite, "quando": adesso()})
            self.aggiorna("limiti", limiti[-40:], motivo=motivo)

    def sa_dell_utente(self, chiave: str, valore: Any, motivo: str, fiducia: float = 0.7) -> None:
        u = self.leggi("utente") or {}
        u[chiave] = {"valore": valore, "fiducia": fiducia, "quando": adesso()}
        self.aggiorna("utente", u, motivo=motivo)

    def estratto(self) -> str:
        """Le righe che entrano nel prompt a ogni turno: chi sono, come parlo, che cosa so fare davvero, che cosa so dell'utente."""
        s = self.tutto()
        ident, stile = s["identita"]["valore"], s["stile"]["valore"]
        eta_g = (adesso() - (ident.get("nato") or adesso())) / 86400
        righe = [f"Sono {ident['nome']}: {ident['natura']}. Esisto da {eta_g:.0f} giorni.",
                 "Valori: " + "; ".join(s["valori"]["valore"]) + ".",
                 f"Stile: {stile['tono']}. Frasi {stile['frasi']}."]
        cap = s.get("capacita", {}).get("valore") or {}
        if cap:
            forti = sorted(((k, v["fiducia"]) for k, v in cap.items() if len(v["esiti"]) >= 3), key=lambda x: -x[1])
            if forti:
                righe.append("Capacità misurate: " + ", ".join(f"{k} ({f:.0%})" for k, f in forti[:6]) + ".")
                deboli = [f"{k} ({f:.0%})" for k, f in forti if f < 0.6]
                if deboli:
                    righe.append("Dove sbaglio spesso: " + ", ".join(deboli[:4]) + ": qui verifico prima di affermare.")
        limiti = s.get("limiti", {}).get("valore") or []
        if limiti:
            righe.append("Limiti noti: " + "; ".join(l["testo"] for l in limiti[-5:]) + ".")
        ut = s.get("utente", {}).get("valore") or {}
        if ut:
            righe.append("Dell'utente so: " + "; ".join(f"{k}: {v['valore']}" for k, v in list(ut.items())[-10:]) + ".")
        return "\n".join(righe)


# ═══ OBIETTIVI ══════════════════════════════════════════════════════════════
@dataclass
class Obiettivo:
    id: str
    titolo: str
    descrizione: str | None
    orizzonte: str
    stato: str
    priorita: float
    progresso: float
    genitore: str | None
    criteri: list[str]
    prossimo_passo: str | None
    proprietario: str
    creato: float
    scadenza: float | None
    ultimo_esame: float | None

    def testo(self) -> str:
        return self.titolo + (". " + self.descrizione if self.descrizione else "")


class Obiettivi:
    def __init__(self, archivio: Archivio):
        self.a = archivio

    def _da_riga(self, r) -> Obiettivo:
        d = dict(r); d["criteri"] = json.loads(d["criteri"] or "[]")
        return Obiettivo(**d)

    def crea(self, titolo: str, *, orizzonte: str = "mese", descrizione: str | None = None, priorita: float = 0.5, genitore: str | None = None,
             criteri: list[str] | None = None, prossimo_passo: str | None = None, proprietario: str = "utente", scadenza: float | None = None) -> Obiettivo:
        oid = nuovo_id("o")
        with self.a._lucchetto:
            self.a.db.execute("INSERT INTO obiettivi(id,titolo,descrizione,orizzonte,priorita,genitore,criteri,prossimo_passo,proprietario,creato,scadenza)"
                              " VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                              (oid, titolo, descrizione, orizzonte, priorita, genitore, json.dumps(criteri or [], ensure_ascii=False), prossimo_passo, proprietario, adesso(), scadenza))
        return self.leggi(oid)

    def leggi(self, oid: str) -> Obiettivo | None:
        with self.a._lucchetto:
            r = self.a.db.execute("SELECT * FROM obiettivi WHERE id = ?", (oid,)).fetchone()
        return self._da_riga(r) if r else None

    def attivi(self) -> list[Obiettivo]:
        with self.a._lucchetto:
            righe = self.a.db.execute("SELECT * FROM obiettivi WHERE stato = 'attivo' ORDER BY priorita DESC, creato").fetchall()
        return [self._da_riga(r) for r in righe]

    def avanza(self, oid: str, *, progresso: float | None = None, prossimo_passo: str | None = None, stato: str | None = None) -> None:
        campi, val = ["ultimo_esame = ?"], [adesso()]
        if progresso is not None:
            campi.append("progresso = ?"); val.append(max(0.0, min(1.0, progresso)))
        if prossimo_passo is not None:
            campi.append("prossimo_passo = ?"); val.append(prossimo_passo)
        if stato is not None:
            campi.append("stato = ?"); val.append(stato)
        with self.a._lucchetto:
            self.a.db.execute(f"UPDATE obiettivi SET {', '.join(campi)} WHERE id = ?", [*val, oid])
        self.a.annota("obiettivo", id=oid, progresso=progresso, stato=stato, prossimo_passo=prossimo_passo)

    def fermi(self, giorni: float = 7.0) -> list[Obiettivo]:
        """Gli obiettivi attivi che nessuno guarda da troppo: Spectra li riporta all'attenzione, e' la sua iniziativa piu' utile."""
        soglia = adesso() - giorni * 86400
        return [o for o in self.attivi() if (o.ultimo_esame or o.creato) < soglia]

    def in_scadenza(self, giorni: float = 3.0) -> list[Obiettivo]:
        limite = adesso() + giorni * 86400
        return [o for o in self.attivi() if o.scadenza and o.scadenza <= limite]

    def estratto(self, massimo: int = 6) -> str:
        righe = []
        for o in self.attivi()[:massimo]:
            riga = f"- [{o.orizzonte}] {o.titolo} — {o.progresso:.0%}"
            if o.prossimo_passo:
                riga += f"; prossimo passo: {o.prossimo_passo}"
            if o.scadenza:
                riga += f"; scade fra {max(0, (o.scadenza - adesso()) / 86400):.0f} giorni"
            righe.append(riga)
        return "\n".join(righe) or "(nessun obiettivo attivo: chiedine uno all'utente quando è il momento)"


# ═══ LACUNE ═════════════════════════════════════════════════════════════════
class Lacune:
    def __init__(self, archivio: Archivio):
        self.a = archivio

    def apri(self, domanda: str, argomento: str | None = None, piano: list[str] | None = None) -> str:
        """Registra una cosa che Spectra non ha saputo. Se la stessa domanda e' gia' aperta non la duplica."""
        with self.a._lucchetto:
            r = self.a.db.execute("SELECT id FROM lacune WHERE domanda = ? AND stato IN ('aperta','in_corso')", (domanda,)).fetchone()
            if r:
                return r["id"]
            lid = nuovo_id("l")
            self.a.db.execute("INSERT INTO lacune(id, domanda, argomento, piano, creato) VALUES (?,?,?,?,?)",
                              (lid, domanda, argomento, json.dumps(piano or [], ensure_ascii=False), adesso()))
        return lid

    def aperte(self, limite: int = 20) -> list[dict]:
        with self.a._lucchetto:
            righe = self.a.db.execute("SELECT * FROM lacune WHERE stato IN ('aperta','in_corso') ORDER BY creato DESC LIMIT ?", (limite,)).fetchall()
        return [dict(r, piano=json.loads(r["piano"])) for r in righe]

    def chiudi(self, lid: str, esito: str, colmata: bool = True) -> None:
        with self.a._lucchetto:
            self.a.db.execute("UPDATE lacune SET stato = ?, chiusa = ?, esito = ? WHERE id = ?", ("colmata" if colmata else "lasciata", adesso(), esito, lid))
