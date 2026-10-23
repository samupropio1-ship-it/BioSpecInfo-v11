/* ═══════════════════════════════════════════════════════════════════════════
   bsi-fis-onde.js — 〰️ onde e ottica
   BioSpecInfo · © Samuele Pio Provenzano

   · SOVRAPPOSIZIONE: due onde y = A sin(kx ∓ ωt) che si sommano e si
     muovono: battimenti (frequenze vicine, inviluppo a f₁ − f₂), onda
     stazionaria (due onde opposte, nodi ogni λ/2), pacchetto con velocita'
     di gruppo diversa da quella di fase;
   · OTTICA GEOMETRICA: lente sottile (convergente o divergente) o specchio
     sferico; i tre raggi principali tracciati, l'immagine dalla legge dei
     punti coniugati 1/p + 1/q = 1/f, con ingrandimento, reale o virtuale,
     dritta o capovolta;
   · DIFFRAZIONE: N fenditure di larghezza a e passo d,
     I(θ) = I₀ (sin β/β)² (sin Nα / (N sin α))², α = π d sin θ/λ,
     β = π a sin θ/λ; la figura vista sullo schermo nel colore della luce,
     i massimi principali d sin θ = mλ, il potere risolutivo R = mN.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt;
  function griglia(div) { var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); G.appendChild(pan); G.appendChild(dx); div.appendChild(G); return { pan: pan, dx: dx }; }
  function pennello(c) {
    var dpr = Math.min(2, globale.devicePixelRatio || 1), w = Math.max(280, c.clientWidth || (c.parentNode && c.parentNode.clientWidth) || 600), h = Math.round(w * c._rapporto);
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    var q = c.getContext('2d'); q.setTransform(dpr, 0, 0, dpr, 0, 0); q.fillStyle = '#081522'; q.fillRect(0, 0, w, h);
    return { q: q, W: w, H: h };
  }
  function anima(c, passo) {
    var vivo = true, prec = 0;
    function giro(ora) { if (!vivo || !c.isConnected) return; if (c.offsetParent !== null) { var dt = prec ? Math.min(0.05, (ora - prec) / 1000) : 0.016; prec = ora; if (passo(dt) === false) return; } else prec = 0; globale.requestAnimationFrame(giro); }
    globale.requestAnimationFrame(giro); return { ferma: function () { vivo = false; } };
  }
  function nota(pan) { var n = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(n); return n; }

  /* ═══ calcoli ═══════════════════════════════════════════════════════════ */
  /* immagine di una lente sottile o di uno specchio (convenzione reale-positiva) */
  function immagine(f, p) {
    if (Math.abs(p - f) < 1e-12) return { q: Infinity, M: Infinity, reale: false, infinito: true };
    var q = 1 / (1 / f - 1 / p);
    return { q: q, M: -q / p, reale: q > 0, dritta: -q / p > 0 };
  }
  /* intensita' di N fenditure (normalizzata a 1 al centro) */
  function reticolo(theta, lam, a, d, N) {
    var s = Math.sin(theta), b = Math.PI * a * s / lam, al = Math.PI * d * s / lam;
    var dif = Math.abs(b) < 1e-9 ? 1 : Math.pow(Math.sin(b) / b, 2);
    var den = N * Math.sin(al), intf = Math.abs(den) < 1e-9 ? 1 : Math.pow(Math.sin(N * al) / den, 2);
    return dif * intf;
  }
  /* colore approssimato di una lunghezza d'onda visibile (nm) */
  function coloreLambda(nm) {
    var r = 0, g = 0, b = 0;
    if (nm < 440) { r = -(nm - 440) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; } else if (nm < 510) { g = 1; b = -(nm - 510) / 20; } else if (nm < 580) { r = (nm - 510) / 70; g = 1; } else if (nm < 645) { r = 1; g = -(nm - 645) / 65; } else r = 1;
    var fattore = nm < 420 ? 0.3 + 0.7 * (nm - 380) / 40 : nm > 700 ? 0.3 + 0.7 * (780 - nm) / 80 : 1;
    return [Math.max(0, r * fattore), Math.max(0, g * fattore), Math.max(0, b * fattore)];
  }
  F.calcolo.onde = { immagine: immagine, reticolo: reticolo, coloreLambda: coloreLambda };

  /* ═══ 1. sovrapposizione ════════════════════════════════════════════════ */
  function schedaSovrapposizione(div) {
    var G = griglia(div), st = { caso: 'batt', f1: 1, f2: 1.1, A1: 1, A2: 1 }, info, tt = 0;
    var c = F.tela(G.dx, 0.62);
    F.scelta(G.pan, ['Fenomeno', 'Phenomenon'], [['batt', t('Battimenti (stessa direzione)', 'Beats (same direction)')], ['staz', t('Onda stazionaria (versi opposti)', 'Standing wave (opposite directions)')], ['grup', t('Velocità di gruppo e di fase', 'Group and phase velocity')]], st.caso, function (v) { st.caso = v; testo(); });
    F.cursore(G.pan, ['f₁ (Hz)', 'f₁ (Hz)'], 0.2, 3, 0.05, st.f1, function (v) { st.f1 = v; testo(); }, function (v) { return v.toFixed(2); });
    F.cursore(G.pan, ['f₂ (Hz)', 'f₂ (Hz)'], 0.2, 3, 0.05, st.f2, function (v) { st.f2 = v; testo(); }, function (v) { return v.toFixed(2); });
    F.cursore(G.pan, ['A₂ / A₁', 'A₂ / A₁'], 0, 1, 0.05, st.A2, function (v) { st.A2 = v; testo(); }, function (v) { return v.toFixed(2); });
    info = nota(G.pan);
    /* v = 1 m/s per entrambe nei primi due casi; nel terzo dispersione ω = c k² (acqua profonda alla rovescia, per far vedere v_g = 2 v_f) */
    function onda(x, tt, f, verso) {
      if (st.caso === 'grup') { var k = Math.sqrt(2 * Math.PI * f / 1), w = 2 * Math.PI * f; return Math.sin(k * 2 * Math.PI * x - w * tt); }
      return Math.sin(2 * Math.PI * f * (x - verso * tt));
    }
    function testo() {
      if (st.caso === 'batt') info.innerHTML = t('Due onde nello stesso verso con frequenze vicine: la somma è un’onda a (f₁+f₂)/2 = ', 'Two waves in the same direction with close frequencies: the sum is a wave at (f₁+f₂)/2 = ') + fmt((st.f1 + st.f2) / 2) + ' Hz ' + t('modulata da un inviluppo; si sentono ', 'modulated by an envelope; one hears ') + '<b>|f₁ − f₂| = ' + fmt(Math.abs(st.f1 - st.f2)) + t(' battimenti al secondo', ' beats per second') + '</b>. ' + t('Così si accordano gli strumenti: i battimenti spariscono quando le frequenze coincidono.', 'This is how instruments are tuned: the beats vanish when the frequencies match.');
      else if (st.caso === 'staz') info.innerHTML = t('Due onde uguali in versi opposti: y = 2A sin(kx) cos(ωt). I nodi stanno fermi a distanza λ/2 = ', 'Two equal waves in opposite directions: y = 2A sin(kx) cos(ωt). Nodes stay still λ/2 = ') + fmt(1 / st.f1 / 2) + ' m ' + t('(con v = 1 m/s); ', 'apart (with v = 1 m/s); ') + t('con ampiezze diverse rimane una parte che viaggia (rapporto d’onda stazionaria ', 'with unequal amplitudes a travelling part remains (standing-wave ratio ') + fmt((1 + st.A2) / Math.max(1e-9, 1 - st.A2)) + ').' + (Math.abs(st.f1 - st.f2) > 1e-9 ? t(' Qui si usa solo f₁.', ' Only f₁ is used here.') : '');
      else { var k1 = 2 * Math.PI * Math.sqrt(2 * Math.PI * st.f1), k2 = 2 * Math.PI * Math.sqrt(2 * Math.PI * st.f2), w1 = 2 * Math.PI * st.f1, w2 = 2 * Math.PI * st.f2; info.innerHTML = t('Mezzo dispersivo (ω ∝ k²): le creste viaggiano a v_f = ω/k, l’inviluppo a v_g = dω/dk. Qui ', 'Dispersive medium (ω ∝ k²): crests travel at v_f = ω/k, the envelope at v_g = dω/dk. Here ') + 'v_f ≈ ' + fmt((w1 + w2) / (k1 + k2)) + ' m/s, v_g ≈ ' + fmt((w2 - w1) / (k2 - k1 || 1e-9)) + ' m/s: ' + t('l’inviluppo corre al doppio delle creste. L’energia e l’informazione viaggiano con l’inviluppo.', 'the envelope runs twice as fast as the crests. Energy and information travel with the envelope.'); }
    }
    testo();
    anima(c, function (dt) {
      tt += dt;
      var P = pennello(c), q = P.q, W = P.W, H = P.H, L = 6, X = function (x) { return 10 + x / L * (W - 20); }, righe = [H * 0.18, H * 0.4, H * 0.74], amp = H * 0.08;
      var curve = [[function (x) { return st.A1 * onda(x, tt, st.f1, 1); }, '#5eead4', righe[0], amp], [function (x) { return st.A2 * onda(x, tt, st.caso === 'staz' ? st.f1 : st.f2, st.caso === 'staz' ? -1 : 1); }, '#ff8a80', righe[1], amp], [function (x) { return st.A1 * onda(x, tt, st.f1, 1) + st.A2 * onda(x, tt, st.caso === 'staz' ? st.f1 : st.f2, st.caso === 'staz' ? -1 : 1); }, '#ffd24a', righe[2], amp]];
      curve.forEach(function (C) {
        q.strokeStyle = '#1d2f49'; q.lineWidth = 1; q.beginPath(); q.moveTo(10, C[2]); q.lineTo(W - 10, C[2]); q.stroke();
        q.strokeStyle = C[1]; q.lineWidth = 2; q.beginPath(); for (var i = 0; i <= 600; i++) { var x = L * i / 600, y = C[2] - C[0](x) * C[3]; if (i) q.lineTo(X(x), y); else q.moveTo(X(x), y); } q.stroke();
      });
      if (st.caso === 'staz') { q.fillStyle = '#ffd24a'; var lam = 1 / st.f1; for (var n = 0; n * lam / 2 <= L; n++) { q.beginPath(); q.arc(X(n * lam / 2), righe[2], 3.5, 0, Math.PI * 2); q.fill(); } }
      if (st.caso === 'batt') { q.strokeStyle = 'rgba(255,210,74,.45)'; q.setLineDash([4, 4]); [1, -1].forEach(function (s) { q.beginPath(); for (var i = 0; i <= 300; i++) { var x = L * i / 300, inv = Math.sqrt(st.A1 * st.A1 + st.A2 * st.A2 + 2 * st.A1 * st.A2 * Math.cos(2 * Math.PI * (st.f2 - st.f1) * (x - tt))), y = righe[2] - s * inv * amp; if (i) q.lineTo(X(x), y); else q.moveTo(X(x), y); } q.stroke(); }); q.setLineDash([]); }
      q.fillStyle = '#9fb1c6'; q.font = '12px system-ui'; q.textAlign = 'left'; q.fillText(t('onda 1', 'wave 1'), 12, righe[0] - amp - 4); q.fillText(t('onda 2', 'wave 2'), 12, righe[1] - amp - 4); q.fillText(t('somma', 'sum'), 12, righe[2] - 2 * amp - 6);
      c.setAttribute('aria-label', t('sovrapposizione di due onde', 'superposition of two waves'));
    });
  }

  /* ═══ 2. ottica geometrica ══════════════════════════════════════════════ */
  function schedaOttica(div) {
    var G = griglia(div), st = { tipo: 'conv', f: 10, p: 25, h: 4 }, info;
    var c = F.tela(G.dx, 0.55);
    F.scelta(G.pan, ['Elemento', 'Element'], [['conv', t('Lente convergente', 'Converging lens')], ['div', t('Lente divergente', 'Diverging lens')], ['conc', t('Specchio concavo', 'Concave mirror')], ['cvx', t('Specchio convesso', 'Convex mirror')]], st.tipo, function (v) { st.tipo = v; disegna(); });
    F.cursore(G.pan, ['|f| focale (cm)', '|f| focal length (cm)'], 3, 30, 0.5, st.f, function (v) { st.f = v; disegna(); });
    F.cursore(G.pan, ['p distanza dell’oggetto (cm)', 'p object distance (cm)'], 1, 60, 0.5, st.p, function (v) { st.p = v; disegna(); });
    F.cursore(G.pan, ['altezza dell’oggetto (cm)', 'object height (cm)'], 1, 8, 0.5, st.h, function (v) { st.h = v; disegna(); });
    info = nota(G.pan);
    function disegna() {
      var specchio = st.tipo === 'conc' || st.tipo === 'cvx', f = (st.tipo === 'conv' || st.tipo === 'conc') ? st.f : -st.f, I = immagine(f, st.p);
      var P = pennello(c), q = P.q, W = P.W, H = P.H, xs = 70, ox = specchio ? W * 0.72 : W * 0.5, sc = (specchio ? ox - 20 : W / 2 - 20) / xs, y0 = H / 2, ysc = H * 0.4 / 10;
      /* in uno specchio l'oggetto e l'immagine reale stanno dallo stesso lato: si disegna la x «ripiegata» */
      var Xo = function (d) { return ox - d * sc; }, Xi = function (d) { return specchio ? ox - d * sc : ox + d * sc; }, Y = function (y) { return y0 - y * ysc; };
      q.strokeStyle = '#34465f'; q.lineWidth = 1; q.beginPath(); q.moveTo(0, y0); q.lineTo(W, y0); q.stroke();
      /* fuochi */
      q.fillStyle = '#ffd24a'; q.font = '11px system-ui'; q.textAlign = 'center';
      [f, -f].forEach(function (ff, i) { var x = specchio ? (i ? null : ox - ff * sc) : ox + ff * sc; if (x === null) return; q.beginPath(); q.arc(x, y0, 3.5, 0, Math.PI * 2); q.fill(); q.fillText('F', x, y0 + 15); });
      /* l'elemento */
      q.strokeStyle = '#6bcfff'; q.lineWidth = 3; q.beginPath();
      if (specchio) { var curv = st.tipo === 'conc' ? 1 : -1; for (var i = -40; i <= 40; i++) { var yy = i / 40 * H * 0.42, xx = ox + curv * yy * yy / (4 * 2 * st.f * sc) * 0.6; if (i === -40) q.moveTo(xx, y0 + yy); else q.lineTo(xx, y0 + yy); } q.stroke(); }
      else { q.moveTo(ox, y0 - H * 0.42); q.lineTo(ox, y0 + H * 0.42); q.stroke(); var pun = st.tipo === 'conv' ? 1 : -1; [[-1, 1], [1, -1]].forEach(function (s) { var yy = y0 + s[0] * H * 0.42; q.beginPath(); q.moveTo(ox - 8, yy + s[1] * 8 * pun); q.lineTo(ox, yy); q.lineTo(ox + 8, yy + s[1] * 8 * pun); q.stroke(); }); }
      /* l'oggetto */
      function freccia(x, y, col, tratt) { q.strokeStyle = col; q.fillStyle = col; q.lineWidth = 3; q.setLineDash(tratt ? [5, 4] : []); q.beginPath(); q.moveTo(x, y0); q.lineTo(x, y); q.stroke(); q.setLineDash([]); var s = y < y0 ? 1 : -1; q.beginPath(); q.moveTo(x, y); q.lineTo(x - 6, y + 9 * s); q.lineTo(x + 6, y + 9 * s); q.fill(); }
      freccia(Xo(st.p), Y(st.h), '#5eead4');
      /* i tre raggi principali dalla punta dell'oggetto */
      var px = Xo(st.p), py = Y(st.h), hi = I.infinito ? null : -I.M * -st.h, imgX = I.infinito ? null : Xi(I.q), imgY = I.infinito ? null : Y(I.M * st.h);
      q.lineWidth = 1.6;
      function raggio(col, punti, virtuale) { q.strokeStyle = col; q.beginPath(); q.moveTo(punti[0][0], punti[0][1]); for (var i = 1; i < punti.length; i++) q.lineTo(punti[i][0], punti[i][1]); q.stroke(); if (virtuale) { q.setLineDash([4, 4]); q.strokeStyle = col.replace(')', ',.55)').replace('rgb', 'rgba'); q.beginPath(); q.moveTo(virtuale[0][0], virtuale[0][1]); q.lineTo(virtuale[1][0], virtuale[1][1]); q.stroke(); q.setLineDash([]); } }
      function prolunga(x1, y1, x2, y2, xFine) { var m = (y2 - y1) / (x2 - x1); return [xFine, y2 + m * (xFine - x2)]; }
      var bordo = specchio ? 0 : W, colori = ['rgb(255,138,128)', 'rgb(124,111,255)', 'rgb(255,210,74)'];
      if (!specchio) {
        /* 1. parallelo all'asse, poi per il fuoco (o come se venisse dal fuoco) */
        var F2 = [ox + f * sc, y0], r1b = prolunga(ox, py, F2[0], F2[1], bordo);
        if (f > 0) raggio(colori[0], [[px, py], [ox, py], r1b]); else raggio(colori[0], [[px, py], [ox, py], prolunga(ox - f * sc, y0, ox, py, bordo)], [[ox, py], [ox + f * sc, y0]]);
        /* 2. per il centro: dritto */
        raggio(colori[1], [[px, py], prolunga(px, py, ox, y0, bordo)]);
        /* 3. per il primo fuoco (o diretto verso il secondo), poi parallelo */
        var F1 = [ox - f * sc, y0], yL = py + (y0 - py) * (ox - px) / (F1[0] - px);
        if (isFinite(yL) && Math.abs(yL - y0) < H) raggio(colori[2], [[px, py], [ox, yL], [bordo, yL]], f < 0 ? [[ox, yL], [0, yL]] : null);
        if (I.reale === false && !I.infinito) { q.setLineDash([4, 4]); q.strokeStyle = 'rgba(255,138,128,.55)'; q.beginPath(); q.moveTo(ox, py); q.lineTo(imgX, imgY); q.stroke(); q.strokeStyle = 'rgba(124,111,255,.55)'; q.beginPath(); q.moveTo(px, py); q.lineTo(imgX, imgY); q.stroke(); q.setLineDash([]); }
      } else {
        /* specchio: raggio parallelo che si riflette per il fuoco; raggio per il centro di curvatura che torna indietro */
        var Fx = ox - f * sc, Cx = ox - 2 * f * sc;
        raggio(colori[0], [[px, py], [ox, py], prolunga(ox, py, Fx, y0, 0)], f < 0 ? [[ox, py], [Fx, y0]] : null);
        raggio(colori[1], [[px, py], [ox, prolunga(px, py, Cx, y0, ox)[1]], [px, py]], f < 0 ? [[ox, prolunga(px, py, Cx, y0, ox)[1]], [Cx, y0]] : null);
        q.fillStyle = '#c9d3df'; q.beginPath(); q.arc(Cx, y0, 3, 0, Math.PI * 2); q.fill(); q.fillText('C', Cx, y0 + 15);
      }
      if (!I.infinito && Math.abs(I.q) < 1e4) freccia(imgX, imgY, '#ff8a80', !I.reale);
      c.setAttribute('aria-label', t('costruzione dell’immagine con i raggi principali', 'image construction with principal rays'));
      info.innerHTML = I.infinito ? t('L’oggetto è nel fuoco: i raggi escono paralleli, l’immagine è all’infinito.', 'The object is at the focus: rays leave parallel, the image is at infinity.') :
        '1/p + 1/q = 1/f → q = <b class="bsiFX-num">' + fmt(I.q) + ' cm</b>' + (specchio ? '' : '') + '<br>' + t('Ingrandimento ', 'Magnification ') + 'M = −q/p = <b class="bsiFX-num">' + fmt(I.M) + '</b><br>' + t('Immagine ', 'Image ') + '<b>' + (I.reale ? t('reale', 'real') : t('virtuale', 'virtual')) + ', ' + (I.dritta ? t('dritta', 'upright') : t('capovolta', 'inverted')) + ', ' + (Math.abs(I.M) > 1 ? t('ingrandita', 'enlarged') : t('rimpicciolita', 'reduced')) + '</b>' +
        '<br>' + t('Convenzione: f > 0 per lenti convergenti e specchi concavi; q > 0 immagine reale (oltre la lente, davanti allo specchio).', 'Convention: f > 0 for converging lenses and concave mirrors; q > 0 real image (beyond the lens, in front of the mirror).');
    }
    disegna(); F.alRidimensiona(disegna);
  }

  /* ═══ 3. diffrazione ════════════════════════════════════════════════════ */
  function schedaDiffrazione(div) {
    var G = griglia(div), st = { lam: 550, a: 2, d: 8, N: 2 }, info;
    F.cursore(G.pan, ['λ (nm)', 'λ (nm)'], 380, 750, 5, st.lam, function (v) { st.lam = v; disegna(); });
    F.cursore(G.pan, ['N fenditure', 'N slits'], 1, 20, 1, st.N, function (v) { st.N = v; disegna(); });
    F.cursore(G.pan, ['larghezza a (μm)', 'width a (μm)'], 0.5, 10, 0.5, st.a, function (v) { st.a = v; if (st.d < st.a) st.d = st.a; disegna(); });
    F.cursore(G.pan, ['passo d (μm)', 'spacing d (μm)'], 1, 30, 0.5, st.d, function (v) { st.d = Math.max(v, st.a); disegna(); });
    info = nota(G.pan);
    var schermo = F.tela(G.dx, 0.12), c = F.tela(G.dx, 0.5);
    function disegna() {
      var lam = st.lam * 1e-3, tmax = Math.asin(Math.min(1, 3.2 * lam / st.a)), xs = [], ys = [], inv = [];
      for (var i = -800; i <= 800; i++) { var th = tmax * i / 800; xs.push(th * 180 / Math.PI); ys.push(reticolo(th, lam, st.a, st.d, st.N)); inv.push(Math.pow(Math.abs(th) < 1e-12 ? 1 : Math.sin(Math.PI * st.a * Math.sin(th) / lam) / (Math.PI * st.a * Math.sin(th) / lam), 2)); }
      var col = coloreLambda(st.lam), cs = 'rgb(' + col.map(function (v) { return Math.round(v * 255); }).join(',') + ')';
      F.grafico(c, { serie: [{ x: xs, y: inv, col: '#8494a8', tratt: true, etich: ['diffrazione di una fenditura', 'single-slit envelope'] }, { x: xs, y: ys, col: cs, larg: 2, etich: ['intensità', 'intensity'] }], ymin: 0, ymax: 1.05, xl: ['θ (°)', 'θ (°)'], yl: ['I / I₀', 'I / I₀'], legenda: [{ col: cs, etich: ['intensità', 'intensity'] }, { col: '#8494a8', etich: ['inviluppo (1 fenditura)', 'envelope (1 slit)'] }] });
      /* lo schermo: la luce come la si vedrebbe */
      var P = pennello(schermo), q = P.q, W = P.W, H = P.H;
      for (var x = 0; x < W; x++) { var th2 = tmax * (2 * x / W - 1), I = Math.pow(reticolo(th2, lam, st.a, st.d, st.N), 0.6); q.fillStyle = 'rgb(' + col.map(function (v) { return Math.round(v * 255 * I); }).join(',') + ')'; q.fillRect(x, 0, 1, H); }
      schermo.setAttribute('aria-label', t('figura sullo schermo', 'pattern on the screen'));
      var ordini = []; for (var m = 1; m * lam / st.d <= 1 && m <= 6; m++) ordini.push(m + ': ' + fmt(Math.asin(m * lam / st.d) * 180 / Math.PI) + '°');
      var mancanti = []; for (m = 1; m <= 6; m++) { var r = m * st.d / st.a; if (Math.abs(r - Math.round(r)) < 1e-9 && Math.round(r) <= 6) mancanti.push(Math.round(r)); }
      info.innerHTML = (st.N === 1 ? t('Una fenditura: minimi a a sin θ = mλ; il primo a ', 'One slit: minima at a sin θ = mλ; the first at ') + '<b>' + fmt(Math.asin(Math.min(1, lam / st.a)) * 180 / Math.PI) + '°</b>' :
        t('Massimi principali a d sin θ = mλ: ', 'Principal maxima at d sin θ = mλ: ') + '<b>' + (ordini.join(' · ') || '—') + '</b><br>' + t('Fra due massimi principali ci sono N − 2 = ', 'Between two principal maxima there are N − 2 = ') + (st.N - 2) + t(' massimi secondari; più fenditure, picchi più stretti (larghezza ∝ 1/N).', ' secondary maxima; more slits, narrower peaks (width ∝ 1/N).') + '<br>' + t('Potere risolutivo al primo ordine ', 'Resolving power at first order ') + 'R = λ/Δλ = mN = <b>' + st.N + '</b>' + (mancanti.length ? '<br>' + t('Ordini mancanti (cadono su un minimo di diffrazione, d/a intero): ', 'Missing orders (falling on a diffraction minimum, d/a integer): ') + mancanti.slice(0, 3).join(', ') : ''));
    }
    disegna(); F.alRidimensiona(disegna);
  }

  F.sezione('sfisonde', {
    titolo: ['〰️ Onde e ottica', '〰️ Waves and optics'],
    sotto: ['Onde che si sommano (battimenti, onde stazionarie, velocità di gruppo), lenti e specchi con i raggi principali, la diffrazione da una o più fenditure con i colori della luce.', 'Waves adding up (beats, standing waves, group velocity), lenses and mirrors with the principal rays, diffraction from one or more slits in the colours of light.'],
    schede: [
      { nome: ['〰️ Sovrapposizione', '〰️ Superposition'], costruisci: schedaSovrapposizione },
      { nome: ['🔍 Lenti e specchi', '🔍 Lenses and mirrors'], costruisci: schedaOttica },
      { nome: ['🌈 Diffrazione', '🌈 Diffraction'], costruisci: schedaDiffrazione }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
