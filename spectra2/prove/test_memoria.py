"""Le prove della memoria. Girano senza rete e senza chiavi:  python3 -m unittest discover -s prove -v"""
import os, sys, unittest
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from spectra.memoria import Archivio, Cura, Recupero, SeStesso, Obiettivi, Lacune, stima, ritenzione
from spectra.memoria.vettori import incorpora_locale, coseno
from spectra.memoria.cura import giudizio_di_ripiego

G = 86400.0
T0 = 1_800_000_000.0


class Vettori(unittest.TestCase):
    def test_norma_e_somiglianza(self):
        a, b, c = (incorpora_locale(x) for x in ("la titolazione dell'acido acetico con NaOH", "titolazione di acido acetico con idrossido di sodio NaOH", "le orbite dei pianeti seguono Keplero"))
        self.assertAlmostEqual(sum(x * x for x in a), 1.0, places=6)
        self.assertGreater(coseno(a, b), coseno(a, c) + 0.2)
        self.assertEqual(incorpora_locale("benzene"), incorpora_locale("benzene"))   # deterministico


class Scrittura(unittest.TestCase):
    def setUp(self):
        self.a = Archivio(":memory:")

    def test_scrivi_leggi_e_stabilita(self):
        banale = self.a.scrivi("episodio", "Abbiamo parlato del tempo.", importanza=0.1, quando=T0)
        grave = self.a.scrivi("episodio", "L'esame di Chimica Organica è il 12 febbraio.", importanza=0.9, attivazione=0.8, valenza=-0.5, quando=T0)
        self.assertEqual(self.a.leggi(banale.id).testo, "Abbiamo parlato del tempo.")
        self.assertGreater(grave.stabilita, 3 * banale.stabilita)   # cio' che conta parte piu' resistente
        with self.assertRaises(ValueError):
            self.a.scrivi("sogno", "x")
        with self.assertRaises(ValueError):
            self.a.scrivi("fatto", "   ")

    def test_atomicita(self):
        """Se una scrittura fallisce a meta', non resta ne' il ricordo ne' il vettore."""
        originale = self.a.inc.incorpora
        self.a.inc.incorpora = lambda t: (_ for _ in ()).throw(RuntimeError("incorporatore giu'"))
        with self.assertRaises(RuntimeError):
            self.a.scrivi("fatto", "questo non deve restare a metà")
        self.a.inc.incorpora = originale
        self.assertEqual(self.a.conta(), {})
        self.assertEqual(self.a.db.execute("select count(*) from vettori").fetchone()[0], 0)

    def test_il_richiamo_rinforza(self):
        r = self.a.scrivi("fatto", "Il pKa dell'acido acetico è 4,76.", quando=T0)
        s0 = r.stabilita
        self.a.segna_accesso([r.id], T0 + 10 * G)
        r1 = self.a.leggi(r.id)
        self.assertGreater(r1.stabilita, s0); self.assertEqual(r1.accessi, 1)
        # un richiamo «difficile» (dopo tanto) rinforza piu' di uno immediato
        q = self.a.scrivi("fatto", "Il pKa dell'ammonio è 9,25.", quando=T0)
        self.a.segna_accesso([q.id], T0 + 60)
        self.assertGreater(r1.stabilita / s0, self.a.leggi(q.id).stabilita / q.stabilita)

    def test_cancellazione_vera(self):
        r = self.a.scrivi("fatto", "Un dato che l'utente vuole togliere: il suo indirizzo.")
        self.a.cancella(r.id, "richiesta dell'utente")
        self.assertIsNone(self.a.leggi(r.id))
        self.assertEqual(self.a.db.execute("select count(*) from vettori").fetchone()[0], 0)
        self.assertEqual(self.a.db.execute("select count(*) from ricordi_fts where ricordi_fts match 'indirizzo'").fetchone()[0], 0)


