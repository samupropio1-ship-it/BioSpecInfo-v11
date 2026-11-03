// verifica della scheda 3D «trasformazioni dello spazio» di F.calcolo.lineare (v238): determinante esatto contro
// prodotto misto, autovettori come rette invarianti di M(s) = (1 − s)I + sA, volume = |det|
const C = require('./carica.js')(['bsi-mat-cas.js', 'bsi-mat-lineare.js']);
const L = C.lineare; let ok = 0, ko = 0;
function prova(nome, val, cond) { const r = !!cond; r ? ok++ : ko++; console.log((r ? 'OK ' : 'KO ') + nome + ' → ' + val); }
const ap = (M, v) => M.map(r => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]);

// 1. determinante in frazioni esatte = prodotto misto delle colonne = prodotto degli autovalori
{ const R = L.analizza3('1 2 0\n0 2 0\n1 1 3'), pm = L.prodottoMisto(R.A), pr = R.E.valori.reduce((p, d) => p * Math.pow(d.re, d.molt), 1);
  prova('A con λ = 1, 2, 3: det = 6 esatto = prodotto misto = Πλ', R.K.str(R.det) + ' / ' + pm + ' / ' + pr, R.K.str(R.det) === '6' && Math.abs(pm - 6) < 1e-12 && Math.abs(pr - 6) < 1e-9); }
// 2. ogni retta disegnata e' davvero invariante: |Av − λv| ≈ 0 (non simmetrica e simmetrica)
{ let m = 0, n = 0; ['1 2 0\n0 2 0\n1 1 3', '2 1 0\n1 2 1\n0 1 2', '2 0 0\n0 1/2 0\n0 0 3/2'].forEach(s => { const R = L.analizza3(s); R.rette.forEach(r => { const w = ap(R.A, r.v); m = Math.max(m, Math.hypot(w[0] - r.lambda * r.v[0], w[1] - r.lambda * r.v[1], w[2] - r.lambda * r.v[2])); n++; }); });
  prova('tre matrici: ' + n + ' autovettori, max |Av − λv|', m.toExponential(1), n === 9 && m < 1e-9); }
// 3. le rette restano invarianti per ogni s: M(s)v = (1 − s + sλ)v
{ const R = L.analizza3('1 2 0\n0 2 0\n1 1 3'); let m = 0; [0.1, 0.37, 0.5, 0.83].forEach(s => { const M = L.interpola(R.A, s); R.rette.forEach(r => { const w = ap(M, r.v), f = 1 - s + s * r.lambda; m = Math.max(m, Math.hypot(w[0] - f * r.v[0], w[1] - f * r.v[1], w[2] - f * r.v[2])); }); });
  prova('M(s)v = (1 − s + sλ)v per s = 0,1 … 0,83', m.toExponential(1), m < 1e-9); }
// 4. il volume durante l'animazione: det M(s) = Π(1 − s + sλᵢ)
{ const R = L.analizza3('2 1 0\n1 2 1\n0 1 2'), lam = [2, 2 - Math.SQRT2, 2 + Math.SQRT2]; let m = 0; for (let s = 0; s <= 1; s += 0.05) m = Math.max(m, Math.abs(L.det3n(L.interpola(R.A, s)) - lam.reduce((p, l) => p * (1 - s + s * l), 1)));
  prova('simmetrica: det M(s) = Π(1 − s + sλ), λ = 2, 2 ± √2', m.toExponential(1), m < 1e-12 && R.K.str(R.det) === '4'); }
// 5. simmetrica: autovettori ortonormali (teorema spettrale)
{ const R = L.analizza3('2 1 0\n1 2 1\n0 1 2'), v = R.rette.map(r => r.v), d = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  prova('simmetrica: vᵢ·vⱼ = 0', [d(v[0], v[1]), d(v[0], v[2]), d(v[1], v[2])].map(x => x.toExponential(1)).join(', '), Math.abs(d(v[0], v[1])) < 1e-9 && Math.abs(d(v[0], v[2])) < 1e-9 && Math.abs(d(v[1], v[2])) < 1e-9); }
// 6. riflessione: det = −1 e a s = 1/2 il cubo e' piatto (det M = 0), poi orientazione rovesciata
{ const R = L.analizza3('1 0 0\n0 1 0\n0 0 -1');
  prova('riflessione: det −1, det M(1/2) = 0, det M(0,75) < 0', R.K.str(R.det) + ', ' + L.det3n(L.interpola(R.A, 0.5)) + ', ' + L.det3n(L.interpola(R.A, 0.75)), R.K.str(R.det) === '−1' && L.det3n(L.interpola(R.A, 0.5)) === 0 && L.det3n(L.interpola(R.A, 0.75)) < 0); }
// 7. taglio: λ = 1 triplo con un piano di autovettori (molteplicita' geometrica 2), det 1
{ const R = L.analizza3('1 1 0\n0 1 0\n0 0 1');
  prova('taglio: λ = 1 (×3), autospazio di dimensione 2', R.E.valori.map(d => d.re + '×' + d.molt).join(',') + ' / ' + R.rette.length + ' rette, dim ' + R.rette[0].dimensione, R.E.valori.length === 1 && R.E.valori[0].molt === 3 && R.rette.length === 2 && R.rette[0].dimensione === 2 && R.K.str(R.det) === '1'); }
// 8. rotazione di 90° con allungamento: λ = ±i complessi e una sola retta reale (l'asse z, λ = 3/2)
{ const R = L.analizza3('0 -1 0\n1 0 0\n0 0 3/2'), cx = R.E.valori.filter(d => d.im);
  prova('rotazione: coppia ±i, una retta (asse z) con λ = 3/2', cx.map(d => d.re + (d.im > 0 ? '+' : '') + d.im + 'i').join(', ') + ' / ' + R.rette.map(r => r.lambda + ':' + r.v.map(x => Math.abs(x).toFixed(3)).join(',')).join(';'), cx.length === 2 && cx.every(d => Math.abs(d.re) < 1e-12 && Math.abs(Math.abs(d.im) - 1) < 1e-12) && R.rette.length === 1 && R.rette[0].lambda === 1.5 && Math.abs(Math.abs(R.rette[0].v[2]) - 1) < 1e-12); }
// 9. una matrice che non e' 3 × 3 viene rifiutata
{ let msg = ''; try { L.analizza3('1 2\n3 4'); } catch (e) { msg = e.message; } prova('2 × 2 rifiutata con un messaggio', msg, /3 × 3/.test(msg)); }

console.log('\n' + ok + ' superati, ' + ko + ' falliti');
process.exit(ko ? 1 : 0);
