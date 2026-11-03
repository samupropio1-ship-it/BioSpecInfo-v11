/* ═══════════════════════════════════════════════════════════════════════════
   bsi-fis-cristalli.js — cristallografia e raggi X
   BioSpecInfo · © Samuele Pio Provenzano

   · I 14 RETICOLI DI BRAVAIS disegnati in prospettiva dai loro parametri
     (a, b, c, α, β, γ) e dal tipo di centratura (P, I, F, C, R), da girare
     col dito o col mouse.
   · GLI INDICI DI MILLER: il piano (hkl) dentro la cella cubica e la distanza
     interplanare d per i sistemi cubico, tetragonale, ortorombico, esagonale.
   · IL DIFFRATTOGRAMMA DI POLVERE: per ogni (hkl) la legge di Bragg
     λ = 2d sinθ da' la posizione; il FATTORE DI STRUTTURA
     F(hkl) = Σ f_j e^(2πi(hx_j + ky_j + lz_j)) l'intensita' — e con lui le
     ESTINZIONI SISTEMATICHE (fcc: h, k, l non tutti pari o tutti dispari
     mancano; bcc: h+k+l dispari manca; diamante: in piu' le h+k+l = 4n+2) —,
     moltiplicata per la molteplicita' e per il fattore di Lorentz-
     polarizzazione (1 + cos²2θ)/(sin²θ cosθ). I fattori di forma atomici
     sono approssimati (Z con un decadimento gaussiano in sinθ/λ): le
     POSIZIONI dei picchi sono esatte, le intensita' sono indicative.
   · LE CELLE IN 3D (v238): cubica semplice, CCC, CFC, esagonale compatta,
     NaCl, CsCl, diamante, con i piani (hkl), gli atomi per cella, la
     coordinazione e la frazione di impaccamento contati sulle sfere.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t;
  var RAD = Math.PI / 180;

  var BRAVAIS = [
    { s: ['Cubico', 'Cubic'], c: 'P', a: 1, b: 1, c2: 1, al: 90, be: 90, ga: 90 },
    { s: ['Cubico', 'Cubic'], c: 'I', a: 1, b: 1, c2: 1, al: 90, be: 90, ga: 90 },
    { s: ['Cubico', 'Cubic'], c: 'F', a: 1, b: 1, c2: 1, al: 90, be: 90, ga: 90 },
    { s: ['Tetragonale', 'Tetragonal'], c: 'P', a: 1, b: 1, c2: 1.5, al: 90, be: 90, ga: 90 },
    { s: ['Tetragonale', 'Tetragonal'], c: 'I', a: 1, b: 1, c2: 1.5, al: 90, be: 90, ga: 90 },
    { s: ['Ortorombico', 'Orthorhombic'], c: 'P', a: 1, b: 1.3, c2: 1.7, al: 90, be: 90, ga: 90 },
    { s: ['Ortorombico', 'Orthorhombic'], c: 'C', a: 1, b: 1.3, c2: 1.7, al: 90, be: 90, ga: 90 },
    { s: ['Ortorombico', 'Orthorhombic'], c: 'I', a: 1, b: 1.3, c2: 1.7, al: 90, be: 90, ga: 90 },
    { s: ['Ortorombico', 'Orthorhombic'], c: 'F', a: 1, b: 1.3, c2: 1.7, al: 90, be: 90, ga: 90 },
    { s: ['Esagonale', 'Hexagonal'], c: 'P', a: 1, b: 1, c2: 1.6, al: 90, be: 90, ga: 120 },
    { s: ['Romboedrico', 'Rhombohedral'], c: 'R', a: 1, b: 1, c2: 1, al: 70, be: 70, ga: 70 },
    { s: ['Monoclino', 'Monoclinic'], c: 'P', a: 1, b: 1.3, c2: 1.6, al: 90, be: 110, ga: 90 },
    { s: ['Monoclino', 'Monoclinic'], c: 'C', a: 1, b: 1.3, c2: 1.6, al: 90, be: 110, ga: 90 },
    { s: ['Triclino', 'Triclinic'], c: 'P', a: 1, b: 1.2, c2: 1.5, al: 75, be: 82, ga: 105 }
  ];
  var CENTRI = { P: [], I: [[0.5, 0.5, 0.5]], F: [[0.5, 0.5, 0], [0.5, 0, 0.5], [0, 0.5, 0.5]], C: [[0.5, 0.5, 0]], R: [] };
  function vettori(L) {
    var a = L.a, b = L.b, c = L.c2, al = L.al * RAD, be = L.be * RAD, ga = L.ga * RAD;
    var cx = c * Math.cos(be), cy = c * (Math.cos(al) - Math.cos(be) * Math.cos(ga)) / Math.sin(ga), cz = Math.sqrt(Math.max(0, c * c - cx * cx - cy * cy));
    return [[a, 0, 0], [b * Math.cos(ga), b * Math.sin(ga), 0], [cx, cy, cz]];
  }

  /* fcc, bcc, cubico semplice: le traslazioni del reticolo */
  var TR = { F: [[0, 0, 0], [0.5, 0.5, 0], [0.5, 0, 0.5], [0, 0.5, 0.5]], I: [[0, 0, 0], [0.5, 0.5, 0.5]], P: [[0, 0, 0]] };
  /* le strutture: costante di cella a (Å, temperatura ambiente) e la base */
  var STRUTTURE = {
    NaCl: { nome: 'NaCl (salgemma)', a: 5.6402, ret: 'F', base: [['Na', 11, [0, 0, 0]], ['Cl', 17, [0.5, 0, 0]]] },
    KCl:  { nome: 'KCl (silvite)', a: 6.2917, ret: 'F', base: [['K', 19, [0, 0, 0]], ['Cl', 17, [0.5, 0, 0]]] },
    MgO:  { nome: 'MgO (periclasio)', a: 4.2112, ret: 'F', base: [['Mg', 12, [0, 0, 0]], ['O', 8, [0.5, 0, 0]]] },
    CsCl: { nome: 'CsCl', a: 4.123, ret: 'P', base: [['Cs', 55, [0, 0, 0]], ['Cl', 17, [0.5, 0.5, 0.5]]] },
    Cu:   { nome: 'Cu (fcc)', a: 3.6149, ret: 'F', base: [['Cu', 29, [0, 0, 0]]] },
    Al:   { nome: 'Al (fcc)', a: 4.0495, ret: 'F', base: [['Al', 13, [0, 0, 0]]] },
    Fe:   { nome: 'α-Fe (bcc)', a: 2.8665, ret: 'I', base: [['Fe', 26, [0, 0, 0]]] },
    W:    { nome: 'W (bcc)', a: 3.1652, ret: 'I', base: [['W', 74, [0, 0, 0]]] },
    C:    { nome: 'C (diamante)', a: 3.5668, ret: 'F', base: [['C', 6, [0, 0, 0]], ['C', 6, [0.25, 0.25, 0.25]]] },
    Si:   { nome: 'Si (diamante)', a: 5.4309, ret: 'F', base: [['Si', 14, [0, 0, 0]], ['Si', 14, [0.25, 0.25, 0.25]]] },
    ZnS:  { nome: 'ZnS (blenda)', a: 5.4093, ret: 'F', base: [['Zn', 30, [0, 0, 0]], ['S', 16, [0.25, 0.25, 0.25]]] }
  };
  var LAMBDA = { 'Cu Kα': 1.5406, 'Co Kα': 1.78897, 'Mo Kα': 0.71073 };
  /* fattore di forma approssimato: Z con un decadimento gaussiano */
  function fForma(Z, s) { return Z * (0.55 * Math.exp(-12 * s * s) + 0.45 * Math.exp(-1.2 * s * s)); }
  function fattoreStruttura(S, h, k, l, s) {
    var re = 0, im = 0;
    TR[S.ret].forEach(function (tr) {
      S.base.forEach(function (at) {
        var x = at[2][0] + tr[0], y = at[2][1] + tr[1], z = at[2][2] + tr[2], ph = 2 * Math.PI * (h * x + k * y + l * z), f = fForma(at[1], s);
        re += f * Math.cos(ph); im += f * Math.sin(ph);
      });
    });
    return { re: re, im: im, I: re * re + im * im };
  }
  function diffrattogramma(S, lam, ttMax) {
    var picchi = {}, hmax = Math.ceil(2 * S.a / lam) + 1;
    for (var h = -hmax; h <= hmax; h++) for (var k = -hmax; k <= hmax; k++) for (var l = -hmax; l <= hmax; l++) {
      if (!h && !k && !l) continue;
      var d = S.a / Math.sqrt(h * h + k * k + l * l), sn = lam / (2 * d);
      if (sn >= 1) continue;
      var tt = 2 * Math.asin(sn) / RAD; if (tt > ttMax) continue;
      var Fs = fattoreStruttura(S, h, k, l, sn / lam);
      var chiave = [Math.abs(h), Math.abs(k), Math.abs(l)].sort(function (x, y) { return y - x; }).join('');
      if (!picchi[chiave]) picchi[chiave] = { hkl: chiave, d: d, tt: tt, m: 0, F2: Fs.I };
      picchi[chiave].m++;
    }
    var out = Object.keys(picchi).map(function (k2) { return picchi[k2]; });
    out.forEach(function (p) { var th = p.tt / 2 * RAD; p.LP = (1 + Math.pow(Math.cos(2 * th), 2)) / (Math.sin(th) * Math.sin(th) * Math.cos(th)); p.I = p.F2 * p.m * p.LP; });
    var mx = Math.max.apply(null, out.map(function (p) { return p.I; }));
    out.forEach(function (p) { p.Irel = 100 * p.I / mx; });
    return out.sort(function (a, b) { return a.tt - b.tt; });
  }
  function dSpaziatura(sistema, p, h, k, l) {
    if (sistema === 'cubico') return p.a / Math.sqrt(h * h + k * k + l * l);
    if (sistema === 'tetragonale') return 1 / Math.sqrt((h * h + k * k) / (p.a * p.a) + l * l / (p.c * p.c));
    if (sistema === 'ortorombico') return 1 / Math.sqrt(h * h / (p.a * p.a) + k * k / (p.b * p.b) + l * l / (p.c * p.c));
    return 1 / Math.sqrt(4 / 3 * (h * h + h * k + k * k) / (p.a * p.a) + l * l / (p.c * p.c));
  }
  /* ── v238: le celle elementari in 3D ──────────────────────────────────────
     Ogni struttura e' la cella convenzionale (cubiche) o primitiva (esagonale
     compatta) con TUTTI gli atomi della base in coordinate frazionarie. Da qui
     si calcolano, senza formule imparate a memoria:
     · gli atomi per cella, contando ogni atomo disegnato con il suo peso (1/8
       ai vertici, 1/4 sugli spigoli, 1/2 sulle facce);
     · la distanza fra primi vicini e il numero di coordinazione, dalle
       immagini periodiche;
     · la frazione di impaccamento: sfere a contatto (metalli, diamante) o con
       i raggi ionici di Shannon (NaCl, CsCl), volume delle sfere / volume
       della cella;
     · il fattore di struttura del piano (hkl) con F = Σ Z e^(2πi(hx+ky+lz)):
       se e' nullo il riflesso e' estinto. */
  var CELLE = {
    sc: { nome: ['Cubica semplice (α-Po)', 'Simple cubic (α-Po)'], sis: 'cubico', a: 3.359, base: [['Po', 84, [0, 0, 0]]], el: { Po: 0xc9a0ff } },
    bcc: { nome: ['Cubica a corpo centrato (α-Fe)', 'Body-centred cubic (α-Fe)'], sis: 'cubico', a: 2.8665, base: [['Fe', 26, [0, 0, 0]], ['Fe', 26, [0.5, 0.5, 0.5]]], el: { Fe: 0xe0a070 } },
    fcc: { nome: ['Cubica a facce centrate (Cu)', 'Face-centred cubic (Cu)'], sis: 'cubico', a: 3.6149, base: [['Cu', 29, [0, 0, 0]], ['Cu', 29, [0.5, 0.5, 0]], ['Cu', 29, [0.5, 0, 0.5]], ['Cu', 29, [0, 0.5, 0.5]]], el: { Cu: 0xd9895b } },
    hcp: { nome: ['Esagonale compatta (Mg)', 'Hexagonal close-packed (Mg)'], sis: 'esagonale', esa: true, a: 3.2094, c: 5.2108, base: [['Mg', 12, [0, 0, 0]], ['Mg', 12, [2 / 3, 1 / 3, 0.5]]], el: { Mg: 0xa8e07a } },
    nacl: { nome: ['Salgemma NaCl', 'Rock salt NaCl'], sis: 'cubico', a: 5.6402, base: [['Na', 11, [0, 0, 0]], ['Na', 11, [0.5, 0.5, 0]], ['Na', 11, [0.5, 0, 0.5]], ['Na', 11, [0, 0.5, 0.5]], ['Cl', 17, [0.5, 0, 0]], ['Cl', 17, [0, 0.5, 0]], ['Cl', 17, [0, 0, 0.5]], ['Cl', 17, [0.5, 0.5, 0.5]]], el: { Na: 0xb47cff, Cl: 0x5fe36b }, ioni: { Na: 1.02, Cl: 1.81 } },
    cscl: { nome: ['Cloruro di cesio CsCl', 'Caesium chloride CsCl'], sis: 'cubico', a: 4.123, base: [['Cs', 55, [0.5, 0.5, 0.5]], ['Cl', 17, [0, 0, 0]]], el: { Cs: 0x8a6dff, Cl: 0x5fe36b }, ioni: { Cs: 1.74, Cl: 1.81 } },
    diamante: { nome: ['Diamante (C)', 'Diamond (C)'], sis: 'cubico', a: 3.5668, base: [['C', 6, [0, 0, 0]], ['C', 6, [0.5, 0.5, 0]], ['C', 6, [0.5, 0, 0.5]], ['C', 6, [0, 0.5, 0.5]], ['C', 6, [0.25, 0.25, 0.25]], ['C', 6, [0.75, 0.75, 0.25]], ['C', 6, [0.75, 0.25, 0.75]], ['C', 6, [0.25, 0.75, 0.75]]], el: { C: 0x9aa6b2 } }
  };
  function vettoriCella(C) {
    var a = C.a, c = C.c || C.a;
    return C.esa ? [[a, 0, 0], [-a / 2, a * Math.sqrt(3) / 2, 0], [0, 0, c]] : [[a, 0, 0], [0, a, 0], [0, 0, a]];
  }
  function cart(V, f) { return [f[0] * V[0][0] + f[1] * V[1][0] + f[2] * V[2][0], f[0] * V[0][1] + f[1] * V[1][1] + f[2] * V[2][1], f[0] * V[0][2] + f[1] * V[1][2] + f[2] * V[2][2]]; }
  function volumeCella(C) { var V = vettoriCella(C), x = V[0], y = V[1], z = V[2]; return Math.abs(x[0] * (y[1] * z[2] - y[2] * z[1]) - x[1] * (y[0] * z[2] - y[2] * z[0]) + x[2] * (y[0] * z[1] - y[1] * z[0])); }
  /* gli atomi dentro la cella (bordi compresi), ciascuno con il suo peso: 1/2 per ogni coordinata sul bordo */
  function atomiCella(C) {
    var out = [], visti = {};
    C.base.forEach(function (A) {
      for (var i = 0; i <= 1; i++) for (var j = 0; j <= 1; j++) for (var k = 0; k <= 1; k++) {
        var f = [A[2][0] + i, A[2][1] + j, A[2][2] + k];
        if (f.some(function (v) { return v > 1 + 1e-9; })) continue;
        var chiave = f.map(function (v) { return Math.round(v * 1e6); }).join(','); if (visti[chiave]) continue; visti[chiave] = 1;
        var w = 1; f.forEach(function (v) { if (Math.abs(v) < 1e-9 || Math.abs(v - 1) < 1e-9) w *= 0.5; });
        out.push({ el: A[0], f: f, w: w });
      }
    });
    return out;
  }
  function contaAtomi(C) { var n = {}; atomiCella(C).forEach(function (o) { n[o.el] = (n[o.el] || 0) + o.w; }); return n; }
  /* primi vicini del primo atomo della base: distanza e quanti (entro il 3 %) */
  function vicini(C, quale) {
    var V = vettoriCella(C), A = C.base[quale || 0], p0 = cart(V, A[2]), d = [];
    C.base.forEach(function (B) {
      for (var i = -2; i <= 2; i++) for (var j = -2; j <= 2; j++) for (var k = -2; k <= 2; k++) {
        var q = cart(V, [B[2][0] + i, B[2][1] + j, B[2][2] + k]), r = Math.hypot(q[0] - p0[0], q[1] - p0[1], q[2] - p0[2]);
        if (r > 1e-6) d.push({ r: r, el: B[0] });
      }
    });
    d.sort(function (x, y) { return x.r - y.r; });
    var r1 = d[0].r, cn = d.filter(function (x) { return x.r < r1 * 1.03; }).length;
    return { d: r1, cn: cn, el: d[0].el };
  }
  /* i raggi delle sfere: ionici se dati, altrimenti meta' della distanza fra primi vicini (sfere a contatto) */
  function raggi(C) { if (C.ioni) return C.ioni; var r = {}, v = vicini(C); Object.keys(C.el).forEach(function (e) { r[e] = v.d / 2; }); return r; }
  function impaccamento(C) {
    var R = raggi(C), n = contaAtomi(C), vs = 0;
    Object.keys(n).forEach(function (e) { vs += n[e] * 4 / 3 * Math.PI * Math.pow(R[e], 3); });
    return { pf: vs / volumeCella(C), vSfere: vs, vCella: volumeCella(C), raggi: R };
  }
  function strutturaZ(C, h, k, l) {
    var re = 0, im = 0;
    C.base.forEach(function (A) { var ph = 2 * Math.PI * (h * A[2][0] + k * A[2][1] + l * A[2][2]); re += A[1] * Math.cos(ph); im += A[1] * Math.sin(ph); });
    return re * re + im * im;
  }
  /* il vettore reciproco G = h b₁ + k b₂ + l b₃ (senza 2π): i piani della famiglia sono G·r = intero, distanti 1/|G| */
  function reciproco(C, h, k, l) {
    var V = vettoriCella(C), vol = volumeCella(C), cr = function (a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; };
    var b1 = cr(V[1], V[2]), b2 = cr(V[2], V[0]), b3 = cr(V[0], V[1]);
    return [0, 1, 2].map(function (i) { return (h * b1[i] + k * b2[i] + l * b3[i]) / vol; });
  }
  /* poligono del piano n·r = d dentro un poliedro convesso dato dai semispazi m·r ≤ c (Sutherland-Hodgman) */
  function tagliaPiano(n, d, semispazi) {
    var L = Math.hypot(n[0], n[1], n[2]); if (!(L > 0)) return [];
    var u = [n[0] / L, n[1] / L, n[2] / L], p0 = [u[0] * d / L, u[1] * d / L, u[2] * d / L];
    var t0 = Math.abs(u[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0], e1 = [u[1] * t0[2] - u[2] * t0[1], u[2] * t0[0] - u[0] * t0[2], u[0] * t0[1] - u[1] * t0[0]], m1 = Math.hypot(e1[0], e1[1], e1[2]);
    e1 = e1.map(function (x) { return x / m1; }); var e2 = [u[1] * e1[2] - u[2] * e1[1], u[2] * e1[0] - u[0] * e1[2], u[0] * e1[1] - u[1] * e1[0]];
    var S = 100, poly = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(function (s) { return [p0[0] + S * (s[0] * e1[0] + s[1] * e2[0]), p0[1] + S * (s[0] * e1[1] + s[1] * e2[1]), p0[2] + S * (s[0] * e1[2] + s[1] * e2[2])]; });
    semispazi.forEach(function (H) {
      if (!poly.length) return;
      var out = [], f = function (p) { return H[0][0] * p[0] + H[0][1] * p[1] + H[0][2] * p[2] - H[1]; };
      for (var i = 0; i < poly.length; i++) {
        var A = poly[i], B = poly[(i + 1) % poly.length], fa = f(A), fb = f(B);
        if (fa <= 1e-9) out.push(A);
        if ((fa < -1e-9 && fb > 1e-9) || (fa > 1e-9 && fb < -1e-9)) { var s = fa / (fa - fb); out.push([A[0] + (B[0] - A[0]) * s, A[1] + (B[1] - A[1]) * s, A[2] + (B[2] - A[2]) * s]); }
      }
      poly = out;
    });
    return poly;
  }
  function areaPoligono(P) { var s = [0, 0, 0]; for (var i = 1; i < P.length - 1; i++) { var a = [P[i][0] - P[0][0], P[i][1] - P[0][1], P[i][2] - P[0][2]], b = [P[i + 1][0] - P[0][0], P[i + 1][1] - P[0][1], P[i + 1][2] - P[0][2]]; s[0] += a[1] * b[2] - a[2] * b[1]; s[1] += a[2] * b[0] - a[0] * b[2]; s[2] += a[0] * b[1] - a[1] * b[0]; } return Math.hypot(s[0], s[1], s[2]) / 2; }
  /* la regione disegnata: rep × rep × rep celle (cubiche) o il prisma esagonale alto rep celle */
  function regione(C, rep) {
    var V = vettoriCella(C), H = [];
    if (C.esa) {
      for (var k = 0; k < 6; k++) { var an = Math.PI / 6 + k * Math.PI / 3; H.push([[Math.cos(an), Math.sin(an), 0], C.a * Math.sqrt(3) / 2]); }
      H.push([[0, 0, 1], rep * C.c]); H.push([[0, 0, -1], 0]);
    } else { [0, 1, 2].forEach(function (i) { var n = [0, 0, 0]; n[i] = 1; H.push([n, rep * V[i][i]]); var m = [0, 0, 0]; m[i] = -1; H.push([m, 0]); }); }
    return H;
  }
  function dentro(H, p) { return H.every(function (s) { return s[0][0] * p[0] + s[0][1] * p[1] + s[0][2] * p[2] <= s[1] + 1e-6; }); }
  /* gli atomi nella regione, in coordinate cartesiane (Å) */
  function atomiRegione(C, rep) {
    var V = vettoriCella(C), H = regione(C, rep), out = [], lim = C.esa ? 3 : rep;
    C.base.forEach(function (A) {
      for (var i = C.esa ? -lim : 0; i <= lim; i++) for (var j = C.esa ? -lim : 0; j <= lim; j++) for (var k = 0; k <= rep; k++) {
        var p = cart(V, [A[2][0] + i, A[2][1] + j, A[2][2] + k]);
        if (dentro(H, p)) out.push({ el: A[0], p: p });
      }
    });
    return out;
  }
  /* i piani (hkl) della famiglia che attraversano la regione, e gli atomi che ci stanno sopra */
  function pianiMiller(C, rep, h, k, l) {
    if (!h && !k && !l) return { piani: [], d: NaN, su: [] };
    var G = reciproco(C, h, k, l), H = regione(C, rep), at = atomiRegione(C, rep), piani = [], vals = at.map(function (o) { return G[0] * o.p[0] + G[1] * o.p[1] + G[2] * o.p[2]; });
    /* gli estremi di G·r sulla regione: dai vertici del poliedro, cioe' dagli atomi ai vertici e dai bordi; basta un campione denso */
    var lo = Infinity, hi = -Infinity, V = vettoriCella(C);
    for (var a = 0; a <= 8; a++) for (var b = 0; b <= 8; b++) for (var c = 0; c <= 8; c++) {
      var p = C.esa ? [C.a * (a / 4 - 1), C.a * (b / 4 - 1), rep * C.c * c / 8] : cart(V, [rep * a / 8, rep * b / 8, rep * c / 8]);
      if (!dentro(H, p)) continue; var g = G[0] * p[0] + G[1] * p[1] + G[2] * p[2]; lo = Math.min(lo, g); hi = Math.max(hi, g);
    }
    for (var n = Math.ceil(lo - 1e-6); n <= Math.floor(hi + 1e-6); n++) { var poly = tagliaPiano(G, n, H); if (poly.length >= 3 && areaPoligono(poly) > 1e-6) piani.push({ n: n, poly: poly }); }
    var su = []; vals.forEach(function (v, i) { if (Math.abs(v - Math.round(v)) < 1e-6 && piani.some(function (P) { return P.n === Math.round(v); })) su.push(i); });
    return { piani: piani, d: 1 / Math.hypot(G[0], G[1], G[2]), su: su, atomi: at };
  }
  F.calcolo.cristalli = { STRUTTURE: STRUTTURE, LAMBDA: LAMBDA, diffrattogramma: diffrattogramma, fattoreStruttura: fattoreStruttura, dSpaziatura: dSpaziatura, BRAVAIS: BRAVAIS,
    CELLE: CELLE, vettoriCella: vettoriCella, volumeCella: volumeCella, atomiCella: atomiCella, contaAtomi: contaAtomi, vicini: vicini, raggi: raggi, impaccamento: impaccamento,
    strutturaZ: strutturaZ, reciproco: reciproco, tagliaPiano: tagliaPiano, areaPoligono: areaPoligono, atomiRegione: atomiRegione, pianiMiller: pianiMiller };

  /* ── la proiezione 3D, con la rotazione ─────────────────────────────────── */
  function proiettore(c, rot) {
    var W = Math.max(260, c.clientWidth || 500), H = Math.round(W * c._rapporto);
    return function (p) {
      var ca = Math.cos(rot.y), sa = Math.sin(rot.y), cb = Math.cos(rot.x), sb = Math.sin(rot.x);
      var x = p[0] * ca + p[1] * sa, y = -p[0] * sa + p[1] * ca, z = p[2];
      var y2 = y * cb - z * sb, z2 = y * sb + z * cb;
      var s = Math.min(W, H) * 0.26 * rot.zoom, pers = 1 / (1 + y2 * 0.12);
      return [W / 2 + x * s * pers, H / 2 - z2 * s * pers, y2];
    };
  }
  function trascinabile(c, rot, ridisegna) {
    var su = null;
    c.addEventListener('pointerdown', function (e) { su = [e.clientX, e.clientY]; c.setPointerCapture(e.pointerId); });
    c.addEventListener('pointermove', function (e) { if (!su) return; rot.y += (e.clientX - su[0]) * 0.01; rot.x += (e.clientY - su[1]) * 0.01; su = [e.clientX, e.clientY]; ridisegna(); });
    c.addEventListener('pointerup', function () { su = null; });
    c.style.touchAction = 'none';
  }
  function preparaTela(c) {
    var dpr = Math.min(2, globale.devicePixelRatio || 1), W = Math.max(260, c.clientWidth || 500), H = Math.round(W * c._rapporto), q = c.getContext('2d');
    c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); q.setTransform(dpr, 0, 0, dpr, 0, 0);
    q.fillStyle = '#081522'; q.fillRect(0, 0, W, H);
    return q;
  }

  function schedaBravais(div) {
    var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), destra = F.el('div');
    g.appendChild(pan); g.appendChild(destra); div.appendChild(g);
    var sel = 2, rot = { x: 0.35, y: 0.6, zoom: 1 };
    F.scelta(pan, ['Reticolo', 'Lattice'], BRAVAIS.map(function (L, i) { return [String(i), t(L.s[0], L.s[1]) + ' ' + L.c]; }), '2', function (v) { sel = +v; disegna(); });
    var info = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(info);
    var c = F.tela(destra, 0.75);
    trascinabile(c, rot, disegna);
    function disegna() {
      var L = BRAVAIS[sel], V = vettori(L), q = preparaTela(c), P = proiettore(c, rot);
      var o = [-(V[0][0] + V[1][0] + V[2][0]) / 2, -(V[0][1] + V[1][1] + V[2][1]) / 2, -(V[0][2] + V[1][2] + V[2][2]) / 2];
      var pt = function (f) { return [o[0] + f[0] * V[0][0] + f[1] * V[1][0] + f[2] * V[2][0], o[1] + f[0] * V[0][1] + f[1] * V[1][1] + f[2] * V[2][1], o[2] + f[0] * V[0][2] + f[1] * V[1][2] + f[2] * V[2][2]]; };
      var vert = []; for (var i = 0; i < 8; i++) vert.push([i & 1, (i >> 1) & 1, (i >> 2) & 1]);
      q.strokeStyle = '#5eead4'; q.lineWidth = 1.6;
      for (i = 0; i < 8; i++) for (var j = i + 1; j < 8; j++) {
        var d = Math.abs(vert[i][0] - vert[j][0]) + Math.abs(vert[i][1] - vert[j][1]) + Math.abs(vert[i][2] - vert[j][2]);
        if (d !== 1) continue;
        var a = P(pt(vert[i])), b = P(pt(vert[j])); q.beginPath(); q.moveTo(a[0], a[1]); q.lineTo(b[0], b[1]); q.stroke();
      }
      var punti = vert.map(function (v) { return { p: P(pt(v)), c: '#ffd24a' }; });
      CENTRI[L.c].forEach(function (cf) {
        var tutti = [cf];
        if (L.c === 'F') tutti = [[0.5, 0.5, 0], [0.5, 0.5, 1], [0.5, 0, 0.5], [0.5, 1, 0.5], [0, 0.5, 0.5], [1, 0.5, 0.5]];
        if (L.c === 'C') tutti = [[0.5, 0.5, 0], [0.5, 0.5, 1]];
        tutti.forEach(function (f) { punti.push({ p: P(pt(f)), c: '#ff8a80' }); });
      });
      punti.sort(function (x, y) { return y.p[2] - x.p[2]; }).forEach(function (u) { q.fillStyle = u.c; q.beginPath(); q.arc(u.p[0], u.p[1], 5 / (1 + u.p[2] * 0.12), 0, 6.3); q.fill(); });
      c.setAttribute('aria-label', t('la cella del reticolo', 'the lattice cell'));
      var nZ = { P: 1, I: 2, F: 4, C: 2, R: 1 }[L.c];
      info.innerHTML = '<b>' + t(L.s[0], L.s[1]) + ' ' + L.c + '</b><br>a : b : c = ' + L.a + ' : ' + L.b + ' : ' + L.c2 + '<br>α = ' + L.al + '°, β = ' + L.be + '°, γ = ' + L.ga + '°<br>' +
        t('Punti reticolari per cella', 'Lattice points per cell') + ': <b>' + nZ + '</b><br><br>' + t('Trascina per ruotare. In giallo i vertici, in rosa i punti di centratura (I corpo centrato, F facce centrate, C basi centrate).', 'Drag to rotate. Yellow: corners; pink: centring points (I body-centred, F face-centred, C base-centred).');
    }
    disegna();
    F.alRidimensiona(disegna);
  }

  function schedaMiller(div) {
    var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), destra = F.el('div');
    g.appendChild(pan); g.appendChild(destra); div.appendChild(g);
    var h = 1, k = 1, l = 1, rot = { x: 0.35, y: 0.6, zoom: 1 }, sis = 'cubico', par = { a: 5.64, b: 5.64, c: 5.64 };
    F.cursore(pan, 'h', -3, 3, 1, h, function (v) { h = v; disegna(); });
    F.cursore(pan, 'k', -3, 3, 1, k, function (v) { k = v; disegna(); });
    F.cursore(pan, 'l', -3, 3, 1, l, function (v) { l = v; disegna(); });
    F.scelta(pan, ['Sistema cristallino', 'Crystal system'], [['cubico', ['cubico', 'cubic']], ['tetragonale', ['tetragonale', 'tetragonal']], ['ortorombico', ['ortorombico', 'orthorhombic']], ['esagonale', ['esagonale', 'hexagonal']]], sis, function (v) { sis = v; disegna(); });
    ['a', 'b', 'c'].forEach(function (n) { F.cursore(pan, n + ' (Å)', 2, 12, 0.01, par[n], function (v) { par[n] = v; disegna(); }); });
    var info = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(info);
    var c = F.tela(destra, 0.75);
    trascinabile(c, rot, disegna);
    function disegna() {
      var q = preparaTela(c), P = proiettore(c, rot), o = -0.5;
      var pt = function (f) { return [f[0] + o, f[1] + o, f[2] + o]; };
      q.strokeStyle = '#5eead4'; q.lineWidth = 1.4;
      var vert = []; for (var i = 0; i < 8; i++) vert.push([i & 1, (i >> 1) & 1, (i >> 2) & 1]);
      for (i = 0; i < 8; i++) for (var j = i + 1; j < 8; j++) {
        if (Math.abs(vert[i][0] - vert[j][0]) + Math.abs(vert[i][1] - vert[j][1]) + Math.abs(vert[i][2] - vert[j][2]) !== 1) continue;
        var a = P(pt(vert[i])), b = P(pt(vert[j])); q.beginPath(); q.moveTo(a[0], a[1]); q.lineTo(b[0], b[1]); q.stroke();
      }
      if (h || k || l) {
        /* tutti i piani della famiglia che tagliano la cella: h x + k y + l z = n */
        var mn = Math.min(0, h) + Math.min(0, k) + Math.min(0, l), mxv = Math.max(0, h) + Math.max(0, k) + Math.max(0, l);
        for (var n = Math.ceil(mn); n <= Math.floor(mxv); n++) {
          if ((n === mn || n === mxv) && (h * h + k * k + l * l) > 1 && n === mn) continue;
          var pts = [];
          for (i = 0; i < 8; i++) for (j = i + 1; j < 8; j++) {
            if (Math.abs(vert[i][0] - vert[j][0]) + Math.abs(vert[i][1] - vert[j][1]) + Math.abs(vert[i][2] - vert[j][2]) !== 1) continue;
            var fi = h * vert[i][0] + k * vert[i][1] + l * vert[i][2] - n, fj = h * vert[j][0] + k * vert[j][1] + l * vert[j][2] - n;
            if (fi * fj < 0 || (fi === 0 && fj !== 0)) { var s = fi / (fi - fj); pts.push([vert[i][0] + s * (vert[j][0] - vert[i][0]), vert[i][1] + s * (vert[j][1] - vert[i][1]), vert[i][2] + s * (vert[j][2] - vert[i][2])]); }
          }
          if (pts.length < 3) continue;
          var cx = pts.reduce(function (s2, p) { return [s2[0] + p[0] / pts.length, s2[1] + p[1] / pts.length, s2[2] + p[2] / pts.length]; }, [0, 0, 0]);
          var nn = [h, k, l], u = Math.abs(h) < 0.9 ? [1, 0, 0] : [0, 1, 0];
          var e1 = [nn[1] * u[2] - nn[2] * u[1], nn[2] * u[0] - nn[0] * u[2], nn[0] * u[1] - nn[1] * u[0]], e2 = [nn[1] * e1[2] - nn[2] * e1[1], nn[2] * e1[0] - nn[0] * e1[2], nn[0] * e1[1] - nn[1] * e1[0]];
          pts.sort(function (A, B) { var da = [A[0] - cx[0], A[1] - cx[1], A[2] - cx[2]], db = [B[0] - cx[0], B[1] - cx[1], B[2] - cx[2]];
            return Math.atan2(da[0] * e2[0] + da[1] * e2[1] + da[2] * e2[2], da[0] * e1[0] + da[1] * e1[1] + da[2] * e1[2]) - Math.atan2(db[0] * e2[0] + db[1] * e2[1] + db[2] * e2[2], db[0] * e1[0] + db[1] * e1[1] + db[2] * e1[2]); });
          q.fillStyle = 'rgba(124,111,255,.35)'; q.strokeStyle = '#b388ff'; q.beginPath();
          pts.forEach(function (p, m) { var pp = P(pt(p)); if (m) q.lineTo(pp[0], pp[1]); else q.moveTo(pp[0], pp[1]); });
          q.closePath(); q.fill(); q.stroke();
        }
      }
      c.setAttribute('aria-label', t('il piano di Miller nella cella', 'the Miller plane in the cell'));
      var d = (h || k || l) ? dSpaziatura(sis, par, h, k, l) : NaN;
      info.innerHTML = '(' + h + ' ' + k + ' ' + l + ')<br>d = <b class="bsiFX-num">' + (isFinite(d) ? d.toFixed(4) + ' Å' : '—') + '</b><br>' +
        (isFinite(d) ? '2θ (Cu Kα) = <b class="bsiFX-num">' + (d > 1.5406 / 2 ? (2 * Math.asin(1.5406 / (2 * d)) / RAD).toFixed(2) + '°' : t('fuori portata', 'out of range')) + '</b><br>' : '') +
        '<br>' + t('I piani della stessa famiglia sono paralleli ed equidistanti: d è la loro distanza. Indici più alti, piani più fitti, d più piccola, angolo di Bragg più grande.', 'Planes of a family are parallel and equidistant: d is their spacing. Higher indices mean denser planes, smaller d, larger Bragg angle.');
    }
    disegna();
    F.alRidimensiona(disegna);
  }

  function schedaXRD(div) {
    var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), destra = F.el('div');
    g.appendChild(pan); g.appendChild(destra); div.appendChild(g);
    var st = 'NaCl', lam = 'Cu Kα';
    F.scelta(pan, ['Cristallo', 'Crystal'], Object.keys(STRUTTURE).map(function (k) { return [k, STRUTTURE[k].nome]; }), st, function (v) { st = v; disegna(); });
    F.scelta(pan, ['Radiazione', 'Radiation'], Object.keys(LAMBDA).map(function (k) { return [k, k + ' (' + LAMBDA[k] + ' Å)']; }), lam, function (v) { lam = v; disegna(); });
    var info = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(info);
    var c = F.tela(destra, 0.5), tab = F.el('div'); destra.appendChild(tab);
    function disegna() {
      var S = STRUTTURE[st], L = LAMBDA[lam], pk = diffrattogramma(S, L, 120);
      var xs = [], ys = [];
      for (var x = 10; x <= 120; x += 0.05) { var y = 0; pk.forEach(function (p) { var d = (x - p.tt) / 0.12; y += p.Irel * Math.exp(-d * d / 2); }); xs.push(x); ys.push(y); }
      F.grafico(c, { serie: [{ x: xs, y: ys, col: '#5eead4', larg: 1.3 }], xmin: 10, xmax: 120, ymin: 0, ymax: 105, xl: '2θ (°)', yl: ['intensità relativa', 'relative intensity'] });
      var visti = pk.filter(function (p) { return p.Irel > 0.05; }), spenti = pk.filter(function (p) { return p.Irel <= 0.05; });
      var h = '<table class="bsiFX-tab"><tr><th>(hkl)</th><th>d (Å)</th><th>2θ (°)</th><th>' + t('molteplicità', 'multiplicity') + '</th><th>I rel.</th></tr>';
      visti.slice(0, 14).forEach(function (p) { h += '<tr><td>(' + p.hkl.split('').join(' ') + ')</td><td class="bsiFX-num">' + p.d.toFixed(4) + '</td><td class="bsiFX-num">' + p.tt.toFixed(2) + '</td><td>' + p.m + '</td><td class="bsiFX-num">' + p.Irel.toFixed(1) + '</td></tr>'; });
      tab.innerHTML = h + '</table>';
      info.innerHTML = '<b>' + S.nome + '</b> · a = ' + S.a + ' Å · ' + t('reticolo', 'lattice') + ' ' + S.ret + '<br><br>' +
        t('Riflessi estinti dalla simmetria', 'Reflections extinguished by symmetry') + ': ' + (spenti.slice(0, 8).map(function (p) { return '(' + p.hkl.split('').join('') + ')'; }).join(' ') || '—') + '<br><br>' +
        (st === 'KCl' ? t('K⁺ e Cl⁻ hanno lo stesso numero di elettroni: i riflessi con indici tutti dispari, che in NaCl sono deboli, qui quasi spariscono — KCl a raggi X sembra un cubico semplice di lato a/2.', 'K⁺ and Cl⁻ have the same number of electrons: the all-odd reflections, weak in NaCl, almost vanish here — to X-rays KCl looks like a simple cubic of side a/2.') :
                        t('Le posizioni seguono da Bragg e sono esatte; le intensità usano fattori di forma atomici approssimati.', 'Positions follow from Bragg and are exact; intensities use approximate atomic form factors.'));
    }
    disegna();
    F.alRidimensiona(disegna);
  }

  /* ── v238: le celle in 3D ───────────────────────────────────────────────── */
  var MENO_MOTO = false; try { MENO_MOTO = !!(globale.matchMedia && globale.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { }
  /* la scheda 3D: il pannello subito, la scena dopo (three.js al primo uso, il contesto WebGL e il contenuto in compiti separati) */
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
          var S = new L3.Scena(destra, 0.75);
          var adatta = S.adatta; S.adatta = function () { if (this.box.offsetParent === null) return; adatta.call(this); };
          destra.insertBefore(S.box, destra.firstChild);
          S.box.setAttribute('role', 'group'); S.box.setAttribute('aria-label', F.tt(ctx.nome));
          div._scena = S;
          setTimeout(function () { ctx.tre(S, globale.THREE, L3); }, 0);
        }, 0);
      }).catch(function (e) { attesa.textContent = t('Motore 3D non disponibile: ', '3D engine unavailable: ') + e.message; });
    };
  }
  function fmt2(v, n) { return v.toFixed(n == null ? 3 : n).replace('.', t(',', '.')); }
  function schedaCelle3D(pan) {
    var st = { s: 'fcc', rep: 1, scala: 0.4, piano: true, h: 1, k: 1, l: 1, legami: false, gonfia: 0 }, cb = {};
    F.scelta(pan, ['Struttura', 'Structure'], Object.keys(CELLE).map(function (k) { return [k, CELLE[k].nome]; }), st.s, function (v) { st.s = v; st.legami = v === 'diamante'; caselle.legami.checked = st.legami; ridisegna(); });
    F.scelta(pan, ['Celle', 'Cells'], [['1', t('una cella (esagonale: il prisma)', 'one cell (hexagonal: the prism)')], ['2', t('2 × 2 × 2 (esagonale: prisma alto due celle)', '2 × 2 × 2 (hexagonal: prism two cells high)')]], '1', function (v) { st.rep = +v; ridisegna(); });
    F.cursore(pan, ['raggio delle sfere (× contatto)', 'sphere radius (× contact)'], 0.2, 1, 0.05, st.scala, function (v) { st.scala = v; st.gonfia = 0; ridisegna(); }, function (v) { return v === 1 ? t('1 (a contatto)', '1 (touching)') : v.toFixed(2); });
    var caselle = {};
    function casella(nome, chiave) {
      var c = F.el('input', { type: 'checkbox' }); c.checked = !!st[chiave];
      c.addEventListener('change', function () { st[chiave] = c.checked; ridisegna(); });
      pan.appendChild(F.el('label', { style: 'display:flex;gap:6px;align-items:center;font-size:.82rem;color:#aebccd;margin:6px 0' }, [c, F.el('span', { testo: F.tt(nome) })]));
      caselle[chiave] = c; return c;
    }
    casella(['piani di Miller (h k l)', 'Miller planes (h k l)'], 'piano');
    ['h', 'k', 'l'].forEach(function (q) { F.cursore(pan, [q, q], -3, 3, 1, st[q], function (v) { st[q] = v; ridisegna(); }); });
    casella(['legami ai primi vicini', 'bonds to nearest neighbours'], 'legami');
    F.bottone(pan, ['▶ Gonfia le sfere fino al contatto', '▶ Inflate the spheres until they touch'], function () { st.gonfia = 0.001; st.scala = 1; ridisegna(); });
    var info = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(info);
    var spiega = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(spiega);
    spiega.innerHTML = t('Ogni sfera è un atomo nella posizione vera della cella; i piani gialli sono tutti i piani della famiglia (h k l) che la attraversano, gli atomi che ci stanno sopra si accendono. I numeri a sinistra non sono tabulati: atomi per cella, coordinazione e frazione di impaccamento sono contati sulle sfere disegnate, d viene dal vettore reciproco e il fattore di struttura dice se il riflesso di Bragg c’è o è estinto.',
      'Each sphere is an atom at its true position in the cell; the yellow planes are all the planes of the (h k l) family crossing it, and the atoms lying on them light up. The numbers on the left are not tabulated: atoms per cell, coordination and packing fraction are counted on the drawn spheres, d comes from the reciprocal vector and the structure factor tells whether the Bragg reflection is there or extinct.');
    function testo() {
      var C = CELLE[st.s], n = contaAtomi(C), v = vicini(C), im = impaccamento(C), cont = Object.keys(n).map(function (e) { return '<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:#' + C.el[e].toString(16).padStart(6, '0') + ';margin-right:3px"></span>' + e + ' ' + fmt2(n[e], 0); }).join(' + ');
      var h = '<b>' + F.tt(C.nome) + '</b><br>a = ' + fmt2(C.a, 4) + ' Å' + (C.c ? ', c = ' + fmt2(C.c, 4) + ' Å (c/a = ' + fmt2(C.c / C.a) + t('; ideale √(8/3) = 1,633', '; ideal √(8/3) = 1.633') + ')' : '') + ' · V = ' + fmt2(im.vCella, 2) + ' Å³<br>' +
        t('Atomi per cella', 'Atoms per cell') + (C.esa ? t(' (primitiva)', ' (primitive)') : '') + ': <b class="bsiFX-num">' + cont + '</b><br>' +
        t('Primi vicini: ', 'Nearest neighbours: ') + '<b class="bsiFX-num">' + v.cn + '</b> ' + t('a ', 'at ') + fmt2(v.d) + ' Å' + (C.ioni ? ' (' + C.base[0][0] + '–' + v.el + ')' : '') + '<br>' +
        t('Frazione di impaccamento: ', 'Packing fraction: ') + '<b class="bsiFX-num">' + fmt2(im.pf * 100, 1) + ' %</b> ' + (C.ioni ? t('(raggi ionici di Shannon ', '(Shannon ionic radii ') + Object.keys(im.raggi).map(function (e) { return e + ' ' + fmt2(im.raggi[e], 2); }).join(', ') + ' Å; r₊/r₋ = ' + fmt2(im.raggi[C.base[0][0]] / im.raggi.Cl, 2) + ')' : t('(sfere a contatto, r = ', '(touching spheres, r = ') + fmt2(v.d / 2) + ' Å)');
      if (st.piano && (st.h || st.k || st.l)) {
        var P = cb.piani, d = dSpaziatura(C.sis, { a: C.a, b: C.a, c: C.c || C.a }, st.h, st.k, st.l), sn = 1.5406 / (2 * d), F2 = strutturaZ(C, st.h, st.k, st.l);
        h += '<br><br>' + t('Piano ', 'Plane ') + '<b>(' + st.h + ' ' + st.k + (C.esa ? ' ' + (-(st.h + st.k)) : '') + ' ' + st.l + ')</b>' + (C.esa ? t(' (indici di Miller-Bravais h k i l)', ' (Miller-Bravais indices h k i l)') : '') + ': d = <b class="bsiFX-num">' + fmt2(d, 4) + ' Å</b>' +
          (P ? ' · ' + P.piani.length + t(' piani nella figura, ', ' planes in the figure, ') + P.su.length + t(' atomi sopra', ' atoms on them') : '') + '<br>' +
          t('Bragg con Cu Kα (1,5406 Å): ', 'Bragg with Cu Kα (1.5406 Å): ') + (sn < 1 ? '2θ = <b class="bsiFX-num">' + fmt2(2 * Math.asin(sn) / RAD, 2) + '°</b>' : t('oltre la sfera di Ewald', 'beyond the Ewald sphere')) + '<br>' +
          '|F|² = ' + fmt2(F2, 0) + ' → ' + (F2 < 1e-6 ? '<b class="bsiFX-ko">' + t('riflesso estinto', 'reflection extinct') + '</b>' + t(': gli atomi a metà strada fra questi piani diffondono in opposizione di fase', ': the atoms halfway between these planes scatter in antiphase') : '<b class="bsiFX-ok">' + t('riflesso presente', 'reflection present') + '</b>');
      }
      info.innerHTML = h;
    }
    function ridisegna() { if (cb.disegna) cb.disegna(); else testo(); }
    testo();
    return {
      nome: ['Celle elementari in 3D con i piani di Miller', 'Unit cells in 3D with Miller planes'],
      tre: function (S, T, L3) {
        var geoSf = new T.SphereGeometry(1, 28, 18);
        cb.disegna = function () {
          S.pulisci();
          var C = CELLE[st.s], rep = st.rep, at = atomiRegione(C, rep), R = raggi(C), V = vettoriCella(C);
          var cz = C.esa ? [0, 0, rep * C.c / 2] : [rep * C.a / 2, rep * C.a / 2, rep * C.a / 2], L = 3.4 / (rep * Math.max(C.a, C.c || 0) * (C.esa ? 1 : 1));
          var P3 = function (p) { return new T.Vector3((p[0] - cz[0]) * L, (p[1] - cz[1]) * L, (p[2] - cz[2]) * L); };
          cb.piani = st.piano ? pianiMiller(C, rep, st.h, st.k, st.l) : null;
          var acceso = {}; if (cb.piani) cb.piani.su.forEach(function (i) { acceso[i] = 1; });
          var sfere = [];
          at.forEach(function (o, i) {
            var m = new T.Mesh(geoSf, new T.MeshStandardMaterial({ color: C.el[o.el], roughness: 0.32, metalness: 0.12, emissive: acceso[i] ? 0xffd24a : 0x000000, emissiveIntensity: acceso[i] ? 0.45 : 0 }));
            m.position.copy(P3(o.p)); var r = R[o.el] * L * st.scala; m.scale.set(r, r, r); m.userData.r = R[o.el] * L; S.aggiungi(m); sfere.push(m);
          });
          /* gli spigoli: celle cubiche o prisma esagonale */
          var sp = [];
          if (C.esa) {
            var es = []; for (var k = 0; k < 6; k++) es.push([C.a * Math.cos(k * Math.PI / 3), C.a * Math.sin(k * Math.PI / 3)]);
            for (var z = 0; z <= rep; z++) for (k = 0; k < 6; k++) sp.push(P3([es[k][0], es[k][1], z * C.c]), P3([es[(k + 1) % 6][0], es[(k + 1) % 6][1], z * C.c]));
            for (k = 0; k < 6; k++) sp.push(P3([es[k][0], es[k][1], 0]), P3([es[k][0], es[k][1], rep * C.c]));
            /* la cella primitiva (rombo a 120°) tratteggiata dentro il prisma */
            var pr = [[0, 0], [1, 0], [1, 1], [0, 1]].map(function (f) { return cart(V, [f[0], f[1], 0]); });
            var pp = []; for (k = 0; k < 4; k++) { pp.push(P3([pr[k][0], pr[k][1], 0]), P3([pr[(k + 1) % 4][0], pr[(k + 1) % 4][1], 0])); pp.push(P3([pr[k][0], pr[k][1], C.c]), P3([pr[(k + 1) % 4][0], pr[(k + 1) % 4][1], C.c])); pp.push(P3([pr[k][0], pr[k][1], 0]), P3([pr[k][0], pr[k][1], C.c])); }
            var lp = new T.LineSegments(new T.BufferGeometry().setFromPoints(pp), new T.LineDashedMaterial({ color: 0xffffff, dashSize: 0.12, gapSize: 0.08, transparent: true, opacity: 0.55 })); lp.computeLineDistances(); S.aggiungi(lp);
          } else {
            for (var i = 0; i < rep; i++) for (var j = 0; j < rep; j++) for (var q = 0; q < rep; q++) {
              var vv = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]].map(function (f) { return P3(cart(V, [f[0] + i, f[1] + j, f[2] + q])); });
              [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(function (e) { sp.push(vv[e[0]], vv[e[1]]); });
            }
          }
          S.aggiungi(new T.LineSegments(new T.BufferGeometry().setFromPoints(sp), new T.LineBasicMaterial({ color: 0x5eead4, transparent: true, opacity: 0.85 })));
          /* i legami ai primi vicini */
          if (st.legami) {
            var dn = vicini(C).d, sg = [];
            for (i = 0; i < at.length; i++) for (j = i + 1; j < at.length; j++) { var dd = Math.hypot(at[i].p[0] - at[j].p[0], at[i].p[1] - at[j].p[1], at[i].p[2] - at[j].p[2]); if (dd < dn * 1.03) sg.push(P3(at[i].p), P3(at[j].p)); }
            S.aggiungi(new T.LineSegments(new T.BufferGeometry().setFromPoints(sg), new T.LineBasicMaterial({ color: 0xdfe8f2 })));
          }
          /* i piani della famiglia */
          var mat = null;
          if (cb.piani) {
            mat = new T.MeshBasicMaterial({ color: 0xffd24a, transparent: true, opacity: 0.3, side: T.DoubleSide, depthWrite: false });
            cb.piani.piani.forEach(function (Pn) {
              var vtx = []; for (var a = 1; a < Pn.poly.length - 1; a++) [Pn.poly[0], Pn.poly[a], Pn.poly[a + 1]].forEach(function (p) { var w = P3(p); vtx.push(w.x, w.y, w.z); });
              var gp = new T.BufferGeometry(); gp.setAttribute('position', new T.Float32BufferAttribute(vtx, 3)); S.aggiungi(new T.Mesh(gp, mat));
              S.aggiungi(L3.linea(T, Pn.poly.concat([Pn.poly[0]]).map(P3), 0xffd24a, 0.9));
            });
          }
          /* gli assi della cella */
          var o = P3(C.esa ? [0, 0, 0] : [0, 0, 0]), nomi = ['a', 'b', 'c'], cols = [0xff6b6b, 0x5eead4, 0x6bcfff];
          [0, 1, 2].forEach(function (i2) { var e = P3(cart(V, [i2 === 0 ? 0.35 : 0, i2 === 1 ? 0.35 : 0, i2 === 2 ? 0.35 : 0])); var et = L3.testo3d(T, C.esa && i2 === 1 ? 'a₂' : C.esa && i2 === 0 ? 'a₁' : nomi[i2], '#' + cols[i2].toString(16), 0.26); et.position.set(e.x + (e.x - o.x) * 0.4, e.y + (e.y - o.y) * 0.4, e.z + (e.z - o.z) * 0.4); S.aggiungi(et); S.aggiungi(L3.freccia(T, [o.x, o.y, o.z], [e.x, e.y, e.z], cols[i2], 0.14)); });
          testo();
          S.didascalia.textContent = F.tt(C.nome) + (cb.piani && cb.piani.piani.length ? ' · (' + st.h + ' ' + st.k + ' ' + st.l + ')' : '');
          var tempo = 0;
          S.ogniFotogramma(function (dt) {
            tempo += dt; var vivo = false;
            if (st.gonfia > 0) {
              st.gonfia = Math.min(1, st.gonfia + dt / 2.5); var f = 0.12 + 0.88 * (1 - Math.pow(1 - st.gonfia, 3));
              sfere.forEach(function (m) { var r = m.userData.r * f; m.scale.set(r, r, r); });
              S.didascalia.textContent = t('Le sfere crescono fino a toccarsi: raggio × ', 'The spheres grow until they touch: radius × ') + fmt2(f, 2);
              if (st.gonfia >= 1) { st.gonfia = 0; S.didascalia.textContent = F.tt(C.nome) + t(' · a contatto', ' · touching'); } else vivo = true;
            }
            if (mat && !MENO_MOTO) { mat.opacity = 0.24 + 0.12 * Math.sin(tempo * 2.2); vivo = true; }
            return vivo;
          });
          if (!S.vistaIniziale) S.inquadra(10.5, 0.55, 1.12);
        };
        if (!MENO_MOTO) { S.gira = true; var bg = S.box.querySelector('.bsi3d-barra button'); if (bg) bg.setAttribute('aria-pressed', 'true'); }
        cb.disegna();
      }
    };
  }

  F.sezione('scristalli', {
    titolo: ['💎 Cristallografia e raggi X', '💎 Crystallography and X-rays'],
    sotto: ['I 14 reticoli di Bravais, gli indici di Miller e le distanze interplanari, il diffrattogramma di polvere dalla legge di Bragg e dal fattore di struttura, con le estinzioni sistematiche.',
            'The 14 Bravais lattices, Miller indices and interplanar spacings, the powder pattern from Bragg’s law and the structure factor, with systematic absences.'],
    schede: [
      { nome: ['Reticoli di Bravais', 'Bravais lattices'], costruisci: schedaBravais },
      { nome: ['Indici di Miller', 'Miller indices'], costruisci: schedaMiller },
      { nome: ['Diffrattogramma XRD', 'XRD pattern'], costruisci: schedaXRD },
      { nome: ['🧊 Celle in 3D', '🧊 Cells in 3D'], costruisci: scheda3D(schedaCelle3D) }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
