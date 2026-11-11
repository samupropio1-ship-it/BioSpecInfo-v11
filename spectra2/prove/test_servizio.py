"""Le prove del servizio: un server vero su una porta libera, un fornitore finto, richieste HTTP vere.  python3 -m unittest discover -s prove -v"""
import json, os, sys, threading, unittest, urllib.error, urllib.request
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from spectra.cervello import Spectra
from spectra.fornitori import Orchestratore
from spectra.memoria import Archivio
from spectra.servizio import servi
from test_cervello import Finto

GETTONE = "gettone-di-prova"


class Servizio(unittest.TestCase):
    def setUp(self):
        self.f = Finto(copione=[])
        self.s = Spectra(Archivio(":memory:"), Orchestratore([self.f]))
        self.srv = servi(self.s, porta=0, gettone=GETTONE, origini=("https://app.example",), notturno=False)
        self.srv.rele.attesa = 3.0
        self.base = f"http://127.0.0.1:{self.srv.server_address[1]}"
        threading.Thread(target=self.srv.serve_forever, daemon=True).start()

    def tearDown(self):
        self.srv.shutdown(); self.srv.server_close()

    def chiama(self, metodo, strada, corpo=None, gettone=GETTONE, intest=None):
        h = {"Content-Type": "application/json", **(intest or {})}
        if gettone:
            h["Authorization"] = "Bearer " + gettone
        r = urllib.request.Request(self.base + strada, json.dumps(corpo).encode() if corpo is not None else None, h, method=metodo)
        try:
            with urllib.request.urlopen(r, timeout=20) as x:
                return x.status, json.load(x), dict(x.headers)
        except urllib.error.HTTPError as e:
            return e.code, json.load(e), dict(e.headers)

    def test_gettone(self):
        self.assertEqual(self.chiama("GET", "/stato", gettone=None)[0], 401)
        self.assertEqual(self.chiama("GET", "/stato", gettone="sbagliato")[0], 401)
        self.assertEqual(self.chiama("GET", "/stato")[0], 200)

    def test_turno_e_memoria(self):
        self.f.copione = ["Il pKa è 4,76."]
        st, d, _ = self.chiama("POST", "/turno", {"testo": "Quanto vale il pKa dell'acido acetico?", "canale": "voce"})
        self.assertEqual(st, 200); self.assertEqual(d["testo"], "Il pKa è 4,76."); self.assertEqual(d["modo"], "fatto")
        self.assertEqual(d["parametri_voce"]["pitch"], 0.58); self.assertIn("pi-kappa-a", d["voce"])
        st, m, _ = self.chiama("GET", "/memoria?q=pKa%20acido%20acetico")
        self.assertEqual(len(m["ricordi"]), 1); self.assertIn("rilevanza", m["ricordi"][0]["perche"])     # l'utente vede perche' un ricordo e' stato scelto
        self.assertEqual(self.chiama("DELETE", "/memoria/" + m["ricordi"][0]["id"])[0], 200)
        self.assertEqual(self.chiama("GET", "/memoria?q=pKa%20acido%20acetico")[1]["ricordi"], [])

    def test_errori(self):
        self.assertEqual(self.chiama("POST", "/turno", {"testo": ""})[0], 400)
        self.assertEqual(self.chiama("POST", "/turno", {"testo": "guarda", "immagini": [{"mime": "image/jpeg", "b64": "non è base64!!"}]})[0], 400)
        self.assertEqual(self.chiama("GET", "/non-esiste")[0], 404)

    def test_origini(self):
        _, _, h = self.chiama("GET", "/stato", intest={"Origin": "https://app.example"})
        self.assertEqual(h.get("Access-Control-Allow-Origin"), "https://app.example")
        _, _, h = self.chiama("GET", "/stato", intest={"Origin": "https://altro.example"})
        self.assertIsNone(h.get("Access-Control-Allow-Origin"))

    def test_rele_degli_strumenti(self):
        """Il modello chiama «apri_sezione»; lo strumento vive nel client (l'app): il servizio lo mette in coda, il client lo esegue e risponde."""
        st, d, _ = self.chiama("POST", "/strumenti/registra", {"client": "app", "strumenti": [
            {"nome": "apri_sezione", "descrizione": "apre una sezione di BioSpecInfo", "schema": {"type": "object", "properties": {"id": {"type": "string"}}, "required": ["id"]}},
            {"nome": "nome non valido!", "descrizione": "x"}]})
        self.assertEqual(d["registrati"], 1)
        self.assertEqual(self.chiama("GET", "/stato")[1]["strumenti_esterni"], ["apri_sezione"])
        self.f.copione = [("apri_sezione", {"id": "sirvis"}), "Aperta."]
        viste = []

        def client():
            _, c, _ = self.chiama("GET", "/strumenti/attesa?client=app&attesa=10")
            viste.append(c["chiamata"])
            self.chiama("POST", "/strumenti/esito", {"id": c["chiamata"]["id"], "esito": "sezione «IR Visivi» aperta"})
        t = threading.Thread(target=client); t.start()
        st, d, _ = self.chiama("POST", "/turno", {"testo": "Aprimi gli spettri IR."})
        t.join(15)
        self.assertEqual(st, 200); self.assertEqual(d["strumenti"], ["apri_sezione"]); self.assertEqual(viste[0]["argomenti"], {"id": "sirvis"})
        self.assertEqual(self.f.visti[-1]["strumenti"].count("apri_sezione"), 1)

    def test_rele_senza_client(self):
        self.chiama("POST", "/strumenti/registra", {"client": "occhiali", "strumenti": [{"nome": "scatta_foto", "descrizione": "x", "schema": {"type": "object", "properties": {}}}]})
        self.f.copione = [("scatta_foto", {}), "Gli occhiali non rispondono."]
        st, d, _ = self.chiama("POST", "/turno", {"testo": "Cosa sto guardando?"})
        self.assertEqual(st, 200); self.assertEqual(d["testo"], "Gli occhiali non rispondono.")   # nessun client: il modello lo sa e lo dice, il turno non si blocca

    def test_iniziativa_e_fine_sessione(self):
        self.assertIsNone(self.chiama("GET", "/iniziativa")[1]["frase"])
        self.f.copione = ["Bene."]
        self.chiama("POST", "/turno", {"testo": "Sto preparando l'esame di Chimica Organica 2 del 12 febbraio.", "sessione": "s1"})
        st, d, _ = self.chiama("POST", "/sessione/fine", {"sessione": "s1"})
        self.assertEqual(st, 200); self.assertEqual(d["episodi"], 1)


if __name__ == "__main__":
    unittest.main(verbosity=2)
