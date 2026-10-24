/* ═══════════════════════════════════════════════════════════════════════════
   bsi-fis-analitica.js — 🎡 meccanica analitica
   BioSpecInfo · © Samuele Pio Provenzano

   · SPAZIO DELLE FASI DEL PENDOLO: le curve di livello di
     H(θ, p) = p²/2 − cos θ (unita' ridotte, ω₀ = 1), la separatrice H = 1
     che divide le librazioni dalle rotazioni, una traiettoria animata
     dell'energia scelta; il periodo esatto T = 4K(k) con l'integrale
     ellittico completo calcolato con la media aritmetico-geometrica,
     contro il periodo delle piccole oscillazioni 2π;
   · DOPPIO PENDOLO: due copie con angoli iniziali che differiscono di
     10⁻⁶ rad; la distanza cresce in modo esponenziale (esponente di
     Lyapunov dalla pendenza in scala logaritmica) mentre l'energia resta
     conservata dall'integratore RK4;
   · LAGRANGE E NOETHER: la perlina sull'anello che ruota, con la
     biforcazione dell'equilibrio a ω² = g/R (cos θ* = g/(Rω²)) e il
     potenziale efficace; il momento angolare conservato in un campo
     centrale (simmetria per rotazioni) e perso quando si aggiunge un campo
     uniforme che la rompe;
   · LIOUVILLE: una nube di condizioni iniziali che evolve; l'area del
     poligono di bordo (formula di Gauss, «shoelace») resta costante mentre
     la forma si allunga in filamenti; l'involucro convesso invece cresce.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt, g0 = 9.81;
  function griglia(div) { var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); G.appendChild(pan); G.appendChild(dx); div.appendChild(G); return { pan: pan, dx: dx }; }
  function nota(pan) { var n = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(n); return n; }

  /* ═══ calcoli ═══════════════════════════════════════════════════════════ */
  /* un passo di Runge–Kutta del 4° ordine per y' = f(y) (sistema autonomo) */
  function rk4(f, y, h) {
    var n = y.length, k1 = f(y), y2 = new Array(n), i;
    for (i = 0; i < n; i++) y2[i] = y[i] + h / 2 * k1[i];
    var k2 = f(y2); for (i = 0; i < n; i++) y2[i] = y[i] + h / 2 * k2[i];
    var k3 = f(y2); for (i = 0; i < n; i++) y2[i] = y[i] + h * k3[i];
    var k4 = f(y2), out = new Array(n);
    for (i = 0; i < n; i++) out[i] = y[i] + h / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
    return out;
  }
  /* integrale ellittico completo di prima specie K(k) = π / (2 AGM(1, √(1 − k²))) */
  function agm(a, b) { for (var i = 0; i < 60 && Math.abs(a - b) > 1e-15 * a; i++) { var c = (a + b) / 2; b = Math.sqrt(a * b); a = c; } return a; }
  function K(k) { return k >= 1 ? Infinity : Math.PI / (2 * agm(1, Math.sqrt(1 - k * k))); }
  /* pendolo, H = p²/2 − cos θ: librazione per H < 1 (T = 4K(k), k² = (1+H)/2), rotazione per H > 1 (T = 2K(1/k)/k) */
  function pendoloH(th, p) { return p * p / 2 - Math.cos(th); }
  function periodo(E) {
    if (E <= -1) return 2 * Math.PI;
    var k2 = (1 + E) / 2;
    if (k2 < 1) return 4 * K(Math.sqrt(k2));
    if (k2 === 1) return Infinity;
    var k = Math.sqrt(k2); return 2 * K(1 / k) / k;
  }
  function campoPendolo(y) { return [y[1], -Math.sin(y[0])]; }
  /* secondo metodo: il periodo misurato integrando con RK4 e interpolando gli attraversamenti */
  function periodoNumerico(E, h) {
    h = h || 1e-3;
    var y, tt = 0, i;
    if (E < 1) { var th0 = Math.acos(-E); y = [th0, 0];
      /* tempo per arrivare a θ = 0 = un quarto di periodo */
      for (i = 0; i < 1e7; i++) { var n = rk4(campoPendolo, y, h); if (n[0] <= 0) { return 4 * (tt + h * y[0] / (y[0] - n[0])); } y = n; tt += h; }
    } else { y = [0, Math.sqrt(2 * (E + 1))];
      for (i = 0; i < 1e7; i++) { var m = rk4(campoPendolo, y, h); if (m[0] >= 2 * Math.PI) { return tt + h * (2 * Math.PI - y[0]) / (m[0] - y[0]); } y = m; tt += h; }
    }
    return NaN;
  }
  /* doppio pendolo: y = [θ₁, θ₂, ω₁, ω₂], masse e lunghezze date */
  function doppioCampo(par) {
    var m1 = par.m1, m2 = par.m2, L1 = par.L1, L2 = par.L2, g = par.g;
    return function (y) {
      var d = y[0] - y[1], s = Math.sin(d), c = Math.cos(d), den = 2 * m1 + m2 - m2 * Math.cos(2 * d);
      var a1 = (-g * (2 * m1 + m2) * Math.sin(y[0]) - m2 * g * Math.sin(y[0] - 2 * y[1]) - 2 * s * m2 * (y[3] * y[3] * L2 + y[2] * y[2] * L1 * c)) / (L1 * den);
      var a2 = (2 * s * (y[2] * y[2] * L1 * (m1 + m2) + g * (m1 + m2) * Math.cos(y[0]) + y[3] * y[3] * L2 * m2 * c)) / (L2 * den);
      return [y[2], y[3], a1, a2];
    };
  }
  function doppioEnergia(y, par) {
    var m1 = par.m1, m2 = par.m2, L1 = par.L1, L2 = par.L2, g = par.g;
    var T = 0.5 * m1 * L1 * L1 * y[2] * y[2] + 0.5 * m2 * (L1 * L1 * y[2] * y[2] + L2 * L2 * y[3] * y[3] + 2 * L1 * L2 * y[2] * y[3] * Math.cos(y[0] - y[1]));
    return T - (m1 + m2) * g * L1 * Math.cos(y[0]) - m2 * g * L2 * Math.cos(y[1]);
  }
  /* secondo metodo per le equazioni: le accelerazioni dalle equazioni di Lagrange scritte come sistema lineare M·α = b */
  function doppioLagrange(y, par) {
    var m1 = par.m1, m2 = par.m2, L1 = par.L1, L2 = par.L2, g = par.g, d = y[0] - y[1];
    var A = (m1 + m2) * L1, B = m2 * L2 * Math.cos(d), Cc = L1 * Math.cos(d), D = L2;
    var b1 = -m2 * L2 * y[3] * y[3] * Math.sin(d) - (m1 + m2) * g * Math.sin(y[0]), b2 = L1 * y[2] * y[2] * Math.sin(d) - g * Math.sin(y[1]);
    var det = A * D - B * Cc; return [(b1 * D - B * b2) / det, (A * b2 - Cc * b1) / det];
  }
  /* separazione nello spazio delle fasi fra due copie */
  function distanza(a, b) { var s = 0; for (var i = 0; i < 4; i++) { var d = a[i] - b[i]; s += d * d; } return Math.sqrt(s); }
  /* perlina sull'anello che ruota: θ'' = sin θ (ω² cos θ − g/R) − γθ' ; potenziale efficace per unita' di m R² */
  function anelloCampo(R, w, gam) { return function (y) { return [y[1], Math.sin(y[0]) * (w * w * Math.cos(y[0]) - g0 / R) - (gam || 0) * y[1]]; }; }
  function anelloUeff(th, R, w) { return -g0 / R * Math.cos(th) - 0.5 * w * w * Math.sin(th) * Math.sin(th); }
  function anelloEquilibri(R, w) {
    var wc2 = g0 / R, out = [{ th: 0, stabile: w * w < wc2, Om2: wc2 - w * w }, { th: Math.PI, stabile: false, Om2: -(wc2 + w * w) }];
    if (w * w > wc2) { var th = Math.acos(wc2 / (w * w)), Om2 = w * w * Math.sin(th) * Math.sin(th); out.push({ th: th, stabile: true, Om2: Om2 }, { th: -th, stabile: true, Om2: Om2 }); }
    return out;
  }
  /* Noether: V = −1/√(r² + a²) + ε x² (nucleo smussato, a = 0,1: niente singolarita' quando L passa per zero);
     Verlet in velocita' (conserva esattamente L per forze centrali) */
  var A2 = 0.01;
  function forzaNoether(x, y, eps) { var r2 = x * x + y * y + A2, r3 = r2 * Math.sqrt(r2); return [-x / r3 - 2 * eps * x, -y / r3]; }
  function passoNoether(s, h, eps) {
    var a = forzaNoether(s[0], s[1], eps), vx = s[2] + h / 2 * a[0], vy = s[3] + h / 2 * a[1], x = s[0] + h * vx, y = s[1] + h * vy, b = forzaNoether(x, y, eps);
    return [x, y, vx + h / 2 * b[0], vy + h / 2 * b[1]];
  }
  function momentoL(s) { return s[0] * s[3] - s[1] * s[2]; }
  function energiaNoether(s, eps) { return 0.5 * (s[2] * s[2] + s[3] * s[3]) - 1 / Math.sqrt(s[0] * s[0] + s[1] * s[1] + A2) + eps * s[0] * s[0]; }
  /* Liouville: area di un poligono (Gauss) e del suo involucro convesso (catena monotona di Andrew) */
  function areaPoligono(P) { var a = 0, n = P.length; for (var i = 0; i < n; i++) { var j = (i + 1) % n; a += P[i][0] * P[j][1] - P[j][0] * P[i][1]; } return Math.abs(a) / 2; }
  function involucro(P) {
    var Q = P.slice().sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; }), cr = function (o, a, b) { return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); }, lo = [], hi = [], i;
    for (i = 0; i < Q.length; i++) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], Q[i]) <= 0) lo.pop(); lo.push(Q[i]); }
    for (i = Q.length - 1; i >= 0; i--) { while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], Q[i]) <= 0) hi.pop(); hi.push(Q[i]); }
    lo.pop(); hi.pop(); return lo.concat(hi);
  }
  var SISTEMI = {
    oscillatore: function () { return function (y) { return [y[1], -y[0]]; }; },
    pendolo: function () { return campoPendolo; },
    smorzato: function (gam) { return function (y) { return [y[1], -Math.sin(y[0]) - gam * y[1]]; }; }
  };
  function nube(cx, cy, r, n) { var P = []; for (var i = 0; i < n; i++) { var a = 2 * Math.PI * i / n; P.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return P; }
  /* il bordo evolve; dove due punti vicini si allontanano troppo se ne aggiunge uno nuovo, integrato dall'inizio (raffinamento) */
  function evolviBordo(S, f, h, passi, soglia) {
    for (var k = 0; k < passi; k++) { for (var i = 0; i < S.P.length; i++) S.P[i] = rk4(f, S.P[i], h); S.t += h; S.n++; }
    if (soglia) {
      var out = [], out0 = [];
      for (i = 0; i < S.P.length; i++) {
        var j = (i + 1) % S.P.length; out.push(S.P[i]); out0.push(S.P0[i]);
        if (out.length + S.P.length < 6000 && Math.hypot(S.P[i][0] - S.P[j][0], S.P[i][1] - S.P[j][1]) > soglia) {
          var m0 = [(S.P0[i][0] + S.P0[j][0]) / 2, (S.P0[i][1] + S.P0[j][1]) / 2], y = m0;
          for (var q = 0; q < S.n; q++) y = rk4(f, y, h);
          out.push(y); out0.push(m0);
        }
      }
      S.P = out; S.P0 = out0;
    }
    return S;
  }
  function statoBordo(P) { return { P: P.map(function (p) { return p.slice(); }), P0: P.map(function (p) { return p.slice(); }), t: 0, n: 0 }; }
  F.calcolo.analitica = { rk4: rk4, agm: agm, K: K, pendoloH: pendoloH, periodo: periodo, periodoNumerico: periodoNumerico, doppioCampo: doppioCampo, doppioEnergia: doppioEnergia, doppioLagrange: doppioLagrange, distanza: distanza, anelloCampo: anelloCampo, anelloUeff: anelloUeff, anelloEquilibri: anelloEquilibri, passoNoether: passoNoether, momentoL: momentoL, energiaNoether: energiaNoether, areaPoligono: areaPoligono, involucro: involucro, SISTEMI: SISTEMI, nube: nube, evolviBordo: evolviBordo, statoBordo: statoBordo, g: g0 };

  /* linee di livello con i quadrati in marcia: segmenti di f = c su una griglia nx × ny */
  function livelli(f, nx, ny, c) {
    var seg = [], i, j;
    for (j = 0; j < ny - 1; j++) for (i = 0; i < nx - 1; i++) {
      var v = [f[j][i] - c, f[j][i + 1] - c, f[j + 1][i + 1] - c, f[j + 1][i] - c], P = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]], pts = [];
      for (var e = 0; e < 4; e++) { var a = v[e], b = v[(e + 1) % 4]; if ((a < 0) !== (b < 0)) { var s = a / (a - b), A = P[e], B = P[(e + 1) % 4]; pts.push([A[0] + s * (B[0] - A[0]), A[1] + s * (B[1] - A[1])]); } }
      if (pts.length >= 2) seg.push([pts[0], pts[1]]); if (pts.length === 4) seg.push([pts[2], pts[3]]);
    }
    return seg;
  }

  /* ═══ 1. spazio delle fasi del pendolo ══════════════════════════════════ */
  function schedaFasi(div) {
    var G = griglia(div), st = { E: 0.3 }, info = nota(G.pan), y = null, scia = [];
    F.cursore(G.pan, ['energia H (unità mgL)', 'energy H (units mgL)'], -0.98, 2.5, 0.01, st.E, function (v) { st.E = v; azzera(); disegnaT(); }, function (v) { return v.toFixed(2); });
    F.bottone(G.pan, ['Sulla separatrice (H = 1)', 'On the separatrix (H = 1)'], function () { st.E = 0.9999; azzera(); disegnaT(); });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.55), ct = F.tela(G.dx, 0.4), sfondo = null;
    var TX = 1.5 * Math.PI, PY = 3;
    function azzera() { y = st.E < 1 ? [Math.acos(-st.E), 0] : [-Math.PI, Math.sqrt(2 * (st.E + 1))]; scia = []; testo(); if (ctl) ctl.sveglia(); }
    function testo() {
      var T = periodo(st.E), lib = st.E < 1, th0 = lib ? Math.acos(-st.E) : null;
      info.innerHTML = 'H = p²/2 − cos θ · ' + (lib ? t('librazione, ampiezza ', 'libration, amplitude ') + 'θ₀ = <b class="bsiFX-num">' + fmt(th0 * 180 / Math.PI) + '°</b>' : t('rotazione (il pendolo gira)', 'rotation (the pendulum goes over the top)')) + '<br>' +
        t('periodo esatto ', 'exact period ') + 'T = ' + (lib ? '4K(k), k = sin(θ₀/2) = ' + fmt(Math.sqrt((1 + st.E) / 2)) : '2K(1/k)/k') + ' = <b class="bsiFX-num">' + fmt(T) + '</b> · T/T₀ = <b class="bsiFX-num">' + fmt(T / (2 * Math.PI)) + '</b>' + (lib ? ' · ' + t('serie ', 'series ') + '1 + θ₀²/16 = ' + fmt(1 + th0 * th0 / 16) : '') + '<br>' +
        t('K(k) = π / [2·AGM(1, √(1−k²))]: la media aritmetico-geometrica di Gauss converge quadraticamente, cinque passi bastano per 15 cifre. Le orbite chiuse attorno all’origine sono librazioni; quelle aperte in alto e in basso sono rotazioni; le separa la separatrice H = 1, che passa per i punti di sella θ = ±π (il pendolo in equilibrio instabile a testa in giù) e su cui il periodo diverge logaritmicamente. Unità ridotte: tempo in 1/ω₀, ω₀ = √(g/L), T₀ = 2π.',
          'K(k) = π / [2·AGM(1, √(1−k²))]: Gauss’s arithmetic–geometric mean converges quadratically, five steps give 15 digits. Closed orbits around the origin are librations; the open ones above and below are rotations; they are separated by the separatrix H = 1, which passes through the saddle points θ = ±π (the pendulum balanced upside down) and on which the period diverges logarithmically. Reduced units: time in 1/ω₀, ω₀ = √(g/L), T₀ = 2π.');
    }
    function prepSfondo(W, H) {
      var nx = 121, ny = 61, f = [], i, j;
      for (j = 0; j < ny; j++) { f.push([]); for (i = 0; i < nx; i++) f[j].push(pendoloH(-TX + 2 * TX * i / (nx - 1), PY - 2 * PY * j / (ny - 1))); }
      var off = document.createElement('canvas'), dpr = Math.min(2, globale.devicePixelRatio || 1); off.width = Math.round(W * dpr); off.height = Math.round(H * dpr);
      var q = off.getContext('2d'); q.setTransform(dpr, 0, 0, dpr, 0, 0); q.fillStyle = '#081522'; q.fillRect(0, 0, W, H);
      var sx = W / (nx - 1), sy = H / (ny - 1);
      for (var c = -0.75; c <= 3.5; c += 0.25) {
        if (Math.abs(c - 1) < 1e-9) continue;
        q.strokeStyle = c < 1 ? 'rgba(107,207,255,.45)' : 'rgba(201,185,255,.45)'; q.lineWidth = 1; q.beginPath();
        livelli(f, nx, ny, c).forEach(function (s) { q.moveTo(s[0][0] * sx, s[0][1] * sy); q.lineTo(s[1][0] * sx, s[1][1] * sy); }); q.stroke();
      }
      q.strokeStyle = '#ff8a80'; q.lineWidth = 2; q.beginPath();
      for (var s = -1; s <= 1; s += 2) for (i = 0; i <= 400; i++) { var th = -TX + 2 * TX * i / 400, p = s * 2 * Math.cos(th / 2), X = (th + TX) / (2 * TX) * W, Y = (PY - p) / (2 * PY) * H; if (Math.abs(th) > Math.PI) p = s * 2 * Math.abs(Math.cos(th / 2)); Y = (PY - p) / (2 * PY) * H; if (i === 0) q.moveTo(X, Y); else q.lineTo(X, Y); }
      q.stroke(); q.lineWidth = 1;
      q.fillStyle = '#8494a8'; q.font = '11px system-ui'; q.textAlign = 'center';
      [-Math.PI, 0, Math.PI].forEach(function (v, k) { var X = (v + TX) / (2 * TX) * W; q.fillText(['−π', '0', 'π'][k], X, H - 4); q.strokeStyle = 'rgba(132,148,168,.35)'; q.beginPath(); q.moveTo(X, 0); q.lineTo(X, H - 14); q.stroke(); });
      q.textAlign = 'left'; q.fillText('p', 4, 12); q.fillText('θ', W - 12, H / 2 - 4);
      q.strokeStyle = 'rgba(132,148,168,.35)'; q.beginPath(); q.moveTo(0, H / 2); q.lineTo(W, H / 2); q.stroke();
      sfondo = { off: off, W: W, H: H };
    }
    var ctl = null; azzera();
    ctl = F.anima(cv, function (dt) {
      var P = F.pennello(cv), q = P.q, W = P.W, H = P.H;
      if (!sfondo || sfondo.W !== W || sfondo.H !== H) prepSfondo(W, H);
      q.drawImage(sfondo.off, 0, 0, W, H);
      var n = Math.ceil(dt * 3 / 0.005); for (var k = 0; k < n; k++) y = rk4(campoPendolo, y, dt * 3 / n);
      var th = Math.atan2(Math.sin(y[0]), Math.cos(y[0]));
      scia.push([th, y[1]]); if (scia.length > 600) scia.shift();
      var X = function (v) { return (v + TX) / (2 * TX) * W; }, Y = function (v) { return (PY - v) / (2 * PY) * H; };
      q.fillStyle = 'rgba(255,210,74,.7)';
      scia.forEach(function (s) { [0, -2 * Math.PI, 2 * Math.PI].forEach(function (o) { var x = s[0] + o; if (x >= -TX && x <= TX) q.fillRect(X(x) - 1, Y(s[1]) - 1, 2, 2); }); });
      [0, -2 * Math.PI, 2 * Math.PI].forEach(function (o) { var x = th + o; if (x >= -TX && x <= TX) { q.fillStyle = '#ffd24a'; q.beginPath(); q.arc(X(x), Y(y[1]), 5, 0, 2 * Math.PI); q.fill(); } });
      /* il pendolo in miniatura nell'angolo */
      var cx = W - 46, cy = 40; q.strokeStyle = '#e6fffb'; q.lineWidth = 2; q.beginPath(); q.moveTo(cx, cy); q.lineTo(cx + 28 * Math.sin(y[0]), cy + 28 * Math.cos(y[0])); q.stroke(); q.lineWidth = 1;
      q.fillStyle = '#ffd24a'; q.beginPath(); q.arc(cx + 28 * Math.sin(y[0]), cy + 28 * Math.cos(y[0]), 5, 0, 2 * Math.PI); q.fill();
      cv.setAttribute('aria-label', t('ritratto di fase del pendolo con separatrice e traiettoria', 'pendulum phase portrait with separatrix and trajectory'));
    }, { ricomincia: azzera });
    function disegnaT() {
      var xs = [], ye = [], ys = [];
      for (var a = 1; a <= 179.5; a += 0.5) { var r = a * Math.PI / 180; xs.push(a); ye.push(periodo(-Math.cos(r)) / (2 * Math.PI)); ys.push(1 + r * r / 16); }
      var pu = st.E < 1 ? [{ x: Math.acos(-st.E) * 180 / Math.PI, y: periodo(st.E) / (2 * Math.PI), col: '#ffd24a', r: 5 }] : [];
      F.grafico(ct, { serie: [{ x: xs, y: ye, col: '#5eead4', larg: 2.5, etich: '4K(k)/2π' }, { x: xs, y: ys, col: '#c9b9ff', tratt: true, etich: '1 + θ₀²/16' }], punti: pu, linee: [{ y: 1, col: '#8494a8', etich: t('piccole oscillazioni', 'small angles') }], xmin: 0, xmax: 180, ymin: 0.9, ymax: 3.5, xl: [t('ampiezza θ₀ (°)', 'amplitude θ₀ (°)'), 'amplitude θ₀ (°)'], yl: ['T/T₀', 'T/T₀'], descr: ['periodo del pendolo contro l’ampiezza', 'pendulum period versus amplitude'], legenda: [{ col: '#5eead4', etich: ['esatto, 4K(k)', 'exact, 4K(k)'] }, { col: '#c9b9ff', etich: ['1 + θ₀²/16', '1 + θ₀²/16'] }] });
    }
    disegnaT(); F.alRidimensiona(function () { sfondo = null; disegnaT(); });
  }

  /* ═══ 2. doppio pendolo ═════════════════════════════════════════════════ */
  function schedaDoppio(div) {
    var G = griglia(div), st = { a1: 120, a2: 120, d: 1e-6 }, info = nota(G.pan), par = { m1: 1, m2: 1, L1: 1, L2: 1, g: g0 }, f = doppioCampo(par), A, B, E0, tt, dist, scia;
    F.cursore(G.pan, ['θ₁ iniziale (°)', 'initial θ₁ (°)'], 0, 179, 1, st.a1, function (v) { st.a1 = v; azzera(); });
    F.cursore(G.pan, ['θ₂ iniziale (°)', 'initial θ₂ (°)'], -179, 179, 1, st.a2, function (v) { st.a2 = v; azzera(); });
    F.scelta(G.pan, ['Differenza iniziale di θ₁', 'Initial difference in θ₁'], [['1e-6', '10⁻⁶ rad'], ['1e-9', '10⁻⁹ rad'], ['1e-3', '10⁻³ rad']], '1e-6', function (v) { st.d = +v; azzera(); });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.62), cl = F.tela(G.dx, 0.4), H = 1e-3;
    function azzera() { var r1 = st.a1 * Math.PI / 180, r2 = st.a2 * Math.PI / 180; A = [r1, r2, 0, 0]; B = [r1 + st.d, r2, 0, 0]; E0 = doppioEnergia(A, par); tt = 0; dist = []; scia = [[], []]; if (ctl) ctl.sveglia(); }
    function lyap() {
      /* pendenza di ln d contro t nel tratto di crescita, fra 100·d₀ e 0,1 */
      var xs = [], ys = []; dist.forEach(function (p) { if (p[1] > st.d * 100 && p[1] < 0.1) { xs.push(p[0]); ys.push(Math.log(p[1])); } });
      if (xs.length < 10) return null;
      var n = xs.length, mx = 0, my = 0, i; for (i = 0; i < n; i++) { mx += xs[i] / n; my += ys[i] / n; }
      var sxy = 0, sxx = 0; for (i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) * (xs[i] - mx); }
      return sxy / sxx;
    }
    var ctl = null; azzera();
    ctl = F.anima(cv, function (dt) {
      var n = Math.round(dt / H);
      for (var k = 0; k < n && tt < 60; k++) { A = rk4(f, A, H); B = rk4(f, B, H); tt += H; if (k % 10 === 0) dist.push([tt, Math.max(1e-16, distanza(A, B))]); }
      var P = F.pennello(cv), q = P.q, W = P.W, Hh = P.H, cx = W / 2, cy = Hh * 0.45, Ls = Math.min(W, Hh) * 0.24;
      [[A, '#5eead4', 0], [B, '#ff8a80', 1]].forEach(function (c) {
        var y = c[0], x1 = cx + Ls * Math.sin(y[0]), y1 = cy + Ls * Math.cos(y[0]), x2 = x1 + Ls * Math.sin(y[1]), y2 = y1 + Ls * Math.cos(y[1]);
        scia[c[2]].push([x2, y2]); if (scia[c[2]].length > 300) scia[c[2]].shift();
        q.strokeStyle = c[1]; q.globalAlpha = 0.35; q.beginPath(); scia[c[2]].forEach(function (s, i) { if (i) q.lineTo(s[0], s[1]); else q.moveTo(s[0], s[1]); }); q.stroke(); q.globalAlpha = 1;
        q.lineWidth = 2.5; q.beginPath(); q.moveTo(cx, cy); q.lineTo(x1, y1); q.lineTo(x2, y2); q.stroke(); q.lineWidth = 1;
        q.fillStyle = c[1]; [[x1, y1], [x2, y2]].forEach(function (m) { q.beginPath(); q.arc(m[0], m[1], 6, 0, 2 * Math.PI); q.fill(); });
      });
      q.fillStyle = '#e6fffb'; q.beginPath(); q.arc(cx, cy, 3, 0, 2 * Math.PI); q.fill();
      var dE = Math.abs(doppioEnergia(A, par) - E0) / Math.abs(E0 || 1);
      q.font = '12px system-ui'; q.fillStyle = '#c9d3df'; q.textAlign = 'left'; q.fillText('t = ' + tt.toFixed(2) + ' s · |ΔE/E| = ' + dE.toExponential(1), 10, 18);
      cv.setAttribute('aria-label', t('due doppi pendoli quasi identici che divergono', 'two nearly identical double pendulums diverging'));
      var ly = lyap();
      F.grafico(cl, { serie: [{ x: dist.map(function (p) { return p[0]; }), y: dist.map(function (p) { return Math.log10(p[1]); }), col: '#ffc45a', larg: 2, etich: 'log₁₀ d' }], xmin: 0, xmax: Math.max(10, Math.ceil(tt / 5) * 5), ymin: -10, ymax: 1, xl: ['t (s)', 't (s)'], yl: ['log₁₀ |Δy|', 'log₁₀ |Δy|'], descr: ['distanza fra le due copie in scala logaritmica', 'separation between the two copies on a log scale'] });
      info.innerHTML = t('Energia iniziale ', 'Initial energy ') + 'E = ' + fmt(E0) + ' J · ' + t('deriva relativa ', 'relative drift ') + '<b class="bsiFX-num">' + dE.toExponential(1) + '</b><br>' + t('esponente di Lyapunov stimato ', 'estimated Lyapunov exponent ') + 'λ ≈ <b class="bsiFX-num">' + (ly ? fmt(ly) + ' s⁻¹' : '…') + '</b>' + (ly ? ' · ' + t('l’errore si moltiplica per 10 ogni ', 'the error grows tenfold every ') + fmt(Math.LN10 / ly) + ' s' : '') + '<br>' +
        t('Masse 1 kg, aste 1 m senza massa, g = 9,81 m/s². Le equazioni di Lagrange danno due equazioni accoppiate non lineari; RK4 con passo 1 ms conserva l’energia a meno di 10⁻⁶ (RK4 non è simplettico: la deriva è piccola ma sistematica). Con angoli grandi le traiettorie vicine si separano come e^(λt): dopo una ventina di secondi le due copie non hanno più niente in comune. È il caos deterministico: le equazioni sono esatte, ma la previsione richiederebbe una precisione iniziale che cresce esponenzialmente con l’orizzonte. Con angoli piccoli (moto quasi lineare, due modi normali) la distanza cresce solo linearmente.',
          'Masses 1 kg, massless rods 1 m, g = 9.81 m/s². Lagrange’s equations give two coupled nonlinear equations; RK4 with a 1 ms step conserves energy to better than 10⁻⁶ (RK4 is not symplectic: the drift is small but systematic). With large angles nearby trajectories separate like e^(λt): after about twenty seconds the two copies have nothing in common. This is deterministic chaos: the equations are exact, but prediction would need an initial precision growing exponentially with the horizon. With small angles (nearly linear motion, two normal modes) the separation grows only linearly.');
      if (tt >= 60) return false;
    }, { ricomincia: azzera });
  }

  /* ═══ 3. Lagrange e Noether ═════════════════════════════════════════════ */
  function schedaLagrange(div) {
    /* la perlina sull'anello */
    var G = griglia(div), st = { R: 0.2, w: 9, gam: 0.3 }, info = nota(G.pan), y = [0.3, 0];
    F.cursore(G.pan, ['velocità angolare dell’anello ω (rad/s)', 'hoop angular velocity ω (rad/s)'], 0, 20, 0.1, st.w, function (v) { st.w = v; disegna(); }, function (v) { return v.toFixed(1); });
    F.cursore(G.pan, ['raggio R (m)', 'radius R (m)'], 0.05, 1, 0.01, st.R, function (v) { st.R = v; disegna(); }, function (v) { return v.toFixed(2); });
    F.cursore(G.pan, ['attrito γ (1/s)', 'friction γ (1/s)'], 0, 3, 0.05, st.gam, function (v) { st.gam = v; }, function (v) { return v.toFixed(2); });
    F.bottone(G.pan, ['Spingi la perlina', 'Kick the bead'], function () { y = [y[0], y[1] + 6]; ctl.sveglia(); });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.5), cu = F.tela(G.dx, 0.42), fase = 0;
    function disegna() {
      var wc = Math.sqrt(g0 / st.R), eq = anelloEquilibri(st.R, st.w), xs = [], ys = [], i;
      for (i = 0; i <= 360; i++) { var th = -Math.PI + 2 * Math.PI * i / 360; xs.push(th * 180 / Math.PI); ys.push(anelloUeff(th, st.R, st.w)); }
      F.grafico(cu, { serie: [{ x: xs, y: ys, col: '#5eead4', larg: 2.5, etich: 'U_eff' }], punti: eq.map(function (e) { return { x: e.th * 180 / Math.PI, y: anelloUeff(e.th, st.R, st.w), col: e.stabile ? '#ffd24a' : '#ff8a80', r: 5 }; }), xmin: -180, xmax: 180, xl: ['θ (°)', 'θ (°)'], yl: ['U_eff/(mR²) (s⁻²)', 'U_eff/(mR²) (s⁻²)'], descr: ['potenziale efficace della perlina sull’anello', 'effective potential of the bead on the hoop'] });
      var st2 = eq.filter(function (e) { return e.stabile; });
      info.innerHTML = 'L = ½mR²(θ̇² + ω² sin²θ) + mgR cos θ<br>ω_c = √(g/R) = <b class="bsiFX-num">' + fmt(wc) + ' rad/s</b> · ω/ω_c = ' + fmt(st.w / wc) + '<br>' +
        (st.w < wc ? t('ω < ω_c: l’unico equilibrio stabile è il fondo, θ = 0, con piccole oscillazioni Ω = √(g/R − ω²) = ', 'ω < ω_c: the only stable equilibrium is the bottom, θ = 0, with small oscillations Ω = √(g/R − ω²) = ') + '<b class="bsiFX-num">' + fmt(Math.sqrt(st2[0].Om2)) + ' rad/s</b>' :
          t('ω > ω_c: il fondo diventa instabile e nascono due equilibri stabili a ', 'ω > ω_c: the bottom becomes unstable and two stable equilibria appear at ') + 'cos θ* = g/(Rω²) → θ* = ±<b class="bsiFX-num">' + fmt(st2[0].th * 180 / Math.PI) + '°</b>, Ω = ω sin θ* = ' + fmt(Math.sqrt(st2[0].Om2)) + ' rad/s') + '<br>' +
        t('È una biforcazione a forcone (pitchfork): la simmetria θ → −θ del sistema si rompe spontaneamente, la perlina «sceglie» un lato. L’equazione di Lagrange dà θ̈ = sin θ (ω² cos θ − g/R); il potenziale efficace U_eff = −mgR cos θ − ½mR²ω² sin²θ include la forza centrifuga del riferimento rotante. I punti gialli sono equilibri stabili, quelli rossi instabili.', 'It is a pitchfork bifurcation: the θ → −θ symmetry of the system breaks spontaneously, the bead “chooses” a side. Lagrange’s equation gives θ̈ = sin θ (ω² cos θ − g/R); the effective potential U_eff = −mgR cos θ − ½mR²ω² sin²θ includes the centrifugal force of the rotating frame. Yellow points are stable equilibria, red ones unstable.');
    }
    disegna(); F.alRidimensiona(disegna);
    var ctl = F.anima(cv, function (dt) {
      var f = anelloCampo(st.R, st.w, st.gam), n = Math.max(1, Math.ceil(dt / 0.001));
      for (var k = 0; k < n; k++) y = rk4(f, y, dt / n);
      fase += st.w * dt;
      var P = F.pennello(cv), q = P.q, W = P.W, H = P.H, cx = W * 0.3, cy = H / 2, R = Math.min(W * 0.25, H * 0.42), c = Math.cos(fase);
      /* l'anello visto di lato: un'ellisse che si stringe con la rotazione */
      q.strokeStyle = '#6bcfff'; q.lineWidth = 2; q.beginPath(); q.ellipse(cx, cy, Math.max(1, R * Math.abs(c)), R, 0, 0, 2 * Math.PI); q.stroke(); q.lineWidth = 1;
      q.strokeStyle = '#34465f'; q.setLineDash([4, 4]); q.beginPath(); q.moveTo(cx, cy - R - 12); q.lineTo(cx, cy + R + 12); q.stroke(); q.setLineDash([]);
      var bx = cx + R * Math.sin(y[0]) * c, by = cy + R * Math.cos(y[0]);
      q.fillStyle = '#ffd24a'; q.beginPath(); q.arc(bx, by, 7, 0, 2 * Math.PI); q.fill();
      /* a destra: l'anello nel riferimento rotante, con gli equilibri */
      var cx2 = W * 0.75; q.strokeStyle = '#6bcfff'; q.beginPath(); q.arc(cx2, cy, R, 0, 2 * Math.PI); q.stroke();
      anelloEquilibri(st.R, st.w).forEach(function (e) { q.fillStyle = e.stabile ? 'rgba(255,210,74,.35)' : 'rgba(255,138,128,.5)'; q.beginPath(); q.arc(cx2 + R * Math.sin(e.th), cy + R * Math.cos(e.th), 5, 0, 2 * Math.PI); q.fill(); });
      q.fillStyle = '#ffd24a'; q.beginPath(); q.arc(cx2 + R * Math.sin(y[0]), cy + R * Math.cos(y[0]), 7, 0, 2 * Math.PI); q.fill();
      q.fillStyle = '#9fb1c6'; q.font = '11px system-ui'; q.textAlign = 'center'; q.fillText(t('dal laboratorio', 'lab view'), cx, H - 6); q.fillText(t('nel riferimento rotante', 'rotating frame'), cx2, H - 6);
      q.textAlign = 'left'; q.fillStyle = '#c9d3df'; q.fillText('θ = ' + (y[0] * 180 / Math.PI).toFixed(1) + '°', 8, 16);
      cv.setAttribute('aria-label', t('perlina su un anello che ruota', 'bead on a rotating hoop'));
    });

    /* Noether */
    var G2 = griglia(div), s2 = { eps: 0 }, info2 = nota(G2.pan), S, L0, E0, storia, tt;
    G2.pan.insertBefore(F.el('div', { style: 'font-weight:800;color:#e6fffb;margin-bottom:4px', testo: t('Teorema di Noether', 'Noether’s theorem') }), info2);
    F.cursore(G2.pan, ['termine anisotropo ε x² (rompe la simmetria)', 'anisotropic term ε x² (breaks the symmetry)'], 0, 0.3, 0.01, s2.eps, function (v) { s2.eps = v; azz2(); }, function (v) { return v.toFixed(2); });
    G2.pan.appendChild(info2);
    var co = F.tela(G2.dx, 0.6), cL = F.tela(G2.dx, 0.35), traccia = [];
    function azz2() { S = [1, 0, 0, 0.8]; L0 = momentoL(S); E0 = energiaNoether(S, s2.eps); storia = []; tt = 0; traccia = []; if (ctl2) ctl2.sveglia(); }
    var ctl2 = null; azz2();
    ctl2 = F.anima(co, function (dt) {
      var h = 0.002, n = Math.round(dt * 4 / h);
      for (var k = 0; k < n && tt < 200; k++) { S = passoNoether(S, h, s2.eps); tt += h; if (k % 20 === 0) { storia.push([tt, momentoL(S)]); traccia.push([S[0], S[1]]); } }
      if (traccia.length > 3000) traccia.splice(0, traccia.length - 3000);
      var P = F.pennello(co), q = P.q, W = P.W, H = P.H, sc = Math.min(W, H) / 4.2, cx = W / 2, cy = H / 2;
      /* riferimenti: assi e cerchi di raggio 1 e 2, perche' l'orbita si legga gia' dal primo fotogramma */
      q.strokeStyle = '#46607a'; q.setLineDash([3, 4]); q.beginPath(); q.moveTo(0, cy); q.lineTo(W, cy); q.moveTo(cx, 0); q.lineTo(cx, H); q.stroke();
      [1, 2].forEach(function (rr) { q.beginPath(); q.arc(cx, cy, rr * sc, 0, 2 * Math.PI); q.stroke(); }); q.setLineDash([]);
      q.fillStyle = '#9fb1c6'; q.font = '11px system-ui'; q.textAlign = 'left'; q.fillText('x', W - 14, cy - 5); q.fillText('y', cx + 5, 12); q.fillText('r = 1', cx + sc + 3, cy - 4); q.fillText('r = 2', cx + 2 * sc + 3, cy - 4);
      q.strokeStyle = 'rgba(107,207,255,.55)'; q.beginPath(); traccia.forEach(function (p, i) { var X = cx + p[0] * sc, Y = cy - p[1] * sc; if (i) q.lineTo(X, Y); else q.moveTo(X, Y); }); q.stroke();
      q.fillStyle = '#ffd24a'; q.beginPath(); q.arc(cx, cy, 6, 0, 2 * Math.PI); q.fill();
      q.fillStyle = '#5eead4'; q.beginPath(); q.arc(cx + S[0] * sc, cy - S[1] * sc, 5, 0, 2 * Math.PI); q.fill();
      co.setAttribute('aria-label', t('orbita in un campo centrale', 'orbit in a central field'));
      F.grafico(cL, { serie: [{ x: storia.map(function (p) { return p[0]; }), y: storia.map(function (p) { return p[1]; }), col: '#5eead4', larg: 2, etich: 'L_z' }], xmin: 0, xmax: Math.max(20, Math.ceil(tt / 20) * 20), ymin: -1.4, ymax: 1.4, linee: [{ y: L0, col: '#8494a8', etich: 'L₀' }], xl: ['t', 't'], yl: ['L_z = x p_y − y p_x', 'L_z = x p_y − y p_x'], descr: ['momento angolare nel tempo', 'angular momentum over time'] });
      info2.innerHTML = 'V = −1/√(r² + a²) + ε x² · L_z = <b class="bsiFX-num">' + momentoL(S).toFixed(6) + '</b> (L₀ = ' + L0.toFixed(3) + ') · E − E₀ = ' + (energiaNoether(S, s2.eps) - E0).toExponential(1) + '<br>' +
        t('Noether: a ogni simmetria continua della lagrangiana corrisponde una quantità conservata. V(r) invariante per rotazioni → L_z costante (e l’integratore di Verlet la conserva esattamente, fino agli arrotondamenti, perché anche ogni suo passo è invariante per rotazioni). Il termine ε x² rompe la simmetria (resta solo quella discreta x → −x): la coppia τ = 2ε x y fa variare L_z, che oscilla (con ε grande cambia perfino segno), e l’orbita riempie una regione invece di restare un’ellisse che precede. L’energia invece resta conservata in entrambi i casi, perché V non dipende dal tempo (simmetria per traslazioni temporali). Il nucleo è smussato (a = 0,1) perché quando L_z passa per zero l’orbita va dritta nel centro.',
          'Noether: every continuous symmetry of the Lagrangian gives a conserved quantity. V(r) invariant under rotations → L_z constant (and the Verlet integrator conserves it exactly, up to rounding, because each of its steps is rotation-invariant too). The ε x² term breaks the symmetry (only the discrete x → −x remains): the torque τ = 2ε x y changes L_z, which oscillates (for large ε it even changes sign), and the orbit fills a region instead of staying a precessing ellipse. Energy stays conserved in both cases, because V does not depend on time (time-translation symmetry). The core is softened (a = 0.1) because when L_z passes through zero the orbit heads straight into the centre.');
      if (tt >= 200) return false;
    }, { ricomincia: azz2 });
  }

  /* ═══ 4. Liouville ══════════════════════════════════════════════════════ */
  function schedaLiouville(div) {
    var G = griglia(div), st = { sis: 'pendolo', pos: 'vicino', gam: 0.15 }, info = nota(G.pan), S, A0, storia;
    F.scelta(G.pan, ['Sistema', 'System'], [['oscillatore', ['oscillatore armonico', 'harmonic oscillator']], ['pendolo', ['pendolo', 'pendulum']], ['smorzato', ['pendolo smorzato (non hamiltoniano)', 'damped pendulum (not Hamiltonian)']]], st.sis, function (v) { st.sis = v; azzera(); });
    F.scelta(G.pan, ['Nube iniziale', 'Initial cloud'], [['centro', ['vicino al fondo', 'near the bottom']], ['vicino', ['grandi oscillazioni, vicino alla separatrice', 'large swings, near the separatrix']]], st.pos, function (v) { st.pos = v; azzera(); });
    F.cursore(G.pan, ['smorzamento γ (solo pendolo smorzato)', 'damping γ (damped pendulum only)'], 0.02, 0.5, 0.01, st.gam, function (v) { st.gam = v; azzera(); }, function (v) { return v.toFixed(2); });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.6), ca = F.tela(G.dx, 0.38);
    function azzera() { var c = st.pos === 'centro' ? [0.8, 0.3, 0.35] : [0, 1.6, 0.3]; S = statoBordo(nube(c[0], c[1], c[2], 400)); A0 = areaPoligono(S.P); storia = [[0, 1, 1]]; if (ctl) ctl.sveglia(); }
    function campo() { return SISTEMI[st.sis](st.gam); }
    var ctl = null; azzera();
    ctl = F.anima(cv, function (dt) {
      if (dt > 0 && S.t < 40) { var passi = Math.max(1, Math.round(dt * 2 / 0.01)); evolviBordo(S, campo(), 0.01, passi, 0.1); var A = areaPoligono(S.P), Hc = areaPoligono(involucro(S.P)); storia.push([S.t, A / A0, Hc / A0]); }
      var P = F.pennello(cv), q = P.q, W = P.W, H = P.H, XM = 4, YM = 3, X = function (v) { return (v + XM) / (2 * XM) * W; }, Y = function (v) { return (YM - v) / (2 * YM) * H; };
      q.strokeStyle = 'rgba(255,138,128,.6)'; q.beginPath();
      if (st.sis !== 'oscillatore') for (var s = -1; s <= 1; s += 2) for (var i = 0; i <= 200; i++) { var th = -XM + 2 * XM * i / 200, p = s * 2 * Math.abs(Math.cos(th / 2)); if (i) q.lineTo(X(th), Y(p)); else q.moveTo(X(th), Y(p)); }
      q.stroke();
      q.strokeStyle = '#34465f'; q.beginPath(); q.moveTo(0, Y(0)); q.lineTo(W, Y(0)); q.moveTo(X(0), 0); q.lineTo(X(0), H); q.stroke();
      var hull = involucro(S.P); q.strokeStyle = 'rgba(201,185,255,.7)'; q.setLineDash([4, 3]); q.beginPath(); hull.forEach(function (p, i) { if (i) q.lineTo(X(p[0]), Y(p[1])); else q.moveTo(X(p[0]), Y(p[1])); }); q.closePath(); q.stroke(); q.setLineDash([]);
      q.fillStyle = 'rgba(94,234,212,.35)'; q.strokeStyle = '#5eead4'; q.beginPath(); S.P.forEach(function (p, i) { if (i) q.lineTo(X(p[0]), Y(p[1])); else q.moveTo(X(p[0]), Y(p[1])); }); q.closePath(); q.fill(); q.stroke();
      q.fillStyle = '#9fb1c6'; q.font = '11px system-ui'; q.textAlign = 'left'; q.fillText(st.sis === 'oscillatore' ? 'q' : 'θ', W - 14, Y(0) - 4); q.fillText('p', X(0) + 4, 12);
      cv.setAttribute('aria-label', t('nube di condizioni iniziali nello spazio delle fasi', 'cloud of initial conditions in phase space'));
      var last = storia[storia.length - 1];
      F.grafico(ca, { serie: [{ x: storia.map(function (p) { return p[0]; }), y: storia.map(function (p) { return p[1]; }), col: '#5eead4', larg: 2.5, etich: [t('area del bordo', 'boundary area'), 'boundary area'] }, { x: storia.map(function (p) { return p[0]; }), y: storia.map(function (p) { return p[2]; }), col: '#c9b9ff', larg: 2, tratt: true, etich: [t('involucro convesso', 'convex hull'), 'convex hull'] }], xmin: 0, xmax: 40, ymin: 0, xl: ['t (1/ω₀)', 't (1/ω₀)'], yl: ['A/A₀', 'A/A₀'], descr: ['area della nube nel tempo', 'cloud area over time'], legenda: [{ col: '#5eead4', etich: ['area (Gauss, sul bordo)', 'area (shoelace, boundary)'] }, { col: '#c9b9ff', etich: ['involucro convesso', 'convex hull'] }] });
      info.innerHTML = t('Punti sul bordo ', 'Boundary points ') + S.P.length + ' · A/A₀ = <b class="bsiFX-num">' + last[1].toFixed(4) + '</b>' + (st.sis === 'smorzato' ? ' (e^(−γt) = ' + Math.exp(-st.gam * S.t).toFixed(4) + ')' : '') + ' · ' + t('involucro ', 'hull ') + last[2].toFixed(2) + '<br>' +
        t('Teorema di Liouville: il flusso hamiltoniano ha divergenza nulla, ∂q̇/∂q + ∂ṗ/∂p = ∂²H/∂q∂p − ∂²H/∂p∂q = 0, quindi conserva il volume nello spazio delle fasi. Per l’oscillatore la nube ruota rigidamente; per il pendolo i punti più vicini alla separatrice hanno periodo più lungo e restano indietro: la nube si stira in un filamento sempre più sottile, ma la sua area non cambia (il bordo viene raffinato aggiungendo punti dove si allunga). L’involucro convesso invece cresce: è l’origine dell’aumento dell’entropia «a grana grossa». Con l’attrito la divergenza vale −γ e l’area si contrae come e^(−γt).',
          'Liouville’s theorem: the Hamiltonian flow is divergence-free, ∂q̇/∂q + ∂ṗ/∂p = ∂²H/∂q∂p − ∂²H/∂p∂q = 0, so it preserves phase-space volume. For the oscillator the cloud rotates rigidly; for the pendulum the points closer to the separatrix have a longer period and lag behind: the cloud stretches into an ever thinner filament, but its area does not change (the boundary is refined by adding points where it stretches). The convex hull grows instead: this is the origin of “coarse-grained” entropy increase. With friction the divergence is −γ and the area contracts as e^(−γt).');
      if (S.t >= 40) return false;
    }, { ricomincia: azzera });
  }

  F.sezione('sfisanalitica', {
    titolo: ['🎡 Meccanica analitica', '🎡 Analytical mechanics'],
    sotto: ['Lo spazio delle fasi del pendolo con il periodo esatto dall’integrale ellittico, il caos del doppio pendolo, la perlina sull’anello rotante e il teorema di Noether, il teorema di Liouville con una nube di condizioni iniziali.', 'The pendulum phase space with the exact period from the elliptic integral, double-pendulum chaos, the bead on a rotating hoop and Noether’s theorem, Liouville’s theorem with a cloud of initial conditions.'],
    schede: [
      { nome: ['🌀 Spazio delle fasi', '🌀 Phase space'], costruisci: schedaFasi },
      { nome: ['🦋 Doppio pendolo', '🦋 Double pendulum'], costruisci: schedaDoppio },
      { nome: ['📿 Lagrange e Noether', '📿 Lagrange and Noether'], costruisci: schedaLagrange },
      { nome: ['💧 Liouville', '💧 Liouville'], costruisci: schedaLiouville }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
