/* ═══════════════════════════════════════════════════════════════════════════
   bsi-lingue.js — cambiare lingua all'applicazione
   BioSpecInfo · © Samuele Pio Provenzano

   CHE COSA TRADUCE, E CHE COSA NO — DETTO SUBITO

   L'applicazione è scritta in italiano: 48 000 righe, con i testi scientifici
   dentro il codice. Tradurla tutta non è un interruttore, è un lavoro di
   contenuto; prometterlo con un menu a tendina sarebbe una bugia comoda.

   Questo modulo traduce lo SCHELETRO dell'applicazione — i comandi con cui ci
   si muove — e lo dichiara nel pannello:

     · i 89 pulsanti di navigazione
     · i 55 titoli di sezione
     · le voci del menu ✨
     · i pannelli nuovi (lingua e linguaggi molecolari), per intero

   I contenuti scientifici dentro le sezioni restano in italiano. Il pannello
   mostra la copertura MISURATA, non una percentuale dichiarata a mano: conta
   gli elementi tradotti e quelli rimasti, e li elenca.

   COME NON FA DANNI

   Al primo passaggio ogni elemento si porta via l'originale italiano in
   `dataset.bsiIt`. Tornare all'italiano riscrive quello, carattere per
   carattere: non è una ri-traduzione al contrario, che prima o poi sbaglia.
   Le chiavi sono i testi italiani: se un'etichetta italiana cambia, la sua
   traduzione non si trova più e l'elemento resta in italiano — visibile, e la
   copertura scende. Il contrario — una traduzione vecchia incollata su un
   testo nuovo — non si vedrebbe.

   USO   window.BSILingue.imposta('en')   ·   .corrente()   ·   .copertura()
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';

  var CHIAVE_DEPOSITO = 'bsi-lingua';

  var LINGUE = [
    { codice: 'it', nome: 'Italiano', bandiera: '🇮🇹', nativa: true },
    { codice: 'en', nome: 'English',  bandiera: '🇬🇧' }
  ];

  /* ═════════════════════════════════════════════════════════════════════════
     Il dizionario. Chiavi: il testo italiano esatto, come appare.
     ═════════════════════════════════════════════════════════════════════════ */
  var EN = {
    /* ── navigazione ─────────────────────────────────────────────────── */
    '🏠 Dashboard': '🏠 Dashboard',
    '🔍 Molecola': '🔍 Molecule',
    '⬡ Tavola Periodica': '⬡ Periodic Table',
    '🧪 Sintesi Org.': '🧪 Org. Synthesis',
    '🔄 Retrosintesi': '🔄 Retrosynthesis',
    '🎬 Meccanismi': '🎬 Mechanisms',
    '🧮 Proprietà Mol.': '🧮 Mol. Properties',
    '📐 Formule': '📐 Formulas',
    '⚛️ Costanti': '⚛️ Constants',
    '⚗️ Inorganica': '⚗️ Inorganic',
    '🔶 Campo Cristallino': '🔶 Crystal Field',
    '📊 Distribuzioni & Statistica': '📊 Distributions & Statistics',
    '🌌 Meccanica Quantistica': '🌌 Quantum Mechanics',
    '⚖️ Bilancia Rz.': '⚖️ Balance Rxn.',
    '📐 Insaturazioni (DBE)': '📐 Unsaturation (DBE)',
    '📊 Spettri Ref.': '📊 Ref. Spectra',
    '📈 IR Visivi': '📈 Visual IR',
    '⚗️ Spettro MS': '⚗️ MS Spectrum',
    '🔗 NMR 2D/NOE': '🔗 2D NMR/NOE',
    '🌈 UV-Vis': '🌈 UV-Vis',
    '📡 NMR Pred.': '📡 NMR Pred.',
    '🎯 Quiz Spettri': '🎯 Spectra Quiz',
    '🧩 Elucidazione Strutturale': '🧩 Structure Elucidation',
    '🧬 Amminoacidi': '🧬 Amino Acids',
    '🧫 Biomolecole': '🧫 Biomolecules',
    '🔬 Biosintesi': '🔬 Biosynthesis',
    '🧬 Strutture 3D': '🧬 3D Structures',
    '🧬 Viewer 3D PRO': '🧬 3D Viewer PRO',
    '⚡ Metabolismo': '⚡ Metabolism',
    '🧬 Quiz Vie Metab.': '🧬 Metab. Pathways Quiz',
    '🧬 Macromolecole 3D': '🧬 3D Macromolecules',
    '📚 Guida Biochimica': '📚 Biochemistry Guide',
    '🔄 Glicolisi Animata': '🔄 Animated Glycolysis',
    '♻️ Ciclo di Krebs': '♻️ Krebs Cycle',
    '⚡ Catena Respiratoria': '⚡ Respiratory Chain',
    '🔥 β-ossidazione': '🔥 β-oxidation',
    '🔀 Pentosi Fosfati': '🔀 Pentose Phosphate',
    '💧 Ciclo dell’Urea': '💧 Urea Cycle',
    '💧 Ciclo dell\'Urea': '💧 Urea Cycle',
    '🔄 Gluconeogenesi': '🔄 Gluconeogenesis',
    '💊 Farmaci': '💊 Drugs',
    '⚠️ Interazioni': '⚠️ Interactions',
    '📐 Farmacocin.': '📐 Pharmacokin.',
    '📉 Curve PK': '📉 PK Curves',
    '🏥 Casi Clinici': '🏥 Clinical Cases',
    '🏥 Patologie': '🏥 Diseases',
    '🔵 Orbitali MO': '🔵 MO Orbitals',
    '🧪 pKa/Tamponi': '🧪 pKa/Buffers',
    '⚗️ Cinetica Enz.': '⚗️ Enzyme Kinetics',
    '⚡ Elettrochimica': '⚡ Electrochemistry',
    '🔷 VSEPR': '🔷 VSEPR',
    '🔱 Simmetria': '🔱 Symmetry',
    '🧫 Cromatografia': '🧫 Chromatography',
    '📏 Taratura': '📏 Calibration',
    '🧬 Chemioinformatica': '🧬 Cheminformatics',
    '🧪 Titolazione': '🧪 Titration',
    '⏱️ Cinetica': '⏱️ Kinetics',
    '📊 Fasi': '📊 Phases',
    '⚡ Diagrammi E.': '⚡ E. Diagrams',
    '⚗️ Stechiometria': '⚗️ Stoichiometry',
    '🧮 Calc. Avanz.': '🧮 Adv. Calc.',
    '🔢 Calcolatore': '🔢 Calculator',
    '📊 Diagrammi Distribuz.': '📊 Distribution Diagrams',
    '📉 Henderson & Tamponi': '📉 Henderson & Buffers',
    '🌡️ Termodinamica Avanz.': '🌡️ Adv. Thermodynamics',
    '📈 Grafici Interattivi': '📈 Interactive Charts',
    '🗺️ Riassunti': '🗺️ Summaries',
    '❓ Quiz': '❓ Quiz',
    '🎓 Esame UniBA': '🎓 UniBA Exam',
    '📚 Percorsi': '📚 Study Paths',
    '📖 Teoria': '📖 Theory',
    '🃏 Flashcard': '🃏 Flashcards',
    '📖 Guida all’uso': '📖 User Guide',
    '📖 Guida all\'uso': '📖 User Guide',
    '🎓 Biochimica d’esame': '🎓 Exam Biochemistry',
    '🎓 Biochimica d\'esame': '🎓 Exam Biochemistry',
    '⚗️ Inorganica d’esame': '⚗️ Exam Inorganic',
    '⚗️ Inorganica d\'esame': '⚗️ Exam Inorganic',
    'Spectra': 'Spectra',
    '🔬 Laboratorio': '🔬 Laboratory',
    '⚠️ GHS': '⚠️ GHS',
    '🗺️ Mappa Concett.': '🗺️ Concept Map',
    '⚖️ Confronto Mol.': '⚖️ Mol. Comparison',
    '🔬 Cerca Molecole': '🔬 Search Molecules',
    '📖 Atlante Studio': '📖 Study Atlas',
    '🌐 Risorse Web': '🌐 Web Resources',
    '📁 Materiali': '📁 Materials',
    '📝 Note': '📝 Notes',
    '📁 File Manager': '📁 File Manager',
    '📊 Statistiche': '📊 Statistics',
    '✨ Data Science': '✨ Data Science',
    '🍅 Pomodoro': '🍅 Pomodoro',
    '🧪 Calc. Laboratorio': '🧪 Lab Calc.',

    /* ── titoli di sezione ───────────────────────────────────────────── */
    '✨ DATA SCIENCE — dalla chimica ai dati': '✨ DATA SCIENCE — from chemistry to data',
    '🌈 CENTRO SPETTROSCOPICO': '🌈 SPECTROSCOPY CENTRE',
    '🎯 QUIZ SPETTRI — Riconosci il gruppo funzionale':
      '🎯 SPECTRA QUIZ — Identify the functional group',
    '🧬 QUIZ VIE METABOLICHE — Enzimi e tappe':
      '🧬 METABOLIC PATHWAYS QUIZ — Enzymes and steps',
    '📐 GRADI DI INSATURAZIONE (DBE)': '📐 DEGREES OF UNSATURATION (DBE)',
    '📊 DIAGRAMMI DI DISTRIBUZIONE': '📊 DISTRIBUTION DIAGRAMS',
    '🧪 CALCOLATORE DI LABORATORIO': '🧪 LABORATORY CALCULATOR',
    '📉 HENDERSON-HASSELBALCH & TAMPONI': '📉 HENDERSON-HASSELBALCH & BUFFERS',
    '🌡️ TERMODINAMICA AVANZATA': '🌡️ ADVANCED THERMODYNAMICS',
    '📖 GUIDA ALL’USO — BioSpecInfo v99': '📖 USER GUIDE — BioSpecInfo v99',
    '📖 GUIDA ALL\'USO — BioSpecInfo v99': '📖 USER GUIDE — BioSpecInfo v99',
    '🧬 MACROMOLECOLE 3D': '🧬 3D MACROMOLECULES',
    '📚 GUIDA BIOCHIMICA': '📚 BIOCHEMISTRY GUIDE',
    '🎓 BIOCHIMICA D’ESAME': '🎓 EXAM BIOCHEMISTRY',
    '🎓 BIOCHIMICA D\'ESAME': '🎓 EXAM BIOCHEMISTRY',
    '⚗️ CHIMICA INORGANICA D’ESAME': '⚗️ EXAM INORGANIC CHEMISTRY',
    '⚗️ CHIMICA INORGANICA D\'ESAME': '⚗️ EXAM INORGANIC CHEMISTRY',
    'SINTESI ORGANICA · 170+ REAZIONI · MECCANISMO ANIMATO · FRECCE ELETTRONI':
      'ORGANIC SYNTHESIS · 170+ REACTIONS · ANIMATED MECHANISM · ELECTRON ARROWS',
    'DATABASE SINTESI ONLINE': 'ONLINE SYNTHESIS DATABASE',
    'TAVOLA PERIODICA INTERATTIVA — clicca un elemento per tutti i dettagli':
      'INTERACTIVE PERIODIC TABLE — click an element for the full details',
    '🧬 AMMINOACIDI STANDARD — I 20 Proteinogenici':
      '🧬 STANDARD AMINO ACIDS — The 20 Proteinogenic Ones',
    '📊 TABELLE SPETTROSCOPICHE DI RIFERIMENTO': '📊 REFERENCE SPECTROSCOPIC TABLES',
    '🧍 ATLANTE 3D — DOVE AGISCONO I FARMACI': '🧍 3D ATLAS — WHERE DRUGS ACT',
    '💊 FARMACI PER CATEGORIA TERAPEUTICA': '💊 DRUGS BY THERAPEUTIC CATEGORY',
    '🔢 CALCOLATORE CHIMICO': '🔢 CHEMICAL CALCULATOR',
    '🧫 BIOMOLECOLE — Monosaccaridi · Polisaccaridi · Lipidi · Proteine · Nucleotidi':
      '🧫 BIOMOLECULES — Monosaccharides · Polysaccharides · Lipids · Proteins · Nucleotides',
    '🔬 SINTESI BIOLOGICHE — Meccanismi con frecce elettroniche':
      '🔬 BIOLOGICAL SYNTHESES — Mechanisms with electron arrows',
    '🧬 STRUTTURE BIOLOGICHE INTERATTIVE': '🧬 INTERACTIVE BIOLOGICAL STRUCTURES',
    '📐 FORMULE — Chimica Fisica · Termodinamica · Statistica · Inorganica':
      '📐 FORMULAS — Physical Chemistry · Thermodynamics · Statistics · Inorganic',
    '🔄 RETROSINTESI': '🔄 RETROSYNTHESIS',
    '📈 SPETTRI IR VISIVI — Gruppi Funzionali': '📈 VISUAL IR SPECTRA — Functional Groups',
    '⚗️ SPETTRO DI MASSA — Frammentazione': '⚗️ MASS SPECTRUM — Fragmentation',
    '⚡ VIE METABOLICHE ANIMATE': '⚡ ANIMATED METABOLIC PATHWAYS',
    '🔵 DIAGRAMMI DEGLI ORBITALI MOLECOLARI': '🔵 MOLECULAR ORBITAL DIAGRAMS',
    '🧪 pKa & TAMPONI — Henderson-Hasselbalch': '🧪 pKa & BUFFERS — Henderson-Hasselbalch',
    '⚠️ CHECKER INTERAZIONI FARMACOLOGICHE': '⚠️ DRUG INTERACTION CHECKER',
    '📐 CALCOLATORE FARMACOCINETICO': '📐 PHARMACOKINETIC CALCULATOR',
    '🏥 CASI CLINICI — Diagnosi e Terapia': '🏥 CLINICAL CASES — Diagnosis and Therapy',
    '🔗 NOE & NMR 2D — Correlazioni Spaziali': '🔗 NOE & 2D NMR — Spatial Correlations',
    '🌈 UV-VIS — Spettroscopia Elettronica': '🌈 UV-VIS — Electronic Spectroscopy',
    '🔷 VSEPR — Geometrie Molecolari': '🔷 VSEPR — Molecular Geometries',
    '🔱 SIMMETRIA MOLECOLARE — Gruppi puntuali e regole di selezione':
      '🔱 MOLECULAR SYMMETRY — Point groups and selection rules',
    '📋 Tavole dei caratteri': '📋 Character tables',
    '🔬 Dalla simmetria allo spettro': '🔬 From symmetry to the spectrum',
    '🧫 CROMATOGRAFIA — Separazione, efficienza, risoluzione':
      '🧫 CHROMATOGRAPHY — Separation, efficiency, resolution',
    '🔍 Che cosa allarga un picco': '🔍 What broadens a peak',
    '📐 Le grandezze e che cosa significano': '📐 The quantities and what they mean',
    '⚖️ Gascromatografia e HPLC — quando l’una, quando l’altra':
      '⚖️ Gas chromatography and HPLC — when each one',
    '⚖️ Gascromatografia e HPLC — quando l\'una, quando l\'altra':
      '⚖️ Gas chromatography and HPLC — when each one',
    '🩺 Il picco è storto: che cosa sta succedendo':
      '🩺 The peak is skewed: what is going on',
    '🧬 BANCO DI LAVORO CHEMIOINFORMATICO': '🧬 CHEMINFORMATICS WORKBENCH',
    '📏 TARATURA E INCERTEZZA — Dal segnale al numero, con il suo errore':
      '📏 CALIBRATION AND UNCERTAINTY — From signal to number, with its error',
    'Limiti di rivelabilità': 'Limits of detection',
    '⚗️ CINETICA ENZIMATICA — Michaelis-Menten': '⚗️ ENZYME KINETICS — Michaelis-Menten',
    '⚡ ELETTROCHIMICA — Equazione di Nernst': '⚡ ELECTROCHEMISTRY — Nernst Equation',
    '📁 MATERIALI DIDATTICI — Schede, Tabelle e Risorse Scaricabili':
      '📁 TEACHING MATERIALS — Sheets, Tables and Downloadable Resources',
    '🔬 CERCA MOLECOLE — Database Universale': '🔬 SEARCH MOLECULES — Universal Database',
    'BENVENUTO IN BIOSPECINFO': 'WELCOME TO BIOSPECINFO',

    /* ── menu ✨ ─────────────────────────────────────────────────────── */
    'Sintesi & Retrosintesi': 'Synthesis & Retrosynthesis',
    'Esporta figure (PNG/SVG)': 'Export figures (PNG/SVG)',
    'Sfida spettroscopica': 'Spectroscopy challenge',
    'Glossario chimico': 'Chemical glossary',
    'Costanti di accoppiamento J': 'J coupling constants',
    'Stampa pagina corrente': 'Print current page',
    'Orbitali Atomici 3D': '3D Atomic Orbitals',
    'Tossicologia & Antidoti': 'Toxicology & Antidotes',
    'Sostieni il progetto': 'Support the project',
    'Guida al sito': 'Site guide',
    'Condividi app': 'Share app',
    'Scarica BioSpecInfo': 'Download BioSpecInfo',
    'Aggiungi a Home': 'Add to Home Screen',
    'Aggiornamenti': 'Updates',
    'Lingua': 'Language',
    'Linguaggi delle molecole': 'Molecular languages'
  };

  var DIZIONARI = { en: EN };

  /* ═════════════════════════════════════════════════════════════════════════
     Applicare e togliere
     ═════════════════════════════════════════════════════════════════════════ */

  var corrente = 'it';

  /* Gli elementi che fanno parte dello «scheletro»: quelli e non altri. */
  function raccogli() {
    var gruppi = [];
    gruppi.push({ famiglia: 'navigazione',
                  nodi: [].slice.call(document.querySelectorAll('.nav-btn[data-s]')) });
    gruppi.push({ famiglia: 'titoli',
                  nodi: [].slice.call(document.querySelectorAll('.section-title')) });
    /* le voci del menu ✨ sono due span: l'icona e il testo. Si tocca il testo. */
    var voci = [];
    [].forEach.call(document.querySelectorAll('#bsi105-menu .bsi105-mi'), function (mi) {
      var span = mi.querySelector('span:last-child');
      if (span && span !== mi.querySelector('span.ic')) voci.push(span);
    });
    gruppi.push({ famiglia: 'menu', nodi: voci });
    /* I pannelli nuovi non si traducono sostituendo testo: si ridisegnano
       direttamente nella lingua scelta. La famiglia esiste per chi volesse
       marcare elementi con data-bsi-t, e non si mostra se è vuota: una riga
       «0 su 0» in un rapporto di copertura è rumore che somiglia a un difetto. */
    var marcati = [].slice.call(document.querySelectorAll('[data-bsi-t]'));
    if (marcati.length) gruppi.push({ famiglia: 'marcati', nodi: marcati });
    return gruppi;
  }

  function testoDi(el) {
    return (el.getAttribute('data-bsi-t') != null)
      ? el.getAttribute('data-bsi-t')
      : (el.textContent || '').trim();
  }

  function imposta(codice, opzioni) {
    opzioni = opzioni || {};
    if (codice !== 'it' && !DIZIONARI[codice]) codice = 'it';
    var diz = DIZIONARI[codice] || null;
    var gruppi = raccogli();
    var rapporto = { lingua: codice, totali: 0, tradotti: 0, restati: [], perFamiglia: {} };

    gruppi.forEach(function (g) {
      var t = 0, n = 0;
      g.nodi.forEach(function (el) {
        /* l'originale si conserva al primo passaggio, e non si riscrive mai */
        if (el.dataset.bsiIt == null) el.dataset.bsiIt = (el.textContent || '').trim();
        var it = el.dataset.bsiIt;
        n++;
        if (codice === 'it') { el.textContent = it; t++; return; }
        var chiave = (el.getAttribute('data-bsi-t') != null)
          ? el.getAttribute('data-bsi-t') : it;
        var tr = diz[chiave];
        if (tr == null) tr = diz[it];
        if (tr != null) { el.textContent = tr; t++; }
        else { el.textContent = it; rapporto.restati.push(g.famiglia + ': ' + it.slice(0, 44)); }
      });
      rapporto.perFamiglia[g.famiglia] = { totali: n, tradotti: t };
      rapporto.totali += n; rapporto.tradotti += t;
    });

    corrente = codice;
    document.documentElement.setAttribute('lang', codice);
    try { localStorage.setItem(CHIAVE_DEPOSITO, codice); } catch (e) {}
    if (!opzioni.silenzioso) {
      try {
        document.dispatchEvent(new CustomEvent('bsi-lingua', { detail: { lingua: codice } }));
      } catch (e) {
        /* i browser che non hanno CustomEvent non devono far cadere il resto */
      }
    }
    ultimoRapporto = rapporto;
    return rapporto;
  }

  var ultimoRapporto = null;

  function copertura() {
    return ultimoRapporto || imposta(corrente, { silenzioso: true });
  }

  function lingueDisponibili() { return LINGUE.slice(); }

  function traduci(testo, codice) {
    codice = codice || corrente;
    if (codice === 'it') return testo;
    var d = DIZIONARI[codice];
    return (d && d[testo] != null) ? d[testo] : testo;
  }

  /* Un modulo che aggiunge interfaccia può registrare le proprie stringhe. */
  function registra(codice, voci) {
    if (!DIZIONARI[codice]) DIZIONARI[codice] = {};
    Object.keys(voci || {}).forEach(function (k) { DIZIONARI[codice][k] = voci[k]; });
  }

  function salvata() {
    try { return localStorage.getItem(CHIAVE_DEPOSITO) || 'it'; } catch (e) { return 'it'; }
  }

  globale.BSILingue = {
    imposta: imposta,
    corrente: function () { return corrente; },
    copertura: copertura,
    lingue: lingueDisponibili,
    traduci: traduci,
    registra: registra,
    salvata: salvata,
    versione: '1.0'
  };

  /* All'avvio si riapplica la scelta, se c'era. L'attesa serve perché i
     pulsanti e i titoli vengono costruiti da patch successivi. */
  function allAvvio() {
    var l = salvata();
    if (l && l !== 'it') setTimeout(function () { imposta(l); }, 1200);
  }
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', allAvvio);
  else allAvvio();

})(typeof window !== 'undefined' ? window : globalThis);
