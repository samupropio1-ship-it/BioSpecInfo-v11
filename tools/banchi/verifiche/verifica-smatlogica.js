/* verifica-smatlogica — logica e calcolabilità contro risultati noti e metodi indipendenti */
'use strict';
const C = require('./carica.js')(['bsi-mat-logica.js']);
const L = C.logica;
let ok = 0, ko = 0;
function att(d, atteso, avuto) { if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + d + '  → ' + avuto); } else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); } }
function vero(d, c) { att(d, true, !!c); }
const cl = f => L.classifica(L.analizza(f));

console.log('── Tavole di verità ──');
att('De Morgan ¬(p∧q) ↔ (¬p∨¬q) e ¬(p∨q) ↔ (¬p∧¬q)', 'tautologia,tautologia', [cl('¬(p ∧ q) ↔ (¬p ∨ ¬q)'), cl('!(p|q) <-> (!p & !q)')].join(','));
att('modus ponens ((p→q)∧p)→q', 'tautologia', cl('((p → q) ∧ p) → q'));
att('contrapposizione (p→q)↔(¬q→¬p)', 'tautologia', cl('(p -> q) <-> (!q -> !p)'));
att('p∧¬p contraddizione, p∨¬p tautologia, p→q soddisfacibile', 'contraddizione,tautologia,soddisfacibile', [cl('p & !p'), cl('p | ~p'), cl('p => q')].join(','));
att('fallacia: affermare il conseguente ((p→q)∧q)→p non è una tautologia', 'soddisfacibile', cl('((p→q)∧q)→p'));
att('precedenze: p ∨ q ∧ r = p ∨ (q ∧ r); p → q → r = p → (q → r); ¬p ∧ q = (¬p) ∧ q', 'p ∨ (q ∧ r)|p → (q → r)|¬p ∧ q', [L.stampa(L.analizza('p | q & r'), true), L.stampa(L.analizza('p -> q -> r'), true), L.stampa(L.analizza('!p & q'), true)].join('|'));
att('tavola di (p∧q)∨(r∧s): 16 righe, 7 vere', '16,7', (() => { const T = L.tavola(L.analizza('(p∧q)∨(r∧s)')); return T.righe.length + ',' + T.righe.filter(r => r.val).length; })());
att('p ↔ q ↔ r è vera con un numero pari di falsi: 4 righe vere su 8', 4, L.tavola(L.analizza('p↔q↔r')).righe.filter(r => r.val).length);
att('FND e FNC di p → q', '(¬p ∧ ¬q) ∨ (¬p ∧ q) ∨ (p ∧ q)|¬p ∨ q', L.fnd(L.analizza('p→q')) + '|' + L.fnc(L.analizza('p→q')));
{
  /* formule casuali: FND e FNC rilette dal parser sono equivalenti all'originale (2⁴ assegnamenti) */
  const r = (s => () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; })(7);
  function casuale(d) { if (d === 0 || r() < 0.25) return 'pqrs'[Math.floor(r() * 4)]; const o = Math.floor(r() * 5); if (o === 0) return '¬' + casuale(d - 1); return '(' + casuale(d - 1) + ' ' + '∧∨→↔'[o - 1] + ' ' + casuale(d - 1) + ')'; }
  let fn = true, n = 0, err = [];
  for (let k = 0; k < 300; k++) { const f = casuale(4), A = L.analizza(f); n++; if (!L.equivalenti(f, L.fnd(A)) || !L.equivalenti(f, L.fnc(A)) || !L.equivalenti(f, L.stampa(A, true))) { fn = false; err.push(f); } }
  vero('FND, FNC e la riscrittura sono equivalenti all’originale su ' + n + ' formule casuali', fn);
  /* secondo metodo: la valutazione via albero contro la traduzione in JavaScript della formula */
  let js = true;
  for (let k = 0; k < 300; k++) {
    const f = casuale(4), A = L.analizza(f);
    const src = f.replace(/¬/g, '!').replace(/∧/g, '&&').replace(/∨/g, '||');
    const tr = s => { /* → e ↔ come funzioni, risolvendo dall'interno le parentesi */ while (/\(([^()]*)\)/.test(s)) s = s.replace(/\(([^()]*)\)/, (m, x) => '«' + enc(x) + '»'); return dec(s); };
    const pez = []; const enc = x => { pez.push(x); return pez.length - 1; };
    const dec = s => s.replace(/«(\d+)»/g, (m, i) => '(' + fx(dec(pez[+i])) + ')');
    const fx = x => { let m; if ((m = x.match(/^(.*) → (.*)$/))) return '(!(' + m[1] + ')||(' + m[2] + '))'; if ((m = x.match(/^(.*) ↔ (.*)$/))) return '((' + m[1] + ')===(' + m[2] + '))'; return x; };
    const corpo = fx(tr(src));
    const fn2 = new Function('p', 'q', 'r', 's', 'return !!(' + corpo + ');');
    for (let m = 0; m < 16; m++) { const v = { p: !!(m & 8), q: !!(m & 4), r: !!(m & 2), s: !!(m & 1) }; if (L.valuta(A, v) !== fn2(v.p, v.q, v.r, v.s)) js = false; }
  }
  vero('valutazione = traduzione indipendente in JavaScript su 300 formule × 16 righe', js);
  let errore = 0; ['p ∧', '(p ∨ q', 'p q', 'x → p', ''].forEach(f => { try { L.analizza(f); } catch (e) { errore++; } });
  att('formule malformate rifiutate (5 su 5)', 5, errore);
}

