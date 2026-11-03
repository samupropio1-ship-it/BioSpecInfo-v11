/* verifica del cono di luce 3D di bsi-fis-relativita.js (F.calcolo.relativita, v238): intervallo invariante
   con due dimensioni di spazio, composizione delle spinte, cono e ordine causale, piano di simultaneita',
   tempo proprio sulle linee di universo */
'use strict';
var R = require('./carica.js')(['bsi-fis-relativita.js']).relativita;
var n = 0, ko = 0;
function ok(nome, val, cond) { n++; if (!cond) ko++; console.log((cond ? '  ✓ ' : '  ✗ ') + nome + ' → ' + val); }
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var r = Math.imul(a ^ a >>> 15, 1 | a); r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r; return ((r ^ r >>> 14) >>> 0) / 4294967296; }; }
var rnd = mulberry32(238);

/* 1. s² = (cΔt)² − Δx² − Δy² non cambia (200 coppie di eventi, β a caso) */
var e1 = 0;
for (var i = 0; i < 200; i++) { var a = [rnd() * 8 - 4, rnd() * 8 - 4, rnd() * 8 - 4], b = [rnd() * 8 - 4, rnd() * 8 - 4, rnd() * 8 - 4], be = rnd() * 1.98 - 0.99; e1 = Math.max(e1, Math.abs(R.intervallo3(R.lorentz3(a, be), R.lorentz3(b, be)) - R.intervallo3(a, b))); }
ok('intervallo invariante in (x, y, ct)', e1.toExponential(2), e1 < 1e-9);

/* 2. due spinte lungo x = una spinta con la somma relativistica delle velocita' */
var e2 = 0;
for (i = 0; i < 100; i++) { var ev = [rnd() * 6 - 3, rnd() * 6 - 3, rnd() * 6 - 3], b1 = rnd() * 1.8 - 0.9, b2 = rnd() * 1.8 - 0.9, x1 = R.lorentz3(R.lorentz3(ev, b1), b2), x2 = R.lorentz3(ev, R.somma(b1, b2)); e2 = Math.max(e2, Math.abs(x1[0] - x2[0]), Math.abs(x1[1] - x2[1]), Math.abs(x1[2] - x2[2])); }
ok('Λ(β₂)Λ(β₁) = Λ((β₁ + β₂)/(1 + β₁β₂))', e2.toExponential(2), e2 < 1e-9);

/* 3. il cono resta il cono: eventi di luce restano a s² = 0 e nel futuro per ogni β */
var e3 = 0, fut = true;
for (i = 0; i < 100; i++) { var f = rnd() * 2 * Math.PI, c = 0.5 + 4 * rnd(), L = [c * Math.cos(f), c * Math.sin(f), c], q = R.lorentz3(L, rnd() * 1.98 - 0.99); e3 = Math.max(e3, Math.abs(q[2] * q[2] - q[0] * q[0] - q[1] * q[1])); fut = fut && q[2] > 0; }
ok('eventi sul cono futuro: s² = 0 e ct′ > 0 dopo ogni spinta', e3.toExponential(2), e3 < 1e-9 && fut);

/* 4. ordine causale: A = (1, 1, 3) (tempo) ha ct′ > 0 per ogni β; B = (3, −1, 1) (spazio) cambia segno a β = 1/3 */
var minA = Infinity; for (var k = -99; k <= 99; k++) minA = Math.min(minA, R.lorentz3([1, 1, 3], k / 100)[2]);
var B0 = R.lorentz3([3, -1, 1], 1 / 3)[2], Bp = R.lorentz3([3, -1, 1], 0.5)[2];
ok('A resta nel futuro (min ct′ = ' + minA.toFixed(3) + '); B: ct′ = 0 a β = 1/3, < 0 a β = 0,5', B0.toExponential(1) + ' / ' + Bp.toFixed(4), minA > 0 && Math.abs(B0) < 1e-12 && Bp < 0);

/* 5. il piano ct = βx + τ/γ e' davvero ct′ = τ per l'osservatore β */
var e5 = 0; [0.3, -0.6, 0.85].forEach(function (be) { for (var x = -4; x <= 4; x += 0.5) { var p = R.lorentz3([x, 1.7, R.simultaneita(x, be, 2.2)], be); e5 = Math.max(e5, Math.abs(p[2] - 2.2)); } });
ok('piano di simultaneità: ct′ = τ in ogni punto', e5.toExponential(2), e5 < 1e-12);

/* 6. tempo proprio: il pallino n di O′ sta in (βγn, 0, γn) e per O′ e' (0, 0, n) */
var be6 = 0.6, g6 = R.gamma(be6), e6 = 0; for (k = 1; k <= 5; k++) { var p6 = R.lorentz3([be6 * g6 * k, 0, g6 * k], be6); e6 = Math.max(e6, Math.abs(p6[0]), Math.abs(p6[2] - k)); }
ok('tempo proprio di O′: un tic ogni γ = 1,25 di ct, per lui ogni 1', e6.toExponential(2), e6 < 1e-12 && Math.abs(g6 - 1.25) < 1e-15);

console.log('\n' + (n - ko) + ' superati, ' + ko + ' falliti');
process.exit(ko ? 1 : 0);
