/* ═══════════════════════════════════════════════════════════════════════════
   bsi-mat-grafi.js — 🕸️ grafi e ottimizzazione
   BioSpecInfo · © Samuele Pio Provenzano

   · CAMMINO MINIMO: l'algoritmo di Dijkstra su un grafo pesato, animato
     nodo per nodo (la frontiera, le distanze provvisorie, quelle
     definitive), e il cammino trovato;
   · ALBERO DI COPERTURA MINIMO: Kruskal, che aggiunge gli archi dal piu'
     leggero scartando quelli che chiuderebbero un ciclo (union-find);
   · DISCESA DEL GRADIENTE: su una funzione di due variabili, con passo
     fisso o con il momento; si vede quando converge, quando oscilla, quando
     diverge (passo troppo grande rispetto alla curvatura), ed e' lo stesso
     metodo con cui si adattano i modelli ai dati;
   · PROGRAMMAZIONE LINEARE: due variabili, vincoli lineari, la regione
     ammissibile e l'ottimo, che sta sempre in un vertice; il problema della
     miscela di due prodotti con risorse limitate.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt;
  function griglia(div) { var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); G.appendChild(pan); G.appendChild(dx); div.appendChild(G); return { pan: pan, dx: dx }; }
  function nota(pan) { var n = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(n); return n; }

  /* ═══ calcoli ═══════════════════════════════════════════════════════════ */
  function generatore(seme) { var s = (seme || 1) >>> 0; return function () { s = (s + 0x6D2B79F5) >>> 0; var q = Math.imul(s ^ (s >>> 15), 1 | s); q = (q + Math.imul(q ^ (q >>> 7), 61 | q)) ^ q; return ((q ^ (q >>> 14)) >>> 0) / 4294967296; }; }
  /* grafo casuale «geometrico»: punti nel piano, archi fra vicini, peso = distanza arrotondata */
  function grafoCasuale(n, seme) {
    var r = generatore(seme), V = [], E = [];
    for (var i = 0; i < n; i++) V.push([0.06 + 0.88 * r(), 0.08 + 0.84 * r()]);
    for (i = 0; i < n; i++) { var d = V.map(function (p, j) { return [Math.hypot(p[0] - V[i][0], p[1] - V[i][1]), j]; }).sort(function (a, b) { return a[0] - b[0]; }); for (var k = 1; k <= 3; k++) { var j = d[k][1], a = Math.min(i, j), b = Math.max(i, j); if (!E.some(function (e) { return e[0] === a && e[1] === b; })) E.push([a, b, Math.max(1, Math.round(d[k][0] * 20))]); } }
    return { V: V, E: E };
  }
  /* Dijkstra con la registrazione dei passi (per l'animazione) */
  function dijkstra(G, s, tg) {
    var n = G.V.length, dist = new Array(n).fill(Infinity), prec = new Array(n).fill(-1), fatto = new Array(n).fill(false), passi = [];
    dist[s] = 0;
    for (var it = 0; it < n; it++) {
      var u = -1; for (var i = 0; i < n; i++) if (!fatto[i] && (u < 0 || dist[i] < dist[u])) u = i;
      if (u < 0 || dist[u] === Infinity) break;
      fatto[u] = true; passi.push({ u: u, dist: dist.slice() });
      if (u === tg) break;
      G.E.forEach(function (e) { var v = e[0] === u ? e[1] : e[1] === u ? e[0] : -1; if (v < 0 || fatto[v]) return; if (dist[u] + e[2] < dist[v]) { dist[v] = dist[u] + e[2]; prec[v] = u; } });
    }
    var cam = []; for (var v = tg; v >= 0; v = prec[v]) cam.unshift(v);
    return { dist: dist, prec: prec, passi: passi, cammino: cam[0] === s ? cam : [] };
  }
  /* Kruskal con union-find */
  function kruskal(G) {
    var p = G.V.map(function (_, i) { return i; }); function radice(x) { while (p[x] !== x) { p[x] = p[p[x]]; x = p[x]; } return x; }
    var scelti = [], passi = [], E = G.E.slice().sort(function (a, b) { return a[2] - b[2]; });
    E.forEach(function (e) { var a = radice(e[0]), b = radice(e[1]); if (a !== b) { p[a] = b; scelti.push(e); passi.push([e, true]); } else passi.push([e, false]); });
    return { archi: scelti, peso: scelti.reduce(function (s, e) { return s + e[2]; }, 0), passi: passi };
  }
  /* discesa del gradiente su f(x, y) data come funzione e gradiente */
  var FUNZIONI = {
    valle: [['valle allungata x² + 10y²', 'elongated valley x² + 10y²'], function (x, y) { return x * x + 10 * y * y; }, function (x, y) { return [2 * x, 20 * y]; }, [-4, 1.5], [0, 0]],
    rosenbrock: [['Rosenbrock (banana)', 'Rosenbrock (banana)'], function (x, y) { return Math.pow(1 - x, 2) + 100 * Math.pow(y - x * x, 2); }, function (x, y) { return [-2 * (1 - x) - 400 * x * (y - x * x), 200 * (y - x * x)]; }, [-1.2, 1], [1, 1]],
    rotonda: [['ciotola x² + y²', 'bowl x² + y²'], function (x, y) { return x * x + y * y; }, function (x, y) { return [2 * x, 2 * y]; }, [-4, 3], [0, 0]]
  };
  function discesa(chiave, passo, momento, n) {
    var D = FUNZIONI[chiave], x = D[3][0], y = D[3][1], vx = 0, vy = 0, cam = [[x, y]];
    for (var i = 0; i < n; i++) { var g = D[2](x, y); vx = momento * vx - passo * g[0]; vy = momento * vy - passo * g[1]; x += vx; y += vy; cam.push([x, y]); if (!isFinite(x) || Math.abs(x) > 1e6) break; }
    return cam;
  }
  /* programmazione lineare in 2D: max c·x con A x ≤ b, x ≥ 0, enumerando i vertici */
  function pl2(c, A, b) {
    var righe = A.concat([[-1, 0], [0, -1]]), bb = b.concat([0, 0]), vertici = [];
    for (var i = 0; i < righe.length; i++) for (var j = i + 1; j < righe.length; j++) {
      var det = righe[i][0] * righe[j][1] - righe[i][1] * righe[j][0]; if (Math.abs(det) < 1e-12) continue;
      var x = (bb[i] * righe[j][1] - righe[i][1] * bb[j]) / det, y = (righe[i][0] * bb[j] - bb[i] * righe[j][0]) / det;
      if (righe.every(function (r, k) { return r[0] * x + r[1] * y <= bb[k] + 1e-9; })) vertici.push([x, y]);
    }
    vertici = vertici.filter(function (v, i) { return !vertici.slice(0, i).some(function (w) { return Math.hypot(v[0] - w[0], v[1] - w[1]) < 1e-9; }); });
    var cx = vertici.reduce(function (s, v) { return s + v[0]; }, 0) / vertici.length, cy = vertici.reduce(function (s, v) { return s + v[1]; }, 0) / vertici.length;
    vertici.sort(function (p, q) { return Math.atan2(p[1] - cy, p[0] - cx) - Math.atan2(q[1] - cy, q[0] - cx); });
    var best = null; vertici.forEach(function (v) { var z = c[0] * v[0] + c[1] * v[1]; if (!best || z > best.z) best = { x: v[0], y: v[1], z: z }; });
    return { vertici: vertici, ottimo: best };
  }
  F.calcolo.grafi = { grafoCasuale: grafoCasuale, dijkstra: dijkstra, kruskal: kruskal, FUNZIONI: FUNZIONI, discesa: discesa, pl2: pl2 };

  function disegnaGrafo(q, W, H, G, colArco, colNodo, etichette) {
    G.E.forEach(function (e, k) { var a = G.V[e[0]], b = G.V[e[1]], c = colArco(e, k); q.strokeStyle = c[0]; q.lineWidth = c[1]; q.beginPath(); q.moveTo(a[0] * W, a[1] * H); q.lineTo(b[0] * W, b[1] * H); q.stroke(); if (etichette) { q.fillStyle = '#8494a8'; q.font = '10px system-ui'; q.fillText(String(e[2]), (a[0] + b[0]) / 2 * W + 3, (a[1] + b[1]) / 2 * H - 3); } });
    q.lineWidth = 1;
    G.V.forEach(function (v, i) { q.fillStyle = colNodo(i); q.beginPath(); q.arc(v[0] * W, v[1] * H, 7, 0, Math.PI * 2); q.fill(); });
  }

  /* ═══ 1. Dijkstra ═══════════════════════════════════════════════════════ */
  function schedaDijkstra(div) {
    var Gp = griglia(div), st = { n: 18, seme: 3 }, info = nota(Gp.pan), G, R, k = 0;
    F.cursore(Gp.pan, ['nodi', 'nodes'], 6, 40, 1, st.n, function (v) { st.n = v; nuovo(); });
    F.bottone(Gp.pan, ['Nuovo grafo', 'New graph'], function () { st.seme++; nuovo(); });
    Gp.pan.appendChild(info);
    var cv = F.tela(Gp.dx, 0.7), ctl;
    function nuovo() { G = grafoCasuale(st.n, st.seme); R = dijkstra(G, 0, st.n - 1); k = 0; if (ctl) ctl.sveglia(); }
    nuovo();
    ctl = F.anima(cv, function (dt) {
      k = Math.min(R.passi.length, k + dt * 3);
      var P = F.pennello(cv), q = P.q, W = P.W, H = P.H, passo = R.passi[Math.max(0, Math.floor(k) - 1)], fatti = {}, finito = k >= R.passi.length;
      R.passi.slice(0, Math.floor(k)).forEach(function (p) { fatti[p.u] = 1; });
      var sulCammino = {}; if (finito) for (var i = 1; i < R.cammino.length; i++) sulCammino[Math.min(R.cammino[i - 1], R.cammino[i]) + '-' + Math.max(R.cammino[i - 1], R.cammino[i])] = 1;
      disegnaGrafo(q, W, H, G, function (e) { return sulCammino[e[0] + '-' + e[1]] ? ['#ffd24a', 4] : fatti[e[0]] && fatti[e[1]] ? ['rgba(94,234,212,.45)', 1.5] : ['rgba(52,70,95,.7)', 1]; }, function (i) { return i === 0 ? '#5eead4' : i === st.n - 1 ? '#ff8a80' : fatti[i] ? '#6bcfff' : '#34465f'; }, true);
      if (passo) { q.font = '10px system-ui'; q.fillStyle = '#e6fffb'; G.V.forEach(function (v, i) { var d = passo.dist[i]; if (d < Infinity) q.fillText(String(d), v[0] * W - 4, v[1] * H - 10); }); }
      cv.setAttribute('aria-label', t('algoritmo di Dijkstra', 'Dijkstra algorithm'));
      info.innerHTML = t('Da ', 'From ') + '<span style="color:#5eead4">●</span> ' + t('a', 'to') + ' <span style="color:#ff8a80">●</span>: ' + (finito ? (R.cammino.length ? t('distanza minima ', 'shortest distance ') + '<b class="bsiFX-num">' + R.dist[st.n - 1] + '</b> ' + t('lungo ', 'along ') + R.cammino.length + t(' nodi', ' nodes') : t('nessun cammino: il grafo non è connesso', 'no path: the graph is not connected')) : t('nodi definitivi: ', 'settled nodes: ') + Math.floor(k)) + '<br>' + t('A ogni passo si sceglie il nodo non ancora definitivo con la distanza provvisoria più piccola: quella è già la sua distanza vera (pesi non negativi). È l’algoritmo dei navigatori e dei protocolli di instradamento.', 'At each step the unsettled node with the smallest tentative distance is chosen: that is already its true distance (non-negative weights). It is the algorithm of navigators and routing protocols.');
      if (finito) return false;
    }, { ricomincia: function () { k = 0; } });
  }

  /* ═══ 2. Kruskal ════════════════════════════════════════════════════════ */
  function schedaKruskal(div) {
    var Gp = griglia(div), st = { n: 20, seme: 5 }, info = nota(Gp.pan), G, R, k = 0;
    F.cursore(Gp.pan, ['nodi', 'nodes'], 6, 40, 1, st.n, function (v) { st.n = v; nuovo(); });
    F.bottone(Gp.pan, ['Nuovo grafo', 'New graph'], function () { st.seme++; nuovo(); });
    Gp.pan.appendChild(info);
    var cv = F.tela(Gp.dx, 0.7), ctl;
    function nuovo() { G = grafoCasuale(st.n, st.seme); R = kruskal(G); k = 0; if (ctl) ctl.sveglia(); }
    nuovo();
    ctl = F.anima(cv, function (dt) {
      k = Math.min(R.passi.length, k + dt * 5);
      var P = F.pennello(cv), q = P.q, W = P.W, H = P.H, stato = {};
      R.passi.slice(0, Math.floor(k)).forEach(function (p) { stato[p[0][0] + '-' + p[0][1]] = p[1] ? 'si' : 'no'; });
      disegnaGrafo(q, W, H, G, function (e) { var s = stato[e[0] + '-' + e[1]]; return s === 'si' ? ['#5eead4', 3.5] : s === 'no' ? ['rgba(255,138,128,.35)', 1] : ['rgba(52,70,95,.7)', 1]; }, function () { return '#6bcfff'; }, true);
      cv.setAttribute('aria-label', t('algoritmo di Kruskal', 'Kruskal algorithm'));
      var presi = R.passi.slice(0, Math.floor(k)).filter(function (p) { return p[1]; }), peso = presi.reduce(function (s, p) { return s + p[0][2]; }, 0);
      info.innerHTML = t('Archi scelti ', 'Edges chosen ') + presi.length + ' / ' + (st.n - 1) + ' · ' + t('peso ', 'weight ') + '<b class="bsiFX-num">' + peso + '</b>' + (k >= R.passi.length ? ' · ' + t('albero minimo completato: peso totale ', 'minimum tree complete: total weight ') + '<b>' + R.peso + '</b>' : '') + '<br>' + t('Si prendono gli archi dal più leggero; in rosso quelli scartati perché chiuderebbero un ciclo. Un albero su n nodi ha sempre n − 1 archi. Serve per progettare reti (tubazioni, cavi) al costo minimo.', 'Edges are taken from the lightest; in red those discarded because they would close a cycle. A tree on n nodes always has n − 1 edges. It is used to design networks (pipes, cables) at minimum cost.');
      if (k >= R.passi.length) return false;
    }, { ricomincia: function () { k = 0; } });
  }

  /* ═══ 3. discesa del gradiente ══════════════════════════════════════════ */
  function schedaGradiente(div) {
    var Gp = griglia(div), st = { f: 'valle', passo: 0.05, mom: 0 }, info = nota(Gp.pan), cam, k = 0, sfondo = null;
    F.scelta(Gp.pan, ['Funzione', 'Function'], Object.keys(FUNZIONI).map(function (k2) { return [k2, F.tt(FUNZIONI[k2][0])]; }), st.f, function (v) { st.f = v; st.passo = v === 'rosenbrock' ? 0.001 : 0.05; calcola(); });
    F.cursore(Gp.pan, ['passo η', 'step η'], -4, -0.5, 0.05, Math.log10(st.passo), function (v) { st.passo = Math.pow(10, v); calcola(); }, function (v) { return fmt(Math.pow(10, v)); });
    F.cursore(Gp.pan, ['momento β', 'momentum β'], 0, 0.95, 0.05, st.mom, function (v) { st.mom = v; calcola(); }, function (v) { return v.toFixed(2); });
    Gp.pan.appendChild(info);
    var cv = F.tela(Gp.dx, 0.75), ctl;
    function calcola() {
      cam = discesa(st.f, st.passo, st.mom, 3000); k = 0; if (ctl) ctl.sveglia();
      var D = FUNZIONI[st.f], fine = cam[cam.length - 1], dist = Math.hypot(fine[0] - D[4][0], fine[1] - D[4][1]), nConv = cam.findIndex(function (p) { return Math.hypot(p[0] - D[4][0], p[1] - D[4][1]) < 1e-3; });
      var lmax = st.f === 'valle' ? 20 : st.f === 'rotonda' ? 2 : 1002;
      info.innerHTML = (!isFinite(fine[0]) || dist > 1e3 ? '<b>' + t('Diverge', 'Diverges') + '</b>: ' : nConv >= 0 ? t('Converge al minimo in ', 'Converges to the minimum in ') + '<b>' + nConv + t(' passi</b>', ' steps</b>') + ': ' : t('Dopo 3000 passi è ancora a ', 'After 3000 steps it is still ') + fmt(dist) + t(' dal minimo: ', ' from the minimum: ')) + t('con passo fisso la discesa è stabile solo se η < 2/λ_max, dove λ_max è la curvatura massima (', 'with a fixed step descent is stable only if η < 2/λ_max, where λ_max is the largest curvature (') + (st.f === 'rosenbrock' ? t('≈ 1000 vicino al minimo', '≈ 1000 near the minimum') : 'λ_max = ' + lmax) + '); ' + t('nelle valli strette oscilla da una parete all’altra. Il momento accumula la velocità lungo la valle e attenua le oscillazioni: è il principio degli ottimizzatori usati per adattare i modelli ai dati.', 'in narrow valleys it bounces between the walls. Momentum accumulates speed along the valley and damps oscillations: the principle of the optimisers used to fit models to data.');
    }
    calcola();
    ctl = F.anima(cv, function (dt) {
      k = Math.min(cam.length, k + dt * (st.f === 'rosenbrock' ? 400 : 40));
      var D = FUNZIONI[st.f], L = st.f === 'rosenbrock' ? [-2, 2, -1, 3] : [-5, 5, -3.5, 3.5], P = F.pennello(cv), q = P.q, W = P.W, H = P.H, X = function (x) { return (x - L[0]) / (L[1] - L[0]) * W; }, Y = function (y) { return H - (y - L[2]) / (L[3] - L[2]) * H; };
      /* curve di livello logaritmiche: disegnate una volta su una tela fuori schermo e poi ricopiate */
      var chiave = st.f + W + 'x' + H; if (!sfondo || sfondo.k !== chiave) { var off = document.createElement('canvas'), dpr = Math.min(2, globale.devicePixelRatio || 1); off.width = W * dpr; off.height = H * dpr; var q0 = q; q = off.getContext('2d'); q.setTransform(dpr, 0, 0, dpr, 0, 0);
      var N = 90, Z = []; for (var i = 0; i <= N; i++) { Z.push([]); for (var j = 0; j <= N; j++) Z[i].push(Math.log(1e-3 + D[1](L[0] + (L[1] - L[0]) * i / N, L[2] + (L[3] - L[2]) * j / N))); }
      for (var lv = -4; lv <= 9; lv += 0.7) { q.strokeStyle = 'rgba(107,207,255,' + (0.15 + 0.03 * (lv + 4)) + ')'; q.beginPath(); for (i = 0; i < N; i++) for (j = 0; j < N; j++) { var v = [Z[i][j], Z[i + 1][j], Z[i + 1][j + 1], Z[i][j + 1]], c = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]], tg = []; for (var s = 0; s < 4; s++) { var a = v[s], b = v[(s + 1) % 4]; if ((a - lv) * (b - lv) < 0) { var f = (lv - a) / (b - a), A = c[s], B = c[(s + 1) % 4]; tg.push([A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f]); } } if (tg.length >= 2) { q.moveTo(tg[0][0] / N * W, H - tg[0][1] / N * H); q.lineTo(tg[1][0] / N * W, H - tg[1][1] / N * H); } } q.stroke(); }
      q = q0; sfondo = { k: chiave, off: off }; }
      q.drawImage(sfondo.off, 0, 0, W, H);
      q.strokeStyle = '#ffd24a'; q.lineWidth = 1.6; q.beginPath(); cam.slice(0, Math.floor(k) + 1).forEach(function (p, i) { var x = X(Math.max(-1e4, Math.min(1e4, p[0]))), y = Y(Math.max(-1e4, Math.min(1e4, p[1]))); if (i) q.lineTo(x, y); else q.moveTo(x, y); }); q.stroke(); q.lineWidth = 1;
      q.fillStyle = '#5eead4'; q.beginPath(); q.arc(X(D[4][0]), Y(D[4][1]), 5, 0, Math.PI * 2); q.fill();
      var p = cam[Math.min(cam.length - 1, Math.floor(k))]; q.fillStyle = '#ff8a80'; q.beginPath(); q.arc(X(Math.max(L[0], Math.min(L[1], p[0]))), Y(Math.max(L[2], Math.min(L[3], p[1]))), 5, 0, Math.PI * 2); q.fill();
      cv.setAttribute('aria-label', t('discesa del gradiente sulle curve di livello', 'gradient descent on level curves'));
      if (k >= cam.length) return false;
    }, { ricomincia: function () { k = 0; } });
  }

  /* ═══ 4. programmazione lineare ═════════════════════════════════════════ */
  function schedaPL(div) {
    var Gp = griglia(div), st = { p1: 40, p2: 30, r1: 100, r2: 80, r3: 40 }, info = nota(Gp.pan);
    Gp.pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', html: t('Un laboratorio prepara due prodotti, x e y lotti. Ogni lotto di x usa 2 h di reattore e 1 kg di reagente; ogni lotto di y 1 h e 2 kg; al massimo 40 lotti di y. Quanti lotti per guadagnare di più?', 'A lab makes two products, x and y batches. Each x batch takes 2 h of reactor and 1 kg of reagent; each y batch 1 h and 2 kg; at most 40 batches of y. How many batches to earn the most?') }));
    F.cursore(Gp.pan, ['guadagno per lotto di x (€)', 'profit per x batch (€)'], 5, 100, 1, st.p1, function (v) { st.p1 = v; disegna(); });
    F.cursore(Gp.pan, ['guadagno per lotto di y (€)', 'profit per y batch (€)'], 5, 100, 1, st.p2, function (v) { st.p2 = v; disegna(); });
    F.cursore(Gp.pan, ['ore di reattore disponibili', 'reactor hours available'], 20, 160, 1, st.r1, function (v) { st.r1 = v; disegna(); });
    F.cursore(Gp.pan, ['kg di reagente disponibili', 'kg of reagent available'], 20, 160, 1, st.r2, function (v) { st.r2 = v; disegna(); });
    Gp.pan.appendChild(info);
    var cv = F.tela(Gp.dx, 0.8);
    function disegna() {
      var R = pl2([st.p1, st.p2], [[2, 1], [1, 2], [0, 1]], [st.r1, st.r2, st.r3]), M = Math.max(st.r1, st.r2) * 1.05;
      var o = F.grafico(cv, { serie: [], xmin: 0, xmax: M * 0.8, ymin: 0, ymax: M * 0.6, xl: ['lotti di x', 'x batches'], yl: ['lotti di y', 'y batches'], descr: ['regione ammissibile e ottimo', 'feasible region and optimum'] }), q = o.q;
      q.fillStyle = 'rgba(94,234,212,.18)'; q.beginPath(); R.vertici.forEach(function (v, i) { if (i) q.lineTo(o.X(v[0]), o.Y(v[1])); else q.moveTo(o.X(v[0]), o.Y(v[1])); }); q.closePath(); q.fill(); q.strokeStyle = '#5eead4'; q.stroke();
      [[[2, 1], st.r1, '#ff8a80'], [[1, 2], st.r2, '#6bcfff'], [[0, 1], st.r3, '#c49bff']].forEach(function (V) { var a = V[0][0], b = V[0][1], c = V[1]; q.strokeStyle = V[2]; q.setLineDash([4, 4]); q.beginPath(); if (b === 0) { q.moveTo(o.X(c / a), o.Y(0)); q.lineTo(o.X(c / a), o.Y(M)); } else { q.moveTo(o.X(0), o.Y(c / b)); q.lineTo(o.X(M), o.Y((c - a * M) / b)); } q.stroke(); q.setLineDash([]); });
      R.vertici.forEach(function (v) { q.fillStyle = '#c9d3df'; q.beginPath(); q.arc(o.X(v[0]), o.Y(v[1]), 3.5, 0, Math.PI * 2); q.fill(); });
      if (R.ottimo) {
        var z = R.ottimo.z; q.strokeStyle = 'rgba(255,210,74,.8)'; q.lineWidth = 2; q.beginPath(); q.moveTo(o.X(0), o.Y(z / st.p2)); q.lineTo(o.X(z / st.p1), o.Y(0)); q.stroke(); q.lineWidth = 1;
        q.fillStyle = '#ffd24a'; q.beginPath(); q.arc(o.X(R.ottimo.x), o.Y(R.ottimo.y), 7, 0, Math.PI * 2); q.fill();
      }
      info.innerHTML = R.ottimo ? t('Ottimo: ', 'Optimum: ') + '<b class="bsiFX-num">x = ' + fmt(R.ottimo.x) + ', y = ' + fmt(R.ottimo.y) + '</b> · ' + t('guadagno ', 'profit ') + '<b>' + fmt(R.ottimo.z) + ' €</b><br>' + t('Vertici della regione: ', 'Region vertices: ') + R.vertici.length + '. ' + t('La retta gialla di guadagno costante si sposta parallela finché tocca la regione per l’ultima volta: sempre in un vertice (o lungo un lato intero). Il metodo del simplesso salta da un vertice all’altro: così si risolvono problemi con migliaia di variabili.', 'The yellow constant-profit line slides parallel until it touches the region for the last time: always at a vertex (or along a whole edge). The simplex method jumps from vertex to vertex: that is how problems with thousands of variables are solved.') : '—';
    }
    disegna(); F.alRidimensiona(disegna);
  }

  F.sezione('smatgrafi', {
    titolo: ['🕸️ Grafi e ottimizzazione', '🕸️ Graphs and optimisation'],
    sotto: ['Il cammino minimo con Dijkstra, l’albero di copertura minimo con Kruskal, la discesa del gradiente con e senza momento, la programmazione lineare con la regione ammissibile.', 'The shortest path with Dijkstra, the minimum spanning tree with Kruskal, gradient descent with and without momentum, linear programming with the feasible region.'],
    schede: [
      { nome: ['🧭 Dijkstra', '🧭 Dijkstra'], costruisci: schedaDijkstra },
      { nome: ['🌲 Kruskal', '🌲 Kruskal'], costruisci: schedaKruskal },
      { nome: ['⛷️ Discesa del gradiente', '⛷️ Gradient descent'], costruisci: schedaGradiente },
      { nome: ['📐 Programmazione lineare', '📐 Linear programming'], costruisci: schedaPL }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
