/* ═══════════════════════════════════════════════════════════════════════════
   bsi-mat-ode.js — 🌀 le equazioni differenziali
   BioSpecInfo · © Samuele Pio Provenzano

   · CAMPO DI DIREZIONI: per y′ = f(x, y) si disegna in ogni punto la
     pendenza; toccando il grafico parte la soluzione che passa di li'
     (Runge-Kutta 4, in avanti e all'indietro).
   · METODI NUMERICI: Eulero, Heun e RK4 su y′ = y contro la soluzione
     esatta eˣ: dimezzando il passo l'errore cala di 2, 4 e 16 volte —
     l'ORDINE del metodo si vede nei numeri.
   · PIANO DELLE FASI: sistemi x′ = f(x, y), y′ = g(x, y) — preda e
     predatore, oscillatori, pendolo, Van der Pol, il Bruxellatore,
     l'epidemia SIR. I punti di equilibrio si trovano con Newton sullo
     jacobiano SIMBOLICO e si classificano dai suoi autovalori (nodo,
     sella, fuoco, centro).
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica, C = globale.BSIMatCAS;
  if (!F || !C) return;
  var t = F.t;
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function f2(e) { var c = C.compila(e), amb = { x: 0, y: 0 }; return function (x, y) { amb.x = x; amb.y = y; return c(amb); }; }
  function leggiXY(s) {
    var e = C.leggi(s), vs = C.simboli(e).filter(function (v) { return v !== 'x' && v !== 'y'; });
    if (vs.length) throw new Error(t('usa solo x e y (trovato: ', 'use only x and y (found: ') + vs.join(', ') + ')');
    return e;
  }
  /* un passo dei tre metodi per y′ = f(x, y) */
  var METODI = {
    eulero: function (f, x, y, h) { return y + h * f(x, y); },
    heun: function (f, x, y, h) { var k1 = f(x, y), k2 = f(x + h, y + h * k1); return y + h / 2 * (k1 + k2); },
    rk4: function (f, x, y, h) { var k1 = f(x, y), k2 = f(x + h / 2, y + h / 2 * k1), k3 = f(x + h / 2, y + h / 2 * k2), k4 = f(x + h, y + h * k3); return y + h / 6 * (k1 + 2 * k2 + 2 * k3 + k4); }
  };
  function integra1(f, x0, y0, x1, n, metodo) {
    var h = (x1 - x0) / n, x = x0, y = y0, xs = [x], ys = [y], m = METODI[metodo || 'rk4'];
    for (var i = 0; i < n; i++) { y = m(f, x, y, h); x = x0 + (i + 1) * h; if (!isFinite(y) || Math.abs(y) > 1e6) break; xs.push(x); ys.push(y); }
    return { x: xs, y: ys };
  }
  /* sistema 2D con RK4 */
  function traiettoria(fx, fy, x0, y0, T, n) {
    var h = T / n, x = x0, y = y0, out = { t: [0], x: [x], y: [y] };
    for (var i = 0; i < n; i++) {
      var a1 = fx(x, y), b1 = fy(x, y), a2 = fx(x + h / 2 * a1, y + h / 2 * b1), b2 = fy(x + h / 2 * a1, y + h / 2 * b1),
          a3 = fx(x + h / 2 * a2, y + h / 2 * b2), b3 = fy(x + h / 2 * a2, y + h / 2 * b2), a4 = fx(x + h * a3, y + h * b3), b4 = fy(x + h * a3, y + h * b3);
      x += h / 6 * (a1 + 2 * a2 + 2 * a3 + a4); y += h / 6 * (b1 + 2 * b2 + 2 * b3 + b4);
      if (!isFinite(x) || !isFinite(y) || Math.abs(x) > 1e4 || Math.abs(y) > 1e4) break;
      out.t.push((i + 1) * h); out.x.push(x); out.y.push(y);
    }
    return out;
  }
  /* equilibri: Newton dallo jacobiano simbolico, partendo da una griglia */
  function equilibri(ef, eg, box) {
    var fx = f2(ef), fy = f2(eg), J = [[f2(C.deriva(ef, 'x')), f2(C.deriva(ef, 'y'))], [f2(C.deriva(eg, 'x')), f2(C.deriva(eg, 'y'))]];
    var trovati = [];
    for (var i = 0; i <= 8; i++) for (var j = 0; j <= 8; j++) {
      var x = box[0] + (box[1] - box[0]) * i / 8, y = box[2] + (box[3] - box[2]) * j / 8;
      for (var k = 0; k < 40; k++) {
        var F1 = fx(x, y), F2 = fy(x, y), a = J[0][0](x, y), b = J[0][1](x, y), c = J[1][0](x, y), d = J[1][1](x, y), det = a * d - b * c;
        if (!isFinite(det) || Math.abs(det) < 1e-14) break;
        var dx = (d * F1 - b * F2) / det, dy = (a * F2 - c * F1) / det;
        x -= dx; y -= dy;
        if (Math.abs(dx) + Math.abs(dy) < 1e-12) break;
      }
      if (!isFinite(x) || !isFinite(y) || Math.abs(fx(x, y)) + Math.abs(fy(x, y)) > 1e-9) continue;
      if (x < box[0] - 1e-9 || x > box[1] + 1e-9 || y < box[2] - 1e-9 || y > box[3] + 1e-9) continue;
      if (trovati.some(function (p) { return Math.hypot(p.x - x, p.y - y) < 1e-6; })) continue;
      trovati.push({ x: Math.abs(x) < 1e-12 ? 0 : x, y: Math.abs(y) < 1e-12 ? 0 : y });
    }
    trovati.forEach(function (p) {
      var a = J[0][0](p.x, p.y), b = J[0][1](p.x, p.y), c = J[1][0](p.x, p.y), d = J[1][1](p.x, p.y);
      p.J = [[a, b], [c, d]]; p.tipo = classifica(a + d, a * d - b * c);
    });
    /* tanti equilibri degeneri in fila sono una curva di equilibri (in SIR: tutta la retta I = 0) */
    var deg = trovati.filter(function (p) { return p.tipo === 'degenere'; });
    if (deg.length >= 4) trovati = trovati.filter(function (p) { return p.tipo !== 'degenere'; }).concat([{ x: deg[0].x, y: deg[0].y, tipo: 'curva', punti: deg }]);
    return trovati;
  }
  function classifica(tr, det) {
    var disc = tr * tr - 4 * det, eps = 1e-9 * (1 + Math.abs(tr) + Math.abs(det));
    if (det < -eps) return 'sella';
    if (Math.abs(det) <= eps) return 'degenere';
    if (Math.abs(tr) <= eps) return 'centro';
    if (disc < 0) return tr < 0 ? 'fuoco stabile' : 'fuoco instabile';
    return tr < 0 ? 'nodo stabile' : 'nodo instabile';
  }
  var NOMI_TIPO = {
    sella: ['sella (instabile)', 'saddle (unstable)'], curva: ['una curva intera di equilibri (det J = 0)', 'a whole curve of equilibria (det J = 0)'], degenere: ['degenere (det J = 0)', 'degenerate (det J = 0)'], centro: ['centro (orbite chiuse, nel lineare)', 'centre (closed orbits, linearised)'],
    'fuoco stabile': ['fuoco stabile (spirale entrante)', 'stable focus (inward spiral)'], 'fuoco instabile': ['fuoco instabile (spirale uscente)', 'unstable focus (outward spiral)'],
    'nodo stabile': ['nodo stabile', 'stable node'], 'nodo instabile': ['nodo instabile', 'unstable node']
  };

  /* coordinate di un tocco sulla tela → coordinate del grafico */
  function inverso(o, xmin, xmax, ymin, ymax) {
    var x0 = o.X(xmin), x1 = o.X(xmax), y0 = o.Y(ymin), y1 = o.Y(ymax);
    return function (px, py) { return [xmin + (px - x0) / (x1 - x0) * (xmax - xmin), ymin + (py - y0) / (y1 - y0) * (ymax - ymin)]; };
  }
  function tocco(c, cb) {
    c.style.cursor = 'crosshair';
    c.addEventListener('click', function (ev) { var r = c.getBoundingClientRect(); cb(ev.clientX - r.left, ev.clientY - r.top); });
  }

  /* ── campo di direzioni ───────────────────────────────────────────────── */
  function schedaCampo(div) {
    var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div');
    g.appendChild(pan); g.appendChild(dx); div.appendChild(g);
    pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: "y′ = f(x, y) =" }));
    var inp = F.el('input', { type: 'text', value: 'y*(1 - y)', 'aria-label': 'f(x, y)' }); pan.appendChild(inp);
    var es = F.el('div', { style: 'display:flex;flex-wrap:wrap;gap:4px;margin:6px 0' }); pan.appendChild(es);
    [['y*(1 - y)', t('logistica', 'logistic')], ['-0.5*y', t('decadimento 1° ordine', 'first-order decay')], ['x - y', 'x − y'], ['sin(x) - y', t('forzante', 'forced')], ['-x/y', t('cerchi', 'circles')], ['y - x^2', 'y − x²'], ['x^2 + y^2', 'x² + y²'], ['-y^2', t('2° ordine: −k[A]²', 'second order: −k[A]²')]].forEach(function (p) {
      es.appendChild(F.el('button', { type: 'button', 'class': 'bsiFX-bott', testo: p[1], onclick: function () { inp.value = p[0]; curve = []; calcola(); } }));
    });
    var info = F.el('div', { 'class': 'bsiFX-nota', testo: t('Tocca il grafico per far partire una soluzione da quel punto.', 'Tap the chart to start a solution from that point.') });
    pan.appendChild(info);
    F.bottone(pan, ['Cancella le curve', 'Clear the curves'], function () { curve = []; disegna(); });
    var c = F.tela(dx, 0.7), f = null, curve = [[0, 0.1], [0, 1.6], [-1, -0.05]], B = [-3, 5, -1.5, 2.5], inv = null;
    inp.addEventListener('change', function () { curve = []; calcola(); });
    tocco(c, function (px, py) { if (!inv) return; curve.push(inv(px, py)); disegna(); });
    function calcola() {
      try { f = f2(leggiXY(inp.value)); info.classList.remove('bsiFX-ko'); } catch (err) { f = null; info.textContent = '⚠ ' + err.message; info.classList.add('bsiFX-ko'); return; }
      disegna();
    }
    function disegna() {
      if (!f) return;
      var o = F.grafico(c, { serie: [{ x: [B[0], B[1]], y: [0, 0], col: '#1d2f49' }], xmin: B[0], xmax: B[1], ymin: B[2], ymax: B[3], xl: 'x', yl: 'y' }), q = o.q;
      inv = inverso(o, B[0], B[1], B[2], B[3]);
      q.save(); q.beginPath(); q.rect(54, 14, o.W - 68, o.H - 54); q.clip();
      var nx = 26, ny = 18, sx = (o.X(B[1]) - o.X(B[0])) / nx, L = sx * 0.36;
      q.strokeStyle = 'rgba(159,177,198,.55)'; q.lineWidth = 1.2;
      for (var i = 0; i <= nx; i++) for (var j = 0; j <= ny; j++) {
        var x = B[0] + (B[1] - B[0]) * i / nx, y = B[2] + (B[3] - B[2]) * j / ny, m = f(x, y);
        if (!isFinite(m)) continue;
        var dxp = o.X(x + 1) - o.X(x), dyp = o.Y(y + m) - o.Y(y), n = Math.hypot(dxp, dyp) || 1;
        q.beginPath(); q.moveTo(o.X(x) - dxp / n * L, o.Y(y) - dyp / n * L); q.lineTo(o.X(x) + dxp / n * L, o.Y(y) + dyp / n * L); q.stroke();
      }
      var COL = ['#5eead4', '#ffd24a', '#ff8a80', '#7c6fff', '#6bcfff', '#c9b6ff'];
      curve.forEach(function (p, k) {
        q.strokeStyle = COL[k % COL.length]; q.lineWidth = 2.4;
        [integra1(f, p[0], p[1], B[1], 600), integra1(f, p[0], p[1], B[0], 600)].forEach(function (s) {
          q.beginPath(); s.x.forEach(function (x, i) { var Y = o.Y(s.y[i]); if (i) q.lineTo(o.X(x), Y); else q.moveTo(o.X(x), Y); }); q.stroke();
        });
        q.fillStyle = COL[k % COL.length]; q.beginPath(); q.arc(o.X(p[0]), o.Y(p[1]), 4, 0, 7); q.fill();
      });
      q.restore();
    }
    calcola(); F.alRidimensiona(disegna);
  }

  /* ── confronto dei metodi ─────────────────────────────────────────────── */
  function errori(n) {
    var f = function (x, y) { return y; }, out = {};
    Object.keys(METODI).forEach(function (m) { var s = integra1(f, 0, 1, 1, n, m); out[m] = Math.abs(s.y[s.y.length - 1] - Math.E); });
    return out;
  }
  function schedaMetodi(div) {
    var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div');
    g.appendChild(pan); g.appendChild(dx); div.appendChild(g);
    var n = 4;
    pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', html: t('Problema: <b>y′ = y, y(0) = 1</b> fino a x = 1. Soluzione esatta y = eˣ, quindi y(1) = e.', 'Problem: <b>y′ = y, y(0) = 1</b> up to x = 1. Exact solution y = eˣ, so y(1) = e.') }));
    F.cursore(pan, ['Numero di passi n (h = 1/n)', 'Number of steps n (h = 1/n)'], 1, 64, 1, n, function (v) { n = v; disegna(); });
    var tab = F.el('div'); pan.appendChild(tab);
    var c = F.tela(dx, 0.6);
    function disegna() {
      var f = function (x, y) { return y; }, COL = { eulero: '#ff8a80', heun: '#ffd24a', rk4: '#5eead4' }, serie = [], xs = [], ye = [];
      for (var i = 0; i <= 100; i++) { xs.push(i / 100); ye.push(Math.exp(i / 100)); }
      serie.push({ x: xs, y: ye, col: '#8494a8', larg: 4 });
      Object.keys(METODI).forEach(function (m) { var s = integra1(f, 0, 1, 1, n, m); serie.push({ x: s.x, y: s.y, col: COL[m], larg: 2 }); });
      F.grafico(c, { serie: serie, punti: [], xmin: 0, xmax: 1, xl: 'x', yl: 'y', legenda: [{ col: '#8494a8', etich: 'eˣ' }, { col: COL.eulero, etich: 'Euler' }, { col: COL.heun, etich: 'Heun' }, { col: COL.rk4, etich: 'RK4' }] });
      var e1 = errori(n), e2 = errori(2 * n);
      tab.innerHTML = '<table class="bsiFX-tab"><tr><th>' + t('metodo', 'method') + '</th><th>' + t('errore in x = 1', 'error at x = 1') + '</th><th>' + t('÷ con passo dimezzato', '÷ with half the step') + '</th></tr>' +
        [['eulero', 'Eulero', 1], ['heun', 'Heun', 2], ['rk4', 'Runge-Kutta 4', 4]].map(function (r) { return '<tr><td>' + r[1] + ' (' + t('ordine ', 'order ') + r[2] + ')</td><td class="bsiFX-num">' + C.fmtNum(+e1[r[0]].toPrecision(3)) + '</td><td class="bsiFX-num">' + (e1[r[0]] / e2[r[0]]).toFixed(2) + '</td></tr>'; }).join('') + '</table>' +
        '<div class="bsiFX-nota">' + t('Un metodo di ordine p ha errore ∝ hᵖ: dimezzando h l’errore si divide per 2ᵖ (2, 4, 16). RK4 è il cavallo da tiro delle cinetiche: con 4 passi sbaglia già solo di 7·10⁻⁵.', 'A method of order p has error ∝ hᵖ: halving h divides the error by 2ᵖ (2, 4, 16). RK4 is the workhorse of kinetics: with 4 steps it is already only 7·10⁻⁵ off.') + '</div>';
    }
    disegna(); F.alRidimensiona(disegna);
  }

  /* ── piano delle fasi ─────────────────────────────────────────────────── */
  var SISTEMI = {
    lv: { nome: ['Preda e predatore (Lotka-Volterra)', 'Predator and prey (Lotka-Volterra)'], f: '1.1x - 0.4x*y', g: '-0.4y + 0.1x*y', box: [0, 12, 0, 8], T: 40, p: [[4, 2], [6, 3]], ax: [['prede', 'prey'], ['predatori', 'predators']] },
    smorz: { nome: ['Oscillatore smorzato', 'Damped oscillator'], f: 'y', g: '-x - 0.3y', box: [-3, 3, -3, 3], T: 30, p: [[2.5, 0], [-1, 2.5]], ax: [['posizione', 'position'], ['velocità', 'velocity']] },
    pendolo: { nome: ['Pendolo (non lineare)', 'Pendulum (non-linear)'], f: 'y', g: '-sin(x)', box: [-7, 7, -3, 3], T: 30, p: [[1, 0], [2.8, 0], [-7, 2.2]], ax: [['angolo', 'angle'], ['velocità angolare', 'angular velocity']] },
    vdp: { nome: ['Van der Pol (ciclo limite)', 'Van der Pol (limit cycle)'], f: 'y', g: '1.5(1 - x^2)*y - x', box: [-4, 4, -5, 5], T: 40, p: [[0.1, 0], [3.5, 4]], ax: [['x', 'x'], ['y', 'y']] },
    brux: { nome: ['Bruxellatore (reazione oscillante)', 'Brusselator (oscillating reaction)'], f: '1 - 4x + x^2*y', g: '3x - x^2*y', box: [0, 4, 0, 6], T: 40, p: [[1, 1], [3, 0.5]], ax: [['[X]', '[X]'], ['[Y]', '[Y]']] },
    sir: { nome: ['Epidemia SIR (S, I)', 'SIR epidemic (S, I)'], f: '-0.5x*y', g: '0.5x*y - 0.1y', box: [0, 1, 0, 0.7], T: 80, p: [[0.99, 0.01], [0.7, 0.02]], ax: [['suscettibili S', 'susceptible S'], ['infetti I', 'infected I']] },
    lin: { nome: ['Lineare: sella', 'Linear: saddle'], f: 'x + y', g: '4x + y', box: [-3, 3, -3, 3], T: 4, p: [[1, -1.9], [-1, 2.1], [0.5, -1.2]], ax: [['x', 'x'], ['y', 'y']] }
  };
  function schedaFasi(div) {
    var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div');
    g.appendChild(pan); g.appendChild(dx); div.appendChild(g);
    var k = 'lv', S = SISTEMI[k], curve = S.p.slice(), ef, eg, fx, fy, eq = [], inv = null;
    F.scelta(pan, ['Sistema', 'System'], Object.keys(SISTEMI).map(function (q) { return [q, SISTEMI[q].nome]; }), k, function (v) { k = v; S = SISTEMI[k]; inF.value = S.f; inG.value = S.g; curve = S.p.slice(); calcola(); });
    pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: "x′ =" })); var inF = F.el('input', { type: 'text', value: S.f, 'aria-label': "x′" }); pan.appendChild(inF);
    pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: "y′ =" })); var inG = F.el('input', { type: 'text', value: S.g, 'aria-label': "y′" }); pan.appendChild(inG);
    inF.addEventListener('change', function () { curve = []; calcola(); }); inG.addEventListener('change', function () { curve = []; calcola(); });
    F.bottone(pan, ['Aggiorna', 'Update'], calcola); F.bottone(pan, ['Cancella le traiettorie', 'Clear trajectories'], function () { curve = []; disegna(); });
    var info = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(info);
    var c = F.tela(dx, 0.7), c2 = F.tela(dx, 0.38);
    tocco(c, function (px, py) { if (!inv) return; curve.push(inv(px, py)); disegna(); });
    function calcola() {
      try { ef = leggiXY(inF.value); eg = leggiXY(inG.value); } catch (err) { info.innerHTML = '<span class="bsiFX-ko">⚠ ' + esc(err.message) + '</span>'; return; }
      fx = f2(ef); fy = f2(eg); eq = equilibri(ef, eg, S.box);
      info.innerHTML = '<b>' + t('Jacobiano', 'Jacobian') + '</b><div class="bsiFX-eq">J = [ ' + esc(C.stampa(C.deriva(ef, 'x'))) + ' , ' + esc(C.stampa(C.deriva(ef, 'y'))) + ' ; ' + esc(C.stampa(C.deriva(eg, 'x'))) + ' , ' + esc(C.stampa(C.deriva(eg, 'y'))) + ' ]</div>' +
        '<b>' + t('Equilibri', 'Equilibria') + '</b>' + (eq.length ? '<table class="bsiFX-tab">' + eq.map(function (p) { return '<tr><td class="bsiFX-num">' + (p.tipo === 'curva' ? t('per esempio ', 'e.g. ') : '') + '(' + C.numeroBello(+p.x.toPrecision(8)) + ', ' + C.numeroBello(+p.y.toPrecision(8)) + ')</td><td>' + F.tt(NOMI_TIPO[p.tipo]) + '</td></tr>'; }).join('') + '</table>' : ' —') +
        '<div class="bsiFX-nota">' + t('Tocca il piano per lanciare una traiettoria; sotto, x(t) e y(t) dell’ultima.', 'Tap the plane to launch a trajectory; below, x(t) and y(t) of the last one.') + '</div>';
      disegna();
    }
    function disegna() {
      if (!fx) return;
      var B = S.box, o = F.grafico(c, { serie: [{ x: [B[0], B[1]], y: [B[2], B[2]], col: '#1d2f49' }], xmin: B[0], xmax: B[1], ymin: B[2], ymax: B[3], xl: S.ax[0], yl: S.ax[1] }), q = o.q;
      inv = inverso(o, B[0], B[1], B[2], B[3]);
      q.save(); q.beginPath(); q.rect(54, 14, o.W - 68, o.H - 54); q.clip();
      var nx = 22, ny = 16, L = (o.X(B[1]) - o.X(B[0])) / nx * 0.42;
      for (var i = 0; i <= nx; i++) for (var j = 0; j <= ny; j++) {
        var x = B[0] + (B[1] - B[0]) * i / nx, y = B[2] + (B[3] - B[2]) * j / ny, u = fx(x, y), v = fy(x, y);
        if (!isFinite(u) || !isFinite(v)) continue;
        var px = o.X(x + u) - o.X(x), py = o.Y(y + v) - o.Y(y), n = Math.hypot(px, py); if (n < 1e-12) continue;
        var ux = px / n, uy = py / n, X0 = o.X(x), Y0 = o.Y(y);
        q.strokeStyle = 'rgba(159,177,198,.5)'; q.lineWidth = 1.1; q.beginPath(); q.moveTo(X0 - ux * L / 2, Y0 - uy * L / 2); q.lineTo(X0 + ux * L / 2, Y0 + uy * L / 2);
        q.lineTo(X0 + ux * L / 2 - (ux * 4 - uy * 3), Y0 + uy * L / 2 - (uy * 4 + ux * 3)); q.stroke();
      }
      var COL = ['#5eead4', '#ffd24a', '#ff8a80', '#7c6fff', '#6bcfff', '#c9b6ff'], ultima = null;
      curve.forEach(function (p, kk) {
        var tr = traiettoria(fx, fy, p[0], p[1], S.T, 3000); ultima = tr;
        q.strokeStyle = COL[kk % COL.length]; q.lineWidth = 2.2; q.beginPath();
        tr.x.forEach(function (x, i) { if (i) q.lineTo(o.X(x), o.Y(tr.y[i])); else q.moveTo(o.X(x), o.Y(tr.y[i])); }); q.stroke();
        q.fillStyle = COL[kk % COL.length]; q.beginPath(); q.arc(o.X(p[0]), o.Y(p[1]), 4, 0, 7); q.fill();
      });
      eq.forEach(function (p) {
        q.fillStyle = /stabile$/.test(p.tipo) && !/instabile/.test(p.tipo) ? '#5eead4' : p.tipo === 'centro' ? '#ffd24a' : '#ff8a80';
        q.beginPath(); q.arc(o.X(p.x), o.Y(p.y), 6, 0, 7); q.fill(); q.strokeStyle = '#081522'; q.lineWidth = 2; q.stroke();
      });
      q.restore();
      if (ultima) F.grafico(c2, { serie: [{ x: ultima.t, y: ultima.x, col: '#5eead4' }, { x: ultima.t, y: ultima.y, col: '#ffd24a' }], xl: ['tempo', 'time'], yl: '', legenda: [{ col: '#5eead4', etich: F.tt(S.ax[0]) }, { col: '#ffd24a', etich: F.tt(S.ax[1]) }] });
      else F.grafico(c2, { serie: [{ x: [0, S.T], y: [0, 0], col: '#34465f' }], xl: ['tempo', 'time'] });
    }
    calcola(); F.alRidimensiona(disegna);
  }

  /* ── caos nello spazio delle fasi 3D (v238) ──────────────────────────────
     Sistemi x′ = f(x, y, z), y′ = g, z′ = h integrati con RK4. Due traiettorie che partono a
     distanza ε si allontanano come ε·e^(λ₁t) (λ₁ = esponente di Ljapunov massimo) finche' la
     distanza non diventa grande quanto l'attrattore. λ₁ si stima con il metodo di Benettin:
     una traiettoria vicina riportata a distanza d₀ ogni m passi, sommando ln(d/d₀).
     Valori di riferimento: Lorenz (10, 28, 8/3) λ₁ ≈ 0,9056; Rössler (0,2; 0,2; 5,7) λ₁ ≈ 0,0714.
     La divergenza del campo dice come cambiano i volumi: per Lorenz e' −(σ + 1 + β) ovunque. */
  function campo3(tipo, p, testi) {
    if (tipo === 'lorenz') return function (v) { return [p.s * (v[1] - v[0]), v[0] * (p.r - v[2]) - v[1], v[0] * v[1] - p.b * v[2]]; };
    if (tipo === 'rossler') return function (v) { return [-v[1] - v[2], v[0] + p.a * v[1], p.b + v[2] * (v[0] - p.c)]; };
    var E = testi.map(function (s) { var e = C.leggi(s), vs = C.simboli(e).filter(function (q) { return q !== 'x' && q !== 'y' && q !== 'z'; }); if (vs.length) throw new Error(t('usa solo x, y e z (trovato: ', 'use only x, y and z (found: ') + vs.join(', ') + ')'); return C.compila(e); }), amb = {};
    return function (v) { amb.x = v[0]; amb.y = v[1]; amb.z = v[2]; return [E[0](amb), E[1](amb), E[2](amb)]; };
  }
  function passoRK4(f, v, h) {
    var k1 = f(v), a = [v[0] + h / 2 * k1[0], v[1] + h / 2 * k1[1], v[2] + h / 2 * k1[2]], k2 = f(a), b = [v[0] + h / 2 * k2[0], v[1] + h / 2 * k2[1], v[2] + h / 2 * k2[2]], k3 = f(b), c = [v[0] + h * k3[0], v[1] + h * k3[1], v[2] + h * k3[2]], k4 = f(c);
    return [v[0] + h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), v[1] + h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]), v[2] + h / 6 * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2])];
  }
  /* Benettin: transitorio, poi T unita' di tempo con rinormalizzazione ogni m passi; si puo' fare a lotti (stato) */
  function ljapunovInizia(f, v0, h, transitorio) { var v = v0.slice(); for (var i = 0; i < Math.round(transitorio / h); i++) v = passoRK4(f, v, h); var d0 = 1e-8; return { f: f, h: h, v: v, w: [v[0] + d0, v[1], v[2]], d0: d0, somma: 0, tempo: 0, m: 10 }; }
  function ljapunovAvanza(B, passi) {
    for (var i = 0; i < passi; i += B.m) {
      for (var k = 0; k < B.m; k++) { B.v = passoRK4(B.f, B.v, B.h); B.w = passoRK4(B.f, B.w, B.h); }
      var d = [B.w[0] - B.v[0], B.w[1] - B.v[1], B.w[2] - B.v[2]], n = Math.hypot(d[0], d[1], d[2]);
      if (!(n > 0) || !isFinite(n)) return B;
      B.somma += Math.log(n / B.d0); B.tempo += B.m * B.h;
      B.w = [B.v[0] + d[0] * B.d0 / n, B.v[1] + d[1] * B.d0 / n, B.v[2] + d[2] * B.d0 / n];
    }
    B.lambda = B.somma / B.tempo; return B;
  }
  function ljapunov(f, v0, h, T, transitorio) { var B = ljapunovInizia(f, v0, h, transitorio || 50); return ljapunovAvanza(B, Math.round(T / h)).lambda; }
  /* divergenza numerica del campo (differenze centrate) */
  function divergenza3(f, v) { var e = 1e-5, s = 0; for (var q = 0; q < 3; q++) { var a = v.slice(), b = v.slice(); a[q] += e; b[q] -= e; s += (f(a)[q] - f(b)[q]) / (2 * e); } return s; }
  function puntiFissiLorenz(p) { if (p.r <= 1) return [[0, 0, 0]]; var q = Math.sqrt(p.b * (p.r - 1)); return [[0, 0, 0], [q, q, p.r - 1], [-q, -q, p.r - 1]]; }
  function puntiFissiRossler(p) { var D = p.c * p.c - 4 * p.a * p.b; if (D < 0) return []; return [(p.c + Math.sqrt(D)) / 2, (p.c - Math.sqrt(D)) / 2].map(function (u) { return [u, -u / p.a, u / p.a]; }); }

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
          var S = new lab.Scena(posto, rapporto || 0.66);
          S.box.setAttribute('role', 'group'); S.box.setAttribute('aria-label', F.tt(etichetta));
          globale.requestAnimationFrame(function () { try { vista(S, lab, globale.THREE); } catch (e) { if (globale.console) console.error(e); } div._scena = S; });
        }, 0);
      }).catch(function (e) { if (globale.console) console.error(e); attesa.textContent = t('Motore 3D non disponibile: ', '3D engine unavailable: ') + e.message; });
    };
  }
  var CAOS = {
    lorenz: { nome: ['Lorenz (convezione)', 'Lorenz (convection)'], h: 0.005, v0: [1, 1, 20], par: [['s', 'σ', 1, 20, 0.5, 10], ['r', 'ρ', 0.5, 50, 0.5, 28], ['b', 'β', 0.5, 5, 0.01, 8 / 3]], div: function (p) { return -(p.s + 1 + p.b); } },
    rossler: { nome: ['Rössler (un solo foglio ripiegato)', 'Rössler (a single folded sheet)'], h: 0.01, v0: [1, 1, 0], par: [['a', 'a', 0.05, 0.4, 0.01, 0.2], ['b', 'b', 0.05, 2, 0.05, 0.2], ['c', 'c', 2, 12, 0.1, 5.7]] },
    libero: { nome: ['scritto da te (Thomas)', 'your own (Thomas)'], h: 0.02, v0: [0.1, 0, 0], par: [] }
  };
  function schedaCaos(pan, dx) {
    var st = { tipo: 'lorenz', p: {}, eps: -5, testi: ['sin(y) - 0.208*x', 'sin(z) - 0.208*y', 'sin(x) - 0.208*z'], pausa: false }, f = null, S = null, T = null, lab = null, oggetti = {}, ultimo = 0, giro = null, B = null;
    F.scelta(pan, ['Sistema', 'System'], Object.keys(CAOS).map(function (k) { return [k, CAOS[k].nome]; }), st.tipo, function (v) { st.tipo = v; parametri(); riparti(); });
    var box = F.el('div'); pan.appendChild(box);
    F.cursore(pan, ['distanza iniziale ε = 10^k, k', 'initial distance ε = 10^k, k'], -10, -1, 1, st.eps, function (v) { st.eps = v; riparti(); }, function (v) { return '10^' + v; });
    var riga = F.el('div', { 'class': 'bsiFX-anim', role: 'group', 'aria-label': t('Controlli dell’animazione', 'Animation controls') });
    var bp = F.el('button', { type: 'button', testo: '❚❚', 'aria-label': t('Pausa', 'Pause'), onclick: function () { st.pausa = !st.pausa; bp.textContent = st.pausa ? '▶' : '❚❚'; bp.setAttribute('aria-label', st.pausa ? t('Avvia', 'Play') : t('Pausa', 'Pause')); if (S) S.avvia(); } });
    riga.appendChild(bp); riga.appendChild(F.el('button', { type: 'button', testo: '↺', 'aria-label': t('Ricomincia', 'Restart'), onclick: function () { riparti(); } }));
    pan.appendChild(riga);
    var info = F.el('div', { 'class': 'bsiFX-nota' }), lj = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(info); pan.appendChild(lj);
    pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('Due traiettorie (verde acqua e corallo) partono a distanza ε l’una dall’altra e sono integrate con Runge-Kutta 4. Per un po’ sembrano una sola, poi si separano in modo esponenziale, d(t) ≈ ε·e^(λ₁t): nel grafico sotto ln d cresce come una retta di pendenza λ₁ e poi si satura alla taglia dell’attrattore. È la sensibilità alle condizioni iniziali: dividere ε per dieci fa guadagnare solo ln(10)/λ₁ unità di tempo di prevedibilità (per Lorenz circa 2,5). λ₁ è stimato a parte con il metodo di Benettin (una perturbazione riportata a 10⁻⁸ ogni 10 passi). Il volume nello spazio delle fasi si contrae con tasso dato dalla divergenza: l’attrattore ha volume nullo e struttura frattale. Le sfere bianche sono i punti fissi.',
      'Two trajectories (teal and coral) start ε apart and are integrated with Runge-Kutta 4. For a while they look like one, then they separate exponentially, d(t) ≈ ε·e^(λ₁t): in the plot below ln d grows like a straight line of slope λ₁ and then saturates at the size of the attractor. This is sensitivity to initial conditions: dividing ε by ten only buys ln(10)/λ₁ time units of predictability (about 2.5 for Lorenz). λ₁ is estimated separately with Benettin’s method (a perturbation reset to 10⁻⁸ every 10 steps). Phase-space volume contracts at a rate given by the divergence: the attractor has zero volume and a fractal structure. The white spheres are the fixed points.') }));
    var tela = F.tela(dx, 0.32), serie = { t: [], d: [] };
    function parametri() {
      box.innerHTML = ''; var D = CAOS[st.tipo]; st.p = {};
      D.par.forEach(function (q) { st.p[q[0]] = q[5]; F.cursore(box, [q[1], q[1]], q[2], q[3], q[4], q[5], function (v) { st.p[q[0]] = Math.abs(v - 8 / 3) < 0.006 && q[0] === 'b' ? 8 / 3 : v; riparti(); }, function (v) { return Math.abs(v - 8 / 3) < 0.006 && q[0] === 'b' ? '8/3' : (+v.toFixed(3)).toString(); }); });
      if (st.tipo === 'libero') ['x′', 'y′', 'z′'].forEach(function (n, i) { var inp = F.el('input', { type: 'text', value: st.testi[i], 'aria-label': n, spellcheck: 'false', autocomplete: 'off' }); box.appendChild(F.el('div', { 'class': 'bsiFX-cursore' }, [F.el('label', null, [F.el('span', { testo: n + ' =' })]), inp])); inp.addEventListener('change', function () { st.testi[i] = inp.value; riparti(); }); });
    }
    /* stato delle due traiettorie */
    var A = null, Bt = null, tempo = 0, n = 0, MAX = 24000, scaglia = null;
    function riparti() {
      clearTimeout(giro); B = null; lj.textContent = '';
      var D = CAOS[st.tipo];
      try { f = campo3(st.tipo, st.p, st.testi); var prova = f(D.v0); if (!prova.every(isFinite)) throw new Error(t('il campo non è definito nel punto di partenza', 'the field is undefined at the starting point')); }
      catch (e) { f = null; info.innerHTML = '<span class="bsiFX-ko">' + t('Sistema non valido: ', 'Invalid system: ') + String(e.message).replace(/</g, '&lt;') + '</span>'; if (S) { S.pulisci(); S.aggiungi(lab.assi(T, 3, ['x', 'y', 'z'], 0.3)); } return; }
      var eps = Math.pow(10, st.eps); A = D.v0.slice(); Bt = [D.v0[0] + eps, D.v0[1], D.v0[2]]; tempo = 0; n = 0; serie = { t: [], d: [] };
      var dv = divergenza3(f, D.v0), dv2 = divergenza3(f, [D.v0[0] + 1.3, D.v0[1] - 0.7, D.v0[2] + 2.1]), costante = Math.abs(dv - dv2) < 1e-6 * (1 + Math.abs(dv));
      var fissi = st.tipo === 'lorenz' ? puntiFissiLorenz(st.p) : st.tipo === 'rossler' ? puntiFissiRossler(st.p) : [];
      info.innerHTML = t('ε = ', 'ε = ') + eps.toExponential(0) + ' · ' + t('passo h = ', 'step h = ') + D.h + '<br>div F ' + (costante ? '= <b class="bsiFX-num">' + C.fmtNum(+dv.toPrecision(8)) + '</b> ' + t('ovunque: un volume si riduce del fattore e^(' + C.fmtNum(+dv.toPrecision(4)) + '·t)', 'everywhere: a volume shrinks by the factor e^(' + C.fmtNum(+dv.toPrecision(4)) + '·t)') : t('varia da punto a punto (nel punto di partenza ', 'varies from point to point (at the starting point ') + C.fmtNum(+dv.toPrecision(5)) + ')') +
        (fissi.length ? '<br>' + t('punti fissi: ', 'fixed points: ') + fissi.map(function (q) { return '(' + q.map(function (x) { return (+x.toFixed(3)).toString(); }).join(', ') + ')'; }).join(' ') : '');
      /* λ₁ di Benettin, a lotti fuori dal ciclo dei fotogrammi */
      var Tl = st.tipo === 'rossler' ? 1500 : 300;
      try { B = ljapunovInizia(f, D.v0, D.h, 30); } catch (e) { B = null; }
      (function lotto() {
        if (!B || B.f !== f) return;
        ljapunovAvanza(B, 4000);
        var ok = isFinite(B.lambda);
        lj.innerHTML = t('Esponente di Ljapunov massimo (Benettin, t = ', 'Largest Lyapunov exponent (Benettin, t = ') + Math.round(B.tempo) + '): λ₁ ≈ <b class="bsiFX-num">' + (ok ? B.lambda.toFixed(4) : '—') + '</b>' + (ok ? (B.lambda > 0.01 ? t(' > 0: caos; tempo di Ljapunov 1/λ₁ = ', ' > 0: chaos; Lyapunov time 1/λ₁ = ') + (1 / B.lambda).toFixed(2) : t(' ≤ 0: moto regolare (punto fisso o ciclo)', ' ≤ 0: regular motion (fixed point or cycle)')) : '');
        if (B.tempo < Tl && ok) giro = setTimeout(lotto, 15);
      })();
      scena();
    }
    function scena() {
      if (!S || !f) return;
      S.pulisci(); oggetti = {};
      var D = CAOS[st.tipo], v = D.v0.slice(), lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity], fant = [];
      /* la traccia tenue dell'attrattore (dopo un transitorio) fissa la scala e si vede subito */
      for (var i = 0; i < 9000; i++) { v = passoRK4(f, v, D.h); if (!v.every(isFinite) || Math.abs(v[0]) + Math.abs(v[1]) + Math.abs(v[2]) > 1e6) break; if (i > 1500) { fant.push(v); for (var q = 0; q < 3; q++) { lo[q] = Math.min(lo[q], v[q]); hi[q] = Math.max(hi[q], v[q]); } } }
      if (!fant.length) { lo = [-1, -1, -1]; hi = [1, 1, 1]; }
      var cen = [0, 1, 2].map(function (q) { return (lo[q] + hi[q]) / 2; }), ext = Math.max(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2], 1e-3), k = 6 / ext;
      scaglia = function (p) { return [(p[0] - cen[0]) * k, (p[1] - cen[1]) * k, (p[2] - cen[2]) * k]; };
      if (fant.length) S.aggiungi(lab.linea(T, fant.filter(function (p, i) { return i % 2 === 0; }).map(scaglia), 0x4a7aa8, 0.35));
      /* le due scie: buffer preallocati, la parte visibile con setDrawRange */
      oggetti.scie = [0x5eead4, 0xff8a80].map(function (c) { var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(new Float32Array(MAX * 3), 3)); g.setDrawRange(0, 0); var l = new T.Line(g, new T.LineBasicMaterial({ color: c })); l.frustumCulled = false; S.aggiungi(l); return l; });
      oggetti.teste = [0x5eead4, 0xff8a80].map(function (c) { var s = lab.sfera(T, 0.12, c, 0, 0, 0, true); S.aggiungi(s); return s; });
      oggetti.ponte = lab.linea(T, [[0, 0, 0], [0, 0, 0]], 0xffffff, 0.8); S.aggiungi(oggetti.ponte);
      (st.tipo === 'lorenz' ? puntiFissiLorenz(st.p) : st.tipo === 'rossler' ? puntiFissiRossler(st.p) : []).forEach(function (p) { var s = scaglia(p); if (Math.max(Math.abs(s[0]), Math.abs(s[1]), Math.abs(s[2])) < 6) S.aggiungi(lab.sfera(T, 0.08, 0xffffff, s[0], s[1], s[2], false)); });
      S.aggiungi(lab.assi(T, 3.6, ['x', 'y', 'z'], 0.3));
      S.didascalia.textContent = st.tipo === 'lorenz' ? 'x′ = σ(y − x) · y′ = x(ρ − z) − y · z′ = xy − βz' : st.tipo === 'rossler' ? 'x′ = −y − z · y′ = x + ay · z′ = b + z(x − c)' : 'x′ = ' + st.testi[0] + ' · y′ = ' + st.testi[1] + ' · z′ = ' + st.testi[2];
      if (!S.vistaIniziale) S.inquadra(13, 0.6, 1.2);
      S.ogniFotogramma(function (dt) { if (st.pausa) return false; avanza(dt); });
    }
    function avanza(dt) {
      if (!f || !oggetti.scie) return;
      var D = CAOS[st.tipo], passi = Math.max(1, Math.round(Math.min(dt, 0.05) * 60 * (st.tipo === 'lorenz' ? 6 : 5)));
      var pa = oggetti.scie[0].geometry.attributes.position, pb = oggetti.scie[1].geometry.attributes.position;
      for (var i = 0; i < passi && n < MAX; i++) {
        A = passoRK4(f, A, D.h); Bt = passoRK4(f, Bt, D.h); tempo += D.h;
        if (!A.every(isFinite) || !Bt.every(isFinite) || Math.abs(A[0]) > 1e6) { n = MAX; break; }
        var a = scaglia(A), b = scaglia(Bt); pa.setXYZ(n, a[0], a[1], a[2]); pb.setXYZ(n, b[0], b[1], b[2]); n++;
        if (n % 4 === 0) { serie.t.push(tempo); serie.d.push(Math.log10(Math.max(1e-16, Math.hypot(A[0] - Bt[0], A[1] - Bt[1], A[2] - Bt[2])))); }
      }
      pa.needsUpdate = pb.needsUpdate = true;
      /* scia lunga 3000 punti: si vede il moto, non un gomitolo */
      var da = Math.max(0, n - 3000); oggetti.scie.forEach(function (l) { l.geometry.setDrawRange(da, n - da); });
      if (n) { var sa = scaglia(A), sb = scaglia(Bt); oggetti.teste[0].position.set(sa[0], sa[1], sa[2]); oggetti.teste[1].position.set(sb[0], sb[1], sb[2]); oggetti.ponte.geometry.setFromPoints([oggetti.teste[0].position, oggetti.teste[1].position]); }
      var ora = Date.now(); if (ora - ultimo > 250) { ultimo = ora; grafico(); }
      if (n >= MAX) return false;
    }
    function grafico() {
      if (!serie.t.length) serie = { t: [0], d: [st.eps] };
      var lam = B && isFinite(B.lambda) ? B.lambda : null, eps = Math.pow(10, st.eps), s = [{ x: serie.t, y: serie.d, col: '#ffd24a', larg: 2, etich: 'log₁₀ d(t)' }];
      if (lam && lam > 0) { var tf = Math.min(serie.t[serie.t.length - 1], (Math.log(1 / eps)) / lam); s.push({ x: [0, tf], y: [st.eps, st.eps + lam * tf / Math.LN10], col: '#ff8a80', larg: 1.5, tratt: true, etich: 'ε·e^(λ₁t)' }); }
      F.grafico(tela, { serie: s, xmin: 0, xmax: Math.max(5, serie.t[serie.t.length - 1]), ymin: Math.min(st.eps - 1, -2), ymax: 2, xl: 't', yl: 'log₁₀ d', legenda: s.map(function (q) { return { col: q.col, etich: q.etich }; }) });
      tela.setAttribute('aria-label', t('distanza fra le due traiettorie in scala logaritmica, t = ', 'distance between the two trajectories on a log scale, t = ') + serie.t[serie.t.length - 1].toFixed(1));
    }
    parametri(); riparti();
    F.alRidimensiona(grafico);
    return function (Sc, L3, Tr) { S = Sc; lab = L3; T = Tr; scena(); };
  }

  F.calcolo.ode = { METODI: METODI, integra1: integra1, traiettoria: traiettoria, equilibri: equilibri, classifica: classifica, errori: errori, SISTEMI: SISTEMI, campo3: campo3, passoRK4: passoRK4, ljapunov: ljapunov, ljapunovInizia: ljapunovInizia, ljapunovAvanza: ljapunovAvanza, divergenza3: divergenza3, puntiFissiLorenz: puntiFissiLorenz, puntiFissiRossler: puntiFissiRossler, CAOS: CAOS };

  F.sezione('smatode', {
    titolo: ['🌀 Equazioni differenziali', '🌀 Differential equations'],
    sotto: ['Il campo di direzioni di y′ = f(x, y) con le soluzioni che partono dove tocchi, l’ordine dei metodi numerici (Eulero, Heun, RK4) misurato, e il piano delle fasi dei sistemi — preda e predatore, pendolo, Van der Pol, Bruxellatore, SIR — con equilibri classificati dallo jacobiano.',
            'The direction field of y′ = f(x, y) with solutions starting where you tap, the order of numerical methods (Euler, Heun, RK4) measured, and the phase plane of systems — predator-prey, pendulum, Van der Pol, Brusselator, SIR — with equilibria classified from the Jacobian.'],
    schede: [
      { nome: ['Campo di direzioni', 'Direction field'], costruisci: schedaCampo },
      { nome: ['Metodi numerici', 'Numerical methods'], costruisci: schedaMetodi },
      { nome: ['Piano delle fasi', 'Phase plane'], costruisci: schedaFasi },
      { nome: ['🧊 Caos nello spazio delle fasi 3D', '🧊 Chaos in 3D phase space'], costruisci: scheda3d(schedaCaos, ['Spazio delle fasi 3D con due traiettorie vicine che si separano', '3D phase space with two nearby trajectories drifting apart']) }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
