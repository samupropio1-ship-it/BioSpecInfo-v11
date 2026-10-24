// verifica di F.calcolo.inferenza contro valori noti e metodi indipendenti
const C = require('./carica.js')(['bsi-mat-inferenza.js']);
const I = C.inferenza;
let ok = 0, ko = 0;
function chk(nome, val, atteso, tol) { const p = Math.abs(val - atteso) <= tol; p ? ok++ : ko++; console.log((p ? 'OK ' : 'KO ') + nome + ': ' + val + ' (atteso ' + atteso + ' ± ' + tol + ')'); }

// 1. quantili t da tavola (inversione di F_t via beta incompleta)
chk('t0.975 nu=4', I.tInv(0.975, 4), 2.776, 5e-4);
chk('t0.975 nu=9', I.tInv(0.975, 9), 2.262, 5e-4);
chk('t0.975 nu=29', I.tInv(0.975, 29), 2.045, 5e-4);
chk('t0.995 nu=1 = tan(0.495 pi) (Cauchy)', I.tInv(0.995, 1), Math.tan(Math.PI * 0.495), 1e-8);
// 2. F_t in forma chiusa: nu = 1 Cauchy, nu = 2
chk('tCDF(1.7, 1) = 1/2 + atan/pi', I.tCDF(1.7, 1), 0.5 + Math.atan(1.7) / Math.PI, 1e-12);
chk('tCDF(-0.8, 2) = 1/2 + t/(2 sqrt(2+t^2))', I.tCDF(-0.8, 2), 0.5 + -0.8 / (2 * Math.sqrt(2 + 0.64)), 1e-12);
// 3. normale
chk('PhiInv(0.975)', I.PhiInv(0.975), 1.959963985, 1e-8);
chk('PhiInv(0.995)', I.PhiInv(0.995), 2.575829304, 1e-8);
// Phi contro integrazione di Simpson della densità (metodo indipendente)
(function () { const z = 1.3, N = 2000, a = 0; let s = 0; for (let i = 0; i <= N; i++) { const x = a + (z - a) * i / N, w = (i === 0 || i === N) ? 1 : (i % 2 ? 4 : 2); s += w * Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI); } chk('Phi(1.3) vs Simpson', I.Phi(1.3), 0.5 + s * (z - a) / N / 3, 1e-12); })();
chk('Phi(-4) coda (frazione continua)', I.Phi(-4), 3.167124183311992e-5, 1e-15);
chk('lnGamma(10) = ln 9!', I.lnGamma(10), Math.log(362880), 1e-10);
// 4. copertura degli intervalli
const covT = I.copertura(50, 10, 5, 0.95, 't', 20000, 3);
chk('copertura t, n=5, 95% (20000 rip.)', covT, 0.95, 0.005);
const covZ = I.copertura(50, 10, 10, 0.90, 'z', 20000, 4);
chk('copertura z sigma nota, n=10, 90%', covZ, 0.90, 0.007);
const covZs = I.copertura(50, 10, 5, 0.95, 'zs', 20000, 5), attZs = 2 * I.tCDF(1.959963985, 4) - 1;
chk('copertura z con s, n=5 vs 2F_t4(1.96)-1 = ' + attZs.toFixed(4), covZs, attZs, 0.007);
// 5. potenza: formula vs simulazione, p uniformi sotto H0
const P0 = I.simulaP(0, 20, 20000, 2, 7); let r0 = 0; for (const p of P0) if (p < 0.05) r0++;
chk('P(p<0.05 | H0)', r0 / P0.length, 0.05, 0.005);
const D = I.ksUniforme(P0); chk('KS p sotto H0 < 1.36/sqrt(N)', D < 1.36 / Math.sqrt(P0.length) ? 1 : 0, 1, 0); console.log('   D = ' + D.toFixed(5));
const pw = I.potenza(0.5, 20, 0.05, 2), P1 = I.simulaP(0.5, 20, 20000, 2, 8); let r1 = 0; for (const p of P1) if (p < 0.05) r1++;
chk('potenza d=0.5 n=20 a=0.05 bil.: simulazione vs formula ' + pw.toFixed(4), r1 / P1.length, pw, 0.01);
const pw1 = I.potenza(0.3, 30, 0.05, 1), P2 = I.simulaP(0.3, 30, 20000, 1, 9); let r2 = 0; for (const p of P2) if (p < 0.05) r2++;
chk('potenza unilaterale d=0.3 n=30: simulazione vs formula ' + pw1.toFixed(4), r2 / P2.length, pw1, 0.01);
chk('potenza(d=0) = alfa', I.potenza(0, 25, 0.05, 2), 0.05, 1e-12);
// 6. Anscombe: le quattro serie
for (let k = 1; k <= 4; k++) {
  const A = I.anscombe(k), R = I.regressione(A.x, A.y);
  chk('Anscombe ' + k + ' media x', R.mx, 9, 1e-12);
  chk('Anscombe ' + k + ' var x', R.varx, 11, 1e-12);
  chk('Anscombe ' + k + ' media y', R.my, 7.50, 0.005);
  chk('Anscombe ' + k + ' var y', R.vary, 4.125, 0.005);
  chk('Anscombe ' + k + ' r', R.r, 0.816, 0.0015);
  chk('Anscombe ' + k + ' intercetta', R.a, 3.00, 0.005);
  chk('Anscombe ' + k + ' pendenza', R.b, 0.500, 0.0005);
  chk('Anscombe ' + k + ' R2 = r^2', R.R2, R.r * R.r, 1e-12);
}
// minimi quadrati: equazioni normali risolte con Cramer (metodo indipendente)
(function () { const A = I.anscombe(1), n = A.x.length; let Sx = 0, Sy = 0, Sxx = 0, Sxy = 0; for (let i = 0; i < n; i++) { Sx += A.x[i]; Sy += A.y[i]; Sxx += A.x[i] ** 2; Sxy += A.x[i] * A.y[i]; } const det = n * Sxx - Sx * Sx, b = (n * Sxy - Sx * Sy) / det, a = (Sy * Sxx - Sx * Sxy) / det, R = I.regressione(A.x, A.y); chk('pendenza vs equazioni normali', R.b, b, 1e-12); chk('intercetta vs equazioni normali', R.a, a, 1e-12); chk('somma dei residui = 0', R.residui.reduce((s, e) => s + e, 0), 0, 1e-12); chk('banda in x̄ = t s/sqrt(n)', R.banda(R.mx), I.tInv(0.975, n - 2) * R.s / Math.sqrt(n), 1e-12); })();
// 7. bootstrap
(function () {
  const x = I.DATI.asimm[1], n = x.length, m = I.media(x), sp = Math.sqrt(x.reduce((s, v) => s + (v - m) ** 2, 0) / n), B = I.bootstrap(x, 'media', 40000, 3);
  chk('media delle medie bootstrap = x̄', B.media, m, 3 * sp / Math.sqrt(n) / Math.sqrt(40000) * 1.5);
  chk('SE bootstrap della media = σ̂/√n (' + (sp / Math.sqrt(n)).toFixed(4) + ')', B.se, sp / Math.sqrt(n), 0.02 * sp / Math.sqrt(n));
  const y = I.DATI.anomalo[1], nn = y.length, Bm = I.bootstrap(y, 'mediana', 40000, 4), ord = y.slice().sort((a, b) => a - b);
  chk('mediane bootstrap tutte valori del campione', Bm.valori.every(v => y.indexOf(v) >= 0) ? 1 : 0, 1, 0);
  // P(med* <= x(k)) esatta (binomiale) contro la simulazione, k = 4
  const k = 4, sim = Bm.valori.filter(v => v <= ord[k - 1]).length / Bm.valori.length, es = I.medianaBootEsatta(nn, k);
  chk('P(med* <= x(4)) simulata vs binomiale esatta ' + es.toFixed(4), sim, es, 0.008);
  chk('medianaBootEsatta(n, n) = 1', I.medianaBootEsatta(nn, nn), 1, 1e-12);
  const S = I.DATI.simm[1], Bs = I.bootstrap(S, 'media', 20000, 6), tq = I.tInv(0.975, S.length - 1), h = tq * I.devst(S) / Math.sqrt(S.length);
  console.log('   simmetrici: percentile [' + Bs.lo.toFixed(4) + ', ' + Bs.hi.toFixed(4) + '] vs t [' + (I.media(S) - h).toFixed(4) + ', ' + (I.media(S) + h).toFixed(4) + ']');
  const att = 1.959964 / tq * Math.sqrt((S.length - 1) / S.length); chk('ampiezza percentile / t ≈ z0.975/t0.975,9 · √(9/10) = ' + att.toFixed(4), (Bs.hi - Bs.lo) / (2 * h), att, 0.03);
  chk('quantile tipo 7 su 1..5 a 0.3', I.quantile([1, 2, 3, 4, 5], 0.3), 2.2, 1e-12);
})();
console.log('\n' + ok + ' superati, ' + ko + ' falliti');
