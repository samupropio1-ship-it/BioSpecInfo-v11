// verifica di F.calcolo.edp contro valori noti, forme chiuse e metodi indipendenti
const C = require('./carica.js')(['bsi-mat-edp.js']);
const E = C.edp, PI = Math.PI;
let ok = 0, ko = 0;
function chk(nome, val, atteso, tol) { const p = Math.abs(val - atteso) <= tol; p ? ok++ : ko++; console.log((p ? 'OK ' : 'KO ') + nome + ': ' + val + ' (atteso ' + atteso + ' ± ' + tol + ')'); }
function vero(nome, c, det) { c ? ok++ : ko++; console.log((c ? 'OK ' : 'KO ') + nome + (det ? ' — ' + det : '')); }

// ── Bessel ──
chk('J₀(1) (tabelle: 0,7651976865579666)', E.besselJ(0, 1), 0.7651976865579666, 1e-14);
chk('J₁(1) (tabelle: 0,4400505857449335)', E.besselJ(1, 1), 0.4400505857449335, 1e-14);
(function () { let m = 0; for (let n = 0; n <= 4; n++) for (let x = 0.3; x < 12; x += 0.7) m = Math.max(m, Math.abs(E.besselJ(n, x) - E.besselJSerie(n, x))); chk('J_n integrale vs serie di potenze (n ≤ 4, x < 12), max scarto', m, 0, 1e-11); })();
chk('j₀₁ = 2,404825557695773', E.zeroBessel(0, 1), 2.404825557695773, 1e-12);
chk('j₁₁ = 3,831705970207512', E.zeroBessel(1, 1), 3.831705970207512, 1e-12);
chk('j₂₁ = 5,135622301840683', E.zeroBessel(2, 1), 5.135622301840683, 1e-12);
chk('j₀₂ = 5,520078110286311', E.zeroBessel(0, 2), 5.520078110286311, 1e-12);
chk('j₁₂ = 7,015586669815619', E.zeroBessel(1, 2), 7.015586669815619, 1e-12);
chk('j₃₁ = 6,380161895923983', E.zeroBessel(3, 1), 6.380161895923983, 1e-12);
chk('j₃₃ = 13,015200721698434', E.zeroBessel(3, 3), 13.015200721698434, 1e-11);
(function () { let m = 0, ord = true; for (let n = 0; n <= 3; n++) { let prec = 0; for (let k = 1; k <= 3; k++) { const z = E.zeroBessel(n, k); m = Math.max(m, Math.abs(E.besselJSerie(n, z))); if (!(z > prec + 1)) ord = false; prec = z; } } chk('12 zeri: |J_m(j_mk)| con la serie (metodo indipendente)', m, 0, 1e-12); vero('zeri ordinati e distinti (nessuno saltato)', ord); })();
chk('tamburo: ω₁₁/ω₀₁ = j₁₁/j₀₁ = 1,5933', E.omegaCerchio(1, 1) / E.omegaCerchio(0, 1), 3.831705970207512 / 2.404825557695773, 1e-12);
chk('quadrato: ω₁₂ = ω₂₁ (degeneri) e ω₁₂/ω₁₁ = √(5/2)', E.omegaQuadrato(1, 2) / E.omegaQuadrato(1, 1), Math.sqrt(2.5), 1e-14);

