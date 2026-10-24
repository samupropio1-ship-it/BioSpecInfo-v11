/* verifica-smatalgebra — strutture algebriche contro risultati noti e metodi indipendenti */
'use strict';
const C = require('./carica.js')(['bsi-mat-algebra.js']);
const A = C.algebra;
let ok = 0, ko = 0;
function att(d, atteso, avuto) { if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + d + '  → ' + avuto); } else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); } }
function vero(d, c) { att(d, true, !!c); }

console.log('── Gruppi diedrali ──');
for (let n = 3; n <= 8; n++) {
  const G = A.diedrale(n), X = A.assiomi(G);
  vero(`D${n}: |D| = 2n = ${2 * n}, chiuso, associativo, neutro, inversi, NON commutativo`, G.m === 2 * n && X.chiuso && X.associativo && X.identita && X.inversi && !X.commutativo);
}
{
  const G = A.diedrale(4);
  att('D4 ordini degli elementi (e r r² r³ s rs r²s r³s)', '1,4,2,4,2,2,2,2', G.nomi.map((_, i) => A.ordineElem(G, i)).join(','));
  att('D4: rs ≠ sr (rs, sr)', 'rs,r³s', [G.nomi[G.tab[1][4]], G.nomi[G.tab[4][1]]].join(','));
  /* relazione srs = r⁻¹ in ogni Dₙ */
  let rel = true; for (let n = 3; n <= 8; n++) { const D = A.diedrale(n); if (D.tab[D.tab[n][1]][n] !== n - 1) rel = false; }
  vero('srs = r⁻¹ per n = 3…8', rel);
  /* tavola come quadrato latino */
  let lat = true; for (let n = 3; n <= 8; n++) { const D = A.diedrale(n); D.tab.forEach(r => { if (new Set(r).size !== D.m) lat = false; }); for (let j = 0; j < D.m; j++) if (new Set(D.tab.map(r => r[j])).size !== D.m) lat = false; }
  vero('ogni tavola di Cayley è un quadrato latino', lat);
}
/* sottogruppi: τ(n) + σ(n), e controllo per forza bruta su tutti i sottoinsiemi che contengono e */
function forzaBruta(G) {
  let c = 0; const m = G.m;
  for (let mask = 0; mask < 1 << (m - 1); mask++) {
    const S = [0]; for (let i = 1; i < m; i++) if (mask >> (i - 1) & 1) S.push(i);
    const dentro = new Set(S); let chiuso = true;
    for (const a of S) { for (const b of S) if (!dentro.has(G.tab[a][b])) { chiuso = false; break; } if (!chiuso) break; }
    if (chiuso) c++;
  }
  return c;
}
const ts = n => { let s = 0, c = 0; for (let d = 1; d <= n; d++) if (n % d === 0) { s += d; c++; } return s + c; };
const sg = [];
for (let n = 3; n <= 8; n++) { const G = A.diedrale(n); sg.push(A.sottogruppi(G).length + '/' + ts(n) + '/' + forzaBruta(G)); }
att('n° sottogruppi di D3…D8 (enumerati / τ+σ / forza bruta)', '6/6/6,10/10/10,8/8/8,16/16/16,10/10/10,19/19/19', sg.join(','));
att('ℤ12: sottogruppi = divisori di 12 (6)', 6, A.sottogruppi(A.ciclico(12)).length);

