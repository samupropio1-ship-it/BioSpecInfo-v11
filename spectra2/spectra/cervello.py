"""Il cervello: il ciclo principale di Spectra.

Un turno non e' «domanda → modello → risposta». E' questo:

    PERCEPIRE    il messaggio entra nella memoria di lavoro (testo, voce o cio' che gli occhiali vedono)
    ORIENTARSI   che tipo di richiesta e' (un fatto, un piano, un ricordo, una conversazione)
    RICORDARE    recupero pesato: rilevanza, recenza, importanza, emozione, obiettivi, fiducia
    COMPORRE     il modello di se', gli obiettivi, i ricordi, le lacune e l'adesso diventano i blocchi del turno
    DELIBERARE   il modello ragiona e, se serve, usa gli strumenti: la memoria, l'app, gli occhiali
    AGIRE        la risposta esce sul canale giusto (testo lungo all'app, due frasi alla voce)
    SCRIVERE     il turno diventa un episodio, con la sua importanza e la sua carica
    RIFLETTERE   in piccolo, subito: ho detto «non lo so»? resta una lacuna. In grande, di notte: la cura.

Fuori dai turni Spectra ha due attivita' sue: l'INIZIATIVA (decidere se c'e'
qualcosa che vale un'interruzione) e il CICLO NOTTURNO (consolidare, riflettere,
dimenticare, scrivere il diario).
"""
from __future__ import annotations

import os
import re
import time
from dataclasses import dataclass, field
from typing import Any, Callable, Sequence

from .fornitori import Orchestratore, PensatoreLLM, Risposta, Strumento
from .memoria import Archivio, Cura, Lacune, Obiettivi, Recupero, SeStesso, stima
from .memoria.agenda import Agenda
from .memoria.archivio import adesso
from .presenza import Presenza

QUI = os.path.dirname(os.path.abspath(__file__))


def prompt_di_sistema() -> str:
    with open(os.path.join(QUI, "prompt", "sistema.md"), encoding="utf-8") as f:
        return f.read()


_PIANO = re.compile(r"\b(piano|pianific\w+|organizz\w+|prossim[oi] pass[oi]|cosa (devo|dovrei) fare|come mi preparo|scaletta|programma|obiettiv\w+|scadenz\w+|entro)\b", re.I)
_RICORDO = re.compile(r"\b(ricordi|ti ricordi|l'altra volta|ieri|la settimana scorsa|l'ultima volta|avevamo|stavamo|dove eravamo|cosa abbiamo)\b", re.I)
_FATTO = re.compile(r"\b(quanto|qual[ei]?|quale è|che cos'?[eè]|definisci|formula|valore|costante|pka|massa|punto di|calcola|quanti)\b", re.I)
_NON_SO = re.compile(r"\bnon lo so\b|\bnon ne sono sicuro\b|\bnon ho (questo|il) dato\b", re.I)


def modo_di(testo: str) -> str:
    """Di che tipo e' la richiesta: decide i pesi del recupero. Regole semplici e dichiarate; nel dubbio, conversazione."""
    if _RICORDO.search(testo):
        return "ricordo"
    if _PIANO.search(testo):
        return "piano"
    if _FATTO.search(testo):
        return "fatto"
    return "conversazione"


@dataclass
class Esito:
    testo: str
    per_la_voce: str
    risposta: Risposta
    ricordi_usati: list[str] = field(default_factory=list)
    modo: str = "conversazione"
    lacuna: str | None = None


