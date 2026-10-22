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

  F.sezione('sschrod', {
    titolo: ['🌊 Laboratorio di Schrödinger', '🌊 Schrödinger laboratory'],
    sotto: ['L’equazione di Schrödinger risolta numericamente: stati stazionari di pozzi e oscillatori, il pacchetto d’onda che attraversa una barriera, le vibrazioni delle molecole reali.',
            'The Schrödinger equation solved numerically: stationary states of wells and oscillators, a wave packet crossing a barrier, the vibrations of real molecules.'],
    schede: [
      { nome: ['Stati stazionari', 'Stationary states'], costruisci: schedaStazionari },
      { nome: ['Effetto tunnel', 'Tunnelling'], costruisci: schedaTunnel },
      { nome: ['Molecole reali (Morse)', 'Real molecules (Morse)'], costruisci: schedaMolecole }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
