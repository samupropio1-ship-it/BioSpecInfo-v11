/* ═══════════════════════════════════════════════════════════════════════════
   bsi-med-fisiologia.js — 🫀 Fisiologia come sistema (fase 8 del progetto, §7.5)
   BioSpecInfo · © Samuele Pio Provenzano

   PERCHE' ESISTE (v254)
   Il progetto chiede la fisiologia come sistema: modelli dinamici semplici e
   dichiarati, con i numeri che vengono dalle equazioni e non scritti a mano.
   Quattro modelli classici, ciascuno con la sua fonte:

   1. CICLO CARDIACO — elastanza variabile nel tempo (Suga e Sagawa 1974;
      forma della curva di attivazione da Stergiopulos et al. 1996):
        P_vs = e(t)·Emax·(V − V0) + (1 − e(t))·A·(e^(B(V − V0)) − 1)
      con valvola mitrale e aortica come diodi con resistenza, l'aorta come
      Windkessel a due elementi (compliance C, resistenza periferica R).
      Si integra fino al ciclo stazionario: gittata, frazione di eiezione,
      pressioni, lavoro (area del ciclo pressione–volume).
   2. ACIDO–BASE — Henderson–Hasselbalch per il bicarbonato,
        pH = 6,1 + log10( HCO3⁻ / (0,0307 · pCO2) ),
      compensi attesi (Winter: pCO2 = 1,5·HCO3⁻ + 8 ± 2 nell'acidosi
      metabolica; 0,7 mmHg per mmol/L nell'alcalosi metabolica; 0,1 e 0,35
      mmol/L per mmHg nell'acidosi respiratoria acuta e cronica; 0,2 e 0,4
      nell'alcalosi respiratoria; Berend et al., NEJM 2014), gap anionico.
   3. GLICEMIA — modello minimo di Bergman (1979, 1981) per il test di
      tolleranza al glucosio endovena: glucosio, insulina remota X,
      insulina plasmatica; sensibilità insulinica S_I = p3/p2.
   4. SCAMBI GASSOSI — equazione dei gas alveolari
        PAO2 = FiO2·(Patm − 47) − PaCO2/R,
      atmosfera standard per la quota, saturazione con l'equazione di
      Severinghaus (1979), contenuto di O2 = 1,34·Hb·SaO2 + 0,003·PaO2.

   PRUDENZA CLINICA
   Informazione scientifica e didattica: non sostituisce il medico né una
   diagnosi. Le soglie hanno la fonte e l'anno.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t;
  function num(x, d) { return x.toFixed(d == null ? 1 : d).replace('.', ',').replace('-', '−'); }
  function griglia(div) { var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div', { style: 'min-width:0' }); G.appendChild(pan); G.appendChild(dx); div.appendChild(G); return { pan: pan, dx: dx }; }
  function prudenza(div) { div.appendChild(F.el('div', { 'class': 'bsiFX-nota', style: 'border-left:3px solid #ffd24a;margin-top:8px', html: '⚕️ <b>' + t('Informazione didattica', 'Educational information') + '</b>: ' + t('non sostituisce il medico né una diagnosi. I modelli sono semplificati e dichiarati.', 'it does not replace a doctor or a diagnosis. The models are simplified and declared.') })); }

  /* ═══ 1. IL CICLO CARDIACO ══════════════════════════════════════════════ */
  var CUORE = { fc: 70, Emax: 2.3, A: 0.5, B: 0.023, V0: 15, Pla: 8, Rm: 0.006, Ra: 0.004, Rp: 1.1, C: 1.4 };
  /** Attivazione normalizzata (massimo 1) nel ciclo di periodo T: doppia funzione di Hill. */
  function attivazione(tt, T) {
    var a1 = 0.303 * T, a2 = 0.508 * T, f = function (x) { var u = Math.pow(x / a1, 1.32); return u / (1 + u) / (1 + Math.pow(x / a2, 21.9)); };
    if (!attivazione._m || attivazione._T !== T) { var m = 0; for (var i = 0; i <= 2000; i++) m = Math.max(m, f(i / 2000 * T)); attivazione._m = m; attivazione._T = T; }
    return f(tt) / attivazione._m;
  }
  /** Simula fino al ciclo stazionario; restituisce l'ultimo ciclo e gli indici. Unità: ml, mmHg, s. */
  function cicloCardiaco(p) {
    var T = 60 / p.fc, dt = 0.0002, V = 120, Pa = 80, ris = null;
    for (var c = 0; c < 14; c++) {
      var Vmin = 1e9, Vmax = 0, Pmax = 0, Pmin = 1e9, Plmax = 0, W = 0, curva = [], k = 0, Qtot = 0;
      for (var tt = 0; tt < T; tt += dt, k++) {
        var e = attivazione(tt, T), P = e * p.Emax * (V - p.V0) + (1 - e) * p.A * (Math.exp(p.B * (V - p.V0)) - 1);
        var Qm = Math.max(0, (p.Pla - P) / p.Rm), Qa = Math.max(0, (P - Pa) / p.Ra), dV = (Qm - Qa) * dt;
        W -= P * dV; V += dV; Pa += (Qa - Pa / p.Rp) / p.C * dt; Qtot += Qa * dt;
        Vmin = Math.min(Vmin, V); Vmax = Math.max(Vmax, V); Pmax = Math.max(Pmax, Pa); Pmin = Math.min(Pmin, Pa); Plmax = Math.max(Plmax, P);
        if (c === 13 && k % 10 === 0) curva.push([tt, V, P, Pa]);
      }
      ris = { EDV: Vmax, ESV: Vmin, GS: Vmax - Vmin, FE: (Vmax - Vmin) / Vmax, GC: (Vmax - Vmin) * p.fc / 1000, Ps: Pmax, Pd: Pmin, Pm: Pmin + (Pmax - Pmin) / 3, Pvs: Plmax, lavoro: W, curva: curva, flusso: Qtot };
    }
    ris.lavoroJ = ris.lavoro * 133.322e-6;          /* mmHg·ml → J */
    return ris;
  }

  function schedaCuore(div) {
    var g = griglia(div), p = {}; for (var k in CUORE) p[k] = CUORE[k];
    var base = cicloCardiaco(CUORE);
    F.cursore(g.pan, ['Contrattilità Emax (mmHg/ml)', 'Contractility Emax (mmHg/ml)'], 0.8, 4, 0.1, p.Emax, function (v) { p.Emax = v; disegna(); }, function (v) { return num(v, 1); });
    F.cursore(g.pan, ['Pressione di riempimento atriale (mmHg)', 'Atrial filling pressure (mmHg)'], 3, 16, 0.5, p.Pla, function (v) { p.Pla = v; disegna(); }, function (v) { return num(v, 1); });
    F.cursore(g.pan, ['Resistenza periferica (mmHg·s/ml)', 'Peripheral resistance (mmHg·s/ml)'], 0.6, 2, 0.05, p.Rp, function (v) { p.Rp = v; disegna(); }, function (v) { return num(v, 2); });
    F.cursore(g.pan, ['Frequenza cardiaca (battiti/min)', 'Heart rate (beats/min)'], 45, 150, 1, p.fc, function (v) { p.fc = v; disegna(); }, function (v) { return v; });
    var info = F.el('div', { 'class': 'bsiFX-nota' }); g.pan.appendChild(info); prudenza(g.pan);
    var c1 = F.tela(g.dx, 0.7), c2 = F.tela(g.dx, 0.45);
    function disegna() {
      var r = cicloCardiaco(p), Vs = r.curva.map(function (x) { return x[1]; }), Ps = r.curva.map(function (x) { return x[2]; });
      var Vb = base.curva.map(function (x) { return x[1]; }), Pb = base.curva.map(function (x) { return x[2]; });
      var ves = [], pes = [], ved = [], ped = []; for (var v = p.V0; v <= 220; v += 2) { ves.push(v); pes.push(p.Emax * (v - p.V0)); ved.push(v); ped.push(p.A * (Math.exp(p.B * (v - p.V0)) - 1)); }
      F.grafico(c1, { serie: [{ x: Vb, y: Pb, col: '#3a5470', tratt: true }, { x: ves, y: pes, col: '#ff8fab', tratt: true }, { x: ved, y: ped, col: '#9d8cff', tratt: true }, { x: Vs, y: Ps, col: '#5eead4', larg: 3 }], xl: ['volume del ventricolo sinistro (ml)', 'left ventricular volume (ml)'], yl: ['pressione (mmHg)', 'pressure (mmHg)'], xmin: 0, xmax: 220, ymin: 0, ymax: 200,
        legenda: [{ col: '#5eead4', etich: ['ciclo pressione–volume', 'pressure–volume loop'] }, { col: '#ff8fab', etich: ['telesistolica (Emax)', 'end-systolic (Emax)'] }, { col: '#9d8cff', etich: ['telediastolica', 'end-diastolic'] }, { col: '#3a5470', etich: ['ciclo di partenza', 'starting loop'] }] });
      var ts = r.curva.map(function (x) { return x[0] * 1000; });
      F.grafico(c2, { serie: [{ x: ts, y: Ps, col: '#5eead4', larg: 2 }, { x: ts, y: r.curva.map(function (x) { return x[3]; }), col: '#ff8fab', larg: 2 }, { x: [0, ts[ts.length - 1]], y: [p.Pla, p.Pla], col: '#9d8cff', tratt: true }], xl: ['tempo nel ciclo (ms)', 'time in the cycle (ms)'], yl: ['mmHg', 'mmHg'], ymin: 0,
        legenda: [{ col: '#5eead4', etich: ['ventricolo', 'ventricle'] }, { col: '#ff8fab', etich: ['aorta', 'aorta'] }, { col: '#9d8cff', etich: ['atrio', 'atrium'] }] });
      info.innerHTML = '<div class="bsiFX-eq">P = e(t)·Emax·(V − V₀) + (1 − e(t))·A·(e^(B(V−V₀)) − 1)</div>' +
        t('Volume telediastolico ', 'End-diastolic volume ') + '<b class="bsiFX-num">' + num(r.EDV, 0) + ' ml</b>, ' + t('telesistolico ', 'end-systolic ') + '<b class="bsiFX-num">' + num(r.ESV, 0) + ' ml</b><br>' +
        t('Gittata sistolica ', 'Stroke volume ') + '<b class="bsiFX-num">' + num(r.GS, 0) + ' ml</b>, ' + t('frazione di eiezione ', 'ejection fraction ') + '<b class="bsiFX-num">' + num(r.FE * 100, 0) + ' %</b><br>' +
        t('Gittata cardiaca ', 'Cardiac output ') + '<b class="bsiFX-num">' + num(r.GC, 1) + ' L/min</b>, ' + t('pressione arteriosa ', 'arterial pressure ') + '<b class="bsiFX-num">' + num(r.Ps, 0) + '/' + num(r.Pd, 0) + ' mmHg</b> (' + t('media ', 'mean ') + num(r.Pm, 0) + ')<br>' +
        t('Lavoro sistolico (area del ciclo) ', 'Stroke work (loop area) ') + '<b class="bsiFX-num">' + num(r.lavoroJ, 2) + ' J</b>' +
        '<br><small>' + t('Frank–Starling: alza il riempimento e la gittata cresce. Più resistenza: la pressione sale e la gittata cala, a contrattilità fissa. Modello a un ventricolo con atrio a pressione costante; parametri da Stergiopulos 1996 e Suga 1974, arrotondati per l\'adulto a riposo.', 'Frank–Starling: raise the filling and the stroke volume grows. More resistance: pressure rises and stroke volume falls, at fixed contractility. One-ventricle model with constant atrial pressure; parameters from Stergiopulos 1996 and Suga 1974, rounded for a resting adult.') + '</small>';
    }
    disegna(); F.alRidimensiona(disegna);
  }

  /* ═══ 2. ACIDO–BASE ═════════════════════════════════════════════════════ */
  function pH(hco3, pco2) { return 6.1 + Math.log10(hco3 / (0.0307 * pco2)); }
  function hco3Da(ph, pco2) { return 0.0307 * pco2 * Math.pow(10, ph - 6.1); }
  /** Classificazione con il compenso atteso. cronico: per i disturbi respiratori. */
  function acidoBase(v) {
    var ph = pH(v.hco3, v.pco2), ag = v.na - (v.cl + v.hco3), r = { pH: ph, gap: ag, primario: 'normale', atteso: null, misto: '' };
    if (ph < 7.35) r.primario = v.hco3 < 22 && (v.pco2 <= 45 || v.hco3 < 22 - (v.pco2 - 40) * 0.1) ? 'acidosi metabolica' : 'acidosi respiratoria';
    else if (ph > 7.45) r.primario = v.hco3 > 26 && v.pco2 >= 35 ? 'alcalosi metabolica' : 'alcalosi respiratoria';
    else if (v.pco2 > 45 && v.hco3 > 26) r.primario = 'compensato: acidosi respiratoria o alcalosi metabolica';
    else if (v.pco2 < 35 && v.hco3 < 22) r.primario = 'compensato: alcalosi respiratoria o acidosi metabolica';
    /* pH nella norma ma bicarbonato basso e gap alto: c'è un'acidosi metabolica, e il pH normale dice che qualcos'altro la bilancia */
    if (/^compensato: alcalosi respiratoria/.test(r.primario) && ag > 12) r.primario = 'acidosi metabolica a gap alto (pH nella norma)';
    if (/^acidosi metabolica/.test(r.primario)) { r.atteso = { grandezza: 'pCO2', val: 1.5 * v.hco3 + 8, tol: 2, regola: 'Winter: 1,5·HCO3⁻ + 8 ± 2' }; r.misto = v.pco2 > r.atteso.val + 2 ? 'con acidosi respiratoria' : v.pco2 < r.atteso.val - 2 ? 'con alcalosi respiratoria' : 'compensata come atteso'; }
    if (r.primario === 'alcalosi metabolica') { r.atteso = { grandezza: 'pCO2', val: 40 + 0.7 * (v.hco3 - 24), tol: 2, regola: '40 + 0,7·(HCO3⁻ − 24) ± 2' }; r.misto = v.pco2 > r.atteso.val + 2 ? 'con acidosi respiratoria' : v.pco2 < r.atteso.val - 2 ? 'con alcalosi respiratoria' : 'compensata come atteso'; }
    if (r.primario === 'acidosi respiratoria') { var k = v.cronico ? 0.35 : 0.1; r.atteso = { grandezza: 'HCO3⁻', val: 24 + k * (v.pco2 - 40), tol: 2, regola: (v.cronico ? 'cronica' : 'acuta') + ': 24 + ' + num(k, 2) + '·(pCO2 − 40)' }; r.misto = v.hco3 > r.atteso.val + 2 ? 'con alcalosi metabolica' : v.hco3 < r.atteso.val - 2 ? 'con acidosi metabolica' : 'compensata come atteso'; }
    if (r.primario === 'alcalosi respiratoria') { var k2 = v.cronico ? 0.4 : 0.2; r.atteso = { grandezza: 'HCO3⁻', val: 24 - k2 * (40 - v.pco2), tol: 2, regola: (v.cronico ? 'cronica' : 'acuta') + ': 24 − ' + num(k2, 1) + '·(40 − pCO2)' }; r.misto = v.hco3 > r.atteso.val + 2 ? 'con alcalosi metabolica' : v.hco3 < r.atteso.val - 2 ? 'con acidosi metabolica' : 'compensata come atteso'; }
    r.gapAlto = ag > 12;
    if (r.gapAlto) r.deltaRapporto = (ag - 12) / Math.max(0.1, 24 - v.hco3);
    return r;
  }
  var CASI = {
    norm: ['Normale', { pco2: 40, hco3: 24, na: 140, cl: 104 }],
    cheto: ['Chetoacidosi diabetica', { pco2: 22, hco3: 10, na: 135, cl: 98 }],
    vomito: ['Vomito ripetuto', { pco2: 48, hco3: 34, na: 138, cl: 88 }],
    bpco: ['BPCO riacutizzata (cronica)', { pco2: 65, hco3: 33, na: 140, cl: 96, cronico: true }],
    ansia: ['Iperventilazione d\'ansia (acuta)', { pco2: 28, hco3: 22, na: 140, cl: 106 }],
    sal: ['Salicilati (misto)', { pco2: 25, hco3: 14, na: 140, cl: 102 }]
  };
  function schedaAcidoBase(div) {
    var g = griglia(div), v = { pco2: 40, hco3: 24, na: 140, cl: 104, cronico: false }, sl = {};
    F.scelta(g.pan, ['Un caso', 'A case'], Object.keys(CASI).map(function (k) { return [k, CASI[k][0]]; }), 'norm', function (k) { var c = CASI[k][1]; v.pco2 = c.pco2; v.hco3 = c.hco3; v.na = c.na; v.cl = c.cl; v.cronico = !!c.cronico; Object.keys(sl).forEach(function (q) { sl[q].value = v[q]; sl[q].dispatchEvent(new Event('input')); }); sc.value = v.cronico ? 'c' : 'a'; disegna(); });
    sl.pco2 = F.cursore(g.pan, ['pCO2 arteriosa (mmHg)', 'Arterial pCO2 (mmHg)'], 15, 90, 1, v.pco2, function (x) { v.pco2 = x; disegna(); }, function (x) { return x; });
    sl.hco3 = F.cursore(g.pan, ['Bicarbonato HCO3⁻ (mmol/L)', 'Bicarbonate HCO3⁻ (mmol/L)'], 4, 45, 1, v.hco3, function (x) { v.hco3 = x; disegna(); }, function (x) { return x; });
    sl.na = F.cursore(g.pan, ['Sodio (mmol/L)', 'Sodium (mmol/L)'], 120, 160, 1, v.na, function (x) { v.na = x; disegna(); }, function (x) { return x; });
    sl.cl = F.cursore(g.pan, ['Cloro (mmol/L)', 'Chloride (mmol/L)'], 80, 125, 1, v.cl, function (x) { v.cl = x; disegna(); }, function (x) { return x; });
    var sc = F.scelta(g.pan, ['Disturbo respiratorio', 'Respiratory disorder'], [['a', ['acuto (ore)', 'acute (hours)']], ['c', ['cronico (giorni: il rene compensa)', 'chronic (days: the kidney compensates)']]], 'a', function (x) { v.cronico = x === 'c'; disegna(); });
    var info = F.el('div', { 'class': 'bsiFX-nota' }); g.pan.appendChild(info); prudenza(g.pan);
    var c = F.tela(g.dx, 0.75);
    function disegna() {
      var r = acidoBase(v), serie = [];
      [20, 30, 40, 60, 80].forEach(function (pc) { var xs = [], ys = []; for (var ph = 6.9; ph <= 7.8; ph += 0.01) { xs.push(ph); ys.push(hco3Da(ph, pc)); } serie.push({ x: xs, y: ys, col: pc === 40 ? '#9fb3c8' : '#3a5470', tratt: pc !== 40 }); });
      F.grafico(c, { serie: serie, punti: [{ x: r.pH, y: v.hco3, col: '#ffd24a', r: 7 }, { x: 7.40, y: 24, col: '#5eead4', r: 4 }], xl: ['pH', 'pH'], yl: ['HCO3⁻ (mmol/L)', 'HCO3⁻ (mmol/L)'], xmin: 6.9, xmax: 7.8, ymin: 0, ymax: 50,
        legenda: [{ col: '#9fb3c8', etich: ['isobara pCO2 = 40 mmHg (le altre: 20, 30, 60, 80)', 'pCO2 = 40 mmHg isobar (others: 20, 30, 60, 80)'] }, { col: '#ffd24a', etich: ['il paziente', 'the patient'] }, { col: '#5eead4', etich: ['normale', 'normal'] }] });
      info.innerHTML = '<div class="bsiFX-eq">pH = 6,1 + log₁₀( HCO3⁻ / (0,0307 · pCO2) )</div>' +
        'pH = <b class="bsiFX-num">' + num(r.pH, 2) + '</b> · ' + t('disturbo: ', 'disorder: ') + '<b>' + r.primario + '</b>' + (r.misto ? ' — ' + r.misto : '') + '<br>' +
        (r.atteso ? t('Compenso atteso: ', 'Expected compensation: ') + r.atteso.grandezza + ' = <b class="bsiFX-num">' + num(r.atteso.val, 1) + ' ± ' + r.atteso.tol + '</b> (' + r.atteso.regola + ')<br>' : '') +
        t('Gap anionico Na⁺ − (Cl⁻ + HCO3⁻) = ', 'Anion gap Na⁺ − (Cl⁻ + HCO3⁻) = ') + '<b class="bsiFX-num">' + num(r.gap, 0) + ' mmol/L</b>' + (r.gapAlto ? t(' (alto: acidi non misurati, es. chetoni, lattato; rapporto delta/delta ', ' (high: unmeasured acids, e.g. ketones, lactate; delta/delta ratio ') + num(r.deltaRapporto, 1) + ')' : t(' (riferimento 8–12, senza potassio)', ' (reference 8–12, without potassium)')) +
        '<br><small>' + t('Regole di compenso: Berend, de Vries, Gans, NEJM 371 (2014) 1434. Il gap va corretto per l\'albumina bassa (+2,5 per ogni g/dL sotto 4).', 'Compensation rules: Berend, de Vries, Gans, NEJM 371 (2014) 1434. The gap must be corrected for low albumin (+2.5 per g/dL below 4).') + '</small>';
    }
    disegna(); F.alRidimensiona(disegna);
  }

  /* ═══ 3. GLICEMIA: MODELLO MINIMO ═══════════════════════════════════════ */
  var BERG = { G0: 287, Gb: 92, Ib: 11, I0: 400, p1: 0.03, p2: 0.02, p3: 1.3e-5, n: 0.3, gam: 0.004, h: 92 };
  function ivgtt(o, durata) {
    var G = o.G0, X = 0, I = o.I0, dt = 0.05, out = [];
    for (var k = 0; k * dt <= (durata || 180) + 1e-9; k++) {
      var tt = k * dt; if (k % 20 === 0) out.push([tt, G, I, X]);
      var dG = -(o.p1 + X) * G + o.p1 * o.Gb, dX = -o.p2 * X + o.p3 * (I - o.Ib), dI = -o.n * (I - o.Ib) + o.gam * Math.max(0, G - o.h) * tt;
      G += dG * dt; X += dX * dt; I = Math.max(0, I + dI * dt);
    }
    return out;
  }
  /** Kg: pendenza di −ln G fra 10 e 40 minuti, in %/min (indice di tolleranza endovena). */
  function kg(curva) { var a = curva.filter(function (x) { return x[0] >= 10 && x[0] <= 40; }), n = a.length, sx = 0, sy = 0, sxx = 0, sxy = 0; a.forEach(function (x) { var y = Math.log(x[1]); sx += x[0]; sy += y; sxx += x[0] * x[0]; sxy += x[0] * y; }); return -(n * sxy - sx * sy) / (n * sxx - sx * sx) * 100; }
  function schedaGlicemia(div) {
    var g = griglia(div), o = {}; for (var k in BERG) o[k] = BERG[k];
    var SI0 = BERG.p3 / BERG.p2;
    F.cursore(g.pan, ['Sensibilità all\'insulina (× normale)', 'Insulin sensitivity (× normal)'], 0.1, 2, 0.05, 1, function (x) { o.p3 = BERG.p3 * x; disegna(); }, function (x) { return num(x, 2) + '×'; });
    F.cursore(g.pan, ['Risposta delle cellule β (× normale)', 'β-cell response (× normal)'], 0, 2, 0.05, 1, function (x) { o.gam = BERG.gam * x; disegna(); }, function (x) { return num(x, 2) + '×'; });
    F.cursore(g.pan, ['Efficacia del glucosio p1 (1/min)', 'Glucose effectiveness p1 (1/min)'], 0.005, 0.05, 0.001, o.p1, function (x) { o.p1 = x; disegna(); }, function (x) { return num(x, 3); });
    var info = F.el('div', { 'class': 'bsiFX-nota' }); g.pan.appendChild(info); prudenza(g.pan);
    var c1 = F.tela(g.dx, 0.5), c2 = F.tela(g.dx, 0.4);
    function disegna() {
      var cv = ivgtt(o), nr = ivgtt(BERG), ts = cv.map(function (x) { return x[0]; });
      F.grafico(c1, { serie: [{ x: ts, y: nr.map(function (x) { return x[1]; }), col: '#3a5470', tratt: true }, { x: ts, y: cv.map(function (x) { return x[1]; }), col: '#ffd24a', larg: 2.5 }, { x: [0, 180], y: [o.Gb, o.Gb], col: '#9fb3c8', tratt: true }], xl: ['minuti dopo il bolo', 'minutes after the bolus'], yl: ['glucosio (mg/dL)', 'glucose (mg/dL)'], ymin: 0, legenda: [{ col: '#ffd24a', etich: ['glucosio', 'glucose'] }, { col: '#3a5470', etich: ['soggetto di riferimento', 'reference subject'] }] });
      F.grafico(c2, { serie: [{ x: ts, y: nr.map(function (x) { return x[2]; }), col: '#3a5470', tratt: true }, { x: ts, y: cv.map(function (x) { return x[2]; }), col: '#5eead4', larg: 2.5 }], xl: ['minuti', 'minutes'], yl: ['insulina (μU/mL)', 'insulin (μU/mL)'], ymin: 0, ymax: 120 });
      var K = kg(cv), dopo = cv.filter(function (x) { return x[0] >= 60; })[0][1];
      info.innerHTML = '<div class="bsiFX-eq">dG/dt = −(p₁ + X)·G + p₁·G_b,   dX/dt = −p₂·X + p₃·(I − I_b)</div>' +
        t('Sensibilità insulinica ', 'Insulin sensitivity ') + '<b class="bsiFX-num">S_I = p₃/p₂ = ' + num(o.p3 / o.p2 * 1e4, 2) + '×10⁻⁴</b> min⁻¹ per μU/mL (' + num(o.p3 / o.p2 / SI0 * 100, 0) + t(' % del riferimento)', ' % of reference)') + '<br>' +
        t('Indice di scomparsa Kg ', 'Disappearance index Kg ') + '<b class="bsiFX-num">' + num(K, 2) + ' %/min</b>' + t(' (sopra 1,2 normale nella letteratura classica); glucosio a 60 minuti ', ' (above 1.2 normal in the classic literature); glucose at 60 minutes ') + '<b class="bsiFX-num">' + num(dopo, 0) + ' mg/dL</b>' +
        '<br><small>' + t('Test endovena (IVGTT) con bolo di glucosio al tempo 0. Parametri dell\'ordine di quelli di Bergman et al., J Clin Invest 68 (1981) 1456. Il diabete di tipo 2 unisce bassa sensibilità e risposta β insufficiente: prova a ridurle insieme.', 'Intravenous test (IVGTT) with a glucose bolus at time 0. Parameters of the order of Bergman et al., J Clin Invest 68 (1981) 1456. Type 2 diabetes joins low sensitivity and insufficient β response: try lowering both.') + '</small>';
    }
    disegna(); F.alRidimensiona(disegna);
  }

  /* ═══ 4. SCAMBI GASSOSI ═════════════════════════════════════════════════ */
  /** Pressione barometrica dell'atmosfera standard (mmHg) alla quota h (m). */
  function pressioneQuota(h) { return 760 * Math.pow(1 - 2.25577e-5 * h, 5.25588); }
  function pAO2(fio2, patm, paco2, R) { return fio2 * (patm - 47) - paco2 / (R || 0.8); }
  /** Saturazione dell'emoglobina (Severinghaus 1979), PO2 in mmHg → frazione. */
  function saturazione(po2) { return 1 / (23400 / (Math.pow(po2, 3) + 150 * po2) + 1); }
  function contenutoO2(hb, sat, po2) { return 1.34 * hb * sat + 0.003 * po2; }
  function schedaGas(div) {
    var g = griglia(div), o = { h: 0, fio2: 0.21, paco2: 40, grad: 10, hb: 14.5 };
    F.cursore(g.pan, ['Quota (m)', 'Altitude (m)'], 0, 8848, 50, o.h, function (x) { o.h = x; disegna(); }, function (x) { return x + ' m'; });
    F.cursore(g.pan, ['Ossigeno inspirato FiO2 (%)', 'Inspired oxygen FiO2 (%)'], 21, 100, 1, 21, function (x) { o.fio2 = x / 100; disegna(); }, function (x) { return x + ' %'; });
    F.cursore(g.pan, ['PaCO2 (mmHg)', 'PaCO2 (mmHg)'], 15, 80, 1, o.paco2, function (x) { o.paco2 = x; disegna(); }, function (x) { return x; });
    F.cursore(g.pan, ['Gradiente alveolo–arterioso (mmHg)', 'Alveolar–arterial gradient (mmHg)'], 2, 60, 1, o.grad, function (x) { o.grad = x; disegna(); }, function (x) { return x; });
    F.cursore(g.pan, ['Emoglobina (g/dL)', 'Haemoglobin (g/dL)'], 6, 20, 0.5, o.hb, function (x) { o.hb = x; disegna(); }, function (x) { return num(x, 1); });
    var info = F.el('div', { 'class': 'bsiFX-nota' }); g.pan.appendChild(info); prudenza(g.pan);
    var c = F.tela(g.dx, 0.6);
    function disegna() {
      var patm = pressioneQuota(o.h), PA = pAO2(o.fio2, patm, o.paco2), Pa = Math.max(1, PA - o.grad), S = saturazione(Pa), Ca = contenutoO2(o.hb, S, Pa), xs = [], ys = [];
      for (var p = 1; p <= 150; p++) { xs.push(p); ys.push(saturazione(p) * 100); }
      F.grafico(c, { serie: [{ x: xs, y: ys, col: '#ff8fab', larg: 2.5 }], punti: [{ x: Math.min(150, Pa), y: S * 100, col: '#ffd24a', r: 7 }, { x: 26.8, y: saturazione(26.8) * 100, col: '#9fb3c8', r: 4 }], xl: ['PO2 (mmHg)', 'PO2 (mmHg)'], yl: ['saturazione (%)', 'saturation (%)'], ymin: 0, ymax: 100,
        legenda: [{ col: '#ff8fab', etich: ['curva di dissociazione (Severinghaus)', 'dissociation curve (Severinghaus)'] }, { col: '#ffd24a', etich: ['sangue arterioso', 'arterial blood'] }, { col: '#9fb3c8', etich: ['P50 ≈ 26,8 mmHg', 'P50 ≈ 26.8 mmHg'] }] });
      info.innerHTML = '<div class="bsiFX-eq">PAO2 = FiO2·(Patm − 47) − PaCO2/0,8</div>' +
        t('Pressione atmosferica ', 'Atmospheric pressure ') + '<b class="bsiFX-num">' + num(patm, 0) + ' mmHg</b>' + (o.h > 8000 ? t(' (atmosfera standard; sull\'Everest misurati circa 253 mmHg, West 1983: la quota vera dipende da latitudine e stagione)', ' (standard atmosphere; on Everest about 253 mmHg was measured, West 1983: the real value depends on latitude and season)') : '') + '<br>' +
        'PAO2 = <b class="bsiFX-num">' + num(PA, 0) + ' mmHg</b>, PaO2 = <b class="bsiFX-num">' + num(Pa, 0) + ' mmHg</b>, SaO2 = <b class="bsiFX-num">' + num(S * 100, 1) + ' %</b><br>' +
        t('Contenuto di ossigeno ', 'Oxygen content ') + '<b class="bsiFX-num">' + num(Ca, 1) + ' mL/dL</b> (1,34·Hb·SaO2 + 0,003·PaO2)' +
        '<br><small>' + t('Iperventilare (PaCO2 più bassa) alza la PAO2: è l\'adattamento immediato alla quota. Il gradiente A–a normale cresce con l\'età (circa età/4 + 4 mmHg in aria ambiente).', 'Hyperventilating (lower PaCO2) raises PAO2: the immediate adaptation to altitude. The normal A–a gradient grows with age (about age/4 + 4 mmHg on room air).') + '</small>';
    }
    disegna(); F.alRidimensiona(disegna);
  }

  F.calcolo.fisiologia = { attivazione: attivazione, cicloCardiaco: cicloCardiaco, CUORE: CUORE, pH: pH, hco3Da: hco3Da, acidoBase: acidoBase, ivgtt: ivgtt, kg: kg, BERG: BERG, pressioneQuota: pressioneQuota, pAO2: pAO2, saturazione: saturazione, contenutoO2: contenutoO2 };

  F.sezione('smedfisio', {
    titolo: ['🫀 Fisiologia come sistema', '🫀 Physiology as a system'],
    sotto: ['Quattro modelli dinamici dichiarati: il ciclo cardiaco con il diagramma pressione–volume, l\'equilibrio acido–base con i compensi attesi, la glicemia con il modello minimo di Bergman, gli scambi gassosi dall\'aria al sangue. Informazione didattica: non sostituisce il medico.',
            'Four declared dynamic models: the cardiac cycle with the pressure–volume loop, acid–base balance with the expected compensations, blood glucose with Bergman\'s minimal model, gas exchange from air to blood. Educational information: it does not replace a doctor.'],
    schede: [
      { nome: ['Ciclo cardiaco', 'Cardiac cycle'], costruisci: schedaCuore },
      { nome: ['Acido–base', 'Acid–base'], costruisci: schedaAcidoBase },
      { nome: ['Glicemia', 'Blood glucose'], costruisci: schedaGlicemia },
      { nome: ['Scambi gassosi', 'Gas exchange'], costruisci: schedaGas }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
