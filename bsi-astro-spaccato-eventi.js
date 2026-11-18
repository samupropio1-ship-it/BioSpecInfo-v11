/* ═══════════════════════════════════════════════════════════════════════
   bsi-astro-spaccato-eventi.js — altri quattordici eventi cosmici (v261)
   BioSpecInfo · © Samuele Pio Provenzano

   Si aggiungono ai nove di bsi-astro-spaccato-scenari.js, con lo stesso
   formato (stadi, composizioni che sommano 100, reazioni bilanciate, fonti).
   Ogni stadio può accendere degli «effetti» del motore (disco di
   accrescimento, getti, fasci di una pulsar, linee di campo, flusso di
   marea, coppia di buchi neri, pulsazione, cristallizzazione, nebbia):
   st.fx = { disco: 1, getti: 0.6, … } con l'intensità da 0 a 1.

   ONESTA': i numeri calcolati (tempo di caduta libera, Kelvin–Helmholtz,
   legge di Leavitt, campo e età delle pulsar, raggio di marea, Eddington e
   Salpeter, chirp di GW150914, Saha) sono calcolati qui; le composizioni a
   fine stadio che non vengono da un calcolo sono INDICATIVE e lo si dice.
   ═══════════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  var Dd = g.BSISpaccatoDati; if (!Dd) return;
  var C = Dd.COMP, ANNO = Dd.ANNO, GIORNO = Dd.GIORNO, MYR = 1e6 * ANNO, GYR = 1e9 * ANNO;
  var G = 6.674e-8, c = 2.998e10, MSUN = 1.989e33, RSUN = 6.957e10, LSUN = 3.828e33, MP = 1.6726e-24, SIGMA_T = 6.652e-25, KB = 1.380649e-16;

  /* ── componenti nuovi ── */
  [['Cu', 'Rame', 'Copper', '#e8946a', 29], ['Sn', 'Stagno', 'Tin', '#c0c8d0', 50], ['Sb', 'Antimonio', 'Antimony', '#a8b0c8', 51], ['Te', 'Tellurio', 'Tellurium', '#d0a8c8', 52], ['F', 'Fluoro', 'Fluorine', '#c8f08a', 9]].forEach(function (e) { C[e[0]] = { n: [e[1], e[2]], c: e[3], Z: e[4] }; });
  var NUOVI = {
    HI: [['Idrogeno neutro (H I)', 'Neutral hydrogen (H I)'], '#6b9cff'], Hp: [['Idrogeno ionizzato (H⁺)', 'Ionised hydrogen (H⁺)'], '#ff7a9a'],
    COg: [['Carbonio in CO', 'Carbon in CO'], '#ffb06b'], CH4: [['Carbonio in CH₄', 'Carbon in CH₄'], '#6bd8c0'],
    He2: [['Elio due volte ionizzato (He²⁺)', 'Doubly ionised helium (He²⁺)'], '#ff9ad8'], He1: [['Elio una volta ionizzato (He⁺)', 'Singly ionised helium (He⁺)'], '#b9a2ff'],
    rp: [['Prodotti del processo rp (A 64–104)', 'rp-process products (A 64–104)'], '#e0c06b'],
    pr: [['Protoni', 'Protons'], '#ff8a8a'],
    crE: [['Crosta esterna (nuclei ricchi di neutroni)', 'Outer crust (neutron-rich nuclei)'], '#c8a070'], crI: [['Crosta interna (nuclei + neutroni liberi)', 'Inner crust (nuclei + free neutrons)'], '#9a8ad8'],
    nucN: [['Nucleo: n, p, e, μ superfluidi', 'Core: superfluid n, p, e, μ'], '#5a8fd6'], nucX: [['Nucleo interno (ignoto)', 'Inner core (unknown)'], '#2a3a6a'],
    leg: [['Detriti legati al buco nero', 'Debris bound to the black hole'], '#ffb547'], sleg: [['Detriti che sfuggono', 'Debris that escapes'], '#6bcfff'],
    BH1: [['Buco nero 1 (36 M☉)', 'Black hole 1 (36 M☉)'], '#8a9ab8'], BH2: [['Buco nero 2 (29 M☉)', 'Black hole 2 (29 M☉)'], '#5a6a88'], BHf: [['Buco nero finale', 'Final black hole'], '#3a4a68'], GW: [['Energia in onde gravitazionali', 'Energy in gravitational waves'], '#6bcfff'],
    seme: [['Seme iniziale', 'Initial seed'], '#ffd24a'], acc: [['Massa accresciuta', 'Accreted mass'], '#5a4a8a'],
    liq: [['Nucleo liquido', 'Liquid core'], '#ffab8a'], sol: [['Nucleo cristallizzato', 'Crystallised core'], '#cfe6ff'],
    WR: [['Inviluppo di elio (Wolf–Rayet)', 'Helium envelope (Wolf–Rayet)'], '#b9a2ff']
  };
  Object.keys(NUOVI).forEach(function (k) { C[k] = { n: NUOVI[k][0], c: NUOVI[k][1] }; });

  /* ── calcoli ── */
  /** tempo di caduta libera (anni) per una nube di densità numerica n di H₂ (cm⁻³), μ = 2,8 */
  function tff(n) { var rho = n * 2.8 * 1.6605e-24; return Math.sqrt(3 * Math.PI / (32 * G * rho)) / ANNO; }
  /** tempo di Kelvin–Helmholtz GM²/(RL) in anni (M, R, L in unità solari) */
  function tKH(M, R, L) { return G * Math.pow(M * MSUN, 2) / (R * RSUN * L * LSUN) / ANNO; }
  /** legge di Leavitt (Benedict et al. 2007): M_V = −2,43 (log P − 1) − 4,05 */
  function leavitt(Pd) { return -2.43 * (Math.log10(Pd) - 1) - 4.05; }
  function distanzaCefeide(Pd, Vmedia) { return Math.pow(10, (Vmedia - leavitt(Pd) + 5) / 5); }
  /** pulsar: campo al polo B = 3,2·10¹⁹ √(PṖ) G, età caratteristica P/2Ṗ, perdita di energia 4π²IṖ/P³ (I = 10⁴⁵ g cm²) */
  function pulsar(P, Pd) { return { B: 3.2e19 * Math.sqrt(P * Pd), eta: P / (2 * Pd) / ANNO, Edot: 4 * Math.PI * Math.PI * 1e45 * Pd / Math.pow(P, 3) }; }
  var PULSAR = [['Crab', 0.0337, 4.2e-13], ['Vela', 0.0893, 1.25e-13], ['PSR B1919+21', 1.3373, 1.35e-15], ['PSR J0437−4715', 0.005757, 5.73e-20], ['SGR 1806−20', 7.56, 7.5e-11], ['SGR 1935+2154', 3.245, 1.43e-11]];
  /** distruzione mareale: raggio di marea, raggio di Schwarzschild, tempo minimo di ricaduta (Rees 1988; Stone et al. 2013) */
  function marea(Mbh, Ms, Rs) { var Rt = Rs * RSUN * Math.cbrt(Mbh / Ms), RS = 2 * G * Mbh * MSUN / (c * c), tfb = 2 * Math.PI * Math.sqrt(Math.pow(Rt, 3) / (G * Mbh * MSUN)) * Math.pow(Mbh / Ms, 0.5) / Math.pow(2, 1.5); return { Rt: Rt, RS: RS, rapporto: Rt / RS, tfb: tfb }; }
  function ricaduta(t, tfb, Ms) { return t < tfb ? 0 : (Ms / 3) / tfb * Math.pow(t / tfb, -5 / 3); }   /* M☉/s: dM/dt = (M_stella / 3 t_min)(t/t_min)^(−5/3) */
  /** Eddington (erg/s) e tempo di e-folding a efficienza ε */
  function eddington(M) { return 4 * Math.PI * G * M * MSUN * MP * c / SIGMA_T; }
  function salpeter(eps) { return eps / (1 - eps) * SIGMA_T * c / (4 * Math.PI * G * MP) / ANNO; }
  /** chirp newtoniano: frequenza dell'onda (Hz) a τ secondi dalla fusione, massa di chirp Mc (M☉) */
  function chirp(tau, Mc) { var GM = G * Mc * MSUN / (c * c * c); return Math.pow(5 / 256 / Math.max(tau, 1e-4), 3 / 8) * Math.pow(GM, -5 / 8) / Math.PI; }
  /** Saha per l'idrogeno: frazione ionizzata x_e a temperatura T con η = 6,1·10⁻¹⁰ */
  function saha(T) { var nb = 0.25 * 6.1e-10 * 411 * Math.pow(T / 2.725, 3) * 0.76 * 4, me = 9.109e-28, h = 6.626e-27, S = Math.pow(2 * Math.PI * me * KB * T / (h * h), 1.5) * Math.exp(-13.6 * 1.602e-12 / (KB * T)) / nb; return (-S + Math.sqrt(S * S + 4 * S)) / 2; }
  function T50() { var a = 2000, b = 6000; for (var i = 0; i < 80; i++) { var m = (a + b) / 2; if (saha(m) > 0.5) b = m; else a = m; } return (a + b) / 2; }
  var MCH150914 = 28.3;   /* massa di chirp di GW150914 nel sistema della sorgente (Abbott et al. 2016) */
  var tS = salpeter(0.1), crescita = function (M0, t) { return M0 * Math.exp(t / (tS * ANNO)); };
  function compQuasar(M) { var s = 1e5 / M * 100; return { seme: s, acc: 100 - s }; }

  /* ── 1 · nascita di una stella ── */
  var PROTO = {
    id: 'protostella', cat: 'nascere', emoji: '🌫️', titolo: ['Nasce una stella', 'A star is born'], sottotitolo: 'nube molecolare → protostella → T Tauri → sequenza principale',
    spiegazione: ['Un nucleo denso di una nube molecolare (10⁴ molecole di H₂ per cm³, 10 K) crolla sotto il suo peso in un tempo di caduta libera di ~' + Math.round(tff(1e4) / 1e3) + ' mila anni. Il gas che cade forma un disco, e due getti portano via il momento angolare. A ~2000 K le molecole di H₂ si spezzano e il nucleo crolla una seconda volta (Larson 1969); il deuterio brucia a ~10⁶ K. La giovane stella (T Tauri) si contrae lentamente finché al centro non si accende l\'idrogeno: per una stella come il Sole servono ~' + Math.round(tKH(1, 1, 1) / 1e6) + ' milioni di anni (tempo di Kelvin–Helmholtz).', 'A dense core of a molecular cloud (10⁴ H₂ molecules per cm³, 10 K) collapses under its own weight in a free-fall time of ~' + Math.round(tff(1e4) / 1e3) + ' thousand years. The infalling gas forms a disc, and two jets carry away angular momentum. At ~2000 K the H₂ molecules break and the core collapses a second time (Larson 1969); deuterium burns at ~10⁶ K. The young star (T Tauri) contracts slowly until hydrogen ignites at the centre: a Sun-like star needs ~' + Math.round(tKH(1, 1, 1) / 1e6) + ' million years (Kelvin–Helmholtz time).'],
    corpo: { tipo: 'nube', colore: '#8a6ad8' }, orologio: 'anni',
    strati: [{ el: 'H2', r: 1, da: 0 }, { el: 'HI', r: 0.4, da: 1 }, { el: 'Hp', r: 0.18, da: 2 }],
    comp0: { H2: 71, He: 27, Z: 2 },
    stadi: [
      { nome: ['Il nucleo denso crolla', 'The dense core collapses'], dur: tff(1e4) * ANNO, anim: 2.2, reazioni: [], chimica: ['caduta libera: t_ff = √(3π/32Gρ) ≈ ' + Math.round(tff(1e4) / 1e3) + ' mila anni'], T: 10, rho: 1.3e-19, scala: 1.7, comp: { H2: 71, He: 27, Z: 2 }, nuovi: [], rNuc: 0.6, fx: { disco: 0.2 } },
      { nome: ['Secondo collasso: H₂ si spezza (classe 0)', 'Second collapse: H₂ breaks (class 0)'], dur: 1e5 * ANNO, anim: 1.8, reazioni: ['2H + 1H -> 3He + g'], chimica: ['H₂ → 2 H a ~2000 K'], T: 1e6, rho: 1, scala: 1.1, comp: { HI: 71, He: 27, Z: 2 }, nuovi: ['D', 'He'], rNuc: 0.4, fx: { disco: 0.8, getti: 1 }, modo: 'nube' },
      { nome: ['Protostella e getti (classe I)', 'Protostar and jets (class I)'], dur: 4e5 * ANNO, anim: 1.8, reazioni: ['2H + 1H -> 3He + g'], T: 3e6, rho: 10, scala: 0.6, comp: { Hp: 71, He: 27, Z: 2 }, nuovi: ['He'], rNuc: 0.3, fx: { disco: 1, getti: 0.8 }, modo: 'stella', colore: '#ff9a5a' },
      { nome: ['T Tauri: il disco si dissolve', 'T Tauri: the disc dissipates'], dur: 3e6 * ANNO, anim: 1.8, reazioni: ['7Li + 1H -> 2 4He'], nota: ['dischi: pochi milioni di anni (Haisch et al. 2001)', 'discs: a few million years (Haisch et al. 2001)'], T: 6e6, rho: 20, scala: 0.6, comp: { Hp: 71, He: 27, Z: 2 }, nuovi: ['Li'], rNuc: 0.25, fx: { disco: 0.35, getti: 0.2 }, modo: 'stella', colore: '#ffb36a' },
      { nome: ['L\'idrogeno si accende: sequenza principale', 'Hydrogen ignites: main sequence'], dur: (tKH(1, 1, 1) - 3.5) * MYR, anim: 2, reazioni: ['1H + 1H -> 2H + e+ + nue', '3He + 3He -> 4He + 2 1H'], T: 1.4e7, rho: 80, scala: 0.6, comp: { Hp: 71, He: 27, Z: 2 }, nuovi: ['He'], rNuc: 0.25, fx: {}, modo: 'stella', colore: '#ffd27a' }
    ],
    finale: { tipo: 'nessuno', anim: 1 }, grafico: 'protostella', fonti: ['Larson69', 'Evans09', 'Haisch01', 'Iben65']
  };

  /* ── 2 · nana bruna ── */
  var BRUNA = {
    id: 'nanabruna', cat: 'nascere', emoji: '🟤', titolo: ['Nana bruna: la stella mancata', 'Brown dwarf: the failed star'], sottotitolo: 'deuterio → raffreddamento → classi M, L, T, Y',
    spiegazione: ['Sotto ~0,075 masse solari (~78 masse di Giove) il centro non arriva mai ai milioni di gradi necessari per fondere l\'idrogeno: la contrazione si ferma prima, sostenuta dagli elettroni degeneri. Sopra ~13 masse di Giove brucia per un po\' il deuterio (sopra ~65 anche il litio, che per questo è un test). Poi si raffredda per sempre: da rossa (M) a L, a T, a Y. Nell\'atmosfera il carbonio passa dal monossido CO al metano CH₄ attorno ai 1300 K: è la firma delle nane T.', 'Below ~0.075 solar masses (~78 Jupiter masses) the centre never reaches the millions of degrees needed to fuse hydrogen: contraction stops earlier, held up by degenerate electrons. Above ~13 Jupiter masses it burns deuterium for a while (above ~65 lithium too, which is why lithium is a test). Then it cools forever: from red (M) to L, T, Y. In the atmosphere carbon moves from carbon monoxide CO to methane CH₄ around 1300 K: the signature of T dwarfs.'],
    corpo: { tipo: 'gigante', colore: '#c0505a' }, orologio: 'anni',
    strati: [{ el: 'H', r: 1, da: 0 }],
    comp0: { COg: 100 },
    stadi: [
      { nome: ['Brucia il deuterio (50 masse di Giove)', 'Deuterium burns (50 Jupiter masses)'], dur: 3e7 * ANNO, anim: 2, reazioni: ['2H + 1H -> 3He + g'], T: 2800, rho: 50, comp: { COg: 100 }, nuovi: ['D', 'He'], rNuc: 0.3, colore: '#ff6a4a', Teff: 2800 },
      { nome: ['Classe L: nubi di silicati', 'Class L: silicate clouds'], dur: 4e8 * ANNO, anim: 2, reazioni: [], chimica: ['nubi di silicati e ferro nell\'atmosfera'], T: 1800, comp: { COg: 92, CH4: 8 }, nuovi: [], rNuc: 0.3, colore: '#c04a3a', Teff: 1800 },
      { nome: ['Classe T: arriva il metano', 'Class T: methane arrives'], dur: 3e9 * ANNO, anim: 2, reazioni: [], chimica: ['CO + 3 H₂ → CH₄ + H₂O sotto ~1300 K'], T: 900, comp: { COg: 15, CH4: 85 }, nuovi: [], rNuc: 0.3, colore: '#8a3a5a', Teff: 900 },
      { nome: ['Classe Y: nubi d\'acqua', 'Class Y: water clouds'], dur: 1e10 * ANNO, anim: 2.2, reazioni: [], chimica: ['nubi di H₂O sotto ~400 K'], T: 400, comp: { COg: 3, CH4: 97 }, nuovi: [], rNuc: 0.3, colore: '#4a2a4a', Teff: 400 }
    ],
    finale: { tipo: 'nessuno', anim: 1 }, nota: ['Le temperature di ogni classe sono quelle osservate (Kirkpatrick 2005; Cushing et al. 2011); i tempi per 50 masse di Giove e le frazioni CO/CH₄ sono INDICATIVI (Burrows et al. 2001).', 'The temperatures of each class are the observed ones (Kirkpatrick 2005; Cushing et al. 2011); the times for 50 Jupiter masses and the CO/CH₄ fractions are INDICATIVE (Burrows et al. 2001).'],
    fonti: ['Burrows01', 'Kirk05', 'Cushing11']
  };

  /* ── 3 · nana rossa ── */
  var ROSSA = {
    id: 'nanarossa', cat: 'nascere', emoji: '🔴', titolo: ['Nana rossa: migliaia di miliardi di anni', 'Red dwarf: trillions of years'], sottotitolo: 'tutta convettiva → nana blu → nana bianca di elio',
    spiegazione: ['Una stella di 0,1 masse solari è tutta convettiva: rimescola l\'intero idrogeno, non solo quello del nucleo, e lo brucia piano. Secondo Laughlin, Bodenheimer e Adams (1997) resta sulla sequenza principale per ~6000 miliardi di anni, poi si scalda diventando una «nana blu» e finisce come nana bianca di elio. L\'universo ha 13,8 miliardi di anni: nessuna nana rossa è ancora morta. Intanto ha brillamenti violenti, che contano per i pianeti abitabili attorno a queste stelle.', 'A 0.1 solar-mass star is fully convective: it mixes all of its hydrogen, not just the core, and burns it slowly. According to Laughlin, Bodenheimer and Adams (1997) it stays on the main sequence for ~6 trillion years, then heats up into a «blue dwarf» and ends as a helium white dwarf. The universe is 13.8 billion years old: no red dwarf has died yet. Meanwhile it has violent flares, which matter for habitable planets around these stars.'],
    corpo: { tipo: 'stella', colore: '#ff6a3a' }, orologio: 'anni',
    strati: [{ el: 'H', r: 1, da: 0 }, { el: 'He', r: 0.5, da: 2 }],
    comp0: { H: 70, He: 28, Z: 2 },
    stadi: [
      { nome: ['Sequenza principale: brillamenti', 'Main sequence: flares'], dur: 1.38e10 * ANNO, anim: 2.4, reazioni: ['1H + 1H -> 2H + e+ + nue', '3He + 3He -> 4He + 2 1H'], nota: ['oggi: l\'età dell\'universo è appena l\'inizio', 'today: the age of the universe is just the beginning'], T: 7e6, rho: 400, comp: { H: 69.6, He: 28.4, Z: 2 }, nuovi: ['He'], rNuc: 0.6, fx: { brillamenti: 1 }, colore: '#ff6a3a' },
      { nome: ['Bruciato tutto l\'idrogeno rimescolato', 'All mixed hydrogen burnt'], dur: 6e12 * ANNO, anim: 2.4, reazioni: ['4 1H -> 4He + 2 e+ + 2 nue'], T: 1e7, rho: 800, comp: { H: 8, He: 90, Z: 2 }, nuovi: ['He'], rNuc: 0.6, fx: { brillamenti: 0.4 }, colore: '#ff8a4a' },
      { nome: ['Nana blu', 'Blue dwarf'], dur: 1e11 * ANNO, anim: 1.8, reazioni: ['4 1H -> 4He + 2 e+ + 2 nue'], T: 1.5e7, rho: 1e4, comp: { H: 1, He: 97, Z: 2 }, nuovi: [], rNuc: 0.5, colore: '#9fc0ff' },
      { nome: ['Nana bianca di elio', 'Helium white dwarf'], dur: 1e11 * ANNO, anim: 1.8, reazioni: [], nota: ['si raffredda per sempre', 'it cools forever'], T: 5e6, rho: 1e5, scala: 0.5, comp: { He: 98, Z: 2 }, nuovi: [], rNuc: 0.5, modo: 'nana', colore: '#e0ecff' }
    ],
    finale: { tipo: 'nessuno', anim: 1 }, nota: ['Durate da Laughlin et al. 1997 (modello); composizioni INDICATIVE.', 'Durations from Laughlin et al. 1997 (model); compositions INDICATIVE.'], fonti: ['Laughlin97']
  };

  /* ── 4 · Cefeide (δ Cephei) ── */
  var PCEF = 5.366249;
  function cicloCef(fase) { return { He2: 30 + 20 * Math.sin(2 * Math.PI * fase), He1: 70 - 20 * Math.sin(2 * Math.PI * fase) }; }
  var CEFEIDE = {
    id: 'cefeide', cat: 'nascere', emoji: '💓', titolo: ['Una Cefeide pulsa', 'A Cepheid pulsates'], sottotitolo: 'meccanismo κ: l\'elio ionizzato fa da valvola',
    spiegazione: ['δ Cephei si gonfia e si sgonfia ogni ' + PCEF.toFixed(3).replace('.', ',') + ' giorni. Il motore è uno strato a ~40 000 K dove l\'elio passa da He⁺ a He²⁺: compresso, si ionizza, diventa più opaco e trattiene il calore; poi spinge, si espande, si ricombina, lascia passare la luce e ricade (meccanismo κ). Henrietta Leavitt (1912) scoprì che più il periodo è lungo, più la stella è luminosa: misurando il periodo si ricava la luminosità e quindi la distanza. Con la legge di Benedict et al. (2007) δ Cephei sta a ~' + Math.round(distanzaCefeide(PCEF, 3.95)) + ' parsec (Gaia: ~270).', 'δ Cephei swells and shrinks every ' + PCEF.toFixed(3) + ' days. The engine is a layer at ~40,000 K where helium goes from He⁺ to He²⁺: compressed, it ionises, becomes more opaque and traps heat; then it pushes, expands, recombines, lets light through and falls back (κ mechanism). Henrietta Leavitt (1912) found that the longer the period, the brighter the star: measuring the period gives the luminosity and hence the distance. With the Benedict et al. (2007) law δ Cephei is at ~' + Math.round(distanzaCefeide(PCEF, 3.95)) + ' parsecs (Gaia: ~270).'],
    corpo: { tipo: 'stella', colore: '#ffe08a' }, orologio: 'secondi',
    strati: [{ el: 'H', r: 1, da: 0 }, { el: 'He2', r: 0.93, da: 0 }, { el: 'H', r: 0.88, da: 0 }, { el: 'He', r: 0.25, da: 0 }, { el: 'CO', r: 0.12, da: 0 }],
    comp0: cicloCef(0),
    stadi: [0, 1, 2].map(function (k) { return { nome: [(k + 1) + 'ª pulsazione', 'Pulsation ' + (k + 1)], dur: PCEF * GIORNO, anim: 3, reazioni: ['4 1H -> 4He + 2 e+ + 2 nue', '3 4He -> 12C + g'], chimica: ['He⁺ + γ ⇄ He²⁺ + e⁻ (strato a ~40 000 K)'], T: 6000, comp: cicloCef(0), nuovi: k ? [] : ['He'], rNuc: 0.2, fx: { pulsa: 1 }, colore: '#ffe08a' }; }),
    finale: { tipo: 'nessuno', anim: 1 }, grafico: 'leavitt', nota: ['La frazione He²⁺/He⁺ nello strato che pulsa è un\'illustrazione del meccanismo κ, non una misura.', 'The He²⁺/He⁺ fraction in the pulsating layer illustrates the κ mechanism; it is not a measurement.'],
    fonti: ['Leavitt12', 'Benedict07']
  };

  /* ── 5 · nova classica ── */
  var NOVA = {
    id: 'nova', cat: 'morire', emoji: '🎆', titolo: ['Nova: la nana bianca che si riaccende', 'Nova: the white dwarf that flares again'], sottotitolo: 'accrescimento di idrogeno → esplosione termonucleare in superficie → ⁷Be, ⁷Li',
    spiegazione: ['Una nana bianca ruba idrogeno a una compagna. Quando lo strato in superficie arriva a ~10⁻⁵ masse solari, la pressione alla base accende il ciclo CNO caldo e la fusione scappa di mano in pochi minuti (fino a ~2·10⁸ K): lo strato salta via a migliaia di km/s, la stella diventa decine di migliaia di volte più luminosa. A differenza di una supernova Ia, la nana bianca sopravvive e dopo decine di migliaia di anni lo rifà. I decadimenti β⁺ di ¹³N, ¹⁵O e ¹⁷F scaldano lo strato; il ⁷Be prodotto diventa ⁷Li: le novae fabbricano litio (Tajitsu et al. 2015).', 'A white dwarf steals hydrogen from a companion. When the surface layer reaches ~10⁻⁵ solar masses, the pressure at its base ignites the hot CNO cycle and fusion runs away in a few minutes (up to ~2·10⁸ K): the layer is blown off at thousands of km/s, the star becomes tens of thousands of times brighter. Unlike a Type Ia supernova, the white dwarf survives and does it again after tens of thousands of years. β⁺ decays of ¹³N, ¹⁵O and ¹⁷F heat the layer; the ⁷Be produced becomes ⁷Li: novae make lithium (Tajitsu et al. 2015).'],
    corpo: { tipo: 'nana', colore: '#cfe6ff', compagna: true }, orologio: 'anni', residuoCorpo: true,
    strati: [{ el: 'H', r: 1, da: 0 }, { el: 'CO', r: 0.93, da: 0 }],
    comp0: { H: 70, He: 28, Z: 2 },
    stadi: [
      { nome: ['Accrescimento di idrogeno', 'Hydrogen accretion'], dur: 1e4 * ANNO, anim: 2.4, reazioni: ['1H + 1H -> 2H + e+ + nue'], nota: ['Ṁ ≈ 10⁻⁹ M☉/anno: 10⁻⁵ M☉ in ~10⁴ anni', 'Ṁ ≈ 10⁻⁹ M☉/yr: 10⁻⁵ M☉ in ~10⁴ yr'], T: 2e7, rho: 1e4, comp: { H: 70, He: 28, Z: 2 }, nuovi: ['H'], rNuc: 0.3, fx: { compagna: 1, disco: 0.6 } },
      { nome: ['Fusione fuori controllo (CNO caldo)', 'Runaway fusion (hot CNO)'], dur: 300, anim: 1.6, reazioni: ['12C + 1H -> 13N + g', '13N -> 13C + e+ + nue', '16O + 1H -> 17F + g', '17F -> 17O + e+ + nue'], T: 2e8, rho: 1e4, comp: { H: 48, He: 26, C: 8, N: 9, O: 9 }, nuovi: ['N', 'F', 'O'], rNuc: 0.3, fx: { compagna: 1, lampo: 1 } },
      { nome: ['Lo strato salta via', 'The layer is blown off'], dur: 60 * GIORNO, anim: 2, reazioni: ['3He + 4He -> 7Be + g', '7Be + e- -> 7Li + nue'], nota: ['~10⁻⁵–10⁻⁴ M☉ a ~1000–3000 km/s', '~10⁻⁵–10⁻⁴ M☉ at ~1000–3000 km/s'], comp: { H: 45, He: 25, C: 8, N: 10, O: 12 }, nuovi: ['Be', 'Li'], rNuc: 0.3, esplode: true, fx: { compagna: 1, lampo: 0.3 } },
      { nome: ['Torna tranquilla e ricomincia', 'Quiet again, and it starts over'], dur: 1e3 * ANNO, anim: 2, reazioni: ['1H + 1H -> 2H + e+ + nue'], comp: { H: 45, He: 25, C: 8, N: 10, O: 12 }, nuovi: [], rNuc: 0.3, dopo: true, fx: { compagna: 1, disco: 0.6 } }
    ],
    finale: { tipo: 'nessuno', anim: 1 }, nota: ['Composizione dei prodotti INDICATIVA (José e Hernanz 1998, novae CO).', 'Ejecta composition INDICATIVE (José and Hernanz 1998, CO novae).'], fonti: ['JH98', 'Tajitsu15']
  };

  /* ── 6 · lampo X su una stella di neutroni ── */
  var LAMPOX = {
    id: 'lampox', cat: 'compatti', emoji: '⚡', titolo: ['Lampo X su una stella di neutroni', 'X-ray burst on a neutron star'], sottotitolo: 'H e He accresciuti → accensione dell\'elio → processo rp fino a Sn, Sb, Te',
    spiegazione: ['Una stella di neutroni accresce idrogeno ed elio da una compagna. Ogni poche ore lo strato in superficie (~10⁸ g/cm² di colonna) si accende all\'improvviso: il fronte di fiamma fa il giro della stella in meno di un secondo e per 10–100 s la luce X arriva al limite di Eddington. L\'idrogeno brucia con catture rapide di protoni (processo rp) fino al ciclo stagno-antimonio-tellurio, dove la catena si chiude con un decadimento α (Schatz et al. 2001).', 'A neutron star accretes hydrogen and helium from a companion. Every few hours the surface layer (~10⁸ g/cm² of column) ignites suddenly: the flame front circles the star in under a second and for 10–100 s the X-ray light reaches the Eddington limit. Hydrogen burns through rapid proton captures (rp-process) up to the tin-antimony-tellurium cycle, where the chain closes with an α decay (Schatz et al. 2001).'],
    corpo: { tipo: 'nana', colore: '#bcd8ff', compagna: true }, orologio: 'secondi', residuoCorpo: true,
    strati: [{ el: 'H', r: 1, da: 0 }, { el: 'crE', r: 0.97, da: 0 }, { el: 'nucN', r: 0.9, da: 0 }],
    comp0: { H: 70, He: 28, Z: 2 },
    stadi: [
      { nome: ['Accrescimento (qualche ora)', 'Accretion (a few hours)'], dur: 3 * 3600, anim: 2.2, reazioni: ['12C + 1H -> 13N + g'], T: 2e8, rho: 1e6, comp: { H: 70, He: 28, Z: 2 }, nuovi: ['H', 'He'], rNuc: 0.3, scala: 0.6, fx: { compagna: 1, disco: 1 } },
      { nome: ['Accensione: il fronte fa il giro', 'Ignition: the front goes round'], dur: 1, anim: 1.6, reazioni: ['3 4He -> 12C + g', '15O + 4He -> 19Ne + g'], T: 1e9, rho: 1e6, comp: { H: 55, He: 15, C: 5, Ni: 10, Z: 15 }, nuovi: ['C', 'Ne'], rNuc: 0.3, scala: 0.6, fx: { compagna: 1, disco: 1, lampo: 1 } },
      { nome: ['Processo rp (10–100 s)', 'rp-process (10–100 s)'], dur: 30, anim: 2, reazioni: ['56Ni + 1H -> 57Cu + g', '104Sn + 1H -> 105Sb + g', '105Sb + 1H -> 106Te + g', '106Te -> 102Sn + 4He'], T: 1.5e9, rho: 1e6, comp: { H: 8, He: 4, Ni: 18, rp: 66, Z: 4 }, nuovi: ['Ni', 'Cu', 'Sn', 'Sb', 'Te'], rNuc: 0.3, scala: 0.6, fx: { compagna: 1, disco: 1, lampo: 0.6 } },
      { nome: ['Si raffredda, ricomincia l\'accrescimento', 'It cools, accretion restarts'], dur: 120, anim: 1.8, reazioni: [], comp: { H: 8, He: 4, Ni: 18, rp: 66, Z: 4 }, nuovi: [], rNuc: 0.3, scala: 0.6, fx: { compagna: 1, disco: 1 } }
    ],
    finale: { tipo: 'nessuno', anim: 1 }, nota: ['Composizione delle ceneri INDICATIVA (Schatz et al. 2001).', 'Ash composition INDICATIVE (Schatz et al. 2001).'], fonti: ['Schatz01', 'Bildsten98']
  };

  /* ── 7 · pulsar e magnetar ── */
  var PCrab = pulsar(0.0337, 4.2e-13);
  var PULSARS = {
    id: 'pulsar', cat: 'compatti', emoji: '🌀', titolo: ['Pulsar e magnetar: dentro una stella di neutroni', 'Pulsars and magnetars: inside a neutron star'], sottotitolo: 'crosta di nuclei → neutroni liberi → nucleo superfluido; fasci che ruotano',
    spiegazione: ['Una stella di neutroni pesa ~1,4 masse solari in ~12 km. Tagliata, mostra una crosta esterna di nuclei sempre più ricchi di neutroni, una crosta interna dove i neutroni «gocciolano» fuori dai nuclei, e un nucleo di neutroni superfluidi con pochi protoni ed elettroni; al centro la materia è ancora sconosciuta. Il campo magnetico, inclinato rispetto all\'asse di rotazione, accende due fasci: se ci passano davanti vediamo impulsi (Hewish et al. 1968). La pulsar del Granchio gira ' + Math.round(1 / 0.0337) + ' volte al secondo; dal rallentamento si ricavano un campo di ~' + (PCrab.B / 1e12).toFixed(1).replace('.', ',') + '·10¹² G e un\'età di ~' + Math.round(PCrab.eta / 10) * 10 + ' anni (la supernova fu vista nel 1054). Le magnetar hanno campi di 10¹⁴–10¹⁵ G e brillamenti giganti; nel 2020 SGR 1935+2154 ha emesso un lampo radio veloce.', 'A neutron star weighs ~1.4 solar masses in ~12 km. Cut open, it shows an outer crust of ever more neutron-rich nuclei, an inner crust where neutrons «drip» out of the nuclei, and a core of superfluid neutrons with a few protons and electrons; at the centre matter is still unknown. The magnetic field, tilted with respect to the spin axis, powers two beams: if they sweep past us we see pulses (Hewish et al. 1968). The Crab pulsar spins ' + Math.round(1 / 0.0337) + ' times a second; from its slowdown come a field of ~' + (PCrab.B / 1e12).toFixed(1) + '·10¹² G and an age of ~' + Math.round(PCrab.eta / 10) * 10 + ' years (the supernova was seen in 1054). Magnetars have 10¹⁴–10¹⁵ G fields and giant flares; in 2020 SGR 1935+2154 emitted a fast radio burst.'],
    corpo: { tipo: 'nana', colore: '#a8c8ff' }, orologio: 'anni', residuoCorpo: true,
    strati: [{ el: 'crE', r: 1, da: 0 }, { el: 'crI', r: 0.96, da: 0 }, { el: 'nucN', r: 0.88, da: 0 }, { el: 'nucX', r: 0.45, da: 0 }],
    comp0: { n: 92, pr: 8 },
    stadi: [
      { nome: ['Nasce caldissima (10¹¹ K)', 'Born extremely hot (10¹¹ K)'], dur: 10, anim: 1.8, reazioni: ['1H + e- -> n + nue'], T: 1e11, rho: 5e14, comp: { n: 92, pr: 8 }, nuovi: ['n'], rNuc: 0, scala: 0.7, fx: { fasci: 0.3, campo: 0.6 }, colore: '#e8f0ff' },
      { nome: ['Pulsar giovane: il Granchio (P = 33 ms)', 'Young pulsar: the Crab (P = 33 ms)'], dur: 970 * ANNO, anim: 2.4, reazioni: ['n -> 1H + e- + anue', '1H + e- -> n + nue'], nota: ['B = 3,2·10¹⁹ √(PṖ) G; età = P/2Ṗ', 'B = 3.2·10¹⁹ √(PṖ) G; age = P/2Ṗ'], T: 1e8, rho: 5e14, comp: { n: 92, pr: 8 }, nuovi: [], rNuc: 0, scala: 0.7, fx: { fasci: 1, campo: 1 }, spin: 1, colore: '#c8dcff' },
      { nome: ['Magnetar: brillamento gigante', 'Magnetar: giant flare'], dur: 1e4 * ANNO, anim: 2, reazioni: [], nota: ['SGR 1806−20 (2004): ~2·10⁴⁶ erg in 0,2 s', 'SGR 1806−20 (2004): ~2·10⁴⁶ erg in 0.2 s'], T: 5e6, rho: 5e14, comp: { n: 92, pr: 8 }, nuovi: [], rNuc: 0, scala: 0.7, fx: { fasci: 0.6, campo: 1, lampo: 0.7 }, spin: 0.3, colore: '#d8c8ff' },
      { nome: ['Vecchia pulsar che rallenta', 'Old pulsar slowing down'], dur: 1e7 * ANNO, anim: 2, reazioni: [], T: 1e5, rho: 5e14, comp: { n: 92, pr: 8 }, nuovi: [], rNuc: 0, scala: 0.7, fx: { fasci: 0.5, campo: 0.8 }, spin: 0.15, colore: '#8a9ab8' }
    ],
    finale: { tipo: 'nessuno', anim: 1 }, grafico: 'ppdot', nota: ['Spessori della crosta e frazione di protoni (~5–10 %) dai modelli (Lattimer e Prakash 2004); il centro è ignoto.', 'Crust thickness and proton fraction (~5–10 %) from models (Lattimer and Prakash 2004); the centre is unknown.'],
    fonti: ['Hewish68', 'LP04', 'KB17', 'CHIME20', 'ATNF']
  };

  /* ── 8 · distruzione mareale ── */
  var MT = marea(1e6, 1, 1);
  var TDE = {
    id: 'tde', cat: 'compatti', emoji: '🍝', titolo: ['Una stella fatta a pezzi da un buco nero', 'A star torn apart by a black hole'], sottotitolo: 'raggio di marea → filamento → metà ricade, metà sfugge → brillamento ∝ t^−5/3',
    spiegazione: ['Una stella come il Sole passa vicino a un buco nero di un milione di masse solari. Entro il raggio di marea, R_t = R*(M_BH/M*)^(1/3) ≈ ' + (MT.Rt / 1.496e13).toFixed(2).replace('.', ',') + ' UA (' + Math.round(MT.rapporto) + ' volte il raggio di Schwarzschild), la gravità del buco nero tira il lato vicino più del lontano e la stella si allunga in un filamento. Circa metà del gas resta legata e ricade, l\'altra metà sfugge (Rees 1988). La ricaduta comincia dopo ~' + Math.round(MT.tfb / GIORNO) + ' giorni e poi cala come t^(−5/3): è la curva di luce di eventi come ASASSN-14li e AT2019qiz. Sopra ~10⁸ masse solari la stella viene inghiottita intera, senza lampo.', 'A Sun-like star passes close to a million-solar-mass black hole. Within the tidal radius, R_t = R*(M_BH/M*)^(1/3) ≈ ' + (MT.Rt / 1.496e13).toFixed(2) + ' AU (' + Math.round(MT.rapporto) + ' times the Schwarzschild radius), the black hole pulls the near side more than the far side and the star stretches into a stream. About half of the gas stays bound and falls back, the other half escapes (Rees 1988). Fallback starts after ~' + Math.round(MT.tfb / GIORNO) + ' days and then drops as t^(−5/3): the light curve of events like ASASSN-14li and AT2019qiz. Above ~10⁸ solar masses the star is swallowed whole, with no flare.'],
    corpo: { tipo: 'stella', colore: '#ffd27a' }, orologio: 'auto', zero: 1, zeroEt: ['dalla distruzione', 'from disruption'],
    strati: [{ el: 'H', r: 1, da: 0 }, { el: 'He', r: 0.25, da: 0 }],
    comp0: { leg: 0, sleg: 0, H: 100 },
    stadi: [
      { nome: ['La stella si avvicina', 'The star approaches'], dur: 5 * GIORNO, anim: 2.2, reazioni: [], T: 1.5e7, comp: { H: 100 }, nuovi: [], rNuc: 0.25, scala: 0.45, fx: { buco: 1, marea: 0 } },
      { nome: ['Dentro il raggio di marea', 'Inside the tidal radius'], dur: 3 * 3600, anim: 1.8, reazioni: [], T: 1.5e7, comp: { leg: 50, sleg: 50 }, nuovi: [], rNuc: 0.25, scala: 0.45, fx: { buco: 1, marea: 1 }, nascondiCorpo: 0.5 },
      { nome: ['Ricaduta e disco', 'Fallback and disc'], dur: MT.tfb * 4, anim: 2.2, reazioni: [], comp: { leg: 50, sleg: 50 }, nuovi: [], rNuc: 0.25, fx: { buco: 1, marea: 1, disco: 1 }, nascondiCorpo: 1 },
      { nome: ['Declino ∝ t^−5/3', 'Decline ∝ t^−5/3'], dur: 3 * ANNO, anim: 2.2, reazioni: [], comp: { leg: 50, sleg: 50 }, nuovi: [], rNuc: 0.25, fx: { buco: 1, marea: 0.4, disco: 0.6 }, nascondiCorpo: 1 }
    ],
    finale: { tipo: 'nessuno', anim: 1 }, grafico: 'tde', fonti: ['Rees88', 'Gezari21']
  };

  /* ── 9 · lampo gamma lungo (collapsar) ── */
  var GRB = {
    id: 'grb', cat: 'morire', emoji: '☄️', titolo: ['Lampo gamma: una stella che crolla in un buco nero', 'Gamma-ray burst: a star collapsing into a black hole'], sottotitolo: 'Wolf–Rayet → buco nero e disco → getti a Γ ~ 300 → supernova Ic',
    spiegazione: ['Una stella di Wolf–Rayet ha perso l\'idrogeno ed è fatta di elio, carbonio e ossigeno. Se ruota in fretta, il nucleo che crolla forma un buco nero circondato da un disco: in pochi secondi due getti quasi alla velocità della luce (fattore di Lorentz ~100–1000) bucano la stella. Chi li vede di fronte riceve un lampo gamma lungo (> 2 s), seguito dal bagliore residuo e da una supernova Ic ad alta velocità (Woosley e Bloom 2006). GRB 221009A (2022) è il più luminoso mai registrato.', 'A Wolf–Rayet star has lost its hydrogen and is made of helium, carbon and oxygen. If it spins fast, the collapsing core forms a black hole surrounded by a disc: in a few seconds two jets at almost the speed of light (Lorentz factor ~100–1000) punch through the star. Whoever sees them head-on receives a long gamma-ray burst (> 2 s), followed by the afterglow and a high-velocity Type Ic supernova (Woosley and Bloom 2006). GRB 221009A (2022) is the brightest ever recorded.'],
    corpo: { tipo: 'stella', colore: '#cfe0ff' }, orologio: 'auto', zero: 1, zeroEt: ['dal collasso', 'from collapse'],
    strati: [{ el: 'WR', r: 1, da: 0 }, { el: 'C', r: 0.6, da: 0 }, { el: 'O', r: 0.42, da: 0 }, { el: 'Si', r: 0.2, da: 0 }, { el: 'Fe', r: 0.1, da: 0 }],
    comp0: { Fe: 90, Si: 6, Z: 4 },
    stadi: [
      { nome: ['Wolf–Rayet in rapida rotazione', 'Fast-spinning Wolf–Rayet'], dur: 3e5 * ANNO, anim: 2, reazioni: ['3 4He -> 12C + g', '12C + 4He -> 16O + g'], T: 3e9, rho: 1e8, comp: { Fe: 92, Si: 4, Z: 4 }, nuovi: ['He', 'C', 'O'], rNuc: 0.1, colore: '#cfe0ff' },
      { nome: ['Il nucleo diventa un buco nero', 'The core becomes a black hole'], dur: 1, anim: 1.6, reazioni: ['1H + e- -> n + nue'], T: 1e11, rho: 1e14, comp: { Fe: 92, Si: 4, Z: 4 }, nuovi: [], rNuc: 0.05, fx: { buco: 1, disco: 0.8 }, colore: '#cfe0ff' },
      { nome: ['I getti bucano la stella', 'The jets punch through the star'], dur: 20, anim: 2, reazioni: [], nota: ['Γ ~ 100–1000; lampo gamma > 2 s', 'Γ ~ 100–1000; gamma-ray burst > 2 s'], comp: { Ni: 30, O: 40, Si: 15, Fe: 10, Z: 5 }, nuovi: [], rNuc: 0.05, fx: { buco: 1, disco: 1, getti: 1 } },
      { nome: ['Supernova Ic ad alta velocità', 'High-velocity Type Ic supernova'], dur: 20 * GIORNO, anim: 2.4, reazioni: ['28Si + 7 4He -> 56Ni', '56Ni + e- -> 56Co + nue'], comp: { Ni: 30, O: 40, Si: 15, Fe: 10, Z: 5 }, nuovi: ['Ni', 'Co'], rNuc: 0.05, esplode: true, fx: { buco: 1, getti: 0.4 } }
    ],
    finale: { tipo: 'nessuno', anim: 1 }, nota: ['Composizioni INDICATIVE (supernove Ic-BL come SN 1998bw).', 'Compositions INDICATIVE (Ic-BL supernovae like SN 1998bw).'], fonti: ['WB06', 'GRB221009']
  };

  /* ── 10 · supernova a instabilità di coppia ── */
  var PISN = {
    id: 'pisn', cat: 'morire', emoji: '💣', titolo: ['Supernova a instabilità di coppia', 'Pair-instability supernova'], sottotitolo: 'γγ → e⁺e⁻ → contrazione → ossigeno esplosivo → nessun residuo',
    spiegazione: ['In un nucleo di elio di 65–130 masse solari (stelle iniziali di ~140–260 masse solari, possibili nelle prime generazioni) a ~10⁹ K i fotoni più energetici si trasformano in coppie elettrone-positrone. La pressione cala, il nucleo si contrae, l\'ossigeno si accende tutto insieme e la stella esplode senza lasciare nulla, producendo fino a decine di masse solari di ⁵⁶Ni (Heger e Woosley 2002). SN 2007bi è una candidata (Gal-Yam et al. 2009).', 'In a helium core of 65–130 solar masses (initial stars of ~140–260 solar masses, possible in the first generations) at ~10⁹ K the most energetic photons turn into electron–positron pairs. Pressure drops, the core contracts, all the oxygen ignites at once and the star explodes leaving nothing, producing up to tens of solar masses of ⁵⁶Ni (Heger and Woosley 2002). SN 2007bi is a candidate (Gal-Yam et al. 2009).'],
    corpo: { tipo: 'stella', colore: '#bcd0ff' }, orologio: 'anni',
    strati: [{ el: 'He', r: 1, da: 0 }, { el: 'O', r: 0.55, da: 0 }, { el: 'Si', r: 0.2, da: 2 }],
    comp0: { O: 75, C: 15, Ne: 8, Z: 2 },
    stadi: [
      { nome: ['Nucleo di elio di 110 M☉', '110 M☉ helium core'], dur: 3e5 * ANNO, anim: 2, reazioni: ['3 4He -> 12C + g', '12C + 4He -> 16O + g'], T: 3e8, rho: 1e3, raggio: 50, comp: { O: 75, C: 15, Ne: 8, Z: 2 }, nuovi: ['C', 'O'], rNuc: 0.4, colore: '#bcd0ff' },
      { nome: ['Coppie e⁺e⁻: il nucleo cede', 'e⁺e⁻ pairs: the core gives way'], dur: 3e3 * ANNO, anim: 2, reazioni: ['g + g -> e- + e+'], T: 1e9, rho: 1e5, raggio: 50, comp: { O: 78, C: 10, Ne: 10, Z: 2 }, nuovi: [], rNuc: 0.3 },
      { nome: ['L\'ossigeno esplode tutto insieme', 'All the oxygen explodes at once'], dur: 60, anim: 1.6, reazioni: ['16O + 16O -> 28Si + 4He', '28Si + 7 4He -> 56Ni'], T: 4e9, rho: 1e6, comp: { Ni: 30, Si: 25, O: 35, S: 8, Z: 2 }, nuovi: ['Si', 'Ni', 'S'], rNuc: 0.3, esplode: true },
      { nome: ['Nessun residuo; la luce del nichel', 'No remnant; nickel light'], dur: 300 * GIORNO, anim: 2.4, reazioni: ['56Ni + e- -> 56Co + nue', '56Co + e- -> 56Fe + nue'], comp: { Ni: 5, Co: 12, Fe: 13, Si: 25, O: 35, S: 8, Z: 2 }, nuovi: ['Co', 'Fe'], rNuc: 0.3, dopo: true }
    ],
    finale: { tipo: 'nessuno', anim: 1 }, nota: ['Prodotti INDICATIVI per un nucleo di elio di ~110 M☉ (Heger e Woosley 2002 danno da ~0 a ~57 M☉ di ⁵⁶Ni secondo la massa).', 'Products INDICATIVE for a ~110 M☉ helium core (Heger and Woosley 2002 give ~0 to ~57 M☉ of ⁵⁶Ni depending on mass).'],
    fonti: ['HW02', 'GalYam09']
  };

  /* ── 11 · due buchi neri si fondono (GW150914) ── */
  var BHBH = {
    id: 'bhbh', cat: 'compatti', emoji: '🕳️', titolo: ['Due buchi neri si fondono: GW150914', 'Two black holes merge: GW150914'], sottotitolo: '36 + 29 M☉ → 62 M☉ + 3 M☉c² in onde gravitazionali',
    spiegazione: ['Il 14 settembre 2015 LIGO ha registrato per la prima volta un\'onda gravitazionale: due buchi neri di 36 e 29 masse solari, a 410 megaparsec, spiraleggiavano a metà della velocità della luce. In 0,2 secondi la frequenza è salita da 35 a 250 Hz («chirp»), poi i due si sono fusi in un buco nero di 62 masse solari che ha vibrato e si è calmato (ringdown). Le 3 masse solari mancanti sono diventate energia, E = Δm c²: per un istante, 3,6·10⁴⁹ W, più di tutte le stelle dell\'universo visibile insieme (Abbott et al. 2016).', 'On 14 September 2015 LIGO recorded a gravitational wave for the first time: two black holes of 36 and 29 solar masses, 410 megaparsecs away, were spiralling at half the speed of light. In 0.2 seconds the frequency rose from 35 to 250 Hz («chirp»), then the two merged into a 62-solar-mass black hole that rang and settled (ringdown). The 3 missing solar masses became energy, E = Δm c²: for an instant, 3.6·10⁴⁹ W, more than all the stars in the visible universe together (Abbott et al. 2016).'],
    corpo: { tipo: 'binaria', colore: '#6a7a98', bh: true }, orologio: 'auto', zero: 1, zeroEt: ['dalla fusione', 'from merger'],
    strati: [{ el: 'GW', r: 1, da: 0 }],
    comp0: { BH1: 36 / 65 * 100, BH2: 29 / 65 * 100 },
    stadi: [
      { nome: ['Ultimo decimo di secondo di spirale', 'Last tenth of a second of inspiral'], dur: 0.2, anim: 3, reazioni: [], nota: ['f da 35 a 250 Hz; massa di chirp 28 M☉', 'f from 35 to 250 Hz; chirp mass 28 M☉'], comp: { BH1: 36 / 65 * 100, BH2: 29 / 65 * 100 }, nuovi: [], rNuc: 0.3, spirale: true, fx: {} },
      { nome: ['Fusione e ringdown', 'Merger and ringdown'], dur: 0.03, anim: 2.4, reazioni: [], nota: ['3 M☉c² ≈ 5,4·10⁴⁷ J in onde gravitazionali', '3 M☉c² ≈ 5.4·10⁴⁷ J in gravitational waves'], comp: { BHf: 62 / 65 * 100, GW: 3 / 65 * 100 }, nuovi: [], rNuc: 0.3, fx: { buco: 1 }, nascondiCorpo: 1 },
      { nome: ['Un buco nero di 62 M☉ che ruota (a = 0,67)', 'A 62 M☉ spinning black hole (a = 0.67)'], dur: 1, anim: 2, reazioni: [], comp: { BHf: 62 / 65 * 100, GW: 3 / 65 * 100 }, nuovi: [], rNuc: 0.3, fx: { buco: 1 }, nascondiCorpo: 1 }
    ],
    finale: { tipo: 'nessuno', anim: 1 }, grafico: 'chirp', collega: 'sastrogw', fonti: ['GW150914']
  };

  /* ── 12 · quasar ── */
  var tCresc = Math.log(8e8 / 1e5) * tS;
  var QUASAR = {
    id: 'quasar', cat: 'compatti', emoji: '💫', titolo: ['Un quasar: il buco nero che si accende', 'A quasar: the black hole switches on'], sottotitolo: 'seme → crescita al limite di Eddington → quasar a z ≈ 7,5 → oggi a riposo',
    spiegazione: ['Il gas che cade verso un buco nero supermassiccio forma un disco che brilla più di una galassia intera: un quasar. La luce stessa frena la caduta: oltre la luminosità di Eddington, L_E = 4πGMm_pc/σ_T ≈ 1,26·10³⁸ (M/M☉) erg/s, la pressione della radiazione respinge il gas. Con un\'efficienza del 10 %, la massa cresce di e volte ogni ~' + Math.round(tS / 1e6) + ' milioni di anni (Salpeter 1964): da un seme di 10⁵ masse solari a 8·10⁸ servono ~' + Math.round(tCresc / 1e6) + ' milioni di anni. Il quasar J1342+0928 aveva 8·10⁸ masse solari quando l\'universo aveva 690 milioni di anni (Bañados et al. 2018): un seme pesante, cresciuto quasi sempre al limite.', 'Gas falling onto a supermassive black hole forms a disc that outshines a whole galaxy: a quasar. Light itself brakes the infall: above the Eddington luminosity, L_E = 4πGMm_pc/σ_T ≈ 1.26·10³⁸ (M/M☉) erg/s, radiation pressure pushes the gas back. At 10 % efficiency the mass grows e-fold every ~' + Math.round(tS / 1e6) + ' million years (Salpeter 1964): from a 10⁵-solar-mass seed to 8·10⁸ takes ~' + Math.round(tCresc / 1e6) + ' million years. The quasar J1342+0928 had 8·10⁸ solar masses when the universe was 690 million years old (Bañados et al. 2018): a heavy seed, grown almost always at the limit.'],
    corpo: { tipo: 'binaria', colore: '#ffb547' }, orologio: 'anni',
    strati: [{ el: 'acc', r: 1, da: 0 }],
    comp0: compQuasar(1e5),
    stadi: [
      { nome: ['Seme di 10⁵ M☉', '10⁵ M☉ seed'], dur: 100 * MYR, anim: 2, reazioni: [], comp: compQuasar(1e5 * Math.exp(0.1)), nuovi: [], rNuc: 0.3, fx: { buco: 0.6, disco: 0.3 }, nascondiCorpo: 1 },
      { nome: ['Crescita al limite di Eddington', 'Growth at the Eddington limit'], dur: tCresc * ANNO * 0.8, anim: 2.4, reazioni: [], nota: ['M(t) = M₀ e^(t/t_S), t_S ≈ ' + Math.round(tS / 1e6) + ' milioni di anni', 'M(t) = M₀ e^(t/t_S), t_S ≈ ' + Math.round(tS / 1e6) + ' million yr'], comp: compQuasar(1e5 * Math.exp(0.8 * Math.log(8000))), nuovi: [], rNuc: 0.3, fx: { buco: 1, disco: 1, getti: 0.5 }, nascondiCorpo: 1 },
      { nome: ['Quasar acceso: 8·10⁸ M☉', 'Quasar on: 8·10⁸ M☉'], dur: tCresc * ANNO * 0.2, anim: 2.4, reazioni: [], nota: ['L ≈ ' + (eddington(8e8) / 1e46).toFixed(0) + '·10⁴⁶ erg/s', 'L ≈ ' + (eddington(8e8) / 1e46).toFixed(0) + '·10⁴⁶ erg/s'], comp: compQuasar(8e8), nuovi: [], rNuc: 0.3, fx: { buco: 1, disco: 1, getti: 1 }, nascondiCorpo: 1 },
      { nome: ['Oggi: a riposo', 'Today: dormant'], dur: 12 * GYR, anim: 2, reazioni: [], comp: compQuasar(1e9), nuovi: [], rNuc: 0.3, fx: { buco: 1, disco: 0.15 }, nascondiCorpo: 1 }
    ],
    finale: { tipo: 'nessuno', anim: 1 }, grafico: 'quasar', fonti: ['Salpeter64', 'Banados18']
  };

  /* ── 13 · nana bianca che si raffredda e cristallizza ── */
  var CRIST = {
    id: 'nanabianca', cat: 'compatti', emoji: '💎', titolo: ['Una nana bianca diventa cristallo', 'A white dwarf turns into crystal'], sottotitolo: 'si raffredda → il carbonio-ossigeno cristallizza → nana nera',
    spiegazione: ['Una nana bianca non brucia più nulla: è il calore rimasto che se ne va. Quando il nucleo di carbonio e ossigeno si raffredda abbastanza (Γ = Z²e²/(a k T) ≈ 175), gli ioni si mettono in un reticolo: la stella cristallizza dal centro verso fuori, liberando calore latente che rallenta il raffreddamento di miliardi di anni. Gaia ha visto l\'accumulo di nane bianche proprio dove la teoria prevede il congelamento (Tremblay et al. 2019). Dopo ~10¹⁵ anni non emetterà più luce visibile: una nana nera, che ancora non esiste.', 'A white dwarf no longer burns anything: it is leftover heat leaking out. When the carbon–oxygen core cools enough (Γ = Z²e²/(a k T) ≈ 175), the ions settle into a lattice: the star crystallises from the centre outwards, releasing latent heat that slows cooling by billions of years. Gaia saw the pile-up of white dwarfs exactly where theory predicts freezing (Tremblay et al. 2019). After ~10¹⁵ years it will no longer shine in visible light: a black dwarf, which does not exist yet.'],
    corpo: { tipo: 'nana', colore: '#dceaff' }, orologio: 'anni', residuoCorpo: true,
    strati: [{ el: 'H', r: 1, da: 0 }, { el: 'He', r: 0.99, da: 0 }, { el: 'CO', r: 0.97, da: 0 }],
    comp0: { liq: 100, sol: 0 },
    stadi: [
      { nome: ['Appena nata: 100 000 K', 'Newborn: 100,000 K'], dur: 1e6 * ANNO, anim: 2, reazioni: [], Teff: 1e5, comp: { liq: 100, sol: 0 }, nuovi: [], rNuc: 0, scala: 0.85, colore: '#cfe0ff', cristallo: 0 },
      { nome: ['Si raffredda: 10 000 K', 'Cooling: 10,000 K'], dur: 6e8 * ANNO, anim: 2, reazioni: [], Teff: 1e4, comp: { liq: 100, sol: 0 }, nuovi: [], rNuc: 0, scala: 0.85, colore: '#f0f4ff', cristallo: 0 },
      { nome: ['Comincia a cristallizzare (~6000 K)', 'Crystallisation begins (~6000 K)'], dur: 2e9 * ANNO, anim: 2.2, reazioni: [], nota: ['Γ ≈ 175: gli ioni C e O si ordinano', 'Γ ≈ 175: C and O ions order'], Teff: 6000, comp: { liq: 80, sol: 20 }, nuovi: [], rNuc: 0, scala: 0.85, colore: '#fff0d8', cristallo: 0.45 },
      { nome: ['Quasi tutta cristallo (~4000 K)', 'Almost all crystal (~4000 K)'], dur: 6e9 * ANNO, anim: 2.2, reazioni: [], Teff: 4000, comp: { liq: 20, sol: 80 }, nuovi: [], rNuc: 0, scala: 0.85, colore: '#ffcf9a', cristallo: 0.85 },
      { nome: ['Nana nera (~10¹⁵ anni)', 'Black dwarf (~10¹⁵ years)'], dur: 1e15 * ANNO, anim: 2, reazioni: [], Teff: 5, comp: { liq: 0, sol: 100 }, nuovi: [], rNuc: 0, scala: 0.85, colore: '#2a2a34', cristallo: 0.97 }
    ],
    finale: { tipo: 'nessuno', anim: 1 }, nota: ['Tempi per una nana bianca di 0,6 M☉ INDICATIVI dai modelli di raffreddamento (Fontaine et al. 2001); frazioni cristallizzate INDICATIVE.', 'Times for a 0.6 M☉ white dwarf INDICATIVE from cooling models (Fontaine et al. 2001); crystallised fractions INDICATIVE.'],
    fonti: ['Tremblay19', 'Fontaine01']
  };

  /* ── 14 · ricombinazione, età oscure, reionizzazione ── */
  var Hf = 75.5;
  function compRic(xe) { return { Hp: Hf * xe, HI: Hf * (1 - xe), He: 100 - Hf }; }
  var RICOMB = {
    id: 'ricombinazione', cat: 'universo', emoji: '🌅', titolo: ['L\'universo diventa trasparente, poi si riaccende', 'The universe becomes transparent, then lights up again'], sottotitolo: 'ricombinazione (380 000 anni) → età oscure → prime stelle → reionizzazione',
    spiegazione: ['Per 380 000 anni l\'universo è un plasma opaco: i fotoni rimbalzano sugli elettroni liberi. Quando la temperatura scende a ~3000 K (z ≈ 1090) protoni ed elettroni si legano in atomi di idrogeno: la luce viaggia libera, ed è la radiazione cosmica di fondo che vediamo oggi (Planck 2018). L\'equazione di Saha dà metà idrogeno neutro a ~' + Math.round(T50() / 10) * 10 + ' K. Seguono le «età oscure», senza stelle. Le prime stelle e galassie, dopo 100–200 milioni di anni, ionizzano di nuovo il gas attorno a sé in bolle che si allargano finché, verso z ≈ 6 (~1 miliardo di anni), l\'idrogeno fra le galassie è di nuovo tutto ionizzato (Fan et al. 2006).', 'For 380,000 years the universe is an opaque plasma: photons bounce off free electrons. When the temperature drops to ~3000 K (z ≈ 1090) protons and electrons bind into hydrogen atoms: light travels freely, and it is the cosmic microwave background we see today (Planck 2018). The Saha equation gives half neutral hydrogen at ~' + Math.round(T50() / 10) * 10 + ' K. Then come the «dark ages», with no stars. The first stars and galaxies, after 100–200 million years, ionise the gas around them again in growing bubbles until, around z ≈ 6 (~1 billion years), the hydrogen between galaxies is all ionised again (Fan et al. 2006).'],
    corpo: { tipo: 'universo', colore: '#ffb070' }, orologio: 'anni',
    strati: [{ el: 'Hp', r: 1, da: 0 }],
    comp0: compRic(1),
    stadi: [
      { nome: ['Plasma opaco', 'Opaque plasma'], dur: 2e5 * ANNO, anim: 1.8, reazioni: [], chimica: ['p + e⁻ ⇄ H + γ (equilibrio di Saha)'], T: 6000, comp: compRic(1), nuovi: [], rNuc: 0.8, fx: { nebbia: 1 } },
      { nome: ['Ricombinazione: z ≈ 1090', 'Recombination: z ≈ 1090'], dur: 1.8e5 * ANNO, anim: 2.2, reazioni: [], chimica: ['p + e⁻ → H + γ'], T: 2970, comp: compRic(0.1), nota: ['a z ≈ 1090 resta ionizzato ~10 %: la ricombinazione esce dall\'equilibrio (Peebles 1968), Saha scenderebbe molto più in fretta', 'at z ≈ 1090 ~10 % is still ionised: recombination falls out of equilibrium (Peebles 1968), Saha would drop much faster'], nuovi: ['H'], rNuc: 0.8, fx: { nebbia: 0.15 } },
      { nome: ['Età oscure', 'Dark ages'], dur: 1.5e8 * ANNO, anim: 1.8, reazioni: [], T: 60, comp: compRic(0.0002), nota: ['resta una frazione di ~2·10⁻⁴ di elettroni liberi (congelamento)', 'a ~2·10⁻⁴ fraction of free electrons remains (freeze-out)'], nuovi: [], rNuc: 0.8, fx: { nebbia: 0 } },
      { nome: ['Prime stelle: bolle ionizzate', 'First stars: ionised bubbles'], dur: 5.5e8 * ANNO, anim: 2.2, reazioni: ['4 1H -> 4He + 2 e+ + 2 nue'], nota: ['metà reionizzazione a z ≈ 7,7 (Planck 2018)', 'reionisation midpoint at z ≈ 7.7 (Planck 2018)'], T: 20, comp: compRic(0.5), nuovi: ['He'], rNuc: 0.8, fx: { bolle: 0.6 } },
      { nome: ['Reionizzazione completa: z ≈ 6', 'Reionisation complete: z ≈ 6'], dur: 3e8 * ANNO, anim: 2, reazioni: [], T: 15, comp: compRic(0.9999), nuovi: [], rNuc: 0.8, fx: { bolle: 1 } }
    ],
    finale: { tipo: 'nessuno', anim: 1 }, grafico: 'saha', fonti: ['Planck18', 'Peebles68', 'Fan06']
  };

  var AP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  function esp(x, it) { var e = Math.floor(Math.log10(x)), m = x / Math.pow(10, e), ms = m.toFixed(1); if (ms === '10.0') { ms = '1.0'; e++; } if (it) ms = ms.replace('.', ','); return ms + '·10' + String(e).split('').map(function (ch) { return ch === '-' ? '⁻' : AP[+ch]; }).join(''); }
  CEFEIDE.compT = function (t) { return cicloCef(t / (PCEF * GIORNO)); };
  CEFEIDE.hud = function (s) { var f = (s.tFis / (PCEF * GIORNO)) % 1, dR = 0.08 * Math.sin(2 * Math.PI * f); return ['R ≈ ' + (44.5 * (1 + dR)).toFixed(1).replace('.', ',') + ' R☉ (fase ' + f.toFixed(2).replace('.', ',') + ')<br>M_V = ' + leavitt(PCEF).toFixed(2).replace('.', ',') + ' (legge di Leavitt)<br>d ≈ ' + Math.round(distanzaCefeide(PCEF, 3.95)) + ' pc', 'R ≈ ' + (44.5 * (1 + dR)).toFixed(1) + ' R☉ (phase ' + f.toFixed(2) + ')<br>M_V = ' + leavitt(PCEF).toFixed(2) + ' (Leavitt law)<br>d ≈ ' + Math.round(distanzaCefeide(PCEF, 3.95)) + ' pc']; };
  PULSARS.hud = function (s) { if (s.i !== 1) return null; return ['P = 33,7 ms, Ṗ = 4,2·10⁻¹³<br>B ≈ ' + (PCrab.B / 1e12).toFixed(1).replace('.', ',') + '·10¹² G<br>età ≈ ' + Math.round(PCrab.eta) + ' anni<br>Ė ≈ ' + (PCrab.Edot / 1e38).toFixed(1).replace('.', ',') + '·10³⁸ erg/s', 'P = 33.7 ms, Ṗ = 4.2·10⁻¹³<br>B ≈ ' + (PCrab.B / 1e12).toFixed(1) + '·10¹² G<br>age ≈ ' + Math.round(PCrab.eta) + ' yr<br>Ė ≈ ' + (PCrab.Edot / 1e38).toFixed(1) + '·10³⁸ erg/s']; };
  BHBH.hud = function (s) { if (s.i !== 0) return null; var tau = Math.max(0.004, 0.2 * (1 - s.u)), f = chirp(tau, MCH150914); return ['f ≈ ' + Math.round(f) + ' Hz a ' + (tau * 1000).toFixed(0) + ' ms dalla fusione<br>v ≈ ' + Math.min(0.5, Math.cbrt(Math.PI * G * 65 * MSUN * f / (c * c * c))).toFixed(2).replace('.', ',') + ' c', 'f ≈ ' + Math.round(f) + ' Hz at ' + (tau * 1000).toFixed(0) + ' ms before merger<br>v ≈ ' + Math.min(0.5, Math.cbrt(Math.PI * G * 65 * MSUN * f / (c * c * c))).toFixed(2) + ' c']; };
  TDE.hud = function () { return ['M_BH = 10⁶ M☉<br>R_t ≈ ' + (MT.Rt / 1.496e13).toFixed(2).replace('.', ',') + ' UA = ' + Math.round(MT.rapporto) + ' R_S<br>t_min ≈ ' + Math.round(MT.tfb / GIORNO) + ' giorni', 'M_BH = 10⁶ M☉<br>R_t ≈ ' + (MT.Rt / 1.496e13).toFixed(2) + ' AU = ' + Math.round(MT.rapporto) + ' R_S<br>t_min ≈ ' + Math.round(MT.tfb / GIORNO) + ' days']; };
  QUASAR.hud = function (s) { var M = 1e5 * Math.exp((s.i === 0 ? s.u * 0.1 : s.i === 1 ? 0.1 + s.u * (0.8 * Math.log(8000) - 0.1) : s.i === 2 ? 0.8 * Math.log(8000) + s.u * 0.2 * Math.log(8000) : Math.log(8000) + s.u * 0.22)); return ['M ≈ ' + esp(M, 1) + ' M☉<br>L_Edd ≈ ' + esp(eddington(M), 1) + ' erg/s', 'M ≈ ' + esp(M) + ' M☉<br>L_Edd ≈ ' + esp(eddington(M)) + ' erg/s']; };
  PROTO.hud = function (s) { return s.i === 0 ? ['n(H₂) = 10⁴ cm⁻³, T = 10 K<br>t_ff ≈ ' + Math.round(tff(1e4) / 1e3) + ' mila anni', 'n(H₂) = 10⁴ cm⁻³, T = 10 K<br>t_ff ≈ ' + Math.round(tff(1e4) / 1e3) + ' thousand yr'] : s.i === 4 ? ['t_KH = GM²/RL ≈ ' + Math.round(tKH(1, 1, 1) / 1e6) + ' milioni di anni', 't_KH = GM²/RL ≈ ' + Math.round(tKH(1, 1, 1) / 1e6) + ' million yr'] : null; };
  RICOMB.hud = function (s) { var st = RICOMB.stadi[s.i]; return st.T ? ['T ≈ ' + st.T + ' K, z ≈ ' + Math.round(st.T / 2.725 - 1) + '<br>x_e(Saha) = ' + (saha(Math.max(st.T, 1000)) > 0.99 ? '1' : esp(saha(Math.max(st.T, 1000)), 1)), 'T ≈ ' + st.T + ' K, z ≈ ' + Math.round(st.T / 2.725 - 1) + '<br>x_e(Saha) = ' + (saha(Math.max(st.T, 1000)) > 0.99 ? '1' : esp(saha(Math.max(st.T, 1000))))] : null; };
  CRIST.hud = function (s) { var st = CRIST.stadi[s.i]; return ['T_eff ≈ ' + st.Teff.toLocaleString('it-IT') + ' K', 'T_eff ≈ ' + st.Teff.toLocaleString('en-US') + ' K']; };
  BRUNA.hud = function (s) { var st = BRUNA.stadi[s.i]; return ['T_eff ≈ ' + st.Teff.toLocaleString('it-IT') + ' K', 'T_eff ≈ ' + st.Teff.toLocaleString('en-US') + ' K']; };

  var NUOVE_FONTI = {
    Larson69: 'Larson R. B. (1969), MNRAS 145, 271 — il collasso di una protostella, primo e secondo nucleo',
    Evans09: 'Evans N. J. II et al. (2009), ApJS 181, 321 — durata delle classi 0 e I (~0,5 milioni di anni)',
    Haisch01: 'Haisch K. E., Lada E. A., Lada C. J. (2001), ApJ 553, L153 — i dischi durano pochi milioni di anni',
    Iben65: 'Iben I. Jr. (1965), ApJ 141, 993 — la contrazione verso la sequenza principale',
    Burrows01: 'Burrows A. et al. (2001), Rev. Mod. Phys. 73, 719 — nane brune: deuterio (> 13 M_J), litio (> 65 M_J), raffreddamento',
    Kirk05: 'Kirkpatrick J. D. (2005), ARA&A 43, 195 — le classi M, L e T',
    Cushing11: 'Cushing M. C. et al. (2011), ApJ 743, 50 — le nane Y',
    Laughlin97: 'Laughlin G., Bodenheimer P., Adams F. C. (1997), ApJ 482, 420 — la fine della sequenza principale per le stelle piccole',
    Leavitt12: 'Leavitt H. S., Pickering E. C. (1912), Harvard College Observatory Circular 173 — periodi delle variabili nella Piccola Nube di Magellano',
    Benedict07: 'Benedict G. F. et al. (2007), AJ 133, 1810 — parallassi di Cefeidi e legge periodo-luminosità',
    JH98: 'José J., Hernanz M. (1998), ApJ 494, 680 — la nucleosintesi delle novae',
    Tajitsu15: 'Tajitsu A. et al. (2015), Nature 518, 381 — ⁷Be nelle novae: fabbriche di litio',
    Schatz01: 'Schatz H. et al. (2001), PRL 86, 3471 — il processo rp fino al ciclo Sn-Sb-Te',
    Bildsten98: 'Bildsten L. (1998), in «The Many Faces of Neutron Stars», NATO ASI C 515, 419 — i lampi X di tipo I',
    Hewish68: 'Hewish A. et al. (1968), Nature 217, 709 — la scoperta delle pulsar',
    LP04: 'Lattimer J. M., Prakash M. (2004), Science 304, 536 — la struttura delle stelle di neutroni',
    KB17: 'Kaspi V. M., Beloborodov A. M. (2017), ARA&A 55, 261 — le magnetar',
    CHIME20: 'CHIME/FRB Collaboration (2020), Nature 587, 54 — lampo radio veloce da SGR 1935+2154',
    ATNF: 'Manchester R. N. et al. (2005), AJ 129, 1993 — il catalogo ATNF delle pulsar (P e Ṗ)',
    Rees88: 'Rees M. J. (1988), Nature 333, 523 — distruzione mareale, ricaduta ∝ t^−5/3',
    Gezari21: 'Gezari S. (2021), ARA&A 59, 21 — gli eventi di distruzione mareale osservati',
    WB06: 'Woosley S. E., Bloom J. S. (2006), ARA&A 44, 507 — lampi gamma e supernove',
    GRB221009: 'Burns E. et al. (2023), ApJL 946, L31 — GRB 221009A, il più luminoso',
    HW02: 'Heger A., Woosley S. E. (2002), ApJ 567, 532 — supernove a instabilità di coppia',
    GalYam09: 'Gal-Yam A. et al. (2009), Nature 462, 624 — SN 2007bi',
    GW150914: 'Abbott B. P. et al. (2016), PRL 116, 061102 — GW150914',
    Salpeter64: 'Salpeter E. E. (1964), ApJ 140, 796 — l\'accrescimento sui buchi neri',
    Banados18: 'Bañados E. et al. (2018), Nature 553, 473 — un quasar di 8·10⁸ M☉ a z = 7,5',
    Tremblay19: 'Tremblay P.-E. et al. (2019), Nature 565, 202 — la cristallizzazione delle nane bianche vista da Gaia',
    Fontaine01: 'Fontaine G., Brassard P., Bergeron P. (2001), PASP 113, 409 — il raffreddamento delle nane bianche',
    Planck18: 'Planck Collaboration (2020), A&A 641, A6 — z della ricombinazione ≈ 1090, reionizzazione a z ≈ 7,7',
    Peebles68: 'Peebles P. J. E. (1968), ApJ 153, 1 — la ricombinazione fuori equilibrio e la frazione residua di elettroni',
    Fan06: 'Fan X. et al. (2006), AJ 132, 117 — la fine della reionizzazione a z ≈ 6'
  };
  Object.keys(NUOVE_FONTI).forEach(function (k) { Dd.FONTI[k] = NUOVE_FONTI[k]; });

  /* le categorie e l'ordine con cui compaiono nella sezione */
  var CAT = { nascere: ['Nascere e vivere', 'Birth and life'], morire: ['Morti stellari', 'Stellar deaths'], compatti: ['Oggetti compatti e buchi neri', 'Compact objects and black holes'], pianeti: ['Pianeti', 'Planets'], universo: ['L\'universo', 'The universe'] };
  var EXTRA = [PROTO, BRUNA, ROSSA, CEFEIDE, NOVA, LAMPOX, PULSARS, TDE, GRB, PISN, BHBH, QUASAR, CRIST, RICOMB];
  var vecchi = Dd.scenari;
  var CAT_VECCHI = { supernova: ['morire', '💥'], sole: ['nascere', '☀️'], buconero: ['morire', '🕳️'], ia: ['morire', '⚪'], kilonova: ['compatti', '✨'], bigbang: ['universo', '🌌'], terra: ['pianeti', '🌍'], giove: ['pianeti', '🪐'], galassia: ['universo', '🌀'] };
  Dd.scenari = function () {
    var v = vecchi().map(function (s) { var k = CAT_VECCHI[s.id] || ['universo', '•']; s.cat = k[0]; s.emoji = k[1]; return s; });
    if (v[2] && v[2].id === 'buconero') v[2].emoji = '⚫';
    return v.concat(EXTRA);
  };
  var perIdVecchio = Dd.perId;
  Dd.perId = function (id, M) { var e = EXTRA.filter(function (s) { return s.id === id; })[0]; if (e) return e; var s = perIdVecchio(id, M); if (s) { var k = CAT_VECCHI[s.id]; if (k) { s.cat = k[0]; s.emoji = s.id === 'buconero' ? '⚫' : k[1]; } } return s; };
  Dd.CAT = CAT;
  Dd.eventi = { tff: tff, tKH: tKH, leavitt: leavitt, distanzaCefeide: distanzaCefeide, PCEF: PCEF, cicloCef: cicloCef, pulsar: pulsar, PULSAR: PULSAR, marea: marea, ricaduta: ricaduta, eddington: eddington, salpeter: salpeter, chirp: chirp, MCH150914: MCH150914, saha: saha, T50: T50, compQuasar: compQuasar, compRic: compRic, crescita: crescita, tS: tS };
})(typeof window !== 'undefined' ? window : globalThis);