class Spectra:
    def __init__(self, archivio: Archivio, orchestratore: Orchestratore, *, strumenti_esterni: Sequence[Strumento] = (),
                 esegui_esterno: Callable[[str, dict], str] | None = None, sistema: str | None = None):
        self.a = archivio
        self.o = orchestratore
        self.se = SeStesso(archivio); self.se.avvia()
        self.obiettivi = Obiettivi(archivio)
        self.lacune = Lacune(archivio)
        self.recupero = Recupero(archivio)
        self.cura = Cura(archivio, PensatoreLLM(orchestratore))
        self.agenda = Agenda(archivio)
        self.presenza = Presenza(archivio)
        self.sistema = sistema or prompt_di_sistema()
        self.esterni = list(strumenti_esterni)
        self.esegui_esterno = esegui_esterno
        self._silenzio: dict[str, float] = {}       # sessione → fino a quando non prendere l'iniziativa («non ora»)
        self._ultima_iniziativa: dict[str, float] = {}

    # ── gli strumenti della memoria: cio' che Spectra puo' fare a se stesso ──
    def strumenti_memoria(self) -> list[Strumento]:
        S = Strumento
        ogg = lambda prop, req: {"type": "object", "additionalProperties": False, "properties": prop, "required": req}
        return [
            S("ricorda", "Scrive nella memoria a lungo termine qualcosa che restera' vero: un fatto sull'utente, una decisione, una scadenza, una preferenza, un risultato. Una frase autosufficiente, con nomi e numeri.",
              ogg({"testo": {"type": "string"}, "importanza": {"type": "number", "description": "da 0 a 1"}, "fissa": {"type": "boolean", "description": "true = non si dimentica mai"}}, ["testo"])),
            S("cerca_nella_memoria", "Cerca nei ricordi qualcosa che non e' nei blocchi di questo turno. Usala prima di dire che non ricordi.",
              ogg({"domanda": {"type": "string"}, "tipo": {"type": "string", "enum": ["episodio", "fatto", "procedura", "autobiografia", "riflessione"]}}, ["domanda"])),
            S("impara_procedura", "Registra come si fa una cosa dopo averla fatta: i passi, e se ha funzionato. Se la procedura esiste gia' la rinforza o, se e' fallita, ne abbassa la fiducia.",
              ogg({"nome": {"type": "string"}, "passi": {"type": "array", "items": {"type": "string"}}, "riuscita": {"type": "boolean"}, "nota": {"type": "string"}}, ["nome", "passi", "riuscita"])),
            S("crea_obiettivo", "Crea un obiettivo dell'utente (o una proposta tua: proprietario «spectra», da confermare).",
              ogg({"titolo": {"type": "string"}, "orizzonte": {"type": "string", "enum": ["giorno", "settimana", "mese", "anno", "vita"]}, "prossimo_passo": {"type": "string"},
                   "giorni_alla_scadenza": {"type": "number"}, "proprietario": {"type": "string", "enum": ["utente", "spectra"]}}, ["titolo", "orizzonte"])),
            S("aggiorna_obiettivo", "Fa avanzare, cambia o chiude un obiettivo. Usa il titolo (o una sua parte) per indicarlo.",
              ogg({"titolo": {"type": "string"}, "progresso": {"type": "number", "description": "da 0 a 1"}, "prossimo_passo": {"type": "string"},
                   "stato": {"type": "string", "enum": ["attivo", "sospeso", "raggiunto", "abbandonato"]}}, ["titolo"])),
            S("annota_su_di_me", "Registra qualcosa che hai scoperto di te: un limite, oppure l'esito di un compito (per misurare una capacita').",
              ogg({"genere": {"type": "string", "enum": ["limite", "esito"]}, "testo": {"type": "string"}, "capacita": {"type": "string"}, "riuscito": {"type": "boolean"}}, ["genere", "testo"])),
            S("registra_lacuna", "Registra una cosa che non hai saputo, con il piano per saperla. Usala ogni volta che dici «non lo so».",
              ogg({"domanda": {"type": "string"}, "argomento": {"type": "string"}, "piano": {"type": "array", "items": {"type": "string"}}}, ["domanda", "piano"])),
            S("dimentica", "Cancella davvero dalla memoria i ricordi che corrispondono alla descrizione. Solo su richiesta dell'utente.",
              ogg({"cosa": {"type": "string"}}, ["cosa"])),
            # ── l'agenda: l'assistente personale ──
            S("segna_impegno", "Segna in agenda un promemoria (a un'ora precisa), un compito (da fare, con o senza scadenza) o un evento. «quando» in ISO (2026-02-12T09:00) "
              "oppure a parole: «fra 2 ore», «domani alle 18», «venerdì alle 9». Usalo ogni volta che l'utente dice che deve fare o ricordare qualcosa.",
              ogg({"testo": {"type": "string"}, "genere": {"type": "string", "enum": ["promemoria", "compito", "evento"]}, "quando": {"type": "string"},
                   "anticipo_minuti": {"type": "number", "description": "quanto prima avvisare"}, "ripeti": {"type": "string", "enum": ["giorno", "settimana", "mese"]}}, ["testo", "genere"])),
            S("leggi_agenda", "Elenca gli impegni aperti, i più vicini prima. Usalo per rispondere a «cosa devo fare oggi/domani/questa settimana».",
              ogg({"giorni": {"type": "number", "description": "solo quelli entro tanti giorni; ometti per tutti"}}, [])),
            S("chiudi_impegno", "Chiude, annulla o rimanda un impegno, indicato con qualche parola del suo testo.",
              ogg({"cosa": {"type": "string"}, "azione": {"type": "string", "enum": ["fatto", "annulla", "rimanda"]}, "quando": {"type": "string", "description": "per «rimanda»: a quando"}}, ["cosa", "azione"])),
        ]

    def _esegui(self, sessione: str) -> Callable[[str, dict], str]:
        def esegui(nome: str, arg: dict) -> str:
            if nome == "ricorda":
                s = stima(arg["testo"])
                r = self.a.scrivi("fatto", arg["testo"], importanza=max(s["importanza"], float(arg.get("importanza", 0.6))), valenza=s["valenza"], attivazione=s["attivazione"],
                                  fonte="utente", fiducia=0.85, sessione=sessione, fissato=bool(arg.get("fissa", False)))
                esito = self.cura.riconcilia(r)
                return {"nuovo": "ricordato", "rafforzati": "lo sapevo già: ora ne sono più sicuro", "aggiornati": "aggiornato: il dato di prima è superato",
                        "conflitti": "in conflitto con un ricordo precedente: chiedi all'utente quale è vero"}[esito]
            if nome == "cerca_nella_memoria":
                tr = self.recupero.cerca(arg["domanda"], k=6, tipi=[arg["tipo"]] if arg.get("tipo") else None, modo="fatto", obiettivi=[o.testo() for o in self.obiettivi.attivi()])
                return self.recupero.contesto(tr) or "nessun ricordo pertinente"
            if nome == "impara_procedura":
                p = self.cura.apprendi_procedura(arg["nome"], arg["passi"], riuscita=arg["riuscita"], nota=arg.get("nota", ""))
                return f"procedura «{arg['nome']}»: fiducia {p.fiducia:.0%}"
            if nome == "crea_obiettivo":
                g = arg.get("giorni_alla_scadenza")
                o = self.obiettivi.crea(arg["titolo"], orizzonte=arg["orizzonte"], prossimo_passo=arg.get("prossimo_passo"), proprietario=arg.get("proprietario", "utente"),
                                        scadenza=adesso() + g * 86400 if g else None)
                return f"obiettivo creato: {o.titolo}"
            if nome == "aggiorna_obiettivo":
                cand = [o for o in self.obiettivi.attivi() if arg["titolo"].lower() in o.titolo.lower()]
                if len(cand) != 1:
                    return "obiettivo non trovato" if not cand else "più obiettivi corrispondono: " + "; ".join(o.titolo for o in cand)
                self.obiettivi.avanza(cand[0].id, progresso=arg.get("progresso"), prossimo_passo=arg.get("prossimo_passo"), stato=arg.get("stato"))
                return f"obiettivo aggiornato: {cand[0].titolo}"
            if nome == "annota_su_di_me":
                if arg["genere"] == "esito" and arg.get("capacita"):
                    return f"fiducia in «{arg['capacita']}»: {self.se.registra_esito(arg['capacita'], bool(arg.get('riuscito')), arg['testo']):.0%}"
                self.se.aggiungi_limite(arg["testo"], motivo="osservato in conversazione")
                return "annotato"
            if nome == "registra_lacuna":
                self.lacune.apri(arg["domanda"], arg.get("argomento"), arg["piano"])
                return "lacuna registrata"
            if nome == "dimentica":
                tr = self.recupero.cerca(arg["cosa"], k=10, soglia=0.35, rinforza=False, diffusione=0.0)
                for x in tr:
                    self.a.cancella(x.ricordo.id, "richiesta dell'utente")
                return f"cancellati {len(tr)} ricordi" if tr else "non ho trovato ricordi che corrispondano"
            if nome == "segna_impegno":
                try:
                    i = self.agenda.aggiungi(arg["testo"], genere=arg["genere"], quando=arg.get("quando"), anticipo_minuti=float(arg.get("anticipo_minuti", 0)), ripeti=arg.get("ripeti"))
                except ValueError as e:                # una data non capita torna al modello, che la chiede all'utente: non si inventa
                    return str(e)
                return "segnato: " + i.riga()
            if nome == "leggi_agenda":
                g = arg.get("giorni")
                voci = self.agenda.aperti(entro=float(g) * 86400 if g else None)
                return "\n".join(i.riga() for i in voci[:20]) or "niente in agenda"
            if nome == "chiudi_impegno":
                cand = self.agenda.trova(arg["cosa"])
                if len(cand) != 1:
                    return "impegno non trovato" if not cand else "più impegni corrispondono: " + "; ".join(i.testo for i in cand[:5])
                if arg["azione"] == "fatto":
                    seguente = self.agenda.completa(cand[0].id)
                    return "fatto: " + cand[0].testo + (". Il prossimo: " + seguente.riga() if seguente else "")
                if arg["azione"] == "annulla":
                    self.agenda.annulla(cand[0].id)
                    return "annullato: " + cand[0].testo
                if not arg.get("quando"):
                    return "per rimandare serve «quando»"
                try:
                    return "rimandato: " + self.agenda.rimanda(cand[0].id, arg["quando"]).riga()
                except ValueError as e:
                    return str(e)
            if self.esegui_esterno:
                return self.esegui_esterno(nome, arg)
            raise ValueError(f"strumento sconosciuto: {nome}")
        return esegui

    # ── un turno ─────────────────────────────────────────────────────────
    def blocchi(self, testo: str, sessione: str, canale: str, contesto: dict | None, trovati) -> str:
        """La parte del turno che cambia ogni volta. Sta nel messaggio dell'utente, DOPO la storia stabile, per non rompere la cache del prompt."""
        ora = time.strftime("%A %d %B %Y, %H:%M", time.localtime())
        lacune = self.lacune.aperte(5)
        parti = [self.presenza.blocco(sessione, canale),
                 "[IO]\n" + self.se.estratto(),
                 "[OBIETTIVI]\n" + self.obiettivi.estratto(),
                 "[AGENDA]\n" + self.agenda.estratto(),
                 "[RICORDI]\n" + (self.recupero.contesto(trovati) or "(nessun ricordo pertinente: se serve, cerca_nella_memoria)")]
        if lacune:
            parti.append("[LACUNE]\n" + "\n".join(f"- {l['domanda']}" for l in lacune))
        adesso_ = f"[ADESSO]\n{ora} · canale: {canale}"
        for k, v in (contesto or {}).items():
            adesso_ += f"\n{k}: {v}"
        parti.append(adesso_)
        return "\n\n".join(parti) + "\n\n[MESSAGGIO]\n" + testo

    def turno(self, testo: str, *, sessione: str = "principale", canale: str = "testo", immagini: Sequence[dict] = (), contesto: dict | None = None,
              dispositivo: str | None = None, tipo_dispositivo: str = "browser") -> Esito:
        testo = (testo or "").strip()
        if not testo and not immagini:
            raise ValueError("un turno vuoto non si elabora")
        # «non ora»: l'iniziativa tace per il resto della sessione
        if re.search(r"\b(non ora|dopo|lasciami stare|non adesso)\b", testo, re.I):
            self._silenzio[sessione] = adesso() + 3 * 3600
        if dispositivo:
            self.presenza.tocca(dispositivo, tipo_dispositivo, uso=True)
        modo = modo_di(testo)
        obi = [o.testo() for o in self.obiettivi.attivi()]
        trovati = self.recupero.cerca(testo or "ciò che sto guardando", k=8, modo=modo, obiettivi=obi)
        storia = [{"ruolo": "spectra" if m["ruolo"] == "spectra" else "utente", "testo": m["contenuto"]} for m in self.a.lavoro_leggi(sessione, 10)]
        messaggi = storia + [{"ruolo": "utente", "testo": self.blocchi(testo, sessione, canale, contesto, trovati), "immagini": list(immagini)}]
        strumenti = self.strumenti_memoria() + self.esterni
        risposta = self.o.turno(self.sistema, messaggi, strumenti, self._esegui(sessione), sforzo="low" if canale in ("voce", "occhiali") else None)
        detto = risposta.testo.strip() or {"rifiuto": "Su questo non posso aiutarti.", "troncata": "La risposta si è interrotta: riformula in modo più stretto.",
                                           "giri_esauriti": "Non sono arrivato a una conclusione: riproviamo da un punto più preciso."}.get(risposta.motivo_fine, "…")
        # SCRIVERE: la memoria di lavoro e l'episodio
        self.a.lavoro_aggiungi(sessione, "utente", testo, canale)
        self.a.lavoro_aggiungi(sessione, "spectra", detto, canale)
        s = stima(testo)
        self.a.scrivi("episodio", f"Samuele ({canale}): {testo}\nSpectra: {detto[:600]}", importanza=s["importanza"], valenza=s["valenza"], attivazione=s["attivazione"],
                      fonte="utente" if canale != "occhiali" else "osservazione", sessione=sessione,
                      contesto={"canale": canale, "modo": modo, "fornitore": risposta.fornitore, "strumenti": [u["nome"] for u in risposta.strumenti_usati]})
        # RIFLETTERE (in piccolo): un «non lo so» senza lacuna registrata diventa comunque una lacuna
        lacuna = None
        if _NON_SO.search(detto) and not any(u["nome"] == "registra_lacuna" for u in risposta.strumenti_usati):
            lacuna = self.lacune.apri(testo[:300], argomento=modo, piano=["cercare nella memoria e nell'app", "verificare su una fonte", "chiedere all'utente se resta il dubbio"])
        # la presenza: il turno compare anche sugli altri dispositivi (che mostrano, non parlano)
        self.presenza.pubblica("turno", {"utente": testo, "spectra": detto, "canale": canale, "sessione": sessione}, origine=dispositivo)
        return Esito(detto, per_la_voce(detto), risposta, [t.ricordo.id for t in trovati], modo, lacuna)

    # ── l'iniziativa ─────────────────────────────────────────────────────
    def iniziativa(self, sessione: str = "principale", *, intervallo: float = 1800.0) -> str | None:
        """Decide se c'e' qualcosa che vale un'interruzione. Al piu' una cosa, non piu' spesso dell'intervallo, mai dopo un «non ora».

        L'ordine e' l'urgenza: una scadenza vicina con il lavoro indietro; un conflitto di memoria da chiarire; un obiettivo fermo.
        Restituisce la frase da dire, oppure None (che e' la risposta giusta quasi sempre).
        """
        t = adesso()
        # i promemoria non sono un'iniziativa di Spectra: li ha chiesti l'utente, arrivano all'ora giusta anche dopo un «non ora»
        dovuti = self.agenda.da_avvisare(t)
        if dovuti:
            i = dovuti[0]
            self.agenda.segna_avvisato(i.id)
            quando = "adesso" if abs(i.quando - t) < 120 else ("fra " + _durata_breve(i.quando - t) if i.quando > t else "da " + _durata_breve(t - i.quando))
            frase = {"promemoria": "Promemoria", "compito": "Scadenza", "evento": "Evento"}[i.genere] + f": {i.testo} — {quando}."
            self.a.annota("promemoria", id=i.id, frase=frase)
            return frase
        if t < self._silenzio.get(sessione, 0) or t - self._ultima_iniziativa.get(sessione, 0) < intervallo:
            return None
        frase = None
        for o in self.obiettivi.in_scadenza(3.0):
            if o.progresso < 0.7:
                giorni = max(0, round((o.scadenza - t) / 86400))
                frase = f"«{o.titolo}» scade fra {giorni} giorni e sei al {o.progresso:.0%}." + (f" Il prossimo passo è: {o.prossimo_passo}." if o.prossimo_passo else "")
                break
        if not frase:
            for l in self.lacune.aperte(10):
                if l["argomento"] == "conflitto di memoria":
                    frase = "Ho due ricordi che non stanno insieme. " + l["domanda"]
                    break
        if not frase:
            fermi = self.obiettivi.fermi(7.0)
            if fermi:
                o = fermi[0]
                frase = f"«{o.titolo}» è fermo da più di una settimana." + (f" Riparto da: {o.prossimo_passo}?" if o.prossimo_passo else " Lo riprendiamo o lo sospendo?")
                self.obiettivi.avanza(o.id)            # e' stato riportato all'attenzione: non lo si ripropone domani
        if frase:
            self._ultima_iniziativa[sessione] = t
            self.a.annota("iniziativa", sessione=sessione, frase=frase)
        return frase

    # ── fine sessione e notte ────────────────────────────────────────────
    def fine_sessione(self, sessione: str) -> dict:
        rapporto = self.cura.consolida(sessione=sessione)
        rapporto["lavoro_svuotato"] = self.a.lavoro_svuota(sessione, tieni=4)
        return rapporto

    def notte(self) -> dict:
        return self.cura.ciclo_notturno()

    def stato(self) -> dict[str, Any]:
        return {"dispositivi": [{k: d[k] for k in ("id", "tipo", "collegato")} for d in self.presenza.dispositivi()], "agenda": len(self.agenda.aperti()),
                "memoria": self.a.conta(), "obiettivi": [o.titolo for o in self.obiettivi.attivi()], "lacune": len(self.lacune.aperte()),
                "capacita": {k: v["fiducia"] for k, v in (self.se.leggi("capacita") or {}).items()}}


