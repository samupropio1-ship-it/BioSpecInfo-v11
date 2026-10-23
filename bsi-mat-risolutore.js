/* ═══════════════════════════════════════════════════════════════════════════
   bsi-mat-risolutore.js — il risolutore d'esame: lo SVOLGIMENTO, passo per passo
   BioSpecInfo · © Samuele Pio Provenzano

   Per ogni tipo di esercizio dei programmi di Istituzioni di Matematiche I
   e II (corso di laurea in Chimica) produce uno svolgimento come quello
   che si scrive all'esame: che cosa si fa, perche', con quale teorema, i
   conti intermedi e il risultato. I conti li fa il motore simbolico
   (bsi-mat-cas.js); qui c'e' la STRATEGIA e la spiegazione.

   Ogni risolutore restituisce { passi: [{ titolo, html }], risultato }.
   Dove un passaggio e' numerico (zeri di una funzione trascendente, una
   serie al caso critico) lo dice: lo svolgimento non finge un'esattezza
   che non ha.

   Tipi:  complessi · dominio · limite · studio di funzione · integrale
   indefinito (con i fratti semplici) · integrale definito e improprio ·
   Taylor · serie numeriche · serie di potenze · funzioni di due variabili ·
   massimi e minimi su un compatto · integrali doppi · forme differenziali
   e integrali curvilinei · equazioni differenziali (lineari del primo
   ordine, a variabili separabili, del secondo ordine a coefficienti
   costanti con il metodo di somiglianza, problemi di Cauchy).
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica, C = globale.BSIMatCAS;
  if (!F || !C) return;
  var t = F.t;
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function H(e) { return C.html(typeof e === 'string' ? C.leggi(e) : e); }
  function S(e) { return C.stampa(e); }
  var B = C.costruisci;

  /* ── numeri «belli»: frazioni, radici, multipli di π ──────────────────── */
  function quadratoLibero(N) { var a = 1, b = N; for (var k = Math.floor(Math.sqrt(N)); k > 1; k--) if (b % (k * k) === 0) { a *= k; b /= k * k; } return [a, b]; }
  function bello(v) {
    if (!isFinite(v)) return v > 0 ? '+∞' : v < 0 ? '−∞' : '∄';
    var s = v < 0 ? '−' : '', a = Math.abs(v);
    if (a < 1e-12) return '0';
    for (var d = 1; d <= 120; d++) { var n = Math.round(a * d); if (Math.abs(a - n / d) < 1e-9 * Math.max(1, a)) return s + (d === 1 ? n : n + '/' + d); }
    for (d = 1; d <= 12; d++) {
      var N = Math.round(a * a * d * d);
      if (N > 0 && N < 1e6 && Math.abs(a * d - Math.sqrt(N)) < 1e-9 * Math.max(1, a * d)) {
        var qr = quadratoLibero(N), num = (qr[0] === 1 ? '' : qr[0]) + '√' + qr[1];
        if (qr[1] === 1) continue;
        return s + (d === 1 ? num : (qr[0] === 1 ? '√' + qr[1] : num) + '/' + d);
      }
    }
    for (d = 1; d <= 12; d++) { var m = Math.round(a / Math.PI * d); if (m && Math.abs(a - m * Math.PI / d) < 1e-9) return s + (m === 1 ? '' : m) + 'π' + (d === 1 ? '' : '/' + d); }
    for (d = 1; d <= 12; d++) { var m2 = Math.round(a / (Math.PI * Math.PI) * d); if (m2 && Math.abs(a - m2 * Math.PI * Math.PI / d) < 1e-9) return s + (m2 === 1 ? '' : m2) + 'π²' + (d === 1 ? '' : '/' + d); }
    for (d = 1; d <= 64; d++) { var m3 = Math.round(a * Math.PI * d); if (m3 && Math.abs(a - m3 / (Math.PI * d)) < 1e-9) return s + m3 + '/' + (d === 1 ? 'π' : '(' + d + 'π)'); }
    var RAD = [2, 3, 5, 6, 7];
    for (var ri = 0; ri < RAD.length; ri++) for (d = 1; d <= 6; d++) for (var qq = -6; qq <= 6; qq++) { if (!qq) continue; var p0 = a * d - qq * Math.sqrt(RAD[ri]), pr = Math.round(p0); if (Math.abs(p0 - pr) < 1e-9 && pr !== 0) { var rad = (Math.abs(qq) === 1 ? '' : Math.abs(qq)) + '√' + RAD[ri], txt = pr + (qq < 0 ? ' − ' : ' + ') + rad; return s + (d === 1 ? txt : '(' + txt + ')/' + d); } }
    var la = Math.log(a); for (d = 1; d <= 6; d++) { var k = Math.round(la * d); if (k && Math.abs(la - k / d) < 5e-8) return s + (k === d ? 'e' : d === 1 && k > 0 && k < 10 ? 'e' + '⁰¹²³⁴⁵⁶⁷⁸⁹'[k] : 'e^(' + (d === 1 ? k : k + '/' + d) + ')'); }
    return s + String(+a.toPrecision(7));
  }
  function belloNum(v) { /* come bello ma restituisce un numero «agganciato» */
    for (var d = 1; d <= 120; d++) { var n = Math.round(v * d); if (Math.abs(v - n / d) < 1e-8 * Math.max(1, Math.abs(v))) return n / d; }
    return v;
  }
  /* un numero come nodo esatto (frazione) per il motore simbolico */
  function nodo(v) { var q = belloNum(v); for (var d = 1; d <= 2000; d++) { var n = Math.round(q * d); if (Math.abs(q - n / d) < 1e-9 * Math.max(1, Math.abs(q))) return C.Q(n, d); } return C.num(v); }
  function intervallo(a, b, ca, cb) { return (ca ? '[' : '(') + bello(a) + ', ' + bello(b) + (cb ? ']' : ')'); }
  function nuovo() { var p = []; return { passi: p, passo: function (titolo, html) { p.push({ titolo: titolo, html: html }); } }; }
  function variabile(e, pref) { var vs = C.simboli(e); return vs.indexOf(pref || 'x') >= 0 ? (pref || 'x') : (vs[0] || pref || 'x'); }
  function val(e, amb) { return C.valuta(e, amb); }

  /* ════════════════════════════════════════════════════════════════════
     1. NUMERI COMPLESSI
     ════════════════════════════════════════════════════════════════════ */
  function cx() { return F.calcolo.complessi; }
  function argBello(th) { return bello(th); }
  function complessi(dati) {
    var R = nuovo(), K = cx();
    if (dati.tipo === 'forma') {
      var z = K.leggiZ(dati.z), r = Math.hypot(z[0], z[1]), th = Math.atan2(z[1], z[0]);
      R.passo(t('Forma algebrica', 'Algebraic form'), 'z = ' + esc(K.strZ(z)) + ' ⇒ Re z = ' + bello(z[0]) + ', Im z = ' + bello(z[1]));
      R.passo(t('Modulo', 'Modulus'), '|z| = √(a² + b²) = √(' + bello(z[0] * z[0]) + ' + ' + bello(z[1] * z[1]) + ') = <b>' + bello(r) + '</b>');
      R.passo(t('Argomento', 'Argument'), t('θ è l’angolo con cos θ = a/|z|, sin θ = b/|z| (attenzione al quadrante: arctg(b/a) vale solo se a > 0). ', 'θ is the angle with cos θ = a/|z|, sin θ = b/|z| (mind the quadrant: arctan(b/a) only works if a > 0). ') + 'θ = <b>' + argBello(th) + '</b>');
      R.passo(t('Forme trigonometrica ed esponenziale', 'Trigonometric and exponential forms'), 'z = ' + bello(r) + '·(cos(' + argBello(th) + ') + i·sin(' + argBello(th) + ')) = ' + bello(r) + '·e<sup>i' + argBello(th) + '</sup>');
      if (dati.n) {
        var rn = Math.pow(r, dati.n), thn = th * dati.n, zn = [rn * Math.cos(thn), rn * Math.sin(thn)];
        R.passo(t('Potenza (formula di De Moivre)', 'Power (De Moivre’s formula)'), 'zⁿ = |z|ⁿ·(cos nθ + i sin nθ) = ' + bello(rn) + '·(cos(' + argBello(thn) + ') + i sin(' + argBello(thn) + ')) = <b>' + esc(K.strZ(zn)) + '</b>');
        return { passi: R.passi, risultato: K.strZ(zn), valore: zn };
      }
      return { passi: R.passi, risultato: bello(r) + '·e^(i' + argBello(th) + ')', modulo: r, argomento: th };
    }
    if (dati.tipo === 'radici') {
      var w = K.leggiZ(dati.w), n = dati.n, rw = Math.hypot(w[0], w[1]), tw = Math.atan2(w[1], w[0]), rad = [];
      R.passo(t('Il numero in forma esponenziale', 'The number in exponential form'), 'w = ' + esc(K.strZ(w)) + ' = ' + bello(rw) + '·e<sup>i' + argBello(tw) + '</sup>');
      R.passo(t('Formula delle radici n-esime', 'n-th root formula'), 'z<sub>k</sub> = |w|<sup>1/n</sup>·e<sup>i(θ + 2kπ)/n</sup>, k = 0, …, n − 1: ' + t('sono n punti sul cerchio di raggio ', 'they are n points on the circle of radius ') + bello(Math.pow(rw, 1 / n)) + t(', ai vertici di un poligono regolare', ', at the vertices of a regular polygon'));
      var h = '<table class="bsiFX-tab"><tr><th>k</th><th>' + t('argomento', 'argument') + '</th><th>z<sub>k</sub></th></tr>';
      for (var k = 0; k < n; k++) { var a = (tw + 2 * k * Math.PI) / n, zk = [Math.pow(rw, 1 / n) * Math.cos(a), Math.pow(rw, 1 / n) * Math.sin(a)]; rad.push(zk); h += '<tr><td>' + k + '</td><td>' + argBello(a) + '</td><td class="bsiFX-num">' + esc(strZBello(zk)) + '</td></tr>'; }
      R.passo(t('Le radici', 'The roots'), h + '</table>');
      return { passi: R.passi, risultato: rad.map(strZBello).join('; '), radici: rad };
    }
    /* equazione di secondo grado a coefficienti reali */
    var A = dati.a, Bc = dati.b, Cc = dati.c, D = Bc * Bc - 4 * A * Cc;
    R.passo(t('Discriminante', 'Discriminant'), 'Δ = b² − 4ac = ' + bello(D));
    var sol;
    if (D >= 0) sol = [[(-Bc - Math.sqrt(D)) / (2 * A), 0], [(-Bc + Math.sqrt(D)) / (2 * A), 0]];
    else { sol = [[-Bc / (2 * A), -Math.sqrt(-D) / (2 * A)], [-Bc / (2 * A), Math.sqrt(-D) / (2 * A)]]; R.passo(t('Δ < 0: radici complesse coniugate', 'Δ < 0: complex conjugate roots'), '√Δ = i√' + bello(-D) + ' = ' + bello(Math.sqrt(-D)) + 'i'); }
    R.passo(t('Soluzioni', 'Solutions'), 'z = (−b ± √Δ)/(2a) ⇒ <b>' + sol.map(strZBello).join(' , ') + '</b>');
    return { passi: R.passi, risultato: sol.map(strZBello).join('; '), radici: sol };
  }
  function strZBello(z) {
    var re = Math.abs(z[0]) < 1e-12 ? 0 : z[0], im = Math.abs(z[1]) < 1e-12 ? 0 : z[1];
    if (!im) return bello(re);
    var bi = bello(Math.abs(im)), parteI = (bi === '1' ? '' : bi) + 'i';
    if (!re) return (im < 0 ? '−' : '') + parteI;
    return bello(re) + (im < 0 ? ' − ' : ' + ') + parteI;
  }

  /* ════════════════════════════════════════════════════════════════════
     2. DOMINIO
     ════════════════════════════════════════════════════════════════════ */
  function condizioni(e, x) {
    var out = [], visti = {};
    function add(espr, tipo, motivo) { var k = S(espr) + tipo; if (visti[k]) return; visti[k] = 1; out.push({ espr: espr, tipo: tipo, motivo: motivo }); }
    (function cerca(n) {
      if (n.t === '^' && C.dipende(n.a[0], x)) {
        var p = n.a[1];
        if (p.t === 'n') {
          var v = C.valuta(p), r = C.rationalizza(Math.abs(v), 64), pari = r && r[1] % 2 === 0;
          if (pari) add(n.a[0], v < 0 ? '>0' : '≥0', v < 0 ? t('radice di indice pari al denominatore', 'even-index root in a denominator') : t('radice di indice pari', 'even-index root'));
          else if (v < 0) add(n.a[0], '≠0', t('denominatore', 'denominator'));
          else if (!r) add(n.a[0], '>0', t('potenza a esponente irrazionale', 'power with an irrational exponent'));
        } else if (C.dipende(p, x)) add(n.a[0], '>0', t('base di una potenza a esponente variabile', 'base of a power with a variable exponent'));
      }
      if (n.t === 'f') {
        if (n.n === 'ln' || n.n === 'log') add(n.a[0], '>0', t('argomento del logaritmo', 'logarithm argument'));
        if (n.n === 'asin' || n.n === 'acos') add(n.a[0], '[-1,1]', t('argomento di arcoseno/arcocoseno', 'arcsine/arccosine argument'));
        if (n.n === 'tan') add(B.fn('cos', n.a[0]), '≠0', t('la tangente non esiste dove il coseno è nullo', 'tangent does not exist where cosine vanishes'));
      }
      if (n.a) n.a.forEach(cerca);
    })(e);
    return out;
  }
  var SIMB = { '≠0': '≠ 0', '≥0': '≥ 0', '>0': '> 0', '[-1,1]': '∈ [−1, 1]' };
  function dominio(testo, xv) {
    var e = C.leggi(testo), x = xv || variabile(e), f = C.funzione(e, x), R = nuovo(), cond = condizioni(e, x);
    R.passo(t('Condizioni di esistenza', 'Existence conditions'), cond.length ? '<ul style="margin:4px 0 0 18px;padding:0">' + cond.map(function (c) { return '<li>' + H(c.espr) + ' ' + SIMB[c.tipo] + ' <span style="color:#9fb1c6">(' + c.motivo + ')</span></li>'; }).join('') + '</ul>' : t('Nessuna: polinomi, esponenziali, seno, coseno, arcotangente e radici dispari sono definiti su tutto ℝ.', 'None: polynomials, exponentials, sine, cosine, arctangent and odd roots are defined on all of ℝ.'));
    var periodica = cond.some(function (c) { return c.espr.t === 'f' && c.espr.n === 'cos'; });
    /* la scansione: griglia fitta vicino all'origine, larga lontano */
    var U = 8, L = 1e4, N = 24000, xs = [];
    for (var i = 0; i <= N; i++) { var u = -U + 2 * U * i / N; xs.push(L * Math.sinh(u) / Math.sinh(U)); }
    /* «definita» = non NaN: un ±∞ da trabocco (x·e^(−x) per x → −∞) non toglie punti al dominio */
    var def = function (v) { return !isNaN(f(v)); };
    var ok = xs.map(def);
    var tratti = [], ini = null;
    function bordo(a, b) { /* a dentro, b fuori (o viceversa): bisezione */ var fa = def(a); for (var k = 0; k < 80; k++) { var m = (a + b) / 2; if (def(m) === fa) a = m; else b = m; } return belloNum((a + b) / 2); }
    for (i = 0; i <= N; i++) {
      if (ok[i] && ini === null) ini = i === 0 ? -Infinity : bordo(xs[i], xs[i - 1]);
      if (!ok[i] && ini !== null) { tratti.push([ini, bordo(xs[i - 1], xs[i])]); ini = null; }
    }
    if (ini !== null) tratti.push([ini, Infinity]);
    /* punti isolati esclusi: gli zeri delle quantita' «≠ 0» */
    var esclusi = [];
    cond.filter(function (c) { return c.tipo === '≠0' && !(c.espr.t === 'f' && c.espr.n === 'cos'); }).forEach(function (c) {
      var g = C.funzione(c.espr, x), cp = C.coeffPolinomio(c.espr, x), z = [];
      if (cp && cp.length > 1) z = C.radiciPolinomio(cp).filter(function (r) { return !r.im; }).map(function (r) { return r.re; });
      else z = C.zeri(g, -50, 50, 20000);
      z.forEach(function (v) { v = belloNum(v); if (!esclusi.some(function (w) { return Math.abs(w - v) < 1e-9; })) esclusi.push(v); });
    });
    esclusi.sort(function (a, b) { return a - b; });
    /* spezza i tratti nei punti esclusi */
    var pezzi = [];
    tratti.forEach(function (tr) {
      var cur = tr[0];
      esclusi.forEach(function (p) { if (p > cur && p < tr[1]) { pezzi.push([cur, p, true]); cur = p; } });
      pezzi.push([cur, tr[1], false]);
    });
    var chiuso = function (v) { return isFinite(v) && isFinite(f(v)) && !esclusi.some(function (p) { return Math.abs(p - v) < 1e-12; }); };
    var str = pezzi.filter(function (p) { return p[1] - p[0] > 1e-12 || !isFinite(p[1] - p[0]); }).map(function (p) { return intervallo(p[0], p[1], chiuso(p[0]), chiuso(p[1])); });
    var dom = str.length === 1 && str[0] === '(−∞, +∞)' ? 'ℝ' : str.join(' ∪ ') || '∅';
    if (periodica) dom += ' ' + t('(e, per la tangente, x ≠ π/2 + kπ: l’elenco qui sopra vale nell’intervallo esaminato)', '(and, for the tangent, x ≠ π/2 + kπ: the list above holds in the examined range)');
    R.passo(t('Risoluzione delle condizioni', 'Solving the conditions'), t('Si risolvono le disequazioni e si fa l’intersezione (tutte devono valere insieme). ', 'Solve the inequalities and intersect them (all must hold together). ') + (esclusi.length ? t('Punti esclusi: ', 'Excluded points: ') + esclusi.map(bello).join(', ') + '. ' : '') + '<br>D = <b>' + esc(dom) + '</b>');
    return { passi: R.passi, risultato: dom, intervalli: pezzi, esclusi: esclusi, condizioni: cond };
  }

  /* ════════════════════════════════════════════════════════════════════
     3. LIMITI, CON LA FORMA INDETERMINATA E IL METODO
     ════════════════════════════════════════════════════════════════════ */
  function frazione(e) {
    if (e.t !== '*' && !(e.t === '^' && e.a[1].t === 'n' && C.valuta(e.a[1]) < 0)) return null;
    var fatt = e.t === '*' ? e.a : [e], num = [], den = [];
    fatt.forEach(function (f) { if (f.t === '^' && f.a[1].t === 'n' && C.valuta(f.a[1]) < 0) den.push(C.semplifica(B.pow(f.a[0], C.num(-C.valuta(f.a[1]))))); else num.push(f); });
    if (!den.length) return null;
    return { N: C.semplifica(num.length ? B.mul.apply(null, num) : C.Q(1)), D: C.semplifica(B.mul.apply(null, den)) };
  }
  function termineGuida(s, x0, x) {
    for (var k = 0; k < s.length; k++) if (Math.abs(s[k]) > 1e-10) return { k: k, a: s[k], testo: monomio(s[k], k, x0, x) };
    return null;
  }
  function monomio(a, k, x0, x) {
    var base = x0 === 0 ? x : '(' + x + (x0 > 0 ? ' − ' + bello(x0) : ' + ' + bello(-x0)) + ')';
    if (a < 0 && k > 0) return '−' + monomio(-a, k, x0, x);
    var c = bello(a); if (k === 0) return c;
    var pot = k === 1 ? base : base + String(k).split('').map(function (d) { return '⁰¹²³⁴⁵⁶⁷⁸⁹'[+d]; }).join('');
    return (c === '1' ? '' : c === '−1' ? '−' : (c.indexOf('/') > 0 ? '(' + c + ')' : c) + '·') + pot;
  }
  function limite(testo, x0testo, opz) {
    var e = C.leggi(testo), x = variabile(e), R = nuovo();
    var x0 = /^\s*[+]?(∞|inf|\+inf|infinito)\s*$/i.test(x0testo) ? Infinity : /^\s*-\s*(∞|inf|infinito)\s*$/i.test(x0testo) ? -Infinity : C.valuta(C.leggi(String(x0testo)));
    var lato = opz && opz.lato, f = C.funzione(e, x), r = C.limite(e, x, x0, lato), fr = frazione(e);
    var fx0 = isFinite(x0) ? f(x0) : NaN, dove = isFinite(x0) ? bello(x0) : (x0 > 0 ? '+∞' : '−∞');
    if (isFinite(x0) && isFinite(fx0) && Math.abs(f(x0 + 1e-7) - fx0) < 1e-4 * (1 + Math.abs(fx0)) && Math.abs(f(x0 - 1e-7) - fx0) < 1e-4 * (1 + Math.abs(fx0))) {
      R.passo(t('Sostituzione diretta', 'Direct substitution'), t('La funzione è continua in ', 'The function is continuous at ') + dove + t(': il limite è il valore della funzione. ', ': the limit is the function value. ') + 'f(' + dove + ') = <b>' + bello(fx0) + '</b>');
      return { passi: R.passi, risultato: bello(fx0), valore: fx0 };
    }
    if (isFinite(x0) && fr) {
      var N0 = C.funzione(fr.N, x)(x0), D0 = C.funzione(fr.D, x)(x0);
      R.passo(t('Forma del limite', 'Form of the limit'), t('Numeratore N(x) = ', 'Numerator N(x) = ') + H(fr.N) + ' → ' + bello(N0) + '; ' + t('denominatore D(x) = ', 'denominator D(x) = ') + H(fr.D) + ' → ' + bello(D0) + (Math.abs(N0) < 1e-12 && Math.abs(D0) < 1e-12 ? ' ⇒ <b>' + t('forma indeterminata 0/0', 'indeterminate form 0/0') + '</b>' : ''));
      try {
        var sN = C.serie(fr.N, x, x0, 10), sD = C.serie(fr.D, x, x0, 10), gN = termineGuida(sN, x0, x), gD = termineGuida(sD, x0, x);
        if (gN && gD && (gN.k > 0 || gD.k > 0)) {
          R.passo(t('Sviluppi di Taylor (resto di Peano)', 'Taylor expansions (Peano remainder)'), 'N(x) = ' + esc(gN.testo) + ' + o(' + esc(monomio(1, gN.k || 1, x0, x)) + ')<br>D(x) = ' + esc(gD.testo) + ' + o(' + esc(monomio(1, gD.k || 1, x0, x)) + ')<br>' +
            t('Si confrontano gli ordini di infinitesimo: ', 'Compare the orders of the infinitesimals: ') + 'N ' + t('di ordine ', 'of order ') + gN.k + ', D ' + t('di ordine ', 'of order ') + gD.k + '.');
          var concl = gN.k > gD.k ? t('N è di ordine superiore: il limite è 0.', 'N has higher order: the limit is 0.') : gN.k === gD.k ? t('Stesso ordine: il limite è il rapporto dei coefficienti ', 'Same order: the limit is the ratio of the coefficients ') + (Math.abs(gD.a - 1) < 1e-12 ? bello(gN.a) : bello(gN.a) + ' : ' + bello(gD.a) + ' = ' + bello(belloNum(gN.a / gD.a))) + '.' : t('D è di ordine superiore: il limite è infinito, con il segno che dipende dal lato.', 'D has higher order: the limit is infinite, with a sign depending on the side.');
          R.passo(t('Conclusione', 'Conclusion'), concl);
        } else if (gN && gD && Math.abs(D0) < 1e-12) {
          R.passo(t('Forma c/0', 'Form c/0'), t('Il numeratore tende a ', 'The numerator tends to ') + bello(N0) + t(' ≠ 0 e il denominatore a 0: il limite è infinito; il segno si legge dal segno del denominatore a destra e a sinistra.', ' ≠ 0 and the denominator to 0: the limit is infinite; its sign comes from the sign of the denominator on each side.'));
        }
      } catch (err) {
        R.passo(t('Metodo', 'Method'), t('Gli sviluppi in serie non esistono in questo punto (radici, logaritmi in 0): si procede con i limiti notevoli e il confronto, qui calcolato numericamente.', 'Series expansions do not exist at this point (roots, logarithms at 0): proceed with standard limits and comparison, computed numerically here.'));
      }
    } else if (!isFinite(x0) && fr) {
      var cN = C.coeffPolinomio(fr.N, x), cD = C.coeffPolinomio(fr.D, x);
      if (cN && cD) {
        var gn = cN.length - 1, gd = cD.length - 1;
        R.passo(t('Rapporto di polinomi a ∞', 'Ratio of polynomials at ∞'), t('Si raccoglie la potenza più alta: conta solo il rapporto dei termini di grado massimo. ', 'Factor out the highest power: only the ratio of the leading terms matters. ') + t('Grado di N = ', 'Degree of N = ') + gn + ', ' + t('grado di D = ', 'degree of D = ') + gd + '. ' +
          (gn < gd ? t('Grado del numeratore minore: limite 0.', 'Lower numerator degree: limit 0.') : gn === gd ? t('Gradi uguali: limite = rapporto dei coefficienti direttori = ', 'Equal degrees: limit = ratio of leading coefficients = ') + bello(cN[gn]) + '/' + bello(cD[gd]) + '.' : t('Grado del numeratore maggiore: limite infinito (segno dai coefficienti direttori e dal verso).', 'Higher numerator degree: infinite limit (sign from the leading coefficients and the direction).')));
      } else R.passo(t('Gerarchia degli infiniti', 'Hierarchy of infinities'), t('A ±∞: logaritmi ≪ potenze ≪ esponenziali ≪ fattoriali. Il termine che domina numeratore e denominatore decide il limite.', 'At ±∞: logarithms ≪ powers ≪ exponentials ≪ factorials. The dominant term of numerator and denominator decides the limit.'));
    } else if (e.t === '^' && C.dipende(e.a[1], x)) {
      var g = C.semplifica(B.mul(e.a[1], B.fn('ln', e.a[0]))), rg = C.limite(g, x, x0, lato); var esponente = rg.valore;
      R.passo(t('Forma esponenziale', 'Exponential form'), t('Si scrive f = e^(g·ln b): ', 'Write f = e^(g·ln b): ') + H(e) + ' = e<sup>' + H(g) + '</sup>. ' + t('Basta il limite dell’esponente: ', 'The exponent limit is enough: ') + bello(rg.valore) + ' ⇒ ' + t('limite = e^(', 'limit = e^(') + bello(rg.valore) + ')');
    }
    var ris;
    if (typeof esponente === 'number' && isFinite(esponente) && Math.abs(Math.exp(esponente) - r.valore) < 1e-5 * (1 + Math.abs(r.valore))) { r.valore = Math.exp(esponente); }
    if (isNaN(r.valore) && r.sinistro !== undefined) { ris = t('non esiste (sinistro ', 'does not exist (left ') + bello(r.sinistro) + t(', destro ', ', right ') + bello(r.destro) + ')'; }
    else ris = isNaN(r.valore) ? t('non esiste', 'does not exist') : bello(r.valore);
    R.passo(t('Risultato', 'Result'), 'lim<sub>' + x + '→' + dove + (lato === '+' || r.lato === '+' ? '⁺' : lato === '-' || r.lato === '-' ? '⁻' : '') + '</sub> ' + H(e) + ' = <b>' + esc(ris) + '</b>' + (r.metodo === 'numerico' ? ' <span style="color:#9fb1c6">(' + t('valore confermato numericamente', 'value confirmed numerically') + ')</span>' : ''));
    return { passi: R.passi, risultato: ris, valore: r.valore, sinistro: r.sinistro, destro: r.destro };
  }

  /* ════════════════════════════════════════════════════════════════════
     4. STUDIO DI FUNZIONE COMPLETO
     ════════════════════════════════════════════════════════════════════ */
  function segnoIntervalli(g, punti, a, b) {
    var p = [a].concat(punti.filter(function (v) { return v > a && v < b; }), [b]), out = [];
    for (var i = 0; i < p.length - 1; i++) {
      var lo = p[i], hi = p[i + 1], m = !isFinite(lo) ? hi - 1 - Math.abs(hi) : !isFinite(hi) ? lo + 1 + Math.abs(lo) : (lo + hi) / 2, v = g(m);
      if (!isFinite(v)) { var m2 = lo + (hi - lo) * 0.3; v = g(m2); }
      out.push({ a: lo, b: hi, segno: v > 0 ? '+' : v < 0 ? '−' : '0' });
    }
    return out;
  }
  function tabellaSegni(righe) {
    return '<table class="bsiFX-tab" style="width:auto">' + righe.map(function (r) { return '<tr><td>' + intervallo(r.a, r.b, false, false) + '</td><td style="text-align:center;font-weight:800;color:' + (r.segno === '+' ? '#5eead4' : '#ff8a80') + '">' + r.segno + '</td>' + (r.extra ? '<td>' + r.extra + '</td>' : '') + '</tr>'; }).join('') + '</table>';
  }
  /* per una funzione razionale N/D le derivate si scrivono come Aₖ/Dᵏ⁺¹, con i numeratori espansi:
     f′ = (N′D − ND′)/D², f″ = (A₁′D − 2A₁D′)/D³ (si semplifica un fattore D) */
  function derivateRazionali(e, x) {
    var fr = frazione(e); if (!fr) return null;
    var N = fr.N, D = C.espandi(fr.D);
    if (!C.coeffPolinomio(N, x) || !C.coeffPolinomio(D, x)) return null;
    var dD = C.deriva(D, x);
    var A1 = C.espandi(C.semplifica(B.sub(B.mul(C.deriva(N, x), D), B.mul(N, dD))));
    var A2 = C.espandi(C.semplifica(B.sub(B.mul(C.deriva(A1, x), D), B.mul(C.Q(2), A1, dD))));
    var Ds = S(D), den = function (k) { return (/\s/.test(Ds) ? '(' + Ds + ')' : Ds) + '⁰¹²³⁴⁵⁶⁷⁸⁹'[k]; };
    return { d1: '(' + S(A1) + ')/' + den(2), d2: '(' + S(A2) + ')/' + den(3), A1: A1, A2: A2 };
  }
  function studio(testo) {
    var e = C.leggi(testo), x = variabile(e), f = C.funzione(e, x), R = nuovo();
    var D = dominio(testo, x);
    R.passo(t('1. Dominio', '1. Domain'), D.passi.map(function (p) { return p.html; }).join('<br>'));
    var vals = [0.7, 1.3, 2.1].map(function (v) { return [f(v), f(-v)]; }).filter(function (p) { return isFinite(p[0]) && isFinite(p[1]); });
    var pari = vals.length && vals.every(function (p) { return Math.abs(p[0] - p[1]) < 1e-9 * (1 + Math.abs(p[0])); }), disp = vals.length && vals.every(function (p) { return Math.abs(p[0] + p[1]) < 1e-9 * (1 + Math.abs(p[0])); });
    R.passo(t('2. Simmetrie', '2. Symmetry'), pari ? t('f(−x) = f(x): <b>pari</b>, grafico simmetrico rispetto all’asse y.', 'f(−x) = f(x): <b>even</b>, graph symmetric about the y axis.') : disp ? t('f(−x) = −f(x): <b>dispari</b>, simmetrico rispetto all’origine.', 'f(−x) = −f(x): <b>odd</b>, symmetric about the origin.') : t('Né pari né dispari.', 'Neither even nor odd.'));
    var estr = D.intervalli.reduce(function (a, p) { return a.concat([p[0], p[1]]); }, []).filter(isFinite);
    var lo = estr.length ? Math.min.apply(null, estr) - 10 : -10, hi = estr.length ? Math.max.apply(null, estr) + 10 : 10;
    var zeri = C.zeri(f, lo, hi, 20000).map(belloNum), f0 = f(0);
    R.passo(t('3. Intersezioni con gli assi', '3. Intercepts'), (isFinite(f0) ? t('Asse y: f(0) = ', 'y axis: f(0) = ') + bello(f0) + '. ' : t('x = 0 non è nel dominio. ', 'x = 0 is not in the domain. ')) + t('Asse x (f(x) = 0): ', 'x axis (f(x) = 0): ') + (zeri.length ? 'x = ' + zeri.map(bello).join(', ') : t('nessuna', 'none')));
    var rotture = D.intervalli.reduce(function (a, p) { return a.concat([p[0], p[1]]); }, []).filter(isFinite);
    var punti = zeri.concat(rotture).sort(function (a, b) { return a - b; });
    var sg = segnoIntervalli(f, punti, -Infinity, Infinity).filter(function (s) { return isFinite(f(isFinite(s.a) && isFinite(s.b) ? (s.a + s.b) / 2 : isFinite(s.a) ? s.a + 1 : s.b - 1)); });
    R.passo(t('4. Segno', '4. Sign'), tabellaSegni(sg));
    /* limiti agli estremi e asintoti */
    var lim = [], asint = [];
    D.intervalli.forEach(function (p) {
      [[p[0], '+'], [p[1], '-']].forEach(function (q) {
        var v = q[0];
        if (!isFinite(v)) { var L = C.limite(e, x, v); lim.push('lim<sub>x→' + (v > 0 ? '+∞' : '−∞') + '</sub> f = ' + bello(L.valore)); if (isFinite(L.valore)) asint.push(t('orizzontale y = ', 'horizontal y = ') + bello(L.valore) + (v > 0 ? t(' a +∞', ' at +∞') : t(' a −∞', ' at −∞'))); else if (Math.abs(L.valore) === Infinity) { var m = C.aggancia(C.limite(C.semplifica(B.div(e, C.simbolo(x))), x, v).valore); if (isFinite(m) && m !== 0) { var qq = C.aggancia(C.limite(C.semplifica(B.sub(e, B.mul(C.num(m), C.simbolo(x)))), x, v, null, 9).valore); if (isFinite(qq)) asint.push(t('obliquo y = ', 'oblique y = ') + (m === 1 ? '' : bello(m)) + 'x' + (qq ? (qq > 0 ? ' + ' : ' − ') + bello(Math.abs(qq)) : '') + (v > 0 ? t(' a +∞', ' at +∞') : t(' a −∞', ' at −∞'))); } } return; }
        if (isFinite(f(v))) return;
        var L2 = C.limite(e, x, v, q[1]);
        lim.push('lim<sub>x→' + bello(v) + (q[1] === '+' ? '⁺' : '⁻') + '</sub> f = ' + bello(L2.valore));
        if (Math.abs(L2.valore) === Infinity && asint.indexOf(t('verticale x = ', 'vertical x = ') + bello(v)) < 0) asint.push(t('verticale x = ', 'vertical x = ') + bello(v));
      });
    });
    R.passo(t('5. Limiti agli estremi del dominio', '5. Limits at the domain endpoints'), lim.join('<br>') || '—');
    R.passo(t('6. Asintoti', '6. Asymptotes'), asint.join('<br>') || t('nessuno', 'none'));
    var d1 = C.deriva(e, x), f1 = C.funzione(d1, x), crit = C.zeri(f1, lo, hi, 20000).map(belloNum), DR = derivateRazionali(e, x);
    if (DR) { var cp1 = C.coeffPolinomio(DR.A1, x); if (cp1 && cp1.length > 1) crit = C.radiciPolinomio(cp1).filter(function (z) { return !z.im; }).map(function (z) { return belloNum(z.re); }).filter(function (v, i, arr) { return arr.indexOf(v) === i && isFinite(f(v)); }); }
    var mon = segnoIntervalli(f1, crit.concat(rotture).sort(function (a, b) { return a - b; }), -Infinity, Infinity).filter(function (s) { var m = isFinite(s.a) && isFinite(s.b) ? (s.a + s.b) / 2 : isFinite(s.a) ? s.a + 1 : s.b - 1; return isFinite(f(m)); });
    mon.forEach(function (s) { s.extra = s.segno === '+' ? t('f crescente ↗', 'f increasing ↗') : t('f decrescente ↘', 'f decreasing ↘'); });
    var estremi = crit.filter(function (c) { return isFinite(f(c)); }).map(function (c) { var a = f1(c - 1e-5), b = f1(c + 1e-5); return { x: c, y: f(c), tipo: a > 0 && b < 0 ? 'max' : a < 0 && b > 0 ? 'min' : 'flesso a tangente orizzontale' }; });
    R.passo(t('7. Derivata prima e monotonia', '7. First derivative and monotonicity'), "f′(x) = " + (DR ? esc(DR.d1) + t(' (regola del quoziente, numeratore sviluppato)', ' (quotient rule, numerator expanded)') : H(d1)) + '<br>' + t('Punti critici (f′ = 0): ', 'Critical points (f′ = 0): ') + (crit.length ? crit.map(bello).join(', ') : '—') + '<br>' + tabellaSegni(mon) +
      (estremi.length ? estremi.map(function (p) { return (p.tipo === 'max' ? t('massimo relativo', 'local maximum') : p.tipo === 'min' ? t('minimo relativo', 'local minimum') : t('flesso a tangente orizzontale', 'stationary inflection')) + ' in (' + bello(p.x) + ', ' + bello(p.y) + ')'; }).join('<br>') : ''));
    var d2 = C.deriva(d1, x), f2 = C.funzione(d2, x), fl = C.zeri(f2, lo, hi, 20000).map(belloNum);
    var conc = segnoIntervalli(f2, fl.concat(rotture).sort(function (a, b) { return a - b; }), -Infinity, Infinity).filter(function (s) { var m = isFinite(s.a) && isFinite(s.b) ? (s.a + s.b) / 2 : isFinite(s.a) ? s.a + 1 : s.b - 1; return isFinite(f(m)); });
    conc.forEach(function (s) { s.extra = s.segno === '+' ? t('concava verso l’alto ∪', 'concave up ∪') : t('concava verso il basso ∩', 'concave down ∩'); });
    R.passo(t('8. Derivata seconda, concavità, flessi', '8. Second derivative, concavity, inflections'), "f″(x) = " + (DR ? esc(DR.d2) + t(' (si è semplificato un fattore del denominatore)', ' (one denominator factor cancelled)') : H(d2)) + '<br>' + tabellaSegni(conc) + (fl.length ? t('Flessi in x = ', 'Inflections at x = ') + fl.filter(function (v) { return isFinite(f(v)); }).map(bello).join(', ') : ''));
    R.passo(t('9. Grafico', '9. Graph'), t('Si mettono insieme le informazioni: dominio, segno, asintoti, monotonia, concavità. Il grafico è qui accanto.', 'Put the information together: domain, sign, asymptotes, monotonicity, concavity. The graph is alongside.'));
    return { passi: R.passi, risultato: t('studio completo', 'full analysis'), e: e, x: x, zeri: zeri, estremi: estremi, flessi: fl, asintoti: asint, dominio: D.risultato, grafico: true };
  }

  /* ════════════════════════════════════════════════════════════════════
     5. INTEGRALI INDEFINITI, CON I FRATTI SEMPLICI
     ════════════════════════════════════════════════════════════════════ */
  function risolviLineare(A, b) {
    var n = b.length, M = A.map(function (r, i) { return r.concat([b[i]]); });
    for (var c = 0; c < n; c++) {
      var p = c; for (var i = c + 1; i < n; i++) if (Math.abs(M[i][c]) > Math.abs(M[p][c])) p = i;
      var tmp = M[c]; M[c] = M[p]; M[p] = tmp;
      if (Math.abs(M[c][c]) < 1e-14) return null;
      for (i = 0; i < n; i++) if (i !== c) { var f = M[i][c] / M[c][c]; for (var j = c; j <= n; j++) M[i][j] -= f * M[c][j]; }
    }
    return M.map(function (r, i) { return r[n] / r[i]; });
  }
  function minimiQuadrati(fi, y) { /* fi[k][j] = φ_j(x_k) */ var m = fi[0].length, A = [], b = []; for (var i = 0; i < m; i++) { A.push([]); for (var j = 0; j < m; j++) { var s = 0; for (var k = 0; k < fi.length; k++) s += fi[k][i] * fi[k][j]; A[i].push(s); } var sb = 0; for (k = 0; k < fi.length; k++) sb += fi[k][i] * y[k]; b.push(sb); } return risolviLineare(A, b); }
  function poliStr(c, x) { /* coefficienti c[k] di x^k */ var p = []; for (var k = c.length - 1; k >= 0; k--) if (Math.abs(c[k]) > 1e-12) p.push('(' + belloNum(c[k]) + ')*' + x + '^' + k); return p.length ? p.join(' + ') : '0'; }
  function dividiPoli(N, D) { var q = new Array(Math.max(1, N.length - D.length + 1)).fill(0), r = N.slice(); for (var k = N.length - D.length; k >= 0; k--) { var c = r[k + D.length - 1] / D[D.length - 1]; q[k] = c; for (var j = 0; j < D.length; j++) r[k + j] -= c * D[j]; } r = r.slice(0, D.length - 1); while (r.length > 1 && Math.abs(r[r.length - 1]) < 1e-12) r.pop(); return { q: q, r: r }; }
  function fratti(e, x) {
    var fr = frazione(e); if (!fr) return null;
    var cN = C.coeffPolinomio(fr.N, x), cD = C.coeffPolinomio(fr.D, x);
    if (!cN || !cD || cD.length < 2) return null;
    var R = nuovo(), quoz = null, resto = cN;
    if (cN.length >= cD.length) {
      var dv = dividiPoli(cN, cD); quoz = dv.q; resto = dv.r;
      R.passo(t('Divisione dei polinomi', 'Polynomial division'), t('Il grado del numeratore non è minore di quello del denominatore: si divide. ', 'The numerator degree is not lower than the denominator’s: divide. ') + 'N/D = ' + H(C.leggi(poliStr(quoz, x))) + ' + ' + H(C.leggi('(' + poliStr(resto, x) + ')/(' + poliStr(cD, x) + ')')));
    }
    /* radici del denominatore, raggruppate con la molteplicita' */
    var rad = C.radiciPolinomio(cD), reali = [], cpl = [];
    rad.forEach(function (z) {
      if (!z.im) { var g = reali.filter(function (q) { return Math.abs(q.r / q.m - z.re) < 1e-5 * (1 + Math.abs(z.re)); })[0]; if (g) { g.r += z.re; g.m++; } else reali.push({ r: z.re, m: 1 }); }
      else if (z.im > 0) cpl.push({ a: z.re, b: z.im });
    });
    reali.forEach(function (q) { q.r = belloNum(q.r / q.m); });
    if (cpl.some(function (q, i) { return cpl.some(function (w, j) { return j !== i && Math.abs(w.a - q.a) + Math.abs(w.b - q.b) < 1e-5; }); })) return null;
    cpl.forEach(function (q) { q.p = belloNum(-2 * q.a); q.q = belloNum(q.a * q.a + q.b * q.b); });
    var fattori = reali.map(function (q) { return (q.r === 0 ? x : '(' + x + (q.r > 0 ? ' − ' + bello(q.r) : ' + ' + bello(-q.r)) + ')') + (q.m > 1 ? String(q.m).split('').map(function (d) { return '⁰¹²³⁴⁵⁶⁷⁸⁹'[+d]; }).join('') : ''); })
      .concat(cpl.map(function (q) { return '(' + S(C.leggi(x + '^2 + (' + q.p + ')*' + x + ' + (' + q.q + ')')) + ')'; }));
    R.passo(t('Scomposizione del denominatore', 'Factorising the denominator'), 'D(x) = ' + (cD[cD.length - 1] !== 1 ? bello(cD[cD.length - 1]) + '·' : '') + esc(fattori.join('·')) + (cpl.length ? t(' — i fattori di secondo grado hanno Δ < 0 (irriducibili)', ' — the quadratic factors have Δ < 0 (irreducible)') : ''));
    /* la base dei fratti semplici e i coefficienti */
    var base = [];
    reali.forEach(function (q) { for (var k = 1; k <= q.m; k++) base.push({ tipo: 'r', r: q.r, k: k }); });
    cpl.forEach(function (q) { base.push({ tipo: 'qx', p: q.p, q: q.q }); base.push({ tipo: 'q1', p: q.p, q: q.q }); });
    function phi(b, v) { if (b.tipo === 'r') return 1 / Math.pow(v - b.r, b.k); var Q = v * v + b.p * v + b.q; return b.tipo === 'qx' ? v / Q : 1 / Q; }
    var Nr = function (v) { var s = 0; for (var k = resto.length - 1; k >= 0; k--) s = s * v + resto[k]; return s; }, Dv = function (v) { var s = 0; for (var k = cD.length - 1; k >= 0; k--) s = s * v + cD[k]; return s; };
    var pts = [], ys = [];
    for (var i = 0; pts.length < base.length + 6; i++) { var v = -3.37 + i * 0.731; if (Math.abs(Dv(v)) < 1e-3) continue; pts.push(base.map(function (b) { return phi(b, v); })); ys.push(Nr(v) / Dv(v)); }
    var coef = minimiQuadrati(pts, ys); if (!coef) return null;
    coef = coef.map(belloNum);
    var lettere = 'ABCDEFGHIJKLMNOP', decomp = [], integr = [];
    base.forEach(function (b, j) {
      var c = coef[j];
      if (b.tipo === 'r') {
        var den = '(' + x + ' - (' + b.r + '))';
        var ds = S(C.leggi(den + (b.k > 1 ? '^' + b.k : '')));
        decomp.push(lettere[j] + '/' + esc(/\s/.test(ds) && ds.charAt(0) !== '(' ? '(' + ds + ')' : ds));
        if (Math.abs(c) < 1e-12) return;
        integr.push(b.k === 1 ? '(' + c + ')*ln(abs(' + den + '))' : '(' + (-c / (b.k - 1)) + ')/' + den + '^' + (b.k - 1));
      } else if (b.tipo === 'qx') {
        var Bq = c, Cq = coef[j + 1], d = 4 * b.q - b.p * b.p, rq = Math.sqrt(d), Qs = '(' + x + '^2 + (' + b.p + ')*' + x + ' + (' + b.q + '))';
        decomp.push('(' + lettere[j] + x + ' + ' + lettere[j + 1] + ')/' + esc(S(C.leggi(Qs))));
        if (Math.abs(Bq) > 1e-12) integr.push('(' + Bq / 2 + ')*ln(' + Qs + ')');
        var k2 = Cq - Bq * b.p / 2;
        if (Math.abs(k2) > 1e-12) integr.push('(' + (2 * k2 / rq) + ')*atan((2*' + x + ' + (' + b.p + '))/(' + rq + '))');
      }
    });
    R.passo(t('Fratti semplici', 'Partial fractions'), t('Si cerca ', 'Look for ') + (quoz ? 'R(x)/D(x)' : 'f(x)') + ' = ' + decomp.join(' + ') + '<br>' + t('Uguagliando i numeratori (o con il principio di identità dei polinomi): ', 'Equating numerators (identity principle for polynomials): ') + base.map(function (b, j) { return lettere[j] + ' = ' + bello(coef[j]); }).join(', '));
    var Fr = C.integra(e, x) || C.semplifica(C.leggi((quoz ? [C.stampa(C.integra(C.leggi(poliStr(quoz, x)), x))] : []).concat(integr).join(' + ') || '0'));
    R.passo(t('Integrazione termine a termine', 'Term-by-term integration'), '∫ A/(x − r) dx = A·ln|x − r| · ∫ A/(x − r)ᵏ dx = −A/((k − 1)(x − r)ᵏ⁻¹) · ∫ (Bx + C)/(x² + px + q) dx = (B/2)·ln(x² + px + q) + (C − Bp/2)·(2/√(4q − p²))·arctg((2x + p)/√(4q − p²))');
    return { passi: R.passi, primitiva: Fr };
  }
  var NOMI_METODO = {
    linearita: ['Linearità: l’integrale di una somma è la somma degli integrali', 'Linearity: the integral of a sum is the sum of the integrals'],
    costante: ['Le costanti escono dall’integrale', 'Constants come out of the integral'],
    espansione: ['Si sviluppa il prodotto', 'Expand the product'],
    trigonometria: ['Formule trigonometriche (sin²u = (1 − cos 2u)/2, cos²u = (1 + cos 2u)/2, prodotto in somma, sin³u = sin u·(1 − cos²u)); si riscrive', 'Trigonometric identities (sin²u = (1 − cos 2u)/2, cos²u = (1 + cos 2u)/2, product to sum, sin³u = sin u·(1 − cos²u)); rewrite as'],
    tabella: ['Integrale immediato (tabella)', 'Standard integral (table)'],
    parti: ['Integrazione per parti: ∫ u dv = u·v − ∫ v du', 'Integration by parts: ∫ u dv = u·v − ∫ v du'],
    sostituzione: ['Sostituzione', 'Substitution']
  };
  function integraleIndefinito(testo) {
    var e = C.leggi(testo), x = variabile(e), R = nuovo(), Fp = null;
    R.passo(t('Integrale', 'Integral'), '∫ ' + H(e) + ' d' + x);
    var fr = fratti(e, x);
    if (fr && C.uguali(C.deriva(fr.primitiva, x), e, [x])) { fr.passi.forEach(function (p) { R.passo(p.titolo, p.html); }); Fp = fr.primitiva; }
    else {
      var reg = []; Fp = C.integra(e, x, reg);
      var visti = {}, utili = reg.filter(function (r) { var k = r.metodo + JSON.stringify(r.dettagli); if (visti[k] || /__u/.test(k)) return false; visti[k] = 1; return r.metodo === 'parti' || r.metodo === 'sostituzione' || r.metodo === 'espansione' || r.metodo === 'trigonometria' || (r.metodo === 'linearita'); });
      if (Fp) {
        var principali = utili.filter(function (r) { return r.metodo !== 'linearita'; });
        if (!principali.length) R.passo(F.tt(NOMI_METODO.tabella), t('L’integrando (o ciascun addendo) è nella tabella degli integrali immediati, eventualmente con argomento lineare ax + b (si divide per a).', 'The integrand (or each term) is in the table of standard integrals, possibly with a linear argument ax + b (divide by a).'));
        principali.slice().reverse().forEach(function (r) {
          var d = r.dettagli;
          if (r.metodo === 'parti') R.passo(F.tt(NOMI_METODO.parti), 'u = ' + esc(d.u) + ', dv = ' + esc(d.dv) + ' d' + x + ' ⇒ v = ' + esc(d.v) + t('; resta da integrare v·du = ', '; it remains to integrate v·du = ') + esc(d.resto) + ' d' + x + '<br><span style="color:#9fb1c6">' + t('Si sceglie come u il fattore che derivando si semplifica (polinomi, logaritmi, arcotangenti).', 'Choose as u the factor that simplifies when differentiated (polynomials, logarithms, arctangents).') + '</span>');
          else if (r.metodo === 'sostituzione') R.passo(F.tt(NOMI_METODO.sostituzione), 'u = ' + esc(d.u) + ', du = ' + esc(d.du) + ' d' + x + ' ⇒ ∫ ' + esc(d.integrando) + ' du = ' + esc(d.Fu) + '<br><span style="color:#9fb1c6">' + t('Funziona perché nell’integrando compare la derivata di u (a meno di una costante).', 'It works because the derivative of u appears in the integrand (up to a constant).') + '</span>');
          else if (r.metodo === 'espansione') R.passo(F.tt(NOMI_METODO.espansione), H(d.espr));
          else if (r.metodo === 'trigonometria') R.passo(F.tt(NOMI_METODO.trigonometria), H(d.espr));
        });
      }
    }
    if (!Fp) {
      R.passo(t('Nessuna primitiva elementare', 'No elementary antiderivative'), t('Il motore non trova una primitiva in forma chiusa: o non esiste fra le funzioni elementari (come per e^(−x²), sin(x)/x), o richiede una sostituzione che qui non è prevista. Un integrale definito si può comunque calcolare numericamente.', 'The engine finds no closed-form antiderivative: either none exists among elementary functions (as for e^(−x²), sin(x)/x), or it needs a substitution not covered here. A definite integral can still be computed numerically.'));
      return { passi: R.passi, risultato: null };
    }
    R.passo(t('Risultato', 'Result'), '∫ ' + H(e) + ' d' + x + ' = <b>' + H(Fp) + ' + c</b><br><span style="color:#9fb1c6">' + t('Verifica: derivando si riottiene l’integrando ✓', 'Check: differentiating gives back the integrand ✓') + '</span>');
    return { passi: R.passi, risultato: S(Fp) + ' + c', primitiva: Fp };
  }

  /* ════════════════════════════════════════════════════════════════════
     6. INTEGRALI DEFINITI E IMPROPRI
     ════════════════════════════════════════════════════════════════════ */
  function leggiEstremo(s) { s = String(s).trim(); if (/^\+?(∞|inf|infinito)$/i.test(s)) return Infinity; if (/^-(∞|inf|infinito)$/i.test(s)) return -Infinity; return C.valuta(C.leggi(s)); }
  function numericoImproprio(f, a, b) {
    if (isFinite(a) && isFinite(b)) return C.integraleDefinito(f, a, b, 1e-11);
    /* x = a + t/(1 − t) su [0, 1) */
    if (isFinite(a)) return C.integraleDefinito(function (u) { var v = a + u / (1 - u); return f(v) / ((1 - u) * (1 - u)); }, 0, 1 - 1e-12, 1e-11);
    if (isFinite(b)) return C.integraleDefinito(function (u) { var v = b - u / (1 - u); return f(v) / ((1 - u) * (1 - u)); }, 0, 1 - 1e-12, 1e-11);
    var r1 = numericoImproprio(f, 0, Infinity), r2 = numericoImproprio(f, -Infinity, 0);
    return { valore: r1.valore + r2.valore, affidabile: r1.affidabile && r2.affidabile };
  }
  function ordine(f, vicino, lontano) { var a = Math.abs(f(vicino)), b = Math.abs(f(lontano)); return Math.log(b / a) / Math.log(Math.abs(lontano) / Math.abs(vicino)); }
  function integraleDefinito(testo, at, bt) {
    var e = C.leggi(testo), x = variabile(e), f = C.funzione(e, x), R = nuovo(), a = leggiEstremo(at), b = leggiEstremo(bt);
    R.passo(t('Integrale', 'Integral'), '∫<sub>' + bello(a) + '</sub><sup>' + bello(b) + '</sup> ' + H(e) + ' d' + x);
    /* singolarita' interne */
    var sing = [];
    if (isFinite(a) && isFinite(b)) { for (var i = 0; i <= 4000; i++) { var v = a + (b - a) * i / 4000; if (!isFinite(f(v)) && i > 0 && i < 4000) { var s = belloNum(v); if (!sing.some(function (w) { return Math.abs(w - s) < 1e-9; })) sing.push(s); } } }
    var improprio = !isFinite(a) || !isFinite(b) || !isFinite(f(a)) || !isFinite(f(b)) || sing.length;
    if (improprio) {
      var note = [];
      if (b === Infinity) { var p = ordine(f, 1e4, 1e5); note.push(t('a +∞ |f| ~ 1/x^p con p ≈ ', 'at +∞ |f| ~ 1/x^p with p ≈ ') + (+p.toFixed(2)) + (p > 1.02 ? t(' > 1: converge (confronto con 1/x^p)', ' > 1: converges (comparison with 1/x^p)') : p < 0.98 ? t(' ≤ 1: diverge', ' ≤ 1: diverges') : t(' = 1: caso critico', ' = 1: critical case'))); }
      if (a === -Infinity) { var p2 = ordine(f, -1e4, -1e5); note.push(t('a −∞ p ≈ ', 'at −∞ p ≈ ') + (+p2.toFixed(2)) + (p2 > 1.02 ? ' > 1: converge' : t(' ≤ 1: diverge', ' ≤ 1: diverges'))); }
      [a, b].concat(sing).forEach(function (c) {
        if (!isFinite(c) || isFinite(f(c))) return;
        var lato = c === a ? 1 : -1, p3 = -ordine(function (h) { return f(c + lato * h); }, 1e-3, 1e-5);
        note.push(t('vicino a ', 'near ') + bello(c) + t(' |f| ~ 1/|x − c|^p con p ≈ ', ' |f| ~ 1/|x − c|^p with p ≈ ') + (+p3.toFixed(2)) + (p3 < 0.98 ? t(' < 1: integrabile', ' < 1: integrable') : t(' ≥ 1: non integrabile (diverge)', ' ≥ 1: not integrable (diverges)')));
      });
      R.passo(t('Integrale improprio: convergenza', 'Improper integral: convergence'), t('L’integrale è improprio (estremo infinito o funzione illimitata). Criterio del confronto asintotico con le potenze: ', 'The integral is improper (infinite endpoint or unbounded function). Asymptotic comparison with powers: ') + '<br>' + note.join('<br>'));
    }
    var I = integraleIndefinito(testo), val = null;
    if (I.primitiva) {
      var Fp = I.primitiva, FF = C.funzione(Fp, x);
      var estremo = function (c, lato) { if (isFinite(c) && isFinite(FF(c)) && isFinite(f(c))) return FF(c); return C.limite(Fp, x, c, lato).valore; };
      if (!sing.length) {
        var Fb = estremo(b, '-'), Fa = estremo(a, '+'); val = Fb - Fa;
        R.passo(t('Teorema fondamentale del calcolo', 'Fundamental theorem of calculus'), t('Primitiva: ', 'Antiderivative: ') + 'F(' + x + ') = ' + H(Fp) + '<br>' + (improprio ? t('Per un integrale improprio si calcola il limite di F agli estremi: ', 'For an improper integral take the limit of F at the endpoints: ') : '') + 'F(' + bello(b) + ') − F(' + bello(a) + ') = ' + bello(Fb) + ' − (' + bello(Fa) + ') = <b>' + bello(val) + '</b>');
      } else R.passo(t('Attenzione', 'Caution'), t('La funzione non è continua in ', 'The function is not continuous at ') + sing.map(bello).join(', ') + t(': il teorema fondamentale non si applica su tutto l’intervallo. Si spezza nei punti singolari.', ': the fundamental theorem does not apply over the whole interval. Split at the singular points.'));
    }
    var num = numericoImproprio(f, a, b), ris;
    if (val !== null && isFinite(val)) { ris = bello(val); if (Math.abs(val - num.valore) > 1e-5 * (1 + Math.abs(val))) R.passo(t('Controllo', 'Check'), t('Il valore numerico non coincide: probabile divergenza o discontinuità.', 'The numerical value does not match: probable divergence or discontinuity.')); }
    else ris = (val === Infinity || val === -Infinity) ? (val > 0 ? '+∞' : '−∞') + t(' (diverge)', ' (diverges)') : num.affidabile && isFinite(num.valore) ? '≈ ' + (+num.valore.toPrecision(10)) : t('diverge o non è calcolabile', 'diverges or cannot be computed');
    R.passo(t('Risultato', 'Result'), '<b>' + esc(ris) + '</b>' + (isFinite(num.valore) ? ' <span style="color:#9fb1c6">(' + t('controllo numerico: ', 'numerical check: ') + (+num.valore.toPrecision(10)) + ')</span>' : ''));
    return { passi: R.passi, risultato: ris, valore: val !== null ? val : num.valore };
  }

  /* ════════════════════════════════════════════════════════════════════
     7. TAYLOR
     ════════════════════════════════════════════════════════════════════ */
  function taylor(testo, x0t, n) {
    var e = C.leggi(testo), x = variabile(e), x0 = C.valuta(C.leggi(String(x0t))), R = nuovo(), c = C.serie(e, x, x0, n), fatt = 1, righe = [];
    for (var k = 0; k <= n; k++) { if (k) fatt *= k; righe.push('<tr><td>' + k + '</td><td class="bsiFX-num">f<sup>(' + k + ')</sup>(' + bello(x0) + ') = ' + bello(c[k] * fatt) + '</td><td class="bsiFX-num">' + bello(c[k]) + '</td></tr>'); }
    R.passo(t('Coefficienti', 'Coefficients'), t('Formula di Taylor: f(x) = Σ f⁽ᵏ⁾(x₀)/k!·(x − x₀)ᵏ + o((x − x₀)ⁿ). ', 'Taylor’s formula: f(x) = Σ f⁽ᵏ⁾(x₀)/k!·(x − x₀)ᵏ + o((x − x₀)ⁿ). ') + '<table class="bsiFX-tab" style="width:auto"><tr><th>k</th><th>' + t('derivata', 'derivative') + '</th><th>f⁽ᵏ⁾/k!</th></tr>' + righe.join('') + '</table>');
    var termini = []; c.forEach(function (v, k) { if (Math.abs(v) > 1e-12) termini.push(monomio(v, k, x0, x)); });
    var p = termini.join(' + ').replace(/\+ −/g, '− ') || '0';
    R.passo(t('Polinomio', 'Polynomial'), 'f(x) = <b>' + esc(p) + '</b> + o(' + esc(monomio(1, n, x0, x)) + ')');
    return { passi: R.passi, risultato: p, coeff: c };
  }

  /* ════════════════════════════════════════════════════════════════════
     8. SERIE NUMERICHE
     ════════════════════════════════════════════════════════════════════ */
  /* il termine generale valutato nello spazio dei logaritmi: n!, 3ⁿ, nⁿ non traboccano */
  function lgamma(x) {
    var c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    var y = x, tmp = x + 5.5; tmp -= (x + 0.5) * Math.log(tmp);
    var ser = 1.000000000190015; for (var j = 0; j < 6; j++) ser += c[j] / ++y;
    return -tmp + Math.log(2.5066282746310005 * ser / x);
  }
  function logValutatore(e, n) {
    function L(q, k) {
      var amb = {}; amb[n] = k;
      switch (q.t) {
        case 'n': var v = C.valuta(q); return { l: Math.log(Math.abs(v)), s: Math.sign(v) };
        case 's': var w = C.valuta(q, amb); return { l: Math.log(Math.abs(w)), s: Math.sign(w) };
        case '*': return q.a.reduce(function (acc, f) { var r = L(f, k); return { l: acc.l + r.l, s: acc.s * r.s }; }, { l: 0, s: 1 });
        case '^':
          var xv = C.valuta(q.a[1], amb), b = L(q.a[0], k);
          if (b.s === 0) return xv > 0 ? { l: -Infinity, s: 0 } : { l: Infinity, s: 1 };
          var sg = b.s > 0 ? 1 : (Math.abs(xv - Math.round(xv)) < 1e-9 ? (Math.round(xv) % 2 ? -1 : 1) : NaN);
          return { l: xv * b.l, s: sg };
        case 'f':
          if (q.n === 'fact') { var u = C.valuta(q.a[0], amb); return { l: lgamma(u + 1), s: 1 }; }
          if (q.n === 'exp') return { l: C.valuta(q.a[0], amb), s: 1 };
          var z = C.valuta(q, amb); return { l: Math.log(Math.abs(z)), s: Math.sign(z) };
        case '+':
          var parti = q.a.map(function (f) { return L(f, k); }), m = Math.max.apply(null, parti.map(function (r) { return r.l; }));
          if (!isFinite(m)) return { l: m, s: 1 };
          var sum = parti.reduce(function (acc, r) { return acc + r.s * Math.exp(r.l - m); }, 0);
          return { l: m + Math.log(Math.abs(sum)), s: Math.sign(sum) };
      }
      return { l: NaN, s: NaN };
    }
    var E = C.semplifica(e);
    return function (k) { return L(E, k); };
  }
  function limSucc(g) {
    var ks = [], v = [];
    for (var j = 1; j <= 8; j++) { var k = Math.pow(10, j), y = g(k); ks.push(k); v.push(y); }
    var fin = v.filter(isFinite), n = fin.length;
    if (n >= 3) for (var i = 2; i < n; i++) {
      var y2 = fin[i], d1 = Math.abs(y2 - fin[i - 1]), d2 = Math.abs(fin[i - 1] - fin[i - 2]);
      if (d1 <= 1e-6 * (1 + Math.abs(y2)) && d2 <= 1e-3 * (1 + Math.abs(y2))) { if (d1 > 0 && d2 / d1 > 8 && d2 / d1 < 12) y2 = (10 * y2 - fin[i - 1]) / 9; return Math.abs(y2) < 1e-7 ? 0 : C.aggancia(y2); }
    }
    var last = v[v.length - 1];
    if (last === Infinity || last === -Infinity) return last;
    /* decadimento lento a zero (come 1/√n): modulo che cala con rapporto costante, segno fisso */
    if (n >= 4) { var u4 = fin.slice(-4); if (u4.every(function (y) { return Math.sign(y) === Math.sign(u4[0]) && y !== 0; }) && u4.every(function (y, q) { return q === 0 || Math.abs(y) < 0.9 * Math.abs(u4[q - 1]); })) { var rr = Math.abs(u4[3] / u4[2]), rp = Math.abs(u4[2] / u4[1]); if (Math.abs(rr - rp) < 0.05 * rp) return 0; } }
    if (n >= 4) { var dd = []; for (i = n - 3; i < n; i++) dd.push(fin[i] - fin[i - 1]); if (dd.every(function (d) { return d > 0; }) && dd.every(function (d, q) { return q === 0 || d >= 0.8 * dd[q - 1]; })) return Infinity; if (dd.every(function (d) { return d < 0; }) && dd.every(function (d, q) { return q === 0 || d <= 0.8 * dd[q - 1]; })) return -Infinity; }
    return NaN;
  }
  function serieNumerica(testo, n0, sottoserie) {
    var e = typeof testo === 'string' ? C.leggi(testo) : testo, n = variabile(e, 'n'), La = logValutatore(e, n), R = nuovo(); n0 = n0 == null ? 1 : n0;
    var a = function (k) { var r = La(k); return r.s * Math.exp(r.l); };
    R.passo(t('Serie', 'Series'), 'Σ<sub>' + n + '=' + n0 + '</sub><sup>∞</sup> ' + H(e));
    var L0 = limSucc(a);
    R.passo(t('Condizione necessaria', 'Necessary condition'), t('Se la serie converge allora a_n → 0. ', 'If the series converges then a_n → 0. ') + 'lim a<sub>n</sub> = ' + bello(L0) + (L0 === 0 ? t(': la condizione è soddisfatta (ma non basta).', ': the condition holds (but is not sufficient).') : ''));
    if (L0 !== 0) {
      var nonTende = isNaN(L0) ? t('non converge (il termine generale non tende a 0: oscilla)', 'does not converge (the general term does not tend to 0: it oscillates)') : t('diverge (il termine generale non tende a 0)', 'diverges (the general term does not tend to 0)');
      R.passo(t('Conclusione', 'Conclusion'), '<b>' + nonTende + '</b>');
      return { passi: R.passi, risultato: nonTende, carattere: isNaN(L0) ? 'indeterminata' : 'diverge' };
    }
    var segni = []; for (var k = n0 + 5; k < n0 + 60; k++) segni.push(La(k).s);
    var positiva = segni.every(function (q) { return q >= 0; }) || segni.every(function (q) { return q <= 0; }), alterna = !positiva && segni.every(function (q, i) { return i === 0 || q === -segni[i - 1]; });
    var conN = (function cerca(q) { return q.t === '^' && C.dipende(q.a[1], n) || (q.a || []).some(cerca); })(e), fatt = (function cerca(q) { return (q.t === 'f' && q.n === 'fact') || (q.a || []).some(cerca); })(e);
    function studioPositivo(etichetta) {
      var Lr = limSucc(function (k) { return Math.exp(La(k + 1).l - La(k).l); });
      R.passo(t('Criterio del rapporto', 'Ratio test') + etichetta, 'lim |a<sub>n+1</sub>|/|a<sub>n</sub>| = ' + bello(Lr) + (Lr < 1 - 1e-9 ? t(' < 1: converge', ' < 1: converges') : Lr > 1 + 1e-9 ? t(' > 1: diverge', ' > 1: diverges') : t(' = 1: il criterio non decide', ' = 1: the test is inconclusive')) + (fatt ? '<br><span style="color:#9fb1c6">' + t('Con i fattoriali il rapporto è la scelta naturale: (n+1)!/n! = n + 1.', 'With factorials the ratio test is the natural choice: (n+1)!/n! = n + 1.') + '</span>' : ''));
      if (Lr < 1 - 1e-9) return 'converge';
      if (Lr > 1 + 1e-9) return 'diverge';
      if (conN) {
        var Lq = limSucc(function (k) { return Math.exp(La(k).l / k); });
        R.passo(t('Criterio della radice', 'Root test') + etichetta, 'lim |a<sub>n</sub>|<sup>1/n</sup> = ' + bello(Lq));
        if (Lq < 1 - 1e-9) return 'converge'; if (Lq > 1 + 1e-9) return 'diverge';
      }
      var p = -(La(1e7).l - La(1e6).l) / Math.log(10), pr = Math.round(p * 4) / 4, cst = Math.exp(La(1e7).l + pr * Math.log(1e7));
      R.passo(t('Confronto asintotico', 'Asymptotic comparison') + etichetta, t('Per n grande |a_n| ~ c/n^p con p ≈ ', 'For large n |a_n| ~ c/n^p with p ≈ ') + bello(pr) + ' (c ≈ ' + (+cst.toPrecision(3)) + '). ' + t('Σ1/n^p converge se e solo se p > 1. ', 'Σ1/n^p converges iff p > 1. ') + (Math.abs(pr - 1) < 0.2 ? t('Caso critico p = 1: serve un confronto più fine (con 1/(n·ln n), che diverge, o 1/(n·ln² n), che converge).', 'Critical case p = 1: a finer comparison is needed (with 1/(n·ln n), divergent, or 1/(n·ln² n), convergent).') : ''));
      if (Math.abs(pr - 1) < 0.2) { var r1 = Math.exp(La(1e6).l) * 1e6 * Math.log(1e6), r2 = Math.exp(La(1e8).l) * 1e8 * Math.log(1e8); return r2 > 0.8 * r1 ? 'diverge' : 'converge'; }
      return pr > 1 ? 'converge' : 'diverge';
    }
    var ris, car;
    if (positiva) { car = studioPositivo(''); ris = car === 'converge' ? t('converge', 'converges') : (segni[0] < 0 ? t('diverge negativamente', 'diverges to −∞') : t('diverge positivamente', 'diverges to +∞')); }
    else if (alterna) {
      var decr = true; for (k = n0 + 3; k < n0 + 300; k++) if (La(k + 1).l > La(k).l + 1e-15) decr = false;
      R.passo(t('Serie a segni alterni: criterio di Leibniz', 'Alternating series: Leibniz test'), '|a<sub>n</sub>| → 0 ' + (decr ? t('ed è definitivamente decrescente: la serie <b>converge</b>.', 'and is eventually decreasing: the series <b>converges</b>.') : t('ma non risulta decrescente: Leibniz non si applica.', 'but is not decreasing: Leibniz does not apply.')));
      var ass = studioPositivo(' (' + t('serie dei valori assoluti', 'series of absolute values') + ')');
      car = decr ? (ass === 'converge' ? 'assoluta' : 'semplice') : ass === 'converge' ? 'assoluta' : 'indecisa';
      ris = car === 'assoluta' ? t('converge assolutamente', 'converges absolutely') : car === 'semplice' ? t('converge semplicemente (non assolutamente)', 'converges conditionally (not absolutely)') : t('carattere da approfondire', 'character needs further study');
    } else {
      var as2 = studioPositivo(' (' + t('valori assoluti', 'absolute values') + ')');
      car = as2 === 'converge' ? 'assoluta' : 'indecisa';
      ris = as2 === 'converge' ? t('converge assolutamente (quindi converge)', 'converges absolutely (hence converges)') : t('la serie dei moduli diverge: il carattere va studiato altrimenti', 'the series of moduli diverges: study the character otherwise');
    }
    var somma = null;
    if (!sottoserie) {
      var q1 = a(n0 + 1) / a(n0), q2 = a(n0 + 7) / a(n0 + 6);
      if (isFinite(q1) && Math.abs(q1 - q2) < 1e-12 * (1 + Math.abs(q1)) && Math.abs(q1) < 1) { somma = a(n0) / (1 - q1); R.passo(t('Serie geometrica', 'Geometric series'), t('Il rapporto fra termini consecutivi è costante, q = ', 'The ratio of consecutive terms is constant, q = ') + bello(belloNum(q1)) + ': S = a<sub>' + n0 + '</sub>/(1 − q) = <b>' + bello(belloNum(somma)) + '</b>'); }
      else if (car === 'converge' || car === 'assoluta' || car === 'semplice') { var s2 = 0; for (k = n0; k < n0 + 200000; k++) s2 += a(k); R.passo(t('Somma', 'Sum'), 'S<sub>200000</sub> ≈ ' + (+s2.toPrecision(8)) + ' <span style="color:#9fb1c6">(' + t('stima numerica; la somma esatta di solito non si chiede', 'numerical estimate; the exact sum is usually not asked') + ')</span>'); }
    }
    R.passo(t('Conclusione', 'Conclusion'), t('La serie ', 'The series ') + '<b>' + ris + '</b>');
    return { passi: R.passi, risultato: ris, carattere: car, somma: somma };
  }
  function seriePotenze(testo, x0t) {
    var e = C.leggi(testo), n = 'n', R = nuovo(), x0 = C.valuta(C.leggi(String(x0t || '0'))), Lc = logValutatore(e, n);
    R.passo(t('Serie di potenze', 'Power series'), 'Σ ' + H(e) + '·(x − ' + bello(x0) + ')<sup>n</sup>');
    var L = limSucc(function (k) { return Math.exp(Lc(k + 1).l - Lc(k).l); }), Rr = L === 0 ? Infinity : !isFinite(L) ? 0 : belloNum(1 / L);
    R.passo(t('Raggio di convergenza (criterio del rapporto)', 'Radius of convergence (ratio test)'), 'L = lim |c<sub>n+1</sub>/c<sub>n</sub>| = ' + bello(L) + ' ⇒ R = 1/L = <b>' + bello(Rr) + '</b>' + t(' — per |x − x₀| < R converge assolutamente, per |x − x₀| > R diverge.', ' — for |x − x₀| < R it converges absolutely, for |x − x₀| > R it diverges.'));
    if (!isFinite(Rr) || Rr === 0) { var r0 = Rr === 0 ? t('converge solo in x = ', 'converges only at x = ') + bello(x0) : t('converge per ogni x reale', 'converges for every real x'); R.passo(t('Insieme di convergenza', 'Convergence set'), '<b>' + r0 + '</b>'); return { passi: R.passi, risultato: r0, raggio: Rr }; }
    var estremi = [x0 - Rr, x0 + Rr].map(function (xe) {
      var termine = C.semplifica(B.mul(e, B.pow(nodo(xe - x0), C.simbolo('n'))));
      var s = serieNumerica(termine, 1, true), conv = s.carattere === 'converge' || s.carattere === 'assoluta' || s.carattere === 'semplice';
      return { x: xe, conv: conv, txt: s.risultato, termine: termine };
    });
    estremi.forEach(function (q) { R.passo(t('Estremo x = ', 'Endpoint x = ') + bello(belloNum(q.x)), t('Si ottiene la serie numerica Σ ', 'This gives the numerical series Σ ') + H(q.termine) + t(', che ', ', which ') + q.txt); });
    var ins = (estremi[0].conv ? '[' : '(') + bello(belloNum(estremi[0].x)) + ', ' + bello(belloNum(estremi[1].x)) + (estremi[1].conv ? ']' : ')');
    R.passo(t('Insieme di convergenza', 'Convergence set'), '<b>' + ins + '</b>');
    return { passi: R.passi, risultato: ins, raggio: Rr };
  }

  /* ════════════════════════════════════════════════════════════════════
     9. FUNZIONI DI DUE VARIABILI
     ════════════════════════════════════════════════════════════════════ */
  function f2(e) { var c = C.compila(e), amb = {}; return function (x, y) { amb.x = x; amb.y = y; return c(amb); }; }
  function dueVariabili(testo, punto, dir) {
    var e = C.leggi(testo), R = nuovo(), fx = C.deriva(e, 'x'), fy = C.deriva(e, 'y'), cond = condizioni(e, 'x').concat(condizioni(e, 'y').filter(function (c) { return !C.dipende(c.espr, 'x'); }));
    R.passo(t('Dominio', 'Domain'), cond.length ? cond.map(function (c) { return H(c.espr) + ' ' + SIMB[c.tipo]; }).join(' , ') + t(' (regione del piano)', ' (a region of the plane)') : 'ℝ²');
    R.passo(t('Derivate parziali', 'Partial derivatives'), '∂f/∂x = ' + H(fx) + '<br>∂f/∂y = ' + H(fy));
    var out = { passi: R.passi };
    if (punto) {
      var P = { x: punto[0], y: punto[1] }, gx = val(fx, P), gy = val(fy, P), f0 = val(e, P);
      R.passo(t('Gradiente in ', 'Gradient at ') + '(' + bello(punto[0]) + ', ' + bello(punto[1]) + ')', '∇f = (' + bello(gx) + ', ' + bello(gy) + ') · |∇f| = ' + bello(Math.hypot(gx, gy)) + t(' (direzione di massima crescita)', ' (direction of steepest ascent)'));
      R.passo(t('Piano tangente', 'Tangent plane'), 'z = f(x₀, y₀) + f<sub>x</sub>(x − x₀) + f<sub>y</sub>(y − y₀) ⇒ z = ' + bello(f0) + ' + ' + bello(gx) + '(x − ' + bello(punto[0]) + ') + ' + bello(gy) + '(y − ' + bello(punto[1]) + ')');
      if (dir) { var nv = Math.hypot(dir[0], dir[1]), dd = (gx * dir[0] + gy * dir[1]) / nv; R.passo(t('Derivata direzionale', 'Directional derivative'), '∂f/∂v = ∇f · v/|v| = (' + bello(gx) + '·' + bello(dir[0]) + ' + ' + bello(gy) + '·' + bello(dir[1]) + ')/' + bello(nv) + ' = <b>' + bello(dd) + '</b>'); out.direzionale = dd; }
      out.gradiente = [gx, gy];
    }
    var A = F.calcolo.multi.analizza(testo, [-6, 6, -6, 6]);
    var fxx = C.deriva(fx, 'x'), fxy = C.deriva(fx, 'y'), fyy = C.deriva(fy, 'y');
    R.passo(t('Punti critici', 'Critical points'), t('Si risolve il sistema ∇f = 0: ', 'Solve the system ∇f = 0: ') + '{ ' + H(fx) + ' = 0 ; ' + H(fy) + ' = 0 }<br>' + (A.critici.length ? A.critici.map(function (p) { return '(' + bello(belloNum(p.x)) + ', ' + bello(belloNum(p.y)) + ')'; }).join(', ') : t('nessuno nel riquadro [−6, 6]²', 'none in the box [−6, 6]²')));
    if (A.critici.length) {
      R.passo(t('Matrice hessiana e classificazione', 'Hessian matrix and classification'), 'H = [ ' + H(fxx) + ' , ' + H(fxy) + ' ; ' + H(fxy) + ' , ' + H(fyy) + ' ]<br>' +
        A.critici.map(function (p) { var hxx = val(fxx, p), det = p.detH; return '(' + bello(belloNum(p.x)) + ', ' + bello(belloNum(p.y)) + '): det H = ' + bello(belloNum(det)) + ', f<sub>xx</sub> = ' + bello(belloNum(hxx)) + ' ⇒ <b>' + (p.tipo === 'minimo' ? t('minimo relativo', 'local minimum') : p.tipo === 'massimo' ? t('massimo relativo', 'local maximum') : p.tipo === 'sella' ? t('punto di sella', 'saddle point') : t('il test non decide (det H = 0)', 'inconclusive (det H = 0)')) + '</b>'; }).join('<br>') +
        '<br><span style="color:#9fb1c6">' + t('det H > 0 e f_xx > 0: minimo; det H > 0 e f_xx < 0: massimo; det H < 0: sella; det H = 0: serve altro.', 'det H > 0 and f_xx > 0: minimum; det H > 0 and f_xx < 0: maximum; det H < 0: saddle; det H = 0: more is needed.') + '</span>');
    }
    out.critici = A.critici; out.risultato = A.critici.map(function (p) { return p.tipo + ' (' + bello(belloNum(p.x)) + ', ' + bello(belloNum(p.y)) + ')'; }).join('; ') || '—';
    return out;
  }
  function maxMinCompatto(testo, dom) {
    var e = C.leggi(testo), f = f2(e), R = nuovo(), cand = [];
    var A = F.calcolo.multi.analizza(testo, dom.tipo === 'rettangolo' ? [dom.a, dom.b, dom.c, dom.d] : dom.tipo === 'disco' ? [dom.cx - dom.r, dom.cx + dom.r, dom.cy - dom.r, dom.cy + dom.r] : [Math.min(dom.v[0][0], dom.v[1][0], dom.v[2][0]), Math.max(dom.v[0][0], dom.v[1][0], dom.v[2][0]), Math.min(dom.v[0][1], dom.v[1][1], dom.v[2][1]), Math.max(dom.v[0][1], dom.v[1][1], dom.v[2][1])]);
    function dentro(x, y) {
      if (dom.tipo === 'rettangolo') return x > dom.a && x < dom.b && y > dom.c && y < dom.d;
      if (dom.tipo === 'disco') return Math.hypot(x - dom.cx, y - dom.cy) < dom.r - 1e-12;
      var v = dom.v, s = function (p, q, r) { return (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]); }, d1 = s(v[0], v[1], [x, y]), d2 = s(v[1], v[2], [x, y]), d3 = s(v[2], v[0], [x, y]);
      return (d1 > 1e-12 && d2 > 1e-12 && d3 > 1e-12) || (d1 < -1e-12 && d2 < -1e-12 && d3 < -1e-12);
    }
    var interni = A.critici.filter(function (p) { return dentro(p.x, p.y); });
    interni.forEach(function (p) { cand.push({ x: p.x, y: p.y, dove: t('interno', 'interior') }); });
    R.passo(t('Teorema di Weierstrass', 'Weierstrass theorem'), t('f è continua su un insieme chiuso e limitato: massimo e minimo assoluti esistono. Si cercano fra i punti critici interni e sul bordo.', 'f is continuous on a closed bounded set: absolute maximum and minimum exist. Look among interior critical points and on the boundary.'));
    R.passo(t('Punti critici interni', 'Interior critical points'), interni.length ? interni.map(function (p) { return '(' + bello(belloNum(p.x)) + ', ' + bello(belloNum(p.y)) + ')'; }).join(', ') : t('nessuno', 'none'));
    var lati = [];
    if (dom.tipo === 'disco') lati.push({ nome: t('circonferenza x = ', 'circle x = ') + bello(dom.cx) + ' + ' + bello(dom.r) + 'cos t, y = ' + bello(dom.cy) + ' + ' + bello(dom.r) + 'sin t', p: function (u) { return [dom.cx + dom.r * Math.cos(u), dom.cy + dom.r * Math.sin(u)]; }, a: 0, b: 2 * Math.PI });
    else {
      var V = dom.tipo === 'rettangolo' ? [[dom.a, dom.c], [dom.b, dom.c], [dom.b, dom.d], [dom.a, dom.d]] : dom.v;
      V.forEach(function (P, i) { var Q = V[(i + 1) % V.length]; lati.push({ nome: t('lato da ', 'side from ') + '(' + bello(P[0]) + ', ' + bello(P[1]) + ') ' + t('a', 'to') + ' (' + bello(Q[0]) + ', ' + bello(Q[1]) + ')', p: function (u) { return [P[0] + (Q[0] - P[0]) * u, P[1] + (Q[1] - P[1]) * u]; }, a: 0, b: 1 }); cand.push({ x: P[0], y: P[1], dove: t('vertice', 'vertex') }); });
    }
    var bordoTxt = lati.map(function (l) {
      var g = function (u) { var p = l.p(u); return f(p[0], p[1]); }, dg = function (u) { var h = 1e-6; return (g(u + h) - g(u - h)) / (2 * h); }, z = C.zeri(dg, l.a, l.b, 4000);
      z.forEach(function (u) { var p = l.p(u); cand.push({ x: p[0], y: p[1], dove: t('bordo', 'boundary') }); });
      return l.nome + ': ' + (z.length ? t('punti stazionari della restrizione in ', 'stationary points of the restriction at ') + z.map(function (u) { var p = l.p(u); return '(' + bello(belloNum(+p[0].toFixed(9))) + ', ' + bello(belloNum(+p[1].toFixed(9))) + ')'; }).join(', ') : t('restrizione monotona', 'monotone restriction'));
    });
    R.passo(t('Bordo', 'Boundary'), t('Su ogni pezzo del bordo f diventa una funzione di una variabile (si parametrizza); se ne cercano i punti stazionari, più gli estremi dei pezzi.', 'On each piece of the boundary f becomes a function of one variable (parametrise); find its stationary points, plus the endpoints of the pieces.') + '<br>' + bordoTxt.join('<br>'));
    cand.forEach(function (p) { p.x = belloNum(+p.x.toFixed(10)); p.y = belloNum(+p.y.toFixed(10)); p.z = f(p.x, p.y); });
    var mx = cand.reduce(function (a, b) { return b.z > a.z ? b : a; }), mn = cand.reduce(function (a, b) { return b.z < a.z ? b : a; });
    R.passo(t('Confronto dei valori', 'Comparing the values'), '<table class="bsiFX-tab" style="width:auto">' + cand.map(function (p) { return '<tr><td>(' + bello(p.x) + ', ' + bello(p.y) + ')</td><td>' + p.dove + '</td><td class="bsiFX-num">' + bello(belloNum(+p.z.toFixed(10))) + '</td></tr>'; }).join('') + '</table>' +
      t('Massimo assoluto ', 'Absolute maximum ') + '<b>' + bello(belloNum(+mx.z.toFixed(10))) + '</b> ' + t('in', 'at') + ' (' + bello(mx.x) + ', ' + bello(mx.y) + ') · ' + t('minimo assoluto ', 'absolute minimum ') + '<b>' + bello(belloNum(+mn.z.toFixed(10))) + '</b> ' + t('in', 'at') + ' (' + bello(mn.x) + ', ' + bello(mn.y) + ')');
    return { passi: R.passi, risultato: 'max ' + bello(belloNum(+mx.z.toFixed(10))) + ', min ' + bello(belloNum(+mn.z.toFixed(10))), max: mx.z, min: mn.z };
  }

  /* ════════════════════════════════════════════════════════════════════
     10. INTEGRALI DOPPI
     ════════════════════════════════════════════════════════════════════ */
  function integraleDoppio(d) {
    var R = nuovo(), e = C.leggi(d.f), polari = d.tipo === 'polari';
    var esterna = polari ? 'θ' : d.tipo === 'y' ? 'y' : 'x', interna = polari ? 'r' : d.tipo === 'y' ? 'x' : 'y';
    var integrando = e;
    if (polari) {
      integrando = C.semplifica(B.mul(C.sostituisci(C.sostituisci(e, 'x', C.leggi('r*cos(θ)')), 'y', C.leggi('r*sin(θ)')), C.simbolo('r')));
      R.passo(t('Coordinate polari', 'Polar coordinates'), 'x = r cos θ, y = r sin θ, dx dy = <b>r</b> dr dθ ⇒ ' + t('integrando ', 'integrand ') + H(integrando));
    }
    var g1 = C.leggi(String(d.g1)), g2 = C.leggi(String(d.g2)), a = C.valuta(C.leggi(String(d.a))), b = C.valuta(C.leggi(String(d.b)));
    R.passo(t('Dominio normale', 'Normal domain'), bello(a) + ' ≤ ' + esterna + ' ≤ ' + bello(b) + ', ' + H(g1) + ' ≤ ' + interna + ' ≤ ' + H(g2) + '<br>' + t('Formula di riduzione: ', 'Reduction formula: ') + '∬ f = ∫<sub>' + bello(a) + '</sub><sup>' + bello(b) + '</sup> ( ∫<sub>' + S(g1) + '</sub><sup>' + S(g2) + '</sup> f d' + interna + ' ) d' + esterna);
    var Gi = C.integra(integrando, interna), valore = null;
    if (Gi) {
      var h = C.semplifica(B.sub(C.sostituisci(Gi, interna, g2), C.sostituisci(Gi, interna, g1)));
      R.passo(t('Integrale interno', 'Inner integral'), '∫ ' + H(integrando) + ' d' + interna + ' = ' + H(Gi) + '<br>' + t('tra gli estremi: ', 'between the limits: ') + 'h(' + esterna + ') = ' + H(h));
      var He = C.integra(h, esterna);
      if (He) {
        var FF = C.funzione(He, esterna); valore = FF(b) - FF(a);
        R.passo(t('Integrale esterno', 'Outer integral'), '∫ h d' + esterna + ' = ' + H(He) + ' ⇒ ' + t('valore ', 'value ') + '<b>' + bello(valore) + '</b>');
      }
    }
    /* controllo numerico: Simpson annidato */
    var fi = C.compila(integrando), G1 = C.funzione(g1, esterna), G2 = C.funzione(g2, esterna), amb = {};
    var num = C.integraleDefinito(function (s) { var lo = G1(s), hi = G2(s); return C.integraleDefinito(function (u) { amb[esterna] = s; amb[interna] = u; return fi(amb); }, lo, hi, 1e-10).valore; }, a, b, 1e-9).valore;
    if (valore === null || !isFinite(valore)) { valore = num; R.passo(t('Calcolo numerico', 'Numerical evaluation'), t('Una delle primitive non è elementare: il valore è calcolato numericamente. ', 'One antiderivative is not elementary: the value is computed numerically. ') + '≈ <b>' + (+num.toPrecision(10)) + '</b>'); }
    else R.passo(t('Controllo', 'Check'), t('Integrazione numerica: ', 'Numerical integration: ') + (+num.toPrecision(10)) + (Math.abs(num - valore) < 1e-6 * (1 + Math.abs(valore)) ? ' ✓' : ' ✗'));
    return { passi: R.passi, risultato: bello(valore), valore: valore };
  }

  /* ════════════════════════════════════════════════════════════════════
     11. FORME DIFFERENZIALI E INTEGRALI CURVILINEI
     ════════════════════════════════════════════════════════════════════ */
  function formeDifferenziali(d) {
    var R = nuovo(), M = C.leggi(d.M), N = C.leggi(d.N), My = C.deriva(M, 'y'), Nx = C.deriva(N, 'x'), chiusa = C.uguali(My, Nx, ['x', 'y']);
    R.passo(t('Forma', 'Form'), 'ω = ' + H(M) + ' dx + ' + H(N) + ' dy');
    R.passo(t('È chiusa?', 'Is it closed?'), '∂M/∂y = ' + H(My) + ' , ∂N/∂x = ' + H(Nx) + ' ⇒ ' + (chiusa ? t('<b>chiusa</b>. Su un dominio semplicemente connesso (per esempio un rettangolo o tutto ℝ²) è anche esatta.', '<b>closed</b>. On a simply connected domain (e.g. a rectangle or all of ℝ²) it is also exact.') : t('<b>non chiusa</b>, quindi non esatta: l’integrale dipende dal cammino.', '<b>not closed</b>, hence not exact: the integral depends on the path.')));
    var U = null;
    if (chiusa) { var r = F.calcolo.multi.esatto(M, N, 'x', 'y'); U = r.potenziale; if (U) R.passo(t('Potenziale', 'Potential'), t('U = ∫ M dx + g(y), con g fissata da ∂U/∂y = N: ', 'U = ∫ M dx + g(y), with g fixed by ∂U/∂y = N: ') + 'U(x, y) = <b>' + H(U) + '</b> + c'); }
    var out = { passi: R.passi, chiusa: chiusa, potenziale: U, risultato: chiusa ? t('chiusa', 'closed') : t('non chiusa', 'not closed') };
    if (d.xt) {
      var xt = C.leggi(d.xt), yt = C.leggi(d.yt), ta = C.valuta(C.leggi(String(d.t0))), tb = C.valuta(C.leggi(String(d.t1)));
      var integ = C.semplifica(B.add(B.mul(C.sostituisci(C.sostituisci(M, 'x', xt), 'y', yt), C.deriva(xt, 't')), B.mul(C.sostituisci(C.sostituisci(N, 'x', xt), 'y', yt), C.deriva(yt, 't'))));
      R.passo(t('Integrale curvilineo', 'Line integral'), t('Lungo γ(t) = (', 'Along γ(t) = (') + H(xt) + ', ' + H(yt) + '), t ∈ [' + bello(ta) + ', ' + bello(tb) + ']: ∫<sub>γ</sub> ω = ∫ [M(γ)x′(t) + N(γ)y′(t)] dt = ∫ ' + H(integ) + ' dt');
      var P = C.integra(integ, 't'), v;
      if (P) { var FF = C.funzione(P, 't'); v = FF(tb) - FF(ta); } else v = C.integraleDefinito(C.funzione(integ, 't'), ta, tb, 1e-11).valore;
      var extra = '';
      if (U) { var UU = f2(U), A0 = [C.valuta(xt, { t: ta }), C.valuta(yt, { t: ta })], B0 = [C.valuta(xt, { t: tb }), C.valuta(yt, { t: tb })]; extra = '<br>' + t('Con il potenziale: U(fine) − U(inizio) = ', 'With the potential: U(end) − U(start) = ') + bello(belloNum(UU(B0[0], B0[1]) - UU(A0[0], A0[1]))) + t(' — stesso valore: per una forma esatta conta solo dove si parte e dove si arriva.', ' — same value: for an exact form only start and end points matter.'); }
      R.passo(t('Valore', 'Value'), '<b>' + bello(belloNum(v)) + '</b>' + extra);
      out.integrale = v; out.risultato += '; ∫ = ' + bello(belloNum(v));
    }
    return out;
  }

  /* ════════════════════════════════════════════════════════════════════
     12. EQUAZIONI DIFFERENZIALI
     ════════════════════════════════════════════════════════════════════ */
  function togliAbs(e) { if (e.t === 'f' && e.n === 'abs') return togliAbs(e.a[0]); if (!e.a) return e; return C.semplifica({ t: e.t, n: e.n, a: e.a.map(togliAbs) }); }
  function lineare1(d) {
    var R = nuovo(), a = C.leggi(d.a), b = C.leggi(d.b);
    R.passo(t('Equazione', 'Equation'), "y′ + " + H(a) + '·y = ' + H(b) + t(' — lineare del primo ordine', ' — first-order linear'));
    var A = C.integra(a, 'x'); if (!A) { R.passo(t('Primitiva di a(x)', 'Antiderivative of a(x)'), t('non elementare: la formula resta valida ma si calcola numericamente', 'not elementary: the formula still holds but must be evaluated numerically')); return { passi: R.passi, risultato: null }; }
    var conAbs = /\|/.test(S(A));
    A = togliAbs(A);
    if (conAbs) R.passo(t('Nota sul valore assoluto', 'Note on the absolute value'), t('Si lavora su un intervallo dove l’argomento è positivo (quello che contiene il dato iniziale), così |u| = u.', 'Work on an interval where the argument is positive (the one containing the initial datum), so |u| = u.'));
    var mu = C.semplifica(B.fn('exp', A)), integ = C.semplifica(B.mul(b, mu)), P = C.integra(integ, 'x');
    R.passo(t('Formula risolutiva', 'Solution formula'), 'A(x) = ∫a(x)dx = ' + H(A) + ' ; ' + t('fattore integrante ', 'integrating factor ') + 'e<sup>A(x)</sup> = ' + H(mu) + '<br>y(x) = e<sup>−A(x)</sup>·( ∫ b(x)e<sup>A(x)</sup> dx + c )');
    if (!P) { R.passo(t('Integrale', 'Integral'), '∫ ' + H(integ) + ' dx ' + t('non è elementare.', 'is not elementary.')); return { passi: R.passi, risultato: null }; }
    var gen = C.espandi(C.semplifica(B.div(B.add(P, C.simbolo('c')), mu)));
    R.passo(t('Integrale generale', 'General solution'), '∫ ' + H(integ) + ' dx = ' + H(P) + '<br>y(x) = <b>' + H(gen) + '</b>');
    var out = { passi: R.passi, generale: gen, risultato: S(gen) };
    if (d.x0 != null) {
      var x0 = C.valuta(C.leggi(String(d.x0))), y0 = C.valuta(C.leggi(String(d.y0))), amb = { x: x0, c: 0 }, base = C.valuta(gen, amb); amb.c = 1; var coef = C.valuta(gen, amb) - base, c = belloNum((y0 - base) / coef);
      var part = C.espandi(C.semplifica(C.sostituisci(gen, 'c', nodo(c))));
      R.passo(t('Problema di Cauchy', 'Cauchy problem'), 'y(' + bello(x0) + ') = ' + bello(y0) + ' ⇒ c = ' + bello(c) + ' ⇒ y(x) = <b>' + H(part) + '</b>');
      out.particolare = part; out.risultato = S(part);
    }
    return out;
  }
  function separabile(d) {
    var R = nuovo(), g = C.leggi(d.g), h = C.leggi(d.h);
    R.passo(t('Equazione', 'Equation'), "y′ = " + H(g) + ' · ' + H(h) + t(' — a variabili separabili', ' — separable'));
    var ch = C.coeffPolinomio(h, 'y'), zeri = ch && ch.length > 1 ? C.radiciPolinomio(ch).filter(function (z) { return !z.im; }).map(function (z) { return belloNum(z.re); }) : C.zeri(C.funzione(h, 'y'), -20, 20, 8000).map(belloNum);
    R.passo(t('Soluzioni costanti', 'Constant solutions'), t('Dove h(y) = 0 la funzione costante è soluzione: ', 'Where h(y) = 0 the constant function is a solution: ') + (zeri.length ? zeri.map(function (z) { return 'y = ' + bello(z); }).join(', ') : t('nessuna', 'none')));
    var Hy = C.integra(C.semplifica(B.div(C.Q(1), h)), 'y'), Gx = C.integra(g, 'x');
    if (!Hy || !Gx) { R.passo(t('Separazione', 'Separation'), t('Una delle due primitive non è elementare.', 'One of the antiderivatives is not elementary.')); return { passi: R.passi, risultato: null }; }
    R.passo(t('Separazione delle variabili', 'Separating the variables'), '∫ dy/h(y) = ∫ g(x) dx ⇒ ' + H(Hy) + ' = ' + H(Gx) + ' + c');
    var out = { passi: R.passi, implicita: [Hy, Gx], risultato: S(Hy) + ' = ' + S(Gx) + ' + c' };
    var c = null;
    if (d.x0 != null) {
      var x0 = C.valuta(C.leggi(String(d.x0))), y0 = C.valuta(C.leggi(String(d.y0)));
      c = belloNum(C.valuta(Hy, { y: y0 }) - C.valuta(Gx, { x: x0 }));
      R.passo(t('Problema di Cauchy', 'Cauchy problem'), 'y(' + bello(x0) + ') = ' + bello(y0) + ' ⇒ c = ' + bello(c));
    }
    /* forma esplicita nei casi tipici */
    var sH = S(Hy), cc = c === null ? C.simbolo('c') : C.num(c), Gc = C.semplifica(B.add(Gx, cc)), espl = null;
    var m;
    if (/^ln\(\|y\|\)$/.test(sH)) {
      if (c !== null) { var x0s = C.valuta(C.leggi(String(d.x0))), Kc = C.valuta(C.leggi(String(d.y0))) / Math.exp(C.valuta(Gx, { x: x0s })); espl = C.semplifica(B.mul(nodo(Kc), B.fn('exp', Gx))); }
      else espl = C.semplifica(B.mul(C.simbolo('K'), B.fn('exp', Gx)));
    }
    else if ((m = /^(−?\d*\/?\d*)·?ln\(\|y\|\)$/.exec(sH))) espl = C.semplifica(B.fn('exp', B.div(Gc, C.leggi(m[1].replace('−', '-') || '1'))));
    else if (sH === '−1/y') espl = C.semplifica(B.div(C.Q(-1), Gc));
    else if (sH === 'atan(y)') espl = C.semplifica(B.fn('tan', Gc));
    else if (sH === 'y²/2') espl = C.semplifica(B.pow(B.mul(C.Q(2), Gc), C.Q(1, 2)));
    else if (sH === 'y') espl = Gc;
    else if (/^−?1\/\(2y²\)$/.test(sH) && sH.charAt(0) === '−') espl = C.semplifica(B.pow(B.mul(C.Q(-2), Gc), C.Q(-1, 2)));
    if (espl) {
      if (c !== null && d.y0 != null) { var yv = C.valuta(espl, { x: C.valuta(C.leggi(String(d.x0))) }); if (Math.abs(yv - C.valuta(C.leggi(String(d.y0)))) > 1e-8) { espl = C.semplifica(B.mul(C.Q(-1), espl)); } }
      R.passo(t('Forma esplicita', 'Explicit form'), 'y(x) = <b>' + H(espl) + '</b>' + (/ln\(\|y\|\)/.test(sH) && c === null ? t(' (con la costante positiva o negativa: e^c diventa una costante K ≠ 0 qualsiasi)', ' (with a positive or negative constant: e^c becomes any constant K ≠ 0)') : ''));
      out.esplicita = espl; out.risultato = 'y = ' + S(espl);
    }
    return out;
  }
  function analizzaForzante(f) {
    /* termini del tipo  polinomio · e^(αx) · cos/sin(βx) */
    var ex = C.espandi(C.leggi(f)), termini = ex.t === '+' ? ex.a : [ex], gruppi = {};
    termini.forEach(function (tm) {
      var fatt = tm.t === '*' ? tm.a : [tm], al = 0, be = 0, gr = 0;
      fatt.forEach(function (q) {
        if (q.t === 'f' && q.n === 'exp') al += C.valuta(C.deriva(q.a[0], 'x'));
        else if (q.t === 'f' && (q.n === 'sin' || q.n === 'cos')) be = Math.abs(C.valuta(C.deriva(q.a[0], 'x')));
        else if (q.t === 's' && q.n === 'x') gr += 1;
        else if (q.t === '^' && q.a[0].t === 's' && q.a[0].n === 'x') gr += C.valuta(q.a[1]);
      });
      var k = al + '|' + be; if (!gruppi[k]) gruppi[k] = { al: al, be: be, gr: 0 }; gruppi[k].gr = Math.max(gruppi[k].gr, gr);
    });
    return Object.keys(gruppi).map(function (k) { return gruppi[k]; });
  }
  function edoTxt(q) {
    var nomi = ["y″", "y′", 'y'], out = '';
    q.forEach(function (c, i) { if (!c) return; var a = Math.abs(c), segno = c < 0 ? (out ? ' − ' : '−') : (out ? ' + ' : ''); out += segno + (a === 1 ? '' : bello(a)) + nomi[i]; });
    return out || '0';
  }
  function secondoOrdine(d) {
    var R = nuovo(), a = d.a, b = d.b, c = d.c, f = d.f || '0', Df = b * b - 4 * a * c;
    R.passo(t('Equazione', 'Equation'), edoTxt([a, b, c]) + ' = ' + H(C.leggi(f)) + t(' — lineare del secondo ordine a coefficienti costanti', ' — second-order linear with constant coefficients'));
    R.passo(t('Equazione caratteristica', 'Characteristic equation'), bello(a) + 'λ² + ' + bello(b) + 'λ + ' + bello(c) + ' = 0 · Δ = ' + bello(Df));
    var y1, y2, radici;
    if (Df > 1e-12) { var r1 = belloNum((-b - Math.sqrt(Df)) / (2 * a)), r2 = belloNum((-b + Math.sqrt(Df)) / (2 * a)); radici = [[r1, 0], [r2, 0]]; y1 = 'e^((' + r1 + ')*x)'; y2 = 'e^((' + r2 + ')*x)'; R.passo(t('Radici reali distinte', 'Distinct real roots'), 'λ₁ = ' + bello(r1) + ', λ₂ = ' + bello(r2) + ' ⇒ y₀ = c₁e<sup>λ₁x</sup> + c₂e<sup>λ₂x</sup>'); }
    else if (Df > -1e-12) { var r = belloNum(-b / (2 * a)); radici = [[r, 0], [r, 0]]; y1 = 'e^((' + r + ')*x)'; y2 = 'x*e^((' + r + ')*x)'; R.passo(t('Radice doppia', 'Double root'), 'λ = ' + bello(r) + ' ⇒ y₀ = (c₁ + c₂x)e<sup>λx</sup>'); }
    else { var al = belloNum(-b / (2 * a)), be = Math.sqrt(-Df) / (2 * Math.abs(a)); radici = [[al, be], [al, -be]]; y1 = 'e^((' + al + ')*x)*cos((' + be + ')*x)'; y2 = 'e^((' + al + ')*x)*sin((' + be + ')*x)'; R.passo(t('Radici complesse coniugate', 'Complex conjugate roots'), 'λ = ' + bello(al) + ' ± ' + bello(be) + 'i ⇒ y₀ = e<sup>αx</sup>(c₁cos βx + c₂sin βx)'); }
    var Y1 = C.leggi(y1), Y2 = C.leggi(y2);
    R.passo(t('Integrale generale dell’omogenea', 'General solution of the homogeneous equation'), 'y₀(x) = c₁·' + H(Y1) + ' + c₂·' + H(Y2));
    /* soluzione particolare: metodo di somiglianza */
    var yp = C.Q(0);
    if (f.trim() !== '0') {
      var gr = analizzaForzante(f), testi = [], incognite = [], ans = [];
      gr.forEach(function (g, gi) {
        var molt = radici.filter(function (z) { return Math.abs(z[0] - g.al) < 1e-9 && Math.abs(Math.abs(z[1]) - g.be) < 1e-9; }).length;
        if (g.be) molt = Math.min(1, molt);
        var P = [], Q = [];
        for (var k = 0; k <= g.gr; k++) { var p = 'p' + gi + '_' + k; P.push(p + '*x^' + k); incognite.push(p); if (g.be) { var q = 'q' + gi + '_' + k; Q.push(q + '*x^' + k); incognite.push(q); } }
        var forma = (molt ? 'x^' + molt + '*' : '') + (g.al ? 'e^((' + g.al + ')*x)*' : '') + (g.be ? '((' + P.join('+') + ')*cos((' + g.be + ')*x) + (' + Q.join('+') + ')*sin((' + g.be + ')*x))' : '(' + P.join('+') + ')');
        ans.push(forma);
        testi.push(t('termine con α = ', 'term with α = ') + bello(g.al) + (g.be ? ', β = ' + bello(g.be) : '') + t(', grado ', ', degree ') + g.gr + (molt ? t('; α', '; α') + (g.be ? '+iβ' : '') + t(' è radice caratteristica di molteplicità ', ' is a characteristic root of multiplicity ') + molt + t(': si moltiplica per x', ': multiply by x') + (molt > 1 ? '^' + molt : '') : ''));
      });
      var Ya = C.leggi(ans.join(' + ')), Ly = C.semplifica(B.add(B.mul(C.num(a), C.deriva(C.deriva(Ya, 'x'), 'x')), B.mul(C.num(b), C.deriva(Ya, 'x')), B.mul(C.num(c), Ya)));
      R.passo(t('Metodo di somiglianza', 'Method of undetermined coefficients'), testi.join('<br>') + '<br>' + t('Si cerca ', 'Try ') + 'y<sub>p</sub> = ' + H(Ya));
      var Lf = C.compila(Ly), ff = C.funzione(C.leggi(f), 'x'), righe = [], ys = [];
      for (var i = 0; i < incognite.length + 8; i++) {
        var xv = -1.3 + 0.37 * i, amb0 = { x: xv }; incognite.forEach(function (u) { amb0[u] = 0; });
        var r0 = Lf(amb0); righe.push(incognite.map(function (u) { var am = Object.assign({}, amb0); am[u] = 1; return Lf(am) - r0; })); ys.push(ff(xv) - r0);
      }
      var sol = minimiQuadrati(righe, ys);
      if (sol) {
        var sostituzioni = Ya; incognite.forEach(function (u, k) { sostituzioni = C.sostituisci(sostituzioni, u, nodo(sol[k])); });
        yp = C.semplifica(sostituzioni);
        R.passo(t('Coefficienti', 'Coefficients'), t('Sostituendo y_p nell’equazione e uguagliando i coefficienti: ', 'Substituting y_p into the equation and equating coefficients: ') + incognite.map(function (u, k) { return u.replace(/_/, '').replace(/(\d)/, '<sub>$1</sub>') + ' = ' + bello(belloNum(sol[k])); }).join(', ') + '<br>y<sub>p</sub>(x) = <b>' + H(yp) + '</b>');
      }
    }
    var gen = C.semplifica(B.add(B.mul(C.simbolo('c1'), Y1), B.mul(C.simbolo('c2'), Y2), yp));
    R.passo(t('Integrale generale', 'General solution'), 'y(x) = y₀ + y<sub>p</sub> = <b>' + H(gen) + '</b>');
    var out = { passi: R.passi, generale: gen, particolare: yp, risultato: S(gen) };
    if (d.x0 != null) {
      var x0 = C.valuta(C.leggi(String(d.x0))), v0 = C.valuta(C.leggi(String(d.y0))), v1 = C.valuta(C.leggi(String(d.y1)));
      var fY1 = C.funzione(Y1, 'x'), fY2 = C.funzione(Y2, 'x'), dY1 = C.funzione(C.deriva(Y1, 'x'), 'x'), dY2 = C.funzione(C.deriva(Y2, 'x'), 'x'), fp = C.funzione(yp, 'x'), dp = C.funzione(C.deriva(yp, 'x'), 'x');
      var s = risolviLineare([[fY1(x0), fY2(x0)], [dY1(x0), dY2(x0)]], [v0 - fp(x0), v1 - dp(x0)]);
      var c1 = belloNum(s[0]), c2 = belloNum(s[1]), part = C.semplifica(C.sostituisci(C.sostituisci(gen, 'c1', nodo(c1)), 'c2', nodo(c2)));
      R.passo(t('Problema di Cauchy', 'Cauchy problem'), "y(" + bello(x0) + ') = ' + bello(v0) + ", y′(" + bello(x0) + ') = ' + bello(v1) + ' ⇒ ' + t('sistema in c₁, c₂: ', 'system in c₁, c₂: ') + 'c₁ = ' + bello(c1) + ', c₂ = ' + bello(c2) + '<br>y(x) = <b>' + H(part) + '</b>');
      out.cauchy = part; out.risultato = S(part);
    }
    return out;
  }

  /* ════════════════════════════════════════════════════════════════════
     13. AVANZATO E AVANZATISSIMO
     ════════════════════════════════════════════════════════════════════ */
  function autovalori(testo) {
    var R = nuovo(), LA = F.calcolo.lineare, A = LA.leggiMatrice(testo), K = A.campo, E = LA.autovalori(A.M, K);
    R.passo(t('Matrice', 'Matrix'), 'A = [ ' + A.M.map(function (r) { return r.map(K.str).join('  '); }).join(' ; ') + ' ]');
    var pol = E.pol.map(function (c, k) { return { c: K.val(c), k: k }; }).filter(function (q) { return Math.abs(q.c) > 1e-14; }).reverse().map(function (q, i) { var cs = bello(Math.abs(q.c)), mon = q.k === 0 ? '' : q.k === 1 ? 'λ' : 'λ' + '⁰¹²³⁴⁵⁶⁷⁸⁹'[q.k]; return (i ? (q.c < 0 ? ' − ' : ' + ') : (q.c < 0 ? '−' : '')) + (cs === '1' && q.k ? '' : cs) + mon; }).join('');
    R.passo(t('Polinomio caratteristico', 'Characteristic polynomial'), 'p(λ) = det(λI − A) = ' + esc(pol) + ' = 0');
    R.passo(t('Autovalori e autospazi', 'Eigenvalues and eigenspaces'), E.valori.map(function (d) { return 'λ = <b>' + (d.im ? bello(d.re) + ' ± ' + bello(Math.abs(d.im)) + 'i' : bello(d.re)) + '</b> (' + t('molteplicità algebrica ', 'algebraic multiplicity ') + d.molt + (d.vettori ? ', ' + t('geometrica ', 'geometric ') + d.vettori.length + '; ' + t('autovettori ', 'eigenvectors ') + d.vettori.map(function (v) { return '(' + v.join(', ') + ')'; }).join(', ') : '') + ')'; }).join('<br>'));
    var reali = E.valori.filter(function (d) { return !d.im; }), diag = !E.valori.some(function (d) { return d.im; }) && reali.every(function (d) { return d.vettori && d.vettori.length === d.molt; });
    R.passo(t('Diagonalizzabilità', 'Diagonalisability'), diag ? t('Per ogni autovalore molteplicità geometrica = algebrica: A = P D P⁻¹ con D diagonale degli autovalori e P con gli autovettori in colonna.', 'For every eigenvalue geometric = algebraic multiplicity: A = P D P⁻¹ with D the diagonal of eigenvalues and P the eigenvectors as columns.') + (E.simmetrica ? t(' A è simmetrica: P si può scegliere ortogonale (teorema spettrale).', ' A is symmetric: P can be chosen orthogonal (spectral theorem).') : '') : t('Non diagonalizzabile su ℝ (autovalori complessi o molteplicità geometrica minore).', 'Not diagonalisable over ℝ (complex eigenvalues or smaller geometric multiplicity).'));
    return { passi: R.passi, risultato: E.valori.map(function (d) { return d.im ? bello(d.re) + '±' + bello(Math.abs(d.im)) + 'i' : bello(d.re) + (d.molt > 1 ? '(×' + d.molt + ')' : ''); }).join(', '), valori: E.valori, diagonalizzabile: diag };
  }
  function lin2(p, q) { var o = ''; [[p, 'x'], [q, 'y']].forEach(function (z) { if (!z[0]) return; var a = Math.abs(z[0]); o += (z[0] < 0 ? (o ? ' − ' : '−') : (o ? ' + ' : '')) + (a === 1 ? '' : bello(a)) + z[1]; }); return o || '0'; }
  function sistemaEDO(d) {
    var R = nuovo(), a = +d.a, b = +d.b, c = +d.c, e = +d.d, x0 = +d.x0, y0 = +d.y0, tr = a + e, det = a * e - b * c, D = tr * tr - 4 * det;
    R.passo(t('Sistema', 'System'), "x′ = " + lin2(a, b) + " ; y′ = " + lin2(c, e) + ' — ' + t('in forma matriciale X′ = AX', 'in matrix form X′ = AX'));
    R.passo(t('Autovalori di A', 'Eigenvalues of A'), 'λ² − (tr A)λ + det A = 0: tr = ' + bello(tr) + ', det = ' + bello(det) + ', Δ = ' + bello(D));
    var sx, sy, tipo;
    function vett(l) { return Math.abs(b) > 1e-12 ? [b, l - a] : Math.abs(c) > 1e-12 ? [l - e, c] : (Math.abs(l - a) < 1e-12 ? [1, 0] : [0, 1]); }
    if (D > 1e-12) {
      var l1 = belloNum((tr - Math.sqrt(D)) / 2), l2 = belloNum((tr + Math.sqrt(D)) / 2), v1 = vett(l1), v2 = vett(l2);
      var s = risolviLineare([[v1[0], v2[0]], [v1[1], v2[1]]], [x0, y0]), c1 = belloNum(s[0]), c2 = belloNum(s[1]);
      R.passo(t('Autovalori reali distinti', 'Distinct real eigenvalues'), 'λ₁ = ' + bello(l1) + ', v₁ = (' + bello(v1[0]) + ', ' + bello(v1[1]) + ') ; λ₂ = ' + bello(l2) + ', v₂ = (' + bello(v2[0]) + ', ' + bello(v2[1]) + ')<br>X(t) = c₁v₁e<sup>λ₁t</sup> + c₂v₂e<sup>λ₂t</sup>; ' + t('dal dato iniziale', 'from the initial datum') + ' c₁ = ' + bello(c1) + ', c₂ = ' + bello(c2));
      sx = '(' + c1 * v1[0] + ')*e^((' + l1 + ')*t) + (' + c2 * v2[0] + ')*e^((' + l2 + ')*t)'; sy = '(' + c1 * v1[1] + ')*e^((' + l1 + ')*t) + (' + c2 * v2[1] + ')*e^((' + l2 + ')*t)';
      tipo = l1 * l2 < 0 ? t('sella', 'saddle') : l2 < 0 ? t('nodo stabile', 'stable node') : t('nodo instabile', 'unstable node');
    } else if (D < -1e-12) {
      var al = belloNum(tr / 2), be = Math.sqrt(-D) / 2;
      /* soluzione reale: X = e^(αt)[ cos βt·X0 + sin βt·(A − αI)X0/β ] */
      var w = [((a - al) * x0 + b * y0) / be, (c * x0 + (e - al) * y0) / be];
      R.passo(t('Autovalori complessi', 'Complex eigenvalues'), 'λ = ' + bello(al) + ' ± ' + bello(be) + 'i ⇒ X(t) = e<sup>αt</sup>[cos(βt)·X₀ + sin(βt)·(A − αI)X₀/β]');
      sx = 'e^((' + al + ')*t)*((' + x0 + ')*cos((' + be + ')*t) + (' + belloNum(w[0]) + ')*sin((' + be + ')*t))'; sy = 'e^((' + al + ')*t)*((' + y0 + ')*cos((' + be + ')*t) + (' + belloNum(w[1]) + ')*sin((' + be + ')*t))';
      tipo = Math.abs(al) < 1e-12 ? t('centro', 'centre') : al < 0 ? t('fuoco stabile', 'stable focus') : t('fuoco instabile', 'unstable focus');
    } else {
      var l = belloNum(tr / 2), N = [[a - l, b], [c, e - l]], NX = [N[0][0] * x0 + N[0][1] * y0, N[1][0] * x0 + N[1][1] * y0];
      R.passo(t('Autovalore doppio', 'Double eigenvalue'), 'λ = ' + bello(l) + ' ⇒ X(t) = e<sup>λt</sup>[X₀ + t(A − λI)X₀] ' + t('(perché (A − λI)² = 0)', '(because (A − λI)² = 0)'));
      sx = 'e^((' + l + ')*t)*((' + x0 + ') + (' + belloNum(NX[0]) + ')*t)'; sy = 'e^((' + l + ')*t)*((' + y0 + ') + (' + belloNum(NX[1]) + ')*t)';
      tipo = l < 0 ? t('nodo stabile degenere', 'stable degenerate node') : t('nodo instabile degenere', 'unstable degenerate node');
    }
    var X = C.espandi(C.semplifica(C.leggi(sx))), Y = C.espandi(C.semplifica(C.leggi(sy)));
    R.passo(t('Soluzione del problema di Cauchy', 'Solution of the Cauchy problem'), 'x(t) = <b>' + H(X) + '</b><br>y(t) = <b>' + H(Y) + '</b>');
    R.passo(t('Origine', 'Origin'), t('Punto di equilibrio di tipo ', 'Equilibrium of type ') + '<b>' + tipo + '</b>');
    return { passi: R.passi, risultato: 'x = ' + S(X) + ' ; y = ' + S(Y), x: X, y: Y, tipo: tipo };
  }
  function fourier(testo, N) {
    var R = nuovo(), e = C.leggi(testo), x = variabile(e), f = C.funzione(e, x); N = N || 5;
    R.passo(t('Coefficienti su [−π, π]', 'Coefficients on [−π, π]'), 'a₀ = (1/π)∫f, aₙ = (1/π)∫f cos(nx) dx, bₙ = (1/π)∫f sin(nx) dx; f ~ a₀/2 + Σ(aₙcos nx + bₙsin nx)');
    var pari = [0.4, 1.1, 2.3].every(function (v) { return Math.abs(f(v) - f(-v)) < 1e-9; }), disp = [0.4, 1.1, 2.3].every(function (v) { return Math.abs(f(v) + f(-v)) < 1e-9; });
    if (pari) R.passo(t('Simmetria', 'Symmetry'), t('f pari: tutti i bₙ = 0 (serie di soli coseni).', 'f even: all bₙ = 0 (cosine series).'));
    if (disp) R.passo(t('Simmetria', 'Symmetry'), t('f dispari: tutti gli aₙ = 0 (serie di soli seni).', 'f odd: all aₙ = 0 (sine series).'));
    /* 17 pezzi di uguale ampiezza: i punti di Simpson non cadono sugli zeri di sin(nx), cos(nx) */
    function I(g) { var s = 0, m = 17; for (var k = 0; k < m; k++) s += C.integraleDefinito(g, -Math.PI + 2 * Math.PI * k / m, -Math.PI + 2 * Math.PI * (k + 1) / m, 1e-12).valore; return s / Math.PI; }
    var a = [], b = [], righe = [];
    for (var n = 0; n <= N; n++) { var an = disp ? 0 : I(function (v) { return f(v) * Math.cos(n * v); }), bn = pari || !n ? 0 : I(function (v) { return f(v) * Math.sin(n * v); }); a.push(belloNum(an)); b.push(belloNum(bn)); righe.push('<tr><td>' + n + '</td><td class="bsiFX-num">' + bello(a[n]) + '</td><td class="bsiFX-num">' + (n ? bello(b[n]) : '—') + '</td></tr>'); }
    R.passo(t('Coefficienti', 'Coefficients'), '<table class="bsiFX-tab" style="width:auto"><tr><th>n</th><th>aₙ</th><th>bₙ</th></tr>' + righe.join('') + '</table>');
    /* forma chiusa dei coefficienti, quando si riconosce */
    var tentativo = [];
    [['bn', b], ['an', a]].forEach(function (q) { var arr = q[1]; if (arr.slice(1).every(function (v) { return Math.abs(v) < 1e-12; })) return; var k = [1, 2, 3, 4].map(function (n) { return arr[n] * n; }), k2 = [1, 2, 3, 4].map(function (n) { return arr[n] * n * n; }); if (k.every(function (v, i) { return Math.abs(Math.abs(v) - Math.abs(k[0])) < 1e-8 || Math.abs(v) < 1e-10; })) tentativo.push(q[0].replace('n', 'ₙ') + ' ∝ 1/n (|' + q[0].replace('n', 'ₙ') + '·n| = ' + bello(Math.abs(k[0]) || Math.abs(k[1])) + ')'); else if (k2.every(function (v) { return Math.abs(Math.abs(v) - Math.abs(k2[0])) < 1e-8 || Math.abs(v) < 1e-10; })) tentativo.push(q[0].replace('n', 'ₙ') + ' ∝ 1/n² (|' + q[0].replace('n', 'ₙ') + '·n²| = ' + bello(Math.abs(k2[0]) || Math.abs(k2[1])) + ')'); });
    if (tentativo.length) R.passo(t('Andamento dei coefficienti', 'Coefficient behaviour'), tentativo.join('<br>') + '<br>' + t('Più la funzione è liscia, più in fretta calano (1/n se ha salti, 1/n² se è continua con derivata a salti).', 'The smoother the function, the faster they fall (1/n with jumps, 1/n² if continuous with a jumping derivative).'));
    var termini = []; if (Math.abs(a[0]) > 1e-12) termini.push(bello(a[0] / 2));
    var coefTxt = function (v) { var bv = bello(v); return bv === '1' ? '' : bv === '−1' ? '−' : bv + '·'; };
    for (n = 1; n <= N; n++) { if (Math.abs(a[n]) > 1e-12) termini.push(coefTxt(a[n]) + 'cos(' + (n > 1 ? n : '') + 'x)'); if (Math.abs(b[n]) > 1e-12) termini.push(coefTxt(b[n]) + 'sin(' + (n > 1 ? n : '') + 'x)'); }
    var serie = termini.join(' + ').replace(/\+ −/g, '− ') + ' + …';
    R.passo(t('Serie', 'Series'), 'f(x) ~ <b>' + esc(serie) + '</b><br>' + t('Converge a f nei punti di continuità e alla media dei limiti destro e sinistro nei salti (Dirichlet).', 'It converges to f at points of continuity and to the mean of the one-sided limits at jumps (Dirichlet).'));
    return { passi: R.passi, risultato: serie, a: a, b: b };
  }
  function laplace(testo) {
    var R = nuovo(), e = C.leggi(testo), tv = variabile(e, 't');
    R.passo(t('Definizione', 'Definition'), 'ℒ{f}(s) = ∫₀^∞ f(' + tv + ')e<sup>−s' + tv + '</sup> d' + tv + t(' (per s abbastanza grande perché l’integrale converga)', ' (for s large enough for the integral to converge)'));
    var integ = C.semplifica(B.mul(e, B.fn('exp', B.mul(C.Q(-1), C.simbolo('s'), C.simbolo(tv))))), G = C.integra(integ, tv), Fs = null;
    if (G) {
      var amb = function (sv, tt) { var o = { s: sv }; o[tv] = tt; return o; };
      var inf = Math.abs(C.valuta(G, amb(7, 60))) < 1e-9;
      if (inf) {
        Fs = C.espandi(C.semplifica(B.mul(C.Q(-1), C.sostituisci(G, tv, C.Q(0)))));
        R.passo(t('Primitiva', 'Antiderivative'), '∫ ' + H(integ) + ' d' + tv + ' = ' + H(G) + t(' → 0 per ', ' → 0 as ') + tv + ' → ∞ ' + t('(s > 0)', '(s > 0)'));
      }
    }
    if (Fs) {
      var ok = [2.5, 4].every(function (sv) { var g = C.funzione(C.sostituisci(integ, 's', C.num(sv)), tv); var num = C.integraleDefinito(function (u) { var v = u / (1 - u); return g(v) / ((1 - u) * (1 - u)); }, 0, 1 - 1e-12, 1e-11).valore; return Math.abs(num - C.valuta(Fs, { s: sv })) < 1e-6 * (1 + Math.abs(num)); });
      R.passo(t('Trasformata', 'Transform'), 'F(s) = 0 − G(0) = <b>' + H(Fs) + '</b>' + (ok ? ' ✓ <span style="color:#9fb1c6">(' + t('controllo numerico per s = 2,5 e 4', 'numerical check at s = 2.5 and 4') + ')</span>' : ''));
      R.passo(t('Tabella da ricordare', 'Table to remember'), 'ℒ{1} = 1/s · ℒ{tⁿ} = n!/sⁿ⁺¹ · ℒ{e^(at)} = 1/(s − a) · ℒ{sin ωt} = ω/(s² + ω²) · ℒ{cos ωt} = s/(s² + ω²) · ℒ{e^(at)f(t)} = F(s − a) · ℒ{f′} = sF − f(0)');
      return { passi: R.passi, risultato: S(Fs), F: Fs };
    }
    R.passo(t('Trasformata', 'Transform'), t('Non si trova in forma chiusa con i metodi del motore.', 'No closed form found with the engine’s methods.'));
    return { passi: R.passi, risultato: null };
  }
  function integraleTriplo(d) {
    var R = nuovo(), e = C.leggi(d.f), sist = d.tipo, lim = d.lim.split(';').map(function (q) { return q.split(',').map(function (v) { return C.valuta(C.leggi(v)); }); });
    var vars = sist === 'sferiche' ? ['ρ', 'φ', 'θ'] : sist === 'cilindriche' ? ['r', 'θ', 'z'] : ['x', 'y', 'z'], integ = e, jac = '1';
    if (sist === 'sferiche') { integ = C.sostituisci(C.sostituisci(C.sostituisci(e, 'x', C.leggi('ρ*sin(φ)*cos(θ)')), 'y', C.leggi('ρ*sin(φ)*sin(θ)')), 'z', C.leggi('ρ*cos(φ)')); jac = 'ρ²·sin φ'; integ = C.semplifica(B.mul(integ, C.leggi('ρ^2*sin(φ)'))); }
    if (sist === 'cilindriche') { integ = C.sostituisci(C.sostituisci(e, 'x', C.leggi('r*cos(θ)')), 'y', C.leggi('r*sin(θ)')); jac = 'r'; integ = C.semplifica(B.mul(integ, C.simbolo('r'))); }
    R.passo(t('Coordinate', 'Coordinates'), sist + t(': jacobiano ', ': Jacobian ') + jac + ' ⇒ ' + t('integrando ', 'integrand ') + H(integ));
    R.passo(t('Dominio', 'Domain'), vars.map(function (v, i) { return bello(lim[i][0]) + ' ≤ ' + v + ' ≤ ' + bello(lim[i][1]); }).join(', ') + t(' — estremi costanti: l’integrale si fa variabile per variabile (Fubini).', ' — constant limits: integrate one variable at a time (Fubini).'));
    var cur = integ, val = null, ok = true;
    for (var i = 0; i < 3 && ok; i++) {
      var P = C.integra(cur, vars[i]);
      if (!P) { ok = false; break; }
      cur = C.semplifica(B.sub(C.sostituisci(P, vars[i], C.num(lim[i][1])), C.sostituisci(P, vars[i], C.num(lim[i][0]))));
      R.passo(t('Integrazione in ', 'Integrating in ') + vars[i], '∫ … d' + vars[i] + ' = ' + H(cur));
    }
    if (ok) val = C.valuta(cur, {});
    if (val === null) {
      var fi = C.compila(integ), amb = {};
      val = C.integraleDefinito(function (u) { amb[vars[0]] = 0; return C.integraleDefinito(function (v) { return C.integraleDefinito(function (w) { amb[vars[0]] = w; amb[vars[1]] = v; amb[vars[2]] = u; return fi(amb); }, lim[0][0], lim[0][1], 1e-8).valore; }, lim[1][0], lim[1][1], 1e-8).valore; }, lim[2][0], lim[2][1], 1e-8).valore;
      R.passo(t('Calcolo numerico', 'Numerical evaluation'), '≈ ' + (+val.toPrecision(9)));
    }
    R.passo(t('Risultato', 'Result'), '<b>' + bello(belloNum(val)) + '</b>');
    return { passi: R.passi, risultato: bello(belloNum(val)), valore: val };
  }

  /* ════════════════════════════════════════════════════════════════════
     14. MAGISTRALE E DOTTORATO
     ════════════════════════════════════════════════════════════════════ */
  function residui(testo) {
    var R = nuovo(), e = C.leggi(testo), x = variabile(e), fr = frazione(e);
    if (!fr) throw new Error(t('serve una funzione razionale P(x)/Q(x)', 'a rational function P(x)/Q(x) is needed'));
    var cN = C.coeffPolinomio(fr.N, x), cD = C.coeffPolinomio(fr.D, x);
    if (!cN || !cD) throw new Error(t('numeratore e denominatore devono essere polinomi', 'numerator and denominator must be polynomials'));
    R.passo(t('Ipotesi', 'Hypotheses'), t('grado Q − grado P = ', 'deg Q − deg P = ') + (cD.length - cN.length) + (cD.length - cN.length >= 2 ? t(' ≥ 2: il contributo del semicerchio grande tende a 0 (lemma di Jordan/stima ML).', ' ≥ 2: the large semicircle contributes nothing (ML estimate).') : t(' < 2: l’integrale non converge.', ' < 2: the integral does not converge.')));
    var rad = C.radiciPolinomio(cD);
    if (rad.some(function (z) { return Math.abs(z.im) < 1e-9; })) throw new Error(t('Q ha zeri reali: l’integrale è improprio sull’asse (serve il valore principale)', 'Q has real zeros: the integral is singular on the axis (principal value needed)'));
    var sup = rad.filter(function (z) { return z.im > 0; });
    function polC(c, z) { var r = [0, 0]; for (var k = c.length - 1; k >= 0; k--) r = [r[0] * z[0] - r[1] * z[1] + c[k], r[0] * z[1] + r[1] * z[0]]; return r; }
    var dD = cD.slice(1).map(function (v, i) { return v * (i + 1); }), somma = [0, 0], righe = [];
    sup.forEach(function (z) {
      var zz = [z.re, z.im], num = polC(cN, zz), den = polC(dD, zz), d2 = den[0] * den[0] + den[1] * den[1], res = [(num[0] * den[0] + num[1] * den[1]) / d2, (num[1] * den[0] - num[0] * den[1]) / d2];
      somma = [somma[0] + res[0], somma[1] + res[1]];
      righe.push('z = ' + strZBello([z.re, z.im]) + ': Res = P(z)/Q′(z) = ' + strZBello([belloNum(res[0]), belloNum(res[1])]));
    });
    R.passo(t('Poli nel semipiano superiore e residui', 'Poles in the upper half-plane and residues'), righe.join('<br>') + '<br><span style="color:#9fb1c6">' + t('(poli semplici; per un polo multiplo si usa la derivata di ordine m − 1)', '(simple poles; for a multiple pole use the derivative of order m − 1)') + '</span>');
    var v = -2 * Math.PI * somma[1];
    var rp = bello(v / Math.PI), forma = /^[−\d√/()+ ]+$/.test(rp) && !/\./.test(rp) ? (rp === '1' ? 'π' : (/[+ ]/.test(rp) ? '(' + rp + ')' : rp) + '·π') : bello(v);
    R.passo(t('Teorema dei residui', 'Residue theorem'), '∫₋∞^∞ f dx = 2πi·Σ Res = <b>' + forma + '</b>');
    var f = C.funzione(e, x), num2 = C.integraleDefinito(function (u) { var w = u / (1 - u * u); return f(w) * (1 + u * u) / Math.pow(1 - u * u, 2); }, -1 + 1e-12, 1 - 1e-12, 1e-11).valore;
    R.passo(t('Controllo numerico', 'Numerical check'), (+num2.toPrecision(10)) + (Math.abs(num2 - v) < 1e-6 * (1 + Math.abs(v)) ? ' ✓' : ' ✗'));
    return { passi: R.passi, risultato: forma, valore: v };
  }
  function calore(d) {
    var R = nuovo(), e = C.leggi(d.f), L = C.valuta(C.leggi(String(d.L))), al = +d.alfa, x0 = +d.x, t0 = +d.t, N = 40, f = C.funzione(e, 'x');
    R.passo(t('Problema', 'Problem'), 'u_t = α u_xx, 0 < x < L, u(0, t) = u(L, t) = 0, u(x, 0) = ' + H(e) + ' (α = ' + bello(al) + ', L = ' + bello(L) + ')');
    R.passo(t('Separazione delle variabili', 'Separation of variables'), 'u = X(x)T(t) ⇒ X″ + λX = 0, X(0) = X(L) = 0 ⇒ λₙ = (nπ/L)², Xₙ = sin(nπx/L), Tₙ = e^(−αλₙt)');
    var b = [];
    for (var n = 1; n <= N; n++) { var bn = 2 / L * C.integraleDefinito(function (s) { return f(s) * Math.sin(n * Math.PI * s / L); }, 0, L, 1e-11).valore; b.push(belloNum(bn)); }
    R.passo(t('Coefficienti dal dato iniziale', 'Coefficients from the initial datum'), 'bₙ = (2/L)∫₀ᴸ f(x) sin(nπx/L) dx: ' + b.slice(0, 5).map(function (v, i) { return 'b' + '₁₂₃₄₅'[i] + ' = ' + bello(v); }).join(', ') + ', …');
    var u = 0; b.forEach(function (bn, i) { var k = (i + 1) * Math.PI / L; u += bn * Math.sin(k * x0) * Math.exp(-al * k * k * t0); });
    R.passo(t('Soluzione', 'Solution'), 'u(x, t) = Σ bₙ e^(−α(nπ/L)²t) sin(nπx/L) ⇒ u(' + bello(x0) + ', ' + bello(t0) + ') = <b>' + (+u.toPrecision(8)) + '</b>' + t(' (40 termini). I modi alti si smorzano in fretta: a tempi lunghi resta il primo.', ' (40 terms). High modes decay fast: at long times the first remains.'));
    return { passi: R.passi, risultato: String(+u.toPrecision(8)), valore: u, b: b };
  }

  var RISOLUTORI = {
    complessi: complessi, dominio: dominio, limite: limite, studio: studio, integraleIndefinito: integraleIndefinito, integraleDefinito: integraleDefinito,
    taylor: taylor, serieNumerica: serieNumerica, seriePotenze: seriePotenze, dueVariabili: dueVariabili, maxMinCompatto: maxMinCompatto,
    integraleDoppio: integraleDoppio, formeDifferenziali: formeDifferenziali, lineare1: lineare1, separabile: separabile, secondoOrdine: secondoOrdine,
    autovalori: autovalori, sistemaEDO: sistemaEDO, fourier: fourier, laplace: laplace, integraleTriplo: integraleTriplo, residui: residui, calore: calore
  };
  F.calcolo.risolutore = { lin2: lin2, edoTxt: edoTxt, RISOLUTORI: RISOLUTORI, bello: bello, belloNum: belloNum, condizioni: condizioni, fratti: fratti };
})(typeof window !== 'undefined' ? window : globalThis);
