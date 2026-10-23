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

  F.calcolo.ode = { METODI: METODI, integra1: integra1, traiettoria: traiettoria, equilibri: equilibri, classifica: classifica, errori: errori, SISTEMI: SISTEMI };

  F.sezione('smatode', {
    titolo: ['🌀 Equazioni differenziali', '🌀 Differential equations'],
    sotto: ['Il campo di direzioni di y′ = f(x, y) con le soluzioni che partono dove tocchi, l’ordine dei metodi numerici (Eulero, Heun, RK4) misurato, e il piano delle fasi dei sistemi — preda e predatore, pendolo, Van der Pol, Bruxellatore, SIR — con equilibri classificati dallo jacobiano.',
            'The direction field of y′ = f(x, y) with solutions starting where you tap, the order of numerical methods (Euler, Heun, RK4) measured, and the phase plane of systems — predator-prey, pendulum, Van der Pol, Brusselator, SIR — with equilibria classified from the Jacobian.'],
    schede: [
      { nome: ['Campo di direzioni', 'Direction field'], costruisci: schedaCampo },
      { nome: ['Metodi numerici', 'Numerical methods'], costruisci: schedaMetodi },
      { nome: ['Piano delle fasi', 'Phase plane'], costruisci: schedaFasi }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