def _durata_breve(s: float) -> str:
    return f"{max(1, round(s / 60))} minuti" if s < 5400 else f"{round(s / 3600)} ore" if s < 129600 else f"{round(s / 86400)} giorni"


_SIMBOLI = [(r"\*\*|__|`|#+\s", ""), (r"\[(.*?)\]\([^)]*\)", r"\1"), (r"→", " dà "), (r"⇌", " in equilibrio con "), (r"≈", " circa "), (r"°C", " gradi Celsius"),
            (r"\bpKa\b", "pi-kappa-a"), (r"\bpH\b", "pi-acca"), (r"H₂O", "acqua"), (r"CO₂", "anidride carbonica")]


def per_la_voce(testo: str, massimo: int = 420) -> str:
    """Il testo scritto per gli occhi diventa testo da dire: niente markdown, simboli a parole, e solo l'inizio se e' lungo."""
    t = testo
    for schema, con in _SIMBOLI:
        t = re.sub(schema, con, t)
    t = re.sub(r"\s*\n+\s*[-•*]\s*", ". ", t)
    t = re.sub(r"\s+", " ", t).strip()
    if len(t) <= massimo:
        return t
    taglio = t[:massimo]
    fine = max(taglio.rfind(". "), taglio.rfind("? "), taglio.rfind("! "))
    return (taglio[:fine + 1] if fine > 120 else taglio.rsplit(" ", 1)[0] + ".") + " Il resto è sull'app."
