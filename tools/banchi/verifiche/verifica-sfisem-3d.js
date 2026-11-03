/* verifica dei campi 3D e del moto con la forza di Lorentz di bsi-fis-em.js (F.calcolo.em, v238):
   Biot-Savart contro le formule chiuse, divergenza nulla, metodo di Boris contro elica, periodo,
   deriva E×B e bottiglia magnetica contro l'invariante adiabatico */
'use strict';
var E = require('./carica.js')(['bsi-fis-em.js']).em;
var n = 0, ko = 0;
function ok(nome, val, cond) { n++; if (!cond) ko++; console.log((cond ? '  ✓ ' : '  ✗ ') + nome + ' → ' + val); }

/* 1. spira: al centro B = μ₀I/2a, sull'asse B = a²/2(a²+z²)^(3/2) (forma chiusa) */
var a = 1.5, c0 = E.campoSpira3D(a, 0, 0, 0, 96)[2], c1 = E.campoSpira3D(a, 0, 0, 1.2, 96), e1 = Math.max(Math.abs(c0 / E.bAsse(a, 0) - 1), Math.abs(c1[2] / E.bAsse(a, 1.2) - 1));
ok('spira (96 tratti): centro e asse contro la forma chiusa', e1.toExponential(2) + ', B_centro = ' + c0.toFixed(6) + ' (1/2a = 0,333333)', e1 < 5e-4 && Math.hypot(c1[0], c1[1]) < 1e-12);

/* 2. div B = 0 (differenze centrate) in punti qualsiasi, fuori dal filo */
var dmax = 0, h = 1e-4;
[[0.3, 0.4, 0.5], [1.0, -0.7, 0.2], [2.2, 0.1, -1.1], [0.1, 1.9, 0.8]].forEach(function (p) {
  var f = function (x, y, z) { return E.campoSpira3D(a, x, y, z, 64); };
  var d = (f(p[0] + h, p[1], p[2])[0] - f(p[0] - h, p[1], p[2])[0] + f(p[0], p[1] + h, p[2])[1] - f(p[0], p[1] - h, p[2])[1] + f(p[0], p[1], p[2] + h)[2] - f(p[0], p[1], p[2] - h)[2]) / (2 * h);
  dmax = Math.max(dmax, Math.abs(d) / Math.hypot.apply(null, f(p[0], p[1], p[2])));
});
ok('∇·B = 0 per la spira (relativo a |B|, quattro punti)', dmax.toExponential(2), dmax < 1e-5);

/* 3. Boris in B uniforme: |v| conservato, raggio e periodo dell'elica */
var B = 1.3, s = { x: [0, 0, 0], v: [0, 0.8, 0.4] }, dt = 0.002, giri = 0, py = s.v[1], tt = 0, tPrimo = null, tUno = null, xmin = 0, xmax = 0;
for (var i = 0; i < 40000; i++) {
  E.passoBoris(s, 1, [0, 0, 0], [0, 0, B], dt); tt += dt; xmin = Math.min(xmin, s.x[0]); xmax = Math.max(xmax, s.x[0]);
  if (py < 0 && s.v[1] >= 0) { giri++; var tx = tt - dt * s.v[1] / (s.v[1] - py); if (giri === 1) tUno = tx; if (giri === 6) tPrimo = tx - tUno; } py = s.v[1];
}
var dv = Math.abs(Math.hypot(s.v[0], s.v[1], s.v[2]) / Math.hypot(0, 0.8, 0.4) - 1);
ok('Boris, B uniforme: |v| costante dopo 40 000 passi', dv.toExponential(2), dv < 1e-12);
ok('raggio di Larmor mv⊥/qB = 0,61538', ((xmax - xmin) / 2).toFixed(5), Math.abs((xmax - xmin) / 2 / (0.8 / B) - 1) < 2e-3);
ok('periodo di ciclotrone 2πm/qB = 4,8332 (5 giri)', (tPrimo / 5).toFixed(5), Math.abs(tPrimo / 5 / (2 * Math.PI / B) - 1) < 2e-3);

/* 4. campi incrociati: velocita' media di deriva E×B/B² (E lungo x, B lungo z → −y), uguale per q = ±1 */
function deriva(q) { var u = { x: [0, 0, 0], v: [0.3, 0, 0] }, T = 2 * Math.PI * 20; for (var k = 0, N = Math.round(T / 0.002); k < N; k++) E.passoBoris(u, q, [0.5, 0, 0], [0, 0, 1], 0.002); return [u.x[0] / T, u.x[1] / T]; }
var dp = deriva(1), dm = deriva(-1);
ok('deriva E×B = (0, −0,5): la stessa per q = +1 e q = −1', dp[1].toFixed(4) + ' / ' + dm[1].toFixed(4), Math.abs(dp[1] + 0.5) < 2e-3 && Math.abs(dm[1] + 0.5) < 2e-3 && Math.abs(dp[0]) < 2e-2);

/* 5. bottiglia magnetica: partenza a z = −2,5 con il centro di guida sull'asse; riflessa se sin²α > B₀/B_max */
function corre(al) {
  var z0 = -2.5, f = 2 / E.bAsse(a, 0), Bs = E.bAsse(a, z0) * f, A = al * Math.PI / 180, vp = 0.25 * Math.sin(A), u = { x: [-vp / Bs, 0, z0], v: [0, vp, 0.25 * Math.cos(A)] }, zm = z0;
  for (var k = 0; k < 200000; k++) { var b = E.campoSpira3D(a, u.x[0], u.x[1], u.x[2], 48); E.passoBoris(u, 1, [0, 0, 0], [b[0] * f, b[1] * f, b[2] * f], 0.01); zm = Math.max(zm, u.x[2]); if (u.x[2] < z0 - 0.5 || u.x[2] > 3) break; }
  return zm;
}
var ac = E.angoloSpecchio(E.bAsse(a, -2.5) / E.bAsse(a, 0), 1), r10 = corre(ac - 8), r35 = corre(ac + 8);
ok('bottiglia: α_c = ' + ac.toFixed(2) + '°; con α_c − 8° passa, con α_c + 8° torna indietro', 'z_max ' + r10.toFixed(2) + ' / ' + r35.toFixed(2), r10 > 2.9 && r35 < 0);

/* 6. solenoide: il campo al centro sta fra quello di una spira e μ₀nI (somma delle formule chiuse sull'asse) */
var Bsol = E.campoSolenoide(1, 4, 6, 0, 0, 0, 96)[2], somma = 0; for (var k = 0; k < 6; k++) somma += E.bAsse(1, -2 + 4 * (k + 0.5) / 6);
ok('solenoide (6 spire): Biot-Savart = Σ formule chiuse sull’asse, < μ₀nI = 1,5', Bsol.toFixed(5) + ' / ' + somma.toFixed(5), Math.abs(Bsol / somma - 1) < 5e-4 && Bsol < 1.5);

console.log('\n' + (n - ko) + ' superati, ' + ko + ' falliti');
process.exit(ko ? 1 : 0);
