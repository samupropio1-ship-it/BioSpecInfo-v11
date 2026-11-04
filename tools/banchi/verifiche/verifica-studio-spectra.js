/* verifica dei calcoli delle lezioni dello studio di Spectra (bsi-spectra-studio-lezioni.js):
   ogni numero che compare in scena o nella dimostrazione contro la soluzione esatta o un secondo metodo */
'use strict';
global.window = undefined;
const L = require('../../../bsi-spectra-studio-lezioni.js'), C = L.calcolo;
let n = 0, ko = 0;
function ok(nome, val, cond) { n++; if (!cond) ko++; console.log((cond ? '  ✓ ' : '  ✗ ') + nome + ' → ' + val); }

/* ── la caduta ── */
const R = C.caduta(20, 6, 9.81, 1e-4);
ok('caduta: tempo esatto √(2h/g) per h = 20 m', R.esatto.toFixed(4), Math.abs(R.esatto - 2.0193) < 1e-4);
ok('le due sfere toccano terra insieme (integrazione numerica)', R.tA.toFixed(4) + ' / ' + R.tB.toFixed(4), Math.abs(R.tA - R.tB) < 1e-9 && Math.abs(R.tA - R.esatto) < 1e-3);
ok('gittata v₀√(2h/g) = 12,12 m', R.gittata.toFixed(3) + ' / ' + R.gittataEsatta.toFixed(3), Math.abs(R.gittata - R.gittataEsatta) < 2e-3);
const Ra = C.caduta(20, 6, 9.81, 1e-4, 0.02);
ok('con l\'aria (k = 0,02 m⁻¹) la sfera lanciata arriva dopo', Ra.tA.toFixed(4) + ' < ' + Ra.tB.toFixed(4), Ra.tB > Ra.tA + 1e-3);
ok('il passo d\'integrazione dimezzato cambia il tempo meno di 1e-4', '', Math.abs(C.caduta(20, 6, 9.81, 5e-5).tA - R.tA) < 1e-4);

/* ── la forma dell'acqua (VSEPR come minimo di energia) ── */
const geo = (b, l, w) => C.vsepr(b, l, w, 20000).angolo;
const tetra = Math.acos(-1 / 3) * 180 / Math.PI;
ok('quattro domini uguali: tetraedro arccos(−1/3) = 109,47°', geo(4, 0, 1).toFixed(3), Math.abs(geo(4, 0, 1) - tetra) < 0.01);
ok('tre domini: trigonale 120°', geo(3, 0, 1).toFixed(3), Math.abs(geo(3, 0, 1) - 120) < 0.01);
ok('due domini: lineare 180°', geo(2, 0, 1).toFixed(3), Math.abs(geo(2, 0, 1) - 180) < 0.01);
const acqua = geo(2, 2, 1.25), ammoniaca = geo(3, 1, 1.25);
ok('acqua (w = 1,25): 104,5° ± 0,3 (sperimentale 104,5°)', acqua.toFixed(2), Math.abs(acqua - 104.5) < 0.3);
ok('ammoniaca con lo stesso w (previsione, non calibrata): 106,7° ± 0,5', ammoniaca.toFixed(2), Math.abs(ammoniaca - 106.7) < 0.5);
ok('i doppietti piu\' ingombranti stringono l\'angolo (monotonia in w)', [1, 1.1, 1.2, 1.3].map(w => geo(2, 2, w).toFixed(1)).join(' > '), geo(2, 2, 1) > geo(2, 2, 1.1) && geo(2, 2, 1.1) > geo(2, 2, 1.2) && geo(2, 2, 1.2) > geo(2, 2, 1.3));

/* ── il problema di Basilea ── */
const z2 = Math.PI * Math.PI / 6;
ok('S(100 000) = π²/6 entro la coda 1e-5', C.parziale(100000).toFixed(8), Math.abs(C.parziale(100000) - z2) < 1.1e-5);
[10, 100, 1000].forEach(N => { const coda = z2 - C.parziale(N), b = C.coda(N); ok('coda dopo ' + N + ' termini fra 1/(N+1) e 1/N', coda.toExponential(4), coda > b[0] && coda < b[1]); });
ok('tutte le somme parziali sotto il limite 2 del confronto', '', [1, 2, 5, 50, 5000].every(N => C.parziale(N) < 2));
ok('serie di Fourier di x² in x = π → π² (N = 20 000)', C.fourierX2(Math.PI, 20000).toFixed(5) + ' / ' + (Math.PI * Math.PI).toFixed(5), Math.abs(C.fourierX2(Math.PI, 20000) - Math.PI * Math.PI) < 1e-3);
ok('serie di Fourier di x² in x = 1 → 1', C.fourierX2(1, 20000).toFixed(5), Math.abs(C.fourierX2(1, 20000) - 1) < 1e-3);
ok('la serie armonica cresce come ln N + γ (diverge)', C.armonica(1e5).toFixed(4), Math.abs(C.armonica(1e5) - (Math.log(1e5) + 0.5772157)) < 1e-4);
const p = C.coprimi(200000, 1e6, 7);
ok('coprimi: frequenza Monte Carlo → 6/π² = 0,6079 (3σ)', p.toFixed(4), Math.abs(p - 6 / (Math.PI * Math.PI)) < 3 * Math.sqrt(0.608 * 0.392 / 200000));

/* ── la struttura delle lezioni ── */
L.LEZIONI.forEach(le => {
  const giuste = le.predici.opzioni.filter(o => o.giusta).length, livelli = new Set(le.rivela.esercizi.map(e => e.livello));
  ok(le.id + ': una sola risposta giusta, ogni opzione spiegata, ≥ 3 passi di dimostrazione, esercizi su 4 livelli', giuste + ' giusta, ' + le.dimostra.length + ' passi, livelli ' + [...livelli].join(''),
    giuste === 1 && le.predici.opzioni.every(o => o.perche && o.perche.length > 30) && le.dimostra.length >= 3 && livelli.size === 4 && le.rivela.collegamenti.length >= 3);
});

console.log('\n' + (n - ko) + ' superati, ' + ko + ' falliti');
process.exit(ko ? 1 : 0);
