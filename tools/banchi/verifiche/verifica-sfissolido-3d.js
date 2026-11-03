/* verifica della zona di Brillouin 3D di bsi-fis-solido.js (F.calcolo.solido, v238): N_c ricavata dalle
   masse delle valli contro la tabella dei materiali, geometria dell'ottaedro troncato (vertici, spigoli,
   Eulero, punti di simmetria sul bordo), ampiezza termica e passo di Ornstein-Uhlenbeck */
'use strict';
var S = require('./carica.js')(['bsi-fis-solido.js']).solido;
var n = 0, ko = 0;
function ok(nome, val, cond) { n++; if (!cond) ko++; console.log((cond ? '  ✓ ' : '  ✗ ') + nome + ' → ' + val); }

/* 1. N_c = 2(2π m* kT/h²)^(3/2) con la massa di densita' delle valli contro la tabella (300 K) */
var scarti = ['Si', 'Ge', 'GaAs'].map(function (m) { return S.densitaStati(S.massaDensita(S.VALLI[m]), 300) / S.MATERIALI[m].Nc - 1; });
ok('N_c dalle valli contro la tabella (Si, Ge, GaAs)', scarti.map(function (x) { return (x * 100).toFixed(1) + ' %'; }).join(', '), scarti.every(function (x) { return Math.abs(x) < 0.1; }));

/* 2. massa di densita' del silicio: 6^(2/3)(0,98·0,19²)^(1/3) = 1,084 m₀ (valore da manuale 1,08) */
var md = S.massaDensita(S.VALLI.Si);
ok('m*_dos(Si) = 1,084 m₀', md.toFixed(4), Math.abs(md - 1.0840) < 5e-4);

/* 3. N_c ∝ T^(3/2) e costante numerica 2(2π m₀ k·300/h²)^(3/2) = 2,51·10¹⁹ cm⁻³ */
var c300 = S.densitaStati(1, 300), r = S.densitaStati(1, 600) / c300;
ok('N_c(m₀, 300 K) = 2,51·10¹⁹ e N_c(600)/N_c(300) = 2^(3/2)', c300.toExponential(3) + ', ' + r.toFixed(6), Math.abs(c300 / 2.509e19 - 1) < 2e-3 && Math.abs(r - Math.pow(2, 1.5)) < 1e-12);

/* 4. ottaedro troncato: 24 vertici, 36 spigoli, 14 facce (Eulero V − E + F = 2), spigoli tutti √2/2 */
var Z = S.zonaBrillouin(), tuttiW = Z.V.every(function (v) { return Math.abs(Math.hypot(v[0], v[1], v[2]) - Math.sqrt(1.25)) < 1e-12 && S.nellaZona(v); });
ok('zona di Brillouin fcc: V = 24, E = 36, V − E + 14 = 2, vertici W a |k| = √5/2', Z.V.length + ', ' + Z.E.length, Z.V.length === 24 && Z.E.length === 36 && Z.V.length - Z.E.length + 14 === 2 && tuttiW);

/* 5. punti di simmetria: X, L, K, W sul bordo; Γ dentro; oltre il bordo fuori */
var bordo = [[1, 0, 0], [0.5, 0.5, 0.5], [0.75, 0.75, 0], [1, 0.5, 0]].every(function (k) { return S.nellaZona(k) && !S.nellaZona([k[0] * 1.001, k[1] * 1.001, k[2] * 1.001]); });
ok('Γ dentro; X, L, K, W sul bordo (ΓX = 1, ΓL = √3/2)', bordo, bordo && S.nellaZona([0, 0, 0]) && Math.abs(Math.hypot(0.5, 0.5, 0.5) - Math.sqrt(3) / 2) < 1e-15);

/* 6. le valli del Si a 0,85 ΓX e del Ge in L stanno nella zona (le mezze valli del Ge sul bordo) */
ok('centri delle valli nella zona', S.VALLI.Si.centri.length + ' + ' + S.VALLI.Ge.centri.length, S.VALLI.Si.centri.concat(S.VALLI.Ge.centri).every(S.nellaZona) && S.VALLI.Ge.centri.length === 2 * S.VALLI.Ge.Mc);

/* 7. passo di Ornstein-Uhlenbeck: partendo da k = 0 la varianza converge a σ² (statistica con seme) */
var seme = 7; function rnd() { seme = (seme + 0x6D2B79F5) >>> 0; var q = Math.imul(seme ^ (seme >>> 15), 1 | seme); q = (q + Math.imul(q ^ (q >>> 7), 61 | q)) ^ q; return ((q ^ (q >>> 14)) >>> 0) / 4294967296; }
function gauss() { return Math.sqrt(-2 * Math.log(Math.max(1e-12, rnd()))) * Math.cos(2 * Math.PI * rnd()); }
var sig = S.sigmaK(0.98, 300, 5.431), N = 20000, k = new Float64Array(N);
for (var p = 0; p < 200; p++) for (var i = 0; i < N; i++) k[i] = S.passoOU(k[i], sig, 0.05, 0.6, gauss);
var v2 = 0; for (i = 0; i < N; i++) v2 += k[i] * k[i] / N;
ok('Ornstein-Uhlenbeck: ⟨k²⟩ → σ² (σ = √(m_l kT)/ħ = ' + sig.toFixed(4) + ' 2π/a)', (v2 / (sig * sig)).toFixed(4), Math.abs(v2 / (sig * sig) - 1) < 0.03);

console.log('\n' + (n - ko) + ' superati, ' + ko + ' falliti');
process.exit(ko ? 1 : 0);
