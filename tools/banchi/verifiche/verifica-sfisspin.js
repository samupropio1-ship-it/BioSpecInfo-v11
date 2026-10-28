/* verifica di bsi-fis-spin.js (F.calcolo.spin) */
var C = require('./carica.js')(['bsi-fis-spin.js']), S = C.spin;
var n = 0, ko = 0;
function ok(nome, val, cond) { n++; if (!cond) ko++; console.log((cond ? 'OK  ' : 'KO  ') + nome + ' → ' + val); }
var P = S.PORTE, PI = Math.PI;

/* 1. identita' delle porte */
var HZH = S.mm(S.mm(P.H, P.Z), P.H);
ok('HZH = X (esatta)', S.distanza(HZH, P.X, false).toExponential(2), S.distanza(HZH, P.X, false) < 1e-14);
ok('HXH = Z (esatta)', S.distanza(S.mm(S.mm(P.H, P.X), P.H), P.Z, false).toExponential(2), S.distanza(S.mm(S.mm(P.H, P.X), P.H), P.Z, false) < 1e-14);
ok('S² = Z', S.distanza(S.mm(P.S, P.S), P.Z, false).toExponential(2), S.distanza(S.mm(P.S, P.S), P.Z, false) < 1e-14);
ok('T² = S', S.distanza(S.mm(P.T, P.T), P.S, false).toExponential(2), S.distanza(S.mm(P.T, P.T), P.S, false) < 1e-14);
ok('H² = I, X² = Y² = Z² = I', [P.H, P.X, P.Y, P.Z].map(function (U) { return S.distanza(S.mm(U, U), P.I, false); }).reduce(function (a, b) { return Math.max(a, b); }).toExponential(2), [P.H, P.X, P.Y, P.Z].every(function (U) { return S.distanza(S.mm(U, U), P.I, false) < 1e-14; }));
ok('XY = iZ (algebra di Pauli)', S.distanza(S.mm(P.X, P.Y), [[[0, 1], [0, 0]], [[0, 0], [0, -1]]], false).toExponential(2), S.distanza(S.mm(P.X, P.Y), [[[0, 1], [0, 0]], [[0, 0], [0, -1]]], false) < 1e-14);
ok('Rz(π/2) = S a meno di una fase globale', S.distanza(S.Rz(PI / 2), P.S, true).toExponential(2), S.distanza(S.Rz(PI / 2), P.S, true) < 1e-14);
ok('Rx(π) = −iX (fase globale)', S.distanza(S.Rx(PI), P.X, true).toExponential(2), S.distanza(S.Rx(PI), P.X, true) < 1e-14);

/* 2. sfera di Bloch: norma, rotazioni contro la formula di Rodrigues */
var rnd = S.mulberry32(42), maxN = 0, maxR = 0, nomi = Object.keys(P);
for (var k = 0; k < 2000; k++) {
  var psi = S.statoDa(Math.acos(2 * rnd() - 1), 2 * PI * rnd()), U;
  var c = rnd(); U = c < 0.25 ? S.Rx(6 * rnd()) : c < 0.5 ? S.Ry(6 * rnd()) : c < 0.75 ? S.Rz(6 * rnd()) : P[nomi[Math.floor(rnd() * nomi.length)]];
  var b0 = S.bloch(psi), b1 = S.bloch(S.applica(U, psi)), aa = S.asseAngolo(U), br = S.ruota(b0, aa.n, aa.angolo);
  maxN = Math.max(maxN, Math.abs(Math.hypot(b1[0], b1[1], b1[2]) - 1));
  maxR = Math.max(maxR, Math.hypot(br[0] - b1[0], br[1] - b1[1], br[2] - b1[2]));
}
ok('|Bloch| = 1 dopo 2000 porte a caso', maxN.toExponential(2), maxN < 1e-12);
ok('porta U = rotazione di Bloch (asse e angolo da U, Rodrigues)', maxR.toExponential(2), maxR < 1e-12);
var aH = S.asseAngolo(P.H);
ok('H: mezzo giro intorno a (x+z)/√2', aH.angolo.toFixed(6) + ', n = ' + aH.n.map(function (x) { return x.toFixed(4); }).join(','), Math.abs(aH.angolo - PI) < 1e-12 && Math.abs(aH.n[0] - Math.SQRT1_2) < 1e-12 && Math.abs(aH.n[2] - Math.SQRT1_2) < 1e-12);
var aT = S.asseAngolo(P.T);
ok('T: rotazione di 45° intorno a z', (aT.angolo * 180 / PI).toFixed(6), Math.abs(aT.angolo - PI / 4) < 1e-12 && Math.abs(aT.n[2] - 1) < 1e-12);
/* Born: P(0) = cos²(θ/2), frequenza su 200 000 misure */
var th = 1.1, ps = S.statoDa(th, 0.7), r2 = S.mulberry32(9), n0 = 0, NM = 200000;
for (k = 0; k < NM; k++) if (S.misura(ps, r2).esito === 0) n0++;
var pAtt = Math.pow(Math.cos(th / 2), 2);
ok('misura: frequenza di 0 = cos²(θ/2) entro 3σ', (n0 / NM).toFixed(4) + ' vs ' + pAtt.toFixed(4), Math.abs(n0 / NM - pAtt) < 3 * Math.sqrt(pAtt * (1 - pAtt) / NM));

