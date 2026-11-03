/* ═══════════════════════════════════════════════════════════════════════════
   bsi-mat-complessi.js — ℂ i numeri complessi e le serie di Fourier
   BioSpecInfo · © Samuele Pio Provenzano

   · NUMERI COMPLESSI: si scrivono come espressioni (3 + 4i, e^(i·pi/3),
     (1 + i)^8, sqrt(−4)…) e si calcolano davvero in ℂ, sull'albero del
     motore simbolico; il piano di Argand mostra somma (parallelogramma),
     prodotto (moduli che si moltiplicano, argomenti che si sommano) e le
     radici n-esime ai vertici di un poligono regolare.
   · LA FORMULA DI EULERO: e^(iθ) = cos θ + i sin θ — il punto che gira sul
     cerchio e le sue ombre, che sono coseno e seno. E' la matematica delle
     funzioni d'onda e della risonanza magnetica.
   · SERIE DI FOURIER: un'onda periodica come somma di seni e coseni; con
     N termini si vede la convergenza, il fenomeno di Gibbs (il 9 % di
     sovraelongazione che non sparisce) e l'uguaglianza di Parseval.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica, C = globale.BSIMatCAS;
  if (!F || !C) return;
  var t = F.t;
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  /* ── aritmetica complessa [re, im] ────────────────────────────────────── */
  var Z = {
    add: function (a, b) { return [a[0] + b[0], a[1] + b[1]]; },
    mul: function (a, b) { return [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]]; },
    div: function (a, b) { var d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; },
    abs: function (a) { return Math.hypot(a[0], a[1]); },
    arg: function (a) { return Math.atan2(a[1], a[0]); },
    exp: function (a) { var r = Math.exp(a[0]); return [r * Math.cos(a[1]), r * Math.sin(a[1])]; },
    ln: function (a) { return [Math.log(Math.hypot(a[0], a[1])), Math.atan2(a[1], a[0])]; },
    pow: function (a, b) {
      if (b[1] === 0 && b[0] % 1 === 0 && Math.abs(b[0]) <= 64) {
        var r = [1, 0], k = Math.abs(b[0]); for (var i = 0; i < k; i++) r = Z.mul(r, a);
        return b[0] < 0 ? Z.div([1, 0], r) : r;
      }
      if (a[0] === 0 && a[1] === 0) return [0, 0];
      return Z.exp(Z.mul(b, Z.ln(a)));
    }
  };
  function valutaZ(e) {
    switch (e.t) {
      case 'n': return [C.valuta(e), 0];
      case 's': if (e.n === 'i' || e.n === 'j') return [0, 1]; if (e.n === 'π') return [Math.PI, 0]; if (e.n === 'e') return [Math.E, 0]; throw new Error(t('simbolo sconosciuto: ', 'unknown symbol: ') + e.n);
      case '+': return e.a.map(valutaZ).reduce(Z.add);
      case '*': return e.a.map(valutaZ).reduce(Z.mul);
      case '^': return Z.pow(valutaZ(e.a[0]), valutaZ(e.a[1]));
      case 'f':
        var u = valutaZ(e.a[0]), iu = Z.mul([0, 1], u);
        switch (e.n) {
          case 'exp': return Z.exp(u);
          case 'ln': return Z.ln(u);
          case 'log': var l = Z.ln(u); return [l[0] / Math.LN10, l[1] / Math.LN10];
          case 'abs': return [Z.abs(u), 0];
          case 'cos': var p = Z.exp(iu), q = Z.exp([-iu[0], -iu[1]]); return [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
          case 'sin': var p2 = Z.exp(iu), q2 = Z.exp([-iu[0], -iu[1]]); return Z.div([p2[0] - q2[0], p2[1] - q2[1]], [0, 2]);
          case 'sinh': var a = Z.exp(u), b = Z.exp([-u[0], -u[1]]); return [(a[0] - b[0]) / 2, (a[1] - b[1]) / 2];
          case 'cosh': var a2 = Z.exp(u), b2 = Z.exp([-u[0], -u[1]]); return [(a2[0] + b2[0]) / 2, (a2[1] + b2[1]) / 2];
        }
        throw new Error(e.n + t(' non è disponibile in ℂ qui', ' is not available in ℂ here'));
    }
    throw new Error('?');
  }
  function leggiZ(s) { return valutaZ(C.leggi(String(s).replace(/(\d)\s*i\b/g, '$1*i'))); }
  function pulisci(v) { return Math.abs(v) < 1e-12 ? 0 : v; }
  function strZ(z) {
    var re = pulisci(z[0]), im = pulisci(z[1]), a = C.numeroBello(+re.toPrecision(10)).replace(/^-/, '−'), b = C.numeroBello(+Math.abs(im).toPrecision(10));
    if (!im) return a; if (!re) return (im < 0 ? '−' : '') + (b === '1' ? '' : b) + 'i';
    return a + (im < 0 ? ' − ' : ' + ') + (b === '1' ? '' : b) + 'i';
  }
  function strArg(th) {
    var k = C.rationalizza(th / Math.PI, 24);
    if (k && Math.abs(k[0] / k[1] * Math.PI - th) < 1e-9) { if (k[0] === 0) return '0'; return (k[0] < 0 ? '−' : '') + (Math.abs(k[0]) === 1 ? '' : Math.abs(k[0])) + 'π' + (k[1] === 1 ? '' : '/' + k[1]); }
    return th.toFixed(5);
  }
  function radici(z, n) {
    var r = Math.pow(Z.abs(z), 1 / n), th = Z.arg(z), out = [];
    for (var k = 0; k < n; k++) { var a = (th + 2 * Math.PI * k) / n; out.push([r * Math.cos(a), r * Math.sin(a)]); }
    return out;
  }

  function schedaComplessi(div) {
    var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div');
    g.appendChild(pan); g.appendChild(dx); div.appendChild(g);
    var n = 5;
    pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: 'z₁ =' })); var i1 = F.el('input', { type: 'text', value: '2 + i', 'aria-label': 'z₁' }); pan.appendChild(i1);
    pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: 'z₂ =' })); var i2 = F.el('input', { type: 'text', value: 'e^(i*pi/3)', 'aria-label': 'z₂' }); pan.appendChild(i2);
    var es = F.el('div', { style: 'display:flex;flex-wrap:wrap;gap:4px;margin:6px 0' }); pan.appendChild(es);
    [['e^(i*pi)', '1', t('identità di Eulero', 'Euler’s identity')], ['(1+i)^8', 'i', '(1 + i)⁸'], ['sqrt(-4)', '3 - 4i', '√(−4)'], ['i^i', '1', 'iⁱ'], ['3 + 4i', '1 - 2i', '3 + 4i']].forEach(function (p) {
      es.appendChild(F.el('button', { type: 'button', 'class': 'bsiFX-bott', testo: p[2], onclick: function () { i1.value = p[0]; i2.value = p[1]; calcola(); } }));
    });
    F.cursore(pan, ['Radici n-esime di z₁: n', 'n-th roots of z₁: n'], 2, 12, 1, n, function (v) { n = v; calcola(); });
    i1.addEventListener('change', calcola); i2.addEventListener('change', calcola);
    var out = F.el('div', { 'class': 'bsiFX-nota', style: 'font-size:.86rem' }); pan.appendChild(out);
    var c = F.tela(dx, 0.8);
    function calcola() {
      var z1, z2;
      try { z1 = leggiZ(i1.value); z2 = leggiZ(i2.value); } catch (err) { out.innerHTML = '<span class="bsiFX-ko">⚠ ' + esc(err.message) + '</span>'; return; }
      var s = Z.add(z1, z2), p = Z.mul(z1, z2), q = Z.div(z1, z2), R = radici(z1, n);
      out.innerHTML = '<table class="bsiFX-tab">' +
        '<tr><td>z₁</td><td class="bsiFX-num">' + strZ(z1) + '</td></tr><tr><td>z₂</td><td class="bsiFX-num">' + strZ(z2) + '</td></tr>' +
        '<tr><td>z₁ + z₂</td><td class="bsiFX-num">' + strZ(s) + '</td></tr><tr><td>z₁ · z₂</td><td class="bsiFX-num">' + strZ(p) + '</td></tr><tr><td>z₁ / z₂</td><td class="bsiFX-num">' + strZ(q) + '</td></tr>' +
        '<tr><td>z̄₁</td><td class="bsiFX-num">' + strZ([z1[0], -z1[1]]) + '</td></tr>' +
        '<tr><td>|z₁|, arg z₁</td><td class="bsiFX-num">' + C.numeroBello(+Z.abs(z1).toPrecision(10)) + ', ' + strArg(Z.arg(z1)) + ' (' + (Z.arg(z1) * 180 / Math.PI).toFixed(2) + '°)</td></tr>' +
        '<tr><td>' + t('forma polare', 'polar form') + '</td><td class="bsiFX-num">' + C.numeroBello(+Z.abs(z1).toPrecision(8)) + '·e^(i·' + strArg(Z.arg(z1)) + ')</td></tr></table>' +
        '<div class="bsiFX-nota">' + t('Nel prodotto i moduli si moltiplicano (', 'In the product the moduli multiply (') + Z.abs(z1).toFixed(3) + ' × ' + Z.abs(z2).toFixed(3) + ' = ' + Z.abs(p).toFixed(3) + t(') e gli argomenti si sommano: moltiplicare per e^(iφ) è ruotare di φ.', ') and the arguments add: multiplying by e^(iφ) is a rotation by φ.') + '</div>';
      var tutti = [z1, z2, s, p].concat(R), M = Math.max(1.5, Math.max.apply(null, tutti.map(Z.abs))) * 1.15;
      var o = F.grafico(c, { serie: [{ x: [-M, M], y: [0, 0], col: '#34465f' }, { x: [0, 0], y: [-M, M], col: '#34465f' }], xmin: -M * 1.25, xmax: M * 1.25, ymin: -M, ymax: M, xl: 'Re', yl: 'Im' }), qq = o.q;
      function vett(z, col, et, da) {
        da = da || [0, 0]; var a = [o.X(da[0]), o.Y(da[1])], b = [o.X(da[0] + z[0]), o.Y(da[1] + z[1])], an = Math.atan2(b[1] - a[1], b[0] - a[0]);
        qq.strokeStyle = col; qq.fillStyle = col; qq.lineWidth = 2.4; qq.beginPath(); qq.moveTo(a[0], a[1]); qq.lineTo(b[0], b[1]); qq.stroke();
        qq.beginPath(); qq.moveTo(b[0], b[1]); qq.lineTo(b[0] - 10 * Math.cos(an - 0.35), b[1] - 10 * Math.sin(an - 0.35)); qq.lineTo(b[0] - 10 * Math.cos(an + 0.35), b[1] - 10 * Math.sin(an + 0.35)); qq.closePath(); qq.fill();
        if (et) { qq.font = 'bold 12px system-ui'; qq.fillText(et, b[0] + 6, b[1] - 6); }
      }
      var ex = o.X(1) - o.X(0), ey = o.Y(0) - o.Y(1), rr = Math.pow(Z.abs(z1), 1 / n);
      qq.strokeStyle = 'rgba(159,177,198,.3)'; qq.setLineDash([2, 4]); qq.beginPath(); qq.ellipse(o.X(0), o.Y(0), ex, ey, 0, 0, 7); qq.stroke();
      qq.strokeStyle = 'rgba(107,207,255,.45)'; qq.setLineDash([5, 4]); qq.beginPath(); qq.ellipse(o.X(0), o.Y(0), ex * rr, ey * rr, 0, 0, 7); qq.stroke(); qq.setLineDash([]);
      vett(z2, 'rgba(255,210,74,.35)', '', z1); vett(z1, 'rgba(94,234,212,.35)', '', z2);
      vett(z1, '#5eead4', 'z₁'); vett(z2, '#ffd24a', 'z₂'); vett(s, '#c9b6ff', 'z₁+z₂'); vett(p, '#ff8a80', 'z₁·z₂');
      qq.strokeStyle = '#6bcfff'; qq.lineWidth = 1.5; qq.beginPath(); R.forEach(function (w, k) { if (k) qq.lineTo(o.X(w[0]), o.Y(w[1])); else qq.moveTo(o.X(w[0]), o.Y(w[1])); }); qq.closePath(); qq.stroke();
      R.forEach(function (w) { qq.fillStyle = '#6bcfff'; qq.beginPath(); qq.arc(o.X(w[0]), o.Y(w[1]), 4, 0, 7); qq.fill(); });
      qq.fillStyle = '#6bcfff'; qq.font = '12px system-ui'; qq.fillText(t('radici ', 'roots ') + n + t('-esime di z₁', 'th of z₁'), 60, 28);
    }
    calcola(); F.alRidimensiona(calcola);
  }

  function schedaEulero(div) {
    var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div');
    g.appendChild(pan); g.appendChild(dx); div.appendChild(g);
    var th = 1;
    F.cursore(pan, ['θ (radianti)', 'θ (radians)'], 0, 6.2832, 0.01, th, function (v) { th = v; disegna(); }, function (v) { return v.toFixed(2); });
    var info = F.el('div', { 'class': 'bsiFX-eq' }); pan.appendChild(info);
    pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', html: t('e<sup>iθ</sup> è un punto sul cerchio unitario: la sua ombra sull’asse reale è cos θ, sull’asse immaginario sin θ. Per θ = π: e<sup>iπ</sup> + 1 = 0. Le funzioni d’onda stazionarie oscillano come e<sup>−iEt/ħ</sup>, e un FID di risonanza magnetica è proprio questa rotazione vista di fianco.', 'e<sup>iθ</sup> is a point on the unit circle: its shadow on the real axis is cos θ, on the imaginary axis sin θ. For θ = π: e<sup>iπ</sup> + 1 = 0. Stationary wave functions oscillate as e<sup>−iEt/ħ</sup>, and an NMR FID is exactly this rotation seen side-on.') }));
    var c = F.tela(dx, 0.5);
    function disegna() {
      var o = F.grafico(c, { serie: [{ x: [0, 0], y: [0, 0], col: '#34465f' }], xmin: -1.4, xmax: 8, ymin: -1.3, ymax: 1.3 }), q = o.q;
      var X0 = o.X(0), Y0 = o.Y(0), r = o.X(1) - o.X(0), ry = o.Y(0) - o.Y(1);
      q.strokeStyle = '#34465f'; q.beginPath(); q.ellipse(X0, Y0, r, ry, 0, 0, 7); q.stroke();
      var px = o.X(Math.cos(th)), py = o.Y(Math.sin(th));
      q.strokeStyle = '#ffffff'; q.lineWidth = 2; q.beginPath(); q.moveTo(X0, Y0); q.lineTo(px, py); q.stroke();
      q.strokeStyle = '#5eead4'; q.beginPath(); q.moveTo(X0, Y0); q.lineTo(px, Y0); q.stroke();
      q.strokeStyle = '#ffd24a'; q.beginPath(); q.moveTo(px, Y0); q.lineTo(px, py); q.stroke();
      q.fillStyle = '#ffffff'; q.beginPath(); q.arc(px, py, 5, 0, 7); q.fill();
      var x0 = 1.8, sc = (8 - x0) / (2 * Math.PI);
      ['#5eead4', '#ffd24a'].forEach(function (col, k) {
        q.strokeStyle = col; q.lineWidth = 2; q.beginPath();
        for (var i = 0; i <= 300; i++) { var a = 2 * Math.PI * i / 300, y = k ? Math.sin(a) : Math.cos(a); if (i) q.lineTo(o.X(x0 + a * sc), o.Y(y)); else q.moveTo(o.X(x0 + a * sc), o.Y(y)); }
        q.stroke();
        var yv = k ? Math.sin(th) : Math.cos(th); q.fillStyle = col; q.beginPath(); q.arc(o.X(x0 + th * sc), o.Y(yv), 5, 0, 7); q.fill();
      });
      q.strokeStyle = 'rgba(255,210,74,.4)'; q.setLineDash([3, 4]); q.beginPath(); q.moveTo(px, py); q.lineTo(o.X(x0 + th * sc), py); q.stroke(); q.setLineDash([]);
      q.fillStyle = '#9fb1c6'; q.font = '12px system-ui'; q.fillText('cos θ', o.X(x0 + 0.1), o.Y(1.15)); q.fillStyle = '#ffd24a'; q.fillText('sin θ', o.X(x0 + 1.3), o.Y(1.15));
      info.innerHTML = 'e<sup>i·' + th.toFixed(2) + '</sup> = ' + Math.cos(th).toFixed(4) + (Math.sin(th) < 0 ? ' − ' : ' + ') + Math.abs(Math.sin(th)).toFixed(4) + 'i';
    }
    disegna(); F.alRidimensiona(disegna);
  }

  /* ── serie di Fourier su [−π, π] ──────────────────────────────────────── */
  var ONDE = {
    quadra: { nome: ['onda quadra', 'square wave'], f: function (x) { return x < 0 ? -1 : 1; }, b: function (n) { return n % 2 ? 4 / (Math.PI * n) : 0; } },
    dente: { nome: ['dente di sega', 'sawtooth'], f: function (x) { return x / Math.PI; }, b: function (n) { return 2 * (n % 2 ? 1 : -1) / (Math.PI * n); } },
    triangolo: { nome: ['onda triangolare', 'triangle wave'], f: function (x) { return 1 - 2 * Math.abs(x) / Math.PI; }, a: function (n) { return n % 2 ? 8 / (Math.PI * Math.PI * n * n) : 0; } },
    raddrizzata: { nome: ['seno raddrizzato |sin x|', 'rectified sine |sin x|'], f: function (x) { return Math.abs(Math.sin(x)); }, a0: 2 / Math.PI, a: function (n) { return n % 2 ? 0 : -4 / (Math.PI * (n * n - 1)); } }
  };
  function coefficienti(f, N) {
    var a = [], b = [];
    for (var n = 0; n <= N; n++) {
      a.push(C.integraleDefinito(function (x) { return f(x) * Math.cos(n * x); }, -Math.PI, 0, 1e-9).valore / Math.PI + C.integraleDefinito(function (x) { return f(x) * Math.cos(n * x); }, 0, Math.PI, 1e-9).valore / Math.PI);
      b.push(n ? C.integraleDefinito(function (x) { return f(x) * Math.sin(n * x); }, -Math.PI, 0, 1e-9).valore / Math.PI + C.integraleDefinito(function (x) { return f(x) * Math.sin(n * x); }, 0, Math.PI, 1e-9).valore / Math.PI : 0);
    }
    return { a: a, b: b };
  }
  function coeffOnda(k, N) {
    var O = ONDE[k], a = [], b = [];
    for (var n = 0; n <= N; n++) { a.push(n === 0 ? 2 * (O.a0 || 0) : (O.a ? O.a(n) : 0)); b.push(n && O.b ? O.b(n) : 0); }
    return { a: a, b: b };
  }
  function somma(cf, N, x) { var s = cf.a[0] / 2; for (var n = 1; n <= N; n++) s += cf.a[n] * Math.cos(n * x) + cf.b[n] * Math.sin(n * x); return s; }
  function schedaFourier(div) {
    var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div');
    g.appendChild(pan); g.appendChild(dx); div.appendChild(g);
    var k = 'quadra', N = 7, cf = null, f = null;
    F.scelta(pan, ['Onda', 'Wave'], Object.keys(ONDE).map(function (q) { return [q, ONDE[q].nome]; }).concat([['libera', ['f(x) scritta da te', 'your own f(x)']]]), k, function (v) { k = v; prepara(); });
    var inp = F.el('input', { type: 'text', value: 'x^2', 'aria-label': 'f(x)' }); pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('f(x) su [−π, π] (per «scritta da te»):', 'f(x) on [−π, π] (for «your own»):') })); pan.appendChild(inp);
    inp.addEventListener('change', function () { if (k === 'libera') prepara(); });
    F.cursore(pan, ['Numero di armoniche N', 'Number of harmonics N'], 1, 60, 1, N, function (v) { N = v; disegna(); });
    var info = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(info);
    var c = F.tela(dx, 0.5), c2 = F.tela(dx, 0.32);
    function prepara() {
      if (k === 'libera') {
        try { var fx = C.funzione(C.leggi(inp.value), 'x'); f = fx; cf = coefficienti(fx, 60); } catch (err) { info.innerHTML = '<span class="bsiFX-ko">⚠ ' + esc(err.message) + '</span>'; return; }
      } else { f = ONDE[k].f; cf = coeffOnda(k, 60); }
      disegna();
    }
    function disegna() {
      if (!cf) return;
      var xs = [], y0 = [], y1 = [];
      for (var i = 0; i <= 900; i++) { var x = -2 * Math.PI + 4 * Math.PI * i / 900, xr = ((x + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; xs.push(x); y0.push(f(xr)); y1.push(somma(cf, N, x)); }
      F.grafico(c, { serie: [{ x: xs, y: y0, col: '#34465f', larg: 3 }, { x: xs, y: y1, col: '#5eead4', larg: 2 }], xl: 'x', yl: 'f', legenda: [{ col: '#34465f', etich: 'f' }, { col: '#5eead4', etich: t('somma con N armoniche', 'sum of N harmonics') }] });
      var barre = []; for (var n = 1; n <= Math.max(N, 12); n++) barre.push({ x: n, y: Math.hypot(cf.a[n], cf.b[n]), col: n <= N ? '#ffd24a' : '#34465f', larg: 5 });
      F.grafico(c2, { barre: barre, xmin: 0, xmax: Math.max(N, 12) + 1, ymin: 0, xl: t('armonica n', 'harmonic n'), yl: '√(aₙ² + bₙ²)' });
      var mx = -Infinity; for (i = 0; i <= 4000; i++) { var v = somma(cf, N, -Math.PI + 2 * Math.PI * i / 4000); if (v > mx) mx = v; }
      var ener = 0; for (i = 0; i <= 2000; i++) { var xx = -Math.PI + 2 * Math.PI * i / 2000, ff = f(xx); ener += ff * ff * (i === 0 || i === 2000 ? 0.5 : 1); } ener *= (2 * Math.PI / 2000) / Math.PI;
      var parse = cf.a[0] * cf.a[0] / 2; for (n = 1; n <= N; n++) parse += cf.a[n] * cf.a[n] + cf.b[n] * cf.b[n];
      info.innerHTML = t('Coefficienti: ', 'Coefficients: ') + (k === 'quadra' ? 'bₙ = 4/(nπ) ' + t('per n dispari', 'for odd n') : k === 'dente' ? 'bₙ = 2(−1)ⁿ⁺¹/(nπ)' : k === 'triangolo' ? 'aₙ = 8/(n²π²) ' + t('per n dispari', 'for odd n') : k === 'raddrizzata' ? 'aₙ = −4/(π(n² − 1)) ' + t('per n pari', 'for even n') : t('calcolati numericamente (Simpson)', 'computed numerically (Simpson)')) +
        '<br>' + t('Parseval: (1/π)∫f² = ', 'Parseval: (1/π)∫f² = ') + ener.toFixed(4) + t(' · con N armoniche: ', ' · with N harmonics: ') + parse.toFixed(4) + ' (' + (100 * parse / ener).toFixed(2) + '%)' +
        (k === 'quadra' ? '<br>' + t('Massimo della somma: ', 'Maximum of the sum: ') + mx.toFixed(4) + t(' — il fenomeno di Gibbs: vicino al salto la somma supera il valore 1 di circa il 9% del salto, per quante armoniche si aggiungano.', ' — the Gibbs phenomenon: near the jump the sum overshoots 1 by about 9% of the jump, however many harmonics are added.') : '') +
        '<br>' + t('Più l’onda è liscia, più in fretta calano i coefficienti (quadra 1/n, triangolo 1/n²).', 'The smoother the wave, the faster the coefficients fall (square 1/n, triangle 1/n²).');
    }
    prepara(); F.alRidimensiona(disegna);
  }

  /* ── la sfera di Riemann (v238) ──────────────────────────────────────────
     Sfera unitaria, piano complesso z = x + iy come piano equatoriale, proiezione dal polo nord
     N = (0, 0, 1): z ↦ (2x, 2y, |z|² − 1)/(|z|² + 1), inversa (X, Y, Z) ↦ (X + iY)/(1 − Z), e ∞ ↦ N.
     Rette e cerchi del piano diventano cerchi sulla sfera (le rette: cerchi per N). Una rotazione
     di angolo θ attorno all'asse n e' la trasformazione di Möbius f(z) = (az + b)/(cz + d) con
     a = cos(θ/2) + i n_z sin(θ/2), b = (−n_y + i n_x) sin(θ/2), c = (n_y + i n_x) sin(θ/2),
     d = cos(θ/2) − i n_z sin(θ/2) (una matrice di SU(2)): proiettare, ruotare e riproiettare
     e' lo stesso che applicare f. */
  function stereo(z) { var r = z[0] * z[0] + z[1] * z[1]; return [2 * z[0] / (r + 1), 2 * z[1] / (r + 1), (r - 1) / (r + 1)]; }
  function stereoInv(P) { var d = 1 - P[2]; return d < 1e-15 ? null : [P[0] / d, P[1] / d]; }
  function mobiusRotazione(n, th) { var c = Math.cos(th / 2), s = Math.sin(th / 2); return { a: [c, n[2] * s], b: [-n[1] * s, n[0] * s], c: [n[1] * s, n[0] * s], d: [c, -n[2] * s] }; }
  function applicaMobius(M, z) { var num = Z.add(Z.mul(M.a, z), M.b), den = Z.add(Z.mul(M.c, z), M.d); /* il polo: il denominatore e' nullo rispetto al numeratore (con un angolo di π esatto cos(π/2) vale 6e-17, non 0) */
    var dn = Math.hypot(den[0], den[1]), nn = Math.hypot(num[0], num[1]); return dn < 1e-300 || dn < 1e-13 * nn ? null : Z.div(num, den); }
  function ruota3(n, th, p) { var c = Math.cos(th), s = Math.sin(th), d = n[0] * p[0] + n[1] * p[1] + n[2] * p[2], x = [n[1] * p[2] - n[2] * p[1], n[2] * p[0] - n[0] * p[2], n[0] * p[1] - n[1] * p[0]]; return [p[0] * c + x[0] * s + n[0] * d * (1 - c), p[1] * c + x[1] * s + n[1] * d * (1 - c), p[2] * c + x[2] * s + n[2] * d * (1 - c)]; }
  /* il cerchio immagine di una figura: piano per quattro punti dell'immagine (scarto dalla complanarita') */
  function complanarita(P) { var u = [P[1][0] - P[0][0], P[1][1] - P[0][1], P[1][2] - P[0][2]], v = [P[2][0] - P[0][0], P[2][1] - P[0][1], P[2][2] - P[0][2]], n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]], l = Math.hypot(n[0], n[1], n[2]) || 1, m = 0; for (var i = 3; i < P.length; i++) m = Math.max(m, Math.abs(((P[i][0] - P[0][0]) * n[0] + (P[i][1] - P[0][1]) * n[1] + (P[i][2] - P[0][2]) * n[2]) / l)); return m; }
  /* le figure del piano come elenco di curve, ciascuna una funzione s ∈ [0, 1] → z */
  function figure(tipo, z1, z2) {
    var out = [], k, L = 6;
    if (tipo === 'griglia') { for (k = -3; k <= 3; k++) { out.push({ col: 0x5eead4, f: (function (k) { return function (s) { return [k * 0.75, -L + 2 * L * s]; }; })(k) }); out.push({ col: 0xffd24a, f: (function (k) { return function (s) { return [-L + 2 * L * s, k * 0.75]; }; })(k) }); } }
    else if (tipo === 'polare') { [0.35, 0.7, 1, 1.5, 2.4].forEach(function (r) { out.push({ col: r === 1 ? 0xffffff : 0x5eead4, f: function (s) { return [r * Math.cos(2 * Math.PI * s), r * Math.sin(2 * Math.PI * s)]; } }); }); for (k = 0; k < 8; k++) out.push({ col: 0xffd24a, f: (function (k) { return function (s) { var r = Math.tan(s * Math.PI / 2 * 0.985), a = Math.PI * k / 4; return [r * Math.cos(a), r * Math.sin(a)]; }; })(k) }); }
    else if (tipo === 'retta') { var d = [z2[0] - z1[0], z2[1] - z1[1]], l = Math.hypot(d[0], d[1]) || 1; out.push({ col: 0xffd24a, f: function (s) { var q = Math.tan((s - 0.5) * Math.PI * 0.985); return [z1[0] + d[0] / l * q, z1[1] + d[1] / l * q]; } }); }
    else { var r0 = Math.hypot(z2[0] - z1[0], z2[1] - z1[1]); out.push({ col: 0xffd24a, f: function (s) { return [z1[0] + r0 * Math.cos(2 * Math.PI * s), z1[1] + r0 * Math.sin(2 * Math.PI * s)]; } }); }
    return out;
  }

  /* la scheda 3D: il pannello si costruisce subito (testo e comandi), la scena dopo, fuori dal gestore del clic */
  function scheda3d(costruisci, etichetta, rapporto) {
    return function (div) {
      var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'), posto = F.el('div');
      g.appendChild(pan); g.appendChild(dx); div.appendChild(g); dx.appendChild(posto);
      var vista = costruisci(pan, dx), lab = globale.BSILab3D;
      if (!lab) { posto.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('Serve il Laboratorio 3D (bsi-lab3d.js) per la vista tridimensionale.', 'The 3D Laboratory (bsi-lab3d.js) is needed for the three-dimensional view.') })); return; }
      var attesa = F.el('div', { 'class': 'bsiFX-nota', testo: t('Caricamento del motore 3D…', 'Loading the 3D engine…') }); posto.appendChild(attesa);
      lab.stile();
      lab.caricaThree().then(function () {
        setTimeout(function () {
          attesa.remove();
          var S = new lab.Scena(posto, rapporto || 0.72);
          S.box.setAttribute('role', 'group'); S.box.setAttribute('aria-label', F.tt(etichetta));
          globale.requestAnimationFrame(function () { try { vista(S, lab, globale.THREE); } catch (e) { if (globale.console) console.error(e); } div._scena = S; });
        }, 0);
      }).catch(function (e) { if (globale.console) console.error(e); attesa.textContent = t('Motore 3D non disponibile: ', '3D engine unavailable: ') + e.message; });
    };
  }
  function schedaRiemann(pan) {
    var st = { fig: 'griglia', asse: 'x', ang: 90, z0: '1 + i', z1: '-1 + i', z2: '2', pausa: false }, S = null, T = null, lab = null, ogg = {}, tempo = 0, ultimo = 0, P0 = [1, 1], Z1 = [-1, 1], Z2 = [2, 0], curve = [];
    var ASSI = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1], d: [1 / Math.sqrt(3), 1 / Math.sqrt(3), 1 / Math.sqrt(3)] };
    F.scelta(pan, ['Figura nel piano', 'Figure in the plane'], [['griglia', t('reticolo di rette', 'grid of lines')], ['polare', t('cerchi |z| = r e raggi', 'circles |z| = r and rays')], ['retta', t('la retta per z₁ e z₂', 'the line through z₁ and z₂')], ['cerchio', t('il cerchio di centro z₁ per z₂', 'the circle centred at z₁ through z₂')]], st.fig, function (v) { st.fig = v; scena(); });
    var campi = [['z₀ (' + t('un punto', 'a point') + ')', 'z0'], ['z₁', 'z1'], ['z₂', 'z2']].map(function (q) { var inp = F.el('input', { type: 'text', value: st[q[1]], 'aria-label': q[0], spellcheck: 'false', autocomplete: 'off' }); pan.appendChild(F.el('div', { 'class': 'bsiFX-cursore' }, [F.el('label', null, [F.el('span', { testo: q[0] })]), inp])); inp.addEventListener('change', function () { st[q[1]] = inp.value; leggi(); scena(); }); return inp; });
    F.scelta(pan, ['Asse della rotazione (Möbius)', 'Rotation axis (Möbius)'], [['x', t('asse reale (x)', 'real axis (x)')], ['y', t('asse immaginario (y)', 'imaginary axis (y)')], ['z', t('asse dei poli (z): f(z) = e^(iθ)z', 'polar axis (z): f(z) = e^(iθ)z')], ['d', t('diagonale (1, 1, 1)/√3', 'diagonal (1, 1, 1)/√3')]], st.asse, function (v) { st.asse = v; tempo = Math.min(tempo, 2.5); if (S) S.avvia(); });
    F.cursore(pan, ['angolo massimo θ (°)', 'maximum angle θ (°)'], 0, 360, 5, st.ang, function (v) { st.ang = v; if (S) S.avvia(); }, function (v) { return v + '°'; });
    var riga = F.el('div', { 'class': 'bsiFX-anim', role: 'group', 'aria-label': t('Controlli dell’animazione', 'Animation controls') });
    var bp = F.el('button', { type: 'button', testo: '❚❚', 'aria-label': t('Pausa', 'Pause'), onclick: function () { st.pausa = !st.pausa; bp.textContent = st.pausa ? '▶' : '❚❚'; bp.setAttribute('aria-label', st.pausa ? t('Avvia', 'Play') : t('Pausa', 'Pause')); if (S) S.avvia(); } });
    riga.appendChild(bp); riga.appendChild(F.el('button', { type: 'button', testo: '↺', 'aria-label': t('Ricomincia', 'Restart'), onclick: function () { tempo = 0; if (S) S.avvia(); } })); pan.appendChild(riga);
    var info = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(info);
    pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('Ogni punto z del piano complesso viene unito al polo nord N con un raggio: dove il raggio taglia la sfera c’è la sua immagine. Nei primi secondi le figure del piano salgono lungo questi raggi e si avvolgono sulla sfera: le rette diventano cerchi che passano per N (il punto all’infinito, ∞), i cerchi restano cerchi, il cerchio unitario diventa l’equatore e l’origine il polo sud. La proiezione stereografica conserva gli angoli (è conforme) e manda cerchi in cerchi. Poi la sfera ruota: riproiettata sul piano, la rotazione è una trasformazione di Möbius f(z) = (az + b)/(cz + d), e sotto si vede la figura del piano trasformata, in cui rette e cerchi si scambiano fra loro. Le rotazioni della sfera sono esattamente le Möbius con matrice in SU(2): qui la coincidenza è verificata punto per punto.',
      'Each point z of the complex plane is joined to the north pole N by a ray: where the ray meets the sphere lies its image. In the first seconds the plane figures rise along these rays and wrap onto the sphere: lines become circles through N (the point at infinity, ∞), circles stay circles, the unit circle becomes the equator and the origin the south pole. Stereographic projection preserves angles (it is conformal) and sends circles to circles. Then the sphere turns: projected back to the plane, the rotation is a Möbius transformation f(z) = (az + b)/(cz + d), and below you see the transformed plane figure, where lines and circles turn into each other. Rotations of the sphere are exactly the Möbius maps with a matrix in SU(2): here the match is checked point by point.') }));
    function leggi() {
      try { P0 = leggiZ(st.z0); Z1 = leggiZ(st.z1); Z2 = leggiZ(st.z2); if (![P0, Z1, Z2].every(function (z) { return isFinite(z[0]) && isFinite(z[1]); })) throw new Error(t('numero non finito', 'non-finite number')); info.dataset.errore = ''; }
      catch (e) { info.dataset.errore = t('Numero non valido: ', 'Invalid number: ') + e.message; }
      if (st.fig === 'cerchio' && Math.hypot(Z2[0] - Z1[0], Z2[1] - Z1[1]) < 1e-9) Z2 = [Z1[0] + 1, Z1[1]];
      if (st.fig === 'retta' && Math.hypot(Z2[0] - Z1[0], Z2[1] - Z1[1]) < 1e-9) Z2 = [Z1[0] + 1, Z1[1]];
    }
    var R = 2.4, H = 0;   /* raggio della sfera nella scena; il piano complesso e' z = 0 */
    function v3(p) { return new T.Vector3(p[0] * R, p[1] * R, p[2] * R); }
    function scena() {
      if (!S) return;
      S.pulisci(); ogg = {};
      S.aggiungi(new T.Mesh(new T.SphereGeometry(R, 64, 40), new T.MeshStandardMaterial({ color: 0x7c6fff, transparent: true, opacity: 0.18, roughness: 0.4, depthWrite: false })));
      ogg.globo = new T.LineSegments(new T.WireframeGeometry(new T.SphereGeometry(R * 1.001, 24, 12)), new T.LineBasicMaterial({ color: 0xc9b9ff, transparent: true, opacity: 0.12 })); S.aggiungi(ogg.globo);
      /* il piano complesso (quadrato di lato 2·3,2 unita') e gli assi Re, Im */
      var Lp = 2.6 * R; S.aggiungi(new T.Mesh(new T.PlaneGeometry(2 * Lp, 2 * Lp), new T.MeshBasicMaterial({ color: 0x1a3050, transparent: true, opacity: 0.35, side: T.DoubleSide, depthWrite: false })));
      S.aggiungi(lab.linea(T, [[-Lp, 0, H], [Lp, 0, H]], 0x8494a8, 0.7)); S.aggiungi(lab.linea(T, [[0, -Lp, H], [0, Lp, H]], 0x8494a8, 0.7));
      var eRe = lab.testo3d(T, 'Re', '#9fb1c6', 0.3); eRe.position.set(Lp * 1.04, 0, 0.1); S.aggiungi(eRe); var eIm = lab.testo3d(T, 'Im', '#9fb1c6', 0.3); eIm.position.set(0, Lp * 1.04, 0.1); S.aggiungi(eIm);
      S.aggiungi(lab.sfera(T, 0.08, 0xffffff, 0, 0, R, true)); var eN = lab.testo3d(T, 'N = ∞', '#e6fffb', 0.3); eN.position.set(0.35, 0, R + 0.3); S.aggiungi(eN);
      /* le curve: campionate in parametro; ogni curva ha tre oggetti (sulla sfera, nel piano, l'immagine di Möbius nel piano) */
      curve = figure(st.fig, Z1, Z2).map(function (c) {
        var n = 360, zs = []; for (var i = 0; i <= n; i++) zs.push(c.f(i / n));
        var mk = function (col, op) { var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(new Float32Array(n * 6), 3)); var l = new T.LineSegments(g, new T.LineBasicMaterial({ color: col, transparent: true, opacity: op })); l.frustumCulled = false; S.aggiungi(l); return l; };
        return { zs: zs, P: zs.map(stereo), sfera: mk(c.col, 1), immagine: mk(c.col, 0.85) };
      });
      ogg.p0 = lab.sfera(T, 0.11, 0xff6b6b, 0, 0, 0, true); ogg.q0 = lab.sfera(T, 0.09, 0xff6b6b, 0, 0, 0, false); ogg.raggio = lab.linea(T, [[0, 0, R], [0, 0, 0]], 0xff8a80, 0.8); ogg.f0 = lab.sfera(T, 0.09, 0xffffff, 0, 0, 0, false);
      [ogg.p0, ogg.q0, ogg.raggio, ogg.f0].forEach(function (o) { S.aggiungi(o); });
      ogg.asse = lab.linea(T, [[0, 0, 0], [0, 0, 0]], 0xff9f43, 0.9); S.aggiungi(ogg.asse);
      S.didascalia.textContent = t('sfera di Riemann sopra il piano complesso', 'Riemann sphere over the complex plane');
      if (!S.vistaIniziale) S.inquadra(19, -0.75, 1.1);
      S.ogniFotogramma(function (dt) { if (st.pausa) return false; tempo += dt; aggiorna(dt); });
      aggiorna(0);
    }
    /* il tempo: 0–2,5 s sollevamento lungo i raggi; poi θ(t) oscilla fra 0 e θmax con periodo 8 s */
    function fasi() { var lam = Math.min(1, tempo / 2.5), u = tempo > 2.5 ? tempo - 2.5 : 0; lam = lam * lam * (3 - 2 * lam); return { lam: lam, th: st.ang * RAD3 * (0.5 - 0.5 * Math.cos(2 * Math.PI * u / 8)) }; }
    var RAD3 = Math.PI / 180, LIM = 2.6;
    /* i complessi nel pannello con quattro cifre */
    function z4(z) { return strZ([+z[0].toFixed(4), +z[1].toFixed(4)]); }
    function aggiorna(dt) {
      if (!S || !curve.length) return;
      var F0 = fasi(), n = ASSI[st.asse], M = mobiusRotazione(n, F0.th), maxErr = 0;
      curve.forEach(function (c) {
        var ps = c.sfera.geometry.attributes.position, pi = c.immagine.geometry.attributes.position, k = 0, m = 0, prec = null, precW = null;
        for (var i = 0; i < c.zs.length; i++) {
          var z = c.zs[i], P = c.P[i], q = [(1 - F0.lam) * z[0] + F0.lam * P[0], (1 - F0.lam) * z[1] + F0.lam * P[1], F0.lam * P[2]], r = F0.lam >= 1 ? ruota3(n, F0.th, P) : q;
          /* nel piano: l'immagine di Möbius (f(z) direttamente), tagliata dove esce dal quadrato */
          var w = F0.lam >= 1 ? applicaMobius(M, z) : null, wv = w && Math.abs(w[0]) < LIM && Math.abs(w[1]) < LIM ? [w[0], w[1], 0.005] : null;
          if (w && i % 20 === 0) { var Pw = stereo(w); maxErr = Math.max(maxErr, Math.hypot(Pw[0] - r[0], Pw[1] - r[1], Pw[2] - r[2])); }
          var plane = Math.abs(q[0]) < LIM && Math.abs(q[1]) < LIM || F0.lam > 0.4;
          if (prec && plane) { ps.setXYZ(k++, prec[0] * R, prec[1] * R, prec[2] * R); ps.setXYZ(k++, r[0] * R, r[1] * R, r[2] * R); }
          if (precW && wv) { pi.setXYZ(m++, precW[0] * R, precW[1] * R, precW[2] * R); pi.setXYZ(m++, wv[0] * R, wv[1] * R, wv[2] * R); }
          prec = plane ? r : null; precW = wv;
        }
        ps.needsUpdate = pi.needsUpdate = true; c.sfera.geometry.setDrawRange(0, k); c.immagine.geometry.setDrawRange(0, m);
      });
      /* il punto z₀, la sua immagine sulla sfera, il raggio da N e il punto f(z₀) */
      var P = stereo(P0), Pr = ruota3(n, F0.th, P), fz = applicaMobius(M, P0);
      ogg.q0.position.set(P0[0] * R, P0[1] * R, 0); ogg.p0.position.copy(v3(F0.lam >= 1 ? Pr : [(1 - F0.lam) * P0[0] + F0.lam * P[0], (1 - F0.lam) * P0[1] + F0.lam * P[1], F0.lam * P[2]]));
      ogg.raggio.geometry.setFromPoints([new T.Vector3(0, 0, R), new T.Vector3(P0[0] * R, P0[1] * R, 0)]);
      ogg.f0.visible = !!(fz && F0.lam >= 1 && Math.abs(fz[0]) < LIM && Math.abs(fz[1]) < LIM); if (ogg.f0.visible) ogg.f0.position.set(fz[0] * R, fz[1] * R, 0.01);
      ogg.asse.visible = F0.lam >= 1; ogg.asse.geometry.setFromPoints([new T.Vector3(-n[0] * R * 1.4, -n[1] * R * 1.4, -n[2] * R * 1.4), new T.Vector3(n[0] * R * 1.4, n[1] * R * 1.4, n[2] * R * 1.4)]);
      ogg.globo.setRotationFromAxisAngle(new T.Vector3(n[0], n[1], n[2]), F0.lam >= 1 ? F0.th : 0);
      var ora = Date.now(); if (dt && ora - ultimo < 250) return; ultimo = ora;
      var cop = complanarita(curve[0].P.filter(function (p, i) { return i % 30 === 0; }));
      info.innerHTML = (info.dataset.errore ? '<span class="bsiFX-ko">' + info.dataset.errore + '</span><br>' : '') +
        'z₀ = ' + strZ(P0) + ' → ' + t('sulla sfera ', 'on the sphere ') + '(' + P.map(function (v) { return v.toFixed(3); }).join(', ') + ')<br>' +
        'θ = <b class="bsiFX-num">' + (F0.th / RAD3).toFixed(1) + '°</b> · f(z) = (az + b)/(cz + d), a = ' + z4(M.a) + ', b = ' + z4(M.b) + ', c = ' + z4(M.c) + ', d = ' + z4(M.d) + '<br>' +
        'f(z₀) = <b class="bsiFX-num">' + (fz ? z4(fz) : '∞') + '</b><br>' +
        t('rotazione della sfera contro Möbius nel piano: scarto max ', 'sphere rotation versus Möbius in the plane: max gap ') + maxErr.toExponential(1) + ' · ' + t('complanarità del primo cerchio ', 'coplanarity of the first circle ') + cop.toExponential(1);
    }
    leggi();
    return function (Sc, L3, Tr) { S = Sc; lab = L3; T = Tr; scena(); };
  }

  F.calcolo.complessi = { Z: Z, valutaZ: valutaZ, leggiZ: leggiZ, strZ: strZ, radici: radici, coefficienti: coefficienti, coeffOnda: coeffOnda, somma: somma, ONDE: ONDE, stereo: stereo, stereoInv: stereoInv, mobiusRotazione: mobiusRotazione, applicaMobius: applicaMobius, ruota3: ruota3, complanarita: complanarita, figure: figure };

  F.sezione('smatcompl', {
    titolo: ['ℂ Complessi e Fourier', 'ℂ Complex numbers and Fourier'],
    sotto: ['I numeri complessi sul piano di Argand (somma, prodotto come rotazione, radici n-esime), la formula di Eulero che lega esponenziale e trigonometria, e le serie di Fourier con convergenza, fenomeno di Gibbs e Parseval.',
            'Complex numbers on the Argand plane (sum, product as rotation, n-th roots), Euler’s formula linking exponential and trigonometry, and Fourier series with convergence, the Gibbs phenomenon and Parseval.'],
    schede: [
      { nome: ['Numeri complessi', 'Complex numbers'], costruisci: schedaComplessi },
      { nome: ['Formula di Eulero', 'Euler’s formula'], costruisci: schedaEulero },
      { nome: ['Serie di Fourier', 'Fourier series'], costruisci: schedaFourier },
      { nome: ['🧊 Sfera di Riemann', '🧊 Riemann sphere'], costruisci: scheda3d(schedaRiemann, ['Sfera di Riemann: proiezione stereografica del piano complesso e trasformazione di Möbius che la ruota', 'Riemann sphere: stereographic projection of the complex plane and a Möbius transformation rotating it']) }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
