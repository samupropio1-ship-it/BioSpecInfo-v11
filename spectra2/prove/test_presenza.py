"""Le prove dell'agenda, della continuita' e della presenza su piu' dispositivi.  python3 -m unittest discover -s prove -v"""
import datetime as dt, json, os, sys, threading, time, unittest, urllib.request
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from spectra.cervello import Spectra
from spectra.fornitori import Orchestratore
from spectra.memoria import Archivio
from spectra.memoria.agenda import Agenda, capisci_quando
from spectra.presenza import Presenza
from spectra.servizio import servi
from test_cervello import Finto

MER = dt.datetime(2026, 11, 11, 14, 0).timestamp()       # un mercoledi', alle 14
ORA = 3600.0


def f(q):
    return dt.datetime.fromtimestamp(q).strftime("%a %d/%m/%Y %H:%M")


class Date(unittest.TestCase):
    def test_parole(self):
        casi = {"fra 2 ore": "Wed 11/11/2026 16:00", "tra mezz'ora": "Wed 11/11/2026 14:30", "domani alle 18": "Thu 12/11/2026 18:00",
                "venerdì alle 9:30": "Fri 13/11/2026 09:30", "stasera": "Wed 11/11/2026 20:00", "il 12 febbraio alle 9": "Fri 12/02/2027 09:00",
                "2026-12-01T08:15": "Tue 01/12/2026 08:15", "2026-12-01": "Tue 01/12/2026 09:00", "alle 10": "Thu 12/11/2026 10:00",
                "alle 16": "Wed 11/11/2026 16:00", "dopodomani mattina": "Fri 13/11/2026 09:00", "mercoledì": "Wed 18/11/2026 09:00", "alle 6 di sera": "Wed 11/11/2026 18:00"}
        for testo, atteso in casi.items():
            self.assertEqual(f(capisci_quando(testo, MER)), atteso, testo)
        for testo in ("boh", "", "quando capita", "il 31 febbraio"):
            self.assertIsNone(capisci_quando(testo, MER), testo)      # una data non capita resta non capita: mai inventata


class Impegni(unittest.TestCase):
    def setUp(self):
        self.g = Agenda(Archivio(":memory:"))

    def test_promemoria_e_avviso(self):
        i = self.g.aggiungi("chiamare il relatore", quando="alle 18", anticipo_minuti=15, ora=MER)
        self.assertEqual(self.g.da_avvisare(MER), [])
        self.assertEqual([x.id for x in self.g.da_avvisare(MER + 3.8 * ORA)], [i.id])        # 17:48: dentro l'anticipo di 15 minuti
        self.g.segna_avvisato(i.id)
        self.assertEqual(self.g.da_avvisare(MER + 5 * ORA), [])                                # detto una volta, non si ripete
        self.assertEqual(len(self.g.aperti()), 1)                                              # ma resta aperto finche' non e' fatto
        with self.assertRaises(ValueError):
            self.g.aggiungi("un promemoria senza ora")
        with self.assertRaises(ValueError):
            self.g.aggiungi("data assurda", quando="quando capita")

    def test_ricorrenza(self):
        i = self.g.aggiungi("ripasso delle flashcard", quando="alle 21", ripeti="giorno", ora=MER)
        prossimo = self.g.completa(i.id, ora=MER + 8 * ORA)
        self.assertEqual(f(prossimo.quando), "Thu 12/11/2026 21:00"); self.assertEqual(self.g.leggi(i.id).stato, "fatto")
        saltati = self.g.completa(prossimo.id, ora=MER + 5 * 86400)                            # completato con giorni di ritardo: il prossimo e' nel futuro
        self.assertGreater(saltati.quando, MER + 5 * 86400)
        m = self.g.aggiungi("affitto", genere="compito", quando="2027-01-31T10:00", ripeti="mese")
        self.assertEqual(f(self.g.completa(m.id, ora=MER).quando), "Sun 28/02/2027 10:00")     # il 31 non esiste a febbraio: l'ultimo giorno

    def test_trova_rimanda_annulla_estratto(self):
        a = self.g.aggiungi("consegnare la relazione di laboratorio", genere="compito", quando="venerdì alle 12", ora=MER)
        b = self.g.aggiungi("comprare i guanti in nitrile", genere="compito")
        self.assertEqual([x.id for x in self.g.trova("relazione laboratorio")], [a.id])
        self.assertEqual(f(self.g.rimanda(a.id, "lunedì alle 9", ora=MER).quando), "Mon 16/11/2026 09:00")
        e = self.g.estratto(MER + 4.5 * 86400)
        self.assertIn("consegnare la relazione", e); self.assertIn("guanti", e); self.assertTrue(e.splitlines()[0].startswith("- "))
        self.assertTrue(self.g.estratto(MER + 6 * 86400).startswith("! "))                     # scaduto: segnato
        self.g.annulla(b.id); self.assertEqual(len(self.g.aperti()), 1)


