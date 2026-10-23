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
     a seconda dello sfasamento fra le due componenti di E.
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
  F.calcolo.em = { potenziale: potenziale, campo: campo, flussoDipolo: flussoDipolo, flussoNumerico: flussoNumerico, generatore: generatore };

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

  F.sezione('sfisem', {
    titolo: ['⚡ Elettromagnetismo in movimento', '⚡ Electromagnetism in motion'],
    sotto: ['Cariche da trascinare con potenziale, equipotenziali e linee di campo; l’induzione di una calamita che attraversa una spira; il generatore a corrente alternata; le onde elettromagnetiche e la polarizzazione.', 'Charges to drag with potential, equipotentials and field lines; induction by a magnet passing through a loop; the AC generator; electromagnetic waves and polarisation.'],
    schede: [
      { nome: ['➕ Cariche nel piano', '➕ Charges in the plane'], costruisci: schedaCariche },
      { nome: ['🧲 Induzione', '🧲 Induction'], costruisci: schedaInduzione },
      { nome: ['🔄 Generatore', '🔄 Generator'], costruisci: schedaGeneratore },
      { nome: ['〰️ Onde EM', '〰️ EM waves'], costruisci: schedaOnde }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