console.log('── Permutazioni ──');
const p = A.leggiPermutazione('(1 2 3)(4 5)', 5);
att('ordine di (1 2 3)(4 5) = 6', 6, A.ordineP(p));
att('(1 2 3)(4 5): segno −1, inversioni 3', '-1,3', [A.segno(p), A.inversioni(p)].join(','));
att('lettura in riga «2 3 1 5 4» = (1 2 3)(4 5)', '(1 2 3)(4 5)', A.scriviCicli(A.leggiPermutazione('2 3 1 5 4', 5)));
att('composizione (1 2)(2 3) = (1 2 3) (da destra)', '(1 2 3)', A.scriviCicli(A.leggiPermutazione('(1 2)(2 3)', 3)));
att('S4 per tipo di ciclo (1⁴, 2·1², 2², 3·1, 4)', '1,6,3,8,6', ['1,1,1,1', '2,1,1', '2,2', '3,1', '4'].map(k => A.contaTipi(4).find(r => r.tipo.join(',') === k).conteggio).join(','));
{
  /* formula n!/∏ contro enumerazione di tutte le permutazioni (Heap), n = 4…7 */
  let tutto = true;
  for (let n = 4; n <= 7; n++) { const cnt = {}; const L = A.tuttePermutazioni(n); if (L.length !== [24, 120, 720, 5040][n - 4]) tutto = false; L.forEach(q => { const k = A.tipoCiclo(q).join(','); cnt[k] = (cnt[k] || 0) + 1; }); A.contaTipi(n).forEach(r => { if (cnt[r.tipo.join(',')] !== r.conteggio) tutto = false; }); }
  vero('contaTipi = enumerazione di S4…S7', tutto);
  /* segno moltiplicativo e (−1)^inversioni su tutte le coppie di S5 */
  const S5 = A.tuttePermutazioni(5); let mult = true, inv = true;
  S5.forEach(a => { if (A.segno(a) !== (A.inversioni(a) % 2 ? -1 : 1)) inv = false; S5.forEach(b => { if (A.segno(A.componiP(a, b)) !== A.segno(a) * A.segno(b)) mult = false; }); });
  vero('sgn(στ) = sgn σ · sgn τ su tutte le 14400 coppie di S5', mult);
  vero('sgn σ = (−1)^inversioni su S5', inv);
  att('massimo ordine in S9 (funzione di Landau g(9) = 20)', 20, Math.max(...A.contaTipi(9).map(r => r.tipo.reduce(A.mcm, 1))));
}
{
  /* gioco dell'otto (3×3): BFS di tutti gli stati raggiungibili = 9!/2, e la regola della parità li riconosce tutti */
  const goal = [1, 2, 3, 4, 5, 6, 7, 8, 0], vis = new Set([goal.join('')]), coda = [goal];
  for (let i = 0; i < coda.length; i++) { const b = coda[i], z = b.indexOf(0), r = Math.floor(z / 3), c = z % 3; [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dr, dc]) => { const rr = r + dr, cc = c + dc; if (rr < 0 || rr > 2 || cc < 0 || cc > 2) return; const nb = b.slice(); nb[z] = nb[rr * 3 + cc]; nb[rr * 3 + cc] = 0; const k = nb.join(''); if (!vis.has(k)) { vis.add(k); coda.push(nb); } }); }
  att('8-puzzle: stati raggiungibili = 9!/2 = 181440', 181440, vis.size);
  let accordo = true; A.tuttePermutazioni(9).forEach(q => { if (A.risolvibile(q, 3) !== vis.has(q.join(''))) accordo = false; });
  vero('8-puzzle: regola delle inversioni = BFS su tutti i 362880 stati', accordo);
  /* 15: posizioni casuali, regola delle inversioni contro «parità della permutazione delle 16 caselle = parità della distanza del buco» */
  let acc15 = true, nRis = 0;
  for (let s = 1; s <= 2000; s++) {
    const b = A.posizioneCasuale(s, 4), z = b.indexOf(0), pp = b.map(x => (x === 0 ? 16 : x) - 1), d = (3 - Math.floor(z / 4)) + (3 - z % 4);
    const r2 = (A.segno(pp) > 0) === (d % 2 === 0); if (r2 !== A.risolvibile(b, 4)) acc15 = false; if (r2) nRis++;
  }
  vero('15-puzzle: due regole indipendenti concordano su 2000 posizioni', acc15);
  att('15-puzzle: Loyd 14↔15 irrisolvibile, posizione finale risolvibile', 'false,true', [A.risolvibile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 14, 0], 4), A.risolvibile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0], 4)].join(','));
  vero('15-puzzle: circa metà delle posizioni casuali è risolvibile (' + nRis + '/2000)', nRis > 900 && nRis < 1100);
}