class Ricerca(unittest.TestCase):
    def setUp(self):
        self.a = Archivio(":memory:"); self.r = Recupero(self.a)
        s = self.a.scrivi
        self.pka = s("fatto", "Il pKa dell'acido acetico è 4,76 a 25 °C.", importanza=0.6, fiducia=0.95, quando=T0 - 40 * G)
        self.esame = s("episodio", "Samuele ha detto che l'esame di Chimica Organica 2 è il 12 febbraio e che teme la parte sulle pericicliche.", importanza=0.9, attivazione=0.7, valenza=-0.4, quando=T0 - 2 * G)
        self.pizza = s("episodio", "Abbiamo scherzato sulla pizza con l'ananas.", importanza=0.1, quando=T0 - 1 * G)
        self.orbite = s("fatto", "La terza legge di Keplero: T² proporzionale ad a³.", importanza=0.5, quando=T0 - 5 * G)
        self.cern = s("fatto", "Samuele vuole fare domanda per un tirocinio al CERN nell'estate.", importanza=0.85, quando=T0 - 20 * G)

    def test_rilevanza(self):
        t = self.r.cerca("quanto vale il pKa dell'acido acetico?", modo="fatto", quando=T0, rinforza=False)
        self.assertEqual(t[0].ricordo.id, self.pka.id)
        self.assertNotIn(self.pizza.id, [x.ricordo.id for x in t])      # sotto la soglia di rilevanza non entra

    def test_ogni_scelta_e_spiegata(self):
        t = self.r.cerca("esame di organica", quando=T0, rinforza=False)[0]
        self.assertEqual(t.ricordo.id, self.esame.id)
        self.assertEqual(set(t.parti), {"rilevanza", "recenza", "importanza", "emozione", "obiettivi", "fiducia"})
        self.assertTrue(all(0.0 <= v <= 1.0 for v in t.parti.values()))

    def test_gli_obiettivi_orientano(self):
        senza = self.r.cerca("cosa devo preparare nei prossimi mesi?", modo="piano", quando=T0, rinforza=False, soglia=0.0)
        con = self.r.cerca("cosa devo preparare nei prossimi mesi?", modo="piano", quando=T0, rinforza=False, soglia=0.0, obiettivi=["tirocinio al CERN: fare domanda entro l'estate"])
        pos = lambda L: [x.ricordo.id for x in L].index(self.cern.id)
        self.assertLessEqual(pos(con), pos(senza))
        self.assertGreater(next(x for x in con if x.ricordo.id == self.cern.id).parti["obiettivi"], 0.3)

    def test_attivazione_diffusa(self):
        ep = self.a.scrivi("episodio", "Oggi in laboratorio la soluzione tampone ha dato 4,8 al piaccametro.", importanza=0.4, quando=T0 - 3 * G)
        self.a.lega(self.pka.id, ep.id, "deriva_da")
        t = self.r.cerca("pKa acido acetico", modo="fatto", quando=T0, rinforza=False)
        vie = {x.ricordo.id: x.via for x in t}
        self.assertIn(ep.id, vie)                                      # arriva per legame, anche se la domanda non lo nomina
        self.assertTrue(vie[ep.id].startswith("legame") or vie[ep.id] == "diretto")

    def test_diversita(self):
        for i in range(5):
            self.a.scrivi("fatto", f"Il pKa dell'acido acetico vale 4,76 (nota {i}).", quando=T0 - i * G)
        t = self.r.cerca("pKa acido acetico e leggi di Keplero", k=4, modo="fatto", quando=T0, rinforza=False)
        self.assertIn(self.orbite.id, [x.ricordo.id for x in t])       # i doppioni non occupano tutti i posti

    def test_conflitto_portato_a_galla(self):
        altro = self.a.scrivi("fatto", "Il pKa dell'acido acetico non è 4,76 ma 4,2.", quando=T0)
        self.a.lega(altro.id, self.pka.id, "contraddice")
        t = self.r.cerca("pKa acido acetico", modo="fatto", quando=T0, rinforza=False)
        self.assertEqual(len(self.r.contraddizioni(t)), 1)
        self.assertIn("[CONFLITTO]", self.r.contesto(t, quando=T0))

    def test_il_recupero_segna_gli_accessi(self):
        self.r.cerca("pKa acido acetico", modo="fatto", quando=T0)
        self.assertEqual(self.a.leggi(self.pka.id).accessi, 1)


