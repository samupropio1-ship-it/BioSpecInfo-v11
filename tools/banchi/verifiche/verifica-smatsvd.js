// verifica di F.calcolo.svd contro valori noti e metodi indipendenti
const C = require('./carica.js')(['bsi-mat-svd.js']);
const V = C.svd;
let ok = 0, ko = 0;
function chk(nome, val, atteso, tol) { const p = Math.abs(val - atteso) <= tol; p ? ok++ : ko++; console.log((p ? 'OK ' : 'KO ') + nome + ': ' + val + ' (atteso ' + atteso + ' ± ' + tol + ')'); }
function vero(nome, c, det) { c ? ok++ : ko++; console.log((c ? 'OK ' : 'KO ') + nome + (det ? ' — ' + det : '')); }
const I = V.identita, T = V.trasposta, P = V.prodotto, Fr = V.frobenius, Df = V.differenza;
const r = V.mulberry32(17), casuale = (m, n) => Array.from({ length: m }, () => Array.from({ length: n }, () => 2 * r() - 1));

// ── la SVD di Jacobi ──
(function () {
  let mr = 0, mu = 0, mv = 0, me = 0;
  [[2, 2], [3, 3], [5, 3], [8, 6], [3, 7], [12, 12]].forEach(([m, n]) => {
    const A = casuale(m, n), R = V.svd(A), k = Math.min(m, n);
    mr = Math.max(mr, Fr(Df(A, V.ricomponi(R))) / Fr(A));
    const Uk = R.U.map(row => row.slice(0, k)), Vk = R.V.map(row => row.slice(0, k));
    mu = Math.max(mu, Fr(Df(P(T(Uk), Uk), I(k)))); mv = Math.max(mv, Fr(Df(P(T(Vk), Vk), I(k))));
    // metodo indipendente: σ² = autovalori di AᵀA (o AAᵀ) con Jacobi simmetrico a due lati
    const G = m >= n ? P(T(A), A) : P(A, T(A)), E = V.autoSimmetrica(G);
    for (let i = 0; i < k; i++) me = Math.max(me, Math.abs(R.S[i] - Math.sqrt(Math.max(0, E.valori[i]))));
  });
  chk('6 matrici casuali (fino a 12×12, anche m < n): ‖A − UΣVᵀ‖/‖A‖', mr, 0, 1e-13);
  chk('UᵀU = I', mu, 0, 1e-12); chk('VᵀV = I', mv, 0, 1e-12);
  chk('σ (Jacobi a un lato) = √autovalori di AᵀA (Jacobi simmetrico)', me, 0, 1e-12);
})();
(function () {
  const A = [[3, 0], [4, 5]], R = V.svd(A); // σ = √45, √5
  chk('[[3,0],[4,5]]: σ₁ = 3√5', R.S[0], 3 * Math.sqrt(5), 1e-14); chk('[[3,0],[4,5]]: σ₂ = √5', R.S[1], Math.sqrt(5), 1e-14);
  const B = [[1, 1], [0, 1]], Rb = V.svd(B); chk('taglio [[1,1],[0,1]]: σ₁ = sezione aurea φ', Rb.S[0], (1 + Math.sqrt(5)) / 2, 1e-14); chk('taglio: σ₂ = 1/φ', Rb.S[1], 2 / (1 + Math.sqrt(5)), 1e-14);
  const Rot = [[0.6, -0.8], [0.8, 0.6]], Rr = V.svd(Rot); chk('rotazione: σ₁ = σ₂ = 1', Math.abs(Rr.S[0] - 1) + Math.abs(Rr.S[1] - 1), 0, 1e-14);
})();
(function () {
  const A = [[2.2, 0.8, 0.3], [0.4, 1.4, 0.5], [-0.3, 0.6, 0.8]], G = V.svdGeometrica(A);
  chk('3×3: σ₁σ₂σ₃ = |det A|', G.S[0] * G.S[1] * G.S[2], Math.abs(V.det3(A)), 1e-13);
  chk('3×3: V è una rotazione (det = +1)', V.det3(G.V), 1, 1e-12); chk('3×3: U′ è una rotazione', V.det3(G.Urot), 1, 1e-12);
  const Rf = V.svdGeometrica([[0, 1.5, 0], [1, 0, 0], [0, 0, 0.7]]); vero('scambio di assi (det < 0): riconosciuta la riflessione', Rf.riflessione);
  chk('scambio di assi: σ = 1,5; 1; 0,7', Math.abs(Rf.S[0] - 1.5) + Math.abs(Rf.S[1] - 1) + Math.abs(Rf.S[2] - 0.7), 0, 1e-14);
  const Rk = V.svd([[1, 2, 0.5], [0.5, 1, 0.25], [1.5, 0.2, 1]]); chk('rango 2: σ₃ = 0', Rk.S[2], 0, 1e-14);
  // geometria: max ‖Ax‖ sul cerchio unitario = σ₁, min = σ₂ (campionamento indipendente)
  const B = [[2, 1], [0.5, 1.5]], Rb = V.svd(B); let mx = 0, mn = Infinity; for (let k = 0; k < 200000; k++) { const a = 2 * Math.PI * k / 200000, x = [Math.cos(a), Math.sin(a)], y = [B[0][0] * x[0] + B[0][1] * x[1], B[1][0] * x[0] + B[1][1] * x[1]], L = Math.hypot(y[0], y[1]); mx = Math.max(mx, L); mn = Math.min(mn, L); }
  chk('max ‖Ax‖ sul cerchio = σ₁ (campionato)', mx, Rb.S[0], 1e-9); chk('min ‖Ax‖ sul cerchio = σ₂ (campionato)', mn, Rb.S[1], 1e-9);
})();

