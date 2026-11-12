"""La prova del client web in un browser vero (Chromium, con Playwright): un computer e un iPhone sulla stessa conversazione,
il promemoria detto da un solo dispositivo, il nome «Spectra» come parola di attivazione. Salta se Node o Playwright mancano."""
import json, os, shutil, subprocess, sys, threading, time, unittest
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from spectra.cervello import Spectra
from spectra.fornitori import Orchestratore
from spectra.memoria import Archivio
from spectra.servizio import servi
from test_cervello import Finto

QUI = os.path.dirname(os.path.abspath(__file__))


def _playwright():
    if not shutil.which("node"):
        return False
    return subprocess.run(["node", "-e", "require('playwright')"], capture_output=True).returncode == 0


@unittest.skipUnless(_playwright(), "Node o Playwright non installati")
class Client(unittest.TestCase):
    def test_due_dispositivi_nel_browser(self):
        f = Finto(copione=["Il pKa è 4,76. A 25 gradi.", "Del pKa dell'acido acetico.", "Quattro.", "Aperta."])
        s = Spectra(Archivio(":memory:"), Orchestratore([f]))
        srv = servi(s, porta=0, gettone="g", notturno=False, battito=0.3)
        threading.Thread(target=srv.serve_forever, daemon=True).start()
        p = subprocess.Popen(["node", os.path.join(QUI, "client_browser.js"), f"http://127.0.0.1:{srv.server_address[1]}"], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True)
        try:
            riga = p.stdout.readline()
            self.assertEqual(riga.strip(), "PROMEMORIA", riga)
            s.agenda.aggiungi("uscire per il laboratorio", quando=time.time() - 1)
            p.stdin.write("ok\n"); p.stdin.flush()
            riga = p.stdout.readline()
            self.assertTrue(riga.startswith("ESITO "), riga)
            d = json.loads(riga[6:])
            self.assertEqual(d["errori"], [])
            self.assertEqual(d["nome"], ["che ore sono?", "", None, "quanto pesa il benzene", "Apri la tavola periodica", "cos’è un chetone", None, "apri astro", None])
            self.assertEqual(d["tipi"], ["iphone", "android", "computer"])
            self.assertEqual(d["telefono"], {"largo": True, "imp": False, "tasto": True, "manifesto": True})
            # 1. il turno fatto al computer: lì si legge e si sente, sul telefono si legge soltanto
            self.assertEqual(d["uno"]["pc"], ["Quanto vale il pKa dell'acido acetico?", "Il pKa è 4,76. A 25 gradi."])
            self.assertEqual(d["uno"]["tel"], d["uno"]["pc"]); self.assertEqual(d["uno"]["dettoTel"], [])
            self.assertEqual(d["uno"]["dettoPc"], ["Il pi-kappa-a è 4,76.", "A 25 gradi."])       # a voce le sigle si dicono a parole, una frase alla volta
            self.assertEqual((d["uno"]["voce"]["pitch"], d["uno"]["voce"]["rate"], d["uno"]["voce"]["lang"]), (0.58, 0.88, "it-IT"))
            # 2. dal telefono: stessa conversazione, e il modello ha ricevuto il turno del computer e il cambio di dispositivo
            self.assertEqual(d["due"]["tel"], d["due"]["pc"]); self.assertEqual(d["due"]["tel"][1], "Del pKa dell'acido acetico.")
            m = f.visti[1]["messaggi"]
            self.assertIn("pKa dell'acido acetico", m[0]["testo"]); self.assertIn("[CONTINUITÀ]", m[-1]["testo"])
            self.assertEqual(sorted(x["id"] for x in s.presenza.dispositivi()), ["pc", "tel"])
            # 3. il promemoria: lo vedono tutti, lo dice solo il telefono (l'ultimo usato)
            self.assertIn("uscire per il laboratorio", d["tre"]["testo"]); self.assertTrue(d["tre"]["dettoTel"]); self.assertEqual(d["tre"]["dettoPc"], [])
            # 4. il nome
            q = d["quattro"]
            self.assertEqual((q["premuto"], q["continuo"], q["ignorata"]), ("true", True, 2))                # la frase senza il nome non ha aggiunto nulla
            self.assertEqual((q["comando"], q["risposta"], q["si"], q["dopoIlNome"]), ("quanto fa due più due", "Quattro.", "Sì.", "apri la tavola periodica"))
            self.assertEqual(f.visti[2]["sforzo"], "low")                                         # a voce: risposta rapida
            self.assertEqual(d["cinque"], "gettone non valido")
        finally:
            p.kill(); srv.shutdown(); srv.server_close()


if __name__ == "__main__":
    unittest.main(verbosity=2)
