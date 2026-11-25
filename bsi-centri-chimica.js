/* ═══════════════════════════════════════════════════════════════════════════
   bsi-centri-chimica.js — hub per argomento: Biochimica e Farmacologia
   BioSpecInfo · © Samuele Pio Provenzano

   PERCHE' ESISTE (v272)
   Seconda ondata della riorganizzazione per argomento. Con la fabbrica
   bsi-hub.js raccoglie in un'unica voce le sezioni di biochimica (il menù più
   affollato e disordinato: vie metaboliche, biomolecole, strutture 3D, il
   laboratorio) e quelle di farmacologia. I pannelli sono SPOSTATI (una sola
   copia), i pulsanti NASCOSTI ma lasciati nel DOM: navigazione, catalogo,
   teoria e Spectra non cambiano. Le voci non biochimiche che erano finite in
   quel menù (Quantum Studio, Spectra Prime, Inorganica) restano fuori, come
   sezioni a sé, e Arrow Lab e Metodi Fisici stanno già nei loro hub.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica, H = globale.BSIHub;
  if (!F || !H) return;
  var t = F.t;

  /* ── Biochimica ───────────────────────────────────────────────────────── */
  globale.BSICentroBiochimica = H.crea({
    id: 'scentrobiochimica',
    gruppo: 'navGroup2',
    pulsante: ['🧬 Biochimica', '🧬 Biochemistry'],
    titolo: ['🧬 Biochimica', '🧬 Biochemistry'],
    intro: [
      'Dalle biomolecole alle vie del metabolismo, in un posto solo: amminoacidi e strutture, i viewer 3D, il ' +
      'laboratorio, e le vie animate (glicolisi, Krebs, catena respiratoria, β-ossidazione, pentosi fosfati, urea, ' +
      'gluconeogenesi). Le schede sono gli stessi pannelli di prima, <b>spostati</b>, non copiati.',
      'From biomolecules to the pathways of metabolism, in one place: amino acids and structures, the 3D viewers, the ' +
      'lab, and the animated pathways (glycolysis, Krebs, respiratory chain, β-oxidation, pentose phosphate, urea, ' +
      'gluconeogenesis). The tabs are the same panels as before, <b>moved</b>, not copied.'],
    schede: [
      { id: 'saa', ic: '🧬', nm: ['Amminoacidi', 'Amino acids'], nota: t('i venti mattoni', 'the twenty building blocks') },
      { id: 'sbio', ic: '🧫', nm: ['Biomolecole', 'Biomolecules'], nota: t('classi e proprietà', 'classes and properties') },
      { id: 'sbiosyn', ic: '🔬', nm: ['Biosintesi', 'Biosynthesis'], nota: t('come si costruiscono', 'how they are built') },
      { id: 'sstruct', ic: '🧬', nm: ['Strutture 3D', '3D structures'], nota: t('proteine e acidi nucleici', 'proteins and nucleic acids') },
      { id: 'scostruttore', ic: '🧪', nm: ['Costruttore 3D e AR', '3D builder and AR'], nota: t('costruisci una molecola', 'build a molecule') },
      { id: 's3dpro', ic: '🧬', nm: ['Viewer 3D PRO', '3D viewer PRO'], nota: t('dai file PDB', 'from PDB files') },
      { id: 'sglyc', ic: '⚡', nm: ['Metabolismo', 'Metabolism'], nota: t('la mappa d\'insieme', 'the overview map') },
      { id: 'smacro3d', ic: '🧬', nm: ['Macromolecole 3D', '3D macromolecules'], nota: t('proteine, DNA, membrane', 'proteins, DNA, membranes') },
      { id: 'sbiolab3d', ic: '🧬', nm: ['Biochimica 3D Lab', 'Biochemistry 3D Lab'], nota: t('ATP sintasi, enzimi, vie', 'ATP synthase, enzymes, pathways') },
      { id: 'sglic', ic: '🔄', nm: ['Glicolisi', 'Glycolysis'], nota: t('animata, passo per passo', 'animated, step by step') },
      { id: 'skrebs', ic: '♻️', nm: ['Ciclo di Krebs', 'Krebs cycle'], nota: t('il ciclo dell\'acido citrico', 'the citric acid cycle') },
      { id: 'setc', ic: '⚡', nm: ['Catena respiratoria', 'Respiratory chain'], nota: t('fosforilazione ossidativa', 'oxidative phosphorylation') },
      { id: 'sbeta', ic: '🔥', nm: ['β-ossidazione', 'β-oxidation'], nota: t('degradazione degli acidi grassi', 'fatty-acid breakdown') },
      { id: 'sppp', ic: '🔀', nm: ['Pentosi fosfati', 'Pentose phosphate'], nota: t('NADPH e ribosio', 'NADPH and ribose') },
      { id: 'surea', ic: '💧', nm: ['Ciclo dell\'urea', 'Urea cycle'], nota: t('smaltimento dell\'azoto', 'nitrogen disposal') },
      { id: 'sgluco', ic: '🔄', nm: ['Gluconeogenesi', 'Gluconeogenesis'], nota: t('sintesi del glucosio', 'glucose synthesis') },
      { id: 'squizmet', ic: '🧬', nm: ['Quiz vie metaboliche', 'Metabolic-pathway quiz'], nota: t('allenati', 'practise') },
      { id: 'sguidabio', ic: '📚', nm: ['Guida alla biochimica', 'Biochemistry guide'], nota: t('il percorso di studio', 'the study path') }
    ]
  });

  /* ── Farmacologia ─────────────────────────────────────────────────────── */
  globale.BSICentroFarmacologia = H.crea({
    id: 'scentrofarmacologia',
    gruppo: 'navGroup3',
    pulsante: ['💊 Farmacologia', '💊 Pharmacology'],
    titolo: ['💊 Farmacologia', '💊 Pharmacology'],
    intro: [
      'Il farmaco dall\'atlante alla clinica: la banca dati, le interazioni, la farmacocinetica e le sue curve, la ' +
      'farmacologia quantitativa, la fisiologia come sistema, le patologie e i casi clinici. Gli stessi pannelli di ' +
      'prima, <b>spostati</b> in un\'unica schermata, non copiati.',
      'The drug from the atlas to the clinic: the database, interactions, pharmacokinetics and its curves, quantitative ' +
      'pharmacology, physiology as a system, diseases and clinical cases. The same panels as before, <b>moved</b> into ' +
      'one screen, not copied.'],
    schede: [
      { id: 'sfarm', ic: '💊', nm: ['Atlante dei farmaci', 'Drug atlas'], nota: t('banca dati e malattie', 'database and diseases') },
      { id: 'sdint', ic: '⚠️', nm: ['Interazioni', 'Interactions'], nota: t('tra farmaci', 'between drugs') },
      { id: 'spkcalc', ic: '📐', nm: ['Farmacocinetica', 'Pharmacokinetics'], nota: t('dosi e concentrazioni', 'doses and concentrations') },
      { id: 'spkcurve', ic: '📉', nm: ['Curve PK', 'PK curves'], nota: t('assorbimento ed eliminazione', 'absorption and elimination') },
      { id: 'sfarmquant', ic: '💉', nm: ['Farmacologia quantitativa', 'Quantitative pharmacology'], nota: t('dose-risposta, recettori', 'dose-response, receptors') },
      { id: 'smedfisio', ic: '🫀', nm: ['Fisiologia come sistema', 'Physiology as a system'], nota: t('organi e regolazione', 'organs and regulation') },
      { id: 'smorb', ic: '🏥', nm: ['Patologie', 'Diseases'], nota: t('meccanismi e bersagli', 'mechanisms and targets') },
      { id: 'sclinical', ic: '🏥', nm: ['Casi clinici', 'Clinical cases'], nota: t('dalla teoria al paziente', 'from theory to patient') }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
