/* ═══════════════════════════════════════════════════════════════════════════
   bsi-chi-pes.js — 🏔️ superficie di energia potenziale
   BioSpecInfo · © Samuele Pio Provenzano

   La reazione H_A + H_B–H_C → H_A–H_B + H_C su una linea (collineare), con
   la superficie LEPS (London–Eyring–Polanyi–Sato): Morse per il legame,
   anti-Morse per lo stato di tripletto, parametro di Sato k.
   · SUPERFICIE: le curve di livello di V(r_AB, r_BC), il punto di sella, una
     traiettoria classica (Verlet) lanciata con l'energia di collisione e
     l'energia vibrazionale scelte; reattiva o no;
   · CAMMINO DI REAZIONE: il cammino di minima energia dalla sella verso le
     due valli, il profilo energetico, l'energia di attivazione con e senza
     energia di punto zero;
   · REGOLE DI POLANYI: probabilita' di reazione in funzione dell'energia di
     collisione, con la molecola ferma (v = 0) o vibrante (v = 1); per una
     barriera simmetrica e centrale le due forme di energia aiutano in modo
     diverso;
   · SUPERFICIE 3D (v238): il paesaggio V(r_AB, r_BC) con la pallina che
     rotola, il cammino di minima energia, la sella con le sue frequenze
     (hessiana e matrice G di Wilson: una e' immaginaria).
   Unita': eV, Å, u; il tempo in unita' di √(u Å²/eV) = 10,18 fs.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt;
  var De = 4.7466, BETA = 1.9426, RE = 0.7416, K = 0.135, M = 1.00794, FS = 10.1805;
  function griglia(div) { var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); G.appendChild(pan); G.appendChild(dx); div.appendChild(G); return { pan: pan, dx: dx }; }
  function nota(pan) { var n = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(n); return n; }

  /* ═══ calcoli ═══════════════════════════════════════════════════════════ */
  function QJ(r) {
    /* forma di Sato: Q + J e' la Morse del singoletto, Q − J l'anti-Morse del tripletto */
    var e = Math.exp(-BETA * (r - RE)), f = De / (4 * (1 + K));
    return [f * ((3 + K) * e * e - (2 + 6 * K) * e), f * ((1 + 3 * K) * e * e - (6 + 2 * K) * e)];
  }
  /* energia rispetto agli atomi separati; collineare: r_AC = r_AB + r_BC */
  function V(r1, r2) {
    var a = QJ(r1), b = QJ(r2), c = QJ(r1 + r2);
    return a[0] + b[0] + c[0] - Math.sqrt(0.5 * ((a[1] - b[1]) * (a[1] - b[1]) + (b[1] - c[1]) * (b[1] - c[1]) + (c[1] - a[1]) * (c[1] - a[1])));
  }
  function grad(r1, r2) { var h = 1e-5; return [(V(r1 + h, r2) - V(r1 - h, r2)) / (2 * h), (V(r1, r2 + h) - V(r1, r2 - h)) / (2 * h)]; }
  /* la sella sta sulla diagonale r1 = r2 per simmetria: massimo di V lungo la diagonale … */
  function sella() {
    var a = 0.6, b = 1.4;
    for (var k = 0; k < 100; k++) { var m1 = a + (b - a) / 3, m2 = b - (b - a) / 3; if (V(m1, m1) < V(m2, m2)) b = m2; else a = m1; }
    /* … che e' il minimo lungo la direzione antisimmetrica */
    var r = (a + b) / 2; return { r: r, V: V(r, r), Ea: V(r, r) + De };
  }
  /* frequenza armonica della molecola H₂ e livelli vibrazionali di Morse */
  var MU = M / 2, OMEGA = BETA * Math.sqrt(2 * De / MU), HBAR = 0.0646541; /* ħ in eV·(unita' di tempo) */
  function Evib(v) { var w = HBAR * OMEGA; return w * (v + 0.5) - Math.pow(w * (v + 0.5), 2) / (4 * De); }
  /* traiettoria collineare: posizioni xA < xB < xC, Verlet */
  function traiettoria(Ecoll, v, fase, opz) {
    opz = opz || {};
    var Ev = Evib(v), r2t = RE, dt = opz.dt || 0.005, nmax = opz.passi || 12000;
    /* BC con energia vibrazionale Ev: punti di inversione della Morse, si parte a una fase data lungo l'oscillazione */
    var ui = 1 - Math.sqrt(Ev / De), uo = 1 + Math.sqrt(Ev / De), rin = RE - Math.log(uo) / BETA, rout = RE - Math.log(ui) / BETA;
    r2t = rin + (rout - rin) * (0.5 - 0.5 * Math.cos(Math.PI * fase));
    var vm = -De * Math.pow(1 - Math.exp(-BETA * (r2t - RE)), 2) + Ev, vrel = Math.sqrt(Math.max(0, 2 * vm / MU)) * (fase > 1 ? -1 : 1);
    var xB = 0, xC = r2t, xA = xB - 3.2;
    /* velocita' del centro di massa nulla: A arriva con velocita' relativa a BC data da Ecoll (massa ridotta A–BC = 2M/3) */
    var vAB = Math.sqrt(2 * Ecoll / (2 * M / 3)), pA = M * vAB * 2 / 3, vA = pA / M, vBCcm = -pA / (2 * M);
    var vB = vBCcm - vrel / 2, vC = vBCcm + vrel / 2;
    var out = [], esito = 'in corso', r1, r2, g, aA, aB, aC;
    function forze() { r1 = xB - xA; r2 = xC - xB; g = grad(r1, r2); aA = g[0] / M; aB = (-g[0] + g[1]) / M; aC = -g[1] / M; }
    forze();
    var Eini = 0.5 * M * (vA * vA + vB * vB + vC * vC) + V(r1, r2);
    for (var n = 0; n < nmax; n++) {
      if (n % (opz.ogni || 4) === 0) out.push([r1, r2]);
      vA += 0.5 * dt * aA; vB += 0.5 * dt * aB; vC += 0.5 * dt * aC;
      xA += dt * vA; xB += dt * vB; xC += dt * vC;
      forze();
      vA += 0.5 * dt * aA; vB += 0.5 * dt * aB; vC += 0.5 * dt * aC;
      if (r2 > 3.4 && r1 < 1.6) { esito = 'reattiva'; break; }
      if (r1 > 3.4 && r2 < 1.6 && n > 50) { esito = 'non reattiva'; break; }
    }
    out.push([r1, r2]);
    var Etot = 0.5 * M * (vA * vA + vB * vB + vC * vC) + V(r1, r2);
    return { punti: out, esito: esito, t: n * dt * FS, Etot: Etot, E0: Eini };
  }
  /* cammino di minima energia: discesa lungo il gradiente dalla sella (spinta lungo l'antisimmetrico) */
  function cammino() {
    var S = sella(), out = [], r1 = S.r + 0.002, r2 = S.r - 0.002, s = 0;
    out.push([0, S.V, S.r, S.r]);
    for (var k = 0; k < 4000; k++) { var g = grad(r1, r2), n = Math.hypot(g[0], g[1]); if (n < 1e-6) break; var h = 0.004; r1 -= h * g[0] / n; r2 -= h * g[1] / n; s += h; out.push([s, V(r1, r2), r1, r2]); if (r1 > 3.2) break; }
    return out;
  }
  function probabilita(Ecoll, v, nfasi) {
    var ok = 0; for (var i = 0; i < nfasi; i++) if (traiettoria(Ecoll, v, 2 * (i + 0.5) / nfasi, { ogni: 1000 }).esito === 'reattiva') ok++;
    return ok / nfasi;
  }
  /* v238: la curvatura della superficie. Le frequenze dei moti nucleari attorno a un punto
     vengono dall'hessiana di V nelle coordinate interne (r_AB, r_BC) e dalla matrice G di
     Wilson della catena collineare A–B–C con masse uguali: G = (1/M)[[2, −1], [−1, 2]].
     Gli autovalori di G·H sono ω²: alla sella uno e' negativo (la frequenza immaginaria,
     il moto lungo la coordinata di reazione), l'altro e' lo stiramento simmetrico. */
  function hessiana(r1, r2) {
    var h = 1e-4, v0 = V(r1, r2);
    var a = (V(r1 + h, r2) - 2 * v0 + V(r1 - h, r2)) / (h * h), c = (V(r1, r2 + h) - 2 * v0 + V(r1, r2 - h)) / (h * h);
    var b = (V(r1 + h, r2 + h) - V(r1 + h, r2 - h) - V(r1 - h, r2 + h) + V(r1 - h, r2 - h)) / (4 * h * h);
    return [[a, b], [b, c]];
  }
  function frequenze(r1, r2) {
    var H = hessiana(r1, r2), g = 1 / M;
    var A00 = g * (2 * H[0][0] - H[1][0]), A01 = g * (2 * H[0][1] - H[1][1]), A10 = g * (-H[0][0] + 2 * H[1][0]), A11 = g * (-H[0][1] + 2 * H[1][1]);
    var tr = A00 + A11, det = A00 * A11 - A01 * A10, d = Math.sqrt(Math.max(0, tr * tr / 4 - det)), w2 = [tr / 2 + d, tr / 2 - d];
    /* in cm⁻¹; il segno meno indica una frequenza immaginaria */
    return { w2: w2, cm: w2.map(function (l) { return (l >= 0 ? 1 : -1) * HBAR * Math.sqrt(Math.abs(l)) * 8065.54; }), H: H };
  }
  /* la superficie su una griglia (n+1)×(n+1) fra a e b, per il disegno 3D */
  function grigliaV(n, a, b) {
    var Vg = new Float64Array((n + 1) * (n + 1)), mn = Infinity, mx = -Infinity;
    for (var i = 0; i <= n; i++) for (var j = 0; j <= n; j++) { var v = V(a + (b - a) * i / n, a + (b - a) * j / n); Vg[i * (n + 1) + j] = v; if (v < mn) mn = v; if (v > mx) mx = v; }
    return { n: n, a: a, b: b, V: Vg, min: mn, max: mx };
  }
  /* curve di livello su una griglia (quadrati in marcia): segmenti [i, j] in unita' di griglia */
  function livelli(Gr, quote) {
    var n = Gr.n, Z = Gr.V, seg = [];
    quote.forEach(function (L) {
      for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) {
        var v = [Z[i * (n + 1) + j], Z[(i + 1) * (n + 1) + j], Z[(i + 1) * (n + 1) + j + 1], Z[i * (n + 1) + j + 1]], c = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]], tg = [];
        for (var k = 0; k < 4; k++) { var u = v[k], w = v[(k + 1) % 4]; if ((u - L) * (w - L) < 0) { var f = (L - u) / (w - u), A = c[k], B = c[(k + 1) % 4]; tg.push([A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f, L]); } }
        if (tg.length >= 2) seg.push(tg[0], tg[1]); if (tg.length === 4) seg.push(tg[2], tg[3]);
      }
    });
    return seg;
  }
  F.calcolo.pes = { V: V, grad: grad, sella: sella, Evib: Evib, traiettoria: traiettoria, cammino: cammino, probabilita: probabilita, De: De, RE: RE, hessiana: hessiana, frequenze: frequenze, griglia: grigliaV, livelli: livelli, omega_cm: HBAR * OMEGA * 8065.54 };

  /* ═══ la mappa colorata con le curve di livello (in cache) ══════════════ */
  var R0 = 0.4, R1 = 3.2;
  function mappa() {
    if (mappa.c) return mappa.c;
    var n = 200, off = document.createElement('canvas'); off.width = n; off.height = n;
    var q = off.getContext('2d'), img = q.createImageData(n, n), d = img.data, L = [];
    for (var j = 0; j < n; j++) for (var i = 0; i < n; i++) { var r1 = R0 + (R1 - R0) * (i + 0.5) / n, r2 = R1 - (R1 - R0) * (j + 0.5) / n; L.push(Math.floor((Math.min(V(r1, r2), 1) + De) / 0.25)); }
    for (j = 0; j < n; j++) for (i = 0; i < n; i++) {
      var k = j * n + i, l = L[k], u = Math.min(1, l / 22), bordo = (i > 0 && L[k - 1] !== l) || (j > 0 && L[k - n] !== l);
      var c = [20 + 70 * u, 40 + 120 * u * (1 - u) * 2.5, 90 + 120 * (1 - u)];
      if (bordo) c = [200, 220, 230];
      d[4 * k] = c[0]; d[4 * k + 1] = c[1]; d[4 * k + 2] = c[2]; d[4 * k + 3] = 255;
    }
    q.putImageData(img, 0, 0); mappa.c = off; return off;
  }

  /* ═══ 1. superficie ═════════════════════════════════════════════════════ */
  function schedaSuperficie(div) {
    var G = griglia(div), st = { E: 0.5, v: 0, fase: 0.3 }, info = nota(G.pan), tr = null, idx = 0;
    F.cursore(G.pan, ['energia di collisione (eV)', 'collision energy (eV)'], 0.05, 1.5, 0.01, st.E, function (v) { st.E = v; lancia(); }, function (v) { return v.toFixed(2) + ' eV'; });
    F.scelta(G.pan, ['Vibrazione di H₂', 'H₂ vibration'], [['0', 'v = 0'], ['1', 'v = 1'], ['2', 'v = 2']], '0', function (v) { st.v = +v; lancia(); });
    F.cursore(G.pan, ['fase della vibrazione', 'vibration phase'], 0, 2, 0.01, st.fase, function (v) { st.fase = v; lancia(); }, function (v) { return v.toFixed(2) + ' π'; });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 1); cv.style.maxWidth = '560px'; cv.style.margin = '0 auto'; cv.style.display = 'block';
    var S = sella(), ctl = null;
    function lancia() {
      tr = traiettoria(st.E, st.v, st.fase, { ogni: 6 }); idx = 0;
      info.innerHTML = t('Esito: ', 'Outcome: ') + '<b class="bsiFX-num">' + (tr.esito === 'reattiva' ? t('reattiva — H_A–H_B + H_C', 'reactive — H_A–H_B + H_C') : tr.esito === 'non reattiva' ? t('non reattiva — rimbalza', 'non-reactive — bounces back') : t('ancora nel complesso', 'still in the complex')) + '</b> · ' + fmt(tr.t) + ' fs<br>' +
        t('Barriera (sella) ', 'Barrier (saddle) ') + 'E_b = ' + fmt(S.Ea) + ' eV · r‡ = ' + S.r.toFixed(3) + ' Å · ' + t('energia vibrazionale', 'vibrational energy') + ' E_v = ' + fmt(Evib(st.v)) + ' eV<br>' + t('Conservazione dell’energia: ', 'Energy conservation: ') + fmt(tr.E0) + ' → ' + fmt(tr.Etot) + ' eV<br>' +
        t('La traiettoria è una pallina che rotola sulla superficie: entra dalla valle dei reagenti (r_AB grande), deve superare il passo di montagna e scendere nella valle dei prodotti (r_BC grande). È la base della teoria dello stato di transizione.', 'The trajectory is a ball rolling on the surface: it enters from the reactant valley (large r_AB), must cross the mountain pass and go down into the product valley (large r_BC). It is the basis of transition-state theory.');
      if (ctl) { ctl.sveglia(); }
    }
    lancia();
    ctl = F.anima(cv, function (dt) {
      idx = Math.min(tr.punti.length - 1, idx + Math.max(1, Math.round(dt * 60 * 2)));
      var P = F.pennello(cv), q = P.q, W = P.W, H = P.H, X = function (r) { return (r - R0) / (R1 - R0) * W; }, Y = function (r) { return H - (r - R0) / (R1 - R0) * H; };
      q.imageSmoothingEnabled = true; q.drawImage(mappa(), 0, 0, W, H);
      q.strokeStyle = '#ffd24a'; q.lineWidth = 2; q.beginPath(); for (var i = 0; i <= idx; i++) { var p = tr.punti[i]; if (i) q.lineTo(X(p[0]), Y(p[1])); else q.moveTo(X(p[0]), Y(p[1])); } q.stroke(); q.lineWidth = 1;
      var p0 = tr.punti[idx]; q.fillStyle = '#ffffff'; q.beginPath(); q.arc(X(p0[0]), Y(p0[1]), 5, 0, 2 * Math.PI); q.fill();
      q.fillStyle = '#ff8a80'; q.beginPath(); q.arc(X(S.r), Y(S.r), 5, 0, 2 * Math.PI); q.fill(); q.font = '12px system-ui'; q.fillText('‡', X(S.r) + 7, Y(S.r) - 6);
      q.fillStyle = '#e6fffb'; q.fillText('r_AB (Å) →', W - 80, H - 8); q.save(); q.translate(14, 90); q.rotate(-Math.PI / 2); q.fillText('r_BC (Å) →', 0, 0); q.restore();
      q.fillText(t('reagenti A + BC', 'reactants A + BC'), W - 130, Y(RE) - 8); q.fillText(t('prodotti AB + C', 'products AB + C'), X(RE) + 8, 20);
      /* i tre atomi su una linea, in basso */
      var y0 = H - 26, s = 34, xa = 30, xb = xa + p0[0] * s, xc = xb + p0[1] * s;
      [[xa, 'A'], [xb, 'B'], [xc, 'C']].forEach(function (a) { q.fillStyle = '#c9d3df'; q.beginPath(); q.arc(a[0], y0, 7, 0, 2 * Math.PI); q.fill(); q.fillStyle = '#081522'; q.fillText(a[1], a[0] - 4, y0 + 4); });
      cv.setAttribute('aria-label', t('superficie di energia potenziale con traiettoria', 'potential energy surface with trajectory'));
      return idx < tr.punti.length - 1;
    }, { ricomincia: function () { idx = 0; } });
  }

  /* ═══ 2. cammino di reazione ════════════════════════════════════════════ */
  function schedaCammino(div) {
    var G = griglia(div), info = nota(G.pan), cv = F.tela(G.dx, 0.55);
    G.pan.appendChild(info);
    var C = cammino(), S = sella();
    function disegna() {
      var xs = [], ys = [];
      for (var i = C.length - 1; i >= 0; i--) { xs.push(-C[i][0]); ys.push(C[i][1] + De); }
      for (i = 1; i < C.length; i++) { xs.push(C[i][0]); ys.push(C[i][1] + De); }
      var zpe = Evib(0);
      F.grafico(cv, { serie: [{ x: xs, y: ys, col: '#ffc45a', larg: 2.5, etich: 'V(s)' }], linee: [{ y: zpe, col: '#6bcfff', etich: t('punto zero di H₂', 'H₂ zero point') }, { y: S.Ea, col: '#ff8a80', etich: '‡' }], xl: [t('coordinata di reazione s (Å)', 'reaction coordinate s (Å)'), 'reaction coordinate s (Å)'], yl: ['V (eV)', 'V (eV)'], descr: ['profilo del cammino di reazione', 'reaction path profile'] });
      info.innerHTML = t('Barriera classica ', 'Classical barrier ') + '<b class="bsiFX-num">' + fmt(S.Ea) + ' eV = ' + fmt(S.Ea * 96.485) + ' kJ/mol</b><br>' + t('Energia di punto zero di H₂ ', 'H₂ zero-point energy ') + fmt(Evib(0)) + ' eV (ħω = ' + fmt(HBAR * OMEGA * 8065.54) + ' cm⁻¹, ' + t('misurato 4401', 'measured 4401') + ')<br>' + t('Sella simmetrica: r_AB = r_BC = ', 'Symmetric saddle: r_AB = r_BC = ') + S.r.toFixed(3) + ' Å (' + t('più lungo di r_e = 0,742 Å: nel complesso attivato i legami sono a metà', 'longer than r_e = 0.742 Å: in the activated complex bonds are half-formed') + ')<br>' + t('La LEPS con k = 0,135 dà una barriera vicina a quella di H + H₂ calcolata ab initio (0,42 eV); l’energia di attivazione misurata è circa 0,33 eV perché il complesso conserva parte del punto zero e c’è effetto tunnel.', 'LEPS with k = 0.135 gives a barrier close to the ab initio H + H₂ one (0.42 eV); the measured activation energy is about 0.33 eV because the complex keeps part of the zero point and there is tunnelling.');
    }
    disegna(); F.alRidimensiona(disegna);
  }

  /* ═══ 3. regole di Polanyi ══════════════════════════════════════════════ */
  function schedaPolanyi(div) {
    var G = griglia(div), info = nota(G.pan), cv = F.tela(G.dx, 0.55), dati = null;
    F.bottone(G.pan, ['▶ Lancia 600 traiettorie', '▶ Launch 600 trajectories'], calcola);
    G.pan.appendChild(info);
    info.innerHTML = t('Per ogni energia di collisione si lanciano traiettorie a 12 fasi diverse della vibrazione e si conta la frazione reattiva.', 'For each collision energy, trajectories are launched at 12 different vibration phases and the reactive fraction is counted.');
    function disegna() {
      var Es = [], i; for (i = 0; i < 25; i++) Es.push(0.1 + i * 0.05);
      var serie = dati ? [{ x: Es, y: dati[0], col: '#6bcfff', larg: 2.5, etich: 'v = 0' }, { x: Es, y: dati[1], col: '#ffc45a', larg: 2.5, etich: 'v = 1' }] : [];
      F.grafico(cv, { serie: serie, linee: [{ y: 0.5, col: '#34465f' }], xmin: 0.1, xmax: 1.3, ymin: 0, ymax: 1.05, xl: [t('energia di collisione (eV)', 'collision energy (eV)'), 'collision energy (eV)'], yl: [t('probabilità di reazione', 'reaction probability'), 'reaction probability'], legenda: [{ col: '#6bcfff', etich: ['H₂ a riposo (v = 0)', 'H₂ at rest (v = 0)'] }, { col: '#ffc45a', etich: ['H₂ vibrante (v = 1)', 'vibrating H₂ (v = 1)'] }], descr: ['probabilità di reazione', 'reaction probability'] });
    }
    function calcola() {
      var Es = [], i; for (i = 0; i < 25; i++) Es.push(0.1 + i * 0.05);
      dati = [[], []]; i = 0;
      (function lotto() {
        if (i >= Es.length) { var soglia = function (a) { for (var k = 0; k < a.length; k++) if (a[k] > 0) return Es[k]; return NaN; }; info.innerHTML = t('Soglia apparente: ', 'Apparent threshold: ') + 'v = 0 → ' + fmt(soglia(dati[0])) + ' eV · v = 1 → ' + fmt(soglia(dati[1])) + ' eV (E_b = ' + fmt(sella().Ea) + ' eV)<br>' + t('Regole di Polanyi: per una barriera «precoce» conta l’energia di traslazione, per una «tardiva» quella di vibrazione. H + H₂ ha la barriera al centro: la vibrazione abbassa la soglia, ma ad alta energia la probabilità torna a calare perché A rimbalza prima che il legame si rompa. Nessun modello classico ha un unico «muro»: conta come l’energia è distribuita.', 'Polanyi rules: for an «early» barrier translational energy matters, for a «late» one vibrational energy. H + H₂ has a central barrier: vibration lowers the threshold, but at high energy the probability drops again because A bounces before the bond breaks. No classical model has a single «wall»: what matters is how the energy is distributed.'); disegna(); return; }
        dati[0].push(probabilita(Es[i], 0, 12)); dati[1].push(probabilita(Es[i], 1, 12)); i++;
        info.textContent = t('Calcolo… ', 'Computing… ') + Math.round(100 * i / Es.length) + ' %'; if (i % 3 === 0) disegna();
        setTimeout(lotto, 0);
      })();
    }
    disegna(); F.alRidimensiona(disegna);
  }

  /* ═══ 4. la superficie in 3D (v238) ═════════════════════════════════════
     La stessa V(r_AB, r_BC) come un paesaggio: le due valli, il muro
     repulsivo, il passo di montagna. La traiettoria di Verlet e' una pallina
     che rotola sulla superficie: la sua quota e' l'energia potenziale, il
     piano trasparente l'energia totale, che la pallina non puo' superare. */
  var MENO_MOTO = false; try { MENO_MOTO = !!(globale.matchMedia && globale.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { }
  /* la scheda 3D: il pannello subito, la scena dopo (three.js al primo uso, il contesto
     WebGL in un compito suo, il contenuto in un altro: il clic resta leggero) */
  function scheda3D(costruisci) {
    return function (div) {
      var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), destra = F.el('div', { style: 'min-width:0' });
      g.appendChild(pan); g.appendChild(destra); div.appendChild(g);
      var L3 = globale.BSILab3D, attesa = F.el('div', { 'class': 'bsiFX-nota', testo: t('Caricamento del motore 3D…', 'Loading the 3D engine…') });
      destra.appendChild(attesa);
      var ctx = costruisci(pan, destra);
      if (!L3) { attesa.textContent = t('Il motore 3D non è disponibile in questa pagina.', 'The 3D engine is not available on this page.'); return; }
      L3.stile();
      L3.caricaThree().then(function () {
        setTimeout(function () {
          attesa.remove();
          var S = new L3.Scena(destra, 0.72);
          var adatta = S.adatta; S.adatta = function () { if (this.box.offsetParent === null) return; adatta.call(this); };
          destra.insertBefore(S.box, destra.firstChild);
          S.box.setAttribute('role', 'group'); S.box.setAttribute('aria-label', F.tt(ctx.nome));
          div._scena = S;
          setTimeout(function () { ctx.tre(S, globale.THREE, L3); }, 0);
        }, 0);
      }).catch(function (e) { attesa.textContent = t('Motore 3D non disponibile: ', '3D engine unavailable: ') + e.message; });
    };
  }
  /* quota → colore: dal blu profondo delle valli al giallo dei crinali */
  function tinta(f) { f = Math.max(0, Math.min(1, f)); var st = [[0.10, 0.20, 0.55], [0.12, 0.55, 0.75], [0.30, 0.80, 0.62], [0.92, 0.78, 0.36], [0.80, 0.52, 0.42]], x = f * 4, i = Math.min(3, Math.floor(x)), u = x - i, a = st[i], b = st[i + 1]; return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]; }
  function schedaSuperficie3D(pan) {
    var st = { E: 0.6, v: 0, fase: 0.3, pausa: MENO_MOTO }, info = nota(pan), cb = {};
    F.cursore(pan, ['energia di collisione (eV)', 'collision energy (eV)'], 0.05, 1.5, 0.01, st.E, function (v) { st.E = v; lancia(); }, function (v) { return v.toFixed(2) + ' eV'; });
    F.scelta(pan, ['Vibrazione di H₂', 'H₂ vibration'], [['0', 'v = 0'], ['1', 'v = 1'], ['2', 'v = 2']], '0', function (v) { st.v = +v; lancia(); });
    F.cursore(pan, ['fase della vibrazione', 'vibration phase'], 0, 2, 0.01, st.fase, function (v) { st.fase = v; lancia(); }, function (v) { return v.toFixed(2) + ' π'; });
    var bp = F.bottone(pan, st.pausa ? ['▶ Avvia', '▶ Play'] : ['⏸ Pausa', '⏸ Pause'], function () { st.pausa = !st.pausa; bp.textContent = F.tt(st.pausa ? ['▶ Avvia', '▶ Play'] : ['⏸ Pausa', '⏸ Pause']); if (cb.sveglia) cb.sveglia(); });
    pan.appendChild(info);
    var spiega = nota(pan);
    spiega.innerHTML = t('Il paesaggio è la superficie LEPS di H + H₂ collineare: in basso a destra la valle dei reagenti (r_AB grande), in basso a sinistra quella dei prodotti (r_BC grande), in mezzo il passo ‡. La curva verde è il cammino di minima energia; la pallina gialla segue la traiettoria classica di Verlet e la sua quota è l’energia potenziale istantanea; il velo bianco è l’energia totale, che la pallina non supera mai. Sullo sfondo i tre atomi sulla loro retta, in scala. Trascina per girare, due dita o rotellina per ingrandire.',
      'The landscape is the LEPS surface of collinear H + H₂: bottom right the reactant valley (large r_AB), bottom left the product valley (large r_BC), the pass ‡ in between. The green curve is the minimum energy path; the yellow ball follows the classical Verlet trajectory and its height is the instantaneous potential energy; the white veil is the total energy, which the ball never exceeds. In the background the three atoms on their line, to scale. Drag to turn, two fingers or the wheel to zoom.');
    var S0 = sella(), fr = frequenze(S0.r, S0.r), tr = null;
    function lancia() {
      tr = traiettoria(st.E, st.v, st.fase, { ogni: 3 });
      info.innerHTML = t('Esito: ', 'Outcome: ') + '<b class="bsiFX-num">' + (tr.esito === 'reattiva' ? t('reattiva', 'reactive') : tr.esito === 'non reattiva' ? t('non reattiva', 'non-reactive') : t('ancora nel complesso', 'still in the complex')) + '</b> · ' + fmt(tr.t) + ' fs<br>' +
        t('Sella ‡: ', 'Saddle ‡: ') + 'r = ' + S0.r.toFixed(3) + ' Å, E_b = <b class="bsiFX-num">' + fmt(S0.Ea) + ' eV</b><br>' +
        t('Frequenze alla sella (hessiana · G di Wilson): stiramento simmetrico ', 'Saddle frequencies (Hessian · Wilson G): symmetric stretch ') + '<b class="bsiFX-num">' + Math.round(fr.cm[0]) + ' cm⁻¹</b>, ' + t('coordinata di reazione ', 'reaction coordinate ') + '<b class="bsiFX-num">' + Math.round(-fr.cm[1]) + 'i cm⁻¹</b> (' + t('immaginaria: lungo di lì la superficie scende', 'imaginary: along it the surface goes down') + ')<br>' +
        t('Energia totale ', 'Total energy ') + fmt(tr.E0 + De) + ' eV ' + t('sopra il fondo', 'above the floor') + ' · ' + t('conservata: ', 'conserved: ') + fmt(tr.E0) + ' → ' + fmt(tr.Etot) + ' eV';
      if (cb.nuova) cb.nuova();
    }
    lancia();
    return {
      nome: ['Superficie LEPS di H + H₂ in 3D con la traiettoria', 'LEPS surface of H + H₂ in 3D with the trajectory'],
      tre: function (S, T, L3) {
        var n = 96, a = 0.5, b = 2.9, Gr = grigliaV(n, a, b), Vtop = -De + 2.4, cx = (a + b) / 2, kx = 3 / ((b - a) / 2), kz = 1.05, z0 = -1.25;
        /* sopra 1,5 eV la quota si satura dolcemente (tanh): il muro repulsivo e l'altopiano degli atomi separati non coprono le valli */
        var cap = function (v) { var e = v + De; return e < 1.5 ? e : 1.5 + 0.6 * Math.tanh((e - 1.5) / 0.6); };
        var X = function (r) { return (r - cx) * kx; }, Z = function (v) { return cap(v) * kz + z0; };
        /* la superficie, colorata per quota */
        var pos = new Float32Array((n + 1) * (n + 1) * 3), col = new Float32Array(pos.length), idx = [];
        for (var i = 0; i <= n; i++) for (var j = 0; j <= n; j++) {
          var k = i * (n + 1) + j, v = Gr.V[k], c = tinta(cap(v) / 2.1);
          pos[3 * k] = X(a + (b - a) * i / n); pos[3 * k + 1] = X(a + (b - a) * j / n); pos[3 * k + 2] = Z(v);
          col[3 * k] = c[0]; col[3 * k + 1] = c[1]; col[3 * k + 2] = c[2];
        }
        for (i = 0; i < n; i++) for (j = 0; j < n; j++) { var p = i * (n + 1) + j, q = (i + 1) * (n + 1) + j; idx.push(p, q, q + 1, p, q + 1, p + 1); }
        var geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setAttribute('color', new T.BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals();
        S.aggiungi(new T.Mesh(geo, new T.MeshStandardMaterial({ vertexColors: true, side: T.DoubleSide, roughness: 0.6, metalness: 0.05 })));
        /* curve di livello ogni 0,25 eV, sulla superficie e proiettate sul pavimento */
        var quote = []; for (var e = 0.25; e < 2.4; e += 0.25) quote.push(-De + e);
        var sg = livelli(Gr, quote), su = [], giu = [], pav = z0 - 0.55, gr = function (u) { return X(a + (b - a) * u / n); };
        for (i = 0; i < sg.length; i++) { su.push(gr(sg[i][0]), gr(sg[i][1]), Z(sg[i][2]) + 0.012); giu.push(gr(sg[i][0]), gr(sg[i][1]), pav); }
        var gs = new T.BufferGeometry(); gs.setAttribute('position', new T.Float32BufferAttribute(su, 3));
        S.aggiungi(new T.LineSegments(gs, new T.LineBasicMaterial({ color: 0x0b1a2a, transparent: true, opacity: 0.55 })));
        var gg = new T.BufferGeometry(); gg.setAttribute('position', new T.Float32BufferAttribute(giu, 3));
        S.aggiungi(new T.LineSegments(gg, new T.LineBasicMaterial({ color: 0x5eead4, transparent: true, opacity: 0.45 })));
        S.aggiungi(L3.linea(T, [[-3, -3, pav], [3, -3, pav], [3, 3, pav], [-3, 3, pav], [-3, -3, pav]], 0x34465f));
        /* gli assi con le tacche in Å */
        [0.5, 1, 1.5, 2, 2.5].forEach(function (r) {
          var e1 = L3.testo3d(T, String(r).replace('.', t(',', '.')), '#9fb1c6', 0.2); e1.position.set(X(r), -3.35, pav); S.aggiungi(e1);
          var e2 = L3.testo3d(T, String(r).replace('.', t(',', '.')), '#9fb1c6', 0.2); e2.position.set(-3.35, X(r), pav); S.aggiungi(e2);
        });
        var ex = L3.testo3d(T, 'r_AB (Å)', '#ff8a80', 0.28); ex.position.set(0, -3.9, pav); S.aggiungi(ex);
        var ey = L3.testo3d(T, 'r_BC (Å)', '#6bcfff', 0.28); ey.position.set(-3.9, 0, pav); S.aggiungi(ey);
        var er = L3.testo3d(T, t('A + BC', 'A + BC'), '#e6fffb', 0.3); er.position.set(X(2.6), X(RE), Z(-De) + 0.45); S.aggiungi(er);
        var ep = L3.testo3d(T, t('AB + C', 'AB + C'), '#e6fffb', 0.3); ep.position.set(X(RE), X(2.6), Z(-De) + 0.45); S.aggiungi(ep);
        /* il cammino di minima energia, nei due versi dalla sella */
        var cm = cammino(), m1 = [], m2 = [];
        cm.forEach(function (c2) { m1.push([X(c2[2]), X(c2[3]), Z(c2[1]) + 0.03]); m2.push([X(c2[3]), X(c2[2]), Z(c2[1]) + 0.03]); });
        S.aggiungi(L3.linea(T, m2.reverse().concat(m1), 0x5eead4));
        /* la sella, con la direzione della frequenza immaginaria */
        var zs = Z(S0.V), xs = X(S0.r), sel = L3.sfera(T, 0.1, 0xff6b6b, xs, xs, zs + 0.02, true); S.aggiungi(sel);
        var lab = L3.testo3d(T, '‡', '#ff8a80', 0.45); lab.position.set(xs, xs, zs + 0.45); S.aggiungi(lab);
        S.aggiungi(L3.freccia(T, [xs, xs, zs + 0.06], [xs + 0.75, xs - 0.75, zs + 0.06], 0xff8a80, 0.18));
        S.aggiungi(L3.freccia(T, [xs, xs, zs + 0.06], [xs - 0.75, xs + 0.75, zs + 0.06], 0xff8a80, 0.18));
        /* il piano dell'energia totale, la pallina, la scia, i tre atomi */
        var velo = new T.Mesh(new T.PlaneGeometry(6, 6), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1, side: T.DoubleSide, depthWrite: false })); S.aggiungi(velo);
        var palla = L3.sfera(T, 0.11, 0xffd24a, 0, 0, 0, true); S.aggiungi(palla);
        var NS = 6000, sPos = new Float32Array(NS * 3), sGeo = new T.BufferGeometry(); sGeo.setAttribute('position', new T.BufferAttribute(sPos, 3)); sGeo.setDrawRange(0, 0);
        S.aggiungi(new T.Line(sGeo, new T.LineBasicMaterial({ color: 0xffd24a })));
        var atomi = ['A', 'B', 'C'].map(function (nm, i2) { var s = L3.sfera(T, 0.2, [0xff8a80, 0xe6fffb, 0x6bcfff][i2], 0, 0, 0, true); S.aggiungi(s); var et = L3.testo3d(T, nm, '#e6fffb', 0.26); S.aggiungi(et); return [s, et]; });
        var legame = L3.linea(T, [[0, 0, 0], [1, 0, 0]], 0x8494a8, 0.8); S.aggiungi(legame);
        var idx2 = 0, sosta = 0;
        cb.nuova = function () {
          idx2 = 0; sosta = 0; sGeo.setDrawRange(0, 0);
          var ze = Z(tr.E0); velo.position.set(0, 0, ze); velo.visible = tr.E0 < Vtop;
          var np = Math.min(NS, tr.punti.length);
          for (var k2 = 0; k2 < np; k2++) { var pt = tr.punti[k2]; sPos[3 * k2] = X(pt[0]); sPos[3 * k2 + 1] = X(pt[1]); sPos[3 * k2 + 2] = Z(V(pt[0], pt[1])) + 0.04; }
          sGeo.attributes.position.needsUpdate = true;
          metti(0); S.sporca = true; S.avvia();
        };
        cb.sveglia = function () { S.avvia(); };
        function metti(k3) {
          var pt = tr.punti[Math.min(k3, tr.punti.length - 1)], r1 = pt[0], r2 = pt[1];
          palla.position.set(X(r1), X(r2), Z(V(r1, r2)) + 0.1);
          sGeo.setDrawRange(0, Math.min(NS, k3 + 1));
          /* i tre atomi su una retta sospesa dietro la superficie, in scala reale (Å) */
          var s3 = 0.9, x0 = -2.6, xa = x0, xb = x0 + r1 * s3, xc = xb + r2 * s3, yy = 4.3, zz = 1.6;
          [xa, xb, xc].forEach(function (xx, i3) { var vis = xx < 4.2; atomi[i3][0].visible = atomi[i3][1].visible = vis; atomi[i3][0].position.set(Math.min(xx, 4.2), yy, zz); atomi[i3][1].position.set(Math.min(xx, 4.2), yy, zz + 0.4); });
          /* il legame si disegna fra i due atomi piu' vicini */
          var aa = r1 < r2 ? [xa, xb] : [xb, Math.min(xc, 4.2)];
          legame.geometry.setFromPoints([new T.Vector3(aa[0], yy, zz), new T.Vector3(aa[1], yy, zz)]);
        }
        cb.nuova();
        S.ogniFotogramma(function (dt) {
          if (st.pausa) return false;
          if (idx2 < tr.punti.length - 1) { idx2 = Math.min(tr.punti.length - 1, idx2 + Math.max(1, Math.round(dt * 60 * 1.5))); metti(idx2); }
          else { sosta += dt; if (sosta > 1.6) { idx2 = 0; sosta = 0; metti(0); } }
          S.didascalia.textContent = 'V(r_AB, r_BC) · ' + (tr.esito === 'reattiva' ? t('traiettoria reattiva', 'reactive trajectory') : t('traiettoria non reattiva', 'non-reactive trajectory')) + ' · t = ' + fmt(tr.t * idx2 / Math.max(1, tr.punti.length - 1)) + ' fs';
          return true;
        });
        S.didascalia.textContent = t('Superficie LEPS di H + H₂', 'LEPS surface of H + H₂');
        S.inquadra(11.5, -2.36, 0.58);
      }
    };
  }

  F.sezione('schipes', {
    titolo: ['🏔️ Superficie di energia potenziale', '🏔️ Potential energy surface'],
    sotto: ['La reazione H + H₂ → H₂ + H sulla superficie LEPS: curve di livello e punto di sella, traiettorie classiche reattive e non, il cammino di minima energia e le regole di Polanyi.', 'The H + H₂ → H₂ + H reaction on the LEPS surface: contour lines and saddle point, reactive and non-reactive classical trajectories, the minimum energy path and Polanyi’s rules.'],
    schede: [
      { nome: ['🗺️ Superficie', '🗺️ Surface'], costruisci: schedaSuperficie },
      { nome: ['⛰️ Cammino di reazione', '⛰️ Reaction path'], costruisci: schedaCammino },
      { nome: ['🎯 Polanyi', '🎯 Polanyi'], costruisci: schedaPolanyi },
      { nome: ['🧊 Superficie 3D', '🧊 3D surface'], costruisci: scheda3D(schedaSuperficie3D) }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
