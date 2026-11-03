/* verifica dell'Ising 3D di bsi-fis-ising.js (F.calcolo.ising, v238): stato fondamentale, ΔE locale contro
   la differenza di energia totale, sviluppo di alta temperatura, fase ordinata e disordinata attorno a
   T_c ≈ 4,51, gli spin restano ±1 */
'use strict';
var I = require('./carica.js')(['bsi-fis-ising.js']).ising;
var n = 0, ko = 0;
function ok(nome, val, cond) { n++; if (!cond) ko++; console.log((cond ? '  ✓ ' : '  ✗ ') + nome + ' → ' + val); }

/* 1. tutti su: e = −3 J per spin (tre legami per sito), m = 1; con campo h: e = −3 − h */
var R = I.reticolo3D(8, false, 1), q = I.misura3D(R, 0), qh = I.misura3D(R, 0.4);
ok('stato fondamentale: e = −3, m = 1; con h = 0,4: e = −3,4', q.e + ', ' + q.m + ', ' + qh.e.toFixed(12), q.e === -3 && q.m === 1 && Math.abs(qh.e + 3.4) < 1e-12);

/* 2. ΔE dello spin girato = differenza delle energie totali (stati casuali, con campo) */
var C = I.reticolo3D(6, true, 5), N = 216, emax = 0;
for (var k = 0; k < 60; k++) { var i = (k * 37) % N, h = 0.3, E0 = I.misura3D(C, h).e * N, dE = I.deltaE3D(C, i, h); C.s[i] = -C.s[i]; emax = Math.max(emax, Math.abs(I.misura3D(C, h).e * N - E0 - dE)); }
ok('ΔE = 2 s_i (Σ sei vicini + h) = E_dopo − E_prima', emax.toExponential(1), emax < 1e-9);

/* 3. alta temperatura: e ≈ −3 tanh(J/kT) (primo ordine dello sviluppo) a T = 20 */
function media(L, T, term, mis, seme) { var Q = I.reticolo3D(L, false, seme), sm = 0, se = 0; for (var j = 0; j < term; j++) I.sweep3D(Q, T, 0); for (j = 0; j < mis; j++) { I.sweep3D(Q, T, 0); var z = I.misura3D(Q, 0); sm += Math.abs(z.m); se += z.e; } return { m: sm / mis, e: se / mis, s: Q.s }; }
var hT = media(10, 20, 200, 400, 3);
ok('T = 20: e = −3 tanh(1/20) = −0,1496', hT.e.toFixed(4), Math.abs(hT.e + 3 * Math.tanh(0.05)) < 0.01);

/* 4. ordine sotto T_c, disordine sopra (L = 12) */
var a = media(12, 4.0, 300, 300, 7), b = media(12, 5.5, 300, 300, 7), c = media(12, 3.0, 200, 200, 7);
ok('|m|: T = 3 > 0,9; T = 4 > 0,6; T = 5,5 < 0,15 (T_c ≈ ' + I.TC3D + ')', c.m.toFixed(3) + ', ' + a.m.toFixed(3) + ', ' + b.m.toFixed(3), c.m > 0.9 && a.m > 0.6 && b.m < 0.15);

/* 5. la transizione 3D sta sopra quella 2D (Onsager) e sotto il campo medio z J = 6 */
ok('T_c(2D) = 2,269 < T_c(3D) = 4,5115 < 6 (campo medio)', I.TC.toFixed(4) + ' < ' + I.TC3D + ' < 6', I.TC < I.TC3D && I.TC3D < 6);

/* 6. dopo tutti gli sweep gli spin sono ancora ±1 */
var pm = [hT.s, a.s, b.s].every(function (s) { for (var j = 0; j < s.length; j++) if (s[j] !== 1 && s[j] !== -1) return false; return true; });
ok('spin sempre ±1', pm, pm);

console.log('\n' + (n - ko) + ' superati, ' + ko + ' falliti');
process.exit(ko ? 1 : 0);
