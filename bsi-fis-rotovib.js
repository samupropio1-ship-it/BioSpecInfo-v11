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
  F.calcolo.rotovib = { MOLECOLE: MOLECOLE, RAMAN: RAMAN, righe: righe, raman: raman, combinazione: combinazione, lunghezza: lunghezza, scala: scala, G: G, Fr: Fr, Bv: Bv };

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

  F.sezione('srotovib', {
    titolo: ['🎻 Spettroscopia rotovibrazionale', '🎻 Rovibrational spectroscopy'],
    sotto: ['Lo spettro IR delle biatomiche in fase gassosa costruito dalle costanti molecolari: rami P e R, temperatura, isotopi, Raman rotazionale con la statistica degli spin nucleari, e il ritorno dalle righe alla lunghezza di legame.',
            'The gas-phase IR spectrum of diatomics built from molecular constants: P and R branches, temperature, isotopes, rotational Raman with nuclear spin statistics, and the way back from the lines to the bond length.'],
    schede: [
      { nome: ['Spettro IR (P e R)', 'IR spectrum (P and R)'], costruisci: schedaIR },
      { nome: ['Raman rotazionale', 'Rotational Raman'], costruisci: schedaRaman },
      { nome: ['Dalle righe alla struttura', 'From lines to structure'], costruisci: schedaStruttura }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
