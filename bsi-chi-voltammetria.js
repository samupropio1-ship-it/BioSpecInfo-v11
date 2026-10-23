/* ═══════════════════════════════════════════════════════════════════════════
   bsi-chi-voltammetria.js — 🔋 voltammetria ciclica
   BioSpecInfo · © Samuele Pio Provenzano

   Una vera simulazione elettrochimica, non un disegno: la coppia
   O + n e⁻ ⇌ R davanti a un elettrodo planare.
   · La DIFFUSIONE di O e R nella soluzione con le differenze finite
     esplicite (λ = DΔt/Δx² = 0,45, stabile);
   · all'elettrodo la CINETICA di Butler-Volmer, con il gradiente di
     concentrazione al bordo del secondo ordine,
     J = k⁰ [C_O(0) e^(−αnf(E−E⁰)) − C_R(0) e^((1−α)nf(E−E⁰))], risolta
     insieme al bilancio di flusso (implicita sul bordo: stabile anche con
     k⁰ grandissimo);
   · il potenziale che va e torna a velocita' v; la corrente i = −nFAJ
     (convenzione IUPAC: riduzione negativa).
   Si vede il voltammogramma disegnarsi e, sotto, i profili di
   concentrazione che si svuotano vicino all'elettrodo. Per una coppia
   reversibile il picco segue Randles-Ševčík, i_p = 0,4463 nFAC√(nFvD/RT),
   e i picchi distano ≈ 59/n mV; rallentando k⁰ i picchi si allontanano
   (Nicholson). Nella seconda scheda i_p contro √v: la retta dice che il
   processo e' controllato dalla diffusione, e dalla pendenza si ricava D.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt, Fa = 96485.33212, R = 8.314462618, T = 298.15;
  function griglia(div) { var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); G.appendChild(pan); G.appendChild(dx); div.appendChild(G); return { pan: pan, dx: dx }; }
  function nota(pan) { var n = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(n); return n; }

  /* o: { E0, Ei, El, v (V/s), k0 (cm/s), alfa, n, D (cm²/s), C (mol/cm³), A (cm²), Nt } */
  function simula(o) {
    var n = o.n || 1, f = n * Fa / (R * T), Tt = 2 * Math.abs(o.El - o.Ei) / o.v, Nt = o.Nt || 4000, dt = Tt / Nt, lam = 0.45, dx = Math.sqrt(o.D * dt / lam), L = 6 * Math.sqrt(o.D * Tt), Nx = Math.ceil(L / dx) + 2;
    var cO = new Float64Array(Nx).fill(o.C), cR = new Float64Array(Nx), nO = new Float64Array(Nx), nR = new Float64Array(Nx), E = [], I = [], profili = [], s = o.El < o.Ei ? -1 : 1;
    for (var k = 1; k <= Nt; k++) {
      var tt = k * dt, Ek = tt <= Tt / 2 ? o.Ei + s * o.v * tt : o.El - s * o.v * (tt - Tt / 2);
      for (var i = 1; i < Nx - 1; i++) { nO[i] = cO[i] + lam * (cO[i + 1] - 2 * cO[i] + cO[i - 1]); nR[i] = cR[i] + lam * (cR[i + 1] - 2 * cR[i] + cR[i - 1]); }
      nO[Nx - 1] = o.C; nR[Nx - 1] = 0;
      /* bordo: J con Butler-Volmer e bilancio di flusso, risolti insieme */
      var ef = Math.exp(-o.alfa * f * (Ek - o.E0)), eb = Math.exp((1 - o.alfa) * f * (Ek - o.E0)), g = dx / o.D;
      /* gradiente al bordo del secondo ordine: dC/dx|₀ ≈ (−3c₀ + 4c₁ − c₂)/(2Δx), con D dC_O/dx|₀ = J */
      var aO = 4 * nO[1] - nO[2], aR = 4 * nR[1] - nR[2];
      var J = o.k0 * (aO * ef - aR * eb) / 3 / (1 + 2 / 3 * o.k0 * g * (ef + eb));
      nO[0] = Math.max(0, (aO - 2 * g * J) / 3); nR[0] = Math.max(0, (aR + 2 * g * J) / 3);
      var tmp = cO; cO = nO; nO = tmp; tmp = cR; cR = nR; nR = tmp;
      E.push(Ek); I.push(-n * Fa * o.A * J);
      if (k % Math.round(Nt / 200) === 0) profili.push({ k: E.length - 1, o: Array.prototype.slice.call(cO, 0, Math.min(Nx, 160)), r: Array.prototype.slice.call(cR, 0, Math.min(Nx, 160)), dx: dx });
    }
    return { E: E, I: I, profili: profili };
  }
  function picchi(S) {
    var met = Math.floor(S.E.length / 2), ic = 0, ia = 0, Ec = 0, Ea = 0;
    for (var i = 0; i < S.E.length; i++) { if (i < met && S.I[i] < ic) { ic = S.I[i]; Ec = S.E[i]; } if (i >= met && S.I[i] > ia) { ia = S.I[i]; Ea = S.E[i]; } }
    return { ipc: ic, Epc: Ec, ipa: ia, Epa: Ea, dEp: Ea - Ec, E12: (Ea + Ec) / 2 };
  }
  function randles(n, A, C, v, D) { return 0.4463 * n * Fa * A * C * Math.sqrt(n * Fa * v * D / (R * T)); }
  F.calcolo.voltammetria = { simula: simula, picchi: picchi, randles: randles };

  function parametri(st) { return { E0: 0, Ei: 0.4, El: -0.4, v: st.v, k0: Math.pow(10, st.lk0), alfa: st.alfa, n: st.n, D: 1e-5, C: 1e-6, A: 1, Nt: 6000 }; }

  /* ═══ 1. simulatore ═════════════════════════════════════════════════════ */
  function schedaCV(div) {
    var G = griglia(div), st = { v: 0.1, lk0: 0, alfa: 0.5, n: 1 }, info = nota(G.pan), S, P0, k = 0;
    F.cursore(G.pan, ['velocità di scansione v (V/s)', 'scan rate v (V/s)'], -2, 1, 0.05, -1, function (v) { st.v = Math.pow(10, v); calcola(); }, function (v) { return fmt(Math.pow(10, v)); });
    F.cursore(G.pan, ['log₁₀ k⁰ (cm/s)', 'log₁₀ k⁰ (cm/s)'], -5, 1, 0.1, st.lk0, function (v) { st.lk0 = v; calcola(); }, function (v) { return v.toFixed(1); });
    F.cursore(G.pan, ['coefficiente di trasferimento α', 'transfer coefficient α'], 0.3, 0.7, 0.05, st.alfa, function (v) { st.alfa = v; calcola(); }, function (v) { return v.toFixed(2); });
    F.cursore(G.pan, ['elettroni n', 'electrons n'], 1, 2, 1, st.n, function (v) { st.n = v; calcola(); });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.6), cp = F.tela(G.dx, 0.38);
    function calcola() {
      S = simula(parametri(st)); P0 = picchi(S); k = 0; if (ctl) ctl.sveglia();
      var ir = randles(st.n, 1, 1e-6, st.v, 1e-5), Lam = Math.pow(10, st.lk0) / Math.sqrt(1e-5 * st.n * Fa * st.v / (R * T));
      info.innerHTML = t('Picco catodico ', 'Cathodic peak ') + 'i_pc = <b class="bsiFX-num">' + fmt(P0.ipc * 1000) + ' mA</b> a ' + fmt(P0.Epc * 1000) + ' mV · ' + t('anodico ', 'anodic ') + fmt(P0.ipa * 1000) + ' mA a ' + fmt(P0.Epa * 1000) + ' mV<br>ΔE_p = <b class="bsiFX-num">' + fmt(P0.dEp * 1000) + ' mV</b> (' + t('reversibile: ≈ ', 'reversible: ≈ ') + fmt(59 / st.n) + ' mV) · E½ = ' + fmt(P0.E12 * 1000) + ' mV (E⁰ = 0)<br>Randles-Ševčík (' + t('reversibile', 'reversible') + '): i_p = ' + fmt(ir * 1000) + ' mA · |i_pc|/i_p = <b>' + fmt(-P0.ipc / ir) + '</b><br>' + t('Parametro di Matsuda-Ayabe ', 'Matsuda-Ayabe parameter ') + 'Λ = k⁰/√(DnFv/RT) = ' + fmt(Lam) + ' → ' + (Lam > 15 ? t('reversibile', 'reversible') : Lam > 1e-3 ? t('quasi reversibile', 'quasi-reversible') : t('irreversibile', 'irreversible')) + '<br>' + t('1 mM, D = 10⁻⁵ cm²/s, A = 1 cm², 25 °C. Abbassando k⁰ o alzando v il trasferimento di elettroni non tiene il passo: i picchi si allontanano e si abbassano.', '1 mM, D = 10⁻⁵ cm²/s, A = 1 cm², 25 °C. Lowering k⁰ or raising v, electron transfer cannot keep up: peaks move apart and drop.');
    }
    var ctl = null;
    calcola();
    ctl = F.anima(cv, function (dt) {
      k = Math.min(S.E.length, k + dt * S.E.length / 4);
      var m = Math.max(1, Math.floor(k)), xs = S.E.slice(0, m).map(function (e) { return e * 1000; }), ys = S.I.slice(0, m).map(function (i) { return i * 1000; });
      var o = F.grafico(cv, { serie: [{ x: xs, y: ys, col: '#5eead4', larg: 2.2, etich: 'i', nascondiMirino: k < S.E.length }], xmin: -420, xmax: 420, ymin: Math.min.apply(null, S.I) * 1000 * 1.1, ymax: Math.max.apply(null, S.I) * 1000 * 1.1, invertiX: true, xl: ['E − E⁰ (mV)', 'E − E⁰ (mV)'], yl: ['i (mA)', 'i (mA)'], descr: ['voltammogramma ciclico', 'cyclic voltammogram'] });
      o.q.fillStyle = '#ffd24a'; o.q.beginPath(); o.q.arc(o.X(xs[xs.length - 1]), o.Y(ys[ys.length - 1]), 5, 0, Math.PI * 2); o.q.fill();
      /* profili di concentrazione all'istante corrente */
      var pr = S.profili.filter(function (p) { return p.k <= m - 1; }).pop() || S.profili[0], xx = pr.o.map(function (_, i) { return i * pr.dx * 1e4; });
      F.grafico(cp, { serie: [{ x: xx, y: pr.o.map(function (c) { return c * 1e6; }), col: '#6bcfff', larg: 2, etich: '[O]' }, { x: xx, y: pr.r.map(function (c) { return c * 1e6; }), col: '#ff8a80', larg: 2, etich: '[R]' }], ymin: 0, ymax: 1.05, xl: ['distanza dall’elettrodo (μm)', 'distance from the electrode (μm)'], yl: ['C (mM)', 'C (mM)'], legenda: [{ col: '#6bcfff', etich: 'O' }, { col: '#ff8a80', etich: 'R' }], descr: ['profili di concentrazione', 'concentration profiles'] });
      if (k >= S.E.length) return false;
    }, { ricomincia: function () { k = 0; } });
  }

  /* ═══ 2. analisi con la velocita' ═══════════════════════════════════════ */
  function schedaVelocita(div) {
    var G = griglia(div), st = { lk0: 0, alfa: 0.5, n: 1 }, info = nota(G.pan);
    F.cursore(G.pan, ['log₁₀ k⁰ (cm/s)', 'log₁₀ k⁰ (cm/s)'], -5, 1, 0.1, st.lk0, function (v) { st.lk0 = v; calcola(); }, function (v) { return v.toFixed(1); });
    G.pan.appendChild(info);
    var c1 = F.tela(G.dx, 0.45), c2 = F.tela(G.dx, 0.45);
    function calcola() {
      var vs = [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1], rv = vs.map(function (v) { return Math.sqrt(v); }), ip = [], dE = [];
      vs.forEach(function (v) { var P = picchi(simula({ E0: 0, Ei: 0.4, El: -0.4, v: v, k0: Math.pow(10, st.lk0), alfa: st.alfa, n: st.n, D: 1e-5, C: 1e-6, A: 1, Nt: 2000 })); ip.push(-P.ipc * 1000); dE.push(P.dEp * 1000); });
      var n = vs.length, mx = rv.reduce(function (a, b) { return a + b; }) / n, my = ip.reduce(function (a, b) { return a + b; }) / n, sxy = 0, sxx = 0; rv.forEach(function (x, i) { sxy += (x - mx) * (ip[i] - my); sxx += (x - mx) * (x - mx); }); var pend = sxy / sxx;
      /* D dalla pendenza: i_p/√v = 0,4463 nFAC √(nFD/RT) → D = (pend/(0,4463 nFAC))² RT/(nF) */
      var Dstim = Math.pow(pend / 1000 / (0.4463 * st.n * Fa * 1 * 1e-6), 2) * R * T / (st.n * Fa);
      F.grafico(c1, { punti: rv.map(function (x, i) { return { x: x, y: ip[i], col: '#5eead4', r: 5 }; }), serie: [{ x: [0, 1.05], y: [my - pend * mx, my + pend * (1.05 - mx)], col: '#ffd24a', tratt: true, etich: t('retta', 'line') }], xmin: 0, ymin: 0, xl: ['√v (V/s)^½', '√v (V/s)^½'], yl: ['|i_pc| (mA)', '|i_pc| (mA)'] });
      F.grafico(c2, { punti: vs.map(function (v, i) { return { x: Math.log10(v), y: dE[i], col: '#ff8a80', r: 5 }; }), serie: [{ x: [-2.1, 0.1], y: [59 / st.n, 59 / st.n], col: '#8494a8', tratt: true, etich: '59/n mV' }], xl: ['log₁₀ v', 'log₁₀ v'], yl: ['ΔE_p (mV)', 'ΔE_p (mV)'] });
      info.innerHTML = t('Pendenza di i_p contro √v: ', 'Slope of i_p vs √v: ') + '<b class="bsiFX-num">' + fmt(pend) + ' mA/(V/s)^½</b> → D = <b>' + D_str(Dstim) + '</b> cm²/s (' + t('vero: 1,0·10⁻⁵', 'true: 1.0·10⁻⁵') + ')<br>' + t('ΔE_p da ', 'ΔE_p from ') + fmt(dE[0]) + t(' a ', ' to ') + fmt(dE[n - 1]) + ' mV: ' + (dE[n - 1] - dE[0] < 8 ? t('costante ≈ 59/n: coppia reversibile a tutte le velocità.', 'constant ≈ 59/n: reversible couple at all rates.') : t('cresce con v: trasferimento elettronico lento; dalla crescita (metodo di Nicholson) si ricava k⁰.', 'grows with v: slow electron transfer; from the growth (Nicholson’s method) k⁰ is obtained.')) + '<br>' + t('La linearità di i_p con √v è la prova che la corrente è controllata dalla diffusione; se la specie fosse adsorbita sull’elettrodo i_p crescerebbe con v.', 'Linearity of i_p with √v is the proof that current is diffusion-controlled; if the species were adsorbed on the electrode i_p would grow with v.');
    }
    function D_str(d) { return d.toExponential(2); }
    calcola();
  }

  F.sezione('schivolt', {
    titolo: ['🔋 Voltammetria ciclica', '🔋 Cyclic voltammetry'],
    sotto: ['Una simulazione vera: diffusione alle differenze finite e cinetica di Butler-Volmer all’elettrodo; il voltammogramma che si disegna con i profili di concentrazione, Randles-Ševčík, ΔE_p e la dipendenza dalla velocità di scansione.', 'A real simulation: finite-difference diffusion and Butler-Volmer kinetics at the electrode; the voltammogram drawing itself with the concentration profiles, Randles-Ševčík, ΔE_p and the dependence on scan rate.'],
    schede: [
      { nome: ['🔋 Simulatore', '🔋 Simulator'], costruisci: schedaCV },
      { nome: ['📐 Analisi con v', '📐 Analysis with v'], costruisci: schedaVelocita }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
