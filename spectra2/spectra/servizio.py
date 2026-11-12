"""Il servizio: Spectra raggiungibile sempre, da ogni dispositivo.

Il cervello gira su una macchina sempre accesa (un mini-PC in casa, o un
server). L'app BioSpecInfo, il browser, il telefono e il ponte degli occhiali
sono CLIENT: non hanno la memoria ne' le chiavi, parlano con questo servizio.

    POST /turno        {testo, sessione?, canale?, immagini?, contesto?}  → {testo, voce, modo, strumenti, lacuna, audio?}
    GET  /iniziativa   ?sessione=…        → {frase | null}   (il client lo chiede ogni tanto: e' cosi' che Spectra parla per primo)
    POST /sessione/fine {sessione}        → consolida la sessione
    GET  /stato                           → memoria, obiettivi, lacune, capacita'
    GET  /memoria      ?q=…               → i ricordi che corrispondono, con la spiegazione del punteggio (l'utente puo' sempre guardare)
    DELETE /memoria/<id>                  → cancella un ricordo
    GET  /eventi       ?dispositivo=…&dopo=N → (attesa lunga) cio' che e' successo altrove: un turno su un altro dispositivo,
                                             un promemoria, un'iniziativa. Ogni evento dice su quale dispositivo PARLARE.
    GET  /             → il client web (una pagina sola: funziona su computer, Android e iPhone)
    GET  /strumenti/attesa ?client=…      → (attesa lunga) la prossima chiamata a uno strumento che deve eseguire il CLIENT
    POST /strumenti/esito {id, esito}     → il risultato di quella chiamata

IL RELE' DEGLI STRUMENTI. Alcuni strumenti di Spectra non si possono eseguire
sul server: aprire una sezione di BioSpecInfo succede nel browser dell'utente,
scattare una foto succede negli occhiali. Il client li DICHIARA quando si
collega (POST /strumenti/registra) e resta in attesa; quando il modello ne
chiama uno, il servizio mette la chiamata in coda, il client la esegue e manda
l'esito. Se nessun client risponde entro il tempo dato, il modello riceve
«nessun dispositivo collegato» e ne tiene conto.

SICUREZZA. Ogni richiesta porta un gettone (Authorization: Bearer …),
confrontato a tempo costante. Senza gettone configurato il servizio ascolta
solo su 127.0.0.1. Fuori casa si raggiunge attraverso una rete privata
(Tailscale, WireGuard) o un tunnel con HTTPS: questo servizio non termina TLS
e non va esposto nudo su Internet.

Solo libreria standard: nessuna dipendenza da installare per farlo partire.
"""
from __future__ import annotations

import base64
import hmac
import json
import os
import queue
import threading
import time
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

from .cervello import Spectra
from .fornitori import ErroreFornitore, Strumento
from .voce import PARAMETRI_CLIENT, Voce

MAX_CORPO = 12 * 1024 * 1024        # una foto dagli occhiali sta larga in 12 MB; oltre si rifiuta