class Continuita(unittest.TestCase):
    def setUp(self):
        self.fornitore = Finto(copione=[])
        self.s = Spectra(Archivio(":memory:"), Orchestratore([self.fornitore]))

    def test_il_primo_incontro_e_il_ritorno(self):
        self.assertIn("prima conversazione", self.s.presenza.blocco("principale", "testo"))
        self.fornitore.copione = ["Va bene."]
        self.s.turno("Sto studiando la Diels-Alder per l'esame.", canale="testo", dispositivo="pc", tipo_dispositivo="computer")
        t = time.time()
        c = self.s.presenza.continuita("principale", ora=t + 14 * ORA)
        self.assertAlmostEqual(c["passato"] / ORA, 14, delta=0.1); self.assertTrue(c["ritorno"]); self.assertIn("Diels-Alder", c["filo"])
        b = self.s.presenza.blocco("principale", "occhiali", ora=t + 14 * ORA)
        self.assertIn("14 ore", b); self.assertIn("Prima era su «testo», ora è su «occhiali»", b); self.assertIn("Non salutare come se fosse la prima volta", b)
        self.assertNotIn("ritorno dopo ore", self.s.presenza.blocco("principale", "testo", ora=t + 600))   # dieci minuti dopo non e' un ritorno

    def test_che_cosa_ha_fatto_nel_frattempo(self):
        for i in range(5):
            self.s.a.scrivi("episodio", f"Samuele ha lavorato alla tesi su BioSpecInfo, capitolo {i} sugli spettri NMR.", importanza=0.7, sessione="principale", quando=time.time() - 3600)
        self.s.a.lavoro_aggiungi("principale", "utente", "A domani.")
        self.s.notte()
        b = self.s.presenza.blocco("principale", "testo", ora=time.time() + 9 * ORA)
        self.assertIn("Nel frattempo, da solo", b); self.assertIn("consolidato la memoria", b); self.assertIn("diario", b)

    def test_il_blocco_arriva_al_modello_con_l_agenda(self):
        self.s.agenda.aggiungi("ricevimento con il relatore", genere="evento", quando=time.time() + 2 * ORA)
        self.fornitore.copione = ["Sì."]
        self.s.turno("Ci sei?")
        ultimo = self.fornitore.visti[-1]["messaggi"][-1]["testo"]
        self.assertLess(ultimo.index("[CONTINUITÀ]"), ultimo.index("[IO]")); self.assertIn("[AGENDA]", ultimo); self.assertIn("ricevimento con il relatore", ultimo)

    def test_strumenti_dell_agenda(self):
        self.fornitore.copione = [("segna_impegno", {"testo": "chiamare il relatore", "genere": "promemoria", "quando": "fra 2 ore"}),
                                  ("segna_impegno", {"testo": "data sbagliata", "genere": "promemoria", "quando": "quando capita"}), "Segnato."]
        e = self.s.turno("Ricordami fra due ore di chiamare il relatore.")
        self.assertEqual(len(self.s.agenda.aperti()), 1)
        self.assertIn("non capisco quando", e.risposta.strumenti_usati[1]["esito"])              # l'errore torna al modello, che puo' chiedere
        self.fornitore.copione = [("chiudi_impegno", {"cosa": "relatore", "azione": "fatto"}), ("leggi_agenda", {}), "Fatto."]
        e = self.s.turno("Ho chiamato il relatore.")
        self.assertEqual(self.s.agenda.aperti(), []); self.assertEqual(e.risposta.strumenti_usati[1]["esito"], "niente in agenda")

    def test_il_promemoria_arriva_anche_dopo_non_ora(self):
        self.fornitore.copione = ["D'accordo."]
        self.s.turno("Non ora, sto studiando.")
        self.s.obiettivi.crea("Consegnare la tesi", orizzonte="mese", scadenza=time.time() + 86400)
        self.assertIsNone(self.s.iniziativa())                                                   # l'iniziativa tace…
        self.s.agenda.aggiungi("prendere la pastiglia", quando=time.time() - 5)
        frase = self.s.iniziativa()
        self.assertTrue(frase.startswith("Promemoria: prendere la pastiglia"))                   # …il promemoria no: lo ha chiesto lui
        self.assertIsNone(self.s.iniziativa())                                                   # una volta sola


