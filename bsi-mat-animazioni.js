/* ═══════════════════════════════════════════════════════════════════════
   bsi-mat-animazioni.js — 🎞️ Animazioni di matematica (v262)
   BioSpecInfo · © Samuele Pio Provenzano

   Nove idee della matematica come film che si calcolano mentre li guardi,
   nello stile dei reel scientifici (sfondo scuro, curve che brillano, una
   legenda in alto, i numeri veri nell'HUD):
     1 · la serie di Fourier che costruisce l'onda quadra con i cerchi (e il
         fenomeno di Gibbs: il 9 % in più che non se ne va mai);
     2 · le somme di Riemann che diventano l'integrale;
     3 · i polinomi di Taylor che abbracciano sin x;
     4 · la secante che diventa tangente: la derivata;
     5 · e^{iθ}: il cerchio, coseno e seno, e^{iπ} + 1 = 0;
     6 · la tavola di Galton e la curva normale (teorema centrale del limite);
     7 · l'ago di Buffon che stima π;
     8 · Fibonacci, la spirale aurea e φ;
     9 · (1 + 1/n)ⁿ → e.
   Tutto in 2D (canvas), leggero anche sul telefono; i calcoli sono funzioni
   pure in BSIAnimMat.calcolo, verificate dal banco test_animmat.
   ═══════════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  var F = g.BSIFisica, D = g.document;
  if (!F) return;
  var t = F.t, PI = Math.PI;
  var MENO_MOTO = false; try { MENO_MOTO = !!(g.matchMedia && g.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { }

  /* ═══ calcoli ════════════════════════════════════════════════════════════ */
  function onda(x, N) { var s = 0; for (var k = 1; k <= N; k += 2) s += Math.sin(k * x) / k; return 4 / PI * s; }   /* somma parziale fino all'armonica N (dispari) */
  function piccoGibbs(N) { var m = 0; for (var i = 1; i <= 4000; i++) { var x = i / 4000 * PI; m = Math.max(m, onda(x, N)); } return m; }
  function f1(x) { return Math.sin(x) + 1.2; }
  var ESATTO_RIEMANN = 2 + 1.2 * PI;   /* ∫₀^π (sin x + 1,2) dx */
  function riemann(n, tipo) { var h = PI / n, s = 0; for (var i = 0; i < n; i++) { var x = tipo === 'dx' ? (i + 1) * h : tipo === 'medio' ? (i + 0.5) * h : i * h; s += f1(x) * h; } return s; }
  function fatt(n) { var r = 1; for (var i = 2; i <= n; i++) r *= i; return r; }
  function taylorSin(x, grado) { var s = 0; for (var k = 0; 2 * k + 1 <= grado; k++) s += Math.pow(-1, k) * Math.pow(x, 2 * k + 1) / fatt(2 * k + 1); return s; }
  function f3(x) { return x * x * x - 2 * x; }
  function secante(a, h) { return (f3(a + h) - f3(a)) / h; }
  function rnd32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var r = Math.imul(a ^ a >>> 15, 1 | a); r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r; return ((r ^ r >>> 14) >>> 0) / 4294967296; }; }
  /** tavola di Galton: n righe, palline con cammini casuali (seme fisso) */
  function galton(nPalline, righe, seme) { var r = rnd32(seme || 7), cammini = [], conta = new Array(righe + 1).fill(0); for (var b = 0; b < nPalline; b++) { var k = 0, c = []; for (var i = 0; i < righe; i++) { var d = r() < 0.5 ? 0 : 1; k += d; c.push(d); } cammini.push(c); conta[k]++; } return { cammini: cammini, conta: conta }; }
  function binom(n, k) { var r = 1; for (var i = 1; i <= k; i++) r = r * (n - k + i) / i; return r; }
  /** ago di Buffon: aghi lunghi l su righe distanti d (l ≤ d): P(incrocio) = 2l/(πd) */
  function buffon(n, l, d, seme) { var r = rnd32(seme || 3), aghi = [], tagli = 0; for (var i = 0; i < n; i++) { var y = r() * d, th = r() * PI, dy = l / 2 * Math.sin(th), taglia = y - dy < 0 || y + dy > d; if (taglia) tagli++; aghi.push([r(), y, th, taglia]); } return { aghi: aghi, tagli: tagli, stima: tagli ? 2 * l * n / (d * tagli) : NaN }; }
  function fib(n) { var a = 1, b = 1; for (var i = 2; i < n; i++) { var c = a + b; a = b; b = c; } return n < 2 ? 1 : b; }
  var PHI = (1 + Math.sqrt(5)) / 2;
  function eLim(n) { return Math.exp(n * Math.log1p(1 / n)); }

  /* ═══ disegno: strumenti comuni ═════════════════════════════════════════ */
  var COL = { teal: '#5fe3d6', azz: '#6bcfff', rosa: '#ff8fa3', oro: '#ffd24a', viola: '#b9a2ff', bianco: '#e6f2ff', grigio: 'rgba(160,180,206,.6)' };
  function curva(q, pts, col, w, glow) { q.strokeStyle = col; q.lineWidth = w || 2; q.lineJoin = 'round'; q.lineCap = 'round'; if (glow !== false) { q.shadowColor = col; q.shadowBlur = 10; } q.beginPath(); for (var i = 0; i < pts.length; i++) { if (!isFinite(pts[i][1])) continue; if (i) q.lineTo(pts[i][0], pts[i][1]); else q.moveTo(pts[i][0], pts[i][1]); } q.stroke(); q.shadowBlur = 0; }
  function puntoLuce(q, x, y, col, r) { var gr = q.createRadialGradient(x, y, 0, x, y, (r || 5) * 3); gr.addColorStop(0, '#fff'); gr.addColorStop(0.3, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); q.fillStyle = gr; q.beginPath(); q.arc(x, y, (r || 5) * 3, 0, 2 * PI); q.fill(); }
  function assi(q, x0, y0, x1, y1, ox, oy) { q.strokeStyle = 'rgba(140,160,190,.35)'; q.lineWidth = 1; q.beginPath(); q.moveTo(x0, oy); q.lineTo(x1, oy); q.moveTo(ox, y0); q.lineTo(ox, y1); q.stroke(); }
  function testo(q, s, x, y, col, font, al) { q.font = font || '500 12px system-ui,sans-serif'; q.fillStyle = col || COL.bianco; q.textAlign = al || 'left'; q.fillText(s, x, y); q.textAlign = 'left'; }
  function legenda(q, voci, x, y) { y = Math.max(y, 74); q.font = '500 10px ui-monospace,Menlo,monospace'; var lx = x; voci.forEach(function (v) { q.fillStyle = v[0]; q.fillRect(lx, y - 4, 12, 2.5); q.fillStyle = 'rgba(200,214,232,.9)'; q.fillText(v[1], lx + 16, y); lx += q.measureText(v[1]).width + 30; }); }
  function fase(tt, punti) { for (var i = punti.length - 1; i >= 0; i--) if (tt >= punti[i]) return i; return 0; }
  function eased(u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }

  /* ═══ le nove animazioni ═════════════════════════════════════════════════ */
  var A = [];
  A.push({ id: 'fourier', titolo: ['Fourier: l\'onda quadra fatta di cerchi', 'Fourier: the square wave made of circles'], formula: 'f(x) = (4/π) Σ sin(kx)/k,  k = 1, 3, 5, …', durata: 22,
    disegna: function (q, W, H, tt, h) {
      var passi = [1, 3, 5, 9, 15, 25, 49], ip = Math.min(passi.length - 1, Math.floor(tt / 3)), Nh = passi[ip], th = tt * 2.2;
      var cx = W * 0.22, cy = H * 0.42, sc = Math.min(W * 0.14, H * 0.12), x = cx, y = cy;
      q.lineWidth = 1;
      for (var k = 1; k <= Nh; k += 2) { var r = sc * 4 / (PI * k), nx = x + r * Math.cos(k * th), ny = y - r * Math.sin(k * th); q.strokeStyle = 'rgba(107,207,255,' + (0.45 / Math.sqrt(k)).toFixed(3) + ')'; q.beginPath(); q.arc(x, y, r, 0, 2 * PI); q.stroke(); q.strokeStyle = 'rgba(230,242,255,.75)'; q.beginPath(); q.moveTo(x, y); q.lineTo(nx, ny); q.stroke(); x = nx; y = ny; }
      var ox = W * 0.48, larg = W * 0.48;
      q.setLineDash([3, 4]); q.strokeStyle = 'rgba(255,143,163,.6)'; q.beginPath(); q.moveTo(x, y); q.lineTo(ox, y); q.stroke(); q.setLineDash([]);
      var pts = []; for (var i = 0; i <= 260; i++) { var u = i / 260, xx = th - u * 4 * PI; pts.push([ox + u * larg, cy - sc * onda(xx, Nh)]); } curva(q, pts, COL.rosa, 2.2);
      var qd = []; for (i = 0; i <= 260; i++) { u = i / 260; xx = th - u * 4 * PI; qd.push([ox + u * larg, cy - sc * (Math.sin(xx) >= 0 ? 1 : -1)]); } curva(q, qd, 'rgba(230,242,255,.25)', 1, false);
      puntoLuce(q, ox, y, COL.rosa, 3);
      /* in basso: lo spettro delle ampiezze */
      var by = H * 0.8, bw = W * 0.8 / 25; for (k = 1; k <= 49; k += 2) { var a = 4 / (PI * k), on = k <= Nh; q.fillStyle = on ? COL.azz : 'rgba(107,207,255,.15)'; q.fillRect(W * 0.1 + (k - 1) / 2 * bw, by - a * H * 0.12, bw * 0.7, a * H * 0.12); }
      testo(q, t('ampiezze 4/(πk) delle armoniche', 'harmonic amplitudes 4/(πk)'), W * 0.1, by + 14, COL.grigio, '500 10px ui-monospace,monospace');
      var pk = piccoGibbs(Nh); h.innerHTML = 'N = ' + Nh + t(' armoniche dispari', ' odd harmonics') + '<br>' + t('picco ', 'peak ') + pk.toFixed(3).replace('.', t(',', '.')) + ' (' + t('Gibbs: → 1,179', 'Gibbs: → 1.179') + ')';
      return Nh >= 25 ? t('Più cerchi, più spigoli. Ma il 9 % di troppo vicino al salto non sparisce mai: è il fenomeno di Gibbs.', 'More circles, sharper corners. But the 9 % overshoot near the jump never goes away: the Gibbs phenomenon.') : t('Ogni cerchio gira al doppio, al triplo… della velocità: sommati, disegnano un\'onda quadra.', 'Each circle spins 3, 5, 7… times faster: added up, they draw a square wave.');
    }, conti: function () { return { gibbs: piccoGibbs(199) }; } });

  A.push({ id: 'riemann', titolo: ['Dai rettangoli all\'integrale', 'From rectangles to the integral'], formula: '∫₀^π (sin x + 1,2) dx = 2 + 1,2π', durata: 18,
    disegna: function (q, W, H, tt, h) {
      var ns = [2, 4, 8, 16, 32, 64, 128, 256], n = ns[Math.min(ns.length - 1, Math.floor(tt / 2.2))], x0 = W * 0.1, x1 = W * 0.9, y0 = H * 0.58, sy = H * 0.15, X = function (x) { return x0 + x / PI * (x1 - x0); }, Y = function (v) { return y0 - v * sy; }; 
      assi(q, x0 - 8, H * 0.18, x1 + 8, y0 + 6, x0, y0);
      var hh = PI / n; for (var i = 0; i < n; i++) { var xa = i * hh, v = f1(xa); q.fillStyle = 'rgba(95,227,214,.22)'; q.strokeStyle = 'rgba(95,227,214,.75)'; q.lineWidth = n > 64 ? 0.4 : 1; q.fillRect(X(xa), Y(v), X(xa + hh) - X(xa), y0 - Y(v)); if (n <= 64) q.strokeRect(X(xa), Y(v), X(xa + hh) - X(xa), y0 - Y(v)); }
      var pts = []; for (i = 0; i <= 200; i++) { var xx = i / 200 * PI; pts.push([X(xx), Y(f1(xx))]); } curva(q, pts, COL.oro, 2.4);
      var S = riemann(n), err = S - ESATTO_RIEMANN;
      /* in basso: l'errore che scende come 1/n */
      var gx0 = W * 0.1, gx1 = W * 0.9, gy = H * 0.78, gh = H * 0.11; assi(q, gx0, gy - gh, gx1, gy, gx0, gy);
      var Ye = function (e) { return gy - (Math.log10(Math.abs(e)) + 6) / 6 * gh; }, ep = []; ns.forEach(function (m, k) { ep.push([gx0 + k / (ns.length - 1) * (gx1 - gx0), Ye(riemann(m) - ESATTO_RIEMANN)]); }); curva(q, ep, COL.rosa, 1.6);
      var kk = ns.indexOf(n); puntoLuce(q, ep[kk][0], ep[kk][1], COL.rosa, 3);
      testo(q, t('|errore| (scala log), n raddoppia →', '|error| (log scale), n doubles →'), gx0, gy + 13, COL.grigio, '500 10px ui-monospace,monospace');
      h.innerHTML = 'n = ' + n + '<br>' + t('somma ', 'sum ') + S.toFixed(5) + '<br>' + t('esatto ', 'exact ') + ESATTO_RIEMANN.toFixed(5) + '<br>' + t('errore ', 'error ') + err.toExponential(2) + ' · n²×err ≈ ' + (n * n * err).toFixed(3);
      return n >= 64 ? t('Infiniti rettangoli infinitamente sottili: l\'area esatta. L\'errore si divide per 4 ogni volta che n raddoppia: qui f(0) = f(π), e la somma vale quanto quella dei trapezi (errore ∝ 1/n²).', 'Infinitely many infinitely thin rectangles: the exact area. The error drops fourfold every time n doubles: here f(0) = f(π), so the sum equals the trapezoid one (error ∝ 1/n²).') : t('L\'area sotto la curva, approssimata con rettangoli.', 'The area under the curve, approximated with rectangles.');
    }, conti: function () { return { e64: riemann(64) - ESATTO_RIEMANN, e128: riemann(128) - ESATTO_RIEMANN }; } });

  A.push({ id: 'taylor', titolo: ['Taylor: polinomi che imitano sin x', 'Taylor: polynomials imitating sin x'], formula: 'sin x = x − x³/3! + x⁵/5! − x⁷/7! + …', durata: 18,
    disegna: function (q, W, H, tt, h) {
      var gradi = [1, 3, 5, 7, 9, 11, 13, 15, 17], gr = gradi[Math.min(gradi.length - 1, Math.floor(tt / 2))], x0 = W * 0.05, x1 = W * 0.95, cy = H * 0.45, sx = (x1 - x0) / (4 * PI), sy = H * 0.12, X = function (x) { return (x0 + x1) / 2 + x * sx; }, Y = function (v) { return cy - v * sy; };
      assi(q, x0, cy - 2.6 * sy, x1, cy + 2.6 * sy, X(0), cy);
      [-2, -1, 1, 2].forEach(function (k) { q.fillStyle = COL.grigio; q.font = '500 10px ui-monospace,monospace'; q.fillText((k > 0 ? '' : '−') + (Math.abs(k) === 1 ? '' : Math.abs(k)) + 'π', X(k * PI) - 6, cy + 14); });
      var s = [], p = []; for (var i = 0; i <= 300; i++) { var xx = -2 * PI + i / 300 * 4 * PI; s.push([X(xx), Y(Math.sin(xx))]); var v = taylorSin(xx, gr); p.push([X(xx), Math.abs(v) < 3 ? Y(v) : NaN]); }
      curva(q, s, 'rgba(230,242,255,.5)', 1.5, false); curva(q, p, COL.teal, 2.4);
      /* dove l'errore è sotto 0,01 */
      var xb = 0; for (var xx2 = 0; xx2 < 2 * PI; xx2 += 0.01) { if (Math.abs(taylorSin(xx2, gr) - Math.sin(xx2)) > 0.01) break; xb = xx2; }
      q.fillStyle = 'rgba(95,227,214,.12)'; q.fillRect(X(-xb), cy - 2.6 * sy, X(xb) - X(-xb), 5.2 * sy);
      legenda(q, [['rgba(230,242,255,.7)', 'sin x'], [COL.teal, t('polinomio di grado ', 'degree ') + gr]], W * 0.08, H * 0.16);
      var rest = Math.abs(taylorSin(PI, gr) - Math.sin(PI)), lag = Math.pow(PI, gr + 2) / fatt(gr + 2);
      h.innerHTML = t('grado ', 'degree ') + gr + '<br>' + t('errore in π: ', 'error at π: ') + rest.toExponential(2) + '<br>' + t('limite di Lagrange ', 'Lagrange bound ') + lag.toExponential(2) + '<br>' + t('esatto entro 0,01 per |x| < ', 'within 0.01 for |x| < ') + xb.toFixed(2);
      return gr >= 13 ? t('Con abbastanza termini il polinomio copre tutto il giro: sin x è un polinomio infinito.', 'With enough terms the polynomial covers the whole turn: sin x is an infinite polynomial.') : t('Ogni termine in più allarga la zona in cui il polinomio non si distingue da sin x.', 'Each extra term widens the zone where the polynomial matches sin x.');
    }, conti: function () { return { resto7: Math.abs(taylorSin(PI, 7)), lag7: Math.pow(PI, 9) / fatt(9) }; } });

  A.push({ id: 'derivata', titolo: ['La secante diventa tangente', 'The secant becomes the tangent'], formula: 'f\'(a) = lim_{h→0} [f(a+h) − f(a)] / h', durata: 14,
    disegna: function (q, W, H, tt, h0) {
      var a = 1, hh = 1.6 * Math.pow(0.001 / 1.6, eased(tt / 11)), x0 = W * 0.08, x1 = W * 0.92, cy = H * 0.5, sx = (x1 - x0) / 5, sy = H * 0.07, X = function (x) { return (x0 + x1) / 2 + x * sx; }, Y = function (v) { return cy - v * sy; };
      assi(q, x0, H * 0.15, x1, H * 0.85, X(0), cy);
      var pts = []; for (var i = 0; i <= 200; i++) { var xx = -2.4 + i / 200 * 4.8; pts.push([X(xx), Y(f3(xx))]); } curva(q, pts, COL.azz, 2.2);
      var m = secante(a, hh), y1 = f3(a); q.strokeStyle = COL.rosa; q.lineWidth = 1.8; q.shadowColor = COL.rosa; q.shadowBlur = 8; q.beginPath(); q.moveTo(X(-2.4), Y(y1 + m * (-2.4 - a))); q.lineTo(X(2.4), Y(y1 + m * (2.4 - a))); q.stroke(); q.shadowBlur = 0;
      puntoLuce(q, X(a), Y(y1), COL.oro, 4); puntoLuce(q, X(a + hh), Y(f3(a + hh)), COL.rosa, 3.5);
      testo(q, 'a', X(a) - 4, Y(y1) + 18, COL.oro); if (hh > 0.15) testo(q, 'a + h', X(a + hh) - 10, Y(f3(a + hh)) - 10, COL.rosa);
      legenda(q, [[COL.azz, 'f(x) = x³ − 2x'], [COL.rosa, t('secante', 'secant')]], W * 0.08, H * 0.12);
      h0.innerHTML = 'h = ' + hh.toPrecision(3) + '<br>' + t('pendenza ', 'slope ') + m.toFixed(5) + '<br>f\'(1) = 3·1² − 2 = 1';
      return hh < 0.02 ? t('Quando h tende a zero, la secante diventa la tangente: la sua pendenza è la derivata, 1.', 'As h goes to zero, the secant becomes the tangent: its slope is the derivative, 1.') : t('Due punti sulla curva, sempre più vicini.', 'Two points on the curve, closer and closer.');
    }, conti: function () { return { m1: secante(1, 0.001) }; } });

  A.push({ id: 'eulero', titolo: ['e^{iθ}: il cerchio che fa nascere seno e coseno', 'e^{iθ}: the circle that gives birth to sine and cosine'], formula: 'e^{iθ} = cos θ + i sin θ', durata: 16,
    disegna: function (q, W, H, tt, h) {
      var th = Math.min(tt / 12, 1) * 2 * PI * 1.25, cx = W * 0.3, cy = H * 0.36, R = Math.min(W * 0.2, H * 0.14);
      assi(q, cx - R * 1.3, cy - R * 1.3, cx + R * 1.3, cy + R * 1.3, cx, cy);
      q.strokeStyle = 'rgba(107,207,255,.5)'; q.lineWidth = 1.5; q.beginPath(); q.arc(cx, cy, R, 0, 2 * PI); q.stroke();
      q.strokeStyle = COL.oro; q.lineWidth = 2.5; q.beginPath(); q.arc(cx, cy, R * 0.25, 0, -th % (2 * PI || 1), true); q.stroke();
      var px = cx + R * Math.cos(th), py = cy - R * Math.sin(th);
      q.strokeStyle = COL.bianco; q.lineWidth = 1.5; q.beginPath(); q.moveTo(cx, cy); q.lineTo(px, py); q.stroke();
      q.setLineDash([3, 3]); q.strokeStyle = COL.teal; q.beginPath(); q.moveTo(px, py); q.lineTo(px, cy); q.stroke(); q.strokeStyle = COL.rosa; q.beginPath(); q.moveTo(px, py); q.lineTo(cx, py); q.stroke(); q.setLineDash([]);
      puntoLuce(q, px, py, COL.oro, 4);
      /* le onde: seno a destra, coseno sotto */
      var ox = cx + R * 1.5, sw = W * 0.92 - ox, sP = [], cP = [], oy = cy + R * 1.5, sh = H * 0.9 - oy;
      for (var i = 0; i <= 160; i++) { var a = i / 160 * th; sP.push([ox + a / (2.5 * PI) * sw, cy - R * Math.sin(a)]); cP.push([cx + R * Math.cos(a), oy + a / (2.5 * PI) * sh]); }
      curva(q, sP, COL.rosa, 2); curva(q, cP, COL.teal, 2);
      q.setLineDash([2, 4]); q.strokeStyle = 'rgba(255,143,163,.4)'; q.beginPath(); q.moveTo(px, py); q.lineTo(ox + th / (2.5 * PI) * sw, py); q.stroke(); q.strokeStyle = 'rgba(95,227,214,.4)'; q.beginPath(); q.moveTo(px, py); q.lineTo(px, oy + th / (2.5 * PI) * sh); q.stroke(); q.setLineDash([]);
      legenda(q, [[COL.teal, 'cos θ'], [COL.rosa, 'sin θ']], W * 0.08, H * 0.08);
      var pi = Math.abs(th - PI) < 0.25; if (pi) { testo(q, 'e^{iπ} + 1 = 0', W / 2, H * 0.97, COL.oro, 'italic 700 20px Georgia,serif', 'center'); }
      h.innerHTML = 'θ = ' + (th / PI).toFixed(2).replace('.', t(',', '.')) + 'π<br>cos θ = ' + Math.cos(th).toFixed(3) + '<br>sin θ = ' + Math.sin(th).toFixed(3) + '<br>|e^{iθ}| = 1';
      return pi ? t('Mezzo giro: e^{iπ} = −1. Cinque numeri fondamentali in una riga.', 'Half a turn: e^{iπ} = −1. Five fundamental numbers in one line.') : t('Un punto che gira sul cerchio: la sua ombra orizzontale è il coseno, quella verticale il seno.', 'A point going round the circle: its horizontal shadow is cosine, its vertical one sine.');
    }, conti: function () { return { eipi: [Math.cos(PI) + 1, Math.sin(PI)] }; } });

  var GAL = galton(800, 12, 11);
  A.push({ id: 'galton', titolo: ['La tavola di Galton e la curva a campana', 'The Galton board and the bell curve'], formula: 'B(12, ½) → N(6, 3)', durata: 20,
    disegna: function (q, W, H, tt, h) {
      var righe = 12, nTot = GAL.cammini.length, x0 = W * 0.08, x1 = W * 0.92, top = Math.max(H * 0.14, 96), chiodi = H * 0.44, base = H * 0.88, dx = (x1 - x0) / (righe + 1), dy = (chiodi - top) / righe;
      for (var r = 0; r < righe; r++) for (var c = 0; c <= r; c++) { q.fillStyle = 'rgba(160,180,206,.55)'; q.beginPath(); q.arc(W / 2 + (c - r / 2) * dx, top + r * dy, 2, 0, 2 * PI); q.fill(); }
      var arrivate = Math.min(nTot, Math.floor(tt / 16 * nTot)), conta = new Array(righe + 1).fill(0);
      for (var b = 0; b < arrivate; b++) { var k = 0; GAL.cammini[b].forEach(function (d) { k += d; }); conta[k]++; }
      /* le palline in volo */
      for (b = arrivate; b < Math.min(nTot, arrivate + 14); b++) { var fz = (tt / 16 * nTot - b) / -14 + 1; if (fz < 0) continue; var liv = Math.min(righe, Math.floor(fz * righe)), kk = 0; for (var i = 0; i < liv; i++) kk += GAL.cammini[b][i]; puntoLuce(q, W / 2 + (kk - liv / 2) * dx, top + liv * dy - dy * 0.5, COL.oro, 2.5); }
      var mx = 0; conta.forEach(function (v) { mx = Math.max(mx, v); }); var esp = nTot * binom(righe, righe / 2) / 4096, scala = (base - chiodi - 20) / Math.max(esp * 1.15, mx);
      conta.forEach(function (v, k2) { var x = W / 2 + (k2 - righe / 2) * dx; q.fillStyle = 'rgba(95,227,214,.55)'; q.fillRect(x - dx * 0.38, base - v * scala, dx * 0.76, v * scala); });
      var mu = righe / 2, sig = Math.sqrt(righe / 4), pts = [], frac = arrivate / nTot; for (i = 0; i <= 160; i++) { var xk = -0.5 + i / 160 * (righe + 1), dens = Math.exp(-Math.pow(xk - mu, 2) / (2 * sig * sig)) / (sig * Math.sqrt(2 * PI)); pts.push([W / 2 + (xk - righe / 2) * dx, base - dens * nTot * frac * scala]); }
      if (arrivate > 30) curva(q, pts, COL.rosa, 2);
      var m = 0, v2 = 0; conta.forEach(function (v, k3) { m += k3 * v; }); m /= Math.max(1, arrivate); conta.forEach(function (v, k4) { v2 += v * (k4 - m) * (k4 - m); }); v2 /= Math.max(1, arrivate - 1);
      legenda(q, [['rgba(95,227,214,.9)', t('palline arrivate', 'balls landed')], [COL.rosa, 'N(μ = 6, σ² = 3)']], W * 0.08, H * 0.06);
      h.innerHTML = t('palline ', 'balls ') + arrivate + '<br>' + t('media ', 'mean ') + m.toFixed(2) + ' (6)<br>' + t('varianza ', 'variance ') + v2.toFixed(2) + ' (3)';
      return arrivate > 400 ? t('Tante scelte a caso, destra o sinistra: la somma si dispone a campana. È il teorema centrale del limite.', 'Many random choices, left or right: the sum arranges itself in a bell. It is the central limit theorem.') : t('A ogni chiodo la pallina va a destra o a sinistra, come una moneta.', 'At each peg the ball goes left or right, like a coin.');
    }, conti: function () { var m = 0, v = 0, n = GAL.cammini.length; GAL.conta.forEach(function (c, k) { m += k * c; }); m /= n; GAL.conta.forEach(function (c, k) { v += c * (k - m) * (k - m); }); return { media: m, varianza: v / (n - 1) }; } });

  var BUF = buffon(3000, 1, 1, 5);
  A.push({ id: 'buffon', titolo: ['L\'ago di Buffon: π dal caso', 'Buffon\'s needle: π from chance'], formula: 'P(incrocio) = 2l / (πd)  ⇒  π ≈ 2l·N / (d·incroci)', durata: 18,
    disegna: function (q, W, H, tt, h) {
      var x0 = W * 0.06, x1 = W * 0.94, y0 = Math.max(H * 0.14, 92), y1 = H * 0.62, righe = 6, d = (y1 - y0) / righe, n = Math.max(1, Math.floor(Math.pow(eased(tt / 15), 1.6) * BUF.aghi.length));
      q.strokeStyle = 'rgba(160,180,206,.4)'; q.lineWidth = 1; for (var r = 0; r <= righe; r++) { q.beginPath(); q.moveTo(x0, y0 + r * d); q.lineTo(x1, y0 + r * d); q.stroke(); }
      var tagli = 0; q.lineWidth = 1.1; for (var i0 = 0; i0 < n; i0++) if (BUF.aghi[i0][3]) tagli++;
      for (var i = Math.max(0, n - 450); i < n; i++) { var A0 = BUF.aghi[i], riga = Math.floor(A0[0] * righe), cx = x0 + ((A0[0] * 97.3) % 1) * (x1 - x0), cy = y0 + riga * d + A0[1] * d, dx = Math.cos(A0[2]) * d / 2, dy = Math.sin(A0[2]) * d / 2; q.strokeStyle = A0[3] ? 'rgba(255,143,163,.85)' : 'rgba(107,207,255,.45)'; q.beginPath(); q.moveTo(cx - dx, cy - dy); q.lineTo(cx + dx, cy + dy); q.stroke(); }
      var stima = tagli ? 2 * n / tagli : NaN;
      /* la stima nel tempo */
      var gx0 = W * 0.1, gx1 = W * 0.9, gy0 = H * 0.7, gy1 = H * 0.92, Yp = function (v) { return gy1 - (v - 2.6) / 1.1 * (gy1 - gy0); };
      q.setLineDash([3, 4]); q.strokeStyle = 'rgba(255,210,74,.6)'; q.beginPath(); q.moveTo(gx0, Yp(PI)); q.lineTo(gx1, Yp(PI)); q.stroke(); q.setLineDash([]); testo(q, 'π', gx1 + 4, Yp(PI) + 4, COL.oro);
      var st = [], tg = 0; for (i = 0; i < n; i++) { if (BUF.aghi[i][3]) tg++; if (i > 10 && (i % 6 === 0 || i === n - 1)) st.push([gx0 + i / BUF.aghi.length * (gx1 - gx0), Yp(Math.max(2.6, Math.min(3.7, 2 * (i + 1) / Math.max(1, tg))))]); }
      curva(q, st, COL.teal, 1.6);
      legenda(q, [[COL.rosa, t('aghi che incrociano una riga', 'needles crossing a line')], [COL.teal, t('stima di π', 'π estimate')]], W * 0.06, H * 0.06);
      h.innerHTML = t('aghi ', 'needles ') + n + '<br>' + t('incroci ', 'crossings ') + tagli + '<br>π ≈ ' + (isFinite(stima) ? stima.toFixed(4) : '—') + '<br>' + t('errore atteso ~ ', 'expected error ~ ') + (2.37 / Math.sqrt(n)).toFixed(3);
      return n > 1000 ? t('Aghi lunghi quanto la distanza fra le righe: la frazione che le incrocia vale 2/π. Il caso conosce π (ma lo impara piano: l\'errore cala come 1/√N).', 'Needles as long as the line spacing: the fraction crossing them is 2/π. Chance knows π (but learns it slowly: the error falls as 1/√N).') : t('Aghi lanciati a caso su un pavimento a righe.', 'Needles dropped at random on a lined floor.');
    }, conti: function () { return { stima: BUF.stima }; } });

  A.push({ id: 'fibonacci', titolo: ['Fibonacci e la spirale aurea', 'Fibonacci and the golden spiral'], formula: 'F(n+1)/F(n) → φ = (1 + √5)/2', durata: 16,
    disegna: function (q, W, H, tt, h) {
      var n = Math.min(12, 2 + Math.floor(tt / 1.2)), lato = []; for (var i = 1; i <= n; i++) lato.push(fib(i));
      /* quadrati a spirale: si costruiscono in unità e poi si scalano */
      var qs = [], bx = 0, by = 0, bw = 1, bh = 1; qs.push([0, 0, 1]);
      for (i = 1; i < n; i++) { var s = lato[i], dir = i % 4; if (dir === 1) { qs.push([bx + bw, by, s]); bw += s; } else if (dir === 2) { qs.push([bx + bw - s, by + bh, s]); bh += s; } else if (dir === 3) { qs.push([bx - s, by + bh - s, s]); bx -= s; bw += s; } else { qs.push([bx, by - s, s]); by -= s; bh += s; } }
      var sc = Math.min(W * 0.84 / bw, H * 0.6 / bh), ox = W / 2 - (bx + bw / 2) * sc, oy = H * 0.42 - (by + bh / 2) * sc;
      qs.forEach(function (Q, k) { q.strokeStyle = 'rgba(107,207,255,.55)'; q.lineWidth = 1; q.strokeRect(ox + Q[0] * sc, oy + Q[1] * sc, Q[2] * sc, Q[2] * sc); if (Q[2] * sc > 16) testo(q, String(Q[2]), ox + (Q[0] + Q[2] / 2) * sc, oy + (Q[1] + Q[2] / 2) * sc + 4, 'rgba(230,242,255,.6)', '600 ' + Math.min(18, Q[2] * sc / 3) + 'px system-ui', 'center'); });
      q.strokeStyle = COL.oro; q.lineWidth = 2.2; q.shadowColor = COL.oro; q.shadowBlur = 10;
      qs.forEach(function (Q, k) { var d2 = k % 4, cxq, cyq, a0; if (d2 === 0) { cxq = Q[0] + Q[2]; cyq = Q[1] + Q[2]; a0 = PI; } else if (d2 === 1) { cxq = Q[0]; cyq = Q[1] + Q[2]; a0 = 1.5 * PI; } else if (d2 === 2) { cxq = Q[0]; cyq = Q[1]; a0 = 0; } else { cxq = Q[0] + Q[2]; cyq = Q[1]; a0 = 0.5 * PI; } q.beginPath(); q.arc(ox + cxq * sc, oy + cyq * sc, Q[2] * sc, a0, a0 + PI / 2); q.stroke(); });
      q.shadowBlur = 0;
      /* il rapporto che converge */
      var gx0 = W * 0.1, gx1 = W * 0.9, gy0 = H * 0.78, gy1 = H * 0.94, Yr = function (v) { return gy1 - (v - 1) / 1.1 * (gy1 - gy0); }, rp = [];
      for (i = 2; i <= n; i++) rp.push([gx0 + (i - 2) / 10 * (gx1 - gx0), Yr(fib(i) / fib(i - 1))]);
      q.setLineDash([3, 4]); q.strokeStyle = 'rgba(255,210,74,.6)'; q.beginPath(); q.moveTo(gx0, Yr(PHI)); q.lineTo(gx1, Yr(PHI)); q.stroke(); q.setLineDash([]); testo(q, 'φ', gx1 + 4, Yr(PHI) + 4, COL.oro);
      curva(q, rp, COL.teal, 1.8); rp.forEach(function (p) { puntoLuce(q, p[0], p[1], COL.teal, 2); });
      var r = fib(n) / fib(n - 1);
      h.innerHTML = 'F(' + n + ') = ' + fib(n) + '<br>F(' + n + ')/F(' + (n - 1) + ') = ' + r.toFixed(6) + '<br>φ = ' + PHI.toFixed(6) + '<br>' + t('scarto ', 'gap ') + Math.abs(r - PHI).toExponential(1);
      return n > 8 ? t('Ogni numero è la somma dei due prima. Il rapporto fra vicini si avvicina a φ, alternando sopra e sotto.', 'Each number is the sum of the two before. The ratio of neighbours approaches φ, alternating above and below.') : t('1, 1, 2, 3, 5, 8…: quadrati che si appoggiano l\'uno all\'altro.', '1, 1, 2, 3, 5, 8…: squares resting on each other.');
    }, conti: function () { return { r20: fib(20) / fib(19) }; } });

  A.push({ id: 'e', titolo: ['(1 + 1/n)ⁿ: come nasce il numero e', '(1 + 1/n)ⁿ: how the number e is born'], formula: 'e = lim_{n→∞} (1 + 1/n)ⁿ = 2,71828…', durata: 15,
    disegna: function (q, W, H, tt, h) {
      var L = Math.min(6, tt / 12 * 6), n = Math.max(1, Math.round(Math.pow(10, L))), x0 = W * 0.12, x1 = W * 0.92, y0 = H * 0.2, y1 = H * 0.66, Yv = function (v) { return y1 - (v - 1.9) / 0.9 * (y1 - y0); }, Xl = function (l) { return x0 + l / 6 * (x1 - x0); };
      assi(q, x0, y0, x1, y1, x0, y1);
      q.setLineDash([3, 4]); q.strokeStyle = 'rgba(255,210,74,.6)'; q.beginPath(); q.moveTo(x0, Yv(Math.E)); q.lineTo(x1, Yv(Math.E)); q.stroke(); q.setLineDash([]); testo(q, 'e', x1 + 4, Yv(Math.E) + 4, COL.oro);
      [0, 1, 2, 3, 4, 5, 6].forEach(function (l) { testo(q, '10' + '⁰¹²³⁴⁵⁶'[l], Xl(l) - 6, y1 + 14, COL.grigio, '500 10px ui-monospace,monospace'); });
      var pts = []; for (var i = 0; i <= 240; i++) { var l = i / 240 * L; pts.push([Xl(l), Yv(eLim(Math.pow(10, l)))]); } curva(q, pts, COL.teal, 2.4);
      puntoLuce(q, Xl(L), Yv(eLim(n)), COL.teal, 4);
      /* il capitale: 1 € al 100 % diviso in n rate */
      var bx = W * 0.12, by = H * 0.9, bw = W * 0.76; q.fillStyle = 'rgba(95,227,214,.25)'; q.fillRect(bx, by - 14, bw * eLim(n) / 3, 14); q.strokeStyle = 'rgba(95,227,214,.8)'; q.strokeRect(bx, by - 14, bw * Math.E / 3, 14);
      testo(q, t('1 € al 100 % annuo, interessi composti n volte: dopo un anno ', '€1 at 100 % a year, compounded n times: after a year ') + eLim(n).toFixed(5) + ' €', bx, by + 14, COL.grigio, '500 10px system-ui');
      h.innerHTML = 'n = ' + n.toLocaleString(t('it-IT', 'en-US')) + '<br>(1 + 1/n)ⁿ = ' + eLim(n).toFixed(7) + '<br>e = ' + Math.E.toFixed(7) + '<br>' + t('scarto ≈ e/(2n) = ', 'gap ≈ e/(2n) = ') + (Math.E / (2 * n)).toExponential(1);
      return n > 1e4 ? t('Più spesso si capitalizza, più ci si avvicina a e, ma mai oltre: il limite è 2,71828…', 'The more often you compound, the closer you get to e, but never beyond: the limit is 2.71828…') : t('Un euro, interessi del 100 % divisi in rate sempre più piccole.', 'One euro, 100 % interest split into ever smaller instalments.');
    }, conti: function () { return { e1e6: eLim(1e6) }; } });

  /* ═══ il lettore ═════════════════════════════════════════════════════════ */
  function stile() {
    if (D.getElementById('bsiAM-stile')) return; var s = D.createElement('style'); s.id = 'bsiAM-stile';
    s.textContent = '.bsiAM-palco{position:relative;margin:0 auto;border-radius:12px;overflow:hidden;background:radial-gradient(120% 90% at 50% 30%,#0b1630 0%,#03060d 75%)}.bsiAM-palco canvas{display:block;width:100%;height:100%}' +
      '.bsiAM-tit{position:absolute;left:12px;right:12px;top:10px;pointer-events:none;color:#fff;font:italic 600 clamp(17px,4.6vw,24px)/1.2 "Cormorant Garamond","EB Garamond",Georgia,serif;text-shadow:0 1px 4px #000}.bsiAM-tit small{display:block;margin-top:4px;font:500 12px ui-monospace,Menlo,monospace;color:#9fe7ff;font-style:normal}' +
      '.bsiAM-hud{position:absolute;right:10px;top:84px;text-align:right;pointer-events:none;font:500 11px/1.5 ui-monospace,Menlo,monospace;color:#ffd9a8;text-shadow:0 1px 2px #000}' +
      '.bsiAM-dida{position:absolute;left:8%;right:8%;bottom:12px;text-align:center;pointer-events:none;font:italic 500 clamp(14px,3.8vw,19px)/1.3 "Cormorant Garamond",Georgia,serif;color:#fff;text-shadow:0 2px 6px #000;transition:opacity .4s}' +
      '.bsiAM-com{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:6px 0}.bsiAM-com button{min-height:40px;min-width:40px;border-radius:9px;border:1px solid #2a4a6e;background:#0a1b2e;color:#e6f2ff;font:600 .85rem system-ui,sans-serif;padding:4px 12px;cursor:pointer}.bsiAM-com label{display:flex;align-items:center;gap:6px;font:500 .82rem system-ui,sans-serif;color:#cfe3f7}' +
      '.bsiAM-tempo{width:100%;accent-color:#ffd24a}.bsiAM-scelte{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 10px}.bsiAM-scelte button{min-height:36px;border-radius:18px;border:1px solid #2a4a6e;background:#0a1b2e;color:#cfe3f7;font:600 .8rem system-ui,sans-serif;padding:4px 12px;cursor:pointer}.bsiAM-scelte button[aria-pressed="true"]{border-color:#ffd24a;color:#ffd24a}';
    D.head.appendChild(s);
  }
  function crea(cont, id, opz) {
    opz = opz || {}; stile();
    var a = A.filter(function (x) { return x.id === id; })[0] || A[0];
    if (cont._am) cont._am.distruggi(); cont.textContent = '';
    var largo = (g.innerWidth || 400) > 900, palco = F.el('div', { 'class': 'bsiAM-palco' }), cv = D.createElement('canvas'); cv.setAttribute('role', 'img'); palco.appendChild(cv);
    var tit = F.el('div', { 'class': 'bsiAM-tit' }); tit.innerHTML = F.tt(a.titolo) + '<small>' + a.formula + '</small>'; palco.appendChild(tit);
    var hud = F.el('div', { 'class': 'bsiAM-hud', 'aria-live': 'off' }), dida = F.el('div', { 'class': 'bsiAM-dida', 'aria-live': 'polite' }); palco.appendChild(hud); palco.appendChild(dida);
    var barra = F.el('input', { type: 'range', 'class': 'bsiAM-tempo', min: '0', max: String(a.durata), step: '0.01', value: '0', 'aria-label': t('Tempo dell\'animazione', 'Animation time') }), com = F.el('div', { 'class': 'bsiAM-com', role: 'toolbar' });
    cont.appendChild(palco); cont.appendChild(barra); cont.appendChild(com);
    var q = cv.getContext('2d'), W = 0, H = 0, tt = Math.max(0, Math.min(a.durata, opz.t || 0)), gioca = !MENO_MOTO && opz.gioca !== false, vivo = true, prec = 0, raf = 0, visibile = true, ultimaDida = '';
    function misura() { var w = cont.clientWidth || 360, hmax = (g.innerHeight || 800) * 0.78, ww = largo ? w : Math.min(w, hmax * 9 / 16), hh = largo ? Math.min(hmax, ww * 9 / 16) : ww * 16 / 9, dpr = (g.BSIRisoluzione ? g.BSIRisoluzione.dpr() : Math.min(2, g.devicePixelRatio || 1)); palco.style.width = ww + 'px'; palco.style.height = hh + 'px'; W = ww; H = hh; cv.width = Math.round(ww * dpr); cv.height = Math.round(hh * dpr); q.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function disegna() {
      q.clearRect(0, 0, W, H);
      var s = a.disegna(q, W, H, tt, hud) || ''; if (s !== ultimaDida) { ultimaDida = s; dida.textContent = s; }
      cv.setAttribute('aria-label', F.tt(a.titolo) + '. ' + s);
      barra.value = String(tt);
    }
    function giro(ora) {
      if (!vivo) return; raf = g.requestAnimationFrame(giro);
      if (!visibile || D.hidden || !cont.isConnected) { prec = 0; return; }
      var dt = prec ? Math.min(0.05, (ora - prec) / 1000) : 0; prec = ora;
      if (gioca) { tt += dt * vel; if (tt >= a.durata) { tt = a.durata; gioca = false; segna(); } }
      if (gioca || sporca) { disegna(); sporca = false; }
    }
    var sporca = true, vel = 1;
    function bott(tx, f, aria) { var b = F.el('button', { type: 'button', testo: tx, 'aria-label': aria || tx, onclick: function () { f(b); } }); com.appendChild(b); return b; }
    var bP = bott('⏸', function () { if (tt >= a.durata - 0.01) tt = 0; gioca = !gioca; segna(); }, t('Riproduci o metti in pausa', 'Play or pause'));
    bott('↺', function () { tt = 0; gioca = !MENO_MOTO; sporca = true; segna(); }, t('Ricomincia', 'Restart'));
    var selV = F.el('select', { 'aria-label': t('Velocità', 'Speed') }); [0.5, 1, 2].forEach(function (v) { var o = F.el('option', { value: String(v), testo: v + '×' }); if (v === 1) o.selected = true; selV.appendChild(o); }); selV.addEventListener('change', function () { vel = +selV.value; }); com.appendChild(F.el('label', {}, [F.el('span', { testo: t('Velocità', 'Speed') }), selV]));
    function segna() { bP.textContent = gioca ? '⏸' : '▶'; bP.setAttribute('aria-pressed', String(gioca)); }
    segna(); barra.addEventListener('input', function () { tt = +barra.value; gioca = false; sporca = true; segna(); });
    if (g.IntersectionObserver) new IntersectionObserver(function (v) { visibile = v[0].isIntersecting; sporca = true; }).observe(palco);
    misura(); disegna(); raf = g.requestAnimationFrame(giro);
    F.alRidimensiona(function () { misura(); sporca = true; });
    var api = { id: a.id, animazione: a, distruggi: function () { vivo = false; g.cancelAnimationFrame(raf); }, vai: function (x) { tt = x; sporca = true; disegna(); }, gioca: function (v) { gioca = v; segna(); }, tela: cv, durata: a.durata, hud: hud };
    cont._am = api; return api;
  }
  function schedaSezione(div) {
    stile();
    var scelte = F.el('div', { 'class': 'bsiAM-scelte', role: 'group', 'aria-label': t('Animazioni', 'Animations') }), palco = F.el('div'), tasti = {};
    div.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('Nove idee della matematica come piccoli film: ogni fotogramma è calcolato, i numeri a destra sono veri. La barra ferma il tempo dove vuoi.', 'Nine ideas of mathematics as short films: every frame is computed, the numbers on the right are real. The bar stops time wherever you like.') }));
    div.appendChild(scelte); div.appendChild(palco);
    function apri(id) { Object.keys(tasti).forEach(function (k) { tasti[k].setAttribute('aria-pressed', String(k === id)); }); div._am = crea(palco, id); return div._am; }
    A.forEach(function (a) { var b = F.el('button', { type: 'button', 'aria-pressed': 'false', testo: F.tt(a.titolo).split(':')[0] }); b.addEventListener('click', function () { apri(a.id); }); tasti[a.id] = b; scelte.appendChild(b); });
    div._apri = apri; apri('fourier');
  }
  F.sezione('sanimmat', {
    titolo: ['🎞️ Animazioni matematiche', '🎞️ Maths animations'],
    sotto: ['Fourier con i cerchi, Riemann, Taylor, la derivata come limite, e^{iθ}, la tavola di Galton, l\'ago di Buffon, Fibonacci e la spirale aurea, (1 + 1/n)ⁿ → e: film brevi in cui ogni numero è calcolato.', 'Fourier with circles, Riemann, Taylor, the derivative as a limit, e^{iθ}, the Galton board, Buffon\'s needle, Fibonacci and the golden spiral, (1 + 1/n)ⁿ → e: short films in which every number is computed.'],
    schede: [{ nome: ['🎞️ Le animazioni', '🎞️ The animations'], costruisci: schedaSezione }]
  });
  g.BSIAnimMat = { A: A, crea: crea, calcolo: { onda: onda, piccoGibbs: piccoGibbs, riemann: riemann, ESATTO_RIEMANN: ESATTO_RIEMANN, taylorSin: taylorSin, secante: secante, galton: galton, buffon: buffon, fib: fib, PHI: PHI, eLim: eLim, binom: binom } };
})(typeof window !== 'undefined' ? window : globalThis);