class Rele:
    """La coda delle chiamate agli strumenti che deve eseguire un client (l'app nel browser, il ponte degli occhiali)."""

    def __init__(self, attesa: float = 25.0):
        self.attesa = attesa
        self._lucchetto = threading.Lock()
        self.strumenti: dict[str, tuple[Strumento, str]] = {}      # nome → (strumento, client che lo offre)
        self._code: dict[str, "queue.Queue[dict]"] = {}
        self._esiti: dict[str, "queue.Queue[str]"] = {}
        self._visto: dict[str, float] = {}

    def registra(self, client: str, strumenti: list[dict]) -> int:
        with self._lucchetto:
            self.strumenti = {n: v for n, v in self.strumenti.items() if v[1] != client}
            for s in strumenti:
                if not isinstance(s, dict) or not str(s.get("nome", "")).replace("_", "").isalnum():
                    continue
                schema = s.get("schema") if isinstance(s.get("schema"), dict) else {"type": "object", "properties": {}}
                self.strumenti[s["nome"]] = (Strumento(s["nome"], str(s.get("descrizione", ""))[:600], schema), client)
            self._code.setdefault(client, queue.Queue())
            self._visto[client] = time.time()
            return sum(1 for v in self.strumenti.values() if v[1] == client)

    def disponibili(self) -> list[Strumento]:
        """Solo gli strumenti dei client che si sono fatti vivi di recente: uno strumento di un client spento non si offre al modello."""
        ora = time.time()
        with self._lucchetto:
            return [s for s, c in self.strumenti.values() if ora - self._visto.get(c, 0) < 90]

    def prossima(self, client: str, attesa: float) -> dict | None:
        with self._lucchetto:
            coda = self._code.setdefault(client, queue.Queue())
            self._visto[client] = time.time()
        try:
            return coda.get(timeout=attesa)
        except queue.Empty:
            return None

    def esito(self, ident: str, esito: str) -> bool:
        with self._lucchetto:
            q = self._esiti.get(ident)
        if q is None:
            return False
        q.put(esito)
        return True

    def esegui(self, nome: str, argomenti: dict) -> str:
        with self._lucchetto:
            voce = self.strumenti.get(nome)
            if not voce:
                raise ValueError(f"strumento sconosciuto: {nome}")
            ident = uuid.uuid4().hex
            self._esiti[ident] = queue.Queue(maxsize=1)
            self._code.setdefault(voce[1], queue.Queue()).put({"id": ident, "nome": nome, "argomenti": argomenti})
        try:
            return self._esiti[ident].get(timeout=self.attesa)
        except queue.Empty:
            return "nessun dispositivo collegato ha eseguito lo strumento: l'app o gli occhiali non sono raggiungibili adesso"
        finally:
            with self._lucchetto:
                self._esiti.pop(ident, None)


