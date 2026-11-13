/* ═══════════════════════════════════════════════════════════════════════════
   bsi-farm-quantitativa.js — 💉 Farmacologia quantitativa (fase 8, §7.6)
   BioSpecInfo · © Samuele Pio Provenzano

   PERCHE' ESISTE (v254)
   La sezione 📐 Farmacocinetica dell'app tratta un compartimento. Il progetto
   chiede anche due compartimenti, dosi ripetute e infusione, la
   farmacodinamica e le interazioni con il loro meccanismo. Tutto da formule
   chiuse o integrate, verificate dal banco.

   LE FORMULE (Rowland e Tozer, Clinical Pharmacokinetics and
   Pharmacodynamics, 5ª ed., 2019; Gabrielsson e Weiner, 5ª ed., 2016)
   · Due compartimenti, bolo endovena: C(t) = A e^(−αt) + B e^(−βt),
       α, β = ½[(k10 + k12 + k21) ± √((k10 + k12 + k21)² − 4 k21 k10)],
       A = (D/V1)(α − k21)/(α − β),  B = (D/V1)(k21 − β)/(α − β);
     CL = k10·V1, Vss = V1(1 + k12/k21), AUC = D/CL, t½β = ln2/β.
   · Dosi ripetute (un compartimento, assorbimento del primo ordine o bolo):
     sovrapposizione delle dosi; accumulo R = 1/(1 − e^(−kτ));
     Css,media = F·D/(CL·τ); 90 % dello stato stazionario in 3,3 t½;
     dose di carico = Css·V/F.
   · Farmacodinamica: E = E0 + Emax·C^n/(EC50^n + C^n) (Hill); indice
     terapeutico TD50/ED50; margine di sicurezza TD1/ED99 con risposte
     quantali log-normali.
   · Interazioni per inibizione competitiva reversibile (Rowland e Matin
     1973): AUC_con/AUC_senza = 1 / ( fm/(1 + [I]/Ki) + (1 − fm) ),
     fm = frazione eliminata dall'enzima inibito. Classi FDA (guida 2020):
     debole 1,25–2, moderato 2–5, forte ≥ 5.

   PRUDENZA CLINICA
   Esempi didattici con parametri tipici, non schemi di dosaggio: non
   sostituisce il medico, il farmacista o la scheda tecnica.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, LN2 = Math.LN2;
  function num(x, d) { return x.toFixed(d == null ? 1 : d).replace('.', ',').replace('-', '−'); }
  function griglia(div) { var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div', { style: 'min-width:0' }); G.appendChild(pan); G.appendChild(dx); div.appendChild(G); return { pan: pan, dx: dx }; }
  function prudenza(div) { div.appendChild(F.el('div', { 'class': 'bsiFX-nota', style: 'border-left:3px solid #ffd24a;margin-top:8px', html: '⚕️ <b>' + t('Esempio didattico', 'Educational example') + '</b>: ' + t('parametri tipici, non uno schema di dosaggio. Non sostituisce il medico, il farmacista o la scheda tecnica.', 'typical parameters, not a dosing scheme. It does not replace a doctor, a pharmacist or the label.') })); }

  /* ═══ 1. IL CALCOLO ════════════════════════════════════════════════════ */
  function dueCompartimenti(p) {
    var s = p.k10 + p.k12 + p.k21, d = Math.sqrt(s * s - 4 * p.k21 * p.k10), al = (s + d) / 2, be = (s - d) / 2, C0 = p.D / p.V1;
    return { alfa: al, beta: be, A: C0 * (al - p.k21) / (al - be), B: C0 * (p.k21 - be) / (al - be), CL: p.k10 * p.V1, Vss: p.V1 * (1 + p.k12 / p.k21), AUC: p.D / (p.k10 * p.V1), tBeta: LN2 / be, tAlfa: LN2 / al,
      C: function (tt) { return this.A * Math.exp(-al * tt) + this.B * Math.exp(-be * tt); } };
  }
  /** Integrazione numerica del modello a due compartimenti (per controllo e per l'infusione): restituisce C1(t). */
  function dueCompartimentiNumerico(p, tmax, infusione) {
    var x1 = infusione ? 0 : p.D, x2 = 0, dt = 0.002, out = [];
    for (var k = 0; k * dt <= tmax + 1e-9; k++) { if (k % 50 === 0) out.push([k * dt, x1 / p.V1]); var R = infusione && k * dt < infusione.durata ? infusione.velocita : 0, d1 = R - (p.k10 + p.k12) * x1 + p.k21 * x2, d2 = p.k12 * x1 - p.k21 * x2; x1 += d1 * dt; x2 += d2 * dt; }
    return out;
  }
  /** Dosi ripetute, un compartimento: orale (ka) o bolo endovena (ka = Infinity). Concentrazione per sovrapposizione. */
  function dosiRipetute(p, tt) {
    var k = p.CL / p.V, c = 0;
    for (var n = 0; n * p.tau <= tt && n < p.ndosi; n++) {
      var s = tt - n * p.tau;
      if (!isFinite(p.ka)) c += p.F * p.D / p.V * Math.exp(-k * s);
      else c += p.F * p.D * p.ka / (p.V * (p.ka - k)) * (Math.exp(-k * s) - Math.exp(-p.ka * s));
    }
    return c;
  }
  function indiciRipetute(p) { var k = p.CL / p.V; return { k: k, t12: LN2 / k, R: 1 / (1 - Math.exp(-k * p.tau)), Cmedia: p.F * p.D / (p.CL * p.tau), t90: 3.32 * LN2 / k, carico: function (Cbersaglio) { return Cbersaglio * p.V / p.F; } }; }
  function hill(C, o) { return o.E0 + o.Emax * Math.pow(C, o.n) / (Math.pow(o.EC50, o.n) + Math.pow(C, o.n)); }
  /** Risposta quantale log-normale: frazione che risponde alla dose d (mediana d50, pendenza σ in log10). */
  function quantale(d, d50, sigma) { return 0.5 * (1 + erf(Math.log10(d / d50) / (sigma * Math.SQRT2))); }
  function erf(x) { var s = x < 0 ? -1 : 1; x = Math.abs(x); var a = 1 / (1 + 0.3275911 * x), y = 1 - (((((1.061405429 * a - 1.453152027) * a) + 1.421413741) * a - 0.284496736) * a + 0.254829592) * a * Math.exp(-x * x); return s * y; }
  /** Dose a cui risponde la frazione f (inversa della quantale). */
  function doseQuantile(f, d50, sigma) { var lo = -6, hi = 6; for (var i = 0; i < 80; i++) { var m = (lo + hi) / 2; if (0.5 * (1 + erf(m / Math.SQRT2)) < f) lo = m; else hi = m; } return d50 * Math.pow(10, sigma * (lo + hi) / 2); }
  function rapportoAUC(fm, IKi) { return 1 / (fm / (1 + IKi) + (1 - fm)); }
  function classeFDA(r) { return r >= 5 ? t('forte', 'strong') : r >= 2 ? t('moderato', 'moderate') : r >= 1.25 ? t('debole', 'weak') : t('trascurabile', 'negligible'); }

  F.calcolo.farmquant = { dueCompartimenti: dueCompartimenti, dueCompartimentiNumerico: dueCompartimentiNumerico, dosiRipetute: dosiRipetute, indiciRipetute: indiciRipetute, hill: hill, quantale: quantale, doseQuantile: doseQuantile, erf: erf, rapportoAUC: rapportoAUC, classeFDA: classeFDA };

  /* ═══ 2. LE SCHEDE ═════════════════════════════════════════════════════ */
  function schedaDue(div) {
    var g = griglia(div), p = { D: 500, V1: 10, k10: 0.2, k12: 0.5, k21: 0.3 }, scala = 'log';
    F.cursore(g.pan, ['Dose endovena D (mg)', 'IV dose D (mg)'], 50, 2000, 50, p.D, function (v) { p.D = v; disegna(); }, function (v) { return v + ' mg'; });
    F.cursore(g.pan, ['Volume centrale V1 (L)', 'Central volume V1 (L)'], 2, 40, 1, p.V1, function (v) { p.V1 = v; disegna(); }, function (v) { return v + ' L'; });
    F.cursore(g.pan, ['Eliminazione k10 (1/h)', 'Elimination k10 (1/h)'], 0.02, 1, 0.01, p.k10, function (v) { p.k10 = v; disegna(); }, function (v) { return num(v, 2); });
    F.cursore(g.pan, ['Verso i tessuti k12 (1/h)', 'To tissues k12 (1/h)'], 0, 2, 0.05, p.k12, function (v) { p.k12 = v; disegna(); }, function (v) { return num(v, 2); });
    F.cursore(g.pan, ['Ritorno k21 (1/h)', 'Return k21 (1/h)'], 0.05, 2, 0.05, p.k21, function (v) { p.k21 = v; disegna(); }, function (v) { return num(v, 2); });
    F.scelta(g.pan, ['Asse delle concentrazioni', 'Concentration axis'], [['log', ['logaritmico (le due fasi diventano rette)', 'logarithmic (both phases become lines)']], ['lin', ['lineare', 'linear']]], 'log', function (v) { scala = v; disegna(); });
    var info = F.el('div', { 'class': 'bsiFX-nota' }); g.pan.appendChild(info); prudenza(g.pan);
    var c = F.tela(g.dx, 0.6);
    function disegna() {
      var r = dueCompartimenti(p), tmax = Math.min(96, Math.max(12, 5 * r.tBeta)), xs = [], ys = [], yb = [], ya = [];
      for (var i = 0; i <= 300; i++) { var tt = tmax * i / 300; xs.push(tt); var cc = r.C(tt); ys.push(scala === 'log' ? Math.log10(Math.max(1e-6, cc)) : cc); yb.push(scala === 'log' ? Math.log10(Math.max(1e-6, r.B * Math.exp(-r.beta * tt))) : r.B * Math.exp(-r.beta * tt)); }
      F.grafico(c, { serie: [{ x: xs, y: yb, col: '#9d8cff', tratt: true }, { x: xs, y: ys, col: '#5eead4', larg: 2.5 }], xl: ['tempo (h)', 'time (h)'], yl: [scala === 'log' ? 'log₁₀ C (mg/L)' : 'C (mg/L)', scala === 'log' ? 'log₁₀ C (mg/L)' : 'C (mg/L)'], ymin: scala === 'log' ? Math.floor(Math.log10(Math.max(1e-4, r.C(tmax)))) : 0,
        legenda: [{ col: '#5eead4', etich: ['concentrazione nel plasma', 'plasma concentration'] }, { col: '#9d8cff', etich: ['fase di eliminazione B·e^(−βt) estrapolata', 'elimination phase B·e^(−βt) extrapolated'] }] });
      info.innerHTML = '<div class="bsiFX-eq">C(t) = A·e^(−αt) + B·e^(−βt)</div>' +
        'A = <b class="bsiFX-num">' + num(r.A, 2) + '</b>, B = <b class="bsiFX-num">' + num(r.B, 2) + ' mg/L</b>; α = <b class="bsiFX-num">' + num(r.alfa, 3) + '</b>, β = <b class="bsiFX-num">' + num(r.beta, 4) + ' h⁻¹</b><br>' +
        t('Emivita di distribuzione ', 'Distribution half-life ') + '<b class="bsiFX-num">' + num(r.tAlfa, 2) + ' h</b>, ' + t('di eliminazione ', 'elimination ') + '<b class="bsiFX-num">' + num(r.tBeta, 1) + ' h</b><br>' +
        'CL = k10·V1 = <b class="bsiFX-num">' + num(r.CL, 2) + ' L/h</b>, Vss = <b class="bsiFX-num">' + num(r.Vss, 1) + ' L</b>, AUC = D/CL = <b class="bsiFX-num">' + num(r.AUC, 0) + ' mg·h/L</b>' +
        '<br><small>' + t('La prima discesa rapida non è eliminazione: è il farmaco che passa nei tessuti. Per questo l\'emivita «vera» per le dosi è quella della fase β.', 'The first fast fall is not elimination: it is the drug moving into the tissues. That is why the half-life that matters for dosing is the β phase one.') + '</small>';
    }
    disegna(); F.alRidimensiona(disegna);
  }

  function schedaRipetute(div) {
    var g = griglia(div), p = { D: 500, tau: 12, V: 40, CL: 4, ka: 1.2, F: 0.8, ndosi: 20 }, fin = [8, 20], carico = false;
    F.cursore(g.pan, ['Dose (mg)', 'Dose (mg)'], 50, 1500, 50, p.D, function (v) { p.D = v; disegna(); }, function (v) { return v + ' mg'; });
    F.cursore(g.pan, ['Intervallo τ (h)', 'Interval τ (h)'], 4, 48, 1, p.tau, function (v) { p.tau = v; disegna(); }, function (v) { return v + ' h'; });
    F.cursore(g.pan, ['Clearance CL (L/h)', 'Clearance CL (L/h)'], 0.5, 15, 0.5, p.CL, function (v) { p.CL = v; disegna(); }, function (v) { return num(v, 1) + ' L/h'; });
    F.cursore(g.pan, ['Volume V (L)', 'Volume V (L)'], 5, 200, 5, p.V, function (v) { p.V = v; disegna(); }, function (v) { return v + ' L'; });
    F.scelta(g.pan, ['Via', 'Route'], [['os', ['orale (ka = 1,2 h⁻¹, F = 0,8)', 'oral (ka = 1.2 h⁻¹, F = 0.8)']], ['ev', ['bolo endovena (F = 1)', 'IV bolus (F = 1)']]], 'os', function (v) { if (v === 'ev') { p.ka = Infinity; p.F = 1; } else { p.ka = 1.2; p.F = 0.8; } disegna(); });
    var lab = F.el('label', { style: 'display:flex;align-items:center;gap:10px;min-height:36px;width:100%' }), cb = F.el('input', { type: 'checkbox', style: 'width:20px;height:20px;margin:0' });
    cb.addEventListener('change', function () { carico = cb.checked; disegna(); }); lab.appendChild(cb); lab.appendChild(F.el('span', { testo: t('Dose di carico all\'inizio', 'Loading dose at the start') })); g.pan.appendChild(lab);
    var info = F.el('div', { 'class': 'bsiFX-nota' }); g.pan.appendChild(info); prudenza(g.pan);
    var c = F.tela(g.dx, 0.6);
    function disegna() {
      var I = indiciRipetute(p), Cb = (fin[0] + fin[1]) / 2, tmax = Math.max(p.tau * 6, Math.min(240, I.t90 * 1.6)), xs = [], ys = [], DC = carico ? I.carico(I.Cmedia) : 0;
      for (var i = 0; i <= 600; i++) { var tt = tmax * i / 600; xs.push(tt); var cc = dosiRipetute(p, tt); if (carico) { var pc = { D: DC - p.D, tau: 1e9, V: p.V, CL: p.CL, ka: p.ka, F: p.F, ndosi: 1 }; cc += Math.max(0, dosiRipetute(pc, tt)); } ys.push(cc); }
      F.grafico(c, { serie: [{ x: [0, tmax], y: [fin[1], fin[1]], col: '#ff8fab', tratt: true }, { x: [0, tmax], y: [fin[0], fin[0]], col: '#9fb3c8', tratt: true }, { x: [0, tmax], y: [I.Cmedia, I.Cmedia], col: '#9d8cff', tratt: true }, { x: xs, y: ys, col: '#5eead4', larg: 2.2 }], xl: ['tempo (h)', 'time (h)'], yl: ['C (mg/L)', 'C (mg/L)'], ymin: 0,
        legenda: [{ col: '#5eead4', etich: ['concentrazione', 'concentration'] }, { col: '#9d8cff', etich: ['Css media = F·D/(CL·τ)', 'mean Css = F·D/(CL·τ)'] }, { col: '#9fb3c8', etich: ['finestra terapeutica di esempio (8–20 mg/L)', 'example therapeutic window (8–20 mg/L)'] }, { col: '#ff8fab', etich: ['soglia di tossicità', 'toxicity threshold'] }] });
      info.innerHTML = '<div class="bsiFX-eq">Css,media = F·D / (CL·τ),   R = 1 / (1 − e^(−kτ))</div>' +
        t('Emivita ', 'Half-life ') + '<b class="bsiFX-num">' + num(I.t12, 1) + ' h</b>, ' + t('accumulo ', 'accumulation ') + '<b class="bsiFX-num">R = ' + num(I.R, 2) + '</b><br>' +
        'Css ' + t('media ', 'mean ') + '<b class="bsiFX-num">' + num(I.Cmedia, 1) + ' mg/L</b>; ' + t('90 % dello stato stazionario dopo ', '90 % of steady state after ') + '<b class="bsiFX-num">' + num(I.t90, 0) + ' h</b> (3,3 t½)<br>' +
        t('Dose di carico per partire già alla Css: ', 'Loading dose to start at Css: ') + '<b class="bsiFX-num">' + num(I.carico(I.Cmedia), 0) + ' mg</b> (Css·V/F)' +
        '<br><small>' + t('Il tempo per arrivare allo stato stazionario dipende solo dall\'emivita, non dalla dose: la dose decide il livello. La dose di carico accorcia l\'attesa.', 'The time to reach steady state depends only on the half-life, not on the dose: the dose decides the level. The loading dose shortens the wait.') + '</small>';
    }
    disegna(); F.alRidimensiona(disegna);
  }

  function schedaPD(div) {
    var g = griglia(div), o = { E0: 0, Emax: 100, EC50: 10, n: 1 }, q = { ed50: 10, td50: 100, sigma: 0.25 };
    F.cursore(g.pan, ['EC50 (mg/L)', 'EC50 (mg/L)'], 1, 50, 1, o.EC50, function (v) { o.EC50 = v; disegna(); }, function (v) { return v; });
    F.cursore(g.pan, ['Coefficiente di Hill n', 'Hill coefficient n'], 0.5, 4, 0.1, o.n, function (v) { o.n = v; disegna(); }, function (v) { return num(v, 1); });
    F.cursore(g.pan, ['Dose tossica mediana TD50 (mg/kg)', 'Median toxic dose TD50 (mg/kg)'], 15, 400, 5, q.td50, function (v) { q.td50 = v; disegna(); }, function (v) { return v; });
    F.cursore(g.pan, ['Variabilità fra individui σ (log₁₀)', 'Between-subject variability σ (log₁₀)'], 0.05, 0.6, 0.01, q.sigma, function (v) { q.sigma = v; disegna(); }, function (v) { return num(v, 2); });
    var info = F.el('div', { 'class': 'bsiFX-nota' }); g.pan.appendChild(info); prudenza(g.pan);
    var c1 = F.tela(g.dx, 0.45), c2 = F.tela(g.dx, 0.45);
    function disegna() {
      var xs = [], y1 = [], yh = []; for (var i = 0; i <= 300; i++) { var lc = -1 + 4 * i / 300, C = Math.pow(10, lc); xs.push(lc); y1.push(hill(C, { E0: 0, Emax: 100, EC50: o.EC50, n: 1 })); yh.push(hill(C, o)); }
      F.grafico(c1, { serie: [{ x: xs, y: y1, col: '#3a5470', tratt: true }, { x: xs, y: yh, col: '#5eead4', larg: 2.5 }, { x: [Math.log10(o.EC50), Math.log10(o.EC50)], y: [0, 50], col: '#ffd24a', tratt: true }], xl: ['log₁₀ C (mg/L)', 'log₁₀ C (mg/L)'], yl: ['effetto (% di Emax)', 'effect (% of Emax)'], ymin: 0, ymax: 100, legenda: [{ col: '#5eead4', etich: ['Hill con n scelto', 'Hill with chosen n'] }, { col: '#3a5470', etich: ['n = 1 (iperbole)', 'n = 1 (hyperbola)'] }] });
      var xd = [], ye = [], yt = []; for (var j = 0; j <= 300; j++) { var ld = 0 + 3 * j / 300, d = Math.pow(10, ld); xd.push(ld); ye.push(quantale(d, q.ed50, q.sigma) * 100); yt.push(quantale(d, q.td50, q.sigma) * 100); }
      F.grafico(c2, { serie: [{ x: xd, y: ye, col: '#5eead4', larg: 2.5 }, { x: xd, y: yt, col: '#ff8fab', larg: 2.5 }], xl: ['log₁₀ dose (mg/kg)', 'log₁₀ dose (mg/kg)'], yl: ['% di soggetti', '% of subjects'], ymin: 0, ymax: 100, legenda: [{ col: '#5eead4', etich: ['effetto voluto (ED50 = 10)', 'desired effect (ED50 = 10)'] }, { col: '#ff8fab', etich: ['effetto tossico', 'toxic effect'] }] });
      var IT = q.td50 / q.ed50, ed99 = doseQuantile(0.99, q.ed50, q.sigma), td1 = doseQuantile(0.01, q.td50, q.sigma), MS = td1 / ed99, c10 = o.EC50 * Math.pow(1 / 9, 1 / o.n), c90 = o.EC50 * Math.pow(9, 1 / o.n);
      info.innerHTML = '<div class="bsiFX-eq">E = E₀ + Emax·Cⁿ / (EC50ⁿ + Cⁿ)</div>' +
        t('Dal 10 % al 90 % dell\'effetto la concentrazione sale di ', 'From 10 % to 90 % of the effect the concentration rises ') + '<b class="bsiFX-num">' + num(c90 / c10, 1) + t(' volte', ' times') + '</b> (81^(1/n)): ' + t('con n alto la risposta è quasi un interruttore.', 'with high n the response is almost a switch.') + '<br>' +
        t('Indice terapeutico TD50/ED50 = ', 'Therapeutic index TD50/ED50 = ') + '<b class="bsiFX-num">' + num(IT, 1) + '</b>; ' + t('margine di sicurezza TD1/ED99 = ', 'margin of safety TD1/ED99 = ') + '<b class="bsiFX-num">' + num(MS, 2) + '</b>' + (MS < 1 ? t(' — sotto 1: la dose che cura quasi tutti è già tossica per qualcuno.', ' — below 1: the dose that treats almost everyone is already toxic for someone.') : '') +
        '<br><small>' + t('Lo stesso indice terapeutico può nascondere margini molto diversi: conta anche quanto variano gli individui (σ).', 'The same therapeutic index can hide very different margins: how much individuals vary (σ) also counts.') + '</small>';
    }
    disegna(); F.alRidimensiona(disegna);
  }

  var ESEMPI = {
    gen: [t('Generico', 'Generic'), 0.9, 10],
    mida: [t('Midazolam orale + inibitore forte del CYP3A4', 'Oral midazolam + strong CYP3A4 inhibitor'), 0.94, 30],
    debole: [t('Farmaco con poche vie, inibitore debole', 'Drug with few pathways, weak inhibitor'), 0.5, 1]
  };
  function schedaInterazioni(div) {
    var g = griglia(div), o = { fm: 0.9, IKi: 10 }, sl = {};
    F.scelta(g.pan, ['Un esempio', 'An example'], Object.keys(ESEMPI).map(function (k) { return [k, ESEMPI[k][0]]; }), 'gen', function (k) { o.fm = ESEMPI[k][1]; o.IKi = ESEMPI[k][2]; sl.fm.value = o.fm; sl.fm.dispatchEvent(new Event('input')); sl.i.value = Math.log10(o.IKi); sl.i.dispatchEvent(new Event('input')); disegna(); });
    sl.fm = F.cursore(g.pan, ['fm: frazione eliminata dall\'enzima inibito', 'fm: fraction eliminated by the inhibited enzyme'], 0, 1, 0.01, o.fm, function (v) { o.fm = v; disegna(); }, function (v) { return num(v, 2); });
    sl.i = F.cursore(g.pan, ['log₁₀ ([I]/Ki): forza dell\'inibizione', 'log₁₀ ([I]/Ki): strength of inhibition'], -1, 2.5, 0.05, Math.log10(o.IKi), function (v) { o.IKi = Math.pow(10, v); disegna(); }, function (v) { return '[I]/Ki = ' + num(Math.pow(10, v), Math.pow(10, v) < 10 ? 1 : 0); });
    var info = F.el('div', { 'class': 'bsiFX-nota' }); g.pan.appendChild(info); prudenza(g.pan);
    var c = F.tela(g.dx, 0.6);
    function disegna() {
      var serie = [], xs = []; for (var i = 0; i <= 200; i++) xs.push(-1 + 3.5 * i / 200);
      [0.5, 0.75, 0.9, 0.95, 0.99].forEach(function (fm, j) { serie.push({ x: xs, y: xs.map(function (x) { return rapportoAUC(fm, Math.pow(10, x)); }), col: ['#3a5470', '#4a6a8a', '#6b8cae', '#8fb0d0', '#b5d3ee'][j], tratt: true }); });
      serie.push({ x: [-1, 2.5], y: [5, 5], col: '#ff8fab', tratt: true }, { x: [-1, 2.5], y: [2, 2], col: '#ffd24a', tratt: true });
      var r = rapportoAUC(o.fm, o.IKi), lim = 1 / (1 - o.fm);
      F.grafico(c, { serie: serie, punti: [{ x: Math.log10(o.IKi), y: r, col: '#5eead4', r: 7 }], xl: ['log₁₀ ([I]/Ki)', 'log₁₀ ([I]/Ki)'], yl: ['AUC con / senza inibitore', 'AUC with / without inhibitor'], ymin: 1, ymax: 30,
        legenda: [{ col: '#8fb0d0', etich: ['fm = 0,5 · 0,75 · 0,9 · 0,95 · 0,99', 'fm = 0.5 · 0.75 · 0.9 · 0.95 · 0.99'] }, { col: '#ff8fab', etich: ['soglia «forte» (5×)', '«strong» threshold (5×)'] }, { col: '#ffd24a', etich: ['soglia «moderato» (2×)', '«moderate» threshold (2×)'] }] });
      info.innerHTML = '<div class="bsiFX-eq">AUC_con / AUC_senza = 1 / ( fm/(1 + [I]/Ki) + (1 − fm) )</div>' +
        t('L\'esposizione al farmaco aumenta di ', 'Exposure to the drug increases ') + '<b class="bsiFX-num">' + num(r, 1) + t(' volte', ' times') + '</b>: ' + t('interazione ', 'interaction ') + '<b>' + classeFDA(r) + '</b> ' + t('(classi FDA, 2020)', '(FDA classes, 2020)') + '<br>' +
        t('Anche con inibizione totale non si va oltre ', 'Even with total inhibition it cannot exceed ') + '<b class="bsiFX-num">1/(1 − fm) = ' + (isFinite(lim) ? num(lim, 1) : '∞') + '</b>: ' + t('le altre vie di eliminazione salvano il paziente.', 'the other elimination pathways save the patient.') +
        '<br><small>' + t('Modello di Rowland e Matin (1973), inibizione competitiva reversibile e farmaco a bassa estrazione. Gli inibitori irreversibili (basati sul meccanismo) e gli induttori (rifampicina) seguono altre formule; per la via orale conta anche l\'inibizione nell\'intestino.', 'Rowland and Matin model (1973), reversible competitive inhibition and a low-extraction drug. Irreversible (mechanism-based) inhibitors and inducers (rifampicin) follow other formulas; for the oral route gut inhibition also counts.') + '</small>';
    }
    disegna(); F.alRidimensiona(disegna);
  }

  F.sezione('sfarmquant', {
    titolo: ['💉 Farmacologia quantitativa', '💉 Quantitative pharmacology'],
    sotto: ['Due compartimenti con le fasi di distribuzione ed eliminazione, dosi ripetute fino allo stato stazionario e la dose di carico, la farmacodinamica di Hill con indice terapeutico e margine di sicurezza, le interazioni per inibizione degli enzimi. Esempi didattici: non sostituiscono il medico.',
            'Two compartments with distribution and elimination phases, repeated doses to steady state and the loading dose, Hill pharmacodynamics with therapeutic index and margin of safety, interactions through enzyme inhibition. Educational examples: they do not replace a doctor.'],
    schede: [
      { nome: ['Due compartimenti', 'Two compartments'], costruisci: schedaDue },
      { nome: ['Dosi ripetute', 'Repeated doses'], costruisci: schedaRipetute },
      { nome: ['Farmacodinamica', 'Pharmacodynamics'], costruisci: schedaPD },
      { nome: ['Interazioni', 'Interactions'], costruisci: schedaInterazioni }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
