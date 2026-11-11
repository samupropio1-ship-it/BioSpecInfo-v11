"""La prova del ponte, da un capo all'altro: il servizio Python vero, il client JavaScript vero (in Node, con un'app finta),
un fornitore finto che chiama gli strumenti dell'app. Salta se Node non c'e'.  python3 -m unittest discover -s prove -v"""
import json, os, shutil, subprocess, sys, threading, unittest, urllib.request
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from spectra.cervello import Spectra
from spectra.fornitori import Orchestratore
from spectra.memoria import Archivio
from spectra.servizio import servi
from test_cervello import Finto

QUI = os.path.dirname(os.path.abspath(__file__))


@unittest.skipUnless(shutil.which("node"), "Node non installato")
class Ponte(unittest.TestCase):
    def test_da_un_capo_all_altro(self):
        f = Finto(copione=[("cerca_sezione", {"domanda": "IR"}), ("apri_sezione", {"id": "sirvis"}), ("leggi_schermo", {}), "Ho aperto gli spettri IR: la banda è a 1715."])
        s = Spectra(Archivio(":memory:"), Orchestratore([f]))
        srv = servi(s, porta=0, gettone="g", notturno=False); srv.rele.attesa = 10.0
        threading.Thread(target=srv.serve_forever, daemon=True).start()
        base = f"http://127.0.0.1:{srv.server_address[1]}"
        p = subprocess.Popen(["node", os.path.join(QUI, "ponte_client.js"), base, "g"], stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
        try:
            riga = p.stdout.readline()
            self.assertTrue(riga.startswith("PRONTO "), riga)
            d = json.loads(riga[7:])
            self.assertEqual(sorted(d["webmcp"]), sorted(["cerca_sezione", "apri_sezione", "risolvi_esercizio", "spettro_di_riferimento", "leggi_schermo", "stato_dello_studio"]))
            self.assertTrue(d["forma"])                                                       # ogni strumento WebMCP ha nome, descrizione, schema, funzione
            self.assertIn("sastroorbite", d["webmcpEsito"]["content"][0]["text"])             # e risponde nel formato dei contenuti MCP
            self.assertIn("manca «id»", d["nonValidi"]); self.assertIn("sconosciuto", d["sconosciuto"]); self.assertIn("campo sconosciuto", d["campoInPiu"])
            self.assertIn("RISULTATO pH = 2", d["esercizio"]); self.assertTrue(d["stato"]["webmcp"]); self.assertTrue(d["stato"]["rele"])
            # il cervello ora vede gli strumenti dell'app e li usa attraverso il rele'
            r = urllib.request.Request(base + "/turno", json.dumps({"testo": "Aprimi gli spettri IR e dimmi cosa c'è."}).encode(), {"Content-Type": "application/json", "Authorization": "Bearer g"})
            with urllib.request.urlopen(r, timeout=30) as x:
                out = json.load(x)
            self.assertEqual(out["strumenti"], ["cerca_sezione", "apri_sezione", "leggi_schermo"])
            usati = f.visti[-1]["strumenti"]
            self.assertIn("apri_sezione", usati); self.assertIn("ricorda", usati)             # strumenti dell'app e della memoria, insieme
            p.stdin.write("fine\n"); p.stdin.flush()
            self.assertEqual(json.loads(p.stdout.readline()[7:]), ["sirvis"])                 # la sezione e' stata aperta davvero, nell'app
        finally:
            p.kill(); srv.shutdown(); srv.server_close()


if __name__ == "__main__":
    unittest.main(verbosity=2)