def crea_gestore(spectra: Spectra, rele: Rele, voce: Voce, gettone: str | None, origini: tuple[str, ...] = ()):
    blocco_turni = threading.Lock()         # un turno alla volta: la memoria di lavoro e' una, e i turni non si accavallano

    class Gestore(BaseHTTPRequestHandler):
        server_version = "Spectra/2.0"

        def log_message(self, *a):          # niente righe con il contenuto delle richieste nei registri
            pass

        # ── aiuti ──
        def _statico(self, nome: str) -> None:
            """Il client web: file fissi, senza gettone (non contengono segreti; il gettone lo inserisce l'utente nella pagina)."""
            tipi = {".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/manifest+json", ".svg": "image/svg+xml", ".png": "image/png"}
            radice = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "client")
            percorso = os.path.normpath(os.path.join(radice, nome))
            est = os.path.splitext(percorso)[1]
            if not percorso.startswith(radice + os.sep) or est not in tipi or not os.path.isfile(percorso):
                return self._rispondi(404, {"errore": "non trovato"})
            with open(percorso, "rb") as f:
                corpo = f.read()
            self.send_response(200)
            self.send_header("Content-Type", tipi[est]); self.send_header("Content-Length", str(len(corpo))); self.send_header("Cache-Control", "no-cache")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.end_headers(); self.wfile.write(corpo)

        def _autorizzato(self) -> bool:
            if not gettone:
                return self.client_address[0] in ("127.0.0.1", "::1")
            dato = (self.headers.get("Authorization") or "").removeprefix("Bearer ").strip()
            return hmac.compare_digest(dato.encode(), gettone.encode())

        def _rispondi(self, stato: int, dati) -> None:
            corpo = json.dumps(dati, ensure_ascii=False).encode("utf-8")
            self.send_response(stato)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(corpo)))
            self.send_header("Cache-Control", "no-store")
            origine = self.headers.get("Origin")
            if origine and origine in origini:      # solo le origini dichiarate (l'indirizzo dell'app), mai «*» con un gettone
                self.send_header("Access-Control-Allow-Origin", origine)
                self.send_header("Vary", "Origin")
            self.end_headers()
            self.wfile.write(corpo)

        def _corpo(self) -> dict:
            n = int(self.headers.get("Content-Length") or 0)
            if n > MAX_CORPO:
                raise ValueError("richiesta troppo grande")
            d = json.loads(self.rfile.read(n) or b"{}")
            if not isinstance(d, dict):
                raise ValueError("il corpo deve essere un oggetto JSON")
            return d

        def do_OPTIONS(self):
            origine = self.headers.get("Origin")
            self.send_response(204)
            if origine and origine in origini:
                self.send_header("Access-Control-Allow-Origin", origine)
                self.send_header("Access-Control-Allow-Headers", "Authorization, Content-Type")
                self.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
            self.end_headers()

        # ── le strade ──
        def _instrada(self, metodo: str) -> None:
            strada = urlparse(self.path).path
            if metodo == "GET" and (strada == "/" or strada.startswith("/client/")):
                return self._statico("index.html" if strada == "/" else strada[len("/client/"):])
            if not self._autorizzato():
                return self._rispondi(401, {"errore": "non autorizzato"})
            u = urlparse(self.path); q = {k: v[0] for k, v in parse_qs(u.query).items()}
            try:
                if metodo == "GET" and u.path == "/stato":
                    return self._rispondi(200, dict(spectra.stato(), voce=voce.strada(), strumenti_esterni=[s.nome for s in rele.disponibili()]))
                if metodo == "GET" and u.path == "/iniziativa":
                    return self._rispondi(200, {"frase": spectra.iniziativa(q.get("sessione", "principale"))})
                if metodo == "GET" and u.path == "/memoria":
                    tr = spectra.recupero.cerca(q.get("q", ""), k=min(30, int(q.get("k", 10))), rinforza=False)
                    return self._rispondi(200, {"ricordi": [{"id": t.ricordo.id, "tipo": t.ricordo.tipo, "testo": t.ricordo.mostra(), "creato": t.ricordo.creato,
                                                             "fiducia": t.ricordo.fiducia, "punteggio": round(t.punteggio, 3), "perche": {k: round(v, 3) for k, v in t.parti.items()}, "via": t.via} for t in tr]})
                if metodo == "GET" and u.path == "/eventi":
                    disp = q.get("dispositivo", "anonimo")
                    dopo = int(q["dopo"]) if q.get("dopo", "").lstrip("-").isdigit() and int(q["dopo"]) >= 0 else spectra.presenza.ultimo()
                    ev = spectra.presenza.attendi(disp, dopo, min(25.0, float(q.get("attesa", 20))), q.get("tipo", "browser"))
                    return self._rispondi(200, {"eventi": ev, "ultimo": ev[-1]["n"] if ev else dopo, "parla": spectra.presenza.dove_parlare() == disp})
                if metodo == "GET" and u.path == "/agenda":
                    return self._rispondi(200, {"impegni": [{"id": i.id, "genere": i.genere, "testo": i.testo, "quando": i.quando, "stato": i.stato, "ripeti": i.ripeti} for i in spectra.agenda.aperti()]})
                if metodo == "GET" and u.path == "/strumenti/attesa":
                    return self._rispondi(200, {"chiamata": rele.prossima(q.get("client", "app"), min(25.0, float(q.get("attesa", 20))))})
                d = self._corpo() if metodo == "POST" else {}
                if metodo == "POST" and u.path == "/turno":
                    immagini = [i for i in d.get("immagini", []) if isinstance(i, dict) and i.get("mime", "").startswith("image/") and i.get("b64")][:4]
                    for i in immagini:
                        base64.b64decode(i["b64"], validate=True)       # un'immagine che non e' base64 valido si rifiuta qui, non dal fornitore
                    spectra.esterni = rele.disponibili()
                    with blocco_turni:
                        e = spectra.turno(str(d.get("testo", "")), sessione=str(d.get("sessione", "principale")), canale=str(d.get("canale", "testo")),
                                          immagini=immagini, contesto=d.get("contesto") if isinstance(d.get("contesto"), dict) else None,
                                          dispositivo=str(d["dispositivo"])[:80] if d.get("dispositivo") else None, tipo_dispositivo=str(d.get("tipo", "browser")))
                    out = {"testo": e.testo, "voce": e.per_la_voce, "modo": e.modo, "lacuna": bool(e.lacuna), "fornitore": e.risposta.fornitore,
                           "strumenti": [x["nome"] for x in e.risposta.strumenti_usati], "parametri_voce": PARAMETRI_CLIENT}
                    if d.get("audio"):
                        wav = voce.sintetizza(e.per_la_voce)
                        if wav:
                            out["audio"] = {"mime": "audio/wav", "b64": base64.b64encode(wav).decode()}
                    return self._rispondi(200, out)
                if metodo == "POST" and u.path == "/sessione/fine":
                    return self._rispondi(200, spectra.fine_sessione(str(d.get("sessione", "principale"))))
                if metodo == "POST" and u.path == "/strumenti/registra":
                    return self._rispondi(200, {"registrati": rele.registra(str(d.get("client", "app")), d.get("strumenti", []))})
                if metodo == "POST" and u.path == "/strumenti/esito":
                    return self._rispondi(200, {"ok": rele.esito(str(d.get("id", "")), str(d.get("esito", ""))[:20000])})
                if metodo == "DELETE" and u.path.startswith("/memoria/"):
                    spectra.a.cancella(u.path.rsplit("/", 1)[1], "richiesta dell'utente dal servizio")
                    return self._rispondi(200, {"ok": True})
                return self._rispondi(404, {"errore": "strada sconosciuta"})
            except ErroreFornitore as e:
                return self._rispondi(503, {"errore": "nessun modello ha risposto", "dettaglio": str(e)[:300]})
            except (ValueError, KeyError, json.JSONDecodeError) as e:
                return self._rispondi(400, {"errore": str(e)[:300]})

        def do_GET(self): self._instrada("GET")
        def do_POST(self): self._instrada("POST")
        def do_DELETE(self): self._instrada("DELETE")

    return Gestore


