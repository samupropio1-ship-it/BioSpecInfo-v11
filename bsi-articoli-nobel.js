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

   LA REGOLA CHE OGNI VOCE DEVE RISPETTARE

   Niente nomi di persona nel testo. Il nome del premiato lo dice l'API. Un
   nome scritto qui sarebbe un'attribuzione, e le attribuzioni non si
   scrivono a memoria. `tools/banchi/test_articoli.js` lo verifica.
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

    /* ── Legame, struttura, teoria ──────────────────────────────────────── */
    { re: /nature of the chemical bond|chemical bond and its application to the elucidation/i,
      tit: 'La natura del legame chimico',
      sp: 'Prima, il legame chimico era una linea tirata fra due simboli. Qui diventa ' +
          'un oggetto con una forma e un\'energia, descritto dalla meccanica quantistica: ' +
          'gli orbitali atomici si <b>ibridano</b> (sp, sp², sp³) e da quell\'ibridazione ' +
          'esce la geometria vera delle molecole — perché il metano è tetraedrico e non ' +
          'piatto. Arrivano la <b>risonanza</b>, che spiega perché il benzene non ha legami ' +
          'lunghi e corti alternati ma sei legami uguali, e l\'<b>elettronegatività</b> come ' +
          'scala con cui prevedere la polarità. È la base di tutto quello che in questa ' +
          'applicazione si chiama «struttura».' },

    { re: /theory of chemical reactivity|frontier orbital|orbital symmetry|woodward.?hoffmann/i,
      tit: 'Gli orbitali di frontiera e la simmetria nelle reazioni',
      sp: 'Due molecole che si incontrano reagiscono o no a seconda di come sono fatti ' +
          'i loro orbitali più esterni: l\'<b>HOMO</b> (il più alto occupato) di una e il ' +
          '<b>LUMO</b> (il più basso vuoto) dell\'altra. Se hanno la simmetria giusta e ' +
          'un\'energia vicina, si sovrappongono e la reazione va; se no, non va — per ' +
          'ragioni di <b>simmetria</b>, non di temperatura. Da qui le regole che dicono in ' +
          'anticipo se una cicloaddizione è permessa termicamente o solo per via ' +
          'fotochimica, e in quale senso una molecola si chiude ad anello. Una ' +
          'previsione, non una classificazione a posteriori.' },

    { re: /density.?functional|quantum chemical.*density|computational methods in quantum chemistry/i,
      tit: 'La teoria del funzionale della densità',
      sp: 'Risolvere l\'equazione di Schrödinger per una molecola vera è impossibile: le ' +
          'variabili crescono come il numero di elettroni, e già con una decina si esce ' +
          'da qualunque calcolatore. L\'idea che cambia tutto è che <b>non serve la funzione ' +
          'd\'onda</b>: basta la <b>densità elettronica</b>, cioè quanta carica c\'è in ogni ' +
          'punto dello spazio — tre variabili invece di tre per ogni elettrone. ' +
          'L\'energia dello stato fondamentale è un <i>funzionale</i> di quella densità. È ' +
          'il metodo con cui oggi si calcolano geometrie, energie di reazione e spettri ' +
          'di molecole che nessun metodo esatto potrebbe toccare.' },

    { re: /multiscale models for complex chemical systems/i,
      tit: 'Modelli a più scale: quanto-classico insieme',
      sp: 'Un enzima ha decine di migliaia di atomi: trattarli tutti con la meccanica ' +
          'quantistica è fuori portata, trattarli tutti con la meccanica classica non ' +
          'descrive la rottura dei legami — che è esattamente il punto. La soluzione è ' +
          '<b>cucire i due mondi</b>: il sito attivo, dove i legami si fanno e si ' +
          'rompono, in meccanica quantistica; tutto il resto della proteina e il solvente ' +
          'in meccanica classica, come molle e sfere. Il mestiere sta nel <b>confine</b>: ' +
          'come passare le forze da una descrizione all\'altra senza creare artefatti. ' +
          'È così che oggi si studia un meccanismo enzimatico al calcolatore.' },

    { re: /computational protein design|protein structure prediction/i,
      tit: 'Prevedere e progettare la struttura delle proteine',
      sp: 'Una proteina è una catena di amminoacidi che si avvolge in <b>una</b> forma ' +
          'precisa, e la forma è la funzione. Dalla sequenza alla forma c\'è un salto che ' +
          'ha resistito cinquant\'anni: il numero di conformazioni possibili è ' +
          'astronomico. Due risultati lo chiudono da due lati opposti — la <b>previsione</b>, ' +
          'che dalla sequenza arriva alla struttura con l\'accuratezza di un esperimento, ' +
          'e il <b>progetto</b>, che fa il percorso inverso: si decide la forma che serve e ' +
          'si calcola una sequenza che la assuma, producendo proteine che in natura non ' +
          'esistono.' },

    { re: /theory of.*electron transfer|electron transfer reactions in chemical systems/i,
      tit: 'Il trasferimento di elettroni',
      sp: 'Quando un elettrone salta da una molecola a un\'altra non succede quasi nulla ' +
          'di meccanico: l\'elettrone è leggerissimo e si muove in un istante. Il costo ' +
          'sta nel <b>solvente</b> e nei legami intorno, che devono riorganizzarsi perché la ' +
          'nuova distribuzione di carica sia stabile. La teoria mette questo costo in una ' +
          'formula con due pezzi — l\'energia libera della reazione e un\'<b>energia di ' +
          'riorganizzazione</b> — e ne esce una previsione contro l\'intuizione: oltre un ' +
          'certo punto, <b>più la reazione è favorevole più diventa lenta</b> (la regione ' +
          'invertita). Fu misurata anni dopo, e c\'era.' },

    { re: /femtosecond spectroscopy|transition states of chemical reactions using/i,
      tit: 'Femtochimica: vedere la reazione mentre avviene',
      sp: 'Lo stato di transizione — la configurazione in cima alla barriera, dove il ' +
          'legame vecchio non c\'è più e quello nuovo non c\'è ancora — era un oggetto ' +
          'teorico: dura <b>decine di femtosecondi</b> (10⁻¹⁵ s), e nessuno strumento era ' +
          'abbastanza rapido. Con impulsi laser di quella durata si fa una cosa semplice ' +
          'da dire: un impulso avvia la reazione, un secondo impulso ritardato di poche ' +
          'decine di femtosecondi la fotografa. Cambiando il ritardo si ottiene il ' +
          '<b>film</b> della reazione, fotogramma per fotogramma, e la teoria dello stato ' +
          'di transizione diventa una cosa che si guarda.' },

    { re: /dynamics of chemical elementary processes|crossed molecular beam|reaction dynamics/i,
      tit: 'Dinamica delle reazioni elementari',
      sp: 'In una provetta una reazione è una media su un numero enorme di urti diversi. ' +
          'Per capire il <b>singolo</b> urto servono due fasci di molecole che si ' +
          'incrociano nel vuoto, con velocità e orientamento scelti: si misura dove ' +
          'vanno i prodotti, con quanta energia e con quale distribuzione angolare. Da ' +
          'lì si ricostruisce la <b>superficie di energia potenziale</b> — il paesaggio su ' +
          'cui la reazione si muove — e si scopre che conta anche <i>da che parte</i> le ' +
          'molecole si urtano. La chimica passa da «quanto velocemente» a «come, ' +
          'esattamente».' },

    { re: /fast chemical reactions|relaxation|very fast chemical reactions/i,
      tit: 'Le reazioni veloci, misurate',
      sp: 'Molte reazioni in soluzione finiscono in microsecondi o meno: mescolare due ' +
          'soluzioni richiede più tempo di quanto la reazione ne duri, quindi non si può ' +
          'cronometrare. Il trucco è non mescolare niente: si parte da un sistema <b>già ' +
          'all\'equilibrio</b> e lo si spinge fuori di colpo — con un salto di temperatura, ' +
          'di pressione o un impulso elettrico — e si guarda quanto tempo mette a ' +
          'tornarci. Quel <b>rilassamento</b> dà le costanti di velocità dei singoli ' +
          'passaggi. Con metodi affini, un lampo di luce genera in un istante specie ' +
          'reattive che non si potrebbero preparare altrimenti.' },

    { re: /irreversible thermodynamics|dissipative structure|non.?equilibrium thermodynamics/i,
      tit: 'Termodinamica dei processi irreversibili',
      sp: 'La termodinamica classica descrive gli stati di equilibrio, dove non succede ' +
          'niente. Ma un essere vivente, una fiamma e una reazione oscillante non sono ' +
          'all\'equilibrio: attraversano un flusso continuo di materia ed energia. Lontano ' +
          'dall\'equilibrio un sistema può <b>organizzarsi da sé</b> in strutture ordinate — ' +
          'onde chimiche, ritmi, modelli spaziali — che si mantengono proprio perché ' +
          'dissipano energia. L\'ordine non contraddice il secondo principio: lo paga, ' +
          'esportando entropia verso l\'esterno.' },

    /* ── Catalisi e sintesi ─────────────────────────────────────────────── */
    { re: /asymmetric (hydrogenation|oxidation|catalysis)|chirally catalysed/i,
      tit: 'Catalisi asimmetrica',
      sp: 'Due enantiomeri sono l\'immagine speculare l\'uno dell\'altro, hanno le stesse ' +
          'proprietà fisiche e in un organismo possono fare cose diversissime: uno cura, ' +
          'l\'altro no. Una sintesi normale li produce <b>metà e metà</b>, e separarli è ' +
          'costoso. Un catalizzatore chirale rompe la simmetria: la molecola si lega al ' +
          'metallo in un intorno che ha una mano, e la reazione procede molto più ' +
          'rapidamente verso <b>uno</b> dei due prodotti. Poche molecole di catalizzatore ' +
          'determinano la chiralità di milioni di molecole di prodotto, e da qui passa ' +
          'buona parte della sintesi farmaceutica moderna.' },

    { re: /asymmetric organocatalysis|organocatalysis/i,
      tit: 'Organocatalisi asimmetrica',
      sp: 'Per decenni la catalisi asimmetrica ha voluto <b>metalli</b>, spesso costosi, ' +
          'tossici e sensibili all\'aria. Poi si scopre che piccole molecole organiche — ' +
          'un amminoacido come la prolina, un\'ammina semplice — fanno lo stesso lavoro: ' +
          'formano con il substrato un intermedio (una enammina, uno ione imminio) che ' +
          'reagisce da una faccia sola, perché l\'altra è ingombrata. Niente metalli, ' +
          'reagenti da banco, condizioni blande. È anche il ponte concettuale verso gli ' +
          'enzimi, che fanno esattamente questo da sempre.' },

    { re: /metathesis/i,
      tit: 'Metatesi delle olefine',
      sp: 'Scambiare i pezzi di due doppi legami carbonio-carbonio: i due frammenti si ' +
          'staccano e si ricombinano al contrario, come due coppie che si scambiano i ' +
          'partner. Sembra una reazione impossibile — il doppio legame C=C è robusto — e ' +
          'un catalizzatore a base di carbene metallico la rende ordinaria. Serve a ' +
          'chiudere anelli grandi che per altra via non si chiuderebbero, a costruire ' +
          'polimeri a struttura controllata, e con pochi passaggi al posto di molti: ' +
          'meno scarti, meno solventi.' },

    { re: /palladium.?catalysed cross coupling|cross.?coupling/i,
      tit: 'Accoppiamenti incrociati catalizzati da palladio',
      sp: 'Unire due frammenti di carbonio esattamente dove si vuole è il problema ' +
          'centrale della sintesi organica. Il palladio lo risolve con un ciclo in tre ' +
          'tempi: si <b>inserisce</b> nel legame carbonio-alogeno di un frammento, ' +
          '<b>scambia</b> il suo alogeno con il secondo frammento portato da un boro, uno ' +
          'stagno o uno zinco, e infine <b>espelle</b> i due pezzi uniti rigenerandosi. Il ' +
          'legame si forma dove l\'alogeno stava, e solo lì. Oggi è il modo normale di ' +
          'costruire biarili, e quindi gran parte dei farmaci e dei materiali per ' +
          'elettronica organica.' },

    { re: /metal.?organic framework|reticular chemistry/i,
      tit: 'Reticoli metallo-organici (MOF)',
      sp: 'Nodi metallici tenuti insieme da ponti organici, in un reticolo ordinato pieno ' +
          'di <b>vuoto</b>: fino a qualche grammo di materiale può avere la superficie ' +
          'interna di un campo da calcio. La parte notevole è la <b>progettabilità</b>: ' +
          'cambiando la lunghezza del ponte si cambia la dimensione dei pori, cambiando il ' +
          'metallo si cambia la chimica delle pareti. Da qui l\'immagazzinamento di gas, ' +
          'la separazione di miscele che bollono alla stessa temperatura, la cattura ' +
          'dell\'anidride carbonica e la raccolta di acqua dall\'aria del deserto.' },

    { re: /click chemistry|bioorthogonal/i,
      tit: 'Click chemistry e chimica bioortogonale',
      sp: 'Servivano reazioni che funzionassero <b>sempre</b>: resa quasi totale, nessun ' +
          'sottoprodotto, in acqua, a temperatura ambiente, e che ignorassero tutti i ' +
          'gruppi funzionali intorno. La cicloaddizione fra un\'azide e un alchino, con ' +
          'rame, è questo: due pezzi si agganciano come una fibbia. Il passo successivo è ' +
          '<b>bioortogonale</b>: reazioni che avvengono <i>dentro una cellula viva</i> senza ' +
          'toccare la sua chimica e senza il rame, che è tossico — una delle due metà ' +
          'viene messa su una molecola biologica, l\'altra porta una sonda, e si vede ' +
          'dove va.' },

    { re: /organic synthesis|art of organic synthesis|synthesis of natural products/i,
      tit: 'L\'arte della sintesi organica',
      sp: 'Costruire in laboratorio molecole complicate che la natura produce in piccole ' +
          'quantità: colesterolo, chinina, clorofilla, stricnina. Non è solo abilità ' +
          'manuale — è l\'affermazione che una struttura dedotta dagli spettri e dalla ' +
          'chimica <b>è</b> quella molecola, perché la si rifà da zero e il prodotto ' +
          'coincide. Da quelle campagne nascono i modi di pensare che si usano ancora: ' +
          'controllo stereochimico passo per passo, gruppi protettori, e la convinzione ' +
          'che non esista una molecola «non sintetizzabile».' },

    { re: /theory and methodology of organic synthesis|retrosynthetic/i,
      tit: 'La logica della retrosintesi',
      sp: 'La sintesi smette di essere un\'arte individuale e diventa un metodo che si ' +
          'insegna. Si parte dal <b>bersaglio</b> e si cammina a ritroso: ogni legame che si ' +
          'può immaginare rotto è una <i>disconnessione</i>, e ogni disconnessione porta a ' +
          'precursori più semplici. Si ripete finché non si arriva a cose che si comprano. ' +
          'Insieme arriva il vocabolario — sintone, gruppo protettore, equivalente ' +
          'sintetico — e un modo di ragionare che un calcolatore può imitare: è ' +
          'l\'antenato di ogni programma di retrosintesi, compreso quello di questa ' +
          'applicazione.' },

    { re: /surface chemistry|chemical processes on solid surfaces/i,
      tit: 'Chimica delle superfici',
      sp: 'Buona parte della chimica industriale avviene sulla superficie di un solido, ' +
          'dove le molecole si <b>adsorbono</b>, si deformano, a volte si spezzano, e poi ' +
          'ripartono trasformate. Studiarla richiede ultra-alto vuoto e cristalli ' +
          'perfetti, perché una superficie all\'aria si copre di sporco in un attimo. Con ' +
          'quella disciplina si arriva a scrivere i <b>singoli passaggi</b> di un processo ' +
          'come la sintesi dell\'ammoniaca: come la molecola di azoto si rompe sul ferro, ' +
          'quanto resta attaccata, in che ordine arrivano gli idrogeni. La catalisi ' +
          'eterogenea smette di essere una ricetta.' },

    { re: /synthesis of ammonia|high pressure/i,
      tit: 'Ammoniaca dall\'azoto dell\'aria, e l\'alta pressione',
      sp: 'L\'azoto molecolare è nell\'aria in abbondanza e non serve a niente alle piante: ' +
          'il suo triplo legame è fra i più robusti che esistano. Farlo reagire con ' +
          'idrogeno per dare ammoniaca richiede pressioni di centinaia di atmosfere, ' +
          'temperature alte e un catalizzatore di ferro — e soprattutto richiede di ' +
          'inventare l\'<b>impianto</b> che regga quelle condizioni in continuo. È la ' +
          'reazione da cui viene la maggior parte dei fertilizzanti del mondo: senza di ' +
          'essa non si nutrirebbe la popolazione attuale. Lo stesso metodo ad alta ' +
          'pressione apre poi l\'idrogenazione del carbone.' },

    { re: /polymerization|macromolecular chemistry|polymers/i,
      tit: 'Macromolecole e polimerizzazione controllata',
      sp: 'Che gomma, cellulosa e proteine fossero <b>molecole singole lunghissime</b>, e non ' +
          'aggregati di molecole piccole, è stata una tesi combattuta a lungo. ' +
          'Riconosciuta, cambia la materia: si può progettare una catena. Poi arrivano i ' +
          'catalizzatori che la costruiscono in modo <b>ordinato</b> — a pressione quasi ' +
          'ambiente, con i monomeri inseriti sempre nello stesso verso e con la stessa ' +
          'stereochimica. Dalla catena ordinata viene la cristallinità, e dalla ' +
          'cristallinità la rigidità e il punto di fusione: il polipropilene isotattico ' +
          'è un oggetto d\'uso, quello disordinato è una colla.' },

    { re: /conductive polymer|conductive polymers/i,
      tit: 'Polimeri conduttori',
      sp: 'Una plastica isola: è il motivo per cui ci si fanno i rivestimenti dei cavi. ' +
          'Eppure un polimero con <b>doppi legami coniugati</b> lungo tutta la catena, se ' +
          'viene <i>drogato</i> — ossidato o ridotto in parte — conduce come un metallo, ' +
          'perché le cariche si muovono sul sistema π delocalizzato. Si ottiene un ' +
          'materiale che si piega, si stampa e conduce: diodi organici per gli schermi, ' +
          'sensori, celle fotovoltaiche flessibili.' },

    { re: /fullerene/i,
      tit: 'I fullereni',
      sp: 'Il carbonio elementare si conosceva in due forme, grafite e diamante. La terza ' +
          'è una <b>gabbia chiusa</b>: sessanta atomi disposti come le cuciture di un pallone ' +
          'da calcio, venti esagoni e dodici pentagoni — i pentagoni sono necessari, ' +
          'perché con soli esagoni la superficie resta piatta. Nasce una chimica nuova: ' +
          'molecole dentro la gabbia, derivati sulla superficie, e la parentela con i ' +
          'nanotubi, che sono la stessa idea arrotolata in un tubo.' },

    { re: /quasicrystal/i,
      tit: 'I quasicristalli',
      sp: 'Un cristallo è periodico, e la periodicità vieta la simmetria a cinque: con ' +
          'pentagoni non si pavimenta un piano senza lasciare buchi. Poi arriva una lega ' +
          'il cui diagramma di diffrazione mostra punti nitidi — quindi ordine a lungo ' +
          'raggio — <b>e</b> una simmetria decagonale, quindi nessuna periodicità. La ' +
          'materia può essere <b>ordinata senza ripetersi</b>, come una tassellatura ' +
          'aperiodica. Per anni il risultato è stato respinto; è la definizione di ' +
          'cristallo che ha dovuto cambiare.' },

    { re: /quantum dot/i,
      tit: 'I punti quantici',
      sp: 'Prendete un semiconduttore e fatene un granello di pochi nanometri: gli ' +
          'elettroni restano confinati in uno spazio paragonabile alla loro lunghezza ' +
          'd\'onda, e i livelli di energia si separano. La conseguenza visibile è che il ' +
          '<b>colore dipende dalla dimensione</b>, non dalla composizione: lo stesso ' +
          'materiale emette nel rosso se il granello è grande e nel blu se è piccolo. La ' +
          'parte chimica difficile è farli tutti della stessa misura, in modo ' +
          'riproducibile: risolta, sono arrivati negli schermi, nei marcatori biologici e ' +
          'nei LED.' },

    { re: /lithium.?ion batter/i,
      tit: 'Le batterie a ioni di litio',
      sp: 'Il litio è il metallo più leggero e cede l\'elettrone con grande facilità: ' +
          'ideale per immagazzinare energia, e pericoloso da usare in forma metallica, ' +
          'perché cresce in filamenti che cortocircuitano la cella. La soluzione è non ' +
          'usarlo come metallo: lo ione litio <b>si infila e si sfila</b> fra gli strati di ' +
          'due materiali, un ossido da una parte e la grafite dall\'altra, avanti e ' +
          'indietro per migliaia di cicli. Nessuna reazione distruttiva, solo ioni che ' +
          'migrano. È la tecnologia su cui funzionano i telefoni e le auto elettriche.' },

    { re: /molecular machine/i,
      tit: 'Macchine molecolari',
      sp: 'Molecole fatte di parti che si muovono l\'una rispetto all\'altra in modo ' +
          '<b>controllato</b>: due anelli concatenati meccanicamente, un anello infilato su ' +
          'un asse che scorre fra due fermi, un rotore che gira sempre nello stesso senso ' +
          'se illuminato. La difficoltà vera è <b>costruirli</b>: i legami meccanici non si ' +
          'formano da sé, bisogna preorganizzare i pezzi con interazioni debolissime e ' +
          'poi chiudere l\'anello. Il risultato è un motore o un interruttore ' +
          'molecolare: movimento ordinato a una scala dove normalmente c\'è solo agitazione ' +
          'termica.' },

    { re: /crown ether|molecules with structure.?specific interactions|host.?guest/i,
      tit: 'Riconoscimento molecolare: ospite e ospitante',
      sp: 'Molecole a forma di anello o di cesto che <b>ospitano</b> uno ione o una molecola ' +
          'piccola, con una selettività notevole: un etere corona con sei ossigeni lega ' +
          'il potassio e lascia stare il sodio, perché la cavità ha la misura giusta. Non ' +
          'ci sono legami covalenti in gioco, solo molte interazioni deboli che sommate ' +
          'fanno una presa forte. È la nascita della chimica <b>supramolecolare</b>: la ' +
          'chimica di quello che tiene insieme le molecole fra loro, cioè anche di come ' +
          'funziona un recettore o un canale ionico.' },

    { re: /boron|borane/i,
      tit: 'La chimica dei borani',
      sp: 'Il boro ha un elettrone in meno di quanti servirebbero: i suoi idruri non si ' +
          'possono scrivere con i legami a due elettroni della chimica normale. Hanno ' +
          'legami <b>a tre centri e due elettroni</b> — un idrogeno a ponte fra due boro — e ' +
          'formano gabbie poliedriche con regole di conteggio proprie. È un pezzo di ' +
          'chimica strutturale che ha costretto ad allargare l\'idea stessa di legame, e ' +
          'da cui vengono reagenti usati ogni giorno, dall\'idroborazione agli agenti ' +
          'riducenti.' },

    { re: /organometallic|sandwich compound|metallocene/i,
      tit: 'Composti organometallici a sandwich',
      sp: 'Un atomo di ferro stretto fra due anelli a cinque atomi di carbonio, come il ' +
          'ripieno di un sandwich: il metallo non è legato a un singolo carbonio, ma a ' +
          'tutto il sistema π dell\'anello. La struttura sembrava impossibile e apre un ' +
          'campo intero — la chimica fra l\'organico e l\'inorganico, dove i metalli ' +
          'diventano il centro attorno a cui le molecole organiche si riorganizzano. Da ' +
          'qui vengono i catalizzatori per i polimeri e gran parte della catalisi ' +
          'omogenea.' },

    { re: /carbocation/i,
      tit: 'I carbocationi',
      sp: 'Un carbonio con carica positiva e sei elettroni invece di otto è l\'intermedio ' +
          'di moltissime reazioni organiche, e per molto tempo è rimasto un\'ipotesi: si ' +
          'deduceva dai prodotti, non si vedeva. Con <b>superacidi</b> — acidi milioni di ' +
          'volte più forti dell\'acido solforico, in cui nessuna base può stabilizzare la ' +
          'carica — quegli intermedi diventano abbastanza duraturi da registrarne lo ' +
          'spettro NMR. Un\'ipotesi meccanicistica diventa un oggetto misurabile, e la ' +
          'chimica dei petroli e delle alchilazioni smette di essere empirica.' },

    { re: /conformation|stereochemistry|stereochemical/i,
      tit: 'Conformazione e stereochimica',
      sp: 'Una molecola non è un disegno piatto: gli atomi si dispongono nello spazio e la ' +
          'disposizione decide la reattività. Il cicloesano non è un esagono, è una ' +
          '<b>sedia</b>, con posizioni assiali ed equatoriali che reagiscono in modo ' +
          'diverso; un sostituente ingombrante preferisce l\'equatoriale, e quella ' +
          'preferenza prevede quale prodotto si ottiene. L\'analisi conformazionale ' +
          'trasforma la stereochimica da descrizione in <b>strumento di previsione</b>: è ' +
          'il motivo per cui in questa applicazione la geometria 3D conta quanto la ' +
          'formula.' },

    /* ── Separazioni e metodi di misura ────────────────────────────────── */
    { re: /chromatograph/i,
      tit: 'La cromatografia',
      sp: 'Separare i componenti di una miscela facendoli migrare attraverso un mezzo in ' +
          'cui ciascuno è trattenuto <b>in modo diverso</b>: chi ha più affinità per la fase ' +
          'ferma resta indietro, chi ne ha meno corre con il solvente. Da un\'idea così ' +
          'semplice viene la tecnica analitica più usata in assoluto, e — cosa che conta ' +
          'per la chimica dei prodotti naturali — la possibilità di ottenere in forma ' +
          'pura sostanze presenti in tracce, che prima si potevano solo ipotizzare.' },

    { re: /electrophoresis|adsorption analysis/i,
      tit: 'Elettroforesi e analisi per adsorbimento',
      sp: 'Le proteine in soluzione portano una carica che dipende dal pH: in un campo ' +
          'elettrico <b>migrano a velocità diverse</b>, e si separano. Con le tecniche di ' +
          'adsorbimento si ottiene lo stesso risultato per altra via. Il punto non è solo ' +
          'tecnico: prima non si sapeva nemmeno se il siero contenesse una proteina o ' +
          'molte. Separandole si scopre che sono una famiglia, e la biochimica delle ' +
          'proteine può cominciare.' },

    { re: /mass spectrometr/i,
      tit: 'Spettrometria di massa per le macromolecole',
      sp: 'Pesare una molecola richiede di ionizzarla e farla volare: facile per una ' +
          'molecola piccola, impossibile per una proteina, che scaldata si distrugge. Due ' +
          'metodi lo risolvono senza romperla — spruzzare la soluzione da un capillare a ' +
          'alta tensione, così il solvente evapora e resta lo ione intatto, oppure ' +
          'inglobarla in una matrice che assorbe l\'impulso laser al posto suo. ' +
          'All\'improvviso si pesano proteine intere con precisione di pochi dalton: ' +
          'nasce la proteomica.' },

    { re: /nuclear magnetic resonance|nmr spectroscopy/i,
      tit: 'Risonanza magnetica nucleare, da tecnica a strumento strutturale',
      sp: 'Un nucleo con spin, in un campo magnetico, assorbe a una frequenza che dipende ' +
          'da quanto gli elettroni intorno lo <b>schermano</b>: lo spostamento chimico è ' +
          'una misura dell\'intorno di ogni atomo. I passaggi decisivi sono due: gli ' +
          'impulsi con trasformata di Fourier, che fanno in secondi quello che richiedeva ' +
          'ore, e gli esperimenti <b>bidimensionali</b>, che mettono in relazione un nucleo ' +
          'con l\'altro e permettono di risalire alla struttura — fino a determinare la ' +
          'conformazione di una proteina in soluzione, cioè nelle condizioni in cui ' +
          'lavora.' },

    { re: /cryo.?electron microscopy|electron microscopy.*solution|high.?resolution structure determination of biomolecules/i,
      tit: 'Criomicroscopia elettronica',
      sp: 'La cristallografia richiede un cristallo, e moltissime proteine — soprattutto ' +
          'quelle di membrana e i grandi complessi — non cristallizzano. La soluzione è ' +
          'congelare il campione così in fretta che l\'acqua diventi <b>vetro</b> invece di ' +
          'ghiaccio, perché i cristalli di ghiaccio distruggerebbero la struttura; poi si ' +
          'fotografano migliaia di molecole orientate a caso con un fascio di elettroni ' +
          'molto debole, e si ricostruisce la forma tridimensionale combinando le ' +
          'immagini. Si vedono macchine molecolari intere nel loro stato nativo.' },

    { re: /crystallograph|x.?ray.*structure|structures of.*important biochemical substances/i,
      tit: 'Cristallografia a raggi X delle molecole complesse',
      sp: 'I raggi X diffratti da un cristallo portano l\'informazione sulla posizione di ' +
          'ogni atomo, ma in forma indiretta: dal diagramma di diffrazione alla struttura ' +
          'c\'è un problema matematico — le <b>fasi</b> perdute — da risolvere. Risolto, si ' +
          'ottengono le coordinate atomiche di molecole che nessun metodo chimico avrebbe ' +
          'potuto chiarire: la penicillina, la vitamina B₁₂ con il suo cobalto, ' +
          'l\'insulina. La struttura cessa di essere una deduzione e diventa una misura.' },

    { re: /isotop|heavy hydrogen|deuterium|radioactive.*tracer|carbon.?14|radiocarbon/i,
      tit: 'Isotopi: tracciare e datare',
      sp: 'Due atomi dello stesso elemento con massa diversa hanno la stessa chimica, e ' +
          'questo li rende <b>etichette perfette</b>: si sostituisce un atomo con il suo ' +
          'isotopo e si segue dove va lungo una via metabolica, senza cambiare la ' +
          'reazione. La scoperta dell\'idrogeno pesante e la separazione degli isotopi ' +
          'rendono il metodo praticabile. Lo stesso principio, con il carbonio-14 ' +
          'prodotto nell\'atmosfera e il suo decadimento regolare, diventa un <b>orologio</b>: ' +
          'misurando quanto ne resta in un residuo organico si sa quando era vivo.' },

    { re: /polarograph|electrochemical.*analysis/i,
      tit: 'Polarografia',
      sp: 'Si immerge nella soluzione un elettrodo a goccia di mercurio che si rinnova ' +
          'continuamente — così la superficie è sempre pulita — e si aumenta ' +
          'gradualmente la tensione. Quando si raggiunge il potenziale a cui una specie ' +
          'si riduce, la corrente sale a gradino: il <b>potenziale</b> del gradino dice che ' +
          'cosa c\'è, la sua <b>altezza</b> quanto ce n\'è. Un\'analisi quantitativa su ' +
          'quantità minime, e la nascita dell\'elettroanalisi.' },

    { re: /colloid|disperse system|ultramicroscop|sedimentation/i,
      tit: 'Sistemi colloidali',
      sp: 'Fra una soluzione vera e una sospensione grossolana c\'è un mondo intermedio: ' +
          'particelle troppo piccole per essere viste al microscopio ottico e troppo ' +
          'grandi per comportarsi come molecole. Illuminandole di lato si vedono come ' +
          'punti luminosi, e si può contarle; con la <b>centrifuga</b> ad alta velocità si ' +
          'misura la loro massa dalla velocità di sedimentazione. È lo strumento con cui ' +
          'si dimostra che le proteine hanno una massa definita, cioè che sono molecole.' },

    /* ── Biochimica ────────────────────────────────────────────────────── */
    { re: /photosynthesis|carbon dioxide assimilation|photosynthetic reaction cent/i,
      tit: 'Fotosintesi: dal carbonio fissato al centro di reazione',
      sp: 'Come una pianta trasforma anidride carbonica in zucchero è stato chiarito con ' +
          'il carbonio radioattivo: si somministra CO₂ marcata, si ferma la pianta dopo ' +
          'tempi crescenti e si guarda <b>in quale ordine</b> compare la marcatura nei ' +
          'metaboliti. Ne esce il ciclo di fissazione del carbonio. L\'altra metà del ' +
          'problema è la luce, e lì serve la struttura: il <b>centro di reazione ' +
          'fotosintetico</b> risolto atomo per atomo mostra come un fotone separa una carica ' +
          'attraverso la membrana, cioè come la luce diventa energia chimica.' },

    { re: /enzyme|fermentation|cell.?free/i,
      tit: 'Enzimi: la catalisi della vita',
      sp: 'Che la fermentazione potesse avvenire in un estratto <b>privo di cellule</b> ha ' +
          'spezzato l\'idea che i processi vitali richiedessero la cellula intera: sono ' +
          'reazioni chimiche catalizzate da sostanze isolabili. Da lì la storia è una ' +
          'progressiva messa a fuoco — cristallizzare un enzima, dimostrare che è una ' +
          'proteina, poi vederne la struttura e capire che la catalisi viene dalla forma: ' +
          'il sito attivo stabilizza lo <b>stato di transizione</b>, e abbassare quella ' +
          'barriera è tutto quello che un catalizzatore fa.' },

    { re: /ribozyme|catalytic properties of rna|rna.*catalyt/i,
      tit: 'RNA catalitico',
      sp: 'La divisione dei compiti sembrava netta: gli acidi nucleici conservano ' +
          'l\'informazione, le proteine fanno il lavoro. Poi si scopre che certe molecole ' +
          'di RNA <b>tagliano e ricuciono se stesse</b> senza alcuna proteina: sono ' +
          'catalizzatori. Oltre a essere una sorpresa meccanicistica, cambia la storia ' +
          'delle origini: una molecola che porta informazione <i>e</i> catalizza può aver ' +
          'preceduto la divisione dei ruoli. E il ribosoma stesso, visto nel dettaglio, ' +
          'si rivela un ribozima.' },

    { re: /ribosome/i,
      tit: 'La struttura del ribosoma',
      sp: 'Il ribosoma legge l\'RNA messaggero e costruisce la proteina corrispondente: è ' +
          'la macchina che traduce l\'informazione genetica in chimica. Risolverne la ' +
          'struttura ha richiesto di cristallizzare un complesso da centinaia di migliaia ' +
          'di atomi, fatto di RNA e proteine insieme. Il risultato mostra che il legame ' +
          'peptidico viene formato in un sito fatto di <b>RNA</b>, non di proteina — e ' +
          'mostra dove si attaccano molti antibiotici, cioè perché funzionano e come ' +
          'nascono le resistenze.' },

    { re: /polymerase chain reaction|site.?directed mutagenesis|oligonucleotide|dna.?based chemistry/i,
      tit: 'Moltiplicare e riscrivere il DNA',
      sp: 'Due invenzioni che rendono il DNA una materia da laboratorio. La prima ' +
          'moltiplica una sequenza scelta per cicli di riscaldamento e raffreddamento: ad ' +
          'ogni ciclo le copie raddoppiano, e da una molecola si arriva a miliardi in ' +
          'un\'ora. La seconda <b>cambia un singolo amminoacido</b> in una proteina, a scelta: ' +
          'si modifica il gene in un punto preciso e si guarda che cosa smette di ' +
          'funzionare. È il modo in cui si dimostra che un residuo del sito attivo serve ' +
          'davvero.' },

    { re: /sequence|structure of proteins.*insulin|base sequences in nucleic acids/i,
      tit: 'Leggere la sequenza',
      sp: 'Una proteina è una catena di amminoacidi in un ordine preciso, e stabilire ' +
          'quell\'ordine — per l\'insulina, la prima — richiede di tagliarla in pezzi, ' +
          'identificarli e ricostruire la sovrapposizione. Lo stesso problema per gli ' +
          'acidi nucleici viene risolto in modo diverso e più potente: si fanno crescere ' +
          'copie della catena che si <b>fermano</b> a una base nota, e dalla lunghezza dei ' +
          'frammenti si legge la sequenza. Da qui tutta la biologia molecolare che legge ' +
          'genomi.' },

    { re: /green fluorescent protein/i,
      tit: 'La proteina fluorescente verde',
      sp: 'Una proteina di medusa che emette luce verde, e che — questo è il punto — ' +
          'costruisce il proprio cromoforo da sé, senza bisogno di cofattori. Quindi si ' +
          'può <b>attaccare il suo gene</b> al gene di qualunque altra proteina e guardare, ' +
          'in una cellula viva, dove quella proteina va e quando viene prodotta. Con le ' +
          'varianti di colore ottenute per mutazione si seguono più proteine ' +
          'contemporaneamente. Da reagente di nicchia a strumento ordinario della ' +
          'biologia cellulare.' },

    { re: /ubiquitin|protein degradation/i,
      tit: 'Degradazione delle proteine mediata da ubiquitina',
      sp: 'Le proteine non si limitano a essere prodotte: vengono <b>eliminate</b> quando ' +
          'servono, e l\'eliminazione è regolata con la stessa precisione della sintesi. ' +
          'Il marchio è una piccola proteina, l\'ubiquitina, attaccata in catena al ' +
          'bersaglio: quel marchio lo indirizza a una macchina che lo smonta consumando ' +
          'ATP. Spiega come si controlla il ciclo cellulare e come si tolgono di mezzo ' +
          'le proteine mal ripiegate — e dà bersagli terapeutici reali.' },

    { re: /ion channel|aquaporin|water channel|membrane channel/i,
      tit: 'Canali di membrana: acqua e ioni',
      sp: 'Una membrana lipidica è impermeabile all\'acqua e agli ioni, e una cellula ' +
          'deve farli passare in modo regolato. Lo fa con proteine che formano pori ' +
          'estremamente selettivi: un canale per l\'acqua che passa miliardi di molecole ' +
          'al secondo e <b>respinge i protoni</b>, e canali per il potassio che distinguono ' +
          'il potassio dal sodio pur essendo quest\'ultimo più piccolo. La selettività si ' +
          'capisce solo vedendo la struttura: la geometria del poro compensa esattamente ' +
          'l\'energia che lo ione perde lasciando l\'acqua.' },

    { re: /atp synthase|enzymatic mechanism underlying the synthesis of adenosine triphosphate|ion.?transporting/i,
      tit: 'Come si fabbrica l\'ATP',
      sp: 'L\'energia della respirazione non viene usata direttamente per fare ATP: viene ' +
          'usata per <b>pompare protoni</b> attraverso una membrana, creando un dislivello ' +
          'di concentrazione e di carica. Quei protoni poi rientrano attraverso un enzima ' +
          'che, girando come una turbina, costringe i suoi siti catalitici a cambiare ' +
          'forma a turno e a condensare ADP e fosfato. Un gradiente di protoni come ' +
          'valuta energetica, e un motore rotante dentro una proteina: entrambe le cose ' +
          'sono state contestate prima di essere dimostrate.' },

    { re: /g.?protein.?coupled receptor/i,
      tit: 'I recettori accoppiati a proteine G',
      sp: 'Una cellula deve sapere che fuori c\'è un ormone, un odore o la luce, senza ' +
          'che quella molecola entri. Ci riesce con recettori che attraversano la ' +
          'membrana sette volte: il segnale si lega fuori, la proteina <b>cambia forma</b>, e ' +
          'dentro attiva una proteina G che innesca la cascata. Sono la famiglia di ' +
          'recettori più numerosa del genoma umano e il bersaglio di una grossa fetta dei ' +
          'farmaci in commercio: vederne la struttura nei due stati, attivo e inattivo, ' +
          'spiega come un agonista differisce da un antagonista.' },

    { re: /directed evolution|phage display/i,
      tit: 'Evoluzione diretta',
      sp: 'Progettare un enzima da zero è difficilissimo; <b>far evolvere</b> uno che esiste ' +
          'è praticabile. Si introducono mutazioni casuali nel gene, si producono migliaia ' +
          'di varianti, si seleziona quella che fa meglio il lavoro voluto, e si ripete. ' +
          'Lo stesso schema applicato ai peptidi esposti sulla superficie di un virus ' +
          'permette di cercare, in librerie enormi, quello che si lega a un bersaglio ' +
          'dato. Si ottengono catalizzatori e anticorpi che la natura non ha mai fatto, ' +
          'usando il meccanismo della natura.' },

    { re: /genome editing|crispr/i,
      tit: 'Riscrivere il genoma',
      sp: 'Un sistema di difesa dei batteri contro i virus si rivela uno strumento ' +
          'generale: una proteina che taglia il DNA, guidata al punto giusto da una ' +
          'piccola molecola di <b>RNA</b> complementare alla sequenza bersaglio. Cambiando ' +
          'l\'RNA guida si cambia il bersaglio: è una forbice programmabile scrivendo ' +
          'venti lettere. Da lì la modifica di un gene in un punto scelto diventa una ' +
          'procedura di laboratorio ordinaria, con tutto quello che ne segue in medicina ' +
          'e in agricoltura, e le questioni etiche che ne sono venute.' },

    { re: /peptide hormone|sulphur compounds.*biochemically important|oxytocin/i,
      tit: 'Ormoni peptidici, sintetizzati',
      sp: 'Alcuni ormoni sono peptidi corti con un ponte disolfuro. Isolarli dai tessuti ' +
          'dà quantità minime; la dimostrazione che la struttura proposta è giusta — e la ' +
          'via per averne in quantità utile — è <b>rifarli per sintesi</b>, legame per ' +
          'legame, nell\'ordine giusto. Riuscirci per i primi ormoni peptidici apre la ' +
          'sintesi peptidica come disciplina, e con essa l\'intera industria dei farmaci ' +
          'peptidici.' },

    { re: /cholesterol|steroid|bile acid|sterol/i,
      tit: 'Steroidi e acidi biliari',
      sp: 'Colesterolo, acidi biliari e ormoni sessuali hanno in comune uno scheletro di ' +
          'quattro anelli condensati. Stabilirne la struttura è stato un lavoro di anni ' +
          'di degradazioni chimiche controllate, prima che la cristallografia esistesse: ' +
          'si rompe la molecola in modi noti e si ricostruisce l\'origine dai frammenti. ' +
          'Capita la struttura, si capisce la famiglia: una stessa impalcatura e ' +
          'funzioni diversissime a seconda dei gruppi che porta.' },

    { re: /haemin|chlorophyll|pyrrole|porphyrin/i,
      tit: 'Eme e clorofilla',
      sp: 'Il rosso del sangue e il verde delle foglie sono la stessa idea chimica: un ' +
          'anello di quattro unità pirroliche che tiene al centro un metallo — ferro ' +
          'nell\'eme, magnesio nella clorofilla. Dimostrarlo ha richiesto di degradare le ' +
          'due molecole e poi di <b>risintetizzarle</b>. Il risultato collega due mondi che ' +
          'sembravano lontani, trasporto dell\'ossigeno e cattura della luce, e inaugura ' +
          'la chimica dei complessi tetrapirrolici.' },

    { re: /carotenoid|vitamin|flavin/i,
      tit: 'Carotenoidi e vitamine',
      sp: 'Sostanze presenti in tracce, indispensabili, e a lungo definite solo dai ' +
          'sintomi della loro mancanza. Il lavoro consiste nell\'isolarle in forma pura — ' +
          'quantità minuscole da materiale biologico — stabilirne la struttura e ' +
          'confermarla per sintesi. Ne esce, fra l\'altro, il legame fra i pigmenti ' +
          'vegetali gialli e arancioni e la vitamina A: il carotene è il <b>precursore</b>, ' +
          'tagliato in due dall\'organismo.' },

    { re: /sugar|purine|carbohydrate/i,
      tit: 'Zuccheri e purine',
      sp: 'Gli zuccheri hanno molti centri stereogenici e differiscono fra loro solo per ' +
          'la configurazione: distinguerli richiede un metodo, non solo pazienza. ' +
          'Costruirne la <b>gerarchia</b> per via chimica — quale si trasforma in quale, con ' +
          'reazioni che non toccano la stereochimica — chiarisce la struttura dei ' +
          'principali e fonda la stereochimica dei composti naturali. Lo stesso approccio ' +
          'sulle purine mette ordine fra le basi azotate.' },

    { re: /alkaloid|plant product|natural products/i,
      tit: 'Alcaloidi e prodotti vegetali',
      sp: 'Le piante producono molecole azotate complesse e potentemente attive: ' +
          'morfina, chinina, stricnina. Isolarle e stabilirne la struttura, con la ' +
          'chimica delle degradazioni, è stato un lavoro di decenni; e sono state la ' +
          'palestra su cui si sono formati i metodi dell\'analisi strutturale organica — ' +
          'oltre che il punto di partenza di molti farmaci, che spesso sono un alcaloide ' +
          'naturale semplificato.' },

    /* ── Elementi, nucleo, atmosfera ───────────────────────────────────── */
    { re: /transuranium|transuranic|plutonium|actinide/i,
      tit: 'Gli elementi transuranici',
      sp: 'Oltre l\'uranio la tavola periodica non finisce: gli elementi successivi si ' +
          'possono <b>fabbricare</b>, bombardando nuclei con neutroni o con nuclei più ' +
          'piccoli. Il lavoro chimico è il più difficile: identificare un elemento nuovo ' +
          'quando ne esistono pochi atomi, che decadono in fretta, significa prevederne ' +
          'il comportamento chimico e separarlo per quello. Da qui la collocazione degli ' +
          'attinidi in una serie propria, cioè una modifica della tavola periodica ' +
          'motivata dalla chimica.' },

    { re: /artificial radioactiv|new radioactive element|radium|polonium/i,
      tit: 'Radioattività e nuovi elementi',
      sp: 'Alcuni minerali emettono radiazione più intensamente di quanto il loro ' +
          'contenuto di uranio spieghi: dentro c\'è qualcos\'altro. Isolarlo richiede di ' +
          'trattare tonnellate di minerale per ottenerne frazioni di grammo, seguendo ' +
          'l\'attività come unica guida. Più tardi si scopre che la radioattività si può ' +
          'anche <b>produrre</b>: bombardando elementi stabili se ne ottengono isotopi ' +
          'radioattivi, e nasce la disponibilità di traccianti per la chimica e la ' +
          'medicina.' },

    { re: /chemistry of radioactive substances|radiochemistry|nuclear fission/i,
      tit: 'Chimica delle sostanze radioattive',
      sp: 'Studiare un elemento presente in quantità invisibili ha richiesto un metodo ' +
          'nuovo: si segue il <b>decadimento</b> invece della massa, e si separa per ' +
          'affinità chimica aggiungendo un vettore inattivo che si comporta allo stesso ' +
          'modo. Con questi strumenti si costruiscono le serie di decadimento, si ' +
          'chiarisce la nozione di isotopo, e si identificano i prodotti di una ' +
          'trasformazione nucleare per via puramente chimica.' },

    { re: /ozone|atmospheric chemistry|formation and decomposition of ozone/i,
      tit: 'La chimica dell\'ozono stratosferico',
      sp: 'L\'ozono in alta atmosfera assorbe l\'ultravioletto e si forma e si distrugge ' +
          'in un equilibrio naturale. Il risultato che ha cambiato la politica ambientale ' +
          'è che alcune sostanze industriali inerti e innocue in basso — i ' +
          'clorofluorocarburi — <b>arrivano intatte</b> in stratosfera, lì vengono ' +
          'spezzate dalla radiazione e liberano cloro, che distrugge l\'ozono in cicli ' +
          'catalitici: un singolo atomo di cloro ne consuma migliaia di molecole. Una ' +
          'previsione di laboratorio poi confermata dal buco antartico.' },

    { re: /osmotic pressure|solution|dynamics.*chemical equilibrium/i,
      tit: 'Le leggi delle soluzioni e dell\'equilibrio',
      sp: 'Le soluzioni diluite obbediscono a leggi della stessa forma di quelle dei gas: ' +
          'la <b>pressione osmotica</b> dipende dalla concentrazione come la pressione di ' +
          'un gas dalla densità. Insieme arrivano la descrizione quantitativa ' +
          'dell\'equilibrio chimico e della velocità delle reazioni con la temperatura. È ' +
          'la nascita della chimica fisica: la chimica diventa una disciplina con ' +
          'equazioni, non solo con ricette.' },

    { re: /electrolytic dissociation|electrolyte/i,
      tit: 'La dissociazione elettrolitica',
      sp: 'Un sale in acqua non resta intero: si <b>separa in ioni</b>, e sono gli ioni che ' +
          'portano la corrente. L\'idea fu accolta con scetticismo — sembrava assurdo che ' +
          'il cloruro di sodio si scindesse spontaneamente — ma spiega di colpo la ' +
          'conducibilità, l\'abbassamento del punto di congelamento e il comportamento ' +
          'degli acidi. Da qui pH, costanti di dissociazione e tutta l\'elettrochimica ' +
          'delle soluzioni.' }
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
    versione: '1.0'
  };

})(typeof window !== 'undefined' ? window : globalThis);
