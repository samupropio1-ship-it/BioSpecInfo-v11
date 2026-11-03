/* verifica del pozzo di potenziale 3D di bsi-fis-gravita.js (F.calcolo.gravita, v238): punti di Lagrange
   come zeri del gradiente, gradiente contro derivata numerica, costante di Jacobi, troiani stabili e
   instabili, orbita di Keplero integrata con Verlet contro a, e, T previsti */
'use strict';
var G = require('./carica.js')(['bsi-fis-gravita.js']).gravita;
var n = 0, ko = 0;
function ok(nome, val, cond) { n++; if (!cond) ko++; console.log((cond ? '  ✓ ' : '  ✗ ') + nome + ' → ' + val); }

/* 1. L1…L5 annullano il gradiente del potenziale efficace (Terra-Luna e Sole-Giove) */
var gmax = 0;
[0.012150, 9.537e-4].forEach(function (mu) { var L = G.lagrange(mu); ['L1', 'L2', 'L3', 'L4', 'L5'].forEach(function (k) { var g = G.gradEff(L[k][0], L[k][1], mu); gmax = Math.max(gmax, Math.hypot(g[0], g[1])); }); });
ok('|∇U| nei cinque punti di Lagrange', gmax.toExponential(2), gmax < 1e-9);

/* 2. il gradiente analitico coincide con la derivata numerica di potEff */
var dmax = 0, h = 1e-6;
[[0.3, 0.4], [-0.7, 0.9], [1.3, -0.2], [0.5, 0.8]].forEach(function (p) { var g = G.gradEff(p[0], p[1], 0.1), nx = (G.potEff(p[0] + h, p[1], 0.1) - G.potEff(p[0] - h, p[1], 0.1)) / (2 * h), ny = (G.potEff(p[0], p[1] + h, 0.1) - G.potEff(p[0], p[1] - h, 0.1)) / (2 * h); dmax = Math.max(dmax, Math.abs(g[0] - nx), Math.abs(g[1] - ny)); });
ok('∇U analitico = differenze centrate', dmax.toExponential(2), dmax < 1e-7);

/* 3. costante di Jacobi conservata da RK4 (Terra-Luna, partenza vicino a L4, t = 50) */
var mu = 0.012150, L4 = G.lagrange(mu).L4, s = [L4[0] + 0.03, L4[1] - 0.02, 0, 0], J0 = G.jacobi(s, mu);
for (var i = 0; i < 25000; i++) s = G.passoR3C(s, mu, 0.002);
ok('costante di Jacobi dopo t = 50 (scarto relativo)', Math.abs((G.jacobi(s, mu) - J0) / J0).toExponential(2), Math.abs((G.jacobi(s, mu) - J0) / J0) < 1e-9);

/* 4. troiano di Sole-Giove resta vicino a L4; con masse confrontabili (μ = 0,3) scappa */
function lontano(m, T) { var L = G.lagrange(m).L4, u = [L[0] + 0.007, L[1] - 0.007, 0, 0], dm = 0; for (var k = 0; k < T / 0.002; k++) { u = G.passoR3C(u, m, 0.002); dm = Math.max(dm, Math.hypot(u[0] - L[0], u[1] - L[1])); if (dm > 2.5) break; } return dm; }
var dSG = lontano(9.537e-4, 200), dUG = lontano(0.3, 60);
ok('troiano Sole-Giove (spostato di 0,01): resta entro 0,3 da L4 per t = 200; con μ = 0,3 scappa oltre 2', dSG.toFixed(3) + ' / ' + dUG.toFixed(3), dSG < 0.3 && dUG > 2);

/* 5. orbita di Keplero con Verlet: periodo, E e L contro la previsione */
var K = G.kepler(1.5, 0.8 / Math.sqrt(1.5)), C = [{ m: 1, x: 0, y: 0, vx: 0, vy: 0 }, { m: 1e-12, x: 1.5, y: 0, vx: 0, vy: 0.8 / Math.sqrt(1.5) }], E0 = G.energia(C, 0) / 1e-12, Lm0 = G.momentoAngolare(C) / 1e-12, tt = 0, py = 0, tGiro = null, dE = 0, dL = 0, rmin = 9;
for (i = 0; i < 2e6 && tGiro === null; i++) {
  G.passoVerlet(C, 0.0005, 0); tt += 0.0005; var y = C[1].y - C[0].y; rmin = Math.min(rmin, Math.hypot(C[1].x - C[0].x, y));
  if (py < 0 && y >= 0 && tt > 1) tGiro = tt - 0.0005 * y / (y - py); py = y;
  if (i % 100 === 0) { dE = Math.max(dE, Math.abs(G.energia(C, 0) / 1e-12 - E0) / Math.abs(E0)); dL = Math.max(dL, Math.abs(G.momentoAngolare(C) / 1e-12 - Lm0) / Lm0); }
}
ok('periodo misurato = 2π a^(3/2) = ' + K.T.toFixed(4), tGiro.toFixed(4), Math.abs(tGiro / K.T - 1) < 1e-4);
ok('perielio misurato = a(1 − e)', rmin.toFixed(5) + ' / ' + (K.a * (1 - K.e)).toFixed(5), Math.abs(rmin / (K.a * (1 - K.e)) - 1) < 1e-4);
ok('su un giro: E e L costanti (Verlet; scarto relativo)', dE.toExponential(1) + ' / ' + dL.toExponential(1), dE < 1e-5 && dL < 1e-9);

/* 6. alla velocita' di fuga √2 v_c l'energia e' nulla e l'orbita e' una parabola (e = 1) */
var Kf = G.kepler(2, Math.sqrt(2 / 2));
ok('v₀ = √(2GM/r₀): E = 0, e = 1', Kf.E.toExponential(1) + ', e = ' + Kf.e.toFixed(12), Math.abs(Kf.E) < 1e-15 && Math.abs(Kf.e - 1) < 1e-12);

console.log('\n' + (n - ko) + ' superati, ' + ko + ' falliti');
process.exit(ko ? 1 : 0);
