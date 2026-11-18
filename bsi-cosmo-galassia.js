/* ═══════════════════════════════════════════════════════════════════════
   bsi-cosmo-galassia.js — 🎞️ 8 · «Perché le galassie hanno bisogno della materia oscura?» (v258)
   BioSpecInfo · © Samuele Pio Provenzano

   LA FISICA (kpc, km/s, masse solari; G = 4,30091·10⁻⁶ kpc (km/s)²/M☉)
   · Bulge di Hernquist (1990): v² = GM r/(r + a)², Φ = −GM/(r + a).
   · Disco esponenziale di Freeman (1970), nel piano, y = R/2R_d:
       v² = 4πGΣ₀R_d y²[I₀K₀ − I₁K₁],  Φ = −πGΣ₀R[I₀(y)K₁(y) − I₁(y)K₀(y)]
     (Binney e Tremaine, eq. 2.165), Bessel con i polinomi di Abramowitz e Stegun.
   · Alone NFW (Navarro, Frenk e White 1996), M₂₀₀ = 10¹² M☉, c = 12:
       M(r) = M₂₀₀ m(r/r_s)/m(c), m(x) = ln(1 + x) − x/(1 + x), Φ = −GM₂₀₀ ln(1 + x)/(m(c) r).
   · Le stelle sono particelle test nel piano del disco, integrate con il
     leapfrog (kick–drift–kick), che conserva bene l'energia: ΔE/E è la media
     dello scarto relativo, calcolata davvero. Partono su orbite circolari
     nel potenziale CON l'alone; «legata» vuol dire E = v²/2 + Φ < 0 nel
     potenziale in uso. Spegnendo l'alone, le stelle esterne superano la
     velocità di fuga dei soli barioni e se ne vanno.
   · La curva di rotazione in basso: totale, visibile, alone, velocità di fuga
     e i punti misurati sulle stelle della simulazione (velocità tangenziale
     media per anello di 1 kpc).
   ═══════════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  var F = g.BSIFisica, C = g.BSICosmo;
  if (!F || !C) return;
  var t = F.t, PI = Math.PI;
  var CONST = {
    G: 4.30091e-6,                              /* kpc (km/s)² / M☉ (IAU 2015 + kpc) */
    Mb: 1.0e10, ab: 0.6,                        /* bulge di Hernquist: massa, raggio di scala (ordine della Via Lattea) */
    Md: 5.0e10, Rd: 3.0,                        /* disco di Freeman: massa, lunghezza di scala (Bland-Hawthorn e Gerhard 2016) */
    M200: 1.0e12, c: 12, rhoCrit: 136.0,        /* alone NFW: M₂₀₀, concentrazione, ρ_crit = 2,775·10¹¹ h² M☉/Mpc³ con h = 0,7 */
    Gyr: 0.97779                                /* 1 kpc/(km/s) = 0,978 Gyr */
  };
  CONST.Sigma0 = CONST.Md / (2 * PI * CONST.Rd * CONST.Rd);
  CONST.R200 = Math.pow(3 * CONST.M200 / (4 * PI * 200 * CONST.rhoCrit), 1 / 3);
  CONST.rs = CONST.R200 / CONST.c;
  function mNFW(x) { return Math.log(1 + x) - x / (1 + x); }
  /* Bessel modificate (Abramowitz e Stegun 9.8.1–9.8.8) */
  function I0(x) { var a = Math.abs(x); if (a <= 3.75) { var y = (x / 3.75) * (x / 3.75); return 1 + y * (3.5156229 + y * (3.0899424 + y * (1.2067492 + y * (0.2659732 + y * (0.0360768 + y * 0.0045813))))); } var z = 3.75 / a; return Math.exp(a) / Math.sqrt(a) * (0.39894228 + z * (0.01328592 + z * (0.00225319 + z * (-0.00157565 + z * (0.00916281 + z * (-0.02057706 + z * (0.02635537 + z * (-0.01647633 + z * 0.00392377)))))))); }
  function I1(x) { var a = Math.abs(x); if (a <= 3.75) { var y = (x / 3.75) * (x / 3.75); return x * (0.5 + y * (0.87890594 + y * (0.51498869 + y * (0.15084934 + y * (0.02658733 + y * (0.00301532 + y * 0.00032411)))))); } var z = 3.75 / a; return Math.exp(a) / Math.sqrt(a) * (0.39894228 + z * (-0.03988024 + z * (-0.00362018 + z * (0.00163801 + z * (-0.01031555 + z * (0.02282967 + z * (-0.02895312 + z * (0.01787654 - z * 0.00420059)))))))); }
  function K0(x) { if (x <= 2) { var y = x * x / 4; return -Math.log(x / 2) * I0(x) + (-0.57721566 + y * (0.42278420 + y * (0.23069756 + y * (0.03488590 + y * (0.00262698 + y * (0.00010750 + y * 0.0000074)))))); } var z = 2 / x; return Math.exp(-x) / Math.sqrt(x) * (1.25331414 + z * (-0.07832358 + z * (0.02189568 + z * (-0.01062446 + z * (0.00587872 + z * (-0.00251540 + z * 0.00053208)))))); }
  function K1(x) { if (x <= 2) { var y = x * x / 4; return Math.log(x / 2) * I1(x) + (1 / x) * (1 + y * (0.15443144 + y * (-0.67278579 + y * (-0.18156897 + y * (-0.01919402 + y * (-0.00110404 + y * (-0.00004686))))))); } var z = 2 / x; return Math.exp(-x) / Math.sqrt(x) * (1.25331414 + z * (0.23498619 + z * (-0.03655620 + z * (0.01504268 + z * (-0.00780353 + z * (0.00325614 + z * (-0.00068245))))))); }
  /* le tre componenti: v² e Φ */
  function v2b(r) { return CONST.G * CONST.Mb * r / ((r + CONST.ab) * (r + CONST.ab)); }
  function phib(r) { return -CONST.G * CONST.Mb / (r + CONST.ab); }
  function v2d(R) { var y = Math.max(1e-6, R / (2 * CONST.Rd)); return 4 * PI * CONST.G * CONST.Sigma0 * CONST.Rd * y * y * (I0(y) * K0(y) - I1(y) * K1(y)); }
  function phid(R) { var y = Math.max(1e-6, R / (2 * CONST.Rd)); return -PI * CONST.G * CONST.Sigma0 * R * (I0(y) * K1(y) - I1(y) * K0(y)); }
  function v2h(r) { var x = r / CONST.rs; return CONST.G * CONST.M200 * mNFW(x) / mNFW(CONST.c) / r; }
  function phih(r) { var x = r / CONST.rs; return -CONST.G * CONST.M200 * Math.log(1 + x) / (mNFW(CONST.c) * r); }
  /* tabelle per l'integrazione: v²(R) e Φ(R) fino a 200 kpc, con e senza alone */
  var NT = 4000, RMAX = 200, TAB = null;
  function tabelle() {
    if (TAB) return TAB; var v2s = new Float64Array(NT + 1), v2c = new Float64Array(NT + 1), ps = new Float64Array(NT + 1), pc = new Float64Array(NT + 1);
    for (var i = 0; i <= NT; i++) { var R = Math.max(0.01, RMAX * i / NT), b = v2b(R) + v2d(R), h = v2h(R); v2s[i] = b; v2c[i] = b + h; ps[i] = phib(R) + phid(R); pc[i] = ps[i] + phih(R); }
    return (TAB = { senza: { v2: v2s, phi: ps }, con: { v2: v2c, phi: pc } });
  }
  function interp(arr, R) { var x = Math.min(NT - 1.000001, Math.max(0, R / RMAX * NT)), i = Math.floor(x), s = x - i; return arr[i] + (arr[i + 1] - arr[i]) * s; }
  function vc(R, dm) { return Math.sqrt(Math.max(0, interp(tabelle()[dm ? 'con' : 'senza'].v2, R))); }
  function vesc(R, dm) { return Math.sqrt(-2 * interp(tabelle()[dm ? 'con' : 'senza'].phi, R)); }

  /** un insieme di stelle test: posizioni e velocità (kpc, km/s) */
  function galassia(N, seme) {
    var s = seme || 7; function rnd() { s = (s * 16807) % 2147483647; return s / 2147483647; }
    var x = new Float64Array(N), y = new Float64Array(N), vx = new Float64Array(N), vy = new Float64Array(N), E0 = new Float64Array(N);
    for (var i = 0; i < N; i++) {
      var R = i < N * 0.12 ? -CONST.ab * Math.log(1 - rnd() * 0.97) * 0.8 : -CONST.Rd * Math.log((rnd() + 1e-9) * (rnd() + 1e-9));   /* bulge, poi disco esponenziale (Gamma(2)) */
      R = Math.max(0.15, Math.min(30, R)); var a = rnd() * 2 * PI, v = vc(R, true) * (1 + 0.04 * (rnd() - 0.5) * 2);
      x[i] = R * Math.cos(a); y[i] = R * Math.sin(a); vx[i] = -v * Math.sin(a); vy[i] = v * Math.cos(a);
    }
    return { N: N, x: x, y: y, vx: vx, vy: vy, E0: E0, t: 0 };
  }
  function energia(G0, i, dm) { var R = Math.hypot(G0.x[i], G0.y[i]); return 0.5 * (G0.vx[i] * G0.vx[i] + G0.vy[i] * G0.vy[i]) + interp(tabelle()[dm ? 'con' : 'senza'].phi, R); }
  function iniziaEnergie(G0, dm) { for (var i = 0; i < G0.N; i++) G0.E0[i] = energia(G0, i, dm); G0.t = 0; }
  /** leapfrog kick–drift–kick: n passi di dt (kpc/(km/s)) */
  function evolvi(G0, dm, dt, n) {
    var T = tabelle()[dm ? 'con' : 'senza'].v2;
    for (var k = 0; k < n; k++) {
      for (var i = 0; i < G0.N; i++) {
        var R = Math.hypot(G0.x[i], G0.y[i]); if (R > RMAX * 0.95) continue;
        var a = -interp(T, R) / (R * R) * dt / 2; G0.vx[i] += a * G0.x[i]; G0.vy[i] += a * G0.y[i];
        G0.x[i] += G0.vx[i] * dt; G0.y[i] += G0.vy[i] * dt;
        R = Math.hypot(G0.x[i], G0.y[i]); a = -interp(T, R) / (R * R) * dt / 2; G0.vx[i] += a * G0.x[i]; G0.vy[i] += a * G0.y[i];
      }
      G0.t += dt;
    }
  }
  function misure(G0, dm) {
    var leg = 0, dE = 0, nE = 0, bin = new Float64Array(31), cnt = new Float64Array(31);
    for (var i = 0; i < G0.N; i++) {
      var R = Math.hypot(G0.x[i], G0.y[i]), E = energia(G0, i, dm); if (E < 0) { leg++; if (R < RMAX * 0.9) { dE += Math.abs((E - G0.E0[i]) / G0.E0[i]); nE++; } }
      if (R < 30.5) { var k = Math.floor(R), vt = (G0.x[i] * G0.vy[i] - G0.y[i] * G0.vx[i]) / (R || 1); bin[k] += vt; cnt[k]++; }
    }
    var curva = []; for (var j = 0; j <= 30; j++) if (cnt[j] > 8) curva.push([j + 0.5, bin[j] / cnt[j]]);
    return { legate: leg / G0.N, dEE: nE ? dE / nE : 0, curva: curva, tGyr: G0.t * CONST.Gyr };
  }
  function num(x, d) { return x.toFixed(d == null ? 2 : d).replace('.', ',').replace('-', '−'); }
  function esp(x) { if (!(x > 0)) return '0'; var e = Math.floor(Math.log10(x)), m = x / Math.pow(10, e); return num(m, 1) + 'e' + e; }

  C.registra('galassia', {
    n: 8, etichetta: t('materia oscura', 'dark matter'), bagliore: 1.1,
    titolo: ['Perché le galassie hanno bisogno della materia oscura?', 'Why do galaxies need dark matter?'],
    init: function (ctx) {
      var S = ctx.S, T = ctx.T, dur = 41, N = 9000, DT = 0.0008, PASSI = 2;
      var st = { dm: true, split: false };
      function sistema(z) {
        var geo = new T.BufferGeometry(), pos = new Float32Array(N * 3), col = new Float32Array(N * 3); geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setAttribute('color', new T.BufferAttribute(col, 3));
        var p = new T.Points(geo, new T.PointsMaterial({ size: 0.16, vertexColors: true, transparent: true, opacity: 0.85, blending: T.AdditiveBlending, depthWrite: false }));
        var frecce = new T.LineSegments(new T.BufferGeometry(), new T.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.8, blending: T.AdditiveBlending })); frecce.geometry.setAttribute('position', new T.BufferAttribute(new Float32Array(80 * 6), 3)); frecce.geometry.setAttribute('color', new T.BufferAttribute(new Float32Array(80 * 6), 3));
        var gr = new T.Group(); gr.add(p); gr.add(frecce); gr.position.z = z;
        [5, 10, 15, 20, 25].forEach(function (R) { var c = new T.Mesh(new T.RingGeometry(R - 0.03, R + 0.03, 128), new T.MeshBasicMaterial({ color: 0x8aa0c8, transparent: true, opacity: 0.18, side: T.DoubleSide })); gr.add(c); });
        var nucleo = new T.Mesh(new T.SphereGeometry(0.8, 24, 16), new T.MeshBasicMaterial({ color: 0xffe6d0 })); gr.add(nucleo);
        S.aggiungi(gr); return { gr: gr, geo: geo, pos: pos, col: col, frecce: frecce, G: null, dm: true, misura: null };
      }
      var A = sistema(0), B = sistema(0); B.gr.visible = false;
      function reset(sis, dm) { sis.G = galassia(N, 7); sis.dm = dm; iniziaEnergie(sis.G, dm); }
      function aggiornaGrafica(sis) {
        var G0 = sis.G, p = sis.pos, c = sis.col;
        for (var i = 0; i < N; i++) {
          p[3 * i] = G0.x[i]; p[3 * i + 1] = G0.y[i]; p[3 * i + 2] = 0;
          var R = Math.hypot(G0.x[i], G0.y[i]), E = 0.5 * (G0.vx[i] * G0.vx[i] + G0.vy[i] * G0.vy[i]) + interp(tabelle()[sis.dm ? 'con' : 'senza'].phi, R);
          if (st.split && E >= 0) { c[3 * i] = 1; c[3 * i + 1] = 0.3; c[3 * i + 2] = 0.3; } else if (st.split) { c[3 * i] = 0.45; c[3 * i + 1] = 0.65; c[3 * i + 2] = 1; }
          else { var w = Math.exp(-R / 6); c[3 * i] = 0.75 + 0.25 * w; c[3 * i + 1] = 0.62 + 0.3 * w; c[3 * i + 2] = 0.72 + 0.2 * w; }
        }
        sis.geo.attributes.position.needsUpdate = true; sis.geo.attributes.color.needsUpdate = true;
        var fp = sis.frecce.geometry.attributes.position.array, fc = sis.frecce.geometry.attributes.color.array;
        for (var k = 0; k < 80; k++) { var j = Math.floor(k * N / 80), s2 = 0.012; fp[6 * k] = G0.x[j]; fp[6 * k + 1] = G0.y[j]; fp[6 * k + 2] = 0.05; fp[6 * k + 3] = G0.x[j] + G0.vx[j] * s2; fp[6 * k + 4] = G0.y[j] + G0.vy[j] * s2; fp[6 * k + 5] = 0.05; var cc = k % 2 ? [1, 0.6, 0.3] : [0.75, 0.6, 1]; for (var q = 0; q < 2; q++) { fc[6 * k + 3 * q] = cc[0]; fc[6 * k + 3 * q + 1] = cc[1]; fc[6 * k + 3 * q + 2] = cc[2]; } }
        sis.frecce.geometry.attributes.position.needsUpdate = true; sis.frecce.geometry.attributes.color.needsUpdate = true;
      }
      function grafico(sis, y0, h0, titolo, x0, w0) {
        var o = ctx.overlay(), q = o.q, W = o.w, gx = W * (x0 == null ? 0.07 : x0), gw = W * (w0 || 0.76), gy = y0 * o.h, gh = h0 * o.h, X = function (R) { return gx + 30 + R / 30 * (gw - 40); }, Y = function (v) { return gy + 8 + (1 - v / 300) * (gh - 26); };
        q.fillStyle = 'rgba(6,10,22,.7)'; q.strokeStyle = 'rgba(120,150,200,.3)'; q.beginPath(); if (q.roundRect) q.roundRect(gx, gy, gw, gh, 10); else q.rect(gx, gy, gw, gh); q.fill(); q.stroke();
        function linea(f, col, w, trat) { q.strokeStyle = col; q.lineWidth = w; q.setLineDash(trat || []); q.beginPath(); for (var i = 1; i <= 120; i++) { var R = 30 * i / 120, v = f(R); if (i === 1) q.moveTo(X(R), Y(Math.min(300, v))); else q.lineTo(X(R), Y(Math.min(300, v))); } q.stroke(); q.setLineDash([]); }
        linea(function (R) { return vesc(R, sis.dm); }, 'rgba(255,255,255,.6)', 1, [1, 3]);
        linea(function (R) { return Math.sqrt(v2h(R)); }, '#a47cff', 1.4);
        linea(function (R) { return Math.sqrt(v2b(R) + v2d(R)); }, '#ffa04a', 1.4, [5, 3]);
        linea(function (R) { return vc(R, sis.dm); }, '#3fe0e0', 2.6);
        if (sis.misura) sis.misura.curva.forEach(function (p) { q.fillStyle = '#fff'; q.beginPath(); q.arc(X(p[0]), Y(Math.max(0, Math.min(300, p[1]))), 2, 0, 2 * PI); q.fill(); });
        q.fillStyle = 'rgba(169,191,214,.85)'; q.font = '500 8px ui-monospace,Menlo,monospace'; q.textAlign = 'left';
        [0, 100, 200, 300].forEach(function (v) { q.fillText(String(v), gx + 6, Y(v) + 3); }); [0, 10, 20, 30].forEach(function (R) { q.fillText(String(R), X(R) - 4, gy + gh - 6); });
        q.fillText('km/s', gx + 6, gy + 12); q.fillText('kpc', gx + gw - 22, gy + gh - 6);
        var leg = [['#3fe0e0', t('totale', 'total')], ['#ffa04a', t('visibile', 'visible')], ['#a47cff', t('alone', 'dark matter')], ['#fff', t('fuga', 'escape')], ['#fff', t('● stelle', '● stars')]];
        if (gw > W * 0.6) leg.forEach(function (l, i) { q.fillStyle = l[0]; q.fillText(l[1], gx + 40 + i * (gw - 50) / 5, gy + 12); });   /* nei mini-grafici la legenda è quella del grafico grande */
        if (titolo) { q.fillStyle = '#e6f2ff'; q.font = 'italic 600 12px Georgia,serif'; q.fillText(titolo, gx + 8, gy - 6); }
      }
      function hud() {
        var m = A.misura || { legate: 1, dEE: 0, tGyr: 0 };
        if (!st.split) {
          ctx.hud.innerHTML = '<span style="color:' + (st.dm ? '#a47cff' : '#ff5a4a') + '">●</span> ' + (st.dm ? t('Materia oscura sì', 'Dark matter on') : t('Materia oscura no', 'Dark matter off')) + '<br>' + t('Modello: Freeman 1970, Hernquist 1990, Navarro, Frenk e White 1996', 'Model after Freeman 1970, Hernquist 1990, Navarro, Frenk & White 1996');
          ctx.stato.innerHTML = '<small>ΔE/E ' + esp(m.dEE) + '<br>' + t('legate ', 'bound ') + Math.round(m.legate * 100) + ' %<br>t ' + num(m.tGyr, 2) + ' Gyr</small>';
        } else {
          var mb = B.misura || m;
          ctx.hud.innerHTML = t('Stesse condizioni iniziali', 'Same initial conditions') + '<br><span style="color:#ff5a4a">●</span> ' + t('Senza materia oscura · legate ', 'Without dark matter · bound ') + Math.round(m.legate * 100) + ' %<br><span style="color:#a47cff">●</span> ' + t('Con materia oscura · legate ', 'With dark matter · bound ') + Math.round(mb.legate * 100) + ' %';
          ctx.stato.innerHTML = '<small><span style="color:#7aa8ff">●</span> ' + t('legate', 'bound') + '<br><span style="color:#ff5a5a">●</span> ' + t('in fuga', 'escaping') + '<br>t ' + num(m.tGyr, 2) + ' Gyr</small>';
        }
      }
      var faseCorrente = '', contaMisura = 0;
      function imposta(fase) {
        if (fase === faseCorrente) return; faseCorrente = fase;
        if (fase === 'split') { st.split = true; reset(A, false); reset(B, true); A.gr.position.set(0, 26, 0); B.gr.position.set(0, -26, 0); B.gr.visible = true; }
        else { st.split = false; B.gr.visible = false; A.gr.position.set(0, 0, 0); st.dm = fase !== 'senza'; reset(A, st.dm); }
      }
      function passo(dt, tt, stato, cinem) {
        if (cinem) imposta(stato.fase || 'con'); else if (!faseCorrente) imposta('con');
        if (dt > 0) { var n = Math.max(1, Math.round(PASSI * Math.min(3, dt * 60))); evolvi(A.G, A.dm, DT, n); if (st.split) evolvi(B.G, B.dm, DT, n); }
        aggiornaGrafica(A); if (st.split) aggiornaGrafica(B);
        if (contaMisura++ % 10 === 0) { A.misura = misure(A.G, A.dm); if (st.split) B.misura = misure(B.G, B.dm); }
        var o = ctx.overlay(); o.q.clearRect(0, 0, o.w, o.h);
        if (st.split) { grafico(A, 0.2, 0.12, t('Senza materia oscura', 'Without dark matter'), 0.36, 0.48); grafico(B, 0.56, 0.12, t('Con materia oscura', 'With dark matter'), 0.36, 0.48); }   /* mini-grafici a destra di ciascuna metà */
        else grafico(A, 0.63, 0.2);
        hud();
      }
      /* comandi del pannello: in modalità esplora */
      var bDM = F.el('button', { type: 'button', 'class': 'bsiFX-bott', testo: t('Materia oscura: sì / no', 'Dark matter: on / off'), onclick: function () { faseCorrente = 'man'; st.split = false; B.gr.visible = false; A.gr.position.set(0, 0, 0); st.dm = !st.dm; reset(A, st.dm); } });
      var bSp = F.el('button', { type: 'button', 'class': 'bsiFX-bott', testo: t('Schermo diviso', 'Split screen'), onclick: function () { faseCorrente = ''; imposta('split'); faseCorrente = 'man-split'; } });
      ctx.pannello.appendChild(bDM); ctx.pannello.appendChild(bSp);
      ctx.pannello.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('Bulge ' + (CONST.Mb / 1e10) + '·10¹⁰ M☉, disco ' + (CONST.Md / 1e10) + '·10¹⁰ M☉ (R_d = ' + CONST.Rd + ' kpc), alone NFW 10¹² M☉ con c = ' + CONST.c + ' (r_s = ' + CONST.rs.toFixed(1).replace('.', ',') + ' kpc). Stelle come particelle test nel piano, leapfrog con passo di ' + (DT * CONST.Gyr * 1000).toFixed(2).replace('.', ',') + ' milioni di anni.', 'Bulge ' + (CONST.Mb / 1e10) + '·10¹⁰ M☉, disc ' + (CONST.Md / 1e10) + '·10¹⁰ M☉ (R_d = ' + CONST.Rd + ' kpc), NFW halo 10¹² M☉ with c = ' + CONST.c + ' (r_s = ' + CONST.rs.toFixed(1) + ' kpc). Stars as test particles in the plane, leapfrog with a ' + (DT * CONST.Gyr * 1000).toFixed(2) + ' Myr step.') }));
      reset(A, true);
      return {
        durata: dur, passo: passo, reset: function () { faseCorrente = ''; },
        timeline: [
          { t: 0, cam: { pos: [0, -46, 34], target: [0, 0, -6], fov: 44 }, stato: { fase: 'con' }, didascalia: t('Perché le galassie hanno bisogno della <em>materia oscura?</em>', 'Why do galaxies need <em>dark matter?</em>') },
          { t: 5, cam: { pos: [10, -44, 30], target: [0, 0, -6], fov: 44 }, stato: { fase: 'senza' }, didascalia: t('Senza: le stelle esterne superano la velocità di fuga.', 'Without it: the outer stars exceed escape velocity.') },
          { t: 15, cam: { pos: [-8, -42, 34], target: [0, 0, -6], fov: 44 }, stato: { fase: 'con' }, didascalia: t('Con l\'alone la curva resta piatta e la galassia regge.', 'With the halo the curve stays flat and the galaxy holds.') },
          { t: 25, cam: { pos: [0, -30, 18], target: [0, 0, -4], fov: 44 }, stato: { fase: 'con' }, didascalia: '' },
          { t: 29, cam: { pos: [0, -62, 96], target: [0, 0, 0], fov: 50 }, stato: { fase: 'split' }, didascalia: t('Stesse condizioni iniziali.', 'Same initial conditions.') },
          { t: 41, cam: { pos: [0, -62, 96], target: [0, 0, 0], fov: 50 }, stato: { fase: 'split' }, didascalia: '' }
        ],
        conti: function () { return { A: A.misura, B: B.misura, dm: st.dm, split: st.split }; }
      };
    }
  });
  C.galassia = { CONST: CONST, v2b: v2b, v2d: v2d, v2h: v2h, phib: phib, phid: phid, phih: phih, vc: vc, vesc: vesc, galassia: galassia, evolvi: evolvi, misure: misure, iniziaEnergie: iniziaEnergie, I0: I0, I1: I1, K0: K0, K1: K1 };
})(typeof window !== 'undefined' ? window : globalThis);
