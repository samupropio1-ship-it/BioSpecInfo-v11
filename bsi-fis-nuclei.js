/* ═══════════════════════════════════════════════════════════════════════════
   bsi-fis-nuclei.js — ☢️ nuclei e reazioni
   BioSpecInfo · © Samuele Pio Provenzano

   Le catene di decadimento, la datazione e una prima curva B/A stanno in
   bsi-fis-nucleare.js (radiochimica); le particelle elementari in
   bsi-fis-particelle.js. Qui c'e' la fisica del nucleo come sistema:

   · LA FORMULA SEMIEMPIRICA (Weizsäcker, coefficienti di Krane):
     B = a_V A − a_S A^(2/3) − a_C Z(Z−1)/A^(1/3) − a_A (A−2Z)²/A ± δ,
     δ = a_P/√A. La curva B/A con i suoi cinque termini e, in 3D, la VALLE
     DI STABILITA': una barra per ogni nucleo (N, Z) legato, alta quanto
     manca a 9 MeV per nucleone e colorata con il decadimento che la
     formula prevede (β⁻, β⁺/CE, α, stabile); i numeri magici come piani;
   · I VALORI Q dalle masse atomiche (AME, in u; 1 u = 931,494 MeV):
     D + T → ⁴He + n 17,59 MeV, α del ²³⁸U 4,27 MeV, fissione del ²³⁵U
     ≈ 200 MeV fino ai prodotti stabili; la ripartizione dell'energia fra i
     due corpi;
   · LA BARRIERA DI COULOMB E L'EFFETTO TUNNEL: il fattore di Gamow
     G = (2/ħ)√(2μQ) b [arccos√x − √(x(1 − x))], x = R/b, verificato con
     l'integrale numerico; la legge di Geiger–Nuttall: 24 ordini di
     grandezza di emivita per un fattore 2 in Q. Il picco di Gamow delle
     reazioni termonucleari, E₀ = (E_G^(1/2) kT/2)^(2/3);
   · IL NUCLEO IN 3D: A nucleoni come sfere impacchettate (protoni rossi,
     neutroni azzurri) nel raggio R = 1,2 A^(1/3) fm;
   · LA CINETICA DEL REATTORE (punto, un gruppo di neutroni ritardati):
     dn/dt = (ρ − β)/Λ n + λC, dC/dt = β/Λ n − λC, risolta esattamente con
     gli autovalori della matrice 2×2; il salto pronto n₊/n₀ = β/(β − ρ),
     il periodo stabile dall'equazione inhour; in 3D il nocciolo con le
     barre di controllo e il bagliore Čerenkov che segue la potenza.

   I calcoli (F.calcolo.nuclei) sono funzioni pure, verificate in node.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt, PI = Math.PI;
  var UMEV = 931.49410242, MH = 1.00782503207, MN = 1.00866491595, HC = 197.3269804, E2 = 1.43996448; /* MeV·fm */

  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var r = Math.imul(a ^ a >>> 15, 1 | a); r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r; return ((r ^ r >>> 14) >>> 0) / 4294967296; }; }
  function simpson(f, a, b, n) { n = n || 2000; if (n % 2) n++; var h = (b - a) / n, s = f(a) + f(b); for (var i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h); return s * h / 3; }

  /* ═══ 1. formula semiempirica ════════════════════════════════════════════ */
  var COEF = { aV: 15.75, aS: 17.8, aC: 0.711, aA: 23.7, aP: 11.18 };
  function termini(A, Z, c) {
    c = c || COEF; var N = A - Z, d = 0;
    if (Z % 2 === 0 && N % 2 === 0) d = c.aP / Math.sqrt(A); else if (Z % 2 === 1 && N % 2 === 1) d = -c.aP / Math.sqrt(A);
    var v = { vol: c.aV * A, sup: -c.aS * Math.pow(A, 2 / 3), coul: -c.aC * Z * (Z - 1) / Math.pow(A, 1 / 3), asim: -c.aA * (A - 2 * Z) * (A - 2 * Z) / A, acc: d };
    v.B = v.vol + v.sup + v.coul + v.asim + v.acc; return v;
  }
  function semf(A, Z) { return A <= 0 || Z < 0 || Z > A ? 0 : termini(A, Z).B; }
  function massaAtomica(A, Z) { return Z * MH + (A - Z) * MN - semf(A, Z) / UMEV; } /* in u, dalla SEMF */
  /* Z piu' stabile a A fisso (derivata del termine di Coulomb e di asimmetria) */
  function zStabile(A) { return A / (2 + COEF.aC * Math.pow(A, 2 / 3) / (2 * COEF.aA)); }
  /* il destino previsto dalla SEMF */
  function destino(A, Z) {
    var B = semf(A, Z);
    if (B - semf(A - 1, Z) < 0 || B - semf(A - 1, Z - 1) < 0) return 'slegato';
    var M = massaAtomica(A, Z);
    if (Z < A && M > massaAtomica(A, Z + 1)) return 'bm';
    if (Z > 0 && M > massaAtomica(A, Z - 1)) return 'bp';
    var Qa = semf(A - 4, Z - 2) + 28.2957 - B;
    if (A > 140 && Qa > 4.2) return 'alfa';
    return 'stabile';
  }

  /* ═══ 2. masse atomiche e valori Q ═══════════════════════════════════════ */
  /* masse atomiche (u), AME2016/2020 arrotondate */
  var MASSE = {
    n: [1.00866491595, 0, 1, 'n'], H1: [1.00782503207, 1, 1, '¹H'], H2: [2.01410177812, 1, 2, '²H (D)'], H3: [3.01604927790, 1, 3, '³H (T)'], He3: [3.01602932008, 2, 3, '³He'], He4: [4.00260325413, 2, 4, '⁴He'],
    Li6: [6.0151228874, 3, 6, '⁶Li'], Li7: [7.016003437, 3, 7, '⁷Li'], C12: [12, 6, 12, '¹²C'], Fe56: [55.9349363, 26, 56, '⁵⁶Fe'], Ni62: [61.9283449, 28, 62, '⁶²Ni'],
    Kr92: [91.9261562, 36, 92, '⁹²Kr'], Zr92: [91.9050398, 40, 92, '⁹²Zr'], Ba141: [140.9144112, 56, 141, '¹⁴¹Ba'], Pr141: [140.9076576, 59, 141, '¹⁴¹Pr'],
    Pb206: [205.9744653, 82, 206, '²⁰⁶Pb'], Pb208: [207.9766521, 82, 208, '²⁰⁸Pb'], Po210: [209.9828737, 84, 210, '²¹⁰Po'], Rn222: [222.0175777, 86, 222, '²²²Rn'], Ra226: [226.0254098, 88, 226, '²²⁶Ra'],
    Th234: [234.0436014, 90, 234, '²³⁴Th'], U235: [235.0439301, 92, 235, '²³⁵U'], U238: [238.0507884, 92, 238, '²³⁸U']
  };
  function Bsperimentale(k) { var m = MASSE[k]; return (m[1] * MH + (m[2] - m[1]) * MN - m[0]) * UMEV; }
  /* Q di una reazione: lista di chiavi a sinistra e a destra (con molteplicita' ripetendo la chiave) */
  function valoreQ(sx, dx) { var s = 0; sx.forEach(function (k) { s += MASSE[k][0]; }); dx.forEach(function (k) { s -= MASSE[k][0]; }); return s * UMEV; }
  var REAZIONI = {
    dt: { sx: ['H2', 'H3'], dx: ['He4', 'n'], nome: ['Fusione D + T → ⁴He + n', 'Fusion D + T → ⁴He + n'] },
    dd: { sx: ['H2', 'H2'], dx: ['He3', 'n'], nome: ['Fusione D + D → ³He + n', 'Fusion D + D → ³He + n'] },
    dhe: { sx: ['H2', 'He3'], dx: ['He4', 'H1'], nome: ['Fusione D + ³He → ⁴He + p', 'Fusion D + ³He → ⁴He + p'] },
    li6: { sx: ['Li6', 'n'], dx: ['He4', 'H3'], nome: ['⁶Li + n → ⁴He + T (fertilizzazione del trizio)', '⁶Li + n → ⁴He + T (tritium breeding)'] },
    pli7: { sx: ['H1', 'Li7'], dx: ['He4', 'He4'], nome: ['p + ⁷Li → 2 ⁴He (Cockcroft–Walton 1932)', 'p + ⁷Li → 2 ⁴He (Cockcroft–Walton 1932)'] },
    u238a: { sx: ['U238'], dx: ['Th234', 'He4'], nome: ['Decadimento α del ²³⁸U', 'α decay of ²³⁸U'] },
    ra226a: { sx: ['Ra226'], dx: ['Rn222', 'He4'], nome: ['Decadimento α del ²²⁶Ra', 'α decay of ²²⁶Ra'] },
    po210a: { sx: ['Po210'], dx: ['Pb206', 'He4'], nome: ['Decadimento α del ²¹⁰Po', 'α decay of ²¹⁰Po'] },
    fiss: { sx: ['U235', 'n'], dx: ['Ba141', 'Kr92', 'n', 'n', 'n'], nome: ['Fissione ²³⁵U + n → ¹⁴¹Ba + ⁹²Kr + 3n (prompta)', 'Fission ²³⁵U + n → ¹⁴¹Ba + ⁹²Kr + 3n (prompt)'] },
    fisstot: { sx: ['U235', 'n'], dx: ['Pr141', 'Zr92', 'n', 'n', 'n'], nome: ['Fissione fino ai prodotti stabili ¹⁴¹Pr + ⁹²Zr', 'Fission down to stable ¹⁴¹Pr + ⁹²Zr'] }
  };
  /* due corpi finali a riposo totale: l'energia cinetica si divide in proporzione inversa alle masse */
  function dueCorpi(Q, m1, m2) { return { T1: Q * m2 / (m1 + m2), T2: Q * m1 / (m1 + m2) }; }
  /* fissione simmetrica dalla SEMF */
  function qFissioneSim(A, Z) { var a = Math.floor(A / 2), z = Math.floor(Z / 2); return semf(a, z) + semf(A - a, Z - z) - semf(A, Z); }

  /* ═══ 3. barriera e tunnel ═══════════════════════════════════════════════ */
  function raggio(A) { return 1.2 * Math.pow(A, 1 / 3); }
  function barrieraCoulomb(Z1, A1, Z2, A2) { return E2 * Z1 * Z2 / (raggio(A1) + raggio(A2)); }
  /* α: figlia (Zd, Ad); Q in MeV; massa ridotta da A */
  function gamowAlfa(Q, Zd, Ad) {
    var mu = 4 * Ad / (4 + Ad) * UMEV, R = 1.2 * (Math.pow(Ad, 1 / 3) + Math.pow(4, 1 / 3)), b = 2 * Zd * E2 / Q, x = R / b;
    var G = 2 * Math.sqrt(2 * mu * Q) / HC * b * (Math.acos(Math.sqrt(x)) - Math.sqrt(x * (1 - x)));
    return { G: G, R: R, b: b, mu: mu };
  }
  /* lo stesso integrale per via numerica: 2∫_R^b √(2μ(V − Q))/ħ dr, con r = R + (b − R) sin²θ che toglie la radice al bordo */
  function gamowNumerico(Q, Zd, Ad) {
    var g = gamowAlfa(Q, Zd, Ad), R = g.R, b = g.b, mu = g.mu;
    var I = simpson(function (th) { var s = Math.sin(th), r = R + (b - R) * s * s, V = 2 * Zd * E2 / r; return Math.sqrt(Math.max(0, 2 * mu * (V - Q))) / HC * (b - R) * 2 * s * Math.cos(th); }, 0, PI / 2, 4000);
    return 2 * I;
  }
  function emivitaAlfa(Q, Zd, Ad) {
    var g = gamowAlfa(Q, Zd, Ad), v = 2.99792458e23 * Math.sqrt(2 * Q / (4 * UMEV)), f = v / (2 * g.R);
    return Math.LN2 / (f * Math.exp(-g.G));
  }
  var ANNO = 3.15576e7;
  /* emettitori α pari-pari: [nome, Z, A, Q (MeV), emivita (s)] */
  var ALFA = [
    ['²³²Th', 90, 232, 4.0816, 1.40e10 * ANNO], ['²³⁸U', 92, 238, 4.2697, 4.468e9 * ANNO], ['²³⁴U', 92, 234, 4.8575, 2.455e5 * ANNO], ['²³⁰Th', 90, 230, 4.7700, 7.54e4 * ANNO],
    ['²²⁶Ra', 88, 226, 4.8706, 1600 * ANNO], ['²³⁸Pu', 94, 238, 5.5932, 87.7 * ANNO], ['²⁴⁴Cm', 96, 244, 5.9024, 18.1 * ANNO], ['²¹⁰Po', 84, 210, 5.4075, 138.376 * 86400],
    ['²²²Rn', 86, 222, 5.5903, 3.8235 * 86400], ['²¹⁸Po', 84, 218, 6.1147, 3.10 * 60], ['²¹⁴Po', 84, 214, 7.8335, 164.3e-6], ['²¹²Po', 84, 212, 8.9541, 0.299e-6]
  ];
  /* picco di Gamow: E_G = 2μc² (παZ₁Z₂)², E₀ = (√E_G kT/2)^(2/3), larghezza Δ = 4√(E₀kT/3) */
  function energiaGamow(Z1, Z2, A1, A2) { var mu = A1 * A2 / (A1 + A2) * UMEV, al = 1 / 137.035999; return 2 * mu * Math.pow(PI * al * Z1 * Z2, 2); }
  function piccoGamow(EG, kT) { var E0 = Math.pow(Math.sqrt(EG) * kT / 2, 2 / 3); return { E0: E0, larghezza: 4 * Math.sqrt(E0 * kT / 3) }; }
  function integrandoGamow(E, EG, kT) { return Math.exp(-E / kT - Math.sqrt(EG / E)); }

  /* ═══ 4. nucleo 3D: posizioni impacchettate ══════════════════════════════ */
  function impacchetta(A, Z, seme) {
    var rnd = mulberry32(seme || 1), p = new Float64Array(3 * A), g = PI * (3 - Math.sqrt(5)), R = Math.cbrt(A) * 0.5, i, k;
    for (i = 0; i < A; i++) { var r = R * Math.cbrt((i + 0.5) / A), z = 1 - 2 * ((i * 0.618034) % 1), s = Math.sqrt(1 - z * z), f = g * i; p[3 * i] = r * s * Math.cos(f); p[3 * i + 1] = r * s * Math.sin(f); p[3 * i + 2] = r * z; }
    /* rilassamento: sfere di diametro 1 che si respingono se si sovrappongono, piu' una lieve attrazione verso il centro */
    for (k = 0; k < 60; k++) {
      for (i = 0; i < A; i++) for (var j = i + 1; j < A; j++) {
        var dx = p[3 * i] - p[3 * j], dy = p[3 * i + 1] - p[3 * j + 1], dz = p[3 * i + 2] - p[3 * j + 2], d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < 1 && d2 > 1e-12) { var d = Math.sqrt(d2), sp = (1 - d) / d * 0.5; p[3 * i] += dx * sp; p[3 * i + 1] += dy * sp; p[3 * i + 2] += dz * sp; p[3 * j] -= dx * sp; p[3 * j + 1] -= dy * sp; p[3 * j + 2] -= dz * sp; }
      }
      for (i = 0; i < 3 * A; i++) p[i] *= 0.995;
    }
    /* chi e' protone: Z scelti a caso (riproducibile) */
    var idx = []; for (i = 0; i < A; i++) idx.push(i);
    for (i = A - 1; i > 0; i--) { var q = Math.floor(rnd() * (i + 1)), tmp = idx[i]; idx[i] = idx[q]; idx[q] = tmp; }
    var protone = new Uint8Array(A); for (i = 0; i < Z; i++) protone[idx[i]] = 1;
    var minD = 1e9; for (i = 0; i < Math.min(A, 80); i++) for (j = i + 1; j < A; j++) minD = Math.min(minD, Math.hypot(p[3 * i] - p[3 * j], p[3 * i + 1] - p[3 * j + 1], p[3 * i + 2] - p[3 * j + 2]));
    return { p: p, protone: protone, minD: minD };
  }

  /* ═══ 5. cinetica puntiforme, un gruppo ══════════════════════════════════ */
  /* x = [n, C]; matrice [[(ρ−β)/Λ, λ], [β/Λ, −λ]]; evoluzione esatta per un tempo h a ρ costante */
  function cineticaMatrice(rho, P) { return [[(rho - P.beta) / P.Lambda, P.lambda], [P.beta / P.Lambda, -P.lambda]]; }
  function cineticaRadici(rho, P) { var M = cineticaMatrice(rho, P), tr = M[0][0] + M[1][1], det = M[0][0] * M[1][1] - M[0][1] * M[1][0], dsc = Math.sqrt(tr * tr / 4 - det); return [tr / 2 + dsc, tr / 2 - dsc]; }
  function cineticaEvolvi(x, rho, h, P) {
    var M = cineticaMatrice(rho, P), w = cineticaRadici(rho, P), a = M[0][0], b = M[0][1], c = M[1][0], d = M[1][1];
    /* exp(Mh) = (e^{w1h}(M − w2 I) − e^{w2h}(M − w1 I))/(w1 − w2) (Sylvester) */
    var e1 = Math.exp(w[0] * h), e2 = Math.exp(w[1] * h), k = 1 / (w[0] - w[1]);
    var E = [[k * (e1 * (a - w[1]) - e2 * (a - w[0])), k * (e1 - e2) * b], [k * (e1 - e2) * c, k * (e1 * (d - w[1]) - e2 * (d - w[0]))]];
    return [E[0][0] * x[0] + E[0][1] * x[1], E[1][0] * x[0] + E[1][1] * x[1]];
  }
  function cineticaRK4(x, rho, h, n, P) {
    var M = cineticaMatrice(rho, P); function f(y) { return [M[0][0] * y[0] + M[0][1] * y[1], M[1][0] * y[0] + M[1][1] * y[1]]; }
    for (var i = 0; i < n; i++) { var k1 = f(x), k2 = f([x[0] + h / 2 * k1[0], x[1] + h / 2 * k1[1]]), k3 = f([x[0] + h / 2 * k2[0], x[1] + h / 2 * k2[1]]), k4 = f([x[0] + h * k3[0], x[1] + h * k3[1]]); x = [x[0] + h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), x[1] + h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])]; }
    return x;
  }
  function equilibrio(n0, P) { return [n0, P.beta * n0 / (P.lambda * P.Lambda)]; }
  function saltoPronto(rho, P) { return P.beta / (P.beta - rho); }
  /* inhour a un gruppo: ρ = ωΛ + ωβ/(ω + λ), radice positiva per bisezione */
  function inhour(rho, P) {
    var f = function (w) { return w * P.Lambda + w * P.beta / (w + P.lambda) - rho; }, lo = rho > 0 ? 0 : -P.lambda + 1e-12, hi = rho > 0 ? 1e4 : 0;
    for (var k = 0; k < 200; k++) { var m = (lo + hi) / 2; if (f(m) > 0) hi = m; else lo = m; }
    return (lo + hi) / 2;
  }
  var REATTORE = { beta: 0.0065, lambda: 0.0767, Lambda: 1e-4 };

  F.calcolo.nuclei = {
    COEF: COEF, termini: termini, semf: semf, massaAtomica: massaAtomica, zStabile: zStabile, destino: destino,
    MASSE: MASSE, Bsperimentale: Bsperimentale, valoreQ: valoreQ, REAZIONI: REAZIONI, dueCorpi: dueCorpi, qFissioneSim: qFissioneSim,
    raggio: raggio, barrieraCoulomb: barrieraCoulomb, gamowAlfa: gamowAlfa, gamowNumerico: gamowNumerico, emivitaAlfa: emivitaAlfa, ALFA: ALFA,
    energiaGamow: energiaGamow, piccoGamow: piccoGamow, integrandoGamow: integrandoGamow, impacchetta: impacchetta,
    cineticaEvolvi: cineticaEvolvi, cineticaRK4: cineticaRK4, cineticaRadici: cineticaRadici, equilibrio: equilibrio, saltoPronto: saltoPronto, inhour: inhour, REATTORE: REATTORE,
    UMEV: UMEV
  };

  /* ═══ interfaccia ═══════════════════════════════════════════════════════ */
  if (!globale.document || !globale.document.createElement) return;
  var D = globale.document;
  function griglia(div) { var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div', { style: 'min-width:0' }); G.appendChild(pan); G.appendChild(dx); div.appendChild(G); return { pan: pan, dx: dx }; }
  function nota(pan, html) { var n = F.el('div', { 'class': 'bsiFX-nota' }); if (html) n.innerHTML = html; pan.appendChild(n); return n; }
  function eq(pan, testo) { var e = F.el('div', { 'class': 'bsiFX-eq', testo: testo }); pan.appendChild(e); return e; }
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
        attesa.remove();
        var S = new L3.Scena(destra, 0.62);
        /* nelle schede nascoste la scena non si ridimensiona (riallocare il framebuffer costa) */
        var adatta = S.adatta; S.adatta = function () { if (this.box.offsetParent === null) return; adatta.call(this); };
        destra.insertBefore(S.box, destra.firstChild);
        div._scena = S;
        setTimeout(function () { ctx.tre(S, globale.THREE, L3); }, 0);
      }).catch(function (e) { attesa.textContent = t('Motore 3D non disponibile: ', '3D engine unavailable: ') + e.message; });
    };
  }
  function bagliore(T, col, dim) {
    var c = D.createElement('canvas'); c.width = c.height = 64; var q = c.getContext('2d'), g = q.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); q.fillStyle = g; q.fillRect(0, 0, 64, 64);
    var sp = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(c), color: col, blending: T.AdditiveBlending, depthWrite: false, transparent: true }));
    sp.scale.set(dim, dim, 1); return sp;
  }
  var COL_DEST = { stabile: [0.95, 0.95, 0.95], bm: [0.37, 0.62, 1], bp: [1, 0.45, 0.45], alfa: [1, 0.82, 0.29] };
  var SIMBOLI = 'n H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm'.split(' ');
  function nomeNuclide(A, Z) { return (SIMBOLI[Z] || 'Z' + Z) + '-' + A; }

  /* ─── 1. SEMF e valle di stabilità ─────────────────────────────────────── */
  function schedaValle(pan, destra) {
    var st = { A: 56, Z: 26 };
    eq(pan, 'B = a_V A − a_S A^(2/3) − a_C Z(Z−1)/A^(1/3) − a_A (A−2Z)²/A ± δ');
    var cA = F.cursore(pan, ['A (nucleoni)', 'A (nucleons)'], 4, 260, 1, st.A, function (v) { st.A = v; st.Z = Math.min(st.A, Math.max(1, Math.round(zStabile(v)))); cZ.max = v; cZ.value = st.Z; cZ.dispatchEvent(new Event('input')); });
    var cZ = F.cursore(pan, ['Z (protoni)', 'Z (protons)'], 1, 260, 1, st.Z, function (v) { st.Z = Math.min(v, st.A); disegna(); });
    var info = nota(pan);
    nota(pan, t('Il termine di volume dice che la forza nucleare satura (ogni nucleone sente solo i vicini); la superficie toglie legame ai nucleoni di bordo, pesante nei nuclei leggeri; Coulomb cresce come Z²/A^(1/3) e vince nei pesanti; l’asimmetria (principio di Pauli) premia N ≈ Z; l’accoppiamento premia i pari-pari. Il massimo di B/A è vicino al ferro e al nichel: per questo le stelle bruciano fino al ferro e i nuclei pesanti rilasciano energia fissionando. In 3D la valle: barre basse = nuclei ben legati.',
      'The volume term says the nuclear force saturates (each nucleon feels only its neighbours); the surface term removes binding from edge nucleons, heavy for light nuclei; Coulomb grows as Z²/A^(1/3) and wins in heavy nuclei; asymmetry (Pauli principle) favours N ≈ Z; pairing favours even-even. The B/A maximum is near iron and nickel: that is why stars burn up to iron and heavy nuclei release energy by fission. In 3D the valley: low bars = well-bound nuclei.'));
    var tela = F.tela(destra, 0.5), cb = {};
    var SPER = ['H2', 'He4', 'Li6', 'Li7', 'C12', 'Fe56', 'Ni62', 'Kr92', 'Zr92', 'Pr141', 'Pb208', 'U235', 'U238'];
    function disegna() {
      var xs = [], ys = [], i;
      for (i = 4; i <= 260; i++) { var z = Math.max(1, Math.round(zStabile(i))); xs.push(i); ys.push(semf(i, z) / i); }
      var punti = SPER.map(function (k) { return { x: MASSE[k][2], y: Bsperimentale(k) / MASSE[k][2], col: '#ffffff', r: 3.5 }; });
      punti.push({ x: st.A, y: semf(st.A, st.Z) / st.A, col: '#ff8a80', r: 5 });
      F.grafico(tela, { serie: [{ x: xs, y: ys, col: '#5eead4', etich: 'SEMF' }], punti: punti, xmin: 0, xmax: 260, ymin: 0, ymax: 9.5, xl: ['numero di massa A', 'mass number A'], yl: ['B/A (MeV)', 'B/A (MeV)'], legenda: [{ col: '#5eead4', etich: ['SEMF lungo la valle', 'SEMF along the valley'] }, { col: '#ffffff', etich: ['dalle masse misurate', 'from measured masses'] }], descr: ['Energia di legame per nucleone in funzione di A', 'Binding energy per nucleon versus A'] });
      var v = termini(st.A, st.Z), d = destino(st.A, st.Z);
      info.innerHTML = '<b>' + nomeNuclide(st.A, st.Z) + '</b> (N = ' + (st.A - st.Z) + ')<br>' + t('volume ', 'volume ') + fmt(v.vol) + ', ' + t('superficie ', 'surface ') + fmt(v.sup) + ', Coulomb ' + fmt(v.coul) + ', ' + t('asimmetria ', 'asymmetry ') + fmt(v.asim) + ', ' + t('accoppiamento ', 'pairing ') + fmt(v.acc) + ' MeV<br>' +
        'B = <b>' + fmt(v.B) + ' MeV</b>, B/A = <b>' + (v.B / st.A).toFixed(3) + ' MeV</b><br>' + t('Previsione: ', 'Prediction: ') + '<b>' + ({ stabile: t('stabile', 'stable'), bm: 'β⁻', bp: t('β⁺ / cattura elettronica', 'β⁺ / electron capture'), alfa: 'α', slegato: t('non legato (emette nucleoni)', 'unbound (drips nucleons)') })[d] + '</b> · Z<sub>stabile</sub>(A) = ' + fmt(zStabile(st.A));
      if (cb.segna) cb.segna();
    }
    disegna(); F.alRidimensiona(disegna);
    return {
      tre: function (S, T, L3) {
        /* una barra per (N, Z): altezza 9 − B/A, colore = destino */
        var celle = [], Z, N;
        for (Z = 1; Z <= 100; Z++) for (N = 0; N <= 160; N++) {
          var A = Z + N; if (A < 4) continue;
          var zs = zStabile(A); if (Math.abs(Z - zs) > 9 + A / 40) continue;
          var d = destino(A, Z); if (d === 'slegato') continue;
          celle.push([N, Z, Math.max(0.05, 9.2 - semf(A, Z) / A), d]);
        }
        var sc = 0.1, mesh = new T.InstancedMesh(new T.BoxGeometry(sc * 0.92, sc * 0.92, 1), new T.MeshStandardMaterial({ roughness: 0.5, metalness: 0.1 }), celle.length), M4 = new T.Matrix4(), col = new T.Color();
        celle.forEach(function (c, i) {
          var h = c[2] * 0.6; M4.makeScale(1, 1, h); M4.setPosition((c[0] - 80) * sc, (c[1] - 50) * sc, h / 2); mesh.setMatrixAt(i, M4);
          var cc = COL_DEST[c[3]], ombra = 0.55 + 0.45 * Math.max(0, 1 - c[2] / 4); mesh.setColorAt(i, col.setRGB(cc[0] * ombra, cc[1] * ombra, cc[2] * ombra));
        });
        S.aggiungi(mesh);
        /* N = Z, numeri magici, assi */
        S.aggiungi(L3.linea(T, [[-80 * sc, -50 * sc, 0.01], [(100 - 80) * sc, (100 - 50) * sc, 0.01]], 0x5eead4, 0.6));
        var et = L3.testo3d(T, 'N = Z', '#5eead4', 0.35); et.position.set(2, 5.2, 0.3); S.aggiungi(et);
        [2, 8, 20, 28, 50, 82, 126].forEach(function (m) {
          if (m <= 160) { var l = L3.linea(T, [[(m - 80) * sc, -50 * sc, 0.02], [(m - 80) * sc, 50 * sc, 0.02]], 0xc49bff, 0.35); S.aggiungi(l); var e1 = L3.testo3d(T, 'N=' + m, '#c49bff', 0.25); e1.position.set((m - 80) * sc, -5.3, 0.1); S.aggiungi(e1); }
          if (m <= 100) { S.aggiungi(L3.linea(T, [[-80 * sc, (m - 50) * sc, 0.02], [80 * sc, (m - 50) * sc, 0.02]], 0xc49bff, 0.35)); var e2 = L3.testo3d(T, 'Z=' + m, '#c49bff', 0.25); e2.position.set(-8.6, (m - 50) * sc, 0.1); S.aggiungi(e2); }
        });
        var en = L3.testo3d(T, 'N →', '#cfe3f7', 0.4); en.position.set(7.8, -5.6, 0); S.aggiungi(en);
        var ez = L3.testo3d(T, 'Z ↑', '#cfe3f7', 0.4); ez.position.set(-8.4, 5.2, 0); S.aggiungi(ez);
        var pav = new T.Mesh(new T.PlaneGeometry(17, 11), new T.MeshStandardMaterial({ color: 0x0b1a2c, roughness: 0.9 })); pav.position.set(0, 0, -0.01); S.aggiungi(pav);
        var segno = new T.Mesh(new T.ConeGeometry(0.18, 0.5, 16), new T.MeshStandardMaterial({ color: 0xff8a80, emissive: 0x802020 })); segno.rotation.x = -PI / 2; S.aggiungi(segno);
        var luce = bagliore(T, 0xff8a80, 0.9); S.aggiungi(luce);
        cb.segna = function () {
          var A = st.A, Zz = st.Z, h = Math.max(0.05, 9.2 - semf(A, Zz) / A) * 0.6, x = (A - Zz - 80) * sc, y = (Zz - 50) * sc;
          segno.position.set(x, y, Math.min(6, h) + 0.45); luce.position.set(x, y, Math.min(6, h) + 0.45);
          S.didascalia.textContent = t('Valle di stabilità (SEMF): ', 'Valley of stability (SEMF): ') + celle.length + t(' nuclei · bianco stabile, blu β⁻, rosso β⁺, giallo α · ', ' nuclei · white stable, blue β⁻, red β⁺, yellow α · ') + nomeNuclide(A, Zz);
          S.sporca = true; S.avvia();
        };
        cb.segna();
        S.inquadra(17, -1.75, 0.95);
      }
    };
  }

  /* ─── 2. Valori Q ──────────────────────────────────────────────────────── */
  function schedaQ(div) {
    var G = griglia(div), pan = G.pan, st = { r: 'dt' };
    eq(pan, 'Q = (Σ M_iniziali − Σ M_finali) c²,  1 u = 931,494 MeV');
    F.scelta(pan, ['Reazione', 'Reaction'], Object.keys(REAZIONI).map(function (k) { return [k, F.tt(REAZIONI[k].nome)]; }), st.r, function (v) { st.r = v; disegna(); });
    var info = nota(pan);
    nota(pan, t('Le masse sono ATOMICHE (con gli elettroni): nelle reazioni in cui Z si conserva gli elettroni si cancellano. Q > 0: la reazione libera energia, divisa fra i prodotti in proporzione inversa alle masse (un α del ²³⁸U prende il 98 % di Q, il nucleo figlio rincula). Nella fissione circa 170 MeV vanno subito ai frammenti; il resto arriva con i decadimenti β dei prodotti verso la stabilità, e una parte se la portano via gli antineutrini. Sotto: Q della fissione simmetrica dalla formula semiempirica, positivo oltre A ≈ 90.',
      'Masses are ATOMIC (electrons included): in reactions conserving Z the electrons cancel. Q > 0: the reaction releases energy, shared by the products in inverse proportion to their masses (an α from ²³⁸U takes 98 % of Q, the daughter recoils). In fission about 170 MeV go at once to the fragments; the rest comes with the β decays of the products towards stability, and antineutrinos carry part of it away. Below: Q of symmetric fission from the semi-empirical formula, positive beyond A ≈ 90.'));
    var tela = F.tela(G.dx, 0.5), tela2 = F.tela(G.dx, 0.4);
    function disegna() {
      var R = REAZIONI[st.r], Q = valoreQ(R.sx, R.dx), Ms = 0, Md = 0;
      R.sx.forEach(function (k) { Ms += MASSE[k][0]; }); R.dx.forEach(function (k) { Md += MASSE[k][0]; });
      /* diagramma: due colonne di masse impilate */
      var P = F.pennello(tela), q = P.q, W = P.W, H = P.H, cols = ['#5eead4', '#6bcfff', '#c49bff', '#ffd24a', '#ff8a80'];
      function colonna(x, w, lista, tot, titolo) {
        var y = H - 40, hh = H - 90;
        lista.forEach(function (k, i) { var h = hh * MASSE[k][0] / Math.max(Ms, Md); q.fillStyle = cols[i % cols.length]; q.globalAlpha = 0.75; q.fillRect(x, y - h, w, h); q.globalAlpha = 1; q.strokeStyle = '#081522'; q.strokeRect(x, y - h, w, h); if (h > 14) { q.fillStyle = '#081522'; q.font = 'bold 12px system-ui,sans-serif'; q.textAlign = 'center'; q.fillText(MASSE[k][3], x + w / 2, y - h / 2 + 4); } y -= h; });
        q.fillStyle = '#cfe3f7'; q.font = '12px system-ui,sans-serif'; q.textAlign = 'center'; q.fillText(titolo, x + w / 2, H - 22); q.fillText(tot.toFixed(6) + ' u', x + w / 2, H - 8);
        return y;
      }
      var w = Math.min(120, W * 0.22), y1 = colonna(W * 0.18, w, R.sx, Ms, t('prima', 'before')), y2 = colonna(W * 0.62, w, R.dx, Md, t('dopo', 'after'));
      q.strokeStyle = '#ffd24a'; q.setLineDash([4, 3]); q.beginPath(); q.moveTo(W * 0.18 + w, y1); q.lineTo(W * 0.62 + w + 10, y1); q.stroke(); q.setLineDash([]);
      q.fillStyle = '#ffd24a'; q.font = 'bold 13px system-ui,sans-serif'; q.textAlign = 'left';
      q.fillText('Q = ' + Q.toFixed(3) + ' MeV', Math.min(W - 130, W * 0.62 + w + 14), (y1 + y2) / 2 + 4);
      q.fillStyle = '#9fb1c6'; q.font = '11px system-ui,sans-serif'; q.fillText(t('altezze proporzionali alle masse; il salto (esagerato dal disegno) è Δm = ', 'heights proportional to masses; the gap is Δm = ') + ((Ms - Md) * 1000).toFixed(3) + ' mu', 8, 14);
      tela.setAttribute('aria-label', t('Bilancio delle masse della reazione e valore Q', 'Mass balance of the reaction and Q value'));
      var testo = '<b>' + F.tt(R.nome) + '</b><br>Q = <b>' + Q.toFixed(3) + ' MeV</b> (Δm = ' + ((Ms - Md) * 1e6).toFixed(1) + ' μu)';
      if (R.dx.length === 2) { var m1 = MASSE[R.dx[0]][0], m2 = MASSE[R.dx[1]][0], dc = dueCorpi(Q, m1, m2); testo += '<br>' + MASSE[R.dx[0]][3] + ': ' + dc.T1.toFixed(3) + ' MeV · ' + MASSE[R.dx[1]][3] + ': ' + dc.T2.toFixed(3) + ' MeV'; }
      testo += '<br>' + t('Energia per kg di combustibile: ', 'Energy per kg of fuel: ') + fmt(Q * 1.602176634e-13 / (Ms * 1.66053906660e-27)) + ' J/kg (' + t('benzina ≈ 4,6·10⁷', 'petrol ≈ 4.6·10⁷') + ')';
      info.innerHTML = testo;
      var xs = [], ys = []; for (var A = 20; A <= 260; A += 2) { xs.push(A); ys.push(qFissioneSim(A, Math.round(zStabile(A)))); }
      F.grafico(tela2, { serie: [{ x: xs, y: ys, col: '#ff8a80', etich: 'Q_fiss' }], linee: [{ y: 0, col: '#34465f' }], punti: [{ x: 236, y: qFissioneSim(236, 92), col: '#ffd24a', r: 5 }], xmin: 20, xmax: 260, xl: ['A del nucleo che si divide in due metà', 'A of the nucleus splitting in two halves'], yl: ['Q (MeV)', 'Q (MeV)'], descr: ['Q della fissione simmetrica dalla formula semiempirica', 'Symmetric fission Q from the semi-empirical formula'] });
    }
    disegna(); F.alRidimensiona(disegna);
  }

  /* ─── 3. Barriera, tunnel, Geiger–Nuttall, picco di Gamow ──────────────── */
  function schedaTunnel(div) {
    var G = griglia(div), pan = G.pan, st = { k: 1, T: 15.7, fus: 'pp' };
    eq(pan, 'G = (2/ħ)√(2μQ)·b·[arccos√x − √(x(1−x))], x = R/b');
    F.scelta(pan, ['Emettitore α', 'α emitter'], ALFA.map(function (a, i) { return [String(i), a[0] + ' (Q = ' + a[3] + ' MeV)']; }), '1', function (v) { st.k = +v; disegna(); });
    F.scelta(pan, ['Fusione nelle stelle', 'Stellar fusion'], [['pp', 'p + p'], ['dd', 'D + D'], ['dt', 'D + T'], ['cc', '¹²C + ¹²C']], st.fus, function (v) { st.fus = v; disegna(); });
    F.cursore(pan, ['Temperatura (milioni di K)', 'Temperature (million K)'], 1, 1000, 1, st.T, function (v) { st.T = v; disegna(); });
    var info = nota(pan);
    nota(pan, t('Una particella α con 4–9 MeV non potrebbe superare una barriera di 25–30 MeV: passa per effetto tunnel (Gamow, Gurney e Condon, 1928). La probabilità per urto è e^(−G) e G dipende da Q come Z/√Q: per questo un piccolo cambiamento di Q sposta l’emivita di molti ordini di grandezza (Geiger–Nuttall). Nelle stelle la stessa barriera fa sì che la fusione avvenga in una finestra stretta di energie, il picco di Gamow, dove la coda di Maxwell–Boltzmann incontra la probabilità di tunnel.',
      'An α particle with 4–9 MeV could not climb a 25–30 MeV barrier: it tunnels through (Gamow, Gurney and Condon, 1928). The probability per hit is e^(−G) and G depends on Q as Z/√Q: so a small change of Q moves the half-life by many orders of magnitude (Geiger–Nuttall). In stars the same barrier makes fusion happen in a narrow energy window, the Gamow peak, where the Maxwell–Boltzmann tail meets the tunnelling probability.'));
    var tela = F.tela(G.dx, 0.42), tela2 = F.tela(G.dx, 0.42), tela3 = F.tela(G.dx, 0.36);
    var FUS = { pp: [1, 1, 1.00727646688, 1.00727646688], dd: [1, 1, 2.01355321, 2.01355321], dt: [1, 1, 2.01355321, 3.01550071], cc: [6, 6, 12, 12] };
    function disegna() {
      var a = ALFA[st.k], Zd = a[1] - 2, Ad = a[2] - 4, g = gamowAlfa(a[3], Zd, Ad), xs = [], ys = [], yq = [];
      for (var i = 0; i <= 300; i++) { var r = 0.5 + 99.5 * i / 300; xs.push(r); ys.push(r < g.R ? -35 : 2 * Zd * E2 / r); yq.push(a[3]); }
      F.grafico(tela, { serie: [{ x: xs, y: ys, col: '#5eead4', etich: 'V(r)' }, { x: xs, y: yq, col: '#ffd24a', tratt: true, etich: 'Q' }], xmin: 0, xmax: 100, ymin: -40, ymax: 40, xl: ['r (fm)', 'r (fm)'], yl: ['energia (MeV)', 'energy (MeV)'], legenda: [{ col: '#5eead4', etich: ['buca nucleare + Coulomb', 'nuclear well + Coulomb'] }, { col: '#ffd24a', etich: ['energia Q dell’α', 'α energy Q'] }], descr: ['Barriera di Coulomb per il decadimento α', 'Coulomb barrier for α decay'] });
      var p1 = [], p2 = [], xm = [], ym = [];
      ALFA.forEach(function (b) { var x = b[1] - 2; p1.push({ x: x / Math.sqrt(b[3]), y: Math.log10(b[4]), col: b === a ? '#ff8a80' : '#ffffff', r: b === a ? 6 : 4 }); });
      for (i = 0; i <= 60; i++) { var Q = 4 + 5 * i / 60; xm.push(82 / Math.sqrt(Q)); ym.push(Math.log10(emivitaAlfa(Q, 82, 208))); }
      var xm2 = [], ym2 = []; for (i = 0; i <= 60; i++) { var Q2 = 4 + 5 * i / 60; xm2.push(90 / Math.sqrt(Q2)); ym2.push(Math.log10(emivitaAlfa(Q2, 90, 234))); }
      F.grafico(tela2, { serie: [{ x: xm, y: ym, col: '#6bcfff', etich: 'Z_d = 82' }, { x: xm2, y: ym2, col: '#c49bff', etich: 'Z_d = 90' }], punti: p1, xmin: 26, xmax: 46, ymin: -9, ymax: 20, xl: ['Z_figlia/√(Q/MeV)', 'Z_daughter/√(Q/MeV)'], yl: ['log₁₀ t½ (s)', 'log₁₀ t½ (s)'], legenda: [{ col: '#ffffff', etich: ['misurate', 'measured'] }, { col: '#6bcfff', etich: ['Gamow, Z_figlia = 82', 'Gamow, Z_daughter = 82'] }, { col: '#c49bff', etich: ['Gamow, Z_figlia = 90', 'Gamow, Z_daughter = 90'] }], descr: ['Legge di Geiger–Nuttall: emivite contro Z/√Q', 'Geiger–Nuttall law: half-lives versus Z/√Q'] });
      var f = FUS[st.fus], EG = energiaGamow(f[0], f[1], f[2], f[3]), kT = 8.617333262e-5 * st.T * 1e6 / 1000, pk = piccoGamow(EG * 1000, kT); /* keV */
      var xe = [], ye = [], ym3 = [], yt = [], Emax = pk.E0 * 3, mx = integrandoGamow(pk.E0, EG * 1000, kT);
      for (i = 1; i <= 300; i++) { var E = Emax * i / 300; xe.push(E); ye.push(integrandoGamow(E, EG * 1000, kT) / mx); ym3.push(Math.exp(-E / kT) / Math.exp(-pk.E0 / kT) * 0.5); yt.push(Math.exp(-Math.sqrt(EG * 1000 / E)) / Math.exp(-Math.sqrt(EG * 1000 / pk.E0)) * 0.5); }
      F.grafico(tela3, { serie: [{ x: xe, y: ym3, col: '#6bcfff', tratt: true, etich: 'e^(−E/kT)' }, { x: xe, y: yt, col: '#c49bff', tratt: true, etich: 'e^(−√(E_G/E))' }, { x: xe, y: ye, col: '#ffd24a', etich: t('prodotto', 'product') }], xmin: 0, xmax: Emax, ymin: 0, ymax: 1.1, xl: ['energia nel centro di massa (keV)', 'centre-of-mass energy (keV)'], yl: ['scala relativa', 'relative scale'], legenda: [{ col: '#6bcfff', etich: ['Maxwell–Boltzmann', 'Maxwell–Boltzmann'] }, { col: '#c49bff', etich: ['tunnel', 'tunnelling'] }, { col: '#ffd24a', etich: ['picco di Gamow', 'Gamow peak'] }], descr: ['Picco di Gamow delle reazioni termonucleari', 'Gamow peak of thermonuclear reactions'] });
      var tm = emivitaAlfa(a[3], Zd, Ad);
      info.innerHTML = '<b>' + a[0] + '</b>: R = ' + g.R.toFixed(2) + ' fm, b = ' + g.b.toFixed(1) + ' fm, ' + t('barriera ', 'barrier ') + fmt(2 * Zd * E2 / g.R) + ' MeV<br>G = <b>' + g.G.toFixed(2) + '</b>, e^(−G) = ' + Math.exp(-g.G).toExponential(2) + '<br>t½ ' + t('Gamow', 'Gamow') + ' = <b>' + tm.toExponential(2) + ' s</b> · ' + t('misurata ', 'measured ') + a[4].toExponential(2) + ' s<br>' +
        t('Fusione: ', 'Fusion: ') + 'E_G = ' + fmt(EG * 1000) + ' keV, kT = ' + fmt(kT) + ' keV → E₀ = <b>' + fmt(pk.E0) + ' keV</b>, Δ = ' + fmt(pk.larghezza) + ' keV';
    }
    disegna(); F.alRidimensiona(disegna);
  }

  /* ─── 4. Il nucleo in 3D ───────────────────────────────────────────────── */
  var NUCLIDI = [['4,2', '⁴He'], ['12,6', '¹²C'], ['16,8', '¹⁶O'], ['40,20', '⁴⁰Ca'], ['56,26', '⁵⁶Fe'], ['120,50', '¹²⁰Sn'], ['208,82', '²⁰⁸Pb'], ['238,92', '²³⁸U']];
  function schedaNucleo(pan, destra) {
    var st = { A: 56, Z: 26, calcolo: null };
    eq(pan, 'R = r₀ A^(1/3),  r₀ ≈ 1,2 fm;  ρ ≈ 0,16 nucleoni/fm³');
    F.scelta(pan, ['Nuclide', 'Nuclide'], NUCLIDI, '56,26', function (v) { var p = v.split(','); st.A = +p[0]; st.Z = +p[1]; cA.value = st.A; cZ.value = st.Z; ricostruisci(); });
    var cA = F.cursore(pan, ['A', 'A'], 1, 240, 1, st.A, function (v) { st.A = v; st.Z = Math.min(st.Z, v); ricostruisci(); });
    var cZ = F.cursore(pan, ['Z', 'Z'], 0, 100, 1, st.Z, function (v) { st.Z = Math.min(v, st.A); ricostruisci(); });
    var info = nota(pan);
    nota(pan, t('Il nucleo è una goccia: i nucleoni stanno a contatto, a distanza di circa 1 fm, e la densità al centro è quasi la stessa per tutti i nuclei (0,16 nucleoni/fm³, 2,7·10¹⁷ kg/m³). Per questo il volume cresce come A e il raggio come A^(1/3). Il disegno impacchetta A sfere di diametro 1 fm con un rilassamento meccanico; quali siano protoni è casuale: nella meccanica quantistica i nucleoni non hanno posizioni definite, il disegno mostra solo dimensioni e proporzioni.',
      'The nucleus is a droplet: nucleons touch, about 1 fm apart, and the central density is nearly the same for all nuclei (0.16 nucleons/fm³, 2.7·10¹⁷ kg/m³). That is why the volume grows as A and the radius as A^(1/3). The drawing packs A spheres of diameter 1 fm with a mechanical relaxation; which ones are protons is random: in quantum mechanics nucleons have no definite positions, the drawing shows only sizes and proportions.'));
    var tela = F.tela(destra, 0.36), cb = {}, timer = null;
    function ricostruisci() {
      var v = termini(st.A, st.Z), R = raggio(st.A);
      info.innerHTML = '<b>' + nomeNuclide(st.A, st.Z) + '</b>: Z = ' + st.Z + ', N = ' + (st.A - st.Z) + '<br>R = <b>' + R.toFixed(2) + ' fm</b>, ' + t('volume ', 'volume ') + fmt(4 / 3 * PI * R * R * R) + ' fm³<br>B (SEMF) = ' + fmt(v.B) + ' MeV, B/A = ' + fmt(v.B / st.A) + ' MeV';
      var barre = [['vol', '#5eead4'], ['sup', '#ff8a80'], ['coul', '#ffd24a'], ['asim', '#c49bff'], ['acc', '#6bcfff']].map(function (c, i) { return { x: i, y: v[c[0]] / st.A, col: c[1], larg: 22 }; });
      barre.push({ x: 5, y: v.B / st.A, col: '#ffffff', larg: 22 });
      F.grafico(tela, { barre: barre, linee: [{ y: 0, col: '#34465f' }], xmin: -0.6, xmax: 5.6, xl: ['volume · superficie · Coulomb · asimmetria · accoppiamento · totale', 'volume · surface · Coulomb · asymmetry · pairing · total'], yl: ['MeV per nucleone', 'MeV per nucleon'], descr: ['I cinque termini della formula semiempirica per nucleone', 'The five semi-empirical terms per nucleon'] });
      clearTimeout(timer); timer = setTimeout(function () { if (cb.nuovo) cb.nuovo(); }, 60);
    }
    ricostruisci();
    return {
      tre: function (S, T, L3) {
        var gr = null, mezzo = new T.Group(); S.aggiungi(mezzo);
        var pelle = new T.Mesh(new T.SphereGeometry(1, 48, 32), new T.MeshPhongMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.07, depthWrite: false, side: T.DoubleSide })); S.aggiungi(pelle);
        var luce = new T.PointLight(0xffffff, 0.6, 60); luce.position.set(10, -10, 14); S.aggiungi(luce);
        cb.nuovo = function () {
          if (gr) { mezzo.remove(gr); gr.geometry.dispose(); gr.material.dispose(); }
          var P = impacchetta(st.A, st.Z, st.A * 131 + st.Z), A = st.A, M4 = new T.Matrix4(), col = new T.Color(), rmax = 0;
          gr = new T.InstancedMesh(new T.SphereGeometry(0.5, 18, 12), new T.MeshStandardMaterial({ roughness: 0.35, metalness: 0.15 }), A);
          for (var i = 0; i < A; i++) { M4.makeTranslation(P.p[3 * i], P.p[3 * i + 1], P.p[3 * i + 2]); gr.setMatrixAt(i, M4); gr.setColorAt(i, P.protone[i] ? col.setRGB(0.95, 0.33, 0.33) : col.setRGB(0.42, 0.72, 1)); rmax = Math.max(rmax, Math.hypot(P.p[3 * i], P.p[3 * i + 1], P.p[3 * i + 2]) + 0.5); }
          mezzo.add(gr); pelle.scale.setScalar(raggio(A));
          S.didascalia.textContent = nomeNuclide(A, st.Z) + t(': ', ': ') + st.Z + t(' protoni (rossi), ', ' protons (red), ') + (A - st.Z) + t(' neutroni (azzurri) · R = ', ' neutrons (blue) · R = ') + raggio(A).toFixed(2) + ' fm';
          S.inquadra(Math.max(6, raggio(A) * 4.2));
        };
        cb.nuovo();
        var tt = 0;
        S.ogniFotogramma(function (dt) { tt += dt; mezzo.rotation.z += dt * 0.25; mezzo.rotation.x = 0.25 * Math.sin(tt * 0.3); var s = 1 + 0.012 * Math.sin(tt * 2.1); mezzo.scale.set(s, s, 1 / (s * s)); return true; });
      }
    };
  }

  /* ─── 5. Cinetica del reattore ─────────────────────────────────────────── */
  function schedaReattore(pan, destra) {
    var P = REATTORE, st = { rho: 0, x: equilibrio(1, P), t: 0, storia: [], sbarra: false };
    eq(pan, 'n₊/n₀ = β/(β − ρ);  ρ = ωΛ + ωβ/(ω + λ)');
    var cR = F.cursore(pan, ['Reattività ρ (pcm)', 'Reactivity ρ (pcm)'], -1000, 600, 10, 0, function (v) { st.rho = v * 1e-5; testo(); });
    F.bottone(pan, ['SCRAM (ρ = −5000 pcm)', 'SCRAM (ρ = −5000 pcm)'], function () { st.rho = -0.05; testo(); });
    F.bottone(pan, ['Riporta a regime (n = 1, ρ = 0)', 'Back to steady state (n = 1, ρ = 0)'], function () { st.rho = 0; cR.value = 0; cR.dispatchEvent(new Event('input')); st.x = equilibrio(1, P); st.t = 0; st.storia = []; testo(); });
    var info = nota(pan);
    nota(pan, t('Un reattore è controllabile grazie allo 0,65 % di neutroni RITARDATI (emessi secondi dopo dai prodotti di fissione): con i soli neutroni pronti la potenza crescerebbe di e ogni Λ/ρ ≈ 0,1 s. Un gradino di reattività provoca un salto pronto quasi istantaneo, n₊/n₀ = β/(β − ρ), poi una crescita lenta con il periodo T = 1/ω dell’equazione inhour. Se ρ ≥ β il reattore è critico con i soli pronti: escursione rapidissima (Černobyl’). Modello a un gruppo: β = 0,0065, λ = 0,0767 s⁻¹, Λ = 10⁻⁴ s.',
      'A reactor is controllable thanks to the 0.65 % of DELAYED neutrons (emitted seconds later by fission products): with prompt neutrons alone power would grow by e every Λ/ρ ≈ 0.1 s. A reactivity step causes an almost instantaneous prompt jump, n₊/n₀ = β/(β − ρ), then slow growth with the period T = 1/ω from the inhour equation. If ρ ≥ β the reactor is prompt critical: a very fast excursion (Chernobyl). One-group model: β = 0.0065, λ = 0.0767 s⁻¹, Λ = 10⁻⁴ s.'));
    var tela = F.tela(destra, 0.4), cb = {};
    function testo() {
      var w = inhour(st.rho, P);
      info.innerHTML = 'ρ = <b>' + Math.round(st.rho * 1e5) + ' pcm</b> = ' + fmt(st.rho / P.beta) + ' $<br>' + t('Salto pronto β/(β − ρ) = ', 'Prompt jump β/(β − ρ) = ') + '<b>' + (st.rho < P.beta ? fmt(saltoPronto(st.rho, P)) : '∞') + '</b><br>' +
        t('Periodo stabile 1/ω = ', 'Stable period 1/ω = ') + '<b>' + (Math.abs(w) > 1e-9 ? fmt(1 / w) + ' s' : '∞') + '</b><br>' + t('Potenza ora: ', 'Power now: ') + '<b>' + fmt(st.x[0]) + '</b> × ' + t('iniziale', 'initial') + ' · t = ' + st.t.toFixed(1) + ' s';
    }
    function grafico() {
      var xs = st.storia.map(function (p) { return p[0]; }), ys = st.storia.map(function (p) { return Math.log10(Math.max(1e-6, p[1])); });
      F.grafico(tela, { serie: [{ x: xs.length ? xs : [0], y: ys.length ? ys : [0], col: '#6bcfff', etich: 'log₁₀ n' }], xmin: Math.max(0, st.t - 60), xmax: Math.max(60, st.t), ymin: -3, ymax: 3, xl: ['tempo (s)', 'time (s)'], yl: ['log₁₀ (potenza relativa)', 'log₁₀ (relative power)'], linee: [{ y: 0, col: '#34465f', etich: t('regime', 'steady') }], descr: ['Potenza del reattore nel tempo', 'Reactor power over time'] });
    }
    testo(); grafico(); F.alRidimensiona(grafico);
    function avanza(dt) {
      var h = dt * 2; /* il doppio del tempo reale */
      st.x = cineticaEvolvi(st.x, st.rho, h, P); st.t += h;
      if (st.x[0] > 1e3) { st.x = [1e3, st.x[1] * 1e3 / st.x[0]]; }
      st.storia.push([st.t, st.x[0]]); if (st.storia.length > 1500) st.storia.shift();
    }
    return {
      tre: function (S, T, L3) {
        /* vasca, griglia di barre di combustibile, barre di controllo, bagliore Čerenkov */
        var n = 11, passo = 0.42, comb = [], ctrl = [], i, j;
        for (i = 0; i < n; i++) for (j = 0; j < n; j++) { var x = (i - (n - 1) / 2) * passo, y = (j - (n - 1) / 2) * passo; if (Math.hypot(x, y) > 2.4) continue; if ((i % 3 === 1) && (j % 3 === 1)) ctrl.push([x, y]); else comb.push([x, y]); }
        var mc = new T.InstancedMesh(new T.CylinderGeometry(0.11, 0.11, 4, 12), new T.MeshStandardMaterial({ color: 0x9aa6b4, metalness: 0.7, roughness: 0.35, emissive: 0x1a4fff, emissiveIntensity: 0.2 }), comb.length), M4 = new T.Matrix4(), Rx = new T.Matrix4().makeRotationX(PI / 2);
        comb.forEach(function (p, k) { M4.makeTranslation(p[0], p[1], 0).multiply(Rx); mc.setMatrixAt(k, M4); });
        S.aggiungi(mc);
        var gc = new T.Group(); S.aggiungi(gc);
        ctrl.forEach(function (p) { var b = new T.Mesh(new T.CylinderGeometry(0.15, 0.15, 4.4, 14), new T.MeshStandardMaterial({ color: 0x2b2f36, metalness: 0.5, roughness: 0.6 })); b.rotation.x = PI / 2; b.position.set(p[0], p[1], 0); gc.add(b); });
        var vasca = new T.Mesh(new T.CylinderGeometry(3.4, 3.4, 7, 48, 1, true), new T.MeshPhongMaterial({ color: 0x1a5fae, transparent: true, opacity: 0.16, side: T.DoubleSide, depthWrite: false })); vasca.rotation.x = PI / 2; vasca.position.z = 1.2; S.aggiungi(vasca);
        var acqua = new T.Mesh(new T.CircleGeometry(3.4, 48), new T.MeshPhongMaterial({ color: 0x3a8fe0, transparent: true, opacity: 0.25, depthWrite: false })); acqua.position.z = 4.6; S.aggiungi(acqua);
        var fondo = new T.Mesh(new T.CircleGeometry(3.4, 48), new T.MeshStandardMaterial({ color: 0x1c2a3a })); fondo.position.z = -2.3; S.aggiungi(fondo);
        var glow = bagliore(T, 0x3b7bff, 4.5); S.aggiungi(glow);
        var glow2 = bagliore(T, 0x7fb2ff, 2.6); S.aggiungi(glow2);
        var luce = new T.PointLight(0x4d8dff, 1, 14); S.aggiungi(luce);
        /* particelle di luce Čerenkov che salgono */
        var NP = 600, pp = new Float32Array(NP * 3), rnd = mulberry32(3), pg = new T.BufferGeometry();
        for (i = 0; i < NP; i++) { var a = 2 * PI * rnd(), r = 2.4 * Math.sqrt(rnd()); pp[3 * i] = r * Math.cos(a); pp[3 * i + 1] = r * Math.sin(a); pp[3 * i + 2] = -2 + 6 * rnd(); }
        pg.setAttribute('position', new T.BufferAttribute(pp, 3));
        var pm = new T.PointsMaterial({ color: 0x6aa8ff, size: 0.06, transparent: true, opacity: 0.6, blending: T.AdditiveBlending, depthWrite: false }); S.aggiungi(new T.Points(pg, pm));
        var tg = 0;
        S.ogniFotogramma(function (dt) {
          avanza(dt);
          var lp = Math.log10(Math.max(1e-4, st.x[0])), k = Math.max(0, Math.min(1.6, (lp + 3) / 3)); /* 1 a regime */
          glow.material.opacity = Math.min(1, 0.15 + 0.6 * k); glow2.material.opacity = Math.min(1, 0.1 + 0.7 * k); glow.scale.setScalar(3.5 + 1.5 * k); luce.intensity = 0.2 + 1.2 * k;
          pm.opacity = Math.min(0.9, 0.08 + 0.55 * k); mc.material.emissiveIntensity = 0.05 + 0.4 * k;
          for (var i = 0; i < NP; i++) { pp[3 * i + 2] += dt * (0.4 + 0.8 * k); if (pp[3 * i + 2] > 4.5) pp[3 * i + 2] = -2; }
          pg.attributes.position.needsUpdate = true;
          /* barre: piu' alte = piu' estratte; la posizione segue ρ */
          var bersaglio = 2.2 * Math.max(-1, Math.min(1, st.rho / 0.006)) + 0.6;
          gc.position.z += (bersaglio - gc.position.z) * Math.min(1, dt * (st.rho < -0.01 ? 12 : 2));
          tg += dt; if (tg > 0.15) { tg = 0; grafico(); testo(); S.didascalia.textContent = t('Nocciolo in piscina: potenza ', 'Pool core: power ') + fmt(st.x[0]) + t(' × regime · barre di controllo ', ' × steady · control rods ') + (gc.position.z > 0.6 ? t('estratte', 'withdrawn') : t('inserite', 'inserted')); }
          return true;
        });
        S.inquadra(13, -0.9, 1.05);
      }
    };
  }

  F.sezione('sfisnuclei', {
    titolo: ['☢️ Nuclei e reazioni', '☢️ Nuclei and reactions'],
    sotto: ['La formula semiempirica e la valle di stabilità in 3D, i valori Q di fusione, decadimento α e fissione dalle masse atomiche, la barriera di Coulomb attraversata per effetto tunnel (Geiger–Nuttall, picco di Gamow), il nucleo come goccia di nucleoni e la cinetica di un reattore.', 'The semi-empirical formula and the valley of stability in 3D, Q values of fusion, α decay and fission from atomic masses, the Coulomb barrier crossed by tunnelling (Geiger–Nuttall, Gamow peak), the nucleus as a droplet of nucleons and reactor kinetics.'],
    schede: [
      { nome: ['⛰️ Valle di stabilità', '⛰️ Valley of stability'], costruisci: scheda3D(schedaValle) },
      { nome: ['⚖️ Valori Q', '⚖️ Q values'], costruisci: schedaQ },
      { nome: ['🚇 Barriera e tunnel', '🚇 Barrier and tunnelling'], costruisci: schedaTunnel },
      { nome: ['🔴 Nucleo 3D', '🔴 3D nucleus'], costruisci: scheda3D(schedaNucleo) },
      { nome: ['⚛️ Reattore', '⚛️ Reactor'], costruisci: scheda3D(schedaReattore) }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
