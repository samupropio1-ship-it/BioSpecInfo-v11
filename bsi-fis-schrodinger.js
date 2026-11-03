/* ═══════════════════════════════════════════════════════════════════════════
   bsi-fis-schrodinger.js — il laboratorio di Schrödinger
   BioSpecInfo · © Samuele Pio Provenzano

   L'equazione di Schrödinger in una dimensione, RISOLTA, non raccontata.

   COME

   · Stati stazionari: l'hamiltoniano su una griglia di N punti con le
     differenze finite del secondo ordine e' una matrice tridiagonale
     simmetrica: diagonale 2B/dx² + V(x), fuori diagonale −B/dx², dove
     B = ħ²/2μ e' il coefficiente cinetico (½ in unita' atomiche ridotte,
     16,8576/μ cm⁻¹·Å² per una molecola di massa ridotta μ in u). Gli
     autovalori piu' bassi si trovano con la BISEZIONE DI STURM (il numero di
     cambi di segno della successione dei minori conta gli autovalori sotto
     una soglia), le autofunzioni con l'ITERAZIONE INVERSA (due sistemi
     tridiagonali risolti con Thomas).
   · Il tempo: CRANK-NICOLSON, (1 + iHΔt/2) ψⁿ⁺¹ = (1 − iHΔt/2) ψⁿ — unitario,
     la norma si conserva alla precisione della macchina (il banco lo
     misura), un sistema tridiagonale complesso per passo.
   · In 3D (v238): i potenziali separabili V(x) + V(y) + V(z), la nuvola di
     punti campionata esattamente da |ψ|², la degenerazione, e una
     sovrapposizione di due stati che oscilla nel tempo.
   · Il confronto: ogni risultato numerico e' messo accanto alla soluzione
     esatta dove esiste (pozzo infinito, oscillatore armonico, Morse,
     barriera rettangolare) e, per le molecole, al numero sperimentale.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t;

  /* ── il risolutore ────────────────────────────────────────────────────── */
  /* numero di autovalori della tridiagonale (d, e) minori di lam */
  function sturm(d, e, lam) {
    var n = d.length, c = 0, q = d[0] - lam;
    if (q < 0) c++;
    for (var i = 1; i < n; i++) {
      q = d[i] - lam - e[i - 1] * e[i - 1] / (q === 0 ? 1e-300 : q);
      if (q < 0) c++;
    }
    return c;
  }
  function autovalore(d, e, k, lo, hi) {
    for (var it = 0; it < 200; it++) {
      var m = 0.5 * (lo + hi);
      if (sturm(d, e, m) > k) hi = m; else lo = m;
      if (hi - lo < 1e-12 * Math.max(1, Math.abs(m))) break;
    }
    return 0.5 * (lo + hi);
  }
  /* (T − λ) x = b, tridiagonale simmetrica: Thomas */
  function thomas(d, e, lam, b) {
    var n = d.length, c = new Float64Array(n), x = new Float64Array(n), den;
    den = d[0] - lam; c[0] = e[0] / den; x[0] = b[0] / den;
    for (var i = 1; i < n; i++) {
      den = (d[i] - lam) - e[i - 1] * c[i - 1];
      if (Math.abs(den) < 1e-300) den = 1e-300;
      c[i] = i < n - 1 ? e[i] / den : 0;
      x[i] = (b[i] - e[i - 1] * x[i - 1]) / den;
    }
    for (var j = n - 2; j >= 0; j--) x[j] -= c[j] * x[j + 1];
    return x;
  }
  /* risolvi: V(x) su [a, b] con N punti interni, pareti dure ai bordi.
     Restituisce le prime k energie, le autofunzioni normalizzate (∫|ψ|²dx = 1) */
  function risolvi(V, a, b, N, B, k) {
    var dx = (b - a) / (N + 1), x = new Float64Array(N), d = new Float64Array(N), e = new Float64Array(N - 1);
    var vmin = Infinity, vmax = -Infinity;
    for (var i = 0; i < N; i++) { x[i] = a + (i + 1) * dx; var v = V(x[i]); d[i] = 2 * B / (dx * dx) + v; if (v < vmin) vmin = v; if (v > vmax) vmax = v; }
    for (var j = 0; j < N - 1; j++) e[j] = -B / (dx * dx);
    var lo = vmin - 1, hi = vmax + 4 * B / (dx * dx) + 1;
    var E = [], psi = [];
    for (var n = 0; n < k; n++) {
      var lam = autovalore(d, e, n, lo, hi);
      E.push(lam);
      var y = new Float64Array(N); for (var q = 0; q < N; q++) y[q] = 1 + 0.001 * Math.sin(q * 1.3);
      var shift = lam - 1e-9 * Math.max(1, Math.abs(lam));
      for (var it = 0; it < 3; it++) {
        y = thomas(d, e, shift, y);
        var s = 0; for (q = 0; q < N; q++) s += y[q] * y[q];
        s = Math.sqrt(s * dx); for (q = 0; q < N; q++) y[q] /= s;
      }
      /* segno: positivo dove la funzione si apre (convenzione dei libri) */
      var im = 0; for (q = 0; q < N; q++) if (Math.abs(y[q]) > 1e-3) { im = q; break; }
      if (y[im] < 0) for (q = 0; q < N; q++) y[q] = -y[q];
      psi.push(y);
    }
    return { x: x, dx: dx, E: E, psi: psi };
  }

  /* ── il tempo: Crank-Nicolson ──────────────────────────────────────────── */
  function evolutore(V, a, b, N, B, dt) {
    var dx = (b - a) / (N + 1), x = new Float64Array(N), v = new Float64Array(N);
    for (var i = 0; i < N; i++) { x[i] = a + (i + 1) * dx; v[i] = V(x[i]); }
    var o = -B / (dx * dx), h = dt / 2;
    /* A = 1 + i h H: diag 1 + i h (2B/dx² + v), off i h o. Si pre-fattorizza */
    var cr = new Float64Array(N), ci = new Float64Array(N);   /* c' di Thomas, complessi */
    var dr = new Float64Array(N), di = new Float64Array(N);   /* i denominatori */
    var offr = 0, offi = h * o;
    var pr = 1, pi = h * (2 * B / (dx * dx) + v[0]);
    for (i = 0; i < N; i++) {
      var ar = 1, ai = h * (2 * B / (dx * dx) + v[i]);
      if (i > 0) { /* den = a - off * c'[i-1] */
        var mr = offr * cr[i - 1] - offi * ci[i - 1], mi = offr * ci[i - 1] + offi * cr[i - 1];
        ar -= mr; ai -= mi;
      }
      dr[i] = ar; di[i] = ai;
      var m2 = ar * ar + ai * ai;          /* c'[i] = off / den */
      cr[i] = (offr * ar + offi * ai) / m2; ci[i] = (offi * ar - offr * ai) / m2;
    }
    function passo(re, imm) {
      /* r = (1 - i h H) ψ */
      var rr = new Float64Array(N), ri = new Float64Array(N);
      for (var j = 0; j < N; j++) {
        var hr = (2 * B / (dx * dx) + v[j]) * re[j] + o * ((j > 0 ? re[j - 1] : 0) + (j < N - 1 ? re[j + 1] : 0));
        var hi = (2 * B / (dx * dx) + v[j]) * imm[j] + o * ((j > 0 ? imm[j - 1] : 0) + (j < N - 1 ? imm[j + 1] : 0));
        rr[j] = re[j] + h * hi; ri[j] = imm[j] - h * hr;
      }
      /* avanti: y[i] = (r[i] - off*y[i-1]) / den[i] */
      var yr = new Float64Array(N), yi = new Float64Array(N);
      for (j = 0; j < N; j++) {
        var nr = rr[j], ni = ri[j];
        if (j > 0) { nr -= offr * yr[j - 1] - offi * yi[j - 1]; ni -= offr * yi[j - 1] + offi * yr[j - 1]; }
        var m3 = dr[j] * dr[j] + di[j] * di[j];
        yr[j] = (nr * dr[j] + ni * di[j]) / m3; yi[j] = (ni * dr[j] - nr * di[j]) / m3;
      }
      for (j = N - 2; j >= 0; j--) {
        yr[j] -= cr[j] * yr[j + 1] - ci[j] * yi[j + 1];
        yi[j] -= cr[j] * yi[j + 1] + ci[j] * yr[j + 1];
      }
      for (j = 0; j < N; j++) { re[j] = yr[j]; imm[j] = yi[j]; }
    }
    return { x: x, dx: dx, v: v, passo: passo };
  }
  function pacchetto(x, x0, s, k0) {
    var N = x.length, re = new Float64Array(N), im = new Float64Array(N), n = 0, dx = x[1] - x[0];
    for (var i = 0; i < N; i++) { var g = Math.exp(-(x[i] - x0) * (x[i] - x0) / (4 * s * s)); re[i] = g * Math.cos(k0 * x[i]); im[i] = g * Math.sin(k0 * x[i]); n += g * g; }
    n = Math.sqrt(n * dx); for (i = 0; i < N; i++) { re[i] /= n; im[i] /= n; }
    return { re: re, im: im };
  }
  /* trasmissione esatta di un'onda piana su una barriera rettangolare (ħ = m = 1) */
  function trasmissione(E, V0, a) {
    if (E <= 0) return 0;
    if (Math.abs(E - V0) < 1e-12) return 1 / (1 + V0 * a * a / 2);
    if (E < V0) { var k = Math.sqrt(2 * (V0 - E)), s = Math.sinh(k * a); return 1 / (1 + V0 * V0 * s * s / (4 * E * (V0 - E))); }
    var q = Math.sqrt(2 * (E - V0)), sn = Math.sin(q * a); return 1 / (1 + V0 * V0 * sn * sn / (4 * E * (E - V0)));
  }

  /* ── le molecole: il potenziale di Morse con i parametri della letteratura ──
     De (cm⁻¹), a (Å⁻¹), re (Å), μ (u); ν₀ sperimentale (cm⁻¹, fondamentale
     vibrazionale): Herzberg, «Constants of Diatomic Molecules» / NIST */
  var MOLECOLE = {
    HCl: { De: 37244, a: 1.869, re: 1.2746, mu: 0.97959, nu0: 2885.98 },
    H2:  { De: 38297, a: 1.9426, re: 0.7414, mu: 0.50391, nu0: 4161.17 },
    CO:  { De: 90544, a: 2.2994, re: 1.1283, mu: 6.85621, nu0: 2143.27 },
    N2:  { De: 79890, a: 2.6986, re: 1.0977, mu: 7.00154, nu0: 2329.91 }
  };
  var HBAR2_2U = 16.857629;   /* ħ²/2u in cm⁻¹·Å² */
  function morseEsatto(m, n) {
    var B = HBAR2_2U / m.mu, we = 2 * m.a * Math.sqrt(B * m.De), wexe = we * we / (4 * m.De);
    return we * (n + 0.5) - wexe * (n + 0.5) * (n + 0.5);
  }
  function morseNumerico(m, k) {
    var B = HBAR2_2U / m.mu;
    var V = function (r) { var y = 1 - Math.exp(-m.a * (r - m.re)); return m.De * y * y; };
    return risolvi(V, Math.max(0.05, m.re - 0.6), m.re + 2.6, 3000, B, k);
  }

  F.calcolo.schrodinger = { risolvi: risolvi, evolutore: evolutore, pacchetto: pacchetto, trasmissione: trasmissione,
                            MOLECOLE: MOLECOLE, morseEsatto: morseEsatto, morseNumerico: morseNumerico, B_cm: HBAR2_2U };

  /* ── l'interfaccia ────────────────────────────────────────────────────── */
  var COLORI = ['#5eead4', '#7c6fff', '#ffd24a', '#ff8a80', '#6bcfff', '#b388ff', '#f5c451', '#80e27e', '#ff9e40', '#90a4ae'];
  var POT = {
    pozzo: { nome: ['Pozzo infinito', 'Infinite well'], a: -0.5, b: 0.5, V: function () { return 0; }, esatto: function (n, p) { return (n + 1) * (n + 1) * Math.PI * Math.PI / (2 * p.L * p.L); },
             par: [['L', ['larghezza L', 'width L'], 0.5, 3, 0.05, 1]], intervallo: function (p) { return [-p.L / 2, p.L / 2]; } },
    armonico: { nome: ['Oscillatore armonico', 'Harmonic oscillator'], V: function (x, p) { return 0.5 * p.w * p.w * x * x; },
             esatto: function (n, p) { return p.w * (n + 0.5); }, par: [['w', ['frequenza ω', 'frequency ω'], 0.3, 3, 0.05, 1]], intervallo: function (p) { var L = 7 / Math.sqrt(p.w); return [-L, L]; } },
    morse: { nome: ['Morse (ridotto)', 'Morse (reduced)'], V: function (x, p) { var y = 1 - Math.exp(-p.alfa * x); return p.De * y * y; },
             esatto: function (n, p) { var w = p.alfa * Math.sqrt(2 * p.De), wx = w * w / (4 * p.De), v = w * (n + 0.5) - wx * (n + 0.5) * (n + 0.5); return v < p.De ? v : NaN; },
             par: [['De', ['profondità De', 'depth De'], 3, 30, 0.5, 12], ['alfa', ['larghezza a', 'range a'], 0.3, 2, 0.05, 1]], intervallo: function (p) { return [-2 / p.alfa, 9 / p.alfa]; } },
    doppia: { nome: ['Doppia buca (NH₃)', 'Double well (NH₃)'], V: function (x, p) { return p.h * Math.pow((x * x - p.s * p.s) / (p.s * p.s), 2); },
             esatto: null, par: [['h', ['barriera', 'barrier'], 1, 20, 0.5, 6], ['s', ['distanza dei minimi', 'well separation'], 0.6, 2.5, 0.05, 1.4]], intervallo: function (p) { var L = p.s * 2.4; return [-L, L]; } }
  };

  /* ── v238: gli stessi potenziali in tre dimensioni ────────────────────────
     V(x, y, z) = V(x) + V(y) + V(z) e' separabile: ψ = ψ_nx(x) ψ_ny(y) ψ_nz(z),
     E = E_nx + E_ny + E_nz, con le ψₙ del risolutore 1D qui sopra (per la
     doppia buca: la doppia buca lungo x, un oscillatore ω = 1 lungo y e z).
     Per lo stesso motivo |ψ|² si campiona ESATTAMENTE asse per asse, dalla
     funzione cumulativa di ψₙ². Una sovrapposizione (ψ_A + ψ_B)/√2 di due
     stati con energie diverse non e' stazionaria: la densita' oscilla con
     periodo 2π/ΔE e il valore medio della coordinata che li distingue con
     ampiezza ⟨A|x|B⟩. */
  function asse3D(tipo, par, k) { var P = POT[tipo], iv = P.intervallo(par); return risolvi(function (x) { return P.V(x, par); }, iv[0], iv[1], 500, 0.5, k); }
  function stati3D(tipo, par, k) {
    var ax = asse3D(tipo, par, k || 6), ay = tipo === 'doppia' ? asse3D('armonico', { w: 1 }, k || 6) : ax;
    return { tipo: tipo, par: par, assi: [ax, ay, ay], V: function (x, y, z) { var P = POT[tipo]; return tipo === 'doppia' ? P.V(x, par) + 0.5 * (y * y + z * z) : P.V(x, par) + P.V(y, par) + P.V(z, par); } };
  }
  function energia3D(s, n) { return s.assi[0].E[n[0]] + s.assi[1].E[n[1]] + s.assi[2].E[n[2]]; }
  function esatta3D(tipo, par, n) {
    if (tipo === 'pozzo') return POT.pozzo.esatto(n[0], par) + POT.pozzo.esatto(n[1], par) + POT.pozzo.esatto(n[2], par);
    if (tipo === 'armonico') return par.w * (n[0] + n[1] + n[2] + 1.5);
    return NaN;
  }
  /* quanti stati (n₁, n₂, n₃) hanno la stessa energia, fra quelli calcolati */
  function degenerazione(s, n) {
    var E = energia3D(s, n), K = s.assi[0].E.length, c = 0;
    for (var a = 0; a < K; a++) for (var b = 0; b < K; b++) for (var d = 0; d < K; d++) if (Math.abs(energia3D(s, [a, b, d]) - E) < 2e-4 * Math.abs(E)) c++;
    return c;
  }
  function valore1D(A, n, x) {
    var i = (x - A.x[0]) / A.dx; if (i < 0 || i > A.x.length - 1) return 0;
    var j = Math.min(A.x.length - 2, Math.floor(i)), u = i - j; return A.psi[n][j] * (1 - u) + A.psi[n][j + 1] * u;
  }
  /* ⟨n|x|m⟩ lungo un asse */
  function elementoX(A, n, m) { var s = 0; for (var i = 0; i < A.x.length; i++) s += A.psi[n][i] * A.x[i] * A.psi[m][i]; return s * A.dx; }
  /* N punti da |ψ_A|² (o dalla media ½(|ψ_A|² + |ψ_B|²) se c'e' B), con i valori di ψ_A e ψ_B in ogni punto */
  function campiona3D(s, nA, nB, N, seme) {
    var q = (seme || 7) >>> 0;
    function rnd() { q = (q + 0x6D2B79F5) >>> 0; var z = Math.imul(q ^ (q >>> 15), 1 | q); z = (z + Math.imul(z ^ (z >>> 7), 61 | z)) ^ z; return ((z ^ (z >>> 14)) >>> 0) / 4294967296; }
    var cdf = {};
    function cumulata(ax, n) {
      var k = ax + ',' + n; if (cdf[k]) return cdf[k];
      var A = s.assi[ax], c = new Float64Array(A.x.length); c[0] = A.psi[n][0] * A.psi[n][0];
      for (var i = 1; i < c.length; i++) c[i] = c[i - 1] + A.psi[n][i] * A.psi[n][i];
      return (cdf[k] = c);
    }
    function estrai(ax, n) {
      var c = cumulata(ax, n), A = s.assi[ax], u = rnd() * c[c.length - 1], lo = 0, hi = c.length - 1;
      while (hi - lo > 1) { var m = (lo + hi) >> 1; if (c[m] < u) lo = m; else hi = m; }
      var f = c[hi] > c[lo] ? (u - c[lo]) / (c[hi] - c[lo]) : 0; return A.x[lo] + (hi - lo) * f * A.dx;
    }
    var pos = new Float32Array(3 * N), pa = new Float32Array(N), pb = new Float32Array(N);
    for (var i = 0; i < N; i++) {
      var st = nB && rnd() < 0.5 ? nB : nA, p = [estrai(0, st[0]), estrai(1, st[1]), estrai(2, st[2])];
      pos[3 * i] = p[0]; pos[3 * i + 1] = p[1]; pos[3 * i + 2] = p[2];
      pa[i] = valore1D(s.assi[0], nA[0], p[0]) * valore1D(s.assi[1], nA[1], p[1]) * valore1D(s.assi[2], nA[2], p[2]);
      if (nB) pb[i] = valore1D(s.assi[0], nB[0], p[0]) * valore1D(s.assi[1], nB[1], p[1]) * valore1D(s.assi[2], nB[2], p[2]);
    }
    return { p: pos, a: pa, b: pb, N: N };
  }
  /* il peso di un punto al tempo t: ρ(t) / ρ_campionamento ∈ [0, 2] (senza B: 1) */
  function peso3D(a, b, dE, t, conB) { if (!conB) return 1; var m = 0.5 * (a * a + b * b); return m > 0 ? 0.5 * (a * a + b * b + 2 * a * b * Math.cos(dE * t)) / m : 0; }
  F.calcolo.schrodinger.stati3D = stati3D; F.calcolo.schrodinger.energia3D = energia3D; F.calcolo.schrodinger.esatta3D = esatta3D; F.calcolo.schrodinger.degenerazione = degenerazione;
  F.calcolo.schrodinger.campiona3D = campiona3D; F.calcolo.schrodinger.peso3D = peso3D; F.calcolo.schrodinger.elementoX = elementoX; F.calcolo.schrodinger.valore1D = valore1D;

  function schedaStazionari(div) {
    var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), destra = F.el('div');
    g.appendChild(pan); g.appendChild(destra); div.appendChild(g);
    var tipo = 'armonico', par = {}, nLiv = 6;
    var cont = F.el('div');
    F.scelta(pan, ['Potenziale', 'Potential'], Object.keys(POT).map(function (k) { return [k, POT[k].nome]; }), tipo, function (v) { tipo = v; costruisciParametri(); calcola(); });
    pan.appendChild(cont);
    F.cursore(pan, ['Livelli mostrati', 'Levels shown'], 1, 10, 1, nLiv, function (v) { nLiv = v; calcola(); });
    var c = F.tela(destra, 0.62), tab = F.el('div'), nota = F.el('div', { 'class': 'bsiFX-nota' });
    destra.appendChild(tab); destra.appendChild(nota);
    function costruisciParametri() {
      cont.innerHTML = ''; par = {};
      POT[tipo].par.forEach(function (p) { par[p[0]] = p[5]; F.cursore(cont, p[1], p[2], p[3], p[4], p[5], function (v) { par[p[0]] = v; calcola(); }); });
    }
    var ultimo = null;
    function calcola() {
      var P = POT[tipo], iv = P.intervallo(par), V = function (x) { return P.V(x, par); };
      ultimo = { P: P, iv: iv, r: risolvi(V, iv[0], iv[1], 900, 0.5, nLiv), V: V };
      disegna();
    }
    function disegna() {
      if (!ultimo) return;
      var r = ultimo.r, iv = ultimo.iv, xs = [], vs = [];
      for (var i = 0; i < r.x.length; i += 3) { xs.push(r.x[i]); vs.push(ultimo.V(r.x[i])); }
      var Emax = r.E[r.E.length - 1], Emin = Math.min.apply(null, vs), spaz = r.E.length > 1 ? (r.E[r.E.length - 1] - r.E[0]) / (r.E.length - 1) : 1;
      var serie = [{ x: xs, y: vs.map(function (v) { return Math.min(v, Emax + spaz * 1.5); }), col: '#8494a8', larg: 2 }], linee = [];
      r.E.forEach(function (E, n) {
        var mx = 0; for (var q = 0; q < r.psi[n].length; q++) mx = Math.max(mx, Math.abs(r.psi[n][q]));
        var sc = 0.42 * spaz / (mx || 1), y = [];
        for (var i2 = 0; i2 < r.x.length; i2 += 3) y.push(E + r.psi[n][i2] * sc);
        serie.push({ x: xs, y: y, col: COLORI[n % COLORI.length], larg: 1.6 });
        linee.push({ y: E, col: COLORI[n % COLORI.length] });
      });
      F.grafico(c, { serie: serie, linee: linee, xmin: iv[0], xmax: iv[1], ymin: Math.min(Emin, r.E[0] - spaz * 0.7), ymax: Emax + spaz * 1.2,
                     xl: ['x (unità ridotte, ħ = m = 1)', 'x (reduced units, ħ = m = 1)'], yl: ['energia e ψₙ', 'energy and ψₙ'], descr: ['livelli e funzioni d’onda', 'levels and wavefunctions'] });
      var h = '<table class="bsiFX-tab"><tr><th>n</th><th>' + t('E numerica', 'numerical E') + '</th><th>' + t('E esatta', 'exact E') + '</th><th>' + t('scarto', 'deviation') + '</th><th>' + t('nodi', 'nodes') + '</th></tr>';
      r.E.forEach(function (E, n) {
        var ex = ultimo.P.esatto ? ultimo.P.esatto(n, par) : NaN, nodi = 0, ps = r.psi[n];
        for (var q = 1; q < ps.length; q++) if (ps[q - 1] * ps[q] < 0 && Math.abs(ps[q]) + Math.abs(ps[q - 1]) > 1e-6) nodi++;
        h += '<tr><td>' + n + '</td><td class="bsiFX-num">' + E.toFixed(5) + '</td><td class="bsiFX-num">' + (isFinite(ex) ? ex.toFixed(5) : '—') + '</td><td class="bsiFX-num">' +
             (isFinite(ex) ? (Math.abs(E - ex) / Math.max(1e-12, Math.abs(ex)) * 100).toExponential(1) + ' %' : '—') + '</td><td>' + nodi + '</td></tr>';
      });
      tab.innerHTML = h + '</table>';
      nota.textContent = tipo === 'doppia'
        ? t('Nella doppia buca i livelli vengono a coppie: lo stato simmetrico e quello antisimmetrico, separati dall’effetto tunnel attraverso la barriera. È l’inversione dell’ammoniaca (23,8 GHz, il primo maser). Alzando la barriera la separazione cala esponenzialmente.',
            'In the double well the levels come in pairs: the symmetric and the antisymmetric state, split by tunnelling through the barrier. It is the inversion of ammonia (23.8 GHz, the first maser). Raising the barrier shrinks the splitting exponentially.')
        : t('Risolto con differenze finite su 900 punti (bisezione di Sturm, iterazione inversa). L’n-esimo stato ha n nodi; nell’armonico i livelli sono equispaziati, nel Morse si stringono verso il limite di dissociazione.',
            'Solved with finite differences on 900 points (Sturm bisection, inverse iteration). The n-th state has n nodes; in the harmonic well the levels are evenly spaced, in the Morse well they crowd towards the dissociation limit.');
    }
    costruisciParametri(); calcola();
    F.alRidimensiona(disegna);
  }

  function schedaTunnel(div) {
    var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), destra = F.el('div');
    g.appendChild(pan); g.appendChild(destra); div.appendChild(g);
    var V0 = 2, larg = 1, E0 = 1.5, sim = null, anim = null, tempo = 0;
    F.cursore(pan, ['Altezza della barriera V₀', 'Barrier height V₀'], 0.2, 5, 0.1, V0, function (v) { V0 = v; reset(); });
    F.cursore(pan, ['Spessore a', 'Thickness a'], 0.2, 3, 0.05, larg, function (v) { larg = v; reset(); });
    F.cursore(pan, ['Energia del pacchetto E', 'Packet energy E'], 0.2, 6, 0.05, E0, function (v) { E0 = v; reset(); });
    var info = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(info);
    F.bottone(pan, ['▶ Lancia il pacchetto', '▶ Launch the packet'], function () { reset(); avvia(); });
    var c = F.tela(destra, 0.55), c2 = F.tela(destra, 0.42);
    function V(x) { return Math.abs(x) <= larg / 2 ? V0 : 0; }
    function reset() {
      if (anim) cancelAnimationFrame(anim); anim = null;
      sim = evolutore(V, -40, 40, 1600, 0.5, 0.02);
      sim.psi = pacchetto(sim.x, -14, 2.2, Math.sqrt(2 * E0)); tempo = 0;
      disegna(); curva();
    }
    function avvia() {
      var t0 = performance.now();
      function giro() {
        for (var s = 0; s < 10; s++) sim.passo(sim.psi.re, sim.psi.im);
        tempo += 0.2; disegna();
        if (tempo < 40 && document.body.contains(c)) anim = requestAnimationFrame(giro); else anim = null;
      }
      anim = requestAnimationFrame(giro);
    }
    function disegna() {
      if (!sim) return;
      var xs = [], p = [], vs = [], oltre = 0, tot = 0;
      for (var i = 0; i < sim.x.length; i += 2) {
        var d = sim.psi.re[i] * sim.psi.re[i] + sim.psi.im[i] * sim.psi.im[i];
        xs.push(sim.x[i]); p.push(d); vs.push(sim.v[i]);
      }
      for (i = 0; i < sim.x.length; i++) { var d2 = (sim.psi.re[i] * sim.psi.re[i] + sim.psi.im[i] * sim.psi.im[i]) * sim.dx; tot += d2; if (sim.x[i] > larg / 2) oltre += d2; }
      var sc = 0.25 / Math.max(1e-9, V0);
      F.grafico(c, { serie: [{ x: xs, y: vs.map(function (v) { return v * sc; }), col: '#8494a8', larg: 2 }, { x: xs, y: p, col: '#5eead4', larg: 2, riempi: 'rgba(94,234,212,.15)' }],
                     xmin: -30, xmax: 30, ymin: 0, ymax: 0.3, xl: 'x', yl: ['|ψ(x,t)|²', '|ψ(x,t)|²'], descr: ['il pacchetto d’onda e la barriera', 'the wave packet and the barrier'] });
      var Tex = trasmissione(E0, V0, larg);
      info.innerHTML = t('Tempo', 'Time') + ' <b class="bsiFX-num">' + tempo.toFixed(1) + '</b><br>' +
        t('Probabilità oltre la barriera', 'Probability past the barrier') + ': <b class="bsiFX-num">' + (oltre * 100).toFixed(1) + ' %</b><br>' +
        t('Trasmissione esatta dell’onda piana a E', 'Exact plane-wave transmission at E') + ': <b class="bsiFX-num">' + (Tex * 100).toFixed(1) + ' %</b><br>' +
        t('Norma (Crank-Nicolson la conserva)', 'Norm (Crank-Nicolson conserves it)') + ': <b class="bsiFX-num">' + tot.toFixed(8) + '</b>';
    }
    function curva() {
      var xs = [], ys = [];
      for (var E = 0.02; E <= 6; E += 0.02) { xs.push(E); ys.push(trasmissione(E, V0, larg)); }
      F.grafico(c2, { serie: [{ x: xs, y: ys, col: '#7c6fff' }], punti: [{ x: E0, y: trasmissione(E0, V0, larg), col: '#ffd24a', r: 4 }], linee: [{ y: 1, col: '#34465f' }],
                      xmin: 0, xmax: 6, ymin: 0, ymax: 1.05, xl: ['energia E (V₀ = ' + V0 + ')', 'energy E (V₀ = ' + V0 + ')'], yl: ['trasmissione T(E)', 'transmission T(E)'] });
    }
    reset();
    F.alRidimensiona(function () { disegna(); curva(); });
  }

  function schedaMolecole(div) {
    var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), destra = F.el('div');
    g.appendChild(pan); g.appendChild(destra); div.appendChild(g);
    var mol = 'HCl', ris = null;
    F.scelta(pan, ['Molecola', 'Molecule'], Object.keys(MOLECOLE).map(function (k) { return [k, k]; }), mol, function (v) { mol = v; calcola(); });
    var info = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(info);
    var c = F.tela(destra, 0.6), tab = F.el('div'); destra.appendChild(tab);
    function calcola() { ris = morseNumerico(MOLECOLE[mol], 8); disegna(); }
    function disegna() {
      var m = MOLECOLE[mol], xs = [], vs = [];
      for (var i = 0; i < ris.x.length; i += 10) { xs.push(ris.x[i]); vs.push(m.De * Math.pow(1 - Math.exp(-m.a * (ris.x[i] - m.re)), 2)); }
      var Emax = ris.E[7] * 1.25;
      var linee = ris.E.map(function (E, n) { return { y: E, col: COLORI[n], etich: 'v=' + n }; });
      F.grafico(c, { serie: [{ x: xs, y: vs, col: '#8494a8', larg: 2 }], linee: linee, xmin: m.re - 0.45, xmax: m.re + 1.3, ymin: 0, ymax: Emax,
                     xl: ['distanza internucleare r (Å)', 'internuclear distance r (Å)'], yl: ['energia (cm⁻¹)', 'energy (cm⁻¹)'] });
      var h = '<table class="bsiFX-tab"><tr><th>v</th><th>' + t('E numerica (cm⁻¹)', 'numerical E (cm⁻¹)') + '</th><th>' + t('Morse esatto', 'exact Morse') + '</th><th>ΔE v→v+1</th></tr>';
      for (var n = 0; n < 8; n++) h += '<tr><td>' + n + '</td><td class="bsiFX-num">' + ris.E[n].toFixed(1) + '</td><td class="bsiFX-num">' + morseEsatto(m, n).toFixed(1) + '</td><td class="bsiFX-num">' + (n < 7 ? (ris.E[n + 1] - ris.E[n]).toFixed(1) : '') + '</td></tr>';
      tab.innerHTML = h + '</table>';
      var fond = ris.E[1] - ris.E[0];
      info.innerHTML = 'Dₑ = ' + m.De + ' cm⁻¹ · a = ' + m.a + ' Å⁻¹ · rₑ = ' + m.re + ' Å · μ = ' + m.mu + ' u<br><br>' +
        t('Fondamentale calcolata', 'Computed fundamental') + ': <b class="bsiFX-num">' + fond.toFixed(1) + ' cm⁻¹</b><br>' +
        t('Sperimentale', 'Experimental') + ': <b class="bsiFX-num">' + m.nu0 + ' cm⁻¹</b> (' + ((fond - m.nu0) / m.nu0 * 100).toFixed(2) + ' %)<br><br>' +
        t('Il potenziale di Morse è un modello: lo scarto dall’esperimento è il suo limite, non un errore del calcolo — il numero esatto del modello è nella tabella, e il calcolo lo riproduce.',
          'The Morse potential is a model: the gap to experiment is its limit, not an error of the computation — the model’s exact number is in the table, and the computation reproduces it.');
    }
    calcola();
    F.alRidimensiona(disegna);
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
  function schedaNuvola3D(pan) {
    var st = { tipo: 'armonico', par: { w: 1 }, n: [1, 1, 0], sov: 'x', taglio: false, pausa: MENO_MOTO, N: 24000 }, cb = {}, ris = null, cont = F.el('div');
    F.scelta(pan, ['Potenziale', 'Potential'], [['armonico', ['Oscillatore armonico 3D', '3D harmonic oscillator']], ['pozzo', ['Scatola cubica (pozzo infinito)', 'Cubic box (infinite well)']], ['doppia', ['Doppia buca lungo x (NH₃)', 'Double well along x (NH₃)']]], st.tipo, function (v) { st.tipo = v; parametri(); calcola(); });
    pan.appendChild(cont);
    ['x', 'y', 'z'].forEach(function (a, i) { F.cursore(pan, ['n' + '₁₂₃'[i] + ' (' + a + ')', 'n' + '₁₂₃'[i] + ' (' + a + ')'], 0, 4, 1, st.n[i], function (v) { st.n[i] = v; calcola(); }); });
    F.scelta(pan, ['Sovrapposizione con', 'Superposition with'], [['no', ['nessuna (stato stazionario)', 'none (stationary state)']], ['x', ['lo stato con n₁ + 1', 'the state with n₁ + 1']], ['y', ['lo stato con n₂ + 1', 'the state with n₂ + 1']], ['z', ['lo stato con n₃ + 1', 'the state with n₃ + 1']]], st.sov, function (v) { st.sov = v; calcola(); });
    var cT = F.el('input', { type: 'checkbox' }); cT.addEventListener('change', function () { st.taglio = cT.checked; if (cb.nuovo) cb.nuovo(); });
    pan.appendChild(F.el('label', { style: 'display:flex;gap:6px;align-items:center;font-size:.82rem;color:#aebccd;margin:6px 0' }, [cT, F.el('span', { testo: t('taglia a metà (y < 0): si vedono i piani nodali', 'cut in half (y < 0): the nodal planes show') })]));
    var bp = F.bottone(pan, st.pausa ? ['▶ Avvia il tempo', '▶ Run time'] : ['⏸ Ferma il tempo', '⏸ Stop time'], function () { st.pausa = !st.pausa; bp.textContent = F.tt(st.pausa ? ['▶ Avvia il tempo', '▶ Run time'] : ['⏸ Ferma il tempo', '⏸ Stop time']); if (cb.sveglia) cb.sveglia(); });
    var info = F.el('div', { 'class': 'bsiFX-nota' }), vivo = F.el('div', { 'class': 'bsiFX-nota' }), spiega = F.el('div', { 'class': 'bsiFX-nota' });
    pan.appendChild(info); pan.appendChild(vivo); pan.appendChild(spiega);
    spiega.innerHTML = t('Ogni punto è una posizione possibile della particella estratta esattamente da |ψ|²: poiché il potenziale è la somma di tre potenziali 1D, ψ è il prodotto delle tre funzioni d’onda calcolate dal risolutore della prima scheda. Azzurro dove ψ > 0, arancio dove ψ < 0; i piani senza punti sono i nodi (n₁ + n₂ + n₃ in tutto). Con una sovrapposizione la nuvola non è più ferma: le due parti interferiscono e la densità oscilla con periodo 2π/ΔE (qui rallentato a 4 s). La sfera a reticolo nell’oscillatore è il confine classico V = E: i punti fuori sono l’effetto tunnel.',
      'Each point is a possible particle position drawn exactly from |ψ|²: since the potential is the sum of three 1D potentials, ψ is the product of three wavefunctions computed by the solver of the first tab. Blue where ψ > 0, orange where ψ < 0; the empty planes are the nodes (n₁ + n₂ + n₃ in all). With a superposition the cloud is no longer still: the two parts interfere and the density oscillates with period 2π/ΔE (slowed to 4 s here). The wire sphere in the oscillator is the classical boundary V = E: points outside it are tunnelling.');
    function parametri() {
      cont.innerHTML = ''; st.par = {};
      POT[st.tipo].par.forEach(function (p) { st.par[p[0]] = p[5]; F.cursore(cont, p[1], p[2], p[3], p[4], p[5], function (v) { st.par[p[0]] = v; calcola(); }); });
    }
    function nB() { if (st.sov === 'no') return null; var m = st.n.slice(); m['xyz'.indexOf(st.sov)]++; return m; }
    function calcola() {
      var s = stati3D(st.tipo, st.par, 6), B = nB(), EA = energia3D(s, st.n), EB = B ? energia3D(s, B) : NaN, ex = esatta3D(st.tipo, st.par, st.n);
      var c = campiona3D(s, st.n, B, st.N, 11), V = s.V, fuori = 0;
      for (var i = 0; i < c.N; i++) if (V(c.p[3 * i], c.p[3 * i + 1], c.p[3 * i + 2]) > EA) fuori++;
      var ax = B ? 'xyz'.indexOf(st.sov) : -1, xab = B ? elementoX(s.assi[ax], st.n[ax], B[ax]) : 0;
      ris = { s: s, c: c, B: B, EA: EA, EB: EB, dE: EB - EA, ax: ax, xab: xab, t: 0 };
      info.innerHTML = 'ψ<sub>' + st.n.join('') + '</sub> · E = <b class="bsiFX-num">' + EA.toFixed(5) + '</b>' + (isFinite(ex) ? ' (' + t('esatta ', 'exact ') + ex.toFixed(5) + ')' : '') + ' · ' + t('degenerazione ', 'degeneracy ') + '<b>' + degenerazione(s, st.n) + '</b>' +
        (st.tipo === 'armonico' ? ' (' + t('attesa ', 'expected ') + '(N+1)(N+2)/2 = ' + ((st.n[0] + st.n[1] + st.n[2] + 1) * (st.n[0] + st.n[1] + st.n[2] + 2) / 2) + ')' : '') + '<br>' +
        t('Superfici nodali: ', 'Nodal surfaces: ') + (st.n[0] + st.n[1] + st.n[2]) + ' · ' + t('punti fuori dalla regione classica V > E: ', 'points outside the classical region V > E: ') + '<b class="bsiFX-num">' + (100 * fuori / c.N).toFixed(1) + ' %</b>' +
        (B ? '<br>' + t('Sovrapposizione con ψ', 'Superposition with ψ') + '<sub>' + B.join('') + '</sub> (E = ' + EB.toFixed(4) + '): ΔE = ' + ris.dE.toFixed(4) + ', ' + t('periodo ', 'period ') + '2π/ΔE = <b class="bsiFX-num">' + (2 * Math.PI / ris.dE).toFixed(4) + '</b> · ⟨' + 'xyz'[ax] + '⟩(t) = ' + t('⟨A|', '⟨A|') + 'xyz'[ax] + '|B⟩ cos ΔE t, ' + t('ampiezza ', 'amplitude ') + '<b class="bsiFX-num">' + Math.abs(xab).toFixed(4) + '</b>' : '');
      if (cb.nuovo) cb.nuovo();
    }
    /* il campionamento (decine di migliaia di punti) fuori dal clic */
    parametri(); info.textContent = t('Calcolo degli stati…', 'Computing the states…'); setTimeout(calcola, 0);
    return {
      nome: ['Densità di probabilità |ψ|² in 3D', 'Probability density |ψ|² in 3D'],
      tre: function (S, T, L3) {
        var punti = null, geo = null, col = null, extra = [], sc = 1;
        cb.sveglia = function () { S.avvia(); };
        cb.nuovo = function () {
          if (punti) { S.radice.remove(punti); geo.dispose(); }
          extra.forEach(function (o) { S.radice.remove(o); o.traverse(function (x) { if (x.geometry) x.geometry.dispose(); }); }); extra = [];
          var c = ris.c, rr = []; for (var i = 0; i < c.N; i += 7) rr.push(Math.hypot(c.p[3 * i], c.p[3 * i + 1], c.p[3 * i + 2])); rr.sort(function (a, b) { return a - b; });
          var r97 = (st.tipo === 'pozzo' ? st.par.L * 0.87 : rr[Math.floor(rr.length * 0.97)]) || 1; sc = 3.3 / r97;
          var pos = []; ris.idx = [];
          for (i = 0; i < c.N; i++) { if (st.taglio && c.p[3 * i + 1] > 0) continue; pos.push(c.p[3 * i] * sc, c.p[3 * i + 1] * sc, c.p[3 * i + 2] * sc); ris.idx.push(i); }
          geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); col = new Float32Array(pos.length); geo.setAttribute('color', new T.BufferAttribute(col, 3));
          punti = new T.Points(geo, new T.PointsMaterial({ size: 0.07, vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false, blending: T.AdditiveBlending }));
          S.aggiungi(punti);
          /* il contorno: la scatola, o la sfera del confine classico dell'oscillatore */
          if (st.tipo === 'pozzo') { var h = st.par.L / 2 * sc, b = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(2 * h, 2 * h, 2 * h)), new T.LineBasicMaterial({ color: 0x5eead4, transparent: true, opacity: 0.6 })); S.aggiungi(b); extra.push(b); }
          if (st.tipo === 'armonico') { var rc = Math.sqrt(2 * ris.EA) / st.par.w * sc, sf = new T.LineSegments(new T.WireframeGeometry(new T.SphereGeometry(rc, 24, 14)), new T.LineBasicMaterial({ color: 0x8494a8, transparent: true, opacity: 0.22 })); S.aggiungi(sf); extra.push(sf); }
          var as = L3.assi(T, 4, ['x', 'y', 'z'], 0.3); S.aggiungi(as); extra.push(as);
          ris.t = 0; colora(); S.sporca = true; S.avvia();
        };
        function colora() {
          var c = ris.c, tt = ris.t, B = !!ris.B, xm = 0, sw = 0;
          for (var k = 0; k < ris.idx.length; k++) {
            var i = ris.idx[k], w = peso3D(c.a[i], c.b[i], ris.dE, tt, B), re = B ? c.a[i] + c.b[i] * Math.cos(ris.dE * tt) : c.a[i], f = 0.5 * w;
            if (re >= 0) { col[3 * k] = 0.22 * f; col[3 * k + 1] = 0.55 * f; col[3 * k + 2] = 1.0 * f; } else { col[3 * k] = 1.0 * f; col[3 * k + 1] = 0.45 * f; col[3 * k + 2] = 0.18 * f; }
          }
          if (B) { for (var j = 0; j < c.N; j++) { var w2 = peso3D(c.a[j], c.b[j], ris.dE, tt, true); xm += w2 * c.p[3 * j + ris.ax]; sw += w2; } }
          geo.attributes.color.needsUpdate = true;
          if (B) vivo.innerHTML = 't = ' + tt.toFixed(3) + ' · ⟨' + 'xyz'[ris.ax] + '⟩ ' + t('misurato sui punti ', 'measured on the points ') + '<b class="bsiFX-num">' + (xm / sw).toFixed(3) + '</b> · ' + t('teoria ', 'theory ') + '<b class="bsiFX-num">' + (ris.xab * Math.cos(ris.dE * tt)).toFixed(3) + '</b>';
          else vivo.textContent = t('Stato stazionario: |ψ|² non dipende dal tempo (cambia solo la fase globale e^(−iEt)).', 'Stationary state: |ψ|² does not depend on time (only the global phase e^(−iEt) changes).');
          S.didascalia.textContent = 'ψ' + st.n.join('') + (ris.B ? ' + ψ' + ris.B.join('') + ' · t = ' + tt.toFixed(2) : '') + ' · ' + t('azzurro ψ > 0, arancio ψ < 0', 'blue ψ > 0, orange ψ < 0');
        }
        cb.nuovo();
        var acc = 0;
        S.ogniFotogramma(function (dt) {
          if (!ris.B || st.pausa) return false;
          ris.t += dt * (2 * Math.PI / ris.dE) / 4;
          acc += dt; if (acc < 1 / 30) return true; acc = 0;
          colora(); return true;
        });
        S.inquadra(13, 0.75, 1.15);
      }
    };
  }

  F.sezione('sschrod', {
    titolo: ['🌊 Laboratorio di Schrödinger', '🌊 Schrödinger laboratory'],
    sotto: ['L’equazione di Schrödinger risolta numericamente: stati stazionari di pozzi e oscillatori, il pacchetto d’onda che attraversa una barriera, le vibrazioni delle molecole reali.',
            'The Schrödinger equation solved numerically: stationary states of wells and oscillators, a wave packet crossing a barrier, the vibrations of real molecules.'],
    schede: [
      { nome: ['Stati stazionari', 'Stationary states'], costruisci: schedaStazionari },
      { nome: ['Effetto tunnel', 'Tunnelling'], costruisci: schedaTunnel },
      { nome: ['Molecole reali (Morse)', 'Real molecules (Morse)'], costruisci: schedaMolecole },
      { nome: ['🧊 Nuvola 3D |ψ|²', '🧊 3D cloud |ψ|²'], costruisci: scheda3D(schedaNuvola3D) }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
