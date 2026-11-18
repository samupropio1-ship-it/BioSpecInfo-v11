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
})(typeof window !== 'undefined' ? window : globalThis);
