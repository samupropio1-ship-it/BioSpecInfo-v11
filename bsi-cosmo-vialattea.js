/* ═══════════════════════════════════════════════════════════════════════
   bsi-cosmo-vialattea.js — 🎞️ 7 · «Il telo dello spaziotempo della Via Lattea» (v258)
   BioSpecInfo · © Samuele Pio Provenzano

   CHE COSA È CALCOLATO E CHE COSA È UN'ANALOGIA
   · Il profilo dell'imbuto è il POTENZIALE vero della simulazione 8 (bulge di
     Hernquist + disco di Freeman + alone NFW): z(R) = k·Φ(R). È l'analogia del
     telo, ma con la forma giusta: il pozzo è più ripido al centro e si
     allarga piano fuori, come fa il potenziale della Galassia.
   · Il Sole oscilla davvero sopra e sotto il disco mentre gira attorno al
     centro (circa ±80 pc, un'oscillazione ogni ~70 milioni di anni): le scie
     ondulate sono quella oscillazione, con l'ampiezza ingrandita (dichiarato).
   · I pianeti hanno i semiassi veri in UA, compressi con la radice quadrata
     per stare nell'inquadratura (dichiarato).
   ═══════════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  var F = g.BSIFisica, C = g.BSICosmo;
  if (!F || !C) return;
  var t = F.t, PI = Math.PI;
  var PIANETI = [['MERCURIO', 'MERCURY', 0.387, 0xb5a89a], ['VENERE', 'VENUS', 0.723, 0xe8c58a], ['TERRA', 'EARTH', 1.0, 0x5aa8ff], ['MARTE', 'MARS', 1.524, 0xff7a4a], ['GIOVE', 'JUPITER', 5.203, 0xd9b38c], ['SATURNO', 'SATURN', 9.537, 0xe8d39b], ['URANO', 'URANUS', 19.19, 0x9fe0e8], ['NETTUNO', 'NEPTUNE', 30.07, 0x7fa6ff]];   /* semiassi JPL */
  function phi(R) { var G = C.galassia; if (!G) return -1 / (R + 1); var r = Math.max(0.05, R); return G.phib(r) + G.phid(r) + G.phih(r); }
  C.registra('vialattea', {
    n: 7, etichetta: t('Via Lattea', 'Milky Way'), bagliore: 1.3,
    titolo: ['Il telo dello spaziotempo della Via Lattea', 'We simulated the Milky Way\'s spacetime sheet'],
    init: function (ctx) {
      var S = ctx.S, T = ctx.T, dur = 21; S.cam.far = 20000; S.cam.updateProjectionMatrix();
      if (ctx.didaEl) { ctx.didaEl.style.top = '3%'; ctx.didaEl.style.color = '#5fe3d6'; } ctx.hud.style.top = '62px';
      /* scena 1: il Sole con la corona, il fascio dell'asse del moto, i pianeti */
      var sis = new T.Group(); S.aggiungi(sis);
      var sole = new T.Mesh(new T.SphereGeometry(1.2, 32, 24), new T.MeshBasicMaterial({ color: 0xff7a3c })); sis.add(sole);
      var cor = []; for (var i = 0; i < 2500; i++) { var u = Math.random() * 2 - 1, a = Math.random() * 2 * PI, s = Math.sqrt(1 - u * u), r = 1.3 + Math.pow(Math.random(), 3) * 3; cor.push(r * s * Math.cos(a), r * s * Math.sin(a), r * u); }
      var cg = new T.BufferGeometry(); cg.setAttribute('position', new T.Float32BufferAttribute(cor, 3)); sis.add(new T.Points(cg, new T.PointsMaterial({ color: 0xffb070, size: 0.08, transparent: true, opacity: 0.6, blending: T.AdditiveBlending, depthWrite: false })));
      var fascio = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 60, 8), new T.MeshBasicMaterial({ color: 0xffe0b0, transparent: true, opacity: 0.8, blending: T.AdditiveBlending })); fascio.rotation.x = PI / 2; sis.add(fascio);
      var pl = PIANETI.map(function (p) { var R = 3 + Math.sqrt(p[2]) * 4.2, m = new T.Mesh(new T.SphereGeometry(0.28, 16, 12), new T.MeshBasicMaterial({ color: p[3] })); sis.add(m); var o = new T.Mesh(new T.RingGeometry(R - 0.02, R + 0.02, 128), new T.MeshBasicMaterial({ color: 0x8aa0c8, transparent: true, opacity: 0.25, side: T.DoubleSide })); sis.add(o); return { m: m, R: R, w: 2 * PI / Math.pow(p[2], 1.5), nome: t(p[0], p[1]) }; });
      /* le scie ondulate: il Sole oscilla attraverso il disco mentre avanza */
      var scie = new T.Group(); sis.add(scie);
      [0, 1, 2, 3, 4].forEach(function (k) { var pts = []; for (var j = 0; j <= 400; j++) { var x = -j * 0.25, z = Math.sin(j * 0.05 + k * 0.4) * 3 * (1 - j / 500); pts.push(new T.Vector3(x, (k - 2) * 0.4, z)); } scie.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: 0xff9a5a, transparent: true, opacity: 0.35, blending: T.AdditiveBlending }))); });
      /* scena 2–3: la Galassia sulla griglia polare che diventa un pozzo (1 kpc = 100 unità) */
      var gal = new T.Group(); gal.visible = false; S.aggiungi(gal);
      var NR = 60, NA = 96, RG = 2400, gp = new Float32Array((NR + 1) * NA * 3), gidx = [];
      for (var ir = 0; ir <= NR; ir++) for (var ia = 0; ia < NA; ia++) { var R2 = Math.pow(ir / NR, 1.4) * RG, a2 = ia / NA * 2 * PI, k2 = 3 * (ir * NA + ia); gp[k2] = R2 * Math.cos(a2); gp[k2 + 1] = R2 * Math.sin(a2); if (ir < NR) gidx.push(ir * NA + ia, (ir + 1) * NA + ia); gidx.push(ir * NA + ia, ir * NA + (ia + 1) % NA); }
      var gg = new T.BufferGeometry(); gg.setAttribute('position', new T.BufferAttribute(gp, 3)); gg.setIndex(gidx);
      var griglia = new T.LineSegments(gg, new T.LineBasicMaterial({ color: 0x5fb8ff, transparent: true, opacity: 0.22, blending: T.AdditiveBlending, depthWrite: false })); gal.add(griglia);
      var stelle = [], cols = [], s3 = 9; function rnd() { s3 = (s3 * 16807) % 2147483647; return s3 / 2147483647; }
      for (i = 0; i < 30000; i++) { var br = i % 4, Rk = 0.3 + Math.pow(rnd(), 0.9) * 14, th = Math.log(Rk / 0.3) / Math.tan(12 * PI / 180) + br * PI / 2 + (rnd() - 0.5) * 0.5; stelle.push(Rk * 100 * Math.cos(th) + (rnd() - 0.5) * 30, Rk * 100 * Math.sin(th) + (rnd() - 0.5) * 30, 0); var w = Math.exp(-Rk / 4); cols.push(1, 0.45 + 0.45 * w, 0.3 + 0.6 * w); }
      var sg = new T.BufferGeometry(), sp = new Float32Array(stelle); sg.setAttribute('position', new T.BufferAttribute(sp, 3)); sg.setAttribute('color', new T.Float32BufferAttribute(cols, 3));
      gal.add(new T.Points(sg, new T.PointsMaterial({ size: 5, vertexColors: true, transparent: true, opacity: 0.85, blending: T.AdditiveBlending, depthWrite: false })));
      var nucleo = new T.Mesh(new T.SphereGeometry(40, 24, 16), new T.MeshBasicMaterial({ color: 0xfff2d8 })); gal.add(nucleo);
      var Phi0 = phi(0.05), K = 900 / Math.abs(Phi0), prof = 0;
      function deforma(f) {
        for (var k = 0; k < gp.length; k += 3) { var R = Math.hypot(gp[k], gp[k + 1]) / 100; gp[k + 2] = f * K * (phi(R) - phi(RG / 100)); }
        gg.attributes.position.needsUpdate = true;
        for (k = 0; k < sp.length; k += 3) { var R3 = Math.hypot(sp[k], sp[k + 1]) / 100; sp[k + 2] = f * K * (phi(R3) - phi(RG / 100)) + 2; }
        sg.attributes.position.needsUpdate = true; nucleo.position.z = f * K * (phi(0.05) - phi(RG / 100));
      }
      var tS = 0;
      function passo(dt, tt, stato) {
        var sc = stato.scena || 'sole'; tS += dt;
        sis.visible = sc === 'sole'; gal.visible = sc !== 'sole';
        pl.forEach(function (p) { var a = tS * p.w * 0.8; p.m.position.set(p.R * Math.cos(a), p.R * Math.sin(a), 0); });
        var obiettivo = sc === 'pozzo' ? 1 : 0; prof += (obiettivo - prof) * Math.min(1, dt * 1.2); if (gal.visible) { deforma(prof); gal.rotation.z += dt * 0.04; }
        var o = ctx.overlay(), q = o.q; q.clearRect(0, 0, o.w, o.h);
        if (sc === 'sole') pl.forEach(function (p) { var v = p.m.position.clone(); v.project(S.cam); if (v.z > 1) return; var x = (v.x + 1) / 2 * o.w, y = (1 - v.y) / 2 * o.h; q.fillStyle = 'rgba(220,232,248,.9)'; q.font = '600 9px ui-monospace,Menlo,monospace'; q.fillText(p.nome, x + 6, y - 6); });
        ctx.hud.innerHTML = sc === 'sole' ? t('semiassi veri (JPL) compressi con √a · oscillazione verticale del Sole ingrandita', 'true semi-major axes (JPL) compressed with √a · Sun\'s vertical oscillation enlarged') : t('profilo del pozzo = potenziale del modello (Hernquist + Freeman + NFW)', 'well profile = model potential (Hernquist + Freeman + NFW)') + '<br>' + t('ANALOGIA del telo: z ∝ Φ(R)', 'sheet ANALOGY: z ∝ Φ(R)');
        ctx.stato.innerHTML = '';
      }
      return {
        durata: dur, passo: passo,
        timeline: [
          { t: 0, cam: { pos: [14, -36, 12], target: [-4, 0, 0], fov: 46 }, stato: { scena: 'sole' }, didascalia: t('Via Lattea', 'Milky way galaxy') },
          { t: 7, cam: { pos: [6, -30, 22], target: [-6, 0, 0], fov: 46 }, stato: { scena: 'sole' }, didascalia: t('Via Lattea', 'Milky way galaxy') },
          { t: 7.01, cam: { pos: [0, -2600, 4200], target: [0, 0, 0], fov: 48 }, stato: { scena: 'galassia' }, didascalia: t('Via Lattea', 'Milky way galaxy') },
          { t: 13, cam: { pos: [0, -3200, 2600], target: [0, 0, -200], fov: 48 }, stato: { scena: 'pozzo' }, didascalia: t('Via Lattea', 'Milky way galaxy') },
          { t: 18, cam: { pos: [600, -900, 300], target: [0, 0, -700], fov: 55 }, stato: { scena: 'pozzo' }, didascalia: t('Via Lattea', 'Milky way galaxy') },
          { t: 21, cam: { pos: [0, -2600, 4200], target: [0, 0, 0], fov: 48 }, stato: { scena: 'pozzo' }, didascalia: '' }
        ]
      };
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
