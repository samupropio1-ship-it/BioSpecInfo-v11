/* ═══════════════════════════════════════════════════════════════════════════
   bsi-metodi-fisici.js — 📐 Metodi Fisici in Chimica Organica: teoria delle
   slide, calcoli fondamentali e risolutore delle tracce d'esame.
   BioSpecInfo · © Samuele Pio Provenzano

   PERCHE' ESISTE (v270)
   Richiesta dell'autore: integrare nel sistema unificato la teoria completa
   delle dispense del corso (Metodi Fisici in Chimica Organica — principi di
   IR, NMR, MS, UV-Vis) assieme al Silverstein, al catalogo delle tracce
   d'esame e al risolutore, mantenendo UNA SOLA base di conoscenza, senza
   duplicazioni.

   UNA SOLA BASE DI CONOSCENZA (niente duplicati)
   L'app contiene già quasi tutto il sapere strumentale, in moduli puliti:
     · bande IR .............. IR_DATA (index.html) e BSILettoreSpettri.BANDE_IR
     · tabelle NMR (Silverstein/Pretsch) .. window.BSIPretsch e window.BSINMR
     · δ regioni ¹H/¹³C ...... BSIElucida.INTERVALLI_C / INTERVALLI_H
     · Larmor + ppm↔Hz ....... motore «nmr» di Quantum Studio
     · frammentazione MS ..... MS_DATA e BSIElucida (perdite, M+1, M+2)
     · Woodward (tabella) .... UV_DATA.woodward
     · IHD / DBE ............. BSIElucida.insaturazioni
     · risolutore tracce ..... BSIQuesito.svolgi → BSIElucida.dossier
   Questo modulo NON ricopia quelle tabelle: aggiunge solo i pezzi che
   mancavano davvero (legge di Hooke numerica, regole di Woodward-Fieser in
   forma di calcolo, equazione di Karplus, conversione ppm↔Hz, regola
   dell'azoto) e il collante — i concetti delle slide e il catalogo delle
   tracce — e per risolvere DELEGA ai motori esistenti.

   ONESTA'
   · I calcoli di Hooke e Woodward-Fieser sono MODELLI (oscillatore armonico,
     regole additive empiriche): danno stime, non misure. Sono etichettati.
   · Il catalogo riporta data, formula e note reali degli appelli; dove non
     possiedo lo spettro completo lo dico, e invito a incollarlo o a caricarlo
     dal file manager. Gli esempi con spettro completo sono marcati come
     dati illustrativi.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, tt = F.tt;

  /* ═══ 1. DATI NUOVI (non presenti altrove) ════════════════════════════════ */

  /* masse nominali per la massa ridotta dell'oscillatore (solo per Hooke) */
  var MASSE = { C: 12, H: 1, D: 2, N: 14, O: 16, F: 19, P: 31, S: 32, Cl: 35, Br: 79, I: 127 };

  /* costanti di forza tipiche k (N/m) — dalle slide di teoria IR.
     [etichetta, atomo1, atomo2, k, nota] */
  var LEGAMI = [
    ['C–H', 'C', 'H', 500, ['stretching sp³ ~2850–2960', 'sp³ stretch ~2850–2960']],
    ['C–D', 'C', 'D', 500, ['stessa k, massa doppia → ~1/1,36', 'same k, double mass → ~1/1.36']],
    ['O–H', 'O', 'H', 700, ['3200–3650, allargato dal legame H', '3200–3650, H-bond broadened']],
    ['N–H', 'N', 'H', 640, ['3300–3500', '3300–3500']],
    ['C–C', 'C', 'C', 450, ['singolo', 'single']],
    ['C=C', 'C', 'C', 960, ['doppio', 'double']],
    ['C≡C', 'C', 'C', 1560, ['triplo', 'triple']],
    ['C=O', 'C', 'O', 1210, ['1680–1750 secondo l\'intorno', '1680–1750 by environment']],
    ['C≡N', 'C', 'N', 1770, ['nitrile ~2210–2260', 'nitrile ~2210–2260']]
  ];

  /* regole di Woodward-Fieser in forma numerica (le slide le danno a tabella;
     UV_DATA.woodward le mostra come testo — qui diventano un calcolo) */
  var WF = {
    diene: {
      basi: { eteroanulare: 214, aciclico: 217, omoanulare: 253 },
      incrementi: {
        doppio_esteso: 30, sost_alchilico: 5, doppio_esociclico: 5,
        OR: 6, SR: 30, Cl_Br: 5, NR2: 60
      }
    },
    enone: {
      basi: { sei_o_aciclico: 215, cinque: 202 },
      incrementi: {
        doppio_esteso: 30, doppio_esociclico: 5,
        alfa_R: 10, beta_R: 12, gamma_delta_R: 18,
        alfa_OH: 35, beta_OH: 30, alfa_OR: 35, beta_OR: 30, delta_OR: 31, beta_NR2: 95
      }
    }
  };

  /* concetti delle slide (sintesi bilingue, per consultazione e spiegazione) */
  var SLIDE = {
    IR: {
      titolo: ['IR — legge di Hooke', 'IR — Hooke\'s law'],
      punti: [
        ['ν̃ = (1/2πc)·√(k/μ): il numero d\'onda cresce con l\'ordine di legame (k) e cala con la massa ridotta μ = m₁m₂/(m₁+m₂).',
         'ν̃ = (1/2πc)·√(k/μ): wavenumber rises with bond order (k) and falls with reduced mass μ = m₁m₂/(m₁+m₂).'],
        ['Effetto isotopico: C–H → C–D abbassa ν̃ di ~1,36 (solo μ cambia).',
         'Isotope effect: C–H → C–D lowers ν̃ by ~1.36 (only μ changes).'],
        ['Coniugazione: abbassa k del C=O (−20/−30 cm⁻¹); effetto induttivo −I (esteri, alogenuri acilici): alza il C=O.',
         'Conjugation lowers the C=O k (−20/−30 cm⁻¹); −I induction (esters, acyl halides) raises C=O.'],
        ['Legame H intermolecolare: allarga e abbassa O–H; in CCl₄ diluito torna il picco stretto ~3600 cm⁻¹.',
         'Intermolecular H-bonding broadens and lowers O–H; diluted in CCl₄ the sharp ~3600 cm⁻¹ peak returns.']
      ]
    },
    UV: {
      titolo: ['UV-Vis — transizioni e Woodward', 'UV-Vis — transitions & Woodward'],
      punti: [
        ['π→π*: permessa, ε ~10⁴, batocroma per coniugazione e solventi polari.',
         'π→π*: allowed, ε ~10⁴, bathochromic with conjugation and polar solvents.'],
        ['n→π*: proibita per simmetria, ε ~10–100, ipsocroma in solventi polari protici.',
         'n→π*: symmetry-forbidden, ε ~10–100, hypsochromic in polar protic solvents.'],
        ['Woodward-Fieser: λmax da una base (diene o enone) più incrementi additivi per sostituenti e doppi legami estesi.',
         'Woodward-Fieser: λmax from a base (diene or enone) plus additive increments for substituents and extended double bonds.']
      ]
    },
    NMR: {
      titolo: ['NMR — Larmor, δ↔Hz, Karplus, anisotropia', 'NMR — Larmor, δ↔Hz, Karplus, anisotropy'],
      punti: [
        ['Larmor: ν₀ = γB₀/2π (¹H: 42,577 MHz/T). δ(ppm) è indipendente dal campo; la separazione in Hz = δ·ν₀ scala con B₀.',
         'Larmor: ν₀ = γB₀/2π (¹H: 42.577 MHz/T). δ(ppm) is field-independent; the Hz separation = δ·ν₀ scales with B₀.'],
        ['Karplus: ³J(φ) = A + B·cosφ + C·cos2φ — massima a 0° e 180°, minima a ~90°.',
         'Karplus: ³J(φ) = A + B·cosφ + C·cos2φ — maximal at 0° and 180°, minimal near 90°.'],
        ['Anisotropia: l\'anello aromatico descherma (7–8,5 ppm), il C=O descherma l\'aldeidico (9–10), il C≡C scherma (≡C–H ~2–3).',
         'Anisotropy: the aromatic ring deshields (7–8.5 ppm), C=O deshields the aldehyde H (9–10), C≡C shields (≡C–H ~2–3).'],
        ['APT/DEPT-135: CH₃ e CH positivi, CH₂ negativi, C quaternari assenti (DEPT).',
         'APT/DEPT-135: CH₃ and CH positive, CH₂ negative, quaternary C absent (DEPT).']
      ]
    },
    MS: {
      titolo: ['MS — regola dell\'azoto e frammentazione', 'MS — nitrogen rule & fragmentation'],
      punti: [
        ['Regola dell\'azoto: M⁺ a massa nominale dispari ⇒ numero dispari di N (con C,H,O,S,alogeni).',
         'Nitrogen rule: odd nominal M⁺ ⇒ odd number of N (with C,H,O,S,halogens).'],
        ['Stevenson: nella scissione di [A–B]⁺• la carica resta sul frammento a minore energia di ionizzazione.',
         'Stevenson: in [A–B]⁺• cleavage the charge stays on the lower-ionization-energy fragment.'],
        ['McLafferty: trasferimento di un H in γ su un insaturo (C=O, C=N, arile) via stato a 6 termini, con perdita di un\'olefina neutra.',
         'McLafferty: γ-H transfer onto an unsaturated centre (C=O, C=N, aryl) through a 6-membered state, losing a neutral olefin.']
      ]
    }
  };

  /* catalogo delle tracce d'esame (dati reali degli appelli: data, formula,
     note). I campi `prosa` sono scritti in una forma che BSIQuesito sa leggere;
     dove manca lo spettro completo lo diciamo. `illustrativa:true` = spettro
     didattico rappresentativo, non la traccia originale. */
  var CATALOGO = [
    { data: '27/02/2023', formula: 'C8H7NO', illustrativa: true,
      note: ['IHD = 6; con APT (C/CH₂ vs CH/CH₃). Spettro illustrativo coerente con un\'ammide aromatica.',
             'DBE = 6; with APT. Illustrative spectrum consistent with an aromatic amide.'],
      prosa: 'C8H7NO. IR: 3300 cm-1 (N-H); 1680 cm-1 forte (C=O ammide); 1600 cm-1 (aromatico). 1H NMR: 7.5 (5H, m); 6.2 (2H, s, D2O). MS: m/z=133 (M+); m/z=105; m/z=77.' },
    { data: '03/02/2023', formula: 'C7H7NO2', illustrativa: true,
      note: ['Stima δ, molteplicità e J dello stireneossido / nitro-aromatico; IHD = 5.',
             'Estimate δ, multiplicity and J; DBE = 5.'],
      prosa: 'C7H7NO2. IR: 1520 cm-1 (NO2 asimm.); 1350 cm-1 (NO2 simm.); 1600 cm-1 (aromatico). 1H NMR: 8.1 (2H, d); 7.4 (2H, d); 2.4 (3H, s). MS: m/z=137 (M+); m/z=120; m/z=91.' },
    { data: '23/03/2023', formula: 'C17H18O3',
      note: ['Frammento m/z = 30 (100%) da ammide + stereoisomeri E/Z dell\'epossido del cinnamato d\'etile. Spettro completo da incollare.',
             'm/z = 30 (100%) from amide + E/Z epoxide of ethyl cinnamate. Paste the full spectrum.'],
      prosa: 'C17H18O3. MS: m/z=30 (100%).' },
    { data: '14/04/2023', formula: 'C12H16O3',
      note: ['Frammentazione EI-MS della N-isobutil-2-butanammina (m/z 129, 114, 86, 72, 57, 30) + segnali ¹H del tetraidropirano. Spettro completo da incollare.',
             'EI-MS of N-isobutyl-2-butanamine (m/z 129, 114, 86, 72, 57, 30) + THP ¹H signals. Paste the full spectrum.'],
      prosa: 'C12H16O3. MS: m/z=129; m/z=114; m/z=86; m/z=72; m/z=57; m/z=30.' },
    { data: '26/05/2023', formula: 'C11H12S',
      note: ['McLafferty m/z = 122 sul benzoato di n-butile + diastereoisomeri dell\'1,3-difenilpropan-1,3-diolo. Spettro completo da incollare.',
             'McLafferty m/z = 122 on n-butyl benzoate + diastereomers of 1,3-diphenylpropane-1,3-diol. Paste the full spectrum.'],
      prosa: 'C11H12S. MS: m/z=122.' },
    { data: '23/11/2023', formula: 'C6H10O2', illustrativa: true,
      note: ['IR a diverse concentrazioni (film, 0,07 M, 0,05 M in CCl₄): il legame H del fenilciclobutanolo si vede sparire con la diluizione. IHD = 2.',
             'IR at different concentrations: H-bonding vanishes on dilution. DBE = 2.'],
      prosa: 'C6H10O2. IR: 3400 cm-1 largo (O-H legato); 1715 cm-1 (C=O). 1H NMR: 2.5 (1H, s, D2O); 2.1 (3H, s). MS: m/z=114 (M+); m/z=99; m/z=43.' },
    { data: '14/09/2023', formula: 'C12H17NO2',
      note: ['Miscela α/β-glucopiranosio in D₂O + C₇H₇NO. Spettro completo da incollare.',
             'α/β-glucopyranose mixture in D₂O + C₇H₇NO. Paste the full spectrum.'],
      prosa: 'C12H17NO2.' },
    { data: '19/06/2023', formula: 'C13H18O2',
      note: ['Regioisomero del dicloronitrobenzene da ¹H NMR. Spettro completo da incollare.',
             'Dichloronitrobenzene regioisomer from ¹H NMR. Paste the full spectrum.'],
      prosa: 'C13H18O2.' }
  ];

  /* ═══ 2. CALCOLATORI (i pezzi che mancavano) ══════════════════════════════ */
  var C_LUCE = 2.99792458e10;   /* cm/s */
  var UMA = 1.660539e-27;       /* kg */
  var GAMMA_H = 42.577;         /* MHz/T, ¹H */

  function trovaLegame(etich) { for (var i = 0; i < LEGAMI.length; i++) if (LEGAMI[i][0] === etich) return LEGAMI[i]; return null; }

  /** Legge di Hooke: numero d'onda di stretching (cm⁻¹). */
  function hooke(etich) {
    var L = trovaLegame(etich); if (!L) return null;
    var m1 = MASSE[L[1]], m2 = MASSE[L[2]], k = L[3];
    var muAmu = (m1 * m2) / (m1 + m2), muKg = muAmu * UMA;
    var nu = (1 / (2 * Math.PI * C_LUCE)) * Math.sqrt(k / muKg);
    return { legame: etich, muAmu: Math.round(muAmu * 1e4) / 1e4, k: k, cm1: Math.round(nu * 10) / 10 };
  }

  /** Woodward-Fieser: λmax (nm) = base + Σ incrementi. */
  function woodward(sistema, base, incrementi) {
    var S = WF[sistema]; if (!S || !(base in S.basi)) return null;
    var tab = S.incrementi, tot = 0, usati = [];
    (incrementi || []).forEach(function (k) { if (k in tab) { tot += tab[k]; usati.push([k, tab[k]]); } });
    return { sistema: sistema, base: S.basi[base], incrementi: tot, usati: usati, lambdaMax: S.basi[base] + tot };
  }

  /** Conversione δ(ppm) ↔ Δν(Hz) a una data frequenza di spettrometro (MHz). */
  function ppmHz(o) {
    o = o || {}; var mhz = o.mhz || 400;
    if (o.ppm != null) return { ppm: o.ppm, hz: Math.round(o.ppm * mhz * 100) / 100, mhz: mhz };
    if (o.hz != null) return { ppm: Math.round(o.hz / mhz * 1e4) / 1e4, hz: o.hz, mhz: mhz };
    return null;
  }

  /** Equazione di Karplus: ³J (Hz) dall'angolo diedro φ (gradi). */
  function karplus(phi, a, b, c) {
    a = a == null ? 7 : a; b = b == null ? -1 : b; c = c == null ? 5 : c;
    var r = phi * Math.PI / 180;
    return { phi: phi, J: Math.round((a + b * Math.cos(r) + c * Math.cos(2 * r)) * 100) / 100 };
  }

  /** Larmor: frequenza di risonanza ¹H (MHz) a campo B₀ (T). */
  function larmor(b0) { return { b0: b0, mhz: Math.round(GAMMA_H * b0 * 100) / 100 }; }

  /** Regola dell'azoto: massa nominale dispari ⇒ numero dispari di N. */
  function regolaAzoto(massaNominale) {
    var dispari = (Math.round(massaNominale) % 2) !== 0;
    return { massaNominale: Math.round(massaNominale), dispari: dispari,
      interpretazione: dispari
        ? t('massa dispari ⇒ numero dispari di atomi di azoto', 'odd mass ⇒ odd number of nitrogen atoms')
        : t('massa pari ⇒ zero o un numero pari di atomi di azoto', 'even mass ⇒ zero or an even number of nitrogen atoms') };
  }

  /** Risolutore tracce: DELEGA al motore esistente (una sola base di conoscenza). */
  function risolviTraccia(testo) {
    if (globale.BSIQuesito && globale.BSIQuesito.svolgi) return globale.BSIQuesito.svolgi(testo);
    return { dati: null, dossier: null, avvisi: [t('il risolutore delle tracce non è caricato', 'the trace solver is not loaded')] };
  }

  /* registro per i banchi e per gli altri moduli */
  F.calcolo.metodi = {
    MASSE: MASSE, LEGAMI: LEGAMI, WF: WF, SLIDE: SLIDE, CATALOGO: CATALOGO,
    hooke: hooke, woodward: woodward, ppmHz: ppmHz, karplus: karplus, larmor: larmor,
    regolaAzoto: regolaAzoto, risolviTraccia: risolviTraccia
  };
  globale.BSIMetodi = F.calcolo.metodi;

  /* ═══ 3. STILE (contrasto WCAG AA: testo chiaro su fondo scuro) ════════════ */
  (function () {
    if (typeof document === 'undefined' || document.getElementById('bsiMF-css')) return;
    var s = document.createElement('style'); s.id = 'bsiMF-css';
    s.textContent =
      '.bsiMF-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;margin:8px 0}' +
      '.bsiMF-card{background:#0d1b2c;border:1px solid #1e3a55;border-radius:10px;padding:11px 13px}' +
      '.bsiMF-card h4{margin:0 0 6px;color:#5eead4;font-size:13.5px}' +
      '.bsiMF-card li{color:#dbe7f3;font-size:12px;line-height:1.5;margin:3px 0}' +
      '.bsiMF-ris{background:#07263a;border:1px solid #2a6f7a;border-radius:10px;padding:10px 13px;margin-top:8px;color:#eaf6fb;font-size:13px}' +
      '.bsiMF-ris b{color:#5eead4}' +
      '.bsiMF-tag{display:inline-block;font-size:10px;font-weight:700;letter-spacing:.04em;padding:2px 7px;border-radius:99px;background:#1e3a55;color:#a7c6e0;margin-left:6px}' +
      '.bsiMF-tag.mod{background:#3b2f10;color:#f0d08a}' +
      '.bsiMF-ded{width:100%;border-collapse:collapse;margin-top:6px;font-size:12px}' +
      '.bsiMF-ded th,.bsiMF-ded td{border:1px solid #244056;padding:5px 7px;text-align:left;color:#dbe7f3;vertical-align:top}' +
      '.bsiMF-ded th{background:#0d1b2c;color:#9fd8e6}' +
      '.bsiMF-txt{width:100%;min-height:120px;background:#0b1623;color:#eaf1f8;border:1px solid #2a4663;border-radius:8px;padding:9px;font-size:12.5px;font-family:ui-monospace,Menlo,Consolas,monospace}' +
      '.bsiMF-avv{color:#f0d08a;font-size:12px;margin:5px 0;line-height:1.5}';
    (document.head || document.documentElement).appendChild(s);
  })();

  function card(titoloPair, punti, tag) {
    var c = F.el('div', { 'class': 'bsiMF-card' });
    var h = F.el('h4', { testo: tt(titoloPair) });
    if (tag) h.appendChild(F.el('span', { 'class': 'bsiMF-tag mod', testo: tag }));
    c.appendChild(h);
    var ul = F.el('ul', { style: 'margin:0;padding-left:16px' });
    punti.forEach(function (p) { ul.appendChild(F.el('li', { testo: tt(p) })); });
    c.appendChild(ul); return c;
  }

  /* ═══ 4. SCHEDA — Teoria e calcoli ════════════════════════════════════════ */
  function schedaTeoria(div) {
    /* concetti delle slide */
    var intro = F.el('div', { 'class': 'bsiFX-nota' });
    intro.innerHTML = t(
      'I principi delle dispense del corso, con i calcoli fondamentali. Le stime sono <b>modelli</b> (oscillatore armonico, regole additive): utili a capire, non misure.',
      'The course-notes principles, with the fundamental calculations. Estimates are <b>models</b> (harmonic oscillator, additive rules): useful to understand, not measurements.');
    div.appendChild(intro);
    var cards = F.el('div', { 'class': 'bsiMF-cards' });
    ['IR', 'UV', 'NMR', 'MS'].forEach(function (k) { cards.appendChild(card(SLIDE[k].titolo, SLIDE[k].punti)); });
    div.appendChild(cards);

    /* ── calcolatore Hooke ── */
    var gH = F.el('div', { 'class': 'bsiFX-pannello' });
    gH.appendChild(F.el('h4', { style: 'margin:4px 0;color:#5eead4', testo: tt(['Legge di Hooke — ν̃ di stretching', 'Hooke\'s law — stretching ν̃']) }));
    var legame = 'C–H', risH = F.el('div', { 'class': 'bsiMF-ris' });
    F.scelta(gH, ['Legame', 'Bond'], LEGAMI.map(function (L) { return [L[0], L[0] + ' — ' + tt(L[4]) + ' (k=' + L[3] + ' N/m)']; }), legame, function (v) { legame = v; disH(); });
    gH.appendChild(risH);
    function disH() {
      var r = hooke(legame); if (!r) return;
      risH.innerHTML = '<b>ν̃ ≈ ' + r.cm1 + ' cm⁻¹</b> <span class="bsiMF-tag mod">MODELLO</span><br>' +
        t('μ (massa ridotta) = ', 'μ (reduced mass) = ') + r.muAmu + ' uma · k = ' + r.k + ' N/m';
      if (legame === 'C–H' || legame === 'C–D') {
        var ch = hooke('C–H'), cd = hooke('C–D');
        risH.innerHTML += '<br>' + t('Effetto isotopico C–H/C–D = ', 'Isotope effect C–H/C–D = ') + (Math.round(ch.cm1 / cd.cm1 * 1000) / 1000);
      }
    }
    disH(); div.appendChild(gH);

    /* ── calcolatore Woodward-Fieser ── */
    var gW = F.el('div', { 'class': 'bsiFX-pannello' });
    gW.appendChild(F.el('h4', { style: 'margin:4px 0;color:#5eead4', testo: tt(['Woodward-Fieser — λmax', 'Woodward-Fieser — λmax']) }));
    var sistema = 'diene', base = 'eteroanulare', inc = { doppio_esteso: 0, sost_alchilico: 0, doppio_esociclico: 0 }, risW = F.el('div', { 'class': 'bsiMF-ris' });
    var selBase = F.scelta(gW, ['Base', 'Base'], Object.keys(WF.diene.basi).map(function (k) { return [k, k + ' (' + WF.diene.basi[k] + ' nm)']; }), base, function (v) { base = v; disW(); });
    F.scelta(gW, ['Sistema', 'System'], [['diene', tt(['diene', 'diene'])], ['enone', tt(['enone', 'enone'])]], sistema, function (v) {
      sistema = v; base = Object.keys(WF[v].basi)[0];
      selBase.innerHTML = '';
      Object.keys(WF[v].basi).forEach(function (k) { var o = document.createElement('option'); o.value = k; o.textContent = k + ' (' + WF[v].basi[k] + ' nm)'; selBase.appendChild(o); });
      incCorr(); disW();
    });
    var boxInc = F.el('div', { style: 'margin:4px 0' }); gW.appendChild(boxInc);
    function incCorr() {
      inc = {}; boxInc.innerHTML = '';
      Object.keys(WF[sistema].incrementi).forEach(function (k) {
        inc[k] = 0;
        F.cursore(boxInc, [k.replace(/_/g, ' ') + ' (+' + WF[sistema].incrementi[k] + ')', k.replace(/_/g, ' ')], 0, 4, 1, 0, function (n) { inc[k] = n; disW(); }, function (n) { return n + '×'; });
      });
    }
    gW.appendChild(risW);
    function disW() {
      var lista = []; Object.keys(inc).forEach(function (k) { for (var i = 0; i < inc[k]; i++) lista.push(k); });
      var r = woodward(sistema, base, lista); if (!r) return;
      risW.innerHTML = '<b>λmax ≈ ' + r.lambdaMax + ' nm</b> <span class="bsiMF-tag mod">MODELLO</span><br>' +
        t('base ', 'base ') + r.base + ' nm + ' + t('incrementi ', 'increments ') + r.incrementi + ' nm';
    }
    incCorr(); disW(); div.appendChild(gW);

    /* ── Karplus + ppm↔Hz ── */
    var gK = F.el('div', { 'class': 'bsiFX-pannello' });
    gK.appendChild(F.el('h4', { style: 'margin:4px 0;color:#5eead4', testo: tt(['Karplus (³J) e conversione δ↔Hz', 'Karplus (³J) and δ↔Hz']) }));
    var phi = 60, risK = F.el('div', { 'class': 'bsiMF-ris' });
    F.cursore(gK, ['Angolo diedro φ', 'Dihedral φ'], 0, 180, 5, phi, function (v) { phi = v; disK(); }, function (v) { return v + '°'; });
    var ppm = 7.26, mhz = 400;
    F.cursore(gK, ['δ (ppm)', 'δ (ppm)'], 0, 12, 0.01, ppm, function (v) { ppm = v; disK(); }, function (v) { return v.toFixed(2) + ' ppm'; });
    F.scelta(gK, ['Spettrometro', 'Spectrometer'], [['200', '200 MHz'], ['300', '300 MHz'], ['400', '400 MHz'], ['500', '500 MHz'], ['600', '600 MHz']], String(mhz), function (v) { mhz = +v; disK(); });
    gK.appendChild(risK);
    function disK() {
      var k = karplus(phi), c = ppmHz({ ppm: ppm, mhz: mhz });
      risK.innerHTML = '<b>³J(' + phi + '°) ≈ ' + k.J + ' Hz</b> <span class="bsiMF-tag mod">MODELLO</span><br>' +
        t('δ ', 'δ ') + c.ppm + ' ppm → <b>' + c.hz + ' Hz</b> @ ' + c.mhz + ' MHz';
    }
    disK(); div.appendChild(gK);
  }

  /* ═══ 5. SCHEDA — Tracce d'esame e risolutore ═════════════════════════════ */
  function schedaTracce(div) {
    var intro = F.el('div', { 'class': 'bsiFX-nota' });
    intro.innerHTML = t(
      'Catalogo degli appelli (data, formula, note) e risolutore. La soluzione è prodotta dal <b>motore di elucidazione dell\'app</b> (BSIQuesito → BSIElucida): una sola base di conoscenza, nessun dato duplicato. Dove non ho lo spettro completo lo dico — puoi incollarlo qui sotto.',
      'Exam-session catalog (date, formula, notes) and solver. The solution is produced by the <b>app\'s elucidation engine</b> (BSIQuesito → BSIElucida): one knowledge base, no duplicated data. Where I lack the full spectrum I say so — you can paste it below.');
    div.appendChild(intro);

    var sel = F.scelta(div, ['Traccia', 'Trace'], CATALOGO.map(function (c, i) { return [String(i), c.data + ' — ' + c.formula + (c.illustrativa ? ' *' : '')]; }), '0', function (v) { carica(+v); });
    var ta = F.el('textarea', { 'class': 'bsiMF-txt', 'aria-label': tt(['Dati della traccia', 'Trace data']) }); div.appendChild(ta);
    var noteBox = F.el('div', { 'class': 'bsiMF-avv' }); div.appendChild(noteBox);
    var out = F.el('div');
    F.bottone(div, ['Risolvi', 'Solve'], function () { risolvi(); });
    div.appendChild(out);

    function carica(i) {
      var c = CATALOGO[i]; ta.value = c.prosa;
      noteBox.innerHTML = (c.illustrativa ? '<span class="bsiMF-tag mod">DATI ILLUSTRATIVI</span> ' : '') + tt(c.note);
    }
    function f(x) { return (x == null) ? '—' : x; }
    function risolvi() {
      var r = risolviTraccia(ta.value), h = '';
      if (r.avvisi && r.avvisi.length) r.avvisi.forEach(function (a) { h += '<div class="bsiMF-avv">⚠ ' + a + '</div>'; });
      var d = r.dossier;
      if (d) {
        h += '<div class="bsiMF-ris">';
        if (d.idi != null) h += '<b>' + t('Gradi di insaturazione (IHD/DBE): ', 'Degrees of unsaturation (DBE): ') + '</b>' + d.idi + '<br>';
        if (d.massaMono) h += '<b>' + t('Massa monoisotopica M⁺ attesa: ', 'Expected monoisotopic M⁺: ') + '</b>' + (Math.round(d.massaMono * 100) / 100) + '<br>';
        /* regola dell'azoto, dal nostro calcolo */
        if (d.massaMono) { var az = regolaAzoto(d.massaMono); h += '<b>' + t('Regola dell\'azoto: ', 'Nitrogen rule: ') + '</b>' + az.interpretazione; }
        h += '</div>';
        if (d.deduzioni && d.deduzioni.length) {
          h += '<table class="bsiMF-ded"><tr><th>' + t('Deduzione', 'Deduction') + '</th><th>' + t('Valore', 'Value') + '</th><th>' + t('Prova', 'Evidence') + '</th><th>' + t('Certezza', 'Certainty') + '</th></tr>';
          d.deduzioni.forEach(function (x) { h += '<tr><td>' + f(x.che) + '</td><td>' + f(x.valore) + '</td><td>' + f(x.prova) + '</td><td>' + f(x.certezza) + '</td></tr>'; });
          h += '</table>';
        }
        if (d.supposizioni && d.supposizioni.length) {
          h += '<div class="bsiMF-avv"><b>' + t('Ipotesi (non certe):', 'Hypotheses (not certain):') + '</b></div><table class="bsiMF-ded">';
          d.supposizioni.forEach(function (x) { h += '<tr><td>' + f(x.che) + '</td><td>' + f(x.valore) + '</td><td>' + f(x.prova) + '</td></tr>'; });
          h += '</table>';
        }
        if (d.avvisi && d.avvisi.length) d.avvisi.forEach(function (a) { h += '<div class="bsiMF-avv">• ' + a + '</div>'; });
      }
      out.innerHTML = h || ('<div class="bsiMF-avv">' + t('Nessun dato da elaborare.', 'No data to process.') + '</div>');
    }
    carica(0);
  }

  /* ═══ 6. STRUMENTO DI SPECTRA ═════════════════════════════════════════════ */
  var STRUMENTO = {
    name: 'metodi_fisici',
    description: t(
      'Metodi Fisici in Chimica Organica: calcola il numero d\'onda IR con la legge di Hooke, il λmax con Woodward-Fieser, ³J con Karplus, la conversione δ↔Hz, la regola dell\'azoto; oppure risolve una traccia d\'esame (formula + IR/NMR/MS).',
      'Physical Methods in Organic Chemistry: compute the IR wavenumber with Hooke\'s law, λmax with Woodward-Fieser, ³J with Karplus, the δ↔Hz conversion, the nitrogen rule; or solve an exam trace (formula + IR/NMR/MS).'),
    parameters: {
      type: 'object',
      properties: {
        azione: { type: 'string', enum: ['hooke', 'woodward', 'karplus', 'ppm_hz', 'regola_azoto', 'traccia'] },
        legame: { type: 'string' }, sistema: { type: 'string' }, base: { type: 'string' }, incrementi: { type: 'array', items: { type: 'string' } },
        phi: { type: 'number' }, ppm: { type: 'number' }, hz: { type: 'number' }, mhz: { type: 'number' }, massa: { type: 'number' }, testo: { type: 'string' }
      },
      required: ['azione']
    },
    execute: function (a) {
      a = a || {};
      if (typeof globale.BSIFisica !== 'undefined' && globale.BSIFisica.apri) { try { globale.BSIFisica.apri('smetodi'); } catch (e) {} }
      var r;
      switch (a.azione) {
        case 'hooke': r = hooke(a.legame || 'C–H'); break;
        case 'woodward': r = woodward(a.sistema || 'diene', a.base || 'eteroanulare', a.incrementi || []); break;
        case 'karplus': r = karplus(a.phi == null ? 60 : a.phi); break;
        case 'ppm_hz': r = ppmHz({ ppm: a.ppm, hz: a.hz, mhz: a.mhz || 400 }); break;
        case 'regola_azoto': r = regolaAzoto(a.massa == null ? 0 : a.massa); break;
        case 'traccia': var s = risolviTraccia(a.testo || ''); r = { formula: s.dati && s.dati.formula, idi: s.dossier && s.dossier.idi, deduzioni: s.dossier && s.dossier.deduzioni ? s.dossier.deduzioni.length : 0, avvisi: s.avvisi }; break;
        default: return Promise.resolve({ ok: false, error: 'azione sconosciuta', azioni: ['hooke', 'woodward', 'karplus', 'ppm_hz', 'regola_azoto', 'traccia'] });
      }
      return Promise.resolve(r ? { ok: true, azione: a.azione, risultato: r } : { ok: false, error: 'parametri non validi' });
    }
  };
  function registra() { var Ts = globale.BSI_AI_TOOLS; if (!Ts || !Ts.push) return false; if (!Ts.some(function (x) { return x.name === STRUMENTO.name; })) Ts.push(STRUMENTO); return true; }
  if (!registra()) { var tent = 0, iv = setInterval(function () { if (registra() || ++tent > 40) clearInterval(iv); }, 150); }

  /* ═══ 7. LA SEZIONE ═══════════════════════════════════════════════════════ */
  F.sezione('smetodi', {
    titolo: ['📐 Metodi Fisici: teoria e tracce', '📐 Physical Methods: theory & traces'],
    sotto: ['I principi delle dispense (IR Hooke, UV Woodward, NMR Larmor/Karplus, MS), i calcoli fondamentali e il risolutore delle tracce d\'esame — un\'unica base di conoscenza, condivisa con il resto dell\'app.',
            'The course-notes principles (IR Hooke, UV Woodward, NMR Larmor/Karplus, MS), the fundamental calculations and the exam-trace solver — one knowledge base, shared with the rest of the app.'],
    schede: [
      { nome: ['📐 Teoria & calcoli', '📐 Theory & calculations'], costruisci: schedaTeoria },
      { nome: ['📝 Tracce & risolutore', '📝 Traces & solver'], costruisci: schedaTracce }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
