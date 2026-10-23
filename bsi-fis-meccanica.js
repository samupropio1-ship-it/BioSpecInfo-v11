/* ═══════════════════════════════════════════════════════════════════════════
   bsi-fis-meccanica.js — 🎯 meccanica in movimento
   BioSpecInfo · © Samuele Pio Provenzano

   Quattro esperimenti che sulla carta si risolvono solo nel caso ideale e
   che qui si vedono anche nel caso vero:

   · PROIETTILE CON L'ARIA: resistenza quadratica F = −k m |v| v integrata
     con Runge-Kutta 4; la traiettoria si confronta con la parabola del
     vuoto e si cerca l'angolo di gittata massima, che con l'aria scende
     sotto i 45°;
   · URTI: due carrelli su un binario con coefficiente di restituzione e,
     dall'urto elastico (e = 1) al perfettamente anelastico (e = 0); si
     conserva la quantità di moto, l'energia persa e' ½μ(1 − e²)v_rel²;
   · PENDOLO VERO: il periodo esatto T = 4√(L/g)·K(sin(θ₀/2)) con l'integrale
     ellittico calcolato dalla media aritmetico-geometrica, contro quello
     delle piccole oscillazioni; lo spazio delle fasi (θ, ω) con la
     separatrice fra oscillazione e rotazione; lo smorzamento;
   · OSCILLATORI ACCOPPIATI: due masse e tre molle; i modi normali
     ω₁ = √(k/m) (in fase) e ω₂ = √((k + 2k_c)/m) (in opposizione) e il
     passaggio di energia da una massa all'altra (battimenti).
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, g = 9.80665;

  /* ── strumenti comuni per le animazioni ───────────────────────────────── */
  function griglia(div) { var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); G.appendChild(pan); G.appendChild(dx); div.appendChild(G); return { pan: pan, dx: dx }; }
  function pennello(c) {
    var dpr = Math.min(2, globale.devicePixelRatio || 1), w = Math.max(280, c.clientWidth || (c.parentNode && c.parentNode.clientWidth) || 600), h = Math.round(w * c._rapporto);
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    var q = c.getContext('2d'); q.setTransform(dpr, 0, 0, dpr, 0, 0); q.fillStyle = '#081522'; q.fillRect(0, 0, w, h);
    return { q: q, W: w, H: h };
  }
  /* un ciclo di animazione che si ferma quando la tela non e' visibile */
  function anima(c, passo) {
    var stato = { vivo: true, prec: 0 };
    function giro(ora) {
      if (!stato.vivo) return;
      if (!c.isConnected) { stato.vivo = false; return; }
      if (c.offsetParent !== null) { var dt = stato.prec ? Math.min(0.05, (ora - stato.prec) / 1000) : 0.016; stato.prec = ora; if (passo(dt) === false) { stato.vivo = false; return; } }
      else stato.prec = 0;
      globale.requestAnimationFrame(giro);
    }
    globale.requestAnimationFrame(giro);
    return { ferma: function () { stato.vivo = false; } };
  }
  function nota(pan) { var n = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(n); return n; }
  var fmt = F.fmt;

  /* ═══ calcoli ═══════════════════════════════════════════════════════════ */
  /* proiettile con resistenza quadratica: a = −g ŷ − k|v|v */
  function proiettile(v0, gradi, k, h0) {
    var th = gradi * Math.PI / 180, s = [0, h0 || 0, v0 * Math.cos(th), v0 * Math.sin(th)], dt = Math.max(1e-4, Math.min(0.01, v0 / g / 400)), pts = [[s[0], s[1]]], tt = 0, hmax = s[1];
    function f(u) { var v = Math.hypot(u[2], u[3]); return [u[2], u[3], -k * v * u[2], -g - k * v * u[3]]; }
    for (var i = 0; i < 2e6; i++) {
      var k1 = f(s), k2 = f(s.map(function (x, j) { return x + dt / 2 * k1[j]; })), k3 = f(s.map(function (x, j) { return x + dt / 2 * k2[j]; })), k4 = f(s.map(function (x, j) { return x + dt * k3[j]; }));
      var n = s.map(function (x, j) { return x + dt / 6 * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]); });
      if (n[1] < 0 && n[3] < 0) { var u = s[1] / (s[1] - n[1]); pts.push([s[0] + (n[0] - s[0]) * u, 0]); tt += dt * u; return { pts: pts, R: s[0] + (n[0] - s[0]) * u, T: tt, H: hmax, vfin: Math.hypot(s[2] + (n[2] - s[2]) * u, s[3] + (n[3] - s[3]) * u) }; }
      s = n; tt += dt; hmax = Math.max(hmax, s[1]); if (i % 4 === 0) pts.push([s[0], s[1]]);
    }
    return { pts: pts, R: s[0], T: tt, H: hmax, vfin: Math.hypot(s[2], s[3]) };
  }
  function angoloOttimo(v0, k, h0) {
    var a = 1, b = 89; for (var i = 0; i < 60; i++) { var m1 = a + (b - a) / 3, m2 = b - (b - a) / 3; if (proiettile(v0, m1, k, h0).R < proiettile(v0, m2, k, h0).R) a = m1; else b = m2; }
    return (a + b) / 2;
  }
  /* urto unidimensionale con coefficiente di restituzione */
  function urto(m1, v1, m2, v2, e) {
    var P = m1 * v1 + m2 * v2, M = m1 + m2, u1 = (P - m2 * e * (v1 - v2)) / M, u2 = (P + m1 * e * (v1 - v2)) / M;
    var K0 = 0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2, K1 = 0.5 * m1 * u1 * u1 + 0.5 * m2 * u2 * u2;
    return { u1: u1, u2: u2, P0: P, P1: m1 * u1 + m2 * u2, K0: K0, K1: K1, persa: K0 - K1, vcm: P / M };
  }
  /* integrale ellittico completo di prima specie con la media aritmetico-geometrica */
  function ellitticoK(k) { var a = 1, b = Math.sqrt(1 - k * k); for (var i = 0; i < 40; i++) { var an = (a + b) / 2; b = Math.sqrt(a * b); a = an; if (Math.abs(a - b) < 1e-15) break; } return Math.PI / (2 * a); }
  function periodoPendolo(L, gradi) { return 4 * Math.sqrt(L / g) * ellitticoK(Math.sin(gradi * Math.PI / 360)); }
  /* pendolo non lineare smorzato: θ'' = −(g/L) sin θ − γ θ' */
  function passoPendolo(s, L, gam, dt) {
    function f(u) { return [u[1], -(g / L) * Math.sin(u[0]) - gam * u[1]]; }
    var k1 = f(s), k2 = f([s[0] + dt / 2 * k1[0], s[1] + dt / 2 * k1[1]]), k3 = f([s[0] + dt / 2 * k2[0], s[1] + dt / 2 * k2[1]]), k4 = f([s[0] + dt * k3[0], s[1] + dt * k3[1]]);
    return [s[0] + dt / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), s[1] + dt / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])];
  }
  /* due masse uguali, molle k ai lati e k_c in mezzo: soluzione esatta per modi normali */
  function accoppiati(k, kc, m, x10, x20) {
    var w1 = Math.sqrt(k / m), w2 = Math.sqrt((k + 2 * kc) / m), a = (x10 + x20) / 2, b = (x10 - x20) / 2;
    return { w1: w1, w2: w2, x1: function (tt) { return a * Math.cos(w1 * tt) + b * Math.cos(w2 * tt); }, x2: function (tt) { return a * Math.cos(w1 * tt) - b * Math.cos(w2 * tt); }, Tbatt: 2 * Math.PI / Math.abs(w2 - w1) };
  }
  F.calcolo.meccanica = { proiettile: proiettile, angoloOttimo: angoloOttimo, urto: urto, ellitticoK: ellitticoK, periodoPendolo: periodoPendolo, passoPendolo: passoPendolo, accoppiati: accoppiati };

  /* ═══ 1. proiettile ═════════════════════════════════════════════════════ */
  function schedaProiettile(div) {
    var G = griglia(div), st = { v0: 30, th: 45, k: 0.01, h: 0 }, info;
    F.cursore(G.pan, ['v₀ (m/s)', 'v₀ (m/s)'], 5, 120, 1, st.v0, function (v) { st.v0 = v; calcola(); });
    F.cursore(G.pan, ['angolo θ (°)', 'angle θ (°)'], 1, 89, 1, st.th, function (v) { st.th = v; calcola(); });
    F.cursore(G.pan, ['resistenza k (1/m)', 'drag k (1/m)'], 0, 0.05, 0.001, st.k, function (v) { st.k = v; calcola(); }, function (v) { return v.toFixed(3); });
    F.cursore(G.pan, ['quota di lancio (m)', 'launch height (m)'], 0, 50, 1, st.h, function (v) { st.h = v; calcola(); });
    F.bottone(G.pan, ['Lancia di nuovo', 'Launch again'], function () { k0 = 0; if (!giro) avvia(); });
    info = nota(G.pan);
    var c = F.tela(G.dx, 0.6), A, V, k0 = 0, giro = null, opt;
    function calcola() {
      A = proiettile(st.v0, st.th, st.k, st.h); V = proiettile(st.v0, st.th, 0, st.h); opt = st.k > 0 ? angoloOttimo(st.v0, st.k, st.h) : angoloOttimo(st.v0, 0, st.h);
      info.innerHTML = t('Con l’aria: gittata ', 'With air: range ') + '<b class="bsiFX-num">' + fmt(A.R) + ' m</b>, ' + t('quota massima ', 'max height ') + fmt(A.H) + ' m, ' + t('volo ', 'flight ') + fmt(A.T) + ' s, ' + t('arriva a ', 'lands at ') + fmt(A.vfin) + ' m/s' +
        '<br>' + t('Nel vuoto: gittata ', 'In vacuum: range ') + fmt(V.R) + ' m, ' + t('quota ', 'height ') + fmt(V.H) + ' m' + (st.h === 0 ? ' (v₀² sin 2θ / g = ' + fmt(st.v0 * st.v0 * Math.sin(2 * st.th * Math.PI / 180) / g) + ')' : '') +
        '<br>' + t('Angolo di gittata massima: ', 'Angle of maximum range: ') + '<b>' + fmt(opt) + '°</b>' + (st.k > 0 ? t(' (nel vuoto e da terra sarebbe 45°: la resistenza lo abbassa)', ' (45° in vacuum from the ground: drag lowers it)') : '') +
        '<br>' + t('Velocità limite in caduta √(g/k) = ', 'Terminal velocity √(g/k) = ') + (st.k > 0 ? fmt(Math.sqrt(g / st.k)) + ' m/s' : '∞');
      k0 = 0; if (!giro) avvia();
    }
    function disegna(f) {
      var xs = V.pts.map(function (p) { return p[0]; }), ys = V.pts.map(function (p) { return p[1]; }), n = Math.max(2, Math.floor(A.pts.length * f));
      var o = F.grafico(c, { serie: [{ x: xs, y: ys, col: '#7c6fff', tratt: true, etich: ['nel vuoto', 'vacuum'] }, { x: A.pts.slice(0, n).map(function (p) { return p[0]; }), y: A.pts.slice(0, n).map(function (p) { return p[1]; }), col: '#5eead4', larg: 2.5, etich: ['con l’aria', 'with air'] }], xmin: 0, xmax: Math.max(V.R, A.R) * 1.05, ymin: 0, ymax: Math.max(V.H, A.H) * 1.15 + 0.1, xl: ['x (m)', 'x (m)'], yl: ['y (m)', 'y (m)'], legenda: [{ col: '#7c6fff', etich: ['nel vuoto', 'vacuum'] }, { col: '#5eead4', etich: ['con l’aria', 'with air'] }] });
      var p = A.pts[n - 1]; o.q.fillStyle = '#ffd24a'; o.q.beginPath(); o.q.arc(o.X(p[0]), o.Y(p[1]), 6, 0, Math.PI * 2); o.q.fill();
    }
    function avvia() { giro = anima(c, function (dt) { k0 = Math.min(1, k0 + dt / Math.max(1, Math.min(3, A.T / 2))); disegna(k0); if (k0 >= 1) { giro = null; return false; } }); }
    calcola(); F.alRidimensiona(function () { disegna(1); });
  }

  /* ═══ 2. urti ═══════════════════════════════════════════════════════════ */
  function schedaUrti(div) {
    var G = griglia(div), st = { m1: 2, v1: 3, m2: 1, v2: -1, e: 1 }, info;
    F.cursore(G.pan, ['m₁ (kg)', 'm₁ (kg)'], 0.5, 10, 0.5, st.m1, function (v) { st.m1 = v; ricomincia(); });
    F.cursore(G.pan, ['v₁ (m/s)', 'v₁ (m/s)'], -5, 5, 0.5, st.v1, function (v) { st.v1 = v; ricomincia(); });
    F.cursore(G.pan, ['m₂ (kg)', 'm₂ (kg)'], 0.5, 10, 0.5, st.m2, function (v) { st.m2 = v; ricomincia(); });
    F.cursore(G.pan, ['v₂ (m/s)', 'v₂ (m/s)'], -5, 5, 0.5, st.v2, function (v) { st.v2 = v; ricomincia(); });
    F.cursore(G.pan, ['restituzione e', 'restitution e'], 0, 1, 0.05, st.e, function (v) { st.e = v; ricomincia(); }, function (v) { return v === 1 ? t('1 (elastico)', '1 (elastic)') : v === 0 ? t('0 (anelastico)', '0 (inelastic)') : v.toFixed(2); });
    F.bottone(G.pan, ['Ricomincia', 'Restart'], function () { ricomincia(); });
    info = nota(G.pan);
    var c = F.tela(G.dx, 0.36), sim, giro = null;
    function ricomincia() {
      var r = urto(st.m1, st.v1, st.m2, st.v2, st.e);
      sim = { x1: -2.2, x2: 2.2, v1: st.v1, v2: st.v2, urtato: false, tt: 0, r: r };
      if (st.v1 - st.v2 <= 0) info.innerHTML = t('Con queste velocità i carrelli non si avvicinano: nessun urto.', 'With these velocities the carts do not approach: no collision.');
      else info.innerHTML = t('Dopo l’urto: ', 'After the collision: ') + 'v₁′ = <b class="bsiFX-num">' + fmt(r.u1) + '</b> m/s, v₂′ = <b class="bsiFX-num">' + fmt(r.u2) + '</b> m/s<br>' +
        t('Quantità di moto: ', 'Momentum: ') + fmt(r.P0) + ' → ' + fmt(r.P1) + ' kg·m/s (' + t('si conserva sempre', 'always conserved') + ')<br>' +
        t('Energia cinetica: ', 'Kinetic energy: ') + fmt(r.K0) + ' → ' + fmt(r.K1) + ' J; ' + t('persa ', 'lost ') + '<b>' + fmt(r.persa) + ' J</b> = ½μ(1 − e²)v_rel² ' + t('con μ = m₁m₂/(m₁+m₂)', 'with μ = m₁m₂/(m₁+m₂)') + '<br>' +
        t('Il centro di massa si muove sempre a ', 'The centre of mass always moves at ') + fmt(r.vcm) + ' m/s' + (st.e === 1 && st.m1 === st.m2 ? t('. Masse uguali, urto elastico: le velocità si scambiano.', '. Equal masses, elastic collision: velocities swap.') : '');
      if (!giro) giro = anima(c, passo);
    }
    function passo(dt) {
      var s = sim, w1 = 0.25 * Math.cbrt(st.m1), w2 = 0.25 * Math.cbrt(st.m2);
      s.tt += dt;
      if (!s.urtato && s.x2 - s.x1 <= (w1 + w2) && s.v1 > s.v2) { s.v1 = s.r.u1; s.v2 = s.r.u2; s.urtato = true; }
      s.x1 += s.v1 * dt * 0.5; s.x2 += s.v2 * dt * 0.5;
      var P = pennello(c), q = P.q, W = P.W, H = P.H, X = function (x) { return W / 2 + x * W / 7; }, y0 = H * 0.68;
      q.strokeStyle = '#34465f'; q.lineWidth = 2; q.beginPath(); q.moveTo(10, y0); q.lineTo(W - 10, y0); q.stroke();
      [[s.x1, w1, '#5eead4', 'm₁', s.v1], [s.x2, w2, '#ff8a80', 'm₂', s.v2]].forEach(function (b) {
        var x = X(b[0]), w = b[1] * W / 7, h = 26 + 10 * b[1];
        q.fillStyle = b[2]; q.fillRect(x - w, y0 - h, 2 * w, h);
        q.fillStyle = '#081522'; q.font = 'bold 12px system-ui'; q.textAlign = 'center'; q.fillText(b[3], x, y0 - h / 2 + 4);
        q.strokeStyle = b[2]; q.fillStyle = b[2]; q.lineWidth = 2; var L = b[4] * 18; q.beginPath(); q.moveTo(x, y0 - h - 10); q.lineTo(x + L, y0 - h - 10); q.stroke();
        if (Math.abs(L) > 4) { q.beginPath(); q.moveTo(x + L, y0 - h - 10); q.lineTo(x + L - 6 * Math.sign(L), y0 - h - 14); q.lineTo(x + L - 6 * Math.sign(L), y0 - h - 6); q.fill(); }
        q.font = '11px system-ui'; q.fillText(fmt(b[4]) + ' m/s', x, y0 + 16);
      });
      var xcm = (st.m1 * s.x1 + st.m2 * s.x2) / (st.m1 + st.m2); q.fillStyle = '#ffd24a'; q.beginPath(); q.moveTo(X(xcm), y0 + 22); q.lineTo(X(xcm) - 5, y0 + 30); q.lineTo(X(xcm) + 5, y0 + 30); q.fill(); q.font = '10px system-ui'; q.fillText(t('CM', 'CM'), X(xcm), y0 + 42);
      c.setAttribute('aria-label', t('urto fra due carrelli', 'collision between two carts'));
      if (Math.abs(s.x1) > 4 && Math.abs(s.x2) > 4 || s.tt > 14) { giro = null; return false; }
    }
    ricomincia();
  }

  /* ═══ 3. pendolo ════════════════════════════════════════════════════════ */
  function schedaPendolo(div) {
    var G = griglia(div), st = { L: 1, th: 60, gam: 0 }, info;
    F.cursore(G.pan, ['lunghezza L (m)', 'length L (m)'], 0.2, 3, 0.1, st.L, function (v) { st.L = v; ricomincia(); }, function (v) { return v.toFixed(1); });
    F.cursore(G.pan, ['ampiezza θ₀ (°)', 'amplitude θ₀ (°)'], 1, 179, 1, st.th, function (v) { st.th = v; ricomincia(); });
    F.cursore(G.pan, ['smorzamento γ (1/s)', 'damping γ (1/s)'], 0, 1, 0.02, st.gam, function (v) { st.gam = v; ricomincia(); }, function (v) { return v.toFixed(2); });
    info = nota(G.pan);
    var c = F.tela(G.dx, 0.5), s, scia, giro = null;
    function ricomincia() {
      s = [st.th * Math.PI / 180, 0]; scia = [];
      var Te = periodoPendolo(st.L, st.th), T0 = 2 * Math.PI * Math.sqrt(st.L / g);
      info.innerHTML = t('Periodo esatto ', 'Exact period ') + 'T = 4√(L/g)·K(sin θ₀/2) = <b class="bsiFX-num">' + fmt(Te) + ' s</b><br>' + t('Piccole oscillazioni ', 'Small oscillations ') + 'T₀ = 2π√(L/g) = ' + fmt(T0) + ' s<br>' + t('Errore dell’approssimazione: ', 'Error of the approximation: ') + '<b>' + fmt((Te / T0 - 1) * 100) + ' %</b>' + (st.th <= 15 ? t(' (sotto l’1 % fino a circa 23°)', ' (below 1 % up to about 23°)') : '') +
        '<br>' + t('A destra lo spazio delle fasi (θ, ω): le curve chiuse sono oscillazioni, la separatrice (tratteggiata) passa per θ = ±180°; con lo smorzamento la traiettoria spiraleggia verso l’origine.', 'Right: phase space (θ, ω): closed curves are oscillations, the separatrix (dashed) goes through θ = ±180°; with damping the trajectory spirals into the origin.');
      if (!giro) giro = anima(c, passo);
    }
    function passo(dt) {
      for (var i = 0; i < 8; i++) s = passoPendolo(s, st.L, st.gam, dt / 8);
      scia.push([s[0], s[1]]); if (scia.length > 1500) scia.shift();
      var P = pennello(c), q = P.q, W = P.W, H = P.H;
      /* il pendolo a sinistra */
      var ox = W * 0.25, oy = H * 0.12, Lp = Math.min(W * 0.2, H * 0.38), x = ox + Lp * Math.sin(s[0]), y = oy + Lp * Math.cos(s[0]);
      q.strokeStyle = '#34465f'; q.setLineDash([3, 4]); q.beginPath(); q.moveTo(ox, oy); q.lineTo(ox, oy + Lp * 1.1); q.stroke(); q.setLineDash([]);
      q.strokeStyle = '#c9d3df'; q.lineWidth = 2; q.beginPath(); q.moveTo(ox, oy); q.lineTo(x, y); q.stroke();
      q.fillStyle = '#5eead4'; q.beginPath(); q.arc(x, y, 12, 0, Math.PI * 2); q.fill(); q.fillStyle = '#8494a8'; q.fillRect(ox - 20, oy - 4, 40, 4);
      q.fillStyle = '#c9d3df'; q.font = '12px system-ui'; q.textAlign = 'left'; q.fillText('θ = ' + fmt(s[0] * 180 / Math.PI) + '°', 10, H - 12);
      /* lo spazio delle fasi a destra */
      var px0 = W * 0.52, pw = W * 0.45, py0 = H * 0.08, ph = H * 0.84, wmax = 2.2 * Math.sqrt(g / st.L), PX = function (a) { return px0 + (a / (2 * Math.PI) + 0.5) * pw; }, PY = function (w) { return py0 + ph / 2 - w / wmax * ph / 2; };
      q.strokeStyle = '#1d2f49'; q.strokeRect(px0, py0, pw, ph); q.beginPath(); q.moveTo(px0, PY(0)); q.lineTo(px0 + pw, PY(0)); q.moveTo(PX(0), py0); q.lineTo(PX(0), py0 + ph); q.stroke();
      /* separatrice: ω = ±2√(g/L) cos(θ/2) */
      q.strokeStyle = '#ffd24a'; q.setLineDash([4, 4]);
      [1, -1].forEach(function (sg) { q.beginPath(); for (var i = 0; i <= 120; i++) { var a = -Math.PI + 2 * Math.PI * i / 120, w = sg * 2 * Math.sqrt(g / st.L) * Math.cos(a / 2); if (i) q.lineTo(PX(a), PY(w)); else q.moveTo(PX(a), PY(w)); } q.stroke(); });
      q.setLineDash([]);
      q.strokeStyle = '#5eead4'; q.lineWidth = 1.5; q.beginPath();
      scia.forEach(function (p, i) { var a = Math.atan2(Math.sin(p[0]), Math.cos(p[0])), xp = PX(a), yp = PY(p[1]); if (i && Math.abs(a - Math.atan2(Math.sin(scia[i - 1][0]), Math.cos(scia[i - 1][0]))) > Math.PI) q.moveTo(xp, yp); else if (i) q.lineTo(xp, yp); else q.moveTo(xp, yp); });
      q.stroke();
      var a0 = Math.atan2(Math.sin(s[0]), Math.cos(s[0])); q.fillStyle = '#ff8a80'; q.beginPath(); q.arc(PX(a0), PY(s[1]), 4, 0, Math.PI * 2); q.fill();
      q.fillStyle = '#9fb1c6'; q.font = '11px system-ui'; q.textAlign = 'center'; q.fillText('θ', px0 + pw - 8, PY(0) - 4); q.fillText('ω', PX(0) + 10, py0 + 12);
      q.fillText('−180°', PX(-Math.PI) + 14, py0 + ph - 4); q.fillText('180°', PX(Math.PI) - 12, py0 + ph - 4);
      c.setAttribute('aria-label', t('pendolo e spazio delle fasi', 'pendulum and phase space'));
    }
    ricomincia();
  }

  /* ═══ 4. oscillatori accoppiati ═════════════════════════════════════════ */
  function schedaAccoppiati(div) {
    var G = griglia(div), st = { k: 10, kc: 1, m: 1, modo: 'uno' }, info, tt = 0, sol;
    F.cursore(G.pan, ['k molle esterne (N/m)', 'k outer springs (N/m)'], 1, 30, 1, st.k, function (v) { st.k = v; ricomincia(); });
    F.cursore(G.pan, ['k_c molla centrale (N/m)', 'k_c middle spring (N/m)'], 0.1, 10, 0.1, st.kc, function (v) { st.kc = v; ricomincia(); }, function (v) { return v.toFixed(1); });
    F.scelta(G.pan, ['Condizione iniziale', 'Initial condition'], [['uno', t('sposto solo la prima massa', 'displace only the first mass')], ['fase', t('modo in fase (x₁ = x₂)', 'in-phase mode (x₁ = x₂)')], ['opp', t('modo in opposizione (x₁ = −x₂)', 'out-of-phase mode (x₁ = −x₂)')]], st.modo, function (v) { st.modo = v; ricomincia(); });
    info = nota(G.pan);
    var c = F.tela(G.dx, 0.3), c2 = F.tela(G.dx, 0.42), giro = null;
    function ricomincia() {
      var A = 1, x10 = A, x20 = st.modo === 'uno' ? 0 : st.modo === 'fase' ? A : -A;
      sol = accoppiati(st.k, st.kc, st.m, x10, x20); tt = 0;
      info.innerHTML = t('Modo in fase ', 'In-phase mode ') + 'ω₁ = √(k/m) = <b class="bsiFX-num">' + fmt(sol.w1) + '</b> rad/s · ' + t('in opposizione ', 'out-of-phase ') + 'ω₂ = √((k + 2k_c)/m) = <b class="bsiFX-num">' + fmt(sol.w2) + '</b> rad/s<br>' +
        (st.modo === 'uno' ? t('Spostando una sola massa si eccitano entrambi i modi: l’energia passa da una massa all’altra con periodo ', 'Displacing one mass excites both modes: energy flows from one mass to the other with period ') + '2π/(ω₂ − ω₁) = <b>' + fmt(sol.Tbatt) + ' s</b>. ' + t('Più debole è l’accoppiamento, più lento lo scambio.', 'The weaker the coupling, the slower the exchange.') : t('Partendo da un modo normale le masse oscillano per sempre con una sola frequenza: è questo che rende i modi «normali».', 'Starting from a normal mode the masses oscillate for ever at a single frequency: that is what makes modes «normal».')) +
        '<br>' + t('È lo stesso fenomeno delle vibrazioni simmetrica e antisimmetrica di CO₂ e H₂O.', 'It is the same phenomenon as the symmetric and antisymmetric vibrations of CO₂ and H₂O.');
      grafico();
      if (!giro) giro = anima(c, passo);
    }
    function grafico() {
      var xs = [], a = [], b = [], Tm = Math.min(60, Math.max(4 * 2 * Math.PI / sol.w1, 1.3 * sol.Tbatt)); for (var i = 0; i <= 900; i++) { var u = Tm * i / 900; xs.push(u); a.push(sol.x1(u)); b.push(sol.x2(u)); }
      F.grafico(c2, { serie: [{ x: xs, y: a, col: '#5eead4', etich: 'x₁' }, { x: xs, y: b, col: '#ff8a80', etich: 'x₂' }], ymin: -1.1, ymax: 1.1, xl: ['t (s)', 't (s)'], yl: ['spostamento', 'displacement'], legenda: [{ col: '#5eead4', etich: 'x₁' }, { col: '#ff8a80', etich: 'x₂' }] });
    }
    function passo(dt) {
      tt += dt; var P = pennello(c), q = P.q, W = P.W, H = P.H, y0 = H / 2, A = W * 0.07, x1 = W / 3 + sol.x1(tt) * A, x2 = 2 * W / 3 + sol.x2(tt) * A;
      function molla(xa, xb, col, n) { q.strokeStyle = col; q.lineWidth = 1.6; q.beginPath(); q.moveTo(xa, y0); for (var i = 1; i < n * 2; i++) q.lineTo(xa + (xb - xa) * i / (n * 2), y0 + (i % 2 ? -8 : 8)); q.lineTo(xb, y0); q.stroke(); }
      q.fillStyle = '#34465f'; q.fillRect(6, y0 - 22, 6, 44); q.fillRect(W - 12, y0 - 22, 6, 44);
      molla(12, x1 - 16, '#9fb1c6', 7); molla(x1 + 16, x2 - 16, '#ffd24a', 7); molla(x2 + 16, W - 12, '#9fb1c6', 7);
      q.fillStyle = '#5eead4'; q.fillRect(x1 - 16, y0 - 16, 32, 32); q.fillStyle = '#ff8a80'; q.fillRect(x2 - 16, y0 - 16, 32, 32);
      c.setAttribute('aria-label', t('due masse accoppiate da molle', 'two masses coupled by springs'));
    }
    ricomincia(); F.alRidimensiona(grafico);
  }

  F.sezione('sfismecc', {
    titolo: ['🎯 Meccanica in movimento', '🎯 Mechanics in motion'],
    sotto: ['Il proiettile con la resistenza dell’aria, gli urti dall’elastico all’anelastico, il pendolo vero con lo spazio delle fasi, gli oscillatori accoppiati e i modi normali: animati, con i numeri che li descrivono.', 'Projectile with air drag, collisions from elastic to inelastic, the real pendulum with its phase space, coupled oscillators and normal modes: animated, with the numbers that describe them.'],
    schede: [
      { nome: ['🏹 Proiettile con l’aria', '🏹 Projectile with air'], costruisci: schedaProiettile },
      { nome: ['💥 Urti', '💥 Collisions'], costruisci: schedaUrti },
      { nome: ['🕰️ Pendolo vero', '🕰️ Real pendulum'], costruisci: schedaPendolo },
      { nome: ['🔗 Oscillatori accoppiati', '🔗 Coupled oscillators'], costruisci: schedaAccoppiati }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
