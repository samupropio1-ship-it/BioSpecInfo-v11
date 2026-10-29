/* ═══════════════════════════════════════════════════════════════════════════
   bsi-mat-edp.js — 🌊 Equazioni alle derivate parziali
   BioSpecInfo · © Samuele Pio Provenzano

   Le quattro equazioni che ogni corso di analisi e di fisica matematica
   incontra, ciascuna risolta in DUE modi indipendenti, perche' il confronto
   fra il metodo analitico e quello numerico e' il modo piu' onesto di
   capire che cosa fa ciascuno:

   · ONDE SU UNA CORDA: la formula di d'Alembert (due onde che viaggiano in
     versi opposti, con l'estensione dispari e periodica del profilo) contro
     la serie dei modi normali di Fourier troncata a N termini; l'energia
     cinetica e potenziale che si scambiano mentre la totale resta costante;
   · LA MEMBRANA (il tamburo) in 3D: i modi di una membrana quadrata
     sin(mπx) sin(nπy) e di una circolare J_m(j_mn r) cos mθ, con gli zeri di
     Bessel calcolati qui (j₀₁ = 2,4048, j₁₁ = 3,8317 …), le linee nodali
     disegnate sulla superficie e sul fondo come figure di Chladni, lo
     spettro non armonico del tamburo;
   · IL CALORE: la serie di seni con i suoi esponenziali che smorzano prima
     le frequenze alte, contro le differenze finite esplicite (FTCS), che
     sono stabili solo per r = αΔt/Δx² ≤ 1/2; in 2D la lastra che si
     raffredda come superficie 3D, con la serie doppia per confronto;
   · LAPLACE su un quadrato: la serie di Fourier con i seni iperbolici
     contro Jacobi, Gauss–Seidel e SOR, con i raggi spettrali teorici
     (cos πh, cos² πh, ω_ott − 1), il numero di iterazioni misurato e la
     curva iterazioni–ω con il minimo in ω_ott = 2/(1 + sin πh);
   · TRASPORTO E BURGERS: le caratteristiche, lo schema upwind con la sua
     diffusione numerica, la rottura dell'onda di Burgers all'istante
     t* = −1/min u₀′ e l'urto catturato dal metodo di Godunov, che si
     muove con la velocita' di Rankine–Hugoniot (u_s + u_d)/2.

   I calcoli stanno in F.calcolo.edp (provati in
   tools/banchi/verifiche/verifica-smatedp.js); le viste 3D usano la Scena
   di bsi-lab3d.js.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt, PI = Math.PI;

  /* ═══ calcoli ═══════════════════════════════════════════════════════════ */

  /* ── Bessel: J_n(x) = (1/π)∫₀^π cos(nτ − x sin τ) dτ con i trapezi (convergenza
     esponenziale: l'integrando e' periodico e analitico) e, come controllo, la serie ── */
  function besselJ(n, x) {
    var N = Math.max(64, 2 * Math.ceil(n + Math.abs(x)) + 64), s = 0;
    for (var k = 0; k <= N; k++) { var tau = PI * k / N, w = k === 0 || k === N ? 0.5 : 1; s += w * Math.cos(n * tau - x * Math.sin(tau)); }
    return s / N;
  }
  function besselJSerie(n, x) {
    var term = Math.pow(x / 2, n), s = 0, k;
    for (k = 2; k <= n; k++) term /= k;
    for (k = 0; k < 80; k++) { s += term; term *= -(x * x / 4) / ((k + 1) * (k + 1 + n)); if (Math.abs(term) < 1e-18 * Math.abs(s)) break; }
    return s;
  }
  /* k-esimo zero positivo di J_m: Newton (J_m′ = (J_{m−1} − J_{m+1})/2) partendo dalla stima
     asintotica di McMahon β − (4m² − 1)/(8β), β = (k + m/2 − 1/4)π; un controllo del cambio di
     segno attorno al risultato garantisce che sia davvero uno zero */
  var cacheZeri = {};
  function zeroBessel(m, k) {
    var chiave = m + ',' + k; if (cacheZeri[chiave]) return cacheZeri[chiave];
    var beta = (k + m / 2 - 0.25) * PI, x = beta - (4 * m * m - 1) / (8 * beta);
    for (var i = 0; i < 30; i++) { var d = besselJ(m, x) / (0.5 * (besselJ(m - 1 < 0 ? 1 : m - 1, x) * (m === 0 ? -1 : 1) - besselJ(m + 1, x))); x -= d; if (Math.abs(d) < 1e-15) break; }
    if (besselJ(m, x - 1e-9) * besselJ(m, x + 1e-9) > 0 && Math.abs(besselJ(m, x)) > 1e-12) return NaN;
    return (cacheZeri[chiave] = x);
  }

  /* ── la corda: d'Alembert e Fourier ── */
  function estDispari(f, L) { return function (x) { var p = ((x % (2 * L)) + 2 * L) % (2 * L); return p <= L ? f(p) : -f(2 * L - p); }; }
  function dalembert(f, L, c, x, tt) { var Fd = estDispari(f, L); return 0.5 * (Fd(x - c * tt) + Fd(x + c * tt)); }
  /* b_n = (2/L)∫₀^L f(x) sin(nπx/L) dx con Simpson su M intervalli */
  function coeffSeno(f, L, N, M) {
    M = M || 2000; if (M % 2) M++;
    var b = [], h = L / M, fv = [];
    for (var i = 0; i <= M; i++) fv.push(f(i * h));
    for (var n = 1; n <= N; n++) { var s = 0; for (i = 0; i <= M; i++) s += (i === 0 || i === M ? 1 : i % 2 ? 4 : 2) * fv[i] * Math.sin(n * PI * i * h / L); b.push(2 / L * s * h / 3); }
    return b;
  }
  /* corda pizzicata di altezza h nel punto p: b_n = 2hL²/(n²π² p(L−p)) sin(nπp/L) */
  function coeffPizzicata(h, p, L, N) { var b = []; for (var n = 1; n <= N; n++) b.push(2 * h * L * L / (n * n * PI * PI * p * (L - p)) * Math.sin(n * PI * p / L)); return b; }
  function serieCorda(b, L, c, x, tt) { var s = 0; for (var n = 1; n <= b.length; n++) s += b[n - 1] * Math.sin(n * PI * x / L) * Math.cos(n * PI * c * tt / L); return s; }
  /* energia E = ½∫(u_t² + c²u_x²)dx = (L/4) Σ b_n² ω_n², ω_n = nπc/L; divisa nelle due parti al tempo t */
  function energiaModi(b, L, c, tt) {
    var cin = 0, pot = 0;
    for (var n = 1; n <= b.length; n++) { var w = n * PI * c / L, e = L / 4 * b[n - 1] * b[n - 1] * w * w; cin += e * Math.pow(Math.sin(w * (tt || 0)), 2); pot += e * Math.pow(Math.cos(w * (tt || 0)), 2); }
    return { cin: cin, pot: pot, tot: cin + pot };
  }
  /* la stessa energia integrata numericamente da una soluzione u(x,t) qualsiasi */
  function energiaNumerica(u, L, c, tt, M) {
    M = M || 4000; var h = L / M, d = 1e-5, s = 0;
    for (var i = 0; i <= M; i++) {
      var x = i * h, ut = (u(x, tt + d) - u(x, tt - d)) / (2 * d), ux = (u(Math.min(L, x + d), tt) - u(Math.max(0, x - d), tt)) / (Math.min(L, x + d) - Math.max(0, x - d));
      s += (i === 0 || i === M ? 0.5 : 1) * (ut * ut + c * c * ux * ux);
    }
    return 0.5 * s * h;
  }
  function energiaPizzicata(h, p, L, c) { return 0.5 * c * c * h * h * (1 / p + 1 / (L - p)); }

  /* ── la membrana ── */
  function omegaQuadrato(m, n, c, a) { return (c || 1) * PI * Math.sqrt(m * m + n * n) / (a || 1); }
  function omegaCerchio(m, k, c, R) { return (c || 1) * zeroBessel(m, k) / (R || 1); }

  /* ── il calore 1D su [0, 1], u = 0 agli estremi ── */
  var FORME1D = {
    impulso: [[0.4, 0.6, 1]],
    due: [[0.12, 0.3, 1], [0.6, 0.85, 0.6]]
  };
  function valoreForma1D(forma, x) {
    if (forma === 'tenda') return x < 0.5 ? 2 * x : 2 - 2 * x;
    if (forma === 'parabola') return 4 * x * (1 - x);
    var s = 0; FORME1D[forma].forEach(function (r) { if (x > r[0] && x < r[1]) s += r[2]; else if (x === r[0] || x === r[1]) s += r[2] / 2; }); return s;
  }
  /* coefficienti in forma chiusa: rettangoli h·2/(nπ)(cos nπa − cos nπb), tenda 8/(n²π²) sin(nπ/2),
     parabola 32/(n³π³) per n dispari */
  function coeffForma1D(forma, N) {
    var b = [];
    for (var n = 1; n <= N; n++) {
      if (forma === 'tenda') b.push(8 / (n * n * PI * PI) * Math.sin(n * PI / 2));
      else if (forma === 'parabola') b.push(n % 2 ? 32 / (n * n * n * PI * PI * PI) : 0);
      else { var s = 0; FORME1D[forma].forEach(function (r) { s += r[2] * 2 / (n * PI) * (Math.cos(n * PI * r[0]) - Math.cos(n * PI * r[1])); }); b.push(s); }
    }
    return b;
  }
  /* per valutare la serie in molti punti e istanti: i seni tabulati una volta, gli esponenziali una volta per istante */
  function tabellaSeni(K, N) { var tab = []; for (var i = 0; i <= N; i++) { var r = new Float64Array(K); for (var n = 0; n < K; n++) r[n] = Math.sin((n + 1) * PI * i / N); tab.push(r); } return tab; }
  function smorzamenti(b, alfa, tt) { var d = new Float64Array(b.length); for (var n = 0; n < b.length; n++) { var e = alfa * (n + 1) * (n + 1) * PI * PI * tt; d[n] = e > 40 ? 0 : b[n] * Math.exp(-e); } return d; }
  function sommaTab(d, r) { var s = 0; for (var n = 0; n < d.length; n++) if (d[n]) s += d[n] * r[n]; return s; }
  function calore1DSerie(b, alfa, x, tt) { var s = 0; for (var n = 1; n <= b.length; n++) s += b[n - 1] * Math.exp(-alfa * n * n * PI * PI * tt) * Math.sin(n * PI * x); return s; }
  /* un passo di FTCS: u_i ← u_i + r (u_{i+1} − 2u_i + u_{i−1}) */
  function ftcs1D(u, r) { var n = u.length, v = new Float64Array(n); for (var i = 1; i < n - 1; i++) v[i] = u[i] + r * (u[i + 1] - 2 * u[i] + u[i - 1]); return v; }
  function iniziale1D(forma, N) { var u = new Float64Array(N + 1); for (var i = 1; i < N; i++) u[i] = valoreForma1D(forma, i / N); return u; }
  /* FTCS fino a tFin, con l'errore massimo rispetto alla serie registrato nReg volte */
  function confrontaCalore1D(forma, N, r, tFin, nReg, K) {
    var dx = 1 / N, dt = r * dx * dx, passi = Math.max(1, Math.round(tFin / dt)), ogni = Math.max(1, Math.floor(passi / (nReg || 60))), b = coeffForma1D(forma, K || 400);
    var u = iniziale1D(forma, N), T = [], E = [], tab = tabellaSeni(b.length, N);
    for (var k = 1; k <= passi; k++) {
      u = ftcs1D(u, r);
      if (k % ogni === 0 || k === passi) {
        var tt = k * dt, e = 0, dec = smorzamenti(b, 1, tt); for (var i = 1; i < N; i++) { var d = Math.abs(u[i] - sommaTab(dec, tab[i])); if (!(d <= e)) e = isFinite(d) ? d : 1e300; }
        T.push(tt); E.push(e);
      }
    }
    return { t: T, err: E, u: u, dt: dt, passi: passi };
  }

  /* ── il calore 2D sul quadrato unitario ── */
  var FORME2D = {
    quadrato: [[0.3, 0.7, 0.3, 0.7, 1]],
    due: [[0.12, 0.38, 0.14, 0.4, 1], [0.58, 0.88, 0.55, 0.85, 0.7]],
    croce: [[0.42, 0.58, 0.1, 0.9, 1], [0.1, 0.42, 0.42, 0.58, 1], [0.58, 0.9, 0.42, 0.58, 1]]
  };
  function iniziale2D(forma, M) {
    var u = new Float64Array((M + 1) * (M + 1));
    for (var i = 1; i < M; i++) for (var j = 1; j < M; j++) {
      var x = i / M, y = j / M, s = 0;
      FORME2D[forma].forEach(function (r) { var fx = x > r[0] && x < r[1] ? 1 : x === r[0] || x === r[1] ? 0.5 : 0, fy = y > r[2] && y < r[3] ? 1 : y === r[2] || y === r[3] ? 0.5 : 0; s += r[4] * fx * fy; });
      u[i * (M + 1) + j] = s;
    }
    return u;
  }
  function calore2DPasso(u, M, r) {
    var v = new Float64Array(u.length), K = M + 1;
    for (var i = 1; i < M; i++) for (var j = 1; j < M; j++) { var k = i * K + j; v[k] = u[k] + r * (u[k + K] + u[k - K] + u[k + 1] + u[k - 1] - 4 * u[k]); }
    return v;
  }
  /* serie doppia: b_mn = h · 4/(mnπ²) (cos mπa₁ − cos mπb₁)(cos nπa₂ − cos nπb₂) */
  var cache2D = {};
  function coeff2D(forma, K) {
    var ch = forma + K; if (cache2D[ch]) return cache2D[ch];
    var c = new Float64Array(K * K);
    for (var m = 1; m <= K; m++) for (var n = 1; n <= K; n++) { var b = 0; FORME2D[forma].forEach(function (r) { b += r[4] * 4 / (m * n * PI * PI) * (Math.cos(m * PI * r[0]) - Math.cos(m * PI * r[1])) * (Math.cos(n * PI * r[2]) - Math.cos(n * PI * r[3])); }); c[(m - 1) * K + n - 1] = b; }
    return (cache2D[ch] = c);
  }
  /* la stessa serie con i coefficienti in memoria: sin(mπx) e sin(nπy) per ricorrenza, un esponenziale per modo */
  function calore2DSerieVeloce(forma, x, y, tt, K) {
    var c = coeff2D(forma, K), sx = [], sy = [], ex = [], s = 0, m, n;
    for (m = 1; m <= K; m++) { sx.push(Math.sin(m * PI * x)); sy.push(Math.sin(m * PI * y)); ex.push(Math.exp(-m * m * PI * PI * tt)); }
    for (m = 0; m < K; m++) { if (!sx[m]) continue; for (n = 0; n < K; n++) { var b = c[m * K + n]; if (b && sy[n]) s += b * ex[m] * ex[n] * sx[m] * sy[n]; } }
    return s;
  }
  function calore2DSerie(forma, x, y, tt, K) {
    var s = 0;
    for (var m = 1; m <= K; m++) for (var n = 1; n <= K; n++) {
      var b = 0;
      FORME2D[forma].forEach(function (r) { b += r[4] * 4 / (m * n * PI * PI) * (Math.cos(m * PI * r[0]) - Math.cos(m * PI * r[1])) * (Math.cos(n * PI * r[2]) - Math.cos(n * PI * r[3])); });
      if (b) s += b * Math.exp(-(m * m + n * n) * PI * PI * tt) * Math.sin(m * PI * x) * Math.sin(n * PI * y);
    }
    return s;
  }

  /* ── Laplace sul quadrato: u = 0 su tre lati, u = f(x) sul lato y = 1 ── */
  var BORDI = {
    seno: function (x) { return Math.sin(PI * x); },
    costante: function () { return 1; },
    parabola: function (x) { return 4 * x * (1 - x); },
    tenda: function (x) { return x < 0.5 ? 2 * x : 2 - 2 * x; }
  };
  function coeffBordo(bordo, n) {
    if (bordo === 'seno') return n === 1 ? 1 : 0;
    if (bordo === 'costante') return n % 2 ? 4 / (n * PI) : 0;
    if (bordo === 'parabola') return n % 2 ? 32 / (n * n * n * PI * PI * PI) : 0;
    return 8 / (n * n * PI * PI) * Math.sin(n * PI / 2);
  }
  /* sinh(nπy)/sinh(nπ) scritto senza overflow */
  function rapSinh(n, y) { var a = n * PI; return Math.exp(a * (y - 1)) * (1 - Math.exp(-2 * a * y)) / (1 - Math.exp(-2 * a)); }
  function laplaceSerie(bordo, x, y, K) { var s = 0; for (var n = 1; n <= (K || 400); n++) { var b = coeffBordo(bordo, n); if (b) s += b * Math.sin(n * PI * x) * rapSinh(n, y); } return s; }
  /* la griglia: (N+2)² nodi, N interni per lato, h = 1/(N+1); indice i + (N+2) j, j = N+1 e' il lato alto */
  function laplaceIniziale(N, bordo) {
    var K = N + 2, u = new Float64Array(K * K), f = BORDI[bordo];
    for (var i = 1; i <= N; i++) u[i + K * (N + 1)] = f(i / (N + 1));
    return u;
  }
  function laplaceResiduo(u, N) {
    var K = N + 2, r = 0;
    for (var j = 1; j <= N; j++) for (var i = 1; i <= N; i++) { var k = i + K * j, d = Math.abs(u[k - 1] + u[k + 1] + u[k - K] + u[k + K] - 4 * u[k]); if (d > r) r = d; }
    return r;
  }
  /* una passata: Jacobi usa solo i valori vecchi, Gauss–Seidel quelli appena aggiornati, SOR sovrarilassa */
  function laplacePassata(u, N, metodo, omega, tmp) {
    var K = N + 2, i, j, k;
    if (metodo === 'jacobi') {
      var v = tmp || new Float64Array(u.length);
      for (j = 1; j <= N; j++) for (i = 1; i <= N; i++) { k = i + K * j; v[k] = 0.25 * (u[k - 1] + u[k + 1] + u[k - K] + u[k + K]); }
      for (j = 1; j <= N; j++) for (i = 1; i <= N; i++) { k = i + K * j; u[k] = v[k]; }
      return;
    }
    var w = metodo === 'sor' ? omega : 1;
    for (j = 1; j <= N; j++) for (i = 1; i <= N; i++) { k = i + K * j; u[k] += w * (0.25 * (u[k - 1] + u[k + 1] + u[k - K] + u[k + K]) - u[k]); }
  }
  /* il risolutore a rate: avanza(sol, n) fa al piu' n passate, cosi' la pagina puo' dividere il lavoro */
  function laplaceRisolutore(N, bordo, metodo, omega, tol, maxit) {
    var u = laplaceIniziale(N, bordo), r = laplaceResiduo(u, N);
    return { N: N, metodo: metodo, omega: omega, tol: tol || 1e-6, maxit: maxit || 30000, u: u, tmp: new Float64Array(u.length), iter: 0, residuo: r, storia: [Math.log10(r)], finito: r <= (tol || 1e-6) };
  }
  function laplaceAvanza(s, n) {
    for (var k = 0; k < n && !s.finito; k++) {
      laplacePassata(s.u, s.N, s.metodo, s.omega, s.tmp); s.iter++; s.residuo = laplaceResiduo(s.u, s.N); s.storia.push(Math.log10(Math.max(s.residuo, 1e-300)));
      if (s.residuo <= s.tol || s.iter >= s.maxit) s.finito = true;
    }
    return s;
  }
  function laplaceRisolvi(N, bordo, metodo, omega, tol, maxit) { var s = laplaceRisolutore(N, bordo, metodo, omega, tol, maxit); while (!s.finito) laplaceAvanza(s, 1000); return s; }
  function omegaOttimale(N) { return 2 / (1 + Math.sin(PI / (N + 1))); }
  function raggioJacobi(N) { return Math.cos(PI / (N + 1)); }
  /* iterazioni previste per ridurre il residuo di un fattore f: ln f / ln ρ */
  function iterPreviste(N, metodo, fattore) {
    var rho = metodo === 'jacobi' ? raggioJacobi(N) : metodo === 'gs' ? Math.pow(raggioJacobi(N), 2) : omegaOttimale(N) - 1;
    return Math.log(fattore) / Math.log(rho);
  }

  /* ── trasporto e Burgers ── */
  var DATI = {
    gauss: { u0: function (x) { return Math.exp(-x * x); }, a: -3, b: 7, per: false, tmax: 4, nome: ['gaussiana e^(−x²)', 'Gaussian e^(−x²)'] },
    seno: { u0: function (x) { return Math.sin(x); }, a: 0, b: 2 * PI, per: true, tmax: 3, nome: ['sin x (periodica)', 'sin x (periodic)'] },
    salto: { u0: function (x) { return x < 0 ? 1 : 0; }, a: -2, b: 4, per: false, tmax: 4, nome: ['salto 1 → 0 (urto)', 'step 1 → 0 (shock)'] },
    rarefazione: { u0: function (x) { return x < 0 ? 0 : 1; }, a: -2, b: 4, per: false, tmax: 3, nome: ['salto 0 → 1 (rarefazione)', 'step 0 → 1 (rarefaction)'] }
  };
  /* t* = −1/min u₀′: il primo istante in cui due caratteristiche x₀ + u₀(x₀)t si incontrano */
  function tStarFormula(u0, a, b, M) {
    M = M || 20000; var h = (b - a) / M, minD = Infinity;
    for (var i = 0; i <= M; i++) { var x = a + i * h, d = (u0(x + 1e-6) - u0(x - 1e-6)) / 2e-6; if (d < minD) minD = d; }
    return minD < 0 ? -1 / minD : Infinity;
  }
  /* metodo indipendente: l'incrocio piu' precoce fra caratteristiche vicine */
  function tStarIncrocio(u0, a, b, M) {
    M = M || 20000; var h = (b - a) / M, best = Infinity;
    for (var i = 0; i < M; i++) { var x1 = a + i * h, x2 = x1 + h, du = u0(x2) - u0(x1); if (du < 0) { var tc = -h / du; if (tc < best) best = tc; } }
    return best;
  }
  /* flusso di Godunov per f(u) = u²/2 */
  function flussoGodunov(ul, ur) {
    if (ul > ur) { var s = (ul + ur) / 2; return s > 0 ? ul * ul / 2 : ur * ur / 2; }
    if (ul >= 0) return ul * ul / 2;
    if (ur <= 0) return ur * ur / 2;
    return 0;
  }
  function godunovPasso(u, dx, dt, per) {
    var n = u.length, v = new Float64Array(n), Fl = new Float64Array(n + 1);
    for (var i = 0; i <= n; i++) { var ul = i === 0 ? (per ? u[n - 1] : u[0]) : u[i - 1], ur = i === n ? (per ? u[0] : u[n - 1]) : u[i]; Fl[i] = flussoGodunov(ul, ur); }
    for (i = 0; i < n; i++) v[i] = u[i] - dt / dx * (Fl[i + 1] - Fl[i]);
    return v;
  }
  /* upwind per u_t + a u_x = 0, a > 0, numero di Courant ν = aΔt/Δx */
  function upwindPasso(u, nu, per) { var n = u.length, v = new Float64Array(n); for (var i = 0; i < n; i++) { var um = i === 0 ? (per ? u[n - 1] : u[0]) : u[i - 1]; v[i] = u[i] - nu * (u[i] - um); } return v; }
  function celle(chiave, N) { var D0 = DATI[chiave], dx = (D0.b - D0.a) / N, u = new Float64Array(N); for (var i = 0; i < N; i++) u[i] = D0.u0(D0.a + (i + 0.5) * dx); return { u: u, dx: dx }; }
  /* soluzioni esatte di Burgers per i due problemi di Riemann */
  function burgersRiemann(chiave, x, tt) {
    if (chiave === 'salto') return x < tt / 2 ? 1 : 0;
    if (tt <= 0) return x < 0 ? 0 : 1;
    return x < 0 ? 0 : x > tt ? 1 : x / tt;
  }

  F.calcolo.edp = {
    besselJ: besselJ, besselJSerie: besselJSerie, zeroBessel: zeroBessel,
    estDispari: estDispari, dalembert: dalembert, coeffSeno: coeffSeno, coeffPizzicata: coeffPizzicata, serieCorda: serieCorda,
    energiaModi: energiaModi, energiaNumerica: energiaNumerica, energiaPizzicata: energiaPizzicata,
    omegaQuadrato: omegaQuadrato, omegaCerchio: omegaCerchio,
    valoreForma1D: valoreForma1D, coeffForma1D: coeffForma1D, calore1DSerie: calore1DSerie, ftcs1D: ftcs1D, iniziale1D: iniziale1D, confrontaCalore1D: confrontaCalore1D,
    iniziale2D: iniziale2D, calore2DPasso: calore2DPasso, calore2DSerie: calore2DSerie, calore2DSerieVeloce: calore2DSerieVeloce, tabellaSeni: tabellaSeni, smorzamenti: smorzamenti, sommaTab: sommaTab,
    BORDI: BORDI, laplaceSerie: laplaceSerie, laplaceIniziale: laplaceIniziale, laplaceResiduo: laplaceResiduo, laplacePassata: laplacePassata, laplaceRisolvi: laplaceRisolvi, laplaceRisolutore: laplaceRisolutore, laplaceAvanza: laplaceAvanza,
    omegaOttimale: omegaOttimale, raggioJacobi: raggioJacobi, iterPreviste: iterPreviste,
    DATI: DATI, tStarFormula: tStarFormula, tStarIncrocio: tStarIncrocio, flussoGodunov: flussoGodunov, godunovPasso: godunovPasso, upwindPasso: upwindPasso, celle: celle, burgersRiemann: burgersRiemann
  };

  /* ═══ disegno: pezzi comuni ═════════════════════════════════════════════ */
  function grigliaUI(div) { var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); g.appendChild(pan); g.appendChild(dx); div.appendChild(g); return { pan: pan, dx: dx }; }
  function nota(pan, html) { var n = F.el('div', { 'class': 'bsiFX-nota' }); if (html) n.innerHTML = html; pan.appendChild(n); return n; }
  function casella(pan, et, val, cambia) {
    var c = F.el('input', { type: 'checkbox' }); c.checked = !!val; c.addEventListener('change', function () { cambia(c.checked); });
    pan.appendChild(F.el('label', { style: 'display:flex;align-items:center;gap:6px;margin:4px 0;font-size:.84rem;color:#cfe3f7;cursor:pointer' }, [c, F.el('span', { testo: F.tt(et) })])); return c;
  }
  /* la scheda 3D come in bsi-lab3d.js: pannello a sinistra, scena a destra, three.js al primo uso */
  function scheda3d(costruisci, rapporto) {
    return function (div) {
      var G = grigliaUI(div), lab = globale.BSILab3D;
      if (!lab) { nota(G.pan, t('Serve il Laboratorio 3D (bsi-lab3d.js) per questa scheda: qui si vedrebbe la superficie tridimensionale della soluzione.', 'The 3D Laboratory (bsi-lab3d.js) is needed for this tab: it would show the three-dimensional surface of the solution.')); return; }
      var attesa = F.el('div', { 'class': 'bsiFX-nota', testo: t('Caricamento del motore 3D…', 'Loading the 3D engine…') }); G.dx.appendChild(attesa);
      lab.stile();
      lab.caricaThree().then(function () { attesa.remove(); var S = new lab.Scena(G.dx, rapporto || 0.68); div._scena = S; costruisci(G.pan, S, G.dx); })
        .catch(function (e) { if (globale.console) console.error(e); attesa.textContent = t('Motore 3D non disponibile: ', '3D engine unavailable: ') + e.message; if (!attesa.parentNode) G.dx.appendChild(attesa); });
    };
  }
  /* una superficie a vertici fissi in xy, di cui si aggiornano quota e colore */
  function Superficie(T, xy, idx, linee) {
    var n = xy.length / 2, pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) { pos[3 * i] = xy[2 * i]; pos[3 * i + 1] = xy[2 * i + 1]; }
    var geo = new T.BufferGeometry(), aP = new T.BufferAttribute(pos, 3), aC = new T.BufferAttribute(col, 3);
    geo.setAttribute('position', aP); geo.setAttribute('color', aC); geo.setIndex(idx);
    this.mesh = new T.Mesh(geo, new T.MeshStandardMaterial({ vertexColors: true, side: T.DoubleSide, roughness: 0.45, metalness: 0.08 }));
    this.mesh.frustumCulled = false;
    if (linee) { var gw = new T.BufferGeometry(); gw.setAttribute('position', aP); gw.setIndex(linee); this.rete = new T.LineSegments(gw, new T.LineBasicMaterial({ color: 0x06101c, transparent: true, opacity: 0.3 })); this.rete.frustumCulled = false; }
    this.n = n; this.pos = pos; this.col = col; this.geo = geo; this.aP = aP; this.aC = aC;
  }
  Superficie.prototype.imposta = function (z, colore) {
    for (var i = 0; i < this.n; i++) { this.pos[3 * i + 2] = z[i]; var c = colore(i); this.col[3 * i] = c[0]; this.col[3 * i + 1] = c[1]; this.col[3 * i + 2] = c[2]; }
    this.aP.needsUpdate = true; this.aC.needsUpdate = true; this.geo.computeVertexNormals();
  };
  /* griglia quadrata (N+1)² su [−L, L]², vertice i(N+1)+j; linee del reticolo ogni «ogni» nodi */
  function grigliaQuadrata(N, L, ogni) {
    var xy = [], idx = [], lin = [], K = N + 1, i, j;
    for (i = 0; i <= N; i++) for (j = 0; j <= N; j++) xy.push(-L + 2 * L * i / N, -L + 2 * L * j / N);
    for (i = 0; i < N; i++) for (j = 0; j < N; j++) { var a = i * K + j, b = (i + 1) * K + j; idx.push(a, b, b + 1, a, b + 1, a + 1); }
    for (i = 0; i <= N; i++) for (j = 0; j <= N; j++) { var k = i * K + j; if (i % ogni === 0 && j < N) lin.push(k, k + 1); if (j % ogni === 0 && i < N) lin.push(k, k + K); }
    return { xy: xy, idx: idx, lin: lin };
  }
  /* griglia polare: vertice 0 al centro, poi anelli k = 1..NR con NT punti */
  function grigliaPolare(NR, NT, R, ogni) {
    var xy = [0, 0], idx = [], lin = [], k, j;
    for (k = 1; k <= NR; k++) for (j = 0; j < NT; j++) { var r = R * k / NR, th = 2 * PI * j / NT; xy.push(r * Math.cos(th), r * Math.sin(th)); }
    function v(k, j) { return k === 0 ? 0 : 1 + (k - 1) * NT + ((j % NT) + NT) % NT; }
    for (j = 0; j < NT; j++) idx.push(0, v(1, j), v(1, j + 1));
    for (k = 1; k < NR; k++) for (j = 0; j < NT; j++) idx.push(v(k, j), v(k + 1, j), v(k + 1, j + 1), v(k, j), v(k + 1, j + 1), v(k, j + 1));
    for (k = 1; k <= NR; k++) for (j = 0; j < NT; j++) { if (k % ogni === 0) lin.push(v(k, j), v(k, j + 1)); if (j % (ogni * 2) === 0) lin.push(v(k - 1, j), v(k, j)); }
    return { xy: xy, idx: idx, lin: lin };
  }
  /* le linee di livello zero di un campo sui triangoli (linee nodali) */
  function lineeZero(xy, idx, val) {
    var seg = [];
    for (var q = 0; q < idx.length; q += 3) {
      var tagli = [];
      for (var e = 0; e < 3; e++) {
        var a = idx[q + e], b = idx[q + (e + 1) % 3], va = val[a], vb = val[b];
        if ((va < 0 && vb > 0) || (va > 0 && vb < 0)) { var f = va / (va - vb); tagli.push([xy[2 * a] + (xy[2 * b] - xy[2 * a]) * f, xy[2 * a + 1] + (xy[2 * b + 1] - xy[2 * a + 1]) * f]); }
      }
      if (tagli.length === 2) seg.push(tagli[0], tagli[1]);
    }
    return seg;
  }
  /* colori: divergente (blu–grigio–rosso) per gli spostamenti, «fuoco» per le temperature */
  function divergente(v) {
    v = Math.max(-1, Math.min(1, v));
    if (v < 0) { var f = -v; return [0.82 + (0.18 - 0.82) * f, 0.84 + (0.42 - 0.84) * f, 0.88 + (0.95 - 0.88) * f]; }
    return [0.82 + (0.97 - 0.82) * v, 0.84 + (0.3 - 0.84) * v, 0.88 + (0.22 - 0.88) * v];
  }
  var FUOCO = [[0.06, 0.08, 0.28], [0.36, 0.08, 0.52], [0.76, 0.16, 0.36], [0.98, 0.5, 0.1], [1, 0.95, 0.62]];
  function fuoco(f) { f = Math.max(0, Math.min(1, f)) * (FUOCO.length - 1); var i = Math.min(FUOCO.length - 2, Math.floor(f)), u = f - i, a = FUOCO[i], b = FUOCO[i + 1]; return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]; }
  function hex(c) { return '#' + c.map(function (v) { var s = Math.round(v * 255).toString(16); return s.length < 2 ? '0' + s : s; }).join(''); }
  /* comandi del tempo per le scene 3D: pausa, ricomincia, velocita' */
  function comandiTempo(pan, st, ricomincia, S) {
    var riga = F.el('div', { 'class': 'bsiFX-anim', role: 'group', 'aria-label': t('Controlli del tempo', 'Time controls') });
    var bp = F.el('button', { type: 'button', testo: '❚❚', 'aria-label': t('Pausa', 'Pause'), onclick: function () { st.pausa = !st.pausa; bp.textContent = st.pausa ? '▶' : '❚❚'; bp.setAttribute('aria-label', st.pausa ? t('Avvia', 'Play') : t('Pausa', 'Pause')); S.avvia(); } });
    riga.appendChild(bp);
    riga.appendChild(F.el('button', { type: 'button', testo: '↺', 'aria-label': t('Ricomincia', 'Restart'), onclick: function () { ricomincia(); st.pausa = false; bp.textContent = '❚❚'; S.avvia(); } }));
    var vel = [];
    [0.25, 0.5, 1, 2, 4].forEach(function (v) { var b = F.el('button', { type: 'button', testo: '×' + (v === 0.25 ? '¼' : v === 0.5 ? '½' : v), 'aria-label': t('Velocità ', 'Speed ') + v, onclick: function () { st.vel = v; vel.forEach(function (x) { x[1].setAttribute('aria-pressed', String(x[0] === v)); }); } }); b.setAttribute('aria-pressed', String(v === 1)); vel.push([v, b]); riga.appendChild(b); });
    pan.appendChild(riga);
  }

  /* ═══ 1. la corda ═══════════════════════════════════════════════════════ */
  function schedaCorda(div) {
    var G = grigliaUI(div), pan = G.pan, st = { forma: 'pizzicata', p: 0.3, N: 12 };
    F.scelta(pan, ['Forma iniziale (velocità iniziale nulla)', 'Initial shape (zero initial velocity)'], [['pizzicata', ['corda pizzicata (triangolo)', 'plucked string (triangle)']], ['gauss', ['impulso gaussiano', 'Gaussian pulse']], ['modo', ['terzo modo normale sin 3πx', 'third normal mode sin 3πx']]], st.forma, function (v) { st.forma = v; prepara(); });
    F.cursore(pan, ['punto pizzicato / centro dell’impulso', 'plucked point / pulse centre'], 0.1, 0.9, 0.01, st.p, function (v) { st.p = v; prepara(); }, function (v) { return v.toFixed(2); });
    F.cursore(pan, ['modi di Fourier N', 'Fourier modes N'], 1, 60, 1, st.N, function (v) { st.N = v; prepara(); });
    var info = nota(pan);
    nota(pan, t('Equazione u_tt = c² u_xx su [0, L] con gli estremi fissi (c = L = 1). d’Alembert: u = ½[F(x − ct) + F(x + ct)], dove F è l’estensione dispari e 2L-periodica del profilo iniziale: le due metà (viola e rosa) viaggiano in versi opposti e si riflettono capovolte agli estremi. Fourier: u = Σ b_n sin(nπx/L) cos(nπct/L), con b_n = (2/L)∫ f sin(nπx/L) dx; per la corda pizzicata b_n ∝ sin(nπp)/n², e lo spigolo fa convergere lentamente la serie. L’energia E = ½∫(u_t² + c²u_x²) dx = (L/4) Σ b_n² ω_n² passa da potenziale a cinetica e ritorno, ma la somma non cambia: il periodo è 2L/c.',
      'Equation u_tt = c² u_xx on [0, L] with fixed ends (c = L = 1). d’Alembert: u = ½[F(x − ct) + F(x + ct)], where F is the odd, 2L-periodic extension of the initial profile: the two halves (violet and pink) travel in opposite directions and reflect upside down at the ends. Fourier: u = Σ b_n sin(nπx/L) cos(nπct/L), with b_n = (2/L)∫ f sin(nπx/L) dx; for the plucked string b_n ∝ sin(nπp)/n², and the corner makes the series converge slowly. The energy E = ½∫(u_t² + c²u_x²) dx = (L/4) Σ b_n² ω_n² moves from potential to kinetic and back, but the sum does not change: the period is 2L/c.'));
    var ca = F.tela(G.dx, 0.5), ce = F.tela(G.dx, 0.42);
    var f, b, bTutti, X = [], tabSin = [];
    for (var i = 0; i <= 300; i++) X.push(i / 300);
    function forma() {
      if (st.forma === 'pizzicata') return function (x) { return x < st.p ? x / st.p : (1 - x) / (1 - st.p); };
      if (st.forma === 'gauss') return function (x) { return Math.exp(-Math.pow((x - st.p) / 0.06, 2)); };
      return function (x) { return Math.sin(3 * PI * x); };
    }
    function prepara() {
      f = forma();
      bTutti = st.forma === 'pizzicata' ? coeffPizzicata(1, st.p, 1, 4000) : st.forma === 'gauss' ? coeffSeno(f, 1, 400, 4000) : [0, 0, 1];
      b = bTutti.slice(0, st.N);
      tabSin = []; for (var n = 1; n <= b.length; n++) tabSin.push(X.map(function (x) { return Math.sin(n * PI * x); }));
      var E = st.forma === 'pizzicata' ? energiaPizzicata(1, st.p, 1, 1) : energiaModi(bTutti, 1, 1, 0).tot, EN = energiaModi(b, 1, 1, 0).tot;
      var errMax = 0; X.forEach(function (x) { errMax = Math.max(errMax, Math.abs(serieCorda(b, 1, 1, x, 0) - f(x))); });
      var Tt = [], Ec = [], Ep = [], Et = []; for (var k = 0; k <= 200; k++) { var tt = 2 * k / 200, e = energiaModi(b, 1, 1, tt); Tt.push(tt); Ec.push(e.cin); Ep.push(e.pot); Et.push(e.tot); }
      var ud = function (x, tt) { return dalembert(f, 1, 1, x, tt); }, pn = [];
      for (k = 0; k <= 8; k++) pn.push({ x: k * 0.25, y: energiaNumerica(ud, 1, 1, k * 0.25, 2000), col: '#ffd24a', r: 4 });
      F.grafico(ce, { serie: [{ x: Tt, y: Ep, col: '#6bcfff', etich: ['potenziale', 'potential'] }, { x: Tt, y: Ec, col: '#ff8a80', etich: ['cinetica', 'kinetic'] }, { x: Tt, y: Et, col: '#5eead4', larg: 2.5, etich: ['totale (N modi)', 'total (N modes)'] }], punti: pn, ymin: 0, xl: ['tempo t (un periodo 2L/c)', 'time t (one period 2L/c)'], yl: ['energia', 'energy'],
        legenda: [{ col: '#6bcfff', etich: ['potenziale (N modi)', 'potential (N modes)'] }, { col: '#ff8a80', etich: ['cinetica (N modi)', 'kinetic (N modes)'] }, { col: '#5eead4', etich: ['totale (N modi)', 'total (N modes)'] }, { col: '#ffd24a', etich: ['∫ numerico su d’Alembert', 'numerical ∫ on d’Alembert'] }], descr: ['Energia cinetica, potenziale e totale della corda in un periodo', 'Kinetic, potential and total energy of the string over a period'] });
      info.innerHTML = t('Energia esatta ', 'Exact energy ') + 'E = <b>' + fmt(E) + '</b>' + (st.forma === 'pizzicata' ? ' = ½c²h²(1/p + 1/(L−p))' : '') + '<br>' + t('Con N = ', 'With N = ') + st.N + t(' modi: ', ' modes: ') + '<b>' + fmt(EN) + '</b> (' + fmt(100 * EN / E) + ' %)<br>' +
        t('Scarto massimo serie − profilo a t = 0: ', 'Max series − profile gap at t = 0: ') + '<b>' + fmt(errMax) + '</b><br>' + t('Punti gialli: ½∫(u_t² + u_x²)dx integrato sulla soluzione di d’Alembert, costante nel tempo.', 'Yellow dots: ½∫(u_t² + u_x²)dx integrated on the d’Alembert solution, constant in time.');
    }
    prepara();
    F.anima(ca, function (dt, tempo) {
      var P = F.pennello(ca), q = P.q, W = P.W, H = P.H, mx = 26, X0 = function (x) { return mx + x * (W - 2 * mx); }, Y0 = function (u) { return H * 0.5 - u * H * 0.34; };
      var tt = (tempo * 0.25) % 2, Fd = estDispari(f, 1);
      q.strokeStyle = '#1d2f49'; q.beginPath(); q.moveTo(X0(0), Y0(0)); q.lineTo(X0(1), Y0(0)); q.stroke();
      function curva(fn, col, larg, tratt) { q.strokeStyle = col; q.lineWidth = larg; q.setLineDash(tratt || []); q.beginPath(); for (var i = 0; i <= 300; i++) { var y = Y0(fn(i)); if (i) q.lineTo(X0(X[i]), y); else q.moveTo(X0(X[i]), y); } q.stroke(); q.setLineDash([]); }
      curva(function (i) { return 0.5 * Fd(X[i] - tt); }, 'rgba(201,160,255,.55)', 1.2);
      curva(function (i) { return 0.5 * Fd(X[i] + tt); }, 'rgba(255,138,200,.55)', 1.2);
      curva(function (i) { return 0.5 * (Fd(X[i] - tt) + Fd(X[i] + tt)); }, '#5eead4', 3);
      var cs = b.map(function (bn, n) { return bn * Math.cos((n + 1) * PI * tt); });
      curva(function (i) { var s = 0; for (var n = 0; n < cs.length; n++) s += cs[n] * tabSin[n][i]; return s; }, '#ffd24a', 1.6, [6, 4]);
      q.fillStyle = '#c9d3df'; q.beginPath(); q.arc(X0(0), Y0(0), 5, 0, 7); q.arc(X0(1), Y0(0), 5, 0, 7); q.fill();
      q.font = '12px system-ui,sans-serif'; q.textAlign = 'left'; q.fillStyle = '#cfe3f7'; q.fillText('t = ' + tt.toFixed(2) + ' · ' + t('periodo 2L/c = 2', 'period 2L/c = 2'), 10, 18);
      q.fillStyle = '#5eead4'; q.fillText('d’Alembert', 10, H - 26); q.fillStyle = '#ffd24a'; q.fillText('Fourier, N = ' + st.N, 100, H - 26);
      q.fillStyle = '#c9a0ff'; q.fillText('½F(x − ct)', 10, H - 9); q.fillStyle = '#ff8ac8'; q.fillText('½F(x + ct)', 100, H - 9);
      ca.setAttribute('aria-label', t('Corda vibrante: d’Alembert e serie di Fourier, t = ', 'Vibrating string: d’Alembert and Fourier series, t = ') + tt.toFixed(2));
    }, { ricomincia: function () { } });
  }

  /* ═══ 2. la membrana in 3D ══════════════════════════════════════════════ */
  function schedaMembrana(pan, S, destra) {
    var T = S.T, lab = globale.BSILab3D, st = { forma: 'quadrata', m: 1, n: 2, comb: 'no', vel: 1, pausa: false, amp: 1 }, L = 2.5;
    F.scelta(pan, ['Membrana', 'Membrane'], [['quadrata', ['quadrata (lato 1)', 'square (side 1)']], ['circolare', ['circolare (raggio 1): tamburo', 'circular (radius 1): drum']]], st.forma, function (v) { st.forma = v; comandi(); costruisci(); });
    var box = F.el('div'); pan.appendChild(box);
    F.cursore(pan, ['ampiezza', 'amplitude'], 0.2, 1.5, 0.1, st.amp, function (v) { st.amp = v; S.avvia(); }, function (v) { return v.toFixed(1); });
    comandiTempo(pan, st, function () { fase = 0; }, S);
    var info = nota(pan);
    nota(pan, t('Membrana fissata sul bordo: u_tt = c²(u_xx + u_yy). Separando le variabili, nel quadrato u = sin(mπx) sin(nπy) cos ωt con ω = cπ√(m² + n²); nel cerchio, in coordinate polari, u = J_m(kr) cos(mθ) cos ωt e la condizione u(1, θ) = 0 impone k = j_mn, l’n-esimo zero di J_m, quindi ω = c j_mn. Le linee bianche sono le linee nodali (ferme a ogni istante); sul fondo la stessa figura come la disegnerebbe la sabbia (Chladni). I modi (m,n) e (n,m) del quadrato hanno la stessa frequenza: le loro combinazioni danno figure nodali nuove. Le frequenze del tamburo, 1 : 1,593 : 2,136 : 2,295 …, non sono multipli interi della fondamentale: per questo un tamburo non ha un’altezza definita come una corda.',
      'Membrane fixed at the edge: u_tt = c²(u_xx + u_yy). Separating variables, in the square u = sin(mπx) sin(nπy) cos ωt with ω = cπ√(m² + n²); in the disc, in polar coordinates, u = J_m(kr) cos(mθ) cos ωt and the condition u(1, θ) = 0 forces k = j_mn, the n-th zero of J_m, so ω = c j_mn. White lines are the nodal lines (at rest at every instant); on the floor the same figure as sand would draw it (Chladni). Square modes (m,n) and (n,m) share the same frequency: their combinations give new nodal patterns. The drum frequencies, 1 : 1.593 : 2.136 : 2.295 …, are not integer multiples of the fundamental: this is why a drum has no definite pitch like a string.'));
    var cf = F.tela(destra, 0.36);
    function comandi() {
      box.innerHTML = '';
      if (st.forma === 'quadrata') {
        st.m = Math.max(1, st.m); st.n = Math.max(1, Math.min(4, st.n));
        F.cursore(box, ['m (mezze onde lungo x)', 'm (half-waves along x)'], 1, 4, 1, st.m, function (v) { st.m = v; costruisci(); });
        F.cursore(box, ['n (mezze onde lungo y)', 'n (half-waves along y)'], 1, 4, 1, st.n, function (v) { st.n = v; costruisci(); });
        F.scelta(box, ['Combinazione degenere', 'Degenerate combination'], [['no', ['solo (m,n)', '(m,n) only']], ['piu', '(m,n) + (n,m)'], ['meno', '(m,n) − (n,m)']], st.comb, function (v) { st.comb = v; costruisci(); });
      } else {
        st.m = Math.min(3, st.m); st.n = Math.min(3, st.n);
        F.cursore(box, ['m (diametri nodali)', 'm (nodal diameters)'], 0, 3, 1, st.m, function (v) { st.m = v; costruisci(); });
        F.cursore(box, ['n (cerchi nodali, bordo compreso)', 'n (nodal circles, rim included)'], 1, 3, 1, st.n, function (v) { st.n = v; costruisci(); });
      }
    }
    var sup, Phi, fase = 0, rapporto = 1, zbuf;
    function costruisci() {
      S.pulisci();
      var g, i, j, om, om0, nome;
      if (st.forma === 'quadrata') {
        g = grigliaQuadrata(64, L, 4);
        Phi = new Float64Array(g.xy.length / 2);
        for (i = 0; i < Phi.length; i++) {
          var x = (g.xy[2 * i] + L) / (2 * L), y = (g.xy[2 * i + 1] + L) / (2 * L), v = Math.sin(st.m * PI * x) * Math.sin(st.n * PI * y);
          if (st.comb !== 'no' && st.m !== st.n) v += (st.comb === 'piu' ? 1 : -1) * Math.sin(st.n * PI * x) * Math.sin(st.m * PI * y);
          Phi[i] = v;
        }
        om = omegaQuadrato(st.m, st.n); om0 = omegaQuadrato(1, 1);
        nome = '(' + st.m + ',' + st.n + ')' + (st.comb !== 'no' && st.m !== st.n ? (st.comb === 'piu' ? ' + ' : ' − ') + '(' + st.n + ',' + st.m + ')' : '');
        var tel = [[-L, -L], [L, -L], [L, L], [-L, L], [-L, -L]];
        for (i = 0; i < 4; i++) { var a = tel[i], b = tel[i + 1], bar = new T.Mesh(new T.BoxGeometry(Math.abs(b[0] - a[0]) + 0.12, Math.abs(b[1] - a[1]) + 0.12, 0.12), new T.MeshStandardMaterial({ color: 0xb08a4a, metalness: 0.5, roughness: 0.35 })); bar.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0); S.aggiungi(bar); }
      } else {
        g = grigliaPolare(40, 120, L, 4);
        var k0 = zeroBessel(st.m, st.n);
        Phi = new Float64Array(g.xy.length / 2);
        var tabJ = []; for (i = 0; i <= 400; i++) tabJ.push(besselJ(st.m, k0 * i / 400));
        for (i = 0; i < Phi.length; i++) { var r = Math.hypot(g.xy[2 * i], g.xy[2 * i + 1]) / L, th = Math.atan2(g.xy[2 * i + 1], g.xy[2 * i]), fr = Math.min(400, r * 400), i0 = Math.min(399, Math.floor(fr)); Phi[i] = (tabJ[i0] + (tabJ[i0 + 1] - tabJ[i0]) * (fr - i0)) * Math.cos(st.m * th); }
        om = omegaCerchio(st.m, st.n); om0 = omegaCerchio(0, 1);
        nome = 'J' + st.m + ' · j' + st.m + st.n + ' = ' + k0.toFixed(4);
        S.aggiungi(new T.Mesh(new T.TorusGeometry(L, 0.07, 14, 160), new T.MeshStandardMaterial({ color: 0xb08a4a, metalness: 0.55, roughness: 0.3 })));
      }
      var mx = 0; for (i = 0; i < Phi.length; i++) mx = Math.max(mx, Math.abs(Phi[i])); for (i = 0; i < Phi.length; i++) Phi[i] /= mx || 1;
      rapporto = om / om0;
      sup = new Superficie(T, g.xy, g.idx, g.lin); S.aggiungi(sup.mesh); S.aggiungi(sup.rete);
      zbuf = new Float32Array(Phi.length);
      /* linee nodali: sulla membrana (z = 0, ferme) e sul fondo */
      var seg = lineeZero(g.xy, g.idx, Phi), p1 = [], p2 = [], zf = -1.9;
      for (i = 0; i < seg.length; i++) { p1.push(new T.Vector3(seg[i][0], seg[i][1], 0)); p2.push(new T.Vector3(seg[i][0], seg[i][1], zf + 0.01)); }
      var ln = new T.LineSegments(new T.BufferGeometry().setFromPoints(p1), new T.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthTest: false })); ln.renderOrder = 5; S.aggiungi(ln);
      var fondo = st.forma === 'quadrata' ? new T.Mesh(new T.PlaneGeometry(2 * L, 2 * L), new T.MeshStandardMaterial({ color: 0x1a2a3e, roughness: 0.9 })) : new T.Mesh(new T.CircleGeometry(L, 96), new T.MeshStandardMaterial({ color: 0x1a2a3e, roughness: 0.9 }));
      fondo.position.z = zf; S.aggiungi(fondo);
      S.aggiungi(new T.LineSegments(new T.BufferGeometry().setFromPoints(p2), new T.LineBasicMaterial({ color: 0xf2d79a })));
      var luce = new T.PointLight(0xfff1d6, 0.5, 30); luce.position.set(0, 0, 6); S.aggiungi(luce);
      if (lab.assi) S.aggiungi(lab.assi(T, L * 1.15, ['x', 'y', 'u'], 0.3));
      function aggiorna() { var c = Math.cos(fase) * st.amp; for (var i = 0; i < Phi.length; i++) zbuf[i] = Phi[i] * c; sup.imposta(zbuf, function (i) { return divergente(zbuf[i] / 1.2); }); }
      aggiorna();
      S.ogniFotogramma(function (dt) { if (st.pausa) return false; fase += dt * st.vel * 2 * PI * 0.45 * rapporto; aggiorna(); });
      S.didascalia.textContent = (st.forma === 'quadrata' ? t('Membrana quadrata, modo ', 'Square membrane, mode ') : t('Membrana circolare, ', 'Circular membrane, ')) + nome + ' · ω/ω₁ = ' + rapporto.toFixed(4);
      var nd = st.forma === 'quadrata' ? (st.comb === 'no' || st.m === st.n ? t('linee nodali: ', 'nodal lines: ') + (st.m - 1) + t(' verticali e ', ' vertical and ') + (st.n - 1) + t(' orizzontali', ' horizontal') : t('linee nodali curve: la combinazione di due modi con la stessa ω è ancora un modo', 'curved nodal lines: a combination of two modes with the same ω is still a mode'))
        : st.m + t(' diametri nodali e ', ' nodal diameters and ') + (st.n - 1) + t(' cerchi nodali interni, di raggio ', ' interior nodal circles, of radius ') + (function () { var o = []; for (var k = 1; k < st.n; k++) o.push((zeroBessel(st.m, k) / zeroBessel(st.m, st.n)).toFixed(3)); return o.join(', ') || '—'; })();
      info.innerHTML = 'ω = ' + (st.forma === 'quadrata' ? 'cπ√(m² + n²) = <b>' + fmt(om) + '</b>' : 'c j<sub>' + st.m + st.n + '</sub> = <b>' + fmt(om) + '</b>') + ' (c = 1)<br>' + t('Rispetto alla fondamentale: ', 'Relative to the fundamental: ') + '<b>' + rapporto.toFixed(4) + '</b><br>' + nd +
        '<br>' + t('Zeri di Bessel calcolati: ', 'Computed Bessel zeros: ') + 'j₀₁ = ' + zeroBessel(0, 1).toFixed(4) + ', j₁₁ = ' + zeroBessel(1, 1).toFixed(4) + ', j₂₁ = ' + zeroBessel(2, 1).toFixed(4) + ', j₀₂ = ' + zeroBessel(0, 2).toFixed(4);
      if (!S.vistaIniziale) S.inquadra(11.5, -0.95, 0.95);
      spettro();
    }
    function spettro() {
      var bq = [], bc = [], vq = [], vc = [], m, n;
      for (m = 1; m <= 4; m++) for (n = 1; n <= 4; n++) vq.push(omegaQuadrato(m, n) / omegaQuadrato(1, 1));
      for (m = 0; m <= 3; m++) for (n = 1; n <= 3; n++) vc.push(omegaCerchio(m, n) / omegaCerchio(0, 1));
      vq.filter(function (v) { return v <= 4.05; }).forEach(function (v) { bq.push({ x: v, y: 1, col: '#5eead4', larg: 2.5 }); });
      vc.filter(function (v) { return v <= 4.05; }).forEach(function (v) { bc.push({ x: v, y: 0.7, col: '#ffd24a', larg: 2.5 }); });
      var pt = [1, 2, 3, 4].map(function (k) { return { x: k, y: 0.35, col: '#ff8a80', r: 5 }; });
      var att = st.forma === 'quadrata' ? omegaQuadrato(st.m, st.n) / omegaQuadrato(1, 1) : omegaCerchio(st.m, st.n) / omegaCerchio(0, 1);
      pt.push({ x: att, y: st.forma === 'quadrata' ? 1.08 : 0.78, col: '#ffffff', r: 5 });
      F.grafico(cf, { barre: bq.concat(bc), punti: pt, xmin: 0.8, xmax: 4.1, ymin: 0, ymax: 1.2, xl: ['frequenza / fondamentale', 'frequency / fundamental'], yl: ['', ''], legenda: [{ col: '#5eead4', etich: ['quadrato', 'square'] }, { col: '#ffd24a', etich: ['tamburo', 'drum'] }, { col: '#ff8a80', etich: ['corda (armoniche)', 'string (harmonics)'] }], descr: ['Spettro delle frequenze di membrana quadrata, tamburo e corda', 'Frequency spectrum of square membrane, drum and string'] });
    }
    comandi(); costruisci();
  }

  /* ═══ 3. il calore 1D ═══════════════════════════════════════════════════ */
  function schedaCalore1D(div) {
    var G = grigliaUI(div), pan = G.pan, st = { forma: 'impulso', N: 40, r: 0.4 };
    F.scelta(pan, ['Temperatura iniziale', 'Initial temperature'], [['impulso', ['rettangolo al centro', 'central rectangle']], ['due', ['due rettangoli', 'two rectangles']], ['tenda', ['tenda', 'tent']], ['parabola', ['parabola 4x(1 − x)', 'parabola 4x(1 − x)']]], st.forma, function (v) { st.forma = v; prepara(); });
    F.cursore(pan, ['intervalli N (Δx = 1/N)', 'intervals N (Δx = 1/N)'], 10, 80, 2, st.N, function (v) { st.N = v; prepara(); });
    F.cursore(pan, ['r = αΔt/Δx²', 'r = αΔt/Δx²'], 0.1, 0.6, 0.01, st.r, function (v) { st.r = v; prepara(); }, function (v) { return v.toFixed(2); });
    var info = nota(pan);
    nota(pan, t('u_t = α u_xx su [0, 1], u = 0 agli estremi (α = 1). Serie: u = Σ b_n e^(−αn²π²t) sin nπx; ogni modo decade con il suo esponente, quelli alti per primi: gli spigoli si arrotondano subito e alla fine resta la sola sinusoide fondamentale, che decade come e^(−π²t). FTCS (avanti nel tempo, centrato nello spazio): u_i ← u_i + r(u_{i+1} − 2u_i + u_{i−1}). L’analisi di von Neumann dà il fattore di amplificazione 1 − 4r sin²(kΔx/2): per r > 1/2 il modo a zig-zag cresce e lo schema esplode. Errore di troncamento O(Δt + Δx²).',
      'u_t = α u_xx on [0, 1], u = 0 at the ends (α = 1). Series: u = Σ b_n e^(−αn²π²t) sin nπx; each mode decays with its own exponent, high ones first: corners round off at once and finally only the fundamental sine is left, decaying as e^(−π²t). FTCS (forward in time, centred in space): u_i ← u_i + r(u_{i+1} − 2u_i + u_{i−1}). Von Neumann analysis gives the amplification factor 1 − 4r sin²(kΔx/2): for r > 1/2 the zig-zag mode grows and the scheme blows up. Truncation error O(Δt + Δx²).'));
    var ca = F.tela(G.dx, 0.5), ce = F.tela(G.dx, 0.42);
    var b, u, tNum, dt, X = [], tabX = tabellaSeni(400, 200);
    for (var i = 0; i <= 200; i++) X.push(i / 200);
    function prepara() {
      b = coeffForma1D(st.forma, 400); u = iniziale1D(st.forma, st.N); tNum = 0; dt = st.r / (st.N * st.N);
      var C = confrontaCalore1D(st.forma, st.N, st.r, 0.12, 80, 300), C2 = confrontaCalore1D(st.forma, st.N / 2, st.r, 0.12, 80, 300);
      var lg = function (a) { return a.map(function (v) { return Math.max(-8, Math.min(6, Math.log10(Math.max(v, 1e-12)))); }); };
      F.grafico(ce, { serie: [{ x: C.t, y: lg(C.err), col: '#5eead4', etich: ['N = ' + st.N, 'N = ' + st.N] }, { x: C2.t, y: lg(C2.err), col: '#c9a0ff', etich: ['N = ' + st.N / 2, 'N = ' + st.N / 2] }], ymin: -8, ymax: 6, xl: ['tempo t', 'time t'], yl: ['log₁₀ max|FTCS − serie|', 'log₁₀ max|FTCS − series|'],
        legenda: [{ col: '#5eead4', etich: ['Δx = 1/' + st.N, 'Δx = 1/' + st.N] }, { col: '#c9a0ff', etich: ['Δx = 1/' + st.N / 2, 'Δx = 1/' + st.N / 2] }], descr: ['Errore delle differenze finite rispetto alla serie di Fourier', 'Finite-difference error against the Fourier series'] });
      var ef = C.err[C.err.length - 1], ef2 = C2.err[C2.err.length - 1], stab = st.r <= 0.5;
      info.innerHTML = 'Δt = rΔx² = <b>' + dt.toExponential(2) + '</b> · ' + t('passi fino a t = 0,12: ', 'steps to t = 0.12: ') + '<b>' + C.passi + '</b><br>' +
        (stab ? '<span class="bsiFX-ok">' + t('stabile', 'stable') + '</span> (r ≤ ½)' : '<span class="bsiFX-ko">' + t('instabile: il modo a zig-zag cresce come |1 − 4r|ⁿ = ', 'unstable: the zig-zag mode grows as |1 − 4r|ⁿ = ') + Math.abs(1 - 4 * st.r).toFixed(2) + 'ⁿ</span>') + '<br>' +
        t('Errore a t = 0,12: ', 'Error at t = 0.12: ') + '<b>' + fmt(ef) + '</b>; ' + t('con Δx doppio ', 'with Δx doubled ') + '<b>' + fmt(ef2) + '</b>' + (stab ? ' (' + t('rapporto ', 'ratio ') + fmt(ef2 / ef) + t(', atteso ≈ 4: ordine 2 in Δx a r fisso', ', expected ≈ 4: second order in Δx at fixed r') + ')' : '') +
        '<br>' + t('Ampiezza del modo fondamentale: ', 'Fundamental mode amplitude: ') + 'b₁ = ' + fmt(b[0]) + ' → ' + t('a t = 0,12 ', 'at t = 0.12 ') + fmt(b[0] * Math.exp(-PI * PI * 0.12));
    }
    prepara();
    F.anima(ca, function (dts, tempo) {
      var tt = (tempo * 0.02) % 0.15;
      if (tt < tNum) { u = iniziale1D(st.forma, st.N); tNum = 0; }
      while (tNum + dt <= tt) { u = ftcs1D(u, st.r); tNum += dt; }
      var P = F.pennello(ca), q = P.q, W = P.W, H = P.H, mx = 30, X0 = function (x) { return mx + x * (W - 2 * mx); }, Y0 = function (v) { return H - 24 - Math.max(-0.15, Math.min(1.15, v)) * (H - 50); };
      q.strokeStyle = '#1d2f49'; q.beginPath(); q.moveTo(X0(0), Y0(0)); q.lineTo(X0(1), Y0(0)); q.moveTo(X0(0), Y0(1)); q.lineTo(X0(1), Y0(1)); q.stroke();
      /* la sbarra colorata per temperatura */
      var dec = smorzamenti(b, 1, tNum), ys = X.map(function (x, i) { return sommaTab(dec, tabX[i]); });
      for (var k = 0; k < 200; k++) { q.fillStyle = hex(fuoco((ys[k] + ys[k + 1]) / 2)); q.fillRect(X0(k / 200), H - 14, (W - 2 * mx) / 200 + 1, 8); }
      q.strokeStyle = 'rgba(132,148,168,.6)'; q.setLineDash([3, 3]); q.beginPath(); X.forEach(function (x, i) { var y = Y0(valoreForma1D(st.forma, x)); if (i) q.lineTo(X0(x), y); else q.moveTo(X0(x), y); }); q.stroke(); q.setLineDash([]);
      q.strokeStyle = '#ffd24a'; q.lineWidth = 2.5; q.beginPath(); X.forEach(function (x, i) { var y = Y0(ys[i]); if (i) q.lineTo(X0(x), y); else q.moveTo(X0(x), y); }); q.stroke(); q.lineWidth = 1;
      q.fillStyle = '#5eead4'; for (k = 0; k <= st.N; k++) { q.beginPath(); q.arc(X0(k / st.N), Y0(u[k]), 3, 0, 7); q.fill(); }
      q.font = '12px system-ui,sans-serif'; q.textAlign = 'left'; q.fillStyle = '#cfe3f7'; q.fillText('t = ' + tNum.toFixed(4), 10, 16);
      q.fillStyle = '#ffd24a'; q.fillText(t('serie di Fourier', 'Fourier series'), 100, 16); q.fillStyle = '#5eead4'; q.fillText('FTCS r = ' + st.r.toFixed(2), 220, 16);
      ca.setAttribute('aria-label', t('Equazione del calore su una sbarra: serie e differenze finite, t = ', 'Heat equation on a rod: series and finite differences, t = ') + tNum.toFixed(4));
    }, { ricomincia: function () { u = iniziale1D(st.forma, st.N); tNum = 0; } });
  }

  /* ═══ 4. il calore 2D in 3D ═════════════════════════════════════════════ */
  function schedaCalore2D(pan, S, destra) {
    var T = S.T, lab = globale.BSILab3D, M = 40, L = 2.5, st = { forma: 'quadrato', r: 0.24, vel: 1, pausa: false };
    F.scelta(pan, ['Temperatura iniziale', 'Initial temperature'], [['quadrato', ['quadrato caldo al centro', 'hot square in the centre']], ['due', ['due zone calde', 'two hot patches']], ['croce', ['croce calda', 'hot cross']]], st.forma, function (v) { st.forma = v; ricomincia(); });
    F.cursore(pan, ['r = αΔt/h² (stabile se ≤ ¼)', 'r = αΔt/h² (stable if ≤ ¼)'], 0.05, 0.25, 0.01, st.r, function (v) { st.r = v; ricomincia(); }, function (v) { return v.toFixed(2); });
    comandiTempo(pan, st, function () { ricomincia(); }, S);
    var info = nota(pan);
    nota(pan, t('Lastra quadrata con il bordo a temperatura 0: u_t = α(u_xx + u_yy). Differenze finite esplicite su una griglia 40 × 40 (schema a cinque punti, stabile per r ≤ ¼ in 2D); per confronto la serie doppia u = Σ b_mn e^(−(m² + n²)π²t) sin mπx sin nπy con i coefficienti in forma chiusa dei rettangoli. La quota e il colore sono la temperatura: i gradini si smussano subito, poi tutto tende al modo (1,1), che decade come e^(−2π²t).',
      'Square plate with the edge held at 0: u_t = α(u_xx + u_yy). Explicit finite differences on a 40 × 40 grid (five-point stencil, stable for r ≤ ¼ in 2D); for comparison the double series u = Σ b_mn e^(−(m² + n²)π²t) sin mπx sin nπy with closed-form coefficients for the rectangles. Height and colour are the temperature: the steps smooth out at once, then everything tends to the (1,1) mode, which decays as e^(−2π²t).'));
    var cc = F.tela(destra, 0.38);
    var g = grigliaQuadrata(M, L, 4), sup = new Superficie(T, g.xy, g.idx, g.lin), u, tNum, zb = new Float32Array((M + 1) * (M + 1)), regFD = [], regT = [], serT = [], serV = [], conta = 0;
    S.aggiungi(sup.mesh); S.aggiungi(sup.rete);
    var cornice = []; [[-L, -L], [L, -L], [L, L], [-L, L], [-L, -L]].forEach(function (p) { cornice.push([p[0], p[1], 0]); });
    S.aggiungi(lab.linea(T, cornice, 0x6bcfff));
    S.aggiungi(lab.assi(T, L * 1.15, ['x', 'y', 'u'], 0.3));
    var luce = new T.PointLight(0xffc27a, 0.6, 30); luce.position.set(0, 0, 5); S.aggiungi(luce);
    function disegnaSup() { for (var i = 0; i < zb.length; i++) zb[i] = u[i] * 2.2; sup.imposta(zb, function (i) { return fuoco(u[i]); }); }
    function ricomincia() {
      u = iniziale2D(st.forma, M); tNum = 0; regFD = [0]; regT = [0]; conta = 0;
      regFD[0] = u[(M / 2) * (M + 1) + M / 2];
      serT = []; serV = []; for (var k = 0; k <= 60; k++) { var tt = 0.12 * k / 60; serT.push(tt); serV.push(calore2DSerieVeloce(st.forma, 0.5, 0.5, tt, 60)); }
      disegnaSup(); grafico(); S.avvia();
    }
    function grafico() {
      F.grafico(cc, { serie: [{ x: serT, y: serV, col: '#ffd24a', etich: ['serie doppia', 'double series'] }], punti: regT.map(function (x, i) { return { x: x, y: regFD[i], col: '#5eead4', r: 2.5 }; }), xmin: 0, xmax: 0.12, ymin: 0, xl: ['tempo t', 'time t'], yl: ['u(½, ½, t)', 'u(½, ½, t)'],
        legenda: [{ col: '#ffd24a', etich: ['serie doppia (60 × 60 termini)', 'double series (60 × 60 terms)'] }, { col: '#5eead4', etich: ['differenze finite', 'finite differences'] }], descr: ['Temperatura al centro della lastra nel tempo', 'Temperature at the plate centre over time'] });
      var c = u[(M / 2) * (M + 1) + M / 2], s = calore2DSerieVeloce(st.forma, 0.5, 0.5, tNum, 60);
      info.innerHTML = 't = <b>' + tNum.toFixed(4) + '</b> · Δt = ' + (st.r / (M * M)).toExponential(2) + '<br>' + t('Centro: differenze finite ', 'Centre: finite differences ') + '<b>' + c.toFixed(5) + '</b>, ' + t('serie ', 'series ') + '<b>' + s.toFixed(5) + '</b><br>' + t('Il modo (1,1) da solo decadrebbe di e^(−2π²t) = ', 'The (1,1) mode alone would decay by e^(−2π²t) = ') + fmt(Math.exp(-2 * PI * PI * tNum));
      S.didascalia.textContent = t('Lastra che si raffredda, t = ', 'Cooling plate, t = ') + tNum.toFixed(4);
    }
    ricomincia();
    S.ogniFotogramma(function (dt) {
      if (st.pausa) return false;
      if (tNum >= 0.12) return false;
      var dtn = st.r / (M * M), obiettivo = tNum + dt * st.vel * 0.006;
      while (tNum + dtn <= obiettivo && tNum < 0.12) { u = calore2DPasso(u, M, st.r); tNum += dtn; }
      disegnaSup();
      if (++conta % 8 === 0 || tNum >= 0.12) { regT.push(tNum); regFD.push(u[(M / 2) * (M + 1) + M / 2]); grafico(); }
    });
    S.inquadra(11, -0.9, 1.0);
  }

  /* ═══ 5. Laplace in 3D ══════════════════════════════════════════════════ */
  function schedaLaplace(pan, S, destra) {
    var T = S.T, lab = globale.BSILab3D, L = 2.5, st = { bordo: 'costante', metodo: 'sor', N: 29, omega: omegaOttimale(29), passi: 2, pausa: false, vel: 1, ottimo: true };
    F.scelta(pan, ['Bordo superiore u(x, 1)', 'Top edge u(x, 1)'], [['costante', ['1 (costante)', '1 (constant)']], ['seno', 'sin πx'], ['parabola', '4x(1 − x)'], ['tenda', ['tenda', 'tent']]], st.bordo, function (v) { st.bordo = v; tutto(); });
    F.scelta(pan, ['Metodo iterativo', 'Iterative method'], [['jacobi', 'Jacobi'], ['gs', 'Gauss–Seidel'], ['sor', 'SOR']], st.metodo, function (v) { st.metodo = v; ricomincia(); });
    F.cursore(pan, ['punti interni per lato N', 'interior points per side N'], 9, 39, 2, st.N, function (v) { st.N = v; if (st.ottimo) st.omega = omegaOttimale(v); tutto(); });
    var cw = F.cursore(pan, ['ω (SOR)', 'ω (SOR)'], 1, 1.98, 0.01, st.omega, function (v) { st.omega = v; st.ottimo = false; ricomincia(); }, function (v) { return v.toFixed(2); });
    F.bottone(pan, ['ω = ω ottimale', 'ω = optimal ω'], function () { st.omega = omegaOttimale(st.N); st.ottimo = true; cw.value = st.omega; cw.dispatchEvent(new Event('input')); st.ottimo = true; });
    comandiTempo(pan, st, function () { ricomincia(); }, S);
    var info = nota(pan);
    nota(pan, t('Δu = 0 nel quadrato, u = 0 su tre lati e u = f(x) in alto. Serie: u = Σ b_n sin(nπx) sinh(nπy)/sinh(nπ). Discretizzando con il laplaciano a cinque punti ogni valore interno deve essere la media dei quattro vicini. Jacobi rimpiazza tutti i valori con la media di quelli vecchi (raggio spettrale ρ_J = cos πh); Gauss–Seidel usa subito i valori nuovi (ρ = cos² πh, il doppio più veloce); SOR esagera la correzione di un fattore ω e con ω_ott = 2/(1 + sin πh) ha ρ = ω_ott − 1 ≈ 1 − 2πh: le iterazioni passano da O(N²) a O(N). La superficie 3D mostra l’iterazione mentre converge: il calore «entra» dal bordo alto. Principio del massimo: i valori interni stanno fra il minimo e il massimo del bordo.',
      'Δu = 0 in the square, u = 0 on three sides and u = f(x) on top. Series: u = Σ b_n sin(nπx) sinh(nπy)/sinh(nπ). With the five-point Laplacian each interior value must be the average of its four neighbours. Jacobi replaces all values by the average of the old ones (spectral radius ρ_J = cos πh); Gauss–Seidel uses new values at once (ρ = cos² πh, twice as fast); SOR over-corrects by a factor ω and with ω_opt = 2/(1 + sin πh) has ρ = ω_opt − 1 ≈ 1 − 2πh: iterations drop from O(N²) to O(N). The 3D surface shows the iteration as it converges: the boundary value «flows in» from the top edge. Maximum principle: interior values lie between the boundary minimum and maximum.'));
    var cr = F.tela(destra, 0.42), cw2 = F.tela(destra, 0.42);
    var sup, u, tmp, it, Nc, storie = {}, sweep = [], lavoro = 0;
    function costruisciSup() {
      S.pulisci(); Nc = st.N;
      var g = grigliaQuadrata(st.N + 1, L, 1);
      sup = new Superficie(T, g.xy, g.idx, g.lin); S.aggiungi(sup.mesh); S.aggiungi(sup.rete);
      /* il bordo alto come curva di riferimento */
      var f = BORDI[st.bordo], bt = []; for (var i = 0; i <= 100; i++) bt.push([-L + 2 * L * i / 100, L, f(i / 100) * 2.4]);
      S.aggiungi(lab.linea(T, bt, 0xffd24a));
      var cornice = []; [[-L, -L], [L, -L], [L, L], [-L, L], [-L, -L]].forEach(function (p) { cornice.push([p[0], p[1], 0]); });
      S.aggiungi(lab.linea(T, cornice, 0x34465f));
      S.aggiungi(lab.assi(T, L * 1.15, ['x', 'y', 'u'], 0.3));
      S.ogniFotogramma(passo);
      if (!S.vistaIniziale) S.inquadra(11, -1.2, 1.0);
    }
    function disegnaSup() {
      var K = Nc + 2, z = new Float32Array(K * K), k = 0;
      /* la griglia del disegno ha vertice i(K)+j con i lungo x e j lungo y: lo stesso ordine di u[i + K j] trasposto */
      for (var i = 0; i < K; i++) for (var j = 0; j < K; j++) z[k++] = u[i + K * j] * 2.4;
      sup.imposta(z, function (q) { return fuoco(z[q] / 2.4); });
    }
    function ricomincia() {
      if (Nc !== st.N) costruisciSup();
      u = laplaceIniziale(st.N, st.bordo); tmp = new Float64Array(u.length); it = 0;
      disegnaSup(); testo(); S.avvia();
    }
    function passo(dt) {
      if (st.pausa || !u) return false;
      var r = laplaceResiduo(u, st.N); if (r <= 1e-6) { testo(); return false; }
      var n = Math.max(1, Math.round(st.passi * st.vel));
      for (var k = 0; k < n && r > 1e-6; k++) { laplacePassata(u, st.N, st.metodo, st.omega, tmp); it++; r = laplaceResiduo(u, st.N); }
      disegnaSup(); testo();
    }
    function testo() {
      var r = laplaceResiduo(u, st.N), h = 1 / (st.N + 1), K = st.N + 2, mezzo = (st.N + 1) % 2 === 0 ? u[(st.N + 1) / 2 + K * (st.N + 1) / 2] : NaN, ser = laplaceSerie(st.bordo, 0.5, 0.5, 400);
      var nomi = { jacobi: 'Jacobi', gs: 'Gauss–Seidel', sor: 'SOR ω = ' + st.omega.toFixed(3) };
      S.didascalia.textContent = nomi[st.metodo] + ' · ' + t('iterazione ', 'iteration ') + it + ' · ' + t('residuo ', 'residual ') + r.toExponential(1);
      info.innerHTML = 'h = 1/' + (st.N + 1) + ' · ρ_J = cos πh = <b>' + raggioJacobi(st.N).toFixed(5) + '</b> · ω_ott = <b>' + omegaOttimale(st.N).toFixed(4) + '</b><br>' +
        t('Iterazioni previste per ridurre il residuo di 10⁶: ', 'Predicted iterations to cut the residual by 10⁶: ') + 'Jacobi ' + Math.round(iterPreviste(st.N, 'jacobi', 1e-6)) + ', GS ' + Math.round(iterPreviste(st.N, 'gs', 1e-6)) + ', SOR ' + Math.round(iterPreviste(st.N, 'sor', 1e-6)) + t(' (stima asintotica ln 10⁻⁶ / ln ρ: i modi alti si smorzano prima, quindi è un limite superiore per Jacobi e GS)', ' (asymptotic estimate ln 10⁻⁶ / ln ρ: high modes die out first, so it is an upper bound for Jacobi and GS)') + '<br>' +
        t('Misurate (residuo < 10⁻⁶): ', 'Measured (residual < 10⁻⁶): ') + ['jacobi', 'gs', 'sor'].map(function (m) { return (m === 'jacobi' ? 'Jacobi ' : m === 'gs' ? 'GS ' : 'SOR(ω_ott) ') + '<b>' + (storie[m] ? storie[m].length - 1 : '…') + '</b>'; }).join(', ') + '<br>' +
        'u(½, ½): ' + t('iterazione ', 'iteration ') + (isFinite(mezzo) ? mezzo.toFixed(6) : '—') + ', ' + t('serie ', 'series ') + '<b>' + ser.toFixed(6) + '</b>' + (st.bordo === 'costante' ? t(' (per simmetria è esattamente ¼: i quattro problemi con un lato a 1 sommano a u ≡ 1)', ' (by symmetry exactly ¼: the four problems with one side at 1 add up to u ≡ 1)') : '');
    }
    function grafici() {
      var ser = [], col = { jacobi: '#ff8a80', gs: '#ffd24a', sor: '#5eead4' }, et = { jacobi: 'Jacobi', gs: 'Gauss–Seidel', sor: 'SOR ω_ott' };
      ['jacobi', 'gs', 'sor'].forEach(function (m) { if (!storie[m]) return; var y = storie[m], x = y.map(function (_, k) { return k; }), passo = Math.max(1, Math.floor(y.length / 400)); ser.push({ x: x.filter(function (_, k) { return k % passo === 0; }), y: y.filter(function (_, k) { return k % passo === 0; }), col: col[m], etich: [et[m], et[m]] }); });
      if (ser.length) F.grafico(cr, { serie: ser, ymin: -6.5, xl: ['iterazione', 'iteration'], yl: ['log₁₀ residuo', 'log₁₀ residual'], legenda: ser.map(function (s) { return { col: s.col, etich: s.etich }; }), descr: ['Convergenza di Jacobi, Gauss–Seidel e SOR', 'Convergence of Jacobi, Gauss–Seidel and SOR'] });
      var pts = sweep.map(function (p) { return { x: p[0], y: p[1], col: '#5eead4', r: 3 }; }), wo = omegaOttimale(st.N);
      var curva = { x: sweep.map(function (p) { return p[0]; }), y: sweep.map(function (p) { return p[1]; }), col: '#5eead4', etich: ['iterazioni', 'iterations'] };
      F.grafico(cw2, { serie: sweep.length > 1 ? [curva, { x: [wo, wo], y: [0, Math.max.apply(null, sweep.map(function (p) { return p[1]; }).concat([10]))], col: '#ffd24a', tratt: true, etich: ['ω_ott', 'ω_opt'] }] : [{ x: [1, 2], y: [0, 0], col: '#34465f' }], punti: pts, xmin: 1, xmax: 2, ymin: 0, xl: ['ω', 'ω'], yl: ['iterazioni SOR', 'SOR iterations'], legenda: [{ col: '#5eead4', etich: ['misurate', 'measured'] }, { col: '#ffd24a', etich: ['ω_ott = 2/(1 + sin πh)', 'ω_opt = 2/(1 + sin πh)'] }], descr: ['Iterazioni di SOR al variare di ω', 'SOR iterations as ω varies'] });
    }
    /* i confronti fra i metodi a lotti, un metodo (o un ω) per volta: aprire la scheda non blocca la pagina */
    function tutto() {
      ricomincia();
      var mio = ++lavoro; storie = {}; sweep = [];
      var coda = [['jacobi', 1], ['gs', 1], ['sor', omegaOttimale(st.N)]], om = [];
      for (var w = 1; w < 1.981; w += 0.04) om.push(w);
      om.push(omegaOttimale(st.N)); om.sort(function (a, b) { return a - b; });
      grafici();
      /* lotti di ~300 passate; a scheda nascosta il lavoro aspetta */
      var corrente = null, w2 = 0;
      (function prossimo() {
        if (mio !== lavoro) return;
        if (cr.offsetParent === null) { setTimeout(prossimo, 400); return; }
        if (!corrente) {
          if (coda.length) { var c = coda.shift(); corrente = laplaceRisolutore(st.N, st.bordo, c[0], c[1], 1e-6, 30000); corrente.chiave = c[0]; }
          else if (om.length) { w2 = om.shift(); corrente = laplaceRisolutore(st.N, st.bordo, 'sor', w2, 1e-6, 30000); }
          else return;
        }
        laplaceAvanza(corrente, 300);
        if (corrente.finito) {
          if (corrente.chiave) { storie[corrente.chiave] = corrente.storia; grafici(); testo(); }
          else { sweep.push([w2, corrente.iter]); if (sweep.length % 4 === 0 || !om.length) grafici(); }
          corrente = null;
        }
        setTimeout(prossimo, 0);
      })();
    }
    costruisciSup(); tutto();
  }

  /* ═══ 6. trasporto e Burgers ════════════════════════════════════════════ */
  function schedaBurgers(div) {
    var G = grigliaUI(div), pan = G.pan, st = { eq: 'burgers', dato: 'gauss', nu: 0.8, N: 400 };
    F.scelta(pan, ['Equazione', 'Equation'], [['burgers', ['Burgers u_t + u u_x = 0', 'Burgers u_t + u u_x = 0']], ['trasporto', ['trasporto u_t + u_x = 0', 'transport u_t + u_x = 0']]], st.eq, function (v) { st.eq = v; prepara(); });
    F.scelta(pan, ['Dato iniziale', 'Initial data'], Object.keys(DATI).map(function (k) { return [k, DATI[k].nome]; }), st.dato, function (v) { st.dato = v; prepara(); });
    F.cursore(pan, ['numero di Courant ν', 'Courant number ν'], 0.1, 1, 0.05, st.nu, function (v) { st.nu = v; prepara(); }, function (v) { return v.toFixed(2); });
    F.cursore(pan, ['celle', 'cells'], 50, 800, 50, st.N, function (v) { st.N = v; prepara(); });
    var info = nota(pan);
    nota(pan, t('Lungo le caratteristiche dx/dt = velocità la soluzione è costante. Nel trasporto la velocità è 1 per tutti: il profilo trasla intatto, u = u₀(x − t). Lo schema upwind lo sposta di ν celle per passo e, se ν < 1, lo smussa (diffusione numerica di coefficiente ½Δx(1 − ν)); con ν = 1 è esatto. In Burgers ogni punto viaggia con la propria altezza u: le parti alte raggiungono quelle basse, le caratteristiche x = x₀ + u₀(x₀)t si incrociano al tempo t* = −1/min u₀′ e la soluzione regolare smette di esistere (la curva tratteggiata diventa multivoca). Da lì serve la forma conservativa u_t + (u²/2)_x = 0: il metodo di Godunov risolve un problema di Riemann a ogni interfaccia e cattura un urto che corre a velocità (u_s + u_d)/2 (Rankine–Hugoniot), mentre il salto inverso si apre in un ventaglio di rarefazione u = x/t.',
      'Along the characteristics dx/dt = speed the solution is constant. In transport the speed is 1 for everyone: the profile translates intact, u = u₀(x − t). The upwind scheme moves it by ν cells per step and, if ν < 1, smears it (numerical diffusion with coefficient ½Δx(1 − ν)); with ν = 1 it is exact. In Burgers each point travels with its own height u: high parts catch up with low ones, the characteristics x = x₀ + u₀(x₀)t cross at time t* = −1/min u₀′ and the smooth solution ceases to exist (the dashed curve becomes multivalued). From then on the conservative form u_t + (u²/2)_x = 0 is needed: Godunov’s method solves a Riemann problem at each interface and captures a shock moving at speed (u_l + u_r)/2 (Rankine–Hugoniot), while the reverse jump opens into a rarefaction fan u = x/t.'));
    var ca = F.tela(G.dx, 0.5), cc = F.tela(G.dx, 0.5);
    var D0, U, dx, tNum, ts;
    function prepara() {
      D0 = DATI[st.dato]; var c = celle(st.dato, st.N); U = c.u; dx = c.dx; tNum = 0;
      ts = st.eq === 'burgers' ? (st.dato === 'salto' ? 0 : st.dato === 'rarefazione' ? Infinity : tStarFormula(D0.u0, D0.a, D0.b, 20000)) : Infinity;
      var ser = [], n = 28, tm = D0.tmax;
      for (var k = 0; k <= n; k++) {
        var x0 = D0.a + (D0.b - D0.a) * k / n, v = st.eq === 'burgers' ? D0.u0(x0) : 1;
        ser.push({ x: [x0, x0 + v * tm], y: [0, tm], col: st.eq === 'burgers' ? hex(fuoco(0.25 + 0.7 * (D0.u0(x0) + 1) / 2)) : '#6bcfff', larg: 1.2 });
      }
      if (st.eq === 'burgers' && st.dato === 'salto') ser.push({ x: [0, tm / 2], y: [0, tm], col: '#ff8a80', larg: 3, etich: ['urto x = t/2', 'shock x = t/2'] });
      if (st.eq === 'burgers' && st.dato === 'rarefazione') for (k = 1; k < 6; k++) ser.push({ x: [0, k / 6 * tm], y: [0, tm], col: '#c9a0ff', larg: 1.2 });
      F.grafico(cc, { serie: ser, xmin: D0.a, xmax: D0.b, ymin: 0, ymax: tm, xl: ['x', 'x'], yl: ['t', 't'], linee: isFinite(ts) && ts > 0 ? [{ y: ts, col: '#ff8a80', etich: 't* = ' + ts.toFixed(4) }] : [], descr: ['Caratteristiche nel piano x–t', 'Characteristics in the x–t plane'] });
      var ti = st.eq === 'burgers' && st.dato !== 'salto' && st.dato !== 'rarefazione' ? tStarIncrocio(D0.u0, D0.a, D0.b, 20000) : NaN;
      info.innerHTML = st.eq === 'burgers' ? (st.dato === 'salto' ? t('Urto fin dall’inizio: velocità di Rankine–Hugoniot s = (1 + 0)/2 = ½.', 'Shock from the start: Rankine–Hugoniot speed s = (1 + 0)/2 = ½.') : st.dato === 'rarefazione' ? t('Nessun urto: le caratteristiche divergono e lasciano un vuoto, riempito dal ventaglio u = x/t (la soluzione entropica).', 'No shock: characteristics diverge and leave a gap, filled by the fan u = x/t (the entropy solution).') :
        t('Rottura dell’onda: ', 'Wave breaking: ') + 't* = −1/min u₀′ = <b>' + ts.toFixed(5) + '</b><br>' + t('dal primo incrocio di caratteristiche vicine: ', 'from the first crossing of neighbouring characteristics: ') + '<b>' + ti.toFixed(5) + '</b>' + (st.dato === 'gauss' ? '<br>' + t('Forma chiusa: min u₀′ = −√2 e^(−½) in x = 1/√2, quindi t* = √e/√2 = ', 'Closed form: min u₀′ = −√2 e^(−½) at x = 1/√2, so t* = √e/√2 = ') + (Math.sqrt(Math.E / 2)).toFixed(5) : '<br>' + t('Per sin x: min u₀′ = −1 in x = π, t* = 1; l’urto resta fermo in π.', 'For sin x: min u₀′ = −1 at x = π, t* = 1; the shock stays at π.')))
        : t('Upwind con ν = ', 'Upwind with ν = ') + st.nu.toFixed(2) + ': ' + t('diffusione numerica ', 'numerical diffusion ') + 'D = ½Δx(1 − ν) = <b>' + fmt(0.5 * dx * (1 - st.nu)) + '</b>' + (st.nu === 1 ? t(' — con ν = 1 lo schema copia la cella a sinistra: è esatto.', ' — with ν = 1 the scheme copies the left cell: it is exact.') : '');
      info.innerHTML += '<br>Δx = ' + fmt(dx) + ' · ' + t('massa ∫u dx = ', 'mass ∫u dx = ') + '<span class="bsiFX-num" data-massa="1">' + fmt(somma(U) * dx) + '</span>';
    }
    function somma(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return s; }
    prepara();
    F.anima(ca, function (dts, tempo) {
      var tt = Math.min(D0.tmax, tempo * 0.4);
      while (tNum < tt - 1e-12) {
        var vmax = 1; if (st.eq === 'burgers') { vmax = 0; for (var i = 0; i < U.length; i++) vmax = Math.max(vmax, Math.abs(U[i])); vmax = Math.max(vmax, 1e-6); }
        var dt = Math.min(st.nu * dx / vmax, tt - tNum);
        U = st.eq === 'burgers' ? godunovPasso(U, dx, dt, D0.per) : upwindPasso(U, dt / dx, D0.per);
        tNum += dt;
      }
      var P = F.pennello(ca), q = P.q, W = P.W, H = P.H, mx = 34, X0 = function (x) { return mx + (x - D0.a) / (D0.b - D0.a) * (W - mx - 12); }, lo = st.dato === 'seno' ? -1.3 : -0.2, hi = st.dato === 'seno' ? 1.3 : 1.3, Y0 = function (v) { return 18 + (hi - v) / (hi - lo) * (H - 44); };
      q.strokeStyle = '#1d2f49'; q.beginPath(); q.moveTo(X0(D0.a), Y0(0)); q.lineTo(X0(D0.b), Y0(0)); q.stroke();
      q.fillStyle = '#8494a8'; q.font = '11px system-ui,sans-serif'; q.textAlign = 'right'; [lo < -0.5 ? -1 : 0, 1].forEach(function (v) { q.fillText(String(v), mx - 4, Y0(v) + 4); });
      /* la soluzione delle caratteristiche (esatta prima di t*, multivoca dopo) */
      q.strokeStyle = tNum < ts || st.eq !== 'burgers' ? 'rgba(255,210,74,.95)' : 'rgba(255,210,74,.55)'; q.lineWidth = 2; q.setLineDash(tNum < ts ? [] : [5, 4]); q.beginPath();
      var su = false, xp = 0;
      for (var k = 0; k <= 800; k++) {
        var x0 = D0.a + (D0.b - D0.a) * k / 800, v0 = D0.u0(x0), x = x0 + (st.eq === 'burgers' ? v0 : 1) * tNum, v = v0;
        if (st.eq === 'burgers' && (st.dato === 'salto' || st.dato === 'rarefazione')) { x = x0; v = burgersRiemann(st.dato, x0, tNum); }
        if (D0.per) x = D0.a + (((x - D0.a) % (D0.b - D0.a)) + (D0.b - D0.a)) % (D0.b - D0.a);
        if (su && Math.abs(x - xp) > (D0.b - D0.a) / 2) su = false;
        if (!su) { q.moveTo(X0(x), Y0(v)); su = true; } else q.lineTo(X0(x), Y0(v)); xp = x;
      }
      q.stroke(); q.setLineDash([]);
      q.strokeStyle = '#5eead4'; q.lineWidth = 2.5; q.beginPath();
      for (i = 0; i < U.length; i++) { var X1 = X0(D0.a + (i + 0.5) * dx), Y1 = Y0(U[i]); if (i) q.lineTo(X1, Y1); else q.moveTo(X1, Y1); }
      q.stroke(); q.lineWidth = 1;
      q.textAlign = 'left'; q.font = '12px system-ui,sans-serif'; q.fillStyle = '#cfe3f7'; q.fillText('t = ' + tNum.toFixed(3) + (isFinite(ts) && st.eq === 'burgers' ? '   t* = ' + ts.toFixed(3) + (tNum >= ts ? t('  (urto formato)', '  (shock formed)') : '') : ''), 10, 14);
      q.fillStyle = '#ffd24a'; q.fillText(st.eq === 'burgers' ? t('caratteristiche', 'characteristics') : t('esatta u₀(x − t)', 'exact u₀(x − t)'), 10, H - 8); q.fillStyle = '#5eead4'; q.fillText(st.eq === 'burgers' ? 'Godunov' : 'upwind', 150, H - 8);
      var mEl = info.querySelector('[data-massa]'); if (mEl) mEl.textContent = fmt(somma(U) * dx);
      ca.setAttribute('aria-label', (st.eq === 'burgers' ? t('Equazione di Burgers', 'Burgers equation') : t('Equazione del trasporto', 'Transport equation')) + ', t = ' + tNum.toFixed(3));
      if (tNum >= D0.tmax - 1e-9) return false;
    }, { ricomincia: function () { var c = celle(st.dato, st.N); U = c.u; tNum = 0; } });
  }

  F.sezione('smatedp', {
    titolo: ['🌊 Equazioni alle derivate parziali', '🌊 Partial differential equations'],
    sotto: ['Onde, calore, Laplace e trasporto: ogni equazione risolta in due modi indipendenti (formula o serie di Fourier contro metodo numerico), con le superfici della membrana, della lastra che si raffredda e del potenziale in 3D.', 'Waves, heat, Laplace and transport: each equation solved in two independent ways (formula or Fourier series against a numerical method), with the surfaces of the membrane, the cooling plate and the potential in 3D.'],
    schede: [
      { nome: ['🎸 Corda', '🎸 String'], costruisci: schedaCorda },
      { nome: ['🥁 Membrana 3D', '🥁 Membrane 3D'], costruisci: scheda3d(schedaMembrana) },
      { nome: ['🔥 Calore 1D', '🔥 Heat 1D'], costruisci: schedaCalore1D },
      { nome: ['♨️ Calore 2D in 3D', '♨️ 2D heat in 3D'], costruisci: scheda3d(schedaCalore2D) },
      { nome: ['⚡ Laplace 3D', '⚡ Laplace 3D'], costruisci: scheda3d(schedaLaplace) },
      { nome: ['🌊 Trasporto e Burgers', '🌊 Transport and Burgers'], costruisci: schedaBurgers }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
