/* ═══════════════════════════════════════════════════════════════════════════
   bsi-articoli-nobel — le spiegazioni dei Nobel per la chimica

   PERCHE' QUESTO FILE CONTIENE SOLO SPIEGAZIONI E NESSUN DATO

   Qui dentro non c'e' un solo anno, non c'e' un solo nome di premiato, non
   c'e' una sola motivazione ufficiale. E' una scelta, ed e' la piu'
   importante di tutto il modulo.

   Anni, premiati e motivazioni arrivano dall'API della Fondazione Nobel, in
   diretta, nel browser di chi legge. Se li avessi scritti io a memoria,
   nessuno avrebbe potuto distinguere un anno giusto da un anno sbagliato: un
   errore di attribuzione non si vede, sta li' e sembra un dato.

   E le spiegazioni non sono legate a un ANNO: sono legate a un ARGOMENTO.
   Ogni voce dichiara un'espressione regolare che si confronta con la
   motivazione ufficiale. Se la motivazione del premio parla di «click
   chemistry», compare la spiegazione della click chemistry — a qualunque
   anno appartenga quel premio. Cosi' non posso sbagliare un'attribuzione
   nemmeno volendo: non ne faccio nessuna.

   Se per un premio nessun argomento combacia, non si inventa niente: si
   mostra la motivazione ufficiale, i premiati e i materiali della
   Fondazione, e si dice che la spiegazione non c'e'.

   QUANTO COPRE

   Le voci coprono ormai praticamente ogni argomento premiato, dai primi
   premi ai piu' recenti: ogni motivazione ufficiale dovrebbe trovare una
   spiegazione SPECIFICA, non una generica. Le poche voci generiche
   (sintesi organica, enzimi, sequenze, conformazione) stanno in fondo,
   proprio perche' altrimenti vincerebbero su quelle specifiche.

   LA REGOLA CHE OGNI VOCE DEVE RISPETTARE

   Niente nomi di persona nel testo, nemmeno dentro un eponimo: una
   reazione si descrive, non si intitola. Il nome del premiato lo dice
   l'API. Un nome scritto qui sarebbe un'attribuzione, e le attribuzioni
   non si scrivono a memoria. `tools/banchi/test_articoli.js` lo verifica.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';

  /* Ogni voce:
       re   espressione regolare confrontata con la motivazione ufficiale
            (in inglese: la motivazione ufficiale e' in inglese)
       tit  il titolo dell'argomento, in italiano
       sp   la spiegazione
     L'ordine conta: vince la PRIMA che combacia, quindi le voci specifiche
     stanno prima di quelle generiche. */
  var ARGOMENTI = [

    /* ── Legame, struttura, teoria ─────────────────────────────────────── */
    { re: /molecular orbital method/i,
      tit: 'Gli orbitali molecolari',
      sp: 'Invece di pensare la molecola come atomi uniti da coppie di elettroni ' +
          'localizzate fra due nuclei, si fanno muovere gli elettroni in ' +
          '<b>orbitali molecolari</b> che si estendono su tutta la molecola, ' +
          'costruiti come combinazioni lineari degli orbitali atomici. Dalla ' +
          'combinazione in fase nasce un orbitale <b>legante</b>, da quella in ' +
          'opposizione di fase uno antilegante; l\'ordine di legame è la metà della ' +
          'differenza fra elettroni leganti e antileganti. Il caso che convince è ' +
          'l\'ossigeno: O₂ ha due elettroni spaiati negli orbitali π*, e infatti è ' +
          'paramagnetico e viene attratto da un magnete, cosa che lo schema a ' +
          'coppie localizzate non prevede. È il linguaggio in cui oggi si calcolano ' +
          'energie di ionizzazione, spettri elettronici e reattività.' },

    { re: /geometry of molecules|free radicals/i,
      tit: 'Spettroscopia molecolare e radicali liberi',
      sp: 'Uno spettro elettronico registrato ad alta risoluzione non è una banda ' +
          'confusa: è fatto di migliaia di righe, perché ogni transizione ' +
          'elettronica si accompagna a cambiamenti dello stato di vibrazione e di ' +
          'rotazione. La spaziatura delle righe rotazionali dà il <b>momento ' +
          'd\'inerzia</b>, e quindi lunghezze e angoli di legame, sia nello stato ' +
          'fondamentale sia in quello eccitato. Applicato a specie che vivono ' +
          'frazioni di secondo — i <b>radicali liberi</b> generati con un lampo di ' +
          'luce, come CH, CH₂ e CH₃ — il metodo ne fissa la geometria: il radicale ' +
          'metile, per esempio, è planare. Le stesse righe hanno permesso di ' +
          'riconoscere molecole e radicali nelle comete e nello spazio ' +
          'interstellare.' },

    { re: /dipole moments?|diffraction of x.?rays and electrons in gases/i,
      tit: 'Momenti dipolari e diffrazione nei gas',
      sp: 'Una molecola in cui i baricentri della carica positiva e di quella ' +
          'negativa non coincidono ha un <b>momento dipolare</b> permanente, e in ' +
          'un campo elettrico tende a orientarsi. Misurando la costante dielettrica ' +
          'di un gas a temperature diverse si separa il contributo ' +
          'dell\'orientamento, che diminuisce come 1/T perché l\'agitazione termica ' +
          'lo disturba, da quello della deformazione, che non dipende dalla ' +
          'temperatura. Il valore del dipolo diventa un\'informazione ' +
          '<b>geometrica</b>: CO₂ ha dipolo nullo, quindi è lineare; H₂O no, quindi ' +
          'è piegata; il para-diclorobenzene è apolare, l\'orto no. La diffrazione ' +
          'di raggi X e di elettroni da parte di molecole libere in fase gassosa ' +
          'completa il quadro con le distanze fra gli atomi.' },

    { re: /nature of the chemical bond|chemical bond and its application to the elucidation/i,
      tit: 'La natura del legame chimico',
      sp: 'Prima, il legame chimico era una linea tirata fra due simboli. Qui ' +
          'diventa un oggetto con una forma e un\'energia, descritto dalla meccanica ' +
          'quantistica: gli orbitali atomici si <b>ibridano</b> (sp, sp², sp³) e da ' +
          'quell\'ibridazione esce la geometria vera delle molecole — perché il ' +
          'metano è tetraedrico e non piatto. Arrivano la <b>risonanza</b>, che ' +
          'spiega perché il benzene non ha legami lunghi e corti alternati ma sei ' +
          'legami uguali, e l\'<b>elettronegatività</b> come scala con cui prevedere ' +
          'la polarità. È la base di tutto quello che in questa applicazione si ' +
          'chiama «struttura».' },

    { re: /theory of chemical reactivity|course of chemical reactions|frontier orbital|orbital symmetry|woodward.?hoffmann/i,
      tit: 'Gli orbitali di frontiera e la simmetria nelle reazioni',
      sp: 'Due molecole che si incontrano reagiscono o no a seconda di come sono ' +
          'fatti i loro orbitali più esterni: l\'<b>HOMO</b> (il più alto occupato) ' +
          'di una e il <b>LUMO</b> (il più basso vuoto) dell\'altra. Se hanno la ' +
          'simmetria giusta e un\'energia vicina, si sovrappongono e la reazione va; ' +
          'se no, non va — per ragioni di <b>simmetria</b>, non di temperatura. Da ' +
          'qui le regole che dicono in anticipo se una cicloaddizione è permessa ' +
          'termicamente o solo per via fotochimica, e in quale senso una molecola ' +
          'si chiude ad anello. Una previsione, non una classificazione a ' +
          'posteriori.' },

    { re: /computational methods in quantum chemistry/i,
      tit: 'Metodi di calcolo della chimica quantistica',
      sp: 'L\'idea centrale è trasformare la chimica quantistica in uno strumento ' +
          'che chiunque possa usare in modo <b>riproducibile</b>. Si definisce una ' +
          'gerarchia di approssimazioni — dal campo medio, in cui ogni elettrone ' +
          'sente la media degli altri, a trattamenti sempre più completi della ' +
          '<b>correlazione elettronica</b> — e una serie standard di insiemi di ' +
          'funzioni di base con cui descrivere gli orbitali. Ogni combinazione è un ' +
          '«modello chimico» che si applica allo stesso modo a tutte le molecole e ' +
          'di cui si conosce l\'errore tipico. Distribuito in programmi di uso ' +
          'generale, questo approccio permette di calcolare geometrie, frequenze di ' +
          'vibrazione, energie di reazione e spettri NMR prima ancora di entrare in ' +
          'laboratorio.' },

    { re: /density.?functional|quantum chemical.*density|computational methods in quantum chemistry/i,
      tit: 'La teoria del funzionale della densità',
      sp: 'Risolvere l\'equazione d\'onda della meccanica quantistica per una ' +
          'molecola vera è impossibile: le variabili crescono come il numero di ' +
          'elettroni, e già con una decina si esce da qualunque calcolatore. L\'idea ' +
          'che cambia tutto è che <b>non serve la funzione d\'onda</b>: basta la ' +
          '<b>densità elettronica</b>, cioè quanta carica c\'è in ogni punto dello ' +
          'spazio — tre variabili invece di tre per ogni elettrone. L\'energia dello ' +
          'stato fondamentale è un <i>funzionale</i> di quella densità. È il metodo ' +
          'con cui oggi si calcolano geometrie, energie di reazione e spettri di ' +
          'molecole che nessun metodo esatto potrebbe toccare.' },

    { re: /multiscale models for complex chemical systems/i,
      tit: 'Modelli a più scale: quanto-classico insieme',
      sp: 'Un enzima ha decine di migliaia di atomi: trattarli tutti con la ' +
          'meccanica quantistica è fuori portata, trattarli tutti con la meccanica ' +
          'classica non descrive la rottura dei legami — che è esattamente il ' +
          'punto. La soluzione è <b>cucire i due mondi</b>: il sito attivo, dove i ' +
          'legami si fanno e si rompono, in meccanica quantistica; tutto il resto ' +
          'della proteina e il solvente in meccanica classica, come molle e sfere. ' +
          'Il mestiere sta nel <b>confine</b>: come passare le forze da una ' +
          'descrizione all\'altra senza creare artefatti. È così che oggi si studia ' +
          'un meccanismo enzimatico al calcolatore.' },

    { re: /protein structure prediction|predict\w* (the )?(three.?dimensional )?structures? of proteins/i,
      tit: 'Prevedere la struttura delle proteine con l\'apprendimento automatico',
      sp: 'Dalla sequenza di amminoacidi alla forma tridimensionale: per decenni si ' +
          'è tentato di arrivarci simulando la fisica del ripiegamento, con ' +
          'risultati modesti. La svolta viene da una <b>rete neurale</b> addestrata ' +
          'sulle strutture già determinate sperimentalmente e sugli allineamenti di ' +
          'sequenze omologhe: due residui che nell\'evoluzione mutano insieme sono ' +
          'probabilmente a contatto, e la rete impara a tradurre questi segnali di ' +
          '<b>coevoluzione</b> in distanze e poi in coordinate atomiche, con una ' +
          'stima di affidabilità per ogni residuo. Nelle valutazioni alla cieca le ' +
          'previsioni hanno raggiunto spesso l\'accuratezza di un esperimento, e ' +
          'sono state calcolate le strutture di centinaia di milioni di proteine ' +
          'note.' },

    { re: /computational protein design|protein structure prediction/i,
      tit: 'Prevedere e progettare la struttura delle proteine',
      sp: 'Una proteina è una catena di amminoacidi che si avvolge in <b>una</b> ' +
          'forma precisa, e la forma è la funzione. Dalla sequenza alla forma c\'è ' +
          'un salto che ha resistito cinquant\'anni: il numero di conformazioni ' +
          'possibili è astronomico. Due risultati lo chiudono da due lati opposti — ' +
          'la <b>previsione</b>, che dalla sequenza arriva alla struttura con ' +
          'l\'accuratezza di un esperimento, e il <b>progetto</b>, che fa il ' +
          'percorso inverso: si decide la forma che serve e si calcola una sequenza ' +
          'che la assuma, producendo proteine che in natura non esistono.' },

    { re: /electron transfer reactions,? especially in metal complexes|electron transfer.*metal complexes/i,
      tit: 'Trasferimento di elettroni nei complessi metallici',
      sp: 'Quando uno ione metallico ne riduce un altro, l\'elettrone può passare in ' +
          'due modi. Nel meccanismo a <b>sfera esterna</b> i due complessi restano ' +
          'intatti e l\'elettrone salta attraverso i loro gusci di leganti. Nel ' +
          'meccanismo a <b>sfera interna</b> un legante fa da ponte: il complesso ' +
          'di cobalto(III) con un cloruro coordinato reagisce con il cromo(II), e ' +
          'il cloruro si ritrova legato al cromo(III) nel prodotto — la prova che ' +
          'l\'elettrone è passato attraverso un ponte Co–Cl–Cr. L\'esperimento ' +
          'funziona perché cromo(III) e cobalto(III) scambiano i leganti ' +
          'lentissimamente, mentre il cromo(II) li scambia in fretta: la ' +
          'distinzione fra complessi inerti e labili diventa uno strumento per ' +
          'leggere i meccanismi di reazione.' },

    { re: /theory of.*electron transfer|electron transfer reactions in chemical systems/i,
      tit: 'Il trasferimento di elettroni',
      sp: 'Quando un elettrone salta da una molecola a un\'altra non succede quasi ' +
          'nulla di meccanico: l\'elettrone è leggerissimo e si muove in un istante. ' +
          'Il costo sta nel <b>solvente</b> e nei legami intorno, che devono ' +
          'riorganizzarsi perché la nuova distribuzione di carica sia stabile. La ' +
          'teoria mette questo costo in una formula con due pezzi — l\'energia ' +
          'libera della reazione e un\'<b>energia di riorganizzazione</b> — e ne ' +
          'esce una previsione contro l\'intuizione: oltre un certo punto, <b>più la ' +
          'reazione è favorevole più diventa lenta</b> (la regione invertita). Fu ' +
          'misurata anni dopo, e c\'era.' },

    { re: /femtosecond spectroscopy|transition states of chemical reactions using/i,
      tit: 'Femtochimica: vedere la reazione mentre avviene',
      sp: 'Lo stato di transizione — la configurazione in cima alla barriera, dove ' +
          'il legame vecchio non c\'è più e quello nuovo non c\'è ancora — era un ' +
          'oggetto teorico: dura <b>decine di femtosecondi</b> (10⁻¹⁵ s), e nessuno ' +
          'strumento era abbastanza rapido. Con impulsi laser di quella durata si ' +
          'fa una cosa semplice da dire: un impulso avvia la reazione, un secondo ' +
          'impulso ritardato di poche decine di femtosecondi la fotografa. ' +
          'Cambiando il ritardo si ottiene il <b>film</b> della reazione, ' +
          'fotogramma per fotogramma, e la teoria dello stato di transizione ' +
          'diventa una cosa che si guarda.' },

    { re: /dynamics of chemical elementary processes|crossed molecular beam|reaction dynamics/i,
      tit: 'Dinamica delle reazioni elementari',
      sp: 'In una provetta una reazione è una media su un numero enorme di urti ' +
          'diversi. Per capire il <b>singolo</b> urto servono due fasci di molecole ' +
          'che si incrociano nel vuoto, con velocità e orientamento scelti: si ' +
          'misura dove vanno i prodotti, con quanta energia e con quale ' +
          'distribuzione angolare. Da lì si ricostruisce la <b>superficie di ' +
          'energia potenziale</b> — il paesaggio su cui la reazione si muove — e si ' +
          'scopre che conta anche <i>da che parte</i> le molecole si urtano. La ' +
          'chimica passa da «quanto velocemente» a «come, esattamente».' },

    { re: /mechanism of chemical reactions|branched chain reactions/i,
      tit: 'Il meccanismo delle reazioni: le reazioni a catena',
      sp: 'Molte reazioni in fase gassosa non avvengono per urto diretto fra i ' +
          'reagenti, ma attraverso una <b>catena</b> di passaggi portata da ' +
          'radicali. Un radicale si forma (inizio), reagisce con una molecola ' +
          'generandone un altro (propagazione), e la catena continua finché due ' +
          'radicali si incontrano o un radicale si spegne sulle pareti ' +
          '(terminazione). Se un passaggio produce <b>due</b> radicali al posto di ' +
          'uno, la catena si ramifica e la velocità cresce in modo esplosivo: è ciò ' +
          'che spiega perché una miscela di idrogeno e ossigeno esplode solo entro ' +
          'certi limiti di pressione e temperatura. Da qui la comprensione della ' +
          'combustione, dell\'ossidazione degli idrocarburi e delle polimerizzazioni ' +
          'radicaliche.' },

    { re: /fast chemical reactions|relaxation|very fast chemical reactions/i,
      tit: 'Le reazioni veloci, misurate',
      sp: 'Molte reazioni in soluzione finiscono in microsecondi o meno: mescolare ' +
          'due soluzioni richiede più tempo di quanto la reazione ne duri, quindi ' +
          'non si può cronometrare. Il trucco è non mescolare niente: si parte da ' +
          'un sistema <b>già all\'equilibrio</b> e lo si spinge fuori di colpo — con ' +
          'un salto di temperatura, di pressione o un impulso elettrico — e si ' +
          'guarda quanto tempo mette a tornarci. Quel <b>rilassamento</b> dà le ' +
          'costanti di velocità dei singoli passaggi. Con metodi affini, un lampo ' +
          'di luce genera in un istante specie reattive che non si potrebbero ' +
          'preparare altrimenti.' },

    { re: /reciprocal relations|thermodynamics of irreversible processes/i,
      tit: 'Le relazioni di reciprocità nei processi irreversibili',
      sp: 'Vicino all\'equilibrio ogni flusso — di calore, di materia, di carica — è ' +
          'proporzionale alle «forze» che lo provocano, cioè ai gradienti di ' +
          'temperatura, di concentrazione, di potenziale. Ma un flusso può essere ' +
          'spinto anche da una forza «altrui»: un gradiente di temperatura produce ' +
          'un flusso di materia (termodiffusione), uno di concentrazione un flusso ' +
          'di calore. Scrivendo Jᵢ = Σ Lᵢⱼ Xⱼ, il risultato è che i coefficienti ' +
          'incrociati sono <b>uguali</b>: Lᵢⱼ = Lⱼᵢ. La simmetria discende dalla ' +
          '<b>reversibilità microscopica</b> delle leggi del moto molecolare, e ' +
          'riduce il numero di coefficienti da misurare. È il fondamento della ' +
          'termodinamica dei processi irreversibili lineari, dai fenomeni ' +
          'termoelettrici al trasporto attraverso le membrane.' },

    { re: /irreversible thermodynamics|dissipative structure|non.?equilibrium thermodynamics/i,
      tit: 'Termodinamica dei processi irreversibili',
      sp: 'La termodinamica classica descrive gli stati di equilibrio, dove non ' +
          'succede niente. Ma un essere vivente, una fiamma e una reazione ' +
          'oscillante non sono all\'equilibrio: attraversano un flusso continuo di ' +
          'materia ed energia. Lontano dall\'equilibrio un sistema può ' +
          '<b>organizzarsi da sé</b> in strutture ordinate — onde chimiche, ritmi, ' +
          'modelli spaziali — che si mantengono proprio perché dissipano energia. ' +
          'L\'ordine non contraddice il secondo principio: lo paga, esportando ' +
          'entropia verso l\'esterno.' },

    { re: /thermochemistry|heat theorem|third law of thermodynamics/i,
      tit: 'Termochimica e terzo principio',
      sp: 'Per sapere fin dove arriva una reazione serve l\'energia libera, ΔG = ΔH ' +
          '− TΔS, e il calore di reazione ΔH si misura facilmente con un ' +
          'calorimetro. L\'entropia no: senza un punto di riferimento resta ' +
          'un\'incognita, e la costante di equilibrio non si può calcolare dai soli ' +
          'dati termici. Il risultato decisivo è che, avvicinandosi allo <b>zero ' +
          'assoluto</b>, la variazione di entropia di una reazione fra solidi ' +
          'cristallini tende a zero. Con questo punto fermo — il <b>terzo ' +
          'principio</b> della termodinamica — le entropie si ottengono integrando ' +
          'le capacità termiche misurate fino a bassa temperatura, e dalle tabelle ' +
          'di dati calorimetrici si possono prevedere gli equilibri chimici, ' +
          'comprese le condizioni della sintesi dell\'ammoniaca.' },

    { re: /extremely low temperatures|field of chemical thermodynamics/i,
      tit: 'Termodinamica chimica a temperature bassissime',
      sp: 'Per verificare il terzo principio bisogna misurare le capacità termiche ' +
          'il più vicino possibile allo zero assoluto. Si scende sotto un grado con ' +
          'la <b>smagnetizzazione adiabatica</b>: un sale paramagnetico viene ' +
          'magnetizzato a bassa temperatura, il calore prodotto viene sottratto, ' +
          'poi il campo viene tolto in isolamento termico e gli spin, ' +
          'disordinandosi, assorbono energia dal reticolo raffreddandolo. Con le ' +
          'capacità termiche misurate così si ottengono entropie assolute ' +
          'affidabili, e si scoprono le eccezioni istruttive: il ghiaccio e il ' +
          'monossido di carbonio solido conservano un\'<b>entropia residua</b>, ' +
          'perché i legami idrogeno nell\'uno e l\'orientamento CO/OC delle molecole ' +
          'nell\'altro restano disordinati anche a temperatura zero.' },

    { re: /work on catalysis|chemical equilibria and rates of reaction/i,
      tit: 'Catalisi, equilibri e velocità di reazione',
      sp: 'Un catalizzatore viene definito per quello che fa, non per un\'ipotetica ' +
          'forza misteriosa: <b>cambia la velocità</b> di una reazione senza ' +
          'comparire fra i prodotti e senza spostare l\'equilibrio, perché accelera ' +
          'nella stessa misura la reazione diretta e quella inversa. È una ' +
          'definizione cinetica, che separa nettamente due domande — fin dove va ' +
          'una reazione, e quanto in fretta ci arriva. Insieme arrivano le leggi ' +
          'quantitative degli equilibri in soluzione, come la <b>legge della ' +
          'diluizione</b> per gli elettroliti deboli, K = α²c/(1 − α), che lega il ' +
          'grado di dissociazione α alla concentrazione, e l\'ossidazione catalitica ' +
          'dell\'ammoniaca su platino, da cui ancora oggi si produce l\'acido ' +
          'nitrico.' },



    /* ── Catalisi e sintesi ────────────────────────────────────────────── */
    { re: /asymmetric organocatalysis|organocatalysis/i,
      tit: 'Organocatalisi asimmetrica',
      sp: 'Per decenni la catalisi asimmetrica ha voluto <b>metalli</b>, spesso ' +
          'costosi, tossici e sensibili all\'aria. Poi si scopre che piccole ' +
          'molecole organiche — un amminoacido come la prolina, un\'ammina semplice ' +
          '— fanno lo stesso lavoro: formano con il substrato un intermedio (una ' +
          'enammina, uno ione imminio) che reagisce da una faccia sola, perché ' +
          'l\'altra è ingombrata. Niente metalli, reagenti da banco, condizioni ' +
          'blande. È anche il ponte concettuale verso gli enzimi, che fanno ' +
          'esattamente questo da sempre.' },

    { re: /chirally catal\w* oxidation|asymmetric (epoxidation|dihydroxylation)/i,
      tit: 'Ossidazioni asimmetriche catalitiche',
      sp: 'Un doppio legame C=C si trasforma facilmente in un <b>epossido</b> o in ' +
          'un diolo, ma le due facce dell\'alchene sono equivalenti e i prodotti ' +
          'nascono racemi. Un catalizzatore chirale le distingue. Per gli alcoli ' +
          'allilici funziona una miscela di isopropossido di titanio, un estere ' +
          'dell\'acido tartarico naturale e un idroperossido organico: l\'ossigeno ' +
          'arriva sempre dalla stessa faccia, con eccessi enantiomerici spesso ' +
          'oltre il 90%, e la faccia si sceglie usando un enantiomero del tartrato ' +
          'o l\'altro. Con il tetrossido di osmio e un legante derivato dagli ' +
          'alcaloidi della china si ottengono invece dioli enantiopuri. Epossidi e ' +
          'dioli chirali sono <b>intermedi</b> versatilissimi per farmaci e ' +
          'prodotti naturali.' },

    { re: /asymmetric (hydrogenation|oxidation|catalysis)|chirally catalysed/i,
      tit: 'Catalisi asimmetrica',
      sp: 'Due enantiomeri sono l\'immagine speculare l\'uno dell\'altro, hanno le ' +
          'stesse proprietà fisiche e in un organismo possono fare cose ' +
          'diversissime: uno cura, l\'altro no. Una sintesi normale li produce ' +
          '<b>metà e metà</b>, e separarli è costoso. Un catalizzatore chirale ' +
          'rompe la simmetria: la molecola si lega al metallo in un intorno che ha ' +
          'una mano, e la reazione procede molto più rapidamente verso <b>uno</b> ' +
          'dei due prodotti. Poche molecole di catalizzatore determinano la ' +
          'chiralità di milioni di molecole di prodotto, e da qui passa buona parte ' +
          'della sintesi farmaceutica moderna.' },

    { re: /metathesis/i,
      tit: 'Metatesi delle olefine',
      sp: 'Scambiare i pezzi di due doppi legami carbonio-carbonio: i due frammenti ' +
          'si staccano e si ricombinano al contrario, come due coppie che si ' +
          'scambiano i partner. Sembra una reazione impossibile — il doppio legame ' +
          'C=C è robusto — e un catalizzatore a base di <b>carbene metallico</b> la ' +
          'rende ordinaria. Serve a chiudere anelli grandi che per altra via non si ' +
          'chiuderebbero, a costruire polimeri a struttura controllata, e con pochi ' +
          'passaggi al posto di molti: meno scarti, meno solventi.' },

    { re: /palladium.?catalysed cross coupling|cross.?coupling/i,
      tit: 'Accoppiamenti incrociati catalizzati da palladio',
      sp: 'Unire due frammenti di carbonio esattamente dove si vuole è il problema ' +
          'centrale della sintesi organica. Il palladio lo risolve con un ciclo in ' +
          'tre tempi: si <b>inserisce</b> nel legame carbonio-alogeno di un ' +
          'frammento, <b>scambia</b> il suo alogeno con il secondo frammento ' +
          'portato da un boro, uno stagno o uno zinco, e infine <b>espelle</b> i ' +
          'due pezzi uniti rigenerandosi. Il legame si forma dove l\'alogeno stava, ' +
          'e solo lì. Oggi è il modo normale di costruire biarili, e quindi gran ' +
          'parte dei farmaci e dei materiali per elettronica organica.' },

    { re: /metal.?organic framework|reticular chemistry/i,
      tit: 'Reticoli metallo-organici (MOF)',
      sp: 'Nodi metallici tenuti insieme da ponti organici, in un reticolo ordinato ' +
          'pieno di <b>vuoto</b>: fino a qualche grammo di materiale può avere la ' +
          'superficie interna di un campo da calcio. La parte notevole è la ' +
          '<b>progettabilità</b>: cambiando la lunghezza del ponte si cambia la ' +
          'dimensione dei pori, cambiando il metallo si cambia la chimica delle ' +
          'pareti. Da qui l\'immagazzinamento di gas, la separazione di miscele che ' +
          'bollono alla stessa temperatura, la cattura dell\'anidride carbonica e la ' +
          'raccolta di acqua dall\'aria del deserto.' },

    { re: /click chemistry|bioorthogonal/i,
      tit: 'Click chemistry e chimica bioortogonale',
      sp: 'Servivano reazioni che funzionassero <b>sempre</b>: resa quasi totale, ' +
          'nessun sottoprodotto, in acqua, a temperatura ambiente, e che ' +
          'ignorassero tutti i gruppi funzionali intorno. La cicloaddizione fra ' +
          'un\'azide e un alchino, con rame, è questo: due pezzi si agganciano come ' +
          'una fibbia. Il passo successivo è <b>bioortogonale</b>: reazioni che ' +
          'avvengono <i>dentro una cellula viva</i> senza toccare la sua chimica e ' +
          'senza il rame, che è tossico — una delle due metà viene messa su una ' +
          'molecola biologica, l\'altra porta una sonda, e si vede dove va.' },

    { re: /boron.? and phosphorus|phosphorus.?containing compounds/i,
      tit: 'Reagenti al boro e al fosforo in sintesi organica',
      sp: 'Due elementi diventano attrezzi quotidiani del chimico organico. Con ' +
          'l\'<b>idroborazione</b> il legame B–H si somma a un doppio legame C=C: il ' +
          'boro va sul carbonio meno sostituito e l\'idrogeno sull\'altro, dalla ' +
          'stessa faccia; trattando poi l\'organoborano con perossido di idrogeno in ' +
          'ambiente basico il boro è sostituito da un OH con ritenzione della ' +
          'configurazione. Si ottiene così l\'alcol «opposto» a quello ' +
          'dell\'idratazione acida. Il fosforo dà invece gli <b>ilidi</b>, ' +
          'R₃P⁺–C⁻HR′, che reagiscono con aldeidi e chetoni trasformando il C=O in ' +
          'C=C esattamente dove stava il carbonile; la forza trainante è la ' +
          'formazione del robustissimo legame P=O nel sottoprodotto, l\'ossido di ' +
          'fosfina.' },

    { re: /grignard reagent|so.called \S+ reagent/i,
      tit: 'I reattivi organomagnesiaci',
      sp: 'Un alogenuro alchilico o arilico, R–X, agitato con magnesio metallico in ' +
          'etere anidro, dà R–MgX: il magnesio si <b>inserisce</b> nel legame ' +
          'carbonio-alogeno. Il risultato è un\'inversione di polarità: ' +
          'nell\'alogenuro il carbonio era parzialmente positivo, nel composto ' +
          'organomagnesiaco è <b>nucleofilo</b>, quasi un carbanione. Così attacca ' +
          'il carbonio di un carbonile: con la formaldeide dà alcoli primari, con ' +
          'le altre aldeidi secondari, con i chetoni terziari, con l\'anidride ' +
          'carbonica acidi carbossilici. Il prezzo è l\'umidità: l\'acqua protona ' +
          'subito il reattivo trasformandolo in alcano, e per questo tutto va ' +
          'condotto in solventi secchi, dove l\'etere, coordinando il magnesio, ' +
          'stabilizza il reattivo.' },

    { re: /hydrogenating organic compounds|finely disintegrated metals|catalytic hydrogenation/i,
      tit: 'Idrogenazione catalitica su metalli finemente suddivisi',
      sp: 'Un composto insaturo e l\'idrogeno, mescolati, non reagiscono; fatti ' +
          'passare in fase vapore su <b>nichel finemente suddiviso</b> a ' +
          'temperatura moderata, si combinano: l\'etilene dà etano, il benzene ' +
          'cicloesano, i nitrili ammine. L\'interpretazione è che il metallo formi ' +
          'con l\'idrogeno composti superficiali instabili, cioè che l\'H₂ si dissoci ' +
          'sulla superficie e gli atomi vengano ceduti alla molecola organica: ' +
          'un\'anticipazione della catalisi eterogenea moderna. Il metodo diventa ' +
          'industriale, dall\'<b>indurimento</b> degli oli vegetali in grassi solidi ' +
          'alla produzione di metano dagli ossidi di carbonio, CO + 3H₂ → CH₄ + ' +
          'H₂O, una reazione che nella variante con la CO₂ si usa ancora oggi per ' +
          'riciclare l\'anidride carbonica.' },

    { re: /diene synthesis|diels.?alder/i,
      tit: 'La sintesi dienica: cicloaddizione [4+2]',
      sp: 'Un diene coniugato e un alchene povero di elettroni — il ' +
          '<b>dienofilo</b>, per esempio l\'anidride maleica — si uniscono in un ' +
          'solo passaggio formando un anello a sei termini: due nuovi legami σ ' +
          'carbonio-carbonio nascono insieme, a spese di tre legami π. È una ' +
          '<b>cicloaddizione concertata</b> e stereospecifica: i sostituenti che ' +
          'erano in cis sul dienofilo restano in cis nel cicloesene, e di solito ' +
          'prevale il prodotto endo, con i gruppi del dienofilo rivolti sotto il ' +
          'sistema del diene. In un colpo solo si creano fino a quattro centri ' +
          'stereogenici in modo prevedibile: per questo è una delle reazioni più ' +
          'usate nella sintesi di prodotti naturali e farmaci.' },

    { re: /synthesis on a solid matrix|solid.?phase synthesis/i,
      tit: 'Sintesi in fase solida',
      sp: 'Sintetizzare un peptide in soluzione significa, dopo ogni amminoacido ' +
          'aggiunto, purificare l\'intermedio: con decine di passaggi le perdite ' +
          'diventano proibitive. L\'idea è ancorare il primo amminoacido a una ' +
          '<b>resina insolubile</b>, palline di polistirene, e far crescere la ' +
          'catena attaccata a essa. Ogni ciclo è uguale: si toglie il gruppo ' +
          'protettore, si aggiunge il nuovo amminoacido attivato in grande eccesso, ' +
          'e i reagenti in avanzo si eliminano semplicemente <b>filtrando e ' +
          'lavando</b>. Alla fine si stacca il peptide dalla resina. Il ' +
          'procedimento si automatizza, porta a sintetizzare un enzima intero e ' +
          'attivo, e lo stesso principio sta dietro la sintesi automatica degli ' +
          'oligonucleotidi.' },

    { re: /organic dyes|hydroaromatic/i,
      tit: 'Coloranti organici e composti idroaromatici',
      sp: 'L\'industria chimica nasce con i coloranti, e il colorante per eccellenza ' +
          'è l\'<b>indaco</b>. Stabilirne la struttura — due unità indoliche unite ' +
          'da un doppio legame C=C, con legami idrogeno interni fra N–H e C=O che ' +
          'ne bloccano la forma — e mostrare come sintetizzarlo apre la strada alla ' +
          'produzione industriale, che sostituisce l\'estrazione dalle piante. Dello ' +
          'stesso filone fanno parte le ftaleine, come la fenolftaleina e la ' +
          'fluoresceina, ottenute da anidride ftalica e fenoli. Lo studio dei ' +
          'composti <b>idroaromatici</b>, anelli del benzene parzialmente ' +
          'idrogenati, porta alla teoria della tensione degli anelli: un anello i ' +
          'cui angoli si scostano da quelli del tetraedro è instabile e reattivo, ' +
          'come il ciclopropano.' },

    { re: /theory and methodology of organic synthesis|retrosynthetic/i,
      tit: 'La logica della retrosintesi',
      sp: 'La sintesi smette di essere un\'arte individuale e diventa un metodo che ' +
          'si insegna. Si parte dal <b>bersaglio</b> e si cammina a ritroso: ogni ' +
          'legame che si può immaginare rotto è una <i>disconnessione</i>, e ogni ' +
          'disconnessione porta a precursori più semplici. Si ripete finché non si ' +
          'arriva a cose che si comprano. Insieme arriva il vocabolario — sintone, ' +
          'gruppo protettore, equivalente sintetico — e un modo di ragionare che un ' +
          'calcolatore può imitare: è l\'antenato di ogni programma di retrosintesi, ' +
          'compreso quello di questa applicazione.' },

    { re: /investigations in surface chemistry|adsorption isotherm|monomolecular (film|layer)/i,
      tit: 'Adsorbimento e monostrati',
      sp: 'Su una superficie le molecole si adsorbono in siti definiti, e quando i ' +
          'siti sono pieni l\'adsorbimento si ferma: si forma un <b>monostrato</b>, ' +
          'spesso una sola molecola. Da questa immagine semplice viene l\'isoterma θ ' +
          '= KP/(1 + KP), che lega la frazione di superficie coperta alla pressione ' +
          'del gas ed è ancora il punto di partenza della cinetica della catalisi ' +
          'eterogenea. Sull\'acqua, gli acidi grassi formano film spessi una ' +
          'molecola che si possono comprimere con una barriera mobile: misurando ' +
          'l\'area occupata si trova che ogni catena occupa circa 0,2 nm², ' +
          'indipendentemente dalla lunghezza — le molecole stanno <b>in piedi</b>, ' +
          'con la testa polare nell\'acqua e la coda idrocarburica fuori.' },

    { re: /surface chemistry|chemical processes on solid surfaces/i,
      tit: 'Chimica delle superfici',
      sp: 'Buona parte della chimica industriale avviene sulla superficie di un ' +
          'solido, dove le molecole si <b>adsorbono</b>, si deformano, a volte si ' +
          'spezzano, e poi ripartono trasformate. Studiarla richiede ultra-alto ' +
          'vuoto e cristalli perfetti, perché una superficie all\'aria si copre di ' +
          'sporco in un attimo. Con quella disciplina si arriva a scrivere i ' +
          '<b>singoli passaggi</b> di un processo come la sintesi dell\'ammoniaca: ' +
          'come la molecola di azoto si rompe sul ferro, quanto resta attaccata, in ' +
          'che ordine arrivano gli idrogeni. La catalisi eterogenea smette di ' +
          'essere una ricetta.' },

    { re: /chemical high pressure methods|high pressure methods/i,
      tit: 'I metodi chimici ad alta pressione',
      sp: 'Far reagire gas a centinaia di atmosfere e a centinaia di gradi, in ' +
          'continuo, per anni, è prima di tutto un problema di <b>materiali</b>. ' +
          'L\'idrogeno caldo e compresso diffonde nell\'acciaio, reagisce con il ' +
          'carbonio che lo indurisce e lo rende fragile: i primi reattori si ' +
          'spaccavano. La soluzione è un tubo a doppia parete, con un rivestimento ' +
          'interno di ferro povero di carbonio e un mantello esterno di acciaio ' +
          'forato che lascia sfuggire l\'idrogeno. Con questa tecnologia diventano ' +
          'industriali la sintesi dell\'ammoniaca, quella del <b>metanolo</b> da CO ' +
          '+ 2H₂ e l\'<b>idrogenazione del carbone</b> in combustibili liquidi: la ' +
          'grande chimica dei gas ad alta pressione.' },

    { re: /synthesis of ammonia|high pressure/i,
      tit: 'Ammoniaca dall\'azoto dell\'aria, e l\'alta pressione',
      sp: 'L\'azoto molecolare è nell\'aria in abbondanza e non serve a niente alle ' +
          'piante: il suo triplo legame è fra i più robusti che esistano. Farlo ' +
          'reagire con idrogeno per dare ammoniaca richiede pressioni di centinaia ' +
          'di atmosfere, temperature alte e un catalizzatore di ferro — e ' +
          'soprattutto richiede di inventare l\'<b>impianto</b> che regga quelle ' +
          'condizioni in continuo. È la reazione da cui viene la maggior parte dei ' +
          'fertilizzanti del mondo: senza di essa non si nutrirebbe la popolazione ' +
          'attuale. Lo stesso metodo ad alta pressione apre poi l\'idrogenazione del ' +
          'carbone.' },

    { re: /conductive polymer|conductive polymers/i,
      tit: 'Polimeri conduttori',
      sp: 'Una plastica isola: è il motivo per cui ci si fanno i rivestimenti dei ' +
          'cavi. Eppure un polimero con <b>doppi legami coniugati</b> lungo tutta ' +
          'la catena, se viene <i>drogato</i> — ossidato o ridotto in parte — ' +
          'conduce come un metallo, perché le cariche si muovono sul sistema π ' +
          'delocalizzato. Il caso esemplare è il poliacetilene: un film ' +
          'dall\'aspetto argenteo che, esposto a vapori di iodio, aumenta la sua ' +
          'conducibilità di miliardi di volte. Le cariche introdotte non restano ' +
          'ferme su un atomo, ma deformano localmente la catena e la percorrono. Si ' +
          'ottiene un materiale che si piega, si stampa e conduce: diodi organici ' +
          'per gli schermi, sensori, celle fotovoltaiche flessibili.' },

    { re: /high polymers|stereospecific polymeri[sz]ation/i,
      tit: 'Catalizzatori per poliolefine stereoregolari',
      sp: 'L\'etilene polimerizzava solo ad altissime pressioni, dando un ' +
          'polietilene ramificato e tenero. Con un catalizzatore ottenuto da un ' +
          'cloruro di titanio e un alluminio alchile la polimerizzazione avviene ' +
          'quasi a pressione ambiente e dà catene <b>lineari</b>: un polietilene ' +
          'più denso, rigido e resistente. Il meccanismo è un\'inserzione ripetuta: ' +
          'l\'alchene si coordina al titanio e si infila nel legame titanio-carbonio ' +
          'della catena in crescita. Applicato al propilene, il catalizzatore ' +
          'dispone tutti i gruppi metile dalla stessa parte della catena, cioè la ' +
          'rende <b>isotattica</b>: il polimero cristallizza, fonde sopra i 160 °C ' +
          'e diventa uno dei materiali più prodotti al mondo.' },

    { re: /physical chemistry of (the )?macromolecules/i,
      tit: 'La chimica fisica delle macromolecole',
      sp: 'Una catena polimerica in soluzione è un gomitolo che cambia forma di ' +
          'continuo: va descritta con la statistica. In una catena ideale la ' +
          'distanza fra le estremità cresce come la radice quadrata del numero di ' +
          'unità, R ∝ √N, come in una passeggiata casuale; ma i segmenti non ' +
          'possono occupare lo stesso spazio, e questo <b>volume escluso</b> gonfia ' +
          'il gomitolo, con un esponente vicino a 3/5 invece di 1/2. In un solvente ' +
          '«theta» le due tendenze si compensano e la catena torna ideale. Dalla ' +
          'stessa trattazione statistica vengono la termodinamica delle soluzioni ' +
          'polimeriche su reticolo, la teoria della gelificazione e la spiegazione ' +
          'dell\'<b>elasticità della gomma</b>, che è entropica: tirata, la catena ' +
          'perde configurazioni possibili.' },

    { re: /polymerization|macromolecular chemistry|polymers/i,
      tit: 'Macromolecole e polimerizzazione controllata',
      sp: 'Che gomma, cellulosa e proteine fossero <b>molecole singole ' +
          'lunghissime</b>, e non aggregati di molecole piccole, è stata una tesi ' +
          'combattuta a lungo. Riconosciuta, cambia la materia: si può progettare ' +
          'una catena. Poi arrivano i catalizzatori che la costruiscono in modo ' +
          '<b>ordinato</b> — a pressione quasi ambiente, con i monomeri inseriti ' +
          'sempre nello stesso verso e con la stessa stereochimica. Dalla catena ' +
          'ordinata viene la cristallinità, e dalla cristallinità la rigidità e il ' +
          'punto di fusione: il polipropilene isotattico è un oggetto d\'uso, quello ' +
          'disordinato è una colla.' },

    { re: /fullerene/i,
      tit: 'I fullereni',
      sp: 'Il carbonio elementare si conosceva in due forme, grafite e diamante. La ' +
          'terza è una <b>gabbia chiusa</b>: sessanta atomi disposti come le ' +
          'cuciture di un pallone da calcio, venti esagoni e dodici pentagoni — i ' +
          'pentagoni sono necessari, perché con soli esagoni la superficie resta ' +
          'piatta. Comparve prima come un picco insolitamente intenso a massa 720 ' +
          'negli spettri della grafite vaporizzata con il laser; poi un metodo ad ' +
          'arco elettrico ne produsse grammi, e lo spettro NMR del ¹³C, con ' +
          'un\'unica riga, confermò che tutti gli atomi sono equivalenti. Nasce una ' +
          'chimica nuova: molecole dentro la gabbia, derivati sulla superficie, e ' +
          'la parentela con i nanotubi, che sono la stessa idea arrotolata in un ' +
          'tubo.' },

    { re: /quasicrystal/i,
      tit: 'I quasicristalli',
      sp: 'Un cristallo è periodico, e la periodicità vieta la simmetria a cinque: ' +
          'con pentagoni non si pavimenta un piano senza lasciare buchi. Poi arriva ' +
          'una lega il cui diagramma di diffrazione mostra punti nitidi — quindi ' +
          'ordine a lungo raggio — <b>e</b> una simmetria decagonale, quindi ' +
          'nessuna periodicità. La materia può essere <b>ordinata senza ' +
          'ripetersi</b>, come una tassellatura aperiodica. Per anni il risultato è ' +
          'stato respinto; è la definizione di cristallo che ha dovuto cambiare.' },

    { re: /quantum dot/i,
      tit: 'I punti quantici',
      sp: 'Prendete un semiconduttore e fatene un granello di pochi nanometri: gli ' +
          'elettroni restano confinati in uno spazio paragonabile alla loro ' +
          'lunghezza d\'onda, e i livelli di energia si separano. La conseguenza ' +
          'visibile è che il <b>colore dipende dalla dimensione</b>, non dalla ' +
          'composizione: lo stesso materiale emette nel rosso se il granello è ' +
          'grande e nel blu se è piccolo. La parte chimica difficile è farli tutti ' +
          'della stessa misura, in modo riproducibile: risolta, sono arrivati negli ' +
          'schermi, nei marcatori biologici e nei LED.' },

    { re: /lithium.?ion batter/i,
      tit: 'Le batterie a ioni di litio',
      sp: 'Il litio è il metallo più leggero e cede l\'elettrone con grande ' +
          'facilità: ideale per immagazzinare energia, e pericoloso da usare in ' +
          'forma metallica, perché cresce in filamenti che cortocircuitano la ' +
          'cella. La soluzione è non usarlo come metallo: lo ione litio <b>si ' +
          'infila e si sfila</b> fra gli strati di due materiali, un ossido da una ' +
          'parte e la grafite dall\'altra, avanti e indietro per migliaia di cicli. ' +
          'Nessuna reazione distruttiva, solo ioni che migrano. È la tecnologia su ' +
          'cui funzionano i telefoni e le auto elettriche.' },

    { re: /molecular machine/i,
      tit: 'Macchine molecolari',
      sp: 'Molecole fatte di parti che si muovono l\'una rispetto all\'altra in modo ' +
          '<b>controllato</b>: due anelli concatenati meccanicamente, un anello ' +
          'infilato su un asse che scorre fra due fermi, un rotore che gira sempre ' +
          'nello stesso senso se illuminato. La difficoltà vera è ' +
          '<b>costruirli</b>: i legami meccanici non si formano da sé, bisogna ' +
          'preorganizzare i pezzi con interazioni debolissime e poi chiudere ' +
          'l\'anello. Il risultato è un motore o un interruttore molecolare: ' +
          'movimento ordinato a una scala dove normalmente c\'è solo agitazione ' +
          'termica.' },

    { re: /crown ether|molecules with structure.?specific interactions|host.?guest/i,
      tit: 'Riconoscimento molecolare: ospite e ospitante',
      sp: 'Molecole a forma di anello o di cesto che <b>ospitano</b> uno ione o una ' +
          'molecola piccola, con una selettività notevole: un etere corona con sei ' +
          'ossigeni lega il potassio e lascia stare il sodio, perché la cavità ha ' +
          'la misura giusta. Non ci sono legami covalenti in gioco, solo molte ' +
          'interazioni deboli che sommate fanno una presa forte. È la nascita della ' +
          'chimica <b>supramolecolare</b>: la chimica di quello che tiene insieme ' +
          'le molecole fra loro, cioè anche di come funziona un recettore o un ' +
          'canale ionico.' },

    { re: /boron|borane/i,
      tit: 'La chimica dei borani',
      sp: 'Il boro ha un elettrone in meno di quanti servirebbero: i suoi idruri ' +
          'non si possono scrivere con i legami a due elettroni della chimica ' +
          'normale. Hanno legami <b>a tre centri e due elettroni</b> — un idrogeno ' +
          'a ponte fra due boro — e formano gabbie poliedriche con regole di ' +
          'conteggio proprie. È un pezzo di chimica strutturale che ha costretto ad ' +
          'allargare l\'idea stessa di legame, e da cui vengono reagenti usati ogni ' +
          'giorno, dall\'idroborazione agli agenti riducenti.' },

    { re: /organometallic|sandwich compound|metallocene/i,
      tit: 'Composti organometallici a sandwich',
      sp: 'Un atomo di ferro stretto fra due anelli a cinque atomi di carbonio, ' +
          'come il ripieno di un sandwich: il metallo non è legato a un singolo ' +
          'carbonio, ma a <b>tutto il sistema π</b> dell\'anello. La struttura ' +
          'sembrava impossibile e apre un campo intero — la chimica fra l\'organico ' +
          'e l\'inorganico, dove i metalli diventano il centro attorno a cui le ' +
          'molecole organiche si riorganizzano. Da qui vengono i catalizzatori per ' +
          'i polimeri e gran parte della catalisi omogenea.' },

    { re: /linkage of atoms in molecules|coordination (compounds|chemistry)/i,
      tit: 'I composti di coordinazione',
      sp: 'I sali di cobalto con ammoniaca, come CoCl₃·6NH₃, sembravano violare le ' +
          'regole di valenza. La soluzione è distinguere due valenze: quella ' +
          '«principale», la carica dello ione, e quella «secondaria», il <b>numero ' +
          'di coordinazione</b>, cioè quanti leganti circondano direttamente il ' +
          'metallo. In [Co(NH₃)₆]Cl₃ i sei NH₃ stanno attorno al cobalto e i tre ' +
          'cloruri sono ioni liberi: precipitano tutti con nitrato d\'argento, ' +
          'mentre in [CoCl(NH₃)₅]Cl₂ ne precipitano solo due. Il numero di isomeri ' +
          'dimostra la geometria <b>ottaedrica</b>: [CoCl₂(NH₃)₄]⁺ esiste in forma ' +
          'cis e trans, e certi complessi si separano in enantiomeri — anche uno ' +
          'privo di carbonio, a riprova che la chiralità non è un privilegio della ' +
          'chimica organica.' },

    { re: /carbocation/i,
      tit: 'I carbocationi',
      sp: 'Un carbonio con carica positiva e sei elettroni invece di otto è ' +
          'l\'intermedio di moltissime reazioni organiche, e per molto tempo è ' +
          'rimasto un\'ipotesi: si deduceva dai prodotti, non si vedeva. Con ' +
          '<b>superacidi</b> — acidi milioni di volte più forti dell\'acido ' +
          'solforico, in cui nessuna base può stabilizzare la carica — quegli ' +
          'intermedi diventano abbastanza duraturi da registrarne lo spettro NMR. ' +
          'Un\'ipotesi meccanicistica diventa un oggetto misurabile, e la chimica ' +
          'dei petroli e delle alchilazioni smette di essere empirica.' },

    { re: /stereochemistry of enzyme.?catal\w* reactions/i,
      tit: 'La stereochimica delle reazioni enzimatiche',
      sp: 'Un enzima distingue cose che un chimico considera identiche: i due atomi ' +
          'di idrogeno di un gruppo CH₂, che diventano diversi appena la molecola è ' +
          'legata in un sito attivo chirale (sono <b>prochirali</b>). Per seguire ' +
          'quale dei due viene tolto o aggiunto si costruiscono molecole con un ' +
          'gruppo metile reso chirale dai tre isotopi dell\'idrogeno — H, deuterio e ' +
          'trizio — e si analizza dove finiscono. Con questo metodo si ricostruisce ' +
          'passo per passo la stereochimica della biosintesi del colesterolo: da ' +
          'sei unità a cinque atomi di carbonio allo squalene e infine allo ' +
          'scheletro steroideo, sapendo per ogni idrogeno da quale faccia entra o ' +
          'esce. La <b>stereospecificità</b> enzimatica diventa misurabile atomo ' +
          'per atomo.' },

    { re: /stereochemistry of organic molecules/i,
      tit: 'Stereochimica di molecole e reazioni organiche',
      sp: 'Per parlare di chiralità senza ambiguità servono regole: a ciascuno dei ' +
          'quattro sostituenti di un centro stereogenico si assegna una ' +
          '<b>priorità</b> in base al numero atomico, si guarda la molecola con il ' +
          'gruppo di priorità minima rivolto lontano, e se gli altri tre decrescono ' +
          'in senso orario il centro è R, altrimenti S. È il sistema con cui si ' +
          'nomina ogni farmaco chirale, ed è quello che usa anche questa ' +
          'applicazione. Insieme vengono gli studi sugli anelli di media grandezza, ' +
          'da otto a dodici atomi, dove gli idrogeni affollati all\'interno ' +
          'provocano <b>reazioni transanulari</b> fra atomi opposti dell\'anello, e ' +
          'sulla stereochimica di alcaloidi e antibiotici naturali.' },



    /* ── Separazioni e metodi di misura ────────────────────────────────── */
    { re: /micro.?analysis/i,
      tit: 'La microanalisi organica',
      sp: 'Per stabilire la formula di un composto organico si brucia un campione ' +
          'pesato in corrente di ossigeno e si pesano l\'anidride carbonica e ' +
          'l\'acqua prodotte, assorbite su appositi reagenti: ne vengono le ' +
          'percentuali di carbonio e idrogeno, e con metodi analoghi quelle di ' +
          'azoto, zolfo e alogeni. Il metodo classico richiedeva qualche centinaio ' +
          'di milligrammi. Riprogettandolo per <b>pochi milligrammi</b> — con una ' +
          'microbilancia sensibile al microgrammo e apparecchi miniaturizzati — ' +
          'diventa possibile analizzare sostanze isolate in quantità minime da ' +
          'materiale biologico: ormoni, vitamine, pigmenti, acidi biliari. È la ' +
          'condizione pratica per buona parte della chimica dei <b>prodotti ' +
          'naturali</b> che segue.' },

    { re: /mass spectrograph|whole.number rule/i,
      tit: 'Lo spettrografo di massa e gli isotopi stabili',
      sp: 'Ioni positivi deviati in successione da un campo elettrico e da uno ' +
          'magnetico vengono <b>focalizzati</b> in punti diversi di una lastra ' +
          'fotografica a seconda del rapporto fra massa e carica. Ne viene un ' +
          'risultato netto: anche gli elementi non radioattivi sono miscele di ' +
          'isotopi. Il neon ha masse 20 e 22, il cloro 35 e 37, e la massa atomica ' +
          '35,5 del cloro è solo una media pesata. Ogni isotopo ha massa quasi ' +
          'intera — la <b>regola dei numeri interi</b> — e le piccole deviazioni ' +
          'residue, il difetto di massa, misurano l\'energia di legame del nucleo. ' +
          'Lo strumento è l\'antenato diretto degli spettrometri di massa con cui ' +
          'oggi si identificano le molecole.' },

    { re: /mass spectrometr/i,
      tit: 'Spettrometria di massa per le macromolecole',
      sp: 'Pesare una molecola richiede di ionizzarla e farla volare: facile per ' +
          'una molecola piccola, impossibile per una proteina, che scaldata si ' +
          'distrugge. Due metodi lo risolvono <b>senza romperla</b> — spruzzare la ' +
          'soluzione da un capillare a alta tensione, così il solvente evapora e ' +
          'resta lo ione intatto, oppure inglobarla in una matrice che assorbe ' +
          'l\'impulso laser al posto suo. All\'improvviso si pesano proteine intere ' +
          'con un errore di poche unità di massa atomica: nasce la proteomica.' },

    { re: /nuclear magnetic resonance spectroscopy for determining|structure of biological macromolecules in solution/i,
      tit: 'NMR delle proteine in soluzione',
      sp: 'Uno spettro NMR di una proteina contiene centinaia di segnali ' +
          'sovrapposti, e il primo problema è sapere a quale idrogeno appartiene ' +
          'ciascuno. Il metodo è l\'<b>assegnazione sequenziale</b>: con esperimenti ' +
          'bidimensionali si riconoscono i sistemi di spin dei singoli amminoacidi ' +
          'e li si collega ai vicini lungo la catena. Poi il trasferimento di ' +
          'magnetizzazione attraverso lo spazio fra protoni dice quali coppie ' +
          'distano meno di circa 0,5 nm: centinaia di questi <b>vincoli di ' +
          'distanza</b>, dati a un algoritmo di geometria, bastano a ricostruire il ' +
          'ripiegamento. Si ottiene la struttura in soluzione, senza cristallo, e ' +
          'in più l\'informazione sui movimenti: quali parti della proteina sono ' +
          'rigide e quali flessibili.' },

    { re: /nuclear magnetic resonance|nmr spectroscopy/i,
      tit: 'Risonanza magnetica nucleare, da tecnica a strumento strutturale',
      sp: 'Un nucleo con spin, in un campo magnetico, assorbe a una frequenza che ' +
          'dipende da quanto gli elettroni intorno lo <b>schermano</b>: lo ' +
          'spostamento chimico è una misura dell\'intorno di ogni atomo. I passaggi ' +
          'decisivi sono due: gli esperimenti a impulsi, in cui il segnale ' +
          'registrato nel tempo viene trasformato matematicamente in spettro e che ' +
          'fanno in secondi quello che richiedeva ore, e gli esperimenti ' +
          '<b>bidimensionali</b>, che mettono in relazione un nucleo con l\'altro e ' +
          'permettono di risalire alla struttura — fino a determinare la ' +
          'conformazione di una proteina in soluzione, cioè nelle condizioni in cui ' +
          'lavora.' },

    { re: /cryo.?electron microscopy|electron microscopy.*solution|high.?resolution structure determination of biomolecules/i,
      tit: 'Criomicroscopia elettronica',
      sp: 'La cristallografia richiede un cristallo, e moltissime proteine — ' +
          'soprattutto quelle di membrana e i grandi complessi — non ' +
          'cristallizzano. La soluzione è congelare il campione così in fretta che ' +
          'l\'acqua diventi <b>vetro</b> invece di ghiaccio, perché i cristalli di ' +
          'ghiaccio distruggerebbero la struttura; poi si fotografano migliaia di ' +
          'molecole orientate a caso con un fascio di elettroni molto debole, e si ' +
          'ricostruisce la forma tridimensionale combinando le immagini. Si vedono ' +
          'macchine molecolari intere nel loro stato nativo.' },

    { re: /crystallographic electron microscopy|nucleic acid.?protein complexes/i,
      tit: 'Microscopia elettronica cristallografica',
      sp: 'Un\'immagine al microscopio elettronico è una proiezione: tutta la ' +
          'profondità dell\'oggetto schiacciata su un piano, e per giunta rumorosa. ' +
          'Trattandola come si tratta un diagramma di diffrazione — scomponendola ' +
          'in componenti periodiche, filtrando il rumore e combinando proiezioni ' +
          'prese a <b>inclinazioni diverse</b> — si ricostruisce l\'oggetto in tre ' +
          'dimensioni: è il principio della tomografia, applicato a particelle ' +
          'ordinate come i virus elicoidali e sferici. Con gli stessi strumenti, e ' +
          'con la cristallografia, si chiariscono i complessi fra acidi nucleici e ' +
          'proteine: come si autoassembla un virus, e come il DNA si avvolge ' +
          'attorno a un ottamero di istoni nel <b>nucleosoma</b>, l\'unità della ' +
          'cromatina.' },

    { re: /direct methods/i,
      tit: 'I metodi diretti in cristallografia',
      sp: 'Un esperimento di diffrazione misura le intensità dei riflessi, cioè le ' +
          'ampiezze delle onde diffuse, ma non le loro <b>fasi</b>; e senza le fasi ' +
          'non si ricostruisce la densità elettronica. Il problema sembrava ' +
          'insolubile senza trucchi sperimentali, come l\'introduzione di atomi ' +
          'pesanti. La soluzione è statistica: la densità elettronica è ovunque ' +
          'positiva ed è concentrata in atomi discreti, e questi due vincoli ' +
          'impongono <b>relazioni probabilistiche</b> fra le fasi dei riflessi più ' +
          'intensi — per tre riflessi legati, per esempio, la somma delle fasi ' +
          'tende a zero. Programmate al calcolatore, queste relazioni risolvono in ' +
          'poco tempo la struttura di una molecola di qualche decina di atomi: oggi ' +
          'sono la routine di ogni laboratorio di sintesi.' },

    { re: /globular proteins/i,
      tit: 'Le prime strutture di proteine: mioglobina ed emoglobina',
      sp: 'Cristallizzare una proteina è possibile; risolverne la struttura ' +
          'sembrava di no, perché le fasi dei riflessi restano ignote. La chiave è ' +
          'la <b>sostituzione isomorfa</b>: si legano alla proteina pochi atomi ' +
          'pesanti, come mercurio o oro, senza alterare il cristallo, e il ' +
          'confronto delle intensità con e senza atomo pesante permette di ricavare ' +
          'le fasi. Così si ottiene la prima struttura di una proteina, la ' +
          'mioglobina: una catena avvolta in tratti di <b>α-elica</b>, come era ' +
          'stato previsto, con il gruppo eme in una tasca idrofobica. Poi ' +
          'l\'emoglobina, con quattro catene, e la scoperta che cambia forma quando ' +
          'lega l\'ossigeno: la base strutturale del legame cooperativo.' },

    { re: /crystallograph|x.?ray.*structure|structures of.*important biochemical substances/i,
      tit: 'Cristallografia a raggi X delle molecole complesse',
      sp: 'I raggi X diffratti da un cristallo portano l\'informazione sulla ' +
          'posizione di ogni atomo, ma in forma indiretta: dal diagramma di ' +
          'diffrazione alla struttura c\'è un problema matematico — le <b>fasi</b> ' +
          'perdute — da risolvere. Risolto, si ottengono le coordinate atomiche di ' +
          'molecole che nessun metodo chimico avrebbe potuto chiarire: la ' +
          'penicillina, la vitamina B₁₂ con il suo cobalto, l\'insulina. La ' +
          'struttura cessa di essere una deduzione e diventa una misura.' },

    { re: /super.?resolved|super.?resolution|nanoscopy/i,
      tit: 'Microscopia a fluorescenza in super-risoluzione',
      sp: 'Un microscopio ottico non distingue due punti più vicini di circa metà ' +
          'della lunghezza d\'onda, circa 200 nm: è il <b>limite di diffrazione</b>, ' +
          'e taglia fuori quasi tutto quello che succede dentro una cellula. Due ' +
          'strade lo aggirano usando la fluorescenza. Nella prima, un secondo ' +
          'fascio a forma di ciambella spegne per emissione stimolata le molecole ' +
          'intorno al punto illuminato, e la zona che resta fluorescente è molto ' +
          'più piccola del limite. Nella seconda si accendono poche molecole alla ' +
          'volta, abbastanza rade da apparire isolate: il <b>centro</b> di ciascuna ' +
          'macchia si localizza con la precisione di una decina di nanometri, e ' +
          'sommando migliaia di fotogrammi si costruisce l\'immagine completa.' },

    { re: /partition chromatography/i,
      tit: 'La cromatografia di ripartizione',
      sp: 'Nella cromatografia per adsorbimento le sostanze si separano perché ' +
          'aderiscono più o meno a un solido. Nella <b>ripartizione</b> si separano ' +
          'perché si distribuiscono in modo diverso fra due liquidi che non si ' +
          'mescolano: uno trattenuto immobile su un supporto, come gel di silice ' +
          'imbevuto d\'acqua o una striscia di carta, l\'altro che scorre. Ogni ' +
          'sostanza ha il suo coefficiente di ripartizione, e la colonna funziona ' +
          'come una lunghissima serie di estrazioni successive: trattandone gli ' +
          'stadi come i piatti di una colonna di distillazione, la teoria prevede ' +
          'la larghezza delle bande. Ne derivano la cromatografia su carta, con cui ' +
          'si separano gli amminoacidi di una proteina idrolizzata, e la ' +
          '<b>gascromatografia</b>, in cui la fase mobile è un gas.' },

    { re: /chromatograph/i,
      tit: 'La cromatografia',
      sp: 'Separare i componenti di una miscela facendoli migrare attraverso un ' +
          'mezzo in cui ciascuno è trattenuto <b>in modo diverso</b>: chi ha più ' +
          'affinità per la fase ferma resta indietro, chi ne ha meno corre con il ' +
          'solvente. Da un\'idea così semplice viene la tecnica analitica più usata ' +
          'in assoluto, e — cosa che conta per la chimica dei prodotti naturali — ' +
          'la possibilità di ottenere in forma pura sostanze presenti in tracce, ' +
          'che prima si potevano solo ipotizzare.' },

    { re: /electrophoresis|adsorption analysis/i,
      tit: 'Elettroforesi e analisi per adsorbimento',
      sp: 'Le proteine in soluzione portano una carica che dipende dal pH: in un ' +
          'campo elettrico <b>migrano a velocità diverse</b>, e si separano. Con un ' +
          'apparecchio a confine mobile, che segue otticamente i fronti delle ' +
          'diverse proteine lungo il tubo, il siero si divide in albumina e in tre ' +
          'gruppi di globuline, α, β e γ, e gli anticorpi si rivelano concentrati ' +
          'nella frazione γ. Con le tecniche di adsorbimento si ottiene lo stesso ' +
          'risultato per altra via. Il punto non è solo tecnico: prima non si ' +
          'sapeva nemmeno se il siero contenesse una proteina o molte. Separandole ' +
          'si scopre che sono una famiglia, e la biochimica delle proteine può ' +
          'cominciare.' },

    { re: /polarograph|electrochemical.*analysis/i,
      tit: 'Polarografia',
      sp: 'Si immerge nella soluzione un elettrodo a goccia di mercurio che si ' +
          'rinnova continuamente — così la superficie è sempre pulita — e si ' +
          'aumenta gradualmente la tensione. Quando si raggiunge il potenziale a ' +
          'cui una specie si riduce, la corrente sale a gradino: il ' +
          '<b>potenziale</b> a metà del gradino dice che cosa c\'è, la sua ' +
          '<b>altezza</b> quanto ce n\'è, perché la corrente limite è controllata ' +
          'dalla diffusione ed è proporzionale alla concentrazione. Più specie ' +
          'nella stessa soluzione danno gradini distinti, e si scende a ' +
          'concentrazioni dell\'ordine di 10⁻⁵ mol/L; l\'ossigeno disciolto, che ' +
          'darebbe un segnale proprio, si elimina facendo gorgogliare azoto. ' +
          'Un\'analisi quantitativa su quantità minime, e la nascita ' +
          'dell\'elettroanalisi.' },

    { re: /disperse systems|ultracentrifug/i,
      tit: 'Sistemi dispersi e ultracentrifuga',
      sp: 'Per pesare particelle troppo piccole per qualunque bilancia si usa la ' +
          'gravità, moltiplicata: in un\'<b>ultracentrifuga</b> che gira a decine di ' +
          'migliaia di giri al minuto, il campo raggiunge centinaia di migliaia di ' +
          'volte quello terrestre, e anche le proteine sedimentano. Seguendo ' +
          'otticamente il confine che si sposta, dalla velocità di sedimentazione e ' +
          'dalla diffusione — oppure dall\'equilibrio che si stabilisce fra ' +
          'sedimentazione e diffusione — si ricava la massa molare. Il risultato ' +
          'più importante è che l\'emoglobina sedimenta come un\'unica specie di ' +
          'circa 65 000 g/mol: le proteine non sono aggregati di dimensione ' +
          'variabile, ma <b>molecole</b> ben definite.' },

    { re: /colloid|disperse system|ultramicroscop|sedimentation/i,
      tit: 'Sistemi colloidali',
      sp: 'Fra una soluzione vera e una sospensione grossolana c\'è un mondo ' +
          'intermedio: particelle troppo piccole per essere viste al microscopio ' +
          'ottico e troppo grandi per comportarsi come molecole. Illuminandole di ' +
          'lato si vedono come punti luminosi, e si può contarle; con la ' +
          '<b>centrifuga</b> ad alta velocità si misura la loro massa dalla ' +
          'velocità di sedimentazione. È lo strumento con cui si dimostra che le ' +
          'proteine hanno una massa definita, cioè che sono molecole.' },



    /* ── Biochimica ────────────────────────────────────────────────────── */
    { re: /photosynthetic reaction cent/i,
      tit: 'Il centro di reazione fotosintetico',
      sp: 'Il centro di reazione è il complesso di membrana in cui la luce ' +
          'assorbita diventa una separazione di carica. Fu la prima <b>proteina di ' +
          'membrana</b> di cui si sia risolta la struttura atomica — un\'impresa, ' +
          'perché queste proteine, metà immerse in un ambiente lipidico, sono ' +
          'difficilissime da cristallizzare. La struttura, di un batterio ' +
          'fotosintetico, mostra eliche che attraversano la membrana e cofattori ' +
          'disposti in due rami quasi simmetrici: una <b>coppia speciale</b> di ' +
          'batterioclorofille, clorofille accessorie, feofitine, chinoni. ' +
          'L\'elettrone eccitato percorre però un solo ramo, e in pochi picosecondi ' +
          'arriva dall\'altra parte della membrana: un trasferimento di elettroni ' +
          'così rapido da battere la ricombinazione.' },

    { re: /photosynthesis|carbon dioxide assimilation|photosynthetic reaction cent/i,
      tit: 'Fotosintesi: dal carbonio fissato al centro di reazione',
      sp: 'Come una pianta trasforma anidride carbonica in zucchero è stato ' +
          'chiarito con il carbonio radioattivo: si somministra CO₂ marcata, si ' +
          'ferma la pianta dopo tempi crescenti e si guarda <b>in quale ordine</b> ' +
          'compare la marcatura nei metaboliti. Ne esce il ciclo di fissazione del ' +
          'carbonio. L\'altra metà del problema è la luce, e lì serve la struttura: ' +
          'il <b>centro di reazione fotosintetico</b> risolto atomo per atomo ' +
          'mostra come un fotone separa una carica attraverso la membrana, cioè ' +
          'come la luce diventa energia chimica.' },

    { re: /fodder|agricultural and nutrition chemistry/i,
      tit: 'Chimica agraria: la conservazione del foraggio',
      sp: 'L\'erba fresca conservata per l\'inverno si deteriora: la respirazione ' +
          'delle cellule vegetali e le fermentazioni batteriche consumano zuccheri ' +
          'e proteine e producono ammoniaca e acido butirrico. Il metodo premiato è ' +
          'semplice e chimico: si <b>acidifica</b> il foraggio con acidi minerali ' +
          'diluiti fino a un pH intorno a 4 o meno, a cui gli enzimi della pianta e ' +
          'i batteri della putrefazione si fermano. Il foraggio insilato così ' +
          'conserva proteine, carotene e vitamine, e il latte delle vacche che lo ' +
          'mangiano resta ricco di vitamina A anche d\'inverno. Allo stesso filone ' +
          'appartiene lo studio della <b>fissazione dell\'azoto</b> nei noduli ' +
          'radicali delle leguminose.' },

    { re: /enzymes can be crystalli[sz]ed/i,
      tit: 'Gli enzimi si possono cristallizzare',
      sp: 'Che cosa fosse chimicamente un enzima era discusso: molti pensavano che ' +
          'l\'attività appartenesse a una piccola molecola misteriosa, trasportata ' +
          'da una proteina che faceva solo da supporto. Poi da un estratto di semi ' +
          'di una leguminosa si ottengono cristalli di <b>ureasi</b>, l\'enzima che ' +
          'idrolizza l\'urea, CO(NH₂)₂ + H₂O → CO₂ + 2NH₃; i cristalli sono di ' +
          'proteina, e sciolti hanno l\'attività catalitica. È la prova che l\'enzima ' +
          '<b>è</b> una proteina. Il risultato fu accolto con scetticismo per anni; ' +
          'oggi si sa anche che l\'ureasi contiene due ioni nichel nel sito attivo, ' +
          'ed è stato il primo enzima al nichel identificato.' },

    { re: /virus proteins|enzymes and virus/i,
      tit: 'Enzimi e virus allo stato puro',
      sp: 'Cristallizzare un enzima non basta: bisogna dimostrare che l\'attività ' +
          'non è un\'impurezza trascinata. Il criterio è che, cristallizzando ' +
          'ripetutamente pepsina, tripsina o chimotripsina, l\'attività per ' +
          'milligrammo di proteina resti <b>costante</b>: attività e proteina non ' +
          'si separano perché sono la stessa cosa. Lo stesso approccio applicato al ' +
          'virus del mosaico del tabacco produce una sostanza cristallina che, ' +
          'sciolta e inoculata in una foglia, riproduce la malattia. Un agente ' +
          'infettivo si comporta come una <b>molecola</b> isolabile: è una ' +
          'nucleoproteina, e in seguito si mostrerà che la parte infettiva è il suo ' +
          'acido nucleico.' },

    { re: /fermentation of sugar|fermentative enzymes/i,
      tit: 'La fermentazione e i coenzimi',
      sp: 'Il succo di lievito fermenta lo zucchero anche senza cellule; ma se lo ' +
          'si dializza, separando le molecole grandi da quelle piccole, nessuna ' +
          'delle due frazioni fermenta da sola. Riunite, sì: l\'enzima proteico ha ' +
          'bisogno di un <b>cofattore</b> piccolo e resistente al calore. Quella ' +
          'frazione, la cozimasi, è il dinucleotide oggi chiamato NAD⁺, portatore ' +
          'di idrogeno nelle ossidoriduzioni. Insieme si scopre che serve il ' +
          '<b>fosfato</b>: lo zucchero viene fosforilato, e fra gli intermedi ' +
          'compaiono esosi fosfati come il fruttosio 1,6-bisfosfato. Sono i primi ' +
          'pezzi della glicolisi, la via con cui ogni cellula ricava energia dal ' +
          'glucosio.' },

    { re: /cell.?free fermentation/i,
      tit: 'La fermentazione senza cellule',
      sp: 'Il lievito trasforma lo zucchero in alcol e anidride carbonica, C₆H₁₂O₆ ' +
          '→ 2C₂H₅OH + 2CO₂, e si pensava che servisse la cellula viva: la ' +
          'fermentazione come manifestazione della vita stessa. Macinando il ' +
          'lievito con sabbia e spremendone il succo sotto pressione si ottiene ' +
          'invece un liquido privo di cellule che <b>fermenta</b> lo zucchero ' +
          'ugualmente. Il responsabile è un insieme di sostanze, chiamato zimasi, ' +
          'che si separano dalle cellule e lavorano in provetta. È la nascita della ' +
          '<b>biochimica</b> come chimica dei processi vitali condotta fuori ' +
          'dall\'organismo: da allora ogni via metabolica si studia ricostruendola ' +
          'con estratti e componenti purificati.' },

    { re: /sugar nucleotides/i,
      tit: 'Gli zuccheri nucleotidi e la biosintesi dei carboidrati',
      sp: 'Per costruire un polisaccaride la cellula non usa lo zucchero libero: ' +
          'prima lo <b>attiva</b>, legandolo a un nucleotide. L\'UDP-glucosio, ' +
          'glucosio unito a uridina difosfato, è il donatore da cui si allunga il ' +
          'glicogeno; la demolizione, che usa il fosfato inorganico, segue un\'altra ' +
          'reazione, e questa separazione delle due vie permette di regolarle in ' +
          'modo indipendente. Sugli zuccheri nucleotidi avvengono anche le ' +
          'trasformazioni fra zuccheri: il galattosio diventa glucosio per ' +
          '<b>epimerizzazione</b> dell\'UDP-galattosio, e un difetto di questa via ' +
          'dà la galattosemia. La stessa logica di attivazione vale per l\'amido, la ' +
          'cellulosa e gli zuccheri delle glicoproteine.' },

    { re: /nucleotide co.?enzymes|work on nucleotides/i,
      tit: 'Nucleotidi e coenzimi nucleotidici',
      sp: 'Un nucleotide è una base azotata legata a uno zucchero, a sua volta ' +
          'esterificato con acido fosforico. Stabilirne la struttura con certezza ' +
          'richiedeva la <b>sintesi</b>, e la sintesi richiedeva una chimica del ' +
          'fosfato che non esisteva: gruppi protettori per gli ossidrili dello ' +
          'zucchero, reagenti per fosforilare in modo selettivo, metodi per unire ' +
          'due fosfati. Così si preparano ATP, ADP e i coenzimi che contengono ' +
          'nucleotidi, come il FAD, e si dimostra che negli acidi nucleici i ' +
          'nucleotidi sono uniti da ponti <b>fosfodiesterei</b> fra la posizione 3′ ' +
          'di uno zucchero e la 5′ del successivo: lo scheletro del DNA su cui ' +
          'poggia la doppia elica.' },

    { re: /ribozyme|catalytic properties of rna|rna.*catalyt/i,
      tit: 'RNA catalitico',
      sp: 'La divisione dei compiti sembrava netta: gli acidi nucleici conservano ' +
          'l\'informazione, le proteine fanno il lavoro. Poi si scopre che certe ' +
          'molecole di RNA <b>tagliano e ricuciono se stesse</b> senza alcuna ' +
          'proteina: sono catalizzatori. Oltre a essere una sorpresa ' +
          'meccanicistica, cambia la storia delle origini: una molecola che porta ' +
          'informazione <i>e</i> catalizza può aver preceduto la divisione dei ' +
          'ruoli. E il ribosoma stesso, visto nel dettaglio, si rivela un ribozima.' },

    { re: /ribosome/i,
      tit: 'La struttura del ribosoma',
      sp: 'Il ribosoma legge l\'RNA messaggero e costruisce la proteina ' +
          'corrispondente: è la macchina che traduce l\'informazione genetica in ' +
          'chimica. Risolverne la struttura ha richiesto di cristallizzare un ' +
          'complesso da centinaia di migliaia di atomi, fatto di RNA e proteine ' +
          'insieme. Il risultato mostra che il legame peptidico viene formato in un ' +
          'sito fatto di <b>RNA</b>, non di proteina — e mostra dove si attaccano ' +
          'molti antibiotici, cioè perché funzionano e come nascono le resistenze.' },

    { re: /site.?directed mutagenesis/i,
      tit: 'Mutagenesi sito-diretta',
      sp: 'Per capire a che cosa serve un singolo amminoacido di una proteina ' +
          'bisogna poterlo cambiare, e solo quello. Si sintetizza un breve ' +
          'oligonucleotide complementare al gene in quel punto, ma con <b>una base ' +
          'sbagliata</b>; lo si appaia al DNA a filamento singolo di un fago che ' +
          'porta il gene, e la DNA polimerasi lo allunga copiando il resto del ' +
          'filamento. Dopo la replicazione nelle cellule, una parte della progenie ' +
          'porta la mutazione voluta. Cambiare un residuo del sito attivo e ' +
          'misurare l\'effetto sulla catalisi o sulla stabilità diventa un ' +
          'esperimento di routine: è la nascita dell\'<b>ingegneria proteica</b>, da ' +
          'cui vengono enzimi industriali più stabili e anticorpi migliorati.' },

    { re: /polymerase chain reaction|site.?directed mutagenesis|oligonucleotide|dna.?based chemistry/i,
      tit: 'Moltiplicare e riscrivere il DNA',
      sp: 'Due invenzioni che rendono il DNA una materia da laboratorio. La prima ' +
          'moltiplica una sequenza scelta per cicli di riscaldamento e ' +
          'raffreddamento: ad ogni ciclo le copie raddoppiano, e da una molecola si ' +
          'arriva a miliardi in un\'ora. La seconda <b>cambia un singolo ' +
          'amminoacido</b> in una proteina, a scelta: si modifica il gene in un ' +
          'punto preciso e si guarda che cosa smette di funzionare. È il modo in ' +
          'cui si dimostra che un residuo del sito attivo serve davvero.' },

    { re: /recombinant.?dna|biochemistry of nucleic acids/i,
      tit: 'Il DNA ricombinante',
      sp: 'Il DNA di due organismi diversi si può tagliare e ricucire in una sola ' +
          'molecola. Gli strumenti sono enzimi batterici: gli <b>enzimi di ' +
          'restrizione</b>, che tagliano in corrispondenza di sequenze brevi e ' +
          'specifiche, e le ligasi, che riuniscono i frammenti. Il primo DNA ' +
          'ricombinante unisce il genoma di un virus animale con quello di un fago. ' +
          'Da lì si possono inserire geni in plasmidi, moltiplicarli nei batteri e ' +
          'farli esprimere: insulina umana prodotta da batteri, vaccini ' +
          'ricombinanti, tutta la biotecnologia. Le stesse ricerche toccano la ' +
          'biochimica degli acidi nucleici e della traduzione, e aprono il primo ' +
          'dibattito pubblico sulla <b>sicurezza</b> degli esperimenti genetici.' },

    { re: /base sequences in nucleic acids|sequencing of dna|dna sequencing/i,
      tit: 'Sequenziare il DNA',
      sp: 'Due metodi, diversi nella chimica e uguali nel principio, permettono di ' +
          'leggere il DNA base per base. Nel primo si marca un\'estremità del ' +
          'frammento e lo si taglia con reazioni chimiche che rompono la catena in ' +
          'corrispondenza di una base specifica. Nel secondo si copia il filamento ' +
          'con la DNA polimerasi in presenza di piccole quantità di ' +
          '<b>didesossinucleotidi</b>, privi dell\'ossidrile in 3′: quando uno viene ' +
          'incorporato la catena si ferma. In entrambi i casi si ottiene una scala ' +
          'di frammenti che finiscono a una base nota; separati per ' +
          '<b>elettroforesi</b> su gel con la risoluzione di un singolo nucleotide, ' +
          'danno la sequenza. Il secondo metodo, automatizzato, ha letto il primo ' +
          'genoma umano.' },

    { re: /structure of proteins,? especially that of insulin/i,
      tit: 'La sequenza dell\'insulina',
      sp: 'Che una proteina avesse una sequenza di amminoacidi ben definita, uguale ' +
          'in ogni molecola, non era scontato. Per dimostrarlo con l\'insulina si ' +
          'marca il gruppo amminico terminale di ogni catena con un reagente ' +
          'colorato, il dinitrofluorobenzene, che resta attaccato dopo l\'idrolisi e ' +
          'identifica l\'amminoacido iniziale; poi si taglia la proteina in ' +
          'frammenti sovrapposti, con acidi ed enzimi, e si ricostruisce l\'ordine ' +
          'come in un puzzle. Risultato: due catene, di 21 e 30 amminoacidi, unite ' +
          'da <b>ponti disolfuro</b>, con una sequenza precisa che varia da specie ' +
          'a specie solo in pochi punti. È la prova che le proteine hanno una ' +
          '<b>struttura primaria</b> determinata, cioè scritta da qualche parte: ' +
          'nel gene.' },

    { re: /amino acid sequence and the biologically active conformation|work on ribonuclease/i,
      tit: 'La sequenza decide il ripiegamento',
      sp: 'La ribonucleasi è un piccolo enzima con quattro ponti disolfuro. ' +
          'Trattata con urea e con un riducente si srotola, i ponti si rompono e ' +
          'l\'attività scompare. Tolto il denaturante e lasciati riformare i ponti ' +
          'all\'aria, l\'enzima torna attivo quasi del tutto: delle 105 combinazioni ' +
          'con cui otto cisteine possono accoppiarsi in quattro ponti, si riforma ' +
          '<b>quella giusta</b>. Nessuna informazione esterna è stata fornita, ' +
          'quindi la forma nativa è scritta nella <b>sequenza</b>: è lo stato di ' +
          'minima energia libera accessibile alla catena. Da questa ipotesi ' +
          'termodinamica discendono sia lo studio del ripiegamento proteico sia, ' +
          'molto più tardi, la previsione della struttura dalla sola sequenza.' },

    { re: /active cent(re|er) of the ribonuclease/i,
      tit: 'Il sito attivo della ribonucleasi',
      sp: 'Per capire come lavora un enzima bisogna sapere quali amminoacidi lo ' +
          'compongono e in quale ordine. La ribonucleasi, 124 residui, è il primo ' +
          'enzima di cui si determina la sequenza completa, con un analizzatore ' +
          'automatico che separa gli amminoacidi per cromatografia a scambio ionico ' +
          'e li dosa con una reazione colorata. Confrontando sequenza, ' +
          'modificazioni chimiche selettive e attività si individua il <b>sito ' +
          'attivo</b>: due istidine, lontane nella catena ma vicine nella proteina ' +
          'ripiegata, lavorano una come base e l\'altra come acido. L\'RNA viene ' +
          'tagliato passando per un fosfato ciclico 2′,3′ intermedio: un meccanismo ' +
          'di <b>catalisi acido-base</b> generale descritto residuo per residuo.' },

    { re: /transcription/i,
      tit: 'Le basi molecolari della trascrizione',
      sp: 'Nelle cellule eucariotiche il DNA che codifica le proteine viene ' +
          'trascritto in RNA messaggero dalla RNA polimerasi II, un complesso di ' +
          'dodici subunità che da solo non basta: servono fattori generali di ' +
          'trascrizione e un grande complesso regolatore, il mediatore, che ' +
          'trasmette i segnali dei regolatori genici. Le strutture ' +
          'cristallografiche della polimerasi in piena attività mostrano il DNA che ' +
          'entra, la <b>bolla di trascrizione</b> in cui i due filamenti sono ' +
          'separati, un breve ibrido DNA-RNA di otto o nove coppie di basi e l\'RNA ' +
          'nascente che esce da un canale; mostrano anche il nucleotide che sta per ' +
          'essere aggiunto. È la fotografia del momento in cui l\'informazione ' +
          'genetica viene <b>letta</b>.' },

    { re: /dna repair/i,
      tit: 'I meccanismi di riparazione del DNA',
      sp: 'Il DNA è una molecola chimicamente fragile: ogni giorno in una cellula ' +
          'si perdono basi, le citosine si deaminano spontaneamente a uracile, la ' +
          'luce ultravioletta unisce due timine vicine in un dimero. Tre sistemi ' +
          'tengono sotto controllo il danno. Nella <b>riparazione per escissione di ' +
          'base</b> un enzima riconosce la base sbagliata, la stacca e il vuoto ' +
          'viene riempito. La riparazione per escissione di nucleotidi taglia un ' +
          'tratto di filamento attorno a una lesione voluminosa, come un dimero di ' +
          'timina, e lo risintetizza. La <b>riparazione degli appaiamenti ' +
          'errati</b> corregge gli errori della replicazione riconoscendo quale dei ' +
          'due filamenti è quello nuovo. Quando questi sistemi si guastano aumenta ' +
          'il rischio di tumori.' },

    { re: /green fluorescent protein/i,
      tit: 'La proteina fluorescente verde',
      sp: 'Una proteina di medusa che emette luce verde, e che — questo è il punto ' +
          '— costruisce il proprio cromoforo da sé, senza bisogno di cofattori. ' +
          'Quindi si può <b>attaccare il suo gene</b> al gene di qualunque altra ' +
          'proteina e guardare, in una cellula viva, dove quella proteina va e ' +
          'quando viene prodotta. Con le varianti di colore ottenute per mutazione ' +
          'si seguono più proteine contemporaneamente. Da reagente di nicchia a ' +
          'strumento ordinario della biologia cellulare.' },

    { re: /ubiquitin|protein degradation/i,
      tit: 'Degradazione delle proteine mediata da ubiquitina',
      sp: 'Le proteine non si limitano a essere prodotte: vengono <b>eliminate</b> ' +
          'quando servono, e l\'eliminazione è regolata con la stessa precisione ' +
          'della sintesi. Il marchio è una piccola proteina di 76 amminoacidi, ' +
          'l\'ubiquitina, attaccata in catena al bersaglio da una cascata di tre ' +
          'enzimi: uno la attiva consumando ATP, uno la trasporta, e un terzo — di ' +
          'cui esistono centinaia di tipi diversi — riconosce la proteina da ' +
          'colpire. La catena di ubiquitine indirizza il bersaglio al ' +
          '<b>proteasoma</b>, che lo smonta in peptidi. Spiega come si controlla il ' +
          'ciclo cellulare e come si tolgono di mezzo le proteine mal ripiegate — e ' +
          'dà bersagli terapeutici reali, come gli inibitori del proteasoma usati ' +
          'contro il mieloma.' },

    { re: /water channels?|aquaporin/i,
      tit: 'I canali per l\'acqua: le acquaporine',
      sp: 'Che l\'acqua attraversasse le membrane solo per diffusione attraverso il ' +
          'doppio strato lipidico non bastava a spiegare la velocità con cui passa ' +
          'nei globuli rossi e nel rene. La proteina responsabile, ' +
          'l\'<b>acquaporina</b>, si dimostra con un esperimento semplice: ovociti ' +
          'di rana che la producono si gonfiano e scoppiano in acqua diluita, ' +
          'quelli normali no. La struttura mostra un poro a clessidra in cui le ' +
          'molecole d\'acqua passano in fila indiana, fino a miliardi al secondo; al ' +
          'centro, una carica positiva e l\'orientamento dei dipoli delle eliche ' +
          'impediscono il passaggio dei <b>protoni</b>, che altrimenti salterebbero ' +
          'lungo la fila di molecole. Nel rene questi canali recuperano gran parte ' +
          'dell\'acqua filtrata.' },

    { re: /ion channel|aquaporin|water channel|membrane channel/i,
      tit: 'Canali di membrana: acqua e ioni',
      sp: 'Una membrana lipidica è impermeabile all\'acqua e agli ioni, e una ' +
          'cellula deve farli passare in modo regolato. Lo fa con proteine che ' +
          'formano pori estremamente selettivi: un canale per l\'acqua che passa ' +
          'miliardi di molecole al secondo e <b>respinge i protoni</b>, e canali ' +
          'per il potassio che distinguono il potassio dal sodio pur essendo ' +
          'quest\'ultimo più piccolo. La selettività si capisce solo vedendo la ' +
          'struttura: la geometria del poro compensa esattamente l\'energia che lo ' +
          'ione perde lasciando l\'acqua.' },

    { re: /chemiosmotic|biological energy transfer/i,
      tit: 'La teoria chemiosmotica',
      sp: 'Come l\'energia dell\'ossidazione degli alimenti diventa ATP? Si cercava ' +
          'un intermedio chimico ad alta energia, e non lo si trovava. La risposta ' +
          'è che l\'intermedio non è una molecola ma un <b>gradiente</b>: la catena ' +
          'respiratoria pompa protoni attraverso la membrana interna del ' +
          'mitocondrio, e la differenza di pH e di potenziale elettrico che ne ' +
          'risulta — la <b>forza proton-motrice</b>, circa 0,2 V — spinge i protoni ' +
          'a rientrare attraverso l\'ATP sintasi. Lo confermano le sostanze ' +
          'disaccoppianti, che rendono la membrana permeabile ai protoni e bloccano ' +
          'la sintesi di ATP senza fermare la respirazione, e l\'ATP prodotto da ' +
          'cloroplasti a cui si impone artificialmente un salto di pH.' },

    { re: /ion.?transporting enzyme|atpase/i,
      tit: 'La pompa sodio-potassio',
      sp: 'Dentro una cellula c\'è molto potassio e poco sodio, fuori il contrario: ' +
          'un dislivello mantenuto contro la diffusione, quindi pagato con energia. ' +
          'Il responsabile è un enzima di membrana che per ogni molecola di ATP ' +
          'idrolizzata porta <b>tre ioni Na⁺ fuori e due K⁺ dentro</b>. Durante il ' +
          'ciclo l\'enzima si fosforila su un acido aspartico e cambia ' +
          'conformazione, aprendosi alternativamente verso l\'interno e verso ' +
          'l\'esterno. Lo squilibrio di carica contribuisce al potenziale di ' +
          'membrana, e il gradiente di sodio alimenta il trasporto di glucosio e ' +
          'amminoacidi. La pompa consuma una frazione cospicua dell\'ATP di un ' +
          'organismo a riposo, ed è il bersaglio dei <b>glicosidi cardiaci</b> come ' +
          'la digossina.' },

    { re: /atp synthase|enzymatic mechanism underlying the synthesis of adenosine triphosphate|ion.?transporting/i,
      tit: 'Come si fabbrica l\'ATP',
      sp: 'L\'energia della respirazione non viene usata direttamente per fare ATP: ' +
          'viene usata per <b>pompare protoni</b> attraverso una membrana, creando ' +
          'un dislivello di concentrazione e di carica. Quei protoni poi rientrano ' +
          'attraverso un enzima che, girando come una turbina, costringe i suoi ' +
          'siti catalitici a cambiare forma a turno e a condensare ADP e fosfato. ' +
          'Un gradiente di protoni come valuta energetica, e un motore rotante ' +
          'dentro una proteina: entrambe le cose sono state contestate prima di ' +
          'essere dimostrate.' },

    { re: /g.?protein.?coupled receptor/i,
      tit: 'I recettori accoppiati a proteine G',
      sp: 'Una cellula deve sapere che fuori c\'è un ormone, un odore o la luce, ' +
          'senza che quella molecola entri. Ci riesce con recettori che ' +
          'attraversano la membrana sette volte: il segnale si lega fuori, la ' +
          'proteina <b>cambia forma</b>, e dentro attiva una proteina G che innesca ' +
          'la cascata. Sono la famiglia di recettori più numerosa del genoma umano ' +
          'e il bersaglio di una grossa fetta dei farmaci in commercio: vederne la ' +
          'struttura nei due stati, attivo e inattivo, spiega come un agonista ' +
          'differisce da un antagonista.' },

    { re: /phage display/i,
      tit: 'Phage display di peptidi e anticorpi',
      sp: 'Per trovare in una collezione di miliardi di varianti quella che lega un ' +
          'bersaglio serve un legame fisico fra la proteina e il gene che la ' +
          'codifica. Un fago filamentoso lo offre: inserendo un gene nel gene di ' +
          'una proteina del suo rivestimento, il peptide corrispondente viene ' +
          '<b>esposto</b> sulla superficie del virus, mentre il gene sta dentro. Si ' +
          'mette la libreria a contatto con il bersaglio immobilizzato, si lavano ' +
          'via i fagi che non legano, si moltiplicano quelli rimasti e si ripete: ' +
          'dopo pochi cicli restano i leganti migliori, e se ne legge la sequenza. ' +
          'Applicato ai frammenti di anticorpo, il metodo produce <b>anticorpi ' +
          'interamente umani</b>, diventati farmaci contro malattie autoimmuni e ' +
          'tumori.' },

    { re: /directed evolution|phage display/i,
      tit: 'Evoluzione diretta',
      sp: 'Progettare un enzima da zero è difficilissimo; <b>far evolvere</b> uno ' +
          'che esiste è praticabile. Si introducono mutazioni casuali nel gene, si ' +
          'producono migliaia di varianti, si seleziona quella che fa meglio il ' +
          'lavoro voluto, e si ripete. Lo stesso schema applicato ai peptidi ' +
          'esposti sulla superficie di un virus permette di cercare, in librerie ' +
          'enormi, quello che si lega a un bersaglio dato. Si ottengono ' +
          'catalizzatori e anticorpi che la natura non ha mai fatto, usando il ' +
          'meccanismo della natura.' },

    { re: /genome editing|crispr/i,
      tit: 'Riscrivere il genoma',
      sp: 'Un sistema di difesa dei batteri contro i virus si rivela uno strumento ' +
          'generale: una proteina che taglia il DNA, guidata al punto giusto da una ' +
          'piccola molecola di <b>RNA</b> complementare alla sequenza bersaglio. ' +
          'Cambiando l\'RNA guida si cambia il bersaglio: è una forbice ' +
          'programmabile scrivendo venti lettere. Da lì la modifica di un gene in ' +
          'un punto scelto diventa una procedura di laboratorio ordinaria, con ' +
          'tutto quello che ne segue in medicina e in agricoltura, e le questioni ' +
          'etiche che ne sono venute.' },

    { re: /peptide hormone|sulphur compounds.*biochemically important|oxytocin/i,
      tit: 'Ormoni peptidici, sintetizzati',
      sp: 'Alcuni ormoni sono peptidi corti con un ponte disolfuro. L\'ossitocina, ' +
          'che provoca le contrazioni dell\'utero e l\'emissione del latte, è fatta ' +
          'di nove amminoacidi, chiusi ad anello da un legame S–S fra due cisteine; ' +
          'la vasopressina, che regola il riassorbimento dell\'acqua nel rene, ' +
          'differisce solo in due posizioni. Isolarli dai tessuti dà quantità ' +
          'minime; la dimostrazione che la struttura proposta è giusta — e la via ' +
          'per averne in quantità utile — è <b>rifarli per sintesi</b>, legame per ' +
          'legame, nell\'ordine giusto. Riuscirci per il primo ormone polipeptidico ' +
          'apre la sintesi peptidica come disciplina, e con essa l\'intera industria ' +
          'dei farmaci peptidici; lo stesso lavoro chiarisce altre molecole ' +
          'solforate di importanza biologica, come la biotina.' },

    { re: /sex hormones/i,
      tit: 'Gli ormoni sessuali',
      sp: 'Gli ormoni sessuali circolano in quantità infinitesimali: per isolarne ' +
          'qualche decina di milligrammi servivano migliaia di litri di urina o le ' +
          'ovaie di decine di migliaia di animali. Il lavoro chimico consiste nel ' +
          'purificarli, guidati da saggi biologici, e nel determinarne la ' +
          'struttura: estrone, androsterone, testosterone e progesterone hanno ' +
          'tutti lo <b>scheletro steroideo</b> a quattro anelli. Le differenze che ' +
          'separano un ormone maschile da uno femminile sono minime — un gruppo ' +
          'chetonico al posto di un ossidrile, un anello aromatico, un metile in ' +
          'meno — e la loro <b>interconversione</b> chimica lo dimostra. Da qui la ' +
          'produzione per semisintesi e, più avanti, i contraccettivi orali.' },

    { re: /constitution of the sterols|connection with the vitamins/i,
      tit: 'Steroli e vitamina D',
      sp: 'Il rachitismo si curava con l\'olio di fegato di merluzzo oppure con la ' +
          'luce del sole, e il collegamento fra le due cure è chimico. Certi ' +
          'steroli, irradiati con l\'ultravioletto, diventano vitamina D: ' +
          'l\'ergosterolo dei lieviti dà la vitamina D₂, il 7-deidrocolesterolo ' +
          'della pelle la D₃. La luce apre l\'anello B dello scheletro steroideo con ' +
          'una <b>reazione fotochimica</b> elettrociclica, e il prodotto si ' +
          'riarrangia termicamente nella vitamina: la vitamina D non è una vitamina ' +
          'in senso stretto, perché l\'organismo la produce se ha luce sufficiente. ' +
          'Stabilire la struttura degli <b>steroli</b> e la loro relazione con la ' +
          'vitamina ha reso possibile prevenire il rachitismo con alimenti ' +
          'irradiati.' },

    { re: /cholesterol|steroid|bile acid|sterol/i,
      tit: 'Steroidi e acidi biliari',
      sp: 'Colesterolo, acidi biliari e ormoni sessuali hanno in comune uno ' +
          'scheletro di quattro anelli condensati, tre a sei atomi e uno a cinque. ' +
          'Stabilirne la struttura è stato un lavoro di anni di degradazioni ' +
          'chimiche controllate, prima che la cristallografia esistesse: si rompe ' +
          'la molecola in modi noti e si ricostruisce l\'origine dai frammenti. La ' +
          'prima formula proposta era sbagliata, e fu corretta quando i dati di ' +
          'diffrazione mostrarono una molecola piatta e allungata. Gli acidi ' +
          'biliari hanno gli ossidrili tutti su una faccia dello scheletro: sono ' +
          '<b>anfipatici</b>, ed è per questo che emulsionano i grassi ' +
          'nell\'intestino. Capita la struttura, si capisce la famiglia: una stessa ' +
          'impalcatura e funzioni diversissime a seconda dei gruppi che porta.' },

    { re: /plant pigments/i,
      tit: 'I pigmenti vegetali e la clorofilla',
      sp: 'Il verde delle foglie è una miscela: la clorofilla esiste in due forme, ' +
          'a e b, che differiscono per un solo gruppo — un metile nella prima, ' +
          'un\'aldeide nella seconda. Purificarle in quantità richiede nuovi metodi ' +
          'di estrazione e di ripartizione fra solventi, e porta a un risultato ' +
          'inatteso: al centro della molecola c\'è il <b>magnesio</b>, non il ferro ' +
          'come nell\'eme. Gli stessi metodi chiariscono la chimica degli ' +
          '<b>antociani</b>, i pigmenti rossi, viola e blu di fiori e frutti: una ' +
          'stessa molecola cambia colore a seconda del pH e dei metalli con cui si ' +
          'complessa, ed è per questo che fiori diversi mostrano tinte diverse con ' +
          'pigmenti chimicamente imparentati.' },

    { re: /haemin|chlorophyll|pyrrole|porphyrin/i,
      tit: 'Eme e clorofilla',
      sp: 'Il rosso del sangue e il verde delle foglie sono la stessa idea chimica: ' +
          'un anello di quattro unità pirroliche, unite da ponti di un solo ' +
          'carbonio, che tiene al centro un metallo — ferro nell\'eme, magnesio ' +
          'nella clorofilla. Il macrociclo è coniugato e aromatico, con diciotto ' +
          'elettroni π nel percorso principale, e per questo assorbe la luce con ' +
          'un\'intensità eccezionale. Dimostrarlo ha richiesto di degradare le due ' +
          'molecole e poi di <b>risintetizzarle</b>: l\'emina viene costruita a ' +
          'partire da pirroli semplici. Nella clorofilla, inoltre, uno degli anelli ' +
          'è parzialmente ridotto. Il risultato collega due mondi che sembravano ' +
          'lontani, trasporto dell\'ossigeno e cattura della luce, e inaugura la ' +
          'chimica dei complessi tetrapirrolici.' },

    { re: /carbohydrates and vitamin c|vitamin c\b/i,
      tit: 'Carboidrati in anello e vitamina C',
      sp: 'Uno zucchero come il glucosio, in soluzione, non è quasi mai una catena ' +
          'aperta: l\'ossidrile in posizione 5 attacca il carbonile e chiude un ' +
          '<b>anello</b> a sei termini, la piranosi, oppure a cinque, la furanosi. ' +
          'Stabilire le dimensioni degli anelli, e rappresentarli in prospettiva ' +
          'come esagoni visti di sbieco con i sostituenti sopra e sotto il piano, ' +
          'rende leggibile la chimica dei disaccaridi e dei polisaccaridi. Lo ' +
          'stesso lavoro porta alla struttura dell\'<b>acido ascorbico</b>, la ' +
          'vitamina C — un lattone con un enediolo, acido e riducente — e alla sua ' +
          'sintesi, la prima di una vitamina, da cui viene la produzione ' +
          'industriale. Serve fra l\'altro a formare il collagene, e la sua mancanza ' +
          'dà lo scorbuto.' },

    { re: /carotenoid|vitamin|flavin/i,
      tit: 'Carotenoidi e vitamine',
      sp: 'Sostanze presenti in tracce, indispensabili, e a lungo definite solo dai ' +
          'sintomi della loro mancanza. Il lavoro consiste nell\'isolarle in forma ' +
          'pura — quantità minuscole da materiale biologico — stabilirne la ' +
          'struttura e confermarla per sintesi. I carotenoidi sono polieni con una ' +
          'lunga serie di doppi legami coniugati, undici nel β-carotene: assorbono ' +
          'nel blu e appaiono gialli e arancioni. Ne esce il legame con la vitamina ' +
          'A: il carotene è il <b>precursore</b>, tagliato in due dall\'organismo, e ' +
          'da esso deriva il retinale della visione. Le flavine, come la ' +
          'riboflavina o vitamina B₂, si rivelano invece la parte attiva di ' +
          'coenzimi di ossidoriduzione: il gruppo che accetta e cede idrogeno negli ' +
          'enzimi respiratori.' },

    { re: /sugar|purine|carbohydrate/i,
      tit: 'Zuccheri e purine',
      sp: 'Gli zuccheri hanno molti centri stereogenici e differiscono fra loro ' +
          'solo per la configurazione: un aldoesoso come il glucosio ne ha quattro, ' +
          'quindi sedici stereoisomeri possibili, e distinguerli richiede un ' +
          'metodo, non solo pazienza. Costruirne la <b>gerarchia</b> per via ' +
          'chimica — quale si trasforma in quale, allungando o accorciando la ' +
          'catena con reazioni che non toccano la stereochimica — chiarisce la ' +
          'configurazione dei principali, introduce le proiezioni con cui ancora si ' +
          'disegnano, e fonda la stereochimica dei composti naturali. Lo stesso ' +
          'approccio sulle <b>purine</b> mette ordine fra le basi azotate: acido ' +
          'urico, caffeina, adenina e guanina hanno lo stesso scheletro biciclico, ' +
          'e si possono ottenere per sintesi l\'una dall\'altra.' },

    { re: /alicyclic/i,
      tit: 'I composti aliciclici e i terpeni',
      sp: 'Gli oli essenziali — di limone, di pino, di menta — contengono ' +
          'idrocarburi e alcoli con formule come C₁₀H₁₆ che sembravano un groviglio ' +
          'indistinguibile: gli stessi composti erano descritti con nomi diversi a ' +
          'seconda della pianta. Separandoli, purificandoli e trasformandoli con ' +
          'reazioni controllate se ne riconosce la natura di <b>composti ' +
          'ciclici</b> non aromatici, come limonene, pinene, mentolo e canfora. Ne ' +
          'emerge una regola: le loro formule sono multipli dell\'unità C₅H₈, cioè ' +
          'questi composti sono costruiti con unità di <b>isoprene</b>. La ' +
          'classificazione mette ordine in un campo caotico e fonda l\'industria dei ' +
          'profumi e degli aromi di sintesi.' },

    { re: /polymethylenes|higher terpenes/i,
      tit: 'Grandi anelli e terpeni superiori',
      sp: 'Le sostanze odorose del muschio animale, come muscone e civetone, si ' +
          'rivelano chetoni con anelli di quindici e diciassette atomi di carbonio. ' +
          'Si credeva che anelli così grandi fossero impossibili, perché un anello ' +
          'piano con tanti atomi avrebbe angoli di legame enormemente distorti; ma ' +
          'gli anelli non sono piani, si piegano e restano <b>senza tensione</b>, e ' +
          'con il metodo giusto si sintetizzano. Sui terpeni superiori — ' +
          'sesquiterpeni, diterpeni, triterpeni — lo stesso lavoro porta alla ' +
          '<b>regola biogenetica dell\'isoprene</b>: queste molecole nascono da ' +
          'catene di unità a cinque atomi di carbonio che si chiudono ad anello, e ' +
          'da un triterpene, lo squalene, derivano gli steroidi.' },

    { re: /alkaloid|plant product|natural products/i,
      tit: 'Alcaloidi e prodotti vegetali',
      sp: 'Le piante producono molecole azotate complesse e potentemente attive: ' +
          'morfina, chinina, stricnina. Isolarle e stabilirne la struttura, con la ' +
          'chimica delle degradazioni, è stato un lavoro di decenni — la stricnina ' +
          'ha sette anelli e sei centri stereogenici su appena ventuno atomi di ' +
          'carbonio. E la via biologica si può imitare: il tropinone, scheletro ' +
          'dell\'atropina e della cocaina, si ottiene in un solo passaggio, per ' +
          'sintesi <b>biomimetica</b>, da una dialdeide, la metilammina e un ' +
          'derivato dell\'acetone mescolati in acqua. Sono state la palestra su cui ' +
          'si sono formati i metodi dell\'analisi strutturale organica — oltre che ' +
          'il punto di partenza di molti farmaci, che spesso sono un alcaloide ' +
          'naturale semplificato.' },



    /* ── Elementi, nucleo, atmosfera ───────────────────────────────────── */
    { re: /inert gaseous elements|noble gases|rare gases/i,
      tit: 'I gas nobili e un nuovo gruppo della tavola periodica',
      sp: 'L\'azoto ricavato dall\'aria, togliendo ossigeno, acqua e anidride ' +
          'carbonica, pesava circa lo 0,5% in più dell\'azoto ottenuto per via ' +
          'chimica dall\'ammoniaca. Una differenza piccola ma ostinata: nell\'aria ' +
          'c\'era un gas sconosciuto. È l\'<b>argon</b>, che non reagisce con niente; ' +
          'per distillazione frazionata dell\'aria liquida seguono neon, cripto e ' +
          'xeno, e l\'elio, già visto nello spettro del Sole, viene trovato in un ' +
          'minerale di uranio. Sono elementi che non trovano posto in nessuna ' +
          'colonna esistente: la tavola periodica riceve un <b>gruppo intero</b> ' +
          'nuovo, con il guscio di valenza completo che spiega l\'inerzia. Solo ' +
          'molto più tardi si scoprirà che lo xeno, con il fluoro, qualche composto ' +
          'lo forma.' },

    { re: /fluorine|electric furnace/i,
      tit: 'L\'isolamento del fluoro e il forno elettrico',
      sp: 'Il fluoro è l\'elemento più elettronegativo e il più forte ossidante fra ' +
          'gli elementi: attacca quasi tutto, e per decenni nessuno riuscì a ' +
          'isolarlo, con diversi chimici avvelenati nei tentativi. La soluzione è ' +
          'l\'<b>elettrolisi</b> dell\'acido fluoridrico anidro, reso conduttore ' +
          'dall\'aggiunta di fluoruro acido di potassio, KHF₂, a bassa temperatura e ' +
          'in apparecchi di platino: all\'anodo si libera F₂, un gas giallo pallido. ' +
          'Insieme arriva il <b>forno elettrico ad arco</b>, che supera i 3000 °C e ' +
          'permette di preparare carburi come il CaC₂, da cui si ottiene ' +
          'l\'acetilene, e poi boruri, siliciuri e metalli refrattari.' },

    { re: /atomic weights?/i,
      tit: 'La determinazione accurata dei pesi atomici',
      sp: 'Una massa atomica sbagliata nella quarta cifra si propaga in ogni ' +
          'analisi quantitativa. Il lavoro premiato rifà da capo le determinazioni ' +
          'di decine di elementi con una cura nuova: sostanze purificate fino al ' +
          'limite, pesate in atmosfera controllata, recipienti di quarzo, analisi ' +
          'gravimetriche ripetute — per esempio sul rapporto fra argento e cloruro ' +
          'd\'argento — e individuazione sistematica degli <b>errori nascosti</b>, ' +
          'come i gas occlusi nei precipitati. Ne esce anche una scoperta: il ' +
          'piombo dei minerali radioattivi ha una massa atomica <b>diversa</b> da ' +
          'quella del piombo comune, una prova chimica che lo stesso elemento può ' +
          'esistere con masse diverse, cioè dell\'esistenza degli isotopi.' },

    { re: /origin and nature of isotopes/i,
      tit: 'Origine e natura degli isotopi',
      sp: 'Le serie di decadimento radioattivo producevano più «elementi» di quanti ' +
          'posti ci fossero nella tavola periodica, e alcuni di essi non si ' +
          'riuscivano a separare chimicamente fra loro in nessun modo. La ' +
          'conclusione è che sono lo stesso elemento con masse diverse: ' +
          '<b>isotopi</b>, cioè «nello stesso posto». A dire dove finisce il ' +
          'prodotto di un decadimento è la <b>legge dello spostamento</b>: ' +
          'l\'emissione di una particella α sposta l\'elemento di due caselle ' +
          'indietro e abbassa la massa di quattro unità, l\'emissione β lo sposta di ' +
          'una casella avanti a massa invariata. Il posto nella tavola dipende ' +
          'dalla carica nucleare, non dalla massa: è l\'idea che di lì a poco ' +
          'diventerà il numero atomico.' },

    { re: /heavy hydrogen|deuterium/i,
      tit: 'L\'idrogeno pesante',
      sp: 'Se l\'idrogeno avesse un isotopo di massa doppia, le sue righe spettrali ' +
          'dovrebbero essere leggermente spostate, perché la massa del nucleo entra ' +
          'nei livelli di energia attraverso la massa ridotta. Si fa evaporare ' +
          'lentamente idrogeno liquido, così che il residuo si arricchisca ' +
          'nell\'isotopo più pesante, e nello spettro compaiono proprio le righe ' +
          'deboli previste: è il <b>deuterio</b>, ²H. Con l\'elettrolisi ripetuta si ' +
          'concentra l\'acqua pesante, D₂O. Le applicazioni non finiscono più: ' +
          'moderatore nei reattori, tracciante nelle vie metaboliche, <b>effetto ' +
          'isotopico cinetico</b> per capire quale legame si rompe nel passaggio ' +
          'lento di una reazione, e i solventi deuterati con cui si registra ogni ' +
          'spettro NMR.' },

    { re: /carbon.?14|radiocarbon|age determination/i,
      tit: 'La datazione con il carbonio-14',
      sp: 'I raggi cosmici producono in alta atmosfera neutroni che trasformano ' +
          'l\'azoto in carbonio-14: ¹⁴N + n → ¹⁴C + p. Il ¹⁴C si ossida a CO₂, si ' +
          'mescola con l\'anidride carbonica dell\'atmosfera ed entra in tutti gli ' +
          'esseri viventi, che ne mantengono una concentrazione costante finché ' +
          'scambiano carbonio con l\'ambiente. Alla morte lo scambio si ferma e il ' +
          '¹⁴C decade con un <b>tempo di dimezzamento</b> di circa 5700 anni. ' +
          'Misurando l\'attività residua di legno, ossa o tessuti se ne ricava ' +
          'l\'età, fino a circa cinquantamila anni. Il metodo va <b>calibrato</b>, ' +
          'perché la produzione di ¹⁴C non è stata costante nel tempo, e lo si ' +
          'confronta con gli anelli degli alberi.' },

    { re: /isotop|heavy hydrogen|deuterium|radioactive.*tracer|carbon.?14|radiocarbon/i,
      tit: 'Isotopi: tracciare e datare',
      sp: 'Due atomi dello stesso elemento con massa diversa hanno la stessa ' +
          'chimica, e questo li rende <b>etichette perfette</b>: si sostituisce un ' +
          'atomo con il suo isotopo e si segue dove va lungo una via metabolica, ' +
          'senza cambiare la reazione. La scoperta dell\'idrogeno pesante e la ' +
          'separazione degli isotopi rendono il metodo praticabile. Lo stesso ' +
          'principio, con il carbonio-14 prodotto nell\'atmosfera e il suo ' +
          'decadimento regolare, diventa un <b>orologio</b>: misurando quanto ne ' +
          'resta in un residuo organico si sa quando era vivo.' },

    { re: /fission of heavy nuclei|nuclear fission/i,
      tit: 'La fissione dei nuclei pesanti',
      sp: 'Irradiando l\'uranio con neutroni ci si aspettava di ottenere elementi ' +
          'vicini, poco più pesanti o poco più leggeri. L\'analisi chimica dei ' +
          'prodotti dice invece una cosa che sembrava impossibile: fra essi c\'è il ' +
          '<b>bario</b>, che ha circa metà della massa dell\'uranio. Il nucleo non ' +
          'perde un frammento piccolo, si <b>spacca in due</b>, per esempio ²³⁵U + ' +
          'n → ¹⁴¹Ba + ⁹²Kr + 3n. La massa dei prodotti è minore di quella di ' +
          'partenza, e la differenza si libera come energia, circa 200 MeV per ' +
          'nucleo, milioni di volte più di una reazione chimica. Poiché ogni ' +
          'fissione libera due o tre neutroni, la reazione può sostenersi a catena: ' +
          'da qui reattori e armi nucleari.' },

    { re: /transuranium|transuranic|plutonium|actinide/i,
      tit: 'Gli elementi transuranici',
      sp: 'Oltre l\'uranio la tavola periodica non finisce: gli elementi successivi ' +
          'si possono <b>fabbricare</b>, bombardando nuclei con neutroni o con ' +
          'nuclei più piccoli. Il lavoro chimico è il più difficile: identificare ' +
          'un elemento nuovo quando ne esistono pochi atomi, che decadono in ' +
          'fretta, significa prevederne il comportamento chimico e separarlo per ' +
          'quello. Da qui la collocazione degli attinidi in una serie propria, cioè ' +
          'una modifica della tavola periodica motivata dalla chimica.' },

    { re: /synthesis of new radioactive elements|artificial radioactiv/i,
      tit: 'La radioattività artificiale',
      sp: 'Bombardando un foglio di alluminio con particelle α si osserva che ' +
          'l\'emissione di radiazione <b>continua</b> anche dopo aver tolto la ' +
          'sorgente, e decresce con un tempo di dimezzamento di pochi minuti. Il ' +
          'bombardamento ha creato un nucleo nuovo e instabile: ²⁷Al + ⁴He → ³⁰P + ' +
          'n, e il fosforo-30 decade emettendo un positrone e diventando ' +
          'silicio-30. La prova è chimica: sciogliendo il bersaglio e separando il ' +
          'fosforo, l\'attività segue il fosforo. Per la prima volta si ' +
          '<b>fabbricano</b> isotopi radioattivi a volontà, e la conseguenza ' +
          'pratica è enorme: traccianti per la chimica e la biologia, radiofarmaci ' +
          'per la diagnosi e la terapia.' },

    { re: /artificial radioactiv|new radioactive element|radium|polonium/i,
      tit: 'Radioattività e nuovi elementi',
      sp: 'Alcuni minerali emettono radiazione più intensamente di quanto il loro ' +
          'contenuto di uranio spieghi: dentro c\'è qualcos\'altro. Isolarlo richiede ' +
          'di trattare tonnellate di minerale per ottenerne frazioni di grammo, ' +
          'seguendo l\'attività — misurata dalla ionizzazione dell\'aria con un ' +
          'elettrometro — come unica guida, e concentrando il radio con ' +
          'cristallizzazioni frazionate ripetute dei suoi sali insieme a quelli di ' +
          'bario. Escono due elementi nuovi, il polonio e il radio; del radio si ' +
          'determina la massa atomica e si isola il metallo. Più tardi si scopre ' +
          'che la radioattività si può anche <b>produrre</b>: bombardando elementi ' +
          'stabili se ne ottengono isotopi radioattivi, e nasce la disponibilità di ' +
          'traccianti per la chimica e la medicina.' },

    { re: /disintegration of the elements/i,
      tit: 'La disintegrazione degli elementi',
      sp: 'Che un atomo potesse trasformarsi in un altro sembrava un ritorno ' +
          'all\'alchimia. Le misure dicono invece proprio questo: un elemento ' +
          'radioattivo emette radiazioni di due tipi principali, le particelle ' +
          '<b>α</b>, poco penetranti, e le <b>β</b>, elettroni veloci, e nel farlo ' +
          'diventa un elemento diverso, con proprietà chimiche diverse. Il torio, ' +
          'per esempio, genera un gas radioattivo che si può separare e che perde ' +
          'metà della sua attività in circa un minuto. La radioattività è quindi ' +
          'una <b>trasmutazione</b> spontanea, che segue una legge esponenziale ' +
          'indipendente dalla temperatura e dallo stato chimico; le particelle α, ' +
          'raccolte in un tubo, finiscono per dare lo spettro dell\'elio. La chimica ' +
          'scopre che gli elementi non sono eterni.' },

    { re: /chemistry of radioactive substances|radiochemistry|nuclear fission/i,
      tit: 'Chimica delle sostanze radioattive',
      sp: 'Studiare un elemento presente in quantità invisibili ha richiesto un ' +
          'metodo nuovo: si segue il <b>decadimento</b> invece della massa, e si ' +
          'separa per affinità chimica aggiungendo un vettore inattivo che si ' +
          'comporta allo stesso modo. Ne vengono i concetti di base: la ' +
          'radioattività è la trasformazione spontanea di un atomo in un altro; ' +
          'ogni specie decade in modo esponenziale con un <b>tempo di ' +
          'dimezzamento</b> proprio, che nessuna condizione chimica o fisica ' +
          'ordinaria modifica; le particelle α sono nuclei di elio. Con questi ' +
          'strumenti si costruiscono le serie di decadimento, si chiarisce la ' +
          'nozione di isotopo, e si identificano i prodotti di una trasformazione ' +
          'nucleare per via puramente chimica.' },

    { re: /ozone|atmospheric chemistry|formation and decomposition of ozone/i,
      tit: 'La chimica dell\'ozono stratosferico',
      sp: 'L\'ozono in alta atmosfera assorbe l\'ultravioletto e si forma e si ' +
          'distrugge in un equilibrio naturale. Il risultato che ha cambiato la ' +
          'politica ambientale è che alcune sostanze industriali inerti e innocue ' +
          'in basso — i clorofluorocarburi — <b>arrivano intatte</b> in ' +
          'stratosfera, lì vengono spezzate dalla radiazione e liberano cloro, che ' +
          'distrugge l\'ozono in cicli catalitici: un singolo atomo di cloro ne ' +
          'consuma migliaia di molecole. Una previsione di laboratorio poi ' +
          'confermata dal buco antartico.' },

    { re: /osmotic pressure|laws of chemical dynamics|dynamics.*chemical equilibrium/i,
      tit: 'Le leggi delle soluzioni e dell\'equilibrio',
      sp: 'Le soluzioni diluite obbediscono a leggi della stessa forma di quelle ' +
          'dei gas: la <b>pressione osmotica</b> vale π = cRT, con la stessa ' +
          'costante R dei gas, come se le molecole di soluto fossero un gas nel ' +
          'volume del solvente. Da qui le proprietà colligative — abbassamento del ' +
          'punto di congelamento, innalzamento di quello di ebollizione — e un ' +
          'metodo per misurare le masse molari. Insieme arrivano la descrizione ' +
          'quantitativa dell\'equilibrio chimico come equilibrio <i>dinamico</i>, in ' +
          'cui la reazione diretta e quella inversa procedono alla stessa velocità, ' +
          'e la dipendenza della costante di equilibrio dalla temperatura, d ln ' +
          'K/dT = ΔH/RT². È la nascita della chimica fisica: la chimica diventa una ' +
          'disciplina con equazioni, non solo con ricette.' },

    { re: /electrolytic (theory of )?dissociation|electrolyt/i,
      tit: 'La dissociazione elettrolitica',
      sp: 'Un sale in acqua non resta intero: si <b>separa in ioni</b>, e sono gli ' +
          'ioni che portano la corrente. L\'idea fu accolta con scetticismo — ' +
          'sembrava assurdo che il cloruro di sodio si scindesse spontaneamente — ' +
          'ma spiega di colpo molte anomalie: una soluzione di NaCl abbassa il ' +
          'punto di congelamento quasi il doppio di una di zucchero alla stessa ' +
          'concentrazione, perché le particelle sono il doppio. Gli elettroliti ' +
          'deboli si dissociano solo in parte, e il <b>grado di dissociazione</b> ' +
          'ricavato dalla conducibilità coincide con quello dedotto dalle proprietà ' +
          'colligative. Un acido è una sostanza che in acqua libera ioni H⁺, una ' +
          'base ioni OH⁻. Da qui pH, costanti di dissociazione e tutta ' +
          'l\'elettrochimica delle soluzioni.' },



    /* ── Voci generiche: in fondo, perché vincerebbero su quelle specifiche ─── */
    { re: /organic synthesis|art of organic synthesis|synthesis of natural products/i,
      tit: 'L\'arte della sintesi organica',
      sp: 'Costruire in laboratorio molecole complicate che la natura produce in ' +
          'piccole quantità: colesterolo, chinina, clorofilla, stricnina. Non è ' +
          'solo abilità manuale — è l\'affermazione che una struttura dedotta dagli ' +
          'spettri e dalla chimica <b>è</b> quella molecola, perché la si rifà da ' +
          'zero e il prodotto coincide. Da quelle campagne nascono i modi di ' +
          'pensare che si usano ancora: controllo stereochimico passo per passo, ' +
          'gruppi protettori, e la convinzione che non esista una molecola «non ' +
          'sintetizzabile».' },

    { re: /enzyme|fermentation|cell.?free/i,
      tit: 'Enzimi: la catalisi della vita',
      sp: 'Che la fermentazione potesse avvenire in un estratto <b>privo di ' +
          'cellule</b> ha spezzato l\'idea che i processi vitali richiedessero la ' +
          'cellula intera: sono reazioni chimiche catalizzate da sostanze ' +
          'isolabili. Da lì la storia è una progressiva messa a fuoco — ' +
          'cristallizzare un enzima, dimostrare che è una proteina, poi vederne la ' +
          'struttura e capire che la catalisi viene dalla forma: il sito attivo ' +
          'stabilizza lo <b>stato di transizione</b>, e abbassare quella barriera è ' +
          'tutto quello che un catalizzatore fa.' },

    { re: /sequence|structure of proteins.*insulin|base sequences in nucleic acids/i,
      tit: 'Leggere la sequenza',
      sp: 'Una proteina è una catena di amminoacidi in un ordine preciso, e ' +
          'stabilire quell\'ordine — per l\'insulina, la prima — richiede di ' +
          'tagliarla in pezzi, identificarli e ricostruire la sovrapposizione. Lo ' +
          'stesso problema per gli acidi nucleici viene risolto in modo diverso e ' +
          'più potente: si fanno crescere copie della catena che si <b>fermano</b> ' +
          'a una base nota, e dalla lunghezza dei frammenti si legge la sequenza. ' +
          'Da qui tutta la biologia molecolare che legge genomi.' },

    { re: /conformation|stereochemistry|stereochemical/i,
      tit: 'Conformazione e stereochimica',
      sp: 'Una molecola non è un disegno piatto: gli atomi si dispongono nello ' +
          'spazio e la disposizione decide la reattività. Il cicloesano non è un ' +
          'esagono, è una <b>sedia</b>, con posizioni assiali ed equatoriali che ' +
          'reagiscono in modo diverso; un sostituente ingombrante preferisce ' +
          'l\'equatoriale, e quella preferenza prevede quale prodotto si ottiene. ' +
          'L\'analisi conformazionale trasforma la stereochimica da descrizione in ' +
          '<b>strumento di previsione</b>: è il motivo per cui in questa ' +
          'applicazione la geometria 3D conta quanto la formula.' }
  ];

  /* ── l'abbinamento ──────────────────────────────────────────────────────
     Si confronta la motivazione UFFICIALE con le espressioni regolari. La
     prima che combacia vince, e se nessuna combacia non si mostra niente:
     meglio una spiegazione mancante che una sbagliata. */
  function perMotivazione(motivazione) {
    if (!motivazione) return null;
    var m = String(motivazione);
    for (var i = 0; i < ARGOMENTI.length; i++) {
      if (ARGOMENTI[i].re.test(m)) {
        return { tit: ARGOMENTI[i].tit, sp: ARGOMENTI[i].sp, indice: i };
      }
    }
    return null;
  }

  globale.BSINobelSpiegazioni = {
    ARGOMENTI: ARGOMENTI,
    perMotivazione: perMotivazione,
    quante: ARGOMENTI.length,
    versione: '2.0'
  };

})(typeof window !== 'undefined' ? window : globalThis);
