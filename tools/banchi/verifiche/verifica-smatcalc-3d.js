// verifica della scheda 3D «solidi di rotazione» di F.calcolo.calcoloinf (v238): volumi con i dischi e con
// l'integrale, contro le formule della geometria e fra loro
const C = require('./carica.js')(['bsi-mat-cas.js', 'bsi-mat-calcolo.js']);
const K = C.calcoloinf, CAS = C.cas; let ok = 0, ko = 0;
function prova(nome, val, cond) { const r = !!cond; r ? ok++ : ko++; console.log((r ? 'OK ' : 'KO ') + nome + ' → ' + val); }
const PI = Math.PI, L = s => CAS.leggi(s);

// 1. sfera: π∫(1 − x²) su [−1, 1] = 4π/3, numerico ed esatto (primitiva di f²)
{ const V = K.volumeRotazione(L('sqrt(1 - x^2)'), 'x', -1, 1);
  prova('sfera unitaria: V = 4π/3 (Simpson e primitiva)', V.valore.toFixed(12) + ' / ' + (V.esatto ? V.esatto.valore.toFixed(12) : '—'), Math.abs(V.valore - 4 * PI / 3) < 1e-9 && V.esatto && Math.abs(V.esatto.valore - 4 * PI / 3) < 1e-12); }
// 2. cono di raggio 1,5 e altezza 3: πr²h/3
{ const V = K.volumeRotazione(L('x/2'), 'x', 0, 3);
  prova('cono r = 1,5, h = 3: V = πr²h/3', V.valore.toFixed(12) + ' / ' + (PI * 2.25).toFixed(12), Math.abs(V.valore - PI * 2.25) < 1e-10); }
// 3. fuso di sin x su [0, π]: π²/2
{ const V = K.volumeRotazione(L('sin(x)'), 'x', 0, PI);
  prova('fuso sin x: V = π²/2', V.valore.toFixed(12), Math.abs(V.valore - PI * PI / 2) < 1e-10); }
// 4. i dischi al punto medio convergono all'integrale con ordine 2 (errore / 4 raddoppiando n)
{ const f = CAS.funzione(L('sqrt(1 - x^2)'), 'x'), e = n => K.volumeDischi(f, -1, 1, n).valore - 4 * PI / 3, r1 = e(10) / e(20), r2 = e(40) / e(80);
  prova('sfera: errore(n)/errore(2n) → 4 (n = 10 e 40)', r1.toFixed(4) + ', ' + r2.toFixed(4), Math.abs(r1 - 4) < 0.01 && Math.abs(r2 - 4) < 0.01); }
// 5. un cilindro: un solo disco basta ed e' esatto (πr²h)
{ const D = K.volumeDischi(() => 2, 0, 3, 1);
  prova('cilindro r = 2, h = 3: un disco = 12π', D.valore.toFixed(12), Math.abs(D.valore - 12 * PI) < 1e-12 && D.dischi.length === 1); }
// 6. superficie laterale: sfera 4π, cono π r √(r² + h²)
{ const As = K.areaLaterale(L('sqrt(1 - x^2)'), 'x', -1, 1), Ac = K.areaLaterale(L('x/2'), 'x', 0, 3), ac = PI * 1.5 * Math.sqrt(2.25 + 9);
  prova('superficie: sfera 4π, cono πr√(r² + h²)', As.toFixed(8) + ', ' + Ac.toFixed(10), Math.abs(As - 4 * PI) < 1e-5 && Math.abs(Ac - ac) < 1e-9); }
// 7. tromba di Gabriele su [1, b]: V = π(1 − 1/b) → π, area > 2π ln b → ∞
{ const b = 50, V = K.volumeRotazione(L('1/x'), 'x', 1, b), A = K.areaLaterale(L('1/x'), 'x', 1, b);
  prova('tromba 1/x su [1, 50]: V = π(1 − 1/50), area > 2π ln 50', V.valore.toFixed(10) + ', ' + A.toFixed(4) + ' > ' + (2 * PI * Math.log(b)).toFixed(4), Math.abs(V.valore - PI * (1 - 1 / b)) < 1e-9 && A > 2 * PI * Math.log(b)); }
// 8. il vaso 2 + cos x su [0, 2π]: V = π(4·2π + π) = 9π² (calcolo a mano)
{ const V = K.volumeRotazione(L('2 + cos(x)'), 'x', 0, 2 * PI);
  prova('vaso 2 + cos x: V = 9π²', V.valore.toFixed(10) + ' / ' + (9 * PI * PI).toFixed(10), Math.abs(V.valore - 9 * PI * PI) < 1e-9); }

console.log('\n' + ok + ' superati, ' + ko + ' falliti');
process.exit(ko ? 1 : 0);
