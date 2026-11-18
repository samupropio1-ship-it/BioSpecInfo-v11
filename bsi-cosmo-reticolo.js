/* ═══════════════════════════════════════════════════════════════════════
   bsi-cosmo-reticolo.js — 🎞️ 2 · «Ecco come la gravità curva lo spaziotempo» (v258)
   BioSpecInfo · © Samuele Pio Provenzano

   CHE COSA È CALCOLATO E CHE COSA È UN'ANALOGIA
   · Il reticolo cubico 3D è una VISUALIZZAZIONE: ogni nodo è spostato verso la
     massa di Δr = −k·M/(r + ε), cioè in proporzione al potenziale newtoniano.
     Non è la metrica di Schwarzschild (quella non si disegna come uno
     spostamento di punti nello spazio): la didascalia lo dice.
   · Quando la massa sparisce, ogni nodo torna al cubo regolare come un
     oscillatore smorzato VERO, x'' = −ω²(x − x₀) − 2ζω x', con ζ = 0,22: per
     questo le linee oscillano prima di fermarsi; quando la massa ritorna, si
     richiudono con la stessa dinamica.
   · Il satellite segue un'orbita circolare kepleriana, v = √(GM/r), con la
     massa della scena: se la massa sparisce, prosegue in linea retta (prima
     legge di Newton), e al ritorno della massa viene ricatturato in orbita.
   ═══════════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  var F = g.BSIFisica, C = g.BSICosmo, D = g.document;
  if (!F || !C) return;
  var t = F.t, PI = Math.PI;
  var CONST = { lato: 10, k: 2.6, eps: 0.9, omega: 5.2, zeta: 0.22, GM: 9.0, rOrbita: 2.4 };
  function spostamento(x, y, z, M) { var r = Math.sqrt(x * x + y * y + z * z) || 1e-6, d = CONST.k * M / (r + CONST.eps), f = Math.min(d, r * 0.85) / r; return [-x * f, -y * f, -z * f]; }
  function hsl(h, s, l) { var a = s * Math.min(l, 1 - l), f = function (n) { var k = (n + h * 12) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); }; return [f(0), f(8), f(4)]; }
  function texturaLuna(T) {
    var c = D.createElement('canvas'); c.width = 512; c.height = 256; var q = c.getContext('2d'); q.fillStyle = '#8c8c8c'; q.fillRect(0, 0, 512, 256);
    var s = 3; function r() { s = (s * 16807) % 2147483647; return s / 2147483647; }
    for (var i = 0; i < 260; i++) { var x = r() * 512, y = r() * 256, R = 2 + Math.pow(r(), 3) * 26, gr = q.createRadialGradient(x - R * 0.2, y - R * 0.2, 0, x, y, R); gr.addColorStop(0, 'rgba(60,60,60,.55)'); gr.addColorStop(0.75, 'rgba(110,110,110,.25)'); gr.addColorStop(0.9, 'rgba(200,200,200,.35)'); gr.addColorStop(1, 'rgba(140,140,140,0)'); q.fillStyle = gr; q.beginPath(); q.arc(x, y, R, 0, 2 * PI); q.fill(); }
    var tx = new T.CanvasTexture(c); return tx;
  }
  C.registra('reticolo', {
    n: 2, etichetta: t('spaziotempo', 'spacetime'), bagliore: 1.3,
    titolo: ['Ecco come la gravità curva lo spaziotempo', 'Here\'s how gravity creates curvature in spacetime'],
    init: function (ctx) {
      var S = ctx.S, T = ctx.T, dur = 14, st = { n: 12, M: 1, Mobiettivo: 1, satellite: true };
      if (ctx.didaEl) { ctx.didaEl.style.top = '2.5%'; ctx.didaEl.style.color = '#9ff5e6'; } ctx.hud.style.top = '82px';
      var luna = new T.Mesh(new T.SphereGeometry(0.75, 64, 48), new T.MeshStandardMaterial({ map: texturaLuna(T), roughness: 0.95 })); luna.name = 'massa'; S.aggiungi(luna);
      var sat = new T.Mesh(new T.SphereGeometry(0.07, 16, 12), new T.MeshBasicMaterial({ color: 0xffffff })); sat.name = 'satellite'; S.aggiungi(sat);
      var scia = [], sciaGeo = new T.BufferGeometry(); sciaGeo.setAttribute('position', new T.BufferAttribute(new Float32Array(240 * 3), 3));
      var sciaL = new T.Line(sciaGeo, new T.LineBasicMaterial({ color: 0xdff6ff, transparent: true, opacity: 0.7, blending: T.AdditiveBlending })); S.aggiungi(sciaL);
      var linee = null, base = null, cur = null, vel = null, lato = CONST.lato;
      function costruisci() {
        if (linee) { S.radice.remove(linee); linee.geometry.dispose(); }
        var n = st.n, pos = [], idx = [], col = []; base = [];
        for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) for (var k = 0; k < n; k++) { var x = (i / (n - 1) - 0.5) * lato, y = (j / (n - 1) - 0.5) * lato, z = (k / (n - 1) - 0.5) * lato; base.push(x, y, z); var c = hsl(((i + j * 0.6 + k * 0.3) / n * 0.9 + 0.75) % 1, 0.95, 0.58); col.push(c[0], c[1], c[2]); }
        function id(i, j, k) { return (i * n + j) * n + k; }
        for (i = 0; i < n; i++) for (j = 0; j < n; j++) for (k = 0; k < n; k++) { if (i < n - 1) idx.push(id(i, j, k), id(i + 1, j, k)); if (j < n - 1) idx.push(id(i, j, k), id(i, j + 1, k)); if (k < n - 1) idx.push(id(i, j, k), id(i, j, k + 1)); }
        cur = new Float32Array(base.length); vel = new Float32Array(base.length);
        for (var p = 0; p < base.length; p += 3) { var d = spostamento(base[p], base[p + 1], base[p + 2], st.M); cur[p] = base[p] + d[0]; cur[p + 1] = base[p + 1] + d[1]; cur[p + 2] = base[p + 2] + d[2]; }
        var geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(cur, 3)); geo.setAttribute('color', new T.Float32BufferAttribute(col, 3)); geo.setIndex(idx);
        linee = new T.LineSegments(geo, new T.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.75, blending: T.AdditiveBlending, depthWrite: false })); linee.name = 'reticolo'; S.aggiungi(linee);
      }
      costruisci();
      /* stelle di sfondo */
      (function () { var p = []; for (var i = 0; i < 1500; i++) { var u = Math.random() * 2 - 1, a = Math.random() * 2 * PI, r = 60 + Math.random() * 40, s2 = Math.sqrt(1 - u * u); p.push(r * s2 * Math.cos(a), r * s2 * Math.sin(a), r * u); } var gg = new T.BufferGeometry(); gg.setAttribute('position', new T.Float32BufferAttribute(p, 3)); S.aggiungi(new T.Points(gg, new T.PointsMaterial({ color: 0xbfd0ff, size: 0.18, transparent: true, opacity: 0.7 }))); })();
      /* il satellite: stato dinamico vero */
      var sp = [CONST.rOrbita, 0, 0.4], sv = [0, Math.sqrt(CONST.GM / Math.hypot(CONST.rOrbita, 0.4)), 0];
      function passoSatellite(dt) {
        var n = 8, h = dt / n;
        for (var s = 0; s < n; s++) {
          var r = Math.hypot(sp[0], sp[1], sp[2]), a = -CONST.GM * st.M / (r * r * r);
          sv[0] += a * sp[0] * h; sv[1] += a * sp[1] * h; sv[2] += a * sp[2] * h; sp[0] += sv[0] * h; sp[1] += sv[1] * h; sp[2] += sv[2] * h;
          r = Math.hypot(sp[0], sp[1], sp[2]);
          /* ricattura dichiarata: tornata la massa, se il satellite è lontano lo si rimette in orbita circolare */
          if (st.M > 0.95 && r > 4.5) { var f = CONST.rOrbita / r; sp[0] *= f; sp[1] *= f; sp[2] = 0.4; var v = Math.sqrt(CONST.GM / Math.hypot(CONST.rOrbita, 0.4)), th = Math.atan2(sp[1], sp[0]); sv = [-v * Math.sin(th), v * Math.cos(th), 0]; }
        }
        sat.position.set(sp[0], sp[1], sp[2]); scia.push(sp[0], sp[1], sp[2]); if (scia.length > 720) scia.splice(0, 3);
        sciaGeo.attributes.position.array.set(scia); sciaGeo.setDrawRange(0, scia.length / 3); sciaGeo.attributes.position.needsUpdate = true;
      }
      function passo(dt, tt, stato, cinem) {
        if (cinem) st.Mobiettivo = stato.massa != null ? stato.massa : 1;
        st.M += (st.Mobiettivo - st.M) * Math.min(1, dt * 3);
        luna.material.transparent = true; luna.material.opacity = Math.max(0, Math.min(1, st.M)); luna.visible = st.M > 0.02; luna.scale.setScalar(0.4 + 0.6 * Math.min(1, st.M));
        /* nodi: oscillatori smorzati verso la posizione spostata della massa attuale */
        var w = CONST.omega, z = CONST.zeta, h = Math.min(dt, 0.03), a = linee.geometry.attributes.position.array;
        for (var p = 0; p < base.length; p += 3) {
          var d = spostamento(base[p], base[p + 1], base[p + 2], st.M);
          for (var q = 0; q < 3; q++) { var x0 = base[p + q] + d[q], acc = -w * w * (cur[p + q] - x0) - 2 * z * w * vel[p + q]; vel[p + q] += acc * h; cur[p + q] += vel[p + q] * h; }
        }
        a.set(cur); linee.geometry.attributes.position.needsUpdate = true;
        sat.visible = sciaL.visible = st.satellite; if (st.satellite) passoSatellite(Math.min(dt, 0.05));
        luna.rotation.z += dt * 0.2;
        ctx.hud.innerHTML = t('massa ', 'mass ') + Math.round(st.M * 100) + ' %<br>' + t('reticolo ', 'lattice ') + st.n + '×' + st.n + '×' + st.n + '<br>' + t('VISUALIZZAZIONE: nodi spostati ∝ GM/r', 'VISUALISATION: nodes displaced ∝ GM/r') + '<br>' + t('orbita del satellite: Kepler, v = √(GM/r)', 'satellite orbit: Kepler, v = √(GM/r)');
        ctx.stato.innerHTML = '';
      }
      F.cursore(ctx.pannello, ['Massa', 'Mass'], 0, 1.5, 0.05, 1, function (v) { st.Mobiettivo = v; }, function (v) { return Math.round(v * 100) + ' %'; });
      F.cursore(ctx.pannello, ['Densità del reticolo', 'Lattice density'], 6, 16, 1, 12, function (v) { st.n = v; costruisci(); }, function (v) { return v + '³'; });
      var cs = F.el('input', { type: 'checkbox', 'aria-label': t('Satellite', 'Satellite') }); cs.checked = true; cs.addEventListener('change', function () { st.satellite = cs.checked; });
      ctx.pannello.appendChild(F.el('label', { style: 'display:flex;gap:6px;align-items:center;color:#cfe3f7;font-size:.86rem' }, [cs, F.el('span', { testo: t('Mostra il satellite', 'Show the satellite') })]));
      /* la camera gira di 360° in 10 s e si inclina */
      var tl = []; for (var i = 0; i <= 14; i++) { var a2 = -PI / 2 + i / 10 * 2 * PI, h2 = 3 + 4 * Math.sin(i / 14 * PI); tl.push({ t: i, cam: { pos: [30 * Math.cos(a2), 30 * Math.sin(a2), h2 * 2], target: [0, 0, 0], fov: 46 }, stato: { massa: i >= 7 && i < 10 ? 0 : 1 }, didascalia: '«' + t('Ecco come la gravità curva lo spaziotempo.', 'Here\'s how gravity creates curvature in spacetime.') + '»' }); }
      return { durata: dur, passo: passo, timeline: tl, conti: function () { return { M: st.M, n: st.n, rSat: Math.hypot(sp[0], sp[1], sp[2]), vSat: Math.hypot(sv[0], sv[1], sv[2]) }; } };
    }
  });
  C.reticolo = { CONST: CONST, spostamento: spostamento };
})(typeof window !== 'undefined' ? window : globalThis);
