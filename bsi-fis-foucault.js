/* ═══════════════════════════════════════════════════════════════════════════
   bsi-fis-foucault.js — 🌍 Il pendolo di Foucault e la forza di Coriolis
   BioSpecInfo · © Samuele Pio Provenzano

   PERCHE' ESISTE (v252)
   Richiesta dell'autore: potenziare al massimo le sezioni di fisica. Mancava
   la prova più famosa che la Terra gira: il piano di oscillazione di un
   pendolo ruota, a Parigi di un giro ogni 31,8 ore, perché sotto di lui il
   pavimento ruota con la Terra.

   LA FISICA
   Nel riferimento della Terra, per piccole oscillazioni e con Ω_z = Ω·sin φ
   (Ω = 7,2921×10⁻⁵ rad/s, φ latitudine):
       ẍ = −ω₀²x + 2Ω_z ẏ        ÿ = −ω₀²y − 2Ω_z ẋ        ω₀ = √(g/L)
   Le equazioni si integrano con Runge–Kutta del quarto ordine. Il piano
   ruota in senso orario nell'emisfero nord con velocità angolare Ω·sin φ:
   15°·sin φ all'ora, un giro in T = 23,934 h / sin φ (giorno siderale).
   All'equatore non ruota; ai poli fa un giro in un giorno siderale.

   La stessa forza devia un corpo che cade verso est:
       d = ⅓·Ω·g·t³·cos φ,   t = √(2h/g)
   (100 m a 45°: 1,55 cm).

   ONESTA'
   · Per vedere la rotazione in pochi secondi la Terra si può far girare più
     in fretta (cursore «accelerazione»): il numero delle ore resta quello
     vero, ed è scritto.
   · Piccole oscillazioni, senza attrito: un pendolo vero si smorza e, se
     non è perfettamente simmetrico, sviluppa un moto ellittico che altera la
     precessione (per questo nei musei si usa un anello di Charron).
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, OMEGA = 7.2921159e-5, G = 9.80665, SIDERALE_H = 23.9345;
  function griglia(div) { var Gr = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); Gr.appendChild(pan); Gr.appendChild(dx); div.appendChild(Gr); return { pan: pan, dx: dx }; }
  function nota(pan) { var n = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(n); return n; }
  function rad(d) { return d * Math.PI / 180; }

  /* ═══ 1. IL CALCOLO ════════════════════════════════════════════════════ */
  /** Periodo di precessione in ore (Infinity all'equatore). */
  function periodoPrecessione(latGradi) { var s = Math.abs(Math.sin(rad(latGradi))); return s < 1e-9 ? Infinity : SIDERALE_H / s; }
  /** Gradi all'ora di rotazione del piano (positivi = orario visto dall'alto, emisfero nord). */
  function gradiOra(latGradi) { return 360 / SIDERALE_H * Math.sin(rad(latGradi)); }
  /** Integra il pendolo (Runge–Kutta 4). Ω_z già moltiplicato per l'accelerazione. Restituisce i punti (x, y) e il tempo. */
  function integra(opz) {
    var L = opz.L, w0 = Math.sqrt(G / L), Oz = OMEGA * (opz.accelera || 1) * Math.sin(rad(opz.lat)), dt = opz.dt || (2 * Math.PI / w0) / 200, n = Math.round(opz.durata / dt);
    var s = [opz.A || 1, 0, 0, 0], pts = [{ x: s[0], y: s[1], t: 0 }];        /* x verso est, y verso nord, vx, vy: parte ferma a x = A (oscilla est–ovest) */
    function der(q) { return [q[2], q[3], -w0 * w0 * q[0] + 2 * Oz * q[3], -w0 * w0 * q[1] - 2 * Oz * q[2]]; }
    for (var i = 1; i <= n; i++) {
      var k1 = der(s), a = s.map(function (v, j) { return v + k1[j] * dt / 2; }), k2 = der(a), b = s.map(function (v, j) { return v + k2[j] * dt / 2; }), k3 = der(b), c = s.map(function (v, j) { return v + k3[j] * dt; }), k4 = der(c);
      s = s.map(function (v, j) { return v + dt / 6 * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]); });
      if (i % (opz.ogni || 4) === 0 || i === n) pts.push({ x: s[0], y: s[1], t: i * dt });
    }
    return { punti: pts, w0: w0, Oz: Oz, stato: s, tempo: n * dt };
  }
  /** L'angolo del piano di oscillazione (gradi) da un tratto di traiettoria: la direzione del massimo allontanamento. */
  function anglePiano(punti) {
    var m = punti.reduce(function (a, p) { var r = p.x * p.x + p.y * p.y; return r > a.r ? { r: r, p: p } : a; }, { r: -1, p: null }).p;
    var ang = Math.atan2(m.y, m.x) * 180 / Math.PI; if (ang > 90) ang -= 180; if (ang < -90) ang += 180; return ang;
  }
  /** Deviazione verso est di un corpo lasciato cadere da h metri (metri). */
  function deviazioneEst(h, latGradi) { var tc = Math.sqrt(2 * h / G); return OMEGA * G * Math.pow(tc, 3) * Math.cos(rad(latGradi)) / 3; }
  /** Accelerazione di Coriolis orizzontale su un corpo che si muove a v m/s in orizzontale. */
  function coriolisOrizzontale(v, latGradi) { return 2 * OMEGA * v * Math.sin(rad(latGradi)); }

  var CITTA = [['Polo Nord', 90], ['Londra', 51.51], ['Parigi, Panthéon (Foucault, 1851)', 48.846], ['Ginevra (CERN)', 46.23], ['Milano', 45.46], ['Roma', 41.90], ['Napoli', 40.85], ['New York', 40.71], ['Palermo', 38.12], ['Tokyo', 35.68], ['Singapore', 1.35], ['Equatore', 0], ['Sydney', -33.87], ['Polo Sud', -90]];

  /* ═══ 2. IL DISEGNO DEL PAVIMENTO ══════════════════════════════════════ */
  function telaQuadrata(dx) {
    var c = F.el('canvas', { role: 'img', 'aria-label': t('Il pavimento visto dall’alto con la traccia del pendolo', 'The floor seen from above with the pendulum trace'), style: 'width:100%;display:block;border-radius:12px;background:#06111d' });
    dx.appendChild(c); return c;
  }
  function pavimento(c, pts, lat) {
    var W = Math.max(200, Math.min(c.parentNode.clientWidth || 300, 520)), dpr = Math.min(2, globale.devicePixelRatio || 1);
    c.style.height = W + 'px'; c.style.maxWidth = W + 'px'; c.width = Math.round(W * dpr); c.height = Math.round(W * dpr);
    var q = c.getContext('2d'); q.setTransform(dpr, 0, 0, dpr, 0, 0); q.clearRect(0, 0, W, W);
    var R = W * 0.42, cx = W / 2, cy = W / 2;
    q.strokeStyle = '#1f3a55'; q.lineWidth = 1; q.beginPath(); q.arc(cx, cy, R * 1.04, 0, 6.2832); q.stroke();
    for (var a = 0; a < 360; a += 15) { var r1 = a % 90 === 0 ? R * 0.94 : R * 0.99; q.beginPath(); q.moveTo(cx + Math.cos(rad(a)) * r1, cy - Math.sin(rad(a)) * r1); q.lineTo(cx + Math.cos(rad(a)) * R * 1.04, cy - Math.sin(rad(a)) * R * 1.04); q.stroke(); }
    q.fillStyle = '#7fa6c9'; q.font = '600 12px system-ui,sans-serif'; q.textAlign = 'center'; q.textBaseline = 'middle';
    q.fillText('N', cx, cy - R * 1.13); q.fillText('S', cx, cy + R * 1.13); q.fillText('E', cx + R * 1.13, cy); q.fillText(t('O', 'W'), cx - R * 1.13, cy);
    var n = pts.length;
    for (var i = 1; i < n; i++) {
      var f = i / n; q.strokeStyle = 'hsla(' + (170 + 40 * f) + ',90%,' + (35 + 30 * f) + '%,' + (0.15 + 0.85 * f) + ')'; q.lineWidth = 1 + f;
      q.beginPath(); q.moveTo(cx + pts[i - 1].x * R, cy - pts[i - 1].y * R); q.lineTo(cx + pts[i].x * R, cy - pts[i].y * R); q.stroke();      /* x verso est (a destra), y verso nord (in alto) */
    }
    var u = pts[n - 1]; q.fillStyle = '#ffd24a'; q.beginPath(); q.arc(cx + u.x * R, cy - u.y * R, 6, 0, 6.2832); q.fill();
    q.fillStyle = '#9fb3c8'; q.font = '11px system-ui,sans-serif'; q.textAlign = 'left'; q.fillText(t('latitudine ', 'latitude ') + lat.toFixed(1) + '°', 10, W - 12);
  }

  /* ═══ 3. LE SCHEDE ═════════════════════════════════════════════════════ */
  function schedaPendolo(div) {
    var g = griglia(div), lat = 48.846, L = 67, acc = 150, oscill = 40, timer = 0;
    F.scelta(g.pan, ['Dove', 'Where'], CITTA.map(function (x) { return [String(x[1]), x[0]]; }), String(lat), function (v) { lat = +v; latC.value = lat; latC.dispatchEvent(new Event('input')); });
    var latC = F.cursore(g.pan, ['Latitudine (°)', 'Latitude (°)'], -90, 90, 0.1, lat, function (v) { lat = v; programma(); }, function (v) { return v.toFixed(1) + '°'; });
    F.cursore(g.pan, ['Lunghezza del filo (m)', 'Wire length (m)'], 1, 100, 1, L, function (v) { L = v; programma(); });
    F.cursore(g.pan, ['Accelerazione della Terra (×)', 'Earth speed-up (×)'], 1, 5000, 1, acc, function (v) { acc = v; programma(); });
    F.cursore(g.pan, ['Oscillazioni da tracciare', 'Swings to draw'], 4, 120, 1, oscill, function (v) { oscill = v; programma(); });
    var info = nota(g.pan), c = telaQuadrata(g.dx);
    function programma() { clearTimeout(timer); timer = setTimeout(disegna, 40); }
    function disegna() {
      var T0 = 2 * Math.PI * Math.sqrt(L / G), r = integra({ L: L, lat: lat, accelera: acc, durata: oscill * T0, A: 1, ogni: 3 });
      pavimento(c, r.punti, lat);
      var Tp = periodoPrecessione(lat), go = gradiOra(lat), ruotato = -r.Oz * r.tempo * 180 / Math.PI;
      info.innerHTML = '<div class="bsiFX-eq">T = 23,934 h / sin φ</div>' +
        t('Un’oscillazione dura ', 'One swing lasts ') + '<b class="bsiFX-num">' + T0.toFixed(2) + ' s</b> (2π√(L/g)).<br>' +
        t('Il piano ruota di ', 'The plane turns by ') + '<b class="bsiFX-num">' + Math.abs(go).toFixed(2) + '° ' + t('all’ora', 'per hour') + '</b>' + (Math.abs(lat) < 0.05 ? '' : ', ' + (lat > 0 ? t('in senso orario (emisfero nord)', 'clockwise (northern hemisphere)') : t('in senso antiorario (emisfero sud)', 'anticlockwise (southern hemisphere)'))) + '<br>' +
        t('Un giro completo in ', 'A full turn in ') + '<b class="bsiFX-num">' + (isFinite(Tp) ? Tp.toFixed(1) + ' h' : t('mai: all’equatore il piano non ruota', 'never: at the equator the plane does not turn')) + '</b><br>' +
        '<small>' + t('Nel disegno la Terra gira ' + acc + ' volte più in fretta: in ' + oscill + ' oscillazioni (' + (oscill * T0).toFixed(0) + ' s) il piano ruota di ' + Math.abs(ruotato).toFixed(1) + '°; davvero ci vorrebbero ' + (oscill * T0 * acc / 3600).toFixed(1) + ' ore.',
          'In the drawing the Earth turns ' + acc + ' times faster: in ' + oscill + ' swings (' + (oscill * T0).toFixed(0) + ' s) the plane turns by ' + Math.abs(ruotato).toFixed(1) + '°; really it would take ' + (oscill * T0 * acc / 3600).toFixed(1) + ' hours.') + '</small>';
    }
    disegna(); F.alRidimensiona(disegna);
  }
  function schedaCitta(div) {
    var g = griglia(div), info = nota(g.pan);
    info.innerHTML = t('Il pendolo non sa nulla della città: conta solo la latitudine. Sin φ dice quanta parte della rotazione terrestre «sente» il pavimento sotto di lui: tutta al polo, niente all’equatore.', 'The pendulum knows nothing of the city: only the latitude counts. Sin φ says how much of the Earth’s rotation the floor beneath it «feels»: all of it at the pole, none at the equator.');
    var c = F.tela(g.dx, 0.55), box = F.el('div', { style: 'overflow-x:auto' }); g.dx.appendChild(box);
    function disegna() {
      var xs = [], ys = [];
      for (var l = 5; l <= 90; l += 1) { xs.push(l); ys.push(periodoPrecessione(l)); }
      F.grafico(c, { serie: [{ x: xs, y: ys, col: '#5eead4', larg: 2 }], punti: CITTA.filter(function (x) { return x[1] >= 5; }).map(function (x) { return { x: x[1], y: periodoPrecessione(x[1]), col: '#ffd24a', r: 4 }; }), ymin: 0, ymax: 300, xl: ['latitudine (°)', 'latitude (°)'], yl: ['ore per un giro', 'hours per turn'] });
      box.innerHTML = '<table class="bsiFX-tab"><tr><th>' + t('Luogo', 'Place') + '</th><th>φ</th><th>' + t('°/ora', '°/hour') + '</th><th>' + t('un giro', 'one turn') + '</th></tr>' + CITTA.map(function (x) { var Tp = periodoPrecessione(x[1]); return '<tr><td>' + x[0] + '</td><td>' + x[1].toFixed(2) + '°</td><td>' + Math.abs(gradiOra(x[1])).toFixed(2) + '</td><td>' + (isFinite(Tp) ? Tp.toFixed(1) + ' h' : '—') + '</td></tr>'; }).join('') + '</table>';
    }
    disegna(); F.alRidimensiona(disegna);
  }
  function schedaCoriolis(div) {
    var g = griglia(div), h = 100, lat = 45.46, v = 300;
    F.cursore(g.pan, ['Altezza della caduta (m)', 'Drop height (m)'], 1, 1000, 1, h, function (x) { h = x; disegna(); });
    F.cursore(g.pan, ['Latitudine (°)', 'Latitude (°)'], -90, 90, 0.1, lat, function (x) { lat = x; disegna(); }, function (x) { return x.toFixed(1) + '°'; });
    F.cursore(g.pan, ['Velocità orizzontale (m/s)', 'Horizontal speed (m/s)'], 1, 1000, 1, v, function (x) { v = x; disegna(); });
    var info = nota(g.pan), c = F.tela(g.dx, 0.55);
    function disegna() {
      var d = deviazioneEst(h, lat), a = coriolisOrizzontale(v, lat), xs = [], ys = [];
      for (var q = 1; q <= 1000; q += 5) { xs.push(q); ys.push(deviazioneEst(q, lat) * 100); }
      F.grafico(c, { serie: [{ x: xs, y: ys, col: '#9d8cff', larg: 2 }], punti: [{ x: h, y: d * 100, col: '#ffd24a', r: 5 }], ymin: 0, xl: ['altezza (m)', 'height (m)'], yl: ['deviazione verso est (cm)', 'eastward deflection (cm)'] });
      var tc = Math.sqrt(2 * h / G);
      info.innerHTML = '<div class="bsiFX-eq">d = ⅓·Ω·g·t³·cos φ</div>' + t('Cade in ', 'It falls in ') + '<b class="bsiFX-num">' + tc.toFixed(2) + ' s</b> ' + t('e tocca terra spostato verso est di ', 'and lands shifted east by ') + '<b class="bsiFX-num">' + (d * 100).toFixed(2) + ' cm</b>.<br>' +
        t('Un corpo che corre a ', 'A body moving at ') + v + ' m/s ' + t('subisce un’accelerazione laterale di ', 'feels a sideways acceleration of ') + '<b class="bsiFX-num">' + (a * 1000).toFixed(2) + ' mm/s²</b>' + (Math.abs(lat) < 0.05 ? '' : ', ' + (lat > 0 ? t('verso destra', 'to the right') : t('verso sinistra', 'to the left'))) + ': ' + t('in un minuto, uno spostamento di ', 'in a minute, a drift of ') + '<b class="bsiFX-num">' + (0.5 * a * 3600).toFixed(1) + ' m</b>.<br>' +
        '<small>' + t('È la stessa forza che fa girare i cicloni in senso antiorario a nord e orario a sud. Non decide invece il verso del vortice nel lavandino: lì contano la forma del lavandino e i moti dell’acqua, mille volte più forti.', 'It is the same force that turns cyclones anticlockwise in the north and clockwise in the south. It does not decide the swirl in a sink: there the shape of the basin and the water’s motion, a thousand times stronger, win.') + '</small>';
    }
    disegna(); F.alRidimensiona(disegna);
  }

  F.calcolo.foucault = { OMEGA: OMEGA, G: G, SIDERALE_H: SIDERALE_H, CITTA: CITTA, periodoPrecessione: periodoPrecessione, gradiOra: gradiOra, integra: integra, anglePiano: anglePiano, deviazioneEst: deviazioneEst, coriolisOrizzontale: coriolisOrizzontale };
  F.sezione('sfoucault', {
    titolo: ['🌍 Il pendolo di Foucault e la forza di Coriolis', '🌍 Foucault’s pendulum and the Coriolis force'],
    sotto: ['La prova che la Terra gira: il piano di oscillazione ruota di 15°·sin φ all’ora. Le equazioni nel riferimento terrestre integrate passo per passo, le città del mondo, e la deviazione verso est di un corpo che cade.',
            'The proof that the Earth turns: the swing plane rotates by 15°·sin φ per hour. The equations in the Earth’s frame integrated step by step, the cities of the world, and the eastward deflection of a falling body.'],
    schede: [
      { nome: ['Il pendolo', 'The pendulum'], costruisci: schedaPendolo },
      { nome: ['Le città', 'The cities'], costruisci: schedaCitta },
      { nome: ['La forza di Coriolis', 'The Coriolis force'], costruisci: schedaCoriolis }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