console.log('── Circuiti ──');
{
  const h = [[0, 0], [0, 1], [1, 0], [1, 1]].map(([a, b]) => { const s = L.simula(L.SEMI, { A: a, B: b }); return '' + s.C + s.S; });
  att('semiaddizionatore: 0+0, 0+1, 1+0, 1+1', '00,01,01,10', h.join(','));
  let fa = true; for (let m = 0; m < 8; m++) { const a = m >> 2 & 1, b = m >> 1 & 1, c = m & 1, s = L.simula(L.completo(0), { A0: a, B0: b, C0: c }); if (s.S0 + 2 * s.C1 !== a + b + c) fa = false; }
  vero('addizionatore completo: S + 2·Cₒᵤₜ = A + B + Cᵢₙ per gli 8 ingressi', fa);
  let tutto = true; for (let a = 0; a < 16; a++) for (let b = 0; b < 16; b++) for (let c = 0; c < 2; c++) { const R = L.sommaCircuito(a, b, 4, c); if (R.somma + 16 * R.riporto !== a + b + c) tutto = false; }
  vero('sommatore a 4 bit: tutte le 16 × 16 × 2 = 512 somme giuste', tutto);
  att('1011 + 0110 = 1 0001 (11 + 6 = 17), porte = 20', '1,1,20', (() => { const R = L.sommaCircuito(11, 6, 4, 0); return [R.riporto, R.somma, R.porte].join(','); })());
  let otto = true; for (let k = 0; k < 2000; k++) { const a = (k * 7919) % 256, b = (k * 104729) % 256; const R = L.sommaCircuito(a, b, 8, 0); if (R.somma + 256 * R.riporto !== a + b) otto = false; }
  vero('sommatore a 8 bit su 2000 coppie', otto);
}

