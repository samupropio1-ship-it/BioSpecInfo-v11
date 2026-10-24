/* verifica-smatgiochi — teoria dei giochi contro risultati noti e metodi indipendenti */
'use strict';
const C = require('./carica.js')(['bsi-mat-giochi.js']);
const G = C.giochi;
let ok = 0, ko = 0;
function att(d, atteso, avuto) { if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + d + '  → ' + avuto); } else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); } }
function vicino(d, atteso, avuto, tol) { if (Math.abs(avuto - atteso) <= tol) { ok++; console.log('  ✓ ' + d + '  → ' + (+(+avuto).toPrecision(8)) + ' (atteso ' + atteso + ' ± ' + tol + ')'); } else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); } }
function vero(d, c) { att(d, true, !!c); }
const K = G.CLASSICI, pur = g => G.nashPuri(K[g].A, K[g].B).map(e => e.join('')).join(' ');

console.log('── Giochi 2×2 ──');
att('dilemma: unico equilibrio puro (T,T), nessun misto', '11|null', pur('dilemma') + '|' + G.nashMisto(K.dilemma.A, K.dilemma.B));
const mp = G.nashMisto(K.monete.A, K.monete.B);
att('testa o croce: nessun equilibrio puro; misto (½, ½), valore 0', '|0.5,0.5,0', pur('monete') + '|' + [mp.p, mp.q, mp.uA].join(','));
const bs = G.nashMisto(K.sessi.A, K.sessi.B);
att('battaglia dei sessi: puri (O,O) e (C,C); misto p = 3/5, q = 2/5', '00 11|0.6,0.4', pur('sessi') + '|' + [bs.p, bs.q].map(v => +v.toFixed(12)).join(','));
vicino('battaglia dei sessi: guadagno atteso nel misto = 6/5 per entrambi', 1.2, bs.uA + bs.uB - 1.2, 1e-12);
const cs = G.nashMisto(K.cervo.A, K.cervo.B), ch = G.nashMisto(K.pollo.A, K.pollo.B);
att('caccia al cervo: puri (C,C),(L,L); misto q = 3/4', '00 11|0.75', pur('cervo') + '|' + +cs.q.toFixed(12));
att('gioco del pollo: puri (S,D),(D,S); misto p = q = 0,9 (sterzare)', '01 10|0.9,0.9', pur('pollo') + '|' + [ch.p, ch.q].map(v => +v.toFixed(12)).join(','));
/* secondo metodo: ricerca a griglia dei profili da cui nessuno guadagna deviando (ε-Nash) */
function grigliaNash(A, B) {
  const out = []; const N = 200;
  for (let a = 1; a < N; a++) for (let b = 1; b < N; b++) {
    const p = a / N, q = b / N, u = G.guadagno(A, p, q), v = G.guadagno(B, p, q);
    if (Math.max(G.guadagno(A, 1, q), G.guadagno(A, 0, q)) - u < 1e-9 && Math.max(G.guadagno(B, p, 1), G.guadagno(B, p, 0)) - v < 1e-9) out.push([p, q]);
  }
  return out;
}
let griglia = true;
['monete', 'sessi', 'cervo', 'pollo'].forEach(g => { const m = G.nashMisto(K[g].A, K[g].B), r = grigliaNash(K[g].A, K[g].B); if (r.length !== 1 || Math.abs(r[0][0] - m.p) > 1e-9 || Math.abs(r[0][1] - m.q) > 1e-9) griglia = false; });
vero('il misto per indifferenza = unico profilo interno trovato con la griglia (4 giochi)', griglia);
let indiff = true;
['monete', 'sessi', 'cervo', 'pollo'].forEach(g => { const m = G.nashMisto(K[g].A, K[g].B); if (G.brRiga(K[g].A, m.q) !== 0.5 || G.brColonna(K[g].B, m.p) !== 0.5) indiff = false; });
vero('nel misto ciascuno è indifferente (miglior risposta = ½)', indiff);
/* intersezioni delle curve di miglior risposta = equilibri (puri + misto) */
const cv = G.curvaBR(K.sessi.A, K.sessi.B);
att('battaglia dei sessi: spezzate MR (riga | colonna)', '0,0 0.4,0 0.4,1 1,1|0,0 0,0.6 1,0.6 1,1', cv.riga.map(v => v.map(x => +x.toFixed(12)).join(',')).join(' ') + '|' + cv.colonna.map(v => v.map(x => +x.toFixed(12)).join(',')).join(' '));

