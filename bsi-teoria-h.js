/* bsi-teoria-h.js — teoria delle sezioni (lotto H, v255). BioSpecInfo · © Samuele Pio Provenzano */
(function (g) {
  'use strict';
  var T = g.BSITeoriaDati = g.BSITeoriaDati || {};

  /* ═══ 🔮 Laboratorio degli orbitali ═══════════════════════════════════════ */
  T['sorbitali'] = {
    titolo: "Gli orbitali dell'atomo di idrogeno dalla soluzione esatta",
    sintesi: "L'equazione di Schrödinger dell'atomo di idrogeno si risolve esattamente: le soluzioni stazionarie sono prodotti di una parte radiale e di un'armonica sferica, etichettati da tre numeri quantici n, l, m. Un orbitale non è una traiettoria ma un'onda complessa: il suo modulo al quadrato è la densità di probabilità, la sua fase gira nel tempo e, se m non è zero, anche attorno all'asse, trasportando una corrente di probabilità.",
    paragrafi: [
      { titolo: "La soluzione e i numeri quantici", testo: "Per un elettrone in un potenziale coulombiano le variabili si separano in coordinate sferiche: ψ(r, θ, φ) = R_nl(r)·Y_l^m(θ, φ). La parte radiale contiene un polinomio di Laguerre associato e un esponenziale decrescente; l'armonica sferica contiene un polinomio di Legendre associato e il fattore e^(imφ). Il numero principale n fissa l'energia, E_n = −13,6 eV·Z²/n², l va da 0 a n − 1 e fissa il momento angolare, m va da −l a +l e fissa la sua componente lungo z." },
      { titolo: "Nodi, raggio medio e distribuzione radiale", testo: "La probabilità di trovare l'elettrone fra r e r + dr è P(r) dr = r²R²(r) dr: per questo il 1s ha il massimo a un raggio di Bohr anche se ψ è massima nel nucleo. Gli orbitali hanno n − l − 1 nodi radiali, sfere dove ψ cambia segno, e l nodi angolari, piani o coni. Il raggio medio vale ⟨r⟩ = [3n² − l(l + 1)]/(2Z) a₀ e cresce come n²." },
      { titolo: "Forme reali e forme complesse", testo: "Le forme che si disegnano nei libri, px, py, dxy, sono combinazioni reali delle soluzioni con m e −m. Una funzione reale ha fase costante a meno del segno, quindi non trasporta corrente: la densità è ferma. Le forme complesse con m diverso da zero hanno invece la fase mφ che gira attorno all'asse z: la densità è simmetrica attorno all'asse, ma la corrente J = (ħ/mₑ)·Im(ψ*∇ψ) scorre lungo φ con velocità ħm/(mₑ r sin θ)." },
      { titolo: "Stati stazionari e sovrapposizioni", testo: "Ogni soluzione evolve nel tempo come ψ·e^(−iEt/ħ): la fase ruota ma il modulo resta lo stesso, per questo si chiama stato stazionario. Se si sovrappongono due livelli di energie diverse, il termine di interferenza oscilla alla frequenza (E₂ − E₁)/h: la densità si sposta davvero. È la stessa frequenza della luce emessa nella transizione, e se Δl = ±1 la carica oscilla come un dipolo che irraggia." },
      { titolo: "Dall'atomo alla molecola: H₂⁺", testo: "Il metodo LCAO approssima l'orbitale molecolare dello ione H₂⁺ come somma o differenza delle due funzioni 1s centrate sui nuclei. La somma accumula densità fra i nuclei e lega, la differenza ha un piano nodale a metà e antilega. L'integrale di sovrapposizione S(R) = e^(−R)(1 + R + R²/3) misura quanto le due funzioni si coprono; il modello dà la forma giusta ma sottostima l'energia di legame." }
    ],
    formule: [
      ["ψ_nlm(r, θ, φ) = R_nl(r) · Y_l^m(θ, φ)", "separazione delle variabili per l'atomo idrogenoide; R parte radiale, Y armonica sferica"],
      ["E_n = −13,6 eV · Z²/n²", "energia del livello n per un atomo con un solo elettrone e carica nucleare Z"],
      ["⟨r⟩ = [3n² − l(l + 1)]/(2Z) a₀", "raggio medio dell'orbitale in raggi di Bohr, a₀ = 52,9 pm"],
      ["J = (ħ/mₑ) Im(ψ*∇ψ) = ħm|ψ|²/(mₑ r sin θ) φ̂", "corrente di probabilità della forma complessa, diretta attorno all'asse z"],
      ["ν = (E₂ − E₁)/h", "frequenza dell'oscillazione della densità in una sovrapposizione di due livelli"]
    ],
    ipotesi: [
      "Nucleo puntiforme e fermo, interazione solo coulombiana, nessun effetto relativistico né spin: la struttura fine sposta i livelli di parti su diecimila.",
      "Per Z maggiore di 1 le formule valgono per ioni con un solo elettrone; negli atomi con più elettroni gli altri schermano il nucleo e le energie cambiano."
    ],
    errori: [
      "Pensare che l'elettrone percorra la superficie dell'orbitale: l'isosuperficie racchiude solo il 90 % della probabilità.",
      "Confondere il massimo di |ψ|² (nel nucleo per il 1s) con il raggio più probabile (il massimo di r²R²).",
      "Credere che px e p con m = +1 siano la stessa cosa: hanno la stessa energia ma la prima è reale e ferma, la seconda complessa e con corrente."
    ],
    esempio: {
      testo: "Quanto vale la frequenza con cui oscilla la densità in una sovrapposizione di 1s e 2p dell'idrogeno, e che luce corrisponde? ΔE = 13,6 eV · (1 − 1/4) = 10,2 eV; ν = ΔE/h = 10,2 eV / 4,1357×10⁻¹⁵ eV·s.",
      risultato: "ν ≈ 2,47×10¹⁵ Hz, λ = c/ν ≈ 121,5 nm (riga Lyman-α)"
    },
    fonti: [
      "D. J. Griffiths, Introduction to Quantum Mechanics, 3ª ed., Cambridge University Press, 2018, cap. 4 (l'atomo di idrogeno)",
      "B. H. Bransden, C. J. Joachain, Physics of Atoms and Molecules, 2ª ed., Prentice Hall, 2003, cap. 3",
      "P. Atkins, J. de Paula, Chimica fisica, Zanichelli, capitoli sulla struttura atomica e sul legame (LCAO)"
    ],
    collegamenti: ['sschrod', 'smo', 'shf']
  };

  /* ═══ 🌞 L'eliosfera ═══════════════════════════════════════════════════════ */
  T['sastroelio'] = {
    titolo: "Il vento solare e i confini dell'eliosfera",
    sintesi: "Il Sole emette continuamente un vento di plasma che viaggia a 300–800 km/s e porta con sé il campo magnetico, avvolto in una spirale dalla rotazione solare. Il vento rallenta bruscamente allo shock di terminazione, scorre nell'eliosheath e si ferma all'eliopausa, dove incontra il gas interstellare. Le due sonde Voyager hanno attraversato entrambi i confini fra il 2004 e il 2018.",
    paragrafi: [
      { titolo: "Il vento solare e la spirale di Parker", testo: "La corona solare è così calda che il gas non resta legato e si espande in un vento supersonico, previsto da Parker nel 1958. Il campo magnetico è congelato nel plasma: mentre il vento va in direzione radiale, la base delle linee di campo ruota con il Sole, e le linee si avvolgono in una spirale di Archimede. L'angolo con la direzione radiale vale tan ψ = Ωr/v, circa 45° all'orbita della Terra." },
      { titolo: "Lo shock di terminazione", testo: "La pressione dinamica del vento ρv² cala come 1/r². A una certa distanza diventa paragonabile alla pressione dell'ambiente esterno e il vento, ancora supersonico, deve rallentare: lo fa con un'onda d'urto, lo shock di terminazione. Voyager 1 l'ha attraversato nel dicembre 2004 a 94 UA, Voyager 2 nell'agosto 2007 a circa 84 UA, più volte in pochi giorni perché lo shock si muove." },
      { titolo: "Eliosheath ed eliopausa", testo: "Oltre lo shock il vento è subsonico, caldo e compresso, e viene piegato verso la coda: è l'eliosheath. L'eliopausa è la superficie dove la pressione del vento e quella del mezzo interstellare si bilanciano; fuori c'è il plasma della galassia. Voyager 1 l'ha attraversata nel 2012 a 121,6 UA, Voyager 2 nel 2018 a 119 UA: i raggi cosmici galattici sono saliti di colpo e la densità del plasma di circa quaranta volte." },
      { titolo: "Il mezzo interstellare e IBEX", testo: "Il Sole si muove nella nube interstellare locale a circa 26 km/s. Gli atomi neutri attraversano l'eliosfera e ne rivelano la direzione e la velocità; la sonda IBEX ha mappato gli atomi neutri energetici che nascono ai confini e ha scoperto un nastro inatteso allineato con il campo magnetico interstellare. Se davanti all'eliosfera ci sia un vero bow shock o solo un'onda di prua è ancora discusso." },
      { titolo: "Forma e modelli", testo: "La forma più semplice è quella di un semicorpo di Rankine, una sorgente in una corrente uniforme: davanti un naso arrotondato, dietro una coda. Le Voyager però hanno toccato i confini in due soli punti, e l'eliosfera vera è asimmetrica, schiacciata a sud. Sulla coda i modelli non concordano: alcuni la vogliono lunghissima, altri corta e divisa in due lobi." }
    ],
    formule: [
      ["tan ψ = Ω r cos λ / v", "angolo della spirale di Parker: Ω velocità angolare del Sole, r distanza, λ latitudine, v velocità del vento"],
      ["r_TS ≈ r₁ √(ρ₁ v² / P)", "stima della distanza dello shock di terminazione dall'equilibrio fra pressione dinamica del vento e pressione esterna P"],
      ["r(α) = R₀ / cos(α/2)", "eliopausa del semicorpo di Rankine in funzione dell'angolo α dal naso; la coda tende a un raggio 2R₀"]
    ],
    ipotesi: [
      "Vento radiale e costante, Sole che ruota rigidamente: il vento vero ha flussi lenti e veloci che si scontrano.",
      "La stima dello shock ignora gli ioni raccolti dal gas neutro e il salto di pressione allo shock: è un ordine di grandezza."
    ],
    errori: [
      "Pensare che l'eliopausa sia il confine del sistema solare: la nube di Oort, legata gravitazionalmente al Sole, si estende ben oltre.",
      "Credere che le Voyager abbiano lasciato il sistema solare: hanno lasciato la bolla del vento solare.",
      "Trattare la forma disegnata delle superfici come una misura: è un modello vincolato da pochi punti."
    ],
    esempio: {
      testo: "Con 5 protoni per centimetro cubo a 1 UA e un vento a 400 km/s, quale pressione esterna mette lo shock a 94 UA? ρv² a 1 UA = 5×10⁶ · 1,67×10⁻²⁷ kg · (4×10⁵ m/s)² = 1,34×10⁻⁹ Pa; diviso per 94².",
      risultato: "P ≈ 1,5×10⁻¹³ Pa"
    },
    fonti: [
      "E. N. Parker, Dynamics of the interplanetary gas and magnetic fields, Astrophysical Journal 128 (1958) 664",
      "E. C. Stone et al., Voyager 1 explores the termination shock region, Science 309 (2005) 2017; Voyager 1 observes low-energy galactic cosmic rays, Science 341 (2013) 150",
      "D. J. McComas et al., Global observations of the interstellar interaction from IBEX, Science 326 (2009) 959"
    ],
    collegamenti: ['sastrosole', 'sfisastro', 'sastrooscura']
  };

  /* ═══ 🌑 Materia oscura e lenti gravitazionali ════════════════════════════ */
  T['sastrooscura'] = {
    titolo: "La materia oscura, la rete cosmica e le lenti gravitazionali",
    sintesi: "Circa l'85 % della materia dell'universo non emette luce: la si vede solo dai suoi effetti gravitazionali. Le galassie ruotano troppo in fretta per la massa visibile, la luce di sorgenti lontane si piega attorno agli ammassi formando archi e anelli, e la distribuzione delle galassie su grande scala segue una rete di filamenti nata da piccole fluttuazioni iniziali cresciute per gravità.",
    paragrafi: [
      { titolo: "Le prove", testo: "Le curve di rotazione delle galassie restano piatte fino a decine di kiloparsec, mentre la sola massa di stelle e gas le farebbe scendere come prevede Keplero (Rubin e Ford 1970). Negli ammassi la massa misurata con le lenti e con il gas caldo supera di molte volte quella delle galassie. Le fluttuazioni della radiazione cosmica di fondo misurate da Planck richiedono materia che non interagisce con la luce." },
      { titolo: "La rete cosmica", testo: "Le piccole differenze di densità dell'universo primordiale crescono per gravità secondo il fattore di crescita lineare D(a). Nell'approssimazione di Zel'dovich ogni elemento di materia si sposta di D(a)ψ(q) dalla sua posizione iniziale: lo spostamento comprime prima in pareti, poi in filamenti, poi in nodi. I nodi diventano gli aloni dove si formano gli ammassi di galassie; le simulazioni a N corpi seguono la fase non lineare." },
      { titolo: "La lente gravitazionale", testo: "La massa curva lo spaziotempo e devia la luce di un angolo α. Una sorgente in posizione β appare nella posizione θ data dall'equazione della lente, β = θ − α(θ). Se sorgente, lente e osservatore sono allineati la sorgente diventa un anello di Einstein; se sono quasi allineati si vedono archi e due o quattro immagini amplificate. Il raggio di Einstein di una galassia è di circa un secondo d'arco, quello di un ammasso di decine." },
      { titolo: "Curve critiche e caustiche", testo: "L'amplificazione μ = 1/det(∂β/∂θ) diverge sulle curve critiche nel piano della lente; la loro immagine nel piano della sorgente sono le caustiche. Quando la sorgente attraversa una caustica due immagini nascono o muoiono insieme sulla curva critica: per questo le lenti forti mostrano un numero dispari di immagini, una delle quali di solito troppo debole per vederla." },
      { titolo: "Fisica e apprendimento automatico", testo: "Modellare una lente con un fit sul χ² è preciso ma lento. Una rete neurale addestrata su lenti simulate può stimare i parametri in millisecondi; il fit fisico parte poi dalla sua stima e la verifica. È lo schema proposto da Hezaveh, Perreault Levasseur e Marshall nel 2017: la rete impara solo ciò che il modello di simulazione contiene, quindi la fisica resta il giudice." }
    ],
    formule: [
      ["β = θ − α(θ)", "equazione della lente: β posizione vera della sorgente, θ posizione apparente, α angolo di deflessione ridotto"],
      ["θ_E = 4π (σ_v/c)² D_ls / D_s", "raggio di Einstein di una sfera isoterma singolare con dispersione di velocità σ_v; D distanze di diametro angolare"],
      ["μ = 1 / det(∂β/∂θ)", "amplificazione di un'immagine; diverge sulle curve critiche"],
      ["x = q + D(a) ψ(q),  ∇·ψ = −δ", "approssimazione di Zel'dovich: posizione al tempo a di un elemento partito da q, con il campo di spostamento legato al contrasto di densità"],
      ["v²(R) = v²_disco(R) + v²_alone(R)", "curva di rotazione come somma in quadratura dei contributi del disco e dell'alone"]
    ],
    ipotesi: [
      "Cosmologia ΛCDM piatta con i parametri di Planck 2018; lente sottile, angoli piccoli, campo gravitazionale debole.",
      "L'approssimazione di Zel'dovich vale fino all'incrocio delle orbite; dopo servono simulazioni a N corpi."
    ],
    errori: [
      "Pensare che la materia oscura sia materia normale non illuminata: gas e stelle spente sono già contati, e non bastano.",
      "Credere che le lenti ingrandiscano come una lente di vetro con un fuoco: una lente gravitazionale non ha un unico fuoco, ha curve critiche e caustiche.",
      "Fidarsi della rete neurale senza il fit fisico: fuori dai casi su cui è stata addestrata può sbagliare con sicurezza."
    ],
    esempio: {
      testo: "Una galassia ellittica con σ_v = 200 km/s a redshift 0,5 fa da lente a una sorgente a redshift 2. Con le distanze di Planck, D_ls/D_s ≈ 0,51; 4π(200/299 792)² = 5,59×10⁻⁶ radianti.",
      risultato: "θ_E ≈ 0,73 secondi d'arco"
    },
    fonti: [
      "P. Schneider, J. Ehlers, E. E. Falco, Gravitational Lenses, Springer, 1992",
      "Planck Collaboration, Planck 2018 results VI: Cosmological parameters, Astronomy & Astrophysics 641 (2020) A6",
      "Y. D. Hezaveh, L. Perreault Levasseur, P. J. Marshall, Fast automated analysis of strong gravitational lenses with convolutional neural networks, Nature 548 (2017) 555",
      "V. C. Rubin, W. K. Ford, Rotation of the Andromeda nebula from a spectroscopic survey of emission regions, Astrophysical Journal 159 (1970) 379"
    ],
    collegamenti: ['sastrocosmo', 'sastrogal', 'sastrobh', 'sastroelio']
  };

  /* ═══ 🫀 Fisiologia come sistema ═══════════════════════════════════════════ */
  T['smedfisio'] = {
    titolo: "Quattro modelli dinamici della fisiologia",
    sintesi: "Il corpo si può descrivere con modelli quantitativi semplici e verificabili: il cuore come una camera elastica la cui rigidità cambia nel tempo, il sangue come un tampone bicarbonato in equilibrio con l'anidride carbonica, la glicemia come un sistema regolato dall'insulina, lo scambio di ossigeno come una catena di pressioni parziali. Sono modelli didattici: catturano i meccanismi, non sostituiscono la clinica.",
    paragrafi: [
      { titolo: "Il ciclo cardiaco e l'elastanza", testo: "Nel modello di Suga e Sagawa la pressione del ventricolo è proporzionale al volume oltre un volume morto, P = E(t)(V − V₀), con un'elastanza E che sale in sistole e scende in diastole. Le valvole lasciano passare il sangue in un solo verso, l'aorta si comporta come un serbatoio elastico con una resistenza a valle. Il diagramma pressione–volume chiude un ciclo la cui area è il lavoro del cuore a ogni battito." },
      { titolo: "Frank–Starling e postcarico", testo: "Se il cuore si riempie di più, la gittata cresce: è la legge di Frank–Starling, che nel modello nasce dalla retta telesistolica fissa. Se aumenta la resistenza periferica, la pressione arteriosa sale e il ventricolo svuota meno. Se la contrattilità cala, la retta telesistolica si abbassa e la frazione di eiezione scende: è lo scompenso." },
      { titolo: "L'equilibrio acido–base", testo: "Il pH del sangue dipende dal rapporto fra bicarbonato e anidride carbonica disciolta, secondo Henderson–Hasselbalch. Un disturbo metabolico cambia il bicarbonato, uno respiratorio la pCO2, e l'altro sistema compensa in parte: i polmoni in minuti, i reni in giorni. Le regole di compenso attese, come la formula di Winter, permettono di riconoscere i disturbi misti; il gap anionico rivela gli acidi non misurati." },
      { titolo: "La glicemia e il modello minimo", testo: "Nel modello di Bergman il glucosio scompare da solo con una costante p₁ e in più grazie all'insulina in un compartimento remoto. Il rapporto p₃/p₂ è la sensibilità insulinica. Nel test di tolleranza endovena la curva del glucosio dopo il bolo rivela insieme la sensibilità e la risposta delle cellule β, che nel diabete di tipo 2 sono entrambe ridotte." },
      { titolo: "Dall'aria al sangue", testo: "L'equazione dei gas alveolari dà la pressione di ossigeno negli alveoli dall'ossigeno inspirato, dalla pressione atmosferica e dalla pCO2. Il sangue arterioso ne ha qualche millimetro in meno, il gradiente alveolo–arterioso. La saturazione dell'emoglobina segue una curva a S, e il contenuto di ossigeno dipende soprattutto dall'emoglobina: in quota la pressione cala e la ventilazione aumenta per compensare." }
    ],
    formule: [
      ["P = E(t)·(V − V₀)", "pressione del ventricolo nel modello a elastanza variabile; E in mmHg/ml, V volume in ml"],
      ["pH = 6,1 + log₁₀(HCO₃⁻ / (0,0307·pCO₂))", "Henderson–Hasselbalch per il tampone bicarbonato; HCO₃⁻ in mmol/L, pCO₂ in mmHg"],
      ["pCO₂ attesa = 1,5·HCO₃⁻ + 8 ± 2", "formula di Winter per il compenso respiratorio di un'acidosi metabolica"],
      ["PAO₂ = FiO₂·(Patm − 47) − PaCO₂/0,8", "equazione dei gas alveolari; 47 mmHg è la pressione del vapore acqueo a 37 °C, 0,8 il quoziente respiratorio"]
    ],
    ipotesi: [
      "Un solo ventricolo con atrio a pressione costante; parametri arrotondati per un adulto a riposo.",
      "Regole di compenso valide in stato stazionario; il gap anionico va corretto per l'albumina bassa."
    ],
    errori: [
      "Leggere un pH normale come assenza di disturbo: un disturbo misto può bilanciarsi.",
      "Pensare che la saturazione misuri l'ossigeno disponibile: con l'emoglobina bassa il contenuto cala anche a saturazione normale.",
      "Usare i modelli per decidere una terapia: sono strumenti di studio."
    ],
    esempio: {
      testo: "Chetoacidosi: HCO₃⁻ 10 mmol/L, pCO₂ 22 mmHg, Na 135, Cl 98. Il pH vale 6,1 + log₁₀(10/(0,0307·22)); il compenso atteso è 1,5·10 + 8; il gap anionico 135 − (98 + 10).",
      risultato: "pH ≈ 7,27; pCO₂ attesa 23 ± 2 (compensata); gap anionico 27, alto"
    },
    fonti: [
      "H. Suga, K. Sagawa, Instantaneous pressure–volume relationships and their ratio in the excised, supported canine left ventricle, Circulation Research 35 (1974) 117",
      "K. Berend, A. P. J. de Vries, R. O. B. Gans, Physiological approach to assessment of acid–base disturbances, New England Journal of Medicine 371 (2014) 1434",
      "R. N. Bergman et al., Physiologic evaluation of factors controlling glucose tolerance in man, Journal of Clinical Investigation 68 (1981) 1456",
      "J. B. West, Fisiologia della respirazione, Piccin, capitoli sugli scambi gassosi"
    ],
    collegamenti: ['sfarmquant', 'spka']
  };

  /* ═══ 💉 Farmacologia quantitativa ═════════════════════════════════════════ */
  T['sfarmquant'] = {
    titolo: "Farmacocinetica a più compartimenti, dosi ripetute e farmacodinamica",
    sintesi: "La farmacocinetica descrive che cosa il corpo fa al farmaco, la farmacodinamica che cosa il farmaco fa al corpo. Modelli a compartimenti con cinetica del primo ordine spiegano le fasi di distribuzione ed eliminazione, l'accumulo con dosi ripetute e il tempo per arrivare allo stato stazionario; la curva di Hill lega la concentrazione all'effetto, e le interazioni nascono quando un farmaco rallenta l'eliminazione di un altro.",
    paragrafi: [
      { titolo: "Due compartimenti", testo: "Dopo un bolo endovenoso la concentrazione nel plasma scende prima in fretta e poi lentamente: la prima fase è la distribuzione nei tessuti, la seconda l'eliminazione. Il modello a due compartimenti con costanti k₁₂, k₂₁ e k₁₀ dà una somma di due esponenziali con pendenze α e β. L'emivita che conta per le dosi è quella della fase β; il volume allo stato stazionario somma i due compartimenti." },
      { titolo: "Dosi ripetute e stato stazionario", testo: "Con dosi uguali a intervalli τ le concentrazioni si sommano finché ciò che entra a ogni intervallo pareggia ciò che esce. La concentrazione media allo stato stazionario è F·D/(CL·τ) e non dipende dal volume; il tempo per arrivarci dipende solo dall'emivita, circa 3,3 emivite per il 90 %. Una dose di carico, pari a Css·V/F, porta subito al livello voluto." },
      { titolo: "La curva di Hill", testo: "L'effetto cresce con la concentrazione fino a un massimo Emax; a metà effetto la concentrazione è EC50. L'esponente di Hill n descrive la ripidità: con n grande la risposta passa dal 10 al 90 % in un intervallo stretto e somiglia a un interruttore. Nella popolazione la dose che fa effetto varia: le risposte quantali seguono spesso una distribuzione log-normale." },
      { titolo: "Indice terapeutico e margine di sicurezza", testo: "L'indice terapeutico confronta la dose tossica mediana con quella efficace mediana. Due farmaci con lo stesso indice possono però avere margini molto diversi: conta quanto variano gli individui. Il margine di sicurezza, dose tossica per l'1 % su dose efficace per il 99 %, sotto 1 dice che la dose che cura quasi tutti è già tossica per qualcuno." },
      { titolo: "Le interazioni", testo: "Se un inibitore blocca in modo competitivo l'enzima che elimina un farmaco, la sua esposizione cresce secondo il modello di Rowland e Matin. Conta la frazione eliminata da quell'enzima: anche con inibizione totale l'esposizione non supera 1/(1 − fm), perché restano le altre vie. La FDA classifica le interazioni deboli, moderate e forti per aumenti di 1,25, 2 e 5 volte." }
    ],
    formule: [
      ["C(t) = A·e^(−αt) + B·e^(−βt)", "concentrazione dopo un bolo nel modello a due compartimenti; α fase di distribuzione, β di eliminazione"],
      ["Css = F·D / (CL·τ)", "concentrazione media allo stato stazionario: F biodisponibilità, D dose, CL clearance, τ intervallo"],
      ["E = E₀ + Emax·Cⁿ / (EC50ⁿ + Cⁿ)", "modello di Hill dell'effetto in funzione della concentrazione"],
      ["AUC_con / AUC_senza = 1 / (fm/(1 + [I]/Ki) + 1 − fm)", "aumento dell'esposizione per inibizione competitiva reversibile (Rowland e Matin)"]
    ],
    ipotesi: [
      "Cinetica del primo ordine, compartimenti ben miscelati, parametri costanti nel tempo.",
      "Esempi didattici con parametri tipici: non sono schemi di dosaggio."
    ],
    errori: [
      "Credere che una dose più alta faccia arrivare prima allo stato stazionario: cambia il livello, non il tempo.",
      "Usare l'emivita della fase di distribuzione per calcolare l'intervallo fra le dosi.",
      "Leggere l'indice terapeutico senza guardare la variabilità fra le persone."
    ],
    esempio: {
      testo: "Un farmaco orale con F = 0,8, CL = 4 L/h e V = 40 L si dà alla dose di 500 mg ogni 12 ore. Css media = 0,8·500/(4·12); emivita = ln2·V/CL.",
      risultato: "Css media ≈ 8,3 mg/L; emivita ≈ 6,9 h; 90 % dello stato stazionario dopo circa 23 h"
    },
    fonti: [
      "M. Rowland, T. N. Tozer, Clinical Pharmacokinetics and Pharmacodynamics, 5ª ed., Wolters Kluwer, 2019",
      "J. Gabrielsson, D. Weiner, Pharmacokinetic and Pharmacodynamic Data Analysis, 5ª ed., Swedish Pharmaceutical Press, 2016",
      "U.S. Food and Drug Administration, Clinical Drug Interaction Studies — Guidance for Industry, 2020"
    ],
    collegamenti: ['smedfisio', 'spka']
  };

  /* ═══ 🧭 Mappa dei prerequisiti di matematica ══════════════════════════════ */
  T['smatmappa'] = {
    titolo: "Come si costruisce un percorso di studio con i prerequisiti",
    sintesi: "La matematica si impara in un ordine: per capire le equazioni alle derivate parziali servono le equazioni differenziali, il calcolo vettoriale e la trasformata di Fourier, e ognuno di questi chiede a sua volta altro. Se gli argomenti sono nodi e i prerequisiti frecce, il percorso verso un obiettivo è un ordinamento topologico dei suoi antenati in un grafo aciclico.",
    paragrafi: [
      { titolo: "Il grafo dei prerequisiti", testo: "Ogni argomento è un nodo; una freccia da A a B dice che A va studiato prima di B. Il grafo deve essere aciclico: se A chiedesse B e B chiedesse A non ci sarebbe un punto da cui cominciare. In BioSpecInfo ogni prerequisito sta a un livello uguale o più basso, dalle superiori all'avanzato, e il banco controlla entrambe le proprietà." },
      { titolo: "Antenati e discendenti", testo: "Gli antenati di un argomento sono tutti i nodi da cui si arriva a lui seguendo le frecce: sono ciò che serve davvero, non solo i prerequisiti diretti. I discendenti sono ciò che l'argomento sblocca. Le equazioni alle derivate parziali hanno ventuno antenati; i numeri, alla radice, sbloccano tutto il resto." },
      { titolo: "L'ordinamento topologico", testo: "Un ordinamento topologico mette i nodi in fila in modo che ogni freccia vada in avanti. Si costruisce scegliendo a ogni passo un nodo i cui prerequisiti siano già stati scelti; se a parità di condizioni si preferiscono i livelli più bassi, il percorso ricalca l'ordine degli studi. Esiste solo se il grafo è aciclico, ed è il motivo per cui l'aciclicità si verifica." },
      { titolo: "I quattro livelli", testo: "La mappa divide gli argomenti in quattro livelli: superiori, laurea triennale, magistrale e avanzato. Il livello dice quando un argomento si incontra di solito, non quanto sia difficile per chi lo studia: le catene di Markov, per esempio, chiedono solo probabilità e autovalori, ma si insegnano tardi. Guardare il livello e gli antenati insieme aiuta a capire che cosa si può anticipare." },
      { titolo: "Ciò che si sa già", testo: "Chi conosce già alcuni argomenti li segna come noti: vengono tolti dal percorso, ma restano soddisfatti per chi li richiede. Il percorso si accorcia senza perdere la sua coerenza. Per ogni argomento la mappa indica anche le sezioni dell'app che lo insegnano e quelle di fisica e chimica che lo usano, così si vede perché serve." }
    ],
    formule: [
      ["A → B", "freccia di prerequisito: A va studiato prima di B"],
      ["percorso(x) = ordinamento topologico di antenati(x) ∪ {x}", "il percorso verso l'obiettivo x, che rispetta tutte le frecce"]
    ],
    ipotesi: [
      "I prerequisiti scelti sono quelli didattici più comuni nei corsi italiani di laurea scientifica; altri percorsi sono possibili.",
      "Un argomento si considera noto quando lo si segna: la mappa non verifica che lo sia davvero."
    ],
    errori: [
      "Studiare un argomento avanzato saltando un antenato lontano: il guaio si vede solo più tardi.",
      "Confondere un prerequisito diretto con l'insieme di tutti gli antenati."
    ],
    esempio: {
      testo: "Chi vuole arrivare alle equazioni alle derivate parziali e sa già numeri, algebra e funzioni: il percorso completo ha ventidue tappe, tolte le tre note quante ne restano?",
      risultato: "19 tappe, nell'ordine dei prerequisiti"
    },
    fonti: [
      "T. H. Cormen, C. E. Leiserson, R. L. Rivest, C. Stein, Introduzione agli algoritmi e strutture dati, McGraw-Hill, capitolo sull'ordinamento topologico",
      "A. B. Kahn, Topological sorting of large networks, Communications of the ACM 5 (1962) 558"
    ],
    collegamenti: ['smatgrafi', 'smatlogica']
  };
  /* ═══ 🧪 Costruttore molecolare 3D e AR (v257) ════════════════════════════ */
  T['scostruttore'] = {
    titolo: "Costruire una molecola: valenza, VSEPR e un campo di forze semplice",
    sintesi: "Una molecola si costruisce legando atomi finché ogni valenza è soddisfatta. La sua forma nasce da due regole: i legami hanno una lunghezza tipica, che dipende dagli atomi e dall'ordine di legame, e le coppie di elettroni attorno a un atomo si allontanano il più possibile. Un campo di forze semplice traduce le due regole in un'energia da minimizzare.",
    paragrafi: [
      { titolo: "Valenza e carica formale", testo: "La valenza è il numero di legami che un atomo forma di solito: uno per idrogeno e alogeni, due per ossigeno, tre per azoto, quattro per carbonio. Fosforo e zolfo, nel terzo periodo, possono andare oltre: cinque legami in PCl₅, sei in SF₆, quattro con due doppi nell'acido solforico. La carica formale cambia il conto: lo ione ammonio NH₄⁺ ha quattro legami sull'azoto, l'ossidrile OH⁻ uno solo sull'ossigeno, un carbocatione tre. Una valenza rimasta libera indica un radicale o una molecola incompleta: di solito la si completa con gli idrogeni." },
      { titolo: "Le lunghezze di legame dai raggi covalenti", testo: "La distanza fra due atomi legati è circa la somma dei loro raggi covalenti. Le tabelle di Cordero e colleghi (2008) danno 0,76 Å per il carbonio ibridato sp³, 0,66 per l'ossigeno, 0,31 per l'idrogeno: C–C 1,52 Å, C–O 1,42, C–H 1,07, valori vicini a quelli misurati (1,53; 1,43; 1,09). I legami multipli sono più corti: il rapporto misurato C=C/C–C vale 1,34/1,53 e C≡C/C–C vale 1,20/1,53. Nel benzene i sei legami sono uguali, 1,39 Å, a metà fra singolo e doppio: la struttura reale non è nessuna delle due formule di Kekulé ma la loro media." },
      { titolo: "La forma dalla VSEPR", testo: "Il modello VSEPR conta i domini elettronici attorno a un atomo: atomi legati più coppie solitarie, contando un legame multiplo come un solo dominio. Due domini stanno a 180° (CO₂, acetilene), tre a 120° (formaldeide, etilene), quattro a 109,5° (metano). Le coppie solitarie occupano più spazio e stringono gli angoli: 107° nell'ammoniaca, 104,5° nell'acqua. Con cinque domini si ha una bipiramide trigonale, con angoli di 90°, 120° e 180°; con sei un ottaedro. Il numero di domini suggerisce l'ibridazione: sp, sp², sp³, sp³d, sp³d²." },
      { titolo: "Il campo di forze e la minimizzazione", testo: "Un campo di forze scrive l'energia come somma di termini semplici: una molla per ogni legame, che vuole la lunghezza di riferimento; un termine per ogni angolo, che vuole l'angolo VSEPR; un termine che tiene nel piano i centri sp² e i loro sostituenti, perché l'etilene e il benzene sono piatti; una repulsione fra atomi non legati che si avvicinano troppo. La geometria si trova scendendo lungo il gradiente dell'energia, a passi sempre più piccoli, finché le forze sono quasi nulle. È il principio dei campi di forze di meccanica molecolare, in una versione ridotta." },
      { titolo: "Che cosa il modello non sa fare", testo: "Le distanze escono con errori di qualche centesimo di ångström e gli angoli di pochi gradi, perché i parametri sono pochi e generali. Il modello non calcola energie di reazione, non distingue bene le conformazioni vicine in energia, non conosce la delocalizzazione oltre gli anelli aromatici a sei e non descrive gli stati di transizione. Per questo si usano campi di forze completi, parametrizzati su migliaia di molecole, o calcoli quantistici. Qui serve a vedere e misurare la forma, e a posarla sul tavolo in realtà aumentata." }
    ],
    formule: [
      ["r₀(A–B) = (r_A + r_B) · f(ordine)", "lunghezza di riferimento dalla somma dei raggi covalenti, accorciata per i legami multipli"],
      ["numero sterico = atomi legati + coppie solitarie", "i domini elettronici che fissano la geometria VSEPR attorno all'atomo"],
      ["coppie solitarie = (elettroni di valenza − carica − ordini di legame)/2", "conteggio delle coppie non condivise per un atomo neutro o carico"],
      ["E = Σ k_b(r − r₀)² + Σ k_θ(cos θ − cos θ₀)² + E_planarità + E_repulsione", "energia del campo di forze semplificato che la minimizzazione rende minima"],
      ["DBE = (2C + 2 + N − H − X)/2", "gradi di insaturazione: anelli più legami pi greco, per valenze normali"]
    ],
    ipotesi: [
      "Parametri generali dai raggi covalenti e dalla VSEPR, non da un campo di forze completo: errori di centesimi di ångström e di pochi gradi.",
      "Gli anelli aromatici riconosciuti sono quelli a sei centri sp² con legami alternati; la carica formale si assegna a mano."
    ],
    errori: [
      "Contare un doppio legame come due domini VSEPR: è uno solo, per questo la CO₂ è lineare.",
      "Dare all'azoto quattro legami senza carica: lo ione ammonio ha carica positiva.",
      "Leggere le distanze del modello come valori sperimentali al millesimo di ångström."
    ],
    esempio: {
      testo: "Si parte da un carbonio, si lega un secondo carbonio e poi un ossigeno, e si completa con gli idrogeni. Il costruttore dà la formula, la massa e la geometria dell'ossigeno.",
      risultato: "C₂H₆O, 46,07 g/mol (etanolo); l'ossigeno è AX₂E₂, angolato, con angolo C–O–H di 104,5°"
    },
    fonti: [
      "B. Cordero et al., Covalent radii revisited, Dalton Transactions (2008) 2832–2838",
      "R. J. Gillespie, R. S. Nyholm, Inorganic stereochemistry, Quarterly Reviews of the Chemical Society 11 (1957) 339",
      "A. R. Leach, Molecular Modelling: Principles and Applications, 2ª ed., Pearson 2001, capitoli 4 e 5"
    ],
    collegamenti: ['svsepr', 'sstruct', 'smo']
  };
  /* ═══ 🎬 Scene fisiche 3D (v258) ═══════════════════════════════════════════ */
  T['sfisscene'] = {
    titolo: "Tre scene calcolate: il legame di H₂, la magnetosfera, un solido elastico",
    sintesi: "Tre sistemi fisici diversi letti con lo stesso metodo: un modello con i suoi dati misurati, le equazioni risolte e non disegnate, la figura che ne viene. Il legame di H₂ vibra nel potenziale di Morse; il campo della Terra incontra il vento solare e decide dove si accendono le aurore; una forza puntuale deforma un solido secondo la soluzione di Kelvin.",
    paragrafi: [
      { titolo: "Il potenziale di Morse", testo: "L'energia di due atomi legati in funzione della distanza ha un minimo alla lunghezza di equilibrio r_e, sale ripida quando gli atomi si avvicinano e tende a un valore costante quando si separano. Morse (1929) la scrisse come V(r) = D_e(1 − e^(−a(r − r_e)))² − D_e, con tre parametri: la profondità D_e, la posizione r_e e la larghezza a, che si ricava dalla frequenza di vibrazione e dalla massa ridotta. Per H₂ i dati spettroscopici danno r_e = 0,741 Å, ω_e = 4401 cm⁻¹ e D_e = 4,747 eV, da cui a = 1,944 Å⁻¹." },
      { titolo: "Livelli, energia di punto zero e dissociazione", testo: "Nel potenziale di Morse i livelli vibrazionali sono E_v = ħω(v + ½) − (ħω)²(v + ½)²/(4D_e): la spaziatura diminuisce salendo, al contrario dell'oscillatore armonico in cui resta costante. Anche nel livello più basso la molecola vibra: l'energia di punto zero E₀ vale circa 0,27 eV, e l'energia per rompere il legame dal livello zero è D₀ = D_e − E₀ = 4,478 eV, contro i 4,4781 eV misurati. Il modello prevede diciassette livelli legati, la molecola reale quindici: la curva vera si discosta da quella di Morse vicino alla dissociazione." },
      { titolo: "La magnetosfera e la magnetopausa", testo: "Il campo magnetico terrestre è quasi un dipolo inclinato di circa undici gradi rispetto all'asse di rotazione. Il vento solare, un plasma che arriva a qualche centinaio di chilometri al secondo, lo comprime sul lato diurno e lo stira in una lunga coda sul lato notturno. La superficie dove la pressione del vento uguaglia la pressione magnetica è la magnetopausa: con il modello empirico di Shue (1998) dista circa dieci raggi terrestri verso il Sole e si avvicina quando la pressione del vento cresce. Davanti, dove il flusso supersonico rallenta di colpo, c'è l'onda d'urto." },
      { titolo: "Linee aperte, riconnessione e aurore", testo: "Sommando al dipolo un campo interplanetario uniforme si ottiene il modello di Dungey (1961). Le linee che partono dalle latitudini medie tornano sulla Terra; quelle vicine ai poli si collegano al campo del vento solare e restano aperte. Quando il campo interplanetario punta verso sud la riconnessione sul lato diurno è forte, la calotta di linee aperte si allarga e il suo bordo scende verso l'equatore. Gli elettroni accelerati lungo le linee vicine a questo bordo eccitano l'ossigeno dell'alta atmosfera: verde a 557,7 nm più in basso, rosso a 630 nm più in alto. Per questo durante le tempeste magnetiche le aurore si vedono a latitudini più basse." },
      { titolo: "Un solido elastico e la soluzione di Kelvin", testo: "In un solido elastico isotropo lo spostamento u obbedisce all'equazione di Navier, μ∇²u + (λ + μ)∇(∇·u) = 0 lontano dai carichi. Kelvin (1848) trovò la soluzione per una forza puntuale in un mezzo infinito: lo spostamento decresce come 1/r e contiene un termine lungo la forza e uno radiale. Il coefficiente di Poisson ν decide quanto il materiale cambia volume: davanti alla forza il solido si comprime, dietro si dilata, e per ν = 0,5 il materiale è incomprimibile e la dilatazione si annulla. Gli spostamenti veri sono di micrometri e vanno amplificati per vederli." }
    ],
    formule: [
      ["V(r) = D_e(1 − e^(−a(r − r_e)))² − D_e", "potenziale di Morse di una molecola biatomica, zero agli atomi separati"],
      ["E_v = ħω(v + ½) − (ħω)²(v + ½)²/(4D_e)", "livelli vibrazionali nel potenziale di Morse, sempre più fitti verso la dissociazione"],
      ["r_mp = r₀ (2/(1 + cos θ))^α", "forma della magnetopausa nel modello empirico di Shue, con r₀ e α dalla pressione del vento e da B_z"],
      ["P_d = 1,6726·10⁻⁶ n v²", "pressione dinamica del vento solare in nanopascal, con n in cm⁻³ e v in km/s"],
      ["u = F/(8πμ(1−ν)r) · [(3 − 4ν) ê + (ê·r̂) r̂]", "spostamento di Kelvin per una forza puntuale in un solido elastico infinito"]
    ],
    ipotesi: [
      "Morse è un modello a tre parametri: descrive bene il fondo della buca e peggio la dissociazione; la nuvola elettronica è l'orbitale LCAO di Coulson, non la funzione d'onda esatta.",
      "Il modello di Dungey è nel vuoto, senza le correnti della coda; la magnetopausa di Shue è empirica e l'onda d'urto è disegnata come magnetopausa allargata.",
      "Kelvin vale per un mezzo infinito, lineare e isotropo; vicino al punto di applicazione la soluzione diverge e la scena la regolarizza."
    ],
    errori: [
      "Pensare che nel livello più basso la molecola stia ferma: vibra con l'energia di punto zero.",
      "Credere che le aurore si formino dove il vento solare tocca l'atmosfera: si accendono lungo le linee vicine al bordo della calotta polare.",
      "Confondere lo spostamento amplificato della figura con quello reale, di micrometri."
    ],
    esempio: {
      testo: "Con un vento solare di 20 particelle per centimetro cubo a 700 km/s e il campo interplanetario a −10 nT, si legge la distanza della magnetopausa e la latitudine del bordo della calotta a mezzanotte.",
      risultato: "P_d ≈ 16 nPa, r₀ ≈ 6,4 raggi terrestri, bordo della calotta verso 71° di latitudine magnetica"
    },
    fonti: [
      "K. P. Huber, G. Herzberg, Molecular Spectra and Molecular Structure IV: Constants of Diatomic Molecules, Van Nostrand 1979",
      "J.-H. Shue et al., Magnetopause location under extreme solar wind conditions, Journal of Geophysical Research 103 (1998) 17691",
      "J. W. Dungey, Interplanetary magnetic field and the auroral zones, Physical Review Letters 6 (1961) 47",
      "L. D. Landau, E. M. Lifšic, Teoria dell'elasticità, Editori Riuniti, § 8 (forza puntuale in un mezzo infinito)"
    ],
    collegamenti: ['sfismateriali', 'sastroelio', 'sorbitali']
  };
  /* ═══ 🎞️ Simulazioni cosmiche (v258) ═══════════════════════════════════════ */
  T['scosmo'] = {
    titolo: "Simulare invece di animare: integrare le equazioni e controllare gli errori",
    sintesi: "Un'animazione mostra quello che qualcuno ha disegnato; una simulazione mostra quello che le equazioni producono. La differenza si vede nei controlli: una quantità che dovrebbe conservarsi resta costante, un numero critico cade dove la teoria lo prevede, un caso limite noto viene ritrovato. Le simulazioni cosmiche di questa sezione dichiarano le equazioni, il metodo numerico e l'errore che commettono.",
    paragrafi: [
      { titolo: "Integratori e quantità conservate", testo: "Un'equazione del moto si integra a piccoli passi. Il metodo di Runge e Kutta del quarto ordine commette un errore che scala con la quarta potenza del passo ed è adatto a traiettorie brevi e lisce, come i raggi di luce. Per le orbite che durano molti giri si usano metodi simplettici come il leapfrog o il Velocity Verlet: non conservano esattamente l'energia, ma il loro errore oscilla senza crescere, e per questo le galassie e i sistemi planetari restano stabili anche dopo migliaia di orbite." },
      { titolo: "La luce attorno a un buco nero", testo: "Nello spaziotempo di Schwarzschild un raggio di luce nel piano dell'orbita obbedisce a d²u/dφ² = 3Mu² − u, con u = 1/r. Il parametro d'impatto critico vale 3√3 M: sotto il raggio cade nell'orizzonte, sopra sfugge deviato, e vicino al valore critico gira più volte attorno alla sfera dei fotoni a r = 3M. Il numero di giri cresce come il logaritmo della distanza dal valore critico. Lo stesso integrale dà la deviazione con cui si risolve l'equazione della lente e si ricostruisce il cielo deformato." },
      { titolo: "Perché serve la materia oscura", testo: "La velocità di un'orbita circolare dipende dalla massa racchiusa: con la sola materia visibile, bulge e disco, la curva di rotazione dovrebbe calare lontano dal centro. Le misure la trovano invece quasi piatta fino a decine di kiloparsec. Aggiungendo un alone di materia oscura con il profilo di Navarro, Frenk e White la curva resta piatta. Togliendolo, le stelle esterne avrebbero più della velocità di fuga e la galassia perderebbe la sua parte esterna: è il ragionamento della simulazione con e senza alone." },
      { titolo: "Il legame chimico come curva di energia", testo: "Due atomi di idrogeno si attraggono finché la loro nuvola elettronica condivisa abbassa l'energia; troppo vicini, i nuclei si respingono. Il potenziale di Morse riassume la curva con tre parametri misurati: la profondità, la distanza di equilibrio di 74,1 picometri e la larghezza. La molecola vibra anche nel livello più basso, e per romperla dal fondo occorrono 4,48 elettronvolt. La nuvola si ottiene campionando la densità di probabilità del modello a due orbitali 1s." },
      { titolo: "Analogie dichiarate", testo: "Alcune immagini famose sono analogie, non la teoria: il telo di gomma con l'imbuto, un reticolo che si piega verso una massa. Sono utili per l'intuizione ma non sono la metrica dello spaziotempo. Le simulazioni le usano dicendolo, e lasciano calcolata la parte fisica: le orbite del telo sono un vero problema degli N corpi, la forma del pozzo galattico è il potenziale del modello, il satellite del reticolo segue un'orbita kepleriana." }
    ],
    formule: [
      ["d²u/dφ² = 3Mu² − u", "equazione delle geodetiche nulle di Schwarzschild nel piano, con u = 1/r e G = c = 1"],
      ["b_crit = 3√3 M", "parametro d'impatto critico: sotto la luce è catturata, sopra sfugge"],
      ["v_c²(R) = R dΦ/dR", "velocità circolare dal potenziale della galassia, somma di bulge, disco e alone"],
      ["V(R) = D_e(1 − e^(−a(R − R_e)))² − D_e", "potenziale di Morse del legame di H₂, con i dati spettroscopici misurati"],
      ["ΔE/E = |E(t) − E(0)| / |E(0)|", "errore relativo dell'energia, il controllo di qualità di ogni integrazione"]
    ],
    ipotesi: [
      "Le stelle della galassia sono particelle test in un potenziale fisso, nel piano del disco: niente autogravità né bracci che si formano da soli.",
      "Il cielo deformato usa la lente a stelle all'infinito e un osservatore a 30 masse di distanza; le immagini di ordine superiore si accumulano sull'anello dei fotoni."
    ],
    errori: [
      "Credere che il telo di gomma sia la relatività generale: è un'analogia, e la gravità che la tira verso il basso è quella che dovrebbe spiegare.",
      "Pensare che un'integrazione corretta conservi l'energia esattamente: la conserva entro un errore che va misurato e dichiarato."
    ],
    esempio: {
      testo: "Un raggio con parametro d'impatto una parte su cento milioni sopra il valore critico gira attorno al buco nero prima di sfuggire. Quanti giri fa in più di uno con una parte su diecimila?",
      risultato: "circa ln(10⁴)/2π ≈ 1,5 giri in più"
    },
    fonti: [
      "S. Chandrasekhar, The Mathematical Theory of Black Holes, Oxford University Press 1983, capitolo 3",
      "J. Binney, S. Tremaine, Galactic Dynamics, 2ª ed., Princeton University Press 2008, capitoli 2 e 3",
      "J. F. Navarro, C. S. Frenk, S. D. M. White, The structure of cold dark matter halos, Astrophysical Journal 462 (1996) 563",
      "E. Hairer, C. Lubich, G. Wanner, Geometric numerical integration illustrated by the Störmer–Verlet method, Acta Numerica 12 (2003) 399"
    ],
    collegamenti: ['sastrobh', 'sastrooscura', 'sfisscene']
  };
  /* ═══ 🌟 Spaccati stellari (v260) ═══════════════════════════════════════════ */
  T['sastrospaccato'] = {
    titolo: "Dentro le stelle mentre cambiano: nucleosintesi e trasformazioni",
    sintesi: "Una stella è un reattore che cambia combustibile: brucia idrogeno, poi le ceneri dell'idrogeno, poi le ceneri delle ceneri, ogni volta a temperatura più alta e per un tempo molto più breve. Tagliarla a spicchio mostra gli strati che restano attorno al nucleo come in una cipolla; seguire la composizione del nucleo mostra perché tutto si ferma al ferro e perché, a quel punto, la stella crolla.",
    paragrafi: [
      { titolo: "Le fasi di combustione", testo: "In una stella massiccia l'idrogeno brucia per milioni di anni a circa 40 milioni di gradi, l'elio per centinaia di migliaia di anni a 200 milioni, il carbonio per secoli, il neon e l'ossigeno per mesi, il silicio per un giorno a oltre tre miliardi di gradi. Le durate si accorciano perché ogni fase rende meno energia per nucleone e perché, sopra il mezzo miliardo di gradi, i neutrini portano via energia direttamente dal nucleo." },
      { titolo: "Perché il ferro è il capolinea", testo: "L'energia di legame per nucleone cresce dall'idrogeno fino al gruppo del ferro (⁵⁶Fe 8,790 MeV, ⁶²Ni 8,795 MeV) e poi cala. Fondere nuclei più leggeri del ferro libera energia; fondere il ferro la costa. Un nucleo di ferro non può più sostenersi con la fusione: quando supera la massa di Chandrasekhar, 5,83 Y_e² masse solari, la pressione degli elettroni degeneri non basta e il nucleo crolla in meno di un secondo." },
      { titolo: "Collasso, rimbalzo, neutrini", testo: "Durante il crollo i protoni catturano elettroni e diventano neutroni (p + e⁻ → n + νₑ) e i fotoni spezzano i nuclei di ferro. A densità nucleare il nucleo rimbalza; circa il 99 % dell'energia liberata, ~3·10⁵³ erg, se ne va in neutrini, e una piccola parte, assorbita dal gas, lancia l'esplosione. Resta una stella di neutroni o, per le stelle più massicce, un buco nero." },
      { titolo: "Altri forni", testo: "Una nana bianca che supera la massa di Chandrasekhar brucia in un secondo e produce circa 0,6 masse solari di ⁵⁶Ni, il cui decadimento in ⁵⁶Co e ⁵⁶Fe alimenta la luce per mesi. Due stelle di neutroni che si fondono espellono materia così ricca di neutroni che i nuclei li catturano più in fretta di quanto decadano: il processo r produce lantanidi, platino e oro. Nei primi venti minuti dell'universo si formano solo idrogeno, elio e tracce di litio." }
    ],
    formule: [
      ["4 ¹H → ⁴He + 2 e⁺ + 2 νₑ", "il bilancio della catena pp e del ciclo CNO"],
      ["3 ⁴He → ¹²C + γ", "la reazione tre-alfa che forma il carbonio"],
      ["M_Ch = 5,83 Y_e² M☉", "massa di Chandrasekhar; con Y_e = 0,5 vale circa 1,46 M☉"],
      ["L(t) = M_Ni[(ε_Ni − ε_Co)e^(−t/τ_Ni) + ε_Co e^(−t/τ_Co)]", "luminosità dei decadimenti di ⁵⁶Ni e ⁵⁶Co in una supernova Ia"],
      ["Y ≈ 2 n/(n + p)", "frazione in massa di elio dal Big Bang, se tutti i neutroni finiscono nell'elio"]
    ],
    ipotesi: [
      "Le durate delle fasi sono quelle dei modelli di Woosley, Heger e Weaver (2002) per 15 e 25 masse solari, interpolate in logaritmo per le masse intermedie.",
      "Le composizioni del nucleo a fine fase sono lette dai profili pubblicati e arrotondate: indicative. I raggi degli strati nel disegno non sono in scala."
    ],
    errori: [
      "Pensare che una stella bruci il ferro: il ferro è la cenere finale, e fonderlo assorbe energia.",
      "Credere che l'esplosione sia alimentata dalla fusione: in una supernova a collasso del nucleo l'energia viene dalla gravità, e quasi tutta esce in neutrini."
    ],
    esempio: {
      testo: "Una supernova Ia produce 0,6 masse solari di ⁵⁶Ni. Quanta luce emette il decadimento diciotto giorni dopo l'esplosione?",
      risultato: "circa 1,2·10⁴³ erg/s, il picco osservato delle supernove Ia"
    },
    fonti: [
      "S. E. Woosley, A. Heger, T. A. Weaver, The evolution and explosion of massive stars, Reviews of Modern Physics 74 (2002) 1015",
      "H.-T. Janka, Explosion mechanisms of core-collapse supernovae, Annual Review of Nuclear and Particle Science 62 (2012) 407",
      "D. K. Nadyozhin, The properties of Ni → Co → Fe decay, Astrophysical Journal Supplement 92 (1994) 527",
      "D. Kasen et al., Origin of the heavy elements in binary neutron-star mergers from a gravitational-wave event, Nature 551 (2017) 80",
      "I.-J. Sackmann, A. I. Boothroyd, K. E. Kraemer, Our Sun. III. Present and future, Astrophysical Journal 418 (1993) 457"
    ],
    collegamenti: ['sastrostelle', 'sastrobh', 'sastrogw', 'scosmo']
  };
  /* ═══ 🧪 Meccanismi 3D (v262) ═════════════════════════════════════════════ */
  T['smecc3d'] = {
    titolo: "Il meccanismo di reazione: dove vanno gli elettroni e quanto costa",
    sintesi: "Un'equazione chimica dice che cosa diventa che cosa; il meccanismo dice come. Gli atomi si avvicinano, gli elettroni si spostano da un legame a un altro, si attraversano stati di transizione e a volte intermedi. Le frecce curve contano le coppie di elettroni; il profilo energetico dice quanto è alta la montagna da superare e quindi quanto è veloce la reazione.",
    paragrafi: [
      { titolo: "Le frecce curve", testo: "Una freccia curva parte da una coppia di elettroni (un doppietto libero o un legame) e arriva dove quella coppia formerà un nuovo legame o si fermerà come doppietto. Una mezza freccia muove un solo elettrone: è il linguaggio dei radicali. Le frecce non sono decorazioni: contando gli elettroni dicono quali cariche compaiono e scompaiono, e la carica totale non cambia mai." },
      { titolo: "Stati di transizione e intermedi", testo: "Lo stato di transizione è il punto più alto del cammino fra due minimi: legami a metà, vita di una vibrazione molecolare, non si può isolare. Un intermedio è invece un minimo locale (un carbocatione, un complesso σ, un intermedio tetraedrico): vive abbastanza da poter essere intrappolato o osservato. La velocità dipende dalla barriera più alta, secondo Eyring: k = (k_B T/h) e^(−ΔG‡/RT)." },
      { titolo: "Sostituzioni ed eliminazioni", testo: "L'SN2 avviene in un passo con l'attacco dal lato opposto al gruppo uscente e l'inversione della configurazione; l'SN1 passa per un carbocatione piatto e dà racemizzazione. L'E2 richiede che l'idrogeno e il gruppo uscente siano antiperiplanari. Substrato, nucleofilo o base, solvente e temperatura decidono quale strada vince." },
      { titolo: "Leggere un profilo energetico", testo: "Il profilo energetico mette in orizzontale la coordinata di reazione, cioè l'avanzamento dai reagenti ai prodotti, e in verticale l'energia. I massimi sono gli stati di transizione, segnati con la doppia croce; le valli fra due massimi sono gli intermedi. La differenza fra reagenti e prodotti dice se la reazione libera o assorbe energia (termodinamica); l'altezza del massimo più alto rispetto al punto di partenza dice quanto è lenta (cinetica). Un catalizzatore non cambia né reagenti né prodotti: apre una strada con montagne più basse. Per questo una reazione molto favorevole può essere lentissima, come la combustione di un pezzo di legno che non brucia finché non lo si accende." },
      { titolo: "Addizioni, aromatici, carbonili, radicali", testo: "Gli alcheni addizionano HBr passando per il carbocatione più stabile (regola di Markovnikov). Il benzene invece sostituisce, perché perdere l'aromaticità costa troppo: il complesso σ torna aromatico cedendo un protone. I carbonili vengono attaccati dai nucleofili e passano per un intermedio tetraedrico. Le reazioni pericicliche come la Diels–Alder spostano sei elettroni in cerchio in un passo solo, e le reazioni radicaliche procedono a catena." }
    ],
    formule: [
      ["k = (k_B T / h) e^(−ΔG‡/RT)", "equazione di Eyring: la costante di velocità dalla barriera di energia libera"],
      ["v = k[RX][Nu⁻]", "legge cinetica dell'SN2: secondo ordine, un passo solo"],
      ["v = k[RX]", "legge cinetica dell'SN1: lo stadio lento è la ionizzazione"],
      ["ΔH ≈ Σ E(legami rotti) − Σ E(legami formati)", "stima dell'entalpia di reazione dalle energie di legame"],
      ["4n + 2 elettroni", "regola di Hückel: lo stato di transizione della Diels–Alder (6 elettroni) è aromatico"]
    ],
    ipotesi: [
      "Le geometrie dei film sono semplificate: lunghezze e angoli tipici, i metili rappresentati come un'unica sfera.",
      "I profili energetici sono indicativi (ordini di grandezza in soluzione), tranne la Diels–Alder butadiene + etene e la clorurazione radicalica, con i valori misurati."
    ],
    errori: [
      "Disegnare la freccia dal nucleo verso gli elettroni: parte sempre dagli elettroni.",
      "Confondere lo stato di transizione con un intermedio: il primo è un massimo, il secondo un minimo."
    ],
    esempio: {
      testo: "La clorurazione del metano: CH₄ + Cl· → CH₃· + HCl. Con le energie di legame CH₃–H = 439 e H–Cl = 432 kJ/mol, quanto vale ΔH di questo passo?",
      risultato: "ΔH ≈ 439 − 432 = +7 kJ/mol: leggermente endotermico"
    },
    fonti: [
      "J. Clayden, N. Greeves, S. Warren, Organic Chemistry, 2ª ed., Oxford University Press 2012",
      "E. V. Anslyn, D. A. Dougherty, Modern Physical Organic Chemistry, University Science Books 2006",
      "R. B. Woodward, R. Hoffmann, Stereochemistry of electrocyclic reactions, Journal of the American Chemical Society 87 (1965) 395",
      "Y.-R. Luo, Comprehensive Handbook of Chemical Bond Energies, CRC Press 2007"
    ],
    collegamenti: ['sanimmech', 'skin', 'schicinet']
  };
  /* ═══ 🎞️ Animazioni matematiche (v262) ═════════════════════════════════════ */
  T['sanimmat'] = {
    titolo: "Limiti, serie e caso: le idee che si vedono meglio in movimento",
    sintesi: "Molte idee della matematica sono processi: una somma che si allunga, un intervallo che si restringe, un esperimento ripetuto. Guardarle muoversi aiuta a capire che cosa converge, quanto in fretta e verso che cosa.",
    paragrafi: [
      { titolo: "Serie di Fourier e fenomeno di Gibbs", testo: "Una funzione periodica si scrive come somma di seni e coseni. L'onda quadra è (4/π) Σ sin(kx)/k sulle k dispari: ogni termine è un cerchio che gira più in fretta. Vicino a un salto le somme parziali superano il valore di circa il 9 % del salto, e questo eccesso non sparisce aggiungendo termini: si stringe soltanto (fenomeno di Gibbs)." },
      { titolo: "Integrale e derivata come limiti", testo: "L'integrale è il limite delle somme di rettangoli sempre più sottili: per una funzione liscia l'errore della somma sinistra cala come 1/n, ma se la funzione ha lo stesso valore agli estremi la somma coincide con quella dei trapezi e l'errore cala come 1/n². La derivata è il limite della pendenza della secante quando i due punti si avvicinano." },
      { titolo: "Serie di Taylor", testo: "Una funzione liscia vicino a un punto si approssima con un polinomio che ne copia il valore e le derivate. Per sin x i termini dispari, con segni alterni e fattoriali al denominatore; il resto di Lagrange limita l'errore: |R| ≤ |x|^(n+1)/(n+1)!." },
      { titolo: "Il cerchio, e e la sezione aurea", testo: "La formula di Eulero lega l'esponenziale alla trigonometria: un punto che gira sul cerchio di raggio uno ha come ombra orizzontale il coseno e come ombra verticale il seno, e dopo mezzo giro arriva a meno uno, da cui e^{iπ} + 1 = 0. Il numero e nasce anche da un problema di soldi: un euro al cento per cento annuo, con gli interessi aggiunti n volte l'anno, diventa (1 + 1/n)ⁿ euro, e al crescere di n si avvicina a 2,71828 senza superarlo. I numeri di Fibonacci, ognuno somma dei due precedenti, hanno rapporti che oscillano sopra e sotto la sezione aurea e la raggiungono in fretta." },
      { titolo: "Il caso che conosce le costanti", testo: "Nella tavola di Galton ogni pallina fa 12 scelte a caso: il numero di destre segue la binomiale, che per molte prove assomiglia alla normale (teorema centrale del limite). Nell'ago di Buffon la frazione di aghi che tagliano una riga vale 2/π, e lanciandone molti si stima π, con un errore che cala come 1/√N." }
    ],
    formule: [
      ["e^{iθ} = cos θ + i sin θ", "formula di Eulero: per θ = π dà e^{iπ} + 1 = 0"],
      ["e = lim (1 + 1/n)ⁿ", "il numero di Nepero come limite degli interessi composti"],
      ["F(n+1)/F(n) → φ = (1 + √5)/2", "il rapporto fra numeri di Fibonacci consecutivi tende alla sezione aurea"],
      ["|R_n(x)| ≤ |x|^(n+1)/(n+1)!", "resto di Lagrange per sin x e cos x"],
      ["P(incrocio) = 2l/(πd)", "ago di Buffon con l ≤ d"]
    ],
    ipotesi: [
      "I campioni casuali (Galton, Buffon) sono generati con un seme fisso: rifacendo il film escono gli stessi numeri.",
      "Le somme di Riemann usano la funzione sin x + 1,2 su [0, π]: siccome vale lo stesso agli estremi, l'errore della somma sinistra è quello dei trapezi."
    ],
    errori: [
      "Pensare che aggiungendo armoniche l'eccesso di Gibbs sparisca: si restringe, ma la sua altezza resta circa il 9 % del salto.",
      "Credere che un polinomio di Taylor vada bene ovunque: l'approssimazione è buona vicino al punto, e va controllata con il resto."
    ],
    esempio: {
      testo: "Con 1958 aghi su 3000 che tagliano una riga (aghi lunghi quanto la distanza fra le righe), quanto vale la stima di π?",
      risultato: "π ≈ 2·3000/1958 ≈ 3,064, entro due errori standard (~0,043) dal valore vero"
    },
    fonti: [
      "T. W. Körner, Fourier Analysis, Cambridge University Press 1988, capitolo 17 (il fenomeno di Gibbs)",
      "T. M. Apostol, Calculus, vol. 1, 2ª ed., Wiley 1967",
      "W. Feller, An Introduction to Probability Theory and Its Applications, vol. 1, 3ª ed., Wiley 1968",
      "G.-L. Leclerc de Buffon, Essai d'arithmétique morale, 1777"
    ],
    collegamenti: ['smatcalc', 'smatfrenet', 'sanimmech']
  };
  /* ═══ 🧬 Biochimica 3D Lab (v264) ═════════════════════════════════════════ */
  T['sbiolab3d'] = {
    titolo: "Il metabolismo come macchina: enzimi, carboni e il motore che fa l'ATP",
    sintesi: "Il metabolismo si capisce seguendo tre cose: quanto è veloce un enzima e che cosa lo frena (la cinetica), dove va ogni carbonio di una molecola lungo una via, e come l'energia degli elettroni diventa ATP. Il laboratorio le mostra in movimento: gli enzimi che si chiudono sul substrato, le vie metaboliche con i carboni colorati dall'inizio alla fine, e l'ATP sintasi che gira spinta dai protoni mentre un ossigrafo misura l'ossigeno consumato.",
    paragrafi: [
      { titolo: "Michaelis–Menten senza formule da imparare a memoria", testo: "Un enzima lega il substrato, lo trasforma e lo rilascia. Con poco substrato quasi tutti gli enzimi sono liberi e la velocità cresce in proporzione al substrato; con tanto substrato sono tutti occupati e la velocità si ferma a un massimo, Vmax, che dipende solo da quanto enzima c'è e da quanto è rapido (kcat). La Km è la concentrazione di substrato a cui si arriva a metà di Vmax. Nel laboratorio la velocità non è calcolata a parte: si contano i prodotti che escono dagli enzimi occupati, e il numero torna con la formula. Un inibitore competitivo occupa il sito attivo e sposta la curva a destra senza cambiare Vmax; uno non competitivo toglie enzima funzionante e abbassa Vmax; uno incompetitivo blocca solo il complesso enzima–substrato e abbassa entrambe. Gli enzimi allosterici, come la PFK-1, hanno più subunità che si aiutano: la curva diventa una sigmoide." },
      { titolo: "Seguire i carboni", testo: "Ogni via è una catena di piccoli cambiamenti su pochi atomi. Se si dà a ogni carbonio un colore e lo si segue, molte domande d'esame diventano domande di geometria: nella glicolisi l'aldolasi rompe il legame fra C3 e C4, e il carbossile del piruvato viene dai carboni 3 e 4 del glucosio, proprio quello che la piruvato deidrogenasi elimina come CO₂. Nel ciclo di Krebs le due CO₂ di un giro escono dai carboni dell'ossalacetato, non da quelli dell'acetile appena entrato: per questo l'acetil-CoA non può dare glucosio. In ogni passo il numero di carboni si conserva: quelli che spariscono escono come CO₂, quelli che compaiono entrano come bicarbonato." },
      { titolo: "La fosforilazione ossidativa e il motore rotante", testo: "La catena respiratoria pompa protoni dalla matrice allo spazio intermembrana e crea un gradiente. I protoni tornano indietro attraverso l'ATP sintasi: entrano da un semicanale della subunità a, si legano a un glutammato dell'anello c, fanno quasi un giro intero insieme all'anello ed escono dall'altro semicanale. L'anello trascina il fusto γ, che ruota dentro la testa α₃β₃ e cambia a turno la forma delle tre subunità β: una lega ADP e fosfato, una forma l'ATP, una lo rilascia. Nell'uomo l'anello ha 8 subunità: 8 protoni per giro e 3 ATP per giro, cioè 8/3 di protone per ATP più uno per trasportare ADP e fosfato." },
      { titolo: "L'ossigrafo: l'esperimento che dimostra l'accoppiamento", testo: "Un elettrodo di Clark misura l'ossigeno in una camera con mitocondri e substrato. Senza ADP l'ATP sintasi non lavora, il gradiente arriva al massimo e frena la catena: si consuma poco ossigeno. Aggiungendo ADP il motore gira e il consumo sale: è il controllo respiratorio. L'oligomicina blocca il canale del motore e il consumo ricade; un disaccoppiante lascia rientrare i protoni attraverso la membrana, il gradiente crolla e l'ossigeno si consuma più di prima, ma senza ATP; il cianuro blocca il complesso IV e ferma tutto. Il laboratorio riproduce la traccia con un modello qualitativo: i numeri sono indicativi, l'andamento è quello misurato." },
      { titolo: "Come ripassare per l'orale", testo: "La scheda di teoria raccoglie i dodici capitoli della dispensa: per ognuno l'idea in poche righe, i perché, gli errori già fatti davanti al professore e la risposta da dare all'orale, che si può ascoltare. Il metodo consigliato è disegnare ogni via a memoria con enzimi, cofattori e carboni, rifare i conti degli ATP, e ripetere ad alta voce le risposte." }
    ],
    formule: [
      ["V₀ = Vmax[S] / (Km + [S])", "equazione di Michaelis–Menten: velocità iniziale in funzione del substrato"],
      ["1/V₀ = (Km/Vmax)·(1/[S]) + 1/Vmax", "Lineweaver–Burk: una retta che taglia l'asse y in 1/Vmax e l'asse x in −1/Km"],
      ["Km,app = α·Km con α = 1 + [I]/Ki", "inibizione competitiva: aumenta la Km apparente e lascia uguale la Vmax"],
      ["H⁺/ATP = c/3 + 1", "protoni per ATP con un anello di c subunità, più uno per il trasporto"],
      ["ATP(Cn) = 4·(n/2 − 1) + 10·(n/2) − 2", "resa in ATP di un acido grasso saturo con un numero pari n di carboni"]
    ],
    ipotesi: [
      "Le molecole delle vie sono disegnate a catena aperta per leggere i carboni; gli zuccheri in soluzione sono ad anello.",
      "L'ossigrafo e la frazione di enzimi occupati sono modelli qualitativi con numeri indicativi; la rotazione del motore è rallentata e continua."
    ],
    errori: [
      "Dire che l'enzima abbassa il ΔG della reazione: abbassa la barriera ΔG‡, non cambia né ΔG°′ né l'equilibrio.",
      "Dire che l'oligomicina blocca la catena respiratoria: blocca l'ATP sintasi, e la catena rallenta solo di conseguenza."
    ],
    esempio: {
      testo: "Quanti ATP si ottengono dall'acido ottanoico (C8), contando 2,5 ATP per NADH e 1,5 per FADH₂?",
      risultato: "3 giri di β-ossidazione (12 ATP) e 4 acetil-CoA nel Krebs (40 ATP), meno 2 per l'attivazione: 50 ATP"
    },
    fonti: [
      "D. L. Nelson, M. M. Cox, Lehninger Principles of Biochemistry, 8ª ed., W. H. Freeman 2021",
      "P. D. Boyer, The ATP synthase — a splendid molecular machine, Annual Review of Biochemistry 66 (1997) 717",
      "I. N. Watt et al., Bioenergetic cost of making an adenosine triphosphate molecule in animal mitochondria, PNAS 107 (2010) 16823",
      "B. Chance, G. R. Williams, Respiratory enzymes in oxidative phosphorylation, Journal of Biological Chemistry 217 (1955) 383"
    ],
    collegamenti: ['sglic', 'skrebs', 'setc', 'sbeta']
  };
  /* ═══ 🌌 BioSpec Quantum Studio (v265) ═════════════════════════════════════ */
  T['squantum'] = {
    titolo: "Un unico studio per tredici scienze: il modello 3D e il grafico calcolato, insieme",
    sintesi: "Il Quantum Studio tiene in un solo posto tredici aree che di solito stanno su libri diversi, dalla biochimica alla fisica quantistica con gli spazi di Hilbert e le stringhe. Ogni argomento è un modulo: a sinistra il modello 3D con il grafico calcolato dentro il palco, la telemetria e i cursori; a destra l'equazione, la teoria, il focus d'esame e una domanda. Il filo è sempre lo stesso: una legge con pochi parametri che, mossi, cambiano insieme la scena e la curva.",
    paragrafi: [
      { titolo: "Perché un modello e non un disegno", testo: "Un disegno fermo mostra un caso; un modello mostra la legge. Nel Quantum Studio il grafico non è decorativo: viene dalla stessa funzione che muove la scena, ricalcolata a ogni fotogramma. Quando sposti [S] nella cinetica, la curva di Michaelis–Menten e gli enzimi che si chiudono sul substrato cambiano insieme; quando alzi il campo B₀ nell'NMR, i multipletti si stringono in ppm perché la costante di accoppiamento J, in hertz, non dipende dal campo mentre la distanza fra i chemical shift sì. Così un numero che cambia si vede prima come forma e poi come valore, ed è più difficile impararlo sbagliato." },
      { titolo: "Le leggi con pochi parametri", testo: "Quasi ogni modulo è una formula con due o tre manopole. La curva di Morse descrive il legame dell'idrogeno con una buca di profondità Dₑ a una distanza di equilibrio rₑ. La dose–risposta è una sigmoide che un antagonista competitivo sposta a destra di un fattore 1 + [B]/K_B, senza toccare l'effetto massimo. L'equazione di Van Deemter dice qual è il flusso che rende più stretti i picchi in cromatografia. L'energia libera di Gibbs, ΔG = ΔH − TΔS, cambia segno alla temperatura ΔH/ΔS e decide se una reazione è spontanea. La stessa idea torna ovunque: capisci i parametri e hai capito il fenomeno." },
      { titolo: "Dove i conti diventano veri", testo: "Alcuni moduli non illustrano una formula ma eseguono un calcolo completo. L'analisi delle componenti principali ruota per davvero una nube di dati a dieci dimensioni sulle direzioni di massima varianza, trovando gli autovalori della matrice di covarianza: i punti nello spazio tridimensionale sono i punteggi veri sulle prime tre componenti. Il potenziale d'azione è il modello di Hodgkin–Huxley integrato passo per passo: se porti a zero la conduttanza del sodio, come fa la tetrodotossina, il nervo non spara più. La sezione di Calabi–Yau è la curva di Hanson della quintica di Fermat, e ogni punto disegnato soddisfa davvero l'equazione z₁⁵ + z₂⁵ = 1." },
      { titolo: "Lo spazio di Hilbert e le dimensioni in più", testo: "La tredicesima area porta la fisica quantistica e la geometria oltre le tre dimensioni. Lo stato di un qubit è un vettore unitario dello spazio di Hilbert a due dimensioni complesse, che si disegna come un punto sulla sfera di Bloch; un campo risonante lo fa ruotare da |0⟩ a |1⟩ e indietro, le oscillazioni di Rabi. Un ipercubo in n dimensioni ha 2ⁿ vertici e si guarda proiettandolo in tre dimensioni un asse alla volta, come un'ombra: il cubo che sembra «dentro» l'altro è in realtà più lontano lungo la quarta direzione. Nella teoria delle stringhe le sei dimensioni spaziali in più sono arrotolate in una varietà di Calabi–Yau: non si può disegnare, ma una sua sezione sì." },
      { titolo: "Il ponte per Spectra", testo: "Lo studio espone un ponte, SPECTRA_3D_BRIDGE, che l'assistente può usare a voce o per iscritto per aprire un modulo, impostare un parametro o cambiare rappresentazione. Così si può chiedere a Spectra di «aprire la superficie di energia potenziale» o di «portare la temperatura a cinquecento kelvin nell'energia di Gibbs», e lo studio obbedisce mostrando insieme la scena e il grafico." }
    ],
    formule: [
      ["V(r) = Dₑ(1 − e^(−a(r − rₑ)))² − Dₑ", "curva di Morse del legame covalente: buca di profondità Dₑ a distanza rₑ"],
      ["ν₀ = γB₀/2π", "frequenza di Larmor in NMR: proporzionale al campo magnetico"],
      ["E/Eₘₐₓ = [A]/(EC₅₀(1 + [B]/K_B) + [A])", "dose–risposta con antagonista competitivo (Gaddum–Schild)"],
      ["P₁(t) = (Ω²/Ω′²)·sin²(Ω′t/2), Ω′ = √(Ω² + Δ²)", "oscillazioni di Rabi di un qubit nello spazio di Hilbert ℂ²"],
      ["ΔG = ΔH − TΔS = −RT·ln K", "energia libera di Gibbs: spontaneità ed equilibrio"]
    ],
    ipotesi: [
      "Le strutture 3D sono schematiche: forme e scale approssimate, non coordinate atomiche reali.",
      "I valori marcati «indicativo» sono ordini di grandezza da letteratura; gli altri grafici vengono da modelli standard dei libri, non da simulazioni ab initio."
    ],
    errori: [
      "Credere che l'antagonista competitivo abbassi l'effetto massimo: sposta solo la curva a destra, aumentando l'EC₅₀.",
      "Pensare che in quattro dimensioni si ruoti attorno a un asse: si ruota attorno a un piano, che resta fermo."
    ],
    esempio: {
      testo: "Una reazione ha ΔH° = −40 kJ/mol e ΔS° = −100 J/(mol·K). Fino a che temperatura è spontanea?",
      risultato: "Fino a T* = ΔH/ΔS = 40 000/100 = 400 K; sopra, ΔG diventa positivo"
    },
    fonti: [
      "D. L. Nelson, M. M. Cox, Lehninger Principles of Biochemistry, 8ª ed., W. H. Freeman 2021",
      "P. Atkins, J. de Paula, Physical Chemistry, 11ª ed., Oxford University Press 2018",
      "A. L. Hodgkin, A. F. Huxley, A quantitative description of membrane current, Journal of Physiology 117 (1952) 500",
      "A. J. Hanson, A construction for computer visualization of certain complex curves, Notices of the AMS 41 (1994) 1156",
      "M. A. Nielsen, I. L. Chuang, Quantum Computation and Quantum Information, Cambridge University Press 2010"
    ],
    collegamenti: ['sbiolab3d', 'smecc3d', 'snmrpred', 'sorbitali']
  };
  /* ═══ 🎙️ Spectra Prime — voce dal vivo (v267) ═════════════════════════════ */
  T['svocelive'] = {
    titolo: "Parlare con uno strumento: come funziona un assistente vocale full-duplex",
    sintesi: "Spectra Prime è una console che trasforma la voce in comandi e risposte senza turni rigidi: mentre parla puoi interromperla, e mentre spieghi lei apre e regola il laboratorio 3D. Dietro la semplicità c'è una catena precisa: il microfono diventa numeri, i numeri viaggiano su un canale sempre aperto, il modello risponde con audio e con chiamate di funzione, e il browser le esegue sul Quantum Studio. Capire questa catena serve anche fuori di qui: è la stessa di ogni interfaccia vocale moderna.",
    paragrafi: [
      { titolo: "Dal suono ai numeri: campionamento e PCM", testo: "Un microfono misura la pressione dell'aria molte migliaia di volte al secondo. Qui si campiona a 16 kilohertz in mono, un buon compromesso per la voce: il teorema del campionamento di Nyquist dice che per rappresentare un suono fino a una certa frequenza bisogna campionare al doppio, e 16 kHz copre bene la banda della parola. Ogni campione, un numero con la virgola fra meno uno e uno, viene convertito in un intero a 16 bit (PCM): un formato compatto e senza perdita che occupa due byte per campione. Il microfono applica anche cancellazione dell'eco, soppressione del rumore e guadagno automatico, così la voce resta pulita e la macchina non sente se stessa." },
      { titolo: "Perché un AudioWorklet e non il vecchio ScriptProcessor", testo: "Elaborare l'audio nel thread principale della pagina, come faceva il ScriptProcessorNode, significa competere con il disegno e con il resto: bastano un grafico pesante o una scena 3D per introdurre ritardi e scatti. L'AudioWorklet esegue invece il codice in un thread audio dedicato, a priorità alta, che non si ferma mai: la conversione in PCM e la misura dell'energia avvengono lì, puntuali. La console lo crea al volo da una stringa di codice, senza file in più, e se il browser è troppo vecchio ripiega sul ScriptProcessor." },
      { titolo: "Full-duplex e barge-in: interrompere come in una conversazione vera", testo: "«Full-duplex» vuol dire che i due versi, ascolto e parlato, sono aperti insieme, come al telefono e a differenza di una ricetrasmittente. Il vantaggio si sente quando interrompi: la console misura di continuo l'energia della tua voce (un rilevatore di attività vocale, VAD, con una soglia regolabile) e, appena superi la soglia mentre Spectra parla, tronca immediatamente l'audio in uscita, svuota la coda e avvisa il modello. Questo «barge-in» è ciò che rende il dialogo naturale: non devi aspettare che finisca." },
      { titolo: "Riprodurre senza buchi: la coda schedulata", testo: "L'audio della risposta arriva a pezzi, non tutto insieme. Se li suonassi appena arrivano sentiresti click e silenzi. La console tiene un orologio: ogni pezzo viene programmato per iniziare esattamente dove finisce il precedente (una variabile «prossimo istante»), così lo stream esce continuo. L'audio in arrivo è a 24 kilohertz, più alto di quello del microfono, perché la voce sintetica di qualità usa una banda più larga." },
      { titolo: "La voce che agisce: chiamata di funzione e il ponte 3D", testo: "Il modello non risponde solo a parole: può decidere di chiamare una funzione. Alla console sono dichiarati tre strumenti — aprire una sezione, impostare un parametro, cambiare vista — con i loro argomenti. Quando dici «apri l'ATP sintasi e porta il disaccoppiante al settanta per cento», il modello emette due chiamate; il browser le esegue sul ponte del Quantum Studio e rimanda l'esito, mentre la voce spiega. È lo stesso schema del function calling che regge gli agenti di oggi, qui applicato a un laboratorio 3D." }
    ],
    formule: [
      ["f_campionamento ≥ 2 · f_max", "teorema di Nyquist: per la voce bastano 16 kHz"],
      ["PCM Int16 = round(x · 32767), x ∈ [−1, 1]", "da campione in virgola mobile a intero a 16 bit"],
      ["RMS = √(media(x²))", "energia del segnale: la base del rilevatore di attività vocale"],
      ["byte/s = f · bit/8 · canali", "16000 · 16/8 · 1 = 32 kB/s per il flusso del microfono"],
      ["t_inizio = max(t_ora, t_prossimo)", "scheduling continuo dei pezzi audio, senza buchi"]
    ],
    ipotesi: [
      "La «parola di attivazione» qui è una soglia di energia locale, non un riconoscitore di parole: apre il microfono quando parli, non quando dici esattamente «Spectra».",
      "La voce vera richiede un canale «Live» di un fornitore, con la chiave salvata su questo dispositivo o un proxy; la console funziona e si verifica anche senza rete, con un canale simulato."
    ],
    errori: [
      "Credere che full-duplex significhi solo «senza pulsante»: significa che ascolto e parlato sono aperti insieme, ed è questo a permettere il barge-in.",
      "Pensare che il PCM a 16 bit perda qualità come un MP3: è un formato senza perdita; la perdita, semmai, è nella compressione, non nella codifica PCM."
    ],
    esempio: {
      testo: "Un flusso vocale PCM a 16 kHz, 16 bit, mono: quanti kilobyte al secondo occupa?",
      risultato: "16000 × 2 byte = 32 000 byte/s ≈ 32 kB/s (circa 256 kbit/s)"
    },
    fonti: [
      "C. E. Shannon, Communication in the presence of noise, Proceedings of the IRE 37 (1949) 10",
      "W3C, Web Audio API — AudioWorklet (Candidate Recommendation, 2021)",
      "J. Schalkwyk et al., Google's voice search, in: Speech Technologies (2010) — architetture di riconoscimento in streaming",
      "Google, Multimodal Live API — Bidirectional streaming (documentazione per sviluppatori, 2024)"
    ],
    collegamenti: ['squantum', 'sbiolab3d']
  };
  /* ═══ ⚗️ Inorganica quantistica (v268) ═════════════════════════════════════ */
  T['sinorganica'] = {
    titolo: "Quattro modi di guardare un atomo e un legame: Slater, Hückel, SALC e la tripla teoria dei complessi",
    sintesi: "La chimica inorganica avanzata non è una galleria di forme: è un calcolo. Quanto è schermato un elettrone di valenza, come si delocalizzano gli elettroni π, quali orbitali del centrale si combinano con quelli dei leganti, perché un complesso è magnetico o deformato. Questa sezione risolve le quattro domande con i metodi dei testi: le regole di Slater, il determinante secolare di Hückel, le combinazioni adattate alla simmetria con una soglia di energia, e la tripla teoria VBT, campo cristallino e campo dei leganti.",
    paragrafi: [
      { titolo: "Le regole di Slater: carica efficace e dimensione", testo: "Un elettrone di valenza non sente tutta la carica del nucleo: gli elettroni interni la schermano. Le regole di Slater stimano la costante di schermo σ sommando contributi fissi — un elettrone dello stesso gruppo scherma 0,35, uno del guscio n−1 scherma 0,85, uno più interno 1,00, con i d e gli f che fanno gruppo a sé. La carica nucleare efficace è ζ = Z − σ, e con un numero quantico efficace n* dà il raggio più probabile n*²/ζ e il raggio medio idrogenoide: così si capisce perché, lungo un periodo, gli atomi si rimpiccioliscono. Attenzione all'ordine di riempimento: per iodio e xeno il 4f resta vuoto e la valenza è 5s5p." },
      { titolo: "Il metodo di Hückel e la delocalizzazione", testo: "Per gli elettroni π il metodo variazionale cerca le combinazioni degli orbitali p che minimizzano l'energia, risolvendo il determinante secolare: la matrice ha l'energia dell'atomo (α) sulla diagonale e l'integrale di legame (β) fra atomi adiacenti. Gli autovalori sono i livelli E = α + xβ, gli autovettori i coefficienti di ogni orbitale molecolare, normalizzati. Confrontando l'energia totale con quella di doppi legami isolati si ottiene l'energia di delocalizzazione: zero per il butadiene aperto è 0,472β, per il benzene 2β (aromatico), per il ciclobutadiene zero (antiaromatico, diradicale). È la base quantitativa dell'aromaticità." },
      { titolo: "Le SALC e la soglia di energia", testo: "In una molecola ipervalente o interalogena l'atomo centrale ha orbitali ns, np e nd a energie diverse, e i leganti i loro. Non tutti possono combinarsi: due orbitali interagiscono tanto più quanto più sono vicini in energia e giusti per simmetria. Il metodo d'esame fissa una soglia ΔE — per esempio venti o venticinque elettronvolt — e tiene solo le interazioni sotto soglia, separando quelle σ da quelle π. Da lì si costruiscono le combinazioni adattate alla simmetria e si contano gli orbitali leganti, antileganti e di non legame. Spostando la soglia si vede quali legami «si accendono»." },
      { titolo: "La tripla teoria dei complessi", testo: "Un complesso di coordinazione si spiega a tre livelli che non si contraddicono. La teoria del legame di valenza dà l'ibridazione (interna d²sp³ o esterna sp³d²) e il numero atomico effettivo. La teoria del campo cristallino spiega lo splitting degli orbitali d — Δo in ottaedrico, Δt ≈ 4/9 Δo in tetraedrico — e da lì l'alto o basso spin, l'energia di stabilizzazione del campo cristallino, il momento magnetico di spin √(n(n+2)) e le deformazioni di Jahn–Teller. La teoria del campo dei leganti, cioè gli orbitali molecolari, aggiunge ciò che manca: la σ-donazione, la π-donazione dei leganti come il cloruro e la retrodonazione verso i leganti π-accettori come il cianuro e il monossido di carbonio, che allarga il gap e rende i complessi a basso spin e diamagnetici." },
      { titolo: "Perché il calcolo, e non solo la regola", testo: "Ogni risultato qui è ricavato, non memorizzato: il raggio dalla carica efficace, i livelli π dalla diagonalizzazione esatta della matrice, le interazioni dalla differenza di energia, il momento magnetico dal numero di elettroni spaiati. Vedere il numero nascere dal metodo è il modo migliore per non sbagliarlo all'orale — e per accorgersi quando una «regola veloce» di un formulario non torna con il conto fatto bene." }
    ],
    formule: [
      ["ζ = Z − σ", "carica nucleare efficace dalle regole di Slater"],
      ["r_mp = n*² / ζ (a₀)", "raggio più probabile idrogenoide con n* e ζ di Slater"],
      ["det|H_ij − E·S_ij| = 0", "determinante secolare del metodo variazionale di Hückel"],
      ["μ = √(n(n+2)) (BM)", "momento magnetico di spin da n elettroni spaiati"],
      ["Δt ≈ (4/9)·Δo", "splitting tetraedrico rispetto all'ottaedrico"]
    ],
    ipotesi: [
      "Le energie orbitali di valenza in eV sono valori di letteratura (ordini di grandezza); i raggi vengono dalle formule idrogenoidi con ζ e n*, indicativi dove un esame usa convenzioni diverse.",
      "Il conteggio SALC di orbitali leganti, antileganti e di non legame è un modello didattico che conta le interazioni sotto soglia; i numeri esatti di un testo possono differire."
    ],
    errori: [
      "Usare le regole di Slater con il 4f pieno per iodio e xeno: il 4f è vuoto, la valenza è 5s5p.",
      "Dire che il ciclobutadiene è aromatico come il benzene: ha energia di delocalizzazione nulla ed è un diradicale, antiaromatico."
    ],
    esempio: {
      testo: "Per la molecola di benzene, quanto vale l'energia di delocalizzazione calcolata con il metodo di Hückel, rispetto al riferimento di tre doppi legami isolati e localizzati?",
      risultato: "E_π = 6α + 8β contro 6α + 6β: E_deloc = 2β, la stabilità aromatica"
    },
    fonti: [
      "J. C. Slater, Atomic Shielding Constants, Physical Review 36 (1930) 57",
      "E. Hückel, Zur Quantentheorie der Doppelbindung, Zeitschrift für Physik 70 (1931) 204",
      "C. J. Ballhausen, Introduction to Ligand Field Theory, McGraw-Hill 1962",
      "F. A. Cotton, G. Wilkinson, P. L. Gaus, Basic Inorganic Chemistry, 3ª ed., Wiley 1995"
    ],
    collegamenti: ['squantum', 'sorbitali', 'smecc3d']
  };
  /* ═══ ✏️ Arrow Lab e Retrosintesi (v269) ═════════════════════════════════ */
  T['sarrowlab'] = {
    titolo: "Le frecce curve e la retrosintesi: il linguaggio con cui i chimici organici pensano",
    sintesi: "La chimica organica si ragiona con due strumenti grafici. Le frecce curve raccontano un meccanismo: ogni freccia è una coppia di elettroni che si sposta, e tenerne il conto spiega perché i legami si formano e si rompono. La retrosintesi fa il percorso inverso: parte dalla molecola bersaglio e la taglia, disconnessione dopo disconnessione, fino a reagenti semplici. Disegnare le frecce giuste e scegliere la disconnessione migliore è ciò che separa il memorizzare dal capire.",
    paragrafi: [
      { titolo: "Cosa dice davvero una freccia curva", testo: "Una freccia curva a punta intera muove due elettroni; parte sempre da una sorgente di densità elettronica — un doppietto solitario o un legame, mai un atomo «vuoto» — e arriva dove quella coppia formerà un nuovo legame o si poserà come carica. Le mezze frecce muovono un elettrone solo, il linguaggio dei radicali. Contare gli elettroni che si spostano è un controllo severo: se una freccia nasce dal nulla o fa superare l'ottetto, il meccanismo è sbagliato. Nella riduzione del propanone, per esempio, l'idruro porta la sua coppia sul carbonio del carbonile mentre la coppia del doppio legame si ritira sull'ossigeno, che diventa alcossido." },
      { titolo: "Nucleofili, elettrofili e gruppi uscenti", testo: "Il meccanismo è una storia di opposti che si attraggono. Il nucleofilo è ricco di elettroni e li offre: un anione, un doppietto, un legame π. L'elettrofilo è povero di elettroni e li accetta: un carbonio di un carbonile, un carbonio legato a un buon gruppo uscente. Il gruppo uscente è un frammento che se ne va portandosi la coppia di legame, tanto meglio quanto più stabile diventa da solo: il bromuro è un ottimo gruppo uscente, l'ossidrile no. Nella sostituzione SN2 il nucleofilo attacca dal lato opposto al gruppo uscente, nello stesso istante in cui questo parte, e il carbonio si rovescia come un ombrello." },
      { titolo: "Pensare all'indietro: la retrosintesi", testo: "Progettare una sintesi guardando avanti, per tentativi, è difficile; Corey propose di guardare indietro. Si parte dalla molecola bersaglio e la si «disconnette»: si immagina di rompere un legame strategico, ottenendo frammenti più semplici detti sintoni, a cui corrispondono reagenti reali. Ogni disconnessione è una reazione nota letta al contrario, più eventuali interconversioni di gruppo funzionale che aggiustano l'ossidazione. Ripetendo si arriva a building block disponibili. Spesso ci sono più strade per lo stesso bersaglio: confrontarle è parte del mestiere." },
      { titolo: "Scegliere la strada: economia atomica e chimica verde", testo: "Non tutti i percorsi che funzionano sulla carta sono buoni. L'economia atomica misura quanta parte dei reagenti finisce nel prodotto invece che negli scarti; una reazione che non produce sali stechiometrici e usa un catalizzatore recuperabile vale più di una che consuma un metallo in quantità stechiometrica. Il numero di passaggi conta: ogni stadio perde resa e aggiunge costi. Un pianificatore utile mostra accanto a ogni percorso il punteggio di «chimica verde», i building block necessari e se li hai in inventario." },
      { titolo: "Perché esercitarsi disegnando", testo: "Leggere un meccanismo già disegnato dà l'illusione di averlo capito; disegnarlo da soli svela i buchi. Uno strumento che accetta solo le frecce giuste, e dice quali mancano o sono di troppo, allena l'occhio a vedere dove sono gli elettroni e dove vogliono andare. È lo stesso per la retrosintesi: provare più disconnessioni sullo stesso bersaglio, con un inventario e un filtro di sostenibilità, insegna a scegliere, non solo a ricordare." }
    ],
    formule: [
      ["Nu:⁻ + E⁺ → Nu–E", "una freccia curva: la coppia del nucleofilo forma il legame con l'elettrofilo"],
      ["freccia intera = 2 e⁻ · mezza freccia = 1 e⁻", "il conto degli elettroni che si spostano"],
      ["v = k[Nu⁻][R–X]", "cinetica della SN2: secondo ordine, concertata"],
      ["economia atomica = M(prodotto) / Σ M(reagenti)", "la frazione di massa che finisce nel prodotto"],
      ["bersaglio ⇒ sintoni ⇒ reagenti", "la logica retrosintetica di Corey, letta all'indietro"]
    ],
    ipotesi: [
      "I meccanismi e i percorsi dello strumento sono schematici e a scopo didattico; le posizioni degli atomi sono disegnate, non ottimizzate.",
      "I punteggi di «chimica verde» sono indicativi (atom economy, catalisi, stechiometria), non una misura di laboratorio."
    ],
    errori: [
      "Far partire una freccia curva da un atomo invece che da una coppia di elettroni (doppietto o legame): la freccia nasce sempre dalla densità elettronica.",
      "Credere che la retrosintesi dia una sola risposta: quasi sempre esistono più disconnessioni valide, da confrontare per passaggi e sostenibilità."
    ],
    esempio: {
      testo: "Nella riduzione del propanone con il boroidruro di sodio, quante frecce curve servono per descrivere il primo stadio, l'attacco dell'idruro al carbonile?",
      risultato: "Due: una da H:⁻ al carbonio, una dal legame π del C=O verso l'ossigeno"
    },
    fonti: [
      "E. J. Corey, X.-M. Cheng, The Logic of Chemical Synthesis, Wiley 1989",
      "J. Clayden, N. Greeves, S. Warren, Organic Chemistry, 2ª ed., Oxford University Press 2012",
      "B. M. Trost, The atom economy — a search for synthetic efficiency, Science 254 (1991) 1471",
      "P. Anastas, J. Warner, Green Chemistry: Theory and Practice, Oxford University Press 1998"
    ],
    collegamenti: ['smecc3d', 'sinorganica', 'squantum']
  };

  T['smetodi'] = {
    titolo: "Metodi fisici in chimica organica: come IR, NMR, MS e UV-Vis dicono la struttura",
    sintesi: "Determinare una struttura organica significa far parlare quattro spettroscopie e metterle d'accordo. L'IR vede i legami che vibrano, e la legge di Hooke spiega a quale numero d'onda. L'NMR conta e colloca gli idrogeni e i carboni, con la frequenza di Larmor e l'accoppiamento che segue l'angolo diedro di Karplus. La spettrometria di massa pesa la molecola e i suoi frammenti. L'UV-Vis misura la coniugazione. Nessuna da sola basta: la struttura è l'unica ipotesi coerente con tutti i dati insieme.",
    paragrafi: [
      { titolo: "L'infrarosso e la legge di Hooke", testo: "Un legame covalente si comporta come due masse unite da una molla: vibra a una frequenza che dipende da quanto è rigida la molla, la costante di forza k, e da quanto sono pesanti le masse, riassunte nella massa ridotta. Da qui il numero d'onda cresce con l'ordine di legame — un triplo assorbe più in alto di un doppio e di un singolo — e scende se le masse aumentano. È per questo che sostituire l'idrogeno con il deuterio abbassa nettamente l'assorbimento, pur lasciando k invariata: cambia solo la massa. La coniugazione e gli effetti elettronici spostano il carbonile di qualche decina di cm⁻¹, e il legame a idrogeno allarga la banda dell'ossidrile." },
      { titolo: "La risonanza magnetica nucleare", testo: "In un campo magnetico i nuclei di spin un mezzo precedono alla frequenza di Larmor, proporzionale al campo. Lo spostamento chimico, espresso in parti per milione, è indipendente dallo strumento, mentre la separazione in hertz cresce con il campo: ecco perché gli spettrometri più potenti separano meglio i segnali. L'accoppiamento tra nuclei vicini apre i segnali in multipletti la cui ampiezza, per i protoni a tre legami, segue l'equazione di Karplus e dipende dall'angolo diedro. L'anisotropia magnetica degli anelli aromatici, dei carbonili e dei tripli legami sposta i segnali in modo diagnostico, e le sequenze APT e DEPT distinguono i carboni per numero di idrogeni." },
      { titolo: "La spettrometria di massa", testo: "La molecola viene ionizzata e pesata: lo ione molecolare dà la massa, e la regola dell'azoto lega la parità di quella massa al numero di atomi di azoto. I frammenti raccontano come la molecola si rompe: la scissione che lascia la carica sul frammento più stabile secondo Stevenson, il riarrangiamento di McLafferty con il suo trasferimento di idrogeno in gamma attraverso uno stato a sei termini, le perdite neutre tipiche come acqua, metile o monossido di carbonio. L'alta risoluzione, misurando il difetto di massa, arriva a scegliere la formula bruta." },
      { titolo: "L'ultravioletto-visibile e la coniugazione", testo: "L'assorbimento nell'ultravioletto nasce da transizioni elettroniche: le più intense portano un elettrone da un orbitale di legame pi greco a uno di antilegame, le più deboli partono da un doppietto non condiviso. Più il sistema coniugato è esteso, più piccolo è il salto di energia e più il massimo di assorbimento si sposta verso il visibile. Le regole di Woodward-Fieser mettono tutto questo in conto: a una lunghezza d'onda di base, propria del diene o dell'enone, si sommano incrementi per ogni doppio legame esteso e per i sostituenti, ottenendo una stima del massimo." },
      { titolo: "Mettere tutto d'accordo: le tracce d'esame", testo: "Una traccia d'esame fornisce formula e spettri e chiede la struttura. Il metodo onesto parte da ciò che i dati impongono senza interpretazione: i gradi di insaturazione dalla formula, la massa attesa, i gruppi che l'IR vede con certezza. Poi si aggiungono le deduzioni più fragili, dichiarandole come ipotesi. Lo strumento dell'app non indovina: calcola ciò che è aritmetica, assegna le bande e le regioni di spostamento con le tabelle, e dice sempre quali dati non ha usato, perché una conclusione costruita su metà dei dati può essere sbagliata con tutti i passaggi giusti." }
    ],
    formule: [
      ["ν̃ = (1/2πc)·√(k/μ)", "il numero d'onda di stretching IR, con k costante di forza e μ massa ridotta del legame"],
      ["μ = m₁·m₂/(m₁+m₂)", "la massa ridotta, che da sola spiega l'effetto isotopico fra C–H e C–D"],
      ["ν₀ = γ·B₀/2π", "la frequenza di Larmor: la risonanza NMR cresce con il campo magnetico applicato"],
      ["³J(φ) = A + B·cosφ + C·cos2φ", "l'equazione di Karplus lega l'accoppiamento vicinale all'angolo diedro"],
      ["λmax = base + Σ incrementi", "le regole additive di Woodward-Fieser per dieni ed enoni coniugati"],
      ["IHD = 1 + Σ nᵢ(vᵢ−2)/2", "i gradi di insaturazione ricavati dalla sola formula bruta"]
    ],
    ipotesi: [
      "I calcoli di Hooke e di Woodward-Fieser sono modelli (oscillatore armonico, regole empiriche additive): danno stime indicative, non misure di laboratorio.",
      "Le tabelle di correlazione sono condivise con il resto dell'app (un'unica base di conoscenza): questa sezione le usa, non le riscrive."
    ],
    errori: [
      "Fidarsi di una sola tecnica: la struttura va confermata incrociando IR, NMR, MS e UV-Vis, non decisa da uno spettro solo.",
      "Dimenticare la regola dell'azoto o leggere male lo ione molecolare, scambiando un frammento per il picco di massa."
    ],
    esempio: {
      testo: "Perché il legame C–H assorbe intorno a 3000 cm⁻¹ e il C–D molto più in basso, pur avendo la stessa costante di forza?",
      risultato: "Perché cambia solo la massa ridotta (μ ≈ 1,71 per C–D contro 0,92 per C–H) e ν̃ ∝ 1/√μ, così la frequenza scende di circa 1,36 volte (≈2225 contro ≈3030 cm⁻¹)"
    },
    fonti: [
      "R. M. Silverstein, F. X. Webster, D. J. Kiemle, Spectrometric Identification of Organic Compounds, 7ª ed., Wiley 2005",
      "E. Pretsch, P. Bühlmann, M. Badertscher, Structure Determination of Organic Compounds, 4ª ed., Springer 2009",
      "D. L. Pavia, G. M. Lampman, G. S. Kriz, Introduction to Spectroscopy, 5ª ed., Cengage 2015",
      "J. B. Lambert et al., Organic Structural Spectroscopy, 2ª ed., Pearson 2011"
    ],
    collegamenti: ['sinorganica', 'squantum', 'sarrowlab']
  };
})(typeof window !== 'undefined' ? window : globalThis);
