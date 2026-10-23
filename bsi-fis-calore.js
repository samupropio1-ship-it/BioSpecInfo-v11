/* ═══════════════════════════════════════════════════════════════════════════
   bsi-fis-calore.js — 🔥 calore e diffusione
   BioSpecInfo · © Samuele Pio Provenzano

   · BARRA: l'equazione del calore ∂T/∂t = α ∂²T/∂x² con le differenze
     finite (r = αΔt/Δx² ≤ ½); estremi a temperatura fissata o isolati; la
     barra a colori e il profilo; lo stato stazionario lineare; il modo
     fondamentale che si spegne con τ = L²/(π²α);
   · PIASTRA: la stessa equazione in due dimensioni, con una sorgente di
     calore e i bordi freddi, a colori;
   · RAFFREDDAMENTO: Newton T(t) = T_a + (T₀ − T_a) e^(−kt) per una tazza di
     caffe', contro l'irraggiamento σT⁴ che conta per i corpi molto caldi;
   · PARETI: strati in serie come resistenze termiche R = L/(kA); il flusso,
     il profilo di temperatura dentro la parete, la trasmittanza U.
   La stessa matematica descrive la diffusione di una sostanza (legge di
   Fick, α → D).
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt, sigma = 5.670374419e-8;
  function griglia(div) { var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); G.appendChild(pan); G.appendChild(dx); div.appendChild(G); return { pan: pan, dx: dx }; }
  function nota(pan) { var n = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(n); return n; }
  function colore(u) { u = Math.max(0, Math.min(1, u)); var r = Math.round(255 * Math.min(1, 2 * u)), g = Math.round(255 * Math.max(0, Math.min(1, 2 * u - 0.6))), b = Math.round(255 * Math.max(0, 1 - 2.2 * u) * 0.9 + 40 * (1 - u)); return [r, g, b]; }

  /* ═══ calcoli ═══════════════════════════════════════════════════════════ */
  /* un passo esplicito; bordi: 'fisso' (Dirichlet) o 'isolato' (Neumann, derivata nulla) */
  function passo1D(T, r, bordo, Ts, Td) {
    var n = T.length, N = new Float64Array(n);
    for (var i = 1; i < n - 1; i++) N[i] = T[i] + r * (T[i + 1] - 2 * T[i] + T[i - 1]);
    if (bordo === 'isolato') { N[0] = T[0] + 2 * r * (T[1] - T[0]); N[n - 1] = T[n - 1] + 2 * r * (T[n - 2] - T[n - 1]); } else { N[0] = Ts; N[n - 1] = Td; }
    return N;
  }
  function passo2D(T, n, r, sorgente) {
    var N = new Float64Array(n * n);
    for (var j = 1; j < n - 1; j++) for (var i = 1; i < n - 1; i++) { var k = j * n + i; N[k] = T[k] + r * (T[k - 1] + T[k + 1] + T[k - n] + T[k + n] - 4 * T[k]) + (sorgente ? sorgente(i, j) : 0); }
    return N;
  }
  function newton(T0, Ta, k, tt) { return Ta + (T0 - Ta) * Math.exp(-k * tt); }
  function parete(strati, Ti, Te, hi, he) {
    /* strati: [nome, spessore m, conducibilita' W/(m K)]; resistenze per m² */
    var Rs = [1 / hi].concat(strati.map(function (s) { return s[1] / s[2]; })).concat([1 / he]), Rt = Rs.reduce(function (a, b) { return a + b; }, 0), q = (Ti - Te) / Rt, T = [Ti], cur = Ti;
    Rs.forEach(function (R) { cur -= q * R; T.push(cur); });
    return { R: Rs, Rt: Rt, U: 1 / Rt, q: q, T: T };
  }
  F.calcolo.calore = { passo1D: passo1D, passo2D: passo2D, newton: newton, parete: parete };

  /* ═══ 1. barra ══════════════════════════════════════════════════════════ */
  function schedaBarra(div) {
    var G = griglia(div), st = { iniz: 'gradino', bordo: 'fisso', Ts: 100, Td: 0, mat: 'rame' }, info = nota(G.pan), n = 101, T, tt = 0;
    var MAT = { rame: [['rame (α = 1,1·10⁻⁴ m²/s)', 'copper (α = 1.1·10⁻⁴ m²/s)'], 1.11e-4], acciaio: [['acciaio (α = 1,2·10⁻⁵)', 'steel (α = 1.2·10⁻⁵)'], 1.2e-5], vetro: [['vetro (α = 3,4·10⁻⁷)', 'glass (α = 3.4·10⁻⁷)'], 3.4e-7] };
    F.scelta(G.pan, ['Materiale (barra di 10 cm)', 'Material (10 cm bar)'], Object.keys(MAT).map(function (k) { return [k, F.tt(MAT[k][0])]; }), st.mat, function (v) { st.mat = v; testo(); });
    F.scelta(G.pan, ['Situazione iniziale', 'Initial state'], [['gradino', t('metà calda, metà fredda', 'half hot, half cold')], ['picco', t('un punto caldo al centro', 'a hot spot in the middle')], ['freddo', t('tutta a 0 °C', 'all at 0 °C')]], st.iniz, function (v) { st.iniz = v; azzera(); });
    F.scelta(G.pan, ['Estremi', 'Ends'], [['fisso', t('a temperatura fissata', 'at fixed temperature')], ['isolato', t('isolati', 'insulated')]], st.bordo, function (v) { st.bordo = v; testo(); });
    F.cursore(G.pan, ['T estremo sinistro (°C)', 'left end T (°C)'], 0, 200, 1, st.Ts, function (v) { st.Ts = v; });
    F.cursore(G.pan, ['T estremo destro (°C)', 'right end T (°C)'], 0, 200, 1, st.Td, function (v) { st.Td = v; });
    G.pan.appendChild(info);
    var cb = F.tela(G.dx, 0.15), cp = F.tela(G.dx, 0.45);
    function azzera() { T = new Float64Array(n); for (var i = 0; i < n; i++) T[i] = st.iniz === 'gradino' ? (i < n / 2 ? 100 : 0) : st.iniz === 'picco' ? 100 * Math.exp(-Math.pow((i - n / 2) / 4, 2)) : 0; tt = 0; testo(); if (ctl) ctl.sveglia(); }
    function testo() { var a = MAT[st.mat][1], L = 0.1, tau = L * L / (Math.PI * Math.PI * a); info.innerHTML = t('Tempo caratteristico del modo più lento ', 'Characteristic time of the slowest mode ') + 'τ = L²/(π²α) = <b class="bsiFX-num">' + (tau > 120 ? fmt(tau / 60) + ' min' : fmt(tau) + ' s') + '</b><br>' + (st.bordo === 'fisso' ? t('Con gli estremi fissati lo stato finale è una retta fra le due temperature: il flusso è lo stesso in ogni punto (legge di Fourier q = −k dT/dx).', 'With fixed ends the final state is a straight line between the two temperatures: the flux is the same everywhere (Fourier’s law q = −k dT/dx).') : t('Isolata, la barra conserva l’energia: alla fine è tutta alla temperatura media.', 'Insulated, the bar conserves energy: in the end it is all at the average temperature.')) + '<br>' + t('Le punte si smussano per prime: un dettaglio di lunghezza ℓ si spegne in un tempo ∝ ℓ². È anche la legge di Fick per la diffusione.', 'Sharp features smooth out first: a detail of length ℓ fades in a time ∝ ℓ². It is also Fick’s law for diffusion.'); }
    var ctl = null; azzera();
    ctl = F.anima(cb, function (dt) {
      var a = MAT[st.mat][1], L = 0.1, dx = L / (n - 1), r = 0.4, dts = r * dx * dx / a, tau = L * L / (Math.PI * Math.PI * a), passi = Math.max(1, Math.round(dt * tau / 6 / dts));
      for (var k = 0; k < Math.min(passi, 4000); k++) T = passo1D(T, r, st.bordo, st.Ts, st.Td); tt += Math.min(passi, 4000) * dts;
      var P = F.pennello(cb), q = P.q, W = P.W, H = P.H;
      for (var i = 0; i < n; i++) { var c = colore(T[i] / 200); q.fillStyle = 'rgb(' + c.join(',') + ')'; q.fillRect(i / n * W, 0, W / n + 1, H); }
      cb.setAttribute('aria-label', t('barra colorata per temperatura', 'bar coloured by temperature'));
      var xs = [], ys = []; for (i = 0; i < n; i++) { xs.push(i / (n - 1) * 10); ys.push(T[i]); }
      F.grafico(cp, { serie: [{ x: xs, y: ys, col: '#ff8a80', larg: 2.5, etich: 'T(x)' }], xmin: 0, xmax: 10, ymin: 0, ymax: 200, xl: ['x (cm)', 'x (cm)'], yl: ['T (°C)', 'T (°C)'], descr: ['profilo di temperatura', 'temperature profile'] });
      var o = cp.getContext('2d'); o.fillStyle = '#c9d3df'; o.font = '12px system-ui'; o.fillText('t = ' + (tt > 120 ? (tt / 60).toFixed(1) + ' min' : tt.toFixed(1) + ' s'), 60, 20);
    }, { ricomincia: azzera });
  }

  /* ═══ 2. piastra ════════════════════════════════════════════════════════ */
  function schedaPiastra(div) {
    var G = griglia(div), st = { P: 1, x: 0.5, y: 0.5 }, info = nota(G.pan), n = 80, T = new Float64Array(n * n), img = null, off = null;
    F.cursore(G.pan, ['potenza della sorgente', 'source power'], 0, 3, 0.1, st.P, function (v) { st.P = v; }, function (v) { return v.toFixed(1); });
    F.bottone(G.pan, ['Raffredda tutto', 'Cool everything'], function () { T = new Float64Array(n * n); });
    G.pan.appendChild(info);
    info.innerHTML = t('Tocca la piastra per spostare la sorgente di calore. I bordi sono tenuti a 0. Il calore si allarga a cerchi e raggiunge uno stato stazionario in cui quanto entra dalla sorgente esce dai bordi: la soluzione dell’equazione di Poisson.', 'Tap the plate to move the heat source. The edges are held at 0. Heat spreads in circles and reaches a steady state where what enters from the source leaves through the edges: the solution of Poisson’s equation.');
    var cv = F.tela(G.dx, 1); cv.style.maxWidth = '520px'; cv.style.margin = '0 auto';
    cv.addEventListener('pointerdown', function (e) { var r = cv.getBoundingClientRect(); st.x = (e.clientX - r.left) / r.width; st.y = (e.clientY - r.top) / r.height; });
    F.anima(cv, function (dt) {
      var si = Math.round(st.x * (n - 1)), sj = Math.round(st.y * (n - 1)), sorg = function (i, j) { return Math.hypot(i - si, j - sj) < 3 ? 0.02 * st.P : 0; };
      for (var k = 0; k < Math.max(1, Math.round(dt * 60 * 6)); k++) T = passo2D(T, n, 0.24, sorg);
      if (!off) { off = document.createElement('canvas'); off.width = n; off.height = n; img = off.getContext('2d').createImageData(n, n); }
      var d = img.data, mx = 0; for (var i = 0; i < n * n; i++) mx = Math.max(mx, T[i]); mx = Math.max(mx, 0.5);
      for (i = 0; i < n * n; i++) { var c = colore(T[i] / mx); d[4 * i] = c[0]; d[4 * i + 1] = c[1]; d[4 * i + 2] = c[2]; d[4 * i + 3] = 255; }
      off.getContext('2d').putImageData(img, 0, 0);
      var P = F.pennello(cv), q = P.q; q.imageSmoothingEnabled = true; q.drawImage(off, 0, 0, P.W, P.H);
      q.strokeStyle = '#e6fffb'; q.lineWidth = 1.5; q.beginPath(); q.arc(st.x * P.W, st.y * P.H, 8, 0, 2 * Math.PI); q.stroke(); q.lineWidth = 1;
      cv.setAttribute('aria-label', t('piastra riscaldata', 'heated plate'));
    });
  }

  /* ═══ 3. raffreddamento ═════════════════════════════════════════════════ */
  function schedaRaffreddamento(div) {
    var G = griglia(div), st = { T0: 90, Ta: 20, k: 0.04 }, info = nota(G.pan);
    F.cursore(G.pan, ['T iniziale (°C)', 'initial T (°C)'], 40, 1200, 5, st.T0, function (v) { st.T0 = v; disegna(); });
    F.cursore(G.pan, ['T ambiente (°C)', 'ambient T (°C)'], -10, 40, 1, st.Ta, function (v) { st.Ta = v; disegna(); });
    F.cursore(G.pan, ['costante k (1/min)', 'constant k (1/min)'], 0.005, 0.2, 0.005, st.k, function (v) { st.k = v; disegna(); }, function (v) { return v.toFixed(3); });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.55);
    function disegna() {
      var xs = [], yn = [], yr = [], Tr = st.T0 + 273.15, Ta = st.Ta + 273.15, Tmax = 6 / st.k;
      /* irraggiamento puro con la stessa pendenza iniziale: dT/dt = −c (T⁴ − T_a⁴), c scelto per coincidere con Newton a t = 0 */
      var c = st.k * (st.T0 - st.Ta) / (Math.pow(Tr, 4) - Math.pow(Ta, 4)), dtt = Tmax / 600;
      for (var i = 0; i <= 600; i++) { var tt = i * dtt; xs.push(tt); yn.push(newton(st.T0, st.Ta, st.k, tt)); yr.push(Tr - 273.15); Tr -= c * (Math.pow(Tr, 4) - Math.pow(Ta, 4)) * dtt; }
      F.grafico(cv, { serie: [{ x: xs, y: yn, col: '#ff8a80', larg: 2.5, etich: 'Newton' }, { x: xs, y: yr, col: '#ffd24a', tratt: true, etich: [t('solo irraggiamento', 'radiation only'), 'radiation only'] }], linee: [{ y: st.Ta, col: '#6bcfff', etich: 'T_a' }], xl: ['t (min)', 't (min)'], yl: ['T (°C)', 'T (°C)'], legenda: [{ col: '#ff8a80', etich: ['Newton (convezione)', 'Newton (convection)'] }, { col: '#ffd24a', etich: ['irraggiamento σT⁴', 'radiation σT⁴'] }] });
      info.innerHTML = 'T(t) = T_a + (T₀ − T_a) e^(−kt) · ' + t('la differenza si dimezza ogni ', 'the difference halves every ') + '<b class="bsiFX-num">' + fmt(Math.LN2 / st.k) + ' min</b><br>' + t('Con la stessa pendenza iniziale, l’irraggiamento rallenta molto più in fretta a basse temperature (∝ T⁴): per un caffè domina la convezione, per un pezzo di ferro rovente l’irraggiamento.', 'With the same initial slope, radiation slows down much faster at low temperatures (∝ T⁴): for a coffee convection dominates, for a red-hot piece of iron radiation does.') + '<br>' + t('È una cinetica del primo ordine: la stessa matematica del decadimento radioattivo e di una reazione A → B.', 'It is first-order kinetics: the same mathematics as radioactive decay and an A → B reaction.');
    }
    disegna(); F.alRidimensiona(disegna);
  }

  /* ═══ 4. pareti ═════════════════════════════════════════════════════════ */
  function schedaParete(div) {
    var G = griglia(div), st = { iso: 8, mat: 25, Ti: 20, Te: -5 }, info = nota(G.pan);
    F.cursore(G.pan, ['isolante (cm, λ = 0,035)', 'insulation (cm, λ = 0.035)'], 0, 20, 0.5, st.iso, function (v) { st.iso = v; disegna(); }, function (v) { return v.toFixed(1); });
    F.cursore(G.pan, ['mattone (cm, λ = 0,7)', 'brick (cm, λ = 0.7)'], 5, 50, 1, st.mat, function (v) { st.mat = v; disegna(); });
    F.cursore(G.pan, ['T interna (°C)', 'inside T (°C)'], 10, 25, 0.5, st.Ti, function (v) { st.Ti = v; disegna(); }, function (v) { return v.toFixed(1); });
    F.cursore(G.pan, ['T esterna (°C)', 'outside T (°C)'], -20, 15, 0.5, st.Te, function (v) { st.Te = v; disegna(); }, function (v) { return v.toFixed(1); });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.55);
    function disegna() {
      var S = [[t('intonaco', 'plaster'), 0.015, 0.7], [t('mattone', 'brick'), st.mat / 100, 0.7], [t('isolante', 'insulation'), Math.max(1e-6, st.iso / 100), 0.035], [t('intonaco', 'plaster'), 0.015, 0.9]], R = parete(S, st.Ti, st.Te, 7.7, 25);
      var tot = S.reduce(function (a, s) { return a + s[1]; }, 0), P = F.pennello(cv), q = P.q, W = P.W, H = P.H, x0 = 40, Wd = W - 80, X = function (x) { return x0 + x / tot * Wd; }, Y = function (T) { return H - 30 - (T - Math.min(st.Te, st.Ti) + 2) / (Math.abs(st.Ti - st.Te) + 4) * (H - 60); };
      var cols = ['#c9b9a6', '#c46a4a', '#ffe08a', '#d8cfc4'], x = 0;
      S.forEach(function (s, i) { q.fillStyle = cols[i]; q.globalAlpha = 0.35; q.fillRect(X(x), 20, X(x + s[1]) - X(x), H - 50); q.globalAlpha = 1; q.fillStyle = '#c9d3df'; q.font = '11px system-ui'; if (X(x + s[1]) - X(x) > 40) q.fillText(s[0], X(x) + 3, H - 14); x += s[1]; });
      q.strokeStyle = '#ff8a80'; q.lineWidth = 2.5; q.beginPath(); x = 0; q.moveTo(X(0), Y(R.T[1])); S.forEach(function (s, i) { x += s[1]; q.lineTo(X(x), Y(R.T[i + 2])); }); q.stroke(); q.lineWidth = 1;
      q.fillStyle = '#e6fffb'; q.fillText(fmt(R.T[1]) + ' °C', X(0) - 36, Y(R.T[1]) - 6); q.fillText(fmt(R.T[R.T.length - 2]) + ' °C', X(tot) + 4, Y(R.T[R.T.length - 2]) - 6);
      cv.setAttribute('aria-label', t('profilo di temperatura in una parete', 'temperature profile in a wall'));
      info.innerHTML = t('Resistenze termiche in serie: ', 'Thermal resistances in series: ') + 'R = Σ L/λ + 1/h = <b>' + fmt(R.Rt) + ' m²K/W</b> · U = 1/R = <b class="bsiFX-num">' + fmt(R.U) + ' W/(m²K)</b><br>' + t('Flusso ', 'Flux ') + 'q = ΔT/R = ' + fmt(R.q) + ' W/m² · ' + t('su 100 m² di pareti in un inverno (2500 gradi-giorno): ', 'over 100 m² of walls in a winter (2500 degree-days): ') + fmt(R.U * 100 * 2500 * 24 / 1000) + ' kWh<br>' + t('Come resistenze elettriche: la temperatura cade soprattutto nello strato più resistente, l’isolante. Pochi centimetri di isolante valgono decine di centimetri di mattone.', 'Like electrical resistors: temperature drops mostly across the most resistive layer, the insulation. A few centimetres of insulation are worth tens of centimetres of brick.');
    }
    disegna(); F.alRidimensiona(disegna);
  }

  F.sezione('sfiscalore', {
    titolo: ['🔥 Calore e diffusione', '🔥 Heat and diffusion'],
    sotto: ['L’equazione del calore in una barra e su una piastra, il raffreddamento di Newton contro l’irraggiamento, le pareti come resistenze termiche in serie: la stessa matematica della diffusione di Fick.', 'The heat equation in a bar and on a plate, Newton cooling versus radiation, walls as thermal resistances in series: the same mathematics as Fick diffusion.'],
    schede: [
      { nome: ['📏 Barra', '📏 Bar'], costruisci: schedaBarra },
      { nome: ['🟥 Piastra', '🟥 Plate'], costruisci: schedaPiastra },
      { nome: ['☕ Raffreddamento', '☕ Cooling'], costruisci: schedaRaffreddamento },
      { nome: ['🧱 Pareti', '🧱 Walls'], costruisci: schedaParete }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
