/* ═══════════════════════════════════════════════════════════════════════════
   bsi-mat-logica.js — 🧠 logica e calcolabilita'
   BioSpecInfo · © Samuele Pio Provenzano

   · TAVOLE DI VERITA': un piccolo analizzatore per le formule con ¬ ∧ ∨ → ↔
     e le variabili p q r s (si possono battere anche !, &, |, ->, <->);
     la tavola con tutte le sottoformule, tautologia / contraddizione /
     soddisfacibile, le forme normali disgiuntiva e congiuntiva;
   · CIRCUITI LOGICI: il semiaddizionatore, l'addizionatore completo e il
     sommatore a propagazione di riporto a 4 bit disegnati con le porte;
     si cambiano gli ingressi e i fili accesi si colorano;
   · MACCHINA DI TURING: nastro e testina animati, la tavola delle
     transizioni, i programmi classici (incremento binario, somma unaria,
     palindromi) e i castori indaffarati a 2 e 3 stati;
   · INSIEMI: il diagramma di Venn a tre insiemi con le regioni colorate per
     un'espressione scritta dall'utente, e la cardinalita' con il principio
     di inclusione-esclusione.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t;
  function griglia(div) { var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); G.appendChild(pan); G.appendChild(dx); div.appendChild(G); return { pan: pan, dx: dx }; }
  function nota(pan) { var n = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(n); return n; }
  function campo(pan, et, val, cambia) { var i = F.el('input', { type: 'text', value: val, 'aria-label': F.tt(et), spellcheck: 'false', autocomplete: 'off' }); pan.appendChild(F.el('div', { 'class': 'bsiFX-cursore' }, [F.el('label', null, [F.el('span', { testo: F.tt(et) })]), i])); i.addEventListener('input', function () { cambia(i.value); }); return i; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  /* ═══ calcoli: logica proposizionale ════════════════════════════════════
     Precedenze: ¬ > ∧ > ∨ > → (associa a destra) > ↔ (associa a sinistra) */
  var VARIABILI = ['p', 'q', 'r', 's'];
  function lessico(s) {
    var out = [], i = 0, M = [['<->', '↔'], ['<=>', '↔'], ['->', '→'], ['=>', '→'], ['&&', '∧'], ['||', '∨'], ['!', '¬'], ['~', '¬'], ['¬', '¬'], ['&', '∧'], ['∧', '∧'], ['^', '∧'], ['|', '∨'], ['∨', '∨'], ['→', '→'], ['↔', '↔'], ['⇒', '→'], ['⇔', '↔'], ['(', '('], [')', ')'], ['⊤', '1'], ['⊥', '0'], ['1', '1'], ['0', '0']];
    while (i < s.length) {
      var c = s[i];
      if (/\s/.test(c)) { i++; continue; }
      var trovato = false;
      for (var k = 0; k < M.length; k++) if (s.substr(i, M[k][0].length) === M[k][0]) { out.push(M[k][1]); i += M[k][0].length; trovato = true; break; }
      if (trovato) continue;
      var lc = c.toLowerCase();
      if (VARIABILI.indexOf(lc) >= 0) { out.push(lc); i++; continue; }
      throw new Error(t('simbolo non riconosciuto «', 'unrecognised symbol “') + c + t('» in posizione ', '” at position ') + (i + 1));
    }
    return out;
  }
  function analizza(s) {
    var tk = lessico(s), i = 0;
    function guarda() { return tk[i]; }
    function prendi(x) { if (tk[i] !== x) throw new Error(t('atteso «', 'expected “') + x + t('» invece di «', '” instead of “') + (tk[i] || t('fine', 'end')) + '»'); i++; }
    function equiv() { var a = impl(); while (guarda() === '↔') { i++; a = { op: '↔', a: a, b: impl() }; } return a; }
    function impl() { var a = or(); if (guarda() === '→') { i++; return { op: '→', a: a, b: impl() }; } return a; }
    function or() { var a = and(); while (guarda() === '∨') { i++; a = { op: '∨', a: a, b: and() }; } return a; }
    function and() { var a = not(); while (guarda() === '∧') { i++; a = { op: '∧', a: a, b: not() }; } return a; }
    function not() { if (guarda() === '¬') { i++; return { op: '¬', a: not() }; } return atomo(); }
    function atomo() {
      var x = guarda();
      if (x === '(') { i++; var e = equiv(); prendi(')'); return e; }
      if (x === '1' || x === '0') { i++; return { op: 'c', v: x === '1' }; }
      if (VARIABILI.indexOf(x) >= 0) { i++; return { op: 'v', n: x }; }
      throw new Error(x ? t('inatteso «', 'unexpected “') + x + '»' : t('formula incompleta', 'incomplete formula'));
    }
    if (!tk.length) throw new Error(t('formula vuota', 'empty formula'));
    var r = equiv(); if (i < tk.length) throw new Error(t('di troppo: «', 'extra: “') + tk[i] + '»');
    return r;
  }
  function valuta(n, v) {
    switch (n.op) {
      case 'v': return !!v[n.n]; case 'c': return n.v; case '¬': return !valuta(n.a, v);
      case '∧': return valuta(n.a, v) && valuta(n.b, v); case '∨': return valuta(n.a, v) || valuta(n.b, v);
      case '→': return !valuta(n.a, v) || valuta(n.b, v); case '↔': return valuta(n.a, v) === valuta(n.b, v);
    }
    return false;
  }
  function variabili(n) { var s = {}; (function giro(x) { if (x.op === 'v') s[x.n] = 1; if (x.a) giro(x.a); if (x.b) giro(x.b); })(n); return VARIABILI.filter(function (v) { return s[v]; }); }
  function stampa(n, cima) {
    if (n.op === 'v') return n.n; if (n.op === 'c') return n.v ? '⊤' : '⊥';
    if (n.op === '¬') return '¬' + stampa(n.a, false);
    var s = stampa(n.a, false) + ' ' + n.op + ' ' + stampa(n.b, false);
    return cima ? s : '(' + s + ')';
  }
  /* sottoformule in ordine «dal basso», senza ripetizioni e senza le variabili */
  function sottoformule(n) { var out = [], visti = {}; (function giro(x) { if (x.a) giro(x.a); if (x.b) giro(x.b); if (x.op === 'v' || x.op === 'c') return; var k = stampa(x, true); if (!visti[k]) { visti[k] = 1; out.push(x); } })(n); return out; }
  function assegnamenti(vars) { var out = []; for (var m = 0; m < 1 << vars.length; m++) { var v = {}; vars.forEach(function (x, i) { v[x] = !!(m >> (vars.length - 1 - i) & 1); }); out.push(v); } return out; }
  function tavola(n) { var vars = variabili(n); return { vars: vars, righe: assegnamenti(vars).map(function (v) { return { v: v, val: valuta(n, v) }; }) }; }
  function classifica(n) { var T = tavola(n), veri = T.righe.filter(function (r) { return r.val; }).length; return veri === T.righe.length ? 'tautologia' : veri === 0 ? 'contraddizione' : 'soddisfacibile'; }
  function fnd(n) { var T = tavola(n), m = T.righe.filter(function (r) { return r.val; }); if (!m.length) return '⊥'; if (!T.vars.length) return '⊤'; return m.map(function (r) { var s = T.vars.map(function (x) { return (r.v[x] ? '' : '¬') + x; }).join(' ∧ '); return m.length > 1 && T.vars.length > 1 ? '(' + s + ')' : s; }).join(' ∨ '); }
  function fnc(n) { var T = tavola(n), m = T.righe.filter(function (r) { return !r.val; }); if (!m.length) return '⊤'; if (!T.vars.length) return '⊥'; return m.map(function (r) { var s = T.vars.map(function (x) { return (r.v[x] ? '¬' : '') + x; }).join(' ∨ '); return m.length > 1 && T.vars.length > 1 ? '(' + s + ')' : s; }).join(' ∧ '); }
  function equivalenti(f, g) { var A = analizza(f), B = analizza(g), vars = VARIABILI; return assegnamenti(vars).every(function (v) { return valuta(A, v) === valuta(B, v); }); }

  /* ═══ calcoli: circuiti ═════════════════════════════════════════════════
     una rete e' una lista di porte in ordine topologico: [tipo, uscita, ingresso1, ingresso2] */
  var PORTE = { AND: function (a, b) { return a & b; }, OR: function (a, b) { return a | b; }, XOR: function (a, b) { return a ^ b; }, NOT: function (a) { return 1 - a; } };
  function simula(rete, ingressi) { var s = {}; Object.keys(ingressi).forEach(function (k) { s[k] = ingressi[k] ? 1 : 0; }); rete.forEach(function (g) { s[g[1]] = PORTE[g[0]](s[g[2]], s[g[3]]); }); return s; }
  var SEMI = [['XOR', 'S', 'A', 'B'], ['AND', 'C', 'A', 'B']];
  function completo(i) { var A = 'A' + i, B = 'B' + i, Ci = 'C' + i, P = 'P' + i, G = 'G' + i, T = 'T' + i; return [['XOR', P, A, B], ['XOR', 'S' + i, P, Ci], ['AND', G, A, B], ['AND', T, P, Ci], ['OR', 'C' + (i + 1), G, T]]; }
  function ripple(n) { var r = []; for (var i = 0; i < n; i++) r = r.concat(completo(i)); return r; }
  /* somma a bit: a, b interi, n bit, riporto entrante; restituisce somma e riporto finale */
  function sommaCircuito(a, b, n, cin) {
    var ing = { C0: cin ? 1 : 0 }; for (var i = 0; i < n; i++) { ing['A' + i] = a >> i & 1; ing['B' + i] = b >> i & 1; }
    var s = simula(ripple(n), ing), S = 0; for (i = 0; i < n; i++) S |= s['S' + i] << i;
    return { somma: S, riporto: s['C' + n], segnali: s, porte: ripple(n).length };
  }

  /* ═══ calcoli: macchine di Turing ═══════════════════════════════════════
     regole['stato,simbolo'] = [scrivi, mossa (−1 sinistra, 0 ferma, +1 destra), nuovo stato].
     Si ferma negli stati di arresto o quando nessuna regola si applica */
  var MACCHINE = {
    incremento: { nome: ['Incremento binario', 'Binary increment'], vuoto: '_', ingresso: '1011', inizio: 'destra', arresto: ['FINE'],
      regole: { 'destra,0': ['0', 1, 'destra'], 'destra,1': ['1', 1, 'destra'], 'destra,_': ['_', -1, 'riporto'], 'riporto,1': ['0', -1, 'riporto'], 'riporto,0': ['1', 0, 'FINE'], 'riporto,_': ['1', 0, 'FINE'] },
      descr: ['Va in fondo al numero, poi somma 1: gli 1 diventano 0 finché un 0 (o il vuoto) diventa 1.', 'Goes to the end of the number, then adds 1: 1s become 0 until a 0 (or a blank) becomes 1.'] },
    unaria: { nome: ['Somma unaria', 'Unary addition'], vuoto: '_', ingresso: '111+11', inizio: 'q0', arresto: ['FINE'],
      regole: { 'q0,1': ['1', 1, 'q0'], 'q0,+': ['1', 1, 'q1'], 'q1,1': ['1', 1, 'q1'], 'q1,_': ['_', -1, 'q2'], 'q2,1': ['_', 0, 'FINE'] },
      descr: ['m + n in unario: il «+» diventa 1 e si cancella l’ultimo 1. 111+11 → 11111.', 'm + n in unary: the “+” becomes 1 and the last 1 is erased. 111+11 → 11111.'] },
    palindromo: { nome: ['Palindromi su {a, b}', 'Palindromes over {a, b}'], vuoto: '_', ingresso: 'abba', inizio: 'q0', arresto: ['SÌ', 'NO'],
      regole: { 'q0,a': ['_', 1, 'qa'], 'q0,b': ['_', 1, 'qb'], 'q0,_': ['_', 0, 'SÌ'],
        'qa,a': ['a', 1, 'qa'], 'qa,b': ['b', 1, 'qa'], 'qa,_': ['_', -1, 'qa2'], 'qa2,a': ['_', -1, 'torna'], 'qa2,b': ['b', 0, 'NO'], 'qa2,_': ['_', 0, 'SÌ'],
        'qb,a': ['a', 1, 'qb'], 'qb,b': ['b', 1, 'qb'], 'qb,_': ['_', -1, 'qb2'], 'qb2,b': ['_', -1, 'torna'], 'qb2,a': ['a', 0, 'NO'], 'qb2,_': ['_', 0, 'SÌ'],
        'torna,a': ['a', -1, 'torna'], 'torna,b': ['b', -1, 'torna'], 'torna,_': ['_', 1, 'q0'] },
      descr: ['Cancella il primo simbolo, lo ricorda nello stato, corre in fondo e controlla l’ultimo; ripete. Tempo ∝ n².', 'Erases the first symbol, remembers it in the state, runs to the end and checks the last one; repeats. Time ∝ n².'] },
    castoro2: { nome: ['Castoro indaffarato, 2 stati', 'Busy beaver, 2 states'], vuoto: '0', ingresso: '', inizio: 'A', arresto: ['H'],
      regole: { 'A,0': ['1', 1, 'B'], 'A,1': ['1', -1, 'B'], 'B,0': ['1', -1, 'A'], 'B,1': ['1', 1, 'H'] },
      descr: ['Fra tutte le macchine a 2 stati che si fermano partendo dal nastro vuoto, scrive più 1: Σ(2) = 4 in S(2) = 6 passi.', 'Among all 2-state machines that halt from a blank tape, it writes the most 1s: Σ(2) = 4 in S(2) = 6 steps.'] },
    castoro3: { nome: ['Castoro indaffarato, 3 stati', 'Busy beaver, 3 states'], vuoto: '0', ingresso: '', inizio: 'A', arresto: ['H'],
      regole: { 'A,0': ['1', 1, 'B'], 'A,1': ['1', 1, 'H'], 'B,0': ['0', 1, 'C'], 'B,1': ['1', 1, 'B'], 'C,0': ['1', -1, 'C'], 'C,1': ['1', -1, 'A'] },
      descr: ['Il campione a 3 stati: Σ(3) = 6 uni in 14 passi (il più lungo a 3 stati, S(3) = 21, scrive solo 5 uni). Σ(n) cresce più di ogni funzione calcolabile.', 'The 3-state champion: Σ(3) = 6 ones in 14 steps (the longest 3-state one, S(3) = 21, writes only 5). Σ(n) grows faster than any computable function.'] }
  };
  function creaMT(def, ingresso) {
    var nastro = {}, s = ingresso == null ? def.ingresso : ingresso;
    for (var i = 0; i < s.length; i++) nastro[i] = s[i];
    return { def: def, nastro: nastro, testa: 0, stato: def.inizio, passi: 0, ferma: def.arresto.indexOf(def.inizio) >= 0, ultima: null };
  }
  function leggi(M, i) { var c = M.nastro[i]; return c === undefined ? M.def.vuoto : c; }
  function passoMT(M) {
    if (M.ferma) return false;
    var k = M.stato + ',' + leggi(M, M.testa), r = M.def.regole[k];
    if (!r) { M.ferma = true; M.bloccata = true; return false; }
    if (r[0] === M.def.vuoto) delete M.nastro[M.testa]; else M.nastro[M.testa] = r[0];
    M.ultima = k; M.testa += r[1]; M.stato = r[2]; M.passi++;
    if (M.def.arresto.indexOf(M.stato) >= 0) M.ferma = true;
    return true;
  }
  function nastroStringa(M) { var ch = Object.keys(M.nastro).map(Number); if (!ch.length) return ''; var a = Math.min.apply(null, ch), b = Math.max.apply(null, ch), s = ''; for (var i = a; i <= b; i++) s += leggi(M, i); return s; }
  function contaUni(M) { return Object.keys(M.nastro).filter(function (k) { return M.nastro[k] === '1'; }).length; }
  function eseguiMT(def, ingresso, max) { var M = creaMT(def, ingresso); max = max || 100000; while (!M.ferma && M.passi < max) passoMT(M); return { nastro: nastroStringa(M), passi: M.passi, stato: M.stato, uni: contaUni(M), ferma: M.ferma }; }

  /* ═══ calcoli: insiemi ══════════════════════════════════════════════════
     le 8 regioni del diagramma: indice r = a + 2b + 4c (bit di appartenenza ad A, B, C);
     un insieme e' una maschera a 8 bit. Precedenze: ′ (postfisso) > ∩ > ∪ ∖ Δ (a sinistra) */
  var REG = { A: 0, B: 0, C: 0 }; (function () { for (var r = 0; r < 8; r++) { if (r & 1) REG.A |= 1 << r; if (r & 2) REG.B |= 1 << r; if (r & 4) REG.C |= 1 << r; } })();
  function analizzaInsiemi(s) {
    var tk = [], i = 0, MAP = { '∪': '∪', '|': '∪', '+': '∪', '∩': '∩', '&': '∩', '*': '∩', '∖': '∖', '\\': '∖', '-': '∖', '−': '∖', 'Δ': 'Δ', '△': 'Δ', '^': 'Δ', "'": '′', '′': '′', 'ᶜ': '′', '(': '(', ')': ')', '∅': '∅', 'U': 'U' };
    while (i < s.length) { var c = s[i]; if (/\s/.test(c)) { i++; continue; } if (/[abcABC]/.test(c)) { tk.push(c.toUpperCase()); i++; continue; } if (MAP[c]) { tk.push(MAP[c]); i++; continue; } if (c === 'Ω') { tk.push('U'); i++; continue; } throw new Error(t('simbolo non riconosciuto «', 'unrecognised symbol “') + c + '»'); }
    var j = 0;
    function g() { return tk[j]; }
    function espr() { var a = inter(); while (g() === '∪' || g() === '∖' || g() === 'Δ') { var o = tk[j++], b = inter(); a = o === '∪' ? (a | b) : o === '∖' ? (a & ~b & 255) : (a ^ b); } return a; }
    function inter() { var a = post(); while (g() === '∩') { j++; a = a & post(); } return a; }
    function post() { var a = atomo(); while (g() === '′') { j++; a = ~a & 255; } return a; }
    function atomo() { var x = tk[j++]; if (x === '(') { var e = espr(); if (tk[j++] !== ')') throw new Error(t('manca «)»', 'missing “)”')); return e; } if (x === 'A' || x === 'B' || x === 'C') return REG[x]; if (x === 'U') return 255; if (x === '∅') return 0; throw new Error(x ? t('inatteso «', 'unexpected “') + x + '»' : t('espressione incompleta', 'incomplete expression')); }
    if (!tk.length) throw new Error(t('espressione vuota', 'empty expression'));
    var m = espr(); if (j < tk.length) throw new Error(t('di troppo: «', 'extra: “') + tk[j] + '»');
    return m;
  }
  function cardinalita(mask, dim) { var s = 0; for (var r = 0; r < 8; r++) if (mask >> r & 1) s += dim[r]; return s; }
  /* |A ∪ B ∪ C| = |A| + |B| + |C| − |A∩B| − |A∩C| − |B∩C| + |A∩B∩C| */
  function inclusioneEsclusione(dim) {
    var c = function (m) { return cardinalita(m, dim); }, A = REG.A, B = REG.B, C = REG.C;
    var termini = { A: c(A), B: c(B), C: c(C), AB: c(A & B), AC: c(A & C), BC: c(B & C), ABC: c(A & B & C) };
    return { termini: termini, ie: termini.A + termini.B + termini.C - termini.AB - termini.AC - termini.BC + termini.ABC, diretta: c(A | B | C) };
  }
  F.calcolo.logica = { analizza: analizza, valuta: valuta, variabili: variabili, stampa: stampa, sottoformule: sottoformule, tavola: tavola, classifica: classifica, fnd: fnd, fnc: fnc, equivalenti: equivalenti,
    simula: simula, SEMI: SEMI, completo: completo, ripple: ripple, sommaCircuito: sommaCircuito,
    MACCHINE: MACCHINE, creaMT: creaMT, passoMT: passoMT, eseguiMT: eseguiMT, nastroStringa: nastroStringa, contaUni: contaUni,
    REG: REG, analizzaInsiemi: analizzaInsiemi, cardinalita: cardinalita, inclusioneEsclusione: inclusioneEsclusione };

  /* ═══ 1. tavole di verità ═══════════════════════════════════════════════ */
  var ESEMPI = [['(p → q) ↔ (¬q → ¬p)', ['contrapposizione', 'contraposition']], ['¬(p ∧ q) ↔ (¬p ∨ ¬q)', ['De Morgan', 'De Morgan']], ['((p → q) ∧ p) → q', ['modus ponens', 'modus ponens']], ['p ∧ ¬p', ['contraddizione', 'contradiction']], ['(p ∨ q) ∧ (¬p ∨ r) → (q ∨ r)', ['risoluzione', 'resolution']], ['(p -> q) & (q -> r) -> (p -> r)', ['sillogismo (scritto con -> e &)', 'syllogism (typed with -> and &)']], ['(p ∧ q) ∨ (r ∧ s)', ['soddisfacibile a 4 variabili', 'satisfiable, 4 variables']], ['p ↔ q ↔ r', ['↔ in catena (parità)', 'chained ↔ (parity)']]];
  function schedaVerita(div) {
    var Gp = griglia(div), st = { f: ESEMPI[0][0] }, info = nota(Gp.pan), forme = F.el('div', { 'class': 'bsiFX-nota', style: 'overflow-wrap:anywhere' });
    F.scelta(Gp.pan, ['Esempi', 'Examples'], ESEMPI.map(function (e) { return [e[0], [e[1][0] + ': ' + e[0], e[1][1] + ': ' + e[0]]]; }), st.f, function (v) { st.f = v; inp.value = v; disegna(); });
    var inp = campo(Gp.pan, ['Formula (¬ ∧ ∨ → ↔ oppure ! & | -> <->; variabili p q r s)', 'Formula (¬ ∧ ∨ → ↔ or ! & | -> <->; variables p q r s)'], st.f, function (v) { st.f = v; disegna(); });
    var tasti = F.el('div'); ['¬', '∧', '∨', '→', '↔', '(', ')', 'p', 'q', 'r', 's'].forEach(function (s) { var b = F.el('button', { type: 'button', 'class': 'bsiFX-bott', testo: s, style: 'min-width:34px;padding:4px 8px', 'aria-label': t('inserisci ', 'insert ') + s, onclick: function () { inp.value += s; st.f = inp.value; disegna(); } }); tasti.appendChild(b); });
    F.bottone(tasti, ['⌫', '⌫'], function () { inp.value = Array.from(inp.value).slice(0, -1).join(''); st.f = inp.value; disegna(); });
    Gp.pan.appendChild(tasti); Gp.pan.appendChild(info); Gp.pan.appendChild(forme);
    var cv = F.tela(Gp.dx, 0.7);
    function disegna() {
      var n; try { n = analizza(st.f); } catch (e) { info.innerHTML = '<span class="bsiFX-ko">' + esc(e.message) + '</span><br>' + spiega(); forme.innerHTML = ''; var P0 = F.pennello(cv); P0.q.fillStyle = '#5b6b80'; P0.q.font = '14px system-ui'; P0.q.fillText(t('Formula non valida', 'Invalid formula'), 16, 30); cv.setAttribute('aria-label', t('tavola di verità: formula non valida', 'truth table: invalid formula')); return; }
      var T = tavola(n), sub = sottoformule(n).slice(-8), col = T.vars.map(function (v) { return { tit: v, f: { op: 'v', n: v } }; }).concat(sub.map(function (s) { return { tit: stampa(s, true), f: s }; })), cl = classifica(n);
      var P = F.pennello(cv), q = P.q, W = P.W, H = P.H, nr = T.righe.length, hh = 34, rh = Math.min(26, (H - hh - 6) / nr), cw = (W - 8) / col.length, V = t('V', 'T');
      q.font = Math.max(9, Math.min(13, cw / 7)) + 'px system-ui'; q.textAlign = 'center'; q.textBaseline = 'middle';
      col.forEach(function (c, j) {
        var x = 4 + j * cw, ultimo = j === col.length - 1, tit = c.tit;
        while (q.measureText(tit).width > cw - 6 && tit.length > 2) tit = tit.slice(0, -2) + '…';
        if (q.measureText(tit).width > cw - 6) tit = '#' + (j - T.vars.length + 1);
        q.fillStyle = ultimo ? '#ffd24a' : j < T.vars.length ? '#6bcfff' : '#c9d3df'; q.fillText(tit, x + cw / 2, hh / 2);
        T.righe.forEach(function (r, i) { var v = valuta(c.f, r.v), y = hh + i * rh; q.fillStyle = v ? (ultimo ? 'rgba(94,234,212,.55)' : 'rgba(94,234,212,.18)') : (ultimo ? 'rgba(255,138,128,.5)' : 'rgba(255,138,128,.12)'); q.fillRect(x + 1, y + 1, cw - 2, rh - 2); q.fillStyle = v ? '#5eead4' : '#ff8a80'; if (ultimo) q.fillStyle = '#081522'; q.fillText(v ? V : 'F', x + cw / 2, y + rh / 2 + 1); });
      });
      q.strokeStyle = '#34465f'; q.beginPath(); q.moveTo(4 + T.vars.length * cw, 4); q.lineTo(4 + T.vars.length * cw, hh + nr * rh); q.stroke();
      q.textAlign = 'left'; q.textBaseline = 'alphabetic';
      cv.setAttribute('aria-label', t('tavola di verità di ', 'truth table of ') + stampa(n, true) + ': ' + cl);
      var veri = T.righe.filter(function (r) { return r.val; }).length;
      info.innerHTML = t('Letta come: ', 'Parsed as: ') + '<b class="bsiFX-num">' + esc(stampa(n, true)) + '</b><br>' + (cl === 'tautologia' ? '<b class="bsiFX-ok">' + t('Tautologia', 'Tautology') + '</b>: ' + t('vera in tutte le ', 'true in all ') + nr + t(' righe', ' rows') : cl === 'contraddizione' ? '<b class="bsiFX-ko">' + t('Contraddizione', 'Contradiction') + '</b>: ' + t('falsa in tutte le righe', 'false in every row') : '<b style="color:#ffd24a">' + t('Soddisfacibile', 'Satisfiable') + '</b> ' + t('(non tautologia): vera in ', '(not a tautology): true in ') + veri + ' / ' + nr + t(' righe', ' rows')) + '<br>' + spiega();
      forme.innerHTML = '<b>FND</b> (' + t('somma di mintermini', 'sum of minterms') + '): ' + esc(fnd(n)) + '<br><b>FNC</b> (' + t('prodotto di maxtermini', 'product of maxterms') + '): ' + esc(fnc(n));
    }
    function spiega() { return t('Ogni connettivo è una funzione di verità: p → q è falsa solo se p è vera e q falsa; p ↔ q è vera quando p e q hanno lo stesso valore. Con n variabili la tavola ha 2ⁿ righe. Una tautologia è una legge logica (modus ponens, contrapposizione, De Morgan). La FND è la disgiunzione delle righe vere (mintermini), la FNC la congiunzione delle negazioni delle righe false (maxtermini): ogni formula ne ha una, quindi {¬, ∧, ∨} è un insieme completo di connettivi. Decidere se una formula è soddisfacibile (SAT) è il primo problema dimostrato NP-completo (Cook, 1971).', 'Every connective is a truth function: p → q is false only when p is true and q false; p ↔ q is true when p and q have the same value. With n variables the table has 2ⁿ rows. A tautology is a law of logic (modus ponens, contraposition, De Morgan). The DNF is the disjunction of the true rows (minterms), the CNF the conjunction of the negations of the false rows (maxterms): every formula has one, so {¬, ∧, ∨} is a complete set of connectives. Deciding whether a formula is satisfiable (SAT) was the first problem proved NP-complete (Cook, 1971).'); }
    disegna(); F.alRidimensiona(disegna);
  }

  /* ═══ 2. circuiti logici ════════════════════════════════════════════════ */
  function porta(q, tipo, x, y, w, h, acceso) {
    q.fillStyle = acceso ? 'rgba(94,234,212,.28)' : '#0e1d31'; q.strokeStyle = acceso ? '#5eead4' : '#6b7d93'; q.lineWidth = 2;
    var l = x - w / 2, r = x + w / 2, a = y - h / 2, b = y + h / 2;
    q.beginPath();
    if (tipo === 'AND') { q.moveTo(l, a); q.lineTo(x, a); q.arc(x, y, h / 2, -Math.PI / 2, Math.PI / 2); q.lineTo(l, b); q.closePath(); }
    else { q.moveTo(l, a); q.quadraticCurveTo(x + w * 0.1, a, r, y); q.quadraticCurveTo(x + w * 0.1, b, l, b); q.quadraticCurveTo(l + w * 0.25, y, l, a); q.closePath(); }
    q.fill(); q.stroke();
    if (tipo === 'XOR') { q.beginPath(); q.moveTo(l - 6, a); q.quadraticCurveTo(l - 6 + w * 0.25, y, l - 6, b); q.stroke(); }
    q.fillStyle = acceso ? '#e6fffb' : '#9fb1c6'; q.font = 'bold 10px system-ui'; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText(tipo, x - w * 0.08, y + 1); q.textAlign = 'left'; q.textBaseline = 'alphabetic'; q.lineWidth = 1;
    return { in1: [l - (tipo === 'XOR' ? 6 : 0), y - h / 4], in2: [l - (tipo === 'XOR' ? 6 : 0), y + h / 4], out: [r, y] };
  }
  function filo(q, da, a, gomito, acceso) { q.strokeStyle = acceso ? '#5eead4' : '#34465f'; q.lineWidth = acceso ? 3 : 2; q.beginPath(); q.moveTo(da[0], da[1]); q.lineTo(gomito, da[1]); q.lineTo(gomito, a[1]); q.lineTo(a[0], a[1]); q.stroke(); q.fillStyle = q.strokeStyle; q.beginPath(); q.arc(gomito, da[1], 2.5, 0, Math.PI * 2); q.fill(); q.lineWidth = 1; }
  function morsetto(q, x, y, nome, v) { q.fillStyle = v ? '#5eead4' : '#34465f'; q.beginPath(); q.arc(x, y, 11, 0, Math.PI * 2); q.fill(); q.fillStyle = v ? '#081522' : '#c9d3df'; q.font = 'bold 11px system-ui'; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText(String(v), x, y + 1); q.fillStyle = '#c9d3df'; q.font = '12px system-ui'; q.fillText(nome, x, y - 20); q.textAlign = 'left'; q.textBaseline = 'alphabetic'; }
  function schedaCircuiti(div) {
    var Gp = griglia(div), st = { modo: 'completo', A: 1, B: 1, C: 0, a: 11, b: 6 }, info = nota(Gp.pan), bott = F.el('div');
    F.scelta(Gp.pan, ['Circuito', 'Circuit'], [['semi', ['semiaddizionatore', 'half adder']], ['completo', ['addizionatore completo', 'full adder']], ['ripple', ['sommatore a 4 bit (ripple carry)', '4-bit ripple-carry adder']]], st.modo, function (v) { st.modo = v; pannello(); disegna(); });
    Gp.pan.appendChild(bott); Gp.pan.appendChild(info);
    var cv = F.tela(Gp.dx, 0.62);
    function pannello() {
      bott.innerHTML = '';
      if (st.modo === 'ripple') {
        F.cursore(bott, ['a (4 bit)', 'a (4 bits)'], 0, 15, 1, st.a, function (v) { st.a = v; disegna(); }, function (v) { return v + ' = ' + ('000' + v.toString(2)).slice(-4); });
        F.cursore(bott, ['b (4 bit)', 'b (4 bits)'], 0, 15, 1, st.b, function (v) { st.b = v; disegna(); }, function (v) { return v + ' = ' + ('000' + v.toString(2)).slice(-4); });
        F.bottone(bott, ['riporto entrante C₀', 'carry in C₀'], function () { st.C = 1 - st.C; disegna(); });
      } else {
        F.bottone(bott, ['commuta A', 'toggle A'], function () { st.A = 1 - st.A; disegna(); });
        F.bottone(bott, ['commuta B', 'toggle B'], function () { st.B = 1 - st.B; disegna(); });
        if (st.modo === 'completo') F.bottone(bott, ['commuta Cᵢₙ', 'toggle Cᵢₙ'], function () { st.C = 1 - st.C; disegna(); });
      }
    }
    function disegna() {
      var P = F.pennello(cv), q = P.q, W = P.W, H = P.H, X = function (f) { return f * W; }, Y = function (f) { return f * H; }, gw = Math.max(44, W * 0.1), gh = Math.max(34, H * 0.13), testo;
      if (st.modo === 'semi') {
        var s = simula(SEMI, { A: st.A, B: st.B }), pA = [X(0.08), Y(0.3)], pB = [X(0.08), Y(0.62)];
        var gx = porta(q, 'XOR', X(0.5), Y(0.3), gw, gh, s.S), ga = porta(q, 'AND', X(0.5), Y(0.68), gw, gh, s.C);
        filo(q, pA, gx.in1, X(0.22), st.A); filo(q, pA, ga.in1, X(0.22), st.A); filo(q, pB, gx.in2, X(0.3), st.B); filo(q, pB, ga.in2, X(0.3), st.B);
        filo(q, gx.out, [X(0.9), Y(0.3)], X(0.8), s.S); filo(q, ga.out, [X(0.9), Y(0.68)], X(0.8), s.C);
        porta(q, 'XOR', X(0.5), Y(0.3), gw, gh, s.S); porta(q, 'AND', X(0.5), Y(0.68), gw, gh, s.C);
        morsetto(q, pA[0], pA[1], 'A', st.A); morsetto(q, pB[0], pB[1], 'B', st.B); morsetto(q, X(0.92), Y(0.3), 'S', s.S); morsetto(q, X(0.92), Y(0.68), 'C', s.C);
        testo = st.A + ' + ' + st.B + ' = <b class="bsiFX-num">' + s.C + s.S + '</b>₂ (C = ' + s.C + ', S = ' + s.S + ') · S = A ⊕ B, C = A ∧ B';
      } else if (st.modo === 'completo') {
        var f = simula(completo(0), { A0: st.A, B0: st.B, C0: st.C }), A = [X(0.07), Y(0.2)], B = [X(0.07), Y(0.4)], Ci = [X(0.07), Y(0.8)];
        var x1 = { in1: [X(0.3) - gw / 2 - 6, Y(0.3) - gh / 4], in2: [X(0.3) - gw / 2 - 6, Y(0.3) + gh / 4], out: [X(0.3) + gw / 2, Y(0.3)] };
        var a1 = { in1: [X(0.3) - gw / 2, Y(0.55) - gh / 4], in2: [X(0.3) - gw / 2, Y(0.55) + gh / 4], out: [X(0.3) + gw / 2, Y(0.55)] };
        var x2 = { in1: [X(0.58) - gw / 2 - 6, Y(0.25) - gh / 4], in2: [X(0.58) - gw / 2 - 6, Y(0.25) + gh / 4], out: [X(0.58) + gw / 2, Y(0.25)] };
        var a2 = { in1: [X(0.58) - gw / 2, Y(0.72) - gh / 4], in2: [X(0.58) - gw / 2, Y(0.72) + gh / 4], out: [X(0.58) + gw / 2, Y(0.72)] };
        var o1 = { in1: [X(0.8) - gw / 2, Y(0.62) - gh / 4], in2: [X(0.8) - gw / 2, Y(0.62) + gh / 4], out: [X(0.8) + gw / 2, Y(0.62)] };
        filo(q, A, x1.in1, X(0.15), st.A); filo(q, A, a1.in1, X(0.15), st.A); filo(q, B, x1.in2, X(0.19), st.B); filo(q, B, a1.in2, X(0.19), st.B);
        filo(q, x1.out, x2.in1, X(0.42), f.P0); filo(q, x1.out, a2.in1, X(0.42), f.P0);
        filo(q, Ci, a2.in2, X(0.46), st.C); filo(q, Ci, x2.in2, X(0.46), st.C);
        filo(q, a1.out, o1.in1, X(0.68), f.G0); filo(q, a2.out, o1.in2, X(0.68), f.T0);
        filo(q, x2.out, [X(0.92), Y(0.25)], X(0.86), f.S0); filo(q, o1.out, [X(0.92), Y(0.62)], X(0.9), f.C1);
        porta(q, 'XOR', X(0.3), Y(0.3), gw, gh, f.P0); porta(q, 'AND', X(0.3), Y(0.55), gw, gh, f.G0); porta(q, 'XOR', X(0.58), Y(0.25), gw, gh, f.S0); porta(q, 'AND', X(0.58), Y(0.72), gw, gh, f.T0); porta(q, 'OR', X(0.8), Y(0.62), gw, gh, f.C1);
        morsetto(q, A[0], A[1], 'A', st.A); morsetto(q, B[0], B[1], 'B', st.B); morsetto(q, Ci[0], Ci[1], 'Cᵢₙ', st.C); morsetto(q, X(0.93), Y(0.25), 'S', f.S0); morsetto(q, X(0.93), Y(0.62), 'Cₒᵤₜ', f.C1);
        testo = st.A + ' + ' + st.B + ' + ' + st.C + ' = <b class="bsiFX-num">' + f.C1 + f.S0 + '</b>₂ · S = A ⊕ B ⊕ Cᵢₙ, Cₒᵤₜ = (A ∧ B) ∨ ((A ⊕ B) ∧ Cᵢₙ) · 5 ' + t('porte', 'gates');
      } else {
        var R = sommaCircuito(st.a, st.b, 4, st.C), sg = R.segnali, bw = W / 5.2, bh = H * 0.3, y0 = H * 0.35;
        q.font = '11px system-ui';
        for (var i = 0; i < 4; i++) {
          var cx = W - (i + 1) * (W / 4.6), l = cx - bw / 2;
          q.fillStyle = sg['S' + i] ? 'rgba(94,234,212,.2)' : '#0e1d31'; q.strokeStyle = '#6b7d93'; q.lineWidth = 2; q.fillRect(l, y0, bw, bh); q.strokeRect(l, y0, bw, bh); q.lineWidth = 1;
          q.fillStyle = '#c9d3df'; q.textAlign = 'center'; q.fillText('FA' + i, cx, y0 + bh / 2 + 4);
          [['A' + i, cx - bw / 4], ['B' + i, cx + bw / 4]].forEach(function (z) { var v = sg[z[0]]; q.strokeStyle = v ? '#5eead4' : '#34465f'; q.lineWidth = v ? 3 : 2; q.beginPath(); q.moveTo(z[1], y0 - H * 0.12); q.lineTo(z[1], y0); q.stroke(); morsetto(q, z[1], y0 - H * 0.16, z[0], v); });
          var s = sg['S' + i]; q.strokeStyle = s ? '#5eead4' : '#34465f'; q.lineWidth = s ? 3 : 2; q.beginPath(); q.moveTo(cx, y0 + bh); q.lineTo(cx, y0 + bh + H * 0.12); q.stroke(); morsetto(q, cx, y0 + bh + H * 0.17, 'S' + i, s);
          var cin = sg['C' + i]; q.strokeStyle = cin ? '#ffd24a' : '#34465f'; q.lineWidth = cin ? 3 : 2; q.beginPath(); q.moveTo(l + bw + (i === 0 ? W * 0.05 : (W / 4.6 - bw)), y0 + bh / 2); q.lineTo(l + bw, y0 + bh / 2); q.stroke();
          q.lineWidth = 1;
        }
        var cf = R.riporto, lx = W - 4 * (W / 4.6) - bw / 2; q.strokeStyle = cf ? '#ffd24a' : '#34465f'; q.lineWidth = cf ? 3 : 2; q.beginPath(); q.moveTo(lx, y0 + bh / 2); q.lineTo(Math.max(14, lx - W * 0.05), y0 + bh / 2); q.stroke(); q.lineWidth = 1;
        q.fillStyle = '#ffd24a'; q.textAlign = 'left'; q.fillText('C₄ = ' + cf, 4, y0 + bh / 2 - 8); q.textAlign = 'right'; q.fillText('C₀ = ' + st.C, W - 4, y0 + bh / 2 - 8); q.textAlign = 'left';
        var tot = cf * 16 + R.somma;
        testo = st.a + ' + ' + st.b + (st.C ? ' + 1' : '') + ' = <b class="bsiFX-num">' + tot + '</b> = ' + cf + ('000' + R.somma.toString(2)).slice(-4) + '₂ ' + (tot === st.a + st.b + st.C ? '✓' : '✗') + (cf ? ' · ' + t('trabocco: il risultato non sta in 4 bit (C₄ = 1)', 'overflow: the result does not fit in 4 bits (C₄ = 1)') : '') + ' · ' + R.porte + t(' porte; il riporto (in giallo) attraversa 4 stadi: ritardo ∝ n', ' gates; the carry (yellow) crosses 4 stages: delay ∝ n');
      }
      cv.setAttribute('aria-label', t('circuito logico: i fili accesi (1) sono colorati', 'logic circuit: wires at 1 are coloured'));
      info.innerHTML = testo + '<br>' + t('Le porte calcolano funzioni booleane: AND (∧), OR (∨), XOR (⊕, «o esclusivo»). Il semiaddizionatore somma due bit (S = A ⊕ B e riporto C = A ∧ B); l’addizionatore completo somma anche il riporto in arrivo; mettendone n in fila il riporto passa da uno stadio al successivo (ripple carry), come nell’addizione in colonna. Le CPU usano varianti con il riporto anticipato (carry look-ahead) per non aspettare la propagazione.', 'Gates compute Boolean functions: AND (∧), OR (∨), XOR (⊕, “exclusive or”). The half adder adds two bits (S = A ⊕ B and carry C = A ∧ B); the full adder also adds the incoming carry; chaining n of them the carry passes from one stage to the next (ripple carry), like column addition. CPUs use carry look-ahead variants so as not to wait for the propagation.');
    }
    pannello(); disegna(); F.alRidimensiona(disegna);
  }

  /* ═══ 3. macchina di Turing ═════════════════════════════════════════════ */
  function schedaTuring(div) {
    var Gp = griglia(div), st = { m: 'incremento', corre: false, vel: 4, acc: 0, vis: 0 }, info = nota(Gp.pan), regole = F.el('div', { style: 'overflow-x:auto' }), M;
    F.scelta(Gp.pan, ['Programma', 'Program'], Object.keys(MACCHINE).map(function (k) { return [k, MACCHINE[k].nome]; }), st.m, function (v) { st.m = v; inp.value = MACCHINE[v].ingresso; nuovo(); });
    var inp = campo(Gp.pan, ['Nastro iniziale', 'Initial tape'], MACCHINE[st.m].ingresso, function () { nuovo(); });
    F.bottone(Gp.pan, ['Passo', 'Step'], function () { st.corre = false; passoMT(M); testo(); ctl.sveglia(); });
    var bCorri = F.bottone(Gp.pan, ['▶ Esegui', '▶ Run'], function () { st.corre = !st.corre; if (M.ferma) { nuovo(); st.corre = true; } bCorri.textContent = st.corre ? t('❚❚ Ferma', '❚❚ Stop') : t('▶ Esegui', '▶ Run'); ctl.sveglia(); });
    F.bottone(Gp.pan, ['↺ Da capo', '↺ Reset'], function () { nuovo(); });
    F.cursore(Gp.pan, ['passi al secondo', 'steps per second'], 1, 40, 1, st.vel, function (v) { st.vel = v; });
    Gp.pan.appendChild(info);
    var cv = F.tela(Gp.dx, 0.42), ctl; Gp.dx.appendChild(regole);
    function nuovo() {
      var d = MACCHINE[st.m], s = String(inp.value || '').slice(0, 40).replace(/\s/g, '');
      M = creaMT(d, s); st.vis = 0; st.acc = 0; st.corre = false; if (bCorri) bCorri.textContent = t('▶ Esegui', '▶ Run'); testo(); if (ctl) ctl.sveglia();
    }
    function testo() {
      var d = M.def, esito = M.ferma ? (M.bloccata ? t('si ferma: nessuna regola per (', 'halts: no rule for (') + M.stato + ', ' + leggi(M, M.testa) + ')' : t('si ferma nello stato ', 'halts in state ') + '<b>' + M.stato + '</b>') : t('stato ', 'state ') + '<b>' + M.stato + '</b>';
      info.innerHTML = t('Passi: ', 'Steps: ') + '<b class="bsiFX-num">' + M.passi + '</b> · ' + esito + ' · ' + t('uni sul nastro: ', 'ones on tape: ') + contaUni(M) + '<br>' + t('Nastro: ', 'Tape: ') + '<span class="bsiFX-num">' + esc(nastroStringa(M).replace(/_/g, '␣') || '␣') + '</span><br>' + F.tt(d.descr) + '<br>' + t('Una macchina di Turing (1936) ha un nastro infinito, una testina che legge e scrive un simbolo, un numero finito di stati e una tavola: (stato, simbolo letto) → (simbolo da scrivere, mossa ←/→, nuovo stato). Tutto ciò che è calcolabile da un algoritmo lo è da una macchina così (tesi di Church–Turing); ma non esiste un programma che decida se una macchina qualsiasi si fermerà (problema della fermata), ed è per questo che Σ(n) non è calcolabile.', 'A Turing machine (1936) has an infinite tape, a head that reads and writes a symbol, finitely many states and a table: (state, symbol read) → (symbol to write, move ←/→, new state). Everything computable by an algorithm is computable by such a machine (Church–Turing thesis); but no program can decide whether an arbitrary machine will halt (halting problem), which is why Σ(n) is not computable.');
      var R = d.regole;
      regole.innerHTML = '<table class="bsiFX-tab"><tr><th>' + t('stato, letto', 'state, read') + '</th><th>' + t('scrive', 'writes') + '</th><th>' + t('mossa', 'move') + '</th><th>' + t('nuovo stato', 'new state') + '</th></tr>' + Object.keys(R).map(function (k) { var r = R[k], att = M.ultima === k; return '<tr' + (att ? ' style="background:rgba(255,210,74,.18)"' : '') + '><td>' + esc(k.replace(/_/g, '␣')) + '</td><td class="bsiFX-num">' + esc(r[0].replace(/_/g, '␣')) + '</td><td>' + (r[1] < 0 ? '←' : r[1] > 0 ? '→' : '·') + '</td><td>' + r[2] + '</td></tr>'; }).join('') + '</table>';
    }
    nuovo();
    ctl = F.anima(cv, function (dt) {
      if (st.corre && !M.ferma) { st.acc += dt * st.vel; var fatti = 0; while (st.acc >= 1 && !M.ferma && fatti < 50) { passoMT(M); st.acc -= 1; fatti++; } if (fatti) testo(); if (M.ferma) { st.corre = false; bCorri.textContent = t('▶ Esegui', '▶ Run'); } }
      st.vis += (M.testa - st.vis) * Math.min(1, dt * 12 || 1);
      var P = F.pennello(cv), q = P.q, W = P.W, H = P.H, cw = Math.max(26, Math.min(44, W / 13)), y = H * 0.38, n = Math.ceil(W / cw) + 2, cx = W / 2;
      q.font = 'bold ' + Math.round(cw * 0.5) + 'px system-ui'; q.textAlign = 'center'; q.textBaseline = 'middle';
      var i0 = Math.floor(st.vis - n / 2);
      for (var i = i0; i <= i0 + n; i++) {
        var x = cx + (i - st.vis) * cw - cw / 2, c = leggi(M, i), sotto = i === M.testa;
        q.fillStyle = sotto ? 'rgba(255,210,74,.22)' : c === '1' ? 'rgba(94,234,212,.2)' : '#0e1d31'; q.fillRect(x + 1, y - cw / 2, cw - 2, cw);
        q.strokeStyle = '#34465f'; q.strokeRect(x + 1, y - cw / 2, cw - 2, cw);
        if (c !== M.def.vuoto || M.def.vuoto !== '_') { q.fillStyle = c === M.def.vuoto ? '#5b6b80' : c === '1' ? '#5eead4' : '#e6fffb'; q.fillText(c, x + cw / 2, y + 1); }
      }
      /* la testina e lo stato */
      var hx = cx + (M.testa - st.vis) * cw;
      q.fillStyle = '#ffd24a'; q.beginPath(); q.moveTo(hx, y + cw / 2 + 4); q.lineTo(hx - 10, y + cw / 2 + 20); q.lineTo(hx + 10, y + cw / 2 + 20); q.closePath(); q.fill();
      q.font = 'bold 14px system-ui'; q.fillText(M.stato, hx, y + cw / 2 + 34);
      q.textAlign = 'left'; q.font = '12px system-ui'; q.fillStyle = '#9fb1c6'; q.fillText(t('passi ', 'steps ') + M.passi, 10, 16);
      q.textBaseline = 'alphabetic';
      cv.setAttribute('aria-label', t('nastro della macchina di Turing, stato ', 'Turing machine tape, state ') + M.stato + t(', passi ', ', steps ') + M.passi);
      if (!st.corre && Math.abs(M.testa - st.vis) < 0.005) { st.vis = M.testa; return false; }
    }, { ricomincia: function () { nuovo(); } });
  }

  /* ═══ 4. insiemi e diagrammi di Venn ════════════════════════════════════ */
  var ESPR = ['A ∪ B', 'A ∩ B′', '(A ∖ B) ∪ C', 'A Δ B', '(A ∪ B)′', 'A′ ∩ B′', 'A ∩ (B ∪ C)', '(A ∩ B) ∪ (A ∩ C)', 'A ∩ B ∩ C', '(A ∪ B ∪ C)′'];
  function schedaVenn(div) {
    var Gp = griglia(div), st = { e: '(A ∖ B) ∪ C', dim: [5, 8, 6, 3, 7, 2, 4, 1] }, info = nota(Gp.pan), cache = { k: '' };
    F.scelta(Gp.pan, ['Esempi', 'Examples'], ESPR.map(function (e) { return [e, e]; }), st.e, function (v) { st.e = v; inp.value = v; disegna(); });
    var inp = campo(Gp.pan, ['Espressione (∪ ∩ ∖ Δ ′, oppure | & - ^ \')', 'Expression (∪ ∩ ∖ Δ ′, or | & - ^ \')'], st.e, function (v) { st.e = v; disegna(); });
    var tasti = F.el('div'); ['A', 'B', 'C', '∪', '∩', '∖', 'Δ', '′', '(', ')'].forEach(function (s) { tasti.appendChild(F.el('button', { type: 'button', 'class': 'bsiFX-bott', testo: s, style: 'min-width:34px;padding:4px 8px', 'aria-label': t('inserisci ', 'insert ') + s, onclick: function () { inp.value += s; st.e = inp.value; disegna(); } })); });
    F.bottone(tasti, ['⌫', '⌫'], function () { inp.value = Array.from(inp.value).slice(0, -1).join(''); st.e = inp.value; disegna(); });
    Gp.pan.appendChild(tasti);
    var NOMI = ['', 'A', 'B', 'AB', 'C', 'AC', 'BC', 'ABC'];
    for (var r = 1; r < 8; r++) (function (r) { F.cursore(Gp.pan, ['elementi solo in ' + NOMI[r].split('').join('∩'), 'elements only in ' + NOMI[r].split('').join('∩')], 0, 20, 1, st.dim[r], function (v) { st.dim[r] = v; disegna(); }); })(r);
    F.cursore(Gp.pan, ['elementi fuori (in U)', 'elements outside (in U)'], 0, 20, 1, st.dim[0], function (v) { st.dim[0] = v; disegna(); });
    Gp.pan.appendChild(info);
    var cv = F.tela(Gp.dx, 0.72);
    function geometria(W, H) { var R = Math.min(W, H) * 0.27, cx = W / 2, cy = H * 0.52, d = R * 0.62; return { R: R, C: [[cx - d, cy - d * 0.55], [cx + d, cy - d * 0.55], [cx, cy + d * 0.6]] }; }
    function regione(g, x, y) { var r = 0; for (var k = 0; k < 3; k++) { var dx = x - g.C[k][0], dy = y - g.C[k][1]; if (dx * dx + dy * dy <= g.R * g.R) r |= 1 << k; } return r; }
    function disegna() {
      var mask = null, err = null; try { mask = analizzaInsiemi(st.e); } catch (e) { err = e.message; }
      var P = F.pennello(cv), q = P.q, W = P.W, H = P.H, g = geometria(W, H), dpr = cv.width / W;
      /* l'ombreggiatura pixel per pixel (in pixel veri della tela) */
      /* la mappa «pixel → regione» si calcola una volta per dimensione della tela (255 = fuori da U) */
      if (!cache.mappa || cache.mk !== cv.width + 'x' + cv.height) {
        var mp = new Uint8Array(cv.width * cv.height);
        for (var py = 0; py < cv.height; py++) for (var px = 0; px < cv.width; px++) { var x = px / dpr, y = py / dpr; mp[py * cv.width + px] = x > 8 && x < W - 8 && y > 8 && y < H - 8 ? regione(g, x, y) : 255; }
        cache.mappa = mp; cache.mk = cv.width + 'x' + cv.height;
      }
      if (mask !== null) {
        var img = q.getImageData(0, 0, cv.width, cv.height), d = img.data, M = cache.mappa, cw0 = cv.width;
        for (var j = 0; j < M.length; j++) { var rr = M[j]; if (rr === 255 || !(mask >> rr & 1)) continue; var o = 4 * j, ch = (((j % cw0) + ((j / cw0) | 0)) >> 2) & 1; d[o] = ch ? 230 : 255; d[o + 1] = ch ? 170 : 196; d[o + 2] = ch ? 70 : 90; d[o + 3] = 255; }
        q.putImageData(img, 0, 0);
      }
      q.strokeStyle = '#9fb1c6'; q.lineWidth = 1.5; q.strokeRect(8, 8, W - 16, H - 16); q.fillStyle = '#9fb1c6'; q.font = '13px system-ui'; q.fillText('U', 14, 26);
      var colC = ['#6bcfff', '#ff8a80', '#5eead4'];
      g.C.forEach(function (c, k) { q.strokeStyle = colC[k]; q.lineWidth = 2.5; q.beginPath(); q.arc(c[0], c[1], g.R, 0, Math.PI * 2); q.stroke(); });
      q.lineWidth = 1; q.font = 'bold 16px system-ui'; q.textAlign = 'center'; q.textBaseline = 'middle';
      [['A', g.C[0][0] - g.R * 0.75, g.C[0][1] - g.R * 0.85], ['B', g.C[1][0] + g.R * 0.75, g.C[1][1] - g.R * 0.85], ['C', g.C[2][0] + g.R * 0.95, g.C[2][1] + g.R * 0.85]].forEach(function (z, k) { q.fillStyle = colC[k]; q.fillText(z[0], z[1], z[2]); });
      /* il numero di elementi al baricentro di ogni regione (stimato a campione) */
      if (cache.k !== W + 'x' + H) { var som = []; for (var k2 = 0; k2 < 8; k2++) som.push([0, 0, 0]); for (var yy = 10; yy < H - 10; yy += 4) for (var xx = 10; xx < W - 10; xx += 4) { var r2 = regione(g, xx, yy); som[r2][0] += xx; som[r2][1] += yy; som[r2][2]++; } cache.k = W + 'x' + H; cache.c = (som.map(function (s) { return [s[0] / s[2], s[1] / s[2]]; })); }
      q.font = 'bold 13px system-ui';
      for (var r3 = 1; r3 < 8; r3++) { var cc = cache.c[r3]; q.fillStyle = mask !== null && (mask >> r3 & 1) ? '#081522' : '#e6fffb'; q.fillText(String(st.dim[r3]), cc[0], cc[1]); }
      q.fillStyle = mask !== null && (mask & 1) ? '#081522' : '#e6fffb'; q.fillText(String(st.dim[0]), W - 30, H - 26);
      q.textAlign = 'left'; q.textBaseline = 'alphabetic';
      cv.setAttribute('aria-label', t('diagramma di Venn di tre insiemi con la regione ', 'Venn diagram of three sets with the region ') + st.e + t(' colorata', ' shaded'));
      var IE = inclusioneEsclusione(st.dim), T = IE.termini;
      info.innerHTML = (err ? '<span class="bsiFX-ko">' + esc(err) + '</span>' : '|' + esc(st.e) + '| = <b class="bsiFX-num">' + cardinalita(mask, st.dim) + '</b> · ' + t('regioni: ', 'regions: ') + [0, 1, 2, 3, 4, 5, 6, 7].filter(function (r4) { return mask >> r4 & 1; }).map(function (r4) { return r4 ? NOMI[r4] : t('fuori', 'outside'); }).join(', ')) +
        '<br>' + t('Inclusione-esclusione: ', 'Inclusion–exclusion: ') + '|A∪B∪C| = ' + T.A + ' + ' + T.B + ' + ' + T.C + ' − ' + T.AB + ' − ' + T.AC + ' − ' + T.BC + ' + ' + T.ABC + ' = <b>' + IE.ie + '</b> · ' + t('contando le regioni: ', 'counting the regions: ') + IE.diretta + ' ' + (IE.ie === IE.diretta ? '✓' : '✗') +
        '<br>' + t('Ogni elemento di A∪B∪C che sta in k insiemi è contato k volte nei singoli, C(k,2) volte nelle coppie e C(k,3) nella terna: k − C(k,2) + C(k,3) = 1 per k = 1, 2, 3. In generale |⋃Aᵢ| = Σ|Aᵢ| − Σ|Aᵢ∩Aⱼ| + … ± |A₁∩…∩Aₙ|. Le leggi di De Morgan (A∪B)′ = A′∩B′ e (A∩B)′ = A′∪B′ e la distributività A∩(B∪C) = (A∩B)∪(A∩C) si vedono confrontando le aree colorate: le stesse regioni, la stessa maschera.', 'Each element of A∪B∪C lying in k sets is counted k times in the singles, C(k,2) times in the pairs and C(k,3) in the triple: k − C(k,2) + C(k,3) = 1 for k = 1, 2, 3. In general |⋃Aᵢ| = Σ|Aᵢ| − Σ|Aᵢ∩Aⱼ| + … ± |A₁∩…∩Aₙ|. De Morgan’s laws (A∪B)′ = A′∩B′ and (A∩B)′ = A′∪B′ and distributivity A∩(B∪C) = (A∩B)∪(A∩C) are seen by comparing the shaded areas: same regions, same mask.');
    }
    disegna(); F.alRidimensiona(function () { cache.k = ''; disegna(); });
  }

  F.sezione('smatlogica', {
    titolo: ['🧠 Logica e calcolabilità', '🧠 Logic and computability'],
    sotto: ['Le tavole di verità con le forme normali, i circuiti che sommano numeri binari, la macchina di Turing con i castori indaffarati, gli insiemi con i diagrammi di Venn e l’inclusione-esclusione.', 'Truth tables with normal forms, circuits that add binary numbers, the Turing machine with busy beavers, sets with Venn diagrams and inclusion–exclusion.'],
    schede: [
      { nome: ['⊨ Tavole di verità', '⊨ Truth tables'], costruisci: schedaVerita },
      { nome: ['🔌 Circuiti logici', '🔌 Logic circuits'], costruisci: schedaCircuiti },
      { nome: ['📼 Macchina di Turing', '📼 Turing machine'], costruisci: schedaTuring },
      { nome: ['⭕ Insiemi e Venn', '⭕ Sets and Venn'], costruisci: schedaVenn }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
