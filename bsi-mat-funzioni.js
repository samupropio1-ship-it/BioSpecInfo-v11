/* ═══════════════════════════════════════════════════════════════════════════
   bsi-mat-funzioni.js — 📈 lo studio di funzione e le famiglie di funzioni
   BioSpecInfo · © Samuele Pio Provenzano

   · STUDIO DI FUNZIONE: si scrive f(x) e la sezione fa quello che si fa a
     mano — dominio, zeri, segno, derivate prima e seconda (simboliche,
     dal motore bsi-mat-cas.js), massimi, minimi, flessi, asintoti
     verticali, orizzontali e obliqui — e lo disegna, con la retta
     tangente che si sposta col cursore.
   · FAMIGLIE: le funzioni di base (rette, parabole, potenze, esponenziali,
     logaritmi, seni, la logistica) con i quattro parametri della
     trasformazione y = a·f(b(x − c)) + d, per vedere che cosa fa
     ciascuno.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica, C = globale.BSIMatCAS;
  if (!F || !C) return;
  var t = F.t;
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function n4(v) { return C.numeroBello(+(+v).toPrecision(8)); }

  /* ── l'analisi ────────────────────────────────────────────────────────── */
  function massimoAbs(f, a, b) {
    /* sezione aurea su |f| nell'intervallo [a, b] */
    var g = (Math.sqrt(5) - 1) / 2, x1 = b - g * (b - a), x2 = a + g * (b - a);
    for (var i = 0; i < 80; i++) {
      var f1 = Math.abs(f(x1)), f2 = Math.abs(f(x2));
      if (!isFinite(f1)) return x1; if (!isFinite(f2)) return x2;
      if (f1 > f2) { b = x2; x2 = x1; x1 = b - g * (b - a); } else { a = x1; x1 = x2; x2 = a + g * (b - a); }
    }
    return (a + b) / 2;
  }
  function studio(testo, a, b) {
    var e = C.leggi(testo), vs = C.simboli(e), x = vs.indexOf('x') >= 0 ? 'x' : (vs[0] || 'x');
    if (vs.length > 1) throw new Error(t('una sola variabile, per favore (trovate: ', 'a single variable, please (found: ') + vs.join(', ') + ')');
    var d1 = C.deriva(e, x), d2 = C.deriva(d1, x);
    var f = C.funzione(e, x), f1 = C.funzione(d1, x), f2 = C.funzione(d2, x);
    var r = { x: x, e: e, d1: d1, d2: d2, f: f, f1: f1, f2: f2 };
    /* dominio sull'intervallo: i tratti dove f e' finita */
    var N = 4000, h = (b - a) / N, tratti = [], dentro = false, ini = 0;
    for (var i = 0; i <= N; i++) {
      var xv = a + i * h, ok = isFinite(f(xv));
      if (ok && !dentro) { dentro = true; ini = xv; }
      if (!ok && dentro) { dentro = false; tratti.push([ini, xv - h]); }
    }
    if (dentro) tratti.push([ini, b]);
    r.dominio = tratti;
    r.zeri = C.zeri(f, a, b, N);
    var critici = C.zeri(f1, a, b, N);
    r.estremi = critici.map(function (c) {
      var s = Math.max(1e-6, Math.abs(c) * 1e-6), sx = f1(c - s * 50), dx = f1(c + s * 50);
      var tipo = sx > 0 && dx < 0 ? 'max' : sx < 0 && dx > 0 ? 'min' : 'sella';
      return { x: c, y: f(c), tipo: tipo };
    }).filter(function (p) { return isFinite(p.y); });
    r.flessi = C.zeri(f2, a, b, N).map(function (c) { return { x: c, y: f(c) }; }).filter(function (p) { return isFinite(p.y) && Math.abs(f2(p.x - 1e-4) * f2(p.x + 1e-4)) >= 0; });
    /* asintoti verticali: dove |f| esplode */
    r.verticali = [];
    var prev = Math.abs(f(a));
    for (i = 1; i < N; i++) {
      var x0 = a + i * h, y0 = Math.abs(f(x0)), y1 = Math.abs(f(x0 + h));
      if ((y0 >= prev && y0 >= y1 && y0 > 50) || (!isFinite(y0) && isFinite(prev))) {
        var c = isFinite(y0) ? massimoAbs(f, x0 - h, x0 + h) : x0;
        var v = Math.abs(f(c + 1e-9)), w = Math.abs(f(c - 1e-9));
        if ((v > 1e6 || w > 1e6) && !r.verticali.some(function (q) { return Math.abs(q - c) < h * 3; })) {
          var cr = +c.toPrecision(9);
          if (Math.abs(cr - Math.round(cr)) < 1e-6) cr = Math.round(cr);
          r.verticali.push(cr);
        }
      }
      prev = y0;
    }
    /* orizzontali / obliqui a ±∞ */
    r.infinito = [Infinity, -Infinity].map(function (s) {
      var m = C.aggancia(C.limite(C.semplifica(C.costruisci.div(e, C.simbolo(x))), x, s).valore);
      if (!isFinite(m)) return { lato: s, tipo: 'nessuno' };
      if (Math.abs(m) < 1e-7) { var L = C.limite(e, x, s).valore; return isFinite(L) ? { lato: s, tipo: 'orizzontale', q: Math.abs(L) < 1e-9 ? 0 : L } : { lato: s, tipo: 'nessuno' }; }
      var q = C.aggancia(C.limite(C.semplifica(C.costruisci.sub(e, C.costruisci.mul(C.num(m), C.simbolo(x)))), x, s, null, 9).valore);
      return isFinite(q) ? { lato: s, tipo: 'obliquo', m: m, q: Math.abs(q) < 1e-9 ? 0 : q } : { lato: s, tipo: 'nessuno' };
    });
    /* parita' */
    var pari = true, dispari = true, confronti = 0;
    [0.3, 0.77, 1.9, 2.6].forEach(function (v) { var p = f(v), q = f(-v); if (!isFinite(p) || !isFinite(q)) return; confronti++; if (Math.abs(p - q) > 1e-9 * (1 + Math.abs(p))) pari = false; if (Math.abs(p + q) > 1e-9 * (1 + Math.abs(p))) dispari = false; });
    if (confronti < 2) pari = dispari = false;
    r.simmetria = pari ? 'pari' : dispari ? 'dispari' : 'nessuna';
    return r;
  }

  function schedaStudio(div) {
    var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div');
    g.appendChild(pan); g.appendChild(dx); div.appendChild(g);
    pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: 'f(x) =' }));
    var inp = F.el('input', { type: 'text', value: '(x^2 - 1)/(x - 2)', 'aria-label': 'f(x)' }); pan.appendChild(inp);
    var es = F.el('div', { style: 'display:flex;flex-wrap:wrap;gap:4px;margin:6px 0' }); pan.appendChild(es);
    ['x^3 - 3x', 'x*e^(-x)', 'ln(x)/x', 'x^2*e^(-x^2)', '(x^2-1)/(x-2)', 'sin(x)/x', 'x/(x^2+1)', '1/(1+e^(-x))'].forEach(function (s) {
      es.appendChild(F.el('button', { type: 'button', 'class': 'bsiFX-bott', testo: s, onclick: function () { inp.value = s; calcola(); } }));
    });
    var a = -6, b = 6, x0 = 1, mostraD = { d1: true, d2: false };
    var ca = F.el('input', { type: 'number', value: a, step: 'any', 'aria-label': t('da', 'from') }), cb = F.el('input', { type: 'number', value: b, step: 'any', 'aria-label': t('a', 'to') });
    var riga = F.el('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:6px 0' }, [ca, cb]); pan.appendChild(riga);
    var cx0 = F.cursore(pan, ['Tangente in x₀', 'Tangent at x₀'], 0, 1000, 1, 583, function (v) { x0 = a + (b - a) * v / 1000; disegna(); }, function (v) { return (a + (b - a) * v / 1000).toFixed(2); });
    var chk = F.el('div', { style: 'display:flex;gap:12px;font-size:.82rem;color:#aebccd;margin:4px 0' });
    [['d1', "f′"], ['d2', "f″"]].forEach(function (p) {
      var c = F.el('input', { type: 'checkbox' }); c.checked = mostraD[p[0]];
      c.addEventListener('change', function () { mostraD[p[0]] = c.checked; disegna(); });
      chk.appendChild(F.el('label', null, [c, ' ' + p[1]]));
    });
    pan.appendChild(chk);
    var out = F.el('div', { 'class': 'bsiFX-nota', style: 'font-size:.86rem' }); pan.appendChild(out);
    var c = F.tela(dx, 0.62), tab = F.el('div'); dx.appendChild(tab);
    var R = null;
    function calcola() {
      a = +ca.value; b = +cb.value; if (!(b > a)) { b = a + 1; cb.value = b; }
      x0 = a + (b - a) * (+cx0.value) / 1000;
      try { R = studio(inp.value, a, b); } catch (err) { R = null; out.innerHTML = '<span class="bsiFX-ko">⚠ ' + esc(err.message) + '</span>'; tab.innerHTML = ''; return; }
      var x = R.x, h = '';
      h += '<div class="bsiFX-eq">f(' + x + ') = ' + C.html(R.e) + '<br>f′(' + x + ') = ' + C.html(R.d1) + '<br>f″(' + x + ') = ' + C.html(R.d2) + '</div>';
      out.innerHTML = h;
      var T = '<table class="bsiFX-tab">';
      T += '<tr><td>' + t('Dominio (in [', 'Domain (in [') + a + ', ' + b + '])</td><td>' + (R.dominio.length ? R.dominio.map(function (p) { return '[' + n4(p[0]) + ', ' + n4(p[1]) + ']'; }).join(' ∪ ') : '∅') + (R.verticali.length ? ' ' + t('esclusi ', 'excluding ') + R.verticali.map(n4).join(', ') : '') + '</td></tr>';
      T += '<tr><td>' + t('Simmetria', 'Symmetry') + '</td><td>' + (R.simmetria === 'pari' ? t('pari: f(−x) = f(x)', 'even: f(−x) = f(x)') : R.simmetria === 'dispari' ? t('dispari: f(−x) = −f(x)', 'odd: f(−x) = −f(x)') : t('né pari né dispari', 'neither even nor odd')) + '</td></tr>';
      T += '<tr><td>' + t('Zeri', 'Zeros') + '</td><td class="bsiFX-num">' + (R.zeri.length ? R.zeri.map(n4).join(' · ') : '—') + '</td></tr>';
      T += '<tr><td>' + t('Massimi', 'Maxima') + '</td><td class="bsiFX-num">' + (R.estremi.filter(function (p) { return p.tipo === 'max'; }).map(function (p) { return '(' + n4(p.x) + '; ' + n4(p.y) + ')'; }).join(' · ') || '—') + '</td></tr>';
      T += '<tr><td>' + t('Minimi', 'Minima') + '</td><td class="bsiFX-num">' + (R.estremi.filter(function (p) { return p.tipo === 'min'; }).map(function (p) { return '(' + n4(p.x) + '; ' + n4(p.y) + ')'; }).join(' · ') || '—') + '</td></tr>';
      T += '<tr><td>' + t('Flessi', 'Inflection points') + '</td><td class="bsiFX-num">' + (R.flessi.map(function (p) { return '(' + n4(p.x) + '; ' + n4(p.y) + ')'; }).join(' · ') || '—') + '</td></tr>';
      T += '<tr><td>' + t('Asintoti verticali', 'Vertical asymptotes') + '</td><td class="bsiFX-num">' + (R.verticali.map(function (v) { return x + ' = ' + n4(v); }).join(' · ') || '—') + '</td></tr>';
      R.infinito.forEach(function (s) {
        T += '<tr><td>' + (s.lato > 0 ? x + ' → +∞' : x + ' → −∞') + '</td><td class="bsiFX-num">' + (s.tipo === 'orizzontale' ? t('asintoto orizzontale y = ', 'horizontal asymptote y = ') + n4(s.q) : s.tipo === 'obliquo' ? t('asintoto obliquo y = ', 'oblique asymptote y = ') + (s.m === 1 ? '' : s.m === -1 ? '−' : n4(s.m)) + x + (s.q ? (s.q > 0 ? ' + ' : ' − ') + n4(Math.abs(s.q)) : '') : t('nessun asintoto', 'no asymptote')) + '</td></tr>';
      });
      tab.innerHTML = T + '</table><div class="bsiFX-nota">' + t('Derivate esatte (simboliche); zeri, estremi e flessi cercati numericamente nell’intervallo scelto, asintoti con i limiti.', 'Exact (symbolic) derivatives; zeros, extrema and inflections found numerically in the chosen interval, asymptotes from limits.') + '</div>';
      disegna();
    }
    function disegna() {
      if (!R) return;
      var s0 = C.campiona(R.f, a, b, 800), sy = C.scalaY([s0.y]), serie = [{ x: s0.x, y: C.spezza(s0.y, sy), col: '#5eead4', larg: 2.5 }], leg = [{ col: '#5eead4', etich: 'f' }];
      if (mostraD.d1) { var s1 = C.campiona(R.f1, a, b, 800); serie.push({ x: s1.x, y: C.spezza(s1.y, sy), col: '#ffd24a', larg: 1.5, tratt: true }); leg.push({ col: '#ffd24a', etich: "f′" }); }
      if (mostraD.d2) { var s2 = C.campiona(R.f2, a, b, 800); serie.push({ x: s2.x, y: C.spezza(s2.y, sy), col: '#ff8a80', larg: 1.2, tratt: true }); leg.push({ col: '#ff8a80', etich: "f″" }); }
      var y0 = R.f(x0), m = R.f1(x0);
      if (isFinite(y0) && isFinite(m)) serie.push({ x: [a, b], y: [y0 + m * (a - x0), y0 + m * (b - x0)], col: '#7c6fff', larg: 1.5 });
      var punti = R.zeri.map(function (z) { return { x: z, y: 0, col: '#5eead4', r: 4 }; })
        .concat(R.estremi.map(function (p) { return { x: p.x, y: p.y, col: p.tipo === 'max' ? '#ff8a80' : '#6bcfff', r: 5 }; }))
        .concat(R.flessi.map(function (p) { return { x: p.x, y: p.y, col: '#c9b6ff', r: 4 }; }));
      if (isFinite(y0)) punti.push({ x: x0, y: y0, col: '#7c6fff', r: 5 });
      var linee = [{ y: 0, col: '#34465f' }];
      R.infinito.forEach(function (s) { if (s.tipo === 'orizzontale') linee.push({ y: s.q, col: '#8494a8', etich: 'y = ' + n4(s.q) }); });
      var o = F.grafico(c, { serie: serie, punti: punti, linee: linee, xmin: a, xmax: b, ymin: sy.min, ymax: sy.max, xl: R.x, yl: 'y', legenda: leg });
      o.q.save(); o.q.strokeStyle = '#ff8a80'; o.q.setLineDash([3, 4]);
      R.verticali.forEach(function (v) { var px = o.X(v); o.q.beginPath(); o.q.moveTo(px, 14); o.q.lineTo(px, o.H - 40); o.q.stroke(); });
      o.q.restore();
      o.q.fillStyle = '#c9b6ff'; o.q.font = '12px system-ui'; o.q.textAlign = 'left';
      if (isFinite(y0) && isFinite(m)) o.q.fillText(t('tangente in x₀ = ', 'tangent at x₀ = ') + x0.toFixed(2) + ': y = ' + (+m.toFixed(3)) + '·(' + R.x + ' − ' + x0.toFixed(2) + ') ' + (y0 < 0 ? '− ' : '+ ') + (+Math.abs(y0).toFixed(3)), 62, 30);
    }
    inp.addEventListener('change', calcola); ca.addEventListener('change', calcola); cb.addEventListener('change', calcola);
    F.bottone(pan, ['Studia', 'Analyse'], calcola);
    calcola(); F.alRidimensiona(disegna);
  }

  /* ── le famiglie di funzioni ─────────────────────────────────────────── */
  var BASE = [
    ['x', 'x', ['retta: pendenza a·b, intercetta d − a·b·c', 'line: slope a·b, intercept d − a·b·c']],
    ['x^2', 'x²', ['parabola: vertice in (c, d), apertura a·b²', 'parabola: vertex at (c, d), opening a·b²']],
    ['x^3', 'x³', ['cubica: flesso in (c, d)', 'cubic: inflection at (c, d)']],
    ['sqrt(x)', '√x', ['radice: definita per x ≥ c', 'square root: defined for x ≥ c']],
    ['1/x', '1/x', ['iperbole: asintoti x = c e y = d', 'hyperbola: asymptotes x = c and y = d']],
    ['abs(x)', '|x|', ['valore assoluto: punta in (c, d)', 'absolute value: corner at (c, d)']],
    ['e^x', 'eˣ', ['esponenziale: asintoto y = d; con b < 0 decresce (decadimento)', 'exponential: asymptote y = d; with b < 0 it decays']],
    ['ln(x)', 'ln x', ['logaritmo: asintoto x = c; ln(b·…) = ln b + ln(…), quindi b trasla in verticale', 'logarithm: asymptote x = c; ln(b·…) = ln b + ln(…), so b shifts vertically']],
    ['sin(x)', 'sin x', ['seno: ampiezza |a|, periodo 2π/|b|, fase c, linea media d', 'sine: amplitude |a|, period 2π/|b|, phase c, midline d']],
    ['1/(1+e^(-x))', ['logistica', 'logistic'], ['logistica (curva di titolazione, crescita): metà altezza in x = c, ripidità b', 'logistic (titration curve, growth): half height at x = c, steepness b']],
    ['e^(-x^2)', ['gaussiana', 'Gaussian'], ['gaussiana (riga di uno spettro): centro c, larghezza 1/|b|', 'Gaussian (a spectral line): centre c, width 1/|b|']]
  ];
  function schedaFamiglie(div) {
    var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div');
    g.appendChild(pan); g.appendChild(dx); div.appendChild(g);
    var k = 1, P = { a: 1, b: 1, c: 0, d: 0 };
    F.scelta(pan, ['Funzione di base f(x)', 'Base function f(x)'], BASE.map(function (r, i) { return [String(i), r[1]]; }), '1', function (v) { k = +v; disegna(); });
    [['a', ['a · (allunga in verticale, ribalta se < 0)', 'a · (vertical stretch, flips if < 0)'], -3, 3], ['b', ['b · (comprime in orizzontale)', 'b · (horizontal squeeze)'], -3, 3], ['c', ['c (trasla a destra)', 'c (shift right)'], -5, 5], ['d', ['d (trasla in alto)', 'd (shift up)'], -5, 5]].forEach(function (q) {
      F.cursore(pan, q[1], q[2], q[3], 0.1, P[q[0]], function (v) { P[q[0]] = v; disegna(); }, function (v) { return v.toFixed(1); });
    });
    var eq = F.el('div', { 'class': 'bsiFX-eq' }), nota = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(eq); pan.appendChild(nota);
    var c = F.tela(dx, 0.62);
    function disegna() {
      var B = BASE[k], base = C.leggi(B[0]);
      var arg = C.semplifica(C.costruisci.mul(C.num(P.b), C.costruisci.sub(C.simbolo('x'), C.num(P.c))));
      var e = C.semplifica(C.costruisci.add(C.costruisci.mul(C.num(P.a), C.sostituisci(base, 'x', arg)), C.num(P.d)));
      var f0 = C.funzione(base), f = C.funzione(e);
      var s0 = C.campiona(f0, -8, 8, 800), s1 = C.campiona(f, -8, 8, 800);
      var sy = { min: -6, max: 6 };
      F.grafico(c, { serie: [{ x: s0.x, y: C.spezza(s0.y, sy), col: '#34465f', larg: 1.5, tratt: true }, { x: s1.x, y: C.spezza(s1.y, sy), col: '#5eead4', larg: 2.5 }],
        linee: [{ y: 0, col: '#34465f' }], xmin: -8, xmax: 8, ymin: sy.min, ymax: sy.max, xl: 'x', yl: 'y', legenda: [{ col: '#34465f', etich: 'f(x)' }, { col: '#5eead4', etich: 'a·f(b(x−c)) + d' }] });
      eq.innerHTML = 'y = ' + C.html(e);
      nota.textContent = F.tt(B[2]);
    }
    disegna(); F.alRidimensiona(disegna);
  }

  F.calcolo.funzioni = { studio: studio };

  F.sezione('smatfunz', {
    titolo: ['📈 Studio di funzione', '📈 Function analysis'],
    sotto: ['Scrivi f(x): dominio, simmetria, zeri, derivate esatte, massimi, minimi, flessi, asintoti e il grafico con la tangente. Poi le famiglie di funzioni e le loro trasformazioni.',
            'Type f(x): domain, symmetry, zeros, exact derivatives, maxima, minima, inflections, asymptotes and the graph with the tangent. Then function families and their transformations.'],
    schede: [
      { nome: ['Studio di funzione', 'Function analysis'], costruisci: schedaStudio },
      { nome: ['Famiglie e trasformazioni', 'Families and transformations'], costruisci: schedaFamiglie }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
