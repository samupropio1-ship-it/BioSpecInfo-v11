/* ═══════════════════════════════════════════════════════════════════════════
   bsi-fis-nucleare.js — radiochimica e fisica nucleare
   BioSpecInfo · © Samuele Pio Provenzano

   · LE CATENE DI DECADIMENTO: le equazioni di BATEMAN risolte esattamente,
     Nₙ(t) = N₁(0) Π_{i<n} λᵢ Σ_i e^(−λᵢt) / Π_{j≠i}(λⱼ − λᵢ),
     per il generatore ⁹⁹Mo/⁹⁹ᵐTc della medicina nucleare (equilibrio
     transitorio), ⁹⁰Sr/⁹⁰Y (equilibrio secolare), ²²⁶Ra/²²²Rn e ¹³¹I.
   · LA DATAZIONE: carbonio-14, potassio-argon, uranio-piombo — l'eta' dal
     rapporto misurato, con le costanti di decadimento raccomandate.
   · L'ENERGIA DI LEGAME: la formula semiempirica di Weizsäcker (volume,
     superficie, Coulomb, asimmetria, accoppiamento), la curva B/A con il
     massimo intorno al ferro, la valle di stabilita' Z(A).

   Emivite: NNDC/ENSDF (Brookhaven). Costanti di datazione: Steiger e Jäger
   (1977) per K e U, 5730 a per il ¹⁴C (emivita di Cambridge).
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t;
  var ANNO = 365.25 * 24;   /* ore in un anno */

  /* emivite in ore */
  var CATENE = {
    MoTc: { nome: ['⁹⁹Mo → ⁹⁹ᵐTc → ⁹⁹Tc (generatore medico)', '⁹⁹Mo → ⁹⁹ᵐTc → ⁹⁹Tc (medical generator)'], nuclidi: ['⁹⁹Mo', '⁹⁹ᵐTc', '⁹⁹Tc'], T: [65.94, 6.0067, 2.111e5 * ANNO], ramo: [0.876, 1], tmax: 120, unita: 'h' },
    SrY: { nome: ['⁹⁰Sr → ⁹⁰Y → ⁹⁰Zr (equilibrio secolare)', '⁹⁰Sr → ⁹⁰Y → ⁹⁰Zr (secular equilibrium)'], nuclidi: ['⁹⁰Sr', '⁹⁰Y', '⁹⁰Zr'], T: [28.79 * ANNO, 64.0, Infinity], ramo: [1, 1], tmax: 600, unita: 'h' },
    RaRn: { nome: ['²²⁶Ra → ²²²Rn → ²¹⁸Po', '²²⁶Ra → ²²²Rn → ²¹⁸Po'], nuclidi: ['²²⁶Ra', '²²²Rn', '²¹⁸Po'], T: [1600 * ANNO, 91.76, 3.098 / 60], ramo: [1, 1], tmax: 1000, unita: 'h' },
    I131: { nome: ['¹³¹I → ¹³¹Xe (terapia della tiroide)', '¹³¹I → ¹³¹Xe (thyroid therapy)'], nuclidi: ['¹³¹I', '¹³¹Xe'], T: [8.0252 * 24, Infinity], ramo: [1], tmax: 1500, unita: 'h' }
  };
  function bateman(lam, ramo, N0, tt) {
    var n = lam.length, out = [];
    for (var k = 0; k < n; k++) {
      if (k === 0) { out.push(N0 * Math.exp(-lam[0] * tt)); continue; }
      var pref = N0, s = 0;
      for (var i = 0; i < k; i++) pref *= lam[i] * (ramo[i] != null ? ramo[i] : 1);
      for (i = 0; i <= k; i++) {
        var den = 1; for (var j = 0; j <= k; j++) if (j !== i) den *= (lam[j] - lam[i]);
        s += Math.exp(-lam[i] * tt) / den;
      }
      out.push(pref * s);
    }
    return out;
  }
  function lambda(T) { return isFinite(T) ? Math.LN2 / T : 0; }
  /* datazione */
  var C14 = 5730, LAMK = 5.543e-10, KEC = 0.1048, LAMU238 = 1.55125e-10, LAMU235 = 9.8485e-10;
  function etaC14(frazione) { return -C14 / Math.LN2 * Math.log(frazione); }
  function etaKAr(ArK) { return Math.log(1 + ArK / KEC) / LAMK; }
  function etaUPb(PbU) { return Math.log(1 + PbU) / LAMU238; }
  /* Weizsäcker: aV, aS, aC, aA, aP (MeV) */
  var SEMF = { aV: 15.75, aS: 17.8, aC: 0.711, aA: 23.7, aP: 11.18 };
  function legame(Z, A) {
    var N = A - Z, d = (Z % 2 === 0 && N % 2 === 0) ? 1 : (Z % 2 === 1 && N % 2 === 1) ? -1 : 0;
    return SEMF.aV * A - SEMF.aS * Math.pow(A, 2 / 3) - SEMF.aC * Z * (Z - 1) / Math.pow(A, 1 / 3) - SEMF.aA * (N - Z) * (N - Z) / A + d * SEMF.aP / Math.sqrt(A);
  }
  function zStabile(A) { return A / (2 + SEMF.aC / (2 * SEMF.aA) * Math.pow(A, 2 / 3)); }
  F.calcolo.nucleare = { CATENE: CATENE, bateman: bateman, lambda: lambda, etaC14: etaC14, etaKAr: etaKAr, etaUPb: etaUPb, legame: legame, zStabile: zStabile, C14: C14 };

  function schedaCatene(div) {
    var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), destra = F.el('div');
    g.appendChild(pan); g.appendChild(destra); div.appendChild(g);
    var cat = 'MoTc', mostra = 'attivita';
    F.scelta(pan, ['Catena', 'Chain'], Object.keys(CATENE).map(function (k) { return [k, CATENE[k].nome]; }), cat, function (v) { cat = v; disegna(); });
    F.scelta(pan, ['Grandezza', 'Quantity'], [['attivita', ['attività A = λN', 'activity A = λN']], ['nuclei', ['numero di nuclei N', 'number of nuclei N']]], mostra, function (v) { mostra = v; disegna(); });
    var info = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(info);
    var c = F.tela(destra, 0.55);
    function disegna() {
      var C = CATENE[cat], lam = C.T.map(lambda), COL = ['#5eead4', '#ffd24a', '#7c6fff'], xs = [], ys = C.nuclidi.map(function () { return []; });
      for (var i = 0; i <= 400; i++) {
        var tt = C.tmax * i / 400, N = bateman(lam, C.ramo, 1, tt);
        xs.push(tt); N.forEach(function (v, k) { ys[k].push(mostra === 'attivita' ? v * lam[k] : v); });
      }
      var serie = ys.map(function (y, k) { return { x: xs, y: y, col: COL[k] }; }).filter(function (s, k) { return mostra === 'nuclei' || lam[k] > 0; });
      F.grafico(c, { serie: serie, ymin: 0, xl: ['tempo (ore)', 'time (hours)'], yl: mostra === 'attivita' ? ['attività (relativa)', 'activity (relative)'] : ['nuclei (frazione)', 'nuclei (fraction)'],
                     legenda: C.nuclidi.map(function (n, k) { return { col: COL[k], etich: n }; }).filter(function (L, k) { return mostra === 'nuclei' || lam[k] > 0; }) });
      var nota = '';
      if (cat === 'MoTc') {
        var tm = Math.log(lam[1] / lam[0]) / (lam[1] - lam[0]);
        nota = t('Equilibrio transitorio: l’attività del ⁹⁹ᵐTc è massima dopo t = ln(λ₂/λ₁)/(λ₂ − λ₁) = ', 'Transient equilibrium: the ⁹⁹ᵐTc activity peaks after t = ln(λ₂/λ₁)/(λ₂ − λ₁) = ') + '<b class="bsiFX-num">' + tm.toFixed(1) + ' h</b>. ' +
          t('Per questo negli ospedali il generatore si «munge» ogni giorno: il tecnezio ricresce in circa un giorno. Il 12,4 % dei decadimenti del Mo va direttamente al ⁹⁹Tc.', 'This is why hospitals “milk” the generator daily: technetium grows back in about a day. 12.4 % of Mo decays go directly to ⁹⁹Tc.');
      } else if (cat === 'SrY') nota = t('Equilibrio secolare: il padre (28,8 anni) vive tanto più del figlio (64 ore) che, dopo una decina di emivite del figlio, le due attività sono uguali.', 'Secular equilibrium: the parent (28.8 years) outlives the daughter (64 hours) so much that, after about ten daughter half-lives, the two activities are equal.');
      else if (cat === 'RaRn') nota = t('Il radon cresce verso l’attività del radio in circa un mese: è il gas radioattivo che si accumula negli scantinati.', 'Radon grows towards the radium activity in about a month: it is the radioactive gas that builds up in basements.');
      else nota = t('Decadimento semplice: dopo dieci emivite (80 giorni) resta un millesimo dello iodio.', 'Simple decay: after ten half-lives (80 days) one thousandth of the iodine is left.');
      info.innerHTML = C.nuclidi.map(function (n, k) { return n + ': t½ = ' + (isFinite(C.T[k]) ? (C.T[k] > 2 * ANNO ? (C.T[k] / ANNO).toPrecision(4) + t(' anni', ' years') : C.T[k] > 1 ? C.T[k].toPrecision(4) + ' h' : (C.T[k] * 60).toPrecision(4) + ' min') : t('stabile', 'stable')); }).join('<br>') + '<br><br>' + nota;
    }
    disegna();
    F.alRidimensiona(disegna);
  }

  function schedaDatazione(div) {
    var pan = F.el('div', { 'class': 'bsiFX-pannello' }); div.appendChild(pan);
    var out = F.el('div'), c = F.tela(div, 0.45);
    var metodo = 'C14', val = 0.5;
    F.scelta(pan, ['Metodo', 'Method'], [['C14', ['carbonio-14 (frazione di ¹⁴C rimasta)', 'carbon-14 (fraction of ¹⁴C left)']], ['KAr', ['potassio-argon (⁴⁰Ar/⁴⁰K)', 'potassium-argon (⁴⁰Ar/⁴⁰K)']], ['UPb', ['uranio-piombo (²⁰⁶Pb/²³⁸U)', 'uranium-lead (²⁰⁶Pb/²³⁸U)']]], metodo, function (v) {
      metodo = v; var cfg = { C14: [0.001, 1, 0.001, 0.5], KAr: [0.001, 2, 0.001, 0.1], UPb: [0.001, 1.5, 0.001, 0.3] }[v];
      cur.min = cfg[0]; cur.max = cfg[1]; cur.step = cfg[2]; cur.value = cfg[3]; val = cfg[3]; cur.dispatchEvent(new Event('input'));
    });
    var cur = F.cursore(pan, ['Rapporto misurato', 'Measured ratio'], 0.001, 1, 0.001, val, function (v) { val = v; calcola(); }, function (v) { return v.toFixed(3); });
    pan.appendChild(out);
    function calcola() {
      var eta, testo, xs = [], ys = [];
      if (metodo === 'C14') {
        eta = etaC14(val);
        testo = t('età = −(t½/ln 2) · ln(frazione), t½ = 5730 anni', 'age = −(t½/ln 2) · ln(fraction), t½ = 5730 years');
        for (var a = 0; a <= 50000; a += 250) { xs.push(a); ys.push(Math.exp(-Math.LN2 * a / C14)); }
      } else if (metodo === 'KAr') {
        eta = etaKAr(val);
        testo = t('età = (1/λ) ln(1 + (⁴⁰Ar/⁴⁰K)/f_CE), λ = 5,543×10⁻¹⁰ a⁻¹, f_CE = 0,1048', 'age = (1/λ) ln(1 + (⁴⁰Ar/⁴⁰K)/f_EC), λ = 5.543×10⁻¹⁰ y⁻¹, f_EC = 0.1048');
        for (a = 0; a <= 5e9; a += 2.5e7) { xs.push(a / 1e9); ys.push(KEC * (Math.exp(LAMK * a) - 1)); }
      } else {
        eta = etaUPb(val);
        testo = t('età = (1/λ₂₃₈) ln(1 + ²⁰⁶Pb/²³⁸U), λ₂₃₈ = 1,55125×10⁻¹⁰ a⁻¹', 'age = (1/λ₂₃₈) ln(1 + ²⁰⁶Pb/²³⁸U), λ₂₃₈ = 1.55125×10⁻¹⁰ y⁻¹');
        for (a = 0; a <= 5e9; a += 2.5e7) { xs.push(a / 1e9); ys.push(Math.exp(LAMU238 * a) - 1); }
      }
      var fmtEta = eta > 1e6 ? (eta / 1e9).toFixed(3) + t(' miliardi di anni', ' billion years') : Math.round(eta).toLocaleString() + t(' anni', ' years');
      out.innerHTML = '<div class="bsiFX-eq">' + testo + '</div>' + t('Età', 'Age') + ': <b class="bsiFX-num">' + fmtEta + '</b><div class="bsiFX-nota">' +
        (metodo === 'C14' ? t('Il ¹⁴C serve fino a circa 50 000 anni (otto-nove emivite): oltre ne resta troppo poco da misurare.', '¹⁴C works up to about 50,000 years (eight to nine half-lives): beyond that too little is left to measure.') :
                            t('L’età della Terra (4,54 miliardi di anni) viene proprio dagli isotopi dell’uranio e del piombo nelle meteoriti.', 'The age of the Earth (4.54 billion years) comes precisely from uranium and lead isotopes in meteorites.')) + '</div>';
      var ex = metodo === 'C14' ? eta : eta / 1e9;
      F.grafico(c, { serie: [{ x: xs, y: ys, col: '#5eead4' }], punti: [{ x: ex, y: val, col: '#ffd24a', r: 5 }], ymin: 0, xl: metodo === 'C14' ? ['età (anni)', 'age (years)'] : ['età (miliardi di anni)', 'age (billion years)'], yl: ['rapporto', 'ratio'] });
    }
    calcola();
    F.alRidimensiona(calcola);
  }

  function schedaLegame(div) {
    var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), destra = F.el('div');
    g.appendChild(pan); g.appendChild(destra); div.appendChild(g);
    var Z = 26, A = 56;
    F.cursore(pan, ['Numero atomico Z', 'Atomic number Z'], 1, 110, 1, Z, function (v) { Z = v; disegna(); });
    F.cursore(pan, ['Numero di massa A', 'Mass number A'], 2, 280, 1, A, function (v) { A = v; disegna(); });
    var info = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(info);
    var c = F.tela(destra, 0.5), c2 = F.tela(destra, 0.5);
    function disegna() {
      var xs = [], ys = [], zs = [];
      for (var a = 10; a <= 260; a++) { var z = Math.round(zStabile(a)); xs.push(a); ys.push(legame(z, a) / a); zs.push(zStabile(a)); }
      var BA = legame(Z, A) / A;
      F.grafico(c, { serie: [{ x: xs, y: ys, col: '#5eead4' }], punti: [{ x: A, y: BA, col: '#ffd24a', r: 5 }], xmin: 0, ymin: 5, ymax: 9.2, xl: ['A', 'A'], yl: ['B/A (MeV per nucleone)', 'B/A (MeV per nucleon)'] });
      F.grafico(c2, { serie: [{ x: xs.map(function (a, i) { return a - zs[i]; }), y: zs, col: '#7c6fff' }, { x: [0, 160], y: [0, 160], col: '#34465f', tratt: true }], punti: [{ x: A - Z, y: Z, col: '#ffd24a', r: 5 }],
                      xmin: 0, xmax: 160, ymin: 0, ymax: 110, xl: ['N (neutroni)', 'N (neutrons)'], yl: ['Z (protoni)', 'Z (protons)'], legenda: [{ col: '#7c6fff', etich: ['valle di stabilità', 'valley of stability'] }, { col: '#34465f', etich: 'N = Z' }] });
      var zs0 = zStabile(A);
      info.innerHTML = 'B(' + Z + ', ' + A + ') = <b class="bsiFX-num">' + legame(Z, A).toFixed(1) + ' MeV</b><br>B/A = <b class="bsiFX-num">' + BA.toFixed(3) + ' MeV</b><br>' +
        t('Z più stabile per A = ', 'Most stable Z for A = ') + A + ': ' + zs0.toFixed(1) + (Z > zs0 + 0.6 ? t(' → troppi protoni: decade β⁺ o per cattura elettronica', ' → too many protons: β⁺ or electron capture') : Z < zs0 - 0.6 ? t(' → troppi neutroni: decade β⁻', ' → too many neutrons: β⁻ decay') : t(' → sulla valle', ' → on the valley')) + '<br><br>' +
        t('Il massimo di B/A è vicino al ferro e al nichel: i nuclei più leggeri liberano energia fondendosi (le stelle), i più pesanti scindendosi (i reattori).', 'B/A peaks near iron and nickel: lighter nuclei release energy by fusing (stars), heavier ones by splitting (reactors).');
    }
    disegna();
    F.alRidimensiona(disegna);
  }

  F.sezione('snucleare', {
    titolo: ['☢️ Radiochimica e nucleare', '☢️ Radiochemistry and nuclear physics'],
    sotto: ['Le catene di decadimento con le equazioni di Bateman (il generatore di tecnezio degli ospedali), la datazione radiometrica, l’energia di legame e la valle di stabilità dalla formula di Weizsäcker.',
            'Decay chains with the Bateman equations (the hospitals’ technetium generator), radiometric dating, binding energy and the valley of stability from the Weizsäcker formula.'],
    schede: [
      { nome: ['Catene di decadimento', 'Decay chains'], costruisci: schedaCatene },
      { nome: ['Datazione', 'Dating'], costruisci: schedaDatazione },
      { nome: ['Energia di legame', 'Binding energy'], costruisci: schedaLegame }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