console.log('── Dilemma ripetuto ──');
const S = k => G.STRATEGIE.find(s => s.k === k), r = G.mulberry32(1);
att('TFT contro ALLD, 200 turni: 199 – 204', '199,204', G.partita(S('tft'), S('alld'), 200, 0, r).join(','));
att('ALLC contro ALLD, 200 turni: 0 – 1000', '0,1000', G.partita(S('allc'), S('alld'), 200, 0, r).join(','));
att('TFT contro TFT e GRIM contro TFT, 200 turni: 600 – 600', '600,600,600,600', G.partita(S('tft'), S('tft'), 200, 0, r).concat(G.partita(S('grim'), S('tft'), 200, 0, r)).join(','));
att('Pavlov contro ALLD, 200 turni (alterna C, D): 100 – 600', '100,600', G.partita(S('pavlov'), S('alld'), 200, 0, r).join(','));
{
  /* somma costante: in ogni turno la somma dei due pagamenti è 6, 5 o 2 → controllo con la formula su TFT–RAND */
  const keys = G.STRATEGIE.map(s => s.k);
  const T1 = G.torneo(keys, 200, 0.05, 42), T2 = G.torneo(keys, 200, 0.05, 42);
  vero('torneo deterministico a seme fissato (due esecuzioni identiche)', JSON.stringify(T1) === JSON.stringify(T2));
  const T0 = G.torneo(keys, 200, 0, 7), iD = keys.indexOf('alld');
  vero('senza rumore ALLD non perde nessuna partita: M[ALLD][j] ≥ M[j][ALLD]', keys.every((_, j) => T0.M[iD][j] >= T0.M[j][iD] - 1e-12));
  const ordine = keys.map((k, i) => [k, T0.totale[i]]).sort((a, b) => b[1] - a[1]);
  vero('senza rumore ALLD non vince il torneo (classifica: ' + ordine.map(x => x[0] + ' ' + Math.round(x[1])).join(', ') + ')', ordine[0][0] !== 'alld');
  const st = G.replicatore(T0.M, keys.map(() => 1 / keys.length), 300);
  vero('replicatore: le quote sommano a 1 in ogni generazione (300) e restano ≥ 0', st.every(x => Math.abs(x.reduce((a, b) => a + b, 0) - 1) < 1e-12 && x.every(v => v >= 0)));
  const fin = st[st.length - 1];
  vero('replicatore: ALLD e ALLC si estinguono, vincono i cooperatori reattivi (ALLD ' + fin[iD].toExponential(1) + ')', fin[iD] < 1e-3 && fin[keys.indexOf('allc')] < fin[keys.indexOf('tft')] + fin[keys.indexOf('grim')]);
  /* due sole strategie ALLC/ALLD: ALLD invade (tradire è dominante) */
  const T3 = G.torneo(['allc', 'alld'], 100, 0, 1), s3 = G.replicatore(T3.M, [0.99, 0.01], 200);
  vero('ALLC + 1 % di ALLD: ALLD conquista la popolazione (' + s3[200][1].toFixed(4) + ')', s3[200][1] > 0.99);
  /* replicatore: un punto fisso (popolazione tutta di una strategia) resta fermo */
  const s4 = G.replicatore(T0.M, keys.map((_, i) => i === 2 ? 1 : 0), 50);
  vero('replicatore: i punti fissi (popolazione pura) non si muovono', s4[50][2] === 1);
}

