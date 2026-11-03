/* ═══════════════════════════════════════════════════════════════════════════
   bsi-fis-ising.js — 🧲 modello di Ising e transizioni di fase
   BioSpecInfo · © Samuele Pio Provenzano

   · RETICOLO: spin ±1 su una griglia quadrata con l'algoritmo di Metropolis
     (bordi periodici); temperatura e campo regolabili; si vedono i domini
     crescere sotto Tc e fluttuare sopra;
   · MAGNETIZZAZIONE: |m|(T) misurata dalla simulazione contro la soluzione
     esatta di Onsager m = (1 − sinh⁻⁴(2J/kT))^(1/8), Tc = 2/ln(1+√2) ≈ 2,269;
     energia e calore specifico con il picco a Tc;
   · ISTERESI: il campo che va avanti e indietro sotto Tc disegna il ciclo
     m(h) di un ferromagnete; sopra Tc il ciclo si chiude;
   · ISING 3D (v238): un cubo di spin con Metropolis e sei vicini, i domini
     visti dentro il cubo e |m| contro T con T_c ≈ 4,51.
   Unita' ridotte: J = k_B = 1.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt, TC = 2 / Math.log(1 + Math.SQRT2);
  function griglia(div) { var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); G.appendChild(pan); G.appendChild(dx); div.appendChild(G); return { pan: pan, dx: dx }; }
  function nota(pan) { var n = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(n); return n; }
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var r = Math.imul(a ^ a >>> 15, 1 | a); r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r; return ((r ^ r >>> 14) >>> 0) / 4294967296; }; }

  /* ═══ calcoli ═══════════════════════════════════════════════════════════ */
  function reticolo(L, caldo, seme) {
    var rnd = mulberry32(seme || 7), s = new Int8Array(L * L);
    for (var i = 0; i < L * L; i++) s[i] = caldo ? (rnd() < 0.5 ? 1 : -1) : 1;
    return { L: L, s: s, rnd: rnd };
  }
  /* uno sweep = L² tentativi; le probabilita' di Metropolis tabulate per ΔE = 4, 8 (+ campo) */
  function sweep(R, T, h) {
    var L = R.L, s = R.s, rnd = R.rnd, N = L * L, b = 1 / T;
    for (var k = 0; k < N; k++) {
      var i = (rnd() * N) | 0, x = i % L, y = (i / L) | 0;
      var nn = s[y * L + (x + 1) % L] + s[y * L + (x + L - 1) % L] + s[((y + 1) % L) * L + x] + s[((y + L - 1) % L) * L + x];
      var dE = 2 * s[i] * (nn + h);
      if (dE <= 0 || rnd() < Math.exp(-b * dE)) s[i] = -s[i];
    }
  }
  function misura(R, h) {
    var L = R.L, s = R.s, M = 0, E = 0;
    for (var y = 0; y < L; y++) for (var x = 0; x < L; x++) { var v = s[y * L + x]; M += v; E -= v * (s[y * L + (x + 1) % L] + s[((y + 1) % L) * L + x]) + h * v; }
    return { m: M / (L * L), e: E / (L * L) };
  }
  function onsager(T) { if (T >= TC) return 0; var x = Math.sinh(2 / T); return Math.pow(1 - Math.pow(x, -4), 0.125); }
  /* una scansione in temperatura: per ogni T, termalizza e media |m|, e, e calore specifico */
  function scansione(L, Ts, term, mis, seme) {
    var R = reticolo(L, false, seme);
    return Ts.map(function (T) {
      for (var k = 0; k < term; k++) sweep(R, T, 0);
      var sm = 0, se = 0, se2 = 0;
      for (k = 0; k < mis; k++) { sweep(R, T, 0); var q = misura(R, 0); sm += Math.abs(q.m); se += q.e; se2 += q.e * q.e; }
      sm /= mis; se /= mis; se2 /= mis;
      return { T: T, m: sm, e: se, c: L * L * (se2 - se * se) / (T * T) };
    });
  }
  /* v238 — il modello di Ising in tre dimensioni: spin ±1 su un cubo L³ con bordi periodici, sei vicini.
     Non c'e' soluzione esatta: la temperatura critica viene dalle simulazioni, T_c ≈ 4,5115 J/k
     (il campo medio, z J = 6, la sovrastima). Indice i = x + L(y + L z). */
  var TC3D = 4.5115;
  function reticolo3D(L, caldo, seme) {
    var rnd = mulberry32(seme || 7), N = L * L * L, s = new Int8Array(N);
    for (var i = 0; i < N; i++) s[i] = caldo ? (rnd() < 0.5 ? 1 : -1) : 1;
    return { L: L, s: s, rnd: rnd };
  }
  function vicini3D(R, i) {
    var L = R.L, s = R.s, x = i % L, y = ((i / L) | 0) % L, z = (i / (L * L)) | 0, LL = L * L;
    return s[i - x + (x + 1) % L] + s[i - x + (x + L - 1) % L] + s[i + (((y + 1) % L) - y) * L] + s[i + (((y + L - 1) % L) - y) * L] + s[i + (((z + 1) % L) - z) * LL] + s[i + (((z + L - 1) % L) - z) * LL];
  }
  /* energia per girare lo spin i: ΔE = 2 s_i (Σ vicini + h) */
  function deltaE3D(R, i, h) { return 2 * R.s[i] * (vicini3D(R, i) + (h || 0)); }
  function sweep3D(R, T, h) {
    var N = R.s.length, s = R.s, rnd = R.rnd, b = 1 / T;
    for (var k = 0; k < N; k++) { var i = (rnd() * N) | 0, dE = 2 * s[i] * (vicini3D(R, i) + (h || 0)); if (dE <= 0 || rnd() < Math.exp(-b * dE)) s[i] = -s[i]; }
  }
  function misura3D(R, h) {
    var L = R.L, s = R.s, N = s.length, M = 0, E = 0;
    for (var i = 0; i < N; i++) { var x = i % L, y = ((i / L) | 0) % L, z = (i / (L * L)) | 0, v = s[i]; M += v; E -= v * (s[i - x + (x + 1) % L] + s[i + (((y + 1) % L) - y) * L] + s[i + (((z + 1) % L) - z) * L * L]) + (h || 0) * v; }
    return { m: M / N, e: E / N };
  }
  F.calcolo.ising = { TC: TC, reticolo: reticolo, sweep: sweep, misura: misura, onsager: onsager, scansione: scansione, TC3D: TC3D, reticolo3D: reticolo3D, sweep3D: sweep3D, misura3D: misura3D, deltaE3D: deltaE3D };

  function disegnaSpin(cv, R, cache) {
    var L = R.L;
    if (!cache.off || cache.off.width !== L) { cache.off = document.createElement('canvas'); cache.off.width = L; cache.off.height = L; cache.img = cache.off.getContext('2d').createImageData(L, L); }
    var d = cache.img.data;
    for (var i = 0; i < L * L; i++) { var su = R.s[i] > 0; d[4 * i] = su ? 255 : 30; d[4 * i + 1] = su ? 196 : 90; d[4 * i + 2] = su ? 90 : 170; d[4 * i + 3] = 255; }
    cache.off.getContext('2d').putImageData(cache.img, 0, 0);
    var P = F.pennello(cv); P.q.imageSmoothingEnabled = false; P.q.drawImage(cache.off, 0, 0, P.W, P.H);
    if (!cv.getAttribute('aria-label')) cv.setAttribute('aria-label', t('reticolo di spin: arancio su, blu giù', 'spin lattice: orange up, blue down'));
    return P;
  }

  /* ═══ 1. reticolo ═══════════════════════════════════════════════════════ */
  function schedaReticolo(div) {
    var G = griglia(div), st = { T: 2.0, h: 0, L: 128, vel: 2 }, info = nota(G.pan), R = reticolo(st.L, true, 11), cache = {}, storia = [];
    var inpT = F.cursore(G.pan, ['temperatura T (J/k)', 'temperature T (J/k)'], 0.5, 5, 0.01, st.T, function (v) { st.T = v; testo(); }, function (v) { return v.toFixed(2); });
    F.cursore(G.pan, ['campo esterno h', 'external field h'], -1, 1, 0.01, st.h, function (v) { st.h = v; }, function (v) { return v.toFixed(2); });
    F.cursore(G.pan, ['sweep per fotogramma', 'sweeps per frame'], 1, 10, 1, st.vel, function (v) { st.vel = v; });
    F.bottone(G.pan, ['Disordina (T infinita)', 'Randomize (infinite T)'], function () { R = reticolo(st.L, true, (Math.random() * 1e9) | 0); storia = []; ctl.sveglia(); });
    F.bottone(G.pan, ['Tutti su', 'All up'], function () { R = reticolo(st.L, false, 3); storia = []; ctl.sveglia(); });
    F.bottone(G.pan, ['Porta a Tc', 'Go to Tc'], function () { inpT.value = TC; inpT.dispatchEvent(new Event('input')); st.T = TC; testo(); });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 1), cm = F.tela(G.dx, 0.3); cv.style.maxWidth = '520px'; cv.style.margin = '0 auto'; cv.style.display = 'block';
    function testo() { info.innerHTML = 'T / Tc = <b class="bsiFX-num">' + (st.T / TC).toFixed(3) + '</b> · Tc = 2/ln(1+√2) ≈ 2,269<br>' + (st.T < TC * 0.97 ? t('Sotto Tc l’allineamento vince sull’agitazione: crescono domini compatti e alla fine prevale un colore (rottura spontanea di simmetria).', 'Below Tc alignment beats agitation: compact domains grow and in the end one colour wins (spontaneous symmetry breaking).') : st.T > TC * 1.03 ? t('Sopra Tc l’agitazione termica vince: piccole isole che nascono e muoiono, magnetizzazione media nulla.', 'Above Tc thermal agitation wins: small islands that are born and die, zero average magnetisation.') : t('Vicino a Tc: domini di tutte le dimensioni, un frattale. La lunghezza di correlazione diverge.', 'Near Tc: domains of every size, a fractal. The correlation length diverges.')) + '<br>' + t('Metropolis: si prova a girare uno spin; se l’energia scende si accetta, altrimenti con probabilità e^(−ΔE/kT).', 'Metropolis: try to flip a spin; if the energy drops accept, otherwise with probability e^(−ΔE/kT).'); }
    testo();
    var ctl = F.anima(cv, function () {
      for (var k = 0; k < st.vel; k++) sweep(R, st.T, st.h);
      disegnaSpin(cv, R, cache);
      var q = misura(R, st.h); storia.push(q.m); if (storia.length > 400) storia.shift();
      cv.setAttribute('aria-label', t('reticolo di spin, magnetizzazione ', 'spin lattice, magnetisation ') + q.m.toFixed(2));
      var xs = storia.map(function (_, i) { return i; });
      F.grafico(cm, { serie: [{ x: xs, y: storia.slice(), col: '#ffc45a', larg: 2, etich: 'm' }], xmin: 0, xmax: 400, ymin: -1, ymax: 1, xl: ['tempo (fotogrammi)', 'time (frames)'], yl: ['m', 'm'], descr: ['magnetizzazione nel tempo', 'magnetisation over time'] });
    });
  }

  /* ═══ 2. magnetizzazione ════════════════════════════════════════════════ */
  function schedaMagn(div) {
    var G = griglia(div), st = { L: 32 }, info = nota(G.pan), dati = null;
    F.scelta(G.pan, ['Lato del reticolo', 'Lattice side'], [['16', '16 × 16'], ['32', '32 × 32'], ['48', '48 × 48']], '32', function (v) { st.L = +v; });
    F.bottone(G.pan, ['▶ Misura (riscaldando da T = 1 a 4)', '▶ Measure (heating from T = 1 to 4)'], misura0);
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.5), cc = F.tela(G.dx, 0.4);
    function disegna() {
      var xs = [], ys = []; for (var T = 1; T <= 4; T += 0.005) { xs.push(T); ys.push(onsager(T)); }
      var serie = [{ x: xs, y: ys, col: '#6bcfff', larg: 2, etich: 'Onsager' }, { x: [TC, TC], y: [0, 1.05], col: '#ff8a80', tratt: true, larg: 1, etich: 'Tc' }], punti = [];
      if (dati) punti = dati.map(function (d) { return { x: d.T, y: d.m, col: '#ffc45a' }; });
      F.grafico(cv, { serie: serie, punti: punti, xmin: 1, xmax: 4, ymin: 0, ymax: 1.05, xl: ['T (J/k)', 'T (J/k)'], yl: ['|m|', '|m|'], legenda: [{ col: '#6bcfff', etich: ['esatto (Onsager 1944)', 'exact (Onsager 1944)'] }, { col: '#ffc45a', etich: ['simulazione', 'simulation'] }] });
      if (dati) F.grafico(cc, { serie: [{ x: dati.map(function (d) { return d.T; }), y: dati.map(function (d) { return d.c; }), col: '#ff8a80', larg: 2, etich: 'C' }], xmin: 1, xmax: 4, xl: ['T (J/k)', 'T (J/k)'], yl: [t('calore specifico C/N', 'specific heat C/N'), 'specific heat C/N'], descr: ['calore specifico', 'specific heat'] });
      else F.grafico(cc, { serie: [], xmin: 1, xmax: 4, ymin: 0, ymax: 2, xl: ['T (J/k)', 'T (J/k)'], yl: ['C/N', 'C/N'], descr: ['calore specifico (premi Misura)', 'specific heat (press Measure)'] });
    }
    function misura0() {
      var Ts = []; for (var T = 1; T <= 4.001; T += 0.1) Ts.push(+T.toFixed(2));
      dati = []; var i = 0, R = reticolo(st.L, false, 5);
      info.textContent = t('Misura in corso…', 'Measuring…');
      (function lotto() {
        if (i >= Ts.length) { testo(); disegna(); return; }
        var T = Ts[i++], term = 200, mis = 400, sm = 0, se = 0, se2 = 0, k;
        for (k = 0; k < term; k++) sweep(R, T, 0);
        for (k = 0; k < mis; k++) { sweep(R, T, 0); var q = misura(R, 0); sm += Math.abs(q.m); se += q.e; se2 += q.e * q.e; }
        sm /= mis; se /= mis; se2 /= mis; dati.push({ T: T, m: sm, e: se, c: st.L * st.L * (se2 - se * se) / (T * T) });
        disegna(); info.textContent = t('Misura in corso… T = ', 'Measuring… T = ') + T.toFixed(1);
        setTimeout(lotto, 0);
      })();
    }
    function testo() {
      var cmax = dati ? dati.reduce(function (a, d) { return d.c > a.c ? d : a; }) : null;
      info.innerHTML = t('Soluzione esatta di Onsager: ', 'Onsager’s exact solution: ') + 'm = (1 − sinh⁻⁴(2J/kT))^(1/8) · ' + t('esponente critico', 'critical exponent') + ' β = 1/8' + (cmax ? '<br>' + t('Picco del calore specifico a ', 'Specific heat peak at ') + 'T = <b class="bsiFX-num">' + cmax.T.toFixed(1) + '</b> (Tc = 2,269)' : '') + '<br>' + t('In un reticolo finito la transizione si arrotonda: sopra Tc |m| non va a zero ma a ~1/L. Più grande il reticolo, più netta la transizione.', 'In a finite lattice the transition is rounded: above Tc |m| does not reach zero but ~1/L. The bigger the lattice, the sharper the transition.');
    }
    testo(); disegna(); F.alRidimensiona(disegna);
  }

  /* ═══ 3. isteresi ═══════════════════════════════════════════════════════ */
  function schedaIsteresi(div) {
    var G = griglia(div), st = { T: 1.5 }, info = nota(G.pan), L = 48, R = reticolo(L, false, 9), cache = {}, fase = 0, pts = [];
    F.cursore(G.pan, ['temperatura T', 'temperature T'], 0.8, 4, 0.05, st.T, function (v) { st.T = v; pts = []; fase = 0; testo(); }, function (v) { return v.toFixed(2); });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.6), cs = F.tela(G.dx, 0.35);
    function testo() { info.innerHTML = t('Il campo h oscilla fra −2 e +2. ', 'The field h oscillates between −2 and +2. ') + (st.T < TC ? t('Sotto Tc la magnetizzazione resta indietro: per invertirla serve un campo coercitivo, e a h = 0 resta una magnetizzazione residua. È la memoria di un magnete permanente e di un disco rigido.', 'Below Tc the magnetisation lags behind: reversing it takes a coercive field, and at h = 0 a remanent magnetisation is left. It is the memory of a permanent magnet and of a hard disk.') : t('Sopra Tc il ciclo si chiude: il materiale è paramagnetico, segue il campo senza memoria.', 'Above Tc the loop closes: the material is paramagnetic and follows the field without memory.')) + '<br>' + t('L’area del ciclo è l’energia dissipata in calore a ogni giro (perdite nei trasformatori).', 'The loop area is the energy dissipated as heat on each cycle (transformer losses).'); }
    testo();
    F.anima(cv, function (dt) {
      fase += dt * 0.35; var h = 2 * Math.sin(fase);
      for (var k = 0; k < 2; k++) sweep(R, st.T, h);
      var q = misura(R, h); pts.push([h, q.m]); if (pts.length > 1500) pts.shift();
      F.grafico(cv, { serie: [{ x: pts.map(function (p) { return p[0]; }), y: pts.map(function (p) { return p[1]; }), col: '#ffc45a', larg: 2, etich: 'm(h)' }], punti: [{ x: h, y: q.m, col: '#ff8a80', r: 5 }], xmin: -2, xmax: 2, ymin: -1.05, ymax: 1.05, xl: [t('campo h', 'field h'), 'field h'], yl: ['m', 'm'], descr: ['ciclo di isteresi', 'hysteresis loop'] });
      disegnaSpin(cs, R, cache);
    });
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

  /* ═══ 4. Ising in 3D (v238) ════════════════════════════════════════════
     Un cubo di spin come cubetti colorati, Metropolis a ogni fotogramma; sotto, |m| contro T
     accumulata mentre si cambia la temperatura (o con la scansione lenta che raffredda da sola). */
  function schedaIsing3D(pan, destra) {
    var st = { T: 5.5, L: 10, vista: 'tutti', scan: false }, cb = {}, dati = {}, attesa = 0;
    var inpT = F.cursore(pan, ['temperatura T (J/k)', 'temperature T (J/k)'], 2, 8, 0.05, st.T, function (v) { st.T = v; st.scan = false; attesa = 30; }, function (v) { return v.toFixed(2); });
    F.scelta(pan, ['Lato del cubo', 'Cube side'], [['10', '10³ = 1000'], ['14', '14³ = 2744'], ['18', '18³ = 5832']], String(st.L), function (v) { st.L = +v; dati = {}; if (cb.nuovo) cb.nuovo(); });
    F.scelta(pan, ['Che cosa mostrare', 'What to show'], [['tutti', t('tutti gli spin', 'all spins')], ['giu', t('solo gli spin giù (i domini minoritari)', 'only down spins (minority domains)')], ['meta', t('metà cubo (si vede dentro)', 'half cube (see inside)')]], st.vista, function (v) { st.vista = v; });
    F.bottone(pan, ['❄ Scansione lenta: da T = 7,5 a 2,5', '❄ Slow scan: from T = 7.5 to 2.5'], function () { st.T = 7.5; st.scan = true; attesa = 20; aggiornaT(); });
    F.bottone(pan, ['Azzera il grafico', 'Clear the chart'], function () { dati = {}; grafico(); });
    var info = nota(pan), spiega = nota(pan);
    spiega.innerHTML = t('Ogni cubetto è uno spin: arancio su, blu giù; ognuno sente i suoi sei vicini sul reticolo cubico con bordi periodici. A ogni fotogramma l’algoritmo di Metropolis prova a girare ogni spin: accetta se l’energia scende, altrimenti con probabilità e^(−ΔE/kT). In tre dimensioni l’ordine resiste più che nel piano: la transizione cade a T_c ≈ 4,51 J/k (in 2D era 2,269; il campo medio direbbe 6). Sotto il grafico |m| contro T, misurato mentre la simulazione gira: la scansione lenta raffredda da sola il cubo e disegna la curva della transizione.',
      'Each little cube is a spin: orange up, blue down; each feels its six neighbours on the cubic lattice with periodic boundaries. Every frame the Metropolis algorithm tries to flip every spin: it accepts if the energy drops, otherwise with probability e^(−ΔE/kT). In three dimensions order survives better than in the plane: the transition falls at T_c ≈ 4.51 J/k (2.269 in 2D; mean field would say 6). Below, the chart of |m| against T, measured while the simulation runs: the slow scan cools the cube by itself and draws the transition curve.');
    var tela = F.tela(destra, 0.36);
    function aggiornaT() { inpT.value = st.T; var b = inpT.parentNode.querySelector('b'); if (b) b.textContent = st.T.toFixed(2); }
    function grafico() {
      var xs = Object.keys(dati).map(Number).sort(function (a, b) { return a - b; }), punti = xs.map(function (k) { return { x: k / 20, y: dati[k][0] / dati[k][1], col: '#ffc45a', r: 3.5 }; });
      if (R) punti.push({ x: st.T, y: Math.abs(ultima.m), col: '#ff8a80', r: 5 });
      F.grafico(tela, { serie: [{ x: [TC3D, TC3D], y: [0, 1.05], col: '#ff8a80', tratt: true, larg: 1, etich: 'T_c 3D', nascondiMirino: true }, { x: [6, 6], y: [0, 1.05], col: '#8494a8', tratt: true, larg: 1, etich: t('campo medio', 'mean field'), nascondiMirino: true }, { x: [TC, TC], y: [0, 1.05], col: '#6bcfff', tratt: true, larg: 1, etich: 'T_c 2D', nascondiMirino: true }], punti: punti, xmin: 2, xmax: 8, ymin: 0, ymax: 1.05, xl: ['T (J/k)', 'T (J/k)'], yl: ['|m|', '|m|'], legenda: [{ col: '#ffc45a', etich: ['|m| misurata', 'measured |m|'] }, { col: '#ff8a80', etich: ['T_c 3D ≈ 4,51', 'T_c 3D ≈ 4.51'] }, { col: '#6bcfff', etich: ['T_c 2D = 2,269', 'T_c 2D = 2.269'] }, { col: '#8494a8', etich: ['campo medio 6', 'mean field 6'] }], descr: ['magnetizzazione del cubo di Ising contro la temperatura', 'Ising cube magnetisation versus temperature'] });
    }
    var R = null, ultima = { m: 1, e: -3 };
    grafico(); F.alRidimensiona(grafico);
    function testo() { info.innerHTML = 'T / T_c = <b class="bsiFX-num">' + (st.T / TC3D).toFixed(3) + '</b> · m = <b class="bsiFX-num">' + ultima.m.toFixed(3) + '</b> · ' + t('energia per spin ', 'energy per spin ') + '<b class="bsiFX-num">' + ultima.e.toFixed(3) + '</b> J<br>' + (st.T < TC3D * 0.97 ? t('Sotto T_c: un colore prevale e i domini dell’altro si riducono a isole.', 'Below T_c: one colour wins and the other’s domains shrink to islands.') : st.T > TC3D * 1.03 ? t('Sopra T_c: spin mescolati, m ≈ 0 (resta ~1/√N per le fluttuazioni).', 'Above T_c: mixed spins, m ≈ 0 (about 1/√N is left by fluctuations).') : t('Vicino a T_c: domini intrecciati di tutte le dimensioni.', 'Near T_c: interlocked domains of every size.')) + (st.scan ? '<br>' + t('Scansione in corso…', 'Scanning…') : ''); }
    return {
      etichetta: ['Modello di Ising in 3D: cubo di spin con l’algoritmo di Metropolis', '3D Ising model: a cube of spins with the Metropolis algorithm'],
      tre: function (S, T, L3) {
        var mesh = null, M4 = new T.Matrix4(), col = new T.Color(), tG = 0;
        cb.nuovo = function () {
          R = reticolo3D(st.L, true, 11); attesa = 30;
          if (mesh) { S.radice.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose(); }
          mesh = new T.InstancedMesh(new T.BoxGeometry(0.82, 0.82, 0.82), new T.MeshLambertMaterial(), st.L * st.L * st.L);
          mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
          for (var i = 0; i < R.s.length; i++) mesh.setColorAt(i, col.setRGB(1, 1, 1));
          S.aggiungi(mesh); disegna(); S.inquadra(st.L * 2.7, -0.75, 1.1);
        };
        var vistaPrec = null;
        function disegna() {
          var L = st.L, o = (L - 1) / 2, cambia = vistaPrec !== st.vista; vistaPrec = st.vista;
          for (var i = 0; i < R.s.length; i++) {
            var su = R.s[i] > 0, x = i % L, y = ((i / L) | 0) % L, z = (i / (L * L)) | 0, vis = st.vista === 'tutti' || (st.vista === 'giu' ? !su : y < L / 2);
            if (vis) M4.makeTranslation(x - o, y - o, z - o); else M4.makeScale(0, 0, 0);
            mesh.setMatrixAt(i, M4); mesh.setColorAt(i, su ? col.setRGB(1, 0.72, 0.3) : col.setRGB(0.16, 0.42, 0.85));
          }
          mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
          S.didascalia.textContent = 'L = ' + L + ' · T = ' + st.T.toFixed(2) + ' · m = ' + ultima.m.toFixed(3);
        }
        cb.nuovo();
        S.ogniFotogramma(function (dt) {
          if (S.fermo) return false;
          var n = st.L > 16 ? 1 : 2;
          for (var k = 0; k < n; k++) sweep3D(R, st.T, 0);
          ultima = misura3D(R, 0);
          if (attesa > 0) attesa -= n; else { var b = Math.round(st.T * 20); dati[b] = dati[b] || [0, 0]; dati[b][0] += Math.abs(ultima.m); dati[b][1]++; }
          if (st.scan) { st.T = Math.max(2.5, st.T - dt * 0.2); aggiornaT(); if (st.T <= 2.5) st.scan = false; }
          disegna();
          tG += dt; if (tG > 0.3) { tG = 0; grafico(); testo(); }
          return true;
        });
      }
    };
  }

  F.sezione('sfisising', {
    titolo: ['🧲 Modello di Ising', '🧲 Ising model'],
    sotto: ['Spin su un reticolo con l’algoritmo di Metropolis: i domini, la transizione di fase a Tc = 2,269 contro la soluzione esatta di Onsager, il calore specifico e il ciclo di isteresi.', 'Spins on a lattice with the Metropolis algorithm: domains, the phase transition at Tc = 2.269 against Onsager’s exact solution, specific heat and the hysteresis loop.'],
    schede: [
      { nome: ['🔲 Reticolo', '🔲 Lattice'], costruisci: schedaReticolo },
      { nome: ['📉 Transizione', '📉 Transition'], costruisci: schedaMagn },
      { nome: ['🔁 Isteresi', '🔁 Hysteresis'], costruisci: schedaIsteresi },
      { nome: ['🧊 Ising 3D', '🧊 3D Ising'], costruisci: scheda3D(schedaIsing3D) }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
