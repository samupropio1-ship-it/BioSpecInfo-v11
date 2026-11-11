/* ═══════════════════════════════════════════════════════════════════════════
   bsi-astro-chimica.js — ☁️ chimica di una nube interstellare · 🌡️ Saha e classi spettrali
   BioSpecInfo · © Samuele Pio Provenzano

   PERCHE' ESISTE (v250)
   Richiesta dell'autore: i potenziamenti maggiori anche per astrochimica e
   astrofisica. L'app aveva le molecole del mezzo interstellare come catalogo
   e la vita delle stelle; mancavano due cose che legano la chimica al cielo:

   · LA CHIMICA DI UNA NUBE: perche' l'idrogeno diventa molecolare solo dove la
     nube si scherma dall'ultravioletto, e perche' il monossido di carbonio
     compare ancora piu' in profondita'. Due equazioni cinetiche integrate nel
     tempo:
       H₂   formazione sui grani  R = k_gr·n·n(H),  k_gr = 3×10⁻¹⁷·√(T/100 K) cm³/s
            fotodissociazione     Γ = 5,8×10⁻¹¹·G₀·e^(−3,74·A_V)·f_sch(N_H₂) s⁻¹
            (autoschermatura di Draine e Bertoldi, 1996) piu' i raggi cosmici
       CO   schema ridotto alla Nelson e Langer (1997): C⁺ + H₂ → CHₓ (k₀),
            CHₓ + O → CO (k₁) in gara con la fotodissociazione di CHₓ;
            CO + hν → C + O, con il carbonio subito riionizzato.
     Il risultato classico esce da solo: la transizione H → H₂ sta piu' in
     superficie della transizione C⁺ → CO (la struttura a strati di una regione
     di fotodissociazione), e il tempo di formazione di H₂ e' ~10⁹/n anni.

   · L'EQUAZIONE DI SAHA: quanta parte dell'idrogeno e' ionizzata a una data
     temperatura e pressione elettronica, e — insieme alla distribuzione di
     Boltzmann — perche' le righe di Balmer sono piu' forti nelle stelle di
     classe A, intorno a 9900 K, e non nelle piu' calde. E perche' nel Sole le
     righe H e K del calcio ionizzato battono le righe dell'idrogeno pur
     essendoci un atomo di calcio ogni 500 000 di idrogeno.

   ONESTA'
   · La rete della nube e' un modello didattico a zero dimensioni con
     coefficienti di letteratura arrotondati: da' gli ordini di grandezza e la
     struttura, non le abbondanze di una nube vera (per quelle servono reti di
     centinaia di specie, il trasporto radiativo e l'autoschermatura del CO,
     che qui non c'e').
   · Saha vale all'equilibrio termodinamico locale e per un gas di solo
     idrogeno: le atmosfere vere hanno altri elementi che danno elettroni.
     Gli esempi numerici sono quelli classici dei manuali (Carroll e Ostlie).
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t;
  function griglia(div) { var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); G.appendChild(pan); G.appendChild(dx); div.appendChild(G); return { pan: pan, dx: dx }; }
  function nota(pan) { var n = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(n); return n; }
  function sci(x, c) { if (!isFinite(x)) return '—'; if (x === 0) return '0'; var e = Math.floor(Math.log10(Math.abs(x))), m = x / Math.pow(10, e); return (Math.abs(e) < 3 ? x.toPrecision(c || 3) : m.toFixed((c || 3) - 1) + '×10' + String(e).replace(/-/g, '⁻').replace(/\d/g, function (d) { return '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]; })).replace('.', ','); }

  /* ═══ 1. LA NUBE ═══════════════════════════════════════════════════════ */
  var ANNO = 3.156e7;                       /* secondi */
  var NUBE = {
    kgr100: 3e-17,                          /* formazione di H₂ sui grani a 100 K, cm³/s */
    gammaH2: 5.8e-11,                       /* fotodissociazione di H₂ nel campo di Draine senza schermo, s⁻¹ */
    tauH2: 3.74,                            /* attenuazione della polvere per H₂: e^(−3,74 A_V) */
    zeta: 3e-17,                            /* distruzione di H₂ dai raggi cosmici, s⁻¹ */
    NHperAv: 1.87e21,                       /* colonna di idrogeno per magnitudine di estinzione, cm⁻² */
    b5: 2,                                  /* allargamento Doppler in unita' di 10⁵ cm/s */
    k0: 5e-16, k1: 5e-10,                   /* C⁺ + H₂ → CHₓ ; CHₓ + O → CO   (cm³/s) */
    gammaCHx: 5e-10, gammaCO: 1e-10,        /* fotodissociazione senza schermo, s⁻¹ */
    tauC: 2.5,                              /* attenuazione della polvere per CHₓ e CO */
    xC: 1.4e-4, xO: 3.2e-4                  /* carbonio e ossigeno in fase gassosa, rispetto all'idrogeno */
  };
  function kgr(T) { return NUBE.kgr100 * Math.sqrt(T / 100); }
  /* autoschermatura di H₂ (Draine e Bertoldi 1996, eq. 37): la colonna di H₂ davanti assorbe le stesse righe */
  function schermo(NH2) { var x = NH2 / 5e14, r = Math.sqrt(1 + x); return 0.965 / Math.pow(1 + x / NUBE.b5, 2) + 0.035 / r * Math.exp(-8.5e-4 * r); }
  function gammaH2(f, P) { var NH2 = P.schermo === false ? 0 : 0.5 * f * NUBE.NHperAv * P.Av; return NUBE.gammaH2 * P.G0 * Math.exp(-NUBE.tauH2 * P.Av) * schermo(NH2) + NUBE.zeta; }
  /* la frazione molecolare di equilibrio quando la distruzione non dipende da f: f = 2kn / (2kn + Γ) */
  function fEquilibrio(n, T, gamma) { var a = 2 * kgr(T) * n; return a / (a + gamma); }
  function tempoH2(n, T) { return 1 / (2 * kgr(T) * n) / ANNO; }      /* anni */
  /* la velocita' di formazione del CO per atomo di C⁺ e quella di distruzione */
  function tassiCO(f, y, P) {
    var nH2 = 0.5 * f * P.n, att = P.G0 * Math.exp(-NUBE.tauC * P.Av), xO = Math.max(0, NUBE.xO - y * NUBE.xC);
    var den = NUBE.k1 * xO + NUBE.gammaCHx * att / Math.max(P.n, 1e-30), beta = den > 0 ? NUBE.k1 * xO / den : 0;
    return { forma: NUBE.k0 * nH2 * beta, distrugge: NUBE.gammaCO * att, beta: beta };
  }
  /* l'integrazione: Eulero implicito su passi che crescono geometricamente (le scale vanno dai secoli ai miliardi di anni).
     Ogni equazione e' lineare nella propria incognita: f' = a(1−f) − Γf ;  y' = A(1−y) − Γ_CO·y. L'autoschermatura, che
     dipende da f, si aggiorna con tre giri di punto fisso dentro il passo. */
  function evolvi(P, opz) {
    opz = opz || {};
    var t0 = (opz.da || 1e2) * ANNO, t1 = (opz.a || 1e9) * ANNO, N = opz.passi || 400, q = Math.pow(t1 / t0, 1 / N);
    var f = opz.f0 || 0, y = opz.y0 || 0, tt = 0, a = 2 * kgr(P.T) * P.n, ts = [], fs = [], ys = [];
    for (var i = 0; i <= N; i++) {
      var tn = t0 * Math.pow(q, i), dt = tn - tt, fn = f;
      for (var g = 0; g < 3; g++) fn = (f + dt * a) / (1 + dt * (a + gammaH2(fn, P)));
      var R = tassiCO(fn, y, P), yn = (y + dt * R.forma) / (1 + dt * (R.forma + R.distrugge));
      f = fn; y = yn; tt = tn; ts.push(tn / ANNO); fs.push(f); ys.push(y);
    }
    return { t: ts, f: fs, y: ys, fFin: f, yFin: y };
  }
  /* il profilo di equilibrio attraverso la nube: per ogni profondita' (A_V) lo stato dopo un miliardo di anni */
  function profilo(P, AvMax, M) {
    M = M || 80; var av = [], f = [], y = [];
    for (var i = 0; i <= M; i++) { var A = AvMax * i / M, E = evolvi({ n: P.n, T: P.T, G0: P.G0, Av: A }, { passi: 200, a: 1e10 }); av.push(A); f.push(E.fFin); y.push(E.yFin); }
    function soglia(v) { for (var k = 1; k < v.length; k++) if (v[k - 1] < 0.5 && v[k] >= 0.5) return av[k - 1] + (0.5 - v[k - 1]) / (v[k] - v[k - 1]) * (av[k] - av[k - 1]); return v[0] >= 0.5 ? 0 : null; }
    return { Av: av, f: f, y: y, AvH2: soglia(f), AvCO: soglia(y) };
  }

  function schedaTempo(div) {
    var g = griglia(div), pan = g.pan, ln = 2, Av = 2, lG = 0, T = 50;
    F.cursore(pan, ['Densità n (log₁₀, cm⁻³)', 'Density n (log₁₀, cm⁻³)'], 1, 5, 0.1, ln, function (v) { ln = v; disegna(); }, function (v) { return v.toFixed(1); });
    F.cursore(pan, ['Estinzione A_V (magnitudini)', 'Extinction A_V (magnitudes)'], 0, 8, 0.1, Av, function (v) { Av = v; disegna(); }, function (v) { return v.toFixed(1); });
    F.cursore(pan, ['Campo ultravioletto G₀ (log₁₀)', 'Ultraviolet field G₀ (log₁₀)'], -1, 3, 0.1, lG, function (v) { lG = v; disegna(); }, function (v) { return v.toFixed(1); });
    F.cursore(pan, ['Temperatura (K)', 'Temperature (K)'], 10, 200, 5, T, function (v) { T = v; disegna(); });
    var info = nota(pan), c = F.tela(g.dx, 0.62);
    function disegna() {
      var P = { n: Math.pow(10, ln), T: T, G0: Math.pow(10, lG), Av: Av }, E = evolvi(P), lt = E.t.map(function (x) { return Math.log10(x); });
      F.grafico(c, { serie: [{ x: lt, y: E.f, col: '#5eead4' }, { x: lt, y: E.y, col: '#ffd24a' }, { x: lt, y: E.y.map(function (v) { return 1 - v; }), col: '#ff8fab', tratt: true }], ymin: 0, ymax: 1.02,
        xl: ['log₁₀ del tempo (anni)', 'log₁₀ of time (years)'], yl: ['frazione', 'fraction'],
        legenda: [{ col: '#5eead4', etich: ['idrogeno in H₂', 'hydrogen in H₂'] }, { col: '#ffd24a', etich: ['carbonio in CO', 'carbon in CO'] }, { col: '#ff8fab', etich: ['carbonio in C⁺', 'carbon in C⁺'] }] });
      var tf = tempoH2(P.n, P.T), G = gammaH2(E.fFin, P);
      info.innerHTML = t('Tempo di formazione di H₂: 1/(2·k_gr·n) = ', 'H₂ formation time: 1/(2·k_gr·n) = ') + '<b class="bsiFX-num">' + sci(tf) + t(' anni', ' years') + '</b><br>' +
        t('Fotodissociazione di H₂ (con lo schermo): ', 'H₂ photodissociation (shielded): ') + '<b class="bsiFX-num">' + sci(G) + ' s⁻¹</b><br>' +
        t('All’equilibrio: ', 'At equilibrium: ') + '<b class="bsiFX-num">' + (E.fFin * 100).toFixed(1) + ' %</b>' + t(' dell’idrogeno in H₂, ', ' of hydrogen in H₂, ') + '<b class="bsiFX-num">' + (E.yFin * 100).toFixed(1) + ' %</b>' + t(' del carbonio in CO.', ' of carbon in CO.') + '<br>' +
        (E.fFin < 0.1 ? t('Nube diffusa: l’ultravioletto distrugge le molecole più in fretta di quanto i grani le formino. Aumenta A_V o la densità.', 'Diffuse cloud: ultraviolet destroys molecules faster than grains form them. Raise A_V or the density.')
          : E.yFin < 0.5 ? t('Gas molecolare «oscuro al CO»: l’idrogeno è già H₂, ma il carbonio è ancora C⁺. È il gas che le mappe in CO non vedono.', '“CO-dark” molecular gas: hydrogen is already H₂, but carbon is still C⁺. This is the gas that CO maps miss.')
          : t('Nube molecolare: H₂ e CO. Il CO è la sonda con cui i radiotelescopi la disegnano.', 'Molecular cloud: H₂ and CO. CO is the tracer radio telescopes map it with.'));
    }
    disegna(); F.alRidimensiona(disegna);
  }
  function schedaProfilo(div) {
    var g = griglia(div), pan = g.pan, ln = 3, lG = 1, T = 50;
    F.cursore(pan, ['Densità n (log₁₀, cm⁻³)', 'Density n (log₁₀, cm⁻³)'], 1, 5, 0.1, ln, function (v) { ln = v; disegna(); }, function (v) { return v.toFixed(1); });
    F.cursore(pan, ['Campo ultravioletto G₀ (log₁₀)', 'Ultraviolet field G₀ (log₁₀)'], -1, 4, 0.1, lG, function (v) { lG = v; disegna(); }, function (v) { return v.toFixed(1); });
    F.cursore(pan, ['Temperatura (K)', 'Temperature (K)'], 10, 200, 5, T, function (v) { T = v; disegna(); });
    var info = nota(pan), c = F.tela(g.dx, 0.62);
    function disegna() {
      var R = profilo({ n: Math.pow(10, ln), T: T, G0: Math.pow(10, lG) }, 8);
      F.grafico(c, { serie: [{ x: R.Av, y: R.f, col: '#5eead4' }, { x: R.Av, y: R.y, col: '#ffd24a' }, { x: R.Av, y: R.y.map(function (v) { return 1 - v; }), col: '#ff8fab', tratt: true }], ymin: 0, ymax: 1.02,
        xl: ['profondità nella nube, A_V (magnitudini)', 'depth into the cloud, A_V (magnitudes)'], yl: ['frazione all’equilibrio', 'equilibrium fraction'],
        legenda: [{ col: '#5eead4', etich: ['idrogeno in H₂', 'hydrogen in H₂'] }, { col: '#ffd24a', etich: ['carbonio in CO', 'carbon in CO'] }, { col: '#ff8fab', etich: ['carbonio in C⁺', 'carbon in C⁺'] }] });
      info.innerHTML = t('Da sinistra, dove arriva la luce della stella, verso l’interno:', 'From the left, where starlight arrives, inwards:') + '<br>' +
        t('transizione H → H₂ a A_V = ', 'H → H₂ transition at A_V = ') + '<b class="bsiFX-num">' + (R.AvH2 == null ? '> 8' : R.AvH2.toFixed(2)) + '</b><br>' +
        t('transizione C⁺ → CO a A_V = ', 'C⁺ → CO transition at A_V = ') + '<b class="bsiFX-num">' + (R.AvCO == null ? '> 8' : R.AvCO.toFixed(2)) + '</b><br>' +
        t('L’idrogeno si scherma da solo (ogni molecola davanti assorbe le righe che distruggerebbero quelle dietro), quindi diventa molecolare presto. Il CO in questo modello ha solo lo schermo della polvere e compare più in profondità: è la struttura a strati H / H₂ / C⁺ / CO di una regione di fotodissociazione, come la Barra di Orione.', 'Hydrogen shields itself (each molecule in front absorbs the lines that would destroy those behind), so it turns molecular early. CO in this model has only dust shielding and appears deeper: this is the layered H / H₂ / C⁺ / CO structure of a photodissociation region, like the Orion Bar.');
    }
    disegna(); F.alRidimensiona(disegna);
  }
  function schedaReazioni(div) {
    var d = F.el('div', { 'class': 'bsiFX-pannello' }); div.appendChild(d);
    var righe = [
      ['H + H + grano → H₂ + grano', 'R = k_gr·n·n(H)', 'k_gr = 3×10⁻¹⁷·√(T/100 K) cm³/s', t('In fase gassosa due atomi di H non possono legarsi: non hanno modo di liberarsi dell’energia. Il grano di polvere fa da terzo corpo.', 'In the gas phase two H atoms cannot bind: they cannot shed the energy. The dust grain acts as the third body.')],
      ['H₂ + hν → H + H', 'Γ = 5,8×10⁻¹¹·G₀·e^(−3,74·A_V)·f_sch(N_H₂) s⁻¹', 'f_sch: Draine e Bertoldi (1996)', t('Assorbimento nelle bande di Lyman e Werner (912–1108 Å), poi decadimento nel continuo vibrazionale: circa un assorbimento su dieci dissocia.', 'Absorption in the Lyman and Werner bands (912–1108 Å), then decay into the vibrational continuum: about one absorption in ten dissociates.')],
      ['H₂ + raggio cosmico → …', 'ζ = 3×10⁻¹⁷ s⁻¹', '', t('L’unica distruzione che resta nel cuore della nube, dove l’ultravioletto non arriva.', 'The only destruction left in the heart of the cloud, where ultraviolet does not reach.')],
      ['C⁺ + H₂ → CHₓ', 'k₀ = 5×10⁻¹⁶ cm³/s', t('schema ridotto, Nelson e Langer (1997)', 'reduced scheme, Nelson and Langer (1997)'), t('Associazione radiativa, lenta: è il collo di bottiglia della formazione del CO.', 'Radiative association, slow: it is the bottleneck of CO formation.')],
      ['CHₓ + O → CO + H', 'k₁ = 5×10⁻¹⁰ cm³/s', '', t('In gara con la fotodissociazione di CHₓ: la quota che arriva al CO è β = k₁·x(O) / (k₁·x(O) + Γ_CHₓ/n).', 'Competing with CHₓ photodissociation: the share reaching CO is β = k₁·x(O) / (k₁·x(O) + Γ_CHₓ/n).')],
      ['CHₓ + hν → C + H', 'Γ = 5×10⁻¹⁰·G₀·e^(−2,5·A_V) s⁻¹', '', ''],
      ['CO + hν → C + O', 'Γ = 10⁻¹⁰·G₀·e^(−2,5·A_V) s⁻¹', '', t('Il carbonio liberato viene riionizzato subito: per questo si scrive solo C⁺ e CO.', 'The freed carbon is re-ionised at once: this is why only C⁺ and CO are tracked.')]
    ];
    var h = '<div style="overflow-x:auto"><table class="bsiFX-tab" style="width:100%;border-collapse:collapse;font-size:13.5px"><thead><tr>' + [t('Reazione', 'Reaction'), t('Velocità', 'Rate'), t('Nota', 'Note')].map(function (x) { return '<th style="text-align:left;padding:5px 6px;border-bottom:1px solid #1a3550;color:#9fb6dd">' + x + '</th>'; }).join('') + '</tr></thead><tbody>';
    righe.forEach(function (r) { h += '<tr><td style="padding:6px;border-bottom:1px solid #12263c;min-width:9em"><b>' + r[0] + '</b></td><td style="padding:6px;border-bottom:1px solid #12263c">' + r[1] + (r[2] ? '<br><span style="opacity:.75">' + r[2] + '</span>' : '') + '</td><td style="padding:6px;border-bottom:1px solid #12263c">' + r[3] + '</td></tr>'; });
    d.innerHTML = h + '</tbody></table></div><div class="bsiFX-nota">' + t('Abbondanze in fase gassosa: C/H = 1,4×10⁻⁴, O/H = 3,2×10⁻⁴. G₀ = 1 è il campo ultravioletto medio vicino al Sole; A_V = 1 corrisponde a una colonna di 1,87×10²¹ atomi di idrogeno per cm². È un modello didattico: dà la struttura e gli ordini di grandezza, non le abbondanze di una nube vera.', 'Gas-phase abundances: C/H = 1.4×10⁻⁴, O/H = 3.2×10⁻⁴. G₀ = 1 is the mean ultraviolet field near the Sun; A_V = 1 corresponds to a column of 1.87×10²¹ hydrogen atoms per cm². This is a teaching model: it gives the structure and the orders of magnitude, not the abundances of a real cloud.') + '</div>';
  }

  /* ═══ 2. SAHA E BOLTZMANN ══════════════════════════════════════════════ */
  var K_B = 1.380649e-23, H_P = 6.62607015e-34, M_E = 9.1093837015e-31, EV = 1.602176634e-19;
  /* N_{i+1}/N_i = (2kT/P_e)·(Z_{i+1}/Z_i)·(2π m_e kT/h²)^{3/2}·e^(−χ/kT) ; P_e in pascal, χ in eV */
  function saha(T, Pe, chi, Z1, Z2) { return 2 * K_B * T / Pe * (Z2 / Z1) * Math.pow(2 * Math.PI * M_E * K_B * T / (H_P * H_P), 1.5) * Math.exp(-chi * EV / (K_B * T)); }
  function ionizzatoH(T, Pe) { var r = saha(T, Pe, 13.6, 2, 1); return r / (1 + r); }
  /* Boltzmann: N_b/N_a = (g_b/g_a)·e^(−ΔE/kT) */
  function boltzmann(T, dE, gb, ga) { return gb / ga * Math.exp(-dE * EV / (K_B * T)); }
  /* la frazione di TUTTO l'idrogeno che e' neutro e nel livello n = 2: da li' partono le righe di Balmer */
  function balmer(T, Pe) { var b = boltzmann(T, 10.2, 8, 2); return b / (1 + b) * (1 - ionizzatoH(T, Pe)); }
  function temperaturaMeta(Pe) { var a = 3000, b = 40000; for (var i = 0; i < 80; i++) { var m = (a + b) / 2; if (ionizzatoH(m, Pe) < 0.5) a = m; else b = m; } return (a + b) / 2; }
  function piccoBalmer(Pe) { var best = 0, Tb = 0; for (var T = 4000; T <= 30000; T += 10) { var v = balmer(T, Pe); if (v > best) { best = v; Tb = T; } } return { T: Tb, frazione: best }; }
  /* il Sole (T = 5777 K, P_e = 1,5 Pa): atomi di Ca II nello stato fondamentale contro atomi di H in n = 2 */
  function soleCalcio(T, Pe) {
    T = T || 5777; Pe = Pe == null ? 1.5 : Pe;
    var rH = saha(T, Pe, 13.6, 2, 1), bH = boltzmann(T, 10.2, 8, 2), H2 = bH / (1 + bH) / (1 + rH);
    var rCa = saha(T, Pe, 6.11, 1.32, 2.30), CaII = rCa / (1 + rCa), bCa = boltzmann(T, 3.12, 4, 2), fond = 1 / (1 + bCa);
    var abbondanza = 1 / 500000;
    return { ionizzatoH: rH / (1 + rH), H2: H2, CaII: CaII, fondamentale: fond, rapporto: abbondanza * CaII * fond / H2 };
  }
  var CLASSI = [['M', 2400, 3700, '#ff8a65'], ['K', 3700, 5200, '#ffb74d'], ['G', 5200, 6000, '#fff176'], ['F', 6000, 7500, '#fffde7'], ['A', 7500, 10000, '#e3f2fd'], ['B', 10000, 30000, '#90caf9'], ['O', 30000, 50000, '#7986cb']];
  function classeDi(T) { for (var i = 0; i < CLASSI.length; i++) if (T >= CLASSI[i][1] && T < CLASSI[i][2]) return CLASSI[i][0]; return T < 2400 ? 'L' : 'O'; }

  function schedaIonizzazione(div) {
    var g = griglia(div), pan = g.pan, lP = Math.log10(20), T = 9600;
    F.cursore(pan, ['Pressione elettronica (log₁₀, Pa)', 'Electron pressure (log₁₀, Pa)'], -1, 3, 0.05, lP, function (v) { lP = v; disegna(); }, function (v) { return v.toFixed(2); });
    F.cursore(pan, ['Temperatura (K)', 'Temperature (K)'], 4000, 25000, 100, T, function (v) { T = v; disegna(); });
    var info = nota(pan), c = F.tela(g.dx, 0.6);
    function disegna() {
      var Pe = Math.pow(10, lP), xs = [], ys = [];
      for (var q = 4000; q <= 25000; q += 100) { xs.push(q); ys.push(ionizzatoH(q, Pe)); }
      var T50 = temperaturaMeta(Pe), x = ionizzatoH(T, Pe);
      F.grafico(c, { serie: [{ x: xs, y: ys, col: '#5eead4' }], punti: [{ x: T, y: x, col: '#ffd24a', r: 5 }, { x: T50, y: 0.5, col: '#ff8fab', r: 4 }], ymin: 0, ymax: 1.02, xl: ['temperatura (K)', 'temperature (K)'], yl: ['frazione di idrogeno ionizzato', 'fraction of hydrogen ionised'] });
      info.innerHTML = '<div class="bsiFX-eq">N_II/N_I = (2kT/P_e)·(Z_II/Z_I)·(2π m_e kT/h²)^(3/2)·e^(−χ/kT)</div>' +
        'P_e = <b class="bsiFX-num">' + sci(Pe) + ' Pa</b>, T = <b class="bsiFX-num">' + T + ' K</b> → ' + t('ionizzato: ', 'ionised: ') + '<b class="bsiFX-num">' + (x * 100).toFixed(1) + ' %</b><br>' +
        t('Metà dell’idrogeno è ionizzata a ', 'Half of the hydrogen is ionised at ') + '<b class="bsiFX-num">' + Math.round(T50) + ' K</b><br>' +
        t('La ionizzazione non avviene a kT = 13,6 eV (158 000 K) ma dieci-quindici volte prima: il fattore di spazio delle fasi dell’elettrone libero è enorme, e basta la coda della distribuzione. Il passaggio da neutro a ionizzato occupa appena 3000 K: è la zona di ionizzazione parziale delle stelle.', 'Ionisation does not happen at kT = 13.6 eV (158,000 K) but ten to fifteen times earlier: the free electron’s phase-space factor is huge, and the tail of the distribution is enough. The passage from neutral to ionised spans barely 3000 K: this is the partial ionisation zone of stars.');
    }
    disegna(); F.alRidimensiona(disegna);
  }
  function schedaBalmer(div) {
    var g = griglia(div), pan = g.pan, lP = Math.log10(20), T = 9900;
    F.cursore(pan, ['Pressione elettronica (log₁₀, Pa)', 'Electron pressure (log₁₀, Pa)'], -1, 3, 0.05, lP, function (v) { lP = v; disegna(); }, function (v) { return v.toFixed(2); });
    F.cursore(pan, ['Temperatura della stella (K)', 'Temperature of the star (K)'], 4000, 25000, 100, T, function (v) { T = v; disegna(); });
    var info = nota(pan), c = F.tela(g.dx, 0.6);
    function disegna() {
      var Pe = Math.pow(10, lP), xs = [], ys = [], y1 = [], y2 = [], P = piccoBalmer(Pe);
      for (var q = 4000; q <= 25000; q += 100) { xs.push(q); ys.push(balmer(q, Pe) / P.frazione); var b = boltzmann(q, 10.2, 8, 2); y1.push(Math.min(1, b / (1 + b) / (boltzmann(25000, 10.2, 8, 2)))); y2.push(1 - ionizzatoH(q, Pe)); }
      F.grafico(c, { serie: [{ x: xs, y: ys, col: '#5eead4', larg: 2.5 }, { x: xs, y: y1, col: '#ffd24a', tratt: true }, { x: xs, y: y2, col: '#ff8fab', tratt: true }], punti: [{ x: T, y: balmer(T, Pe) / P.frazione, col: '#ffffff', r: 5 }], ymin: 0, ymax: 1.05,
        xl: ['temperatura (K)', 'temperature (K)'], yl: ['relativo al massimo', 'relative to the maximum'],
        legenda: [{ col: '#5eead4', etich: ['atomi di H in n = 2 (righe di Balmer)', 'H atoms in n = 2 (Balmer lines)'] }, { col: '#ffd24a', etich: ['eccitati a n = 2 (Boltzmann)', 'excited to n = 2 (Boltzmann)'] }, { col: '#ff8fab', etich: ['ancora neutri (Saha)', 'still neutral (Saha)'] }] });
      info.innerHTML = t('Classe spettrale a ', 'Spectral class at ') + T + ' K: <b class="bsiFX-num">' + classeDi(T) + '</b><br>' +
        t('Le righe di Balmer sono massime a ', 'The Balmer lines peak at ') + '<b class="bsiFX-num">' + P.T + ' K</b>' + t(' (classe ', ' (class ') + classeDi(P.T) + '), ' + t('quando è in n = 2 un atomo su ', 'when one atom in ') + sci(1 / P.frazione, 2) + t('.', ' is in n = 2.') + '<br>' +
        t('Due effetti in gara. Scaldando, più atomi salgono al livello n = 2 (curva gialla, Boltzmann): le righe crescono. Ma oltre i 10 000 K gli atomi perdono l’elettrone (curva rosa, Saha) e non resta chi possa assorbire: le righe calano. Il prodotto ha un massimo stretto: per questo Vega (classe A) ha righe dell’idrogeno fortissime e una stella O, molto più calda, quasi nessuna.', 'Two competing effects. On heating, more atoms climb to level n = 2 (yellow curve, Boltzmann): the lines grow. But beyond 10,000 K atoms lose their electron (pink curve, Saha) and nothing is left to absorb: the lines fade. The product has a narrow maximum: this is why Vega (class A) has very strong hydrogen lines and an O star, much hotter, almost none.');
    }
    disegna(); F.alRidimensiona(disegna);
  }
  function schedaSole(div) {
    var g = griglia(div), pan = g.pan, T = 5777, lP = Math.log10(1.5);
    F.cursore(pan, ['Temperatura (K)', 'Temperature (K)'], 4000, 9000, 1, T, function (v) { T = v; disegna(); });
    F.cursore(pan, ['Pressione elettronica (log₁₀, Pa)', 'Electron pressure (log₁₀, Pa)'], -1, 2, 0.01, lP, function (v) { lP = v; disegna(); }, function (v) { return v.toFixed(2); });
    var info = nota(pan), c = F.tela(g.dx, 0.6);
    function disegna() {
      var Pe = Math.pow(10, lP), S = soleCalcio(T, Pe), xs = [], ys = [];
      for (var q = 4000; q <= 9000; q += 50) { xs.push(q); ys.push(Math.log10(soleCalcio(q, Pe).rapporto)); }
      F.grafico(c, { serie: [{ x: xs, y: ys, col: '#5eead4' }, { x: [4000, 9000], y: [0, 0], col: '#34465f', tratt: true }], punti: [{ x: T, y: Math.log10(S.rapporto), col: '#ffd24a', r: 5 }],
        xl: ['temperatura (K)', 'temperature (K)'], yl: ['log₁₀ (Ca II che assorbe / H che assorbe)', 'log₁₀ (absorbing Ca II / absorbing H)'] });
      info.innerHTML = t('A ', 'At ') + T + ' K, P_e = ' + sci(Pe) + ' Pa:<br>' +
        t('idrogeno ionizzato: ', 'hydrogen ionised: ') + '<b class="bsiFX-num">' + sci(S.ionizzatoH) + '</b>; ' + t('in n = 2: ', 'in n = 2: ') + '<b class="bsiFX-num">' + sci(S.H2) + '</b><br>' +
        t('calcio ionizzato una volta: ', 'calcium singly ionised: ') + '<b class="bsiFX-num">' + (S.CaII * 100).toFixed(1) + ' %</b>; ' + t('nello stato fondamentale: ', 'in the ground state: ') + '<b class="bsiFX-num">' + (S.fondamentale * 100).toFixed(1) + ' %</b><br>' +
        t('Per ogni atomo di H che può fare una riga di Balmer ci sono ', 'For each H atom that can make a Balmer line there are ') + '<b class="bsiFX-num">' + (S.rapporto >= 10 ? Math.round(S.rapporto) : S.rapporto.toPrecision(2)) + '</b>' + t(' ioni Ca II che possono fare le righe H e K.', ' Ca II ions that can make the H and K lines.') + '<br>' +
        t('Nel Sole c’è un atomo di calcio ogni 500 000 di idrogeno, eppure le righe H e K del Ca II (393 e 397 nm) sono le più forti dello spettro visibile. Non è la quantità: è che quasi tutto il calcio è ionizzato una volta e nello stato giusto, mentre dell’idrogeno solo un atomo su duecento milioni è in n = 2. La forza di una riga dice la temperatura, non solo la composizione: fu l’idea di Cecilia Payne nel 1925.', 'In the Sun there is one calcium atom per 500,000 of hydrogen, yet the Ca II H and K lines (393 and 397 nm) are the strongest in the visible spectrum. It is not the amount: almost all calcium is singly ionised and in the right state, while only one hydrogen atom in two hundred million is in n = 2. The strength of a line tells the temperature, not just the composition: this was Cecilia Payne’s insight in 1925.');
    }
    disegna(); F.alRidimensiona(disegna);
  }

  F.calcolo.nube = { NUBE: NUBE, kgr: kgr, schermo: schermo, gammaH2: gammaH2, fEquilibrio: fEquilibrio, tempoH2: tempoH2, tassiCO: tassiCO, evolvi: evolvi, profilo: profilo, ANNO: ANNO };
  F.calcolo.saha = { saha: saha, ionizzatoH: ionizzatoH, boltzmann: boltzmann, balmer: balmer, temperaturaMeta: temperaturaMeta, piccoBalmer: piccoBalmer, soleCalcio: soleCalcio, classeDi: classeDi, CLASSI: CLASSI };

  F.sezione('snubeism', {
    titolo: ['☁️ Chimica di una nube interstellare', '☁️ Chemistry of an interstellar cloud'],
    sotto: ['Come l’idrogeno diventa molecolare e il carbonio diventa CO: la formazione sui grani di polvere contro la fotodissociazione, nel tempo e attraverso la nube, con la struttura a strati di una regione di fotodissociazione.',
            'How hydrogen turns molecular and carbon turns into CO: formation on dust grains against photodissociation, in time and through the cloud, with the layered structure of a photodissociation region.'],
    schede: [
      { nome: ['Nel tempo', 'In time'], costruisci: schedaTempo },
      { nome: ['Attraverso la nube', 'Through the cloud'], costruisci: schedaProfilo },
      { nome: ['Le reazioni', 'The reactions'], costruisci: schedaReazioni }
    ]
  });
  F.sezione('ssaha', {
    titolo: ['🌡️ Saha e le classi spettrali', '🌡️ Saha and the spectral classes'],
    sotto: ['L’equazione di Saha per la ionizzazione e la distribuzione di Boltzmann per l’eccitazione: perché le righe di Balmer sono massime nelle stelle di classe A, e perché nel Sole il calcio batte l’idrogeno.',
            'The Saha equation for ionisation and the Boltzmann distribution for excitation: why Balmer lines peak in class A stars, and why calcium beats hydrogen in the Sun.'],
    schede: [
      { nome: ['Ionizzazione', 'Ionisation'], costruisci: schedaIonizzazione },
      { nome: ['Righe di Balmer', 'Balmer lines'], costruisci: schedaBalmer },
      { nome: ['Il Sole: calcio contro idrogeno', 'The Sun: calcium versus hydrogen'], costruisci: schedaSole }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
