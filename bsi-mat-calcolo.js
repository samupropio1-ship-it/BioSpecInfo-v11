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

  /* ── solidi di rotazione (v238) ──────────────────────────────────────────
     Il grafico di y = f(x), x ∈ [a, b], ruota attorno all'asse x. Ogni fetta perpendicolare
     all'asse e' un disco di raggio |f(x)|: V = π ∫ f(x)² dx. Con n dischi di spessore h presi al
     punto medio la somma π Σ f(mᵢ)² h e' una somma di Riemann di quell'integrale (errore O(h²):
     raddoppiando n si divide per 4). La superficie laterale e' 2π ∫ |f| √(1 + f′²) dx. */
  function volumeDischi(f, a, b, n) {
    var h = (b - a) / n, s = 0, dischi = [];
    for (var i = 0; i < n; i++) { var m = a + (i + 0.5) * h, r = f(m); dischi.push([m, r]); if (isFinite(r)) s += r * r * h; }
    return { valore: Math.PI * s, dischi: dischi, h: h };
  }
  function volumeRotazione(e, x, a, b) {
    var f = C.funzione(e, x), f2 = function (v) { var y = f(v); return y * y; }, num = C.integraleDefinito(f2, a, b), esatto = null;
    /* la primitiva di f² quando il motore la trova: volume esatto dal teorema fondamentale */
    try { var P = C.integra(C.semplifica(C.costruisci.pow(e, C.Q(2))), x); if (P) { var FP = C.funzione(P, x), d = FP(b) - FP(a); if (isFinite(d) && Math.abs(d - num.valore) < 1e-6 * (1 + Math.abs(d))) esatto = { primitiva: P, valore: Math.PI * d }; } } catch (er) { }
    return { valore: Math.PI * num.valore, affidabile: num.affidabile, esatto: esatto };
  }
  function areaLaterale(e, x, a, b) {
    var f = C.funzione(e, x), f1 = C.funzione(C.deriva(e, x), x);
    return 2 * Math.PI * C.integraleDefinito(function (v) { var y = f(v), p = f1(v); return Math.abs(y) * Math.sqrt(1 + p * p); }, a, b).valore;
  }

  /* la scheda 3D: il pannello si costruisce subito (testo e comandi), la scena dopo, fuori dal gestore del clic */
  function scheda3d(costruisci, etichetta, rapporto) {
    return function (div) {
      var G = griglia(div), posto = F.el('div'); G.dx.appendChild(posto);
      var vista = costruisci(G.pan, G.dx), lab = globale.BSILab3D;
      if (!lab) { posto.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('Serve il Laboratorio 3D (bsi-lab3d.js) per la vista tridimensionale.', 'The 3D Laboratory (bsi-lab3d.js) is needed for the three-dimensional view.') })); return; }
      var attesa = F.el('div', { 'class': 'bsiFX-nota', testo: t('Caricamento del motore 3D…', 'Loading the 3D engine…') }); posto.appendChild(attesa);
      lab.stile();
      lab.caricaThree().then(function () {
        setTimeout(function () {
          attesa.remove();
          var S = new lab.Scena(posto, rapporto || 0.66);
          S.box.setAttribute('role', 'group'); S.box.setAttribute('aria-label', F.tt(etichetta));
          globale.requestAnimationFrame(function () { try { vista(S, lab, globale.THREE); } catch (e) { if (globale.console) console.error(e); } div._scena = S; });
        }, 0);
      }).catch(function (e) { if (globale.console) console.error(e); attesa.textContent = t('Motore 3D non disponibile: ', '3D engine unavailable: ') + e.message; });
    };
  }
  function schedaSolido(pan) {
    var st = { n: 10, dischi: true }, R = null, S = null, T = null, lab = null, phi = 0;
    var inp = F.el('input', { type: 'text', value: 'sqrt(1 - x^2)', 'aria-label': 'f(x)', spellcheck: 'false', autocomplete: 'off' });
    pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: 'f(x) =' })); pan.appendChild(inp);
    var ra = F.el('input', { type: 'text', value: '-1', 'aria-label': 'a' }), rb = F.el('input', { type: 'text', value: '1', 'aria-label': 'b' });
    pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('Estremi a, b (anche pi, e…):', 'Limits a, b (pi, e… allowed):') }));
    pan.appendChild(F.el('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:6px' }, [ra, rb]));
    F.scelta(pan, ['Esempi', 'Examples'], [['sqrt(x)|0|4', t('√x: paraboloide, V = 8π', '√x: paraboloid, V = 8π')], ['sqrt(1 - x^2)|-1|1', t('semicerchio: sfera, V = 4π/3', 'semicircle: sphere, V = 4π/3')], ['x/2|0|3', t('retta: cono, V = πr²h/3', 'line: cone, V = πr²h/3')], ['2 + cos(x)|0|2*pi', t('vaso 2 + cos x', 'vase 2 + cos x')], ['1/x|1|6', t('tromba di Gabriele (1/x)', 'Gabriel’s horn (1/x)')], ['e^(-x^2)|-2|2', t('campana e^(−x²)', 'bell e^(−x²)')], ['sin(x)|0|pi', t('fuso sin x, V = π²/2', 'spindle sin x, V = π²/2')]], 'sqrt(1 - x^2)|-1|1', function (v) { var p = v.split('|'); inp.value = p[0]; ra.value = p[1]; rb.value = p[2]; calcola(); });
    [inp, ra, rb].forEach(function (i) { i.addEventListener('change', calcola); });
    F.cursore(pan, ['numero di dischi n', 'number of discs n'], 1, 60, 1, st.n, function (v) { st.n = v; numeri(); dischi(); });
    var c = F.el('input', { type: 'checkbox' }); c.checked = true; c.addEventListener('change', function () { st.dischi = c.checked; dischi(); });
    pan.appendChild(F.el('label', { style: 'display:flex;align-items:center;gap:6px;margin:4px 0;font-size:.84rem;color:#cfe3f7;cursor:pointer' }, [c, F.el('span', { testo: t('Mostra i dischi', 'Show the discs') })]));
    F.bottone(pan, ['↻ Fai girare di nuovo', '↻ Spin it again'], function () { phi = 0; if (S) S.avvia(); });
    var info = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(info);
    pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('Il profilo y = f(x) (in giallo) gira attorno all’asse x e la superficie del solido si costruisce mentre ruota. Tagliando il solido perpendicolarmente all’asse ogni fetta è un disco di raggio |f(x)| e area πf(x)²: sommando le fette, V = π∫ₐᵇ f(x)² dx (principio di Cavalieri). I cilindri trasparenti sono n dischi presi al punto medio: la loro somma è una somma di Riemann dell’integrale e l’errore cala come 1/n². Con 1/x su [1, ∞) succede una cosa famosa: il volume resta finito (π) mentre la superficie laterale cresce senza limite (tromba di Gabriele).',
      'The profile y = f(x) (yellow) spins around the x axis and the surface of the solid is built as it turns. Slicing the solid perpendicular to the axis each slice is a disc of radius |f(x)| and area πf(x)²: adding the slices, V = π∫ₐᵇ f(x)² dx (Cavalieri’s principle). The transparent cylinders are n midpoint discs: their sum is a Riemann sum of the integral and the error falls like 1/n². With 1/x on [1, ∞) something famous happens: the volume stays finite (π) while the lateral surface grows without bound (Gabriel’s horn).') }));
    var oggetti = {}, Gs = null;
    function calcola() {
      try {
        var e = C.leggi(inp.value), x = variabile(e), a = leggiNum(ra.value), b = leggiNum(rb.value);
        if (C.simboli(e).filter(function (v) { return v !== x; }).length) throw new Error(t('una sola variabile, per esempio x', 'one variable only, for example x'));
        if (!isFinite(a) || !isFinite(b) || !(b > a)) throw new Error(t('servono estremi finiti con a < b', 'finite limits with a < b are needed'));
        R = { e: e, x: x, f: C.funzione(e, x), a: a, b: b, V: volumeRotazione(e, x, a, b), A: areaLaterale(e, x, a, b) };
      } catch (err) { R = null; info.innerHTML = '<span class="bsiFX-ko">' + t('Non riesco a usarla: ', 'I cannot use it: ') + esc(err.message) + '</span>'; if (S) { S.pulisci(); S.aggiungi(lab.assi(T, 3.4, ['x', 'y', 'z'], 0.3)); } return; }
      numeri(); phi = 0; scena();
    }
    function numeri() {
      if (!R) return;
      var D = volumeDischi(R.f, R.a, R.b, st.n), D2 = volumeDischi(R.f, R.a, R.b, 2 * st.n), V = R.V.valore, e1 = D.valore - V, e2 = D2.valore - V;
      info.innerHTML = '<div class="bsiFX-eq">V = π∫<sub>' + nb(R.a) + '</sub><sup>' + nb(R.b) + '</sup> (' + C.html(R.e) + ')² d' + R.x + ' = <b>' + (R.V.affidabile ? C.fmtNum(V) : '≈ ' + C.fmtNum(V)) + '</b>' + (R.V.esatto ? '<br><span style="color:#9fb1c6">' + t('primitiva di f²: ', 'antiderivative of f²: ') + C.html(R.V.esatto.primitiva) + '</span>' : '') + '</div>' +
        t('Con ', 'With ') + st.n + t(' dischi: ', ' discs: ') + '<b class="bsiFX-num">' + C.fmtNum(D.valore) + '</b> · ' + t('errore ', 'error ') + '<b class="bsiFX-num">' + C.fmtNum(e1) + '</b><br>' +
        t('Con ', 'With ') + 2 * st.n + t(' dischi l’errore è ', ' discs the error is ') + C.fmtNum(e2) + (Math.abs(e2) > 1e-12 && R.V.affidabile ? ' (' + t('rapporto ', 'ratio ') + (e1 / e2).toFixed(2) + t(', atteso ≈ 4', ', expected ≈ 4') + ')' : '') + '<br>' +
        t('Superficie laterale ', 'Lateral surface ') + '2π∫|f|√(1 + f′²) = <b class="bsiFX-num">' + C.fmtNum(R.A) + '</b>' + (R.V.affidabile ? '' : '<br><span class="bsiFX-ko">' + t('L’integrale è poco affidabile: f ha una singolarità nell’intervallo?', 'The integral is unreliable: does f have a singularity in the interval?') + '</span>');
    }
    function scena() {
      if (!S || !R) return;
      S.pulisci(); oggetti = {};
      var Nx = 160, Nf = 72, xs = [], ys = [], m = 0, i, j;
      for (i = 0; i <= Nx; i++) { var x = R.a + (R.b - R.a) * i / Nx, y = R.f(x); xs.push(x); ys.push(isFinite(y) ? y : NaN); if (isFinite(y)) m = Math.max(m, Math.abs(y)); }
      /* la stessa scala lungo l'asse e in raggio: il solido conserva le sue proporzioni */
      var s = Math.min(6 / (R.b - R.a), 2.6 / (m || 1)), X = function (x) { return (x - (R.a + R.b) / 2) * s; };
      Gs = { s: s, X: X };
      var pos = [], nor = [], idx = [];
      for (j = 0; j <= Nf; j++) { var f = 2 * Math.PI * j / Nf, cf = Math.cos(f), sf = Math.sin(f); for (i = 0; i <= Nx; i++) { var r = isFinite(ys[i]) ? Math.abs(ys[i]) * s : 0; pos.push(X(xs[i]), r * cf, r * sf); } }
      /* triangoli in ordine di angolo: setDrawRange fa crescere la superficie mentre gira */
      for (j = 0; j < Nf; j++) for (i = 0; i < Nx; i++) { if (!isFinite(ys[i]) || !isFinite(ys[i + 1])) continue; var a0 = j * (Nx + 1) + i, b0 = a0 + Nx + 1; idx.push(a0, a0 + 1, b0 + 1, a0, b0 + 1, b0); }
      var geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
      oggetti.sup = new T.Mesh(geo, new T.MeshStandardMaterial({ color: 0x5eead4, roughness: 0.6, metalness: 0, side: T.DoubleSide, transparent: true, opacity: 0.6, depthWrite: false })); S.aggiungi(oggetti.sup);
            oggetti.idx = idx.length;
      /* la «gabbia» del solido, tenue, visibile da subito: meridiani ogni 15° e paralleli ogni 1/16 dell'intervallo */
      var gab = [];
      for (j = 0; j < Nf; j += 3) for (i = 0; i < Nx; i++) if (isFinite(ys[i]) && isFinite(ys[i + 1])) { var p0 = j * (Nx + 1) + i; gab.push(pos[3 * p0], pos[3 * p0 + 1], pos[3 * p0 + 2], pos[3 * p0 + 3], pos[3 * p0 + 4], pos[3 * p0 + 5]); }
      for (i = 0; i <= Nx; i += 10) if (isFinite(ys[i])) for (j = 0; j < Nf; j++) { var q0 = j * (Nx + 1) + i, q1 = q0 + Nx + 1; gab.push(pos[3 * q0], pos[3 * q0 + 1], pos[3 * q0 + 2], pos[3 * q1], pos[3 * q1 + 1], pos[3 * q1 + 2]); }
      var gg = new T.BufferGeometry(); gg.setAttribute('position', new T.Float32BufferAttribute(gab, 3));
      S.aggiungi(new T.LineSegments(gg, new T.LineBasicMaterial({ color: 0x4a7aa8, transparent: true, opacity: 0.45 })));
      /* il profilo che gira (giallo) e quello fermo nel piano xy */
      var prof = []; for (i = 0; i <= Nx; i++) if (isFinite(ys[i])) prof.push([X(xs[i]), ys[i] * s, 0]);
      S.aggiungi(lab.linea(T, prof, 0xffd24a, 0.35));
      oggetti.prof = new T.Group(); oggetti.prof.add(lab.linea(T, prof.map(function (p) { return [p[0], Math.abs(p[1]), 0]; }), 0xffd24a)); S.aggiungi(oggetti.prof);
      S.aggiungi(lab.linea(T, [[X(R.a) - 0.6, 0, 0], [X(R.b) + 0.6, 0, 0]], 0xff6b6b, 0.8));
      S.aggiungi(lab.assi(T, 3.6, ['x', 'y', 'z'], 0.3));
      dischi();
      S.didascalia.textContent = 'y = ' + C.stampa(R.e) + ', ' + R.x + ' ∈ [' + nb(R.a) + ', ' + nb(R.b) + ']';
      if (!S.vistaIniziale) S.inquadra(12.5, -1.2, 1.15);
      S.ogniFotogramma(function (dt) {
        if (phi >= 2 * Math.PI) return false;
        phi = Math.min(2 * Math.PI, phi + dt * 2.4);
        var k = Math.ceil(phi / (2 * Math.PI) * 72); oggetti.sup.geometry.setDrawRange(0, Math.min(oggetti.idx, Math.round(oggetti.idx * k / 72)));
        oggetti.prof.rotation.x = phi;
        if (oggetti.dischi) oggetti.dischi.visible = st.dischi && phi >= 2 * Math.PI;
      });
    }
    /* i dischi: cilindri sottili (asse x) al punto medio di ogni striscia */
    function dischi() {
      if (!S || !R || !Gs) return;
      if (oggetti.dischi) { S.radice.remove(oggetti.dischi); oggetti.dischi.traverse(function (o) { if (o.geometry) o.geometry.dispose(); }); }
      var D = volumeDischi(R.f, R.a, R.b, st.n), g = new T.Group(), mat = new T.MeshStandardMaterial({ color: 0xff9f43, transparent: true, opacity: 0.45, roughness: 0.4, depthWrite: false }), bordo = new T.LineBasicMaterial({ color: 0xffc58a, transparent: true, opacity: 0.8 });
      D.dischi.forEach(function (d) {
        if (!isFinite(d[1]) || Math.abs(d[1]) < 1e-9) return;
        var r = Math.abs(d[1]) * Gs.s, cil = new T.CylinderGeometry(r, r, D.h * Gs.s * 0.94, 40, 1), mm = new T.Mesh(cil, mat);
        mm.rotation.z = Math.PI / 2; mm.position.x = Gs.X(d[0]); g.add(mm);
        var e = new T.LineSegments(new T.EdgesGeometry(cil, 30), bordo); e.rotation.z = Math.PI / 2; e.position.x = Gs.X(d[0]); g.add(e);
      });
      g.visible = st.dischi && phi >= 2 * Math.PI; oggetti.dischi = g; S.aggiungi(g);
    }
    calcola();
    return function (Sc, L3, Tr) { S = Sc; lab = L3; T = Tr; scena(); };
  }

  F.calcolo.calcoloinf = { riemann: riemann, taylor: taylor, stampaTaylor: stampaTaylor, volumeDischi: volumeDischi, volumeRotazione: volumeRotazione, areaLaterale: areaLaterale };

  F.sezione('smatcalc', {
    titolo: ['∫ Derivate, integrali e serie', '∫ Derivatives, integrals and series'],
    sotto: ['Il calcolo infinitesimale con un motore simbolico: derivate con le regole usate, primitive verificate, integrali definiti e somme di Riemann, polinomi di Taylor, limiti destri e sinistri.',
            'Calculus with a symbolic engine: derivatives with the rules used, verified antiderivatives, definite integrals and Riemann sums, Taylor polynomials, left and right limits.'],
    schede: [
      { nome: ['Derivate', 'Derivatives'], costruisci: schedaDerivate },
      { nome: ['Integrali', 'Integrals'], costruisci: schedaIntegrali },
      { nome: ['Serie di Taylor', 'Taylor series'], costruisci: schedaTaylor },
      { nome: ['Limiti', 'Limits'], costruisci: schedaLimiti },
      { nome: ['🧊 Solidi di rotazione', '🧊 Solids of revolution'], costruisci: scheda3d(schedaSolido, ['Solido di rotazione di y = f(x) attorno all’asse x, con i dischi', 'Solid of revolution of y = f(x) around the x axis, with the discs']) }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
