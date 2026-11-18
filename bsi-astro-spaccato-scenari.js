/* ═══════════════════════════════════════════════════════════════════════
   bsi-astro-spaccato-scenari.js — i dati degli «Spaccati stellari» (v260)
   BioSpecInfo · © Samuele Pio Provenzano

   Solo dati e funzioni pure (niente DOM né WebGL): il motore
   bsi-astro-spaccato.js li disegna, il banco test_spaccato li verifica.

   Ogni scenario: { id, titolo, sottotitolo, spiegazione, corpo, strati,
   comp0, stadi[], finale, fonti[] }. Ogni stadio: durata fisica (s), durata
   dell'animazione (s), reazioni (stringhe che il banco bilancia in A e Z),
   composizione alla FINE dello stadio (percentuali in massa, somma 100),
   grandezze per l'HUD. Le reazioni si scrivono «4 1H -> 4He + 2 e+ + 2 nue».

   ONESTA': le durate e le temperature vengono dalle fonti citate; le
   composizioni «a fine stadio» delle stelle massicce sono lette dai profili
   pubblicati e arrotondate (INDICATIVE); i raggi degli strati nel disegno
   NON sono in scala (il nucleo di ferro è un milionesimo del raggio della
   supergigante). Dove una grandezza è calcolata (decadimenti di ⁵⁶Ni, BBN,
   calore di ²⁶Al) la si calcola qui.
   ═══════════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  var ANNO = 3.15576e7, GIORNO = 86400, MYR = 1e6 * ANNO, GYR = 1e9 * ANNO, MEV = 1.602176634e-13;

  /* ── componenti: simbolo → nome IT/EN, colore, Z (per bilanciare) ── */
  var COMP = {
    H: { n: ['Idrogeno', 'Hydrogen'], c: '#7cc4ff', Z: 1 }, D: { n: ['Deuterio', 'Deuterium'], c: '#a9dcff', Z: 1 },
    He: { n: ['Elio', 'Helium'], c: '#b9a2ff', Z: 2 }, Li: { n: ['Litio', 'Lithium'], c: '#ff9f9f', Z: 3 }, Be: { n: ['Berillio', 'Beryllium'], c: '#d0d0a0', Z: 4 },
    C: { n: ['Carbonio', 'Carbon'], c: '#ff8fc8', Z: 6 }, N: { n: ['Azoto', 'Nitrogen'], c: '#8f9cff', Z: 7 }, O: { n: ['Ossigeno', 'Oxygen'], c: '#ffab8a', Z: 8 },
    Ne: { n: ['Neon', 'Neon'], c: '#6fe0b0', Z: 10 }, Na: { n: ['Sodio', 'Sodium'], c: '#e0c080', Z: 11 }, Mg: { n: ['Magnesio', 'Magnesium'], c: '#c9e86b', Z: 12 },
    Al: { n: ['Alluminio', 'Aluminium'], c: '#b0b8c8', Z: 13 }, Si: { n: ['Silicio', 'Silicon'], c: '#ffc64a', Z: 14 }, P: { n: ['Fosforo', 'Phosphorus'], c: '#e89a6a', Z: 15 },
    S: { n: ['Zolfo', 'Sulfur'], c: '#d8b04a', Z: 16 }, Ca: { n: ['Calcio', 'Calcium'], c: '#e8e0b8', Z: 20 },
    Fe: { n: ['Ferro', 'Iron'], c: '#f2e6c9', Z: 26 }, Co: { n: ['Cobalto', 'Cobalt'], c: '#7fb0e0', Z: 27 }, Ni: { n: ['Nichel', 'Nickel'], c: '#9fd8c8', Z: 28 },
    Cd: { n: ['Cadmio', 'Cadmium'], c: '#a8c0d0', Z: 48 }, In: { n: ['Indio', 'Indium'], c: '#b8a8d0', Z: 49 }, Sr: { n: ['Stronzio', 'Strontium'], c: '#e0b0d8', Z: 38 },
    Ba: { n: ['Bario', 'Barium'], c: '#c8e0a0', Z: 56 }, Eu: { n: ['Europio', 'Europium'], c: '#c58fd6', Z: 63 }, Pt: { n: ['Platino', 'Platinum'], c: '#c8ccd6', Z: 78 }, Au: { n: ['Oro', 'Gold'], c: '#e8c35a', Z: 79 },
    n: { n: ['Neutroni', 'Neutrons'], c: '#9aa6b8', Z: 0 },
    Z: { n: ['Altri elementi', 'Other elements'], c: '#6b7f99' },
    /* componenti che non sono elementi singoli */
    rL: { n: ['r leggero (A < 140)', 'light r (A < 140)'], c: '#6bb8ff' }, rP: { n: ['r pesante: lantanidi, Pt, Au', 'heavy r: lanthanides, Pt, Au'], c: '#e8a05a' },
    NS: { n: ['Materia di stella di neutroni', 'Neutron-star matter'], c: '#9aa6b8' },
    H2: { n: ['H₂ molecolare', 'Molecular H₂'], c: '#7cc4ff' }, Hm: { n: ['Idrogeno metallico', 'Metallic hydrogen'], c: '#5a7fd6' }, Zc: { n: ['Nucleo diluito (roccia, ghiacci)', 'Dilute core (rock, ices)'], c: '#c08a5a' },
    crosta: { n: ['Crosta', 'Crust'], c: '#b89a74' }, mantello: { n: ['Mantello (silicati)', 'Mantle (silicates)'], c: '#d0703a' },
    nucE: { n: ['Nucleo esterno (Fe-Ni liquido)', 'Outer core (liquid Fe-Ni)'], c: '#ffb050' }, nucI: { n: ['Nucleo interno (Fe-Ni solido)', 'Inner core (solid Fe-Ni)'], c: '#fff0c8' },
    gas: { n: ['Gas interstellare', 'Interstellar gas'], c: '#5a8fd6' }, CO: { n: ['Carbonio e ossigeno', 'Carbon and oxygen'], c: '#ff9ab0' }
  };
  var SIMBOLO = { H: 'H', D: 'D' };

  /* ── reazioni: parser, bilancio, testo con apici ── */
  var APICI = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  var PARTICELLE = { 'e+': { A: 0, Z: 1, s: 'e⁺' }, 'e-': { A: 0, Z: -1, s: 'e⁻' }, nue: { A: 0, Z: 0, s: 'νₑ' }, anue: { A: 0, Z: 0, s: 'ν̄ₑ' }, g: { A: 0, Z: 0, s: 'γ' }, n: { A: 1, Z: 0, s: 'n' } };
  function apice(n) { return String(n).split('').map(function (c) { return APICI[c]; }).join(''); }
  function termine(s) {
    var m = /^(\d+)\s+(.+)$/.exec(s.trim()), k = 1, x = s.trim(); if (m) { k = +m[1]; x = m[2]; }
    if (PARTICELLE[x]) return { k: k, A: PARTICELLE[x].A, Z: PARTICELLE[x].Z, s: PARTICELLE[x].s };
    var q = /^(\d+)([A-Z][a-z]?)$/.exec(x); if (!q || !COMP[q[2]] || COMP[q[2]].Z == null) throw new Error('termine sconosciuto: ' + s);
    return { k: k, A: +q[1], Z: COMP[q[2]].Z, s: apice(q[1]) + q[2] };
  }
  function reazione(str) {
    var lati = str.split('->'); if (lati.length !== 2) throw new Error('reazione senza freccia: ' + str);
    var L = lati[0].split(' + ').map(termine), R = lati[1].split(' + ').map(termine);
    function somma(v, c) { return v.reduce(function (a, x) { return a + x.k * x[c]; }, 0); }
    function testo(v) { return v.map(function (x) { return (x.k > 1 ? x.k + ' ' : '') + x.s; }).join(' + '); }
    return { A: [somma(L, 'A'), somma(R, 'A')], Z: [somma(L, 'Z'), somma(R, 'Z')], testo: testo(L) + ' → ' + testo(R) };
  }

  /* ── 1 · supernova a collasso del nucleo: durate di WHW02 (tab. 1) per 15 e 25 M☉, interpolate in log M ── */
  var WHW = { 15: [1.11e7, 1.97e6, 2.03e3, 0.732, 2.58, 5.01e-2], 25: [6.70e6, 8.39e5, 5.22e2, 0.891, 0.402, 2.01e-3] };
  function durateMassa(M) {
    var u = Math.log(M / 15) / Math.log(25 / 15);
    return WHW[15].map(function (a, i) { return Math.exp(Math.log(a) + (Math.log(WHW[25][i]) - Math.log(a)) * u); });
  }
  function residuo(M) { return M > 25 ? 'bh' : 'ns'; }
  function supernova(M) {
    M = M || 20; var d = durateMassa(M), bh = residuo(M) === 'bh';
    return {
      id: bh ? 'buconero' : 'supernova', massa: { min: 10, max: 40, val: M, passo: 1 },
      titolo: bh ? ['Stella massiccia → buco nero', 'Massive star → black hole'] : ['Supernova a collasso del nucleo', 'Core-collapse supernova'],
      sottotitolo: 'H → He → C → Ne → O → Si → Fe',
      spiegazione: [
        'Una stella di ' + M + ' M☉ brucia combustibili sempre più pesanti, ognuno più in fretta del precedente: l\'idrogeno per milioni di anni, il silicio per un giorno. Gli strati restano attorno al nucleo come una cipolla. Il ferro non rende energia a fonderlo (massima energia di legame per nucleone): quando il suo nucleo supera la massa di Chandrasekhar collassa in meno di un secondo. ' + (bh ? 'Sopra ~25 M☉ (soglia incerta, dipende da rotazione e metallicità) il residuo diventa un buco nero.' : 'Il rimbalzo e i neutrini lanciano l\'esplosione; resta una stella di neutroni.'),
        'A ' + M + ' M☉ star burns heavier and heavier fuels, each faster than the last: hydrogen for millions of years, silicon for a day. The layers stay around the core like an onion. Iron yields no energy when fused (maximum binding energy per nucleon): when its core exceeds the Chandrasekhar mass it collapses in under a second. ' + (bh ? 'Above ~25 M☉ (uncertain threshold, depends on rotation and metallicity) the remnant becomes a black hole.' : 'The bounce and the neutrinos launch the explosion; a neutron star remains.')],
      corpo: { tipo: 'stella', colore: '#ffb347', granuli: 1 },
      orologio: 'anni',
      strati: [{ el: 'H', r: 1, da: 0 }, { el: 'He', r: 0.5, da: 1 }, { el: 'C', r: 0.34, da: 2 }, { el: 'Ne', r: 0.26, da: 3 }, { el: 'O', r: 0.2, da: 4 }, { el: 'Si', r: 0.14, da: 5 }, { el: 'Fe', r: 0.085, da: 6 }],
      comp0: { H: 70, He: 28, Z: 2 },
      stadi: [
        { nome: ['Idrogeno → elio', 'Hydrogen → helium'], dur: d[0] * ANNO, anim: 2.2, reazioni: ['4 1H -> 4He + 2 e+ + 2 nue', '12C + 1H -> 13N + g'], nota: ['ciclo CNO (netto: 4 ¹H → ⁴He)', 'CNO cycle (net: 4 ¹H → ⁴He)'], T: 4e7, rho: 4, rNuc: 0.3, comp: { He: 98, Z: 2 }, nuovi: ['He'] },
        { nome: ['Elio → carbonio e ossigeno', 'Helium → carbon and oxygen'], dur: d[1] * ANNO, anim: 1.6, reazioni: ['3 4He -> 12C + g', '12C + 4He -> 16O + g'], nota: ['tre-alfa', 'triple-alpha'], T: 2e8, rho: 8e2, rNuc: 0.25, comp: { C: 22, O: 74, Ne: 2, Z: 2 }, nuovi: ['C', 'O'] },
        { nome: ['Carbonio → neon', 'Carbon → neon'], dur: d[2] * ANNO, anim: 1.1, reazioni: ['12C + 12C -> 20Ne + 4He', '12C + 12C -> 23Na + 1H'], T: 8e8, rho: 3e5, rNuc: 0.2, comp: { C: 1, O: 63, Ne: 26, Mg: 8, Z: 2 }, nuovi: ['Ne', 'Mg'] },
        { nome: ['Neon → ossigeno e magnesio', 'Neon → oxygen and magnesium'], dur: d[3] * ANNO, anim: 0.9, reazioni: ['20Ne + g -> 16O + 4He', '20Ne + 4He -> 24Mg + g'], nota: ['fotodisintegrazione', 'photodisintegration'], T: 1.6e9, rho: 4e6, rNuc: 0.16, comp: { O: 72, Mg: 15, Si: 10, Ne: 1, Z: 2 }, nuovi: ['O', 'Mg'] },
        { nome: ['Ossigeno → silicio', 'Oxygen → silicon'], dur: d[4] * ANNO, anim: 0.9, reazioni: ['16O + 16O -> 28Si + 4He', '16O + 16O -> 32S + g'], T: 2e9, rho: 6e6, rNuc: 0.12, comp: { O: 3, Si: 58, S: 30, Z: 9 }, nuovi: ['Si', 'S'] },
        { nome: ['Silicio → ferro', 'Silicon → iron'], dur: d[5] * ANNO, anim: 0.9, reazioni: ['28Si + 7 4He -> 56Ni', '56Ni + e- -> 56Co + nue', '56Co + e- -> 56Fe + nue'], nota: ['fusione del silicio: fotodisintegrazione e catture α (quasi-equilibrio)', 'silicon burning: photodisintegration and α captures (quasi-equilibrium)'], T: 3.3e9, rho: 4e7, rNuc: 0.08, comp: { Fe: 92, Si: 4, S: 2, Z: 2 }, nuovi: ['Fe', 'Ni'] }
      ],
      finale: {
        tipo: 'collasso', residuo: residuo(M), anim: 7,
        collasso: { dur: 0.3, reazioni: ['1H + e- -> n + nue', '56Fe + g -> 13 4He + 4 n'], T: 1e11, rho: 3e14 },
        espulsi: ['Ni', 'Co', 'Fe', 'Si', 'O', 'Sr'],
        reazioniEsp: ['28Si + 7 4He -> 56Ni', '56Ni + e- -> 56Co + nue', '56Fe + n -> 57Fe + g']
      },
      fonti: ['WHW02', 'Janka12', 'AME20', 'Chandra']
    };
  }

  /* ── 2 · il Sole: Sackmann, Boothroyd & Kraemer 1993 ── */
  var SOLE = {
    id: 'sole', titolo: ['Il Sole: dalla nascita alla nana bianca', 'The Sun: from birth to white dwarf'], sottotitolo: 'pp → gigante rossa → flash dell\'elio → AGB → nebulosa → nana bianca',
    spiegazione: ['Il Sole fonde idrogeno nel nucleo per circa 11 miliardi di anni (oggi ne ha 4,57: al centro l\'idrogeno è sceso a circa un terzo). Poi il nucleo di elio si contrae, l\'inviluppo si gonfia (gigante rossa, ~170 R☉) e l\'elio si accende di colpo (flash). Dopo il ramo orizzontale e quello asintotico gli strati esterni se ne vanno in una nebulosa planetaria: resta una nana bianca di carbonio e ossigeno di ~0,54 M☉.', 'The Sun fuses hydrogen in its core for about 11 billion years (it is 4.57 today: at the centre hydrogen has dropped to about a third). Then the helium core contracts, the envelope swells (red giant, ~170 R☉) and helium ignites suddenly (flash). After the horizontal and asymptotic branches the outer layers leave in a planetary nebula: a ~0.54 M☉ carbon–oxygen white dwarf remains.'],
    corpo: { tipo: 'stella', colore: '#ffcf70', granuli: 1 }, orologio: 'anni',
    strati: [{ el: 'H', r: 1, da: 0 }, { el: 'He', r: 0.3, da: 1 }, { el: 'CO', r: 0.14, da: 3 }],
    comp0: { H: 71, He: 27, Z: 2 },
    stadi: [
      { nome: ['Sequenza principale: fino a oggi', 'Main sequence: up to today'], dur: 4.57 * GYR, anim: 2, reazioni: ['1H + 1H -> 2H + e+ + nue', '2H + 1H -> 3He + g', '3He + 3He -> 4He + 2 1H'], nota: ['catena pp', 'pp chain'], T: 1.57e7, rho: 150, raggio: 1, comp: { H: 34, He: 64, Z: 2 }, nuovi: ['He'], rNuc: 0.25 },
      { nome: ['Sequenza principale: l\'idrogeno finisce', 'Main sequence: hydrogen runs out'], dur: 6.4 * GYR, anim: 1.6, reazioni: ['4 1H -> 4He + 2 e+ + 2 nue'], T: 2e7, rho: 300, raggio: 1.6, comp: { He: 98, Z: 2 }, nuovi: ['He'], rNuc: 0.2 },
      { nome: ['Gigante rossa fino al flash dell\'elio', 'Red giant up to the helium flash'], dur: 1.17 * GYR, anim: 1.8, reazioni: ['12C + 1H -> 13N + g', '3 4He -> 12C + g'], nota: ['guscio di H attorno al nucleo di He degenere; poi il flash', 'H shell around the degenerate He core; then the flash'], T: 1e8, rho: 1e6, raggio: 170, comp: { He: 97, C: 1, Z: 2 }, nuovi: ['C'], rNuc: 0.12 },
      { nome: ['Ramo orizzontale: elio nel nucleo', 'Horizontal branch: core helium'], dur: 0.11 * GYR, anim: 1.4, reazioni: ['3 4He -> 12C + g', '12C + 4He -> 16O + g'], T: 1.2e8, rho: 2e4, raggio: 10, comp: { C: 35, O: 63, Z: 2 }, nuovi: ['C', 'O'], rNuc: 0.12 },
      { nome: ['Ramo asintotico e impulsi termici', 'Asymptotic branch and thermal pulses'], dur: 0.02 * GYR, anim: 1.4, reazioni: ['56Fe + n -> 57Fe + g', '22Ne + 4He -> 25Mg + n'], nota: ['processo s nei gusci', 's-process in the shells'], T: 2e8, rho: 1e6, raggio: 180, comp: { C: 35, O: 63, Z: 2 }, nuovi: ['Ba', 'Sr'], rNuc: 0.1 }
    ],
    finale: { tipo: 'nebulosa', residuo: 'wd', anim: 6, massaWD: 0.54 },
    fonti: ['SBK93', 'SSM', 'Iben']
  };

  /* ── 3 · supernova Ia: decadimenti di ⁵⁶Ni → ⁵⁶Co → ⁵⁶Fe (equazioni di Bateman) ── */
  var IA = { tNi: 6.075 * GIORNO, tCo: 77.236 * GIORNO, MNi: 0.6, epsNi: 3.9e10, epsCo: 6.78e9, Mdot: 1e-7, M0: 1.0, Mign: 1.38 };
  function catena56(t, N0) {
    var l1 = Math.LN2 / IA.tNi, l2 = Math.LN2 / IA.tCo, ni = N0 * Math.exp(-l1 * t), co = N0 * l1 / (l2 - l1) * (Math.exp(-l1 * t) - Math.exp(-l2 * t));
    return { Ni: ni, Co: co, Fe: N0 - ni - co };
  }
  /** luminosita' dei decadimenti (erg/s), Nadyozhin 1994: L = M_Ni[(ε_Ni − ε_Co)e^{−t/τ_Ni} + ε_Co e^{−t/τ_Co}] */
  function luceIa(t) { var tn = IA.tNi / Math.LN2, tc = IA.tCo / Math.LN2, M = IA.MNi * 1.98847e33; return M * ((IA.epsNi - IA.epsCo) * Math.exp(-t / tn) + IA.epsCo * Math.exp(-t / tc)); }
  function compIa(t) { var c = catena56(t, 43); return { Ni: c.Ni, Co: c.Co, Fe: 12 + c.Fe, Si: 13, S: 7, O: 11, C: 4, Z: 10 }; }
  var tAccr = (IA.Mign - IA.M0) / IA.Mdot * ANNO;
  var SNIA = {
    id: 'ia', titolo: ['Supernova di tipo Ia', 'Type Ia supernova'], sottotitolo: 'nana bianca C/O → ~1,38 M☉ → ⁵⁶Ni → ⁵⁶Co → ⁵⁶Fe',
    spiegazione: ['Una nana bianca di carbonio e ossigeno ruba gas a una compagna. Vicino alla massa di Chandrasekhar il carbonio si accende al centro, «cuoce» per secoli e poi brucia in un secondo: la stella si disintegra senza residuo. Circa 0,6 M☉ di ⁵⁶Ni radioattivo alimentano la luce per mesi: ⁵⁶Ni → ⁵⁶Co (6,1 giorni) → ⁵⁶Fe (77 giorni). Gran parte del ferro della Galassia nasce così.', 'A carbon–oxygen white dwarf steals gas from a companion. Near the Chandrasekhar mass carbon ignites at the centre, «simmers» for centuries and then burns in a second: the star is disrupted with no remnant. About 0.6 M☉ of radioactive ⁵⁶Ni powers the light for months: ⁵⁶Ni → ⁵⁶Co (6.1 days) → ⁵⁶Fe (77 days). Much of the Galaxy\'s iron is made this way.'],
    corpo: { tipo: 'nana', colore: '#cfe6ff', compagna: true }, orologio: 'auto',
    strati: [{ el: 'CO', r: 1, da: 0 }, { el: 'Si', r: 0.75, da: 2 }, { el: 'Ni', r: 0.5, da: 2 }],
    comp0: { C: 45, O: 53, Z: 2 },
    stadi: [
      { nome: ['Accrescimento dalla compagna', 'Accretion from the companion'], dur: tAccr, anim: 2.4, reazioni: ['4 1H -> 4He + 2 e+ + 2 nue'], nota: ['Ṁ = 10⁻⁷ M☉/anno da 1,0 a 1,38 M☉', 'Ṁ = 10⁻⁷ M☉/yr from 1.0 to 1.38 M☉'], T: 3e8, rho: 2e9, comp: { C: 45, O: 53, Z: 2 }, nuovi: ['C', 'O'], rNuc: 0.3 },
      { nome: ['Il carbonio «cuoce» al centro', 'Carbon «simmers» at the centre'], dur: 1e3 * ANNO, anim: 1.4, reazioni: ['12C + 12C -> 20Ne + 4He', '12C + 12C -> 23Na + 1H'], T: 7e8, rho: 3e9, comp: { C: 43, O: 53, Ne: 2, Z: 2 }, nuovi: ['Ne'], rNuc: 0.3 },
      { nome: ['Deflagrazione e detonazione', 'Deflagration and detonation'], dur: 1.5, anim: 1.4, reazioni: ['28Si + 7 4He -> 56Ni', '12C + 12C -> 24Mg + g'], T: 6e9, rho: 2e9, comp: compIa(0), nuovi: ['Ni', 'Si', 'S'], rNuc: 0.3, esplode: true },
      { nome: ['Picco di luce (~18 giorni)', 'Light peak (~18 days)'], dur: 18 * GIORNO, anim: 1.6, reazioni: ['56Ni + e- -> 56Co + nue'], comp: compIa(18 * GIORNO), nuovi: ['Co'], rNuc: 0.3, dopo: true },
      { nome: ['Coda del cobalto', 'Cobalt tail'], dur: 347 * GIORNO, anim: 2.2, reazioni: ['56Co + e- -> 56Fe + nue', '56Co -> 56Fe + e+ + nue'], nota: ['81 % cattura elettronica, 19 % β⁺', '81 % electron capture, 19 % β⁺'], comp: compIa(365 * GIORNO), nuovi: ['Fe'], rNuc: 0.3, dopo: true }
    ],
    finale: { tipo: 'nessuno', anim: 1 },
    grafico: 'luceIa', fonti: ['Nady94', 'W7', 'PB08', 'NNDC']
  };

  /* ── 4 · kilonova (GW170817) ── */
  var KN = { Mblu: 0.025, Mrosso: 0.04, eps1: 1e10, alfa: 1.3 };
  function luceKN(t) { var td = Math.max(t / GIORNO, 0.05); return (KN.Mblu + KN.Mrosso) * 1.98847e33 * KN.eps1 * Math.pow(td, -KN.alfa); }
  var KILONOVA = {
    id: 'kilonova', titolo: ['Kilonova: due stelle di neutroni', 'Kilonova: two neutron stars'], sottotitolo: 'spiraleggiamento → fusione → processo r → lantanidi, platino, oro',
    spiegazione: ['Due stelle di neutroni (~1,4 M☉ ciascuna) spiraleggiano perdendo energia in onde gravitazionali (GW170817, agosto 2017). Nella fusione schizzano fuori ~0,06 M☉ di materia ricchissima di neutroni: in meno di un secondo i nuclei catturano neutroni più in fretta di quanto decadano (processo r) e nascono lantanidi, platino e oro. Il decadimento radioattivo fa brillare la kilonova per giorni: blu all\'inizio, poi rossa per i lantanidi opachi.', 'Two neutron stars (~1.4 M☉ each) spiral in, losing energy to gravitational waves (GW170817, August 2017). In the merger ~0.06 M☉ of extremely neutron-rich matter is flung out: in under a second nuclei capture neutrons faster than they decay (r-process), making lanthanides, platinum and gold. Radioactive decay makes the kilonova shine for days: blue at first, then red because of the opaque lanthanides.'],
    corpo: { tipo: 'binaria', colore: '#bfe0ff' }, orologio: 'auto',
    strati: [{ el: 'rL', r: 1, da: 1 }, { el: 'rP', r: 0.6, da: 1 }],
    comp0: { NS: 100 },
    stadi: [
      { nome: ['Ultimi 100 secondi di spirale', 'Last 100 seconds of inspiral'], dur: 100, anim: 3, reazioni: [], nota: ['onde gravitazionali da 24 Hz a ~1 kHz', 'gravitational waves from 24 Hz to ~1 kHz'], comp: { NS: 100 }, nuovi: [], rNuc: 0.3, spirale: true },
      { nome: ['Fusione e processo r', 'Merger and r-process'], dur: 1, anim: 2, reazioni: ['129Cd + n -> 130Cd + g', '130Cd -> 130In + e- + anue', '197Pt -> 197Au + e- + anue'], T: 1e10, rho: 1e11, comp: { rL: 38, rP: 62 }, nuovi: ['Sr', 'Ba', 'Eu', 'Pt', 'Au'], rNuc: 0.3, esplode: true },
      { nome: ['Kilonova blu (~1 giorno)', 'Blue kilonova (~1 day)'], dur: GIORNO, anim: 1.8, reazioni: ['130Cd -> 130In + e- + anue'], comp: { rL: 38, rP: 62 }, nuovi: [], rNuc: 0.3, dopo: true },
      { nome: ['Kilonova rossa (~1 settimana)', 'Red kilonova (~1 week)'], dur: 6 * GIORNO, anim: 2, reazioni: ['197Pt -> 197Au + e- + anue'], comp: { rL: 38, rP: 62 }, nuovi: ['Au', 'Pt'], rNuc: 0.3, dopo: true }
    ],
    finale: { tipo: 'nessuno', anim: 1 },
    grafico: 'luceKN', collega: 'sastrogw', fonti: ['GW170817', 'Kasen17', 'Metzger10']
  };

  /* ── 5 · nucleosintesi del Big Bang: modello semplice calcolato ── */
  var BBN = { Q: 1.293, kTf: 0.75, tauN: 878.4, tNuc: 200, Yoss: 0.245, DH: 2.527e-5, He3H: 1.1e-5, LiH: 1.6e-10, LiHteo: 4.7e-10 };
  function Xn(t) { var Xf = 1 / (1 + Math.exp(BBN.Q / BBN.kTf)); return Xf * Math.exp(-Math.max(0, t - 1) / BBN.tauN); }
  /** temperatura dopo l'annichilazione e±: t ≈ 1,32 s (kT/1 MeV)^−2 (Kolb & Turner) */
  function Tbbn(t) { return Math.sqrt(1.32 / Math.max(t, 0.01)) * 1.160452e10; }
  function Ymod() { return 2 * Xn(BBN.tNuc); }
  function compBBN(t) {
    if (t < BBN.tNuc) { var x = Xn(t) * 100; return { n: x, H: 100 - x }; }
    var Y = Ymod() * 100; return { H: 100 - Y, He: Y };
  }
  var BIGBANG = {
    id: 'bigbang', titolo: ['Nucleosintesi del Big Bang', 'Big Bang nucleosynthesis'], sottotitolo: 'n, p → D → ³He, ⁴He, ⁷Li nei primi 20 minuti',
    spiegazione: ['Dopo un secondo l\'universo è a dieci miliardi di gradi: neutroni e protoni smettono di trasformarsi l\'uno nell\'altro (rapporto n/p ≈ 1/6). Il deuterio si spezza finché la temperatura non scende sotto ~10⁹ K (~3 minuti): intanto i neutroni liberi decadono. Poi quasi tutti i neutroni finiscono nell\'elio-4: Y ≈ 2 n/(n + p) ≈ 0,24 in massa. Restano tracce di deuterio, ³He e ⁷Li.', 'After one second the universe is at ten billion degrees: neutrons and protons stop turning into each other (n/p ratio ≈ 1/6). Deuterium is broken up until the temperature drops below ~10⁹ K (~3 minutes): meanwhile free neutrons decay. Then almost all neutrons end up in helium-4: Y ≈ 2 n/(n + p) ≈ 0.24 by mass. Traces of deuterium, ³He and ⁷Li remain.'],
    corpo: { tipo: 'universo', colore: '#fff0d8' }, orologio: 'secondi',
    strati: [{ el: 'H', r: 1, da: 0 }],
    comp0: compBBN(1),
    stadi: [
      { nome: ['Congelamento n/p (1 s)', 'n/p freeze-out (1 s)'], dur: 1, anim: 1.4, reazioni: ['n + nue -> 1H + e-', '1H + e- -> n + nue'], T: Tbbn(1), comp: compBBN(1), nuovi: ['n', 'H'], rNuc: 0.5 },
      { nome: ['I neutroni liberi decadono', 'Free neutrons decay'], dur: 179, anim: 2.4, reazioni: ['n -> 1H + e- + anue', '1H + n -> 2H + g'], nota: ['τ_n = 878,4 s; il deuterio si spezza (collo di bottiglia)', 'τ_n = 878.4 s; deuterium is broken up (bottleneck)'], T: Tbbn(180), comp: compBBN(199), nuovi: ['D'], rNuc: 0.5 },
      { nome: ['Si forma l\'elio', 'Helium forms'], dur: 120, anim: 2, reazioni: ['2H + 2H -> 3He + n', '2H + 2H -> 3H + 1H', '3H + 2H -> 4He + n', '3He + 4He -> 7Be + g'], T: Tbbn(300), comp: compBBN(300), nuovi: ['He', 'Li'], rNuc: 0.5 },
      { nome: ['A 20 minuti si spegne tutto', 'At 20 minutes everything freezes'], dur: 900, anim: 2, reazioni: ['7Be + e- -> 7Li + nue'], T: Tbbn(1200), comp: compBBN(1200), nuovi: [], rNuc: 0.5 }
    ],
    finale: { tipo: 'nessuno', anim: 1 },
    grafico: 'bbn', fonti: ['PDG', 'Cooke18', 'KT90', 'Fields20']
  };

  /* ── 6 · la Terra che si differenzia ── */
  var TERRA_K = { Al27: 0.0159, rAl: 5.23e-5, tAl: 0.717e6, EAl: 3.12, Fe56: 0.321, rFe: 1.15e-8, tFe: 2.62e6, EFe: 3.04 };
  /** potenza radiogenica (W/kg) da ²⁶Al e ⁶⁰Fe, t in anni dalla formazione dei CAI */
  function caloreTerra(t) {
    var u = 1.66053906660e-27, s = 0;
    var nAl = TERRA_K.Al27 / (27 * u) * TERRA_K.rAl, lAl = Math.LN2 / (TERRA_K.tAl * ANNO); s += nAl * lAl * Math.exp(-lAl * t * ANNO) * TERRA_K.EAl * MEV;
    var nFe = TERRA_K.Fe56 / (56 * u) * 0.9175 * TERRA_K.rFe, lFe = Math.LN2 / (TERRA_K.tFe * ANNO); s += nFe * lFe * Math.exp(-lFe * t * ANNO) * TERRA_K.EFe * MEV;
    return s;
  }
  function meta(a, b) { var o = {}; Object.keys(a).concat(Object.keys(b)).forEach(function (k) { o[k] = ((a[k] || 0) + (b[k] || 0)) / 2; }); return o; }
  var TERRA = {
    id: 'terra', titolo: ['La Terra si separa in strati', 'Earth separates into layers'], sottotitolo: 'polvere → oceano di magma → nucleo di ferro → crosta',
    spiegazione: ['La Terra nasce da polvere e planetesimi già scaldati dal ²⁶Al radioattivo (emivita 0,72 milioni di anni). Gli urti e il decadimento la fondono: il ferro, più denso, «piove» verso il centro e forma il nucleo entro ~30 milioni di anni (orologio afnio–tungsteno). I silicati restano nel mantello; la crosta è una pellicola. Il nucleo interno solido cristallizza molto più tardi.', 'Earth forms from dust and planetesimals already warmed by radioactive ²⁶Al (half-life 0.72 million years). Impacts and decay melt it: denser iron «rains» to the centre and forms the core within ~30 million years (hafnium–tungsten clock). Silicates stay in the mantle; the crust is a thin skin. The solid inner core crystallises much later.'],
    corpo: { tipo: 'pianeta', colore: '#8a5a3a' }, orologio: 'anni',
    strati: [{ el: 'crosta', r: 1, da: 3 }, { el: 'mantello', r: 0.995, da: 1 }, { el: 'nucE', r: 0.546, da: 2 }, { el: 'nucI', r: 0.192, da: 3 }],
    comp0: { Fe: 32, O: 30, Si: 15, Mg: 14, S: 3, Ni: 2, Z: 4 },
    stadi: [
      { nome: ['Accrescimento, ²⁶Al caldo', 'Accretion, hot ²⁶Al'], dur: 3e6 * ANNO, anim: 2, reazioni: ['26Al -> 26Mg + e+ + nue', '60Fe -> 60Co + e- + anue'], comp: { Fe: 32, O: 30, Si: 15, Mg: 14, S: 3, Ni: 2, Z: 4 }, nuovi: ['Al', 'Fe'], rNuc: 0.6, Tsup: 1500 },
      { nome: ['Oceano di magma', 'Magma ocean'], dur: 27e6 * ANNO, anim: 2, reazioni: ['60Co -> 60Ni + e- + anue'], nota: ['il ferro fuso affonda nei silicati (composizione al centro: a metà strada, illustrativa)', 'molten iron sinks through the silicates (central composition: halfway, illustrative)'], comp: meta({ Fe: 32, O: 30, Si: 15, Mg: 14, S: 3, Ni: 2, Z: 4 }, { Fe: 85, Ni: 5, Si: 6, S: 2, Z: 2 }), nuovi: ['Fe', 'Ni'], rNuc: 0.55, Tsup: 2500 },
      { nome: ['Il nucleo è fatto (~30 milioni di anni)', 'The core is made (~30 million years)'], dur: 70e6 * ANNO, anim: 2, reazioni: [], nota: ['orologio ¹⁸²Hf → ¹⁸²W', '¹⁸²Hf → ¹⁸²W clock'], comp: { Fe: 85, Ni: 5, Si: 6, S: 2, Z: 2 }, nuovi: ['Fe'], rNuc: 0.546, Tsup: 1800 },
      { nome: ['Crosta e nucleo interno: oggi', 'Crust and inner core: today'], dur: 4467e6 * ANNO, anim: 2.4, reazioni: [], nota: ['nucleo interno: età incerta, 0,5–1,5 miliardi di anni', 'inner core: uncertain age, 0.5–1.5 billion years'], comp: { Fe: 85, Ni: 5, Si: 6, S: 2, Z: 2 }, nuovi: [], rNuc: 0.546, Tsup: 288 }
    ],
    finale: { tipo: 'nessuno', anim: 1 },
    grafico: 'calore', fonti: ['McD03', 'Jac08', 'TD12', 'Kleine02']
  };

  /* ── 7 · Giove ── */
  var GIOVE = {
    id: 'giove', titolo: ['Giove: idrogeno che diventa metallo', 'Jupiter: hydrogen turning metallic'], sottotitolo: 'H₂ molecolare → idrogeno metallico → nucleo diluito; pioggia di elio',
    spiegazione: ['Giove non fonde nulla: per accendere l\'idrogeno servirebbe ~80 volte la sua massa. Dentro, la pressione cresce fino a milioni di atmosfere e l\'idrogeno diventa un fluido metallico che conduce elettricità (da lì nasce il campo magnetico). Raffreddandosi, l\'elio smette di mescolarsi all\'idrogeno metallico e «piove» verso il basso: per questo l\'atmosfera misurata dalla sonda Galileo ha meno elio del Sole. Juno ha mostrato un nucleo «diluito», non un sasso compatto.', 'Jupiter fuses nothing: igniting hydrogen would need ~80 times its mass. Inside, pressure rises to millions of atmospheres and hydrogen becomes a metallic fluid that conducts electricity (the source of the magnetic field). As it cools, helium stops mixing with metallic hydrogen and «rains» downwards: this is why the atmosphere measured by the Galileo probe has less helium than the Sun. Juno revealed a «dilute» core, not a compact rock.'],
    corpo: { tipo: 'gigante', colore: '#d8b38a' }, orologio: 'anni',
    strati: [{ el: 'H2', r: 1, da: 1 }, { el: 'Hm', r: 0.83, da: 2 }, { el: 'Zc', r: 0.4, da: 0 }],
    comp0: { H: 71, He: 27, Z: 2 },
    stadi: [
      { nome: ['Il nucleo si forma (~1 milione di anni)', 'The core forms (~1 million years)'], dur: 1e6 * ANNO, anim: 2, reazioni: [], nota: ['~20 masse terrestri di roccia e ghiaccio', '~20 Earth masses of rock and ice'], comp: { H: 71, He: 27, Z: 2 }, nuovi: [], rNuc: 0.4 },
      { nome: ['Cattura del gas', 'Gas capture'], dur: 2e6 * ANNO, anim: 2, reazioni: [], nota: ['fuga di gas dal disco fino a 318 masse terrestri', 'runaway gas accretion up to 318 Earth masses'], comp: { H: 71, He: 27, Z: 2 }, nuovi: ['H', 'He'], rNuc: 0.4 },
      { nome: ['Contrazione e idrogeno metallico', 'Contraction and metallic hydrogen'], dur: 1e9 * ANNO, anim: 2, reazioni: [], nota: ['transizione a ~1–2 milioni di bar', 'transition at ~1–2 million bar'], comp: { H: 72, He: 26, Z: 2 }, nuovi: [], rNuc: 0.4 },
      { nome: ['Pioggia di elio: oggi', 'Helium rain: today'], dur: 3.56e9 * ANNO, anim: 2.4, reazioni: [], nota: ['atmosfera: Y = 0,234 (Galileo) contro 0,270 protosolare', 'atmosphere: Y = 0.234 (Galileo) versus 0.270 protosolar'], comp: { H: 74, He: 23, Z: 3 }, nuovi: ['He'], rNuc: 0.4 }
    ],
    finale: { tipo: 'nessuno', anim: 1 },
    fonti: ['vZ98', 'Wahl17', 'Kruijer17', 'Asp09']
  };

  /* ── 8 · arricchimento galattico: modello a scatola chiusa ── */
  var GAL = { p: 0.01, tau: 6.6, Y0: 0.245, dYdZ: 2 };
  function compGal(tGyr) { var ts = Math.max(0, tGyr - 0.2), Z = GAL.p * ts / GAL.tau, Y = GAL.Y0 + GAL.dYdZ * Z; return { H: (1 - Y - Z) * 100, He: Y * 100, Z: Z * 100 }; }
  var GALASSIA = {
    id: 'galassia', titolo: ['Il gas della Galassia si arricchisce', 'The Galaxy\'s gas gets enriched'], sottotitolo: 'generazioni di stelle: H + He → metalli',
    spiegazione: ['Il gas uscito dal Big Bang ha solo idrogeno, elio e un pizzico di litio. Ogni generazione di stelle trasforma una parte del gas in elementi pesanti e lo restituisce con venti e supernove: la metallicità Z cresce. Con il modello a «scatola chiusa» Z = p ln(1/μ) (p = resa, μ = frazione di gas) e una formazione stellare che consuma il gas, Z arriva a ~0,014 quando nasce il Sole (Z☉ = 0,0134). Il modello prevede troppe stelle povere di metalli (il «problema delle nane G»): servono anche afflussi di gas.', 'The gas left by the Big Bang has only hydrogen, helium and a pinch of lithium. Each generation of stars turns part of the gas into heavy elements and returns it through winds and supernovae: the metallicity Z grows. With the «closed box» model Z = p ln(1/μ) (p = yield, μ = gas fraction) and star formation that consumes the gas, Z reaches ~0.014 when the Sun forms (Z☉ = 0.0134). The model predicts too many metal-poor stars (the «G-dwarf problem»): gas inflows are needed too.'],
    corpo: { tipo: 'nube', colore: '#5a8fd6' }, orologio: 'anni', decimali: 1,
    strati: [{ el: 'gas', r: 1, da: 0 }],
    comp0: compGal(0),
    stadi: [
      { nome: ['Prime stelle (~200 milioni di anni)', 'First stars (~200 million years)'], dur: 0.2 * GYR, anim: 1.8, reazioni: ['4 1H -> 4He + 2 e+ + 2 nue'], comp: compGal(0.2), nuovi: ['H', 'He'], rNuc: 0.5, generazioni: 1 },
      { nome: ['Generazioni e supernove', 'Generations and supernovae'], dur: 4 * GYR, anim: 2.4, reazioni: ['3 4He -> 12C + g', '28Si + 7 4He -> 56Ni'], comp: compGal(4.2), nuovi: ['C', 'O', 'Fe'], rNuc: 0.5, generazioni: 3 },
      { nome: ['Nasce il Sole (9,2 miliardi di anni)', 'The Sun is born (9.2 billion years)'], dur: 5 * GYR, anim: 2.4, reazioni: ['12C + 4He -> 16O + g'], comp: compGal(9.2), nuovi: ['O', 'Si'], rNuc: 0.5, generazioni: 6 },
      { nome: ['Oggi (13,8 miliardi di anni)', 'Today (13.8 billion years)'], dur: 4.6 * GYR, anim: 2.2, reazioni: ['56Ni + e- -> 56Co + nue'], comp: compGal(13.8), nuovi: ['Fe', 'Au'], rNuc: 0.5, generazioni: 9 }
    ],
    finale: { tipo: 'nessuno', anim: 1 },
    fonti: ['Tinsley', 'Asp09', 'PDG']
  };

  var FONTI = {
    WHW02: 'Woosley S. E., Heger A., Weaver T. A. (2002), Rev. Mod. Phys. 74, 1015 — tab. 1: durate, T e ρ delle fasi di combustione (15 e 25 M☉)',
    Janka12: 'Janka H.-T. (2012), Annu. Rev. Nucl. Part. Sci. 62, 407 — collasso, rimbalzo, ~99 % dell\'energia in neutrini',
    AME20: 'Wang M. et al. (2021), Chinese Phys. C 45, 030003 — AME2020, energie di legame',
    Chandra: 'Chandrasekhar S. (1931), ApJ 74, 81 — M_Ch = 5,83 Y_e² M☉',
    SBK93: 'Sackmann I.-J., Boothroyd A. I., Kraemer K. E. (1993), ApJ 418, 457 — «Our Sun. III. Present and Future»',
    SSM: 'Bahcall J. N., Serenelli A. M., Basu S. (2005), ApJ 621, L85 — modello solare standard',
    Iben: 'Iben I. Jr. (1991), ApJS 76, 55 — evoluzione delle stelle di piccola massa',
    Nady94: 'Nadyozhin D. K. (1994), ApJS 92, 527 — energia dei decadimenti ⁵⁶Ni → ⁵⁶Co → ⁵⁶Fe',
    W7: 'Iwamoto K. et al. (1999), ApJS 125, 439 — modello W7, composizione dei prodotti (indicativa)',
    PB08: 'Piro A. L., Bildsten L. (2008), ApJ 673, 1009 — la fase di «simmering»',
    NNDC: 'NNDC/ENSDF — emivite: ⁵⁶Ni 6,075 d, ⁵⁶Co 77,236 d',
    GW170817: 'Abbott B. P. et al. (2017), PRL 119, 161101 — GW170817',
    Kasen17: 'Kasen D. et al. (2017), Nature 551, 80 — componenti blu (0,025 M☉) e rossa (0,04 M☉)',
    Metzger10: 'Metzger B. D. et al. (2010), MNRAS 406, 2650 — riscaldamento radioattivo ∝ t^−1,3',
    PDG: 'Particle Data Group (2024) — τ_n = 878,4 s; Y_p = 0,245 ± 0,003',
    Cooke18: 'Cooke R. J., Pettini M., Steidel C. C. (2018), ApJ 855, 102 — D/H = 2,527·10⁻⁵',
    KT90: 'Kolb E. W., Turner M. S. (1990), The Early Universe — t ≈ 1,32 s (kT/MeV)⁻²',
    Fields20: 'Fields B. D. et al. (2020), JCAP 03, 010 — il problema del litio (⁷Li/H previsto ~4,7·10⁻¹⁰, osservato ~1,6·10⁻¹⁰)',
    McD03: 'McDonough W. F. (2003), Treatise on Geochemistry 2, 547 — composizione della Terra e del nucleo',
    Jac08: 'Jacobsen B. et al. (2008), EPSL 272, 353 — (²⁶Al/²⁷Al)₀ = 5,23·10⁻⁵',
    TD12: 'Tang H., Dauphas N. (2012), EPSL 359, 248 — (⁶⁰Fe/⁵⁶Fe)₀ ≈ 1,15·10⁻⁸',
    Kleine02: 'Kleine T. et al. (2002), Nature 418, 952 — nucleo formato in ~30 milioni di anni (Hf–W)',
    vZ98: 'von Zahn U., Hunten D. M., Lehmacher G. (1998), JGR 103, 22815 — elio nell\'atmosfera di Giove, Y = 0,234',
    Wahl17: 'Wahl S. M. et al. (2017), GRL 44, 4649 — nucleo diluito di Giove (Juno)',
    Kruijer17: 'Kruijer T. S. et al. (2017), PNAS 114, 6712 — il nucleo di Giove in ~1 milione di anni',
    Asp09: 'Asplund M. et al. (2009), ARA&A 47, 481 — composizione solare e protosolare (Z☉ = 0,0134)',
    Tinsley: 'Tinsley B. M. (1980), Fund. Cosmic Phys. 5, 287 — evoluzione chimica, scatola chiusa'
  };

  /* energia di legame per nucleone misurata (MeV, AME2020) */
  var LEGAME = [[2, 1.112, '²H'], [4, 7.074, '⁴He'], [7, 5.606, '⁷Li'], [12, 7.680, '¹²C'], [16, 7.976, '¹⁶O'], [20, 8.032, '²⁰Ne'], [24, 8.261, '²⁴Mg'], [28, 8.448, '²⁸Si'], [32, 8.493, '³²S'], [40, 8.551, '⁴⁰Ca'], [56, 8.790, '⁵⁶Fe'], [62, 8.795, '⁶²Ni'], [90, 8.710, '⁹⁰Zr'], [120, 8.505, '¹²⁰Sn'], [197, 7.916, '¹⁹⁷Au'], [208, 7.868, '²⁰⁸Pb'], [238, 7.570, '²³⁸U']];

  function scenari() { return [supernova(20), SOLE, supernova(40), SNIA, KILONOVA, BIGBANG, TERRA, GIOVE, GALASSIA]; }
  /** percentuali intere che sommano esattamente 100 (metodo del resto maggiore) */
  function arrotonda(comp, dec) {
    var k = Math.pow(10, dec || 0), chiavi = Object.keys(comp), tot = chiavi.reduce(function (a, c) { return a + comp[c]; }, 0) || 1, base = {}, resti = [], somma = 0;
    chiavi.forEach(function (c) { var v = comp[c] / tot * 100 * k; base[c] = Math.floor(v); somma += base[c]; resti.push([c, v - base[c]]); });
    resti.sort(function (a, b) { return b[1] - a[1]; }); for (var i = 0; i < 100 * k - somma; i++) base[resti[i % resti.length][0]]++;
    chiavi.forEach(function (c) { base[c] /= k; }); return base;
  }

  g.BSISpaccatoDati = {
    COMP: COMP, FONTI: FONTI, LEGAME: LEGAME, WHW: WHW, IA: IA, KN: KN, BBN: BBN, TERRA_K: TERRA_K, GAL: GAL, ANNO: ANNO, GIORNO: GIORNO,
    reazione: reazione, durateMassa: durateMassa, residuo: residuo, supernova: supernova, catena56: catena56, luceIa: luceIa, compIa: compIa, luceKN: luceKN,
    Xn: Xn, Tbbn: Tbbn, Ymod: Ymod, compBBN: compBBN, caloreTerra: caloreTerra, compGal: compGal, scenari: scenari, arrotonda: arrotonda,
    perId: function (id, M) { if (id === 'supernova') return supernova(M || 20); if (id === 'buconero') return supernova(M || 40); return scenari().filter(function (s) { return s.id === id; })[0] || null; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
