/* ═══════════════════════════════════════════════════════════════════════════
   bsi-fis-elettrodi.js — ⚡ cinetica agli elettrodi e stato di transizione
   BioSpecInfo · © Samuele Pio Provenzano

   · BUTLER-VOLMER: la corrente di un elettrodo in funzione della
     sovratensione, i = i₀[e^(αₐFη/RT) − e^(−α_cFη/RT)], con il limite di
     trasporto di massa (correnti limite anodica e catodica); la regione
     lineare vicino all'equilibrio (resistenza di trasferimento di carica
     R_ct = RT/(F i₀)) e le rette di Tafel lontano.
   · TAFEL DAI DATI: si incollano coppie (η, i) e la retta log|i| contro η
     restituisce pendenza di Tafel, coefficiente di trasferimento e
     corrente di scambio.
   · EYRING: la teoria dello stato di transizione k = κ(k_BT/h)e^(−ΔG‡/RT);
     dai dati k(T) la retta ln(k/T) contro 1/T da' ΔH‡ e ΔS‡, e si vede la
     relazione con Arrhenius (Eₐ = ΔH‡ + RT, A = (ek_BT/h)e^(ΔS‡/R)).
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t;
  var Fa = 96485.33212, R = 8.314462618, kB = 1.380649e-23, h = 6.62607015e-34;

  function butlerVolmer(eta, p) {
    /* con trasporto di massa: i = (e^a − e^−c) / (1/i₀ + e^a/i_la − e^−c/i_lc), i_lc < 0 */
    var f = Fa / (R * p.T), ea = Math.exp(p.aa * f * eta), ec = Math.exp(-p.ac * f * eta);
    if (!p.ila) return p.i0 * (ea - ec);
    return (ea - ec) / (1 / p.i0 + ea / p.ila + ec / p.ila);
  }
  function retta(x, y) {
    var n = x.length, mx = 0, my = 0; for (var i = 0; i < n; i++) { mx += x[i]; my += y[i]; } mx /= n; my /= n;
    var sxx = 0, sxy = 0, syy = 0; for (i = 0; i < n; i++) { sxx += (x[i] - mx) * (x[i] - mx); sxy += (x[i] - mx) * (y[i] - my); syy += (y[i] - my) * (y[i] - my); }
    var m = sxy / sxx, q = my - m * mx, res = 0; for (i = 0; i < n; i++) res += Math.pow(y[i] - m * x[i] - q, 2);
    var s = n > 2 ? Math.sqrt(res / (n - 2)) : 0;
    return { m: m, q: q, sm: s / Math.sqrt(sxx), sq: s * Math.sqrt(1 / n + mx * mx / sxx), r2: sxy * sxy / (sxx * syy) };
  }
  /* Tafel: sui punti con |η| > soglia, ln|i| = ln i₀ + αFη/RT (anodico) */
  function tafel(dati, T, soglia) {
    var an = dati.filter(function (p) { return p[0] > soglia; }), ca = dati.filter(function (p) { return p[0] < -soglia; }), f = Fa / (R * T), out = {};
    if (an.length >= 2) { var r = retta(an.map(function (p) { return p[0]; }), an.map(function (p) { return Math.log10(Math.abs(p[1])); })); out.an = { pend: 1000 / r.m, alfa: r.m * Math.LN10 / f, i0: Math.pow(10, r.q), r2: r.r2 }; }
    if (ca.length >= 2) { var r2 = retta(ca.map(function (p) { return p[0]; }), ca.map(function (p) { return Math.log10(Math.abs(p[1])); })); out.ca = { pend: 1000 / r2.m, alfa: -r2.m * Math.LN10 / f, i0: Math.pow(10, r2.q), r2: r2.r2 }; }
    return out;
  }
  function eyring(dG, T, kappa) { return (kappa || 1) * kB * T / h * Math.exp(-dG / (R * T)); }
  function fitEyring(dati) {
    var r = retta(dati.map(function (p) { return 1 / p[0]; }), dati.map(function (p) { return Math.log(p[1] / p[0]); }));
    var dH = -r.m * R, dS = (r.q - Math.log(kB / h)) * R, ra = retta(dati.map(function (p) { return 1 / p[0]; }), dati.map(function (p) { return Math.log(p[1]); }));
    return { dH: dH, dS: dS, sdH: r.sm * R, sdS: r.sq * R, Ea: -ra.m * R, A: Math.exp(ra.q), r2: r.r2 };
  }
  function leggiCoppie(s) { return s.replace(/,/g, '.').split(/\n/).map(function (l) { return l.trim().split(/[\s;]+/).map(Number); }).filter(function (p) { return p.length >= 2 && isFinite(p[0]) && isFinite(p[1]); }); }
  function areaDati(val, et) { var a = F.el('textarea', { rows: 8, 'aria-label': et, style: 'width:100%;box-sizing:border-box;background:#081522;color:#e6fffb;border:1px solid #1a3050;border-radius:7px;padding:6px;font-family:var(--font-mono,monospace);font-size:.82rem' }); a.value = val; return a; }
  function griglia(div) { var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); g.appendChild(pan); g.appendChild(dx); div.appendChild(g); return { pan: pan, dx: dx }; }

  function schedaBV(div) {
    var G = griglia(div), p = { i0: 1e-3, aa: 0.5, ac: 0.5, T: 298.15, ila: 0 }, logscala = false, massa = false;
    F.cursore(G.pan, ['log₁₀ i₀ (A/cm²)', 'log₁₀ i₀ (A/cm²)'], -9, 0, 0.1, -3, function (v) { p.i0 = Math.pow(10, v); disegna(); }, function (v) { return v.toFixed(1); });
    F.cursore(G.pan, ['αₐ (anodico)', 'αₐ (anodic)'], 0.1, 0.9, 0.01, 0.5, function (v) { p.aa = v; p.ac = 1 - v; disegna(); }, function (v) { return v.toFixed(2) + ' · α_c = ' + (1 - v).toFixed(2); });
    F.cursore(G.pan, ['Temperatura (K)', 'Temperature (K)'], 273, 373, 1, 298, function (v) { p.T = v; disegna(); });
    F.scelta(G.pan, ['Grafico', 'Plot'], [['lin', ['i contro η', 'i versus η']], ['log', ['log|i| contro η (Tafel)', 'log|i| versus η (Tafel)']]], 'lin', function (v) { logscala = v === 'log'; disegna(); });
    var c1 = F.el('input', { type: 'checkbox' }); c1.addEventListener('change', function () { massa = c1.checked; disegna(); });
    G.pan.appendChild(F.el('label', { style: 'display:flex;gap:6px;font-size:.82rem;color:#aebccd;margin:6px 0' }, [c1, t('limite di trasporto di massa (|i_lim| = 10 i₀·…)', 'mass-transport limit (|i_lim| = 10 i₀·…)')]));
    var info = F.el('div', { 'class': 'bsiFX-nota' }); G.pan.appendChild(info);
    var c = F.tela(G.dx, 0.6);
    function disegna() {
      p.ila = massa ? Math.max(p.i0 * 50, 1e-4) : 0;
      var xs = [], y = [], ya = [], yc = [];
      for (var k = 0; k <= 400; k++) {
        var eta = -0.4 + 0.8 * k / 400, i = butlerVolmer(eta, p), fa = Fa / (R * p.T);
        xs.push(eta * 1000);
        if (logscala) { y.push(Math.log10(Math.abs(i) || 1e-30)); ya.push(Math.log10(p.i0) + p.aa * fa * eta / Math.LN10); yc.push(Math.log10(p.i0) - p.ac * fa * eta / Math.LN10); }
        else y.push(i * 1000);
      }
      var serie = [{ x: xs, y: y, col: '#5eead4', larg: 2.5 }];
      if (logscala) serie.push({ x: xs, y: ya, col: '#ffd24a', larg: 1.2, tratt: true }, { x: xs, y: yc, col: '#ff8a80', larg: 1.2, tratt: true });
      var mn = Math.min.apply(null, y.filter(isFinite)), mx = Math.max.apply(null, y.filter(isFinite));
      F.grafico(c, { serie: serie, xl: ['sovratensione η (mV)', 'overpotential η (mV)'], yl: logscala ? 'log₁₀ |i| (A/cm²)' : 'i (mA/cm²)', ymin: logscala ? mn - 0.5 : undefined, ymax: logscala ? mx + 0.5 : undefined,
        legenda: logscala ? [{ col: '#5eead4', etich: 'Butler-Volmer' }, { col: '#ffd24a', etich: t('Tafel anodica', 'anodic Tafel') }, { col: '#ff8a80', etich: t('Tafel catodica', 'cathodic Tafel') }] : null });
      var fa2 = Fa / (R * p.T), bA = Math.LN10 / (p.aa * fa2) * 1000, bC = Math.LN10 / (p.ac * fa2) * 1000, Rct = R * p.T / (Fa * p.i0);
      info.innerHTML = t('Pendenze di Tafel: ', 'Tafel slopes: ') + '<b class="bsiFX-num">' + bA.toFixed(1) + '</b> ' + t('e', 'and') + ' <b class="bsiFX-num">' + bC.toFixed(1) + ' mV/decade</b> (2,303RT/αF)' +
        '<br>R<sub>ct</sub> = RT/(F i₀) = <b class="bsiFX-num">' + (Rct < 1e4 ? Rct.toPrecision(3) : Rct.toExponential(2)) + ' Ω·cm²</b> ' + t('(pendenza vicino a η = 0, dove i ≈ i₀Fη/RT)', '(slope near η = 0, where i ≈ i₀Fη/RT)') +
        '<br>' + t('Un i₀ grande è un elettrodo «reversibile» (Pt per H⁺/H₂, ~10⁻³ A/cm²): basta poca sovratensione. Un i₀ piccolo (Hg per H₂, ~10⁻¹² A/cm²) richiede centinaia di mV.', 'A large i₀ means a “reversible” electrode (Pt for H⁺/H₂, ~10⁻³ A/cm²): little overpotential is needed. A small i₀ (Hg for H₂, ~10⁻¹² A/cm²) needs hundreds of mV.') +
        (massa ? '<br>' + t('Con il trasporto di massa la corrente si appiattisce sulla corrente limite: la diffusione non tiene il passo.', 'With mass transport the current flattens at the limiting current: diffusion cannot keep up.') : '');
    }
    disegna(); F.alRidimensiona(disegna);
  }

  function schedaTafel(div) {
    var G = griglia(div), T = 298.15;
    G.pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('Dati: η (V) e i (A/cm²) per riga. Esempio simulato: i₀ = 2·10⁻⁶, αₐ = 0,4.', 'Data: η (V) and i (A/cm²) per line. Simulated example: i₀ = 2·10⁻⁶, αₐ = 0.4.') }));
    var esempio = [], pe = { i0: 2e-6, aa: 0.4, ac: 0.6, T: 298.15 };
    [-0.30, -0.25, -0.20, -0.15, 0.15, 0.20, 0.25, 0.30].forEach(function (e) { esempio.push(e.toFixed(2) + ' ' + butlerVolmer(e, pe).toExponential(4)); });
    var ta = areaDati(esempio.join('\n'), 'dati'); G.pan.appendChild(ta);
    F.bottone(G.pan, ['Analizza', 'Analyse'], calcola);
    var out = F.el('div', { 'class': 'bsiFX-nota' }); G.pan.appendChild(out);
    var c = F.tela(G.dx, 0.6);
    function calcola() {
      var d = leggiCoppie(ta.value), r = tafel(d, T, 0.1);
      out.innerHTML = (r.an ? t('Ramo anodico: ', 'Anodic branch: ') + '<b>' + r.an.pend.toFixed(1) + ' mV/dec</b>, αₐ = ' + r.an.alfa.toFixed(3) + ', i₀ = ' + r.an.i0.toExponential(2) + ' A/cm² (R² ' + r.an.r2.toFixed(4) + ')<br>' : '') +
        (r.ca ? t('Ramo catodico: ', 'Cathodic branch: ') + '<b>' + Math.abs(r.ca.pend).toFixed(1) + ' mV/dec</b>, α_c = ' + r.ca.alfa.toFixed(3) + ', i₀ = ' + r.ca.i0.toExponential(2) + ' A/cm² (R² ' + r.ca.r2.toFixed(4) + ')<br>' : '') +
        t('Si usano solo i punti con |η| > 100 mV, dove uno dei due esponenziali è trascurabile: sotto, la retta non vale.', 'Only points with |η| > 100 mV are used, where one exponential is negligible: below that, the line does not hold.');
      F.grafico(c, { punti: d.map(function (p) { return { x: p[0] * 1000, y: Math.log10(Math.abs(p[1])), col: Math.abs(p[0]) > 0.1 ? '#ffd24a' : '#8494a8', r: 4 }; }), xl: 'η (mV)', yl: 'log₁₀ |i|' });
    }
    calcola(); F.alRidimensiona(calcola);
  }

  function schedaEyring(div) {
    var G = griglia(div), dG = 80, T = 298.15;
    F.cursore(G.pan, ['ΔG‡ (kJ/mol)', 'ΔG‡ (kJ/mol)'], 20, 140, 1, dG, function (v) { dG = v; aggiorna(); });
    F.cursore(G.pan, ['T (K)', 'T (K)'], 200, 600, 1, 298, function (v) { T = v; aggiorna(); });
    var info = F.el('div', { 'class': 'bsiFX-eq' }); G.pan.appendChild(info);
    G.pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('Dati sperimentali k(T): T (K) e k (s⁻¹) per riga. Esempio: idrolisi del cloruro di t-butile (valori illustrativi).', 'Experimental k(T) data: T (K) and k (s⁻¹) per line. Example: t-butyl chloride hydrolysis (illustrative values).') }));
    var ta = areaDati('288 1.07e-5\n298 3.36e-5\n308 9.92e-5\n318 2.76e-4\n328 7.25e-4', 'dati'); ta.rows = 6; G.pan.appendChild(ta);
    F.bottone(G.pan, ['Retta di Eyring', 'Eyring plot'], aggiorna);
    var out = F.el('div', { 'class': 'bsiFX-nota' }); G.pan.appendChild(out);
    var c = F.tela(G.dx, 0.6);
    function aggiorna() {
      var k = eyring(dG * 1000, T), t12 = Math.LN2 / k;
      info.innerHTML = 'k = (k<sub>B</sub>T/h)·e<sup>−ΔG‡/RT</sup><br>k<sub>B</sub>T/h = ' + (kB * T / h).toExponential(3) + ' s⁻¹<br>k = <b>' + k.toExponential(3) + ' s⁻¹</b> · t½ = ' + (t12 < 120 ? t12.toPrecision(3) + ' s' : t12 < 7200 ? (t12 / 60).toPrecision(3) + ' min' : t12 < 3.2e7 * 2 ? (t12 / 3600).toPrecision(3) + ' h' : (t12 / 3.156e7).toPrecision(3) + t(' anni', ' years')) +
        '<br><span style="color:#9fb1c6">' + t('Ogni 5,7 kJ/mol in più di ΔG‡ la reazione rallenta di 10 volte a 298 K.', 'Each extra 5.7 kJ/mol of ΔG‡ slows the reaction tenfold at 298 K.') + '</span>';
      var d = leggiCoppie(ta.value);
      if (d.length >= 2) {
        var r = fitEyring(d);
        out.innerHTML = 'ΔH‡ = <b>' + (r.dH / 1000).toFixed(1) + ' ± ' + (r.sdH / 1000).toFixed(1) + ' kJ/mol</b> · ΔS‡ = <b>' + r.dS.toFixed(1) + ' ± ' + r.sdS.toFixed(1) + ' J/(mol·K)</b>' +
          '<br>ΔG‡(298 K) = ' + ((r.dH - 298.15 * r.dS) / 1000).toFixed(1) + ' kJ/mol · Arrhenius: Eₐ = ' + (r.Ea / 1000).toFixed(1) + ' kJ/mol (≈ ΔH‡ + RT = ' + ((r.dH + R * d.reduce(function (s, p) { return s + p[0]; }, 0) / d.length) / 1000).toFixed(1) + ')' +
          '<br>' + t('ΔS‡ negativo: lo stato di transizione è più ordinato dei reagenti (associazione, solvatazione); positivo: dissociativo.', 'Negative ΔS‡: the transition state is more ordered than the reactants (association, solvation); positive: dissociative.');
        var xs = d.map(function (p) { return 1000 / p[0]; }), ys = d.map(function (p) { return Math.log(p[1] / p[0]); }), m = -r.dH / R, q = Math.log(kB / h) + r.dS / R;
        F.grafico(c, { punti: xs.map(function (x, i) { return { x: x, y: ys[i], col: '#ffd24a', r: 5 }; }), serie: [{ x: [Math.min.apply(null, xs), Math.max.apply(null, xs)], y: [m * Math.min.apply(null, xs) / 1000 + q, m * Math.max.apply(null, xs) / 1000 + q], col: '#5eead4' }], xl: '1000/T (K⁻¹)', yl: 'ln(k/T)' });
      }
    }
    aggiorna(); F.alRidimensiona(aggiorna);
  }

  F.calcolo.elettrodi = { butlerVolmer: butlerVolmer, tafel: tafel, eyring: eyring, fitEyring: fitEyring, retta: retta };

  F.sezione('selettrodi', {
    titolo: ['⚡ Elettrodi e stato di transizione', '⚡ Electrodes and transition state'],
    sotto: ['La cinetica degli elettrodi (Butler-Volmer, corrente di scambio, sovratensione, Tafel, trasporto di massa) e la teoria dello stato di transizione di Eyring, con le rette dai dati sperimentali.',
            'Electrode kinetics (Butler-Volmer, exchange current, overpotential, Tafel, mass transport) and Eyring’s transition-state theory, with lines fitted to experimental data.'],
    schede: [
      { nome: ['Butler-Volmer', 'Butler-Volmer'], costruisci: schedaBV },
      { nome: ['Tafel dai dati', 'Tafel from data'], costruisci: schedaTafel },
      { nome: ['Eyring', 'Eyring'], costruisci: schedaEyring }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
