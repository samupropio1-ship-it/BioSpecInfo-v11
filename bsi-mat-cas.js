/* ═══════════════════════════════════════════════════════════════════════════
   bsi-mat-cas.js — il motore di calcolo simbolico della categoria «📐 Matematica»
   BioSpecInfo · © Samuele Pio Provenzano

   CHE COSA FA

   Legge un'espressione scritta come la si scrive a mano (2x² + sin(3x),
   √(x+1), e^(−kt), ln(x)/x …) e la trasforma in un albero su cui si
   lavora in modo ESATTO:

   · i numeri sono frazioni (1/3 resta 1/3, non 0,3333); solo i decimali
     che non stanno in una frazione ragionevole diventano numeri in virgola
     mobile;
   · la semplificazione mette l'albero in forma canonica: somme di termini
     con coefficiente, prodotti di basi con esponente, termini simili
     raccolti (x + x = 2x, x·x² = x³, √2·√2 = 2);
   · la derivata segue le regole (somma, prodotto, potenza, catena) e ne
     tiene il registro, che la sezione mostra come «passi»;
   · la primitiva prova linearità, tabella, sostituzione e integrazione per
     parti, e la restituisce SOLO se derivandola si riottiene la funzione di
     partenza (il controllo e' numerico, in sei punti);
   · le serie di Taylor non derivano simbolicamente n volte (l'albero
     esploderebbe): usano l'aritmetica delle serie troncate, con le
     ricorrenze classiche per exp, ln, potenze, sin/cos, divisioni; da li'
     vengono anche i limiti 0/0 (sin x / x → 1) in modo esatto.

   Non c'e' nessun eval: l'espressione e' letta da un analizzatore
   sintattico a discesa ricorsiva e calcolata da chiusure sull'albero.
   Tutto e' esposto in `BSIMatCAS` (e in BSIFisica.calcolo.cas quando c'e'),
   cosi' il banco tools/banchi/test_matematica.js lo prova in node.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';

  /* ── i numeri: frazioni esatte, con ripiego sulla virgola mobile ────────── */
  var LIM = 9007199254740991;
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var r = a % b; a = b; b = r; } return a; }
  function Q(n, d) {
    if (d === undefined) d = 1;
    if (!isFinite(n) || !isFinite(d) || d === 0) return { t: 'n', f: n / d };
    if (n % 1 !== 0 || d % 1 !== 0 || Math.abs(n) > LIM || Math.abs(d) > LIM) return { t: 'n', f: n / d };
    if (d < 0) { n = -n; d = -d; }
    var g = gcd(n, d) || 1;
    return { t: 'n', n: n / g, d: d / g };
  }
  function F(v) { return { t: 'n', f: v }; }
  function esatto(e) { return e.t === 'n' && e.f === undefined; }
  function val(e) { return e.f !== undefined ? e.f : e.n / e.d; }
  function qadd(a, b) {
    if (esatto(a) && esatto(b)) { var n = a.n * b.d + b.n * a.d, d = a.d * b.d; if (Math.abs(n) < LIM && d < LIM) return Q(n, d); }
    return F(val(a) + val(b));
  }
  function qmul(a, b) {
    if (esatto(a) && esatto(b)) { var n = a.n * b.n, d = a.d * b.d; if (Math.abs(n) < LIM && d < LIM) return Q(n, d); }
    return F(val(a) * val(b));
  }
  function zero(e) { return e.t === 'n' && val(e) === 0; }
  function uno(e) { return e.t === 'n' && val(e) === 1; }
  function intero(e) { return esatto(e) && e.d === 1; }

  /* ── i costruttori ─────────────────────────────────────────────────────── */
  function S_(n) { return { t: 's', n: n }; }
  function add() { return { t: '+', a: [].slice.call(arguments) }; }
  function mul() { return { t: '*', a: [].slice.call(arguments) }; }
  function pow(b, e) { return { t: '^', a: [b, e] }; }
  function fn(n, x) { return { t: 'f', n: n, a: [x] }; }
  function neg(x) { return mul(Q(-1), x); }
  function sub(a, b) { return add(a, neg(b)); }
  function div(a, b) { return mul(a, pow(b, Q(-1))); }

  /* ── l'analizzatore sintattico ─────────────────────────────────────────── */
  var FUNZ = { fact: 1, sin: 1, cos: 1, tan: 1, asin: 1, acos: 1, atan: 1, sinh: 1, cosh: 1, tanh: 1, exp: 1, ln: 1, log: 1, sqrt: 1, abs: 1 };
  var ALIAS = { sen: 'sin', tg: 'tan', arcsin: 'asin', arcsen: 'asin', arccos: 'acos', arctan: 'atan', arctg: 'atan', senh: 'sinh', Log: 'log', Ln: 'ln', radq: 'sqrt' };
  var APICI = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-' };

  function numeroEsatto(s) {
    var m = /^(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/.exec(s);
    if (!m) return F(parseFloat(s));
    var intp = m[1] || '', frac = m[2] || '', esp = +(m[3] || 0);
    var cifre = (intp + frac).replace(/^0+(?=\d)/, ''), scala = frac.length - esp;
    if (cifre.length > 15) return F(parseFloat(s));
    var n = +cifre || 0;
    if (scala <= 0) { var v = n * Math.pow(10, -scala); return v < LIM ? Q(v) : F(v); }
    if (scala > 15) return F(parseFloat(s));
    return Q(n, Math.pow(10, scala));
  }

  function lessico(testo) {
    var s = String(testo).replace(/[−–—]/g, '-').replace(/[×·⋅∙]/g, '*').replace(/÷/g, '/').replace(/\*\*/g, '^').replace(/π/g, ' pi ').replace(/,/g, '.');
    var tok = [], i = 0;
    while (i < s.length) {
      var c = s[i];
      if (/\s/.test(c)) { i++; continue; }
      if (APICI[c]) {
        var e = ''; while (i < s.length && APICI[s[i]]) { e += APICI[s[i]]; i++; }
        tok.push({ k: 'op', v: '^' }); tok.push({ k: 'num', v: e, apice: true }); continue;
      }
      var m = /^(\d+\.?\d*(?:[eE][+-]?\d+)?|\.\d+(?:[eE][+-]?\d+)?)/.exec(s.slice(i));
      if (m) { tok.push({ k: 'num', v: m[1] }); i += m[1].length; continue; }
      m = /^[A-Za-zα-ωΑ-Ω_][A-Za-z0-9_α-ωΑ-Ω]*/.exec(s.slice(i));
      if (m) { tok.push({ k: 'id', v: m[0] }); i += m[0].length; continue; }
      if ('+-*/^()|√=!'.indexOf(c) >= 0) { tok.push({ k: 'op', v: c }); i++; continue; }
      if (c === '[' || c === '{') { tok.push({ k: 'op', v: '(' }); i++; continue; }
      if (c === ']' || c === '}') { tok.push({ k: 'op', v: ')' }); i++; continue; }
      throw new Error('carattere non riconosciuto: «' + c + '»');
    }
    return tok;
  }

  function leggi(testo) {
    var tok = lessico(testo), p = 0;
    if (!tok.length) throw new Error('espressione vuota');
    function vedi() { return tok[p]; }
    function e_op(v) { var t = tok[p]; return t && t.k === 'op' && t.v === v; }
    function prendi(v) { if (!e_op(v)) throw new Error('manca «' + v + '»' + (tok[p] ? ' prima di «' + tok[p].v + '»' : ' alla fine')); p++; }
    function inizioPrimario(t) { return t && (t.k === 'num' || t.k === 'id' || (t.k === 'op' && (t.v === '(' || t.v === '√'))); }
    function somma() {
      var a = prodotto();
      while (e_op('+') || e_op('-')) { var o = tok[p++].v, b = prodotto(); a = o === '+' ? add(a, b) : sub(a, b); }
      return a;
    }
    function prodotto() {
      var a = unario();
      for (;;) {
        if (e_op('*')) { p++; a = mul(a, unario()); }
        else if (e_op('/')) { p++; a = div(a, unario()); }
        else if (inizioPrimario(vedi())) a = mul(a, potenza());
        else break;
      }
      return a;
    }
    function unario() {
      if (e_op('-')) { p++; return neg(unario()); }
      if (e_op('+')) { p++; return unario(); }
      return potenza();
    }
    function potenza() {
      var b = primario();
      while (e_op('!')) { p++; b = fn('fact', b); }
      if (e_op('^')) { p++; return pow(b, unario()); }
      return b;
    }
    function primario() {
      var t = vedi();
      if (!t) throw new Error('espressione incompleta');
      if (t.k === 'num') { p++; return numeroEsatto(t.v); }
      if (t.k === 'op' && t.v === '(') { p++; var x = somma(); prendi(')'); return x; }
      if (t.k === 'op' && t.v === '|') { p++; var y = somma(); prendi('|'); return fn('abs', y); }
      if (t.k === 'op' && t.v === '√') { p++; return pow(potenza(), Q(1, 2)); }
      if (t.k === 'id') {
        p++;
        var nome = ALIAS[t.v] || t.v;
        if (FUNZ[nome]) {
          var arg;
          if (e_op('^') && tok[p + 1] && tok[p + 1].k === 'num' && tok[p + 2] && tok[p + 2].k === 'op' && tok[p + 2].v === '(') {
            /* sin²(x) = (sin x)² */
            p++; var esp = numeroEsatto(tok[p++].v); prendi('('); arg = somma(); prendi(')');
            return pow(costruisciF(nome, arg), esp);
          }
          if (e_op('(')) { p++; arg = somma(); prendi(')'); } else arg = potenza();
          return costruisciF(nome, arg);
        }
        if (nome === 'pi' || nome === 'PI') return S_('π');
        return S_(nome);
      }
      throw new Error('simbolo inatteso «' + t.v + '»');
    }
    function costruisciF(nome, arg) {
      if (nome === 'sqrt') return pow(arg, Q(1, 2));
      return fn(nome, arg);
    }
    var r = somma();
    if (p < tok.length) throw new Error('simbolo inatteso «' + tok[p].v + '»');
    return S(r);
  }

  /* ── la forma canonica ─────────────────────────────────────────────────── */
  function chiave(e) {
    switch (e.t) {
      case 'n': return esatto(e) ? (e.d === 1 ? '' + e.n : e.n + '/' + e.d) : '~' + e.f;
      case 's': return e.n;
      case 'f': return e.n + '(' + chiave(e.a[0]) + ')';
      case '^': return '(' + chiave(e.a[0]) + ')^(' + chiave(e.a[1]) + ')';
      default: return e.t + '[' + e.a.map(chiave).join(',') + ']';
    }
  }
  function rango(e) { return e.t === 'n' ? 0 : e.t === 's' ? 1 : e.t === '^' ? rango(e.a[0]) : e.t === 'f' ? 3 : 4; }
  function grado(e) {
    if (e.t === 's') return 1;
    if (e.t === '^' && e.a[0].t === 's' && e.a[1].t === 'n') return val(e.a[1]);
    if (e.t === '*') return e.a.reduce(function (g, f) { return g + (f.t === 'n' ? 0 : grado(f)); }, 0);
    return 0;
  }

  var COST = { 'π': Math.PI, e: Math.E };

  function S(e) {
    switch (e.t) {
      case 'n': case 's': return e;
      case 'f': return sempF(e.n, S(e.a[0]));
      case '^': return sempPow(S(e.a[0]), S(e.a[1]));
      case '*': return sempMul(e.a.map(S));
      case '+': return sempAdd(e.a.map(S));
    }
    return e;
  }

  function sempF(n, x) {
    var v = x.t === 'n' ? val(x) : null;
    if (x.t === 'n' && !esatto(x)) return F(valuta(fn(n, x), {}));
    if (v === 0) { if (n === 'sin' || n === 'tan' || n === 'asin' || n === 'atan' || n === 'sinh' || n === 'tanh' || n === 'abs') return Q(0); if (n === 'cos' || n === 'cosh' || n === 'exp') return Q(1); }
    if (n === 'fact' && x.t === 'n' && intero(x) && x.n >= 0 && x.n <= 20) return Q(fattoriale(x.n));
    if (v === 1 && (n === 'ln')) return Q(0);
    if (v === 1 && n === 'log') return Q(0);
    if (n === 'log' && esatto(x) && x.d === 1 && x.n > 0) { var l = Math.round(Math.log10(x.n)); if (Math.pow(10, l) === x.n) return Q(l); }
    if (n === 'ln' && x.t === 's' && x.n === 'e') return Q(1);
    if (n === 'ln' && x.t === 'f' && x.n === 'exp') return x.a[0];
    if (n === 'exp' && x.t === 'f' && x.n === 'ln') return x.a[0];
    /* e^(c·ln u) = u^c e e^(a + c·ln u) = e^a·u^c, con c numerico */
    if (n === 'exp' && x.t === '*' && x.a.length === 2 && x.a[0].t === 'n' && x.a[1].t === 'f' && x.a[1].n === 'ln') return sempPow(x.a[1].a[0], x.a[0]);
    if (n === 'exp' && x.t === '+') {
      var lnT = x.a.filter(function (y) { return y.t === 'f' && y.n === 'ln' || y.t === '*' && y.a.length === 2 && y.a[0].t === 'n' && y.a[1].t === 'f' && y.a[1].n === 'ln'; });
      if (lnT.length) { var altri = x.a.filter(function (y) { return lnT.indexOf(y) < 0; }); return sempMul([altri.length ? sempF('exp', altri.length === 1 ? altri[0] : sempAdd(altri)) : Q(1)].concat(lnT.map(function (y) { return y.t === 'f' ? y.a[0] : sempPow(y.a[1].a[0], y.a[0]); }))); }
    }
    if (n === 'abs' && x.t === 'n') return Q(Math.abs(x.n), x.d);
    if (n === 'abs' && x.t === 'f' && x.n === 'abs') return x;
    if (x.t === 's' && x.n === 'π') { if (n === 'sin' || n === 'tan') return Q(0); if (n === 'cos') return Q(-1); }
    /* le funzioni dispari portano fuori il segno: sin(−x) = −sin(x) */
    if ((n === 'sin' || n === 'tan' || n === 'asin' || n === 'atan' || n === 'sinh' || n === 'tanh') && negativo(x)) return sempMul([Q(-1), sempF(n, sempMul([Q(-1), x]))]);
    if ((n === 'cos' || n === 'cosh' || n === 'abs') && negativo(x)) return sempF(n, sempMul([Q(-1), x]));
    return fn(n, x);
  }
  function negativo(x) { return (x.t === 'n' && val(x) < 0) || (x.t === '*' && x.a[0].t === 'n' && val(x.a[0]) < 0); }

  function radiceEsatta(n, q) { var r = Math.round(Math.pow(n, 1 / q)); for (var k = r - 1; k <= r + 1; k++) if (k >= 0 && Math.pow(k, q) === n) return k; return null; }

  function sempPow(b, x) {
    if (zero(x)) return Q(1);
    if (uno(x)) return b;
    if (uno(b)) return Q(1);
    if (b.t === 's' && b.n === 'e') return sempF('exp', x);
    /* (−s + 2)⁻¹ = −(s − 2)⁻¹: le somme elevate a potenza intera cominciano con un termine positivo */
    if (b.t === '+' && intero(x) && negativo(b.a[0])) {
      var opp = sempAdd(b.a.map(function (tm) { return sempMul([Q(-1), tm]); }));
      if (!(opp.t === '+' && negativo(opp.a[0]))) return sempMul([Q(Math.abs(x.n) % 2 ? -1 : 1), sempPow(opp, x)]);
    }
    if (zero(b) && x.t === 'n' && val(x) > 0) return Q(0);
    if (b.t === 'n' && x.t === 'n') {
      if (!esatto(b) || !esatto(x)) { var r = Math.pow(val(b), val(x)); return isFinite(r) ? F(r) : pow(b, x); }
      if (x.d === 1 && Math.abs(x.n) <= 200) {
        var k = Math.abs(x.n), acc = Q(1);
        for (var i = 0; i < k; i++) acc = qmul(acc, b);
        if (x.n < 0) acc = esatto(acc) ? (acc.n === 0 ? F(Infinity) : Q(acc.d, acc.n)) : F(1 / val(acc));
        return acc;
      }
      if (b.n > 0 && x.d > 1) {
        var rn = radiceEsatta(b.n, x.d), rd = radiceEsatta(b.d, x.d);
        if (rn !== null && rd !== null) return sempPow(Q(rn, rd), Q(x.n));
      }
      /* (1/2)^(1/2) → 2^(−1/2): la base e' sempre un intero */
      if (b.d > 1 && b.n === 1) return sempPow(Q(b.d), Q(-x.n, x.d));
      return pow(b, x);
    }
    if (b.t === '^' && (intero(x) || (b.a[1].t === 'n' && esatto(b.a[1]) && b.a[1].d === 1 && b.a[1].n % 2 === 1)))
      return sempPow(b.a[0], sempMul([b.a[1], x]));
    if (b.t === '*' && intero(x)) return sempMul(b.a.map(function (f) { return sempPow(f, x); }));
    if (b.t === 'f' && b.n === 'exp') return sempF('exp', sempMul([b.a[0], x]));
    return pow(b, x);
  }

  function sempMul(fattori) {
    var coef = Q(1), gruppi = {}, ordine = [], piatti = [];
    (function appiattisci(lista) { lista.forEach(function (f) { if (f.t === '*') appiattisci(f.a); else piatti.push(f); }); })(fattori);
    /* e^a · e^b = e^(a + b) */
    var esp = piatti.filter(function (f) { return f.t === 'f' && f.n === 'exp'; });
    if (esp.length > 1) { piatti = piatti.filter(function (f) { return !(f.t === 'f' && f.n === 'exp'); }); var som = sempAdd(esp.map(function (f) { return f.a[0]; })); var en = sempF('exp', som); if (en.t === '*') piatti = piatti.concat(en.a); else piatti.push(en); }
    piatti.forEach(function (f) {
      if (f.t === 'n') { coef = qmul(coef, f); return; }
      var base = f, esp = Q(1);
      if (f.t === '^') { base = f.a[0]; esp = f.a[1]; }
      var k = chiave(base);
      if (!gruppi[k]) { gruppi[k] = { b: base, e: [] }; ordine.push(k); }
      gruppi[k].e.push(esp);
    });
    if (zero(coef)) return Q(0);
    var fuori = [], ancora = false;
    ordine.forEach(function (k) {
      var g = gruppi[k], esp = g.e.length === 1 ? g.e[0] : sempAdd(g.e);
      var r = sempPow(g.b, esp);
      if (r.t === 'n') coef = qmul(coef, r);
      else if (r.t === '*') { ancora = true; fuori.push(r); }
      else fuori.push(r);
    });
    if (ancora) return sempMul([coef].concat(fuori));
    if (zero(coef)) return Q(0);
    fuori.sort(function (a, b) { var d = rango(a) - rango(b); if (d) return d; var ka = chiave(a.t === '^' ? a.a[0] : a), kb = chiave(b.t === '^' ? b.a[0] : b); return ka < kb ? -1 : ka > kb ? 1 : 0; });
    if (!fuori.length) return coef;
    if (uno(coef) && fuori.length === 1) return fuori[0];
    /* un numero per una somma si distribuisce: −(x + 1) = −x − 1 */
    if (fuori.length === 1 && fuori[0].t === '+') return sempAdd(fuori[0].a.map(function (tm) { return sempMul([coef, tm]); }));
    return { t: '*', a: (uno(coef) ? [] : [coef]).concat(fuori) };
  }

  function sempAdd(termini) {
    var cost = Q(0), gruppi = {}, ordine = [], piatti = [];
    (function appiattisci(lista) { lista.forEach(function (f) { if (f.t === '+') appiattisci(f.a); else piatti.push(f); }); })(termini);
    piatti.forEach(function (t) {
      if (t.t === 'n') { cost = qadd(cost, t); return; }
      var c = Q(1), resto = t;
      if (t.t === '*' && t.a[0].t === 'n') { c = t.a[0]; resto = t.a.length === 2 ? t.a[1] : { t: '*', a: t.a.slice(1) }; }
      var k = chiave(resto);
      if (!gruppi[k]) { gruppi[k] = { r: resto, c: Q(0) }; ordine.push(k); }
      gruppi[k].c = qadd(gruppi[k].c, c);
    });
    var fuori = [];
    ordine.forEach(function (k) {
      var g = gruppi[k];
      if (zero(g.c)) return;
      fuori.push(uno(g.c) ? g.r : sempMul([g.c, g.r]));
    });
    function senzaCoef(e) { return e.t === '*' && e.a[0].t === 'n' ? (e.a.length === 2 ? e.a[1] : { t: '*', a: e.a.slice(1) }) : e; }
    fuori.sort(function (a, b) { var d = grado(b) - grado(a); if (d) return d; var ka = chiave(senzaCoef(a)), kb = chiave(senzaCoef(b)); return ka < kb ? -1 : ka > kb ? 1 : 0; });
    if (!zero(cost)) fuori.push(cost);
    if (!fuori.length) return Q(0);
    if (fuori.length === 1) return fuori[0];
    return { t: '+', a: fuori };
  }

  /* espande prodotti di somme e potenze intere di somme (fino alla 12ª) */
  function espandi(e) {
    e = S(e);
    if (e.t === '+') return sempAdd(e.a.map(espandi));
    if (e.t === '^') {
      var b = espandi(e.a[0]);
      if (b.t === '+' && intero(e.a[1]) && e.a[1].n > 1 && e.a[1].n <= 12) { var r = b; for (var i = 1; i < e.a[1].n; i++) r = moltiplicaEspanso(r, b); return r; }
      return sempPow(b, e.a[1]);
    }
    if (e.t === '*') { var acc = Q(1); e.a.forEach(function (f) { acc = moltiplicaEspanso(acc, espandi(f)); }); return acc; }
    if (e.t === 'f') return sempF(e.n, espandi(e.a[0]));
    return e;
  }
  function moltiplicaEspanso(a, b) {
    var ta = a.t === '+' ? a.a : [a], tb = b.t === '+' ? b.a : [b], out = [];
    ta.forEach(function (x) { tb.forEach(function (y) { out.push(sempMul([x, y])); }); });
    return sempAdd(out);
  }

  /* ── il calcolo numerico sull'albero ───────────────────────────────────── */
  var FN = {
    sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan,
    sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh, exp: Math.exp, ln: Math.log, log: Math.log10, abs: Math.abs,
    fact: function (v) { return fattoriale(v); }
  };
  function fattoriale(v) { if (v % 1 === 0 && v >= 0 && v < 171) { var r = 1; for (var i = 2; i <= v; i++) r *= i; return r; } return Math.exp(lgamma(v + 1)); }
  /* logaritmo della funzione Gamma (Lanczos), per n! con n non intero o grande */
  function lgamma(x) {
    var c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    var y = x, tmp = x + 5.5; tmp -= (x + 0.5) * Math.log(tmp);
    var ser = 1.000000000190015; for (var j = 0; j < 6; j++) ser += c[j] / ++y;
    return -tmp + Math.log(2.5066282746310005 * ser / x);
  }
  function potenzaReale(b, x) {
    if (b < 0 && x % 1 !== 0) {
      /* radici dispari di numeri negativi: ∛(−8) = −2 */
      var inv = 1 / x, k = Math.round(inv);
      if (Math.abs(inv - k) < 1e-9 && k % 2 !== 0) return -Math.pow(-b, x);
      var r = rationalizza(x, 99);
      if (r && r[1] % 2 === 1) return (r[0] % 2 === 0 ? 1 : -1) * Math.pow(-b, x);
    }
    return Math.pow(b, x);
  }
  function compila(e) {
    switch (e.t) {
      case 'n': var c = val(e); return function () { return c; };
      case 's':
        if (COST[e.n] !== undefined) { var k = COST[e.n]; return function (amb) { return amb && amb[e.n] !== undefined ? amb[e.n] : k; }; }
        return function (amb) { var v = amb ? amb[e.n] : undefined; return v === undefined ? NaN : v; };
      case 'f': var g = compila(e.a[0]), f = FN[e.n]; return function (amb) { return f(g(amb)); };
      case '^':
        var b = compila(e.a[0]), x = compila(e.a[1]);
        if (e.a[1].t === 'n' && val(e.a[1]) === 0.5) return function (amb) { return Math.sqrt(b(amb)); };
        return function (amb) { return potenzaReale(b(amb), x(amb)); };
      case '+': var ta = e.a.map(compila), n = ta.length; return function (amb) { var s = 0; for (var i = 0; i < n; i++) s += ta[i](amb); return s; };
      case '*': var fa = e.a.map(compila), m = fa.length; return function (amb) { var s = 1; for (var i = 0; i < m; i++) s *= fa[i](amb); return s; };
    }
    return function () { return NaN; };
  }
  function valuta(e, amb) { return compila(e)(amb || {}); }
  /* funzione di una variabile pronta per i grafici */
  function funzione(e, nome) { var c = compila(e), amb = {}; nome = nome || 'x'; return function (v) { amb[nome] = v; return c(amb); }; }

  function dipende(e, x) {
    if (e.t === 's') return e.n === x;
    if (e.t === 'n') return false;
    return e.a.some(function (f) { return dipende(f, x); });
  }
  function simboli(e, acc) {
    acc = acc || {};
    if (e.t === 's' && COST[e.n] === undefined) acc[e.n] = 1;
    if (e.a) e.a.forEach(function (f) { simboli(f, acc); });
    return Object.keys(acc).sort();
  }
  function sostituisci(e, x, con) {
    if (e.t === 's') return e.n === x ? con : e;
    if (e.t === 'n') return e;
    return S({ t: e.t, n: e.n, a: e.a.map(function (f) { return sostituisci(f, x, con); }) });
  }

  /* ── la stampa ─────────────────────────────────────────────────────────── */
  var SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
  function apice(n) { return String(n).split('').map(function (c) { return SUP[c]; }).join(''); }
  function fmtNum(v) {
    if (!isFinite(v)) return v > 0 ? '∞' : v < 0 ? '−∞' : 'NaN';
    var a = Math.abs(v);
    if (a !== 0 && (a < 1e-4 || a >= 1e9)) { var s = v.toExponential(5).replace(/\.?0+e/, 'e'); var m = s.split('e'); return m[0] + '·10' + apice(+m[1]); }
    return String(+v.toPrecision(10));
  }
  function stampaNum(e) { return esatto(e) ? (e.d === 1 ? String(e.n) : e.n + '/' + e.d) : fmtNum(e.f); }
  function atomo(e) { return e.t === 's' || e.t === 'f' || (e.t === 'n' && esatto(e) && e.d === 1 && e.n >= 0) || (e.t === 'n' && !esatto(e) && e.f >= 0); }
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function stampa(e, html) {
    function P(e, liv) {
      var s;
      switch (e.t) {
        case 'n': s = stampaNum(e); if ((liv >= 2 && (val(e) < 0 || (esatto(e) && e.d !== 1))) ) s = '(' + s.replace(/^-/, '−') + ')'; return s.replace(/^-/, '−');
        case 's': return html && e.n.length > 1 && e.n !== 'π' ? '<i>' + esc(e.n) + '</i>' : e.n;
        case 'f':
          if (e.n === 'abs') return '|' + P(e.a[0], 0) + '|';
          if (e.n === 'fact') return (atomo(e.a[0]) && e.a[0].t !== 'f' ? P(e.a[0], 3) : '(' + P(e.a[0], 0) + ')') + '!';
          if (e.n === 'exp') { var arg = e.a[0]; if (html) return 'e<sup>' + P(arg, 0) + '</sup>'; return 'e^' + (atomo(arg) ? P(arg, 3) : '(' + P(arg, 0) + ')'); }
          return e.n + '(' + P(e.a[0], 0) + ')';
        case '^': s = stampaPow(e.a[0], e.a[1]); return liv >= 3 ? '(' + s + ')' : s;
        case '*': s = stampaProd(e); return liv >= 2 && /^[−-]/.test(s) ? '(' + s + ')' : (liv >= 3 && !atomo(e) ? '(' + s + ')' : s);
        case '+':
          s = e.a.map(function (t, i) {
            if (i === 0) return P(t, 1);
            if (negativo(t)) return ' − ' + P(sempMul([Q(-1), t]), 1);
            return ' + ' + P(t, 1);
          }).join('');
          return liv >= 2 ? '(' + s + ')' : s;
      }
      return '?';
    }
    function stampaPow(b, x) {
      if (negativo(x)) { var inv = sempPow(b, sempMul([Q(-1), x])); return '1/' + (inv.t === '*' ? '(' + P(inv, 0) + ')' : P(inv, 2)); }
      if (esatto(x) && x.n === 1 && x.d === 2) return '√' + (atomo(b) ? P(b, 3) : '(' + P(b, 0) + ')');
      if (esatto(x) && x.n === 1 && x.d === 3) return '∛' + (atomo(b) ? P(b, 3) : '(' + P(b, 0) + ')');
      var bs = atomo(b) ? P(b, 3) : '(' + P(b, 0) + ')';
      if (intero(x)) return bs + apice(x.n);
      if (html) return bs + '<sup>' + P(x, 0) + '</sup>';
      return bs + '^' + (atomo(x) ? P(x, 3) : '(' + P(x, 0) + ')');
    }
    function stampaProd(e) {
      var c = e.a[0].t === 'n' ? e.a[0] : Q(1), fatt = e.a[0].t === 'n' ? e.a.slice(1) : e.a.slice();
      var num = [], den = [];
      fatt.forEach(function (f) {
        if (f.t === '^' && negativo(f.a[1])) den.push(sempPow(f.a[0], sempMul([Q(-1), f.a[1]])));
        else num.push(f);
      });
      var segno = val(c) < 0 ? '−' : '', cn, cd = '';
      if (esatto(c)) { cn = Math.abs(c.n); if (c.d !== 1) cd = String(c.d); } else cn = fmtNum(Math.abs(c.f));
      function unisci(testa, lista, nodi) {
        var out = testa;
        lista.forEach(function (p, i) {
          if (!out) { out = p; return; }
          var f = nodi[i], semplice = (f.t === 's' && f.n.length === 1) || (f.t === '^' && f.a[0].t === 's' && f.a[0].n.length === 1) || p.charAt(0) === '(' || p.charAt(0) === '√';
          out += (/^\d+$/.test(out) && semplice) ? p : '·' + p;
        });
        return out;
      }
      var ns = unisci(cn != 1 || !num.length ? String(cn) : '', num.map(function (f) { return P(f, num.length > 1 || den.length || cn != 1 || segno ? 2 : 1); }), num);
      if (!den.length && !cd) return segno + ns;
      var ds = unisci(cd, den.map(function (f) { return P(f, 2); }), den);
      var dstr = (den.length + (cd ? 1 : 0)) > 1 ? '(' + ds + ')' : ds;
      if (num.length === 1 && num[0].t === '+' && cn == 1) ns = '(' + P(num[0], 0) + ')';
      return segno + ns + '/' + dstr;
    }
    return P(e, 0);
  }

  /* ── la derivata, con il registro delle regole ────────────────────────── */
  function deriva(e, x, passi) {
    var reg = passi || null, visti = {};
    function nota(regola, espr) {
      if (!reg || reg.length >= 14) return;
      var k = regola + '|' + chiave(espr);
      if (visti[k]) return; visti[k] = 1;
      reg.push({ regola: regola, espr: stampa(espr) });
    }
    function D(e, prof) {
      if (!dipende(e, x)) return Q(0);
      switch (e.t) {
        case 's': return Q(1);
        case '+':
          if (prof < 3) nota('somma', e);
          return sempAdd(e.a.map(function (t) { return D(t, prof + 1); }));
        case '*':
          var cost = e.a.filter(function (f) { return !dipende(f, x); }), var_ = e.a.filter(function (f) { return dipende(f, x); });
          if (cost.length && prof < 3) nota('costante', e);
          if (var_.length === 1) return sempMul(cost.concat([D(var_[0], prof + 1)]));
          if (prof < 3) nota(var_.some(function (f) { return f.t === '^' && f.a[1].t === 'n' && val(f.a[1]) < 0; }) ? 'quoziente' : 'prodotto', e);
          var termini = var_.map(function (f, i) {
            var altri = var_.filter(function (g, j) { return j !== i; });
            return sempMul(cost.concat(altri, [D(f, prof + 1)]));
          });
          return sempAdd(termini);
        case '^':
          var b = e.a[0], p = e.a[1];
          if (!dipende(p, x)) {
            if (prof < 3) nota(b.t === 's' ? 'potenza' : 'catena-potenza', e);
            return sempMul([p, sempPow(b, sempAdd([p, Q(-1)])), D(b, prof + 1)]);
          }
          if (!dipende(b, x)) {
            if (prof < 3) nota('esponenziale', e);
            return sempMul([e, sempF('ln', b), D(p, prof + 1)]);
          }
          if (prof < 3) nota('esponente-variabile', e);
          return sempMul([e, sempAdd([sempMul([D(p, prof + 1), sempF('ln', b)]), sempMul([p, D(b, prof + 1), sempPow(b, Q(-1))])])]);
        case 'f':
          var u = e.a[0], du = D(u, prof + 1), g;
          if (prof < 3) nota(u.t === 's' ? 'elementare' : 'catena', e);
          switch (e.n) {
            case 'sin': g = sempF('cos', u); break;
            case 'cos': g = sempMul([Q(-1), sempF('sin', u)]); break;
            case 'tan': g = sempPow(sempF('cos', u), Q(-2)); break;
            case 'asin': g = sempPow(sempAdd([Q(1), sempMul([Q(-1), sempPow(u, Q(2))])]), Q(-1, 2)); break;
            case 'acos': g = sempMul([Q(-1), sempPow(sempAdd([Q(1), sempMul([Q(-1), sempPow(u, Q(2))])]), Q(-1, 2))]); break;
            case 'atan': g = sempPow(sempAdd([Q(1), sempPow(u, Q(2))]), Q(-1)); break;
            case 'sinh': g = sempF('cosh', u); break;
            case 'cosh': g = sempF('sinh', u); break;
            case 'tanh': g = sempPow(sempF('cosh', u), Q(-2)); break;
            case 'exp': g = e; break;
            case 'ln': g = sempPow(u, Q(-1)); break;
            case 'log': g = sempMul([sempPow(u, Q(-1)), sempPow(sempF('ln', Q(10)), Q(-1))]); break;
            case 'abs': g = sempMul([u, sempPow(e, Q(-1))]); break;
            case 'fact': throw new Error('il fattoriale non si deriva: è definito sugli interi');
            default: throw new Error('derivata di ' + e.n + ' non nota');
          }
          return sempMul([g, du]);
      }
      return Q(0);
    }
    return D(S(e), 0);
  }
  var REGOLE = {
    somma: ['Regola della somma: si deriva termine per termine', 'Sum rule: differentiate term by term'],
    costante: ['Le costanti moltiplicative escono dalla derivata', 'Constant factors come out of the derivative'],
    prodotto: ['Regola del prodotto: (uv)′ = u′v + uv′', 'Product rule: (uv)′ = u′v + uv′'],
    quoziente: ['Regola del quoziente: (u/v)′ = (u′v − uv′)/v²', 'Quotient rule: (u/v)′ = (u′v − uv′)/v²'],
    potenza: ['Regola della potenza: (xⁿ)′ = n·xⁿ⁻¹', 'Power rule: (xⁿ)′ = n·xⁿ⁻¹'],
    'catena-potenza': ['Potenza di una funzione: (uⁿ)′ = n·uⁿ⁻¹·u′', 'Power of a function: (uⁿ)′ = n·uⁿ⁻¹·u′'],
    esponenziale: ['Esponenziale: (aᵘ)′ = aᵘ·ln(a)·u′', 'Exponential: (aᵘ)′ = aᵘ·ln(a)·u′'],
    'esponente-variabile': ['Base ed esponente variabili: (uᵛ)′ = uᵛ·(v′ ln u + v u′/u)', 'Variable base and exponent: (uᵛ)′ = uᵛ·(v′ ln u + v u′/u)'],
    elementare: ['Derivata elementare dalla tabella', 'Elementary derivative from the table'],
    catena: ['Regola della catena: f(u)′ = f′(u)·u′', 'Chain rule: f(u)′ = f′(u)·u′']
  };

  /* ── la primitiva ──────────────────────────────────────────────────────── */
  function lineare(u, x) {
    var d = deriva(u, x);
    if (dipende(d, x)) return null;
    return { a: d, c: sempAdd([u, sempMul([Q(-1), d, S_(x)])]) };
  }
  /* il registro dei metodi (tabella, sostituzione, per parti) per chi spiega lo svolgimento */
  var REG = null;
  function annota(prof, metodo, dettagli) { if (REG && prof <= 3 && REG.length < 12) REG.push({ metodo: metodo, dettagli: dettagli }); }
  function integra(e, x, registro) {
    e = S(e);
    REG = registro || null;
    var r = I(e, x, 0);
    if (!r) { var ex = espandi(e); if (chiave(ex) !== chiave(e)) { if (REG) REG.push({ metodo: 'espansione', dettagli: { espr: stampa(ex) } }); r = I(ex, x, 0); } }
    if (!r && /sin|cos/.test(stampa(e))) r = tentaTrig(e, x);
    REG = null;
    if (!r) return null;
    r = S(r);
    return verificaPrimitiva(r, e, x) ? r : null;
  }
  /* formule trigonometriche per l'integrazione: bisezione (sin²u, cos²u), duplicazione
     (sin u·cos u), prodotto in somma (sin a·cos b…), potenze dispari (sin³u = sin u·(1 − cos²u)) */
  function eTrig(f) { return f.t === 'f' && (f.n === 'sin' || f.n === 'cos'); }
  function riduciTrig(e, dispari) {
    if (!e || !e.a) return e;
    var a = e.a.map(function (y) { return riduciTrig(y, dispari); }), n = { t: e.t, n: e.n, a: a };
    if (n.t === '^' && eTrig(n.a[0]) && intero(n.a[1]) && n.a[1].n >= 2) {
      var u = n.a[0].a[0], k = n.a[1].n, sn = n.a[0].n === 'sin', altro = fn(sn ? 'cos' : 'sin', u);
      if (dispari && k % 2 === 1) return mul(n.a[0], pow(add(Q(1), mul(Q(-1), pow(altro, Q(2)))), Q((k - 1) / 2)));
      if (dispari) return n;
      var mezzo = mul(Q(1, 2), add(Q(1), mul(sn ? Q(-1) : Q(1), fn('cos', mul(Q(2), u)))));
      return k === 2 ? mezzo : mul(mezzo, k === 3 ? n.a[0] : pow(n.a[0], Q(k - 2)));
    }
    if (n.t === '*' && !dispari) {
      var tr = [], i;
      for (i = 0; i < n.a.length && tr.length < 2; i++) if (eTrig(n.a[i])) tr.push(i);
      if (tr.length === 2) {
        var f1 = n.a[tr[0]], f2 = n.a[tr[1]], A = f1.a[0], B = f2.a[0], resto = n.a.filter(function (f, j) { return j !== tr[0] && j !== tr[1]; }), somma;
        if (f1.n === 'cos' && f2.n === 'sin') { var tmp = f1; f1 = f2; f2 = tmp; A = f1.a[0]; B = f2.a[0]; }
        var piu = add(A, B), meno = add(A, mul(Q(-1), B));
        if (f1.n === 'sin' && f2.n === 'cos') somma = chiave(S(A)) === chiave(S(B)) ? mul(Q(1, 2), fn('sin', mul(Q(2), A))) : mul(Q(1, 2), add(fn('sin', piu), fn('sin', meno)));
        else if (f1.n === 'cos') somma = mul(Q(1, 2), add(fn('cos', meno), fn('cos', piu)));
        else somma = mul(Q(1, 2), add(fn('cos', meno), mul(Q(-1), fn('cos', piu))));
        return mul.apply(null, resto.concat([somma]));
      }
    }
    return n;
  }
  function tentaTrig(e, x) {
    /* prima le potenze dispari (poi una sostituzione), poi bisezione e prodotti ripetuti fino a stabilita' */
    var prove = [S(espandi(riduciTrig(e, true)))], c = e;
    for (var g = 0; g < 5; g++) { var d = S(espandi(riduciTrig(c, false))); if (chiave(d) === chiave(c)) break; c = d; prove.push(c); }
    for (var i = 0; i < prove.length; i++) {
      if (chiave(prove[i]) === chiave(e)) continue;
      var r = I(prove[i], x, 0);
      if (r) { if (REG) REG.push({ metodo: 'trigonometria', dettagli: { espr: stampa(prove[i]) } }); return r; }
    }
    return null;
  }
  function verificaPrimitiva(Fp, f, x) {
    /* gli altri simboli (costanti come R, Cv, a) prendono valori di prova fissi */
    var altri = simboli(add(Fp, f)).filter(function (v) { return v !== x; });
    var dF = compila(deriva(Fp, x)), ff = compila(f), prove = [0.37, 0.71, 1.13, 1.61, 2.3, -0.53, -1.27, 3.7], buoni = 0;
    for (var i = 0; i < prove.length; i++) {
      var amb = {}; amb[x] = prove[i];
      altri.forEach(function (v, k) { amb[v] = 0.83 + 0.37 * k + 0.05 * i; });
      var a = dF(amb), b = ff(amb);
      if (!isFinite(a) || !isFinite(b)) continue;
      if (Math.abs(a - b) > 1e-7 * (1 + Math.abs(b))) return false;
      buoni++;
    }
    return buoni >= 3;
  }
  function I(e, x, prof) {
    if (prof > 6) return null;
    var X = S_(x);
    if (!dipende(e, x)) return sempMul([e, X]);
    if (e.t === 's') return sempMul([Q(1, 2), sempPow(X, Q(2))]);
    if (e.t === '+') { annota(prof, 'linearita', { n: e.a.length }); var parti = e.a.map(function (t) { return I(t, x, prof + 1); }); return parti.every(Boolean) ? sempAdd(parti) : null; }
    if (e.t === '*') {
      var c = e.a.filter(function (f) { return !dipende(f, x); }), v = e.a.filter(function (f) { return dipende(f, x); });
      if (c.length) { annota(prof, 'costante', { c: stampa(sempMul(c)) }); var r0 = I(v.length === 1 ? v[0] : sempMul(v), x, prof + 1); return r0 ? sempMul(c.concat([r0])) : null; }
      return perParti(v, x, prof) || sostituzione(e, x, prof) || razionale(e, x, prof);
    }
    if (e.t === '^') {
      var b = e.a[0], p = e.a[1];
      if (!dipende(p, x)) {
        var L = lineare(b, x);
        if (L) {
          annota(prof, 'tabella', { espr: stampa(e), regola: val(p) === -1 ? 'ln' : 'potenza' });
          if (p.t === 'n' && val(p) === -1) return sempMul([sempPow(L.a, Q(-1)), sempF('ln', sempF('abs', b))]);
          return sempMul([sempPow(sempMul([L.a, sempAdd([p, Q(1)])]), Q(-1)), sempPow(b, sempAdd([p, Q(1)]))]);
        }
        /* 1/(a + b x²) → arctangente;  1/√(a − b x²) → arcoseno */
        var q = quadratica(b, x);
        if (q && q.lin === 0) {
          if ((val(p) === -1 && q.a > 0 && q.b > 0) || (val(p) === -0.5 && q.a > 0 && q.b < 0)) annota(prof, 'tabella', { espr: stampa(e), regola: val(p) === -1 ? 'atan' : 'asin' });
          if (val(p) === -1 && q.a > 0 && q.b > 0) return sempMul([F(1 / Math.sqrt(q.a * q.b)), sempF('atan', sempMul([F(Math.sqrt(q.b / q.a)), X]))]);
          if (val(p) === -0.5 && q.a > 0 && q.b < 0) return sempMul([F(1 / Math.sqrt(-q.b)), sempF('asin', sempMul([F(Math.sqrt(-q.b / q.a)), X]))]);
        }
        /* lnⁿ(x): per parti con u = lnⁿ x, dv = dx */
        if (intero(p) && p.n >= 2 && b.t === 'f' && b.n === 'ln' && b.a[0].t === 's' && b.a[0].n === x) {
          var Rn = I(sempPow(b, Q(p.n - 1)), x, prof + 1);
          if (Rn) { annota(prof, 'parti', { u: stampa(e), dv: '1', v: x, resto: stampa(sempMul([p, sempPow(b, Q(p.n - 1))])) }); return sempAdd([sempMul([X, e]), sempMul([Q(-p.n), Rn])]); }
        }
        return sostituzione(e, x, prof) || razionale(e, x, prof);
      }
      if (!dipende(b, x)) { var L2 = lineare(p, x); if (L2) return sempMul([e, sempPow(sempMul([L2.a, sempF('ln', b)]), Q(-1))]); }
      return null;
    }
    if (e.t === 'f') {
      var u = e.a[0], L3 = lineare(u, x);
      if (!L3) return sostituzione(e, x, prof);
      var inv = sempPow(L3.a, Q(-1)), g;
      annota(prof, 'tabella', { espr: stampa(e), regola: e.n });
      switch (e.n) {
        case 'sin': g = sempMul([Q(-1), sempF('cos', u)]); break;
        case 'cos': g = sempF('sin', u); break;
        case 'exp': g = e; break;
        case 'sinh': g = sempF('cosh', u); break;
        case 'cosh': g = sempF('sinh', u); break;
        case 'tan': g = sempMul([Q(-1), sempF('ln', sempF('abs', sempF('cos', u)))]); break;
        case 'tanh': g = sempF('ln', sempF('cosh', u)); break;
        case 'ln': g = sempAdd([sempMul([u, sempF('ln', u)]), sempMul([Q(-1), u])]); break;
        case 'log': g = sempMul([sempAdd([sempMul([u, sempF('ln', u)]), sempMul([Q(-1), u])]), sempPow(sempF('ln', Q(10)), Q(-1))]); break;
        case 'atan': g = sempAdd([sempMul([u, sempF('atan', u)]), sempMul([Q(-1, 2), sempF('ln', sempAdd([Q(1), sempPow(u, Q(2))]))])]); break;
        case 'asin': g = sempAdd([sempMul([u, sempF('asin', u)]), sempPow(sempAdd([Q(1), sempMul([Q(-1), sempPow(u, Q(2))])]), Q(1, 2))]); break;
        default: return null;
      }
      return sempMul([inv, g]);
    }
    return null;
  }
  /* funzioni razionali: fratti semplici (radici del denominatore, coefficienti con i minimi quadrati, poi esatti) */
  function numQ(v) { for (var d = 1; d <= 2000; d++) { var n = Math.round(v * d); if (Math.abs(v - n / d) < 1e-9 * Math.max(1, Math.abs(v))) return Q(n, d); } return F(v); }
  function razionale(e, x, prof) {
    if (prof > 4) return null;
    var fatt = e.t === '*' ? e.a : [e], num = [], den = [];
    fatt.forEach(function (f) { if (f.t === '^' && f.a[1].t === 'n' && val(f.a[1]) < 0) den.push(sempPow(f.a[0], sempMul([Q(-1), f.a[1]]))); else num.push(f); });
    if (!den.length) return null;
    var cN = coeffPolinomio(num.length ? sempMul(num) : Q(1), x), cD = coeffPolinomio(sempMul(den), x);
    if (!cN || !cD || cD.length < 2) return null;
    var X = S_(x), parti = [];
    /* divisione se serve */
    if (cN.length >= cD.length) {
      var qz = new Array(cN.length - cD.length + 1).fill(0), r = cN.slice();
      for (var k = cN.length - cD.length; k >= 0; k--) { var cq = r[k + cD.length - 1] / cD[cD.length - 1]; qz[k] = cq; for (var j = 0; j < cD.length; j++) r[k + j] -= cq * cD[j]; }
      qz.forEach(function (c, i) { if (Math.abs(c) > 1e-14) parti.push(sempMul([numQ(c / (i + 1)), sempPow(X, Q(i + 1))])); });
      cN = r.slice(0, cD.length - 1);
    }
    var rad = radiciPolinomio(cD), reali = [], cpl = [];
    rad.forEach(function (z) {
      if (!z.im) { var g = reali.filter(function (q) { return Math.abs(q.r - z.re) < 1e-7 * (1 + Math.abs(z.re)); })[0]; if (g) g.m++; else reali.push({ r: z.re, m: 1 }); }
      else if (z.im > 0) { var g2 = cpl.filter(function (q) { return Math.abs(q.a - z.re) + Math.abs(q.b - z.im) < 1e-7; })[0]; if (g2) g2.m++; else cpl.push({ a: z.re, b: z.im, m: 1 }); }
    });
    if (cpl.some(function (q) { return q.m > 1; })) return null;
    var base = [];
    reali.forEach(function (q) { for (var k = 1; k <= q.m; k++) base.push({ t: 'r', r: q.r, k: k }); });
    cpl.forEach(function (q) { var p_ = -2 * q.a, q_ = q.a * q.a + q.b * q.b; base.push({ t: 'x', p: p_, q: q_ }); base.push({ t: '1', p: p_, q: q_ }); });
    function phi(b, v) { if (b.t === 'r') return 1 / Math.pow(v - b.r, b.k); var Qv = v * v + b.p * v + b.q; return b.t === 'x' ? v / Qv : 1 / Qv; }
    function pol(c, v) { var s = 0; for (var k = c.length - 1; k >= 0; k--) s = s * v + c[k]; return s; }
    var m = base.length, A = [], y = [], i;
    for (i = 0; A.length < m + 6 && i < 200; i++) { var v = -2.91 + 0.613 * i; if (Math.abs(pol(cD, v)) < 1e-4) continue; A.push(base.map(function (b) { return phi(b, v); })); y.push(pol(cN, v) / pol(cD, v)); }
    /* equazioni normali */
    var M = [], bb = [];
    for (i = 0; i < m; i++) { M.push([]); for (var j2 = 0; j2 < m; j2++) { var s2 = 0; for (var k2 = 0; k2 < A.length; k2++) s2 += A[k2][i] * A[k2][j2]; M[i].push(s2); } var sb = 0; for (k2 = 0; k2 < A.length; k2++) sb += A[k2][i] * y[k2]; bb.push(sb); }
    for (var c = 0; c < m; c++) { var pv = c; for (i = c + 1; i < m; i++) if (Math.abs(M[i][c]) > Math.abs(M[pv][c])) pv = i; var tmp = M[c]; M[c] = M[pv]; M[pv] = tmp; var tb = bb[c]; bb[c] = bb[pv]; bb[pv] = tb; if (Math.abs(M[c][c]) < 1e-14) return null; for (i = 0; i < m; i++) if (i !== c) { var fct = M[i][c] / M[c][c]; for (var j3 = c; j3 < m; j3++) M[i][j3] -= fct * M[c][j3]; bb[i] -= fct * bb[c]; } }
    var co = bb.map(function (v2, i2) { return v2 / M[i2][i2]; });
    base.forEach(function (b, k3) {
      var cc = co[k3];
      if (b.t === 'r') {
        if (Math.abs(cc) < 1e-12) return;
        var lin = sempAdd([X, sempMul([Q(-1), numQ(b.r)])]);
        parti.push(b.k === 1 ? sempMul([numQ(cc), sempF('ln', sempF('abs', lin))]) : sempMul([numQ(-cc / (b.k - 1)), sempPow(lin, Q(1 - b.k))]));
      } else if (b.t === 'x') {
        var Bq = cc, Cq = co[k3 + 1], d4 = numQ(4 * b.q - b.p * b.p), Qn = sempAdd([sempPow(X, Q(2)), sempMul([numQ(b.p), X]), numQ(b.q)]), rq = sempPow(d4, Q(-1, 2));
        if (Math.abs(Bq) > 1e-12) parti.push(sempMul([numQ(Bq / 2), sempF('ln', Qn)]));
        var k4 = Cq - Bq * b.p / 2;
        if (Math.abs(k4) > 1e-12) parti.push(sempMul([numQ(2 * k4), rq, sempF('atan', sempMul([sempAdd([sempMul([Q(2), X]), numQ(b.p)]), rq]))]));
      }
    });
    annota(prof, 'fratti', { espr: stampa(e) });
    return parti.length ? sempAdd(parti) : Q(0);
  }
  function quadratica(b, x) {
    if (!dipende(b, x)) return null;
    var f = funzione(b, x), a0 = f(0), a1 = f(1), am = f(-1), a2 = f(2);
    var B = (a1 + am) / 2 - a0, lin = (a1 - am) / 2;
    if (Math.abs(a0 + 2 * lin + 4 * B - a2) > 1e-9 * (1 + Math.abs(a2))) return null;
    if (Math.abs(lin) > 1e-12) return null;
    return { a: a0, b: B, lin: 0 };
  }
  /* per parti: polinomio × (exp, sin, cos, sinh, cosh di un argomento lineare)  oppure  xⁿ × (ln, atan, asin) */
  function polinomio(e, x) {
    if (e.t === 's') return e.n === x;
    if (e.t === '^') return e.a[0].t === 's' && e.a[0].n === x && intero(e.a[1]) && e.a[1].n > 0;
    if (e.t === '+') return e.a.every(function (t) { return !dipende(t, x) || polinomio(t, x) || (t.t === '*' && t.a.every(function (f) { return !dipende(f, x) || polinomio(f, x); })); });
    return false;
  }
  function perParti(v, x, prof) {
    if (v.length !== 2) return null;
    /* e^(ax+b)·cos(cx+d) e e^(ax+b)·sin(cx+d): per parti due volte, l'integrale ricompare */
    var ie = v[0].t === 'f' && v[0].n === 'exp' ? 0 : v[1].t === 'f' && v[1].n === 'exp' ? 1 : -1;
    if (ie >= 0) {
      var E_ = v[ie], T_ = v[1 - ie], La = lineare(E_.a[0], x), Lc = T_.t === 'f' && (T_.n === 'sin' || T_.n === 'cos') ? lineare(T_.a[0], x) : null;
      if (La && Lc) {
        var a_ = La.a, c_ = Lc.a, den = sempPow(sempAdd([sempPow(a_, Q(2)), sempPow(c_, Q(2))]), Q(-1)), sn = sempF('sin', T_.a[0]), cs = sempF('cos', T_.a[0]);
        var dentro = T_.n === 'cos' ? sempAdd([sempMul([a_, cs]), sempMul([c_, sn])]) : sempAdd([sempMul([a_, sn]), sempMul([Q(-1), c_, cs])]);
        annota(prof, 'ciclico', { espr: stampa(sempMul(v)) });
        return sempMul([E_, dentro, den]);
      }
    }
    for (var k = 0; k < 2; k++) {
      var P_ = v[k], G = v[1 - k];
      if (polinomio(P_, x) && G.t === 'f' && /^(exp|sin|cos|sinh|cosh)$/.test(G.n) && lineare(G.a[0], x)) {
        var Gi = I(G, x, prof + 1); if (!Gi) continue;
        var resto = I(S(sempMul([deriva(P_, x), Gi])), x, prof + 1);
        if (resto) { annota(prof, 'parti', { u: stampa(P_), dv: stampa(G), v: stampa(Gi), resto: stampa(S(sempMul([deriva(P_, x), Gi]))) }); return sempAdd([sempMul([P_, Gi]), sempMul([Q(-1), resto])]); }
      }
      var potenzaX = P_.t === '^' && P_.a[0].t === 's' && P_.a[0].n === x && P_.a[1].t === 'n' && val(P_.a[1]) !== -1;
      if ((polinomio(P_, x) || (potenzaX && G.n === 'ln')) && G.t === 'f' && /^(ln|atan|asin)$/.test(G.n) && G.a[0].t === 's' && G.a[0].n === x) {
        var Pi = I(P_, x, prof + 1); if (!Pi) continue;
        var r2 = I(S(sempMul([Pi, deriva(G, x)])), x, prof + 1);
        if (r2) { annota(prof, 'parti', { u: stampa(G), dv: stampa(P_), v: stampa(Pi), resto: stampa(S(sempMul([Pi, deriva(G, x)]))) }); return sempAdd([sempMul([Pi, G]), sempMul([Q(-1), r2])]); }
      }
    }
    return null;
  }
  /* sostituzione «derivata che divide»: ∫ f(g(x))·g′(x) dx = ∫ f(u) du */
  function sostituzione(e, x, prof) {
    var cand = [], visti = {};
    (function cerca(n) {
      if (n.t === 'f' || (n.t === '^' && dipende(n.a[0], x))) {
        var u = n.t === 'f' ? n.a[0] : n.a[0];
        if (dipende(u, x) && !(u.t === 's') && !visti[chiave(u)]) { visti[chiave(u)] = 1; cand.push(u); }
        if (n.t === 'f' && !visti[chiave(n)]) { visti[chiave(n)] = 1; cand.push(n); }
      }
      if (n.a) n.a.forEach(cerca);
    })(e);
    for (var i = 0; i < cand.length; i++) {
      var u = cand[i], du = deriva(u, x);
      if (zero(du)) continue;
      var q = S(sempMul([e, sempPow(du, Q(-1))]));
      var t = '__u' + prof;
      var qt = sostituisciChiave(q, chiave(u), S_(t));
      if (dipende(qt, x)) continue;
      var Ft = I(qt, t, prof + 1);
      if (Ft) { annota(prof, 'sostituzione', { u: stampa(u), du: stampa(du), integrando: stampa(sostituisci(qt, t, S_('u'))), Fu: stampa(sostituisci(Ft, t, S_('u'))) }); return sostituisci(Ft, t, u); }
    }
    return null;
  }
  function sostituisciChiave(e, k, con) {
    if (chiave(e) === k) return con;
    if (e.t === 'n' || e.t === 's') return e;
    /* (u)ⁿ dove u e' la sostituzione */
    return S({ t: e.t, n: e.n, a: e.a.map(function (f) { return sostituisciChiave(f, k, con); }) });
  }

  /* ── le serie troncate (Taylor) ────────────────────────────────────────── */
  function serie(e, x, a, N) {
    function costante(v) { var s = new Array(N + 1).fill(0); s[0] = v; return s; }
    function sMul(p, q) { var r = new Array(N + 1).fill(0); for (var i = 0; i <= N; i++) if (p[i]) for (var j = 0; i + j <= N; j++) r[i + j] += p[i] * q[j]; return r; }
    function sDiv(p, q) {
      var m = 0; while (m <= N && Math.abs(q[m]) < 1e-14) m++;
      if (m > N) throw new Error('divisione per zero');
      if (m > 0) {
        for (var k = 0; k < m; k++) if (Math.abs(p[k]) > 1e-10) { var err = new Error('polo'); err.polo = { ordine: m - k, segno: Math.sign(p[k] / q[m]) }; throw err; }
        p = p.slice(m).concat(new Array(m).fill(NaN)); q = q.slice(m).concat(new Array(m).fill(NaN));
      }
      var r = new Array(N + 1).fill(0);
      for (var i = 0; i <= N; i++) { var s = p[i]; for (var j = 1; j <= i; j++) s -= q[j] * r[i - j]; r[i] = s / q[0]; }
      return r;
    }
    function sExp(p) { var r = new Array(N + 1).fill(0); r[0] = Math.exp(p[0]); for (var k = 1; k <= N; k++) { var s = 0; for (var j = 1; j <= k; j++) s += j * p[j] * r[k - j]; r[k] = s / k; } return r; }
    function sLn(p) { if (!(p[0] > 0) && p[0] !== 0) { /* ln di un negativo: reale solo con il valore assoluto */ } var r = new Array(N + 1).fill(0); r[0] = Math.log(p[0]); for (var k = 1; k <= N; k++) { var s = 0; for (var j = 1; j < k; j++) s += j * r[j] * p[k - j]; r[k] = (p[k] - s / k) / p[0]; } return r; }
    function sPow(p, c) {
      if (Math.abs(p[0]) < 1e-14) {
        if (c % 1 === 0 && c > 0) { var r0 = costante(1); for (var i = 0; i < c; i++) r0 = sMul(r0, p); return r0; }
        throw new Error('potenza non analitica in questo punto');
      }
      var r = new Array(N + 1).fill(0); r[0] = potenzaReale(p[0], c);
      for (var k = 1; k <= N; k++) { var s = 0; for (var j = 1; j <= k; j++) s += (j * (c + 1) - k) * p[j] * r[k - j]; r[k] = s / (k * p[0]); }
      return r;
    }
    function sSinCos(p, iper) {
      var s = new Array(N + 1).fill(0), c = new Array(N + 1).fill(0);
      s[0] = iper ? Math.sinh(p[0]) : Math.sin(p[0]); c[0] = iper ? Math.cosh(p[0]) : Math.cos(p[0]);
      for (var k = 1; k <= N; k++) { var a = 0, b = 0; for (var j = 1; j <= k; j++) { a += j * p[j] * c[k - j]; b += j * p[j] * s[k - j]; } s[k] = a / k; c[k] = (iper ? b : -b) / k; }
      return [s, c];
    }
    function sDer(p) { var r = new Array(N + 1).fill(0); for (var k = 0; k < N; k++) r[k] = (k + 1) * p[k + 1]; return r; }
    function sInt(p, c0) { var r = new Array(N + 1).fill(0); r[0] = c0; for (var k = 1; k <= N; k++) r[k] = p[k - 1] / k; return r; }
    function T(e) {
      switch (e.t) {
        case 'n': return costante(val(e));
        case 's': if (e.n === x) { var s = costante(a); if (N >= 1) s[1] = 1; return s; } return costante(COST[e.n] !== undefined ? COST[e.n] : NaN);
        case '+': return e.a.map(T).reduce(function (p, q) { return p.map(function (v, i) { return v + q[i]; }); });
        case '*':
          var num = [], den = [];
          e.a.forEach(function (f) { if (f.t === '^' && f.a[1].t === 'n' && val(f.a[1]) < 0) den.push(sempPow(f.a[0], sempMul([Q(-1), f.a[1]]))); else num.push(f); });
          var pn = num.map(T).reduce(sMul, costante(1));
          if (!den.length) return pn;
          return sDiv(pn, den.map(T).reduce(sMul, costante(1)));
        case '^':
          if (!dipende(e.a[1], x)) { var c = valuta(e.a[1], {}); if (c < 0) return sDiv(costante(1), sPow(T(e.a[0]), -c)); return sPow(T(e.a[0]), c); }
          return sExp(sMul(T(e.a[1]), sLn(T(e.a[0]))));
        case 'f':
          var u = T(e.a[0]);
          switch (e.n) {
            case 'exp': return sExp(u);
            case 'ln': return sLn(u);
            case 'log': return sLn(u).map(function (v) { return v / Math.LN10; });
            case 'sin': return sSinCos(u)[0];
            case 'cos': return sSinCos(u)[1];
            case 'tan': var sc = sSinCos(u); return sDiv(sc[0], sc[1]);
            case 'sinh': return sSinCos(u, true)[0];
            case 'cosh': return sSinCos(u, true)[1];
            case 'tanh': var sh = sSinCos(u, true); return sDiv(sh[0], sh[1]);
            case 'atan': return sInt(sDiv(sDer(u), sMul(u, u).map(function (v, i) { return v + (i === 0 ? 1 : 0); })), Math.atan(u[0]));
            case 'asin': case 'acos':
              var r = sInt(sDiv(sDer(u), sPow(sMul(u, u).map(function (v, i) { return (i === 0 ? 1 : 0) - v; }), 0.5)), Math.asin(u[0]));
              return e.n === 'asin' ? r : r.map(function (v, i) { return i === 0 ? Math.PI / 2 - v : -v; });
            case 'fact': throw new Error('serie non disponibile per il fattoriale');
            case 'abs': if (Math.abs(u[0]) < 1e-14) throw new Error('|u| non derivabile in 0'); var sg = Math.sign(u[0]); return u.map(function (v) { return v * sg; });
          }
      }
      throw new Error('serie non disponibile');
    }
    return T(S(e));
  }
  /* il limite per x → a: prima con le serie (esatto per le forme 0/0 analitiche), poi numerico */
  function limite(e, x, a, lato, kmax) {
    e = S(e);
    var f = funzione(e, x);
    if (isFinite(a)) {
      try {
        var s = serie(e, x, a, 8);
        if (isFinite(s[0]) && s.slice(0, 3).every(isFinite)) return { valore: s[0], metodo: 'serie' };
        if (s[0] === Infinity || s[0] === -Infinity) {
          /* come ln x in 0⁺: la serie dice ±∞, i valori vicini lo confermano dai lati dove f esiste */
          var lati = [1, -1].filter(function (sg) { return isFinite(f(a + sg * 1e-6)); });
          if (lati.length && lati.every(function (sg) { var p = f(a + sg * 1e-6), q = f(a + sg * 1e-10); return Math.sign(q) === Math.sign(s[0]) && Math.abs(q) > Math.abs(p); }))
            return { valore: s[0], metodo: 'serie', lato: lati.length === 1 ? (lati[0] > 0 ? '+' : '-') : null };
        }
      } catch (err) {
        /* un polo vero: |f| grande vicino ad a (il polo di una sottoespressione, come 1/x in (1+x)^(1/x), non conta) */
        if (err.polo && Math.abs(f(a + 1e-7)) > 1e5 && Math.abs(f(a - 1e-7)) > 1e5) {
          var o = err.polo;
          if (o.ordine % 2 === 0 || lato) return { valore: (lato === '-' && o.ordine % 2 ? -1 : 1) * o.segno * Infinity, metodo: 'serie' };
          return { valore: NaN, sinistro: -o.segno * Infinity, destro: o.segno * Infinity, metodo: 'serie' };
        }
      }
      if (!lato) {
        var dx = numerico(f, a, '+', kmax), sx = numerico(f, a, '-', kmax);
        var esiste = function (r) { return r.successione.some(function (p) { return isFinite(p[1]); }); };
        if (!esiste(sx) && esiste(dx)) { dx.lato = '+'; return dx; }
        if (!esiste(dx) && esiste(sx)) { sx.lato = '-'; return sx; }
        if (dx.valore === sx.valore || Math.abs(dx.valore - sx.valore) < 1e-6 * (1 + Math.abs(dx.valore))) return dx;
        return { valore: NaN, sinistro: sx.valore, destro: dx.valore, metodo: 'numerico', successione: dx.successione, successioneSx: sx.successione };
      }
    }
    return numerico(f, a, lato, kmax);
  }
  function numerico(f, a, lato, kmax) {
    var seq = [], K = kmax || (isFinite(a) ? 16 : 15);
    for (var k = 1; k <= K; k++) {
      var h = Math.pow(10, -k) * (isFinite(a) ? Math.max(1, Math.abs(a)) : 1), xv = isFinite(a) ? (lato === '-' ? a - h : a + h) : Math.sign(a) * Math.pow(10, k);
      if (xv === a) break;
      seq.push([xv, f(xv)]);
    }
    var ys = seq.map(function (p) { return p[1]; }).filter(isFinite), n = ys.length;
    var ultimo = seq.length ? seq[seq.length - 1][1] : NaN;
    /* l'esponenziale trabocca: e^(1/x) per x → 0⁺ arriva a Infinity dopo valori crescenti */
    if ((ultimo === Infinity || ultimo === -Infinity) && n >= 1 && Math.sign(ys[n - 1]) === Math.sign(ultimo) && (n < 2 || Math.abs(ys[n - 1]) > Math.abs(ys[n - 2])))
      return { valore: ultimo, metodo: 'numerico', successione: seq };
    if (n < 3) return { valore: NaN, metodo: 'numerico', successione: seq };
    var scala = Math.max(1, Math.abs(ys[0]), Math.abs(ys[1]));
    /* convergente: il primo punto della successione dove gli scarti diventano piccoli
       (piu' avanti l'arrotondamento puo' guastare, come in (1 + 1/x)^x per x = 10¹⁵) */
    for (var j = 2; j < n; j++) {
      var y = ys[j], d1 = Math.abs(y - ys[j - 1]), d2 = Math.abs(ys[j - 1] - ys[j - 2]);
      if (d1 <= 1e-6 * (1 + Math.abs(y)) && d2 <= 1e-3 * (1 + Math.abs(y))) {
        /* se lo scarto cala di 10 a ogni passo l'errore va come 1/x (o come h): Richardson lo toglie */
        if (d1 > 0 && d2 / d1 > 8 && d2 / d1 < 12) y = (10 * y - ys[j - 1]) / 9;
        if (Math.abs(y) < 1e-6 * scala) y = 0;
        return { valore: aggancia(y), metodo: 'numerico', successione: seq };
      }
    }
    var u = ys[n - 1], v1 = ys[n - 2], v2 = ys[n - 3];
    /* divergenza lenta (ln x): incrementi dello stesso segno che non si riducono */
    if (n >= 6) {
      var dd = []; for (var q = n - 5; q < n; q++) dd.push(ys[q] - ys[q - 1]);
      if (dd.every(function (d) { return d > 0; }) && dd.every(function (d, i) { return i === 0 || d >= 0.8 * dd[i - 1]; })) return { valore: Infinity, metodo: 'numerico', successione: seq };
      if (dd.every(function (d) { return d < 0; }) && dd.every(function (d, i) { return i === 0 || d <= 0.8 * dd[i - 1]; })) return { valore: -Infinity, metodo: 'numerico', successione: seq };
    }
    /* divergente: valori enormi, monotoni nel modulo, di segno costante */
    if (Math.abs(u) > 1e6 && Math.abs(u) > Math.abs(v1) && Math.abs(v1) > Math.abs(v2) && Math.sign(u) === Math.sign(v1)) return { valore: Math.sign(u) * Infinity, metodo: 'numerico', successione: seq };
    return { valore: NaN, metodo: 'numerico', successione: seq };
  }
  /* un valore numerico vicinissimo a una frazione semplice e' quella frazione */
  function aggancia(v) {
    if (!isFinite(v)) return v;
    if (Math.abs(v) < 1e-7) return 0;
    for (var d = 1; d <= 64; d++) { var n = Math.round(v * d); if (Math.abs(v - n / d) < 1e-7 * Math.max(1, Math.abs(v))) return n / d; }
    var c = [Math.E, Math.PI, Math.SQRT2, Math.LN2];
    for (var i = 0; i < c.length; i++) if (Math.abs(v - c[i]) < 1e-8) return c[i];
    return v;
  }

  /* ── numeri razionali «belli» da un decimale ─────────────────────────── */
  function rationalizza(v, maxDen) {
    maxDen = maxDen || 1000;
    if (!isFinite(v)) return null;
    var h1 = 1, h0 = 0, k1 = 0, k0 = 1, b = v;
    for (var i = 0; i < 40; i++) {
      var aa = Math.floor(b), h2 = aa * h1 + h0, k2 = aa * k1 + k0;
      if (k2 > maxDen) break;
      h0 = h1; h1 = h2; k0 = k1; k1 = k2;
      if (Math.abs(v - h1 / k1) < 1e-11 * Math.max(1, Math.abs(v))) return [h1, k1];
      if (b - aa < 1e-15) break;
      b = 1 / (b - aa);
    }
    return null;
  }
  function numeroBello(v) {
    var r = rationalizza(v, 5040);
    if (r) return r[1] === 1 ? String(r[0]) : (r[0] < 0 ? '−' : '') + Math.abs(r[0]) + '/' + r[1];
    return fmtNum(v).replace(/^-/, '−');
  }

  /* ── i polinomi: coefficienti, radici complesse (Durand-Kerner) ─────── */
  function coeffPolinomio(e, x) {
    var ex = espandi(e), termini = ex.t === '+' ? ex.a : [ex], c = [];
    for (var i = 0; i < termini.length; i++) {
      var t = termini[i], k = 0, coef = [];
      var fatt = t.t === '*' ? t.a : [t];
      for (var j = 0; j < fatt.length; j++) {
        var f = fatt[j];
        if (!dipende(f, x)) { coef.push(f); continue; }
        if (f.t === 's') { k += 1; continue; }
        if (f.t === '^' && f.a[0].t === 's' && f.a[0].n === x && intero(f.a[1]) && f.a[1].n > 0) { k += f.a[1].n; continue; }
        return null;
      }
      var cv = valuta(sempMul(coef.length ? coef : [Q(1)]), {});
      if (!isFinite(cv)) return null;
      c[k] = (c[k] || 0) + cv;
    }
    for (var m = 0; m < c.length; m++) c[m] = c[m] || 0;
    while (c.length > 1 && Math.abs(c[c.length - 1]) < 1e-14) c.pop();
    return c; /* c[k] e' il coefficiente di x^k */
  }
  function radiciPolinomio(c) {
    var n = c.length - 1;
    if (n < 1) return [];
    var an = c[n], a = c.map(function (v) { return v / an; });
    var R = 1 + Math.max.apply(null, a.slice(0, n).map(Math.abs));
    var z = [];
    for (var i = 0; i < n; i++) { var ang = 2 * Math.PI * i / n + 0.4; z.push([R * 0.9 * Math.cos(ang), R * 0.9 * Math.sin(ang)]); }
    function valP(zr, zi) { var pr = 1, pi = 0; for (var k = n - 1; k >= 0; k--) { var nr = pr * zr - pi * zi + a[k], ni = pr * zi + pi * zr; pr = nr; pi = ni; } return [pr, pi]; }
    for (var it = 0; it < 800; it++) {
      var mosso = 0;
      for (i = 0; i < n; i++) {
        var p = valP(z[i][0], z[i][1]), dr = 1, di = 0;
        for (var j = 0; j < n; j++) if (j !== i) { var ur = z[i][0] - z[j][0], ui = z[i][1] - z[j][1], tr = dr * ur - di * ui; di = dr * ui + di * ur; dr = tr; }
        var den = dr * dr + di * di; if (den === 0) { dr = 1e-12; den = 1e-24; }
        var qr = (p[0] * dr + p[1] * di) / den, qi = (p[1] * dr - p[0] * di) / den;
        z[i][0] -= qr; z[i][1] -= qi; mosso = Math.max(mosso, Math.abs(qr) + Math.abs(qi));
      }
      if (mosso < 1e-15 * R) break;
    }
    /* le radici multiple escono sparpagliate di ~ε^(1/m) (e con parti immaginarie spurie):
       si raggruppano e si sostituiscono con la media del gruppo, che e' precisa */
    var gruppi = [];
    z.forEach(function (w) {
      var g = gruppi.filter(function (q) { return Math.hypot(q.re / q.n - w[0], q.im / q.n - w[1]) < 2e-3 * Math.max(1, Math.hypot(w[0], w[1])); })[0];
      if (g) { g.re += w[0]; g.im += w[1]; g.n++; } else gruppi.push({ re: w[0], im: w[1], n: 1 });
    });
    var out = [];
    gruppi.forEach(function (g) {
      var w = [g.re / g.n, g.im / g.n];
      if (g.n > 1) {
        /* una radice di molteplicita' m e' radice semplice di p^(m−1): Newton li' */
        var d = a.slice(0, n).concat([1]);
        for (var k = 1; k < g.n; k++) d = d.slice(1).map(function (c, i) { return c * (i + 1); });
        var dd = d.slice(1).map(function (c, i) { return c * (i + 1); });
        var ev = function (c, zr, zi) { var pr = 0, pi = 0; for (var j = c.length - 1; j >= 0; j--) { var nr = pr * zr - pi * zi + c[j], ni = pr * zi + pi * zr; pr = nr; pi = ni; } return [pr, pi]; };
        for (var it2 = 0; it2 < 60; it2++) {
          var P = ev(d, w[0], w[1]), Dp = ev(dd, w[0], w[1]), den = Dp[0] * Dp[0] + Dp[1] * Dp[1];
          if (!den) break;
          var sr = (P[0] * Dp[0] + P[1] * Dp[1]) / den, si = (P[1] * Dp[0] - P[0] * Dp[1]) / den;
          w = [w[0] - sr, w[1] - si];
          if (Math.abs(sr) + Math.abs(si) < 1e-16 * (1 + Math.abs(w[0]))) break;
        }
      }
      for (var k2 = 0; k2 < g.n; k2++) out.push(w);
    });
    return out.map(function (w) {
      var re = w[0], im = w[1];
      if (Math.abs(im) < 1e-9 * Math.max(1, Math.abs(re))) im = 0;
      if (Math.abs(re) < 1e-12) re = 0;
      return { re: re, im: im };
    }).sort(function (u, v) { return u.re - v.re || u.im - v.im; });
  }

  /* ── gli zeri di una funzione qualsiasi su un intervallo ─────────────── */
  function zeri(f, a, b, n) {
    n = n || 2000;
    var out = [], h = (b - a) / n, x0 = a, y0 = f(a);
    for (var i = 1; i <= n; i++) {
      var x1 = a + i * h, y1 = f(x1);
      if (isFinite(y0) && isFinite(y1)) {
        if (y0 === 0) out.push(x0);
        else if (y0 * y1 < 0) {
          var lo = x0, hi = x1, flo = y0;
          for (var k = 0; k < 80; k++) { var m = (lo + hi) / 2, fm = f(m); if (!isFinite(fm)) break; if (flo * fm <= 0) hi = m; else { lo = m; flo = fm; } }
          var r = (lo + hi) / 2, fr = f(r);
          /* scarta i salti di segno dei poli (tan x, 1/x): li' |f| non va a zero */
          if (isFinite(fr) && Math.abs(fr) < 1e-6 * (1 + Math.abs(y0) + Math.abs(y1))) out.push(r);
        }
      }
      x0 = x1; y0 = y1;
    }
    if (isFinite(y0) && y0 === 0) out.push(x0);
    return out.filter(function (v, i) { return i === 0 || Math.abs(v - out[i - 1]) > h * 0.5; });
  }

  /* ── integrale definito: Simpson adattivo ─────────────────────────────── */
  function integraleDefinito(f, a, b, tol) {
    tol = tol || 1e-10;
    var cont = { n: 0, ok: true };
    function simp(a, fa, b, fb) { var m = (a + b) / 2, fm = f(m); cont.n++; return { m: m, fm: fm, s: (b - a) / 6 * (fa + 4 * fm + fb) }; }
    function ric(a, fa, b, fb, intero, eps, prof) {
      var L = simp(a, fa, intero.m, intero.fm), R = simp(intero.m, intero.fm, b, fb);
      var d = L.s + R.s - intero.s;
      if (prof > 48 || cont.n > 200000) { cont.ok = false; return L.s + R.s; }
      if (Math.abs(d) <= 15 * eps || !isFinite(d)) return L.s + R.s + d / 15;
      return ric(a, fa, intero.m, intero.fm, L, eps / 2, prof + 1) + ric(intero.m, intero.fm, b, fb, R, eps / 2, prof + 1);
    }
    var fa = f(a), fb = f(b);
    if (!isFinite(fa)) fa = f(a + (b - a) * 1e-9);
    if (!isFinite(fb)) fb = f(b - (b - a) * 1e-9);
    var v = ric(a, fa, b, fb, simp(a, fa, b, fb), tol, 0);
    return { valore: v, valutazioni: cont.n, affidabile: cont.ok && isFinite(v) };
  }

  /* ── uguaglianza numerica di due espressioni (per gli esercizi) ───────── */
  function uguali(e1, e2, vars) {
    vars = vars || simboli(add(e1, e2));
    var f1 = compila(S(e1)), f2 = compila(S(e2)), prove = 0;
    for (var i = 0; i < 16; i++) {
      var amb = {}; vars.forEach(function (v, j) { amb[v] = 0.3 + 0.37 * i + 0.11 * j - (i % 3) * 0.9; });
      var a = f1(amb), b = f2(amb);
      /* dove una delle due non e' definita (ln T contro ln|T| per T < 0) non si confronta */
      if (!isFinite(a) || !isFinite(b)) continue;
      if (Math.abs(a - b) > 1e-8 * (1 + Math.abs(a))) return false;
      prove++;
    }
    return prove >= 4;
  }

  /* ── per i grafici: campioni e una scala verticale che ignora i poli ──── */
  function campiona(f, a, b, n) {
    n = n || 600;
    var xs = [], ys = [];
    for (var i = 0; i <= n; i++) { var x = a + (b - a) * i / n; xs.push(x); ys.push(f(x)); }
    return { x: xs, y: ys };
  }
  function scalaY(serie) {
    var v = [];
    serie.forEach(function (ys) { ys.forEach(function (y) { if (isFinite(y)) v.push(y); }); });
    if (!v.length) return { min: -1, max: 1 };
    v.sort(function (p, q) { return p - q; });
    var lo = v[Math.floor(v.length * 0.03)], hi = v[Math.ceil(v.length * 0.97) - 1], min = v[0], max = v[v.length - 1];
    var span = hi - lo || Math.abs(hi) || 1;
    if (min > lo - span * 0.6) lo = min;
    if (max < hi + span * 0.6) hi = max;
    if (hi - lo < 1e-12) { hi += 1; lo -= 1; }
    var pad = (hi - lo) * 0.08;
    return { min: lo - pad, max: hi + pad };
  }
  /* toglie i tratti verticali dei poli: un salto enorme fra due campioni */
  function spezza(ys, s) {
    var lim = (s.max - s.min) * 4;
    return ys.map(function (y, i) { if (!isFinite(y)) return NaN; if (y > s.max + lim || y < s.min - lim) return NaN; var p = ys[i - 1]; if (i && isFinite(p) && Math.abs(y - p) > (s.max - s.min) * 1.5 && Math.sign(y) !== Math.sign(p)) return NaN; return y; });
  }

  var CAS = {
    campiona: campiona, scalaY: scalaY, spezza: spezza,
    leggi: leggi, semplifica: S, espandi: espandi, deriva: deriva, integra: integra, REGOLE: REGOLE,
    stampa: function (e) { return stampa(e, false); }, html: function (e) { return stampa(e, true); },
    compila: compila, valuta: valuta, funzione: funzione, dipende: dipende, simboli: simboli, sostituisci: sostituisci,
    serie: serie, limite: limite, aggancia: aggancia, rationalizza: rationalizza, numeroBello: numeroBello, fmtNum: fmtNum,
    coeffPolinomio: coeffPolinomio, radiciPolinomio: radiciPolinomio, zeri: zeri, integraleDefinito: integraleDefinito,
    uguali: uguali, Q: Q, num: function (v) { return F(v); }, simbolo: S_, costruisci: { add: add, mul: mul, pow: pow, fn: fn, neg: neg, sub: sub, div: div }
  };
  globale.BSIMatCAS = CAS;
  if (globale.BSIFisica && globale.BSIFisica.calcolo) globale.BSIFisica.calcolo.cas = CAS;
})(typeof window !== 'undefined' ? window : globalThis);
