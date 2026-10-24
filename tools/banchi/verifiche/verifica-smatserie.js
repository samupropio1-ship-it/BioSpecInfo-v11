// verifica di F.calcolo.serie contro valori noti e metodi indipendenti
const C = require('./carica.js')(['bsi-mat-serie.js']);
const S = C.serie; let ok = 0, ko = 0;
function prova(nome, val, cond) { const r = !!cond; r ? ok++ : ko++; console.log((r ? 'OK ' : 'KO ') + nome + ' → ' + val); }

// 1. Σ1/n² con la coda di Eulero–Maclaurin: π²/6 a 1e-6 già con N = 10
const b10 = S.sommaConCoda(2, 10);
prova('Σ1/n² (N=10 + coda) − π²/6', (b10 - Math.PI ** 2 / 6).toExponential(2), Math.abs(b10 - Math.PI ** 2 / 6) < 1e-6);
// 2. ζ(4) = π⁴/90, ζ(3) = Apéry 1,2020569031595942
prova('ζ(4) − π⁴/90', (S.zeta(4) - Math.PI ** 4 / 90).toExponential(2), Math.abs(S.zeta(4) - Math.PI ** 4 / 90) < 1e-10);
prova('ζ(3) − 1,2020569031595942', (S.zeta(3) - 1.2020569031595942).toExponential(2), Math.abs(S.zeta(3) - 1.2020569031595942) < 1e-10);
// 3. somma diretta a N = 1e6 contro π²/6 − 1/N (secondo metodo)
let sd = 0; for (let n = 1e6; n >= 1; n--) sd += 1 / (n * n);
prova('Σ_{n≤1e6} 1/n² + 1/1e6 − π²/6', (sd + 1e-6 - Math.PI ** 2 / 6).toExponential(2), Math.abs(sd + 1e-6 - Math.PI ** 2 / 6) < 1e-11);
// 4. Leibniz: ln 2 sempre fra S_N e S_{N+1}, e |S − S_N| ≤ 1/(N+1), per N = 1…500
let tuttiL = true, peggiore = 0;
for (let N = 1; N <= 500; N++) { const E = S.stima('alt', {}, N); if (!(E.basso <= Math.LN2 && Math.LN2 <= E.alto && Math.abs(Math.LN2 - E.S) <= E.resto)) tuttiL = false; peggiore = Math.max(peggiore, Math.abs(Math.LN2 - E.S) / E.resto); }
prova('limite di Leibniz valido N=1…500 (max errore/limite)', peggiore.toFixed(4), tuttiL && peggiore < 1);
// 5. limiti integrali per p = 2 e p = 1,5 contengono ζ(p)
const E2 = S.stima('basel', {}, 50), E15 = S.stima('p', { p: 1.5 }, 50);
prova('integrale p=2, N=50: basso ≤ π²/6 ≤ alto', E2.basso.toFixed(6) + ' ≤ ' + (Math.PI ** 2 / 6).toFixed(6) + ' ≤ ' + E2.alto.toFixed(6), E2.basso <= Math.PI ** 2 / 6 && Math.PI ** 2 / 6 <= E2.alto);
prova('integrale p=1,5, N=50: contiene ζ(1,5)=2,6123753487', E15.basso.toFixed(6) + '…' + E15.alto.toFixed(6), E15.basso <= 2.6123753486854883 && 2.6123753486854883 <= E15.alto);
// 6. Σ1/n! → e e intervallo del resto
const Ee = S.stima('espo', {}, 12);
prova('Σ_{n<12} 1/n! intervallo contiene e', Ee.basso.toFixed(12) + '…' + Ee.alto.toFixed(12), Ee.basso <= Math.E && Math.E <= Ee.alto);
prova('Σ_{n<20} 1/n! − e', (S.somme('espo', {}, 20)[19] - Math.E).toExponential(2), Math.abs(S.somme('espo', {}, 20)[19] - Math.E) < 1e-15);
// 7. geometrica: resto esatto r^N/(1−r)
const Eg = S.stima('geom', { r: -0.7 }, 30);
prova('geometrica r=−0,7: S_N + resto = 1/(1−r)', Eg.basso, Math.abs(Eg.basso - 1 / 1.7) < 1e-14);
// 8. criteri
const Rg = S.testRapporto('espo', {}), Rp = S.testRapporto('basel', {}), Qp = S.testRadice('p', { p: 2.5 }), Qg = S.testRadice('geom', { r: 1.1 });
prova('rapporto Σ1/n!: L≈0 converge', Rg.L.toExponential(2) + ' ' + Rg.v, Rg.L < 1e-5 && Rg.v === 'conv');
prova('rapporto Σ1/n²: L=1 inconcludente', Rp.L + ' ' + Rp.v, Rp.v === 'nulla');
prova('radice serie p=2,5 inconcludente; geom r=1,1 diverge', Qp.v + ', ' + Qg.v, Qp.v === 'nulla' && Qg.v === 'div');
prova('integrale: p=0,9 diverge, p=1,1 converge, armonica diverge', [S.testIntegrale('p', { p: 0.9 }), S.testIntegrale('p', { p: 1.1 }), S.testIntegrale('arm', {})].join(','), S.testIntegrale('p', { p: 0.9 }) === 'div' && S.testIntegrale('p', { p: 1.1 }) === 'conv' && S.testIntegrale('arm', {}) === 'div');
// 9. armonica: H_N − ln N → γ (secondo metodo per la divergenza logaritmica)
const H = S.somme('arm', {}, 1e5)[1e5 - 1];
prova('H_1e5 − ln 1e5 − 1/(2·1e5) = γ 0,5772156649', H - Math.log(1e5) - 0.5e-5, Math.abs(H - Math.log(1e5) - 0.5e-5 - 0.5772156649015329) < 1e-10);
// 10. riordino goloso: raggiunge T entro il limite rigoroso, per vari T
[-2, 0, 1.5, 3].forEach(function (T) {
  const R = S.riordina(T, 100000), e = Math.abs(R.somme[99999] - T);
  prova('riordino T=' + T + ' (1e5 termini): |S−T| ≤ limite < 2e-3', e.toExponential(2) + ' ≤ ' + R.limite.toExponential(2), e <= R.limite && R.limite < 2e-3);
});
// 11. la permutazione usa ogni termine una volta sola (positivi dispari 1…, negativi pari 2…)
const Rr = S.riordina(1, 5000), visti = {}; let unici = true; Rr.idx.forEach(n => { if (visti[n]) unici = false; visti[n] = 1; });
const maxP = Math.max(...Rr.idx.filter(n => n % 2)), maxN = Math.max(...Rr.idx.filter(n => n % 2 === 0));
prova('permutazione: indici distinti e senza buchi', Rr.pos + ' pos (max ' + maxP + '), ' + Rr.neg + ' neg (max ' + maxN + ')', unici && maxP === 2 * Rr.pos - 1 && maxN === 2 * Rr.neg);
// 12. stessa permutazione su Σ(−1)ⁿ⁺¹/n² → π²/12 (assolutamente convergente)
const Rb = S.riordina(2, 200000), B = S.applica(Rb.idx, n => (n % 2 ? 1 : -1) / (n * n));
prova('riordino T=2 applicato a Σ(−1)ⁿ⁺¹/n²: → π²/12', B[B.length - 1].toFixed(6) + ' vs ' + (Math.PI ** 2 / 12).toFixed(6), Math.abs(B[B.length - 1] - Math.PI ** 2 / 12) < 2e-3);
// 13. riordino a blocchi 2 positivi, 1 negativo → (3/2) ln 2
const b21 = S.blocchi(2, 1, 100000);
prova('blocchi (2,1) → 1,5 ln 2 = 1,0397208', b21.toFixed(7), Math.abs(b21 - 1.5 * Math.LN2) < 1e-5);
// 14. raggi: rapporto e Cauchy–Hadamard
const att = { geom: 1, log: 1, log1p: 1, espo: Infinity, mezzi: 2, atan: 1, runge: 1, fatt: 0 };
Object.keys(att).forEach(function (k) {
  const a = S.raggioRapporto(k).R, b = S.raggioRadice(k).R;
  prova('raggio ' + k + ' (rapporto, radice)', a + ', ' + b, a === att[k] && b === att[k]);
});
// 15. somme parziali contro la funzione dentro il disco
prova('Σ(−1)ⁿ⁺¹ xⁿ/n a x=0,5, N=40 → ln 1,5', S.sommaPot('log1p', 0.5, 40), Math.abs(S.sommaPot('log1p', 0.5, 40) - Math.log(1.5)) < 1e-13);
prova('Σ xⁿ/n! a x=2, N=30 → e²', S.sommaPot('espo', 2, 30), Math.abs(S.sommaPot('espo', 2, 30) - Math.exp(2)) < 1e-12);
const zc = S.sommaPotC('geom', 0, 0.5, 60);
prova('Σ zⁿ a z=0,5i → 1/(1−0,5i) = 0,8+0,4i', zc.map(v => v.toFixed(12)).join(' + i'), Math.abs(zc[0] - 0.8) < 1e-12 && Math.abs(zc[1] - 0.4) < 1e-12);
prova('1/(1+x²) a x=1,2: le somme parziali divergono', S.sommaPot('runge', 1.2, 40).toExponential(2), Math.abs(S.sommaPot('runge', 1.2, 40)) > 100);
// 16. successioni: soglia N
prova('1/n, ε=0,01: N = 101', S.soglia('inv', 0.01), S.soglia('inv', 0.01) === 101);
const Ng = S.soglia('geo', 0.001), Ngt = Math.floor(Math.log(0.001) / Math.log(0.9)) + 1;
prova('0,9ⁿ, ε=0,001: N = ⌊ln ε/ln 0,9⌋+1 = ' + Ngt, Ng, Ng === Ngt);
// (1+1/n)ⁿ: bisezione sulla funzione continua e − (1+1/x)^x = ε (decrescente)
function radE(eps) { let a = 1, b = 1e7; for (let i = 0; i < 200; i++) { const m = (a + b) / 2; (Math.E - Math.pow(1 + 1 / m, m) > eps) ? a = m : b = m; } return Math.floor(a) + 1; }
prova('(1+1/n)ⁿ, ε=0,001: N = bisezione ' + radE(0.001), S.soglia('e', 0.001), S.soglia('e', 0.001) === radE(0.001));
prova('sin n/n, ε=0,01: N ≤ ⌈1/ε⌉', S.soglia('sinn', 0.01), S.soglia('sinn', 0.01) <= 100);
prova('(−1)ⁿ: nessun N per ε=0,5', S.soglia('alt', 0.5), S.soglia('alt', 0.5) === null);
prova('lnFatt(1000) Stirling vs somma', S.lnFatt(1000) - (() => { let s = 0; for (let i = 2; i <= 1000; i++) s += Math.log(i); return s; })(), Math.abs(S.lnFatt(1000) - (() => { let s = 0; for (let i = 2; i <= 1000; i++) s += Math.log(i); return s; })()) < 1e-9);
console.log('\n' + ok + ' superati, ' + ko + ' falliti');
