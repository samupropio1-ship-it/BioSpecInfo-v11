/* bsi-teoria-b.js — teoria delle sezioni (lotto B). BioSpecInfo · © Samuele Pio Provenzano */
(function (g) {
  'use strict';
  var T = g.BSITeoriaDati = g.BSITeoriaDati || {};

  /* ───────────────────────── AMMINOACIDI ───────────────────────── */
  T['saa'] = {
    titolo: "Gli amminoacidi: struttura, stato di ionizzazione e punto isoelettrico",
    sintesi: "Gli amminoacidi proteinogenici condividono uno scheletro comune, un carbonio α legato a un gruppo amminico, a un gruppo carbossilico, a un idrogeno e a una catena laterale R, e si distinguono solo per R. Da R dipendono polarità, carica, reattività e ruolo nella struttura delle proteine; dai valori di pKa dipendono la carica netta a un dato pH e il punto isoelettrico.",
    paragrafi: [
      { titolo: "Lo scheletro comune e la stereochimica",
        testo: "In tutti gli α-amminoacidi standard tranne la glicina il carbonio α è uno stereocentro, perché porta quattro sostituenti diversi. Le proteine sono costruite quasi esclusivamente con la forma L, definita per confronto con la L-gliceraldeide nella convenzione di Fischer. La notazione D/L non coincide con quella R/S di Cahn, Ingold e Prelog: la L-alanina e quasi tutti gli altri L-amminoacidi sono S, ma la L-cisteina è R perché l'atomo di zolfo della catena laterale cambia l'ordine di priorità dei sostituenti. Isoleucina e treonina hanno un secondo stereocentro nel carbonio β, quindi esistono come quattro stereoisomeri, di cui uno solo è proteinogenico." },
      { titolo: "La classificazione per catena laterale",
        testo: "La sezione raggruppa i venti amminoacidi in apolari, polari non carichi, carichi positivamente, carichi negativamente, aromatici e speciali, secondo uno schema molto vicino a quello dei principali manuali. Le catene alifatiche di alanina, valina, leucina, isoleucina e metionina tendono a stare nel nucleo idrofobico delle proteine globulari; serina, treonina, asparagina e glutammina formano legami a idrogeno con l'acqua e con lo scheletro peptidico; aspartato e glutammato sono anioni a pH fisiologico, lisina e arginina cationi. L'istidina viene messa fra i carichi positivi, ma con un pKa della catena intorno a 6 è protonata solo in piccola parte a pH 7,4: proprio per questo è il gruppo più usato dagli enzimi come donatore e accettore di protoni. Glicina e prolina sono «speciali» per ragioni conformazionali: la prima è molto flessibile, la seconda ha l'azoto chiuso in un anello che blocca l'angolo φ e destabilizza le α-eliche." },
      { titolo: "Ionizzazione e forma zwitterionica",
        testo: "In soluzione acquosa vicino alla neutralità un amminoacido non esiste nella forma neutra H₂N–CHR–COOH che si disegna per comodità, ma come zwitterione ⁺H₃N–CHR–COO⁻. Il gruppo carbossilico ha un pKa intorno a 2, molto più basso di quello di un acido carbossilico semplice perché il gruppo ammonio vicino stabilizza per effetto induttivo ed elettrostatico la base coniugata; il gruppo α-ammonio ha un pKa fra 9 e 10,5. Le catene ionizzabili aggiungono un terzo equilibrio: carbossili di Asp e Glu (pKa circa 3,7 e 4,3), imidazolo di His (circa 6), tiolo di Cys (circa 8,2), ammonio ε di Lys (circa 10,5), fenolo di Tyr (circa 10,5) e guanidinio di Arg (circa 12,5). I valori mostrati nelle schede si riferiscono all'amminoacido libero in acqua a 25 °C: dentro una proteina lo stesso gruppo può spostarsi di diverse unità di pKa a causa dell'ambiente locale." },
      { titolo: "Carica netta e punto isoelettrico",
        testo: "Per ogni gruppo ionizzabile la frazione protonata a un certo pH si ricava dall'equazione di Henderson–Hasselbalch, e la carica netta è la somma algebrica dei contributi dei singoli gruppi. Il punto isoelettrico pI è il pH al quale la carica netta media è zero e la molecola non migra in un campo elettrico. Per un amminoacido con catena non ionizzabile il pI è la media dei due pKa dello scheletro; per uno con catena acida o basica è la media dei due pKa che delimitano la forma con carica zero, cioè i due valori più bassi per Asp e Glu e i due più alti per Lys, Arg e His. Su questa proprietà si basano l'elettroforesi e la focalizzazione isoelettrica delle proteine." },
      { titolo: "Assorbimento UV e amminoacidi non standard",
        testo: "Triptofano e tirosina, e in misura molto minore fenilalanina e cistina, assorbono nell'ultravioletto vicino a 280 nm. Il coefficiente di assorbimento molare del triptofano a 280 nm è circa 5500 M⁻¹ cm⁻¹, quello della tirosina circa 1490 M⁻¹ cm⁻¹: per questo l'assorbanza a 280 nm è il metodo più rapido per stimare la concentrazione di una proteina di sequenza nota. La sezione elenca anche amminoacidi non standard: alcuni sono incorporati durante la traduzione con un codone di stop ricodificato, come selenocisteina (UGA) e pirrolisina (UAG); altri nascono da modifiche post-traduzionali, come l'idrossiprolina del collagene; altri ancora non entrano nelle proteine ma sono metaboliti, come ornitina e citrullina del ciclo dell'urea o il neurotrasmettitore GABA." }
    ],
    formule: [
      ["pH = pKa + log([A⁻]/[HA])", "equazione di Henderson–Hasselbalch per un singolo gruppo: [A⁻] forma deprotonata, [HA] forma protonata, concentrazioni in mol/L"],
      ["f(protonata) = 1 / (1 + 10^(pH − pKa))", "frazione di un gruppo che porta il protone al pH dato; è adimensionale, vale 0,5 quando pH = pKa"],
      ["pI = (pKa,i + pKa,j) / 2", "punto isoelettrico: media dei due pKa che delimitano la specie a carica netta zero (pKa₁ e pKa₂ per catene neutre)"],
      ["A₂₈₀ = ε₂₈₀ · c · l,  ε₂₈₀ ≈ nTrp·5500 + nTyr·1490 (M⁻¹ cm⁻¹)", "legge di Lambert–Beer applicata alle proteine: c concentrazione molare, l cammino ottico in cm; stima empirica del coefficiente (Pace et al., 1995)"]
    ],
    ipotesi: [
      "I pKa tabulati valgono per l'amminoacido libero in soluzione acquosa diluita a 25 °C; dipendono da temperatura e forza ionica, e in una proteina possono cambiare molto.",
      "Il calcolo del pI come media di due pKa trascura i gruppi che a quel pH sono quasi completamente in una sola forma; è un'ottima approssimazione per gli amminoacidi, meno per i peptidi con molti gruppi ionizzabili vicini.",
      "Valori di pKa e masse molari possono differire di qualche centesimo fra manuali diversi, che usano misure e convenzioni differenti."
    ],
    errori: [
      "Pensare che L significhi sempre S: la L-cisteina è R, perché la priorità CIP dipende dagli atomi effettivamente legati allo stereocentro.",
      "Disegnare l'amminoacido in soluzione neutra come molecola non carica: a pH vicino a 7 la specie dominante è lo zwitterione.",
      "Calcolare il pI dell'acido glutammico come media di pKa₁ e pKa₂ dello scheletro: per un amminoacido acido vanno mediati i due pKa più bassi.",
      "Ritenere che l'istidina sia «carica positiva» a pH 7,4: con pKa circa 6 è protonata solo per pochi punti percentuali."
    ],
    esempio: {
      testo: "Si calcoli il punto isoelettrico del glutammato e la frazione di catene laterali di istidina protonate a pH 7,4, usando i valori della sezione (Glu: pKa₁ = 2,19, pKaR = 4,25, pKa₂ = 9,67; His: pKaR = 6,00). Per il glutammato la specie neutra è quella con il carbossile α deprotonato, il carbossile della catena protonato e l'ammonio protonato; è delimitata da pKa₁ e pKaR, quindi pI = (2,19 + 4,25)/2 = 3,22. Per l'istidina la frazione protonata è f = 1/(1 + 10^(7,4 − 6,00)) = 1/(1 + 10^1,4) = 1/(1 + 25,1) = 0,038.",
      risultato: "pI(Glu) = 3,22; a pH 7,4 circa il 3,8 % delle catene di istidina libera è protonato"
    },
    fonti: [
      "D. L. Nelson, M. M. Cox, Lehninger Principles of Biochemistry, 7ª ed., W. H. Freeman, 2017, cap. 3 «Amino Acids, Peptides, and Proteins»",
      "J. M. Berg, J. L. Tymoczko, G. J. Gatto, L. Stryer, Biochemistry, 9ª ed., W. H. Freeman, 2019, cap. «Protein Composition and Structure»",
      "C. N. Pace, F. Vajdos, L. Fee, G. Grimsley, T. Gray, How to measure and predict the molar absorption coefficient of a protein, Protein Science 4 (1995) 2411–2423",
      "IUPAC–IUB Joint Commission on Biochemical Nomenclature, Nomenclature and Symbolism for Amino Acids and Peptides, Pure and Applied Chemistry 56 (1984) 595–624"
    ],
    collegamenti: ['spka', 'sbio', 'sstruct', 'sbuffer', 'surea']
  };

  /* ───────────────────────── BIOMOLECOLE ───────────────────────── */
  T['sbio'] = {
    titolo: "Le quattro classi di biomolecole: carboidrati, lipidi, nucleotidi e proteine",
    sintesi: "Le macromolecole biologiche nascono dalla condensazione di pochi tipi di monomeri: monosaccaridi uniti da legami glicosidici, acidi grassi esterificati nei lipidi, nucleotidi uniti da legami fosfodiesterici, amminoacidi uniti da legami peptidici. La funzione di ciascuna classe dipende da dettagli strutturali precisi, come la configurazione anomerica di un legame glicosidico, la presenza di un doppio legame cis in una catena acilica o un ossidrile in posizione 2′.",
    paragrafi: [
      { titolo: "Monosaccaridi: configurazione, ciclizzazione e anomeri",
        testo: "Un monosaccaride è una poliidrossialdeide (aldoso) o un poliidrossichetone (chetoso). La serie D o L si stabilisce guardando lo stereocentro più lontano dal carbonile, confrontato con la D-gliceraldeide; in natura prevalgono gli zuccheri D. In acqua gli esosi e i pentosi esistono soprattutto in forma ciclica, perché un ossidrile attacca il carbonile formando un emiacetale (o emichetale): il glucosio chiude un anello a sei termini (piranosio), il fruttosio nelle sue forme combinate e il ribosio negli acidi nucleici un anello a cinque (furanosio). La ciclizzazione crea un nuovo stereocentro, il carbonio anomerico, e quindi due anomeri α e β. Nel β-D-glucopiranosio in conformazione a sedia tutti i sostituenti diversi dall'idrogeno sono equatoriali, e infatti all'equilibrio in acqua l'anomero β prevale. Il passaggio fra i due anomeri attraverso la forma aperta si chiama mutarotazione. Due zuccheri che differiscono per la configurazione di un solo carbonio diverso dall'anomerico sono epimeri: galattosio (C4) e mannosio (C2) sono epimeri del glucosio." },
      { titolo: "Polisaccaridi: il legame glicosidico decide la funzione",
        testo: "Amido, glicogeno e cellulosa sono tutti polimeri del glucosio, ma la loro funzione è opposta. I legami α(1→4) dell'amilosio e del glicogeno impongono alla catena un andamento elicoidale, accessibile agli enzimi e adatto alla riserva; le ramificazioni α(1→6), ogni 8–12 residui nel glicogeno e più distanziate nell'amilopectina, moltiplicano le estremità non riducenti da cui la glicogeno fosforilasi stacca le unità di glucosio. I legami β(1→4) della cellulosa producono invece catene distese che si impacchettano in fibre tenute insieme da legami a idrogeno: un materiale strutturale che l'uomo non può idrolizzare perché non possiede cellulasi. La chitina ripete lo stesso motivo β(1→4) con la N-acetilglucosammina." },
      { titolo: "Lipidi: catene, insaturazioni e membrane",
        testo: "Gli acidi grassi si descrivono con la notazione numero di carboni:numero di doppi legami, con la posizione dei doppi legami contata dal carbossile (Δ) o dall'estremità metilica (ω o n). Il palmitato è 16:0, l'oleato 18:1 cis-Δ9 (n-9), il linoleato 18:2 cis-Δ9,12 (n-6). Un doppio legame cis introduce una piega che impedisce l'impacchettamento delle catene: per questo l'acido oleico fonde a circa 13–16 °C mentre l'acido stearico, saturo e della stessa lunghezza, fonde intorno a 69 °C. Triacilgliceroli e fosfolipidi sono esteri del glicerolo; i fosfolipidi, anfipatici, si organizzano spontaneamente in doppi strati, la struttura di base delle membrane, la cui fluidità è modulata dal grado di insaturazione e dal colesterolo." },
      { titolo: "Nucleotidi: basi, zuccheri e legami ad alto potenziale",
        testo: "Un nucleotide è formato da una base azotata (purina o pirimidina) legata con un legame N-glicosidico β al carbonio 1′ di un pentoso, che porta uno o più fosfati esterificati in 5′. Il ribosio dell'RNA ha un ossidrile in 2′ che il desossiribosio del DNA non ha: questo ossidrile può attaccare il fosfodiestere adiacente, ed è la ragione per cui l'RNA viene idrolizzato in ambiente alcalino mentre il DNA resiste. I nucleotidi hanno anche ruoli non informazionali: l'ATP è il principale donatore di gruppi fosforici, NAD⁺, FAD e coenzima A contengono un'unità di adenosina difosfato, l'UDP-glucosio è la forma attivata del glucosio per la sintesi del glicogeno." },
      { titolo: "Proteine: i livelli di struttura",
        testo: "La struttura primaria è la sequenza degli amminoacidi; la secondaria comprende eliche α e foglietti β stabilizzati da legami a idrogeno dello scheletro; la terziaria è il ripiegamento tridimensionale della catena, guidato soprattutto dall'effetto idrofobico e rifinito da legami a idrogeno, ponti salini e, nelle proteine extracellulari, ponti disolfuro; la quaternaria è l'associazione di più catene. La stabilità netta di una proteina ripiegata è piccola, tipicamente qualche decina di kJ/mol, perché risulta dalla differenza fra contributi favorevoli e sfavorevoli molto grandi: basta un aumento di temperatura o un denaturante per spostare l'equilibrio verso lo stato svolto." }
    ],
    formule: [
      ["[α]ₑq = xα·[α]α + (1 − xα)·[α]β", "rotazione specifica all'equilibrio di mutarotazione come media pesata dei due anomeri; xα frazione molare dell'anomero α, rotazioni in gradi·mL·g⁻¹·dm⁻¹"],
      ["ATP⁴⁻ + H₂O → ADP³⁻ + Pᵢ + H⁺,  ΔG°′ ≈ −30,5 kJ/mol", "idrolisi del legame fosfoanidridico terminale in condizioni standard biochimiche (pH 7, Mg²⁺ presente); in cellula ΔG è più negativo, circa −50 kJ/mol"],
      ["n monomeri → polimero + (n − 1) H₂O", "le macromolecole si formano per condensazione: ogni legame glicosidico, peptidico o estereo libera una molecola d'acqua e si scinde per idrolisi"]
    ],
    ipotesi: [
      "Le rotazioni specifiche dipendono da lunghezza d'onda (riga D del sodio), temperatura e solvente; il calcolo della composizione all'equilibrio assume che la forma aperta e le forme furanosiche siano trascurabili, come accade per il glucosio.",
      "I valori di ΔG°′ e di temperatura di fusione citati sono valori di letteratura arrotondati: variano leggermente con le condizioni sperimentali e la fonte."
    ],
    errori: [
      "Identificare α con «OH in giù» in qualunque rappresentazione: la definizione corretta confronta la configurazione del carbonio anomerico con quella del carbonio che decide la serie D/L.",
      "Credere che amido e cellulosa differiscano per il monomero: entrambi sono polimeri del D-glucosio, cambia la configurazione del legame glicosidico.",
      "Dire che l'energia dell'ATP è «contenuta nel legame»: il ΔG negativo dell'idrolisi è una proprietà dell'intera reazione (repulsione elettrostatica, stabilizzazione per risonanza e solvatazione dei prodotti), non di un singolo legame."
    ],
    esempio: {
      testo: "Una soluzione appena preparata di α-D-glucopiranosio ha rotazione specifica +112,2°, una di β-D-glucopiranosio +18,7°; entrambe, lasciate a sé, raggiungono +52,7°. Si calcoli la composizione all'equilibrio. Dalla media pesata: 52,7 = 112,2·xα + 18,7·(1 − xα), quindi xα = (52,7 − 18,7)/(112,2 − 18,7) = 34,0/93,5 = 0,364 e xβ = 0,636.",
      risultato: "circa 36 % di anomero α e 64 % di anomero β"
    },
    fonti: [
      "D. L. Nelson, M. M. Cox, Lehninger Principles of Biochemistry, 7ª ed., W. H. Freeman, 2017, capitoli «Carbohydrates and Glycobiology», «Nucleotides and Nucleic Acids», «Lipids»",
      "J. M. Berg, J. L. Tymoczko, G. J. Gatto, L. Stryer, Biochemistry, 9ª ed., W. H. Freeman, 2019, capitoli «Carbohydrates» e «Lipids and Cell Membranes»",
      "D. Voet, J. G. Voet, Biochemistry, 4ª ed., Wiley, 2011, capitoli su zuccheri e polisaccaridi e su lipidi e membrane"
    ],
    collegamenti: ['saa', 'sstruct', 'sbiosyn', 'sglyc', 'smacro3d']
  };

  /* ───────────────────────── SINTESI BIOLOGICHE ───────────────────────── */
  T['sbiosyn'] = {
    titolo: "Principi delle biosintesi: accoppiamento energetico, trasportatori attivati e meccanismi",
    sintesi: "Le vie biosintetiche costruiscono molecole complesse da precursori semplici spendendo ATP e potere riducente sotto forma di NADPH. Non sono l'inverso delle vie cataboliche: usano almeno una tappa diversa, irreversibile e regolata, e spesso un compartimento diverso. La chimica di ogni tappa è chimica organica classica, condensazioni di Claisen, aldoliche, basi di Schiff, decarbossilazioni, che gli enzimi rendono rapida e selettiva.",
    paragrafi: [
      { titolo: "Perché anabolismo e catabolismo usano vie diverse",
        testo: "Se una via biosintetica fosse esattamente l'inverso di una degradativa, il suo ΔG complessivo sarebbe l'opposto, quindi positivo, e le due direzioni non potrebbero essere regolate in modo indipendente. Le cellule risolvono il problema sostituendo una o più tappe con reazioni diverse che consumano energia aggiuntiva: la gluconeogenesi aggira le tre tappe irreversibili della glicolisi, la sintesi degli acidi grassi avviene nel citosol con il malonil-CoA mentre la β-ossidazione è mitocondriale. In questo modo entrambe le direzioni hanno ΔG negativo nelle condizioni cellulari e possono essere accese o spente separatamente, spesso con segnali reciproci: il malonil-CoA, primo intermedio della lipogenesi, inibisce la carnitina palmitoiltransferasi I e blocca l'ingresso degli acidi grassi nel mitocondrio." },
      { titolo: "L'accoppiamento energetico",
        testo: "Una reazione con ΔG°′ positivo procede se viene accoppiata, attraverso un intermedio comune, a una reazione fortemente esoergonica. I ΔG°′ delle reazioni accoppiate si sommano e la costante di equilibrio complessiva è il prodotto delle costanti. Spesso l'ATP non viene semplicemente idrolizzato: trasferisce un gruppo fosforico o un gruppo adenilico al substrato, creando un intermedio attivato. Quando la scissione libera pirofosfato, come nell'attivazione degli acidi grassi o nella sintesi dell'UDP-glucosio, la successiva idrolisi del PPᵢ da parte della pirofosfatasi inorganica (ΔG°′ circa −19 kJ/mol) rende la reazione praticamente irreversibile. È il motivo per cui nei bilanci si contano i «legami fosfoanidridici» e non solo le molecole di ATP." },
      { titolo: "I trasportatori attivati",
        testo: "Molte biosintesi si ripetono con lo stesso schema: un piccolo gruppo viene caricato su un trasportatore in una forma reattiva e poi trasferito. L'ATP trasporta fosforile, il NADPH elettroni e ioni idruro per le riduzioni, il coenzima A e la proteina trasportatrice di acili (ACP) trasportano acili come tioesteri, la biotina trasporta CO₂ attivata nelle carbossilazioni, il tetraidrofolato unità monocarboniose, la S-adenosilmetionina gruppi metilici. Gli zuccheri entrano nei polimeri come nucleotidi-zuccheri (UDP-glucosio per il glicogeno, ADP-glucosio per l'amido), i fosfolipidi come derivati CDP (CDP-diacilglicerolo, CDP-colina), le purine vengono costruite direttamente sul ribosio-5-fosfato attivato come PRPP. Riconoscere il trasportatore permette di prevedere la chimica della tappa." },
      { titolo: "I meccanismi con le frecce",
        testo: "Le schede della sezione disegnano i meccanismi con le frecce curve, e la logica è quella della chimica organica. La chetoacil-ACP sintasi esegue una condensazione di Claisen in cui il carbanione si genera per decarbossilazione del malonile: la perdita di CO₂ rende la condensazione favorevole, e la stessa CO₂ era stata aggiunta dall'acetil-CoA carbossilasi a spese di ATP. L'aldolasi di classe I dei vertebrati forma una base di Schiff fra una lisina e il carbonile del substrato, che funziona da pozzo di elettroni. Il piridossal fosfato fa lo stesso con gli amminoacidi: forma un'aldimmina con il gruppo amminico e stabilizza i carbanioni necessari a transaminazioni, decarbossilazioni e racemizzazioni. Le deidrogenasi trasferiscono uno ione idruro al carbonio 4 dell'anello nicotinammidico del NAD(P)⁺." },
      { titolo: "Compartimenti e regolazione",
        testo: "Nelle cellule eucariotiche le vie si separano anche nello spazio: la sintesi degli acidi grassi e la via dei pentosi fosfati sono citosoliche, il colesterolo si completa nel reticolo endoplasmatico, la sintesi dell'eme comincia e finisce nel mitocondrio, il ciclo dell'urea attraversa matrice e citosol. Il passaggio di intermedi fra compartimenti richiede trasportatori o navette: l'acetil-CoA mitocondriale, per esempio, esce come citrato e viene rigenerato nel citosol dall'ATP-citrato liasi. Le tappe regolate sono di solito la prima tappa irreversibile specifica della via (committed step), come l'acetil-CoA carbossilasi per gli acidi grassi o l'HMG-CoA reduttasi per il colesterolo, bersaglio delle statine." }
    ],
    formule: [
      ["ΔG°′(tot) = ΣΔG°′ᵢ,  K′(tot) = Π K′ᵢ", "le energie libere standard di reazioni accoppiate da un intermedio comune si sommano, le costanti di equilibrio si moltiplicano"],
      ["ΔG°′ = −RT ln K′eq", "relazione fra energia libera standard biochimica (pH 7, kJ/mol) e costante di equilibrio; R = 8,314 J mol⁻¹ K⁻¹, T in kelvin"],
      ["8 acetil-CoA + 7 ATP + 14 NADPH + 14 H⁺ → palmitato + 8 CoA + 7 ADP + 7 Pᵢ + 14 NADP⁺ + 6 H₂O", "bilancio della sintesi del palmitato: 7 carbossilazioni ad opera dell'acetil-CoA carbossilasi e 7 cicli di allungamento con due riduzioni ciascuno"]
    ],
    ipotesi: [
      "La somma dei ΔG°′ descrive condizioni standard; il verso reale di ogni tappa dipende dal ΔG effettivo, quindi dalle concentrazioni cellulari dei reagenti e dei prodotti.",
      "I bilanci stechiometrici delle vie sono convenzioni didattiche: non includono il costo dei trasporti fra compartimenti, che dipende dal tessuto e dalla navetta usata."
    ],
    errori: [
      "Pensare che una via biosintetica sia la via degradativa percorsa al contrario: almeno una tappa è diversa e irreversibile, altrimenti non sarebbe regolabile.",
      "Confondere NADH e NADPH: hanno potenziale standard quasi identico, ma la cellula mantiene il primo prevalentemente ossidato (per le ossidazioni) e il secondo prevalentemente ridotto (per le biosintesi riduttive).",
      "Contare un solo ATP quando una reazione produce AMP e pirofosfato: si consumano due legami fosfoanidridici."
    ],
    esempio: {
      testo: "La fosforilazione diretta glucosio + Pᵢ → glucosio-6-fosfato + H₂O ha ΔG°′ = +13,8 kJ/mol. Accoppiandola all'idrolisi dell'ATP (ΔG°′ = −30,5 kJ/mol), come fa l'esochinasi, si ottiene glucosio + ATP → glucosio-6-fosfato + ADP con ΔG°′ = 13,8 − 30,5 = −16,7 kJ/mol. La costante di equilibrio a 298 K è K′ = exp(16 700/(8,314 · 298)) = exp(6,74) ≈ 8,4·10², contro K′ = exp(−13 800/(8,314 · 298)) ≈ 3,8·10⁻³ della reazione non accoppiata.",
      risultato: "ΔG°′ = −16,7 kJ/mol; K′ passa da circa 4·10⁻³ a circa 8·10², un fattore di circa 2·10⁵"
    },
    fonti: [
      "D. L. Nelson, M. M. Cox, Lehninger Principles of Biochemistry, 7ª ed., W. H. Freeman, 2017, capitoli «Bioenergetics and Biochemical Reaction Types» e «Lipid Biosynthesis»",
      "J. M. Berg, J. L. Tymoczko, G. J. Gatto, L. Stryer, Biochemistry, 9ª ed., W. H. Freeman, 2019, cap. «Metabolism: Basic Concepts and Design»",
      "C. T. Walsh, Enzymatic Reaction Mechanisms, W. H. Freeman, 1979 (meccanismi di PLP, biotina, condensazioni)"
    ],
    collegamenti: ['sglyc', 'sbeta', 'sppp', 'sgluco', 'surea', 'smm']
  };

  /* ───────────────────────── STRUTTURE 3D ───────────────────────── */
  T['sstruct'] = {
    titolo: "Geometria delle strutture biologiche: doppia elica, α-elica, foglietto β, membrana, ribosoma",
    sintesi: "Le grandi strutture biologiche ripetono pochi motivi geometrici regolari. La doppia elica B del DNA, l'α-elica e il foglietto β delle proteine sono definiti da parametri misurabili, come passo, salita per unità e angoli diedri, che derivano da legami a idrogeno ben precisi. Conoscere questi numeri permette di stimare dimensioni reali, per esempio quanti residui servono a un'elica per attraversare una membrana.",
    paragrafi: [
      { titolo: "La doppia elica B del DNA",
        testo: "Nel modello di Watson e Crick due filamenti antiparalleli si avvolgono in un'elica destrorsa con le basi all'interno e lo scheletro zucchero-fosfato all'esterno. Le basi si appaiano secondo Watson–Crick: adenina con timina tramite due legami a idrogeno, guanina con citosina tramite tre. Nella forma B ogni coppia di basi sale di circa 0,34 nm (3,4 Å) lungo l'asse; in soluzione un giro completo contiene circa 10,5 coppie, quindi il passo dell'elica è di circa 3,4–3,6 nm, una decina di volte la salita per coppia. Il diametro è di circa 2 nm. Poiché i legami glicosidici di una coppia non sono diametralmente opposti, la superficie presenta un solco maggiore e un solco minore, attraverso i quali le proteine leggono la sequenza senza aprire l'elica. La forma A, più compatta e con circa 11 coppie per giro, è tipica dei duplex di RNA; la forma Z è sinistrorsa." },
      { titolo: "L'RNA a singolo filamento",
        testo: "L'RNA cellulare è di solito un filamento singolo che si ripiega su se stesso: tratti complementari della stessa catena formano brevi doppie eliche di tipo A, separate da anse, rigonfiamenti (bulge) e giunzioni. Oltre alle coppie canoniche l'RNA usa spesso la coppia oscillante G·U. Questa capacità di ripiegarsi in strutture terziarie complesse spiega perché alcuni RNA sono catalizzatori, i ribozimi, e perché il centro peptidiltrasferasico del ribosoma è costituito da RNA ribosomiale e non da proteine." },
      { titolo: "α-elica e foglietto β",
        testo: "Pauling, Corey e Branson dedussero l'α-elica dalla planarità del legame peptidico, dovuta al suo parziale carattere di doppio legame. Nell'α-elica destrorsa il carbonile del residuo i forma un legame a idrogeno con l'N–H del residuo i + 4, quasi parallelo all'asse; ogni giro contiene 3,6 residui, ogni residuo avanza di 0,15 nm e il passo è quindi 0,54 nm. Gli angoli diedri tipici sono φ ≈ −57° e ψ ≈ −47°, e le catene laterali puntano verso l'esterno. Nel foglietto β la catena è quasi completamente distesa, circa 0,33–0,35 nm per residuo, e i legami a idrogeno si formano fra filamenti adiacenti, perpendicolari alla direzione delle catene; nei foglietti antiparalleli φ ≈ −139° e ψ ≈ +135°, in quelli paralleli φ ≈ −119° e ψ ≈ +113°. Il diagramma di Ramachandran mostra che queste combinazioni cadono nelle regioni prive di collisioni steriche." },
      { titolo: "Il doppio strato lipidico",
        testo: "I fosfolipidi in acqua si dispongono spontaneamente in un doppio strato con le code idrocarburiche affacciate all'interno e le teste polari verso il solvente; la forza motrice è l'effetto idrofobico, cioè il guadagno di entropia dell'acqua che non deve più ordinarsi intorno alle catene. Il nucleo idrofobico è spesso circa 3 nm, la membrana intera, teste comprese, 4–5 nm. Una proteina che attraversa la membrana con un'α-elica deve quindi esporre al nucleo idrofobico un tratto di una ventina di residui prevalentemente apolari: è il criterio su cui si basano i grafici di idropatia per riconoscere i segmenti transmembrana in una sequenza." },
      { titolo: "Il ribosoma e il coefficiente di sedimentazione",
        testo: "Il ribosoma batterico 70S è formato da una subunità piccola 30S, che contiene l'rRNA 16S e decodifica l'mRNA, e da una grande 50S, con gli rRNA 23S e 5S e il centro peptidiltrasferasico; quello citoplasmatico eucariotico è 80S (40S + 60S). La S è lo svedberg, unità del coefficiente di sedimentazione (10⁻¹³ s): poiché la sedimentazione dipende da massa e forma, i coefficienti non si sommano, e 30S + 50S dà 70S. I tre siti A, P ed E ospitano rispettivamente l'amminoacil-tRNA in arrivo, il peptidil-tRNA e il tRNA scarico in uscita. Le differenze fra ribosomi batterici ed eucariotici sono il bersaglio di molti antibiotici, come tetracicline, macrolidi e amminoglicosidi." }
    ],
    formule: [
      ["L(DNA-B) ≈ N · 0,34 nm,  giri ≈ N / 10,5", "lunghezza di un duplex di N coppie di basi e numero di giri dell'elica B in soluzione"],
      ["L(α-elica) ≈ n · 0,15 nm,  passo = 3,6 × 0,15 nm = 0,54 nm", "lunghezza di un'α-elica di n residui e passo dell'elica"],
      ["s = v / (ω² r)", "coefficiente di sedimentazione: velocità di sedimentazione v divisa per l'accelerazione centrifuga ω²r; si esprime in svedberg, 1 S = 10⁻¹³ s"]
    ],
    ipotesi: [
      "I parametri elicoidali sono valori medi: nei cristalli e nelle proteine reali l'elica B ha 10–10,5 coppie per giro a seconda della sequenza, e le α-eliche si curvano e si distorcono alle estremità.",
      "Lo spessore della membrana dipende dalla lunghezza delle catene aciliche e dal contenuto di colesterolo; 3 nm per il nucleo idrofobico è un ordine di grandezza."
    ],
    errori: [
      "Confondere la salita per coppia di basi (0,34 nm) con il passo dell'elica (circa 3,4–3,6 nm): differiscono di un fattore pari al numero di coppie per giro.",
      "Scrivere A≡T: la coppia adenina–timina ha due legami a idrogeno, solo G≡C ne ha tre.",
      "Sommare i coefficienti di sedimentazione delle subunità: 30S + 50S non fa 80S, perché s non è additivo."
    ],
    esempio: {
      testo: "Quanti residui deve avere un'α-elica per attraversare un nucleo idrofobico spesso 3,0 nm, e quanto è lungo un frammento di DNA-B di 1000 coppie di basi? Per l'elica: n = 3,0 nm / 0,15 nm per residuo = 20 residui, cioè 20/3,6 ≈ 5,6 giri. Per il DNA: L = 1000 × 0,34 nm = 340 nm, con 1000/10,5 ≈ 95 giri.",
      risultato: "circa 20 residui (5,6 giri) per l'elica transmembrana; 340 nm e circa 95 giri per 1000 bp di DNA-B"
    },
    fonti: [
      "J. D. Watson, F. H. C. Crick, Molecular structure of nucleic acids, Nature 171 (1953) 737–738",
      "L. Pauling, R. B. Corey, H. R. Branson, The structure of proteins: two hydrogen-bonded helical configurations of the polypeptide chain, PNAS 37 (1951) 205–211",
      "C. Branden, J. Tooze, Introduction to Protein Structure, 2ª ed., Garland, 1999, capitoli 1–2",
      "D. L. Nelson, M. M. Cox, Lehninger Principles of Biochemistry, 7ª ed., W. H. Freeman, 2017, capitoli «The Three-Dimensional Structure of Proteins» e «Nucleotides and Nucleic Acids»"
    ],
    collegamenti: ['s3dpro', 'smacro3d', 'sbio', 'saa']
  };

  /* ───────────────────────── VIEWER 3D PRO ───────────────────────── */
  T['s3dpro'] = {
    titolo: "Da dove vengono le strutture 3D: coordinate, risoluzione, rappresentazioni e sovrapposizione",
    sintesi: "Un visualizzatore molecolare disegna coordinate atomiche, e il valore di ciò che si vede dipende da come quelle coordinate sono state ottenute. Le piccole molecole cercate per nome provengono da conformeri calcolati, le proteine del Protein Data Bank da cristallografia a raggi X, NMR o criomicroscopia elettronica. Per leggere bene un'immagine servono tre nozioni: risoluzione e fattori B, significato delle rappresentazioni, misura della somiglianza fra strutture tramite l'RMSD.",
    paragrafi: [
      { titolo: "Coordinate sperimentali e coordinate calcolate",
        testo: "Nella modalità «molecola singola» la sezione chiede a PubChem un modello tridimensionale: per la maggior parte dei composti si tratta di un conformero generato al calcolatore e ottimizzato con un campo di forze, non di una struttura misurata. È un buon modello di geometria locale, cioè lunghezze e angoli di legame, ma la conformazione mostrata è una fra le tante accessibili a temperatura ambiente. Le strutture proteiche del Protein Data Bank, caricate per codice di quattro caratteri, sono invece modelli costruiti per interpretare dati sperimentali, e il file PDB riporta il metodo, la risoluzione e la qualità dell'affinamento." },
      { titolo: "Risoluzione e fattori di temperatura",
        testo: "In cristallografia l'informazione arriva dalla diffrazione dei raggi X sui piani reticolari, secondo la legge di Bragg. La risoluzione, espressa in ångström, è la più piccola distanza interplanare d per cui si misurano riflessi utili: sotto circa 1,5 Å si distinguono i singoli atomi e spesso anche gli idrogeni, intorno a 2–2,5 Å si vedono bene catene laterali e acque ordinate, oltre 3,5 Å si riconosce soprattutto l'andamento della catena. Ogni atomo porta un fattore B che misura la dispersione della sua posizione, per vibrazione termica o per disordine statico; regioni con B alto, come anse superficiali ed estremità, vanno interpretate con prudenza. Le strutture NMR sono depositate come insiemi di modelli e quelle da criomicroscopia hanno risoluzioni locali variabili." },
      { titolo: "Che cosa mostrano le rappresentazioni",
        testo: "Le rappresentazioni non sono equivalenti. Il «cartoon» non mostra atomi: disegna nastri e frecce a partire dalla struttura secondaria assegnata dai legami a idrogeno dello scheletro, ed è adatto a riconoscere il ripiegamento. I bastoncini (stick) mostrano la connettività e servono per siti attivi e ligandi. Le sfere usano raggi di van der Waals e rendono l'ingombro reale. La superficie di van der Waals è l'inviluppo di queste sfere; la superficie accessibile al solvente, che altri programmi calcolano facendo rotolare una sonda di raggio 1,4 Å, descrive invece ciò che una molecola d'acqua può toccare. Il colore «spectrum» della sezione va dal terminale N al terminale C e aiuta a seguire la catena." },
      { titolo: "Confrontare due strutture: RMSD e sovrapposizione ottimale",
        testo: "Per dire quanto due strutture si somigliano si sceglie un insieme di atomi corrispondenti, di solito i carboni α, e si calcola la radice dello scarto quadratico medio (RMSD) delle loro posizioni dopo averle sovrapposte nel modo migliore. La sovrapposizione ottimale si ottiene portando a coincidere i baricentri e poi cercando la rotazione che minimizza l'RMSD; l'algoritmo di Kabsch la trova in forma chiusa. La modalità «allineamento» della sezione mostra le due proteine con colori diversi nello stesso riferimento, centrate insieme: è un confronto visivo, utile per due stati della stessa proteina come emoglobina ossi e deossi, ma non una sovrapposizione ottimizzata con calcolo dell'RMSD. Come ordine di grandezza, due strutture cristallografiche indipendenti della stessa proteina differiscono di pochi decimi di ångström sui Cα, e omologhi lontani di 2–3 Å." }
    ],
    formule: [
      ["n λ = 2 d sin θ", "legge di Bragg: λ lunghezza d'onda dei raggi X, d distanza fra piani reticolari, θ angolo di incidenza, n ordine di diffrazione"],
      ["RMSD = √[(1/N) Σᵢ |rᵢ − r′ᵢ|²]", "radice dello scarto quadratico medio fra N coppie di atomi corrispondenti, in Å, calcolata dopo la sovrapposizione"],
      ["B = 8π² ⟨u²⟩", "fattore di temperatura isotropo in Å²: ⟨u²⟩ è lo spostamento quadratico medio dell'atomo lungo una direzione"]
    ],
    ipotesi: [
      "L'RMSD dipende dalla scelta e dal numero degli atomi confrontati e da come è stata fatta la sovrapposizione; due valori sono confrontabili solo se calcolati nello stesso modo.",
      "Una struttura cristallografica è una media nel tempo e sulle molecole del cristallo, ottenuta in un ambiente diverso dalla soluzione; i contatti fra molecole nel cristallo possono deformare le regioni superficiali.",
      "I conformeri calcolati per le piccole molecole non rappresentano necessariamente la conformazione legata a una proteina."
    ],
    errori: [
      "Considerare un conformero 3D di PubChem una struttura sperimentale.",
      "Leggere la risoluzione come «più alta è meglio»: un numero in ångström più piccolo indica una struttura più dettagliata.",
      "Confrontare due proteine solo centrandole: senza rotazione ottimale e senza un criterio numerico, una buona somiglianza può sembrare cattiva e viceversa."
    ],
    esempio: {
      testo: "Dopo la sovrapposizione, tre Cα corrispondenti di due modelli distano 0,5 Å, 1,0 Å e 1,5 Å. RMSD = √[(0,25 + 1,00 + 2,25)/3] = √1,167 = 1,08 Å. Un atomo di un'ansa superficiale ha B = 30 Å²: ⟨u²⟩ = 30/(8π²) = 0,380 Å², quindi lo spostamento quadratico medio lungo una direzione è √0,380 = 0,62 Å.",
      risultato: "RMSD ≈ 1,08 Å; per B = 30 Å² lo spostamento rms è circa 0,62 Å"
    },
    fonti: [
      "H. M. Berman et al., The Protein Data Bank, Nucleic Acids Research 28 (2000) 235–242",
      "W. Kabsch, A solution for the best rotation to relate two sets of vectors, Acta Crystallographica A32 (1976) 922–923",
      "B. Rupp, Biomolecular Crystallography: Principles, Practice, and Application to Structural Biology, Garland Science, 2009",
      "E. E. Bolton et al., PubChem3D: a new resource for scientists, Journal of Cheminformatics 3 (2011) 32"
    ],
    collegamenti: ['smacro3d', 'sstruct', 'scristalli', 'smol']
  };

  /* ───────────────────────── METABOLISMO (VIE ANIMATE) ───────────────────────── */
  T['sglyc'] = {
    titolo: "Termodinamica e regolazione delle vie metaboliche",
    sintesi: "Una via metabolica è una sequenza di reazioni enzimatiche in cui alcune tappe operano vicino all'equilibrio e poche altre ne sono lontanissime. Le seconde rendono la via unidirezionale e sono i punti in cui la cellula la regola. Per capire i valori di ΔG mostrati tappa per tappa occorre distinguere il ΔG°′ standard dal ΔG reale nelle concentrazioni cellulari, e per capire i bilanci energetici occorre una convenzione esplicita sui rapporti P/O.",
    paragrafi: [
      { titolo: "ΔG°′ e ΔG: due grandezze diverse",
        testo: "Il ΔG°′ è l'energia libera standard trasformata: tutti i reagenti a 1 M (tranne l'acqua), pH 7 e di solito 25 °C. È una proprietà della reazione, legata alla costante di equilibrio da ΔG°′ = −RT ln K′eq, e non dice da solo in che verso la reazione procede in cellula. Il verso è dato dal ΔG reale, che contiene il termine RT ln Q con le concentrazioni effettive. I valori numerici associati alle tappe nella sezione sono per la maggior parte ΔG°′ di letteratura: l'aldolasi, per esempio, ha un ΔG°′ di +23,8 kJ/mol eppure in cellula lavora nel verso della glicolisi, perché i prodotti vengono consumati e le loro concentrazioni restano basse. Valori diversi fra manuali, di uno o due kJ/mol, riflettono condizioni sperimentali diverse." },
      { titolo: "Tappe vicine all'equilibrio e tappe regolate",
        testo: "Misurando le concentrazioni dei metaboliti si scopre che la maggior parte delle tappe glicolitiche ha ΔG vicino a zero: sono reversibili e il flusso netto è deciso da ciò che accade a monte e a valle. Le tappe catalizzate da esochinasi, fosfofruttochinasi-1 e piruvato chinasi hanno invece ΔG fortemente negativo anche in cellula; non possono essere percorse al contrario e sono il luogo naturale della regolazione allosterica e ormonale. Lo stesso schema vale per le altre vie mostrate: citrato sintasi, isocitrato deidrogenasi e α-chetoglutarato deidrogenasi nel ciclo di Krebs, glucosio-6-fosfato deidrogenasi nella via dei pentosi, carbamil-fosfato sintetasi I nel ciclo dell'urea, acetil-CoA carbossilasi nella sintesi degli acidi grassi." },
      { titolo: "Regolazione reciproca",
        testo: "Glicolisi e gluconeogenesi, sintesi e demolizione del glicogeno, sintesi e β-ossidazione degli acidi grassi sono coppie di vie opposte che condividono intermedi. Se funzionassero insieme a piena velocità formerebbero cicli futili che dissipano ATP. Gli stessi segnali le regolano quindi in modo opposto: il fruttosio-2,6-bisfosfato attiva la PFK-1 e inibisce la fruttosio-1,6-bisfosfatasi; la fosforilazione da parte della proteina chinasi A, innescata da glucagone o adrenalina, attiva la glicogeno fosforilasi e inattiva la glicogeno sintasi; il malonil-CoA inibisce l'ingresso degli acidi grassi nel mitocondrio mentre la loro sintesi è in corso." },
      { titolo: "Il bilancio energetico dell'ossidazione del glucosio",
        testo: "La resa in ATP dell'ossidazione completa del glucosio dipende dai rapporti P/O, cioè dagli ATP sintetizzati per coppia di elettroni che arriva all'ossigeno. Le misure moderne danno circa 2,5 per il NADH e 1,5 per il succinato o il FADH₂ legato agli enzimi. Con questa convenzione la glicolisi fornisce 2 ATP e 2 NADH citosolici, la piruvato deidrogenasi 2 NADH, il ciclo di Krebs 6 NADH, 2 FADH₂ e 2 GTP: in totale 10 NADH e 2 FADH₂. Se i NADH citosolici entrano nel mitocondrio con la navetta malato-aspartato rendono 2,5 ATP ciascuno e il totale è 32; con la navetta del glicerolo-3-fosfato ne rendono 1,5 e il totale è 30. Testi più vecchi riportano 36–38 ATP perché usavano rapporti P/O interi di 3 e 2, oggi superati." },
      { titolo: "Compartimenti e scopi diversi",
        testo: "Le vie della sezione hanno funzioni distinte e luoghi distinti. La glicolisi, citosolica, ricava ATP in assenza di ossigeno e fornisce piruvato; il ciclo di Krebs e la fosforilazione ossidativa, mitocondriali, completano l'ossidazione; la β-ossidazione, nella matrice, demolisce gli acidi grassi; la via dei pentosi fosfati produce NADPH e ribosio-5-fosfato senza produrre ATP; gluconeogenesi e ciclo dell'urea, nel fegato, spendono energia per esportare glucosio e smaltire azoto. Gli intermedi condivisi, come acetil-CoA, ossalacetato e glucosio-6-fosfato, sono i nodi in cui le vie si incrociano." }
    ],
    formule: [
      ["ΔG = ΔG°′ + RT ln Q", "energia libera reale di una tappa: Q quoziente di reazione con le concentrazioni effettive (in M), R = 8,314 J mol⁻¹ K⁻¹, T in K"],
      ["ΔG°′ = −RT ln K′eq", "legame fra energia libera standard biochimica e costante di equilibrio a pH 7"],
      ["ATP/glucosio = 2 + 2 + 8 × 2,5 + 2 × 1,5 + 2 × (2,5 oppure 1,5) = 32 oppure 30", "nell'ordine: ATP netti della glicolisi, GTP del ciclo di Krebs, 8 NADH mitocondriali, 2 FADH₂, 2 NADH citosolici trasferiti con la navetta malato-aspartato (2,5) o del glicerolo-3-fosfato (1,5)"]
    ],
    ipotesi: [
      "I rapporti P/O non sono costanti stechiometriche ma valori sperimentali medi: dipendono dal numero di subunità c dell'ATP sintasi, dal costo del trasporto di ADP e Pᵢ e dalle perdite di protoni attraverso la membrana.",
      "Le concentrazioni dei metaboliti, e quindi i ΔG reali, cambiano con il tessuto e lo stato fisiologico; i calcoli usano valori tipici."
    ],
    errori: [
      "Dedurre che una tappa con ΔG°′ positivo non avviene in cellula: conta il ΔG reale, che può essere negativo se i prodotti sono mantenuti a bassa concentrazione.",
      "Citare «38 ATP per glucosio» come dato attuale: è il risultato di rapporti P/O interi non confermati dalle misure.",
      "Pensare che la via dei pentosi fosfati produca ATP: il suo scopo è il NADPH e il ribosio-5-fosfato."
    ],
    esempio: {
      testo: "Nell'eritrocita le concentrazioni tipiche sono fruttosio-1,6-bisfosfato 31 μM, diidrossiacetone fosfato 138 μM, gliceraldeide-3-fosfato 18,5 μM. Per l'aldolasi (ΔG°′ = +23,8 kJ/mol) a 37 °C: Q = (138·10⁻⁶ × 18,5·10⁻⁶)/(31·10⁻⁶) = 8,2·10⁻⁵; RT ln Q = 8,314 × 310 × ln(8,2·10⁻⁵) = −24,2 kJ/mol; ΔG = 23,8 − 24,2 ≈ −0,4 kJ/mol.",
      risultato: "ΔG ≈ −0,4 kJ/mol: la tappa è praticamente all'equilibrio nonostante il ΔG°′ di +23,8 kJ/mol"
    },
    fonti: [
      "D. L. Nelson, M. M. Cox, Lehninger Principles of Biochemistry, 7ª ed., W. H. Freeman, 2017, capitoli «Bioenergetics and Biochemical Reaction Types» e «Principles of Metabolic Regulation»",
      "J. M. Berg, J. L. Tymoczko, G. J. Gatto, L. Stryer, Biochemistry, 9ª ed., W. H. Freeman, 2019, cap. «Glycolysis and Gluconeogenesis»",
      "P. C. Hinkle, P/O ratios of mitochondrial oxidative phosphorylation, Biochimica et Biophysica Acta 1706 (2005) 1–11"
    ],
    collegamenti: ['sglic', 'skrebs', 'setc', 'sbeta', 'sppp', 'sgluco', 'surea']
  };

  /* ───────────────────────── MACROMOLECOLE 3D ───────────────────────── */
  T['smacro3d'] = {
    titolo: "Enzimi e grandi complessi: classificazione EC e architettura delle macromolecole",
    sintesi: "La libreria della sezione ordina gli enzimi secondo la classificazione EC, che li raggruppa per tipo di reazione catalizzata e non per struttura. Guardare insieme la reazione e la forma tridimensionale insegna come un enzima lega il substrato, dove porta cofattori e ioni metallici, perché molte proteine sono oligomeri e perché il ribosoma, la macchina che produce tutte le proteine, è catalizzato da RNA.",
    paragrafi: [
      { titolo: "Il numero EC",
        testo: "La commissione per la nomenclatura della IUBMB assegna a ogni attività enzimatica un numero EC di quattro cifre: la prima indica la classe, le successive sottoclasse, sotto-sottoclasse e numero d'ordine. Le classi sono sette: ossidoreduttasi (1), che trasferiscono elettroni; transferasi (2), che trasferiscono gruppi; idrolasi (3), che scindono legami con l'acqua; liasi (4), che rompono legami senza idrolisi né ossidazione, spesso formando doppi legami o aggiungendovi gruppi; isomerasi (5); ligasi (6), che formano legami accoppiandosi all'idrolisi di un nucleoside trifosfato; traslocasi (7), introdotte nel 2018 per gli enzimi che spostano ioni o molecole attraverso le membrane, come l'ATP sintasi. La classificazione riguarda la reazione: il nome comune può ingannare, e per esempio l'anidrasi carbonica, che idrata la CO₂ a bicarbonato, è una liasi (EC 4.2.1.1)." },
      { titolo: "Siti attivi, cofattori e gruppi eteroatomici",
        testo: "Il sito attivo è una piccola regione, spesso una tasca o una fessura, in cui catene laterali provenienti da punti lontani della sequenza si trovano vicine nello spazio. Molti enzimi hanno bisogno di un cofattore: ioni metallici come lo zinco dell'anidrasi carbonica o il rame e il ferro della citocromo c ossidasi, oppure coenzimi organici come NAD⁺, FAD, eme o piridossal fosfato. Nei file PDB questi gruppi compaiono come record HETATM, distinti dagli ATOM della catena polipeptidica; la sezione li evidenzia automaticamente in bastoncini e sfere, ed è un ottimo modo per trovare il sito attivo in una struttura mai vista prima." },
      { titolo: "Struttura quaternaria",
        testo: "Molte proteine sono formate da più catene associate. L'emoglobina è un tetramero α₂β₂, e il confronto fra le strutture ossi e deossi mostra la rotazione relativa di una coppia αβ rispetto all'altra che sta alla base della cooperatività nel legame dell'ossigeno; la mioglobina, monomerica e molto simile a una singola subunità, non è cooperativa. La glicogeno fosforilasi è un dimero regolato da fosforilazione e da effettori allosterici, l'ATP sintasi un motore rotatorio fatto di molte subunità, il proteasoma un cilindro di anelli sovrapposti che racchiude i siti proteolitici al suo interno. L'oligomerizzazione permette regolazione allosterica, assemblaggio di siti attivi all'interfaccia e risparmio di informazione genetica." },
      { titolo: "Il ribosoma è un ribozima",
        testo: "Le strutture cristallografiche delle subunità ribosomiali, pubblicate intorno al 2000 e premiate con il Nobel per la chimica del 2009, hanno mostrato che nel centro peptidiltrasferasico della subunità grande non c'è alcuna catena proteica entro una distanza utile per la catalisi: il legame peptidico è formato dall'RNA ribosomiale 23S. Le proteine ribosomiali stanno soprattutto in superficie e stabilizzano il ripiegamento dell'RNA. Il confronto fra le subunità 30S e 50S, il ribosoma 70S completo e il ribosoma umano 80S mostra quanto il nucleo catalitico sia conservato nell'evoluzione." },
      { titolo: "Dimensioni e masse",
        testo: "Un ordine di grandezza utile è la massa media di un residuo amminoacidico in una proteina, circa 110 Da. Un enzima di 300 residui pesa quindi circa 33 kDa e contiene alcune migliaia di atomi; il numero che la sezione mostra dopo il caricamento conta le righe ATOM e HETATM del file, quindi include ligandi e acque ma di solito non gli idrogeni, che in cristallografia raramente si vedono. I ribosomi sono di un altro ordine: circa 2,5 MDa il 70S batterico, oltre 4 MDa l'80S umano, con l'RNA che rappresenta circa due terzi della massa del ribosoma batterico." }
    ],
    formule: [
      ["EC a.b.c.d", "numero di classificazione IUBMB: a classe (1–7), b sottoclasse, c sotto-sottoclasse, d numero seriale dell'attività"],
      ["M(proteina) ≈ n · 110 Da", "stima della massa molecolare dal numero n di residui; 1 Da = 1 g/mol"],
      ["kcat/Km ≲ 10⁸–10⁹ M⁻¹ s⁻¹", "limite della diffusione: l'efficienza catalitica non può superare la velocità con cui substrato ed enzima si incontrano in soluzione"]
    ],
    ipotesi: [
      "La massa media per residuo dipende dalla composizione; la stima a 110 Da sbaglia di qualche punto percentuale per proteine ricche di residui piccoli o grandi.",
      "Le strutture cristallografiche mostrano uno stato o una media di stati; enzimi con domini mobili, come l'adenilato chinasi o l'esochinasi, possono apparire aperti o chiusi a seconda dei ligandi presenti nel cristallo."
    ],
    errori: [
      "Classificare un enzima dal nome invece che dalla reazione: la glicogeno fosforilasi è una transferasi (trasferisce un glucosile al fosfato) e l'anidrasi carbonica una liasi.",
      "Pensare che il sito attivo sia formato da residui consecutivi nella sequenza: di solito i residui catalitici sono lontani nella sequenza e vicini nello spazio.",
      "Interpretare il conteggio degli atomi di un file PDB come numero di atomi della proteina: mancano quasi sempre gli idrogeni e ci sono acque e ligandi."
    ],
    esempio: {
      testo: "L'emoglobina umana adulta è formata da due catene α di 141 residui e due catene β di 146. Si stimi la massa del tetramero: n = 2 × 141 + 2 × 146 = 574 residui, M ≈ 574 × 110 Da ≈ 63 kDa. La massa reale delle quattro catene è di circa 62,0 kDa, che diventano circa 64,5 kDa con i quattro gruppi eme: la stima è corretta entro il 2 %.",
      risultato: "circa 63 kDa stimati, contro circa 62 kDa reali per le sole catene polipeptidiche (scarto inferiore al 2 %)"
    },
    fonti: [
      "IUBMB, Enzyme Nomenclature: Recommendations of the Nomenclature Committee of the International Union of Biochemistry and Molecular Biology, Academic Press, 1992, e aggiornamenti in linea (ExplorEnz)",
      "D. L. Nelson, M. M. Cox, Lehninger Principles of Biochemistry, 7ª ed., W. H. Freeman, 2017, capitoli «Protein Function» ed «Enzymes»",
      "N. Ban, P. Nissen, J. Hansen, P. B. Moore, T. A. Steitz, The complete atomic structure of the large ribosomal subunit at 2.4 Å resolution, Science 289 (2000) 905–920",
      "C. Branden, J. Tooze, Introduction to Protein Structure, 2ª ed., Garland, 1999"
    ],
    collegamenti: ['s3dpro', 'sstruct', 'smm', 'saa']
  };

  /* ───────────────────────── GLICOLISI ANIMATA ───────────────────────── */
  T['sglic'] = {
    titolo: "La glicolisi: dieci tappe dal glucosio al piruvato",
    sintesi: "La glicolisi scinde una molecola di glucosio in due di piruvato attraverso dieci reazioni citosoliche. Nella fase preparatoria si investono due ATP per ottenere due triosi fosfato; nella fase di recupero ogni trioso viene ossidato e produce due ATP per fosforilazione a livello del substrato e un NADH. Il bilancio netto è di 2 ATP e 2 NADH per glucosio, e il NADH deve essere riossidato perché la via possa continuare.",
    paragrafi: [
      { titolo: "La fase preparatoria (tappe 1–5)",
        testo: "L'esochinasi trasferisce il fosfato γ dell'ATP all'ossidrile in C6 del glucosio: il glucosio-6-fosfato, carico, non attraversa più i trasportatori ed è intrappolato nella cellula. La fosfoglucosio isomerasi converte l'aldoso nel chetoso fruttosio-6-fosfato, spostando il carbonile in C2 in modo che la scissione successiva produca due frammenti a tre atomi. La fosfofruttochinasi-1 spende il secondo ATP e forma il fruttosio-1,6-bisfosfato: è la prima tappa specifica della glicolisi e il suo principale punto di controllo. L'aldolasi esegue una retro-aldolica che rompe il legame C3–C4 dando diidrossiacetone fosfato e gliceraldeide-3-fosfato; la triosofosfato isomerasi interconverte i due triosi, così entrambe le metà del glucosio proseguono come gliceraldeide-3-fosfato. Da qui in avanti ogni tappa avviene due volte per glucosio." },
      { titolo: "La fase di recupero (tappe 6–10)",
        testo: "La gliceraldeide-3-fosfato deidrogenasi è l'unica ossidazione della via. Una cisteina del sito attivo forma un tioemiacetale con l'aldeide, lo ione idruro passa al NAD⁺ e il tioestere che ne risulta viene attaccato dal fosfato inorganico, producendo l'anidride mista 1,3-bisfosfoglicerato: l'energia dell'ossidazione è conservata in un legame ad alto potenziale di trasferimento. La fosfoglicerato chinasi trasferisce questo fosfato all'ADP, e la fosfoglicerato mutasi sposta il fosfato da C3 a C2. L'enolasi disidrata il 2-fosfoglicerato a fosfoenolpiruvato; il PEP ha un potenziale di trasferimento del fosfato molto alto (ΔG°′ di idrolisi circa −61,9 kJ/mol) perché il prodotto, l'enolo del piruvato, tautomerizza alla forma chetonica. La piruvato chinasi produce così il secondo ATP per trioso." },
      { titolo: "Regolazione",
        testo: "Le tappe 1, 3 e 10 sono irreversibili in cellula e regolate. L'esochinasi è inibita dal suo prodotto, il glucosio-6-fosfato; nel fegato lavora la glucochinasi, con affinità molto più bassa per il glucosio e insensibile a questa inibizione, adatta a un organo che deve rispondere alla glicemia. La PFK-1 è inibita da ATP e citrato, segnali di abbondanza energetica, e attivata da AMP e soprattutto dal fruttosio-2,6-bisfosfato, la cui concentrazione è controllata da insulina e glucagone. La piruvato chinasi è attivata in avanti dal fruttosio-1,6-bisfosfato, inibita da ATP e alanina e, nell'isoforma epatica, inattivata per fosforilazione." },
      { titolo: "Il destino del NADH e del piruvato",
        testo: "Le cellule contengono pochissimo NAD⁺ rispetto al flusso di glucosio, quindi il NADH prodotto dalla tappa 6 deve essere riossidato. In presenza di ossigeno gli elettroni entrano nel mitocondrio tramite le navette e arrivano alla catena respiratoria, mentre il piruvato diventa acetil-CoA. In assenza di ossigeno, o in cellule senza mitocondri come gli eritrociti, la lattato deidrogenasi riduce il piruvato a lattato e rigenera il NAD⁺; il lievito decarbossila il piruvato ad acetaldeide e la riduce a etanolo. Il lattato non è un prodotto di scarto: il fegato lo riconverte in glucosio nel ciclo di Cori." }
    ],
    formule: [
      ["Glucosio + 2 NAD⁺ + 2 ADP + 2 Pᵢ → 2 piruvato + 2 NADH + 2 H⁺ + 2 ATP + 2 H₂O", "equazione complessiva della glicolisi"],
      ["ΔG°′ = −146 kJ/mol (ossidazione) + 2 × 30,5 kJ/mol (sintesi di 2 ATP) ≈ −85 kJ/mol", "bilancio termodinamico standard: l'ossidazione del glucosio a piruvato libera più energia di quanta ne venga conservata in ATP"],
      ["Glucosio → 2 lattato,  ΔG°′ ≈ −196 kJ/mol", "fermentazione lattica: energia libera standard della conversione completa, usata per stimare l'efficienza di conservazione"]
    ],
    ipotesi: [
      "I ΔG°′ citati sono quelli dei manuali di riferimento a 25 °C e pH 7; in cellula ΔG differisce, e il rendimento reale di conservazione dell'energia è più alto di quello calcolato in condizioni standard.",
      "Il conteggio di 2 ATP netti vale partendo dal glucosio libero; partendo dal glucosio-1-fosfato del glicogeno se ne ottengono 3, perché la fosforolisi non spende ATP."
    ],
    errori: [
      "Contare 4 ATP come resa della glicolisi: quelli prodotti sono 4, ma 2 vengono investiti nelle tappe 1 e 3.",
      "Dimenticare il fattore 2 dopo l'aldolasi: le tappe 6–10 avvengono due volte per ogni glucosio.",
      "Ritenere che la glicolisi richieda ossigeno: non lo usa in nessuna tappa; l'ossigeno serve solo a riossidare il NADH per via mitocondriale."
    ],
    esempio: {
      testo: "Si stimi l'efficienza della fermentazione lattica in condizioni standard. La conversione glucosio → 2 lattato libera ΔG°′ = −196 kJ/mol; nello stesso tempo si sintetizzano 2 ATP, che richiedono 2 × 30,5 = 61,0 kJ/mol. Efficienza = 61,0/196 = 0,311.",
      risultato: "circa 31 % dell'energia libera standard viene conservata come ATP"
    },
    fonti: [
      "D. L. Nelson, M. M. Cox, Lehninger Principles of Biochemistry, 7ª ed., W. H. Freeman, 2017, cap. «Glycolysis, Gluconeogenesis, and the Pentose Phosphate Pathway»",
      "J. M. Berg, J. L. Tymoczko, G. J. Gatto, L. Stryer, Biochemistry, 9ª ed., W. H. Freeman, 2019, cap. «Glycolysis and Gluconeogenesis»",
      "D. Voet, J. G. Voet, Biochemistry, 4ª ed., Wiley, 2011, cap. «Glycolysis»"
    ],
    collegamenti: ['sglyc', 'sgluco', 'skrebs', 'setc', 'sppp']
  };

  /* ───────────────────────── CICLO DI KREBS ───────────────────────── */
  T['skrebs'] = {
    titolo: "Il ciclo dell'acido citrico: ossidazione dell'acetil-CoA e nodo del metabolismo",
    sintesi: "Nella matrice mitocondriale il gruppo acetilico dell'acetil-CoA si condensa con l'ossalacetato e, in otto tappe, viene ossidato a due molecole di CO₂. Ogni giro produce 3 NADH, 1 FADH₂ legato all'enzima e 1 GTP (o ATP) e rigenera l'ossalacetato. Il ciclo è catalitico, perché i suoi intermedi non si consumano, e anfibolico, perché fornisce precursori alle biosintesi e riceve molecole da molte vie.",
    paragrafi: [
      { titolo: "Le otto tappe",
        testo: "La citrato sintasi condensa acetil-CoA e ossalacetato formando citrato; l'idrolisi del tioestere citril-CoA rende la tappa fortemente esoergonica. L'aconitasi, un enzima con un centro ferro-zolfo, isomerizza il citrato a isocitrato passando per il cis-aconitato, spostando l'ossidrile su un carbonio secondario che può essere ossidato. L'isocitrato deidrogenasi esegue la prima decarbossilazione ossidativa, producendo α-chetoglutarato, CO₂ e NADH. Il complesso dell'α-chetoglutarato deidrogenasi, analogo alla piruvato deidrogenasi e con gli stessi cofattori (tiamina pirofosfato, lipoammide, CoA, FAD, NAD⁺), produce succinil-CoA, CO₂ e il secondo NADH. La succinil-CoA sintetasi usa l'energia del tioestere per fosforilare GDP o ADP, a seconda dell'isoforma. La succinato deidrogenasi ossida il succinato a fumarato riducendo il FAD legato covalentemente: è l'unico enzima del ciclo immerso nella membrana interna, ed è il complesso II della catena respiratoria. La fumarasi idrata il fumarato a L-malato e la malato deidrogenasi ossida il malato a ossalacetato, producendo il terzo NADH." },
      { titolo: "Da dove vengono i due CO₂",
        testo: "Un dettaglio istruttivo è che i due carboni persi come CO₂ in un giro non sono quelli dell'acetile appena entrato, ma provengono dalla parte del citrato derivata dall'ossalacetato. L'aconitasi infatti distingue le due estremità del citrato, che pure è una molecola senza stereocentri, perché le riconosce come gruppi prochirali in un sito attivo asimmetrico. Gli atomi dell'acetile marcato vengono quindi persi solo nei giri successivi. Questo ragionamento, proposto da Ogston nel 1948, ha chiarito una contraddizione apparente degli esperimenti con isotopi." },
      { titolo: "Termodinamica e regolazione",
        testo: "Tre tappe hanno ΔG fortemente negativo in cellula, citrato sintasi, isocitrato deidrogenasi e α-chetoglutarato deidrogenasi, e sono quelle regolate. La velocità del ciclo segue lo stato energetico: NADH e ATP inibiscono, ADP e Ca²⁺ attivano l'isocitrato deidrogenasi, il succinil-CoA inibisce la propria sintesi. La malato deidrogenasi ha un ΔG°′ di circa +29,7 kJ/mol: la reazione procede perché l'ossalacetato è mantenuto a concentrazione molto bassa dalla citrato sintasi, che lo consuma subito, e perché il rapporto NAD⁺/NADH mitocondriale è alto. È un esempio di come una tappa sfavorevole in condizioni standard venga trascinata dalla tappa successiva." },
      { titolo: "Un ciclo anfibolico",
        testo: "Gli intermedi del ciclo sono anche materiali da costruzione: il citrato esportato porta acetil-CoA nel citosol per la sintesi dei lipidi, l'α-chetoglutarato e l'ossalacetato danno glutammato e aspartato per transaminazione, il succinil-CoA è il precursore dell'eme, l'ossalacetato la porta d'ingresso della gluconeogenesi. Ogni prelievo deve essere compensato da reazioni anaplerotiche, la più importante delle quali nel fegato e nel rene è la piruvato carbossilasi, attivata dall'acetil-CoA. Senza anaplerosi la concentrazione di ossalacetato cadrebbe e l'acetil-CoA non potrebbe più entrare nel ciclo." },
      { titolo: "Il bilancio in ATP",
        testo: "Un giro produce 3 NADH, 1 FADH₂ e 1 GTP. Con i rapporti P/O moderni, 2,5 per il NADH e 1,5 per gli elettroni che entrano a livello del complesso II, un acetil-CoA rende 3 × 2,5 + 1,5 + 1 = 10 ATP. Poiché ogni glucosio genera due acetil-CoA, il ciclo contribuisce con 20 ATP sui 30–32 dell'ossidazione completa del glucosio. Il ciclo non usa direttamente ossigeno, ma si ferma senza di esso, perché il NAD⁺ e il FAD si rigenerano solo attraverso la catena respiratoria." }
    ],
    formule: [
      ["Acetil-CoA + 3 NAD⁺ + FAD + GDP + Pᵢ + 2 H₂O → 2 CO₂ + CoA + 3 NADH + FADH₂ + GTP + 2 H⁺", "equazione netta di un giro del ciclo"],
      ["ATP per acetil-CoA = 3 × 2,5 + 1 × 1,5 + 1 = 10", "resa con P/O = 2,5 (NADH) e 1,5 (FADH₂) più il GTP della fosforilazione a livello del substrato"],
      ["[OAA]/[malato] ≤ K′eq · [NAD⁺]/[NADH]", "condizione perché la malato deidrogenasi abbia ΔG ≤ 0; K′eq = exp(−ΔG°′/RT) ≈ 6·10⁻⁶ a 25 °C"]
    ],
    ipotesi: [
      "Il valore di 10 ATP per acetil-CoA dipende dai rapporti P/O assunti, che sono valori medi sperimentali e non numeri interi.",
      "Il rapporto NAD⁺/NADH della matrice varia con lo stato metabolico; i calcoli sul verso della malato deidrogenasi usano un valore indicativo."
    ],
    errori: [
      "Credere che i due CO₂ di un giro siano gli atomi dell'acetile appena entrato.",
      "Pensare che il ciclo possa produrre una sintesi netta di glucosio dall'acetil-CoA: i due carboni entrati escono come CO₂, quindi non c'è guadagno netto di ossalacetato.",
      "Contare il FADH₂ come una molecola libera: resta legato covalentemente alla succinato deidrogenasi e cede gli elettroni direttamente all'ubichinone."
    ],
    esempio: {
      testo: "La malato deidrogenasi ha ΔG°′ = +29,7 kJ/mol. A 25 °C K′eq = exp(−29 700/(8,314 × 298)) = exp(−11,99) = 6,3·10⁻⁶. Se nella matrice [NAD⁺]/[NADH] = 10, la reazione malato + NAD⁺ → ossalacetato + NADH ha ΔG ≤ 0 solo se [OAA]/[malato] ≤ 6,3·10⁻⁶ × 10 = 6,3·10⁻⁵.",
      risultato: "l'ossalacetato deve stare sotto circa 1/16 000 della concentrazione del malato"
    },
    fonti: [
      "H. A. Krebs, W. A. Johnson, The role of citric acid in intermediate metabolism in animal tissues, Enzymologia 4 (1937) 148–156",
      "D. L. Nelson, M. M. Cox, Lehninger Principles of Biochemistry, 7ª ed., W. H. Freeman, 2017, cap. «The Citric Acid Cycle»",
      "J. M. Berg, J. L. Tymoczko, G. J. Gatto, L. Stryer, Biochemistry, 9ª ed., W. H. Freeman, 2019, cap. «The Citric Acid Cycle»",
      "A. G. Ogston, Interpretation of experiments on metabolic processes, using isotopic tracer elements, Nature 162 (1948) 963"
    ],
    collegamenti: ['sglyc', 'setc', 'sglic', 'sbeta', 'sgluco', 'surea']
  };

  /* ───────────────────────── CATENA RESPIRATORIA ───────────────────────── */
  T['setc'] = {
    titolo: "Catena respiratoria e fosforilazione ossidativa: la chemiosmosi",
    sintesi: "Gli elettroni del NADH e del succinato scendono, attraverso i complessi I, II, III e IV della membrana mitocondriale interna, fino all'ossigeno. La differenza di potenziale redox libera energia che i complessi I, III e IV usano per pompare protoni nello spazio intermembrana. Il gradiente elettrochimico così creato, la forza protonmotrice, fa ruotare l'ATP sintasi: è la teoria chemiosmotica di Mitchell.",
    paragrafi: [
      { titolo: "La scala dei potenziali",
        testo: "Ogni trasportatore della catena ha un potenziale di riduzione standard, e gli elettroni passano spontaneamente verso valori più positivi. Il NAD⁺/NADH ha E°′ = −0,320 V, l'ubichinone circa +0,045 V, il citocromo c circa +0,25 V (i valori riportati variano fra +0,22 e +0,25 V), la coppia O₂/H₂O +0,816 V. La differenza complessiva fra NADH e ossigeno, circa 1,14 V, corrisponde per due elettroni a un ΔG°′ di circa −220 kJ/mol. L'energia viene liberata a gradini, ciascuno abbastanza grande da spingere protoni contro il gradiente, invece che in un'unica reazione esplosiva come nella combustione." },
      { titolo: "I complessi",
        testo: "Il complesso I (NADH:ubichinone ossidoreduttasi) riceve gli elettroni dal NADH tramite FMN e una serie di centri ferro-zolfo e riduce l'ubichinone, pompando 4 H⁺ per coppia di elettroni. Il complesso II, la succinato deidrogenasi del ciclo di Krebs, passa all'ubichinone gli elettroni del succinato senza pompare protoni; per la stessa via, senza passare dal complesso I, entrano gli elettroni dell'acil-CoA deidrogenasi della β-ossidazione e della glicerolo-3-fosfato deidrogenasi. Il complesso III (citocromo bc₁) trasferisce gli elettroni dall'ubichinolo al citocromo c attraverso il ciclo Q, che porta nello spazio intermembrana 4 H⁺ per coppia di elettroni. Il complesso IV (citocromo c ossidasi), con gli eme a e a₃ e i centri di rame CuA e CuB, riduce O₂ ad acqua consumando protoni della matrice e ne pompa altri 2 per coppia di elettroni. In totale si spostano circa 10 H⁺ per NADH e 6 per succinato." },
      { titolo: "La forza protonmotrice",
        testo: "Il pompaggio crea due componenti: una differenza di pH, con la matrice più basica, e una differenza di potenziale elettrico, con la matrice negativa. La loro combinazione è la forza protonmotrice Δp, in modulo dell'ordine di 0,15–0,20 V nei mitocondri respiranti, in cui la componente elettrica è la maggiore. Riportare un protone nella matrice libera un'energia libera di circa 19–20 kJ/mol. Mitchell propose nel 1961 che questo gradiente, e non un intermedio chimico ad alta energia, accoppiasse il trasporto di elettroni alla sintesi di ATP; fra le prove più convincenti ci fu la sintesi di ATP ottenuta imponendo un gradiente artificiale a tilacoidi o a vescicole, anche senza trasporto di elettroni." },
      { titolo: "L'ATP sintasi e i rapporti P/O",
        testo: "L'ATP sintasi è formata da un settore Fₒ nella membrana e da un settore F₁ nella matrice. Il flusso dei protoni attraverso Fₒ fa ruotare l'anello delle subunità c e, con esso, l'asse γ; la rotazione cambia ciclicamente la conformazione dei tre siti catalitici β, che passano dagli stati aperto, lasso e stretto secondo il meccanismo del cambiamento di legame di Boyer. Nei mammiferi l'anello ha 8 subunità c, quindi 8 protoni producono 3 ATP, circa 2,7 H⁺ per ATP; a questi si aggiunge circa 1 H⁺ speso per importare il fosfato e scambiare ADP con ATP. Con circa 4 H⁺ per ATP citosolico si ottengono 10/4 = 2,5 ATP per NADH e 6/4 = 1,5 per succinato: sono i rapporti P/O usati dalla sezione." },
      { titolo: "Inibitori e disaccoppianti",
        testo: "Gli inibitori classici bloccano punti precisi: rotenone e amital il complesso I, antimicina A il complesso III, cianuro, azide e monossido di carbonio il complesso IV, oligomicina il canale protonico dell'ATP sintasi. I disaccoppianti, come il 2,4-dinitrofenolo, sono acidi deboli liposolubili che riportano protoni nella matrice aggirando l'ATP sintasi: il trasporto di elettroni accelera, l'ATP non si forma e l'energia si dissipa come calore. Il tessuto adiposo bruno usa lo stesso principio in forma fisiologica con la proteina disaccoppiante UCP1 (termogenina)." }
    ],
    formule: [
      ["ΔG°′ = −n F ΔE°′", "energia libera standard di un trasferimento di n elettroni fra due coppie redox; F = 96 485 C/mol, ΔE°′ = E°′(accettore) − E°′(donatore) in volt"],
      ["Δp = Δψ − (2,303 RT/F) ΔpH", "forza protonmotrice in volt; Δψ = ψ(matrice) − ψ(esterno), negativo, e ΔpH = pH(matrice) − pH(esterno), positivo: entrambi i termini spingono i protoni verso la matrice. A 37 °C 2,303RT/F = 61,5 mV"],
      ["P/O ≈ (H⁺ pompati per 2 e⁻) / (H⁺ per ATP) = 10/4 = 2,5 (NADH); 6/4 = 1,5 (succinato)", "rapporto P/O: ATP sintetizzati per atomo di ossigeno ridotto"]
    ],
    ipotesi: [
      "La stechiometria di 4, 4 e 2 H⁺ per coppia di elettroni e quella dell'anello c sono le più accettate per i mitocondri di mammifero; organismi diversi hanno anelli c di dimensioni diverse e quindi rapporti P/O diversi.",
      "I potenziali E°′ sono standard a pH 7; i potenziali reali dipendono dai rapporti fra forme ossidate e ridotte nella membrana."
    ],
    errori: [
      "Pensare che il complesso II pompi protoni: non pompa, ed è per questo che gli elettroni del succinato rendono meno ATP.",
      "Leggere i rapporti P/O come numeri interi fissi (3 e 2): sono valori sperimentali non interi.",
      "Credere che l'ossigeno serva a «bruciare» il glucosio direttamente: l'ossigeno è solo l'accettore finale degli elettroni al complesso IV.",
      "Trattare il conteggio dei protoni dell'animazione come una misura: la sezione rappresenta il pompaggio in modo qualitativo, mentre la stechiometria è circa 10 H⁺ per NADH e 6 per succinato."
    ],
    esempio: {
      testo: "Si calcoli il ΔG°′ per il passaggio di 2 elettroni dal NADH all'ossigeno e lo si confronti con il costo di pompare protoni. ΔE°′ = 0,816 − (−0,320) = 1,136 V; ΔG°′ = −2 × 96 485 × 1,136 = −219 kJ/mol. Con Δψ = 0,15 V e ΔpH = 0,75 a 37 °C, riportare fuori un protone costa F·Δψ + 2,303RT·ΔpH = 14,5 + 4,5 = 18,9 kJ/mol. L'energia disponibile basterebbe al massimo per 219/18,9 ≈ 11,6 protoni.",
      risultato: "ΔG°′ ≈ −219 kJ/mol; il limite teorico di circa 11–12 H⁺ è compatibile con i 10 H⁺ effettivamente pompati per NADH"
    },
    fonti: [
      "P. Mitchell, Coupling of phosphorylation to electron and hydrogen transfer by a chemi-osmotic type of mechanism, Nature 191 (1961) 144–148",
      "D. L. Nelson, M. M. Cox, Lehninger Principles of Biochemistry, 7ª ed., W. H. Freeman, 2017, cap. «Oxidative Phosphorylation»",
      "I. N. Watt, M. G. Montgomery, M. J. Runswick, A. G. W. Leslie, J. E. Walker, Bioenergetic cost of making an adenosine triphosphate molecule in animal mitochondria, PNAS 107 (2010) 16823–16827",
      "P. C. Hinkle, P/O ratios of mitochondrial oxidative phosphorylation, Biochimica et Biophysica Acta 1706 (2005) 1–11",
      "D. G. Nicholls, S. J. Ferguson, Bioenergetics, 4ª ed., Academic Press, 2013"
    ],
    collegamenti: ['snernst', 'skrebs', 'sglyc', 'sbeta', 'sglic']
  };

  /* ───────────────────────── β-OSSIDAZIONE ───────────────────────── */
  T['sbeta'] = {
    titolo: "La β-ossidazione degli acidi grassi",
    sintesi: "Gli acidi grassi vengono attivati come acil-CoA nel citosol, entrano nella matrice mitocondriale con la navetta della carnitina e sono poi accorciati di due carboni alla volta da una spirale di quattro reazioni: ossidazione con FAD, idratazione, ossidazione con NAD⁺ e tiolisi. Ogni giro libera un acetil-CoA, un FADH₂ e un NADH. Il palmitato rende circa 106 ATP, più del triplo di un glucosio.",
    paragrafi: [
      { titolo: "Attivazione e ingresso nel mitocondrio",
        testo: "L'acil-CoA sintetasi della membrana mitocondriale esterna lega l'acido grasso al coenzima A con un legame tioestere, passando per un acil-adenilato: l'ATP viene scisso in AMP e pirofosfato, e l'idrolisi del pirofosfato rende la reazione irreversibile. L'attivazione costa quindi l'equivalente di due ATP, indipendentemente dalla lunghezza della catena. La membrana interna è impermeabile all'acil-CoA a catena lunga: la carnitina palmitoiltransferasi I trasferisce l'acile sulla carnitina, la traslocasi scambia acil-carnitina con carnitina libera e la carnitina palmitoiltransferasi II ricostruisce l'acil-CoA nella matrice. La CPT-I è il punto di controllo della via: il malonil-CoA, primo intermedio della sintesi degli acidi grassi, la inibisce, così la cellula non demolisce gli acidi grassi mentre li sta sintetizzando." },
      { titolo: "La spirale di quattro reazioni",
        testo: "L'acil-CoA deidrogenasi introduce un doppio legame trans fra Cα e Cβ e riduce il FAD legato all'enzima; gli elettroni arrivano all'ubichinone attraverso la flavoproteina di trasferimento elettronico (ETF), senza passare dal complesso I. Esistono isoforme con preferenze per catene corte, medie, lunghe e molto lunghe. L'enoil-CoA idratasi aggiunge acqua al doppio legame trans dando lo stereoisomero L-3-idrossiacil-CoA. La 3-idrossiacil-CoA deidrogenasi ossida l'ossidrile a chetone riducendo il NAD⁺. Infine la tiolasi, con una cisteina del sito attivo, attacca il carbonile in β e scinde il legame Cα–Cβ in una retro-Claisen: si libera acetil-CoA e rimane un acil-CoA più corto di due carboni, già attivato e pronto per il giro successivo. Lo schema ricalca, con chimica opposta, la sequenza della sintesi degli acidi grassi." },
      { titolo: "Il bilancio del palmitato",
        testo: "Il palmitato (16 carboni) richiede 7 giri e produce 8 acetil-CoA, 7 FADH₂ e 7 NADH. Con i rapporti P/O moderni, 8 acetil-CoA ossidati nel ciclo di Krebs danno 8 × 10 = 80 ATP, i 7 FADH₂ 7 × 1,5 = 10,5 e i 7 NADH 7 × 2,5 = 17,5, per un totale di 108; tolti i 2 equivalenti dell'attivazione restano 106 ATP. Riferito alla massa, un grammo di palmitato rende circa 2,3 volte gli ATP di un grammo di glucosio, perché i carboni degli acidi grassi sono quasi completamente ridotti; il vantaggio reale dei grassi come riserva è ancora maggiore, perché sono immagazzinati senza acqua di idratazione, mentre il glicogeno ne trattiene parecchia." },
      { titolo: "Catene dispari, insaturazioni, perossisomi",
        testo: "Un acido grasso con numero dispari di carboni lascia nell'ultimo giro un propionil-CoA, che viene carbossilato e convertito, con un passaggio che richiede la vitamina B₁₂, in succinil-CoA, intermedio del ciclo di Krebs: è una delle poche vie con cui i lipidi possono contribuire, in piccola misura, alla gluconeogenesi. I doppi legami cis degli acidi grassi insaturi richiedono enzimi ausiliari, un'isomerasi e, per i doppi legami in posizione pari, una 2,4-dienoil-CoA reduttasi. Gli acidi grassi a catena molto lunga sono accorciati prima nei perossisomi, dove il primo passaggio cede gli elettroni direttamente all'ossigeno producendo perossido di idrogeno invece di FADH₂." },
      { titolo: "Rilevanza fisiologica",
        testo: "Nel digiuno prolungato la β-ossidazione epatica produce più acetil-CoA di quanto il ciclo di Krebs possa ossidare, anche perché l'ossalacetato viene sottratto dalla gluconeogenesi; l'eccesso diventa corpi chetonici, acetoacetato e β-idrossibutirrato, carburante per cuore, muscolo e, dopo alcuni giorni, cervello. I difetti della via, il più frequente dei quali è il deficit di acil-CoA deidrogenasi a catena media (MCAD), si manifestano tipicamente con ipoglicemia ipochetotica durante il digiuno, perché il fegato non riesce a produrre né corpi chetonici né l'energia necessaria alla gluconeogenesi." }
    ],
    formule: [
      ["Palmitoil-CoA + 7 CoA + 7 FAD + 7 NAD⁺ + 7 H₂O → 8 acetil-CoA + 7 FADH₂ + 7 NADH + 7 H⁺", "equazione dei sette giri di β-ossidazione del palmitato"],
      ["giri = n/2 − 1;  acetil-CoA = n/2", "per un acido grasso saturo con n carboni (n pari)"],
      ["ATP netti = 10·(n/2) + 4·(n/2 − 1) − 2", "resa con P/O = 2,5 e 1,5: 10 ATP per acetil-CoA, 4 per giro (FADH₂ + NADH), 2 spesi nell'attivazione; per n = 16 dà 106"]
    ],
    ipotesi: [
      "La formula di resa vale per acidi grassi saturi a numero pari di carboni ossidati completamente nel mitocondrio; per gli insaturi si perde circa 1,5 ATP per ogni doppio legame che salta il passaggio dell'acil-CoA deidrogenasi.",
      "I rapporti P/O di 2,5 e 1,5 sono valori medi sperimentali; con i vecchi valori interi di 3 e 2 il palmitato renderebbe 129 ATP."
    ],
    errori: [
      "Contare 8 giri per il palmitato perché si formano 8 acetil-CoA: l'ultimo giro scinde un butirril-CoA in due acetil-CoA, quindi i giri sono 7.",
      "Dimenticare il costo dell'attivazione o contarlo come un solo ATP: ATP → AMP + PPᵢ equivale a due legami fosfoanidridici.",
      "Affermare che gli acidi grassi a numero pari di carboni producano una sintesi netta di glucosio: l'acetil-CoA non può essere convertito in piruvato o in ossalacetato netto negli animali."
    ],
    esempio: {
      testo: "Si calcoli la resa dello stearato (18:0). n = 18: acetil-CoA = 9, giri = 8. ATP = 9 × 10 + 8 × (1,5 + 2,5) − 2 = 90 + 32 − 2 = 120. Per confronto, per grammo: palmitato 106/256,4 g mol⁻¹ = 0,413 mol di ATP per grammo, glucosio 32/180,2 = 0,178 mol per grammo, rapporto 2,3.",
      risultato: "120 ATP per stearato; per unità di massa un acido grasso rende circa 2,3 volte il glucosio"
    },
    fonti: [
      "D. L. Nelson, M. M. Cox, Lehninger Principles of Biochemistry, 7ª ed., W. H. Freeman, 2017, cap. «Fatty Acid Catabolism»",
      "J. M. Berg, J. L. Tymoczko, G. J. Gatto, L. Stryer, Biochemistry, 9ª ed., W. H. Freeman, 2019, cap. «Fatty Acid Metabolism»",
      "S. M. Houten, R. J. A. Wanders, A general introduction to the biochemistry of mitochondrial fatty acid β-oxidation, Journal of Inherited Metabolic Disease 33 (2010) 469–477"
    ],
    collegamenti: ['sglyc', 'skrebs', 'setc', 'sbiosyn', 'sgluco']
  };

  /* ───────────────────────── PENTOSI FOSFATI ───────────────────────── */
  T['sppp'] = {
    titolo: "La via dei pentosi fosfati: NADPH e ribosio-5-fosfato",
    sintesi: "La via dei pentosi fosfati ossida il glucosio-6-fosfato senza produrre ATP. Nella fase ossidativa, irreversibile, genera 2 NADPH e una CO₂ per ogni glucosio-6-fosfato e forma il ribulosio-5-fosfato; nella fase non ossidativa, reversibile, transchetolasi e transaldolasi rimescolano gli scheletri carboniosi fra zuccheri a 3, 4, 5, 6 e 7 atomi, adattando i prodotti a ciò che serve alla cellula.",
    paragrafi: [
      { titolo: "La fase ossidativa",
        testo: "La glucosio-6-fosfato deidrogenasi (G6PD) ossida il C1 del glucosio-6-fosfato, in forma ciclica, a 6-fosfoglucono-δ-lattone, riducendo il NADP⁺. È la tappa che impegna il glucosio nella via, ed è regolata soprattutto dalla disponibilità di NADP⁺: quando la cellula consuma NADPH il rapporto NADP⁺/NADPH sale e la via accelera. La lattonasi idrolizza l'estere ciclico a 6-fosfogluconato; la reazione avverrebbe anche spontaneamente, ma l'enzima la rende più rapida e impedisce che il lattone reagisca con altri nucleofili. La 6-fosfogluconato deidrogenasi esegue una decarbossilazione ossidativa: ossida l'ossidrile in C3 a chetone, il β-chetoacido perde CO₂ e si forma il ribulosio-5-fosfato con un secondo NADPH. La fosfopentoso isomerasi lo converte in ribosio-5-fosfato attraverso un enediolo." },
      { titolo: "La fase non ossidativa",
        testo: "Quando la cellula ha bisogno di NADPH più che di ribosio, i pentosi fosfati devono tornare nella glicolisi. La transchetolasi, che usa tiamina pirofosfato come le decarbossilasi degli α-chetoacidi, trasferisce un'unità di due carboni da un chetoso a un aldoso; la transaldolasi trasferisce un'unità di tre carboni attraverso una base di Schiff con una lisina. Il risultato netto è che tre pentosi fosfati diventano due fruttosio-6-fosfato e una gliceraldeide-3-fosfato, conservando tutti i quindici atomi di carbonio. Poiché queste reazioni sono vicine all'equilibrio, la stessa rete può lavorare nel verso opposto e produrre ribosio-5-fosfato dagli intermedi glicolitici, senza passare dalla fase ossidativa." },
      { titolo: "Quattro modalità secondo il fabbisogno",
        testo: "I manuali descrivono quattro situazioni tipiche. Se servono soprattutto nucleotidi, gli intermedi glicolitici vengono convertiti in ribosio-5-fosfato dalla fase non ossidativa. Se servono NADPH e ribosio in proporzione, prevale la fase ossidativa. Se serve molto NADPH, come nel tessuto adiposo durante la lipogenesi, i pentosi vengono riciclati in glucosio-6-fosfato attraverso la fase non ossidativa e la gluconeogenesi, e il glucosio-6-fosfato può essere ossidato completamente a CO₂ ripassando più volte dalla fase ossidativa. Se servono NADPH e ATP, i pentosi vengono convertiti in intermedi glicolitici e ossidati a piruvato." },
      { titolo: "Perché due coenzimi così simili",
        testo: "NADH e NADPH differiscono solo per un fosfato in posizione 2′ dell'adenosina e hanno potenziali standard quasi uguali. La cellula però li tiene in rapporti opposti: nel citosol il NAD⁺ è in grande eccesso sul NADH, così da accettare elettroni nelle ossidazioni cataboliche, mentre il NADPH prevale sul NADP⁺, così da fornire elettroni alle biosintesi riduttive. Il NADPH alimenta la sintesi di acidi grassi e colesterolo, la riduzione del glutatione da parte della glutatione reduttasi, i citocromi P450 e la produzione di superossido da parte della NADPH ossidasi dei fagociti. Negli eritrociti la via è l'unica fonte di NADPH: per questo i portatori di deficit di G6PD vanno incontro a emolisi quando sono esposti a stress ossidativi, come alcuni farmaci o le fave (favismo)." }
    ],
    formule: [
      ["G6P + 2 NADP⁺ + H₂O → ribulosio-5-P + CO₂ + 2 NADPH + 2 H⁺", "equazione della fase ossidativa"],
      ["3 pentosi-5-P ⇌ 2 fruttosio-6-P + gliceraldeide-3-P", "bilancio della fase non ossidativa: 3 × 5 C = 2 × 6 C + 3 C"],
      ["6 G6P + 12 NADP⁺ + 7 H₂O → 5 G6P + 6 CO₂ + 12 NADPH + 12 H⁺ + Pᵢ", "modalità di ossidazione completa: il netto equivale a ossidare un glucosio-6-fosfato a 6 CO₂ con produzione di 12 NADPH"]
    ],
    ipotesi: [
      "Le quattro modalità sono schematizzazioni: in un tessuto reale il flusso si ripartisce fra di esse secondo la domanda di NADPH, ribosio e ATP.",
      "La via non è l'unica fonte di NADPH citosolico: contribuiscono anche l'enzima malico e l'isocitrato deidrogenasi NADP-dipendente, in misura che dipende dal tessuto."
    ],
    errori: [
      "Scrivere che la via produce ATP: non ne produce in nessuna tappa.",
      "Confondere ribulosio e ribosio: la 6-fosfogluconato deidrogenasi produce il chetopentoso ribulosio-5-fosfato, che va poi isomerizzato.",
      "Pensare che senza fase ossidativa la cellula non possa ottenere ribosio-5-fosfato: la fase non ossidativa lo produce dagli intermedi glicolitici."
    ],
    esempio: {
      testo: "Per sintetizzare una molecola di palmitato servono 14 NADPH. Se tutto il NADPH venisse dalla fase ossidativa della via, quanti glucosio-6-fosfato andrebbero ossidati e quanta CO₂ si libererebbe? Ogni G6P che attraversa la fase ossidativa dà 2 NADPH e 1 CO₂, quindi servono 14/2 = 7 passaggi, con 7 CO₂.",
      risultato: "7 G6P ossidati nella fase ossidativa e 7 CO₂ per palmitato"
    },
    fonti: [
      "D. L. Nelson, M. M. Cox, Lehninger Principles of Biochemistry, 7ª ed., W. H. Freeman, 2017, cap. «Glycolysis, Gluconeogenesis, and the Pentose Phosphate Pathway»",
      "J. M. Berg, J. L. Tymoczko, G. J. Gatto, L. Stryer, Biochemistry, 9ª ed., W. H. Freeman, 2019, cap. «The Calvin Cycle and the Pentose Phosphate Pathway»",
      "A. Stincone et al., The return of metabolism: biochemistry and physiology of the pentose phosphate pathway, Biological Reviews 90 (2015) 927–963"
    ],
    collegamenti: ['sglyc', 'sglic', 'sbiosyn', 'sgluco']
  };

  /* ───────────────────────── CICLO DELL'UREA ───────────────────────── */
  T['surea'] = {
    titolo: "Il ciclo dell'urea: smaltire l'azoto in eccesso",
    sintesi: "Nei mammiferi l'azoto degli amminoacidi in eccesso viene eliminato come urea, sintetizzata nel fegato da un ciclo di cinque reazioni che attraversa matrice mitocondriale e citosol. Un atomo di azoto dell'urea viene dall'ammonio libero, l'altro dall'aspartato, il carbonio dal bicarbonato. Il ciclo spende 3 ATP, pari a 4 legami fosfoanidridici, per ogni molecola di urea, e libera fumarato che collega l'azoto al ciclo di Krebs.",
    paragrafi: [
      { titolo: "Da dove arriva l'azoto",
        testo: "Gli amminoacidi cedono il loro gruppo amminico per transaminazione all'α-chetoglutarato, formando glutammato, con il piridossal fosfato come coenzima. Nel fegato la glutammato deidrogenasi libera l'azoto come ione ammonio nella matrice mitocondriale; gli altri tessuti lo trasportano in forma non tossica come glutammina oppure, il muscolo, come alanina nel ciclo glucosio-alanina. L'ammoniaca libera deve restare a concentrazioni plasmatiche molto basse perché è neurotossica: per questo la fissazione dell'ammonio avviene subito, nello stesso compartimento in cui viene liberato." },
      { titolo: "Le cinque reazioni",
        testo: "Nella matrice la carbamil-fosfato sintetasi I usa due ATP per condensare ammonio e bicarbonato in carbamil-fosfato: un ATP attiva il bicarbonato come carbossifosfato, l'altro fosforila il carbammato. L'ornitina transcarbamilasi trasferisce il carbamile all'ornitina formando citrullina, che esce nel citosol. L'argininosuccinato sintetasi condensa la citrullina con l'aspartato, che porta il secondo azoto, attivando l'ossigeno ureidico come citrullil-AMP: l'ATP diventa AMP e pirofosfato, e l'idrolisi del pirofosfato consuma il terzo e il quarto legame fosfoanidridico. L'argininosuccinato liasi scinde il prodotto in arginina e fumarato; l'arginasi idrolizza l'arginina in urea e ornitina, che rientra nel mitocondrio per un nuovo giro." },
      { titolo: "La bicicletta di Krebs",
        testo: "Il fumarato liberato nel citosol viene idratato a malato e ossidato a ossalacetato, che per transaminazione rigenera l'aspartato necessario al giro successivo: è il cosiddetto ciclo aspartato-argininosuccinato, che unisce il ciclo dell'urea e quello dell'acido citrico in una «bicicletta». L'ossidazione del malato produce un NADH, che attraverso la catena respiratoria può rendere circa 2,5 ATP e compensa in parte il costo della sintesi dell'urea. Entrambi i cicli furono scoperti da Hans Krebs, quello dell'urea nel 1932 con Kurt Henseleit." },
      { titolo: "Regolazione",
        testo: "Il controllo principale si esercita sulla carbamil-fosfato sintetasi I, che è praticamente inattiva senza il suo attivatore allosterico, l'N-acetilglutammato. Questo viene sintetizzato da acetil-CoA e glutammato dalla N-acetilglutammato sintasi, a sua volta attivata dall'arginina: quando arrivano molti amminoacidi, il segnale si accende. Su tempi più lunghi le quantità degli enzimi del ciclo aumentano con diete ricche di proteine e nel digiuno prolungato, quando le proteine muscolari vengono demolite per la gluconeogenesi." },
      { titolo: "Difetti congeniti",
        testo: "La mancanza di uno qualunque degli enzimi del ciclo provoca iperammoniemia, con letargia, vomito e, nei casi gravi, encefalopatia. Il deficit di ornitina transcarbamilasi è il più frequente ed è legato al cromosoma X. Il meccanismo della tossicità cerebrale non è del tutto chiarito: si ritiene che contribuiscano l'accumulo di glutammina negli astrociti, con rigonfiamento osmotico, e le alterazioni del metabolismo energetico e della neurotrasmissione. Le terapie combinano una dieta povera di proteine con farmaci che offrono vie alternative di escrezione dell'azoto, come il benzoato e il fenilbutirrato, e con la supplementazione di arginina." }
    ],
    formule: [
      ["NH₄⁺ + HCO₃⁻ + aspartato + 3 ATP + H₂O → urea + fumarato + 2 ADP + 2 Pᵢ + AMP + PPᵢ", "equazione complessiva del ciclo; con l'idrolisi del PPᵢ i legami fosfoanidridici consumati sono 4"],
      ["n(urea) = m(N) / M(N₂ nell'urea) = m(N) / 28,01 g mol⁻¹", "ogni molecola di urea, CO(NH₂)₂ con M = 60,06 g/mol, contiene due atomi di azoto"],
      ["m(N) ≈ m(proteine) × 0,16", "le proteine contengono in media circa il 16 % di azoto (fattore di conversione 6,25)"]
    ],
    ipotesi: [
      "Il fattore del 16 % di azoto è una media; il contenuto effettivo varia fra le proteine con la composizione in amminoacidi.",
      "Il calcolo dell'urea prodotta assume che tutto l'azoto proteico venga escreto come urea; in realtà una parte esce come ammonio, creatinina e acido urico."
    ],
    errori: [
      "Dire che i due azoti dell'urea vengono entrambi dall'ammoniaca libera: uno viene dall'ammonio, l'altro dall'aspartato.",
      "Contare 3 ATP come 3 legami spesi: l'argininosuccinato sintetasi produce AMP e PPᵢ, quindi i legami fosfoanidridici consumati sono 4.",
      "Confondere la carbamil-fosfato sintetasi I, mitocondriale e del ciclo dell'urea, con la II, citosolica, che usa glutammina e serve alla sintesi delle pirimidine."
    ],
    esempio: {
      testo: "Un adulto in bilancio azotato assume 70 g di proteine al giorno. Quanta urea produce, e quanti legami fosfoanidridici spende? Azoto: 70 × 0,16 = 11,2 g. Urea: 11,2/28,01 = 0,400 mol, cioè 0,400 × 60,06 = 24,0 g. Legami: 4 × 0,400 = 1,60 mol al giorno.",
      risultato: "circa 24 g di urea al giorno, con un costo di circa 1,6 mol di legami fosfoanidridici"
    },
    fonti: [
      "H. A. Krebs, K. Henseleit, Untersuchungen über die Harnstoffbildung im Tierkörper, Hoppe-Seyler's Zeitschrift für physiologische Chemie 210 (1932) 33–66",
      "D. L. Nelson, M. M. Cox, Lehninger Principles of Biochemistry, 7ª ed., W. H. Freeman, 2017, cap. «Amino Acid Oxidation and the Production of Urea»",
      "J. M. Berg, J. L. Tymoczko, G. J. Gatto, L. Stryer, Biochemistry, 9ª ed., W. H. Freeman, 2019, cap. «Protein Turnover and Amino Acid Catabolism»",
      "S. M. Morris Jr., Regulation of enzymes of the urea cycle and arginine metabolism, Annual Review of Nutrition 22 (2002) 87–105"
    ],
    collegamenti: ['skrebs', 'saa', 'sglyc', 'sgluco']
  };

  /* ───────────────────────── GLUCONEOGENESI ───────────────────────── */
  T['sgluco'] = {
    titolo: "La gluconeogenesi: sintesi del glucosio e i bypass delle tappe irreversibili",
    sintesi: "La gluconeogenesi sintetizza glucosio da precursori non glucidici, soprattutto lattato, alanina e glicerolo, nel fegato e in misura minore nel rene. Usa le sette tappe reversibili della glicolisi in senso inverso e aggira le tre irreversibili con quattro enzimi diversi. Costa 4 ATP, 2 GTP e 2 NADH per glucosio a partire da due piruvati, ed è regolata in modo reciproco con la glicolisi.",
    paragrafi: [
      { titolo: "I bypass",
        testo: "La piruvato chinasi non può essere invertita, quindi il piruvato prende una strada a due tappe. Nel mitocondrio la piruvato carbossilasi, con biotina come trasportatore di CO₂ attivata, lo carbossila a ossalacetato consumando un ATP; la fosfoenolpiruvato carbossichinasi (PEPCK) decarbossila e fosforila l'ossalacetato a PEP spendendo un GTP. La CO₂ aggiunta e poi tolta serve a rendere favorevole la formazione del PEP: la decarbossilazione fornisce la spinta che manca a una fosforilazione diretta del piruvato. Il PEP risale le tappe reversibili fino al fruttosio-1,6-bisfosfato, che la fruttosio-1,6-bisfosfatasi idrolizza a fruttosio-6-fosfato. Infine la glucosio-6-fosfatasi del reticolo endoplasmatico libera glucosio: l'enzima è presente nel fegato e nel rene ma non nel muscolo, che quindi non può cedere glucosio al sangue." },
      { titolo: "Compartimenti e precursori",
        testo: "L'ossalacetato non attraversa la membrana mitocondriale interna. Partendo da piruvato o alanina viene ridotto a malato, che esce e viene riossidato nel citosol, portando con sé il NADH necessario alla gliceraldeide-3-fosfato deidrogenasi; partendo da lattato il NADH si forma già nel citosol dalla lattato deidrogenasi, e l'ossalacetato può essere convertito in PEP dall'isoforma mitocondriale della PEPCK o uscire come aspartato. Il glicerolo dei trigliceridi entra come diidrossiacetone fosfato, gli amminoacidi glucogenici come piruvato o intermedi del ciclo di Krebs. Gli acidi grassi a numero pari di carboni non sono substrati netti: il loro acetil-CoA non può diventare ossalacetato netto negli animali." },
      { titolo: "Costo energetico",
        testo: "Da due piruvati si spendono 2 ATP nella piruvato carbossilasi, 2 GTP nella PEPCK e 2 ATP nella fosfoglicerato chinasi percorsa al contrario: sei legami fosfoanidridici, più due NADH. La glicolisi ne produceva solo due: la differenza, quattro legami per glucosio, è il prezzo che rende la gluconeogenesi esoergonica nelle condizioni cellulari, mentre la semplice inversione della glicolisi avrebbe un ΔG fortemente positivo. Per lo stesso motivo il ciclo di Cori, in cui il lattato prodotto dal muscolo in attività torna glucosio nel fegato, non è un ciclo energeticamente neutro: sposta il costo metabolico dal muscolo al fegato." },
      { titolo: "Regolazione reciproca con la glicolisi",
        testo: "Le coppie di enzimi opposti sono regolate dagli stessi segnali con effetto contrario. L'acetil-CoA attiva la piruvato carbossilasi e inibisce la piruvato deidrogenasi, indirizzando il piruvato verso il glucosio quando gli acidi grassi forniscono energia. Il fruttosio-2,6-bisfosfato attiva la PFK-1 e inibisce la fruttosio-1,6-bisfosfatasi, mentre l'AMP agisce nello stesso senso. Nel fegato il glucagone, tramite AMP ciclico e proteina chinasi A, fosforila l'enzima bifunzionale PFK-2/FBPasi-2: ne attiva la parte fosfatasica, abbassa il fruttosio-2,6-bisfosfato e sposta il flusso verso la gluconeogenesi; inattiva inoltre la piruvato chinasi epatica. Su tempi di ore il glucagone e i glucocorticoidi aumentano la trascrizione della PEPCK." }
    ],
    formule: [
      ["2 piruvato + 4 ATP + 2 GTP + 2 NADH + 2 H⁺ + 4 H₂O → glucosio + 4 ADP + 2 GDP + 6 Pᵢ + 2 NAD⁺", "equazione complessiva della gluconeogenesi dal piruvato"],
      ["costo netto del ciclo di Cori = 6 − 2 = 4 legami fosfoanidridici per glucosio", "il fegato spende 6 equivalenti per risintetizzare il glucosio da 2 lattati, il muscolo ne ricava 2 dalla glicolisi anaerobica"],
      ["ΔG = ΔG°′ + RT ln Q", "le tappe di bypass hanno ΔG negativo nelle condizioni cellulari, a differenza delle corrispondenti tappe glicolitiche invertite"]
    ],
    ipotesi: [
      "Il bilancio di 6 legami vale partendo dal piruvato; partendo dal lattato il NADH viene prodotto nel citosol dalla lattato deidrogenasi e non serve un apporto esterno, mentre dal glicerolo il costo è minore perché si entra a livello dei triosi.",
      "I dettagli del trasporto dell'ossalacetato e la distribuzione della PEPCK fra citosol e mitocondrio variano con la specie e il tessuto."
    ],
    errori: [
      "Descrivere la gluconeogenesi come «glicolisi al contrario»: tre tappe sono sostituite da enzimi diversi.",
      "Dire che il muscolo contribuisce alla glicemia con il suo glicogeno: senza glucosio-6-fosfatasi il glucosio-6-fosfato muscolare resta nel muscolo.",
      "Contare tra i precursori gli acidi grassi a catena pari: forniscono energia e acetil-CoA che attiva la piruvato carbossilasi, ma non carboni netti per il glucosio."
    ],
    esempio: {
      testo: "Durante uno sforzo il muscolo converte 1 glucosio in 2 lattati, guadagnando 2 ATP; il lattato raggiunge il fegato e viene riconvertito in glucosio. Dal lattato al piruvato si produce NADH che bilancia quello richiesto dalla gliceraldeide-3-fosfato deidrogenasi; restano 2 ATP (piruvato carbossilasi) + 2 GTP (PEPCK) + 2 ATP (fosfoglicerato chinasi) = 6 legami spesi. Bilancio del ciclo: 2 − 6.",
      risultato: "il ciclo di Cori costa all'organismo 4 legami fosfoanidridici per ogni glucosio riciclato"
    },
    fonti: [
      "D. L. Nelson, M. M. Cox, Lehninger Principles of Biochemistry, 7ª ed., W. H. Freeman, 2017, capitoli «Glycolysis, Gluconeogenesis, and the Pentose Phosphate Pathway» e «Principles of Metabolic Regulation»",
      "J. M. Berg, J. L. Tymoczko, G. J. Gatto, L. Stryer, Biochemistry, 9ª ed., W. H. Freeman, 2019, cap. «Glycolysis and Gluconeogenesis»",
      "D. Voet, J. G. Voet, Biochemistry, 4ª ed., Wiley, 2011, cap. «Other Pathways of Carbohydrate Metabolism»"
    ],
    collegamenti: ['sglic', 'sglyc', 'skrebs', 'sbeta', 'surea']
  };

  /* ───────────────────────── ORBITALI MOLECOLARI ───────────────────────── */
  T['smo'] = {
    titolo: "Teoria degli orbitali molecolari per le molecole biatomiche",
    sintesi: "Nella teoria degli orbitali molecolari gli elettroni occupano orbitali estesi a tutta la molecola, costruiti come combinazioni lineari di orbitali atomici. Combinazioni in fase danno orbitali leganti, più bassi in energia; combinazioni in opposizione di fase danno antileganti, più alti. Riempiendo i livelli secondo Aufbau, Pauli e Hund si ricavano ordine di legame, magnetismo e tendenze di energia e lunghezza di legame, con previsioni che la teoria di Lewis non riesce a fare, come il paramagnetismo dell'O₂.",
    paragrafi: [
      { titolo: "Combinazione lineare di orbitali atomici",
        testo: "Per H₂ si combinano i due orbitali 1s. La combinazione somma accumula densità elettronica fra i nuclei e ha energia più bassa degli orbitali di partenza: è l'orbitale σ1s legante. La combinazione differenza ha un piano nodale fra i nuclei e energia più alta: è il σ*1s antilegante. Nel trattamento LCAO più semplice, che include la sovrapposizione, le energie sono (α ± β)/(1 ± S), dove α è l'integrale coulombiano, β l'integrale di risonanza (negativo) e S l'integrale di sovrapposizione; poiché il denominatore è 1 − S per l'antilegante, quest'ultimo è destabilizzato più di quanto il legante sia stabilizzato. Per questo He₂, con due elettroni nel legante e due nell'antilegante, non forma un legame chimico: esiste soltanto un dimero di van der Waals legato debolissimamente, rilevabile a temperature vicine allo zero assoluto." },
      { titolo: "Le biatomiche del secondo periodo",
        testo: "Con gli orbitali 2s e 2p si ottengono σ2s, σ*2s, due π2p degeneri, σ2p, due π*2p degeneri e σ*2p. L'ordine fra σ2p e π2p dipende dal mescolamento s–p: per Li₂–N₂ la differenza di energia fra 2s e 2p è piccola, il σ2s e il σ2p si respingono e il σ2p finisce sopra i π2p; per O₂ e F₂ la differenza è grande e l'ordine «intuitivo», con il σ2p più basso, è ripristinato. Le configurazioni della sezione seguono questa regola: N₂ (π2p)⁴(σ2p)², O₂ (σ2p)²(π2p)⁴(π*2p)². Nell'O₂ i due elettroni dei π* occupano orbitali diversi con spin paralleli, per la regola di Hund: lo stato fondamentale è un tripletto e la molecola è paramagnetica, come si osserva vedendo l'ossigeno liquido trattenuto fra i poli di un magnete." },
      { titolo: "Ordine di legame, energia e lunghezza",
        testo: "L'ordine di legame è la metà della differenza fra elettroni leganti e antileganti. A ordine maggiore corrispondono di solito legame più corto e più forte: N₂ (ordine 3, 110 pm, circa 945 kJ/mol), O₂ (ordine 2, 121 pm, circa 498 kJ/mol), F₂ (ordine 1, 141 pm, circa 159 kJ/mol). La regola funziona bene per serie di molecole simili e per gli ioni, per esempio O₂⁺, O₂, O₂⁻ e O₂²⁻ con ordini 2,5, 2, 1,5 e 1 e legami progressivamente più lunghi. Non è però una legge: l'energia del legame F–F è più bassa di quanto ci si aspetterebbe anche per un legame singolo, effetto attribuito alla repulsione fra le coppie solitarie di atomi piccoli e vicini." },
      { titolo: "Molecole eteronucleari",
        testo: "Se i due atomi hanno elettronegatività diverse, gli orbitali atomici di partenza hanno energie diverse e gli orbitali molecolari non sono più ripartiti in modo uguale: il legante ha più carattere dell'atomo più elettronegativo, l'antilegante di quello meno elettronegativo. In CO, isoelettronica con N₂ e con ordine di legame 3, l'orbitale occupato più alto è un σ con un lobo esteso dalla parte del carbonio: per questo CO si lega ai metalli, e al ferro dell'emoglobina, attraverso il carbonio, e il legame metallo-carbonio è rinforzato dalla retrodonazione dagli orbitali d del metallo ai π* di CO, che a sua volta indebolisce il legame C–O. L'energia di dissociazione di CO, circa 1077 kJ/mol, è la più alta fra le molecole biatomiche neutre comuni. In HF la differenza di energia fra 1s dell'idrogeno e 2p del fluoro è grande: in prima approssimazione solo il 2p allineato con l'asse forma un σ legante, polarizzato verso il fluoro, mentre gli altri orbitali del fluoro restano di fatto non leganti." }
    ],
    formule: [
      ["ψ± = c_A φ_A ± c_B φ_B", "orbitale molecolare come combinazione lineare di orbitali atomici φ; per molecole omonucleari |c_A| = |c_B|"],
      ["E± = (α ± β) / (1 ± S)", "energie dei due orbitali di una biatomica omonucleare: α integrale coulombiano, β integrale di risonanza (negativo), S integrale di sovrapposizione"],
      ["ordine di legame = ½ (n − n*)", "n numero di elettroni in orbitali leganti, n* in orbitali antileganti"]
    ],
    ipotesi: [
      "Lo schema qualitativo usa solo gli orbitali di valenza e trascura la correlazione elettronica; le energie dei livelli nei diagrammi sono indicative, non in scala.",
      "Le energie di dissociazione riportate sono D₀ (dal livello vibrazionale fondamentale), circa 432 kJ/mol per H₂; i valori D_e riferiti al minimo della curva di potenziale sono più grandi."
    ],
    errori: [
      "Disegnare i due elettroni π* dell'O₂ appaiati nello stesso orbitale: per la regola di Hund occupano i due π* degeneri con spin paralleli, ed è questo che rende l'O₂ paramagnetico.",
      "Usare per N₂ lo stesso ordine dei livelli di O₂: nelle biatomiche fino all'azoto il σ2p sta sopra i π2p.",
      "Concludere che un ordine di legame zero implichi assenza di qualsiasi interazione: He₂ non ha legame chimico ma esiste un debolissimo dimero di van der Waals."
    ],
    esempio: {
      testo: "Si prevedano ordine di legame e magnetismo di NO⁺, NO e NO⁻. NO ha 11 elettroni di valenza: (σ2s)²(σ*2s)²(π2p)⁴(σ2p)²(π*2p)¹, quindi ordine = ½(8 − 3) = 2,5 con un elettrone spaiato. NO⁺ perde l'elettrone π*: ordine ½(8 − 2) = 3, diamagnetico, isoelettronico con N₂ e CO. NO⁻ ne acquista uno: (π*2p)², ordine ½(8 − 4) = 2, con due elettroni spaiati come O₂.",
      risultato: "NO⁺: ordine 3, diamagnetico; NO: ordine 2,5, paramagnetico (1 e⁻ spaiato); NO⁻: ordine 2, paramagnetico (tripletto)"
    },
    fonti: [
      "P. Atkins, J. de Paula, J. Keeler, Atkins' Physical Chemistry, 11ª ed., Oxford University Press, 2018, Focus 9 «Molecular structure», topic sugli orbitali molecolari delle biatomiche omonucleari ed eteronucleari",
      "C. E. Housecroft, A. G. Sharpe, Inorganic Chemistry, 5ª ed., Pearson, 2018, cap. 2 «Basic concepts: molecules»",
      "G. L. Miessler, P. J. Fischer, D. A. Tarr, Inorganic Chemistry, 5ª ed., Pearson, 2014, cap. 5 «Molecular Orbitals»"
    ],
    collegamenti: ['svsepr', 'ssimm', 'smorb', 'sqm', 'shf']
  };

  /* ───────────────────────── pKa E TAMPONI ───────────────────────── */
  T['spka'] = {
    titolo: "Acidi deboli, pKa e soluzioni tampone",
    sintesi: "Il pKa misura la tendenza di un acido a cedere un protone: è il pH al quale forma acida e forma basica sono presenti in uguale concentrazione. Da esso, con l'equazione di Henderson–Hasselbalch, si ricava il rapporto fra le due forme a qualunque pH. Una miscela di acido debole e base coniugata resiste alle variazioni di pH, con la massima efficacia quando pH = pKa, e questo vale per i tamponi di laboratorio, per il plasma e per la ionizzazione dei farmaci.",
    paragrafi: [
      { titolo: "Costante di acidità e pKa",
        testo: "Per l'equilibrio HA + H₂O ⇌ H₃O⁺ + A⁻ la costante di acidità è Ka = [H₃O⁺][A⁻]/[HA], a rigore scritta con le attività. Il pKa è −log Ka: ogni unità in meno significa un acido dieci volte più forte. La stessa scala descrive le basi attraverso il pKa del loro acido coniugato, ed è per questo che la tabella riporta «pKa BH⁺» per ammine, piridina e imidazolo: un'ammina con pKa(BH⁺) alto è una base forte. Per acidi poliprotici, come l'acido fosforico o il citrico, ci sono più pKa successivi, sempre crescenti perché è più difficile togliere un protone a una specie già carica negativamente. Gli acidi molto forti hanno pKa negativi stimati con metodi indiretti, e il loro valore cambia sensibilmente da una fonte all'altra." },
      { titolo: "L'equazione di Henderson–Hasselbalch",
        testo: "Prendendo il logaritmo dell'espressione di Ka si ottiene pH = pKa + log([A⁻]/[HA]). È solo una riscrittura della costante di equilibrio, ma diventa uno strumento di calcolo quando si sostituiscono alle concentrazioni di equilibrio quelle analitiche dell'acido e del sale messi in soluzione. Questa sostituzione è lecita se le concentrazioni sono abbastanza alte rispetto a [H₃O⁺] e [OH⁻], cioè se la dissociazione dell'acido e l'idrolisi della base cambiano poco le quantità introdotte. Dall'equazione segue che a pH = pKa le due forme sono uguali, che una unità di pH sopra il pKa la forma basica è dieci volte quella acida e che due unità sopra è cento volte: la curva della frazione deprotonata in funzione del pH è la sigmoide mostrata dal calcolatore." },
      { titolo: "Potere tampone",
        testo: "Un tampone resiste alle aggiunte di acido o di base perché ne converte gran parte nell'acido debole o nella base coniugata, cambiando di poco il rapporto [A⁻]/[HA] che compare in un logaritmo. La capacità tampone β, cioè la quantità di base forte necessaria per alzare il pH di un'unità, è massima a pH = pKa e proporzionale alla concentrazione totale del tampone; scende a circa un terzo del massimo a una unità di distanza dal pKa. Da qui la regola pratica di scegliere un tampone con pKa entro circa un'unità dal pH desiderato. Nel sangue il sistema principale è H₂CO₃/HCO₃⁻: il pKa apparente di 6,1, che include la CO₂ disciolta, è lontano dal pH 7,4, ma il sistema è efficace perché la CO₂ è eliminata o trattenuta dalla respirazione. Il fosfato intracellulare (pKa₂ circa 7,2) e le istidine delle proteine lavorano invece vicino al loro pKa." },
      { titolo: "Ionizzazione di amminoacidi e farmaci",
        testo: "Lo stesso calcolo dice quale frazione di una molecola è carica a un certo pH. Per gli amminoacidi la somma delle cariche dei gruppi ionizzabili dà la carica netta e il punto isoelettrico. Per i farmaci la forma neutra attraversa le membrane lipidiche molto meglio di quella ionizzata: un acido debole come l'aspirina (pKa circa 3,5) è quasi tutto ionizzato a pH 7,4, una base debole come la lidocaina (pKa circa 7,9) a pH 7,4 è per circa un quarto neutra e per tre quarti protonata, una base molto forte come la metformina è sempre carica. Le differenze di pH fra compartimenti, per esempio fra plasma e urina o stomaco, fanno accumulare la forma ionizzata dove essa prevale: è la cosiddetta trappola ionica." },
      { titolo: "Limiti dei valori tabulati",
        testo: "I pKa dipendono dalla temperatura, dalla forza ionica e dal solvente. Il tris, tampone molto usato in biochimica, perde circa 0,03 unità di pKa per ogni grado di aumento della temperatura, quindi un tampone preparato a 25 °C ha un pH diverso a 4 °C. In soluzioni concentrate le attività differiscono dalle concentrazioni e il pKa apparente si sposta. Anche il valore dell'acqua richiede attenzione: il 15,7 che compare in molte tabelle deriva dall'aver incluso la concentrazione dell'acqua, 55,5 M, nella costante; con la convenzione termodinamica standard, in cui l'attività dell'acqua solvente vale 1, il pKa dell'acqua è 14,0 a 25 °C." }
    ],
    formule: [
      ["Ka = [H₃O⁺][A⁻] / [HA],  pKa = −log Ka", "costante di acidità e sua forma logaritmica; concentrazioni in mol/L, a rigore attività"],
      ["pH = pKa + log([A⁻]/[HA])", "equazione di Henderson–Hasselbalch: rapporto fra base coniugata e acido a un dato pH"],
      ["α(A⁻) = 1 / (1 + 10^(pKa − pH))", "frazione deprotonata dell'acido; la frazione ionizzata di una base B si ottiene come 1/(1 + 10^(pH − pKa(BH⁺)))"],
      ["β = 2,303 · C · Ka[H₃O⁺] / (Ka + [H₃O⁺])²,  β(max) = 2,303 C/4 ≈ 0,58 C", "capacità tampone di un acido debole di concentrazione totale C (trascurando il contributo di H₃O⁺ e OH⁻), in mol L⁻¹ per unità di pH"]
    ],
    ipotesi: [
      "Henderson–Hasselbalch con le concentrazioni analitiche vale per tamponi non troppo diluiti (in pratica sopra circa 10⁻³ M) e per rapporti [A⁻]/[HA] compresi fra circa 0,1 e 10.",
      "I pKa delle tabelle sono valori a 25 °C e forza ionica bassa; manuali diversi riportano valori leggermente diversi per la stessa molecola."
    ],
    errori: [
      "Usare Henderson–Hasselbalch per calcolare il pH di un acido debole puro o di un acido forte: l'equazione presuppone che entrambe le forme siano presenti in quantità comparabili.",
      "Pensare che la capacità tampone dipenda solo dal pKa: a parità di pKa un tampone 0,1 M ha dieci volte la capacità di uno 0,01 M.",
      "Confondere il pKa di una base con il suo pKb: in tabella compare il pKa dell'acido coniugato BH⁺, e pKa + pKb = 14,0 solo in acqua a 25 °C."
    ],
    esempio: {
      testo: "Un litro di tampone contiene 0,100 mol di acido acetico e 0,150 mol di acetato (pKa = 4,75). pH = 4,75 + log(0,150/0,100) = 4,75 + 0,176 = 4,93. Si aggiungono 0,010 mol di HCl: l'acetato scende a 0,140 mol, l'acido sale a 0,110 mol, pH = 4,75 + log(0,140/0,110) = 4,75 + 0,105 = 4,85. La stessa quantità di HCl in un litro di acqua pura porterebbe il pH da 7,00 a 2,00.",
      risultato: "pH da 4,93 a 4,85 (−0,07 unità) contro −5 unità in assenza di tampone"
    },
    fonti: [
      "D. C. Harris, Quantitative Chemical Analysis, 9ª ed., W. H. Freeman, 2015, capitoli «Monoprotic Acid-Base Equilibria» e «Polyprotic Acid-Base Equilibria»",
      "D. L. Nelson, M. M. Cox, Lehninger Principles of Biochemistry, 7ª ed., W. H. Freeman, 2017, cap. «Water» (ionizzazione, tamponi, Henderson–Hasselbalch)",
      "H. N. Po, N. M. Senozan, The Henderson–Hasselbalch equation: its history and limitations, Journal of Chemical Education 78 (2001) 1499–1503",
      "IUPAC, Compendium of Chemical Terminology (Gold Book), voci «acidity constant» e «buffer»"
    ],
    collegamenti: ['saa', 'sbuffer', 'stitr', 'sdistrib', 'snernst']
  };

  /* ───────────────────────── CINETICA ENZIMATICA ───────────────────────── */
  T['smm'] = {
    titolo: "Cinetica enzimatica: modello di Michaelis–Menten e inibizione",
    sintesi: "Per molti enzimi la velocità iniziale cresce con la concentrazione di substrato seguendo un'iperbole: lineare a basso [S], costante a saturazione. Il modello di Michaelis–Menten, nell'approssimazione dello stato stazionario, riassume questo comportamento in due parametri, Vmax e Km; da essi si ricavano il numero di turnover kcat e l'efficienza catalitica kcat/Km. Gli inibitori reversibili modificano Vmax e Km in modi diversi, riconoscibili nel grafico dei doppi reciproci.",
    paragrafi: [
      { titolo: "Il modello",
        testo: "Lo schema minimo è E + S ⇌ ES → E + P, con costanti k₁ e k₋₁ per la formazione e la dissociazione del complesso e kcat per la tappa catalitica. Michaelis e Menten nel 1913 supposero che il legame del substrato fosse un equilibrio rapido; Briggs e Haldane nel 1925 mostrarono che basta assumere che [ES] resti costante nel tempo, cioè lo stato stazionario, purché il substrato sia in grande eccesso sull'enzima. In entrambi i casi si ottiene v = Vmax[S]/(Km + [S]), con Vmax = kcat[E]tot. L'equazione descrive le velocità iniziali, misurate quando il prodotto è ancora trascurabile e la reazione inversa non conta." },
      { titolo: "Significato dei parametri",
        testo: "Km è la concentrazione di substrato alla quale v = Vmax/2. Nello stato stazionario Km = (k₋₁ + kcat)/k₁: coincide con la costante di dissociazione del complesso ES solo se kcat è molto minore di k₋₁, quindi non è in generale una misura diretta dell'affinità. I valori tipici vanno da circa 10⁻⁶ a 10⁻² M; l'esochinasi ha per il glucosio una Km dell'ordine di 0,1 mM, mentre la glucochinasi epatica ha una concentrazione di semisaturazione intorno a 10 mM, adatta a seguire la glicemia. kcat, il numero di turnover, è il numero di molecole di substrato convertite da un sito attivo per secondo a saturazione. Il rapporto kcat/Km è la costante di velocità di secondo ordine a basso [S] e misura l'efficienza catalitica: alcuni enzimi, come la triosofosfato isomerasi o la fumarasi, arrivano a 10⁸–10⁹ M⁻¹ s⁻¹, il limite imposto dalla diffusione." },
      { titolo: "Lineweaver–Burk e le sue trappole",
        testo: "Prendendo il reciproco dell'equazione si ottiene una retta: 1/v = (Km/Vmax)(1/[S]) + 1/Vmax, con intercetta sull'asse y uguale a 1/Vmax, intercetta sull'asse x uguale a −1/Km e pendenza Km/Vmax. Il grafico dei doppi reciproci è prezioso per riconoscere a colpo d'occhio il tipo di inibizione, ma è un cattivo strumento di stima: i punti a [S] basso, dove v è piccola e l'errore relativo è grande, finiscono lontani sull'asse 1/[S] e dominano la retta. Oggi Km e Vmax si ottengono adattando direttamente l'iperbole ai dati con una regressione non lineare." },
      { titolo: "Inibizione reversibile",
        testo: "Un inibitore competitivo si lega solo all'enzima libero, di solito nel sito attivo, e compete con il substrato: a [S] molto alto l'inibizione viene superata, quindi Vmax resta uguale mentre Km apparente cresce di un fattore 1 + [I]/Ki. Nel grafico di Lineweaver–Burk le rette si incrociano sull'asse y. Un inibitore incompetitivo si lega solo al complesso ES: Km e Vmax apparenti diminuiscono dello stesso fattore e le rette sono parallele. Un inibitore non competitivo puro si lega con uguale affinità a E e a ES: Vmax diminuisce, Km resta invariata e le rette si incrociano sull'asse x. Il caso generale è l'inibizione mista, con affinità diverse per E e per ES. Questi sono i tre casi che la sezione permette di simulare con i parametri [I] e Ki." }
    ],
    formule: [
      ["v = Vmax [S] / (Km + [S])", "equazione di Michaelis–Menten: v velocità iniziale (μM/s), [S] concentrazione di substrato (μM), Vmax velocità massima, Km costante di Michaelis"],
      ["Km = (k₋₁ + kcat)/k₁,  Vmax = kcat [E]tot", "definizioni nello stato stazionario; kcat in s⁻¹, kcat/Km in M⁻¹ s⁻¹"],
      ["1/v = (Km/Vmax)(1/[S]) + 1/Vmax", "forma linearizzata di Lineweaver–Burk"],
      ["v = Vmax [S] / (α Km + α′ [S]),  α = 1 + [I]/Ki,  α′ = 1 + [I]/K′i", "inibizione reversibile generale: competitiva α′ = 1, incompetitiva α = 1, non competitiva pura α = α′"]
    ],
    ipotesi: [
      "Il modello vale per un solo substrato (o con gli altri a saturazione), un solo sito attivo senza cooperatività, velocità iniziali e [S] molto maggiore di [E]tot.",
      "Enzimi allosterici e cooperativi, come la glucochinasi o la PFK-1, danno curve sigmoidi che non seguono l'equazione di Michaelis–Menten e richiedono modelli diversi, per esempio l'equazione di Hill."
    ],
    errori: [
      "Leggere Km sempre come costante di dissociazione: lo è solo quando kcat ≪ k₋₁.",
      "Ricavare Km e Vmax con la retta di Lineweaver–Burk da dati rumorosi: i punti a basso [S] distorcono la stima.",
      "Dire che un inibitore competitivo riduce Vmax: la Vmax è invariata, cambia la Km apparente.",
      "Pensare che a [S] = Km la velocità sia sempre Vmax/2 anche in presenza di inibitore: con l'inibitore vale Vmax,app/2 a [S] = Km,app."
    ],
    esempio: {
      testo: "Con i valori iniziali della sezione, Vmax = 10 μM/s, Km = 5 μM, [I] = 2 μM, Ki = 3 μM, si calcoli la velocità a [S] = 5 μM. Senza inibitore: v = 10 × 5/(5 + 5) = 5,0 μM/s. Competitivo: Km,app = 5 × (1 + 2/3) = 8,33 μM, v = 10 × 5/(8,33 + 5) = 3,75 μM/s. Non competitivo puro: Vmax,app = 10/1,667 = 6,0 μM/s, v = 6,0 × 5/10 = 3,0 μM/s. Incompetitivo: Vmax,app = 6,0 μM/s, Km,app = 3,0 μM, v = 6,0 × 5/8,0 = 3,75 μM/s.",
      risultato: "v = 5,0 μM/s senza inibitore; 3,75 (competitivo), 3,0 (non competitivo), 3,75 μM/s (incompetitivo)"
    },
    fonti: [
      "L. Michaelis, M. L. Menten, Die Kinetik der Invertinwirkung, Biochemische Zeitschrift 49 (1913) 333–369; traduzione commentata in K. A. Johnson, R. S. Goody, Biochemistry 50 (2011) 8264–8269",
      "G. E. Briggs, J. B. S. Haldane, A note on the kinetics of enzyme action, Biochemical Journal 19 (1925) 338–339",
      "A. Cornish-Bowden, Fundamentals of Enzyme Kinetics, 4ª ed., Wiley-Blackwell, 2012",
      "D. L. Nelson, M. M. Cox, Lehninger Principles of Biochemistry, 7ª ed., W. H. Freeman, 2017, cap. «Enzymes»"
    ],
    collegamenti: ['skin', 'schicinet', 'smacro3d', 'sglic', 'sfarm']
  };

  /* ───────────────────────── ELETTROCHIMICA ───────────────────────── */
  T['snernst'] = {
    titolo: "Potenziali di elettrodo, equazione di Nernst e leggi di Faraday",
    sintesi: "Una reazione redox può essere separata in due semireazioni che avvengono in elettrodi distinti, e la differenza fra i loro potenziali misura la sua spinta termodinamica: ΔG = −nFE. I potenziali standard, riferiti all'elettrodo standard a idrogeno, si combinano per dare la forza elettromotrice di una cella e la costante di equilibrio; l'equazione di Nernst li corregge per concentrazioni non standard; le leggi di Faraday collegano la carica che passa alla quantità di sostanza trasformata.",
    paragrafi: [
      { titolo: "Potenziali standard di riduzione",
        testo: "Il potenziale di un singolo elettrodo non si può misurare in assoluto: si misura sempre la differenza rispetto a un riferimento, che per convenzione è l'elettrodo standard a idrogeno (SHE), con H⁺ ad attività unitaria e H₂ a 1 bar, cui si assegna E° = 0. Le tabelle riportano le semireazioni scritte come riduzioni: più E° è positivo, più la forma ossidata è un buon ossidante (F₂, MnO₄⁻ in ambiente acido); più è negativo, più la forma ridotta è un buon riducente (Li, K, Na). E° è una proprietà intensiva: moltiplicare la semireazione per due non cambia il potenziale, anche se raddoppia il ΔG°. Per la stessa ragione i potenziali di due semireazioni non si sommano direttamente per ottenere una terza semireazione: si sommano i ΔG°." },
      { titolo: "La cella e il segno di E",
        testo: "In una cella galvanica la riduzione avviene al catodo e l'ossidazione all'anodo, e la forza elettromotrice standard è E°cella = E°(catodo) − E°(anodo), entrambi presi dalla tabella come potenziali di riduzione, senza cambiare segno al secondo. Se E°cella è positivo, ΔG° = −nFE°cella è negativo e la reazione scritta è spontanea in condizioni standard; se è negativo, la reazione procede solo fornendo energia elettrica, come in una cella elettrolitica. La pila Daniell, Zn | Zn²⁺ ∥ Cu²⁺ | Cu, ha E° = 0,34 − (−0,76) = 1,10 V, il valore proposto per default dalla sezione. Dalla relazione fra ΔG° e K si ottiene la costante di equilibrio: per la Daniell K è dell'ordine di 10³⁷, cioè la reazione è praticamente completa." },
      { titolo: "L'equazione di Nernst",
        testo: "Fuori dalle condizioni standard il potenziale dipende dalle attività attraverso il quoziente di reazione Q: E = E° − (RT/nF) ln Q. A 25 °C RT/F vale 25,69 mV e, passando ai logaritmi decimali, il fattore diventa 0,05916/n V. Ogni variazione di Q di un fattore dieci sposta quindi il potenziale di circa 59 mV per un processo monoelettronico e di 30 mV per uno bielettronico. Quando la cella arriva all'equilibrio E = 0 e Q = K: l'equazione di Nernst contiene la relazione ΔG° = −RT ln K. Lo stesso principio spiega gli elettrodi indicatori, come l'elettrodo a vetro per il pH, e il potenziale di membrana dovuto a gradienti ionici." },
      { titolo: "Potenziali biochimici",
        testo: "Le coppie redox biologiche coinvolgono spesso protoni, e a pH 0 le condizioni standard non hanno senso fisiologico. I biochimici usano quindi il potenziale standard trasformato E°′, riferito a pH 7: per una semireazione con m protoni e n elettroni E°′ = E° − 0,05916·(m/n)·7 V a 25 °C. Per O₂/H₂O si passa da 1,229 V a 0,816 V. Nella tabella della sezione le coppie biochimiche (NAD⁺/NADH −0,32 V, piruvato/lattato −0,185 V, fumarato/succinato +0,031 V, citocromo c) sono valori E°′, mentre le coppie inorganiche sono E° a pH 0: confrontarle direttamente richiede attenzione, specialmente quando la semireazione consuma protoni." },
      { titolo: "Le leggi di Faraday",
        testo: "Nell'elettrolisi la quantità di sostanza trasformata a un elettrodo è proporzionale alla carica che lo attraversa, Q = I·t, e inversamente proporzionale al numero di elettroni scambiati per unità di formula. La costante di Faraday, F = 96 485 C/mol, è la carica di una mole di elettroni. La massa depositata è quindi m = I·t·M/(nF). Il calcolo presuppone un'efficienza di corrente del 100 %, cioè che tutta la carica serva alla reazione desiderata; nella pratica reazioni concorrenti, come lo sviluppo di idrogeno, riducono la resa." }
    ],
    formule: [
      ["ΔG = −n F E,  ΔG° = −n F E°", "relazione fra energia libera e forza elettromotrice; n elettroni scambiati, F = 96 485 C/mol, E in V, ΔG in J/mol"],
      ["E = E° − (RT/nF) ln Q = E° − (0,05916 V/n) log Q (25 °C)", "equazione di Nernst; Q quoziente di reazione con le attività, R = 8,314 J mol⁻¹ K⁻¹"],
      ["K = exp(nFE°/RT),  log K = nE°/0,05916 (25 °C)", "costante di equilibrio dalla forza elettromotrice standard"],
      ["m = I · t · M / (n F)", "leggi di Faraday: massa depositata con corrente I (A) per un tempo t (s), massa molare M (g/mol)"]
    ],
    ipotesi: [
      "L'equazione di Nernst con le concentrazioni al posto delle attività vale solo per soluzioni diluite; a forze ioniche elevate servono i coefficienti di attività.",
      "Le misure reali includono potenziali di giunzione liquida e, in presenza di corrente, sovratensioni e cadute ohmiche, che la teoria di equilibrio non descrive."
    ],
    errori: [
      "Moltiplicare E° per il coefficiente stechiometrico quando si moltiplica la semireazione: E° è intensivo, ΔG° no.",
      "Cambiare segno al potenziale dell'anodo e poi sottrarlo di nuovo, ottenendo E°cat + E°an: con i potenziali di riduzione tabulati si calcola semplicemente E°cat − E°an.",
      "Confrontare un E°′ biochimico a pH 7 con un E° a pH 0 come se fossero la stessa grandezza."
    ],
    esempio: {
      testo: "Pila Daniell a 25 °C con [Zn²⁺] = 1,0 M e [Cu²⁺] = 0,010 M. Reazione: Zn + Cu²⁺ → Zn²⁺ + Cu, n = 2, Q = [Zn²⁺]/[Cu²⁺] = 100. E = 1,10 − (0,05916/2)·log 100 = 1,10 − 0,059 = 1,041 V. ΔG = −2 × 96 485 × 1,041 = −201 kJ/mol. K = 10^(2 × 1,10/0,05916) = 10^37,2 ≈ 1,5·10³⁷. Con la stessa cella usata come elettrolizzatore, 2,0 A per 3600 s depositano m = 2,0 × 3600 × 63,5/(2 × 96 485) = 2,37 g di rame.",
      risultato: "E = 1,041 V, ΔG ≈ −201 kJ/mol, K ≈ 1,5·10³⁷; 2,37 g di Cu per 2 A·h"
    },
    fonti: [
      "A. J. Bard, L. R. Faulkner, Electrochemical Methods: Fundamentals and Applications, 2ª ed., Wiley, 2001, cap. 2 «Potentials and Thermodynamics of Cells»",
      "D. C. Harris, Quantitative Chemical Analysis, 9ª ed., W. H. Freeman, 2015, capitoli «Fundamentals of Electrochemistry» ed «Electrodes and Potentiometry»",
      "P. Atkins, J. de Paula, J. Keeler, Atkins' Physical Chemistry, 11ª ed., Oxford University Press, 2018, Focus 6 «Chemical equilibrium», topic sulle celle elettrochimiche e i potenziali di elettrodo",
      "D. L. Nelson, M. M. Cox, Lehninger Principles of Biochemistry, 7ª ed., W. H. Freeman, 2017, cap. «Bioenergetics and Biochemical Reaction Types» (potenziali standard di riduzione biologici)"
    ],
    collegamenti: ['selettrodi', 'schivolt', 'setc', 'spka', 'schiequil']
  };

  /* ───────────────────────── VSEPR ───────────────────────── */
  T['svsepr'] = {
    titolo: "Il modello VSEPR: prevedere la geometria dalle coppie elettroniche",
    sintesi: "Il modello VSEPR (repulsione fra le coppie elettroniche del guscio di valenza) prevede la forma di una molecola AXₙEₘ contando i domini elettronici intorno all'atomo centrale: legami, ognuno conteggiato una volta anche se multiplo, e coppie solitarie. I domini si dispongono il più lontano possibile fra loro; la geometria molecolare descrive poi solo la posizione degli atomi, e le coppie solitarie, più ingombranti, comprimono gli angoli di legame.",
    paragrafi: [
      { titolo: "Contare i domini",
        testo: "Si parte dalla struttura di Lewis e si conta il numero sterico dell'atomo centrale, cioè il numero di atomi legati X più il numero di coppie solitarie E. Un doppio o triplo legame occupa una sola direzione e conta come un dominio. Le coppie solitarie si ricavano dagli elettroni di valenza dell'atomo centrale: si sottraggono quelli impegnati nei legami e si tiene conto della carica dello ione, poi si divide per due. Il numero sterico decide la disposizione dei domini: 2 lineare, 3 trigonale planare, 4 tetraedrica, 5 bipiramidale trigonale, 6 ottaedrica. Il predittore della sezione richiede proprio X ed E e restituisce la forma AXₙEₘ corrispondente." },
      { titolo: "Dalla disposizione dei domini alla forma della molecola",
        testo: "La forma molecolare si nomina guardando solo i nuclei. Con quattro domini e nessuna coppia solitaria si ha un tetraedro regolare, con angoli di 109,47°; con una coppia solitaria la molecola è una piramide trigonale (NH₃); con due è angolata (H₂O). Con cinque domini la bipiramide trigonale ha due tipi di posizioni non equivalenti, assiali ed equatoriali: le coppie solitarie vanno in posizione equatoriale, dove hanno solo due vicini a 90° invece di tre, e si ottengono via via altalena (SF₄), forma a T (ClF₃) e geometria lineare (XeF₂, I₃⁻). Con sei domini una coppia solitaria dà la piramide a base quadrata (BrF₅), due coppie, opposte fra loro, il quadrato planare (XeF₄)." },
      { titolo: "Perché gli angoli si chiudono",
        testo: "Una coppia solitaria è attratta da un solo nucleo e occupa più spazio vicino all'atomo centrale di una coppia di legame, che è condivisa fra due nuclei. L'ordine delle repulsioni è quindi coppia solitaria–coppia solitaria > coppia solitaria–coppia di legame > coppia di legame–coppia di legame. Gli angoli si chiudono di conseguenza: 109,5° in CH₄, circa 107° in NH₃, 104,5° in H₂O. Per motivi analoghi un doppio legame, più ricco di elettroni, allarga gli angoli che lo coinvolgono, e i ligandi molto elettronegativi, che attirano la densità di legame lontano dall'atomo centrale, li stringono: l'angolo F–N–F in NF₃ è minore dell'angolo H–N–H in NH₃." },
      { titolo: "Limiti del modello e ibridazione",
        testo: "Il VSEPR è un modello qualitativo, non una teoria quantitativa. Funziona molto bene per i composti dei gruppi principali, ma non per i complessi dei metalli di transizione, dove contano gli elettroni d e il campo dei leganti, e prevede male gli angoli degli idruri pesanti, come H₂S (circa 92°) e PH₃ (circa 93,5°), molto più vicini a 90° che all'angolo tetraedrico. Anche le etichette di ibridazione riportate nella tabella vanno lette come descrizioni geometriche: per le molecole ipervalenti come PCl₅ o SF₆ i calcoli mostrano che gli orbitali d contribuiscono pochissimo al legame, e una descrizione migliore usa legami a tre centri e quattro elettroni con forte carattere ionico. La geometria prevista dal VSEPR resta corretta, ma la spiegazione «sp³d» o «sp³d²» non lo è." }
    ],
    formule: [
      ["NS = X + E", "numero sterico: atomi legati all'atomo centrale più coppie solitarie; un legame multiplo conta come un solo dominio"],
      ["E = (V − b − q) / 2", "coppie solitarie sull'atomo centrale: V elettroni di valenza dell'atomo centrale, b elettroni che esso impiega nei legami (1 per legame singolo, 2 per doppio), q carica dello ione con il suo segno"],
      ["θ(tetraedro) = arccos(−1/3) = 109,47°", "angolo fra due vertici di un tetraedro regolare visti dal centro"]
    ],
    ipotesi: [
      "Il modello assume che i domini siano equivalenti a cariche puntiformi o nuvole che si respingono su una sfera; ignora l'energia degli orbitali e gli effetti relativistici degli elementi pesanti.",
      "Le previsioni riguardano molecole isolate, come in fase gassosa; nei solidi le geometrie possono essere distorte dall'impacchettamento."
    ],
    errori: [
      "Contare un doppio legame come due domini: occupa una sola direzione.",
      "Nominare la forma dalla disposizione dei domini: l'acqua ha domini tetraedrici ma forma angolata.",
      "Mettere le coppie solitarie in posizione assiale nella bipiramide trigonale: si dispongono in posizione equatoriale.",
      "Considerare l'ibridazione la causa della geometria: è una descrizione costruita a posteriori, e per le specie ipervalenti quella con orbitali d è fisicamente inadeguata."
    ],
    esempio: {
      testo: "Si preveda la forma di ICl₄⁻ e di I₃⁻. Per ICl₄⁻: V = 7, quattro legami singoli b = 4, q = −1, quindi E = (7 − 4 + 1)/2 = 2; numero sterico 6, AX₄E₂, coppie solitarie opposte: quadrato planare con angoli Cl–I–Cl di 90°. Per I₃⁻ l'atomo centrale ha V = 7, due legami b = 2, q = −1: E = (7 − 2 + 1)/2 = 3; numero sterico 5, AX₂E₃, le tre coppie solitarie occupano le posizioni equatoriali: molecola lineare.",
      risultato: "ICl₄⁻: AX₄E₂, quadrato planare (90°); I₃⁻: AX₂E₃, lineare (180°)"
    },
    fonti: [
      "R. J. Gillespie, R. S. Nyholm, Inorganic stereochemistry, Quarterly Reviews of the Chemical Society 11 (1957) 339–380",
      "R. J. Gillespie, I. Hargittai, The VSEPR Model of Molecular Geometry, Allyn and Bacon, 1991",
      "R. J. Gillespie, Fifty years of the VSEPR model, Coordination Chemistry Reviews 252 (2008) 1315–1327",
      "G. L. Miessler, P. J. Fischer, D. A. Tarr, Inorganic Chemistry, 5ª ed., Pearson, 2014, cap. 3 «Simple Bonding Theory»"
    ],
    collegamenti: ['smo', 'ssimm', 'smorb', 'sinorg']
  };

  /* ───────────────────────── SIMMETRIA ───────────────────────── */
  T['ssimm'] = {
    titolo: "Simmetria molecolare, tavole dei caratteri e regole di selezione IR e Raman",
    sintesi: "Le operazioni di simmetria che lasciano invariata una molecola formano un gruppo puntuale. Le tavole dei caratteri del gruppo classificano funzioni d'onda, orbitali e vibrazioni in rappresentazioni irriducibili, e da questa classificazione seguono senza calcoli quantitativi le regole di selezione: quali modi normali sono attivi in IR, quali in Raman, se la molecola può avere un momento di dipolo o essere chirale.",
    paragrafi: [
      { titolo: "Elementi e operazioni di simmetria",
        testo: "Gli elementi di simmetria di una molecola sono l'identità E, gli assi di rotazione propria Cₙ (rotazione di 360°/n), i piani di riflessione σ, distinti in σᵥ verticali (che contengono l'asse principale), σₕ orizzontale (perpendicolare all'asse) e σd diedri, il centro di inversione i e gli assi di rotazione impropria Sₙ, cioè una rotazione Cₙ seguita da una riflessione nel piano perpendicolare. S₁ coincide con un piano e S₂ con il centro di inversione. L'insieme delle operazioni di una molecola soddisfa gli assiomi di gruppo e, poiché tutti gli elementi passano per un punto fisso, si parla di gruppo puntuale. Le notazioni sono quelle di Schoenflies: C₂ᵥ per l'acqua, C₃ᵥ per l'ammoniaca, D₃ₕ per BF₃, Td per il metano, Oₕ per SF₆, D∞ₕ per CO₂." },
      { titolo: "Determinare il gruppo puntuale",
        testo: "L'albero decisionale della sezione segue l'ordine consueto. Prima si controlla se la molecola è lineare (C∞ᵥ o D∞ₕ, secondo che manchi o ci sia il centro di inversione), poi se ha più assi Cₙ con n > 2 (gruppi cubici Td, Oₕ, Iₕ). In caso contrario si cerca l'asse principale di ordine massimo; se non c'è alcun asse si conclude con Cₛ, Cᵢ o C₁. Se ci sono n assi C₂ perpendicolari all'asse principale la molecola appartiene alla famiglia D, altrimenti alla famiglia C, e i piani di simmetria presenti completano l'identificazione. Gli errori più frequenti nascono dal non vedere gli assi C₂ perpendicolari e dal confondere piani verticali e diedri." },
      { titolo: "Tavole dei caratteri e modi normali",
        testo: "Ogni riga di una tavola dei caratteri è una rappresentazione irriducibile, o specie di simmetria: per le specie non degeneri il carattere +1 o −1 dice se una funzione resta uguale o cambia segno sotto l'operazione; le specie E e T sono doppiamente e triplamente degeneri. Una molecola di N atomi ha 3N gradi di libertà; tolti 3 di traslazione e 3 di rotazione (2 per le molecole lineari) restano 3N − 6 modi normali di vibrazione (3N − 5 se lineare). Per classificarli si costruisce la rappresentazione riducibile degli spostamenti cartesiani, il cui carattere per ogni operazione è il numero di atomi che restano fermi moltiplicato per il contributo di ciascuno (3 per E, −1 per C₂, +1 per un piano σ, −3 per i); la si scompone con la formula di riduzione e si sottraggono traslazioni e rotazioni, lette nelle colonne x, y, z e Rx, Ry, Rz." },
      { titolo: "Regole di selezione",
        testo: "Una transizione vibrazionale fondamentale è permessa in IR se il modo appartiene alla stessa specie di x, y o z, perché l'intensità dipende dalla variazione del momento di dipolo, che si trasforma come un vettore. È permessa in Raman se il modo appartiene alla stessa specie di una delle funzioni quadratiche x², y², z², xy, xz, yz, perché conta la variazione della polarizzabilità, un tensore. Nelle molecole con centro di inversione x, y e z sono di tipo u e le funzioni quadratiche di tipo g: nessun modo può essere attivo in entrambe le tecniche, ed è la regola di esclusione mutua. La simmetria dice anche che un momento di dipolo permanente è possibile solo nei gruppi C₁, Cₛ, Cₙ e Cₙᵥ, e che una molecola è chirale solo se non possiede alcun asse Sₙ." }
    ],
    formule: [
      ["nᵢ = (1/h) Σ_R g(R) · χ(R) · χᵢ(R)", "formula di riduzione: numero di volte che la specie i compare nella rappresentazione riducibile; h ordine del gruppo, g(R) numero di operazioni della classe R, χ caratteri (reali)"],
      ["modi normali = 3N − 6 (non lineari), 3N − 5 (lineari)", "numero di vibrazioni fondamentali di una molecola di N atomi"],
      ["χ(R) = n_fermi(R) · (±1 + 2 cos θ)", "carattere degli spostamenti cartesiani: atomi non spostati dall'operazione per il contributo di ciascuno; + per rotazioni proprie, − per improprie (θ angolo di rotazione)"]
    ],
    ipotesi: [
      "Le regole di selezione riguardano le transizioni fondamentali nell'approssimazione armonica; sovratoni, bande di combinazione e risonanze di Fermi possono far comparire bande «proibite» deboli.",
      "Una banda permessa dalla simmetria può avere intensità troppo bassa per essere osservata: la teoria dei gruppi dice che cosa è possibile, non quanto è intenso.",
      "Le etichette B₁ e B₂ in C₂ᵥ dipendono da quale piano si sceglie come xz: manuali diversi usano convenzioni diverse per la stessa molecola."
    ],
    errori: [
      "Applicare la regola di esclusione mutua a molecole senza centro di inversione: in H₂O o CH₄ un modo può essere attivo sia in IR sia in Raman.",
      "Scambiare Sₙ con «Cₙ più un piano qualsiasi»: la riflessione deve avvenire nel piano perpendicolare all'asse di rotazione.",
      "Usare 3N − 6 per una molecola lineare come CO₂, che ha 3N − 5 = 4 modi, di cui due degeneri.",
      "Concludere che una molecola con legami polari ha momento di dipolo: in CO₂ e CH₄ la simmetria annulla la somma dei dipoli di legame."
    ],
    esempio: {
      testo: "Si classifichino le vibrazioni di H₂O (C₂ᵥ, h = 4) con la molecola nel piano xz. Atomi fermi: E 3, C₂ 1, σᵥ(xz) 3, σᵥ′(yz) 1; contributi per atomo 3, −1, 1, 1; quindi Γ₃N = 9, −1, 3, 1. Riduzione: A₁ = (9 − 1 + 3 + 1)/4 = 3; A₂ = (9 − 1 − 3 − 1)/4 = 1; B₁ = (9 + 1 + 3 − 1)/4 = 3; B₂ = (9 + 1 − 3 + 1)/4 = 2. Traslazioni A₁ + B₁ + B₂, rotazioni A₂ + B₁ + B₂. Restano Γvib = 2A₁ + B₁, cioè 3 = 3N − 6 modi: stiramento simmetrico e piegamento (A₁), stiramento asimmetrico (B₁), tutti attivi in IR e in Raman.",
      risultato: "Γvib(H₂O) = 2A₁ + B₁; in fase gassosa circa 3657, 1595 e 3756 cm⁻¹, tutti IR e Raman attivi"
    },
    fonti: [
      "F. A. Cotton, Chemical Applications of Group Theory, 3ª ed., Wiley, 1990, capitoli sui gruppi puntuali, sulle tavole dei caratteri e sulle vibrazioni molecolari",
      "D. C. Harris, M. D. Bertolucci, Symmetry and Spectroscopy: An Introduction to Vibrational and Electronic Spectroscopy, Oxford University Press, 1978 (rist. Dover, 1989)",
      "P. Atkins, J. de Paula, J. Keeler, Atkins' Physical Chemistry, 11ª ed., Oxford University Press, 2018, Focus 10 «Molecular symmetry»",
      "C. E. Housecroft, A. G. Sharpe, Inorganic Chemistry, 5ª ed., Pearson, 2018, cap. 3 «Introduction to molecular symmetry»"
    ],
    collegamenti: ['sirvis', 'svsepr', 'smo', 'srotovib', 'sspec']
  };
})(typeof window !== 'undefined' ? window : globalThis);