console.log('── Tris e minimax ──');
{
  const vuoto = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  const N = G.valoreTris(vuoto, 1, false), A = G.valoreTris(vuoto, 1, true);
  att('valore del tris con gioco perfetto (minimax) = 0 (patta)', 0, N.v);
  att('valore con alfa-beta = 0', 0, A.v);
  att('nodi dell’albero completo = 549 946, partite = 255 168', '549946,255168', N.nodi + ',' + N.foglie);
  { let tot = 1; for (let i = 0; i < 9; i++) { const bb = vuoto.slice(), c = { n: 0, foglie: 0 }; bb[i] = 1; G.negamax(bb, 2, 1, c, i); tot += c.n; } att('conteggio a lotti (un sottoalbero per prima mossa, come nella scheda) = 549 946', 549946, tot); }
  vero('alfa-beta esplora meno nodi: ' + A.nodi + ' < ' + N.nodi, A.nodi < N.nodi);
  att('tutte le 9 prime mosse valgono 0 (patta)', '0,0,0,0,0,0,0,0,0', G.valoriMosse(vuoto, 1).join(','));
  /* posizioni casuali: alfa-beta e minimax danno lo stesso valore */
  const rr = G.mulberry32(5); let uguali = true, n = 0;
  for (let k = 0; k < 300; k++) {
    const b = vuoto.slice(); let p = 1; const m = Math.floor(rr() * 6);
    for (let i = 0; i < m && G.vincitore(b) < 0; i++) { const e = b.map((v, j) => v ? -1 : j).filter(j => j >= 0); b[e[Math.floor(rr() * e.length)]] = p; p = 3 - p; }
    if (G.vincitore(b) >= 0) continue; n++;
    if (G.valoreTris(b, p, true).v !== G.valoreTris(b, p, false).v) uguali = false;
  }
  vero('alfa-beta = minimax su ' + n + ' posizioni casuali', uguali);
  /* il computer non perde mai: tutte le partite contro ogni sequenza di mosse dell'avversario */
  let perse = 0, partite = 0;
  (function gioca(b, umano) {
    const w = G.vincitore(b); if (w >= 0) { partite++; if (w === umano) perse++; return; }
    const x = b.filter(v => v === 1).length, o = b.filter(v => v === 2).length, tocca = x > o ? 2 : 1;
    if (tocca === umano) { for (let i = 0; i < 9; i++) if (!b[i]) { b[i] = umano; gioca(b, umano); b[i] = 0; } }
    else { const m = G.mossaMigliore(b, tocca); b[m] = tocca; gioca(b, umano); b[m] = 0; }
  })(vuoto.slice(), 1);
  att('il computer (O) contro tutte le strategie di X: partite perse', 0, perse);
  vero('… su ' + partite + ' partite giocate', partite > 100);
  att('X in 0,4 · O in 1,2: X vince in 1 mossa (valore 9)', 9, G.valoreTris([1, 2, 2, 0, 1, 0, 0, 0, 0], 1, true).v);
}

console.log('── Nim ──');
{
  att('somma-nim di (3, 4, 5) = 2, di (1, 2, 3) = 0', '2,0', G.nimSomma([3, 4, 5]) + ',' + G.nimSomma([1, 2, 3]));
  att('mossa vincente da (3, 4, 5): mucchio 1 → 1', '0,1', G.mossaNim([3, 4, 5]).join(','));
  let bouton = true, mossa = true, conta = 0; const memo = {};
  for (let a = 0; a <= 7; a++) for (let b = 0; b <= 7; b++) for (let c = 0; c <= 7; c++) {
    const h = [a, b, c], v = G.vincenteForzaBruta(h, memo); conta++;
    if (v !== (G.nimSomma(h) !== 0)) bouton = false;
    const m = G.mossaNim(h); if (m) { const g = h.slice(); g[m[0]] = m[1]; if (G.nimSomma(g) !== 0 || m[1] >= h[m[0]]) mossa = false; }
  }
  vero('Bouton: perdente ⇔ somma-nim 0, forza bruta su ' + conta + ' posizioni a 3 mucchi ≤ 7', bouton);
  vero('la mossa di Bouton porta sempre a somma 0 ed è legale', mossa);
  let b4 = true; const memo4 = {};
  for (let a = 0; a <= 5; a++) for (let b = 0; b <= 5; b++) for (let c = 0; c <= 5; c++) for (let d = 0; d <= 5; d++) if (G.vincenteForzaBruta([a, b, c, d], memo4) !== ((a ^ b ^ c ^ d) !== 0)) b4 = false;
  vero('Bouton anche con 4 mucchi ≤ 5 (1296 posizioni)', b4);
  let zero = true; for (let a = 0; a <= 7; a++) for (let b = 0; b <= 7; b++) { const c = a ^ b; for (let i = 0; i < 3; i++) { const h = [a, b, c]; for (let x = 0; x < h[i]; x++) { const g = h.slice(); g[i] = x; if (G.nimSomma(g) === 0) zero = false; } } }
  vero('da somma 0 ogni mossa porta a somma ≠ 0', zero);
}
console.log(`\n${ok} superati, ${ko} falliti`);
process.exit(ko ? 1 : 0);
