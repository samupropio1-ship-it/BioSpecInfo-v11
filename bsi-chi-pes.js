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
     diverso.
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
  F.calcolo.pes = { V: V, grad: grad, sella: sella, Evib: Evib, traiettoria: traiettoria, cammino: cammino, probabilita: probabilita, De: De, RE: RE };

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

  F.sezione('schipes', {
    titolo: ['🏔️ Superficie di energia potenziale', '🏔️ Potential energy surface'],
    sotto: ['La reazione H + H₂ → H₂ + H sulla superficie LEPS: curve di livello e punto di sella, traiettorie classiche reattive e non, il cammino di minima energia e le regole di Polanyi.', 'The H + H₂ → H₂ + H reaction on the LEPS surface: contour lines and saddle point, reactive and non-reactive classical trajectories, the minimum energy path and Polanyi’s rules.'],
    schede: [
      { nome: ['🗺️ Superficie', '🗺️ Surface'], costruisci: schedaSuperficie },
      { nome: ['⛰️ Cammino di reazione', '⛰️ Reaction path'], costruisci: schedaCammino },
      { nome: ['🎯 Polanyi', '🎯 Polanyi'], costruisci: schedaPolanyi }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
