/* ═══════════════════════════════════════════════════════════════════════════
   bsi-mat-visiva.js — 🎞️ matematica visiva
   BioSpecInfo · © Samuele Pio Provenzano

   · TRASFORMAZIONI LINEARI: la griglia del piano che si deforma con
     continuita' dall'identita' alla matrice A; il quadrato unitario diventa
     un parallelogramma di area |det A|; gli autovettori reali restano sulla
     loro retta e si allungano di λ;
   · EPICICLI DI FOURIER: una figura chiusa (scelta o disegnata con il dito)
     campionata, la sua trasformata discreta, e N cerchi che ruotano a
     frequenze intere e la ridisegnano; con piu' termini si ricostruiscono
     gli spigoli;
   · FRATTALI: l'insieme di Mandelbrot (z → z² + c) con lo zoom al tocco, e
     l'insieme di Julia del punto c scelto;
   · CAOS: la mappa logistica x → r x (1 − x); il diagramma a ragnatela
     delle iterazioni e il diagramma di biforcazione, con il raddoppio del
     periodo e la costante di Feigenbaum.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt;
  function griglia(div) { var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); G.appendChild(pan); G.appendChild(dx); div.appendChild(G); return { pan: pan, dx: dx }; }
  function nota(pan) { var n = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(n); return n; }

  /* ═══ calcoli ═══════════════════════════════════════════════════════════ */
  function autovalori2(a, b, c, d) {
    var tr = a + d, det = a * d - b * c, disc = tr * tr / 4 - det;
    if (disc < -1e-12) return { reali: false, re: tr / 2, im: Math.sqrt(-disc), det: det };
    var s = Math.sqrt(Math.max(0, disc)), l1 = tr / 2 + s, l2 = tr / 2 - s;
    function vec(l) { if (Math.abs(b) > 1e-12) return [b, l - a]; if (Math.abs(c) > 1e-12) return [l - d, c]; return Math.abs(l - a) < 1e-12 ? [1, 0] : [0, 1]; }
    return { reali: true, l1: l1, l2: l2, v1: vec(l1), v2: vec(l2), det: det };
  }
  /* trasformata discreta di Fourier di punti complessi, ordinata per ampiezza */
  function dft(pt) {
    var N = pt.length, out = [];
    for (var k = 0; k < N; k++) { var f = k <= N / 2 ? k : k - N, re = 0, im = 0; for (var n = 0; n < N; n++) { var a = -2 * Math.PI * f * n / N; re += pt[n][0] * Math.cos(a) - pt[n][1] * Math.sin(a); im += pt[n][0] * Math.sin(a) + pt[n][1] * Math.cos(a); } out.push({ f: f, re: re / N, im: im / N, amp: Math.hypot(re, im) / N, fase: Math.atan2(im, re) }); }
    return out.sort(function (p, q) { return q.amp - p.amp; });
  }
  function ricostruisci(coef, N, s) { var x = 0, y = 0; for (var i = 0; i < N && i < coef.length; i++) { var c = coef[i], a = c.f * s + c.fase; x += c.amp * Math.cos(a); y += c.amp * Math.sin(a); } return [x, y]; }
  function mandelbrot(cx, cy, max) { var x = 0, y = 0, i = 0; while (i < max && x * x + y * y <= 4) { var xn = x * x - y * y + cx; y = 2 * x * y + cy; x = xn; i++; } return i < max ? i + 1 - Math.log(Math.log(Math.sqrt(x * x + y * y))) / Math.LN2 : max; }
  function julia(zx, zy, cx, cy, max) { var x = zx, y = zy, i = 0; while (i < max && x * x + y * y <= 4) { var xn = x * x - y * y + cx; y = 2 * x * y + cy; x = xn; i++; } return i < max ? i + 1 - Math.log(Math.log(Math.sqrt(x * x + y * y))) / Math.LN2 : max; }
  /* attrattore della mappa logistica: valori dopo il transiente */
  function attrattore(r, x0, scarto, n) { var x = x0, out = []; for (var i = 0; i < scarto; i++) x = r * x * (1 - x); for (i = 0; i < n; i++) { x = r * x * (1 - x); out.push(x); } return out; }
  function periodo(r) { var a = attrattore(r, 0.3, 4000, 256); for (var p = 1; p <= 64; p++) { var ok = true; for (var i = 0; i + p < a.length; i++) if (Math.abs(a[i] - a[i + p]) > 1e-6) { ok = false; break; } if (ok) return p; } return Infinity; }
  /* forme predefinite: punti di una curva chiusa */
  var FORME = {
    cuore: function (s) { return [16 * Math.pow(Math.sin(s), 3) / 17, (13 * Math.cos(s) - 5 * Math.cos(2 * s) - 2 * Math.cos(3 * s) - Math.cos(4 * s)) / 17]; },
    quadrato: function (s) { var u = s / (2 * Math.PI) * 4, k = Math.floor(u) % 4, f = u - Math.floor(u); return k === 0 ? [-0.8 + 1.6 * f, -0.8] : k === 1 ? [0.8, -0.8 + 1.6 * f] : k === 2 ? [0.8 - 1.6 * f, 0.8] : [-0.8, 0.8 - 1.6 * f]; },
    stella: function (s) { var k = 5, r = 0.55 + 0.35 * Math.cos(k * s); return [r * Math.cos(s), r * Math.sin(s)]; },
    pi: function (s) { var u = s / (2 * Math.PI); /* la lettera π come percorso chiuso */ var P = [[-0.8, 0.6], [0.8, 0.6], [0.8, 0.45], [0.35, 0.45], [0.35, -0.6], [0.2, -0.6], [0.2, 0.45], [-0.25, 0.45], [-0.35, -0.6], [-0.5, -0.6], [-0.4, 0.45], [-0.8, 0.45]]; var L = [], tot = 0; for (var i = 0; i < P.length; i++) { var A = P[i], B = P[(i + 1) % P.length], d = Math.hypot(B[0] - A[0], B[1] - A[1]); L.push(d); tot += d; } var target = u * tot; for (i = 0; i < P.length; i++) { if (target <= L[i]) { var A2 = P[i], B2 = P[(i + 1) % P.length], f = target / L[i]; return [A2[0] + (B2[0] - A2[0]) * f, A2[1] + (B2[1] - A2[1]) * f]; } target -= L[i]; } return P[0]; }
  };
  F.calcolo.visiva = { autovalori2: autovalori2, dft: dft, ricostruisci: ricostruisci, mandelbrot: mandelbrot, julia: julia, attrattore: attrattore, periodo: periodo, FORME: FORME };

  /* ═══ 1. trasformazioni lineari ═════════════════════════════════════════ */
  var MATRICI = { taglio: [['taglio', 'shear'], 1, 1, 0, 1], rotazione: [['rotazione di 45°', 'rotation by 45°'], Math.SQRT1_2, -Math.SQRT1_2, Math.SQRT1_2, Math.SQRT1_2], simm: [['simmetrica (autovettori ortogonali)', 'symmetric (orthogonal eigenvectors)'], 2, 1, 1, 2], riflessione: [['riflessione rispetto a y = x', 'reflection about y = x'], 0, 1, 1, 0], proiezione: [['proiezione sull’asse x (det = 0)', 'projection on the x axis (det = 0)'], 1, 0, 0, 0], dilatazione: [['dilatazione non uniforme', 'non-uniform stretch'], 1.5, 0, 0, 0.5] };
  function schedaTrasformazioni(div) {
    var G = griglia(div), st = { a: 1, b: 1, c: 0, d: 1 }, info = nota(G.pan), u = 0, cursori = F.el('div');
    F.scelta(G.pan, ['Matrice', 'Matrix'], Object.keys(MATRICI).map(function (k) { return [k, F.tt(MATRICI[k][0])]; }), 'taglio', function (v) { var M = MATRICI[v]; st.a = M[1]; st.b = M[2]; st.c = M[3]; st.d = M[4]; costruisci(); testo(); u = 0; ctl.sveglia(); });
    G.pan.appendChild(cursori); G.pan.appendChild(info);
    function costruisci() { cursori.innerHTML = ''; [['a', 'a₁₁'], ['b', 'a₁₂'], ['c', 'a₂₁'], ['d', 'a₂₂']].forEach(function (k) { F.cursore(cursori, [k[1], k[1]], -2, 2, 0.05, st[k[0]], function (v) { st[k[0]] = v; testo(); u = 1; ctl.sveglia(); }, function (v) { return v.toFixed(2); }); }); }
    var cv = F.tela(G.dx, 0.8);
    function testo() {
      var E = autovalori2(st.a, st.b, st.c, st.d);
      info.innerHTML = 'A = [[' + fmt(st.a) + ', ' + fmt(st.b) + '], [' + fmt(st.c) + ', ' + fmt(st.d) + ']] · det A = <b class="bsiFX-num">' + fmt(E.det) + '</b> (' + t('area del quadrato unitario trasformato', 'area of the transformed unit square') + (E.det < 0 ? t('; negativo: l’orientazione si capovolge', '; negative: orientation flips') : E.det === 0 ? t('; nullo: il piano collassa su una retta', '; zero: the plane collapses onto a line') : '') + ')<br>' +
        (E.reali ? t('Autovalori ', 'Eigenvalues ') + 'λ₁ = <b>' + fmt(E.l1) + '</b>, λ₂ = <b>' + fmt(E.l2) + '</b>: ' + t('le rette tratteggiate (autovettori) non ruotano, si allungano di λ.', 'the dashed lines (eigenvectors) do not turn, they stretch by λ.') : t('Autovalori complessi ', 'Complex eigenvalues ') + fmt(E.re) + ' ± ' + fmt(E.im) + 'i: ' + t('nessuna retta resta ferma, la trasformazione contiene una rotazione.', 'no line stays put, the map contains a rotation.')) + '<br>' + t('Le colonne di A sono le immagini dei vettori di base (verde e rosso).', 'The columns of A are the images of the basis vectors (green and red).');
    }
    costruisci(); testo();
    var ctl = F.anima(cv, function (dt) {
      u = Math.min(1, u + dt * 0.6);
      var e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2, a = 1 + (st.a - 1) * e, b = st.b * e, c = st.c * e, d = 1 + (st.d - 1) * e;
      var P = F.pennello(cv), q = P.q, W = P.W, H = P.H, sc = Math.min(W, H) / 9, cx = W / 2, cy = H / 2, T = function (x, y) { return [cx + (a * x + b * y) * sc, cy - (c * x + d * y) * sc]; };
      q.strokeStyle = 'rgba(52,70,95,.5)'; for (var k = -8; k <= 8; k++) { q.beginPath(); q.moveTo(cx + k * sc, 0); q.lineTo(cx + k * sc, H); q.moveTo(0, cy + k * sc); q.lineTo(W, cy + k * sc); q.stroke(); }
      q.strokeStyle = 'rgba(107,207,255,.55)';
      for (k = -6; k <= 6; k++) { var p1 = T(k, -6), p2 = T(k, 6), p3 = T(-6, k), p4 = T(6, k); q.beginPath(); q.moveTo(p1[0], p1[1]); q.lineTo(p2[0], p2[1]); q.moveTo(p3[0], p3[1]); q.lineTo(p4[0], p4[1]); q.stroke(); }
      var Q = [T(0, 0), T(1, 0), T(1, 1), T(0, 1)]; q.fillStyle = 'rgba(255,210,74,.3)'; q.beginPath(); q.moveTo(Q[0][0], Q[0][1]); Q.forEach(function (p) { q.lineTo(p[0], p[1]); }); q.closePath(); q.fill();
      function freccia(p, col) { q.strokeStyle = col; q.fillStyle = col; q.lineWidth = 3; q.beginPath(); q.moveTo(cx, cy); q.lineTo(p[0], p[1]); q.stroke(); var an = Math.atan2(p[1] - cy, p[0] - cx); q.beginPath(); q.moveTo(p[0], p[1]); q.lineTo(p[0] - 10 * Math.cos(an - 0.4), p[1] - 10 * Math.sin(an - 0.4)); q.lineTo(p[0] - 10 * Math.cos(an + 0.4), p[1] - 10 * Math.sin(an + 0.4)); q.fill(); q.lineWidth = 1; }
      freccia(T(1, 0), '#5eead4'); freccia(T(0, 1), '#ff8a80');
      var E = autovalori2(st.a, st.b, st.c, st.d);
      if (E.reali && u >= 1) [E.v1, E.v2].forEach(function (v) { var n = Math.hypot(v[0], v[1]) || 1; q.strokeStyle = 'rgba(255,255,255,.55)'; q.setLineDash([5, 5]); q.beginPath(); q.moveTo(cx - v[0] / n * 6 * sc, cy + v[1] / n * 6 * sc); q.lineTo(cx + v[0] / n * 6 * sc, cy - v[1] / n * 6 * sc); q.stroke(); q.setLineDash([]); });
      cv.setAttribute('aria-label', t('trasformazione lineare del piano', 'linear transformation of the plane'));
      if (u >= 1) return false;
    }, { ricomincia: function () { u = 0; } });
  }

  /* ═══ 2. epicicli di Fourier ════════════════════════════════════════════ */
  function schedaFourier(div) {
    var G = griglia(div), st = { forma: 'cuore', N: 20 }, info = nota(G.pan), punti, coef, s = 0, traccia = [], disegnati = null;
    F.scelta(G.pan, ['Figura', 'Shape'], [['cuore', t('cuore', 'heart')], ['quadrato', t('quadrato', 'square')], ['stella', t('stella', 'star')], ['pi', 'π'], ['mano', t('disegnala tu (sulla tela)', 'draw it yourself (on the canvas)')]], st.forma, function (v) { st.forma = v; if (v !== 'mano') prepara(); else { disegnati = []; info.innerHTML = t('Disegna una figura chiusa sulla tela con il dito o il mouse, poi stacca: verrà ricostruita con gli epicicli.', 'Draw a closed shape on the canvas with your finger or mouse, then lift: it will be rebuilt with epicycles.'); } });
    F.cursore(G.pan, ['cerchi N', 'circles N'], 1, 128, 1, st.N, function (v) { st.N = v; traccia = []; testo(); });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.8);
    function testo() {
      if (!coef) return;
      var err = 0, M = punti.length; for (var i = 0; i < M; i++) { var r = ricostruisci(coef, st.N, 2 * Math.PI * i / M); err += Math.hypot(r[0] - punti[i][0], r[1] - punti[i][1]); } err /= M;
      info.innerHTML = t('Termini usati: ', 'Terms used: ') + st.N + ' / ' + coef.length + ' · ' + t('errore medio della ricostruzione ', 'mean reconstruction error ') + '<b class="bsiFX-num">' + fmt(err) + '</b><br>' + t('Ogni cerchio è un termine c_k e^(ikθ) della serie di Fourier complessa: gira con frequenza intera k e raggio |c_k|. I cerchi sono ordinati dal più grande. Gli spigoli del quadrato richiedono molti termini (coefficienti che calano come 1/k²); il cuore, liscio, pochi.', 'Each circle is a term c_k e^(ikθ) of the complex Fourier series: it turns with integer frequency k and radius |c_k|. Circles are sorted from largest. The square’s corners need many terms (coefficients falling like 1/k²); the smooth heart, few.');
    }
    function prepara(pt) { punti = pt || []; if (!pt) for (var i = 0; i < 256; i++) punti.push(FORME[st.forma](2 * Math.PI * i / 256)); coef = dft(punti); s = 0; traccia = []; testo(); }
    prepara();
    /* disegno a mano */
    var giu = false;
    function pos(e) { var r = cv.getBoundingClientRect(), sc = Math.min(r.width, r.height) / 2.4; return [(e.clientX - r.left - r.width / 2) / sc, -(e.clientY - r.top - r.height / 2) / sc]; }
    cv.addEventListener('pointerdown', function (e) { if (st.forma !== 'mano') return; giu = true; disegnati = [pos(e)]; try { cv.setPointerCapture(e.pointerId); } catch (er) { } });
    cv.addEventListener('pointermove', function (e) { if (giu) disegnati.push(pos(e)); });
    cv.addEventListener('pointerup', function () { if (!giu) return; giu = false; if (disegnati.length > 10) { /* ricampiona a 256 punti equidistanti lungo il percorso chiuso */ var P = disegnati.concat([disegnati[0]]), L = [0]; for (var i = 1; i < P.length; i++) L.push(L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1])); var tot = L[L.length - 1], out = [], j = 0; for (i = 0; i < 256; i++) { var tg = tot * i / 256; while (j < L.length - 2 && L[j + 1] < tg) j++; var f = (tg - L[j]) / Math.max(1e-9, L[j + 1] - L[j]); out.push([P[j][0] + (P[j + 1][0] - P[j][0]) * f, P[j][1] + (P[j + 1][1] - P[j][1]) * f]); } prepara(out); ctl.sveglia(); } });
    var ctl = F.anima(cv, function (dt) {
      var P = F.pennello(cv), q = P.q, W = P.W, H = P.H, sc = Math.min(W, H) / 2.4, cx = W / 2, cy = H / 2;
      if (st.forma === 'mano' && (giu || !coef || disegnati)) { if (disegnati && disegnati.length) { q.strokeStyle = '#ffd24a'; q.lineWidth = 2; q.beginPath(); disegnati.forEach(function (p, i) { if (i) q.lineTo(cx + p[0] * sc, cy - p[1] * sc); else q.moveTo(cx + p[0] * sc, cy - p[1] * sc); }); q.stroke(); q.lineWidth = 1; } if (giu || !punti.length) return; }
      s += dt * 0.5; if (s > 2 * Math.PI) { s -= 2 * Math.PI; traccia = []; }
      q.strokeStyle = 'rgba(132,148,168,.3)'; q.beginPath(); punti.forEach(function (p, i) { if (i) q.lineTo(cx + p[0] * sc, cy - p[1] * sc); else q.moveTo(cx + p[0] * sc, cy - p[1] * sc); }); q.closePath(); q.stroke();
      var x = 0, y = 0;
      for (var i = 0; i < st.N && i < coef.length; i++) { var c = coef[i], a = c.f * s + c.fase, nx = x + c.amp * Math.cos(a), ny = y + c.amp * Math.sin(a); if (c.amp * sc > 0.6) { q.strokeStyle = 'rgba(107,207,255,.35)'; q.beginPath(); q.arc(cx + x * sc, cy - y * sc, c.amp * sc, 0, Math.PI * 2); q.stroke(); } q.strokeStyle = 'rgba(230,255,251,.7)'; q.beginPath(); q.moveTo(cx + x * sc, cy - y * sc); q.lineTo(cx + nx * sc, cy - ny * sc); q.stroke(); x = nx; y = ny; }
      traccia.push([x, y]);
      q.strokeStyle = '#5eead4'; q.lineWidth = 2.2; q.beginPath(); traccia.forEach(function (p, j) { if (j) q.lineTo(cx + p[0] * sc, cy - p[1] * sc); else q.moveTo(cx + p[0] * sc, cy - p[1] * sc); }); q.stroke(); q.lineWidth = 1;
      q.fillStyle = '#ffd24a'; q.beginPath(); q.arc(cx + x * sc, cy - y * sc, 4, 0, Math.PI * 2); q.fill();
      cv.setAttribute('aria-label', t('epicicli di Fourier che ridisegnano una figura', 'Fourier epicycles redrawing a shape'));
    }, { ricomincia: function () { s = 0; traccia = []; } });
  }

  /* ═══ 3. frattali ═══════════════════════════════════════════════════════ */
  function schedaFrattali(div) {
    var G = griglia(div), st = { tipo: 'mandel', cx: -0.5, cy: 0, w: 3.2, jx: -0.8, jy: 0.156, it: 200 }, info = nota(G.pan);
    F.scelta(G.pan, ['Insieme', 'Set'], [['mandel', 'Mandelbrot'], ['julia', 'Julia']], st.tipo, function (v) { st.tipo = v; st.cx = v === 'mandel' ? -0.5 : 0; st.cy = 0; st.w = 3.2; disegna(); });
    F.cursore(G.pan, ['iterazioni massime', 'max iterations'], 50, 1000, 50, st.it, function (v) { st.it = v; disegna(); });
    F.bottone(G.pan, ['Vista iniziale', 'Initial view'], function () { st.cx = st.tipo === 'mandel' ? -0.5 : 0; st.cy = 0; st.w = 3.2; disegna(); });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.72);
    cv.addEventListener('click', function (e) {
      var r = cv.getBoundingClientRect(), x = st.cx + (e.clientX - r.left - r.width / 2) / r.width * st.w, y = st.cy - (e.clientY - r.top - r.height / 2) / r.width * st.w;
      if (st.tipo === 'mandel' && e.shiftKey) { st.jx = x; st.jy = y; st.tipo = 'julia'; st.cx = 0; st.cy = 0; st.w = 3.2; } else { st.cx = x; st.cy = y; st.w /= 3; }
      disegna();
    });
    function disegna() {
      var dpr = Math.min(2, globale.devicePixelRatio || 1), Wc = Math.max(280, cv.clientWidth || 600), Hc = Math.round(Wc * cv._rapporto), w = Math.round(Wc * dpr * 0.6), h = Math.round(Hc * dpr * 0.6);
      cv.width = w; cv.height = h; var q = cv.getContext('2d'), img = q.createImageData(w, h), d = img.data, sc = st.w / w;
      for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) {
        var x = st.cx + (i - w / 2) * sc, y = st.cy - (j - h / 2) * sc, n = st.tipo === 'mandel' ? mandelbrot(x, y, st.it) : julia(x, y, st.jx, st.jy, st.it), k = 4 * (j * w + i);
        if (n >= st.it) { d[k] = 8; d[k + 1] = 10; d[k + 2] = 20; } else { var u = Math.sqrt(n / st.it); d[k] = Math.round(255 * Math.min(1, 1.6 * u)); d[k + 1] = Math.round(255 * Math.min(1, u * 0.9 + 0.1 * Math.sin(n * 0.3) + 0.1)); d[k + 2] = Math.round(255 * Math.min(1, 0.4 + 0.6 * Math.cos(u * 3))); }
        d[k + 3] = 255;
      }
      q.putImageData(img, 0, 0);
      cv.setAttribute('aria-label', st.tipo === 'mandel' ? t('insieme di Mandelbrot', 'Mandelbrot set') : t('insieme di Julia', 'Julia set'));
      info.innerHTML = (st.tipo === 'mandel' ? t('Mandelbrot: i punti c per cui z → z² + c, partendo da 0, resta limitato. ', 'Mandelbrot: the points c for which z → z² + c, starting from 0, stays bounded. ') : t('Julia per c = ', 'Julia for c = ') + fmt(st.jx) + (st.jy < 0 ? ' − ' : ' + ') + fmt(Math.abs(st.jy)) + 'i: ' + t('i punti z₀ la cui orbita resta limitata. ', 'the points z₀ whose orbit stays bounded. ')) + '<br>' + t('Tocca per ingrandire tre volte attorno al punto (larghezza attuale ', 'Tap to zoom three times around the point (current width ') + st.w.toExponential(2) + ')' + (st.tipo === 'mandel' ? t('; con Maiusc + clic si apre l’insieme di Julia di quel punto.', '; Shift + click opens the Julia set of that point.') : '.') + '<br>' + t('Il bordo è infinitamente dettagliato: ingrandendo compaiono sempre nuove strutture, e copie in piccolo dell’insieme intero.', 'The boundary is infinitely detailed: zooming in, new structures always appear, and small copies of the whole set.');
    }
    disegna(); F.alRidimensiona(disegna);
  }

  /* ═══ 4. caos: mappa logistica ══════════════════════════════════════════ */
  function schedaLogistica(div) {
    var G = griglia(div), st = { r: 3.2, x0: 0.2 }, info = nota(G.pan), k = 0, xs = [];
    F.cursore(G.pan, ['r', 'r'], 2.5, 4, 0.001, st.r, function (v) { st.r = v; k = 0; testo(); ctl.sveglia(); }, function (v) { return v.toFixed(3); });
    F.cursore(G.pan, ['x₀', 'x₀'], 0.01, 0.99, 0.01, st.x0, function (v) { st.x0 = v; k = 0; ctl.sveglia(); }, function (v) { return v.toFixed(2); });
    G.pan.appendChild(info);
    var cw = F.tela(G.dx, 0.6), cb = F.tela(G.dx, 0.55);
    function biforcazione() {
      var P = F.pennello(cb), q = P.q, W = P.W, H = P.H;
      q.fillStyle = 'rgba(94,234,212,.35)';
      for (var i = 0; i < W; i++) { var r = 2.5 + 1.5 * i / W, a = attrattore(r, 0.3, 300, 120); a.forEach(function (x) { q.fillRect(i, H - 6 - x * (H - 12), 1, 1); }); }
      var xr = 6 + (st.r - 2.5) / 1.5 * (W - 12); q.strokeStyle = '#ffd24a'; q.beginPath(); q.moveTo(xr, 0); q.lineTo(xr, H); q.stroke();
      q.fillStyle = '#9fb1c6'; q.font = '11px system-ui'; q.fillText('r = 2,5', 4, H - 2); q.fillText('r = 4', W - 34, H - 2); q.fillText('3', 6 + 0.5 / 1.5 * (W - 12) - 3, 12); q.fillText('3,449', 6 + 0.949 / 1.5 * (W - 12) - 12, 24); q.fillText('3,5699 (caos)', 6 + 1.0699 / 1.5 * (W - 12) - 30, 36);
      cb.setAttribute('aria-label', t('diagramma di biforcazione della mappa logistica', 'logistic map bifurcation diagram'));
    }
    function testo() {
      var p = periodo(st.r);
      info.innerHTML = 'x_{n+1} = r x_n (1 − x_n) · r = ' + st.r.toFixed(3) + ' → ' + (p === 1 ? t('<b>punto fisso</b> x* = 1 − 1/r = ', '<b>fixed point</b> x* = 1 − 1/r = ') + fmt(1 - 1 / st.r) : isFinite(p) ? t('<b>ciclo di periodo ', '<b>cycle of period ') + p + '</b>' : t('<b>caos</b>: nessun periodo, e due partenze vicinissime si separano', '<b>chaos</b>: no period, and two very close starts separate')) + '<br>' + t('Il periodo raddoppia a r = 3, 3,449, 3,544, 3,5644…: gli intervalli fra un raddoppio e l’altro si accorciano ogni volta di un fattore δ = 4,669… (costante di Feigenbaum, la stessa per moltissimi sistemi). Oltre 3,5699 c’è il caos, con finestre di ordine (periodo 3 a r ≈ 3,83).', 'The period doubles at r = 3, 3.449, 3.544, 3.5644…: the gaps between doublings shrink each time by a factor δ = 4.669… (Feigenbaum’s constant, the same for very many systems). Beyond 3.5699 there is chaos, with windows of order (period 3 at r ≈ 3.83).');
      biforcazione();
    }
    testo(); F.alRidimensiona(testo);
    var ctl = F.anima(cw, function (dt) {
      k = Math.min(120, k + dt * 8);
      var P = F.pennello(cw), q = P.q, W = P.W, H = P.H, L = Math.min(W, H) - 20, ox = (W - L) / 2, oy = 10, X = function (x) { return ox + x * L; }, Y = function (y) { return oy + L - y * L; };
      q.strokeStyle = '#34465f'; q.strokeRect(ox, oy, L, L); q.beginPath(); q.moveTo(X(0), Y(0)); q.lineTo(X(1), Y(1)); q.stroke();
      q.strokeStyle = '#6bcfff'; q.lineWidth = 2; q.beginPath(); for (var i = 0; i <= 100; i++) { var x = i / 100; if (i) q.lineTo(X(x), Y(st.r * x * (1 - x))); else q.moveTo(X(x), Y(0)); } q.stroke(); q.lineWidth = 1;
      q.strokeStyle = '#ffd24a'; q.beginPath(); var x0 = st.x0; q.moveTo(X(x0), Y(0));
      for (var n = 0; n < Math.floor(k); n++) { var x1 = st.r * x0 * (1 - x0); q.lineTo(X(x0), Y(x1)); q.lineTo(X(x1), Y(x1)); x0 = x1; }
      q.stroke();
      cw.setAttribute('aria-label', t('diagramma a ragnatela della mappa logistica', 'logistic map cobweb diagram'));
      if (k >= 120) return false;
    }, { ricomincia: function () { k = 0; } });
  }

  F.sezione('smatvis', {
    titolo: ['🎞️ Matematica visiva', '🎞️ Visual mathematics'],
    sotto: ['Le trasformazioni lineari che deformano il piano, gli epicicli di Fourier che ridisegnano qualunque figura, i frattali di Mandelbrot e Julia, il caos della mappa logistica.', 'Linear maps deforming the plane, Fourier epicycles redrawing any shape, the Mandelbrot and Julia fractals, the chaos of the logistic map.'],
    schede: [
      { nome: ['🔲 Trasformazioni lineari', '🔲 Linear maps'], costruisci: schedaTrasformazioni },
      { nome: ['⭕ Epicicli di Fourier', '⭕ Fourier epicycles'], costruisci: schedaFourier },
      { nome: ['❄️ Frattali', '❄️ Fractals'], costruisci: schedaFrattali },
      { nome: ['🦋 Caos', '🦋 Chaos'], costruisci: schedaLogistica }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
