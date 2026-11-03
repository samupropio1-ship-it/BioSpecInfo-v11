/* verifica della scheda 3D di bsi-fis-schrodinger.js (v238): stati separabili in 3D, campionamento di |ψ|², sovrapposizioni */
var S = require('./carica.js')(['bsi-fis-schrodinger.js']).schrodinger;
var n = 0, ko = 0;
function ok(nome, val, cond) { n++; if (!cond) ko++; console.log((cond ? 'OK  ' : 'KO  ') + nome + ' → ' + val); }

var A = S.stati3D('armonico', { w: 1.3 }, 6), md = 0;
[[0, 0, 0], [1, 0, 0], [2, 1, 0], [1, 1, 1], [4, 0, 1]].forEach(function (q) { md = Math.max(md, Math.abs(S.energia3D(A, q) - S.esatta3D('armonico', { w: 1.3 }, q)) / S.esatta3D('armonico', { w: 1.3 }, q)); });
ok('oscillatore 3D: E = ω(n₁ + n₂ + n₃ + 3/2) (scarto relativo massimo, differenze finite su 500 punti)', md.toExponential(2), md < 5e-4);
var B = S.stati3D('pozzo', { L: 1.4 }, 6), mb = 0;
[[0, 0, 0], [1, 2, 0], [3, 3, 3]].forEach(function (q) { mb = Math.max(mb, Math.abs(S.energia3D(B, q) - S.esatta3D('pozzo', { L: 1.4 }, q)) / S.esatta3D('pozzo', { L: 1.4 }, q)); });
ok('scatola cubica: E = π²(n₁² + n₂² + n₃²)/2L² (n contati da 1)', mb.toExponential(2), mb < 1e-4);
var dg = [0, 1, 2, 3].map(function (N) { return S.degenerazione(A, [N, 0, 0]); }).join(',');
ok('degenerazione dell\'oscillatore (N+1)(N+2)/2 = 1, 3, 6, 10', dg, dg === '1,3,6,10');
ok('scatola: (1,1,0) triplo, (0,0,0) singolo; (2,2,2) degenere per caso con (4,0,0) e permutazioni: 3² + 3² + 3² = 5² + 1 + 1', [S.degenerazione(B, [1, 1, 0]), S.degenerazione(B, [0, 0, 0]), S.degenerazione(B, [2, 2, 2])].join(','), S.degenerazione(B, [1, 1, 0]) === 3 && S.degenerazione(B, [0, 0, 0]) === 1 && S.degenerazione(B, [2, 2, 2]) === 4);
/* campionamento esatto: nello stato fondamentale ⟨x²⟩ = 1/(2ω) e la probabilita' fuori dal confine classico e' P(χ²₃ > 6) = 0,1116 */
var w = 1.3, c = S.campiona3D(A, [0, 0, 0], null, 60000, 5), x2 = 0, fuori = 0;
for (var i = 0; i < c.N; i++) { var x = c.p[3 * i], y = c.p[3 * i + 1], z = c.p[3 * i + 2]; x2 += x * x; if (0.5 * w * w * (x * x + y * y + z * z) > 1.5 * w) fuori++; }
var chi = 1 - (function () { var t = 3, s = 0; /* CDF di χ²₃ in 6: erf(√3) − √(2·3/π) e^(−3) */ return erf(Math.sqrt(t)) - Math.sqrt(2 * 6 / Math.PI) * Math.exp(-3); })();
function erf(x) { var s = 0, term = x, k = 0; while (Math.abs(term) > 1e-17 && k < 200) { s += term / (2 * k + 1); k++; term *= -x * x / k; } return 2 / Math.sqrt(Math.PI) * s; }
ok('campionamento: ⟨x²⟩ = 1/(2ω)', (x2 / c.N).toFixed(4) + ' vs ' + (1 / (2 * w)).toFixed(4), Math.abs(x2 / c.N - 1 / (2 * w)) < 0.01);
ok('effetto tunnel: frazione fuori dalla regione classica = P(χ²₃ > 6)', (fuori / c.N).toFixed(4) + ' vs ' + chi.toFixed(4), Math.abs(fuori / c.N - chi) < 0.006);
/* sovrapposizione |0⟩ + |1⟩ lungo x: ⟨x⟩(t) = ⟨0|x|1⟩ cos ωt, con ⟨0|x|1⟩ = 1/√(2ω) */
var xab = S.elementoX(A.assi[0], 0, 1), c2 = S.campiona3D(A, [0, 0, 0], [1, 0, 0], 60000, 9), dE = S.energia3D(A, [1, 0, 0]) - S.energia3D(A, [0, 0, 0]), mm = 0;
[0, 0.7, 1.9, Math.PI / dE].forEach(function (tt) { var xm = 0, sw = 0; for (var j = 0; j < c2.N; j++) { var pw = S.peso3D(c2.a[j], c2.b[j], dE, tt, true); xm += pw * c2.p[3 * j]; sw += pw; } mm = Math.max(mm, Math.abs(xm / sw - xab * Math.cos(dE * tt))); });
ok('|⟨0|x|1⟩| = 1/√(2ω)', Math.abs(xab).toFixed(5) + ' vs ' + (1 / Math.sqrt(2 * w)).toFixed(5), Math.abs(Math.abs(xab) - 1 / Math.sqrt(2 * w)) < 1e-3);
ok('⟨x⟩(t) misurato sui punti pesati = ⟨0|x|1⟩ cos ΔE t (scarto massimo su 4 istanti)', mm.toFixed(4), mm < 0.012);
/* i pesi: la media su un periodo e' 1 punto per punto, e sempre fra 0 e 2 */
var pmin = 9, pmax = -9; for (i = 0; i < 2000; i++) { var pw2 = S.peso3D(c2.a[i], c2.b[i], dE, i * 0.013, true); pmin = Math.min(pmin, pw2); pmax = Math.max(pmax, pw2); }
ok('peso ρ(t)/ρ_campione sempre in [0, 2]', pmin.toFixed(3) + '…' + pmax.toFixed(3), pmin >= -1e-9 && pmax <= 2 + 1e-9);
/* doppia buca: i primi due livelli lungo x sono la coppia simmetrica/antisimmetrica, vicinissimi */
var D = S.stati3D('doppia', { h: 6, s: 1.4 }, 6), E = D.assi[0].E;
ok('doppia buca: splitting del tunnel E₁ − E₀ ≪ E₂ − E₁', (E[1] - E[0]).toFixed(4) + ' ≪ ' + (E[2] - E[1]).toFixed(4), (E[1] - E[0]) < 0.05 * (E[2] - E[1]));

console.log('\n' + (n - ko) + ' superati, ' + ko + ' falliti');
process.exit(ko ? 1 : 0);