// ── corda ──
const p = 0.3, f = x => x < p ? x / p : (1 - x) / (1 - p);
(function () {
  const bE = E.coeffPizzicata(1, p, 1, 30), bN = E.coeffSeno(f, 1, 30, 6000); let m = 0; for (let k = 0; k < 30; k++) m = Math.max(m, Math.abs(bE[k] - bN[k]));
  chk('b_n pizzicata: forma chiusa vs Simpson (30 coefficienti)', m, 0, 1e-6);
  const b = E.coeffPizzicata(1, p, 1, 3000); let d = 0;
  for (const tt of [0.13, 0.37, 0.81, 1.55]) for (let x = 0.01; x < 1; x += 0.02) d = Math.max(d, Math.abs(E.serieCorda(b, 1, 1, x, tt) - E.dalembert(f, 1, 1, x, tt)));
  chk('d’Alembert vs Fourier (3000 modi) a quattro istanti, max scarto', d, 0, 2e-4);
  chk('energia pizzicata: ½c²h²(1/p + 1/(1−p)) vs (L/4)Σb_n²ω_n² (40000 modi)', E.energiaModi(E.coeffPizzicata(1, p, 1, 40000), 1, 1, 0).tot, E.energiaPizzicata(1, p, 1, 1), 2e-4);
  let mp = 0; for (let x = 0.05; x < 1; x += 0.05) mp = Math.max(mp, Math.abs(E.dalembert(f, 1, 1, x, 2) - f(x)), Math.abs(E.dalembert(f, 1, 1, x, 1) + f(1 - x)));
  chk('periodo 2L/c: u(x,2) = f(x) e mezzo periodo u(x,1) = −f(1−x)', mp, 0, 1e-12);
})();
(function () {
  const g = x => Math.exp(-Math.pow((x - 0.35) / 0.06, 2)), u = (x, tt) => E.dalembert(g, 1, 1, x, tt), E0 = E.energiaNumerica(u, 1, 1, 0, 8000); let m = 0;
  for (const tt of [0.1, 0.27, 0.5, 0.66, 0.9, 1.3]) m = Math.max(m, Math.abs(E.energiaNumerica(u, 1, 1, tt, 8000) - E0) / E0);
  chk('impulso gaussiano: energia integrata costante nel tempo (scarto relativo max)', m, 0, 1e-4);
  const b = E.coeffSeno(g, 1, 300, 8000), em = E.energiaModi(b, 1, 1, 0.37);
  chk('energia dei modi = energia integrata; cin + pot costante', em.tot, E0, 1e-4 * E0);
})();

// ── calore 1D ──
(function () {
  const b = E.coeffForma1D('parabola', 200), bN = E.coeffSeno(x => 4 * x * (1 - x), 1, 200, 4000); let m = 0; for (let k = 0; k < 200; k++) m = Math.max(m, Math.abs(b[k] - bN[k]));
  chk('parabola: 32/(n³π³) vs Simpson', m, 0, 1e-10);
  const bt = E.coeffForma1D('tenda', 60), btN = E.coeffSeno(x => x < 0.5 ? 2 * x : 2 - 2 * x, 1, 60, 8000); m = 0; for (let k = 0; k < 60; k++) m = Math.max(m, Math.abs(bt[k] - btN[k]));
  chk('tenda: 8/(n²π²) sin(nπ/2) vs Simpson', m, 0, 1e-8);
  const c40 = E.confrontaCalore1D('parabola', 40, 0.4, 0.1, 10, 200), c80 = E.confrontaCalore1D('parabola', 80, 0.4, 0.1, 10, 200);
  const e40 = c40.err[c40.err.length - 1], e80 = c80.err[c80.err.length - 1];
  vero('FTCS stabile (r = 0,4): errore a t = 0,1 piccolo', e80 < 1e-4, 'N=40: ' + e40.toExponential(3) + ', N=80: ' + e80.toExponential(3));
  chk('FTCS: ordine 2 in Δx (rapporto degli errori ≈ 4)', e40 / e80, 4, 0.4);
  const inst = E.confrontaCalore1D('impulso', 40, 0.6, 0.1, 10, 200);
  vero('FTCS instabile per r = 0,6 > ½', inst.err[inst.err.length - 1] > 1e3, 'errore finale ' + inst.err[inst.err.length - 1].toExponential(2));
  // un solo modo: decade come e^(−π²t)
  let u = new Float64Array(201); for (let i = 0; i <= 200; i++) u[i] = Math.sin(PI * i / 200); const r = 0.25, dt = r / 40000, n = 4000;
  for (let k = 0; k < n; k++) u = E.ftcs1D(u, r);
  chk('modo fondamentale: −ln(u(½,t)/u(½,0))/t = π²', -Math.log(u[100]) / (n * dt), PI * PI, 2e-3);
})();

