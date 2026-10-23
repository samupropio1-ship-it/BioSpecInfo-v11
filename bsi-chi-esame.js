/* ═══════════════════════════════════════════════════════════════════════════
   bsi-chi-esame.js — 🎓 l'esame di Chimica, dalla base all'avanzatissimo
   BioSpecInfo · © Samuele Pio Provenzano

   I problemi numerici dei corsi di chimica del corso di laurea in Chimica
   (Chimica Generale e Inorganica, Chimica Analitica, Chimica Fisica), su
   quattro livelli:

   · BASE: moli e masse molari, formula minima, reagente limitante e resa,
     soluzioni, gas, proprieta' colligative, termochimica, cinetica,
     equilibri, acidi e basi, solubilita', elettrochimica, atomo di Bohr;
   · INTERMEDIO (analitica): titolazioni (curva acido debole-base forte),
     Lambert-Beer, gravimetria, complessometria, redox, acidi poliprotici
     con il bilancio di carica, frazioni di distribuzione;
   · AVANZATO (chimica fisica): Gibbs e van't Hoff, Clausius-Clapeyron,
     particella nella scatola per i polieni, rotore e oscillatore,
     Michaelis-Menten con inibizione;
   · AVANZATISSIMO: Sackur-Tetrode, Debye-Hückel e pH con le attivita',
     elettrodo a ossigeno in funzione del pH.

   Ogni problema si risolve con i dati dell'utente: legge, sostituzione,
   risultato con le unita'. Le reazioni si bilanciano da sole (nucleo della
   matrice di composizione, bsi-mat-lineare.js), le masse molari vengono
   dalle masse atomiche IUPAC.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t;
  var Rg = 8.314462618, Fa = 96485.33212, NA = 6.02214076e23, kB = 1.380649e-23, h = 6.62607015e-34, me = 9.1093837015e-31, c0 = 2.99792458e8, RL = 0.082057366;
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  var SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹', SUB = '₀₁₂₃₄₅₆₇₈₉';
  function n4(v) {
    if (!isFinite(v)) return v > 0 ? '∞' : v < 0 ? '−∞' : '—';
    if (v === 0) return '0';
    var a = Math.abs(v);
    if (a >= 1e-3 && a < 1e5) return String(+v.toPrecision(4)).replace('-', '−');
    var e = Math.floor(Math.log10(a)), m = v / Math.pow(10, e);
    if (Math.abs(+m.toPrecision(4)) >= 10) { m /= 10; e++; }
    return String(+m.toPrecision(4)).replace('-', '−') + '·10' + String(e).split('').map(function (ch) { return ch === '-' ? '⁻' : SUP[+ch]; }).join('');
  }
  function q(v, u) { return n4(v) + (u ? ' ' + u : ''); }
  function fChim(s) { return String(s).replace(/(\d+)/g, function (m, d, i, str) { var prima = str.charAt(i - 1); return /[A-Za-z)\]]/.test(prima) ? d.split('').map(function (c) { return SUB[+c]; }).join('') : d; }).replace(/\^(\d*)([+-])/g, function (m, n, s) { return (n ? n.split('').map(function (c) { return SUP[+c]; }).join('') : '') + (s === '+' ? '⁺' : '⁻'); }); }

  /* masse atomiche (IUPAC, valori convenzionali) */
  var MA = { H: 1.008, He: 4.0026, Li: 6.94, Be: 9.0122, B: 10.81, C: 12.011, N: 14.007, O: 15.999, F: 18.998, Ne: 20.180, Na: 22.990, Mg: 24.305, Al: 26.982, Si: 28.085, P: 30.974, S: 32.06, Cl: 35.45, Ar: 39.95, K: 39.098, Ca: 40.078, Sc: 44.956, Ti: 47.867, V: 50.942, Cr: 51.996, Mn: 54.938, Fe: 55.845, Co: 58.933, Ni: 58.693, Cu: 63.546, Zn: 65.38, Ga: 69.723, Ge: 72.630, As: 74.922, Se: 78.971, Br: 79.904, Kr: 83.798, Rb: 85.468, Sr: 87.62, Y: 88.906, Zr: 91.224, Mo: 95.95, Ru: 101.07, Rh: 102.91, Pd: 106.42, Ag: 107.87, Cd: 112.41, In: 114.82, Sn: 118.71, Sb: 121.76, Te: 127.60, I: 126.90, Xe: 131.29, Cs: 132.91, Ba: 137.33, La: 138.91, Ce: 140.12, Nd: 144.24, Gd: 157.25, W: 183.84, Pt: 195.08, Au: 196.97, Hg: 200.59, Tl: 204.38, Pb: 207.2, Bi: 208.98, U: 238.03 };
  function formula(s) { return F.calcolo.lineare.leggiFormula(String(s).trim()); }
  function massaMolare(s) {
    var f = formula(s), M = 0, parti = [];
    Object.keys(f.atomi).forEach(function (el) { if (!MA[el]) throw new Error(t('elemento sconosciuto: ', 'unknown element: ') + el); M += MA[el] * f.atomi[el]; parti.push({ el: el, n: f.atomi[el], m: MA[el] * f.atomi[el] }); });
    return { M: M, parti: parti };
  }
  function lista(s) { var o = {}; String(s).split(/[,;\n]/).forEach(function (p) { var m = /^\s*([^:=]+?)\s*[:=]\s*(-?[\d.,eE+-]+)\s*$/.exec(p); if (m) o[m[1].trim()] = +m[2].replace(',', '.'); }); return o; }
  function svolgimento() {
    var passi = [], ris = [];
    return { passi: passi, ris: ris,
      p: function (tit, html) { passi.push({ titolo: tit, html: html }); },
      f: function (tit, formula, sost, v, u) { passi.push({ titolo: tit, html: formula + (sost ? ' = ' + sost : '') + ' = <b>' + q(v, u) + '</b>' }); return v; },
      r: function (nome, v, u) { ris.push({ nome: nome, v: v, u: u }); return v; } };
  }
  function radiceFisica(coef, lo, hi) {
    /* la radice reale del polinomio (coefficienti dal grado 0) che cade in [lo, hi] */
    var C = globale.BSIMatCAS, r = C.radiciPolinomio(coef).filter(function (z) { return !z.im && z.re >= lo - 1e-12 && z.re <= hi + 1e-12; }).map(function (z) { return z.re; });
    return r.length ? r[0] : NaN;
  }
  function bisezione(f, a, b) { var fa = f(a); for (var i = 0; i < 200; i++) { var m = (a + b) / 2, fm = f(m); if ((fm > 0) === (fa > 0)) { a = m; fa = fm; } else b = m; } return (a + b) / 2; }

  var MODELLI = [
    /* ═════════════════ BASE — Chimica Generale e Inorganica ═════════════════ */
    { id: 'massamolare', liv: 0, arg: 'moli', nome: ['Massa molare, moli, composizione', 'Molar mass, moles, composition'], dati: [['f', ['formula', 'formula'], '', 'Ca3(PO4)2'], ['m', ['massa del campione', 'sample mass'], 'g', 10]],
      testo: function (d) { return ['Calcolare la massa molare di ' + fChim(d.f) + ', le moli e il numero di unità formula in ' + d.m + ' g, e la composizione percentuale in massa.', 'Compute the molar mass of ' + fChim(d.f) + ', the moles and number of formula units in ' + d.m + ' g, and the mass percentage composition.']; },
      risolvi: function (d, S) {
        var r = massaMolare(d.f);
        S.p(t('Massa molare', 'Molar mass'), r.parti.map(function (p) { return p.n + '·' + n4(MA[p.el]) + ' (' + p.el + ')'; }).join(' + ') + ' = <b>' + q(r.M, 'g/mol') + '</b>');
        var n = S.f(t('Moli', 'Moles'), 'n = m/M', n4(d.m) + '/' + n4(r.M), d.m / r.M, 'mol'), N = S.f(t('Unità formula', 'Formula units'), 'N = n·N_A', '', n * NA, '');
        S.p(t('Composizione percentuale', 'Percentage composition'), r.parti.map(function (p) { return p.el + ' ' + n4(100 * p.m / r.M) + ' %'; }).join(' · '));
        S.r('M', r.M, 'g/mol'); S.r('n', n, 'mol'); S.r('N', N, '');
      } },
    { id: 'formulaminima', liv: 0, arg: 'moli', nome: ['Formula minima e molecolare', 'Empirical and molecular formula'], dati: [['comp', ['composizione % (El: valore, …)', 'composition % (El: value, …)'], '', 'C: 40.0, H: 6.71, O: 53.29'], ['M', ['massa molare (0 se ignota)', 'molar mass (0 if unknown)'], 'g/mol', 180.16]],
      testo: function (d) { return ['Un composto ha composizione in massa ' + d.comp + '. Determinarne la formula minima' + (+d.M ? ' e, sapendo che M = ' + d.M + ' g/mol, la formula molecolare.' : '.'), 'A compound has mass composition ' + d.comp + '. Find its empirical formula' + (+d.M ? ' and, given M = ' + d.M + ' g/mol, its molecular formula.' : '.')]; },
      risolvi: function (d, S) {
        var c = lista(d.comp), els = Object.keys(c), mol = {};
        S.p(t('Moli in 100 g', 'Moles in 100 g'), els.map(function (e) { mol[e] = c[e] / MA[e]; return e + ': ' + n4(c[e]) + '/' + n4(MA[e]) + ' = ' + n4(mol[e]); }).join(' · '));
        var mn = Math.min.apply(null, els.map(function (e) { return mol[e]; })), rap = {};
        els.forEach(function (e) { rap[e] = mol[e] / mn; });
        var molt = 1; for (var k = 1; k <= 6; k++) { if (els.every(function (e) { return Math.abs(rap[e] * k - Math.round(rap[e] * k)) < 0.08; })) { molt = k; break; } }
        S.p(t('Rapporti (diviso per il minimo)', 'Ratios (divided by the smallest)'), els.map(function (e) { return e + ' ' + n4(rap[e]); }).join(' · ') + (molt > 1 ? t(' — si moltiplica per ', ' — multiply by ') + molt + t(' per avere interi', ' to get integers') : ''));
        var sub = {}; els.forEach(function (e) { sub[e] = Math.round(rap[e] * molt); });
        var minima = els.map(function (e) { return e + (sub[e] > 1 ? sub[e] : ''); }).join(''), Mmin = els.reduce(function (s, e) { return s + sub[e] * MA[e]; }, 0);
        S.p(t('Formula minima', 'Empirical formula'), '<b>' + fChim(minima) + '</b> (M = ' + q(Mmin, 'g/mol') + ')');
        S.r(t('formula minima', 'empirical formula') + ' ' + fChim(minima), Mmin, 'g/mol');
        if (+d.M) { var k2 = Math.round(+d.M / Mmin), mo = els.map(function (e) { return e + (sub[e] * k2 > 1 ? sub[e] * k2 : ''); }).join(''); S.p(t('Formula molecolare', 'Molecular formula'), 'M/M_min = ' + n4(+d.M / Mmin) + ' ≈ ' + k2 + ' ⇒ <b>' + fChim(mo) + '</b>'); S.r(t('formula molecolare', 'molecular formula') + ' ' + fChim(mo), k2 * Mmin, 'g/mol'); }
      } },
    { id: 'limitante', liv: 0, arg: 'stech', nome: ['Reagente limitante e resa', 'Limiting reagent and yield'], dati: [['rx', ['reazione (senza coefficienti)', 'reaction (no coefficients)'], '', 'Al + Cl2 -> AlCl3'], ['masse', ['masse dei reagenti (formula: g, …)', 'reagent masses (formula: g, …)'], '', 'Al: 10, Cl2: 30'], ['prod', ['prodotto di interesse', 'product of interest'], '', 'AlCl3'], ['reale', ['massa ottenuta (0 se non data)', 'mass obtained (0 if not given)'], 'g', 30]],
      testo: function (d) { return ['Per la reazione ' + fChim(d.rx.replace('->', '→')) + ' si fanno reagire ' + d.masse + ' (in g). Bilanciare, trovare il reagente limitante, la massa teorica di ' + fChim(d.prod) + (+d.reale ? ' e la resa percentuale se se ne ottengono ' + d.reale + ' g.' : '.'), 'For the reaction ' + fChim(d.rx.replace('->', '→')) + ', ' + d.masse + ' (in g) react. Balance it, find the limiting reagent, the theoretical mass of ' + fChim(d.prod) + (+d.reale ? ' and the percentage yield if ' + d.reale + ' g are obtained.' : '.')]; },
      risolvi: function (d, S) {
        var b = F.calcolo.lineare.bilancia(d.rx); if (!b.coeff) throw new Error(t('reazione non bilanciabile in modo unico', 'reaction cannot be balanced uniquely'));
        var lati = [[], []]; b.specie.forEach(function (s, j) { lati[b.lato[j]].push((b.coeff[j] > 1 ? b.coeff[j] + ' ' : '') + fChim(s)); });
        S.p(t('Bilanciamento', 'Balancing'), lati[0].join(' + ') + ' → ' + lati[1].join(' + '));
        var m = lista(d.masse), rap = [];
        Object.keys(m).forEach(function (s) { var j = b.specie.indexOf(s); if (j < 0) throw new Error(s + t(' non è nella reazione', ' is not in the reaction')); var M = massaMolare(s).M, n = m[s] / M; rap.push({ s: s, n: n, M: M, c: b.coeff[j], r: n / b.coeff[j] }); });
        S.p(t('Moli dei reagenti e rapporto moli/coefficiente', 'Reagent moles and moles/coefficient ratio'), rap.map(function (x) { return fChim(x.s) + ': ' + n4(x.n) + ' mol, ' + t('rapporto', 'ratio') + ' ' + n4(x.r); }).join('<br>'));
        var lim = rap.reduce(function (a, x) { return x.r < a.r ? x : a; });
        S.p(t('Reagente limitante', 'Limiting reagent'), t('Quello con il rapporto più piccolo: ', 'The one with the smallest ratio: ') + '<b>' + fChim(lim.s) + '</b>' + t(' (si esaurisce per primo).', ' (runs out first).'));
        var jp = b.specie.indexOf(d.prod), Mp = massaMolare(d.prod).M, np = lim.r * b.coeff[jp];
        var mt = S.f(t('Massa teorica di ', 'Theoretical mass of ') + fChim(d.prod), 'm = (n_lim/ν_lim)·ν_p·M_p', n4(lim.r) + '·' + b.coeff[jp] + '·' + n4(Mp), np * Mp, 'g');
        rap.filter(function (x) { return x !== lim; }).forEach(function (x) { S.p(t('Eccesso di ', 'Excess of ') + fChim(x.s), t('rimangono ', 'left over: ') + q((x.n - lim.r * x.c) * x.M, 'g')); });
        S.r(t('limitante', 'limiting') + ' ' + fChim(lim.s), lim.n, 'mol'); S.r('m_teorica', mt, 'g');
        if (+d.reale) { var resa = S.f(t('Resa percentuale', 'Percentage yield'), 'resa = m_reale/m_teorica·100', '', 100 * d.reale / mt, '%'); S.r(t('resa', 'yield'), resa, '%'); }
      } },
    { id: 'soluzioni', liv: 0, arg: 'sol', nome: ['Concentrazioni delle soluzioni', 'Solution concentrations'], dati: [['f', ['soluto (formula)', 'solute (formula)'], '', 'NaCl'], ['ms', ['massa del soluto', 'solute mass'], 'g', 5.85], ['V', ['volume della soluzione', 'solution volume'], 'mL', 250], ['mw', ['massa del solvente (acqua)', 'solvent mass (water)'], 'g', 248], ['Vf', ['volume finale dopo diluizione (0: nessuna)', 'final volume after dilution (0: none)'], 'mL', 1000]],
      testo: function (d) { return [d.ms + ' g di ' + fChim(d.f) + ' sono sciolti in acqua (' + d.mw + ' g) fino a ' + d.V + ' mL di soluzione. Calcolare molarità, molalità, frazione molare e la molarità dopo diluizione a ' + d.Vf + ' mL.', d.ms + ' g of ' + fChim(d.f) + ' are dissolved in water (' + d.mw + ' g) to ' + d.V + ' mL of solution. Compute molarity, molality, mole fraction and the molarity after dilution to ' + d.Vf + ' mL.']; },
      risolvi: function (d, S) {
        var M = massaMolare(d.f).M, n = S.f(t('Moli di soluto', 'Moles of solute'), 'n = m/M', n4(d.ms) + '/' + n4(M), d.ms / M, 'mol');
        var Mo = S.f(t('Molarità', 'Molarity'), 'c = n/V', n4(n) + '/' + n4(d.V / 1000) + ' L', n / (d.V / 1000), 'mol/L'), mo = S.f(t('Molalità', 'Molality'), 'b = n/m_solvente', '', n / (d.mw / 1000), 'mol/kg');
        var nw = d.mw / 18.015, x = S.f(t('Frazione molare del soluto', 'Solute mole fraction'), 'x = n/(n + n_acqua)', '', n / (n + nw), '');
        S.r('c', Mo, 'M'); S.r('b', mo, 'mol/kg'); S.r('x', x, '');
        if (+d.Vf) { var c2 = S.f(t('Diluizione', 'Dilution'), 'c₁V₁ = c₂V₂ ⇒ c₂ = c₁V₁/V₂', '', Mo * d.V / d.Vf, 'mol/L'); S.r('c₂', c2, 'M'); }
      } },
    { id: 'gas', liv: 0, arg: 'gas', nome: ['Gas: stato, massa molare, densità', 'Gases: state, molar mass, density'], dati: [['p', 'p', 'atm', 1.2], ['V', 'V', 'L', 2.5], ['T', 'T', 'K', 300], ['m', ['massa del gas', 'gas mass'], 'g', 3.86]],
      testo: function (d) { return [d.m + ' g di un gas occupano ' + d.V + ' L a ' + d.T + ' K e ' + d.p + ' atm. Trovare le moli, la massa molare e la densità del gas.', d.m + ' g of a gas occupy ' + d.V + ' L at ' + d.T + ' K and ' + d.p + ' atm. Find the moles, the molar mass and the gas density.']; },
      risolvi: function (d, S) { var n = S.f(t('Moli', 'Moles'), 'n = pV/(RT)', n4(d.p) + '·' + n4(d.V) + '/(0,08206·' + n4(d.T) + ')', d.p * d.V / (RL * d.T), 'mol'), M = S.f(t('Massa molare', 'Molar mass'), 'M = m/n', '', d.m / n, 'g/mol'), rho = S.f(t('Densità', 'Density'), 'ρ = m/V = pM/(RT)', '', d.m / d.V, 'g/L'); S.p(t('Ipotesi', 'Hint'), t('Confronta M con quella dei gas comuni: 28 N₂, 32 O₂, 44 CO₂, 16 CH₄, 64 SO₂.', 'Compare M with common gases: 28 N₂, 32 O₂, 44 CO₂, 16 CH₄, 64 SO₂.')); S.r('n', n, 'mol'); S.r('M', M, 'g/mol'); S.r('ρ', rho, 'g/L'); } },
    { id: 'dalton', liv: 0, arg: 'gas', nome: ['Miscela di gas (Dalton)', 'Gas mixture (Dalton)'], dati: [['moli', ['moli (gas: mol, …)', 'moles (gas: mol, …)'], '', 'N2: 0.78, O2: 0.21, Ar: 0.01'], ['P', ['pressione totale', 'total pressure'], 'atm', 1]],
      testo: function (d) { return ['Una miscela contiene ' + d.moli + ' (mol) alla pressione totale di ' + d.P + ' atm. Calcolare frazioni molari e pressioni parziali.', 'A mixture contains ' + d.moli + ' (mol) at a total pressure of ' + d.P + ' atm. Compute mole fractions and partial pressures.']; },
      risolvi: function (d, S) { var m = lista(d.moli), tot = Object.keys(m).reduce(function (s, k) { return s + m[k]; }, 0); S.p(t('Legge di Dalton', 'Dalton’s law'), 'p_i = x_i·P, x_i = n_i/n_tot, n_tot = ' + q(tot, 'mol')); Object.keys(m).forEach(function (k) { var x = m[k] / tot; S.p(fChim(k), 'x = ' + n4(x) + ' ⇒ p = <b>' + q(x * d.P, 'atm') + '</b>'); S.r('p(' + fChim(k) + ')', x * d.P, 'atm'); }); } },
    { id: 'colligative', liv: 0, arg: 'sol', nome: ['Proprietà colligative', 'Colligative properties'], dati: [['m', ['massa del soluto', 'solute mass'], 'g', 18], ['M', ['massa molare del soluto', 'solute molar mass'], 'g/mol', 180.16], ['i', ['coefficiente di van ’t Hoff i', 'van ’t Hoff factor i'], '', 1], ['mw', ['massa d’acqua', 'water mass'], 'g', 500], ['V', ['volume della soluzione', 'solution volume'], 'mL', 512], ['T', 'T', 'K', 298.15]],
      testo: function (d) { return [d.m + ' g di un soluto (M = ' + d.M + ' g/mol, i = ' + d.i + ') sono sciolti in ' + d.mw + ' g d’acqua (volume finale ' + d.V + ' mL). Calcolare innalzamento ebullioscopico, abbassamento crioscopico e pressione osmotica a ' + d.T + ' K.', d.m + ' g of a solute (M = ' + d.M + ' g/mol, i = ' + d.i + ') are dissolved in ' + d.mw + ' g of water (final volume ' + d.V + ' mL). Compute boiling-point elevation, freezing-point depression and osmotic pressure at ' + d.T + ' K.']; },
      risolvi: function (d, S) { var n = d.m / d.M, b = S.f(t('Molalità', 'Molality'), 'b = n/kg', '', n / (d.mw / 1000), 'mol/kg'); var Te = S.f(t('Ebullioscopia', 'Boiling-point elevation'), 'ΔT_eb = i·K_eb·b (K_eb = 0,512)', '', d.i * 0.512 * b, 'K'), Tc = S.f(t('Crioscopia', 'Freezing-point depression'), 'ΔT_cr = i·K_cr·b (K_cr = 1,86)', '', d.i * 1.86 * b, 'K'), pi = S.f(t('Pressione osmotica', 'Osmotic pressure'), 'π = i·c·R·T', '', d.i * n / (d.V / 1000) * RL * d.T, 'atm'); S.r('ΔT_eb', Te, 'K'); S.r('ΔT_cr', Tc, 'K'); S.r('π', pi, 'atm'); } },
    { id: 'hess', liv: 0, arg: 'termo', nome: ['Entalpia, entropia e Gibbs di reazione', 'Reaction enthalpy, entropy and Gibbs energy'], dati: [['rx', ['reazione', 'reaction'], '', 'CH4 + O2 -> CO2 + H2O'], ['Hf', ['ΔH°f (kJ/mol: formula: valore, …)', 'ΔH°f (kJ/mol: formula: value, …)'], '', 'CH4: -74.8, O2: 0, CO2: -393.5, H2O: -285.8'], ['S', ['S° (J/(mol·K), facoltativo)', 'S° (J/(mol·K), optional)'], '', 'CH4: 186.3, O2: 205.2, CO2: 213.8, H2O: 70.0'], ['T', 'T', 'K', 298.15]],
      testo: function (d) { return ['Per ' + fChim(d.rx.replace('->', '→')) + ', dai dati termodinamici tabulati, calcolare ΔH°, ΔS°, ΔG° e K a ' + d.T + ' K.', 'For ' + fChim(d.rx.replace('->', '→')) + ', from tabulated data, compute ΔH°, ΔS°, ΔG° and K at ' + d.T + ' K.']; },
      risolvi: function (d, S) {
        var b = F.calcolo.lineare.bilancia(d.rx), Hf = lista(d.Hf), Sm = lista(d.S), dH = 0, dS = 0, haS = Object.keys(Sm).length > 0;
        var lati = [[], []]; b.specie.forEach(function (s, j) { lati[b.lato[j]].push((b.coeff[j] > 1 ? b.coeff[j] + ' ' : '') + fChim(s)); });
        S.p(t('Reazione bilanciata', 'Balanced reaction'), lati[0].join(' + ') + ' → ' + lati[1].join(' + '));
        b.specie.forEach(function (s, j) { var sg = b.lato[j] ? 1 : -1; if (Hf[s] === undefined) throw new Error(t('manca ΔH°f di ', 'missing ΔH°f of ') + s); dH += sg * b.coeff[j] * Hf[s]; if (haS) { if (Sm[s] === undefined) throw new Error(t('manca S° di ', 'missing S° of ') + s); dS += sg * b.coeff[j] * Sm[s]; } });
        S.f(t('Legge di Hess', 'Hess’s law'), 'ΔH° = Σν·ΔH°f(prodotti) − Σν·ΔH°f(reagenti)', '', dH, 'kJ/mol'); S.r('ΔH°', dH, 'kJ/mol');
        if (haS) { S.f(t('Entropia', 'Entropy'), 'ΔS° = Σν·S°(prodotti) − Σν·S°(reagenti)', '', dS, 'J/(mol·K)'); var dG = S.f(t('Energia di Gibbs', 'Gibbs energy'), 'ΔG° = ΔH° − TΔS°', '', dH - d.T * dS / 1000, 'kJ/mol'); var lK = -dG * 1000 / (Rg * d.T) / Math.LN10; S.p(t('Costante di equilibrio', 'Equilibrium constant'), 'K = e^(−ΔG°/RT) ⇒ log K = ' + n4(lK) + ' ⇒ K = <b>' + (Math.abs(lK) < 300 ? n4(Math.pow(10, lK)) : '10^' + n4(lK)) + '</b>'); S.p(t('Spontaneità', 'Spontaneity'), dG < 0 ? t('ΔG° < 0: spontanea nelle condizioni standard.', 'ΔG° < 0: spontaneous under standard conditions.') : t('ΔG° > 0: non spontanea nelle condizioni standard.', 'ΔG° > 0: not spontaneous under standard conditions.')); S.r('ΔS°', dS, 'J/(mol·K)'); S.r('ΔG°', dG, 'kJ/mol'); S.r('log K', lK, ''); }
      } },
    { id: 'calorimetro', liv: 0, arg: 'termo', nome: ['Calorimetria di reazione', 'Reaction calorimetry'], dati: [['m', ['massa della soluzione', 'solution mass'], 'g', 100], ['c', ['calore specifico', 'specific heat'], 'J/(g·K)', 4.18], ['dT', 'ΔT', 'K', 6.5], ['n', ['moli di reagente limitante', 'moles of limiting reagent'], 'mol', 0.05]],
      testo: function (d) { return ['In un calorimetro a pressione costante la neutralizzazione di ' + d.n + ' mol innalza di ' + d.dT + ' K la temperatura di ' + d.m + ' g di soluzione (c = ' + d.c + ' J/(g·K)). Calcolare ΔH di reazione per mole.', 'In a constant-pressure calorimeter neutralising ' + d.n + ' mol raises the temperature of ' + d.m + ' g of solution (c = ' + d.c + ' J/(g·K)) by ' + d.dT + ' K. Compute ΔH per mole.']; },
      risolvi: function (d, S) { var Qs = S.f(t('Calore assorbito dalla soluzione', 'Heat absorbed by the solution'), 'Q = m c ΔT', '', d.m * d.c * d.dT, 'J'); var H = S.f('ΔH', 'ΔH = −Q/n', '', -Qs / d.n / 1000, 'kJ/mol'); S.p(t('Segno', 'Sign'), t('La soluzione si scalda: la reazione cede calore, è esotermica (ΔH < 0).', 'The solution warms: the reaction releases heat, it is exothermic (ΔH < 0).')); S.r('ΔH', H, 'kJ/mol'); } },
    { id: 'cinetica', liv: 0, arg: 'cin', nome: ['Leggi cinetiche integrate', 'Integrated rate laws'], dati: [['ord', ['ordine (0, 1, 2)', 'order (0, 1, 2)'], '', 1], ['k', ['costante k', 'rate constant k'], 'M/s · s⁻¹ · M⁻¹s⁻¹', 0.0231], ['A0', '[A]₀', 'M', 0.5], ['t', 't', 's', 60]],
      testo: function (d) { return ['Una reazione di ordine ' + d.ord + ' ha k = ' + d.k + ' e [A]₀ = ' + d.A0 + ' M. Calcolare [A] dopo ' + d.t + ' s e il tempo di dimezzamento.', 'A reaction of order ' + d.ord + ' has k = ' + d.k + ' and [A]₀ = ' + d.A0 + ' M. Compute [A] after ' + d.t + ' s and the half-life.']; },
      risolvi: function (d, S) {
        var o = +d.ord, A, th;
        if (o === 0) { A = S.f('[A]', '[A] = [A]₀ − kt', '', Math.max(0, d.A0 - d.k * d.t), 'M'); th = S.f('t½', 't½ = [A]₀/(2k)', '', d.A0 / (2 * d.k), 's'); }
        else if (o === 1) { A = S.f('[A]', '[A] = [A]₀e^(−kt)', '', d.A0 * Math.exp(-d.k * d.t), 'M'); th = S.f('t½', 't½ = ln 2/k (indipendente da [A]₀)', '', Math.LN2 / d.k, 's'); }
        else { A = S.f('[A]', '1/[A] = 1/[A]₀ + kt', '', 1 / (1 / d.A0 + d.k * d.t), 'M'); th = S.f('t½', 't½ = 1/(k[A]₀)', '', 1 / (d.k * d.A0), 's'); }
        S.p(t('Grafico lineare', 'Linear plot'), o === 0 ? '[A] ' + t('contro', 'versus') + ' t' : o === 1 ? 'ln[A] ' + t('contro', 'versus') + ' t' : '1/[A] ' + t('contro', 'versus') + ' t');
        S.r('[A]', A, 'M'); S.r('t½', th, 's');
      } },
    { id: 'arrhenius', liv: 0, arg: 'cin', nome: ['Arrhenius a due temperature', 'Two-temperature Arrhenius'], dati: [['k1', 'k₁', '', 2.5e-3], ['T1', 'T₁', 'K', 298], ['k2', 'k₂', '', 1.8e-2], ['T2', 'T₂', 'K', 323]],
      testo: function (d) { return ['La costante di velocità vale ' + d.k1 + ' a ' + d.T1 + ' K e ' + d.k2 + ' a ' + d.T2 + ' K. Calcolare l’energia di attivazione e il fattore pre-esponenziale.', 'The rate constant is ' + d.k1 + ' at ' + d.T1 + ' K and ' + d.k2 + ' at ' + d.T2 + ' K. Compute the activation energy and pre-exponential factor.']; },
      risolvi: function (d, S) { var Ea = S.f('Eₐ', 'Eₐ = R·ln(k₂/k₁)/(1/T₁ − 1/T₂)', '', Rg * Math.log(d.k2 / d.k1) / (1 / d.T1 - 1 / d.T2) / 1000, 'kJ/mol'), A = S.f('A', 'A = k₁·e^(Eₐ/RT₁)', '', d.k1 * Math.exp(Ea * 1000 / (Rg * d.T1)), ''); S.r('Eₐ', Ea, 'kJ/mol'); S.r('A', A, ''); } },
    { id: 'equilibrio', liv: 0, arg: 'eq', nome: ['Equilibrio: tabella ICE', 'Equilibrium: ICE table'], dati: [['coef', ['coefficienti a, b ⇌ c, d (aA + bB ⇌ cC + dD)', 'coefficients a, b ⇌ c, d'], '', '1, 1, 2, 0'], ['c0', ['concentrazioni iniziali [A], [B], [C], [D]', 'initial [A], [B], [C], [D]'], 'M', '0.5, 0.5, 0, 0'], ['K', 'K_c', '', 49]],
      testo: function (d) { return ['Per l’equilibrio aA + bB ⇌ cC + dD con coefficienti ' + d.coef + ', K_c = ' + d.K + ' e concentrazioni iniziali ' + d.c0 + ' M, trovare le concentrazioni all’equilibrio.', 'For the equilibrium aA + bB ⇌ cC + dD with coefficients ' + d.coef + ', K_c = ' + d.K + ' and initial concentrations ' + d.c0 + ' M, find the equilibrium concentrations.']; },
      risolvi: function (d, S) {
        var nu = String(d.coef).split(',').map(Number), c = String(d.c0).split(',').map(Number), K = +d.K, sg = [-1, -1, 1, 1];
        var Q = function (x) { var num = 1, den = 1; for (var i = 0; i < 4; i++) { var ci = c[i] + sg[i] * nu[i] * x; if (!nu[i]) continue; if (i < 2) den *= Math.pow(ci, nu[i]); else num *= Math.pow(ci, nu[i]); } return num / den; };
        var Q0 = Q(0), lo = -Infinity, hi = Infinity;
        for (var i = 0; i < 4; i++) if (nu[i]) { var lim = -c[i] / (sg[i] * nu[i]); if (sg[i] * nu[i] > 0) lo = Math.max(lo, lim); else hi = Math.min(hi, lim); }
        S.p(t('Quoziente iniziale', 'Initial quotient'), 'Q₀ = ' + (isFinite(Q0) ? n4(Q0) : '∞') + (Q0 < K ? t(' < K: la reazione procede verso destra (x > 0)', ' < K: the reaction goes to the right (x > 0)') : t(' > K: procede verso sinistra (x < 0)', ' > K: it goes to the left (x < 0)')));
        S.p(t('Tabella ICE', 'ICE table'), '<table class="bsiFX-tab" style="width:auto"><tr><th></th><th>A</th><th>B</th><th>C</th><th>D</th></tr><tr><td>I</td>' + c.map(function (v) { return '<td>' + n4(v) + '</td>'; }).join('') + '</tr><tr><td>C</td>' + nu.map(function (v, i) { return '<td>' + (v ? (sg[i] > 0 ? '+' : '−') + (v > 1 ? v : '') + 'x' : '0') + '</td>'; }).join('') + '</tr></table>');
        var a = Q0 < K ? 0 : Math.max(lo, -1e9), b = Q0 < K ? Math.min(hi, 1e9) : 0;
        var x = bisezione(function (z) { return Math.log(Q(z)) - Math.log(K); }, a + (b - a) * 1e-15 + 1e-300, b - (b - a) * 1e-15);
        S.p(t('Soluzione', 'Solution'), t('Si impone K = Q(x) e si sceglie la radice con tutte le concentrazioni positive: ', 'Impose K = Q(x) and pick the root with all concentrations positive: ') + 'x = <b>' + q(x, 'M') + '</b>');
        ['A', 'B', 'C', 'D'].forEach(function (s, i) { if (!nu[i] && !c[i]) return; var v = c[i] + sg[i] * nu[i] * x; S.p('[' + s + ']', '<b>' + q(v, 'M') + '</b>'); S.r('[' + s + ']', v, 'M'); });
      } },
    { id: 'kpkc', liv: 0, arg: 'eq', nome: ['K_p e K_c', 'K_p and K_c'], dati: [['Kc', 'K_c', '', 0.5], ['dn', ['Δn gassoso (prodotti − reagenti)', 'Δn of gases (products − reactants)'], '', -2], ['T', 'T', 'K', 500]],
      testo: function (d) { return ['Una reazione con Δn(gas) = ' + d.dn + ' ha K_c = ' + d.Kc + ' a ' + d.T + ' K. Calcolare K_p.', 'A reaction with Δn(gas) = ' + d.dn + ' has K_c = ' + d.Kc + ' at ' + d.T + ' K. Compute K_p.']; },
      risolvi: function (d, S) { var Kp = S.f('K_p', 'K_p = K_c(RT)^Δn', n4(d.Kc) + '·(0,08206·' + n4(d.T) + ')^' + d.dn, d.Kc * Math.pow(RL * d.T, d.dn), ''); S.p(t('Nota', 'Note'), t('Con p in atm e c in mol/L; se Δn = 0, K_p = K_c.', 'With p in atm and c in mol/L; if Δn = 0, K_p = K_c.')); S.r('K_p', Kp, ''); } },
    { id: 'phforte', liv: 0, arg: 'ab', nome: ['pH di acidi e basi forti', 'pH of strong acids and bases'], dati: [['tipo', ['acido | base', 'acido | base'], '', 'acido'], ['C', 'C', 'M', 1e-3]],
      testo: function (d) { return ['Calcolare il pH di una soluzione ' + d.C + ' M di ' + (d.tipo === 'base' ? 'base forte monoprotica (es. NaOH).' : 'acido forte monoprotico (es. HCl).'), 'Compute the pH of a ' + d.C + ' M solution of a ' + (d.tipo === 'base' ? 'strong monobasic base (e.g. NaOH).' : 'strong monoprotic acid (e.g. HCl).')]; },
      risolvi: function (d, S) {
        var C = +d.C, x = (C + Math.sqrt(C * C + 4e-14)) / 2, pH;
        if (C > 1e-6) { S.p(t('Dissociazione completa', 'Complete dissociation'), (d.tipo === 'base' ? '[OH⁻]' : '[H₃O⁺]') + ' = C = ' + q(C, 'M')); x = C; }
        else S.p(t('Soluzione molto diluita', 'Very dilute solution'), t('C è confrontabile con 10⁻⁷: si tiene conto dell’autoprotolisi dell’acqua, ', 'C is comparable with 10⁻⁷: water autoprotolysis matters, ') + '[X]² − C[X] − K_w = 0 ⇒ [X] = ' + q(x, 'M'));
        pH = d.tipo === 'base' ? 14 + Math.log10(x) : -Math.log10(x);
        S.f('pH', d.tipo === 'base' ? 'pH = 14 − pOH' : 'pH = −log[H₃O⁺]', '', pH, ''); S.r('pH', pH, '');
      } },
    { id: 'acidodebole', liv: 0, arg: 'ab', nome: ['pH di un acido debole', 'pH of a weak acid'], dati: [['Ka', 'K_a', '', 1.8e-5], ['C', 'C', 'M', 0.1]],
      testo: function (d) { return ['Calcolare pH e grado di dissociazione di una soluzione ' + d.C + ' M di un acido debole con K_a = ' + n4(d.Ka) + '.', 'Compute the pH and degree of dissociation of a ' + d.C + ' M solution of a weak acid with K_a = ' + n4(d.Ka) + '.']; },
      risolvi: function (d, S) {
        S.p(t('Equilibrio', 'Equilibrium'), 'HA + H₂O ⇌ A⁻ + H₃O⁺ ; K_a = x²/(C − x)');
        var x = S.f(t('Equazione di secondo grado (esatta)', 'Quadratic (exact)'), 'x = [−K_a + √(K_a² + 4K_aC)]/2', '', (-d.Ka + Math.sqrt(d.Ka * d.Ka + 4 * d.Ka * d.C)) / 2, 'M');
        var xa = Math.sqrt(d.Ka * d.C);
        S.p(t('Approssimazione', 'Approximation'), 'x ≈ √(K_aC) = ' + q(xa, 'M') + ' (' + t('errore ', 'error ') + n4(100 * Math.abs(xa - x) / x) + ' %; ' + t('accettabile se x/C < 5 %', 'acceptable if x/C < 5 %') + ')');
        var pH = S.f('pH', 'pH = −log x', '', -Math.log10(x), ''), al = S.f(t('Grado di dissociazione', 'Degree of dissociation'), 'α = x/C', '', x / d.C, '');
        S.r('pH', pH, ''); S.r('α', al, '');
      } },
    { id: 'basedebole', liv: 0, arg: 'ab', nome: ['pH di una base debole', 'pH of a weak base'], dati: [['Kb', 'K_b', '', 1.8e-5], ['C', 'C', 'M', 0.05]],
      testo: function (d) { return ['Calcolare il pH di una soluzione ' + d.C + ' M di una base debole (es. NH₃) con K_b = ' + n4(d.Kb) + '.', 'Compute the pH of a ' + d.C + ' M solution of a weak base (e.g. NH₃) with K_b = ' + n4(d.Kb) + '.']; },
      risolvi: function (d, S) { var x = S.f('[OH⁻]', '[OH⁻] = [−K_b + √(K_b² + 4K_bC)]/2', '', (-d.Kb + Math.sqrt(d.Kb * d.Kb + 4 * d.Kb * d.C)) / 2, 'M'), pOH = S.f('pOH', 'pOH = −log[OH⁻]', '', -Math.log10(x), ''), pH = S.f('pH', 'pH = 14 − pOH', '', 14 - pOH, ''); S.r('pH', pH, ''); } },
    { id: 'tampone', liv: 0, arg: 'ab', nome: ['Soluzione tampone', 'Buffer solution'], dati: [['pKa', 'pK_a', '', 4.76], ['na', ['moli di acido HA', 'moles of acid HA'], 'mol', 0.1], ['nb', ['moli di base A⁻', 'moles of base A⁻'], 'mol', 0.1], ['agg', ['moli di acido forte aggiunte (− per base forte)', 'moles of strong acid added (− for strong base)'], 'mol', 0.01]],
      testo: function (d) { return ['Un tampone contiene ' + d.na + ' mol di HA e ' + d.nb + ' mol di A⁻ (pK_a = ' + d.pKa + '). Calcolarne il pH, e il pH dopo l’aggiunta di ' + d.agg + ' mol di acido forte.', 'A buffer contains ' + d.na + ' mol HA and ' + d.nb + ' mol A⁻ (pK_a = ' + d.pKa + '). Compute its pH, and the pH after adding ' + d.agg + ' mol of strong acid.']; },
      risolvi: function (d, S) {
        var pH = S.f('Henderson-Hasselbalch', 'pH = pK_a + log(n_A⁻/n_HA)', '', d.pKa + Math.log10(d.nb / d.na), ''), a2 = d.na + d.agg, b2 = d.nb - d.agg;
        S.p(t('Aggiunta', 'Addition'), t('L’acido forte converte A⁻ in HA (una base forte farebbe il contrario): ', 'Strong acid converts A⁻ into HA (a strong base does the opposite): ') + 'n_HA = ' + n4(a2) + ', n_A⁻ = ' + n4(b2));
        if (b2 <= 0 || a2 <= 0) { S.p(t('Capacità superata', 'Capacity exceeded'), t('Il tampone è esaurito: il pH è governato dall’eccesso di acido o base forte.', 'The buffer is exhausted: the pH is governed by the excess strong acid or base.')); S.r('pH', pH, ''); return; }
        var pH2 = S.f(t('Nuovo pH', 'New pH'), 'pH = pK_a + log(n_A⁻/n_HA)', '', d.pKa + Math.log10(b2 / a2), '');
        S.r('pH', pH, ''); S.r('pH′', pH2, ''); S.r('ΔpH', pH2 - pH, '');
      } },
    { id: 'idrolisi', liv: 0, arg: 'ab', nome: ['Idrolisi di un sale', 'Salt hydrolysis'], dati: [['Ka', ['K_a dell’acido coniugato', 'K_a of the parent acid'], '', 1.8e-5], ['C', ['concentrazione del sale (es. CH₃COONa)', 'salt concentration (e.g. CH₃COONa)'], 'M', 0.1]],
      testo: function (d) { return ['Calcolare il pH di una soluzione ' + d.C + ' M di un sale di base forte e acido debole (K_a = ' + n4(d.Ka) + ').', 'Compute the pH of a ' + d.C + ' M solution of a salt of a strong base and a weak acid (K_a = ' + n4(d.Ka) + ').']; },
      risolvi: function (d, S) { var Kb = S.f(t('K_b della base coniugata', 'K_b of the conjugate base'), 'K_b = K_w/K_a', '', 1e-14 / d.Ka, ''); var x = (-Kb + Math.sqrt(Kb * Kb + 4 * Kb * d.C)) / 2; S.f('[OH⁻]', 'A⁻ + H₂O ⇌ HA + OH⁻', '', x, 'M'); var pH = S.f('pH', 'pH = 14 + log[OH⁻]', '', 14 + Math.log10(x), ''); S.p(t('Commento', 'Comment'), t('Soluzione basica: l’anione dell’acido debole idrolizza.', 'Basic solution: the anion of the weak acid hydrolyses.')); S.r('pH', pH, ''); } },
    { id: 'ksp', liv: 0, arg: 'sol', nome: ['Prodotto di solubilità', 'Solubility product'], dati: [['Ksp', 'K_sp', '', 1.8e-10], ['x', ['indici AₓB_y: x', 'indices AₓB_y: x'], '', 1], ['y', 'y', '', 1], ['comune', ['ione comune B (M, 0: nessuno)', 'common ion B (M, 0: none)'], 'M', 0.01]],
      testo: function (d) { return ['Un sale A' + (d.x > 1 ? d.x : '') + 'B' + (d.y > 1 ? d.y : '') + ' ha K_sp = ' + n4(d.Ksp) + '. Calcolarne la solubilità in acqua pura e in una soluzione ' + d.comune + ' M dell’anione.', 'A salt A' + (d.x > 1 ? d.x : '') + 'B' + (d.y > 1 ? d.y : '') + ' has K_sp = ' + n4(d.Ksp) + '. Compute its solubility in pure water and in a ' + d.comune + ' M solution of the anion.']; },
      risolvi: function (d, S) {
        var x = +d.x, y = +d.y;
        var s = S.f(t('In acqua pura', 'In pure water'), 'K_sp = (' + x + 's)^' + x + '(' + y + 's)^' + y + ' ⇒ s = (K_sp/(' + x + '^' + x + '·' + y + '^' + y + '))^(1/' + (x + y) + ')', '', Math.pow(d.Ksp / (Math.pow(x, x) * Math.pow(y, y)), 1 / (x + y)), 'M');
        S.r('s', s, 'M');
        if (+d.comune) { var s2 = bisezione(function (z) { return Math.pow(x * z, x) * Math.pow(y * z + +d.comune, y) - d.Ksp; }, 0, s); S.f(t('Con lo ione comune (effetto dello ione comune)', 'With the common ion (common-ion effect)'), 'K_sp = (' + x + 's′)^' + x + '(' + y + 's′ + [B])^' + y, '', s2, 'M'); S.r("s′", s2, 'M'); }
      } },
    { id: 'precipita', liv: 0, arg: 'sol', nome: ['Precipita o no?', 'Does it precipitate?'], dati: [['Ksp', ['K_sp di AB', 'K_sp of AB'], '', 1.8e-10], ['c1', ['[A⁺] nella prima soluzione', '[A⁺] in the first solution'], 'M', 1e-3], ['V1', 'V₁', 'mL', 50], ['c2', ['[B⁻] nella seconda soluzione', '[B⁻] in the second solution'], 'M', 1e-3], ['V2', 'V₂', 'mL', 50]],
      testo: function (d) { return ['Si mescolano ' + d.V1 + ' mL di una soluzione ' + d.c1 + ' M di A⁺ con ' + d.V2 + ' mL di una soluzione ' + d.c2 + ' M di B⁻. Precipita AB (K_sp = ' + n4(d.Ksp) + ')?', d.V1 + ' mL of a ' + d.c1 + ' M A⁺ solution are mixed with ' + d.V2 + ' mL of a ' + d.c2 + ' M B⁻ solution. Does AB (K_sp = ' + n4(d.Ksp) + ') precipitate?']; },
      risolvi: function (d, S) { var Vt = +d.V1 + +d.V2, a = d.c1 * d.V1 / Vt, b = d.c2 * d.V2 / Vt; S.p(t('Diluizione nel miscuglio', 'Dilution in the mixture'), '[A⁺] = ' + q(a, 'M') + ', [B⁻] = ' + q(b, 'M')); var Qv = S.f(t('Prodotto ionico', 'Ionic product'), 'Q = [A⁺][B⁻]', '', a * b, ''); S.p(t('Confronto', 'Comparison'), Qv > d.Ksp ? t('Q > K_sp: <b>precipita</b>.', 'Q > K_sp: <b>it precipitates</b>.') : t('Q ≤ K_sp: <b>non precipita</b>.', 'Q ≤ K_sp: <b>no precipitate</b>.')); S.r('Q', Qv, ''); } },
    { id: 'pila', liv: 0, arg: 'elettro', nome: ['Pila: Nernst, ΔG, K', 'Cell: Nernst, ΔG, K'], dati: [['Ec', ['E° catodo', 'E° cathode'], 'V', 0.34], ['Ea', ['E° anodo', 'E° anode'], 'V', -0.76], ['n', ['elettroni scambiati', 'electrons transferred'], '', 2], ['Q', ['quoziente di reazione Q', 'reaction quotient Q'], '', 0.01], ['T', 'T', 'K', 298.15]],
      testo: function (d) { return ['Una pila ha E°(catodo) = ' + d.Ec + ' V ed E°(anodo) = ' + d.Ea + ' V, con ' + d.n + ' elettroni scambiati (es. Daniell). Calcolare E°, E per Q = ' + d.Q + ', ΔG° e K.', 'A cell has E°(cathode) = ' + d.Ec + ' V and E°(anode) = ' + d.Ea + ' V, with ' + d.n + ' electrons transferred (e.g. Daniell). Compute E°, E for Q = ' + d.Q + ', ΔG° and K.']; },
      risolvi: function (d, S) { var lK; var E0 = S.f('E°', 'E° = E°(cat) − E°(an)', '', d.Ec - d.Ea, 'V'), E = S.f('Nernst', 'E = E° − (RT/nF)·ln Q', '', E0 - Rg * d.T / (d.n * Fa) * Math.log(d.Q), 'V'), G = S.f('ΔG°', 'ΔG° = −nFE°', '', -d.n * Fa * E0 / 1000, 'kJ/mol'), lK = d.n * Fa * E0 / (Rg * d.T) / Math.LN10, K = Math.pow(10, lK); S.p('K', 'K = e^(nFE°/RT) ⇒ log K = ' + n4(lK) + ' ⇒ K = <b>' + (Math.abs(lK) < 300 ? n4(K) : '10^' + n4(lK)) + '</b>'); S.r('E°', E0, 'V'); S.r('E', E, 'V'); S.r('ΔG°', G, 'kJ/mol'); S.r('log K', lK, ''); } },
    { id: 'elettrolisi', liv: 0, arg: 'elettro', nome: ['Elettrolisi (Faraday)', 'Electrolysis (Faraday)'], dati: [['I', 'I', 'A', 2], ['t', 't', 'min', 30], ['n', ['elettroni per ione', 'electrons per ion'], '', 2], ['f', ['metallo depositato', 'deposited metal'], '', 'Cu']],
      testo: function (d) { return ['Una corrente di ' + d.I + ' A passa per ' + d.t + ' min in una soluzione di ioni ' + d.f + ' (' + d.n + ' e⁻ per ione). Quanta massa di ' + d.f + ' si deposita?', 'A ' + d.I + ' A current flows for ' + d.t + ' min through a solution of ' + d.f + ' ions (' + d.n + ' e⁻ per ion). What mass of ' + d.f + ' is deposited?']; },
      risolvi: function (d, S) { var Qc = S.f(t('Carica', 'Charge'), 'Q = I·t', '', d.I * d.t * 60, 'C'), ne = S.f(t('Moli di elettroni', 'Moles of electrons'), 'n_e = Q/F', '', Qc / Fa, 'mol'), m = S.f(t('Massa', 'Mass'), 'm = (n_e/n)·M', '', ne / d.n * massaMolare(d.f).M, 'g'); S.r('m', m, 'g'); } },
    { id: 'bohr', liv: 0, arg: 'atomo', nome: ['Atomo di Bohr e righe spettrali', 'Bohr atom and spectral lines'], dati: [['Z', 'Z', '', 1], ['ni', ['n iniziale', 'initial n'], '', 3], ['nf', ['n finale', 'final n'], '', 2]],
      testo: function (d) { return ['Per un atomo idrogenoide con Z = ' + d.Z + ', calcolare energia, lunghezza d’onda e frequenza del fotone nella transizione n = ' + d.ni + ' → ' + d.nf + '.', 'For a hydrogen-like atom with Z = ' + d.Z + ', compute the energy, wavelength and frequency of the photon in the n = ' + d.ni + ' → ' + d.nf + ' transition.']; },
      risolvi: function (d, S) {
        var Ry = 13.605693, dE = S.f('ΔE', 'ΔE = 13,606 eV·Z²·|1/n_f² − 1/n_i²|', '', Ry * d.Z * d.Z * Math.abs(1 / (d.nf * d.nf) - 1 / (d.ni * d.ni)), 'eV');
        var lam = S.f('λ', 'λ = hc/ΔE', '', h * c0 / (dE * 1.602176634e-19) * 1e9, 'nm'), nu = S.f(t('Frequenza', 'Frequency'), 'ν = c/λ', '', c0 / (lam * 1e-9), 'Hz');
        var serie = { 1: 'Lyman (UV)', 2: 'Balmer (visibile)', 3: 'Paschen (IR)', 4: 'Brackett (IR)' }[+d.nf] || '';
        S.p(t('Tipo', 'Kind'), (+d.ni > +d.nf ? t('emissione', 'emission') : t('assorbimento', 'absorption')) + (d.Z == 1 && serie ? ', ' + t('serie di ', 'series ') + serie : ''));
        S.r('ΔE', dE, 'eV'); S.r('λ', lam, 'nm');
      } },
    { id: 'debroglie', liv: 0, arg: 'atomo', nome: ['Lunghezza d’onda di de Broglie', 'De Broglie wavelength'], dati: [['V', ['tensione di accelerazione dell’elettrone', 'electron accelerating voltage'], 'V', 100]],
      testo: function (d) { return ['Un elettrone è accelerato da fermo con una differenza di potenziale di ' + d.V + ' V. Calcolare velocità e lunghezza d’onda di de Broglie.', 'An electron is accelerated from rest through ' + d.V + ' V. Compute its speed and de Broglie wavelength.']; },
      risolvi: function (d, S) { var Ek = d.V * 1.602176634e-19, v = S.f(t('Velocità', 'Speed'), 'v = √(2eV/m)', '', Math.sqrt(2 * Ek / me), 'm/s'), lam = S.f('λ', 'λ = h/(mv) = h/√(2meV)', '', h / Math.sqrt(2 * me * Ek) * 1e9, 'nm'); S.p(t('Confronto', 'Comparison'), t('Dello stesso ordine delle distanze interatomiche: per questo gli elettroni diffrangono sui cristalli.', 'Comparable to interatomic distances: that is why electrons diffract on crystals.')); S.r('v', v, 'm/s'); S.r('λ', lam, 'nm'); } },
    /* ═════════════════ INTERMEDIO — Chimica Analitica ═════════════════ */
    { id: 'titolazione', liv: 1, arg: 'anal', nome: ['Titolazione acido debole con base forte', 'Weak acid titrated with strong base'], dati: [['Ca', ['C acido', 'acid C'], 'M', 0.1], ['Va', ['V acido', 'acid V'], 'mL', 25], ['Ka', 'K_a', '', 1.8e-5], ['Cb', ['C base (NaOH)', 'base C (NaOH)'], 'M', 0.1], ['Vb', ['V base aggiunta', 'base V added'], 'mL', 12.5]],
      testo: function (d) { return [d.Va + ' mL di acido debole ' + d.Ca + ' M (K_a = ' + n4(d.Ka) + ') sono titolati con NaOH ' + d.Cb + ' M. Calcolare il volume equivalente, il pH dopo l’aggiunta di ' + d.Vb + ' mL e il pH al punto equivalente.', d.Va + ' mL of ' + d.Ca + ' M weak acid (K_a = ' + n4(d.Ka) + ') are titrated with ' + d.Cb + ' M NaOH. Compute the equivalence volume, the pH after adding ' + d.Vb + ' mL and the pH at equivalence.']; },
      risolvi: function (d, S) {
        var na = d.Ca * d.Va / 1000, nb = d.Cb * d.Vb / 1000, Vt = (+d.Va + +d.Vb) / 1000, Veq = S.f(t('Volume equivalente', 'Equivalence volume'), 'V_eq = C_aV_a/C_b', '', d.Ca * d.Va / d.Cb, 'mL'), pH, zona;
        /* pH esatto dal bilancio di carica: [H⁺] + [Na⁺] = [A⁻] + [OH⁻] */
        var Na = nb / Vt, CA = na / Vt;
        var hh = bisezione(function (lh) { var H = Math.pow(10, lh); return H + Na - CA * d.Ka / (d.Ka + H) - 1e-14 / H; }, -14, 0);
        pH = -hh;
        zona = nb === 0 ? t('punto iniziale: solo acido debole', 'starting point: weak acid only') : Math.abs(nb - na) < 1e-12 ? t('punto equivalente: idrolisi di A⁻', 'equivalence point: A⁻ hydrolysis') : nb < na ? t('zona tampone: pH ≈ pK_a + log(n_A⁻/n_HA)', 'buffer region: pH ≈ pK_a + log(n_A⁻/n_HA)') : t('oltre l’equivalenza: comanda l’eccesso di OH⁻', 'past equivalence: excess OH⁻ dominates');
        S.p(t('Zona della curva', 'Region of the curve'), zona + '. ' + t('Il calcolo usa il bilancio di carica completo [H⁺] + [Na⁺] = [A⁻] + [OH⁻], valido in ogni punto.', 'The calculation uses the full charge balance [H⁺] + [Na⁺] = [A⁻] + [OH⁻], valid at every point.'));
        S.f('pH', t('a ', 'at ') + d.Vb + ' mL', '', pH, '');
        var Ceq = na / ((+d.Va + Veq) / 1000), Kb = 1e-14 / d.Ka, oh = (-Kb + Math.sqrt(Kb * Kb + 4 * Kb * Ceq)) / 2, pHeq = S.f(t('pH al punto equivalente', 'pH at equivalence'), 'pH = 14 + log√(K_bC)', '', 14 + Math.log10(oh), '');
        S.p(t('Semi-equivalenza', 'Half-equivalence'), 'pH = pK_a = ' + n4(-Math.log10(d.Ka)) + t(' — è così che si misura K_a da una curva.', ' — this is how K_a is measured from a curve.'));
        S.r('V_eq', Veq, 'mL'); S.r('pH', pH, ''); S.r('pH_eq', pHeq, '');
      } },
    { id: 'beer', liv: 1, arg: 'anal', nome: ['Legge di Lambert-Beer', 'Beer-Lambert law'], dati: [['A', ['assorbanza', 'absorbance'], '', 0.45], ['eps', 'ε', 'L/(mol·cm)', 15400], ['l', ['cammino ottico', 'path length'], 'cm', 1], ['M', ['massa molare dell’analita', 'analyte molar mass'], 'g/mol', 180]],
      testo: function (d) { return ['Una soluzione ha assorbanza ' + d.A + ' in una cuvetta di ' + d.l + ' cm; ε = ' + d.eps + ' L/(mol·cm). Calcolare concentrazione molare, in mg/L, e trasmittanza.', 'A solution has absorbance ' + d.A + ' in a ' + d.l + ' cm cell; ε = ' + d.eps + ' L/(mol·cm). Compute the molar concentration, mg/L and transmittance.']; },
      risolvi: function (d, S) { var c = S.f('c', 'c = A/(εl)', '', d.A / (d.eps * d.l), 'mol/L'), mg = S.f(t('In mg/L', 'In mg/L'), 'c·M·1000', '', c * d.M * 1000, 'mg/L'), T = S.f(t('Trasmittanza', 'Transmittance'), 'T = 10^(−A)', '', 100 * Math.pow(10, -d.A), '%'); S.p(t('Validità', 'Validity'), t('Lineare per A circa fra 0,1 e 1: oltre, si diluisce.', 'Linear for A roughly between 0.1 and 1: above that, dilute.')); S.r('c', c, 'M'); S.r('T', T, '%'); } },
    { id: 'gravimetria', liv: 1, arg: 'anal', nome: ['Analisi gravimetrica', 'Gravimetric analysis'], dati: [['pp', ['precipitato pesato', 'weighed precipitate'], '', 'BaSO4'], ['mp', ['massa del precipitato', 'precipitate mass'], 'g', 0.4668], ['an', ['analita', 'analyte'], '', 'S'], ['k', ['atomi di analita per formula del precipitato', 'analyte atoms per precipitate formula'], '', 1], ['mc', ['massa del campione', 'sample mass'], 'g', 1.0]],
      testo: function (d) { return ['Da ' + d.mc + ' g di campione si ottengono ' + d.mp + ' g di ' + fChim(d.pp) + '. Calcolare la percentuale di ' + d.an + ' nel campione.', d.mc + ' g of sample give ' + d.mp + ' g of ' + fChim(d.pp) + '. Compute the percentage of ' + d.an + ' in the sample.']; },
      risolvi: function (d, S) { var Mp = massaMolare(d.pp).M, Ma = massaMolare(d.an).M, fg = S.f(t('Fattore gravimetrico', 'Gravimetric factor'), 'f = k·M(analita)/M(precipitato)', d.k + '·' + n4(Ma) + '/' + n4(Mp), d.k * Ma / Mp, ''), ma = S.f(t('Massa di analita', 'Analyte mass'), 'm = f·m_p', '', fg * d.mp, 'g'), pc = S.f(t('Percentuale', 'Percentage'), '% = m/m_campione·100', '', 100 * ma / d.mc, '%'); S.r('%', pc, '%'); } },
    { id: 'edta', liv: 1, arg: 'anal', nome: ['Durezza dell’acqua (EDTA)', 'Water hardness (EDTA)'], dati: [['V', ['volume di EDTA', 'EDTA volume'], 'mL', 14.2], ['C', ['C EDTA', 'EDTA C'], 'M', 0.01], ['Vc', ['volume del campione', 'sample volume'], 'mL', 50]],
      testo: function (d) { return [d.Vc + ' mL di acqua richiedono ' + d.V + ' mL di EDTA ' + d.C + ' M (nero eriocromo T, pH 10). Calcolare la concentrazione di Ca²⁺ + Mg²⁺ e la durezza in mg/L di CaCO₃ e in gradi francesi.', d.Vc + ' mL of water need ' + d.V + ' mL of ' + d.C + ' M EDTA (Eriochrome Black T, pH 10). Compute the Ca²⁺ + Mg²⁺ concentration and the hardness in mg/L CaCO₃ and French degrees.']; },
      risolvi: function (d, S) { S.p(t('Stechiometria', 'Stoichiometry'), t('L’EDTA forma complessi 1:1 con tutti i cationi metallici.', 'EDTA forms 1:1 complexes with all metal cations.')); var c = S.f('[M²⁺]', 'c = C_EDTA·V_EDTA/V', '', d.C * d.V / d.Vc, 'mol/L'), dur = S.f(t('Durezza', 'Hardness'), 'c·M(CaCO₃)·1000', '', c * 100.09 * 1000, 'mg/L'); S.p(t('Gradi francesi', 'French degrees'), q(dur / 10, '°f') + t(' (1 °f = 10 mg/L CaCO₃)', ' (1 °f = 10 mg/L CaCO₃)')); S.r('c', c, 'M'); S.r(t('durezza', 'hardness'), dur, 'mg/L'); } },
    { id: 'permanganato', liv: 1, arg: 'anal', nome: ['Titolazione redox (permanganato)', 'Redox titration (permanganate)'], dati: [['V', ['V KMnO₄', 'KMnO₄ V'], 'mL', 18.6], ['C', ['C KMnO₄', 'KMnO₄ C'], 'M', 0.02], ['Vc', ['volume della soluzione di Fe²⁺', 'Fe²⁺ solution volume'], 'mL', 25]],
      testo: function (d) { return [d.Vc + ' mL di una soluzione di Fe²⁺ in ambiente acido richiedono ' + d.V + ' mL di KMnO₄ ' + d.C + ' M. Calcolare [Fe²⁺].', d.Vc + ' mL of an acidic Fe²⁺ solution need ' + d.V + ' mL of ' + d.C + ' M KMnO₄. Compute [Fe²⁺].']; },
      risolvi: function (d, S) { var b = F.calcolo.lineare.bilancia('MnO4^- + Fe^2+ + H^+ -> Mn^2+ + Fe^3+ + H2O'); S.p(t('Reazione (bilanciata con il nucleo)', 'Reaction (balanced via null space)'), 'MnO₄⁻ + ' + b.coeff[1] + ' Fe²⁺ + ' + b.coeff[2] + ' H⁺ → Mn²⁺ + ' + b.coeff[4] + ' Fe³⁺ + ' + b.coeff[5] + ' H₂O'); var n = S.f(t('Moli di Fe²⁺', 'Moles of Fe²⁺'), 'n = 5·C·V', '', 5 * d.C * d.V / 1000, 'mol'), c = S.f('[Fe²⁺]', 'n/V', '', n / (d.Vc / 1000), 'M'); S.p(t('Indicatore', 'Indicator'), t('Il permanganato fa da indicatore: la prima goccia in eccesso colora di rosa.', 'Permanganate is its own indicator: the first excess drop turns the solution pink.')); S.r('[Fe²⁺]', c, 'M'); } },
    { id: 'poliprotico', liv: 1, arg: 'anal', nome: ['pH di un acido poliprotico (esatto)', 'pH of a polyprotic acid (exact)'], dati: [['Ka', ['K_a1, K_a2, K_a3', 'K_a1, K_a2, K_a3'], '', '7.5e-3, 6.2e-8, 4.8e-13'], ['C', 'C', 'M', 0.1]],
      testo: function (d) { return ['Calcolare il pH esatto di una soluzione ' + d.C + ' M di un acido poliprotico con costanti ' + d.Ka + ' (es. H₃PO₄), e la composizione all’equilibrio.', 'Compute the exact pH of a ' + d.C + ' M polyprotic acid with constants ' + d.Ka + ' (e.g. H₃PO₄), and the equilibrium composition.']; },
      risolvi: function (d, S) {
        var K = String(d.Ka).split(',').map(Number), C = +d.C;
        function alfa(H) { var termini = [1], p = 1; K.forEach(function (k) { p *= k; termini.push(p); }); var den = 0, a = []; for (var j = 0; j <= K.length; j++) { a.push(Math.pow(H, K.length - j) * termini[j]); den += a[j]; } return a.map(function (v) { return v / den; }); }
        S.p(t('Bilancio di carica', 'Charge balance'), '[H⁺] = [OH⁻] + C·Σ j·α_j(H⁺) ' + t('(α_j: frazione della specie che ha perso j protoni). Si risolve numericamente in [H⁺].', '(α_j: fraction of the species that lost j protons). Solved numerically in [H⁺].'));
        var lh = bisezione(function (l) { var H = Math.pow(10, l), a = alfa(H), carica = 0; for (var j = 1; j < a.length; j++) carica += j * a[j]; return H - 1e-14 / H - C * carica; }, -14, 1), H = Math.pow(10, lh), a = alfa(H);
        S.f('pH', 'pH = −log[H⁺]', '', -lh, '');
        S.p(t('Composizione', 'Composition'), a.map(function (v, j) { return 'α' + SUB[j] + ' = ' + n4(v); }).join(' · '));
        S.p(t('Confronto con l’approssimazione', 'Comparison with the approximation'), t('Considerando solo K_a1: pH = ', 'Using K_a1 only: pH = ') + n4(-Math.log10((-K[0] + Math.sqrt(K[0] * K[0] + 4 * K[0] * C)) / 2)) + t(' — le dissociazioni successive pesano poco se K_a1/K_a2 > 10³.', ' — later dissociations matter little if K_a1/K_a2 > 10³.'));
        S.r('pH', -lh, '');
      } },
    { id: 'distribuzione', liv: 1, arg: 'anal', nome: ['Frazioni di distribuzione a un pH', 'Distribution fractions at a pH'], dati: [['Ka', ['K_a1, K_a2', 'K_a1, K_a2'], '', '4.3e-7, 4.8e-11'], ['pH', 'pH', '', 8.3]],
      testo: function (d) { return ['Per un acido diprotico con K_a1, K_a2 = ' + d.Ka + ' (es. H₂CO₃) calcolare le frazioni α₀, α₁, α₂ a pH ' + d.pH + '.', 'For a diprotic acid with K_a1, K_a2 = ' + d.Ka + ' (e.g. H₂CO₃) compute α₀, α₁, α₂ at pH ' + d.pH + '.']; },
      risolvi: function (d, S) { var K = String(d.Ka).split(',').map(Number), H = Math.pow(10, -d.pH), den = H * H + K[0] * H + K[0] * K[1]; S.p(t('Formule', 'Formulas'), 'α₀ = [H⁺]²/D, α₁ = K₁[H⁺]/D, α₂ = K₁K₂/D, D = [H⁺]² + K₁[H⁺] + K₁K₂'); var a0 = H * H / den, a1 = K[0] * H / den, a2 = K[0] * K[1] / den; S.p(t('Valori', 'Values'), 'α₀ = <b>' + n4(a0) + '</b>, α₁ = <b>' + n4(a1) + '</b>, α₂ = <b>' + n4(a2) + '</b>'); S.r('α₀', a0, ''); S.r('α₁', a1, ''); S.r('α₂', a2, ''); } },
    { id: 'ppm', liv: 1, arg: 'anal', nome: ['ppm, ppb e molarità', 'ppm, ppb and molarity'], dati: [['ppm', ['concentrazione', 'concentration'], 'ppm (mg/L)', 25], ['f', ['specie', 'species'], '', 'NO3^-']],
      testo: function (d) { return ['Un’acqua contiene ' + d.ppm + ' ppm di ' + fChim(d.f) + '. Esprimere la concentrazione in mol/L, mmol/L e ppb (soluzione acquosa diluita, 1 L ≈ 1 kg).', 'A water contains ' + d.ppm + ' ppm of ' + fChim(d.f) + '. Express it in mol/L, mmol/L and ppb (dilute aqueous solution, 1 L ≈ 1 kg).']; },
      risolvi: function (d, S) { S.p(t('Definizione', 'Definition'), t('In acqua diluita 1 ppm = 1 mg/L, 1 ppb = 1 μg/L.', 'In dilute water 1 ppm = 1 mg/L, 1 ppb = 1 μg/L.')); var M = massaMolare(d.f).M, c = S.f(t('Molarità', 'Molarity'), 'c = (ppm·10⁻³ g/L)/M', n4(d.ppm) + '·10⁻³/' + n4(M), d.ppm * 1e-3 / M, 'mol/L'); S.p('mmol/L', q(c * 1000, 'mmol/L')); var ppb = S.f('ppb', 'ppb = 1000·ppm', '', d.ppm * 1000, 'ppb'); S.r('c', c, 'M'); S.r('ppb', ppb, ''); } },
    /* ═════════════════ AVANZATO — Chimica Fisica ═════════════════ */
    { id: 'vanthoff', liv: 2, arg: 'cf', nome: ['Equazione di van ’t Hoff', 'Van ’t Hoff equation'], dati: [['K1', 'K₁', '', 1.5e-5], ['T1', 'T₁', 'K', 298], ['K2', 'K₂', '', 8.2e-4], ['T2', 'T₂', 'K', 350]],
      testo: function (d) { return ['La costante di equilibrio vale ' + n4(d.K1) + ' a ' + d.T1 + ' K e ' + n4(d.K2) + ' a ' + d.T2 + ' K. Calcolare ΔH° e ΔS° (supposti costanti).', 'The equilibrium constant is ' + n4(d.K1) + ' at ' + d.T1 + ' K and ' + n4(d.K2) + ' at ' + d.T2 + ' K. Compute ΔH° and ΔS° (assumed constant).']; },
      risolvi: function (d, S) { var dH = S.f('ΔH°', 'ln(K₂/K₁) = −(ΔH°/R)(1/T₂ − 1/T₁)', '', -Rg * Math.log(d.K2 / d.K1) / (1 / d.T2 - 1 / d.T1) / 1000, 'kJ/mol'), dG = -Rg * d.T1 * Math.log(d.K1) / 1000, dS = S.f('ΔS°', 'ΔS° = (ΔH° − ΔG°)/T, ΔG° = −RT ln K', '', (dH - dG) * 1000 / d.T1, 'J/(mol·K)'); S.p(t('Le Chatelier', 'Le Chatelier'), dH > 0 ? t('Endotermica: K cresce con T.', 'Endothermic: K grows with T.') : t('Esotermica: K cala con T.', 'Exothermic: K falls with T.')); S.r('ΔH°', dH, 'kJ/mol'); S.r('ΔS°', dS, 'J/(mol·K)'); } },
    { id: 'clapeyron', liv: 2, arg: 'cf', nome: ['Clausius-Clapeyron', 'Clausius-Clapeyron'], dati: [['p1', 'p₁', 'kPa', 101.325], ['T1', 'T₁', 'K', 373.15], ['dH', 'ΔH_vap', 'kJ/mol', 40.7], ['T2', 'T₂', 'K', 343.15]],
      testo: function (d) { return ['Un liquido ha tensione di vapore ' + d.p1 + ' kPa a ' + d.T1 + ' K e ΔH_vap = ' + d.dH + ' kJ/mol. Calcolare la tensione di vapore a ' + d.T2 + ' K.', 'A liquid has vapour pressure ' + d.p1 + ' kPa at ' + d.T1 + ' K and ΔH_vap = ' + d.dH + ' kJ/mol. Compute the vapour pressure at ' + d.T2 + ' K.']; },
      risolvi: function (d, S) { var p2 = S.f('p₂', 'ln(p₂/p₁) = −(ΔH_vap/R)(1/T₂ − 1/T₁)', '', d.p1 * Math.exp(-d.dH * 1000 / Rg * (1 / d.T2 - 1 / d.T1)), 'kPa'); S.p(t('Ipotesi', 'Assumptions'), t('Vapore ideale, volume del liquido trascurabile, ΔH_vap costante nell’intervallo.', 'Ideal vapour, negligible liquid volume, ΔH_vap constant over the interval.')); S.r('p₂', p2, 'kPa'); } },
    { id: 'polieni', liv: 2, arg: 'quant', nome: ['Particella nella scatola: polieni', 'Particle in a box: polyenes'], dati: [['N', ['elettroni π (numero di atomi di C coniugati)', 'π electrons (conjugated C atoms)'], '', 6], ['l', ['lunghezza media di legame', 'average bond length'], 'nm', 0.139]],
      testo: function (d) { return ['Un polieno lineare ha ' + d.N + ' elettroni π. Con il modello della particella in una scatola (lunghezza L = (N − 1)l + l, l = ' + d.l + ' nm) stimare la lunghezza d’onda della transizione HOMO → LUMO.', 'A linear polyene has ' + d.N + ' π electrons. With the particle-in-a-box model (length L = (N − 1)l + l, l = ' + d.l + ' nm) estimate the HOMO → LUMO wavelength.']; },
      risolvi: function (d, S) { var N = +d.N, L = N * d.l * 1e-9; S.p(t('Livelli', 'Levels'), 'E_n = n²h²/(8m_eL²); ' + t('N elettroni riempiono i livelli fino a n = N/2 (due per livello).', 'N electrons fill levels up to n = N/2 (two per level).')); S.f('L', 'L = N·l', '', L * 1e9, 'nm'); var dE = (N + 1) * h * h / (8 * me * L * L), lam = S.f('λ', 'λ = hc/ΔE = 8m_ecL²/(h(N + 1))', '', h * c0 / dE * 1e9, 'nm'); S.p(t('Limiti del modello', 'Model limits'), t('È una stima: il modello ignora l’alternanza dei legami e sovrastima λ per le catene corte (esatriene: 258 nm misurati).', 'It is an estimate: the model ignores bond alternation and overestimates λ for short chains (hexatriene: 258 nm measured).')); S.p(t('Commento', 'Comment'), t('Più lunga la catena coniugata, più piccolo ΔE e più rossa la luce assorbita (β-carotene: N = 22, arancione).', 'The longer the conjugated chain, the smaller ΔE and the redder the absorbed light (β-carotene: N = 22, orange).')); S.r('λ', lam, 'nm'); } },
    { id: 'rotore', liv: 2, arg: 'quant', nome: ['Rotore rigido e oscillatore armonico', 'Rigid rotor and harmonic oscillator'], dati: [['m1', ['massa atomo 1', 'atom 1 mass'], 'u', 1.008], ['m2', ['massa atomo 2', 'atom 2 mass'], 'u', 34.969], ['r', ['lunghezza di legame', 'bond length'], 'pm', 127.5], ['k', ['costante di forza', 'force constant'], 'N/m', 516]],
      testo: function (d) { return ['Per una molecola biatomica (masse ' + d.m1 + ' e ' + d.m2 + ' u, r = ' + d.r + ' pm, k = ' + d.k + ' N/m) calcolare la costante rotazionale B, la spaziatura delle righe rotazionali e il numero d’onda vibrazionale.', 'For a diatomic (masses ' + d.m1 + ' and ' + d.m2 + ' u, r = ' + d.r + ' pm, k = ' + d.k + ' N/m) compute the rotational constant B, the rotational line spacing and the vibrational wavenumber.']; },
      risolvi: function (d, S) { var u = 1.66053906660e-27, mu = S.f(t('Massa ridotta', 'Reduced mass'), 'μ = m₁m₂/(m₁ + m₂)', '', d.m1 * d.m2 / (+d.m1 + +d.m2), 'u'), I = mu * u * Math.pow(d.r * 1e-12, 2), B = S.f('B', 'B = h/(8π²cI)', '', h / (8 * Math.PI * Math.PI * c0 * 100 * I), 'cm⁻¹'); S.p(t('Spettro rotazionale', 'Rotational spectrum'), t('righe a 2B(J + 1): spaziatura 2B = ', 'lines at 2B(J + 1): spacing 2B = ') + q(2 * B, 'cm⁻¹')); var nu = S.f(t('Vibrazione', 'Vibration'), 'ν̃ = (1/2πc)√(k/μ)', '', Math.sqrt(d.k / (mu * u)) / (2 * Math.PI * c0 * 100), 'cm⁻¹'); S.r('B', B, 'cm⁻¹'); S.r('ν̃', nu, 'cm⁻¹'); } },
    { id: 'michaelis', liv: 2, arg: 'cf', nome: ['Michaelis-Menten con inibizione', 'Michaelis-Menten with inhibition'], dati: [['Vmax', 'V_max', 'μM/s', 50], ['Km', 'K_M', 'μM', 20], ['S', '[S]', 'μM', 10], ['I', ['[I] (0: nessun inibitore)', '[I] (0: no inhibitor)'], 'μM', 5], ['Ki', 'K_i', 'μM', 2], ['tipo', ['inibizione: competitiva | noncompetitiva | incompetitiva', 'inhibition: competitiva | noncompetitiva | incompetitiva'], '', 'competitiva']],
      testo: function (d) { return ['Un enzima ha V_max = ' + d.Vmax + ' μM/s e K_M = ' + d.Km + ' μM. Calcolare la velocità con [S] = ' + d.S + ' μM, senza e con ' + d.I + ' μM di inibitore ' + d.tipo + ' (K_i = ' + d.Ki + ' μM).', 'An enzyme has V_max = ' + d.Vmax + ' μM/s and K_M = ' + d.Km + ' μM. Compute the rate at [S] = ' + d.S + ' μM, without and with ' + d.I + ' μM of ' + d.tipo + ' inhibitor (K_i = ' + d.Ki + ' μM).']; },
      risolvi: function (d, S) { var v0 = S.f(t('Senza inibitore', 'No inhibitor'), 'v = V_max[S]/(K_M + [S])', '', d.Vmax * d.S / (+d.Km + +d.S), 'μM/s'), a = 1 + d.I / d.Ki, Vapp = d.Vmax, Kapp = d.Km; if (d.tipo === 'competitiva') Kapp = d.Km * a; else if (d.tipo === 'noncompetitiva') Vapp = d.Vmax / a; else { Vapp = d.Vmax / a; Kapp = d.Km / a; } S.p(t('Parametri apparenti', 'Apparent parameters'), 'α = 1 + [I]/K_i = ' + n4(a) + ' ⇒ V_max,app = ' + q(Vapp, 'μM/s') + ', K_M,app = ' + q(Kapp, 'μM')); var vi = S.f(t('Con inibitore', 'With inhibitor'), 'v = V_max,app[S]/(K_M,app + [S])', '', Vapp * d.S / (Kapp + +d.S), 'μM/s'); S.p('Lineweaver-Burk', d.tipo === 'competitiva' ? t('Rette con la stessa intercetta 1/V_max: si superano con molto substrato.', 'Lines with the same intercept 1/V_max: overcome by much substrate.') : d.tipo === 'noncompetitiva' ? t('Stessa intercetta sull’asse x (−1/K_M).', 'Same x-axis intercept (−1/K_M).') : t('Rette parallele.', 'Parallel lines.')); S.r('v₀', v0, 'μM/s'); S.r('v_I', vi, 'μM/s'); } },
    /* ═════════════════ AVANZATISSIMO ═════════════════ */
    { id: 'sackur', liv: 3, arg: 'stat', nome: ['Entropia di Sackur-Tetrode', 'Sackur-Tetrode entropy'], dati: [['M', ['massa molare del gas monoatomico', 'monatomic gas molar mass'], 'g/mol', 39.948], ['T', 'T', 'K', 298.15], ['p', 'p', 'bar', 1]],
      testo: function (d) { return ['Calcolare con la termodinamica statistica l’entropia molare standard di un gas monoatomico ideale (M = ' + d.M + ' g/mol) a ' + d.T + ' K e ' + d.p + ' bar, e confrontarla con il valore sperimentale.', 'Use statistical thermodynamics to compute the standard molar entropy of an ideal monatomic gas (M = ' + d.M + ' g/mol) at ' + d.T + ' K and ' + d.p + ' bar, and compare it with experiment.']; },
      risolvi: function (d, S) { var m = d.M / 1000 / NA, lam = S.f(t('Lunghezza d’onda termica', 'Thermal wavelength'), 'Λ = h/√(2πmk_BT)', '', h / Math.sqrt(2 * Math.PI * m * kB * d.T), 'm'), V = kB * d.T / (d.p * 1e5); S.f(t('Volume per molecola', 'Volume per molecule'), 'V/N = k_BT/p', '', V, 'm³'); var Sm = S.f('S°', 'S = R[ln(V/(NΛ³)) + 5/2]', '', Rg * (Math.log(V / Math.pow(lam, 3)) + 2.5), 'J/(mol·K)'); S.p(t('Confronto', 'Comparison'), t('Argon sperimentale: 154,8 J/(mol·K). La formula non ha parametri regolabili: solo h, k_B e la massa.', 'Argon experimental: 154.8 J/(mol·K). The formula has no adjustable parameters: just h, k_B and the mass.')); S.r('S°', Sm, 'J/(mol·K)'); } },
    { id: 'debye', liv: 3, arg: 'stat', nome: ['Debye-Hückel: forza ionica e attività', 'Debye-Hückel: ionic strength and activity'], dati: [['ioni', ['ioni (carica: concentrazione M, …)', 'ions (charge: concentration M, …)'], '', '+2: 0.01, -1: 0.02'], ['z', ['carica dello ione di interesse', 'charge of the ion of interest'], '', 2], ['a', ['diametro ionico (Debye-Hückel esteso)', 'ion size (extended Debye-Hückel)'], 'pm', 600]],
      testo: function (d) { return ['In una soluzione acquosa a 25 °C con ioni ' + d.ioni + ' calcolare la forza ionica e il coefficiente di attività di uno ione di carica ' + d.z + ' (legge limite ed estesa, a = ' + d.a + ' pm).', 'In aqueous solution at 25 °C with ions ' + d.ioni + ' compute the ionic strength and the activity coefficient of an ion of charge ' + d.z + ' (limiting and extended law, a = ' + d.a + ' pm).']; },
      risolvi: function (d, S) { var o = lista(d.ioni), I = 0; Object.keys(o).forEach(function (k) { I += 0.5 * o[k] * Math.pow(+k, 2); }); S.f(t('Forza ionica', 'Ionic strength'), 'I = ½Σc_iz_i²', '', I, 'M'); var z = +d.z, g1 = S.f(t('Legge limite', 'Limiting law'), 'log γ = −0,509z²√I', '', Math.pow(10, -0.509 * z * z * Math.sqrt(I)), ''), g2 = S.f(t('Debye-Hückel esteso', 'Extended Debye-Hückel'), 'log γ = −0,509z²√I/(1 + 3,28·a(nm)·√I)', '', Math.pow(10, -0.509 * z * z * Math.sqrt(I) / (1 + 3.28 * d.a / 1000 * Math.sqrt(I))), ''); S.p(t('Validità', 'Validity'), t('Legge limite fino a I ≈ 10⁻³ M; estesa fino a ~0,1 M.', 'Limiting law up to I ≈ 10⁻³ M; extended up to ~0.1 M.')); S.r('I', I, 'M'); S.r('γ', g2, ''); } },
    { id: 'ossigeno', liv: 3, arg: 'stat', nome: ['Elettrodo a ossigeno e diagramma E-pH', 'Oxygen electrode and E-pH diagram'], dati: [['pH', 'pH', '', 7], ['pO2', ['p(O₂)', 'p(O₂)'], 'bar', 0.21]],
      testo: function (d) { return ['Calcolare il potenziale della coppia O₂/H₂O a pH ' + d.pH + ' e p(O₂) = ' + d.pO2 + ' bar, e i limiti di stabilità dell’acqua.', 'Compute the O₂/H₂O couple potential at pH ' + d.pH + ' and p(O₂) = ' + d.pO2 + ' bar, and the stability limits of water.']; },
      risolvi: function (d, S) { S.p(t('Semireazione', 'Half-reaction'), 'O₂ + 4H⁺ + 4e⁻ ⇌ 2H₂O, E° = 1,229 V'); var E = S.f('Nernst', 'E = 1,229 − 0,05916·pH + (0,05916/4)·log p(O₂)', '', 1.229 - 0.05916 * d.pH + 0.05916 / 4 * Math.log10(d.pO2), 'V'), EH = S.f(t('Limite inferiore (H₂)', 'Lower limit (H₂)'), 'E = −0,05916·pH', '', -0.05916 * d.pH, 'V'); S.p(t('Diagramma di Pourbaix', 'Pourbaix diagram'), t('Le due rette hanno pendenza −59 mV per unità di pH: fra le due l’acqua è stabile, sopra si ossida a O₂, sotto si riduce a H₂.', 'Both lines slope −59 mV per pH unit: between them water is stable, above it oxidises to O₂, below it reduces to H₂.')); S.r('E(O₂)', E, 'V'); S.r('E(H₂)', EH, 'V'); } }
  ];
  var PER_ID = {}; MODELLI.forEach(function (m) { PER_ID[m.id] = m; });
  function risolvi(id, dati) {
    var m = PER_ID[id], d = {}, S = svolgimento();
    m.dati.forEach(function (c) { var v = dati && dati[c[0]] != null ? dati[c[0]] : c[3]; d[c[0]] = typeof c[3] === 'number' ? +String(v).replace(',', '.') : String(v).trim(); });
    m.risolvi(d, S);
    return { passi: S.passi, risultati: S.ris, testo: m.testo(d), dati: d };
  }

  var LIVELLI = [['Base — Chimica Generale e Inorganica', 'Basic — General and Inorganic Chemistry'], ['Intermedio — Chimica Analitica', 'Intermediate — Analytical Chemistry'], ['Avanzato — Chimica Fisica', 'Advanced — Physical Chemistry'], ['Avanzatissimo — termodinamica statistica, attività, elettrochimica', 'Expert — statistical thermodynamics, activities, electrochemistry']];
  var ARGOMENTI = [
    ['moli', ['La mole e la formula', 'The mole and the formula'], ['Massa atomica e molare, numero di Avogadro, composizione percentuale, formula minima e molecolare. Tutti i problemi di chimica passano dalle moli: trasforma subito masse, volumi di gas e concentrazioni in moli.', 'Atomic and molar mass, Avogadro’s number, percentage composition, empirical and molecular formula. Every chemistry problem goes through moles: convert masses, gas volumes and concentrations to moles right away.']],
    ['stech', ['Stechiometria', 'Stoichiometry'], ['Bilanciamento, rapporti molari, reagente limitante (il più piccolo rapporto moli/coefficiente), resa teorica e percentuale.', 'Balancing, mole ratios, limiting reagent (smallest moles/coefficient ratio), theoretical and percentage yield.']],
    ['sol', ['Soluzioni e solubilità', 'Solutions and solubility'], ['Molarità, molalità, frazione molare, diluizioni (c₁V₁ = c₂V₂), proprietà colligative (dipendono dal numero di particelle: conta i), prodotto di solubilità, ione comune, previsione della precipitazione (Q contro K_sp).', 'Molarity, molality, mole fraction, dilutions (c₁V₁ = c₂V₂), colligative properties (depend on the number of particles: mind i), solubility product, common ion, predicting precipitation (Q versus K_sp).']],
    ['gas', ['Gas', 'Gases'], ['pV = nRT con R = 0,08206 L·atm/(mol·K) o 8,314 J/(mol·K); legge di Dalton; densità e massa molare di un gas.', 'pV = nRT with R = 0.08206 L·atm/(mol·K) or 8.314 J/(mol·K); Dalton’s law; gas density and molar mass.']],
    ['termo', ['Termochimica e termodinamica', 'Thermochemistry and thermodynamics'], ['Calorimetria, legge di Hess, entalpie di formazione, entropia, energia di Gibbs ΔG = ΔH − TΔS e il legame con K: ΔG° = −RT ln K.', 'Calorimetry, Hess’s law, formation enthalpies, entropy, Gibbs energy ΔG = ΔH − TΔS and its link to K: ΔG° = −RT ln K.']],
    ['cin', ['Cinetica', 'Kinetics'], ['Velocità e ordine di reazione, leggi integrate di ordine 0, 1, 2, tempo di dimezzamento, equazione di Arrhenius.', 'Rate and order, integrated laws of order 0, 1, 2, half-life, Arrhenius equation.']],
    ['eq', ['Equilibrio chimico', 'Chemical equilibrium'], ['Legge di azione di massa, K_c e K_p, quoziente di reazione, tabella ICE, principio di Le Chatelier.', 'Law of mass action, K_c and K_p, reaction quotient, ICE table, Le Chatelier’s principle.']],
    ['ab', ['Acidi e basi', 'Acids and bases'], ['Brønsted-Lowry, K_w, pH di acidi e basi forti e deboli, idrolisi dei sali, tamponi (Henderson-Hasselbalch). Controlla sempre l’approssimazione x ≪ C.', 'Brønsted-Lowry, K_w, pH of strong and weak acids and bases, salt hydrolysis, buffers (Henderson-Hasselbalch). Always check the approximation x ≪ C.']],
    ['elettro', ['Elettrochimica', 'Electrochemistry'], ['Potenziali standard, pile, equazione di Nernst, ΔG = −nFE, costante di equilibrio da E°, leggi di Faraday.', 'Standard potentials, cells, Nernst equation, ΔG = −nFE, equilibrium constant from E°, Faraday’s laws.']],
    ['atomo', ['Struttura atomica', 'Atomic structure'], ['Modello di Bohr e righe dell’idrogeno, dualismo onda-particella (de Broglie), numeri quantici e configurazioni elettroniche.', 'Bohr model and hydrogen lines, wave-particle duality (de Broglie), quantum numbers and electron configurations.']],
    ['anal', ['Chimica analitica', 'Analytical chemistry'], ['Titolazioni acido-base (con il bilancio di carica), complessometriche (EDTA), redox; gravimetria; spettrofotometria (Lambert-Beer); acidi poliprotici e frazioni di distribuzione.', 'Acid-base (with the charge balance), complexometric (EDTA) and redox titrations; gravimetry; spectrophotometry (Beer-Lambert); polyprotic acids and distribution fractions.']],
    ['cf', ['Chimica fisica: termodinamica e cinetica', 'Physical chemistry: thermodynamics and kinetics'], ['van ’t Hoff, Clausius-Clapeyron, diagrammi di stato, cinetica enzimatica e inibizione.', 'Van ’t Hoff, Clausius-Clapeyron, phase diagrams, enzyme kinetics and inhibition.']],
    ['quant', ['Chimica fisica: quantistica e spettroscopia', 'Physical chemistry: quantum and spectroscopy'], ['Particella nella scatola (polieni), rotore rigido e oscillatore armonico (spettri rotazionali e vibrazionali). Approfondimenti nella categoria ⚛️ Fisica.', 'Particle in a box (polyenes), rigid rotor and harmonic oscillator (rotational and vibrational spectra). More in the ⚛️ Physics category.']],
    ['stat', ['Avanzatissimo', 'Expert'], ['Termodinamica statistica (Sackur-Tetrode), attività e Debye-Hückel, diagrammi E-pH (Pourbaix).', 'Statistical thermodynamics (Sackur-Tetrode), activities and Debye-Hückel, E-pH (Pourbaix) diagrams.']]
  ];
  var PROVE = [
    [['limitante', { rx: 'Fe2O3 + CO -> Fe + CO2', masse: 'Fe2O3: 100, CO: 50', prod: 'Fe', reale: 60 }], ['acidodebole', { Ka: 6.3e-5, C: 0.05 }], ['equilibrio', { coef: '1, 1, 2, 0', c0: '1, 1, 0, 0', K: 64 }], ['pila', { Ec: 0.80, Ea: 0.34, n: 2, Q: 0.1 }]],
    [['formulaminima', { comp: 'C: 85.6, H: 14.4', M: 56 }], ['tampone', { pKa: 9.25, na: 0.2, nb: 0.15, agg: -0.02 }], ['ksp', { Ksp: 1.1e-12, x: 2, y: 1, comune: 0.1 }], ['cinetica', { ord: 2, k: 0.5, A0: 0.2, t: 30 }]],
    [['hess', { rx: 'C3H8 + O2 -> CO2 + H2O', Hf: 'C3H8: -103.8, O2: 0, CO2: -393.5, H2O: -285.8', S: 'C3H8: 270.3, O2: 205.2, CO2: 213.8, H2O: 70.0', T: 298.15 }], ['gas', { p: 0.98, V: 1.5, T: 310, m: 2.31 }], ['colligative', { m: 5.85, M: 58.44, i: 2, mw: 250, V: 252, T: 298.15 }], ['elettrolisi', { I: 1.5, t: 45, n: 3, f: 'Al' }]],
    [['titolazione', { Ca: 0.1, Va: 50, Ka: 1.8e-5, Cb: 0.1, Vb: 25 }], ['beer', { A: 0.62, eps: 6220, l: 1, M: 663.4 }], ['gravimetria', { pp: 'AgCl', mp: 0.2866, an: 'Cl', k: 1, mc: 0.5 }]],
    [['edta', { V: 21.5, C: 0.0105, Vc: 100 }], ['poliprotico', { Ka: '7.5e-3, 6.2e-8, 4.8e-13', C: 0.05 }], ['permanganato', { V: 22.4, C: 0.0198, Vc: 20 }]],
    [['vanthoff', { K1: 1.0e-3, T1: 300, K2: 5.0e-2, T2: 400 }], ['polieni', { N: 8, l: 0.139 }], ['rotore', { m1: 12.000, m2: 15.995, r: 112.8, k: 1902 }], ['sackur', { M: 20.180, T: 298.15, p: 1 }]],
    [['michaelis', { Vmax: 120, Km: 8, S: 4, I: 10, Ki: 5, tipo: 'noncompetitiva' }], ['clapeyron', { p1: 101.325, T1: 351.4, dH: 38.6, T2: 300 }], ['debye', { ioni: '+1: 0.05, -1: 0.05, +2: 0.01, -2: 0.01', z: 1, a: 900 }], ['ossigeno', { pH: 0, pO2: 1 }]]
  ];
  var NOMI_PROVE = [['Chimica Generale 1', 'General Chemistry 1'], ['Chimica Generale 2', 'General Chemistry 2'], ['Chimica Generale 3', 'General Chemistry 3'], ['Chimica Analitica 1', 'Analytical Chemistry 1'], ['Chimica Analitica 2', 'Analytical Chemistry 2'], ['Chimica Fisica 1', 'Physical Chemistry 1'], ['Chimica Fisica 2 (avanzata)', 'Physical Chemistry 2 (advanced)']];

  function mostra(cont, id, dati) {
    cont.innerHTML = '';
    var r;
    try { r = risolvi(id, dati); } catch (err) { cont.innerHTML = '<div class="bsiFX-nota bsiFX-ko">⚠ ' + esc(err.message) + '</div>'; return null; }
    cont.appendChild(F.el('div', { 'class': 'bsiFX-eq', style: 'font-family:inherit', html: '<b>' + t('Problema. ', 'Problem. ') + '</b>' + esc(F.tt(r.testo)) }));
    var ol = F.el('ol', { style: 'margin:6px 0 0 0;padding-left:20px' });
    r.passi.forEach(function (p) { ol.appendChild(F.el('li', { style: 'margin:7px 0', html: '<b style="color:#5eead4">' + esc(p.titolo) + '</b><div style="margin-top:2px;line-height:1.6">' + p.html + '</div>' })); });
    cont.appendChild(ol);
    cont.appendChild(F.el('div', { 'class': 'bsiFX-eq', style: 'font-family:inherit', html: '<b>' + t('Risultati: ', 'Results: ') + '</b>' + r.risultati.map(function (x) { return esc(x.nome) + ' = ' + q(x.v, x.u); }).join(' · ') }));
    return r;
  }
  var apri = null;
  function schedaProgramma(div) {
    div.appendChild(F.el('div', { 'class': 'bsiFX-nota', html: t('I problemi numerici dei corsi di <b>Chimica Generale e Inorganica, Chimica Analitica e Chimica Fisica</b> del corso di laurea in Chimica (programmi su ', 'The numerical problems of the <b>General and Inorganic, Analytical and Physical Chemistry</b> courses of the Chemistry degree (syllabi on ') + '<a href="https://www.uniba.it/it/corsi/chimica/studiare/piano-di-studi/elenco-insegnamenti-e-docenti-affidatari" target="_blank" rel="noopener" style="color:#5eead4">uniba.it</a>), ' + t('su quattro livelli. Per la chimica organica, la spettroscopia e la biochimica ci sono le sezioni dedicate dell’app.', 'on four levels. Organic chemistry, spectroscopy and biochemistry have their own sections in the app.') }));
    LIVELLI.forEach(function (L, liv) {
      div.appendChild(F.el('div', { 'class': 'bsiFX-tit', style: 'font-size:1.1rem;margin-top:12px', testo: F.tt(L) }));
      ARGOMENTI.forEach(function (a) {
        var mod = MODELLI.filter(function (m) { return m.arg === a[0] && m.liv === liv; }); if (!mod.length) return;
        var d = F.el('details', { 'class': 'bsiFX-pannello', style: 'margin:6px 0' });
        d.appendChild(F.el('summary', { style: 'cursor:pointer;font-weight:700;color:#e6fffb', testo: F.tt(a[1]) }));
        d.appendChild(F.el('div', { 'class': 'bsiFX-nota', style: 'font-size:.88rem', testo: F.tt(a[2]) }));
        var box = F.el('div', { style: 'display:flex;flex-wrap:wrap;gap:4px' });
        mod.forEach(function (m) { box.appendChild(F.el('button', { type: 'button', 'class': 'bsiFX-bott', testo: F.tt(m.nome) + ' →', onclick: function () { var b = document.querySelectorAll('#schiesame .bsiFX-schede button')[1]; if (b) b.click(); if (apri) apri(m.id); } })); });
        d.appendChild(box); div.appendChild(d);
      });
    });
  }
  function schedaRisolutore(div) {
    var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div', { 'class': 'bsiFX-pannello', style: 'overflow-x:auto' });
    g.appendChild(pan); g.appendChild(dx); div.appendChild(g);
    var id = 'limitante', campi = F.el('div'), inputs = {}, sig = ['B', 'I', 'A', 'A+'];
    var sel = F.scelta(pan, ['Problema', 'Problem'], MODELLI.map(function (m) { return [m.id, ['[' + sig[m.liv] + '] ' + m.nome[0], '[' + sig[m.liv] + '] ' + m.nome[1]]]; }), id, function (v) { id = v; costruisci(); });
    pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('B base · I intermedio · A avanzato · A+ avanzatissimo', 'B basic · I intermediate · A advanced · A+ expert') }));
    pan.appendChild(campi);
    F.bottone(pan, ['Risolvi', 'Solve'], calcola);
    function costruisci() {
      campi.innerHTML = ''; inputs = {};
      PER_ID[id].dati.forEach(function (c) {
        campi.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: F.tt(c[1]) + (c[2] && typeof c[2] === 'string' ? ' (' + c[2] + ')' : '') }));
        var inp = F.el('input', { type: 'text', value: String(c[3]), 'aria-label': F.tt(c[1]) });
        inp.addEventListener('change', calcola); campi.appendChild(inp); inputs[c[0]] = inp;
      });
      calcola();
    }
    function calcola() { var d = {}; Object.keys(inputs).forEach(function (k) { d[k] = inputs[k].value; }); mostra(dx, id, d); }
    apri = function (k) { id = k; sel.value = k; costruisci(); };
    costruisci();
  }
  function schedaProve(div) {
    div.appendChild(F.el('div', { 'class': 'bsiFX-nota', html: t('<b>Prove nello stile dello scritto</b>, costruite sui programmi: non sono i testi ufficiali degli appelli.', '<b>Papers in the style of the written exam</b>, built on the syllabi: not the official papers.') }));
    PROVE.forEach(function (ap, i) {
      var d = F.el('details', { 'class': 'bsiFX-pannello', style: 'margin:6px 0' });
      d.appendChild(F.el('summary', { style: 'cursor:pointer;font-weight:700;color:#e6fffb', testo: F.tt(NOMI_PROVE[i]) + ' — ' + ap.map(function (p) { return F.tt(PER_ID[p[0]].nome); }).join(' · ') }));
      ap.forEach(function (p, j) {
        var box = F.el('div', { style: 'border-top:1px solid #16263d;padding:8px 0' }), m = PER_ID[p[0]], dd = {};
        m.dati.forEach(function (c) { dd[c[0]] = p[1][c[0]] != null ? p[1][c[0]] : c[3]; });
        box.appendChild(F.el('div', { html: '<b>' + (j + 1) + '.</b> ' + esc(F.tt(m.testo(dd))) }));
        var sol = F.el('div', { style: 'display:none' });
        F.bottone(box, ['Mostra lo svolgimento', 'Show the solution'], function () { if (sol.style.display === 'none') { sol.style.display = ''; if (!sol.firstChild) mostra(sol, p[0], p[1]); } else sol.style.display = 'none'; });
        box.appendChild(sol); d.appendChild(box);
      });
      div.appendChild(d);
    });
  }

  F.calcolo.esameChimica = { MODELLI: MODELLI, risolvi: risolvi, PROVE: PROVE, massaMolare: massaMolare, MA: MA };

  F.sezione('schiesame', {
    titolo: ['🎓 Esame di Chimica (UniBA)', '🎓 Chemistry exam (UniBA)'],
    sotto: ['Chimica Generale e Inorganica, Analitica e Fisica dalla base all’avanzatissimo: il programma per livelli, oltre quaranta problemi tipo risolti con i tuoi dati (reazioni bilanciate da sole, masse molari IUPAC), prove d’esame svolte.',
            'General and Inorganic, Analytical and Physical Chemistry from basic to expert: the syllabus by level, over forty standard problems solved with your data (self-balancing reactions, IUPAC molar masses), solved exam papers.'],
    schede: [
      { nome: ['Programma per livelli', 'Syllabus by level'], costruisci: schedaProgramma },
      { nome: ['Risolutore dei problemi', 'Problem solver'], costruisci: schedaRisolutore },
      { nome: ['Prove svolte', 'Solved papers'], costruisci: schedaProve }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