// ── compressione ──
(function () {
  const A = V.immagineSintetica(96, 128), Rt = V.svd(T(A)), R = { U: Rt.V, S: Rt.S, V: Rt.U }, E = V.erroriRango(A, R);
  let m = 0; for (let k = 0; k <= 96; k++) m = Math.max(m, Math.abs(E.misurato[k] - E.teorico[k]));
  chk('Eckart–Young (Frobenius): errore misurato = √(Σ_{i>k} σ²)/‖A‖ per k = 0…96', m, 0, 1e-10);
  chk('k = 96: ricostruzione esatta', E.misurato[96], 0, 1e-12);
  chk('‖A‖_F² = Σσ²', Math.sqrt(R.S.reduce((s, v) => s + v * v, 0)), Fr(A), 1e-10);
  // norma 2 dell'errore di rango 10 = σ₁₁ (metodo delle potenze su EᵀE)
  const A10 = V.ricomponi(R, 10), Er = Df(A, A10), EtE = P(T(Er), Er); let v = Array.from({ length: 128 }, (_, i) => 1 + Math.sin(i)); let l = 0;
  for (let it = 0; it < 3000; it++) { const w = EtE.map(row => row.reduce((s, a, j) => s + a * v[j], 0)), nw = Math.hypot(...w); l = nw / Math.hypot(...v); v = w.map(x => x / nw); }
  chk('Eckart–Young (norma 2): ‖A − A₁₀‖₂ = σ₁₁', Math.sqrt(l), R.S[10], 1e-6 * R.S[10]);
  // ottimalita': un'altra approssimazione di rango 10 (proiezione sulle prime 10 colonne di A ortonormalizzate) fa peggio
  const cols = []; for (let j = 0; j < 128 && cols.length < 10; j += 13) { let c = A.map(row => row[j]); cols.forEach(q => { const d = c.reduce((s, x, i) => s + x * q[i], 0); c = c.map((x, i) => x - d * q[i]); }); const n = Math.hypot(...c); if (n > 1e-8) cols.push(c.map(x => x / n)); }
  const Q = A.map((_, i) => cols.map(q => q[i])), Pr = P(Q, P(T(Q), A));
  vero('un’altra matrice di rango 10 ha errore maggiore di A₁₀', Fr(Df(A, Pr)) > Fr(Er), (Fr(Df(A, Pr)) / Fr(A)).toFixed(4) + ' > ' + (Fr(Er) / Fr(A)).toFixed(4));
})();

