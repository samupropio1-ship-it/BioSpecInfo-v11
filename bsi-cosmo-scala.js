/* ═══════════════════════════════════════════════════════════════════════
   bsi-cosmo-scala.js — 🎞️ 3 · «Lo spazio è molto più vuoto di quanto pensi» (v260)
   BioSpecInfo · © Samuele Pio Provenzano

   I NUMERI (tutti calcolati, nessuno scritto a mano)
   · Scala: il Sole (1 392 700 km) diventa una pallina da tennis da 6,7 cm:
     1 : D☉/6,7 cm = 1 : 20,8 miliardi.
   · Terra: 12 742 km → 0,61 mm; la sua distanza OGGI dagli elementi kepleriani
     di Standish (JPL, F.calcolo.viaggio.pianeta) → circa 7,2 m. Nettuno oggi →
     circa 215 m.
   · Le stelle vicine con le distanze misurate (anni luce, RECONS/Gaia DR3) e le
     coordinate RA/Dec: alla stessa scala Proxima Centauri cade a ~1900 km.
   · «Vuoto»: la frazione del volume entro 12 anni luce occupata dalle stelle
     elencate, con i loro raggi (in raggi solari), 1 − ΣR³/r³: le cifre 9 si
     contano dal numero, non si scrivono.
   · La galassia: quattro bracci come ONDA DI DENSITÀ — le stelle girano con la
     curva di rotazione piatta (ω = v/R, v = 220 km/s) mentre il disegno dei
     bracci ruota con la velocità di pattern Ω_p (25 km/s/kpc): le stelle
     attraversano i bracci, i bracci restano. 1 s ≈ 16 milioni di anni.
   ═══════════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  var F = g.BSIFisica, C = g.BSICosmo, D = g.document;
  if (!F || !C) return;
  var t = F.t, PI = Math.PI;
  var CONST = { Dsole: 1.3927e9, pallina: 0.067, Dterra: 1.2742e7, UA: 1.495978707e11, AL: 9.4607e15, Rsole: 6.957e8, v: 220, Op: 25, anniPerSec: 1.6e7, kmskpc_Myr: 1.0227e-3 };
  CONST.scala = CONST.Dsole / CONST.pallina;
  /* le stelle entro 12 anni luce (nome, anni luce, RA °, Dec °, raggio R☉): RECONS e Gaia DR3; raggi da letteratura (ordine di grandezza per le nane rosse) */
  var VICINE = [['Proxima Cen', 4.246, 217.43, -62.68, 0.15], ['α Cen A', 4.37, 219.90, -60.83, 1.22], ['α Cen B', 4.37, 219.90, -60.84, 0.86], ['Barnard', 5.96, 269.45, 4.69, 0.19],
    ['Wolf 359', 7.86, 164.12, 7.01, 0.16], ['Lalande 21185', 8.31, 165.83, 35.97, 0.39], ['Sirio A', 8.60, 101.29, -16.72, 1.71], ['Sirio B', 8.60, 101.29, -16.72, 0.008],
    ['Luyten 726-8', 8.73, 24.76, -17.95, 0.14], ['Ross 154', 9.69, 282.46, -23.84, 0.24], ['Ross 248', 10.30, 355.48, 44.18, 0.16], ['ε Eridani', 10.47, 53.23, -9.46, 0.74],
    ['Lacaille 9352', 10.72, 346.47, -35.85, 0.47], ['Ross 128', 11.01, 176.94, 0.80, 0.20], ['EZ Aquarii', 11.11, 334.21, -15.30, 0.11], ['Procione A', 11.46, 114.83, 5.22, 2.05],
    ['61 Cygni A', 11.40, 316.72, 38.75, 0.67], ['61 Cygni B', 11.40, 316.73, 38.74, 0.60], ['τ Ceti', 11.91, 26.02, -15.94, 0.79]];
  function vuoto() {
    var r = 12 * CONST.AL, somma = Math.pow(CONST.Rsole, 3); VICINE.forEach(function (s) { somma += Math.pow(s[4] * CONST.Rsole, 3); });   /* più il Sole */
    var pieno = somma / Math.pow(r, 3), nove = Math.floor(-Math.log10(pieno)) - 2;   /* 1 − pieno in percento: le cifre 9 dopo «99,» */
    return { pieno: pieno, testo: '99,' + new Array(Math.max(1, nove) + 1).join('9') + ' %', nove: nove + 2 };
  }
  function num(x, d) { return x.toLocaleString('it-IT', { maximumFractionDigits: d == null ? 0 : d, minimumFractionDigits: d || 0 }); }
  function lunghezza(m) { return m >= 1e3 ? num(m / 1e3, m < 1e4 ? 1 : 0) + ' km' : m >= 1 ? num(m, m < 10 ? 2 : 0) + ' m' : m >= 0.01 ? num(m * 100, 1) + ' cm' : num(m * 1000, 2) + ' mm'; }
  function vec(ra, dec, r) { var V = F.calcolo && F.calcolo.viaggio, d = V && V.radec ? V.radec(ra, dec) : [Math.cos(dec * PI / 180) * Math.cos(ra * PI / 180), Math.cos(dec * PI / 180) * Math.sin(ra * PI / 180), Math.sin(dec * PI / 180)]; return [d[0] * r, d[1] * r, d[2] * r]; }
  function oggi(i) { var V = F.calcolo && F.calcolo.viaggio; return V && V.pianeta ? V.pianeta(i, Date.now()).r : [0.387, 0.723, 1, 1.524, 5.2, 9.54, 19.2, 30.07][i]; }
  function trama(T, f) { var c = D.createElement('canvas'); c.width = 512; c.height = 256; f(c.getContext('2d'), 512, 256); var tx = new T.CanvasTexture(c); return tx; }

  C.registra('scala', {
    n: 3, etichetta: t('scala', 'scale'), bagliore: 1.0,
    titolo: ['Lo spazio è molto più vuoto di quanto pensi', 'Space is far emptier than you think'],
    init: function (ctx) {
      var S = ctx.S, T = ctx.T, dur = 28, PIANI = { galassia: [0.01, 2000], fine: [0.01, 2000], vicinato: [0.01, 500], sole: [0.01, 100], schema: [0.00002, 2000], globo: [0.005, 50], mappa: [0.01, 500] }, pianoOra = '';   /* piani vicino/lontano per scena: la profondità resta precisa */
      var gr = {}; function gruppo(n) { var x = new T.Group(); x.visible = false; S.aggiungi(x); gr[n] = x; return x; }
      /* A/H: la galassia a onda di densità */
      var gA = gruppo('galassia'), NS = 60000, gp = new Float32Array(NS * 3), gc = new Float32Array(NS * 3), R0 = new Float32Array(NS), th0 = new Float32Array(NS), s = 3;
      function rnd() { s = (s * 16807) % 2147483647; return s / 2147483647; }
      for (var i = 0; i < NS; i++) { R0[i] = 0.5 + Math.pow(rnd(), 0.7) * 15; th0[i] = rnd() * 2 * PI; }
      var gg = new T.BufferGeometry(); gg.setAttribute('position', new T.BufferAttribute(gp, 3)); gg.setAttribute('color', new T.BufferAttribute(gc, 3));
      gA.add(new T.Points(gg, new T.PointsMaterial({ size: 0.07, vertexColors: true, transparent: true, opacity: 0.9, blending: T.AdditiveBlending, depthWrite: false })));
      function galassia(tMyr) {
        var Op = CONST.Op * CONST.kmskpc_Myr * tMyr, pitch = Math.tan(13 * PI / 180);
        for (var k = 0; k < NS; k++) {
          var R = R0[k], th = th0[k] + (CONST.v / R) * CONST.kmskpc_Myr * tMyr, fase = 4 * (th - Op - Math.log(R / 0.5) / pitch), d = 0.5 + 0.5 * Math.cos(fase), b = Math.pow(d, 6) * Math.exp(-R / 9);   /* vicino ai bracci le stelle brillano */
          gp[3 * k] = R * Math.cos(th); gp[3 * k + 1] = R * Math.sin(th); gp[3 * k + 2] = 0;
          var w = R < 2 ? 1 : 0.35 + 0.65 * b; gc[3 * k] = 1 * w; gc[3 * k + 1] = (0.66 + 0.15 * b) * w; gc[3 * k + 2] = (0.38 + 0.4 * b) * w;
        }
        gg.attributes.position.needsUpdate = true; gg.attributes.color.needsUpdate = true;
      }
      /* B: il vicinato (anni luce) */
      var gB = gruppo('vicinato'); VICINE.forEach(function (st) { var p = vec(st[2], st[3], st[1]), m = new T.Mesh(new T.SphereGeometry(0.06 + 0.04 * Math.cbrt(st[4]), 12, 8), new T.MeshBasicMaterial({ color: st[4] > 1 ? 0xd7f7f3 : 0xff9a70 })); m.position.set(p[0], p[1], p[2]); m.userData.nome = st[0]; m.userData.al = st[1]; gB.add(m); gB.add(ctx.L3.linea(T, [[0, 0, 0], p], 0x2f6bff, 0.25)); });
      var sole = new T.Mesh(new T.SphereGeometry(0.1, 16, 12), new T.MeshBasicMaterial({ color: 0xffd24a })); gB.add(sole);
      /* C: il Sole che diventa una pallina da tennis */
      var gC = gruppo('sole');
      var granuli = trama(T, function (q, W, H) { q.fillStyle = '#ff8a2a'; q.fillRect(0, 0, W, H); for (var k = 0; k < 2600; k++) { q.fillStyle = 'rgba(255,' + (150 + Math.floor(rnd() * 70)) + ',40,' + (0.2 + rnd() * 0.3) + ')'; q.beginPath(); q.arc(rnd() * W, rnd() * H, 2 + rnd() * 5, 0, 2 * PI); q.fill(); } });
      var tennis = trama(T, function (q, W, H) { q.fillStyle = '#d8e85a'; q.fillRect(0, 0, W, H); q.strokeStyle = '#f4f8e6'; q.lineWidth = 9; q.beginPath(); for (var x = 0; x <= W; x += 4) { var y = H / 2 + Math.sin(x / W * 4 * PI) * H * 0.28; if (!x) q.moveTo(x, y); else q.lineTo(x, y); } q.stroke(); });
      var palla = new T.Mesh(new T.SphereGeometry(1, 64, 48), new T.MeshBasicMaterial({ map: granuli })); gC.add(palla);
      /* D–E: lo schema in scala (metri del modello) */
      var gD = gruppo('schema'), griglia = new T.GridHelper(600, 60, 0x2f6bff, 0x13244a); griglia.rotation.x = PI / 2; griglia.material.transparent = true; griglia.material.opacity = 0.35; gD.add(griglia);
      var palla2 = new T.Mesh(new T.SphereGeometry(CONST.pallina / 2, 32, 24), new T.MeshBasicMaterial({ color: 0xffd24a })); gD.add(palla2);
      var orbite = [0, 1, 2, 3, 4, 5, 6, 7].map(function (k) { var r = oggi(k) * CONST.UA / CONST.scala, c = new T.Mesh(new T.RingGeometry(r * 0.998, r * 1.002, 256), new T.MeshBasicMaterial({ color: k === 2 ? 0x6fa8ff : 0x8aa0c8, transparent: true, opacity: 0.5, side: T.DoubleSide })); gD.add(c); return r; });
      var terra = new T.Mesh(new T.SphereGeometry(CONST.Dterra / CONST.scala / 2 * 40, 16, 12), new T.MeshBasicMaterial({ color: 0x6fa8ff })); terra.position.set(orbite[2], 0, 0); gD.add(terra);   /* ingrandita ×40 per vederla; la lente mostra la misura vera */
      var nettuno = new T.Mesh(new T.SphereGeometry(2, 12, 8), new T.MeshBasicMaterial({ color: 0x6f8fff })); nettuno.position.set(-orbite[7] * 0.7, orbite[7] * 0.714, 0); gD.add(nettuno);
      /* F: il globo con i cerchi delle stelle vicine alla stessa scala */
      var gF = gruppo('globo'), RT = 6.371e6, globo = new T.Mesh(new T.SphereGeometry(1, 64, 48), new T.MeshBasicMaterial({ color: 0x3a6fb0 })); gF.add(globo);
      try { new T.TextureLoader().load('./textures/earth_day.jpg', function (tx) { globo.material.map = tx; globo.material.color.set(0xffffff); globo.material.needsUpdate = true; }); } catch (e) { }
      var lat0 = 41.9 * PI / 180, lon0 = 12.5 * PI / 180;   /* il Sole posato a Roma */
      function sulGlobo(lat, lon) { return new T.Vector3(Math.cos(lat) * Math.cos(lon), Math.sin(lat), -Math.cos(lat) * Math.sin(lon)).multiplyScalar(1.004); }
      var cerchi = [['Proxima', 4.246, 0xffd24a], ['Barnard', 5.96, 0xff7a5a], ['Sirio', 8.6, 0xff5a5a], ['τ Ceti', 11.91, 0xff4a4a]].map(function (c) {
        var dist = c[1] * CONST.AL / CONST.scala, ang = dist / RT, pts = []; for (var k = 0; k <= 96; k++) { var az = k / 96 * 2 * PI, lat = Math.asin(Math.sin(lat0) * Math.cos(ang) + Math.cos(lat0) * Math.sin(ang) * Math.cos(az)), lon = lon0 + Math.atan2(Math.sin(az) * Math.sin(ang) * Math.cos(lat0), Math.cos(ang) - Math.sin(lat0) * Math.sin(lat)); pts.push(sulGlobo(lat, lon)); }
        var l = new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: c[2], transparent: true, opacity: 0.85 })); globo.add(l); return { nome: c[0], km: dist / 1000 };
      });
      var puntoSole = new T.Mesh(new T.SphereGeometry(0.012, 10, 8), new T.MeshBasicMaterial({ color: 0xffd24a })); puntoSole.position.copy(sulGlobo(lat0, lon0)); globo.add(puntoSole);
      globo.quaternion.setFromUnitVectors(sulGlobo(lat0, lon0).normalize(), new T.Vector3(0, -0.12, 1).normalize());   /* Roma verso la camera */
      /* G: la mappa 3D del vicinato con i nomi */
      var gG = gruppo('mappa'); gB.children.forEach(function (o) { gG.add(o.clone()); });
      var V = vuoto(), lenteR = 0.61e-3;
      function sovrapposizioni(sc, tt) {
        var o = ctx.overlay(), q = o.q, W = o.w, H = o.h; q.clearRect(0, 0, W, H); q.textAlign = 'center';
        function et(obj, testo, col) { var v = obj.getWorldPosition(new T.Vector3()).project(S.cam); if (v.z > 1) return; q.fillStyle = col || '#e6f2ff'; q.font = '600 10px system-ui,sans-serif'; q.fillText(testo, (v.x + 1) / 2 * W, (1 - v.y) / 2 * H - 10); }
        if (sc === 'vicinato' || sc === 'mappa') (sc === 'vicinato' ? gB : gG).children.forEach(function (m) { if (m.userData.nome && !/ B$/.test(m.userData.nome) && !/^α Cen A$/.test(m.userData.nome) && (sc === 'mappa' || /Proxima|Sirio A|Barnard/.test(m.userData.nome))) et(m, m.userData.nome + ' · ' + num(m.userData.al, 2) + t(' al', ' ly'), m.userData.al < 5 ? '#ffd24a' : '#e6f2ff'); });
        if (sc === 'vicinato') { var v = sole.getWorldPosition(new T.Vector3()).project(S.cam), x = (v.x + 1) / 2 * W, y = (1 - v.y) / 2 * H; q.strokeStyle = '#ffd24a'; q.lineWidth = 1.5; q.beginPath(); q.arc(x, y, 16, 0, 2 * PI); q.moveTo(x - 24, y); q.lineTo(x - 10, y); q.moveTo(x + 10, y); q.lineTo(x + 24, y); q.stroke(); }
        if (sc === 'schema' && tt < 17) { /* la lente: il righello 0–3 mm e la Terra vera da 0,61 mm */ var cx = W * 0.62, cy = H * 0.3, R = W * 0.16; q.fillStyle = 'rgba(4,10,24,.88)'; q.strokeStyle = '#9fd0ff'; q.lineWidth = 2; q.beginPath(); q.arc(cx, cy, R, 0, 2 * PI); q.fill(); q.stroke(); var px = R * 1.5 / 3e-3; q.strokeStyle = '#d7f7f3'; q.lineWidth = 1; q.beginPath(); q.moveTo(cx - R * 0.75, cy + R * 0.45); q.lineTo(cx + R * 0.75, cy + R * 0.45); for (var k = 0; k <= 3; k++) { var xx = cx - R * 0.75 + k * px * 1e-3; q.moveTo(xx, cy + R * 0.45); q.lineTo(xx, cy + R * 0.35); } q.stroke(); q.fillStyle = '#d7f7f3'; q.font = '500 9px ui-monospace,monospace'; for (k = 0; k <= 3; k++) q.fillText(k + ' mm', cx - R * 0.75 + k * px * 1e-3, cy + R * 0.62); q.fillStyle = '#6fa8ff'; q.beginPath(); q.arc(cx - R * 0.75 + px * 1.5e-3, cy, lenteR / 2 * px, 0, 2 * PI); q.fill(); q.fillStyle = '#e6f2ff'; q.fillText(t('Terra 0,61 mm', 'Earth 0.61 mm'), cx, cy - R * 0.4); }
        if (sc === 'globo') { q.fillStyle = '#e6f2ff'; q.font = '600 12px system-ui,sans-serif'; q.fillText(t('le stelle più vicine: ', 'nearest stars: ') + num(cerchi[0].km, 0) + ' – ' + num(cerchi[3].km, 0) + ' km', W / 2, H * 0.82); }
        q.textAlign = 'left';
      }
      function passo(dt, tt, stato) {
        var sc = stato.scena || 'galassia'; if (sc !== pianoOra && PIANI[sc]) { pianoOra = sc; S.cam.near = PIANI[sc][0]; S.cam.far = PIANI[sc][1]; S.cam.updateProjectionMatrix(); } Object.keys(gr).forEach(function (k) { gr[k].visible = k === sc || (sc === 'fine' && k === 'galassia'); });
        var hud = '';
        if (sc === 'galassia' || sc === 'fine') {
          var tMyr = (tt % 28) * CONST.anniPerSec / 1e6; galassia(tMyr);
          var stelle = sc === 'fine' ? Math.min(1e11, 7.466e10 + (tt - 26) * 1.3e10) : Math.min(1e11, 3.017e10 + tt / 5 * 7e10);
          hud = t('Time-lapse · 1 s ≈ 16 milioni di anni · curva di rotazione piatta · onda di densità a 4 bracci', 'Time-lapse · 1 s ≈ 16 million years · flat rotation curve · 4-arm density wave') + '<br><span class="gr">' + num(Math.round(stelle / 1e7) * 1e7) + (stelle >= 1e11 ? '+' : '') + '</span><br>' + t('stelle (stima: 100–400 miliardi)', 'stars (estimate: 100–400 billion)');
        } else if (sc === 'vicinato') hud = t('il vicinato del Sole, distanze misurate (Gaia, RECONS)', 'the Sun\'s neighbourhood, measured distances (Gaia, RECONS)');
        else if (sc === 'sole') {
          var f = Math.min(1, Math.max(0, (tt - 8.4) / 3)), Dm = Math.exp(Math.log(CONST.Dsole) * (1 - f) + Math.log(CONST.pallina) * f);
          palla.material.map = f < 0.97 ? granuli : tennis; palla.rotation.y += dt * 0.2; palla.scale.setScalar(0.3 + 0.7 * (1 - Math.pow(f, 0.6)));   /* la sfera si rimpicciolisce con la misura */
          hud = '<span class="gr">' + lunghezza(Dm) + '</span><br>' + (f >= 0.97 ? t('una pallina da tennis · scala 1 : ', 'a tennis ball · scale 1 : ') + num(CONST.scala / 1e9, 1) + t(' miliardi', ' billion') : t('diametro del Sole', 'Sun\'s diameter'));
        } else if (sc === 'schema') {
          var dTerra = orbite[2], f2 = tt < 17 ? Math.min(1, (tt - 12) / 4) : 1, d = tt < 17 ? dTerra * f2 : orbite[7] * Math.min(1, 0.93 + (tt - 17) / 3 * 0.07);
          hud = '<span class="gr">' + lunghezza(d) + '</span><br>' + (tt < 17 ? t('la Terra oggi: ', 'Earth today: ') + lunghezza(dTerra) + t(' dalla pallina', ' from the ball') : t('Nettuno oggi: ', 'Neptune today: ') + lunghezza(orbite[7])) + '<br>' + t('Pianeti: elementi kepleriani JPL (oggi)', 'Planets: JPL Keplerian elements (today)');
        } else if (sc === 'globo') hud = t('alla stessa scala, posato il Sole a Roma: Proxima a ', 'at the same scale, with the Sun in Rome: Proxima at ') + num(cerchi[0].km, 0) + ' km';
        else if (sc === 'mappa') hud = '<span class="gr" style="color:#ffb44a;font-size:15px">' + V.testo + t(' vuoto', ' empty') + '</span><br>' + t('entro 12 anni luce, con i raggi delle stelle · punti ingranditi', 'within 12 light years, with the stars\' radii · dots enlarged');
        ctx.hud.innerHTML = hud; ctx.stato.innerHTML = '';
        sovrapposizioni(sc, tt);
      }
      galassia(0);
      return {
        durata: dur, passo: passo,
        timeline: [
          { t: 0, cam: { pos: [0, -14, 34], target: [0, 0, 0], fov: 50 }, stato: { scena: 'galassia' }, didascalia: t('Lo spazio è <em>molto più vuoto</em> di quanto pensi.', 'Space is <em>far emptier</em> than you think.') },
          { t: 5, cam: { pos: [3, -14, 6], target: [0, 0, 0], fov: 50 }, stato: { scena: 'vicinato' }, didascalia: '' },
          { t: 8, cam: { pos: [0, -4.2, 0], target: [0, 0, 0], fov: 40 }, stato: { scena: 'sole' }, didascalia: t('Rimpiccioliamo il Sole a una pallina da tennis.', 'Shrink the Sun to a tennis ball.') },
          { t: 11.99, cam: { pos: [0, -4.2, 0], target: [0, 0, 0], fov: 40 }, stato: { scena: 'sole' }, didascalia: t('Rimpiccioliamo il Sole a una pallina da tennis.', 'Shrink the Sun to a tennis ball.') },
          { t: 12, cam: { pos: [0.1, -0.2, 0.25], target: [0.05, 0, 0], fov: 50 }, stato: { scena: 'schema' }, didascalia: '' },
          { t: 16.9, cam: { pos: [3.6, -6, 6], target: [3.6, 0, 0], fov: 50 }, stato: { scena: 'schema' }, didascalia: t('La Terra: un granello a sette metri.', 'Earth: a speck seven metres away.') },
          { t: 20, cam: { pos: [0, -260, 260], target: [0, 0, 0], fov: 50 }, stato: { scena: 'schema' }, didascalia: t('Nettuno: oltre duecento metri.', 'Neptune: over two hundred metres.') },
          { t: 20.01, cam: { pos: [0, -0.4, 3.2], target: [0, 0, 0], fov: 40 }, stato: { scena: 'globo' }, didascalia: t('E la stella più vicina? Dall\'altra parte dell\'Europa.', 'And the nearest star? Across a continent.') },
          { t: 23, cam: { pos: [0, -0.2, 2.9], target: [0, 0, 0], fov: 40 }, stato: { scena: 'mappa' }, didascalia: '' },
          { t: 23.01, cam: { pos: [8, -16, 10], target: [0, 0, 0], fov: 50 }, stato: { scena: 'mappa' }, didascalia: '' },
          { t: 26, cam: { pos: [-6, -14, 12], target: [0, 0, 0], fov: 50 }, stato: { scena: 'fine' }, didascalia: '' },
          { t: 26.01, cam: { pos: [0, -14, 34], target: [0, 0, 0], fov: 50 }, stato: { scena: 'fine' }, didascalia: '' },
          { t: 28, cam: { pos: [0, -12, 30], target: [0, 0, 0], fov: 50 }, stato: { scena: 'fine' }, didascalia: '' }
        ],
        conti: function () { return { scala: CONST.scala, terraMm: CONST.Dterra / CONST.scala * 1000, terraM: orbite[2], nettunoM: orbite[7], proximaKm: cerchi[0].km, vuoto: V }; }
      };
    }
  });
  C.scala = { CONST: CONST, VICINE: VICINE, vuoto: vuoto };
})(typeof window !== 'undefined' ? window : globalThis);
