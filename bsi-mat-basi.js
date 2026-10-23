/* ═══════════════════════════════════════════════════════════════════════════
   bsi-mat-basi.js — 🔢 le basi: cifre significative, potenze e logaritmi,
   equazioni, allenamento
   BioSpecInfo · © Samuele Pio Provenzano

   La matematica che serve dal primo giorno di laboratorio:

   · CIFRE SIGNIFICATIVE: quante sono in un numero scritto, come si
     arrotonda, e le due regole dei calcoli con le misure (nei prodotti
     conta il numero di cifre significative, nelle somme il numero di
     decimali);
   · POTENZE E LOGARITMI: le proprieta' con i numeri sotto gli occhi, e il
     pH (i decimali del pH sono le cifre significative della concentrazione);
   · EQUAZIONI: primo e secondo grado con i passaggi, polinomi di grado
     qualsiasi (radici complesse comprese, metodo di Durand-Kerner),
     equazioni fratte come quella dell'acido debole, e qualunque f(x) = 0
     numericamente;
   · ALLENAMENTO: esercizi generati a caso, con la correzione.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica, C = globale.BSIMatCAS;
  if (!F || !C) return;
  var t = F.t;
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function num(v, n) { return C.fmtNum(+v.toPrecision(n || 6)).replace(/^-/, '−'); }

  /* ── cifre significative ──────────────────────────────────────────────── */
  function cifre(testo) {
    var s = String(testo).trim().replace(',', '.').replace(/[−–]/g, '-').replace(/\s/g, '').replace(/[×x·*]10\^?/i, 'e');
    var m = /^[+-]?(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/.exec(s);
    if (!m || (!m[1] && !m[2])) return null;
    var intp = m[1] || '', frac = m[2], esp = +(m[3] || 0), haPunto = frac !== undefined;
    frac = frac || '';
    var tutte = intp + frac, primo = tutte.search(/[1-9]/);
    if (primo < 0) return { n: haPunto ? Math.max(1, frac.length) : 1, decimali: frac.length - esp, ambiguo: !haPunto && intp.length > 1, valore: 0 };
    var sig = tutte.slice(primo), ambiguo = false, n = sig.length;
    if (!haPunto) {
      var finali = /0*$/.exec(intp)[0].length;
      if (finali && sig.length > finali) { n = sig.length - finali; ambiguo = true; }
      else if (finali && sig.length === finali) n = 1;
    }
    return { n: n, decimali: frac.length - esp, ambiguo: ambiguo, valore: parseFloat(s) };
  }
  function arrotondaSig(v, n) {
    if (v === 0) return '0';
    var e = Math.floor(Math.log10(Math.abs(v))), r = +(v / Math.pow(10, e)).toFixed(n - 1);
    if (Math.abs(r) >= 10) { r /= 10; e += 1; r = +r.toFixed(n - 1); }
    var mant = r.toFixed(n - 1);
    if (e >= -3 && e <= 5) {
      var dec = Math.max(0, n - 1 - e), testo = (r * Math.pow(10, e)).toFixed(dec);
      return testo;
    }
    return mant + '·10' + apice(e);
  }
  function apice(n) { var S = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' }; return String(n).split('').map(function (c) { return S[c]; }).join(''); }
  function scientifica(v, n) {
    if (v === 0) return '0';
    var e = Math.floor(Math.log10(Math.abs(v))), m = v / Math.pow(10, e);
    if (+Math.abs(m).toFixed(n - 1) >= 10) { m /= 10; e++; }
    return m.toFixed(n - 1) + '·10' + apice(e);
  }
  function arrotondaDec(v, d) {
    if (d >= 0) return v.toFixed(d);
    var p = Math.pow(10, -d); return String(Math.round(v / p) * p);
  }
  /* il risultato di a op b con le regole delle misure */
  function operaMisure(a, op, b) {
    var A = cifre(a), B = cifre(b);
    if (!A || !B) return null;
    var v;
    if (op === '+') v = A.valore + B.valore; else if (op === '-') v = A.valore - B.valore;
    else if (op === '*') v = A.valore * B.valore; else v = A.valore / B.valore;
    if (op === '+' || op === '-') { var d = Math.min(A.decimali, B.decimali); return { grezzo: v, testo: arrotondaDec(v, d), regola: 'decimali', limite: d }; }
    var n = Math.min(A.n, B.n);
    return { grezzo: v, testo: arrotondaSig(v, n), regola: 'cifre', limite: n };
  }
  /* pH dalla concentrazione: tanti decimali quante sono le cifre significative di [H⁺] */
  function pH(conc) {
    var c = cifre(conc); if (!c || !(c.valore > 0)) return null;
    var v = -Math.log10(c.valore);
    return { valore: v, testo: v.toFixed(c.n), cifre: c.n };
  }

  function schedaCifre(div) {
    var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div', { 'class': 'bsiFX-pannello' });
    g.appendChild(pan); g.appendChild(dx); div.appendChild(g);
    pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('Scrivi una misura così come l’hai letta (es. 0,004050 — 1200 — 1,20e3):', 'Type a measurement as you read it (e.g. 0.004050 — 1200 — 1.20e3):') }));
    var inp = F.el('input', { type: 'text', value: '0,004050', 'aria-label': t('misura', 'measurement') }); pan.appendChild(inp);
    var out = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(out);
    var nSig = 3;
    F.cursore(pan, ['Arrotonda a n cifre', 'Round to n figures'], 1, 8, 1, nSig, function (v) { nSig = v; aggiorna(); });
    var arr = F.el('div', { 'class': 'bsiFX-eq' }); pan.appendChild(arr);
    function aggiorna() {
      var c = cifre(inp.value);
      if (!c) { out.innerHTML = '<span class="bsiFX-ko">' + t('Non è un numero leggibile.', 'Not a readable number.') + '</span>'; arr.textContent = ''; return; }
      out.innerHTML = t('Cifre significative: ', 'Significant figures: ') + '<b class="bsiFX-num">' + c.n + '</b>' + (c.ambiguo ? ' <span class="bsiFX-ko">(' + t('ambiguo: gli zeri finali di un intero senza virgola potrebbero esserlo o no; scrivi 1,20·10³ per dire 3 cifre', 'ambiguous: trailing zeros of an integer without a decimal point may or may not count; write 1.20·10³ to mean 3 figures') + ')</span>' : '') +
        '<br>' + t('Notazione scientifica: ', 'Scientific notation: ') + '<b>' + scientifica(c.valore, c.n) + '</b>' +
        '<br>' + t('Decimali: ', 'Decimal places: ') + Math.max(0, c.decimali);
      arr.textContent = c.valore + ' → ' + arrotondaSig(c.valore, nSig) + '   (' + scientifica(c.valore, nSig) + ')';
    }
    inp.addEventListener('input', aggiorna); aggiorna();
    pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', html: t('<b>Regole</b>: le cifre diverse da zero contano sempre; gli zeri in mezzo contano (1<b>0</b>5); gli zeri iniziali no (0,00<b>4</b>); gli zeri finali dopo la virgola sì (4,0<b>50</b>).', '<b>Rules</b>: non-zero digits always count; zeros in between count (1<b>0</b>5); leading zeros do not (0.00<b>4</b>); trailing zeros after the decimal point do (4.0<b>50</b>).') }));

    dx.appendChild(F.el('div', { 'class': 'bsiFX-nota', html: '<b>' + t('Calcoli con le misure', 'Calculations with measurements') + '</b>' }));
    var a = F.el('input', { type: 'text', value: '12,11', 'aria-label': 'a' }), b = F.el('input', { type: 'text', value: '0,0150', 'aria-label': 'b' });
    dx.appendChild(a);
    var op = F.scelta(dx, ['Operazione', 'Operation'], [['+', '+'], ['-', '−'], ['*', '×'], ['/', '÷']], '*', calcola);
    dx.appendChild(b);
    var ris = F.el('div', { 'class': 'bsiFX-eq' }), sp = F.el('div', { 'class': 'bsiFX-nota' });
    dx.appendChild(ris); dx.appendChild(sp);
    function calcola() {
      var r = operaMisure(a.value, op.value, b.value);
      if (!r) { ris.textContent = t('Inserisci due numeri.', 'Enter two numbers.'); sp.textContent = ''; return; }
      ris.textContent = t('calcolatrice: ', 'calculator: ') + (+r.grezzo.toPrecision(12)) + '   →   ' + t('risultato: ', 'result: ') + r.testo;
      sp.innerHTML = r.regola === 'cifre' ? t('Moltiplicazioni e divisioni: il risultato ha tante cifre significative quante il dato che ne ha <b>meno</b> (qui ', 'Multiplication and division: the result has as many significant figures as the datum with the <b>fewest</b> (here ') + r.limite + ').'
        : t('Somme e sottrazioni: il risultato ha tanti decimali quanti il dato che ne ha <b>meno</b> (qui ', 'Addition and subtraction: the result has as many decimal places as the datum with the <b>fewest</b> (here ') + r.limite + ').';
    }
    a.addEventListener('input', calcola); b.addEventListener('input', calcola); calcola();
  }

  function schedaLog(div) {
    var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div');
    g.appendChild(pan); g.appendChild(dx); div.appendChild(g);
    var a = 20, b = 5;
    var tab = F.el('div');
    F.cursore(pan, ['a', 'a'], 0.1, 1000, 0.1, a, function (v) { a = v; aggiorna(); });
    F.cursore(pan, ['b', 'b'], 0.1, 100, 0.1, b, function (v) { b = v; aggiorna(); });
    pan.appendChild(tab);
    pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', html: '<b>pH ↔ [H⁺]</b>' }));
    var conc = F.el('input', { type: 'text', value: '2,5e-4', 'aria-label': '[H⁺]' }); pan.appendChild(conc);
    var phOut = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(phOut);
    var c = F.tela(dx, 0.6);
    function aggiorna() {
      var L = Math.log10;
      tab.innerHTML = '<table class="bsiFX-tab">' +
        '<tr><td>log(a·b)</td><td class="bsiFX-num">' + num(L(a * b)) + '</td><td>= log a + log b</td><td class="bsiFX-num">' + num(L(a) + L(b)) + '</td></tr>' +
        '<tr><td>log(a/b)</td><td class="bsiFX-num">' + num(L(a / b)) + '</td><td>= log a − log b</td><td class="bsiFX-num">' + num(L(a) - L(b)) + '</td></tr>' +
        '<tr><td>log(aᵇ)</td><td class="bsiFX-num">' + num(b * L(a)) + '</td><td>= b·log a</td><td class="bsiFX-num">' + num(b * L(a)) + '</td></tr>' +
        '<tr><td>ln a</td><td class="bsiFX-num">' + num(Math.log(a)) + '</td><td>= 2,3026·log a</td><td class="bsiFX-num">' + num(Math.LN10 * L(a)) + '</td></tr>' +
        '<tr><td>10^(log a)</td><td class="bsiFX-num">' + num(Math.pow(10, L(a))) + '</td><td>= a</td><td class="bsiFX-num">' + num(a) + '</td></tr></table>';
      var xs = [], y1 = [], y2 = [];
      for (var i = 1; i <= 400; i++) { var x = i / 400 * 100; xs.push(x); y1.push(L(x)); y2.push(Math.log(x)); }
      F.grafico(c, { serie: [{ x: xs, y: y1, col: '#5eead4' }, { x: xs, y: y2, col: '#ffd24a' }], punti: [{ x: Math.min(a, 100), y: L(Math.min(a, 100)), col: '#5eead4', r: 5 }, { x: Math.min(b, 100), y: L(b), col: '#7c6fff', r: 5 }],
        xmin: 0, xmax: 100, ymin: -1, ymax: 5, xl: 'x', yl: 'y', legenda: [{ col: '#5eead4', etich: 'log₁₀ x' }, { col: '#ffd24a', etich: 'ln x' }] });
      var p = pH(conc.value);
      phOut.innerHTML = p ? 'pH = −log[H⁺] = <b class="bsiFX-num">' + p.testo + '</b> &nbsp; pOH = ' + (14 - p.valore).toFixed(p.cifre) + '<br>' + t('[H⁺] ha ', '[H⁺] has ') + p.cifre + t(' cifre significative → il pH ha ', ' significant figures → the pH has ') + p.cifre + t(' decimali (la parte intera dice solo la potenza di 10).', ' decimal places (the integer part only gives the power of 10).') : t('Scrivi una concentrazione positiva.', 'Type a positive concentration.');
    }
    conc.addEventListener('input', aggiorna);
    aggiorna(); F.alRidimensiona(aggiorna);
  }

  /* ── equazioni ────────────────────────────────────────────────────────── */
  function denominatori(e, acc) {
    acc = acc || [];
    if (e.t === '^' && e.a[1].t === 'n' && C.valuta(e.a[1]) < 0) acc.push(C.semplifica({ t: '^', a: [e.a[0], C.Q(-C.valuta(e.a[1]))] }));
    else if (e.t === '+' || e.t === '*') e.a.forEach(function (f) { denominatori(f, acc); });
    return acc;
  }
  function risolvi(testo) {
    var parti = String(testo).split('=');
    if (parti.length > 2) throw new Error(t('troppi segni =', 'too many = signs'));
    var lhs = C.leggi(parti[0]), rhs = parti.length === 2 && parti[1].trim() ? C.leggi(parti[1]) : C.Q(0);
    var e = C.semplifica(C.costruisci.sub(lhs, rhs));
    var vs = C.simboli(e), x = vs.indexOf('x') >= 0 ? 'x' : vs[0];
    if (!x) throw new Error(t('manca l’incognita', 'no unknown'));
    if (vs.length > 1) throw new Error(t('usa una sola incognita (trovate: ', 'use a single unknown (found: ') + vs.join(', ') + ')');
    var dens = denominatori(e), lavoro = e;
    if (dens.length) lavoro = C.espandi(C.costruisci.mul.apply(null, [e].concat(dens)));
    var coeff = C.coeffPolinomio(lavoro, x);
    var r = { x: x, espr: e, dens: dens, fratta: dens.length > 0 };
    if (coeff && coeff.length > 1 && coeff.every(isFinite)) {
      r.coeff = coeff; r.grado = coeff.length - 1;
      r.radici = C.radiciPolinomio(coeff).filter(function (z) {
        if (z.im) return true;
        return dens.every(function (d) { return Math.abs(C.valuta(d, (function () { var o = {}; o[x] = z.re; return o; })())) > 1e-12; });
      });
      if (r.grado === 2) {
        var a = coeff[2], b = coeff[1], c = coeff[0];
        r.delta = b * b - 4 * a * c;
      }
    } else {
      var f = C.funzione(e, x);
      r.numerica = true;
      var zs = C.zeri(f, -10, 10, 20000).concat(C.zeri(f, -1000, -10, 20000), C.zeri(f, 10, 1000, 20000));
      r.radici = zs.sort(function (p, q) { return p - q; }).map(function (v) { return { re: v, im: 0 }; });
    }
    return r;
  }

  function schedaEquazioni(div) {
    var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div');
    g.appendChild(pan); g.appendChild(dx); div.appendChild(g);
    pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('Scrivi un’equazione (anche fratta). Esempi:', 'Type an equation (fractions allowed). Examples:') }));
    var inp = F.el('input', { type: 'text', value: 'x^2 - 5x + 6 = 0', 'aria-label': t('equazione', 'equation') }); pan.appendChild(inp);
    var es = F.el('div', { style: 'display:flex;flex-wrap:wrap;gap:4px;margin:6px 0' }); pan.appendChild(es);
    [['3x + 7 = 1', t('primo grado', 'linear')], ['2x^2 + 3x - 2 = 0', t('secondo grado', 'quadratic')], ['x^2 + 2x + 5 = 0', t('Δ < 0', 'Δ < 0')], ['x^3 - 6x^2 + 11x - 6 = 0', t('terzo grado', 'cubic')],
     ['x^2/(0.1 - x) = 1.8e-5', t('acido acetico 0,1 M', '0.1 M acetic acid')], ['e^x = 3 - x', t('trascendente', 'transcendental')]].forEach(function (p) {
      var b = F.el('button', { type: 'button', 'class': 'bsiFX-bott', testo: p[1], onclick: function () { inp.value = p[0]; calcola(); } }); es.appendChild(b);
    });
    var out = F.el('div', { 'class': 'bsiFX-nota', style: 'font-size:.88rem' }); pan.appendChild(out);
    var c = F.tela(dx, 0.6);
    function calcola() {
      var r;
      try { r = risolvi(inp.value); } catch (err) { out.innerHTML = '<span class="bsiFX-ko">⚠ ' + esc(err.message) + '</span>'; return; }
      var h = '', x = r.x;
      if (r.fratta) h += t('Equazione fratta: si moltiplica per ', 'Fractional equation: multiply by ') + r.dens.map(function (d) { return '<b>' + esc(C.stampa(d)) + '</b>'; }).join(' · ') + t(' (che deve restare ≠ 0) e si ottiene un polinomio.<br>', ' (which must stay ≠ 0) to get a polynomial.<br>');
      if (r.grado === 1) {
        var a1 = r.coeff[1], b1 = r.coeff[0];
        h += t('Primo grado: ', 'Linear: ') + num(a1) + x + (b1 >= 0 ? ' + ' : ' − ') + num(Math.abs(b1)) + ' = 0 → ' + x + ' = −(' + num(b1) + ')/' + num(a1) + ' = <b class="bsiFX-num">' + C.numeroBello(-b1 / a1) + '</b>';
      } else if (r.grado === 2) {
        var A = r.coeff[2], B = r.coeff[1], Cc = r.coeff[0], D = r.delta;
        h += t('Secondo grado: a = ', 'Quadratic: a = ') + C.numeroBello(A).replace(/^-/, '−') + ', b = ' + C.numeroBello(B).replace(/^-/, '−') + ', c = ' + C.numeroBello(Cc).replace(/^-/, '−') + '<br>Δ = b² − 4ac = <b class="bsiFX-num">' + C.numeroBello(D).replace(/^-/, '−') + '</b> → ' +
          (D > 1e-15 ? t('due soluzioni reali', 'two real solutions') : Math.abs(D) <= 1e-15 ? t('due soluzioni coincidenti', 'a double root') : t('nessuna soluzione reale, due complesse coniugate', 'no real solution, two complex conjugates')) +
          '<br>' + x + ' = (−b ± √Δ)/(2a) = (' + C.numeroBello(-B).replace(/^-/, '−') + ' ± √' + (D < 0 ? '(' + C.numeroBello(D).replace(/^-/, '−') + ')' : C.numeroBello(D)) + ')/' + C.numeroBello(2 * A).replace(/^-/, '−') + '<br>';
      } else if (r.grado > 2) {
        h += t('Polinomio di grado ', 'Polynomial of degree ') + r.grado + t(': radici con il metodo di Durand-Kerner (tutte, anche complesse).<br>', ': roots by the Durand-Kerner method (all of them, complex ones too).<br>');
      } else if (r.numerica) {
        h += t('Equazione non polinomiale: zeri cercati numericamente (bisezione) fra −1000 e 1000.<br>', 'Non-polynomial equation: zeros searched numerically (bisection) between −1000 and 1000.<br>');
      }
      if (!r.radici || !r.radici.length) h += '<br><b>' + t('Nessuna soluzione trovata.', 'No solution found.') + '</b>';
      else {
        h += '<table class="bsiFX-tab"><tr><th>' + x + '</th><th>' + t('valore', 'value') + '</th></tr>';
        r.radici.forEach(function (z, i) {
          var v = z.im ? num(z.re, 8) + (z.im > 0 ? ' + ' : ' − ') + num(Math.abs(z.im), 8) + 'i' : C.numeroBello(+z.re.toPrecision(12));
          h += '<tr><td>' + x + '<sub>' + (i + 1) + '</sub></td><td class="bsiFX-num">' + v + (r.fratta && !z.im && z.re > 0 ? ' ✓' : '') + '</td></tr>';
        });
        h += '</table>';
        if (r.fratta) h += '<div class="bsiFX-nota">' + t('In un problema di equilibrio ha senso chimico solo la radice positiva e minore della concentrazione iniziale (✓ = positiva).', 'In an equilibrium problem only the positive root smaller than the initial concentration makes chemical sense (✓ = positive).') + '</div>';
      }
      out.innerHTML = h;
      var f = C.funzione(r.espr, x), reali = (r.radici || []).filter(function (z) { return !z.im; }).map(function (z) { return z.re; });
      var lo = -5, hi = 5;
      if (reali.length) { var mn = Math.min.apply(null, reali), mx = Math.max.apply(null, reali), sp = Math.max(1e-3, (mx - mn) * 0.6, Math.abs(mx) * 0.5); lo = mn - sp; hi = mx + sp; }
      var xs = [], ys = [];
      for (var i = 0; i <= 600; i++) { var xv = lo + (hi - lo) * i / 600, yv = f(xv); xs.push(xv); ys.push(yv); }
      var fin = ys.filter(isFinite).map(Math.abs).sort(function (p, q) { return p - q; }), lim = fin.length ? fin[Math.floor(fin.length * 0.9)] * 1.3 + 1e-12 : 1;
      F.grafico(c, { serie: [{ x: xs, y: ys.map(function (v) { return Math.abs(v) > lim * 3 ? NaN : v; }), col: '#5eead4' }], punti: reali.map(function (v) { return { x: v, y: 0, col: '#ffd24a', r: 5 }; }),
        linee: [{ y: 0, col: '#8494a8' }], ymin: -lim, ymax: lim, xl: x, yl: t('primo membro − secondo', 'left side − right side') });
    }
    inp.addEventListener('change', calcola);
    F.bottone(pan, ['Risolvi', 'Solve'], calcola);
    calcola(); F.alRidimensiona(calcola);
  }

  /* ── allenamento ──────────────────────────────────────────────────────── */
  function casuale(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  var GENERATORI = {
    cifre: function () {
      var forme = ['0.00' + casuale(1, 9) + casuale(0, 9) + '0', casuale(1, 9) + '.' + casuale(0, 9) + '0' + casuale(1, 9), casuale(1, 9) + '0' + casuale(1, 9) + '.0', '0.' + casuale(1, 9) + casuale(0, 9) + '00'];
      var s = forme[casuale(0, forme.length - 1)].replace('.', ',');
      return { testo: t('Quante cifre significative ha ', 'How many significant figures does ') + s + t('?', ' have?'), risposta: String(cifre(s).n), tipo: 'intero', spiega: t('Zeri iniziali esclusi, zeri finali dopo la virgola inclusi: ', 'Leading zeros excluded, trailing zeros after the point included: ') + cifre(s).n };
    },
    scientifica: function () {
      var e = casuale(-6, 6), m = (casuale(100, 999) / 100), v = m * Math.pow(10, e);
      return { testo: t('Scrivi in notazione scientifica (es. 3.2e-4): ', 'Write in scientific notation (e.g. 3.2e-4): ') + (+v.toPrecision(3)).toLocaleString('it-IT', { maximumFractionDigits: 12 }), risposta: String(v), tipo: 'numero', spiega: scientifica(v, 3) };
    },
    ph: function () {
      var m = casuale(11, 99) / 10, e = -casuale(2, 11), c = m * Math.pow(10, e), p = -Math.log10(c);
      return { testo: t('Calcola il pH se [H⁺] = ', 'Compute the pH if [H⁺] = ') + m.toFixed(1).replace('.', ',') + '·10' + apice(e) + ' M', risposta: String(p), tipo: 'numero', tol: 0.006, spiega: 'pH = −log(' + m.toFixed(1) + '·10' + apice(e) + ') = ' + p.toFixed(2) };
    },
    logaritmo: function () {
      var k = casuale(-4, 6), tipo = casuale(0, 2), testo, r;
      if (tipo === 0) { testo = 'log(10' + apice(k) + ') = ?'; r = k; }
      else if (tipo === 1) { var a = casuale(2, 9), b = casuale(2, 9); testo = 'log(' + a + ') + log(' + b + ') = log(?)'; r = a * b; }
      else { var n = casuale(2, 5); testo = 'ln(e' + apice(n) + ') = ?'; r = n; }
      return { testo: testo, risposta: String(r), tipo: 'numero', spiega: String(r) };
    },
    secondo: function () {
      var r1 = casuale(-6, 6), r2 = casuale(-6, 6), a = casuale(1, 3), b = -a * (r1 + r2), c = a * r1 * r2;
      var eq = (a === 1 ? '' : a) + 'x²' + (b ? (b > 0 ? ' + ' : ' − ') + (Math.abs(b) === 1 ? '' : Math.abs(b)) + 'x' : '') + (c ? (c > 0 ? ' + ' : ' − ') + Math.abs(c) : '') + ' = 0';
      return { testo: t('Risolvi ', 'Solve ') + eq + t(' (scrivi le due soluzioni separate da ;)', ' (type both solutions separated by ;)'), risposta: Math.min(r1, r2) + ';' + Math.max(r1, r2), tipo: 'coppia', spiega: 'x = ' + Math.min(r1, r2) + ', x = ' + Math.max(r1, r2) + ' (Δ = ' + (b * b - 4 * a * c) + ')' };
    },
    derivata: function () {
      var L = ['x^3 - 2x', 'sin(2x)', 'x*e^x', 'ln(x^2 + 1)', '1/x', 'sqrt(x)', 'cos(x)^2', 'e^(-3x)', 'x^2*ln(x)', 'tan(x)'];
      var s = L[casuale(0, L.length - 1)], e = C.leggi(s), d = C.deriva(e, 'x');
      return { testo: t('Deriva f(x) = ', 'Differentiate f(x) = ') + C.stampa(e), risposta: C.stampa(d), tipo: 'espressione', spiega: "f′(x) = " + C.stampa(d) };
    }
  };
  function correggi(es, risp) {
    risp = String(risp).trim().replace(/,/g, '.');
    if (!risp) return false;
    try {
      if (es.tipo === 'intero') return +risp === +es.risposta;
      if (es.tipo === 'numero') { var v = C.valuta(C.leggi(risp.replace(/·10\^?/, 'e'))), r = +es.risposta; return Math.abs(v - r) <= (es.tol || 1e-3 * Math.abs(r) + 1e-12); }
      if (es.tipo === 'coppia') { var p = risp.split(';').map(function (z) { return +z.trim(); }).sort(function (a, b) { return a - b; }), q = es.risposta.split(';').map(Number); return p.length === 2 && p[0] === q[0] && p[1] === q[1]; }
      if (es.tipo === 'espressione') return C.uguali(C.leggi(risp), C.leggi(es.risposta), ['x']);
    } catch (e) { return false; }
    return false;
  }
  function schedaAllenamento(div) {
    var pan = F.el('div', { 'class': 'bsiFX-pannello', style: 'max-width:720px' }); div.appendChild(pan);
    var cat = 'tutti', punti = { ok: 0, tot: 0 };
    try { var sv = JSON.parse(localStorage.getItem('bsi-mat-allenamento') || 'null'); if (sv && sv.tot >= 0) punti = sv; } catch (e) {}
    F.scelta(pan, ['Argomento', 'Topic'], [['tutti', ['Tutti mescolati', 'All mixed']], ['cifre', ['Cifre significative', 'Significant figures']], ['scientifica', ['Notazione scientifica', 'Scientific notation']], ['logaritmo', ['Logaritmi', 'Logarithms']], ['ph', ['pH', 'pH']], ['secondo', ['Equazioni di 2° grado', 'Quadratic equations']], ['derivata', ['Derivate', 'Derivatives']]], cat, function (v) { cat = v; nuovo(); });
    var dom = F.el('div', { 'class': 'bsiFX-eq', style: 'font-size:1.05rem' }), inp = F.el('input', { type: 'text', 'aria-label': t('risposta', 'answer') }), esito = F.el('div', { 'class': 'bsiFX-nota' }), score = F.el('div', { 'class': 'bsiFX-nota' });
    pan.appendChild(dom); pan.appendChild(inp);
    F.bottone(pan, ['Controlla', 'Check'], controlla); F.bottone(pan, ['Nuovo esercizio', 'New exercise'], nuovo); F.bottone(pan, ['Mostra soluzione', 'Show solution'], function () { esito.innerHTML = '💡 ' + esc(es.spiega); });
    pan.appendChild(esito); pan.appendChild(score);
    var es;
    function nuovo() {
      var k = cat === 'tutti' ? Object.keys(GENERATORI)[casuale(0, Object.keys(GENERATORI).length - 1)] : cat;
      es = GENERATORI[k](); dom.textContent = es.testo; inp.value = ''; esito.textContent = ''; mostraPunti();
    }
    function controlla() {
      var ok = correggi(es, inp.value);
      punti.tot++; if (ok) punti.ok++;
      try { localStorage.setItem('bsi-mat-allenamento', JSON.stringify(punti)); } catch (e) {}
      esito.innerHTML = ok ? '<span class="bsiFX-ok">✓ ' + t('Giusto!', 'Correct!') + '</span> ' + esc(es.spiega) : '<span class="bsiFX-ko">✗ ' + t('Non ancora.', 'Not yet.') + '</span> ' + t('Riprova o guarda la soluzione.', 'Try again or look at the solution.');
      mostraPunti();
    }
    function mostraPunti() { score.textContent = t('Punteggio: ', 'Score: ') + punti.ok + '/' + punti.tot; }
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') controlla(); });
    nuovo();
  }

  F.calcolo.basi = { cifre: cifre, arrotondaSig: arrotondaSig, scientifica: scientifica, operaMisure: operaMisure, pH: pH, risolvi: risolvi, correggi: correggi, GENERATORI: GENERATORI };

  F.sezione('smatbasi', {
    titolo: ['🔢 Basi di matematica', '🔢 Mathematics basics'],
    sotto: ['Cifre significative e arrotondamenti, potenze e logaritmi (con il pH), equazioni con i passaggi — dal primo grado ai polinomi e alle equazioni fratte dell’equilibrio — e un allenamento con esercizi sempre nuovi.',
            'Significant figures and rounding, powers and logarithms (with pH), equations with the working — from linear to polynomials and the fractional equations of equilibrium — and practice with ever-new exercises.'],
    schede: [
      { nome: ['Cifre significative', 'Significant figures'], costruisci: schedaCifre },
      { nome: ['Potenze e logaritmi', 'Powers and logarithms'], costruisci: schedaLog },
      { nome: ['Equazioni', 'Equations'], costruisci: schedaEquazioni },
      { nome: ['Allenamento', 'Practice'], costruisci: schedaAllenamento }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