// ── PCA ──
(function () {
  const Rm = V.rotazioneEuler(0.6, 0.9), Pn = V.nuvola(20000, [1.6, 0.8, 0.25], Rm, 4), C = V.pca(Pn), E = V.autoSimmetrica(V.covarianza(Pn));
  let m = 0; for (let i = 0; i < 3; i++) m = Math.max(m, Math.abs(C.dev[i] * C.dev[i] - E.valori[i]));
  chk('PCA: σ_i²/(n−1) (SVD dei dati) = autovalori della covarianza', m, 0, 1e-10);
  let mc = 0; for (let i = 0; i < 3; i++) mc = Math.max(mc, 1 - Math.abs(C.assi[i].reduce((s, a, k) => s + a * E.vettori[i][k], 0))); chk('PCA: assi SVD = autovettori della covarianza', mc, 0, 1e-10);
  chk('PCA: deviazione lungo il 1º asse ≈ 1,6 (20 000 punti)', C.dev[0], 1.6, 0.03); chk('PCA: deviazione lungo il 3º asse ≈ 0,25', C.dev[2], 0.25, 0.006);
  const vero1 = [Rm[0][0], Rm[1][0], Rm[2][0]]; chk('PCA: il 1º asse coincide con quello vero (|cos|)', Math.abs(C.assi[0].reduce((s, a, k) => s + a * vero1[k], 0)), 1, 2e-4);
  chk('varianza spiegata: somma = 1', C.spiegata.reduce((a, b) => a + b, 0), 1, 1e-14);
})();

// ── minimi quadrati ──
(function () {
  const xs = Array.from({ length: 40 }, (_, i) => i / 39);
  const A3 = V.vandermonde(xs, 3), b3 = xs.map(x => 2 - x + 0.5 * x * x - 3 * x * x * x), q = V.minimiQuadratiQR(A3, b3), n = V.minimiQuadratiNormali(A3, b3);
  chk('grado 3, dati esatti: QR ritrova i coefficienti', Math.max(...q.map((v, i) => Math.abs(v - [2, -1, 0.5, -3][i]))), 0, 1e-12);
  chk('grado 3: equazioni normali uguali (ben condizionato)', Math.max(...n.map((v, i) => Math.abs(v - q[i]))), 0, 1e-9);
  // retta di regressione: formula chiusa (covarianza/varianza)
  const ys = xs.map((x, i) => 1 + 2 * x + Math.sin(7 * i)), A1 = V.vandermonde(xs, 1), c1 = V.minimiQuadratiQR(A1, ys); const mx = xs.reduce((a, b) => a + b) / 40, my = ys.reduce((a, b) => a + b) / 40; let sxy = 0, sxx = 0; xs.forEach((x, i) => { sxy += (x - mx) * (ys[i] - my); sxx += (x - mx) ** 2; });
  chk('regressione lineare: pendenza QR = cov(x,y)/var(x)', c1[1], sxy / sxx, 1e-12);
  const A12 = V.vandermonde(xs, 12), b12 = A12.map(r => r.reduce((s, v) => s + v, 0)), x12 = V.minimiQuadratiQR(A12, b12), n12 = V.minimiQuadratiNormali(A12, b12);
  const eq = Math.max(...x12.map(v => Math.abs(v - 1))), en = n12 ? Math.max(...n12.map(v => Math.abs(v - 1))) : Infinity;
  vero('grado 12: QR molto più accurato delle equazioni normali', eq < 1e-3 && en > 100 * eq, 'QR ' + eq.toExponential(2) + ', normali ' + (isFinite(en) ? en.toExponential(2) : 'Cholesky fallisce'));
})();
// ── Hilbert ──
(function () {
  for (const n of [2, 3, 4, 5, 6]) chk('κ₂(H' + n + ') con la SVD', V.numeroCondizione(V.hilbert(n)), V.KAPPA_HILBERT[n], V.KAPPA_HILBERT[n] * 1e-8);
  const H5 = V.hilbert(5), B5 = V.hilbertInversa(5), Pr = P(H5, B5);
  chk('inversa esatta a interi: H₅·H₅⁻¹ = I', Fr(Df(Pr, I(5))), 0, 1e-9);
  chk('H₅⁻¹ ha l’elemento (1,1) = 25 e (5,5) = 44100', B5[0][0] + B5[4][4], 25 + 44100, 0);
  chk('κ₂(H₅) = ‖H₅‖₂·‖H₅⁻¹‖₂ (potenze sull’inversa esatta) vs SVD', V.norma2Potenze(H5) * V.norma2Potenze(B5), V.numeroCondizione(H5), 1e-5);
  const E = V.autoSimmetrica(H5); chk('κ₂(H₅) = λ_max/λ_min (Jacobi simmetrico)', E.valori[0] / E.valori[4], 476607.250242, 1e-3);
})();

console.log(ok + ' superati, ' + ko + ' falliti');
process.exit(ko ? 1 : 0);