// ── calore 2D ──
(function () {
  const M = 40, r = 0.24, dt = r / (M * M); let u = E.iniziale2D('quadrato', M); const n = Math.round(0.03 / dt);
  for (let k = 0; k < n; k++) u = E.calore2DPasso(u, M, r);
  const fd = u[20 * 41 + 20], se = E.calore2DSerie('quadrato', 0.5, 0.5, n * dt, 80);
  chk('calore 2D: centro FD vs serie doppia a t ≈ 0,03', fd, se, 3e-3);
  let mx = 0, mn = 0; for (let i = 0; i < u.length; i++) { mx = Math.max(mx, u[i]); mn = Math.min(mn, u[i]); }
  vero('calore 2D: principio del massimo (0 ≤ u ≤ 1)', mx <= 1 + 1e-12 && mn >= -1e-12, 'max ' + mx.toFixed(4));
})();

// ── Laplace ──
(function () {
  chk('Laplace, bordo 1: u(½,½) = ¼ dalla serie', E.laplaceSerie('costante', 0.5, 0.5, 2000), 0.25, 1e-12);
  const N = 29, R = E.laplaceRisolvi(N, 'costante', 'sor', E.omegaOttimale(N), 1e-12, 50000), K = N + 2;
  chk('Laplace, bordo 1: u(½,½) = ¼ da SOR (simmetria discreta)', R.u[15 + K * 15], 0.25, 1e-9);
  function errSeno(N) { const R = E.laplaceRisolvi(N, 'seno', 'sor', E.omegaOttimale(N), 1e-13, 50000), K = N + 2; let m = 0; for (let j = 1; j <= N; j++) for (let i = 1; i <= N; i++) m = Math.max(m, Math.abs(R.u[i + K * j] - Math.sin(PI * i / (N + 1)) * Math.sinh(PI * j / (N + 1)) / Math.sinh(PI))); return m; }
  const e1 = errSeno(15), e2 = errSeno(31);
  chk('Laplace sin πx: errore discreto O(h²) (rapporto h → h/2 ≈ 4)', e1 / e2, 4, 0.3);
  // tassi di convergenza misurati vs teorici
  function tasso(m, w) { const s = E.laplaceRisolvi(N, 'seno', m, w, 1e-9, 50000).storia, n = s.length - 1; return Math.pow(10, (s[n] - s[Math.floor(n / 2)]) / (n - Math.floor(n / 2))); }
  chk('Jacobi: raggio spettrale misurato = cos πh', tasso('jacobi', 1), E.raggioJacobi(N), 2e-4);
  chk('Gauss–Seidel: raggio spettrale misurato = cos² πh', tasso('gs', 1), Math.pow(E.raggioJacobi(N), 2), 3e-4);
  const ij = E.laplaceRisolvi(N, 'costante', 'jacobi', 1, 1e-6).iter, ig = E.laplaceRisolvi(N, 'costante', 'gs', 1, 1e-6).iter, is = E.laplaceRisolvi(N, 'costante', 'sor', E.omegaOttimale(N), 1e-6).iter;
  chk('Jacobi richiede ≈ il doppio delle iterazioni di Gauss–Seidel', ij / ig, 2, 0.15); console.log('   iterazioni: Jacobi ' + ij + ', GS ' + ig + ', SOR ' + is);
  vero('SOR(ω_ott) almeno 10 volte più veloce di GS', ig / is > 10);
  let best = [0, Infinity]; for (let w = 1.70; w < 1.99; w += 0.005) { const n = E.laplaceRisolvi(N, 'costante', 'sor', w, 1e-6).iter; if (n < best[1]) best = [w, n]; }
  chk('il minimo misurato delle iterazioni SOR cade vicino a ω_ott = 2/(1+sin πh)', best[0], E.omegaOttimale(N), 0.03); console.log('   ω migliore ' + best[0].toFixed(3) + ' (' + best[1] + ' iter.), ω_ott ' + E.omegaOttimale(N).toFixed(4));
  let mx = -1, mn = 2; for (let j = 1; j <= N; j++) for (let i = 1; i <= N; i++) { mx = Math.max(mx, R.u[i + K * j]); mn = Math.min(mn, R.u[i + K * j]); }
  vero('principio del massimo discreto: 0 < u < 1 all’interno', mn > 0 && mx < 1);
})();

