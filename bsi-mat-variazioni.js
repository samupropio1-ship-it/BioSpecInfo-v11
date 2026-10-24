/* ═══════════════════════════════════════════════════════════════════════════
   bsi-mat-variazioni.js — 🎢 calcolo delle variazioni
   BioSpecInfo · © Samuele Pio Provenzano

   · BRACHISTOCRONA: la gara delle perline da A a B lungo un segmento, un arco
     di cerchio, una parabola e la cicloide (ricavata dagli estremi
     risolvendo per l'angolo finale θ); i tempi si integrano numericamente
     con dt = ds/√(2gy) e, per la cicloide, si confrontano con la forma chiusa
     T = √(R/g)·θ_fine;
   · CATENARIA: una catena di N maglie rigide che scende al minimo
     dell'energia potenziale (discesa del gradiente proiettata sui vincoli
     degli estremi) contro la curva a·cosh((x − x₀)/a) + c della stessa
     lunghezza;
   · SUPERFICIE MINIMA DI ROTAZIONE: la pellicola di sapone fra due anelli
     uguali e' un catenoide; allontanando gli anelli oltre h/R ≈ 1,3255 il
     catenoide non esiste piu' e la pellicola si strappa nei due dischi
     (soluzione di Goldschmidt); le aree a confronto;
   · EULERO–LAGRANGE E METODO DI TIRO: il principio di Fermat; con
     un'interfaccia netta minimizzare il tempo fa emergere la legge di
     Snell; in un mezzo con indice che varia con la quota il raggio risolve
     l'equazione di Eulero–Lagrange, e lo si trova «sparando» angoli
     iniziali finche' colpisce il bersaglio (la soluzione esatta e' un coseno
     iperbolico, come la catena).
   Unita': metri e secondi, g = 9,81 m/s²; nel mezzo ottico c = 1.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt, G0 = 9.81;
  function griglia(div) { var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); G.appendChild(pan); G.appendChild(dx); div.appendChild(G); return { pan: pan, dx: dx }; }
  function nota(pan) { var n = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(n); return n; }
  function bisezione(f, a, b, it) { var fa = f(a); for (var i = 0; i < (it || 200); i++) { var m = (a + b) / 2, fm = f(m); if ((fm > 0) === (fa > 0)) { a = m; fa = fm; } else b = m; } return (a + b) / 2; }

  /* ═══ calcoli: brachistocrona ═══════════════════════════════════════════
     y verso il BASSO, A = (0, 0), B = (xB, yB) con yB > 0. Ogni curva e' data
     come P(u), u ∈ [0, 1], con posizione e derivata. */
  /* cicloide per A e B: (θ − sin θ)/(1 − cos θ) = xB/yB, crescente su (0, 2π) */
  function cicloide(xB, yB) {
    var th = bisezione(function (q) { return (q - Math.sin(q)) / (1 - Math.cos(q)) - xB / yB; }, 1e-9, 2 * Math.PI - 1e-9);
    var R = yB / (1 - Math.cos(th));
    return { theta: th, R: R, T: Math.sqrt(R / G0) * th };
  }
  function curve(xB, yB) {
    var C = cicloide(xB, yB), c = (xB * xB + yB * yB) / (2 * xB), fB = Math.atan2(yB / c, 1 - xB / c);
    return {
      retta: function (u) { return [xB * u, yB * u, xB, yB]; },
      cerchio: function (u) { var f = fB * u; return [c * (1 - Math.cos(f)), c * Math.sin(f), c * Math.sin(f) * fB, c * Math.cos(f) * fB]; },
      parabola: function (u) { return [xB * u * u, yB * u, 2 * xB * u, yB]; },
      cicloide: function (u) { var q = C.theta * u; return [C.R * (q - Math.sin(q)), C.R * (1 - Math.cos(q)), C.R * (1 - Math.cos(q)) * C.theta, C.R * Math.sin(q) * C.theta]; },
      dati: C
    };
  }
  /* tempo di discesa da fermo: T = ∫ ds/√(2gy). Con u = s² l'integrando 2s|P'(u)|/√(2g y(u))
     resta finito in A (y ∝ u): regola del punto medio su s. Restituisce anche la tavola t(s) */
  function tempo(P, M, tavola) {
    M = M || 4000; var T = 0, tab = tavola ? [[0, 0, 0]] : null;
    for (var i = 0; i < M; i++) {
      var s = (i + 0.5) / M, u = s * s, p = P(u);
      T += 2 * s * Math.hypot(p[2], p[3]) / Math.sqrt(2 * G0 * p[1]) / M;
      if (tab) { var q = P(((i + 1) / M) * ((i + 1) / M)); tab.push([T, q[0], q[1]]); }
    }
    return tavola ? { T: T, tab: tab } : T;
  }
  function tempoRetta(xB, yB) { return Math.sqrt(2 * (xB * xB + yB * yB) / (G0 * yB)); }
  /* tempo lungo una spezzata (punti con y verso il basso, il primo in A): su ogni segmento
     l'accelerazione e' costante, quindi Δt = ℓ / media delle velocita' */
  function tempoSpezzata(pts) {
    var T = 0;
    for (var i = 1; i < pts.length; i++) { var v1 = Math.sqrt(2 * G0 * Math.max(0, pts[i - 1][1])), v2 = Math.sqrt(2 * G0 * Math.max(0, pts[i][1])); T += 2 * Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]) / (v1 + v2); }
    return T;
  }

  /* ═══ calcoli: catenaria ════════════════════════════════════════════════
     y verso l'ALTO, estremi A = (0, 0) e B = (d, h), lunghezza L > |AB|.
     La catena discreta: N maglie lunghe ℓ = L/N, angoli φₖ; massa al centro di ogni maglia. */
  function catenaCrea(N, d, h, L) {
    var l = L / N, phi = new Float64Array(N), b = Math.acos(Math.min(0.999, d / L));
    for (var k = 0; k < N; k++) phi[k] = k < N / 2 ? -b : b;
    var C = { N: N, d: d, h: h, L: L, l: l, phi: phi, v: new Float64Array(N), passi: 0, residuo: 1 };
    catenaVincoli(C, 30); return C;
  }
  /* riporta gli estremi al loro posto: Newton sui due vincoli Σℓcosφ = d, Σℓsinφ = h lungo i gradienti */
  function catenaVincoli(C, it) {
    var N = C.N, l = C.l, p = C.phi;
    for (var r = 0; r < it; r++) {
      var r1 = -C.d, r2 = -C.h, aa = 0, ab = 0, bb = 0, k;
      for (k = 0; k < N; k++) { var c = Math.cos(p[k]), s = Math.sin(p[k]); r1 += l * c; r2 += l * s; aa += l * l * s * s; ab -= l * l * s * c; bb += l * l * c * c; }
      if (Math.abs(r1) + Math.abs(r2) < 1e-14) break;
      var det = aa * bb - ab * ab, m1 = (-r1 * bb + r2 * ab) / det, m2 = (-r2 * aa + r1 * ab) / det;
      for (k = 0; k < N; k++) p[k] += -m1 * l * Math.sin(p[k]) + m2 * l * Math.cos(p[k]);
    }
  }
  /* energia potenziale per unita' di peso totale = quota media dei centri delle maglie */
  function catenaEnergia(C) { var y = 0, E = 0; for (var k = 0; k < C.N; k++) { var s = C.l * Math.sin(C.phi[k]); E += y + s / 2; y += s; } return E / C.N; }
  function catenaPunti(C) { var x = 0, y = 0, out = [[0, 0]]; for (var k = 0; k < C.N; k++) { x += C.l * Math.cos(C.phi[k]); y += C.l * Math.sin(C.phi[k]); out.push([x, y]); } return out; }
  /* un passo di discesa del gradiente con momento, proiettato sullo spazio tangente ai vincoli */
  function catenaPasso(C, eta, mom) {
    var N = C.N, l = C.l, p = C.phi, g = new Float64Array(N), aa = 0, ab = 0, bb = 0, ag = 0, bg = 0, k;
    for (k = 0; k < N; k++) { var c = Math.cos(p[k]), s = Math.sin(p[k]), a = -l * s, b = l * c; g[k] = l * c * (N - k - 0.5) / N; aa += a * a; ab += a * b; bb += b * b; ag += a * g[k]; bg += b * g[k]; }
    var det = aa * bb - ab * ab, L1 = (ag * bb - bg * ab) / det, L2 = (bg * aa - ag * ab) / det, n2 = 0;
    for (k = 0; k < N; k++) { var pk = g[k] + L1 * l * Math.sin(p[k]) - L2 * l * Math.cos(p[k]); n2 += pk * pk; C.v[k] = mom * C.v[k] - eta * pk; p[k] += C.v[k]; }
    catenaVincoli(C, 3); C.passi++; C.residuo = Math.sqrt(n2);
    return C.residuo;
  }
  function catenaMinimizza(N, d, h, L, maxPassi) {
    var C = catenaCrea(N, d, h, L);
    for (var i = 0; i < (maxPassi || 20000); i++) if (catenaPasso(C, 1, 0.9) < 1e-12) break;
    return C;
  }
  /* catenaria continua per A e B con lunghezza L: √(L² − h²) = 2a sinh(d/2a), x₀ = d/2 − a·atanh(h/L) */
  function catenaria(d, h, L) {
    var Q = Math.sqrt(L * L - h * h) / d;
    var z = bisezione(function (z) { return Math.sinh(z) / z - Q; }, 1e-9, 50);  /* z = d/(2a) */
    var a = d / (2 * z), x0 = d / 2 - a * Math.atanh(h / L), c = -a * Math.cosh(x0 / a);
    return { a: a, x0: x0, c: c, y: function (x) { return a * Math.cosh((x - x0) / a) + c; } };
  }

  /* ═══ calcoli: catenoide ════════════════════════════════════════════════
     anelli di raggio R a z = ±h/2; profilo r(z) = a cosh(z/a), con a cosh(h/2a) = R.
     Con u = h/(2a): cosh(u)/u = 2R/h. Il minimo di cosh(u)/u e' in u* (u tanh u = 1). */
  var USTAR = bisezione(function (u) { return u * Math.tanh(u) - 1; }, 0.5, 3);
  var CRITICO = 2 * USTAR / Math.cosh(USTAR);   /* h/R massimo ≈ 1,3255 */
  function catenoide(h, R) {
    R = R || 1;
    if (h / R > CRITICO) return null;
    var q = 2 * R / h, f = function (u) { return Math.cosh(u) / u - q; };
    var u1 = bisezione(f, 1e-6, USTAR), u2 = bisezione(f, USTAR, 60);
    function forma(u) { var a = h / (2 * u); return { a: a, u: u, area: Math.PI * a * (h + a * Math.sinh(h / a)) }; }
    return { stabile: forma(u1), instabile: forma(u2) };
  }
  function areaDischi(R) { R = R || 1; return 2 * Math.PI * R * R; }
  /* separazione a cui l'area del catenoide stabile eguaglia quella dei due dischi */
  var INCROCIO = bisezione(function (h) { return catenoide(h, 1).stabile.area - areaDischi(1); }, 0.5, CRITICO - 1e-9);
  /* area per integrazione numerica (Simpson), secondo metodo: A = 2π ∫ r √(1 + r'²) dz */
  function areaNumerica(a, h) { var n = 2000, s = 0, dz = h / n; for (var i = 0; i <= n; i++) { var z = -h / 2 + i * dz, r = a * Math.cosh(z / a), rp = Math.sinh(z / a); s += (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) * r * Math.sqrt(1 + rp * rp); } return 2 * Math.PI * s * dz / 3; }

  /* ═══ calcoli: Fermat ═══════════════════════════════════════════════════ */
  /* interfaccia netta y = 0: A = (0, yA) sopra con indice n1, B = (X, −yB) sotto con n2;
     tempo ottico T(x) = n1 √(x² + yA²) + n2 √((X − x)² + yB²), minimizzato con la sezione aurea */
  function tempoOttico(x, P) { return P.n1 * Math.hypot(x, P.yA) + P.n2 * Math.hypot(P.X - x, P.yB); }
  function fermatNetta(P) {
    var a = 0, b = P.X, r = (Math.sqrt(5) - 1) / 2;
    for (var i = 0; i < 200; i++) { var c = b - r * (b - a), d = a + r * (b - a); if (tempoOttico(c, P) < tempoOttico(d, P)) b = d; else a = c; }
    var x = (a + b) / 2, s1 = x / Math.hypot(x, P.yA), s2 = (P.X - x) / Math.hypot(P.X - x, P.yB);
    return { x: x, T: tempoOttico(x, P), sin1: s1, sin2: s2, snell: P.n1 * s1 - P.n2 * s2 };
  }
  /* mezzo graduato n(y) = n0 + α y. Eulero–Lagrange di ∫ n(y)√(1 + y'²) dx:
     y'' = (n'/n)(1 + y'²); integrato con RK4 dalla pendenza iniziale s */
  function raggio(s, P, M, tutto) {
    M = M || 800; var dx = P.X / M, y = P.yA, v = s, x = 0, Lo = 0, out = tutto ? [[0, y]] : null, n = function (y) { return P.n0 + P.alfa * y; };
    function acc(y, v) { return P.alfa / n(y) * (1 + v * v); }
    function lag(y, v) { return n(y) * Math.sqrt(1 + v * v); }
    for (var i = 0; i < M; i++) {
      var k1y = v, k1v = acc(y, v), k2y = v + dx / 2 * k1v, k2v = acc(y + dx / 2 * k1y, v + dx / 2 * k1v), k3y = v + dx / 2 * k2v, k3v = acc(y + dx / 2 * k2y, v + dx / 2 * k2v), k4y = v + dx * k3v, k4v = acc(y + dx * k3y, v + dx * k3v);
      var l1 = lag(y, v), l2 = lag(y + dx / 2 * k1y, v + dx / 2 * k1v), l3 = lag(y + dx / 2 * k2y, v + dx / 2 * k2v), l4 = lag(y + dx * k3y, v + dx * k3v);
      Lo += dx / 6 * (l1 + 2 * l2 + 2 * l3 + l4);
      y += dx / 6 * (k1y + 2 * k2y + 2 * k3y + k4y); v += dx / 6 * (k1v + 2 * k2v + 2 * k3v + k4v); x += dx;
      if (!isFinite(y) || n(y) <= 0.05) return { y: NaN, v: NaN, L: Infinity, pts: out };
      if (out) out.push([x, y]);
    }
    return { y: y, v: v, L: Lo, pts: out };
  }
  /* metodo di tiro: si scandiscono le pendenze, si cercano i cambi di segno di y(X) − yB,
     si affina ogni radice con la bisezione e si tiene quella di cammino ottico minimo.
     I tentativi sono registrati per l'animazione */
  function tiro(P) {
    var tent = [], prec = null, radici = [];
    for (var i = 0; i <= 60; i++) {
      var s = -3 + 6 * i / 60, R = raggio(s, P, 200), e = R.y - P.yB; tent.push(s);
      if (prec && isFinite(e) && isFinite(prec[1]) && (e > 0) !== (prec[1] > 0)) radici.push([prec[0], s]);
      prec = [s, e];
    }
    var migliore = null;
    radici.forEach(function (ab) {
      var a = ab[0], b = ab[1], fa = raggio(a, P).y - P.yB;
      for (var k = 0; k < 60; k++) { var m = (a + b) / 2, fm = raggio(m, P).y - P.yB; if (k < 14) tent.push(m); if ((fm > 0) === (fa > 0)) { a = m; fa = fm; } else b = m; }
      var s0 = (a + b) / 2, R = raggio(s0, P, 800, true);
      if (!migliore || R.L < migliore.L) migliore = { s: s0, L: R.L, pts: R.pts, errore: R.y - P.yB };
    });
    return { soluzione: migliore, tentativi: tent, nRadici: radici.length };
  }
  /* soluzione esatta: l'integrale primo (Beltrami) n/√(1 + y'²) = C da' n(x) = C cosh(α(x − x₀)/C) */
  function raggioEsatto(s, P) {
    var nA = P.n0 + P.alfa * P.yA, C = nA / Math.sqrt(1 + s * s);
    if (Math.abs(P.alfa) < 1e-12) return function (x) { return P.yA + s * x; };
    var x0 = -C * Math.asinh(s) / P.alfa;
    return function (x) { return (C * Math.cosh(P.alfa * (x - x0) / C) - P.n0) / P.alfa; };
  }
  function costanteBeltrami(y, v, P) { return (P.n0 + P.alfa * y) / Math.sqrt(1 + v * v); }

  F.calcolo.variazioni = { G: G0, cicloide: cicloide, curve: curve, tempo: tempo, tempoRetta: tempoRetta, tempoSpezzata: tempoSpezzata, catenaCrea: catenaCrea, catenaPasso: catenaPasso, catenaVincoli: catenaVincoli, catenaEnergia: catenaEnergia, catenaPunti: catenaPunti, catenaMinimizza: catenaMinimizza, catenaria: catenaria, USTAR: USTAR, CRITICO: CRITICO, INCROCIO: INCROCIO, catenoide: catenoide, areaDischi: areaDischi, areaNumerica: areaNumerica, tempoOttico: tempoOttico, fermatNetta: fermatNetta, raggio: raggio, tiro: tiro, raggioEsatto: raggioEsatto, costanteBeltrami: costanteBeltrami };

  /* ═══ 1. brachistocrona ═════════════════════════════════════════════════ */
  var NOMI = { retta: ['segmento', 'straight line'], cerchio: ['arco di cerchio', 'circular arc'], parabola: ['parabola', 'parabola'], cicloide: ['cicloide', 'cycloid'] };
  var COLORI = { retta: '#ff8a80', cerchio: '#6bcfff', parabola: '#c9b9ff', cicloide: '#ffd24a' };
  function schedaBrachi(div) {
    var G = griglia(div), st = { xB: 3, yB: 1.2 }, info = nota(G.pan), K, tav, T, tau = 0, fine;
    F.cursore(G.pan, ['distanza orizzontale xB (m)', 'horizontal distance xB (m)'], 0.5, 5, 0.05, st.xB, function (v) { st.xB = v; calcola(); }, function (v) { return v.toFixed(2); });
    F.cursore(G.pan, ['dislivello yB (m)', 'drop yB (m)'], 0.3, 3, 0.05, st.yB, function (v) { st.yB = v; calcola(); }, function (v) { return v.toFixed(2); });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.62), ctl;
    function calcola() {
      K = curve(st.xB, st.yB); tav = {}; T = {}; fine = 0;
      Object.keys(NOMI).forEach(function (k) { var r = tempo(K[k], 1500, true); tav[k] = r.tab; T[k] = r.T; fine = Math.max(fine, r.T); });
      tau = 0;
      var ord = Object.keys(NOMI).sort(function (a, b) { return T[a] - T[b]; });
      info.innerHTML = ord.map(function (k, i) { return '<span style="color:' + COLORI[k] + '">●</span> ' + F.tt(NOMI[k]) + ': <b class="bsiFX-num">' + T[k].toFixed(4) + ' s</b>' + (i === 0 ? ' 🏁' : ''); }).join('<br>') +
        '<br>' + t('Cicloide: θ_fine = ', 'Cycloid: θ_end = ') + K.dati.theta.toFixed(4) + ' rad, R = ' + K.dati.R.toFixed(4) + ' m, √(R/g)·θ = <b class="bsiFX-num">' + K.dati.T.toFixed(4) + ' s</b>' + (K.dati.theta > Math.PI ? t(' (scende sotto B e risale)', ' (dips below B and climbs back)') : '') +
        '<br>' + t('Il tempo T = ∫ ds/√(2gy) è un funzionale della curva; la sua equazione di Eulero–Lagrange (con l’identità di Beltrami, perché l’integrando non dipende da x) dà y(1 + y′²) = 2R: la cicloide, la curva di un punto su una ruota che rotola. Il segmento è il più corto ma il più lento: conviene cadere ripidi all’inizio e guadagnare velocità.', 'The time T = ∫ ds/√(2gy) is a functional of the curve; its Euler–Lagrange equation (with the Beltrami identity, since the integrand does not depend on x) gives y(1 + y′²) = 2R: the cycloid, traced by a point on a rolling wheel. The straight line is the shortest but slowest: it pays to fall steeply at first and gain speed.');
      if (ctl) ctl.sveglia();
    }
    function posizione(tab, tt) {
      if (tt >= tab[tab.length - 1][0]) return tab[tab.length - 1];
      var lo = 0, hi = tab.length - 1; while (hi - lo > 1) { var m = (lo + hi) >> 1; if (tab[m][0] <= tt) lo = m; else hi = m; }
      var a = tab[lo], b = tab[hi], f = (tt - a[0]) / (b[0] - a[0] || 1); return [tt, a[1] + f * (b[1] - a[1]), a[2] + f * (b[2] - a[2])];
    }
    calcola();
    ctl = F.anima(cv, function (dt) {
      tau += dt * 0.5;
      var P = F.pennello(cv), q = P.q, W = P.W, H = P.H, ymax = st.yB;
      tav.cicloide.forEach(function (p) { ymax = Math.max(ymax, p[2]); }); tav.cerchio.forEach(function (p) { ymax = Math.max(ymax, p[2]); });
      var sc = Math.min((W - 40) / st.xB, (H - 40) / ymax), ox = 20 + (W - 40 - sc * st.xB) / 2, oy = 20, X = function (x) { return ox + x * sc; }, Y = function (y) { return oy + y * sc; };
      Object.keys(NOMI).forEach(function (k) {
        q.strokeStyle = COLORI[k]; q.globalAlpha = 0.75; q.lineWidth = 2; q.beginPath();
        tav[k].forEach(function (p, i) { if (i % 5 && i !== tav[k].length - 1) return; if (i) q.lineTo(X(p[1]), Y(p[2])); else q.moveTo(X(p[1]), Y(p[2])); }); q.stroke(); q.globalAlpha = 1;
        var b = posizione(tav[k], tau); q.fillStyle = COLORI[k]; q.beginPath(); q.arc(X(b[1]), Y(b[2]), 6, 0, 2 * Math.PI); q.fill();
        if (tau >= T[k]) { q.font = '11px system-ui'; q.textAlign = 'right'; q.fillText(F.tt(NOMI[k]) + ' ' + T[k].toFixed(3) + ' s', W - 8, 16 + 14 * Object.keys(NOMI).indexOf(k)); q.textAlign = 'left'; }
      });
      q.lineWidth = 1; q.fillStyle = '#e6fffb'; q.font = '12px system-ui'; q.fillText('A', X(0) - 4, Y(0) - 6); q.fillText('B', X(st.xB) + 6, Y(st.yB) + 4);
      q.fillStyle = '#8494a8'; q.fillText('t = ' + Math.min(tau, fine).toFixed(3) + ' s', 8, H - 8);
      cv.setAttribute('aria-label', t('gara delle perline: segmento, cerchio, parabola, cicloide', 'bead race: line, circle, parabola, cycloid'));
      if (tau > fine + 0.6) return false;
    }, { ricomincia: function () { tau = 0; } });
  }

  /* ═══ 2. catenaria ══════════════════════════════════════════════════════ */
  function schedaCatena(div) {
    var G = griglia(div), st = { N: 24, d: 2, h: 0.4, L: 3 }, info = nota(G.pan), C, K;
    F.cursore(G.pan, ['numero di maglie N', 'number of links N'], 4, 80, 1, st.N, function (v) { st.N = v; nuova(); });
    F.cursore(G.pan, ['distanza fra gli appigli d (m)', 'distance between supports d (m)'], 0.4, 2.8, 0.05, st.d, function (v) { st.d = v; nuova(); }, function (v) { return v.toFixed(2); });
    F.cursore(G.pan, ['dislivello h (m)', 'height difference h (m)'], -1, 1, 0.05, st.h, function (v) { st.h = v; nuova(); }, function (v) { return v.toFixed(2); });
    F.bottone(G.pan, ['Lascia cadere di nuovo', 'Drop again'], nuova);
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.7), ctl;
    function nuova() {
      var h = st.h, lim = 0.97 * st.L; if (Math.hypot(st.d, h) > lim) h = (h < 0 ? -1 : 1) * Math.sqrt(Math.max(0, lim * lim - st.d * st.d));
      C = catenaCrea(st.N, st.d, h, st.L); K = catenaria(st.d, h, st.L); if (ctl) ctl.sveglia();
    }
    nuova();
    ctl = F.anima(cv, function () {
      for (var i = 0; i < 4 && C.residuo > 1e-12; i++) catenaPasso(C, 1, 0.9);
      var pts = catenaPunti(C), P = F.pennello(cv), q = P.q, W = P.W, H = P.H, ymin = 0, ymax = Math.max(0, C.h);
      pts.forEach(function (p) { ymin = Math.min(ymin, p[1]); });
      var dmax = 0; for (var k = 1; k < pts.length - 1; k++) dmax = Math.max(dmax, Math.abs(pts[k][1] - K.y(pts[k][0])));
      var sc = Math.min((W - 40) / st.d, (H - 40) / (ymax - ymin + 0.6)), ox = (W - sc * st.d) / 2, oy = 20 + sc * (ymax + 0.3 - ymax) + sc * ymax, X = function (x) { return ox + x * sc; }, Y = function (y) { return oy - y * sc; };
      q.strokeStyle = '#ffd24a'; q.setLineDash([5, 4]); q.lineWidth = 2; q.beginPath(); for (k = 0; k <= 200; k++) { var x = st.d * k / 200; if (k) q.lineTo(X(x), Y(K.y(x))); else q.moveTo(X(x), Y(K.y(x))); } q.stroke(); q.setLineDash([]);
      q.strokeStyle = '#6bcfff'; q.lineWidth = 3; q.beginPath(); pts.forEach(function (p, i) { if (i) q.lineTo(X(p[0]), Y(p[1])); else q.moveTo(X(p[0]), Y(p[1])); }); q.stroke();
      q.fillStyle = '#e6fffb'; pts.forEach(function (p) { q.beginPath(); q.arc(X(p[0]), Y(p[1]), st.N > 40 ? 1.5 : 2.6, 0, 2 * Math.PI); q.fill(); });
      q.fillStyle = '#ff8a80'; [[0, 0], [C.d, C.h]].forEach(function (p) { q.fillRect(X(p[0]) - 5, Y(p[1]) - 5, 10, 10); });
      q.lineWidth = 1; q.font = '11px system-ui'; q.fillStyle = '#8494a8'; q.fillText(t('blu: catena (', 'blue: chain (') + C.passi + t(' passi) · giallo: a·cosh', ' steps) · yellow: a·cosh'), 8, H - 8);
      cv.setAttribute('aria-label', t('catena che scende al minimo dell’energia e catenaria', 'chain settling to minimum energy and catenary'));
      info.innerHTML = t('Energia (quota media del baricentro) ', 'Energy (mean height of the centre of mass) ') + '<b class="bsiFX-num">' + catenaEnergia(C).toFixed(6) + ' m</b> · ' + t('gradiente proiettato ', 'projected gradient ') + fmt(C.residuo) + '<br>' +
        'a = <b class="bsiFX-num">' + K.a.toFixed(4) + ' m</b>, x₀ = ' + K.x0.toFixed(4) + ' m · ' + t('scarto massimo dei nodi dalla catenaria ', 'max node deviation from the catenary ') + '<b>' + fmt(dmax) + ' m</b><br>' +
        t('Si minimizza U = ∫ ρg y ds col vincolo ∫ ds = L (moltiplicatore di Lagrange λ): Eulero–Lagrange per (y − λ)√(1 + y′²) dà y = a cosh((x − x₀)/a) + c, con a = H/(ρg) (tensione orizzontale costante). La lunghezza fissa determina a da √(L² − h²) = 2a sinh(d/2a). Con N maglie la catena discreta differisce dalla curva per O(1/N²): raddoppiando N lo scarto si divide circa per 4.', 'One minimises U = ∫ ρg y ds with the constraint ∫ ds = L (Lagrange multiplier λ): Euler–Lagrange for (y − λ)√(1 + y′²) gives y = a cosh((x − x₀)/a) + c, with a = H/(ρg) (constant horizontal tension). The fixed length sets a from √(L² − h²) = 2a sinh(d/2a). With N links the discrete chain differs from the curve by O(1/N²): doubling N divides the deviation by about 4.');
      if (C.residuo < 1e-12) return false;
    }, { ricomincia: nuova });
  }

  /* ═══ 3. catenoide ══════════════════════════════════════════════════════ */
  function schedaCatenoide(div) {
    var G = griglia(div), st = { h: 0.8, tira: false }, info = nota(G.pan), inp;
    inp = F.cursore(G.pan, ['separazione degli anelli h/R', 'ring separation h/R'], 0.1, 1.5, 0.005, st.h, function (v) { st.h = v; st.tira = false; ctl.sveglia(); grafico(); }, function (v) { return v.toFixed(3); });
    F.bottone(G.pan, ['▶ Allontana lentamente', '▶ Pull apart slowly'], function () { if (st.h > 1.4) st.h = 0.6; st.tira = true; ctl.sveglia(); });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.6), cg = F.tela(G.dx, 0.5), ctl;
    function grafico() {
      var xs = [], ys = [], yi = [];
      for (var h = 0.05; h <= CRITICO; h += 0.005) { var c = catenoide(h, 1); xs.push(h); ys.push(c.stabile.area); yi.push(Math.min(14, c.instabile.area)); }
      var c0 = catenoide(st.h, 1), punti = c0 ? [{ x: st.h, y: c0.stabile.area, col: '#5eead4', r: 5 }] : [{ x: st.h, y: areaDischi(1), col: '#ff8a80', r: 5 }];
      F.grafico(cg, { serie: [{ x: xs, y: ys, col: '#5eead4', larg: 2, etich: t('catenoide stabile', 'stable catenoid') }, { x: xs, y: yi, col: '#c9b9ff', larg: 1.5, tratt: true, etich: t('catenoide instabile', 'unstable catenoid') }, { x: [CRITICO, CRITICO], y: [0, 14], col: '#ff8a80', larg: 1, tratt: true, etich: 'h*/R' }, { x: [INCROCIO, INCROCIO], y: [0, 14], col: '#ffc45a', larg: 1, tratt: true, etich: t('incrocio', 'crossing') }], punti: punti, linee: [{ y: areaDischi(1), col: '#ffd24a', etich: t('due dischi 2πR²', 'two discs 2πR²') }], xmin: 0, xmax: 1.5, ymin: 0, ymax: 14, xl: ['h/R', 'h/R'], yl: [t('area / R²', 'area / R²'), 'area / R²'], descr: ['area del catenoide e dei due dischi', 'area of the catenoid and of the two discs'] });
    }
    grafico(); F.alRidimensiona(grafico);
    ctl = F.anima(cv, function (dt) {
      if (st.tira) { st.h = Math.min(1.5, st.h + dt * 0.12); inp.value = st.h; inp.dispatchEvent(new Event('input')); st.tira = st.h < 1.5; }
      var P = F.pennello(cv), q = P.q, W = P.W, H = P.H, R = 1, c = catenoide(st.h, R), sc = Math.min(W / 2.2, H / 2.6), cx = W / 2, cy = H / 2, e = 0.28;
      var X = function (z) { return cx + z * sc; }, Y = function (r) { return cy - r * sc; };
      function anello(z, r, col, riempi) { q.beginPath(); q.ellipse(X(z), cy, Math.max(0.5, e * r * sc), r * sc, 0, 0, 2 * Math.PI); if (riempi) { q.fillStyle = riempi; q.fill(); } q.strokeStyle = col; q.stroke(); }
      if (c) {
        var a = c.stabile.a, n = 60;
        q.fillStyle = 'rgba(94,234,212,.12)'; q.beginPath();
        for (var i = 0; i <= n; i++) { var z = -st.h / 2 + st.h * i / n; q.lineTo(X(z), Y(a * Math.cosh(z / a))); }
        for (i = n; i >= 0; i--) { z = -st.h / 2 + st.h * i / n; q.lineTo(X(z), Y(-a * Math.cosh(z / a))); } q.closePath(); q.fill();
        q.strokeStyle = 'rgba(94,234,212,.35)'; q.lineWidth = 1; for (i = 1; i < 8; i++) { z = -st.h / 2 + st.h * i / 8; anello(z, a * Math.cosh(z / a), 'rgba(94,234,212,.3)'); }
        q.strokeStyle = '#5eead4'; q.lineWidth = 2; [1, -1].forEach(function (s) { q.beginPath(); for (var i = 0; i <= n; i++) { var z = -st.h / 2 + st.h * i / n; q.lineTo(X(z), Y(s * a * Math.cosh(z / a))); } q.stroke(); });
        var b = c.instabile.a; q.strokeStyle = 'rgba(201,185,255,.6)'; q.setLineDash([4, 4]); q.lineWidth = 1; [1, -1].forEach(function (s) { q.beginPath(); for (var i = 0; i <= n; i++) { var z = -st.h / 2 + st.h * i / n; q.lineTo(X(z), Y(s * b * Math.cosh(z / b))); } q.stroke(); }); q.setLineDash([]);
        q.fillStyle = '#8494a8'; q.font = '11px system-ui'; q.fillText(t('collo a = ', 'neck a = ') + a.toFixed(3) + ' R', 8, H - 8);
      } else { q.fillStyle = '#ff8a80'; q.font = '12px system-ui'; q.fillText(t('pellicola strappata: due dischi', 'film broken: two discs'), 8, H - 8); }
      q.lineWidth = 2.5; anello(-st.h / 2, R, '#ffd24a', c ? null : 'rgba(94,234,212,.25)'); anello(st.h / 2, R, '#ffd24a', c ? null : 'rgba(94,234,212,.25)'); q.lineWidth = 1;
      cv.setAttribute('aria-label', t('pellicola di sapone fra due anelli', 'soap film between two rings'));
      info.innerHTML = 'h/R = <b class="bsiFX-num">' + st.h.toFixed(3) + '</b> · ' + (c ? t('catenoide: area ', 'catenoid: area ') + '<b class="bsiFX-num">' + c.stabile.area.toFixed(4) + ' R²</b> ' + t('contro due dischi ', 'versus two discs ') + areaDischi(1).toFixed(4) + ' R²' + (st.h > INCROCIO ? t(' (il catenoide è solo un minimo locale: metastabile)', ' (the catenoid is only a local minimum: metastable)') : '') : t('nessun catenoide: oltre h*/R = ', 'no catenoid: beyond h*/R = ') + CRITICO.toFixed(4) + t(' resta solo la soluzione di Goldschmidt (due dischi, area 2πR²)', ' only the Goldschmidt solution remains (two discs, area 2πR²)')) + '<br>' +
        t('Minimizzare A = 2π∫ r√(1 + r′²) dz dà r r″ = 1 + r′², risolta da r = a cosh(z/a). Gli estremi impongono a cosh(h/2a) = R: due soluzioni (stabile, collo largo; instabile, tratteggiata) che si fondono a h*/R = 2u*/cosh u* ≈ 1,3255, dove u* tanh u* = 1. Già da h/R ≈ ', 'Minimising A = 2π∫ r√(1 + r′²) dz gives r r″ = 1 + r′², solved by r = a cosh(z/a). The ends impose a cosh(h/2a) = R: two solutions (stable, wide neck; unstable, dashed) that merge at h*/R = 2u*/cosh u* ≈ 1.3255, where u* tanh u* = 1. Already from h/R ≈ ') + INCROCIO.toFixed(4) + t(' i due dischi hanno area minore.', ' the two discs have smaller area.');
      if (!st.tira) return false;
    }, { ricomincia: function () { st.h = 0.6; st.tira = true; } });
  }

  /* ═══ 4. Fermat, Eulero–Lagrange e metodo di tiro ═══════════════════════ */
  function schedaFermat(div) {
    var G = griglia(div), st = { modo: 'netta', n1: 1, n2: 1.5, alfa: 0.25, yA: 0.6, yB: 0.6 }, info = nota(G.pan), Rn, Rt, k = 0;
    F.scelta(G.pan, ['Mezzo', 'Medium'], [['netta', ['interfaccia netta (Snell)', 'sharp interface (Snell)']], ['graduata', ['indice graduato n = 1 + αy (miraggio)', 'graded index n = 1 + αy (mirage)']]], st.modo, function (v) { st.modo = v; calcola(); });
    F.cursore(G.pan, ['n₁ (sopra)', 'n₁ (above)'], 1, 2.5, 0.01, st.n1, function (v) { st.n1 = v; calcola(); }, function (v) { return v.toFixed(2); });
    F.cursore(G.pan, ['n₂ (sotto)', 'n₂ (below)'], 1, 2.5, 0.01, st.n2, function (v) { st.n2 = v; calcola(); }, function (v) { return v.toFixed(2); });
    F.cursore(G.pan, ['gradiente α (graduato)', 'gradient α (graded)'], -0.15, 0.3, 0.01, st.alfa, function (v) { st.alfa = v; calcola(); }, function (v) { return v.toFixed(2); });
    F.cursore(G.pan, ['quota di A e B (graduato)', 'height of A and B (graded)'], 0.2, 1.8, 0.05, st.yA, function (v) { st.yA = st.yB = v; calcola(); }, function (v) { return v.toFixed(2); });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.62), cg = F.tela(G.dx, 0.45), ctl, PN = { X: 3, yA: 1, yB: 1 };
    function calcola() {
      k = 0;
      if (st.modo === 'netta') {
        PN.n1 = st.n1; PN.n2 = st.n2; Rn = fermatNetta(PN);
        var xs = [], ys = []; for (var i = 0; i <= 200; i++) { var x = PN.X * i / 200; xs.push(x); ys.push(tempoOttico(x, PN)); }
        F.grafico(cg, { serie: [{ x: xs, y: ys, col: '#6bcfff', larg: 2, etich: 'T(x)' }], punti: [{ x: Rn.x, y: Rn.T, col: '#ffd24a', r: 5 }], xl: [t('punto di attraversamento x', 'crossing point x'), 'crossing point x'], yl: [t('cammino ottico T', 'optical path T'), 'optical path T'], descr: ['tempo ottico in funzione del punto di attraversamento', 'optical time versus crossing point'] });
        info.innerHTML = t('Minimo di T(x) in x = ', 'Minimum of T(x) at x = ') + '<b class="bsiFX-num">' + Rn.x.toFixed(5) + '</b><br>n₁ sin θ₁ = ' + (st.n1 * Rn.sin1).toFixed(8) + ' · n₂ sin θ₂ = ' + (st.n2 * Rn.sin2).toFixed(8) + '<br>' + t('Differenza ', 'Difference ') + fmt(Rn.snell) + '<br>' +
          t('Fermat: la luce segue il cammino di tempo stazionario. Imponendo dT/dx = 0 si ottiene n₁ x/√(x² + y_A²) = n₂ (X − x)/√((X − x)² + y_B²), cioè n₁ sin θ₁ = n₂ sin θ₂: la legge di Snell non è un postulato, emerge dalla minimizzazione (qui con la sezione aurea, senza usarla).', 'Fermat: light follows the path of stationary time. Imposing dT/dx = 0 gives n₁ x/√(x² + y_A²) = n₂ (X − x)/√((X − x)² + y_B²), i.e. n₁ sin θ₁ = n₂ sin θ₂: Snell’s law is not a postulate, it emerges from the minimisation (here by golden-section search, without using it).');
      } else {
        var P = { X: 4, yA: st.yA, yB: st.yB, n0: 1, alfa: st.alfa }; Rt = tiro(P); Rt.P = P;
        var S = Rt.soluzione;
        if (S) {
          var ex = raggioEsatto(S.s, P), xs2 = [], d = [], dmax = 0; S.pts.forEach(function (p, i) { if (i % 8) return; xs2.push(p[0]); var e = p[1] - ex(p[0]); d.push(e); dmax = Math.max(dmax, Math.abs(e)); });
          var b0 = costanteBeltrami(st.yA, S.s, P);
          F.grafico(cg, { serie: [{ x: xs2, y: d, col: '#ffc45a', larg: 2, etich: 'Δy' }], xl: ['x', 'x'], yl: [t('tiro − esatta', 'shot − exact'), 'shot − exact'], descr: ['scarto fra il raggio sparato e la soluzione esatta', 'difference between shot ray and exact solution'] });
          info.innerHTML = t('Pendenza iniziale trovata ', 'Initial slope found ') + '<b class="bsiFX-num">' + S.s.toFixed(6) + '</b> (' + Rt.nRadici + t(' soluzioni stazionarie; tenuta quella di cammino minimo) · errore sul bersaglio ', ' stationary solutions; kept the one of least path) · miss at the target ') + fmt(Math.abs(S.errore)) + '<br>' + t('cammino ottico ', 'optical path ') + S.L.toFixed(6) + ' · C = n/√(1 + y′²) = ' + b0.toFixed(6) + ' · ' + t('scarto massimo dalla forma chiusa ', 'max deviation from the closed form ') + fmt(dmax) + '<br>' +
            t('L’integrando n(y)√(1 + y′²) non dipende da x: Eulero–Lagrange diventa y″ = (n′/n)(1 + y′²), e l’identità di Beltrami dà l’integrale primo n/√(1 + y′²) = C (Snell continua: n sin θ costante, con θ dalla verticale). È un problema ai limiti: si spara da A con pendenze diverse (raggi grigi) e si corregge con la bisezione finché il raggio passa per B. Con n lineare il raggio è un coseno iperbolico: la stessa equazione della catena. Per α > 0 l’aria è più densa in alto, come sopra l’asfalto caldo: il raggio si incurva verso l’alto e il cielo appare a terra (miraggio inferiore).', 'The integrand n(y)√(1 + y′²) does not depend on x: Euler–Lagrange becomes y″ = (n′/n)(1 + y′²), and the Beltrami identity gives the first integral n/√(1 + y′²) = C (continuous Snell: n sin θ constant, θ from the vertical). It is a boundary-value problem: one shoots from A with different slopes (grey rays) and corrects by bisection until the ray hits B. With linear n the ray is a hyperbolic cosine: the same equation as the chain. For α > 0 the air is denser higher up, as above hot asphalt: the ray bends upward and the sky appears on the ground (inferior mirage).');
        } else info.innerHTML = t('Nessun raggio collega A e B con questi parametri: il problema ai limiti non ha soluzione (come la pellicola oltre la separazione critica). Il metodo di tiro lo scopre perché nessuna pendenza iniziale fa cambiare segno all’errore sul bersaglio.', 'No ray joins A and B with these parameters: the boundary-value problem has no solution (like the film beyond the critical separation). The shooting method finds out because no initial slope changes the sign of the miss at the target.');
      }
      if (ctl) ctl.sveglia();
    }
    calcola();
    ctl = F.anima(cv, function (dt) {
      k += dt * 6;
      var P = F.pennello(cv), q = P.q, W = P.W, H = P.H;
      cv.setAttribute('aria-label', t('raggio di luce secondo il principio di Fermat', 'light ray by Fermat’s principle'));
      if (st.modo === 'netta') {
        var sc = Math.min((W - 40) / PN.X, (H - 30) / 2.2), ox = (W - sc * PN.X) / 2, oy = H / 2, X = function (x) { return ox + x * sc; }, Y = function (y) { return oy - y * sc; };
        q.fillStyle = 'rgba(107,207,255,' + (0.05 + 0.12 * (st.n1 - 1)) + ')'; q.fillRect(0, 0, W, oy); q.fillStyle = 'rgba(107,207,255,' + (0.05 + 0.12 * (st.n2 - 1)) + ')'; q.fillRect(0, oy, W, H - oy);
        q.strokeStyle = '#34465f'; q.beginPath(); q.moveTo(0, oy); q.lineTo(W, oy); q.stroke();
        var nT = Math.min(12, Math.floor(k)); for (var i = 0; i < nT; i++) { var xp = PN.X * (i + 0.5) / 12; q.strokeStyle = 'rgba(201,211,223,.25)'; q.beginPath(); q.moveTo(X(0), Y(PN.yA)); q.lineTo(X(xp), Y(0)); q.lineTo(X(PN.X), Y(-PN.yB)); q.stroke(); }
        if (k > 12) { q.strokeStyle = '#ffd24a'; q.lineWidth = 2.5; q.beginPath(); q.moveTo(X(0), Y(PN.yA)); q.lineTo(X(Rn.x), Y(0)); q.lineTo(X(PN.X), Y(-PN.yB)); q.stroke(); q.lineWidth = 1;
          q.setLineDash([3, 3]); q.strokeStyle = '#8494a8'; q.beginPath(); q.moveTo(X(Rn.x), Y(1.05)); q.lineTo(X(Rn.x), Y(-1.05)); q.stroke(); q.setLineDash([]); }
        q.fillStyle = '#e6fffb'; q.font = '12px system-ui'; q.fillText('A', X(0) - 12, Y(PN.yA)); q.fillText('B', X(PN.X) + 5, Y(-PN.yB) + 4); q.textAlign = 'right'; q.fillText('n₁ = ' + st.n1.toFixed(2), W - 8, 16); q.textAlign = 'left'; q.fillText('n₂ = ' + st.n2.toFixed(2), 8, H - 8);
        if (k > 13) return false;
      } else {
        var Pp = Rt.P, sc2 = Math.min((W - 30) / Pp.X, (H - 20) / 2.4), ox2 = (W - sc2 * Pp.X) / 2, X2 = function (x) { return ox2 + x * sc2; }, Y2 = function (y) { return H - 10 - (y + 0.2) * sc2; };
        for (var j = 0; j < 24; j++) { var yy = -0.2 + 2.4 * j / 24, n = 1 + Pp.alfa * yy; q.fillStyle = 'rgba(107,207,255,' + Math.max(0, Math.min(0.4, 0.1 + 0.6 * (n - 1))) + ')'; q.fillRect(0, Y2(yy + 0.1), W, sc2 * 0.1 + 1); }
        q.strokeStyle = '#34465f'; q.beginPath(); q.moveTo(0, Y2(0)); q.lineTo(W, Y2(0)); q.stroke();
        var nt = Math.min(Rt.tentativi.length, Math.floor(k * 3));
        for (i = 0; i < nt; i++) { var r = raggio(Rt.tentativi[i], Pp, 100, true); q.strokeStyle = 'rgba(201,211,223,' + (i > nt - 6 ? 0.45 : 0.12) + ')'; q.beginPath(); r.pts.forEach(function (p, m) { var yv = Math.max(-0.5, Math.min(3, p[1])); if (m) q.lineTo(X2(p[0]), Y2(yv)); else q.moveTo(X2(p[0]), Y2(yv)); }); q.stroke(); }
        if (nt >= Rt.tentativi.length && Rt.soluzione) { q.strokeStyle = '#ffd24a'; q.lineWidth = 2.5; q.beginPath(); Rt.soluzione.pts.forEach(function (p, m) { if (m) q.lineTo(X2(p[0]), Y2(p[1])); else q.moveTo(X2(p[0]), Y2(p[1])); }); q.stroke(); q.lineWidth = 1; }
        q.fillStyle = '#ff8a80'; q.beginPath(); q.arc(X2(0), Y2(Pp.yA), 5, 0, 2 * Math.PI); q.arc(X2(Pp.X), Y2(Pp.yB), 5, 0, 2 * Math.PI); q.fill();
        q.fillStyle = '#e6fffb'; q.font = '11px system-ui'; q.fillText(t('tentativi: ', 'shots: ') + nt + ' / ' + Rt.tentativi.length, 8, 16);
        if (nt >= Rt.tentativi.length) return false;
      }
    }, { ricomincia: function () { k = 0; } });
  }

  F.sezione('smatvariaz', {
    titolo: ['🎢 Calcolo delle variazioni', '🎢 Calculus of variations'],
    sotto: ['Funzionali e loro minimi: la brachistocrona e la gara delle perline, la catena che pende (catenaria), la pellicola di sapone fra due anelli (catenoide e soluzione di Goldschmidt), l’equazione di Eulero–Lagrange risolta col metodo di tiro nel principio di Fermat.', 'Functionals and their minima: the brachistochrone and the bead race, the hanging chain (catenary), the soap film between two rings (catenoid and Goldschmidt solution), the Euler–Lagrange equation solved by shooting in Fermat’s principle.'],
    schede: [
      { nome: ['⏱️ Brachistocrona', '⏱️ Brachistochrone'], costruisci: schedaBrachi },
      { nome: ['⛓️ Catenaria', '⛓️ Catenary'], costruisci: schedaCatena },
      { nome: ['🫧 Catenoide', '🫧 Catenoid'], costruisci: schedaCatenoide },
      { nome: ['🔦 Fermat e tiro', '🔦 Fermat and shooting'], costruisci: schedaFermat }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
