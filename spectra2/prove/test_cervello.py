"""Le prove del ciclo principale, con un fornitore finto: nessuna rete, nessuna chiave.  python3 -m unittest discover -s prove -v"""
import os, sys, unittest
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from spectra.cervello import Spectra, modo_di, per_la_voce
from spectra.fornitori import ErroreFornitore, Orchestratore, Risposta, Strumento, valida
from spectra.memoria import Archivio


class Finto:
    """Un fornitore che fa cio' che il copione dice: una lista di passi, ognuno o una chiamata a uno strumento o il testo finale."""

    def __init__(self, nome="finto", copione=None, errore=None):
        self.nome, self.copione, self.errore, self.visti = nome, list(copione or []), errore, []

    def turno(self, sistema, messaggi, strumenti=(), esegui=None, sforzo=None):
        self.visti.append({"sistema": sistema, "messaggi": list(messaggi), "strumenti": [s.nome for s in strumenti], "sforzo": sforzo})
        if self.errore:
            raise self.errore
        usati = []
        while self.copione:
            passo = self.copione.pop(0)
            if isinstance(passo, tuple):
                nome, arg = passo
                usati.append({"nome": nome, "argomenti": arg, "esito": esegui(nome, arg)})
            else:
                return Risposta(passo, self.nome, "modello-finto", usati)
        return Risposta("Fatto.", self.nome, "modello-finto", usati)

    def struttura(self, sistema, richiesta, schema, sforzo=None):
        if self.errore:
            raise self.errore
        return {"fatti": [], "intuizioni": [], "giudizio": "indipendente"}


def nuovo(copione=None, **kw):
    f = Finto(copione=copione)
    return Spectra(Archivio(":memory:"), Orchestratore([f]), **kw), f


class Turno(unittest.TestCase):
    def test_i_blocchi_arrivano_al_modello(self):
        s, f = nuovo(["Il pKa è 4,76."])
        s.obiettivi.crea("Esame di Chimica Organica 2", orizzonte="mese", prossimo_passo="ripassare le pericicliche")
        s.a.scrivi("fatto", "Il pKa dell'acido acetico è 4,76 a 25 °C.", fiducia=0.95)
        e = s.turno("Quanto vale il pKa dell'acido acetico?")
        ultimo = f.visti[0]["messaggi"][-1]["testo"]
        for blocco in ("[IO]", "[OBIETTIVI]", "[RICORDI]", "[ADESSO]", "[MESSAGGIO]"):
            self.assertIn(blocco, ultimo)
        self.assertIn("4,76", ultimo); self.assertIn("Esame di Chimica Organica 2", ultimo); self.assertIn("Sono Spectra", ultimo)
        self.assertEqual(e.modo, "fatto"); self.assertEqual(e.testo, "Il pKa è 4,76."); self.assertEqual(len(e.ricordi_usati), 1)
        self.assertIn("Sei **Spectra**", f.visti[0]["sistema"])                # il prompt di sistema e' quello del file, stabile
        self.assertNotIn("4,76", f.visti[0]["sistema"])                        # cio' che cambia non sta nel sistema (cache)

    def test_il_turno_diventa_un_episodio_e_la_conversazione_continua(self):
        s, f = nuovo(["Bene.", "Sì: Diels-Alder."])
        s.turno("Sto ripassando le pericicliche per l'esame.")
        s.turno("Ti ricordi di cosa parlavamo?")
        self.assertEqual(len(s.a.elenco(tipo="episodio")), 2)
        seconda = f.visti[1]["messaggi"]
        self.assertEqual([m["ruolo"] for m in seconda], ["utente", "spectra", "utente"])     # la memoria di lavoro porta il turno prima
        self.assertIn("pericicliche", seconda[-1]["testo"].split("[RICORDI]")[1])              # e l'episodio e' gia' un ricordo

    def test_spectra_scrive_nella_sua_memoria(self):
        s, f = nuovo([("ricorda", {"testo": "L'esame di Chimica Organica 2 di Samuele è il 12 febbraio.", "importanza": 0.9}),
                      ("crea_obiettivo", {"titolo": "Superare Chimica Organica 2", "orizzonte": "mese", "giorni_alla_scadenza": 20}), "Segnato."])
        e = s.turno("Ricordati che l'esame di Organica 2 è il 12 febbraio.")
        self.assertEqual([u["nome"] for u in e.risposta.strumenti_usati], ["ricorda", "crea_obiettivo"])
        self.assertEqual(len(s.a.elenco(tipo="fatto")), 1); self.assertEqual(s.obiettivi.attivi()[0].titolo, "Superare Chimica Organica 2")
        self.assertIn("ricorda", f.visti[0]["strumenti"]); self.assertIn("dimentica", f.visti[0]["strumenti"])

    def test_dimentica_davvero(self):
        s, _ = nuovo([("dimentica", {"cosa": "il mio indirizzo di casa"}), "Cancellato."])
        r = s.a.scrivi("fatto", "L'indirizzo di casa di Samuele è via Roma 1, Bari.")
        s.turno("Dimentica il mio indirizzo di casa.")
        self.assertIsNone(s.a.leggi(r.id))

    def test_non_lo_so_lascia_una_lacuna(self):
        s, _ = nuovo(["Non lo so. Lo verificherei sul Pretsch."])
        e = s.turno("Qual è la ³J assiale-assiale nel cicloesano?")
        self.assertIsNotNone(e.lacuna); self.assertEqual(len(s.lacune.aperte()), 1)
        s2, _ = nuovo([("registra_lacuna", {"domanda": "³J ax-ax nel cicloesano", "piano": ["Pretsch"]}), "Non lo so: l'ho segnato."])
        self.assertIsNone(s2.turno("Qual è la ³J?").lacuna); self.assertEqual(len(s2.lacune.aperte()), 1)   # non si duplica

    def test_voce(self):
        s, f = nuovo(["Il **pKa** dell'acido acetico è 4,76 a 25 °C.\n\n- primo punto\n- secondo punto " + "parola " * 120])
        e = s.turno("pKa acido acetico?", canale="occhiali")
        self.assertEqual(f.visti[0]["sforzo"], "low")
        self.assertNotIn("**", e.per_la_voce); self.assertIn("pi-kappa-a", e.per_la_voce); self.assertIn("gradi Celsius", e.per_la_voce)
        self.assertLess(len(e.per_la_voce), 460); self.assertTrue(e.per_la_voce.endswith("Il resto è sull'app."))
        self.assertEqual(per_la_voce("Sì."), "Sì.")

    def test_strumenti_esterni(self):
        visti = []
        s, f = nuovo([("apri_sezione", {"id": "sirvis"}), "Aperta."], strumenti_esterni=[Strumento("apri_sezione", "apre una sezione dell'app", {"type": "object", "properties": {"id": {"type": "string"}}, "required": ["id"]})],
                     esegui_esterno=lambda n, a: visti.append((n, a)) or "aperta")
        s.turno("Aprimi gli spettri IR.")
        self.assertEqual(visti, [("apri_sezione", {"id": "sirvis"})]); self.assertIn("apri_sezione", f.visti[0]["strumenti"])

    def test_modo(self):
        self.assertEqual(modo_di("Come mi preparo per l'esame di febbraio?"), "piano")
        self.assertEqual(modo_di("Ti ricordi dove eravamo?"), "ricordo")
        self.assertEqual(modo_di("Quanto vale la costante di Planck?"), "fatto")
        self.assertEqual(modo_di("Ciao"), "conversazione")


