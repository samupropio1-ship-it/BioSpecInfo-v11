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
     i massimi principali d sin θ = mλ, il potere risolutivo R = mN;
   · ONDOSCOPIO 3D (v238): la superficie dell'acqua mossa da due sorgenti,
     con le linee nodali (iperboli r₁ − r₂ = (m + ½)λ), λ, d e sfasamento.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt;
  function griglia(div) { var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); G.appendChild(pan); G.appendChild(dx); div.appendChild(G); return { pan: pan, dx: dx }; }
  /* il motore comune delle animazioni (pausa, velocita', ricomincia) e la tela pulita */
  var anima = F.anima, pennello = F.pennello;
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
  /* v238 — l'ondoscopio: due sorgenti puntiformi in (−d/2, 0) e (+d/2, 0) con la stessa frequenza,
     la seconda in ritardo di fase φ. Ogni onda circolare sulla superficie, se P.smorza, cala come
     1/√r (l'energia si distribuisce su un cerchio che cresce): a = 1/√(1 + r/λ).
     z(x, y, t) = a₁ cos(k r₁ − ωt) + a₂ cos(k r₂ − ωt − φ) */
  function ampiezze(x, y, P) {
    var r1 = Math.hypot(x + P.d / 2, y), r2 = Math.hypot(x - P.d / 2, y);
    return { r1: r1, r2: r2, a1: P.smorza ? 1 / Math.sqrt(1 + r1 / P.lam) : 1, a2: P.smorza ? 1 / Math.sqrt(1 + r2 / P.lam) : 1 };
  }
  function ondoscopio(x, y, tt, P) {
    var k = 2 * Math.PI / P.lam, w = 2 * Math.PI * (P.f || 1), q = ampiezze(x, y, P);
    return q.a1 * Math.cos(k * q.r1 - w * tt) + q.a2 * Math.cos(k * q.r2 - w * tt - (P.fase || 0));
  }
  /* l'ampiezza con cui oscilla il punto: |a₁ + a₂ e^{i(k(r₁ − r₂) + φ)}| */
  function inviluppo(x, y, P) {
    var q = ampiezze(x, y, P), k = 2 * Math.PI / P.lam;
    return Math.sqrt(Math.max(0, q.a1 * q.a1 + q.a2 * q.a2 + 2 * q.a1 * q.a2 * Math.cos(k * (q.r1 - q.r2) + (P.fase || 0))));
  }
  /* le linee nodali (interferenza distruttiva): k(r₁ − r₂) + φ = (2m+1)π, cioe' r₁ − r₂ = Δ_m con |Δ_m| < d.
     Sono iperboli con i fuochi nelle sorgenti; lontano tendono alle rette sin θ_m = Δ_m/d (θ dall'asse y) */
  function lineeNodali(lam, d, fase) {
    var out = [], k = 2 * Math.PI / lam;
    for (var m = -60; m <= 60; m++) { var D = ((2 * m + 1) * Math.PI - (fase || 0)) / k; if (Math.abs(D) < d - 1e-12) out.push({ m: m, delta: D, theta: Math.asin(D / d) }); }
    return out;
  }
  /* un punto dell'iperbole r₁ − r₂ = Δ (parametro u): x = (Δ/2) cosh u, y = b sinh u, b² = (d/2)² − (Δ/2)² */
  function puntoIperbole(D, d, u) { var a = D / 2, b = Math.sqrt(Math.max(0, d * d / 4 - a * a)); return [a * Math.cosh(u), b * Math.sinh(u)]; }
  F.calcolo.onde = { immagine: immagine, reticolo: reticolo, coloreLambda: coloreLambda, ondoscopio: ondoscopio, inviluppo: inviluppo, lineeNodali: lineeNodali, puntoIperbole: puntoIperbole };

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

  /* ═══ 4. ondoscopio in 3D (v238) ═══════════════════════════════════════ */
  function schedaOndoscopio(pan) {
    var st = { lam: 1.2, d: 3.6, fase: 0, smorza: true, colore: 'altezza' }, cb = {};
    function P() { return { lam: st.lam, d: st.d, fase: st.fase * Math.PI / 180, smorza: st.smorza, f: 0.8 }; }
    F.cursore(pan, ['lunghezza d’onda λ (cm)', 'wavelength λ (cm)'], 0.5, 3, 0.05, st.lam, function (v) { st.lam = v; nuovo(); }, function (v) { return v.toFixed(2); });
    F.cursore(pan, ['distanza fra le sorgenti d (cm)', 'source separation d (cm)'], 0.5, 6, 0.1, st.d, function (v) { st.d = v; nuovo(); }, function (v) { return v.toFixed(1); });
    F.cursore(pan, ['sfasamento φ fra le sorgenti (°)', 'phase difference φ between sources (°)'], 0, 360, 5, st.fase, function (v) { st.fase = v; nuovo(); });
    F.scelta(pan, ['Colore della superficie', 'Surface colour'], [['altezza', t('altezza istantanea', 'instantaneous height')], ['intensita', t('intensità media (ampiezza²)', 'mean intensity (amplitude²)')]], st.colore, function (v) { st.colore = v; nuovo(); });
    var cc = F.el('input', { type: 'checkbox' }); cc.checked = st.smorza; cc.addEventListener('change', function () { st.smorza = cc.checked; nuovo(); });
    pan.appendChild(F.el('label', { style: 'display:flex;align-items:center;gap:6px;margin:4px 0;font-size:.86rem;color:#cfe3f7;cursor:pointer' }, [cc, F.el('span', { testo: t('onde che calano come 1/√r', 'waves decaying as 1/√r') })]));
    var info = nota(pan), spiega = nota(pan);
    spiega.innerHTML = t('Due punte che battono sull’acqua con la stessa frequenza: le onde circolari si sommano. Dove arrivano cresta su cresta l’acqua oscilla il doppio (interferenza costruttiva), dove arrivano cresta su ventre resta ferma: le linee nodali (rosse) sono iperboli con i fuochi nelle sorgenti, i punti con differenza di cammino r₁ − r₂ = (m + ½)λ. Lontano diventano rette con sin θ = (m + ½)λ/d: è la stessa geometria della doppia fenditura di Young. Lo sfasamento φ fa ruotare il ventaglio: è il principio delle antenne a schiera che orientano il fascio senza muoversi.',
      'Two dippers striking the water at the same frequency: the circular waves add up. Where crest meets crest the water oscillates twice as much (constructive interference), where crest meets trough it stays still: the nodal lines (red) are hyperbolas with foci at the sources, the points with path difference r₁ − r₂ = (m + ½)λ. Far away they become straight lines with sin θ = (m + ½)λ/d: the same geometry as Young’s double slit. The phase difference φ swings the fan: the principle of phased-array antennas that steer the beam without moving.');
    function nuovo() {
      var N = lineeNodali(st.lam, st.d, st.fase * Math.PI / 180);
      info.innerHTML = 'd/λ = <b class="bsiFX-num">' + fmt(st.d / st.lam) + '</b> · ' + t('linee nodali: ', 'nodal lines: ') + '<b class="bsiFX-num">' + N.length + '</b><br>' + t('Direzioni lontane (dall’asse fra le sorgenti): ', 'Far-field directions (from the axis between the sources): ') + (N.length ? N.map(function (q) { return fmt(q.theta * 180 / Math.PI) + '°'; }).join(' · ') : '—') +
        '<br>' + t('Frequenza 0,8 Hz, velocità di fase v = λf = ', 'Frequency 0.8 Hz, phase speed v = λf = ') + fmt(st.lam * 0.8) + ' cm/s' + (st.smorza ? '<br>' + t('Con lo smorzamento le due onde non sono uguali dappertutto: i nodi restano minimi, non zeri perfetti.', 'With decay the two waves are not equal everywhere: nodes stay minima, not perfect zeros.') : '');
      if (cb.nuovo) cb.nuovo();
    }
    nuovo();
    return {
      etichetta: ['Ondoscopio 3D: interferenza di due sorgenti con le linee nodali', '3D ripple tank: two-source interference with nodal lines'],
      tre: function (S, T, L3) {
        var NG = 96, LATO = 12, hz = 0.32, geo = new T.PlaneGeometry(LATO, LATO, NG, NG), pos = geo.attributes.position, nv = pos.count;
        var col = new Float32Array(nv * 3); geo.setAttribute('color', new T.BufferAttribute(col, 3));
        var acqua = new T.Mesh(geo, new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.35, metalness: 0.1, side: T.DoubleSide })); S.aggiungi(acqua);
        var bordo = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(LATO, LATO, 1.6)), new T.LineBasicMaterial({ color: 0x34465f })); S.aggiungi(bordo);
        var gr = new T.Group(); S.aggiungi(gr);
        var s1 = L3.sfera(T, 0.14, 0xffd24a, 0, 0, 0, true), s2 = L3.sfera(T, 0.14, 0xffd24a, 0, 0, 0, true); S.aggiungi(s1); S.aggiungi(s2);
        var R1 = new Float32Array(nv), R2 = new Float32Array(nv), A1 = new Float32Array(nv), A2 = new Float32Array(nv), INV = new Float32Array(nv), tt = 0;
        cb.nuovo = function () {
          var p = P();
          for (var i = 0; i < nv; i++) { var x = pos.getX(i), y = pos.getY(i), r1 = Math.hypot(x + p.d / 2, y), r2 = Math.hypot(x - p.d / 2, y); R1[i] = r1; R2[i] = r2; A1[i] = p.smorza ? 1 / Math.sqrt(1 + r1 / p.lam) : 1; A2[i] = p.smorza ? 1 / Math.sqrt(1 + r2 / p.lam) : 1; INV[i] = inviluppo(x, y, p); }
          svuota(gr);
          lineeNodali(p.lam, p.d, p.fase).forEach(function (q) {
            var b = Math.sqrt(Math.max(1e-9, p.d * p.d / 4 - q.delta * q.delta / 4)), U = Math.asinh(7 / b), pts = [];
            for (var k = 0; k <= 160; k++) { var c = puntoIperbole(q.delta, p.d, -U + 2 * U * k / 160); if (Math.abs(c[0]) <= LATO / 2 && Math.abs(c[1]) <= LATO / 2) pts.push([c[0], c[1], 0.03]); }
            if (pts.length > 1) gr.add(L3.linea(T, pts, 0xff6b6b, 0.95));
          });
          s1.position.set(-p.d / 2, 0, 0); s2.position.set(p.d / 2, 0, 0);
          var e1 = L3.testo3d(T, 'S₁', '#ffd24a', 0.36), e2 = L3.testo3d(T, 'S₂', '#ffd24a', 0.36); e1.position.set(-p.d / 2, -0.5, 1.0); e2.position.set(p.d / 2, -0.5, 1.0); gr.add(e1); gr.add(e2);
          gr.add(L3.linea(T, [[-p.d / 2, -LATO / 2 - 0.3, 0], [p.d / 2, -LATO / 2 - 0.3, 0]], 0xffd24a));
          var ed = L3.testo3d(T, 'd = ' + fmt(p.d) + ' cm', '#ffd24a', 0.3); ed.position.set(0, -LATO / 2 - 0.75, 0); gr.add(ed);
          aggiorna(); S.sporca = true; S.avvia();
        };
        function aggiorna() {
          var p = P(), k = 2 * Math.PI / p.lam, w = 2 * Math.PI * p.f, ph = p.fase, inten = st.colore === 'intensita', imax = st.smorza ? 2 : 4;
          for (var i = 0; i < nv; i++) {
            var z = A1[i] * Math.cos(k * R1[i] - w * tt) + A2[i] * Math.cos(k * R2[i] - w * tt - ph); pos.setZ(i, z * hz);
            var r, g2, b;
            if (inten) { var u = Math.min(1, INV[i] * INV[i] / imax); r = 0.05 + 0.95 * Math.pow(u, 0.8); g2 = 0.1 + 0.75 * u; b = 0.25 + 0.1 * (1 - u); }
            else { var v = Math.max(-1, Math.min(1, z / 1.6)); r = v > 0 ? 0.2 + 0.75 * v : 0.12 + 0.08 * (1 + v); g2 = v > 0 ? 0.55 + 0.4 * v : 0.25 + 0.3 * (1 + v); b = v > 0 ? 0.75 + 0.25 * v : 0.45 + 0.3 * (1 + v); }
            col[3 * i] = r; col[3 * i + 1] = g2; col[3 * i + 2] = b;
          }
          pos.needsUpdate = true; geo.attributes.color.needsUpdate = true; geo.computeVertexNormals();
          s1.position.z = hz * Math.cos(-w * tt) + 0.15; s2.position.z = hz * Math.cos(-w * tt - ph) + 0.15;
          S.didascalia.textContent = t('t = ', 't = ') + tt.toFixed(2) + ' s · λ = ' + fmt(p.lam) + ' cm · φ = ' + st.fase + '°';
        }
        cb.nuovo();
        S.ogniFotogramma(function (dt) { if (S.fermo) return false; tt += dt; aggiorna(); return true; });
        S.inquadra(17.5, -1.35, 0.95);
      }
    };
  }

  F.sezione('sfisonde', {
    titolo: ['〰️ Onde e ottica', '〰️ Waves and optics'],
    sotto: ['Onde che si sommano (battimenti, onde stazionarie, velocità di gruppo), lenti e specchi con i raggi principali, la diffrazione da una o più fenditure con i colori della luce.', 'Waves adding up (beats, standing waves, group velocity), lenses and mirrors with the principal rays, diffraction from one or more slits in the colours of light.'],
    schede: [
      { nome: ['〰️ Sovrapposizione', '〰️ Superposition'], costruisci: schedaSovrapposizione },
      { nome: ['🔍 Lenti e specchi', '🔍 Lenses and mirrors'], costruisci: schedaOttica },
      { nome: ['🌈 Diffrazione', '🌈 Diffraction'], costruisci: schedaDiffrazione },
      { nome: ['🌊 Ondoscopio 3D', '🌊 3D ripple tank'], costruisci: scheda3D(schedaOndoscopio) }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
