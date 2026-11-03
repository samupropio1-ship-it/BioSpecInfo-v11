/* ═══════════════════════════════════════════════════════════════════════════
   bsi-fis-em.js — ⚡ elettromagnetismo in movimento
   BioSpecInfo · © Samuele Pio Provenzano

   · CARICHE NEL PIANO: cariche puntiformi da trascinare con il dito; il
     potenziale a colori con le equipotenziali e le linee di campo che si
     ridisegnano mentre ci si muove; una carica di prova che il campo spinge;
   · INDUZIONE: una calamita (dipolo) che oscilla attraverso una spira; il
     flusso Φ(t) calcolato integrando il campo del dipolo sul disco della
     spira, la forza elettromotrice ε = −dΦ/dt e il verso della corrente
     indotta (Lenz);
   · GENERATORE: una bobina che ruota in un campo uniforme, ε = NBAω sin ωt,
     il valore efficace ε₀/√2, la potenza su una resistenza;
   · ONDE ELETTROMAGNETICHE: E e B perpendicolari fra loro e alla direzione
     di propagazione, in fase; polarizzazione lineare, circolare, ellittica
     a seconda dello sfasamento fra le due componenti di E;
   · CAMPI 3D E LORENTZ (v238): linee di B di spira e solenoide (Biot-Savart)
     e di E del dipolo integrate nello spazio; una carica che le percorre con
     il metodo di Boris: elica, deriva E×B, bottiglia magnetica.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt;
  function griglia(div) { var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); G.appendChild(pan); G.appendChild(dx); div.appendChild(G); return { pan: pan, dx: dx }; }
  function nota(pan) { var n = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(n); return n; }

  /* ═══ calcoli ═══════════════════════════════════════════════════════════ */
  /* potenziale e campo di cariche puntiformi nel piano (k = 1, cariche come in 3D) */
  function potenziale(Q, x, y) { var V = 0; Q.forEach(function (q) { V += q.q / Math.max(1e-6, Math.hypot(x - q.x, y - q.y)); }); return V; }
  function campo(Q, x, y) { var E = [0, 0]; Q.forEach(function (q) { var dx = x - q.x, dy = y - q.y, r3 = Math.pow(dx * dx + dy * dy, 1.5) || 1e-12; E[0] += q.q * dx / r3; E[1] += q.q * dy / r3; }); return E; }
  /* flusso del campo di un dipolo magnetico m (asse z, in z0) attraverso una spira di raggio a nel piano z = 0.
     In forma chiusa: Φ = μ₀ m a² / (2 (a² + z0²)^(3/2)), in unita' con μ₀ = 1 */
  function flussoDipolo(m, a, z0) { return m * a * a / (2 * Math.pow(a * a + z0 * z0, 1.5)); }
  /* lo stesso flusso integrato numericamente sul disco (per controllo): Bz = m(3z² − r²)/(4π r⁵)·4π/… con μ₀/4π = 1/(4π) */
  function flussoNumerico(m, a, z0) {
    var n = 4000, s = 0;
    for (var i = 0; i < n; i++) { var rho = (i + 0.5) / n * a, R2 = rho * rho + z0 * z0, Bz = m / (4 * Math.PI) * (3 * z0 * z0 - R2) / Math.pow(R2, 2.5); s += Bz * 2 * Math.PI * rho * (a / n); }
    return s;
  }
  function generatore(N, B, A, f, R) { var w = 2 * Math.PI * f, e0 = N * B * A * w; return { e0: e0, eff: e0 / Math.SQRT2, Pmedia: e0 * e0 / (2 * R), w: w }; }
  /* v238 — campi nello spazio e moto di una carica. Unita' ridotte: μ₀I = 1 per le correnti,
     massa 1 e |q| = 1 per la particella (la pulsazione di ciclotrone e' allora ω = B).
     Spira di raggio a nel piano xy, centrata nell'origine: Biot-Savart su n tratti (punto medio) */
  /* i tratti della spira unitaria si calcolano una volta per ogni n (seni e coseni in tabella:
     le linee di campo di un solenoide chiedono il campo centinaia di migliaia di volte) */
  var TRATTI = {};
  function tratti(N) {
    if (TRATTI[N]) return TRATTI[N];
    var c = new Float64Array(4 * N);
    for (var i = 0; i < N; i++) { var f0 = 2 * Math.PI * i / N, f1 = 2 * Math.PI * (i + 1) / N, fm = (f0 + f1) / 2; c[4 * i] = Math.cos(fm); c[4 * i + 1] = Math.sin(fm); c[4 * i + 2] = Math.cos(f1) - Math.cos(f0); c[4 * i + 3] = Math.sin(f1) - Math.sin(f0); }
    return (TRATTI[N] = c);
  }
  function campoSpira3D(a, x, y, z, n, z0) {
    var N = n || 64, c = tratti(N), zz = z - (z0 || 0), b0 = 0, b1 = 0, b2 = 0;
    for (var i = 0; i < N; i++) {
      var k = 4 * i, dl0 = a * c[k + 2], dl1 = a * c[k + 3], r0 = x - a * c[k], r1 = y - a * c[k + 1], r2 = r0 * r0 + r1 * r1 + zz * zz, r3 = r2 * Math.sqrt(r2) || 1e-12;
      b0 += dl1 * zz / r3; b1 -= dl0 * zz / r3; b2 += (dl0 * r1 - dl1 * r0) / r3;
    }
    return [b0 / (4 * Math.PI), b1 / (4 * Math.PI), b2 / (4 * Math.PI)];
  }
  /* sull'asse, in forma chiusa: B_z = a² / (2 (a² + z²)^(3/2)) */
  function bAsse(a, z) { return a * a / (2 * Math.pow(a * a + z * z, 1.5)); }
  /* solenoide: nSp spire di raggio a distribuite su una lunghezza Lz centrata nell'origine */
  function campoSolenoide(a, Lz, nSp, x, y, z, n) {
    var B = [0, 0, 0];
    for (var k = 0; k < nSp; k++) { var b = campoSpira3D(a, x, y, z, n || 40, -Lz / 2 + Lz * (k + 0.5) / nSp); B[0] += b[0]; B[1] += b[1]; B[2] += b[2]; }
    return B;
  }
  /* campo elettrico di cariche puntiformi [q, x, y, z] (k = 1) */
  function campoCariche(Q, x, y, z) { var E = [0, 0, 0]; Q.forEach(function (c) { var dx = x - c[1], dy = y - c[2], dz = z - c[3], r3 = Math.pow(dx * dx + dy * dy + dz * dz, 1.5) || 1e-12; E[0] += c[0] * dx / r3; E[1] += c[0] * dy / r3; E[2] += c[0] * dz / r3; }); return E; }
  /* una linea di campo: passo del punto medio lungo la direzione del campo, finche' stop(p) */
  function lineaCampo3D(f, p0, verso, stop, passi, h) {
    var p = p0.slice(), pts = [p.slice()]; h = h || 0.04;
    for (var i = 0; i < (passi || 800); i++) {
      var E = f(p[0], p[1], p[2]), m = Math.hypot(E[0], E[1], E[2]); if (!(m > 0) || !isFinite(m)) break;
      var c = [p[0] + verso * E[0] / m * h / 2, p[1] + verso * E[1] / m * h / 2, p[2] + verso * E[2] / m * h / 2], E2 = f(c[0], c[1], c[2]), m2 = Math.hypot(E2[0], E2[1], E2[2]); if (!(m2 > 0)) break;
      p = [p[0] + verso * E2[0] / m2 * h, p[1] + verso * E2[1] / m2 * h, p[2] + verso * E2[2] / m2 * h]; pts.push(p.slice());
      if (stop(p, i)) break;
    }
    return pts;
  }
  /* passo di Boris (massa 1, carica q): la rotazione magnetica conserva |v| esattamente */
  function passoBoris(s, q, E, B, dt) {
    var h = q * dt / 2, v = s.v, vm = [v[0] + h * E[0], v[1] + h * E[1], v[2] + h * E[2]], tq = [h * B[0], h * B[1], h * B[2]], t2 = tq[0] * tq[0] + tq[1] * tq[1] + tq[2] * tq[2], sq = [2 * tq[0] / (1 + t2), 2 * tq[1] / (1 + t2), 2 * tq[2] / (1 + t2)];
    var vp = [vm[0] + vm[1] * tq[2] - vm[2] * tq[1], vm[1] + vm[2] * tq[0] - vm[0] * tq[2], vm[2] + vm[0] * tq[1] - vm[1] * tq[0]];
    var vn = [vm[0] + vp[1] * sq[2] - vp[2] * sq[1], vm[1] + vp[2] * sq[0] - vp[0] * sq[2], vm[2] + vp[0] * sq[1] - vp[1] * sq[0]];
    s.v = [vn[0] + h * E[0], vn[1] + h * E[1], vn[2] + h * E[2]];
    s.x = [s.x[0] + s.v[0] * dt, s.x[1] + s.v[1] * dt, s.x[2] + s.v[2] * dt];
    return s;
  }
  /* bottiglia magnetica: partendo dove il campo vale B₀ con angolo di passo α, la carica torna
     indietro prima di arrivare dove il campo vale B_max se sin²α > B₀/B_max (μ = mv⊥²/2B costante) */
  function angoloSpecchio(B0, Bmax) { return Math.asin(Math.sqrt(Math.min(1, B0 / Bmax))) * 180 / Math.PI; }
  F.calcolo.em = { potenziale: potenziale, campo: campo, flussoDipolo: flussoDipolo, flussoNumerico: flussoNumerico, generatore: generatore,
    campoSpira3D: campoSpira3D, bAsse: bAsse, campoSolenoide: campoSolenoide, campoCariche: campoCariche, lineaCampo3D: lineaCampo3D, passoBoris: passoBoris, angoloSpecchio: angoloSpecchio };

  /* ═══ 1. cariche nel piano ══════════════════════════════════════════════ */
  function schedaCariche(div) {
    var G = griglia(div), Q = [{ q: 1, x: -1.2, y: 0 }, { q: -1, x: 1.2, y: 0 }], info = nota(G.pan), prova = { x: -0.5, y: 1.2, vx: 0, vy: 0 }, sfondo = null;
    F.scelta(G.pan, ['Configurazione', 'Configuration'], [['dip', t('dipolo', 'dipole')], ['ug', t('due cariche uguali', 'two equal charges')], ['tre', t('tre cariche', 'three charges')], ['quad', t('quadrupolo', 'quadrupole')]], 'dip', function (v) {
      Q = v === 'dip' ? [{ q: 1, x: -1.2, y: 0 }, { q: -1, x: 1.2, y: 0 }] : v === 'ug' ? [{ q: 1, x: -1.2, y: 0 }, { q: 1, x: 1.2, y: 0 }] : v === 'tre' ? [{ q: 2, x: 0, y: 0.8 }, { q: -1, x: -1.2, y: -0.6 }, { q: -1, x: 1.2, y: -0.6 }] : [{ q: 1, x: -1, y: -1 }, { q: -1, x: 1, y: -1 }, { q: 1, x: 1, y: 1 }, { q: -1, x: -1, y: 1 }];
      sfondo = null; prova = { x: -0.5, y: 1.2, vx: 0, vy: 0 }; ctl.sveglia();
    });
    F.bottone(G.pan, ['Rilascia la carica di prova', 'Release the test charge'], function () { prova = { x: -0.5, y: 1.2, vx: 0, vy: 0 }; ctl.sveglia(); });
    G.pan.appendChild(info);
    info.innerHTML = t('Trascina le cariche con il dito o il mouse. Colori: potenziale (rosso positivo, azzurro negativo); linee chiare: equipotenziali; linee gialle: campo, sempre perpendicolari alle equipotenziali. La carica di prova (bianca, positiva) viene spinta dal campo e lascia la sua traiettoria.', 'Drag the charges with a finger or the mouse. Colours: potential (red positive, blue negative); light lines: equipotentials; yellow lines: field, always perpendicular to the equipotentials. The (white, positive) test charge is pushed by the field and leaves its trajectory.');
    var cv = F.tela(G.dx, 0.72), scia = [], L = 3, presa = null;
    function mondo(e) { var r = cv.getBoundingClientRect(), Ly = L * r.height / r.width; return [(e.clientX - r.left) / r.width * 2 * L - L, Ly - (e.clientY - r.top) / r.height * 2 * Ly]; }
    cv.addEventListener('pointerdown', function (e) { var p = mondo(e); presa = Q.filter(function (q) { return Math.hypot(q.x - p[0], q.y - p[1]) < 0.35; })[0] || null; if (presa) { try { cv.setPointerCapture(e.pointerId); } catch (er) { } ctl.sveglia(); } });
    cv.addEventListener('pointermove', function (e) { if (!presa) return; var p = mondo(e); presa.x = p[0]; presa.y = p[1]; sfondo = null; scia = []; ctl.sveglia(); });
    cv.addEventListener('pointerup', function () { presa = null; });
    cv.style.touchAction = 'none';
    var ctl = F.anima(cv, function (dt) {
      var P = F.pennello(cv), q = P.q, W = P.W, H = P.H, Ly = L * H / W, X = function (x) { return (x + L) / (2 * L) * W; }, Y = function (y) { return (Ly - y) / (2 * Ly) * H; };
      /* sfondo del potenziale, ricalcolato solo quando le cariche si muovono */
      if (!sfondo || sfondo.W !== W) {
        var n = 90, m = Math.round(n * H / W), img = q.createImageData(n, m), d = img.data, Vs = [];
        for (var j = 0; j < m; j++) for (var i = 0; i < n; i++) { var x = -L + 2 * L * (i + 0.5) / n, y = Ly - 2 * Ly * (j + 0.5) / m, V = potenziale(Q, x, y); Vs.push(V); var u = Math.max(-1, Math.min(1, V / 2)), k = 4 * (j * n + i), a = Math.abs(u) * 0.55, c = u > 0 ? [255, 138, 128] : [107, 207, 255]; d[k] = 8 + (c[0] - 8) * a; d[k + 1] = 21 + (c[1] - 21) * a; d[k + 2] = 34 + (c[2] - 34) * a; d[k + 3] = 255; }
        var off = document.createElement('canvas'); off.width = n; off.height = m; off.getContext('2d').putImageData(img, 0, 0);
        sfondo = { W: W, off: off, Vs: Vs, n: n, m: m };
      }
      q.imageSmoothingEnabled = true; q.drawImage(sfondo.off, 0, 0, W, H);
      /* equipotenziali: quadrati in marcia sulla griglia dello sfondo */
      q.strokeStyle = 'rgba(230,255,251,.35)'; q.beginPath();
      [-2, -1, -0.5, -0.25, 0, 0.25, 0.5, 1, 2].forEach(function (lv) {
        for (var j = 0; j < sfondo.m - 1; j++) for (var i = 0; i < sfondo.n - 1; i++) {
          var v = [sfondo.Vs[j * sfondo.n + i], sfondo.Vs[j * sfondo.n + i + 1], sfondo.Vs[(j + 1) * sfondo.n + i + 1], sfondo.Vs[(j + 1) * sfondo.n + i]], cc = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]], tg = [];
          for (var s = 0; s < 4; s++) { var a = v[s], b = v[(s + 1) % 4]; if ((a - lv) * (b - lv) < 0) { var f = (lv - a) / (b - a), A = cc[s], B = cc[(s + 1) % 4]; tg.push([(A[0] + (B[0] - A[0]) * f + 0.5) / sfondo.n * W, (A[1] + (B[1] - A[1]) * f + 0.5) / sfondo.m * H]); } }
          if (tg.length >= 2) { q.moveTo(tg[0][0], tg[0][1]); q.lineTo(tg[1][0], tg[1][1]); }
        }
      });
      q.stroke();
      /* linee di campo dalle cariche positive */
      q.strokeStyle = 'rgba(255,210,74,.75)';
      Q.forEach(function (c) { if (c.q <= 0) return; var nl = 12 * c.q; for (var k = 0; k < nl; k++) { var an = 2 * Math.PI * (k + 0.5) / nl, x = c.x + 0.12 * Math.cos(an), y = c.y + 0.12 * Math.sin(an); q.beginPath(); q.moveTo(X(x), Y(y)); for (var st2 = 0; st2 < 400; st2++) { var E = campo(Q, x, y), mE = Math.hypot(E[0], E[1]); if (!(mE > 0)) break; x += E[0] / mE * 0.03; y += E[1] / mE * 0.03; q.lineTo(X(x), Y(y)); if (Math.abs(x) > L * 1.05 || Math.abs(y) > Ly * 1.05 || Q.some(function (o) { return o.q < 0 && Math.hypot(o.x - x, o.y - y) < 0.1; })) break; } q.stroke(); } });
      /* carica di prova (massa 1, carica +0,05): punto medio */
      for (var sub = 0; sub < 4; sub++) { var h = dt / 4, E1 = campo(Q, prova.x, prova.y), mx = prova.x + prova.vx * h / 2, my = prova.y + prova.vy * h / 2, vx = prova.vx + 0.5 * E1[0] * h / 2, vy = prova.vy + 0.5 * E1[1] * h / 2, E2 = campo(Q, mx, my); prova.vx += 0.5 * E2[0] * h; prova.vy += 0.5 * E2[1] * h; prova.x += vx * h; prova.y += vy * h; }
      var vicina = Q.some(function (o) { return Math.hypot(o.x - prova.x, o.y - prova.y) < 0.12; });
      if (Math.abs(prova.x) < L * 1.2 && Math.abs(prova.y) < Ly * 1.2 && !vicina) scia.push([prova.x, prova.y]); if (scia.length > 600) scia.shift();
      q.strokeStyle = 'rgba(255,255,255,.7)'; q.beginPath(); scia.forEach(function (p, i) { if (i) q.lineTo(X(p[0]), Y(p[1])); else q.moveTo(X(p[0]), Y(p[1])); }); q.stroke();
      if (!vicina) { q.fillStyle = '#fff'; q.beginPath(); q.arc(X(prova.x), Y(prova.y), 4, 0, Math.PI * 2); q.fill(); }
      Q.forEach(function (c) { q.fillStyle = c.q > 0 ? '#ff6b6b' : '#6bcfff'; q.beginPath(); q.arc(X(c.x), Y(c.y), 11, 0, Math.PI * 2); q.fill(); q.fillStyle = '#081522'; q.font = 'bold 13px system-ui'; q.textAlign = 'center'; q.fillText(c.q > 0 ? '+' : '−', X(c.x), Y(c.y) + 4); q.textAlign = 'left'; });
      cv.setAttribute('aria-label', t('cariche, equipotenziali e linee di campo', 'charges, equipotentials and field lines'));
    });
  }

  /* ═══ 2. induzione ══════════════════════════════════════════════════════ */
  function schedaInduzione(div) {
    var G = griglia(div), st = { A: 3, f: 0.5, m: 1, a: 1, N: 1 }, info = nota(G.pan), tt = 0, storia = { t: [], phi: [], e: [] };
    F.cursore(G.pan, ['ampiezza del moto della calamita', 'magnet motion amplitude'], 0.5, 5, 0.1, st.A, function (v) { st.A = v; azzera(); }, function (v) { return v.toFixed(1); });
    F.cursore(G.pan, ['frequenza (Hz)', 'frequency (Hz)'], 0.1, 2, 0.05, st.f, function (v) { st.f = v; azzera(); }, function (v) { return v.toFixed(2); });
    F.cursore(G.pan, ['spire N', 'turns N'], 1, 50, 1, st.N, function (v) { st.N = v; azzera(); });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.45), cg = F.tela(G.dx, 0.42);
    function azzera() { tt = 0; storia = { t: [], phi: [], e: [] }; }
    F.anima(cv, function (dt) {
      tt += dt; var z = st.A * Math.cos(2 * Math.PI * st.f * tt), vz = -2 * Math.PI * st.f * st.A * Math.sin(2 * Math.PI * st.f * tt);
      /* ε = −N dΦ/dt = −N dΦ/dz · dz/dt, con dΦ/dz analitica */
      var phi = st.N * flussoDipolo(st.m, st.a, z), dphidz = st.N * st.m * st.a * st.a / 2 * (-1.5) * Math.pow(st.a * st.a + z * z, -2.5) * 2 * z, eps = -dphidz * vz;
      storia.t.push(tt); storia.phi.push(phi); storia.e.push(eps); if (storia.t.length > 600) { storia.t.shift(); storia.phi.shift(); storia.e.shift(); }
      var P = F.pennello(cv), q = P.q, W = P.W, H = P.H, cx = W / 2, cy = H / 2, sc = W / 14;
      /* la spira vista di taglio (ellisse) e la calamita che passa */
      var luce = Math.min(1, Math.abs(eps) / (st.N * 1.5 * 2 * Math.PI * st.f * st.A * 0.25 + 1e-9));
      q.strokeStyle = 'rgba(217,137,91,' + (0.6 + 0.4 * luce) + ')'; q.lineWidth = 4; q.beginPath(); q.ellipse(cx, cy, 10, st.a * sc * 1.4, 0, 0, Math.PI * 2); q.stroke(); q.lineWidth = 1;
      var xm = cx + z * sc; q.fillStyle = '#ff6b6b'; q.fillRect(xm, cy - 14, 34, 28); q.fillStyle = '#6bcfff'; q.fillRect(xm - 34, cy - 14, 34, 28);
      q.fillStyle = '#081522'; q.font = 'bold 13px system-ui'; q.textAlign = 'center'; q.fillText('N', xm + 17, cy + 5); q.fillText('S', xm - 17, cy + 5); q.textAlign = 'left';
      /* lampadina e verso della corrente */
      q.fillStyle = 'rgba(255,210,74,' + luce + ')'; q.beginPath(); q.arc(W - 40, 40, 16, 0, Math.PI * 2); q.fill(); q.strokeStyle = '#c9d3df'; q.stroke();
      q.fillStyle = '#c9d3df'; q.font = '12px system-ui'; q.fillText('ε = ' + eps.toFixed(3), 10, 18); q.fillText(eps > 0.001 ? t('corrente ↻', 'current ↻') : eps < -0.001 ? t('corrente ↺', 'current ↺') : '', 10, 34);
      cv.setAttribute('aria-label', t('calamita che oscilla attraverso una spira', 'magnet oscillating through a loop'));
      F.grafico(cg, { serie: [{ x: storia.t, y: storia.phi, col: '#5eead4', larg: 2, etich: 'Φ' }, { x: storia.t, y: storia.e, col: '#ffd24a', larg: 2, etich: 'ε' }], xl: ['t (s)', 't (s)'], yl: ['flusso e f.e.m.', 'flux and emf'], legenda: [{ col: '#5eead4', etich: 'Φ (N·B·A)' }, { col: '#ffd24a', etich: 'ε = −dΦ/dt' }] });
      info.innerHTML = t('Flusso del dipolo attraverso la spira ', 'Dipole flux through the loop ') + 'Φ(z) = N μ₀ m a² / (2(a² + z²)^(3/2)) · ' + t('massimo al centro ', 'maximum at the centre ') + fmt(st.N * flussoDipolo(st.m, st.a, 0)) + '<br>' + t('La f.e.m. è nulla quando la calamita è ferma (agli estremi) e anche quando passa al centro, dove il flusso è massimo ma non cambia: conta la VARIAZIONE del flusso. Raddoppiando la frequenza raddoppia ε (legge di Faraday); il verso della corrente si oppone alla variazione (Lenz).', 'The emf is zero when the magnet is at rest (at the ends) and also when it passes the centre, where the flux is maximum but not changing: what counts is the CHANGE of flux. Doubling the frequency doubles ε (Faraday’s law); the current’s direction opposes the change (Lenz).');
    }, { ricomincia: azzera });
  }

  /* ═══ 3. generatore ═════════════════════════════════════════════════════ */
  function schedaGeneratore(div) {
    var G = griglia(div), st = { N: 100, B: 0.2, A: 0.01, f: 50, R: 100 }, info = nota(G.pan), tt = 0, Gn;
    F.cursore(G.pan, ['spire N', 'turns N'], 1, 500, 1, st.N, function (v) { st.N = v; calcola(); });
    F.cursore(G.pan, ['B (T)', 'B (T)'], 0.01, 1, 0.01, st.B, function (v) { st.B = v; calcola(); }, function (v) { return v.toFixed(2); });
    F.cursore(G.pan, ['area della bobina (cm²)', 'coil area (cm²)'], 1, 400, 1, st.A * 1e4, function (v) { st.A = v / 1e4; calcola(); });
    F.cursore(G.pan, ['frequenza (Hz)', 'frequency (Hz)'], 1, 60, 1, st.f, function (v) { st.f = v; calcola(); });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.5);
    function calcola() { Gn = generatore(st.N, st.B, st.A, st.f, st.R); info.innerHTML = 'ε(t) = NBAω sin ωt · ε₀ = <b class="bsiFX-num">' + fmt(Gn.e0) + ' V</b> · ' + t('efficace ', 'RMS ') + 'ε₀/√2 = <b class="bsiFX-num">' + fmt(Gn.eff) + ' V</b><br>' + t('Su ', 'On ') + st.R + ' Ω: ' + t('potenza media ', 'average power ') + 'ε₀²/(2R) = ' + fmt(Gn.Pmedia) + ' W<br>' + t('La rete elettrica: 50 Hz e 230 V efficaci, cioè 325 V di picco. Il disegno ruota lentamente (1 giro ogni 2 s) per poterlo seguire; i numeri sono quelli della frequenza scelta.', 'The mains: 50 Hz and 230 V RMS, i.e. 325 V peak. The drawing turns slowly (one turn every 2 s) to be followed; the numbers are those of the chosen frequency.'); }
    calcola();
    F.anima(cv, function (dt) {
      tt += dt; var th = Math.PI * tt, P = F.pennello(cv), q = P.q, W = P.W, H = P.H, cx = W * 0.25, cy = H / 2, R = H * 0.32;
      q.strokeStyle = 'rgba(132,148,168,.4)'; for (var k = -3; k <= 3; k++) { q.beginPath(); q.moveTo(cx - R * 1.4, cy + k * R * 0.3); q.lineTo(cx + R * 1.4, cy + k * R * 0.3); q.stroke(); }
      q.fillStyle = '#9fb1c6'; q.font = '11px system-ui'; q.fillText('B →', cx + R * 1.1, cy - R - 6);
      var w = Math.abs(Math.cos(th)) * R; q.strokeStyle = '#d9895b'; q.lineWidth = 3; q.strokeRect(cx - w, cy - R, 2 * w, 2 * R); q.lineWidth = 1;
      var x0 = W * 0.5, Wd = W * 0.47; q.strokeStyle = '#1d2f49'; q.beginPath(); q.moveTo(x0, cy); q.lineTo(x0 + Wd, cy); q.stroke();
      q.strokeStyle = '#ffd24a'; q.lineWidth = 2; q.beginPath(); for (var i = 0; i <= 200; i++) { var a = th - 4 * Math.PI * (1 - i / 200), y = cy - Math.sin(a) * R; if (i) q.lineTo(x0 + Wd * i / 200, y); else q.moveTo(x0, y); } q.stroke(); q.lineWidth = 1;
      q.fillStyle = '#ffd24a'; q.beginPath(); q.arc(x0 + Wd, cy - Math.sin(th) * R, 4, 0, Math.PI * 2); q.fill();
      q.fillStyle = '#c9d3df'; q.fillText('ε(t)', x0 + 4, cy - R - 4);
      cv.setAttribute('aria-label', t('bobina che ruota in un campo magnetico', 'coil rotating in a magnetic field'));
    });
  }

  /* ═══ 4. onde elettromagnetiche ═════════════════════════════════════════ */
  function schedaOnde(div) {
    var G = griglia(div), st = { pol: 'lin', fase: 90, rapp: 1 }, info = nota(G.pan), tt = 0;
    F.scelta(G.pan, ['Polarizzazione', 'Polarisation'], [['lin', t('lineare', 'linear')], ['circ', t('circolare', 'circular')], ['ell', t('ellittica', 'elliptical')]], st.pol, function (v) { st.pol = v; st.fase = v === 'lin' ? 0 : 90; st.rapp = v === 'ell' ? 0.5 : 1; testo(); });
    G.pan.appendChild(info);
    function testo() { info.innerHTML = (st.pol === 'lin' ? t('Lineare: E oscilla sempre nello stesso piano. ', 'Linear: E always oscillates in the same plane. ') : st.pol === 'circ' ? t('Circolare: due componenti uguali sfasate di 90°; la punta di E descrive un’elica, vista di fronte un cerchio. ', 'Circular: two equal components 90° out of phase; the tip of E traces a helix, a circle seen head-on. ') : t('Ellittica: componenti diverse o sfasate di un angolo qualsiasi. ', 'Elliptical: unequal components or any phase difference. ')) + t('E (giallo) e B (azzurro) sono perpendicolari fra loro e alla direzione di propagazione, in fase, con |B| = |E|/c. Un polarizzatore lascia passare solo la componente lungo il suo asse: è il principio del polarimetro che misura il potere rotatorio delle sostanze chirali.', 'E (yellow) and B (blue) are perpendicular to each other and to the propagation direction, in phase, with |B| = |E|/c. A polariser passes only the component along its axis: the principle of the polarimeter measuring the optical rotation of chiral substances.'); }
    testo();
    var cv = F.tela(G.dx, 0.55);
    F.anima(cv, function (dt) {
      tt += dt; var P = F.pennello(cv), q = P.q, W = P.W, H = P.H, cy = H / 2, x0 = 30, L = W - 60, A = H * 0.3;
      /* proiezione obliqua: x lungo la propagazione, y verticale, z verso l'osservatore inclinato */
      function proj(x, y, z) { return [x0 + x * L + z * 0.45, cy - y + z * 0.3]; }
      q.strokeStyle = '#34465f'; q.beginPath(); var a = proj(0, 0, 0), b = proj(1, 0, 0); q.moveTo(a[0], a[1]); q.lineTo(b[0], b[1]); q.stroke();
      var fase = st.fase * Math.PI / 180;
      function Ey(x) { return A * Math.cos(2 * Math.PI * (3 * x - 0.5 * tt)); }
      function Ez(x) { return st.pol === 'lin' ? 0 : st.rapp * A * Math.cos(2 * Math.PI * (3 * x - 0.5 * tt) - fase); }
      /* E = (E_y, E_z); B = x̂ × E / c = (−E_z, E_y), disegnato un po' piu' corto */
      var CAMPI = [['#ffd24a', 'rgba(255,210,74,.35)', function (x) { return [Ey(x), Ez(x)]; }], ['#6bcfff', 'rgba(107,207,255,.35)', function (x) { return [-Ez(x) * 0.7, Ey(x) * 0.7]; }]];
      CAMPI.forEach(function (C) {
        q.strokeStyle = C[0]; q.lineWidth = 2; q.beginPath();
        for (var i = 0; i <= 300; i++) { var x = i / 300, v = C[2](x), p = proj(x, v[0], v[1]); if (i) q.lineTo(p[0], p[1]); else q.moveTo(p[0], p[1]); }
        q.stroke(); q.lineWidth = 1; q.strokeStyle = C[1];
        for (i = 0; i <= 30; i++) { var x2 = i / 30, v2 = C[2](x2), base = proj(x2, 0, 0), tip = proj(x2, v2[0], v2[1]); q.beginPath(); q.moveTo(base[0], base[1]); q.lineTo(tip[0], tip[1]); q.stroke(); }
      });
      q.fillStyle = '#ffd24a'; q.font = '12px system-ui'; q.fillText('E', 10, 18); q.fillStyle = '#6bcfff'; q.fillText('B', 26, 18); q.fillStyle = '#9fb1c6'; q.fillText(t('propagazione →', 'propagation →'), W - 120, H - 8);
      cv.setAttribute('aria-label', t('onda elettromagnetica con i campi E e B', 'electromagnetic wave with E and B fields'));
    });
  }

  /* ═══ la scheda 3D (v238) ═══════════════════════════════════════════════
     Il pannello compare subito; la scena quando three.js e' pronto, costruita in un
     compito separato, cosi' il clic sulla scheda resta leggero. Nella barra della vista
     un tasto ferma e riavvia il moto; con «riduci movimento» la scena parte ferma. */
  function scheda3D(costruisci) {
    return function (div) {
      var g3 = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), destra = F.el('div', { style: 'min-width:0' });
      g3.appendChild(pan); g3.appendChild(destra); div.appendChild(g3);
      var L3 = globale.BSILab3D, attesa = F.el('div', { 'class': 'bsiFX-nota', testo: t('Caricamento del motore 3D…', 'Loading the 3D engine…') });
      destra.appendChild(attesa);
      var ctx = costruisci(pan, destra);
      if (!L3) { attesa.textContent = t('Il motore 3D non è disponibile in questa pagina.', 'The 3D engine is not available on this page.'); return; }
      L3.stile();
      L3.caricaThree().then(function () {
        attesa.remove();
        var S = new L3.Scena(destra, 0.66);
        var adatta = S.adatta; S.adatta = function () { if (this.box.offsetParent === null) return; adatta.call(this); };
        destra.insertBefore(S.box, destra.firstChild);
        S.box.setAttribute('role', 'group'); S.box.setAttribute('aria-label', F.tt(ctx.etichetta)); S.ren.domElement.setAttribute('aria-label', F.tt(ctx.etichetta));
        tastoPausa(S);
        div._scena = S;
        setTimeout(function () { ctx.tre(S, globale.THREE, L3); }, 0);
      }).catch(function (e) { attesa.textContent = t('Motore 3D non disponibile: ', '3D engine unavailable: ') + e.message; });
    };
  }
  function tastoPausa(S) {
    var MENO = false; try { MENO = !!(globale.matchMedia && globale.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { }
    S.fermo = MENO;
    var barra = S.box.querySelector('.bsi3d-barra'); if (!barra) return;
    var b = F.el('button', { type: 'button' });
    function aggiorna() { b.textContent = S.fermo ? '▶' : '❚❚'; var n = S.fermo ? t('Avvia il moto', 'Play the motion') : t('Ferma il moto', 'Pause the motion'); b.title = n; b.setAttribute('aria-label', n); b.setAttribute('aria-pressed', String(S.fermo)); }
    b.addEventListener('click', function (e) { e.stopPropagation(); S.fermo = !S.fermo; aggiorna(); if (!S.fermo) S.avvia(); });
    aggiorna(); barra.insertBefore(b, barra.firstChild);
  }
  function svuota(gr) {
    while (gr.children.length) { var o = gr.children.pop(); o.traverse(function (x) { if (x.geometry) x.geometry.dispose(); if (x.material) (Array.isArray(x.material) ? x.material : [x.material]).forEach(function (m) { if (m.map) m.map.dispose(); m.dispose(); }); }); }
  }
  function puntaFreccia(T, fr, p, d) {
    var L = Math.hypot(d[0], d[1], d[2]); fr.visible = L > 0.03; if (!fr.visible) return;
    fr.position.set(p[0], p[1], p[2]); fr.setDirection(new T.Vector3(d[0] / L, d[1] / L, d[2] / L));
    var h = Math.min(0.25, L * 0.4); fr.setLength(L, h, h * 0.6);
  }

  /* ═══ 5. campi nello spazio e forza di Lorentz (v238) ═══════════════════ */
  var SORG3D = [
    ['uniforme', ['Campo B uniforme: l’elica', 'Uniform B field: the helix']],
    ['incrociati', ['E ⊥ B: la deriva E×B', 'E ⊥ B: the E×B drift']],
    ['spira', ['Spira: bottiglia magnetica', 'Current loop: magnetic mirror']],
    ['solenoide', ['Solenoide', 'Solenoid']],
    ['dipolo', ['Dipolo elettrico (solo E)', 'Electric dipole (E only)']]
  ];
  var A_SPIRA = 1.5, A_SOL = 1, L_SOL = 4, N_SOL = 6, Z_SPIRA = -2.5, DIPOLO = [[1, -1, 0, 0], [-1, 1, 0, 0]];
  var B_SOL = campoSolenoide(A_SOL, L_SOL, N_SOL, 0, 0, 0, 24)[2];
  function schedaCampi3D(pan) {
    var st = { s: 'spira', B: 2, v: 0.25, alfa: 35, q: 1 }, cb = {}, cur = {};
    /* valori di partenza adatti a ogni sorgente (nella bottiglia la carica deve girare stretta: r_L ≪ a) */
    var CONSIGLIATI = { uniforme: { B: 1, v: 1, alfa: 60 }, incrociati: { B: 1, v: 0.8, alfa: 80 }, spira: { B: 2, v: 0.25, alfa: 35 }, solenoide: { B: 1.2, v: 0.6, alfa: 60 }, dipolo: { B: 1, v: 0.6, alfa: 30 } };
    F.scelta(pan, ['Sorgente', 'Source'], SORG3D.map(function (s) { return [s[0], s[1]]; }), st.s, function (v) {
      st.s = v; var c = CONSIGLIATI[v];
      Object.keys(c).forEach(function (k) { st[k] = c[k]; cur[k].value = c[k]; var b = cur[k].parentNode.querySelector('b'); if (b) b.textContent = k === 'alfa' ? String(c[k]) : c[k].toFixed(2); });
      nuovo(true);
    });
    cur.B = F.cursore(pan, ['intensità B₀ (o E per il dipolo)', 'strength B₀ (or E for the dipole)'], 0.3, 2, 0.05, st.B, function (v) { st.B = v; nuovo(false); }, function (v) { return v.toFixed(2); });
    cur.v = F.cursore(pan, ['velocità della carica v', 'charge speed v'], 0.1, 2, 0.05, st.v, function (v) { st.v = v; nuovo(false); }, function (v) { return v.toFixed(2); });
    cur.alfa = F.cursore(pan, ['angolo di passo α fra v e B (°)', 'pitch angle α between v and B (°)'], 2, 88, 1, st.alfa, function (v) { st.alfa = v; nuovo(false); });
    F.scelta(pan, ['Carica', 'Charge'], [['1', t('positiva (q = +1)', 'positive (q = +1)')], ['-1', t('negativa (q = −1)', 'negative (q = −1)')]], '1', function (v) { st.q = +v; nuovo(false); });
    var info = nota(pan), vivo = nota(pan), spiega = nota(pan);
    spiega.innerHTML = t('Le linee di campo (azzurre per B, arancio per E) sono integrate passo per passo dalla legge di Biot-Savart (spira e solenoide divisi in tratti) o da Coulomb. La carica si muove con la forza di Lorentz F = q(E + v × B), integrata con il metodo di Boris, che conserva esattamente |v| in un campo solo magnetico: la forza magnetica è sempre perpendicolare alla velocità e non compie lavoro. Freccia gialla: v; freccia rosa: F. Unità ridotte: massa 1, |q| = 1, μ₀I = 1.',
      'Field lines (blue for B, orange for E) are integrated step by step from the Biot-Savart law (loop and solenoid split into segments) or from Coulomb’s law. The charge moves under the Lorentz force F = q(E + v × B), integrated with the Boris method, which keeps |v| exactly constant in a purely magnetic field: the magnetic force is always perpendicular to the velocity and does no work. Yellow arrow: v; pink arrow: F. Reduced units: mass 1, |q| = 1, μ₀I = 1.');
    /* i campi nel punto p per la sorgente scelta */
    function campi(p) {
      var B0 = st.B, Z = [0, 0, 0];
      if (st.s === 'uniforme') return { E: Z, B: [0, 0, B0] };
      if (st.s === 'incrociati') return { E: [0.5 * B0, 0, 0], B: [0, 0, B0] };
      if (st.s === 'spira') { var b = campoSpira3D(A_SPIRA, p[0], p[1], p[2], 48), f = B0 / bAsse(A_SPIRA, 0); return { E: Z, B: [b[0] * f, b[1] * f, b[2] * f] }; }
      if (st.s === 'solenoide') { var c = campoSolenoide(A_SOL, L_SOL, N_SOL, p[0], p[1], p[2], 24), h = B0 / B_SOL; return { E: Z, B: [c[0] * h, c[1] * h, c[2] * h] }; }
      var e = campoCariche(DIPOLO, p[0], p[1], p[2]); return { E: [e[0] * B0, e[1] * B0, e[2] * B0], B: Z };
    }
    var part, tSim, riflessa, zmax;
    function partenza() {
      var a = st.alfa * Math.PI / 180, vp = st.v * Math.sin(a), vl = st.v * Math.cos(a), rL = vp / st.B;
      if (st.s === 'uniforme' || st.s === 'solenoide') part = { x: [-st.q * rL, 0, st.s === 'uniforme' ? -3.5 : -1.9], v: [0, vp, vl] };
      else if (st.s === 'incrociati') part = { x: [0, 3, -3], v: [0, vp, vl * 0.25] };
      else if (st.s === 'spira') part = { x: [-st.q * vp / (st.B * bAsse(A_SPIRA, Z_SPIRA) / bAsse(A_SPIRA, 0)), 0, Z_SPIRA], v: [0, vp, vl] };
      else part = { x: [0, 1.6, 0.3], v: [vl, 0, vp] };
      tSim = 0; riflessa = false; zmax = part.x[2]; part.v0 = st.v;
    }
    function nuovo(linee) {
      partenza();
      var a = st.alfa * Math.PI / 180, vp = st.v * Math.sin(a), vl = st.v * Math.cos(a), Tc = 2 * Math.PI / st.B, testo;
      if (st.s === 'uniforme' || st.s === 'solenoide') testo = t('Raggio di Larmor ', 'Larmor radius ') + 'r = mv⊥/(|q|B) = <b class="bsiFX-num">' + fmt(vp / st.B) + '</b> · ' + t('periodo ', 'period ') + 'T = 2πm/(|q|B) = <b class="bsiFX-num">' + fmt(Tc) + '</b> · ' + t('passo dell’elica ', 'helix pitch ') + 'v∥T = <b class="bsiFX-num">' + fmt(vl * Tc) + '</b>' + (st.s === 'solenoide' ? '<br>' + t('Dentro il solenoide il campo è quasi uniforme (B = μ₀nI); alle estremità le linee si aprono e l’elica si allarga.', 'Inside the solenoid the field is nearly uniform (B = μ₀nI); at the ends the lines open out and the helix widens.') : '');
      else if (st.s === 'incrociati') testo = t('Velocità di deriva ', 'Drift velocity ') + 'v_d = E × B / B² = <b class="bsiFX-num">' + fmt(0.5) + '</b> ' + t('lungo −y, la stessa per cariche positive e negative e per qualsiasi massa: è il moto del plasma nella magnetosfera e nei tokamak. La traiettoria è una cicloide (o un’elica che deriva).', 'along −y, the same for positive and negative charges and any mass: the motion of plasma in the magnetosphere and in tokamaks. The path is a cycloid (or a drifting helix).');
      else if (st.s === 'spira') { var r0 = bAsse(A_SPIRA, Z_SPIRA) / bAsse(A_SPIRA, 0), ac = angoloSpecchio(r0, 1); testo = t('Il campo sulla partenza è ', 'The field at the start is ') + fmt(r0) + ' B_max. ' + t('Si conserva il momento magnetico μ = mv⊥²/2B: la carica torna indietro se sin²α > B/B_max, cioè per α > ', 'The magnetic moment μ = mv⊥²/2B is conserved: the charge turns back if sin²α > B/B_max, i.e. for α > ') + '<b class="bsiFX-num">' + fmt(ac) + '°</b>. ' + t('Previsione: ', 'Prediction: ') + '<b>' + (st.alfa > ac ? t('riflessa', 'reflected') : t('attraversa la spira', 'passes through the loop')) + '</b>. ' + t('La previsione vale se la carica gira stretta (r_L ≪ a, regime adiabatico). Così le fasce di Van Allen intrappolano protoni ed elettroni fra i poli.', 'The prediction holds if the charge gyrates tightly (r_L ≪ a, adiabatic regime). This is how the Van Allen belts trap protons and electrons between the poles.'); }
      else testo = t('Solo campo elettrico: la carica positiva è respinta dalla carica + (rossa) e attratta dalla − (azzurra); si conserva ½mv² + qV. Le linee escono dalle cariche positive ed entrano nelle negative.', 'Electric field only: the positive charge is repelled by the + charge (red) and attracted by the − one (blue); ½mv² + qV is conserved. Lines leave positive charges and enter negative ones.');
      info.innerHTML = testo;
      if (cb.nuovo) cb.nuovo(linee);
    }
    nuovo(true);
    return {
      etichetta: ['Linee di campo in 3D e moto di una carica con la forza di Lorentz', '3D field lines and the motion of a charge under the Lorentz force'],
      tre: function (S, T, L3) {
        var sorg = new T.Group(), linee = new T.Group(); S.aggiungi(sorg); S.aggiungi(linee);
        var palla = L3.sfera(T, 0.12, 0xff6b6b, 0, 0, 0, true); S.aggiungi(palla);
        var fv = L3.freccia(T, [0, 0, 0], [1, 0, 0], 0xffd24a, 0.2), ff = L3.freccia(T, [0, 0, 0], [0, 1, 0], 0xff8ad8, 0.2); S.aggiungi(fv); S.aggiungi(ff);
        var NS = 2400, sp = new Float32Array(NS * 3), ns = 0, gs = new T.BufferGeometry(); gs.setAttribute('position', new T.BufferAttribute(sp, 3)); gs.setDrawRange(0, 0);
        var scia = new T.Line(gs, new T.LineBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.9 })); S.aggiungi(scia);
        var lotto = 0, tVivo = 0;
        function aggiungiLinea(L, col) {
          if (L.length < 2) return;
          linee.add(L3.linea(T, L, col, 0.7));
          if (L.length > 30) { var i = Math.floor(L.length * 0.4); linee.add(L3.freccia(T, L[i], L[i + 3], col, 0.16)); }
        }
        function sorgente() {
          svuota(sorg);
          var rame = new T.MeshStandardMaterial({ color: 0xd9895b, metalness: 0.6, roughness: 0.3 });
          if (st.s === 'spira') sorg.add(new T.Mesh(new T.TorusGeometry(A_SPIRA, 0.045, 10, 72), rame));
          else if (st.s === 'solenoide') {
            for (var k = 0; k < N_SOL; k++) { var m = new T.Mesh(new T.TorusGeometry(A_SOL, 0.04, 8, 56), rame); m.position.z = -L_SOL / 2 + L_SOL * (k + 0.5) / N_SOL; sorg.add(m); }
            var cil = new T.Mesh(new T.CylinderGeometry(A_SOL, A_SOL, L_SOL, 40, 1, true), new T.MeshStandardMaterial({ color: 0xd9895b, transparent: true, opacity: 0.08, side: T.DoubleSide, depthWrite: false })); cil.rotation.x = Math.PI / 2; sorg.add(cil);
          } else if (st.s === 'dipolo') DIPOLO.forEach(function (c) { sorg.add(L3.sfera(T, 0.18, c[0] > 0 ? 0xff6b6b : 0x6bcfff, c[1], c[2], c[3], true)); var e = L3.testo3d(T, c[0] > 0 ? '+' : '−', '#081522', 0.3); e.position.set(c[1], c[2], c[3]); sorg.add(e); });
          if (st.s === 'incrociati') { var eE = L3.testo3d(T, 'E', '#ffb36b', 0.4); eE.position.set(4.3, 0, 3.6); sorg.add(eE); }
          if (st.s !== 'dipolo') { var eB = L3.testo3d(T, 'B', '#6bcfff', 0.4); eB.position.set(0.35, 0.35, 3.9); sorg.add(eB); }
        }
        /* le linee si tracciano a lotti, una sorgente di semi per volta: il clic resta leggero */
        function traccia() {
          svuota(linee); var mio = ++lotto, semi = [], f;
          if (st.s === 'uniforme' || st.s === 'incrociati') {
            for (var i = -2; i <= 2; i++) for (var j = -2; j <= 2; j++) aggiungiLinea([[i * 1.5, j * 1.5, -4], [i * 1.5, j * 1.5, 4]], 0x6bcfff);
            if (st.s === 'incrociati') for (i = -2; i <= 2; i++) for (j = -1; j <= 1; j++) aggiungiLinea([[-4, i * 1.5, j * 3], [4, i * 1.5, j * 3]], 0xffb36b);
            S.sporca = true; S.avvia(); return;
          }
          if (st.s === 'dipolo') {
            f = function (x, y, z) { return campoCariche(DIPOLO, x, y, z); };
            var g = Math.PI * (3 - Math.sqrt(5)); for (i = 0; i < 22; i++) { var zz = 1 - 2 * (i + 0.5) / 22, rr = Math.sqrt(1 - zz * zz); semi.push([-1 + 0.2 * rr * Math.cos(g * i), 0.2 * rr * Math.sin(g * i), 0.2 * zz]); }
          } else {
            var a = st.s === 'spira' ? A_SPIRA : A_SOL;
            f = st.s === 'spira' ? function (x, y, z) { return campoSpira3D(A_SPIRA, x, y, z, 48); } : function (x, y, z) { return campoSolenoide(A_SOL, L_SOL, N_SOL, x, y, z, 24); };
            [0.15, 0.45, 0.75].forEach(function (u) { for (var k = 0; k < 6; k++) { var ph = Math.PI * k / 3 + 0.2; semi.push([u * a * Math.cos(ph), u * a * Math.sin(ph), 0]); } });
            if (st.s === 'spira') for (var k = 0; k < 4; k++) { var ph = Math.PI * k / 2 + 0.2; semi.push([1.25 * a * Math.cos(ph), 1.25 * a * Math.sin(ph), 0]); }
          }
          var stop = function (p, i, p0) { if (Math.hypot(p[0], p[1], p[2]) > 6.5) return true; if (st.s === 'dipolo') return Math.hypot(p[0] - 1, p[1], p[2]) < 0.15; return i > 40 && Math.hypot(p[0] - p0[0], p[1] - p0[1], p[2] - p0[2]) < 0.06; };
          var k2 = 0;
          (function passo() {
            if (mio !== lotto) return;
            var t0 = Date.now();
            while (k2 < semi.length && Date.now() - t0 < 30) {
              var p0 = semi[k2++], L1 = lineaCampo3D(f, p0, 1, function (p, i) { return stop(p, i, p0); }, st.s === 'solenoide' ? 420 : 700, 0.06), L = L1;
              if (st.s !== 'dipolo' && Math.hypot(L1[L1.length - 1][0] - p0[0], L1[L1.length - 1][1] - p0[1], L1[L1.length - 1][2] - p0[2]) > 0.1) L = lineaCampo3D(f, p0, -1, function (p) { return Math.hypot(p[0], p[1], p[2]) > 6.5; }, st.s === 'solenoide' ? 420 : 700, 0.06).reverse().concat(L1);
              aggiungiLinea(L, st.s === 'dipolo' ? 0xffb36b : 0x6bcfff);
            }
            S.sporca = true; S.avvia();
            if (k2 < semi.length) setTimeout(passo, 0);
          })();
        }
        function posa() {
          var p = part.x, c = campi(p), v = part.v, F3 = [st.q * (c.E[0] + v[1] * c.B[2] - v[2] * c.B[1]), st.q * (c.E[1] + v[2] * c.B[0] - v[0] * c.B[2]), st.q * (c.E[2] + v[0] * c.B[1] - v[1] * c.B[0])], sv = 0.9 / Math.max(0.2, st.v), sf = 0.7 / Math.max(0.1, st.v * st.B);
          palla.position.set(p[0], p[1], p[2]); palla.material.color.setHex(st.q > 0 ? 0xff6b6b : 0x6bcfff); palla.material.emissive.setHex(st.q > 0 ? 0xff6b6b : 0x6bcfff);
          puntaFreccia(T, fv, p, [v[0] * sv, v[1] * sv, v[2] * sv]); puntaFreccia(T, ff, p, [F3[0] * sf, F3[1] * sf, F3[2] * sf]);
        }
        cb.nuovo = function (conLinee) { if (conLinee) { sorgente(); traccia(); } ns = 0; gs.setDrawRange(0, 0); posa(); S.sporca = true; S.avvia(); };
        cb.nuovo(true);
        S.ogniFotogramma(function (dt) {
          if (S.fermo) return false;
          var h = 0.01, n = Math.max(1, Math.round(dt * 2.4 / h));
          for (var i = 0; i < n; i++) {
            var c = campi(part.x); passoBoris(part, st.q, c.E, c.B, h); tSim += h;
            if (part.x[2] > zmax) zmax = part.x[2]; if (st.s === 'spira' && part.v[2] < 0 && part.x[2] < 0) riflessa = true;
          }
          if (ns >= NS) { sp.copyWithin(0, 3); ns = NS - 1; }
          sp[3 * ns] = part.x[0]; sp[3 * ns + 1] = part.x[1]; sp[3 * ns + 2] = part.x[2]; ns++; gs.attributes.position.needsUpdate = true; gs.setDrawRange(0, ns);
          posa();
          var fuori = Math.hypot(part.x[0], part.x[1], part.x[2]) > 6.5 || tSim > 90 || (st.s === 'dipolo' && DIPOLO.some(function (q) { return Math.hypot(part.x[0] - q[1], part.x[1] - q[2], part.x[2] - q[3]) < 0.16; }));
          var vm = Math.hypot(part.v[0], part.v[1], part.v[2]);
          S.didascalia.textContent = 't = ' + tSim.toFixed(1) + ' · |v| = ' + vm.toFixed(4) + (st.s === 'spira' ? ' · ' + (riflessa ? t('riflessa', 'reflected') : zmax > 0.5 ? t('ha attraversato la spira', 'went through the loop') : t('in viaggio', 'travelling')) : '');
          tVivo += dt; if (tVivo > 0.5) { tVivo = 0; vivo.innerHTML = t('Ora: ', 'Now: ') + '|v| = <b class="bsiFX-num">' + vm.toFixed(6) + '</b> ' + (st.s === 'dipolo' || st.s === 'incrociati' ? t('(il campo elettrico compie lavoro: |v| cambia)', '(the electric field does work: |v| changes)') : t('(partita con ', '(started at ') + st.v.toFixed(2) + t(': il campo magnetico non cambia il modulo della velocità)', ': the magnetic field does not change the speed)')); }
          if (fuori) { partenza(); ns = 0; }
          return true;
        });
        S.inquadra(14, -0.9, 1.15);
      }
    };
  }

  F.sezione('sfisem', {
    titolo: ['⚡ Elettromagnetismo in movimento', '⚡ Electromagnetism in motion'],
    sotto: ['Cariche da trascinare con potenziale, equipotenziali e linee di campo; l’induzione di una calamita che attraversa una spira; il generatore a corrente alternata; le onde elettromagnetiche e la polarizzazione.', 'Charges to drag with potential, equipotentials and field lines; induction by a magnet passing through a loop; the AC generator; electromagnetic waves and polarisation.'],
    schede: [
      { nome: ['➕ Cariche nel piano', '➕ Charges in the plane'], costruisci: schedaCariche },
      { nome: ['🧲 Induzione', '🧲 Induction'], costruisci: schedaInduzione },
      { nome: ['🔄 Generatore', '🔄 Generator'], costruisci: schedaGeneratore },
      { nome: ['〰️ Onde EM', '〰️ EM waves'], costruisci: schedaOnde },
      { nome: ['🌀 Campi 3D e Lorentz', '🌀 3D fields and Lorentz'], costruisci: scheda3D(schedaCampi3D) }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
