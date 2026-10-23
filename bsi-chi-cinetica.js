/* ═══════════════════════════════════════════════════════════════════════════
   bsi-chi-cinetica.js — 🌀 cinetica complessa
   BioSpecInfo · © Samuele Pio Provenzano

   · REAZIONI COMPOSTE: consecutive A → B → C con la soluzione esatta, il
     massimo dell'intermedio t_max = ln(k₁/k₂)/(k₁ − k₂) e il confronto con
     l'approssimazione dello stato stazionario; parallele A → B, A → C (il
     rapporto dei prodotti e' k₁/k₂ in ogni istante); reversibili A ⇌ B
     (si rilassa con k₁ + k₂ verso K = k₁/k₂);
   · REAZIONI OSCILLANTI: il Brusselator x′ = A + x²y − (B + 1)x,
     y′ = Bx − x²y; sopra la soglia B > 1 + A² il punto stazionario perde
     stabilita' (biforcazione di Hopf) e nasce un ciclo limite: le
     concentrazioni oscillano da sole, come nella reazione di
     Belousov-Žabotinskij;
   · STRUTTURE DI TURING: il modello di Gray-Scott su una griglia, due
     specie che reagiscono e diffondono a velocita' diverse; da una piccola
     perturbazione nascono macchie, strisce, labirinti, cellule che si
     dividono.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt;
  function griglia(div) { var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); G.appendChild(pan); G.appendChild(dx); div.appendChild(G); return { pan: pan, dx: dx }; }
  function nota(pan) { var n = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(n); return n; }

  /* ═══ calcoli ═══════════════════════════════════════════════════════════ */
  function consecutive(k1, k2, A0) {
    var uguali = Math.abs(k1 - k2) < 1e-12;
    return {
      A: function (tt) { return A0 * Math.exp(-k1 * tt); },
      B: function (tt) { return uguali ? A0 * k1 * tt * Math.exp(-k1 * tt) : A0 * k1 / (k2 - k1) * (Math.exp(-k1 * tt) - Math.exp(-k2 * tt)); },
      C: function (tt) { var a = A0 * Math.exp(-k1 * tt), b = uguali ? A0 * k1 * tt * Math.exp(-k1 * tt) : A0 * k1 / (k2 - k1) * (Math.exp(-k1 * tt) - Math.exp(-k2 * tt)); return A0 - a - b; },
      Bss: function (tt) { return k1 / k2 * A0 * Math.exp(-k1 * tt); },
      tmax: uguali ? 1 / k1 : Math.log(k1 / k2) / (k1 - k2),
      Bmax: uguali ? A0 / Math.E : A0 * Math.pow(k2 / k1, k2 / (k1 - k2))
    };
  }
  function brusselatore(A, B, x0, y0, T, h) {
    var x = x0, y = y0, xs = [0], X = [x], Y = [y], n = Math.round(T / h);
    function f(u, v) { return [A + u * u * v - (B + 1) * u, B * u - u * u * v]; }
    for (var i = 1; i <= n; i++) {
      var k1 = f(x, y), k2 = f(x + h / 2 * k1[0], y + h / 2 * k1[1]), k3 = f(x + h / 2 * k2[0], y + h / 2 * k2[1]), k4 = f(x + h * k3[0], y + h * k3[1]);
      x += h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); y += h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]); xs.push(i * h); X.push(x); Y.push(y);
    }
    return { t: xs, x: X, y: Y, stazionario: [A, B / A], soglia: 1 + A * A };
  }
  /* periodo misurato dai massimi di x nella parte finale */
  function periodo(r) {
    var mx = [], n = r.x.length; for (var i = Math.floor(n / 2); i < n - 1; i++) if (r.x[i] > r.x[i - 1] && r.x[i] >= r.x[i + 1]) mx.push(r.t[i]);
    return mx.length > 2 ? (mx[mx.length - 1] - mx[0]) / (mx.length - 1) : NaN;
  }
  /* Gray-Scott: u + 2v → 3v, v → P; Du = 0,16, Dv = 0,08 (unita' di griglia) */
  function grayScott(N) {
    var u = new Float32Array(N * N).fill(1), v = new Float32Array(N * N), u2 = new Float32Array(N * N), v2 = new Float32Array(N * N);
    function semina(seme) { u.fill(1); v.fill(0); var s = seme || 1; function rnd() { s = (s * 16807) % 2147483647; return s / 2147483647; } for (var k = 0; k < 6; k++) { var cx = Math.floor(N * (0.25 + 0.5 * rnd())), cy = Math.floor(N * (0.25 + 0.5 * rnd())); for (var i = -4; i <= 4; i++) for (var j = -4; j <= 4; j++) { var id = ((cy + j + N) % N) * N + (cx + i + N) % N; u[id] = 0.5; v[id] = 0.25 + 0.02 * rnd(); } } }
    function passo(Fe, k) {
      var Du = 0.16, Dv = 0.08;
      for (var y = 0; y < N; y++) { var ym = ((y - 1 + N) % N) * N, yp = ((y + 1) % N) * N, y0 = y * N; for (var x = 0; x < N; x++) { var xm = (x - 1 + N) % N, xp = (x + 1) % N, i = y0 + x;
        var lu = u[y0 + xm] + u[y0 + xp] + u[ym + x] + u[yp + x] - 4 * u[i], lv = v[y0 + xm] + v[y0 + xp] + v[ym + x] + v[yp + x] - 4 * v[i], uvv = u[i] * v[i] * v[i];
        u2[i] = u[i] + Du * lu - uvv + Fe * (1 - u[i]); v2[i] = v[i] + Dv * lv + uvv - (Fe + k) * v[i]; } }
      var a = u; u = u2; u2 = a; var b = v; v = v2; v2 = b;
    }
    return { N: N, semina: semina, passo: passo, u: function () { return u; }, v: function () { return v; } };
  }
  F.calcolo.cinetica = { consecutive: consecutive, brusselatore: brusselatore, periodo: periodo, grayScott: grayScott };

  /* ═══ 1. reazioni composte ══════════════════════════════════════════════ */
  function schedaComposte(div) {
    var G = griglia(div), st = { tipo: 'cons', k1: 1, k2: 0.3 }, info = nota(G.pan);
    F.scelta(G.pan, ['Schema', 'Scheme'], [['cons', t('consecutive A → B → C', 'consecutive A → B → C')], ['par', t('parallele A → B, A → C', 'parallel A → B, A → C')], ['rev', t('reversibile A ⇌ B', 'reversible A ⇌ B')]], st.tipo, function (v) { st.tipo = v; disegna(); });
    F.cursore(G.pan, ['k₁ (s⁻¹)', 'k₁ (s⁻¹)'], -2, 1, 0.01, 0, function (v) { st.k1 = Math.pow(10, v); disegna(); }, function (v) { return fmt(Math.pow(10, v)); });
    F.cursore(G.pan, ['k₂ (s⁻¹)', 'k₂ (s⁻¹)'], -2, 1, 0.01, Math.log10(0.3), function (v) { st.k2 = Math.pow(10, v); disegna(); }, function (v) { return fmt(Math.pow(10, v)); });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.58);
    function disegna() {
      var k1 = st.k1, k2 = st.k2, Tm = 6 / Math.min(k1, Math.max(k2, 0.01)), xs = [], a = [], b = [], cc = [], ss = [];
      for (var i = 0; i <= 400; i++) xs.push(Math.min(Tm, 60) * i / 400);
      if (st.tipo === 'cons') {
        var S = consecutive(k1, k2, 1); xs.forEach(function (x) { a.push(S.A(x)); b.push(S.B(x)); cc.push(S.C(x)); ss.push(S.Bss(x)); });
        F.grafico(cv, { serie: [{ x: xs, y: a, col: '#5eead4', larg: 2.2, etich: '[A]' }, { x: xs, y: b, col: '#ffd24a', larg: 2.2, etich: '[B]' }, { x: xs, y: cc, col: '#ff8a80', larg: 2.2, etich: '[C]' }, { x: xs, y: ss, col: '#8494a8', tratt: true, etich: ['[B] stato stazionario', '[B] steady state'] }], punti: [{ x: S.tmax, y: S.Bmax, col: '#ffd24a', r: 5 }], ymin: 0, ymax: 1.05, xl: ['t (s)', 't (s)'], yl: ['concentrazione / [A]₀', 'concentration / [A]₀'], legenda: [{ col: '#5eead4', etich: '[A]' }, { col: '#ffd24a', etich: '[B]' }, { col: '#ff8a80', etich: '[C]' }, { col: '#8494a8', etich: ['stato stazionario per B', 'steady state for B'] }] });
        info.innerHTML = t('Massimo dell’intermedio a ', 'Intermediate maximum at ') + 't_max = ln(k₁/k₂)/(k₁ − k₂) = <b class="bsiFX-num">' + fmt(S.tmax) + ' s</b>, [B]_max = ' + fmt(S.Bmax) + ' [A]₀<br>' + t('Stato stazionario d[B]/dt ≈ 0 → [B] ≈ (k₁/k₂)[A]: ', 'Steady state d[B]/dt ≈ 0 → [B] ≈ (k₁/k₂)[A]: ') + (k2 > 10 * k1 ? t('qui funziona (k₂ ≫ k₁: B si consuma appena si forma).', 'it works here (k₂ ≫ k₁: B is consumed as soon as it forms).') : t('qui NON funziona: serve k₂ ≫ k₁ (prova k₂ = 10 k₁).', 'it does NOT work here: k₂ ≫ k₁ is needed (try k₂ = 10 k₁).')) + '<br>' + t('Se k₂ ≪ k₁ lo stadio lento è il secondo e governa la velocità di formazione di C (stadio cineticamente determinante).', 'If k₂ ≪ k₁ the slow step is the second and controls the rate of C formation (rate-determining step).');
      } else if (st.tipo === 'par') {
        var kt = k1 + k2; xs.forEach(function (x) { var e = Math.exp(-kt * x); a.push(e); b.push(k1 / kt * (1 - e)); cc.push(k2 / kt * (1 - e)); });
        F.grafico(cv, { serie: [{ x: xs, y: a, col: '#5eead4', larg: 2.2, etich: '[A]' }, { x: xs, y: b, col: '#ffd24a', larg: 2.2, etich: '[B]' }, { x: xs, y: cc, col: '#ff8a80', larg: 2.2, etich: '[C]' }], ymin: 0, ymax: 1.05, xl: ['t (s)', 't (s)'], yl: ['concentrazione / [A]₀', 'concentration / [A]₀'], legenda: [{ col: '#5eead4', etich: '[A]' }, { col: '#ffd24a', etich: '[B]' }, { col: '#ff8a80', etich: '[C]' }] });
        info.innerHTML = t('A scompare con k₁ + k₂ = ', 'A disappears with k₁ + k₂ = ') + fmt(kt) + ' s⁻¹; ' + t('in ogni istante ', 'at every instant ') + '[B]/[C] = k₁/k₂ = <b>' + fmt(k1 / k2) + '</b> (' + t('selettività ', 'selectivity ') + fmt(k1 / kt * 100) + ' % B)<br>' + t('È il controllo cinetico: quale prodotto prevale lo decidono le costanti di velocità, non la stabilità dei prodotti.', 'This is kinetic control: which product prevails is set by the rate constants, not by product stability.');
      } else {
        var kr = k1 + k2, K = k1 / k2; xs.forEach(function (x) { var e = Math.exp(-kr * x); b.push(k1 / kr * (1 - e)); a.push(1 - k1 / kr * (1 - e)); });
        F.grafico(cv, { serie: [{ x: xs, y: a, col: '#5eead4', larg: 2.2, etich: '[A]' }, { x: xs, y: b, col: '#ffd24a', larg: 2.2, etich: '[B]' }], linee: [{ y: k1 / kr, col: '#8494a8', etich: ['[B] all’equilibrio', '[B] at equilibrium'] }], ymin: 0, ymax: 1.05, xl: ['t (s)', 't (s)'], yl: ['concentrazione / [A]₀', 'concentration / [A]₀'], legenda: [{ col: '#5eead4', etich: '[A]' }, { col: '#ffd24a', etich: '[B]' }] });
        info.innerHTML = 'K = k₁/k₂ = <b>' + fmt(K) + '</b> · ' + t('rilassamento con ', 'relaxation with ') + 'k₁ + k₂ = ' + fmt(kr) + ' s⁻¹ (τ = ' + fmt(1 / kr) + ' s)<br>' + t('L’equilibrio si raggiunge con la SOMMA delle costanti: è il principio dei metodi a salto di temperatura (Eigen) per misurare reazioni velocissime.', 'Equilibrium is approached with the SUM of the constants: the principle of temperature-jump methods (Eigen) to measure very fast reactions.');
      }
    }
    disegna(); F.alRidimensiona(disegna);
  }

  /* ═══ 2. reazioni oscillanti ════════════════════════════════════════════ */
  function schedaOscillanti(div) {
    var G = griglia(div), st = { A: 1, B: 3 }, info = nota(G.pan), R, k = 0;
    F.cursore(G.pan, ['A', 'A'], 0.5, 2, 0.05, st.A, function (v) { st.A = v; calcola(); }, function (v) { return v.toFixed(2); });
    F.cursore(G.pan, ['B', 'B'], 0.5, 5, 0.05, st.B, function (v) { st.B = v; calcola(); }, function (v) { return v.toFixed(2); });
    G.pan.appendChild(info);
    var cf = F.tela(G.dx, 0.6), ct = F.tela(G.dx, 0.38);
    function calcola() {
      R = brusselatore(st.A, st.B, st.A + 0.3, st.B / st.A, 60, 0.01); k = 0;
      var P = periodo(R), osc = st.B > R.soglia;
      F.grafico(ct, { serie: [{ x: R.t, y: R.x, col: '#5eead4', larg: 1.8, etich: 'x' }, { x: R.t, y: R.y, col: '#ff8a80', larg: 1.8, etich: 'y' }], ymin: 0, xl: ['t', 't'], yl: ['concentrazioni', 'concentrations'], legenda: [{ col: '#5eead4', etich: 'x' }, { col: '#ff8a80', etich: 'y' }] });
      info.innerHTML = t('Stato stazionario ', 'Steady state ') + '(x*, y*) = (A, B/A) = (' + fmt(st.A) + ', ' + fmt(st.B / st.A) + ')<br>' + t('Soglia di Hopf ', 'Hopf threshold ') + 'B = 1 + A² = <b>' + fmt(R.soglia) + '</b> → ' + (osc ? '<b>' + t('oscilla', 'oscillates') + '</b>' + (isFinite(P) ? ', ' + t('periodo ', 'period ') + fmt(P) : '') + t(': la traiettoria va su un ciclo limite, qualunque sia il punto di partenza', ': the trajectory goes onto a limit cycle, whatever the starting point') : t('si smorza: le oscillazioni muoiono a spirale nel punto stazionario', 'damped: oscillations spiral into the steady state')) + '<br>' + t('Servono un passo autocatalitico (2X + Y → 3X) e un sistema lontano dall’equilibrio (A e B riforniti di continuo): nella reazione di Belousov-Žabotinskij il colore della soluzione va e viene per minuti.', 'It needs an autocatalytic step (2X + Y → 3X) and a system far from equilibrium (A and B continuously fed): in the Belousov-Zhabotinsky reaction the colour of the solution comes and goes for minutes.');
    }
    calcola();
    F.anima(cf, function (dt) {
      k = Math.min(R.x.length - 1, k + Math.round(dt * 60 * 6));
      var xs = R.x.slice(0, k + 1), ys = R.y.slice(0, k + 1), mx = Math.max.apply(null, R.x) * 1.1, my = Math.max.apply(null, R.y) * 1.1;
      var o = F.grafico(cf, { serie: [{ x: xs, y: ys, col: '#5eead4', larg: 1.6, etich: ['traiettoria', 'trajectory'], nascondiMirino: true }], punti: [{ x: R.stazionario[0], y: R.stazionario[1], col: '#ff8a80', r: 5 }], xmin: 0, xmax: mx, ymin: 0, ymax: my, xl: ['x', 'x'], yl: ['y', 'y'], descr: ['piano delle fasi del Brusselator', 'Brusselator phase plane'] });
      o.q.fillStyle = '#ffd24a'; o.q.beginPath(); o.q.arc(o.X(R.x[k]), o.Y(R.y[k]), 5, 0, Math.PI * 2); o.q.fill();
      if (k >= R.x.length - 1) return false;
    }, { ricomincia: function () { k = 0; } });
  }

  /* ═══ 3. Turing ═════════════════════════════════════════════════════════ */
  var PRESET = { macchie: [['macchie (come un ghepardo)', 'spots (like a cheetah)'], 0.035, 0.065], strisce: [['strisce e labirinti (come una zebra)', 'stripes and mazes (like a zebra)'], 0.06, 0.062], mitosi: [['cellule che si dividono', 'dividing cells'], 0.0367, 0.0649], buchi: [['buchi', 'holes'], 0.039, 0.058], onde: [['onde che viaggiano', 'travelling waves'], 0.014, 0.045] };
  function schedaTuring(div) {
    var G = griglia(div), st = { p: 'mitosi', Fe: 0.0367, k: 0.0649 }, info = nota(G.pan), N = 128, GS = grayScott(N), img = null, passi = 0;
    F.scelta(G.pan, ['Regime', 'Regime'], Object.keys(PRESET).map(function (k) { return [k, F.tt(PRESET[k][0])]; }), st.p, function (v) { st.p = v; st.Fe = PRESET[v][1]; st.k = PRESET[v][2]; GS.semina(7); passi = 0; testo(); });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 1); cv.style.maxWidth = '520px'; cv.style.margin = '0 auto';
    function testo() { info.innerHTML = t('Modello di Gray-Scott: U + 2V → 3V, V → P, con U rifornito (f = ', 'Gray-Scott model: U + 2V → 3V, V → P, with U fed in (f = ') + st.Fe + ') ' + t('e V rimosso (k = ', 'and V removed (k = ') + st.k + '). ' + t('U diffonde il doppio di V. ', 'U diffuses twice as fast as V. ') + '<br>' + t('Turing (1952) mostrò che due sostanze che reagiscono e diffondono a velocità diverse possono creare un ordine spaziale da una miscela uniforme: un’ipotesi per le macchie e le strisce degli animali, verificata in molti sistemi chimici.', 'Turing (1952) showed that two substances reacting and diffusing at different speeds can create spatial order from a uniform mixture: a hypothesis for animal spots and stripes, verified in many chemical systems.') + '<br>' + t('Passi: ', 'Steps: ') + passi; }
    GS.semina(7); testo();
    F.anima(cv, function (dt) {
      var n = Math.max(1, Math.round(dt * 60 * 12)); for (var i = 0; i < n; i++) GS.passo(st.Fe, st.k); passi += n;
      var q = cv.getContext('2d'); if (cv.width !== N || cv.height !== N) { cv.width = N; cv.height = N; cv.style.imageRendering = 'auto'; }
      if (!img) img = q.createImageData(N, N);
      var v = GS.v(), d = img.data; for (var j = 0; j < N * N; j++) { var c = Math.min(1, v[j] * 3.2); d[4 * j] = 8 + 86 * c; d[4 * j + 1] = 21 + 213 * c; d[4 * j + 2] = 34 + 178 * c; d[4 * j + 3] = 255; }
      q.putImageData(img, 0, 0);
      cv.setAttribute('aria-label', t('strutture di Turing che si formano', 'Turing patterns forming'));
      if (passi % 240 < n) testo();
    }, { ricomincia: function () { GS.semina(7); passi = 0; testo(); } });
  }

  F.sezione('schicinet', {
    titolo: ['🌀 Cinetica complessa', '🌀 Complex kinetics'],
    sotto: ['Reazioni consecutive, parallele e reversibili con le soluzioni esatte e lo stato stazionario; il Brusselator e le reazioni oscillanti con la biforcazione di Hopf; le strutture di Turing che nascono da reazione e diffusione.', 'Consecutive, parallel and reversible reactions with exact solutions and the steady state; the Brusselator and oscillating reactions with the Hopf bifurcation; Turing patterns arising from reaction and diffusion.'],
    schede: [
      { nome: ['⛓️ Reazioni composte', '⛓️ Composite reactions'], costruisci: schedaComposte },
      { nome: ['🔄 Reazioni oscillanti', '🔄 Oscillating reactions'], costruisci: schedaOscillanti },
      { nome: ['🐆 Strutture di Turing', '🐆 Turing patterns'], costruisci: schedaTuring }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