// ── trasporto e Burgers ──
(function () {
  const D = E.DATI;
  chk('t* gaussiana: −1/min u₀′ = √e/√2', E.tStarFormula(D.gauss.u0, -3, 7, 40000), Math.sqrt(Math.E / 2), 1e-6);
  chk('t* gaussiana: incrocio delle caratteristiche vs formula', E.tStarIncrocio(D.gauss.u0, -3, 7, 40000), Math.sqrt(Math.E / 2), 1e-6);
  chk('t* per sin x = 1', E.tStarFormula(D.seno.u0, 0, 2 * PI, 40000), 1, 1e-6);
  // Godunov: urto 1 → 0 a velocità ½
  let c = E.celle('salto', 1200), u = c.u; const dx = c.dx; let tt = 0; while (tt < 3 - 1e-12) { const dt = Math.min(0.5 * dx, 3 - tt); u = E.godunovPasso(u, dx, dt, false); tt += dt; }
  let pos = 0; for (let i = 0; i < u.length - 1; i++) if (u[i] >= 0.5 && u[i + 1] < 0.5) pos = -2 + (i + 1) * dx;
  chk('Godunov: urto in x = t/2 a t = 3 (Rankine–Hugoniot)', pos, 1.5, 2 * dx);
  // rarefazione: u = x/t
  c = E.celle('rarefazione', 1200); u = c.u; tt = 0; while (tt < 2 - 1e-12) { const dt = Math.min(0.5 * dx, 2 - tt); u = E.godunovPasso(u, dx, dt, false); tt += dt; }
  let m = 0; for (let i = 0; i < u.length; i++) { const x = -2 + (i + 0.5) * dx; if (x > 0.3 && x < 1.7) m = Math.max(m, Math.abs(u[i] - E.burgersRiemann('rarefazione', x, 2))); }
  chk('Godunov: ventaglio di rarefazione u = x/t (scarto max)', m, 0, 0.02);
  // conservazione della massa nel caso periodico, anche dopo l'urto
  c = E.celle('seno', 600); u = c.u; const m0 = u.reduce((a, b) => a + b, 0); tt = 0; while (tt < 2.5) { u = E.godunovPasso(u, c.dx, 0.8 * c.dx, true); tt += 0.8 * c.dx; }
  chk('Godunov periodico: Σu conservata dopo l’urto', u.reduce((a, b) => a + b, 0), m0, 1e-9);
  // upwind con ν = 1 e' una traslazione esatta
  c = E.celle('gauss', 500); u = c.u; for (let k = 0; k < 100; k++) u = E.upwindPasso(u, 1, false); let d = 0; for (let i = 100; i < u.length; i++) { const x = -3 + (i + 0.5) * c.dx; d = Math.max(d, Math.abs(u[i] - Math.exp(-Math.pow(x - 100 * c.dx, 2)))); }
  chk('upwind ν = 1: traslazione esatta di 100 celle (celle raggiunte dal dato)', d, 0, 1e-12);
  c = E.celle('gauss', 500); u = c.u; for (let k = 0; k < 200; k++) u = E.upwindPasso(u, 0.5, false); let mxu = 0; for (let i = 0; i < u.length; i++) mxu = Math.max(mxu, u[i]);
  vero('upwind ν = ½: diffusione numerica abbassa il picco', mxu < 0.99, 'picco ' + mxu.toFixed(4));
})();

chk('serie 2D veloce (coefficienti in memoria) = serie diretta', E.calore2DSerieVeloce('due', 0.37, 0.61, 0.01, 40), E.calore2DSerie('due', 0.37, 0.61, 0.01, 40), 1e-12);
console.log(ok + ' superati, ' + ko + ' falliti');
process.exit(ko ? 1 : 0);
