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

  F.calcolo.complessi = { Z: Z, valutaZ: valutaZ, leggiZ: leggiZ, strZ: strZ, radici: radici, coefficienti: coefficienti, coeffOnda: coeffOnda, somma: somma, ONDE: ONDE };

  F.sezione('smatcompl', {
    titolo: ['ℂ Complessi e Fourier', 'ℂ Complex numbers and Fourier'],
    sotto: ['I numeri complessi sul piano di Argand (somma, prodotto come rotazione, radici n-esime), la formula di Eulero che lega esponenziale e trigonometria, e le serie di Fourier con convergenza, fenomeno di Gibbs e Parseval.',
            'Complex numbers on the Argand plane (sum, product as rotation, n-th roots), Euler’s formula linking exponential and trigonometry, and Fourier series with convergence, the Gibbs phenomenon and Parseval.'],
    schede: [
      { nome: ['Numeri complessi', 'Complex numbers'], costruisci: schedaComplessi },
      { nome: ['Formula di Eulero', 'Euler’s formula'], costruisci: schedaEulero },
      { nome: ['Serie di Fourier', 'Fourier series'], costruisci: schedaFourier }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
