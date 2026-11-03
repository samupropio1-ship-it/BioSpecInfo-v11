/* ═══════════════════════════════════════════════════════════════════════════
   bsi-fis-rotovib.js — la spettroscopia rotovibrazionale
   BioSpecInfo · © Samuele Pio Provenzano

   Lo spettro infrarosso di una molecola biatomica in fase gassosa non e' una
   banda: e' una fila di righe, i rami P e R, una per ogni salto del numero
   quantico rotazionale J. Qui lo si COSTRUISCE dalle costanti molecolari:

     G(v)   = ωe (v+½) − ωexe (v+½)²                       (vibrazione)
     F_v(J) = B_v J(J+1) − D J²(J+1)²,  B_v = Be − αe (v+½)  (rotazione)
     R(J): v=0,J → v=1,J+1      P(J): v=0,J → v=1,J−1

   con l'intensita' di Boltzmann (2J+1)·e^(−hcF/kT) e il fattore di
   Hönl-London. Gli isotopi spostano tutto per la massa ridotta (ωe ∝ μ^−½,
   B ∝ μ^−1, αe ∝ μ^−3/2, D ∝ μ^−2). Lo spettro Raman rotazionale delle
   omonucleari porta la statistica degli spin nucleari (N₂ 2:1, O₂ solo J
   dispari). E si torna indietro: dalle righe, con le differenze di
   combinazione, si ricavano B₀, B₁ e la lunghezza di legame.

   In 3D (v238) la molecola si muove davvero: la biatomica ruota con la
   frequenza classica 2B√(J(J+1)) e vibra fra i punti di inversione del
   potenziale di Morse ricavato da ωe e ωexe (moto classico esatto, periodo
   che si allunga con v), la CO₂ mostra i suoi tre modi normali con le
   ampiezze dei livelli quantici e il dipolo che oscilla (attivo IR) o no.

   Costanti: Huber e Herzberg, «Constants of Diatomic Molecules» (1979),
   come le riporta il NIST Chemistry WebBook.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t;
  var HC_K = 1.438776877;   /* hc/k in cm·K */
  var B2R = 16.857629;      /* ħ²/2u in cm⁻¹·Å²: r = √(B2R/(μ B)) */

  var MOLECOLE = {
    'H35Cl': { mu: 0.979593, we: 2990.946, wexe: 52.8186, Be: 10.5934, ae: 0.30718, D: 5.3194e-4, iso: { 'H37Cl': 0.981077 }, abb: 0.7576 },
    'H79Br': { mu: 0.995427, we: 2648.975, wexe: 45.218, Be: 8.464884, ae: 0.23328, D: 3.4584e-4, iso: { 'H81Br': 0.995528 }, abb: 0.5069 },
    'HF':    { mu: 0.957055, we: 4138.32, wexe: 89.88, Be: 20.9557, ae: 0.798, D: 2.151e-3 },
    '12C16O': { mu: 6.856209, we: 2169.81358, wexe: 13.28831, Be: 1.93128087, ae: 0.01750441, D: 6.12147e-6, iso: { '13C16O': 7.172370 }, abb: 0.989 },
    'NO':    { mu: 7.466433, we: 1904.20, wexe: 14.075, Be: 1.67195, ae: 0.0171, D: 5.4e-6 }
  };
  /* le omonucleari, per il Raman: g pari, g dispari (statistica degli spin) */
  var RAMAN = {
    N2: { mu: 7.00154, Be: 1.998241, ae: 0.017318, D: 5.76e-6, pari: 6, dispari: 3, nota: ['¹⁴N ha spin 1: J pari e dispari stanno 2 : 1', '¹⁴N has spin 1: even and odd J in a 2 : 1 ratio'] },
    O2: { mu: 7.997457, Be: 1.4376766, ae: 0.01593, D: 4.839e-6, pari: 0, dispari: 1, nota: ['¹⁶O ha spin 0 e lo stato fondamentale è ³Σg⁻: esistono solo i J dispari', '¹⁶O has spin 0 and the ground state is ³Σg⁻: only odd J exist'] },
    H2: { mu: 0.503913, Be: 60.853, ae: 3.062, D: 0.0471, pari: 1, dispari: 3, nota: ['¹H ha spin ½: orto (J dispari) e para (J pari) stanno 3 : 1', '¹H has spin ½: ortho (odd J) and para (even J) in a 3 : 1 ratio'] },
    CO2: { mu: 0, Be: 0.39021, ae: 0, D: 1.33e-7, pari: 1, dispari: 0, nota: ['¹⁶O ha spin 0 e CO₂ è simmetrica: esistono solo i J pari', '¹⁶O has spin 0 and CO₂ is symmetric: only even J exist'] }
  };
  function scala(m, mu2) {
    var r = m.mu / mu2;
    return { mu: mu2, we: m.we * Math.sqrt(r), wexe: m.wexe * r, Be: m.Be * r, ae: m.ae * Math.pow(r, 1.5), D: m.D * r * r };
  }
  function G(m, v) { return m.we * (v + 0.5) - m.wexe * (v + 0.5) * (v + 0.5); }
  function Bv(m, v) { return m.Be - m.ae * (v + 0.5); }
  function Fr(m, v, J) { var b = Bv(m, v); return b * J * (J + 1) - m.D * J * J * (J + 1) * (J + 1); }
  /* le righe della banda fondamentale */
  function righe(m, T, Jmax) {
    var out = [], Z = 0, J;
    for (J = 0; J <= Jmax; J++) Z += (2 * J + 1) * Math.exp(-HC_K * Fr(m, 0, J) / T);
    var nu0 = G(m, 1) - G(m, 0);
    for (J = 0; J <= Jmax; J++) {
      var pop = (2 * J + 1) * Math.exp(-HC_K * Fr(m, 0, J) / T) / Z;
      out.push({ ramo: 'R', J: J, nu: nu0 + Fr(m, 1, J + 1) - Fr(m, 0, J), I: pop * (J + 1) / (2 * J + 1) });
      if (J > 0) out.push({ ramo: 'P', J: J, nu: nu0 + Fr(m, 1, J - 1) - Fr(m, 0, J), I: pop * J / (2 * J + 1) });
    }
    return { nu0: nu0, righe: out };
  }
  function raman(m, T, Jmax) {
    var out = [], Z = 0, J, g = function (J) { return J % 2 ? m.dispari : m.pari; };
    for (J = 0; J <= Jmax; J++) Z += g(J) * (2 * J + 1) * Math.exp(-HC_K * Fr(m, 0, J) / T);
    for (J = 0; J <= Jmax; J++) {
      var pop = g(J) * (2 * J + 1) * Math.exp(-HC_K * Fr(m, 0, J) / T) / Z;
      if (pop <= 0) continue;
      /* Stokes S(J): J → J+2; anti-Stokes: J+2 → J */
      var d = Fr(m, 0, J + 2) - Fr(m, 0, J), hl = 3 * (J + 1) * (J + 2) / (2 * (2 * J + 1) * (2 * J + 3));
      out.push({ nu: -d, I: pop * hl, J: J, tipo: 'S' });
      var pop2 = g(J + 2) * (2 * J + 5) * Math.exp(-HC_K * Fr(m, 0, J + 2) / T) / Z;
      if (pop2 > 0) out.push({ nu: d, I: pop2 * hl * (2 * J + 1) / (2 * J + 5), J: J + 2, tipo: 'aS' });
    }
    return out;
  }
  /* indietro: dalle righe, le differenze di combinazione
     R(J−1) − P(J+1) = 4B₀(J+½) − 8D(J+½)³ e R(J) − P(J) = 4B₁(J+½) − 8D(J+½)³ */
  function combinazione(l) {
    var R = {}, P = {}, x0 = [], y0 = [], y1 = [], x1 = [];
    l.forEach(function (r) { if (r.ramo === 'R') R[r.J] = r.nu; else P[r.J] = r.nu; });
    for (var J = 1; J < 12; J++) {
      if (R[J - 1] != null && P[J + 1] != null) { x0.push(J + 0.5); y0.push(R[J - 1] - P[J + 1]); }
      if (R[J] != null && P[J] != null) { x1.push(J + 0.5); y1.push(R[J] - P[J]); }
    }
    /* con la distorsione centrifuga: Δ/(J+½) = 4B − 8D (J+½)², una retta in (J+½)²:
       l'intercetta da' B, la pendenza D */
    function retta(x, y) {
      var X = x.map(function (v) { return v * v; }), Y = y.map(function (v, i) { return v / x[i]; });
      var sx = 0, sy = 0, sxx = 0, sxy = 0, n = X.length;
      for (var i = 0; i < n; i++) { sx += X[i]; sy += Y[i]; sxx += X[i] * X[i]; sxy += X[i] * Y[i]; }
      var m = (n * sxy - sx * sy) / (n * sxx - sx * sx); return { B: (sy - m * sx) / n / 4, D: -m / 8 };
    }
    var a0 = retta(x0, y0), a1 = retta(x1, y1);
    return { B0: a0.B, B1: a1.B, D: a0.D };
  }
  function lunghezza(mu, B) { return Math.sqrt(B2R / (mu * B)); }

  /* ── v238: la molecola che ruota e vibra ─────────────────────────────────
     Il potenziale di Morse ha G(v) = ωe(v+½) − ωexe(v+½)² esattamente, con
     De = ωe²/4ωexe e a = √(ωexe μ / (ħ²/2u)): dalle due costanti della tabella
     si ricava la curva intera. Il moto classico con energia E = G(v) (dal
     fondo) e' noto in forma chiusa: ε = E/De, Ω = ω₀√(1 − ε),
     r(t) = re + (1/a) ln[(1 − √ε cos Ωt)/(1 − ε)]: oscilla fra i punti di
     inversione re − ln(1 ± √ε)/a, piu' lontano verso l'esterno che verso
     l'interno (anarmonicita'). La rotazione classica con L = ħ√(J(J+1)) ha
     frequenza 2B√(J(J+1)) (cm⁻¹) e allunga il legame di Δr/re = D J(J+1)/B. */
  var MASSE = { H: 1.00782503, D: 2.01410178, F: 18.99840316, Cl35: 34.96885268, Cl37: 36.96590260, Br79: 78.9183376, Br81: 80.9162897, C12: 12, C13: 13.00335484, O16: 15.99491462, N14: 14.00307401 };
  var ATOMI = { 'H35Cl': [['H', 'H'], ['Cl', 'Cl35']], 'H79Br': [['H', 'H'], ['Br', 'Br79']], 'HF': [['H', 'H'], ['F', 'F']], '12C16O': [['C', 'C12'], ['O', 'O16']], 'NO': [['N', 'N14'], ['O', 'O16']] };
  var C_CM = 2.99792458e10;   /* velocita' della luce in cm/s */
  function morse(m) { var De = m.we * m.we / (4 * m.wexe), a = Math.sqrt(m.wexe * m.mu / B2R), re = lunghezza(m.mu, m.Be); return { De: De, a: a, re: re, V: function (r) { var y = 1 - Math.exp(-a * (r - re)); return De * y * y; } }; }
  function inversione(m, v) { var M = morse(m), e = Math.sqrt(G(m, v) / M.De); return { dentro: M.re - Math.log(1 + e) / M.a, fuori: M.re - Math.log(1 - e) / M.a }; }
  /* r(t) classico nel Morse al livello v; fase φ = Ωt in radianti */
  function rMorse(m, v, fase) { var M = morse(m), e = G(m, v) / M.De; return M.re + Math.log((1 - Math.sqrt(e) * Math.cos(fase)) / (1 - e)) / M.a; }
  /* frequenza classica di vibrazione al livello v (cm⁻¹): Ω = ω₀√(1 − ε) = ωe − 2ωexe(v+½) */
  function nuVib(m, v) { var M = morse(m); return m.we * Math.sqrt(1 - G(m, v) / M.De); }
  function nuRot(m, v, J) { return 2 * Bv(m, v) * Math.sqrt(J * (J + 1)); }
  /* periodo (s) da un numero d'onda (cm⁻¹) */
  function periodo(nu) { return 1 / (nu * C_CM); }
  /* stiramento centrifugo: dal bilancio k Δr = μω²r; con D = 4B³/ωe² (Kratzer) e' Δr/re = D J(J+1)/B */
  function stiramento(m, J) { return J * (J + 1) * 4 * m.Be * m.Be / (m.we * m.we); }
  /* CO₂: i tre modi normali di una molecola lineare simmetrica O=C=O. Le forme sono fissate dalla
     simmetria e dal centro di massa fermo (non serve il campo di forze): ν₁ gli O in opposizione e il C
     fermo; ν₃ i due O nello stesso verso e il C contro con ampiezza 2m_O/m_C; ν₂ lo stesso ma di
     traverso. L'ampiezza della coordinata normale al livello v e' il punto di inversione classico
     Q = √((2v+1)ħ/ω), con ħ/ω = 2·(ħ²/2u)/ν̃ in u·Å². */
  var CO2 = { mO: MASSE.O16, mC: MASSE.C12, r: 1.1600, nu: { 1: 1333, 2: 667.4, 3: 2349.1 } };
  function modoCO2(k) {
    var mO = CO2.mO, mC = CO2.mC, f = 2 * mO / mC, d;
    /* l'asse molecolare e' x, il piegamento in z */
    if (k === 1) d = [[-1, 0, 0], [0, 0, 0], [1, 0, 0]];
    else if (k === 3) d = [[1, 0, 0], [-f, 0, 0], [1, 0, 0]];
    else d = [[0, 0, 1], [0, 0, -f], [0, 0, 1]];
    var m = [mO, mC, mO], nn = 0; d.forEach(function (x, i) { nn += m[i] * (x[0] * x[0] + x[1] * x[1] + x[2] * x[2]); });
    return { d: d.map(function (x) { return x.map(function (y) { return y / Math.sqrt(nn); }); }), m: m, nu: CO2.nu[k] };   /* Σ m |d|² = 1: d = L/√m */
  }
  function ampiezzaQ(nu, v) { return Math.sqrt((2 * v + 1) * 2 * B2R / nu); }
  /* il dipolo con cariche parziali −δ, +2δ, −δ (in unita' di δ·Å) per uno spostamento Q del modo */
  function dipoloCO2(k, Q) { var M = modoCO2(k), q = [-1, 2, -1], p = [0, 0, 0]; M.d.forEach(function (x, i) { for (var c = 0; c < 3; c++) p[c] += q[i] * Q * x[c]; }); return p; }
  F.calcolo.rotovib = { MOLECOLE: MOLECOLE, RAMAN: RAMAN, righe: righe, raman: raman, combinazione: combinazione, lunghezza: lunghezza, scala: scala, G: G, Fr: Fr, Bv: Bv,
    MASSE: MASSE, ATOMI: ATOMI, morse: morse, inversione: inversione, rMorse: rMorse, nuVib: nuVib, nuRot: nuRot, periodo: periodo, stiramento: stiramento, CO2: CO2, modoCO2: modoCO2, ampiezzaQ: ampiezzaQ, dipoloCO2: dipoloCO2 };

  function lorentz(lista, xmin, xmax, gamma, n) {
    var xs = [], ys = [];
    for (var i = 0; i <= n; i++) {
      var x = xmin + (xmax - xmin) * i / n, y = 0;
      lista.forEach(function (r) { var d = x - r.nu; y += r.I * gamma * gamma / (d * d + gamma * gamma); });
      xs.push(x); ys.push(y);
    }
    return { x: xs, y: ys };
  }

  function schedaIR(div) {
    var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), destra = F.el('div');
    g.appendChild(pan); g.appendChild(destra); div.appendChild(g);
    var mol = 'H35Cl', T = 298, conIso = true, risol = 1.5;
    F.scelta(pan, ['Molecola', 'Molecule'], Object.keys(MOLECOLE).map(function (k) { return [k, k]; }), mol, function (v) { mol = v; disegna(); });
    F.cursore(pan, ['Temperatura (K)', 'Temperature (K)'], 50, 1500, 10, T, function (v) { T = v; disegna(); });
    F.cursore(pan, ['Risoluzione (cm⁻¹)', 'Resolution (cm⁻¹)'], 0.1, 8, 0.1, risol, function (v) { risol = v; disegna(); });
    var lab = F.el('label', { style: 'display:flex;gap:6px;font-size:.82rem;color:#aebccd;margin:6px 0' }), cb = F.el('input', { type: 'checkbox' });
    cb.checked = true; cb.addEventListener('change', function () { conIso = cb.checked; disegna(); });
    lab.appendChild(cb); lab.appendChild(document.createTextNode(t('con l’isotopo (abbondanza naturale)', 'with the isotopologue (natural abundance)'))); pan.appendChild(lab);
    var info = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(info);
    var c = F.tela(destra, 0.5), tab = F.el('div'); destra.appendChild(tab);
    function disegna() {
      var m = MOLECOLE[mol], Jmax = Math.min(60, Math.ceil(Math.sqrt(8 * T / (HC_K * m.Be))) + 6), a = righe(m, T, Jmax), tutte = a.righe.slice();
      var abb = m.abb || 1;
      tutte.forEach(function (r) { r.I *= abb; });
      var isoNome = m.iso ? Object.keys(m.iso)[0] : null;
      if (conIso && isoNome) { var mi = scala(m, m.iso[isoNome]), b = righe(mi, T, Jmax); b.righe.forEach(function (r) { r.I *= (1 - abb); r.iso = true; tutte.push(r); }); }
      var xs = tutte.map(function (r) { return r.nu; }), xmin = Math.min.apply(null, xs) - 10, xmax = Math.max.apply(null, xs) + 10;
      var sp = lorentz(tutte, xmin, xmax, risol / 2, 1400);
      var mx = Math.max.apply(null, sp.y);
      F.grafico(c, { serie: [{ x: sp.x, y: sp.y.map(function (y) { return y / mx; }), col: '#5eead4', larg: 1.4 }], xmin: xmin, xmax: xmax, ymin: 0, ymax: 1.05, invertiX: true,
                     xl: ['numero d’onda (cm⁻¹)', 'wavenumber (cm⁻¹)'], yl: ['assorbanza (normalizzata)', 'absorbance (normalised)'] });
      var Jpicco = Math.round(Math.sqrt(T / (2 * HC_K * m.Be)) - 0.5);
      info.innerHTML = t('Origine della banda ν₀', 'Band origin ν₀') + ': <b class="bsiFX-num">' + a.nu0.toFixed(2) + ' cm⁻¹</b><br>' +
        'B₀ = ' + Bv(m, 0).toFixed(4) + ', B₁ = ' + Bv(m, 1).toFixed(4) + ' cm⁻¹<br>' +
        t('rₑ dalla costante rotazionale', 'rₑ from the rotational constant') + ': <b class="bsiFX-num">' + lunghezza(m.mu, m.Be).toFixed(4) + ' Å</b><br>' +
        t('J più popolato a ' + T + ' K', 'Most populated J at ' + T + ' K') + ': <b>' + Math.max(0, Jpicco) + '</b><br><br>' +
        t('Nessuna riga a ν₀: la transizione J = 0 → 0 è proibita (ΔJ = ±1). Il ramo R si stringe e il P si allarga perché B₁ < B₀. Alzando la temperatura si popolano J più alti e i rami si allargano.',
          'No line at ν₀: the J = 0 → 0 transition is forbidden (ΔJ = ±1). The R branch closes up and the P branch spreads because B₁ < B₀. Raising the temperature populates higher J and the branches widen.');
      var h = '<table class="bsiFX-tab"><tr><th>' + t('riga', 'line') + '</th><th>ν (cm⁻¹)</th><th>' + t('intensità rel.', 'rel. intensity') + '</th></tr>';
      var princ = a.righe.filter(function (r) { return r.J <= 6; }).sort(function (x, y) { return x.nu - y.nu; }), imx = Math.max.apply(null, a.righe.map(function (r) { return r.I; }));
      princ.forEach(function (r) { h += '<tr><td>' + r.ramo + '(' + r.J + ')</td><td class="bsiFX-num">' + r.nu.toFixed(2) + '</td><td class="bsiFX-num">' + (r.I / imx).toFixed(3) + '</td></tr>'; });
      tab.innerHTML = h + '</table>';
    }
    disegna();
    F.alRidimensiona(disegna);
  }

  function schedaRaman(div) {
    var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), destra = F.el('div');
    g.appendChild(pan); g.appendChild(destra); div.appendChild(g);
    var mol = 'N2', T = 298;
    F.scelta(pan, ['Molecola', 'Molecule'], Object.keys(RAMAN).map(function (k) { return [k, k.replace('2', '₂')]; }), mol, function (v) { mol = v; disegna(); });
    F.cursore(pan, ['Temperatura (K)', 'Temperature (K)'], 20, 1000, 5, T, function (v) { T = v; disegna(); });
    var info = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(info);
    var c = F.tela(destra, 0.5);
    function disegna() {
      var m = RAMAN[mol], l = raman(m, T, 60), mx = Math.max.apply(null, l.map(function (r) { return r.I; }));
      var lim = Math.min(400, 4 * m.Be * 30);
      F.grafico(c, { barre: l.map(function (r) { return { x: r.nu, y: r.I / mx, col: r.tipo === 'S' ? '#5eead4' : '#ffd24a' }; }), xmin: -lim, xmax: lim, ymin: 0, ymax: 1.05,
                     xl: ['spostamento Raman (cm⁻¹) — Stokes a sinistra, anti-Stokes a destra', 'Raman shift (cm⁻¹) — Stokes left, anti-Stokes right'], yl: ['intensità', 'intensity'] });
      info.innerHTML = t(m.nota[0], m.nota[1]) + '<br><br>' + t('Le righe distano 4B = ', 'Lines are 4B = ') + (4 * Bv(m, 0)).toFixed(3) + ' cm⁻¹' + t(' l’una dall’altra; la prima a 6B = ', ' apart; the first at 6B = ') + (6 * Bv(m, 0)).toFixed(3) + ' cm⁻¹.<br>' +
        t('Le omonucleari non hanno spettro rotazionale in microonde né IR (nessun momento di dipolo): il Raman è il modo di vederne la rotazione.', 'Homonuclear molecules have no microwave or IR rotational spectrum (no dipole moment): Raman is the way to see them rotate.');
    }
    disegna();
    F.alRidimensiona(disegna);
  }

  function schedaStruttura(div) {
    var pan = F.el('div', { 'class': 'bsiFX-pannello' }); div.appendChild(pan);
    var mol = 'H35Cl', out = F.el('div');
    F.scelta(pan, ['Molecola', 'Molecule'], Object.keys(MOLECOLE).map(function (k) { return [k, k]; }), mol, function (v) { mol = v; calcola(); });
    pan.appendChild(out);
    function calcola() {
      var m = MOLECOLE[mol], a = righe(m, 298, 15), cb = combinazione(a.righe);
      var Be = cb.B0 + 0.5 * (cb.B0 - cb.B1), re = lunghezza(m.mu, Be);
      out.innerHTML = '<div class="bsiFX-eq">R(J−1) − P(J+1) = 4B₀(J + ½) − 8D(J + ½)³   ·   R(J) − P(J) = 4B₁(J + ½) − 8D(J + ½)³</div>' +
        '<table class="bsiFX-tab"><tr><th></th><th>' + t('dalle righe', 'from the lines') + '</th><th>' + t('costante di partenza', 'input constant') + '</th></tr>' +
        '<tr><td>B₀ (cm⁻¹)</td><td class="bsiFX-num">' + cb.B0.toFixed(4) + '</td><td class="bsiFX-num">' + Bv(m, 0).toFixed(4) + '</td></tr>' +
        '<tr><td>B₁ (cm⁻¹)</td><td class="bsiFX-num">' + cb.B1.toFixed(4) + '</td><td class="bsiFX-num">' + Bv(m, 1).toFixed(4) + '</td></tr>' +
        '<tr><td>Bₑ = B₀ + (B₀ − B₁)/2</td><td class="bsiFX-num">' + Be.toFixed(4) + '</td><td class="bsiFX-num">' + m.Be.toFixed(4) + '</td></tr>' +
        '<tr><td>D (cm⁻¹)</td><td class="bsiFX-num">' + cb.D.toExponential(3) + '</td><td class="bsiFX-num">' + m.D.toExponential(3) + '</td></tr>' +
        '<tr><td>rₑ (Å)</td><td class="bsiFX-num">' + re.toFixed(4) + '</td><td class="bsiFX-num">' + lunghezza(m.mu, m.Be).toFixed(4) + '</td></tr></table>' +
        '<div class="bsiFX-nota">' + t('Il percorso di uno spettroscopista: dalle posizioni delle righe, senza sapere niente della molecola, si ricavano le costanti rotazionali dei due stati vibrazionali e la lunghezza del legame. La distorsione centrifuga (il legame che si allunga quando la molecola gira veloce) entra come termine cubico e si ricava anche lei.',
          'A spectroscopist’s route: from the line positions alone, knowing nothing about the molecule, the rotational constants of the two vibrational states and the bond length follow. Centrifugal distortion (the bond stretching as the molecule spins faster) enters as a cubic term and is recovered too.') + '</div>';
    }
    calcola();
  }

  /* ── v238: la scheda 3D ──────────────────────────────────────────────── */
  var MENO_MOTO = false; try { MENO_MOTO = !!(globale.matchMedia && globale.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { }
  /* il pannello subito, la scena dopo (three.js al primo uso, il contesto WebGL e il contenuto in compiti separati) */
  function scheda3D(costruisci) {
    return function (div) {
      var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), destra = F.el('div', { style: 'min-width:0' });
      g.appendChild(pan); g.appendChild(destra); div.appendChild(g);
      var L3 = globale.BSILab3D, attesa = F.el('div', { 'class': 'bsiFX-nota', testo: t('Caricamento del motore 3D…', 'Loading the 3D engine…') });
      destra.appendChild(attesa);
      var ctx = costruisci(pan, destra);
      if (!L3) { attesa.textContent = t('Il motore 3D non è disponibile in questa pagina.', 'The 3D engine is not available on this page.'); return; }
      L3.stile();
      L3.caricaThree().then(function () {
        setTimeout(function () {
          attesa.remove();
          var S = new L3.Scena(destra, 0.7);
          var adatta = S.adatta; S.adatta = function () { if (this.box.offsetParent === null) return; adatta.call(this); };
          destra.insertBefore(S.box, destra.firstChild);
          S.box.setAttribute('role', 'group'); S.box.setAttribute('aria-label', F.tt(ctx.nome));
          div._scena = S;
          setTimeout(function () { ctx.tre(S, globale.THREE, L3); }, 0);
        }, 0);
      }).catch(function (e) { attesa.textContent = t('Motore 3D non disponibile: ', '3D engine unavailable: ') + e.message; });
    };
  }
  var COL_EL = { H: 0xf2f5f8, Cl: 0x5fe36b, Br: 0xa8402c, F: 0x9cf0a0, C: 0x8c96a3, O: 0xff5a4f, N: 0x6b8cff };
  var RAGGIO_EL = { H: 0.25, Cl: 0.5, Br: 0.55, F: 0.38, C: 0.4, O: 0.4, N: 0.4 };
  function fmtT(s) { return s < 1e-12 ? (s * 1e15).toFixed(1) + ' fs' : (s * 1e12).toFixed(2) + ' ps'; }
  function schedaMoto3D(pan) {
    var st = { mol: 'H35Cl', v: 0, J: 3, amp: 1, modo: 3, pausa: MENO_MOTO }, cb = {}, cAmp = null;
    F.scelta(pan, ['Molecola', 'Molecule'], Object.keys(MOLECOLE).map(function (k) { return [k, k]; }).concat([['CO2', t('CO₂ (triatomica: modi normali)', 'CO₂ (triatomic: normal modes)')]]), st.mol, function (v) { st.mol = v; st.amp = v === 'CO2' ? 12 : 1; cAmp.value = st.amp; cAmp.dispatchEvent(new Event('input')); comandi(); aggiorna(); });
    var cont = F.el('div'); pan.appendChild(cont);
    F.cursore(pan, ['livello vibrazionale v', 'vibrational level v'], 0, 5, 1, st.v, function (v) { st.v = v; aggiorna(); });
    cAmp = F.cursore(pan, ['amplificazione dello spostamento', 'displacement magnification'], 1, 30, 1, st.amp, function (v) { st.amp = v; aggiorna(); }, function (v) { return '× ' + v; });
    var bp = F.bottone(pan, st.pausa ? ['▶ Avvia', '▶ Play'] : ['⏸ Pausa', '⏸ Pause'], function () { st.pausa = !st.pausa; bp.textContent = F.tt(st.pausa ? ['▶ Avvia', '▶ Play'] : ['⏸ Pausa', '⏸ Pause']); if (cb.sveglia) cb.sveglia(); });
    var info = F.el('div', { 'class': 'bsiFX-nota' }), spiega = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(info); pan.appendChild(spiega);
    function comandi() {
      cont.innerHTML = '';
      if (st.mol === 'CO2') F.scelta(cont, ['Modo normale', 'Normal mode'], [['1', t('ν₁ stiramento simmetrico (1333 cm⁻¹, solo Raman)', 'ν₁ symmetric stretch (1333 cm⁻¹, Raman only)')], ['2', t('ν₂ piegamento (667 cm⁻¹, IR)', 'ν₂ bend (667 cm⁻¹, IR)')], ['3', t('ν₃ stiramento antisimmetrico (2349 cm⁻¹, IR)', 'ν₃ antisymmetric stretch (2349 cm⁻¹, IR)')]], String(st.modo), function (v) { st.modo = +v; aggiorna(); });
      else F.cursore(cont, ['numero quantico rotazionale J', 'rotational quantum number J'], 0, 30, 1, st.J, function (v) { st.J = v; aggiorna(); });
    }
    var dati = null;
    function aggiorna() {
      if (st.mol === 'CO2') {
        var M = modoCO2(st.modo), Q = ampiezzaQ(M.nu, st.v), dp = dipoloCO2(st.modo, Q), dmod = Math.hypot(dp[0], dp[1], dp[2]), Tv = periodo(M.nu);
        dati = { co2: true, M: M, Q: Q, dip: dmod, Tv: Tv, Tdisp: 1.2 };
        info.innerHTML = '<b>CO₂</b>, ' + t('modo ', 'mode ') + 'ν' + '₁₂₃'[st.modo - 1] + ' = <b class="bsiFX-num">' + M.nu + ' cm⁻¹</b> · ' + t('periodo ', 'period ') + fmtT(Tv) + '<br>' +
          t('Ampiezza della coordinata normale al livello v = ', 'Normal-coordinate amplitude at level v = ') + st.v + ': Q = √((2v+1)ħ/ω) = <b class="bsiFX-num">' + Q.toFixed(4) + ' u^½·Å</b><br>' +
          t('Spostamento massimo: O ', 'Maximum displacement: O ') + (Q * Math.hypot.apply(null, M.d[0]) * 100).toFixed(2) + ' pm, C ' + (Q * Math.hypot.apply(null, M.d[1]) * 100).toFixed(2) + ' pm (' + t('centro di massa fermo', 'centre of mass at rest') + ')<br>' +
          t('Dipolo oscillante (cariche −δ, +2δ, −δ): ', 'Oscillating dipole (charges −δ, +2δ, −δ): ') + '<b class="bsiFX-num">' + (dmod * 100).toFixed(2) + ' δ·pm</b> → ' + (dmod < 1e-12 ? '<b class="bsiFX-ko">' + t('inattivo in IR', 'IR inactive') + '</b>' + t(' (simmetrico: il dipolo resta zero; si vede in Raman)', ' (symmetric: the dipole stays zero; seen in Raman)') : '<b class="bsiFX-ok">' + t('attivo in IR', 'IR active') + '</b>') + '<br>' +
          t('Animazione rallentata di ', 'Animation slowed down ') + (1.2 / Tv).toExponential(1) + t(' volte; spostamenti × ', ' times; displacements × ') + st.amp;
      } else {
        var m = MOLECOLE[st.mol], Mo = morse(m), inv = inversione(m, st.v), nv = nuVib(m, st.v), J = st.J, nr = nuRot(m, st.v, J), Tvr = periodo(nv), Trr = J ? periodo(nr) : Infinity, rap = nv / (nr || 1e-30);
        /* tempi sullo schermo: la vibrazione non oltre 4 Hz, la rotazione almeno 6 s per giro */
        var Trot = J ? Math.max(6, rap / 4) : Infinity, Tvib = J ? Trot / rap : 1;
        dati = { co2: false, m: m, Mo: Mo, inv: inv, Tvib: Tvib, Trot: Trot, dr: stiramento(m, J) * Mo.re };
        info.innerHTML = '<b>' + st.mol + '</b> · Morse ' + t('da ωe e ωexe: ', 'from ωe and ωexe: ') + 'Dₑ = ' + Math.round(Mo.De) + ' cm⁻¹ (' + (Mo.De / 8065.54).toFixed(2) + ' eV), a = ' + Mo.a.toFixed(3) + ' Å⁻¹, rₑ = ' + Mo.re.toFixed(4) + ' Å<br>' +
          t('Livello v = ', 'Level v = ') + st.v + ': ' + t('punti di inversione ', 'turning points ') + '<b class="bsiFX-num">' + inv.dentro.toFixed(4) + ' – ' + inv.fuori.toFixed(4) + ' Å</b> (' + t('verso l’esterno ', 'outwards ') + ((inv.fuori - Mo.re) * 100).toFixed(1) + ' pm, ' + t('verso l’interno ', 'inwards ') + ((Mo.re - inv.dentro) * 100).toFixed(1) + ' pm)<br>' +
          t('Vibrazione classica ', 'Classical vibration ') + '<b class="bsiFX-num">' + nv.toFixed(1) + ' cm⁻¹</b>, ' + t('periodo ', 'period ') + fmtT(Tvr) + '<br>' +
          (J ? t('Rotazione ', 'Rotation ') + '2B√(J(J+1)) = <b class="bsiFX-num">' + nr.toFixed(2) + ' cm⁻¹</b>, ' + t('periodo ', 'period ') + fmtT(Trr) + ' → <b class="bsiFX-num">' + rap.toFixed(1) + '</b> ' + t('vibrazioni per giro', 'vibrations per turn') + '<br>' +
            t('Stiramento centrifugo ', 'Centrifugal stretching ') + 'Δr = rₑ·D J(J+1)/B = <b class="bsiFX-num">' + (dati.dr * 100).toFixed(3) + ' pm</b><br>' : t('J = 0: la molecola non ruota (funzione d’onda rotazionale sferica).', 'J = 0: the molecule does not rotate (spherical rotational wavefunction).') + '<br>') +
          t('Animazione rallentata di ', 'Animation slowed down ') + (Tvib / Tvr).toExponential(1) + t(' volte; spostamenti × ', ' times; displacements × ') + st.amp;
      }
      if (cb.nuova) cb.nuova();
    }
    spiega.innerHTML = t('Le distanze sono in scala (1 Å reale). La biatomica gira nel piano orizzontale attorno al centro di massa, con il vettore J in verticale, e intanto vibra con il moto classico esatto nel potenziale di Morse ricavato dalle costanti della prima scheda: si allontana più di quanto si avvicini, e a v alti il periodo si allunga. Il rapporto fra i due moti è quello vero: decine di vibrazioni per ogni giro. Nella CO₂ ogni modo normale tiene fermo il centro di massa; la freccia gialla è il dipolo che oscilla: se resta nullo il modo non assorbe nell’infrarosso.',
      'Distances are to scale (1 Å real). The diatomic spins in the horizontal plane about its centre of mass, with the J vector vertical, while it vibrates with the exact classical motion in the Morse potential obtained from the constants of the first tab: it stretches out more than it compresses, and at high v the period gets longer. The ratio between the two motions is the real one: tens of vibrations per turn. In CO₂ each normal mode keeps the centre of mass still; the yellow arrow is the oscillating dipole: if it stays zero the mode does not absorb in the infrared.');
    comandi(); aggiorna();
    return {
      nome: ['Molecola che ruota e vibra in 3D', 'Molecule rotating and vibrating in 3D'],
      tre: function (S, T, L3) {
        var K = 1.8, gr = new T.Group(), atomi = [], legami = [], frecciaD = null, tempo = 0;
        S.aggiungi(gr);
        var geoS = new T.SphereGeometry(1, 28, 18), geoC = new T.CylinderGeometry(0.07, 0.07, 1, 12), up = new T.Vector3(0, 1, 0);
        function libera(o) { o.traverse(function (x) { if (x.geometry && x.geometry !== geoS && x.geometry !== geoC) x.geometry.dispose(); if (x.material) { if (x.material.map) x.material.map.dispose(); x.material.dispose(); } }); }
        function svuota() { while (gr.children.length) libera(gr.children.pop()); atomi = []; legami = []; frecciaD = null; }
        function atomo(el) { var m = new T.Mesh(geoS, new T.MeshStandardMaterial({ color: COL_EL[el], roughness: 0.3, metalness: 0.1 })); var r = RAGGIO_EL[el]; m.scale.set(r, r, r); gr.add(m); var et = L3.testo3d(T, el, '#e6fffb', 0.3); gr.add(et); atomi.push({ m: m, et: et, el: el }); }
        function legame() { var c = new T.Mesh(geoC, new T.MeshStandardMaterial({ color: 0xdfe8f2, roughness: 0.5 })); gr.add(c); legami.push(c); }
        function metti(i, p) { var A = atomi[i]; A.m.position.set(p[0], p[1], p[2]); A.et.position.set(p[0], p[1], p[2] + RAGGIO_EL[A.el] + 0.35); }
        function unisci(c, a, b) { var A = new T.Vector3(a[0], a[1], a[2]), B = new T.Vector3(b[0], b[1], b[2]), d = B.clone().sub(A); c.position.copy(A).add(B).multiplyScalar(0.5); c.scale.set(1, d.length(), 1); c.quaternion.setFromUnitVectors(up, d.normalize()); }
        cb.sveglia = function () { S.avvia(); };
        cb.nuova = function () {
          svuota(); tempo = 0;
          if (dati.co2) { ['O', 'C', 'O'].forEach(atomo); legame(); legame(); }
          else {
            var nomi = ATOMI[st.mol]; nomi.forEach(function (n) { atomo(n[0]); }); legame();
            if (st.J) {
              var hJ = 0.6 + 0.25 * Math.sqrt(st.J * (st.J + 1)); gr.add(L3.freccia(T, [0, 0, 0], [0, 0, hJ], 0x6bcfff, 0.3));
              var ej = L3.testo3d(T, 'J', '#6bcfff', 0.32); ej.position.set(0.25, 0, hJ + 0.2); gr.add(ej);
              /* l'orbita dell'atomo leggero alla distanza di equilibrio */
              var m1 = MASSE[nomi[0][1]], m2 = MASSE[nomi[1][1]], rr = dati.Mo.re * m2 / (m1 + m2) * K, pts = [];
              for (var k = 0; k <= 96; k++) pts.push([rr * Math.cos(2 * Math.PI * k / 96), rr * Math.sin(2 * Math.PI * k / 96), 0]);
              gr.add(L3.linea(T, pts, 0x34465f));
            }
          }
          posa(); S.sporca = true; S.avvia();
        };
        function posa() {
          if (dati.co2) {
            var s = Math.sin(2 * Math.PI * tempo / dati.Tdisp), q = dati.Q * s * st.amp, r = CO2.r * K, base = [[-r, 0, 0], [0, 0, 0], [r, 0, 0]], P = [];
            for (var i = 0; i < 3; i++) P.push([base[i][0] + q * dati.M.d[i][0] * K, base[i][1] + q * dati.M.d[i][1] * K, base[i][2] + q * dati.M.d[i][2] * K]);
            P.forEach(function (p, i2) { metti(i2, p); }); unisci(legami[0], P[0], P[1]); unisci(legami[1], P[1], P[2]);
            /* la freccia del dipolo, accanto alla molecola, in scala con l'ampiezza amplificata */
            var dp = dipoloCO2(st.modo, dati.Q * s * st.amp), dm = Math.hypot(dp[0], dp[1], dp[2]);
            if (frecciaD) { gr.remove(frecciaD); libera(frecciaD); frecciaD = null; }
            if (dm * 6 > 0.05) { frecciaD = L3.freccia(T, [0, 0, -1.4], [dp[0] * 6, dp[1] * 6, -1.4 + dp[2] * 6], 0xffd24a, 0.22); gr.add(frecciaD); }
            S.didascalia.textContent = 'CO₂ · ν' + '₁₂₃'[st.modo - 1] + ' · v = ' + st.v + ' · ' + t('spostamenti × ', 'displacements × ') + st.amp + (st.modo === 1 ? t(' · dipolo sempre nullo', ' · dipole always zero') : t(' · freccia gialla: dipolo', ' · yellow arrow: dipole'));
          } else {
            var nomi = ATOMI[st.mol], m1 = MASSE[nomi[0][1]], m2 = MASSE[nomi[1][1]], fase = 2 * Math.PI * tempo / dati.Tvib;
            var rr = rMorse(dati.m, st.v, fase), re = dati.Mo.re, rv = re + (rr - re) * st.amp + dati.dr, th = st.J ? 2 * Math.PI * tempo / dati.Trot : 0;
            var d1 = rv * m2 / (m1 + m2) * K, d2 = rv * m1 / (m1 + m2) * K, c = Math.cos(th), sn = Math.sin(th);
            var p1 = [-d1 * c, -d1 * sn, 0], p2 = [d2 * c, d2 * sn, 0]; metti(0, p1); metti(1, p2); unisci(legami[0], p1, p2);
            S.didascalia.textContent = st.mol + ' · v = ' + st.v + ', J = ' + st.J + ' · r = ' + rr.toFixed(3) + ' Å';
          }
        }
        cb.nuova();
        S.ogniFotogramma(function (dt) { if (st.pausa) return false; tempo += dt; posa(); return true; });
        S.inquadra(7.5, -1.2, 1.05);
      }
    };
  }

  F.sezione('srotovib', {
    titolo: ['🎻 Spettroscopia rotovibrazionale', '🎻 Rovibrational spectroscopy'],
    sotto: ['Lo spettro IR delle biatomiche in fase gassosa costruito dalle costanti molecolari: rami P e R, temperatura, isotopi, Raman rotazionale con la statistica degli spin nucleari, e il ritorno dalle righe alla lunghezza di legame.',
            'The gas-phase IR spectrum of diatomics built from molecular constants: P and R branches, temperature, isotopes, rotational Raman with nuclear spin statistics, and the way back from the lines to the bond length.'],
    schede: [
      { nome: ['Spettro IR (P e R)', 'IR spectrum (P and R)'], costruisci: schedaIR },
      { nome: ['Raman rotazionale', 'Rotational Raman'], costruisci: schedaRaman },
      { nome: ['Dalle righe alla struttura', 'From lines to structure'], costruisci: schedaStruttura },
      { nome: ['🧊 Rotazione e vibrazione 3D', '🧊 3D rotation and vibration'], costruisci: scheda3D(schedaMoto3D) }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
