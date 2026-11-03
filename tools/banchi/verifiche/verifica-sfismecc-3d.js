/* verifica del lancio in 3D con il vento di bsi-fis-meccanica.js (F.calcolo.meccanica.proiettile3D, v238)
   contro la versione piana, la parabola del vuoto, il bilancio dell'energia e la simmetria del vento */
'use strict';
var M = require('./carica.js')(['bsi-fis-meccanica.js']).meccanica, g = 9.80665;
var n = 0, ko = 0;
function ok(nome, val, cond) { n++; if (!cond) ko++; console.log((cond ? '  ✓ ' : '  ✗ ') + nome + ' → ' + val); }

/* 1. senza vento il calcolo in 3D coincide con quello piano (stessa aria, stesso passo) */
var d2 = M.proiettile(30, 45, 0.01, 0), d3 = M.proiettile3D(30, 45, 0.01, 0, 0, 0);
var e1 = Math.max(Math.abs(d2.R - d3.R), Math.abs(d2.T - d3.T), Math.abs(d2.H - d3.H));
ok('senza vento: gittata, volo e quota uguali alla versione 2D', e1.toExponential(2), e1 < 1e-9 && Math.abs(d3.Y) < 1e-12);

/* 2. nel vuoto: R = v₀² sin 2θ / g, T = 2 v₀ sin θ / g, e il vento non conta (k = 0) */
var v = M.proiettile3D(30, 45, 0, 15, 90, 0), Rv = 900 / g, Tv = 2 * 30 * Math.SQRT1_2 / g;
ok('vuoto: R = v₀² sin 2θ/g = 91,774 m anche con 15 m/s di vento', v.R.toFixed(4) + ' m, T ' + v.T.toFixed(4) + ' s', Math.abs(v.R / Rv - 1) < 1e-5 && Math.abs(v.T / Tv - 1) < 1e-5 && Math.abs(v.Y) < 1e-12);

/* 3. bilancio dell'energia: Δ(½v² + gz) = lavoro della resistenza (integrato a parte) */
var peg = 0;
[[40, 40, 0.008, 10, 90, 5], [80, 30, 0.02, 25, 0, 0], [60, 70, 0.01, 20, 200, 30]].forEach(function (c) { var r = M.proiettile3D.apply(null, c); peg = Math.max(peg, Math.abs((r.E1 - r.E0) - r.lavoro) / Math.abs(r.lavoro)); });
ok('Δ(½v² + gz) = ∫ a_res · v dt (tre lanci, errore relativo)', peg.toExponential(2), peg < 1e-4);

/* 4. vento laterale: deriva simmetrica (±W danno ±y) e gittata lungo x uguale */
var p = M.proiettile3D(40, 40, 0.008, 10, 90, 0), q = M.proiettile3D(40, 40, 0.008, 10, -90, 0);
ok('vento da sinistra o da destra: deriva opposta, stessa x', p.Y.toFixed(6) + ' / ' + q.Y.toFixed(6), Math.abs(p.Y + q.Y) < 1e-9 && Math.abs(p.X - q.X) < 1e-9 && p.Y > 1);

/* 5. vento a favore allunga, contrario accorcia; la deriva va nel verso del vento */
var fav = M.proiettile3D(40, 40, 0.008, 10, 0, 0), con = M.proiettile3D(40, 40, 0.008, 10, 180, 0), nul = M.proiettile3D(40, 40, 0.008, 0, 0, 0);
ok('vento a favore: R maggiore; contrario: R minore', fav.R.toFixed(2) + ' > ' + nul.R.toFixed(2) + ' > ' + con.R.toFixed(2), fav.R > nul.R && nul.R > con.R);

/* 6. velocita' limite: caduta da ferma (θ = 90°, v₀ piccola, quota alta) → √(g/k) */
var cad = M.proiettile3D(0.01, 89, 0.02, 0, 0, 3000), vl = Math.sqrt(g / 0.02);
ok('caduta lunga: v finale → √(g/k) = 22,145 m/s', cad.vfin.toFixed(4), Math.abs(cad.vfin / vl - 1) < 1e-4);

/* 7. il primo campione e' il lancio, l'ultimo e' a terra; i tempi crescono */
var cr = d3.pts.every(function (s, i) { return !i || s.t > d3.pts[i - 1].t; });
ok('campioni ordinati nel tempo, ultimo a quota 0', d3.pts.length + ' campioni', cr && d3.pts[d3.pts.length - 1].p[2] === 0 && d3.pts[0].t === 0);

console.log('\n' + (n - ko) + ' superati, ' + ko + ' falliti');
process.exit(ko ? 1 : 0);