console.log('── Anelli e campi ──');
{
  let phiOk = true; for (let n = 2; n <= 200; n++) { if (A.phi(n) !== A.unita(n).length) phiOk = false; if (A.unita(n).length + A.divisoriZero(n).length !== n - 1) phiOk = false; }
  vero('φ(n) = numero di unità, unità + divisori dello zero = n − 1 (n = 2…200)', phiOk);
  att('φ(12), φ(36), φ(97)', '4,12,96', [A.phi(12), A.phi(36), A.phi(97)].join(','));
  att('radici primitive mod 7 e mod 13', '3,5|2,6,7,11', A.radiciPrimitive(7).join(',') + '|' + A.radiciPrimitive(13).join(','));
  let esiste = true, conta = true; for (let p = 2; p < 300; p++) if (A.primo(p)) { const r = A.radiciPrimitive(p); if (!r.length) esiste = false; if (r.length !== A.phi(p - 1)) conta = false; }
  vero('ogni primo < 300 ha una radice primitiva', esiste);
  vero('il numero di radici primitive di p è φ(p − 1)', conta);
  /* esistono radici primitive solo per n = 1, 2, 4, p^k, 2p^k (Gauss) */
  const conRadici = []; for (let n = 2; n <= 30; n++) if (A.radiciPrimitive(n).length) conRadici.push(n);
  att('n ≤ 30 con radici primitive (2, 4, pᵏ, 2pᵏ)', '2,3,4,5,6,7,9,10,11,13,14,17,18,19,22,23,25,26,27,29', conRadici.join(','));
  let campo = true; for (let n = 2; n <= 60; n++) { const isF = A.unita(n).length === n - 1; if (isF !== A.primo(n)) campo = false; }
  vero('ℤₙ è un campo ⇔ n primo (n ≤ 60)', campo);
  let ferm = true; for (let p = 2; p < 200; p++) if (A.primo(p)) for (let a = 1; a < p; a++) if (A.potMod(a, p - 1, p) !== 1) ferm = false;
  vero('Fermat: a^(p−1) ≡ 1 mod p per tutti i primi < 200', ferm);
  att('Carmichael 561: 2^560 ≡ 1 ma 561 = 3·11·17 non è primo', '1,false', A.potMod(2, 560, 561) + ',' + A.primo(561));
  const L = A.logDiscreto(3, 7); att('log discreto base 3 mod 7: potenze 1 3 2 6 4 5', '1,3,2,6,4,5', L.pot.join(','));
  att('log₃ 6 mod 7 = 3', 3, L.log[6]);
}
{
  const P = A.POLINOMI;
  att('irriducibili: x²+x+1, x³+x+1, x³+x²+1, x⁴+x+1 sì; x²+1, x⁴+x²+1 no', 'true,true,true,true,false,false', [7, 11, 13, 19, 5, 21].map(A.irriducibile).join(','));
  att('numero di irriducibili di grado 4 su GF(2) = 3 (formula di Gauss (2⁴−2²)/4)', 3, (() => { let c = 0; for (let x = 16; x < 32; x++) if (A.irriducibile(x)) c++; return c; })());
  let tutti = true, distr = true, ciclico = true;
  ['gf4', 'gf8', 'gf8b', 'gf16'].forEach(k => {
    const C = A.campoGF(P[k][0], P[k][1]), q = C.q;
    if (!A.ogniNonNulloInvertibile(C.mul, 1)) tutti = false;
    for (let a = 0; a < q; a++) for (let b = 0; b < q; b++) for (let c = 0; c < q; c++) { if (C.mul[a][C.add[b][c]] !== C.add[C.mul[a][b]][C.mul[a][c]]) distr = false; if (C.mul[C.mul[a][b]][c] !== C.mul[a][C.mul[b][c]]) distr = false; }
    /* x (codice 2) genera il gruppo moltiplicativo quando il polinomio è primitivo */
    const s = new Set(); let v = 1; for (let i = 0; i < q - 1; i++) { s.add(v); v = C.mul[v][2]; } if (s.size !== q - 1 || v !== 1) ciclico = false;
  });
  vero('GF(4), GF(8) (due polinomi), GF(16): ogni elemento ≠ 0 ha l’inverso', tutti);
  vero('GF(2ᵏ): distributività e associatività del prodotto', distr);
  vero('GF(2ᵏ): x genera il gruppo moltiplicativo ciclico di ordine q − 1', ciclico);
  const C8 = A.campoGF(3, 11);
  att('GF(8) con x³+x+1: x·x² = x³ = x+1 (codice 3), inverso di x = x²+1 (codice 5)', '3,5', C8.mul[2][4] + ',' + C8.mul[2].indexOf(1));
  let fr = true; for (let a = 1; a < 8; a++) { let v = 1; for (let i = 0; i < 7; i++) v = C8.mul[v][a]; if (v !== 1) fr = false; }
  vero('GF(8): a⁷ = 1 per ogni a ≠ 0 (Fermat nel campo finito)', fr);
}

console.log('── Lagrange ──');
{
  let part = true, div = true, idx = true, nNorm = [];
  for (let n = 3; n <= 8; n++) {
    const G = A.diedrale(n), S = A.sottogruppi(G); let nn = 0;
    S.forEach(H => {
      if (G.m % H.length) div = false;
      [false, true].forEach(dx => { const Cl = A.classi(G, H, dx), tutti = [].concat(...Cl); if (tutti.length !== G.m || new Set(tutti).size !== G.m || Cl.some(c => c.length !== H.length)) part = false; if (Cl.length * H.length !== G.m) idx = false; });
      if (A.normale(G, H)) nn++;
    });
    nNorm.push(nn);
  }
  for (let n = 2; n <= 24; n++) { const G = A.ciclico(n); A.sottogruppi(G).forEach(H => { if (n % H.length) div = false; if (!A.normale(G, H)) idx = false; }); }
  vero('le classi laterali (sinistre e destre) ripartiscono Dₙ in blocchi di |H|', part);
  vero('|H| divide |G| per ogni sottogruppo di D3…D8 e ℤ2…ℤ24', div);
  vero('[G:H]·|H| = |G| e in ℤₙ (abeliano) ogni sottogruppo è normale', idx);
  /* sottogruppi normali di Dₙ: n dispari → τ(n)+1, n pari → τ(n)+3 */
  const tau = n => { let c = 0; for (let d = 1; d <= n; d++) if (n % d === 0) c++; return c; };
  att('n° di sottogruppi normali di D3…D8 (τ(n)+1 dispari, τ(n)+3 pari)', [3, 4, 5, 6, 7, 8].map(n => tau(n) + (n % 2 ? 1 : 3)).join(','), nNorm.join(','));
  const D3 = A.diedrale(3), H = [0, 3];
  att('D3, H = {e, s}: classi sinistre ≠ destre', 'false', A.normale(D3, H));
}
console.log(`\n${ok} superati, ${ko} falliti`);
process.exit(ko ? 1 : 0);
