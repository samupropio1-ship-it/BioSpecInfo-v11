/* ═══════════════════════════════════════════════════════════════════════
   bsi-cosmo-geodetiche.js — 🎞️ 4 · «La luce non gira attorno ai buchi neri come pensi» (v258)
   BioSpecInfo · © Samuele Pio Provenzano

   LA FISICA (G = c = 1, lunghezze in unità di M)
   · Geodetiche nulle di Schwarzschild nel piano dell'orbita, u = 1/r:
       d²u/dφ² = 3Mu² − u,   vincolo (du/dφ)² + u²(1 − 2Mu) = 1/b².
     Runge–Kutta del quarto ordine con passo adattivo; il vincolo dà l'errore
     numerico di conservazione ΔE/E = b²·|(du/dφ)² + u²(1 − 2Mu) − 1/b²|,
     scritto nell'HUD (il massimo su tutti i raggi integrati).
   · b_crit = 3√3 M = 5,196 M: sotto è catturato (rosso), vicino avvolge la
     sfera dei fotoni r = 3M più volte (giallo), sopra sfugge (arcobaleno secondo
     l'angolo di deflessione).
   · Il cielo deformato NON è uno shader inventato: con la tabella α(b) delle
     stesse geodetiche si risolve l'equazione della lente b/D − α(b) = ±β per
     ogni stella (osservatore a D = 30 M, stelle all'infinito): le immagini
     primaria e secondaria cadono al loro parametro d'impatto, e l'anello di
     Einstein e quello dei fotoni vengono da lì.
   · I giri attorno alla sfera dei fotoni: n ≈ (Δφ − π)/2π; per b → b_crit
     crescono come −ln|b − b_crit|/2π.
   ═══════════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  var F = g.BSIFisica, C = g.BSICosmo;
  if (!F || !C) return;
  var t = F.t, PI = Math.PI;
  var CONST = { M: 1, bcrit: 3 * Math.sqrt(3), rFotoni: 3, rOrizzonte: 2, D: 30, r0: 400 };   /* Schwarzschild 1916; b_crit e r = 3M: Darwin 1959 */

  /** integra il raggio con parametro d'impatto b (>0); restituisce punti (x, z) nel piano, esito, giri, deflessione, errore */
  function raggio(b, opz) {
    opz = opz || {}; var rVis = opz.rVis || 60, maxGiri = opz.maxGiri || 6;
    var u = 1 / CONST.r0, psi = Math.asin(Math.min(1, b * u)), up = Math.sqrt(Math.max(0, 1 / (b * b) - u * u * (1 - 2 * u))), psi0 = psi;
    var pts = [], err = 0, esito = 'sfugge', n = 0;
    function f(u0, v0) { return [v0, 3 * u0 * u0 - u0]; }
    while (n++ < 200000) {
      var h = Math.min(0.02, 0.0025 + 0.03 * Math.abs(1 - 3 * u) + (u < 0.02 ? 0.05 : 0));
      var k1 = f(u, up), k2 = f(u + h / 2 * k1[0], up + h / 2 * k1[1]), k3 = f(u + h / 2 * k2[0], up + h / 2 * k2[1]), k4 = f(u + h * k3[0], up + h * k3[1]);
      u += h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); up += h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]); psi += h;
      err = Math.max(err, Math.abs(up * up + u * u * (1 - 2 * u) - 1 / (b * b)) * b * b);
      var r = 1 / u; if (r < rVis) pts.push(-r * Math.cos(psi), r * Math.sin(psi));
      if (u >= 0.5) { esito = 'catturato'; break; }
      if (u <= 1 / CONST.r0 && psi > psi0 + 0.5) break;
      if (psi - psi0 > 2 * PI * maxGiri + PI) { esito = 'intrappolato'; break; }
    }
    var L = pts.length, defl = 0;
    if (L >= 4) { var dx = pts[L - 2] - pts[L - 4], dz = pts[L - 1] - pts[L - 3]; defl = Math.atan2(dz, dx); }
    return { pts: pts, esito: esito, giri: Math.max(0, (psi - psi0 - PI) / (2 * PI)), deflessione: esito === 'sfugge' ? (psi + Math.asin(Math.min(1, b * u)) - PI) : null   /* asintoto d'uscita: ψ + arcsin(b u) è costante su una retta; quello d'entrata è a 0 */, errore: err, b: b };
  }
  /** α(b) per i raggi che sfuggono, su una griglia fitta vicino a b_crit */
  var TAB = null;
  function tabella() {
    if (TAB) return TAB; var bb = [], aa = [], e = 0;
    for (var i = 0; i < 140; i++) { var b = CONST.bcrit * (1 + Math.pow(10, -6 + 6.6 * i / 139)); if (b > 70) break; var r = raggio(b, { rVis: 1, maxGiri: 8 }); if (r.esito !== 'sfugge') continue; bb.push(b); aa.push(r.deflessione); e = Math.max(e, r.errore); }
    return (TAB = { b: bb, a: aa, errore: e });
  }
  function alfa(b) { var T = tabella(); if (b <= T.b[0]) return T.a[0]; for (var i = 1; i < T.b.length; i++) if (T.b[i] >= b) { var s = (b - T.b[i - 1]) / (T.b[i] - T.b[i - 1]); return T.a[i - 1] + s * (T.a[i] - T.a[i - 1]); } return 4 / b; }
  /** risolve b/D − α(b) = y per bisezione (la funzione cresce da −∞ vicino a b_crit a +∞) */
  function immagine(y) { var lo = tabella().b[0], hi = 200; for (var i = 0; i < 60; i++) { var m = (lo + hi) / 2; if (m / CONST.D - alfa(m) < y) lo = m; else hi = m; } return (lo + hi) / 2; }
  function hsl(h, s, l) { var a = s * Math.min(l, 1 - l), f = function (n) { var k = (n + h * 12) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); }; return [f(0), f(8), f(4)]; }
  function num(x, d) { return x.toFixed(d == null ? 2 : d).replace('.', ',').replace('-', '−'); }
  function esp(x) { var e = Math.floor(Math.log10(x)), m = x / Math.pow(10, e); return num(m, 1) + 'e' + e; }

  C.registra('geodetiche', {
    n: 4, etichetta: t('geodetiche', 'geodesics'), bagliore: 1.2,
    titolo: ['La luce non gira attorno ai buchi neri come pensi', 'Light doesn\'t bend around black holes the way you think'],
    init: function (ctx) {
      var S = ctx.S, T = ctx.T, dur = 34, errMax = 0, gruppi = {}, crescita = [];
      function linea(pts, colore, opac, gruppo, rot) {
        var n = pts.length / 2, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), cr = Math.cos(rot || 0), sr = Math.sin(rot || 0);
        for (var i = 0; i < n; i++) { var x = pts[2 * i], z = pts[2 * i + 1]; pos[3 * i] = x * cr - z * sr; pos[3 * i + 1] = 0; pos[3 * i + 2] = x * sr + z * cr; var c = typeof colore === 'function' ? colore(i / n) : colore; col[3 * i] = c[0]; col[3 * i + 1] = c[1]; col[3 * i + 2] = c[2]; }
        var geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setAttribute('color', new T.BufferAttribute(col, 3));
        var l = new T.Line(geo, new T.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: opac, blending: T.AdditiveBlending, depthWrite: false })); l.userData.n = n; gruppo.add(l); crescita.push(l); return l;
      }
      function colore(r) { if (r.esito === 'catturato') return [1, 0.22, 0.2]; if (r.esito === 'intrappolato' || Math.abs(r.b - CONST.bcrit) < 0.06) return [1, 0.86, 0.25]; var a = Math.min(1, Math.abs(r.deflessione) / PI); return hsl(0.62 - 0.62 * a, 0.9, 0.58); }
      function fascio(bs, rot, col, opac, gruppo, rVis) { bs.forEach(function (b) { if (Math.abs(b) < 0.05) b = b < 0 ? -0.05 : 0.05;   /* b = 0 è il raggio radiale: 1/b² diverge */
        var r = raggio(Math.abs(b), { rVis: rVis || 60 }); if (isFinite(r.errore)) errMax = Math.max(errMax, r.errore); var p = r.pts; if (b < 0) { p = p.slice(); for (var i = 1; i < p.length; i += 2) p[i] = -p[i]; } linea(p, col || colore(r), opac || 0.8, gruppo, rot); }); }
      function gruppo(nome) { var gr = new T.Group(); gr.name = nome; gr.visible = false; S.aggiungi(gr); gruppi[nome] = gr; return gr; }
      /* il buco nero: ombra (orizzonte) e sfera dei fotoni */
      var nero = new T.Mesh(new T.SphereGeometry(CONST.rOrizzonte, 48, 32), new T.MeshBasicMaterial({ color: 0x000000 })); nero.name = 'orizzonte'; S.aggiungi(nero);
      var anelloF = new T.Mesh(new T.TorusGeometry(CONST.rFotoni, 0.03, 8, 160), new T.MeshBasicMaterial({ color: 0xffd24a, transparent: true, opacity: 0.6 })); anelloF.rotation.x = PI / 2; anelloF.name = 'sfera-dei-fotoni'; S.aggiungi(anelloF);
      /* A: cielo deformato dalla lente, ombra apparente e anello dei fotoni */
      var gA = gruppo('A'), T0 = tabella(); errMax = Math.max(errMax, T0.errore);
      (function () {
        var s = 9, rnd = function () { s = (s * 16807) % 2147483647; return s / 2147483647; }, N = 2600, pos = [], col = [];
        for (var i = 0; i < N; i++) {
          var beta = Math.sqrt(rnd()) * 0.9, az = rnd() * 2 * PI, c = hsl(0.78 + rnd() * 0.12, 0.7, 0.55 + rnd() * 0.3);
          [[immagine(beta), az], [immagine(-beta), az + PI]].forEach(function (im) { pos.push(im[0] * Math.cos(im[1]), 0, im[0] * Math.sin(im[1])); col.push(c[0], c[1], c[2]); });
        }
        var geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new T.Float32BufferAttribute(col, 3));
        gA.add(new T.Points(geo, new T.PointsMaterial({ size: 0.16, vertexColors: true, transparent: true, opacity: 0.9, blending: T.AdditiveBlending, depthWrite: false })));
        var ombra = new T.Mesh(new T.CircleGeometry(CONST.bcrit, 96), new T.MeshBasicMaterial({ color: 0x000000 })); ombra.rotation.x = PI / 2; ombra.position.y = -0.5; gA.add(ombra);
        var anello = new T.Mesh(new T.RingGeometry(CONST.bcrit * 0.99, CONST.bcrit * 1.06, 160), new T.MeshBasicMaterial({ color: 0xff9a3c, transparent: true, opacity: 0.95, side: T.DoubleSide, blending: T.AdditiveBlending })); anello.rotation.x = PI / 2; anello.position.y = -0.6; gA.add(anello);
      })();
      /* B: il riccio — raggi grigi da 24 direzioni */
      var gB = gruppo('B'); for (var d = 0; d < 24; d++) fascio([0.5, 2, 4, 5.0, 5.3, 6.5, 9], d * 2 * PI / 24, [0.75, 0.78, 0.82], 0.45, gB);
      /* C: fasci paralleli colorati dai quattro lati */
      var gC = gruppo('C'), bsC = []; for (var i = 0; i <= 24; i++) bsC.push(-9 + i * 0.75);
      [[PI / 2, [0.2, 0.95, 0.85]], [-PI / 2, [1, 0.3, 0.75]], [0, [1, 0.75, 0.2]], [PI, [1, 0.35, 0.25]]].forEach(function (x) { fascio(bsC, x[0], x[1], 0.7, gC, 26); });   /* turchese dall'alto, magenta dal basso, giallo e rosso dai lati */
      /* D: rosette vicino alla sfera dei fotoni */
      var gD = gruppo('D'), bsD = []; for (var k = 1; k <= 7; k++) { bsD.push(CONST.bcrit * (1 + Math.pow(10, -k))); }
      for (var d2 = 0; d2 < 6; d2++) fascio(bsD, d2 * PI / 3, [0.6, 0.85, 0.9], 0.5, gD);
      /* E: il fascio piano rosso e il raggio che si avvicina a b_crit */
      var gE = gruppo('E'), bsE = []; for (var j = 0; j <= 120; j++) bsE.push(-9 + 18 * j / 120);
      fascio(bsE, 0, [1, 0.18, 0.15], 0.35, gE);
      var critico = null, giri = 0;
      function aggiornaCritico(sE) {
        var eps = Math.pow(10, -1 - 8 * Math.min(1, Math.max(0, sE))), r = raggio(CONST.bcrit * (1 + eps), { maxGiri: 8 }); errMax = Math.max(errMax, r.errore); giri = r.giri;
        if (critico) { gE.remove(critico); critico.geometry.dispose(); crescita.splice(crescita.indexOf(critico), 1); }
        critico = linea(r.pts, function (s) { return hsl(0.14 - 0.14 * s, 1, 0.6); }, 1, gE, 0); critico.geometry.setDrawRange(0, r.pts.length / 2);
      }
      aggiornaCritico(0);
      var scena = '', ultimoSE = -1;
      function passo(dt, tt, stato) {
        var sc = stato.scena || 'A'; if (sc !== scena) { Object.keys(gruppi).forEach(function (k) { gruppi[k].visible = k === sc; }); scena = sc; anelloF.visible = sc !== 'A'; nero.visible = true; }
        /* i raggi crescono come un fronte di luce */
        var inizio = { A: 0, B: 7, C: 13, D: 20, E: 27 }[sc], pr = Math.min(1, Math.max(0.02, (tt - inizio) / 3.5));
        gruppi[sc].children.forEach(function (l) { if (l.userData.n && l !== critico) l.geometry.setDrawRange(0, Math.max(2, Math.floor(l.userData.n * pr))); });
        if (sc === 'E') { var sE = Math.floor(Math.min(1, (tt - 28) / 5) * 24) / 24; if (sE !== ultimoSE) { aggiornaCritico(sE); ultimoSE = sE; } }
        ctx.hud.innerHTML = '<span class="ac">ΔE/E</span> ' + esp(Math.max(errMax, 1e-16)) + '<br>b<sub>crit</sub> = 3√3 M = ' + num(CONST.bcrit, 3) + ' M<br>' + t('sfera dei fotoni r = 3M · orizzonte r = 2M', 'photon sphere r = 3M · horizon r = 2M') + (sc === 'E' ? '<br><span class="gr">' + t('Giri ', 'Orbits ') + num(giri, 1) + '</span>' : '') + (sc === 'A' ? '<br>' + t('cielo: equazione della lente con α(b) integrato, D = 30 M', 'sky: lens equation with integrated α(b), D = 30 M') : '');
        ctx.stato.innerHTML = '<span style="color:#ff5a4a">●</span> ' + t('catturato', 'captured') + '<br><span style="color:#ffd24a">●</span> ' + t('critico', 'critical') + '<br><span style="background:linear-gradient(90deg,#4a7bff,#3fe0a0,#ffd24a,#ff5a4a);-webkit-background-clip:text;color:transparent">●●</span> ' + t('sfugge', 'escapes');
      }
      S.inquadra(60, -PI / 2, PI / 2);
      return {
        durata: dur, passo: passo,
        timeline: [
          { t: 0, cam: { pos: [0, -70, 0], target: [0, 0, 0], fov: 38 }, stato: { scena: 'A' }, didascalia: t('La luce non gira attorno ai buchi neri <em>come pensi.</em>', 'Light doesn\'t bend around black holes <em>the way you think.</em>') },
          { t: 7, cam: { pos: [0, -62, 6], target: [0, 0, 0], fov: 38 }, stato: { scena: 'B' }, didascalia: t('Ogni raggio segue una geodetica.', 'Every ray follows a geodesic.') },
          { t: 13, cam: { pos: [0, -44, 6], target: [0, 0, 0], fov: 40 }, stato: { scena: 'C' }, didascalia: t('Sotto b = 5,196 M non esce più.', 'Below b = 5.196 M it never gets out.') },
          { t: 20, cam: { pos: [0, -30, 4], target: [0, 0, 0], fov: 40 }, stato: { scena: 'D' }, didascalia: t('Vicino al limite gira attorno alla sfera dei fotoni.', 'Near the limit it circles the photon sphere.') },
          { t: 27, cam: { pos: [0, -48, 14], target: [0, 0, 0], fov: 40 }, stato: { scena: 'E' }, didascalia: t('Più ci si avvicina, più giri fa.', 'The closer it gets, the more orbits it makes.') },
          { t: 34, cam: { pos: [0, -70, 0], target: [0, 0, 0], fov: 38 }, stato: { scena: 'E' }, didascalia: '' }
        ],
        conti: function () { return { errMax: errMax, giri: giri, bcrit: CONST.bcrit }; }
      };
    }
  });
  C.geodetiche = { CONST: CONST, raggio: raggio, alfa: alfa, immagine: immagine, tabella: tabella };
})(typeof window !== 'undefined' ? window : globalThis);
