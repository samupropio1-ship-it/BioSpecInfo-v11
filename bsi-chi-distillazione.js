/* ═══════════════════════════════════════════════════════════════════════════
   bsi-chi-distillazione.js — 🌡️ distillazione e miscele
   BioSpecInfo · © Samuele Pio Provenzano

   · DIAGRAMMI DI STATO: tensioni di vapore con l'equazione di Antoine,
     legge di Raoult (benzene-toluene, quasi ideale) e Raoult modificata con
     i coefficienti di attivita' di van Laar (etanolo-acqua, con
     l'azeotropo di massimo che impedisce di superare il 95 % in massa per
     distillazione); curve T-x-y a 1 atm calcolate per punti di bolla;
   · McCABE-THIELE: la colonna di rettifica disegnata a gradini fra la curva
     di equilibrio e le rette di lavoro; il numero di piatti teorici, il
     riflusso minimo (Underwood) e i piatti minimi a riflusso totale
     (Fenske); con etanolo-acqua i gradini si fermano all'azeotropo;
   · DISTILLAZIONE SEMPLICE: l'equazione di Rayleigh, come cambiano la
     composizione del residuo e del distillato man mano che si distilla.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt;
  function griglia(div) { var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); G.appendChild(pan); G.appendChild(dx); div.appendChild(G); return { pan: pan, dx: dx }; }
  function nota(pan) { var n = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(n); return n; }

  /* Antoine: log₁₀ P(mmHg) = A − B/(C + T(°C)) */
  var ANTOINE = { benzene: [6.90565, 1211.033, 220.790], toluene: [6.95464, 1344.8, 219.482], etanolo: [8.20417, 1642.89, 230.300], acqua: [8.07131, 1730.63, 233.426], metanolo: [8.08097, 1582.271, 239.726] };
  function Psat(sost, T) { var a = ANTOINE[sost]; return Math.pow(10, a[0] - a[1] / (a[2] + T)); }
  function Teb(sost, P) { var a = ANTOINE[sost]; return a[1] / (a[0] - Math.log10(P || 760)) - a[2]; }
  /* sistemi binari: il primo componente e' il piu' volatile; van Laar (A12, A21) o ideale */
  var SISTEMI = {
    bt: { nome: ['benzene – toluene (ideale)', 'benzene – toluene (ideal)'], a: 'benzene', b: 'toluene', vl: null },
    ea: { nome: ['etanolo – acqua (azeotropo)', 'ethanol – water (azeotrope)'], a: 'etanolo', b: 'acqua', vl: [1.6798, 0.9227] },
    ma: { nome: ['metanolo – acqua', 'methanol – water'], a: 'metanolo', b: 'acqua', vl: [0.58, 0.46] }
  };
  function gamma(S, x) { if (!S.vl) return [1, 1]; var A = S.vl[0], B = S.vl[1], x2 = 1 - x; if (x <= 0) return [Math.exp(A), 1]; if (x2 <= 0) return [1, Math.exp(B)]; var d = A * x + B * x2; return [Math.exp(A * Math.pow(B * x2 / d, 2)), Math.exp(B * Math.pow(A * x / d, 2))]; }
  /* punto di bolla a P: T tale che x γ₁ P₁ + (1−x) γ₂ P₂ = P; poi y = x γ₁ P₁ / P */
  function bolla(S, x, P) {
    P = P || 760; var g = gamma(S, x), lo = 0, hi = 150;
    for (var i = 0; i < 80; i++) { var T = (lo + hi) / 2, s = x * g[0] * Psat(S.a, T) + (1 - x) * g[1] * Psat(S.b, T); if (s > P) hi = T; else lo = T; }
    var Tb = (lo + hi) / 2; return { T: Tb, y: x * g[0] * Psat(S.a, Tb) / P };
  }
  /* azeotropo: dove y = x all'interno (0, 1) */
  function azeotropo(S) {
    if (!S.vl) return null; var prec = null;
    for (var i = 1; i < 999; i++) { var x = i / 1000, d = bolla(S, x).y - x; if (prec && prec.d * d < 0) { var lo = prec.x, hi = x; for (var k = 0; k < 50; k++) { var m = (lo + hi) / 2; if ((bolla(S, m).y - m) * prec.d > 0) lo = m; else hi = m; } var xa = (lo + hi) / 2; return { x: xa, T: bolla(S, xa).T }; } prec = { x: x, d: d }; }
    return null;
  }
  /* curva di equilibrio y(x) e la sua inversa x(y) (bisezione) */
  function yEq(S, x) { return bolla(S, Math.max(0, Math.min(1, x))).y; }
  function xEq(S, y, xmax) { var lo = 0, hi = xmax || 1; for (var i = 0; i < 60; i++) { var m = (lo + hi) / 2; if (yEq(S, m) < y) lo = m; else hi = m; } return (lo + hi) / 2; }
  /* McCabe-Thiele con alimentazione liquida satura (q = 1): gradini dalla testa */
  function mccabe(S, xD, xB, zF, R) {
    var az = azeotropo(S), xmax = az ? az.x : 1, rett = function (x) { return R / (R + 1) * x + xD / (R + 1); }, yF = rett(zF), esau = function (x) { return xB + (yF - xB) / (zF - xB) * (x - xB); };
    var gradini = [], x = xD, y = xD, n = 0;
    while (n < 80) {
      var xn = xEq(S, y, xmax); gradini.push([x, y, xn, y]); n++;
      if (xn <= xB) break;
      if (Math.abs(xn - x) < 1e-6) { return { gradini: gradini, piatti: Infinity, pinch: true, az: az }; }
      var yn = xn >= zF ? rett(xn) : esau(xn); gradini.push([xn, y, xn, yn]); x = xn; y = yn;
    }
    return { gradini: gradini, piatti: n, az: az, alimentazione: gradini.filter(function (g, i) { return i % 2 === 0; }).findIndex(function (g) { return g[2] < zF; }) + 1 };
  }
  /* volatilita' relativa media e riflusso minimo (Underwood, q = 1), Fenske */
  function alfaMedia(S) { var a1 = Psat(S.a, Teb(S.a)) / Psat(S.b, Teb(S.a)), a2 = Psat(S.a, Teb(S.b)) / Psat(S.b, Teb(S.b)); return Math.sqrt(a1 * a2); }
  function riflussoMinimo(alfa, xD, zF) { return (xD / zF - alfa * (1 - xD) / (1 - zF)) / (alfa - 1); }
  function fenske(alfa, xD, xB) { return Math.log(xD / (1 - xD) * (1 - xB) / xB) / Math.log(alfa); }
  /* Rayleigh: frazione rimasta W/F in funzione della composizione del residuo (integrazione numerica) */
  function rayleigh(S, xF, xW) { var n = 400, s = 0; for (var i = 0; i < n; i++) { var x = xW + (xF - xW) * (i + 0.5) / n; s += 1 / (yEq(S, x) - x) * (xF - xW) / n; } return Math.exp(-s); }
  F.calcolo.distillazione = { ANTOINE: ANTOINE, Psat: Psat, Teb: Teb, SISTEMI: SISTEMI, gamma: gamma, bolla: bolla, azeotropo: azeotropo, yEq: yEq, xEq: xEq, mccabe: mccabe, alfaMedia: alfaMedia, riflussoMinimo: riflussoMinimo, fenske: fenske, rayleigh: rayleigh };

  /* ═══ 1. diagrammi T-x-y ════════════════════════════════════════════════ */
  function schedaDiagrammi(div) {
    var G = griglia(div), st = { s: 'ea' }, info = nota(G.pan);
    F.scelta(G.pan, ['Miscela', 'Mixture'], Object.keys(SISTEMI).map(function (k) { return [k, F.tt(SISTEMI[k].nome)]; }), st.s, function (v) { st.s = v; disegna(); });
    G.pan.appendChild(info);
    var ct = F.tela(G.dx, 0.55), cy = F.tela(G.dx, 0.5);
    function disegna() {
      var S = SISTEMI[st.s], xs = [], Tl = [], ys = [], yy = [];
      for (var i = 0; i <= 100; i++) { var x = i / 100, b = bolla(S, x); xs.push(x); Tl.push(b.T); ys.push(b.y); }
      F.grafico(ct, { serie: [{ x: xs, y: Tl, col: '#6bcfff', larg: 2.2, etich: ['liquido (bolla)', 'liquid (bubble)'] }, { x: ys, y: Tl, col: '#ff8a80', larg: 2.2, etich: ['vapore (rugiada)', 'vapour (dew)'] }], xl: ['x, y del più volatile', 'x, y of the more volatile'], yl: ['T (°C) a 1 atm', 'T (°C) at 1 atm'], legenda: [{ col: '#6bcfff', etich: ['curva di bolla', 'bubble curve'] }, { col: '#ff8a80', etich: ['curva di rugiada', 'dew curve'] }] });
      F.grafico(cy, { serie: [{ x: xs, y: ys, col: '#5eead4', larg: 2.2, etich: 'y(x)' }, { x: [0, 1], y: [0, 1], col: '#8494a8', tratt: true, etich: 'y = x' }], xmin: 0, xmax: 1, ymin: 0, ymax: 1, xl: ['x', 'x'], yl: ['y', 'y'], descr: ['curva di equilibrio liquido-vapore', 'vapour-liquid equilibrium curve'] });
      var az = azeotropo(S);
      info.innerHTML = t('Ebollizione dei puri a 1 atm (Antoine): ', 'Pure boiling points at 1 atm (Antoine): ') + S.a + ' <b>' + fmt(Teb(S.a)) + ' °C</b>, ' + S.b + ' <b>' + fmt(Teb(S.b)) + ' °C</b><br>' + (az ? t('Azeotropo a x = ', 'Azeotrope at x = ') + '<b class="bsiFX-num">' + fmt(az.x) + '</b> (' + fmt(az.x * 46.07 / (az.x * 46.07 + (1 - az.x) * 18.02) * 100) + t(' % in massa', ' % by mass') + '), T = <b>' + fmt(az.T) + ' °C</b>: ' + t('liquido e vapore hanno la stessa composizione e la distillazione non separa oltre. L’alcol «assoluto» si ottiene con altri metodi (setacci molecolari, distillazione azeotropica con un terzo componente).', 'liquid and vapour have the same composition and distillation cannot separate further. «Absolute» alcohol is obtained by other means (molecular sieves, azeotropic distillation with a third component).') + (st.s === 'ea' ? '<br>' + t('Valore misurato: x = 0,894 (95,6 % in massa) a 78,15 °C. Il modello di van Laar a due parametri lo sposta di qualche centesimo: è un modello, non la misura.', 'Measured value: x = 0.894 (95.6 % by mass) at 78.15 °C. The two-parameter van Laar model shifts it by a few hundredths: it is a model, not the measurement.') : '') : t('Nessun azeotropo: la distillazione frazionata può separare i due componenti fino alla purezza voluta. Volatilità relativa media α = ', 'No azeotrope: fractional distillation can separate the two components to any purity. Mean relative volatility α = ') + '<b>' + fmt(alfaMedia(S)) + '</b>.') + '<br>' + (S.vl ? t('Coefficienti di attività di van Laar (A₁₂ = ', 'van Laar activity coefficients (A₁₂ = ') + S.vl[0] + ', A₂₁ = ' + S.vl[1] + t('): la miscela devia positivamente da Raoult.', '): the mixture deviates positively from Raoult.') : t('Miscela quasi ideale: legge di Raoult con γ = 1.', 'Nearly ideal mixture: Raoult’s law with γ = 1.'));
    }
    disegna(); F.alRidimensiona(disegna);
  }

  /* ═══ 2. McCabe-Thiele ══════════════════════════════════════════════════ */
  function schedaMcCabe(div) {
    var G = griglia(div), st = { s: 'bt', xD: 0.95, xB: 0.05, zF: 0.5, R: 2 }, info = nota(G.pan), M = mccabe(SISTEMI.bt, 0.95, 0.05, 0.5, 2), n = 0, curva = {};
    F.scelta(G.pan, ['Miscela', 'Mixture'], Object.keys(SISTEMI).map(function (k) { return [k, F.tt(SISTEMI[k].nome)]; }), st.s, function (v) { st.s = v; calcola(); });
    F.cursore(G.pan, ['x_D (testa)', 'x_D (top)'], 0.6, 0.995, 0.005, st.xD, function (v) { st.xD = v; calcola(); }, function (v) { return v.toFixed(3); });
    F.cursore(G.pan, ['x_B (coda)', 'x_B (bottom)'], 0.005, 0.3, 0.005, st.xB, function (v) { st.xB = v; calcola(); }, function (v) { return v.toFixed(3); });
    F.cursore(G.pan, ['z_F (alimentazione)', 'z_F (feed)'], 0.1, 0.9, 0.01, st.zF, function (v) { st.zF = v; calcola(); }, function (v) { return v.toFixed(2); });
    F.cursore(G.pan, ['rapporto di riflusso R', 'reflux ratio R'], 0.2, 10, 0.1, st.R, function (v) { st.R = v; calcola(); }, function (v) { return v.toFixed(1); });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.95);
    function calcola() {
      var S = SISTEMI[st.s]; M = mccabe(S, st.xD, st.xB, st.zF, st.R); n = 0; ctl.sveglia();
      var a = alfaMedia(S), Rmin = riflussoMinimo(a, st.xD, st.zF), Nmin = fenske(a, st.xD, st.xB);
      info.innerHTML = (M.pinch ? '⚠ <b>' + t('Separazione impossibile', 'Separation impossible') + '</b>: ' + (M.az && st.xD > M.az.x ? t('x_D supera l’azeotropo (', 'x_D is beyond the azeotrope (') + fmt(M.az.x) + t('): nessuna colonna ci arriva.', '): no column gets there.') : t('il riflusso è sotto il minimo: i gradini si bloccano (punto di pinch).', 'reflux is below the minimum: the steps stall (pinch point).')) : t('Piatti teorici: ', 'Theoretical stages: ') + '<b class="bsiFX-num">' + M.piatti + '</b> (' + t('compreso il ribollitore', 'including the reboiler') + ')') + '<br>' + (S.vl ? '' : t('Volatilità relativa media ', 'Mean relative volatility ') + 'α = ' + fmt(a) + ' · ' + t('riflusso minimo (Underwood) ', 'minimum reflux (Underwood) ') + 'R_min = <b>' + fmt(Rmin) + '</b> · ' + t('piatti minimi a riflusso totale (Fenske) ', 'minimum stages at total reflux (Fenske) ') + 'N_min = <b>' + fmt(Nmin) + '</b><br>') + t('Più riflusso = meno piatti ma più energia al ribollitore: di solito si lavora a R ≈ 1,2–1,5 R_min.', 'More reflux = fewer stages but more reboiler energy: one usually works at R ≈ 1.2–1.5 R_min.');
    }
    var ctl = F.anima(cv, function (dt) {
      n = Math.min(M.gradini.length, n + dt * 6);
      /* la curva di equilibrio si calcola una volta per miscela */
      var S = SISTEMI[st.s]; if (!curva[st.s]) curva[st.s] = Array.from({ length: 101 }, function (_, i) { return yEq(S, i / 100); });
      var o = F.grafico(cv, { serie: [{ x: Array.from({ length: 101 }, function (_, i) { return i / 100; }), y: curva[st.s], col: '#5eead4', larg: 2, nascondiMirino: true }, { x: [0, 1], y: [0, 1], col: '#8494a8', tratt: true, nascondiMirino: true }], xmin: 0, xmax: 1, ymin: 0, ymax: 1, xl: ['x', 'x'], yl: ['y', 'y'], descr: ['diagramma di McCabe-Thiele', 'McCabe-Thiele diagram'] }), q = o.q;
      var yF = st.R / (st.R + 1) * st.zF + st.xD / (st.R + 1);
      q.strokeStyle = '#ffd24a'; q.beginPath(); q.moveTo(o.X(st.xD), o.Y(st.xD)); q.lineTo(o.X(st.zF), o.Y(yF)); q.stroke();
      q.strokeStyle = '#ff8a80'; q.beginPath(); q.moveTo(o.X(st.zF), o.Y(yF)); q.lineTo(o.X(st.xB), o.Y(st.xB)); q.stroke();
      q.strokeStyle = 'rgba(201,211,223,.6)'; q.setLineDash([3, 3]); q.beginPath(); q.moveTo(o.X(st.zF), o.Y(st.zF)); q.lineTo(o.X(st.zF), o.Y(yF)); q.stroke(); q.setLineDash([]);
      q.strokeStyle = '#e6fffb'; q.lineWidth = 1.6; q.beginPath();
      for (var i = 0; i < Math.floor(n); i++) { var g = M.gradini[i]; q.moveTo(o.X(g[0]), o.Y(g[1])); q.lineTo(o.X(g[2]), o.Y(g[3])); }
      q.stroke(); q.lineWidth = 1;
      if (M.az) { q.fillStyle = '#ff8a80'; q.beginPath(); q.arc(o.X(M.az.x), o.Y(M.az.x), 5, 0, Math.PI * 2); q.fill(); }
      if (n >= M.gradini.length) return false;
    }, { ricomincia: function () { n = 0; } });
    calcola();
  }

  /* ═══ 3. distillazione semplice (Rayleigh) ══════════════════════════════ */
  function schedaRayleigh(div) {
    var G = griglia(div), st = { s: 'bt', xF: 0.5 }, info = nota(G.pan);
    F.scelta(G.pan, ['Miscela', 'Mixture'], Object.keys(SISTEMI).map(function (k) { return [k, F.tt(SISTEMI[k].nome)]; }), st.s, function (v) { st.s = v; disegna(); });
    F.cursore(G.pan, ['composizione iniziale x_F', 'initial composition x_F'], 0.1, 0.9, 0.01, st.xF, function (v) { st.xF = v; disegna(); }, function (v) { return v.toFixed(2); });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.6);
    function disegna() {
      var S = SISTEMI[st.s], fr = [], xw = [], xd = [];
      for (var i = 0; i <= 120; i++) { var x = st.xF * (1 - i / 121), W = rayleigh(S, st.xF, x), dist = 1 - W; if (dist > 0.97) break; fr.push(dist * 100); xw.push(x); xd.push(dist > 1e-6 ? (st.xF - W * x) / dist : yEq(S, st.xF)); }
      F.grafico(cv, { serie: [{ x: fr, y: xw, col: '#ff8a80', larg: 2.2, etich: ['residuo nel pallone', 'residue in the flask'] }, { x: fr, y: xd, col: '#5eead4', larg: 2.2, etich: ['distillato raccolto (media)', 'collected distillate (average)'] }], xl: ['frazione distillata (%)', 'fraction distilled (%)'], yl: ['frazione molare del più volatile', 'mole fraction of the more volatile'], ymin: 0, ymax: 1, legenda: [{ col: '#ff8a80', etich: ['residuo', 'residue'] }, { col: '#5eead4', etich: ['distillato', 'distillate'] }] });
      var k = fr.findIndex(function (v) { return v >= 50; });
      info.innerHTML = 'ln(W/F) = −∫ dx/(y − x) ' + t('(equazione di Rayleigh)', '(Rayleigh equation)') + '<br>' + t('Distillando metà della miscela il distillato contiene ', 'Distilling half of the mixture the distillate contains ') + '<b class="bsiFX-num">' + fmt((k >= 0 ? xd[k] : xd[xd.length - 1]) * 100) + ' %</b> ' + t('del più volatile, il residuo ', 'of the more volatile, the residue ') + fmt((k >= 0 ? xw[k] : xw[xw.length - 1]) * 100) + ' %.<br>' + t('Una sola distillazione separa poco: una colonna equivale a molte distillazioni in serie (i piatti di McCabe-Thiele).', 'A single distillation separates little: a column is equivalent to many distillations in series (the McCabe-Thiele stages).');
    }
    disegna(); F.alRidimensiona(disegna);
  }

  F.sezione('schidist', {
    titolo: ['🌡️ Distillazione e miscele', '🌡️ Distillation and mixtures'],
    sotto: ['Le curve T-x-y con Antoine e Raoult, l’azeotropo etanolo-acqua con van Laar, la colonna di McCabe-Thiele con i piatti teorici, Fenske e Underwood, la distillazione semplice di Rayleigh.', 'T-x-y curves with Antoine and Raoult, the ethanol-water azeotrope with van Laar, the McCabe-Thiele column with theoretical stages, Fenske and Underwood, Rayleigh simple distillation.'],
    schede: [
      { nome: ['📈 Diagrammi T-x-y', '📈 T-x-y diagrams'], costruisci: schedaDiagrammi },
      { nome: ['🏗️ McCabe-Thiele', '🏗️ McCabe-Thiele'], costruisci: schedaMcCabe },
      { nome: ['⚗️ Distillazione semplice', '⚗️ Simple distillation'], costruisci: schedaRayleigh }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
