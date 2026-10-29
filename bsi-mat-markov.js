/* ═══════════════════════════════════════════════════════════════════════════
   bsi-mat-markov.js — 🔗 Catene di Markov e processi stocastici
   BioSpecInfo · © Samuele Pio Provenzano

   Il caso con memoria corta: il futuro dipende solo dal presente. Ogni
   risultato della teoria si confronta con una simulazione (numeri casuali
   riproducibili, mulberry32) e con un secondo calcolo esatto:

   · UNA CATENA che si scrive a mano (da 2 a 6 stati, la matrice di
     transizione modificabile) disegnata come grafo, con un camminatore che
     salta da uno stato all'altro: le frequenze empiriche vanno verso la
     distribuzione stazionaria π, calcolata con il metodo delle potenze e
     risolvendo il sistema lineare π(P − I) = 0, Σπ = 1; gli autovalori
     (Faddeev–LeVerrier e Durand–Kerner) dicono quanto in fretta si
     mescola (|λ₂|) e se la catena e' periodica; il tempo medio di ritorno
     e' 1/π_i (Kac);
   · PAGERANK: il navigatore casuale che segue i link con probabilita'
     0,85 e salta altrove con 0,15; il vettore dei punteggi con le potenze
     e con la soluzione diretta di (I − dMᵀ)r = (1 − d)/n, piu' una
     simulazione del navigatore;
   · LA ROVINA DEL GIOCATORE: la formula chiusa (1 − (q/p)^i)/(1 − (q/p)^N),
     la ricorrenza risolta come sistema tridiagonale (Thomas), migliaia di
     partite simulate; la durata media i(N − i) nel gioco equo;
   · PASSEGGIATE ALEATORIE in 1, 2 e 3 dimensioni: lo spostamento
     quadratico medio cresce come t in ogni dimensione, la distribuzione
     diventa gaussiana, e il ritorno all'origine e' certo in 1D e 2D ma
     non in 3D (Pólya: 0,3405), con le passeggiate disegnate in 3D;
   · IL PROCESSO DI POISSON E LA CODA M/M/1: conteggi poissoniani, attese
     esponenziali, la coda simulata evento per evento contro
     L = ρ/(1 − ρ), W = 1/(μ − λ) e la legge di Little L = λW.

   I calcoli stanno in F.calcolo.markov (provati in
   tools/banchi/verifiche/verifica-smatmarkov.js).
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt, PI = Math.PI;

  /* ═══ calcoli ═══════════════════════════════════════════════════════════ */
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var r = Math.imul(a ^ a >>> 15, 1 | a); r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r; return ((r ^ r >>> 14) >>> 0) / 4294967296; }; }
  function copia(P) { return P.map(function (r) { return r.slice(); }); }
  function normalizzaRighe(P) { return P.map(function (r) { var s = r.reduce(function (a, b) { return a + Math.max(0, b); }, 0); return s > 0 ? r.map(function (v) { return Math.max(0, v) / s; }) : r.map(function (_, j) { return 1 / r.length; }); }); }
  function vettMat(v, P) { var n = v.length, o = new Array(n); for (var j = 0; j < n; j++) { var s = 0; for (var i = 0; i < n; i++) s += v[i] * P[i][j]; o[j] = s; } return o; }
  function scarto1(a, b) { var s = 0; for (var i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]); return s; }
  /* metodo delle potenze: π_{k+1} = π_k P a partire da uno stato */
  function stazionariaPotenze(P, da, tol, maxit) {
    var n = P.length, v = [], storia = [], k;
    for (k = 0; k < n; k++) v.push(k === (da || 0) ? 1 : 0);
    for (k = 0; k < (maxit || 5000); k++) { var w = vettMat(v, P), d = scarto1(v, w); storia.push(d); v = w; if (d < (tol || 1e-13)) return { pi: v, iter: k + 1, storia: storia, converge: true }; }
    return { pi: v, iter: k, storia: storia, converge: false };
  }
  /* eliminazione di Gauss con pivot parziale; null se singolare */
  function risolvi(A, b) {
    var n = A.length, M = A.map(function (r, i) { return r.concat([b[i]]); });
    for (var c = 0; c < n; c++) {
      var p = c; for (var r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
      if (Math.abs(M[p][c]) < 1e-12) return null;
      var tmp = M[c]; M[c] = M[p]; M[p] = tmp;
      for (r = c + 1; r < n; r++) { var f = M[r][c] / M[c][c]; for (var k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
    }
    var x = new Array(n);
    for (var i = n - 1; i >= 0; i--) { var s = M[i][n]; for (var j = i + 1; j < n; j++) s -= M[i][j] * x[j]; x[i] = s / M[i][i]; }
    return x;
  }
  /* π (P − I) = 0 con Σπ = 1: (Pᵀ − I) πᵀ = 0, l'ultima equazione sostituita dalla normalizzazione */
  function stazionariaLineare(P) {
    var n = P.length, A = [], b = [];
    for (var i = 0; i < n; i++) { var r = []; for (var j = 0; j < n; j++) r.push(P[j][i] - (i === j ? 1 : 0)); A.push(r); b.push(0); }
    A[n - 1] = A[n - 1].map(function () { return 1; }); b[n - 1] = 1;
    return risolvi(A, b);
  }
  /* raggiungibilita' e periodo (mcd delle differenze di livello sugli archi, da una visita in ampiezza) */
  function raggiungibili(P, s) { var n = P.length, vis = [], coda = [s]; vis[s] = true; while (coda.length) { var i = coda.shift(); for (var j = 0; j < n; j++) if (P[i][j] > 0 && !vis[j]) { vis[j] = true; coda.push(j); } } return vis; }
  function irriducibile(P) { for (var s = 0; s < P.length; s++) { var v = raggiungibili(P, s); for (var j = 0; j < P.length; j++) if (!v[j]) return false; } return true; }
  function mcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var r = a % b; a = b; b = r; } return a; }
  function periodo(P) {
    var n = P.length, liv = [0], coda = [0], g = 0;
    for (var i = 1; i < n; i++) liv.push(-1);
    while (coda.length) { var a = coda.shift(); for (var j = 0; j < n; j++) if (P[a][j] > 0) { if (liv[j] < 0) { liv[j] = liv[a] + 1; coda.push(j); } else g = mcd(g, liv[a] + 1 - liv[j]); } }
    return g || 0;
  }
  /* autovalori: polinomio caratteristico con Faddeev–LeVerrier, radici con Durand–Kerner */
  function polCaratteristico(A) {
    var n = A.length, c = [1], M = A.map(function (r) { return r.map(function () { return 0; }); }), I = A.map(function (r, i) { return r.map(function (_, j) { return i === j ? 1 : 0; }); });
    for (var k = 1; k <= n; k++) {
      var AM = A.map(function (r, i) { return r.map(function (_, j) { var s = 0; for (var q = 0; q < n; q++) s += A[i][q] * M[q][j]; return s; }); });
      var Mk = AM.map(function (r, i) { return r.map(function (v, j) { return v + c[k - 1] * I[i][j]; }); });
      var AMk = A.map(function (r, i) { return r.map(function (_, j) { var s = 0; for (var q = 0; q < n; q++) s += A[i][q] * Mk[q][j]; return s; }); });
      var tr = 0; for (var i = 0; i < n; i++) tr += AMk[i][i];
      c.push(-tr / k); M = Mk;
    }
    return c; /* λⁿ + c₁λⁿ⁻¹ + … + c_n */
  }
  function radiciPolinomio(c) {
    var n = c.length - 1, z = [], k, it;
    for (k = 0; k < n; k++) { var a = 2 * PI * k / n + 0.4; z.push([0.9 * Math.cos(a), 0.9 * Math.sin(a)]); }
    function val(x) { var r = [1, 0]; for (var i = 1; i <= n; i++) r = [r[0] * x[0] - r[1] * x[1] + c[i], r[0] * x[1] + r[1] * x[0]]; return r; }
    for (it = 0; it < 800; it++) {
      var cambio = 0;
      for (k = 0; k < n; k++) {
        var num = val(z[k]), den = [1, 0];
        for (var j = 0; j < n; j++) if (j !== k) { var d = [z[k][0] - z[j][0], z[k][1] - z[j][1]]; den = [den[0] * d[0] - den[1] * d[1], den[0] * d[1] + den[1] * d[0]]; }
        var q = den[0] * den[0] + den[1] * den[1]; if (q === 0) q = 1e-300;
        var dz = [(num[0] * den[0] + num[1] * den[1]) / q, (num[1] * den[0] - num[0] * den[1]) / q];
        z[k] = [z[k][0] - dz[0], z[k][1] - dz[1]]; cambio = Math.max(cambio, Math.hypot(dz[0], dz[1]));
      }
      if (cambio < 1e-15) break;
    }
    return z.sort(function (a, b) { return Math.hypot(b[0], b[1]) - Math.hypot(a[0], a[1]); });
  }
  function autovalori(P) { return radiciPolinomio(polCaratteristico(P)); }
  function determinante(A) { var n = A.length, M = copia(A), d = 1; for (var c = 0; c < n; c++) { var p = c; for (var r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r; if (M[p][c] === 0) return 0; if (p !== c) { var tm = M[c]; M[c] = M[p]; M[p] = tm; d = -d; } d *= M[c][c]; for (r = c + 1; r < n; r++) { var f = M[r][c] / M[c][c]; for (var k = c; k < n; k++) M[r][k] -= f * M[c][k]; } } return d; }
  /* simulazione: n passi da s0; conteggi e tempi medi di ritorno */
  function scegli(riga, u) { var s = 0; for (var j = 0; j < riga.length; j++) { s += riga[j]; if (u < s) return j; } return riga.length - 1; }
  function simulaCatena(P, s0, n, seme) {
    var r = mulberry32(seme || 1), N = P.length, conta = [], ultimo = [], somRit = [], nRit = [], s = s0 || 0, k;
    for (k = 0; k < N; k++) { conta.push(0); ultimo.push(-1); somRit.push(0); nRit.push(0); }
    for (k = 0; k < n; k++) { conta[s]++; if (ultimo[s] >= 0) { somRit[s] += k - ultimo[s]; nRit[s]++; } ultimo[s] = k; s = scegli(P[s], r()); }
    return { freq: conta.map(function (c) { return c / n; }), ritorno: somRit.map(function (v, i) { return nRit[i] ? v / nRit[i] : NaN; }), finale: s };
  }
  var PRESET = {
    meteo: { nome: ['Meteo: sole, nuvole, pioggia', 'Weather: sun, clouds, rain'], stati: ['☀️', '☁️', '🌧️'], P: [[0.7, 0.2, 0.1], [0.3, 0.4, 0.3], [0.2, 0.4, 0.4]] },
    ciclo: { nome: ['Ciclo pigro (4 stati)', 'Lazy cycle (4 states)'], P: [[0.5, 0.25, 0, 0.25], [0.25, 0.5, 0.25, 0], [0, 0.25, 0.5, 0.25], [0.25, 0, 0.25, 0.5]] },
    ehrenfest: { nome: ['Urna di Ehrenfest (4 palline, periodica)', 'Ehrenfest urn (4 balls, periodic)'], P: [[0, 1, 0, 0, 0], [0.25, 0, 0.75, 0, 0], [0, 0.5, 0, 0.5, 0], [0, 0, 0.75, 0, 0.25], [0, 0, 0, 1, 0]] },
    rotazione: { nome: ['Rotazione 0 → 1 → 2 → 0 (periodo 3)', 'Rotation 0 → 1 → 2 → 0 (period 3)'], P: [[0, 1, 0], [0, 0, 1], [1, 0, 0]] },
    sei: { nome: ['Sei stati (casuale)', 'Six states (random)'], P: null }
  };
  function matriceCasuale(n, seme) { var r = mulberry32(seme || 11), P = []; for (var i = 0; i < n; i++) { var riga = []; for (var j = 0; j < n; j++) riga.push(r() < 0.55 || j === (i + 1) % n ? 0.1 + r() : 0); P.push(riga); } return normalizzaRighe(P); }

  /* ── PageRank ── */
  var RETI = {
    piccola: { nome: ['Piccola rete (8 pagine)', 'Small web (8 pages)'], n: 8, archi: [[0, 1], [0, 2], [1, 2], [2, 0], [3, 2], [4, 2], [4, 5], [5, 4], [5, 2], [6, 2], [6, 4], [7, 2], [7, 6], [1, 3], [3, 7]] },
    stella: { nome: ['Stella (un centro)', 'Star (one hub)'], n: 6, archi: [[1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5]] },
    pozzo: { nome: ['Con una pagina senza link (pozzo)', 'With a page without links (dangling)'], n: 6, archi: [[0, 1], [1, 2], [2, 0], [2, 3], [3, 4], [4, 5], [1, 5], [0, 4]] },
    anello: { nome: ['Anello simmetrico', 'Symmetric ring'], n: 7, archi: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0]] }
  };
  /* la matrice di Google: G = d·S + (1 − d)/n, S con le righe dei pozzi uniformi */
  function matriceGoogle(n, archi, d) {
    var S = [], i, j; for (i = 0; i < n; i++) { S.push([]); for (j = 0; j < n; j++) S[i].push(0); }
    var usc = []; for (i = 0; i < n; i++) usc.push(0); archi.forEach(function (a) { usc[a[0]]++; });
    archi.forEach(function (a) { S[a[0]][a[1]] += 1 / usc[a[0]]; });
    for (i = 0; i < n; i++) if (!usc[i]) for (j = 0; j < n; j++) S[i][j] = 1 / n;
    return S.map(function (r) { return r.map(function (v) { return d * v + (1 - d) / n; }); });
  }
  function pagerankPotenze(n, archi, d, tol) { var G = matriceGoogle(n, archi, d), v = []; for (var i = 0; i < n; i++) v.push(1 / n); var storia = []; for (var k = 0; k < 1000; k++) { var w = vettMat(v, G), e = scarto1(v, w); storia.push(e); v = w; if (e < (tol || 1e-14)) break; } return { r: v, iter: k + 1, storia: storia }; }
  /* metodo indipendente: (I − d Sᵀ) r = (1 − d)/n · 1, poi normalizzazione */
  function pagerankLineare(n, archi, d) {
    var S = matriceGoogle(n, archi, 1), A = [], b = [];
    for (var i = 0; i < n; i++) { var r = []; for (var j = 0; j < n; j++) r.push((i === j ? 1 : 0) - d * S[j][i]); A.push(r); b.push((1 - d) / n); }
    var x = risolvi(A, b), s = x.reduce(function (a, c) { return a + c; }, 0); return x.map(function (v) { return v / s; });
  }
  function navigatore(n, archi, d, passi, seme) { return simulaCatena(matriceGoogle(n, archi, d), 0, passi, seme).freq; }

  /* ── rovina del giocatore ── */
  function probVittoria(p, i, N) { if (Math.abs(p - 0.5) < 1e-12) return i / N; var r = (1 - p) / p; return (1 - Math.pow(r, i)) / (1 - Math.pow(r, N)); }
  function durataAttesa(p, i, N) { if (Math.abs(p - 0.5) < 1e-12) return i * (N - i); var q = 1 - p, r = q / p; return i / (q - p) - N / (q - p) * (1 - Math.pow(r, i)) / (1 - Math.pow(r, N)); }
  /* algoritmo di Thomas per a_i x_{i−1} + b_i x_i + c_i x_{i+1} = d_i */
  function thomas(a, b, c, d) { var n = b.length, cp = [], dp = [], x = new Array(n), i; cp[0] = c[0] / b[0]; dp[0] = d[0] / b[0]; for (i = 1; i < n; i++) { var m = b[i] - a[i] * cp[i - 1]; cp[i] = c[i] / m; dp[i] = (d[i] - a[i] * dp[i - 1]) / m; } x[n - 1] = dp[n - 1]; for (i = n - 2; i >= 0; i--) x[i] = dp[i] - cp[i] * x[i + 1]; return x; }
  /* P_i = p P_{i+1} + q P_{i−1}, P_0 = 0, P_N = 1; E_i = 1 + p E_{i+1} + q E_{i−1}, E_0 = E_N = 0 */
  function rovinaRicorsione(p, N) {
    var q = 1 - p, n = N - 1, a = [], b = [], c = [], d = [], e = [], i;
    for (i = 1; i <= n; i++) { a.push(-q); b.push(1); c.push(-p); d.push(i === n ? p : 0); e.push(1); }
    var P = [0].concat(thomas(a, b, c, d), [1]), E = [0].concat(thomas(a, b, c, e), [0]);
    return { P: P, E: E };
  }
  function simulaRovina(p, i0, N, M, seme) {
    var r = mulberry32(seme || 5), vinte = 0, durata = 0;
    for (var k = 0; k < M; k++) { var x = i0, n = 0; while (x > 0 && x < N) { x += r() < p ? 1 : -1; n++; } if (x === N) vinte++; durata += n; }
    return { pVittoria: vinte / M, durata: durata / M };
  }

  /* ── passeggiate aleatorie su reticolo ── */
  function passoReticolo(d, u) { var k = Math.floor(u * 2 * d); return [Math.floor(k / 2), k % 2 ? 1 : -1]; }
  /* MSD(t) mediato su W camminatori e frazione di ritorni all'origine entro T passi */
  function msd(d, W, T, seme) {
    var r = mulberry32(seme || 3), m = new Float64Array(T + 1), ritorni = 0;
    for (var w = 0; w < W; w++) {
      var x = [0, 0, 0], tornato = false;
      for (var s = 1; s <= T; s++) { var k = Math.floor(r() * 2 * d); x[k >> 1] += k & 1 ? 1 : -1; var r2 = x[0] * x[0] + x[1] * x[1] + x[2] * x[2]; m[s] += r2; if (!tornato && r2 === 0) tornato = true; }
      if (tornato) ritorni++;
    }
    for (var k = 0; k <= T; k++) m[k] /= W;
    return { msd: m, ritorno: ritorni / W };
  }
  /* 1D: P(ritorno entro 2n passi) = 1 − C(2n, n)/4ⁿ, con il logaritmo per non traboccare */
  function ritorno1D(T) { var n = Math.floor(T / 2), l = 0; for (var k = 1; k <= n; k++) l += Math.log((n + k) / k); return 1 - Math.exp(l - n * Math.log(4)); }
  var POLYA3D = 0.3405373296;
  function cammino(d, T, seme) { var r = mulberry32(seme || 9), x = [0, 0, 0], o = new Float32Array((T + 1) * 3); for (var s = 1; s <= T; s++) { var p = passoReticolo(d, r()); x[p[0]] += p[1]; o[3 * s] = x[0]; o[3 * s + 1] = x[1]; o[3 * s + 2] = x[2]; } return o; }

  /* ── Poisson e M/M/1 ── */
  function poissonPmf(k, lam) { var l = -lam + k * Math.log(lam); for (var i = 2; i <= k; i++) l -= Math.log(i); return Math.exp(l); }
  function simulaPoisson(lam, Tint, seme) {
    var r = mulberry32(seme || 21), conta = new Int32Array(Tint), tt = 0, attese = [];
    while (true) { var e = -Math.log(1 - r()) / lam; tt += e; if (tt >= Tint) break; conta[Math.floor(tt)]++; attese.push(e); }
    return { conta: conta, attese: attese };
  }
  /* M/M/1 evento per evento: media nel tempo di N(t), attesa media nel sistema, probabilita' di sistema vuoto */
  function simulaMM1(lam, mu, nClienti, seme) {
    var r = mulberry32(seme || 31), tt = 0, prossimoArrivo = -Math.log(1 - r()) / lam, prossimaPartenza = Infinity, coda = [], area = 0, vuoto = 0, sommaW = 0, serviti = 0, ultimo = 0, nMax = 0;
    while (serviti < nClienti) {
      var tn = Math.min(prossimoArrivo, prossimaPartenza), n = coda.length;
      area += n * (tn - ultimo); if (n === 0) vuoto += tn - ultimo; ultimo = tn; tt = tn;
      if (prossimoArrivo <= prossimaPartenza) {
        coda.push(tt); if (coda.length === 1) prossimaPartenza = tt - Math.log(1 - r()) / mu;
        prossimoArrivo = tt - Math.log(1 - r()) / lam; nMax = Math.max(nMax, coda.length);
      } else {
        sommaW += tt - coda.shift(); serviti++;
        prossimaPartenza = coda.length ? tt - Math.log(1 - r()) / mu : Infinity;
      }
    }
    var L = area / tt, W = sommaW / serviti, lamEff = serviti / tt;
    return { L: L, W: W, lamEff: lamEff, p0: vuoto / tt, T: tt, nMax: nMax };
  }
  function teoriaMM1(lam, mu) { var rho = lam / mu; return { rho: rho, L: rho / (1 - rho), W: 1 / (mu - lam), Lq: rho * rho / (1 - rho), Wq: rho / (mu - lam), p0: 1 - rho }; }

  F.calcolo.markov = {
    mulberry32: mulberry32, normalizzaRighe: normalizzaRighe, vettMat: vettMat, stazionariaPotenze: stazionariaPotenze, stazionariaLineare: stazionariaLineare, risolvi: risolvi,
    irriducibile: irriducibile, periodo: periodo, polCaratteristico: polCaratteristico, radiciPolinomio: radiciPolinomio, autovalori: autovalori, determinante: determinante, simulaCatena: simulaCatena, PRESET: PRESET, matriceCasuale: matriceCasuale,
    RETI: RETI, matriceGoogle: matriceGoogle, pagerankPotenze: pagerankPotenze, pagerankLineare: pagerankLineare, navigatore: navigatore,
    probVittoria: probVittoria, durataAttesa: durataAttesa, thomas: thomas, rovinaRicorsione: rovinaRicorsione, simulaRovina: simulaRovina,
    msd: msd, ritorno1D: ritorno1D, POLYA3D: POLYA3D, cammino: cammino,
    poissonPmf: poissonPmf, simulaPoisson: simulaPoisson, simulaMM1: simulaMM1, teoriaMM1: teoriaMM1
  };

  /* ═══ disegno: pezzi comuni ═════════════════════════════════════════════ */
  function grigliaUI(div) { var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); g.appendChild(pan); g.appendChild(dx); div.appendChild(g); return { pan: pan, dx: dx }; }
  function nota(pan, html) { var n = F.el('div', { 'class': 'bsiFX-nota' }); if (html) n.innerHTML = html; pan.appendChild(n); return n; }
  var COLORI = ['#5eead4', '#ffd24a', '#ff8a80', '#c9a0ff', '#6bcfff', '#a8e07a', '#ffb86b', '#f78fb3'];
  function f4(v) { return (+v).toFixed(4); }
  /* il grafo: nodi su un cerchio, archi curvi (i → j e j → i separati), anelli sui nodi */
  function posizioni(n, W, H, R) { var o = []; for (var i = 0; i < n; i++) { var a = -PI / 2 + 2 * PI * i / n; o.push([W / 2 + R * Math.cos(a), H / 2 + R * Math.sin(a)]); } return o; }
  function puntoArco(A, B, u, curva) {
    var mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2, dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1, cx = mx - dy / L * L * curva, cy = my + dx / L * L * curva;
    return [(1 - u) * (1 - u) * A[0] + 2 * (1 - u) * u * cx + u * u * B[0], (1 - u) * (1 - u) * A[1] + 2 * (1 - u) * u * cy + u * u * B[1], cx, cy];
  }
  function puntoAnello(A, centro, u, r) { var a = Math.atan2(A[1] - centro[1], A[0] - centro[0]), c = [A[0] + Math.cos(a) * r * 1.6, A[1] + Math.sin(a) * r * 1.6], th = a + PI + 2 * PI * u; return [c[0] + r * Math.cos(th) * 1.0, c[1] + r * Math.sin(th) * 1.0, c]; }
  function disegnaGrafo(q, P, pos, rNodo, centro, etich, intens, colArco) {
    var n = P.length, i, j;
    for (i = 0; i < n; i++) for (j = 0; j < n; j++) {
      if (!(P[i][j] > 1e-9)) continue;
      q.strokeStyle = colArco || 'rgba(159,177,198,.55)'; q.lineWidth = 1 + 3 * P[i][j]; q.fillStyle = q.strokeStyle;
      if (i === j) { var an = puntoAnello(pos[i], centro, 0, rNodo * 0.8); q.beginPath(); q.arc(an[2][0], an[2][1], rNodo * 0.8, 0, 7); q.stroke(); q.fillStyle = '#cfe3f7'; q.font = '11px system-ui,sans-serif'; q.textAlign = 'center'; q.fillText(P[i][j].toFixed(2), an[2][0] + (an[2][0] - pos[i][0]) * 0.9, an[2][1] + (an[2][1] - pos[i][1]) * 0.9 + 4); continue; }
      var A = pos[i], B = pos[j]; q.beginPath(); for (var k = 0; k <= 24; k++) { var p = puntoArco(A, B, k / 24, 0.18); if (k) q.lineTo(p[0], p[1]); else q.moveTo(p[0], p[1]); } q.stroke();
      /* la punta, appena prima del nodo d'arrivo */
      var u1 = 1 - rNodo / (Math.hypot(B[0] - A[0], B[1] - A[1]) || 1) * 1.05, p1 = puntoArco(A, B, u1, 0.18), p0 = puntoArco(A, B, u1 - 0.05, 0.18), ang = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
      q.beginPath(); q.moveTo(p1[0], p1[1]); q.lineTo(p1[0] - 9 * Math.cos(ang - 0.4), p1[1] - 9 * Math.sin(ang - 0.4)); q.lineTo(p1[0] - 9 * Math.cos(ang + 0.4), p1[1] - 9 * Math.sin(ang + 0.4)); q.closePath(); q.fill();
      var pm = puntoArco(A, B, 0.5, 0.18); q.fillStyle = '#cfe3f7'; q.font = '11px system-ui,sans-serif'; q.textAlign = 'center'; q.fillText(P[i][j].toFixed(2), pm[0], pm[1] - 3);
    }
    for (i = 0; i < n; i++) {
      var g = intens ? intens[i] : 0.5;
      q.fillStyle = 'rgba(94,234,212,' + (0.15 + 0.75 * g).toFixed(3) + ')'; q.strokeStyle = COLORI[i % COLORI.length]; q.lineWidth = 2.5;
      q.beginPath(); q.arc(pos[i][0], pos[i][1], rNodo, 0, 7); q.fill(); q.stroke();
      q.fillStyle = '#ffffff'; q.font = 'bold 14px system-ui,sans-serif'; q.textAlign = 'center'; q.fillText(etich ? etich[i] : String(i), pos[i][0], pos[i][1] + 5);
    }
  }

  /* ═══ 1. la catena ══════════════════════════════════════════════════════ */
  function schedaCatena(div) {
    var G = grigliaUI(div), pan = G.pan, st = { preset: 'meteo', P: copia(PRESET.meteo.P), stati: PRESET.meteo.stati };
    var selP = F.scelta(pan, ['Esempio', 'Example'], Object.keys(PRESET).map(function (k) { return [k, PRESET[k].nome]; }), st.preset, function (v) { st.preset = v; st.P = PRESET[v].P ? copia(PRESET[v].P) : matriceCasuale(6, 11); st.stati = PRESET[v].stati || null; tabella(); ricomincia(); });
    var cn = F.cursore(pan, ['numero di stati', 'number of states'], 2, 6, 1, st.P.length, function (v) { st.P = matriceCasuale(v, 7 + v); st.stati = null; tabella(); ricomincia(); });
    var tabBox = F.el('div', { style: 'overflow-x:auto;max-width:100%' }); pan.appendChild(tabBox);
    F.bottone(pan, ['+10 000 passi', '+10,000 steps'], function () { salta(10000); });
    var info = nota(pan);
    nota(pan, t('Ogni riga i della matrice P dà le probabilità di andare da i agli altri stati (le righe si normalizzano da sole: scrivi pesi qualsiasi). La distribuzione al passo k è π_k = π₀P^k; se la catena è irriducibile e aperiodica converge all’unica π con πP = π, qualunque sia lo stato iniziale, e la velocità è data dal secondo autovalore |λ₂| (l’errore si riduce di |λ₂| a ogni passo). Il teorema ergodico garantisce che le frequenze di visita lungo una sola traiettoria tendono a π anche se la catena è periodica, mentre π_k allora oscilla e il metodo delle potenze non converge. Il tempo medio di ritorno in i è 1/π_i (Kac).',
      'Each row i of the matrix P gives the probabilities of going from i to the other states (rows are normalised automatically: type any weights). The distribution at step k is π_k = π₀P^k; if the chain is irreducible and aperiodic it converges to the unique π with πP = π, whatever the initial state, and the speed is set by the second eigenvalue |λ₂| (the error shrinks by |λ₂| each step). The ergodic theorem guarantees that visit frequencies along a single trajectory tend to π even if the chain is periodic, while π_k then oscillates and the power method does not converge. The mean return time to i is 1/π_i (Kac).'));
    var cg = F.tela(G.dx, 0.62), cb = F.tela(G.dx, 0.42), cc = F.tela(G.dx, 0.4);
    var rnd, conta, passi, stato, prossimo, fase, pis, pil, pot, lam;
    function tabella() {
      tabBox.innerHTML = ''; var n = st.P.length, tb = F.el('table', { 'class': 'bsiFX-tab', style: 'width:100%;table-layout:fixed;min-width:' + (2 + 3.8 * n) + 'em' }), tr = F.el('tr');
      cn.value = n; var eb = cn.parentNode && cn.parentNode.querySelector('b'); if (eb) eb.textContent = String(n);
      tr.appendChild(F.el('th', { testo: 'P' })); for (var j = 0; j < n; j++) tr.appendChild(F.el('th', { testo: st.stati ? st.stati[j] : String(j) })); tb.appendChild(tr);
      st.P.forEach(function (riga, i) {
        var r = F.el('tr'); r.appendChild(F.el('th', { testo: st.stati ? st.stati[i] : String(i) }));
        riga.forEach(function (v, j) {
          var inp = F.el('input', { type: 'number', min: '0', step: '0.05', value: v.toFixed(2), 'aria-label': 'P' + i + j, style: 'width:100%;min-width:3.6em;padding:3px 4px;font-size:.78rem' });
          inp.addEventListener('change', function () { st.P[i][j] = Math.max(0, +inp.value || 0); st.P = normalizzaRighe(st.P); tabella(); ricomincia(); });
          r.appendChild(F.el('td', null, [inp]));
        });
        tb.appendChild(r);
      });
      tabBox.appendChild(tb);
    }
    function ricomincia() {
      var n = st.P.length; rnd = mulberry32(2024); conta = []; for (var i = 0; i < n; i++) conta.push(0); passi = 0; stato = 0; conta[0] = 1; passi = 1; prossimo = scegli(st.P[0], rnd()); fase = 0;
      pot = stazionariaPotenze(st.P, 0, 1e-13, 4000); pil = stazionariaLineare(st.P); pis = pil || pot.pi;
      lam = autovalori(st.P);
      var irr = irriducibile(st.P), per = periodo(st.P), lam2 = lam.length > 1 ? Math.hypot(lam[1][0], lam[1][1]) : 0;
      var res = pil ? scarto1(vettMat(pil, st.P), pil) : NaN, sim = simulaCatena(st.P, 0, 200000, 99);
      info.innerHTML = (irr ? t('Irriducibile', 'Irreducible') : '<span class="bsiFX-ko">' + t('Non irriducibile: π può non essere unica', 'Not irreducible: π may not be unique') + '</span>') + ' · ' + t('periodo ', 'period ') + '<b>' + per + '</b>' + (per > 1 ? t(' (periodica: π_k oscilla)', ' (periodic: π_k oscillates)') : '') + '<br>' +
        t('π (sistema lineare): ', 'π (linear system): ') + (pil ? '<b>' + pil.map(f4).join(', ') + '</b> · |πP − π|₁ = ' + res.toExponential(1) : t('sistema singolare', 'singular system')) + '<br>' +
        t('π (potenze da 0): ', 'π (powers from 0): ') + pot.pi.map(f4).join(', ') + ' · ' + (pot.converge ? t('convergenza in ', 'converged in ') + pot.iter + t(' passi', ' steps') : '<span class="bsiFX-ko">' + t('non converge', 'does not converge') + '</span>') + '<br>' +
        t('Autovalori: ', 'Eigenvalues: ') + lam.map(function (z) { return Math.abs(z[1]) < 1e-9 ? fmt(z[0]) : fmt(z[0]) + (z[1] < 0 ? '−' : '+') + fmt(Math.abs(z[1])) + 'i'; }).join(', ') + ' · |λ₂| = <b>' + lam2.toFixed(4) + '</b><br>' +
        t('Tempi di ritorno (200 000 passi simulati) contro 1/π_i: ', 'Return times (200,000 simulated steps) against 1/π_i: ') + sim.ritorno.map(function (v, i) { return fmt(v) + '/' + fmt(1 / pis[i]); }).join(', ');
      /* convergenza: |π_k − π|₁ e |λ₂|^k */
      var K = [], E = [], Lk = [], v = []; for (i = 0; i < n; i++) v.push(i === 0 ? 1 : 0);
      for (var k = 0; k <= 40; k++) { K.push(k); E.push(Math.log10(Math.max(1e-16, scarto1(v, pis)))); Lk.push(Math.log10(Math.max(1e-16, Math.pow(lam2, k)))); v = vettMat(v, st.P); }
      F.grafico(cc, { serie: [{ x: K, y: E, col: '#5eead4', etich: ['|π_k − π|₁', '|π_k − π|₁'] }, { x: K, y: Lk, col: '#ffd24a', tratt: true, etich: ['|λ₂|^k', '|λ₂|^k'] }], ymin: -16, xl: ['passo k', 'step k'], yl: ['log₁₀', 'log₁₀'], legenda: [{ col: '#5eead4', etich: ['|π_k − π|₁ (da π₀ = stato 0)', '|π_k − π|₁ (from π₀ = state 0)'] }, { col: '#ffd24a', etich: ['|λ₂|^k', '|λ₂|^k'] }], descr: ['Convergenza alla distribuzione stazionaria', 'Convergence to the stationary distribution'] });
    }
    function salta(m) { for (var k = 0; k < m; k++) { stato = prossimo; conta[stato]++; passi++; prossimo = scegli(st.P[stato], rnd()); } fase = 0; }
    tabella(); ricomincia();
    F.anima(cg, function (dt) {
      fase += dt * 2.2; while (fase >= 1) { fase -= 1; stato = prossimo; conta[stato]++; passi++; prossimo = scegli(st.P[stato], rnd()); }
      var Pp = F.pennello(cg), q = Pp.q, W = Pp.W, H = Pp.H, n = st.P.length, R = Math.min(W, H) * 0.32, rN = Math.max(16, Math.min(26, R * 0.22)), pos = posizioni(n, W, H, R), centro = [W / 2, H / 2];
      var fr = conta.map(function (c) { return c / passi; }), mx = Math.max.apply(null, fr);
      disegnaGrafo(q, st.P, pos, rN, centro, st.stati, fr.map(function (v) { return v / (mx || 1); }));
      var w; if (stato === prossimo) { var an = puntoAnello(pos[stato], centro, fase, rN * 0.8); w = [an[0], an[1]]; } else w = puntoArco(pos[stato], pos[prossimo], fase, 0.18);
      var gr = q.createRadialGradient(w[0], w[1], 0, w[0], w[1], 14); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.4, 'rgba(255,210,74,.9)'); gr.addColorStop(1, 'rgba(255,210,74,0)');
      q.fillStyle = gr; q.beginPath(); q.arc(w[0], w[1], 14, 0, 7); q.fill();
      q.fillStyle = '#cfe3f7'; q.font = '12px system-ui,sans-serif'; q.textAlign = 'left'; q.fillText(t('passi: ', 'steps: ') + passi, 8, 16);
      cg.setAttribute('aria-label', t('Grafo della catena di Markov con il camminatore', 'Markov chain graph with the walker'));
      if (passi % 3 === 0 || dt === 0 || !cb._bsiG) {
        var barre = [], pts = []; fr.forEach(function (v, i) { barre.push({ x: i - 0.12, y: v, col: COLORI[i % COLORI.length], larg: 12 }); pts.push({ x: i + 0.14, y: pis[i], col: '#ffffff', r: 5 }); });
        F.grafico(cb, { barre: barre, punti: pts, xmin: -0.6, xmax: n - 0.4, ymin: 0, ymax: Math.min(1, Math.max.apply(null, fr.concat(pis)) * 1.25), xl: ['stato', 'state'], yl: ['frequenza', 'frequency'], legenda: [{ col: '#5eead4', etich: ['frequenze empiriche', 'empirical frequencies'] }, { col: '#ffffff', etich: ['π stazionaria', 'stationary π'] }], descr: ['Frequenze di visita e distribuzione stazionaria', 'Visit frequencies and stationary distribution'] });
      }
    }, { ricomincia: function () { ricomincia(); } });
  }

  /* ═══ 2. PageRank ═══════════════════════════════════════════════════════ */
  function schedaPagerank(div) {
    var G = grigliaUI(div), pan = G.pan, st = { rete: 'piccola', d: 0.85 };
    F.scelta(pan, ['Rete', 'Web'], Object.keys(RETI).map(function (k) { return [k, RETI[k].nome]; }), st.rete, function (v) { st.rete = v; calcola(); });
    F.cursore(pan, ['smorzamento d', 'damping d'], 0, 0.99, 0.01, st.d, function (v) { st.d = v; calcola(); }, function (v) { return v.toFixed(2); });
    var info = nota(pan);
    nota(pan, t('Il navigatore casuale, da una pagina, segue uno dei suoi link a caso con probabilità d e con probabilità 1 − d salta a una pagina qualsiasi; da una pagina senza link salta sempre a caso. È una catena di Markov con matrice di Google G = dS + (1 − d)/n·J, irriducibile e aperiodica per d < 1: il PageRank è la sua distribuzione stazionaria, l’autovettore sinistro di G per l’autovalore 1. Il metodo delle potenze converge come d^k (il secondo autovalore di G ha modulo ≤ d), per questo Google usava d = 0,85: abbastanza rapido e abbastanza fedele ai link. Con d = 0 tutte le pagine valgono 1/n.',
      'The random surfer, from a page, follows one of its links at random with probability d and with probability 1 − d jumps to any page; from a page with no links it always jumps at random. It is a Markov chain with Google matrix G = dS + (1 − d)/n·J, irreducible and aperiodic for d < 1: PageRank is its stationary distribution, the left eigenvector of G for eigenvalue 1. The power method converges like d^k (the second eigenvalue of G has modulus ≤ d), which is why Google used d = 0.85: fast enough and faithful enough to the links. With d = 0 all pages are worth 1/n.'));
    var cg = F.tela(G.dx, 0.62), cc = F.tela(G.dx, 0.42);
    var rp, rl, sim, R0;
    function calcola() {
      R0 = RETI[st.rete]; rp = pagerankPotenze(R0.n, R0.archi, st.d); rl = pagerankLineare(R0.n, R0.archi, st.d); sim = navigatore(R0.n, R0.archi, st.d, 200000, 77);
      var ord = rp.r.map(function (v, i) { return [v, i]; }).sort(function (a, b) { return b[0] - a[0]; });
      info.innerHTML = t('Potenze: ', 'Powers: ') + rp.iter + t(' iterazioni (tolleranza 10⁻¹⁴)', ' iterations (tolerance 10⁻¹⁴)') + '<br>' + t('Scarto potenze − sistema lineare: ', 'Power − linear system gap: ') + '<b>' + scarto1(rp.r, rl).toExponential(1) + '</b><br>' +
        t('Classifica: ', 'Ranking: ') + ord.map(function (o) { return o[1] + ' (' + f4(o[0]) + ')'; }).join(', ') + '<br>' + t('Navigatore simulato (200 000 clic) contro PageRank: scarto ', 'Simulated surfer (200,000 clicks) against PageRank: gap ') + scarto1(sim, rp.r).toExponential(1);
      var K = rp.storia.map(function (_, k) { return k + 1; });
      F.grafico(cc, { serie: [{ x: K, y: rp.storia.map(function (v) { return Math.log10(Math.max(v, 1e-17)); }), col: '#5eead4', etich: ['|r_{k+1} − r_k|₁', '|r_{k+1} − r_k|₁'] }, { x: K, y: K.map(function (k) { return Math.log10(Math.max(1e-17, Math.pow(st.d, k))); }), col: '#ffd24a', tratt: true, etich: ['d^k', 'd^k'] }], ymin: -16, xl: ['iterazione', 'iteration'], yl: ['log₁₀', 'log₁₀'], legenda: [{ col: '#5eead4', etich: ['passo del metodo delle potenze', 'power-method step'] }, { col: '#ffd24a', etich: ['d^k', 'd^k'] }], descr: ['Convergenza del PageRank', 'PageRank convergence'] });
    }
    calcola();
    var surfer = 0, prossimo = 1, fase = 0, rnd = mulberry32(5);
    F.anima(cg, function (dt) {
      var n = R0.n; if (surfer >= n) surfer = 0; if (prossimo >= n) prossimo = 0;
      fase += dt * 1.6; if (fase >= 1) { fase = 0; surfer = prossimo; var Gm = matriceGoogle(n, R0.archi, st.d); prossimo = scegli(Gm[surfer], rnd()); }
      var Pp = F.pennello(cg), q = Pp.q, W = Pp.W, H = Pp.H, R = Math.min(W, H) * 0.34, pos = posizioni(n, W, H, R), mx = Math.max.apply(null, rp.r);
      var A = []; for (var i = 0; i < n; i++) { A.push([]); for (var j = 0; j < n; j++) A[i].push(0); } R0.archi.forEach(function (a) { A[a[0]][a[1]] = 1; });
      q.strokeStyle = 'rgba(159,177,198,.5)'; q.fillStyle = 'rgba(159,177,198,.7)'; q.lineWidth = 1.4;
      R0.archi.forEach(function (a) { var P0 = pos[a[0]], P1 = pos[a[1]], rr = 10 + 22 * rp.r[a[1]] / mx; q.beginPath(); for (var k = 0; k <= 20; k++) { var p = puntoArco(P0, P1, k / 20, 0.12); if (k) q.lineTo(p[0], p[1]); else q.moveTo(p[0], p[1]); } q.stroke(); var u1 = 1 - rr / Math.hypot(P1[0] - P0[0], P1[1] - P0[1]) * 1.05, p1 = puntoArco(P0, P1, u1, 0.12), p0 = puntoArco(P0, P1, u1 - 0.05, 0.12), an = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]); q.beginPath(); q.moveTo(p1[0], p1[1]); q.lineTo(p1[0] - 8 * Math.cos(an - 0.4), p1[1] - 8 * Math.sin(an - 0.4)); q.lineTo(p1[0] - 8 * Math.cos(an + 0.4), p1[1] - 8 * Math.sin(an + 0.4)); q.closePath(); q.fill(); });
      for (i = 0; i < n; i++) { var rr2 = 10 + 22 * rp.r[i] / mx; q.fillStyle = 'rgba(94,234,212,' + (0.2 + 0.7 * rp.r[i] / mx).toFixed(3) + ')'; q.strokeStyle = '#5eead4'; q.lineWidth = 2; q.beginPath(); q.arc(pos[i][0], pos[i][1], rr2, 0, 7); q.fill(); q.stroke(); q.fillStyle = '#ffffff'; q.font = 'bold 12px system-ui,sans-serif'; q.textAlign = 'center'; q.fillText(String(i), pos[i][0], pos[i][1] + 4); q.font = '10px system-ui,sans-serif'; q.fillStyle = '#cfe3f7'; q.fillText(f4(rp.r[i]), pos[i][0], pos[i][1] + rr2 + 12); }
      var w = surfer === prossimo ? pos[surfer] : A[surfer][prossimo] ? puntoArco(pos[surfer], pos[prossimo], fase, 0.12) : [pos[surfer][0] + (pos[prossimo][0] - pos[surfer][0]) * fase, pos[surfer][1] + (pos[prossimo][1] - pos[surfer][1]) * fase - 40 * Math.sin(PI * fase)];
      q.fillStyle = A[surfer][prossimo] || surfer === prossimo ? '#ffd24a' : '#ff8a80'; q.beginPath(); q.arc(w[0], w[1], 7, 0, 7); q.fill();
      q.fillStyle = '#cfe3f7'; q.font = '12px system-ui,sans-serif'; q.textAlign = 'left'; q.fillText(t('giallo: segue un link · rosso: salto casuale', 'yellow: follows a link · red: random jump'), 8, H - 8);
      cg.setAttribute('aria-label', t('Rete di pagine con il PageRank e il navigatore casuale', 'Web graph with PageRank and the random surfer'));
    });
  }

  /* ═══ 3. la rovina del giocatore ════════════════════════════════════════ */
  function schedaRovina(div) {
    var G = grigliaUI(div), pan = G.pan, st = { p: 0.48, i: 10, N: 20 };
    F.cursore(pan, ['probabilità di vincere una mano p', 'probability of winning a hand p'], 0.3, 0.7, 0.01, st.p, function (v) { st.p = v; calcola(); }, function (v) { return v.toFixed(2); });
    var ci = F.cursore(pan, ['capitale iniziale i', 'initial capital i'], 1, 39, 1, st.i, function (v) { st.i = Math.min(v, st.N - 1); calcola(); });
    F.cursore(pan, ['obiettivo N', 'target N'], 4, 40, 1, st.N, function (v) { st.N = v; if (st.i >= v) { st.i = v - 1; ci.value = st.i; } calcola(); });
    var info = nota(pan);
    nota(pan, t('Il giocatore ha i euro e punta 1 euro a mano: vince con probabilità p, perde con q = 1 − p; si ferma a 0 (rovina) o a N. Condizionando sulla prima mano P_i = pP_{i+1} + qP_{i−1}, con P₀ = 0 e P_N = 1: un’equazione alle differenze con soluzione P_i = (1 − (q/p)^i)/(1 − (q/p)^N), e i/N nel gioco equo. La stessa ricorrenza è qui risolta anche come sistema tridiagonale (algoritmo di Thomas), e 4000 partite sono simulate. Basta un piccolo svantaggio (p = 0,48) perché le probabilità crollino quando N cresce: il banco, con capitale enorme, vince quasi sempre. La durata media è i(N − i) se p = ½.',
      'The gambler has i euros and bets 1 euro per hand: wins with probability p, loses with q = 1 − p; stops at 0 (ruin) or at N. Conditioning on the first hand P_i = pP_{i+1} + qP_{i−1}, with P₀ = 0 and P_N = 1: a difference equation with solution P_i = (1 − (q/p)^i)/(1 − (q/p)^N), and i/N in a fair game. The same recurrence is solved here as a tridiagonal system (Thomas algorithm), and 4000 games are simulated. A small disadvantage (p = 0.48) is enough for the odds to collapse as N grows: the house, with a huge capital, almost always wins. The mean duration is i(N − i) if p = ½.'));
    var ca = F.tela(G.dx, 0.5), cc = F.tela(G.dx, 0.45);
    var percorsi = [], rnd = mulberry32(8), simPunti = [], lavoro = 0;
    function calcola() {
      var N = st.N, i0 = Math.min(st.i, N - 1), rec = rovinaRicorsione(st.p, N), X = [], Y = [];
      for (var i = 0; i <= N; i++) { X.push(i); Y.push(probVittoria(st.p, i, N)); }
      simPunti = []; var mio = ++lavoro;
      function grafico() {
        F.grafico(cc, { serie: [{ x: X, y: Y, col: '#5eead4', etich: ['formula', 'formula'] }], punti: rec.P.map(function (v, i) { return { x: i, y: v, col: '#ffd24a', r: 3 }; }).concat(simPunti.map(function (s) { return { x: s[0], y: s[1], col: '#ff8a80', r: 4 }; })), ymin: 0, ymax: 1, xl: ['capitale iniziale i', 'initial capital i'], yl: ['P(arrivare a N)', 'P(reach N)'], legenda: [{ col: '#5eead4', etich: ['formula chiusa', 'closed form'] }, { col: '#ffd24a', etich: ['ricorrenza (Thomas)', 'recurrence (Thomas)'] }, { col: '#ff8a80', etich: ['simulazione (4000 partite)', 'simulation (4000 games)'] }], descr: ['Probabilità di vittoria nella rovina del giocatore', 'Winning probability in gambler’s ruin'] });
      }
      grafico();
      var S = simulaRovina(st.p, i0, N, 4000, 13);
      info.innerHTML = 'P(' + t('vittoria', 'win') + ' | i = ' + i0 + ') = <b>' + probVittoria(st.p, i0, N).toFixed(6) + '</b> (' + t('formula', 'formula') + '), ' + rec.P[i0].toFixed(6) + ' (' + t('ricorrenza', 'recurrence') + '), ' + S.pVittoria.toFixed(4) + ' (' + t('simulazione', 'simulation') + ' ± ' + (2 * Math.sqrt(S.pVittoria * (1 - S.pVittoria) / 4000)).toFixed(4) + ')<br>' +
        t('Durata media: ', 'Mean duration: ') + '<b>' + durataAttesa(st.p, i0, N).toFixed(3) + '</b> (' + t('formula', 'formula') + '), ' + rec.E[i0].toFixed(3) + ' (' + t('ricorrenza', 'recurrence') + '), ' + S.durata.toFixed(2) + ' (' + t('simulazione', 'simulation') + ')';
      /* simulazione su tutti gli i, a lotti */
      var k = 1; (function lotto() { if (mio !== lavoro) return; if (cc.offsetParent === null) { setTimeout(lotto, 400); return; } var fine = Math.min(N - 1, k + 3); for (; k <= fine; k++) simPunti.push([k, simulaRovina(st.p, k, N, 1500, 100 + k).pVittoria]); grafico(); if (k < N) setTimeout(lotto, 0); })();
      percorsi = [];
    }
    calcola();
    F.anima(ca, function (dt) {
      var N = st.N, i0 = Math.min(st.i, N - 1);
      if (percorsi.length < 12 && (!percorsi.length || percorsi[percorsi.length - 1].fine)) percorsi.push({ x: [i0], fine: false });
      var passiF = Math.max(1, Math.round(dt * 60));
      percorsi.forEach(function (p) { if (p.fine) return; for (var k = 0; k < passiF; k++) { var x = p.x[p.x.length - 1]; if (x <= 0 || x >= N) { p.fine = true; break; } p.x.push(x + (rnd() < st.p ? 1 : -1)); } });
      if (percorsi.length >= 12 && percorsi.every(function (p) { return p.fine; })) percorsi = [];
      var Pp = F.pennello(ca), q = Pp.q, W = Pp.W, H = Pp.H, ml = 34, Tm = Math.max(60, 3 * durataAttesa(st.p, i0, N));
      var X = function (k) { return ml + k / Tm * (W - ml - 10); }, Y = function (v) { return H - 20 - v / N * (H - 36); };
      q.strokeStyle = '#ff8a80'; q.beginPath(); q.moveTo(ml, Y(0)); q.lineTo(W - 10, Y(0)); q.stroke(); q.strokeStyle = '#5eead4'; q.beginPath(); q.moveTo(ml, Y(N)); q.lineTo(W - 10, Y(N)); q.stroke();
      q.fillStyle = '#8494a8'; q.font = '11px system-ui,sans-serif'; q.textAlign = 'right'; q.fillText('0', ml - 4, Y(0) + 4); q.fillText(String(N), ml - 4, Y(N) + 4); q.fillText(String(i0), ml - 4, Y(i0) + 4);
      percorsi.forEach(function (p, j) { q.strokeStyle = p.fine ? (p.x[p.x.length - 1] >= N ? 'rgba(94,234,212,.75)' : 'rgba(255,138,128,.75)') : '#ffd24a'; q.lineWidth = 1.4; q.beginPath(); p.x.forEach(function (v, k) { var xx = X(Math.min(k, Tm)); if (k) q.lineTo(xx, Y(v)); else q.moveTo(xx, Y(v)); }); q.stroke(); });
      var v = percorsi.filter(function (p) { return p.fine && p.x[p.x.length - 1] >= N; }).length, r = percorsi.filter(function (p) { return p.fine && p.x[p.x.length - 1] <= 0; }).length;
      q.textAlign = 'left'; q.fillStyle = '#cfe3f7'; q.fillText(t('partite: ', 'games: ') + v + t(' vinte, ', ' won, ') + r + t(' rovinate', ' ruined'), ml + 4, 14);
      ca.setAttribute('aria-label', t('Traiettorie del capitale nella rovina del giocatore', 'Capital trajectories in gambler’s ruin'));
    });
  }

  /* ═══ 4. passeggiate 1D e 2D ════════════════════════════════════════════ */
  function schedaPasseggiate(div) {
    var G = grigliaUI(div), pan = G.pan, st = { W: 3000 };
    var info = nota(pan);
    nota(pan, t('Ogni camminatore fa un passo ±1 a caso a ogni istante. La posizione dopo t passi è una somma di t variabili indipendenti di media 0 e varianza 1: per il teorema del limite centrale si distribuisce come una gaussiana di varianza t (sul reticolo solo le posizioni con la parità di t sono possibili, per questo la densità per sito è 2/√(2πt)·e^(−x²/2t)). Lo spostamento quadratico medio ⟨x²⟩ = t cresce linearmente: la distanza tipica √t, non t, è la firma della diffusione (Einstein: ⟨x²⟩ = 2Dt). In 2D lo stesso vale per ⟨r²⟩ e il cammino riempie il piano come un frattale di dimensione 2.',
      'Each walker takes a random ±1 step at each instant. The position after t steps is a sum of t independent variables with mean 0 and variance 1: by the central limit theorem it is distributed like a Gaussian of variance t (on the lattice only positions with the parity of t are possible, which is why the density per site is 2/√(2πt)·e^(−x²/2t)). The mean square displacement ⟨x²⟩ = t grows linearly: the typical distance √t, not t, is the signature of diffusion (Einstein: ⟨x²⟩ = 2Dt). In 2D the same holds for ⟨r²⟩ and the path fills the plane like a fractal of dimension 2.'));
    var c2 = F.tela(G.dx, 0.6), ch = F.tela(G.dx, 0.45);
    var rnd, X1, tt, cam2, ultimoGrafico = 0;
    function ricomincia() { rnd = mulberry32(42); X1 = new Int32Array(st.W); tt = 0; cam2 = [0, 1, 2, 3, 4].map(function () { return [[0, 0]]; }); }
    ricomincia();
    F.anima(c2, function (dt) {
      var n = Math.max(1, Math.round(dt * 60)); if (tt >= 1600) return false;
      for (var s = 0; s < n && tt < 1600; s++) { tt++; for (var w = 0; w < st.W; w++) X1[w] += rnd() < 0.5 ? 1 : -1; cam2.forEach(function (c) { var p = c[c.length - 1], k = passoReticolo(2, rnd()), np = [p[0], p[1]]; np[k[0]] += k[1]; c.push(np); }); }
      var Pp = F.pennello(c2), q = Pp.q, W = Pp.W, H = Pp.H, sc = Math.min(W, H) / (2 * Math.max(20, 2.6 * Math.sqrt(tt)));
      q.strokeStyle = 'rgba(132,148,168,.25)'; q.beginPath(); q.arc(W / 2, H / 2, Math.sqrt(tt) * sc, 0, 7); q.stroke();
      cam2.forEach(function (c, j) { q.strokeStyle = COLORI[j]; q.lineWidth = 1.2; q.globalAlpha = 0.85; q.beginPath(); c.forEach(function (p, k) { var x = W / 2 + p[0] * sc, y = H / 2 - p[1] * sc; if (k) q.lineTo(x, y); else q.moveTo(x, y); }); q.stroke(); q.globalAlpha = 1; var e = c[c.length - 1]; q.fillStyle = COLORI[j]; q.beginPath(); q.arc(W / 2 + e[0] * sc, H / 2 - e[1] * sc, 4, 0, 7); q.fill(); });
      q.fillStyle = '#ffffff'; q.beginPath(); q.arc(W / 2, H / 2, 3, 0, 7); q.fill();
      q.fillStyle = '#cfe3f7'; q.font = '12px system-ui,sans-serif'; q.textAlign = 'left'; q.fillText(t('5 passeggiate 2D · t = ', '5 2D walks · t = ') + tt + t(' · cerchio di raggio √t', ' · circle of radius √t'), 8, 16);
      c2.setAttribute('aria-label', t('Passeggiate aleatorie nel piano', 'Random walks in the plane'));
      if (tt - ultimoGrafico >= 10 || tt < 3) {
        ultimoGrafico = tt; var lim = Math.max(10, Math.ceil(3.5 * Math.sqrt(tt) / 2) * 2), barre = [], m2 = 0, cnt = {};
        for (w = 0; w < st.W; w++) { cnt[X1[w]] = (cnt[X1[w]] || 0) + 1; m2 += X1[w] * X1[w]; }
        Object.keys(cnt).forEach(function (k) { if (Math.abs(+k) <= lim) barre.push({ x: +k, y: cnt[k] / st.W, col: '#5eead4', larg: Math.max(1.5, 300 / lim) }); });
        var gx = [], gy = []; for (var x = -lim; x <= lim; x += lim / 100) { gx.push(x); gy.push(2 / Math.sqrt(2 * PI * Math.max(1, tt)) * Math.exp(-x * x / (2 * Math.max(1, tt)))); }
        F.grafico(ch, { barre: barre, serie: [{ x: gx, y: gy, col: '#ffd24a', etich: ['gaussiana', 'Gaussian'] }], xmin: -lim, xmax: lim, ymin: 0, xl: ['posizione x (1D)', 'position x (1D)'], yl: ['frazione', 'fraction'], legenda: [{ col: '#5eead4', etich: [st.W + ' camminatori 1D', st.W + ' 1D walkers'] }, { col: '#ffd24a', etich: ['2/√(2πt) e^(−x²/2t)', '2/√(2πt) e^(−x²/2t)'] }], descr: ['Distribuzione delle posizioni in 1D contro la gaussiana', '1D position distribution against the Gaussian'] });
        info.innerHTML = 't = <b>' + tt + '</b><br>⟨x²⟩ ' + t('misurato su ', 'measured over ') + st.W + t(' camminatori: ', ' walkers: ') + '<b>' + (m2 / st.W).toFixed(1) + '</b> (' + t('teoria: t = ', 'theory: t = ') + tt + ', ' + t('errore statistico ≈ ', 'statistical error ≈ ') + (tt * Math.sqrt(2 / st.W)).toFixed(1) + ')';
      }
    }, { ricomincia: ricomincia });
  }

  /* ═══ 5. la passeggiata 3D ══════════════════════════════════════════════ */
  function schedaPasseggiata3D(pan, S, destra) {
    var T = S.T, lab = globale.BSILab3D, st = { K: 6, T: 4000, vel: 1, pausa: false, d: 3 };
    F.scelta(pan, ['Dimensione', 'Dimension'], [['3', t('3D (reticolo cubico)', '3D (cubic lattice)')], ['2', t('2D (nel piano)', '2D (in the plane)')], ['1', t('1D (asse x, il tempo in alto)', '1D (x axis, time upwards)')]], '3', function (v) { st.d = +v; costruisci(); });
    F.cursore(pan, ['camminatori', 'walkers'], 1, 12, 1, st.K, function (v) { st.K = v; costruisci(); });
    F.cursore(pan, ['passi', 'steps'], 500, 10000, 500, st.T, function (v) { st.T = v; costruisci(); });
    var riga = F.el('div', { 'class': 'bsiFX-anim' });
    var bp = F.el('button', { type: 'button', testo: '❚❚', 'aria-label': t('Pausa', 'Pause'), onclick: function () { st.pausa = !st.pausa; bp.textContent = st.pausa ? '▶' : '❚❚'; S.avvia(); } }); riga.appendChild(bp);
    riga.appendChild(F.el('button', { type: 'button', testo: '↺', 'aria-label': t('Ricomincia', 'Restart'), onclick: function () { k = 0; st.pausa = false; bp.textContent = '❚❚'; S.avvia(); } }));
    [0.5, 1, 3].forEach(function (v) { riga.appendChild(F.el('button', { type: 'button', testo: '×' + v, 'aria-label': t('Velocità ', 'Speed ') + v, onclick: function () { st.vel = v; } })); });
    pan.appendChild(riga);
    var info = nota(pan), stat = nota(pan);
    nota(pan, t('Passeggiate sul reticolo: a ogni passo una delle 2d direzioni con la stessa probabilità. Il colore va dal blu (inizio) al giallo (fine); la sfera trasparente ha raggio √t, la distanza quadratica media, perché ⟨r²⟩ = t in ogni dimensione. Pólya (1921): in 1D e 2D il camminatore torna all’origine con probabilità 1 (ricorrente), in 3D solo con probabilità 0,3405 (transiente): «un ubriaco trova sempre la strada di casa, un uccello ubriaco può perdersi per sempre». In 3D il cammino è anche un oggetto frattale di dimensione 2: riempie una regione di raggio √t con t punti.',
      'Lattice walks: at each step one of the 2d directions with equal probability. Colour goes from blue (start) to yellow (end); the transparent sphere has radius √t, the root mean square distance, because ⟨r²⟩ = t in every dimension. Pólya (1921): in 1D and 2D the walker returns to the origin with probability 1 (recurrent), in 3D only with probability 0.3405 (transient): «a drunk man always finds his way home, a drunk bird may get lost forever». In 3D the path is also a fractal of dimension 2: it fills a region of radius √t with t points.'));
    var cm = F.tela(destra, 0.42);
    var linee = [], sfera, k = 0, sc = 1, msdDati = {}, lavoro = 0;
    function costruisci() {
      S.pulisci(); linee = []; k = 0;
      sc = 3.2 / (1.5 * Math.sqrt(st.T));
      /* i colori lungo il tempo, uguali per tutti i camminatori: calcolati una volta */
      var tinte = new Float32Array((st.T + 1) * 3), cc = new T.Color();
      for (var s0 = 0; s0 <= st.T; s0++) { var f0 = s0 / st.T; cc.setHSL(0.62 - 0.5 * f0, 0.9, 0.55 + 0.1 * f0); tinte[3 * s0] = cc.r; tinte[3 * s0 + 1] = cc.g; tinte[3 * s0 + 2] = cc.b; }
      for (var w = 0; w < st.K; w++) {
        var c = cammino(st.d, st.T, 1000 + w * 17), pos = new Float32Array(c.length), col = tinte;
        for (var s = 0; s <= st.T; s++) {
          var x = c[3 * s] * sc, y = c[3 * s + 1] * sc, z = c[3 * s + 2] * sc;
          if (st.d === 1) { y = (w - (st.K - 1) / 2) * 0.35; z = -3 + 6 * s / st.T; }
          pos[3 * s] = x; pos[3 * s + 1] = y; pos[3 * s + 2] = z;
        }
        var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('color', new T.BufferAttribute(col, 3)); g.setDrawRange(0, 1);
        var L = new T.Line(g, new T.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9 })); L.frustumCulled = false; S.aggiungi(L);
        var testa = lab.sfera(T, 0.06, 0xffffff, 0, 0, 0, true); S.aggiungi(testa);
        linee.push({ g: g, pos: pos, testa: testa });
      }
      sfera = new T.Mesh(new T.SphereGeometry(1, 40, 24), new T.MeshStandardMaterial({ color: 0x6bcfff, transparent: true, opacity: 0.12, depthWrite: false, roughness: 0.3 }));
      if (st.d !== 1) S.aggiungi(sfera);
      S.aggiungi(lab.sfera(T, 0.08, 0xff8a80, 0, 0, 0, true));
      S.aggiungi(lab.assi(T, 3.4, st.d === 1 ? ['x', '', 't'] : ['x', 'y', 'z'], 0.3));
      var lum = new T.PointLight(0xffffff, 0.5, 30); lum.position.set(3, 3, 5); S.aggiungi(lum);
      S.ogniFotogramma(function (dt) {
        if (st.pausa) return false;
        if (k >= st.T) return false;
        k = Math.min(st.T, k + Math.max(1, Math.round(dt * st.vel * st.T / 12)));
        linee.forEach(function (l) { l.g.setDrawRange(0, k + 1); l.testa.position.set(l.pos[3 * k], l.pos[3 * k + 1], l.pos[3 * k + 2]); });
        var rr = Math.sqrt(k) * sc; sfera.scale.set(rr, rr, st.d === 3 ? rr : 0.02);
        var m = 0; linee.forEach(function (l) { var x = l.pos[3 * k] / sc, y = st.d === 1 ? 0 : l.pos[3 * k + 1] / sc, z = st.d === 3 ? l.pos[3 * k + 2] / sc : 0; m += x * x + y * y + z * z; });
        info.innerHTML = 't = <b>' + k + '</b> · ' + t('media di r² sui ', 'mean r² over the ') + st.K + t(' camminatori: ', ' walkers: ') + '<b>' + (m / st.K).toFixed(0) + '</b> (' + t('teoria ', 'theory ') + k + ')';
        S.didascalia.textContent = t('Passeggiata aleatoria in ', 'Random walk in ') + st.d + 'D · t = ' + k + ' · ' + t('sfera di raggio √t', 'sphere of radius √t');
      });
      S.didascalia.textContent = t('Passeggiata aleatoria in ', 'Random walk in ') + st.d + 'D';
      if (!S.vistaIniziale) S.inquadra(8.5, 0.7, 1.15);
      S.avvia();
    }
    function statistiche() {
      /* MSD in 1, 2, 3 dimensioni con 1000 camminatori × 1000 passi, una dimensione per lotto */
      var mio = ++lavoro, ds = [1, 2, 3]; msdDati = {};
      (function lotto() {
        if (mio !== lavoro) return; if (cm.offsetParent === null) { setTimeout(lotto, 400); return; }
        /* 4 lotti da 250 camminatori per dimensione, poi la media */
        var d = ds[0], parz = msd(d, 250, 1000, 50 + d * 10 + (ds.parte || 0)), acc = ds.acc || (ds.acc = { msd: new Float64Array(1001), ritorno: 0 });
        for (var i = 0; i <= 1000; i++) acc.msd[i] += parz.msd[i] / 4; acc.ritorno += parz.ritorno / 4; ds.parte = (ds.parte || 0) + 1;
        if (ds.parte === 4) { msdDati[d] = acc; ds.shift(); ds.parte = 0; ds.acc = null; disegnaMSD(); }
        if (ds.length) setTimeout(lotto, 0);
      })();
      disegnaMSD();
    }
    function disegnaMSD() {
      var ser = [], Tt = []; for (var s = 0; s <= 1000; s += 10) Tt.push(s);
      ser.push({ x: Tt, y: Tt, col: '#ffffff', tratt: true, etich: ['t', 't'] });
      [1, 2, 3].forEach(function (d) { if (msdDati[d]) ser.push({ x: Tt, y: Tt.map(function (s) { return msdDati[d].msd[s]; }), col: COLORI[d], etich: [d + 'D', d + 'D'] }); });
      F.grafico(cm, { serie: ser, xmin: 0, xmax: 1000, ymin: 0, xl: ['passi t', 'steps t'], yl: ['⟨r²⟩', '⟨r²⟩'], legenda: [{ col: '#ffffff', etich: ['⟨r²⟩ = t', '⟨r²⟩ = t'] }, { col: COLORI[1], etich: ['1D', '1D'] }, { col: COLORI[2], etich: ['2D', '2D'] }, { col: COLORI[3], etich: ['3D', '3D'] }], descr: ['Spostamento quadratico medio in 1, 2 e 3 dimensioni', 'Mean square displacement in 1, 2 and 3 dimensions'] });
      stat.innerHTML = t('Ritorno all’origine entro 1000 passi (1000 camminatori): ', 'Return to the origin within 1000 steps (1000 walkers): ') + [1, 2, 3].map(function (d) { return d + 'D ' + (msdDati[d] ? '<b>' + msdDati[d].ritorno.toFixed(3) + '</b>' : '…'); }).join(', ') +
        '<br>' + t('Teoria: 1D entro 1000 passi 1 − C(1000,500)/2¹⁰⁰⁰ = ', 'Theory: 1D within 1000 steps 1 − C(1000,500)/2¹⁰⁰⁰ = ') + ritorno1D(1000).toFixed(4) + t('; 3D per t → ∞: ', '; 3D as t → ∞: ') + POLYA3D.toFixed(4) + t(' (Pólya); 2D tende a 1 ma come 1 − π/ln t, lentissimo.', ' (Pólya); 2D tends to 1 but like 1 − π/ln t, very slowly.');
    }
    costruisci(); statistiche();
  }

  /* ═══ 6. Poisson e M/M/1 ════════════════════════════════════════════════ */
  function schedaCode(div) {
    var G = grigliaUI(div), pan = G.pan, st = { lam: 0.8, mu: 1 };
    F.cursore(pan, ['arrivi λ (clienti per unità di tempo)', 'arrivals λ (customers per unit time)'], 0.1, 0.95, 0.05, st.lam, function (v) { st.lam = v; calcola(); }, function (v) { return v.toFixed(2); });
    F.cursore(pan, ['servizio μ', 'service μ'], 1, 2, 0.05, st.mu, function (v) { st.mu = v; calcola(); }, function (v) { return v.toFixed(2); });
    var info = nota(pan);
    nota(pan, t('Processo di Poisson: arrivi indipendenti con intensità λ; il numero di arrivi in un intervallo di durata 1 è Poisson(λ) (media = varianza = λ) e le attese fra un arrivo e l’altro sono esponenziali di media 1/λ, senza memoria. Coda M/M/1: arrivi di Poisson, tempi di servizio esponenziali di intensità μ, un solo sportello. Il numero di clienti nel sistema è una catena di Markov a tempo continuo (nascita e morte) con distribuzione stazionaria geometrica P(n) = (1 − ρ)ρⁿ, ρ = λ/μ < 1; quindi L = ρ/(1 − ρ) e W = 1/(μ − λ). La legge di Little L = λW vale per qualunque coda stabile, e qui si verifica sulla simulazione evento per evento. Quando ρ → 1 la coda esplode: con ρ = 0,95 la lunghezza media è 19.',
      'Poisson process: independent arrivals with rate λ; the number of arrivals in an interval of length 1 is Poisson(λ) (mean = variance = λ) and the gaps between arrivals are exponential with mean 1/λ, memoryless. M/M/1 queue: Poisson arrivals, exponential service times with rate μ, a single server. The number of customers in the system is a continuous-time Markov chain (birth and death) with geometric stationary distribution P(n) = (1 − ρ)ρⁿ, ρ = λ/μ < 1; so L = ρ/(1 − ρ) and W = 1/(μ − λ). Little’s law L = λW holds for any stable queue, and here it is checked on the event-by-event simulation. As ρ → 1 the queue blows up: with ρ = 0.95 the mean length is 19.'));
    var ca = F.tela(G.dx, 0.45), cp = F.tela(G.dx, 0.4), cn = F.tela(G.dx, 0.4);
    var simA, rnd, tt, coda, prossimoArrivo, prossimaPartenza, storiaT, storiaN, area;
    function calcola() {
      var th = teoriaMM1(st.lam, st.mu), sm = simulaMM1(st.lam, st.mu, 200000, 7), ps = simulaPoisson(st.lam * 5, 4000, 3);
      var me = 0, va = 0; for (var i = 0; i < ps.conta.length; i++) me += ps.conta[i]; me /= ps.conta.length; for (i = 0; i < ps.conta.length; i++) va += Math.pow(ps.conta[i] - me, 2); va /= ps.conta.length - 1;
      var ma = ps.attese.reduce(function (a, b) { return a + b; }, 0) / ps.attese.length;
      info.innerHTML = 'ρ = λ/μ = <b>' + th.rho.toFixed(3) + '</b><br>L: ' + t('teoria ', 'theory ') + '<b>' + th.L.toFixed(3) + '</b>, ' + t('simulazione ', 'simulation ') + '<b>' + sm.L.toFixed(3) + '</b> (200 000 ' + t('clienti', 'customers') + ')<br>W: ' + t('teoria ', 'theory ') + th.W.toFixed(3) + ', ' + t('simulazione ', 'simulation ') + sm.W.toFixed(3) + '<br>' +
        t('Little: L = ', 'Little: L = ') + sm.L.toFixed(4) + ' · λ_eff W = ' + (sm.lamEff * sm.W).toFixed(4) + '<br>P(' + t('vuoto', 'empty') + '): ' + t('teoria ', 'theory ') + th.p0.toFixed(3) + ', ' + t('simulazione ', 'simulation ') + sm.p0.toFixed(3) + '<br>' +
        t('Poisson (λ = ', 'Poisson (λ = ') + (st.lam * 5).toFixed(2) + t(', 4000 intervalli): media ', ', 4000 intervals): mean ') + me.toFixed(3) + ', ' + t('varianza ', 'variance ') + va.toFixed(3) + t(', attesa media ', ', mean gap ') + ma.toFixed(4) + ' (1/λ = ' + (1 / (st.lam * 5)).toFixed(4) + ')';
      var lp = st.lam * 5, kmax = Math.ceil(lp + 5 * Math.sqrt(lp) + 3), cnt = []; for (i = 0; i <= kmax; i++) cnt.push(0); ps.conta.forEach(function (c) { if (c <= kmax) cnt[c]++; });
      F.grafico(cp, { barre: cnt.map(function (c, k) { return { x: k, y: c / ps.conta.length, col: '#5eead4', larg: Math.max(2, 200 / kmax) }; }), punti: cnt.map(function (_, k) { return { x: k, y: poissonPmf(k, lp), col: '#ffd24a', r: 4 }; }), ymin: 0, xl: ['arrivi in un intervallo unitario', 'arrivals in a unit interval'], yl: ['frequenza', 'frequency'], legenda: [{ col: '#5eead4', etich: ['simulazione', 'simulation'] }, { col: '#ffd24a', etich: ['Poisson λᵏe^(−λ)/k!', 'Poisson λᵏe^(−λ)/k!'] }], descr: ['Conteggi del processo di Poisson contro la distribuzione di Poisson', 'Poisson process counts against the Poisson distribution'] });
      rnd = mulberry32(17); tt = 0; coda = []; prossimoArrivo = -Math.log(1 - rnd()) / st.lam; prossimaPartenza = Infinity; storiaT = [0]; storiaN = [0]; area = 0;
    }
    calcola();
    F.anima(ca, function (dt) {
      var fine = tt + dt * 4;
      while (Math.min(prossimoArrivo, prossimaPartenza) <= fine) {
        var tn = Math.min(prossimoArrivo, prossimaPartenza); area += coda.length * (tn - tt); tt = tn;
        if (prossimoArrivo <= prossimaPartenza) { coda.push(tt); if (coda.length === 1) prossimaPartenza = tt - Math.log(1 - rnd()) / st.mu; prossimoArrivo = tt - Math.log(1 - rnd()) / st.lam; }
        else { coda.shift(); prossimaPartenza = coda.length ? tt - Math.log(1 - rnd()) / st.mu : Infinity; }
        storiaT.push(tt); storiaN.push(coda.length);
      }
      area += coda.length * (fine - tt); tt = fine;
      if (storiaT.length > 4000) { storiaT = storiaT.slice(-3000); storiaN = storiaN.slice(-3000); }
      var Pp = F.pennello(ca), q = Pp.q, W = Pp.W, H = Pp.H, sx = W * 0.72, sy = H / 2;
      /* lo sportello */
      q.strokeStyle = '#5eead4'; q.lineWidth = 2; q.strokeRect(sx, sy - 26, 52, 52); q.fillStyle = '#cfe3f7'; q.font = '11px system-ui,sans-serif'; q.textAlign = 'center'; q.fillText(t('sportello', 'server'), sx + 26, sy + 42);
      coda.forEach(function (c, i) { var x = i === 0 ? sx + 26 : sx - 16 - (i - 1) * 18, y = sy; if (x < 10) return; q.fillStyle = i === 0 ? '#ffd24a' : COLORI[i % COLORI.length]; q.beginPath(); q.arc(x, y, 7, 0, 7); q.fill(); });
      if (coda.length > Math.floor((sx - 10) / 18) + 1) { q.fillStyle = '#ff8a80'; q.textAlign = 'left'; q.fillText('+' + (coda.length - Math.floor((sx - 10) / 18) - 1), 8, sy - 14); }
      q.strokeStyle = '#8494a8'; q.beginPath(); q.moveTo(sx + 52, sy); q.lineTo(W - 12, sy); q.stroke(); q.beginPath(); q.moveTo(W - 20, sy - 5); q.lineTo(W - 12, sy); q.lineTo(W - 20, sy + 5); q.stroke();
      q.fillStyle = '#cfe3f7'; q.textAlign = 'left'; q.fillText('t = ' + tt.toFixed(1) + ' · N(t) = ' + coda.length + ' · ' + t('media nel tempo ', 'time average ') + (area / Math.max(tt, 1e-9)).toFixed(2) + ' · ' + t('teoria ', 'theory ') + teoriaMM1(st.lam, st.mu).L.toFixed(2), 8, 16);
      ca.setAttribute('aria-label', t('Coda M/M/1 animata', 'Animated M/M/1 queue'));
      if (!cn._fr || ++cn._fr % 6 === 0) {
        cn._fr = cn._fr || 1; var t0 = Math.max(0, tt - 120), xs = [], ys = [];
        for (var i = 0; i < storiaT.length; i++) if (storiaT[i] >= t0) { if (xs.length) { xs.push(storiaT[i]); ys.push(storiaN[i - 1]); } xs.push(storiaT[i]); ys.push(storiaN[i]); }
        xs.push(tt); ys.push(coda.length);
        F.grafico(cn, { serie: [{ x: xs, y: ys, col: '#5eead4', larg: 1.5, etich: ['N(t)', 'N(t)'] }], linee: [{ y: teoriaMM1(st.lam, st.mu).L, col: '#ffd24a', etich: 'L = ρ/(1 − ρ)' }], xmin: t0, xmax: Math.max(t0 + 120, tt), ymin: 0, xl: ['tempo', 'time'], yl: [t('clienti nel sistema', 'customers in system'), t('clienti nel sistema', 'customers in system')], descr: ['Numero di clienti nel sistema nel tempo', 'Number of customers in the system over time'] });
      }
    }, { ricomincia: function () { calcola(); } });
  }

  F.sezione('smatmarkov', {
    titolo: ['🔗 Catene di Markov e processi stocastici', '🔗 Markov chains and stochastic processes'],
    sotto: ['Catene di Markov da scrivere a mano, PageRank, la rovina del giocatore, passeggiate aleatorie in 1, 2 e 3 dimensioni (in 3D), il processo di Poisson e la coda M/M/1: la teoria contro la simulazione e contro un secondo calcolo esatto.', 'Hand-written Markov chains, PageRank, gambler’s ruin, random walks in 1, 2 and 3 dimensions (in 3D), the Poisson process and the M/M/1 queue: theory against simulation and against a second exact computation.'],
    schede: [
      { nome: ['🔗 Catena', '🔗 Chain'], costruisci: schedaCatena },
      { nome: ['🌐 PageRank', '🌐 PageRank'], costruisci: schedaPagerank },
      { nome: ['🎲 Rovina del giocatore', '🎲 Gambler’s ruin'], costruisci: schedaRovina },
      { nome: ['🚶 Passeggiate 1D e 2D', '🚶 1D and 2D walks'], costruisci: schedaPasseggiate },
      { nome: ['🧭 Passeggiata 3D', '🧭 3D walk'], costruisci: function (div) {
        var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); g.appendChild(pan); g.appendChild(dx); div.appendChild(g);
        var lab = globale.BSILab3D;
        if (!lab) { nota(pan, t('Serve il Laboratorio 3D (bsi-lab3d.js) per questa scheda: qui si vedrebbero le passeggiate aleatorie nello spazio.', 'The 3D Laboratory (bsi-lab3d.js) is needed for this tab: it would show random walks in space.')); return; }
        var attesa = F.el('div', { 'class': 'bsiFX-nota', testo: t('Caricamento del motore 3D…', 'Loading the 3D engine…') }); dx.appendChild(attesa); lab.stile();
        lab.caricaThree().then(function () { attesa.remove(); var S = new lab.Scena(dx, 0.7); div._scena = S; schedaPasseggiata3D(pan, S, dx); }).catch(function (e) { if (globale.console) console.error(e); attesa.textContent = t('Motore 3D non disponibile: ', '3D engine unavailable: ') + e.message; if (!attesa.parentNode) dx.appendChild(attesa); });
      } },
      { nome: ['📬 Poisson e code', '📬 Poisson and queues'], costruisci: schedaCode }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
