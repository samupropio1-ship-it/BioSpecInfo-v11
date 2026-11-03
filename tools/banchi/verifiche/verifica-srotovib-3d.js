/* verifica della scheda 3D di bsi-fis-rotovib.js (v238): Morse dalle costanti, moto classico, rotazione, modi normali della CO₂ */
var R = require('./carica.js')(['bsi-fis-rotovib.js']).rotovib;
var n = 0, ko = 0;
function ok(nome, val, cond) { n++; if (!cond) ko++; console.log((cond ? 'OK  ' : 'KO  ') + nome + ' → ' + val); }

/* il Morse ricavato da ωe e ωexe riproduce G(v) nei punti di inversione: V(r±) = G(v) */
var md = 0;
Object.keys(R.MOLECOLE).forEach(function (k) { var m = R.MOLECOLE[k], M = R.morse(m); for (var v = 0; v <= 5; v++) { var I = R.inversione(m, v); md = Math.max(md, Math.abs(M.V(I.dentro) - R.G(m, v)) / R.G(m, v), Math.abs(M.V(I.fuori) - R.G(m, v)) / R.G(m, v)); } });
ok('V(r±) = G(v) per tutte le molecole, v = 0…5', md.toExponential(2), md < 1e-10);
/* il moto classico chiuso: r(0) = punto interno, r(π) = punto esterno, e l'energia (cinetica + V) costante lungo il moto */
var m = R.MOLECOLE['H35Cl'], M = R.morse(m), I = R.inversione(m, 2), Om = 2 * Math.PI * R.nuVib(m, 2) * 2.99792458e10, mu = m.mu * 1.66053907e-27, eM = 0;
for (var k = 1; k < 40; k++) { var f = k * 0.157, h = 1e-6, dr = (R.rMorse(m, 2, f + h) - R.rMorse(m, 2, f - h)) / (2 * h) * Om * 1e-10, Ek = 0.5 * mu * dr * dr / (6.62607015e-34 * 2.99792458e10); eM = Math.max(eM, Math.abs(Ek + M.V(R.rMorse(m, 2, f)) - R.G(m, 2)) / R.G(m, 2)); }
ok('r(Ωt) chiuso: estremi ai punti di inversione', (R.rMorse(m, 2, 0) - I.dentro).toExponential(1) + ', ' + (R.rMorse(m, 2, Math.PI) - I.fuori).toExponential(1), Math.abs(R.rMorse(m, 2, 0) - I.dentro) < 1e-12 && Math.abs(R.rMorse(m, 2, Math.PI) - I.fuori) < 1e-12);
ok('lungo il moto classico T + V = G(v) (scarto relativo massimo)', eM.toExponential(2), eM < 1e-5);
/* frequenza classica al livello v = dG/dv = ωe − 2ωexe(v+½) */
var dv = Math.abs(R.nuVib(m, 1) - (m.we - 3 * m.wexe));
ok('Ω(v) = ωe − 2ωexe(v+½)', R.nuVib(m, 1).toFixed(4) + ' cm⁻¹', dv < 1e-9);
/* rotazione: ν = 2B√(J(J+1)) e stiramento centrifugo coerente con la D tabulata (Kratzer, D = 4B³/ωe²) */
var Dk = 4 * Math.pow(m.Be, 3) / (m.we * m.we);
ok('Kratzer: 4Be³/ωe² ≈ D della tabella (HCl)', Dk.toExponential(4) + ' vs ' + m.D.toExponential(4), Math.abs(Dk - m.D) / m.D < 0.01);
ok('Δr/re = D J(J+1)/B (J = 10)', R.stiramento(m, 10).toExponential(4) + ' vs ' + (Dk * 110 / m.Be).toExponential(4), Math.abs(R.stiramento(m, 10) - Dk * 110 / m.Be) < 1e-15);
ok('HCl, J = 3: circa 40 vibrazioni per giro', (R.nuVib(m, 0) / R.nuRot(m, 0, 3)).toFixed(1), Math.abs(R.nuVib(m, 0) / R.nuRot(m, 0, 3) - 40.6) < 0.5);
/* CO₂: centro di massa fermo, modi ortogonali con la metrica delle masse, ν₁ senza dipolo */
var com = 0, orto = 0;
[1, 2, 3].forEach(function (a) { var A = R.modoCO2(a), c = [0, 0, 0]; A.d.forEach(function (x, i) { for (var q = 0; q < 3; q++) c[q] += A.m[i] * x[q]; }); com = Math.max(com, Math.hypot(c[0], c[1], c[2]));
  [1, 2, 3].forEach(function (b) { if (b <= a) return; var B = R.modoCO2(b), s = 0; A.d.forEach(function (x, i) { for (var q = 0; q < 3; q++) s += A.m[i] * x[q] * B.d[i][q]; }); orto = Math.max(orto, Math.abs(s)); }); });
ok('CO₂: Σ m·d = 0 per i tre modi e ⟨a|M|b⟩ = 0', com.toExponential(1) + ', ' + orto.toExponential(1), com < 1e-12 && orto < 1e-12);
var d1 = R.dipoloCO2(1, 0.2), d3 = R.dipoloCO2(3, 0.2), d2 = R.dipoloCO2(2, 0.2);
ok('CO₂: ν₁ inattivo in IR (dipolo nullo), ν₂ e ν₃ attivi', [d1, d2, d3].map(function (p) { return Math.hypot(p[0], p[1], p[2]).toFixed(4); }).join(', '), Math.hypot(d1[0], d1[1], d1[2]) < 1e-15 && Math.hypot(d2[0], d2[1], d2[2]) > 0.01 && Math.hypot(d3[0], d3[1], d3[2]) > 0.01);
/* ampiezza della coordinata normale: energia del livello ½ω²Q² = (v+½)ħω al punto di inversione */
var nu = 2349.1, Q = R.ampiezzaQ(nu, 1), w = 2 * Math.PI * 2.99792458e10 * nu, E = 0.5 * w * w * Math.pow(Q * 1e-10, 2) * 1.66053907e-27, Eq = 1.5 * 1.054571817e-34 * w;
ok('Q(v) al punto di inversione: ½ω²Q² = (v+½)ħω (v = 1)', (E / Eq).toFixed(6), Math.abs(E / Eq - 1) < 1e-4);

console.log('\n' + (n - ko) + ' superati, ' + ko + ' falliti');
process.exit(ko ? 1 : 0);
