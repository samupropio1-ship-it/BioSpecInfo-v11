/* ═══════════════════════════════════════════════════════════════════════
   bsi-cosmo-telo.js — 🎞️ 6 · «Caduta libera verso un oggetto massiccio» (v258)
   BioSpecInfo · © Samuele Pio Provenzano

   CHE COSA È CALCOLATO E CHE COSA È UN'ANALOGIA
   · Le orbite sono un problema degli N corpi VERO (G = 1, unità della scena):
     ogni corpo attira ogni altro con 1/r² (ammorbidito di ε dichiarato),
     integrato con Velocity Verlet a passi piccoli. L'HUD mostra lo scarto
     relativo dell'energia totale nel sistema del centro di massa.
   · Il telo di gomma è l'ANALOGIA classica, non la relatività generale: la
     sua quota è z = −Σ k mᵢ/√(rᵢ² + εᵢ²), un imbuto per il Sole e una
     fossetta per ogni pianeta. Lo si dichiara nella scena.
   · Il sistema avanza lentamente lungo y: viste di lato, le tracce dei
     pianeti diventano eliche (è ciò che fanno davvero nel moto del Sole).
   · «Lancia un corpo»: trascinando sulla scena si sceglie dove nasce e con
     che velocità (la freccia del trascinamento).
   ═══════════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  var F = g.BSIFisica, C = g.BSICosmo;
  if (!F || !C) return;
  var t = F.t, PI = Math.PI;
  var CONST = { eps: 0.05, kTelo: 0.0065, epsTelo: 1.2, deriva: 0.35, N: 180, L: 26 };
  /** i corpi iniziali: Sole e pianeti su orbite circolari (v = √(GM/r)), una luna, un pianeta con gli anelli */
  function sistema(MS) {
    MS = MS || 1000; var corpi = [{ m: MS, x: 0, y: 0, vx: 0, vy: 0, r: 0.9, col: 0xffd27a, nome: 'Sole' }];
    [[3.0, 0.6, 0x9fb7d6], [5.5, 1.2, 0xc7d4e6], [9.0, 3.0, 0xe9ecf2, true], [14.0, 1.5, 0xb8c6dc]]   /* separazioni oltre 2√3 raggi di Hill mutui: il sistema è stabile */.forEach(function (p, i) { var a = i * 1.7, v = Math.sqrt(MS / p[0]); corpi.push({ m: p[1], x: p[0] * Math.cos(a), y: p[0] * Math.sin(a), vx: -v * Math.sin(a), vy: v * Math.cos(a), r: 0.2 + p[1] * 0.06, col: p[2], anelli: !!p[3] }); });
    var P = corpi[3], dl = 0.3, vl = Math.sqrt(P.m / dl);   /* dentro un terzo del raggio di Hill a(m/3M)^(1/3) ≈ 0,9: la luna resta legata */ corpi.push({ m: 0.02, x: P.x + dl, y: P.y, vx: P.vx, vy: P.vy + vl, r: 0.07, col: 0xffffff, nome: 'luna' });
    var M = 0, px = 0, py = 0; corpi.forEach(function (c) { M += c.m; px += c.m * c.vx; py += c.m * c.vy; }); corpi.forEach(function (c) { c.vx -= px / M; c.vy -= py / M; });   /* centro di massa fermo */
    return corpi;
  }
  function accelerazioni(corpi) {
    var n = corpi.length, e2 = CONST.eps * CONST.eps;
    corpi.forEach(function (c) { c.ax = 0; c.ay = 0; });
    for (var i = 0; i < n; i++) for (var j = i + 1; j < n; j++) { var a = corpi[i], b = corpi[j], dx = b.x - a.x, dy = b.y - a.y, r2 = dx * dx + dy * dy + e2, f = 1 / (r2 * Math.sqrt(r2)); a.ax += b.m * dx * f; a.ay += b.m * dy * f; b.ax -= a.m * dx * f; b.ay -= a.m * dy * f; }
  }
  function verlet(corpi, dt) { corpi.forEach(function (c) { c.vx += c.ax * dt / 2; c.vy += c.ay * dt / 2; c.x += c.vx * dt; c.y += c.vy * dt; }); accelerazioni(corpi); corpi.forEach(function (c) { c.vx += c.ax * dt / 2; c.vy += c.ay * dt / 2; }); }
  function energia(corpi) { var E = 0, e2 = CONST.eps * CONST.eps; corpi.forEach(function (c, i) { E += 0.5 * c.m * (c.vx * c.vx + c.vy * c.vy); for (var j = i + 1; j < corpi.length; j++) { var b = corpi[j]; E -= c.m * b.m / Math.sqrt((b.x - c.x) * (b.x - c.x) + (b.y - c.y) * (b.y - c.y) + e2); } }); return E; }
  function quota(corpi, x, y) { var z = 0; corpi.forEach(function (c, i) { var e = i === 0 ? CONST.epsTelo : 0.35, dx = x - c.x, dy = y - c.y; z -= CONST.kTelo * c.m * (i === 0 ? 1 : 12) / Math.sqrt(dx * dx + dy * dy + e * e); }); return z; }
  function num(x, d) { return x.toFixed(d == null ? 2 : d).replace('.', ',').replace('-', '−'); }
  function esp(x) { if (!(x > 0)) return '0'; var e = Math.floor(Math.log10(x)), m = x / Math.pow(10, e); return num(m, 1) + 'e' + e; }

  C.registra('telo', {
    n: 6, etichetta: t('telo di gomma', 'rubber sheet'), bagliore: 1.1,
    titolo: ['Caduta libera verso un oggetto massiccio', 'Free fall toward a massive object'],
    init: function (ctx) {
      var S = ctx.S, T = ctx.T, dur = 31, st = { MS: 1000 }, corpi = sistema(st.MS), E0 = energia(corpi), offY = 0;
      accelerazioni(corpi);
      if (ctx.didaEl) { ctx.didaEl.style.top = '3%'; ctx.didaEl.style.color = '#8fc4ff'; } ctx.hud.style.top = '70px';
      /* il telo: griglia N×N di linee viola */
      var N = CONST.N, L = CONST.L, pos = new Float32Array(N * N * 3), idx = [];
      for (var i = 0; i < N; i++) for (var j = 0; j < N; j++) { pos[3 * (i * N + j)] = (i / (N - 1) - 0.5) * 2 * L; pos[3 * (i * N + j) + 1] = (j / (N - 1) - 0.5) * 2 * L; if (i < N - 1 && j % 2 === 0) idx.push(i * N + j, (i + 1) * N + j); if (j < N - 1 && i % 2 === 0) idx.push(i * N + j, i * N + j + 1); }
      var geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setIndex(idx);
      var telo = new T.LineSegments(geo, new T.LineBasicMaterial({ color: 0xa47cff, transparent: true, opacity: 0.38, blending: T.AdditiveBlending, depthWrite: false })); telo.name = 'telo'; S.aggiungi(telo);
      var mesh = [], tracce = [];
      function costruisciCorpi() {
        mesh.forEach(function (m) { S.radice.remove(m); }); tracce.forEach(function (l) { S.radice.remove(l.linea); }); mesh = []; tracce = [];
        corpi.forEach(function (c, k) {
          var m = new T.Mesh(new T.SphereGeometry(c.r, 32, 24), k === 0 ? new T.MeshBasicMaterial({ color: c.col }) : new T.MeshStandardMaterial({ color: c.col, roughness: 0.6, emissive: 0x111111 }));
          if (k === 0) { var al = new T.Mesh(new T.SphereGeometry(c.r * 2.4, 32, 24), new T.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: 0.25, blending: T.AdditiveBlending, depthWrite: false })); m.add(al); var luce = new T.PointLight(0xfff0d0, 2.2, 0, 1.2); m.add(luce); }
          if (c.anelli) { var an = new T.Mesh(new T.RingGeometry(c.r * 1.5, c.r * 2.4, 64), new T.MeshBasicMaterial({ color: 0xd9cba3, transparent: true, opacity: 0.6, side: T.DoubleSide })); an.rotation.x = 0.4; m.add(an); }
          m.name = c.nome || 'corpo'; S.aggiungi(m); mesh.push(m);
          var lg = new T.BufferGeometry(); lg.setAttribute('position', new T.BufferAttribute(new Float32Array(1500 * 3), 3)); var ln = new T.Line(lg, new T.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, blending: T.AdditiveBlending })); S.aggiungi(ln); tracce.push({ linea: ln, punti: [] });
        });
      }
      costruisciCorpi();
      /* lanciare un corpo trascinando */
      var el = S.ren.domElement, ray = new T.Raycaster(), piano = new T.Plane(new T.Vector3(0, 0, 1), 0), inizio = null, lancio = false;
      function suPiano(e) { var r = el.getBoundingClientRect(), p = new T.Vector2((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1), out = new T.Vector3(); ray.setFromCamera(p, S.cam); return ray.ray.intersectPlane(piano, out) ? out : null; }
      el.addEventListener('pointerdown', function (e) { if (!lancio) return; inizio = suPiano(e); if (inizio) e.stopImmediatePropagation(); }, true);
      el.addEventListener('pointerup', function (e) { if (!inizio) return; var fine = suPiano(e) || inizio, v = [(fine.x - inizio.x) * 1.5, (fine.y - inizio.y) * 1.5]; corpi.push({ m: 0.5, x: inizio.x, y: inizio.y - offY, vx: v[0], vy: v[1], r: 0.16, col: 0x7fe7ff, nome: 'lanciato' }); accelerazioni(corpi); E0 = energia(corpi); costruisciCorpi(); inizio = null; lancio = false; bL.setAttribute('aria-pressed', 'false'); });
      var bL = F.el('button', { type: 'button', 'class': 'bsiFX-bott', 'aria-pressed': 'false', testo: t('🎯 Lancia un corpo (trascina sulla scena)', '🎯 Launch a body (drag on the scene)'), onclick: function () { lancio = !lancio; bL.setAttribute('aria-pressed', String(lancio)); } });
      F.cursore(ctx.pannello, ['Massa del Sole', 'Sun mass'], 400, 2000, 50, st.MS, function (v) { st.MS = v; corpi = sistema(v); accelerazioni(corpi); E0 = energia(corpi); costruisciCorpi(); offY = 0; }, function (v) { return v; });
      ctx.pannello.appendChild(bL);
      function passo(dt, tt, stato, cinem) {
        var sub = 40, h = Math.min(dt, 0.04) * 0.6 / sub;
        for (var s = 0; s < sub; s++) verlet(corpi, h);
        offY += CONST.deriva * Math.min(dt, 0.04) * (cinem && stato.deriva === false ? 0 : 1);
        /* il telo segue il Sole */
        /* il telo segue il Sole: vertici in coordinate locali, quota calcolata nel sistema della simulazione */
        var a = geo.attributes.position.array, sx = corpi[0].x, sy = corpi[0].y;
        for (var k = 0; k < N * N; k++) a[3 * k + 2] = quota(corpi, a[3 * k] + sx, a[3 * k + 1] + sy);
        telo.position.set(sx, sy + offY, 0); geo.attributes.position.needsUpdate = true;
        corpi.forEach(function (c, i) { var z = quota(corpi, c.x, c.y) + c.r * 0.6; mesh[i].position.set(c.x, c.y + offY, z); var tr = tracce[i]; tr.punti.push(c.x, c.y + offY, z); if (tr.punti.length > 4500) tr.punti.splice(0, 3); tr.linea.geometry.attributes.position.array.set(tr.punti); tr.linea.geometry.setDrawRange(0, tr.punti.length / 3); tr.linea.geometry.attributes.position.needsUpdate = true; tr.linea.visible = i > 0; });
        var dE = Math.abs((energia(corpi) - E0) / E0);
        ctx.hud.innerHTML = 'ΔE/E ' + esp(dE) + ' · ' + corpi.length + t(' corpi, N corpi Velocity Verlet', ' bodies, N-body Velocity Verlet') + '<br>' + t('telo = ANALOGIA: z = −Σ k m/√(r² + ε²)', 'sheet = ANALOGY: z = −Σ k m/√(r² + ε²)');
        if (cinem) S.vista.bersaglio.y += offY;   /* la camera cinematica segue il Sole che avanza */
      }
      return {
        durata: dur, passo: passo, ciclo: true,
        timeline: [
          { t: 0, cam: { pos: [0, -30, 4], target: [0, 0, -3], fov: 48 }, didascalia: t('Caduta libera verso un oggetto massiccio.', 'Free fall toward a massive object.') },
          { t: 9, cam: { pos: [0, -2, 42], target: [0, 0, -2], fov: 50 }, didascalia: t('Viste dall\'alto, le orbite sono cerchi e rosette.', 'Seen from above, orbits are circles and rosettes.') },
          { t: 19, cam: { pos: [-28, -8, 6], target: [0, 4, -2], fov: 48 }, didascalia: t('Il Sole si muove: le orbite diventano eliche.', 'The Sun moves: the orbits become helices.') },
          { t: 31, cam: { pos: [0, -30, 4], target: [0, 0, -3], fov: 48 }, didascalia: '' }
        ],
        conti: function () { return { dE: Math.abs((energia(corpi) - E0) / E0), corpi: corpi.length }; }
      };
    }
  });
  C.telo = { CONST: CONST, sistema: sistema, accelerazioni: accelerazioni, verlet: verlet, energia: energia, quota: quota };
})(typeof window !== 'undefined' ? window : globalThis);