def avvia_notturno(spectra: Spectra, ora: int = 3) -> threading.Thread:
    """Un filo che ogni notte, all'ora data, fa girare la cura della memoria. Se il servizio era spento a quell'ora, la fa al primo avvio utile."""
    def giro():
        ultimo = None
        while True:
            t = time.localtime()
            if t.tm_hour >= ora and ultimo != t.tm_yday:
                try:
                    spectra.notte()
                except Exception as e:      # la cura non deve mai fermare il servizio
                    spectra.a.annota("notte_fallita", errore=str(e)[:300])
                ultimo = t.tm_yday
            time.sleep(600)
    f = threading.Thread(target=giro, name="spectra-notte", daemon=True)
    f.start()
    return f


def avvia_battito(spectra: Spectra, ogni: float = 30.0) -> threading.Thread:
    """Il battito: ogni mezzo minuto Spectra si chiede se c'e' qualcosa da dire (un promemoria giunto all'ora, un'iniziativa).
    Se si', lo pubblica come evento: arriva a tutti i dispositivi collegati, e UNO solo lo dice a voce. E' cio' che lo fa esistere
    anche quando nessuno gli sta parlando."""
    def giro():
        while True:
            time.sleep(ogni)
            try:
                frase = spectra.iniziativa("principale")
                if frase:
                    spectra.presenza.pubblica("promemoria" if frase.split(":")[0] in ("Promemoria", "Scadenza", "Evento") else "iniziativa",
                                              {"frase": frase, "parla_su": spectra.presenza.dove_parlare()})
            except Exception as e:      # il battito non si ferma per un errore
                spectra.a.annota("battito_fallito", errore=str(e)[:300])
    f = threading.Thread(target=giro, name="spectra-battito", daemon=True)
    f.start()
    return f


def servi(spectra: Spectra, *, porta: int = 8787, gettone: str | None = None, origini: tuple[str, ...] = (), notturno: bool = True, battito: float | None = None) -> ThreadingHTTPServer:
    rele = Rele()
    spectra.esegui_esterno = rele.esegui
    indirizzo = "0.0.0.0" if gettone else "127.0.0.1"      # senza gettone, solo dalla macchina stessa
    srv = ThreadingHTTPServer((indirizzo, porta), crea_gestore(spectra, rele, Voce(), gettone, origini))
    srv.rele = rele
    if notturno:
        avvia_notturno(spectra)
    if battito:
        avvia_battito(spectra, battito)
    return srv


def principale() -> None:
    from .configurazione import orchestratore_dall_ambiente, percorso_db
    from .memoria import Archivio
    archivio = Archivio(percorso_db())
    spectra = Spectra(archivio, orchestratore_dall_ambiente(annota=archivio.annota))
    gettone = os.environ.get("SPECTRA_GETTONE") or None
    origini = tuple(o.strip() for o in os.environ.get("SPECTRA_ORIGINI", "").split(",") if o.strip())
    srv = servi(spectra, porta=int(os.environ.get("SPECTRA_PORTA", "8787")), gettone=gettone, origini=origini, battito=30.0)
    print(f"Spectra in ascolto su {srv.server_address[0]}:{srv.server_address[1]}" + ("" if gettone else " (solo locale: nessun gettone impostato)"))
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        archivio.chiudi()


if __name__ == "__main__":
    principale()
