/* ═══════════════════════════════════════════════════════════════════════════
   bsi-risorse-materie.js — le sezioni di UTILITA' delle tre materie
   BioSpecInfo · © Samuele Pio Provenzano

   L'applicazione sta diventando tre app in una (chimica, fisica,
   matematica) e ognuna ha bisogno dei suoi attrezzi da scrivania. Qui ci
   sono cinque sezioni:

   · sfisris, smatris, schiris — RISORSE E BIBLIOGRAFIA di fisica, di
     matematica e di chimica, con tre schede ciascuna:
       – Risorse web: link scelti e divisi per categoria (banche dati,
         corsi e dispense aperte, simulazioni, dati di riferimento, server di
         preprint, riviste, societa' ed enti, programmi), con la ricerca, il
         filtro per categoria e per ognuno il collegamento «🇮🇹 leggi in
         italiano» attraverso la vista tradotta di Google;
       – Bibliografia: i testi classici per livello (base, universitario,
         avanzato, dottorato), con autori, titolo ed editore. NIENTE ANNI E
         NIENTE ISBN: le edizioni cambiano, e un anno o un codice scritti a
         memoria sarebbero errori invisibili. I link di ricerca (Google
         Libri, WorldCat, OPAC SBN) sono CALCOLATI dal titolo e dall'autore,
         cosi' portano sempre all'edizione corrente;
       – Citazioni: si incolla un DOI, si chiede a Crossref IN DIRETTA la
         scheda dell'opera e se ne ricavano APA 7, IEEE, ISO 690 e BibTeX da
         copiare. Senza rete c'e' il modulo da compilare a mano.
   · sfiscost — COSTANTI E UNITA': le costanti CODATA 2018 (quelle che dal
     2019 definiscono il SI sono segnate esatte) e un convertitore di unita'
     che controlla le dimensioni (non converte elettronvolt in metri).
   · smattavole — TAVOLE MATEMATICHE: derivate, integrali, serie con il
     raggio di convergenza, identita' trigonometriche e iperboliche, coppie
     di Laplace e di Fourier, costanti a 15 cifre. Ogni voce che ha un
     numero dentro porta con se' una PROVA (le funzioni in `prova`): il
     banco la usa per controllare numericamente la tavola, cosi' un segno
     sbagliato non resta li' a sembrare giusto.

   LA FILOSOFIA E' QUELLA DI bsi-articoli.js
   1 · I link sono funzioni di un dato (il DOI, il titolo, l'indirizzo
       della pagina): se un sito cambia schema si cambia UNA funzione.
   2 · Quando la rete non c'e' lo si dice: compare che cosa si e' chiesto,
       a chi, perche' non e' arrivato, e l'indirizzo della richiesta, che si
       puo' aprire a mano. «Non c'e' niente» e «non ho capito la risposta»
       sono due messaggi diversi.

   CALCOLI ESPOSTI (li leggono altri moduli e il banco)
   F.calcolo.citazioni = { normalizzaDoi, daCrossref, apa, ieee, iso690, bibtex, chiaveBibtex, urlCrossref }
   F.calcolo.unita     = { converti, GRANDEZZE, COSTANTI, trova }
   F.calcolo.tavole    = { DERIVATE, INTEGRALI, SERIE, LAPLACE, FOURIER, IDENTITA, COSTANTI_MAT }
   F.calcolo.risorse   = { LINK, LIBRI, CATEGORIE, LIVELLI, linkTradotto, cercaLibro }
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, tt = F.tt;

  function esc(x) {
    return String(x == null ? '' : x).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ═════════════════════════════════════════════════════════════════════════
     I LINK, COME FUNZIONI
     ═════════════════════════════════════════════════════════════════════════ */
  var L = {
    doi: function (d) { return 'https://doi.org/' + d; },
    /* la scheda di un'opera su Crossref; la barra del DOI resta barra */
    crossref: function (doi) {
      return 'https://api.crossref.org/works/' + encodeURIComponent(doi).replace(/%2F/gi, '/') +
        '?mailto=biospecinfo@users.noreply.github.com';
    },
    /* LEGGERE IN ITALIANO: la vista tradotta di Google, la stessa di
       bsi-articoli.js. Il nome del sito diventa un sottodominio di
       translate.goog: i trattini si raddoppiano e i punti diventano
       trattini (www-nds.iaea.org → www--nds-iaea-org); i parametri vanno
       prima dell'eventuale ancora #. */
    tradotto: function (url) {
      var u = String(url).replace(/^https?:\/\//, '');
      var anc = '', h = u.indexOf('#');
      if (h >= 0) { anc = u.slice(h); u = u.slice(0, h); }
      var host = u.split('/')[0];
      var resto = u.slice(host.length) || '/';
      return 'https://' + host.replace(/-/g, '--').replace(/\./g, '-') + '.translate.goog' + resto +
        (resto.indexOf('?') >= 0 ? '&' : '?') + '_x_tr_sl=auto&_x_tr_tl=it&_x_tr_hl=it' + anc;
    },
    /* ricerche di un libro: titolo + primo autore. Sono RICERCHE, non schede
       indovinate: portano sempre a qualcosa che si puo' valutare */
    googleLibri: function (q) { return 'https://www.google.com/search?tbm=bks&q=' + encodeURIComponent(q); },
    worldcat: function (q) { return 'https://www.worldcat.org/search?q=' + encodeURIComponent(q); },
    /* il catalogo collettivo delle biblioteche italiane (ricerca semplice) */
    sbn: function (q) { return 'https://opac.sbn.it/risultati-ricerca-semplice?item:keywords:any=' + encodeURIComponent(q); }
  };

  /* ═════════════════════════════════════════════════════════════════════════
     1 · LE RISORSE WEB
     Solo siti ufficiali e stabili. [nome, descrizione, categoria, indirizzo]
     ═════════════════════════════════════════════════════════════════════════ */
  var CATEGORIE = {
    banche: ['Banche dati', 'Databases'],
    corsi: ['Corsi e dispense aperte', 'Open courses and notes'],
    simul: ['Simulazioni e strumenti', 'Simulations and tools'],
    dati: ['Dati di riferimento', 'Reference data'],
    preprint: ['Preprint', 'Preprint servers'],
    riviste: ['Riviste', 'Journals'],
    societa: ['Società ed enti', 'Societies and institutions'],
    software: ['Software', 'Software']
  };
  function voci(lista) { return lista.map(function (r) { return { nm: r[0], d: r[1], cat: r[2], url: r[3] }; }); }

  var LINK = {
    fisica: voci([
      ['arXiv · physics', 'Il server di preprint della fisica: articoli prima della pubblicazione, liberi.', 'preprint', 'https://arxiv.org/archive/physics'],
      ['arXiv · astro-ph', 'Preprint di astrofisica e cosmologia.', 'preprint', 'https://arxiv.org/archive/astro-ph'],
      ['arXiv · cond-mat', 'Preprint di materia condensata.', 'preprint', 'https://arxiv.org/archive/cond-mat'],
      ['arXiv · hep-th', 'Preprint di fisica teorica delle alte energie.', 'preprint', 'https://arxiv.org/archive/hep-th'],
      ['arXiv · quant-ph', 'Preprint di fisica quantistica e informazione quantistica.', 'preprint', 'https://arxiv.org/archive/quant-ph'],
      ['arXiv · gr-qc', 'Preprint di relatività generale e cosmologia quantistica.', 'preprint', 'https://arxiv.org/archive/gr-qc'],
      ['INSPIRE-HEP', 'La banca dati bibliografica della fisica delle alte energie, con citazioni.', 'banche', 'https://inspirehep.net/'],
      ['NASA ADS', 'Astrophysics Data System: la bibliografia di astronomia e fisica.', 'banche', 'https://ui.adsabs.harvard.edu/'],
      ['SIMBAD', 'Banca dati degli oggetti astronomici fuori dal Sistema solare (CDS, Strasburgo).', 'banche', 'https://simbad.cds.unistra.fr/simbad/'],
      ['VizieR', 'I cataloghi astronomici pubblicati, interrogabili (CDS).', 'banche', 'https://vizier.cds.unistra.fr/'],
      ['NASA Exoplanet Archive', 'I pianeti extrasolari confermati e i loro parametri.', 'banche', 'https://exoplanetarchive.ipac.caltech.edu/'],
      ['NED', 'NASA/IPAC Extragalactic Database: galassie, distanze, redshift.', 'banche', 'https://ned.ipac.caltech.edu/'],
      ['HEPData', 'I dati numerici delle misure della fisica delle particelle.', 'banche', 'https://www.hepdata.net/'],
      ['NIST · costanti fondamentali', 'I valori CODATA raccomandati delle costanti fisiche.', 'dati', 'https://physics.nist.gov/cuu/Constants/'],
      ['Particle Data Group', 'La Review of Particle Physics: masse, vite medie, decadimenti.', 'dati', 'https://pdg.lbl.gov/'],
      ['NIST Atomic Spectra Database', 'Livelli energetici e righe spettrali degli atomi e degli ioni.', 'dati', 'https://physics.nist.gov/PhysRefData/ASD/'],
      ['NIST XCOM', 'Sezioni d’urto dei fotoni (attenuazione dei raggi X e γ) nei materiali.', 'dati', 'https://physics.nist.gov/PhysRefData/Xcom/html/xcom1.html'],
      ['JPL Solar System Dynamics', 'Orbite, costanti e parametri fisici dei corpi del Sistema solare.', 'dati', 'https://ssd.jpl.nasa.gov/'],
      ['JPL Horizons', 'Effemeridi di pianeti, lune, asteroidi e sonde.', 'dati', 'https://ssd.jpl.nasa.gov/horizons/'],
      ['NASA Planetary Fact Sheet', 'Tabelle dei dati fisici e orbitali dei pianeti.', 'dati', 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/'],
      ['NNDC', 'National Nuclear Data Center: dati nucleari valutati (ENSDF, sezioni d’urto).', 'dati', 'https://www.nndc.bnl.gov/'],
      ['IAEA Live Chart of Nuclides', 'La carta dei nuclidi interattiva dell’Agenzia internazionale per l’energia atomica.', 'dati', 'https://www-nds.iaea.org/relnsd/vcharthtml/VChartHTML.html'],
      ['RefractiveIndex.INFO', 'Indici di rifrazione e coefficienti di estinzione dei materiali.', 'dati', 'https://refractiveindex.info/'],
      ['The Feynman Lectures on Physics', 'Le lezioni di Feynman, libere in rete dal Caltech.', 'corsi', 'https://www.feynmanlectures.caltech.edu/'],
      ['HyperPhysics', 'Mappe concettuali di tutta la fisica di base (Georgia State University).', 'corsi', 'https://hyperphysics.phy-astr.gsu.edu/hbase/index.html'],
      ['MIT OpenCourseWare · Physics', 'Corsi completi del MIT: lezioni, esercizi, esami.', 'corsi', 'https://ocw.mit.edu/search/?d=Physics'],
      ['OpenStax University Physics', 'Manuale universitario di fisica, aperto e gratuito.', 'corsi', 'https://openstax.org/details/books/university-physics-volume-1'],
      ['David Tong · dispense', 'Dispense di fisica teorica dell’Università di Cambridge (DAMTP).', 'corsi', 'https://www.damtp.cam.ac.uk/user/tong/teaching.html'],
      ['LibreTexts Physics', 'Biblioteca di testi aperti di fisica.', 'corsi', 'https://phys.libretexts.org/'],
      ['Khan Academy · Fisica', 'Lezioni ed esercizi di fisica di base.', 'corsi', 'https://www.khanacademy.org/science/physics'],
      ['PhET', 'Simulazioni interattive dell’Università del Colorado, anche in italiano.', 'simul', 'https://phet.colorado.edu/'],
      ['Falstad · simulazioni', 'Applet di onde, circuiti, campi e meccanica quantistica.', 'simul', 'https://www.falstad.com/mathphysics.html'],
      ['oPhysics', 'Simulazioni interattive di meccanica, onde, ottica ed elettromagnetismo.', 'simul', 'https://ophysics.com/'],
      ['Stellarium Web', 'Planetario nel browser: il cielo da qualunque luogo e data.', 'simul', 'https://stellarium-web.org/'],
      ['NASA Eyes', 'Il Sistema solare e le sonde in 3D, con i dati reali.', 'simul', 'https://eyes.nasa.gov/'],
      ['APS Physics Journals', 'Physical Review Letters, Physical Review A–E, X e le altre riviste APS.', 'riviste', 'https://journals.aps.org/'],
      ['Reviews of Modern Physics', 'Rassegne di riferimento su interi campi della fisica.', 'riviste', 'https://journals.aps.org/rmp/'],
      ['Nature Physics', 'Rivista di fisica del gruppo Nature.', 'riviste', 'https://www.nature.com/nphys/'],
      ['European Journal of Physics', 'Rivista IOP sulla didattica della fisica universitaria.', 'riviste', 'https://iopscience.iop.org/journal/0143-0807'],
      ['American Journal of Physics', 'Rivista dell’AAPT: fisica per chi insegna e studia all’università.', 'riviste', 'https://pubs.aip.org/aapt/ajp'],
      ['EPJ', 'The European Physical Journal (EDP Sciences, Springer, SIF).', 'riviste', 'https://www.epj.org/'],
      ['SciPost', 'Riviste ad accesso aperto con revisione pubblica.', 'riviste', 'https://scipost.org/'],
      ['Living Reviews in Relativity', 'Rassegne aperte e aggiornate sulla relatività.', 'riviste', 'https://link.springer.com/journal/41114'],
      ['American Physical Society', 'La società dei fisici americani.', 'societa', 'https://www.aps.org/'],
      ['Institute of Physics', 'La società dei fisici del Regno Unito e dell’Irlanda.', 'societa', 'https://www.iop.org/'],
      ['Società Italiana di Fisica', 'La SIF: congressi, riviste, scuole di Varenna.', 'societa', 'https://www.sif.it/'],
      ['European Physical Society', 'La società europea di fisica.', 'societa', 'https://www.eps.org/'],
      ['IUPAP', 'Unione internazionale di fisica pura e applicata: simboli, unità, nomenclatura.', 'societa', 'https://iupap.org/'],
      ['CERN', 'Il laboratorio europeo di fisica delle particelle.', 'societa', 'https://home.cern/'],
      ['INFN', 'Istituto Nazionale di Fisica Nucleare.', 'societa', 'https://www.infn.it/'],
      ['INAF', 'Istituto Nazionale di Astrofisica.', 'societa', 'https://www.inaf.it/'],
      ['ESA', 'L’Agenzia spaziale europea.', 'societa', 'https://www.esa.int/'],
      ['NASA', 'L’agenzia spaziale degli Stati Uniti.', 'societa', 'https://www.nasa.gov/'],
      ['ROOT', 'Il programma di analisi dei dati del CERN.', 'software', 'https://root.cern/'],
      ['Geant4', 'Simulazione Monte Carlo del passaggio delle particelle nella materia.', 'software', 'https://geant4.web.cern.ch/'],
      ['Astropy', 'La libreria Python dell’astronomia.', 'software', 'https://www.astropy.org/'],
      ['SciPy', 'Calcolo scientifico in Python: integrazione, ottimizzazione, algebra lineare.', 'software', 'https://scipy.org/'],
      ['QuTiP', 'Dinamica dei sistemi quantistici aperti in Python.', 'software', 'https://qutip.org/'],
      ['GNU Octave', 'Calcolo numerico libero, compatibile con MATLAB.', 'software', 'https://octave.org/'],
      ['Project Jupyter', 'Quaderni interattivi per il calcolo e l’analisi dei dati.', 'software', 'https://jupyter.org/']
    ]),
    matematica: voci([
      ['arXiv · math', 'Il server di preprint della matematica, per tutte le aree.', 'preprint', 'https://arxiv.org/archive/math'],
      ['arXiv · math-ph', 'Preprint di fisica matematica.', 'preprint', 'https://arxiv.org/archive/math-ph'],
      ['arXiv · stat', 'Preprint di statistica.', 'preprint', 'https://arxiv.org/archive/stat'],
      ['HAL', 'L’archivio aperto francese di articoli e tesi.', 'preprint', 'https://hal.science/'],
      ['zbMATH Open', 'La banca dati di recensioni della letteratura matematica, aperta.', 'banche', 'https://zbmath.org/'],
      ['MathSciNet', 'Le Mathematical Reviews dell’AMS (accesso istituzionale).', 'banche', 'https://mathscinet.ams.org/mathscinet/'],
      ['Mathematics Genealogy Project', 'Chi è stato relatore di chi: l’albero genealogico dei matematici.', 'banche', 'https://www.mathgenealogy.org/'],
      ['MacTutor', 'Storia della matematica e biografie dei matematici (St Andrews).', 'banche', 'https://mathshistory.st-andrews.ac.uk/'],
      ['Project Euclid', 'Riviste e monografie di matematica e statistica.', 'banche', 'https://projecteuclid.org/'],
      ['JSTOR', 'Archivio storico di riviste accademiche.', 'banche', 'https://www.jstor.org/'],
      ['OEIS', 'L’enciclopedia delle successioni di interi.', 'dati', 'https://oeis.org/'],
      ['DLMF', 'NIST Digital Library of Mathematical Functions: le funzioni speciali.', 'dati', 'https://dlmf.nist.gov/'],
      ['LMFDB', 'Banca dati di forme modulari, curve ellittiche, funzioni L e campi di numeri.', 'dati', 'https://www.lmfdb.org/'],
      ['MathWorld', 'L’enciclopedia di matematica di Wolfram.', 'dati', 'https://mathworld.wolfram.com/'],
      ['nLab', 'Wiki di matematica, fisica e filosofia dal punto di vista delle categorie.', 'dati', 'https://ncatlab.org/nlab/show/HomePage'],
      ['Encyclopedia of Mathematics', 'L’enciclopedia della EMS e di Springer.', 'dati', 'https://encyclopediaofmath.org/'],
      ['ProofWiki', 'Raccolta di dimostrazioni.', 'dati', 'https://proofwiki.org/'],
      ['Stacks Project', 'Il testo di riferimento aperto di geometria algebrica.', 'dati', 'https://stacks.math.columbia.edu/'],
      ['Kerodon', 'Testo aperto di teoria delle categorie superiori.', 'dati', 'https://kerodon.net/'],
      ['House of Graphs', 'Banca dati di grafi interessanti.', 'dati', 'https://houseofgraphs.org/'],
      ['MathOverflow', 'Domande e risposte di matematica di ricerca.', 'corsi', 'https://mathoverflow.net/'],
      ['Mathematics Stack Exchange', 'Domande e risposte di matematica a ogni livello.', 'corsi', 'https://math.stackexchange.com/'],
      ['MIT OpenCourseWare · Mathematics', 'Corsi completi di matematica del MIT.', 'corsi', 'https://ocw.mit.edu/search/?d=Mathematics'],
      ['Khan Academy · Matematica', 'Lezioni ed esercizi dall’aritmetica all’analisi.', 'corsi', 'https://www.khanacademy.org/math'],
      ['OpenStax Calculus', 'Manuale di analisi aperto e gratuito.', 'corsi', 'https://openstax.org/details/books/calculus-volume-1'],
      ['Paul’s Online Notes', 'Dispense ed esercizi di analisi ed equazioni differenziali (Lamar University).', 'corsi', 'https://tutorial.math.lamar.edu/'],
      ['LibreTexts Mathematics', 'Biblioteca di testi aperti di matematica.', 'corsi', 'https://math.libretexts.org/'],
      ['3Blue1Brown', 'Lezioni animate: algebra lineare, analisi, reti neurali.', 'corsi', 'https://www.3blue1brown.com/'],
      ['Hatcher · Algebraic Topology', 'Il testo di topologia algebrica, libero dalla pagina dell’autore.', 'corsi', 'https://pi.math.cornell.edu/~hatcher/AT/ATpage.html'],
      ['Terence Tao · blog', 'Il blog di ricerca e di dispense di Terence Tao.', 'corsi', 'https://terrytao.wordpress.com/'],
      ['GeoGebra', 'Geometria dinamica, grafici, CAS: anche in italiano.', 'simul', 'https://www.geogebra.org/'],
      ['Desmos', 'Calcolatrice grafica nel browser.', 'simul', 'https://www.desmos.com/calculator'],
      ['Wolfram|Alpha', 'Motore di calcolo: integrali, equazioni, grafici.', 'simul', 'https://www.wolframalpha.com/'],
      ['Detexify', 'Disegni un simbolo e trovi il comando LaTeX.', 'simul', 'https://detexify.kirelabs.org/classify.html'],
      ['SageMath', 'Sistema di calcolo matematico libero basato su Python.', 'software', 'https://www.sagemath.org/'],
      ['GAP', 'Algebra computazionale discreta: gruppi, rappresentazioni.', 'software', 'https://www.gap-system.org/'],
      ['PARI/GP', 'Calcolo per la teoria dei numeri.', 'software', 'https://pari.math.u-bordeaux.fr/'],
      ['Maxima', 'Sistema di calcolo simbolico libero.', 'software', 'https://maxima.sourceforge.io/'],
      ['SymPy', 'Calcolo simbolico in Python.', 'software', 'https://www.sympy.org/'],
      ['Macaulay2', 'Algebra commutativa e geometria algebrica computazionale.', 'software', 'https://macaulay2.com/'],
      ['Lean', 'Dimostratore interattivo di teoremi e linguaggio di programmazione.', 'software', 'https://lean-lang.org/'],
      ['R', 'Ambiente per la statistica e i grafici.', 'software', 'https://www.r-project.org/'],
      ['CTAN', 'L’archivio dei pacchetti TeX e LaTeX.', 'software', 'https://ctan.org/'],
      ['Overleaf', 'Editor LaTeX collaborativo nel browser.', 'software', 'https://www.overleaf.com/'],
      ['Annals of Mathematics', 'Una delle riviste di matematica più selettive (Princeton).', 'riviste', 'https://annals.math.princeton.edu/'],
      ['Inventiones Mathematicae', 'Rivista di ricerca di Springer.', 'riviste', 'https://link.springer.com/journal/222'],
      ['Journal of the AMS', 'La rivista di ricerca dell’American Mathematical Society.', 'riviste', 'https://www.ams.org/jams'],
      ['Bulletin of the AMS', 'Rassegne e recensioni dell’AMS.', 'riviste', 'https://www.ams.org/bull'],
      ['Notices of the AMS', 'La rivista divulgativa per i membri dell’AMS.', 'riviste', 'https://www.ams.org/notices'],
      ['EMS Press', 'L’editore della European Mathematical Society.', 'riviste', 'https://ems.press/'],
      ['Electronic Journal of Combinatorics', 'Rivista di combinatoria ad accesso aperto.', 'riviste', 'https://www.combinatorics.org/'],
      ['Quanta Magazine', 'Giornalismo scientifico sulla ricerca matematica e fisica.', 'riviste', 'https://www.quantamagazine.org/'],
      ['American Mathematical Society', 'La società dei matematici americani.', 'societa', 'https://www.ams.org/'],
      ['European Mathematical Society', 'La società matematica europea.', 'societa', 'https://euromathsoc.org/'],
      ['Unione Matematica Italiana', 'L’UMI: congressi, Bollettino, didattica.', 'societa', 'https://umi.dm.unibo.it/'],
      ['INdAM', 'Istituto Nazionale di Alta Matematica «Francesco Severi».', 'societa', 'https://www.altamatematica.it/'],
      ['International Mathematical Union', 'L’unione internazionale: congresso mondiale, Medaglia Fields.', 'societa', 'https://www.mathunion.org/'],
      ['SIAM', 'Society for Industrial and Applied Mathematics.', 'societa', 'https://www.siam.org/'],
      ['Mathematical Association of America', 'Associazione per la matematica universitaria.', 'societa', 'https://maa.org/'],
      ['London Mathematical Society', 'La società matematica britannica.', 'societa', 'https://www.lms.ac.uk/'],
      ['Clay Mathematics Institute', 'I Problemi del Millennio.', 'societa', 'https://www.claymath.org/'],
      ['IHES', 'Institut des Hautes Études Scientifiques.', 'societa', 'https://www.ihes.fr/']
    ]),
    chimica: voci([
      ['PubChem', 'Banca dati di molecole, proprietà, saggi biologici e sicurezza (NIH).', 'banche', 'https://pubchem.ncbi.nlm.nih.gov/'],
      ['ChemSpider', 'Banca dati di strutture chimiche della Royal Society of Chemistry.', 'banche', 'https://www.chemspider.com/'],
      ['CAS Common Chemistry', 'Numeri CAS e nomi di circa mezzo milione di sostanze, aperti.', 'banche', 'https://commonchemistry.cas.org/'],
      ['ChEBI', 'Entità chimiche di interesse biologico (EMBL-EBI).', 'banche', 'https://www.ebi.ac.uk/chebi/'],
      ['ChEMBL', 'Molecole bioattive e loro attività sui bersagli (EMBL-EBI).', 'banche', 'https://www.ebi.ac.uk/chembl/'],
      ['RCSB Protein Data Bank', 'Le strutture 3D di proteine e acidi nucleici.', 'banche', 'https://www.rcsb.org/'],
      ['PDBe', 'Il Protein Data Bank europeo.', 'banche', 'https://www.ebi.ac.uk/pdbe/'],
      ['CCDC · Cambridge Structural Database', 'Le strutture cristalline delle piccole molecole organiche e metallorganiche.', 'banche', 'https://www.ccdc.cam.ac.uk/'],
      ['Crystallography Open Database', 'Strutture cristalline aperte.', 'banche', 'https://www.crystallography.net/cod/'],
      ['Materials Project', 'Proprietà calcolate dei materiali inorganici.', 'banche', 'https://materialsproject.org/'],
      ['DrugBank', 'Farmaci, bersagli e interazioni.', 'banche', 'https://go.drugbank.com/'],
      ['UniProt', 'Sequenze e funzioni delle proteine.', 'banche', 'https://www.uniprot.org/'],
      ['KEGG', 'Vie metaboliche e reti molecolari.', 'banche', 'https://www.genome.jp/kegg/'],
      ['PubMed', 'La bibliografia biomedica della National Library of Medicine.', 'banche', 'https://pubmed.ncbi.nlm.nih.gov/'],
      ['Reaxys', 'Reazioni, sostanze e proprietà dalla letteratura (accesso istituzionale).', 'banche', 'https://www.reaxys.com/'],
      ['CAS SciFinder', 'La banca dati del Chemical Abstracts Service (accesso istituzionale).', 'banche', 'https://scifinder-n.cas.org/'],
      ['ECHA', 'Agenzia europea per le sostanze chimiche: registrazioni REACH, classificazioni.', 'banche', 'https://echa.europa.eu/'],
      ['NIST Chemistry WebBook', 'Termochimica, spettri IR, UV-Vis e di massa, dati di fase.', 'dati', 'https://webbook.nist.gov/chemistry/'],
      ['SDBS (AIST)', 'Banca dati di spettri NMR, IR, Raman e di massa dei composti organici.', 'dati', 'https://sdbs.db.aist.go.jp/'],
      ['NIST CCCBDB', 'Confronto fra dati sperimentali e calcoli di chimica quantistica.', 'dati', 'https://cccbdb.nist.gov/'],
      ['IUPAC Gold Book', 'Il compendio ufficiale della terminologia chimica.', 'dati', 'https://goldbook.iupac.org/'],
      ['IUPAC · tavola periodica', 'La tavola periodica ufficiale con i pesi atomici aggiornati.', 'dati', 'https://iupac.org/what-we-do/periodic-table-of-elements/'],
      ['Organic Chemistry Data', 'Tabelle di pKa, spostamenti NMR, reazioni (collezione Reich ed Evans).', 'dati', 'https://organicchemistrydata.org/'],
      ['HMDB', 'Human Metabolome Database: metaboliti e loro spettri.', 'dati', 'https://hmdb.ca/'],
      ['nmrshiftdb2', 'Banca dati aperta di spettri NMR e predizione degli spostamenti.', 'dati', 'https://nmrshiftdb.nmr.uni-koeln.de/'],
      ['MassBank Europe', 'Spettri di massa di riferimento ad accesso aperto.', 'dati', 'https://massbank.eu/MassBank/'],
      ['WebElements', 'Proprietà degli elementi della tavola periodica.', 'dati', 'https://www.webelements.com/'],
      ['Ptable', 'Tavola periodica interattiva.', 'dati', 'https://ptable.com/'],
      ['Chemistry LibreTexts', 'Biblioteca di testi aperti di chimica a ogni livello.', 'corsi', 'https://chem.libretexts.org/'],
      ['MIT OpenCourseWare · Chemistry', 'Corsi completi di chimica del MIT.', 'corsi', 'https://ocw.mit.edu/search/?d=Chemistry'],
      ['OpenStax Chemistry 2e', 'Manuale di chimica generale aperto e gratuito.', 'corsi', 'https://openstax.org/details/books/chemistry-2e'],
      ['Khan Academy · Chimica', 'Lezioni ed esercizi di chimica generale e organica.', 'corsi', 'https://www.khanacademy.org/science/chemistry'],
      ['Organic Chemistry Portal', 'Reazioni di nome, gruppi protettivi, sintesi recenti.', 'corsi', 'https://www.organic-chemistry.org/'],
      ['Master Organic Chemistry', 'Spiegazioni e schemi di chimica organica.', 'corsi', 'https://www.masterorganicchemistry.com/'],
      ['ChemTube3D', 'Meccanismi di reazione e strutture in 3D (Università di Liverpool).', 'simul', 'https://www.chemtube3d.com/'],
      ['MolView', 'Disegni una molecola e la vedi in 3D, nel browser.', 'simul', 'https://molview.org/'],
      ['Jmol', 'Visualizzatore molecolare libero.', 'simul', 'https://jmol.sourceforge.net/'],
      ['ChemRxiv', 'Il server di preprint della chimica.', 'preprint', 'https://chemrxiv.org/'],
      ['arXiv · physics.chem-ph', 'Preprint di chimica fisica e chimica teorica.', 'preprint', 'https://arxiv.org/list/physics.chem-ph/recent'],
      ['Journal of the American Chemical Society', 'La rivista ammiraglia dell’ACS.', 'riviste', 'https://pubs.acs.org/journal/jacsat'],
      ['Chemical Reviews', 'Rassegne di riferimento dell’ACS.', 'riviste', 'https://pubs.acs.org/journal/chreay'],
      ['Journal of Chemical Education', 'La rivista dell’ACS sulla didattica della chimica.', 'riviste', 'https://pubs.acs.org/journal/jceda8'],
      ['Angewandte Chemie', 'Rivista della Società chimica tedesca (Wiley-VCH).', 'riviste', 'https://onlinelibrary.wiley.com/journal/15213773'],
      ['Nature Chemistry', 'Rivista di chimica del gruppo Nature.', 'riviste', 'https://www.nature.com/nchem/'],
      ['Chemical Science', 'Rivista ad accesso aperto della Royal Society of Chemistry.', 'riviste', 'https://pubs.rsc.org/en/journals/journalissues/sc'],
      ['IUPAC', 'L’Unione internazionale di chimica pura e applicata: nomenclatura, simboli.', 'societa', 'https://iupac.org/'],
      ['American Chemical Society', 'La società dei chimici americani.', 'societa', 'https://www.acs.org/'],
      ['Royal Society of Chemistry', 'La società chimica britannica.', 'societa', 'https://www.rsc.org/'],
      ['Società Chimica Italiana', 'La SCI: divisioni, congressi, La Chimica e l’Industria.', 'societa', 'https://www.soc.chim.it/'],
      ['EuChemS', 'La società chimica europea.', 'societa', 'https://www.euchems.eu/'],
      ['GDCh', 'La Società chimica tedesca.', 'societa', 'https://www.gdch.de/'],
      ['Avogadro', 'Editor e visualizzatore molecolare libero.', 'software', 'https://avogadro.cc/'],
      ['RDKit', 'Chemioinformatica in Python e C++.', 'software', 'https://www.rdkit.org/'],
      ['Open Babel', 'Conversione fra formati di file chimici.', 'software', 'https://openbabel.org/'],
      ['PyMOL', 'Visualizzazione di macromolecole.', 'software', 'https://pymol.org/'],
      ['UCSF ChimeraX', 'Visualizzazione e analisi di strutture molecolari.', 'software', 'https://www.cgl.ucsf.edu/chimerax/'],
      ['VMD', 'Visualizzazione di dinamiche molecolari.', 'software', 'https://www.ks.uiuc.edu/Research/vmd/'],
      ['ORCA', 'Chimica quantistica, gratuito per l’uso accademico.', 'software', 'https://www.faccts.de/orca/'],
      ['Psi4', 'Chimica quantistica libera.', 'software', 'https://psicode.org/'],
      ['Quantum ESPRESSO', 'Calcoli DFT a onde piane per i solidi (nato in Italia).', 'software', 'https://www.quantum-espresso.org/'],
      ['CP2K', 'Dinamica molecolare ab initio e DFT.', 'software', 'https://www.cp2k.org/'],
      ['Gaussian', 'Il programma commerciale di chimica quantistica.', 'software', 'https://gaussian.com/']
    ])
  };

  /* ═════════════════════════════════════════════════════════════════════════
     2 · LA BIBLIOGRAFIA
     [autori (solo cognomi), titolo, editore, livello]. Niente anni, niente
     ISBN: le edizioni cambiano, la ricerca trova sempre quella corrente.
     ═════════════════════════════════════════════════════════════════════════ */
  var LIVELLI = {
    base: ['Base (primo anno)', 'Introductory (first year)'],
    univ: ['Universitario', 'Undergraduate'],
    avanzato: ['Avanzato (magistrale)', 'Advanced (graduate)'],
    dottorato: ['Dottorato e ricerca', 'Doctoral and research']
  };
  function libri(lista) { return lista.map(function (r) { return { autori: r[0], titolo: r[1], editore: r[2], livello: r[3] }; }); }
  var LIBRI = {
    fisica: libri([
      ['Halliday, Resnick, Krane', 'Physics (ed. it. Fisica)', 'Wiley · ed. it. CEA', 'base'],
      ['Mazzoldi, Nigro, Voci', 'Fisica (voll. I e II)', 'EdiSES', 'base'],
      ['Mencuccini, Silvestrini', 'Fisica I · Meccanica e termodinamica', 'Liguori', 'base'],
      ['Focardi, Massa, Uguzzoni', 'Fisica generale', 'Casa Editrice Ambrosiana', 'base'],
      ['Serway, Jewett', 'Physics for Scientists and Engineers', 'Cengage', 'base'],
      ['Young, Freedman', 'University Physics', 'Pearson', 'base'],
      ['Tipler, Mosca', 'Physics for Scientists and Engineers', 'W. H. Freeman', 'base'],
      ['Giancoli', 'Physics for Scientists and Engineers', 'Pearson', 'base'],
      ['Taylor', 'An Introduction to Error Analysis', 'University Science Books', 'base'],
      ['Feynman, Leighton, Sands', 'The Feynman Lectures on Physics', 'Addison-Wesley · ed. it. Zanichelli', 'univ'],
      ['Purcell, Morin', 'Electricity and Magnetism', 'Cambridge University Press', 'univ'],
      ['Kleppner, Kolenkow', 'An Introduction to Mechanics', 'Cambridge University Press', 'univ'],
      ['Taylor', 'Classical Mechanics', 'University Science Books', 'univ'],
      ['Griffiths', 'Introduction to Electrodynamics', 'Cambridge University Press', 'univ'],
      ['Griffiths, Schroeter', 'Introduction to Quantum Mechanics', 'Cambridge University Press', 'univ'],
      ['Hecht', 'Optics', 'Pearson', 'univ'],
      ['Reif', 'Fundamentals of Statistical and Thermal Physics', 'McGraw-Hill', 'univ'],
      ['Schroeder', 'An Introduction to Thermal Physics', 'Addison-Wesley', 'univ'],
      ['Callen', 'Thermodynamics and an Introduction to Thermostatistics', 'Wiley', 'univ'],
      ['Eisberg, Resnick', 'Quantum Physics of Atoms, Molecules, Solids, Nuclei, and Particles', 'Wiley', 'univ'],
      ['Kittel', 'Introduction to Solid State Physics', 'Wiley', 'univ'],
      ['Krane', 'Introductory Nuclear Physics', 'Wiley', 'univ'],
      ['Griffiths', 'Introduction to Elementary Particles', 'Wiley-VCH', 'univ'],
      ['Carroll, Ostlie', 'An Introduction to Modern Astrophysics', 'Cambridge University Press', 'univ'],
      ['Boas', 'Mathematical Methods in the Physical Sciences', 'Wiley', 'univ'],
      ['Goldstein, Poole, Safko', 'Classical Mechanics', 'Addison-Wesley', 'avanzato'],
      ['Landau, Lifshitz', 'Course of Theoretical Physics (ed. it. Fisica teorica)', 'Butterworth-Heinemann · ed. it. Editori Riuniti', 'avanzato'],
      ['Jackson', 'Classical Electrodynamics', 'Wiley', 'avanzato'],
      ['Sakurai, Napolitano', 'Modern Quantum Mechanics', 'Cambridge University Press', 'avanzato'],
      ['Cohen-Tannoudji, Diu, Laloë', 'Quantum Mechanics', 'Wiley', 'avanzato'],
      ['Shankar', 'Principles of Quantum Mechanics', 'Springer', 'avanzato'],
      ['Messiah', 'Quantum Mechanics', 'Dover', 'avanzato'],
      ['Ashcroft, Mermin', 'Solid State Physics', 'Saunders College', 'avanzato'],
      ['Huang', 'Statistical Mechanics', 'Wiley', 'avanzato'],
      ['Pathria, Beale', 'Statistical Mechanics', 'Academic Press', 'avanzato'],
      ['Born, Wolf', 'Principles of Optics', 'Cambridge University Press', 'avanzato'],
      ['Hartle', 'Gravity: An Introduction to Einstein’s General Relativity', 'Addison-Wesley', 'avanzato'],
      ['Carroll', 'Spacetime and Geometry', 'Addison-Wesley', 'avanzato'],
      ['Arfken, Weber, Harris', 'Mathematical Methods for Physicists', 'Academic Press', 'avanzato'],
      ['Bransden, Joachain', 'Physics of Atoms and Molecules', 'Pearson', 'avanzato'],
      ['Halzen, Martin', 'Quarks and Leptons', 'Wiley', 'avanzato'],
      ['Weinberg', 'The Quantum Theory of Fields', 'Cambridge University Press', 'dottorato'],
      ['Peskin, Schroeder', 'An Introduction to Quantum Field Theory', 'Addison-Wesley', 'dottorato'],
      ['Srednicki', 'Quantum Field Theory', 'Cambridge University Press', 'dottorato'],
      ['Zee', 'Quantum Field Theory in a Nutshell', 'Princeton University Press', 'dottorato'],
      ['Misner, Thorne, Wheeler', 'Gravitation', 'W. H. Freeman', 'dottorato'],
      ['Wald', 'General Relativity', 'University of Chicago Press', 'dottorato'],
      ['Weinberg', 'Gravitation and Cosmology', 'Wiley', 'dottorato'],
      ['Weinberg', 'Cosmology', 'Oxford University Press', 'dottorato'],
      ['Chaikin, Lubensky', 'Principles of Condensed Matter Physics', 'Cambridge University Press', 'dottorato'],
      ['Altland, Simons', 'Condensed Matter Field Theory', 'Cambridge University Press', 'dottorato'],
      ['Goldenfeld', 'Lectures on Phase Transitions and the Renormalization Group', 'Addison-Wesley', 'dottorato'],
      ['Nielsen, Chuang', 'Quantum Computation and Quantum Information', 'Cambridge University Press', 'dottorato'],
      ['Rybicki, Lightman', 'Radiative Processes in Astrophysics', 'Wiley', 'dottorato']
    ]),
    matematica: libri([
      ['Bramanti, Pagani, Salsa', 'Analisi matematica 1', 'Zanichelli', 'base'],
      ['Marcellini, Sbordone', 'Analisi matematica uno', 'Liguori', 'base'],
      ['Giusti', 'Analisi matematica 1', 'Bollati Boringhieri', 'base'],
      ['Prodi', 'Analisi matematica', 'Bollati Boringhieri', 'base'],
      ['Abate, de Fabritiis', 'Geometria analitica con elementi di algebra lineare', 'McGraw-Hill', 'base'],
      ['Spivak', 'Calculus', 'Publish or Perish', 'base'],
      ['Apostol', 'Calculus', 'Wiley', 'base'],
      ['Courant, John', 'Introduction to Calculus and Analysis', 'Springer', 'base'],
      ['Stewart', 'Calculus', 'Cengage', 'base'],
      ['Strang', 'Introduction to Linear Algebra', 'Wellesley-Cambridge Press', 'base'],
      ['Lang', 'Linear Algebra', 'Springer', 'base'],
      ['Courant, Robbins', 'What Is Mathematics?', 'Oxford University Press', 'base'],
      ['Pólya', 'How to Solve It', 'Princeton University Press', 'base'],
      ['Giusti', 'Analisi matematica 2', 'Bollati Boringhieri', 'univ'],
      ['Sernesi', 'Geometria 1', 'Bollati Boringhieri', 'univ'],
      ['Rudin', 'Principles of Mathematical Analysis', 'McGraw-Hill', 'univ'],
      ['Hoffman, Kunze', 'Linear Algebra', 'Prentice-Hall', 'univ'],
      ['Axler', 'Linear Algebra Done Right', 'Springer', 'univ'],
      ['Artin', 'Algebra', 'Pearson', 'univ'],
      ['Herstein', 'Topics in Algebra', 'Wiley', 'univ'],
      ['Dummit, Foote', 'Abstract Algebra', 'Wiley', 'univ'],
      ['do Carmo', 'Differential Geometry of Curves and Surfaces', 'Prentice-Hall', 'univ'],
      ['Munkres', 'Topology', 'Prentice-Hall', 'univ'],
      ['Ahlfors', 'Complex Analysis', 'McGraw-Hill', 'univ'],
      ['Arnold', 'Ordinary Differential Equations', 'Springer', 'univ'],
      ['Feller', 'An Introduction to Probability Theory and Its Applications', 'Wiley', 'univ'],
      ['Ross', 'A First Course in Probability', 'Pearson', 'univ'],
      ['Hardy, Wright', 'An Introduction to the Theory of Numbers', 'Oxford University Press', 'univ'],
      ['Quarteroni, Sacco, Saleri', 'Matematica numerica', 'Springer', 'univ'],
      ['Burden, Faires', 'Numerical Analysis', 'Cengage', 'univ'],
      ['Stein, Shakarchi', 'Fourier Analysis: An Introduction', 'Princeton University Press', 'univ'],
      ['Rosen', 'Discrete Mathematics and Its Applications', 'McGraw-Hill', 'univ'],
      ['Spivak', 'Calculus on Manifolds', 'Addison-Wesley', 'univ'],
      ['Halmos', 'Naive Set Theory', 'Springer', 'univ'],
      ['Arnold', 'Mathematical Methods of Classical Mechanics', 'Springer', 'avanzato'],
      ['Rudin', 'Real and Complex Analysis', 'McGraw-Hill', 'avanzato'],
      ['Lang', 'Algebra', 'Springer', 'avanzato'],
      ['Hatcher', 'Algebraic Topology', 'Cambridge University Press', 'avanzato'],
      ['Brezis', 'Functional Analysis, Sobolev Spaces and Partial Differential Equations', 'Springer', 'avanzato'],
      ['Evans', 'Partial Differential Equations', 'American Mathematical Society', 'avanzato'],
      ['Atiyah, Macdonald', 'Introduction to Commutative Algebra', 'Addison-Wesley', 'avanzato'],
      ['Lee', 'Introduction to Smooth Manifolds', 'Springer', 'avanzato'],
      ['Billingsley', 'Probability and Measure', 'Wiley', 'avanzato'],
      ['Stein, Shakarchi', 'Complex Analysis', 'Princeton University Press', 'avanzato'],
      ['Ireland, Rosen', 'A Classical Introduction to Modern Number Theory', 'Springer', 'avanzato'],
      ['Kolmogorov, Fomin', 'Introductory Real Analysis', 'Dover', 'avanzato'],
      ['Golub, Van Loan', 'Matrix Computations', 'Johns Hopkins University Press', 'avanzato'],
      ['Milnor', 'Topology from the Differentiable Viewpoint', 'Princeton University Press', 'avanzato'],
      ['Hartshorne', 'Algebraic Geometry', 'Springer', 'dottorato'],
      ['Griffiths, Harris', 'Principles of Algebraic Geometry', 'Wiley', 'dottorato'],
      ['Bott, Tu', 'Differential Forms in Algebraic Topology', 'Springer', 'dottorato'],
      ['Mac Lane', 'Categories for the Working Mathematician', 'Springer', 'dottorato'],
      ['Serre', 'A Course in Arithmetic', 'Springer', 'dottorato'],
      ['Milnor, Stasheff', 'Characteristic Classes', 'Princeton University Press', 'dottorato'],
      ['Gilbarg, Trudinger', 'Elliptic Partial Differential Equations of Second Order', 'Springer', 'dottorato'],
      ['Reed, Simon', 'Methods of Modern Mathematical Physics', 'Academic Press', 'dottorato'],
      ['Kobayashi, Nomizu', 'Foundations of Differential Geometry', 'Wiley', 'dottorato'],
      ['Neukirch', 'Algebraic Number Theory', 'Springer', 'dottorato'],
      ['Durrett', 'Probability: Theory and Examples', 'Cambridge University Press', 'dottorato'],
      ['Kunen', 'Set Theory', 'North-Holland', 'dottorato']
    ]),
    chimica: libri([
      ['Atkins, Jones, Laverman', 'Chemical Principles (ed. it. Principi di chimica)', 'W. H. Freeman · ed. it. Zanichelli', 'base'],
      ['Petrucci, Herring, Madura, Bissonnette', 'General Chemistry (ed. it. Chimica generale)', 'Pearson · ed. it. Piccin', 'base'],
      ['Brown, LeMay, Bursten', 'Chemistry: The Central Science', 'Pearson', 'base'],
      ['Kotz, Treichel, Townsend', 'Chemistry & Chemical Reactivity', 'Cengage', 'base'],
      ['Silberberg', 'Chemistry: The Molecular Nature of Matter and Change', 'McGraw-Hill', 'base'],
      ['Zumdahl', 'Chemistry', 'Cengage', 'base'],
      ['Bertini, Luchinat, Mani', 'Stechiometria', 'Casa Editrice Ambrosiana', 'base'],
      ['Michelin Lausarot, Vaglio', 'Stechiometria per la chimica generale', 'Piccin', 'base'],
      ['Atkins, de Paula', 'Physical Chemistry (ed. it. Chimica fisica)', 'Oxford University Press · ed. it. Zanichelli', 'univ'],
      ['McQuarrie, Simon', 'Physical Chemistry: A Molecular Approach', 'University Science Books', 'univ'],
      ['Clayden, Greeves, Warren', 'Organic Chemistry', 'Oxford University Press', 'univ'],
      ['Brown, Iverson, Anslyn, Foote', 'Organic Chemistry', 'Cengage', 'univ'],
      ['Bruice', 'Organic Chemistry', 'Pearson', 'univ'],
      ['Wade', 'Organic Chemistry', 'Pearson', 'univ'],
      ['Vollhardt, Schore', 'Organic Chemistry: Structure and Function', 'W. H. Freeman', 'univ'],
      ['Housecroft, Sharpe', 'Inorganic Chemistry', 'Pearson', 'univ'],
      ['Shriver, Atkins (Weller et al.)', 'Inorganic Chemistry', 'Oxford University Press', 'univ'],
      ['Greenwood, Earnshaw', 'Chemistry of the Elements', 'Butterworth-Heinemann', 'univ'],
      ['Harris', 'Quantitative Chemical Analysis', 'W. H. Freeman', 'univ'],
      ['Skoog, West, Holler, Crouch', 'Fundamentals of Analytical Chemistry', 'Cengage', 'univ'],
      ['Skoog, Holler, Crouch', 'Principles of Instrumental Analysis', 'Cengage', 'univ'],
      ['Nelson, Cox', 'Lehninger Principles of Biochemistry', 'W. H. Freeman', 'univ'],
      ['Berg, Tymoczko, Stryer', 'Biochemistry', 'W. H. Freeman', 'univ'],
      ['Silverstein, Webster, Kiemle', 'Spectrometric Identification of Organic Compounds', 'Wiley', 'univ'],
      ['Pretsch, Bühlmann, Badertscher', 'Structure Determination of Organic Compounds', 'Springer', 'univ'],
      ['Pavia, Lampman, Kriz', 'Introduction to Spectroscopy', 'Cengage', 'univ'],
      ['Banwell, McCash', 'Fundamentals of Molecular Spectroscopy', 'McGraw-Hill', 'univ'],
      ['Levine', 'Quantum Chemistry', 'Pearson', 'univ'],
      ['Atkins, Friedman', 'Molecular Quantum Mechanics', 'Oxford University Press', 'univ'],
      ['Cotton', 'Chemical Applications of Group Theory', 'Wiley', 'univ'],
      ['Smith (March)', 'March’s Advanced Organic Chemistry', 'Wiley', 'avanzato'],
      ['Carey, Sundberg', 'Advanced Organic Chemistry', 'Springer', 'avanzato'],
      ['Anslyn, Dougherty', 'Modern Physical Organic Chemistry', 'University Science Books', 'avanzato'],
      ['Cotton, Wilkinson', 'Advanced Inorganic Chemistry', 'Wiley', 'avanzato'],
      ['Huheey, Keiter, Keiter', 'Inorganic Chemistry: Principles of Structure and Reactivity', 'HarperCollins', 'avanzato'],
      ['Hartwig', 'Organotransition Metal Chemistry', 'University Science Books', 'avanzato'],
      ['Szabo, Ostlund', 'Modern Quantum Chemistry', 'Dover', 'avanzato'],
      ['McQuarrie', 'Statistical Mechanics', 'University Science Books', 'avanzato'],
      ['Wilson, Decius, Cross', 'Molecular Vibrations', 'Dover', 'avanzato'],
      ['Harris, Bertolucci', 'Symmetry and Spectroscopy', 'Dover', 'avanzato'],
      ['Claridge', 'High-Resolution NMR Techniques in Organic Chemistry', 'Elsevier', 'avanzato'],
      ['Levitt', 'Spin Dynamics', 'Wiley', 'avanzato'],
      ['Nicolaou, Sorensen', 'Classics in Total Synthesis', 'Wiley-VCH', 'avanzato'],
      ['Helgaker, Jørgensen, Olsen', 'Molecular Electronic-Structure Theory', 'Wiley', 'dottorato'],
      ['Jensen', 'Introduction to Computational Chemistry', 'Wiley', 'dottorato'],
      ['Cramer', 'Essentials of Computational Chemistry', 'Wiley', 'dottorato'],
      ['Parr, Yang', 'Density-Functional Theory of Atoms and Molecules', 'Oxford University Press', 'dottorato'],
      ['Allen, Tildesley', 'Computer Simulation of Liquids', 'Oxford University Press', 'dottorato'],
      ['Frenkel, Smit', 'Understanding Molecular Simulation', 'Academic Press', 'dottorato'],
      ['Abragam', 'The Principles of Nuclear Magnetism', 'Oxford University Press', 'dottorato'],
      ['Herzberg', 'Molecular Spectra and Molecular Structure', 'Van Nostrand', 'dottorato'],
      ['Bunker, Jensen', 'Molecular Symmetry and Spectroscopy', 'NRC Research Press', 'dottorato'],
      ['Zare', 'Angular Momentum', 'Wiley', 'dottorato'],
      ['Mukamel', 'Principles of Nonlinear Optical Spectroscopy', 'Oxford University Press', 'dottorato'],
      ['Corey, Cheng', 'The Logic of Chemical Synthesis', 'Wiley', 'dottorato']
    ])
  };

  function cercaLibro(libro) {
    /* titolo senza le note fra parentesi + primo cognome: e' la chiave che
       i cataloghi capiscono meglio */
    var tit = String(libro.titolo || '').replace(/\s*\([^)]*\)\s*/g, ' ').trim();
    var primo = String(libro.autori || '').split(/[,(]/)[0].trim();
    var q = (tit + ' ' + primo).trim();
    return { google: L.googleLibri(q), worldcat: L.worldcat(q), sbn: L.sbn(q), q: q };
  }

  F.calcolo.risorse = { LINK: LINK, LIBRI: LIBRI, CATEGORIE: CATEGORIE, LIVELLI: LIVELLI, linkTradotto: L.tradotto, cercaLibro: cercaLibro };

  /* ═════════════════════════════════════════════════════════════════════════
     3 · LE CITAZIONI
     Il record interno: { tipo, titolo, autori:[{cognome, nome} | {org}],
     rivista, volume, numero, pagine, articolo, anno, mese, editore, doi, url }
     ═════════════════════════════════════════════════════════════════════════ */
  /* un DOI comincia sempre con «10.», un registrante di 4–9 cifre e una
     barra. Si accettano le forme che si incollano davvero: «doi:…»,
     https://doi.org/…, http://dx.doi.org/…, con spazi, con il punto finale
     della frase, con la codifica %2F. Restituisce null se non e' un DOI. */
  function normalizzaDoi(s) {
    if (s == null) return null;
    var d = String(s).trim();
    try { if (/%[0-9a-f]{2}/i.test(d)) d = decodeURIComponent(d); } catch (e) { }
    d = d.replace(/^\s*doi\s*:\s*/i, '')
      .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
      .replace(/^(dx\.)?doi\.org\//i, '')
      .replace(/^\s*doi\s*:\s*/i, '')
      .trim()
      .replace(/[.,;:]+$/, '');
    /* una parentesi in fondo si toglie solo se e' spaiata: «(vedi doi:10.1000/x)» */
    function conta(s, c) { return s.split(c).length - 1; }
    while (/[)\]]$/.test(d) && conta(d, d.slice(-1) === ')' ? '(' : '[') < conta(d, d.slice(-1))) d = d.slice(0, -1).replace(/[.,;:]+$/, '');
    if (/\s/.test(d)) return null;
    return /^10\.\d{4,9}\/\S+$/.test(d) ? d : null;
  }

  function testoPulito(x) {
    if (Array.isArray(x)) x = x[0];
    if (x == null) return '';
    return String(x).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, '\'').replace(/\s+/g, ' ').trim();
  }
  var TIPI = { 'journal-article': 'articolo', 'book': 'libro', 'monograph': 'libro', 'edited-book': 'libro', 'book-chapter': 'capitolo', 'proceedings-article': 'atti' };

  /* dalla risposta di Crossref (con o senza l'involucro {status, message})
     al record. Lettura TOLLERANTE: ogni campo ha i suoi ripieghi. Se non c'e'
     ne' un titolo ne' un DOI la forma non e' riconosciuta: null. */
  function daCrossref(json) {
    if (!json || typeof json !== 'object') return null;
    var m = json.message && typeof json.message === 'object' && !Array.isArray(json.message) ? json.message : json;
    var titolo = testoPulito(m.title);
    var sotto = testoPulito(m.subtitle);
    if (sotto && titolo && titolo.indexOf(sotto) < 0) titolo += ': ' + sotto;
    var doi = normalizzaDoi(m.DOI || m.doi || '');
    if (!titolo && !doi) return null;
    var autori = (Array.isArray(m.author) ? m.author : []).map(function (a) {
      if (!a || typeof a !== 'object') return null;
      if (a.family) return { cognome: testoPulito(a.family), nome: testoPulito(a.given || '') };
      if (a.name) return { org: testoPulito(a.name) };
      if (a.given) return { cognome: testoPulito(a.given), nome: '' };
      return null;
    }).filter(Boolean);
    var data = null;
    ['published-print', 'published-online', 'published', 'issued', 'created'].some(function (k) {
      var p = m[k] && m[k]['date-parts'] && m[k]['date-parts'][0];
      if (p && p[0] != null && isFinite(+p[0])) { data = p; return true; }
      return false;
    });
    var tipo = TIPI[m.type] || (m.type ? 'altro' : 'articolo');
    var cont = testoPulito(m['container-title']);
    return {
      tipo: tipo, titolo: titolo, autori: autori,
      rivista: tipo === 'libro' ? '' : cont,
      volume: m.volume != null ? String(m.volume) : '',
      numero: m.issue != null ? String(m.issue) : '',
      pagine: m.page != null ? String(m.page) : '',
      articolo: m['article-number'] != null ? String(m['article-number']) : '',
      anno: data ? String(data[0]) : '', mese: data && data[1] ? +data[1] : 0,
      editore: testoPulito(m.publisher), doi: doi || '',
      url: m.URL ? String(m.URL) : ''
    };
  }

  /* ── pezzi comuni ── */
  function iniziali(nome) {
    return String(nome || '').trim().split(/\s+/).filter(Boolean).map(function (p) {
      return p.split('-').filter(Boolean).map(function (q) {
        var c = q.charAt(0).toUpperCase();
        return /[A-Za-zÀ-ÖØ-öø-ÿĀ-ž]/.test(c) ? c + '.' : '';
      }).filter(Boolean).join('-');
    }).filter(Boolean).join(' ');
  }
  function corsivo(s, html) { return html ? '<i>' + esc(s) + '</i>' : s; }
  function testo(s, html) { return html ? esc(s) : s; }
  function trattino(p) { return String(p || '').replace(/\s*[-‐‑–—]+\s*/g, '–'); }
  function chiudi(s) { return /[.?!]$/.test(s) ? s : s + '.'; }
  function linkDoi(rec) { return rec.doi ? L.doi(rec.doi) : (rec.url || ''); }

  /* APA 7. Fino a 20 autori tutti, con «&» prima dell'ultimo; da 21 in su
     i primi 19, poi «. . .», poi l'ultimo (senza «&»). */
  function apaAutore(a) {
    if (a.org) return a.org;
    var i = iniziali(a.nome);
    return a.cognome + (i ? ', ' + i : '');
  }
  function apaAutori(aa) {
    var n = aa.length, v = aa.map(apaAutore);
    if (!n) return '';
    if (n === 1) return v[0];
    if (n <= 20) return v.slice(0, -1).join(', ') + ', & ' + v[n - 1];
    return v.slice(0, 19).join(', ') + ', . . . ' + v[n - 1];
  }
  function apa(rec, html) {
    var aut = apaAutori(rec.autori || []);
    var anno = '(' + (rec.anno || 'n.d.') + ').';
    var tit = rec.titolo || '';
    var s;
    if (rec.tipo === 'libro') {
      s = (aut ? testo(chiudi(aut), html) + ' ' + anno + ' ' + corsivo(tit, html) + '.' : corsivo(tit, html) + '. ' + anno);
      /* APA 7: se l'editore e' lo stesso ente autore, non si ripete */
      var aa = rec.autori || [];
      if (rec.editore && !(aa.length === 1 && aa[0].org === rec.editore)) s += ' ' + testo(chiudi(rec.editore), html);
    } else {
      s = aut ? testo(chiudi(aut) + ' ' + anno + ' ' + chiudi(tit), html) : testo(chiudi(tit) + ' ' + anno, html);
      if (rec.rivista) {
        s += ' ' + corsivo(rec.rivista, html);
        if (rec.volume) s += ', ' + corsivo(rec.volume, html);
        if (rec.numero) s += testo('(' + rec.numero + ')', html);
        if (rec.pagine) s += testo(', ' + trattino(rec.pagine), html);
        else if (rec.articolo) s += testo(', Article ' + rec.articolo, html);
        s += '.';
      } else if (rec.editore) s += ' ' + testo(chiudi(rec.editore), html);
    }
    var u = linkDoi(rec);
    if (u) s += ' ' + testo(u, html);
    return s;
  }

  /* IEEE: «M. Rossi and L. Bianchi»; tre-sei autori con la virgola e
     «and»; piu' di sei: il primo e «et al.» */
  var MESI_IEEE = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'];
  function ieeeAutore(a) { if (a.org) return a.org; var i = iniziali(a.nome); return (i ? i + ' ' : '') + a.cognome; }
  function ieeeAutori(aa) {
    var v = aa.map(ieeeAutore), n = v.length;
    if (!n) return '';
    if (n > 6) return v[0] + ' et al.';
    if (n === 1) return v[0];
    if (n === 2) return v[0] + ' and ' + v[1];
    return v.slice(0, -1).join(', ') + ', and ' + v[n - 1];
  }
  function ieee(rec, html) {
    var aut = ieeeAutori(rec.autori || []);
    var data = (rec.mese ? MESI_IEEE[rec.mese - 1] + ' ' : '') + (rec.anno || '');
    var s = aut ? testo(aut + ', ', html) : '';
    if (rec.tipo === 'libro') {
      s += corsivo(rec.titolo, html) + testo('. ' + [rec.editore, rec.anno].filter(Boolean).join(', '), html);
    } else {
      s += testo('“' + rec.titolo + ',”', html);
      var pezzi = [];
      if (rec.volume) pezzi.push('vol. ' + rec.volume);
      if (rec.numero) pezzi.push('no. ' + rec.numero);
      if (rec.pagine) pezzi.push((/[-–]/.test(rec.pagine) ? 'pp. ' : 'p. ') + trattino(rec.pagine));
      else if (rec.articolo) pezzi.push('Art. no. ' + rec.articolo);
      if (data.trim()) pezzi.push(data.trim());
      s += ' ' + (rec.rivista ? corsivo(rec.rivista, html) + (pezzi.length ? ', ' : '') : '') + testo(pezzi.join(', '), html);
    }
    if (rec.doi) s += testo(', doi: ' + rec.doi, html);
    return s.replace(/,\s*$/, '') + '.';
  }

  /* ISO 690: il primo autore «COGNOME, Nome», gli altri «Nome COGNOME»;
     piu' di tre: il primo e «et al.» */
  function iso690(rec, html) {
    var aa = rec.autori || [], v;
    function primo(a) { return a.org ? a.org : a.cognome.toUpperCase() + (a.nome ? ', ' + a.nome : ''); }
    function altro(a) { return a.org ? a.org : (a.nome ? a.nome + ' ' : '') + a.cognome.toUpperCase(); }
    if (!aa.length) v = '';
    else if (aa.length > 3) v = primo(aa[0]) + ' et al';
    else {
      var x = [primo(aa[0])].concat(aa.slice(1).map(altro));
      v = x.length === 1 ? x[0] : x.slice(0, -1).join(', ') + ' and ' + x[x.length - 1];
    }
    var s = v ? testo(chiudi(v) + ' ', html) : '';
    if (rec.tipo === 'libro') {
      s += corsivo(rec.titolo, html) + testo('. ' + [rec.editore, rec.anno].filter(Boolean).join(', ') + '.', html);
    } else {
      s += testo(chiudi(rec.titolo) + ' ', html);
      if (rec.rivista) s += corsivo(rec.rivista, html) + '. ';
      var pezzi = [rec.anno];
      if (rec.volume) pezzi.push('vol. ' + rec.volume);
      if (rec.numero) pezzi.push('no. ' + rec.numero);
      if (rec.pagine) pezzi.push('pp. ' + trattino(rec.pagine));
      else if (rec.articolo) pezzi.push('art. ' + rec.articolo);
      s += testo(pezzi.filter(Boolean).join(', ') + '.', html);
    }
    if (rec.doi) s += testo(' DOI ' + rec.doi + '.', html);
    return s;
  }

  /* BibTeX. La chiave: cognome del primo autore (senza accenti) + anno +
     prima parola significativa del titolo — rossi2020quantum */
  var PAROLE_VUOTE = ['a', 'an', 'the', 'on', 'of', 'in', 'and', 'for', 'to', 'with', 'from', 'by', 'at', 'is', 'are', 'il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'una', 'uno', 'di', 'da', 'del', 'della', 'e', 'per', 'su', 'con', 'der', 'die', 'das', 'le', 'les', 'de'];
  function ascii(s) {
    s = String(s || '');
    if (s.normalize) s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return s.replace(/ß/g, 'ss').replace(/[æÆ]/g, 'ae').replace(/[øØ]/g, 'o').replace(/[łŁ]/g, 'l').replace(/[œŒ]/g, 'oe');
  }
  function chiaveBibtex(rec) {
    var a = (rec.autori || [])[0], base = '';
    if (a) base = a.org ? a.org.split(/\s+/)[0] : a.cognome.split(/\s+/).pop();
    base = ascii(base).toLowerCase().replace(/[^a-z]/g, '') || 'anonimo';
    var parole = ascii(rec.titolo || '').toLowerCase().split(/[^a-z0-9]+/).filter(function (p) { return p && PAROLE_VUOTE.indexOf(p) < 0; });
    return base + (rec.anno || '') + (parole[0] || '');
  }
  function bibEsc(s) { return String(s || '').replace(/\\/g, '\\textbackslash{}').replace(/([&%$#_{}])/g, '\\$1'); }
  function bibtex(rec) {
    var tipo = { articolo: 'article', libro: 'book', capitolo: 'incollection', atti: 'inproceedings' }[rec.tipo] || 'misc';
    var autori = (rec.autori || []).map(function (a) {
      return a.org ? '{' + bibEsc(a.org) + '}' : bibEsc(a.cognome) + (a.nome ? ', ' + bibEsc(a.nome) : '');
    }).join(' and ');
    var campi = [['author', autori], ['title', '{' + bibEsc(rec.titolo) + '}']];
    if (tipo === 'article') campi.push(['journal', bibEsc(rec.rivista)]);
    else if (tipo === 'incollection' || tipo === 'inproceedings') campi.push(['booktitle', bibEsc(rec.rivista)]);
    campi.push(['year', rec.anno], ['volume', rec.volume], ['number', rec.numero],
      ['pages', rec.pagine ? String(rec.pagine).replace(/\s*[-‐‑–—]+\s*/g, '--') : rec.articolo],
      ['publisher', tipo === 'article' ? '' : bibEsc(rec.editore)], ['doi', rec.doi]);
    var righe = campi.filter(function (c) { return c[1]; }).map(function (c) { return '  ' + c[0] + ' = {' + c[1] + '}'; });
    return '@' + tipo + '{' + chiaveBibtex(rec) + ',\n' + righe.join(',\n') + '\n}';
  }

  F.calcolo.citazioni = { normalizzaDoi: normalizzaDoi, daCrossref: daCrossref, apa: apa, ieee: ieee, iso690: iso690, bibtex: bibtex, chiaveBibtex: chiaveBibtex, urlCrossref: L.crossref, iniziali: iniziali };

  /* ═════════════════════════════════════════════════════════════════════════
     4 · LE COSTANTI (CODATA 2018) E LE UNITA'
     Le sette costanti che dal 20 maggio 2019 DEFINISCONO il SI sono esatte;
     anche quelle che si ricavano solo da loro (R, F, σ, Φ₀, K_J, R_K…) sono
     esatte, e qui si CALCOLANO dalle definitorie invece di copiarle.
     ═════════════════════════════════════════════════════════════════════════ */
  var c0 = 299792458, h0 = 6.62607015e-34, e0 = 1.602176634e-19, kB0 = 1.380649e-23, NA0 = 6.02214076e23;
  var hbar0 = h0 / (2 * Math.PI);
  var EH = 4.3597447222071e-18;
  function K(k, it, en, simbolo, valore, inc, unita, esatta, def) {
    return { k: k, nm: [it, en], simbolo: simbolo, valore: valore, incertezza: inc, unita: unita, esatta: !!esatta, def: !!def };
  }
  var COSTANTI = [
    K('c', 'velocità della luce nel vuoto', 'speed of light in vacuum', 'c', c0, 0, 'm s⁻¹', true, true),
    K('h', 'costante di Planck', 'Planck constant', 'h', h0, 0, 'J Hz⁻¹', true, true),
    K('e', 'carica elementare', 'elementary charge', 'e', e0, 0, 'C', true, true),
    K('kB', 'costante di Boltzmann', 'Boltzmann constant', 'k_B', kB0, 0, 'J K⁻¹', true, true),
    K('NA', 'costante di Avogadro', 'Avogadro constant', 'N_A', NA0, 0, 'mol⁻¹', true, true),
    K('nuCs', 'frequenza di transizione iperfine del cesio 133', 'hyperfine transition frequency of Cs-133', 'Δν_Cs', 9192631770, 0, 'Hz', true, true),
    K('Kcd', 'efficacia luminosa (540 THz)', 'luminous efficacy (540 THz)', 'K_cd', 683, 0, 'lm W⁻¹', true, true),
    K('hbar', 'costante di Planck ridotta', 'reduced Planck constant', 'ħ', hbar0, 0, 'J s', true),
    K('R', 'costante molare dei gas', 'molar gas constant', 'R', NA0 * kB0, 0, 'J mol⁻¹ K⁻¹', true),
    K('F', 'costante di Faraday', 'Faraday constant', 'F', NA0 * e0, 0, 'C mol⁻¹', true),
    K('sigma', 'costante di Stefan-Boltzmann', 'Stefan–Boltzmann constant', 'σ', 2 * Math.pow(Math.PI, 5) * Math.pow(kB0, 4) / (15 * Math.pow(h0, 3) * c0 * c0), 0, 'W m⁻² K⁻⁴', true),
    K('Phi0', 'quanto di flusso magnetico', 'magnetic flux quantum', 'Φ₀', h0 / (2 * e0), 0, 'Wb', true),
    K('G0', 'quanto di conduttanza', 'conductance quantum', 'G₀', 2 * e0 * e0 / h0, 0, 'S', true),
    K('KJ', 'costante di Josephson', 'Josephson constant', 'K_J', 2 * e0 / h0, 0, 'Hz V⁻¹', true),
    K('RK', 'costante di von Klitzing', 'von Klitzing constant', 'R_K', h0 / (e0 * e0), 0, 'Ω', true),
    K('c1', 'prima costante di radiazione', 'first radiation constant', 'c₁', 2 * Math.PI * h0 * c0 * c0, 0, 'W m²', true),
    K('c2', 'seconda costante di radiazione', 'second radiation constant', 'c₂', h0 * c0 / kB0, 0, 'm K', true),
    K('b', 'costante dello spostamento di Wien', 'Wien wavelength displacement constant', 'b', 2.897771955e-3, 0, 'm K', true),
    K('Vm', 'volume molare del gas ideale (273,15 K; 101,325 kPa)', 'molar volume of ideal gas (273.15 K, 101.325 kPa)', 'V_m', NA0 * kB0 * 273.15 / 101325, 0, 'm³ mol⁻¹', true),
    K('n0', 'costante di Loschmidt (273,15 K; 101,325 kPa)', 'Loschmidt constant (273.15 K, 101.325 kPa)', 'n₀', 101325 / (kB0 * 273.15), 0, 'm⁻³', true),
    K('eV', 'elettronvolt', 'electron volt', 'eV', e0, 0, 'J', true),
    K('G', 'costante di gravitazione', 'Newtonian constant of gravitation', 'G', 6.67430e-11, 0.00015e-11, 'm³ kg⁻¹ s⁻²'),
    K('alpha', 'costante di struttura fine', 'fine-structure constant', 'α', 7.2973525693e-3, 0.0000000011e-3, '1'),
    K('alphainv', 'inverso della costante di struttura fine', 'inverse fine-structure constant', 'α⁻¹', 137.035999084, 0.000000021, '1'),
    K('me', 'massa dell’elettrone', 'electron mass', 'm_e', 9.1093837015e-31, 0.0000000028e-31, 'kg'),
    K('mp', 'massa del protone', 'proton mass', 'm_p', 1.67262192369e-27, 0.00000000051e-27, 'kg'),
    K('mn', 'massa del neutrone', 'neutron mass', 'm_n', 1.67492749804e-27, 0.00000000095e-27, 'kg'),
    K('mu', 'costante di massa atomica (1 u)', 'atomic mass constant (1 u)', 'm_u', 1.66053906660e-27, 0.00000000050e-27, 'kg'),
    K('Mu', 'costante di massa molare', 'molar mass constant', 'M_u', 0.99999999965e-3, 0.00000000030e-3, 'kg mol⁻¹'),
    K('mpme', 'rapporto fra le masse di protone ed elettrone', 'proton–electron mass ratio', 'm_p/m_e', 1836.15267343, 0.00000011, '1'),
    K('mec2', 'energia a riposo dell’elettrone', 'electron mass energy equivalent', 'm_e c²', 0.51099895000, 0.00000000015, 'MeV'),
    K('mpc2', 'energia a riposo del protone', 'proton mass energy equivalent', 'm_p c²', 938.27208816, 0.00000029, 'MeV'),
    K('mnc2', 'energia a riposo del neutrone', 'neutron mass energy equivalent', 'm_n c²', 939.56542052, 0.00000054, 'MeV'),
    K('Rinf', 'costante di Rydberg', 'Rydberg constant', 'R_∞', 10973731.568160, 0.000021, 'm⁻¹'),
    K('a0', 'raggio di Bohr', 'Bohr radius', 'a₀', 5.29177210903e-11, 0.00000000080e-11, 'm'),
    K('Eh', 'energia di Hartree', 'Hartree energy', 'E_h', EH, 0.0000000000085e-18, 'J'),
    K('EheV', 'energia di Hartree in eV', 'Hartree energy in eV', 'E_h', 27.211386245988, 0.000000000053, 'eV'),
    K('muB', 'magnetone di Bohr', 'Bohr magneton', 'μ_B', 9.2740100783e-24, 0.0000000028e-24, 'J T⁻¹'),
    K('muN', 'magnetone nucleare', 'nuclear magneton', 'μ_N', 5.0507837461e-27, 0.0000000015e-27, 'J T⁻¹'),
    K('mue', 'momento magnetico dell’elettrone', 'electron magnetic moment', 'μ_e', -9.2847647043e-24, 0.0000000028e-24, 'J T⁻¹'),
    K('ge', 'fattore g dell’elettrone', 'electron g-factor', 'g_e', -2.00231930436256, 0.00000000000035, '1'),
    K('eps0', 'permittività elettrica del vuoto', 'vacuum electric permittivity', 'ε₀', 8.8541878128e-12, 0.0000000013e-12, 'F m⁻¹'),
    K('mu0', 'permeabilità magnetica del vuoto', 'vacuum magnetic permeability', 'μ₀', 1.25663706212e-6, 0.00000000019e-6, 'N A⁻²'),
    K('Z0', 'impedenza caratteristica del vuoto', 'characteristic impedance of vacuum', 'Z₀', 376.730313668, 0.000000057, 'Ω'),
    K('re', 'raggio classico dell’elettrone', 'classical electron radius', 'r_e', 2.8179403262e-15, 0.0000000013e-15, 'm'),
    K('lC', 'lunghezza d’onda Compton', 'Compton wavelength', 'λ_C', 2.42631023867e-12, 0.00000000073e-12, 'm'),
    K('sigmae', 'sezione d’urto Thomson', 'Thomson cross section', 'σ_e', 6.6524587321e-29, 0.0000000060e-29, 'm²')
  ];

  /* LE UNITA': ogni unita' ha il fattore f verso l'unita' SI della sua
     grandezza (e, per le temperature, lo scostamento o: SI = v·f + o).
     Le «unita' di energia» spettroscopiche (cm⁻¹, K, Hz, kJ/mol) passano per
     hc, k_B, h e N_A: sono equivalenze, non identita' dimensionali, e per
     questo stanno solo dentro la grandezza energia. */
  function U(k, it, en, f, o) { return { k: k, nm: it, en: en || it, f: f, o: o || 0 }; }
  var GRANDEZZE = {
    lunghezza: { nm: ['Lunghezza', 'Length'], unita: [
      U('m', 'metro', 'metre', 1), U('km', 'chilometro', 'kilometre', 1e3), U('cm', 'centimetro', 'centimetre', 1e-2), U('mm', 'millimetro', 'millimetre', 1e-3),
      U('µm', 'micrometro', 'micrometre', 1e-6), U('nm', 'nanometro', 'nanometre', 1e-9), U('pm', 'picometro', 'picometre', 1e-12), U('fm', 'femtometro (fermi)', 'femtometre (fermi)', 1e-15),
      U('Å', 'ångström', 'ångström', 1e-10), U('a0', 'raggio di Bohr', 'Bohr radius', 5.29177210903e-11), U('in', 'pollice', 'inch', 0.0254), U('ft', 'piede', 'foot', 0.3048),
      U('yd', 'iarda', 'yard', 0.9144), U('mi', 'miglio terrestre', 'mile', 1609.344), U('nmi', 'miglio nautico', 'nautical mile', 1852),
      U('au', 'unità astronomica', 'astronomical unit', 149597870700), U('ly', 'anno luce', 'light year', 9460730472580800), U('pc', 'parsec', 'parsec', 149597870700 * 648000 / Math.PI)] },
    massa: { nm: ['Massa', 'Mass'], unita: [
      U('kg', 'chilogrammo', 'kilogram', 1), U('g', 'grammo', 'gram', 1e-3), U('mg', 'milligrammo', 'milligram', 1e-6), U('µg', 'microgrammo', 'microgram', 1e-9),
      U('t', 'tonnellata', 'tonne', 1e3), U('u', 'unità di massa atomica (dalton)', 'atomic mass unit (dalton)', 1.66053906660e-27), U('me', 'massa dell’elettrone', 'electron mass', 9.1093837015e-31),
      U('mp', 'massa del protone', 'proton mass', 1.67262192369e-27), U('lb', 'libbra', 'pound', 0.45359237), U('oz', 'oncia', 'ounce', 0.028349523125)] },
    tempo: { nm: ['Tempo', 'Time'], unita: [
      U('s', 'secondo', 'second', 1), U('ms', 'millisecondo', 'millisecond', 1e-3), U('µs', 'microsecondo', 'microsecond', 1e-6), U('ns', 'nanosecondo', 'nanosecond', 1e-9),
      U('ps', 'picosecondo', 'picosecond', 1e-12), U('fs', 'femtosecondo', 'femtosecond', 1e-15), U('min', 'minuto', 'minute', 60), U('h', 'ora', 'hour', 3600),
      U('d', 'giorno', 'day', 86400), U('sett', 'settimana', 'week', 604800), U('a', 'anno giuliano', 'Julian year', 31557600)] },
    energia: { nm: ['Energia', 'Energy'], unita: [
      U('J', 'joule', 'joule', 1), U('kJ', 'chilojoule', 'kilojoule', 1e3), U('eV', 'elettronvolt', 'electronvolt', e0), U('meV', 'millielettronvolt', 'millielectronvolt', e0 * 1e-3),
      U('keV', 'chiloelettronvolt', 'kiloelectronvolt', e0 * 1e3), U('MeV', 'megaelettronvolt', 'megaelectronvolt', e0 * 1e6), U('GeV', 'gigaelettronvolt', 'gigaelectronvolt', e0 * 1e9),
      U('cal', 'caloria termochimica', 'thermochemical calorie', 4.184), U('kcal', 'chilocaloria', 'kilocalorie', 4184), U('kWh', 'chilowattora', 'kilowatt hour', 3.6e6),
      U('erg', 'erg', 'erg', 1e-7), U('Eh', 'hartree', 'hartree', EH), U('Ry', 'rydberg', 'rydberg', EH / 2),
      U('cm-1', 'numero d’onda (hc·ṽ)', 'wavenumber (hc·ṽ)', h0 * c0 * 100), U('K', 'kelvin (k_B·T)', 'kelvin (k_B·T)', kB0), U('Hz', 'hertz (h·ν)', 'hertz (h·ν)', h0),
      U('kJ/mol', 'kJ/mol (per particella)', 'kJ/mol (per particle)', 1e3 / NA0), U('kcal/mol', 'kcal/mol (per particella)', 'kcal/mol (per particle)', 4184 / NA0)] },
    pressione: { nm: ['Pressione', 'Pressure'], unita: [
      U('Pa', 'pascal', 'pascal', 1), U('hPa', 'ettopascal', 'hectopascal', 100), U('kPa', 'chilopascal', 'kilopascal', 1e3), U('MPa', 'megapascal', 'megapascal', 1e6),
      U('bar', 'bar', 'bar', 1e5), U('mbar', 'millibar', 'millibar', 100), U('atm', 'atmosfera standard', 'standard atmosphere', 101325),
      U('Torr', 'torr', 'torr', 101325 / 760), U('mmHg', 'millimetro di mercurio', 'millimetre of mercury', 133.322387415), U('psi', 'libbra per pollice quadrato', 'pound per square inch', 0.45359237 * 9.80665 / (0.0254 * 0.0254)),
      U('dyn/cm2', 'dina per cm²', 'dyne per cm²', 0.1)] },
    potenza: { nm: ['Potenza', 'Power'], unita: [
      U('W', 'watt', 'watt', 1), U('mW', 'milliwatt', 'milliwatt', 1e-3), U('kW', 'chilowatt', 'kilowatt', 1e3), U('MW', 'megawatt', 'megawatt', 1e6),
      U('CV', 'cavallo vapore', 'metric horsepower', 735.49875), U('hp', 'horsepower (meccanico)', 'horsepower (mechanical)', 550 * 0.3048 * 0.45359237 * 9.80665), U('erg/s', 'erg al secondo', 'erg per second', 1e-7),
      U('kcal/h', 'chilocaloria all’ora', 'kilocalorie per hour', 4184 / 3600)] },
    temperatura: { nm: ['Temperatura', 'Temperature'], unita: [
      U('K', 'kelvin', 'kelvin', 1, 0), U('°C', 'grado Celsius', 'degree Celsius', 1, 273.15), U('°F', 'grado Fahrenheit', 'degree Fahrenheit', 5 / 9, 273.15 - 32 * 5 / 9), U('°R', 'grado Rankine', 'degree Rankine', 5 / 9, 0)] },
    angolo: { nm: ['Angolo', 'Angle'], unita: [
      U('rad', 'radiante', 'radian', 1), U('mrad', 'milliradiante', 'milliradian', 1e-3), U('°', 'grado sessagesimale', 'degree', Math.PI / 180), U('′', 'primo d’arco', 'arcminute', Math.PI / 10800),
      U('″', 'secondo d’arco', 'arcsecond', Math.PI / 648000), U('gon', 'gon (grado centesimale)', 'gon', Math.PI / 200), U('giro', 'giro', 'turn', 2 * Math.PI)] },
    carica: { nm: ['Carica elettrica', 'Electric charge'], unita: [
      U('C', 'coulomb', 'coulomb', 1), U('mC', 'millicoulomb', 'millicoulomb', 1e-3), U('µC', 'microcoulomb', 'microcoulomb', 1e-6), U('nC', 'nanocoulomb', 'nanocoulomb', 1e-9),
      U('e', 'carica elementare', 'elementary charge', e0), U('Ah', 'amperora', 'ampere hour', 3600), U('mAh', 'milliamperora', 'milliampere hour', 3.6),
      U('statC', 'statcoulomb (ues)', 'statcoulomb (esu)', 1 / (10 * c0)), U('Fd', 'faraday (mole di elettroni)', 'faraday (mole of electrons)', NA0 * e0)] },
    campoB: { nm: ['Campo magnetico (induzione)', 'Magnetic flux density'], unita: [
      U('T', 'tesla', 'tesla', 1), U('mT', 'millitesla', 'millitesla', 1e-3), U('µT', 'microtesla', 'microtesla', 1e-6), U('nT', 'nanotesla', 'nanotesla', 1e-9),
      U('G', 'gauss', 'gauss', 1e-4), U('mG', 'milligauss', 'milligauss', 1e-7)] }
  };

  /* trova le grandezze che contengono l'unita' k; «energia:K» la forza */
  function trova(k) {
    var s = String(k), g = null;
    var i = s.indexOf(':');
    if (i > 0 && GRANDEZZE[s.slice(0, i)]) { g = s.slice(0, i); s = s.slice(i + 1); }
    var out = [];
    Object.keys(GRANDEZZE).forEach(function (n) {
      if (g && n !== g) return;
      GRANDEZZE[n].unita.forEach(function (u) { if (u.k === s) out.push({ g: n, u: u }); });
    });
    return out;
  }
  /* il controllo dimensionale: si converte solo dentro una grandezza che
     contiene entrambe le unita'. Altrimenti un errore che lo dice. */
  function converti(v, da, a) {
    var A = trova(da), B = trova(a);
    if (!A.length) throw new Error(t('unità sconosciuta: ', 'unknown unit: ') + da);
    if (!B.length) throw new Error(t('unità sconosciuta: ', 'unknown unit: ') + a);
    for (var i = 0; i < A.length; i++) for (var j = 0; j < B.length; j++) {
      if (A[i].g === B[j].g) {
        var p = A[i].u, q = B[j].u;
        if (p === q) return +v;
        return (v * p.f + p.o - q.o) / q.f;
      }
    }
    var err = new Error(t('dimensioni incompatibili: ', 'incompatible dimensions: ') + da + ' (' + A.map(function (x) { return tt(GRANDEZZE[x.g].nm); }).join('/') + ') → ' + a + ' (' + B.map(function (x) { return tt(GRANDEZZE[x.g].nm); }).join('/') + ')');
    err.incompatibili = true;
    throw err;
  }

  F.calcolo.unita = { converti: converti, GRANDEZZE: GRANDEZZE, COSTANTI: COSTANTI, trova: trova };

  /* ═════════════════════════════════════════════════════════════════════════
     5 · LE TAVOLE MATEMATICHE
     Ogni voce: { nm:[it,en], f: la formula, nota, prova? }. La prova e'
     cio' che serve al banco per controllarla con un secondo metodo:
       derivate  { f, df, x:[punti] }            → differenze finite
       integrali { f, F, a, b } (indefiniti)     → quadratura di f su [a,b]
                 { f, a, b, valore } (definiti)  → quadratura
       serie     { f, c(n) o c:[…], x:[punti] }   → somma parziale
       Laplace   { f(t), F(s) }                  → ∫₀^∞ f e^(−st) dt a s = 2
       Fourier   { f(t), re(ω), im(ω) }          → ∫ f e^(−iωt) dt
       identita' { l(x,y), r(x,y) }              → punti a caso
     ═════════════════════════════════════════════════════════════════════════ */
  function T(it, en, f, nota, prova) { return { nm: [it, en], f: f, nota: nota || '', prova: prova || null }; }
  var sin = Math.sin, cos = Math.cos, tan = Math.tan, exp = Math.exp, ln = Math.log, sqrt = Math.sqrt, PI = Math.PI;
  function fatt(n) { var r = 1; for (var i = 2; i <= n; i++) r *= i; return r; }
  function sech(x) { return 1 / Math.cosh(x); }

  var DERIVATE = [
    T('potenza', 'power', 'd/dx xⁿ = n xⁿ⁻¹', 'n reale; per x > 0 se n non è intero', { f: function (x) { return Math.pow(x, 3.5); }, df: function (x) { return 3.5 * Math.pow(x, 2.5); }, x: [0.7, 1.9] }),
    T('radice quadrata', 'square root', 'd/dx √x = 1/(2√x)', 'x > 0', { f: sqrt, df: function (x) { return 0.5 / sqrt(x); }, x: [0.3, 4] }),
    T('reciproco', 'reciprocal', 'd/dx (1/x) = −1/x²', 'x ≠ 0', { f: function (x) { return 1 / x; }, df: function (x) { return -1 / (x * x); }, x: [-2, 0.8] }),
    T('esponenziale', 'exponential', 'd/dx eˣ = eˣ', '', { f: exp, df: exp, x: [-1, 0.5, 2] }),
    T('esponenziale in base a', 'base-a exponential', 'd/dx aˣ = aˣ ln a', 'a > 0', { f: function (x) { return Math.pow(3, x); }, df: function (x) { return Math.pow(3, x) * ln(3); }, x: [-1, 1.2] }),
    T('logaritmo naturale', 'natural logarithm', 'd/dx ln|x| = 1/x', 'x ≠ 0', { f: function (x) { return ln(Math.abs(x)); }, df: function (x) { return 1 / x; }, x: [-3, 0.4, 2] }),
    T('logaritmo in base a', 'base-a logarithm', 'd/dx logₐ x = 1/(x ln a)', 'a > 0, a ≠ 1', { f: function (x) { return ln(x) / ln(10); }, df: function (x) { return 1 / (x * ln(10)); }, x: [0.5, 7] }),
    T('seno', 'sine', 'd/dx sin x = cos x', '', { f: sin, df: cos, x: [0.3, 2.5] }),
    T('coseno', 'cosine', 'd/dx cos x = −sin x', '', { f: cos, df: function (x) { return -sin(x); }, x: [0.3, 2.5] }),
    T('tangente', 'tangent', 'd/dx tan x = 1/cos²x = 1 + tan²x', 'x ≠ π/2 + kπ', { f: tan, df: function (x) { return 1 + tan(x) * tan(x); }, x: [0.2, 1.1] }),
    T('cotangente', 'cotangent', 'd/dx cot x = −1/sin²x', 'x ≠ kπ', { f: function (x) { return 1 / tan(x); }, df: function (x) { return -1 / (sin(x) * sin(x)); }, x: [0.4, 2] }),
    T('secante', 'secant', 'd/dx sec x = sec x tan x', '', { f: function (x) { return 1 / cos(x); }, df: function (x) { return tan(x) / cos(x); }, x: [0.3, 1] }),
    T('cosecante', 'cosecant', 'd/dx csc x = −csc x cot x', '', { f: function (x) { return 1 / sin(x); }, df: function (x) { return -1 / (sin(x) * tan(x)); }, x: [0.5, 2] }),
    T('arcoseno', 'arcsine', 'd/dx arcsin x = 1/√(1 − x²)', '|x| < 1', { f: Math.asin, df: function (x) { return 1 / sqrt(1 - x * x); }, x: [-0.5, 0.7] }),
    T('arcocoseno', 'arccosine', 'd/dx arccos x = −1/√(1 − x²)', '|x| < 1', { f: Math.acos, df: function (x) { return -1 / sqrt(1 - x * x); }, x: [-0.5, 0.7] }),
    T('arcotangente', 'arctangent', 'd/dx arctan x = 1/(1 + x²)', '', { f: Math.atan, df: function (x) { return 1 / (1 + x * x); }, x: [-2, 0.5] }),
    T('arcocotangente', 'arccotangent', 'd/dx arccot x = −1/(1 + x²)', '', { f: function (x) { return PI / 2 - Math.atan(x); }, df: function (x) { return -1 / (1 + x * x); }, x: [-2, 0.5] }),
    T('seno iperbolico', 'hyperbolic sine', 'd/dx sinh x = cosh x', '', { f: Math.sinh, df: Math.cosh, x: [-1, 1.5] }),
    T('coseno iperbolico', 'hyperbolic cosine', 'd/dx cosh x = sinh x', '', { f: Math.cosh, df: Math.sinh, x: [-1, 1.5] }),
    T('tangente iperbolica', 'hyperbolic tangent', 'd/dx tanh x = 1/cosh²x = 1 − tanh²x', '', { f: Math.tanh, df: function (x) { return 1 - Math.tanh(x) * Math.tanh(x); }, x: [-1, 0.6] }),
    T('cotangente iperbolica', 'hyperbolic cotangent', 'd/dx coth x = −1/sinh²x', 'x ≠ 0', { f: function (x) { return 1 / Math.tanh(x); }, df: function (x) { return -1 / (Math.sinh(x) * Math.sinh(x)); }, x: [0.5, 2] }),
    T('settore seno iperbolico', 'inverse hyperbolic sine', 'd/dx arsinh x = 1/√(x² + 1)', '', { f: Math.asinh, df: function (x) { return 1 / sqrt(x * x + 1); }, x: [-1, 2] }),
    T('settore coseno iperbolico', 'inverse hyperbolic cosine', 'd/dx arcosh x = 1/√(x² − 1)', 'x > 1', { f: Math.acosh, df: function (x) { return 1 / sqrt(x * x - 1); }, x: [1.5, 3] }),
    T('settore tangente iperbolica', 'inverse hyperbolic tangent', 'd/dx artanh x = 1/(1 − x²)', '|x| < 1', { f: Math.atanh, df: function (x) { return 1 / (1 - x * x); }, x: [-0.5, 0.3] }),
    T('x elevato a x', 'x to the x', 'd/dx xˣ = xˣ (ln x + 1)', 'x > 0', { f: function (x) { return Math.pow(x, x); }, df: function (x) { return Math.pow(x, x) * (ln(x) + 1); }, x: [0.5, 2] }),
    T('gaussiana', 'Gaussian', 'd/dx e^(−x²) = −2x e^(−x²)', '', { f: function (x) { return exp(-x * x); }, df: function (x) { return -2 * x * exp(-x * x); }, x: [-1, 0.7] }),
    T('regola del prodotto', 'product rule', '(f g)′ = f′ g + f g′', 'regola'),
    T('regola del quoziente', 'quotient rule', '(f/g)′ = (f′ g − f g′)/g²', 'g ≠ 0'),
    T('regola della catena', 'chain rule', '(f ∘ g)′(x) = f′(g(x)) · g′(x)', ''),
    T('funzione inversa', 'inverse function', '(f⁻¹)′(y) = 1/f′(f⁻¹(y))', 'f′ ≠ 0'),
    T('regola di Leibniz', 'Leibniz rule', '(f g)⁽ⁿ⁾ = Σₖ C(n,k) f⁽ᵏ⁾ g⁽ⁿ⁻ᵏ⁾', 'derivata n-esima del prodotto')
  ];

  var INTEGRALI = [
    T('potenza', 'power', '∫ xⁿ dx = xⁿ⁺¹/(n + 1) + C', 'n ≠ −1', { f: function (x) { return Math.pow(x, 2.5); }, F: function (x) { return Math.pow(x, 3.5) / 3.5; }, a: 0.5, b: 2 }),
    T('reciproco', 'reciprocal', '∫ dx/x = ln|x| + C', '', { f: function (x) { return 1 / x; }, F: function (x) { return ln(Math.abs(x)); }, a: 0.5, b: 3 }),
    T('esponenziale', 'exponential', '∫ eˣ dx = eˣ + C', '', { f: exp, F: exp, a: -1, b: 2 }),
    T('esponenziale in base a', 'base-a exponential', '∫ aˣ dx = aˣ/ln a + C', 'a > 0, a ≠ 1', { f: function (x) { return Math.pow(2, x); }, F: function (x) { return Math.pow(2, x) / ln(2); }, a: -1, b: 3 }),
    T('logaritmo', 'logarithm', '∫ ln x dx = x ln x − x + C', 'x > 0', { f: ln, F: function (x) { return x * ln(x) - x; }, a: 0.5, b: 4 }),
    T('seno', 'sine', '∫ sin x dx = −cos x + C', '', { f: sin, F: function (x) { return -cos(x); }, a: 0, b: 2 }),
    T('coseno', 'cosine', '∫ cos x dx = sin x + C', '', { f: cos, F: sin, a: 0, b: 2 }),
    T('tangente', 'tangent', '∫ tan x dx = −ln|cos x| + C', '', { f: tan, F: function (x) { return -ln(Math.abs(cos(x))); }, a: 0, b: 1.2 }),
    T('cotangente', 'cotangent', '∫ cot x dx = ln|sin x| + C', '', { f: function (x) { return 1 / tan(x); }, F: function (x) { return ln(Math.abs(sin(x))); }, a: 0.3, b: 2 }),
    T('secante', 'secant', '∫ sec x dx = ln|sec x + tan x| + C', '', { f: function (x) { return 1 / cos(x); }, F: function (x) { return ln(Math.abs(1 / cos(x) + tan(x))); }, a: -1, b: 1.2 }),
    T('cosecante', 'cosecant', '∫ csc x dx = ln|tan(x/2)| + C', '', { f: function (x) { return 1 / sin(x); }, F: function (x) { return ln(Math.abs(tan(x / 2))); }, a: 0.4, b: 2.5 }),
    T('secante al quadrato', 'secant squared', '∫ sec²x dx = tan x + C', '', { f: function (x) { return 1 / (cos(x) * cos(x)); }, F: tan, a: -1, b: 1 }),
    T('seno al quadrato', 'sine squared', '∫ sin²x dx = x/2 − sin(2x)/4 + C', '', { f: function (x) { return sin(x) * sin(x); }, F: function (x) { return x / 2 - sin(2 * x) / 4; }, a: 0, b: 3 }),
    T('coseno al quadrato', 'cosine squared', '∫ cos²x dx = x/2 + sin(2x)/4 + C', '', { f: function (x) { return cos(x) * cos(x); }, F: function (x) { return x / 2 + sin(2 * x) / 4; }, a: 0, b: 3 }),
    T('arcotangente come primitiva', 'arctangent as antiderivative', '∫ dx/(a² + x²) = (1/a) arctan(x/a) + C', 'a ≠ 0 (prova con a = 2)', { f: function (x) { return 1 / (4 + x * x); }, F: function (x) { return Math.atan(x / 2) / 2; }, a: -3, b: 5 }),
    T('arcoseno come primitiva', 'arcsine as antiderivative', '∫ dx/√(a² − x²) = arcsin(x/a) + C', '|x| < a (prova con a = 2)', { f: function (x) { return 1 / sqrt(4 - x * x); }, F: function (x) { return Math.asin(x / 2); }, a: -1.5, b: 1.5 }),
    T('fratti semplici', 'partial fractions', '∫ dx/(x² − a²) = (1/(2a)) ln|(x − a)/(x + a)| + C', '|x| ≠ a (prova con a = 1)', { f: function (x) { return 1 / (x * x - 1); }, F: function (x) { return 0.5 * ln(Math.abs((x - 1) / (x + 1))); }, a: 1.5, b: 4 }),
    T('settore seno iperbolico come primitiva', 'arsinh as antiderivative', '∫ dx/√(x² + a²) = ln(x + √(x² + a²)) + C', 'prova con a = 2', { f: function (x) { return 1 / sqrt(x * x + 4); }, F: function (x) { return ln(x + sqrt(x * x + 4)); }, a: -2, b: 3 }),
    T('settore coseno iperbolico come primitiva', 'arcosh as antiderivative', '∫ dx/√(x² − a²) = ln|x + √(x² − a²)| + C', '|x| > a (prova con a = 1)', { f: function (x) { return 1 / sqrt(x * x - 1); }, F: function (x) { return ln(Math.abs(x + sqrt(x * x - 1))); }, a: 1.5, b: 4 }),
    T('area del cerchio', 'circle area', '∫ √(a² − x²) dx = ½ [x√(a² − x²) + a² arcsin(x/a)] + C', '|x| ≤ a (prova con a = 2)', { f: function (x) { return sqrt(4 - x * x); }, F: function (x) { return 0.5 * (x * sqrt(4 - x * x) + 4 * Math.asin(x / 2)); }, a: -1.8, b: 1.9 }),
    T('logaritmo di una forma quadratica', 'log of a quadratic', '∫ x dx/(x² + a²) = ½ ln(x² + a²) + C', 'prova con a = 1', { f: function (x) { return x / (x * x + 1); }, F: function (x) { return 0.5 * ln(x * x + 1); }, a: -1, b: 3 }),
    T('seno iperbolico', 'hyperbolic sine', '∫ sinh x dx = cosh x + C', '', { f: Math.sinh, F: Math.cosh, a: -1, b: 2 }),
    T('coseno iperbolico', 'hyperbolic cosine', '∫ cosh x dx = sinh x + C', '', { f: Math.cosh, F: Math.sinh, a: -1, b: 2 }),
    T('tangente iperbolica', 'hyperbolic tangent', '∫ tanh x dx = ln cosh x + C', '', { f: Math.tanh, F: function (x) { return ln(Math.cosh(x)); }, a: -1, b: 2 }),
    T('per parti: x eˣ', 'by parts: x eˣ', '∫ x eˣ dx = (x − 1) eˣ + C', '', { f: function (x) { return x * exp(x); }, F: function (x) { return (x - 1) * exp(x); }, a: -1, b: 2 }),
    T('per parti: x sin x', 'by parts: x sin x', '∫ x sin x dx = sin x − x cos x + C', '', { f: function (x) { return x * sin(x); }, F: function (x) { return sin(x) - x * cos(x); }, a: 0, b: 3 }),
    T('per parti: x cos x', 'by parts: x cos x', '∫ x cos x dx = cos x + x sin x + C', '', { f: function (x) { return x * cos(x); }, F: function (x) { return cos(x) + x * sin(x); }, a: 0, b: 3 }),
    T('per parti: x ln x', 'by parts: x ln x', '∫ x ln x dx = (x²/2) ln x − x²/4 + C', 'x > 0', { f: function (x) { return x * ln(x); }, F: function (x) { return x * x / 2 * ln(x) - x * x / 4; }, a: 0.5, b: 3 }),
    T('per parti: x² eˣ', 'by parts: x² eˣ', '∫ x² eˣ dx = (x² − 2x + 2) eˣ + C', '', { f: function (x) { return x * x * exp(x); }, F: function (x) { return (x * x - 2 * x + 2) * exp(x); }, a: -1, b: 2 }),
    T('esponenziale per seno', 'exponential times sine', '∫ e^(ax) sin(bx) dx = e^(ax)(a sin bx − b cos bx)/(a² + b²) + C', 'prova con a = 1, b = 2', { f: function (x) { return exp(x) * sin(2 * x); }, F: function (x) { return exp(x) * (sin(2 * x) - 2 * cos(2 * x)) / 5; }, a: 0, b: 2 }),
    T('esponenziale per coseno', 'exponential times cosine', '∫ e^(ax) cos(bx) dx = e^(ax)(a cos bx + b sin bx)/(a² + b²) + C', 'prova con a = 1, b = 2', { f: function (x) { return exp(x) * cos(2 * x); }, F: function (x) { return exp(x) * (cos(2 * x) + 2 * sin(2 * x)) / 5; }, a: 0, b: 2 }),
    T('arcotangente', 'arctangent', '∫ arctan x dx = x arctan x − ½ ln(1 + x²) + C', '', { f: Math.atan, F: function (x) { return x * Math.atan(x) - 0.5 * ln(1 + x * x); }, a: -1, b: 3 }),
    T('arcoseno', 'arcsine', '∫ arcsin x dx = x arcsin x + √(1 − x²) + C', '|x| ≤ 1', { f: Math.asin, F: function (x) { return x * Math.asin(x) + sqrt(1 - x * x); }, a: -0.9, b: 0.9 }),
    T('logaritmo del logaritmo', 'log of log', '∫ dx/(x ln x) = ln|ln x| + C', 'x > 0, x ≠ 1', { f: function (x) { return 1 / (x * ln(x)); }, F: function (x) { return ln(Math.abs(ln(x))); }, a: 1.5, b: 6 }),
    T('integrale di Gauss', 'Gaussian integral', '∫₋∞^∞ e^(−x²) dx = √π', '', { f: function (x) { return exp(-x * x); }, a: -Infinity, b: Infinity, valore: sqrt(PI) }),
    T('gaussiana con parametro', 'Gaussian with parameter', '∫₋∞^∞ e^(−a x²) dx = √(π/a)', 'a > 0 (prova con a = 3)', { f: function (x) { return exp(-3 * x * x); }, a: -Infinity, b: Infinity, valore: sqrt(PI / 3) }),
    T('momento secondo della gaussiana', 'second moment of Gaussian', '∫₀^∞ x² e^(−x²) dx = √π/4', '', { f: function (x) { return x * x * exp(-x * x); }, a: 0, b: Infinity, valore: sqrt(PI) / 4 }),
    T('funzione Gamma', 'Gamma function', '∫₀^∞ xⁿ e^(−x) dx = Γ(n + 1) = n!', 'prova con n = 4', { f: function (x) { return Math.pow(x, 4) * exp(-x); }, a: 0, b: Infinity, valore: 24 }),
    T('Γ(1/2)', 'Γ(1/2)', '∫₀^∞ x^(−1/2) e^(−x) dx = Γ(1/2) = √π', '', { f: function (x) { return exp(-x) / sqrt(x); }, a: 0, b: Infinity, valore: sqrt(PI) }),
    T('lorentziana', 'Lorentzian', '∫₀^∞ dx/(1 + x²) = π/2', '', { f: function (x) { return 1 / (1 + x * x); }, a: 0, b: Infinity, valore: PI / 2 }),
    T('integrale di Bose (Planck)', 'Bose (Planck) integral', '∫₀^∞ x³/(eˣ − 1) dx = π⁴/15', 'la legge di Stefan-Boltzmann', { f: function (x) { return x < 1e-8 ? 0 : x * x * x / Math.expm1(x); }, a: 0, b: Infinity, valore: Math.pow(PI, 4) / 15 }),
    T('ζ(2) come integrale', 'ζ(2) as an integral', '∫₀^∞ x/(eˣ − 1) dx = π²/6', '', { f: function (x) { return x < 1e-8 ? 1 : x / Math.expm1(x); }, a: 0, b: Infinity, valore: PI * PI / 6 }),
    T('integrale di Fermi-Dirac', 'Fermi–Dirac integral', '∫₀^∞ x/(eˣ + 1) dx = π²/12', '', { f: function (x) { return x / (exp(x) + 1); }, a: 0, b: Infinity, valore: PI * PI / 12 }),
    T('logaritmo su [0, 1]', 'logarithm on [0, 1]', '∫₀¹ ln x dx = −1', 'integrale improprio convergente', { f: ln, a: 0, b: 1, valore: -1 }),
    T('seno al quadrato su un semiperiodo', 'sine squared on a half period', '∫₀^π sin²x dx = π/2', '', { f: function (x) { return sin(x) * sin(x); }, a: 0, b: PI, valore: PI / 2 }),
    T('dilogaritmo', 'dilogarithm', '∫₀¹ ln(1 + x)/x dx = π²/12', '', { f: function (x) { return x < 1e-12 ? 1 : Math.log1p(x) / x; }, a: 0, b: 1, valore: PI * PI / 12 }),
    T('logaritmo del seno', 'log of sine', '∫₀^(π/2) ln(sin x) dx = −(π/2) ln 2', '', { f: function (x) { return ln(sin(x)); }, a: 0, b: PI / 2, valore: -PI / 2 * ln(2) }),
    T('integrale di Dirichlet', 'Dirichlet integral', '∫₀^∞ (sin x)/x dx = π/2', 'convergente ma non assolutamente', null),
    T('integrazione per parti', 'integration by parts', '∫ f g′ dx = f g − ∫ f′ g dx', 'regola'),
    T('sostituzione', 'substitution', '∫ f(g(x)) g′(x) dx = ∫ f(u) du, u = g(x)', 'regola')
  ];

  /* serie di Maclaurin: c(n) e' il coefficiente di xⁿ */
  function S(it, en, f, raggio, nota, prova) { var o = T(it, en, f, nota, prova); o.raggio = raggio; return o; }
  var SERIE = [
    S('esponenziale', 'exponential', 'eˣ = Σ xⁿ/n! = 1 + x + x²/2! + x³/3! + …', '∞', '', { f: exp, c: function (n) { return 1 / fatt(n); }, x: [-2, 1.5] }),
    S('seno', 'sine', 'sin x = Σ (−1)ⁿ x²ⁿ⁺¹/(2n + 1)! = x − x³/3! + x⁵/5! − …', '∞', '', { f: sin, c: function (n) { return n % 2 ? Math.pow(-1, (n - 1) / 2) / fatt(n) : 0; }, x: [-2, 1] }),
    S('coseno', 'cosine', 'cos x = Σ (−1)ⁿ x²ⁿ/(2n)! = 1 − x²/2! + x⁴/4! − …', '∞', '', { f: cos, c: function (n) { return n % 2 ? 0 : Math.pow(-1, n / 2) / fatt(n); }, x: [-2, 1] }),
    S('seno iperbolico', 'hyperbolic sine', 'sinh x = Σ x²ⁿ⁺¹/(2n + 1)! = x + x³/3! + …', '∞', '', { f: Math.sinh, c: function (n) { return n % 2 ? 1 / fatt(n) : 0; }, x: [-2, 1] }),
    S('coseno iperbolico', 'hyperbolic cosine', 'cosh x = Σ x²ⁿ/(2n)! = 1 + x²/2! + …', '∞', '', { f: Math.cosh, c: function (n) { return n % 2 ? 0 : 1 / fatt(n); }, x: [-2, 1] }),
    S('gaussiana', 'Gaussian', 'e^(−x²) = Σ (−1)ⁿ x²ⁿ/n!', '∞', '', { f: function (x) { return exp(-x * x); }, c: function (n) { return n % 2 ? 0 : Math.pow(-1, n / 2) / fatt(n / 2); }, x: [-1.5, 0.8] }),
    S('serie geometrica', 'geometric series', '1/(1 − x) = Σ xⁿ = 1 + x + x² + …', '1', '|x| < 1', { f: function (x) { return 1 / (1 - x); }, c: function () { return 1; }, x: [-0.5, 0.3] }),
    S('logaritmo', 'logarithm', 'ln(1 + x) = Σ (−1)ⁿ⁺¹ xⁿ/n = x − x²/2 + x³/3 − …', '1', 'converge anche in x = 1 (ln 2)', { f: Math.log1p, c: function (n) { return n ? Math.pow(-1, n + 1) / n : 0; }, x: [-0.4, 0.5] }),
    S('serie binomiale', 'binomial series', '(1 + x)^α = Σ C(α, n) xⁿ = 1 + αx + α(α − 1)x²/2! + …', '1', 'α reale; prova con α = 1/3', { f: function (x) { return Math.pow(1 + x, 1 / 3); }, c: function (n) { var r = 1; for (var k = 0; k < n; k++) r *= (1 / 3 - k) / (k + 1); return r; }, x: [-0.4, 0.5] }),
    S('radice quadrata', 'square root', '√(1 + x) = 1 + x/2 − x²/8 + x³/16 − …', '1', '', { f: function (x) { return sqrt(1 + x); }, c: function (n) { var r = 1; for (var k = 0; k < n; k++) r *= (0.5 - k) / (k + 1); return r; }, x: [-0.4, 0.5] }),
    S('arcotangente', 'arctangent', 'arctan x = Σ (−1)ⁿ x²ⁿ⁺¹/(2n + 1) = x − x³/3 + x⁵/5 − …', '1', 'in x = 1 dà la serie di Leibniz per π/4', { f: Math.atan, c: function (n) { return n % 2 ? Math.pow(-1, (n - 1) / 2) / n : 0; }, x: [-0.5, 0.6] }),
    S('settore tangente iperbolica', 'inverse hyperbolic tangent', 'artanh x = ½ ln((1 + x)/(1 − x)) = Σ x²ⁿ⁺¹/(2n + 1)', '1', '', { f: Math.atanh, c: function (n) { return n % 2 ? 1 / n : 0; }, x: [-0.5, 0.6] }),
    S('arcoseno', 'arcsine', 'arcsin x = Σ (2n)!/(4ⁿ (n!)² (2n + 1)) x²ⁿ⁺¹ = x + x³/6 + 3x⁵/40 + …', '1', '', { f: Math.asin, c: function (n) { if (n % 2 === 0) return 0; var m = (n - 1) / 2, r = 1; for (var k = 1; k <= m; k++) r *= (2 * k - 1) / (2 * k); return r / n; }, x: [-0.5, 0.6] }),
    S('tangente', 'tangent', 'tan x = x + x³/3 + 2x⁵/15 + 17x⁷/315 + 62x⁹/2835 + …', 'π/2', 'i coefficienti vengono dai numeri di Bernoulli', { f: tan, c: [0, 1, 0, 1 / 3, 0, 2 / 15, 0, 17 / 315, 0, 62 / 2835], x: [-0.2, 0.15] }),
    S('tangente iperbolica', 'hyperbolic tangent', 'tanh x = x − x³/3 + 2x⁵/15 − 17x⁷/315 + …', 'π/2', '', { f: Math.tanh, c: [0, 1, 0, -1 / 3, 0, 2 / 15, 0, -17 / 315, 0, 62 / 2835], x: [-0.2, 0.15] }),
    S('x/(eˣ − 1) (Bernoulli)', 'x/(eˣ − 1) (Bernoulli)', 'x/(eˣ − 1) = Σ Bₙ xⁿ/n! = 1 − x/2 + x²/12 − x⁴/720 + …', '2π', 'definisce i numeri di Bernoulli', { f: function (x) { return x / Math.expm1(x); }, c: [1, -1 / 2, 1 / 12, 0, -1 / 720, 0, 1 / 30240, 0, -1 / 1209600], x: [-0.3, 0.25] }),
    S('formula di Taylor', 'Taylor formula', 'f(x) = Σ f⁽ⁿ⁾(x₀)(x − x₀)ⁿ/n! + Rₙ(x)', '—', 'resto di Lagrange: Rₙ = f⁽ⁿ⁺¹⁾(ξ)(x − x₀)ⁿ⁺¹/(n + 1)!'),
    S('raggio di convergenza', 'radius of convergence', '1/R = limsup |cₙ|^(1/n)  (Cauchy–Hadamard)', '—', 'o, se esiste, 1/R = lim |cₙ₊₁/cₙ|')
  ];

  var IDENTITA = [
    T('identità fondamentale', 'Pythagorean identity', 'sin²x + cos²x = 1', '', { l: function (x) { return sin(x) * sin(x) + cos(x) * cos(x); }, r: function () { return 1; } }),
    T('tangente e secante', 'tangent and secant', '1 + tan²x = sec²x', '', { l: function (x) { return 1 + tan(x) * tan(x); }, r: function (x) { return 1 / (cos(x) * cos(x)); } }),
    T('seno della somma', 'sine of a sum', 'sin(x ± y) = sin x cos y ± cos x sin y', '', { l: function (x, y) { return sin(x + y); }, r: function (x, y) { return sin(x) * cos(y) + cos(x) * sin(y); } }),
    T('coseno della somma', 'cosine of a sum', 'cos(x ± y) = cos x cos y ∓ sin x sin y', '', { l: function (x, y) { return cos(x - y); }, r: function (x, y) { return cos(x) * cos(y) + sin(x) * sin(y); } }),
    T('tangente della somma', 'tangent of a sum', 'tan(x + y) = (tan x + tan y)/(1 − tan x tan y)', '', { l: function (x, y) { return tan(x + y); }, r: function (x, y) { return (tan(x) + tan(y)) / (1 - tan(x) * tan(y)); } }),
    T('seno doppio', 'double-angle sine', 'sin 2x = 2 sin x cos x', '', { l: function (x) { return sin(2 * x); }, r: function (x) { return 2 * sin(x) * cos(x); } }),
    T('coseno doppio', 'double-angle cosine', 'cos 2x = cos²x − sin²x = 2cos²x − 1 = 1 − 2sin²x', '', { l: function (x) { return cos(2 * x); }, r: function (x) { return 1 - 2 * sin(x) * sin(x); } }),
    T('tangente doppia', 'double-angle tangent', 'tan 2x = 2 tan x/(1 − tan²x)', '', { l: function (x) { return tan(2 * x); }, r: function (x) { return 2 * tan(x) / (1 - tan(x) * tan(x)); } }),
    T('seno triplo', 'triple-angle sine', 'sin 3x = 3 sin x − 4 sin³x', '', { l: function (x) { return sin(3 * x); }, r: function (x) { return 3 * sin(x) - 4 * Math.pow(sin(x), 3); } }),
    T('coseno triplo', 'triple-angle cosine', 'cos 3x = 4 cos³x − 3 cos x', '', { l: function (x) { return cos(3 * x); }, r: function (x) { return 4 * Math.pow(cos(x), 3) - 3 * cos(x); } }),
    T('bisezione', 'half angle', 'sin²(x/2) = (1 − cos x)/2,  cos²(x/2) = (1 + cos x)/2', '', { l: function (x) { return sin(x / 2) * sin(x / 2); }, r: function (x) { return (1 - cos(x)) / 2; } }),
    T('formule parametriche', 'tangent half-angle', 'sin x = 2t/(1 + t²), cos x = (1 − t²)/(1 + t²), t = tan(x/2)', '', { l: function (x) { return cos(x); }, r: function (x) { var u = tan(x / 2); return (1 - u * u) / (1 + u * u); } }),
    T('prostaferesi (seni)', 'sum to product (sines)', 'sin x + sin y = 2 sin((x + y)/2) cos((x − y)/2)', '', { l: function (x, y) { return sin(x) + sin(y); }, r: function (x, y) { return 2 * sin((x + y) / 2) * cos((x - y) / 2); } }),
    T('prostaferesi (coseni)', 'sum to product (cosines)', 'cos x − cos y = −2 sin((x + y)/2) sin((x − y)/2)', '', { l: function (x, y) { return cos(x) - cos(y); }, r: function (x, y) { return -2 * sin((x + y) / 2) * sin((x - y) / 2); } }),
    T('Werner', 'product to sum', 'sin x sin y = ½ [cos(x − y) − cos(x + y)]', '', { l: function (x, y) { return sin(x) * sin(y); }, r: function (x, y) { return 0.5 * (cos(x - y) - cos(x + y)); } }),
    T('Werner (seno per coseno)', 'product to sum (sine cosine)', 'sin x cos y = ½ [sin(x + y) + sin(x − y)]', '', { l: function (x, y) { return sin(x) * cos(y); }, r: function (x, y) { return 0.5 * (sin(x + y) + sin(x - y)); } }),
    T('combinazione lineare', 'harmonic addition', 'a sin x + b cos x = √(a² + b²) sin(x + φ), φ = atan2(b, a)', 'prova con a = 3, b = 4', { l: function (x) { return 3 * sin(x) + 4 * cos(x); }, r: function (x) { return 5 * sin(x + Math.atan2(4, 3)); } }),
    T('identità iperbolica fondamentale', 'fundamental hyperbolic identity', 'cosh²x − sinh²x = 1', '', { l: function (x) { return Math.cosh(x) * Math.cosh(x) - Math.sinh(x) * Math.sinh(x); }, r: function () { return 1; } }),
    T('seno iperbolico della somma', 'hyperbolic sine of a sum', 'sinh(x + y) = sinh x cosh y + cosh x sinh y', '', { l: function (x, y) { return Math.sinh(x + y); }, r: function (x, y) { return Math.sinh(x) * Math.cosh(y) + Math.cosh(x) * Math.sinh(y); } }),
    T('coseno iperbolico della somma', 'hyperbolic cosine of a sum', 'cosh(x + y) = cosh x cosh y + sinh x sinh y', '', { l: function (x, y) { return Math.cosh(x + y); }, r: function (x, y) { return Math.cosh(x) * Math.cosh(y) + Math.sinh(x) * Math.sinh(y); } }),
    T('coseno iperbolico doppio', 'hyperbolic double angle', 'cosh 2x = cosh²x + sinh²x = 2 sinh²x + 1', '', { l: function (x) { return Math.cosh(2 * x); }, r: function (x) { return 2 * Math.sinh(x) * Math.sinh(x) + 1; } }),
    T('tangente iperbolica e secante', 'hyperbolic tangent and secant', '1 − tanh²x = sech²x', '', { l: function (x) { return 1 - Math.tanh(x) * Math.tanh(x); }, r: function (x) { return sech(x) * sech(x); } }),
    T('settore seno iperbolico', 'inverse hyperbolic sine', 'arsinh x = ln(x + √(x² + 1))', '', { l: function (x) { return Math.asinh(x); }, r: function (x) { return ln(x + sqrt(x * x + 1)); } }),
    T('formula di Eulero', 'Euler formula', 'e^(ix) = cos x + i sin x;  cos x = (e^(ix) + e^(−ix))/2', 'la parte reale e immaginaria di e^(i(x+y)) = e^(ix) e^(iy) dà le formule di addizione'),
    T('legame trigonometriche–iperboliche', 'trig–hyperbolic link', 'cosh(ix) = cos x,  sinh(ix) = i sin x', '')
  ];

  /* coppie di Laplace: F(s) = ∫₀^∞ f(t) e^(−st) dt */
  function LP(it, en, ft, Fs, roc, prova) { var o = T(it, en, ft + '  ⟼  ' + Fs, roc, prova); o.ft = ft; o.Fs = Fs; return o; }
  var LAPLACE = [
    LP('gradino unitario', 'unit step', '1 (o u(t))', '1/s', 'Re s > 0', { f: function () { return 1; }, F: function (s) { return 1 / s; } }),
    LP('impulso di Dirac', 'Dirac impulse', 'δ(t)', '1', 'ogni s', null),
    LP('rampa', 'ramp', 't', '1/s²', 'Re s > 0', { f: function (x) { return x; }, F: function (s) { return 1 / (s * s); } }),
    LP('potenza intera', 'integer power', 'tⁿ', 'n!/s^(n+1)', 'Re s > 0 (prova con n = 3)', { f: function (x) { return x * x * x; }, F: function (s) { return 6 / Math.pow(s, 4); } }),
    LP('radice', 'square root', '√t', '√π/(2 s^(3/2))', 'Re s > 0', { f: sqrt, F: function (s) { return sqrt(PI) / (2 * Math.pow(s, 1.5)); } }),
    LP('inverso della radice', 'inverse square root', '1/√t', '√(π/s)', 'Re s > 0', { f: function (x) { return 1 / sqrt(x); }, F: function (s) { return sqrt(PI / s); } }),
    LP('potenza reale', 'real power', 't^a', 'Γ(a + 1)/s^(a+1)', 'a > −1 (prova con a = 3/2: Γ(5/2) = 3√π/4)', { f: function (x) { return Math.pow(x, 1.5); }, F: function (s) { return 3 * sqrt(PI) / 4 / Math.pow(s, 2.5); } }),
    LP('esponenziale', 'exponential', 'e^(at)', '1/(s − a)', 'Re s > a (prova con a = 0,5)', { f: function (x) { return exp(0.5 * x); }, F: function (s) { return 1 / (s - 0.5); } }),
    LP('t per esponenziale', 't times exponential', 't e^(at)', '1/(s − a)²', 'Re s > a (prova con a = −1)', { f: function (x) { return x * exp(-x); }, F: function (s) { return 1 / ((s + 1) * (s + 1)); } }),
    LP('tⁿ per esponenziale', 'tⁿ times exponential', 'tⁿ e^(at)', 'n!/(s − a)^(n+1)', 'Re s > a (prova con n = 2, a = 1)', { f: function (x) { return x * x * exp(x); }, F: function (s) { return 2 / Math.pow(s - 1, 3); } }),
    LP('seno', 'sine', 'sin(ωt)', 'ω/(s² + ω²)', 'Re s > 0 (prova con ω = 3)', { f: function (x) { return sin(3 * x); }, F: function (s) { return 3 / (s * s + 9); } }),
    LP('coseno', 'cosine', 'cos(ωt)', 's/(s² + ω²)', 'Re s > 0 (prova con ω = 3)', { f: function (x) { return cos(3 * x); }, F: function (s) { return s / (s * s + 9); } }),
    LP('seno sfasato', 'phase-shifted sine', 'sin(ωt + φ)', '(s sin φ + ω cos φ)/(s² + ω²)', 'prova con ω = 2, φ = 0,7', { f: function (x) { return sin(2 * x + 0.7); }, F: function (s) { return (s * sin(0.7) + 2 * cos(0.7)) / (s * s + 4); } }),
    LP('seno iperbolico', 'hyperbolic sine', 'sinh(at)', 'a/(s² − a²)', 'Re s > |a| (prova con a = 1)', { f: Math.sinh, F: function (s) { return 1 / (s * s - 1); } }),
    LP('coseno iperbolico', 'hyperbolic cosine', 'cosh(at)', 's/(s² − a²)', 'Re s > |a| (prova con a = 1)', { f: Math.cosh, F: function (s) { return s / (s * s - 1); } }),
    LP('oscillazione smorzata (seno)', 'damped sine', 'e^(at) sin(ωt)', 'ω/((s − a)² + ω²)', 'Re s > a (prova con a = −1, ω = 2)', { f: function (x) { return exp(-x) * sin(2 * x); }, F: function (s) { return 2 / ((s + 1) * (s + 1) + 4); } }),
    LP('oscillazione smorzata (coseno)', 'damped cosine', 'e^(at) cos(ωt)', '(s − a)/((s − a)² + ω²)', 'Re s > a (prova con a = −1, ω = 2)', { f: function (x) { return exp(-x) * cos(2 * x); }, F: function (s) { return (s + 1) / ((s + 1) * (s + 1) + 4); } }),
    LP('risonanza (seno)', 'resonance (sine)', 't sin(ωt)', '2ωs/(s² + ω²)²', 'prova con ω = 1,5', { f: function (x) { return x * sin(1.5 * x); }, F: function (s) { return 3 * s / Math.pow(s * s + 2.25, 2); } }),
    LP('risonanza (coseno)', 'resonance (cosine)', 't cos(ωt)', '(s² − ω²)/(s² + ω²)²', 'prova con ω = 1,5', { f: function (x) { return x * cos(1.5 * x); }, F: function (s) { return (s * s - 2.25) / Math.pow(s * s + 2.25, 2); } }),
    LP('differenza di esponenziali', 'difference of exponentials', '(e^(at) − e^(bt))/(a − b)', '1/((s − a)(s − b))', 'a ≠ b (prova con a = 1, b = −3)', { f: function (x) { return (exp(x) - exp(-3 * x)) / 4; }, F: function (s) { return 1 / ((s - 1) * (s + 3)); } }),
    LP('carica di un condensatore', 'capacitor charging', '1 − e^(−at)', 'a/(s(s + a))', 'prova con a = 2', { f: function (x) { return -Math.expm1(-2 * x); }, F: function (s) { return 2 / (s * (s + 2)); } }),
    LP('uno meno coseno', 'one minus cosine', '1 − cos(ωt)', 'ω²/(s(s² + ω²))', 'prova con ω = 2', { f: function (x) { return 1 - cos(2 * x); }, F: function (s) { return 4 / (s * (s * s + 4)); } }),
    LP('ωt − sin ωt', 'ωt − sin ωt', 'ωt − sin(ωt)', 'ω³/(s²(s² + ω²))', 'prova con ω = 2', { f: function (x) { return 2 * x - sin(2 * x); }, F: function (s) { return 8 / (s * s * (s * s + 4)); } }),
    LP('sin ωt − ωt cos ωt', 'sin ωt − ωt cos ωt', 'sin(ωt) − ωt cos(ωt)', '2ω³/(s² + ω²)²', 'prova con ω = 1', { f: function (x) { return sin(x) - x * cos(x); }, F: function (s) { return 2 / Math.pow(s * s + 1, 2); } }),
    LP('seno al quadrato', 'sine squared', 'sin²(ωt)', '2ω²/(s(s² + 4ω²))', 'prova con ω = 1', { f: function (x) { return sin(x) * sin(x); }, F: function (s) { return 2 / (s * (s * s + 4)); } }),
    LP('seno cardinale', 'sinc', 'sin(ωt)/t', 'arctan(ω/s)', 'prova con ω = 1', { f: function (x) { return x < 1e-12 ? 1 : sin(x) / x; }, F: function (s) { return Math.atan(1 / s); } }),
    LP('logaritmo', 'logarithm', 'ln t', '−(γ + ln s)/s', 'γ = costante di Eulero-Mascheroni', { f: ln, F: function (s) { return -(0.5772156649015329 + ln(s)) / s; } }),
    LP('gradino ritardato', 'delayed step', 'u(t − a)', 'e^(−as)/s', 'a ≥ 0 (prova con a = 1)', { f: function (x) { return x >= 1 ? 1 : 0; }, F: function (s) { return exp(-s) / s; } }),
    LP('traslazione in s', 's-shift', 'e^(at) f(t)', 'F(s − a)', 'regola'),
    LP('traslazione in t', 't-shift', 'f(t − a) u(t − a)', 'e^(−as) F(s)', 'regola, a ≥ 0'),
    LP('derivata', 'derivative', 'f′(t)', 's F(s) − f(0⁺)', 'regola; f″ ⟼ s²F − s f(0) − f′(0)'),
    LP('integrale', 'integral', '∫₀ᵗ f(τ) dτ', 'F(s)/s', 'regola'),
    LP('moltiplicazione per t', 'multiplication by t', 't f(t)', '−F′(s)', 'regola'),
    LP('convoluzione', 'convolution', '(f ∗ g)(t) = ∫₀ᵗ f(τ) g(t − τ) dτ', 'F(s) G(s)', 'regola'),
    LP('valore iniziale e finale', 'initial and final value', 'f(0⁺) = lim s→∞ s F(s);  f(∞) = lim s→0 s F(s)', '—', 'il secondo vale se i poli di sF stanno nel semipiano sinistro')
  ];

  /* coppie di Fourier: F(ω) = ∫ f(t) e^(−iωt) dt */
  function FP(it, en, ft, Fw, nota, prova) { var o = T(it, en, ft + '  ⟼  ' + Fw, nota, prova); o.ft = ft; o.Fw = Fw; return o; }
  var FOURIER = [
    FP('gaussiana', 'Gaussian', 'e^(−a t²)', '√(π/a) e^(−ω²/(4a))', 'a > 0: la gaussiana va in una gaussiana (prova con a = 0,7)', { f: function (x) { return exp(-0.7 * x * x); }, re: function (w) { return sqrt(PI / 0.7) * exp(-w * w / 2.8); }, im: function () { return 0; } }),
    FP('esponenziale bilatero', 'two-sided exponential', 'e^(−a|t|)', '2a/(a² + ω²)', 'a > 0: la forma di riga lorentziana (prova con a = 1,2)', { f: function (x) { return exp(-1.2 * Math.abs(x)); }, re: function (w) { return 2.4 / (1.44 + w * w); }, im: function () { return 0; } }),
    FP('esponenziale causale', 'causal exponential', 'e^(−a t) u(t)', '1/(a + iω)', 'a > 0 (prova con a = 1)', { f: function (x) { return x >= 0 ? exp(-x) : 0; }, re: function (w) { return 1 / (1 + w * w); }, im: function (w) { return -w / (1 + w * w); } }),
    FP('t per esponenziale causale', 't times causal exponential', 't e^(−a t) u(t)', '1/(a + iω)²', 'a > 0 (prova con a = 1)', { f: function (x) { return x >= 0 ? x * exp(-x) : 0; }, re: function (w) { return (1 - w * w) / Math.pow(1 + w * w, 2); }, im: function (w) { return -2 * w / Math.pow(1 + w * w, 2); } }),
    FP('impulso rettangolare', 'rectangular pulse', 'rect(t/T) (1 per |t| < T/2)', 'T sinc(ωT/2) = 2 sin(ωT/2)/ω', 'prova con T = 2', { f: function (x) { return Math.abs(x) < 1 ? 1 : 0; }, re: function (w) { return 2 * sin(w) / w; }, im: function () { return 0; }, a: -1, b: 1 }),
    FP('impulso triangolare', 'triangular pulse', 'tri(t/T) = 1 − |t|/T per |t| < T', 'T sinc²(ωT/2) = 4 sin²(ωT/2)/(ω²T)', 'prova con T = 1', { f: function (x) { return Math.abs(x) < 1 ? 1 - Math.abs(x) : 0; }, re: function (w) { return 4 * Math.pow(sin(w / 2), 2) / (w * w); }, im: function () { return 0; }, a: -1, b: 1 }),
    FP('lorentziana', 'Lorentzian', '1/(a² + t²)', '(π/a) e^(−a|ω|)', 'a > 0 (prova con a = 1)', { f: function (x) { return 1 / (1 + x * x); }, re: function (w) { return PI * exp(-Math.abs(w)); }, im: function () { return 0; } }),
    FP('secante iperbolica', 'hyperbolic secant', 'sech(t)', 'π sech(πω/2)', 'come la gaussiana, va in se stessa a meno della scala', { f: sech, re: function (w) { return PI * sech(PI * w / 2); }, im: function () { return 0; } }),
    FP('impulso di Dirac', 'Dirac impulse', 'δ(t)', '1', ''),
    FP('costante', 'constant', '1', '2π δ(ω)', ''),
    FP('coseno', 'cosine', 'cos(ω₀t)', 'π [δ(ω − ω₀) + δ(ω + ω₀)]', ''),
    FP('seno', 'sine', 'sin(ω₀t)', '−iπ [δ(ω − ω₀) − δ(ω + ω₀)]', ''),
    FP('segno', 'sign', 'sgn(t)', '2/(iω)', 'valore principale'),
    FP('gradino', 'step', 'u(t)', 'π δ(ω) + 1/(iω)', ''),
    FP('pettine di Dirac', 'Dirac comb', 'Σ δ(t − nT)', '(2π/T) Σ δ(ω − 2πk/T)', 'il pettine va in un pettine'),
    FP('traslazione', 'shift', 'f(t − t₀)', 'e^(−iωt₀) F(ω)', 'regola'),
    FP('derivata', 'derivative', 'f′(t)', 'iω F(ω)', 'regola'),
    FP('convoluzione', 'convolution', '(f ∗ g)(t)', 'F(ω) G(ω)', 'regola'),
    FP('Parseval-Plancherel', 'Parseval–Plancherel', '∫ |f(t)|² dt', '(1/2π) ∫ |F(ω)|² dω', 'con questa convenzione')
  ];

  function CM(it, en, simbolo, valore, def, calcola) { return { nm: [it, en], simbolo: simbolo, valore: valore, nota: def, f: def, calcola: calcola || null }; }
  var COSTANTI_MAT = [
    CM('pi greco', 'pi', 'π', '3.14159265358979', 'rapporto fra circonferenza e diametro'),
    CM('numero di Nepero', 'Euler’s number', 'e', '2.71828182845905', 'lim (1 + 1/n)ⁿ = Σ 1/n!'),
    CM('costante di Eulero-Mascheroni', 'Euler–Mascheroni constant', 'γ', '0.577215664901533', 'lim (Σₖ≤ₙ 1/k − ln n)'),
    CM('radice di 2', 'square root of 2', '√2', '1.41421356237310', 'la diagonale del quadrato unitario'),
    CM('radice di 3', 'square root of 3', '√3', '1.73205080756888', ''),
    CM('sezione aurea', 'golden ratio', 'φ', '1.61803398874989', '(1 + √5)/2'),
    CM('logaritmo naturale di 2', 'natural log of 2', 'ln 2', '0.693147180559945', 'Σ (−1)ⁿ⁺¹/n'),
    CM('logaritmo naturale di 10', 'natural log of 10', 'ln 10', '2.30258509299405', ''),
    CM('ζ(2)', 'ζ(2)', 'ζ(2) = π²/6', '1.64493406684823', 'problema di Basilea: Σ 1/n²'),
    CM('costante di Apéry', 'Apéry’s constant', 'ζ(3)', '1.20205690315959', 'Σ 1/n³, irrazionale (Apéry)'),
    CM('costante di Catalan', 'Catalan’s constant', 'G', '0.915965594177219', 'Σ (−1)ⁿ/(2n + 1)²'),
    CM('costante di Gelfond', 'Gelfond’s constant', 'e^π', '23.1406926327793', 'trascendente (Gelfond-Schneider)'),
    CM('costante di Feigenbaum', 'Feigenbaum constant', 'δ', '4.66920160910299', 'rapporto limite delle biforcazioni'),
    CM('costante di Glaisher-Kinkelin', 'Glaisher–Kinkelin constant', 'A', '1.28242712910062', 'ln A = 1/12 − ζ′(−1)')
  ];

  F.calcolo.tavole = { DERIVATE: DERIVATE, INTEGRALI: INTEGRALI, SERIE: SERIE, LAPLACE: LAPLACE, FOURIER: FOURIER, IDENTITA: IDENTITA, COSTANTI_MAT: COSTANTI_MAT };

  /* ═════════════════════════════════════════════════════════════════════════
     L'INTERFACCIA
     ═════════════════════════════════════════════════════════════════════════ */
  var STILE = [
    '.bsiRM-barra{display:flex;flex-wrap:wrap;gap:8px;align-items:end;margin:6px 0 10px}',
    '.bsiRM-barra>div{flex:1 1 180px;min-width:0}',
    '.bsiRM-barra label{display:block;font-size:.78rem;color:#9fb1c6;margin-bottom:3px}',
    '.bsiRM-conta{font-size:.78rem;color:#8494a8;margin:2px 0 8px}',
    '.bsiRM-griglia{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,250px),1fr));gap:8px}',
    '.bsiRM-carta{background:#0a1628;border:1px solid #1a3050;border-radius:10px;padding:10px 12px;min-width:0;overflow-wrap:anywhere}',
    '.bsiRM-carta a{color:#5eead4;text-decoration:none;font-weight:700}',
    '.bsiRM-carta a:hover,.bsiRM-carta a:focus{text-decoration:underline}',
    '.bsiRM-desc{font-size:.8rem;color:#c9d3df;line-height:1.45;margin:4px 0}',
    '.bsiRM-piede{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;font-size:.74rem}',
    '.bsiRM-chip{border:1px solid #2a4a6e;border-radius:10px;padding:1px 7px;color:#9fb1c6}',
    '.bsiRM-piede a{font-weight:600;color:#93c5fd}',
    '.bsiRM-liv{margin:14px 0 6px;font-weight:800;color:#e6fffb;font-size:.95rem}',
    '.bsiRM-libro{border-bottom:1px solid #16263d;padding:7px 2px;overflow-wrap:anywhere}',
    '.bsiRM-libro .aut{color:#c9d3df;font-size:.84rem}.bsiRM-libro i{color:#e6fffb}',
    '.bsiRM-libro .ed{color:#8494a8;font-size:.8rem}',
    '.bsiRM-libro .cerca{font-size:.75rem;margin-top:2px}.bsiRM-libro .cerca a{color:#93c5fd;margin-right:10px}',
    '.bsiRM-out{background:#081522;border:1px solid #1a3050;border-radius:8px;padding:8px 10px;margin:6px 0;overflow-wrap:anywhere;font-size:.85rem;line-height:1.5;color:#e6fffb}',
    '.bsiRM-out pre{margin:0;white-space:pre-wrap;font-size:.8rem}',
    '.bsiRM-fmt{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:10px;font-weight:700;color:#9fb1c6;font-size:.82rem}',
    '.bsiRM-ko{background:rgba(255,138,128,.07);border:1px solid #6b3a3a;border-radius:8px;padding:10px 12px;font-size:.82rem;line-height:1.55;color:#f3d6d3;overflow-wrap:anywhere}',
    '.bsiRM-ko code{color:#ffd0c8;word-break:break-all}.bsiRM-ko a{color:#93c5fd}',
    '.bsiRM-attesa{color:#9fb1c6;font-size:.84rem;padding:8px 0}',
    '.bsiRM-tabwrap{overflow-x:auto;max-width:100%}',
    '.bsiRM-tab{width:100%;border-collapse:collapse;font-size:.82rem}',
    '.bsiRM-tab td,.bsiRM-tab th{border-bottom:1px solid #16263d;padding:5px 6px;text-align:left;vertical-align:top}',
    '.bsiRM-tab th{color:#9fb1c6;font-weight:700}',
    '.bsiRM-tab td.f{font-family:"Cambria Math",Georgia,serif;color:#e6fffb;overflow-wrap:anywhere;min-width:10em}',
    '.bsiRM-tab td.n{font-variant-numeric:tabular-nums;white-space:nowrap}',
    '.bsiRM-tab .ex{color:#5eead4;font-size:.72rem;border:1px solid #2f6f66;border-radius:8px;padding:0 5px;margin-left:4px}',
    '.bsiRM-mini{border:1px solid #2a4a6e;background:#0a1628;color:#c9d3df;border-radius:7px;padding:2px 8px;font-size:.74rem;cursor:pointer;font-family:inherit;min-height:26px}',
    '.bsiRM-ris{font-size:1.15rem;font-weight:800;color:#5eead4;margin:8px 0;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}',
    '.bsiRM-form{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,160px),1fr));gap:8px}',
    '.bsiRM-form label{font-size:.76rem;color:#9fb1c6;display:block;margin-bottom:2px}',
    '.bsiRM textarea{width:100%;box-sizing:border-box;background:#081522;color:#e6fffb;border:1px solid #1a3050;border-radius:7px;padding:6px 8px;font-family:inherit;font-size:.84rem;min-height:70px}',
    '.bsiRM-sez{margin:12px 0 4px;font-weight:800;color:#e6fffb;font-size:.92rem}'
  ].join('\n');
  function stile() {
    if (document.getElementById('bsiRM-stile')) return;
    var s = document.createElement('style'); s.id = 'bsiRM-stile'; s.textContent = STILE;
    document.head.appendChild(s);
  }
  function a(href, txt, extra) {
    var x = F.el('a', { href: href, target: '_blank', rel: 'noopener noreferrer', testo: txt });
    if (extra) x.setAttribute('aria-label', extra);
    return x;
  }
  function campo(padre, etich, nodo) {
    var d = F.el('div', null, [F.el('label', { testo: tt(etich) }), nodo]);
    padre.appendChild(d); return nodo;
  }
  function nota(padre, txt) { var n = F.el('div', { 'class': 'bsiFX-nota', html: txt }); padre.appendChild(n); return n; }
  function piega(s) { s = String(s || '').toLowerCase(); return s.normalize ? s.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : s; }
  function copia(testo, bott) {
    function fatto(ok) {
      if (!bott) return;
      var v = bott.textContent; bott.textContent = ok ? t('✓ copiato', '✓ copied') : t('copia non riuscita', 'copy failed');
      setTimeout(function () { bott.textContent = v; }, 1400);
    }
    function vecchio() {
      try {
        var ta = F.el('textarea', { style: 'position:fixed;left:-9999px;top:0' }); ta.value = testo;
        document.body.appendChild(ta); ta.select(); var ok = document.execCommand('copy'); document.body.removeChild(ta); fatto(ok);
      } catch (e) { fatto(false); }
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(testo).then(function () { fatto(true); }, vecchio);
      else vecchio();
    } catch (e) { vecchio(); }
  }
  function mini(padre, txt, fn) { var b = F.el('button', { 'class': 'bsiRM-mini', type: 'button', testo: tt(txt) }); b.addEventListener('click', function () { fn(b); }); padre.appendChild(b); return b; }

  /* ── scheda: Risorse web ── */
  var NOMI_MAT = { fisica: ['fisica', 'physics'], matematica: ['matematica', 'mathematics'], chimica: ['chimica', 'chemistry'] };
  function schedaLink(materia) {
    return function (div) {
      stile(); div.classList.add('bsiRM');
      var lista = LINK[materia];
      nota(div, t('Una scelta di <b>' + lista.length + ' siti ufficiali e stabili</b> di ' + NOMI_MAT[materia][0] + ': banche dati, corsi aperti, dati di riferimento, preprint, riviste, società ed enti, programmi. Si aprono in una nuova scheda. Quasi tutti sono in inglese: il collegamento «🇮🇹 leggi in italiano» apre la stessa pagina attraverso la traduzione automatica di Google, senza copiarne il contenuto.',
        'A selection of <b>' + lista.length + ' official, stable sites</b> for ' + NOMI_MAT[materia][1] + ': databases, open courses, reference data, preprints, journals, societies and institutions, software. They open in a new tab. The «🇮🇹 leggi in italiano» link opens the same page through Google’s machine translation into Italian.'));
      var barra = F.el('div', { 'class': 'bsiRM-barra' }); div.appendChild(barra);
      var q = campo(barra, ['Cerca', 'Search'], F.el('input', { type: 'text', placeholder: t('nome, argomento…', 'name, topic…'), 'aria-label': t('Cerca fra le risorse', 'Search resources') }));
      var sel = campo(barra, ['Categoria', 'Category'], F.el('select', { 'aria-label': t('Categoria', 'Category') }));
      var usate = {}; lista.forEach(function (r) { usate[r.cat] = (usate[r.cat] || 0) + 1; });
      sel.appendChild(F.el('option', { value: '', testo: t('tutte', 'all') + ' (' + lista.length + ')' }));
      Object.keys(CATEGORIE).forEach(function (k) { if (usate[k]) sel.appendChild(F.el('option', { value: k, testo: tt(CATEGORIE[k]) + ' (' + usate[k] + ')' })); });
      var conta = F.el('div', { 'class': 'bsiRM-conta', 'aria-live': 'polite' }); div.appendChild(conta);
      var gr = F.el('div', { 'class': 'bsiRM-griglia' }); div.appendChild(gr);
      function rendi() {
        var s = piega(q.value.trim()), c = sel.value;
        gr.innerHTML = '';
        var n = 0;
        lista.forEach(function (r) {
          if (c && r.cat !== c) return;
          if (s && piega(r.nm + ' ' + r.d + ' ' + r.url + ' ' + tt(CATEGORIE[r.cat])).indexOf(s) < 0) return;
          n++;
          var carta = F.el('div', { 'class': 'bsiRM-carta' });
          carta.appendChild(a(r.url, r.nm + ' ↗'));
          carta.appendChild(F.el('div', { 'class': 'bsiRM-desc', testo: r.d }));
          var p = F.el('div', { 'class': 'bsiRM-piede' });
          p.appendChild(F.el('span', { 'class': 'bsiRM-chip', testo: tt(CATEGORIE[r.cat]) }));
          p.appendChild(a(L.tradotto(r.url), '🇮🇹 ' + t('leggi in italiano', 'read in Italian'), r.nm + ' — ' + t('leggi in italiano', 'read in Italian')));
          carta.appendChild(p);
          gr.appendChild(carta);
        });
        conta.textContent = n + ' / ' + lista.length + ' ' + t('risorse', 'resources');
        if (!n) gr.appendChild(F.el('div', { 'class': 'bsiRM-attesa', testo: t('Nessuna risorsa corrisponde alla ricerca.', 'No resource matches the search.') }));
      }
      q.addEventListener('input', rendi); sel.addEventListener('change', rendi);
      rendi();
    };
  }

  /* ── scheda: Bibliografia ── */
  function schedaLibri(materia) {
    return function (div) {
      stile(); div.classList.add('bsiRM');
      var lista = LIBRI[materia];
      nota(div, t('<b>' + lista.length + ' testi classici</b> di ' + NOMI_MAT[materia][0] + ', dal primo anno alla ricerca. Di proposito <b>non</b> ci sono anni né ISBN: le edizioni cambiano e un numero scritto a memoria sarebbe un errore invisibile. I tre collegamenti cercano il libro per titolo e autore su Google Libri, su WorldCat (le biblioteche del mondo) e sull’OPAC SBN (le biblioteche italiane), e portano sempre all’edizione corrente.',
        '<b>' + lista.length + ' classic textbooks</b> for ' + NOMI_MAT[materia][1] + ', from first year to research. On purpose there are <b>no</b> years or ISBNs: editions change, and a number written from memory would be an invisible error. The three links search the book by title and author on Google Books, WorldCat (libraries worldwide) and OPAC SBN (Italian libraries), always reaching the current edition.'));
      var barra = F.el('div', { 'class': 'bsiRM-barra' }); div.appendChild(barra);
      var q = campo(barra, ['Cerca', 'Search'], F.el('input', { type: 'text', placeholder: t('autore, titolo…', 'author, title…'), 'aria-label': t('Cerca un libro', 'Search a book') }));
      var sel = campo(barra, ['Livello', 'Level'], F.el('select', { 'aria-label': t('Livello', 'Level') }));
      sel.appendChild(F.el('option', { value: '', testo: t('tutti i livelli', 'all levels') }));
      Object.keys(LIVELLI).forEach(function (k) { sel.appendChild(F.el('option', { value: k, testo: tt(LIVELLI[k]) })); });
      var conta = F.el('div', { 'class': 'bsiRM-conta', 'aria-live': 'polite' }); div.appendChild(conta);
      var corpo = F.el('div'); div.appendChild(corpo);
      function rendi() {
        var s = piega(q.value.trim()), lv = sel.value, n = 0;
        corpo.innerHTML = '';
        Object.keys(LIVELLI).forEach(function (k) {
          if (lv && k !== lv) return;
          var qui = lista.filter(function (b) { return b.livello === k && (!s || piega(b.autori + ' ' + b.titolo + ' ' + b.editore).indexOf(s) >= 0); });
          if (!qui.length) return;
          corpo.appendChild(F.el('div', { 'class': 'bsiRM-liv', testo: tt(LIVELLI[k]) + ' · ' + qui.length }));
          qui.forEach(function (b) {
            n++;
            var c = cercaLibro(b);
            var r = F.el('div', { 'class': 'bsiRM-libro' });
            r.appendChild(F.el('div', null, [F.el('span', { 'class': 'aut', testo: b.autori + ' — ' }), F.el('i', { testo: b.titolo })]));
            r.appendChild(F.el('div', { 'class': 'ed', testo: b.editore }));
            var ce = F.el('div', { 'class': 'cerca' });
            ce.appendChild(a(c.google, 'Google Libri', b.titolo + ' — Google Libri'));
            ce.appendChild(a(c.worldcat, 'WorldCat', b.titolo + ' — WorldCat'));
            ce.appendChild(a(c.sbn, 'OPAC SBN', b.titolo + ' — OPAC SBN'));
            r.appendChild(ce);
            corpo.appendChild(r);
          });
        });
        conta.textContent = n + ' / ' + lista.length + ' ' + t('libri', 'books');
        if (!n) corpo.appendChild(F.el('div', { 'class': 'bsiRM-attesa', testo: t('Nessun libro corrisponde alla ricerca.', 'No book matches the search.') }));
      }
      q.addEventListener('input', rendi); sel.addEventListener('change', rendi);
      rendi();
    };
  }

  /* ── scheda: Citazioni ── */
  function prendi(url, timeoutMs) {
    return new Promise(function (ris, rif) {
      var ctl = (typeof AbortController === 'function') ? new AbortController() : null;
      var finito = false;
      var tm = setTimeout(function () {
        if (finito) return; finito = true;
        if (ctl) ctl.abort();
        rif(new Error(t('nessuna risposta entro ', 'no answer within ') + Math.round(timeoutMs / 1000) + ' s'));
      }, timeoutMs);
      fetch(url, ctl ? { signal: ctl.signal, headers: { Accept: 'application/json' } } : undefined)
        .then(function (r) {
          if (!r.ok) { var e = new Error('HTTP ' + r.status); e.stato = r.status; throw e; }
          return r.json();
        })
        .then(function (j) { if (finito) return; finito = true; clearTimeout(tm); ris(j); },
          function (e) { if (finito) return; finito = true; clearTimeout(tm); rif(e); });
    });
  }
  function chiaviDi(dati) {
    try {
      if (!dati || typeof dati !== 'object') return String(typeof dati);
      var m = dati.message && typeof dati.message === 'object' ? dati.message : dati;
      return Object.keys(m).slice(0, 10).map(function (x) { var v = m[x]; return x + ':' + (Array.isArray(v) ? 'lista[' + v.length + ']' : typeof v); }).join(', ');
    } catch (e) { return '(illeggibile)'; }
  }
  function blocchiFormati(dove, rec) {
    dove.innerHTML = '';
    [['APA 7', function (h) { return apa(rec, h); }], ['IEEE', function (h) { return ieee(rec, h); }], ['ISO 690', function (h) { return iso690(rec, h); }], ['BibTeX', null]].forEach(function (f) {
      var testa = F.el('div', { 'class': 'bsiRM-fmt' }, [F.el('span', { testo: f[0] })]);
      var piano = f[1] ? f[1](false) : bibtex(rec);
      mini(testa, ['📋 Copia', '📋 Copy'], function (b) { copia(piano, b); });
      dove.appendChild(testa);
      var out = F.el('div', { 'class': 'bsiRM-out' });
      if (f[1]) out.innerHTML = f[1](true);
      else out.appendChild(F.el('pre', { testo: piano }));
      dove.appendChild(out);
    });
  }
  function schedaCitazioni(div) {
    stile(); div.classList.add('bsiRM');
    nota(div, t('Incolla un <b>DOI</b> (anche come indirizzo https://doi.org/… o «doi:…»): la scheda dell’opera si chiede <b>in diretta</b> a Crossref, il registro dei DOI di riviste e libri, e se ne ricavano le citazioni in <b>APA 7</b>, <b>IEEE</b>, <b>ISO 690</b> e <b>BibTeX</b>, da copiare. Se la rete non c’è, o il DOI è registrato altrove (DataCite, per i dati), lo dico e mostro l’indirizzo della richiesta; il modulo qui sotto funziona anche senza rete.',
      'Paste a <b>DOI</b> (also as https://doi.org/… or “doi:…”): the work’s record is requested <b>live</b> from Crossref, the DOI registry of journals and books, and turned into <b>APA 7</b>, <b>IEEE</b>, <b>ISO 690</b> and <b>BibTeX</b> citations to copy. If there is no network, or the DOI is registered elsewhere (DataCite, for data), I say so and show the request address; the form below works offline too.'));
    var barra = F.el('div', { 'class': 'bsiRM-barra' }); div.appendChild(barra);
    var inp = campo(barra, ['DOI', 'DOI'], F.el('input', { type: 'text', placeholder: '10.1103/PhysRev.47.777', 'aria-label': 'DOI', autocomplete: 'off', spellcheck: 'false' }));
    var bwrap = F.el('div', { style: 'flex:0 0 auto' }); barra.appendChild(bwrap);
    var stato = F.el('div', { 'aria-live': 'polite' }); div.appendChild(stato);
    var esito = F.el('div'); div.appendChild(esito);
    var gen = 0;
    function cerca() {
      var doi = normalizzaDoi(inp.value);
      esito.innerHTML = '';
      if (!doi) {
        stato.innerHTML = '<div class="bsiRM-ko"><b>' + t('Questo non è un DOI.', 'This is not a DOI.') + '</b><br>' +
          t('Un DOI comincia con «10.», un numero di 4–9 cifre e una barra: per esempio <code>10.1103/PhysRev.47.777</code>.', 'A DOI starts with “10.”, a 4–9 digit number and a slash: for example <code>10.1103/PhysRev.47.777</code>.') + '</div>';
        return;
      }
      var url = L.crossref(doi), mio = ++gen;
      stato.innerHTML = '<div class="bsiRM-attesa">' + t('Chiedo a Crossref…', 'Asking Crossref…') + ' <code>' + esc(url) + '</code></div>';
      prendi(url, 15000).then(function (j) {
        if (mio !== gen) return;
        var rec = daCrossref(j);
        if (!rec) {
          stato.innerHTML = '<div class="bsiRM-ko"><b>' + t('Crossref ha risposto, e non ho riconosciuto la risposta.', 'Crossref answered, and I did not recognise the answer.') + '</b><br>' +
            t('Chiavi arrivate: ', 'Keys received: ') + '<code>' + esc(chiaviDi(j)) + '</code><br>' +
            t('Non è «il DOI non esiste»: è «non ho capito», e sono due cose diverse.', 'It is not “the DOI does not exist”: it is “I did not understand”, two different things.') +
            '<br><a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' + t('apri la risposta grezza', 'open the raw answer') + '</a></div>';
          return;
        }
        stato.innerHTML = '<div class="bsiRM-conta">' + t('Dati da Crossref · ', 'Data from Crossref · ') + '<a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer" style="color:#93c5fd">' + t('risposta grezza', 'raw answer') + '</a> · ' +
          t('controlla sempre maiuscole e caratteri speciali del titolo prima di consegnare.', 'always check title capitalisation and special characters before submitting.') + '</div>';
        blocchiFormati(esito, rec);
        riempiModulo(rec);
      }).catch(function (e) {
        if (mio !== gen) return;
        var msg = String(e && e.message || e);
        var nonTrovato = e && e.stato === 404;
        stato.innerHTML = '<div class="bsiRM-ko"><b>' + (nonTrovato ? t('Crossref non conosce questo DOI.', 'Crossref does not know this DOI.') : t('Non sono riuscito a leggere Crossref.', 'I could not read Crossref.')) + '</b><br>' + esc(msg) + '<br><br>' +
          t('Ho chiesto questo:', 'This is what I asked for:') + '<br><code>' + esc(url) + '</code><br><br>' +
          (nonTrovato ? t('Può essere un DOI registrato presso un’altra agenzia (per esempio DataCite, per i dati e il software): prova il risolutore ufficiale. ', 'It may be a DOI registered with another agency (e.g. DataCite, for data and software): try the official resolver. ')
            : t('Succede senza rete, con Crossref momentaneamente giù o su una rete che filtra il dominio. <b>Non invento la citazione</b>: l’indirizzo qui sopra si apre a mano, e il modulo qui sotto funziona anche senza rete. ', 'This happens with no network, with Crossref temporarily down or on a network filtering the domain. <b>I will not make the citation up</b>: the address above can be opened by hand, and the form below works offline. ')) +
          '<br><a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' + t('apri la richiesta', 'open the request') + '</a> · <a href="' + esc(L.doi(doi)) + '" target="_blank" rel="noopener noreferrer">doi.org/' + esc(doi) + '</a></div>';
      });
    }
    F.bottone(bwrap, ['🔎 Cerca su Crossref', '🔎 Look up on Crossref'], cerca);
    inp.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') cerca(); });

    /* il modulo a mano */
    div.appendChild(F.el('div', { 'class': 'bsiRM-sez', testo: t('Modulo a mano (senza rete)', 'Manual form (offline)') }));
    nota(div, t('Autori uno per riga, nella forma «Cognome, Nome»; un ente (un consorzio, un’organizzazione) si scrive fra parentesi graffe: «{World Health Organization}».', 'Authors one per line as “Surname, Given names”; an organisation goes in braces: “{World Health Organization}”.'));
    var form = F.el('div', { 'class': 'bsiRM-form' }); div.appendChild(form);
    var M = {};
    M.tipo = campo(form, ['Tipo', 'Type'], F.el('select', { 'aria-label': t('Tipo', 'Type') }));
    [['articolo', ['articolo di rivista', 'journal article']], ['libro', ['libro', 'book']], ['capitolo', ['capitolo', 'chapter']], ['atti', ['atti di convegno', 'proceedings']], ['altro', ['altro', 'other']]].forEach(function (v) { M.tipo.appendChild(F.el('option', { value: v[0], testo: tt(v[1]) })); });
    [['titolo', ['Titolo', 'Title']], ['rivista', ['Rivista o volume', 'Journal or book']], ['anno', ['Anno', 'Year']], ['volume', ['Volume', 'Volume']], ['numero', ['Fascicolo', 'Issue']], ['pagine', ['Pagine', 'Pages']], ['editore', ['Editore', 'Publisher']], ['doi', ['DOI', 'DOI']]].forEach(function (c) {
      M[c[0]] = campo(form, c[1], F.el('input', { type: 'text', 'aria-label': tt(c[1]) }));
    });
    var autWrap = F.el('div'); div.appendChild(autWrap);
    M.autori = campo(autWrap, ['Autori', 'Authors'], F.el('textarea', { 'aria-label': t('Autori, uno per riga', 'Authors, one per line'), placeholder: 'Rossi, Mario\nBianchi, Luisa\n{CERN}' }));
    var bw = F.el('div'); div.appendChild(bw);
    var esitoM = F.el('div'); div.appendChild(esitoM);
    function daModulo() {
      var autori = M.autori.value.split(/\n+/).map(function (r) { return r.trim(); }).filter(Boolean).map(function (r) {
        var g = /^\{(.+)\}$/.exec(r); if (g) return { org: g[1].trim() };
        var p = r.split(','); if (p.length > 1) return { cognome: p[0].trim(), nome: p.slice(1).join(',').trim() };
        var w = r.split(/\s+/); return w.length > 1 ? { cognome: w.pop(), nome: w.join(' ') } : { cognome: r, nome: '' };
      });
      return { tipo: M.tipo.value, titolo: M.titolo.value.trim(), autori: autori, rivista: M.rivista.value.trim(), volume: M.volume.value.trim(), numero: M.numero.value.trim(), pagine: M.pagine.value.trim(), articolo: '', anno: M.anno.value.trim(), mese: 0, editore: M.editore.value.trim(), doi: normalizzaDoi(M.doi.value) || '', url: '' };
    }
    function riempiModulo(rec) {
      M.tipo.value = rec.tipo; ['titolo', 'rivista', 'anno', 'volume', 'numero', 'pagine', 'editore', 'doi'].forEach(function (k) { M[k].value = rec[k] || ''; });
      M.autori.value = rec.autori.map(function (x) { return x.org ? '{' + x.org + '}' : x.cognome + (x.nome ? ', ' + x.nome : ''); }).join('\n');
    }
    F.bottone(bw, ['✍️ Genera le citazioni', '✍️ Build the citations'], function () {
      var rec = daModulo();
      if (!rec.titolo) { esitoM.innerHTML = '<div class="bsiRM-ko">' + t('Serve almeno il titolo.', 'At least the title is needed.') + '</div>'; return; }
      blocchiFormati(esitoM, rec);
    });
  }

  function sezioneRisorse(id, materia, titolo, sotto) {
    F.sezione(id, {
      titolo: titolo, sotto: sotto,
      schede: [
        { nome: ['🌐 Risorse web', '🌐 Web resources'], costruisci: schedaLink(materia) },
        { nome: ['📚 Bibliografia', '📚 Bibliography'], costruisci: schedaLibri(materia) },
        { nome: ['🔖 Citazioni', '🔖 Citations'], costruisci: schedaCitazioni }
      ]
    });
  }
  sezioneRisorse('sfisris', 'fisica', ['🌐 Risorse e bibliografia di fisica', '🌐 Physics resources and bibliography'],
    ['Siti ufficiali scelti e divisi per categoria, i testi classici dal primo anno al dottorato, e le citazioni da un DOI in APA, IEEE, ISO 690 e BibTeX.', 'Curated official sites by category, classic textbooks from first year to PhD, and citations from a DOI in APA, IEEE, ISO 690 and BibTeX.']);
  sezioneRisorse('smatris', 'matematica', ['🌐 Risorse e bibliografia di matematica', '🌐 Mathematics resources and bibliography'],
    ['Siti ufficiali scelti e divisi per categoria, i testi classici dal primo anno al dottorato, e le citazioni da un DOI in APA, IEEE, ISO 690 e BibTeX.', 'Curated official sites by category, classic textbooks from first year to PhD, and citations from a DOI in APA, IEEE, ISO 690 and BibTeX.']);
  sezioneRisorse('schiris', 'chimica', ['🌐 Risorse e bibliografia di chimica', '🌐 Chemistry resources and bibliography'],
    ['Siti ufficiali scelti e divisi per categoria, i testi classici dal primo anno al dottorato, e le citazioni da un DOI in APA, IEEE, ISO 690 e BibTeX.', 'Curated official sites by category, classic textbooks from first year to PhD, and citations from a DOI in APA, IEEE, ISO 690 and BibTeX.']);

  /* ── sfiscost: costanti e unita' ── */
  function numero(v) {
    if (!isFinite(v)) return String(v);
    var a = Math.abs(v);
    if (a !== 0 && (a < 1e-4 || a >= 1e7)) {
      var s = v.toExponential(11).replace(/\.?0+e/, 'e');
      var p = s.split('e');
      return p[0] + ' × 10' + sup(p[1].replace('+', ''));
    }
    return String(+v.toPrecision(12));
  }
  function sup(n) { var m = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' }; return String(n).split('').map(function (c) { return m[c] || c; }).join(''); }
  function grezzo(v) { return String(+v.toPrecision(12)); }

  function schedaCostanti(div) {
    stile(); div.classList.add('bsiRM');
    nota(div, t('Le costanti fisiche nei valori raccomandati <b>CODATA 2018</b>. Dal 20 maggio 2019 il SI è definito fissando sette costanti (c, h, e, k_B, N_A, Δν_Cs, K_cd): sono <b>esatte</b>, e lo sono anche quelle che si ricavano solo da loro (R = N_A k_B, F = N_A e, σ, Φ₀, K_J, R_K…), che qui sono calcolate e non copiate. Le altre hanno l’incertezza standard tipo; la massa del chilogrammo campione non c’è più, e μ₀ ed ε₀ sono diventate misure.',
      'Physical constants as <b>CODATA 2018</b> recommended values. Since 20 May 2019 the SI is defined by fixing seven constants (c, h, e, k_B, N_A, Δν_Cs, K_cd): they are <b>exact</b>, and so are constants derived only from them (R = N_A k_B, F = N_A e, σ, Φ₀, K_J, R_K…), computed here rather than copied. The others carry their standard uncertainty; μ₀ and ε₀ are now measured.'));
    var barra = F.el('div', { 'class': 'bsiRM-barra' }); div.appendChild(barra);
    var q = campo(barra, ['Cerca', 'Search'], F.el('input', { type: 'text', placeholder: t('nome o simbolo…', 'name or symbol…'), 'aria-label': t('Cerca una costante', 'Search a constant') }));
    var soloEs = campo(barra, ['Mostra', 'Show'], F.el('select', { 'aria-label': t('Filtro', 'Filter') }));
    [['', ['tutte', 'all']], ['es', ['solo esatte', 'exact only']], ['mis', ['solo misurate', 'measured only']]].forEach(function (v) { soloEs.appendChild(F.el('option', { value: v[0], testo: tt(v[1]) })); });
    var conta = F.el('div', { 'class': 'bsiRM-conta', 'aria-live': 'polite' }); div.appendChild(conta);
    var wrap = F.el('div', { 'class': 'bsiRM-tabwrap' }); div.appendChild(wrap);
    function rendi() {
      var s = piega(q.value.trim()), fl = soloEs.value, n = 0;
      var tab = F.el('table', { 'class': 'bsiRM-tab' });
      tab.appendChild(F.el('tr', null, [F.el('th', { testo: t('Costante', 'Constant') }), F.el('th', { testo: t('Valore', 'Value') }), F.el('th', { testo: t('Unità', 'Unit') }), F.el('th', { testo: '' })]));
      COSTANTI.forEach(function (c) {
        if (fl === 'es' && !c.esatta) return;
        if (fl === 'mis' && c.esatta) return;
        if (s && piega(c.nm[0] + ' ' + c.nm[1] + ' ' + c.simbolo + ' ' + c.k).indexOf(s) < 0) return;
        n++;
        var nome = F.el('td', null, [F.el('b', { testo: c.simbolo + ' ' }), document.createTextNode(tt(c.nm))]);
        if (c.esatta) nome.appendChild(F.el('span', { 'class': 'ex', testo: c.def ? t('esatta · definisce il SI', 'exact · defines SI') : t('esatta', 'exact') }));
        var val = F.el('td', { 'class': 'n', testo: numero(c.valore) });
        if (!c.esatta) val.appendChild(F.el('div', { style: 'color:#8494a8;font-size:.74rem', testo: '± ' + numero(c.incertezza) }));
        var bt = F.el('td');
        mini(bt, ['📋', '📋'], function (b) { copia(grezzo(c.valore), b); }).setAttribute('aria-label', t('Copia il valore di ', 'Copy the value of ') + tt(c.nm));
        tab.appendChild(F.el('tr', null, [nome, val, F.el('td', { testo: c.unita }), bt]));
      });
      wrap.innerHTML = ''; wrap.appendChild(tab);
      conta.textContent = n + ' / ' + COSTANTI.length + ' ' + t('costanti', 'constants');
    }
    q.addEventListener('input', rendi); soloEs.addEventListener('change', rendi);
    rendi();
  }

  function schedaConvertitore(div) {
    stile(); div.classList.add('bsiRM');
    nota(div, t('Si sceglie la grandezza, il valore e le due unità. Il convertitore <b>controlla le dimensioni</b>: converte solo fra unità della stessa grandezza. In energia ci sono anche le unità della spettroscopia (cm⁻¹ tramite hc, K tramite k_B, Hz tramite h, kJ/mol tramite N_A): sono equivalenze di uso comune, non uguaglianze dimensionali. Per le temperature si convertono valori (0 °C = 273,15 K), non differenze.',
      'Choose the quantity, the value and the two units. The converter <b>checks dimensions</b>: it only converts within the same quantity. Energy also includes spectroscopic units (cm⁻¹ via hc, K via k_B, Hz via h, kJ/mol via N_A): common equivalences, not dimensional identities. Temperatures convert values (0 °C = 273.15 K), not differences.'));
    var barra = F.el('div', { 'class': 'bsiRM-barra' }); div.appendChild(barra);
    var gsel = campo(barra, ['Grandezza', 'Quantity'], F.el('select', { 'aria-label': t('Grandezza', 'Quantity') }));
    Object.keys(GRANDEZZE).forEach(function (k) { gsel.appendChild(F.el('option', { value: k, testo: tt(GRANDEZZE[k].nm) })); });
    gsel.value = 'energia';
    var barra2 = F.el('div', { 'class': 'bsiRM-barra' }); div.appendChild(barra2);
    var val = campo(barra2, ['Valore', 'Value'], F.el('input', { type: 'text', inputmode: 'decimal', value: '1', 'aria-label': t('Valore', 'Value') }));
    var da = campo(barra2, ['Da', 'From'], F.el('select', { 'aria-label': t('Unità di partenza', 'From unit') }));
    var aa = campo(barra2, ['A', 'To'], F.el('select', { 'aria-label': t('Unità di arrivo', 'To unit') }));
    var ris = F.el('div', { 'class': 'bsiRM-ris', 'aria-live': 'polite' }); div.appendChild(ris);
    var bw = F.el('div'); div.appendChild(bw);
    var tutte = F.el('div', { 'class': 'bsiRM-tabwrap' }); div.appendChild(tutte);
    function leggi(s) { return parseFloat(String(s).replace(/\s/g, '').replace(',', '.').replace(/×10\^?/, 'e')); }
    function riempi() {
      var g = GRANDEZZE[gsel.value];
      [da, aa].forEach(function (s) { s.innerHTML = ''; g.unita.forEach(function (u) { s.appendChild(F.el('option', { value: u.k, testo: u.k + ' — ' + t(u.nm, u.en) })); }); });
      da.value = g.unita[gsel.value === 'energia' ? 2 : 0].k; aa.value = g.unita[gsel.value === 'energia' ? 0 : 1].k;
      calcola();
    }
    function calcola() {
      var v = leggi(val.value), g = gsel.value;
      if (!isFinite(v)) { ris.textContent = t('Scrivi un numero (anche 1.5e-3 o 1,5).', 'Type a number (also 1.5e-3).'); tutte.innerHTML = ''; return; }
      try {
        var r = converti(v, g + ':' + da.value, g + ':' + aa.value);
        ris.textContent = numero(v) + ' ' + da.value + ' = ' + numero(r) + ' ' + aa.value;
      } catch (e) { ris.textContent = e.message; }
      var tab = F.el('table', { 'class': 'bsiRM-tab' });
      tab.appendChild(F.el('tr', null, [F.el('th', { testo: t('Unità', 'Unit') }), F.el('th', { testo: t('Valore', 'Value') }), F.el('th', { testo: '' })]));
      GRANDEZZE[g].unita.forEach(function (u) {
        var x = converti(v, g + ':' + da.value, g + ':' + u.k);
        var bt = F.el('td'); mini(bt, ['📋', '📋'], function (b) { copia(grezzo(x), b); }).setAttribute('aria-label', t('Copia ', 'Copy ') + u.k);
        tab.appendChild(F.el('tr', null, [F.el('td', { testo: u.k + ' — ' + t(u.nm, u.en) }), F.el('td', { 'class': 'n', testo: numero(x) }), bt]));
      });
      tutte.innerHTML = ''; tutte.appendChild(tab);
    }
    F.bottone(bw, ['⇄ Scambia', '⇄ Swap'], function () { var x = da.value; da.value = aa.value; aa.value = x; calcola(); });
    gsel.addEventListener('change', riempi); da.addEventListener('change', calcola); aa.addEventListener('change', calcola); val.addEventListener('input', calcola);
    riempi();

    /* la riga libera: «3 eV in cm-1», con il controllo delle dimensioni */
    div.appendChild(F.el('div', { 'class': 'bsiRM-sez', testo: t('Scrivi la conversione', 'Type the conversion') }));
    var lib = F.el('input', { type: 'text', value: '1 Eh in eV', 'aria-label': t('Conversione libera, per esempio 1 atm in Pa', 'Free conversion, e.g. 1 atm in Pa') });
    div.appendChild(lib);
    var risL = F.el('div', { 'class': 'bsiRM-ris', 'aria-live': 'polite' }); div.appendChild(risL);
    nota(div, t('Esempi: «1 atm in Pa», «300 K in cm-1», «25 °C in °F», «1 kcal/mol in eV», «1 G in T». Provare «1 eV in m»: le dimensioni non tornano, e lo dice.', 'Examples: “1 atm in Pa”, “300 K in cm-1”, “25 °C in °F”, “1 kcal/mol in eV”, “1 G in T”. Try “1 eV in m”: dimensions do not match, and it says so.'));
    function libera() {
      var m = /^\s*([-+]?[0-9.,]+(?:e[-+]?\d+)?)\s*(\S+)\s+(?:in|to|a|→|->)\s+(\S+)\s*$/i.exec(lib.value);
      if (!m) { risL.textContent = t('Forma attesa: «valore unità in unità».', 'Expected: “value unit in unit”.'); return; }
      try { var r = converti(leggi(m[1]), m[2], m[3]); risL.textContent = m[1] + ' ' + m[2] + ' = ' + numero(r) + ' ' + m[3]; }
      catch (e) { risL.textContent = '⛔ ' + e.message; }
    }
    lib.addEventListener('input', libera); libera();
  }

  F.sezione('sfiscost', {
    titolo: ['🔢 Costanti e unità', '🔢 Constants and units'],
    sotto: ['Le costanti CODATA 2018 con le esatte segnate, da cercare e copiare, e un convertitore di unità che controlla le dimensioni.', 'CODATA 2018 constants with the exact ones flagged, searchable and copyable, and a unit converter with dimensional checks.'],
    schede: [
      { nome: ['🔢 Costanti CODATA', '🔢 CODATA constants'], costruisci: schedaCostanti },
      { nome: ['⇄ Convertitore', '⇄ Converter'], costruisci: schedaConvertitore }
    ]
  });

  /* ── smattavole: tavole matematiche ── */
  function schedaTavola(gruppi, intro) {
    return function (div) {
      stile(); div.classList.add('bsiRM');
      nota(div, tt(intro));
      var barra = F.el('div', { 'class': 'bsiRM-barra' }); div.appendChild(barra);
      var q = campo(barra, ['Cerca nella tavola', 'Search the table'], F.el('input', { type: 'text', placeholder: t('sin, gaussiana, ln…', 'sin, Gaussian, ln…'), 'aria-label': t('Cerca nella tavola', 'Search the table') }));
      var conta = F.el('div', { 'class': 'bsiRM-conta', 'aria-live': 'polite' }); div.appendChild(conta);
      var corpo = F.el('div'); div.appendChild(corpo);
      function rendi() {
        var s = piega(q.value.trim()), n = 0, tot = 0;
        corpo.innerHTML = '';
        gruppi.forEach(function (g) {
          var righe = g.voci.filter(function (v) { tot++; return !s || piega(v.nm[0] + ' ' + v.nm[1] + ' ' + (v.f || '') + ' ' + (v.nota || '') + ' ' + (v.simbolo || '')).indexOf(s) >= 0; });
          if (!righe.length) return;
          corpo.appendChild(F.el('div', { 'class': 'bsiRM-sez', testo: tt(g.tit) + ' · ' + righe.length }));
          var tab = F.el('table', { 'class': 'bsiRM-tab' });
          tab.appendChild(F.el('tr', null, g.col.map(function (c) { return F.el('th', { testo: tt(c) }); })));
          righe.forEach(function (v) { n++; tab.appendChild(F.el('tr', null, g.riga(v))); });
          var w = F.el('div', { 'class': 'bsiRM-tabwrap' }); w.appendChild(tab); corpo.appendChild(w);
        });
        conta.textContent = n + ' / ' + tot + ' ' + t('voci', 'entries');
      }
      q.addEventListener('input', rendi); rendi();
    };
  }
  function rigaStd(v) { return [F.el('td', { testo: tt(v.nm) }), F.el('td', { 'class': 'f', testo: v.f }), F.el('td', { testo: v.nota || '' })]; }
  var COL3 = [['Nome', 'Name'], ['Formula', 'Formula'], ['Note', 'Notes']];
  F.sezione('smattavole', {
    titolo: ['📚 Tavole matematiche', '📚 Mathematical tables'],
    sotto: ['Derivate, integrali, serie, identità, trasformate di Laplace e di Fourier, costanti: le tavole del formulario, da cercare. Ogni formula con un numero dentro è controllata numericamente dal banco.', 'Derivatives, integrals, series, identities, Laplace and Fourier transforms, constants: the formula tables, searchable. Every formula with a number in it is checked numerically by the test bench.'],
    schede: [
      { nome: ['∂ Derivate e integrali', '∂ Derivatives and integrals'], costruisci: schedaTavola([
        { tit: ['Derivate', 'Derivatives'], voci: DERIVATE, col: COL3, riga: rigaStd },
        { tit: ['Integrali', 'Integrals'], voci: INTEGRALI, col: COL3, riga: rigaStd }
      ], ['Le derivate delle funzioni elementari con le regole di derivazione, e gli integrali indefiniti (la costante C è sottintesa dove non scritta) e definiti più usati in fisica e in chimica: gaussiane, funzione Gamma, integrali di Bose e di Fermi.', 'Derivatives of elementary functions with the differentiation rules, and the indefinite and definite integrals most used in physics and chemistry: Gaussians, the Gamma function, Bose and Fermi integrals.']) },
      { nome: ['Σ Serie', 'Σ Series'], costruisci: schedaTavola([
        { tit: ['Serie di Maclaurin e di Taylor', 'Maclaurin and Taylor series'], voci: SERIE, col: [['Funzione', 'Function'], ['Serie', 'Series'], ['Raggio', 'Radius'], ['Note', 'Notes']], riga: function (v) { return [F.el('td', { testo: tt(v.nm) }), F.el('td', { 'class': 'f', testo: v.f }), F.el('td', { 'class': 'n', testo: v.raggio }), F.el('td', { testo: v.nota || '' })]; } }
      ], ['Gli sviluppi in serie di potenze attorno a 0 con il raggio di convergenza R: dentro |x| < R la serie converge assolutamente alla funzione, fuori diverge. Il raggio è la distanza dal centro alla singolarità più vicina nel piano complesso: per questo tan x ha R = π/2 anche se è liscia su tutto ℝ vicino a 0.', 'Power series about 0 with the radius of convergence R: inside |x| < R the series converges absolutely to the function, outside it diverges. R is the distance to the nearest complex singularity: that is why tan x has R = π/2.']) },
      { nome: ['△ Identità', '△ Identities'], costruisci: schedaTavola([
        { tit: ['Identità trigonometriche e iperboliche', 'Trigonometric and hyperbolic identities'], voci: IDENTITA, col: COL3, riga: rigaStd }
      ], ['Le identità di addizione, duplicazione, triplicazione, bisezione, prostaferesi e Werner, e le corrispondenti iperboliche (regola di Osborn: si cambia il segno di ogni prodotto di due seni). Tutte discendono dalla formula di Eulero.', 'Addition, double and triple angle, half angle, sum-to-product and product-to-sum identities, and the hyperbolic ones (Osborn’s rule: flip the sign of every product of two sines). All follow from Euler’s formula.']) },
      { nome: ['ℒ Laplace e Fourier', 'ℒ Laplace and Fourier'], costruisci: schedaTavola([
        { tit: ['Trasformate di Laplace: F(s) = ∫₀^∞ f(t) e^(−st) dt', 'Laplace transforms: F(s) = ∫₀^∞ f(t) e^(−st) dt'], voci: LAPLACE, col: [['Nome', 'Name'], ['f(t)', 'f(t)'], ['F(s)', 'F(s)'], ['Note', 'Notes']], riga: function (v) { return [F.el('td', { testo: tt(v.nm) }), F.el('td', { 'class': 'f', testo: v.ft }), F.el('td', { 'class': 'f', testo: v.Fs }), F.el('td', { testo: v.nota || '' })]; } },
        { tit: ['Trasformate di Fourier: F(ω) = ∫ f(t) e^(−iωt) dt', 'Fourier transforms: F(ω) = ∫ f(t) e^(−iωt) dt'], voci: FOURIER, col: [['Nome', 'Name'], ['f(t)', 'f(t)'], ['F(ω)', 'F(ω)'], ['Note', 'Notes']], riga: function (v) { return [F.el('td', { testo: tt(v.nm) }), F.el('td', { 'class': 'f', testo: v.ft }), F.el('td', { 'class': 'f', testo: v.Fw }), F.el('td', { testo: v.nota || '' })]; } }
      ], ['Le coppie di trasformate più usate per le equazioni differenziali (Laplace, con la regione di convergenza) e per l’analisi dei segnali e degli spettri (Fourier, nella convenzione con la frequenza angolare ω e senza fattori davanti all’integrale; l’antitrasformata ha 1/2π).', 'The most used transform pairs for differential equations (Laplace, with region of convergence) and for signals and spectra (Fourier, angular-frequency convention with no prefactor; the inverse has 1/2π).']) },
      { nome: ['π Costanti', 'π Constants'], costruisci: schedaTavola([
        { tit: ['Costanti matematiche (15 cifre significative)', 'Mathematical constants (15 significant digits)'], voci: COSTANTI_MAT, col: [['Nome', 'Name'], ['Simbolo', 'Symbol'], ['Valore', 'Value'], ['Definizione', 'Definition'], ['', '']], riga: function (v) { var bt = F.el('td'); mini(bt, ['📋', '📋'], function (b) { copia(v.valore, b); }).setAttribute('aria-label', t('Copia ', 'Copy ') + v.simbolo); return [F.el('td', { testo: tt(v.nm) }), F.el('td', { 'class': 'f', testo: v.simbolo }), F.el('td', { 'class': 'n', testo: v.valore }), F.el('td', { testo: v.nota || '' }), bt]; } }
      ], ['Le costanti della matematica a 15 cifre significative, quante ne porta un numero in doppia precisione. Se ne servono di più: DLMF, OEIS o un sistema di calcolo simbolico.', 'Mathematical constants to 15 significant digits, as many as a double-precision number carries. For more: DLMF, OEIS or a computer algebra system.']) }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