console.log('── Macchine di Turing ──');
{
  const M = L.MACCHINE;
  const b2 = L.eseguiMT(M.castoro2, ''), b3 = L.eseguiMT(M.castoro3, '');
  att('castoro a 2 stati: 4 uni in 6 passi, si ferma', '4,6,true', [b2.uni, b2.passi, b2.ferma].join(','));
  att('castoro a 3 stati: 6 uni in 14 passi, si ferma', '6,14,true', [b3.uni, b3.passi, b3.ferma].join(','));
  att('incremento: 1011 → 1100', '1100', L.eseguiMT(M.incremento, '1011').nastro);
  att('incremento: 111 → 1000, 0 → 1', '1000,1', L.eseguiMT(M.incremento, '111').nastro + ',' + L.eseguiMT(M.incremento, '0').nastro);
  let inc = true; for (let n = 0; n < 300; n++) { if (parseInt(L.eseguiMT(M.incremento, n.toString(2)).nastro, 2) !== n + 1) inc = false; }
  vero('incremento giusto per n = 0…299', inc);
  att('somma unaria 111+11 = 11111', '11111', L.eseguiMT(M.unaria, '111+11').nastro);
  let un = true; for (let a = 1; a <= 8; a++) for (let b = 1; b <= 8; b++) if (L.eseguiMT(M.unaria, '1'.repeat(a) + '+' + '1'.repeat(b)).nastro !== '1'.repeat(a + b)) un = false;
  vero('somma unaria per a, b = 1…8', un);
  /* palindromi: tutte le parole su {a, b} fino a lunghezza 8, contro il confronto con la stringa rovesciata */
  let pal = true, nPal = 0;
  for (let len = 0; len <= 8; len++) for (let m = 0; m < 1 << len; m++) { let w = ''; for (let i = 0; i < len; i++) w += m >> i & 1 ? 'b' : 'a'; const R = L.eseguiMT(M.palindromo, w), si = w === w.split('').reverse().join(''); if (si) nPal++; if ((R.stato === 'SÌ') !== si || !R.ferma) pal = false; }
  vero('palindromi: decisione giusta su tutte le 511 parole di lunghezza ≤ 8 (' + nPal + ' palindromi)', pal);
  /* il passo a passo coincide con l'esecuzione completa */
  const T = L.creaMT(M.castoro3, ''); let k = 0; while (L.passoMT(T)) k++;
  att('castoro 3 passo a passo: passi e nastro', '14,111111', T.passi + ',' + L.nastroStringa(T));
}

console.log('── Insiemi e Venn ──');
{
  const m = s => L.analizzaInsiemi(s);
  vero('De Morgan: (A∪B)′ = A′∩B′ e (A∩B)′ = A′∪B′', m('(A∪B)′') === m('A′∩B′') && m("(A&B)'") === m("A'|B'"));
  vero('distributività: A∩(B∪C) = (A∩B)∪(A∩C), A∪(B∩C) = (A∪B)∩(A∪C)', m('A∩(B∪C)') === m('(A∩B)∪(A∩C)') && m('A∪(B∩C)') === m('(A∪B)∩(A∪C)'));
  vero('A∖B = A∩B′ e A Δ B = (A∖B)∪(B∖A)', m('A∖B') === m('A∩B′') && m('A Δ B') === m('(A-B)|(B-A)'));
  att('precedenza: A ∪ B ∩ C = A ∪ (B ∩ C) (regioni)', m('A ∪ (B ∩ C)'), m('A ∪ B ∩ C'));
  att('maschere: A∩B′ = regioni {A, AC}, (A∖B)∪C = {A, C, AC, BC, ABC}', '34,242', m("A∩B'") + ',' + m('(A∖B)∪C'));
  /* inclusione-esclusione con dimensioni casuali delle regioni, a 2 e a 3 insiemi */
  let ie3 = true, ie2 = true, r = 12345; const rnd = () => { r = (r * 1103515245 + 12345) % 2147483648; return Math.floor(r / 2147483648 * 30); };
  for (let k = 0; k < 500; k++) {
    const d = []; for (let i = 0; i < 8; i++) d.push(rnd());
    const I = L.inclusioneEsclusione(d); if (I.ie !== I.diretta) ie3 = false;
    const c = s => L.cardinalita(m(s), d); if (c('A∪B') !== c('A') + c('B') - c('A∩B')) ie2 = false;
    if (c('A Δ B') !== c('A') + c('B') - 2 * c('A∩B')) ie2 = false;
    if (c("A'") !== c('U') - c('A')) ie2 = false;
  }
  vero('|A∪B∪C| per inclusione-esclusione = somma delle regioni (500 casi)', ie3);
  vero('|A∪B| = |A|+|B|−|A∩B|, |AΔB| = |A|+|B|−2|A∩B|, |A′| = |U|−|A| (500 casi)', ie2);
  att('esempio della scheda: |A∪B∪C| con regioni 8,6,3,7,2,4,1', '31,31', (() => { const I = L.inclusioneEsclusione([5, 8, 6, 3, 7, 2, 4, 1]); return I.ie + ',' + I.diretta; })());
  let rifiuti = 0; ['A ∪', '(A', 'A D', ''].forEach(s => { try { m(s); } catch (e) { rifiuti++; } });
  att('espressioni malformate rifiutate (4 su 4)', 4, rifiuti);
}
console.log(`\n${ok} superati, ${ko} falliti`);
process.exit(ko ? 1 : 0);
