/* ═══════════════════════════════════════════════════════════════════════════
   bsi-elementi3d.js — ⬡ Tavola periodica e gli elementi in 3D (v255)
   Sostituisce la vecchia «Tavola Periodica» (sezione spt): ne conserva tutti i
   dati (ossidazione, proprietà, categoria) e aggiunge l'atomo in 3D e le
   tendenze periodiche colorate.
   BioSpecInfo · © Samuele Pio Provenzano

   PERCHE' ESISTE
   Richiesta dell'autore, con un video di riferimento («The Elements»: Argon,
   Alluminio, Renio, Germanio, Europio…, un atomo 3D al centro che ruota, i
   dati ai lati, l'impronta spettrale in basso, la tavola periodica), ma «più
   scuro, più realistico, meno da cartone, scientificamente accurato».
   Qui l'atomo non è il sistema solare di Bohr:

   · LA NUVOLA ELETTRONICA dal modello di Slater (1930): per ogni sottoguscio
     occupato la carica efficaca Z_eff = Z − s (regole di Slater) e la densità
     radiale dell'orbitale di tipo Slater r^(2n*) e^(−2ζr), ζ = Z_eff/n*.
     I punti sono campionati da quella densità (distribuzione gamma), con la
     direzione mediata (un atomo libero, mediato sui suoi stati, è sferico).
     È un'approssimazione dichiarata: i raggi sono giusti entro il 10–30 %.
   · LA CONFIGURAZIONE è quella della tabella dell'app (NIST), espansa dal gas
     nobile: nessuna regola di Madelung da indovinare, le eccezioni (Cr, Cu,
     Pd, Gd, U…) sono già lì.
   · IL NUCLEO: Z protoni e A − Z neutroni dell'isotopo più comune
     (A = massa arrotondata), ingrandito: il vero nucleo è circa 100 000 volte
     più piccolo dell'atomo (r ≈ 1,2 A^(1/3) fm). Lo dice la didascalia.
   · L'IMPRONTA SPETTRALE: righe di emissione forti dell'atomo neutro e dello
     ione (NIST Atomic Spectra Database, lunghezze d'onda in aria, nm). Solo per
     gli elementi di cui le righe sono qui scritte; l'idrogeno è calcolato con
     la formula di Rydberg. Per gli altri lo si dice, non si inventa.
   · LA LUCE: materiali fisici, tone mapping ACES, sfondo scuro, una luce di
     contorno del colore della riga più forte dell'elemento (dove c'è).
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, PI = Math.PI, D = globale.document;
  function num(x, d) { return x.toFixed(d == null ? 1 : d).replace('.', ',').replace('-', '−'); }

  /* ═══ 1. I DATI ════════════════════════════════════════════════════════ */
  function elementi() { var E = globale.ELEMENTS; return Array.isArray(E) && E.length === 118 && Array.isArray(E[0]) ? E : null; }
  var SUP = { '⁰': 0, '¹': 1, '²': 2, '³': 3, '⁴': 4, '⁵': 5, '⁶': 6, '⁷': 7, '⁸': 8, '⁹': 9 };
  var NOBILI = { He: 2, Ne: 10, Ar: 18, Kr: 36, Xe: 54, Rn: 86 };
  /** Occupazioni { '1s': 2, '2p': 6, … } dalla configurazione abbreviata della tabella ("[Ne]3s²3p⁶"). */
  function configurazione(z) {
    var E = elementi(); if (!E) return null;
    var s = E[z - 1][8] || '', occ = {}, m = /^\[(\w+)\]/.exec(s);
    if (m) { var c = configurazione(NOBILI[m[1]]); for (var k in c) occ[k] = c[k]; s = s.slice(m[0].length); }
    var re = /(\d)([spdf])([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, x;
    while ((x = re.exec(s))) { var n = 0; for (var i = 0; i < x[3].length; i++) n = n * 10 + SUP[x[3][i]]; occ[x[1] + x[2]] = n; }
    return occ;
  }
  var ORDINE = ['1s', '2s', '2p', '3s', '3p', '3d', '4s', '4p', '4d', '4f', '5s', '5p', '5d', '5f', '6s', '6p', '6d', '7s', '7p'];
  function gruppoSlater(o) { var n = +o[0], l = o[1]; return l === 's' || l === 'p' ? n + 'sp' : n + l; }
  var SEQ_GRUPPI = ['1sp', '2sp', '3sp', '3d', '4sp', '4d', '4f', '5sp', '5d', '5f', '6sp', '6d', '7sp'];
  var NSTAR = { 1: 1, 2: 2, 3: 3, 4: 3.7, 5: 4.0, 6: 4.2, 7: 4.3 };
  /** Carica efficace di Slater per un elettrone del sottoguscio o. */
  function zEff(z, occ, o) {
    var g = gruppoSlater(o), ig = SEQ_GRUPPI.indexOf(g), n = +o[0], l = o[1], s = 0;
    Object.keys(occ).forEach(function (q) {
      var e = occ[q]; if (!e) return; var gq = gruppoSlater(q), iq = SEQ_GRUPPI.indexOf(gq), nq = +q[0];
      if (gq === g) s += (q === o ? e - 1 : e) * (g === '1sp' ? 0.30 : 0.35);
      else if (iq < ig) { if (l === 's' || l === 'p') s += e * (nq === n - 1 ? 0.85 : nq <= n - 2 ? 1.0 : 1.0); else s += e * 1.0; }
    });
    return z - s;
  }
  function sottogusci(z) { var occ = configurazione(z); if (!occ) return []; return ORDINE.filter(function (o) { return occ[o]; }).map(function (o) { var Ze = zEff(z, occ, o), ns = NSTAR[+o[0]]; return { nome: o, e: occ[o], zeff: Ze, nstar: ns, zeta: Ze / ns, rMedio: (2 * ns + 1) / (2 * Ze / ns) }; }); }
  /** Densità radiale P(r) = Σ q·N r^(2n*) e^(−2ζr) normalizzata, r in a₀. */
  function densitaRadiale(z, r) { return sottogusci(z).reduce(function (s, g) { var a = 2 * g.nstar + 1, b = 2 * g.zeta; return s + g.e * Math.exp(a * Math.log(b) + (a - 1) * Math.log(Math.max(r, 1e-9)) - b * r - lgamma(a)); }, 0); }
  function lgamma(x) { var c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5], y = x, tmp = x + 5.5; tmp -= (x + 0.5) * Math.log(tmp); var ser = 1.000000000190015; for (var j = 0; j < 6; j++) ser += c[j] / ++y; return -tmp + Math.log(2.5066282746310005 * ser / x); }
  /** Campione di una gamma(forma a, tasso b) (Marsaglia e Tsang). */
  function gamma(a, b, rnd, gauss) { if (a < 1) return gamma(a + 1, b, rnd, gauss) * Math.pow(rnd(), 1 / a); var d = a - 1 / 3, c = 1 / Math.sqrt(9 * d); for (;;) { var x, v; do { x = gauss(); v = 1 + c * x; } while (v <= 0); v = v * v * v; var u = rnd(); if (u < 1 - 0.0331 * x * x * x * x || Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v / b; } }

  /* righe forti, nm in aria (NIST ASD): [λ, intensità relativa 0–1, ione: 0 neutro, 1 una volta ionizzato] */
  var RIGHE = {
    He: [[388.86, 0.5], [447.15, 0.6], [471.31, 0.3], [492.19, 0.3], [501.57, 0.6], [587.56, 1], [667.82, 0.6], [706.52, 0.5]],
    Li: [[460.29, 0.15], [610.36, 0.4], [670.78, 1]],
    C: [[247.86, 1], [426.70, 0.5, 1], [658.29, 0.4, 1]],
    N: [[742.36, 0.6], [744.23, 0.8], [746.83, 1], [500.51, 0.5, 1]],
    O: [[777.19, 1], [777.42, 0.9], [777.54, 0.8], [844.64, 0.6], [615.68, 0.2]],
    Ne: [[540.06, 0.4], [585.25, 1], [588.19, 0.4], [594.48, 0.5], [614.31, 0.6], [626.65, 0.5], [633.44, 0.6], [640.22, 0.9], [650.65, 0.5], [692.95, 0.5], [703.24, 0.7]],
    Na: [[568.82, 0.1], [588.995, 1], [589.592, 0.9], [615.42, 0.1], [616.07, 0.12]],
    Mg: [[285.21, 1], [383.83, 0.4], [516.73, 0.3], [517.27, 0.4], [518.36, 0.5], [279.55, 0.8, 1], [280.27, 0.6, 1]],
    Al: [[394.40, 0.8], [396.15, 1], [308.22, 0.5], [309.27, 0.6]],
    Si: [[251.61, 1], [288.16, 0.8], [390.55, 0.4]],
    Ar: [[696.54, 0.7], [706.72, 0.6], [738.40, 0.5], [750.39, 0.8], [751.47, 0.5], [763.51, 1], [772.38, 0.6], [811.53, 0.9], [434.81, 0.4, 1], [480.60, 0.4, 1]],
    K: [[404.41, 0.3], [404.72, 0.25], [766.49, 1], [769.90, 0.9]],
    Ca: [[422.67, 1], [430.25, 0.3], [445.48, 0.3], [558.88, 0.25], [643.91, 0.3], [393.37, 0.9, 1], [396.85, 0.8, 1]],
    Fe: [[371.99, 0.8], [404.58, 0.5], [432.58, 0.5], [438.35, 0.6], [440.48, 0.5], [527.04, 0.3]],
    Cu: [[324.75, 1], [327.40, 0.8], [510.55, 0.3], [515.32, 0.3], [521.82, 0.4], [578.21, 0.25]],
    Zn: [[468.01, 0.4], [472.22, 0.5], [481.05, 0.6], [636.23, 0.5], [213.86, 1]],
    Ga: [[403.30, 0.8], [417.21, 1], [287.42, 0.5]],
    Kr: [[427.40, 0.4], [431.96, 0.4], [557.03, 0.6], [587.09, 0.8], [760.15, 1], [811.29, 0.7]],
    Rb: [[420.18, 0.3], [421.56, 0.25], [780.03, 1], [794.76, 0.9]],
    Sr: [[460.73, 1], [407.77, 0.7, 1], [421.55, 0.6, 1]],
    Ag: [[328.07, 1], [338.29, 0.8], [520.91, 0.3], [546.55, 0.3]],
    Cd: [[467.82, 0.4], [479.99, 0.5], [508.58, 0.6], [643.85, 1]],
    In: [[410.18, 0.6], [451.13, 1]],
    Xe: [[450.10, 0.5], [462.43, 0.6], [467.12, 0.8], [473.42, 0.4], [823.16, 1], [881.94, 0.8]],
    Cs: [[455.53, 0.5], [459.32, 0.4], [852.11, 1], [894.35, 0.9]],
    Ba: [[553.55, 1], [455.40, 0.8, 1], [493.41, 0.6, 1], [614.17, 0.5, 1], [649.69, 0.4, 1]],
    Hg: [[253.65, 1], [404.66, 0.5], [435.83, 0.8], [546.07, 0.9], [576.96, 0.4], [579.07, 0.4]],
    Tl: [[377.57, 0.8], [535.05, 1]]
  };
  /** Le righe dell'idrogeno con Rydberg (serie di Balmer, Lyman e Paschen fino a n = 8), convertite in aria. */
  function righeIdrogeno() {
    var RH = 10967758.34, out = [];                                              /* m⁻¹, massa ridotta dell'idrogeno */
    [[1, 0.6], [2, 1], [3, 0.5]].forEach(function (s) { for (var n = s[0] + 1; n <= 8; n++) { var lv = 1e9 / (RH * (1 / (s[0] * s[0]) - 1 / (n * n))), la = lv > 200 ? lv / indiceAria(lv) : lv; out.push([la, s[1] / Math.pow(n - s[0], 1.2)]); } });
    return out;
  }
  /** Indice di rifrazione dell'aria standard (Edlén 1966), λ in nm. */
  function indiceAria(lv) { var s2 = Math.pow(1000 / lv, 2); return 1 + 1e-8 * (8342.13 + 2406030 / (130 - s2) + 15997 / (38.9 - s2)); }
  function righe(sim) { return sim === 'H' ? righeIdrogeno() : RIGHE[sim] || null; }
  /** Colore percepito di una lunghezza d'onda (approssimazione di Bruton), [r, g, b] 0–1. */
  function coloreLambda(l) {
    var r = 0, g = 0, b = 0;
    if (l >= 380 && l < 440) { r = -(l - 440) / 60; b = 1; } else if (l < 490) { g = (l - 440) / 50; b = 1; } else if (l < 510) { g = 1; b = -(l - 510) / 20; } else if (l < 580) { r = (l - 510) / 70; g = 1; } else if (l < 645) { r = 1; g = -(l - 645) / 65; } else if (l <= 750) { r = 1; }
    var f = l < 420 ? 0.3 + 0.7 * (l - 380) / 40 : l > 700 ? 0.3 + 0.7 * (750 - l) / 50 : 1; if (l < 380 || l > 750) f = 0;
    return [r * f, g * f, b * f];
  }
  function coloreElemento(sim, cat) {
    var R = righe(sim);
    if (R) { var vis = R.filter(function (x) { return x[0] >= 400 && x[0] <= 700; }).sort(function (a, b) { return b[1] - a[1]; }); if (vis.length) { var c = coloreLambda(vis[0][0]); return [Math.max(0.15, c[0]), Math.max(0.15, c[1]), Math.max(0.15, c[2])]; } }
    return [[0.6, 0.7, 0.9], [1, 0.55, 0.35], [0.95, 0.75, 0.4], [0.7, 0.75, 0.85], [0.6, 0.85, 0.7], [0.5, 0.85, 1], [0.6, 0.6, 1], [0.85, 0.5, 1], [1, 0.6, 0.85], [0.6, 1, 0.6]][cat] || [0.6, 0.8, 1];
  }
  F.calcolo.elementi3d = { configurazione: configurazione, zEff: zEff, sottogusci: sottogusci, densitaRadiale: densitaRadiale, righe: righe, righeIdrogeno: righeIdrogeno, indiceAria: indiceAria, coloreLambda: coloreLambda, RIGHE: RIGHE };

  /* ═══ 2. LA SCHEDA ═════════════════════════════════════════════════════ */
  var SEQUENZA = ['Ar', 'Al', 'Re', 'Ge', 'Eu', 'La', 'Pa', 'Ga', 'Tl', 'Y', 'Gd', 'Si', 'Li', 'Ba', 'Er', 'Tb', 'Dy', 'Pr', 'Pm', 'Tc', 'Te', 'Cm', 'Bk', 'Kr', 'C', 'Na'];
  var CAT = ['', 'metallo alcalino', 'metallo alcalino-terroso', 'metallo di transizione', 'metallo del blocco p', 'semimetallo', 'non metallo', 'gas nobile', 'lantanide', 'attinide'];
  var CAT_EN = ['', 'alkali metal', 'alkaline-earth metal', 'transition metal', 'post-transition metal', 'metalloid', 'nonmetal', 'noble gas', 'lanthanide', 'actinide'];
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var r = Math.imul(a ^ a >>> 15, 1 | a); r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r; return ((r ^ r >>> 14) >>> 0) / 4294967296; }; }

  var VAI = null, ZSCELTO = 18;   /* la scheda della tavola chiama quella dell'atomo */
  function scheda(div) {
    var E = elementi();
    if (!E) { div.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('I dati degli elementi non sono disponibili in questa pagina.', 'Element data is not available on this page.') })); return; }
    var o = { z: 18, bohr: false, corre: false, radice: true }, S = null, T = null, gr = null, nuvola = null, ferma = globale.matchMedia && globale.matchMedia('(prefers-reduced-motion: reduce)').matches, seqI = 0, seqT = 0, transizione = 1;
    var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div', { style: 'min-width:0' }); G.appendChild(pan); G.appendChild(dx); div.appendChild(G);
    var scelta = F.scelta(pan, ['Elemento', 'Element'], E.map(function (e) { return [String(e[0]), e[0] + ' · ' + e[1] + ' · ' + e[2]]; }), String(o.z), function (v) { vai(+v); });
    var bs = F.el('button', { type: 'button', 'class': 'bsiFX-bott', testo: '▶ ' + t('La sequenza del video (Ar, Al, Re, Ge, Eu…)', 'The video sequence (Ar, Al, Re, Ge, Eu…)') }); pan.appendChild(bs);
    bs.addEventListener('click', function () { o.corre = !o.corre; bs.textContent = o.corre ? '⏸ ' + t('Ferma la sequenza', 'Stop the sequence') : '▶ ' + t('La sequenza del video (Ar, Al, Re, Ge, Eu…)', 'The video sequence (Ar, Al, Re, Ge, Eu…)'); seqT = 0; if (S) { S.sporca = true; S.avvia(); } });
    var lb = F.el('label', { style: 'display:flex;align-items:center;gap:10px;min-height:36px;width:100%;cursor:pointer' }), cb = F.el('input', { type: 'checkbox', style: 'width:20px;height:20px;margin:0;flex:0 0 auto' });
    cb.addEventListener('change', function () { o.bohr = cb.checked; costruisci(); }); lb.appendChild(cb); lb.appendChild(F.el('span', { testo: t('Modello di Bohr (storico, 1913: non realistico)', 'Bohr model (historical, 1913: not realistic)') })); pan.appendChild(lb);
    F.scelta(pan, ['Scala radiale', 'Radial scale'], [['r', ['radice quadrata: nocciolo e valenza insieme', 'square root: core and valence together']], ['l', ['lineare (vera): la valenza domina', 'linear (true): the valence dominates']]], 'r', function (v) { o.radice = v === 'r'; costruisci(); });
    var dati = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(dati);
    var tav = F.el('div', { 'class': 'bsiEL-tavola', role: 'grid', 'aria-label': t('Tavola periodica: tocca un elemento', 'Periodic table: tap an element') });
    var spet = F.el('canvas', { role: 'img', 'aria-label': t('Impronta spettrale', 'Spectral fingerprint'), style: 'width:100%;height:92px;display:block;border-radius:10px;background:#03060b;margin-top:8px' });
    var cR = F.tela(dx, 0.38);
    stile();
    function stile() { if (D.getElementById('bsiEL-stile')) return; var st = D.createElement('style'); st.id = 'bsiEL-stile'; st.textContent = '.bsiEL-tavola{display:grid;grid-template-columns:repeat(18,minmax(0,1fr));gap:2px;margin-top:10px}.bsiEL-tavola button{min-width:0;padding:0;aspect-ratio:1/1;border:1px solid #1a3050;border-radius:3px;background:#07121e;color:#cfe3f7;font:600 clamp(7px,1.15vw,11px)/1 system-ui,sans-serif;cursor:pointer}.bsiEL-tavola button[aria-pressed="true"]{outline:2px solid #ffd24a;color:#fff}.bsiEL-tavola .vuoto{visibility:hidden}.bsiEL-tavola .sep{grid-column:1/-1;height:4px}.bsiEL-grande{gap:3px}.bsiEL-grande button{aspect-ratio:auto;min-height:clamp(26px,5.2vw,58px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;padding:1px}.bsiEL-grande .z{font-size:clamp(5px,.8vw,9px);opacity:.75}.bsiEL-grande b{font-size:clamp(8px,1.4vw,15px)}.bsiEL-grande .v{font-size:clamp(5px,.75vw,9px);opacity:.85}'; D.head.appendChild(st); }
    var COLCAT = ['#333', '#ff8f6b', '#ffc36b', '#6bb7ff', '#8fb0d0', '#7fe0b0', '#9fe0ff', '#c9a6ff', '#ff9fd8', '#ffb0a0'];
    function tavola() {
      var celle = {}; E.forEach(function (e) { var z = e[0], p = e[4], g = e[5], r, c; if (z >= 57 && z <= 71) { r = 9; c = z - 57 + 3; } else if (z >= 89 && z <= 103) { r = 10; c = z - 89 + 3; } else { r = p; c = g; } celle[r + ',' + c] = e; });
      for (var r = 1; r <= 10; r++) { if (r === 8) { tav.appendChild(F.el('div', { 'class': 'sep' })); continue; } for (var c = 1; c <= 18; c++) { var e = celle[r + ',' + c]; if (!e) { tav.appendChild(F.el('span', { 'class': 'vuoto' })); continue; } (function (e) { var b = F.el('button', { type: 'button', testo: e[1], title: e[0] + ' ' + e[2], 'aria-label': e[2] + ', ' + e[0], style: 'border-color:' + COLCAT[e[6]] + '55' }); b.dataset.z = e[0]; b.addEventListener('click', function () { o.corre = false; vai(e[0]); }); tav.appendChild(b); })(e); } }
    }
    tavola(); VAI = vai; o.z = ZSCELTO;
    function vai(z) { o.z = z; ZSCELTO = z; scelta.value = String(z); transizione = 0; costruisci(); tav.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', String(+b.dataset.z === z)); }); }
    function testi() {
      var e = E[o.z - 1], A = Math.round(e[3]), N = Math.max(0, A - e[0]), occ = configurazione(o.z), conf = ORDINE.filter(function (x) { return occ[x]; }).map(function (x) { return x + '<sup>' + occ[x] + '</sup>'; }).join(' '), gs = sottogusci(o.z), est = gs[gs.length - 1];
      dati.innerHTML = '<div style="display:flex;align-items:baseline;gap:10px"><span style="font:800 2.2em/1 system-ui;color:#fff">' + e[1] + '</span><span><b>' + e[2] + '</b><br><small>' + t(CAT[e[6]], CAT_EN[e[6]]) + ' · Z = ' + e[0] + '</small></span></div>' +
        t('Protoni ', 'Protons ') + '<b class="bsiFX-num">' + e[0] + '</b> · ' + t('elettroni ', 'electrons ') + '<b class="bsiFX-num">' + e[0] + '</b> · ' + t('neutroni ', 'neutrons ') + '<b class="bsiFX-num">' + N + '</b> <small>(' + t('isotopo con A = ', 'isotope with A = ') + A + ')</small><br>' +
        t('Periodo ', 'Period ') + e[4] + (e[5] ? ' · ' + t('gruppo ', 'group ') + e[5] : '') + ' · ' + t('ossidazione ', 'oxidation ') + '<b>' + (e[7] || '—') + '</b>' + (e[12] != null ? ' · ' + t('fusione ', 'melting ') + String(e[12]).replace('-', '−') + ' °C' : '') + '<br>' + t('Massa atomica ', 'Atomic mass ') + '<b class="bsiFX-num">' + String(e[3]).replace('.', ',') + ' u</b>' + (e[9] != null ? ' · ' + t('elettronegatività ', 'electronegativity ') + String(e[9]).replace('.', ',') : '') + (e[11] != null ? ' · ' + t('1ª ionizzazione ', '1st ionisation ') + String(e[11]).replace('.', ',') + ' eV' : '') + '<br>' +
        t('Configurazione ', 'Configuration ') + '<b>' + e[8] + '</b><br><small>' + conf + '</small><br>' +
        (est ? t('Elettrone più esterno (', 'Outermost electron (') + est.nome + '): Z_eff = <b class="bsiFX-num">' + num(est.zeff, 2) + '</b> (Slater), ⟨r⟩ ≈ ' + num(est.rMedio * 52.9, 0) + ' pm' + (e[10] ? ' · ' + t('raggio atomico tabulato ', 'tabulated atomic radius ') + e[10] + ' pm' : '') + '<br>' : '') +
        '<small>' + (e[13] || '') + '</small>';
      disegnaSpettro(e[1]); disegnaRadiale();
    }
    function disegnaSpettro(sim) {
      var W = spet.clientWidth || 300, H = 92, dpr = Math.min(2, globale.devicePixelRatio || 1); spet.width = W * dpr; spet.height = H * dpr; var q = spet.getContext('2d'); q.setTransform(dpr, 0, 0, dpr, 0, 0); q.clearRect(0, 0, W, H);
      var L0 = 200, L1 = 900, X = function (l) { return (l - L0) / (L1 - L0) * W; };
      for (var l = 380; l <= 750; l += 2) { var c = coloreLambda(l); q.fillStyle = 'rgba(' + Math.round(c[0] * 255) + ',' + Math.round(c[1] * 255) + ',' + Math.round(c[2] * 255) + ',0.10)'; q.fillRect(X(l), 14, X(l + 2) - X(l) + 0.5, H - 34); }
      var R = righe(sim);
      spet.setAttribute('aria-label', R ? t('Impronta spettrale: righe di emissione a ', 'Spectral fingerprint: emission lines at ') + R.map(function (r) { return num(r[0], 2) + ' nm'; }).join(', ') + (sim === 'H' ? t(' (formula di Rydberg senza struttura fine: entro 0,01 nm dal NIST)', ' (Rydberg formula without fine structure: within 0.01 nm of NIST)') : ' (NIST)') : t('Impronta spettrale: righe di questo elemento non incluse, niente dati inventati', 'Spectral fingerprint: lines for this element not included, no invented data'));
      if (R) R.forEach(function (r) { var c = coloreLambda(r[0]), vis = r[0] >= 380 && r[0] <= 750, col = vis ? 'rgb(' + Math.round(Math.max(0.25, c[0]) * 255) + ',' + Math.round(Math.max(0.25, c[1]) * 255) + ',' + Math.round(Math.max(0.25, c[2]) * 255) + ')' : 'rgba(170,180,200,.7)'; q.strokeStyle = col; q.lineWidth = r[2] ? 1.5 : 2.2; q.globalAlpha = 0.35 + 0.65 * r[1]; q.beginPath(); q.moveTo(X(r[0]), 14 + (1 - r[1]) * 30); q.lineTo(X(r[0]), H - 20); q.stroke(); if (r[2]) { q.setLineDash([3, 3]); q.stroke(); q.setLineDash([]); } q.globalAlpha = 1; });
      q.fillStyle = '#9fb3c8'; q.font = '10px system-ui,sans-serif'; [200, 300, 400, 500, 600, 700, 800, 900].forEach(function (l) { q.fillText(l + (l === 900 ? ' nm' : ''), Math.min(W - 34, X(l) + 2), H - 6); });
      q.fillText(R ? t('righe di emissione (NIST, nm in aria; tratteggio = ione); grigio = ultravioletto e infrarosso', 'emission lines (NIST, nm in air; dashed = ion); grey = ultraviolet and infrared') : t('righe di questo elemento non incluse: niente dati inventati', 'lines for this element not included: no invented data'), 6, 10);
    }
    function disegnaRadiale() {
      var xs = [], ys = [], gs = sottogusci(o.z), rmax = Math.min(12, Math.max(3, gs.length ? gs[gs.length - 1].rMedio * 2.5 : 4));
      for (var i = 1; i <= 300; i++) { var r = rmax * i / 300; xs.push(r * 52.9); ys.push(densitaRadiale(o.z, r)); }
      F.grafico(cR, { serie: [{ x: xs, y: ys, col: '#ff8fd8', larg: 2.2 }], xl: ['r (pm)', 'r (pm)'], yl: ['P(r): elettroni per a₀', 'P(r): electrons per a₀'], ymin: 0, legenda: [{ col: '#ff8fd8', etich: ['densità radiale (Slater): un picco per ogni guscio', 'radial density (Slater): one peak per shell'] }] });
    }
    function costruisci() {
      testi(); if (!S) return;
      var e = E[o.z - 1], A = Math.round(e[3]), N = Math.max(0, A - e[0]), col = coloreElemento(e[1], e[6]), rnd = mulberry(o.z * 97 + 1), gs = sottogusci(o.z);
      S.pulisci(); gr = new T.Group(); S.aggiungi(gr);
      var scala = 1.6, mappa = function (r) { return o.radice ? 2.2 * Math.sqrt(r) : scala * r; };   /* a₀ → unità della scena: lineare, o radice quadrata (dichiarata) */
      /* luci: chiave fredda, contorno del colore dell'elemento, cielo basso */
      /* il rig a tre punti delle skill di luci (blender-skills, «Three-Point Studio»): chiave 5500 K a 45° di elevazione e 30° di
         azimut, riempimento opposto al 30 %, contorno caldo 3200 K dietro (135°); più un contorno del colore dell'elemento */
      gr.add(new T.HemisphereLight(0x1a2740, 0x040508, 0.22));
      var chiave = new T.DirectionalLight(0xfff4e8, 1.15); chiave.position.set(Math.cos(0.52) * 7, Math.sin(0.52) * 7, 7); gr.add(chiave);
      var riemp = new T.DirectionalLight(0xdfe9ff, 0.35); riemp.position.set(-Math.cos(0.52) * 7, -Math.sin(0.52) * 7, 2); gr.add(riemp);
      var caldo = new T.DirectionalLight(0xffc28a, 0.7); caldo.position.set(-4, 6, -6); gr.add(caldo);
      var rim = new T.PointLight(new T.Color(col[0], col[1], col[2]), 2.2, 30); rim.position.set(-5, -2, -4); gr.add(rim);
      /* il nucleo: protoni e neutroni impacchettati (spirale di Fibonacci a gusci), ingrandito */
      var tot = e[0] + N, rN = 0.42 * Math.cbrt(tot) * 0.13, nuc = new T.Group(), sp = new T.SphereGeometry(0.065, 20, 14);
      var mP = new T.MeshStandardMaterial({ color: 0xb24a3c, roughness: 0.38, metalness: 0.05, emissive: 0x240806 }), mN = new T.MeshStandardMaterial({ color: 0x7c8794, roughness: 0.45, metalness: 0.1 });
      var protoni = new T.InstancedMesh(sp, mP, e[0]), neutroni = N ? new T.InstancedMesh(sp, mN, N) : null, mat4 = new T.Matrix4(), ip = 0, inn = 0;
      for (var i = 0; i < tot; i++) { var f = (i + 0.5) / tot, rr = rN * Math.cbrt(f), th = Math.acos(1 - 2 * ((i * 0.618034) % 1)), ph = i * 2.39996; mat4.makeTranslation(rr * Math.sin(th) * Math.cos(ph), rr * Math.sin(th) * Math.sin(ph), rr * Math.cos(th)); var proton = ip < e[0] && (inn >= N || rnd() < e[0] / tot); if (proton) protoni.setMatrixAt(ip++, mat4); else neutroni.setMatrixAt(inn++, mat4); }
      protoni.count = ip; nuc.add(protoni); if (neutroni) { neutroni.count = inn; nuc.add(neutroni); }
      gr.add(nuc);
      if (o.bohr) {
        /* il modello storico: gusci come anelli, elettroni che girano */
        var gus = {}; gs.forEach(function (g) { var n = +g.nome[0]; gus[n] = (gus[n] || 0) + g.e; });
        var el = []; Object.keys(gus).forEach(function (n, gi) { var R = 0.9 + n * 0.75, an = new T.Mesh(new T.TorusGeometry(R, 0.008, 6, 120), new T.MeshBasicMaterial({ color: new T.Color(col[0], col[1], col[2]), transparent: true, opacity: 0.35 })); an.rotation.x = 0.3 * gi; an.rotation.y = 0.5 * gi; gr.add(an); for (var j = 0; j < gus[n]; j++) { var m = new T.Mesh(new T.SphereGeometry(0.05, 10, 8), new T.MeshStandardMaterial({ color: 0xe8f4ff, emissive: 0x6fb8ff, emissiveIntensity: 0.6 })); m.userData = { R: R, f: 2 * PI * j / gus[n], w: 1.2 / n, an: an }; gr.add(m); el.push(m); } });
        gr.userData.bohr = el;
      } else {
        /* la nuvola: punti campionati dalla densità di Slater di ogni sottoguscio */
        var tutti = (globale.innerWidth || 1000) < 700 ? 14000 : 36000, pesoTot = gs.reduce(function (s, g) { return s + g.e; }, 0) || 1, pos = [], cc = [];
        var gauss = function () { var u = Math.max(1e-12, rnd()), v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * PI * v); };
        var TINTA = { s: [0.75, 0.85, 1], p: [0.55, 0.85, 1], d: [1, 0.78, 0.5], f: [1, 0.55, 0.85] };
        gs.forEach(function (g) { var n = Math.round(tutti * g.e / pesoTot) + 200, a = 2 * g.nstar + 1, b = 2 * g.zeta, tn = TINTA[g.nome[1]]; for (var j = 0; j < n; j++) { var r = mappa(gamma(a, b, rnd, gauss)), u = 2 * rnd() - 1, ph2 = 2 * PI * rnd(), s2 = Math.sqrt(1 - u * u); pos.push(r * s2 * Math.cos(ph2), r * s2 * Math.sin(ph2), r * u); var mix = 0.55; cc.push((tn[0] * (1 - mix) + col[0] * mix) * 0.85, (tn[1] * (1 - mix) + col[1] * mix) * 0.85, (tn[2] * (1 - mix) + col[2] * mix) * 0.85); } });
        var geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new T.Float32BufferAttribute(cc, 3));
        nuvola = new T.Points(geo, new T.PointsMaterial({ size: 0.05, map: luce(T), vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0.9 }));
        gr.add(nuvola);
        /* gusci: sfere di vetro scuro al raggio medio di ciascun guscio principale */
        var perN = {}; gs.forEach(function (g) { var n = +g.nome[0]; if (!perN[n] || g.rMedio > perN[n]) perN[n] = g.rMedio; });
        Object.keys(perN).forEach(function (n) { var m = new T.Mesh(new T.SphereGeometry(mappa(perN[n]), 64, 48), new T.ShaderMaterial({ uniforms: { c: { value: new T.Color(col[0], col[1], col[2]) } }, transparent: true, depthWrite: false, side: T.FrontSide, blending: T.AdditiveBlending, vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }', fragmentShader: 'uniform vec3 c; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 3.0); gl_FragColor = vec4(c*f*0.55, f*0.55); }' })); gr.add(m); });   /* il contorno di ogni guscio: vetro che si accende solo sul bordo (Fresnel) */
      }
      var Rvis = gs.length ? mappa(gs[gs.length - 1].rMedio * 1.6) : 3;
      S.inquadra(Math.max(3, Rvis * 2.9), 0.8, 1.2); S.gira = !ferma;
      S.didascalia.textContent = e[2] + ' · ' + (o.bohr ? t('modello di Bohr (storico)', 'Bohr model (historical)') : t('nuvola elettronica di Slater', 'Slater electron cloud')) + ' · ' + t('nucleo ingrandito circa 10⁴ volte', 'nucleus magnified about 10⁴ times') + (o.bohr ? '' : ' · ' + (o.radice ? t('scala radiale √r', 'radial scale √r') : t('scala lineare', 'linear scale')));
    }
    var LUCE = null;
    function luce(T2) { if (LUCE) return LUCE; var c = D.createElement('canvas'); c.width = c.height = 64; var q = c.getContext('2d'), g = q.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(255,255,255,.4)'); g.addColorStop(1, 'rgba(255,255,255,0)'); q.fillStyle = g; q.fillRect(0, 0, 64, 64); LUCE = new T2.CanvasTexture(c); return LUCE; }
    var L3 = globale.BSILab3D, attesa = F.el('div', { 'class': 'bsiFX-nota', testo: t('Caricamento del motore 3D…', 'Loading the 3D engine…') }); dx.insertBefore(attesa, cR);
    dx.appendChild(spet); dx.appendChild(tav);
    testi();
    if (!L3) { attesa.textContent = t('Il motore 3D non è disponibile in questa pagina.', 'The 3D engine is not available on this page.'); return; }
    L3.stile(); L3.caricaThree().then(function () {
      attesa.remove(); T = globale.THREE; S = new L3.Scena(dx, 0.78); dx.insertBefore(S.box, dx.firstChild);
      S.ren.setClearColor(0x020306, 1); S.cinema({ forza: 0.8, soglia: 0.5, esposizione: 0.95 });
      setTimeout(function () {
        vai(o.z);
        S.ogniFotogramma(function (dt) {
          var vivo = false;
          if (gr && gr.userData.bohr && !ferma) { gr.userData.bohr.forEach(function (m) { var u = m.userData; u.f += u.w * dt; var v = new T.Vector3(u.R * Math.cos(u.f), u.R * Math.sin(u.f), 0).applyEuler(u.an.rotation); m.position.copy(v); }); vivo = true; }
          if (nuvola && !ferma && !o.bohr) { nuvola.rotation.z += dt * 0.05; vivo = true; }
          if (transizione < 1 && gr) { transizione = Math.min(1, transizione + dt * 1.6); var e2 = transizione * transizione * (3 - 2 * transizione); gr.scale.setScalar(0.6 + 0.4 * e2); vivo = true; }
          if (o.corre) { seqT += dt; if (seqT > 6) { seqT = 0; seqI = (seqI + 1) % SEQUENZA.length; var z = E.findIndex(function (x) { return x[1] === SEQUENZA[seqI]; }) + 1; vai(z); } vivo = true; }
          return vivo;
        });
      }, 0);
    }).catch(function (er) { attesa.textContent = '⚠ ' + er.message; });
    F.alRidimensiona(function () { disegnaSpettro(E[o.z - 1][1]); disegnaRadiale(); });
  }

  var PROPRIETA = [['9', ['Elettronegatività (Pauling)', 'Electronegativity (Pauling)'], ''], ['10', ['Raggio atomico', 'Atomic radius'], ' pm'], ['11', ['Prima energia di ionizzazione', 'First ionisation energy'], ' eV'], ['12', ['Punto di fusione', 'Melting point'], ' °C'], ['3', ['Massa atomica', 'Atomic mass'], ' u'], ['6', ['Categoria', 'Category'], '']];
  /** Colore percettivo (viridis approssimata) per f ∈ [0, 1]. */
  function viridis(f) { var V = [[68, 1, 84], [72, 40, 120], [62, 74, 137], [49, 104, 142], [38, 130, 142], [31, 158, 137], [53, 183, 121], [109, 205, 89], [180, 222, 44], [253, 231, 37]], x = Math.max(0, Math.min(1, f)) * (V.length - 1), i = Math.min(V.length - 2, Math.floor(x)), u = x - i; return 'rgb(' + V[i].map(function (c, k) { return Math.round(c + (V[i + 1][k] - c) * u); }).join(',') + ')'; }
  function schedaTendenze(div) {
    var E = elementi(); if (!E) { div.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('I dati degli elementi non sono disponibili.', 'Element data is not available.') })); return; }
    var o = { p: '9' }, pan = F.el('div', { 'class': 'bsiFX-pannello', style: 'margin-bottom:10px' }); div.appendChild(pan);
    F.scelta(pan, ['Colora la tavola per', 'Colour the table by'], PROPRIETA.map(function (x) { return [x[0], x[1]]; }), o.p, function (v) { o.p = v; disegna(); });
    var info = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(info);
    var tav = F.el('div', { 'class': 'bsiEL-tavola bsiEL-grande', role: 'grid', 'aria-label': t('Tavola periodica colorata per proprietà: tocca un elemento per vederlo in 3D', 'Periodic table coloured by property: tap an element to see it in 3D') }); div.appendChild(tav);
    var COLCAT = ['#333', '#ff8f6b', '#ffc36b', '#6bb7ff', '#8fb0d0', '#7fe0b0', '#9fe0ff', '#c9a6ff', '#ff9fd8', '#ffb0a0'];
    function disegna() {
      tav.innerHTML = ''; var k = +o.p, vals = E.map(function (e) { return e[k]; }).filter(function (v) { return v != null && typeof v === 'number'; }), mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals), celle = {};
      E.forEach(function (e) { var z = e[0], r, c; if (z >= 57 && z <= 71) { r = 9; c = z - 57 + 3; } else if (z >= 89 && z <= 103) { r = 10; c = z - 89 + 3; } else { r = e[4]; c = e[5]; } celle[r + ',' + c] = e; });
      for (var r = 1; r <= 10; r++) { if (r === 8) { tav.appendChild(F.el('div', { 'class': 'sep' })); continue; } for (var c = 1; c <= 18; c++) { var e = celle[r + ',' + c]; if (!e) { tav.appendChild(F.el('span', { 'class': 'vuoto' })); continue; } (function (e) {
        var v = e[k], sfondo = k === 6 ? COLCAT[e[6]] + '55' : (v == null ? '#0b1420' : viridis((v - mn) / (mx - mn || 1))), testoV = k === 6 ? '' : (v == null ? '—' : (Math.abs(v) >= 100 ? Math.round(v) : String(v).replace('.', ',')));
        var b = F.el('button', { type: 'button', title: e[0] + ' ' + e[2] + (k === 6 ? '' : ': ' + testoV + PROPRIETA.filter(function (x) { return x[0] === o.p; })[0][2]), 'aria-label': e[2] + (k === 6 ? '' : ', ' + testoV), html: '<span class="z">' + e[0] + '</span><b>' + e[1] + '</b><span class="v">' + testoV + '</span>', style: 'background:' + sfondo + ';color:' + (k !== 6 && v != null && (v - mn) / (mx - mn || 1) > 0.62 ? '#071018' : '#e9f2fb') });
        b.addEventListener('click', function () { ZSCELTO = e[0]; var sec = div.closest('.section'), tb = sec && sec.querySelector('.bsiFX-schede button'); if (tb) tb.click(); setTimeout(function () { if (VAI) VAI(e[0]); }, 60); });
        tav.appendChild(b); })(e); } }
      var nome = PROPRIETA.filter(function (x) { return x[0] === o.p; })[0];
      info.innerHTML = k === 6 ? t('Colori per categoria: alcalini, alcalino-terrosi, transizione, blocco p, semimetalli, non metalli, gas nobili, lantanidi, attinidi.', 'Colours by category: alkali, alkaline-earth, transition, p-block, metalloids, nonmetals, noble gases, lanthanides, actinides.')
        : '<b>' + t(nome[1][0], nome[1][1]) + '</b>: ' + t('da ', 'from ') + String(mn).replace('.', ',') + nome[2] + t(' (viola) a ', ' (violet) to ') + String(mx).replace('.', ',') + nome[2] + t(' (giallo); grigio dove il dato manca. ', ' (yellow); grey where data is missing. ') +
          ({ '9': t('Cresce verso destra e verso l\'alto: il fluoro è il più elettronegativo.', 'It grows to the right and upwards: fluorine is the most electronegative.'), '10': t('Cresce verso il basso e verso sinistra: più gusci, carica efficace più bassa.', 'It grows downwards and to the left: more shells, lower effective charge.'), '11': t('Massima nei gas nobili, minima negli alcalini: è l\'energia per togliere l\'elettrone più esterno.', 'Highest in noble gases, lowest in alkali metals: the energy to remove the outermost electron.'), '12': t('Il tungsteno fonde a 3422 °C, l\'elio non solidifica a pressione ambiente.', 'Tungsten melts at 3422 °C, helium does not solidify at ambient pressure.'), '3': t('Cresce con Z, con poche inversioni (Ar/K, Co/Ni, Te/I) dovute agli isotopi.', 'It grows with Z, with a few inversions (Ar/K, Co/Ni, Te/I) due to isotopes.') }[o.p] || '') + ' ' + t('Tocca un elemento per vederlo in 3D.', 'Tap an element to see it in 3D.');
    }
    disegna();
  }

  F.sezione('spt', {
    titolo: ['⬡ Tavola periodica e gli elementi in 3D', '⬡ Periodic table and the elements in 3D'],
    sotto: ['Ogni elemento della tavola periodica come atomo vero: la nuvola elettronica del modello di Slater, guscio per guscio, il nucleo con i suoi protoni e neutroni, i dati e l\'impronta spettrale delle righe di emissione misurate. Tocca la tavola o fai partire la sequenza.',
            'Every element of the periodic table as a real atom: the electron cloud of Slater\'s model, shell by shell, the nucleus with its protons and neutrons, the data and the spectral fingerprint of the measured emission lines. Tap the table or start the sequence.'],
    schede: [{ nome: ['⚛️ L\'atomo in 3D', '⚛️ The atom in 3D'], costruisci: scheda }, { nome: ['⬡ La tavola e le tendenze', '⬡ The table and its trends'], costruisci: schedaTendenze }]
  });
})(typeof window !== 'undefined' ? window : globalThis);
