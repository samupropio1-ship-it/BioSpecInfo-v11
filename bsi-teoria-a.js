/* bsi-teoria-a.js — teoria delle sezioni (lotto A). BioSpecInfo · © Samuele Pio Provenzano */
(function (g) {
  'use strict';
  var T = g.BSITeoriaDati = g.BSITeoriaDati || {};

  T['smol'] = {
    titolo: 'Identità di una molecola: formula, rappresentazioni e descrittori',
    sintesi: 'Una molecola si identifica in modi complementari: con la formula bruta e la massa molare, con un grafo di atomi e legami (scritto come SMILES o InChI), con la sua geometria tridimensionale e la stereochimica, e con un insieme di descrittori calcolati. Ognuna di queste descrizioni risponde a domande diverse e nessuna, da sola, basta a caratterizzare una sostanza.',
    paragrafi: [
      { titolo: 'Formula bruta, massa molare e massa monoisotopica', testo: 'La formula bruta conta gli atomi di ciascun elemento e si scrive, per convenzione (ordine di Hill), con C e H in testa e gli altri elementi in ordine alfabetico. La massa molare si ottiene sommando i pesi atomici standard IUPAC, che sono medie pesate sulle abbondanze isotopiche naturali: per questo vale per un campione macroscopico, non per la singola molecola. In spettrometria di massa conta invece la massa monoisotopica, calcolata con l’isotopo più abbondante di ogni elemento (¹²C = 12 u esatte, ¹H = 1,007825 u, ¹⁶O = 15,994915 u): per l’aspirina la massa molare è 180,16 g/mol, la monoisotopica 180,0423 u.' },
      { titolo: 'Il grafo molecolare: SMILES e InChI', testo: 'Per un calcolatore una molecola è un grafo: gli atomi sono nodi, i legami sono archi. Lo SMILES (Weininger, 1988) scrive questo grafo come stringa lineare: le lettere sono atomi, le parentesi tonde aprono rami, i numeri chiudono anelli, le minuscole indicano atomi aromatici e i simboli @ e @@ codificano la configurazione dei centri stereogenici. Una stessa molecola ammette molti SMILES diversi; quello canonico, generato da un algoritmo deterministico, serve a confrontare strutture. L’InChI, standard IUPAC, è invece unico per costruzione ed è stratificato: connettività, idrogeni, carica, stereochimica. Lo InChIKey ne è un’impronta di 27 caratteri, comoda per la ricerca nei database.' },
      { titolo: 'Geometria tridimensionale e chiralità', testo: 'Il grafo non dice come la molecola occupa lo spazio. Le coordinate 3D si ottengono da strutture cristallografiche o da calcoli (meccanica molecolare, metodi quantistici) e dipendono dalla conformazione scelta. Un atomo con quattro sostituenti diversi è un centro stereogenico: la sua configurazione si assegna R o S con le regole di priorità di Cahn, Ingold e Prelog, che ordinano i sostituenti per numero atomico decrescente e confrontano strato per strato in caso di parità. Due enantiomeri hanno le stesse proprietà scalari (punto di fusione, spettri IR e NMR in ambiente achirale), ma ruotano la luce polarizzata in versi opposti e interagiscono in modo diverso con recettori ed enzimi, che sono chirali.' },
      { titolo: 'Descrittori calcolati: logP, TPSA, donatori e accettori', testo: 'I database come PubChem affiancano alla struttura alcuni descrittori. Il coefficiente di ripartizione ottanolo/acqua, espresso come logP, misura la lipofilia; i valori mostrati sono stime (per esempio XLogP3, un metodo additivo per atomi e frammenti con correzioni) e possono scostarsi di mezza unità o più dal dato sperimentale. La TPSA (area polare topologica, Ertl 2000) somma contributi tabulati degli atomi di N e O e dei loro idrogeni e correla con l’assorbimento intestinale e il passaggio della barriera ematoencefalica. Il numero di donatori e accettori di legame a idrogeno e quello dei legami ruotabili completano il quadro usato nelle regole di drug-likeness.' },
      { titolo: 'Macromolecole: il dato strutturale e la sua qualità', testo: 'Per le proteine l’identificativo è il codice PDB di quattro caratteri, che rimanda a un modello atomico depositato con il metodo con cui è stato ottenuto: diffrazione di raggi X, risonanza magnetica nucleare o criomicroscopia elettronica. Per i modelli cristallografici e di cryo-EM il parametro di qualità principale è la risoluzione, in ångström: sotto 2 Å si distinguono bene le catene laterali e molte molecole d’acqua, intorno a 3 Å si vede l’andamento della catena ma i dettagli fini sono interpretazioni del modello. Un modello PDB è sempre una ricostruzione che ottimizza l’accordo con i dati sperimentali, non una fotografia.' }
    ],
    formule: [
      ['M = Σᵢ nᵢ · Aᵣ,ᵢ', 'massa molare (g/mol): nᵢ numero di atomi dell’elemento i, Aᵣ,ᵢ peso atomico standard'],
      ['w(E) = n(E) · Aᵣ(E) / M', 'frazione in massa dell’elemento E nel composto, cioè la composizione percentuale divisa per 100'],
      ['logP = log₁₀ (c_ottanolo / c_acqua)','coefficiente di ripartizione della specie neutra tra 1-ottanolo e acqua all’equilibrio, adimensionale'],
      ['m(mono) = Σᵢ nᵢ · m(isotopo più abbondante)ᵢ', 'massa monoisotopica in unità di massa atomica u, quella del picco M⁺ in spettrometria di massa']
    ],
    ipotesi: [
      'I pesi atomici standard valgono per abbondanze isotopiche naturali; per composti marcati o arricchiti la massa molare va ricalcolata.',
      'logP, TPSA e conteggi di donatori e accettori sono stime da modelli additivi: utili per confronti e filtri, non sostituti di misure.',
      'logP si riferisce alla specie neutra; per acidi e basi ionizzabili a pH fisiologico la grandezza pertinente è logD, che dipende dal pH.',
      'Una geometria 3D mostrata è una conformazione tra molte possibili, non l’unica forma della molecola in soluzione.'
    ],
    errori: [
      'Confondere massa molare e massa monoisotopica: in uno spettro di massa ad alta risoluzione il picco molecolare dell’aspirina cade a 180,042, non a 180,16.',
      'Credere che due SMILES diversi indichino molecole diverse: la stessa struttura ha molte scritture valide, solo il confronto delle forme canoniche (o degli InChI) è affidabile.',
      'Assegnare R o S guardando la rotazione ottica: il descrittore CIP è geometrico, il segno (+) o (−) è sperimentale e i due non sono correlati in modo semplice.'
    ],
    esempio: {
      testo: 'Calcolare la massa molare dell’aspirina, C₉H₈O₄, e la percentuale in massa di carbonio. Con i pesi atomici C = 12,011, H = 1,008, O = 15,999: M = 9 · 12,011 + 8 · 1,008 + 4 · 15,999 = 108,099 + 8,064 + 63,996 = 180,159 g/mol. La frazione di carbonio è 108,099 / 180,159 = 0,6000, cioè 60,00 %. Un’analisi elementare che trovi C = 59,9 % è quindi in accordo con la formula entro l’incertezza tipica di ±0,3 %.',
      risultato: 'M = 180,16 g/mol; C = 60,00 % in massa'
    },
    fonti: [
      'Weininger D., SMILES, a chemical language and information system, J. Chem. Inf. Comput. Sci. 28 (1988) 31.',
      'Ertl P., Rohde B., Selzer P., Fast calculation of molecular polar surface area as a sum of fragment-based contributions, J. Med. Chem. 43 (2000) 3714.',
      'Clayden J., Greeves N., Warren S., Organic Chemistry, Oxford University Press, 2ª ed., cap. 14 (stereochimica) e cap. 2 (rappresentazione delle strutture).',
      'IUPAC, Compendium of Chemical Terminology (Gold Book), voci «relative molecular mass» e «monoisotopic mass spectrum».'
    ],
    collegamenti: ['smolprop', 'scheminfo', 'sdbe', 'scentro', 's3dpro']
  };

  T['spt'] = {
    titolo: 'La tavola periodica: configurazioni elettroniche e proprietà periodiche',
    sintesi: 'La tavola periodica ordina gli elementi per numero atomico Z e li raggruppa secondo la configurazione elettronica di valenza. Le grandezze che mostra la sezione, cioè raggio atomico, energia di prima ionizzazione, elettronegatività e stati di ossidazione, variano in modo regolare lungo periodi e gruppi perché dipendono dalla carica nucleare efficace sentita dagli elettroni più esterni.',
    paragrafi: [
      { titolo: 'Periodi, gruppi e blocchi', testo: 'Il periodo corrisponde al numero quantico principale del guscio di valenza; il gruppo, nella numerazione IUPAC da 1 a 18, raccoglie elementi con configurazione di valenza analoga e quindi chimica simile. I blocchi s, p, d e f indicano il tipo di orbitale che si riempie per ultimo secondo il principio di Aufbau. L’ordine di riempimento segue in prima approssimazione la regola di Madelung (n + ℓ crescente, a parità il minore n), ma esistono eccezioni dovute alla stabilità delle sottoshell semipiene o piene: il cromo è [Ar]3d⁵4s¹ e il rame [Ar]3d¹⁰4s¹, come riporta la sezione.' },
      { titolo: 'Carica nucleare efficace e regole di Slater', testo: 'Un elettrone esterno non sente l’intera carica Z del nucleo, perché gli elettroni interni la schermano. Si scrive Z_eff = Z − σ, dove σ è la costante di schermo. Le regole di Slater (1930) la stimano in modo semplice: per un elettrone ns o np, ciascun altro elettrone dello stesso gruppo contribuisce 0,35, ciascuno del guscio n − 1 contribuisce 0,85 e quelli più interni 1,00. Lungo un periodo Z cresce di uno a ogni passo mentre σ cresce meno, quindi Z_eff aumenta; scendendo in un gruppo aumenta n e gli elettroni di valenza stanno mediamente più lontani dal nucleo.' },
      { titolo: 'Raggio, ionizzazione ed elettronegatività', testo: 'Le tendenze principali discendono da Z_eff e da n. Il raggio atomico diminuisce da sinistra a destra e aumenta dall’alto in basso; l’energia di prima ionizzazione segue l’andamento opposto, con irregolarità spiegabili (il boro ionizza più facilmente del berillio perché perde un elettrone 2p, l’ossigeno più facilmente dell’azoto perché perde un elettrone appaiato). L’elettronegatività di Pauling, ricavata dalle energie di legame, cresce verso il fluoro (3,98). Il raggio atomico non ha una definizione unica: covalente, metallico, di van der Waals o calcolato danno numeri diversi per lo stesso elemento, e un valore tabulato va sempre letto con la sua definizione.' },
      { titolo: 'Stati di ossidazione e metalli di transizione', testo: 'Lo stato di ossidazione è la carica formale che un atomo avrebbe se tutti i legami fossero ionici. Gli elementi dei gruppi principali tendono a stati che raggiungono configurazioni di gas nobile o che usano tutti gli elettroni di valenza, con stati inferiori di due unità frequenti negli elementi pesanti del blocco p (effetto della coppia inerte, per esempio Pb²⁺ e Tl⁺). I metalli di transizione mostrano più stati perché gli orbitali (n − 1)d e ns hanno energie vicine; nei loro cationi gli elettroni ns si perdono per primi, così Fe²⁺ è d⁶ e non 3d⁴4s².' },
      { titolo: 'Masse atomiche e loro incertezza', testo: 'Il peso atomico riportato è una media pesata sulle abbondanze isotopiche naturali, pubblicata e periodicamente rivista dalla IUPAC. Per alcuni elementi, come H, C, N e O, l’abbondanza isotopica varia con l’origine del campione e la IUPAC fornisce un intervallo; il valore singolo usato nei calcoli (per esempio 12,011 per il carbonio) è un valore convenzionale. Per gli elementi senza isotopi stabili si indica fra parentesi il numero di massa dell’isotopo più longevo, e il dato non è un peso atomico in senso stretto.' }
    ],
    formule: [
      ['Z_eff = Z − σ', 'carica nucleare efficace sentita da un elettrone; σ costante di schermo stimata con le regole di Slater'],
      ['E(n) ≈ −13,6 eV · Z_eff² / n²', 'stima di tipo idrogenoide dell’energia di un elettrone; utile solo per tendenze qualitative'],
      ['χ(A) − χ(B) = 0,102 · √Δ', 'scala di Pauling: Δ in kJ/mol è l’eccesso dell’energia del legame A–B rispetto alla media delle energie A–A e B–B (aritmetica nella formulazione originale, geometrica in quella successiva)']
    ],
    ipotesi: [
      'Le regole di Slater sono empiriche e producono stime approssimate di Z_eff; i valori di Clementi e Raimondi, ricavati da funzioni d’onda, sono più accurati.',
      'L’ordine di Madelung descrive gli atomi neutri allo stato fondamentale, non gli ioni né gli stati eccitati.',
      'Elettronegatività e raggi hanno più scale e definizioni: si confrontano solo valori della stessa scala.'
    ],
    errori: [
      'Scrivere Fe²⁺ come [Ar]3d⁴4s²: nei cationi dei metalli di transizione si rimuovono prima gli elettroni 4s.',
      'Pensare che l’energia di ionizzazione cresca in modo perfettamente monotono lungo il periodo: le discontinuità tra i gruppi 2 e 13 e tra 15 e 16 sono reali e spiegate dalla struttura delle sottoshell.',
      'Confrontare un raggio covalente con un raggio di van der Waals come se fossero la stessa grandezza.'
    ],
    esempio: {
      testo: 'Stimare con le regole di Slater la carica nucleare efficace sull’elettrone 3s del sodio (Z = 11, configurazione 1s² 2s² 2p⁶ 3s¹). Non ci sono altri elettroni nel gruppo 3s, quindi il contributo dello stesso guscio è zero. Gli 8 elettroni con n = 2 contribuiscono 8 · 0,85 = 6,80; i 2 elettroni 1s contribuiscono 2 · 1,00 = 2,00. Dunque σ = 8,80 e Z_eff = 11 − 8,80 = 2,20. Il valore basso spiega perché l’elettrone 3s si perde facilmente.',
      risultato: 'Z_eff(3s, Na) ≈ 2,2'
    },
    fonti: [
      'Housecroft C. E., Sharpe A. G., Inorganic Chemistry, Pearson, 5ª ed., cap. 1 (struttura atomica) e cap. 1.9 sulle regole di Slater.',
      'Slater J. C., Atomic shielding constants, Phys. Rev. 36 (1930) 57.',
      'Greenwood N. N., Earnshaw A., Chemistry of the Elements, Butterworth-Heinemann, 2ª ed., cap. 2 (periodicità).',
      'Prohaska T. et al., Standard atomic weights of the elements 2021 (IUPAC Technical Report), Pure Appl. Chem. 94 (2022) 573.'
    ],
    collegamenti: ['sqm', 'sinorg', 'scft', 'svsepr', 'smo']
  };

  T['ssyn'] = {
    titolo: 'Sintesi organica: classi di reazioni, meccanismi e resa',
    sintesi: 'Una sintesi organica è una sequenza di reazioni che trasforma materiali disponibili nel prodotto voluto. Per sceglierla bisogna conoscere le grandi classi di reazioni, il flusso di elettroni che le governa (disegnato con le frecce curve), i fattori che controllano chemo-, regio- e stereoselettività e le misure di efficienza come la resa e l’economia atomica.',
    paragrafi: [
      { titolo: 'Nucleofili, elettrofili e frecce curve', testo: 'Quasi tutte le reazioni polari si leggono come l’incontro di un nucleofilo, che dona una coppia di elettroni da un orbitale pieno ad alta energia (un doppietto libero, un legame π, un legame C–metallo), con un elettrofilo, che la accetta in un orbitale vuoto a bassa energia (un orbitale p vuoto, un π* di un carbonile, un σ* C–alogeno). Ogni freccia curva parte da una coppia di elettroni e arriva dove si forma il nuovo legame o la nuova coppia; la mezza freccia indica il movimento di un singolo elettrone nelle reazioni radicaliche. Le frecce descrivono il formalismo dei meccanismi, non una traiettoria fisica degli elettroni.' },
      { titolo: 'Le grandi famiglie di reazioni', testo: 'Le reazioni elencate nella sezione si raggruppano per tipo di legame formato o modificato. Le reazioni di formazione del legame C–C (Grignard, aldolica, Wittig, accoppiamenti catalizzati da palladio) costruiscono lo scheletro. Riduzioni e ossidazioni cambiano lo stato di ossidazione del carbonio senza modificare lo scheletro. Le sostituzioni (SN1, SN2, sostituzione elettrofila e nucleofila aromatica) scambiano gruppi; le eliminazioni creano legami multipli; i riarrangiamenti spostano atomi all’interno della molecola; le reazioni pericicliche, come la Diels–Alder, procedono attraverso uno stato di transizione ciclico concertato. I gruppi protettori mascherano temporaneamente una funzione che altrimenti reagirebbe.' },
      { titolo: 'Selettività', testo: 'Una buona reazione di sintesi non deve solo funzionare, ma colpire il punto giusto. La chemoselettività distingue tra gruppi funzionali diversi (NaBH₄ riduce un chetone ma non un estere nelle condizioni usuali); la regioselettività sceglie tra posizioni diverse dello stesso gruppo (l’addizione di HBr al propene dà soprattutto 2-bromopropano); la stereoselettività favorisce uno stereoisomero, e diventa enantioselettività quando si usano catalizzatori o ausiliari chirali. Spesso la selettività dipende dal controllo cinetico (vince il prodotto che si forma più in fretta, a bassa temperatura e tempi brevi) o termodinamico (vince il prodotto più stabile, quando la reazione è reversibile).' },
      { titolo: 'Resa, economia atomica e sequenze', testo: 'La resa percentuale confronta le moli di prodotto isolato con quelle teoricamente ottenibili dal reagente limitante. L’economia atomica, proposta da Trost, misura invece quanta parte della massa dei reagenti finisce nel prodotto secondo l’equazione bilanciata: un’addizione o una cicloaddizione arrivano al 100 %, una Wittig produce un equivalente di ossido di trifenilfosfina e ha un’economia bassa. In una sequenza lineare le rese si moltiplicano, per cui dieci passaggi all’80 % danno appena il 10,7 % complessivo; per questo si preferiscono sequenze brevi e convergenti.' },
      { titolo: 'Dalla reazione alla pratica di laboratorio', testo: 'Condizioni, solvente e lavorazione decidono il risultato quanto il meccanismo. I reattivi di Grignard e gli organolitio richiedono solventi aprotici anidri, perché l’acqua li protona istantaneamente. Le reazioni in equilibrio, come l’esterificazione di Fischer, si spingono verso i prodotti usando un eccesso di un reagente o rimuovendo l’acqua. Le banche dati di reazioni consentono di cercare procedure sperimentali già pubblicate, che restano il riferimento per quantità, temperature e tempi.' }
    ],
    formule: [
      ['resa % = 100 · n(prodotto isolato) / n(teorica)', 'n in moli; la quantità teorica deriva dal reagente limitante e dai coefficienti stechiometrici'],
      ['EA % = 100 · M(prodotto) / Σ M(reagenti)', 'economia atomica: masse molari pesate per i coefficienti dell’equazione bilanciata'],
      ['resa globale = Πᵢ resaᵢ', 'in una sequenza lineare la resa complessiva è il prodotto delle rese dei singoli passaggi (in frazione)'],
      ['k₁/k₂ = exp(ΔΔG‡ / RT)', 'rapporto fra due vie competitive sotto controllo cinetico; ΔΔG‡ differenza delle energie libere di attivazione in J/mol']
    ],
    ipotesi: [
      'La resa misura quanto prodotto si isola, non la purezza: va sempre accompagnata da un controllo (punto di fusione, NMR, cromatografia).',
      'L’economia atomica considera solo l’equazione stechiometrica e ignora solventi, reagenti in eccesso e scarti di purificazione, che misure come il fattore E includono.',
      'Le regole di selettività (Markovnikov, Zaitsev, endo) sono generalizzazioni con eccezioni importanti legate a substrato e condizioni.'
    ],
    errori: [
      'Calcolare la resa rispetto al reagente in eccesso invece che rispetto al limitante.',
      'Leggere le frecce curve al contrario, partendo dall’elettrofilo: la freccia parte sempre dagli elettroni.',
      'Credere che una reazione con alta resa sia anche «verde»: una resa del 95 % può accompagnarsi a un’economia atomica bassa.'
    ],
    esempio: {
      testo: 'Esterificazione di Fischer: 10,0 g di acido acetico (M = 60,05 g/mol) con etanolo in eccesso danno 11,0 g di acetato di etile (M = 88,11 g/mol). Moli di acido: 10,0 / 60,05 = 0,1665 mol, che sono anche le moli teoriche di estere. Moli ottenute: 11,0 / 88,11 = 0,1248 mol. Resa = 0,1248 / 0,1665 = 75,0 %. Economia atomica di CH₃COOH + C₂H₅OH → CH₃COOC₂H₅ + H₂O: 88,11 / (60,05 + 46,07) = 0,830, cioè 83,0 %.',
      risultato: 'resa 75,0 %; economia atomica 83,0 %'
    },
    fonti: [
      'Clayden J., Greeves N., Warren S., Organic Chemistry, Oxford University Press, 2ª ed., cap. 5 (reazioni organiche e frecce curve) e cap. 12 (equilibri, velocità e meccanismi).',
      'Carey F. A., Sundberg R. J., Advanced Organic Chemistry, Part B: Reactions and Synthesis, Springer, 5ª ed.',
      'Trost B. M., The atom economy — a search for synthetic efficiency, Science 254 (1991) 1471.'
    ],
    collegamenti: ['sretro', 'sanimmech', 'shammett', 'skin']
  };

  T['sretro'] = {
    titolo: 'Analisi retrosintetica: disconnessioni, sintoni e reagenti equivalenti',
    sintesi: 'La retrosintesi, formalizzata da E. J. Corey, progetta una sintesi partendo dalla molecola bersaglio e procedendo all’indietro: si rompono idealmente i legami chiave (disconnessioni), si ottengono frammenti ideali chiamati sintoni e a ciascuno si associa un reagente reale. Ripetendo il procedimento si costruisce un albero che termina in materiali disponibili.',
    paragrafi: [
      { titolo: 'La freccia retrosintetica e la disconnessione', testo: 'La freccia retrosintetica ⇒ significa «si può ottenere da» e va dal bersaglio verso i precursori. Una disconnessione è l’operazione inversa di una reazione nota: si spezza un legame solo se esiste una reazione affidabile che lo forma. Prima di disconnettere conviene spesso un’interconversione di gruppo funzionale (FGI), per esempio vedere un’ammina come il prodotto di riduzione di un’ammide, o un alogenuro come derivato di un alcol. La qualità di una disconnessione si giudica dalla semplicità dei precursori e dall’affidabilità della reazione corrispondente, non dall’eleganza del disegno.' },
      { titolo: 'Sintoni e reagenti equivalenti', testo: 'Una disconnessione polare produce due sintoni di carica opposta: un frammento nucleofilo (formalmente un anione) e uno elettrofilo (formalmente un catione). I sintoni non esistono come tali: si sceglie per ciascuno un reagente equivalente. Il carbanione R⁻ diventa un reattivo di Grignard RMgBr o un organolitio; il catione acilico RCO⁺ diventa un cloruro acilico o un estere; il sintone «⁻CH₂CHO» diventa l’enolato dell’acetaldeide. Quando la polarità naturale non si accorda con quella richiesta si usa l’inversione di polarità (Umpolung), per esempio un ditiano come equivalente di un anione acilico.' },
      { titolo: 'Le disconnessioni della sezione', testo: 'Le carte della sezione mostrano le disconnessioni più comuni. Un alcol terziario si disconnette in un chetone e un reattivo di Grignard; un β-idrossicarbonile o un enone si riconduce a due carbonili tramite la reazione aldolica, disconnettendo il legame Cα–Cβ; un alchene si riconduce a un carbonile e a un’ilide di fosforo (Wittig), oppure, se è in un anello, a un diene aperto mediante metatesi di chiusura d’anello; un biarile si riconduce a un alogenuro arilico e a un acido boronico (Suzuki). La disconnessione C–X rimanda a un alcol, e la presenza di gruppi incompatibili impone protezioni temporanee.' },
      { titolo: 'Strategia: convergenza, semplificazione, controllo', testo: 'Fra disconnessioni possibili si preferiscono quelle che tagliano la molecola vicino al centro, generando frammenti di complessità simile (sintesi convergente), che sfruttano simmetrie, che corrispondono a reazioni ad alta resa e che creano i centri stereogenici in modo controllato. Il numero di passaggi conta più di ogni altra cosa, perché le rese si moltiplicano. Il confronto tra la sequenza lineare più lunga di una via convergente e il totale dei passaggi di una via lineare spiega perché la convergenza paga.' },
      { titolo: 'Programmi di retrosintesi', testo: 'Dagli anni Sessanta si è tentato di automatizzare l’analisi retrosintetica (il programma LHASA di Corey ne fu il prototipo). Gli strumenti moderni combinano regole di trasformazione estratte da grandi archivi di reazioni con algoritmi di ricerca e modelli di apprendimento automatico. Propongono vie plausibili e spesso utili, ma non garantiscono che una reazione funzioni sul substrato specifico: la valutazione chimica della selettività, della compatibilità dei gruppi funzionali e delle condizioni resta compito del chimico.' }
    ],
    formule: [
      ['TM ⇒ A + B', 'il bersaglio TM si ottiene da A e B; la freccia retrosintetica indica una relazione logica, non una reazione da eseguire'],
      ['R₁R₂C=O + R₃MgBr → R₁R₂R₃C–OMgBr → (H₃O⁺) R₁R₂R₃C–OH', 'reazione che giustifica la disconnessione di un alcol terziario in chetone e reattivo di Grignard'],
      ['resa(lineare, n passaggi) = rⁿ', 'r resa media di ogni passaggio in frazione; in una via convergente conta la sequenza lineare più lunga']
    ],
    ipotesi: [
      'Una disconnessione è valida solo se esiste una reazione reale che la inverte con selettività accettabile.',
      'I sintoni sono astrazioni: il reagente equivalente può avere reattività aggiuntive (basicità di un Grignard, enolizzazione) che vanno considerate.',
      'Il confronto delle rese tra vie lineari e convergenti assume rese simili per i singoli passaggi.'
    ],
    errori: [
      'Disconnettere un legame per cui non esiste una reazione affidabile, solo perché i frammenti sembrano semplici.',
      'Confondere il sintone con il reagente: R⁻ non si mette in un pallone, RMgBr sì.',
      'Dimenticare che un reattivo di Grignard è anche una base forte e viene distrutto da gruppi OH, NH o COOH presenti nella stessa molecola.'
    ],
    esempio: {
      testo: 'Si confrontino due vie con resa dell’80 % per passaggio. Via lineare: 5 passaggi in serie, resa globale 0,8⁵ = 0,328. Via convergente: due frammenti preparati ciascuno in 2 passaggi e poi uniti con un passaggio di accoppiamento; la sequenza lineare più lunga è di 3 passaggi, per cui la resa riferita al materiale di partenza di ciascun ramo è 0,8³ = 0,512. A parità di numero totale di reazioni, la via convergente produce circa il 56 % in più di prodotto.',
      risultato: 'lineare 32,8 %; convergente 51,2 %'
    },
    fonti: [
      'Corey E. J., Cheng X.-M., The Logic of Chemical Synthesis, Wiley, 1989, cap. 1–2.',
      'Warren S., Wyatt P., Organic Synthesis: The Disconnection Approach, Wiley, 2ª ed.',
      'Clayden J., Greeves N., Warren S., Organic Chemistry, Oxford University Press, 2ª ed., cap. 28 (analisi retrosintetica).'
    ],
    collegamenti: ['ssyn', 'sanimmech', 'scheminfo']
  };

  T['sanimmech'] = {
    titolo: 'Meccanismi di reazione: SN1, SN2, E2, addizione elettrofila, aldolica e Diels–Alder',
    sintesi: 'Un meccanismo descrive la sequenza di passaggi elementari con cui i reagenti diventano prodotti: quali legami si rompono e si formano, quali intermedi compaiono, quale stato di transizione limita la velocità. Si deduce da prove sperimentali (legge cinetica, stereochimica, effetti isotopici, effetti dei sostituenti) e ne spiega e prevede l’esito.',
    paragrafi: [
      { titolo: 'SN2 e SN1', testo: 'Nella SN2 il nucleofilo attacca il carbonio dal lato opposto al gruppo uscente in un unico passaggio concertato; lo stato di transizione ha il carbonio pentacoordinato con geometria a bipiramide trigonale. La velocità è v = k[RX][Nu⁻], la reazione è favorita su carboni metilici e primari e dà inversione di configurazione, osservabile quando il carbonio è stereogenico. Nella SN1 il passaggio lento è la ionizzazione a carbocatione planare; la velocità dipende solo dal substrato (v = k[RX]), la reazione è favorita su carboni terziari, benzilici e allilici e in solventi polari protici. Il carbocatione può trasporsi; l’attacco dalle due facce porta a racemizzazione, spesso parziale perché la coppia ionica scherma una faccia.' },
      { titolo: 'Eliminazione E2', testo: 'Nell’E2 la base strappa un idrogeno in β mentre il gruppo uscente si allontana, in un solo passaggio. La geometria preferita è anti-periplanare, con l’H e il gruppo uscente su lati opposti e diedro di 180°, perché permette la migliore sovrapposizione tra l’orbitale σ C–H che si rompe e il σ* C–X. Nei cicloesani questo richiede che entrambi siano assiali. Con basi piccole prevale l’alchene più sostituito (Zaitsev), con basi ingombranti come il terz-butossido aumenta l’alchene meno sostituito (Hofmann).' },
      { titolo: 'Addizione elettrofila e regola di Markovnikov', testo: 'L’addizione di HBr a un alchene procede per protonazione del doppio legame, che genera un carbocatione, seguita dall’attacco del bromuro. Nel propene la protonazione può dare un catione primario o uno secondario; si forma più in fretta quello secondario, perché lo stato di transizione che vi conduce è più stabile (postulato di Hammond), e il prodotto principale è il 2-bromopropano. In presenza di perossidi il meccanismo diventa radicalico e prevale il prodotto anti-Markovnikov, l’1-bromopropano.' },
      { titolo: 'Condensazione aldolica', testo: 'Una base rimuove un idrogeno in α a un carbonile formando un enolato, che attacca come nucleofilo il carbonio carbonilico di un’altra molecola. Si ottiene un β-idrossicarbonile (l’aldolo), che per riscaldamento può disidratarsi, con meccanismo E1cB, a carbonile α,β-insaturo coniugato. Con due carbonili diversi si ottengono miscele, a meno che uno solo sia enolizzabile o che l’enolato si formi in modo quantitativo e irreversibile con una base forte come l’LDA.' },
      { titolo: 'Diels–Alder', testo: 'La Diels–Alder è una cicloaddizione [4+2] concertata tra un diene in conformazione s-cis e un dienofilo, che forma un cicloesene con due nuovi legami σ. Lo stato di transizione è ciclico ma non planare e i due componenti reagiscono in modo suprafacciale, per cui la reazione è stereospecifica: la geometria cis o trans del dienofilo si conserva nel prodotto. Con dienofili che portano gruppi insaturi prevale di solito il prodotto endo, attribuito a interazioni orbitaliche secondarie (regola di Alder). La reazione è termicamente permessa secondo le regole di Woodward–Hoffmann.' }
    ],
    formule: [
      ['v(SN2) = k₂[RX][Nu⁻]', 'cinetica del secondo ordine; k₂ in M⁻¹ s⁻¹'],
      ['v(SN1) = k₁[RX]', 'cinetica del primo ordine; il nucleofilo non compare perché entra dopo il passaggio lento'],
      ['k = (k_B T / h) · exp(−ΔG‡ / RT)', 'equazione di Eyring: k_B costante di Boltzmann, h costante di Planck, ΔG‡ energia libera di attivazione in J/mol']
    ],
    ipotesi: [
      'SN1/SN2 ed E1/E2 sono casi limite: molti substrati secondari reagiscono con caratteristiche intermedie e le vie competono tra loro.',
      'Il postulato di Hammond è un ragionamento qualitativo: lega la struttura dello stato di transizione a quella della specie di energia più vicina.',
      'L’equazione di Eyring assume coefficiente di trasmissione unitario e quasi-equilibrio con lo stato di transizione.'
    ],
    errori: [
      'Indicare l’inversione di Walden come «osservata» su CH₃Br: il carbonio metilico non è stereogenico, l’inversione esiste ma non si vede.',
      'Dire che l’E2 richiede geometria sin-periplanare: la geometria preferita è anti-periplanare; la sin-eliminazione è possibile solo in casi particolari e rigidi.',
      'Descrivere lo stato di transizione della Diels–Alder come planare: è ciclico, ma il diene e il dienofilo si avvicinano su piani paralleli.'
    ],
    esempio: {
      testo: 'Due vie di reazione competitive differiscono di ΔΔG‡ = 5,71 kJ/mol a 298 K. Dalla relazione di Eyring, il rapporto delle costanti è k₁/k₂ = exp(ΔΔG‡/RT) = exp(5710 / (8,314 · 298,15)) = exp(2,303) = 10,0. Sotto controllo cinetico i prodotti si formano quindi in rapporto 10 : 1, cioè circa 91 : 9. Basta una differenza di circa 11,4 kJ/mol per arrivare a 99 : 1.',
      risultato: 'k₁/k₂ ≈ 10 (prodotti ≈ 91 : 9)'
    },
    fonti: [
      'Clayden J., Greeves N., Warren S., Organic Chemistry, Oxford University Press, 2ª ed., cap. 15 (sostituzione nucleofila), 17 (eliminazioni), 19 (addizioni elettrofile), 26 (enolati) e 34 (cicloaddizioni).',
      'Anslyn E. V., Dougherty D. A., Modern Physical Organic Chemistry, University Science Books, 2006, cap. 7 (cinetica e stati di transizione) e cap. 11.',
      'Fleming I., Molecular Orbitals and Organic Chemical Reactions, Wiley, 2010, cap. sulle reazioni pericicliche.'
    ],
    collegamenti: ['ssyn', 'sretro', 'shammett', 'skin', 'smo']
  };

  T['shammett'] = {
    titolo: 'L’equazione di Hammett e le costanti dei sostituenti',
    sintesi: 'L’equazione di Hammett, log(k/k₀) = ρσ, è una relazione lineare di energia libera: separa l’effetto elettronico di un sostituente in meta o para su un anello benzenico (la costante σ) dalla sensibilità della reazione a quell’effetto (la costante ρ). Con poche costanti tabulate prevede velocità e costanti di equilibrio, e il segno e la grandezza di ρ informano sul meccanismo.',
    paragrafi: [
      { titolo: 'La reazione di riferimento e la costante σ', testo: 'Hammett scelse come riferimento la ionizzazione degli acidi benzoici in acqua a 25 °C e pose ρ = 1 per definizione. La costante di un sostituente è allora σ = log(Kₓ/K_H) = pKₐ(H) − pKₐ(X): un gruppo che stabilizza la carica negativa del carbossilato rende l’acido più forte e ha σ positiva, un donatore ha σ negativa. Così per il p-nitro σp = 0,78, per il p-metossi σp = −0,27. I valori dipendono dalla posizione: in meta agisce soprattutto l’effetto induttivo, in para si somma la risonanza. Per questo il metossile è debolmente attrattore in meta (+0,12) e donatore in para.' },
      { titolo: 'La costante di reazione ρ', testo: 'Riportando log(k/k₀) o log(K/K₀) di una reazione contro σ si ottiene, se la relazione vale, una retta di pendenza ρ. Un ρ positivo indica che nello stato di transizione (o nel prodotto, per un equilibrio) si accumula carica negativa vicino all’anello, oppure se ne perde di positiva: l’idrolisi alcalina dei benzoati di etile ha ρ ≈ +2,5. Un ρ negativo indica sviluppo di carica positiva, come nella solvolisi dei cloruri di cumile (ρ ≈ −4,5). Il valore assoluto misura quanto la carica è vicina all’anello e quanto è sviluppata.' },
      { titolo: 'σ⁺ e σ⁻: coniugazione diretta', testo: 'Quando nello stato di transizione si forma una carica che può entrare in risonanza diretta con il sostituente in para, le σ ordinarie non bastano. Brown e Okamoto definirono σ⁺ dalla solvolisi dei cloruri di cumile, dove un carbocatione benzilico è stabilizzato in modo forte dai donatori per risonanza: per p-OMe σp⁺ = −0,78 contro σp = −0,27. Simmetricamente le costanti σ⁻ descrivono gruppi accettori coniugati con una carica negativa, come nella ionizzazione di fenoli e ioni anilinio: per p-NO₂ σp⁻ = 1,27. Se in un grafico di Hammett i punti di alcuni sostituenti para si allontanano dalla retta, è il segnale che serve σ⁺ o σ⁻.' },
      { titolo: 'Significato termodinamico e limiti', testo: 'Poiché log k è proporzionale a −ΔG‡ e log K a −ΔG°, l’equazione afferma che il sostituente sposta le energie libere di una reazione in proporzione a quelle della reazione di riferimento. La relazione funziona bene per sostituenti in meta e para, dove l’effetto sterico è trascurabile; non si applica ai sostituenti in orto, che interagiscono stericamente con il centro di reazione, né ai sistemi alifatici, per i quali Taft introdusse costanti separate polari e steriche. Una curvatura o una spezzata nel grafico segnala spesso un cambio di meccanismo o di passaggio cineticamente determinante.' },
      { titolo: 'Come si usa la sezione', testo: 'La tabella riporta σm, σp, σp⁺ e σp⁻ dalla compilazione di Hansch, Leo e Taft. Il pannello di previsione moltiplica ρ di una reazione nota per la σ appropriata e restituisce il rapporto delle costanti e, per gli acidi, il pKₐ previsto. Il pannello di regressione stima ρ dai dati inseriti con i minimi quadrati e mette in evidenza i punti che si scostano dalla retta. Per i sostituenti in meta la sezione usa σm anche nelle reazioni che richiederebbero σ⁺ o σ⁻, un’approssimazione ragionevole perché in meta la coniugazione diretta è assente.' }
    ],
    formule: [
      ['log(k/k₀) = ρ · σ', 'k e k₀ costanti di velocità del composto sostituito e di quello con H; vale anche con le costanti di equilibrio K e K₀'],
      ['σ = pKₐ(C₆H₅COOH) − pKₐ(X–C₆H₄COOH)', 'definizione di σ dalla ionizzazione degli acidi benzoici in acqua a 25 °C, reazione per cui ρ = 1'],
      ['pKₐ(X) = pKₐ(H) − ρ · σ', 'previsione del pKₐ di un acido sostituito da quello del composto non sostituito']
    ],
    ipotesi: [
      'Vale per sostituenti in meta e para di derivati benzenici; non per sostituenti in orto né per sistemi alifatici.',
      'ρ dipende dal solvente e dalla temperatura: si usa nelle stesse condizioni in cui è stato misurato.',
      'Si assume che il meccanismo non cambi lungo la serie di sostituenti; σ⁺ e σ⁻ si usano solo quando c’è coniugazione diretta.'
    ],
    errori: [
      'Usare σp ordinarie per una reazione con carbocatione benzilico: con forti donatori in para l’errore arriva a mezza unità di σ o più.',
      'Interpretare ρ > 0 come «la reazione è veloce»: il segno di ρ dice come rispondono i sostituenti, non quanto è veloce la reazione di base.',
      'Includere sostituenti in orto nella regressione e attribuire lo scarto a effetti elettronici.'
    ],
    esempio: {
      testo: 'Prevedere il pKₐ dell’acido p-nitrobenzoico e del p-nitrofenolo. Acido benzoico: pKₐ(H) = 4,20, ρ = 1,00, σp(NO₂) = 0,78, quindi pKₐ = 4,20 − 0,78 = 3,42 (sperimentale 3,44). Fenolo: pKₐ(H) = 9,99, ρ = 2,23 e, poiché il fenossido è coniugato con il nitro, si usa σp⁻ = 1,27: pKₐ = 9,99 − 2,23 · 1,27 = 9,99 − 2,83 = 7,16 (sperimentale circa 7,15). Con la σp ordinaria si otterrebbe 8,25, molto lontano dal dato.',
      risultato: 'pKₐ ≈ 3,42 (acido p-nitrobenzoico); pKₐ ≈ 7,16 (p-nitrofenolo)'
    },
    fonti: [
      'Hammett L. P., The effect of structure upon the reactions of organic compounds. Benzene derivatives, J. Am. Chem. Soc. 59 (1937) 96.',
      'Hansch C., Leo A., Taft R. W., A survey of Hammett substituent constants and resonance and field parameters, Chem. Rev. 91 (1991) 165.',
      'Brown H. C., Okamoto Y., Electrophilic substituent constants, J. Am. Chem. Soc. 80 (1958) 4979.',
      'Anslyn E. V., Dougherty D. A., Modern Physical Organic Chemistry, University Science Books, 2006, cap. 8 (relazioni lineari di energia libera).'
    ],
    collegamenti: ['spka', 'sanimmech', 'skin', 'ssyn']
  };

  T['smolprop'] = {
    titolo: 'Proprietà molecolari e drug-likeness: massa, lipofilia, polarità e regola dei cinque',
    sintesi: 'Da una struttura scritta come SMILES si possono stimare in pochi millisecondi grandezze che influenzano il comportamento di una molecola come farmaco: massa molecolare, lipofilia (logP), numero di donatori e accettori di legami a idrogeno, area polare e flessibilità. La regola dei cinque di Lipinski usa quattro di queste grandezze per segnalare i composti a rischio di scarso assorbimento orale.',
    paragrafi: [
      { titolo: 'Che cosa si calcola da uno SMILES', testo: 'Uno SMILES elenca gli atomi pesanti e i legami; gli idrogeni sono di norma impliciti e vanno ricostruiti dalla valenza di ciascun atomo, tenendo conto dei legami multipli, dell’aromaticità e delle cariche. Da qui si ottengono formula, massa, numero di atomi pesanti e di legami ruotabili (legami singoli non in anello tra atomi pesanti non terminali, esclusi per convenzione quelli ammidici). La ricostruzione corretta degli idrogeni è il punto delicato: un errore di un H sposta la massa di circa 1 g/mol e falsa i conteggi dei donatori. La sezione avverte che le sue stime sono approssimate e rimanda a programmi come RDKit per valori precisi.' },
      { titolo: 'Lipofilia: il logP e i metodi additivi', testo: 'Il logP è il logaritmo del rapporto tra le concentrazioni della forma neutra in 1-ottanolo e in acqua all’equilibrio. Un valore di 0 indica uguale affinità per le due fasi, ogni unità in più un fattore dieci a favore dell’ottanolo. I metodi di calcolo più usati sono additivi: il metodo di Wildman e Crippen assegna un contributo a ciascun atomo secondo il suo intorno chimico e li somma, con errori tipici di circa 0,5–0,7 unità rispetto al dato sperimentale. Per molecole ionizzabili conta il logD al pH di interesse, che è minore del logP quando una frazione della molecola è carica.' },
      { titolo: 'Polarità: donatori, accettori e TPSA', testo: 'I donatori di legame a idrogeno si contano, nella convenzione di Lipinski, come somma dei gruppi OH e NH; gli accettori come somma degli atomi di azoto e ossigeno. Sono definizioni volutamente grossolane, pensate per lo screening. L’area polare topologica (TPSA) somma contributi tabulati per i diversi tipi di atomi polari e per i loro idrogeni: per esempio un gruppo carbossilico vale 37,3 Å². Valori di TPSA sopra circa 140 Å² si associano a scarso assorbimento intestinale, sopra 90 Å² a scarso passaggio della barriera ematoencefalica; anche questi sono limiti statistici, non soglie fisiche.' },
      { titolo: 'La regola dei cinque', testo: 'Lipinski e collaboratori (1997) analizzarono i composti arrivati alla fase II di sviluppo clinico e osservarono che uno scarso assorbimento o una scarsa permeabilità sono più probabili quando una molecola ha più di 5 donatori di legame a idrogeno, più di 10 accettori, massa molecolare superiore a 500 o logP calcolato superiore a 5. Tutte le soglie sono multipli di cinque, da cui il nome. Il criterio originale segnala un rischio quando sono violate due o più condizioni, ed è questo che la sezione applica. Le eccezioni sono numerose: antibiotici, antifungini, vitamine e glicosidi cardioattivi spesso violano la regola perché sfruttano trasportatori.' },
      { titolo: 'Oltre Lipinski', testo: 'Altri criteri completano il quadro: Veber propose che un buon assorbimento orale nel ratto si associa a non più di 10 legami ruotabili e a TPSA non superiore a 140 Å². Esistono anche filtri per la lead-likeness, più restrittivi, e punteggi sintetici come il QED, che combinano più descrittori in un indice continuo. Nessuno di questi criteri dice se una molecola è attiva o sicura: descrivono solo la probabilità che abbia proprietà fisico-chimiche compatibili con un farmaco somministrato per bocca.' }
    ],
    formule: [
      ['logP ≈ Σᵢ aᵢ', 'stima additiva alla Crippen: aᵢ contributo tabulato dell’atomo i secondo il suo tipo e intorno'],
      ['logD(pH) = logP − log₁₀(1 + 10^(pH − pKₐ))', 'per un acido monoprotico, assumendo che solo la forma neutra passi in ottanolo; per una base l’esponente è pKₐ − pH'],
      ['TPSA = Σⱼ sⱼ', 'area polare topologica in Å²: somma dei contributi sⱼ dei frammenti polari secondo Ertl'],
      ['Ro5: HBD ≤ 5, HBA ≤ 10, M ≤ 500, logP ≤ 5', 'criteri di Lipinski; il rischio di scarso assorbimento è segnalato con due o più violazioni']
    ],
    ipotesi: [
      'La regola dei cinque riguarda l’assorbimento orale per diffusione passiva; non si applica a farmaci che usano trasportatori né a vie di somministrazione diverse.',
      'logP, TPSA e conteggi sono stime: i metodi additivi trascurano conformazione, legami a idrogeno intramolecolari e ionizzazione.',
      'Le soglie sono statistiche, tratte da un insieme storico di composti, e non distinguono nettamente farmaci da non farmaci.'
    ],
    errori: [
      'Leggere «passa Lipinski» come «è un buon farmaco»: la regola non dice nulla su attività, selettività o tossicità.',
      'Confrontare un logP calcolato con un logD misurato a pH 7,4 per un acido carbossilico: possono differire di tre o quattro unità.',
      'Contare come donatore ogni atomo di ossigeno: un etere o un carbonile sono accettori, non donatori.'
    ],
    esempio: {
      testo: 'Ibuprofene, C₁₃H₁₈O₂. Massa molare: 13 · 12,011 + 18 · 1,008 + 2 · 15,999 = 156,143 + 18,144 + 31,998 = 206,29 g/mol. Donatori: un OH carbossilico, quindi 1. Accettori secondo Lipinski (N + O): 2. Il logP sperimentale è circa 3,97. TPSA del solo gruppo COOH: 37,3 Å². Nessuna delle quattro condizioni è violata. A pH 7,4, però, l’acido è quasi tutto ionizzato: con pKₐ ≈ 4,9 la formula dà logD ≈ 3,97 − log₁₀(1 + 10^2,5) ≈ 3,97 − 2,50 ≈ 1,5.',
      risultato: 'M = 206,29 g/mol, HBD = 1, HBA = 2, logP ≈ 4,0: zero violazioni'
    },
    fonti: [
      'Lipinski C. A., Lombardo F., Dominy B. W., Feeney P. J., Experimental and computational approaches to estimate solubility and permeability in drug discovery and development settings, Adv. Drug Deliv. Rev. 23 (1997) 3.',
      'Wildman S. A., Crippen G. M., Prediction of physicochemical parameters by atomic contributions, J. Chem. Inf. Comput. Sci. 39 (1999) 868.',
      'Veber D. F. et al., Molecular properties that influence the oral bioavailability of drug candidates, J. Med. Chem. 45 (2002) 2615.',
      'Ertl P., Rohde B., Selzer P., J. Med. Chem. 43 (2000) 3714.'
    ],
    collegamenti: ['smol', 'scheminfo', 'spkcalc', 'sfarm']
  };

  T['sinorg'] = {
    titolo: 'Complessi di coordinazione: campo cristallino, spin e serie spettrochimica',
    sintesi: 'Un complesso di coordinazione è formato da un catione metallico circondato da leganti che gli donano coppie di elettroni. Il campo elettrostatico dei leganti separa in energia gli orbitali d del metallo: dalla grandezza di questa separazione, confrontata con l’energia di appaiamento, dipendono stato di spin, magnetismo, colore e in parte la reattività del complesso.',
    paragrafi: [
      { titolo: 'Leganti, numero di coordinazione e geometria', testo: 'I leganti sono basi di Lewis: monodentati come H₂O, NH₃, Cl⁻ e CN⁻, oppure polidentati come l’etilendiammina (en, bidentata) e l’EDTA (esadentato), che formano chelati più stabili per ragioni in gran parte entropiche. Il numero di coordinazione più comune per i metalli 3d è sei, con geometria ottaedrica; con quattro leganti si hanno geometrie tetraedrica o quadrato planare, quest’ultima tipica degli ioni d⁸ con leganti di campo forte (Ni²⁺ con CN⁻, Pd²⁺ e Pt²⁺ quasi sempre). Per contare gli elettroni d si sottrae dal numero del gruppo lo stato di ossidazione del metallo.' },
      { titolo: 'Separazione degli orbitali d in campo ottaedrico', testo: 'In un ottaedro gli orbitali d_x²−y² e d_z² puntano verso i leganti e salgono in energia (insieme e_g), mentre d_xy, d_xz e d_yz puntano tra i leganti e scendono (insieme t₂g). La separazione si indica con Δₒ (o 10 Dq). Rispetto al baricentro, ogni elettrone in t₂g stabilizza di 0,4 Δₒ e ogni elettrone in e_g destabilizza di 0,6 Δₒ: la somma è l’energia di stabilizzazione del campo cristallino (CFSE). In un tetraedro l’ordine si inverte (e sotto, t₂ sopra) e Δₜ ≈ 4/9 Δₒ per gli stessi leganti e lo stesso metallo.' },
      { titolo: 'Alto e basso spin', testo: 'Per le configurazioni da d⁴ a d⁷ in campo ottaedrico esistono due possibilità. Se Δₒ è minore dell’energia di appaiamento P, gli elettroni occupano prima tutti e cinque gli orbitali con spin paralleli (alto spin), come avviene in [Fe(H₂O)₆]³⁺, d⁵ con cinque elettroni spaiati. Se Δₒ supera P, gli elettroni si appaiano in t₂g (basso spin), come in [Fe(CN)₆]³⁻, con un solo elettrone spaiato, o in [Co(NH₃)₆]³⁺, d⁶ diamagnetico. I complessi tetraedrici, con Δₜ piccolo, sono quasi sempre ad alto spin. Il numero di elettroni spaiati si misura con la suscettività magnetica.' },
      { titolo: 'La serie spettrochimica', testo: 'Ordinando i leganti secondo il Δₒ che producono con lo stesso metallo si ottiene la serie spettrochimica: I⁻ < Br⁻ < Cl⁻ < F⁻ < OH⁻ < H₂O < NH₃ < en < NO₂⁻ < CN⁻ < CO. La sequenza non si spiega con la sola carica: gli alogenuri sono π-donatori e riducono Δₒ, NH₃ è solo σ-donatore, CN⁻ e CO sono π-accettori e lo aumentano grazie alla retrodonazione. Anche il metallo conta: Δₒ cresce con lo stato di ossidazione e scendendo nel gruppo, tanto che i complessi 4d e 5d sono praticamente sempre a basso spin. I valori di Δₒ della tabella sono indicativi e cambiano con il metallo.' },
      { titolo: 'Isomeria, effetto trans e labilità', testo: 'I complessi mostrano isomeria geometrica (cis e trans nei quadrato planari e negli ottaedrici MA₄B₂), ottica (Δ e Λ nei tris-chelati), di legame (SCN⁻ legato per S o per N) e di ionizzazione. Nei complessi quadrato planari di Pt(II) l’effetto trans, studiato da Chernyaev, indica che alcuni leganti accelerano la sostituzione del legante in posizione trans a loro, principio usato nella sintesi del cisplatino. Infine, labilità e inerzia sono proprietà cinetiche: Cr³⁺ (d³) e Co³⁺ basso spin (d⁶) scambiano i leganti in ore o giorni, Cu²⁺ e i complessi ad alto spin di Fe²⁺ in tempi brevissimi.' }
    ],
    formule: [
      ['CFSE = (−0,4 · n(t₂g) + 0,6 · n(e_g)) · Δₒ + p · P', 'energia di stabilizzazione in ottaedro; p numero di coppie in più rispetto allo ione libero, P energia di appaiamento'],
      ['Δₜ ≈ (4/9) · Δₒ', 'separazione in campo tetraedrico rispetto a quello ottaedrico, a parità di metallo, leganti e distanza'],
      ['μ(solo spin) = √(n(n + 2)) μ_B', 'momento magnetico efficace stimato dal numero n di elettroni spaiati, in magnetoni di Bohr'],
      ['Δₒ (cm⁻¹) = 10⁷ / λ (nm)', 'conversione per il caso in cui la banda d–d coincide con Δₒ, per esempio negli ioni d¹ e d³']
    ],
    ipotesi: [
      'Il modello del campo cristallino tratta i leganti come cariche puntiformi: ignora la covalenza, che la teoria del campo dei leganti e quella degli orbitali molecolari recuperano.',
      'La formula solo spin vale bene per ioni 3d con momento orbitale spento; con contributi orbitali (per esempio Co²⁺ ottaedrico) il momento misurato è maggiore.',
      'Il riempimento a basso o alto spin dipende dal confronto Δₒ–P, che per alcuni complessi è vicino e dà fenomeni di spin crossover.'
    ],
    errori: [
      'Disegnare un d⁵ ad alto spin con una coppia appaiata in t₂g: la regola di Hund impone prima un elettrone in ciascuno dei cinque orbitali.',
      'Dedurre il colore dalla lunghezza d’onda assorbita senza passare al colore complementare: un complesso che assorbe nel giallo appare blu-violetto.',
      'Attribuire la tossicità del cianuro al legame con il ferro dell’emoglobina: il bersaglio principale è il ferro dell’emina a₃ della citocromo c ossidasi mitocondriale.'
    ],
    esempio: {
      testo: 'Calcolare il momento magnetico solo spin di [Fe(H₂O)₆]³⁺ e di [Fe(CN)₆]³⁻. Fe³⁺ è d⁵ (gruppo 8 − 3). Con H₂O, legante di campo debole, il complesso è ad alto spin, t₂g³ e_g², n = 5: μ = √(5 · 7) = √35 = 5,92 μ_B. Con CN⁻, campo forte, è a basso spin, t₂g⁵, n = 1: μ = √(1 · 3) = 1,73 μ_B. Per [Fe(CN)₆]³⁻ il valore misurato è un po’ più alto (circa 2,3 μ_B) per il contributo orbitale del termine ²T₂g.',
      risultato: 'μ ≈ 5,92 μ_B (alto spin) e 1,73 μ_B (basso spin)'
    },
    fonti: [
      'Housecroft C. E., Sharpe A. G., Inorganic Chemistry, Pearson, 5ª ed., cap. 20 (chimica di coordinazione del blocco d: legame, spettri e magnetismo).',
      'Miessler G. L., Fischer P. J., Tarr D. A., Inorganic Chemistry, Pearson, 5ª ed., cap. 10–12.',
      'Greenwood N. N., Earnshaw A., Chemistry of the Elements, Butterworth-Heinemann, 2ª ed., cap. 19 (introduzione agli elementi di transizione).'
    ],
    collegamenti: ['scft', 'spt', 'svsepr', 'smo', 'suvvis']
  };

  T['scft'] = {
    titolo: 'Dal metallo al colore: campo cristallino, orbitali molecolari e transizioni d–d',
    sintesi: 'La sezione ricostruisce, per un complesso reale, la catena che va dalla configurazione elettronica del metallo al colore osservato: conteggio dⁿ, geometria, separazione degli orbitali d stimata con il metodo di Jørgensen (Δ = f · g), stato di spin, momento magnetico, CFSE, assorbimento d–d e infine l’interpretazione con gli orbitali molecolari e i termini spettroscopici.',
    paragrafi: [
      { titolo: 'Stimare Δₒ: il prodotto f · g', testo: 'Jørgensen osservò che la separazione ottaedrica si può fattorizzare con buona approssimazione in un fattore del legante f e uno del metallo g: Δₒ ≈ f · g. Per convenzione f(H₂O) = 1,00; altri valori tipici sono 0,78–0,80 per Cl⁻, 0,90 per F⁻, 1,25 per NH₃, 1,28 per en e circa 1,7 per CN⁻. Il fattore g, espresso in cm⁻¹, cresce con lo stato di ossidazione: circa 8 000 per Mn²⁺, 8 700 per Ni²⁺, 17 400 per Cr³⁺, 18 200 per Co³⁺. Il metodo dà stime entro il 10 % circa per i complessi 3d ottaedrici; per altre geometrie la sezione usa fattori di scala approssimati.' },
      { titolo: 'Spin, magnetismo e CFSE', testo: 'Noto Δₒ, lo si confronta con l’energia di appaiamento P per decidere lo stato di spin delle configurazioni d⁴–d⁷. Il numero di elettroni spaiati n dà il momento magnetico solo spin μ = √(n(n + 2)) μ_B, e l’occupazione di t₂g ed e_g dà la CFSE in unità di Δₒ. La CFSE spiega andamenti termodinamici osservabili: l’andamento a doppia gobba delle entalpie di idratazione dei cationi M²⁺ della prima serie e la preferenza di alcuni ioni, come Cr³⁺ e Ni²⁺, per la geometria ottaedrica rispetto a quella tetraedrica.' },
      { titolo: 'Transizioni d–d e colore', testo: 'Un fotone di energia pari alla differenza tra stati elettronici del complesso può promuovere un elettrone da t₂g a e_g. Queste transizioni sono proibite dalla regola di Laporte nei complessi centrosimmetrici e diventano debolmente permesse per accoppiamento vibronico, per cui ε vale tipicamente 1–100 M⁻¹ cm⁻¹; nei complessi tetraedrici, privi di centro di inversione, sono più intense. Il colore percepito è il complementare di quello assorbito. Per ioni d¹ e d³ in ottaedro l’energia della prima banda coincide con Δₒ; per le altre configurazioni il legame tra bande e Δₒ passa attraverso i diagrammi di Tanabe–Sugano e il parametro di Racah B.' },
      { titolo: 'Jahn–Teller', testo: 'Il teorema di Jahn–Teller afferma che una molecola non lineare in uno stato elettronico degenere si distorce per rimuovere la degenerazione. Nei complessi ottaedrici l’effetto è marcato quando l’insieme e_g è occupato in modo disuguale, come in Cu²⁺ d⁹ e in Cr²⁺ o Mn³⁺ d⁴ ad alto spin: di solito i due legami assiali si allungano e d_z² scende rispetto a d_x²−y². Ne risultano geometrie tetragonali e bande di assorbimento larghe o sdoppiate, come quella di [Cu(H₂O)₆]²⁺. Con degenerazione nel solo t₂g la distorsione è piccola.' },
      { titolo: 'Il punto di vista degli orbitali molecolari', testo: 'Nella teoria degli orbitali molecolari i sei orbitali σ dei leganti si combinano con gli orbitali 4s, 4p, 3d_z² e 3d_x²−y² del metallo; t₂g resta non legante rispetto ai σ, mentre e_g diventa l’insieme antilegante e_g*. Δₒ è la distanza fra t₂g ed e_g*. I leganti π-donatori (alogenuri, OH⁻) alzano t₂g e riducono Δₒ; i π-accettori (CN⁻, CO) lo abbassano tramite retrodonazione e aumentano Δₒ. È la spiegazione fisica della serie spettrochimica, che il modello elettrostatico non riesce a giustificare.' },
      { titolo: 'Termini spettroscopici', testo: 'Lo stato di un ione libero dⁿ si descrive con un simbolo di termine ²ˢ⁺¹L, e il termine fondamentale si trova con le regole di Hund: per d² e d⁸ è ³F, per d³ e d⁷ ⁴F, per d⁴ e d⁶ ⁵D, per d⁵ ⁶S. Nel campo dei leganti i termini si separano: un termine D dà T₂g ed E_g, un F dà A₂g, T₂g e T₁g. Le transizioni permesse per spin collegano termini della stessa molteplicità, e il loro numero e la loro posizione si leggono nei diagrammi di Tanabe–Sugano.' }
    ],
    formule: [
      ['Δₒ ≈ f(legante) · g(metallo)', 'regola di Jørgensen; f adimensionale con f(H₂O) = 1, g in cm⁻¹'],
      ['λ (nm) = 10⁷ / ν̃ (cm⁻¹)', 'conversione tra numero d’onda e lunghezza d’onda'],
      ['1 cm⁻¹ ≙ 11,963 J/mol', 'conversione di energia: E = h c ν̃ N_A'],
      ['μ = √(n(n + 2)) μ_B', 'momento magnetico solo spin, n elettroni spaiati']
    ],
    ipotesi: [
      'Il prodotto f · g è empirico, nato per complessi ottaedrici omolettici; per complessi misti si usa una media pesata dei fattori f.',
      'La relazione diretta tra prima banda e Δₒ vale per d¹, d³ (e d⁸ per la banda a energia più bassa) in ottaedro; per le altre configurazioni la repulsione interelettronica sposta le bande.',
      'La previsione del colore dalla sola λ della banda principale è qualitativa: lo spettro reale ha più bande, larghe, e il colore percepito dipende dall’intera curva.'
    ],
    errori: [
      'Calcolare λ = 10⁷/Δ per qualunque complesso e trattarla come posizione esatta della banda: è vera solo nei casi indicati.',
      'Pensare che i complessi tetraedrici possano essere a basso spin con leganti comuni: Δₜ è circa la metà di Δₒ e resta quasi sempre inferiore a P.',
      'Attribuire l’intensità dei colori di MnO₄⁻ o CrO₄²⁻ a transizioni d–d: sono d⁰ e il colore deriva da trasferimento di carica legante → metallo.'
    ],
    esempio: {
      testo: 'Stimare Δₒ, posizione della banda e CFSE per [Cr(NH₃)₆]³⁺. Cr³⁺ è d³ (gruppo 6 − 3). Con f(NH₃) = 1,25 e g(Cr³⁺) = 17 400 cm⁻¹: Δₒ = 1,25 · 17 400 = 21 750 cm⁻¹. Per un d³ la prima banda ⁴A₂g → ⁴T₂g vale Δₒ, quindi λ = 10⁷ / 21 750 = 460 nm: si assorbe nel blu e il complesso appare giallo-arancio. CFSE = 3 · (−0,4) Δₒ = −1,2 · 21 750 = −26 100 cm⁻¹, che moltiplicati per 11,963 J/mol danno −312 kJ/mol.',
      risultato: 'Δₒ ≈ 21 750 cm⁻¹, λ ≈ 460 nm (osservata circa 464 nm), CFSE ≈ −312 kJ/mol'
    },
    fonti: [
      'Jørgensen C. K., Modern Aspects of Ligand Field Theory, North-Holland, 1971.',
      'Lever A. B. P., Inorganic Electronic Spectroscopy, Elsevier, 2ª ed., 1984, capitoli sui diagrammi di Tanabe–Sugano e sui parametri di campo dei leganti.',
      'Housecroft C. E., Sharpe A. G., Inorganic Chemistry, Pearson, 5ª ed., cap. 20 (spettri elettronici e magnetismo dei complessi).',
      'Figgis B. N., Hitchman M. A., Ligand Field Theory and Its Applications, Wiley-VCH, 2000.'
    ],
    collegamenti: ['sinorg', 'suvvis', 'smo', 'sqm', 'svsepr']
  };

  T['sdistrib'] = {
    titolo: 'Distribuzioni di probabilità e inferenza statistica',
    sintesi: 'Ogni misura sperimentale è affetta da variabilità, e le distribuzioni di probabilità sono i modelli che la descrivono. La sezione mostra le principali (normale, binomiale, Poisson, esponenziale, uniforme), il teorema di Bayes applicato ai test diagnostici e i test d’ipotesi più usati per decidere se una differenza osservata è attribuibile al caso: t di Welch, ANOVA, chi quadro e regressione.',
    paragrafi: [
      { titolo: 'Variabili casuali, densità e funzione cumulativa', testo: 'Una variabile casuale discreta si descrive con la funzione di massa P(X = k), una continua con la densità f(x), la cui area tra due valori dà la probabilità di cadere in quell’intervallo. La funzione cumulativa F(x) = P(X ≤ x) cresce da 0 a 1 ed è quella che serve per calcolare probabilità e quantili. Media e varianza riassumono posizione e dispersione: la deviazione standard, radice della varianza, ha le stesse unità della variabile ed è la misura naturale dell’incertezza di una singola misura.' },
      { titolo: 'Le distribuzioni della sezione', testo: 'La normale N(μ, σ) descrive gli errori casuali di misura e, per il teorema del limite centrale, la media di molte variabili indipendenti qualunque sia la loro distribuzione; il 68,3 % dei valori cade entro μ ± σ, il 95,4 % entro μ ± 2σ, il 99,7 % entro μ ± 3σ. La binomiale conta i successi in n prove indipendenti con probabilità p costante. La Poisson descrive conteggi di eventi rari e indipendenti, come i decadimenti radioattivi in un intervallo, e ha media uguale alla varianza: l’incertezza di un conteggio N è circa √N. L’esponenziale descrive i tempi di attesa tra eventi di Poisson ed è priva di memoria; l’uniforme assegna la stessa densità a tutto un intervallo.' },
      { titolo: 'Il teorema di Bayes e i test diagnostici', testo: 'Il teorema di Bayes collega P(malattia | test positivo), che interessa al medico, a sensibilità e specificità, che caratterizzano il test. Il valore predittivo positivo dipende in modo cruciale dalla prevalenza: con una malattia rara anche un test con sensibilità e specificità del 95 % produce più falsi positivi che veri positivi, perché i sani sono molto più numerosi dei malati. Il valore predittivo negativo, al contrario, è alto quando la malattia è rara. È per questo che i test di screening positivi vanno confermati con test diversi.' },
      { titolo: 'Test d’ipotesi: t di Welch e ANOVA', testo: 'Un test d’ipotesi parte da un’ipotesi nulla, per esempio che due popolazioni abbiano la stessa media, e calcola la probabilità p di osservare, se fosse vera, una differenza almeno grande quanto quella misurata. Se p è minore della soglia α scelta prima (spesso 0,05) si rifiuta l’ipotesi nulla. Il test t di Welch confronta due medie senza assumere varianze uguali e usa gradi di libertà corretti con la formula di Welch–Satterthwaite. L’ANOVA a una via confronta più gruppi insieme scomponendo la varianza totale in una parte tra gruppi e una entro i gruppi; il loro rapporto segue una distribuzione F.' },
      { titolo: 'Chi quadro e regressione', testo: 'Il test del chi quadro confronta frequenze osservate e attese, per esempio in una tabella di contingenza, sommando (O − A)²/A su tutte le celle; richiede frequenze attese non troppo piccole (di solito almeno 5). La regressione lineare ai minimi quadrati stima pendenza e intercetta di una retta minimizzando la somma dei quadrati dei residui; il coefficiente R² indica la frazione di varianza spiegata dal modello. Un R² alto non prova la linearità né la causalità: vanno sempre esaminati i residui.' }
    ],
    formule: [
      ['f(x) = exp(−(x − μ)² / 2σ²) / (σ √(2π))', 'densità normale con media μ e deviazione standard σ'],
      ['P(X = k) = λᵏ e^(−λ) / k!', 'distribuzione di Poisson; media e varianza valgono entrambe λ'],
      ['VPP = Se · p / [Se · p + (1 − Sp) · (1 − p)]', 'teorema di Bayes per un test diagnostico: p prevalenza, Se sensibilità, Sp specificità'],
      ['t = (x̄₁ − x̄₂) / √(s₁²/n₁ + s₂²/n₂)', 'statistica di Welch per il confronto di due medie con varianze diverse']
    ],
    ipotesi: [
      'Il test t presuppone osservazioni indipendenti e distribuzioni approssimativamente normali; con campioni piccoli e molto asimmetrici conviene un test non parametrico.',
      'Il valore p non è la probabilità che l’ipotesi nulla sia vera, né misura l’importanza pratica di un effetto.',
      'Sensibilità e specificità di un test si considerano costanti, ma in pratica dipendono dalla popolazione e dalla soglia scelta.'
    ],
    errori: [
      'Interpretare p = 0,03 come «c’è il 97 % di probabilità che l’effetto sia reale».',
      'Usare la sensibilità di un test come se fosse la probabilità di essere malati dopo un risultato positivo, ignorando la prevalenza.',
      'Eseguire molti test t a coppie invece di un’ANOVA, gonfiando la probabilità di almeno un falso positivo.'
    ],
    esempio: {
      testo: 'Test diagnostico con prevalenza 1 %, sensibilità 95 %, specificità 95 % (i valori iniziali della sezione). Su 10 000 persone i malati sono 100: veri positivi 95, falsi negativi 5. I sani sono 9 900: falsi positivi 0,05 · 9 900 = 495, veri negativi 9 405. VPP = 95 / (95 + 495) = 0,161. VPN = 9 405 / (9 405 + 5) = 0,9995. Dunque solo un positivo su sei è davvero malato, mentre un negativo è quasi certamente sano.',
      risultato: 'VPP ≈ 16,1 %; VPN ≈ 99,95 %'
    },
    fonti: [
      'Miller J. N., Miller J. C., Statistics and Chemometrics for Analytical Chemistry, Pearson, 7ª ed., cap. 2–3 (errori e test di significatività) e cap. 5 (regressione).',
      'Montgomery D. C., Runger G. C., Applied Statistics and Probability for Engineers, Wiley, 7ª ed., cap. 3–4 e 9–11.',
      'Welch B. L., The generalization of «Student’s» problem when several different population variances are involved, Biometrika 34 (1947) 28.'
    ],
    collegamenti: ['smatstat', 'smatprob', 'smatinfer', 'staratura', 'sclinical']
  };

  T['sqm'] = {
    titolo: 'Meccanica quantistica: postulati, modelli esatti e metodi approssimati',
    sintesi: 'La meccanica quantistica descrive un sistema con una funzione d’onda la cui evoluzione è governata dall’equazione di Schrödinger e il cui modulo quadro dà densità di probabilità. Pochi modelli si risolvono esattamente (particella nella scatola, oscillatore armonico, atomo di idrogeno), ma insegnano l’origine della quantizzazione; per tutto il resto la chimica usa la teoria delle perturbazioni e il metodo variazionale.',
    paragrafi: [
      { titolo: 'Postulati e operatori', testo: 'Lo stato di un sistema è descritto dalla funzione d’onda Ψ, normalizzata in modo che ∫|Ψ|² dτ = 1. A ogni osservabile corrisponde un operatore hermitiano; gli unici risultati possibili di una misura sono i suoi autovalori, che per l’hermiticità sono reali, e il valore medio di molte misure è ⟨A⟩ = ∫Ψ* Â Ψ dτ. Due osservabili sono misurabili simultaneamente con precisione arbitraria solo se i loro operatori commutano. Per posizione e impulso [x̂, p̂] = iħ, da cui la relazione di indeterminazione di Heisenberg Δx Δp ≥ ħ/2, che è una proprietà degli stati quantistici, non un limite degli strumenti.' },
      { titolo: 'L’equazione di Schrödinger e gli stati stazionari', testo: 'L’equazione dipendente dal tempo iħ ∂Ψ/∂t = ĤΨ governa l’evoluzione dello stato. Se il potenziale non dipende dal tempo si separano le variabili: la parte spaziale soddisfa l’equazione agli autovalori Ĥψ = Eψ e la parte temporale è un fattore di fase exp(−iEt/ħ). Gli stati stazionari hanno densità di probabilità costante nel tempo. La quantizzazione dell’energia nasce dalle condizioni al contorno: una particella confinata può avere solo le energie per cui la funzione d’onda soddisfa i vincoli imposti dal potenziale.' },
      { titolo: 'Modelli risolvibili', testo: 'Nella scatola monodimensionale con pareti infinite Eₙ = n²h²/(8mL²) con n = 1, 2, 3…: l’energia di punto zero non è nulla e i livelli si allontanano al diminuire di L, il che spiega in modo semiquantitativo il colore dei polieni coniugati. L’oscillatore armonico ha livelli equispaziati Eᵥ = (v + ½)ħω con ω = √(k/μ), modello delle vibrazioni molecolari. L’atomo di idrogeno ha Eₙ = −13,6 eV/n² e orbitali caratterizzati dai numeri quantici n, ℓ e m_ℓ, a cui si aggiunge lo spin m_s. Nell’effetto tunnel una particella attraversa una barriera più alta della sua energia con probabilità che decresce esponenzialmente con lo spessore.' },
      { titolo: 'Spin, principio di Pauli e atomi a più elettroni', testo: 'Lo spin è un momento angolare intrinseco; per l’elettrone s = ½ e m_s = ±½. La funzione d’onda di più fermioni deve essere antisimmetrica rispetto allo scambio di due particelle, e da qui deriva il principio di esclusione di Pauli: due elettroni di un atomo non possono avere gli stessi quattro numeri quantici. Negli atomi a più elettroni la repulsione rimuove la degenerazione in ℓ e l’energia degli orbitali dipende da n e da ℓ; aufbau, Pauli e Hund spiegano la struttura della tavola periodica, e gli stati atomici si indicano con simboli di termine ²ˢ⁺¹L_J, dove J va da |L − S| a L + S.' },
      { titolo: 'Metodi approssimati e spettroscopia', testo: 'La teoria delle perturbazioni tratta un hamiltoniano Ĥ₀ risolto esattamente più una piccola correzione: al primo ordine la correzione all’energia è il valore medio della perturbazione sullo stato imperturbato. Il metodo variazionale garantisce che l’energia calcolata con qualunque funzione di prova sia maggiore o uguale a quella esatta dello stato fondamentale; su di esso si fondano il metodo LCAO e Hartree–Fock. Le regole di selezione nascono dal momento di dipolo di transizione: per l’atomo idrogenoide nelle transizioni di dipolo elettrico Δℓ = ±1.' }
    ],
    formule: [
      ['iħ ∂Ψ/∂t = ĤΨ', 'equazione di Schrödinger dipendente dal tempo; ħ = h/2π'],
      ['Eₙ = n² h² / (8 m L²)', 'particella in una scatola monodimensionale di lunghezza L, n = 1, 2, 3…'],
      ['Eᵥ = (v + ½) ħ ω, ω = √(k/μ)', 'oscillatore armonico: k costante di forza, μ massa ridotta, v = 0, 1, 2…'],
      ['Δx · Δp ≥ ħ/2', 'relazione di indeterminazione di Heisenberg fra deviazioni standard di posizione e impulso'],
      ['E[ψ] = ⟨ψ|Ĥ|ψ⟩ / ⟨ψ|ψ⟩ ≥ E₀', 'principio variazionale: limite superiore all’energia dello stato fondamentale']
    ],
    ipotesi: [
      'Le energie −13,6 eV/n² valgono per l’idrogeno non relativistico con nucleo di massa infinita; la massa ridotta e le correzioni relativistiche modificano leggermente i valori.',
      'La relazione energia–tempo ΔE·Δt ≳ ħ/2 non deriva da un commutatore, perché il tempo non è un operatore: va intesa come legame tra vita media di uno stato e larghezza della riga.',
      'La scatola e l’oscillatore armonico sono idealizzazioni: i potenziali reali hanno pareti finite e anarmonicità.'
    ],
    errori: [
      'Pensare che |Ψ|² sia la carica dell’elettrone «spalmata»: è una densità di probabilità di trovarlo in un punto.',
      'Scrivere J = L + S come unico valore: J assume tutti i valori da |L − S| a L + S a passi di uno.',
      'Ritenere che un elettrone in un orbitale p «salti» tra i due lobi attraverso il nodo: il nodo è una proprietà della funzione d’onda stazionaria, non una barriera da attraversare.'
    ],
    esempio: {
      testo: 'Un elettrone (m = 9,109 × 10⁻³¹ kg) in una scatola di lunghezza L = 1,00 nm. E₁ = h²/(8mL²) = (6,626 × 10⁻³⁴)² / (8 · 9,109 × 10⁻³¹ · (1,00 × 10⁻⁹)²) = 6,02 × 10⁻²⁰ J = 0,376 eV. La transizione 1 → 2 richiede ΔE = E₂ − E₁ = 3E₁ = 1,81 × 10⁻¹⁹ J, cioè λ = hc/ΔE = (6,626 × 10⁻³⁴ · 2,998 × 10⁸) / 1,81 × 10⁻¹⁹ = 1,10 × 10⁻⁶ m, nel vicino infrarosso.',
      risultato: 'E₁ ≈ 0,376 eV; λ(1→2) ≈ 1,10 μm'
    },
    fonti: [
      'Atkins P., de Paula J., Keeler J., Atkins’ Physical Chemistry, Oxford University Press, 11ª ed., Focus 7–9 (principi, moti, struttura atomica).',
      'Levine I. N., Quantum Chemistry, Pearson, 7ª ed., cap. 1–9.',
      'Griffiths D. J., Schroeter D. F., Introduction to Quantum Mechanics, Cambridge University Press, 3ª ed., cap. 1–4.'
    ],
    collegamenti: ['sschrod', 'smo', 'shf', 'srotovib', 'sfisspin']
  };

  T['srxnbal'] = {
    titolo: 'Bilanciamento delle equazioni chimiche: conservazione degli atomi e degli elettroni',
    sintesi: 'Un’equazione chimica bilanciata esprime la conservazione degli atomi di ciascun elemento e della carica. Trovare i coefficienti equivale a risolvere un sistema lineare omogeneo, che la sezione risolve con l’eliminazione di Gauss; per le reazioni redox lo stesso risultato si ottiene bilanciando gli elettroni scambiati con il metodo delle semireazioni.',
    paragrafi: [
      { titolo: 'Che cosa significa bilanciare', testo: 'I coefficienti stechiometrici indicano in quali rapporti di moli reagiscono e si formano le specie. Bilanciare significa scegliere i coefficienti in modo che, per ogni elemento, il numero di atomi a sinistra sia uguale a quello a destra, e che anche la carica totale coincida nelle equazioni ioniche. Si scelgono per convenzione i più piccoli interi positivi. Un’equazione bilanciata non dice se la reazione avvenga davvero, né con che velocità o in che misura: è un vincolo di conservazione, non una previsione.' },
      { titolo: 'Il metodo algebrico', testo: 'Si assegna un’incognita a ciascuna specie e si scrive un’equazione per ciascun elemento, con i reagenti a coefficiente positivo e i prodotti negativo. Si ottiene una matrice di composizione A e il sistema A·x = 0. Se il nucleo della matrice ha dimensione uno, c’è un’unica soluzione a meno di un fattore, che si fissa imponendo per esempio x₁ = 1 e poi riportando tutto ai minimi interi. Se la dimensione è zero, le specie scritte non possono essere collegate da una reazione bilanciata; se è maggiore di uno, l’equazione è la combinazione di più reazioni indipendenti e i coefficienti non sono unici.' },
      { titolo: 'Reazioni redox e numeri di ossidazione', testo: 'Nelle reazioni di ossidoriduzione conviene ragionare sugli elettroni. Si assegnano i numeri di ossidazione, si individuano la specie che si ossida e quella che si riduce, e si impone che gli elettroni ceduti siano uguali a quelli acquistati. Con il metodo delle semireazioni si bilancia ciascuna semireazione per gli atomi diversi da O e H, poi per l’ossigeno con H₂O, per l’idrogeno con H⁺ (o, in ambiente basico, con OH⁻ e H₂O) e infine per la carica con gli elettroni; si moltiplicano le semireazioni per i fattori che rendono uguali gli elettroni e si sommano.' },
      { titolo: 'Gli esempi della sezione', testo: 'La combustione del metano, CH₄ + 2 O₂ → CO₂ + 2 H₂O, si bilancia a occhio partendo da C, poi H, infine O. La sintesi dell’ammoniaca dà N₂ + 3 H₂ → 2 NH₃. L’ossidazione del ferro a ossido ferrico richiede 4 Fe + 3 O₂ → 2 Fe₂O₃; nella sezione compare con l’etichetta «Reazione di Hess», che però è un nome improprio, perché la legge di Hess riguarda l’additività delle entalpie e non questa reazione in particolare. Il caso permanganato più acido cloridrico è il classico esempio redox in cui l’approccio per elettroni è più rapido di quello per tentativi.' }
    ],
    formule: [
      ['Σⱼ aᵢⱼ · νⱼ = 0 per ogni elemento i', 'conservazione degli atomi: aᵢⱼ numero di atomi di i nella specie j, νⱼ coefficiente (positivo per i reagenti, negativo per i prodotti)'],
      ['Σⱼ zⱼ · νⱼ = 0', 'conservazione della carica nelle equazioni ioniche: zⱼ carica della specie j'],
      ['n(e⁻ ceduti) = n(e⁻ acquistati)', 'condizione di bilancio elettronico nelle reazioni redox']
    ],
    ipotesi: [
      'Il metodo algebrico trova i coefficienti che conservano gli atomi, ma non verifica che la reazione abbia senso chimico: con le formule sbagliate produce comunque numeri.',
      'Se le specie scritte ammettono più reazioni indipendenti, i coefficienti non sono unici e vanno fissati con informazioni chimiche aggiuntive.',
      'Le equazioni ioniche richiedono anche il bilancio della carica, che il solo conteggio degli atomi non garantisce.'
    ],
    errori: [
      'Modificare i pedici delle formule invece dei coefficienti: H₂O₂ non è un modo di bilanciare H₂O, è un’altra sostanza.',
      'Dimenticare gli elettroni nelle semireazioni e ottenere un’equazione bilanciata negli atomi ma non nella carica.',
      'Lasciare coefficienti frazionari o non ridotti ai minimi interi senza motivo.'
    ],
    esempio: {
      testo: 'Bilanciare KMnO₄ + HCl → KCl + MnCl₂ + H₂O + Cl₂. Il manganese passa da +7 a +2 e acquista 5 elettroni; il cloro passa da −1 a 0 e ne cede 1 per atomo. Due Mn acquistano 10 elettroni, che vengono da 10 Cl⁻ e formano 5 Cl₂. Con 2 KMnO₄ servono 2 KCl e 2 MnCl₂; il cloro totale a destra è 2 + 4 + 10 = 16, quindi 16 HCl; i 16 H formano 8 H₂O, che contengono gli 8 O dei due permanganati. Verifica: K 2 = 2, Mn 2 = 2, O 8 = 8, H 16 = 16, Cl 16 = 16.',
      risultato: '2 KMnO₄ + 16 HCl → 2 KCl + 2 MnCl₂ + 8 H₂O + 5 Cl₂'
    },
    fonti: [
      'Petrucci R. H., Herring F. G., Madura J. D., Bissonnette C., General Chemistry: Principles and Modern Applications, Pearson, 11ª ed., cap. 4 (reazioni chimiche) e cap. 5 (redox).',
      'Atkins P., Jones L., Laverman L., Chemical Principles: The Quest for Insight, Freeman, 7ª ed., Fundamentals H e K.',
      'Harris D. C., Quantitative Chemical Analysis, Freeman, 9ª ed., cap. 14 (fondamenti di elettrochimica).'
    ],
    collegamenti: ['ssteich', 'snernst', 'smatlin', 'senergia']
  };

  T['sdbe'] = {
    titolo: 'Gradi di insaturazione (DBE) dalla formula molecolare',
    sintesi: 'Il numero di insaturazioni, detto anche DBE (double bond equivalents) o indice di deficienza di idrogeno, si ricava dalla sola formula molecolare e conta quanti anelli e legami π contiene la molecola. È il primo passo di ogni elucidazione strutturale: restringe le strutture possibili prima ancora di guardare uno spettro.',
    paragrafi: [
      { titolo: 'Da dove viene la formula', testo: 'Un idrocarburo aciclico saturo ha formula CₙH₂ₙ₊₂. Ogni anello o doppio legame toglie due idrogeni rispetto a questa formula, un triplo legame ne toglie quattro e vale quindi due insaturazioni. Il DBE è allora la metà della differenza tra gli idrogeni di riferimento e quelli presenti. Gli altri elementi si trattano secondo la loro valenza tipica: gli alogeni, monovalenti, contano come idrogeni; l’azoto, trivalente, porta con sé un idrogeno in più nella formula satura; l’ossigeno e lo zolfo bivalenti si inseriscono in una catena senza cambiare il numero di idrogeni e quindi non entrano nel calcolo.' },
      { titolo: 'Interpretare il numero', testo: 'Un DBE uguale a zero indica una molecola satura e aciclica. Un DBE di 1 indica un anello oppure un doppio legame, che può essere C=C, C=O o C=N; un DBE di 2 può essere un triplo legame, due doppi legami, due anelli o un anello e un doppio legame. Un valore di 4 o più, con un rapporto C/H vicino a 1, fa pensare subito a un anello benzenico, che vale esattamente 4 (un anello più tre doppi legami nella struttura di Kekulé). Il DBE non dice quale tipo di insaturazione sia presente: per questo lo si combina con IR, NMR e UV.' },
      { titolo: 'Controlli di coerenza', testo: 'Il DBE di una molecola neutra con valenze ordinarie deve essere un intero non negativo. Un risultato frazionario indica una formula impossibile per una molecola neutra a guscio chiuso, oppure uno ione o un radicale: gli ioni a numero pari di elettroni prodotti in spettrometria di massa danno valori semi-interi con la formula usuale. Un valore negativo indica un errore nella formula. Lo stesso vincolo è alla base della regola dell’azoto: una molecola con un numero dispari di atomi di azoto ha massa nominale dispari.' },
      { titolo: 'Elementi con valenze diverse', testo: 'La formula standard assume C tetravalente, N trivalente, O e S bivalenti, alogeni monovalenti. Il silicio si comporta come il carbonio e il fosforo trivalente come l’azoto; la sezione considera solo C, H, N, O, S e alogeni, per cui con Si o P il calcolo va corretto a mano. Con zolfo o fosforo in stati di valenza superiori (solfossidi, solfoni, fosfati) il DBE calcolato con le valenze ordinarie non conta i legami S=O o P=O, che in quella convenzione non sono insaturazioni: un metilsolfone e un fosfato trialchilico risultano «saturi».' }
    ],
    formule: [
      ['DBE = (2C + 2 + N − H − X) / 2', 'C, H, N, X numero di atomi di carbonio, idrogeno, azoto e alogeni; O e S non compaiono'],
      ['DBE = 1 + Σᵢ nᵢ (vᵢ − 2) / 2', 'forma generale: nᵢ numero di atomi dell’elemento i, vᵢ sua valenza'],
      ['anello benzenico = 4 DBE', 'un anello più tre doppi legami C=C']
    ],
    ipotesi: [
      'Valenze ordinarie: C e Si 4, N e P 3, O e S 2, H e alogeni 1; con ipervalenza il conteggio cambia.',
      'Vale per molecole neutre a guscio chiuso; per ioni e radicali la formula dà valori non interi.',
      'Il DBE conta anelli e legami π insieme e non distingue tra loro.'
    ],
    errori: [
      'Includere l’ossigeno nel calcolo come se togliesse idrogeni: C₂H₆O ha DBE 0, come C₂H₆.',
      'Sottrarre l’azoto invece di sommarlo: l’ammina CH₅N ha DBE (2 + 2 + 1 − 5)/2 = 0.',
      'Concludere che DBE = 4 significhi sempre un benzene: anche quattro doppi legami, due tripli legami o combinazioni di anelli danno 4.'
    ],
    esempio: {
      testo: 'Aspirina, C₉H₈O₄: DBE = (2 · 9 + 2 − 8) / 2 = 12 / 2 = 6. L’anello benzenico ne spiega 4, i due gruppi carbonilici (estere e acido) le altre 2. Acetonitrile, C₂H₃N: DBE = (4 + 2 + 1 − 3) / 2 = 2, cioè il triplo legame C≡N. Clorobenzene, C₆H₅Cl: DBE = (12 + 2 − 5 − 1) / 2 = 4, l’anello aromatico.',
      risultato: 'DBE = 6 (aspirina), 2 (acetonitrile), 4 (clorobenzene)'
    },
    fonti: [
      'Silverstein R. M., Webster F. X., Kiemle D. J., Bryce D. L., Spectrometric Identification of Organic Compounds, Wiley, 8ª ed., cap. 1 (formula molecolare e indice di deficienza di idrogeno).',
      'Pretsch E., Bühlmann P., Badertscher M., Structure Determination of Organic Compounds: Tables of Spectral Data, Springer, 4ª ed., cap. 1.',
      'Pavia D. L., Lampman G. M., Kriz G. S., Vyvyan J. R., Introduction to Spectroscopy, Cengage, 5ª ed., cap. 1.'
    ],
    collegamenti: ['selucid', 'sms', 'scentro', 'smol']
  };

  T['scentrospettri'] = {
    titolo: 'Le spettroscopie a confronto: che cosa misura ciascuna tecnica',
    sintesi: 'Le tecniche spettroscopiche sondano la materia con radiazione di energie molto diverse, e ciascuna regione dello spettro elettromagnetico eccita un moto differente: transizioni elettroniche nell’UV-visibile, vibrazioni nell’infrarosso, riorientamento degli spin nucleari nelle radiofrequenze. La spettrometria di massa, che non usa radiazione, completa il quadro misurando la massa degli ioni. Sapere che cosa misura ciascuna tecnica permette di scegliere quella giusta per ogni domanda strutturale.',
    paragrafi: [
      { titolo: 'Energia, frequenza, lunghezza d’onda e numero d’onda', testo: 'Un fotone porta un’energia E = hν = hc/λ = hcν̃. I diversi ambiti della spettroscopia usano unità diverse per comodità: lunghezze d’onda in nanometri nell’UV-visibile, numeri d’onda in cm⁻¹ nell’infrarosso, frequenze in megahertz nell’NMR. Sono tutte misure della stessa grandezza. Per confrontarle con le energie chimiche conviene passare a kJ/mol: un fotone a 250 nm porta circa 480 kJ/mol, confrontabili con un’energia di legame; uno a 1700 cm⁻¹ circa 20 kJ/mol; un quanto di radiofrequenza a 400 MHz appena 0,16 J/mol.' },
      { titolo: 'Che cosa vede ciascuna tecnica', testo: 'L’UV-visibile rivela le transizioni tra orbitali e quindi i cromofori: sistemi coniugati, carbonili, anelli aromatici, complessi dei metalli. L’infrarosso rivela le vibrazioni che cambiano il momento di dipolo, e quindi i gruppi funzionali tramite frequenze caratteristiche. La risonanza magnetica nucleare misura le frequenze di precessione di nuclei come ¹H e ¹³C, sensibili all’intorno elettronico (spostamento chimico) e ai nuclei vicini attraverso i legami (accoppiamento scalare) o nello spazio (effetto NOE). La spettrometria di massa misura il rapporto m/z di ioni e dei loro frammenti, dando massa molecolare, formula (ad alta risoluzione) e indizi di connettività.' },
      { titolo: 'Popolazioni, sensibilità e intensità', testo: 'L’intensità di un segnale dipende dalla differenza di popolazione tra i livelli coinvolti, regolata dalla distribuzione di Boltzmann, e dalla probabilità della transizione. Nell’UV e nell’IR il livello superiore è praticamente vuoto a temperatura ambiente; nell’NMR la separazione è minuscola e l’eccesso di nuclei nel livello inferiore è di poche decine per milione, motivo per cui l’NMR è intrinsecamente poco sensibile e trae vantaggio da campi magnetici più intensi. L’intensità di assorbimento nell’UV-visibile e nell’IR segue la legge di Beer–Lambert, base dell’analisi quantitativa.' },
      { titolo: 'Risoluzione e scala dei tempi', testo: 'Ogni tecnica ha una propria scala dei tempi. Una transizione elettronica avviene in circa 10⁻¹⁵ s e «fotografa» la molecola ferma; l’NMR misura su scale di millisecondi o più, e se due forme si interconvertono più rapidamente vede un solo segnale mediato. Per questo una molecola può mostrare due conformeri in IR e uno solo in NMR. Anche la larghezza delle righe ha significato: una banda larga segnala scambio rapido, legami a idrogeno o, nel caso elettronico, molte transizioni vibroniche sovrapposte.' },
      { titolo: 'Come si combinano', testo: 'Nessuna tecnica basta da sola. La strategia tipica parte dalla formula molecolare (spettrometria di massa ad alta risoluzione o analisi elementare) e dal numero di insaturazioni, individua i gruppi funzionali con l’IR, costruisce lo scheletro con l’¹H e il ¹³C NMR e le correlazioni bidimensionali, e usa l’UV-visibile per caratterizzare i cromofori. Il centro spettri riunisce in un solo punto tabelle di riferimento, spettri, predittori ed esercizi proprio per seguire questo percorso.' }
    ],
    formule: [
      ['E = h ν = h c / λ = h c ν̃', 'energia del fotone: h = 6,626 × 10⁻³⁴ J s, c = 2,998 × 10⁸ m/s, ν̃ numero d’onda'],
      ['N_sup / N_inf = exp(−ΔE / k_B T)', 'rapporto di Boltzmann tra le popolazioni di due livelli separati da ΔE'],
      ['A = ε · b · c', 'legge di Beer–Lambert: ε coefficiente di assorbimento molare (M⁻¹ cm⁻¹), b cammino ottico (cm), c concentrazione (M)'],
      ['E(kJ/mol) = 119 627 / λ(nm)', 'conversione rapida tra lunghezza d’onda e energia molare del fotone']
    ],
    ipotesi: [
      'La legge di Beer–Lambert vale per soluzioni diluite, radiazione monocromatica e assenza di fenomeni come fluorescenza, diffusione o associazione del soluto.',
      'Il rapporto di Boltzmann presuppone equilibrio termico; nei laser o subito dopo un impulso NMR le popolazioni sono diverse.',
      'La spettrometria di massa non è una spettroscopia di assorbimento: le intensità dei frammenti dipendono dalla sorgente e dall’energia di ionizzazione.'
    ],
    errori: [
      'Pensare che una frequenza NMR più alta significhi un’energia «chimicamente rilevante»: anche a 900 MHz il quanto è di frazioni di J/mol.',
      'Confrontare intensità IR di bande diverse come se misurassero quantità: dipendono dalla variazione del momento di dipolo di ciascuna vibrazione.',
      'Aspettarsi due segnali NMR per due forme che si interconvertono più velocemente della scala dei tempi della misura.'
    ],
    esempio: {
      testo: 'Confrontare le energie molari di tre fotoni. UV a 250 nm: E = hcN_A/λ = 0,119627 J m mol⁻¹ / 2,50 × 10⁻⁷ m = 4,79 × 10⁵ J/mol = 479 kJ/mol. IR a 1700 cm⁻¹: E = hcN_A ν̃ = 11,963 J/mol per cm⁻¹ · 1700 = 20,3 kJ/mol. NMR a 400 MHz: E = hνN_A = 6,626 × 10⁻³⁴ · 4,00 × 10⁸ · 6,022 × 10²³ = 0,160 J/mol. A 298 K l’eccesso relativo di protoni nel livello inferiore è circa ΔE/(2k_BT) = 3,2 × 10⁻⁵, cioè 32 su un milione.',
      risultato: '479 kJ/mol (UV), 20,3 kJ/mol (IR), 0,160 J/mol (NMR); eccesso di popolazione ≈ 32 ppm'
    },
    fonti: [
      'Skoog D. A., Holler F. J., Crouch S. R., Principles of Instrumental Analysis, Cengage, 7ª ed., cap. 6 (introduzione ai metodi spettrometrici).',
      'Atkins P., de Paula J., Keeler J., Atkins’ Physical Chemistry, Oxford University Press, 11ª ed., Focus 11–12 (spettroscopia molecolare e risonanza magnetica).',
      'Silverstein R. M., Webster F. X., Kiemle D. J., Bryce D. L., Spectrometric Identification of Organic Compounds, Wiley, 8ª ed., cap. 1.'
    ],
    collegamenti: ['sspec', 'sirvis', 'sms', 'suvvis', 'snoe', 'selucid']
  };

  T['sspec'] = {
    titolo: 'Tabelle spettroscopiche di riferimento: spostamenti chimici, costanti di accoppiamento e bande IR',
    sintesi: 'Le tabelle di riferimento condensano l’esperienza di migliaia di spettri: intervalli di spostamento chimico ¹H e ¹³C per ciascun tipo di nucleo, costanti di accoppiamento J tipiche e frequenze caratteristiche delle bande IR. Per usarle bene bisogna conoscere le ragioni fisiche dei valori, cioè schermatura, anisotropia, relazione di Karplus e massa ridotta, e ricordare che sono intervalli, non numeri esatti.',
    paragrafi: [
      { titolo: 'Spostamento chimico e schermatura', testo: 'In un campo magnetico B₀ gli elettroni attorno a un nucleo generano un piccolo campo opposto che lo scherma; il nucleo sente B₀(1 − σ). Lo spostamento chimico δ, in parti per milione, misura la frequenza rispetto a un riferimento (il tetrametilsilano, δ = 0) ed è indipendente dal campo dello strumento. Atomi elettronegativi vicini sottraggono densità elettronica e spostano il segnale a δ maggiori: CH₃ alifatici intorno a 0,9 ppm, CH₃–O intorno a 3,3–3,8 ppm. L’anisotropia magnetica dei legami π spiega i valori alti dei protoni aromatici (6,5–8,5 ppm) e aldeidici (9–10 ppm) e quelli bassi dei protoni alchinici (circa 2–3 ppm).' },
      { titolo: 'Il ¹³C', testo: 'Gli spostamenti del ¹³C coprono circa 220 ppm e dipendono soprattutto dall’ibridazione e dagli atomi legati: carboni sp³ tra 0 e 90 ppm, sp² alchenici e aromatici tra 100 e 160 ppm, nitrili intorno a 115–125 ppm, carbonili di acidi, esteri e ammidi tra 160 e 185 ppm, di aldeidi e chetoni tra 190 e 220 ppm. Lo spettro si registra di solito con disaccoppiamento dei protoni, per cui ogni carbonio distinto dà una riga singola; le intensità non sono proporzionali al numero di nuclei perché tempi di rilassamento ed effetto NOE differiscono tra carboni.' },
      { titolo: 'Costanti di accoppiamento', testo: 'L’accoppiamento scalare J, trasmesso dagli elettroni di legame, divide un segnale in più righe ed è indipendente dal campo. La costante geminale ²J(H,H) è tipicamente tra −10 e −15 Hz. La vicinale ³J dipende dall’angolo diedro φ secondo la relazione di Karplus: è grande a 180° (8–13 Hz per protoni assiale–assiale in un cicloesano), piccola intorno a 60° (2–5 Hz per assiale–equatoriale ed equatoriale–equatoriale) e quasi nulla a 90°. Negli alcheni ³J trans vale 12–18 Hz e cis 6–12 Hz. Nei benzeni l’accoppiamento orto vale 6–9 Hz, il meta (⁴J) 1–3 Hz, il para (⁵J) meno di 1 Hz. ¹J(C,H) cresce con il carattere s: circa 125 Hz per sp³, 160 per sp², 250 per sp.' },
      { titolo: 'Frequenze di gruppo nell’IR', testo: 'Molte vibrazioni sono localizzate su pochi atomi e cadono in intervalli prevedibili: O–H alcolico 3200–3550 cm⁻¹ (largo per legame a idrogeno), O–H acido 2500–3300 cm⁻¹ molto largo, N–H 3300–3500, C–H sp³ sotto 3000 e sp² sopra 3000, C≡N intorno a 2250, C≡C 2100–2260, C=O 1650–1800 a seconda del gruppo (esteri circa 1740, chetoni 1715, acidi 1710, ammidi 1650–1690), C=C 1600–1680. La regione sotto 1500 cm⁻¹, detta impronta digitale, contiene vibrazioni accoppiate caratteristiche della molecola intera.' },
      { titolo: 'Il simulatore', testo: 'Il simulatore della sezione ricostruisce spettri schematici di poche molecole note (acetone, etanolo, benzene, aspirina, caffeina) per mostrare come si leggono i dati tabulati: posizione, intensità relativa e molteplicità dei segnali NMR, posizione delle bande IR, picchi principali di massa. Sono illustrazioni didattiche; per un confronto quantitativo si usano spettri sperimentali di banche dati come SDBS o NIST.' }
    ],
    formule: [
      ['δ (ppm) = 10⁶ · (ν − ν_rif) / ν_rif', 'spostamento chimico; ν_rif frequenza del riferimento (TMS)'],
      ['J (Hz) = Δδ (ppm) · ν₀ (MHz)', 'distanza fra due righe espressa in Hz; ν₀ frequenza dello strumento per quel nucleo'],
      ['³J(φ) = A cos²φ + B cosφ + C', 'relazione di Karplus; A, B, C parametri empirici (per H–C–C–H tipicamente A ≈ 7–10 Hz, B ≈ −1 Hz, C ≈ 0–1,5 Hz)'],
      ['n + 1', 'regola di molteplicità al primo ordine: n protoni equivalenti vicini danno n + 1 righe con intensità del triangolo di Tartaglia']
    ],
    ipotesi: [
      'Gli intervalli tabulati si riferiscono a solventi comuni (CDCl₃) e temperatura ambiente; i protoni scambiabili (OH, NH) variano molto con solvente, concentrazione e temperatura.',
      'La regola n + 1 vale per spettri del primo ordine, cioè quando Δν tra protoni accoppiati è molto maggiore di J; altrimenti compaiono effetti del secondo ordine.',
      'I parametri della relazione di Karplus dipendono dall’elettronegatività dei sostituenti e dagli angoli di legame.'
    ],
    errori: [
      'Attribuire 10 Hz all’accoppiamento equatoriale–equatoriale in un cicloesano: con diedro di circa 60° vale 2–5 Hz, ed è proprio questo che distingue gli assiali.',
      'Scambiare l’accoppiamento meta con quello para nei benzeni: è il meta (⁴J) a valere 1–3 Hz, il para (⁵J) è di solito non risolto.',
      'Leggere le altezze dei picchi ¹³C come proporzionali al numero di carboni.'
    ],
    esempio: {
      testo: 'In uno spettro a 400 MHz un protone vinilico appare come doppietto con righe a 7,312 e 7,272 ppm. La distanza è Δδ = 0,040 ppm, cioè J = 0,040 · 400 = 16,0 Hz. Il valore cade nell’intervallo dell’accoppiamento trans (12–18 Hz) e fuori da quello cis (6–12 Hz): il doppio legame è quindi E. Lo stesso doppietto registrato a 600 MHz avrebbe righe distanti 0,0267 ppm, ma sempre 16,0 Hz, perché J non dipende dal campo.',
      risultato: 'J = 16,0 Hz: alchene trans (E)'
    },
    fonti: [
      'Pretsch E., Bühlmann P., Badertscher M., Structure Determination of Organic Compounds: Tables of Spectral Data, Springer, 4ª ed., capitoli ¹H NMR, ¹³C NMR e IR.',
      'Silverstein R. M., Webster F. X., Kiemle D. J., Bryce D. L., Spectrometric Identification of Organic Compounds, Wiley, 8ª ed., cap. 2 (IR), 3 (¹H NMR) e 4 (¹³C NMR).',
      'Friebolin H., Basic One- and Two-Dimensional NMR Spectroscopy, Wiley-VCH, 5ª ed., cap. 2–3 (spostamento chimico e accoppiamento).'
    ],
    collegamenti: ['snmrpred', 'sirvis', 'snoe', 'scentrospettri', 'selucid']
  };

  T['sirvis'] = {
    titolo: 'Spettroscopia infrarossa: vibrazioni molecolari e bande dei gruppi funzionali',
    sintesi: 'Uno spettro IR registra l’assorbimento di radiazione da parte delle vibrazioni molecolari che modificano il momento di dipolo. Nel modello dell’oscillatore armonico la frequenza dipende dalla costante di forza del legame e dalla massa ridotta degli atomi, e per questo ciascun gruppo funzionale assorbe in intervalli caratteristici che permettono di riconoscerlo a colpo d’occhio.',
    paragrafi: [
      { titolo: 'Il modello dell’oscillatore', testo: 'Un legame tra due atomi si comporta in prima approssimazione come una molla: la frequenza di vibrazione è ν = (1/2π)√(k/μ), con k costante di forza e μ = m₁m₂/(m₁ + m₂) massa ridotta. Ne seguono tre regole utili. I legami più forti vibrano a frequenze più alte (C≡C circa 2150, C=C circa 1650, C–C circa 1000 cm⁻¹). Gli atomi leggeri alzano la frequenza, ed è per questo che le vibrazioni X–H stanno sopra 2500 cm⁻¹. La sostituzione isotopica abbassa la frequenza: passando da C–H a C–D la frequenza si riduce di un fattore vicino a √2.' },
      { titolo: 'Regole di selezione e intensità', testo: 'Una vibrazione è attiva in IR solo se cambia il momento di dipolo della molecola; nell’oscillatore armonico la regola di selezione è Δv = ±1, e a temperatura ambiente si osserva quasi solo la transizione fondamentale 0 → 1. L’intensità cresce con la variazione del dipolo: lo stiramento del C=O, molto polare, dà una delle bande più intense, mentre il C=C di un alchene simmetrico o il C≡C di un alchino interno simmetrico può essere debolissimo o assente, pur essendo visibile in Raman. L’anarmonicità reale permette sovratoni e bande di combinazione deboli, come quelle tra 1650 e 2000 cm⁻¹ dei benzeni.' },
      { titolo: 'Le regioni dello spettro', testo: 'Sopra 2500 cm⁻¹ si trovano gli stiramenti X–H: O–H, N–H e C–H. Tra 2000 e 2300 cm⁻¹ cadono i tripli legami e i cumuleni, in una zona altrimenti vuota che rende queste bande molto diagnostiche. Tra 1600 e 1850 cm⁻¹ si trovano i carbonili e i doppi legami C=C e C=N. Sotto 1500 cm⁻¹ c’è la regione dell’impronta digitale, con deformazioni e stiramenti di legami singoli accoppiati tra loro; qui cadono le bande C–O e quelle di deformazione fuori dal piano di C–H aromatici e alchenici, che indicano il tipo di sostituzione.' },
      { titolo: 'Che cosa sposta una banda', testo: 'La coniugazione abbassa la frequenza di un carbonile di 20–40 cm⁻¹, perché riduce il carattere di doppio legame: un chetone saturo assorbe a circa 1715 cm⁻¹, l’acetofenone a circa 1685. Un atomo elettronegativo legato al carbonile la alza (cloruri acilici circa 1800, esteri circa 1740), un azoto donatore per risonanza la abbassa (ammidi 1650–1690). Il legame a idrogeno allarga e abbassa le bande O–H e N–H: un OH libero in soluzione diluita dà una banda stretta a circa 3600 cm⁻¹, un alcol puro una banda larga centrata intorno a 3300. La tensione d’anello alza la frequenza dei carbonili ciclici.' }
    ],
    formule: [
      ['ν̃ = (1 / 2πc) · √(k / μ)', 'numero d’onda dello stiramento armonico: k in N/m, μ in kg, c in cm/s per ottenere cm⁻¹'],
      ['μ = m₁ m₂ / (m₁ + m₂)', 'massa ridotta dei due atomi'],
      ['ν̃(C–D) / ν̃(C–H) ≈ √(μ(C–H) / μ(C–D)) ≈ 0,73', 'effetto isotopico sulla frequenza a parità di costante di forza'],
      ['E(v) = (v + ½) h c ν̃', 'livelli dell’oscillatore armonico, v = 0, 1, 2…']
    ],
    ipotesi: [
      'Il modello armonico ignora l’anarmonicità, che abbassa le frequenze reali e consente sovratoni.',
      'L’idea di frequenza di gruppo presuppone che la vibrazione sia localizzata; nell’impronta digitale i modi sono fortemente accoppiati e non si assegnano a un solo legame.',
      'Le posizioni dipendono dallo stato del campione (solido, liquido puro, soluzione) e dal solvente.'
    ],
    errori: [
      'Attribuire a un acido carbossilico una banda O–H stretta a 3600 cm⁻¹: negli acidi la banda è larghissima, da 2500 a 3300 cm⁻¹, per la formazione di dimeri.',
      'Cercare il gruppo funzionale nell’impronta digitale prima di aver guardato le regioni diagnostiche sopra 1500 cm⁻¹.',
      'Concludere che un alchino è assente perché manca la banda C≡C: negli alchini interni simmetrici quella banda è inattiva in IR.'
    ],
    esempio: {
      testo: 'Stimare il numero d’onda dello stiramento C=O con k = 1200 N/m. Massa ridotta: μ = (12 · 16)/(12 + 16) u = 6,857 u = 6,857 · 1,6605 × 10⁻²⁷ kg = 1,1386 × 10⁻²⁶ kg. √(k/μ) = √(1200 / 1,1386 × 10⁻²⁶) = 3,246 × 10¹⁴ s⁻¹. Dividendo per 2πc = 2π · 2,998 × 10¹⁰ cm/s = 1,884 × 10¹¹ cm/s si ottiene ν̃ = 1723 cm⁻¹, proprio nella regione dei carbonili.',
      risultato: 'ν̃ ≈ 1723 cm⁻¹'
    },
    fonti: [
      'Silverstein R. M., Webster F. X., Kiemle D. J., Bryce D. L., Spectrometric Identification of Organic Compounds, Wiley, 8ª ed., cap. 2 (spettrometria infrarossa).',
      'Socrates G., Infrared and Raman Characteristic Group Frequencies: Tables and Charts, Wiley, 3ª ed., 2001.',
      'Atkins P., de Paula J., Keeler J., Atkins’ Physical Chemistry, Oxford University Press, 11ª ed., Focus 11 (spettroscopia vibrazionale).'
    ],
    collegamenti: ['sspec', 'srotovib', 'selucid', 'scentro', 'sdeconv']
  };

  T['sms'] = {
    titolo: 'Spettrometria di massa: ionizzazione elettronica, frammentazione e isotopi',
    sintesi: 'Nella spettrometria di massa a impatto elettronico la molecola perde un elettrone e forma un radicale catione, lo ione molecolare M⁺•, che si frammenta secondo vie prevedibili. Lo spettro riporta l’abbondanza relativa degli ioni in funzione del rapporto m/z. Ione molecolare, frammenti caratteristici e profilo isotopico danno massa, formula e indizi sulla struttura.',
    paragrafi: [
      { titolo: 'Ionizzazione e ione molecolare', testo: 'Con l’impatto elettronico a 70 eV, molto più dell’energia di ionizzazione delle molecole organiche (circa 8–11 eV), lo ione M⁺• si forma con un eccesso di energia interna e in parte si frammenta prima di raggiungere il rivelatore. Il picco più alto, detto picco base, è posto al 100 %; non coincide necessariamente con lo ione molecolare, che può essere debole o assente in alcoli terziari, ammine alifatiche ramificate ed eteri. Le tecniche di ionizzazione «morbida» (elettrospray, ionizzazione chimica) danno ioni come [M+H]⁺ e frammentano molto meno.' },
      { titolo: 'Frammentazioni tipiche', testo: 'La scissione in α a un eteroatomo è guidata dalla stabilizzazione per risonanza dello ione che si forma. Negli alcoli primari dà CH₂=OH⁺ a m/z 31, nelle ammine primarie CH₂=NH₂⁺ a m/z 30, nei chetoni ioni acilio R–C≡O⁺ come CH₃CO⁺ a m/z 43. Gli alcoli perdono spesso acqua (M − 18). I composti benzilici danno lo ione tropilio C₇H₇⁺ a m/z 91, il fenile compare a m/z 77. Il riarrangiamento di McLafferty richiede un idrogeno in posizione γ rispetto a un carbonile: tramite uno stato di transizione a sei centri si elimina un alchene neutro e si forma un radicale catione enolico, a m/z 44 per le aldeidi, 58 per i metilchetoni, 60 per gli acidi, 74 per gli esteri metilici.' },
      { titolo: 'Profili isotopici', testo: 'Gli elementi con più isotopi abbondanti producono gruppi di picchi riconoscibili. Il cloro (³⁵Cl 75,8 %, ³⁷Cl 24,2 %) dà M e M + 2 in rapporto circa 3 : 1, il bromo (⁷⁹Br 50,7 %, ⁸¹Br 49,3 %) circa 1 : 1; con due atomi di alogeno i profili seguono lo sviluppo del binomio. Il ¹³C (1,07 % del carbonio) fa crescere il picco M + 1 di circa 1,1 % per ogni carbonio, il che permette una stima grossolana del loro numero. Lo iodio e il fluoro sono monoisotopici.' },
      { titolo: 'Regola dell’azoto e alta risoluzione', testo: 'Poiché l’azoto ha massa pari ma valenza dispari, una molecola con un numero dispari di atomi di azoto ha massa nominale dispari; con zero o un numero pari di azoti la massa è pari. Gli spettrometri ad alta risoluzione misurano la massa con precisione di pochi ppm e distinguono composizioni con la stessa massa nominale, perché le masse esatte degli isotopi non sono intere: CO, N₂ e C₂H₄ hanno tutte massa nominale 28 ma masse esatte 27,9949, 28,0061 e 28,0313.' },
      { titolo: 'Leggere gli spettri della sezione', testo: 'Gli spettri della sezione sono schematici e raccolgono per ciascuna classe i frammenti più tipici, non lo spettro di un singolo composto reale. Per interpretarli conviene sempre chiedersi da quale ione molecolare provenga un frammento e quale massa neutra sia stata persa: 15 (CH₃), 17 (OH), 18 (H₂O), 28 (CO o C₂H₄), 29 (CHO o C₂H₅), 31 (OCH₃), 45 (OC₂H₅ o COOH). Un riarrangiamento di McLafferty, in particolare, è possibile solo se la catena contiene un idrogeno γ: l’acido propanoico e l’acetato di metile non ne hanno.' }
    ],
    formule: [
      ['m/z', 'rapporto tra massa (in u) e numero di cariche dello ione; per ioni a carica singola coincide con la massa'],
      ['I(M+1) / I(M) ≈ 1,1 % · n(C)', 'contributo del ¹³C al picco M + 1; n(C) numero di atomi di carbonio'],
      ['(a + b)ⁿ', 'il profilo isotopico di n atomi con due isotopi di abbondanza a e b segue lo sviluppo del binomio'],
      ['errore (ppm) = 10⁶ · (m_mis − m_teo) / m_teo', 'accuratezza di massa negli strumenti ad alta risoluzione']
    ],
    ipotesi: [
      'Le regole di frammentazione descritte valgono per l’impatto elettronico a 70 eV; con ionizzazioni morbide gli spettri sono diversi.',
      'Le abbondanze relative dipendono dallo strumento e dalle condizioni; le banche dati di riferimento indicano sempre la tecnica.',
      'La regola dell’azoto vale per ioni a numero dispari di elettroni come M⁺•; per [M+H]⁺ la parità si inverte.'
    ],
    errori: [
      'Prendere il picco base per lo ione molecolare: spesso è un frammento stabile come un acilio o il tropilio.',
      'Invocare il riarrangiamento di McLafferty in molecole senza idrogeni γ.',
      'Scrivere che il frammento di McLafferty di un’aldeide è a M − 44: è lo ione stesso a cadere a m/z 44, mentre la massa persa è quella dell’alchene.'
    ],
    esempio: {
      testo: 'Un composto mostra M⁺• a m/z 112 e un picco a 114 alto circa un terzo, più un frammento a m/z 77. Il rapporto 3 : 1 indica un atomo di cloro: atteso 24,2/75,8 = 0,32. La perdita 112 − 77 = 35 corrisponde a ³⁵Cl e m/z 77 è il fenile: si tratta del clorobenzene, C₆H₅Cl. Il picco M + 1 atteso dal carbonio è circa 6 · 1,07 % = 6,4 % di M. Con due atomi di cloro si avrebbe invece M : M+2 : M+4 = 1 : 0,64 : 0,10.',
      risultato: 'clorobenzene; M : M+2 ≈ 100 : 32, M+1 ≈ 6,4 %'
    },
    fonti: [
      'McLafferty F. W., Tureček F., Interpretation of Mass Spectra, University Science Books, 4ª ed., 1993.',
      'Gross J. H., Mass Spectrometry: A Textbook, Springer, 3ª ed., 2017, capitoli sulla ionizzazione elettronica e sulle frammentazioni.',
      'Silverstein R. M., Webster F. X., Kiemle D. J., Bryce D. L., Spectrometric Identification of Organic Compounds, Wiley, 8ª ed., cap. 1 (spettrometria di massa).'
    ],
    collegamenti: ['selucid', 'sdbe', 'scentrospettri', 'smol']
  };

  T['snoe'] = {
    titolo: 'NMR bidimensionale ed effetto Overhauser nucleare',
    sintesi: 'Gli esperimenti NMR bidimensionali correlano segnali tra loro: COSY collega protoni accoppiati attraverso i legami, HSQC ciascun protone al carbonio a cui è legato, HMBC protoni e carboni separati da due o tre legami. L’effetto Overhauser nucleare (NOE) collega invece protoni vicini nello spazio, entro circa 5 Å, e permette di determinare configurazioni e conformazioni.',
    paragrafi: [
      { titolo: 'Come nasce uno spettro 2D', testo: 'Un esperimento bidimensionale applica una sequenza di impulsi con un tempo di evoluzione t₁ che viene incrementato da una scansione all’altra, seguito dall’acquisizione nel tempo t₂. La doppia trasformata di Fourier produce una mappa con due assi di frequenza. I picchi sulla diagonale, negli esperimenti omonucleari, corrispondono allo spettro monodimensionale; i picchi fuori diagonale, o picchi di correlazione, indicano che la magnetizzazione è passata da un nucleo all’altro durante un tempo di mescolamento, attraverso l’accoppiamento scalare o il rilassamento dipolare.' },
      { titolo: 'COSY, HSQC, HMBC e DEPT', testo: 'Il COSY mostra correlazioni tra protoni accoppiati, soprattutto geminali e vicinali (²J e ³J), e permette di percorrere una catena di CH legati. L’HSQC correla ogni protone con il carbonio direttamente legato attraverso ¹J(C,H), circa 125–170 Hz; nella versione «editata» i CH₂ hanno fase opposta a CH e CH₃. L’HMBC sopprime le correlazioni a un legame e mostra quelle a due e tre legami, indispensabili per collegare frammenti attraverso carboni quaternari e carbonili, che non portano idrogeni. Il DEPT, monodimensionale, distingue CH, CH₂ e CH₃ dalla fase: nel DEPT-135 CH e CH₃ sono positivi, CH₂ negativi, i quaternari assenti.' },
      { titolo: 'L’effetto Overhauser nucleare', testo: 'Il NOE è la variazione dell’intensità del segnale di un nucleo quando si perturba la popolazione dei livelli di un nucleo vicino. Nasce dal rilassamento incrociato dovuto all’interazione dipolare, che dipende dalla distanza come r⁻⁶: raddoppiare la distanza riduce l’effetto di 64 volte, e oltre circa 5 Å non è più osservabile. Proprio questa dipendenza così ripida lo rende un righello molecolare: in un esperimento NOESY i picchi di correlazione indicano coppie di protoni vicine, e il confronto con una distanza nota consente di stimare quelle ignote.' },
      { titolo: 'Segno del NOE e moti molecolari', testo: 'Il segno del NOE dipende dal prodotto ω₀τ_c tra frequenza di Larmor e tempo di correlazione rotazionale. Per molecole piccole in solventi poco viscosi (ω₀τ_c ≪ 1) il NOE omonucleare è positivo, al massimo +50 %, e nel NOESY i picchi di correlazione hanno segno opposto a quello della diagonale. Per macromolecole (ω₀τ_c ≫ 1) il NOE è negativo e i picchi di correlazione hanno lo stesso segno della diagonale. Per molecole di massa intermedia, intorno a ω₀τ_c ≈ 1,1, il NOE si annulla; si usa allora il ROESY, in cui l’effetto nel sistema rotante è sempre positivo.' },
      { titolo: 'Applicazioni', testo: 'Con il NOE si distinguono isomeri cis e trans di alcheni trisostituiti, si assegnano configurazioni relative in anelli e si riconoscono le relazioni 1,3-diassiali nei cicloesani, dove i protoni assiali distano circa 2,5 Å. Nelle proteine e negli acidi nucleici i NOE tra protoni lontani nella sequenza ma vicini nello spazio, insieme agli angoli diedri ricavati dalle costanti di accoppiamento, sono i vincoli da cui si calcola la struttura tridimensionale.' }
    ],
    formule: [
      ['η ∝ r⁻⁶', 'intensità del NOE (iniziale, nell’approssimazione della coppia isolata) in funzione della distanza internucleare r'],
      ['r_ij = r_rif · (η_rif / η_ij)^(1/6)', 'stima di una distanza da un NOE di riferimento a distanza nota'],
      ['η_max = γ_S / (2 γ_I)', 'massimo NOE nel limite di moto rapido; per due protoni vale 0,5, cioè +50 %'],
      ['ω₀ τ_c ≈ 1,12', 'condizione in cui il NOE omonucleare stazionario si annulla']
    ],
    ipotesi: [
      'La relazione r⁻⁶ con un solo riferimento vale nell’approssimazione della coppia isolata e per tempi di mescolamento brevi, prima che la diffusione di spin trasferisca magnetizzazione ad altri protoni.',
      'In molecole flessibili il NOE misura una media pesata ⟨r⁻⁶⟩, dominata dalle conformazioni in cui i protoni sono più vicini.',
      'Le correlazioni HMBC a due e tre legami hanno intensità variabili e talvolta compaiono anche correlazioni a quattro legami.'
    ],
    errori: [
      'Dedurre una connettività chimica da un picco NOESY: indica solo vicinanza nello spazio, non legami.',
      'Interpretare l’assenza di un picco HMBC come prova di distanza: una ³J vicina a zero per ragioni di Karplus può far sparire una correlazione reale.',
      'Cercare i carboni quaternari nell’HSQC: compaiono solo in HMBC e nello spettro ¹³C.'
    ],
    esempio: {
      testo: 'In un NOESY il picco tra i due protoni di un CH₂ geminale (distanza 1,78 Å) ha intensità relativa 1,00, quello tra due protoni incogniti 0,050. Nell’approssimazione della coppia isolata r = 1,78 Å · (1,00 / 0,050)^(1/6) = 1,78 · 20^(1/6) = 1,78 · 1,648 = 2,93 Å. Un’intensità venti volte più piccola corrisponde dunque a una distanza appena 1,65 volte maggiore.',
      risultato: 'r ≈ 2,9 Å'
    },
    fonti: [
      'Claridge T. D. W., High-Resolution NMR Techniques in Organic Chemistry, Elsevier, 3ª ed., 2016, cap. 6 (correlazioni omonucleari), 7 (eteronucleari) e 9 (effetto Overhauser).',
      'Neuhaus D., Williamson M. P., The Nuclear Overhauser Effect in Structural and Conformational Analysis, Wiley-VCH, 2ª ed., 2000.',
      'Keeler J., Understanding NMR Spectroscopy, Wiley, 2ª ed., 2010, cap. 8–9.'
    ],
    collegamenti: ['sspec', 'snmrpred', 'selucid', 'sfisspin']
  };

  T['suvvis'] = {
    titolo: 'Spettroscopia UV-visibile: transizioni elettroniche, cromofori e regole di Woodward–Fieser',
    sintesi: 'Nell’UV-visibile (circa 190–800 nm) si osservano transizioni di elettroni da orbitali occupati a orbitali vuoti. Le più utili in chimica organica sono le π → π* dei sistemi coniugati, intense, e le n → π* dei carbonili, deboli. La lunghezza d’onda di massimo assorbimento cresce con l’estensione della coniugazione e si può stimare con le regole additive di Woodward e Fieser.',
    paragrafi: [
      { titolo: 'Tipi di transizione', testo: 'Le transizioni σ → σ* richiedono energie elevate e cadono sotto 200 nm, nell’UV da vuoto. Le n → σ* di alcoli, ammine e alogenuri cadono intorno a 170–220 nm. Le π → π* di alcheni isolati sono intorno a 170–190 nm e si spostano a lunghezze d’onda maggiori con la coniugazione: 1,3-butadiene circa 217 nm, esatriene circa 258 nm, β-carotene, con undici doppi legami coniugati, nel visibile intorno a 450 nm. Le n → π* dei carbonili saturi cadono a 270–300 nm con ε di 10–100 M⁻¹ cm⁻¹, perché sono proibite per simmetria.' },
      { titolo: 'Intensità e legge di Beer–Lambert', testo: 'L’assorbanza A = log₁₀(I₀/I) è proporzionale alla concentrazione e al cammino ottico, con costante di proporzionalità ε, il coefficiente di assorbimento molare. Le transizioni permesse hanno ε da 10³ a oltre 10⁵ M⁻¹ cm⁻¹, quelle proibite sotto 10³. Per questo una banda n → π* di un chetone richiede soluzioni concentrate, mentre un colorante si misura a concentrazioni micromolari. Le misure quantitative sono più affidabili per assorbanze tra circa 0,1 e 1, dove l’errore relativo sulla concentrazione è minimo.' },
      { titolo: 'Effetti del solvente e dei sostituenti', testo: 'Lo spostamento verso lunghezze d’onda maggiori si chiama batocromico, quello opposto ipsocromico. Nei solventi polari protici le n → π* subiscono uno spostamento ipsocromo, perché il doppietto n viene stabilizzato dal legame a idrogeno più dello stato eccitato; le π → π* si spostano spesso di poco verso il rosso. I gruppi auxocromi come OH, OR e NH₂ legati a un cromoforo spostano e intensificano le bande; donatore e accettore ai due estremi di un sistema coniugato, come nella p-nitroanilina, danno bande intense a trasferimento di carica.' },
      { titolo: 'Le regole di Woodward–Fieser', testo: 'Le regole sono empiriche e additive. Per i dieni si parte da un valore base (214 nm per un diene eteroanulare o aciclico, 253 nm per uno omoanulare) e si aggiungono 30 nm per ogni doppio legame che estende la coniugazione, 5 nm per ogni sostituente alchilico o residuo d’anello e 5 nm per ogni doppio legame esociclico. Per i chetoni α,β-insaturi la base è 215 nm per un enone aciclico o in anello a sei termini (202 nm in anello a cinque), con incrementi di 10 nm per un alchile in α, 12 in β, 18 in γ e oltre; i sostituenti OH e OR hanno incrementi grandi che dipendono dalla posizione. In etanolo la precisione tipica è di circa 5 nm.' },
      { titolo: 'Aromatici', testo: 'Il benzene mostra tre bande π → π*: una intensa intorno a 184 nm, una a circa 204 nm (ε ≈ 7 900) e una debole a 254 nm (ε ≈ 200) con struttura fine vibrazionale, proibita per simmetria. I sostituenti rompono la simmetria e intensificano e spostano questa banda: anilina e fenolo assorbono intorno a 280 e 270 nm. La fusione di anelli sposta l’assorbimento verso il rosso: il naftalene ha una banda debole intorno a 312 nm, l’antracene una banda strutturata fino a circa 375 nm.' }
    ],
    formule: [
      ['A = log₁₀(I₀ / I) = ε · b · c', 'legge di Beer–Lambert: b cammino ottico in cm, c in M, ε in M⁻¹ cm⁻¹'],
      ['λ_max = base + Σ incrementi', 'regole di Woodward–Fieser per dieni ed enoni coniugati'],
      ['E (kJ/mol) = 119 627 / λ (nm)', 'energia molare dei fotoni assorbiti']
    ],
    ipotesi: [
      'Le regole di Woodward–Fieser valgono per dieni e polieni fino a circa quattro doppi legami ed enoni semplici; per sistemi più estesi o tesi gli scarti crescono.',
      'Gli incrementi degli enoni si riferiscono all’etanolo; in altri solventi si applicano correzioni.',
      'Beer–Lambert è lineare solo per soluzioni diluite e radiazione monocromatica.'
    ],
    errori: [
      'Definire «cromoforo intenso» un gruppo che assorbe solo per n → π*: con ε intorno a 20 la banda è debole, come per il nitro alifatico.',
      'Applicare la base dei dieni a un enone o dimenticare i residui d’anello come sostituenti alchilici.',
      'Misurare un’assorbanza di 2,5 e usarla per una concentrazione: solo lo 0,3 % della luce arriva al rivelatore e l’errore è grande.'
    ],
    esempio: {
      testo: 'Ossido di mesitile, (CH₃)₂C=CH–CO–CH₃: è un enone aciclico con due metili sul carbonio β. λ_max = 215 (base) + 2 · 12 (alchili in β) = 239 nm; i valori sperimentali riportati in etanolo sono intorno a 235–237 nm. Supponendo ε = 1,2 × 10⁴ M⁻¹ cm⁻¹, una soluzione 5,0 × 10⁻⁵ M in cella da 1,00 cm ha A = 12 000 · 1,00 · 5,0 × 10⁻⁵ = 0,60, nell’intervallo ottimale per la misura.',
      risultato: 'λ_max calcolata ≈ 239 nm; A ≈ 0,60'
    },
    fonti: [
      'Silverstein R. M., Webster F. X., Kiemle D. J., Bryce D. L., Spectrometric Identification of Organic Compounds, Wiley, 8ª ed., capitolo sulla spettroscopia ultravioletta.',
      'Pavia D. L., Lampman G. M., Kriz G. S., Vyvyan J. R., Introduction to Spectroscopy, Cengage, 5ª ed., cap. 10 (UV) con le regole di Woodward–Fieser.',
      'Woodward R. B., Structure and the absorption spectra of α,β-unsaturated ketones, J. Am. Chem. Soc. 63 (1941) 1123.',
      'Harris D. C., Quantitative Chemical Analysis, Freeman, 9ª ed., cap. 17–18 (spettrofotometria).'
    ],
    collegamenti: ['scft', 'scentrospettri', 'staratura', 'sqm', 'sfislaser']
  };

  T['snmrpred'] = {
    titolo: 'Predire gli spettri NMR: tabelle di correlazione e incrementi additivi',
    sintesi: 'Gli spostamenti chimici ¹H e ¹³C di una struttura si possono stimare prima di misurarli. Il metodo più semplice assegna a ciascun tipo di nucleo l’intervallo tipico del suo gruppo funzionale; quello più fine parte da un valore base e somma incrementi tabulati per ciascun sostituente, come nella regola di Shoolery per i CH₂. I metodi moderni usano banche dati di spettri e calcoli quantistici.',
    paragrafi: [
      { titolo: 'Perché la predizione funziona', testo: 'Lo spostamento chimico di un nucleo dipende soprattutto dal suo intorno entro due o tre legami: ibridazione, elettronegatività degli atomi vicini, anisotropia di gruppi insaturi. Poiché questi effetti sono in buona parte locali e approssimativamente additivi, i contributi di sostituenti diversi si possono sommare. È la stessa idea delle tabelle di correlazione: un CH₃ legato a un carbonile cade intorno a 2,1 ppm in molte molecole diverse, perché l’intorno immediato è lo stesso.' },
      { titolo: 'Intervalli per gruppo funzionale', testo: 'Il livello più semplice, quello usato dal predittore della sezione, riconosce i gruppi presenti nello SMILES e riporta per ciascuno l’intervallo tipico: protoni aromatici 6,5–8,5 ppm, aldeidici 9–10,5, acidi carbossilici 10–13, protoni su carbonio legato a ossigeno 3,3–4,5, metili alifatici 0,7–1,3; per il ¹³C carbonili di chetoni e aldeidi 190–220 ppm, di acidi, esteri e ammidi 160–185, aromatici 110–160. È un buon punto di partenza per l’assegnazione, ma non distingue protoni dello stesso tipo in posizioni diverse e non fornisce molteplicità o costanti di accoppiamento.' },
      { titolo: 'La regola di Shoolery e gli incrementi', testo: 'Per un gruppo metilenico X–CH₂–Y la regola di Shoolery stima δ = 0,23 + σ(X) + σ(Y), dove 0,23 ppm è lo spostamento del metano e σ sono costanti tabulate: circa 0,47 per CH₃, 1,85 per fenile, 1,70 per C(=O)R, 2,36 per OR, 2,53 per Cl. Schemi analoghi, con valori base e incrementi propri, esistono per i protoni alchenici e aromatici (incrementi per sostituenti in orto, meta e para) e per il ¹³C, dove per esempio i carboni di un anello benzenico sostituito si stimano partendo da 128,5 ppm. Gli errori tipici sono di qualche decimo di ppm per l’¹H e di pochi ppm per il ¹³C.' },
      { titolo: 'Limiti degli schemi additivi', testo: 'L’additività fallisce quando i sostituenti interagiscono: più gruppi elettronegativi sullo stesso carbonio, effetti sterici in molecole affollate, legami a idrogeno intramolecolari, conformazioni che pongono un protone nel cono di schermatura di un anello. Anche il solvente conta: il benzene deuterato, per esempio, sposta selettivamente alcuni segnali. Per molecole complesse si usano predittori basati su grandi raccolte di spettri, che confrontano l’intorno di ogni atomo con intorni simili già misurati, oppure il calcolo dei tensori di schermatura con il metodo GIAO e la teoria del funzionale della densità.' },
      { titolo: 'Dalla predizione all’assegnazione', testo: 'Una predizione serve a formulare ipotesi da verificare. Il confronto con lo spettro sperimentale si fa segnale per segnale, controllando anche le integrazioni, le molteplicità e, quando ci sono, le correlazioni bidimensionali. Uno scarto grande e sistematico su un solo nucleo è spesso più informativo di un buon accordo globale: può indicare un’assegnazione sbagliata, un effetto conformazionale o una struttura diversa da quella ipotizzata.' }
    ],
    formule: [
      ['δ(X–CH₂–Y) ≈ 0,23 + σ(X) + σ(Y)', 'regola di Shoolery in ppm; σ costanti di sostituente tabulate'],
      ['δ(C, arene) ≈ 128,5 + Σ Zᵢ', 'stima ¹³C per carboni aromatici: Zᵢ incrementi del sostituente in ipso, orto, meta o para'],
      ['ν (Hz) = δ (ppm) · ν₀ (MHz)', 'conversione tra scala in ppm e frequenza relativa al riferimento']
    ],
    ipotesi: [
      'Gli schemi additivi assumono effetti dei sostituenti indipendenti e locali; con più sostituenti vicini l’errore cresce.',
      'Le tabelle si riferiscono di solito a CDCl₃ a temperatura ambiente; i protoni scambiabili non si prevedono in modo affidabile.',
      'Un intervallo per gruppo funzionale non è una previsione puntuale e non tiene conto delle posizioni relative dei gruppi.'
    ],
    errori: [
      'Prendere il valore centrale di un intervallo tabulato come spostamento previsto e meravigliarsi di uno scarto di 1 ppm.',
      'Applicare la regola di Shoolery a protoni metinici o metilici con le stesse costanti dei CH₂.',
      'Ignorare che OH e NH possono cadere quasi ovunque tra 0,5 e 5 ppm (alcoli) a seconda di concentrazione e solvente.'
    ],
    esempio: {
      testo: 'Prevedere lo spostamento del CH₂ del cloruro di benzile, C₆H₅–CH₂–Cl, con la regola di Shoolery. δ = 0,23 + σ(fenile) + σ(Cl) = 0,23 + 1,85 + 2,53 = 4,61 ppm. Il valore sperimentale in CDCl₃ è circa 4,57 ppm: l’errore è di 0,04 ppm. Il segnale è un singoletto, perché i protoni vicini più prossimi sono quelli aromatici, a quattro legami di distanza.',
      risultato: 'δ previsto ≈ 4,61 ppm (sperimentale ≈ 4,57 ppm)'
    },
    fonti: [
      'Silverstein R. M., Webster F. X., Kiemle D. J., Bryce D. L., Spectrometric Identification of Organic Compounds, Wiley, 8ª ed., cap. 3 e appendici con le costanti di Shoolery e gli incrementi.',
      'Pretsch E., Bühlmann P., Badertscher M., Structure Determination of Organic Compounds: Tables of Spectral Data, Springer, 4ª ed., capitoli ¹H e ¹³C NMR (schemi additivi).',
      'Lodewyk M. W., Siebert M. R., Tantillo D. J., Computational prediction of ¹H and ¹³C chemical shifts: a useful tool for natural product, mechanistic, and synthetic organic chemistry, Chem. Rev. 112 (2012) 1839.'
    ],
    collegamenti: ['sspec', 'snoe', 'selucid', 'scentro']
  };

  T['selucid'] = {
    titolo: 'Elucidazione strutturale: dalla formula alla struttura con IR, NMR e massa',
    sintesi: 'Determinare una struttura sconosciuta significa combinare informazioni parziali e complementari. Dalla spettrometria di massa e dall’analisi elementare si ricava la formula, da questa il numero di insaturazioni; l’IR indica i gruppi funzionali; l’¹H e il ¹³C NMR mostrano quanti ambienti chimici diversi esistono e come sono collegati. Una struttura è accettabile solo se spiega tutti i dati.',
    paragrafi: [
      { titolo: 'Primo passo: formula e insaturazioni', testo: 'Lo ione molecolare dà la massa; la regola dell’azoto indica se gli azoti sono in numero pari o dispari; i profili isotopici rivelano cloro, bromo e zolfo; la spettrometria ad alta risoluzione fornisce la formula esatta. Dalla formula si calcola il DBE, che restringe subito le possibilità: con DBE = 0 non ci sono anelli né legami multipli, con DBE ≥ 4 è probabile un anello aromatico. Già a questo punto si scartano molte strutture.' },
      { titolo: 'Secondo passo: i gruppi funzionali', testo: 'L’IR risponde a domande del tipo sì o no. C’è un carbonile intenso tra 1650 e 1800 cm⁻¹? C’è un O–H largo, e se sì è da alcol (3200–3550) o da acido (2500–3300)? Ci sono N–H, e quante bande mostrano? Ci sono C–H sopra 3000 cm⁻¹, segno di carboni sp² o sp? L’assenza di una banda forte è un’informazione tanto preziosa quanto la sua presenza: niente C=O esclude chetoni, esteri, acidi e ammidi.' },
      { titolo: 'Terzo passo: lo scheletro con l’NMR', testo: 'Nel ¹H NMR il numero di segnali indica quanti tipi di protoni non equivalenti ci sono, l’integrazione quanti protoni per tipo, lo spostamento chimico l’intorno, la molteplicità quanti protoni vicini. Un tripletto da 3H con un quartetto da 2H è la firma di un etile; un singoletto da 3H intorno a 2,1 ppm un metile legato a un carbonile; un singoletto largo che scompare dopo agitazione con D₂O un OH o NH scambiabile. Il ¹³C dice quanti carboni non equivalenti ci sono e, con il DEPT, quanti idrogeni porta ciascuno; i carboni quaternari e i carbonili compaiono solo qui.' },
      { titolo: 'Quarto passo: assemblare e verificare', testo: 'Si mettono insieme i frammenti individuati in modo da rispettare la formula, il DBE e le valenze, e si controlla ciascun dato: ogni segnale deve trovare un’assegnazione, ogni frammento di massa una spiegazione plausibile, ogni banda IR intensa un gruppo responsabile. Le strutture alternative vanno escluse esplicitamente, indicando quale dato le contraddice: è questo il ragionamento che la sezione mostra nella modalità di studio, accanto ai tre distrattori proposti per ciascuna molecola.' },
      { titolo: 'Simmetria ed equivalenza', testo: 'Il numero di segnali dipende dalla simmetria. Nell’acetone i due metili sono equivalenti per simmetria e danno un solo singoletto da 6H; nel benzene i sei protoni danno un solo segnale. I protoni di un CH₂ adiacente a un centro stereogenico sono diastereotopici e possono dare segnali distinti. Un simulatore della regola n + 1, come quello della sezione, aiuta a riconoscere la molteplicità attesa per n protoni equivalenti adiacenti, con intensità relative date dai coefficienti binomiali.' }
    ],
    formule: [
      ['DBE = (2C + 2 + N − H − X) / 2', 'numero di insaturazioni dalla formula molecolare'],
      ['molteplicità = n + 1', 'n protoni equivalenti adiacenti; intensità relative dai coefficienti binomiali (1:1, 1:2:1, 1:3:3:1…)'],
      ['integrale relativo ∝ numero di protoni', 'nell’¹H NMR le aree dei segnali sono proporzionali al numero di nuclei, a rilassamento completo']
    ],
    ipotesi: [
      'Le regole di molteplicità valgono per spettri del primo ordine e accoppiamenti uguali; con J diverse si ottengono doppietti di doppietti e figure più complesse.',
      'L’integrazione è quantitativa solo se il ritardo tra le scansioni consente il rilassamento completo dei nuclei.',
      'I protoni scambiabili spesso non mostrano accoppiamento con i vicini, per lo scambio rapido.'
    ],
    errori: [
      'Proporre una struttura che spiega il ¹H NMR ma viola la formula molecolare o il DBE.',
      'Contare i carboni dal numero di segnali ¹³C senza considerare la simmetria: il p-xilene, con otto carboni, dà tre segnali.',
      'Attribuire un singoletto largo a un CH quando scompare per scambio con D₂O.'
    ],
    esempio: {
      testo: 'Un composto C₄H₈O₂ ha IR con banda intensa a 1740 cm⁻¹ e due bande C–O a 1240 e 1050 cm⁻¹; ¹H NMR: 4,1 ppm (quartetto, 2H), 2,0 ppm (singoletto, 3H), 1,25 ppm (tripletto, 3H). DBE = (8 + 2 − 8)/2 = 1, coperto dal C=O. La frequenza a 1740 cm⁻¹ con le due bande C–O indica un estere. Il quartetto a 4,1 ppm accoppiato al tripletto a 1,25 ppm è un O–CH₂–CH₃; il singoletto a 2,0 ppm è un CH₃–C=O. In massa ci si aspetta m/z 88 e il frammento acilio a m/z 43.',
      risultato: 'acetato di etile, CH₃COOCH₂CH₃'
    },
    fonti: [
      'Silverstein R. M., Webster F. X., Kiemle D. J., Bryce D. L., Spectrometric Identification of Organic Compounds, Wiley, 8ª ed., cap. 7–8 (problemi risolti).',
      'Pavia D. L., Lampman G. M., Kriz G. S., Vyvyan J. R., Introduction to Spectroscopy, Cengage, 5ª ed., capitoli sui problemi combinati.',
      'Field L. D., Li H. L., Magill A. M., Organic Structures from Spectra, Wiley, 6ª ed., 2020.'
    ],
    collegamenti: ['sdbe', 'sms', 'sspec', 'snoe', 'sirvis']
  };

  T['sdeconv'] = {
    titolo: 'Deconvoluzione di picchi: forme di riga e minimi quadrati non lineari',
    sintesi: 'Quando bande vicine si sovrappongono, lo spettro misurato è la somma di più componenti. La deconvoluzione, più correttamente detta adattamento di picchi (peak fitting), descrive ciascuna componente con una forma analitica (gaussiana, lorentziana o pseudo-Voigt) e ne stima centro, larghezza, altezza e area minimizzando la somma dei quadrati dei residui con l’algoritmo di Levenberg–Marquardt.',
    paragrafi: [
      { titolo: 'Da dove vengono le forme di riga', testo: 'Una riga spettrale non è mai infinitamente stretta. Se la larghezza nasce dal tempo di vita finito dello stato eccitato o da collisioni, la forma è lorentziana, con ali che decrescono lentamente come 1/x². Se nasce da una distribuzione di ambienti o di velocità (allargamento Doppler nei gas, disomogeneità in un solido, funzione strumentale), la forma tende a essere gaussiana, con ali che si spengono rapidamente. Nella realtà i due meccanismi coesistono e la forma esatta è la convoluzione di una gaussiana e di una lorentziana, detta profilo di Voigt.' },
      { titolo: 'Parametri e area', testo: 'Ciascun picco si descrive con altezza h, centro c e larghezza a metà altezza w (FWHM). L’area, che è la grandezza proporzionale alla quantità della specie, dipende dalla forma: per una gaussiana è h·w·√(π/(4 ln 2)) ≈ 1,064 h·w, per una lorentziana h·w·π/2 ≈ 1,571 h·w. A parità di altezza e larghezza, quindi, una lorentziana ha un’area quasi una volta e mezza maggiore, a causa delle ali. La pseudo-Voigt, usata nella sezione, approssima la Voigt come somma pesata η·L + (1 − η)·G, con η tra 0 e 1.' },
      { titolo: 'Il problema dei minimi quadrati', testo: 'Dati N punti (xᵢ, yᵢ) e un modello f(x; p) che dipende dai parametri p, si cercano i parametri che minimizzano S = Σ(yᵢ − f(xᵢ; p))². Poiché centri e larghezze entrano in modo non lineare, non esiste una soluzione in forma chiusa e si procede per iterazioni a partire da stime iniziali. L’algoritmo di Levenberg–Marquardt interpola tra il metodo di Gauss–Newton, veloce vicino al minimo, e la discesa del gradiente, robusta lontano da esso, regolando un parametro di smorzamento λ a ogni passo.' },
      { titolo: 'Stime iniziali e unicità', testo: 'Il risultato dipende dalle stime iniziali: un minimo locale può essere molto diverso da quello globale. La sezione cerca i centri di partenza nei minimi della derivata seconda dello spettro lisciato, che rivelano anche le spalle nascoste. Il numero di componenti va scelto dall’utente con criteri chimici: aggiungendo picchi la somma dei quadrati diminuisce sempre, ma oltre un certo punto si adattano solo il rumore e la linea di base. Componenti fortemente sovrapposte hanno parametri correlati, e piccoli cambiamenti nei dati possono spostarli molto.' },
      { titolo: 'Valutare un adattamento', testo: 'Un buon adattamento ha residui piccoli e privi di struttura: se mostrano andamenti sistematici, il modello è inadeguato (forma sbagliata, una componente mancante, linea di base non costante). Il coefficiente R² è quasi sempre vicino a 1 e dice poco; più utili sono il confronto dei residui con il rumore e le incertezze dei parametri, ricavabili dalla matrice di covarianza. I parametri hanno senso fisico solo se il modello è giustificato: una deconvoluzione è un’ipotesi sulla composizione dello spettro, non una misura diretta.' }
    ],
    formule: [
      ['G(x) = h · exp(−4 ln2 · (x − c)² / w²)', 'gaussiana con altezza h, centro c e larghezza a metà altezza w; area = h·w·√(π/(4 ln 2))'],
      ['L(x) = h / (1 + 4 (x − c)² / w²)', 'lorentziana con gli stessi parametri; area = h·w·π/2'],
      ['pV(x) = η · L(x) + (1 − η) · G(x)', 'pseudo-Voigt, 0 ≤ η ≤ 1; area = η·A_L + (1 − η)·A_G'],
      ['(JᵀJ + λ · diag(JᵀJ)) · δ = Jᵀ r', 'passo di Levenberg–Marquardt: J jacobiano del modello, r residui, δ correzione dei parametri']
    ],
    ipotesi: [
      'Si assume che lo spettro sia la somma delle componenti più una linea di base (qui costante), senza interazioni tra le bande.',
      'L’adattamento ai minimi quadrati ordinari presuppone errori indipendenti con la stessa varianza su tutti i punti.',
      'La pseudo-Voigt approssima il profilo di Voigt con un errore di qualche per cento, accettabile per la maggior parte degli usi.'
    ],
    errori: [
      'Confrontare quantità usando le altezze dei picchi invece delle aree, quando le componenti hanno larghezze o forme diverse.',
      'Aumentare il numero di componenti finché R² arriva a 0,9999 e interpretare ogni componente come una specie reale.',
      'Chiamare «deconvoluzione» un adattamento di picchi: in senso stretto la deconvoluzione rimuove la funzione strumentale con un’operazione inversa, ed è un procedimento diverso.'
    ],
    esempio: {
      testo: 'Un picco ha altezza h = 0,80 e FWHM w = 12 cm⁻¹. Se è gaussiano l’area vale 0,80 · 12 · √(π/(4 ln 2)) = 9,6 · 1,0645 = 10,22 (unità di assorbanza · cm⁻¹). Se è lorentziano vale 0,80 · 12 · π/2 = 9,6 · 1,5708 = 15,08. Una pseudo-Voigt con η = 0,5 dà 0,5 · 15,08 + 0,5 · 10,22 = 12,65. Scegliere la forma sbagliata introduce dunque un errore fino al 48 % sull’area.',
      risultato: 'area ≈ 10,22 (gaussiana), 15,08 (lorentziana), 12,65 (pseudo-Voigt, η = 0,5)'
    },
    fonti: [
      'Press W. H., Teukolsky S. A., Vetterling W. T., Flannery B. P., Numerical Recipes: The Art of Scientific Computing, Cambridge University Press, 3ª ed., 2007, cap. 15 (modellazione dei dati, Levenberg–Marquardt).',
      'Marquardt D. W., An algorithm for least-squares estimation of nonlinear parameters, J. Soc. Ind. Appl. Math. 11 (1963) 431.',
      'Atkins P., de Paula J., Keeler J., Atkins’ Physical Chemistry, Oxford University Press, 11ª ed., Focus 11 (larghezza delle righe spettrali).'
    ],
    collegamenti: ['sirvis', 'staratura', 'smatnum', 'sfisanalitica']
  };

  T['scentro'] = {
    titolo: 'Una molecola, tutti gli spettri: predizione, confronto e coerenza',
    sintesi: 'Partendo da una sola struttura, scritta come nome, SMILES o disegnata nell’editor, la sezione produce gli spettri IR, ¹H e ¹³C NMR previsti, la geometria tridimensionale e il collegamento a spettri sperimentali di banche dati. Il valore di questo approccio sta nel controllo incrociato: ogni dettaglio della struttura deve lasciare una traccia coerente in tutti gli spettri.',
    paragrafi: [
      { titolo: 'Dalla struttura agli spettri attesi', testo: 'Una volta nota la struttura, gli spettri si possono prevedere in modo qualitativo con buona affidabilità. Ogni gruppo funzionale porta le sue bande IR caratteristiche; ogni tipo di protone e di carbonio non equivalente dà un segnale NMR con spostamento chimico stimabile e, per l’¹H, con un’area proporzionale al numero di protoni e una molteplicità data dai vicini. Il numero di segnali dipende dalla simmetria della molecola. Sono previsioni approssimate: posizioni e intensità servono per riconoscere, non per misurare.' },
      { titolo: 'Coerenza tra le tecniche', testo: 'Le diverse spettroscopie guardano la stessa molecola da angolazioni diverse, e le loro informazioni devono combaciare. La somma degli integrali ¹H deve dare il numero di idrogeni della formula; il numero di segnali ¹³C, tenuto conto della simmetria, deve essere compatibile con il numero di carboni; un carbonile visto in IR deve comparire nel ¹³C sopra 160 ppm; un aromatico suggerito dal DBE deve dare protoni tra 6,5 e 8,5 ppm e bande a circa 1600 e 1500 cm⁻¹. Quando un dato non torna, o la struttura è sbagliata o la previsione non è abbastanza fine.' },
      { titolo: 'Spettri previsti e spettri reali', testo: 'Il confronto con spettri sperimentali è il passo che trasforma un’ipotesi in una conferma. Le banche dati pubbliche, come SDBS del giapponese AIST e il NIST Chemistry WebBook, raccolgono spettri IR, NMR e di massa di migliaia di composti. Nel confrontare bisogna considerare le condizioni di misura: solvente e campo per l’NMR, stato del campione per l’IR (pastiglia di KBr, film, soluzione), tecnica di ionizzazione per la massa. Piccoli spostamenti dovuti a queste condizioni sono normali.' },
      { titolo: 'Confronto tra due molecole', testo: 'Mettere a confronto gli spettri di due molecole simili, per esempio due isomeri, è il modo più rapido per capire quali segnali sono diagnostici. Due isomeri di posizione hanno spesso IR molto simili nella regione dei gruppi funzionali e differenze nell’impronta digitale e nel pattern aromatico NMR; due isomeri funzionali, come un alcol e un etere della stessa formula, si distinguono subito per la presenza o l’assenza della banda O–H. Le differenze, più che le somiglianze, guidano l’interpretazione.' },
      { titolo: 'La struttura tridimensionale', testo: 'La geometria 3D aiuta a capire fenomeni che il disegno piano nasconde: l’equivalenza o meno di protoni geminali, la vicinanza nello spazio che produce effetti NOE, l’orientazione di un protone rispetto al cono di schermatura di un anello aromatico, gli angoli diedri che fissano le costanti di accoppiamento vicinali. Una conformazione mostrata dal visualizzatore è però solo una tra quelle accessibili: in soluzione la molecola si muove e gli spettri NMR riflettono la media.' }
    ],
    formule: [
      ['Σ integrali ¹H = n(H) della formula', 'controllo di coerenza tra spettro protonico e formula molecolare (protoni scambiabili inclusi se visibili)'],
      ['n(segnali ¹³C) ≤ n(C)', 'l’uguaglianza vale in assenza di simmetria; carboni equivalenti danno un solo segnale'],
      ['DBE = (2C + 2 + N − H − X) / 2', 'il numero di anelli e legami π deve trovare riscontro negli spettri (C=O in IR e ¹³C, aromatici in ¹H)']
    ],
    ipotesi: [
      'Gli spettri calcolati sono stime basate su tabelle e regole; posizioni e intensità reali possono differire sensibilmente.',
      'Gli spettri di riferimento dipendono da solvente, campo, stato del campione e tecnica: il confronto va fatto in condizioni analoghe.',
      'La struttura 3D mostrata è una singola conformazione, mentre gli spettri in soluzione mediano su tutte quelle popolate.'
    ],
    errori: [
      'Considerare un accordo approssimativo con uno spettro previsto come prova di struttura, senza controllare la coerenza tra tutte le tecniche.',
      'Aspettarsi che lo spettro ¹H di un acido carbossilico mostri sempre il segnale COOH: in solventi protici deuterati lo scambio lo fa sparire.',
      'Confrontare spettri IR registrati in pastiglia e in soluzione e interpretare come differenza strutturale lo spostamento delle bande O–H.'
    ],
    esempio: {
      testo: 'Aspirina, C₉H₈O₄. DBE = (18 + 2 − 8)/2 = 6: un anello benzenico (4) e due C=O (2). Nell’¹H NMR in CDCl₃ ci si aspettano quattro protoni aromatici tra circa 7,1 e 8,1 ppm, un singoletto da 3H intorno a 2,3 ppm (CH₃ dell’acetile) e un segnale largo sopra 10 ppm per il COOH: integrali 4 : 3 : 1, totale 8 come nella formula. Nel ¹³C la molecola, priva di simmetria, dà nove segnali, due dei quali sopra 160 ppm (estere e acido). In IR compaiono due bande C=O, intorno a 1750 e 1690 cm⁻¹.',
      risultato: '8 H = 4 + 3 + 1; 9 segnali ¹³C; DBE = 6'
    },
    fonti: [
      'Silverstein R. M., Webster F. X., Kiemle D. J., Bryce D. L., Spectrometric Identification of Organic Compounds, Wiley, 8ª ed.',
      'Pretsch E., Bühlmann P., Badertscher M., Structure Determination of Organic Compounds: Tables of Spectral Data, Springer, 4ª ed.',
      'National Institute of Advanced Industrial Science and Technology (AIST), Spectral Database for Organic Compounds SDBS; NIST Chemistry WebBook, NIST Standard Reference Database 69.'
    ],
    collegamenti: ['selucid', 'snmrpred', 'sirvis', 'smol', 'scentrospettri']
  };

  T['sfarm'] = {
    titolo: 'Farmacodinamica e classi di farmaci: bersagli, recettori e relazione dose–risposta',
    sintesi: 'Un farmaco agisce legandosi a un bersaglio molecolare, di solito un recettore, un enzima, un canale ionico o un trasportatore, e ne modifica la funzione. La farmacodinamica descrive questo legame e la risposta che ne segue con grandezze quantitative (affinità, efficacia, potenza); la classificazione dei farmaci per categoria terapeutica raggruppa molecole che condividono bersaglio o meccanismo.',
    paragrafi: [
      { titolo: 'I bersagli dei farmaci', testo: 'La grande maggioranza dei farmaci agisce su quattro famiglie di proteine. I recettori accoppiati a proteine G (bersaglio di β-bloccanti, oppioidi, antistaminici) e i recettori-canale (benzodiazepine sul GABA_A) trasducono segnali; gli enzimi vengono inibiti (FANS sulle cicloossigenasi, statine sulla HMG-CoA reduttasi, ACE-inibitori sull’enzima di conversione dell’angiotensina); i canali ionici vengono bloccati (anestetici locali sui canali del sodio, calcio-antagonisti); i trasportatori vengono inibiti (SSRI sul trasportatore della serotonina, diuretici dell’ansa sul cotrasportatore Na⁺/K⁺/2Cl⁻). Alcuni farmaci, come gli antibiotici β-lattamici, colpiscono bersagli presenti solo nel microrganismo.' },
      { titolo: 'Legame e occupazione', testo: 'Per un legame reversibile all’equilibrio vale la legge d’azione di massa: la frazione di recettori occupati è p = [A]/([A] + K_D), dove K_D è la costante di dissociazione, uguale alla concentrazione che occupa metà dei recettori. Più piccola è K_D, maggiore è l’affinità. La relazione è iperbolica: per passare dal 50 % al 90 % di occupazione serve una concentrazione nove volte K_D, per arrivare al 99 % novantanove volte. In un grafico contro il logaritmo della concentrazione la curva diventa sigmoide e copre circa due ordini di grandezza.' },
      { titolo: 'Agonisti, antagonisti, potenza ed efficacia', testo: 'Un agonista lega il recettore e lo attiva; un antagonista lo lega senza attivarlo e impedisce l’azione dell’agonista. L’efficacia misura la capacità di produrre una risposta una volta legato: gli agonisti parziali, anche a occupazione completa, producono una risposta massima minore di quella degli agonisti pieni. La potenza si esprime con l’EC₅₀, la concentrazione che produce metà dell’effetto massimo, e dipende sia dall’affinità sia dall’efficacia. Un antagonista competitivo sposta la curva dell’agonista verso destra senza ridurne il massimo; uno non competitivo ne riduce il massimo.' },
      { titolo: 'Dalla risposta alla terapia', testo: 'Il modello Emax, E = Emax·C/(EC₅₀ + C), con la sua generalizzazione sigmoide di Hill, collega concentrazione ed effetto. In clinica si considera anche la finestra terapeutica: l’indice terapeutico confronta la dose che produce effetti tossici con quella efficace, e i farmaci con indice stretto (digossina, litio, warfarin, aminoglicosidi) richiedono monitoraggio delle concentrazioni. Gli effetti avversi possono derivare dallo stesso bersaglio in altri tessuti, come il sanguinamento gastrico da inibizione della COX-1, o da bersagli diversi.' },
      { titolo: 'Classi terapeutiche', testo: 'La sezione raggruppa i farmaci per categoria terapeutica e collega malattie, organi bersaglio e farmaci. Il sistema internazionale di classificazione ATC dell’OMS ordina i principi attivi per organo o apparato, gruppo terapeutico, farmacologico e chimico, ed è utile per orientarsi. Va ricordato che una stessa classe chimica può avere usi diversi e che molecole di classi chimiche diverse possono condividere il bersaglio. Le informazioni hanno scopo didattico: dosi e indicazioni effettive si trovano nella scheda tecnica autorizzata del medicinale.' }
    ],
    formule: [
      ['p = [A] / ([A] + K_D)', 'frazione di recettori occupati all’equilibrio (equazione di Hill–Langmuir); K_D costante di dissociazione'],
      ['E = Emax · Cⁿ / (EC₅₀ⁿ + Cⁿ)', 'modello Emax sigmoide; n coefficiente di Hill, per n = 1 si riduce all’iperbole'],
      ['IT = TD₅₀ / ED₅₀', 'indice terapeutico: dose tossica nel 50 % dei soggetti diviso dose efficace nel 50 %'],
      ['dose ratio = 1 + [B] / K_B', 'equazione di Schild per un antagonista competitivo B con costante di dissociazione K_B']
    ],
    ipotesi: [
      'L’equazione di occupazione assume legame reversibile, un solo sito, equilibrio raggiunto e concentrazione libera del farmaco non impoverita dal legame.',
      'La relazione tra occupazione ed effetto non è in genere lineare: con riserva recettoriale bastano piccole occupazioni per l’effetto massimo.',
      'L’indice terapeutico ricavato su animali o popolazioni non descrive la variabilità del singolo paziente.'
    ],
    errori: [
      'Confondere potenza ed efficacia: un farmaco più potente ottiene l’effetto a concentrazioni minori, non necessariamente un effetto maggiore.',
      'Pensare che raddoppiare la dose raddoppi l’effetto: vicino al massimo della curva l’aumento è piccolo, mentre la tossicità può crescere.',
      'Considerare equivalenti tutti i farmaci di una classe: differenze di farmacocinetica e selettività contano nella scelta.'
    ],
    esempio: {
      testo: 'Un agonista ha K_D = 2,0 nM. A una concentrazione libera di 6,0 nM l’occupazione è p = 6,0 / (6,0 + 2,0) = 0,75. Per arrivare al 90 % serve [A] = 9 · K_D = 18 nM, per il 99 % [A] = 99 · K_D = 198 nM. In presenza di un antagonista competitivo con K_B = 1,0 nM alla concentrazione di 4,0 nM il rapporto di dose è 1 + 4,0/1,0 = 5: servono concentrazioni di agonista cinque volte maggiori per lo stesso effetto.',
      risultato: 'p = 75 %; 90 % a 18 nM; rapporto di dose = 5'
    },
    fonti: [
      'Ritter J. M., Flower R. J., Henderson G., Loke Y. K., MacEwan D., Rang H. P., Rang & Dale’s Pharmacology, Elsevier, 9ª ed., cap. 2–3 (come agiscono i farmaci).',
      'Brunton L. L., Knollmann B. C. (a cura di), Goodman & Gilman’s The Pharmacological Basis of Therapeutics, McGraw-Hill, 14ª ed., cap. 3 (farmacodinamica).',
      'WHO Collaborating Centre for Drug Statistics Methodology, Guidelines for ATC classification and DDD assignment, edizione corrente.'
    ],
    collegamenti: ['spkcalc', 'sdint', 'smorb', 'sclinical', 'smolprop']
  };

  T['sdint'] = {
    titolo: 'Interazioni tra farmaci: meccanismi farmacocinetici e farmacodinamici',
    sintesi: 'Due farmaci interagiscono quando uno modifica l’effetto dell’altro. Le interazioni farmacocinetiche cambiano la concentrazione del farmaco vittima (assorbimento, distribuzione, metabolismo, escrezione), soprattutto per inibizione o induzione dei citocromi P450 e dei trasportatori; quelle farmacodinamiche sommano o contrastano gli effetti sullo stesso sistema. Le più gravi riguardano farmaci con indice terapeutico stretto.',
    paragrafi: [
      { titolo: 'Interazioni sul metabolismo: inibizione dei CYP', testo: 'Gli enzimi del citocromo P450, in particolare CYP3A4, CYP2D6, CYP2C9, CYP2C19 e CYP1A2, ossidano gran parte dei farmaci. Un inibitore riduce la clearance del farmaco vittima e ne aumenta concentrazione ed effetto: amiodarone e fluconazolo inibiscono CYP2C9 e aumentano l’effetto del warfarin; claritromicina, eritromicina e antifungini azolici inibiscono CYP3A4 e aumentano le concentrazioni di simvastatina, colchicina, ciclosporina e tacrolimus. L’inibizione competitiva compare in poche ore; quella irreversibile, basata sul meccanismo, persiste finché l’enzima non viene risintetizzato.' },
      { titolo: 'Induzione enzimatica', testo: 'Alcuni farmaci, come rifampicina, carbamazepina, fenitoina e l’iperico, attivano recettori nucleari (PXR, CAR) che aumentano la sintesi di CYP e della glicoproteina P. La clearance dei farmaci vittima cresce e le loro concentrazioni calano: la rifampicina può ridurre drasticamente l’efficacia di ciclosporina e contraccettivi orali. L’induzione richiede giorni o settimane per svilupparsi e per scomparire dopo la sospensione, perché dipende dalla sintesi e dalla degradazione delle proteine. Anche i profarmaci risentono di questi meccanismi: il clopidogrel è attivato da CYP2C19, e il suo inibitore omeprazolo ne riduce l’attivazione.' },
      { titolo: 'Trasportatori, assorbimento ed escrezione', testo: 'La glicoproteina P espelle molti farmaci dagli enterociti e dalle cellule renali; inibirla aumenta le concentrazioni di substrati come digossina e colchicina. I trasportatori renali di cationi organici (OCT2, MATE) eliminano la metformina, la cui esposizione aumenta con il dolutegravir. Alcuni antiacidi e integratori di calcio, magnesio, alluminio o ferro formano chelati con fluorochinoloni e tetracicline e ne riducono l’assorbimento. FANS e diuretici riducono l’escrezione renale del litio, aumentandone la tossicità; i FANS riducono anche l’eliminazione del metotrexato.' },
      { titolo: 'Interazioni farmacodinamiche', testo: 'Due farmaci che agiscono sullo stesso sistema possono sommare gli effetti senza modificarsi le concentrazioni. Warfarin e antiaggreganti (aspirina, FANS) aumentano il rischio emorragico per azione combinata su coagulazione e piastrine; oppioidi e benzodiazepine sommano la depressione respiratoria; più farmaci serotoninergici (SSRI, tramadolo, IMAO) possono provocare sindrome serotoninergica; nitrati e inibitori della fosfodiesterasi 5 potenziano la via NO–cGMP con ipotensione grave; ACE-inibitori e spironolattone sommano l’effetto sul potassio. Anche alterazioni elettrolitiche contano: l’ipokaliemia da diuretici aumenta la tossicità della digossina.' },
      { titolo: 'Valutare la rilevanza clinica', testo: 'Non tutte le interazioni hanno lo stesso peso. Contano la frazione della clearance del farmaco vittima che passa per la via inibita, la potenza dell’inibitore alle concentrazioni raggiunte, l’ampiezza della finestra terapeutica del farmaco vittima e la possibilità di monitorare effetto o concentrazione. Il database della sezione è un insieme didattico di interazioni note e non sostituisce le fonti aggiornate (riassunti delle caratteristiche del prodotto, Stockley, banche dati professionali): l’assenza di un risultato non significa assenza di interazione.' }
    ],
    formule: [
      ['AUC_i / AUC = 1 / [fₘ / (1 + [I]/Kᵢ) + (1 − fₘ)]', 'modello statico per inibizione competitiva: fₘ frazione della clearance dovuta all’enzima inibito, [I] concentrazione dell’inibitore, Kᵢ costante di inibizione'],
      ['CL = Dose · F / AUC', 'la clearance determina l’esposizione: se CL diminuisce, a parità di dose l’AUC aumenta'],
      ['Css,media = F · Dose / (CL · τ)', 'concentrazione media allo stato stazionario: cambia in proporzione inversa alla clearance']
    ],
    ipotesi: [
      'Il modello statico assume inibizione competitiva reversibile, concentrazione costante dell’inibitore al sito enzimatico e eliminazione lineare.',
      'L’effetto massimo di un inibitore è limitato da fₘ: se la via inibita conta per il 50 % della clearance, l’AUC può al massimo raddoppiare.',
      'La variabilità genetica (metabolizzatori lenti o rapidi per CYP2D6 e CYP2C19) modifica l’entità delle interazioni.'
    ],
    errori: [
      'Ritenere sicura una combinazione perché il controllo non trova interazioni in un database limitato.',
      'Attribuire tutte le interazioni del warfarin al metabolismo: con l’aspirina il problema principale è farmacodinamico, la somma di anticoagulazione e inibizione piastrinica.',
      'Aspettarsi che l’effetto di un induttore compaia o scompaia in un giorno: segue i tempi di sintesi e degradazione degli enzimi.'
    ],
    esempio: {
      testo: 'Un farmaco è eliminato al 90 % da CYP3A4 (fₘ = 0,9). Un inibitore competitivo raggiunge [I]/Kᵢ = 4. Il rapporto di AUC è 1 / [0,9/(1 + 4) + 0,1] = 1 / (0,18 + 0,10) = 1 / 0,28 = 3,6. Se invece la via inibita contasse solo per il 30 % (fₘ = 0,3), si avrebbe 1 / (0,3/5 + 0,7) = 1 / 0,76 = 1,3. La stessa inibizione ha quindi conseguenze molto diverse sui due farmaci.',
      risultato: 'AUC × 3,6 (fₘ = 0,9) contro × 1,3 (fₘ = 0,3)'
    },
    fonti: [
      'Rowland M., Tozer T. N., Clinical Pharmacokinetics and Pharmacodynamics: Concepts and Applications, Lippincott Williams & Wilkins, 4ª ed., capitolo sulle interazioni farmacologiche.',
      'Preston C. L. (a cura di), Stockley’s Drug Interactions, Pharmaceutical Press, 12ª ed., 2019.',
      'U.S. Food and Drug Administration, Clinical Drug Interaction Studies — Cytochrome P450 Enzyme- and Transporter-Mediated Drug Interactions, Guidance for Industry, 2020.'
    ],
    collegamenti: ['spkcalc', 'sfarm', 'sclinical', 'spkcurve']
  };

  T['spkcalc'] = {
    titolo: 'Farmacocinetica: volume di distribuzione, clearance, emivita e dosaggio',
    sintesi: 'La farmacocinetica descrive come l’organismo assorbe, distribuisce ed elimina un farmaco. Nel modello a un compartimento con eliminazione del primo ordine tutto discende da due parametri primari, il volume di distribuzione e la clearance: da essi derivano costante di eliminazione, emivita, concentrazione iniziale, area sotto la curva e la dose necessaria a mantenere una concentrazione bersaglio. La funzione renale, stimata con la clearance della creatinina, guida l’aggiustamento della dose.',
    paragrafi: [
      { titolo: 'Volume di distribuzione', testo: 'Il volume di distribuzione Vd è il volume in cui il farmaco dovrebbe sciogliersi per avere ovunque la concentrazione plasmatica: Vd = quantità nell’organismo / concentrazione plasmatica. Non è un volume anatomico. Un farmaco confinato nel plasma ha Vd di circa 3 L, uno distribuito nell’acqua corporea totale circa 0,6 L/kg, mentre farmaci molto legati ai tessuti possono superare centinaia di litri. Il Vd determina la dose di carico necessaria per raggiungere subito una concentrazione bersaglio, e per questo nella sezione si inserisce in L/kg e si moltiplica per il peso.' },
      { titolo: 'Clearance, costante di eliminazione ed emivita', testo: 'La clearance CL è il volume di plasma depurato dal farmaco nell’unità di tempo; la velocità di eliminazione è CL·C. È il parametro che determina l’esposizione complessiva, misurata dall’area sotto la curva: AUC = F·Dose/CL. Nel modello a un compartimento la costante di eliminazione è kₑ = CL/Vd e l’emivita t½ = ln 2/kₑ = 0,693·Vd/CL. L’emivita è quindi un parametro derivato: cresce se aumenta il volume o se diminuisce la clearance, e due farmaci con la stessa emivita possono avere clearance molto diverse.' },
      { titolo: 'Somministrazioni ripetute e stato stazionario', testo: 'Con dosi ripetute a intervalli τ o con un’infusione continua il farmaco si accumula finché la quantità eliminata in un intervallo eguaglia quella somministrata. Il tempo per arrivarci dipende solo dall’emivita: dopo 3,3 emivite si è al 90 % dello stato stazionario, dopo 5 al 97 %. La concentrazione media allo stato stazionario dipende invece da dose, intervallo, biodisponibilità e clearance: Css,media = F·Dose/(CL·τ). Rovesciando la relazione si ottiene la dose di mantenimento per una concentrazione bersaglio, che è quanto calcola la scheda «Dosaggio».' },
      { titolo: 'Funzione renale: Cockcroft–Gault', testo: 'Per i farmaci eliminati dal rene la dose va adattata alla funzione renale. La formula di Cockcroft e Gault stima la clearance della creatinina in mL/min da età, peso e creatinina sierica, con un fattore 0,85 per le donne. Il risultato non è normalizzato per la superficie corporea, quindi non coincide con l’eGFR in mL/min/1,73 m² delle equazioni MDRD o CKD-EPI, su cui si basa la classificazione KDIGO in stadi G1–G5. Molte schede tecniche usano ancora la clearance di Cockcroft–Gault per l’aggiustamento delle dosi; per la stadiazione della malattia renale cronica si usa l’eGFR.' },
      { titolo: 'Biodisponibilità e limiti del modello', testo: 'La biodisponibilità F è la frazione della dose che raggiunge immodificata la circolazione sistemica; per via endovenosa vale 1, per via orale è ridotta da assorbimento incompleto e metabolismo di primo passaggio. Il modello a un compartimento assume che il farmaco si distribuisca istantaneamente; molti farmaci mostrano invece una fase di distribuzione iniziale (modelli a due compartimenti). L’eliminazione del primo ordine vale finché gli enzimi non sono saturi: fenitoina, etanolo e salicilati ad alte dosi seguono una cinetica saturabile di Michaelis–Menten.' }
    ],
    formule: [
      ['kₑ = CL / Vd', 'costante di eliminazione del primo ordine (h⁻¹); CL in L/h, Vd in L'],
      ['t½ = ln 2 / kₑ = 0,693 · Vd / CL', 'emivita di eliminazione, in ore se kₑ è in h⁻¹'],
      ['AUC₀→∞ = F · Dose / CL', 'esposizione totale (mg·h/L) dopo una dose'],
      ['Dose_mant = Css · CL · τ / F', 'dose di mantenimento per una concentrazione media Css con intervallo τ'],
      ['CrCl = (140 − età) · peso / (72 · Cr_s) × 0,85 se donna', 'Cockcroft–Gault: età in anni, peso in kg, creatinina sierica in mg/dL, risultato in mL/min']
    ],
    ipotesi: [
      'Modello a un compartimento, distribuzione istantanea, cinetica lineare del primo ordine.',
      'La formula di Cockcroft–Gault presuppone creatinina stabile; è inaffidabile in insufficienza renale acuta, in obesità grave e con masse muscolari anomale.',
      'C₀ = F·Dose/Vd per una dose orale è un limite superiore teorico, raggiunto solo con assorbimento istantaneo; il picco reale è più basso.'
    ],
    errori: [
      'Credere che l’emivita determini la concentrazione allo stato stazionario: determina il tempo per raggiungerlo, mentre il livello dipende dalla clearance.',
      'Inserire la clearance di Cockcroft–Gault, in mL/min, come se fosse un eGFR normalizzato a 1,73 m² e usarla per stadiare la malattia renale cronica.',
      'Dimenticare la biodisponibilità nel calcolo della dose orale, sottostimandola.'
    ],
    esempio: {
      testo: 'Con i valori iniziali della sezione: dose 500 mg endovena, Vd = 0,6 L/kg in un paziente di 70 kg, CL = 5 L/h. Vd = 0,6 · 70 = 42 L; kₑ = 5/42 = 0,119 h⁻¹; t½ = 0,693/0,119 = 5,82 h; C₀ = 500/42 = 11,9 mg/L; AUC = 500/5 = 100 mg·h/L. Per un paziente di 50 anni, 70 kg, creatinina 1,0 mg/dL, maschio: CrCl = (140 − 50) · 70 / (72 · 1,0) = 87,5 mL/min.',
      risultato: 't½ ≈ 5,8 h; C₀ ≈ 11,9 mg/L; AUC = 100 mg·h/L; CrCl ≈ 88 mL/min'
    },
    fonti: [
      'Rowland M., Tozer T. N., Clinical Pharmacokinetics and Pharmacodynamics: Concepts and Applications, Lippincott Williams & Wilkins, 4ª ed., cap. 3–5 e 11.',
      'Cockcroft D. W., Gault M. H., Prediction of creatinine clearance from serum creatinine, Nephron 16 (1976) 31.',
      'KDIGO, Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease, Kidney Int. Suppl. 3 (2013) 1.',
      'Brunton L. L., Knollmann B. C. (a cura di), Goodman & Gilman’s The Pharmacological Basis of Therapeutics, McGraw-Hill, 14ª ed., cap. 2 (farmacocinetica).'
    ],
    collegamenti: ['spkcurve', 'sdint', 'sfarm', 'skin', 'smatode']
  };

  T['spkcurve'] = {
    titolo: 'Curve concentrazione–tempo: bolo endovenoso, assorbimento orale e dosi ripetute',
    sintesi: 'La curva della concentrazione plasmatica nel tempo riassume la farmacocinetica di un farmaco. Dopo un bolo endovenoso decresce esponenzialmente; dopo una dose orale sale, raggiunge un picco e scende secondo l’equazione di Bateman; con dosi ripetute oscilla accumulandosi fino allo stato stazionario. Il confronto con la finestra terapeutica, compresa tra concentrazione minima efficace e massima tollerata, guida la scelta di dose e intervallo.',
    paragrafi: [
      { titolo: 'Bolo endovenoso', testo: 'Nel modello a un compartimento con eliminazione del primo ordine la velocità di eliminazione è proporzionale alla concentrazione, e la soluzione dell’equazione differenziale dC/dt = −kₑC è un’esponenziale: C(t) = C₀·exp(−kₑt), con C₀ = Dose/Vd. In scala semilogaritmica la curva è una retta di pendenza −kₑ, ed è così che si stima l’emivita dai dati. A ogni emivita la concentrazione si dimezza, per cui dopo 5 emivite resta circa il 3 % del picco.' },
      { titolo: 'Assorbimento orale: l’equazione di Bateman', testo: 'Dopo una dose orale il farmaco passa dal tratto gastrointestinale al plasma con una costante di assorbimento kₐ, mentre viene eliminato con kₑ. La concentrazione segue la differenza di due esponenziali: C(t) = F·Dose·kₐ/[Vd(kₐ − kₑ)]·[exp(−kₑt) − exp(−kₐt)]. Il picco si raggiunge al tempo tₘₐₓ = ln(kₐ/kₑ)/(kₐ − kₑ), quando le velocità di assorbimento ed eliminazione si eguagliano. Un assorbimento più rapido anticipa e alza il picco; una biodisponibilità F minore scala tutta la curva verso il basso senza cambiarne la forma.' },
      { titolo: 'Dosi ripetute e accumulo', testo: 'Se si somministra la stessa dose a intervalli τ, le curve delle singole dosi si sommano (principio di sovrapposizione, valido per cinetiche lineari). Ogni nuova dose trova nel corpo una quota residua delle precedenti e il livello cresce finché, allo stato stazionario, quanto entra in un intervallo eguaglia quanto esce. Il fattore di accumulo R = 1/(1 − exp(−kₑτ)) indica di quanto le concentrazioni allo stato stazionario superano quelle della prima dose: è vicino a 1 se τ è lungo rispetto all’emivita, grande se è corto. Lo stato stazionario si raggiunge in circa 4–5 emivite indipendentemente dalla dose.' },
      { titolo: 'Finestra terapeutica e fluttuazione', testo: 'La concentrazione minima efficace (MEC) e la massima tollerata (MTC) delimitano la finestra terapeutica. Allo stato stazionario le concentrazioni oscillano tra un picco e una valle; la fluttuazione cresce con il rapporto τ/t½. Per farmaci con finestra stretta si scelgono intervalli brevi, forme a rilascio prolungato o infusioni continue, che riducono le oscillazioni. Quando l’emivita è lunga e serve un effetto rapido si usa una dose di carico, calcolata dal volume di distribuzione, seguita da dosi di mantenimento.' }
    ],
    formule: [
      ['C(t) = (Dose / Vd) · exp(−kₑ t)', 'bolo endovenoso, modello a un compartimento'],
      ['C(t) = F · Dose · kₐ / [Vd (kₐ − kₑ)] · [exp(−kₑ t) − exp(−kₐ t)]', 'equazione di Bateman per l’assorbimento del primo ordine, kₐ ≠ kₑ'],
      ['tₘₐₓ = ln(kₐ / kₑ) / (kₐ − kₑ)', 'tempo del picco dopo una dose orale'],
      ['R = 1 / (1 − exp(−kₑ τ))', 'fattore di accumulo con dosi ripetute a intervallo τ'],
      ['Dose_carico = C_bersaglio · Vd / F', 'dose iniziale che porta subito alla concentrazione desiderata']
    ],
    ipotesi: [
      'Cinetica lineare: kₐ e kₑ costanti, indipendenti da dose e concentrazione; per farmaci a eliminazione saturabile la sovrapposizione non vale.',
      'Un solo compartimento: si trascura la fase di distribuzione, che dopo un bolo endovenoso produce un calo iniziale più rapido.',
      'MEC e MTC sono soglie indicative di popolazione; la risposta del singolo paziente può discostarsene.'
    ],
    errori: [
      'Pensare che aumentare la dose acceleri il raggiungimento dello stato stazionario: il tempo dipende solo dall’emivita.',
      'Leggere la pendenza della fase discendente di una curva orale come kₐ: nella maggior parte dei casi (kₐ > kₑ) la fase terminale riflette kₑ.',
      'Confondere la biodisponibilità con la velocità di assorbimento: F cambia l’area, kₐ la forma.'
    ],
    esempio: {
      testo: 'Con i valori iniziali della sezione per la via orale: Dose = 500 mg, Vd = 35 L, t½ = 6 h, kₐ = 1,0 h⁻¹, F = 0,8. Allora kₑ = 0,693/6 = 0,1155 h⁻¹. tₘₐₓ = ln(1,0/0,1155)/(1,0 − 0,1155) = 2,158/0,8845 = 2,44 h. Cₘₐₓ = 0,8 · 500 · 1,0 / (35 · 0,8845) · [exp(−0,1155 · 2,44) − exp(−2,44)] = 12,92 · (0,7545 − 0,0872) = 8,62 mg/L. Con dosi ogni 8 h il fattore di accumulo è R = 1/(1 − exp(−0,924)) = 1,66.',
      risultato: 'tₘₐₓ ≈ 2,4 h; Cₘₐₓ ≈ 8,6 mg/L; R ≈ 1,66'
    },
    fonti: [
      'Rowland M., Tozer T. N., Clinical Pharmacokinetics and Pharmacodynamics: Concepts and Applications, Lippincott Williams & Wilkins, 4ª ed., cap. 6–7 (somministrazione extravascolare) e cap. 11 (regimi a dosi multiple).',
      'Gibaldi M., Perrier D., Pharmacokinetics, Marcel Dekker, 2ª ed., 1982, cap. 1–3.',
      'Brunton L. L., Knollmann B. C. (a cura di), Goodman & Gilman’s The Pharmacological Basis of Therapeutics, McGraw-Hill, 14ª ed., cap. 2.'
    ],
    collegamenti: ['spkcalc', 'sdint', 'skin', 'smatode']
  };

  T['sclinical'] = {
    titolo: 'Ragionamento clinico e farmacoterapia: dalla diagnosi alla scelta del farmaco',
    sintesi: 'Un caso clinico si affronta raccogliendo dati (storia, esame obiettivo, esami), formulando ipotesi diagnostiche e aggiornandone la probabilità con i risultati dei test, poi scegliendo una terapia basata su prove e linee guida e adattata al paziente. I casi della sezione mostrano questo percorso per situazioni frequenti di cardiologia, pneumologia, gastroenterologia, neurologia, infettivologia, endocrinologia, reumatologia e urgenza.',
    paragrafi: [
      { titolo: 'Probabilità pre-test e post-test', testo: 'Il medico parte da una probabilità pre-test, stimata dall’epidemiologia e dal quadro clinico, e la aggiorna con ogni risultato. Lo strumento più comodo è il rapporto di verosimiglianza: LR+ = sensibilità/(1 − specificità) per un test positivo, LR− = (1 − sensibilità)/specificità per un test negativo. Moltiplicando gli odds pre-test per il rapporto di verosimiglianza si ottengono gli odds post-test. Un LR+ maggiore di 10 o un LR− minore di 0,1 cambiano molto la probabilità; valori vicini a 1 quasi nulla. È il teorema di Bayes in forma pratica.' },
      { titolo: 'Dall’ipotesi diagnostica al trattamento', testo: 'La terapia segue la fisiopatologia. Nell’infarto con sopraslivellamento del tratto ST l’obiettivo è riaprire l’arteria occlusa il prima possibile, con angioplastica primaria o, se non disponibile in tempo, con trombolisi, associando antiaggreganti e anticoagulanti; nell’edema polmonare acuto si riducono precarico e postcarico con diuretici dell’ansa e nitrati e si supporta l’ossigenazione; nelle infezioni la scelta dell’antibiotico considera il sito, i patogeni probabili e le resistenze locali. Le linee guida delle società scientifiche, aggiornate periodicamente, traducono le prove degli studi clinici in raccomandazioni graduate.' },
      { titolo: 'Adattare la terapia al paziente', testo: 'La stessa diagnosi non implica la stessa prescrizione. Età, peso, funzione renale ed epatica, gravidanza, allergie, comorbilità e farmaci già assunti modificano scelta e dose: un farmaco eliminato dal rene richiede riduzioni in insufficienza renale, un nitrato è controindicato in chi ha assunto inibitori della fosfodiesterasi 5, un β-bloccante va usato con cautela in presenza di segni di scompenso. Le controindicazioni assolute e relative, insieme alle interazioni, sono parte integrante del ragionamento terapeutico.' },
      { titolo: 'Monitoraggio ed esiti', testo: 'Dopo l’inizio della terapia si verificano efficacia e sicurezza con parametri misurabili: pressione e frequenza, diuresi, saturazione, biomarcatori come troponina o peptidi natriuretici, elettroliti, concentrazioni plasmatiche per i farmaci a indice terapeutico stretto. Un esame va richiesto se il suo risultato può cambiare una decisione. I casi della sezione indicano esami e obiettivi; le dosi riportate sono esempi didattici, mentre la pratica clinica richiede di verificarle sulle linee guida e sulle schede tecniche correnti.' }
    ],
    formule: [
      ['LR+ = Se / (1 − Sp); LR− = (1 − Se) / Sp', 'rapporti di verosimiglianza di un test con sensibilità Se e specificità Sp'],
      ['odds = p / (1 − p); p = odds / (1 + odds)', 'conversione tra probabilità e odds'],
      ['odds post-test = odds pre-test · LR', 'teorema di Bayes in forma di odds'],
      ['NNT = 1 / ARR', 'numero di pazienti da trattare per evitare un evento; ARR riduzione assoluta del rischio']
    ],
    ipotesi: [
      'Sensibilità e specificità si assumono trasferibili dalla popolazione in cui sono state misurate a quella del paziente, cosa non sempre vera.',
      'L’uso in serie di più test con i loro LR presuppone che i test siano condizionalmente indipendenti.',
      'Le raccomandazioni delle linee guida riflettono le prove disponibili alla data di pubblicazione e vanno aggiornate.'
    ],
    errori: [
      'Interpretare un test positivo senza considerare la probabilità pre-test: in un paziente a bassissimo rischio anche un buon test produce soprattutto falsi positivi.',
      'Confondere riduzione relativa e assoluta del rischio: un dimezzamento di un rischio dell’1 % salva un paziente ogni 200 trattati.',
      'Applicare uno schema terapeutico senza verificare controindicazioni, funzione renale e interazioni del singolo paziente.'
    ],
    esempio: {
      testo: 'Probabilità pre-test di malattia 20 %. Un test con sensibilità 90 % e specificità 80 % risulta positivo. LR+ = 0,90/0,20 = 4,5. Odds pre-test = 0,20/0,80 = 0,25. Odds post-test = 0,25 · 4,5 = 1,125. Probabilità post-test = 1,125/2,125 = 0,53. Se il test fosse negativo, LR− = 0,10/0,80 = 0,125, odds post-test = 0,031 e probabilità 3,0 %.',
      risultato: 'post-test 53 % se positivo, 3,0 % se negativo'
    },
    fonti: [
      'Straus S. E., Glasziou P., Richardson W. S., Haynes R. B., Evidence-Based Medicine: How to Practice and Teach EBM, Elsevier, 5ª ed., 2018, capitoli sulla diagnosi e sulla terapia.',
      'Loscalzo J., Fauci A., Kasper D., Hauser S., Longo D., Jameson J. L. (a cura di), Harrison’s Principles of Internal Medicine, McGraw-Hill, 21ª ed., 2022.',
      'Byrne R. A. et al., 2023 ESC Guidelines for the management of acute coronary syndromes, Eur. Heart J. 44 (2023) 3720.'
    ],
    collegamenti: ['sdistrib', 'sfarm', 'sdint', 'spkcalc', 'smorb']
  };

  T['smorb'] = {
    titolo: 'Fisiopatologia delle malattie e basi razionali della terapia',
    sintesi: 'Per ogni patologia la sezione collega quattro livelli: il meccanismo fisiopatologico, i biomarcatori che permettono di diagnosticarla e seguirla, i geni associati e i farmaci usati. Capire il meccanismo spiega perché un farmaco funziona, che cosa misura un biomarcatore e perché alcune malattie seguono un’ereditarietà mendeliana mentre la maggior parte risulta dall’interazione di molti geni con l’ambiente.',
    paragrafi: [
      { titolo: 'Dal meccanismo al bersaglio', testo: 'Una terapia razionale interviene su un anello della catena patogenetica. Nella leucemia mieloide cronica la traslocazione t(9;22) genera la tirosin-chinasi costitutivamente attiva BCR-ABL1, e l’imatinib, inibendola, ha trasformato la prognosi. Nell’ipertensione l’asse renina–angiotensina–aldosterone si blocca a più livelli (ACE-inibitori, sartani, antagonisti dei mineralcorticoidi). Nell’artrite reumatoide le citochine infiammatorie come TNF-α e IL-6 sono bersaglio di anticorpi monoclonali. Nella fibrosi cistica i modulatori di CFTR correggono il ripiegamento o potenziano l’apertura del canale difettoso.' },
      { titolo: 'Biomarcatori e soglie diagnostiche', testo: 'Un biomarcatore è una grandezza misurabile che indica un processo normale, patologico o una risposta alla terapia. Molte diagnosi si basano su soglie concordate: per il diabete, glicemia a digiuno ≥ 126 mg/dL o emoglobina glicata ≥ 6,5 % (48 mmol/mol), confermate; per l’ipertensione, pressione ≥ 140/90 mmHg secondo le principali linee guida europee; per la fibrosi cistica, cloro nel sudore ≥ 60 mmol/L. Le soglie sono convenzioni basate sul rischio e possono cambiare tra linee guida e nel tempo; un valore poco sopra o sotto va sempre interpretato nel contesto clinico.' },
      { titolo: 'Genetica: malattie mendeliane e complesse', testo: 'Alcune malattie sono monogeniche: la fibrosi cistica è autosomica recessiva, dovuta a mutazioni di CFTR sul cromosoma 7, la più frequente delle quali nelle popolazioni europee è F508del. In questi casi la genetica di popolazione permette calcoli semplici, come la frequenza dei portatori con la legge di Hardy–Weinberg. Diabete di tipo 2, ipertensione, artrite reumatoide e depressione sono invece malattie complesse: i geni associati (per esempio TCF7L2 nel diabete, HLA-DRB1 nell’artrite reumatoide) aumentano il rischio in modo modesto e agiscono insieme a fattori ambientali.' },
      { titolo: 'Modelli e loro limiti', testo: 'I meccanismi riassunti nelle schede sono modelli semplificati. L’ipotesi monoaminergica della depressione, per esempio, spiega il bersaglio dei farmaci antidepressivi ma non il ritardo di settimane nella loro efficacia né l’intera patogenesi, che coinvolge plasticità sinaptica, asse dello stress e infiammazione. Nella malattia di Parkinson l’accumulo di α-sinucleina e la perdita dei neuroni dopaminergici della sostanza nera spiegano i sintomi motori e l’efficacia della levodopa, ma non ancora l’origine della degenerazione. Distinguere ciò che è stabilito da ciò che è ipotesi è parte della conoscenza medica.' },
      { titolo: 'Uso didattico delle schede', testo: 'Le schede servono a collegare chimica, biochimica e farmacologia: dalla struttura di un farmaco al suo bersaglio, dal bersaglio alla via patogenetica, dalla via al biomarcatore. Non sono indicazioni terapeutiche. La scelta dei farmaci in un paziente dipende da linee guida aggiornate, stadio della malattia, comorbilità e preferenze, e alcuni elenchi includono farmaci di seconda linea o usati solo in situazioni particolari.' }
    ],
    formule: [
      ['p² + 2pq + q² = 1', 'equilibrio di Hardy–Weinberg: p e q frequenze dei due alleli, 2pq frequenza degli eterozigoti'],
      ['q = √(incidenza) per una malattia autosomica recessiva', 'stima della frequenza dell’allele patologico dalla frequenza degli omozigoti affetti'],
      ['RR = rischio(esposti) / rischio(non esposti)', 'rischio relativo, misura della forza di un’associazione tra fattore e malattia']
    ],
    ipotesi: [
      'Hardy–Weinberg assume popolazione numerosa, accoppiamento casuale, assenza di selezione, migrazione e nuove mutazioni.',
      'Le soglie diagnostiche citate si riferiscono a linee guida specifiche e possono differire tra società scientifiche e nel tempo.',
      'I meccanismi descritti sono sintesi didattiche; per molte malattie complesse la patogenesi è ancora oggetto di ricerca.'
    ],
    errori: [
      'Ritenere che un gene associato a una malattia complessa la «causi»: nella maggior parte dei casi modifica il rischio di poco.',
      'Usare la soglia di un biomarcatore come confine netto tra sano e malato senza considerare la variabilità analitica e biologica.',
      'Considerare un farmaco efficace in una patologia efficace in tutti i pazienti con quella diagnosi, ignorando sottotipi e meccanismi diversi.'
    ],
    esempio: {
      testo: 'In una popolazione europea la fibrosi cistica colpisce circa 1 neonato su 2 500. Per una malattia autosomica recessiva q² = 1/2 500, quindi q = 1/50 = 0,020 e p = 0,980. La frequenza dei portatori sani è 2pq = 2 · 0,980 · 0,020 = 0,039, cioè circa 1 persona su 25. La probabilità che due portatori abbiano un figlio malato è 1/4 a ogni gravidanza.',
      risultato: 'q = 0,02; portatori ≈ 3,9 % (circa 1 su 25)'
    },
    fonti: [
      'Kumar V., Abbas A. K., Aster J. C., Robbins & Cotran Pathologic Basis of Disease, Elsevier, 10ª ed., 2020, capitoli su malattie genetiche, immunopatologia e neoplasie.',
      'Loscalzo J. et al. (a cura di), Harrison’s Principles of Internal Medicine, McGraw-Hill, 21ª ed., 2022.',
      'Nussbaum R. L., McInnes R. R., Willard H. F., Thompson & Thompson Genetics in Medicine, Elsevier, 8ª ed., 2016, cap. 9 (genetica di popolazione).',
      'American Diabetes Association, Standards of Care in Diabetes, Diabetes Care, supplemento annuale, sezione 2 (diagnosi e classificazione).'
    ],
    collegamenti: ['sfarm', 'sclinical', 'sdistrib', 'sglic']
  };

})(typeof window !== 'undefined' ? window : globalThis);
