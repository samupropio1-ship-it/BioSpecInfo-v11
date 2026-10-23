/* ═══════════════════════════════════════════════════════════════════════════
   bsi-mat-multi.js — 🗻 le funzioni di più variabili
   BioSpecInfo · © Samuele Pio Provenzano

   · SUPERFICI: z = f(x, y) disegnata in 3D (si ruota trascinando) e come
     mappa a curve di livello con il gradiente; derivate parziali e
     hessiano SIMBOLICI; i punti critici trovati con Newton e classificati
     (minimo, massimo, sella) dal determinante dell'hessiano. La doppia
     buca e' una superficie di energia potenziale in miniatura: due minimi
     (reagente e prodotto) e una sella (lo stato di transizione). Toccando
     la mappa parte la discesa del gradiente.
   · FUNZIONI DI STATO: perche' la termodinamica e' matematica delle
     derivate parziali. Il gas di van der Waals: le derivate di p(V, T),
     la relazione di Maxwell (∂S/∂V)_T = (∂p/∂T)_V verificata in modo
     simbolico partendo dall'energia di Helmholtz, e il criterio del
     differenziale esatto: δq non e' esatto, δq/T = dS si'.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica, C = globale.BSIMatCAS;
  if (!F || !C) return;
  var t = F.t;
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function nb(v) { return C.numeroBello(+(+v).toPrecision(8)); }
  function c4(v) { var r = C.rationalizza(v, 12); return r && Math.abs(r[0] / r[1] - v) < 1e-9 ? C.numeroBello(r[0] / r[1]).replace(/^-/, '−') : String(+v.toPrecision(4)).replace(/^-/, '−'); }
  function f2(e, a, b) { var c = C.compila(e), amb = {}; a = a || 'x'; b = b || 'y'; return function (x, y) { amb[a] = x; amb[b] = y; return c(amb); }; }

  /* ── analisi di z = f(x, y) ───────────────────────────────────────────── */
  function analizza(testo, box) {
    var e = C.leggi(testo), vs = C.simboli(e).filter(function (v) { return v !== 'x' && v !== 'y'; });
    if (vs.length) throw new Error(t('usa solo x e y (trovato: ', 'use only x and y (found: ') + vs.join(', ') + ')');
    var fx = C.deriva(e, 'x'), fy = C.deriva(e, 'y'), fxx = C.deriva(fx, 'x'), fxy = C.deriva(fx, 'y'), fyy = C.deriva(fy, 'y');
    var r = { e: e, fx: fx, fy: fy, fxx: fxx, fxy: fxy, fyy: fyy, f: f2(e), gx: f2(fx), gy: f2(fy), hxx: f2(fxx), hxy: f2(fxy), hyy: f2(fyy) };
    r.critici = [];
    for (var i = 0; i <= 10; i++) for (var j = 0; j <= 10; j++) {
      var x = box[0] + (box[1] - box[0]) * i / 10, y = box[2] + (box[3] - box[2]) * j / 10;
      for (var k = 0; k < 50; k++) {
        var g1 = r.gx(x, y), g2 = r.gy(x, y), a = r.hxx(x, y), b = r.hxy(x, y), d = r.hyy(x, y), det = a * d - b * b;
        if (!isFinite(det) || Math.abs(det) < 1e-14) break;
        var dx = (d * g1 - b * g2) / det, dy = (a * g2 - b * g1) / det;
        x -= dx; y -= dy;
        if (Math.abs(dx) + Math.abs(dy) < 1e-13) break;
      }
      if (!isFinite(x) || !isFinite(y) || Math.hypot(r.gx(x, y), r.gy(x, y)) > 1e-8) continue;
      if (x < box[0] - 1e-9 || x > box[1] + 1e-9 || y < box[2] - 1e-9 || y > box[3] + 1e-9) continue;
      if (r.critici.some(function (p) { return Math.hypot(p.x - x, p.y - y) < 1e-6; })) continue;
      var H = r.hxx(x, y) * r.hyy(x, y) - r.hxy(x, y) * r.hxy(x, y), tipo = H > 1e-10 ? (r.hxx(x, y) > 0 ? 'minimo' : 'massimo') : H < -1e-10 ? 'sella' : 'indeciso';
      r.critici.push({ x: Math.abs(x) < 1e-12 ? 0 : x, y: Math.abs(y) < 1e-12 ? 0 : y, z: r.f(x, y), detH: H, tipo: tipo });
    }
    return r;
  }
  function discesa(R, x, y, passi) {
    var cammino = [[x, y]], h = 0.02;
    for (var i = 0; i < (passi || 2000); i++) {
      var g1 = R.gx(x, y), g2 = R.gy(x, y), n = Math.hypot(g1, g2);
      if (!isFinite(n) || n < 1e-6) break;
      var s = Math.min(h, n * 0.05) / n; x -= g1 * s; y -= g2 * s; cammino.push([x, y]);
    }
    return cammino;
  }
  function colore(u) {
    u = Math.max(0, Math.min(1, u));
    var P = [[124, 111, 255], [107, 207, 255], [94, 234, 212], [255, 210, 74], [255, 138, 128]], k = Math.min(3, Math.floor(u * 4)), f = u * 4 - k, a = P[k], b = P[k + 1];
    return [Math.round(a[0] + (b[0] - a[0]) * f), Math.round(a[1] + (b[1] - a[1]) * f), Math.round(a[2] + (b[2] - a[2]) * f)];
  }

  var PRESET = [
    ['x^2 + y^2', ['paraboloide (minimo)', 'paraboloid (minimum)']],
    ['x^2 - y^2', ['sella', 'saddle']],
    ['(x^2 - 1)^2 + 2y^2 - 0.3x', ['doppia buca: PES con stato di transizione', 'double well: a PES with a transition state']],
    ['x*y*e^(-(x^2 + y^2)/2)', ['due massimi, due minimi, una sella', 'two maxima, two minima, a saddle']],
    ['sin(x)*cos(y)', ['onde', 'waves']],
    ['(1 - x)^2 + 5(y - x^2)^2', ['Rosenbrock (valle stretta)', 'Rosenbrock (narrow valley)']],
    ['x^3 - 3x*y^2', ['sella di scimmia', 'monkey saddle']]
  ];
  function schedaSuperfici(div) {
    var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div');
    g.appendChild(pan); g.appendChild(dx); div.appendChild(g);
    pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: 'z = f(x, y) =' }));
    var inp = F.el('input', { type: 'text', value: PRESET[2][0], 'aria-label': 'f(x, y)' }); pan.appendChild(inp);
    var es = F.el('div', { style: 'display:flex;flex-wrap:wrap;gap:4px;margin:6px 0' }); pan.appendChild(es);
    PRESET.forEach(function (p) { es.appendChild(F.el('button', { type: 'button', 'class': 'bsiFX-bott', testo: F.tt(p[1]), onclick: function () { inp.value = p[0]; cammini = []; calcola(); } })); });
    inp.addEventListener('change', function () { cammini = []; calcola(); });
    var info = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(info);
    var c3 = F.tela(dx, 0.62), cm = F.tela(dx, 0.62);
    var B = [-2.2, 2.2, -2.2, 2.2], R = null, az = 0.7, el = 0.55, cammini = [], inv = null;
    /* trascinare ruota la superficie */
    var tir = null;
    c3.style.cursor = 'grab'; c3.style.touchAction = 'none';
    c3.addEventListener('pointerdown', function (e) { tir = [e.clientX, e.clientY]; try { c3.setPointerCapture(e.pointerId); } catch (er) {} });
    c3.addEventListener('pointermove', function (e) { if (!tir) return; az += (e.clientX - tir[0]) * 0.01; el = Math.max(0.05, Math.min(1.5, el + (e.clientY - tir[1]) * 0.01)); tir = [e.clientX, e.clientY]; disegna3D(); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (n) { c3.addEventListener(n, function () { tir = null; }); });
    cm.style.cursor = 'crosshair';
    cm.addEventListener('click', function (ev) { if (!inv || !R) return; var r = cm.getBoundingClientRect(), p = inv(ev.clientX - r.left, ev.clientY - r.top); cammini.push(discesa(R, p[0], p[1])); disegnaMappa(); });
    function calcola() {
      try { R = analizza(inp.value, B); } catch (err) { R = null; info.innerHTML = '<span class="bsiFX-ko">⚠ ' + esc(err.message) + '</span>'; return; }
      var NOMI = { minimo: t('minimo', 'minimum'), massimo: t('massimo', 'maximum'), sella: t('sella', 'saddle'), indeciso: t('det H = 0: il test non decide', 'det H = 0: the test is inconclusive') };
      info.innerHTML = '<div class="bsiFX-eq">∂f/∂x = ' + C.html(R.fx) + '<br>∂f/∂y = ' + C.html(R.fy) + '<br>H = [ ' + C.html(R.fxx) + ' , ' + C.html(R.fxy) + ' ; ' + C.html(R.fxy) + ' , ' + C.html(R.fyy) + ' ]</div>' +
        '<b>' + t('Punti critici (∇f = 0)', 'Critical points (∇f = 0)') + '</b>' + (R.critici.length ? '<div style="overflow-x:auto"><table class="bsiFX-tab"><tr><th>(x, y)</th><th>f</th><th>det H</th></tr>' + R.critici.map(function (p) { return '<tr><td class="bsiFX-num">(' + c4(p.x) + '; ' + c4(p.y) + ')<br><span style="color:' + (p.tipo === 'minimo' ? '#5eead4' : p.tipo === 'massimo' ? '#ff8a80' : '#ffd24a') + '">' + NOMI[p.tipo] + '</span></td><td class="bsiFX-num">' + c4(p.z) + '</td><td class="bsiFX-num">' + c4(p.detH) + '</td></tr>'; }).join('') + '</table></div>' : ' —') +
        '<div class="bsiFX-nota">' + t('Trascina la superficie per ruotarla; tocca la mappa per far scendere una pallina lungo −∇f (discesa del gradiente: è così che si ottimizzano le geometrie molecolari).', 'Drag the surface to rotate it; tap the map to roll a ball down −∇f (gradient descent: this is how molecular geometries are optimised).') + '</div>';
      disegna3D(); disegnaMappa();
    }
    function griglia(n) {
      var Z = [], v = [];
      for (var i = 0; i <= n; i++) { Z.push([]); for (var j = 0; j <= n; j++) { var z = R.f(B[0] + (B[1] - B[0]) * i / n, B[2] + (B[3] - B[2]) * j / n); Z[i].push(z); if (isFinite(z)) v.push(z); } }
      var s = C.scalaY([v]); return { Z: Z, min: s.min, max: s.max };
    }
    function disegna3D() {
      if (!R) return;
      var P = F.grafico(c3, { serie: [], xmin: 0, xmax: 1, ymin: 0, ymax: 1 }), q = P.q, W = P.W, H = P.H;
      q.clearRect(0, 0, W, H); q.fillStyle = '#081522'; q.fillRect(0, 0, W, H);
      var n = 34, G = griglia(n), ca = Math.cos(az), sa = Math.sin(az), ce = Math.cos(el), se = Math.sin(el), sc = Math.min(W, H) * 0.3;
      function proj(u, v, w) { var x = u * ca - v * sa, y = u * sa + v * ca; return [W / 2 + sc * x, H * 0.55 - sc * (w * ce - y * se), y * ce + w * se]; }
      function Zn(z) { return isFinite(z) ? (Math.max(G.min, Math.min(G.max, z)) - (G.min + G.max) / 2) / (G.max - G.min) * 1.6 : NaN; }
      var quad = [];
      for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) {
        var zs = [G.Z[i][j], G.Z[i + 1][j], G.Z[i + 1][j + 1], G.Z[i][j + 1]];
        if (!zs.every(isFinite)) continue;
        var u0 = -1 + 2 * i / n, u1 = -1 + 2 * (i + 1) / n, v0 = -1 + 2 * j / n, v1 = -1 + 2 * (j + 1) / n;
        var pts = [proj(u0, v0, Zn(zs[0])), proj(u1, v0, Zn(zs[1])), proj(u1, v1, Zn(zs[2])), proj(u0, v1, Zn(zs[3]))];
        quad.push({ p: pts, d: (pts[0][2] + pts[1][2] + pts[2][2] + pts[3][2]) / 4, c: ((zs[0] + zs[1] + zs[2] + zs[3]) / 4 - G.min) / (G.max - G.min) });
      }
      quad.sort(function (a, b) { return a.d - b.d; });
      quad.forEach(function (Q) {
        var col = colore(Q.c);
        q.fillStyle = 'rgb(' + col.join(',') + ')'; q.strokeStyle = 'rgba(8,21,34,.45)'; q.lineWidth = 0.6;
        q.beginPath(); Q.p.forEach(function (p, k) { if (k) q.lineTo(p[0], p[1]); else q.moveTo(p[0], p[1]); }); q.closePath(); q.fill(); q.stroke();
      });
      R.critici.forEach(function (p) {
        var u = -1 + 2 * (p.x - B[0]) / (B[1] - B[0]), v = -1 + 2 * (p.y - B[2]) / (B[3] - B[2]), s = proj(u, v, Zn(p.z));
        q.fillStyle = p.tipo === 'minimo' ? '#ffffff' : p.tipo === 'massimo' ? '#ff8a80' : '#ffd24a'; q.beginPath(); q.arc(s[0], s[1], 5, 0, 7); q.fill(); q.strokeStyle = '#081522'; q.lineWidth = 1.5; q.stroke();
      });
      q.fillStyle = '#9fb1c6'; q.font = '12px system-ui'; q.textAlign = 'left'; q.fillText(t('trascina per ruotare', 'drag to rotate'), 10, 18);
      c3.setAttribute('aria-label', t('superficie z = f(x, y)', 'surface z = f(x, y)'));
    }
    function disegnaMappa() {
      if (!R) return;
      var o = F.grafico(cm, { serie: [{ x: [B[0], B[1]], y: [B[2], B[2]], col: '#1d2f49' }], xmin: B[0], xmax: B[1], ymin: B[2], ymax: B[3], xl: 'x', yl: 'y' }), q = o.q;
      var x0 = o.X(B[0]), x1 = o.X(B[1]), y0 = o.Y(B[3]), y1 = o.Y(B[2]);
      inv = function (px, py) { return [B[0] + (px - x0) / (x1 - x0) * (B[1] - B[0]), B[3] - (py - y0) / (y1 - y0) * (B[3] - B[2])]; };
      var nx = 120, ny = 90, G = griglia(60), w = (x1 - x0) / nx, h = (y1 - y0) / ny, LIV = 14;
      for (var i = 0; i < nx; i++) for (var j = 0; j < ny; j++) {
        var x = B[0] + (B[1] - B[0]) * (i + 0.5) / nx, y = B[3] - (B[3] - B[2]) * (j + 0.5) / ny, z = R.f(x, y);
        if (!isFinite(z)) continue;
        var u = Math.floor((Math.max(G.min, Math.min(G.max, z)) - G.min) / (G.max - G.min) * LIV) / LIV, col = colore(u);
        q.fillStyle = 'rgba(' + col.join(',') + ',.85)'; q.fillRect(x0 + i * w, y0 + j * h, w + 0.6, h + 0.6);
      }
      for (i = 0; i <= 12; i++) for (j = 0; j <= 9; j++) {
        var xa = B[0] + (B[1] - B[0]) * i / 12, ya = B[2] + (B[3] - B[2]) * j / 9, gx = R.gx(xa, ya), gy = R.gy(xa, ya), n = Math.hypot(gx, gy);
        if (!isFinite(n) || n < 1e-9) continue;
        var L = 9, ux = gx / n, uy = -gy / n, X = o.X(xa), Y = o.Y(ya);
        q.strokeStyle = 'rgba(8,21,34,.75)'; q.lineWidth = 1.2; q.beginPath(); q.moveTo(X, Y); q.lineTo(X + ux * L, Y + uy * L); q.lineTo(X + ux * L - (ux * 3 - uy * 2.5), Y + uy * L - (uy * 3 + ux * 2.5)); q.stroke();
      }
      cammini.forEach(function (cam) {
        q.strokeStyle = '#ffffff'; q.lineWidth = 2; q.beginPath(); cam.forEach(function (p, k) { if (k) q.lineTo(o.X(p[0]), o.Y(p[1])); else q.moveTo(o.X(p[0]), o.Y(p[1])); }); q.stroke();
        var f = cam[cam.length - 1]; q.fillStyle = '#ffffff'; q.beginPath(); q.arc(o.X(f[0]), o.Y(f[1]), 4, 0, 7); q.fill();
      });
      R.critici.forEach(function (p) { q.fillStyle = p.tipo === 'minimo' ? '#ffffff' : p.tipo === 'massimo' ? '#ff8a80' : '#ffd24a'; q.beginPath(); q.arc(o.X(p.x), o.Y(p.y), 5, 0, 7); q.fill(); q.strokeStyle = '#081522'; q.stroke(); });
      q.fillStyle = '#081522'; q.font = 'bold 11px system-ui'; q.textAlign = 'left'; q.fillText(t('frecce: ∇f (verso la salita)', 'arrows: ∇f (uphill)'), 60, 28);
    }
    calcola(); F.alRidimensiona(function () { disegna3D(); disegnaMappa(); });
  }

  /* ── funzioni di stato ────────────────────────────────────────────────── */
  var GAS_VDW = { CO2: [3.640, 0.04267], N2: [1.370, 0.0387], H2O: [5.536, 0.03049], He: [0.0346, 0.0238], NH3: [4.225, 0.0371] }; /* a in L²·bar/mol², b in L/mol */
  function maxwellVdW() {
    /* A(V, T) = −RT ln(V − b) − a/V (+ termini solo in T); S = −∂A/∂T, p = −∂A/∂V */
    var A = C.leggi('-R*T*ln(V - b) - a/V'), S = C.semplifica(C.costruisci.neg(C.deriva(A, 'T'))), p = C.semplifica(C.costruisci.neg(C.deriva(A, 'V')));
    var dSdV = C.deriva(S, 'V'), dpdT = C.deriva(p, 'T');
    return { A: A, S: S, p: p, dSdV: dSdV, dpdT: dpdT, uguali: C.stampa(dSdV) === C.stampa(dpdT) || C.uguali(dSdV, dpdT) };
  }
  function esatto(M, N, u, v) {
    var My = C.deriva(M, v), Nx = C.deriva(N, u), ok = C.uguali(My, Nx, C.simboli(C.costruisci.add(M, N)));
    var r = { My: My, Nx: Nx, esatto: ok };
    if (ok) {
      var phi = C.integra(M, u);
      if (phi) {
        var resto = C.semplifica(C.costruisci.sub(N, C.deriva(phi, v)));
        if (!C.dipende(resto, u)) { var gv = C.dipende(resto, v) ? C.integra(resto, v) : C.semplifica(C.costruisci.mul(resto, C.simbolo(v))); if (gv) r.potenziale = C.semplifica(C.costruisci.add(phi, gv)); }
      }
    }
    return r;
  }
  function schedaStato(div) {
    var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div');
    g.appendChild(pan); g.appendChild(dx); div.appendChild(g);
    var gas = 'CO2', T = 300;
    F.scelta(pan, ['Gas di van der Waals', 'Van der Waals gas'], Object.keys(GAS_VDW).map(function (k) { return [k, k.replace(/(\d)/g, function (d) { return '₀₁₂₃₄₅₆₇₈₉'[+d]; })]; }), gas, function (v) { gas = v; disegna(); });
    F.cursore(pan, ['Temperatura (K)', 'Temperature (K)'], 200, 700, 5, T, function (v) { T = v; disegna(); });
    var mx = maxwellVdW();
    pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', html: '<b>' + t('Relazione di Maxwell, simbolica', 'Maxwell relation, symbolic') + '</b><div class="bsiFX-eq">A = ' + C.html(mx.A) + '<br>S = −(∂A/∂T)<sub>V</sub> = ' + C.html(mx.S) + '<br>p = −(∂A/∂V)<sub>T</sub> = ' + C.html(mx.p) + '<br>(∂S/∂V)<sub>T</sub> = ' + C.html(mx.dSdV) + '<br>(∂p/∂T)<sub>V</sub> = ' + C.html(mx.dpdT) + '</div>' + (mx.uguali ? '✓ ' + t('Uguali: le derivate seconde miste di A commutano (Schwarz), e la termodinamica ne ricava una relazione misurabile.', 'Equal: the mixed second derivatives of A commute (Schwarz), and thermodynamics turns that into a measurable relation.') : '✗') }));
    pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', html: '<b>' + t('Differenziale esatto?', 'Exact differential?') + '</b> ' + t('M du + N dv: esatto se ∂M/∂v = ∂N/∂u.', 'M du + N dv: exact if ∂M/∂v = ∂N/∂u.') }));
    var vars = F.el('input', { type: 'text', value: 'T V', 'aria-label': t('variabili', 'variables') }), inM = F.el('input', { type: 'text', value: 'Cv', 'aria-label': 'M' }), inN = F.el('input', { type: 'text', value: 'R*T/V', 'aria-label': 'N' });
    pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('variabili u v:', 'variables u v:') })); pan.appendChild(vars);
    pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: 'M =' })); pan.appendChild(inM);
    pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: 'N =' })); pan.appendChild(inN);
    var es = F.el('div', { style: 'display:flex;flex-wrap:wrap;gap:4px;margin:6px 0' }); pan.appendChild(es);
    [['δq = Cv dT + (RT/V) dV', 'T V', 'Cv', 'R*T/V'], ['δq/T = dS', 'T V', 'Cv/T', 'R/V'], ['dU (gas perfetto)', 'T V', 'Cv', '0'], ['2xy dx + x² dy', 'x y', '2x*y', 'x^2'], ['y dx − x dy', 'x y', 'y', '-x']].forEach(function (p) {
      es.appendChild(F.el('button', { type: 'button', 'class': 'bsiFX-bott', testo: p[0], onclick: function () { vars.value = p[1]; inM.value = p[2]; inN.value = p[3]; prova(); } }));
    });
    var outE = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(outE);
    F.bottone(pan, ['Verifica', 'Check'], prova);
    function prova() {
      try {
        var uv = vars.value.trim().split(/[\s,;]+/); if (uv.length !== 2) throw new Error(t('servono due variabili', 'two variables are needed'));
        var r = esatto(C.leggi(inM.value), C.leggi(inN.value), uv[0], uv[1]);
        outE.innerHTML = '∂M/∂' + esc(uv[1]) + ' = ' + C.html(r.My) + ' · ∂N/∂' + esc(uv[0]) + ' = ' + C.html(r.Nx) + '<br>' + (r.esatto ? '<span class="bsiFX-ok">✓ ' + t('esatto: è il differenziale di una funzione di stato', 'exact: it is the differential of a state function') + '</span>' + (r.potenziale ? ' φ = ' + C.html(r.potenziale) + ' + cost.' : '') : '<span class="bsiFX-ko">✗ ' + t('non esatto: dipende dal cammino (come il calore e il lavoro)', 'not exact: path-dependent (like heat and work)') + '</span>');
      } catch (err) { outE.innerHTML = '<span class="bsiFX-ko">⚠ ' + esc(err.message) + '</span>'; }
    }
    var c = F.tela(dx, 0.62), info = F.el('div', { 'class': 'bsiFX-nota' }); dx.appendChild(info);
    function disegna() {
      var ab = GAS_VDW[gas], a = ab[0], b = ab[1], R = 0.083145, Tc = 8 * a / (27 * R * b), Vc = 3 * b, pc = a / (27 * b * b);
      var xs = [], serie = [], COL = ['#5eead4', '#ffd24a', '#ff8a80', '#7c6fff'];
      [T, Tc].forEach(function (TT, k) {
        var ys = []; xs = [];
        for (var i = 0; i <= 400; i++) { var V = b * 1.15 + (Vc * 8 - b * 1.15) * Math.pow(i / 400, 1.6); xs.push(V); ys.push(R * TT / (V - b) - a / (V * V)); }
        serie.push({ x: xs, y: ys, col: COL[k], larg: k ? 1.4 : 2.5, tratt: !!k });
        if (!k) serie.push({ x: xs, y: xs.map(function (V) { return R * TT / V; }), col: '#8494a8', larg: 1.2, tratt: true });
      });
      F.grafico(c, { serie: serie, xmin: 0, xmax: Vc * 8, ymin: Math.min(-pc * 0.5, 0), ymax: pc * 3, xl: 'V (L/mol)', yl: 'p (bar)', legenda: [{ col: COL[0], etich: 'van der Waals, T' }, { col: '#8494a8', etich: t('gas perfetto, T', 'ideal gas, T') }, { col: COL[1], etich: 'T = Tc' }] });
      var V0 = Vc * 2, dpdV = -R * T / Math.pow(V0 - b, 2) + 2 * a / Math.pow(V0, 3), dpdT = R / (V0 - b), p0 = R * T / (V0 - b) - a / (V0 * V0);
      var dVdT = -dpdT / dpdV, dTdp = 1 / dpdT;
      info.innerHTML = 'T<sub>c</sub> = 8a/(27Rb) = <b class="bsiFX-num">' + Tc.toFixed(1) + ' K</b> · p<sub>c</sub> = ' + pc.toFixed(1) + ' bar · V<sub>c</sub> = 3b = ' + Vc.toFixed(4) + ' L/mol' +
        (T < Tc ? '<br>' + t('Sotto Tc l’isoterma ha un tratto con (∂p/∂V)<sub>T</sub> > 0: è instabile, il gas si separa in liquido e vapore.', 'Below Tc the isotherm has a stretch with (∂p/∂V)<sub>T</sub> > 0: it is unstable, the gas splits into liquid and vapour.') : '') +
        '<br><br>' + t('In V = 2V<sub>c</sub>: ', 'At V = 2V<sub>c</sub>: ') + '(∂p/∂V)<sub>T</sub> = ' + dpdV.toFixed(3) + ', (∂p/∂T)<sub>V</sub> = ' + dpdT.toFixed(4) + '<br>' + t('Regola ciclica: ', 'Cyclic rule: ') + '(∂p/∂V)<sub>T</sub>(∂V/∂T)<sub>p</sub>(∂T/∂p)<sub>V</sub> = <b class="bsiFX-num">' + (dpdV * dVdT * dTdp).toFixed(6) + '</b> (' + t('sempre −1', 'always −1') + ')' +
        '<br>' + t('Dilatazione termica α = (1/V)(∂V/∂T)<sub>p</sub> = ', 'Thermal expansion α = (1/V)(∂V/∂T)<sub>p</sub> = ') + (dVdT / V0).toExponential(3) + ' K⁻¹ (' + t('gas perfetto: 1/T = ', 'ideal gas: 1/T = ') + (1 / T).toExponential(3) + ') · p = ' + p0.toFixed(2) + ' bar';
    }
    prova(); disegna(); F.alRidimensiona(disegna);
  }

  F.calcolo.multi = { analizza: analizza, discesa: discesa, maxwellVdW: maxwellVdW, esatto: esatto, GAS_VDW: GAS_VDW };

  F.sezione('smatmulti', {
    titolo: ['🗻 Funzioni di più variabili', '🗻 Functions of several variables'],
    sotto: ['Superfici in 3D e curve di livello, gradiente, hessiano e punti critici (minimi, massimi, selle — gli stati di transizione), discesa del gradiente; le funzioni di stato della termodinamica, le relazioni di Maxwell e i differenziali esatti.',
            '3D surfaces and contour maps, gradient, Hessian and critical points (minima, maxima, saddles — transition states), gradient descent; thermodynamic state functions, Maxwell relations and exact differentials.'],
    schede: [
      { nome: ['Superfici e punti critici', 'Surfaces and critical points'], costruisci: schedaSuperfici },
      { nome: ['Funzioni di stato', 'State functions'], costruisci: schedaStato }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