/* 3. Stern–Gerlach: cos²(Δθ/2) simulato */
[30, 60, 90, 120].forEach(function (d) {
  var mag = [{ th: 0, tieni: 1 }, { th: d, tieni: 1 }], N = 100000, c = S.sgSimula(mag, N, 7), f = c[1].piu / c[0].piu, p = Math.pow(Math.cos(d * PI / 360), 2);
  ok('SG z+ poi ' + d + '°: P(+) = cos²(Δθ/2)', f.toFixed(4) + ' vs ' + p.toFixed(4), Math.abs(f - p) < 3 * Math.sqrt(p * (1 - p) / c[0].piu) + 1e-9);
});
var zxz = S.sgAttesi([{ th: 0, tieni: 1 }, { th: 90, tieni: 1 }, { th: 0, tieni: 1 }]);
ok('z → x → z: al terzo magnete 1/4 su e 1/4 giù (atteso analitico)', zxz[2].piu + ', ' + zxz[2].meno, Math.abs(zxz[2].piu - 0.125) < 1e-12 && Math.abs(zxz[2].meno - 0.125) < 1e-12);
var zz = S.sgSimula([{ th: 0, tieni: 1 }, { th: 0, tieni: 1 }], 20000, 3);
ok('z → z: misura ripetuta, nessun giù', zz[1].meno, zz[1].meno === 0 && zz[1].piu === zz[0].piu);
var cs = S.sgSimula([{ th: 0, tieni: 1 }, { th: 90, tieni: 1 }, { th: 0, tieni: 1 }], 80000, 11);
ok('z → x → z simulato: 12,5 % e 12,5 % degli emessi', (cs[2].piu / 80000).toFixed(4) + ', ' + (cs[2].meno / 80000).toFixed(4), Math.abs(cs[2].piu / 80000 - 0.125) < 0.004 && Math.abs(cs[2].meno / 80000 - 0.125) < 0.004);

/* 4. CHSH */
var A = [0, PI / 2, PI / 4, 3 * PI / 4], Sq = S.chsh(S.Equant, A[0], A[1], A[2], A[3]);
ok('CHSH quantistico = 2√2 agli angoli di Tsirelson', Math.abs(Sq).toFixed(10), Math.abs(Math.abs(Sq) - 2 * Math.SQRT2) < 1e-12);
var Sl = S.chsh(S.Elocale, A[0], A[1], A[2], A[3]);
ok('modello locale agli stessi angoli: |S| = 2', Math.abs(Sl).toFixed(10), Math.abs(Math.abs(Sl) - 2) < 1e-12);
var maxL = 0, maxQ = 0; r2 = S.mulberry32(77);
for (k = 0; k < 200000; k++) { var g = [0, 0, 0, 0].map(function () { return 2 * PI * r2(); }); maxL = Math.max(maxL, Math.abs(S.chsh(S.Elocale, g[0], g[1], g[2], g[3]))); maxQ = Math.max(maxQ, Math.abs(S.chsh(S.Equant, g[0], g[1], g[2], g[3]))); }
ok('LHV ≤ 2 su 200 000 scelte di angoli; quantistico ≤ 2√2 (Tsirelson)', maxL.toFixed(6) + ', ' + maxQ.toFixed(6), maxL <= 2 + 1e-12 && maxQ <= 2 * Math.SQRT2 + 1e-12 && maxQ > 2.8);
ok('16 strategie deterministiche: max |S| = 2', S.chshDeterministico(), S.chshDeterministico() === 2);
var cc = S.chshSimula(A, 400000, 13), rq = S.chshDa(cc.q), rl = S.chshDa(cc.l);
ok('simulazione coppia per coppia: |S_Q| ≈ 2,828, |S_LHV| ≈ 2', Math.abs(rq.S).toFixed(4) + ', ' + Math.abs(rl.S).toFixed(4), Math.abs(Math.abs(rq.S) - 2 * Math.SQRT2) < 0.025 && Math.abs(Math.abs(rl.S) - 2) < 0.025);
/* il modello locale simulato riproduce la sua E lineare */
var cl = S.chshSimula([0, 0, PI / 3, PI / 3], 100000, 21), El = S.chshDa(cl.l).E[0];
ok('E_LHV(60°) simulata = −1 + 2/3', El.toFixed(4) + ' vs ' + (-1 / 3).toFixed(4), Math.abs(El + 1 / 3) < 0.015);

/* 5. BB84 */
var b0 = S.bb84(200000, 0, 0, 1);
ok('senza Eve: QBER = 0, setacciata ≈ 1/2', b0.qber + ', ' + b0.frazione.toFixed(4), b0.qber === 0 && Math.abs(b0.frazione - 0.5) < 0.004);
var b1 = S.bb84(200000, 1, 0, 2), sq = Math.sqrt(0.25 * 0.75 / b1.tenuti);
ok('Eve su tutti i fotoni: QBER ≈ 25 % (entro 3σ)', (100 * b1.qber).toFixed(3) + ' %', Math.abs(b1.qber - 0.25) < 3 * sq);
var b2 = S.bb84(200000, 0.4, 0.03, 3), Qa = S.qberAtteso(0.4, 0.03);
ok('Eve 40 % e rumore 3 %: QBER = formula', (100 * b2.qber).toFixed(3) + ' vs ' + (100 * Qa).toFixed(3), Math.abs(b2.qber - Qa) < 3 * Math.sqrt(Qa * (1 - Qa) / b2.tenuti));
ok('r = 1 − 2h(Q) si annulla all’11 % (Shor–Preskill)', S.tassoSegreto(0.11).toFixed(4) + ', h(0,11) = ' + S.h2(0.11).toFixed(4), S.tassoSegreto(0.11) < 0.005 && S.tassoSegreto(0.10) > 0);

console.log('\n' + (n - ko) + ' superati, ' + ko + ' falliti');
process.exit(ko ? 1 : 0);