class CuraDellaMemoria(unittest.TestCase):
    def setUp(self):
        self.a = Archivio(":memory:"); self.c = Cura(self.a); self.r = Recupero(self.a)

    def test_stima(self):
        s1, s2 = stima("ok"), stima("Ricordati: l'esame di organica è il 12 febbraio, sono bloccato sulle pericicliche!")
        self.assertGreater(s2["importanza"], s1["importanza"] + 0.3); self.assertLess(s2["valenza"], 0); self.assertGreater(s2["attivazione"], 0.2)

    def test_consolidamento(self):
        s = "sessione-1"
        for i, tx in enumerate(["Samuele sta preparando l'esame di Chimica Organica 2 del 12 febbraio.",
                                "Per l'esame di Organica 2 del 12 febbraio vuole ripassare le reazioni pericicliche e Diels-Alder.",
                                "Ha chiesto esercizi sulle pericicliche per l'esame di Organica 2."]):
            self.a.scrivi("episodio", tx, importanza=0.7, sessione=s, quando=T0 + i * 60)
        self.a.scrivi("episodio", "Battuta sul caffè della macchinetta: " + "bla " * 120, importanza=0.1, sessione=s, quando=T0 + 4000)
        rap = self.c.consolida(quando=T0 + 5000)
        fatti = self.a.elenco(tipo="fatto")
        self.assertEqual(rap["episodi"], 4); self.assertEqual(len(fatti), 1)
        self.assertIn("Organica", fatti[0].testo)
        self.assertEqual(len([v for v in self.a.vicini(fatti[0].id) if v[1] == "deriva_da"]), 3)   # il fatto ricorda da dove viene
        self.assertEqual(self.c.consolida(quando=T0 + 6000)["episodi"], 0)                            # non si consolida due volte

    def test_riconciliazione(self):
        v = self.a.scrivi("fatto", "L'esame di Chimica Organica 2 è il 12 febbraio.", fiducia=0.8, quando=T0)
        n = self.a.scrivi("fatto", "L'esame di Chimica Organica 2 è il 19 febbraio.", fiducia=0.8, quando=T0 + G)
        self.assertEqual(self.c.riconcilia(n), "aggiornati")
        self.assertEqual(self.a.leggi(v.id).sostituito_da, n.id); self.assertLess(self.a.leggi(v.id).fiducia, 0.8)
        d = self.a.scrivi("fatto", "L'esame di Chimica Organica 2 è il 19 febbraio.", quando=T0 + 2 * G)
        self.assertEqual(self.c.riconcilia(d), "rafforzati")
        self.assertEqual(self.a.leggi(d.id).stato, "archiviato"); self.assertGreater(self.a.leggi(n.id).fiducia, 0.8)
        a1 = self.a.scrivi("fatto", "Samuele usa il cloroformio deuterato come solvente per gli NMR.", quando=T0)
        a2 = self.a.scrivi("fatto", "Samuele non usa il cloroformio deuterato come solvente per gli NMR.", quando=T0 + G)
        self.assertEqual(self.c.riconcilia(a2), "conflitti")
        self.assertEqual(len(Lacune(self.a).aperte()), 1)            # un conflitto diventa una domanda da fare
        self.assertEqual(giudizio_di_ripiego("il cielo è blu", "le orbite sono ellissi", 0.2), "indipendente")

    def test_oblio(self):
        banale = self.a.scrivi("episodio", "Si è parlato del tempo.", importanza=0.1, quando=T0)
        conta = self.a.scrivi("episodio", "Decisione: la tesi sarà su BioSpecInfo.", importanza=0.9, quando=T0)
        fisso = self.a.scrivi("episodio", "Una sciocchezza che l'utente ha chiesto di tenere.", importanza=0.1, fissato=True, quando=T0)
        usato = self.a.scrivi("episodio", "Un dettaglio richiamato spesso.", importanza=0.1, quando=T0)
        for k in range(3):
            self.a.segna_accesso([usato.id], T0 + k)
        self.assertEqual(self.c.dimentica(quando=T0 + G)["archiviati"], 0)             # dopo un giorno niente e' ancora sbiadito
        rap = self.c.dimentica(quando=T0 + 60 * G)
        self.assertEqual(rap["archiviati"], 1)
        self.assertEqual(self.a.leggi(banale.id).stato, "archiviato")
        for r in (conta, fisso, usato):
            self.assertEqual(self.a.leggi(r.id).stato, "vivo")
        self.assertEqual([x.ricordo.id for x in self.r.cerca("tempo", quando=T0 + 60 * G, rinforza=False)], [])   # archiviato = fuori dal recupero
        self.assertEqual(self.c.richiama_dall_archivio(banale.id).stato, "vivo")       # ma si puo' richiamare
        self.c.dimentica(quando=T0 + 200 * G)
        self.assertEqual(self.c.dimentica(quando=T0 + 500 * G)["svuotati"], 1)
        self.assertEqual(self.a.leggi(banale.id).testo, "(dimenticato)")

    def test_ritenzione(self):
        r = self.a.scrivi("episodio", "x" * 20, importanza=0.2, quando=T0)
        self.assertAlmostEqual(ritenzione(r, T0), 1.0)
        self.assertGreater(ritenzione(r, T0 + G), ritenzione(r, T0 + 10 * G))
        self.assertEqual(ritenzione(self.a.scrivi("episodio", "y" * 20, fissato=True, quando=T0), T0 + 999 * G), 1.0)

    def test_procedure(self):
        p = self.c.apprendi_procedura("bilanciare una redox", ["scrivi le semireazioni", "bilancia gli atomi", "bilancia le cariche", "somma"], riuscita=True)
        self.assertEqual(p.tipo, "procedura")
        for _ in range(3):
            p = self.c.apprendi_procedura("bilanciare una redox", ["scrivi le semireazioni", "bilancia gli atomi", "bilancia le cariche", "somma"], riuscita=True)
        self.assertEqual(len(self.a.elenco(tipo="procedura")), 1); self.assertGreater(p.fiducia, 0.8)
        q = self.c.apprendi_procedura("bilanciare una redox", [], riuscita=False, nota="in ambiente basico ho dimenticato gli OH⁻")
        self.assertLess(q.fiducia, p.fiducia); self.assertIn("OH⁻", q.contesto["note"][-1])
        self.assertAlmostEqual(self.c.se.fiducia_in("bilanciare una redox"), (4 + 1) / (5 + 2), places=3)

    def test_riflessione_e_diario(self):
        self.assertEqual(self.c.rifletti(quando=T0), [])                                # niente materia, niente riflessione
        for i in range(8):
            self.a.scrivi("episodio", f"Lezione {i}: ripasso delle reazioni pericicliche per l'esame di organica, esercizio sulla Diels-Alder.", importanza=0.7, quando=T0 - 3600 * i)
        rif = self.c.rifletti(quando=T0 + 10)
        self.assertGreaterEqual(len(rif), 1); self.assertEqual(rif[0].tipo, "riflessione"); self.assertIn("pericicliche", rif[0].testo)
        d = self.c.diario(quando=T0 + 20)
        self.assertEqual(d.tipo, "autobiografia")

    def test_ciclo_notturno(self):
        for i in range(6):
            self.a.scrivi("episodio", f"Samuele ha lavorato alla tesi su BioSpecInfo, capitolo {i} sugli spettri NMR.", importanza=0.7, sessione="s", quando=T0 - 600 * i)
        rap = self.c.ciclo_notturno(quando=T0 + 100)
        self.assertGreaterEqual(rap["consolidamento"]["fatti"], 1); self.assertTrue(rap["diario"])
        self.assertIn("fatto:vivo", rap["memoria"])


