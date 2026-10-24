/* ═══════════════════════════════════════════════════════════════════════════
   bsi-articoli-nobel-fisica — le spiegazioni dei Nobel per la fisica

   PERCHE' QUESTO FILE CONTIENE SOLO SPIEGAZIONI E NESSUN DATO

   Qui dentro non c'e' un solo anno, non c'e' un solo nome di premiato, non
   c'e' una sola motivazione ufficiale. E' una scelta, ed e' la piu'
   importante di tutto il modulo — la stessa del file gemello sulla chimica.

   Anni, premiati e motivazioni arrivano dall'API della Fondazione Nobel
   (categoria fisica), in diretta, nel browser di chi legge. Se li avessi
   scritti io a memoria, nessuno avrebbe potuto distinguere un anno giusto da
   un anno sbagliato: un errore di attribuzione non si vede, sta li' e sembra
   un dato.

   E le spiegazioni non sono legate a un ANNO: sono legate a un ARGOMENTO.
   Ogni voce dichiara un'espressione regolare che si confronta con la
   motivazione ufficiale. Se la motivazione del premio parla di «neutrino
   oscillations», compare la spiegazione delle oscillazioni dei neutrini — a
   qualunque anno appartenga quel premio. Cosi' non posso sbagliare
   un'attribuzione nemmeno volendo: non ne faccio nessuna.

   Se per un premio nessun argomento combacia, non si inventa niente: si
   mostra la motivazione ufficiale, i premiati e i materiali della
   Fondazione, e si dice che la spiegazione non c'e'.

   LA REGOLA CHE OGNI VOCE DEVE RISPETTARE

   Niente nomi di persona nel testo, nemmeno dentro gli eponimi: in fisica
   moltissimi effetti portano il nome di chi li ha scoperti, e scrivere
   quel nome sarebbe gia' un'attribuzione. Qui l'effetto si descrive per
   quello che e' («la luce che cambia lunghezza d'onda urtando un
   elettrone»), e il nome lo dice l'API. Le espressioni regolari possono
   contenere un eponimo, perche' lo contiene la motivazione ufficiale: quelle
   non si mostrano, servono solo a riconoscere l'argomento.
   `tools/banchi/test_articoli.js` verifica le stesse regole del file sulla
   chimica.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';

  /* Ogni voce:
       re   espressione regolare confrontata con la motivazione ufficiale
            (in inglese: la motivazione ufficiale e' in inglese)
       tit  il titolo dell'argomento, in italiano
       sp   la spiegazione
     L'ordine conta: vince la PRIMA che combacia, quindi le voci specifiche
     stanno prima di quelle generiche. Le coppie delicate sono segnate:
     una motivazione che parla di due cose (la carica elementare E l'effetto
     fotoelettrico, la camera a nebbia E i raggi cosmici) va alla voce del
     risultato principale, che quindi deve stare prima. */
  var ARGOMENTI = [

    /* ── Raggi X, radiazione, nascita dei quanti ───────────────────────── */
    { re: /remarkable rays|rays subsequently named/i,
      tit: 'I raggi X',
      sp: 'Un tubo a scarica avvolto in cartone nero fa brillare uno schermo ' +
          'fluorescente a distanza: ne esce una radiazione invisibile che attraversa ' +
          'carta, legno e carne, ma viene fermata dalle ossa e dai metalli. Sono i ' +
          '<b>raggi X</b>: onde elettromagnetiche con lunghezza d\'onda dell\'ordine di ' +
          'un decimo di nanometro, prodotte quando elettroni veloci vengono frenati ' +
          'bruscamente nell\'anodo (<b>radiazione di frenamento</b>) o quando riempiono ' +
          'una lacuna in un guscio interno. Nel giro di pochi mesi entrano negli ' +
          'ospedali; per la fisica diventano la chiave per guardare dentro la materia, ' +
          'dalla diffrazione nei cristalli alla struttura degli atomi.' },

    { re: /diffraction of x.?rays by crystals/i,
      tit: 'La diffrazione dei raggi X nei cristalli',
      sp: 'Se i raggi X sono onde con lunghezza d\'onda simile alla distanza fra gli ' +
          'atomi, un cristallo — una disposizione regolare di atomi — deve comportarsi ' +
          'come un <b>reticolo di diffrazione</b> tridimensionale. L\'esperimento lo ' +
          'conferma: dietro il cristallo compare una figura di macchie disposte con la ' +
          'simmetria del reticolo. Un solo esperimento dimostra due cose insieme: che i ' +
          'raggi X sono onde elettromagnetiche, e che i cristalli sono davvero ' +
          '<b>disposizioni periodiche di atomi</b>. Da qui nasce la cristallografia, che ' +
          'darà la struttura dei sali, dei metalli, delle proteine e del DNA.' },

    { re: /crystal structure by means of x.?rays|analysis of crystal structure/i,
      tit: 'La struttura dei cristalli dai raggi X',
      sp: 'La diffrazione si può leggere come una riflessione dei raggi X su famiglie ' +
          'di piani atomici paralleli: le onde riflesse da piani successivi si sommano ' +
          'solo se la differenza di cammino è un multiplo intero della lunghezza ' +
          'd\'onda, <b>2d sin θ = nλ</b>. Misurando gli angoli di riflessione si ricavano ' +
          'le distanze fra i piani e quindi la posizione degli atomi; con lo ' +
          '<b>spettrometro a cristallo</b>, al contrario, si misura la lunghezza d\'onda ' +
          'dei raggi X. Le prime strutture risolte — il cloruro di sodio, il diamante — ' +
          'mostrano che in un sale non esistono molecole, ma un reticolo di ioni.' },

    { re: /characteristic .{0,16}radiation of the elements|characteristic x.?radiation/i,
      tit: 'La radiazione X caratteristica degli elementi',
      sp: 'Un materiale colpito da raggi X riemette raggi X secondari. Una parte è ' +
          'diffusa e mostra di essere polarizzata, come si addice a un\'onda trasversale; ' +
          'un\'altra parte è <b>caratteristica</b> dell\'elemento colpito: ha una ' +
          'penetrazione, cioè un\'energia, fissa, che cresce regolarmente con il peso ' +
          'atomico, e si raggruppa in serie (chiamate poi K, L…). Nasce dalle lacune ' +
          'aperte nei gusci elettronici interni e riempite da elettroni più esterni. È ' +
          'un\'impronta digitale degli elementi e la prova che gli elettroni dell\'atomo ' +
          'sono distribuiti in <b>gusci</b> successivi.' },

    { re: /x.?ray spectroscopy/i,
      tit: 'La spettroscopia a raggi X',
      sp: 'Con spettrometri a cristallo sempre più precisi si misurano le righe X di ' +
          'quasi tutti gli elementi. Le loro energie seguono una regola semplice: la ' +
          'radice quadrata della frequenza cresce linearmente con il <b>numero atomico</b> ' +
          'Z. Con questa regola si ordinano gli elementi, si individuano i posti ancora ' +
          'vuoti della tavola periodica e si conferma che Z è la carica del nucleo. La ' +
          'struttura fine delle righe rivela i sottolivelli dei gusci interni. È la mappa ' +
          'dei <b>livelli energetici interni</b> degli atomi, e oggi la base dell\'analisi ' +
          'elementare per fluorescenza X.' },

    { re: /influence of magnetism upon radiation|magnetism upon radiation phenomena/i,
      tit: 'Il campo magnetico che divide le righe spettrali',
      sp: 'Una sorgente di luce posta fra i poli di un magnete emette righe spettrali che ' +
          'si <b>allargano e si separano</b> in più componenti, polarizzate in modo ' +
          'diverso. La spiegazione teorica: la luce è emessa da cariche che oscillano ' +
          'dentro l\'atomo, e il campo magnetico ne sposta la frequenza di ±eB/(4πm). ' +
          'Dalla separazione misurata si ricava il rapporto carica/massa di chi emette, ' +
          'ed è quello dell\'elettrone: dentro gli atomi ci sono <b>elettroni</b>. Più tardi ' +
          'le separazioni «anomale» riveleranno lo spin; oggi la stessa misura dà il ' +
          'campo magnetico delle macchie solari.' },

    { re: /canal rays|splitting of spectral lines in electric fields/i,
      tit: 'Righe spettrali in campo elettrico e raggi canale',
      sp: 'Due effetti, entrambi osservati nei raggi canale — fasci di ioni positivi che ' +
          'attraversano un catodo forato. Primo: la luce emessa da questi ioni in volo ' +
          'ha le righe <b>spostate in frequenza</b> per il moto della sorgente, la prova ' +
          'che anche gli atomi in movimento si comportano come sorgenti mobili e un modo ' +
          'diretto di misurarne la velocità. Secondo: in un intenso <b>campo elettrico</b> ' +
          'le righe dell\'idrogeno si separano in più componenti, l\'analogo elettrico ' +
          'dello spezzamento magnetico. La meccanica quantistica lo spiegherà ' +
          'quantitativamente, ed è oggi un modo di misurare i campi nei plasmi.' },

    { re: /radiation of heat|laws governing the radiation/i,
      tit: 'Le leggi della radiazione termica',
      sp: 'Un corpo nero — idealmente una cavità con un piccolo foro — emette uno spettro ' +
          'che dipende soltanto dalla temperatura. La lunghezza d\'onda del massimo si ' +
          'sposta in modo inversamente proporzionale alla temperatura, ' +
          '<b>λ_max·T = costante</b> (circa 2,9 mm·K): per questo un ferro scaldato passa ' +
          'dal rosso al bianco, e dal colore di una stella se ne ricava la temperatura. ' +
          'Una legge per la forma dello spettro funziona alle alte frequenze ma fallisce ' +
          'alle basse; la teoria classica fa il contrario. Proprio questa ' +
          '<b>contraddizione</b> aprirà la strada ai quanti di energia.' },

    { re: /energy quanta|quantum of action/i,
      tit: 'I quanti di energia',
      sp: 'Per ottenere uno spettro del corpo nero che concordi con le misure a tutte le ' +
          'frequenze occorre un\'ipotesi che sembrava un artificio di calcolo: la materia ' +
          'scambia energia con la radiazione solo in <b>pacchetti</b> di grandezza ' +
          'E = hν, proporzionali alla frequenza. Con questa ipotesi la divergenza ' +
          'ultravioletta scompare e lo spettro è descritto esattamente; dal confronto con ' +
          'i dati si ricavano h ≈ 6,6·10⁻³⁴ J·s, la carica elementare e il numero di ' +
          'molecole in una mole. La <b>costante d\'azione h</b> è la firma di tutta la ' +
          'fisica quantistica: dove conta, la fisica classica non basta più.' },

    /* prima della voce sull'effetto fotoelettrico: la stessa motivazione
       parla della carica elementare E dell'effetto fotoelettrico */
    { re: /elementary charge/i,
      tit: 'La carica elementare',
      sp: 'Goccioline d\'olio caricate elettricamente, sospese fra le armature di un ' +
          'condensatore: regolando il campo elettrico si bilancia il peso, si misura la ' +
          'velocità di caduta e se ne ricava la carica. Tutte le cariche osservate sono ' +
          '<b>multipli interi</b> di un\'unica quantità, e ≈ 1,6·10⁻¹⁹ C: la carica ' +
          'elettrica è quantizzata. Con lo stesso rigore viene verificata la legge ' +
          'dell\'effetto fotoelettrico, E = hν − W, che si sperava di smentire: la retta ' +
          'che lega energia degli elettroni e frequenza ha pendenza h, e dà il valore ' +
          'della <b>costante d\'azione</b> con una precisione inedita.' },

    { re: /photoelectric/i,
      tit: 'L\'effetto fotoelettrico',
      sp: 'La luce che colpisce un metallo ne strappa elettroni; ma la loro energia non ' +
          'dipende dall\'intensità della luce, solo dalla frequenza, e sotto una frequenza ' +
          'di soglia non escono affatto, per quanto intenso sia il fascio. Per un\'onda ' +
          'classica è inspiegabile. La spiegazione: la luce stessa è fatta di ' +
          '<b>quanti</b> di energia hν, e ciascuno cede tutta la sua energia a un singolo ' +
          'elettrone: E_cin = hν − W, con W il <b>lavoro di estrazione</b> del metallo. È ' +
          'la nascita del fotone e del dualismo onda-particella, e il principio di ' +
          'fotocellule, fotomoltiplicatori e celle solari.' },

    { re: /structure of atoms|radiation emanating from them/i,
      tit: 'La struttura dell\'atomo e i livelli quantizzati',
      sp: 'Un atomo con un nucleo piccolo ed elettroni in orbita, secondo la fisica ' +
          'classica, dovrebbe irradiare e collassare in una frazione di nanosecondo. Il ' +
          'modello che lo salva impone che l\'elettrone occupi solo <b>stati stazionari</b>, ' +
          'con momento angolare multiplo di ħ, e che emetta luce solo saltando da uno ' +
          'all\'altro: hν = E_m − E_n. Per l\'idrogeno E_n = −13,6 eV/n², e le serie di ' +
          'righe note da decenni escono con il valore giusto. È il ponte fra quanti e ' +
          'chimica, e il principio di <b>corrispondenza</b> con la fisica classica ' +
          'guiderà la costruzione della meccanica quantistica.' },

    { re: /impact of an electron upon an atom/i,
      tit: 'Gli urti fra elettroni e atomi',
      sp: 'Elettroni accelerati attraverso un vapore di mercurio: la corrente raccolta ' +
          'cresce con la tensione, poi crolla bruscamente a intervalli regolari di circa ' +
          '4,9 V. Sotto quella soglia gli urti sono elastici e l\'elettrone non perde ' +
          'energia; appena la raggiunge, cede all\'atomo <b>esattamente</b> 4,9 eV, e il ' +
          'vapore emette luce ultravioletta della frequenza corrispondente, hν = 4,9 eV. ' +
          'È la prova diretta, con elettroni e non con la luce, che gli atomi hanno ' +
          '<b>livelli energetici discreti</b>, e il primo esperimento di spettroscopia ' +
          'per impatto elettronico.' },

    /* prima della voce generica sull'«effetto che porta il suo nome»: anche
       questa motivazione lo contiene, ma l'argomento e' la diffusione */
    { re: /scattering of light/i,
      tit: 'La diffusione anelastica della luce',
      sp: 'Quando un fascio monocromatico attraversa un liquido trasparente, quasi tutta ' +
          'la luce diffusa conserva la frequenza; ma una piccolissima frazione esce con ' +
          'frequenze <b>spostate</b> di quantità fisse, ν₀ ± ν_vib, caratteristiche della ' +
          'sostanza. Il fotone ha ceduto alla molecola (o ricevuto da essa) un quanto di ' +
          'energia vibrazionale o rotazionale. Lo spettro di queste righe è un\'impronta ' +
          'della molecola, complementare all\'infrarosso perché obbedisce a regole di ' +
          'selezione diverse: dipende dalla variazione della <b>polarizzabilità</b>. Con il ' +
          'laser è diventata una delle spettroscopie più usate.' },

    { re: /effect named after him/i,
      tit: 'La diffusione di raggi X da parte di elettroni liberi',
      sp: 'Raggi X diffusi da un materiale leggero escono con lunghezza d\'onda ' +
          '<b>maggiore</b> di quella incidente, e lo spostamento dipende solo dall\'angolo ' +
          'di diffusione: Δλ = (h/mc)(1 − cos θ). L\'ottica ondulatoria classica non lo ' +
          'prevede. Lo prevede invece un urto elastico fra due particelle: un fotone con ' +
          'energia hν e quantità di moto h/λ colpisce un elettrone libero, gli cede parte ' +
          'della sua energia e rimbalza. È la prova che il quanto di luce porta anche ' +
          '<b>quantità di moto</b> ed è una particella a tutti gli effetti; h/mc ≈ 2,4 pm ' +
          'è la lunghezza d\'onda caratteristica dell\'elettrone.' },

    { re: /wave nature of electrons/i,
      tit: 'La natura ondulatoria della materia',
      sp: 'Se la luce, che è un\'onda, si comporta anche come particella, forse vale il ' +
          'contrario. L\'ipotesi associa a ogni particella materiale un\'<b>onda</b> con ' +
          'lunghezza λ = h/p, dove p è la quantità di moto. Per un elettrone accelerato ' +
          'da circa cento volt, λ vale circa un decimo di nanometro: come la distanza fra ' +
          'gli atomi di un cristallo. Le orbite stabili dell\'atomo diventano <b>onde ' +
          'stazionarie</b> che si richiudono su sé stesse con un numero intero di ' +
          'lunghezze d\'onda. È il punto di partenza della meccanica ondulatoria, e il ' +
          'principio del microscopio elettronico.' },

    { re: /diffraction of electrons/i,
      tit: 'La diffrazione degli elettroni',
      sp: 'Un fascio di elettroni lenti diffuso da un cristallo di nichel mostra massimi ' +
          'di intensità ad angoli precisi; elettroni veloci che attraversano sottili ' +
          'lamine metalliche producono anelli concentrici, come i raggi X. Le posizioni ' +
          'coincidono con quelle previste per un\'onda di lunghezza <b>λ = h/p</b>: gli ' +
          'elettroni si diffrangono. È la conferma sperimentale che la materia ha natura ' +
          'ondulatoria. Ne nascono la <b>diffrazione elettronica</b> per lo studio di ' +
          'superfici e film sottili e la possibilità di costruire microscopi con ' +
          'risoluzione ben oltre i limiti della luce visibile.' },

    { re: /creation of quantum mechanics|allotropic forms of hydrogen/i,
      tit: 'La nascita della meccanica quantistica',
      sp: 'Basta con orbite che nessuno può osservare: la teoria deve parlare solo di ' +
          'grandezze misurabili, come frequenze e intensità delle righe. Le grandezze ' +
          'fisiche diventano tabelle, cioè <b>matrici</b>, che non commutano: ' +
          'xp − px = iħ. Da questa regola segue il <b>principio di indeterminazione</b>, ' +
          'Δx·Δp ≥ ħ/2: posizione e quantità di moto non hanno valori definiti ' +
          'contemporaneamente. La nuova meccanica prevede anche che la molecola di ' +
          'idrogeno esista in due forme, con gli spin dei nuclei paralleli (orto) o ' +
          'antiparalleli (para) e calori specifici diversi: confermato dalle misure.' },

    { re: /statistical interpretation of the wave.?function/i,
      tit: 'L\'interpretazione statistica della funzione d\'onda',
      sp: 'Che cos\'è, fisicamente, la funzione d\'onda ψ? Non una carica spalmata nello ' +
          'spazio, come si era pensato all\'inizio: il suo modulo quadro |ψ|² è una ' +
          '<b>densità di probabilità</b>, la probabilità di trovare la particella in un ' +
          'punto se la si cerca. La teoria non prevede i singoli eventi, ma le loro ' +
          'frequenze su molte ripetizioni identiche. È un abbandono del determinismo ' +
          'classico che trovò resistenze anche fra i fondatori, ma è ancora oggi la ' +
          '<b>regola</b> che collega il formalismo ai risultati delle misure, e la base ' +
          'della teoria quantistica degli urti.' },

    { re: /new productive forms of atomic theory/i,
      tit: 'L\'equazione d\'onda e l\'elettrone relativistico',
      sp: 'Due forme nuove della teoria atomica. La prima descrive l\'elettrone con una ' +
          '<b>funzione d\'onda</b> ψ che obbedisce a un\'equazione differenziale, ' +
          'iħ ∂ψ/∂t = Hψ: i livelli dell\'atomo sono le frequenze proprie di questa onda, ' +
          'come i modi di una corda vibrante, e la formulazione si dimostra equivalente ' +
          'a quella con le matrici. La seconda rende l\'equazione compatibile con la ' +
          'relatività: ne escono da sole lo <b>spin</b> dell\'elettrone, il suo momento ' +
          'magnetico, la struttura fine dell\'idrogeno — e soluzioni a energia negativa ' +
          'che annunciano l\'<b>antimateria</b>.' },

    { re: /exclusion principle/i,
      tit: 'Il principio di esclusione',
      sp: 'Due elettroni di un atomo non possono avere tutti e quattro i <b>numeri ' +
          'quantici</b> uguali: ogni stato quantico ospita un solo elettrone. Da questa ' +
          'regola, formulata per spiegare gli spettri, discende l\'intera tavola ' +
          'periodica: gli elettroni riempiono gusci successivi invece di cadere tutti ' +
          'nello stato più basso. In forma generale, la funzione d\'onda di particelle ' +
          'identiche con spin semintero è <b>antisimmetrica</b> per scambio. È il motivo ' +
          'per cui la materia occupa volume e non collassa, e regge la fisica dei ' +
          'metalli, delle nane bianche e delle stelle di neutroni.' },

    /* ── Elettroni, gas, materia ───────────────────────────────────────── */
    { re: /conduction of electricity by gases/i,
      tit: 'La scarica nei gas e la scoperta dell\'elettrone',
      sp: 'Un gas normalmente isola; ionizzato da raggi X o da una scarica, conduce. ' +
          'Studiandone la conduzione, e deviando i raggi catodici con campi elettrici e ' +
          'magnetici incrociati, si misura il rapporto <b>e/m</b> delle particelle che li ' +
          'compongono: è lo stesso qualunque siano il gas e il metallo del catodo, e ' +
          'quasi duemila volte più grande di quello dello ione idrogeno. Sono particelle ' +
          'universali, molto più leggere di qualsiasi atomo: gli <b>elettroni</b>. È il ' +
          'primo costituente subatomico mai identificato, e la fine dell\'atomo come ' +
          'oggetto indivisibile.' },

    { re: /cathode rays/i,
      tit: 'I raggi catodici',
      sp: 'In un tubo a vuoto, dal catodo parte un fascio che fa brillare il vetro, viene ' +
          'deviato dai magneti e porta carica negativa. Facendolo uscire dal tubo ' +
          'attraverso una sottilissima finestra metallica si scopre che i raggi catodici ' +
          '<b>attraversano la materia</b> per tratti molto più lunghi di quanto ' +
          'consentirebbe un atomo pieno: l\'atomo è in gran parte <b>vuoto</b>. Misurando ' +
          'l\'assorbimento al variare della velocità si ottiene una prima immagine ' +
          'dell\'interno dell\'atomo. Gli stessi tubi sono gli antenati dei tubi a raggi X ' +
          'e degli schermi a tubo catodico.' },

    { re: /thermionic/i,
      tit: 'L\'emissione termoionica',
      sp: 'Un filamento metallico rovente emette elettroni nel vuoto. La corrente di ' +
          'saturazione cresce con la temperatura secondo una legge precisa, ' +
          'J = A T² e^(−W/kT), dove W è il <b>lavoro di estrazione</b> del metallo: gli ' +
          'elettroni si comportano come un gas che evapora superando una barriera di ' +
          'energia alla superficie. La misura conferma che gli elettroni di conduzione ' +
          'sono liberi dentro il metallo e trattenuti solo al bordo. Su questo fenomeno ' +
          'si fondano le <b>valvole termoioniche</b> — diodi, triodi — cioè tutta ' +
          'l\'elettronica prima del transistor, e i catodi dei tubi a raggi X.' },

    { re: /discontinuous structure of matter|sedimentation equilibrium/i,
      tit: 'La realtà degli atomi: l\'equilibrio di sedimentazione',
      sp: 'All\'inizio del secolo c\'era ancora chi considerava gli atomi un\'ipotesi comoda ' +
          'e non una realtà. In una sospensione di granuli microscopici tutti uguali, la ' +
          'densità decresce con l\'altezza secondo una legge esponenziale, come ' +
          'nell\'atmosfera ma su scala di decine di micrometri: è l\'<b>equilibrio di ' +
          'sedimentazione</b> fra peso e agitazione termica. Da quella misura, e dallo ' +
          'spostamento quadratico medio dei granuli agitati dagli urti molecolari, si ' +
          'ricava il numero di molecole in una mole, circa 6·10²³, con valori concordi ' +
          'fra metodi indipendenti. La materia è <b>discontinua</b>.' },

    { re: /equation of state/i,
      tit: 'L\'equazione di stato di gas e liquidi',
      sp: 'Il gas perfetto, pV = nRT, ignora due fatti: le molecole occupano un volume e ' +
          'si attraggono. Correggendo la legge con due soli parametri, ' +
          '(p + an²/V²)(V − nb) = nRT, si ottiene un\'equazione che descrive ' +
          '<b>insieme</b> gas e liquido e prevede il <b>punto critico</b>, oltre il quale la ' +
          'distinzione fra i due scompare. In variabili ridotte, divise per i valori ' +
          'critici, diventa quasi la stessa per tutte le sostanze: è la legge degli stati ' +
          'corrispondenti, che guida la liquefazione di idrogeno ed elio. Ed è la prima ' +
          'teoria di campo medio di una transizione di fase.' },

    { re: /argon|densities of the most important gases/i,
      tit: 'L\'argon e le densità dei gas',
      sp: 'L\'azoto estratto dall\'aria risulta più pesante, di circa mezzo punto ' +
          'percentuale, dell\'azoto preparato chimicamente da composti come l\'ammoniaca. ' +
          'Una differenza minuscola ma ostinata, che misure di <b>densità</b> ' +
          'precisissime non riuscivano a eliminare. La spiegazione: nell\'aria c\'è un gas ' +
          'sconosciuto, circa l\'1%, chimicamente inerte, che non reagisce con nulla. È ' +
          'l\'<b>argon</b>, il primo dei gas nobili: un\'intera colonna della tavola ' +
          'periodica che mancava. Un esempio da manuale di come la terza cifra decimale, ' +
          'presa sul serio, possa nascondere una scoperta.' },

    /* ── Precisione, ottica, strumenti ─────────────────────────────────── */
    { re: /optical precision instruments|spectroscopic and metrological/i,
      tit: 'L\'interferometria di precisione',
      sp: 'Si divide un fascio di luce in due, lo si manda lungo due bracci e lo si ' +
          'ricombina: le frange di <b>interferenza</b> si spostano di una frangia ogni ' +
          'volta che un braccio si allunga di mezza lunghezza d\'onda. Si misurano così ' +
          'distanze con la precisione di una frazione di micrometro, e il metro campione ' +
          'si può esprimere in lunghezze d\'onda di una riga spettrale invece che con una ' +
          'sbarra di metallo. Lo stesso strumento, cercando il moto della Terra rispetto ' +
          'all\'etere, non trova nulla: un <b>risultato nullo</b> che diventa un pilastro ' +
          'della relatività. Il suo erede, con bracci di chilometri, rivela le onde ' +
          'gravitazionali.' },

    { re: /reproducing colou?rs photographically|colou?r photograph/i,
      tit: 'La fotografia a colori per interferenza',
      sp: 'Un\'emulsione fotografica a grana finissima è posta a contatto con uno ' +
          'specchio di mercurio. La luce incidente e quella riflessa formano <b>onde ' +
          'stazionarie</b>: nello spessore dell\'emulsione si depositano strati di argento ' +
          'distanti mezza lunghezza d\'onda. Sviluppata e illuminata in luce bianca, la ' +
          'lastra riflette per interferenza solo la lunghezza d\'onda che l\'ha generata: ' +
          'il colore non viene da pigmenti, è <b>registrato nella struttura</b>, come nei ' +
          'riflessi delle ali di farfalla. Il metodo era poco pratico, ma è un antenato ' +
          'diretto dell\'olografia e dei cristalli fotonici.' },

    { re: /wireless telegraph/i,
      tit: 'La telegrafia senza fili',
      sp: 'Le onde elettromagnetiche previste dalla teoria e prodotte in laboratorio con ' +
          'le scintille diventano un mezzo di comunicazione. Servono un ' +
          '<b>trasmettitore</b> a scintilla accoppiato a un\'antenna, un\'antenna ricevente ' +
          'collegata a terra e un rivelatore sensibile; poi <b>circuiti accordati</b> che ' +
          'selezionano la frequenza e permettono a più stazioni di non disturbarsi. La ' +
          'portata passa da pochi metri a migliaia di chilometri, oltre la curvatura ' +
          'terrestre — possibile, si capirà poi, grazie alla riflessione negli strati ' +
          'ionizzati dell\'alta atmosfera. È l\'inizio della radio e di tutte le ' +
          'telecomunicazioni senza cavo.' },

    { re: /lighthouses|gas accumulators|automatic regulators/i,
      tit: 'I regolatori automatici per i fari',
      sp: 'Fari e boe in luoghi isolati dovevano essere accesi e spenti da guardiani. La ' +
          'soluzione è un insieme di dispositivi automatici: una <b>valvola solare</b> che ' +
          'sfrutta la diversa dilatazione di barre scure e lucide al sole per chiudere il ' +
          'gas all\'alba e riaprirlo al tramonto; un regolatore che produce lampi brevi ' +
          'invece di una fiamma continua; un accumulatore riempito di materiale poroso che ' +
          'conserva in sicurezza l\'acetilene. Il consumo crolla e un faro può funzionare ' +
          'per mesi senza personale. Un premio alla <b>fisica applicata</b>, che ha ' +
          'salvato molte vite in mare.' },

    { re: /nickel steel|anomalies in nickel/i,
      tit: 'Le leghe ferro-nichel a dilatazione quasi nulla',
      sp: 'Un metro campione o il pendolo di un orologio si allungano con la temperatura, ' +
          'e la misura ne risente. Studiando le leghe di ferro e nichel si scopre che, ' +
          'intorno al 36% di nichel, il <b>coefficiente di dilatazione termica</b> diventa ' +
          'quasi zero: una lega che scaldata non si allunga. L\'anomalia ha origine ' +
          'magnetica — una contrazione legata all\'ordine magnetico compensa l\'espansione ' +
          'termica — e sarà compresa solo con la teoria quantistica del magnetismo. Sul ' +
          'momento è un regalo alla <b>metrologia</b>: campioni di lunghezza, strumenti ' +
          'geodetici e orologi insensibili alla temperatura.' },

    { re: /phase contrast/i,
      tit: 'Il microscopio a contrasto di fase',
      sp: 'Una cellula viva è quasi trasparente: non assorbe la luce, la ritarda soltanto ' +
          'un poco, e un microscopio normale vede quasi nulla. Il ritardo di <b>fase</b> ' +
          'esiste, ma l\'occhio non lo percepisce. L\'idea è separare, nel piano focale ' +
          'dell\'obiettivo, la luce diffratta dall\'oggetto da quella diretta, e sfasare ' +
          'quest\'ultima di un quarto d\'onda con una lamina: le due interferiscono, e le ' +
          'differenze di fase diventano <b>differenze di intensità</b>. Le strutture ' +
          'interne delle cellule vive diventano visibili senza coloranti né fissazione: ' +
          'una rivoluzione per la biologia.' },

    { re: /holograph/i,
      tit: 'L\'olografia',
      sp: 'Una fotografia registra solo l\'intensità della luce e perde la fase, cioè ' +
          'l\'informazione sulla profondità. Se l\'onda diffusa dall\'oggetto si sovrappone ' +
          'a un\'onda di riferimento coerente, la lastra registra le <b>frange di ' +
          'interferenza</b>, che contengono ampiezza e fase. Illuminando poi la lastra con ' +
          'lo stesso riferimento si ricostruisce l\'onda originale: l\'oggetto appare in ' +
          '<b>tre dimensioni</b>, con la parallasse. Nata per migliorare la risoluzione ' +
          'dei microscopi elettronici, l\'idea si realizza pienamente con il laser: ' +
          'memorie ottiche, interferometria olografica, sicurezza delle banconote.' },

    { re: /electron optics|electron microscope/i,
      tit: 'Il microscopio elettronico',
      sp: 'La risoluzione di un microscopio è limitata dalla lunghezza d\'onda: con la ' +
          'luce visibile, circa duecento nanometri. Gli elettroni accelerati hanno ' +
          'lunghezze d\'onda migliaia di volte più corte, λ = h/p. Serve però un\'ottica: ' +
          'campi magnetici prodotti da bobine agiscono sugli elettroni come <b>lenti</b>, ' +
          'focalizzandoli. Su questo principio si costruisce il primo <b>microscopio ' +
          'elettronico</b> a trasmissione, che supera presto la risoluzione ottica. Da qui ' +
          'si arriva a vedere virus, organelli e difetti nei cristalli e oggi, con la ' +
          'correzione delle aberrazioni, singole colonne di atomi.' },

    { re: /scanning tunn?ell?ing microscope/i,
      tit: 'Il microscopio a effetto tunnel',
      sp: 'Una punta metallica, affilata fino a terminare con un solo atomo, viene portata ' +
          'a meno di un nanometro da una superficie conduttrice. Fra punta e superficie ' +
          'passa una corrente per <b>effetto tunnel</b>, che varia esponenzialmente con la ' +
          'distanza: un decimo di nanometro in più e la corrente cala di circa un ordine ' +
          'di grandezza. Facendo scorrere la punta con attuatori piezoelettrici e ' +
          'mantenendo costante la corrente, si ricostruisce la superficie <b>atomo per ' +
          'atomo</b>. Lo stesso strumento permette di spostare singoli atomi, ed è il ' +
          'capostipite di tutte le microscopie a sonda.' },

    { re: /transmission of light in fib|fib(er|re)s? for optical communication|optical communication/i,
      tit: 'Le fibre ottiche per le comunicazioni',
      sp: 'Un filo di vetro guida la luce per riflessione totale, ma le prime fibre ' +
          'perdevano quasi tutto il segnale in pochi metri. L\'analisi mostra che la ' +
          'perdita non è intrinseca al vetro: è dovuta alle <b>impurità</b>, soprattutto ' +
          'ioni metallici e acqua. Con silice purissima l\'attenuazione può scendere sotto ' +
          '20 dB/km, la soglia oltre la quale le comunicazioni ottiche convengono; oggi si ' +
          'è sotto 0,2 dB/km. Insieme al laser a semiconduttore nasce la rete di <b>fibre ' +
          'ottiche</b>, che porta quasi tutto il traffico di dati del pianeta, anche ' +
          'attraverso gli oceani.' },

    { re: /\bccd\b|imaging semiconductor circuit/i,
      tit: 'Il sensore di immagini a trasferimento di carica',
      sp: 'Un chip di silicio diviso in una matrice di minuscoli condensatori. La luce, ' +
          'per effetto fotoelettrico interno, libera in ciascuno una carica proporzionale ' +
          'all\'intensità. Poi, cambiando in sequenza le tensioni degli elettrodi, le ' +
          'cariche vengono fatte <b>scorrere</b> da un pixel all\'altro come secchi passati ' +
          'di mano in mano, fino a un amplificatore che le legge una per una. È il ' +
          '<b>sensore CCD</b>, lineare ed efficientissimo: ha sostituito la lastra ' +
          'fotografica in astronomia e la pellicola nelle fotocamere, ed è stato a lungo ' +
          'l\'occhio dei telescopi spaziali e degli strumenti medici.' },

    { re: /blue light.?emitting diode|light.?emitting diode/i,
      tit: 'Il LED blu e la luce bianca efficiente',
      sp: 'LED rossi e verdi esistevano da decenni, ma per avere luce bianca serviva il ' +
          '<b>blu</b>, e il semiconduttore adatto — il nitruro di gallio — era difficilissimo ' +
          'da crescere in cristalli di qualità e da drogare di tipo p. Con strati tampone ' +
          'opportuni fra substrato e cristallo, e attivando il drogante con trattamenti ' +
          'mirati, si ottengono giunzioni efficienti, poi pozzi quantici di nitruro di ' +
          'gallio e indio. Un LED blu con un fosforo giallo dà <b>luce bianca</b>: lampade ' +
          'che consumano una frazione delle lampadine a incandescenza e durano decine di ' +
          'volte di più.' },

    /* ── Atomi, risonanze, luce coerente ───────────────────────────────── */
    { re: /molecular ray|molecular beam|magnetic moment of the proton/i,
      tit: 'I fasci molecolari e il momento magnetico del protone',
      sp: 'Atomi o molecole che escono da un forno attraverso fenditure formano un fascio ' +
          'nel vuoto, in cui ogni particella vola isolata. In un campo magnetico non ' +
          'uniforme gli atomi vengono deviati secondo il loro <b>momento magnetico</b>: il ' +
          'fascio non si allarga in modo continuo ma si separa in macchie distinte, prova ' +
          'diretta della quantizzazione dell\'orientamento. Con lo stesso metodo si misura ' +
          'il momento magnetico del protone, circa 2,8 volte quello atteso per una ' +
          'particella puntiforme: il protone non è elementare, ha una <b>struttura ' +
          'interna</b>.' },

    { re: /resonance method for recording the magnetic|magnetic properties of atomic nuclei/i,
      tit: 'La risonanza magnetica nei fasci atomici',
      sp: 'Un fascio atomico attraversa due magneti che deviano gli atomi in versi ' +
          'opposti, e fra i due una regione con un campo statico e un debole campo ' +
          'oscillante. Quando la frequenza del campo oscillante coincide con quella di ' +
          'precessione del momento nucleare, ω = γB, lo spin <b>si ribalta</b> e l\'atomo ' +
          'non viene più rifocalizzato sul rivelatore: il segnale crolla. Questa ' +
          '<b>risonanza</b> misura i momenti magnetici nucleari con una precisione mai ' +
          'vista. È l\'antenata della risonanza magnetica nucleare, delle immagini per ' +
          'risonanza magnetica e degli orologi atomici.' },

    { re: /nuclear magnetic precision|nuclear magnetic resonance|nuclear induction/i,
      tit: 'La risonanza magnetica nucleare nella materia',
      sp: 'Non più in fasci atomici, ma nella materia ordinaria: un campione posto in un ' +
          'campo magnetico assorbe energia da un campo a radiofrequenza alla frequenza di ' +
          'precessione dei nuclei, ω = γB, e i momenti nucleari, messi in rotazione, ' +
          'inducono a loro volta un segnale in una bobina. Due metodi — <b>assorbimento</b> ' +
          'e <b>induzione nucleare</b> — misurano momenti e campi con precisione ' +
          'straordinaria. Poiché la frequenza dipende dall\'intorno chimico e i tempi di ' +
          'rilassamento dall\'ambiente, ne nasceranno la spettroscopia NMR in chimica e ' +
          'la risonanza magnetica per immagini in medicina.' },

    { re: /fine structure of the hydrogen spectrum|magnetic moment of the electron/i,
      tit: 'Lo spostamento dei livelli dell\'idrogeno e il momento dell\'elettrone',
      sp: 'Due misure di altissima precisione con microonde e fasci atomici. Nella prima, ' +
          'due livelli dell\'idrogeno che la teoria relativistica dell\'elettrone prevede ' +
          'perfettamente coincidenti, 2s₁/₂ e 2p₁/₂, risultano separati da un\'energia ' +
          'piccolissima, pari a circa un miliardo di oscillazioni al secondo. Nella ' +
          'seconda, il momento magnetico dell\'elettrone supera di circa una parte su ' +
          'mille il valore previsto: g non vale esattamente 2. Entrambi gli scarti ' +
          'nascono dall\'interazione con le <b>fluttuazioni del vuoto</b>, e da qui parte ' +
          'l\'<b>elettrodinamica quantistica</b> moderna.' },

    { re: /quantum electrodynamics/i,
      tit: 'L\'elettrodinamica quantistica',
      sp: 'La teoria quantistica dell\'interazione fra luce e materia dava risultati ' +
          'infiniti appena si andava oltre la prima approssimazione. La soluzione è la ' +
          '<b>rinormalizzazione</b>: gli infiniti si assorbono nella massa e nella carica ' +
          'dell\'elettrone, che si prendono dalle misure, e tutto il resto diventa finito ' +
          'e calcolabile. Con una formulazione covariante e una rappresentazione grafica ' +
          'dei processi, la teoria calcola il momento magnetico anomalo dell\'elettrone in ' +
          'accordo con l\'esperimento fino a dieci cifre significative: una delle ' +
          'previsioni più precise della scienza, e il <b>modello</b> di ogni teoria di ' +
          'campo successiva.' },

    { re: /hertzian resonances|optical methods for studying/i,
      tit: 'Il pompaggio ottico',
      sp: 'Illuminando un vapore atomico con luce polarizzata circolarmente, ogni fotone ' +
          'assorbito porta momento angolare; dopo molti cicli di assorbimento ed emissione ' +
          'gli atomi si accumulano in un unico sottolivello magnetico. È il <b>pompaggio ' +
          'ottico</b>: si crea un forte squilibrio di popolazione fra livelli separati da ' +
          'energie piccolissime, nella regione delle radiofrequenze. Le transizioni fra ' +
          'questi sottolivelli si rivelano poi come variazioni della luce assorbita o ' +
          'emessa: una rivelazione <b>ottica</b>, molto più sensibile, di risonanze ' +
          'magnetiche. Ne discendono magnetometri atomici e orologi a vapore.' },

    /* prima del maser: la motivazione cita il «hydrogen maser» */
    { re: /separated oscillatory fields|atomic clocks/i,
      tit: 'I campi oscillanti separati e gli orologi atomici',
      sp: 'Nella risonanza di un fascio atomico la larghezza della riga dipende dal tempo ' +
          'che l\'atomo passa nel campo oscillante: per una riga stretta servirebbe un ' +
          'campo perfettamente uniforme su una lunga regione. Più efficace è usare <b>due ' +
          'brevi zone</b> di interazione separate da un lungo tratto libero: l\'atomo ' +
          'accumula una fase, e l\'interferenza fra le due interazioni produce frange ' +
          'molto più strette. Il metodo è il cuore degli orologi atomici al cesio, che ' +
          'definiscono il <b>secondo</b>, e del maser a idrogeno. Senza di essi non ' +
          'esisterebbero la navigazione satellitare né le reti sincronizzate.' },

    { re: /ion trap/i,
      tit: 'La trappola per ioni',
      sp: 'Un campo elettrostatico da solo non può intrappolare una carica in tutte le ' +
          'direzioni. Due soluzioni: un campo elettrico <b>oscillante</b> a radiofrequenza, ' +
          'che produce in media un confinamento efficace in tre dimensioni; oppure un ' +
          'campo elettrostatico combinato con un forte campo magnetico. Con queste ' +
          'trappole si isola un <b>singolo ione</b>, o un singolo elettrone, per mesi, lo si ' +
          'osserva e lo si misura. Il momento magnetico dell\'elettrone viene misurato con ' +
          'dodici cifre significative, e gli ioni intrappolati diventano la base di ' +
          'orologi ottici e calcolatori quantistici.' },

    { re: /maser.?laser|quantum electronics/i,
      tit: 'Il maser e il laser',
      sp: 'L\'emissione stimolata — un fotone che induce un atomo eccitato a emetterne un ' +
          'altro identico, con stessa frequenza, fase e direzione — era nota da decenni. ' +
          'Se si crea un\'<b>inversione di popolazione</b>, con più atomi nello stato alto ' +
          'che in quello basso, il mezzo amplifica invece di assorbire. Chiuso in una ' +
          'cavità risonante diventa un oscillatore: prima nelle microonde (maser), poi nel ' +
          'visibile (laser). La luce prodotta è <b>coerente</b>, monocromatica e ' +
          'direzionale. Ne derivano spettroscopia di precisione, fibre ottiche, chirurgia, ' +
          'lettori ottici, lavorazioni industriali.' },

    /* prima della spettroscopia laser in generale */
    { re: /frequency comb|laser.?based precision spectroscopy/i,
      tit: 'Il pettine di frequenze ottiche',
      sp: 'Misurare direttamente la frequenza della luce visibile, centinaia di migliaia ' +
          'di miliardi di oscillazioni al secondo, sembrava impossibile. Un laser a ' +
          'impulsi ultrabrevi emette uno spettro fatto di migliaia di righe ' +
          '<b>equidistanti</b>, separate esattamente dalla frequenza di ripetizione: ' +
          'f_n = f₀ + n·f_rep. Stabilizzando le due radiofrequenze f_rep e f₀ si ottiene ' +
          'un righello ottico che collega in un solo passo le microonde degli orologi al ' +
          'cesio alla luce. È il <b>pettine di frequenze</b>: la base degli orologi ottici ' +
          'e della spettroscopia di precisione dell\'idrogeno.' },

    { re: /laser spectroscopy/i,
      tit: 'La spettroscopia laser',
      sp: 'Il laser porta in spettroscopia luce intensa, monocromatica e accordabile. Due ' +
          'conseguenze. Con intensità elevate la risposta della materia non è più ' +
          'lineare: nasce l\'<b>ottica non lineare</b>, con la generazione di armoniche e ' +
          'la miscelazione di frequenze. E con tecniche come la spettroscopia di ' +
          'saturazione, in cui due fasci contropropaganti interagiscono solo con gli ' +
          'atomi fermi lungo il fascio, si elimina l\'<b>allargamento</b> delle righe dovuto ' +
          'al moto termico: si misurano righe molto più sottili, come quelle ' +
          'dell\'idrogeno, e le costanti che governano tutti i livelli atomici.' },

    { re: /electron spectroscopy/i,
      tit: 'La spettroscopia elettronica ad alta risoluzione',
      sp: 'Raggi X di energia nota strappano elettroni dai livelli interni degli atomi; ' +
          'misurando con precisione l\'energia cinetica con cui escono si ricava ' +
          'l\'<b>energia di legame</b>: E_legame = hν − E_cin. Con spettrometri ad alta ' +
          'risoluzione si scopre che quell\'energia si sposta di qualche eV a seconda ' +
          'dello stato chimico dell\'atomo: il carbonio di un gruppo carbonilico non è ' +
          'quello di un metile. Nasce la <b>spettroscopia fotoelettronica</b> per ' +
          'l\'analisi chimica, sensibile ai primi nanometri di una superficie: corrosione, ' +
          'catalisi, semiconduttori.' },

    { re: /quantum theory of optical coherence|optical coherence/i,
      tit: 'La teoria quantistica della coerenza ottica',
      sp: 'Che cosa distingue la luce di un laser da quella di una lampada filtrata allo ' +
          'stesso spettro? Non l\'intensità media, ma le sue <b>correlazioni</b>: la ' +
          'probabilità di rivelare due fotoni a breve distanza di tempo. Una teoria ' +
          'quantistica della coerenza definisce funzioni di correlazione di ordine ' +
          'crescente e introduce gli stati coerenti, la descrizione quantistica più ' +
          'vicina a un\'onda classica. La luce termica mostra fotoni raggruppati, il laser ' +
          'no, e certe sorgenti mostrano fotoni <b>antiraggruppati</b>, impossibili ' +
          'classicamente. È il fondamento dell\'ottica quantistica.' },

    { re: /cool and trap atoms|laser cooling/i,
      tit: 'Il raffreddamento e l\'intrappolamento di atomi con il laser',
      sp: 'Un atomo che assorbe un fotone riceve una piccola spinta nel verso del fascio. ' +
          'Con fasci accordati poco sotto la risonanza, l\'atomo che va incontro a un ' +
          'fascio vede la luce spostata verso la risonanza e la assorbe di più: subisce ' +
          'un attrito. Sei fasci lungo tre assi creano una <b>melassa ottica</b> che frena ' +
          'gli atomi a pochi centimetri al secondo, milionesimi di grado sopra lo zero ' +
          'assoluto; effetti di polarizzazione portano persino sotto il limite atteso. Con ' +
          'campi magnetici si costruiscono <b>trappole</b>: la base di condensati, orologi e ' +
          'interferometri atomici.' },

    { re: /einstein condensation|dilute gases of alkali/i,
      tit: 'La condensazione quantistica nei gas atomici',
      sp: 'Particelle con spin intero, a temperatura abbastanza bassa, si accumulano in ' +
          'massa nello stesso stato quantico di energia minima: una previsione della ' +
          'statistica quantistica rimasta irraggiungibile per decenni nei gas. Raffreddando ' +
          'un gas diluito di atomi alcalini prima con il laser e poi per <b>evaporazione</b> ' +
          'in una trappola magnetica, fino a meno di un milionesimo di grado sopra lo zero ' +
          'assoluto, gli atomi si raccolgono in un\'unica onda di materia: un ' +
          '<b>condensato</b>. Si osservano interferenza fra condensati, vortici quantizzati, ' +
          'laser atomici: meccanica quantistica in un oggetto visibile.' },

    { re: /individual quantum systems/i,
      tit: 'Misurare e manipolare singoli sistemi quantistici',
      sp: 'Per decenni gli esperimenti quantistici hanno riguardato insiemi di moltissime ' +
          'particelle; osservare un singolo oggetto senza distruggerne lo stato sembrava ' +
          'impossibile. Due strade complementari: ioni singoli intrappolati e controllati ' +
          'con la luce laser; e fotoni intrappolati in cavità superconduttrici, sondati da ' +
          'atomi che le attraversano senza assorbirli. Si segue passo dopo passo il ' +
          '<b>collasso</b> di una sovrapposizione, si osserva la <b>decoerenza</b> di stati ' +
          'mesoscopici, si contano i fotoni uno a uno. Sono i primi passi verso il ' +
          'calcolatore quantistico e gli orologi ottici più precisi.' },

    { re: /entangled photons|bell inequalities|quantum information/i,
      tit: 'Fotoni entangled e informazione quantistica',
      sp: 'Due particelle in uno stato <b>entangled</b> mostrano correlazioni che nessuna ' +
          'teoria con proprietà fissate in anticipo e influenze solo locali può ' +
          'riprodurre: lo esprimono disuguaglianze che ogni teoria a variabili nascoste ' +
          'locali deve rispettare. Esperimenti con coppie di fotoni le <b>violano</b>, ' +
          'sempre più nettamente, chiudendo una per una le scappatoie — per esempio ' +
          'cambiando l\'orientamento dei polarizzatori mentre i fotoni sono in volo. La ' +
          'meccanica quantistica ha ragione. Gli stessi strumenti rendono possibili il ' +
          'teletrasporto di stati e lo scambio di entanglement: la base dell\'informazione ' +
          'quantistica.' },

    { re: /attosecond/i,
      tit: 'Gli impulsi di luce ad attosecondi',
      sp: 'Gli elettroni si muovono negli atomi su tempi di attosecondi, miliardesimi di ' +
          'miliardesimo di secondo: per seguirli serve un lampo ancora più breve. Un laser ' +
          'infrarosso intenso strappa un elettrone a un atomo di gas, lo accelera e lo ' +
          'rimanda contro lo ione: ricombinandosi, emette <b>armoniche</b> di ordine ' +
          'elevato. Le armoniche sono in fase fra loro e formano un treno di impulsi di ' +
          'poche centinaia di attosecondi; con tecniche apposite se ne isola uno solo. Si ' +
          'misurano così il ritardo di emissione nell\'effetto fotoelettrico e la dinamica ' +
          'degli <b>elettroni</b> nella materia.' },

    { re: /optical tweezers/i,
      tit: 'Le pinzette ottiche',
      sp: 'La luce porta quantità di moto, e quindi esercita forze. Un fascio laser ' +
          'fortemente focalizzato attira una piccola particella trasparente verso il punto ' +
          'di <b>massima intensità</b>: i raggi rifratti dalla particella cambiano direzione, ' +
          'e la reazione la spinge verso il fuoco. Si possono afferrare e spostare ' +
          'sferette micrometriche, batteri, virus e cellule vive senza danneggiarli. ' +
          'Agganciando una sferetta a una proteina si misurano forze piccolissime e passi ' +
          'di pochi nanometri: si vedono lavorare le <b>macchine molecolari</b> che ' +
          'camminano lungo i filamenti della cellula.' },

    { re: /ultra.?short optical pulses|high.?intensity|chirped pulse|inventions in the field of laser physics/i,
      tit: 'L\'amplificazione di impulsi laser ultrabrevi',
      sp: 'Amplificare un impulso laser brevissimo porta a intensità tali da distruggere ' +
          'il mezzo amplificatore. Il trucco: prima si <b>stira</b> l\'impulso nel tempo, ' +
          'facendo percorrere alle diverse lunghezze d\'onda cammini diversi, così che la ' +
          'potenza di picco diminuisca; poi lo si amplifica senza danni; infine lo si ' +
          '<b>ricomprime</b> con un dispositivo che compie l\'operazione inversa. Si ' +
          'ottengono impulsi di femtosecondi con potenze di picco enormi. È la tecnica ' +
          'dietro la chirurgia oculare laser, la microlavorazione di precisione e i laser ' +
          'più intensi del mondo.' },

    /* ── Nucleo, radioattività, rivelatori ─────────────────────────────── */
    { re: /spontaneous radioactivity|radiation phenomena discovered by/i,
      tit: 'La radioattività',
      sp: 'Sali di uranio lasciati al buio impressionano una lastra fotografica, senza ' +
          'luce né eccitazione esterna: la materia emette radiazione <b>da sola</b>, in modo ' +
          'costante, insensibile a temperatura e stato chimico. È quindi una proprietà ' +
          'del nucleo, non degli elettroni. Lo studio sistematico porta a scoprire nuovi ' +
          'elementi molto più attivi dell\'uranio e a distinguere tre radiazioni — α, β, ' +
          'γ — con poteri penetranti diversi. Il decadimento segue la legge ' +
          'N(t) = N₀e^(−t/τ): ogni nucleo ha una probabilità fissa di decadere, la prima ' +
          'legge <b>intrinsecamente statistica</b> della fisica.' },

    { re: /discovery of the neutron\b/i,
      tit: 'Il neutrone',
      sp: 'Bombardando il berillio con particelle α si ottiene una radiazione neutra molto ' +
          'penetrante, che si credeva fatta di raggi γ. Ma quando colpisce la paraffina ne ' +
          'espelle protoni con energie troppo alte per un fotone: i conti tornano solo se ' +
          'si tratta di una particella <b>neutra</b> con massa quasi uguale a quella del ' +
          'protone. Il nucleo diventa comprensibile: Z protoni e N neutroni, e gli isotopi ' +
          'sono nuclei con diverso numero di neutroni. E una particella senza carica entra ' +
          'nei nuclei senza essere respinta: diventa il <b>proiettile</b> ideale per le ' +
          'reazioni nucleari, fino alla fissione.' },

    /* prima della radioattivita' indotta dai neutroni: anche questa
       motivazione parla di elementi radioattivi artificiali */
    { re: /cyclotron/i,
      tit: 'Il ciclotrone',
      sp: 'Per accelerare particelle ad alte energie serve una tensione enorme, oppure ' +
          'tante piccole spinte. In un campo magnetico uniforme una particella carica ' +
          'gira con una frequenza che non dipende dalla velocità, <b>ω = qB/m</b>. Basta ' +
          'allora applicare fra due elettrodi cavi a forma di D una tensione alternata a ' +
          'quella frequenza: a ogni mezzo giro la particella riceve una spinta e la sua ' +
          'orbita si allarga in una spirale. Con un apparato da tavolo si arriva a milioni ' +
          'di eV. Produce <b>isotopi artificiali</b> per medicina e ricerca, ed è il ' +
          'capostipite degli acceleratori circolari.' },

    { re: /neutron irradiation|slow neutrons|new radioactive elements/i,
      tit: 'La radioattività indotta dai neutroni e i neutroni lenti',
      sp: 'Bombardando uno dopo l\'altro gli elementi della tavola periodica con neutroni ' +
          'si ottengono decine di nuovi isotopi radioattivi. E si scopre un fatto ' +
          'paradossale: se i neutroni attraversano prima paraffina o acqua, la ' +
          'radioattività indotta aumenta di cento volte. Gli urti con i nuclei di ' +
          'idrogeno li rallentano, e un neutrone lento resta più a lungo vicino al nucleo, ' +
          'con una probabilità di cattura molto maggiore (sezione d\'urto ∝ 1/v). La ' +
          '<b>moderazione</b> diventerà il principio del <b>reattore nucleare</b>, e la stessa ' +
          'tecnica, applicata all\'uranio, porterà alla scoperta della fissione.' },

    { re: /transmutation of atomic nuclei|artificially accelerated/i,
      tit: 'La trasmutazione dei nuclei con particelle accelerate',
      sp: 'Fino ad allora, per spezzare un nucleo, servivano le particelle α naturali. Un ' +
          'moltiplicatore di tensione a condensatori e raddrizzatori accelera protoni a ' +
          'qualche centinaio di keV e li manda contro il litio: compaiono coppie di ' +
          'particelle α emesse in versi opposti, p + ⁷Li → 2 ⁴He. È la prima <b>reazione ' +
          'nucleare</b> provocata da una macchina. Il bilancio energetico conferma ' +
          'E = mc²: la massa mancante dei prodotti è l\'energia cinetica liberata. E ' +
          'l\'energia usata è più bassa della barriera elettrostatica del nucleo: i ' +
          'protoni la attraversano per <b>effetto tunnel</b>.' },

    /* prima della radiazione cosmica: la motivazione parla della camera a
       nebbia E delle scoperte sui raggi cosmici */
    { re: /cloud chamber|condensation of vapou?r/i,
      tit: 'La camera a nebbia',
      sp: 'Aria satura di vapore, espansa di colpo, si raffredda e diventa ' +
          'sovrassatura: il vapore vorrebbe condensare ma non trova appigli. Una ' +
          'particella carica che attraversa il gas lascia una scia di ioni, e su quegli ' +
          'ioni si formano goccioline: la sua <b>traiettoria</b> diventa una linea di ' +
          'nebbia visibile e fotografabile. In un campo magnetico le tracce si curvano, e ' +
          'dal raggio di curvatura si ricava la quantità di moto. Per decenni è stato lo ' +
          'strumento principe di fisica nucleare e raggi cosmici: vi si sono visti la ' +
          'trasmutazione dei nuclei, la <b>creazione di coppie</b> e nuove particelle.' },

    { re: /cosmic radiation|cosmic rays/i,
      tit: 'La radiazione cosmica',
      sp: 'Gli elettroscopi si scaricano lentamente anche se ben isolati, e si dava la ' +
          'colpa alla radioattività del suolo. Ma portati in pallone a qualche chilometro ' +
          'di quota, la ionizzazione invece di diminuire <b>aumenta</b>, e non cambia fra ' +
          'giorno e notte né durante un\'eclissi di Sole. La radiazione viene dallo ' +
          'spazio. I <b>raggi cosmici</b> — soprattutto protoni e nuclei di altissima ' +
          'energia, che nell\'atmosfera producono sciami di particelle secondarie — sono ' +
          'stati per decenni l\'unico acceleratore disponibile: in essi si scoprono il ' +
          'positrone, il muone e i pioni.' },

    { re: /positron/i,
      tit: 'Il positrone',
      sp: 'In una camera a nebbia immersa in un forte campo magnetico, esposta ai raggi ' +
          'cosmici, compare una traccia con la curvatura di una carica positiva ma la ' +
          'ionizzazione di un elettrone. Una lastra di piombo nella camera rivela il verso ' +
          'di percorrenza: la particella è leggera come un elettrone e ha carica +e. È il ' +
          '<b>positrone</b>, la prima particella di <b>antimateria</b>, prevista dalla teoria ' +
          'relativistica dell\'elettrone. Presto si osservano coppie elettrone-positrone ' +
          'create da raggi γ, materia che nasce dall\'energia secondo E = mc²; oggi ' +
          'l\'annichilazione dei positroni è la base della PET.' },

    /* prima della previsione dei mesoni */
    { re: /photographic method/i,
      tit: 'Le emulsioni nucleari',
      sp: 'Un\'emulsione fotografica spessa e ricca di bromuro d\'argento, esposta ai ' +
          'raggi cosmici in alta montagna o su palloni, registra in modo permanente il ' +
          'passaggio delle particelle cariche: sviluppata, mostra al microscopio le ' +
          '<b>tracce</b>, dalla cui densità di grani e lunghezza si risale a massa ed ' +
          'energia. In queste lastre si vede una particella che si ferma e decade in ' +
          'un\'altra più leggera: è il <b>pione</b>, il mesone della forza nucleare, ' +
          'distinto dal muone trovato prima. Un rivelatore semplice ed economico che apre ' +
          'la fisica delle particelle elementari.' },

    { re: /prediction of the existence of mesons|theoretical work on nuclear forces/i,
      tit: 'La previsione dei mesoni e la forza nucleare',
      sp: 'Protoni e neutroni sono tenuti insieme nel nucleo da una forza intensissima ' +
          'ma di raggio cortissimo, circa un femtometro. Come la forza elettromagnetica ' +
          'nasce dallo scambio di fotoni, questa nasce dallo scambio di una particella ' +
          '<b>con massa</b>: il raggio d\'azione è legato alla massa da r₀ ≈ ħ/mc, e il ' +
          'potenziale ha la forma e^(−r/r₀)/r. Un raggio di un femtometro richiede una ' +
          'massa di circa duecento volte quella dell\'elettrone, intermedia fra elettrone e ' +
          'protone: un <b>mesone</b>. La particella verrà trovata nei raggi cosmici: il ' +
          'pione.' },

    { re: /coincidence method/i,
      tit: 'Il metodo delle coincidenze',
      sp: 'Due contatori di particelle collegati in modo che si registri un evento solo ' +
          'quando <b>entrambi</b> scattano entro un intervallo brevissimo. Con questo filtro ' +
          'si eliminano i conteggi casuali e si seguono le singole particelle. Si dimostra ' +
          'così che quando un fotone X diffonde su un elettrone, il fotone diffuso e ' +
          'l\'elettrone di rinculo compaiono simultaneamente: energia e quantità di moto si ' +
          'conservano nel <b>singolo urto</b>, non solo in media. Le coincidenze diventano ' +
          'la logica di base di ogni rivelatore di particelle e della tomografia a ' +
          'emissione di positroni.' },

    { re: /cherenkov|cerenkov|čerenkov|cherenkov effect/i,
      tit: 'La luce delle particelle più veloci della luce nel mezzo',
      sp: 'Nel vuoto nulla supera c, ma in un mezzo trasparente la luce viaggia a c/n. ' +
          'Una particella carica che attraversa l\'acqua più veloce di c/n emette una luce ' +
          'bluastra e debole, in un cono di apertura ben definita: cos θ = 1/(nβ). È ' +
          'l\'analogo ottico del <b>bang sonico</b> di un aereo supersonico: le onde emesse ' +
          'lungo la traiettoria si sommano in fase su un fronte conico. Dall\'angolo si ' +
          'ricava la velocità della particella: è la base di <b>rivelatori</b> enormi per ' +
          'neutrini e raggi cosmici, e la causa del bagliore azzurro delle piscine dei ' +
          'reattori.' },

    { re: /antiproton/i,
      tit: 'L\'antiprotone',
      sp: 'Se ogni particella ha la sua antiparticella, deve esistere un protone con ' +
          'carica negativa. Per crearlo serve un\'energia minima: produrre una coppia ' +
          'protone-antiprotone urtando un protone fermo richiede un fascio di circa 6 GeV, ' +
          'e un acceleratore viene progettato apposta. Fra moltissimi pioni di uguale ' +
          'carica, l\'antiprotone si riconosce selezionando particelle con la massa giusta ' +
          'grazie al <b>tempo di volo</b> e alla curvatura magnetica. La simmetria fra ' +
          'materia e <b>antimateria</b> vale anche per le particelle pesanti; poco dopo si ' +
          'trova anche l\'antineutrone.' },

    /* prima della camera a bolle: la motivazione cita la camera a bolle
       come strumento, ma l'argomento sono le risonanze */
    { re: /resonance states/i,
      tit: 'Le risonanze: particelle che vivono un istante',
      sp: 'Molte particelle prodotte negli acceleratori vivono così poco — circa 10⁻²³ s ' +
          '— da non lasciare traccia: decadono prima di percorrere la larghezza di un ' +
          'nucleo. Si scoprono solo come <b>risonanze</b>, picchi nella distribuzione della ' +
          'massa invariante dei prodotti di decadimento; la larghezza Γ del picco è legata ' +
          'alla vita media da τ = ħ/Γ. Con grandi camere a bolle a idrogeno e un\'analisi ' +
          'semiautomatica di milioni di fotografie se ne scoprono a decine. Questo zoo di ' +
          'particelle è il segno che gli adroni non sono elementari, ma hanno una ' +
          '<b>struttura</b>.' },

    { re: /bubble chamber/i,
      tit: 'La camera a bolle',
      sp: 'Un liquido — idrogeno liquido, per esempio — tenuto sotto pressione appena al ' +
          'di sopra della temperatura di ebollizione. Abbassando di colpo la pressione ' +
          'diventa <b>surriscaldato</b>: vorrebbe bollire ma non trova nuclei di vapore. Una ' +
          'particella carica che lo attraversa lascia una scia di ioni, e lungo quella ' +
          'scia nascono bollicine che si fotografano. Rispetto al gas di una camera a ' +
          'nebbia il liquido è centinaia di volte più denso: le interazioni sono più ' +
          'frequenti e le particelle di alta energia restano nel rivelatore. È stato lo ' +
          'strumento principale per scoprire le particelle prodotte negli <b>acceleratori</b>.' },

    { re: /electron scattering in atomic nuclei|structure of the nucleons/i,
      tit: 'La forma dei nuclei e dei nucleoni',
      sp: 'Elettroni di alta energia sono sonde ideali: interagiscono solo ' +
          'elettromagneticamente, in modo calcolabile. Diffusi da nuclei, le deviazioni ' +
          'dal caso puntiforme rivelano la <b>distribuzione della carica</b>: densità quasi ' +
          'costante all\'interno, bordo sfumato, raggio R ≈ 1,2 fm·A^(1/3). Spingendo ' +
          'l\'energia si misura la struttura dello stesso protone e del neutrone: non sono ' +
          'punti, hanno un raggio di circa 0,8 fm e distribuzioni di carica e di ' +
          'magnetizzazione descritte da <b>fattori di forma</b>. È il primo sguardo dentro ' +
          'i nucleoni.' },

    { re: /resonance absorption of gamma|recoilless/i,
      tit: 'L\'assorbimento risonante dei raggi γ senza rinculo',
      sp: 'Un nucleo che emette un raggio γ rincula, e il fotone perde un po\' di energia: ' +
          'non può più essere assorbito in modo risonante da un nucleo uguale. Ma se il ' +
          'nucleo è legato in un cristallo, a bassa temperatura una frazione delle ' +
          'emissioni avviene <b>senza rinculo</b>: la quantità di moto la assorbe l\'intero ' +
          'reticolo. La riga γ è allora strettissima, con una risoluzione relativa di ' +
          '10⁻¹² e oltre. Muovendo la sorgente di pochi millimetri al secondo si fa ' +
          'scorrere la riga: si misurano campi interni ai solidi, stati di ossidazione del ' +
          'ferro e persino lo <b>spostamento gravitazionale</b> della frequenza sulla Terra.' },

    { re: /nuclear shell structure|shell structure/i,
      tit: 'Il modello a strati del nucleo',
      sp: 'Nuclei con 2, 8, 20, 28, 50, 82 o 126 protoni o neutroni sono particolarmente ' +
          'stabili: sono i <b>numeri magici</b>. Come gli elettroni nell\'atomo, i nucleoni ' +
          'occupano livelli raggruppati in strati; ma per riprodurre i numeri giusti serve ' +
          'un ingrediente in più, un forte <b>accoppiamento spin-orbita</b>, che separa i ' +
          'livelli a seconda che spin e momento angolare orbitale siano paralleli o ' +
          'antiparalleli. Con questo il modello spiega spin, momenti magnetici e ' +
          'stabilità dei nuclei, e perché alcuni elementi e isotopi sono più abbondanti ' +
          'nell\'universo.' },

    { re: /collective motion and particle motion/i,
      tit: 'Il moto collettivo nei nuclei',
      sp: 'Il modello a strati tratta i nucleoni come particelle indipendenti; il modello ' +
          'a goccia tratta il nucleo come un fluido. Le misure dicono che hanno ragione ' +
          'entrambi: molti nuclei <b>non sono sferici</b> ma deformati a sigaro, con ' +
          'momenti di quadrupolo elettrico molto grandi, e la deformazione è indotta dai ' +
          'nucleoni più esterni. Un nucleo deformato può ruotare, dando bande di livelli ' +
          'con energie E ∝ J(J+1), e vibrare. La teoria unisce il <b>moto collettivo</b> ' +
          'della forma e il moto dei singoli nucleoni, e spiega spettri, momenti e ' +
          'probabilità di transizione.' },

    /* ── Particelle e interazioni ──────────────────────────────────────── */
    /* prima delle simmetrie in generale: questa motivazione parla di
       violazione dei principi di simmetria */
    { re: /violations? of fundamental symmetry|neutral k.?mesons|\bcp.?violation/i,
      tit: 'La violazione della simmetria CP',
      sp: 'Dopo la scoperta che la parità non si conserva, si confidava almeno nella ' +
          'simmetria combinata <b>CP</b>: scambio di particelle e antiparticelle più ' +
          'riflessione speculare. I mesoni K neutri esistono in due forme con vite medie ' +
          'diverse; quella a vita lunga, se CP fosse esatta, non potrebbe decadere in due ' +
          'pioni. Invece lo fa, circa due volte su mille. La simmetria fra materia e ' +
          'antimateria non è perfetta, e per il teorema CPT è violata anche l\'inversione ' +
          'temporale. È una delle condizioni necessarie per spiegare perché l\'universo ' +
          'contiene materia e quasi nessuna <b>antimateria</b>.' },

    { re: /fundamental symmetry principles|theory of the atomic nucleus and the elementary particles/i,
      tit: 'Le simmetrie nella meccanica quantistica',
      sp: 'Le simmetrie di un sistema — rotazioni, riflessioni, inversione del tempo, ' +
          'scambio di particelle — diventano in meccanica quantistica operatori che ' +
          'commutano con l\'energia. La <b>teoria dei gruppi</b> diventa lo strumento per ' +
          'classificare i livelli, prevedere quali transizioni sono permesse o vietate, ' +
          'in quante righe si separerà uno spettro e con quali intensità. Si dimostra che ' +
          'ogni simmetria agisce sugli stati in modo unitario o antiunitario, e si usa la ' +
          'simmetria fra protone e neutrone, l\'<b>isospin</b>, per spiegare le regolarità ' +
          'dei nuclei leggeri: una lezione di metodo per tutta la fisica delle particelle.' },

    { re: /parity/i,
      tit: 'La violazione della parità',
      sp: 'Si dava per scontato che le leggi fisiche fossero le stesse in un mondo ' +
          'riflesso allo specchio: la simmetria di <b>parità</b>. Esaminando i dati, si nota ' +
          'che era verificata per le interazioni forti ed elettromagnetiche, ma per quelle ' +
          'deboli nessuno l\'aveva mai provata. Proposti gli esperimenti, la risposta ' +
          'arriva presto: nel decadimento β di nuclei polarizzati gli elettroni escono ' +
          'preferibilmente in verso opposto allo spin nucleare. L\'interazione debole ' +
          '<b>distingue</b> la destra dalla sinistra, e il neutrino ha una sola elicità. Uno ' +
          'dei risultati più sorprendenti della fisica del dopoguerra.' },

    { re: /classification of elementary particles/i,
      tit: 'La classificazione delle particelle e i quark',
      sp: 'Le decine di adroni scoperti negli acceleratori si dispongono in famiglie ' +
          'regolari — ottetti, decupletti — ordinate per carica e <b>stranezza</b>, un ' +
          'numero quantico conservato dalle interazioni forti. Lo schema corrisponde a una ' +
          'simmetria matematica, SU(3), e permette di prevedere particelle mancanti: una, ' +
          'con la massa e le proprietà previste, viene trovata. La spiegazione più ' +
          'semplice è che gli adroni siano fatti di costituenti con carica frazionaria, ' +
          '−1/3 e +2/3 di e: i <b>quark</b>. Considerati all\'inizio un artificio ' +
          'matematico, diventeranno la base del modello standard.' },

    { re: /deep inelastic/i,
      tit: 'La diffusione profondamente anelastica e i quark',
      sp: 'Elettroni di altissima energia contro protoni e neutroni: se la carica del ' +
          'protone fosse spalmata in modo uniforme, a grandi trasferimenti di impulso gli ' +
          'urti dovrebbero diventare rarissimi. Invece molti elettroni rimbalzano a grandi ' +
          'angoli, come se colpissero <b>oggetti puntiformi</b> dentro il nucleone. I dati ' +
          'seguono una legge di scala: dipendono da una sola variabile adimensionale. I ' +
          'costituenti hanno spin 1/2 e cariche compatibili con i <b>quark</b>, e portano ' +
          'solo metà dell\'impulso del protone: il resto è dei gluoni. È la prova ' +
          'dinamica che i quark esistono davvero.' },

    { re: /heavy elementary particle of a new kind/i,
      tit: 'Una particella pesante di tipo nuovo: il quark charm',
      sp: 'Due esperimenti indipendenti — uno in collisioni elettrone-positrone, l\'altro ' +
          'con protoni su bersaglio fisso — trovano quasi insieme una risonanza a circa ' +
          '3,1 GeV, <b>strettissima</b>: vive circa mille volte più a lungo di quanto ci si ' +
          'aspetterebbe da una particella così pesante. La spiegazione è che sia uno stato ' +
          'legato di un quark nuovo e del suo antiquark: il <b>charm</b>, che era stato ' +
          'ipotizzato per spiegare l\'assenza di certi decadimenti. È la svolta che rende ' +
          'i quark oggetti reali e consolida il modello standard.' },

    { re: /unified weak and electromagnetic|weak neutral current|electroweak unification/i,
      tit: 'L\'unificazione elettrodebole',
      sp: 'L\'interazione elettromagnetica e quella debole sembrano diversissime: una a ' +
          'lungo raggio, mediata dal fotone senza massa; l\'altra a raggio cortissimo e ' +
          'debole. La teoria le descrive come due aspetti di <b>un\'unica interazione</b>, ' +
          'con simmetria di gauge SU(2)×U(1): ad alte energie sono simmetriche, a basse ' +
          'energie la simmetria è rotta spontaneamente e tre dei quattro mediatori ' +
          'acquistano una grande massa. La teoria prevede <b>correnti deboli neutre</b>, ' +
          'poi osservate, e le masse dei mediatori W e Z, trovate dove previsto.' },

    { re: /quantum structure of electroweak|electroweak interactions/i,
      tit: 'La struttura quantistica delle interazioni elettrodeboli',
      sp: 'Una teoria con mediatori massivi sembrava impossibile da rendere finita: gli ' +
          'infiniti dei calcoli oltre la prima approssimazione non si lasciavano ' +
          'assorbire. La dimostrazione che le teorie di gauge con <b>rottura spontanea</b> ' +
          'della simmetria sono invece <b>rinormalizzabili</b> rende la teoria elettrodebole ' +
          'una teoria vera, capace di previsioni di precisione. Nascono anche gli ' +
          'strumenti di calcolo, come la regolarizzazione dimensionale e l\'algebra ' +
          'simbolica al calcolatore. Le correzioni quantistiche permettono di stimare la ' +
          'massa del quark top prima della sua scoperta.' },

    { re: /field particles w and z|communicators of weak interaction/i,
      tit: 'La scoperta dei mediatori W e Z',
      sp: 'La teoria elettrodebole prevedeva i mediatori della forza debole con masse ' +
          'intorno a 80 e 91 GeV: per produrli serviva un collisore potentissimo. La ' +
          'soluzione è trasformare un acceleratore di protoni in un <b>collisore ' +
          'protone-antiprotone</b>, accumulando antiprotoni e riducendone la dispersione ' +
          'di velocità con il <b>raffreddamento stocastico</b>, che corregge il fascio con ' +
          'segnali di retroazione misurati sul fascio stesso. Grandi rivelatori ' +
          'identificano i decadimenti in elettroni e muoni di altissima energia ' +
          'trasversa: le particelle W± e Z⁰ compaiono, con le masse previste.' },

    { re: /muon neutrino|neutrino beam method|doublet structure of the leptons/i,
      tit: 'Il neutrino muonico',
      sp: 'Un fascio di protoni di alta energia colpisce un bersaglio e produce pioni, che ' +
          'decadono in volo in muoni e neutrini; una spessa schermatura d\'acciaio assorbe ' +
          'tutto tranne i neutrini. Nasce così il primo <b>fascio di neutrini</b> ' +
          'artificiale. Nel rivelatore, le rare interazioni producono muoni ma quasi mai ' +
          'elettroni: i neutrini nati insieme a un muone sono diversi da quelli nati con ' +
          'un elettrone. Esistono almeno due tipi di neutrino, e i leptoni si ordinano in ' +
          '<b>doppietti</b> — elettrone e il suo neutrino, muone e il suo: l\'idea delle ' +
          'famiglie di particelle.' },

    { re: /tau lepton|lepton physics/i,
      tit: 'Il leptone tau',
      sp: 'In collisioni elettrone-positrone compaiono eventi insoliti: un elettrone e un ' +
          'muone di cariche opposte, nient\'altro di visibile, ed energia mancante. La ' +
          'spiegazione è la produzione di una coppia di nuovi leptoni pesanti, circa ' +
          '1,8 GeV — quasi il doppio del protone — che decadono subito in elettrone o ' +
          'muone più neutrini. È il <b>tau</b>, primo membro di una <b>terza famiglia</b> di ' +
          'particelle: con il quark bottom, trovato poco dopo, si apre la terza ' +
          'generazione del modello standard, proprio quella che serve a ospitare la ' +
          'violazione di CP.' },

    { re: /cosmic neutrinos/i,
      tit: 'I neutrini cosmici',
      sp: 'Il Sole produce energia trasformando idrogeno in elio, e ogni catena di ' +
          'reazioni emette neutrini: decine di miliardi ne attraversano ogni centimetro ' +
          'quadrato della Terra al secondo. Rivelarli richiede apparati giganteschi e ' +
          'sotterranei: centinaia di tonnellate di un liquido ricco di cloro da cui si ' +
          'estraggono, quasi atomo per atomo, i pochi atomi di argon prodotti; e grandi ' +
          'vasche d\'acqua osservate da fotomoltiplicatori, che vedono anche i neutrini di ' +
          'una <b>supernova</b>. I neutrini solari contati sono circa un terzo del previsto: ' +
          'un <b>enigma</b> che porterà alle oscillazioni.' },

    { re: /detection of the neutrino/i,
      tit: 'La rivelazione del neutrino',
      sp: 'Il neutrino era stato postulato per salvare la conservazione dell\'energia nel ' +
          'decadimento β, ma interagisce così poco da attraversare anni luce di piombo. ' +
          'Per vederlo serve una sorgente intensissima: un <b>reattore nucleare</b>, che ne ' +
          'emette un flusso enorme. In una vasca di liquido scintillatore un antineutrino ' +
          'viene catturato da un protone e produce un positrone e un neutrone: ' +
          'ν̄ + p → n + e⁺. Il segnale è una <b>coincidenza ritardata</b>: il lampo ' +
          'dell\'annichilazione del positrone e, pochi microsecondi dopo, quello della ' +
          'cattura del neutrone. La particella fantasma esiste.' },

    { re: /neutrino oscillation|neutrinos have mass/i,
      tit: 'Le oscillazioni dei neutrini',
      sp: 'Un neutrino nato di un tipo, dopo aver viaggiato, può essere rivelato come un ' +
          'tipo diverso: oscilla. Serve che i neutrini di sapore definito siano ' +
          'combinazioni di stati di <b>massa diversa</b>; la probabilità di cambiare tipo ' +
          'dipende da Δm²·L/E. Due grandi esperimenti lo dimostrano: in una vasca ' +
          'd\'acqua sotterranea i neutrini muonici atmosferici che salgono dal basso, ' +
          'dopo aver attraversato la Terra, sono meno di quelli che scendono dall\'alto; ' +
          'e contando tutti i tipi di neutrini solari si ritrova il flusso totale ' +
          'previsto. I neutrini hanno <b>massa</b>: il modello standard va esteso.' },

    { re: /particle detectors|multiwire/i,
      tit: 'La camera proporzionale a molti fili',
      sp: 'Camere a nebbia e a bolle vanno fotografate: pochi eventi al secondo, e ogni ' +
          'foto va analizzata. Una camera piena di gas con centinaia di fili sottili e ' +
          'paralleli, ciascuno con il suo amplificatore, funziona invece come un insieme ' +
          'di contatori: la particella ionizza il gas, gli elettroni migrano verso il ' +
          'filo più vicino e producono una valanga e un <b>segnale elettrico</b>. La ' +
          'posizione è data dal filo colpito, l\'energia dall\'ampiezza. Si registrano fino ' +
          'a un milione di eventi al secondo, letti da un calcolatore: è l\'inizio della ' +
          '<b>rivelazione elettronica</b> delle particelle.' },

    { re: /asymptotic freedom/i,
      tit: 'La libertà asintotica',
      sp: 'In elettrodinamica la carica efficace cresce a piccole distanze, perché le ' +
          'fluttuazioni del vuoto la schermano. Fra quark e gluoni accade il contrario: i ' +
          'gluoni portano a loro volta la carica forte, il «colore», e il loro contributo ' +
          'prevale, così l\'interazione diventa <b>sempre più debole</b> ad alte energie e ' +
          'piccole distanze. Nei processi violenti i quark dentro il protone si comportano ' +
          'come quasi liberi, mentre a grandi distanze la forza cresce e li tiene ' +
          'confinati. È la proprietà che fa della <b>cromodinamica quantistica</b> la ' +
          'teoria della forza forte.' },

    /* prima della rottura spontanea in generale */
    { re: /three families of quarks|origin of the broken symmetry/i,
      tit: 'L\'origine della violazione di CP: tre famiglie di quark',
      sp: 'Come entra la violazione della simmetria fra materia e antimateria nel modello ' +
          'standard? I quark che partecipano all\'interazione debole sono combinazioni di ' +
          'quelli di massa definita, descritte da una matrice unitaria di mescolamento. ' +
          'Con due famiglie di quark i suoi parametri si possono sempre rendere reali e ' +
          'CP è conservata; con <b>tre famiglie</b> resta inevitabilmente una <b>fase ' +
          'complessa</b>, che viola CP. La previsione, fatta quando se ne conoscevano solo ' +
          'tre, richiedeva altri tre quark: charm, bottom e top sono stati trovati, e le ' +
          'violazioni misurate nei mesoni B confermano lo schema.' },

    { re: /spontaneous(ly)? broken symmetry|spontaneous symmetry breaking/i,
      tit: 'La rottura spontanea di simmetria',
      sp: 'Le leggi di un sistema possono avere una simmetria che il suo stato ' +
          'fondamentale non ha: in un magnete gli spin scelgono una direzione anche se le ' +
          'equazioni non ne preferiscono nessuna. È la <b>rottura spontanea</b> di ' +
          'simmetria. Trasportata dalla superconduttività alla fisica delle particelle, ' +
          'l\'idea spiega gran parte della massa dei nucleoni come effetto dello stato del ' +
          'vuoto, e prevede particelle leggere associate alla simmetria rotta: i pioni, ' +
          'molto più leggeri degli altri adroni. Il meccanismo diventa un ingrediente ' +
          'essenziale del <b>modello standard</b>.' },

    { re: /origin of mass of subatomic particles|origin of mass/i,
      tit: 'Il meccanismo che dà la massa alle particelle',
      sp: 'Le teorie di gauge che descrivono le forze richiedono mediatori senza massa, ' +
          'ma quelli della forza debole sono pesanti. La soluzione è un <b>campo scalare</b> ' +
          'che riempie lo spazio con un valore non nullo anche nel vuoto: interagendo con ' +
          'esso i mediatori W e Z acquistano massa senza rompere la simmetria delle ' +
          'equazioni, e così quark e leptoni, in proporzione al loro accoppiamento. Il ' +
          'meccanismo prevede una particella associata alle eccitazioni del campo: dopo ' +
          'decenni è stata trovata al grande collisore di protoni, a circa 125 GeV. È il ' +
          'tassello che completa il <b>modello standard</b>.' },

    /* ── Materia condensata e basse temperature ────────────────────────── */
    { re: /production of liquid helium|properties of matter at low temperatures/i,
      tit: 'Le basse temperature e l\'elio liquido',
      sp: 'L\'elio è l\'ultimo gas a resistere alla liquefazione: bolle a circa 4 K, ' +
          'quattro gradi sopra lo zero assoluto. Raggiunto con raffreddamenti in cascata ' +
          'e con l\'espansione del gas, l\'elio liquido apre un intervallo di temperature ' +
          'mai esplorato. E lì la materia fa cose inattese: sotto circa 4,2 K la ' +
          'resistenza elettrica del mercurio non diminuisce gradualmente, <b>crolla a ' +
          'zero</b>. È la <b>superconduttività</b>, che resterà senza spiegazione per quasi ' +
          'mezzo secolo. Le basse temperature smettono di essere un traguardo tecnico e ' +
          'diventano un laboratorio di fenomeni quantistici.' },

    { re: /theories for condensed matter|especially liquid helium/i,
      tit: 'La teoria della materia condensata e dell\'elio superfluido',
      sp: 'Sotto circa 2,2 K l\'elio liquido scorre senza alcuna viscosità attraverso ' +
          'capillari sottilissimi. La teoria spiega questa <b>superfluidità</b> senza ' +
          'seguire i singoli atomi: il liquido freddo è uno stato fondamentale quantistico ' +
          'più un gas di <b>eccitazioni elementari</b> — fononi e rotoni — con una precisa ' +
          'relazione fra energia e impulso. Sotto una velocità critica il flusso non può ' +
          'dissipare energia, perché non ha modo di creare eccitazioni. È il modello a due ' +
          'fluidi, e il primo esempio del linguaggio delle quasiparticelle che domina la ' +
          'fisica della materia condensata.' },

    { re: /low.?temperature physics/i,
      tit: 'La fisica delle basse temperature e la superfluidità',
      sp: 'Un liquefattore di elio che espande il gas in una macchina a pistone, capace di ' +
          'produrre elio liquido in grandi quantità, rende la ricerca alle basse ' +
          'temperature accessibile a molti laboratori. Facendo scorrere l\'elio in fessure ' +
          'sottilissime si scopre che sotto circa 2,2 K fluisce <b>senza viscosità</b>: è ' +
          'la <b>superfluidità</b>. Un fenomeno quantistico macroscopico, in cui un numero ' +
          'enorme di atomi si comporta come una sola onda di materia. Dallo stesso ' +
          'laboratorio vengono anche magneti a campo intenso impulsato e nuovi metodi di ' +
          'liquefazione dei gas.' },

    { re: /helium.?3|superfluidity in helium/i,
      tit: 'La superfluidità dell\'elio-3',
      sp: 'L\'elio-4 diventa superfluido perché i suoi atomi hanno spin intero e possono ' +
          'occupare tutti lo stesso stato. L\'elio-3 ha spin semintero: come gli elettroni, ' +
          'non può condensare direttamente. Ma a circa due millesimi di grado sopra lo zero ' +
          'assoluto gli atomi si legano in <b>coppie</b>, come gli elettroni in un ' +
          'superconduttore, e il liquido diventa superfluido. Le coppie hanno momento ' +
          'angolare orbitale e spin non nulli: ne nascono più fasi superfluide, ' +
          '<b>anisotrope</b>, con una ricchezza di strutture — vortici, difetti, tessiture — ' +
          'senza paragoni.' },

    { re: /high pressures?/i,
      tit: 'La fisica delle altissime pressioni',
      sp: 'Un apparato porta i materiali a decine di migliaia di atmosfere e oltre, con ' +
          'guarnizioni che diventano tanto più ermetiche quanto più si spinge: ' +
          '<b>autoserranti</b>. A queste pressioni la materia cambia: il ghiaccio presenta ' +
          'numerose fasi cristalline diverse, i solidi cambiano struttura, resistenza ' +
          'elettrica e viscosità variano di ordini di grandezza. Misurare compressibilità, ' +
          'punti di fusione e transizioni di fase fa nascere la <b>fisica delle alte ' +
          'pressioni</b>, base della geofisica dell\'interno terrestre e, più tardi, della ' +
          'sintesi del diamante artificiale.' },

    { re: /transistor/i,
      tit: 'Il transistor',
      sp: 'In un semiconduttore come il germanio o il silicio, la conduzione dipende da ' +
          'piccole quantità di impurità che forniscono elettroni liberi (tipo n) o ' +
          '<b>lacune</b>, mancanze di elettroni che si comportano come cariche positive ' +
          '(tipo p). Studiando superfici e giunzioni fra le due zone si scopre che una ' +
          'piccola corrente in un contatto controlla una corrente molto più grande in un ' +
          'altro: un\'<b>amplificazione</b> allo stato solido. Il transistor sostituisce la ' +
          'valvola termoionica, consuma poco, si miniaturizza, e diventa l\'elemento base ' +
          'dell\'elettronica e dei calcolatori.' },

    { re: /integrated circuit/i,
      tit: 'Il circuito integrato',
      sp: 'Un circuito fatto di transistor, resistenze e condensatori saldati uno per uno ' +
          'ha un limite: più componenti, più connessioni, più guasti. L\'idea è realizzare ' +
          '<b>tutti i componenti</b> e i loro collegamenti in un unico pezzo di ' +
          'semiconduttore. Il primo circuito integrato è un oscillatore su una piastrina ' +
          'di germanio; il processo planare su silicio lo rende producibile in massa. Da ' +
          'allora il numero di transistor su un chip è cresciuto da pochi a decine di ' +
          'miliardi. È la base materiale di calcolatori, telefoni e di tutta ' +
          'l\'<b>elettronica digitale</b>.' },

    { re: /heterostructure/i,
      tit: 'Le eterostrutture a semiconduttore',
      sp: 'Strati sottilissimi di semiconduttori diversi — per esempio arseniuro di gallio ' +
          'e arseniuro di gallio e alluminio — cresciuti uno sull\'altro con reticoli ' +
          'compatibili. All\'interfaccia la <b>banda proibita</b> cambia bruscamente, e si ' +
          'possono confinare elettroni e lacune in strati di pochi nanometri o guidare la ' +
          'luce. Così si ottengono laser a semiconduttore che funzionano in continua a ' +
          'temperatura ambiente, LED efficienti, transistor ad alta mobilità per frequenze ' +
          'elevatissime: dentro le telecomunicazioni in fibra e i telefoni cellulari. E si ' +
          'apre la fisica dei <b>pozzi quantici</b>.' },

    { re: /theory of superconductivity|\bbcs/i,
      tit: 'La teoria microscopica della superconduttività',
      sp: 'Due elettroni si respingono; ma in un metallo un elettrone deforma il reticolo ' +
          'di ioni positivi, e quella deformazione attira un secondo elettrone. Ne nasce ' +
          'una debole attrazione efficace che, per quanto debole, lega gli elettroni in ' +
          '<b>coppie</b> con spin e impulsi opposti. Le coppie si condensano in un unico ' +
          'stato quantistico coerente, separato dalle eccitazioni da una <b>gap</b> di ' +
          'energia: niente può più diffondere la corrente, e la resistenza è nulla. La ' +
          'teoria spiega la dipendenza della temperatura critica dalla massa isotopica, ' +
          'il calore specifico e l\'espulsione del campo magnetico.' },

    { re: /superconductivity in ceramic|high.?temperature superconduct/i,
      tit: 'La superconduttività ad alta temperatura',
      sp: 'Per decenni il record di temperatura critica era rimasto intorno ai 20 K, con ' +
          'leghe metalliche raffreddate a elio liquido. Poi un ossido ceramico di rame, ' +
          'lantanio e bario — un materiale che a temperatura ambiente conduce male — si ' +
          'rivela superconduttore sopra i 30 K. In pochi mesi, composti della stessa ' +
          'famiglia di <b>cuprati</b> superano i 77 K, la temperatura dell\'azoto liquido, ' +
          'economico e abbondante. Il meccanismo, legato ai piani di ossido di rame e a ' +
          'forti <b>correlazioni elettroniche</b>, è ancora oggetto di ricerca: le sole ' +
          'vibrazioni del reticolo non bastano.' },

    { re: /theory of superconductors and superfluids|superconductors and superfluids/i,
      tit: 'La teoria dei superconduttori e dei superfluidi',
      sp: 'Una teoria fenomenologica descrive il superconduttore con un parametro ' +
          'd\'ordine complesso ψ, il cui modulo quadro è la densità delle coppie ' +
          'superconduttive. Ne segue che esistono due tipi di superconduttori: nel ' +
          '<b>secondo tipo</b> il campo magnetico penetra in filamenti, <b>vortici</b> che ' +
          'portano ciascuno un quanto di flusso h/2e e si dispongono in un reticolo. ' +
          'Questi materiali restano superconduttori in campi intensissimi: sono quelli dei ' +
          'magneti per la risonanza magnetica e per gli acceleratori. Un approccio ' +
          'analogo spiega l\'ordine delle fasi superfluide dell\'elio-3.' },

    /* prima dell'effetto tunnel in generale */
    { re: /macroscopic quantum|energy quanti[sz]ation in an electric circuit/i,
      tit: 'Tunnel quantistico macroscopico in un circuito elettrico',
      sp: 'L\'effetto tunnel e i livelli di energia quantizzati sono di solito proprietà ' +
          'di singoli atomi. In un circuito superconduttore interrotto da una barriera ' +
          'isolante sottilissima, l\'intera corrente — miliardi di coppie di elettroni — è ' +
          'descritta da una sola variabile, la differenza di fase. A bassissima ' +
          'temperatura il circuito passa dallo stato senza tensione a quello con tensione ' +
          'attraversando la barriera per <b>effetto tunnel</b>, e assorbe microonde solo a ' +
          'frequenze precise: ha <b>livelli quantizzati</b>, come un atomo artificiale. È la ' +
          'base dei qubit superconduttori.' },

    { re: /supercurrent through a tunnel barrier|tunnel barrier/i,
      tit: 'La supercorrente attraverso una barriera',
      sp: 'Due superconduttori separati da uno strato isolante di pochi nanometri. Le ' +
          'coppie di elettroni attraversano la barriera per effetto tunnel <b>senza ' +
          'resistenza</b>, e la corrente dipende dalla differenza di fase φ fra le due ' +
          'funzioni d\'onda macroscopiche: I = I_c sin φ. Se si applica una tensione V, la ' +
          'fase ruota e la corrente oscilla alla frequenza f = 2eV/h. Questa relazione ' +
          'lega tensione e frequenza tramite sole costanti fondamentali: diventa il ' +
          '<b>campione di tensione</b>. In anelli superconduttori questi giunti formano i ' +
          'magnetometri più sensibili e i qubit superconduttori.' },

    { re: /tunnell?ing phenomena/i,
      tit: 'L\'effetto tunnel nei solidi',
      sp: 'Un elettrone davanti a una barriera di energia più alta della sua, in fisica ' +
          'classica, rimbalza; in meccanica quantistica ha una probabilità di passarci ' +
          '<b>attraverso</b>, che cala esponenzialmente con lo spessore. Nei solidi lo si ' +
          'osserva in due modi. In un diodo a giunzione molto drogata e sottilissima la ' +
          'corrente prima cresce, poi cala all\'aumentare della tensione: una ' +
          '<b>resistenza differenziale negativa</b>, utile per oscillatori velocissimi. In ' +
          'giunzioni metallo-isolante-superconduttore la corrente tunnel misura ' +
          'direttamente la gap del superconduttore: la teoria delle coppie diventa una ' +
          'cosa che si misura.' },

    { re: /antiferromagnetism|ferrimagnetism/i,
      tit: 'Antiferromagnetismo e ferrimagnetismo',
      sp: 'In un ferromagnete i momenti magnetici atomici si allineano tutti paralleli. ' +
          'Ma l\'interazione di scambio può anche favorire l\'allineamento ' +
          '<b>antiparallelo</b>: momenti vicini alternati, magnetizzazione totale nulla, un ' +
          'ordine nascosto che si rivela nelle anomalie della suscettività sotto una ' +
          'temperatura critica, e poi direttamente con la diffrazione di neutroni. Se i ' +
          'due sottoreticoli opposti hanno momenti diversi resta una magnetizzazione ' +
          'netta: è il <b>ferrimagnetismo</b> delle ferriti, magneti isolanti indispensabili ' +
          'per l\'elettronica ad alta frequenza e la registrazione magnetica.' },

    { re: /magnetic and disordered systems|disordered systems/i,
      tit: 'La struttura elettronica dei sistemi magnetici e disordinati',
      sp: 'La teoria delle bande descrive bene i cristalli perfetti con elettroni poco ' +
          'interagenti; i materiali reali hanno disordine e interazioni forti. In un mezzo ' +
          'abbastanza disordinato la funzione d\'onda dell\'elettrone smette di estendersi ' +
          'e si <b>localizza</b>: il materiale diventa isolante anche se le bande lo ' +
          'vorrebbero metallico. In altri, la forte repulsione fra elettroni sullo stesso ' +
          'atomo rende isolante un materiale con una banda semipiena. E si chiarisce come ' +
          'nascono i momenti magnetici locali nei metalli. Sono le basi di vetri, ' +
          'semiconduttori amorfi e <b>materiali correlati</b>.' },

    /* prima dei fenomeni critici */
    { re: /topological/i,
      tit: 'Transizioni di fase e fasi topologiche della materia',
      sp: 'In due dimensioni, si pensava, non può esistere ordine a lungo raggio e quindi ' +
          'nessuna transizione di fase. Esiste invece una transizione di tipo nuovo, in ' +
          'cui coppie di <b>vortici</b> legate a bassa temperatura si separano sopra una ' +
          'temperatura critica: spiega la superfluidità dei film sottili. E certe ' +
          'proprietà di un materiale — la conduttanza quantizzata di uno strato ' +
          'bidimensionale, il comportamento di catene di spin — sono invarianti ' +
          '<b>topologici</b>: numeri interi che non cambiano per deformazioni continue, come ' +
          'il numero di buchi di una ciambella. Da qui gli isolanti topologici.' },

    { re: /critical phenomena/i,
      tit: 'I fenomeni critici e il gruppo di rinormalizzazione',
      sp: 'Vicino a un punto critico — un fluido al punto critico, un magnete alla ' +
          'temperatura in cui perde la magnetizzazione — le fluttuazioni si correlano su ' +
          'tutte le scale, e le grandezze seguono leggi di potenza con <b>esponenti ' +
          'critici</b> identici per sistemi diversissimi: l\'universalità. Il metodo per ' +
          'calcolarli è il <b>gruppo di rinormalizzazione</b>: si eliminano i dettagli a ' +
          'piccola scala un passo alla volta e si guarda come cambiano i parametri; i ' +
          'punti fissi di questa trasformazione determinano gli esponenti. Un\'idea che ' +
          'unifica fisica statistica e teoria quantistica dei campi.' },

    { re: /liquid crystals|order phenomena/i,
      tit: 'L\'ordine nella materia soffice: cristalli liquidi e polimeri',
      sp: 'I metodi della fisica delle transizioni di fase, nati per sistemi semplici come ' +
          'i magneti, si estendono a materiali molto più complessi. Nei <b>cristalli ' +
          'liquidi</b> le molecole allungate si muovono come in un liquido ma tendono ad ' +
          'allinearsi: la transizione fra fase disordinata e fase orientata si descrive ' +
          'con un parametro d\'ordine, proprio come la magnetizzazione. Nei <b>polimeri</b> ' +
          'una catena lunga si comporta come una passeggiata casuale che evita sé stessa, ' +
          'con dimensioni che seguono leggi di scala universali. Nasce la fisica della ' +
          'materia soffice: schermi, gel, tensioattivi.' },

    /* prima della versione frazionaria non serve: le espressioni sono distinte */
    { re: /quanti[sz]ed hall/i,
      tit: 'La resistenza trasversa quantizzata in due dimensioni',
      sp: 'Elettroni confinati in uno strato bidimensionale, a bassissima temperatura e ' +
          'in un campo magnetico intenso. La tensione che compare di traverso alla ' +
          'corrente, invece di crescere con continuità con il campo, forma <b>gradini ' +
          'piatti</b> in cui la resistenza trasversa vale esattamente h/(ie²), con i intero, ' +
          'mentre quella longitudinale si annulla. Il valore non dipende dal materiale, ' +
          'dalla forma del campione o dalle impurità, entro una parte su un miliardo. Oggi ' +
          'è il <b>campione di resistenza</b> elettrica, e il primo esempio di ' +
          'quantizzazione di origine topologica.' },

    { re: /fractionally charged|new form of quantum fluid/i,
      tit: 'Il fluido quantistico con eccitazioni a carica frazionaria',
      sp: 'In campioni bidimensionali ancora più puliti e in campi più intensi compaiono ' +
          'gradini della resistenza trasversa a valori <b>frazionari</b> — 1/3, 2/5, 2/3… ' +
          'del quanto e²/h di conduttanza. Gli elettroni presi uno per uno non bastano a ' +
          'spiegarlo: è un effetto dell\'interazione fra tutti gli elettroni, che si ' +
          'condensano in un nuovo <b>liquido quantistico</b> incomprimibile, descritto da ' +
          'una funzione d\'onda collettiva. Le sue eccitazioni si comportano come particelle ' +
          'con carica e/3: una frazione della carica elementare, emersa da elettroni ' +
          'interi.' },

    { re: /magnetoresistance/i,
      tit: 'La magnetoresistenza gigante',
      sp: 'In una pila di strati ferromagnetici alternati a strati metallici non magnetici ' +
          'spessi pochi nanometri, la resistenza elettrica dipende fortemente ' +
          'dall\'orientamento relativo delle magnetizzazioni: bassa se sono parallele, ' +
          'molto più alta se antiparallele. Il motivo è che la diffusione degli elettroni ' +
          'dipende dal loro <b>spin</b> rispetto alla magnetizzazione dello strato. Un ' +
          'piccolo campo che ruota uno strato cambia la resistenza di decine di punti ' +
          'percentuali. Le testine di lettura dei dischi rigidi basate su questo effetto ' +
          'hanno moltiplicato la densità dei dati: nasce la <b>spintronica</b>.' },

    { re: /graphene/i,
      tit: 'Il grafene',
      sp: 'Si credeva che un cristallo spesso un solo atomo non potesse essere stabile. ' +
          'Con del nastro adesivo staccato ripetutamente dalla grafite, e un substrato su ' +
          'cui un singolo strato diventa visibile al microscopio ottico, si isola il ' +
          '<b>grafene</b>: un foglio di atomi di carbonio a nido d\'ape. Gli elettroni vi si ' +
          'comportano come particelle relativistiche <b>senza massa</b>, con energia ' +
          'proporzionale all\'impulso, a una velocità di circa 1/300 di quella della ' +
          'luce. La quantizzazione della resistenza trasversa vi appare in forma anomala, ' +
          'persino a temperatura ambiente. È anche più resistente dell\'acciaio e ottimo ' +
          'conduttore.' },

    { re: /neutron (scattering|spectroscopy|diffraction)/i,
      tit: 'La diffusione dei neutroni nella materia condensata',
      sp: 'I neutroni termici prodotti nei reattori hanno lunghezza d\'onda simile alle ' +
          'distanze interatomiche ed energia simile a quella delle vibrazioni del ' +
          'reticolo: sono una sonda perfetta. Con la <b>diffrazione</b> rivelano dove sono ' +
          'gli atomi, anche quelli leggeri come l\'idrogeno che i raggi X vedono male, e, ' +
          'avendo un momento magnetico, la disposizione dei momenti magnetici. Con la ' +
          '<b>diffusione anelastica</b> misurano l\'energia ceduta o acquistata, quindi gli ' +
          'spettri di fononi e magnoni. Dove sono gli atomi e come si muovono: la base ' +
          'dello studio di solidi e liquidi.' },

    { re: /disorder and fluctuations|complex physical systems/i,
      tit: 'Disordine e fluttuazioni nei sistemi complessi',
      sp: 'In un vetro di spin, momenti magnetici disposti a caso interagiscono con segni ' +
          'casuali: nessuna configurazione soddisfa tutti i vincoli insieme. Per ' +
          'calcolarne le proprietà serve un artificio matematico — replicare il sistema ' +
          'molte volte — e la soluzione rivela una <b>rottura della simmetria fra le ' +
          'repliche</b>: un paesaggio di energia con moltissimi stati quasi equivalenti, ' +
          'organizzati in modo gerarchico. Le stesse idee si applicano a problemi di ' +
          'ottimizzazione, reti neurali, biologia, stormi di uccelli: un linguaggio per i ' +
          '<b>sistemi complessi</b>.' },

    { re: /artificial neural networks|machine learning/i,
      tit: 'Le reti neurali artificiali e l\'apprendimento automatico',
      sp: 'Una rete di nodi binari connessi in modo simmetrico può memorizzare ' +
          'configurazioni come minimi di una funzione energia, proprio come gli spin di ' +
          'un magnete: presentata un\'immagine incompleta, la rete scivola verso il minimo ' +
          'più vicino e la completa. È una <b>memoria associativa</b>. Aggiungendo rumore ' +
          'termico e i metodi della meccanica statistica si ottiene una rete che impara la ' +
          'distribuzione di probabilità dei dati e ne genera di nuovi. Da queste idee, ' +
          'radicate nella fisica dei sistemi disordinati, discende l\'<b>apprendimento ' +
          'automatico</b> che oggi riconosce immagini e analizza dati scientifici.' },

    /* ── Atmosfera, plasmi, stelle, cosmo ──────────────────────────────── */
    { re: /upper atmosphere|ionosphere/i,
      tit: 'La ionosfera',
      sp: 'Le onde radio arrivano oltre l\'orizzonte perché nell\'alta atmosfera c\'è uno ' +
          'strato <b>ionizzato</b> che le riflette. Confrontando l\'onda diretta con quella ' +
          'riflessa e variando la frequenza se ne misura l\'altezza, e si scopre che gli ' +
          'strati sono più di uno: uno più basso, intorno ai cento chilometri, e uno più ' +
          'alto e più ricco di elettroni, che riflette anche di notte. Gli strati sono ' +
          'prodotti dalla radiazione ultravioletta del Sole e cambiano con il giorno e con ' +
          'l\'attività solare. È la base della <b>propagazione radio</b> a lunga distanza e ' +
          'dello sviluppo del radar.' },

    { re: /magnetohydro.?dynamics|plasma physics/i,
      tit: 'La magnetoidrodinamica',
      sp: 'Un fluido conduttore — un plasma, un metallo fuso — che si muove in un campo ' +
          'magnetico vi genera correnti, e le correnti a loro volta agiscono sul fluido. ' +
          'In un conduttore perfetto le linee di campo restano <b>congelate</b> nel fluido e ' +
          'si muovono con esso. Ne nascono onde nuove, che corrono lungo le linee di campo ' +
          'come vibrazioni di una corda tesa, con velocità v = B/√(μ₀ρ). La ' +
          '<b>magnetoidrodinamica</b> descrive la corona e il vento solare, le magnetosfere ' +
          'dei pianeti, la dinamo che genera il campo terrestre e il confinamento dei ' +
          'plasmi per la fusione.' },

    /* prima dell'energia delle stelle: entrambe parlano di reazioni nucleari */
    { re: /formation of the chemical elements/i,
      tit: 'La nucleosintesi: come le stelle fabbricano gli elementi',
      sp: 'Idrogeno ed elio vengono dai primi minuti dell\'universo; quasi tutto il resto ' +
          'è stato fabbricato nelle stelle. Misure di laboratorio delle reazioni nucleari ' +
          'alle basse energie stellari, e calcoli delle condizioni nei nuclei delle ' +
          'stelle, ricostruiscono le catene: la fusione dell\'elio in carbonio attraverso ' +
          'uno stato risonante del carbonio-12, poi ossigeno, neon, fino al ferro; oltre ' +
          'il ferro, le <b>catture di neutroni</b>, lente nelle giganti rosse e rapide in ' +
          'eventi esplosivi. Le abbondanze cosmiche diventano una conseguenza della fisica ' +
          'nucleare: siamo fatti di <b>materia stellare</b>.' },

    { re: /energy production in stars|theory of nuclear reactions/i,
      tit: 'L\'energia delle stelle',
      sp: 'Il Sole brilla da miliardi di anni: nessuna reazione chimica e nessuna ' +
          'contrazione gravitazionale basterebbero. La fonte è la <b>fusione nucleare</b> di ' +
          'quattro protoni in un nucleo di elio, che libera circa 27 MeV, lo 0,7% della ' +
          'massa. Calcolando le probabilità delle reazioni alle temperature interne si ' +
          'individuano due vie: la catena protone-protone, dominante nel Sole, e un ' +
          '<b>ciclo catalitico</b> in cui carbonio, azoto e ossigeno vengono usati e ' +
          'restituiti, dominante nelle stelle più calde e massicce. La teoria spiega le ' +
          'luminosità osservate.' },

    { re: /structure and evolution of the stars/i,
      tit: 'La struttura e l\'evoluzione delle stelle',
      sp: 'Una stella è un equilibrio fra gravità e pressione. Quando il combustibile ' +
          'nucleare si esaurisce, il nucleo si contrae finché lo sostiene la pressione ' +
          'degli elettroni compressi — una pressione quantistica, figlia del principio di ' +
          'esclusione: è una <b>nana bianca</b>. Ma se gli elettroni diventano ' +
          'relativistici la pressione cresce meno della gravità, e oltre circa 1,4 masse ' +
          'solari nessuna nana bianca è stabile: è la <b>massa limite</b>. Le stelle più ' +
          'massicce collassano in stelle di neutroni o buchi neri. È una delle grandi ' +
          'applicazioni della fisica fondamentale al cielo.' },

    /* prima della radioastronomia: questa motivazione parla di una pulsar */
    { re: /new type of pulsar|study of gravitation/i,
      tit: 'La pulsar binaria e la radiazione gravitazionale',
      sp: 'Una pulsar — una stella di neutroni che ruota e manda un impulso radio a ogni ' +
          'giro, con la regolarità di un orologio atomico — in orbita stretta attorno a ' +
          'un\'altra stella di neutroni. Gli impulsi permettono di misurare l\'orbita con ' +
          'precisione straordinaria, e si osserva che il periodo orbitale <b>diminuisce</b> ' +
          'lentamente, di decine di microsecondi l\'anno: esattamente quanto previsto se ' +
          'il sistema perde energia emettendo <b>onde gravitazionali</b>. È la prima prova, ' +
          'indiretta ma quantitativa, della loro esistenza, e un laboratorio per la ' +
          'relatività generale in campo forte.' },

    { re: /radio astrophysics|aperture synthesis|pulsars/i,
      tit: 'La radioastronomia: sintesi di apertura e pulsar',
      sp: 'Un radiotelescopio vede sfocato: la risoluzione è circa λ/D, e le onde radio ' +
          'sono lunghe. La soluzione è combinare i segnali di più antenne distanti: ogni ' +
          'coppia misura una componente spaziale dell\'immagine del cielo, e la rotazione ' +
          'terrestre, cambiando l\'orientamento delle coppie, completa la raccolta. Si ' +
          'ricostruisce così l\'immagine di un telescopio grande quanto la distanza fra le ' +
          'antenne: è la <b>sintesi di apertura</b>. E si scoprono sorgenti che emettono ' +
          'impulsi radio con periodi regolarissimi: le <b>pulsar</b>, stelle di neutroni in ' +
          'rapida rotazione.' },

    { re: /cosmic x.?ray sources/i,
      tit: 'Le sorgenti cosmiche di raggi X',
      sp: 'L\'atmosfera assorbe i raggi X: per osservare il cielo in questa banda servono ' +
          'razzi e satelliti. Un primo volo trova una sorgente intensissima fuori dal ' +
          'sistema solare, e un fondo diffuso. Seguono satelliti con telescopi a ' +
          '<b>incidenza radente</b>, in cui i raggi X sono riflessi da specchi quasi ' +
          'paralleli al fascio. Si scopre un universo violento: <b>sistemi binari</b> in cui ' +
          'la materia cade su stelle di neutroni o buchi neri scaldandosi a milioni di ' +
          'gradi, gas caldissimo negli ammassi di galassie, nuclei galattici attivi. Nasce ' +
          'l\'astronomia a raggi X.' },

    /* prima della scoperta della radiazione di fondo */
    { re: /blackbody form and anisotropy|anisotropy of the cosmic microwave/i,
      tit: 'Lo spettro e le anisotropie della radiazione cosmica di fondo',
      sp: 'Un satellite misura lo spettro della radiazione di fondo e lo trova un ' +
          '<b>corpo nero</b> quasi perfetto a circa 2,73 K, con scarti inferiori a una ' +
          'parte su diecimila: l\'universo primordiale era un gas caldo all\'equilibrio. ' +
          'Un secondo strumento rivela minuscole differenze di temperatura fra direzioni ' +
          'diverse del cielo, circa una parte su centomila: le <b>anisotropie</b>, ' +
          'l\'impronta delle disomogeneità da cui sono cresciute galassie e ammassi. È ' +
          'l\'inizio della cosmologia di precisione: dalle anisotropie si misurano età, ' +
          'geometria e composizione dell\'universo.' },

    { re: /cosmic microwave background/i,
      tit: 'La radiazione cosmica di fondo',
      sp: 'Un\'antenna per le comunicazioni satellitari registra un rumore di fondo che ' +
          'non si riesce a eliminare: uguale in tutte le direzioni, costante nel giorno e ' +
          'nelle stagioni, corrispondente a una temperatura di circa 3 K. È la ' +
          '<b>radiazione cosmica di fondo</b> a microonde: la luce emessa quando ' +
          'l\'universo, raffreddandosi, divenne trasparente, qualche centinaio di migliaia ' +
          'di anni dopo l\'inizio, poi stirata dall\'espansione. Era prevista dai modelli ' +
          'di universo primordiale caldo, e la sua scoperta è la prova decisiva a favore ' +
          'del <b>Big Bang</b> contro l\'universo stazionario.' },

    { re: /physical cosmology|evolution of the universe/i,
      tit: 'La cosmologia fisica',
      sp: 'Per molto tempo la cosmologia era fatta di modelli con pochissimi dati. Il ' +
          'lavoro teorico che la trasforma in una scienza di precisione lega la radiazione ' +
          'di fondo — la sua temperatura e le sue piccolissime fluttuazioni — alla crescita ' +
          'delle strutture e alle quantità di materia ordinaria, materia oscura ed ' +
          'energia. Si capisce che servono una <b>materia oscura</b> fredda e una costante ' +
          'cosmologica, e si prevedono le oscillazioni acustiche del plasma primordiale. ' +
          'Ne esce il modello cosmologico standard, in cui la materia ordinaria è solo ' +
          'circa il <b>5%</b> dell\'universo.' },

    { re: /accelerating expansion|distant supernovae/i,
      tit: 'L\'espansione accelerata dell\'universo',
      sp: 'Una classe di supernovae — esplosioni di nane bianche che raggiungono la massa ' +
          'limite — ha una luminosità massima quasi uguale per tutte: sono <b>candele ' +
          'standard</b>. Confrontando la luminosità apparente con lo spostamento verso il ' +
          'rosso di supernovae lontane miliardi di anni luce, due gruppi indipendenti ' +
          'cercavano di misurare il rallentamento dell\'espansione. Le trovano invece più ' +
          'deboli del previsto: l\'espansione <b>accelera</b>. Una componente con pressione ' +
          'negativa, l\'energia oscura, costituisce circa il 70% dell\'energia ' +
          'dell\'universo, e la sua natura resta sconosciuta.' },

    { re: /exoplanet/i,
      tit: 'Un pianeta attorno a una stella simile al Sole',
      sp: 'Un pianeta è troppo debole per essere visto accanto alla sua stella, ma la fa ' +
          'oscillare: stella e pianeta orbitano attorno al baricentro comune. Misurando ' +
          'con uno spettrografo di altissima stabilità lo spostamento periodico delle ' +
          'righe della stella, di pochi metri al secondo, si trova un <b>pianeta gigante</b> ' +
          'con un\'orbita di soli quattro giorni, molto più vicino alla sua stella di ' +
          'qualsiasi pianeta del sistema solare. Nessuno se lo aspettava: le teorie di ' +
          'formazione dei sistemi planetari vanno riviste. Oggi gli <b>esopianeti</b> noti ' +
          'sono migliaia.' },

    { re: /black hole formation/i,
      tit: 'La formazione dei buchi neri',
      sp: 'Le soluzioni della relatività generale con un buco nero erano molto ' +
          'simmetriche, e molti pensavano che in un collasso reale, irregolare, la materia ' +
          'avrebbe evitato di concentrarsi in un punto. Con metodi matematici nuovi, ' +
          'topologici e globali, si dimostra il contrario: una volta formata una ' +
          '<b>superficie intrappolata</b>, da cui nemmeno la luce può allontanarsi, una ' +
          '<b>singolarità</b> è inevitabile, qualunque sia la simmetria. La formazione dei ' +
          'buchi neri è una previsione robusta della teoria, e la singolarità segna il ' +
          'punto in cui la teoria stessa smette di valere.' },

    { re: /supermassive compact object|cent(re|er) of our galaxy/i,
      tit: 'L\'oggetto supermassiccio al centro della Galassia',
      sp: 'Il centro della nostra galassia è nascosto dalla polvere nel visibile, ma si ' +
          'vede nell\'infrarosso. Due gruppi seguono per decenni, con l\'ottica adattiva e i ' +
          'telescopi più grandi, le <b>orbite delle stelle</b> più vicine al centro: alcune ' +
          'compiono un giro in pochi anni, su ellissi strettissime. Le orbite richiedono ' +
          'circa quattro milioni di masse solari concentrate in una regione più piccola ' +
          'del sistema solare: l\'unica spiegazione plausibile è un <b>buco nero ' +
          'supermassiccio</b>. Una di quelle stelle mostra anche lo spostamento ' +
          'gravitazionale della luce previsto dalla relatività.' },

    { re: /gravitational waves?|\bligo\b/i,
      tit: 'Le onde gravitazionali',
      sp: 'La relatività generale prevede che masse accelerate producano increspature ' +
          'dello spazio-tempo che viaggiano alla velocità della luce, ma minuscole: su un ' +
          'braccio di quattro chilometri, meno di un millesimo del diametro di un protone. ' +
          'Due interferometri giganteschi, con specchi sospesi, laser stabilizzatissimi e ' +
          'isolamento dalle vibrazioni, le rivelano: il segnale di due <b>buchi neri</b> di ' +
          'decine di masse solari che spiraleggiano e si fondono a più di un miliardo di ' +
          'anni luce. Si apre l\'<b>astronomia gravitazionale</b>: fusioni di buchi neri e ' +
          'di stelle di neutroni, osservate anche con la luce.' },

    { re: /earth.s climate|global warming|climate model/i,
      tit: 'La modellizzazione fisica del clima',
      sp: 'Il clima è un sistema complesso, caotico nei dettagli di giorno in giorno. I ' +
          'primi modelli fisici dell\'atmosfera, con radiazione, convezione e vapore ' +
          'acqueo, calcolano come la temperatura risponde all\'anidride carbonica: un ' +
          'raddoppio porta un riscaldamento di qualche grado. Un secondo passo collega il ' +
          'tempo meteorologico, rapido e caotico, alle variazioni lente del clima, ' +
          'trattando il primo come un <b>rumore</b>; e fornisce metodi per riconoscere nei ' +
          'dati l\'<b>impronta</b> dell\'influenza umana distinta dalla variabilità ' +
          'naturale. Il riscaldamento globale diventa una conclusione affidabile della ' +
          'fisica.' }
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

  globale.BSINobelSpiegazioniFisica = {
    ARGOMENTI: ARGOMENTI,
    perMotivazione: perMotivazione,
    quante: ARGOMENTI.length,
    versione: '1.0'
  };

})(typeof window !== 'undefined' ? window : globalThis);