class Iniziativa(unittest.TestCase):
    def test_una_cosa_alla_volta_e_mai_dopo_non_ora(self):
        s, _ = nuovo(["Va bene.", "D'accordo."])
        self.assertIsNone(s.iniziativa())                                       # niente da dire: tace
        import time
        s.obiettivi.crea("Consegnare la tesi", orizzonte="mese", prossimo_passo="rileggere il capitolo 3", scadenza=time.time() + 2 * 86400)
        frase = s.iniziativa()
        self.assertIn("Consegnare la tesi", frase); self.assertIn("rileggere il capitolo 3", frase)
        self.assertIsNone(s.iniziativa())                                       # non due volte di fila
        s._ultima_iniziativa.clear()
        s.turno("Non ora, sto studiando.")
        self.assertIsNone(s.iniziativa())                                       # «non ora» vale per la sessione

    def test_obiettivo_fermo(self):
        s, _ = nuovo()
        o = s.obiettivi.crea("Portfolio di data science", orizzonte="anno")
        s.a.db.execute("update obiettivi set creato = creato - 10*86400 where id = ?", (o.id,))
        self.assertIn("fermo", s.iniziativa())


class Fornitori(unittest.TestCase):
    def test_riserva(self):
        giu = Finto("primo", errore=ErroreFornitore("sovraccarico", passeggero=True, stato=503)); su = Finto("secondo", copione=["Eccomi."])
        o = Orchestratore([giu, su])
        self.assertEqual(o.turno("s", [{"ruolo": "utente", "testo": "ciao"}]).fornitore, "secondo")
        su.copione = ["Di nuovo."]
        o.turno("s", [{"ruolo": "utente", "testo": "ciao"}])
        self.assertEqual(len(giu.visti), 1)                                     # chi ha fallito resta in pausa: non lo si riprova subito

    def test_errore_non_passeggero_non_fa_il_giro(self):
        rotto = Finto("primo", errore=ErroreFornitore("richiesta malformata", passeggero=False, stato=400)); altro = Finto("secondo", copione=["x"])
        with self.assertRaises(ErroreFornitore):
            Orchestratore([rotto, altro]).turno("s", [{"ruolo": "utente", "testo": "ciao"}])
        self.assertEqual(altro.visti, [])

    def test_tutti_giu(self):
        with self.assertRaises(ErroreFornitore):
            Orchestratore([Finto("a", errore=ErroreFornitore("x", passeggero=True))]).turno("s", [{"ruolo": "utente", "testo": "c"}])

    def test_validazione_degli_argomenti(self):
        sc = {"type": "object", "properties": {"n": {"type": "integer"}, "s": {"type": "string", "enum": ["a", "b"]}}, "required": ["n"]}
        self.assertIsNone(valida({"n": 3, "s": "a"}, sc))
        self.assertIn("manca", valida({}, sc)); self.assertIn("integer", valida({"n": "3"}, sc)); self.assertIn("integer", valida({"n": True}, sc))
        self.assertIn("uno fra", valida({"n": 1, "s": "z"}, sc)); self.assertIn("oggetto", valida(None, sc))

    def test_la_cura_regge_senza_modello(self):
        """Se il fornitore non risponde di notte, la memoria si consolida lo stesso con le regole di ripiego, e lo annota."""
        s = Spectra(Archivio(":memory:"), Orchestratore([Finto(errore=ErroreFornitore("giù", passeggero=True))]))
        for i in range(4):
            s.a.scrivi("episodio", f"Samuele ha lavorato alla tesi su BioSpecInfo, parte {i} sugli spettri NMR.", importanza=0.7, sessione="x")
        rap = s.notte()
        self.assertGreaterEqual(rap["consolidamento"]["fatti"], 1)
        self.assertGreaterEqual(s.a.db.execute("select count(*) from diario where tipo = 'pensatore_assente'").fetchone()[0], 1)


if __name__ == "__main__":
    unittest.main(verbosity=2)
