/* ═══════════════════════════════════════════════════════════════════════════
   bsi-fis-termostat.js — la termodinamica statistica
   BioSpecInfo · © Samuele Pio Provenzano

   Dalle proprieta' di UNA molecola (massa, costanti rotazionali, frequenze
   di vibrazione, degenerazione elettronica) alle grandezze di una MOLE di
   gas ideale: entropia, capacita' termica, entalpia, energia libera. E' il
   ponte fra la spettroscopia e la termodinamica.

     traslazione   S = R [ ln(kT/(p°Λ³)) + 5/2 ]         (Sackur-Tetrode)
                   Λ = h / √(2πmkT)
     rotazione     lineare:     q = kT/(σhcB)
                   non lineare: q = (√π/σ) (kT/hc)^3/2 / √(ABC)
     vibrazione    q = Π 1/(1 − e^(−θ/T)),  θ = hcν̃/k (zero all'energia di punto zero)
     elettronica   q = g₀

   La verifica (il banco la ripete): le entropie standard a 298,15 K e 1 bar
   delle tavole NIST-JANAF / CODATA — Ar 154,85, N₂ 191,61, O₂ 205,15,
   H₂O 188,84, CO₂ 213,79, CH₄ 186,25, NH₃ 192,77 J mol⁻¹ K⁻¹.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t;
  var h = 6.62607015e-34, kB = 1.380649e-23, NA = 6.02214076e23, cc = 2.99792458e10, u = 1.66053906660e-27, R = 8.314462618, P0 = 1e5, HC_K = 1.438776877;

  /* masse (u), simmetria σ, costanti rotazionali (cm⁻¹), frequenze (cm⁻¹, ripetute
     per la degenerazione), g₀; S° di riferimento (J mol⁻¹ K⁻¹, 298,15 K, 1 bar) */
  var GAS = {
    Ar:  { nome: 'Ar', m: 39.948, tipo: 'atomo', g0: 1, rif: 154.85 },
    N2:  { nome: 'N₂', m: 28.0134, tipo: 'lineare', sigma: 2, B: 1.99824, nu: [2358.6], g0: 1, rif: 191.61 },
    O2:  { nome: 'O₂', m: 31.998, tipo: 'lineare', sigma: 2, B: 1.43768, nu: [1580.2], g0: 3, rif: 205.15 },
    CO:  { nome: 'CO', m: 28.010, tipo: 'lineare', sigma: 1, B: 1.93128, nu: [2169.8], g0: 1, rif: 197.66 },
    HCl: { nome: 'HCl', m: 36.461, tipo: 'lineare', sigma: 1, B: 10.5934, nu: [2990.9], g0: 1, rif: 186.90 },
    CO2: { nome: 'CO₂', m: 44.009, tipo: 'lineare', sigma: 2, B: 0.39021, nu: [1388.2, 667.4, 667.4, 2349.2], g0: 1, rif: 213.79 },
    H2O: { nome: 'H₂O', m: 18.0153, tipo: 'nonlineare', sigma: 2, ABC: [27.8806, 14.5216, 9.2778], nu: [3657.1, 1594.7, 3755.9], g0: 1, rif: 188.84 },
    NH3: { nome: 'NH₃', m: 17.0305, tipo: 'nonlineare', sigma: 3, ABC: [9.4443, 9.4443, 6.1960], nu: [3336.2, 932.5, 3443.6, 3443.6, 1626.1, 1626.1], g0: 1, rif: 192.77 },
    CH4: { nome: 'CH₄', m: 16.0425, tipo: 'nonlineare', sigma: 12, ABC: [5.2410, 5.2410, 5.2410], nu: [2917, 1534, 1534, 3019, 3019, 3019, 1306, 1306, 1306], g0: 1, rif: 186.25 }
  };

  function contributi(g, T, p) {
    p = p || P0;
    var m = g.m * u, Lam = h / Math.sqrt(2 * Math.PI * m * kB * T);
    var out = { trasl: { S: R * (Math.log(kB * T / (p * Lam * Lam * Lam)) + 2.5), Cv: 1.5 * R, U: 1.5 * R * T } };
    if (g.tipo === 'lineare') {
      var q = 1 / (HC_K * g.sigma * g.B / T);
      out.rot = { S: R * (Math.log(q) + 1), Cv: R, U: R * T, q: q };
    } else if (g.tipo === 'nonlineare') {
      var qn = Math.sqrt(Math.PI) / g.sigma * Math.pow(T / HC_K, 1.5) / Math.sqrt(g.ABC[0] * g.ABC[1] * g.ABC[2]);
      out.rot = { S: R * (Math.log(qn) + 1.5), Cv: 1.5 * R, U: 1.5 * R * T, q: qn };
    }
    if (g.nu) {
      var S = 0, Cv = 0, U = 0;
      g.nu.forEach(function (n) {
        var x = HC_K * n / T, e = Math.exp(-x);
        S += R * (x * e / (1 - e) - Math.log(1 - e));
        Cv += R * x * x * e / ((1 - e) * (1 - e));
        U += R * T * x * e / (1 - e);
      });
      out.vib = { S: S, Cv: Cv, U: U, ZPE: g.nu.reduce(function (s, n) { return s + n; }, 0) / 2 * h * cc * NA / 1000 };
    }
    out.el = { S: R * Math.log(g.g0 || 1), Cv: 0, U: 0 };
    var tot = { S: 0, Cv: 0, U: 0 };
    ['trasl', 'rot', 'vib', 'el'].forEach(function (k) { if (out[k]) { tot.S += out[k].S; tot.Cv += out[k].Cv; tot.U += out[k].U; } });
    tot.Cp = tot.Cv + R; tot.H = tot.U + R * T; tot.G = tot.H - T * tot.S;
    out.tot = tot;
    return out;
  }
  /* le popolazioni */
  function popRot(B, T, Jmax) {
    var p = [], Z = 0, J;
    for (J = 0; J <= Jmax; J++) { var v = (2 * J + 1) * Math.exp(-HC_K * B * J * (J + 1) / T); p.push(v); Z += v; }
    return p.map(function (v) { return v / Z; });
  }
  function popVib(nu, T, vmax) {
    var x = HC_K * nu / T, p = [], Z = 1 / (1 - Math.exp(-x));
    for (var v = 0; v <= vmax; v++) p.push(Math.exp(-x * v) / Z);
    return p;
  }
  F.calcolo.termostat = { GAS: GAS, contributi: contributi, popRot: popRot, popVib: popVib };

  function schedaEntropia(div) {
    var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), destra = F.el('div');
    g.appendChild(pan); g.appendChild(destra); div.appendChild(g);
    var gas = 'N2', T = 298.15;
    F.scelta(pan, ['Gas', 'Gas'], Object.keys(GAS).map(function (k) { return [k, GAS[k].nome]; }), gas, function (v) { gas = v; disegna(); });
    F.cursore(pan, ['Temperatura (K)', 'Temperature (K)'], 50, 3000, 5, T, function (v) { T = v; disegna(); }, function (v) { return v.toFixed(0) + ' K'; });
    var info = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(info);
    var tab = F.el('div'), c = F.tela(destra, 0.5); destra.appendChild(tab);
    function disegna() {
      var G = GAS[gas], r = contributi(G, T);
      var riga = function (n, x) { return x ? '<tr><td>' + n + '</td><td class="bsiFX-num">' + x.S.toFixed(2) + '</td><td class="bsiFX-num">' + x.Cv.toFixed(2) + '</td></tr>' : ''; };
      tab.innerHTML = '<table class="bsiFX-tab"><tr><th>' + t('contributo', 'contribution') + '</th><th>S (J mol⁻¹ K⁻¹)</th><th>Cv (J mol⁻¹ K⁻¹)</th></tr>' +
        riga(t('traslazione', 'translation'), r.trasl) + riga(t('rotazione', 'rotation'), r.rot) + riga(t('vibrazione', 'vibration'), r.vib) + riga(t('elettronica', 'electronic'), r.el) +
        '<tr><th>' + t('totale', 'total') + '</th><th class="bsiFX-num">' + r.tot.S.toFixed(2) + '</th><th class="bsiFX-num">' + r.tot.Cv.toFixed(2) + '</th></tr></table>';
      var r298 = contributi(G, 298.15);
      info.innerHTML = 'S°(298,15 K) ' + t('calcolata', 'computed') + ': <b class="bsiFX-num">' + r298.tot.S.toFixed(2) + '</b><br>' +
        t('tavole NIST-JANAF', 'NIST-JANAF tables') + ': <b class="bsiFX-num">' + G.rif.toFixed(2) + '</b> (' + (r298.tot.S - G.rif >= 0 ? '+' : '') + (r298.tot.S - G.rif).toFixed(2) + ')<br>' +
        'Cp(' + T.toFixed(0) + ' K) = <b class="bsiFX-num">' + r.tot.Cp.toFixed(2) + '</b> J mol⁻¹ K⁻¹<br>' +
        (r.rot ? t('q rotazionale', 'rotational q') + ' = ' + r.rot.q.toFixed(1) + '<br>' : '') +
        (r.vib ? t('energia di punto zero', 'zero-point energy') + ' = ' + r.vib.ZPE.toFixed(2) + ' kJ/mol<br>' : '') + '<br>' +
        t('Lo scarto residuo è il modello (rotore rigido, oscillatore armonico): l’anarmonicità e l’accoppiamento rotazione-vibrazione valgono pochi decimi.', 'The remaining gap is the model (rigid rotor, harmonic oscillator): anharmonicity and rotation-vibration coupling are worth a few tenths.');
      var xs = [], ys = [], ys2 = [];
      for (var T2 = 50; T2 <= 3000; T2 += 25) { var q = contributi(G, T2); xs.push(T2); ys.push(q.tot.Cp / R); ys2.push(q.tot.S / R); }
      F.grafico(c, { serie: [{ x: xs, y: ys, col: '#5eead4' }], punti: [{ x: T, y: r.tot.Cp / R, col: '#ffd24a', r: 4 }], linee: [{ y: 2.5, col: '#34465f', etich: '5/2' }, { y: 3.5, col: '#34465f', etich: '7/2' }, { y: 4.5, col: '#34465f', etich: '9/2' }],
                     xl: ['temperatura (K)', 'temperature (K)'], yl: ['Cp / R', 'Cp / R'], ymin: 2, descr: ['capacità termica', 'heat capacity'] });
    }
    disegna();
    F.alRidimensiona(disegna);
  }

  function schedaPopolazioni(div) {
    var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), destra = F.el('div');
    g.appendChild(pan); g.appendChild(destra); div.appendChild(g);
    var gas = 'HCl', T = 298;
    var lineari = Object.keys(GAS).filter(function (k) { return GAS[k].tipo === 'lineare'; });
    F.scelta(pan, ['Molecola', 'Molecule'], lineari.map(function (k) { return [k, GAS[k].nome]; }), gas, function (v) { gas = v; disegna(); });
    F.cursore(pan, ['Temperatura (K)', 'Temperature (K)'], 10, 3000, 5, T, function (v) { T = v; disegna(); });
    var info = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(info);
    var c = F.tela(destra, 0.45), c2 = F.tela(destra, 0.35);
    function disegna() {
      var G = GAS[gas], Jmax = Math.min(80, Math.ceil(Math.sqrt(6 * T / (HC_K * G.B))) + 4), p = popRot(G.B, T, Jmax), pv = popVib(G.nu[0], T, 5);
      F.grafico(c, { barre: p.map(function (v, J) { return { x: J, y: v, col: '#5eead4', larg: 4 }; }), xmin: -0.5, xmax: Jmax + 0.5, ymin: 0,
                     xl: ['J', 'J'], yl: ['popolazione rotazionale', 'rotational population'] });
      F.grafico(c2, { barre: pv.map(function (v, n) { return { x: n, y: v, col: '#7c6fff', larg: 10 }; }), xmin: -0.5, xmax: 5.5, ymin: 0, ymax: 1.05, xl: ['v', 'v'], yl: ['popolazione vibrazionale', 'vibrational population'] });
      var Jp = Math.sqrt(T / (2 * HC_K * G.B)) - 0.5;
      info.innerHTML = t('J più popolato', 'Most populated J') + ' ≈ √(kT/2hcB) − ½ = <b class="bsiFX-num">' + Jp.toFixed(1) + '</b><br>' +
        t('Molecole in v = 1', 'Molecules in v = 1') + ': <b class="bsiFX-num">' + (pv[1] * 100).toPrecision(3) + ' %</b><br><br>' +
        t('A temperatura ambiente quasi tutte le molecole sono nello stato vibrazionale fondamentale, ma distribuite su molti livelli rotazionali: è la forma dei rami P e R dello spettro IR.',
          'At room temperature almost all molecules are in the vibrational ground state, but spread over many rotational levels: it is the shape of the P and R branches of the IR spectrum.');
    }
    disegna();
    F.alRidimensiona(disegna);
  }

  F.sezione('stermostat', {
    titolo: ['🎲 Termodinamica statistica', '🎲 Statistical thermodynamics'],
    sotto: ['Dalle costanti di una molecola alle grandezze di una mole: funzioni di partizione, entropia, capacità termica e popolazioni di Boltzmann, confrontate con le tavole NIST-JANAF.',
            'From the constants of one molecule to the quantities of a mole: partition functions, entropy, heat capacity and Boltzmann populations, compared with the NIST-JANAF tables.'],
    schede: [
      { nome: ['Entropia e Cp', 'Entropy and Cp'], costruisci: schedaEntropia },
      { nome: ['Popolazioni', 'Populations'], costruisci: schedaPopolazioni }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
