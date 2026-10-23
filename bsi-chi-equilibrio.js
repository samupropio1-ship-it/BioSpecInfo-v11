/* ═══════════════════════════════════════════════════════════════════════════
   bsi-chi-equilibrio.js — ⚖️ equilibrio chimico e Le Chatelier
   BioSpecInfo · © Samuele Pio Provenzano

   L'equilibrio non e' una cosa ferma: e' il punto in cui due velocita' si
   uguagliano. Qui la reazione aA + bB ⇌ cC + dD procede secondo la legge
   d'azione di massa (v→ = k[A]^a[B]^b, v← = k/K [C]^c[D]^d), le
   concentrazioni si muovono nel tempo e si fermano dove Q = K. Poi si
   disturba il sistema, come nel laboratorio:

   · si aggiunge o si toglie una specie;
   · si cambia il volume (gas): le concentrazioni scalano tutte, e lo
     spostamento dipende da Δn gassoso;
   · si cambia la temperatura: K segue van 't Hoff, ln(K₂/K₁) = −ΔH°/R
     (1/T₂ − 1/T₁).

   Il sistema risponde da solo, e si vede da che parte (Le Chatelier) e di
   quanto. La seconda scheda e' K in funzione di T: ΔG° = ΔH° − TΔS°, la
   temperatura in cui K = 1 e il diagramma di van 't Hoff.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt, R = 8.314462618;
  function griglia(div) { var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); G.appendChild(pan); G.appendChild(dx); div.appendChild(G); return { pan: pan, dx: dx }; }
  function nota(pan) { var n = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(n); return n; }

  /* le reazioni: specie, coefficienti (negativi i reagenti), stato, K a 298 K, ΔH° e ΔS° */
  var REAZIONI = {
    haber: { nome: 'N₂ + 3 H₂ ⇌ 2 NH₃', sp: ['N₂', 'H₂', 'NH₃'], nu: [-1, -3, 2], gas: true, dH: -92.2, dS: -198.7, c0: [1, 3, 0], T: 700 },
    hi: { nome: 'H₂ + I₂ ⇌ 2 HI', sp: ['H₂', 'I₂', 'HI'], nu: [-1, -1, 2], gas: true, dH: -9.4, dS: 21.8, c0: [1, 1, 0], T: 700 },
    n2o4: { nome: 'N₂O₄ ⇌ 2 NO₂', sp: ['N₂O₄', 'NO₂'], nu: [-1, 2], gas: true, dH: 57.2, dS: 175.8, c0: [1, 0], T: 350 },
    ester: { nome: 'CH₃COOH + C₂H₅OH ⇌ CH₃COOC₂H₅ + H₂O', sp: ['AcOH', 'EtOH', 'AcOEt', 'H₂O'], nu: [-1, -1, 1, 1], gas: false, K298: 4, dH: -4, dS: -2.0, c0: [1, 1, 0, 0], T: 298 },
    co: { nome: 'CO + H₂O ⇌ CO₂ + H₂', sp: ['CO', 'H₂O', 'CO₂', 'H₂'], nu: [-1, -1, 1, 1], gas: true, dH: -41.2, dS: -42.1, c0: [1, 1, 0, 0], T: 900 }
  };
  /* K in concentrazioni (mol/L): Kc = Kp (RT/p°)^(−Δn), Kp = exp(−ΔG°/RT) */
  function costante(Rx, T) {
    var dG = Rx.dH * 1000 - T * Rx.dS, Kp = Math.exp(-dG / (R * T)), dn = Rx.nu.reduce(function (s, v) { return s + v; }, 0);
    if (!Rx.gas) return { K: Rx.K298 !== undefined ? Rx.K298 * Math.exp(-Rx.dH * 1000 / R * (1 / T - 1 / 298.15)) : Kp, dG: dG, dn: 0 };
    return { K: Kp * Math.pow(0.0831446 * T, -dn), Kp: Kp, dG: dG, dn: dn };
  }
  function quoziente(Rx, c) { var Q = 1; Rx.nu.forEach(function (v, i) { Q *= Math.pow(Math.max(c[i], 1e-300), v); }); return Q; }
  /* l'equilibrio esatto: avanzamento ξ con Q(ξ) = K, per bisezione su ln Q (monotona in ξ) */
  function equilibrio(Rx, c0, K) {
    var lo = -Infinity, hi = Infinity;
    Rx.nu.forEach(function (v, i) { var lim = -c0[i] / v; if (v < 0) hi = Math.min(hi, lim); else lo = Math.max(lo, lim); });
    var f = function (x) { return Rx.nu.reduce(function (s, v, i) { return s + v * Math.log(Math.max(c0[i] + v * x, 1e-300)); }, 0) - Math.log(K); };
    var a = lo + 1e-15 * (1 + Math.abs(lo)), b = hi - 1e-15 * (1 + Math.abs(hi));
    for (var i = 0; i < 200; i++) { var m = (a + b) / 2; if (f(m) > 0) b = m; else a = m; }
    var x = (a + b) / 2; return { xi: x, c: c0.map(function (c, i) { return Math.max(0, c + Rx.nu[i] * x); }) };
  }
  /* un passo di cinetica: velocita' netta = k(Π reagenti − Π prodotti / K) */
  function passo(Rx, c, K, k, dt) {
    function v(cc) { var a = 1, b = 1; Rx.nu.forEach(function (n, i) { if (n < 0) a *= Math.pow(Math.max(cc[i], 0), -n); else b *= Math.pow(Math.max(cc[i], 0), n); }); return k * (a - b / K); }
    /* Runge-Kutta 4 sull'avanzamento */
    var k1 = v(c), c2 = c.map(function (x, i) { return x + Rx.nu[i] * k1 * dt / 2; }), k2 = v(c2), c3 = c.map(function (x, i) { return x + Rx.nu[i] * k2 * dt / 2; }), k3 = v(c3), c4 = c.map(function (x, i) { return x + Rx.nu[i] * k3 * dt; }), k4 = v(c4);
    var dx = dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4);
    return c.map(function (x, i) { return Math.max(0, x + Rx.nu[i] * dx); });
  }
  F.calcolo.equilibrio = { REAZIONI: REAZIONI, costante: costante, quoziente: quoziente, equilibrio: equilibrio, passo: passo };

  var COLORI = ['#5eead4', '#ff8a80', '#ffd24a', '#6bcfff'];
  function schedaSimulatore(div) {
    var G = griglia(div), st = { r: 'haber' }, Rx, T, K, c, storia, tt, eventi, info, stato = F.el('div', { 'class': 'bsiFX-nota' }), bott = F.el('div', { style: 'display:flex;flex-wrap:wrap;gap:4px' });
    F.scelta(G.pan, ['Reazione', 'Reaction'], Object.keys(REAZIONI).map(function (k) { return [k, REAZIONI[k].nome]; }), st.r, function (v) { st.r = v; nuova(); });
    G.pan.appendChild(bott); info = nota(G.pan); G.pan.appendChild(stato);
    var c1 = F.tela(G.dx, 0.55);
    var ctl = null;
    function evento(nome) { eventi.push([tt, nome]); if (ctl) ctl.sveglia(); }
    function nuova() {
      Rx = REAZIONI[st.r]; T = Rx.T; K = costante(Rx, T).K; c = Rx.c0.slice(); storia = [[0].concat(c)]; tt = 0; eventi = [[0, t('inizio', 'start')]];
      bott.innerHTML = '';
      Rx.sp.forEach(function (s, i) {
        F.bottone(bott, ['+ ' + s, '+ ' + s], function () { c[i] += 0.5; evento('+' + s); });
        F.bottone(bott, ['− ' + s, '− ' + s], function () { c[i] = c[i] * 0.4; evento('−' + s); });
      });
      if (Rx.gas) { F.bottone(bott, ['Volume ÷ 2 (p × 2)', 'Volume ÷ 2 (p × 2)'], function () { c = c.map(function (x) { return 2 * x; }); evento('V/2'); }); F.bottone(bott, ['Volume × 2', 'Volume × 2'], function () { c = c.map(function (x) { return x / 2; }); evento('2V'); }); }
      F.bottone(bott, ['T + 50 K', 'T + 50 K'], function () { T += 50; K = costante(Rx, T).K; evento('T+50'); });
      F.bottone(bott, ['T − 50 K', 'T − 50 K'], function () { T = Math.max(200, T - 50); K = costante(Rx, T).K; evento('T−50'); });
      var k0 = costante(Rx, Rx.T);
      info.innerHTML = '<b>' + Rx.nome + '</b> · ΔH° = ' + Rx.dH + ' kJ/mol · ΔS° = ' + Rx.dS + ' J/(mol·K)' + (Rx.gas ? ' · Δn(gas) = ' + k0.dn : '') + '<br>' + t('Premi i pulsanti per disturbare l’equilibrio e guarda come il sistema reagisce.', 'Press the buttons to disturb the equilibrium and watch how the system responds.');
      if (ctl) ctl.sveglia();
    }
    function ciclo(dt) {
      /* scala dei tempi: k tale che il rilassamento duri qualche secondo */
      var kk = 0.6 / Math.max(1e-6, Math.pow(Math.max.apply(null, c), Math.max(1, -Rx.nu.filter(function (v) { return v < 0; }).reduce(function (s, v) { return s + v; }, 0)) - 1));
      /* 6 passi di 0,01 per fotogramma alla velocita' ×1 */
      var np = Math.round(dt * 60 * 6); for (var i = 0; i < np; i++) { c = passo(Rx, c, K, kk, 0.01); tt += 0.01; }
      storia.push([tt].concat(c)); if (storia.length > 2400) storia.splice(1, 1);
      var Q = quoziente(Rx, c), lr = Math.log10(Q / K);
      var o = F.grafico(c1, { serie: Rx.sp.map(function (s, j) { return { x: storia.map(function (r) { return r[0]; }), y: storia.map(function (r) { return r[j + 1]; }), col: COLORI[j], larg: 2.2, etich: s }; }), ymin: 0, xl: ['t', 't'], yl: [t('concentrazione (M)', 'concentration (M)'), t('concentrazione (M)', 'concentration (M)')], legenda: Rx.sp.map(function (s, j) { return { col: COLORI[j], etich: s }; }) });
      eventi.forEach(function (e) { var x = o.X(e[0]); o.q.strokeStyle = 'rgba(201,211,223,.35)'; o.q.setLineDash([3, 3]); o.q.beginPath(); o.q.moveTo(x, 14); o.q.lineTo(x, o.H - 40); o.q.stroke(); o.q.setLineDash([]); o.q.fillStyle = '#c9d3df'; o.q.font = '10px system-ui'; o.q.textAlign = 'left'; o.q.fillText(e[1], x + 3, 24); });
      var verso = Math.abs(lr) < 0.002 ? t('<b>all’equilibrio</b> (Q = K): le due velocità sono uguali', '<b>at equilibrium</b> (Q = K): the two rates are equal') : lr < 0 ? t('Q < K: la reazione procede <b>verso destra →</b>', 'Q < K: the reaction proceeds <b>to the right →</b>') : t('Q > K: la reazione procede <b>verso sinistra ←</b>', 'Q > K: the reaction proceeds <b>to the left ←</b>');
      stato.innerHTML = 'T = ' + T + ' K · K = <b class="bsiFX-num">' + (K < 1e-3 || K > 1e4 ? K.toExponential(3) : fmt(K)) + '</b> · Q = ' + (Q < 1e-3 || Q > 1e4 ? Q.toExponential(3) : fmt(Q)) + '<br>' + verso + '<br>' + Rx.sp.map(function (s, j) { return s + ' ' + fmt(c[j]) + ' M'; }).join(' · ') +
        '<br>' + t('Le Chatelier: aggiungendo un reagente l’equilibrio si sposta verso i prodotti; comprimendo un gas verso il lato con meno moli gassose; scaldando nel verso endotermico (K cresce se ΔH° > 0).', 'Le Chatelier: adding a reactant shifts the equilibrium towards products; compressing a gas towards the side with fewer gas moles; heating in the endothermic direction (K grows if ΔH° > 0).');
      /* raggiunto l'equilibrio si ferma: la barra mostra ▶ e il prossimo disturbo la risveglia */
      if (Math.abs(lr) < 1e-4 && tt - eventi[eventi.length - 1][0] > 0.5) return false;
    }
    nuova();
    ctl = F.anima(c1, ciclo, { ricomincia: function () { var c0 = ctl; ctl = null; nuova(); ctl = c0; } });
  }

  function schedaTemperatura(div) {
    var G = griglia(div), st = { r: 'haber' }, info = F.el('div', { 'class': 'bsiFX-nota' });
    F.scelta(G.pan, ['Reazione', 'Reaction'], Object.keys(REAZIONI).map(function (k) { return [k, REAZIONI[k].nome]; }), st.r, function (v) { st.r = v; disegna(); });
    G.pan.appendChild(info);
    var c = F.tela(G.dx, 0.45), c2 = F.tela(G.dx, 0.45);
    function disegna() {
      var Rx = REAZIONI[st.r], xs = [], lk = [], dg = [], inv = [], lnk = [];
      for (var T = 200; T <= 1500; T += 10) { var k = costante(Rx, T); xs.push(T); lk.push(Math.log10(Rx.gas ? k.Kp : k.K)); dg.push(k.dG / 1000); inv.push(1000 / T); lnk.push(Math.log(Rx.gas ? k.Kp : k.K)); }
      F.grafico(c, { serie: [{ x: xs, y: dg, col: '#ffd24a', larg: 2, etich: 'ΔG°' }], linee: [{ y: 0, col: '#8494a8', etich: 'ΔG° = 0 (K = 1)' }], xl: ['T (K)', 'T (K)'], yl: ['ΔG° (kJ/mol)', 'ΔG° (kJ/mol)'] });
      F.grafico(c2, { serie: [{ x: inv, y: lnk, col: '#5eead4', larg: 2, etich: 'ln K' }], xl: ['1000/T (K⁻¹)', '1000/T (K⁻¹)'], yl: ['ln K', 'ln K'] });
      var Tx = Rx.dH * 1000 / Rx.dS;
      info.innerHTML = '<b>' + Rx.nome + '</b><br>ΔG° = ΔH° − TΔS° = ' + Rx.dH + ' kJ/mol − T·(' + Rx.dS + ' J/(mol·K))<br>' + (Tx > 0 && isFinite(Tx) ? t('K = 1 a ', 'K = 1 at ') + 'T = ΔH°/ΔS° = <b>' + fmt(Tx) + ' K</b> (' + fmt(Tx - 273.15) + ' °C); ' + (Rx.dH < 0 ? t('sotto è favorita la formazione dei prodotti', 'below, products are favoured') : t('sopra è favorita la formazione dei prodotti', 'above, products are favoured')) : t('ΔH° e ΔS° hanno segni che non danno un incrocio: il segno di ΔG° non cambia con T.', 'ΔH° and ΔS° have signs that give no crossing: the sign of ΔG° does not change with T.')) +
        '<br>' + t('Qui ΔH° e ΔS° sono presi costanti con T (approssimazione di Ellingham, dai valori tabulati a 298 K): lontano da 298 K la K calcolata è indicativa (per HI a 700 K dà ', 'Here ΔH° and ΔS° are taken as constant with T (Ellingham approximation, from tabulated 298 K values): far from 298 K the computed K is indicative (for HI at 700 K it gives ') + fmt(costante(REAZIONI.hi, 700).K) + t(', la misura è circa 54).', ', the measured value is about 54).') +
        '<br>' + t('Diagramma di van ’t Hoff: ln K contro 1/T è una retta di pendenza −ΔH°/R = ', 'Van ’t Hoff plot: ln K against 1/T is a straight line with slope −ΔH°/R = ') + fmt(-Rx.dH * 1000 / R / 1000) + ' (×1000 K)' + (st.r === 'haber' ? '<br>' + t('Haber-Bosch: a bassa T K è grande ma la reazione è lentissima; a 700 K è veloce ma K è piccola: per questo si lavora a 150–300 bar (Δn = −2, la pressione spinge verso NH₃) con un catalizzatore al ferro.', 'Haber-Bosch: at low T K is large but the reaction is very slow; at 700 K it is fast but K is small: that is why it runs at 150–300 bar (Δn = −2, pressure pushes towards NH₃) with an iron catalyst.') : '');
    }
    disegna(); F.alRidimensiona(disegna);
  }

  F.sezione('schiequil', {
    titolo: ['⚖️ Equilibrio e Le Chatelier', '⚖️ Equilibrium and Le Chatelier'],
    sotto: ['Una reazione che raggiunge l’equilibrio sotto i tuoi occhi, e risponde quando aggiungi una specie, cambi il volume o la temperatura; K in funzione di T con ΔG° e il diagramma di van ’t Hoff.', 'A reaction reaching equilibrium before your eyes, responding when you add a species or change volume or temperature; K as a function of T with ΔG° and the van ’t Hoff plot.'],
    schede: [
      { nome: ['⚖️ Simulatore', '⚖️ Simulator'], costruisci: schedaSimulatore },
      { nome: ['🌡️ K e temperatura', '🌡️ K and temperature'], costruisci: schedaTemperatura }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