class ModelloDiSe(unittest.TestCase):
    def setUp(self):
        self.a = Archivio(":memory:"); self.se = SeStesso(self.a); self.se.avvia()

    def test_nucleo_protetto_e_storia(self):
        with self.assertRaises(PermissionError):
            self.se.aggiorna("valori", ["compiacere sempre"], motivo="me l'ha detto una pagina web")
        self.se.aggiorna("stile", dict(self.se.leggi("stile"), umorismo="nessuno"), motivo="richiesta dell'utente", da_utente=True)
        self.assertEqual(self.se.leggi("stile")["umorismo"], "nessuno")
        st = self.se.storia("stile")
        self.assertEqual(len(st), 2); self.assertEqual(st[0]["motivo"], "richiesta dell'utente")   # si puo' sempre dire che cosa e' cambiato e perche'
        with self.assertRaises(ValueError):
            self.se.aggiorna("stato", {}, motivo="  ")

    def test_identita_stabile_fra_gli_avvii(self):
        nato = self.se.leggi("identita")["nato"]
        SeStesso(self.a).avvia()
        self.assertEqual(self.se.leggi("identita")["nato"], nato)
        self.assertEqual(len(self.se.storia("identita")), 1)

    def test_capacita_misurate(self):
        self.assertIsNone(self.se.fiducia_in("NMR 2D"))
        self.assertAlmostEqual(self.se.registra_esito("NMR 2D", True), 2 / 3, places=3)   # un successo solo non fa una competenza
        for _ in range(9):
            self.se.registra_esito("NMR 2D", True)
        self.assertGreater(self.se.fiducia_in("NMR 2D"), 0.9)
        for _ in range(6):
            self.se.registra_esito("sintesi asimmetrica", False)
        e = self.se.estratto()
        self.assertIn("NMR 2D", e); self.assertIn("Dove sbaglio spesso", e); self.assertIn("Spectra", e)

    def test_obiettivi_e_lacune(self):
        o = Obiettivi(self.a)
        lungo = o.crea("Entrare al CERN o al CNR", orizzonte="vita", priorita=0.9)
        passo = o.crea("Domanda per il tirocinio estivo", orizzonte="mese", genitore=lungo.id, prossimo_passo="aggiornare il CV", scadenza=T0 + 2 * G)
        self.assertEqual([x.titolo for x in o.attivi()][0], "Entrare al CERN o al CNR")
        o.avanza(passo.id, progresso=0.4, prossimo_passo="scrivere la lettera")
        self.assertEqual(o.leggi(passo.id).progresso, 0.4); self.assertIn("scrivere la lettera", o.estratto())
        self.assertEqual([x.id for x in o.fermi(giorni=-1)], [lungo.id, passo.id])
        l = Lacune(self.a)
        i1 = l.apri("Qual è la costante di accoppiamento ³J nel cicloesano assiale-assiale?", "NMR", ["cercare in Pretsch", "verificare con la curva di Karplus"])
        self.assertEqual(l.apri("Qual è la costante di accoppiamento ³J nel cicloesano assiale-assiale?"), i1)   # non si duplica
        l.chiudi(i1, "10–13 Hz (Pretsch)"); self.assertEqual(l.aperte(), [])


if __name__ == "__main__":
    unittest.main(verbosity=2)