class PiuDispositivi(unittest.TestCase):
    def setUp(self):
        self.p = Presenza(Archivio(":memory:"))

    def test_dove_parlare(self):
        t = time.time()
        self.assertIsNone(self.p.dove_parlare())
        self.p.tocca("pc", "computer", ora=t - 30); self.p.tocca("tel", "android", ora=t - 20, uso=True); self.p.tocca("occhiali", "occhiali", ora=t - 10)
        self.assertEqual(self.p.dove_parlare(t), "tel")                                          # l'ultimo USATO, non l'ultimo visto
        self.p.tocca("pc", "computer", ora=t, uso=True)
        self.assertEqual(self.p.dove_parlare(t), "pc")
        self.assertEqual(self.p.dove_parlare(t + 200), None)                                     # nessuno si e' fatto vivo da piu' di 90 s: si aspetta
        self.p.tocca("tel", "android", ora=t + 200)
        self.assertEqual(self.p.dove_parlare(t + 200), "tel")                                    # il pc e' spento: parla dove c'e' qualcuno

    def test_gli_eventi_arrivano_agli_altri(self):
        n0 = self.p.ultimo()
        self.p.pubblica("turno", {"utente": "ciao", "spectra": "Sì."}, origine="pc")
        self.assertEqual(self.p.dopo(n0, "pc"), [])                                              # chi l'ha generato non lo riceve
        self.assertEqual(self.p.dopo(n0, "tel")[0]["dati"]["spectra"], "Sì.")
        arrivati = []
        th = threading.Thread(target=lambda: arrivati.extend(self.p.attendi("tel", self.p.ultimo(), attesa=5)))
        th.start(); time.sleep(0.3); t0 = time.time(); self.p.pubblica("promemoria", {"frase": "Promemoria: x"}); th.join(5)
        self.assertEqual(arrivati[0]["tipo"], "promemoria"); self.assertLess(time.time() - t0, 1.0)   # l'attesa lunga si sveglia subito
        self.assertEqual(self.p.attendi("tel", self.p.ultimo(), attesa=0.3), [])                 # e senza novita' torna a mani vuote


class ServizioPresenza(unittest.TestCase):
    def test_due_dispositivi_una_conversazione(self):
        fornitore = Finto(copione=["Il pKa è 4,76.", "Stavamo parlando del pKa dell'acido acetico."])
        s = Spectra(Archivio(":memory:"), Orchestratore([fornitore]))
        srv = servi(s, porta=0, gettone="g", notturno=False, battito=0.3)
        threading.Thread(target=srv.serve_forever, daemon=True).start()
        base = f"http://127.0.0.1:{srv.server_address[1]}"

        def chiama(metodo, strada, corpo=None, gettone="g"):
            h = {"Content-Type": "application/json"}
            if gettone:
                h["Authorization"] = "Bearer " + gettone
            with urllib.request.urlopen(urllib.request.Request(base + strada, json.dumps(corpo).encode() if corpo else None, h, method=metodo), timeout=20) as x:
                return x.status, x.read()
        try:
            st, pagina = chiama("GET", "/", gettone=None)                                        # il client si scarica senza gettone…
            self.assertEqual(st, 200); self.assertIn(b"SPECTRA", pagina)
            self.assertEqual(chiama("GET", "/client/manifest.json", gettone=None)[0], 200)
            with self.assertRaises(urllib.error.HTTPError):
                chiama("GET", "/client/../spectra/configurazione.py", gettone=None)              # …ma solo i file del client
            with self.assertRaises(urllib.error.HTTPError):
                chiama("GET", "/eventi?dispositivo=tel", gettone=None)                           # e tutto il resto vuole il gettone
            n0 = json.loads(chiama("GET", "/eventi?dispositivo=tel&tipo=android&attesa=0.2")[1])["ultimo"]
            chiama("POST", "/turno", {"testo": "Quanto vale il pKa dell'acido acetico?", "dispositivo": "pc", "tipo": "computer"})
            ev = json.loads(chiama("GET", f"/eventi?dispositivo=tel&tipo=android&dopo={n0}&attesa=5")[1])
            self.assertEqual(ev["eventi"][0]["tipo"], "turno"); self.assertEqual(ev["eventi"][0]["dati"]["spectra"], "Il pKa è 4,76."); self.assertFalse(ev["parla"])
            self.assertEqual(json.loads(chiama("GET", f"/eventi?dispositivo=pc&dopo={n0}&attesa=0.3")[1])["eventi"], [])   # il pc, che l'ha fatto, non lo riceve
            # dal telefono, la stessa conversazione: il modello riceve il turno fatto al computer
            chiama("POST", "/turno", {"testo": "Ti ricordi di cosa parlavamo?", "dispositivo": "tel", "tipo": "android", "canale": "voce"})
            messaggi = fornitore.visti[-1]["messaggi"]
            self.assertIn("pKa dell'acido acetico", messaggi[0]["testo"]); self.assertIn("Prima era su «testo», ora è su «voce»", messaggi[-1]["testo"])
            # un promemoria giunto all'ora: il battito lo pubblica, arriva a tutti, parla solo l'ultimo dispositivo usato
            n1 = s.presenza.ultimo()
            s.agenda.aggiungi("uscire per il laboratorio", quando=time.time() - 1)
            ev = json.loads(chiama("GET", f"/eventi?dispositivo=pc&dopo={n1}&attesa=5")[1])["eventi"]
            self.assertEqual(ev[0]["tipo"], "promemoria"); self.assertIn("uscire per il laboratorio", ev[0]["dati"]["frase"]); self.assertEqual(ev[0]["dati"]["parla_su"], "tel")
            stato = json.loads(chiama("GET", "/stato")[1])
            self.assertEqual(sorted(d["id"] for d in stato["dispositivi"]), ["pc", "tel"]); self.assertEqual(stato["agenda"], 1)
        finally:
            srv.shutdown(); srv.server_close()


if __name__ == "__main__":
    unittest.main(verbosity=2)
