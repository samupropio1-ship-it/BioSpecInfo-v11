/* ═══════════════════════════════════════════════════════════════════════════
   bsi-mat-calcolo.js — ∫ derivate, integrali, serie di Taylor, limiti
   BioSpecInfo · © Samuele Pio Provenzano

   Il calcolo infinitesimale con il motore simbolico bsi-mat-cas.js:

   · DERIVATE: la derivata esatta, le regole usate (somma, prodotto,
     quoziente, potenza, catena), la derivata seconda, il valore in un
     punto e la forma espansa;
   · INTEGRALI: la primitiva quando esiste in forma chiusa (verificata
     derivandola), l'integrale definito con Simpson adattivo, e le somme
     di Riemann — sinistra, destra, punto medio, trapezi — che si
     avvicinano al valore vero quando n cresce;
   · TAYLOR: il polinomio di grado n attorno a un punto, coefficienti
     esatti dall'aritmetica delle serie, e l'errore che resta;
   · LIMITI: con le serie per le forme 0/0, numerici per il resto, destro
     e sinistro separati quando non coincidono.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica, C = globale.BSIMatCAS;
  if (!F || !C) return;
  var t = F.t;
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function nb(v) { return isFinite(v) ? C.numeroBello(+(+v).toPrecision(10)) : (v > 0 ? '+∞' : v < 0 ? '−∞' : t('non esiste', 'does not exist')); }
  function variabile(e) { var vs = C.simboli(e); return vs.indexOf('x') >= 0 ? 'x' : (vs[0] || 'x'); }
  function leggiNum(s) { s = String(s).trim().replace(/^\+?(∞|inf|infinito)$/i, 'Infinity').replace(/^-(∞|inf|infinito)$/i, '-Infinity'); if (/^-?Infinity$/.test(s)) return +s; return C.valuta(C.leggi(s)); }
  function campo(padre, valore, etichetta, esempi, poi) {
    padre.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: etichetta }));
    var inp = F.el('input', { type: 'text', value: valore, 'aria-label': etichetta }); padre.appendChild(inp);
    if (esempi) {
      var es = F.el('div', { style: 'display:flex;flex-wrap:wrap;gap:4px;margin:6px 0' }); padre.appendChild(es);
      esempi.forEach(function (s) { es.appendChild(F.el('button', { type: 'button', 'class': 'bsiFX-bott', testo: s, onclick: function () { inp.value = s; poi(); } })); });
    }
    inp.addEventListener('change', poi);
    return inp;
  }
  function griglia(div) {
    var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div');
    g.appendChild(pan); g.appendChild(dx); div.appendChild(g);
    return { pan: pan, dx: dx };
  }

  /* ── derivate ─────────────────────────────────────────────────────────── */
  function schedaDerivate(div) {
    var G = griglia(div), out = F.el('div'), x0 = 1;
    var inp = campo(G.pan, 'x^2*sin(3x)', 'f(x) =', ['x^3 - 4x', 'sin(x)/x', 'e^(-x^2)', 'ln(x^2+1)', 'x^x', 'sqrt(1 - x^2)', 'atan(1/x)', 'cos(x)^3'], calcola);
    var cx = F.el('input', { type: 'text', value: '1', 'aria-label': 'x₀' });
    G.pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('Punto x₀ (anche pi/4, e …):', 'Point x₀ (pi/4, e … allowed):') })); G.pan.appendChild(cx);
    cx.addEventListener('change', calcola);
    F.bottone(G.pan, ['Deriva', 'Differentiate'], calcola);
    G.pan.appendChild(out);
    var c = F.tela(G.dx, 0.6), R = null;
    function calcola() {
      var e, x, passi = [];
      try { e = C.leggi(inp.value); x = variabile(e); x0 = leggiNum(cx.value); } catch (err) { out.innerHTML = '<div class="bsiFX-nota bsiFX-ko">⚠ ' + esc(err.message) + '</div>'; return; }
      var d1 = C.deriva(e, x, passi), d2 = C.deriva(d1, x), esp = C.espandi(d1);
      R = { e: e, x: x, d1: d1, f: C.funzione(e, x), f1: C.funzione(d1, x) };
      var h = '<div class="bsiFX-eq">f(' + x + ') = ' + C.html(e) + '<br><b>f′(' + x + ') = ' + C.html(d1) + '</b>' + (C.stampa(esp) !== C.stampa(d1) && C.stampa(esp).length < 160 ? '<br><span style="color:#9fb1c6">= ' + C.html(esp) + '</span>' : '') + '<br>f″(' + x + ') = ' + C.html(d2) + '</div>';
      h += '<div class="bsiFX-nota"><b>' + t('Regole usate', 'Rules used') + '</b><ol style="margin:4px 0 0 18px;padding:0">' + passi.map(function (p) { return '<li>' + F.tt(C.REGOLE[p.regola]) + ' — <span class="bsiFX-num">' + esc(p.espr) + '</span></li>'; }).join('') + '</ol></div>';
      var v0 = R.f(x0), v1 = R.f1(x0), v2 = C.funzione(d2, x)(x0);
      h += '<table class="bsiFX-tab"><tr><td>f(' + nb(x0) + ')</td><td class="bsiFX-num">' + nb(v0) + '</td></tr><tr><td>f′(' + nb(x0) + ')</td><td class="bsiFX-num">' + nb(v1) + '</td></tr><tr><td>f″(' + nb(x0) + ')</td><td class="bsiFX-num">' + nb(v2) + '</td></tr>' +
        (isFinite(v0) && isFinite(v1) ? '<tr><td>' + t('tangente', 'tangent') + '</td><td class="bsiFX-num">y = ' + nb(v1) + '·(' + x + ' − ' + nb(x0) + ') + ' + nb(v0) + '</td></tr>' : '') + '</table>';
      out.innerHTML = h;
      disegna();
    }
    function disegna() {
      if (!R) return;
      var a = (isFinite(x0) ? x0 : 0) - 5, b = a + 10, s0 = C.campiona(R.f, a, b, 700), s1 = C.campiona(R.f1, a, b, 700), sy = C.scalaY([s0.y]);
      var serie = [{ x: s0.x, y: C.spezza(s0.y, sy), col: '#5eead4', larg: 2.5 }, { x: s1.x, y: C.spezza(s1.y, sy), col: '#ffd24a', larg: 1.5, tratt: true }];
      var y0 = R.f(x0), m = R.f1(x0);
      if (isFinite(y0) && isFinite(m)) serie.push({ x: [a, b], y: [y0 + m * (a - x0), y0 + m * (b - x0)], col: '#7c6fff', larg: 1.5 });
      F.grafico(c, { serie: serie, punti: isFinite(y0) ? [{ x: x0, y: y0, col: '#7c6fff', r: 5 }] : [], linee: [{ y: 0, col: '#34465f' }], xmin: a, xmax: b, ymin: sy.min, ymax: sy.max, xl: R.x, yl: 'y',
        legenda: [{ col: '#5eead4', etich: 'f' }, { col: '#ffd24a', etich: "f′" }, { col: '#7c6fff', etich: t('tangente', 'tangent') }] });
    }
    calcola(); F.alRidimensiona(disegna);
  }

  /* ── integrali ────────────────────────────────────────────────────────── */
  function riemann(f, a, b, n, metodo) {
    var h = (b - a) / n, s = 0, rett = [];
    for (var i = 0; i < n; i++) {
      var x0 = a + i * h, x1 = x0 + h, y;
      if (metodo === 'sinistra') y = f(x0); else if (metodo === 'destra') y = f(x1); else if (metodo === 'medio') y = f((x0 + x1) / 2);
      if (metodo === 'trapezi') { var ya = f(x0), yb = f(x1); s += (ya + yb) / 2 * h; rett.push([x0, x1, ya, yb]); }
      else { s += y * h; rett.push([x0, x1, y, y]); }
    }
    return { valore: s, rett: rett };
  }
  function schedaIntegrali(div) {
    var G = griglia(div), out = F.el('div'), n = 8, metodo = 'medio';
    var inp = campo(G.pan, 'x*e^(-x)', 'f(x) =', ['x^2', 'sin(x)', 'x*e^(-x)', '1/x', 'x^2*sin(x)', 'ln(x)', '2x*cos(x^2)', '1/(1+x^2)', 'e^(-x^2)', 'sqrt(1 - x^2)'], calcola);
    var ra = F.el('input', { type: 'text', value: '0', 'aria-label': 'a' }), rb = F.el('input', { type: 'text', value: '3', 'aria-label': 'b' });
    G.pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('Estremi a, b:', 'Limits a, b:') }));
    G.pan.appendChild(F.el('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:6px' }, [ra, rb]));
    ra.addEventListener('change', calcola); rb.addEventListener('change', calcola);
    F.scelta(G.pan, ['Somma di Riemann', 'Riemann sum'], [['sinistra', ['rettangoli a sinistra', 'left rectangles']], ['destra', ['rettangoli a destra', 'right rectangles']], ['medio', ['punto medio', 'midpoint']], ['trapezi', ['trapezi', 'trapezoids']]], metodo, function (v) { metodo = v; disegna(); });
    F.cursore(G.pan, ['Numero di strisce n', 'Number of strips n'], 1, 100, 1, n, function (v) { n = v; disegna(); });
    F.bottone(G.pan, ['Integra', 'Integrate'], calcola);
    G.pan.appendChild(out);
    var c = F.tela(G.dx, 0.6), info = F.el('div', { 'class': 'bsiFX-nota' }); G.dx.appendChild(info);
    var R = null;
    function calcola() {
      var e, x, a, b;
      try { e = C.leggi(inp.value); x = variabile(e); a = leggiNum(ra.value); b = leggiNum(rb.value); } catch (err) { out.innerHTML = '<div class="bsiFX-nota bsiFX-ko">⚠ ' + esc(err.message) + '</div>'; return; }
      var f = C.funzione(e, x), Fp = C.integra(e, x), num = C.integraleDefinito(f, a, b);
      R = { e: e, x: x, f: f, a: a, b: b, num: num.valore };
      var h = '<div class="bsiFX-eq">∫ ' + C.html(e) + ' d' + x + ' = ' + (Fp ? '<b>' + C.html(Fp) + ' + C</b>' : '<span style="color:#9fb1c6">' + t('nessuna primitiva elementare trovata', 'no elementary antiderivative found') + '</span>') + '</div>';
      if (Fp) {
        var FF = C.funzione(Fp, x), diff = FF(b) - FF(a);
        var concorda = isFinite(diff) && Math.abs(diff - num.valore) < 1e-6 * (1 + Math.abs(diff));
        h += '<div class="bsiFX-nota">' + t('Verificata: derivandola si riottiene f(x).', 'Verified: differentiating it gives f(x) back.') + '<br>' + t('Teorema fondamentale: F(b) − F(a) = ', 'Fundamental theorem: F(b) − F(a) = ') + '<b class="bsiFX-num">' + nb(diff) + '</b>' +
          (concorda ? '' : ' <span class="bsiFX-ko">' + t('— non vale qui: f non è continua in [a, b] (o l’integrale è improprio)', '— it does not apply here: f is not continuous on [a, b] (or the integral is improper)') + '</span>') + '</div>';
      } else {
        h += '<div class="bsiFX-nota">' + t('Non tutte le funzioni hanno una primitiva elementare (e^(−x²), sin(x)/x, √(1 + x³) non ce l’hanno: teorema di Liouville); l’integrale definito si calcola comunque, numericamente.', 'Not every function has an elementary antiderivative (e^(−x²), sin(x)/x, √(1 + x³) do not: Liouville’s theorem); the definite integral is still computed, numerically.') + '</div>';
      }
      h += '<div class="bsiFX-nota">∫<sub>' + nb(a) + '</sub><sup>' + nb(b) + '</sup> f d' + x + ' = <b class="bsiFX-num">' + (num.affidabile ? C.fmtNum(num.valore) : '≈ ' + C.fmtNum(num.valore) + ' (' + t('poco affidabile: singolarità?', 'unreliable: a singularity?') + ')') + '</b> <span style="color:#8494a8">(Simpson ' + t('adattivo, ', 'adaptive, ') + num.valutazioni + t(' valutazioni)', ' evaluations)') + '</span></div>';
      out.innerHTML = h;
      disegna();
    }
    function disegna() {
      if (!R) return;
      var a = R.a, b = R.b, lo = Math.min(a, b), hi = Math.max(a, b), m = (hi - lo) * 0.25 || 1;
      var s = C.campiona(R.f, lo - m, hi + m, 700), sy = C.scalaY([s.y]), rs = riemann(R.f, a, b, n, metodo);
      sy.min = Math.min(sy.min, 0); sy.max = Math.max(sy.max, 0);
      var o = F.grafico(c, { serie: [{ x: s.x, y: C.spezza(s.y, sy), col: '#5eead4', larg: 2.5 }], linee: [{ y: 0, col: '#8494a8' }], xmin: lo - m, xmax: hi + m, ymin: sy.min, ymax: sy.max, xl: R.x, yl: 'f' });
      var q = o.q; q.save();
      rs.rett.forEach(function (r) {
        if (!isFinite(r[2]) || !isFinite(r[3])) return;
        q.beginPath(); q.moveTo(o.X(r[0]), o.Y(0)); q.lineTo(o.X(r[0]), o.Y(r[2])); q.lineTo(o.X(r[1]), o.Y(r[3])); q.lineTo(o.X(r[1]), o.Y(0)); q.closePath();
        q.fillStyle = (r[2] + r[3]) >= 0 ? 'rgba(94,234,212,.22)' : 'rgba(255,138,128,.25)'; q.fill(); q.strokeStyle = 'rgba(94,234,212,.6)'; q.lineWidth = 1; q.stroke();
      });
      q.restore();
      var err = rs.valore - R.num;
      info.innerHTML = t('Somma con ', 'Sum with ') + n + t(' strisce: ', ' strips: ') + '<b class="bsiFX-num">' + C.fmtNum(rs.valore) + '</b> · ' + t('errore ', 'error ') + '<b class="bsiFX-num">' + C.fmtNum(err) + '</b><br>' +
        t('Raddoppiando n l’errore si dimezza con i rettangoli laterali (ordine 1) e si riduce a un quarto con punto medio e trapezi (ordine 2).', 'Doubling n halves the error with left/right rectangles (order 1) and quarters it with midpoint and trapezoids (order 2).');
    }
    calcola(); F.alRidimensiona(disegna);
  }

  /* ── Taylor ───────────────────────────────────────────────────────────── */
  function taylor(e, x, a, n) {
    var c = C.serie(e, x, a, n);
    return { coeff: c, poli: function (v) { var s = 0, p = 1; for (var k = 0; k <= n; k++) { s += c[k] * p; p *= (v - a); } return s; } };
  }
  function stampaTaylor(c, x, a) {
    var parti = [];
    c.forEach(function (v, k) {
      if (Math.abs(v) < 1e-13) return;
      var base = a === 0 ? x : '(' + x + (a > 0 ? ' − ' + nb(a) : ' + ' + nb(-a)) + ')';
      var mon = k === 0 ? '' : k === 1 ? base : base + String(k).split('').map(function (d) { return '⁰¹²³⁴⁵⁶⁷⁸⁹'[+d]; }).join('');
      var cv = C.numeroBello(+v.toPrecision(12)), neg = cv.charAt(0) === '−';
      cv = neg ? cv.slice(1) : cv;
      var termine = k === 0 ? cv : (cv === '1' ? mon : (cv.indexOf('/') > 0 ? '(' + cv + ')' : cv) + '·' + mon);
      parti.push({ neg: neg, s: termine });
    });
    if (!parti.length) return '0';
    return parti.map(function (p, i) { return i === 0 ? (p.neg ? '−' : '') + p.s : (p.neg ? ' − ' : ' + ') + p.s; }).join('');
  }
  function schedaTaylor(div) {
    var G = griglia(div), out = F.el('div', { 'class': 'bsiFX-eq' }), info = F.el('div', { 'class': 'bsiFX-nota' }), ordine = 5, centro = 0;
    var inp = campo(G.pan, 'sin(x)', 'f(x) =', ['sin(x)', 'cos(x)', 'e^x', 'ln(1+x)', '1/(1-x)', 'sqrt(1+x)', 'atan(x)', 'tan(x)', 'e^(-x^2)'], calcola);
    F.cursore(G.pan, ['Grado n', 'Degree n'], 0, 20, 1, ordine, function (v) { ordine = v; calcola(); });
    F.cursore(G.pan, ['Centro a', 'Centre a'], -3, 3, 0.1, centro, function (v) { centro = Math.round(v * 10) / 10; calcola(); }, function (v) { return v.toFixed(1); });
    G.pan.appendChild(out); G.pan.appendChild(info);
    var c = F.tela(G.dx, 0.6), R = null;
    function calcola() {
      var e, x, T;
      try { e = C.leggi(inp.value); x = variabile(e); T = taylor(e, x, centro, ordine); } catch (err) { out.innerHTML = '<span class="bsiFX-ko">⚠ ' + esc(err.message === 'potenza non analitica in questo punto' || err.polo ? t('f non è sviluppabile in questo punto: sposta il centro.', 'f cannot be expanded at this point: move the centre.') : err.message) + '</span>'; R = null; return; }
      R = { f: C.funzione(e, x), T: T, x: x };
      out.innerHTML = 'P<sub>' + ordine + '</sub>(' + x + ') = ' + esc(stampaTaylor(T.coeff, x, centro));
      var punto = centro + 1, err = Math.abs(R.f(punto) - T.poli(punto));
      info.innerHTML = t('Coefficienti cₖ = f⁽ᵏ⁾(a)/k! esatti, dall’aritmetica delle serie troncate (non da n derivate simboliche).', 'Coefficients cₖ = f⁽ᵏ⁾(a)/k! exact, from truncated power-series arithmetic (not from n symbolic derivatives).') +
        '<br>' + t('Errore in a + 1: ', 'Error at a + 1: ') + '<b class="bsiFX-num">' + C.fmtNum(err) + '</b>';
      disegna();
    }
    function disegna() {
      if (!R) return;
      var a = centro - 4, b = centro + 4, s = C.campiona(R.f, a, b, 700), p = C.campiona(R.T.poli, a, b, 700), sy = C.scalaY([s.y]);
      sy.min -= (sy.max - sy.min) * 0.3; sy.max += (sy.max - sy.min) * 0.3;
      F.grafico(c, { serie: [{ x: s.x, y: C.spezza(s.y, sy), col: '#5eead4', larg: 2.5 }, { x: p.x, y: p.y.map(function (v) { return v > sy.max * 3 || v < sy.min * 3 ? NaN : v; }), col: '#ffd24a', larg: 2, tratt: true }],
        punti: [{ x: centro, y: R.f(centro), col: '#ff8a80', r: 5 }], xmin: a, xmax: b, ymin: sy.min, ymax: sy.max, xl: R.x, yl: 'y', legenda: [{ col: '#5eead4', etich: 'f' }, { col: '#ffd24a', etich: 'Pₙ' }] });
    }
    calcola(); F.alRidimensiona(disegna);
  }

  /* ── limiti ───────────────────────────────────────────────────────────── */
  function schedaLimiti(div) {
    var G = griglia(div), out = F.el('div');
    var inp = campo(G.pan, 'sin(x)/x', 'f(x) =', [], calcola);
    var ca = F.el('input', { type: 'text', value: '0', 'aria-label': t('punto', 'point') });
    G.pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('x tende a (numero, inf, -inf):', 'x tends to (number, inf, -inf):') })); G.pan.appendChild(ca);
    ca.addEventListener('change', calcola);
    var es = F.el('div', { style: 'display:flex;flex-wrap:wrap;gap:4px;margin:6px 0' }); G.pan.appendChild(es);
    [['sin(x)/x', '0'], ['(1-cos(x))/x^2', '0'], ['(e^x-1)/x', '0'], ['(1+1/x)^x', 'inf'], ['x*ln(x)', '0'], ['(x^2-4)/(x-2)', '2'], ['1/x', '0'], ['abs(x)/x', '0'], ['sqrt(x^2+x)-x', 'inf'], ['sin(1/x)', '0']].forEach(function (p) {
      es.appendChild(F.el('button', { type: 'button', 'class': 'bsiFX-bott', testo: p[0] + ' (→' + p[1].replace('inf', '∞') + ')', onclick: function () { inp.value = p[0]; ca.value = p[1]; calcola(); } }));
    });
    F.bottone(G.pan, ['Calcola il limite', 'Compute the limit'], calcola);
    G.pan.appendChild(out);
    var c = F.tela(G.dx, 0.6), tab = F.el('div'); G.dx.appendChild(tab);
    function calcola() {
      var e, x, a, r;
      try { e = C.leggi(inp.value); x = variabile(e); a = leggiNum(ca.value); r = C.limite(e, x, a); } catch (err) { out.innerHTML = '<div class="bsiFX-nota bsiFX-ko">⚠ ' + esc(err.message) + '</div>'; return; }
      var freccia = isFinite(a) ? nb(a) : (a > 0 ? '+∞' : '−∞'), h = '<div class="bsiFX-eq">lim<sub>' + x + '→' + freccia + (r.lato === '+' ? '⁺' : r.lato === '-' ? '⁻' : '') + '</sub> ' + C.html(e) + ' = <b>';
      if (isNaN(r.valore) && r.sinistro !== undefined && (isFinite(r.sinistro) || !isNaN(r.sinistro)) && r.sinistro !== r.destro) h += t('non esiste', 'does not exist') + '</b><br>' + t('da sinistra: ', 'from the left: ') + nb(r.sinistro) + ' · ' + t('da destra: ', 'from the right: ') + nb(r.destro);
      else h += nb(r.valore) + '</b>';
      h += '</div><div class="bsiFX-nota">' + (r.metodo === 'serie' ? t('Calcolato con lo sviluppo in serie attorno al punto (esatto: le forme 0/0 si risolvono confrontando gli ordini).', 'Computed from the series expansion about the point (exact: 0/0 forms are resolved by comparing orders).') : t('Stima numerica dalla successione dei valori qui a destra (con estrapolazione di Richardson quando l’errore cala con regolarità).', 'Numerical estimate from the sequence of values on the right (with Richardson extrapolation when the error shrinks regularly).')) +
        (isNaN(r.valore) && (r.sinistro === undefined || isNaN(r.sinistro)) ? '<br>' + t('La funzione oscilla o non si stabilizza: il limite non esiste.', 'The function oscillates or does not settle: the limit does not exist.') : '') + '</div>';
      out.innerHTML = h;
      var f = C.funzione(e, x), lo, hi;
      if (isFinite(a)) { lo = a - 2; hi = a + 2; } else if (a > 0) { lo = 0.1; hi = 60; } else { lo = -60; hi = -0.1; }
      var s = C.campiona(f, lo, hi, 900), sy = C.scalaY([s.y]), linee = [];
      if (isFinite(r.valore)) linee.push({ y: r.valore, col: '#ffd24a', etich: 'L = ' + nb(r.valore) });
      F.grafico(c, { serie: [{ x: s.x, y: C.spezza(s.y, sy), col: '#5eead4', larg: 2.5 }], linee: linee, xmin: lo, xmax: hi, ymin: sy.min, ymax: sy.max, xl: x, yl: 'f' });
      var seq = r.successione || (isFinite(a) ? [1, 2, 3, 4, 5, 6].map(function (k) { var v = a + Math.pow(10, -k); return [v, f(v)]; }) : []);
      tab.innerHTML = seq.length ? '<table class="bsiFX-tab"><tr><th>' + x + '</th><th>f(' + x + ')</th></tr>' + seq.slice(0, 10).map(function (p) { return '<tr><td class="bsiFX-num">' + C.fmtNum(p[0]) + '</td><td class="bsiFX-num">' + C.fmtNum(p[1]) + '</td></tr>'; }).join('') + '</table>' : '';
    }
    calcola(); F.alRidimensiona(calcola);
  }

  F.calcolo.calcoloinf = { riemann: riemann, taylor: taylor, stampaTaylor: stampaTaylor };

  F.sezione('smatcalc', {
    titolo: ['∫ Derivate, integrali e serie', '∫ Derivatives, integrals and series'],
    sotto: ['Il calcolo infinitesimale con un motore simbolico: derivate con le regole usate, primitive verificate, integrali definiti e somme di Riemann, polinomi di Taylor, limiti destri e sinistri.',
            'Calculus with a symbolic engine: derivatives with the rules used, verified antiderivatives, definite integrals and Riemann sums, Taylor polynomials, left and right limits.'],
    schede: [
      { nome: ['Derivate', 'Derivatives'], costruisci: schedaDerivate },
      { nome: ['Integrali', 'Integrals'], costruisci: schedaIntegrali },
      { nome: ['Serie di Taylor', 'Taylor series'], costruisci: schedaTaylor },
      { nome: ['Limiti', 'Limits'], costruisci: schedaLimiti }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
