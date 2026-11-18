/* ═══════════════════════════════════════════════════════════════════════
   bsi-cosmo-eliosfera.js — 🎞️ 5 · «La bolla invisibile attorno al Sistema Solare» (v258)
   BioSpecInfo · © Samuele Pio Provenzano

   LA FISICA
   · La forma della bolla NON è disegnata: shock di terminazione ed eliopausa
     vengono dal modello asimmetrico della sezione 🌞 L'eliosfera
     (F.calcolo.eliosfera: shockDir, eliopausaDir), adattato ai quattro
     attraversamenti misurati dalle Voyager (TS a 94 e 84 UA, HP a 121,6 e
     119 UA). Le sonde sono nelle loro direzioni vere (SONDE).
   · Il vento solare (400–800 km/s) esce radialmente; oltre lo shock rallenta
     e piega verso la coda: le particelle lo mostrano qualitativamente
     (dichiarato).
   · Le eliche: i pianeti girano attorno al Sole mentre il Sole avanza a
     26 km/s nel mezzo interstellare locale; il passo è compresso per vederlo
     (NON IN SCALA, dichiarato). Lo zoom sulla Galassia è schematico: quattro
     bracci a spirale logaritmica (passo 12°), Sgr A* al centro, il Sole a
     8,2 kpc, la bolla ingrandita.
   ═══════════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  var F = g.BSIFisica, C = g.BSICosmo;
  if (!F || !C) return;
  var t = F.t, PI = Math.PI;
  var CONST = { rMax: 520, vento: [400, 800], vSole: 26, rSole: 8.2, passoBracci: 12 * PI / 180 };   /* v del Sole nel mezzo locale: McComas et al. 2012; R₀ = 8,2 kpc: Bland-Hawthorn e Gerhard 2016 */
  function E() { return F.calcolo && F.calcolo.eliosfera; }
  function superficie(T, f, col, opac, rMax) {
    var geo = new T.SphereGeometry(1, 120, 80), p = geo.attributes.position, v = new T.Vector3();
    for (var i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).normalize(); var r = f([v.x, v.y, v.z]); if (!isFinite(r) || r <= 0) r = rMax; r = Math.min(rMax, r); p.setXYZ(i, v.x * r, v.y * r, v.z * r); }
    geo.computeVertexNormals();
    var m = new T.Mesh(geo, new T.ShaderMaterial({ transparent: true, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending, uniforms: { col: { value: new T.Color(col) }, op: { value: opac } },
      vertexShader: 'varying vec3 n; varying vec3 vv; void main(){ n = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position,1.0); vv = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform vec3 col; uniform float op; varying vec3 n; varying vec3 vv; void main(){ float f = pow(1.0 - abs(dot(n, vv)), 2.2); gl_FragColor = vec4(col * (0.25 + 1.6 * f), op * (0.25 + f)); }' }));
    return m;
  }
  C.registra('eliosfera', {
    n: 5, etichetta: t('eliosfera', 'heliosphere'), bagliore: 1.2,
    titolo: ['La bolla invisibile attorno al Sistema Solare', 'The invisible bubble around our Solar System'],
    init: function (ctx) {
      var S = ctx.S, T = ctx.T, dur = 21, Mo = E(); S.cam.far = 30000; S.cam.updateProjectionMatrix();   /* la Galassia sta a migliaia di unità */
      if (ctx.didaEl) { ctx.didaEl.style.top = '72%'; ctx.didaEl.style.color = '#3d8bff'; ctx.didaEl.style.fontStyle = 'normal'; ctx.didaEl.style.fontWeight = '800'; ctx.didaEl.style.fontFamily = '"Arial Narrow","Roboto Condensed",system-ui,sans-serif'; ctx.didaEl.style.fontSize = 'clamp(15px,3.6vw,22px)'; }
      var eli = new T.Group(); eli.name = 'eliosfera'; S.aggiungi(eli);
      var M = Mo ? Mo.modelloAsimmetrico() : null, naso = M ? M.n : [1, 0, 0];
      var hp = superficie(T, function (d) { return Mo ? Mo.eliopausaDir(d) : 120; }, 0xff3b2f, 0.55, CONST.rMax), ts = superficie(T, function (d) { return Mo ? Mo.shockDir(d) : 90; }, 0x3fd0ff, 0.35, CONST.rMax * 0.8);
      hp.name = 'eliopausa'; ts.name = 'shock-di-terminazione'; eli.add(hp); eli.add(ts);
      var sole = new T.Mesh(new T.SphereGeometry(4, 32, 24), new T.MeshBasicMaterial({ color: 0xffe08a })); eli.add(sole);
      /* pianeti esterni (orbite in UA, vere): Giove 5,2, Saturno 9,6, Nettuno 30,1 */
      var orbite = [[5.2, 0xd9b38c, 'Giove'], [9.6, 0xe8d39b, 'Saturno'], [30.1, 0x7fa6ff, 'Nettuno']], pianeti = [];
      orbite.forEach(function (o) { var c = new T.Mesh(new T.RingGeometry(o[0] - 0.25, o[0] + 0.25, 128), new T.MeshBasicMaterial({ color: 0x8aa0c8, transparent: true, opacity: 0.35, side: T.DoubleSide })); eli.add(c); var p = new T.Mesh(new T.SphereGeometry(1.4, 16, 12), new T.MeshBasicMaterial({ color: o[1] })); eli.add(p); pianeti.push([p, o[0], 2 * PI / Math.pow(o[0], 1.5), o[2]]); });
      /* vento solare: particelle radiali che rallentano e piegano oltre lo shock */
      var NV = 3000, vp = new Float32Array(NV * 3), vv = new Float32Array(NV * 3), gv = new T.BufferGeometry(); gv.setAttribute('position', new T.BufferAttribute(vp, 3));
      function nasci(k) { var u = Math.random() * 2 - 1, a = Math.random() * 2 * PI, s = Math.sqrt(1 - u * u), d = [s * Math.cos(a), s * Math.sin(a), u], r = 5 + Math.random() * 6; vp[3 * k] = d[0] * r; vp[3 * k + 1] = d[1] * r; vp[3 * k + 2] = d[2] * r; var v = 40 + Math.random() * 40; vv[3 * k] = d[0] * v; vv[3 * k + 1] = d[1] * v; vv[3 * k + 2] = d[2] * v; }
      for (var k = 0; k < NV; k++) { nasci(k); var f = Math.random() * 80; vp[3 * k] *= 1 + f / 8; vp[3 * k + 1] *= 1 + f / 8; vp[3 * k + 2] *= 1 + f / 8; }
      var vento = new T.Points(gv, new T.PointsMaterial({ color: 0x9fe8ff, size: 1.6, transparent: true, opacity: 0.7, blending: T.AdditiveBlending, depthWrite: false })); vento.name = 'vento-solare'; eli.add(vento);
      /* le sonde nelle direzioni vere */
      var sonde = [];
      if (Mo && Mo.SONDE) Object.keys(Mo.SONDE).forEach(function (k2) {
        /* direzione eclittica vera (lon, lat) e distanza di oggi: ultima tappa + v·Δt (1 km/s = 0,2108 UA/anno) */
        var s = Mo.SONDE[k2], ul = s.tappe[s.tappe.length - 1], anno = 1970 + Date.now() / 3.15576e10, r = ul[1] + s.kms * 0.2108 * (anno - ul[0]), lo = s.lon * PI / 180, la = s.lat * PI / 180, d = [Math.cos(la) * Math.cos(lo), Math.cos(la) * Math.sin(lo), Math.sin(la)];
        var m = new T.Mesh(new T.SphereGeometry(2.4, 10, 8), new T.MeshBasicMaterial({ color: new T.Color(s.col) })); m.position.set(d[0] * r, d[1] * r, d[2] * r); eli.add(m); sonde.push([m, s.nome, r]);
      });
      /* eliche dei pianeti (moto del Sole lungo −naso) */
      var eliche = new T.Group(); eliche.visible = false; S.aggiungi(eliche);
      [[5.2, 0xd9b38c], [9.6, 0xe8d39b], [19.2, 0x9fe0e8], [30.1, 0x7fa6ff]].forEach(function (o, i) { var pts = []; for (var j = 0; j <= 900; j++) { var tt = j / 900, a = tt * 2 * PI * (6 - i), z = -tt * 420; pts.push(new T.Vector3(o[0] * Math.cos(a), o[0] * Math.sin(a), z)); } var l = new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: o[1], transparent: true, opacity: 0.85, blending: T.AdditiveBlending })); eliche.add(l); });
      /* la Galassia schematica: quattro bracci logaritmici, Sgr A*, il Sole a 8,2 kpc (1 kpc = 100 unità) */
      var gal = new T.Group(); gal.visible = false; S.aggiungi(gal);
      (function () { var p = [], c = [], s = 5; function r() { s = (s * 16807) % 2147483647; return s / 2147483647; } for (var i = 0; i < 26000; i++) { var br = i % 4, R = 150 + Math.pow(r(), 0.8) * 1350, th = Math.log(R / 150) / Math.tan(CONST.passoBracci) + br * PI / 2 + (r() - 0.5) * 0.45, x = R * Math.cos(th) + (r() - 0.5) * 40, y = R * Math.sin(th) + (r() - 0.5) * 40; p.push(x, y, (r() - 0.5) * 18); var w = Math.exp(-R / 600); c.push(1, 0.72 + 0.2 * w, 0.32 + 0.4 * w); } for (i = 0; i < 6000; i++) { var R2 = Math.pow(r(), 2) * 160, a = r() * 2 * PI; p.push(R2 * Math.cos(a), R2 * Math.sin(a), (r() - 0.5) * 40); c.push(1, 0.9, 0.7); } var gg = new T.BufferGeometry(); gg.setAttribute('position', new T.Float32BufferAttribute(p, 3)); gg.setAttribute('color', new T.Float32BufferAttribute(c, 3)); gal.add(new T.Points(gg, new T.PointsMaterial({ size: 5, vertexColors: true, transparent: true, opacity: 0.8, blending: T.AdditiveBlending, depthWrite: false }))); var bh = new T.Mesh(new T.SphereGeometry(14, 24, 16), new T.MeshBasicMaterial({ color: 0x000000 })); gal.add(bh); var disco = new T.Mesh(new T.RingGeometry(18, 46, 64), new T.MeshBasicMaterial({ color: 0xffa347, transparent: true, opacity: 0.8, side: T.DoubleSide, blending: T.AdditiveBlending })); gal.add(disco); })();
      var marcatore = new T.Mesh(new T.SphereGeometry(10, 16, 12), new T.MeshBasicMaterial({ color: 0x7fd0ff })); marcatore.position.set(CONST.rSole * 100, 0, 0); gal.add(marcatore);
      var tSim = 0;
      function etichette(scena) {
        var o = ctx.overlay(), q = o.q, W = o.w, H = o.h; q.clearRect(0, 0, W, H);
        function proietta(v) { var p = v.clone(); p.project(S.cam); return p.z < 1 ? [(p.x + 1) / 2 * W, (1 - p.y) / 2 * H] : null; }
        function et(testo, v, dx, dy) { var p = proietta(v); if (!p) return; var x2 = Math.max(6, Math.min(W * 0.8, p[0] + dx)), y2 = Math.max(16, Math.min(H * 0.84, p[1] + dy)); q.strokeStyle = 'rgba(200,215,235,.75)'; q.lineWidth = 1; q.beginPath(); q.moveTo(p[0], p[1]); q.lineTo(x2, y2); q.stroke(); q.fillStyle = '#e6f2ff'; q.font = '600 10px system-ui,sans-serif'; q.textAlign = dx < 0 ? 'right' : 'left'; q.fillText(testo, x2 + (dx < 0 ? -3 : 3), y2 + 3); q.textAlign = 'left'; }
        if (scena === 'bolla') {
          var n = new T.Vector3(naso[0], naso[1], naso[2]);
          et(t('Shock di terminazione (~90 UA)', 'Termination Shock (~90 AU)'), n.clone().multiplyScalar(Mo ? Mo.shockDir(naso) : 90), 40, -60);
          et(t('Eliopausa (~120 UA)', 'Heliopause (~120 AU)'), n.clone().multiplyScalar(Mo ? Mo.eliopausaDir(naso) : 120), 30, 40);
          et(t('Coda (heliotail)', 'Heliotail'), n.clone().multiplyScalar(-300), -20, 40);
          et(t('Vento solare 400–800 km/s', 'Solar Wind 400–800 km/s'), new T.Vector3(0, 0, 55), -30, -40);
          et(t('Sole', 'Sun'), new T.Vector3(0, 0, 0), -50, -10);
          et(t('Nettuno (30 UA)', 'Neptune (30 AU)'), pianeti[2][0].position, 40, 26);   /* Giove e Saturno, a questa scala, cadono sul Sole */
          sonde.forEach(function (s) { et(s[1] + ' · ' + Math.round(s[2]) + t(' UA', ' AU'), s[0].position, -40, 20); });
          var pN = proietta(n.clone().multiplyScalar(160)); if (pN) { q.strokeStyle = '#ffd24a'; q.fillStyle = '#ffd24a'; q.beginPath(); q.moveTo(pN[0] - 20, pN[1]); q.lineTo(pN[0] + 20, pN[1]); q.stroke(); q.font = '600 10px system-ui,sans-serif'; q.fillText(t('→ direzione del moto del Sole', '→ Direction of Sun\'s motion'), Math.min(W * 0.6, pN[0] - 20), pN[1] - 8); }
        } else if (scena === 'galassia') { et('Sgr A*', new T.Vector3(0, 0, 0), 40, -30); et(t('Sole e la bolla (ingranditi) · Sirio a 2,6 pc', 'Sun and the bubble (enlarged) · Sirius at 2.6 pc'), marcatore.position, -20, 40); }
        q.fillStyle = 'rgba(169,191,214,.75)'; q.font = '500 9px ui-monospace,Menlo,monospace'; q.fillText(scena === 'bolla' ? t('FORMA: MODELLO ADATTATO ALLE VOYAGER', 'SHAPE: MODEL FIT TO THE VOYAGERS') : t('NON IN SCALA', 'NOT TO SCALE'), 10, H * 0.84);
      }
      function passo(dt, tt, stato) {
        var sc = stato.scena || 'bolla'; tSim += dt;
        eli.visible = sc !== 'galassia'; eliche.visible = sc === 'eliche'; gal.visible = sc === 'galassia'; hp.visible = ts.visible = vento.visible = sc === 'bolla';
        pianeti.forEach(function (p) { var a = tSim * p[2] * 0.6; p[0].position.set(p[1] * Math.cos(a), p[1] * Math.sin(a), 0); });
        if (sc === 'bolla') for (var k = 0; k < NV; k++) {
          var x = vp[3 * k], y = vp[3 * k + 1], z = vp[3 * k + 2], r = Math.sqrt(x * x + y * y + z * z), d = [x / r, y / r, z / r], rts = Mo ? Mo.shockDir(d) : 90, rhp = Mo ? Mo.eliopausaDir(d) : 120, s = 1;
          if (r > rts) { s = 0.35; vv[3 * k] -= naso[0] * 30 * dt; vv[3 * k + 1] -= naso[1] * 30 * dt; vv[3 * k + 2] -= naso[2] * 30 * dt; }   /* oltre lo shock: subsonico, piega verso la coda */
          vp[3 * k] += vv[3 * k] * s * dt; vp[3 * k + 1] += vv[3 * k + 1] * s * dt; vp[3 * k + 2] += vv[3 * k + 2] * s * dt;
          if (r > Math.min(CONST.rMax * 0.8, rhp * 1.05) && (x * naso[0] + y * naso[1] + z * naso[2]) > -0.2 * r || r > CONST.rMax * 0.8) nasci(k);
        }
        gv.attributes.position.needsUpdate = true;
        if (sc === 'galassia') gal.rotation.z += dt * 0.03;
        etichette(sc);
        ctx.hud.innerHTML = sc === 'bolla' ? (t('Voyager 1: shock a 94 UA, eliopausa a 121,6 UA', 'Voyager 1: shock at 94 AU, heliopause at 121.6 AU') + '<br>' + t('Voyager 2: shock a 84 UA, eliopausa a 119 UA', 'Voyager 2: shock at 84 AU, heliopause at 119 AU')) : sc === 'eliche' ? t('Il Sole avanza a 26 km/s: i pianeti tracciano eliche · passo compresso, NON IN SCALA', 'The Sun moves at 26 km/s: the planets trace helices · pitch compressed, NOT TO SCALE') : t('Il Sole a 8,2 kpc da Sgr A*, un giro ogni ~230 milioni di anni', 'The Sun 8.2 kpc from Sgr A*, one orbit every ~230 million years');
        ctx.stato.innerHTML = '';
      }
      var n0 = naso, pl = Math.hypot(naso[0], naso[1]) || 1, lat = [-naso[1] / pl, naso[0] / pl, 0];   /* di lato rispetto al moto: si vede la forma a proiettile */
      function cam(dist, alto, avanti) { return [lat[0] * dist + naso[0] * avanti, lat[1] * dist + naso[1] * avanti, alto]; }
      return {
        durata: dur, passo: passo,
        timeline: [
          { t: 0, cam: { pos: cam(820, 220, -80), target: [-120 * n0[0], -120 * n0[1], 0], fov: 46 }, stato: { scena: 'bolla' }, didascalia: t('L\'eliosfera è una bolla di vento solare che ci ripara dai raggi cosmici.', 'The heliosphere is a bubble of solar wind that shields us from cosmic radiation.') },
          { t: 8, cam: { pos: cam(700, 420, 260), target: [-120 * n0[0], -120 * n0[1], 0], fov: 46 }, stato: { scena: 'bolla' }, didascalia: t('L\'eliosfera è una bolla di vento solare che ci ripara dai raggi cosmici.', 'The heliosphere is a bubble of solar wind that shields us from cosmic radiation.') },
          { t: 11, cam: { pos: [120, -160, 40], target: [0, 0, -160], fov: 50 }, stato: { scena: 'eliche' }, didascalia: t('Mentre il Sole viaggia, i pianeti tracciano eliche.', 'As the Sun travels, the planets trace helices.') },
          { t: 14.4, cam: { pos: [160, -120, -60], target: [0, 0, -200], fov: 50 }, stato: { scena: 'eliche' }, didascalia: t('Mentre il Sole viaggia, i pianeti tracciano eliche.', 'As the Sun travels, the planets trace helices.') },
          { t: 15, cam: { pos: [0, -3600, 4600], target: [0, 0, 0], fov: 50 }, stato: { scena: 'galassia' }, didascalia: t('E tutto gira attorno al centro della Galassia.', 'And everything orbits the centre of the Galaxy.') },
          { t: 21, cam: { pos: [0, -3000, 3800], target: [0, 0, 0], fov: 50 }, stato: { scena: 'galassia' }, didascalia: '' }
        ],
        conti: function () { return { modello: !!Mo, naso: naso, rTS: Mo ? Mo.shockDir(naso) : null, rHP: Mo ? Mo.eliopausaDir(naso) : null }; }
      };
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
