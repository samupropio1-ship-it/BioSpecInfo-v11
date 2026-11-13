/* bsi-teoria-d.js — teoria delle sezioni (lotto D). BioSpecInfo · © Samuele Pio Provenzano */
(function (g) {
  'use strict';
  var T = g.BSITeoriaDati = g.BSITeoriaDati || {};

  /* ── ☢️ Radiochimica ─────────────────────────────────────────────────── */
  T['snucleare'] = {
    titolo: "Decadimento radioattivo, catene di Bateman, datazione ed energia di legame",
    sintesi: "Un nucleo instabile decade a caso, con una probabilità per unità di tempo λ che non dipende dalla sua storia: da qui la legge esponenziale. Quando il figlio è a sua volta radioattivo, le equazioni di Bateman descrivono la catena e spiegano gli equilibri transitorio e secolare. Lo stesso esponenziale, letto al contrario, è un orologio geologico; la formula semiempirica di Weizsäcker spiega invece perché certi nuclei sono stabili e altri no.",
    paragrafi: [
      { titolo: "La legge del decadimento", testo: "Ogni nucleo radioattivo ha in ogni istante la stessa probabilità λ dt di decadere nel successivo intervallo dt, indipendentemente da quanto è già vissuto. Per un campione di N nuclei ne segue dN/dt = −λN, cioè N(t) = N₀e^(−λt). Il tempo di dimezzamento t½ = ln 2/λ e la vita media τ = 1/λ sono due modi equivalenti di dare la stessa informazione. Ciò che si misura con un rivelatore non è N ma l'attività A = λN, in becquerel (un decadimento al secondo). La costante λ è una proprietà del nucleo: temperatura, pressione e legame chimico la modificano in modo trascurabile, con l'unica eccezione misurabile della cattura elettronica, dove la densità elettronica nel nucleo cambia λ di frazioni di punto percentuale (il caso classico è il ⁷Be)." },
      { titolo: "Le catene e le equazioni di Bateman", testo: "Se il nuclide 1 decade nel nuclide 2, anch'esso radioattivo, il secondo cresce per l'apporto del primo e diminuisce per il proprio decadimento: dN₂/dt = bλ₁N₁ − λ₂N₂, dove b è la frazione dei decadimenti del padre che porta proprio a quel figlio (il rapporto di diramazione). Per una catena di n membri che parte dal solo padre la soluzione esatta, trovata da Bateman nel 1910, è una somma di esponenziali, una per ogni costante della catena, con coefficienti che contengono le differenze λⱼ − λᵢ. È la formula che la sezione calcola punto per punto: non c'è alcuna integrazione numerica, e per questo le curve restano esatte anche su tempi lunghissimi." },
      { titolo: "Equilibrio transitorio e secolare", testo: "Il comportamento a lungo termine dipende dal rapporto fra le due vite. Se il padre vive poco più del figlio (λ₁ < λ₂), dopo qualche vita del figlio le due attività decrescono insieme con la pendenza del padre e il loro rapporto tende a bλ₂/(λ₂ − λ₁): è l'equilibrio transitorio del generatore ⁹⁹Mo/⁹⁹ᵐTc, dove l'attività del tecnezio raggiunge il massimo dopo t = ln(λ₂/λ₁)/(λ₂ − λ₁). Se il padre vive enormemente di più (⁹⁰Sr con 28,8 anni contro le 64 ore dell'⁹⁰Y, oppure ²²⁶Ra con 1600 anni contro i 3,82 giorni del ²²²Rn) le attività diventano uguali: equilibrio secolare. Se invece il padre vive meno del figlio, il padre sparisce e resta il figlio con la propria emivita, senza alcun equilibrio." },
      { titolo: "La datazione radiometrica", testo: "Se un sistema si chiude in un certo istante e da allora né il padre né il figlio entrano o escono, il rapporto misurato oggi dà l'età. Per il carbonio-14, prodotto in atmosfera dai neutroni dei raggi cosmici sull'azoto, un organismo vivo scambia carbonio con l'ambiente e alla morte smette: t = −(t½/ln 2) ln(f), con f la frazione di ¹⁴C rimasta e t½ = 5730 anni. Le età radiocarboniche convenzionali dei laboratori usano per tradizione il valore di Libby, 5568 anni, e vanno poi calibrate con le curve IntCal, perché il ¹⁴C atmosferico non è stato costante. Nel metodo potassio-argon il ⁴⁰K decade per l'89 % in ⁴⁰Ca e per l'11 % circa in ⁴⁰Ar per cattura elettronica, e nell'età entra il rapporto λ_CE/λ = 0,1048; nel metodo uranio-piombo ²³⁸U → ²⁰⁶Pb con λ = 1,55125·10⁻¹⁰ a⁻¹. Proprio dal piombo delle meteoriti Patterson ricavò nel 1956 l'età della Terra, oggi 4,54 miliardi di anni." },
      { titolo: "L'energia di legame e la formula di Weizsäcker", testo: "L'energia di legame B = [Z m_H + N m_n − M_atomo]c² è l'energia che servirebbe per separare il nucleo nei suoi nucleoni; usando la massa dell'atomo di idrogeno invece di quella del protone le masse degli elettroni si compensano. La formula semiempirica la ricostruisce con l'immagine di una goccia di liquido carica: un termine di volume proporzionale ad A (ogni nucleone sente solo i vicini), uno di superficie in A^(2/3) (i nucleoni in superficie hanno meno vicini), la repulsione coulombiana Z(Z − 1)/A^(1/3), il termine di asimmetria (N − Z)²/A che viene dal principio di Pauli e un termine di accoppiamento che premia i nuclei pari-pari. La sezione usa a_V = 15,75, a_S = 17,8, a_C = 0,711, a_A = 23,7 e a_P = 11,18 MeV. La curva B/A sale fino a circa 8,8 MeV nella zona di ferro e nichel e poi scende lentamente: i nuclei leggeri liberano energia fondendosi, quelli pesanti scindendosi." },
      { titolo: "La valle di stabilità", testo: "A numero di massa A fissato, la formula semiempirica è una parabola in Z, e il suo massimo dà lo Z più stabile: Z₀ = A/(2 + (a_C/2a_A)A^(2/3)). Per i nuclei leggeri Z₀ ≈ A/2, ma al crescere di A la repulsione coulombiana sposta la valle verso l'eccesso di neutroni: il ²⁰⁸Pb ha 126 neutroni e 82 protoni. Un nucleo che sta sopra la valle, con troppi protoni, scende verso il fondo per decadimento β⁺ o cattura elettronica; uno che sta sotto, con troppi neutroni, decade β⁻. La formula non conosce però gli effetti di guscio: ai numeri magici (2, 8, 20, 28, 50, 82, 126) i nuclei sono legati qualche MeV più di quanto preveda la goccia." }
    ],
    formule: [
      ["N(t) = N₀ e^(−λt),  A = λN,  t½ = ln 2/λ", "N nuclei presenti, λ costante di decadimento (s⁻¹), A attività in Bq, t½ tempo di dimezzamento"],
      ["N₂(t) = bλ₁N₁(0)[e^(−λ₁t) − e^(−λ₂t)]/(λ₂ − λ₁)", "figlio di una catena a due membri che parte dal solo padre; b rapporto di diramazione"],
      ["t_max = ln(λ₂/λ₁)/(λ₂ − λ₁)", "istante in cui l'attività del figlio è massima (generatore di tecnezio)"],
      ["t = −(t½/ln 2) · ln f", "età al radiocarbonio; f frazione di ¹⁴C rimasta rispetto a un campione moderno"],
      ["t = (1/λ) ln[1 + (λ/λ_CE) · ⁴⁰Ar/⁴⁰K]", "età potassio-argon; λ = 5,543·10⁻¹⁰ a⁻¹ costante totale, λ_CE/λ = 0,1048"],
      ["B = a_V A − a_S A^(2/3) − a_C Z(Z−1)/A^(1/3) − a_A (N−Z)²/A ± a_P/√A", "formula semiempirica di Weizsäcker; B in MeV, + per nuclei pari-pari, − per dispari-dispari"],
      ["Z₀(A) = A/(2 + (a_C/2a_A) A^(2/3))", "fondo della valle di stabilità a A fissato (trascurando la differenza di massa fra neutrone e protone)"]
    ],
    ipotesi: [
      "Le equazioni di Bateman presuppongono che i nuclidi della catena non vengano prodotti né rimossi in altro modo (nessuna eluizione, nessuna fuga di gas come il radon).",
      "Le età radiometriche valgono solo se il sistema è rimasto chiuso e se si conosce la quantità iniziale di figlio (assunta nulla per Ar e Pb radiogenici); gli isocroni servono proprio a togliere questa ipotesi.",
      "Il radiocarbonio è utile fino a circa 50 000 anni; oltre resta troppo poco ¹⁴C rispetto al fondo.",
      "La formula semiempirica è un modello macroscopico: per A < 20 e vicino ai numeri magici sbaglia di qualche MeV."
    ],
    errori: [
      "Pensare che dopo due emivite il campione sia esaurito: ne resta un quarto, e dopo dieci emivite circa un millesimo.",
      "Confondere l'equilibrio secolare con l'uguaglianza del numero di nuclei: sono uguali le attività λ₁N₁ = λ₂N₂, mentre i nuclei del figlio sono molti meno.",
      "Credere che il ⁵⁶Fe abbia la massima energia di legame per nucleone: il primato spetta al ⁶²Ni, anche se il ⁵⁶Fe ha la massa per nucleone più bassa e domina come prodotto finale delle stelle.",
      "Usare la massa del nucleo invece di quella dell'atomo (o viceversa) senza tenere conto degli elettroni nei bilanci di massa."
    ],
    esempio: {
      testo: "Dopo quante ore dall'ultima eluizione conviene «mungere» un generatore ⁹⁹Mo/⁹⁹ᵐTc? Con t½(Mo) = 65,94 h e t½(Tc) = 6,0067 h si ha λ₁ = 0,693147/65,94 = 0,010512 h⁻¹ e λ₂ = 0,693147/6,0067 = 0,11540 h⁻¹. Il rapporto λ₂/λ₁ vale 10,978, il suo logaritmo 2,3959; la differenza λ₂ − λ₁ vale 0,10489 h⁻¹. Quindi t_max = 2,3959/0,10489 h. A tempi lunghi il rapporto delle attività tende a bλ₂/(λ₂ − λ₁) = 0,876 · 1,1002 = 0,964.",
      risultato: "t_max ≈ 22,8 h: per questo il generatore si eluisce una volta al giorno"
    },
    fonti: [
      "K. S. Krane, Introductory Nuclear Physics, Wiley, 1988, cap. 3 (formula semiempirica) e cap. 6 (decadimento radioattivo, catene ed equilibri)",
      "G. Choppin, J.-O. Liljenzin, J. Rydberg, C. Ekberg, Radiochemistry and Nuclear Chemistry, Academic Press, 4ª ed., 2013, capitoli sulla cinetica del decadimento e sulla datazione",
      "G. Faure, T. M. Mensing, Isotopes: Principles and Applications, Wiley, 3ª ed., 2005, capitoli sui metodi K-Ar, U-Pb e ¹⁴C",
      "R. H. Steiger, E. Jäger, Subcommission on geochronology: convention on the use of decay constants, Earth Planet. Sci. Lett. 36 (1977) 359"
    ],
    collegamenti: ['sfisnuclei', 'sfispart', 'schicinet', 'sastrostelle']
  };

  /* ── ⚡ Elettrodi e stato di transizione ─────────────────────────────── */
  T['selettrodi'] = {
    titolo: "Cinetica agli elettrodi (Butler-Volmer, Tafel) e teoria dello stato di transizione",
    sintesi: "La corrente che attraversa un elettrodo non è fissata dalla termodinamica ma dalla velocità del trasferimento di carica. L'equazione di Butler-Volmer lega la corrente alla sovratensione attraverso la corrente di scambio e i coefficienti di trasferimento; vicino all'equilibrio è lineare, lontano diventa la retta di Tafel. La teoria di Eyring dà la costante di velocità a partire dall'energia libera di attivazione e permette di ricavare ΔH‡ e ΔS‡ dai dati.",
    paragrafi: [
      { titolo: "Corrente di scambio e sovratensione", testo: "All'equilibrio un elettrodo non è fermo: ossidazione e riduzione procedono con la stessa velocità, e la corrente di ciascun verso, per unità di area, è la densità di corrente di scambio i₀. La corrente netta compare solo quando il potenziale si allontana da quello di equilibrio; la differenza η = E − E_eq è la sovratensione. Un i₀ grande (platino per la coppia H⁺/H₂, intorno a 10⁻³ A/cm²) significa che basta pochissima sovratensione per far passare corrente; un i₀ piccolissimo (mercurio per la stessa coppia, intorno a 10⁻¹² A/cm²) richiede centinaia di millivolt. Per questo lo stesso processo è «reversibile» su un metallo e «irreversibile» su un altro." },
      { titolo: "L'equazione di Butler-Volmer", testo: "Una sovratensione positiva abbassa la barriera dell'ossidazione di una frazione αₐ dell'energia elettrica Fη e alza quella della riduzione della frazione α_c. Ne segue i = i₀[e^(αₐFη/RT) − e^(−α_cFη/RT)]. Per un passaggio elementare monoelettronico αₐ + α_c = 1, ed è così che la sezione lega i due cursori; α ≈ 0,5 corrisponde a una barriera simmetrica. Vicino all'equilibrio, per |η| molto minore di RT/F = 25,7 mV, si sviluppano gli esponenziali e si ottiene i ≈ i₀Fη/RT: l'elettrodo si comporta come una resistenza di trasferimento di carica R_ct = RT/(F i₀), quella che si misura con la spettroscopia di impedenza." },
      { titolo: "Le rette di Tafel", testo: "Lontano dall'equilibrio uno dei due esponenziali diventa trascurabile e il logaritmo della corrente cresce linearmente con la sovratensione: η = b log₁₀(i/i₀), con pendenza b = 2,303RT/(αF). A 25 °C e con α = 0,5 si ottengono circa 118 mV per decade. La retta, estrapolata a η = 0, interseca l'asse in log i₀, ed è così che la seconda scheda ricava corrente di scambio e coefficiente di trasferimento da coppie (η, i). Si usano solo i punti con |η| > 100 mV: più vicino all'equilibrio il ramo opposto non è trascurabile e la retta si incurva; molto lontano, invece, il trasporto di massa limita la corrente e la retta si appiattisce." },
      { titolo: "Il trasporto di massa", testo: "La reazione consuma la specie elettroattiva vicino alla superficie, che deve arrivarvi per diffusione attraverso uno strato di spessore δ. La corrente non può superare la corrente limite i_l = nFDC*/δ, che si raggiunge quando la concentrazione superficiale si annulla. Combinando la cinetica con la diffusione si ottiene una forma in cui le resistenze si sommano: 1/i₀ per il trasferimento di carica e termini in 1/i_l per il trasporto. Quando la sovratensione è grande la curva si appiattisce sul plateau: è il fenomeno sfruttato in voltammetria e in polarografia, dove la corrente limite è proporzionale alla concentrazione." },
      { titolo: "La teoria dello stato di transizione", testo: "Eyring, Evans e Polanyi (1935) immaginarono che i reagenti fossero in quasi-equilibrio con un complesso attivato che sta in cima alla barriera e che si trasforma nei prodotti con una frequenza universale k_BT/h, che a 298 K vale 6,21·10¹² s⁻¹. Ne segue k = κ(k_BT/h)e^(−ΔG‡/RT), dove κ, il coefficiente di trasmissione, è di solito posto uguale a 1. Ogni 5,7 kJ/mol in più di energia libera di attivazione rallentano la reazione di un fattore 10 a temperatura ambiente, perché RT ln 10 = 5,71 kJ/mol. Per reazioni bimolecolari la costante dipende dallo stato standard scelto, che va dichiarato." },
      { titolo: "Dalla retta di Eyring ad Arrhenius", testo: "Scrivendo ΔG‡ = ΔH‡ − TΔS‡ si ottiene ln(k/T) = ln(k_B/h) + ΔS‡/R − ΔH‡/(RT): riportando ln(k/T) contro 1/T i dati stanno su una retta con pendenza −ΔH‡/R e intercetta da cui si legge ΔS‡. Il confronto con l'equazione di Arrhenius dà, per una reazione in soluzione, Eₐ = ΔH‡ + RT e A = (e k_BT/h)e^(ΔS‡/R). Il segno di ΔS‡ è diagnostico: negativo quando lo stato di transizione è più ordinato dei reagenti (associazione, solvatazione di cariche che si formano), positivo per meccanismi dissociativi. L'intercetta richiede una lunga estrapolazione, per cui ΔS‡ è sempre molto più incerta di ΔH‡." }
    ],
    formule: [
      ["i = i₀[e^(αₐFη/RT) − e^(−α_cFη/RT)]", "equazione di Butler-Volmer; i densità di corrente (A/cm²), η sovratensione (V), F = 96 485 C/mol, αₐ e α_c coefficienti di trasferimento"],
      ["R_ct = RT/(F i₀)", "resistenza di trasferimento di carica (Ω·cm²) per piccole sovratensioni, reazione monoelettronica"],
      ["η = b log₁₀(i/i₀),  b = 2,303RT/(αF)", "retta di Tafel; b pendenza in V per decade di corrente"],
      ["k = κ(k_BT/h)e^(−ΔG‡/RT)", "equazione di Eyring; k_B costante di Boltzmann, h costante di Planck, ΔG‡ energia libera di attivazione molare"],
      ["ln(k/T) = ln(k_B/h) + ΔS‡/R − ΔH‡/(RT)", "forma lineare per ricavare entalpia ed entropia di attivazione dai dati k(T)"],
      ["Eₐ = ΔH‡ + RT,  A = (e k_BT/h)e^(ΔS‡/R)", "relazione con i parametri di Arrhenius per una reazione unimolecolare o in soluzione"]
    ],
    ipotesi: [
      "Butler-Volmer nella forma usata vale per un trasferimento elettronico in un solo passaggio, senza adsorbimento di intermedi e con concentrazioni superficiali uguali a quelle di massa (oppure corrette dal termine di trasporto).",
      "I coefficienti α sono trattati come costanti; la teoria di Marcus prevede che varino con la sovratensione, cosa che si vede a η molto grandi.",
      "La teoria dello stato di transizione assume quasi-equilibrio con il complesso attivato, nessun ritorno dalla cima della barriera (κ = 1) e nessun effetto tunnel."
    ],
    errori: [
      "Applicare la retta di Tafel a sovratensioni di pochi millivolt, dove i due rami contano entrambi e la relazione è lineare, non logaritmica.",
      "Confondere la sovratensione con il potenziale dell'elettrodo: η si misura rispetto al potenziale di equilibrio della coppia nelle condizioni reali, non rispetto al riferimento.",
      "Identificare l'energia di attivazione di Arrhenius con ΔH‡: differiscono di RT, cioè di circa 2,5 kJ/mol a temperatura ambiente."
    ],
    esempio: {
      testo: "Un elettrodo ha i₀ = 1,0·10⁻³ A/cm², αₐ = α_c = 0,5, T = 298,15 K. Con RT/F = 0,025693 V la resistenza di trasferimento è R_ct = 0,025693/10⁻³ = 25,7 Ω·cm². Per far passare 10 mA/cm²: Butler-Volmer con α = 0,5 diventa i = 2i₀ sinh(Fη/2RT), quindi sinh(Fη/2RT) = 5 e Fη/2RT = arcsinh 5 = 2,3124, da cui η = 2,3124 · 0,051385 V = 0,1188 V. La pendenza di Tafel è b = 2,303 · 0,051385 = 0,1183 V/decade, e la stima di Tafel per un fattore 10 su i₀ è proprio 118,3 mV.",
      risultato: "R_ct ≈ 25,7 Ω·cm²; η ≈ 119 mV (Butler-Volmer esatta) contro 118 mV (Tafel)"
    },
    fonti: [
      "A. J. Bard, L. R. Faulkner, Electrochemical Methods: Fundamentals and Applications, Wiley, 2ª ed., 2001, cap. 3 (cinetica del trasferimento elettronico) e cap. 1 (trasporto di massa)",
      "P. Atkins, J. de Paula, Physical Chemistry, Oxford University Press, capitoli sui processi agli elettrodi e sulla teoria dello stato di transizione",
      "H. Eyring, The activated complex in chemical reactions, J. Chem. Phys. 3 (1935) 107",
      "K. J. Laidler, M. C. King, The development of transition-state theory, J. Phys. Chem. 87 (1983) 2657"
    ],
    collegamenti: ['schivolt', 'snernst', 'schicinet', 'skin']
  };

  /* ── 🌟 Fotochimica, superfici e polimeri ───────────────────────────── */
  T['sfotosup'] = {
    titolo: "Fotofisica molecolare, adsorbimento sulle superfici e statistica dei polimeri",
    sintesi: "Tre capitoli della chimica fisica che hanno in comune il ragionamento cinetico e statistico. Una molecola eccitata si diseccita per vie in competizione, e le rese quantiche sono rapporti fra costanti di velocità; il quenching si misura con la retta di Stern-Volmer. L'adsorbimento si descrive con isoterme (Langmuir, Freundlich, BET) da cui si ricava l'area superficiale. Un polimero è una distribuzione di catene, caratterizzata da medie e dispersità, con dimensioni date dalla statistica del cammino casuale.",
    paragrafi: [
      { titolo: "Il diagramma di Jablonski", testo: "Assorbendo un fotone una molecola passa dallo stato fondamentale di singoletto S₀ a uno stato eccitato S₁ o S₂; per la regola di Kasha la conversione interna la porta in pochi picosecondi al livello vibrazionale più basso di S₁, da cui partono i processi che contano. Dal S₁ la molecola può emettere fluorescenza (costante k_f), tornare a S₀ senza emettere (conversione interna, k_IC), passare al tripletto T₁ cambiando spin (intersystem crossing, k_ISC) o essere spenta da un quencher (k_q[Q]). Dal T₁ la fosforescenza è proibita di spin: costanti piccole, vite dai microsecondi ai secondi, e grande sensibilità all'ossigeno, che è un tripletto e spegne con efficienza." },
      { titolo: "Rese quantiche e tempi di vita", testo: "Poiché i processi da S₁ sono del primo ordine e in competizione, la popolazione decade con la somma delle costanti e il tempo di vita è τ_S = 1/(k_f + k_IC + k_ISC + k_q[Q]). La resa quantica di ciascun processo è la sua costante divisa per la somma: Φ_F = k_f τ_S, Φ_ISC = k_ISC τ_S, e la somma delle rese da S₁ vale 1. La fosforescenza richiede due passaggi, per cui Φ_P = Φ_ISC · k_P/(k_P + k_nr,T). Da una misura di Φ_F e di τ_S si ricava la costante radiativa k_f = Φ_F/τ_S, che si può confrontare con quella prevista dall'intensità della banda di assorbimento (relazione di Strickler e Berg)." },
      { titolo: "Il quenching e la retta di Stern-Volmer", testo: "Se il quencher spegne per collisione durante la vita dello stato eccitato (quenching dinamico), il rapporto fra intensità senza e con quencher è F₀/F = 1 + k_qτ₀[Q] = 1 + K_SV[Q]: una retta con intercetta 1. Dalla pendenza K_SV e dal tempo di vita τ₀ si ottiene k_q. Il confronto con il limite diffusivo, k_d = 8RT/(3η) ≈ 7·10⁹ M⁻¹s⁻¹ in acqua a 25 °C, dice quanto è efficiente ogni incontro. Valori di k_q molto superiori indicano quenching statico, cioè un complesso non fluorescente che si forma già al buio; i due casi si distinguono perché solo il quenching dinamico accorcia anche il tempo di vita, τ₀/τ = F₀/F." },
      { titolo: "Le isoterme di adsorbimento", testo: "Langmuir (1918) immaginò una superficie con siti equivalenti e indipendenti, ciascuno capace di ospitare una sola molecola: all'equilibrio fra adsorbimento e desorbimento il ricoprimento vale θ = KP/(1 + KP), e in forma lineare P/n = 1/(n_m K) + P/n_m. Freundlich propose la legge empirica q = kC^(1/n), adatta a superfici eterogenee con una distribuzione di energie di adsorbimento; un esponente 1/n minore di 1 indica adsorbimento favorevole. Brunauer, Emmett e Teller (1938) estesero Langmuir a più strati, supponendo che dal secondo in poi le molecole si comportino come nel liquido: ne risulta l'equazione BET." },
      { titolo: "L'area superficiale con la BET", testo: "L'equazione BET, scritta con x = P/P₀, si linearizza in x/[n(1 − x)] = 1/(n_m c) + (c − 1)x/(n_m c). Dalla pendenza e dall'intercetta si ottengono la capacità del monostrato n_m e la costante c, legata alla differenza fra calore di adsorbimento del primo strato e calore di liquefazione. L'area specifica è n_m N_A σ, con σ = 0,162 nm² per una molecola di azoto a 77 K. La retta si traccia di norma fra P/P₀ = 0,05 e 0,35: sotto pesano i siti più energetici, sopra la condensazione capillare nei pori. È il metodo standard (ISO 9277) per carboni attivi, zeoliti, catalizzatori e polveri farmaceutiche." },
      { titolo: "Medie molecolari e statistica delle catene", testo: "Un campione di polimero contiene catene di lunghezze diverse, per cui si definiscono più medie: M_n = ΣNᵢMᵢ/ΣNᵢ, sensibile alle catene corte (osmometria), e M_w = ΣNᵢMᵢ²/ΣNᵢMᵢ, sensibile a quelle lunghe (diffusione della luce). La dispersità Đ = M_w/M_n vale 1 solo per un campione monodisperso. Nella polimerizzazione a stadi di Carothers il grado medio di polimerizzazione è X̄_n = 1/(1 − p): al 99 % di conversione si hanno appena 100 unità, e la distribuzione di Flory ha Đ = 1 + p, cioè quasi 2. Una catena flessibile ideale è un cammino casuale: ⟨r²⟩ = C∞ n l² e raggio di girazione R_g² = ⟨r²⟩/6, con C∞ ≈ 6,7 per il polietilene." }
    ],
    formule: [
      ["τ_S = 1/(k_f + k_IC + k_ISC + k_q[Q]),  Φ_F = k_f τ_S", "tempo di vita del singoletto (s) e resa quantica di fluorescenza (adimensionale)"],
      ["F₀/F = 1 + k_q τ₀ [Q] = 1 + K_SV [Q]", "equazione di Stern-Volmer; [Q] in mol/L, K_SV in M⁻¹, k_q in M⁻¹s⁻¹"],
      ["θ = KP/(1 + KP)", "isoterma di Langmuir; θ frazione di siti occupati, K costante di adsorbimento, P pressione"],
      ["x/[n(1−x)] = 1/(n_m c) + (c−1)x/(n_m c)", "BET linearizzata; x = P/P₀, n quantità adsorbita, n_m capacità del monostrato"],
      ["S = n_m N_A σ", "area specifica; σ = 0,162 nm² per N₂ a 77 K, N_A costante di Avogadro"],
      ["X̄_n = 1/(1 − p),  Đ = 1 + p", "polimerizzazione a stadi (Carothers e Flory); p conversione dei gruppi funzionali"],
      ["⟨r²⟩ = C∞ n l²,  R_g² = ⟨r²⟩/6", "catena ideale; n legami di lunghezza l, C∞ rapporto caratteristico"]
    ],
    ipotesi: [
      "Il modello cinetico di Jablonski presuppone processi del primo ordine e rilassamento vibrazionale rapido rispetto alle altre costanti.",
      "Stern-Volmer lineare vale per un solo tipo di fluoroforo accessibile e quenching puramente dinamico; la curvatura verso l'alto indica una componente statica, verso il basso fluorofori non accessibili.",
      "Langmuir richiede siti equivalenti senza interazioni laterali; la BET vale solo nell'intervallo 0,05–0,35 di P/P₀ e su superfici non microporose.",
      "La catena ideale ignora il volume escluso: in un buon solvente le catene reali sono più gonfie (R_g ∝ n^0,588 invece di n^½)."
    ],
    errori: [
      "Ricavare k_q dalla pendenza di Stern-Volmer senza dividere per τ₀, o con τ₀ in unità sbagliate.",
      "Usare tutta l'isoterma per la retta BET: fuori dall'intervallo la retta perde significato e l'area esce sbagliata anche di molto.",
      "Pensare che M_n e M_w coincidano: coincidono solo in un campione monodisperso; per una distribuzione di Flory M_w è quasi il doppio di M_n."
    ],
    esempio: {
      testo: "I dati predefiniti della scheda Stern-Volmer sono [Q] = 0; 2; 4; 6; 8; 10 mM con F₀/F = 1,00; 1,21; 1,40; 1,62; 1,81; 2,02, e τ₀ = 10 ns. La regressione lineare dà pendenza K_SV = 101,7 M⁻¹ e intercetta 1,001, coerente con il valore atteso 1. Quindi k_q = K_SV/τ₀ = 101,7 M⁻¹ / 1,0·10⁻⁸ s = 1,02·10¹⁰ M⁻¹s⁻¹, dello stesso ordine del limite diffusivo in acqua (circa 7·10⁹ M⁻¹s⁻¹).",
      risultato: "K_SV ≈ 102 M⁻¹, k_q ≈ 1,0·10¹⁰ M⁻¹s⁻¹: quasi ogni incontro spegne"
    },
    fonti: [
      "J. R. Lakowicz, Principles of Fluorescence Spectroscopy, Springer, 3ª ed., 2006, cap. 1 (Jablonski e rese) e cap. 8 (quenching)",
      "N. J. Turro, V. Ramamurthy, J. C. Scaiano, Modern Molecular Photochemistry of Organic Molecules, University Science Books, 2010, capitoli sui processi fotofisici",
      "S. Brunauer, P. H. Emmett, E. Teller, Adsorption of gases in multimolecular layers, J. Am. Chem. Soc. 60 (1938) 309",
      "M. Rubinstein, R. H. Colby, Polymer Physics, Oxford University Press, 2003, cap. 1 (medie e distribuzioni) e cap. 2 (catene ideali)",
      "G. Odian, Principles of Polymerization, Wiley, 4ª ed., 2004, cap. 2 (polimerizzazione a stadi)"
    ],
    collegamenti: ['suvvis', 'schicinet', 'sfislaser', 'smacro3d']
  };

  /* ── 🌀 Spin, qubit ed entanglement ──────────────────────────────────── */
  T['sfisspin'] = {
    titolo: "Lo spin ½: misura quantistica, qubit, disuguaglianze di Bell e crittografia",
    sintesi: "Lo spin ½ è il più semplice sistema quantistico: due soli esiti per ogni misura, probabilità date dalla regola di Born, stati rappresentati come punti della sfera di Bloch. Con esso si vedono la non commutatività delle misure (Stern-Gerlach in sequenza), le porte logiche quantistiche come rotazioni, le correlazioni dell'entanglement che violano le disuguaglianze di Bell e il principio su cui si basa la distribuzione quantistica delle chiavi BB84.",
    paragrafi: [
      { titolo: "L'esperimento di Stern e Gerlach", testo: "Nel 1922 Stern e Gerlach fecero passare un fascio di atomi d'argento in un campo magnetico fortemente disomogeneo. La forza su un momento magnetico è proporzionale alla sua componente lungo il gradiente, per cui classicamente ci si aspettava una macchia continua; si osservarono invece due macchie distinte. L'argento ha un solo elettrone esterno in un orbitale s, e il suo momento magnetico viene dallo spin di quell'elettrone: la componente lungo qualunque asse può valere solo +ħ/2 o −ħ/2. Il magnete agisce quindi come un apparato di misura con due soli esiti, ed è il punto di partenza di molti testi di meccanica quantistica." },
      { titolo: "Misure in sequenza", testo: "Se si conserva solo il fascio «su» lungo z e lo si fa passare in un secondo magnete orientato lungo una direzione n′ che forma un angolo Δθ con z, la probabilità di uscire «su» è cos²(Δθ/2) = (1 + n·n′)/2. A 90° si ottiene il 50 %, a 60° il 75 %. Il risultato più istruttivo è la sequenza z → x → z: dopo il primo magnete gli atomi «giù» lungo z sono stati eliminati, eppure dopo la misura lungo x il terzo magnete ne ritrova il 50 %. La misura lungo x ha cancellato l'informazione su z, perché le due componenti dello spin non commutano e non possono avere valori definiti contemporaneamente." },
      { titolo: "Il qubit e la sfera di Bloch", testo: "Lo stato più generale di uno spin ½ è |ψ⟩ = α|0⟩ + β|1⟩, con |α|² + |β|² = 1, e la fase globale non ha significato fisico. Restano due parametri reali, che si possono scrivere α = cos(θ/2), β = e^(iφ) sin(θ/2): un punto della sfera unitaria, con coordinate (2 Re ᾱβ, 2 Im ᾱβ, |α|² − |β|²). Ogni porta logica a un qubit è una matrice unitaria 2×2 e, a meno di una fase, una rotazione della sfera: U = cos(ϑ/2) I − i sin(ϑ/2) n·σ ruota di un angolo ϑ attorno all'asse n. Così X è mezzo giro attorno a x, Z mezzo giro attorno a z, la porta di Hadamard mezzo giro attorno alla bisettrice fra x e z. La misura lungo z dà 0 con probabilità |α|² (regola di Born) e lascia il qubit nello stato misurato." },
      { titolo: "Entanglement e disuguaglianze di Bell", testo: "Due spin nello stato di singoletto (|01⟩ − |10⟩)/√2 non hanno ciascuno uno stato proprio, ma sono perfettamente anticorrelati lungo qualunque asse; per misure lungo direzioni che formano un angolo a − b la correlazione vale E(a, b) = −cos(a − b). Bell (1964) mostrò che nessuna teoria a variabili nascoste locali può riprodurre queste correlazioni. Nella forma di Clauser, Horne, Shimony e Holt (1969) la combinazione S = E(a,b) − E(a,b′) + E(a′,b) + E(a′,b′) deve soddisfare |S| ≤ 2 in ogni modello locale, mentre la meccanica quantistica arriva a 2√2 ≈ 2,83 (limite di Tsirelson). Gli esperimenti di Aspect (1982) e quelli senza scappatoie del 2015 hanno confermato la previsione quantistica; il Nobel 2022 ad Aspect, Clauser e Zeilinger lo ha riconosciuto." },
      { titolo: "Che cosa non dice la violazione di Bell", testo: "La violazione non permette di trasmettere informazione più veloce della luce: le statistiche di ciascun lato, prese da sole, sono casuali al 50 % qualunque cosa faccia l'altro, e la correlazione emerge solo quando i risultati vengono confrontati con un canale ordinario. Ciò che viene escluso è la combinazione di realismo locale: l'idea che i risultati siano fissati in anticipo da proprietà locali delle particelle. Le diverse interpretazioni della meccanica quantistica rinunciano a ingredienti diversi, e questa è una questione ancora discussa; i fatti sperimentali, invece, sono solidi." },
      { titolo: "La distribuzione quantistica delle chiavi BB84", testo: "Nel protocollo di Bennett e Brassard (1984) Alice invia fotoni polarizzati in una di due basi scelte a caso (rettilinea o diagonale) e Bob misura in una base anch'essa casuale; poi i due rendono pubbliche le basi, non i risultati, e tengono solo i bit in cui coincidono, circa la metà. Una spia che intercetta e rispedisce sceglie la base sbagliata metà delle volte e in quel caso produce un errore con probabilità ½: il tasso d'errore sui bit intercettati sale al 25 %. Il teorema di non clonazione impedisce di copiare lo stato senza disturbarlo. Se il tasso d'errore Q osservato resta sotto circa l'11 %, la correzione degli errori e l'amplificazione della privatezza producono una chiave sicura con resa r = 1 − 2h(Q) (Shor e Preskill, 2000)." }
    ],
    formule: [
      ["P(su lungo n′ | su lungo n) = cos²(Δθ/2) = (1 + n·n′)/2", "probabilità di uno spin ½ preparato lungo n; Δθ angolo fra i due assi"],
      ["|ψ⟩ = cos(θ/2)|0⟩ + e^(iφ) sin(θ/2)|1⟩", "stato di un qubit; θ e φ coordinate polari sulla sfera di Bloch"],
      ["U = e^(iγ)[cos(ϑ/2) I − i sin(ϑ/2) n·σ]", "porta a un qubit come rotazione di angolo ϑ attorno all'asse n; σ matrici di Pauli"],
      ["E(a, b) = −cos(a − b)", "correlazione dello stato di singoletto per misure lungo direzioni a e b"],
      ["|S| ≤ 2 (locale),  |S| ≤ 2√2 (quantistico)", "disuguaglianza CHSH e limite di Tsirelson"],
      ["r = 1 − 2h(Q),  h(Q) = −Q log₂Q − (1−Q) log₂(1−Q)", "resa della chiave sicura BB84 in funzione del tasso d'errore Q"]
    ],
    ipotesi: [
      "Si considera solo il grado di libertà di spin, trascurando il moto orbitale nel magnete (in Stern-Gerlach è ciò che separa i fasci, ma non cambia le probabilità).",
      "Le porte sono ideali e senza decoerenza; nei qubit reali gli stati si degradano in tempi finiti (T₁, T₂).",
      "La sicurezza BB84 qui discussa presuppone sorgenti a singolo fotone e un attacco di tipo intercetta e rispedisci; le analisi complete trattano attacchi generali."
    ],
    errori: [
      "Pensare che lo spin sia una rotazione della particella su se stessa: è un momento angolare intrinseco senza analogo classico, e assume solo valori ±ħ/2 lungo qualunque asse.",
      "Confondere l'angolo sulla sfera di Bloch con quello nello spazio degli stati: stati ortogonali sono antipodali sulla sfera, cioè separati di 180°, non di 90°.",
      "Credere che l'entanglement permetta di comunicare istantaneamente: le statistiche locali non cambiano, serve sempre un canale classico."
    ],
    esempio: {
      testo: "Si calcoli S per il singoletto con a = 0°, a′ = 90°, b = 45°, b′ = 135°. E(a,b) = −cos(−45°) = −0,7071; E(a,b′) = −cos(−135°) = +0,7071; E(a′,b) = −cos(45°) = −0,7071; E(a′,b′) = −cos(−45°) = −0,7071. Allora S = −0,7071 − 0,7071 − 0,7071 − 0,7071. In valore assoluto il risultato supera di oltre il 40 % il limite locale 2.",
      risultato: "S = −2√2 ≈ −2,828, |S| > 2: violazione massima della disuguaglianza CHSH"
    },
    fonti: [
      "J. J. Sakurai, J. Napolitano, Modern Quantum Mechanics, Cambridge University Press, 3ª ed., 2020, cap. 1 (Stern-Gerlach, spin ½) e cap. 3 (disuguaglianze di Bell)",
      "M. A. Nielsen, I. L. Chuang, Quantum Computation and Quantum Information, Cambridge University Press, ed. del decennale 2010, cap. 1, 2 (sfera di Bloch, Bell), 4 (porte) e 12 (distribuzione quantistica delle chiavi)",
      "J. F. Clauser, M. A. Horne, A. Shimony, R. A. Holt, Proposed experiment to test local hidden-variable theories, Phys. Rev. Lett. 23 (1969) 880",
      "P. W. Shor, J. Preskill, Simple proof of security of the BB84 quantum key distribution protocol, Phys. Rev. Lett. 85 (2000) 441",
      "B. Hensen et al., Loophole-free Bell inequality violation using electron spins separated by 1.3 kilometres, Nature 526 (2015) 682"
    ],
    collegamenti: ['sqm', 'sschrod', 'sfispart', 'smatlin']
  };

  /* ── 🎲 Meccanica statistica ─────────────────────────────────────────── */
  T['sfisstat'] = {
    titolo: "Meccanica statistica: dal fattore di Boltzmann ai gas quantistici e ai solidi",
    sintesi: "Un sistema in equilibrio con un bagno termico occupa i suoi stati con probabilità proporzionale a e^(−E/kT). Da questo solo principio, attraverso la funzione di partizione, discendono le popolazioni dei livelli, l'anomalia di Schottky, la distribuzione delle velocità di Maxwell, e, quando le particelle sono identiche e quantistiche, le statistiche di Fermi-Dirac e di Bose-Einstein. Applicate alle vibrazioni di un reticolo, danno le capacità termiche di Einstein e di Debye.",
    paragrafi: [
      { titolo: "La funzione di partizione", testo: "Nell'insieme canonico la probabilità che il sistema stia in un livello di energia Eᵢ con degenerazione gᵢ è pᵢ = gᵢe^(−Eᵢ/kT)/Z, dove Z = Σgᵢe^(−Eᵢ/kT) è la funzione di partizione. Z contiene tutta la termodinamica: l'energia media è U = −∂ln Z/∂β con β = 1/kT, l'energia libera F = −kT ln Z, l'entropia S = (U − F)/T. La capacità termica ha un significato statistico notevole: C = (⟨E²⟩ − ⟨E⟩²)/kT², cioè misura le fluttuazioni dell'energia. Per questo C non può mai essere negativa in un sistema all'equilibrio canonico, ed è grande proprio dove il sistema è più indeciso fra stati di energia diversa." },
      { titolo: "Due livelli e l'anomalia di Schottky", testo: "Un sistema con due soli livelli separati da Δ ha C/k = x²eˣ/(1 + eˣ)², con x = Δ/kT. A bassa temperatura quasi nessuno raggiunge il livello superiore e C tende a zero esponenzialmente; ad alta temperatura i due livelli sono quasi ugualmente popolati, l'energia non può più crescere e C torna a zero come 1/T². In mezzo c'è un massimo a kT = 0,4168 Δ, dove C = 0,439 k: è l'anomalia di Schottky, osservata nei sali paramagnetici, negli spin nucleari e nei difetti dei cristalli. Diversamente da un oscillatore armonico, che ha infiniti livelli, un sistema a livelli limitati satura: si confronti nella scheda con l'oscillatore e con il rotore rigido." },
      { titolo: "La distribuzione di Maxwell-Boltzmann", testo: "Per le molecole di un gas ideale, il fattore di Boltzmann applicato all'energia cinetica e il volume 4πv² dv dei gusci nello spazio delle velocità danno f(v) = 4π(m/2πkT)^(3/2) v² e^(−mv²/2kT). Le tre velocità caratteristiche stanno fra loro come 1 : 1,128 : 1,225: velocità più probabile √(2kT/m), media √(8kT/πm), quadratica media √(3kT/m). Per l'azoto a 300 K valgono 422, 476 e 517 m/s. La simulazione 3D mostra che la distribuzione è un attrattore: sfere dure che partono tutte con la stessa velocità, urtandosi elasticamente, ridistribuiscono l'energia finché l'istogramma coincide con la curva di Maxwell, e il rapporto ⟨v⁴⟩/⟨v²⟩² passa da 1 a 5/3, come previsto dal teorema H di Boltzmann." },
      { titolo: "Fermioni: il gas di elettroni dei metalli", testo: "Particelle identiche di spin semintero obbediscono al principio di Pauli: ogni stato di particella singola ospita al più un fermione, e il numero medio di occupazione è 1/(e^((E−μ)/kT) + 1). A temperatura zero gli elettroni di conduzione riempiono tutti gli stati fino all'energia di Fermi E_F = ħ²(3π²n)^(2/3)/2m, che per il rame vale circa 7,0 eV, pari a una temperatura di Fermi di oltre 80 000 K. A temperatura ambiente la distribuzione è quindi «fredda»: solo gli elettroni entro qualche kT da E_F possono cambiare stato, e la capacità termica elettronica è piccola e lineare in T, C_el = (π²/2)Nk(T/T_F). Il potenziale chimico scende appena con T, secondo lo sviluppo di Sommerfeld μ ≈ E_F[1 − (π²/12)(kT/E_F)²]." },
      { titolo: "Bosoni: la condensazione di Bose-Einstein", testo: "Per particelle di spin intero l'occupazione è 1/(e^((E−μ)/kT) − 1), con μ che non può superare l'energia dello stato fondamentale. In un gas ideale tridimensionale, sotto la temperatura critica T_c = (2πħ²/mk)(n/ζ(3/2))^(2/3), con ζ(3/2) = 2,612, gli stati eccitati non bastano più a contenere tutte le particelle e una frazione macroscopica N₀/N = 1 − (T/T_c)^(3/2) si accumula nello stato fondamentale. La previsione di Einstein (1925) fu realizzata nel 1995 con atomi di rubidio a meno di un microkelvin da Cornell e Wieman, e con il sodio da Ketterle: premio Nobel 2001. L'elio superfluido è parente di questo fenomeno, ma le forti interazioni lo rendono più complesso." },
      { titolo: "La capacità termica dei solidi", testo: "Classicamente ogni atomo di un solido è un oscillatore in tre dimensioni e il teorema di equipartizione dà 3R per mole (legge di Dulong e Petit). Einstein (1907) quantizzò gli oscillatori, tutti con la stessa frequenza: la capacità cala a bassa T, ma troppo in fretta, in modo esponenziale. Debye (1912) trattò invece il solido come un continuo con onde elastiche (fononi) fino a una frequenza massima ω_D, scelta in modo che i modi siano 3N: a bassa temperatura sopravvivono solo le onde lunghe e la capacità segue la legge C = (12π⁴/5)R(T/Θ_D)³ ≈ 1944 J/(mol·K) · (T/Θ_D)³, confermata dagli esperimenti sotto circa Θ_D/50. Per il rame Θ_D ≈ 343 K. Nei metalli, a temperature di pochi kelvin, il termine elettronico lineare in T diventa confrontabile con quello dei fononi." }
    ],
    formule: [
      ["Z = Σ gᵢ e^(−Eᵢ/kT),  pᵢ = gᵢ e^(−Eᵢ/kT)/Z", "funzione di partizione canonica e popolazione del livello i; k costante di Boltzmann, T temperatura assoluta"],
      ["C = (⟨E²⟩ − ⟨E⟩²)/(kT²)", "capacità termica come varianza dell'energia"],
      ["C/k = x² eˣ/(1 + eˣ)²,  x = Δ/kT", "sistema a due livelli non degeneri (anomalia di Schottky)"],
      ["f(v) = 4π (m/2πkT)^(3/2) v² e^(−mv²/2kT)", "distribuzione di Maxwell delle velocità; m massa di una molecola"],
      ["E_F = ħ²(3π²n)^(2/3)/(2m)", "energia di Fermi di un gas di elettroni liberi; n densità elettronica (m⁻³)"],
      ["T_c = (2πħ²/mk)(n/ζ(3/2))^(2/3),  N₀/N = 1 − (T/T_c)^(3/2)", "condensazione di Bose-Einstein di un gas ideale"],
      ["C = (12π⁴/5) R (T/Θ_D)³", "legge T³ di Debye per T ≪ Θ_D; R costante dei gas, Θ_D temperatura di Debye"]
    ],
    ipotesi: [
      "Insieme canonico: sistema in equilibrio termico con un bagno a temperatura T; particelle non interagenti salvo dove indicato.",
      "Maxwell-Boltzmann vale per un gas classico diluito, quando la lunghezza d'onda termica è molto minore della distanza fra le molecole.",
      "Il modello di Debye usa una sola velocità del suono e una sfera nello spazio dei vettori d'onda: è esatto a bassa e alta temperatura, approssimato in mezzo."
    ],
    errori: [
      "Credere che a temperatura infinita il livello superiore di un sistema a due livelli sia più popolato: le popolazioni tendono a diventare uguali; un'inversione corrisponde formalmente a temperature negative.",
      "Usare la velocità quadratica media come velocità «tipica» di una molecola: la velocità più probabile è più bassa del 18 %.",
      "Pensare che nei metalli tutti gli elettroni contribuiscano 3k/2 alla capacità termica: per il principio di Pauli partecipa solo una frazione dell'ordine di kT/E_F, circa l'1 % a temperatura ambiente."
    ],
    esempio: {
      testo: "Energia di Fermi del rame, con un elettrone di conduzione per atomo: n = 8,47·10²⁸ m⁻³. Si calcola 3π²n = 2,508·10³⁰ m⁻³ e la sua potenza 2/3, 1,846·10²⁰ m⁻². Il fattore ħ²/2m vale (1,0546·10⁻³⁴)²/(2 · 9,109·10⁻³¹) = 6,104·10⁻³⁹ J·m². Il prodotto è E_F = 1,127·10⁻¹⁸ J = 7,03 eV. Dividendo per k si ha T_F = 8,2·10⁴ K, e la velocità di Fermi √(2E_F/m) = 1,57·10⁶ m/s.",
      risultato: "E_F ≈ 7,0 eV, T_F ≈ 82 000 K, v_F ≈ 1,6·10⁶ m/s"
    },
    fonti: [
      "R. K. Pathria, P. D. Beale, Statistical Mechanics, Academic Press, 3ª ed., 2011, cap. 3 (insieme canonico), cap. 7 (Bose-Einstein) e cap. 8 (Fermi-Dirac)",
      "F. Reif, Fundamentals of Statistical and Thermal Physics, McGraw-Hill, 1965, cap. 7 (Maxwell, Schottky) e cap. 9 (statistiche quantistiche)",
      "C. Kittel, Introduction to Solid State Physics, Wiley, 8ª ed., 2005, cap. 5 (fononi e capacità termica) e cap. 6 (gas di elettroni liberi)",
      "M. H. Anderson, J. R. Ensher, M. R. Matthews, C. E. Wieman, E. A. Cornell, Observation of Bose-Einstein condensation in a dilute atomic vapor, Science 269 (1995) 198"
    ],
    collegamenti: ['stermostat', 'sfisising', 'sfistermo', 'sdinmol', 'sfissolido']
  };

  /* ── ☢️ Nuclei e reazioni ────────────────────────────────────────────── */
  T['sfisnuclei'] = {
    titolo: "Il nucleo atomico: stabilità, valori Q, effetto tunnel e cinetica del reattore",
    sintesi: "Il nucleo è un sistema di protoni e neutroni tenuti insieme dalla forza nucleare a corto raggio e respinti dalla forza coulombiana. Il modello a goccia spiega la valle di stabilità e i decadimenti previsti; i bilanci di massa danno l'energia liberata dalle reazioni; l'effetto tunnel attraverso la barriera di Coulomb spiega le vite α e la fusione nelle stelle; la cinetica dei neutroni pronti e ritardati spiega perché un reattore a fissione si può controllare.",
    paragrafi: [
      { titolo: "La goccia nucleare e la valle di stabilità", testo: "La densità dei nuclei è quasi la stessa per tutti: il raggio cresce come R = r₀A^(1/3), con r₀ ≈ 1,2 fm, e la densità vale circa 0,14 nucleoni per fm³, cioè 2·10¹⁷ kg/m³. Questo, insieme alla saturazione delle forze nucleari, giustifica il modello a goccia e la formula semiempirica, con i termini di volume, superficie, Coulomb, asimmetria e accoppiamento. Nella sezione ogni nucleo (N, Z) diventa una barra in 3D, colorata secondo il decadimento che la formula prevede: β⁻ se ha troppi neutroni, β⁺ o cattura elettronica se ha troppi protoni, α se è pesante e l'emissione di un nucleo di elio è energeticamente permessa. I piani dei numeri magici ricordano che il modello a goccia ignora gli effetti di guscio." },
      { titolo: "Valori Q dalle masse atomiche", testo: "L'energia liberata da una reazione o da un decadimento è il difetto di massa moltiplicato per c²: Q = (Σm_iniziali − Σm_finali)c², con 1 u = 931,494 MeV/c². Usando masse atomiche, tratte dalla valutazione AME, gli elettroni si bilanciano automaticamente nei decadimenti α e β⁻, mentre nel β⁺ va sottratto 2m_ec². La fusione deuterio-trizio libera 17,59 MeV, il decadimento α del ²³⁸U 4,27 MeV, la fissione di un nucleo di ²³⁵U circa 200 MeV, contando anche i decadimenti dei frammenti. In una reazione a due corpi finali, partendo da quiete, la conservazione dell'impulso divide l'energia in proporzione inversa alle masse: il corpo leggero se ne porta la parte maggiore." },
      { titolo: "La barriera di Coulomb e il decadimento α", testo: "Una particella α dentro il nucleo ha energia positiva Q ma è trattenuta da una barriera coulombiana alta decine di MeV: per il ²³⁸U la barriera al contatto fra α e ²³⁴Th vale circa 28 MeV, contro i 4,27 MeV disponibili. Classicamente la particella non uscirebbe mai; quantisticamente attraversa la barriera per effetto tunnel con probabilità e^(−G), dove il fattore di Gamow si calcola con l'approssimazione WKB e ha la forma chiusa riportata fra le formule. La sezione lo verifica anche con l'integrale numerico. Poiché G dipende da Z/√Q, piccole variazioni di Q cambiano enormemente l'emivita: è la legge di Geiger-Nuttall, che copre più di venti ordini di grandezza, dai 14 miliardi di anni del ²³²Th ai 0,3 μs del ²¹²Po." },
      { titolo: "La fusione nelle stelle e il picco di Gamow", testo: "Al centro del Sole kT vale circa 1,35 keV, mille volte meno della barriera fra due protoni. La fusione avviene grazie a due code che si sovrappongono: la distribuzione di Maxwell, che decresce come e^(−E/kT), e la probabilità di tunnel, che cresce come e^(−√(E_G/E)). Il prodotto ha un massimo stretto, il picco di Gamow, a E₀ = (E_G^(1/2) kT/2)^(2/3), dove E_G = 2μc²(παZ₁Z₂)² è l'energia di Gamow. Per due protoni a 15,7 milioni di kelvin E_G ≈ 493 keV ed E₀ ≈ 6 keV: le reazioni avvengono a energie molte volte superiori a kT ma molto inferiori alla barriera. Per nuclei più carichi E_G cresce come Z₁²Z₂², ed è per questo che il ciclo CNO e la combustione dell'elio richiedono temperature più alte." },
      { titolo: "La cinetica di un reattore", testo: "In un reattore a fissione ogni generazione di neutroni dura Λ ≈ 10⁻⁴ s, e la reattività ρ misura lo scostamento relativo dalla criticità. Con i soli neutroni pronti una reattività di 0,001 farebbe crescere la potenza di un fattore e ogni Λ/ρ = 0,1 s, ingovernabile. Lo 0,65 % dei neutroni, nel caso dell'²³⁵U, è però ritardato: viene emesso secondi dopo dai prodotti di fissione. Nel modello puntiforme a un gruppo, dn/dt = (ρ − β)n/Λ + λC e dC/dt = βn/Λ − λC; un gradino di reattività provoca un salto pronto quasi istantaneo n₊/n₀ = β/(β − ρ), seguito da una crescita lenta con il periodo stabile fissato dall'equazione inhour. Finché ρ < β il reattore è governato dai ritardati; ρ = β, un «dollaro», è la soglia di criticità pronta." }
    ],
    formule: [
      ["R = r₀ A^(1/3),  r₀ ≈ 1,2 fm", "raggio nucleare; A numero di massa"],
      ["Q = (Σm_i − Σm_f) c²,  1 u·c² = 931,494 MeV", "valore Q di una reazione o di un decadimento, dalle masse atomiche"],
      ["T_leggero = Q · m_pesante/(m_leggero + m_pesante)", "ripartizione non relativistica dell'energia fra due prodotti, partendo da quiete"],
      ["G = (2/ħ)√(2μQ) · b · [arccos√x − √(x(1 − x))],  x = R/b", "fattore di Gamow; b = Z₁Z₂e²/(4πε₀Q) punto di inversione classico, μ massa ridotta"],
      ["E₀ = (E_G^(1/2) kT/2)^(2/3),  E_G = 2μc²(παZ₁Z₂)²", "picco di Gamow delle reazioni termonucleari; α costante di struttura fine"],
      ["n₊/n₀ = β/(β − ρ);  ρ = ωΛ + ωβ/(ω + λ)", "salto pronto ed equazione inhour a un gruppo; ω inverso del periodo stabile"]
    ],
    ipotesi: [
      "La formula semiempirica non contiene gli effetti di guscio né la deformazione: le previsioni di decadimento sono indicative, specie vicino ai numeri magici e per nuclei leggeri.",
      "Il fattore di Gamow usa l'approssimazione WKB con barriera puramente coulombiana e momento angolare nullo.",
      "La cinetica puntiforme a un gruppo tratta il nocciolo come un punto e riassume in un solo λ i sei gruppi di precursori; non contiene le retroazioni di temperatura che stabilizzano i reattori veri."
    ],
    errori: [
      "Attribuire tutta l'energia del decadimento α alla particella α: una piccola frazione, circa il 2 % per i nuclei pesanti, va in rinculo al nucleo figlio.",
      "Pensare che la fusione nel Sole richieda che i protoni superino la barriera: avviene per effetto tunnel, a energie di pochi keV.",
      "Credere che un reattore sia controllato dalla velocità delle barre di controllo: è controllabile grazie ai neutroni ritardati, che allungano il tempo di risposta da decimi di millisecondo a decine di secondi."
    ],
    esempio: {
      testo: "Fusione D + T → ⁴He + n. Masse atomiche: ²H 2,014101778 u, ³H 3,016049281 u, ⁴He 4,002603254 u, n 1,008664916 u. La massa iniziale è 5,030151059 u, la finale 5,011268170 u, la differenza 0,018882889 u. Moltiplicando per 931,494 MeV/u si ottiene Q. Il neutrone, più leggero, prende la frazione m_α/(m_α + m_n) = 4,0026/5,0113 = 0,7987 dell'energia.",
      risultato: "Q = 17,59 MeV; neutrone 14,05 MeV, particella α 3,54 MeV"
    },
    fonti: [
      "K. S. Krane, Introductory Nuclear Physics, Wiley, 1988, cap. 3 (masse e formula semiempirica), cap. 8 (decadimento α e fattore di Gamow), cap. 13 (fissione e reattori)",
      "B. R. Martin, Nuclear and Particle Physics: An Introduction, Wiley, 2ª ed., 2009, capitoli sul modello a goccia, sul decadimento α e sulla fusione stellare",
      "C. E. Rolfs, W. S. Rodney, Cauldrons in the Cosmos, University of Chicago Press, 1988, capitolo sul picco di Gamow",
      "J. R. Lamarsh, A. J. Baratta, Introduction to Nuclear Engineering, Prentice Hall, 3ª ed., 2001, capitolo sulla cinetica del reattore e sui neutroni ritardati",
      "M. Wang et al., The AME 2020 atomic mass evaluation (II), Chinese Physics C 45 (2021) 030003"
    ],
    collegamenti: ['snucleare', 'sfispart', 'sastrostelle', 'sschrod']
  };

  /* ── 🧱 Elasticità e materiali ───────────────────────────────────────── */
  T['sfismateriali'] = {
    titolo: "Elasticità e resistenza dei materiali: trazione, travi, instabilità, onde elastiche",
    sintesi: "Un solido sotto carico si deforma prima elasticamente, con sforzo proporzionale alla deformazione (legge di Hooke), poi plasticamente fino alla rottura. Dalla prova di trazione si ricavano modulo di Young, snervamento e carico di rottura. La teoria di Eulero-Bernoulli descrive la flessione delle travi, la teoria di Eulero il carico critico delle colonne snelle; le costanti elastiche fissano infine la velocità con cui le onde longitudinali e trasversali attraversano il materiale.",
    paragrafi: [
      { titolo: "Sforzo, deformazione e costanti elastiche", testo: "In una barra tirata da una forza F lo sforzo nominale è σ = F/A₀ e la deformazione ε = ΔL/L₀. Nel tratto elastico vale la legge di Hooke σ = Eε, con E modulo di Young: circa 200 GPa per l'acciaio, 69 GPa per l'alluminio, 117 GPa per il rame. Allungandosi la barra si assottiglia, e il rapporto fra contrazione laterale e allungamento è il coefficiente di Poisson ν, fra 0,25 e 0,35 per i metalli e prossimo a 0,5 per i materiali incomprimibili come la gomma. Per un materiale isotropo due costanti bastano: il modulo di taglio è G = E/[2(1 + ν)] e quello di compressione K = E/[3(1 − 2ν)]." },
      { titolo: "La prova di trazione", testo: "Oltre il limite elastico i metalli si deformano plasticamente per scorrimento delle dislocazioni. L'acciaio dolce mostra un pianerottolo di snervamento, dovuto agli atomi di carbonio che bloccano le dislocazioni finché non si liberano a bande (bande di Lüders); alluminio e rame passano gradualmente al regime plastico, e per loro si usa lo snervamento convenzionale allo 0,2 %. Segue l'incrudimento: lo sforzo nominale cresce fino al carico di rottura, oltre il quale la sezione si localizza in una strizione e la curva nominale scende fino alla frattura. Lo sforzo vero σ_v = σ(1 + ε) e la deformazione vera ε_v = ln(1 + ε), validi a volume costante prima della strizione, mostrano invece che il materiale continua a rinforzarsi. L'area sotto la curva è l'energia assorbita per unità di volume, la tenacità." },
      { titolo: "L'elasticità della gomma", testo: "La gomma è un reticolo di lunghe catene polimeriche: stirarla non allunga i legami ma raddrizza le catene, riducendo il numero di conformazioni possibili. La forza di richiamo è quindi entropica, e per questo una gomma tesa si accorcia se la si scalda, al contrario di un metallo. Il modello neo-hookeano, ricavato dalla statistica delle catene gaussiane, dà per una trazione semplice lo sforzo nominale σ = μ(λ − λ⁻²), con λ = 1 + ε rapporto di allungamento e μ = nk_BT modulo di taglio, proporzionale alla densità n di catene del reticolo. Per piccole deformazioni si ritrova la legge di Hooke con E = 3μ. Le deformazioni elastiche raggiungono il 500 %, impossibile per un metallo." },
      { titolo: "La flessione delle travi", testo: "In una trave inflessa le fibre da un lato si allungano e dall'altro si accorciano; nell'ipotesi di Eulero-Bernoulli le sezioni restano piane e perpendicolari all'asse, e lo sforzo varia linearmente con la distanza y dall'asse neutro: σ = My/I, con M momento flettente e I momento d'inerzia della sezione. La forma della trave segue da EI y″ = M(x), integrata due volte con le condizioni ai vincoli; il momento e il taglio si ottengono dall'equilibrio, con dM/dx = V e dV/dx = −q. Per una mensola con carico in punta la freccia vale PL³/(3EI), per una trave appoggiata con carico distribuito 5qL⁴/(384EI). Poiché per un rettangolo I = bh³/12, raddoppiare l'altezza rende la trave otto volte più rigida: da qui i profili a I, che mettono il materiale lontano dall'asse neutro." },
      { titolo: "L'instabilità di Eulero", testo: "Una colonna snella caricata di punta resta dritta finché il carico non raggiunge il valore critico P_cr = π²EI/(KL)², oltre il quale la configurazione rettilinea diventa instabile e la colonna si inflette lateralmente. Il fattore di lunghezza efficace K dipende dai vincoli: 2 per incastro e estremo libero, 1 per due cerniere, 0,699 per incastro e cerniera, 0,5 per due incastri; i carichi critici stanno quindi come 0,25 : 1 : 2,046 : 4. La sezione ritrova questi K cercando gli zeri del determinante delle condizioni al contorno. La formula vale solo finché lo sforzo critico P_cr/A resta sotto lo snervamento, cioè per colonne snelle; per colonne tozze prevale lo schiacciamento plastico, e nelle strutture reali le imperfezioni iniziali abbassano il carico sopportabile." },
      { titolo: "Il suono nei solidi", testo: "In un mezzo elastico esteso si propagano due tipi di onde. Le onde longitudinali, o di compressione, viaggiano con c_L = √[E(1 − ν)/(ρ(1 + ν)(1 − 2ν))], quelle trasversali, o di taglio, con c_T = √(G/ρ), sempre più lente. Per l'acciaio si hanno circa 5900 e 3200 m/s, mentre in una barra sottile, libera di contrarsi lateralmente, l'onda longitudinale va a √(E/ρ) ≈ 5100 m/s. In sismologia sono le onde P e S: le S non attraversano i liquidi, perché un fluido non resiste al taglio, ed è proprio la loro ombra che ha rivelato il nucleo esterno liquido della Terra. Le stesse formule sono alla base dei controlli non distruttivi a ultrasuoni." }
    ],
    formule: [
      ["σ = Eε,  G = E/[2(1 + ν)]", "legge di Hooke; σ sforzo (Pa), ε deformazione, E modulo di Young, G modulo di taglio, ν coefficiente di Poisson"],
      ["σ_v = σ(1 + ε),  ε_v = ln(1 + ε)", "sforzo e deformazione veri, a volume costante e prima della strizione"],
      ["σ = μ(λ − λ⁻²)", "gomma neo-hookeana in trazione semplice; λ rapporto di allungamento, μ modulo di taglio"],
      ["EI y″ = M(x),  σ = My/I,  I = bh³/12", "trave di Eulero-Bernoulli; I momento d'inerzia della sezione (m⁴), y distanza dall'asse neutro"],
      ["δ = PL³/(3EI)  (mensola);  δ = 5qL⁴/(384EI)  (appoggiata, carico q)", "frecce massime per i casi classici; P forza (N), q carico per unità di lunghezza (N/m)"],
      ["P_cr = π²EI/(KL)²", "carico critico di Eulero; K fattore di lunghezza efficace dei vincoli"],
      ["c_L = √[E(1−ν)/(ρ(1+ν)(1−2ν))],  c_T = √(G/ρ)", "velocità delle onde longitudinali e trasversali in un solido isotropo esteso; ρ densità"]
    ],
    ipotesi: [
      "Materiale omogeneo e isotropo, piccole deformazioni nel campo elastico (le curve di trazione oltre lo snervamento sono modelli tarati su valori tipici, non dati di una colata specifica).",
      "Travi snelle di Eulero-Bernoulli: si trascura la deformazione da taglio, importante per travi tozze (teoria di Timoshenko).",
      "Il carico di Eulero presuppone una colonna perfettamente diritta, carico centrato e comportamento elastico fino all'instabilità."
    ],
    errori: [
      "Confondere rigidezza e resistenza: il modulo di Young misura quanto un materiale si deforma, lo snervamento quando smette di tornare indietro; l'alluminio 6061-T6 è meno rigido dell'acciaio dolce ma ha uno snervamento più alto.",
      "Leggere il massimo della curva nominale come il momento in cui il materiale si indebolisce: è la sezione che si riduce, lo sforzo vero continua a crescere.",
      "Applicare la formula di Eulero a colonne tozze, ottenendo carichi critici superiori a quello che produce lo snervamento."
    ],
    esempio: {
      testo: "Una colonna d'acciaio (E = 207 GPa, σ_y = 250 MPa) a sezione quadrata piena di 40 mm di lato, lunga 2 m e incernierata alle estremità (K = 1). Il momento d'inerzia è I = b⁴/12 = (0,04 m)⁴/12 = 2,133·10⁻⁷ m⁴. Il carico critico è P_cr = π² · 207·10⁹ · 2,133·10⁻⁷ / (2 m)² = 1,090·10⁵ N. Lo sforzo corrispondente è P_cr/A = 108 960 N / 1,6·10⁻³ m² = 68 MPa, ben sotto lo snervamento; la snellezza L/r, con r = b/√12 = 11,5 mm, vale 173, per cui la formula di Eulero è applicabile.",
      risultato: "P_cr ≈ 109 kN, σ_cr ≈ 68 MPa < σ_y: la colonna si instabilizza prima di snervarsi"
    },
    fonti: [
      "J. M. Gere, B. J. Goodno, Mechanics of Materials, Cengage Learning, 8ª ed., 2013, capitoli su trazione, flessione delle travi, linea elastica e colonne",
      "W. D. Callister, D. G. Rethwisch, Materials Science and Engineering: An Introduction, Wiley, 10ª ed., 2018, cap. 6 (proprietà meccaniche dei metalli)",
      "S. P. Timoshenko, J. M. Gere, Theory of Elastic Stability, McGraw-Hill, 2ª ed., 1961, cap. 2 (instabilità delle colonne)",
      "L. R. G. Treloar, The Physics of Rubber Elasticity, Oxford University Press, 3ª ed., 1975, capitoli sulla teoria statistica delle reti",
      "L. D. Landau, E. M. Lifshitz, Theory of Elasticity (Corso di fisica teorica, vol. 7), Pergamon, 3ª ed., 1986, capitoli sulle onde elastiche e sulla flessione"
    ],
    collegamenti: ['sfissuono', 'sfisonde', 'scristalli', 'smatode', 'sfismecc']
  };

  /* ── 🔌 Elettronica ──────────────────────────────────────────────────── */
  T['sfiselettronica'] = {
    titolo: "Elettronica dei componenti non lineari e attivi: diodi, transistor, operazionali, conversione",
    sintesi: "I circuiti elettronici reali sono non lineari: il diodo conduce in un solo verso secondo l'esponenziale di Shockley, il transistor bipolare amplifica perché la corrente di collettore dipende esponenzialmente dalla tensione di base. Da qui raddrizzatori, stabilizzatori e amplificatori, analizzati con il punto di lavoro e il modello per piccoli segnali. L'amplificatore operazionale con retroazione realizza funzioni precise; i convertitori analogico-digitale e digitale-analogico collegano il mondo continuo a quello dei bit.",
    paragrafi: [
      { titolo: "Il diodo e il punto di lavoro", testo: "Una giunzione p-n polarizzata direttamente lascia passare una corrente I = I_S(e^(V/nV_T) − 1), dove I_S è la corrente di saturazione inversa, n un fattore di idealità fra 1 e 2 e V_T = kT/q la tensione termica, 25,85 mV a 300 K. Poiché la corrente cresce di un fattore 10 ogni 60 mV circa (con n = 1), un diodo al silicio in conduzione ha ai capi quasi sempre 0,6–0,7 V. In un circuito con generatore e resistenza il punto di lavoro è l'intersezione fra la caratteristica del diodo e la retta di carico I = (V_in − V)/R; la sezione la risolve con il metodo di Newton e la confronta con la forma chiusa tramite la funzione W di Lambert. Il diodo Zener sfrutta invece la rottura inversa: oltre la tensione di Zener la tensione resta quasi costante al variare della corrente, e lo si usa come riferimento e stabilizzatore." },
      { titolo: "Raddrizzatori e livellamento", testo: "Un raddrizzatore a una semionda lascia passare solo le semionde positive; il ponte di Graetz, con quattro diodi, le raddrizza entrambe al prezzo di due cadute di diodo in serie. Un condensatore in parallelo al carico si carica al picco e si scarica lentamente fra un picco e l'altro: l'ondulazione residua vale circa ΔV ≈ I/(fC) per la semionda e I/(2fC) per l'onda intera, con I corrente di carico e f frequenza di rete. Il prezzo del livellamento è che i diodi conducono solo per una piccola frazione del periodo, vicino al picco, con impulsi di corrente brevi e molto più intensi della corrente media: la simulazione nel tempo lo mostra chiaramente, ed è il motivo per cui gli alimentatori a condensatore distorcono la corrente assorbita dalla rete." },
      { titolo: "Il transistor bipolare a emettitore comune", testo: "In un transistor npn in zona attiva la corrente di collettore è I_C = I_S e^(V_BE/V_T) e la corrente di base I_B = I_C/β, con β tipicamente fra 100 e 300. La polarizzazione con partitore di base e resistenza di emettitore fissa il punto di riposo Q in modo poco sensibile a β e alla temperatura, grazie alla retroazione negativa introdotta da R_E. Per piccoli segnali il transistor si linearizza: la transconduttanza è g_m = I_C/V_T, la resistenza d'ingresso di base r_π = β/g_m, e con l'emettitore a massa per il segnale il guadagno di tensione vale A_v ≈ −g_m R_C. Il segno meno indica l'inversione di fase. Con segnali grandi l'esponenziale distorce, e il punto di lavoro raggiunge la saturazione (V_CE ≈ 0,2 V) o l'interdizione (I_C ≈ 0): la superficie 3D I_C(V_CE, I_B) con la retta di carico mostra dove." },
      { titolo: "L'amplificatore operazionale", testo: "Un operazionale è un amplificatore differenziale con guadagno ad anello aperto altissimo, nella sezione A₀ = 10⁵, con un polo dominante e un prodotto guadagno-banda di 1 MHz. Con la retroazione negativa la tensione fra i due ingressi diventa praticamente nulla (cortocircuito virtuale) e il guadagno è fissato dai resistori: −R₂/R₁ per la configurazione invertente, 1 + R₂/R₁ per la non invertente; con un condensatore in retroazione si ottiene un integratore. Il prezzo è la banda: in prima approssimazione la banda a anello chiuso è il prodotto guadagno-banda diviso per il guadagno di retroazione. Con la retroazione positiva, invece, si ottiene il trigger di Schmitt, che commuta fra ±V_sat con soglie ±V_sat R₁/(R₁ + R₂): l'isteresi rende la commutazione immune al rumore." },
      { titolo: "Dal mondo analogico ai bit", testo: "Un convertitore ad approssimazioni successive confronta l'ingresso con la tensione prodotta da un DAC interno e decide un bit alla volta, dal più significativo, come una ricerca binaria: in N passi ottiene N bit, con una risoluzione di V_ref/2^N. Il DAC a scala R-2R usa solo due valori di resistenza: ogni nodo della scala vede verso valle una resistenza equivalente R, per cui ogni bit contribuisce con un peso esattamente dimezzato rispetto al precedente e l'uscita vale V_ref · D/2^N. Nei contatori asincroni ogni flip-flop è comandato dal precedente: i ritardi si sommano e durante le transizioni compaiono per pochi nanosecondi stati spuri, che un circuito a valle potrebbe leggere. I contatori sincroni, con un unico clock, eliminano il problema." }
    ],
    formule: [
      ["I = I_S (e^(V/nV_T) − 1),  V_T = kT/q", "equazione di Shockley del diodo; I_S corrente di saturazione, n fattore di idealità, V_T ≈ 25,85 mV a 300 K"],
      ["ΔV ≈ I/(fC)  (semionda);  ΔV ≈ I/(2fC)  (onda intera)", "ondulazione con condensatore di livellamento; I corrente di carico (A), f frequenza di rete (Hz), C capacità (F)"],
      ["g_m = I_C/V_T,  r_π = β/g_m,  A_v ≈ −g_m R_C", "parametri per piccoli segnali del transistor bipolare e guadagno a emettitore comune con emettitore a massa"],
      ["A_inv = −R₂/R₁,  A_non inv = 1 + R₂/R₁", "guadagni ideali dell'operazionale con retroazione negativa"],
      ["V_soglia = ±V_sat R₁/(R₁ + R₂)", "soglie del trigger di Schmitt invertente; V_sat tensione di saturazione dell'uscita"],
      ["V_out = V_ref · D/2^N", "uscita di un DAC a N bit con codice D (intero fra 0 e 2^N − 1)"]
    ],
    ipotesi: [
      "Modelli semplificati: il transistor senza effetto Early né capacità interne, il diodo raddrizzatore come caduta fissa più una resistenza serie.",
      "Il modello per piccoli segnali vale solo se l'ampiezza del segnale in base è molto minore di V_T (pochi millivolt).",
      "L'operazionale ha un solo polo, nessun limite di slew rate e ingressi ideali; gli operazionali reali hanno offset, correnti di polarizzazione e velocità di variazione finite."
    ],
    errori: [
      "Dimenticare le due cadute di diodo del ponte di Graetz, cioè circa 1,4 V in meno sul picco raddrizzato.",
      "Pensare che il guadagno di un emettitore comune dipenda da β: con l'emettitore a massa per il segnale dipende da g_m R_C, cioè dalla corrente di riposo; con R_E non bypassata vale circa −R_C/R_E.",
      "Applicare il cortocircuito virtuale a un operazionale senza retroazione negativa, come in un comparatore o in un trigger di Schmitt, dove l'uscita è in saturazione e gli ingressi non sono allo stesso potenziale."
    ],
    esempio: {
      testo: "Un transistor npn è polarizzato con I_C = 1,0 mA, β = 100, R_C = 4,7 kΩ, emettitore a massa per il segnale tramite un condensatore di bypass, T = 300 K. La transconduttanza è g_m = I_C/V_T = 1,0·10⁻³ A / 0,025852 V = 38,7 mS. La resistenza d'ingresso di base è r_π = β/g_m = 100/0,0387 S = 2,59 kΩ. Il guadagno di tensione è A_v = −g_m R_C = −0,0387 S · 4700 Ω. Per restare lineari il segnale in base deve essere di pochi millivolt.",
      risultato: "g_m ≈ 38,7 mS, r_π ≈ 2,6 kΩ, A_v ≈ −182"
    },
    fonti: [
      "A. S. Sedra, K. C. Smith, Microelectronic Circuits, Oxford University Press, 7ª ed., 2015, capitoli sui diodi, sui transistor bipolari, sugli amplificatori operazionali e sui convertitori",
      "P. Horowitz, W. Hill, The Art of Electronics, Cambridge University Press, 3ª ed., 2015, capitoli 1 (raddrizzatori), 2 (transistor bipolari), 4 (operazionali) e 13 (conversione analogico-digitale)",
      "W. Shockley, The theory of p-n junctions in semiconductors and p-n junction transistors, Bell System Technical Journal 28 (1949) 435"
    ],
    collegamenti: ['sfiscirc', 'sfissolido', 'sfisem']
  };

  /* ── 🔭 Astrofisica ──────────────────────────────────────────────────── */
  T['sfisastro'] = {
    titolo: "Astrofisica di base: stelle e corpo nero, leggi di Keplero, esopianeti, espansione cosmica",
    sintesi: "Quasi tutto ciò che sappiamo delle stelle viene dalla loro luce. La legge di Planck lega colore e temperatura, la legge di Stefan-Boltzmann lega luminosità, raggio e temperatura, e il diagramma H-R ordina le stelle secondo queste grandezze. Le leggi di Keplero, conseguenza della gravità di Newton, governano i pianeti del Sole e quelli di altre stelle; l'equazione di Friedmann descrive l'espansione dell'universo e ne fissa l'età.",
    paragrafi: [
      { titolo: "Il corpo nero e il colore delle stelle", testo: "Una stella emette, in prima approssimazione, come un corpo nero: la radianza spettrale è data dalla legge di Planck B_λ(T) = (2hc²/λ⁵)/(e^(hc/λkT) − 1). Il massimo cade a λ_max = b/T con b = 2,898·10⁻³ m·K (legge di Wien), e il flusso totale emesso per unità di superficie è σT⁴ (legge di Stefan-Boltzmann). Il Sole, con 5772 K, ha il picco a circa 500 nm, nel verde, eppure appare bianco: l'occhio integra tutto lo spettro visibile, che il Sole copre in modo quasi uniforme. Le stelle fredde appaiono arancioni o rosse, quelle calde azzurre. Gli astronomi misurano il colore con l'indice B − V, la differenza fra le magnitudini in due filtri, che la formula di Ballesteros collega direttamente alla temperatura." },
      { titolo: "Il diagramma di Hertzsprung-Russell", testo: "Riportando la luminosità contro la temperatura efficace (che per tradizione cresce verso sinistra) le stelle non si distribuiscono a caso. La maggior parte sta sulla sequenza principale, dove brucia idrogeno nel nucleo; in alto a destra stanno le giganti e supergiganti rosse come Betelgeuse, fredde ma enormi; in basso a sinistra le nane bianche come Sirio B, calde ma piccole. Poiché L = 4πR²σT⁴, nel piano log L – log T le stelle di raggio uguale stanno su rette di pendenza 4, che la sezione traccia. Le classi spettrali O, B, A, F, G, K, M corrispondono a temperature decrescenti, da oltre 30 000 K a meno di 3700 K, e sono definite dalle righe di assorbimento, la cui intensità dipende dalla temperatura attraverso le equazioni di Boltzmann e di Saha." },
      { titolo: "Le stelle di sequenza principale", testo: "Lungo la sequenza principale la massa decide tutto. La relazione empirica massa-luminosità, usata nella sezione a tratti, è circa L ∝ M⁴ per stelle simili al Sole e più ripida o più piatta agli estremi; anche il raggio cresce con la massa, all'incirca come M^0,8 sotto una massa solare e M^0,57 sopra. Poiché il combustibile disponibile è proporzionale a M e lo si consuma al ritmo L, la durata della fase di sequenza principale scala come t ≈ 10¹⁰ anni · (M/M☉)/(L/L☉): le stelle massicce, pur avendo più idrogeno, lo bruciano molto più in fretta e vivono pochi milioni di anni, mentre le nane rosse dureranno più dell'età attuale dell'universo. Queste relazioni sono approssimazioni utili, non leggi esatte: la composizione chimica e la rotazione introducono una dispersione reale." },
      { titolo: "Le leggi di Keplero e il volo interplanetario", testo: "I pianeti percorrono ellissi con il Sole in un fuoco, spazzano aree uguali in tempi uguali, e il quadrato del periodo è proporzionale al cubo del semiasse maggiore: in anni e unità astronomiche, P² = a³ quando la massa del pianeta è trascurabile rispetto a quella del Sole. Su un grafico log-log i pianeti stanno quindi su una retta di pendenza 3/2. La posizione lungo l'orbita si ottiene risolvendo l'equazione di Keplero M = E − e sin E. Il modo più economico per andare dalla Terra a Marte è il trasferimento di Hohmann, un'ellisse tangente alle due orbite: dura circa 259 giorni, richiede circa 2,9 km/s rispetto all'orbita terrestre alla partenza e 2,6 km/s all'arrivo, e si può iniziare solo quando i pianeti hanno la configurazione giusta, una volta ogni periodo sinodico di circa 26 mesi." },
      { titolo: "Esopianeti in transito", testo: "Quando un pianeta passa davanti alla sua stella ne copre una frazione di disco e la luce cala di circa (R_p/R★)²: l'1 % per un pianeta come Giove davanti al Sole, 84 parti per milione per la Terra. La curva di luce non è un rettangolo, perché il bordo della stella è più scuro del centro (oscuramento al bordo), e la sua durata dipende dal raggio della stella, dal periodo e dal parametro d'impatto. Il pianeta fa anche oscillare la stella attorno al baricentro, e lo spostamento Doppler delle righe misura la velocità radiale. La temperatura di equilibrio, ottenuta bilanciando l'energia assorbita con quella irraggiata, e la zona abitabile, dove l'acqua liquida è possibile in superficie, sono approfondite nella sezione dedicata agli esopianeti." },
      { titolo: "L'espansione dell'universo", testo: "Le galassie lontane si allontanano con una velocità proporzionale alla distanza, v = H₀d. Non c'è un centro: in un universo che si espande uniformemente ogni osservatore vede tutte le altre galassie allontanarsi da sé, come mostra l'animazione. L'equazione di Friedmann, H² = H₀²[Ω_r a⁻⁴ + Ω_m a⁻³ + Ω_k a⁻² + Ω_Λ], lega il tasso di espansione al contenuto di radiazione, materia, curvatura e costante cosmologica; integrandola si ottengono il fattore di scala a(t) e l'età dell'universo, circa 13,8 miliardi di anni per i parametri misurati dal satellite Planck. Il tempo di ritorno della luce e le diverse distanze cosmologiche sono trattati nella sezione di cosmologia 3D." }
    ],
    formule: [
      ["B_λ(T) = (2hc²/λ⁵) / (e^(hc/λkT) − 1)", "legge di Planck; radianza spettrale in W·m⁻²·sr⁻¹·m⁻¹, h costante di Planck, k di Boltzmann"],
      ["λ_max = b/T,  b = 2,897771955·10⁻³ m·K", "legge di spostamento di Wien"],
      ["L = 4πR²σT⁴,  σ = 5,670374419·10⁻⁸ W·m⁻²·K⁻⁴", "luminosità di una stella di raggio R e temperatura efficace T"],
      ["t_SP ≈ 10¹⁰ anni · (M/M☉)/(L/L☉)", "durata stimata della sequenza principale, scalata sul Sole"],
      ["P² = a³  (anni, UA)", "terza legge di Keplero per corpi in orbita attorno al Sole, massa del pianeta trascurabile"],
      ["ΔF/F ≈ (R_p/R★)²", "profondità di un transito, trascurando l'oscuramento al bordo"],
      ["H² = H₀² [Ω_r a⁻⁴ + Ω_m a⁻³ + Ω_k a⁻² + Ω_Λ]", "equazione di Friedmann; a fattore di scala (1 oggi), Ω parametri di densità attuali"]
    ],
    ipotesi: [
      "Le stelle sono trattate come corpi neri sferici; gli spettri veri hanno righe di assorbimento e deviazioni dal corpo nero, specie nell'ultravioletto.",
      "Le relazioni massa-luminosità-raggio sono fit empirici per stelle di composizione solare in sequenza principale; non valgono per giganti e nane bianche.",
      "Le orbite planetarie sono kepleriane, senza perturbazioni reciproche; la cosmologia assume un universo omogeneo e isotropo."
    ],
    errori: [
      "Concludere che il Sole è verde perché il picco di Planck cade nel verde: il colore percepito dipende da tutto lo spettro, e per una stella a 5800 K è bianco.",
      "Pensare che le stelle più massicce vivano più a lungo perché hanno più combustibile: la luminosità cresce molto più in fretta della massa.",
      "Immaginare il Big Bang come un'esplosione da un punto al centro dello spazio: è l'espansione dello spazio stesso, che avviene ovunque."
    ],
    esempio: {
      testo: "Si verifichi la luminosità del Sole da R☉ = 6,957·10⁸ m e T = 5772 K. La superficie è 4πR² = 6,082·10¹⁸ m²; T⁴ = 1,1100·10¹⁵ K⁴; σT⁴ = 6,294·10⁷ W/m². Il prodotto dà L. Il picco di Wien è λ_max = 2,8978·10⁻³/5772 m = 502 nm. Per una stella di 2 M☉ la sezione usa L = M⁴ = 16 L☉, da cui t_SP ≈ 10¹⁰ · 2/16 anni.",
      risultato: "L ≈ 3,83·10²⁶ W (valore nominale IAU 3,828·10²⁶ W); λ_max ≈ 502 nm; vita di una stella di 2 M☉ ≈ 1,25·10⁹ anni"
    },
    fonti: [
      "B. W. Carroll, D. A. Ostlie, An Introduction to Modern Astrophysics, Cambridge University Press, 2ª ed., 2017, cap. 2 (Keplero), cap. 3 (corpo nero, magnitudini), cap. 8 (classi spettrali e diagramma H-R), cap. 29 (cosmologia)",
      "D. Maoz, Astrophysics in a Nutshell, Princeton University Press, 2ª ed., 2016, capitoli sulle proprietà delle stelle, sugli esopianeti e sulla cosmologia",
      "IAU 2015 Resolution B3 sulle costanti nominali solari e planetarie (L☉ = 3,828·10²⁶ W, R☉ = 6,957·10⁸ m, T☉ = 5772 K)",
      "F. J. Ballesteros, New insights into black bodies, Europhysics Letters 97 (2012) 34008"
    ],
    collegamenti: ['sastrostelle', 'sastrosole', 'sastroeso', 'sastrocosmo', 'ssaha']
  };

  /* ── 🪐 Gravitazione ─────────────────────────────────────────────────── */
  T['sfisgrav'] = {
    titolo: "Gravitazione newtoniana: problema degli N corpi, punti di Lagrange, fionda gravitazionale",
    sintesi: "La legge di gravitazione universale di Newton spiega le orbite dei pianeti, ma già con tre corpi il moto in generale non ha soluzione in forma chiusa e può essere caotico. Si studia allora con integratori numerici che rispettano le leggi di conservazione, con soluzioni speciali come la figura a otto, con il problema ristretto e i suoi cinque punti di Lagrange. La fionda gravitazionale mostra come una sonda guadagni energia sfruttando il moto di un pianeta.",
    paragrafi: [
      { titolo: "La legge di Newton e le leggi di conservazione", testo: "Due masse si attraggono con una forza F = Gm₁m₂/r², diretta lungo la congiungente; G = 6,67430·10⁻¹¹ m³·kg⁻¹·s⁻² (CODATA 2018) è la costante fondamentale misurata con minore precisione relativa, circa 2·10⁻⁵. La forza deriva dal potenziale −GM/r, e in un sistema isolato di N corpi si conservano l'energia totale, la quantità di moto e il momento angolare. Per due corpi il problema si riduce a un corpo di massa ridotta in un campo centrale, e le traiettorie sono coniche: ellissi se l'energia è negativa, parabole se nulla, iperboli se positiva. Dalle stesse equazioni discendono le tre leggi di Keplero, con la terza nella forma esatta P² = 4π²a³/[G(m₁ + m₂)]." },
      { titolo: "Il problema degli N corpi e il caos", testo: "Con tre o più corpi le dieci quantità conservate non bastano a ridurre il problema a quadrature; Poincaré mostrò alla fine dell'Ottocento che il moto può dipendere in modo estremamente sensibile dalle condizioni iniziali, la prima scoperta del caos deterministico. Il problema pitagorico, tre masse 3, 4 e 5 ferme ai vertici di un triangolo rettangolo con lati 3, 4 e 5, studiato da Burrau nel 1913 e risolto numericamente da Szebehely e Peters nel 1967, ne è un esempio: dopo una lunga serie di incontri ravvicinati due corpi formano una binaria e il terzo viene espulso. Esistono però soluzioni periodiche notevoli, come la figura a otto trovata da Moore nel 1993 e dimostrata da Chenciner e Montgomery nel 2000, in cui tre masse uguali si inseguono sulla stessa curva con periodo 6,3259 nelle unità della sezione." },
      { titolo: "Integrare senza perdere energia", testo: "Poiché le soluzioni non si scrivono in forma chiusa, si integrano numericamente. Il metodo di Eulero accumula un errore sistematico sull'energia e fa spiraleggiare i pianeti verso l'esterno; i metodi di Runge-Kutta sono più accurati a breve termine ma anch'essi derivano. La sezione usa il Verlet a velocità, un integratore simplettico del secondo ordine: conserva esattamente il volume nello spazio delle fasi e un'energia «ombra» molto vicina a quella vera, per cui l'errore sull'energia oscilla senza crescere anche su milioni di passi. È lo stesso principio su cui si basano le integrazioni a lungo termine del sistema solare e le simulazioni di dinamica molecolare. Negli incontri ravvicinati si introduce spesso un piccolo ammorbidimento ε del potenziale per evitare la divergenza." },
      { titolo: "Il problema ristretto e i punti di Lagrange", testo: "Se un corpo di massa trascurabile si muove nel campo di due masse in orbita circolare, conviene passare al sistema che ruota con esse. Lì compare il potenziale efficace Φ = −GM₁/r₁ − GM₂/r₂ − ½ω²r², che somma gravità e forza centrifuga, e l'energia nel sistema rotante si conserva come costante di Jacobi. I punti di Lagrange sono i cinque punti di equilibrio: L1, L2 e L3 sulla congiungente, sempre instabili (sono punti di sella), e L4 e L5 ai vertici dei due triangoli equilateri, che grazie alla forza di Coriolis sono stabili se il rapporto delle masse μ = M₂/(M₁ + M₂) è minore di 0,0385 (criterio di Routh). Lo sono per Sole e Giove, ed è lì che si raccolgono gli asteroidi troiani; il telescopio James Webb opera attorno al punto L2 del sistema Sole-Terra, a circa 1,5 milioni di chilometri dalla Terra." },
      { titolo: "La fionda gravitazionale", testo: "Una sonda che passa vicino a un pianeta descrive, nel sistema di riferimento del pianeta, un'iperbole: entra ed esce con la stessa velocità relativa v∞, solo ruotata di un angolo δ, dato da sin(δ/2) = 1/(1 + r_p v∞²/GM) con r_p distanza minima. Nel sistema del Sole, però, alla velocità relativa si somma quella del pianeta, e la rotazione del vettore relativo cambia il modulo della velocità eliocentrica fino a un massimo di 2v∞ quando la deviazione è di 180°. La sonda guadagna o perde energia a seconda che passi dietro o davanti al pianeta, e il pianeta varia la propria energia della quantità opposta, del tutto trascurabile per la sua massa. Mariner 10, le due Voyager, Galileo e Cassini hanno usato questa tecnica per raggiungere mete altrimenti fuori portata." },
      { titolo: "Il pozzo di potenziale e i limiti di Newton", testo: "La superficie a imbuto della quarta scheda rappresenta il potenziale −GM/r: una pallina che vi rotola descrive approssimativamente un'orbita kepleriana, ed è utile per capire i tipi di orbita. Combinando il potenziale con la barriera centrifuga si ottiene il potenziale efficace V_eff = −GM/r + L²/(2r²), il cui minimo corrisponde all'orbita circolare. Questo imbuto non è la curvatura dello spaziotempo della relatività generale, anche se la si rappresenta spesso in modo simile: nella teoria di Einstein è curvo lo spaziotempo nel suo insieme, e la parte che conta di più per i moti lenti è la curvatura del tempo. La gravità di Newton è il limite di campo debole e basse velocità della relatività generale; si vede la differenza, per esempio, nei 43″ al secolo di precessione del perielio di Mercurio che Newton non spiega." }
    ],
    formule: [
      ["F = G m₁m₂/r²,  U = −G m₁m₂/r", "forza e energia potenziale gravitazionale; G = 6,67430·10⁻¹¹ m³·kg⁻¹·s⁻²"],
      ["P² = 4π² a³ / [G(m₁ + m₂)]", "terza legge di Keplero esatta per due corpi; a semiasse maggiore dell'orbita relativa"],
      ["Φ = −GM₁/r₁ − GM₂/r₂ − ½ω²(x² + y²)", "potenziale efficace nel sistema rotante del problema ristretto dei tre corpi"],
      ["r_L1 ≈ r_L2 ≈ a (μ/3)^(1/3)", "distanza approssimata di L1 e L2 dalla massa minore, per μ ≪ 1 (raggio di Hill)"],
      ["μ < (1 − √(23/27))/2 ≈ 0,0385", "condizione di Routh per la stabilità di L4 e L5"],
      ["sin(δ/2) = 1/(1 + r_p v∞²/GM)", "angolo di deviazione di un passaggio iperbolico; r_p distanza di massimo avvicinamento"],
      ["V_eff = −GM/r + L²/(2r²)", "potenziale efficace radiale per unità di massa; L momento angolare specifico"]
    ],
    ipotesi: [
      "Masse puntiformi o a simmetria sferica, gravità newtoniana istantanea; le simulazioni sono nel piano e in unità con G = 1.",
      "I punti di Lagrange presuppongono orbita circolare dei due primari e terzo corpo di massa trascurabile.",
      "La fionda è calcolata con il solo campo del pianeta, che si muove in linea retta durante il breve incontro."
    ],
    errori: [
      "Pensare che nei punti di Lagrange la gravità si annulli: si annulla la somma di gravità e forza centrifuga nel sistema rotante, non la gravità.",
      "Credere che L4 e L5 siano stabili perché sono minimi del potenziale efficace: sono massimi, e la stabilità viene dalla forza di Coriolis.",
      "Prendere l'imbuto del potenziale come immagine fedele dello spaziotempo curvo: le palline vi cadono per la gravità terrestre, che è proprio ciò che si vorrebbe spiegare."
    ],
    esempio: {
      testo: "A che distanza dalla Terra si trova il punto L1 del sistema Sole-Terra? Con M_Terra/M_Sole = 3,003·10⁻⁶, μ/3 = 1,001·10⁻⁶ e la sua radice cubica vale 0,01000. Moltiplicando per a = 1,496·10⁸ km si ottiene la stima di Hill r ≈ 1,496·10⁶ km. Risolvendo numericamente l'equilibrio sulla congiungente, come fa la sezione, si trova 1,491·10⁶ km, appena lo 0,3 % in meno.",
      risultato: "L1 a circa 1,49 milioni di km dalla Terra verso il Sole (dove opera il satellite SOHO)"
    },
    fonti: [
      "C. D. Murray, S. F. Dermott, Solar System Dynamics, Cambridge University Press, 1999, cap. 2 (problema dei due corpi) e cap. 3 (problema ristretto dei tre corpi, punti di Lagrange)",
      "H. Goldstein, C. Poole, J. Safko, Classical Mechanics, Addison-Wesley, 3ª ed., 2002, cap. 3 (forze centrali e problema di Keplero)",
      "A. Chenciner, R. Montgomery, A remarkable periodic solution of the three-body problem in the case of equal masses, Annals of Mathematics 152 (2000) 881",
      "V. Szebehely, C. F. Peters, Complete solution of a general problem of three bodies, Astronomical Journal 72 (1967) 876",
      "E. Hairer, C. Lubich, G. Wanner, Geometric Numerical Integration, Springer, 2ª ed., 2006, capitoli sugli integratori simplettici e sul metodo di Störmer-Verlet"
    ],
    collegamenti: ['sastroorbite', 'sastromat', 'sastrobh', 'sfismecc', 'sfisanalitica']
  };

  /* ── 🪐 Sistema solare 3D ────────────────────────────────────────────── */
  T['sastrosole'] = {
    titolo: "Il sistema solare: elementi orbitali, effemeridi, la Luna, le eclissi e le risonanze",
    sintesi: "La posizione di un pianeta a una data qualsiasi si calcola da sei elementi kepleriani, che variano lentamente nel tempo per le perturbazioni reciproche, risolvendo l'equazione di Keplero e ruotando l'orbita nella sua inclinazione vera. Lo stesso schema, con molte più correzioni, descrive la Luna; dalla geometria dei nodi lunari discende la rarità delle eclissi. Le risonanze fra periodi orbitali spiegano strutture come le lacune della fascia degli asteroidi, la catena di Laplace dei satelliti di Giove e la divisione di Cassini negli anelli di Saturno.",
    paragrafi: [
      { titolo: "Dagli elementi orbitali alla posizione", testo: "Un'orbita kepleriana nello spazio è fissata da sei numeri: semiasse maggiore a ed eccentricità e (forma e dimensione), inclinazione i e longitudine del nodo ascendente Ω (orientazione del piano rispetto all'eclittica), argomento del perielio ω (orientazione dell'ellisse nel piano), più un angolo che dice dove si trova il corpo a un istante dato, per esempio la longitudine media L. La sezione usa la tabella del JPL di Standish con gli elementi all'epoca J2000 e le loro variazioni per secolo, valida fra il 1800 e il 2050. Il calcolo procede così: anomalia media M = L − ϖ, soluzione dell'equazione di Keplero M = E − e sin E con il metodo di Newton, coordinate nel piano dell'orbita x = a(cos E − e), y = a√(1 − e²) sin E, e infine tre rotazioni di ω, i e Ω per passare all'eclittica." },
      { titolo: "Precisione e limiti degli elementi medi", testo: "Gli elementi della tabella non sono osculanti a un istante ma medi, tarati per riprodurre le effemeridi di precisione su due secoli e mezzo: l'errore va da qualche decina di secondi d'arco per i pianeti interni a qualche minuto d'arco per quelli esterni, più che sufficiente per vedere i pianeti nella posizione giusta ma non per puntare un telescopio professionale. Per i pianeti nani si usano elementi osculanti approssimati, e l'errore cresce allontanandosi dall'epoca. Le effemeridi moderne, come le DE del JPL, integrano numericamente le equazioni del moto di tutti i corpi con le correzioni relativistiche, e sono tarate su misure radar, laser lunari e dati delle sonde." },
      { titolo: "Le popolazioni minori e le risonanze", testo: "Fra Marte e Giove, a circa 2,1–3,3 UA, orbita la fascia principale degli asteroidi. La sua distribuzione non è uniforme: le lacune di Kirkwood cadono dove il periodo dell'asteroide è in rapporto semplice con quello di Giove (3:1 a 2,50 UA, 5:2, 7:3, 2:1 a 3,28 UA), perché lì le perturbazioni si sommano sempre nella stessa fase e rendono le orbite caotiche ed eccentriche. Nei punti di Lagrange L4 e L5 di Giove si raccolgono invece gli asteroidi troiani, stabili; oltre Nettuno, fra circa 30 e 50 UA, la fascia di Kuiper ospita Plutone e molti altri corpi ghiacciati. Plutone, con eccentricità 0,25 e inclinazione 17°, attraversa l'orbita di Nettuno ma non lo incontra mai, protetto dalla risonanza 3:2." },
      { titolo: "La Luna e le eclissi", testo: "L'orbita della Luna è inclinata di 5,14° rispetto all'eclittica e la linea dei nodi, dove l'orbita lunare taglia l'eclittica, regredisce compiendo un giro in 18,6 anni per la perturbazione del Sole. Un'eclissi richiede che la Luna nuova o piena cada vicino a un nodo: altrimenti l'ombra passa sopra o sotto la Terra, ed è per questo che non ci sono eclissi ogni mese. Le condizioni favorevoli si ripetono in due «stagioni delle eclissi» l'anno, separate da circa 173 giorni, e l'intero ciclo si ripete quasi uguale dopo un saros di 18 anni, 11 giorni e 8 ore. Le eclissi totali di Sole sono possibili per la coincidenza che il Sole è circa 400 volte più grande della Luna e circa 400 volte più lontano, per cui i due dischi hanno quasi lo stesso diametro apparente." },
      { titolo: "Le stagioni", testo: "Le stagioni non dipendono dalla distanza dal Sole, che è minima all'inizio di gennaio, in pieno inverno boreale, ma dall'inclinazione di 23,44° dell'asse terrestre rispetto alla perpendicolare all'eclittica. Durante l'anno la declinazione del Sole varia fra +23,44° e −23,44°; a una latitudine φ la durata del dì segue da cos H₀ = −tan φ tan δ, dove H₀ è l'angolo orario del tramonto, e l'altezza del Sole a mezzogiorno è 90° − φ + δ. Un Sole più alto concentra la stessa energia su una superficie minore e resta più ore sopra l'orizzonte: entrambi gli effetti rendono l'estate più calda. Oltre i circoli polari, a |φ| > 66,56°, esistono giorni in cui il Sole non tramonta o non sorge." },
      { titolo: "Giove, Saturno e le loro risonanze", testo: "I tre satelliti medicei interni di Giove, Io, Europa e Ganimede, hanno periodi quasi esattamente nel rapporto 1 : 2 : 4, e le loro longitudini medie soddisfano esattamente λ_Io − 3λ_Europa + 2λ_Ganimede = 180°: è la risonanza di Laplace, che impedisce che i tre si allineino mai tutti dalla stessa parte. La risonanza mantiene eccentrica l'orbita di Io, e le maree variabili lo scaldano fino a renderlo il corpo più vulcanico del sistema solare. Gli anelli di Saturno sono miliardi di frammenti di ghiaccio, ciascuno sulla sua orbita kepleriana: quelli interni girano più in fretta, con velocità ∝ r^(−1/2). Il bordo interno della divisione di Cassini coincide con la risonanza 2:1 con il satellite Mimante, che svuota la regione." }
    ],
    formule: [
      ["M = L − ϖ,  M = E − e sin E", "anomalia media dalla longitudine media L e dalla longitudine del perielio ϖ = Ω + ω; equazione di Keplero per l'anomalia eccentrica E"],
      ["x′ = a(cos E − e),  y′ = a√(1 − e²) sin E", "coordinate nel piano dell'orbita, con il Sole nell'origine e il perielio sull'asse x′"],
      ["r_eclittica = R_z(Ω) R_x(i) R_z(ω) r′", "passaggio al sistema eclittico con tre rotazioni"],
      ["P = a^(3/2) anni (a in UA),  1/P_sin = |1 − 1/P|", "terza legge di Keplero e periodo sinodico rispetto alla Terra"],
      ["cos H₀ = −tan φ tan δ", "angolo orario del tramonto (senza rifrazione); la durata del dì è 2H₀/15° ore"],
      ["λ_Io − 3λ_Eu + 2λ_Ga = 180°", "relazione di Laplace fra le longitudini medie dei satelliti galileiani"]
    ],
    ipotesi: [
      "Elementi medi JPL validi fra il 1800 e il 2050; per i pianeti nani elementi osculanti approssimati, con errori crescenti lontano dall'epoca.",
      "La Luna è calcolata con una teoria troncata (Meeus): precisione dell'ordine del decimo di grado, sufficiente per fasi ed eclissi ma non per i tempi al secondo.",
      "Le particelle degli anelli e dei campi di asteroidi seguono orbite kepleriane imperturbate; le lacune e la divisione sono rappresentate, non generate dalla dinamica."
    ],
    errori: [
      "Attribuire le stagioni alla variazione della distanza Terra-Sole, che cambia solo del 3 % circa e ha il minimo in gennaio.",
      "Chiedersi perché non ci sia un'eclissi a ogni Luna nuova dimenticando l'inclinazione di 5° dell'orbita lunare.",
      "Pensare che la fascia degli asteroidi sia un ammasso fitto: la distanza tipica fra asteroidi grandi è di milioni di chilometri, e le sonde la attraversano senza manovre."
    ],
    esempio: {
      testo: "Marte ha semiasse a = 1,5237 UA. Il periodo siderale è P = 1,5237^(3/2) = 1,8808 anni. Il periodo sinodico rispetto alla Terra, cioè l'intervallo fra due opposizioni, è 1/(1 − 1/1,8808) = 1/0,46832 = 2,1353 anni, cioè 2,1353 · 365,25 giorni. È anche la cadenza delle finestre di lancio verso Marte.",
      risultato: "P = 1,88 anni; periodo sinodico ≈ 780 giorni (circa 26 mesi)"
    },
    fonti: [
      "E. M. Standish, J. G. Williams, Keplerian Elements for Approximate Positions of the Major Planets, JPL Solar System Dynamics, documento tecnico con le tabelle valide 1800–2050",
      "J. Meeus, Astronomical Algorithms, Willmann-Bell, 2ª ed., 1998, capitoli sull'equazione di Keplero, sulla posizione della Luna e sulle eclissi",
      "C. D. Murray, S. F. Dermott, Solar System Dynamics, Cambridge University Press, 1999, capitoli sulle risonanze e sulla dinamica degli anelli",
      "I. de Pater, J. J. Lissauer, Planetary Sciences, Cambridge University Press, 2ª ed., 2010, capitoli sulla dinamica e sui piccoli corpi"
    ],
    collegamenti: ['sastroorbite', 'sastromat', 'sastrocielo', 'sfisgrav', 'sfisastro']
  };

  /* ── 🛰️ Meccanica orbitale 3D ───────────────────────────────────────── */
  T['sastroorbite'] = {
    titolo: "Meccanica orbitale: elementi e vettore di stato, manovre, satelliti terrestri, problema di Lambert",
    sintesi: "Un veicolo in orbita è descritto indifferentemente da posizione e velocità o da sei elementi kepleriani, e le due descrizioni si convertono l'una nell'altra con i vettori momento angolare ed eccentricità. Cambiare orbita costa una variazione di velocità Δv, da minimizzare: Hohmann, bi-ellittica, cambio di piano. Lo schiacciamento della Terra fa precedere le orbite, effetto sfruttato per le orbite eliosincrone e Molniya; il problema di Lambert dà l'orbita che collega due punti in un tempo fissato.",
    paragrafi: [
      { titolo: "Elementi e vettore di stato", testo: "Dati il vettore posizione r e la velocità v di un corpo attorno a una massa con parametro gravitazionale μ = GM, l'orbita è completamente determinata. Il momento angolare specifico h = r × v è perpendicolare al piano dell'orbita e ne dà l'inclinazione, cos i = h_z/h. Il vettore nodo n = ẑ × h punta al nodo ascendente e dà Ω. Il vettore eccentricità e = (v × h)/μ − r/r punta al pericentro, e il suo modulo è l'eccentricità; l'angolo fra n ed e è l'argomento del pericentro ω, quello fra e ed r l'anomalia vera ν. Il semiasse viene dall'energia specifica, ε = v²/2 − μ/r = −μ/(2a). Per orbite circolari o equatoriali alcuni angoli non sono definiti, e si usano elementi alternativi." },
      { titolo: "Vis-viva e il trasferimento di Hohmann", testo: "L'energia dà la relazione vis-viva v² = μ(2/r − 1/a), lo strumento base di tutte le manovre. Il trasferimento fra due orbite circolari complanari che richiede il minimo Δv, con due impulsi, è l'ellisse di Hohmann (1925), tangente all'orbita interna nel pericentro e a quella esterna nell'apocentro: il primo impulso porta dalla velocità circolare a quella di pericentro dell'ellisse, il secondo dall'apocentro alla velocità circolare finale. Il tempo di volo è metà del periodo dell'ellisse. Se il rapporto r₂/r₁ supera 11,94, un trasferimento bi-ellittico, con un primo apocentro molto più lontano, può costare meno, e lo fa per qualunque apocentro intermedio quando il rapporto supera 15,58; il prezzo è un tempo di volo molto più lungo." },
      { titolo: "Il cambio di piano", testo: "Ruotare il piano di un'orbita circolare di un angolo Δi senza cambiarne le dimensioni richiede Δv = 2v sin(Δi/2): per un'orbita bassa, a 7,7 km/s, un solo grado costa 134 m/s, e 28,5° costano quasi quanto un nuovo lancio. Conviene quindi cambiare piano dove la velocità è minima, cioè all'apocentro, e combinarlo con un impulso già necessario: per la legge dei coseni Δv = √(v₁² + v₂² − 2v₁v₂ cos Δi) è molto minore della somma delle due manovre separate. È ciò che fanno i satelliti geostazionari lanciati da latitudini medie, che correggono l'inclinazione all'apogeo dell'orbita di trasferimento." },
      { titolo: "I satelliti terrestri e la perturbazione J₂", testo: "La Terra non è una sfera: il rigonfiamento equatoriale, descritto dal coefficiente J₂ = 1,0826·10⁻³ del potenziale, fa ruotare lentamente il piano delle orbite attorno all'asse terrestre con velocità Ω̇ = −(3/2) n J₂ (R/p)² cos i, e fa ruotare la linea degli apsidi. Le orbite eliosincrone, a inclinazioni intorno a 98°, scelgono la quota in modo che il piano giri di 0,9856° al giorno, seguendo il Sole: il satellite passa su ogni punto sempre alla stessa ora locale. Le orbite Molniya usano l'inclinazione critica di 63,4°, dove la rotazione degli apsidi si annulla, per tenere l'apogeo fisso sopra l'emisfero nord. Le orbite geostazionarie hanno raggio 42 164 km e periodo pari al giorno siderale; i satelliti GPS orbitano a circa 26 560 km con periodo di mezzo giorno siderale; la ISS a circa 400 km impiega circa 92 minuti." },
      { titolo: "Il problema di Lambert e il porkchop", testo: "Il problema inverso, trovare l'orbita che porta da r₁ a r₂ in un tempo Δt prefissato, fu posto da Lambert nel Settecento e ha soluzione unica per ogni verso di percorrenza e numero di giri. Con le variabili universali e le funzioni di Stumpff C(z) e S(z) si scrive un'unica equazione valida per ellissi, parabole e iperboli, risolta numericamente. Ripetendo il calcolo per molte date di partenza e durate di volo, e sottraendo le velocità dei pianeti, si ottiene la mappa del Δv chiamata «porkchop» per la sua forma: i minimi indicano le finestre di lancio, che per Marte si ripetono ogni 26 mesi circa. Le missioni reali ottimizzano poi la traiettoria con i passaggi ravvicinati e le correzioni di rotta." }
    ],
    formule: [
      ["h = r × v,  e = (v × h)/μ − r/r", "vettori momento angolare specifico ed eccentricità; μ = GM (per la Terra 3,986·10¹⁴ m³/s²)"],
      ["v² = μ(2/r − 1/a)", "equazione vis-viva; a semiasse maggiore"],
      ["Δv₁ = √(μ/r₁)[√(2r₂/(r₁+r₂)) − 1],  Δv₂ = √(μ/r₂)[1 − √(2r₁/(r₁+r₂))]", "impulsi del trasferimento di Hohmann fra orbite circolari di raggi r₁ e r₂"],
      ["t_H = π√[(r₁ + r₂)³/(8μ)]", "tempo di volo del trasferimento di Hohmann"],
      ["Δv = 2v sin(Δi/2)", "costo di un cambio di piano puro su un'orbita circolare di velocità v"],
      ["Ω̇ = −(3/2) n J₂ (R/p)² cos i", "precessione nodale dovuta allo schiacciamento terrestre; n moto medio, p = a(1 − e²) semilatus rectum"]
    ],
    ipotesi: [
      "Impulsi istantanei: le manovre con motori a bassa spinta (propulsione elettrica) seguono spirali e costano di più in Δv.",
      "Problema dei due corpi con la sola perturbazione J₂; si trascurano attrito atmosferico, pressione di radiazione, Luna e Sole.",
      "Il porkchop usa orbite planetarie kepleriane e trascura le fasi di fuga dalla Terra e di cattura a Marte."
    ],
    errori: [
      "Pensare che per raggiungere un'orbita più alta si debba spingere verso l'alto: si spinge lungo la velocità, e l'aumento di energia alza il lato opposto dell'orbita.",
      "Credere che in un'orbita più alta si vada più veloci: la velocità circolare √(μ/r) diminuisce con il raggio, anche se servono impulsi positivi per arrivarci.",
      "Trascurare il cambio di piano nel bilancio di una missione: spesso è la voce più costosa."
    ],
    esempio: {
      testo: "Trasferimento di Hohmann da un'orbita circolare a 300 km di quota (r₁ = 6678 km) all'orbita geostazionaria (r₂ = 42 164 km), con μ = 3,986·10¹⁴ m³/s². Velocità circolare iniziale 7,726 km/s; velocità di perigeo dell'ellisse di trasferimento (a = 24 421 km) 10,151 km/s, quindi Δv₁ = 2,426 km/s. All'apogeo la velocità è 1,608 km/s e quella geostazionaria 3,075 km/s, quindi Δv₂ = 1,467 km/s. Se all'apogeo si corregge anche un'inclinazione di 28,5°, la manovra combinata vale √(1,608² + 3,075² − 2 · 1,608 · 3,075 · cos 28,5°) = 1,830 km/s.",
      risultato: "Δv totale ≈ 3,89 km/s in 5,28 h (complanare); con 28,5° di cambio di piano all'apogeo ≈ 4,26 km/s"
    },
    fonti: [
      "H. D. Curtis, Orbital Mechanics for Engineering Students, Butterworth-Heinemann, 3ª ed., 2014, cap. 4 (elementi orbitali), cap. 5 (problema di Lambert), cap. 6 (manovre)",
      "R. R. Bate, D. D. Mueller, J. E. White, Fundamentals of Astrodynamics, Dover, 1971, capitoli sul vettore di stato, sulle variabili universali e sul problema di Gauss-Lambert",
      "D. A. Vallado, Fundamentals of Astrodynamics and Applications, Microcosm Press, 4ª ed., 2013, capitoli sulle perturbazioni J₂ e sulle orbite eliosincrone"
    ],
    collegamenti: ['sastrosole', 'sastromat', 'sfisgrav', 'sfismecc']
  };

  /* ── 📐 Matematica celeste ──────────────────────────────────────────── */
  T['sastromat'] = {
    titolo: "Matematica celeste: equazione di Keplero, rotazioni sulla sfera, integratori, periodogrammi",
    sintesi: "Sotto l'astronomia ci sono problemi matematici che hanno fatto la storia del calcolo numerico. L'equazione di Keplero è trascendente e si risolve per iterazione, con metodi che convergono in modo diverso; i cambi di coordinate celesti sono rotazioni, rappresentabili con matrici o quaternioni; integrare un'orbita per tempi lunghi richiede metodi simplettici; trovare un periodo in dati irregolari richiede il periodogramma di Lomb-Scargle o la ricerca di box.",
    paragrafi: [
      { titolo: "L'equazione di Keplero", testo: "Il moto su un'ellisse non è uniforme: è uniforme solo l'anomalia media M = n(t − τ), con n = 2π/P. La posizione richiede l'anomalia eccentrica E, legata a M dall'equazione di Keplero M = E − e sin E, che non ha soluzione in forma chiusa. Il metodo di Newton, E ← E − (E − e sin E − M)/(1 − e cos E), converge quadraticamente: il numero di cifre esatte raddoppia a ogni passo. L'iterazione di punto fisso E ← M + e sin E converge per ogni e < 1 perché la funzione è una contrazione, ma linearmente, con rapporto |e cos E|. La serie di Bessel E = M + Σ(2/k)J_k(ke) sin kM converge per ogni e < 1, mentre lo sviluppo in potenze di e (serie di Lagrange) diverge oltre il limite di Laplace e = 0,6627, per una singolarità nel piano complesso." },
      { titolo: "Le tre anomalie", testo: "Dall'anomalia eccentrica si ricavano il raggio r = a(1 − e cos E) e l'anomalia vera ν, l'angolo effettivo dal pericentro visto dal fuoco, tramite tan(ν/2) = √[(1 + e)/(1 − e)] tan(E/2). La costruzione geometrica è istruttiva: E è l'angolo, misurato dal centro, del punto sul cerchio circoscritto che ha la stessa ascissa del corpo; M è l'angolo di un corpo fittizio che percorre il cerchio con moto uniforme; ν è l'angolo vero. Per un'orbita circolare le tre coincidono. La differenza ν − M, l'equazione del centro, vale per piccoli e circa 2e sin M, e per la Terra arriva a quasi 2°: è una delle due componenti dell'equazione del tempo." },
      { titolo: "Sistemi di coordinate come rotazioni", testo: "Le coordinate astronomiche sono tutte coordinate sferiche su sistemi diversi: equatoriali (ascensione retta α e declinazione δ), eclittiche (λ, β), orizzontali (altezza h e azimut A), galattiche (l, b). Passare dall'uno all'altro è una rotazione dei vettori unitari: dall'equatoriale all'eclittico si ruota di ε = 23,44° attorno all'asse x che punta al punto vernale; dall'equatoriale all'orizzontale si usa l'angolo orario H = TSL − α e la latitudine, con sin h = sin φ sin δ + cos φ cos δ cos H. Le matrici di rotazione sono ortogonali, si compongono moltiplicandole e si invertono trasponendole. I quaternioni unitari rappresentano le stesse rotazioni con quattro numeri, evitano le singolarità degli angoli di Eulero e permettono l'interpolazione sferica (slerp), usata nella sezione per passare con continuità da un riferimento all'altro." },
      { titolo: "Integratori per il problema degli N corpi", testo: "Un integratore di ordine p ha un errore per unità di tempo proporzionale a h^p, che su un grafico log-log dell'errore contro il passo appare come una retta di pendenza p: 1 per Eulero, 4 per Runge-Kutta classico, 2 per il leapfrog di Störmer-Verlet, 4 per il metodo di Yoshida. Ma l'ordine non è tutto. Eulero e Runge-Kutta non rispettano la struttura hamiltoniana e l'energia deriva secolarmente; il leapfrog e Yoshida sono simplettici e conservano esattamente un'hamiltoniana modificata vicina a quella vera, per cui l'errore sull'energia resta limitato per tempi esponenzialmente lunghi. Il metodo di Yoshida (1990) compone tre passi di leapfrog con coefficienti w₁ = 1/(2 − 2^(1/3)) e w₀ = −2^(1/3)/(2 − 2^(1/3)), uno dei quali negativo. L'errore residuo si manifesta come una precessione spuria del pericentro." },
      { titolo: "Periodogrammi per dati irregolari", testo: "Le osservazioni astronomiche sono interrotte dal giorno, dal tempo e dalla Luna, e la trasformata di Fourier discreta, che vuole campioni equispaziati, non si applica. Il periodogramma di Lomb-Scargle stima a ogni frequenza la potenza come miglioramento dell'adattamento ai minimi quadrati di una sinusoide rispetto a una costante, con uno sfasamento τ che lo rende indipendente dall'origine dei tempi. Il campionamento notturno introduce alias a f ± 1 giorno⁻¹, picchi falsi che possono superare quello vero. Per i transiti planetari, brevi cali a forma di scatola, la sinusoide è un pessimo modello: l'algoritmo BLS di Kovács, Zucker e Mazeh (2002) cerca direttamente la combinazione di periodo, durata e fase che meglio separa i punti dentro e fuori dal transito. Il periodo trovato si verifica ripiegando la curva in fase." }
    ],
    formule: [
      ["M = E − e sin E", "equazione di Keplero; M anomalia media, E anomalia eccentrica, e eccentricità"],
      ["E ← E − (E − e sin E − M)/(1 − e cos E)", "iterazione di Newton, convergenza quadratica"],
      ["tan(ν/2) = √[(1+e)/(1−e)] tan(E/2),  r = a(1 − e cos E)", "anomalia vera e raggio dall'anomalia eccentrica"],
      ["sin h = sin φ sin δ + cos φ cos δ cos H", "altezza sull'orizzonte; φ latitudine, δ declinazione, H angolo orario"],
      ["errore ∝ h^p", "errore globale di un integratore di ordine p con passo h"],
      ["P(ω) = ½{[Σyᵢ cos ω(tᵢ−τ)]²/Σcos² ω(tᵢ−τ) + [Σyᵢ sin ω(tᵢ−τ)]²/Σsin² ω(tᵢ−τ)}", "periodogramma di Lomb-Scargle (dati yᵢ a media nulla); τ definito da tan 2ωτ = Σ sin 2ωtᵢ/Σ cos 2ωtᵢ"]
    ],
    ipotesi: [
      "L'equazione di Keplero vale per il problema dei due corpi imperturbato e per orbite ellittiche (per le iperboli si usa M = e sinh F − F).",
      "Le rotazioni fra sistemi di coordinate trascurano precessione, nutazione, aberrazione e rifrazione, se non introdotte esplicitamente.",
      "Lomb-Scargle presuppone un segnale sinusoidale e rumore gaussiano bianco; la probabilità di falso allarme va corretta per il numero di frequenze provate."
    ],
    errori: [
      "Confondere anomalia media e anomalia vera: coincidono solo per orbite circolari.",
      "Giudicare un integratore solo dall'ordine: un Runge-Kutta del quarto ordine può fare peggio di un leapfrog del secondo su tempi lunghissimi, perché la sua energia deriva.",
      "Scambiare un alias giornaliero per il periodo vero: un periodo di 0,5 giorni e uno di 1 giorno nei dati notturni producono picchi gemelli."
    ],
    esempio: {
      testo: "Si risolva M = E − e sin E con M = 60° = 1,047198 rad ed e = 0,5, partendo da E₀ = M. Primo passo di Newton: E₁ = 1,624548; poi E₂ = 1,548518, E₃ = 1,547057, E₄ = 1,5470567, e le cifre esatte passano da una a due, a quattro, a otto. L'iterazione di punto fisso dalla stessa partenza dà 1,480, 1,5451, 1,54703, 1,547056, con un guadagno di poco più di una cifra per passo. Infine tan(ν/2) = √3 · tan(0,773528) e r = a(1 − 0,5 cos E) = 0,9881 a.",
      risultato: "E = 1,547057 rad = 88,64°; anomalia vera ν = 118,8°; r = 0,988 a"
    },
    fonti: [
      "J. M. A. Danby, Fundamentals of Celestial Mechanics, Willmann-Bell, 2ª ed., 1988, capitoli sull'equazione di Keplero e sulle sue serie",
      "W. M. Smart, Textbook on Spherical Astronomy, Cambridge University Press, 6ª ed. (rivista da R. M. Green), 1977, capitoli sulla trigonometria sferica e sui sistemi di coordinate",
      "H. Yoshida, Construction of higher order symplectic integrators, Physics Letters A 150 (1990) 262",
      "J. D. Scargle, Studies in astronomical time series analysis II, Astrophysical Journal 263 (1982) 835",
      "G. Kovács, S. Zucker, T. Mazeh, A box-fitting algorithm in the search for periodic transits, Astronomy & Astrophysics 391 (2002) 369"
    ],
    collegamenti: ['sastroorbite', 'sastrocielo', 'smatnum', 'smatode', 'smatserie']
  };

  /* ── ⭐ Vita delle stelle 3D ─────────────────────────────────────────── */
  T['sastrostelle'] = {
    titolo: "Struttura ed evoluzione delle stelle: equilibrio, politropi, nucleosintesi, stadi finali",
    sintesi: "Una stella è una sfera di gas in equilibrio fra gravità e pressione, che irraggia l'energia prodotta dalla fusione nel nucleo. La struttura si studia con le equazioni dell'equilibrio idrostatico e del trasporto, e in prima approssimazione con i politropi di Lane-Emden. La massa iniziale decide la durata e la fine: nana bianca per le stelle come il Sole, supernova e stella di neutroni o buco nero per le più massicce. Le reazioni nucleari, dalla catena pp al ciclo CNO e oltre, producono gli elementi fino al ferro.",
    paragrafi: [
      { titolo: "L'equilibrio idrostatico", testo: "In ogni strato della stella il peso del materiale sovrastante è sostenuto dal gradiente di pressione: dP/dr = −Gm(r)ρ/r², con dm/dr = 4πr²ρ. Dalla stessa coppia di equazioni discende il teorema del viriale, secondo cui l'energia termica è metà del valore assoluto dell'energia gravitazionale: una stella che perde energia si contrae e si scalda, una specie di capacità termica negativa che rende stabile la combustione nucleare. Al centro del Sole la temperatura è di circa 1,57·10⁷ K e la densità di circa 150 g/cm³, valori che vengono dai modelli solari standard, verificati dall'eliosismologia e dai neutrini solari." },
      { titolo: "Trasporto dell'energia e superficie", testo: "L'energia prodotta nel nucleo esce per irraggiamento dove il gradiente di temperatura è modesto, per convezione dove sarebbe troppo ripido. Nella zona radiativa del Sole un fotone viene assorbito e riemesso innumerevoli volte, con un cammino libero medio di frazioni di millimetro, e l'energia impiega in media decine o centinaia di migliaia di anni per attraversarla, a seconda delle stime. Dal 71 % circa del raggio verso l'esterno il Sole è convettivo, e le celle di convezione emergono in superficie come granuli di circa mille chilometri. Il disco appare più scuro al bordo, perché lì si vedono strati più alti e freddi: in prima approssimazione I(μ) = 1 − u(1 − μ), con μ coseno dell'angolo dalla normale." },
      { titolo: "I politropi e l'equazione di Lane-Emden", testo: "Se la pressione dipende dalla densità come P = Kρ^(1+1/n), le equazioni di equilibrio si riducono all'equazione di Lane-Emden θ″ + (2/ξ)θ′ + θⁿ = 0, con ρ = ρ_c θⁿ e il raggio proporzionale a ξ. Ha soluzione analitica per n = 0, 1 e 5, e il primo zero ξ₁, che dà la superficie, vale √6 per n = 0, π per n = 1, 3,6538 per n = 1,5 e 6,8969 per n = 3, mentre per n = 5 il raggio è infinito. L'indice n = 1,5 descrive le stelle completamente convettive e il gas degenere non relativistico; n = 3 il modello standard di Eddington e il gas degenere ultrarelativistico, per cui il rapporto fra densità centrale e media è 54,18. Per un politropo la relazione massa-raggio è R ∝ M^((1−n)/(3−n)): per n = 3 la massa non dipende dal raggio, ed è la massa di Chandrasekhar." },
      { titolo: "Le reazioni nucleari", testo: "Nella catena protone-protone quattro protoni diventano un nucleo di elio con l'emissione di due positroni e due neutrini; l'energia liberata, compresa l'annichilazione dei positroni, è di 26,73 MeV per ogni ⁴He, di cui qualche percento se ne va con i neutrini. Nel ciclo CNO lo stesso risultato si ottiene usando carbonio, azoto e ossigeno come catalizzatori. Il tasso della catena pp cresce circa come T⁴ attorno a 15 milioni di kelvin, quello del CNO come T^16–T^20, per cui il CNO prevale sopra i 17–18 milioni di kelvin, cioè nelle stelle di massa superiore a circa 1,3 M☉. Esaurito l'idrogeno, a circa 10⁸ K l'elio brucia in carbonio con il processo tre alfa, poi nelle stelle massicce seguono carbonio, neon, ossigeno e silicio, fino al gruppo del ferro, dove l'energia di legame per nucleone è massima e la fusione non rende più." },
      { titolo: "L'evoluzione e gli stadi finali", testo: "La durata della sequenza principale scala circa come M^(−2,5): circa 10 miliardi di anni per il Sole, qualche decina di milioni per 15 M☉. Una stella di 1 M☉, finito l'idrogeno centrale, diventa gigante rossa, accende l'elio con un lampo, passa per il ramo orizzontale e il ramo asintotico, espelle l'involucro in una nebulosa planetaria e lascia una nana bianca di circa 0,6 M☉, sostenuta dalla pressione degli elettroni degeneri. La massa limite di una nana bianca, il limite di Chandrasekhar, è di circa 1,4 M☉. Sopra le 8–10 M☉ iniziali il nucleo di ferro collassa, rimbalza e produce una supernova di tipo II, lasciando una stella di neutroni di 1,2–2 M☉ e raggio di circa 12 km o, per le masse maggiori, un buco nero. La massa massima di una stella di neutroni, intorno a 2,2–2,3 M☉, dipende dall'equazione di stato della materia nucleare densa, ancora incerta." },
      { titolo: "Gli elementi oltre il ferro", testo: "Gli elementi più pesanti del ferro non si formano per fusione ma per cattura di neutroni seguita da decadimenti β. Nel processo lento (s), che avviene nelle stelle del ramo asintotico delle giganti, le catture sono più lente dei decadimenti e il percorso segue la valle di stabilità fino al bismuto. Nel processo rapido (r) il flusso di neutroni è così intenso che i nuclei si arricchiscono di neutroni prima di decadere; il sito principale osservato sono le fusioni di stelle di neutroni, come confermato dalla kilonova associata a GW170817, mentre il contributo di alcune supernove rare è ancora discusso. Ogni atomo di oro o di uranio sulla Terra viene da questi eventi." }
    ],
    formule: [
      ["dP/dr = −G m(r) ρ / r²,  dm/dr = 4πr²ρ", "equilibrio idrostatico e continuità della massa"],
      ["θ″ + (2/ξ)θ′ + θⁿ = 0", "equazione di Lane-Emden per un politropo P = Kρ^(1+1/n); ρ = ρ_c θⁿ, r = αξ"],
      ["R ∝ M^((1−n)/(3−n))", "relazione massa-raggio dei politropi a K fissato"],
      ["M_Ch ≈ 5,83/μ_e² M☉ ≈ 1,46 M☉ (μ_e = 2)", "massa di Chandrasekhar dal politropo n = 3; μ_e massa per elettrone in unità atomiche (le correzioni la riducono verso 1,4 M☉)"],
      ["4 ¹H → ⁴He + 2e⁺ + 2ν_e,  Q = 26,73 MeV", "bilancio netto della catena pp e del ciclo CNO"],
      ["t_SP ≈ 10¹⁰ anni (M/M☉)^(−2,5)", "durata approssimata della sequenza principale"],
      ["I(μ) = 1 − u(1 − μ)", "oscuramento al bordo lineare; μ coseno dell'angolo di vista, u coefficiente (circa 0,6 per il Sole nel visibile)"]
    ],
    ipotesi: [
      "Il politropo è un modello: una stella vera non ha un solo indice in tutto l'interno; i valori di ξ₁ e dei rapporti di densità sono esatti per il modello, non per il Sole.",
      "Le tracce evolutive della sezione sono schematiche, non calcolate con un codice di evoluzione stellare; le fasi brevi sono semplificate.",
      "Stelle singole, senza rotazione né perdita di massa importante, di composizione simile a quella solare; nelle binarie strette l'evoluzione può cambiare radicalmente."
    ],
    errori: [
      "Pensare che il Sole bruci come un fuoco chimico: la fusione nel nucleo libera circa dieci milioni di volte più energia per unità di massa di qualunque combustione.",
      "Credere che la fusione del ferro liberi energia come quella degli elementi leggeri: la assorbe, ed è proprio questo che innesca il collasso dei nuclei stellari.",
      "Immaginare che il Sole diventerà una supernova: la sua massa è troppo piccola, finirà come nana bianca."
    ],
    esempio: {
      testo: "Si stimi la durata della sequenza principale del Sole sapendo che può bruciare circa il 10 % della sua massa e che la fusione dell'idrogeno converte in energia lo 0,7 % della massa. L'energia a disposizione è 0,1 · 0,007 · M☉c² = 7·10⁻⁴ · 1,98847·10³⁰ kg · 8,98755·10¹⁶ m²/s² = 1,251·10⁴⁴ J. Divisa per la luminosità L☉ = 3,828·10²⁶ W dà 3,27·10¹⁷ s, cioè, con 3,156·10⁷ s per anno, circa 10 miliardi di anni. Il Sole, che ha 4,6 miliardi di anni, è a metà della sua vita in sequenza principale.",
      risultato: "t ≈ 1,0·10¹⁰ anni"
    },
    fonti: [
      "R. Kippenhahn, A. Weigert, A. Weiss, Stellar Structure and Evolution, Springer, 2ª ed., 2012, capitoli sulle equazioni di struttura, sui politropi, sulle reazioni nucleari e sugli stadi finali",
      "B. W. Carroll, D. A. Ostlie, An Introduction to Modern Astrophysics, Cambridge University Press, 2ª ed., 2017, cap. 10 (interni stellari), cap. 11 (il Sole), cap. 13 (evoluzione post-sequenza principale), cap. 15 e 16 (stelle massicce e resti degeneri)",
      "S. Chandrasekhar, An Introduction to the Study of Stellar Structure, University of Chicago Press, 1939 (rist. Dover), cap. IV (politropi)",
      "J. N. Bahcall, M. H. Pinsonneault, S. Basu, Solar models: current epoch and time dependences, neutrinos, and helioseismological properties, Astrophysical Journal 555 (2001) 990"
    ],
    collegamenti: ['sfisastro', 'snucleare', 'sfisnuclei', 'sastrobh', 'ssaha']
  };

  /* ── 🕳️ Buchi neri e relatività generale ─────────────────────────────── */
  T['sastrobh'] = {
    titolo: "Relatività generale e buchi neri: spaziotempo curvo, geodetiche, verifiche sperimentali, radiazione di Hawking",
    sintesi: "Nella relatività generale la gravità non è una forza ma la curvatura dello spaziotempo, prodotta da materia ed energia secondo le equazioni di campo di Einstein; i corpi in caduta libera seguono geodetiche. La soluzione di Schwarzschild descrive lo spaziotempo attorno a una massa sferica e, se la massa sta tutta dentro il raggio r_s = 2GM/c², un buco nero. Ne seguono effetti misurati con precisione, dal perielio di Mercurio al GPS fino alle immagini dell'Event Horizon Telescope, e una previsione ancora non osservata: la radiazione di Hawking.",
    paragrafi: [
      { titolo: "Dalla forza alla geometria", testo: "Il principio di equivalenza afferma che in una regione abbastanza piccola gli effetti della gravità non si distinguono da quelli di un riferimento accelerato: in caduta libera la gravità sparisce localmente. Einstein ne concluse che la gravità è una proprietà dello spaziotempo, descritto da una metrica g_μν che fissa gli intervalli ds² = g_μν dx^μ dx^ν e quindi il tempo proprio misurato dagli orologi. Una particella libera segue una geodetica, la curva che rende stazionario il tempo proprio. Le equazioni di campo G_μν + Λg_μν = (8πG/c⁴)T_μν legano il tensore di Einstein G_μν, costruito con la curvatura di Ricci, al tensore energia-impulso T_μν: sono dieci equazioni differenziali non lineari. Nel limite di campo debole e basse velocità, con g₀₀ ≈ −(1 + 2Φ/c²), si riduce all'equazione di Poisson ∇²Φ = 4πGρ di Newton." },
      { titolo: "Curvatura e forze di marea", testo: "Un osservatore in caduta libera non sente alcuna forza, ma due particelle vicine in caduta libera si avvicinano o si allontanano: è la deviazione geodetica, D²ξ^μ/dτ² = −R^μ_νρσ u^ν ξ^ρ u^σ, governata dal tensore di Riemann. La curvatura è quindi l'accelerazione di marea, che non si può eliminare con nessuna scelta del riferimento; nel limite newtoniano coincide con le derivate seconde del potenziale, ∂²Φ/∂xⁱ∂xʲ. Vicino a un buco nero di 10 masse solari, all'orizzonte (r_s ≈ 30 km), la differenza di accelerazione fra testa e piedi di una persona alta 2 m sarebbe 2GM·L/r³ ≈ 2·10⁸ m/s²: la «spaghettificazione». All'orizzonte di Sgr A*, quattro milioni di volte più massiccio, la stessa differenza scende a circa 10⁻³ m/s²." },
      { titolo: "La metrica di Schwarzschild e l'orizzonte", testo: "Fuori da una massa sferica non rotante la soluzione è unica (teorema di Birkhoff): ds² = −(1 − r_s/r)c²dt² + dr²/(1 − r_s/r) + r²(dθ² + sin²θ dφ²), con r_s = 2GM/c², che vale 2,95 km per il Sole e 8,9 mm per la Terra. Un orologio fermo a raggio r scorre con dτ/dt = √(1 − r_s/r) rispetto a uno all'infinito: è la dilatazione gravitazionale del tempo, che arrossa la luce che risale dal pozzo. A r = r_s la metrica in queste coordinate diverge, ma è un artificio delle coordinate: un osservatore in caduta lo attraversa in un tempo proprio finito, e coordinate come quelle di Eddington-Finkelstein lo descrivono senza problemi. È l'orizzonte degli eventi, superficie dalla quale nessun segnale può tornare. La vera singolarità, dove la curvatura diverge, sta a r = 0; dentro l'orizzonte r diventa una coordinata di tipo tempo, e ogni futuro termina lì." },
      { titolo: "Geodetiche: ISCO e sfera dei fotoni", testo: "In unità G = c = 1, con E e L energia e momento angolare per unità di massa, il moto radiale obbedisce a (dr/dτ)² = E² − V(r), con V(r) = (1 − 2M/r)(1 + L²/r²). Il termine attrattivo −2ML²/r³, assente in Newton, produce le orbite a rosetta che precedono, e il fatto che le orbite circolari stabili esistano solo fino al raggio r = 6M = 3r_s: l'ultima orbita circolare stabile (ISCO), che segna il bordo interno dei dischi di accrescimento. Una particella sull'ISCO ha E = √(8/9), per cui scendendo fino a lì il gas irraggia il 5,7 % della sua energia di massa. A 4M c'è l'orbita marginalmente legata, a 3M la sfera dei fotoni, dove la luce può girare in cerchio in equilibrio instabile. I fotoni con parametro d'impatto minore di √27 M cadono nel buco: da qui l'ombra, di raggio apparente √27 M, che la prima scheda ricostruisce integrando fotone per fotone l'equazione u″ + u = 3Mu²." },
      { titolo: "Le verifiche nel sistema solare", testo: "La precessione del perielio di Mercurio non spiegata dalle perturbazioni planetarie, 43″ per secolo, è data dalla formula 6πGM/[c²a(1 − e²)] per orbita: 42,98″ per secolo, in accordo con il residuo osservato. La deflessione della luce che sfiora il Sole, 4GM/(c²b) = 1,75″, il doppio del valore ottenibile trattando la luce come un proiettile newtoniano, fu misurata da Eddington nell'eclisse del 1919 con grande incertezza; oggi la radiointerferometria e il ritardo di Shapiro misurato con la sonda Cassini (2003) confermano la previsione a meglio di 2,3·10⁻⁵. Pound e Rebka (1960) misurarono lo spostamento gravitazionale verso il blu di raggi γ caduti per 22,5 m in una torre di Harvard: gh/c² = 2,5·10⁻¹⁵. Gli orologi dei satelliti GPS guadagnano 45,7 μs al giorno per il potenziale più debole e ne perdono 7,2 per la velocità; senza correzione l'errore di posizione crescerebbe di circa 11 km al giorno." },
      { titolo: "I buchi neri osservati", testo: "I buchi neri astrofisici si formano dal collasso di stelle massicce (da qualche massa solare a oltre cento) e stanno, con masse da 10⁶ a 10¹⁰ masse solari, al centro delle galassie. Hanno in generale momento angolare, e sono descritti dalla metrica di Kerr: per il teorema dell'assenza di capelli un buco nero isolato è caratterizzato solo da massa, momento angolare e carica. L'orbita della stella S2 attorno a Sgr A* ha mostrato il redshift gravitazionale (2018) e la precessione di Schwarzschild (2020), fissando la massa in circa 4·10⁶ M☉. L'Event Horizon Telescope ha ottenuto l'immagine dell'anello di emissione attorno all'ombra di M87* (2019, diametro 42 ± 3 μas, massa 6,5·10⁹ M☉) e di Sgr A* (2022, 51,8 ± 2,3 μas), in accordo con la relatività generale entro le incertezze. Le onde gravitazionali dalle fusioni di buchi neri sono trattate nella sezione dedicata." },
      { titolo: "La radiazione di Hawking: teoria, non ancora osservazione", testo: "Combinando la teoria quantistica dei campi con lo spaziotempo curvo, Hawking (1974-75) trovò che un buco nero emette come un corpo nero alla temperatura T_H = ħc³/(8πGMk_B), inversamente proporzionale alla massa: 6,2·10⁻⁸ K per una massa solare, molto meno dei 2,7 K della radiazione cosmica di fondo, per cui i buchi neri stellari oggi assorbono più di quanto emettano. Bekenstein e Hawking attribuirono al buco nero un'entropia S = k_B A/(4ℓ_P²), proporzionale all'area dell'orizzonte: per una massa solare circa 10⁷⁷ k_B. Il tempo di evaporazione cresce come M³ ed è di circa 2·10⁶⁷ anni per una massa solare; un buco nero primordiale di circa 5·10¹¹ kg starebbe esplodendo ora, ma nessuno ne è stato osservato e la loro esistenza è un'ipotesi. La radiazione di Hawking è una previsione teorica solida ma mai osservata direttamente, e la sorte dell'informazione che cade in un buco nero è un problema aperto." }
    ],
    formule: [
      ["G_μν + Λg_μν = (8πG/c⁴) T_μν", "equazioni di campo di Einstein; G_μν tensore di Einstein (curvatura), g_μν metrica, Λ costante cosmologica, T_μν tensore energia-impulso"],
      ["ds² = −(1 − r_s/r)c²dt² + dr²/(1 − r_s/r) + r²dΩ²,  r_s = 2GM/c²", "metrica di Schwarzschild; t tempo dell'osservatore all'infinito, r coordinata areale (la circonferenza è 2πr)"],
      ["D²ξ^μ/dτ² = −R^μ_νρσ u^ν ξ^ρ u^σ", "deviazione geodetica: la curvatura di Riemann come accelerazione relativa (di marea) fra geodetiche vicine"],
      ["(dr/dτ)² = E² − (1 − 2M/r)(1 + L²/r²)", "geodetiche di tipo tempo nel piano equatoriale, unità G = c = 1; E, L per unità di massa"],
      ["r_ISCO = 6GM/c²,  r_fotoni = 3GM/c²,  b_c = √27 GM/c²", "ultima orbita circolare stabile, sfera dei fotoni, parametro d'impatto critico (raggio dell'ombra)"],
      ["Δφ = 6πGM/[c²a(1 − e²)],  α = 4GM/(c²b)", "precessione del perielio per orbita e deflessione della luce in campo debole"],
      ["T_H = ħc³/(8πGMk_B),  S = k_B c³A/(4Għ)", "temperatura di Hawking ed entropia di Bekenstein-Hawking; A = 4πr_s² area dell'orizzonte"]
    ],
    ipotesi: [
      "Schwarzschild descrive un buco nero senza rotazione né carica; i buchi neri reali ruotano (Kerr), e ISCO e ombra cambiano con la rotazione (l'ombra di pochi percento, l'ISCO da 1M a 9M).",
      "Il tracciamento dei raggi usa un disco sottile, piatto e otticamente spesso, senza trasporto radiativo nel plasma: l'aspetto è qualitativo, i raggi critici sono esatti.",
      "La radiazione di Hawking è un risultato semiclassico (campi quantistici su spaziotempo classico); i calcoli di evaporazione della sezione contano solo i fotoni, e una teoria quantistica della gravità potrebbe modificarne gli stadi finali."
    ],
    errori: [
      "Pensare che un buco nero «aspiri» tutto ciò che ha intorno: a distanza grande rispetto a r_s la sua gravità è la stessa di una stella di uguale massa.",
      "Credere che all'orizzonte succeda qualcosa di localmente speciale: per un buco nero supermassiccio un osservatore in caduta non nota nulla nell'attraversarlo; ciò che è speciale è la struttura causale globale.",
      "Identificare l'immagine dell'EHT con l'orizzonte: si vede l'emissione del plasma deviata dalla curvatura, il cui anello sta poco fuori dall'ombra, che a sua volta è circa 2,6 volte più grande dell'orizzonte.",
      "Pensare che la gravità relativistica sia solo spazio curvo: per i moti lenti l'effetto dominante è la curvatura del tempo, cioè il termine g₀₀."
    ],
    esempio: {
      testo: "Diametro angolare dell'ombra di Sgr A*. Con M = 4,152·10⁶ M☉ e distanza D = 8,178 kpc (dati GRAVITY 2019): r_s = 2GM/c² = 2 · 6,6743·10⁻¹¹ · 8,256·10³⁶ / (2,9979·10⁸)² m = 1,226·10¹⁰ m, cioè 0,082 UA. Il diametro dell'ombra è 2b_c = 2√27 GM/c² = √27 r_s = 6,372·10¹⁰ m. La distanza vale 8,178 · 3,0857·10¹⁹ m = 2,524·10²⁰ m, quindi θ = 6,372·10¹⁰/2,524·10²⁰ = 2,525·10⁻¹⁰ rad. Moltiplicando per 206 265″/rad si ottiene il valore in microsecondi d'arco.",
      risultato: "θ ≈ 52 μas, in accordo con l'anello di 51,8 ± 2,3 μas misurato dall'EHT nel 2022"
    },
    fonti: [
      "S. M. Carroll, Spacetime and Geometry: An Introduction to General Relativity, Addison-Wesley, 2004 (rist. Cambridge University Press, 2019), cap. 3 (curvatura e deviazione geodetica), cap. 4 (equazioni di Einstein), cap. 5 (Schwarzschild), cap. 6 (buchi neri) e cap. 9 (effetto Hawking)",
      "J. B. Hartle, Gravity: An Introduction to Einstein's General Relativity, Addison-Wesley, 2003, cap. 9 (geometria di Schwarzschild e orbite), cap. 10 (verifiche nel sistema solare), cap. 12-13 (buchi neri e accrescimento)",
      "B. F. Schutz, A First Course in General Relativity, Cambridge University Press, 2ª ed., 2009, cap. 11 (geometria di Schwarzschild e buchi neri)",
      "C. W. Misner, K. S. Thorne, J. A. Wheeler, Gravitation, Freeman, 1973, capitoli 25, 31 e 40 (orbite, geometria di Schwarzschild, verifiche sperimentali)",
      "C. M. Will, The confrontation between general relativity and experiment, Living Rev. Relativ. 17 (2014) 4",
      "Event Horizon Telescope Collaboration, First M87 Event Horizon Telescope results I, ApJL 875 (2019) L1; First Sagittarius A* results I, ApJL 930 (2022) L12",
      "S. W. Hawking, Particle creation by black holes, Commun. Math. Phys. 43 (1975) 199; N. Ashby, Relativity in the Global Positioning System, Living Rev. Relativ. 6 (2003) 1"
    ],
    collegamenti: ['sfisrel', 'sastrogw', 'sastrocosmo', 'sfisgrav', 'smatnoneucl', 'sastrostelle']
  };

  /* ── 〰️ Onde gravitazionali ──────────────────────────────────────────── */
  T['sastrogw'] = {
    titolo: "Onde gravitazionali: formula del quadrupolo, coalescenza di binarie, rivelatori, pulsar binarie",
    sintesi: "Le equazioni di Einstein ammettono soluzioni ondulatorie: perturbazioni della metrica che viaggiano alla velocità della luce con due polarizzazioni trasverse. Le emettono masse con quadrupolo variabile, come due stelle compatte in orbita, che perdendo energia si avvicinano a spirale fino a fondersi. La pulsar binaria di Hulse e Taylor ne ha dato la prova indiretta dal 1974; dal 2015 gli interferometri LIGO e Virgo le rivelano direttamente, misurando variazioni di lunghezza mille volte più piccole di un protone.",
    paragrafi: [
      { titolo: "Increspature della metrica", testo: "Lontano dalle sorgenti si può scrivere g_μν = η_μν + h_μν con |h| ≪ 1. Linearizzando le equazioni di campo e scegliendo una gauge opportuna, la perturbazione soddisfa un'equazione d'onda □h̄_μν = −(16πG/c⁴)T_μν, e nel vuoto si propaga alla velocità c. Nella gauge trasversa e a traccia nulla restano due sole polarizzazioni, h₊ e h×, ruotate di 45° l'una rispetto all'altra. Un'onda + che viaggia lungo z stira le distanze lungo x mentre le comprime lungo y, e poi il contrario mezzo periodo dopo: un anello di masse libere diventa un'ellisse oscillante, come mostra la terza scheda. L'ampiezza h è una deformazione relativa, ΔL/L ≈ h/2, ed è adimensionale." },
      { titolo: "La formula del quadrupolo", testo: "Per la conservazione della massa e della quantità di moto non esiste radiazione gravitazionale di monopolo né di dipolo: il primo termine è il quadrupolo, e la potenza emessa è L = (G/5c⁵)⟨d³Q_ij/dt³ d³Q_ij/dt³⟩, con Q_ij il quadrupolo di massa a traccia nulla. Il fattore G/c⁵ ≈ 3·10⁻⁵³ W⁻¹ spiega perché nessuna sorgente di laboratorio è rivelabile: servono masse astronomiche che si muovono a velocità prossime a c. Per due masse m₁ e m₂ in orbita circolare di raggio a si ottiene P = (32/5)G⁴m₁²m₂²(m₁+m₂)/(c⁵a⁵). L'onda ha frequenza doppia di quella orbitale; la sua dipendenza dall'inclinazione è h₊ ∝ (1 + cos²θ)/2 e h× ∝ cos θ, per cui un sistema visto di faccia emette con polarizzazione circolare, uno visto di taglio solo con polarizzazione +." },
      { titolo: "La spirale e il cinguettio", testo: "La perdita di energia restringe l'orbita: da/dt = −(64/5)G³m₁m₂(m₁+m₂)/(c⁵a³), con tempo di coalescenza t_c = (5/256)c⁵a⁴/[G³m₁m₂(m₁+m₂)]. Man mano che le masse si avvicinano frequenza e ampiezza crescono: è il «chirp», il cinguettio, con f ∝ (t_c − t)^(−3/8) e h ∝ f^(2/3)/d. Nell'approssimazione newtoniana l'evoluzione dipende da una sola combinazione delle masse, la massa di chirp ℳ = (m₁m₂)^(3/5)/(m₁+m₂)^(1/5), che si ricava misurando insieme f e ḟ: ℳ = (c³/G)[(5/96)π^(−8/3) f^(−11/3) ḟ]^(3/5). Le masse singole, gli spin e la fase finale richiedono la relatività generale completa, con sviluppi post-newtoniani, relatività numerica per la fusione e modi quasi normali per l'assestamento del buco nero finale (ringdown)." },
      { titolo: "GW150914 e le osservazioni", testo: "Il 14 settembre 2015 i due rivelatori LIGO registrarono a 7 ms di distanza lo stesso segnale, salito in due decimi di secondo da 35 a circa 250 Hz, con deformazione massima di 1,0·10⁻²¹. Era la fusione di due buchi neri di circa 36 e 29 masse solari a circa 410 Mpc, che formò un buco nero di circa 62 masse solari, irraggiando circa 3 masse solari di energia in onde gravitazionali, con una potenza di picco di 3,6·10⁴⁹ W. Il 17 agosto 2017 GW170817, la fusione di due stelle di neutroni a circa 40 Mpc, fu seguita 1,7 s dopo da un lampo gamma e poi da una kilonova osservata in tutto lo spettro: la differenza fra la velocità delle onde gravitazionali e quella della luce è risultata inferiore a qualche parte su 10¹⁵. Oggi i cataloghi contano centinaia di eventi." },
      { titolo: "Il rivelatore interferometrico", testo: "LIGO è un interferometro di Michelson con bracci perpendicolari di 4 km, nei quali la luce rimbalza molte volte in cavità di Fabry-Pérot. Un'onda con h = 10⁻²¹ cambia la lunghezza di un braccio di circa hL/2 = 2·10⁻¹⁸ m, e la differenza fra i bracci sposta le frange. La risposta dipende dalla direzione di provenienza e dalla polarizzazione attraverso le funzioni d'antenna F₊ e F×; per un'onda + incidente dall'alto lungo l'asse perpendicolare al piano dei bracci la risposta è massima, mentre esistono direzioni cieche. Un solo rivelatore localizza male la sorgente: per triangolarla servono più strumenti distanti (le due sedi di LIGO, Virgo in Italia, KAGRA in Giappone), che misurano anche i ritardi di arrivo." },
      { titolo: "La pulsar di Hulse e Taylor", testo: "PSR B1913+16, scoperta nel 1974, è una pulsar in orbita eccentrica (e = 0,617) con un'altra stella di neutroni, con periodo orbitale di 7,75 ore. Gli impulsi radio fanno da orologio di precisione e permettono di misurare la precessione del periastro, 4,2° all'anno, e la variazione del periodo orbitale. La formula di Peters e Mathews, che include il fattore di eccentricità f(e) = (1 + 73e²/24 + 37e⁴/96)/(1 − e²)^(7/2) ≈ 11,9, prevede Ṗ_b = −2,40·10⁻¹²; il valore osservato, corretto per l'accelerazione galattica, coincide entro lo 0,2 %. L'effetto si accumula: l'istante del passaggio al periastro anticipa con andamento parabolico, di decine di secondi in trent'anni. Fu la prima prova, indiretta, dell'esistenza delle onde gravitazionali, premiata con il Nobel nel 1993; quello del 2017 andò a Weiss, Barish e Thorne per la rivelazione diretta." }
    ],
    formule: [
      ["□h̄_μν = −(16πG/c⁴) T_μν", "equazione d'onda linearizzata nella gauge di Lorenz; h̄ perturbazione a traccia invertita"],
      ["P = (32/5) G⁴ m₁²m₂²(m₁+m₂) / (c⁵ a⁵)", "potenza emessa da una binaria circolare di separazione a"],
      ["ℳ = (m₁m₂)^(3/5) / (m₁+m₂)^(1/5)", "massa di chirp, la combinazione che governa l'evoluzione della frequenza"],
      ["h ≈ (4/d)(Gℳ/c²)^(5/3)(πf/c)^(2/3)", "ampiezza dell'onda a distanza d, frequenza f, orientazione ottimale"],
      ["f_ISCO = c³/(6^(3/2) π G M)", "frequenza dell'onda all'ultima orbita circolare stabile, M massa totale (fine stimata della spirale)"],
      ["Ṗ_b = −(192πG^(5/3)/5c⁵)(P_b/2π)^(−5/3) f(e) m_p m_c (m_p+m_c)^(−1/3)", "decadimento del periodo orbitale di una binaria eccentrica (Peters e Mathews)"]
    ],
    ipotesi: [
      "Formula del quadrupolo e chirp newtoniano: valgono per velocità orbitali ≪ c, cioè fino a poco prima della fusione; la fusione stessa richiede la relatività numerica.",
      "Le masse sono quelle della sorgente; il segnale osservato a distanza cosmologica è stirato da (1 + z), per cui le masse misurate nel riferimento del rivelatore sono più grandi di quel fattore.",
      "Il suono della sezione è il segnale traslato e accelerato nella banda udibile: è una rappresentazione, non il suono reale."
    ],
    errori: [
      "Pensare che le onde gravitazionali siano onde «nello spazio» che spostano i rivelatori: sono variazioni della distanza propria fra masse libere, misurate con la luce.",
      "Credere che un sistema a simmetria sferica che pulsa irraggi onde gravitazionali: monopolo e dipolo non irraggiano, serve un quadrupolo variabile.",
      "Confondere la frequenza dell'onda con quella orbitale: per un'orbita circolare la prima è il doppio."
    ],
    esempio: {
      testo: "Per GW150914 con m₁ = 36 M☉ e m₂ = 29 M☉: m₁m₂ = 1044 M☉², (1044)^(3/5) = 64,8 e (65)^(1/5) = 2,305, quindi ℳ = 28,1 M☉. La frequenza all'ISCO per M = 65 M☉ è c³/(6^(3/2)πGM) = 67,6 Hz. Il tempo che manca alla coalescenza quando l'onda è a 35 Hz è (5/256)(Gℳ/c³)^(−5/3)(πf)^(−8/3), con Gℳ/c³ = 1,384·10⁻⁴ s: circa 0,19 s. A 410 Mpc e 100 Hz l'ampiezza per orientazione ottimale è h ≈ 1,6·10⁻²¹.",
      risultato: "ℳ ≈ 28 M☉, f_ISCO ≈ 68 Hz, 0,19 s da 35 Hz alla fusione, h ≈ 10⁻²¹: gli ordini di grandezza osservati"
    },
    fonti: [
      "B. P. Abbott et al. (LIGO Scientific Collaboration e Virgo Collaboration), Observation of gravitational waves from a binary black hole merger, Phys. Rev. Lett. 116 (2016) 061102",
      "B. P. Abbott et al., GW170817: Observation of gravitational waves from a binary neutron star inspiral, Phys. Rev. Lett. 119 (2017) 161101",
      "M. Maggiore, Gravitational Waves, vol. 1: Theory and Experiments, Oxford University Press, 2008, cap. 1 (onde linearizzate), cap. 3-4 (quadrupolo e binarie), cap. 6 (pulsar binarie) e cap. 9 (interferometri)",
      "B. F. Schutz, A First Course in General Relativity, Cambridge University Press, 2ª ed., 2009, cap. 9 (radiazione gravitazionale)",
      "P. C. Peters, J. Mathews, Gravitational radiation from point masses in a Keplerian orbit, Phys. Rev. 131 (1963) 435; J. M. Weisberg, Y. Huang, Relativistic measurements from timing the binary pulsar PSR B1913+16, ApJ 829 (2016) 55"
    ],
    collegamenti: ['sastrobh', 'sfisrel', 'sastrostelle', 'sfisonde']
  };

  /* ── 🌠 Cosmologia 3D ────────────────────────────────────────────────── */
  T['sastrocosmo'] = {
    titolo: "Cosmologia: l'universo di Friedmann-Lemaître, distanze, radiazione di fondo, storia termica",
    sintesi: "Su grandi scale l'universo è omogeneo e isotropo, e la sua geometria è quella di Friedmann-Lemaître-Robertson-Walker: le distanze crescono tutte con un fattore di scala a(t), il cui andamento è dettato dalle equazioni di Einstein attraverso l'equazione di Friedmann. Da a(t) seguono il redshift, l'età, le diverse definizioni di distanza. La radiazione cosmica di fondo e l'abbondanza dell'elio testimoniano un passato caldo e denso. Il modello ΛCDM descrive i dati con sei parametri, ma la natura della materia oscura e dell'energia oscura resta sconosciuta.",
    paragrafi: [
      { titolo: "La metrica FLRW e il redshift", testo: "L'ipotesi che l'universo, mediato su scale di centinaia di megaparsec, sia omogeneo e isotropo (principio cosmologico) riduce la metrica alla forma ds² = −c²dt² + a(t)²[dχ² + S_k(χ)²dΩ²], dove χ è la distanza comovente, S_k(χ) vale χ, sin χ o sinh χ secondo che lo spazio sia piatto, chiuso o aperto, e a(t) è il fattore di scala, uguale a 1 oggi. Le galassie hanno, a parte i moti locali, coordinate comoventi fisse, e le loro distanze proprie crescono come a(t): è ciò che mostra il reticolo della prima scheda. La luce emessa quando il fattore di scala era a arriva con lunghezza d'onda allungata dello stesso fattore, 1 + z = 1/a. Non si tratta di un effetto Doppler di galassie che corrono nello spazio, ma dello stiramento dello spazio durante il viaggio." },
      { titolo: "Le equazioni di Friedmann", testo: "Inserendo la metrica FLRW nelle equazioni di Einstein G_μν + Λg_μν = (8πG/c⁴)T_μν con un fluido perfetto si ottiene H² = (ȧ/a)² = (8πG/3)ρ − kc²/a² + Λc²/3. Dividendo per H₀² e introducendo i parametri di densità attuali, H² = H₀²[Ω_r a⁻⁴ + Ω_m a⁻³ + Ω_k a⁻² + Ω_Λ]: la radiazione si diluisce come a⁻⁴ (numero di fotoni e loro lunghezza d'onda), la materia come a⁻³, la costante cosmologica resta costante. La densità critica ρ_c = 3H₀²/(8πG), che separa le geometrie aperte da quelle chiuse, vale 8,5·10⁻²⁷ kg/m³, l'equivalente di circa cinque protoni per metro cubo. La seconda equazione, ä/a = −(4πG/3)(ρ + 3p/c²) + Λc²/3, mostra che la pressione negativa di Λ fa accelerare l'espansione: con i parametri di Planck l'accelerazione è iniziata a z ≈ 0,63." },
      { titolo: "Età e distanze", testo: "L'età si ottiene integrando dt = da/(aH): con i parametri di Planck 2018 risulta circa 13,8 miliardi di anni, meno di 1/H₀ = 14,5 miliardi. In un universo in espansione «distanza» non ha un solo significato. La distanza comovente D_C = c∫dz/H(z) è quella di oggi fra noi e la sorgente; la distanza di luminosità D_L = (1 + z)D_M è quella che rende vera la legge dell'inverso del quadrato per il flusso; la distanza di diametro angolare D_A = D_M/(1 + z) è quella che lega dimensione e angolo. D_A ha un massimo vicino a z ≈ 1,6, oltre il quale gli oggetti appaiono di nuovo più grandi, perché li vediamo come erano quando l'universo era più piccolo: è la «goccia» del cono di luce passato di Davis e Lineweaver. Le supernove di tipo Ia usate come candele standard rivelarono nel 1998 l'accelerazione dell'espansione." },
      { titolo: "La radiazione cosmica di fondo", testo: "Fino a z ≈ 1100, circa 380 000 anni dopo l'inizio, l'universo era un plasma opaco di fotoni, elettroni e nuclei. A circa 3000 K gli elettroni si legarono ai nuclei (ricombinazione) e i fotoni viaggiarono liberi: li riceviamo oggi, raffreddati di un fattore 1 + z, come un corpo nero quasi perfetto a 2,7255 K con il massimo intorno a 160 GHz. Le anisotropie, di una parte su 10⁵, conservano le oscillazioni acustiche del plasma primordiale: il loro spettro di potenza in multipoli ℓ mostra picchi la cui posizione dipende dalla scala acustica ℓ_A = πD_M(z*)/r_s, il rapporto fra la distanza della superficie di ultimo scattering e l'orizzonte sonoro. Il primo picco a ℓ ≈ 220 indica uno spazio quasi piatto; i rapporti fra i picchi danno la densità di barioni e di materia oscura. La mappa della sezione è un campo gaussiano sintetico con uno spettro modello, non la mappa osservata." },
      { titolo: "La storia termica e la nucleosintesi", testo: "Nell'era della radiazione la temperatura scala come 1/a e il tempo come T⁻²: t ≈ 2,42 g*^(−1/2) (T/1 MeV)⁻² secondi, con g* numero efficace di specie relativistiche. A circa 1 MeV le reazioni deboli che convertono neutroni e protoni si fermano, con n/p ≈ 1/6; durante i minuti successivi i neutroni decadono finché a circa 0,07 MeV si forma il deuterio e quasi tutti i neutroni finiscono nell'elio. Con n/p sceso nel frattempo a circa 1/7 ne segue una frazione in massa di elio Y ≈ 2(n/p)/(1 + n/p) ≈ 0,25, confermata dalle osservazioni, con tracce di deuterio, elio-3 e litio-7. Dopo la ricombinazione vengono i «secoli bui», le prime stelle e la reionizzazione dell'idrogeno intergalattico, completata a z ≈ 6. L'inflazione, un'espansione accelerata nei primissimi istanti, è un'ipotesi che spiega piattezza, omogeneità e lo spettro delle fluttuazioni, ma non è verificata direttamente." },
      { titolo: "ΛCDM: ciò che si misura e ciò che non si sa", testo: "Il modello standard ΛCDM descrive con sei parametri la radiazione di fondo, le oscillazioni acustiche dei barioni nella distribuzione delle galassie, le supernove e le abbondanze primordiali. Planck 2018 dà H₀ = 67,4 ± 0,5 km/s/Mpc, Ω_m = 0,315 ± 0,007, Ω_Λ ≈ 0,685, curvatura compatibile con zero entro pochi millesimi e un'età di 13,79 ± 0,02 miliardi di anni. Questi sono numeri misurati, all'interno del modello. La materia oscura, circa l'84 % della materia, è dedotta solo dai suoi effetti gravitazionali e la sua natura è ignota; l'energia oscura, compatibile per ora con una costante cosmologica, è altrettanto misteriosa, e alcuni dati recenti suggeriscono che possa variare nel tempo. Le misure locali di H₀ con le cefeidi e le supernove danno circa 73 km/s/Mpc: la «tensione di Hubble» è un problema aperto." }
    ],
    formule: [
      ["ds² = −c²dt² + a(t)²[dχ² + S_k(χ)² dΩ²]", "metrica di Friedmann-Lemaître-Robertson-Walker; χ distanza comovente, a fattore di scala"],
      ["H² = H₀² [Ω_r a⁻⁴ + Ω_m a⁻³ + Ω_k a⁻² + Ω_Λ]", "equazione di Friedmann in termini dei parametri di densità attuali, Ω_k = 1 − Ω_r − Ω_m − Ω_Λ"],
      ["1 + z = 1/a,  T = T₀(1 + z)", "redshift cosmologico e temperatura della radiazione di fondo (T₀ = 2,7255 K)"],
      ["ρ_c = 3H₀²/(8πG)", "densità critica; 8,5·10⁻²⁷ kg/m³ per H₀ = 67,4 km/s/Mpc"],
      ["D_C = c ∫₀^z dz′/H(z′),  D_L = (1+z) D_M,  D_A = D_M/(1+z)", "distanze comovente, di luminosità e di diametro angolare (D_M = D_C per spazio piatto)"],
      ["t₀ = [2/(3H₀√Ω_Λ)] arcsinh√(Ω_Λ/Ω_m)", "età di un universo piatto con materia e Λ, trascurando la radiazione"],
      ["t ≈ 2,42 g*^(−1/2) (T/1 MeV)⁻² s", "relazione tempo-temperatura nell'era della radiazione"]
    ],
    ipotesi: [
      "Principio cosmologico: omogeneità e isotropia valgono solo su scale maggiori di qualche centinaio di megaparsec.",
      "I parametri sono quelli di ΛCDM; materia oscura fredda ed energia oscura come costante cosmologica sono ipotesi di modello, non identificazioni fisiche.",
      "Lo spettro della radiazione di fondo nella sezione è un modello analitico tarato per somigliare a quello di Planck, e la nucleosintesi è trattata con una stima semplificata del congelamento n/p."
    ],
    errori: [
      "Pensare che nulla possa allontanarsi più veloce della luce: le galassie oltre la sfera di Hubble c/H₀ ≈ 4,4 Gpc hanno velocità di recessione superiori a c senza violare la relatività, che vale localmente.",
      "Credere che il Big Bang sia avvenuto in un punto: è avvenuto ovunque, e la radiazione di fondo arriva da tutte le direzioni.",
      "Interpretare il redshift cosmologico come effetto Doppler di velocità: per z grandi la formula z = v/c non vale, e la stessa velocità di recessione dipende dalla definizione di distanza."
    ],
    esempio: {
      testo: "Età di un universo piatto con H₀ = 67,4 km/s/Mpc, Ω_m = 0,315, Ω_Λ = 0,685 (radiazione trascurata). Si ha 1/H₀ = 977,79/67,4 Gyr = 14,507 Gyr. Inoltre √Ω_Λ = 0,82765 e √(Ω_Λ/Ω_m) = 1,47465, il cui arcoseno iperbolico vale 1,18062. Allora t₀ = (2/(3 · 0,82765)) · 1,18062 · 14,507 Gyr = 0,95099 · 14,507 Gyr. L'accelerazione è iniziata a 1 + z = (2Ω_Λ/Ω_m)^(1/3) = 1,632.",
      risultato: "t₀ ≈ 13,80 miliardi di anni (Planck 2018: 13,79 ± 0,02); inizio dell'accelerazione a z ≈ 0,63"
    },
    fonti: [
      "Planck Collaboration, Planck 2018 results. VI. Cosmological parameters, Astronomy & Astrophysics 641 (2020) A6",
      "B. Ryden, Introduction to Cosmology, Cambridge University Press, 2ª ed., 2016, cap. 3 (metrica FLRW), cap. 5 (modelli), cap. 6 (distanze), cap. 8 (radiazione di fondo), cap. 9 (nucleosintesi)",
      "S. Weinberg, Cosmology, Oxford University Press, 2008, cap. 1 (espansione e distanze), cap. 2-3 (storia termica e nucleosintesi), cap. 7 (anisotropie della radiazione di fondo)",
      "D. W. Hogg, Distance measures in cosmology, arXiv:astro-ph/9905116 (1999)",
      "T. M. Davis, C. H. Lineweaver, Expanding confusion: common misconceptions of cosmological horizons and the superluminal expansion of the universe, Publ. Astron. Soc. Aust. 21 (2004) 97"
    ],
    collegamenti: ['sastrobh', 'sastrogal', 'sfisastro', 'sfisrel', 'sfisstat']
  };

  /* ── 🌌 Galassie 3D ──────────────────────────────────────────────────── */
  T['sastrogal'] = {
    titolo: "Galassie: morfologia, bracci a spirale, curve di rotazione e materia oscura, interazioni",
    sintesi: "Le galassie sono sistemi di centinaia di miliardi di stelle, gas e materia oscura legati dalla gravità. La sequenza di Hubble le ordina per forma; nelle spirali i bracci sono onde di densità che le stelle attraversano. Le curve di rotazione, piatte fin oltre il disco visibile, sono una delle prove più dirette dell'esistenza di massa non luminosa. Gli incontri ravvicinati producono code mareali, ponti e anelli, e la Via Lattea fa parte del Gruppo Locale insieme ad Andromeda.",
    paragrafi: [
      { titolo: "La sequenza di Hubble", testo: "Hubble divise le galassie in ellittiche (da E0, quasi rotonde, a E7, molto schiacciate, con il numero uguale a 10(1 − b/a)), lenticolari S0, con disco ma senza bracci, spirali normali Sa–Sc e barrate SBa–SBc, con bulge sempre meno importante e bracci sempre più aperti, e irregolari. Il diagramma a diapason non è una sequenza evolutiva, come si credeva all'inizio, ma una classificazione. Le ellittiche sono dominate da stelle vecchie con orbite disordinate e sono sostenute dalla dispersione di velocità; le spirali hanno dischi in rotazione ordinata, con gas e formazione stellare in corso. Nella sezione le ellittiche sono sferoidi con il profilo di Hernquist, ρ ∝ 1/[r(r + a)³], che riproduce bene la legge di brillanza r^(1/4) di de Vaucouleurs." },
      { titolo: "I bracci come onde di densità", testo: "Se i bracci fossero fatti sempre delle stesse stelle, la rotazione differenziale li avvolgerebbe in poche rotazioni in spirali strettissime: è il problema dell'avvolgimento, che la scheda delle curve di rotazione mostra con file di stelle inizialmente allineate. Lin e Shu (1964) proposero che i bracci siano onde di densità quasi stazionarie, con un disegno che ruota rigidamente con velocità angolare Ω_p, mentre le stelle girano con la propria Ω(R) e lo attraversano, rallentando e affollandosi dentro il braccio come le auto in un tratto di strada stretto. Il gas, compresso nel braccio, forma stelle: le stelle giovani e blu e le regioni HII disegnano il braccio, mentre le corsie di polvere stanno sul lato interno. I bracci sono approssimati da spirali logaritmiche con angolo di avvolgimento costante." },
      { titolo: "Le curve di rotazione", testo: "Per un'orbita circolare v²(R) = GM(<R)/R, almeno per una distribuzione sferica. Se la massa fosse quella visibile, concentrata nel bulge e in un disco esponenziale con scala R_d, la velocità dovrebbe raggiungere un massimo a circa 2,2 R_d e poi decrescere come R^(−1/2), come i pianeti attorno al Sole. Le misure della riga a 21 cm dell'idrogeno neutro, molto oltre il disco stellare, mostrano invece curve piatte, come scoprirono negli anni Settanta Rubin, Ford e Bosma. Serve una massa che cresca linearmente con R: un alone di materia oscura. Le simulazioni cosmologiche suggeriscono per l'alone il profilo NFW, ρ ∝ 1/[x(1 + x)²] con x = r/r_s, la cui massa racchiusa M(r) = 4πρ_s r_s³[ln(1 + x) − x/(1 + x)] cresce lentamente. Che cosa sia la materia oscura è ignoto; teorie alternative della gravità come MOND riproducono bene le curve di rotazione ma hanno difficoltà con gli ammassi e con la radiazione di fondo." },
      { titolo: "Le collisioni fra galassie", testo: "Le stelle di due galassie che si incontrano quasi non si urtano mai: le distanze fra stelle sono decine di milioni di volte i loro raggi. Ciò che conta sono le forze di marea, che deformano i dischi. Toomre e Toomre (1972) lo mostrarono con un modello ristretto: due nuclei massicci su un'orbita parabolica e particelle di prova senza massa sui dischi. Ne uscirono le lunghe code delle Antenne, il ponte di materia fra M51 e la sua compagna, e, con un passaggio frontale attraverso il centro, l'anello della galassia Ruota del Carro. Le interazioni reali comportano anche l'attrito dinamico, che fa spiraleggiare i nuclei fino alla fusione, e la compressione del gas, che accende intensi episodi di formazione stellare." },
      { titolo: "La Via Lattea e il Gruppo Locale", testo: "La nostra galassia è una spirale barrata con un disco di circa 30 kpc di diametro. Il Sole sta a circa 8,2 kpc dal centro, dove si trova il buco nero Sgr A*, e gira a circa 230 km/s, compiendo un'orbita in circa 220 milioni di anni. La Via Lattea, Andromeda (M31, a circa 765 kpc) e la Galassia del Triangolo (M33) sono le spirali del Gruppo Locale, che comprende decine di galassie nane come le Nubi di Magellano, a circa 50 e 60 kpc. Andromeda si avvicina a circa 110 km/s; una fusione fra alcuni miliardi di anni è possibile, ma le stime più recenti, che tengono conto delle incertezze sui moti trasversi e dell'influenza di M33 e della Grande Nube, la rendono tutt'altro che certa." }
    ],
    formule: [
      ["v_c² (R) = G M(<R) / R", "velocità circolare; M(<R) massa racchiusa (esatta per simmetria sferica)"],
      ["v² = 4πGΣ₀R_d y² [I₀(y)K₀(y) − I₁(y)K₁(y)],  y = R/(2R_d)", "disco esponenziale sottile di Freeman; I, K funzioni di Bessel modificate, Σ₀ densità superficiale centrale"],
      ["M(r) = 4πρ_s r_s³ [ln(1+x) − x/(1+x)],  x = r/r_s", "massa racchiusa dell'alone di Navarro-Frenk-White"],
      ["M_H(r) = M r²/(r + a)²", "massa racchiusa del profilo di Hernquist per bulge ed ellittiche"],
      ["φ(R) = −cot(i) ln(R/R₀)", "spirale logaritmica con angolo di avvolgimento i"],
      ["G = 4,30091·10⁻⁶ kpc (km/s)² M☉⁻¹", "costante di gravitazione nelle unità galattiche della sezione"]
    ],
    ipotesi: [
      "Curve di rotazione calcolate sommando in quadratura i contributi di componenti a simmetria sferica o di disco sottile, senza gas e senza barre.",
      "La collisione è un problema ristretto: le stelle sono particelle di prova e i nuclei hanno potenziale di Plummer, per cui manca l'attrito dinamico.",
      "La materia oscura è un'ipotesi ben sostenuta da molte osservazioni indipendenti, ma la sua natura non è nota."
    ],
    errori: [
      "Pensare che i bracci di spirale siano strutture materiali fisse: sono onde, e le stelle li attraversano.",
      "Credere che in una collisione fra galassie le stelle si scontrino: le collisioni stellari dirette sono rarissime.",
      "Leggere il diagramma a diapason come un percorso evolutivo dalle ellittiche alle spirali."
    ],
    esempio: {
      testo: "Massa della Galassia entro l'orbita del Sole e periodo orbitale, con R = 8,2 kpc e v = 230 km/s. M = v²R/G = (230)² · 8,2 / 4,30091·10⁻⁶ M☉ = 52 900 · 8,2 / 4,30091·10⁻⁶ M☉. Il periodo è 2πR/v: 2π · 8,2 · 3,0857·10¹⁶ km / 230 km/s = 6,91·10¹⁵ s, che divisi per 3,156·10¹³ s per milione di anni danno il risultato.",
      risultato: "M(<8,2 kpc) ≈ 1,0·10¹¹ M☉; periodo orbitale del Sole ≈ 219 milioni di anni"
    },
    fonti: [
      "J. Binney, S. Tremaine, Galactic Dynamics, Princeton University Press, 2ª ed., 2008, cap. 2 (potenziali, disco esponenziale), cap. 6 (struttura a spirale) e cap. 8 (incontri e fusioni)",
      "L. S. Sparke, J. S. Gallagher, Galaxies in the Universe, Cambridge University Press, 2ª ed., 2007, capitoli sulla Via Lattea, sul Gruppo Locale e sulle spirali",
      "J. F. Navarro, C. S. Frenk, S. D. M. White, A universal density profile from hierarchical clustering, Astrophysical Journal 490 (1997) 493",
      "A. Toomre, J. Toomre, Galactic bridges and tails, Astrophysical Journal 178 (1972) 623",
      "C. C. Lin, F. H. Shu, On the spiral structure of disk galaxies, Astrophysical Journal 140 (1964) 646"
    ],
    collegamenti: ['sastrocosmo', 'sfisgrav', 'sastrobh', 'sfisastro']
  };

  /* ── 🔭 Planetario 3D ────────────────────────────────────────────────── */
  T['sastrocielo'] = {
    titolo: "Astronomia di posizione: sfera celeste, tempo siderale, levate e tramonti, precessione, analemma",
    sintesi: "Il cielo visto da un luogo e a un'ora si calcola con poche rotazioni: le stelle hanno coordinate equatoriali quasi fisse, la Terra ruota sotto di esse con il tempo siderale, e la latitudine dell'osservatore inclina l'orizzonte. Dalle stesse formule seguono gli istanti di levata e tramonto e le stelle circumpolari. Su tempi lunghi l'asse terrestre precede e cambia la stella polare; nel corso dell'anno l'orbita ellittica e l'inclinazione dell'eclittica fanno disegnare al Sole un otto, l'analemma.",
    paragrafi: [
      { titolo: "La sfera celeste e le coordinate equatoriali", testo: "Le stelle sono così lontane che le loro direzioni non cambiano, in prima approssimazione, al muoversi della Terra: si possono pensare fissate su una sfera di raggio arbitrario. Il sistema equatoriale proietta sulla sfera l'equatore e i poli terrestri; la declinazione δ è l'altezza sull'equatore celeste, l'ascensione retta α si misura verso est dal punto vernale, l'intersezione fra equatore ed eclittica occupata dal Sole all'equinozio di marzo. Queste coordinate, riferite a un'epoca come J2000, cambiano solo lentamente, per la precessione e per il moto proprio delle stelle, trascurato nella sezione. I pianeti, il Sole e la Luna invece si muovono e le loro coordinate vanno calcolate a ogni istante." },
      { titolo: "Tempo siderale e coordinate orizzontali", testo: "La Terra compie un giro rispetto alle stelle in un giorno siderale, 23 h 56 min 4 s, circa quattro minuti meno del giorno solare medio, perché nel frattempo avanza di quasi un grado lungo l'orbita. Il tempo siderale locale è l'ascensione retta che sta in quel momento sul meridiano; quello di Greenwich si calcola dalla data giuliana con GMST = 280,46061837° + 360,98564736629° (JD − 2451545,0) più piccoli termini correttivi. L'angolo orario di una stella è H = TSL − α. Il passaggio alle coordinate orizzontali, altezza h e azimut A, è una sola rotazione attorno all'asse est-ovest di un angolo 90° − φ: sin h = sin φ sin δ + cos φ cos δ cos H." },
      { titolo: "Levata, culminazione, tramonto", testo: "Una stella culmina sul meridiano con altezza 90° − |φ − δ| e sorge o tramonta quando la sua altezza vale h₀ = −0,567°: la rifrazione atmosferica solleva gli oggetti all'orizzonte di circa 34′. L'angolo orario di levata e tramonto è dato da cos H₀ = (sin h₀ − sin φ sin δ)/(cos φ cos δ). Se il secondo membro è minore di −1 la stella non tramonta mai (circumpolare), se è maggiore di 1 non sorge mai. Da Bari (φ = 41,1° N) sono circumpolari le stelle con δ > 48,9° e invisibili quelle con δ < −48,9°, tolta la piccola correzione di rifrazione. Per il Sole e la Luna si usa un h₀ diverso, che tiene conto del semidiametro apparente." },
      { titolo: "La precessione degli equinozi", testo: "La Luna e il Sole esercitano una coppia sul rigonfiamento equatoriale della Terra, e l'asse terrestre, come quello di una trottola, descrive lentamente un cono attorno al polo dell'eclittica, con apertura pari all'obliquità ε ≈ 23,44° e periodo di circa 25 800 anni (50,29″ all'anno). Il polo celeste si sposta fra le stelle: oggi è vicino alla Polare, all'epoca delle piramidi era vicino a Thuban nel Dragone, fra circa dodicimila anni sarà nei pressi di Vega. Il punto vernale retrocede lungo l'eclittica, per cui le coordinate equatoriali di tutte le stelle cambiano e i cataloghi devono indicare l'epoca. Per questo i segni zodiacali dell'astrologia non coincidono più con le costellazioni da cui prendono il nome. Alla precessione si sovrappone la nutazione, con periodo principale di 18,6 anni." },
      { titolo: "L'equazione del tempo e l'analemma", testo: "Il Sole vero non transita al meridiano sempre alla stessa ora media: la differenza, l'equazione del tempo, va da circa +16,4 minuti all'inizio di novembre a −14,2 minuti a metà febbraio. Ha due cause. L'orbita ellittica fa avanzare il Sole sull'eclittica più in fretta vicino al perielio e più lentamente vicino all'afelio, con un termine di periodo annuale; l'inclinazione dell'eclittica sull'equatore fa sì che anche un moto uniforme lungo l'eclittica si proietti in modo non uniforme in ascensione retta, con un termine semestrale. Fotografando il Sole ogni giorno alla stessa ora media, la sua declinazione dà lo spostamento verticale e l'equazione del tempo quello orizzontale: la figura a otto che ne risulta è l'analemma, asimmetrico perché i due termini hanno ampiezze e fasi diverse." }
    ],
    formule: [
      ["GMST = 280,46061837° + 360,98564736629° · (JD − 2451545,0) + …", "tempo siderale medio di Greenwich in gradi; JD data giuliana (Meeus)"],
      ["H = TSL − α", "angolo orario; TSL tempo siderale locale = GMST + longitudine est"],
      ["sin h = sin φ sin δ + cos φ cos δ cos H", "altezza sull'orizzonte; φ latitudine, δ declinazione"],
      ["tan A = sin H / (cos H sin φ − tan δ cos φ)", "azimut, misurato da sud verso ovest (convenzione di Meeus)"],
      ["cos H₀ = (sin h₀ − sin φ sin δ)/(cos φ cos δ),  h₀ = −0,567°", "angolo orario di levata e tramonto di una stella, con la rifrazione standard"],
      ["P_prec ≈ 1 296 000″ / 50,29″ ≈ 25 800 anni", "periodo della precessione generale in longitudine"]
    ],
    ipotesi: [
      "Coordinate J2000 senza moto proprio, senza aberrazione e senza nutazione: precisione di qualche centesimo di grado fra il 1800 e il 2050.",
      "Rifrazione standard all'orizzonte (34′); vicino all'orizzonte la rifrazione vera dipende da temperatura e pressione e può variare di diversi primi.",
      "Posizioni di Sole, Luna e pianeti con formule a bassa precisione."
    ],
    errori: [
      "Usare il giorno solare invece di quello siderale: in un mese la stessa stella sorge circa due ore prima.",
      "Pensare che la Polare sia la stella più luminosa del cielo o che sia esattamente sul polo: è di seconda magnitudine e oggi dista dal polo circa 0,7°.",
      "Credere che il mezzogiorno vero coincida con le 12 dell'orologio: lo spostano l'equazione del tempo, la longitudine rispetto al meridiano del fuso e l'ora legale."
    ],
    esempio: {
      testo: "Per quante ore Sirio (δ = −16,72°) sta sopra l'orizzonte di Bari (φ = 41,12°)? sin h₀ = sin(−0,567°) = −0,00990; sin φ sin δ = 0,6577 · (−0,2876) = −0,1892; cos φ cos δ = 0,7533 · 0,9577 = 0,7214. Quindi cos H₀ = (−0,00990 + 0,1892)/0,7214 = 0,2485 e H₀ = 75,61°, cioè 5,04 ore di angolo orario. La stella resta visibile per 2H₀ = 10,08 ore siderali, pari a 10,05 ore solari. L'altezza in culminazione è 90° − 41,12° − 16,72°.",
      risultato: "Sirio resta sopra l'orizzonte circa 10 h 03 min e culmina a 32,2° di altezza"
    },
    fonti: [
      "J. Meeus, Astronomical Algorithms, Willmann-Bell, 2ª ed., 1998, capitoli sul tempo siderale, sulla trasformazione delle coordinate, su levata e tramonto, sulla precessione e sull'equazione del tempo",
      "W. M. Smart, Textbook on Spherical Astronomy, Cambridge University Press, 6ª ed. (rivista da R. M. Green), 1977, capitoli sulla sfera celeste, sul tempo e sulla precessione",
      "S. E. Urban, P. K. Seidelmann (a cura di), Explanatory Supplement to the Astronomical Almanac, University Science Books, 3ª ed., 2013, capitoli sui sistemi di riferimento e sul tempo",
      "N. Capitaine, P. T. Wallace, J. Chapront, Expressions for IAU 2000 precession quantities, Astronomy & Astrophysics 412 (2003) 567"
    ],
    collegamenti: ['sastromat', 'sastrosole', 'sfisastro', 'smatgeo']
  };

  /* ── 🌍 Esopianeti 3D ────────────────────────────────────────────────── */
  T['sastroeso'] = {
    titolo: "Esopianeti: zona abitabile, transiti, velocità radiale, immagine diretta e astrometria",
    sintesi: "Un pianeta attorno a un'altra stella è quasi sempre invisibile accanto alla sua stella, e lo si scopre dagli effetti che produce: il calo di luce quando transita davanti al disco, l'oscillazione Doppler della stella attorno al baricentro, lo spostamento della sua posizione in cielo, e, in casi favorevoli, la luce del pianeta stesso. Il bilancio energetico fra luce ricevuta e calore irraggiato fissa la temperatura di equilibrio e la zona abitabile. Oltre seimila pianeti sono oggi confermati.",
    paragrafi: [
      { titolo: "La stella, il pianeta e la zona abitabile", testo: "Un pianeta a distanza d da una stella di luminosità L riceve il flusso S = L/(4πd²). Se assorbe la frazione (1 − A), dove A è l'albedo di Bond, e riemette come corpo nero su tutta la superficie, la temperatura di equilibrio è T_eq = [L(1 − A)/(16πσd²)]^(1/4), che in unità solari diventa 278,6 K · (L/L☉)^(1/4) (1 − A)^(1/4)/√(d/UA). Per la Terra, con A = 0,3, si ottengono 255 K, 33 K meno della temperatura media reale: la differenza è l'effetto serra. La zona abitabile è l'intervallo di distanze in cui un pianeta roccioso con atmosfera di CO₂ e acqua potrebbe avere acqua liquida in superficie; la sezione la delimita fra 1,1 volte il flusso terrestre (effetto serra galoppante) e 0,36 volte (massimo effetto serra), secondo i modelli climatici di Kopparapu e collaboratori: d = √(L/S)." },
      { titolo: "Il metodo dei transiti", testo: "Se l'orbita è vista quasi di taglio, il pianeta passa davanti alla stella e la luce cala della frazione (R_p/R★)²: l'1 % per un pianeta gioviano davanti a una stella come il Sole, 84 parti per milione per un pianeta come la Terra, misurabili solo dallo spazio, come hanno fatto Kepler e TESS. La forma della curva di luce contiene molte informazioni: la durata totale T₁₄ dipende da periodo, raggio stellare, semiasse e parametro d'impatto b; le fasi di ingresso e uscita danno b e il rapporto dei raggi; la curvatura del fondo rivela l'oscuramento al bordo, descritto con la legge quadratica I(μ) = 1 − u₁(1 − μ) − u₂(1 − μ)². La probabilità che un'orbita casuale produca un transito è circa R★/a: lo 0,5 % per un pianeta a 1 UA da una stella solare." },
      { titolo: "La velocità radiale", testo: "Stella e pianeta orbitano attorno al baricentro comune, e la stella si avvicina e si allontana periodicamente. Lo spostamento Doppler delle sue righe spettrali dà la velocità radiale v_r = K[cos(ν + ω) + e cos ω], con semiampiezza K = (2πG/P)^(1/3) m_p sin i /[(M★ + m_p)^(2/3)√(1 − e²)]. Giove fa oscillare il Sole con K ≈ 12,5 m/s, la Terra con appena 0,09 m/s. Il metodo misura m_p sin i, cioè un limite inferiore della massa, perché l'inclinazione è ignota; combinato con il transito, che fissa i e il raggio, dà la massa vera e la densità media del pianeta. Il primo pianeta attorno a una stella di tipo solare, 51 Pegasi b, fu scoperto così nel 1995 da Mayor e Queloz: un gioviano con periodo di 4,2 giorni, un «gioviano caldo» inatteso dai modelli di formazione." },
      { titolo: "Immagine diretta e astrometria", testo: "Vedere direttamente un pianeta significa separarne la debolissima luce da quella della stella. In luce riflessa il contrasto è circa A_g(R_p/a)², con A_g albedo geometrica: circa 4·10⁻⁹ per Giove visto dall'esterno e circa 10⁻¹⁰ per la Terra. Per questo le immagini dirette finora riguardano soprattutto pianeti giovani, caldi e massicci, lontani dalla stella e osservati nell'infrarosso, dove brillano di luce propria, con coronografi e ottica adattiva. L'astrometria misura invece l'oscillazione della posizione della stella in cielo, di ampiezza angolare (m_p/M★)·a/d: Giove sposterebbe il Sole, visto da 10 parsec, di circa mezzo millisecondo d'arco. L'oscillazione si sovrappone alla parallasse annua e al moto proprio, ed è ciò che misura la missione Gaia." },
      { titolo: "Che cosa sappiamo della popolazione", testo: "Ogni metodo ha i suoi effetti di selezione: i transiti e la velocità radiale favoriscono pianeti grandi e vicini alla stella, l'immagine diretta pianeti massicci e lontani, la microlente gravitazionale pianeti a qualche unità astronomica. Corretti questi effetti, emerge che i pianeti sono comuni: una stella tipica ne ha almeno uno, e i più frequenti sono le super-Terre e i sub-Nettuni, assenti nel sistema solare. Il diagramma massa-periodo della sezione è una popolazione illustrativa, costruita per mostrare questi gruppi, non un catalogo reale. Abitabilità e presenza di vita sono questioni aperte: essere nella zona abitabile è una condizione necessaria secondo i modelli, non una prova di acqua liquida." }
    ],
    formule: [
      ["T_eq = 278,6 K · (L/L☉)^(1/4) (1 − A)^(1/4) / √(d/UA)", "temperatura di equilibrio con ridistribuzione completa del calore; A albedo di Bond"],
      ["d_ZA = √[(L/L☉)/S_eff] UA", "confine della zona abitabile per un flusso efficace S_eff in unità del flusso terrestre (1,1 e 0,36 nella sezione)"],
      ["ΔF/F ≈ (R_p/R★)²", "profondità del transito, senza oscuramento al bordo"],
      ["T₁₄ = (P/π) arcsin[(R★/a)√((1+k)² − b²)/sin i]", "durata totale del transito per orbita circolare; k = R_p/R★, b parametro d'impatto"],
      ["K = (2πG/P)^(1/3) m_p sin i / [(M★ + m_p)^(2/3) √(1 − e²)]", "semiampiezza della velocità radiale della stella"],
      ["C ≈ A_g (R_p/a)²,  θ_astr = (m_p/M★)(a/d)", "contrasto in luce riflessa all'elongazione massima e ampiezza dell'oscillazione astrometrica (a in UA e d in pc danno secondi d'arco)"]
    ],
    ipotesi: [
      "Orbite kepleriane di un solo pianeta; stella di sequenza principale con luminosità e raggio dalle relazioni empiriche medie.",
      "Temperatura di equilibrio senza effetto serra e con ridistribuzione uniforme del calore; i limiti della zona abitabile dipendono dal modello climatico e dalla massa del pianeta.",
      "Il diagramma massa-periodo è una popolazione illustrativa, non dati reali."
    ],
    errori: [
      "Confondere la temperatura di equilibrio con la temperatura superficiale: per Venere la prima è di circa 230 K, la seconda di circa 735 K.",
      "Prendere la massa ottenuta dalla sola velocità radiale come massa vera: è m_p sin i, un limite inferiore.",
      "Pensare che un pianeta nella zona abitabile sia abitabile o abitato: è solo la regione in cui l'acqua liquida è compatibile con il flusso ricevuto."
    ],
    esempio: {
      testo: "Si confrontino Giove e la Terra osservati da lontano attorno al Sole. Profondità del transito: (71 492/695 700)² = 0,01056 per Giove e (6371/695 700)² = 8,4·10⁻⁵ per la Terra. Per un transito centrale della Terra T₁₄ ≈ (365,25 d/π) arcsin[(695 700/1,496·10⁸)(1 + 0,00916)] = 0,546 d. Velocità radiale: con P = 11,86 anni e m_p = 1,898·10²⁷ kg, K = (2πG/P)^(1/3) m_p/M☉^(2/3) = 12,5 m/s; per la Terra 0,089 m/s. Temperatura di equilibrio della Terra con A = 0,3: 278,6 · 0,7^(1/4) = 254,8 K.",
      risultato: "Giove: profondità 1,06 %, K ≈ 12,5 m/s; Terra: 84 ppm, transito di circa 13,1 h, K ≈ 0,09 m/s, T_eq ≈ 255 K"
    },
    fonti: [
      "S. Seager (a cura di), Exoplanets, University of Arizona Press, 2010, in particolare J. N. Winn, Transits and occultations, e i capitoli sulla velocità radiale e sull'immagine diretta",
      "M. Perryman, The Exoplanet Handbook, Cambridge University Press, 2ª ed., 2018, capitoli sui metodi di rivelazione e sulla zona abitabile",
      "R. K. Kopparapu et al., Habitable zones around main-sequence stars: new estimates, Astrophysical Journal 765 (2013) 131",
      "M. Mayor, D. Queloz, A Jupiter-mass companion to a solar-type star, Nature 378 (1995) 355"
    ],
    collegamenti: ['sfisastro', 'sastrostelle', 'sastromat', 'sastrosole']
  };

  /* ── ☁️ Nube interstellare ───────────────────────────────────────────── */
  T['snubeism'] = {
    titolo: "Chimica di una nube interstellare: la transizione H → H₂ e la formazione del monossido di carbonio",
    sintesi: "Nel mezzo interstellare le molecole nascono e muoiono in competizione: l'idrogeno molecolare si forma sulla superficie dei grani di polvere e viene distrutto dalla luce ultravioletta delle stelle. Dentro una nube la polvere e le stesse molecole fanno da schermo, e oltre una certa profondità l'idrogeno diventa molecolare. Il carbonio passa da C⁺ a CO ancora più in profondità. Ne risulta la struttura a strati delle regioni di fotodissociazione, e un gas molecolare che le mappe in CO non vedono.",
    paragrafi: [
      { titolo: "Il mezzo interstellare", testo: "Lo spazio fra le stelle contiene gas, per il 70 % circa in massa idrogeno, e polvere, circa l'1 % della massa del gas, con densità che vanno da meno di una particella per centimetro cubo nel mezzo caldo a 10⁴–10⁶ nelle zone dense delle nubi molecolari. Le nubi sono illuminate da un campo ultravioletto prodotto dalle stelle calde, misurato in unità del campo medio locale (unità di Habing o di Draine, che differiscono di un fattore 1,7 circa). La polvere assorbe e diffonde la luce: l'estinzione visuale A_V, in magnitudini, è proporzionale alla colonna di idrogeno, con N_H ≈ 1,9·10²¹ cm⁻² per magnitudine. A_V è quindi la misura naturale della profondità all'interno di una nube." },
      { titolo: "Come si forma l'idrogeno molecolare", testo: "Due atomi di idrogeno che si incontrano in fase gassosa non possono legarsi, perché non hanno modo di liberarsi dell'energia di legame di 4,5 eV: la molecola omonucleare H₂ non ha momento di dipolo e la radiazione per transizioni vibrazionali è lentissima. Sulla superficie di un grano di polvere invece un atomo resta adsorbito, incontra un altro atomo e il grano assorbe l'energia in eccesso. La velocità di formazione è R = k_gr n n(H), con k_gr ≈ 3·10⁻¹⁷ (T/100 K)^(1/2) cm³/s, valore ricavato dalle osservazioni nell'ultravioletto. Ne segue un tempo caratteristico 1/(2k_gr n) dell'ordine di 10⁹/n anni: lento nelle nubi diffuse, rapido in quelle dense." },
      { titolo: "Fotodissociazione e autoschermatura", testo: "L'idrogeno molecolare viene distrutto quasi soltanto in due passi: assorbe un fotone ultravioletto in una delle righe delle bande di Lyman e Werner, fra 91,2 e 110,8 nm, e nel 10–15 % dei casi decade in un livello vibrazionale del continuo e si dissocia. Senza schermo il tasso è dell'ordine di qualche 10⁻¹¹ s⁻¹ nel campo interstellare medio. Due effetti lo riducono all'interno della nube: la polvere, con un fattore e^(−3,74 A_V) nella forma usata nella sezione, e soprattutto l'autoschermatura: poiché la distruzione avviene in righe, le molecole superficiali assorbono i fotoni proprio a quelle lunghezze d'onda, e quelle più interne non li ricevono più. Draine e Bertoldi (1996) hanno dato una formula analitica per il fattore di schermo in funzione della colonna di H₂, usata qui." },
      { titolo: "Il carbonio: da C⁺ a CO", testo: "Il carbonio ha un potenziale di ionizzazione di 11,26 eV, inferiore ai 13,6 eV dell'idrogeno, e nelle zone esterne delle nubi è ionizzato. La sua chimica in fase gassosa procede con reazioni ione-molecola veloci: C⁺ reagisce con H₂ formando idrocarburi CHₓ, che reagendo con l'ossigeno danno CO, mentre la luce ultravioletta distrugge sia gli intermedi sia il CO. Lo schema ridotto di Nelson e Langer (1997) riassume questa rete in due passaggi efficaci, ed è quello integrato nella sezione insieme all'equazione dell'H₂. Poiché il CO non si scherma in modo efficiente come l'H₂ (la sezione lo trascura del tutto) e richiede l'H₂ come reagente, la transizione C⁺ → CO avviene a profondità maggiori, tipicamente a A_V di qualche unità." },
      { titolo: "La struttura a strati e il gas «oscuro al CO»", testo: "Integrando nel tempo le due equazioni a diverse profondità si ottiene il risultato classico delle regioni di fotodissociazione: andando dall'esterno verso l'interno si incontra prima idrogeno atomico con C⁺, poi idrogeno molecolare con C⁺ e carbonio neutro, infine H₂ con CO. Lo strato intermedio è importante per gli astronomi, perché le nubi molecolari si mappano con le righe rotazionali del CO, molto più facili da osservare di quelle dell'H₂ freddo: il gas molecolare senza CO sfugge a queste mappe, e se ne stima la quantità con la riga del C⁺ a 158 μm e con i raggi gamma. Il modello della sezione è a zero dimensioni, con coefficienti arrotondati: dà gli ordini di grandezza e la sequenza degli strati, non le abbondanze di una nube reale." }
    ],
    formule: [
      ["d n(H₂)/dt = k_gr n n(H) − Γ n(H₂)", "bilancio dell'idrogeno molecolare; n densità totale di nuclei di H (cm⁻³), Γ tasso di fotodissociazione (s⁻¹)"],
      ["k_gr ≈ 3·10⁻¹⁷ (T/100 K)^(1/2) cm³/s", "coefficiente di formazione di H₂ sui grani"],
      ["t_H₂ = 1/(2 k_gr n)", "tempo caratteristico di formazione di H₂"],
      ["f_eq = 2k_gr n / (2k_gr n + Γ)", "frazione di idrogeno in forma molecolare all'equilibrio, se Γ non dipende da f"],
      ["Γ = Γ₀ G₀ e^(−3,74 A_V) f_sch(N_H₂) + ζ", "fotodissociazione attenuata da polvere e autoschermatura, più i raggi cosmici ζ"],
      ["N_H ≈ 1,87·10²¹ cm⁻² · A_V", "relazione fra colonna di idrogeno ed estinzione visuale (Bohlin, Savage e Drake)"]
    ],
    ipotesi: [
      "Modello a zero dimensioni: densità e temperatura uniformi, campo ultravioletto attenuato da una sola profondità A_V, nessun trasporto radiativo vero.",
      "Rete chimica ridotta a due specie con coefficienti di letteratura arrotondati; nessuna autoschermatura del CO, nessun congelamento delle molecole sui grani.",
      "Il campo G₀ della sezione è normalizzato al campo di Draine, coerente con il tasso Γ₀ = 5,8·10⁻¹¹ s⁻¹ usato."
    ],
    errori: [
      "Pensare che H₂ si formi facilmente in fase gassosa: senza un terzo corpo che porti via l'energia, la reazione H + H è praticamente impossibile alle densità interstellari.",
      "Usare il CO come tracciante perfetto dell'H₂: dove il carbonio è ancora C⁺ l'idrogeno può essere già molecolare.",
      "Confondere l'estinzione A_V, in magnitudini, con una distanza: è una colonna di polvere, che dipende anche dalla densità."
    ],
    esempio: {
      testo: "Tempo di formazione di H₂ in una nube con n = 100 cm⁻³ e T = 50 K. Il coefficiente vale k_gr = 3·10⁻¹⁷ · √(50/100) = 2,12·10⁻¹⁷ cm³/s. Quindi t = 1/(2 · 2,12·10⁻¹⁷ cm³/s · 100 cm⁻³) = 2,36·10¹⁴ s, che divisi per 3,156·10⁷ s all'anno danno il risultato. A n = 10⁴ cm⁻³ il tempo scenderebbe a meno di centomila anni.",
      risultato: "t_H₂ ≈ 7,5·10⁶ anni, coerente con la stima ~10⁹/n anni"
    },
    fonti: [
      "A. G. G. M. Tielens, The Physics and Chemistry of the Interstellar Medium, Cambridge University Press, 2005, capitoli sulla chimica interstellare e sulle regioni di fotodissociazione",
      "B. T. Draine, Physics of the Interstellar and Intergalactic Medium, Princeton University Press, 2011, capitoli sull'idrogeno molecolare e sulle regioni di fotodissociazione",
      "B. T. Draine, F. Bertoldi, Structure of stationary photodissociation fronts, Astrophysical Journal 468 (1996) 269",
      "R. P. Nelson, W. D. Langer, The dynamics of low-mass molecular clouds in external radiation fields, Astrophysical Journal 482 (1997) 796",
      "R. C. Bohlin, B. D. Savage, J. F. Drake, A survey of interstellar H I from Lα absorption measurements II, Astrophysical Journal 224 (1978) 132"
    ],
    collegamenti: ['schicinet', 'sastrostelle', 'ssaha', 'smol']
  };

  /* ── 🌡️ Saha e classi spettrali ──────────────────────────────────────── */
  T['ssaha'] = {
    titolo: "Le equazioni di Boltzmann e di Saha e l'origine delle classi spettrali",
    sintesi: "Le righe di assorbimento di una stella dipendono più dalla temperatura che dalla composizione. Per assorbire una riga un atomo deve trovarsi nello stato di ionizzazione giusto (equazione di Saha) e nel livello di partenza giusto (equazione di Boltzmann). Il prodotto delle due frazioni spiega perché le righe di Balmer dell'idrogeno sono massime nelle stelle di classe A, attorno ai 10 000 K, e perché nel Sole le righe del calcio ionizzato superano quelle dell'idrogeno, molto più abbondante.",
    paragrafi: [
      { titolo: "L'equazione di Boltzmann", testo: "All'equilibrio termodinamico locale il rapporto fra il numero di atomi in due livelli eccitati dello stesso stato di ionizzazione è N_b/N_a = (g_b/g_a)e^(−(E_b − E_a)/kT), con g le degenerazioni. Per l'idrogeno il livello n ha degenerazione 2n², per cui g₂/g₁ = 4, e l'energia di eccitazione da n = 1 a n = 2 è 10,2 eV. Anche a 10 000 K kT vale appena 0,86 eV, e la frazione in n = 2 resta piccolissima, circa 2,6·10⁻⁵ a 9900 K. Ma è proprio da n = 2 che partono le righe di Balmer, nel visibile: senza atomi in n = 2 le righe non si formano. Riscaldando, la frazione in n = 2 cresce esponenzialmente." },
      { titolo: "L'equazione di Saha", testo: "La ionizzazione è un equilibrio fra atomi, ioni ed elettroni liberi, e Saha (1920) ne ottenne la costante applicando la meccanica statistica: N_II/N_I = (2Z_II/(n_e Z_I))(2πm_ekT/h²)^(3/2) e^(−χ/kT), dove χ è l'energia di ionizzazione, Z le funzioni di partizione e n_e la densità di elettroni, che si può scrivere come P_e/kT. Il fattore (2πm_ekT/h²)^(3/2), dell'ordine di 10²⁷ m⁻³, conta gli stati disponibili per l'elettrone libero ed è enorme rispetto alla densità degli elettroni nelle atmosfere stellari: per questo l'idrogeno si ionizza a temperature dieci-quindici volte inferiori a χ/k = 158 000 K, e il passaggio da neutro a ionizzato avviene in poche migliaia di kelvin." },
      { titolo: "Perché le righe di Balmer hanno un massimo", testo: "La forza delle righe di Balmer è proporzionale al numero di atomi neutri di idrogeno nel livello n = 2, cioè al prodotto di due frazioni che variano in senso opposto con la temperatura. La frazione eccitata cresce (Boltzmann); la frazione ancora neutra crolla quando l'idrogeno si ionizza (Saha). Il prodotto ha un massimo stretto, che per una pressione elettronica di 20 Pa, tipica delle fotosfere, cade a circa 9900 K: le stelle di classe A, come Vega e Sirio, hanno le righe di Balmer più intense. Nelle stelle più calde l'idrogeno è quasi tutto ionizzato e le righe si indeboliscono, in quelle più fredde è quasi tutto nel livello fondamentale. Il massimo si sposta con la pressione, cioè con la gravità superficiale: è il principio delle classi di luminosità." },
      { titolo: "Il Sole: calcio contro idrogeno", testo: "Nello spettro solare le righe H e K del calcio ionizzato sono le più forti, molto più delle righe di Balmer, anche se il Sole contiene circa un atomo di calcio ogni 500 000 di idrogeno. L'equazione di Saha spiega il paradosso. Il calcio ha un potenziale di ionizzazione basso, 6,11 eV, e a 5777 K è quasi tutto Ca II; le righe H e K partono dal livello fondamentale dello ione, dove si trova la grande maggioranza degli ioni. L'idrogeno invece è quasi tutto neutro, ma solo circa 5 atomi su un miliardo sono in n = 2. Il rapporto fra i due numeri di assorbitori favorisce il calcio di qualche centinaio di volte. Questo ragionamento, sviluppato da Cecilia Payne nel 1925, mostrò che le stelle sono fatte soprattutto di idrogeno, contro l'opinione prevalente dell'epoca." },
      { titolo: "Le classi spettrali", testo: "La sequenza O, B, A, F, G, K, M, nata come classificazione empirica delle righe, è quindi una sequenza di temperatura. Le stelle O, sopra i 30 000 K, mostrano righe di elio ionizzato; le B, elio neutro; le A, idrogeno al massimo; le F e G, metalli ionizzati come il Ca II; le K, metalli neutri; le M, sotto i 3700 K, bande di molecole come l'ossido di titanio, che sopravvivono solo in atmosfere fredde. Ogni classe è divisa in sottoclassi da 0 a 9, e il Sole è una G2. A queste si aggiungono le classi L, T e Y delle nane brune. La composizione chimica delle stelle è invece sorprendentemente uniforme, con differenze nella metallicità che si leggono su questa base." }
    ],
    formule: [
      ["N_b/N_a = (g_b/g_a) e^(−(E_b − E_a)/kT)", "equazione di Boltzmann fra due livelli; g degenerazioni (2n² per l'idrogeno)"],
      ["N_II/N_I = (2kT Z_II /(P_e Z_I)) (2π m_e kT/h²)^(3/2) e^(−χ/kT)", "equazione di Saha con la pressione elettronica P_e = n_e kT; χ energia di ionizzazione, Z funzioni di partizione"],
      ["N₂/N_tot = [N₂/(N₁ + N₂)] · [N_I/(N_I + N_II)]", "frazione di idrogeno capace di assorbire le righe di Balmer (approssimazione a due livelli)"],
      ["χ_H = 13,6 eV,  E₂ − E₁ = 10,2 eV,  χ_Ca = 6,11 eV", "energie in gioco per idrogeno e calcio"]
    ],
    ipotesi: [
      "Equilibrio termodinamico locale e gas di solo idrogeno per la ionizzazione: nelle atmosfere vere gli elettroni vengono anche dai metalli, che a basse temperature ne sono la fonte principale.",
      "Pressione elettronica fissata dall'utente, non calcolata da un modello di atmosfera; solo i primi livelli nelle funzioni di partizione.",
      "Intensità delle righe proporzionale al numero di assorbitori, senza trasporto radiativo né curva di crescita."
    ],
    errori: [
      "Concludere da righe di Balmer deboli che una stella contiene poco idrogeno: nelle stelle calde e fredde l'idrogeno c'è, ma non è nel livello giusto.",
      "Aspettarsi che l'idrogeno si ionizzi quando kT ≈ 13,6 eV: avviene già a circa 10 000 K, per il grande peso statistico degli elettroni liberi.",
      "Dimenticare il fattore 2 di spin dell'elettrone libero e le funzioni di partizione nell'equazione di Saha."
    ],
    esempio: {
      testo: "Frazione di idrogeno ionizzato a T = 9600 K con P_e = 20 Pa, Z_I = 2, Z_II = 1. Il fattore 2kT/P_e vale 1,325·10⁻²⁰ m³; il fattore (2πm_ekT/h²)^(3/2) vale 2,271·10²⁷ m⁻³; χ/kT = 13,6 eV/0,8273 eV = 16,44, da cui e^(−16,44) = 7,25·10⁻⁸. Allora N_II/N_I = 1,325·10⁻²⁰ · 0,5 · 2,271·10²⁷ · 7,25·10⁻⁸ = 1,09, e la frazione ionizzata è 1,09/(1 + 1,09).",
      risultato: "circa il 52 % dell'idrogeno è ionizzato: a 20 Pa la metà della ionizzazione cade poco sotto i 9600 K"
    },
    fonti: [
      "B. W. Carroll, D. A. Ostlie, An Introduction to Modern Astrophysics, Cambridge University Press, 2ª ed., 2017, cap. 8 (classificazione degli spettri stellari, equazioni di Boltzmann e di Saha)",
      "D. F. Gray, The Observation and Analysis of Stellar Photospheres, Cambridge University Press, 3ª ed., 2005, capitolo sulle popolazioni dei livelli e sulla ionizzazione",
      "M. N. Saha, Ionization in the solar chromosphere, Philosophical Magazine 40 (1920) 472",
      "C. H. Payne, Stellar Atmospheres, tesi di dottorato, Harvard College Observatory Monograph n. 1, 1925"
    ],
    collegamenti: ['sfisastro', 'sastrostelle', 'sfisstat', 'sspec', 'snubeism']
  };

})(typeof window !== 'undefined' ? window : globalThis);
