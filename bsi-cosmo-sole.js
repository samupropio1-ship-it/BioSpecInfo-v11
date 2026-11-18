/* ═══════════════════════════════════════════════════════════════════════
   bsi-cosmo-sole.js — 🎞️ 1 · «Il Sole respira. La Terra si illumina.» (v260)
   BioSpecInfo · © Samuele Pio Provenzano

   LA FISICA
   · Il foglio di corrente eliosferico («gonna da ballerina»): con il dipolo
     solare inclinato di α, la superficie dove il campo cambia verso ha
     latitudine λ(r, φ) = arcsin(sin α · sin(φ + Ω r / v)), Ω = 2,7·10⁻⁶ rad/s,
     v = 400 km/s: la spirale di Parker la avvolge (Parker 1958; Smith 2001).
     Il «respiro» del Sole (scala 0,9 ↔ 1,1 in 3 s) è una licenza visiva
     dichiarata: il Sole non pulsa così.
   · La magnetosfera è quella della sezione 🎬 Scene fisiche 3D: dipolo + campo
     interplanetario (Dungey 1961) con le linee integrate, magnetopausa di Shue
     et al. 1998; l'ovale aurorale è il confine CALCOLATO fra linee aperte e
     chiuse. Il vento solare (particelle verdi) scorre lungo l'onda d'urto.
   · Il cielo notturno con le tende aurorali è uno shader (rumore verticale che
     scorre), illustrativo: verde 557,7 nm, rosso 630 nm in alto.
   ═══════════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  var F = g.BSIFisica, C = g.BSICosmo;
  if (!F || !C) return;
  var t = F.t, PI = Math.PI;
  var CONST = { alfa: 25 * PI / 180, Omega: 2.7e-6, vVento: 4e5, UA: 1.496e11 };
  /** latitudine del foglio di corrente alla distanza r (UA) e longitudine φ */
  function foglio(r, phi, alfa) { return Math.asin(Math.sin(alfa == null ? CONST.alfa : alfa) * Math.sin(phi + CONST.Omega * r * CONST.UA / CONST.vVento)); }
  function M() { return F.calcolo && F.calcolo.scene3d; }

  C.registra('sole', {
    n: 1, etichetta: t('Sole e aurore', 'Sun and aurorae'), bagliore: 1.2,
    titolo: ['Il Sole respira. La Terra si illumina.', 'The Sun breathes. Earth glows.'],
    init: function (ctx) {
      var S = ctx.S, T = ctx.T, dur = 32, gr = {}; S.cam.far = 5000; S.cam.updateProjectionMatrix();
      function gruppo(n) { var x = new T.Group(); x.visible = false; S.aggiungi(x); gr[n] = x; return x; }
      function mat(c, o) { return new T.MeshBasicMaterial({ color: c, transparent: true, opacity: o, side: T.DoubleSide, blending: T.AdditiveBlending, depthWrite: false }); }
      /* A: il Sole, i pianeti, il foglio di corrente e la spirale di Parker (UA, non in scala per il Sole) */
      var gA = gruppo('foglio'), sole = new T.Mesh(new T.SphereGeometry(0.35, 48, 32), new T.MeshBasicMaterial({ color: 0xffb347 })); gA.add(sole);
      var alone = new T.Mesh(new T.SphereGeometry(0.55, 32, 24), mat(0xff8a2a, 0.12)); gA.add(alone);
      function strato(r0, r1, dPhi, col, op) {
        var NR = 24, NF = 72, pos = [], idx = [];
        for (var i = 0; i <= NR; i++) { var r = r0 + (r1 - r0) * i / NR; for (var j = 0; j <= NF; j++) { var ph = j / NF * 2 * PI, la = foglio(r, ph + dPhi); pos.push(r * Math.cos(la) * Math.cos(ph), r * Math.cos(la) * Math.sin(ph), r * Math.sin(la)); } }
        for (i = 0; i < NR; i++) for (var j2 = 0; j2 < NF; j2++) { var a = i * (NF + 1) + j2; idx.push(a, a + NF + 1, a + 1, a + 1, a + NF + 1, a + NF + 2); }
        var geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setIndex(idx);
        var m = new T.Mesh(geo, mat(col, op)); var w = new T.LineSegments(new T.WireframeGeometry(geo), new T.LineBasicMaterial({ color: col, transparent: true, opacity: op * 0.6, blending: T.AdditiveBlending, depthWrite: false })); var gg = new T.Group(); gg.add(m); gg.add(w); return gg;
      }
      gA.add(strato(0.6, 9, 0, 0xffc04a, 0.06)); gA.add(strato(0.6, 9, 0.12, 0xff5aa8, 0.04));
      var ciano = strato(0.2, 1.6, 0.05, 0x3fe0e0, 0.12); gA.add(ciano);
      for (var k = 0; k < 8; k++) { var pts = []; for (var r = 0.4; r < 9; r += 0.05) { var ph = k * PI / 4 - CONST.Omega * r * CONST.UA / CONST.vVento; pts.push(new T.Vector3(r * Math.cos(ph), r * Math.sin(ph), 0)); } gA.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: 0xd7f7f3, transparent: true, opacity: 0.25 }))); }
      var pianeti = [[1, 0x6fa8ff, 0.06], [1.52, 0xff7a4a, 0.05], [5.2, 0xb08a60, 0.14]].map(function (p) { var m = new T.Mesh(new T.SphereGeometry(p[2], 16, 12), new T.MeshBasicMaterial({ color: p[1] })); gA.add(m); return { m: m, a: p[0], w: 2 * PI / Math.pow(p[0], 1.5) * 0.3 }; });
      /* B–C: la magnetosfera (raggi terrestri) col vento solare */
      var gB = gruppo('magnetosfera'), Mo = M(), Bz = -5, Sh = Mo ? Mo.shue(Bz, Mo.pressione(5, 450)) : { r0: 10, alfa: 0.6 };
      var terra = new T.Mesh(new T.SphereGeometry(1, 48, 32), new T.MeshBasicMaterial({ color: 0x1b2a40 })); gB.add(terra);
      if (Mo) [0, 3, 6, 9, 12, 15, 18, 21].forEach(function (mlt) { [52, 60, 66, 70, 74, 79, 84].forEach(function (lat) { [true, false].forEach(function (nord) { var tr = Mo.traccia(Mo.piede(lat * PI / 180, mlt, nord), nord ? -1 : 1, Bz, Sh, 45, 2400); if (tr.esito === 'chiusa' && !nord) return; gB.add(ctx.L3.linea(T, tr.punti, tr.esito === 'chiusa' ? 0xd7f7f3 : 0x9fb3c8, tr.esito === 'chiusa' ? 0.45 : 0.28)); }); }); });
      (function () { var p = []; for (var i = 0; i <= 64; i++) { var a = i / 64 * 0.62 * PI, rr = (Mo ? Mo.rShue(Sh, Math.cos(a)) : 10) * 1.2; for (var j = 0; j <= 48; j++) { var b = j / 48 * 2 * PI; p.push(rr * Math.cos(a), rr * Math.sin(a) * Math.cos(b), rr * Math.sin(a) * Math.sin(b)); } } var gg = new T.BufferGeometry(); gg.setAttribute('position', new T.Float32BufferAttribute(p, 3)); gB.add(new T.Points(gg, new T.PointsMaterial({ color: 0x9fb3c8, size: 0.12, transparent: true, opacity: 0.35 }))); })();
      var NV = 2600, vp = new Float32Array(NV * 3), gv = new T.BufferGeometry(); gv.setAttribute('position', new T.BufferAttribute(vp, 3));
      for (var q = 0; q < NV; q++) { vp[3 * q] = 60 + Math.random() * 100; vp[3 * q + 1] = (Math.random() - 0.5) * 50; vp[3 * q + 2] = (Math.random() - 0.5) * 50; }
      gB.add(new T.Points(gv, new T.PointsMaterial({ color: 0x5aff9a, size: 0.7, transparent: true, opacity: 0.75, blending: T.AdditiveBlending, depthWrite: false })));
      var discoSole = new T.Mesh(new T.CircleGeometry(30, 64), new T.MeshBasicMaterial({ color: 0xff9a3c })); discoSole.position.set(170, -40, -30); discoSole.lookAt(0, 0, 0); gB.add(discoSole);
      /* D: la Terra vista dal polo, con l'ovale calcolato */
      var gD = gruppo('polo'), globo = new T.Mesh(new T.SphereGeometry(1, 64, 48), new T.MeshBasicMaterial({ color: 0x24456e })); globo.rotation.x = PI / 2; gD.add(globo);
      try { new T.TextureLoader().load('./textures/earth_day.jpg', function (tx) { globo.material.map = tx; globo.material.color.set(0x5a6878); globo.material.needsUpdate = true; }); } catch (e) { }
      if (Mo) { var pos = [], col = [], ind = [], N = 64; for (var i = 0; i <= N; i++) { var mlt = 24 * i / N, lat = Mo.confineCalotta(mlt, Bz, true); [[lat - 4 * PI / 180, 1.01, [0.25, 1, 0.45]], [lat, 1.01, [0.35, 1, 0.55]], [lat, 1.05, [1, 0.25, 0.3]]].forEach(function (c) { var p = Mo.piede(c[0], mlt, true), s = c[1] / 1.01; pos.push(p[0] * s, p[1] * s, p[2] * s); col.push(c[2][0], c[2][1], c[2][2]); }); } for (i = 0; i < N; i++) { var a = 3 * i, b = 3 * (i + 1); ind.push(a, b, a + 1, a + 1, b, b + 1, a + 1, b + 1, a + 2, a + 2, b + 1, b + 2); } var go = new T.BufferGeometry(); go.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); go.setAttribute('color', new T.Float32BufferAttribute(col, 3)); go.setIndex(ind); gD.add(new T.Mesh(go, new T.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.85, side: T.DoubleSide, blending: T.AdditiveBlending, depthWrite: false }))); }
      /* E: il cielo con le montagne e le tende (shader illustrativo) */
      var gE = gruppo('cielo');
      var tende = new T.Mesh(new T.PlaneGeometry(40, 18, 1, 1), new T.ShaderMaterial({ transparent: true, depthWrite: false, blending: T.AdditiveBlending, uniforms: { t: { value: 0 } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
        fragmentShader: 'uniform float t; varying vec2 vUv; float h(float x){ return fract(sin(x*127.1)*43758.5); } float n(float x){ float i=floor(x), f=fract(x); return mix(h(i),h(i+1.0),f*f*(3.0-2.0*f)); } void main(){ float x = vUv.x*14.0 + 2.0*sin(vUv.x*3.0+t*0.15); float raggi = n(x*3.0 + t*0.6)*0.6 + n(x*9.0 - t*0.9)*0.4; float banda = smoothstep(0.15,0.45,vUv.y)*(1.0-smoothstep(0.55,0.95,vUv.y)) * (0.6+0.4*sin(vUv.x*5.0+t*0.3)); vec3 verde = vec3(0.25,1.0,0.5), rosso = vec3(1.0,0.3,0.35); vec3 c = mix(verde, rosso, smoothstep(0.6,0.95,vUv.y)); gl_FragColor = vec4(c*raggi*banda*1.1, raggi*banda*0.9); }' }));
      tende.position.set(0, 20, 7); tende.rotation.x = PI / 2; gE.add(tende);
      (function () { var p = []; for (var i = 0; i < 1500; i++) p.push((Math.random() - 0.5) * 120, 40 + Math.random() * 20, Math.random() * 40 - 5); var gg = new T.BufferGeometry(); gg.setAttribute('position', new T.Float32BufferAttribute(p, 3)); gE.add(new T.Points(gg, new T.PointsMaterial({ color: 0xd7f7f3, size: 0.15, transparent: true, opacity: 0.8 }))); })();
      (function () { var forma = new T.Shape(); forma.moveTo(-30, -8); for (var x = -30; x <= 30; x += 1.5) forma.lineTo(x, Math.max(-1, 2.6 * Math.sin(x * 0.35) + 1.8 * Math.sin(x * 0.9 + 1) + 1.2)); forma.lineTo(30, -8); var m = new T.Mesh(new T.ShapeGeometry(forma), new T.MeshBasicMaterial({ color: 0x060b14 })); m.position.set(0, 12, 0); m.rotation.x = PI / 2; m.renderOrder = 2; gE.add(m); var cielo = new T.Mesh(new T.PlaneGeometry(80, 10), new T.ShaderMaterial({ transparent: true, depthWrite: false, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }', fragmentShader: 'varying vec2 vUv; void main(){ gl_FragColor = vec4(0.05,0.22,0.2,(1.0-vUv.y)*0.55); }' })); cielo.position.set(0, 14, 3); cielo.rotation.x = PI / 2; gE.add(cielo); })();
      var tS = 0;
      function passo(dt, tt, stato) {
        var sc = stato.scena || 'foglio'; tS += dt; Object.keys(gr).forEach(function (k) { gr[k].visible = k === sc; });
        if (sc === 'foglio') { var resp = 1 + 0.1 * Math.sin(tS * 2 * PI / 3); sole.scale.setScalar(resp); ciano.scale.setScalar(0.95 + 0.1 * (resp - 1) * 5); gA.rotation.z += dt * 0.05; pianeti.forEach(function (p) { var a = tS * p.w; p.m.position.set(p.a * Math.cos(a), p.a * Math.sin(a), 0); }); }
        if (sc === 'magnetosfera') for (var q2 = 0; q2 < NV; q2++) { var x = vp[3 * q2] - dt * 40, y = vp[3 * q2 + 1], z = vp[3 * q2 + 2], rr = Math.sqrt(x * x + y * y + z * z), rb = Mo ? Mo.rShue(Sh, x / (rr || 1)) * 1.2 : 12; if (rr < rb) { var s2 = rb / rr; x *= s2; y *= s2; z *= s2; var rt = Math.hypot(y, z) || 1; y += y / rt * dt * 18; z += z / rt * dt * 18; } if (x < -60 || Math.abs(y) > 40 || Math.abs(z) > 40) { x = 70 + Math.random() * 90; y = (Math.random() - 0.5) * 50; z = (Math.random() - 0.5) * 50; } vp[3 * q2] = x; vp[3 * q2 + 1] = y; vp[3 * q2 + 2] = z; }
        gv.attributes.position.needsUpdate = true;
        if (sc === 'polo') globo.rotation.y += dt * 0.05;
        tende.material.uniforms.t.value = tS;
        ctx.hud.innerHTML = sc === 'foglio' ? t('foglio di corrente eliosferico: λ = arcsin(sin α sin(φ + Ωr/v)), α = 25° · «respiro» del Sole: licenza visiva', 'heliospheric current sheet: λ = arcsin(sin α sin(φ + Ωr/v)), α = 25° · the Sun\'s «breathing»: visual licence')
          : sc === 'magnetosfera' ? t('vento solare 450 km/s, 5 cm⁻³ · B_z = −5 nT · magnetopausa ', 'solar wind 450 km/s, 5 cm⁻³ · B_z = −5 nT · magnetopause ') + Sh.r0.toFixed(1).replace('.', ',') + ' R_T · Dungey + Shue'
          : sc === 'polo' ? t('ovale aurorale = confine calcolato fra linee aperte e chiuse', 'auroral oval = computed boundary between open and closed lines')
          : t('tende aurorali: illustrazione (verde 557,7 nm, rosso 630 nm)', 'auroral curtains: illustration (green 557.7 nm, red 630 nm)');
        ctx.stato.innerHTML = '';
      }
      return {
        durata: dur, passo: passo,
        timeline: [
          { t: 0, cam: { pos: [0, -13, 6], target: [0, 0, 0], fov: 48 }, stato: { scena: 'foglio' }, didascalia: t('Il Sole <em>respira.</em>', 'The Sun <em>breathes.</em>') },
          { t: 7, cam: { pos: [6, -11, 9], target: [0, 0, 0], fov: 48 }, stato: { scena: 'foglio' }, didascalia: '' },
          { t: 7.01, cam: { pos: [40, -150, 40], target: [30, 0, 0], fov: 50 }, stato: { scena: 'magnetosfera' }, didascalia: t('Il vento solare investe la Terra…', 'The solar wind hits Earth…') },
          { t: 16, cam: { pos: [10, -70, 18], target: [0, 0, 0], fov: 50 }, stato: { scena: 'magnetosfera' }, didascalia: '' },
          { t: 24, cam: { pos: [0, -24, 6], target: [0, 0, 0], fov: 46 }, stato: { scena: 'magnetosfera' }, didascalia: t('…e il suo campo lo devia.', '…and its field deflects it.') },
          { t: 24.01, cam: { pos: [0, -0.4, 3.4], target: [0, 0, 0], fov: 42 }, stato: { scena: 'polo' }, didascalia: t('La Terra <em>si illumina.</em>', 'Earth <em>glows.</em>') },
          { t: 26, cam: { pos: [0, -0.3, 3.2], target: [0, 0, 0], fov: 42 }, stato: { scena: 'polo' }, didascalia: '' },
          { t: 26.01, cam: { pos: [0, 0, 1.6], target: [-3, 20, 8], fov: 60 }, stato: { scena: 'cielo' }, didascalia: t('Il cielo del Nord, quella notte.', 'The northern sky, that night.') },
          { t: 32, cam: { pos: [0, 0, 1.6], target: [3, 20, 9], fov: 60 }, stato: { scena: 'cielo' }, didascalia: '' }
        ],
        conti: function () { return { r0: Sh.r0, foglio: foglio(1, 0) }; }
      };
    }
  });
  C.sole = { CONST: CONST, foglio: foglio };
})(typeof window !== 'undefined' ? window : globalThis);
