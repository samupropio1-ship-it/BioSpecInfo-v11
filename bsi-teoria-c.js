/* bsi-teoria-c.js — teoria delle sezioni (lotto C). BioSpecInfo · © Samuele Pio Provenzano */
(function (g) {
  'use strict';
  var T = g.BSITeoriaDati = g.BSITeoriaDati || {};

  /* ═══ 🎯 Meccanica in movimento ═══════════════════════════════════════════ */
  T['sfismecc'] = {
    titolo: "Dinamica del punto e dei sistemi oltre il caso ideale",
    sintesi: "La seconda legge di Newton, F = m·a, determina il moto una volta date le forze e le condizioni iniziali. Nei casi da manuale (vuoto, piccole oscillazioni, urti elastici) le equazioni hanno soluzioni in forma chiusa; appena si aggiunge la resistenza dell'aria, l'ampiezza finita del pendolo o un urto con perdita di energia, conviene integrarle numericamente. Restano però esatte le leggi di conservazione: quantità di moto negli urti, energia quando le forze sono conservative.",
    paragrafi: [
      { titolo: "Il proiettile nell'aria", testo: "Nel vuoto il proiettile descrive una parabola, la gittata su terreno piano vale R = v₀² sin 2θ/g e il massimo si ha a 45°. Per un corpo che si muove velocemente nell'aria la forza di trascinamento è quasi proporzionale al quadrato della velocità, F = −½ρC_dA|v|v, che per unità di massa si scrive −k|v|v con k = ρC_dA/(2m), misurato in m⁻¹. Le equazioni del moto si accoppiano fra loro e non hanno più una soluzione elementare: la sezione le integra con il metodo di Runge–Kutta del quarto ordine. La traiettoria diventa asimmetrica, con la discesa più ripida della salita, e il corpo tende alla velocità limite v_t = √(g/k). Poiché la resistenza penalizza soprattutto i voli lunghi e alti, l'angolo di gittata massima scende sotto i 45°." },
      { titolo: "Urti e coefficiente di restituzione", testo: "Durante un urto fra due carrelli le forze interne sono grandi e brevi, quelle esterne trascurabili: la quantità di moto totale si conserva sempre, qualunque sia la natura dell'urto. L'energia cinetica invece si conserva soltanto nell'urto elastico. Il coefficiente di restituzione e = −(u₁ − u₂)/(v₁ − v₂) misura quanto della velocità relativa sopravvive all'urto: vale 1 nell'urto elastico e 0 in quello perfettamente anelastico, in cui i corpi restano uniti. Nel riferimento del centro di massa le velocità si invertono e si riducono del fattore e, e da qui si ricava l'energia dissipata, ½μ(1 − e²)v_rel², con μ = m₁m₂/(m₁ + m₂) massa ridotta. La velocità del centro di massa non cambia mai." },
      { titolo: "Il pendolo vero", testo: "L'equazione esatta del pendolo semplice è θ'' = −(g/L) sin θ. Solo per piccole ampiezze si può porre sin θ ≈ θ e ottenere l'oscillatore armonico con periodo T₀ = 2π√(L/g), indipendente dall'ampiezza. In generale il periodo è T = 4√(L/g)·K(k), con k = sin(θ₀/2) e K l'integrale ellittico completo di prima specie, che la sezione calcola con la media aritmetico-geometrica di Gauss, rapidissima. Lo sviluppo T ≈ T₀(1 + θ₀²/16 + …) mostra che l'isocronismo è un'approssimazione: a 60° il periodo è già più lungo del 7 %. Nello spazio delle fasi (θ, ω) le orbite chiuse delle oscillazioni sono separate dalle rotazioni complete dalla separatrice, che corrisponde all'energia necessaria per arrivare esattamente in cima; un termine −γθ' aggiunge lo smorzamento e trasforma le orbite in spirali." },
      { titolo: "Oscillatori accoppiati e modi normali", testo: "Due masse uguali legate alle pareti da molle k e fra loro da una molla k_c obbediscono a due equazioni lineari accoppiate. Esistono però due combinazioni che oscillano ciascuna con una sola frequenza: il modo in fase, in cui la molla centrale non si deforma, con ω₁ = √(k/m), e il modo in opposizione, con ω₂ = √((k + 2k_c)/m). Ogni moto è una sovrapposizione dei due modi. Se si sposta una sola massa, i due modi partono con la stessa ampiezza e la loro somma produce battimenti: l'energia passa lentamente alla seconda massa e torna indietro, e l'inviluppo si ripete dopo un tempo 2π/(ω₂ − ω₁). Più l'accoppiamento è debole, più lo scambio è lento. Lo stesso schema descrive le vibrazioni delle molecole e i fononi nei cristalli." },
      { titolo: "Il lancio in tre dimensioni con il vento", testo: "La resistenza dell'aria non dipende dalla velocità del corpo rispetto al suolo, ma da quella rispetto all'aria: a = −g ẑ − k|v − w|(v − w), con w la velocità del vento. Un vento laterale produce quindi una deriva fuori dal piano di lancio, e un vento in coda può perfino spingere il corpo, compiendo su di esso lavoro positivo. Il bilancio energetico per unità di massa, d(½v² + gz)/dt = a_res·v, si verifica integrando il lavoro della resistenza insieme alla traiettoria: la differenza fra l'energia meccanica iniziale e finale deve coincidere con quel lavoro, ed è anche un controllo della precisione numerica dell'integratore." }
    ],
    formule: [
      ["R = v₀² sin 2θ / g", "gittata nel vuoto su terreno piano: v₀ velocità iniziale (m/s), θ angolo di lancio, g = 9,80665 m/s²"],
      ["a = −g ẑ − k |v − w| (v − w)", "accelerazione con resistenza quadratica: k = ρC_dA/(2m) in m⁻¹, w velocità del vento (m/s)"],
      ["u₁ = [m₁v₁ + m₂v₂ − m₂e(v₁ − v₂)]/(m₁ + m₂),  u₂ = [m₁v₁ + m₂v₂ + m₁e(v₁ − v₂)]/(m₁ + m₂)", "velocità dopo un urto centrale unidimensionale con coefficiente di restituzione e"],
      ["ΔK = ½ μ (1 − e²) v_rel²", "energia cinetica dissipata nell'urto; μ = m₁m₂/(m₁ + m₂) massa ridotta, v_rel velocità relativa prima dell'urto"],
      ["T = 4 √(L/g) · K(sin(θ₀/2))", "periodo esatto del pendolo di lunghezza L e ampiezza θ₀; K integrale ellittico completo di prima specie"],
      ["ω₁ = √(k/m),  ω₂ = √((k + 2k_c)/m)", "pulsazioni dei modi normali in fase e in opposizione di due masse uguali accoppiate"]
    ],
    ipotesi: [
      "Meccanica newtoniana: velocità molto minori di c, riferimento inerziale (si trascurano la rotazione terrestre e la variazione di g con la quota).",
      "Resistenza quadratica con coefficiente costante: è un modello per numeri di Reynolds alti; a basse velocità o per corpi piccoli prevale la resistenza lineare (Stokes), e C_d dipende comunque dal regime.",
      "Pendolo semplice: filo inestensibile e senza massa, massa puntiforme; lo smorzamento viscoso −γθ' è un modello fenomenologico.",
      "Urti istantanei e centrali, con e costante, mentre nei corpi reali e dipende dalla velocità d'impatto."
    ],
    errori: [
      "Pensare che negli urti anelastici non si conservi la quantità di moto: si perde energia cinetica, non quantità di moto, perché le forze dissipative sono interne al sistema.",
      "Usare T = 2π√(L/g) per ampiezze grandi: a 90° l'errore è circa il 18 %.",
      "Credere che con l'aria l'angolo ottimo resti 45° o che la massa non conti: a parità di forma un corpo più pesante ha k più piccolo e risente meno della resistenza.",
      "Calcolare la resistenza con la velocità rispetto al suolo invece che rispetto all'aria quando c'è vento."
    ],
    esempio: {
      testo: "Un pendolo lungo L = 1,00 m viene lasciato da θ₀ = 60°. Con le piccole oscillazioni T₀ = 2π√(1,00/9,80665) = 2,0064 s. Per il valore esatto k = sin 30° = 0,5 e la media aritmetico-geometrica dà K(0,5) = 1,68575; quindi T = 4·√(1,00/9,80665)·1,68575 = 4·0,31933·1,68575 = 2,1532 s, cioè il 7,3 % in più di T₀ (la serie T₀(1 + θ₀²/16) con θ₀ = 1,047 rad dà già 2,144 s).",
      risultato: "T ≈ 2,153 s contro T₀ = 2,006 s (+7,3 %)"
    },
    fonti: [
      "D. Halliday, R. Resnick, K. S. Krane, Fisica 1, Casa Editrice Ambrosiana, 5ª ed., capitoli sugli urti e sulle oscillazioni",
      "P. Mazzoldi, M. Nigro, C. Voci, Fisica, vol. I: Meccanica e Termodinamica, EdiSES, 2ª ed., capitoli su dinamica del punto, sistemi di punti e oscillazioni",
      "J. R. Taylor, Classical Mechanics, University Science Books, 2005, cap. 2 (resistenza dell'aria) e cap. 11 (oscillatori accoppiati e modi normali)",
      "L. D. Landau, E. M. Lifshitz, Meccanica (Corso di fisica teorica, vol. 1), Editori Riuniti, §11 (moto unidimensionale) e §23 (oscillazioni di sistemi a più gradi di libertà)"
    ],
    collegamenti: ['sfisanalitica', 'sfoucault', 'sfisfluidi', 'smatode']
  };

  /* ═══ 〰️ Onde e ottica ═════════════════════════════════════════════════════ */
  T['sfisonde'] = {
    titolo: "Sovrapposizione, ottica geometrica e diffrazione",
    sintesi: "Un'onda è una perturbazione che si propaga trasportando energia senza trasportare materia. Se l'equazione d'onda è lineare, due onde si sommano punto per punto: da questo principio di sovrapposizione nascono battimenti, onde stazionarie, interferenza e diffrazione. Quando la lunghezza d'onda è molto più piccola degli oggetti incontrati, la luce si può descrivere con raggi rettilinei e si ottiene l'ottica geometrica di lenti e specchi.",
    paragrafi: [
      { titolo: "Sovrapposizione: battimenti e onde stazionarie", testo: "Un'onda armonica che viaggia lungo x si scrive y = A sin(kx − ωt), con numero d'onda k = 2π/λ e pulsazione ω = 2πf; la sua velocità di fase è v = ω/k = λf. Sommando due onde di frequenze vicine f₁ e f₂ si ottiene un'oscillazione alla frequenza media modulata da un inviluppo lento: l'intensità pulsa con la frequenza di battimento |f₁ − f₂|. Due onde uguali che viaggiano in versi opposti danno invece l'onda stazionaria y = 2A sin kx cos ωt, in cui ogni punto oscilla in fase con gli altri, con ampiezza fissa nello spazio: i nodi distano λ/2 e l'energia non si propaga." },
      { titolo: "Velocità di fase e di gruppo", testo: "Un segnale reale non è un'onda armonica infinita ma un pacchetto, somma di molte componenti con k vicini. Se il mezzo è dispersivo, cioè se ω non è proporzionale a k, le creste interne del pacchetto si muovono con la velocità di fase ω/k mentre l'inviluppo, e con lui l'energia e l'informazione, si sposta con la velocità di gruppo v_g = dω/dk. Nella sezione si vede bene: le creste scivolano dentro l'inviluppo. Nel vuoto la luce non è dispersiva e le due velocità coincidono; nell'acqua profonda, dove ω = √(gk), la velocità di gruppo è la metà di quella di fase." },
      { titolo: "Ottica geometrica: lenti e specchi", testo: "Nell'approssimazione parassiale, con raggi poco inclinati e vicini all'asse, una lente sottile o uno specchio sferico formano l'immagine di un punto secondo la legge dei punti coniugati 1/p + 1/q = 1/f. Con la convenzione usata nella sezione, p e q sono positivi per oggetto e immagine reali, f è positiva per lenti convergenti e specchi concavi (per lo specchio f = R/2) e negativa per quelli divergenti. L'ingrandimento trasversale è M = −q/p: un M negativo indica un'immagine capovolta. L'immagine si costruisce con tre raggi principali: quello parallelo all'asse, che passa per il fuoco, quello che passa per il centro della lente senza deviare e quello che passa per il primo fuoco e esce parallelo. Se i raggi emergenti divergono, l'immagine è virtuale e si trova prolungandoli all'indietro." },
      { titolo: "Diffrazione da N fenditure", testo: "Un reticolo di N fenditure larghe a e distanti d, illuminato da un'onda piana e osservato a grande distanza (regime di Fraunhofer), produce l'intensità I(θ) = I₀ (sin β/β)² (sin Nα/(N sin α))², con α = πd sin θ/λ e β = πa sin θ/λ. Il secondo fattore, l'interferenza fra le fenditure, ha massimi principali dove d sin θ = mλ, sempre più stretti al crescere di N, con N − 2 massimi secondari deboli fra l'uno e l'altro. Il primo fattore, la diffrazione della singola fenditura, fa da inviluppo e può cancellare un ordine quando un suo zero, a sin θ = m'λ, cade su un massimo principale. Poiché la larghezza angolare dei massimi diminuisce come 1/N, il reticolo separa due lunghezze d'onda vicine con potere risolutivo R = λ/Δλ = mN." },
      { titolo: "Interferenza di due sorgenti sulla superficie dell'acqua", testo: "Due sorgenti coerenti che oscillano in fase producono in ogni punto due onde che hanno percorso cammini r₁ e r₂. L'interferenza è costruttiva dove r₁ − r₂ = mλ e distruttiva dove r₁ − r₂ = (m + ½)λ: le linee nodali, su cui la superficie resta ferma, sono iperboli con i fuochi nelle sorgenti. Il loro numero cresce con il rapporto d/λ fra la distanza delle sorgenti e la lunghezza d'onda, e uno sfasamento fra le sorgenti sposta tutta la figura da un lato. È la versione bidimensionale dell'esperimento di Young." }
    ],
    formule: [
      ["y(x, t) = A sin(kx − ωt),  v = ω/k = λf", "onda armonica progressiva: A ampiezza, k = 2π/λ numero d'onda (rad/m), ω = 2πf pulsazione (rad/s)"],
      ["f_batt = |f₁ − f₂|", "frequenza dei battimenti fra due onde di frequenze vicine"],
      ["v_g = dω/dk", "velocità di gruppo, con cui viaggiano l'inviluppo e l'energia di un pacchetto"],
      ["1/p + 1/q = 1/f,  M = −q/p", "legge dei punti coniugati per lente sottile o specchio sferico in approssimazione parassiale; p, q, f in metri"],
      ["I(θ) = I₀ (sin β/β)² (sin Nα / (N sin α))²,  α = πd sin θ/λ,  β = πa sin θ/λ", "figura di Fraunhofer di N fenditure larghe a con passo d"],
      ["d sin θ = mλ,  R = λ/Δλ = mN", "massimi principali del reticolo di ordine m e suo potere risolutivo"]
    ],
    ipotesi: [
      "Mezzo lineare: la sovrapposizione vale finché le ampiezze sono piccole; onde d'urto e ottica non lineare ne sono escluse.",
      "Ottica geometrica: lunghezza d'onda trascurabile rispetto alle aperture; lente sottile e raggi parassiali, quindi senza aberrazioni sferiche o cromatiche.",
      "Diffrazione di Fraunhofer: sorgente e schermo a distanza grande rispetto a d²/λ, onda incidente piana e monocromatica, luce coerente."
    ],
    errori: [
      "Confondere velocità di fase e di gruppo: in un mezzo dispersivo la velocità di fase può superare c senza violare la relatività, perché l'informazione viaggia con la velocità di gruppo.",
      "Sbagliare la convenzione dei segni nella legge delle lenti: un q negativo non è un errore di calcolo ma un'immagine virtuale.",
      "Pensare che con più fenditure i massimi si spostino: la loro posizione dipende solo da d e λ; con N cambia la loro larghezza.",
      "Scambiare la condizione dei minimi di singola fenditura, a sin θ = mλ, con quella dei massimi del reticolo, d sin θ = mλ."
    ],
    esempio: {
      testo: "Un reticolo con 600 righe/mm (d = 1,667 μm) è illuminato con la luce gialla del sodio, λ = 589 nm. Il primo ordine si trova a sin θ = λ/d = 0,3534, cioè θ = 20,7°. Gli ordini visibili sono quelli con |m| ≤ d/λ = 2,83, quindi fino a m = 2. Per separare il doppietto del sodio (589,0 e 589,6 nm, Δλ ≈ 0,597 nm) serve R = λ/Δλ ≈ 589,3/0,597 ≈ 987: in primo ordine bastano circa mille righe illuminate, cioè meno di 2 mm di reticolo.",
      risultato: "θ₁ ≈ 20,7°; ordini fino a m = 2; N ≥ 987 righe in primo ordine"
    },
    fonti: [
      "D. Halliday, R. Resnick, K. S. Krane, Fisica 2, Casa Editrice Ambrosiana, 5ª ed., capitoli su onde, ottica geometrica, interferenza e diffrazione",
      "E. Hecht, Optics, Pearson, 5ª ed., cap. 5 (ottica geometrica), cap. 9 (interferenza) e cap. 10 (diffrazione)",
      "R. P. Feynman, R. B. Leighton, M. Sands, The Feynman Lectures on Physics, vol. I, capp. 26–30 (ottica, interferenza, diffrazione) e cap. 48 (battimenti e velocità di gruppo)",
      "P. Mazzoldi, M. Nigro, C. Voci, Fisica, vol. II: Elettromagnetismo e Onde, EdiSES, capitoli su interferenza e diffrazione"
    ],
    collegamenti: ['sfissuono', 'sfisem', 'sfislaser', 'scristalli']
  };

  /* ═══ 🔌 Circuiti ═════════════════════════════════════════════════════════ */
  T['sfiscirc'] = {
    titolo: "Circuiti RC, RL e RLC: transitori, corrente alternata e filtri",
    sintesi: "Resistori, condensatori e induttori sono descritti da relazioni lineari fra tensione e corrente; le leggi di Kirchhoff le combinano in equazioni differenziali lineari. La risposta a un gradino è un transitorio esponenziale o oscillante smorzato; la risposta a una sinusoide si tratta con i fasori e l'impedenza complessa, da cui seguono la risonanza, il fattore di merito e i filtri descritti dal diagramma di Bode.",
    paragrafi: [
      { titolo: "Le leggi di Kirchhoff e gli elementi", testo: "La legge dei nodi esprime la conservazione della carica, quella delle maglie il fatto che il campo elettrico, nell'approssimazione quasi stazionaria, è conservativo fuori dagli induttori. Ogni elemento ha la sua relazione costitutiva: V = RI per il resistore, I = C dV/dt per il condensatore, V = L dI/dt per l'induttore. Ne viene che la tensione su un condensatore e la corrente in un induttore non possono saltare bruscamente, perché un salto richiederebbe corrente o tensione infinite: sono queste le grandezze che fissano le condizioni iniziali di un transitorio." },
      { titolo: "Transitori RC, RL e RLC", testo: "Applicando un gradino di tensione V₀ a un circuito RC, la tensione sul condensatore sale come V₀(1 − e^(−t/τ)) con τ = RC; nel circuito RL è la corrente a crescere verso V₀/R con τ = L/R. Dopo cinque costanti di tempo il transitorio è esaurito a meno dell'1 %. Il circuito RLC serie obbedisce a L q'' + R q' + q/C = V₀, la stessa equazione di un oscillatore meccanico smorzato con L al posto della massa, R dell'attrito e 1/C della costante elastica. Il rapporto di smorzamento ζ = (R/2)√(C/L) decide il regime: con ζ < 1 la carica oscilla alla pulsazione ω_d = ω₀√(1 − ζ²) dentro un inviluppo che decade; con ζ = 1 (smorzamento critico) raggiunge il valore finale nel tempo più breve senza superarlo; con ζ > 1 vi arriva lentamente, come somma di due esponenziali." },
      { titolo: "Fasori e impedenza", testo: "Con una sorgente sinusoidale, a regime ogni grandezza oscilla alla stessa frequenza e si rappresenta con un numero complesso, il fasore, che contiene ampiezza e fase. Le derivate diventano moltiplicazioni per jω e le leggi di Kirchhoff diventano algebriche: un resistore ha impedenza R, un induttore jωL, un condensatore 1/(jωC). In serie le impedenze si sommano, Z = R + j(ωL − 1/(ωC)); il modulo |Z| fissa l'ampiezza della corrente e l'argomento φ = arctan[(ωL − 1/(ωC))/R] lo sfasamento fra tensione e corrente. Nella sezione i fasori ruotano alla pulsazione ω e le grandezze fisiche sono le loro proiezioni sull'asse reale." },
      { titolo: "Risonanza e fattore di merito", testo: "Alla frequenza f₀ = 1/(2π√(LC)) le reattanze dell'induttore e del condensatore si annullano a vicenda: l'impedenza è puramente resistiva, minima e uguale a R, e la corrente è massima e in fase con la tensione. La finezza della risonanza si misura con il fattore di merito Q = ω₀L/R = 1/(2ζ). La banda passante, cioè l'intervallo fra le due frequenze in cui la potenza dissipata scende a metà del massimo, vale Δf = f₀/Q. A risonanza le tensioni ai capi di L e di C possono essere Q volte più grandi di quella del generatore, pur restando opposte in fase." },
      { titolo: "Filtri e diagramma di Bode", testo: "Un partitore fatto con un resistore e un condensatore lascia passare in modo diverso le diverse frequenze. Prelevando l'uscita sul condensatore si ha il passa-basso, H(ω) = 1/(1 + jωRC); prelevandola sul resistore il passa-alto, H(ω) = jωRC/(1 + jωRC). Alla frequenza di taglio f_c = 1/(2πRC) il modulo vale 1/√2, cioè −3 dB, e la fase ±45°; lontano dal taglio la pendenza è di 20 dB per decade. Il diagramma di Bode riporta 20 log₁₀|H| e la fase contro log f, e trasforma questi andamenti in rette. Un RLC con l'uscita sul resistore è un passa-banda centrato su f₀ con larghezza f₀/Q." }
    ],
    formule: [
      ["τ = RC,  τ = L/R", "costanti di tempo dei circuiti RC e RL (s); R in ohm, C in farad, L in henry"],
      ["ζ = (R/2)√(C/L),  ω₀ = 1/√(LC),  ω_d = ω₀√(1 − ζ²)", "rapporto di smorzamento, pulsazione propria e pulsazione delle oscillazioni smorzate del circuito RLC serie"],
      ["Z = R + j(ωL − 1/(ωC))", "impedenza complessa del circuito RLC serie alla pulsazione ω (Ω)"],
      ["f₀ = 1/(2π√(LC)),  Q = ω₀L/R,  Δf = f₀/Q", "frequenza di risonanza, fattore di merito e banda a metà potenza"],
      ["H(ω) = 1/(1 + jωRC),  f_c = 1/(2πRC)", "funzione di trasferimento del passa-basso RC e frequenza di taglio a −3 dB"]
    ],
    ipotesi: [
      "Approssimazione a parametri concentrati: le dimensioni del circuito sono molto minori della lunghezza d'onda dei segnali, per cui si trascura la propagazione.",
      "Componenti ideali e lineari: R, L, C costanti, nessuna resistenza parassita nell'induttore, nessuna perdita nel dielettrico, generatore ideale.",
      "Il metodo dei fasori descrive solo il regime sinusoidale permanente: il transitorio di accensione va studiato a parte."
    ],
    errori: [
      "Sommare le ampiezze delle tensioni su R, L e C come numeri reali: vanno sommate come fasori, tenendo conto delle fasi.",
      "Credere che la tensione su un condensatore possa saltare istantaneamente all'accensione: salta la corrente, non la tensione.",
      "Pensare che a −3 dB l'ampiezza sia dimezzata: è ridotta a 1/√2 ≈ 0,707, ed è la potenza a dimezzarsi.",
      "Ritenere che lo smorzamento critico sia il regime più lento: è il più rapido fra quelli che non superano il valore finale."
    ],
    esempio: {
      testo: "Un RLC serie ha R = 10 Ω, L = 10 mH, C = 1,0 μF. La pulsazione propria è ω₀ = 1/√(LC) = 1/√(10⁻⁸ s²) = 1,0·10⁴ rad/s, quindi f₀ = ω₀/2π = 1592 Hz. Il fattore di merito è Q = ω₀L/R = 10⁴·0,010/10 = 10 e la banda Δf = f₀/Q = 159 Hz. Il rapporto di smorzamento è ζ = (R/2)√(C/L) = 5·√(10⁻⁴) = 0,05, coerente con Q = 1/(2ζ): la risposta al gradino è sottosmorzata e oscilla a ω_d = 10⁴·√(1 − 0,0025) ≈ 9987 rad/s.",
      risultato: "f₀ ≈ 1,59 kHz, Q = 10, Δf ≈ 159 Hz, ζ = 0,05 (sottosmorzato)"
    },
    fonti: [
      "P. Mazzoldi, M. Nigro, C. Voci, Fisica, vol. II: Elettromagnetismo e Onde, EdiSES, capitoli sui circuiti in corrente continua, sui transitori e sulle correnti alternate",
      "D. Halliday, R. Resnick, K. S. Krane, Fisica 2, Casa Editrice Ambrosiana, 5ª ed., capitoli sui circuiti RC, sull'induttanza e sui circuiti in corrente alternata",
      "P. Horowitz, W. Hill, The Art of Electronics, Cambridge University Press, 3ª ed., cap. 1 (fondamenti: RC, impedenza, filtri)",
      "C. K. Alexander, M. N. O. Sadiku, Fundamentals of Electric Circuits, McGraw-Hill, capitoli su circuiti del primo e del secondo ordine e risposta in frequenza"
    ],
    collegamenti: ['sfisem', 'sfiselettronica', 'smatode', 'smatcompl']
  };

  /* ═══ 🔥 Termodinamica in movimento ═══════════════════════════════════════ */
  T['sfistermo'] = {
    titolo: "Cicli termodinamici, teoria cinetica e moto browniano",
    sintesi: "La termodinamica collega calore, lavoro ed energia interna con il primo principio e stabilisce con il secondo un limite al rendimento di ogni macchina. La teoria cinetica spiega le stesse grandezze con il moto delle molecole: la temperatura misura la loro energia cinetica media, la pressione nasce dagli urti sulle pareti, e il moto browniano rende visibile l'agitazione termica.",
    paragrafi: [
      { titolo: "Primo principio e trasformazioni del gas ideale", testo: "Per un sistema chiuso il primo principio si scrive ΔU = Q − L, con Q il calore assorbito e L il lavoro compiuto dal gas. Per n moli di gas ideale pV = nRT e l'energia interna dipende solo dalla temperatura, U = n c_V T, con c_V = 3R/2 per un gas monoatomico e 5R/2 per uno biatomico a temperatura ambiente. Nel piano p-V il lavoro di una trasformazione è l'area sotto la curva e quello di un ciclo l'area racchiusa; nel piano T-S è l'area a rappresentare il calore scambiato. In un'isoterma L = nRT ln(V₂/V₁) e ΔU = 0; in un'adiabatica reversibile vale pV^γ = costante, con γ = c_p/c_V." },
      { titolo: "Rendimento dei cicli", testo: "Il rendimento di un motore è η = L/Q_ass. Il ciclo di Carnot, due isoterme e due adiabatiche reversibili, raggiunge η = 1 − T_f/T_c, il massimo consentito dal secondo principio fra due serbatoi a quelle temperature. Il ciclo Otto, modello del motore a benzina con due adiabatiche e due isocore, ha η = 1 − r^(1−γ), con r rapporto di compressione. Nel ciclo Diesel il calore entra a pressione costante e il rendimento dipende anche dal rapporto di combustione r_c, η = 1 − r^(1−γ)(r_c^γ − 1)/[γ(r_c − 1)], inferiore a quello di un Otto con lo stesso r. Il ciclo Stirling, due isoterme e due isocore, raggiunge il rendimento di Carnot solo se un rigeneratore ideale restituisce internamente il calore delle isocore." },
      { titolo: "Teoria cinetica e distribuzione di Maxwell-Boltzmann", testo: "Nella sezione dischi rigidi si urtano elasticamente in una scatola. Qualunque sia la distribuzione iniziale delle velocità, gli urti ridistribuiscono l'energia e l'istogramma tende alla distribuzione di Maxwell-Boltzmann, che in due dimensioni è f(v) = (mv/kT) e^(−mv²/2kT), con velocità più probabile √(kT/m). L'equipartizione assegna ½kT a ogni grado di libertà traslazionale, quindi in 2D l'energia cinetica media per particella è kT. La pressione, che in due dimensioni è una forza per unità di lunghezza del bordo, si ottiene dalla quantità di moto trasferita alle pareti e soddisfa pA = NkT, la legge dei gas ideali per dischi che occupano una frazione piccola dell'area A." },
      { titolo: "Moto browniano e legge di Einstein", testo: "Una particella sospesa in un fluido riceve continuamente urti disordinati dalle molecole e compie un cammino casuale. Lo spostamento medio è nullo, ma lo spostamento quadratico medio cresce linearmente nel tempo: ⟨r²⟩ = 2dDt in d dimensioni, cioè 4Dt nel piano. Einstein nel 1905 legò il coefficiente di diffusione alla temperatura e all'attrito, D = kT/(6πηa) per una sfera di raggio a in un fluido di viscosità η; le misure di Perrin su questa relazione fornirono una delle prime determinazioni del numero di Avogadro e una prova decisiva dell'esistenza degli atomi." },
      { titolo: "La superficie p-V-T e il gas di van der Waals", testo: "L'equazione di stato pV = nRT è una superficie nello spazio p-V-T, e ogni trasformazione all'equilibrio è una curva su di essa. Il modello di van der Waals, (p + an²/V²)(V − nb) = nRT, aggiunge l'attrazione fra le molecole (a) e il loro volume proprio (b). Sotto la temperatura critica T_c = 8a/(27Rb) le isoterme presentano un tratto instabile che va sostituito con un segmento orizzontale tracciato con la costruzione delle aree uguali di Maxwell: è la regione di coesistenza liquido-vapore, la cupola che si chiude nel punto critico con p_c = a/(27b²) e V_c = 3nb. È un modello qualitativo, non quantitativo, del comportamento reale." }
    ],
    formule: [
      ["ΔU = Q − L,  U = n c_V T", "primo principio (Q calore assorbito, L lavoro compiuto dal gas, in J) ed energia interna del gas ideale"],
      ["η_Carnot = 1 − T_f/T_c,  η_Otto = 1 − r^(1−γ)", "rendimenti dei cicli di Carnot (temperature in kelvin) e Otto (r = V_max/V_min, γ = c_p/c_V)"],
      ["η_Diesel = 1 − r^(1−γ) (r_c^γ − 1)/[γ(r_c − 1)]", "rendimento del ciclo Diesel con rapporto di compressione r e di combustione r_c"],
      ["f(v) = (mv/kT) e^(−mv²/2kT)", "distribuzione delle velocità di Maxwell-Boltzmann in due dimensioni; k = 1,380649·10⁻²³ J/K"],
      ["⟨r²⟩ = 4Dt,  D = kT/(6πηa)", "legge di Einstein del moto browniano nel piano e relazione di Stokes-Einstein"],
      ["(p + an²/V²)(V − nb) = nRT", "equazione di stato di van der Waals; T_c = 8a/(27Rb)"]
    ],
    ipotesi: [
      "Cicli ideali: trasformazioni reversibili (quasi statiche, senza attrito), una mole di gas ideale con c_V costante.",
      "Il gas di dischi è ideale solo se l'area occupata è piccola; a densità alta la pressione supera NkT/A.",
      "La legge ⟨r²⟩ ∝ t vale per tempi molto più lunghi del tempo di rilassamento della velocità; a tempi brevissimi il moto è balistico.",
      "Van der Waals è un modello di campo medio: il punto critico è qualitativo (prevede pV/(nRT) = 0,375 al punto critico, mentre i fluidi reali danno circa 0,29)."
    ],
    errori: [
      "Usare le temperature in gradi Celsius nella formula di Carnot.",
      "Credere che il rendimento di Carnot sia raggiungibile da un motore reale: è un limite superiore per macchine reversibili.",
      "Confondere velocità media, quadratica media e più probabile, che nella distribuzione di Maxwell sono diverse.",
      "Pensare che lo spostamento di una particella browniana cresca linearmente nel tempo: cresce come √t."
    ],
    esempio: {
      testo: "Un ciclo Otto con aria (γ = 1,4) ha rapporto di compressione r = 8 e aspira a T₁ = 300 K. Alla fine della compressione adiabatica T₂ = T₁ r^(γ−1) = 300·8^0,4 = 689 K. Il rendimento è η = 1 − 8^(−0,4) = 1 − 0,435 = 0,565. Un ciclo di Carnot fra 300 K e la stessa T₂ avrebbe 1 − 300/689 = 0,565: coincidono perché nel ciclo Otto ogni adiabatica scala le temperature dello stesso fattore, ma il ciclo Otto raggiunge temperature massime più alte di T₂, e un Carnot fra 300 K e quella temperatura massima avrebbe rendimento maggiore.",
      risultato: "η_Otto ≈ 56,5 %, T₂ ≈ 689 K"
    },
    fonti: [
      "P. Mazzoldi, M. Nigro, C. Voci, Fisica, vol. I: Meccanica e Termodinamica, EdiSES, capitoli sul primo e secondo principio e sulla teoria cinetica dei gas",
      "H. B. Callen, Thermodynamics and an Introduction to Thermostatistics, Wiley, 2ª ed., cap. 4 (processi reversibili e macchine) e cap. 3 (equazione di van der Waals)",
      "K. Huang, Statistical Mechanics, Wiley, 2ª ed., capitoli sullo stato di equilibrio di un gas diluito (distribuzione di Maxwell-Boltzmann) e sulle transizioni di fase (equazione di van der Waals)",
      "A. Einstein, Über die von der molekularkinetischen Theorie der Wärme geforderte Bewegung von in ruhenden Flüssigkeiten suspendierten Teilchen, Annalen der Physik 17 (1905) 549"
    ],
    collegamenti: ['stermostat', 'sdinmol', 'sfiscalore', 'sthermoadv', 'sfisstat']
  };

  /* ═══ ⏱️ Relatività ristretta ═════════════════════════════════════════════ */
  T['sfisrel'] = {
    titolo: "Relatività ristretta: spazio-tempo, tempo proprio e dinamica",
    sintesi: "La relatività ristretta nasce da due postulati: le leggi fisiche sono le stesse in tutti i riferimenti inerziali e la velocità della luce nel vuoto è la stessa per tutti. Ne seguono le trasformazioni di Lorentz, la relatività della simultaneità, la dilatazione dei tempi e la contrazione delle lunghezze. Ciò che resta uguale per tutti è l'intervallo spazio-temporale, e la dinamica si riscrive con energia e quantità di moto relativistiche.",
    paragrafi: [
      { titolo: "Trasformazioni di Lorentz e diagramma di Minkowski", testo: "Se un osservatore si muove con velocità v = βc lungo x, le coordinate di un evento si trasformano come x' = γ(x − βct), ct' = γ(ct − βx), con γ = 1/√(1 − β²). Nel diagramma di Minkowski, con ct in verticale e x in orizzontale, la luce percorre le diagonali a 45°. Gli assi dell'osservatore in moto sono inclinati: l'asse ct' (la sua linea di universo, x = βct) e l'asse x' (gli eventi che per lui sono simultanei, ct = βx) si chiudono simmetricamente verso la diagonale quando β cresce. Due eventi sulla stessa orizzontale sono simultanei per il primo osservatore ma non per il secondo: la simultaneità dipende dal riferimento." },
      { titolo: "L'intervallo invariante e la causalità", testo: "La quantità s² = (cΔt)² − Δx² ha lo stesso valore in tutti i riferimenti inerziali, come la lunghezza di un vettore non cambia ruotando gli assi. Se s² > 0 l'intervallo è di tipo tempo: esiste un riferimento in cui i due eventi accadono nello stesso luogo, il loro ordine temporale è lo stesso per tutti e uno può influenzare l'altro. Se s² < 0 è di tipo spazio: nessun segnale può collegarli e il loro ordine dipende dall'osservatore. Il cono di luce separa queste due regioni; per un orologio che si muove fra due eventi di tipo tempo, il tempo proprio vale Δτ = s/c." },
      { titolo: "Dilatazione dei tempi e paradosso dei gemelli", testo: "Un orologio in moto con velocità v segna, fra due eventi, un tempo proprio Δτ = Δt/γ più breve del tempo Δt misurato nel riferimento in cui si muove. Il gemello che viaggia fino a una stella e torna invecchia meno di quello rimasto a casa. Non c'è simmetria fra i due perché il viaggiatore cambia riferimento inerziale all'inversione: nel diagramma la sua linea di universo è spezzata e il suo asse di simultaneità ruota bruscamente. La sezione lo mostra con i segnali luminosi annuali: ciascuno vede quelli dell'altro con il fattore Doppler √((1 − β)/(1 + β)) in allontanamento e il suo inverso in avvicinamento, ma il viaggiatore passa da un regime all'altro a metà del suo viaggio, il gemello a terra solo quando la luce dell'inversione lo raggiunge." },
      { titolo: "Energia e quantità di moto relativistiche", testo: "Per conservare la quantità di moto in tutti i riferimenti occorre definirla come p = γmv, e l'energia totale di una particella libera diventa E = γmc², con energia di riposo mc² ed energia cinetica K = (γ − 1)mc². Le due grandezze formano un quadrivettore, e la relazione E² = (pc)² + (mc²)² è invariante. Per v ≪ c, K si riduce a ½mv² più correzioni dell'ordine di v⁴/c². Le velocità non si sommano più linearmente: u = (u' + v)/(1 + u'v/c²), che non supera mai c. L'effetto Doppler relativistico longitudinale vale f_oss = f_em √((1 + β)/(1 − β)) per una sorgente in avvicinamento e contiene, oltre all'effetto classico, la dilatazione dei tempi." }
    ],
    formule: [
      ["x' = γ(x − βct),  ct' = γ(ct − βx),  γ = 1/√(1 − β²)", "trasformazioni di Lorentz lungo x; β = v/c, c = 299 792 458 m/s (esatta)"],
      ["s² = (cΔt)² − Δx² − Δy² − Δz²", "intervallo invariante fra due eventi; s² > 0 di tipo tempo, < 0 di tipo spazio"],
      ["Δτ = Δt/γ,  L = L₀/γ", "dilatazione dei tempi (tempo proprio) e contrazione delle lunghezze lungo il moto"],
      ["p = γmv,  E = γmc²,  E² = (pc)² + (mc²)²", "quantità di moto ed energia relativistiche di una particella di massa m"],
      ["u = (u' + v)/(1 + u'v/c²)", "composizione di velocità parallele"],
      ["f_oss = f_em √((1 + β)/(1 − β))", "effetto Doppler relativistico longitudinale per sorgente in avvicinamento (β → −β in allontanamento)"]
    ],
    ipotesi: [
      "Riferimenti inerziali e spazio-tempo piatto: la gravità è trascurata (altrimenti serve la relatività generale).",
      "Nel paradosso dei gemelli si assume un'inversione istantanea; un'accelerazione di durata finita non cambia il risultato se è breve rispetto al viaggio.",
      "Le formule del Doppler riportate valgono per moto lungo la congiungente; in direzione trasversale resta solo il fattore γ."
    ],
    errori: [
      "Pensare che la dilatazione dei tempi sia un difetto degli orologi: riguarda il tempo stesso e vale per ogni processo, anche biologico o nucleare.",
      "Spiegare il paradosso dei gemelli con l'accelerazione come causa diretta: conta che il viaggiatore cambi riferimento inerziale, cioè la geometria della sua linea di universo.",
      "Usare p = mv o K = ½mv² a velocità prossime a c, o sommare le velocità linearmente.",
      "Parlare di massa che cresce con la velocità: nella fisica moderna m è invariante, e il fattore γ appartiene a energia e quantità di moto."
    ],
    esempio: {
      testo: "Un gemello viaggia a β = 0,8 verso una stella a 4 anni luce e torna. Allora γ = 1/√(1 − 0,64) = 5/3. Per chi resta il viaggio dura 2·4/0,8 = 10 anni; il viaggiatore misura 10/γ = 6 anni. Il fattore Doppler in allontanamento è √(0,2/1,8) = 1/3. Il viaggiatore, in 3 anni di andata, riceve i segnali annuali da Terra a un ritmo di 1/3 l'anno (1 segnale), e in 3 anni di ritorno a ritmo 3 l'anno (9 segnali): 10 in tutto. Il gemello a terra vede l'inversione dopo 5 + 4 = 9 anni, riceve in quel tempo 9/3 = 3 segnali e nell'ultimo anno 3 segnali: 6, quanti sono gli anni del viaggiatore.",
      risultato: "10 anni a terra contro 6 anni per il viaggiatore"
    },
    fonti: [
      "E. F. Taylor, J. A. Wheeler, Spacetime Physics, W. H. Freeman, 2ª ed. 1992, capitoli su intervallo invariante, diagrammi spazio-temporali e paradosso dei gemelli",
      "D. J. Griffiths, Introduction to Electrodynamics, Cambridge University Press, 4ª ed., cap. 12 (elettrodinamica e relatività)",
      "A. Einstein, Zur Elektrodynamik bewegter Körper, Annalen der Physik 17 (1905) 891",
      "P. Mazzoldi, M. Nigro, C. Voci, Fisica, vol. I, EdiSES, capitolo sulla relatività ristretta"
    ],
    collegamenti: ['sfispart', 'sfisem', 'sfisgrav', 'sastrocosmo']
  };

  /* ═══ 🌊 Fluidi ═══════════════════════════════════════════════════════════ */
  T['sfisfluidi'] = {
    titolo: "Fluidi in moto: Bernoulli, viscosità, capillarità e flusso potenziale",
    sintesi: "Un fluido in moto obbedisce alla conservazione della massa e al bilancio della quantità di moto. Per un fluido ideale, incomprimibile e stazionario, questi principi diventano l'equazione di continuità e il teorema di Bernoulli; la viscosità introduce l'attrito interno che determina il profilo di Poiseuille e la resistenza di Stokes; alle interfacce la tensione superficiale produce la risalita capillare e la sovrapressione di Laplace.",
    paragrafi: [
      { titolo: "Continuità e teorema di Bernoulli", testo: "In un tubo percorso da un fluido incomprimibile in regime stazionario la portata volumetrica Q = Av è la stessa in ogni sezione: dove il tubo si stringe il fluido accelera. Lungo una linea di corrente di un fluido non viscoso vale il teorema di Bernoulli, p + ½ρv² + ρgh = costante, che è il teorema dell'energia cinetica per unità di volume. Nella strozzatura di un tubo di Venturi la velocità cresce e la pressione diminuisce: i manometri scendono. Misurando la differenza di pressione Δp fra la sezione larga A₁ e quella stretta A₂ si ricava la portata, Q = A₁A₂√(2Δp/[ρ(A₁² − A₂²)]); è il principio dei misuratori di portata industriali e medici." },
      { titolo: "Viscosità e legge di Poiseuille", testo: "In un fluido reale strati adiacenti che scorrono a velocità diverse si scambiano quantità di moto: lo sforzo di taglio vale η dv/dy, con η viscosità dinamica in Pa·s. In un tubo cilindrico di raggio R e lunghezza L, in regime laminare, il profilo di velocità è parabolico, v(r) = Δp(R² − r²)/(4ηL), nullo alla parete e massimo sull'asse. Integrandolo si ottiene la legge di Hagen-Poiseuille, Q = πR⁴Δp/(8ηL): la portata dipende dalla quarta potenza del raggio, per cui dimezzare il raggio riduce la portata di sedici volte a parità di Δp. È la ragione per cui un piccolo restringimento di un'arteria ha effetti così grandi sulla circolazione." },
      { titolo: "Numero di Reynolds e sedimentazione di Stokes", testo: "Il numero di Reynolds Re = ρvD/η confronta le forze d'inerzia con quelle viscose. In un tubo il moto è laminare fino a Re ≈ 2000 e diventa turbolento oltre qualche migliaio; la legge di Poiseuille vale solo nel primo caso. Una sfera di raggio r che si muove lentamente (Re ≪ 1) subisce la forza di Stokes 6πηrv; eguagliandola al peso meno la spinta di Archimede si ottiene la velocità di sedimentazione v = 2r²(ρ_p − ρ_f)g/(9η). In una centrifuga g è sostituita dall'accelerazione centripeta ω²r, e il rapporto ω²r/g è la forza centrifuga relativa (RCF), che rende misurabile la sedimentazione di cellule, organelli e macromolecole." },
      { titolo: "Tensione superficiale e capillarità", testo: "Le molecole sulla superficie di un liquido hanno meno vicini di quelle interne, e la superficie si comporta come una membrana tesa con tensione γ (N/m, cioè energia per unità di area). Una superficie curva separa due regioni a pressione diversa: per una goccia sferica la sovrapressione interna è Δp = 2γ/r (legge di Laplace), per una bolla di sapone, che ha due superfici, 4γ/r. In un capillare di raggio r il liquido sale o scende fino all'altezza h = 2γ cos θ/(ρgr) (legge di Jurin), dove θ è l'angolo di contatto: l'acqua sul vetro bagna (θ ≈ 0) e risale, il mercurio non bagna (θ ≈ 140°) e si abbassa." },
      { titolo: "Flusso potenziale attorno a un ostacolo", testo: "Se il fluido è ideale e il moto irrotazionale, la velocità è il gradiente di un potenziale che soddisfa l'equazione di Laplace. Attorno a una sfera investita da una corrente uniforme U la velocità si annulla nei due punti di ristagno e raggiunge 1,5U all'equatore; attorno a un cilindro raggiunge 2U. La pressione si ricava da Bernoulli. In questo modello la forza totale nella direzione della corrente è nulla (paradosso di d'Alembert), perché manca la viscosità che nella realtà genera lo strato limite e la scia. Se attorno al cilindro si aggiunge una circolazione Γ, la simmetria si rompe e nasce una forza perpendicolare alla corrente, la portanza di Kutta-Žukovskij, pari a ρUΓ per unità di lunghezza, che è alla base della teoria dell'ala." }
    ],
    formule: [
      ["A₁v₁ = A₂v₂", "equazione di continuità per un fluido incomprimibile (A in m², v in m/s)"],
      ["p + ½ρv² + ρgh = costante", "teorema di Bernoulli lungo una linea di corrente di un fluido ideale stazionario"],
      ["Q = πR⁴Δp/(8ηL)", "legge di Hagen-Poiseuille: portata (m³/s) in un tubo di raggio R e lunghezza L, viscosità η in Pa·s"],
      ["Re = ρvD/η", "numero di Reynolds, adimensionale, con D diametro del tubo"],
      ["v = 2r²(ρ_p − ρ_f)g/(9η)", "velocità limite di sedimentazione di Stokes di una sfera di raggio r"],
      ["h = 2γ cos θ/(ρgr),  Δp = 2γ/r", "legge di Jurin e sovrapressione di Laplace in una goccia; γ tensione superficiale in N/m"],
      ["F/ℓ = ρUΓ", "portanza di Kutta-Žukovskij per unità di lunghezza di un corpo con circolazione Γ"]
    ],
    ipotesi: [
      "Bernoulli: fluido non viscoso, incomprimibile, moto stazionario, lungo una linea di corrente (o ovunque se il moto è irrotazionale).",
      "Poiseuille: moto laminare e completamente sviluppato in un tubo rigido, fluido newtoniano; il sangue, per esempio, non lo è del tutto.",
      "Stokes: Re ≪ 1 e sfera lontana da pareti e da altre particelle.",
      "Flusso potenziale: modello ideale, valido fuori dallo strato limite e prima della separazione della scia."
    ],
    errori: [
      "Pensare che dove il fluido è più veloce la pressione sia più alta: in un tubo orizzontale vale il contrario.",
      "Applicare Bernoulli fra due punti di un tubo lungo con fluido viscoso ignorando la caduta di pressione dovuta all'attrito.",
      "Credere che la portata in un tubo sia proporzionale all'area della sezione: in regime laminare dipende da R⁴.",
      "Usare la formula di Stokes per corpi grandi e veloci, come un sasso che cade nell'aria, dove la resistenza è quadratica."
    ],
    esempio: {
      testo: "In un Venturi orizzontale scorre acqua (ρ = 1000 kg/m³); la sezione stretta ha area un quarto di quella larga e nella sezione larga v₁ = 0,50 m/s. Per la continuità v₂ = 4v₁ = 2,0 m/s. Per Bernoulli Δp = ½ρ(v₂² − v₁²) = 500·(4,00 − 0,25) = 1875 Pa. Un manometro ad acqua segna un dislivello h = Δp/(ρg) = 1875/(1000·9,81) = 0,191 m. Se il diametro largo è 4,0 cm, A₁ = 1,257·10⁻³ m² e la portata è Q = A₁v₁ = 6,3·10⁻⁴ m³/s.",
      risultato: "Δp ≈ 1,9 kPa, dislivello ≈ 19 cm, Q ≈ 0,63 L/s"
    },
    fonti: [
      "P. Mazzoldi, M. Nigro, C. Voci, Fisica, vol. I: Meccanica e Termodinamica, EdiSES, capitolo sulla meccanica dei fluidi",
      "L. D. Landau, E. M. Lifshitz, Fluid Mechanics (Course of Theoretical Physics, vol. 6), Pergamon, 2ª ed., §10 (flusso potenziale), §17 (Poiseuille), §20 (formula di Stokes)",
      "G. K. Batchelor, An Introduction to Fluid Dynamics, Cambridge University Press, capitoli sul flusso irrotazionale e sui fluidi viscosi",
      "P.-G. de Gennes, F. Brochard-Wyart, D. Quéré, Capillarity and Wetting Phenomena, Springer, 2004, cap. 1 (legge di Laplace, risalita capillare)"
    ],
    collegamenti: ['sfismecc', 'sfiscalore', 'smatedp', 'smatvett']
  };

  /* ═══ ⚡ Elettromagnetismo in movimento ═══════════════════════════════════ */
  T['sfisem'] = {
    titolo: "Campi elettrici e magnetici, induzione e onde elettromagnetiche",
    sintesi: "Le cariche producono campi elettrici, le correnti campi magnetici, e i campi agiscono sulle cariche con la forza di Lorentz. Un flusso magnetico che varia induce una forza elettromotrice (Faraday), con verso tale da opporsi alla variazione (Lenz): è il principio del generatore. Le equazioni di Maxwell prevedono infine campi che si sostengono a vicenda e si propagano nel vuoto alla velocità della luce.",
    paragrafi: [
      { titolo: "Campo e potenziale di cariche puntiformi", testo: "Una carica q crea a distanza r il campo E = kq/r² diretto radialmente e il potenziale V = kq/r, con k = 1/(4πε₀) ≈ 8,988·10⁹ N·m²/C². Per più cariche campi e potenziali si sommano (principio di sovrapposizione), il potenziale come scalare e il campo come vettore. Il campo è il gradiente del potenziale cambiato di segno, E = −∇V, quindi le linee di campo sono sempre perpendicolari alle superfici equipotenziali e vanno dai potenziali alti a quelli bassi. Una carica di prova positiva lasciata libera accelera lungo le linee di campo, ma non le percorre esattamente: la sua inerzia la porta a curvare meno." },
      { titolo: "Induzione elettromagnetica e legge di Lenz", testo: "Il flusso magnetico attraverso una spira è Φ = ∫B·dA. Quando cambia, per moto della calamita, della spira o per variazione della corrente che genera B, nella spira compare la forza elettromotrice ε = −dΦ/dt (legge di Faraday-Neumann). Il segno meno esprime la legge di Lenz: la corrente indotta produce un campo che si oppone alla variazione del flusso. Nella sezione il flusso del dipolo si calcola integrando il suo campo sul disco della spira: quando la calamita si avvicina il flusso cresce e la f.e.m. ha un segno, quando si allontana la f.e.m. si inverte; al passaggio per il centro il flusso è massimo e la f.e.m. si annulla." },
      { titolo: "Il generatore in corrente alternata", testo: "Una bobina di N spire di area A che ruota con velocità angolare ω in un campo uniforme B vede il flusso Φ = NBA cos ωt e genera ε = NBAω sin ωt. L'ampiezza cresce con il campo, l'area, il numero di spire e la velocità di rotazione. Su una resistenza R la potenza istantanea è ε²/R e la sua media su un periodo vale ε₀²/(2R): per questo si usa il valore efficace ε_eff = ε₀/√2, che dà con le formule della corrente continua la stessa potenza media. La corrente nella bobina subisce a sua volta una forza che frena la rotazione: l'energia elettrica viene dal lavoro meccanico necessario per mantenerla." },
      { titolo: "Onde elettromagnetiche e polarizzazione", testo: "Nel vuoto le equazioni di Maxwell ammettono onde piane in cui E e B sono perpendicolari fra loro e alla direzione di propagazione, oscillano in fase e hanno ampiezze legate da E = cB, con c = 1/√(μ₀ε₀) = 299 792 458 m/s. La polarizzazione descrive come si muove la punta di E: se le due componenti trasversali sono in fase la polarizzazione è lineare; se sono sfasate di 90° con ampiezze uguali, la punta descrive un cerchio (polarizzazione circolare, destra o sinistra secondo il segno dello sfasamento); in tutti gli altri casi un'ellisse. L'energia è trasportata nel verso del vettore di Poynting S = E×B/μ₀." },
      { titolo: "Cariche in campi tridimensionali e forza di Lorentz", testo: "Le linee di B di una spira e di un solenoide si ottengono dalla legge di Biot-Savart, dB = (μ₀/4π) I dl×r̂/r². Su una carica agisce F = q(E + v×B). In un campo B uniforme la carica descrive un'elica con pulsazione di ciclotrone ω_c = |q|B/m e raggio r = mv⊥/(|q|B). Se si aggiunge un campo E perpendicolare, il centro dell'orbita deriva con velocità v_d = E×B/B², uguale per cariche di segno e massa diversi. In un campo che si intensifica verso le estremità, come nella bottiglia magnetica, il momento magnetico μ = mv⊥²/(2B) si conserva approssimativamente e le particelle con angolo di passo sufficiente vengono riflesse. La sezione integra il moto con il metodo di Boris, che in un campo puramente magnetico conserva esattamente il modulo della velocità." }
    ],
    formule: [
      ["E = −∇V,  V = Σ kqᵢ/rᵢ", "campo e potenziale di cariche puntiformi; k = 1/(4πε₀) = 8,988·10⁹ N·m²/C²"],
      ["ε = −dΦ/dt,  Φ = ∫ B·dA", "legge di Faraday-Neumann-Lenz; Φ in weber (T·m²), ε in volt"],
      ["ε(t) = NBAω sin ωt,  ε_eff = ε₀/√2", "f.e.m. di una bobina rotante di N spire e area A e suo valore efficace"],
      ["E = cB,  c = 1/√(μ₀ε₀)", "rapporto fra le ampiezze dei campi in un'onda piana nel vuoto"],
      ["F = q(E + v×B)", "forza di Lorentz su una carica q con velocità v"],
      ["ω_c = |q|B/m,  v_d = E×B/B²", "pulsazione di ciclotrone e velocità di deriva E×B"]
    ],
    ipotesi: [
      "Elettrostatica e magnetostatica valgono per cariche ferme e correnti stazionarie; nella spira dell'induzione si assume il regime quasi stazionario (circuito piccolo rispetto alla lunghezza d'onda).",
      "La calamita è trattata come un dipolo puntiforme, buona approssimazione a distanze grandi rispetto alle sue dimensioni.",
      "Le traiettorie sono non relativistiche e trascurano la radiazione emessa dalla carica accelerata.",
      "Le onde sono piane, monocromatiche e nel vuoto."
    ],
    errori: [
      "Credere che conti il flusso e non la sua variazione: una calamita ferma dentro una spira non induce nulla.",
      "Pensare che le linee di campo siano traiettorie delle cariche: lo sono solo se la carica parte da ferma e la sua inerzia è trascurabile.",
      "Confondere valore massimo ed efficace: 230 V di rete sono un valore efficace, il picco è circa 325 V.",
      "Ritenere che il campo magnetico possa cambiare l'energia cinetica di una carica: v×B è sempre perpendicolare alla velocità e non compie lavoro."
    ],
    esempio: {
      testo: "Una bobina di N = 100 spire quadrate di lato 10 cm (A = 0,010 m²) ruota a 50 giri al secondo in un campo B = 0,20 T. Allora ω = 2π·50 = 314,2 rad/s e l'ampiezza della f.e.m. è ε₀ = NBAω = 100·0,20·0,010·314,2 = 62,8 V. Il valore efficace è 62,8/√2 = 44,4 V. Collegata a una resistenza di 100 Ω (trascurando la resistenza e l'induttanza della bobina) dissipa in media ε₀²/(2R) = 62,8²/200 = 19,7 W.",
      risultato: "ε₀ ≈ 62,8 V, ε_eff ≈ 44,4 V, P ≈ 19,7 W"
    },
    fonti: [
      "D. J. Griffiths, Introduction to Electrodynamics, Cambridge University Press, 4ª ed., cap. 2 (elettrostatica), cap. 5 (magnetostatica), cap. 7 (induzione), cap. 9 (onde elettromagnetiche)",
      "P. Mazzoldi, M. Nigro, C. Voci, Fisica, vol. II: Elettromagnetismo e Onde, EdiSES, capitoli su campo elettrico, induzione e onde elettromagnetiche",
      "J. D. Jackson, Classical Electrodynamics, Wiley, 3ª ed., cap. 12 (moto in campi uniformi, deriva E×B, invarianti adiabatici e specchi magnetici)",
      "C. K. Birdsall, A. B. Langdon, Plasma Physics via Computer Simulation, McGraw-Hill, 1985, capitolo sull'integrazione del moto delle particelle (metodo di Boris)"
    ],
    collegamenti: ['sfiscirc', 'sfisonde', 'sfisrel', 'sfislaser']
  };

  /* ═══ 🔊 Suono e acustica ═════════════════════════════════════════════════ */
  T['sfissuono'] = {
    titolo: "Il suono: armoniche, timbro, effetto Doppler e decibel",
    sintesi: "Il suono è un'onda longitudinale di pressione che nei gas viaggia a una velocità fissata dalla temperatura, circa 343 m/s nell'aria a 20 °C. Negli strumenti le condizioni al contorno selezionano frequenze discrete, le armoniche, la cui miscela determina il timbro. Il moto della sorgente o dell'ascoltatore sposta la frequenza percepita (Doppler), e l'intensità si misura su scala logaritmica in decibel.",
    paragrafi: [
      { titolo: "Onde sonore e velocità del suono", testo: "Un'onda sonora è una successione di compressioni e rarefazioni del mezzo che si propagano nella direzione dello spostamento delle particelle: è un'onda longitudinale. In un gas ideale la velocità vale v = √(γRT/M), con γ = c_p/c_V e M massa molare: nell'aria secca è 331 m/s a 0 °C e circa 343 m/s a 20 °C, e non dipende dalla pressione. Lungo una corda tesa le onde sono trasversali e viaggiano con v = √(T/μ), con T la tensione e μ la massa per unità di lunghezza. Frequenza e lunghezza d'onda sono legate da v = λf." },
      { titolo: "Modi propri: corde e canne", testo: "Una corda fissa agli estremi può vibrare stabilmente solo se contiene un numero intero di mezze lunghezze d'onda: f_n = n v/(2L), con n = 1, 2, 3… e tutte le armoniche presenti. Una canna aperta alle due estremità ha ventri di spostamento (nodi di pressione) a entrambi i capi e la stessa serie. Una canna chiusa a un'estremità ha un nodo di spostamento sul fondo chiuso e un ventre all'estremità aperta: la sua lunghezza deve contenere un numero dispari di quarti d'onda, f = (2n − 1)v/(4L), e le armoniche pari mancano. A parità di lunghezza la fondamentale di una canna chiusa è un'ottava sotto quella aperta. Nelle canne vere l'estremità aperta va corretta aggiungendo circa 0,6 volte il raggio alla lunghezza." },
      { titolo: "Timbro e spettro", testo: "Due strumenti che suonano la stessa nota producono la stessa fondamentale ma con armoniche di ampiezza diversa, e l'orecchio distingue questa miscela come timbro. Per il teorema di Fourier ogni forma d'onda periodica è la somma di sinusoidi a frequenze multiple della fondamentale. Il flauto ha uno spettro dominato dalle prime armoniche e una forma d'onda quasi sinusoidale; il clarinetto, che nel registro grave si comporta come una canna cilindrica chiusa, ha le armoniche dispari molto più forti delle pari; l'arco del violino produce un'oscillazione vicina al dente di sega, con tutte le armoniche di ampiezza ∝ 1/n; l'onda quadra contiene solo le dispari, sempre con ampiezze ∝ 1/n." },
      { titolo: "Battimenti, effetto Doppler e cono di Mach", testo: "Due toni di frequenze vicine si sommano in un suono alla frequenza media la cui intensità pulsa |f₁ − f₂| volte al secondo: è il fenomeno che si usa per accordare gli strumenti. Se la sorgente si muove con velocità v_s verso l'ascoltatore, i fronti d'onda si addensano davanti a lei e la frequenza percepita sale a f' = f v/(v − v_s); in allontanamento scende a f v/(v + v_s). Se a muoversi è l'ascoltatore, f' = f(v ± v_o)/v: le due situazioni non sono simmetriche perché il mezzo definisce un riferimento privilegiato. Quando la sorgente supera la velocità del suono i fronti si accumulano su un cono di semiapertura θ con sin θ = v/v_s = 1/Ma, l'onda d'urto che si sente come boom sonico." },
      { titolo: "Intensità e decibel", testo: "L'orecchio percepisce intensità che vanno da 10⁻¹² W/m² a oltre 1 W/m², e la sensazione cresce circa con il logaritmo dello stimolo; per questo si usa il livello di intensità L = 10 log₁₀(I/I₀), con I₀ = 10⁻¹² W/m². Sorgenti incoerenti sommano le intensità, non i decibel: due sorgenti uguali danno 10 log₁₀ 2 ≈ +3 dB, dieci sorgenti +10 dB. Una sorgente puntiforme in campo libero distribuisce la potenza su sfere, I = P/(4πr²), quindi raddoppiando la distanza il livello scende di 20 log₁₀ 2 ≈ 6 dB. Il livello di pressione sonora usa invece L_p = 20 log₁₀(p/p₀), con p₀ = 20 μPa, perché l'intensità è proporzionale al quadrato della pressione." }
    ],
    formule: [
      ["v = √(γRT/M),  v = √(T/μ)", "velocità del suono in un gas ideale e delle onde su una corda tesa (m/s)"],
      ["f_n = n v/(2L)", "frequenze proprie di una corda fissa o di una canna aperta di lunghezza L, n = 1, 2, 3…"],
      ["f = (2n − 1) v/(4L)", "frequenze proprie di una canna chiusa a un'estremità: solo armoniche dispari"],
      ["f' = f (v ± v_o)/(v ∓ v_s)", "effetto Doppler acustico: segni superiori per sorgente e osservatore che si avvicinano"],
      ["sin θ = v/v_s", "semiapertura del cono di Mach per una sorgente supersonica di velocità v_s"],
      ["L = 10 log₁₀(I/I₀),  I₀ = 10⁻¹² W/m²", "livello di intensità sonora in decibel"]
    ],
    ipotesi: [
      "Acustica lineare: piccole variazioni di pressione rispetto alla pressione atmosferica; non vale per le onde d'urto intense.",
      "Corde e canne ideali: corda perfettamente flessibile, canne strette con estremità ideali (senza correzione di estremità se non dichiarata).",
      "Formule del Doppler per moti lungo la congiungente, in aria ferma e con velocità minori di quella del suono.",
      "La legge dell'inverso del quadrato vale in campo libero, lontano da pareti riflettenti."
    ],
    errori: [
      "Sommare i decibel di due sorgenti come numeri: 60 dB + 60 dB fanno 63 dB, non 120 dB.",
      "Pensare che la frequenza Doppler cambi mentre la sorgente si avvicina a velocità costante lungo la congiungente: resta costante e salta al valore più basso quando la sorgente passa.",
      "Attribuire a una canna chiusa tutte le armoniche, o la stessa fondamentale di una canna aperta della stessa lunghezza.",
      "Credere che l'aria più densa propaghi il suono più velocemente: a temperatura fissata la velocità nel gas ideale non dipende dalla pressione."
    ],
    esempio: {
      testo: "Un'ambulanza emette un tono di 440 Hz e si muove a 25 m/s (90 km/h); la velocità del suono è 343 m/s. In avvicinamento f' = 440·343/(343 − 25) = 474,6 Hz; in allontanamento f' = 440·343/(343 + 25) = 410,1 Hz. Il salto percepito quando passa è di 64,5 Hz, un rapporto 474,6/410,1 = 1,157, circa due semitoni e mezzo. Se due sirene uguali suonano insieme producendo 80 dB ciascuna, il livello totale è 80 + 10 log₁₀ 2 = 83,0 dB; a distanza doppia scende a 77,0 dB.",
      risultato: "474,6 Hz in arrivo, 410,1 Hz in partenza; 83,0 dB per due sirene"
    },
    fonti: [
      "D. Halliday, R. Resnick, K. S. Krane, Fisica 1, Casa Editrice Ambrosiana, 5ª ed., capitoli sulle onde sonore",
      "L. E. Kinsler, A. R. Frey, A. B. Coppens, J. V. Sanders, Fundamentals of Acoustics, Wiley, 4ª ed., capitoli sull'equazione delle onde acustiche, sulle canne e sui livelli sonori",
      "N. H. Fletcher, T. D. Rossing, The Physics of Musical Instruments, Springer, 2ª ed., 1998, capitoli sulle corde vibranti, sui tubi e sugli strumenti a fiato",
      "R. P. Feynman, R. B. Leighton, M. Sands, The Feynman Lectures on Physics, vol. I, cap. 47 (il suono, l'equazione delle onde) e cap. 50 (armoniche)"
    ],
    collegamenti: ['sfisonde', 'sfismecc', 'smatserie']
  };

  /* ═══ 💡 Semiconduttori ═══════════════════════════════════════════════════ */
  T['sfissolido'] = {
    titolo: "Semiconduttori: bande, portatori, giunzione p-n e LED",
    sintesi: "In un semiconduttore una banda di valenza piena e una banda di conduzione vuota sono separate da una banda proibita di circa un elettronvolt. L'agitazione termica e il drogaggio creano elettroni in conduzione e lacune in valenza, il cui numero segue dalla statistica di Fermi-Dirac. Mettendo a contatto una regione p e una n si forma una giunzione che conduce in un solo verso e che, nei materiali a gap diretto, emette luce.",
    paragrafi: [
      { titolo: "Bande e statistica di Fermi-Dirac", testo: "Gli elettroni in un cristallo occupano bande di energia permesse. La probabilità che uno stato di energia E sia occupato è data dalla funzione di Fermi-Dirac f(E) = 1/(1 + e^((E − E_F)/kT)), che a T = 0 è un gradino e a temperatura finita si arrotonda su qualche kT attorno al livello di Fermi E_F. A 300 K kT vale 25,9 meV, molto meno della banda proibita del silicio (1,12 eV): solo la coda esponenziale della distribuzione raggiunge la banda di conduzione. Contando gli stati con le densità efficaci N_c e N_v, proporzionali a T^(3/2), si ottiene la concentrazione intrinseca n_i = √(N_cN_v) e^(−E_g/2kT), che cresce rapidissimamente con la temperatura anche perché E_g diminuisce, secondo la legge empirica di Varshni E_g(T) = E_g(0) − αT²/(T + β)." },
      { titolo: "Drogaggio e legge di azione di massa", testo: "Sostituendo pochi atomi di silicio con atomi del gruppo 15 (fosforo, arsenico) si introducono donatori, che a temperatura ambiente cedono quasi tutti un elettrone alla banda di conduzione; con atomi del gruppo 13 (boro) si introducono accettori che creano lacune. In un semiconduttore non degenere all'equilibrio vale la legge di azione di massa np = n_i²: se i donatori sono N_d ≫ n_i, gli elettroni sono i portatori maggioritari, n ≈ N_d, e le lacune minoritarie, p = n_i²/N_d. Il livello di Fermi si sposta dal centro della banda proibita di E_F − E_i = kT ln(n/n_i). La conducibilità è σ = q(nμ_n + pμ_p), con μ le mobilità; drogare una parte su un milione cambia σ di molti ordini di grandezza." },
      { titolo: "La giunzione p-n", testo: "Quando una regione p e una regione n vengono a contatto, gli elettroni diffondono verso p e le lacune verso n e si ricombinano, lasciando vicino all'interfaccia gli ioni fissi del drogante: si forma una zona di svuotamento con un campo elettrico interno. All'equilibrio il campo blocca la diffusione e fra le due regioni c'è il potenziale di contatto V_bi = (kT/q) ln(N_aN_d/n_i²), fra 0,7 e 0,8 V nel silicio con drogaggi tipici. La larghezza della zona è W = √(2εV_bi(N_a + N_d)/(qN_aN_d)). Una tensione diretta abbassa la barriera e la corrente cresce in modo esponenziale, una tensione inversa la alza e resta solo una piccola corrente di saturazione: è la caratteristica di Shockley I = I₀(e^(V/(nV_T)) − 1), con V_T = kT/q e n fattore di idealità fra 1 e 2." },
      { titolo: "LED e banda proibita", testo: "In polarizzazione diretta elettroni e lacune iniettati attraverso la giunzione si ricombinano. Se il semiconduttore ha la banda proibita diretta, cioè il minimo della banda di conduzione e il massimo della valenza allo stesso vettore d'onda, la ricombinazione emette efficacemente un fotone di energia circa E_g e lunghezza d'onda λ = hc/E_g ≈ 1240 nm·eV/E_g. Il GaAs (1,42 eV) emette nell'infrarosso vicino, le leghe AlGaInP nel rosso, l'InGaN nel blu. Il silicio e il germanio hanno banda proibita indiretta: il fotone da solo non può fornire la quantità di moto necessaria, serve un fonone, e la ricombinazione radiativa è molto inefficiente." },
      { titolo: "Zona di Brillouin e valli di conduzione", testo: "Gli stati elettronici di un cristallo si classificano con il vettore d'onda k nella prima zona di Brillouin. Il reticolo reciproco di un cubico a facce centrate (silicio, germanio, arseniuro di gallio) è cubico a corpo centrato, e la sua zona di Brillouin è un ottaedro troncato. I minimi della banda di conduzione del silicio sono sei valli lungo le direzioni ⟨100⟩, vicino ai punti X; quelli del germanio stanno ai punti L. Attorno a ogni minimo l'energia è un paraboloide anisotropo e le superfici di energia costante sono ellissoidi, con massa longitudinale m_l e trasversale m_t. Il numero di stati utili è riassunto dalla massa efficace di densità degli stati m* = M_c^(2/3)(m_lm_t²)^(1/3), con M_c numero di valli, e da questa si ricava N_c = 2(2πm*kT/h²)^(3/2)." }
    ],
    formule: [
      ["f(E) = 1/(1 + e^((E − E_F)/kT))", "distribuzione di Fermi-Dirac; k = 8,617333·10⁻⁵ eV/K"],
      ["n_i = √(N_cN_v) e^(−E_g/2kT),  E_g(T) = E_g(0) − αT²/(T + β)", "concentrazione intrinseca (cm⁻³) e legge empirica di Varshni per la banda proibita"],
      ["np = n_i²,  E_F − E_i = kT ln(n/n_i)", "legge di azione di massa e posizione del livello di Fermi rispetto al livello intrinseco"],
      ["σ = q(nμ_n + pμ_p)", "conducibilità elettrica; q = 1,602176634·10⁻¹⁹ C, μ in cm²/(V·s)"],
      ["V_bi = (kT/q) ln(N_aN_d/n_i²),  I = I₀(e^(V/(nV_T)) − 1)", "potenziale di contatto della giunzione p-n e caratteristica di Shockley del diodo"],
      ["λ = hc/E_g ≈ 1239,84 nm·eV / E_g", "lunghezza d'onda di emissione di un LED con banda proibita E_g"]
    ],
    ipotesi: [
      "Semiconduttore non degenere (E_F lontano qualche kT dai bordi delle bande): solo così vale la statistica di Boltzmann usata in n_i e in np = n_i².",
      "Ionizzazione completa dei droganti a temperatura ambiente; a bassa temperatura i portatori congelano sulle impurezze.",
      "Giunzione brusca e approssimazione di svuotamento; il modello di Shockley trascura la ricombinazione nella zona di svuotamento e le resistenze serie.",
      "La legge di Varshni è empirica e i suoi parametri dipendono dal materiale e dalla fonte."
    ],
    errori: [
      "Pensare che le lacune siano particelle positive vere: descrivono il comportamento collettivo di una banda quasi piena.",
      "Credere che drogare con donatori renda il cristallo carico negativamente: ogni elettrone ceduto lascia uno ione positivo e il materiale resta neutro.",
      "Usare n = N_d anche quando N_d è confrontabile con n_i, per esempio ad alta temperatura.",
      "Ritenere che la soglia di 0,7 V sia una proprietà fondamentale del diodo al silicio: è solo la tensione a cui la corrente esponenziale diventa apprezzabile su scala dei milliampere."
    ],
    esempio: {
      testo: "Silicio a 300 K drogato con N_d = 1,0·10¹⁶ cm⁻³ donatori. Con i parametri della sezione E_g = 1,166 − 4,73·10⁻⁴·300²/(300 + 636) = 1,121 eV e n_i ≈ 1,07·10¹⁰ cm⁻³. Gli elettroni sono n ≈ 1,0·10¹⁶ cm⁻³, le lacune p = n_i²/n ≈ 1,1·10⁴ cm⁻³. Il livello di Fermi sta a kT ln(n/n_i) = 0,02585·ln(9,4·10⁵) = 0,355 eV sopra il livello intrinseco. Con μ_n = 1400 cm²/(V·s) la conducibilità è σ = 1,602·10⁻¹⁹·10¹⁶·1400 = 2,24 S/cm, cioè una resistività di 0,45 Ω·cm.",
      risultato: "p ≈ 1,1·10⁴ cm⁻³, E_F − E_i ≈ 0,36 eV, ρ ≈ 0,45 Ω·cm"
    },
    fonti: [
      "S. M. Sze, K. K. Ng, Physics of Semiconductor Devices, Wiley, 3ª ed., 2007, cap. 1 (fisica e proprietà dei semiconduttori) e cap. 2 (giunzioni p-n)",
      "C. Kittel, Introduction to Solid State Physics, Wiley, 8ª ed., cap. 8 (cristalli semiconduttori) e cap. 2 (reticolo reciproco e zone di Brillouin)",
      "N. W. Ashcroft, N. D. Mermin, Solid State Physics, Saunders, 1976, cap. 28 (semiconduttori omogenei) e cap. 29 (semiconduttori disomogenei)",
      "Y. P. Varshni, Temperature dependence of the energy gap in semiconductors, Physica 34 (1967) 149"
    ],
    collegamenti: ['sfiselettronica', 'sfismateriali', 'scristalli', 'sfisstat']
  };

  /* ═══ 🔥 Calore e diffusione ══════════════════════════════════════════════ */
  T['sfiscalore'] = {
    titolo: "Conduzione del calore, raffreddamento e diffusione",
    sintesi: "Il calore fluisce dalle zone calde alle fredde con una densità di corrente proporzionale al gradiente di temperatura (legge di Fourier). Combinata con la conservazione dell'energia, questa legge dà l'equazione del calore, che descrive anche la diffusione di una sostanza (legge di Fick). Le sue soluzioni si spengono con tempi che crescono come il quadrato delle dimensioni; in regime stazionario gli strati di una parete si comportano come resistenze in serie.",
    paragrafi: [
      { titolo: "Legge di Fourier ed equazione del calore", testo: "La densità di flusso termico è q = −k∇T, con k conducibilità termica in W/(m·K). Bilanciando l'energia che entra ed esce da un volumetto con la variazione della sua energia interna si ottiene ∂T/∂t = α∇²T, dove α = k/(ρc) è la diffusività termica in m²/s. In una barra la temperatura evolve secondo ∂T/∂t = α ∂²T/∂x²: un punto più caldo dei vicini, dove la curvatura del profilo è negativa, si raffredda. La stessa equazione, con α sostituita dal coefficiente di diffusione D, descrive la concentrazione di un soluto che diffonde (seconda legge di Fick)." },
      { titolo: "Soluzione numerica e stabilità", testo: "La sezione risolve l'equazione con le differenze finite esplicite: la derivata seconda nel punto i diventa (T_{i+1} − 2T_i + T_{i−1})/Δx² e il tempo avanza a passi Δt. Lo schema è stabile solo se r = αΔt/Δx² ≤ ½ in una dimensione (≤ ¼ in due): oltre questo limite gli errori crescono a ogni passo e la soluzione esplode in oscillazioni prive di senso fisico. Il vincolo dice anche che, raffinando la griglia, il passo temporale deve diminuire con il quadrato di Δx. Le condizioni al bordo sono due: temperatura fissata (Dirichlet) oppure estremo isolato, con flusso nullo (Neumann)." },
      { titolo: "Stato stazionario e tempo di rilassamento", testo: "Con gli estremi a temperatura fissata la barra tende a uno stato stazionario in cui ∂²T/∂x² = 0: il profilo è lineare fra le due temperature e il flusso è uniforme. Con gli estremi isolati tende invece alla temperatura media iniziale, perché l'energia non può uscire. L'avvicinamento all'equilibrio si capisce sviluppando lo scarto in serie di Fourier: ogni modo spaziale di numero n decade come e^(−αn²π²t/L²), i modi fini si spengono prima e sopravvive il più lento, con tempo caratteristico τ = L²/(π²α). Per una barra di rame lunga 10 cm, con α ≈ 1,1·10⁻⁴ m²/s, τ ≈ 9 s; per una di vetro della stessa lunghezza circa 50 minuti." },
      { titolo: "Raffreddamento di Newton e irraggiamento", testo: "Un corpo che scambia calore con l'ambiente per convezione, con una differenza di temperatura moderata, perde una potenza proporzionale a T − T_a; se la sua temperatura è uniforme ne segue T(t) = T_a + (T₀ − T_a)e^(−kt), e la differenza si dimezza ogni ln 2/k. Un corpo caldo irraggia anche secondo la legge di Stefan-Boltzmann, P = εσA(T⁴ − T_a⁴), con σ = 5,670374419·10⁻⁸ W/(m²K⁴). Poiché questo termine cresce con la quarta potenza della temperatura assoluta, domina per i corpi molto caldi, come un ferro rovente, mentre per una tazza di caffè la convezione è più importante. Vicino a T_a l'irraggiamento si può linearizzare con un coefficiente 4εσT_a³, circa 6 W/(m²K) a temperatura ambiente." },
      { titolo: "Pareti e resistenze termiche", testo: "In regime stazionario il flusso termico attraverso uno strato piano di spessore L e area A è Φ = kAΔT/L, formalmente identico alla legge di Ohm con ΔT al posto della tensione e R = L/(kA) al posto della resistenza. Più strati in serie sommano le resistenze, e la temperatura cade soprattutto nello strato più resistente, tipicamente l'isolante. Per unità di area si usa la resistenza R'' = Σ L/k più le resistenze superficiali 1/h dovute alla convezione sui due lati; il suo inverso è la trasmittanza U in W/(m²K), il parametro con cui si classificano le pareti degli edifici." }
    ],
    formule: [
      ["q = −k∇T", "legge di Fourier: q densità di flusso termico (W/m²), k conducibilità termica (W/(m·K))"],
      ["∂T/∂t = α∇²T,  α = k/(ρc)", "equazione del calore; α diffusività termica (m²/s), ρ densità, c calore specifico"],
      ["r = αΔt/Δx² ≤ ½", "condizione di stabilità dello schema esplicito alle differenze finite in una dimensione"],
      ["τ = L²/(π²α)", "tempo di decadimento del modo più lento in una barra di lunghezza L"],
      ["T(t) = T_a + (T₀ − T_a) e^(−kt)", "legge di raffreddamento di Newton, k costante (s⁻¹ o min⁻¹)"],
      ["R'' = Σ Lᵢ/kᵢ + Σ 1/h,  U = 1/R''", "resistenza termica per unità di area di una parete a strati (m²K/W) e trasmittanza"]
    ],
    ipotesi: [
      "Conducibilità e diffusività costanti, mezzo omogeneo e isotropo, nessuna sorgente interna salvo dove indicata.",
      "Newton: temperatura uniforme nel corpo (numero di Biot piccolo) e coefficiente di scambio costante; è una legge empirica, valida per differenze di temperatura moderate.",
      "Pareti: regime stazionario, flusso monodimensionale, ponti termici trascurati."
    ],
    errori: [
      "Confondere conducibilità k e diffusività α: il rame conduce molto, ma è α a stabilire quanto in fretta si porta in equilibrio.",
      "Pensare che il tempo di diffusione cresca linearmente con lo spessore: cresce con il suo quadrato.",
      "Usare la legge di Newton per un corpo incandescente, dove domina l'irraggiamento ∝ T⁴.",
      "Scegliere un passo temporale troppo grande nello schema esplicito e interpretare le oscillazioni numeriche come fisica."
    ],
    esempio: {
      testo: "Una parete è fatta di 25 cm di mattoni (k = 0,70 W/(m·K)) e 5,0 cm di isolante (k = 0,035 W/(m·K)). Le resistenze per unità di area sono 0,25/0,70 = 0,357 m²K/W e 0,050/0,035 = 1,429 m²K/W, in tutto 1,786 m²K/W. Senza resistenze superficiali U = 1/1,786 = 0,56 W/(m²K); con una differenza di 20 K il flusso è 20/1,786 = 11,2 W/m². Aggiungendo le resistenze superficiali convenzionali (0,13 + 0,04 m²K/W) si ottiene U = 1/1,956 = 0,51 W/(m²K). L'isolante, spesso un quinto dei mattoni, porta l'80 % della resistenza.",
      risultato: "U ≈ 0,56 W/(m²K) (0,51 con le resistenze superficiali), flusso ≈ 11 W/m²"
    },
    fonti: [
      "H. S. Carslaw, J. C. Jaeger, Conduction of Heat in Solids, Oxford University Press, 2ª ed., 1959, capitoli sul flusso lineare e sulle soluzioni in serie di Fourier",
      "T. L. Bergman, A. S. Lavine, F. P. Incropera, D. P. DeWitt, Fundamentals of Heat and Mass Transfer, Wiley, 7ª ed., capitoli sulla conduzione stazionaria e transitoria e sui metodi alle differenze finite",
      "J. Crank, The Mathematics of Diffusion, Oxford University Press, 2ª ed., 1975, cap. 1 e cap. 4",
      "W. H. Press, S. A. Teukolsky, W. T. Vetterling, B. P. Flannery, Numerical Recipes, Cambridge University Press, 3ª ed., cap. 20 (equazioni alle derivate parziali, problemi di diffusione)"
    ],
    collegamenti: ['sfistermo', 'smatedp', 'sfisfluidi', 'sfisclima']
  };

  /* ═══ 🧲 Modello di Ising ═════════════════════════════════════════════════ */
  T['sfisising'] = {
    titolo: "Il modello di Ising: ferromagnetismo e transizioni di fase",
    sintesi: "Il modello di Ising descrive un magnete come un reticolo di spin che possono valere solo +1 o −1 e che preferiscono allinearsi con i vicini. È il modello più semplice che presenti una vera transizione di fase: sotto una temperatura critica compare una magnetizzazione spontanea. In due dimensioni Onsager lo ha risolto esattamente; in generale lo si studia con simulazioni Monte Carlo come quella della sezione, che usa l'algoritmo di Metropolis.",
    paragrafi: [
      { titolo: "Il modello e la sua energia", testo: "Su ogni nodo di un reticolo quadrato c'è uno spin sᵢ = ±1. L'energia di una configurazione è H = −J Σ sᵢsⱼ − h Σ sᵢ, dove la prima somma corre sulle coppie di primi vicini, J > 0 favorisce l'allineamento (ferromagnetismo) e h è un campo esterno. All'equilibrio termico ogni configurazione ha probabilità proporzionale al fattore di Boltzmann e^(−H/kT). A bassa temperatura dominano gli stati ordinati, quasi tutti gli spin concordi; ad alta temperatura l'entropia delle configurazioni disordinate prevale. La sezione usa unità ridotte, J = k_B = 1, e bordi periodici per ridurre gli effetti di bordo." },
      { titolo: "L'algoritmo di Metropolis", testo: "Le configurazioni di un reticolo 100 × 100 sono 2¹⁰⁰⁰⁰ e non si possono enumerare. L'algoritmo di Metropolis costruisce invece una catena di Markov: si sceglie uno spin, si calcola la variazione di energia ΔE = 2sᵢ(J Σ sⱼ + h) che il suo ribaltamento produrrebbe, e lo si ribalta sempre se ΔE ≤ 0, altrimenti con probabilità e^(−ΔE/kT). Questa regola soddisfa il bilancio dettagliato, quindi la catena visita le configurazioni con le frequenze di Boltzmann. Le medie di magnetizzazione ed energia si fanno dopo un periodo di termalizzazione e su molti passi, perché configurazioni successive sono correlate; vicino a Tc la correlazione dura moltissimo (rallentamento critico)." },
      { titolo: "La soluzione di Onsager e la temperatura critica", testo: "Nel 1944 Onsager calcolò esattamente l'energia libera del modello bidimensionale a campo nullo, e la magnetizzazione spontanea fu ottenuta da Yang nel 1952: m = (1 − sinh⁻⁴(2J/kT))^(1/8) per T < Tc e zero sopra. La temperatura critica è kTc/J = 2/ln(1 + √2) ≈ 2,269. Vicino a Tc la magnetizzazione si annulla come (Tc − T)^β con β = 1/8, e il calore specifico diverge in modo logaritmico. L'approssimazione di campo medio, che sostituisce i vicini con il loro valore medio, prevede invece kTc = zJ = 4J e β = ½: sovrastima la temperatura critica perché ignora le fluttuazioni, decisive in bassa dimensione. In una dimensione la transizione non esiste affatto." },
      { titolo: "Domini, fluttuazioni ed effetti di taglia finita", testo: "Raffreddando sotto Tc si vedono crescere domini di spin concordi, separati da pareti che costano energia 2J per legame spezzato. Sopra Tc le regioni ordinate hanno dimensioni tipiche pari alla lunghezza di correlazione ξ, che diverge a Tc. In un reticolo finito la transizione non è mai netta: |m| resta diversa da zero anche sopra Tc, il picco del calore specifico è arrotondato e spostato, e sotto Tc il sistema può passare spontaneamente da m positiva a negativa. Per questo nella sezione si misura il valore assoluto di m e il confronto con Onsager migliora al crescere del lato del reticolo." },
      { titolo: "Isteresi e il caso tridimensionale", testo: "Sotto Tc, facendo variare il campo h avanti e indietro, la magnetizzazione non segue la stessa curva nei due versi: il sistema resta in uno stato metastabile finché il campo opposto non è abbastanza forte da nucleare domini rovesciati, e si disegna un ciclo di isteresi come quello dei ferromagneti reali. Sopra Tc la risposta diventa reversibile e il ciclo si chiude. In tre dimensioni, con sei vicini, non esiste una soluzione esatta: le simulazioni danno kTc/J ≈ 4,51 ed esponente β ≈ 0,326, valori che coincidono con quelli dei punti critici liquido-vapore, perché sistemi diversi con la stessa dimensione e simmetria appartengono alla stessa classe di universalità." }
    ],
    formule: [
      ["H = −J Σ⟨ij⟩ sᵢsⱼ − h Σᵢ sᵢ", "hamiltoniana di Ising: sᵢ = ±1, J costante di accoppiamento, h campo esterno (in unità di energia)"],
      ["P(accetta) = min(1, e^(−ΔE/kT)),  ΔE = 2sᵢ(J Σⱼ sⱼ + h)", "regola di Metropolis per il ribaltamento dello spin i"],
      ["m(T) = (1 − sinh⁻⁴(2J/kT))^(1/8)", "magnetizzazione spontanea esatta del reticolo quadrato (Onsager-Yang), per T < Tc"],
      ["kTc/J = 2/ln(1 + √2) ≈ 2,269", "temperatura critica esatta in due dimensioni; ≈ 4,51 in tre dimensioni (numerica)"],
      ["C = (⟨E²⟩ − ⟨E⟩²)/(kT²)", "calore specifico dalle fluttuazioni dell'energia, usato nella simulazione"]
    ],
    ipotesi: [
      "Spin classici a due valori e interazione solo fra primi vicini: è un modello, non la descrizione microscopica di un ferromagnete reale.",
      "La soluzione di Onsager vale per il reticolo quadrato infinito a campo nullo; la simulazione usa reticoli finiti con bordi periodici.",
      "Le medie Monte Carlo hanno errori statistici e richiedono termalizzazione; vicino a Tc l'algoritmo a singolo spin diventa lentissimo."
    ],
    errori: [
      "Pensare che in un sistema finito sopra Tc la magnetizzazione sia esattamente zero: fluttua attorno a zero con ampiezza che decresce come 1/√N.",
      "Usare la temperatura critica di campo medio (4J/k) come se fosse quella vera del reticolo quadrato.",
      "Prendere la media di m invece che di |m| sotto Tc: in un reticolo finito il sistema può invertirsi e la media con segno tende a zero.",
      "Credere che l'algoritmo di Metropolis simuli la dinamica reale degli spin: produce configurazioni con il peso giusto, ma la sua sequenza temporale è fittizia."
    ],
    esempio: {
      testo: "Si calcoli la magnetizzazione spontanea esatta a kT/J = 2,0. L'argomento è 2J/kT = 1,0 e sinh(1,0) = 1,1752, quindi sinh⁴ = 1,9073 e sinh⁻⁴ = 0,5243. Allora m = (1 − 0,5243)^(1/8) = 0,4757^0,125 = 0,911. A questa temperatura, l'88 % di Tc = 2,269, gli spin sono già quasi tutti allineati; una simulazione su un reticolo 64 × 64 dà |m| molto vicino a questo valore. Il campo medio, con Tc = 4, prevederebbe un sistema ancora più ordinato e una transizione molto più in alto.",
      risultato: "m(T = 2,0) ≈ 0,911"
    },
    fonti: [
      "L. Onsager, Crystal Statistics. I. A Two-Dimensional Model with an Order-Disorder Transition, Physical Review 65 (1944) 117",
      "C. N. Yang, The Spontaneous Magnetization of a Two-Dimensional Ising Model, Physical Review 85 (1952) 808",
      "M. E. J. Newman, G. T. Barkema, Monte Carlo Methods in Statistical Physics, Oxford University Press, 1999, capitoli 3 e 4 (modello di Ising, algoritmo di Metropolis, comportamento critico)",
      "R. K. Pathria, P. D. Beale, Statistical Mechanics, Academic Press, 3ª ed., capitoli sulle transizioni di fase e sul modello di Ising",
      "N. Metropolis, A. W. Rosenbluth, M. N. Rosenbluth, A. H. Teller, E. Teller, Equation of State Calculations by Fast Computing Machines, Journal of Chemical Physics 21 (1953) 1087"
    ],
    collegamenti: ['sfisstat', 'stermostat', 'sdinmol', 'smatmarkov', 'sfismateriali']
  };

  /* ═══ ⚛️ Fisica delle particelle ══════════════════════════════════════════ */
  T['sfispart'] = {
    titolo: "Modello Standard, leggi di conservazione e cinematica relativistica",
    sintesi: "Il Modello Standard descrive la materia con dodici fermioni (sei quark e sei leptoni) e le interazioni con bosoni di gauge, più il bosone di Higgs che dà massa alle particelle. Quali reazioni sono possibili lo stabiliscono le leggi di conservazione; che cosa si misura lo stabilisce la cinematica relativistica, con la massa invariante che rivela le particelle instabili e la dilatazione dei tempi che spiega perché i muoni cosmici arrivano al suolo.",
    paragrafi: [
      { titolo: "I costituenti del Modello Standard", testo: "I fermioni di spin ½ sono organizzati in tre generazioni. Ogni generazione contiene due quark (u e d, poi c e s, poi t e b), con cariche +2/3 e −1/3 e tre colori, un leptone carico (elettrone, muone, tau) e il suo neutrino. Le interazioni sono mediate da bosoni di spin 1: il fotone per l'elettromagnetismo, otto gluoni per l'interazione forte, W± e Z⁰ per quella debole. Il bosone di Higgs, di spin 0 e massa circa 125 GeV/c², è il quanto del campo che rompe la simmetria elettrodebole. Le masse vanno da meno di un elettronvolt per i neutrini ai 172,6 GeV del quark top, quasi dodici ordini di grandezza, e il loro valore non è previsto dalla teoria." },
      { titolo: "Leggi di conservazione", testo: "In ogni reazione si conservano energia, quantità di moto, momento angolare e carica elettrica. A queste il Modello Standard aggiunge il numero barionico (+1/3 per ogni quark, quindi +1 per protone e neutrone) e, separatamente per ogni famiglia, i numeri leptonici L_e, L_μ, L_τ. Un decadimento β, n → p e⁻ ν̄_e, rispetta tutte le leggi: la carica resta zero, il numero barionico uno, L_e zero perché l'elettrone vale +1 e l'antineutrino −1. Il momento angolare impone che il numero di fermioni cambi di una quantità pari. Le oscillazioni dei neutrini mostrano che i numeri leptonici di famiglia non sono esatti, ma la violazione è invisibile nei processi a cui si applicano questi controlli." },
      { titolo: "Energia disponibile e soglie", testo: "Un decadimento è possibile solo se la massa della particella iniziale supera la somma delle masse finali; la differenza, Q = (M − Σmᵢ)c², si ripartisce in energia cinetica. Per produrre nuove particelle su un bersaglio fermo non basta che l'energia del proiettile superi la massa da creare, perché parte dell'energia resta nel moto del centro di massa: la soglia in energia cinetica è T_th = [(Σm_f)² − (m₁ + m₂)²]c²/(2m₂), con m₂ massa del bersaglio. Per questo i collisori a fasci opposti, in cui il centro di massa è fermo, sono molto più efficienti dei bersagli fissi." },
      { titolo: "La massa invariante e la risonanza Z", testo: "Il quadrato della somma dei quadrivettori di due particelle, m²c⁴ = (E₁ + E₂)² − |p₁ + p₂|²c², ha lo stesso valore in tutti i riferimenti. Se le due particelle vengono dal decadimento di una particella madre, m è proprio la massa della madre, anche se questa si muoveva. Nell'istogramma delle coppie μ⁺μ⁻ la Z appare come un picco sopra un fondo che decresce. La forma del picco è una Breit-Wigner centrata su M_Z = 91,1880 GeV con larghezza Γ_Z = 2,4955 GeV: la larghezza è legata alla vita media da τ = ħ/Γ, circa 2,6·10⁻²⁵ s. Un fit di segnale più fondo ritrova questi parametri dai soli eventi." },
      { titolo: "Muoni cosmici e decadimenti a due corpi", testo: "I muoni prodotti dai raggi cosmici a circa 15 km di quota hanno una vita media propria di 2,197 μs, quindi senza relatività percorrerebbero in media solo cτ ≈ 659 m. Con energie di qualche GeV il fattore γ vale decine e il cammino medio βγcτ diventa di molti chilometri: una frazione consistente arriva al livello del mare, come si osserva. In un decadimento a due corpi da fermo, invece, conservazione dell'energia e della quantità di moto fissano un unico valore dell'impulso dei prodotti, p = √([M² − (m₁ + m₂)²][M² − (m₁ − m₂)²])c/(2M). In un rivelatore come CMS l'impulso trasverso si misura dalla curvatura nel campo del solenoide: p_T[GeV/c] = 0,3·B[T]·R[m]." }
    ],
    formule: [
      ["E² = (pc)² + (mc²)²", "relazione energia-impulso per una particella di massa m"],
      ["m²c⁴ = (E₁ + E₂)² − |p₁ + p₂|²c²", "massa invariante di una coppia di particelle, uguale in tutti i riferimenti"],
      ["Q = (M − Σmᵢ)c²", "energia liberata in un decadimento"],
      ["T_th = [(Σm_f)² − (m₁ + m₂)²]c²/(2m₂)", "energia cinetica di soglia del proiettile m₁ su un bersaglio fermo m₂"],
      ["p = √([M² − (m₁ + m₂)²][M² − (m₁ − m₂)²]) c/(2M)", "impulso dei prodotti di un decadimento a due corpi della particella M a riposo"],
      ["τ = ħ/Γ,  L = βγcτ", "vita media dalla larghezza di una risonanza (ħ = 6,582·10⁻²² MeV·s) e cammino medio in volo"],
      ["p_T = 0,3 B R", "impulso trasverso (GeV/c) di una particella di carica unitaria con raggio di curvatura R (m) in un campo B (T)"]
    ],
    ipotesi: [
      "Masse e larghezze sono valori PDG con le loro incertezze; per i neutrini esistono solo limiti superiori.",
      "Il controllo delle conservazioni non sa nulla della dinamica: una reazione permessa può essere rarissima, e alcune simmetrie (parità, coniugazione di carica) sono violate dall'interazione debole.",
      "Nella simulazione dei muoni cosmici la discesa è verticale e si trascura la perdita di energia per ionizzazione (circa 2 GeV attraverso l'atmosfera).",
      "La Breit-Wigner non relativistica è adeguata perché Γ_Z ≪ M_Z."
    ],
    errori: [
      "Sommare le masse invece dei quadrivettori: la massa invariante di due particelle non è m₁ + m₂ ma dipende dalle loro energie e direzioni.",
      "Pensare che per creare una particella di massa M su un bersaglio fisso basti un proiettile con energia Mc².",
      "Confondere il numero leptonico totale con quelli di famiglia: μ⁻ → e⁻ γ conserva L totale ma viola L_e e L_μ, e non è mai stato osservato.",
      "Dimenticare che la vita media τ è definita nel riferimento di riposo della particella."
    ],
    esempio: {
      testo: "Il pione carico a riposo decade in π⁺ → μ⁺ν_μ. Con m_π = 139,570 MeV/c², m_μ = 105,658 MeV/c² e il neutrino di massa trascurabile, p = (m_π² − m_μ²)c/(2m_π) = (19 479,9 − 11 163,7)/(2·139,570) = 29,79 MeV/c. Il muone ha energia E = √(29,79² + 105,658²) = 109,78 MeV, quindi energia cinetica 4,12 MeV; il neutrino porta i restanti 29,79 MeV. Il Q del decadimento è 139,570 − 105,658 = 33,91 MeV = 4,12 + 29,79 MeV, come deve.",
      risultato: "p = 29,79 MeV/c, T_μ = 4,12 MeV, E_ν = 29,79 MeV"
    },
    fonti: [
      "Particle Data Group, S. Navas et al., Review of Particle Physics, Physical Review D 110 (2024) 030001, tabelle delle particelle e rassegna di cinematica",
      "D. Griffiths, Introduction to Elementary Particles, Wiley-VCH, 2ª ed., 2008, cap. 3 (cinematica relativistica) e cap. 4 (simmetrie e leggi di conservazione)",
      "D. H. Perkins, Introduction to High Energy Physics, Cambridge University Press, 4ª ed., 2000, capitoli sulle leggi di conservazione e sull'interazione elettrodebole",
      "S. Braibant, G. Giacomelli, M. Spurio, Particelle e interazioni fondamentali, Springer, 2ª ed., capitoli sul Modello Standard e sulla fisica dei bosoni W e Z"
    ],
    collegamenti: ['sfisrel', 'snucleare', 'sfisnuclei', 'sfisem']
  };

  /* ═══ 🎡 Meccanica analitica ══════════════════════════════════════════════ */
  T['sfisanalitica'] = {
    titolo: "Meccanica lagrangiana e hamiltoniana: simmetrie, caos e spazio delle fasi",
    sintesi: "La meccanica analitica riformula le leggi di Newton a partire da una sola funzione, la lagrangiana L = T − V o l'hamiltoniana H. Le equazioni del moto si scrivono in qualunque sistema di coordinate, le simmetrie si traducono in grandezze conservate (teorema di Noether) e il moto diventa un flusso nello spazio delle fasi che conserva i volumi (teorema di Liouville). Lo stesso linguaggio mostra che sistemi deterministici possono essere caotici.",
    paragrafi: [
      { titolo: "Lagrangiana, hamiltoniana e spazio delle fasi", testo: "Scelte coordinate generalizzate qᵢ compatibili con i vincoli, il moto rende stazionaria l'azione ∫L dt e soddisfa le equazioni di Eulero-Lagrange d/dt(∂L/∂q̇ᵢ) − ∂L/∂qᵢ = 0. Definiti i momenti coniugati pᵢ = ∂L/∂q̇ᵢ, la trasformata di Legendre H = Σpᵢq̇ᵢ − L dà le equazioni di Hamilton q̇ = ∂H/∂p, ṗ = −∂H/∂q, del primo ordine. Per il pendolo, in unità in cui mL² = 1 e ω₀ = √(g/L) = 1, H(θ, p) = p²/2 − cos θ. Poiché H si conserva, le traiettorie sono le curve di livello di H: chiuse attorno al minimo per H < 1 (librazioni), aperte per H > 1 (rotazioni), separate dalla separatrice H = 1 che passa per il punto di equilibrio instabile." },
      { titolo: "Il periodo esatto del pendolo", testo: "Lungo una librazione di ampiezza θ₀ la conservazione dell'energia dà θ̇ in funzione di θ, e il periodo è un integrale che, con la sostituzione sin(θ/2) = k sin φ, diventa T = 4K(k) in unità di 1/ω₀, con k = sin(θ₀/2) e K l'integrale ellittico completo di prima specie. Per piccole ampiezze K → π/2 e si ritrova 2π; avvicinandosi alla separatrice K diverge in modo logaritmico, perché il pendolo impiega un tempo sempre più lungo a lasciare la posizione verticale. La sezione calcola K con la media aritmetico-geometrica, K(k) = π/(2·AGM(1, √(1 − k²))), che converge in pochissimi passi." },
      { titolo: "Doppio pendolo e caos deterministico", testo: "Il doppio pendolo ha due gradi di libertà e una sola grandezza conservata, l'energia: per energie sufficienti il moto è caotico. Due copie con angoli iniziali che differiscono di 10⁻⁶ rad seguono traiettorie quasi uguali per un po', poi la distanza fra loro cresce in media come e^(λt), dove λ è l'esponente di Lyapunov, finché diventa grande come il sistema stesso. In scala logaritmica la crescita è una retta di pendenza λ. Il moto è deterministico, ma una precisione finita sulle condizioni iniziali permette previsioni solo per un tempo dell'ordine di (1/λ) ln(Δ/δ₀). Il controllo della conservazione dell'energia verifica che la divergenza non sia un artefatto dell'integratore." },
      { titolo: "La perlina sull'anello rotante e la biforcazione", testo: "Una perlina scorre senza attrito su un anello di raggio R che ruota con velocità angolare ω attorno al diametro verticale. Con θ misurato dal basso, la lagrangiana è L = ½mR²(θ̇² + ω² sin²θ) + mgR cos θ, e il moto è quello in un potenziale efficace U_eff = −mgR cos θ − ½mR²ω² sin²θ. Per ω² < g/R l'unico equilibrio stabile è il fondo; oltre la soglia il fondo diventa instabile e nascono due equilibri simmetrici con cos θ* = g/(Rω²): è una biforcazione a forcone. L'energia meccanica non si conserva, perché il motore che fa girare l'anello compie lavoro; si conserva invece la funzione di Jacobi h = ½mR²θ̇² + U_eff, perché la lagrangiana non dipende esplicitamente dal tempo." },
      { titolo: "Noether e Liouville", testo: "Il teorema di Noether lega ogni simmetria continua della lagrangiana a una grandezza conservata: invarianza per traslazioni temporali e conservazione dell'energia, per traslazioni spaziali e della quantità di moto, per rotazioni e del momento angolare. In un campo centrale il momento angolare si conserva; aggiungendo un campo uniforme la simmetria per rotazioni si rompe e il momento angolare cambia nel tempo. Il teorema di Liouville afferma che il flusso hamiltoniano conserva i volumi nello spazio delle fasi: una nube di condizioni iniziali si deforma, si allunga in filamenti sottili, ma la sua area resta costante, come mostra la formula di Gauss sul poligono di bordo. L'involucro convesso, una misura grossolana dell'area, cresce invece: è l'origine geometrica dell'aumento dell'entropia a grana grossa." }
    ],
    formule: [
      ["d/dt(∂L/∂q̇ᵢ) − ∂L/∂qᵢ = 0", "equazioni di Eulero-Lagrange, L = T − V funzione delle coordinate generalizzate e delle loro derivate"],
      ["q̇ = ∂H/∂p,  ṗ = −∂H/∂q,  H = Σpq̇ − L", "equazioni di Hamilton e definizione dell'hamiltoniana"],
      ["H(θ, p) = p²/2 − cos θ", "hamiltoniana del pendolo in unità ridotte (mL² = 1, ω₀ = 1); separatrice H = 1"],
      ["T = 4K(sin(θ₀/2))/ω₀", "periodo esatto del pendolo di ampiezza θ₀"],
      ["δ(t) ≈ δ₀ e^(λt)", "crescita della distanza fra traiettorie vicine in un sistema caotico; λ esponente di Lyapunov (s⁻¹)"],
      ["cos θ* = g/(Rω²)  per ω² > g/R", "equilibri della perlina sull'anello rotante oltre la biforcazione"]
    ],
    ipotesi: [
      "Vincoli ideali (olonomi e senza attrito) e forze derivabili da un potenziale; l'attrito richiede estensioni come la funzione di dissipazione di Rayleigh.",
      "Liouville vale per sistemi hamiltoniani; con attrito i volumi nello spazio delle fasi si contraggono.",
      "L'esponente di Lyapunov stimato da una sola coppia di traiettorie e da un tempo finito è un valore indicativo."
    ],
    errori: [
      "Identificare sempre l'hamiltoniana con l'energia meccanica: coincidono solo se i vincoli non dipendono dal tempo, e nella perlina sull'anello rotante non è così.",
      "Pensare che caotico significhi casuale: le equazioni sono deterministiche, ed è l'amplificazione esponenziale degli errori a impedire la previsione.",
      "Credere che il teorema di Liouville impedisca il mescolamento: l'area si conserva, ma la forma può diventare arbitrariamente complicata.",
      "Scrivere il momento coniugato come m·q̇ in coordinate non cartesiane: per un angolo è un momento angolare, p_θ = mL²θ̇."
    ],
    esempio: {
      testo: "Una perlina è su un anello di raggio R = 0,20 m che ruota a ω = 10 rad/s. La velocità angolare critica è √(g/R) = √(9,80665/0,20) = 7,00 rad/s, superata. L'equilibrio stabile è a cos θ* = g/(Rω²) = 9,80665/20 = 0,490, cioè θ* = 60,6° dal basso. Derivando due volte U_eff si trova che la pulsazione delle piccole oscillazioni attorno a θ* è Ω = ω sin θ* = 10·√(1 − 0,490²) = 8,72 rad/s.",
      risultato: "θ* ≈ 60,6°, Ω ≈ 8,7 rad/s (soglia ω_c = 7,0 rad/s)"
    },
    fonti: [
      "H. Goldstein, C. Poole, J. Safko, Classical Mechanics, Addison-Wesley, 3ª ed., cap. 1–2 (formulazione lagrangiana e principio variazionale), cap. 8 (equazioni di Hamilton), cap. 9 (teorema di Liouville), cap. 11 (caos)",
      "L. D. Landau, E. M. Lifshitz, Meccanica (Corso di fisica teorica, vol. 1), Editori Riuniti, §2–§9 (equazioni del moto e leggi di conservazione) e §46 (teorema di Liouville)",
      "S. H. Strogatz, Nonlinear Dynamics and Chaos, Westview Press, 2ª ed., cap. 3 (biforcazioni, la perlina sull'anello rotante) e cap. 9–10 (caos ed esponenti di Lyapunov)",
      "J. R. Taylor, Classical Mechanics, University Science Books, 2005, cap. 7 (equazioni di Lagrange) e cap. 12 (meccanica non lineare e caos)"
    ],
    collegamenti: ['sfismecc', 'sfoucault', 'smatode', 'smatvariaz', 'sfisstat']
  };

  /* ═══ 🌍 Pendolo di Foucault ══════════════════════════════════════════════ */
  T['sfoucault'] = {
    titolo: "Il pendolo di Foucault e la forza di Coriolis",
    sintesi: "Un pendolo libero di oscillare in ogni direzione mantiene il proprio piano di oscillazione fisso rispetto alle stelle, mentre la Terra gli ruota sotto. Visto da terra il piano ruota, in senso orario nell'emisfero nord, con velocità angolare Ω sin φ. Nel riferimento terrestre l'effetto si descrive con la forza di Coriolis, la stessa che fa deviare verso est un corpo in caduta.",
    paragrafi: [
      { titolo: "Riferimenti rotanti e forze apparenti", testo: "La Terra ruota rispetto alle stelle fisse con velocità angolare Ω = 7,2921·10⁻⁵ rad/s, un giro in un giorno siderale di 23 h 56 min 4 s. In un riferimento che ruota, le leggi di Newton valgono solo aggiungendo forze apparenti: la forza centrifuga −mΩ×(Ω×r), che dipende dalla posizione e viene di solito inglobata in g, e la forza di Coriolis −2mΩ×v, che agisce solo sui corpi in moto rispetto alla Terra ed è perpendicolare alla loro velocità. Per un moto orizzontale conta soltanto la componente verticale di Ω, Ω_z = Ω sin φ, con φ la latitudine." },
      { titolo: "Le equazioni del pendolo di Foucault", testo: "Per piccole oscillazioni il pendolo si muove quasi in un piano orizzontale. Con x verso est e y verso nord le equazioni sono ẍ = −ω₀²x + 2Ω_zẏ e ÿ = −ω₀²y − 2Ω_zẋ, con ω₀ = √(g/L). Poiché Ω_z ≪ ω₀, la soluzione è un'oscillazione rapida il cui piano ruota lentamente con velocità angolare −Ω_z, cioè in senso orario visto dall'alto nell'emisfero nord. La sezione integra queste equazioni con Runge-Kutta del quarto ordine e, per rendere visibile la rotazione in pochi secondi, permette di accelerare la Terra, lasciando però indicato il numero di ore reali." },
      { titolo: "La legge del seno", testo: "Il piano compie un giro completo in un tempo T = T_sid/sin φ, dove T_sid = 23,934 h è il giorno siderale: la velocità di rotazione è circa 15,04°·sin φ all'ora. Al polo il pendolo oscilla in un piano fisso rispetto alle stelle mentre la Terra gli gira sotto, e il piano sembra compiere un giro in un giorno siderale. All'equatore la componente verticale di Ω è nulla e il piano non ruota affatto. Nell'emisfero sud la rotazione è antioraria. A Parigi, dove Foucault presentò l'esperimento nel 1851 con un pendolo di 67 m e una sfera di 28 kg nel Panthéon, il periodo è di circa 31,8 ore." },
      { titolo: "La deviazione verso est dei gravi", testo: "La forza di Coriolis agisce anche su un corpo che cade. Nel cadere la sua velocità è verticale verso il basso, e −2Ω×v ha una componente orizzontale diretta verso est, proporzionale a cos φ. Integrando due volte, con la velocità di caduta gt, si ottiene uno spostamento verso est d = ⅓Ωg t³ cos φ, con t = √(2h/g) il tempo di caduta. Per un'altezza di 100 m alla latitudine di 45° la deviazione è di circa 1,55 cm: un effetto minuscolo ma misurabile, osservato già nell'Ottocento nei pozzi delle miniere. Nell'atmosfera e negli oceani la stessa forza, agendo su scale di centinaia di chilometri, organizza la circolazione dei cicloni." },
      { titolo: "Il pendolo vero", testo: "Il modello trascura l'attrito e assume un pendolo perfettamente simmetrico. Un pendolo reale si smorza, e piccole asimmetrie nella sospensione o un lancio non perfettamente piano producono un moto ellittico; un'orbita ellittica precede di suo, con una velocità proporzionale all'area dell'ellisse, e questo effetto può mascherare quello di Coriolis. Per questo nei musei si usano pendoli lunghi e pesanti, si lanciano con cura (Foucault bruciava il filo che tratteneva la sfera) e si aggiunge un anello di Charron che smorza l'ellitticità. Il pendolo di Foucault fu la prima dimostrazione della rotazione terrestre che non richiedeva di guardare il cielo." }
    ],
    formule: [
      ["F_Cor = −2m Ω×v", "forza di Coriolis su un corpo di massa m e velocità v nel riferimento rotante; Ω = 7,2921·10⁻⁵ rad/s"],
      ["ẍ = −ω₀²x + 2Ω_zẏ,  ÿ = −ω₀²y − 2Ω_zẋ", "equazioni del pendolo di Foucault per piccole oscillazioni; Ω_z = Ω sin φ, ω₀ = √(g/L)"],
      ["T = T_sid / sin φ,  T_sid = 23,934 h", "periodo di rotazione del piano di oscillazione alla latitudine φ"],
      ["d = ⅓ Ω g t³ cos φ,  t = √(2h/g)", "deviazione verso est di un corpo che cade dall'altezza h"]
    ],
    ipotesi: [
      "Piccole oscillazioni (moto quasi orizzontale) e assenza di attrito.",
      "Si trascurano i termini del secondo ordine in Ω e la componente orizzontale di Ω, che per piccole oscillazioni ha effetti trascurabili sul moto orizzontale.",
      "Nella caduta si trascura la resistenza dell'aria e si assume g uniforme."
    ],
    errori: [
      "Pensare che il piano ruoti di un giro ogni 24 ore a qualunque latitudine: il periodo è 23,934 h / sin φ, infinito all'equatore.",
      "Usare il giorno solare (24 h) invece del giorno siderale.",
      "Credere che la forza di Coriolis decida il verso dei vortici nel lavandino: a quelle scale è molto più piccola degli effetti della forma del recipiente e dei moti residui dell'acqua.",
      "Attribuire la rotazione a una forza che spinge il pendolo: nel riferimento delle stelle il piano resta fermo ed è il pavimento a ruotare."
    ],
    esempio: {
      testo: "A Parigi la latitudine è φ = 48,85°, quindi sin φ = 0,7530. Il piano del pendolo compie un giro in 23,934/0,7530 = 31,8 h e ruota di 15,04°·0,7530 = 11,3° all'ora. Il pendolo del Panthéon, lungo L = 67 m, ha periodo di oscillazione 2π√(67/9,81) = 16,4 s: a ogni oscillazione completa il piano ruota di circa 0,05°, abbastanza per vedere lo spostamento dopo pochi minuti. Una pietra lasciata cadere da 100 m a 45° di latitudine impiega 4,52 s e devia verso est di ⅓·7,29·10⁻⁵·9,81·4,52³·0,707 ≈ 1,55 cm.",
      risultato: "giro completo in 31,8 h (11,3°/h); deviazione di caduta ≈ 1,55 cm"
    },
    fonti: [
      "L. Foucault, Démonstration physique du mouvement de rotation de la Terre au moyen du pendule, Comptes rendus hebdomadaires des séances de l'Académie des sciences 32 (1851) 135",
      "J. R. Taylor, Classical Mechanics, University Science Books, 2005, cap. 9 (meccanica nei riferimenti non inerziali: forza di Coriolis, caduta libera, pendolo di Foucault)",
      "L. D. Landau, E. M. Lifshitz, Meccanica (Corso di fisica teorica, vol. 1), Editori Riuniti, §39 (moto in un riferimento non inerziale) e relativi problemi",
      "P. Mazzoldi, M. Nigro, C. Voci, Fisica, vol. I, EdiSES, capitolo sui moti relativi e le forze apparenti"
    ],
    collegamenti: ['sfisclima', 'sfismecc', 'sfisanalitica', 'sastroorbite']
  };

  /* ═══ 🔦 Laser e ottica quantistica ═══════════════════════════════════════ */
  T['sfislaser'] = {
    titolo: "Il laser e l'ottica quantistica: inversione, modi, Rabi e fotoni singoli",
    sintesi: "Un laser amplifica la luce per emissione stimolata in un mezzo con inversione di popolazione, chiuso in una cavità che seleziona alcune frequenze e direzioni. Le equazioni di bilancio fra atomi eccitati e fotoni spiegano la soglia, le oscillazioni di rilassamento e il bloccaggio del guadagno; i modi della cavità spiegano gli impulsi ultracorti. Con pochi atomi e pochi fotoni entrano in gioco le oscillazioni di Rabi e l'interferenza del singolo fotone.",
    paragrafi: [
      { titolo: "Emissione stimolata e inversione di popolazione", testo: "Einstein mostrò nel 1917 che, accanto all'assorbimento e all'emissione spontanea, esiste l'emissione stimolata: un fotone di frequenza risonante induce un atomo eccitato a emettere un secondo fotone identico, nella stessa direzione, fase e polarizzazione. Un mezzo amplifica la luce solo se gli atomi nello stato superiore sono più numerosi di quelli nello stato inferiore, una condizione impossibile all'equilibrio termico. In un sistema a tre livelli, come il rubino, il livello inferiore è il fondamentale e bisogna pompare più della metà degli atomi; in uno a quattro livelli il livello inferiore della transizione laser si svuota rapidamente e l'inversione si ottiene con una pompa molto più bassa." },
      { titolo: "Equazioni di bilancio, soglia e oscillazioni di rilassamento", testo: "Nella sezione il laser a quattro livelli è descritto in unità ridotte da dn/dt = x − n − ns e ds/dt = r(n − 1)s + εn, con n inversione in unità del valore di soglia, s numero di fotoni, x pompa in unità della soglia, r rapporto fra la vita del livello superiore e quella dei fotoni in cavità, e il termine εn che rappresenta l'emissione spontanea nel modo. Sotto soglia (x < 1) i fotoni restano pochi; sopra soglia lo stato stazionario ha n = 1 e s = x − 1: l'inversione resta bloccata al valore di soglia e tutta la pompa in più diventa luce, che cresce linearmente con x. Il sistema arriva all'equilibrio con oscillazioni di rilassamento smorzate, di pulsazione circa √(r(x − 1)) in unità di 1/τ." },
      { titolo: "Modi longitudinali e impulsi a modi bloccati", testo: "In una cavità di lunghezza L l'onda stazionaria deve contenere un numero intero di mezze lunghezze d'onda: le frequenze permesse sono ν_q = qc/(2L), separate da Δν = c/(2L). Oscillano solo i modi per cui il guadagno, che ha la forma della riga atomica allargata per effetto Doppler, supera le perdite. Se i modi oscillano con fasi casuali l'intensità fluttua in modo irregolare; se le fasi sono bloccate, la loro somma è un treno di impulsi con periodo 2L/c, il tempo di un andata e ritorno, e durata circa 1/(NΔν) ≈ 2L/(cN), con N numero di modi in fase. Molti modi su una banda larga danno impulsi brevissimi: è il principio dei laser a femtosecondi." },
      { titolo: "Atomo a due livelli e oscillazioni di Rabi", testo: "Un atomo a due livelli illuminato da un campo coerente non assorbe e basta: oscilla fra i due stati. In risonanza la probabilità di trovarlo eccitato è sin²(Ωt/2), con Ω frequenza di Rabi proporzionale al campo e al momento di dipolo della transizione. Con un disaccordo Δ fra la frequenza del campo e quella atomica l'oscillazione è più rapida e incompleta, P(t) = (Ω²/Ω_R²) sin²(Ω_Rt/2) con Ω_R = √(Ω² + Δ²). Lo stato si rappresenta con il vettore di Bloch, che precede sulla sfera attorno a un asse fissato da Ω e Δ. Il rilassamento delle popolazioni (tempo T₁) e la perdita di coerenza (T₂ ≤ 2T₁) lo fanno spiraleggiare verso l'interno e smorzano le oscillazioni." },
      { titolo: "Fotoni singoli nell'interferometro di Mach-Zehnder", testo: "Nell'interferometro di Mach-Zehnder un primo divisore di fascio separa la luce su due cammini, un secondo la ricombina verso due rivelatori. Inviando fotoni uno alla volta, ciascuno fa scattare un solo rivelatore, in un punto imprevedibile; ma accumulando i conteggi la frazione che arriva al primo rivelatore segue cos²(φ/2), con φ la differenza di fase fra i cammini. Ogni fotone interferisce con sé stesso, come mostrarono Grangier, Roger e Aspect nel 1986. Se si ricava, anche solo in parte, l'informazione sul cammino seguito, le frange si attenuano: visibilità V e distinguibilità D obbediscono alla disuguaglianza V² + D² ≤ 1 (Englert, 1996), una forma quantitativa della complementarità." }
    ],
    formule: [
      ["dn/dt = x − n − ns,  ds/dt = r(n − 1)s + εn", "equazioni di bilancio del laser a quattro livelli in unità ridotte (tempo in unità della vita τ del livello superiore)"],
      ["n = 1,  s = x − 1  (x > 1)", "stato stazionario sopra soglia: inversione bloccata e potenza lineare nella pompa"],
      ["ν_q = qc/(2L),  Δν = c/(2L)", "frequenze dei modi longitudinali di una cavità di lunghezza L e loro spaziatura"],
      ["P(t) = (Ω²/Ω_R²) sin²(Ω_Rt/2),  Ω_R = √(Ω² + Δ²)", "oscillazioni di Rabi con disaccordo Δ; Ω frequenza di Rabi (rad/s)"],
      ["P₁ = cos²(φ/2),  V² + D² ≤ 1", "probabilità di conteggio al primo rivelatore del Mach-Zehnder e relazione fra visibilità e distinguibilità"]
    ],
    ipotesi: [
      "Equazioni di bilancio: un solo modo, mezzo omogeneo, nessuna coerenza fra atomo e campo (approssimazione valida quando T₂ è molto breve).",
      "Modi bloccati: ampiezze uguali e fasi esattamente allineate; nei laser reali lo spettro ha una forma e l'impulso una durata legata alla larghezza di banda.",
      "Atomo a due livelli: approssimazione dell'onda rotante e di dipolo, campo classico e monocromatico.",
      "Mach-Zehnder: divisori 50:50 ideali e rivelatori perfetti."
    ],
    errori: [
      "Pensare che più pompa aumenti l'inversione oltre la soglia: sopra soglia l'inversione resta bloccata e cresce solo il numero di fotoni.",
      "Credere che un laser emetta una sola frequenza: senza elementi selettivi può oscillare su più modi longitudinali.",
      "Interpretare le oscillazioni di Rabi come assorbimento ed emissione spontanea: sono un'evoluzione coerente e reversibile.",
      "Pensare che nel Mach-Zehnder il fotone si divida in due mezzi fotoni: ogni rivelazione registra un fotone intero, e l'interferenza riguarda le ampiezze di probabilità."
    ],
    esempio: {
      testo: "Un laser He-Ne ha una cavità lunga L = 30 cm. La spaziatura dei modi è Δν = c/(2L) = 2,998·10⁸/(0,60) = 500 MHz. La curva di guadagno della riga a 632,8 nm, allargata per effetto Doppler, è larga circa 1,5 GHz, quindi possono oscillare circa tre modi. Se le fasi fossero bloccate, l'uscita sarebbe un treno di impulsi con periodo 2L/c = 2,0 ns e durata dell'ordine di 2,0/3 ≈ 0,7 ns.",
      risultato: "Δν ≈ 500 MHz, circa 3 modi, periodo degli impulsi 2,0 ns"
    },
    fonti: [
      "A. E. Siegman, Lasers, University Science Books, 1986, capitoli sulle equazioni di bilancio, sulle oscillazioni di rilassamento, sui modi di cavità e sul mode locking",
      "O. Svelto, Principles of Lasers, Springer, 5ª ed., 2010, capitoli sull'interazione radiazione-materia, sui sistemi a tre e quattro livelli e sul comportamento dinamico",
      "L. Allen, J. H. Eberly, Optical Resonance and Two-Level Atoms, Wiley, 1975 (ristampa Dover), capitoli sulle oscillazioni di Rabi e sulle equazioni di Bloch",
      "P. Grangier, G. Roger, A. Aspect, Experimental Evidence for a Photon Anticorrelation Effect on a Beam Splitter: A New Light on Single-Photon Interferences, Europhysics Letters 1 (1986) 173",
      "B.-G. Englert, Fringe Visibility and Which-Way Information: An Inequality, Physical Review Letters 77 (1996) 2154"
    ],
    collegamenti: ['sfisonde', 'sfisspin', 'sschrod', 'suvvis', 'sfisem']
  };

  /* ═══ 🌍 Fisica del clima ═════════════════════════════════════════════════ */
  T['sfisclima'] = {
    titolo: "Bilancio radiativo, effetto serra e retroazioni del clima",
    sintesi: "La temperatura di un pianeta è fissata dall'equilibrio fra la radiazione solare assorbita e quella infrarossa emessa. Senza atmosfera la Terra avrebbe circa 255 K; l'effetto serra, dovuto a gas che assorbono nell'infrarosso, porta la superficie a circa 288 K. Modelli a zero dimensioni mostrano il ruolo della CO₂, la sensibilità climatica e le retroazioni come quella fra ghiaccio e albedo, che può produrre più climi di equilibrio.",
    paragrafi: [
      { titolo: "Temperatura efficace di un pianeta", testo: "La Terra intercetta la radiazione solare con la sezione del disco, πR², e la riemette da tutta la superficie della sfera, 4πR². Con la costante solare S = 1361 W/m² e l'albedo α, la frazione riflessa, l'equilibrio dà σT_e⁴ = S(1 − α)/4, cioè T_e = [S(1 − α)/(4σ)]^(1/4). Per α = 0,30 si ottiene T_e ≈ 255 K, circa −18 °C: è la temperatura a cui la Terra irraggia verso lo spazio, non quella della superficie. Per Marte (1,524 UA, α ≈ 0,25) lo stesso calcolo dà circa 210 K, vicino al valore osservato perché la sua atmosfera è sottilissima; per Venere (0,723 UA, α ≈ 0,76) dà circa 230 K, mentre la superficie è a 737 K." },
      { titolo: "Modelli dell'effetto serra", testo: "Un'atmosfera trasparente alla luce solare ma opaca all'infrarosso assorbe la radiazione della superficie e la riemette metà verso l'alto e metà verso il basso. Con n strati completamente opachi, imponendo l'equilibrio di ciascuno, la superficie raggiunge T_s = T_e(n + 1)^(1/4): con uno strato 303 K, troppo. Un modello più realistico usa un solo strato grigio che assorbe una frazione ε dell'infrarosso; allora T_s = T_e[2/(2 − ε)]^(1/4), e con ε ≈ 0,78 si ottiene 288 K, la temperatura media osservata. Sono modelli didattici: nell'atmosfera reale la temperatura diminuisce con la quota per la convezione, ed è proprio questo gradiente a rendere efficace l'effetto serra." },
      { titolo: "Forzante della CO₂ e sensibilità climatica", testo: "Aumentare la CO₂ riduce la radiazione infrarossa che sfugge nello spazio: lo squilibrio, chiamato forzante radiativa, è ben approssimato da ΔF = 5,35 ln(C/C₀) W/m² (Myhre e collaboratori, 1998), che per un raddoppio vale 3,71 W/m². La dipendenza è logaritmica perché il centro della banda di assorbimento a 15 μm è già saturo e conta l'allargamento delle ali. Il riscaldamento di equilibrio è ΔT = λΔF, con λ parametro di sensibilità che riassume tutte le retroazioni (vapore acqueo, gradiente termico verticale, albedo, nubi). Senza retroazioni λ sarebbe circa 0,3 K/(W/m²); il valore reale è incerto soprattutto per le nubi, e l'IPCC AR6 indica per il raddoppio un intervallo probabile di 2,5–4 °C, con miglior stima 3 °C." },
      { titolo: "Retroazione ghiaccio-albedo e Terra a palla di neve", testo: "Se la superficie si raffredda, il ghiaccio si estende, l'albedo cresce e il pianeta assorbe meno energia: una retroazione positiva. Nel modello della sezione, C dT/dt = (S/4)(1 − α(T)) − εσT⁴, l'albedo passa con continuità da 0,7 (ghiaccio) a 0,3 (oceano) attorno a 265 K, e ε = 0,61 riproduce una temperatura di circa 287 K con l'attuale costante solare. Per valori intermedi di S esistono due equilibri stabili, uno caldo e uno glaciale, separati da uno instabile. Se il Sole si indebolisce oltre un punto di sella-nodo il clima caldo scompare e la Terra precipita nello stato glaciale; per uscirne non basta tornare al valore iniziale di S: serve un forzamento molto maggiore. È un ciclo di isteresi, come quello proposto da Budyko e Sellers nel 1969." },
      { titolo: "Coriolis e la circolazione su un pianeta che ruota", testo: "Un disco lanciato su una piattaforma rotante procede in linea retta per un osservatore esterno, ma chi ruota con la piattaforma lo vede curvare: nel riferimento rotante compare la forza di Coriolis −2mΩ×v. Sulla Terra la componente rilevante per i moti orizzontali è quella verticale, che dà il parametro di Coriolis f = 2Ω sin φ: i corpi in moto deviano a destra nell'emisfero nord e a sinistra in quello sud. Un fluido spinto e poi lasciato libero descrive oscillazioni inerziali circolari di periodo 2π/f, circa 17 ore a 45° di latitudine. Su scala sinottica questa forza, bilanciata dal gradiente di pressione, fa ruotare i venti attorno ai cicloni anziché farli convergere direttamente al centro." }
    ],
    formule: [
      ["T_e = [S(1 − α)/(4σ)]^(1/4)", "temperatura efficace; S costante solare (1361 W/m² per la Terra), α albedo, σ = 5,670374419·10⁻⁸ W/(m²K⁴)"],
      ["T_s = T_e (n + 1)^(1/4),  T_s = T_e [2/(2 − ε)]^(1/4)", "temperatura superficiale con n strati opachi all'infrarosso o con uno strato di emissività ε"],
      ["ΔF = 5,35 ln(C/C₀) W/m²", "forzante radiativa della CO₂ (C₀ = 280 ppm preindustriale); 3,71 W/m² per un raddoppio"],
      ["ΔT = λ ΔF", "riscaldamento di equilibrio; λ parametro di sensibilità climatica in K/(W/m²)"],
      ["C dT/dt = (S/4)(1 − α(T)) − εσT⁴", "modello di bilancio energetico a zero dimensioni con albedo dipendente dalla temperatura; C capacità termica per unità di area (J/(m²K))"],
      ["f = 2Ω sin φ", "parametro di Coriolis; Ω = 7,2921·10⁻⁵ rad/s, φ latitudine"]
    ],
    ipotesi: [
      "Modelli a zero dimensioni: un'unica temperatura media per tutto il pianeta, nessun trasporto di calore fra equatore e poli.",
      "Gli strati dell'effetto serra sono isotermi e grigi; l'atmosfera reale ha bande di assorbimento e un gradiente verticale di temperatura.",
      "La formula logaritmica della forzante vale in un intervallo ragionevole di concentrazioni (circa fino a qualche volta il valore preindustriale).",
      "Lo scenario di CO₂ della sezione è illustrativo (eccesso sopra 280 ppm che cresce in modo esponenziale), non una proiezione IPCC; il ΔT calcolato è di equilibrio, mentre quello effettivo arriva con decenni di ritardo per l'inerzia termica degli oceani."
    ],
    errori: [
      "Dividere la costante solare per 2 o per π invece che per 4: il rapporto fra sezione del disco e superficie della sfera è 1/4.",
      "Pensare che l'effetto serra sia il calore intrappolato come in una serra di vetro: l'atmosfera assorbe e riemette infrarosso, e la superficie riceve anche la radiazione che l'atmosfera emette verso il basso.",
      "Credere che, essendo la banda della CO₂ satura al centro, altra CO₂ non abbia effetto: la forzante cresce con il logaritmo della concentrazione, non si annulla.",
      "Confondere la sensibilità climatica di equilibrio con il riscaldamento già osservato."
    ],
    esempio: {
      testo: "Con S = 1361 W/m² e α = 0,30 si ha T_e = [1361·0,70/(4·5,6704·10⁻⁸)]^(1/4) = (4,200·10⁹)^(1/4) = 254,6 K. Con uno strato di emissività ε = 0,78: T_s = 254,6·(2/1,22)^(1/4) = 254,6·1,1316 = 288,1 K. Raddoppiando la CO₂ la forzante è ΔF = 5,35·ln 2 = 3,71 W/m²; con un parametro di sensibilità λ = 0,8 K/(W/m²) il riscaldamento di equilibrio è ΔT = 0,8·3,71 = 3,0 K, al centro dell'intervallo probabile IPCC.",
      risultato: "T_e ≈ 255 K, T_s ≈ 288 K, ΔT(2×CO₂) ≈ 3,0 K con λ = 0,8 K/(W/m²)"
    },
    fonti: [
      "R. T. Pierrehumbert, Principles of Planetary Climate, Cambridge University Press, 2010, cap. 3 (bilancio radiativo, retroazione ghiaccio-albedo e Terra a palla di neve) e cap. 4 (trasferimento radiativo nell'infrarosso)",
      "D. L. Hartmann, Global Physical Climatology, Elsevier, 2ª ed., 2016, cap. 2 (bilancio energetico globale) e cap. 10 (sensibilità climatica e retroazioni)",
      "G. Myhre, E. J. Highwood, K. P. Shine, F. Stordal, New estimates of radiative forcing due to well mixed greenhouse gases, Geophysical Research Letters 25 (1998) 2715",
      "IPCC, Climate Change 2021: The Physical Science Basis, contributo del Working Group I al Sixth Assessment Report, cap. 7 (bilancio energetico, retroazioni e sensibilità climatica)",
      "M. I. Budyko, The effect of solar radiation variations on the climate of the Earth, Tellus 21 (1969) 611"
    ],
    collegamenti: ['sfoucault', 'sfiscalore', 'sfistermo', 'sastrosole', 'sirvis']
  };

  /* ═══ 🌊 Schrödinger ══════════════════════════════════════════════════════ */
  T['sschrod'] = {
    titolo: "L'equazione di Schrödinger risolta numericamente",
    sintesi: "L'equazione di Schrödinger determina gli stati stazionari e l'evoluzione nel tempo di una particella quantistica. Solo pochi potenziali hanno soluzioni esatte; per gli altri si discretizza lo spazio su una griglia e il problema diventa quello degli autovalori di una matrice. La sezione risolve così buche, oscillatori, il potenziale di Morse delle molecole e la barriera, e confronta ogni risultato numerico con la soluzione esatta o con il dato sperimentale.",
    paragrafi: [
      { titolo: "Stati stazionari e quantizzazione", testo: "In una dimensione l'equazione indipendente dal tempo è −(ħ²/2μ)ψ'' + V(x)ψ = Eψ. Per una particella confinata solo valori discreti di E danno soluzioni normalizzabili: è l'origine della quantizzazione. L'n-esimo stato legato, contando da zero, ha n nodi, e la sua energia cresce con il numero di oscillazioni della funzione d'onda. Nella buca infinita di larghezza L i livelli sono E_n = n²π²ħ²/(2μL²), con n = 1, 2, …, e si allargano al crescere di n; nell'oscillatore armonico sono equispaziati, E_v = ħω(v + ½); nel potenziale di Morse, che descrive un legame chimico che si può rompere, si addensano verso il limite di dissociazione, E_v = ω_e(v + ½) − ω_ex_e(v + ½)²." },
      { titolo: "Il metodo delle differenze finite", testo: "Su una griglia di passo dx la derivata seconda si approssima con (ψ_{i+1} − 2ψ_i + ψ_{i−1})/dx², con errore proporzionale a dx². L'hamiltoniano diventa una matrice tridiagonale simmetrica: sulla diagonale 2B/dx² + V(x_i), fuori diagonale −B/dx², con B = ħ²/(2μ) che vale ½ in unità atomiche e 16,8576/μ cm⁻¹·Å² per una molecola di massa ridotta μ in unità di massa atomica. Gli autovalori più bassi si trovano con la bisezione di Sturm, che conta quanti autovalori stanno sotto una soglia dai cambi di segno di una successione di minori; gli autovettori con l'iterazione inversa. L'errore sui livelli decresce come dx² e cresce con n, perché gli stati alti oscillano più rapidamente sulla griglia." },
      { titolo: "Evoluzione temporale con Crank-Nicolson", testo: "L'equazione dipendente dal tempo, iħ ∂ψ/∂t = Hψ, ha soluzione formale ψ(t) = e^(−iHt/ħ)ψ(0). Lo schema di Crank-Nicolson approssima l'esponenziale con (1 + iHΔt/2ħ)⁻¹(1 − iHΔt/2ħ), che è una matrice unitaria: la norma della funzione d'onda si conserva esattamente, a meno degli arrotondamenti, e lo schema è stabile per ogni Δt e accurato al secondo ordine. A ogni passo si risolve un sistema tridiagonale complesso con l'algoritmo di Thomas. Così si segue un pacchetto d'onda che urta una barriera: una parte è riflessa e una parte, anche se l'energia media è inferiore all'altezza della barriera, passa per effetto tunnel." },
      { titolo: "Effetto tunnel e doppia buca", testo: "Per una barriera rettangolare di altezza V₀ e larghezza a, una particella con E < V₀ ha nella barriera una funzione d'onda che decresce come e^(−κx), con κ = √(2μ(V₀ − E))/ħ, e la probabilità di trasmissione per barriere spesse è circa proporzionale a e^(−2κa). Il risultato esatto contiene anche risonanze di trasmissione per E > V₀. In una doppia buca simmetrica i livelli vengono a coppie: lo stato simmetrico e quello antisimmetrico, separati da una differenza di energia che decresce in modo esponenziale con l'altezza della barriera. Una particella localizzata in una buca oscilla fra le due con la frequenza di questa separazione: è l'inversione dell'ammoniaca, a circa 23,8 GHz, la transizione del primo maser." },
      { titolo: "Tre dimensioni e sovrapposizioni", testo: "Se il potenziale è separabile, V = V(x) + V(y) + V(z), la funzione d'onda è il prodotto di tre funzioni unidimensionali e l'energia la somma delle tre energie. Stati diversi possono avere la stessa energia: nella scatola cubica i livelli (2,1,1), (1,2,1) e (1,1,2) sono degeneri, e la degenerazione riflette la simmetria del potenziale. Un singolo stato stazionario ha densità di probabilità ferma nel tempo; una sovrapposizione di due stati di energie E₁ ed E₂ produce invece una densità che oscilla con pulsazione (E₂ − E₁)/ħ, ed è questa oscillazione che, per una particella carica, accoppia l'atomo alla radiazione." }
    ],
    formule: [
      ["−(ħ²/2μ) ψ'' + V(x) ψ = E ψ", "equazione di Schrödinger indipendente dal tempo in una dimensione; ħ = 1,054571817·10⁻³⁴ J·s, μ massa (o massa ridotta)"],
      ["E_n = n²π²ħ²/(2μL²) = n²h²/(8μL²)", "livelli della buca infinita di larghezza L, n = 1, 2, 3…"],
      ["E_v = ħω(v + ½),  ω = √(k/μ)", "livelli dell'oscillatore armonico di costante elastica k, v = 0, 1, 2…"],
      ["E_v = ω_e(v + ½) − ω_ex_e(v + ½)²,  ω_e = 2a√(BD_e),  ω_ex_e = ω_e²/(4D_e)", "livelli esatti del potenziale di Morse V = D_e(1 − e^(−a(r − r_e)))², con B = ħ²/(2μ) nelle stesse unità"],
      ["(1 + iHΔt/2ħ) ψⁿ⁺¹ = (1 − iHΔt/2ħ) ψⁿ", "schema di Crank-Nicolson, unitario e stabile"],
      ["T ≈ e^(−2κa),  κ = √(2μ(V₀ − E))/ħ", "trasmissione approssimata per effetto tunnel attraverso una barriera spessa"]
    ],
    ipotesi: [
      "Meccanica quantistica non relativistica, particella senza spin in un potenziale assegnato; per le molecole si usa l'approssimazione di Born-Oppenheimer.",
      "La griglia è finita: la funzione d'onda è forzata a zero ai bordi, quindi gli stati troppo estesi o quelli del continuo sono rappresentati male.",
      "Il potenziale di Morse è un modello: riproduce bene i livelli bassi delle biatomiche, meno quelli vicini alla dissociazione."
    ],
    errori: [
      "Pensare che nello stato fondamentale dell'oscillatore la particella sia ferma sul fondo: ha energia di punto zero ħω/2, conseguenza del principio di indeterminazione.",
      "Credere che l'effetto tunnel faccia «perdere energia» alla particella dentro la barriera: l'energia è la stessa, è l'ampiezza della funzione d'onda a ridursi.",
      "Ritenere che uno stato stazionario non abbia moto: la densità di probabilità è ferma, ma la particella ha energia cinetica media non nulla.",
      "Fidarsi dei livelli numerici alti con una griglia grossolana: l'errore cresce con il numero di nodi."
    ],
    esempio: {
      testo: "Un elettrone (m = 9,1093837·10⁻³¹ kg) è confinato in una buca infinita larga L = 1,00 nm. Il livello fondamentale è E₁ = h²/(8mL²) = (6,62607·10⁻³⁴)²/(8·9,10938·10⁻³¹·10⁻¹⁸) = 6,025·10⁻²⁰ J = 0,376 eV. Il primo eccitato è E₂ = 4E₁ = 1,504 eV, e la transizione 1 → 2 richiede 3E₁ = 1,128 eV, cioè un fotone di lunghezza d'onda λ = hc/ΔE = 1099 nm, nel vicino infrarosso. Il modello è la base qualitativa dell'assorbimento dei polieni coniugati e dei punti quantici.",
      risultato: "E₁ ≈ 0,376 eV, ΔE₁→₂ ≈ 1,13 eV, λ ≈ 1,10 μm"
    },
    fonti: [
      "D. J. Griffiths, Introduction to Quantum Mechanics, Cambridge University Press, 3ª ed., cap. 2 (equazione di Schrödinger indipendente dal tempo: buca infinita, oscillatore armonico, barriere e diffusione) e cap. 4 (tre dimensioni)",
      "J. J. Sakurai, J. Napolitano, Modern Quantum Mechanics, Cambridge University Press, 3ª ed., cap. 2 (dinamica quantistica, oscillatore armonico, evoluzione temporale)",
      "W. H. Press, S. A. Teukolsky, W. T. Vetterling, B. P. Flannery, Numerical Recipes, Cambridge University Press, 3ª ed., cap. 11 (autovalori di matrici tridiagonali) e cap. 20 (schema di Crank-Nicolson per l'equazione di Schrödinger)",
      "P. M. Morse, Diatomic molecules according to the wave mechanics. II. Vibrational levels, Physical Review 34 (1929) 57",
      "A. Goldberg, H. M. Schey, J. L. Schwartz, Computer-Generated Motion Pictures of One-Dimensional Quantum-Mechanical Transmission and Reflection Phenomena, American Journal of Physics 35 (1967) 177"
    ],
    collegamenti: ['sqm', 'srotovib', 'shf', 'smatlin', 'sfisspin']
  };

  /* ═══ 🧮 Hartree-Fock ═════════════════════════════════════════════════════ */
  T['shf'] = {
    titolo: "Il metodo di Hartree-Fock e il campo autoconsistente",
    sintesi: "Il metodo di Hartree-Fock approssima la funzione d'onda di molti elettroni con un solo determinante di Slater: ogni elettrone si muove nel campo medio degli altri, che dipende a sua volta dagli orbitali. Espandendo gli orbitali su una base di gaussiane, il problema diventa l'equazione matriciale di Roothaan-Hall, risolta per iterazioni fino all'autoconsistenza. È il punto di partenza di tutta la chimica quantistica ab initio.",
    paragrafi: [
      { titolo: "Dall'hamiltoniano molecolare al determinante di Slater", testo: "Nell'approssimazione di Born-Oppenheimer i nuclei sono fermi e l'hamiltoniano elettronico contiene l'energia cinetica degli elettroni, la loro attrazione verso i nuclei e la repulsione reciproca. Proprio quest'ultimo termine impedisce di separare il problema in elettroni indipendenti. Hartree-Fock cerca la migliore funzione d'onda della forma di un determinante di Slater, che è antisimmetrica per lo scambio di due elettroni e quindi rispetta il principio di Pauli. Minimizzando l'energia rispetto agli orbitali si ottengono le equazioni di Hartree-Fock: ogni orbitale è autofunzione di un operatore di Fock che contiene un termine coulombiano J, la repulsione media degli altri elettroni, e un termine di scambio K, senza analogo classico, che nasce dall'antisimmetria." },
      { titolo: "Le equazioni di Roothaan-Hall", testo: "Scrivendo ogni orbitale molecolare come combinazione lineare di funzioni di base, ψᵢ = Σ C_μi φ_μ, le equazioni diventano FC = SCε, con S matrice di sovrapposizione, C coefficienti ed ε energie orbitali. Nel caso ristretto a guscio chiuso (RHF) la matrice di Fock è F_μν = H_μν + Σ P_λσ[(μν|σλ) − ½(μλ|σν)], dove H è l'hamiltoniano del nucleo e P = 2Σ_occ C C* la matrice densità. Poiché F dipende da P, che dipende dagli orbitali, si procede per iterazioni: si parte da una stima (qui gli autovettori dell'hamiltoniano del nucleo), si ortogonalizza la base con S^(−1/2), si diagonalizza F, si costruisce la nuova densità e si ripete finché energia e densità non cambiano più. Il metodo DIIS di Pulay estrapola dalle iterazioni precedenti e accelera molto la convergenza." },
      { titolo: "La base STO-3G e gli integrali", testo: "Gli orbitali atomici di Slater, e^(−ζr), descrivono bene la cuspide al nucleo e la coda esponenziale, ma i loro integrali a molti centri sono difficili. Le gaussiane e^(−αr²) hanno la proprietà che il prodotto di due gaussiane centrate in punti diversi è un'altra gaussiana centrata in un punto intermedio, e questo rende gli integrali analitici. La base minima STO-3G approssima ogni orbitale di Slater con una combinazione fissa di tre gaussiane (Hehre, Stewart e Pople, 1969). Lo schema di McMurchie-Davidson sviluppa i prodotti in gaussiane di Hermite e riduce gli integrali coulombiani alla funzione di Boys F_n(T) = ∫₀¹ t^(2n) e^(−Tt²) dt. Gli integrali a due elettroni crescono come N⁴, con N numero di funzioni di base, e sono il costo dominante del calcolo." },
      { titolo: "Che cosa si ottiene e che cosa manca", testo: "L'energia di Hartree-Fock è un limite superiore dell'energia esatta (principio variazionale) e migliora allargando la base fino al limite di Hartree-Fock. Per H₂ a 1,4 bohr la base STO-3G dà −1,1167 Eh, il limite di Hartree-Fock è circa −1,1336 Eh e l'energia esatta non relativistica −1,1745 Eh: la differenza fra gli ultimi due è l'energia di correlazione, che il campo medio per costruzione non contiene. RHF descrive male la rottura dei legami: H₂ dissocia in una miscela di atomi neutri e ioni H⁺ + H⁻, con energia troppo alta. Per il teorema di Koopmans l'opposto dell'energia dell'orbitale occupato più alto è una stima del potenziale di ionizzazione, spesso buona perché gli errori di rilassamento e di correlazione si compensano in parte." },
      { titolo: "Orbitali in tre dimensioni", testo: "Gli orbitali molecolari canonici si visualizzano come isosuperfici: si sceglie un valore c tale che la regione |ψ| > c racchiuda una frazione assegnata della probabilità e si disegnano le superfici ψ = +c e ψ = −c con colori diversi, perché il segno dell'orbitale conta per la sovrapposizione e le simmetrie. I nodi separano lobi di segno opposto: l'orbitale legante σ di H₂ non ha piani nodali fra i nuclei, l'antilegante σ* ne ha uno. Gli orbitali canonici non sono l'unica scelta: qualunque rotazione unitaria fra orbitali occupati lascia invariati il determinante e l'energia, e orbitali localizzati descrivono meglio i legami della chimica classica." }
    ],
    formule: [
      ["FC = SCε", "equazioni di Roothaan-Hall: F matrice di Fock, S sovrapposizione, C coefficienti, ε energie orbitali (Eh)"],
      ["F_μν = H_μν + Σ_λσ P_λσ [(μν|σλ) − ½(μλ|σν)]", "matrice di Fock a guscio chiuso; (μν|λσ) integrali di repulsione a due elettroni"],
      ["P_λσ = 2 Σ_a^occ C_λa C_σa", "matrice densità per orbitali doppiamente occupati"],
      ["E = ½ Σ_μν P_μν (H_μν + F_μν) + V_nn", "energia totale RHF; V_nn repulsione fra i nuclei"],
      ["F_n(T) = ∫₀¹ t^(2n) e^(−Tt²) dt", "funzione di Boys, alla base degli integrali coulombiani fra gaussiane"],
      ["IP ≈ −ε_HOMO", "teorema di Koopmans; 1 Eh = 27,211386 eV"]
    ],
    ipotesi: [
      "Approssimazione di Born-Oppenheimer, hamiltoniano non relativistico, nessuna correlazione elettronica oltre allo scambio.",
      "RHF a guscio chiuso: tutti gli orbitali occupati da due elettroni; radicali e stati di tripletto richiedono UHF o ROHF.",
      "STO-3G è una base minima: le energie assolute sono lontane dal limite di Hartree-Fock e le proprietà vanno prese come qualitative."
    ],
    errori: [
      "Confondere energia elettronica ed energia totale: la seconda include la repulsione fra i nuclei.",
      "Pensare che l'energia totale sia la somma delle energie orbitali: quella somma conta due volte la repulsione fra elettroni.",
      "Credere che una base più grande dia sempre risultati più vicini all'esperimento: avvicina al limite di Hartree-Fock, ma la correlazione mancante resta.",
      "Interpretare il segno di un orbitale come una carica: è una fase, e cambia se si moltiplica l'orbitale per −1."
    ],
    esempio: {
      testo: "Per H₂ con la base STO-3G alla distanza R = 1,4 bohr il calcolo dà un'energia totale di −1,116714 Eh. La repulsione fra i nuclei è V_nn = 1/R = 0,714286 Eh, quindi l'energia elettronica è −1,116714 − 0,714286 = −1,831000 Eh. L'orbitale occupato σ_g ha energia ε₁ ≈ −0,578 Eh: per il teorema di Koopmans il potenziale di ionizzazione stimato è 0,578·27,2114 = 15,7 eV; sperimentalmente la ionizzazione adiabatica richiede 15,43 eV e quella verticale, a cui il teorema di Koopmans va propriamente confrontato, circa 16 eV.",
      risultato: "E_el = −1,8310 Eh; IP (Koopmans) ≈ 15,7 eV"
    },
    fonti: [
      "A. Szabo, N. S. Ostlund, Modern Quantum Chemistry, Dover, 1996, cap. 3 (l'approssimazione di Hartree-Fock, equazioni di Roothaan, calcoli su H₂ e HeH⁺ in base STO-3G)",
      "T. Helgaker, P. Jørgensen, J. Olsen, Molecular Electronic-Structure Theory, Wiley, 2000, cap. 9 (integrali molecolari, schema di McMurchie-Davidson, funzione di Boys) e cap. 10 (teoria di Hartree-Fock)",
      "W. J. Hehre, R. F. Stewart, J. A. Pople, Self-Consistent Molecular-Orbital Methods. I. Use of Gaussian Expansions of Slater-Type Atomic Orbitals, Journal of Chemical Physics 51 (1969) 2657",
      "L. E. McMurchie, E. R. Davidson, One- and two-electron integrals over Cartesian Gaussian functions, Journal of Computational Physics 26 (1978) 218",
      "P. Pulay, Convergence acceleration of iterative sequences. The case of SCF iteration, Chemical Physics Letters 73 (1980) 393"
    ],
    collegamenti: ['sschrod', 'smo', 'smorb', 'sqm', 'smatlin']
  };

  /* ═══ 🎻 Rotovibrazionale ═════════════════════════════════════════════════ */
  T['srotovib'] = {
    titolo: "Spettroscopia rotovibrazionale delle molecole biatomiche",
    sintesi: "Lo spettro infrarosso di una molecola biatomica in fase gassosa non è una banda continua, ma una serie di righe: ogni transizione vibrazionale è accompagnata da un salto del numero quantico rotazionale J. Le posizioni delle righe derivano dalle costanti molecolari ω_e, ω_ex_e, B_e, α_e e D; le intensità dalla popolazione di Boltzmann dei livelli rotazionali. Dalle righe si ricavano a ritroso la costante rotazionale e la lunghezza di legame.",
    paragrafi: [
      { titolo: "Livelli di vibrazione e rotazione", testo: "Una molecola biatomica vibra come un oscillatore anarmonico e ruota come un rotatore quasi rigido. In numeri d'onda i termini vibrazionali sono G(v) = ω_e(v + ½) − ω_ex_e(v + ½)², con livelli che si avvicinano salendo; quelli rotazionali sono F_v(J) = B_vJ(J + 1) − DJ²(J + 1)², dove B_v = h/(8π²cμr²) mediato sulla vibrazione e D tiene conto della distorsione centrifuga. Poiché nei livelli vibrazionali più alti la distanza media fra gli atomi aumenta, B_v diminuisce secondo B_v = B_e − α_e(v + ½). Le energie vibrazionali sono dell'ordine di migliaia di cm⁻¹, quelle rotazionali di pochi o decine di cm⁻¹: a temperatura ambiente quasi tutte le molecole sono in v = 0 ma distribuite su molti livelli J." },
      { titolo: "Regole di selezione e rami P e R", testo: "Una transizione nell'infrarosso richiede che il momento di dipolo cambi durante la vibrazione: le omonucleari come N₂ e O₂ non hanno spettro rotovibrazionale di dipolo. Per una biatomica in uno stato elettronico ¹Σ la regola di selezione è ΔJ = ±1, senza ramo Q. Le righe con ΔJ = +1 formano il ramo R, a numeri d'onda più alti dell'origine della banda ν₀, quelle con ΔJ = −1 il ramo P, a numeri d'onda più bassi; al centro rimane un vuoto dove cadrebbe la riga J = 0 → 0. Poiché B₁ < B₀, le righe del ramo R si infittiscono e quelle del ramo P si allargano allontanandosi dal centro. L'anarmonicità permette anche le sovratoni Δv = 2, 3, molto più deboli." },
      { titolo: "Intensità e temperatura", testo: "L'intensità di una riga è proporzionale alla popolazione del livello di partenza, (2J + 1)e^(−hcF(J)/kT), moltiplicata per un fattore di Hönl-London che dipende da J. Il fattore di degenerazione cresce con J mentre l'esponenziale decresce, e la popolazione è massima intorno a J_max ≈ √(kT/(2hcB)) − ½. Dalla forma dell'inviluppo dei rami si può quindi stimare la temperatura del gas. Le molecole con B piccolo, come CO, mostrano molte righe ravvicinate; quelle leggere come HCl poche righe ben separate." },
      { titolo: "Effetti isotopici e statistica di spin nucleare", testo: "Sostituendo un isotopo cambia la massa ridotta μ ma non il potenziale. Ne segue che ω_e ∝ μ^(−1/2), B ∝ μ^(−1), α_e ∝ μ^(−3/2) e D ∝ μ^(−2): lo spettro di H³⁷Cl è una copia leggermente spostata di quello di H³⁵Cl, e nei campioni naturali le righe appaiono doppie con rapporto di intensità circa 3:1, come l'abbondanza dei due isotopi del cloro. Nelle omonucleari, osservabili nello spettro Raman rotazionale (ΔJ = ±2), il principio di Pauli applicato ai nuclei lega gli stati di spin nucleare ai valori di J: in ¹⁴N₂ le righe da J pari e dispari stanno nel rapporto 2:1, in ¹⁶O₂ esistono solo i livelli rotazionali dispari." },
      { titolo: "Differenze di combinazione e lunghezza di legame", testo: "Le righe R(J − 1) e P(J + 1) partono da livelli diversi dello stato v = 0 ma arrivano allo stesso livello J dello stato v = 1: la loro differenza dipende solo dallo stato inferiore, R(J − 1) − P(J + 1) = 4B₀(J + ½) trascurando D. Analogamente R(J) − P(J) = 4B₁(J + ½) dipende solo dallo stato superiore. Riportando queste differenze contro J + ½ si ottengono B₀ e B₁ come pendenze, poi B_e e α_e, e infine la lunghezza di legame r_e = √(h/(8π²cμB_e)). È uno dei modi più precisi per misurare una distanza interatomica." }
    ],
    formule: [
      ["G(v) = ω_e(v + ½) − ω_ex_e(v + ½)²", "termini vibrazionali (cm⁻¹) di un oscillatore anarmonico"],
      ["F_v(J) = B_vJ(J + 1) − DJ²(J + 1)²,  B_v = B_e − α_e(v + ½)", "termini rotazionali con distorsione centrifuga e interazione rotovibrazionale"],
      ["R(J) = ν₀ + F₁(J + 1) − F₀(J),  P(J) = ν₀ + F₁(J − 1) − F₀(J)", "righe dei rami R e P della banda fondamentale; ν₀ = ω_e − 2ω_ex_e"],
      ["R(J − 1) − P(J + 1) = 4B₀(J + ½)", "differenza di combinazione per lo stato inferiore (senza D)"],
      ["r_e = √(h/(8π²cμB_e)),  r_e² [Å²] = 16,8576/(μ[u]·B_e[cm⁻¹])", "lunghezza di legame dalla costante rotazionale; μ massa ridotta"],
      ["N_J ∝ (2J + 1) e^(−hcF(J)/kT)", "popolazione del livello rotazionale J all'equilibrio termico"]
    ],
    ipotesi: [
      "Molecola biatomica in uno stato elettronico ¹Σ, approssimazione di Born-Oppenheimer e di dipolo elettrico.",
      "Sviluppo dei termini troncato ai primi coefficienti (ω_e, ω_ex_e, B_e, α_e, D); per livelli alti servono termini superiori.",
      "Gas a bassa pressione e all'equilibrio termico; si trascurano l'allargamento delle righe e le loro forme."
    ],
    errori: [
      "Credere che la riga più intensa sia quella con J = 0: per la degenerazione 2J + 1 il massimo è a J maggiore.",
      "Aspettarsi un ramo Q nelle biatomiche ¹Σ come HCl: la riga ΔJ = 0 è proibita, e al suo posto c'è il vuoto al centro della banda.",
      "Usare ω_e come frequenza della banda fondamentale: l'origine è ω_e − 2ω_ex_e.",
      "Usare la massa totale invece della massa ridotta μ = m₁m₂/(m₁ + m₂) nel calcolo della lunghezza di legame."
    ],
    esempio: {
      testo: "Per H³⁵Cl le costanti sono ω_e = 2990,9 cm⁻¹, ω_ex_e = 52,82 cm⁻¹, B_e = 10,5934 cm⁻¹. L'origine della banda fondamentale è ν₀ = ω_e − 2ω_ex_e = 2885,3 cm⁻¹ (sperimentale 2886,0 cm⁻¹). La massa ridotta è μ = 1,00783·34,96885/35,97668 = 0,97959 u, quindi r_e² = 16,8576/(0,97959·10,5934) = 1,6245 Å² e r_e = 1,2746 Å. A 298 K, con kT/hc = 207,2 cm⁻¹ e B₀ ≈ 10,44 cm⁻¹, il livello più popolato è J_max ≈ √(207,2/20,88) − 0,5 ≈ 2,7, cioè J = 3.",
      risultato: "ν₀ ≈ 2885 cm⁻¹, r_e ≈ 1,275 Å, J_max = 3 a 298 K"
    },
    fonti: [
      "G. Herzberg, Molecular Spectra and Molecular Structure. I. Spectra of Diatomic Molecules, Van Nostrand, 2ª ed., 1950, cap. III (rotazione e vibrazione delle biatomiche, spettri infrarossi e Raman) e capitoli sugli effetti isotopici e sulla statistica di spin nucleare",
      "K. P. Huber, G. Herzberg, Molecular Spectra and Molecular Structure. IV. Constants of Diatomic Molecules, Van Nostrand Reinhold, 1979",
      "P. F. Bernath, Spectra of Atoms and Molecules, Oxford University Press, 3ª ed., capitoli sulla spettroscopia vibrazionale e rotazionale delle biatomiche",
      "C. N. Banwell, E. M. McCash, Fundamentals of Molecular Spectroscopy, McGraw-Hill, 4ª ed., 1994, cap. 2 (spettri rotazionali) e cap. 3 (spettri vibrazionali e rotovibrazionali)"
    ],
    collegamenti: ['sschrod', 'stermostat', 'sirvis', 'sspec', 'sqm']
  };

  /* ═══ 🎲 Termodinamica statistica ═════════════════════════════════════════ */
  T['stermostat'] = {
    titolo: "Termodinamica statistica dei gas ideali: dalla molecola alla mole",
    sintesi: "La termodinamica statistica ricava le grandezze termodinamiche di un gas dalle proprietà di una sola molecola, riassunte nella funzione di partizione q. Per un gas ideale q si fattorizza in contributi traslazionale, rotazionale, vibrazionale ed elettronico, ciascuno calcolabile da massa, costanti rotazionali, frequenze di vibrazione e degenerazione dello stato fondamentale. Ne seguono entropia, capacità termica, entalpia ed energia libera, che si confrontano con le tavole termochimiche.",
    paragrafi: [
      { titolo: "Funzione di partizione e grandezze termodinamiche", testo: "In un sistema all'equilibrio a temperatura T la probabilità che una molecola occupi un livello di energia εᵢ con degenerazione gᵢ è gᵢe^(−εᵢ/kT)/q, dove q = Σgᵢe^(−εᵢ/kT) è la funzione di partizione molecolare. Per N molecole indistinguibili di un gas ideale la funzione di partizione del sistema è Q = q^N/N!, e da ln Q si ottiene tutto: U = kT² ∂lnQ/∂T, S = U/T + k ln Q, A = −kT ln Q. Se l'energia della molecola è somma di termini indipendenti, q è il prodotto dei fattori corrispondenti e i contributi a U, S e C_V si sommano. È questa fattorizzazione che permette di costruire le grandezze molari pezzo per pezzo." },
      { titolo: "Traslazione: la formula di Sackur-Tetrode", testo: "Per una particella in un volume V la funzione di partizione traslazionale è q_tr = V/Λ³, con Λ = h/√(2πmkT) lunghezza d'onda termica di de Broglie, che per l'azoto a 298 K vale circa 0,19 Å. Poiché V/Λ³ è enorme, le molecole sono lontanissime dal regime quantistico degenere e la statistica di Boltzmann è adeguata. L'entropia molare è S = R[ln(kT/(p°Λ³)) + 5/2] (Sackur-Tetrode), con p° = 1 bar la pressione standard: dipende dalla massa e dalla temperatura in modo logaritmico. Per l'argon a 298,15 K dà 154,85 J/(mol·K), esattamente il valore delle tavole, perché per un gas monoatomico la traslazione è l'unico contributo." },
      { titolo: "Rotazione e numero di simmetria", testo: "Per una molecola lineare con costante rotazionale B, quando T è molto maggiore della temperatura rotazionale θ_rot = hcB/k, la funzione di partizione è q_rot = kT/(σhcB), con un contributo all'entropia R(ln q_rot + 1) e a C_V pari a R. Per una molecola non lineare con costanti A, B, C, q_rot = (√π/σ)(kT/hc)^(3/2)/√(ABC), con contributo R(ln q_rot + 3/2) all'entropia e 3R/2 a C_V. Il numero di simmetria σ conta le orientazioni indistinguibili che si ottengono ruotando la molecola: 1 per CO e HCl, 2 per N₂, O₂, CO₂ e H₂O, 3 per NH₃, 12 per CH₄. Dividendo per σ si evita di contare più volte la stessa configurazione, come richiede il principio di Pauli applicato ai nuclei identici." },
      { titolo: "Vibrazione e stato elettronico", testo: "Ogni modo normale di frequenza ν̃ è un oscillatore armonico con temperatura vibrazionale θ = hcν̃/k. Con lo zero dell'energia al livello di punto zero, q_vib = 1/(1 − e^(−θ/T)) per ogni modo, e i contributi a entropia e capacità termica sono S = R[x/(eˣ − 1) − ln(1 − e^(−x))] e C_V = Rx²eˣ/(eˣ − 1)², con x = θ/T. Quando θ ≫ T, come per lo stiramento di N₂ (θ ≈ 3390 K), il modo è congelato e non contribuisce; i modi a bassa frequenza, come i piegamenti di CO₂ a 667 cm⁻¹, contribuiscono già a temperatura ambiente. L'unico stato elettronico popolato è di solito il fondamentale, con q_el = g₀: per O₂, il cui stato fondamentale è un tripletto, il contributo R ln 3 ≈ 9,1 J/(mol·K) è indispensabile per ritrovare il valore delle tavole." },
      { titolo: "Dalle costanti molecolari alle tavole", testo: "Sommando i contributi si ottengono C_V e C_p = C_V + R, l'entalpia H − H(0) = U + RT e l'energia libera G = H − TS. Il confronto con le entropie standard delle tavole NIST-JANAF e CODATA, ricavate dalle misure calorimetriche e dalla terza legge, è una delle verifiche più convincenti della meccanica statistica: con le sole costanti spettroscopiche si riproducono i valori a meno di qualche decimo di J/(mol·K). Gli scarti residui hanno origini precise: l'anarmonicità, l'accoppiamento fra rotazione e vibrazione, gli stati elettronici eccitati bassi e, per alcune sostanze, l'entropia residua dei cristalli che rende diverso il valore calorimetrico da quello spettroscopico." }
    ],
    formule: [
      ["q = Σᵢ gᵢ e^(−εᵢ/kT),  Q = q^N/N!", "funzione di partizione molecolare e del sistema per un gas ideale di molecole indistinguibili"],
      ["S_tr = R [ln(kT/(p°Λ³)) + 5/2],  Λ = h/√(2πmkT)", "equazione di Sackur-Tetrode per l'entropia molare traslazionale; p° = 10⁵ Pa"],
      ["q_rot = kT/(σhcB),  q_rot = (√π/σ)(kT/hc)^(3/2)/√(ABC)", "funzione di partizione rotazionale di molecole lineari e non lineari (B, A, C in cm⁻¹ con c in cm/s)"],
      ["q_vib = Π 1/(1 − e^(−θ/T)),  θ = hcν̃/k", "funzione di partizione vibrazionale con lo zero all'energia di punto zero; hc/k = 1,438777 cm·K"],
      ["S_vib = R Σ [x/(eˣ − 1) − ln(1 − e^(−x))],  x = θ/T", "contributo vibrazionale all'entropia molare"],
      ["C_p = C_V + R,  H = U + RT,  G = H − TS", "relazioni del gas ideale fra le grandezze molari"]
    ],
    ipotesi: [
      "Gas ideale: molecole indipendenti, nessuna interazione intermolecolare.",
      "Rotore rigido nel limite classico (T ≫ θ_rot); per H₂ a bassa temperatura servono la somma esplicita sui livelli e la distinzione orto/para.",
      "Oscillatore armonico per ogni modo normale; l'anarmonicità e l'accoppiamento rotovibrazionale sono trascurati.",
      "Solo lo stato elettronico fondamentale è popolato (vero per le molecole della sezione a 298 K)."
    ],
    errori: [
      "Dimenticare il numero di simmetria σ: per CH₄ l'errore sull'entropia sarebbe R ln 12 ≈ 20,7 J/(mol·K).",
      "Usare q^N invece di q^N/N!: per particelle indistinguibili l'entropia non sarebbe estensiva (paradosso di Gibbs).",
      "Pensare che le vibrazioni contribuiscano sempre R alla capacità termica: lo fanno solo nel limite classico T ≫ θ.",
      "Dimenticare la degenerazione elettronica di O₂ (tripletto), che vale R ln 3."
    ],
    esempio: {
      testo: "Si calcoli S° di N₂ a 298,15 K e 1 bar. Con m = 28,0134 u, Λ = h/√(2πmkT) = 1,910·10⁻¹¹ m e kT/(p°Λ³) = 5,905·10⁶, quindi S_tr = R(ln 5,905·10⁶ + 2,5) = 8,3145·(15,591 + 2,5) = 150,42 J/(mol·K). Con B = 1,99824 cm⁻¹ e σ = 2, q_rot = 298,15/(1,438777·2·1,99824) = 51,85 e S_rot = R(ln 51,85 + 1) = 41,14 J/(mol·K). Con ν̃ = 2358,6 cm⁻¹, x = 11,38 e il contributo vibrazionale è appena 0,001 J/(mol·K). Il totale, 191,56 J/(mol·K), differisce di 0,05 dal valore delle tavole, 191,61.",
      risultato: "S°(N₂, 298,15 K) ≈ 191,56 J/(mol·K) contro 191,61 tabulato"
    },
    fonti: [
      "D. A. McQuarrie, Statistical Mechanics, University Science Books, 2000, cap. 5 (gas ideale monoatomico), cap. 6 (biatomiche), cap. 8 (poliatomiche)",
      "T. L. Hill, An Introduction to Statistical Thermodynamics, Dover, 1986, capitoli sui gas ideali monoatomici, biatomici e poliatomici",
      "M. W. Chase Jr., NIST-JANAF Thermochemical Tables, 4ª ed., Journal of Physical and Chemical Reference Data, Monograph 9 (1998)",
      "J. D. Cox, D. D. Wagman, V. A. Medvedev, CODATA Key Values for Thermodynamics, Hemisphere, 1989"
    ],
    collegamenti: ['srotovib', 'sfistermo', 'sfisstat', 'sthermoadv', 'senergia']
  };

  /* ═══ 🎱 Dinamica molecolare ══════════════════════════════════════════════ */
  T['sdinmol'] = {
    titolo: "Dinamica molecolare di un fluido di Lennard-Jones",
    sintesi: "La dinamica molecolare integra numericamente le equazioni di Newton per molte particelle che interagiscono con un potenziale assegnato. Dalle traiettorie si ricavano per media temporale temperatura, pressione e struttura del sistema. Il fluido di Lennard-Jones è il caso di riferimento: con poche particelle si vedono il gas, il liquido e il cristallo, e si verificano la distribuzione di Maxwell-Boltzmann e il teorema del viriale.",
    paragrafi: [
      { titolo: "Il potenziale di Lennard-Jones e le unità ridotte", testo: "Due atomi di un gas nobile si respingono fortemente a distanza ravvicinata, per la sovrapposizione delle nuvole elettroniche, e si attraggono debolmente a distanza, per le forze di dispersione che decadono come r⁻⁶. Il potenziale di Lennard-Jones, V(r) = 4ε[(σ/r)¹² − (σ/r)⁶], riassume questi due effetti: si annulla a r = σ e ha il minimo, di profondità ε, a r = 2^(1/6)σ ≈ 1,12σ. Il termine r⁻¹² è una scelta di comodo, non una legge fisica. Misurando le lunghezze in σ, le energie in ε e le masse in m, ogni fluido di Lennard-Jones diventa lo stesso: per l'argon ε/k = 119,8 K e σ = 3,405 Å, e una temperatura ridotta T* = 1 corrisponde a 119,8 K." },
      { titolo: "Integrazione con velocity Verlet", testo: "Le posizioni e le velocità avanzano con l'algoritmo velocity Verlet: r(t + Δt) = r + vΔt + ½aΔt², poi si calcolano le nuove forze e v(t + Δt) = v + ½[a(t) + a(t + Δt)]Δt. È un metodo del secondo ordine, reversibile nel tempo e simplettico: l'energia totale non deriva sistematicamente ma oscilla attorno al valore iniziale, anche su tempi lunghissimi. Il passo Δt = 0,005 in unità ridotte, per l'argon circa 11 fs, è piccolo rispetto al tempo di una collisione. Il potenziale è troncato a 2,5σ e spostato perché si annulli al taglio, i confini sono periodici con la convenzione dell'immagine minima e le liste di celle rendono il costo proporzionale a N invece che a N²." },
      { titolo: "Temperatura, termostato e Maxwell-Boltzmann", testo: "La temperatura si misura con il teorema di equipartizione: ogni grado di libertà traslazionale porta in media ½kT, per cui in due dimensioni ⟨E_cin⟩ = NkT e in tre, togliendo i gradi di libertà del centro di massa che è fermo, ⟨E_cin⟩ = (3N − 3)kT/2. Senza termostato il sistema è isolato e conserva l'energia: la temperatura fluttua attorno a un valore che dipende dall'energia iniziale. Il termostato della sezione riscala le velocità verso la temperatura desiderata; è semplice ed efficace per portare il sistema in uno stato, ma non genera esattamente le fluttuazioni dell'insieme canonico. L'istogramma delle velocità converge rapidamente alla distribuzione di Maxwell-Boltzmann, che in due dimensioni e in unità ridotte è P(v) = (v/T)e^(−v²/2T)." },
      { titolo: "Pressione dal viriale", testo: "La pressione ha due contributi: quello cinetico delle particelle che trasportano quantità di moto, ρkT come nel gas ideale, e quello delle forze fra le particelle. Il teorema del viriale dà P = ρkT + (1/(dV)) Σ rᵢⱼ·fᵢⱼ, con d la dimensione dello spazio, V il volume (l'area A in due dimensioni) e la somma estesa alle coppie. Quando prevale l'attrazione il secondo termine è negativo e la pressione è inferiore a quella del gas ideale; ad alta densità prevale la repulsione e la pressione sale rapidamente. Il troncamento del potenziale introduce una piccola correzione che nei calcoli accurati si aggiunge analiticamente." },
      { titolo: "Funzione di distribuzione radiale e fasi", testo: "La funzione g(r) è il rapporto fra la densità media di particelle a distanza r da una particella data e la densità media del sistema. In un gas è quasi 1 ovunque, salvo un buco a r < σ; in un liquido mostra un primo picco netto vicino al minimo del potenziale e oscillazioni smorzate che indicano gusci di vicini sempre meno definiti; in un cristallo i picchi sono stretti e si ripetono fino a grande distanza. In due dimensioni il cristallo di Lennard-Jones è esagonale, l'impaccamento più denso dei dischi. La g(r) è anche la grandezza che si misura con la diffrazione di raggi X e neutroni sui liquidi, tramite il fattore di struttura." }
    ],
    formule: [
      ["V(r) = 4ε[(σ/r)¹² − (σ/r)⁶]", "potenziale di Lennard-Jones; minimo −ε a r = 2^(1/6)σ"],
      ["r(t + Δt) = r + vΔt + ½aΔt²,  v(t + Δt) = v + ½[a(t) + a(t + Δt)]Δt", "algoritmo velocity Verlet per posizioni e velocità, con a = F/m"],
      ["τ = σ√(m/ε)", "unità di tempo ridotta (≈ 2,16 ps per l'argon)"],
      ["⟨E_cin⟩ = NkT (2D),  ⟨E_cin⟩ = (3N − 3)kT/2 (3D)", "temperatura cinetica dal teorema di equipartizione (N particelle)"],
      ["P = ρkT + (1/(dV)) Σ_{i<j} rᵢⱼ·fᵢⱼ", "pressione dal teorema del viriale in d dimensioni"],
      ["P(v) = (v/T) e^(−v²/2T)", "distribuzione delle velocità di Maxwell-Boltzmann in 2D, unità ridotte (m = k = 1)"]
    ],
    ipotesi: [
      "Meccanica classica: valida per atomi pesanti a temperature non troppo basse (per l'elio o l'idrogeno gli effetti quantistici sono importanti).",
      "Potenziale di coppia additivo; le forze a tre corpi e la polarizzabilità sono trascurate.",
      "Sistema piccolo con confini periodici: le grandezze hanno fluttuazioni e correzioni di taglia finita; le transizioni di fase appaiono arrotondate.",
      "Il termostato a riscalamento non campiona esattamente l'insieme canonico."
    ],
    errori: [
      "Usare un passo temporale troppo grande: l'energia non si conserva più e il sistema si scalda da solo.",
      "Calcolare la temperatura con 3N gradi di libertà quando il momento totale è vincolato a zero (la differenza conta per N piccolo).",
      "Pensare che la pressione sia solo cinetica: nei liquidi il termine del viriale è dello stesso ordine di grandezza e può essere negativo.",
      "Scambiare σ, dove il potenziale si annulla, con la posizione del minimo 2^(1/6)σ."
    ],
    esempio: {
      testo: "Si traducano in unità reali le unità ridotte per l'argon: ε/k = 119,8 K, σ = 3,405 Å, m = 39,948 u = 6,634·10⁻²⁶ kg. L'unità di tempo è τ = σ√(m/ε) = 3,405·10⁻¹⁰·√(6,634·10⁻²⁶/1,654·10⁻²¹) = 2,16·10⁻¹² s, quindi Δt = 0,005τ = 10,8 fs. Il minimo del potenziale è a 2^(1/6)σ = 3,82 Å, profondo 119,8 K·k = 1,65·10⁻²¹ J. Una simulazione a T* = 0,75 descrive l'argon a 89,9 K, vicino al suo punto triplo (83,8 K).",
      risultato: "τ ≈ 2,16 ps, Δt ≈ 10,8 fs, r_min ≈ 3,82 Å, T* = 0,75 ↔ 89,9 K"
    },
    fonti: [
      "M. P. Allen, D. J. Tildesley, Computer Simulation of Liquids, Oxford University Press, 2ª ed., 2017, cap. 1 (modelli e condizioni periodiche), cap. 2 (meccanica statistica: temperatura, pressione, g(r)) e cap. 3 (dinamica molecolare e algoritmi di integrazione)",
      "D. Frenkel, B. Smit, Understanding Molecular Simulation, Academic Press, 2ª ed., 2002, cap. 4 (dinamica molecolare) e cap. 6 (termostati)",
      "L. Verlet, Computer «Experiments» on Classical Fluids. I. Thermodynamical Properties of Lennard-Jones Molecules, Physical Review 159 (1967) 98",
      "A. Rahman, Correlations in the Motion of Atoms in Liquid Argon, Physical Review 136 (1964) A405"
    ],
    collegamenti: ['sfistermo', 'sfisising', 'stermostat', 'sfisstat', 'scristalli']
  };

  /* ═══ ∑ Matematica per la chimica ═════════════════════════════════════════ */
  T['smatchim'] = {
    titolo: "Strumenti matematici per la chimica: Fourier, Hückel, equazioni cinetiche e minimi quadrati",
    sintesi: "Quattro strumenti matematici stanno dietro a buona parte del lavoro quotidiano di un chimico: la trasformata di Fourier, che trasforma il segnale di uno spettrometro in uno spettro; gli autovalori di una matrice, che nel metodo di Hückel danno i livelli degli elettroni π; le equazioni differenziali, che descrivono i meccanismi di reazione; i minimi quadrati, che estraggono parametri e incertezze dai dati.",
    paragrafi: [
      { titolo: "Dal FID allo spettro con la trasformata di Fourier", testo: "Uno spettrometro NMR a impulsi non registra lo spettro ma il decadimento libero dell'induzione (FID), una somma di oscillazioni s(t) = Σ Aₖ e^(i2πνₖt) e^(−t/T₂). La trasformata di Fourier lo converte in funzione della frequenza: ogni componente diventa una riga lorentziana centrata in νₖ con larghezza a metà altezza 1/(πT₂). Un segnale che muore presto produce quindi una riga larga. Moltiplicare il FID per e^(−πLB·t) (apodizzazione esponenziale) allarga ogni riga di LB hertz ma attenua la coda rumorosa e migliora il rapporto segnale/rumore; aggiungere zeri in coda (zero filling) infittisce i punti dello spettro. Sommando n scansioni il segnale cresce come n e il rumore casuale come √n, quindi il rapporto segnale/rumore migliora come √n." },
      { titolo: "La FFT e il campionamento", testo: "Il segnale è campionato a intervalli Δt per N punti. La trasformata discreta richiederebbe N² operazioni; l'algoritmo di Cooley e Tukey (1965), dividendo ricorsivamente la sequenza in campioni pari e dispari, ne richiede circa N log₂N, purché N sia una potenza di 2. Due regole governano la conversione: l'intervallo di frequenze rappresentabile è 1/Δt, e frequenze fuori da questo intervallo si ripiegano in posizioni sbagliate (aliasing, teorema di Nyquist); la risoluzione in frequenza è 1/(NΔt), cioè l'inverso del tempo di acquisizione, che lo zero filling non migliora davvero." },
      { titolo: "Il metodo di Hückel", testo: "Per i sistemi π coniugati Hückel usa una base di un orbitale p per atomo e approssima drasticamente l'hamiltoniano: tutti gli elementi diagonali valgono α, quelli fra atomi legati β, tutti gli altri zero, e gli orbitali sono trattati come ortogonali. Le energie sono E = α + xβ, con x autovalori della matrice di adiacenza del grafo molecolare; poiché β < 0, gli x positivi corrispondono a orbitali leganti. L'energia π totale si confronta con quella di doppi legami isolati (2α + 2β ciascuno) per dare l'energia di delocalizzazione. Dagli autovettori si ottengono le cariche π, qᵣ = Σ nⱼcⱼᵣ², e gli ordini di legame π di Coulson, pᵣₛ = Σ nⱼcⱼᵣcⱼₛ. Gli eteroatomi si introducono modificando α e β: per l'azoto piridinico α_N = α + 0,5β e β_CN = β (parametri di Streitwieser)." },
      { titolo: "Equazioni cinetiche e Runge-Kutta", testo: "Un meccanismo di reazione si traduce in un sistema di equazioni differenziali ordinarie per le concentrazioni. Solo pochi casi hanno una soluzione chiusa, come le reazioni consecutive A → B → C, in cui l'intermedio B raggiunge il massimo a t = ln(k₂/k₁)/(k₂ − k₁). Il metodo di Runge-Kutta del quarto ordine valuta la derivata quattro volte per passo e ha un errore globale proporzionale a h⁴: dimezzando il passo l'errore si riduce di circa sedici volte. Con lo stesso metodo si integrano sistemi senza soluzione chiusa, come il meccanismo di Michaelis-Menten completo o il Bruxellatore, un modello di reazione autocatalitica che oscilla quando B > 1 + A², come la reazione di Belousov-Žabotinskij." },
      { titolo: "Minimi quadrati e la retta di Arrhenius", testo: "La legge di Arrhenius, k = A e^(−E_a/RT), diventa lineare passando ai logaritmi: ln k = ln A − (E_a/R)(1/T). Riportando ln k contro 1/T, la retta di minimi quadrati, quella che minimizza la somma dei quadrati degli scarti verticali, dà la pendenza m = −E_a/R e l'intercetta ln A. Le formule dei minimi quadrati forniscono anche le deviazioni standard dei parametri, stimate dalla dispersione dei punti attorno alla retta. Poiché la linearizzazione deforma gli errori, il metodo è rigoroso solo se gli errori su ln k sono simili per tutti i punti; altrimenti i punti vanno pesati." }
    ],
    formule: [
      ["S(ν) = ∫ s(t) e^(−i2πνt) dt", "trasformata di Fourier dal segnale nel tempo s(t) allo spettro S(ν)"],
      ["Δν½ = 1/(πT₂),  S/N ∝ √n", "larghezza della riga lorentziana e miglioramento del rapporto segnale/rumore con n scansioni"],
      ["E = α + xβ,  E_deloc = E_π − E_π(legami isolati)", "livelli di Hückel (x autovalori della matrice di adiacenza) ed energia di delocalizzazione"],
      ["qᵣ = Σⱼ nⱼcⱼᵣ²,  pᵣₛ = Σⱼ nⱼcⱼᵣcⱼₛ", "popolazione π dell'atomo r e ordine di legame π di Coulson (nⱼ occupazione dell'orbitale j)"],
      ["[B](t) = [A]₀ k₁/(k₂ − k₁) (e^(−k₁t) − e^(−k₂t))", "intermedio delle reazioni consecutive A → B → C"],
      ["ln k = ln A − E_a/(RT)", "forma lineare della legge di Arrhenius; R = 8,314462618 J/(mol·K)"]
    ],
    ipotesi: [
      "Fourier: righe lorentziane (decadimento esponenziale), campionamento sufficiente a evitare l'aliasing, rumore bianco e indipendente fra le scansioni.",
      "Hückel: solo elettroni π, sovrapposizione trascurata, nessuna repulsione esplicita fra elettroni; vale per confronti qualitativi in famiglie di molecole planari.",
      "Cinetiche: legge cinetica di massa con costanti indipendenti dal tempo, sistema omogeneo a temperatura costante.",
      "Minimi quadrati: errori solo sulla variabile dipendente, indipendenti e con la stessa varianza."
    ],
    errori: [
      "Pensare che lo zero filling aumenti la risoluzione reale: interpola lo spettro, ma la capacità di separare due righe dipende dal tempo di acquisizione e da T₂.",
      "Dimenticare che β è negativo e interpretare x > 0 come orbitali antileganti.",
      "Applicare Hückel con elettroni contati male: a ogni carbonio sp² corrisponde un elettrone π, all'azoto piridinico uno, a quello pirrolico due.",
      "Ricavare E_a dalla pendenza dimenticando il segno o usando log₁₀ al posto del logaritmo naturale senza il fattore 2,303."
    ],
    esempio: {
      testo: "Per il butadiene la matrice di adiacenza di una catena di quattro atomi ha autovalori x = ±1,618 e ±0,618. I quattro elettroni π occupano i due orbitali leganti: E_π = 2(α + 1,618β) + 2(α + 0,618β) = 4α + 4,472β. Due doppi legami isolati darebbero 4α + 4β, quindi l'energia di delocalizzazione è 0,472β; con β ≈ −75 kJ/mol corrisponde a circa −35 kJ/mol, una stabilizzazione. Il benzene, con E_π = 6α + 8β contro 6α + 6β, ha 2β, più di quattro volte tanto.",
      risultato: "E_π = 4α + 4,472β; E_deloc = 0,472β ≈ −35 kJ/mol"
    },
    fonti: [
      "J. W. Cooley, J. W. Tukey, An algorithm for the machine calculation of complex Fourier series, Mathematics of Computation 19 (1965) 297",
      "J. Keeler, Understanding NMR Spectroscopy, Wiley, 2ª ed., 2010, cap. 5 (trasformata di Fourier e trattamento dei dati)",
      "A. Streitwieser, Molecular Orbital Theory for Organic Chemists, Wiley, 1961, capitoli sul metodo di Hückel e sui parametri degli eteroatomi",
      "W. H. Press, S. A. Teukolsky, W. T. Vetterling, B. P. Flannery, Numerical Recipes, Cambridge University Press, 3ª ed., cap. 12 (FFT), cap. 15 (modellazione dei dati) e cap. 17 (integrazione delle equazioni differenziali ordinarie)",
      "P. R. Bevington, D. K. Robinson, Data Reduction and Error Analysis for the Physical Sciences, McGraw-Hill, 3ª ed., 2003, cap. 6 (minimi quadrati per una retta)"
    ],
    collegamenti: ['smo', 'schicinet', 'skin', 'smatnum', 'snmrpred']
  };

  /* ═══ 💎 Cristallografia ══════════════════════════════════════════════════ */
  T['scristalli'] = {
    titolo: "Reticoli cristallini e diffrazione di raggi X",
    sintesi: "Un cristallo è un motivo di atomi ripetuto su un reticolo periodico. Le simmetrie possibili permettono solo 14 reticoli di Bravais, raggruppati in 7 sistemi cristallini. I piani reticolari, identificati dagli indici di Miller, riflettono i raggi X secondo la legge di Bragg; le intensità dipendono dal fattore di struttura, che fa sparire sistematicamente alcune riflessioni e rivela così il tipo di centratura.",
    paragrafi: [
      { titolo: "Reticoli di Bravais e celle", testo: "Un reticolo di Bravais è l'insieme dei punti R = n₁a + n₂b + n₃c con nᵢ interi; la cella elementare è descritta da sei parametri, le lunghezze a, b, c e gli angoli α, β, γ. Le restrizioni imposte dalle simmetrie di rotazione compatibili con la periodicità (assi di ordine 2, 3, 4 e 6) danno sette sistemi cristallini: triclino, monoclino, ortorombico, tetragonale, trigonale (romboedrico), esagonale e cubico. Aggiungendo le centrature, P primitiva, I a corpo centrato, F a facce centrate, C su una coppia di facce e R romboedrica, si ottengono esattamente 14 reticoli di Bravais distinti, come dimostrò Bravais nel 1850." },
      { titolo: "Indici di Miller e distanze interplanari", testo: "Una famiglia di piani reticolari paralleli si indica con tre interi (hkl), gli indici di Miller: si prendono le intercette del piano sugli assi in unità di a, b, c, se ne fanno i reciproci e si riducono ai più piccoli interi con lo stesso rapporto. Un indice nullo indica un piano parallelo all'asse corrispondente. La distanza fra piani adiacenti dipende dal sistema: nel cubico d = a/√(h² + k² + l²); nel tetragonale 1/d² = (h² + k²)/a² + l²/c²; nell'ortorombico 1/d² = h²/a² + k²/b² + l²/c²; nell'esagonale 1/d² = 4(h² + hk + k²)/(3a²) + l²/c². Indici più alti corrispondono a piani più fitti e più ravvicinati." },
      { titolo: "Legge di Bragg e diffrattogramma di polvere", testo: "I raggi X, con lunghezze d'onda confrontabili con le distanze interatomiche, sono diffusi dagli elettroni degli atomi. Le onde diffuse da piani paralleli si rinforzano solo se la differenza di cammino 2d sin θ è un multiplo intero della lunghezza d'onda: λ = 2d sin θ, dove θ è l'angolo fra il fascio e i piani e l'ordine n è assorbito negli indici. In una polvere i cristalliti sono orientati a caso, e per ogni famiglia di piani esiste sempre una frazione orientata in modo giusto: il diffrattogramma registra un picco a ogni angolo 2θ permesso. Le posizioni dei picchi dipendono solo dalla geometria della cella e si calcolano esattamente." },
      { titolo: "Fattore di struttura ed estinzioni sistematiche", testo: "L'ampiezza diffusa dalla cella è il fattore di struttura F(hkl) = Σⱼ fⱼ e^(2πi(hxⱼ + kyⱼ + lzⱼ)), somma sugli atomi della cella con le loro coordinate frazionarie e i fattori di forma atomici fⱼ, che valgono Z in avanti e decrescono con sin θ/λ. Le centrature fanno annullare F per intere classi di riflessioni. In un reticolo a corpo centrato mancano le riflessioni con h + k + l dispari; in uno a facce centrate quelle con h, k, l di parità mista; nella struttura del diamante, che è fcc con una base di due atomi, mancano in più quelle con h, k, l tutti pari e h + k + l = 4n + 2. L'intensità osservata è |F|² moltiplicato per la molteplicità della famiglia di piani e per il fattore di Lorentz-polarizzazione (1 + cos²2θ)/(sin²θ cos θ). Nella sezione i fattori di forma sono approssimati: le posizioni sono esatte, le intensità indicative." },
      { titolo: "Strutture cristalline in tre dimensioni", testo: "Contando gli atomi che appartengono alla cella, con un ottavo per ogni vertice e metà per ogni faccia, la cubica semplice ne contiene 1, la cubica a corpo centrato 2, la cubica a facce centrate 4 e il diamante 8. Il numero di coordinazione è 6, 8, 12 e 4 rispettivamente, e la frazione del volume occupata da sfere rigide a contatto vale 0,524, 0,680, 0,740 e 0,340. L'esagonale compatta ha come la cfc coordinazione 12 e frazione 0,740: le due strutture differiscono solo per la sequenza di impilamento dei piani compatti, ABAB contro ABCABC. Il cloruro di sodio è formato da due reticoli fcc compenetrati, con quattro unità di formula per cella; il cloruro di cesio è un reticolo cubico semplice con una base di due ioni, non un reticolo a corpo centrato." }
    ],
    formule: [
      ["d = a/√(h² + k² + l²)", "distanza fra i piani (hkl) nel sistema cubico di parametro a"],
      ["1/d² = 4(h² + hk + k²)/(3a²) + l²/c²", "distanza interplanare nel sistema esagonale"],
      ["λ = 2d sin θ", "legge di Bragg; θ angolo di Bragg, 2θ angolo di diffrazione registrato"],
      ["F(hkl) = Σⱼ fⱼ e^(2πi(hxⱼ + kyⱼ + lzⱼ))", "fattore di struttura; (xⱼ, yⱼ, zⱼ) coordinate frazionarie, fⱼ fattore di forma atomico"],
      ["I ∝ |F|² · m · (1 + cos²2θ)/(sin²θ cos θ)", "intensità di polvere: m molteplicità, fattore di Lorentz-polarizzazione per radiazione non polarizzata"]
    ],
    ipotesi: [
      "Diffrazione cinematica: ogni fotone è diffuso una sola volta, valida per cristalli piccoli o imperfetti.",
      "Fattori di forma atomici approssimati e nessun fattore di temperatura (Debye-Waller), assorbimento o orientazione preferenziale: le intensità relative sono solo indicative.",
      "Radiazione monocromatica (per esempio Cu Kα₁, λ = 1,5406 Å) e polvere con orientazioni perfettamente casuali."
    ],
    errori: [
      "Confondere θ e 2θ: il diffrattometro registra 2θ, la legge di Bragg usa θ.",
      "Pensare che le estinzioni dipendano dagli atomi presenti: dipendono dalla simmetria e dalla centratura, e si osservano anche con atomi tutti uguali.",
      "Credere che la cella primitiva e quella convenzionale coincidano sempre: la cella convenzionale della cfc contiene quattro punti reticolari, quella primitiva uno.",
      "Classificare CsCl come cubico a corpo centrato: i due siti sono occupati da ioni diversi, quindi il reticolo è cubico semplice."
    ],
    esempio: {
      testo: "Il rame è cubico a facce centrate con a = 3,615 Å; si usa la radiazione Cu Kα₁, λ = 1,5406 Å. Le riflessioni permesse hanno h, k, l tutti pari o tutti dispari: (111), (200), (220)… Per (111) d = 3,615/√3 = 2,087 Å, sin θ = 1,5406/(2·2,087) = 0,3691, θ = 21,66°, 2θ = 43,32°. Per (200) d = 1,8075 Å e 2θ = 50,45°; per (220) d = 1,278 Å e 2θ = 74,13°. Le riflessioni (100) e (110), che una cella cubica semplice mostrerebbe, sono assenti.",
      risultato: "2θ = 43,32° (111), 50,45° (200), 74,13° (220)"
    },
    fonti: [
      "C. Kittel, Introduction to Solid State Physics, Wiley, 8ª ed., cap. 1 (struttura cristallina) e cap. 2 (diffrazione e reticolo reciproco)",
      "N. W. Ashcroft, N. D. Mermin, Solid State Physics, Saunders, 1976, cap. 4 (reticoli cristallini), cap. 5 (reticolo reciproco), cap. 6 (diffrazione di raggi X), cap. 7 (classificazione dei reticoli)",
      "B. D. Cullity, S. R. Stock, Elements of X-Ray Diffraction, Prentice Hall, 3ª ed., 2001, capitoli sulla geometria dei cristalli, sulle direzioni e sulle intensità dei fasci diffratti",
      "C. Giacovazzo et al., Fundamentals of Crystallography, Oxford University Press / IUCr, 3ª ed., 2011, capitoli sui reticoli, sulla simmetria e sulla diffrazione"
    ],
    collegamenti: ['sfissolido', 'sfisonde', 'ssimm', 'sfismateriali', 'sdinmol']
  };

})(typeof window !== 'undefined' ? window : globalThis);
