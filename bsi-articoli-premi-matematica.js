/* ═══════════════════════════════════════════════════════════════════════════
   bsi-articoli-premi-matematica — le spiegazioni dei grandi premi di matematica

   PERCHE' LA MATEMATICA HA UN FILE SUO

   Per la matematica non esiste un Nobel. I due riconoscimenti che ne fanno
   le veci sono il Premio Abel, assegnato ogni anno per l'insieme di una
   carriera, e la Medaglia Fields, assegnata ogni quattro anni al Congresso
   Internazionale dei Matematici a studiosi con meno di quarant'anni.

   PERCHE' QUESTO FILE CONTIENE SOLO SPIEGAZIONI E NESSUN DATO

   Qui dentro non c'e' un solo anno, non c'e' un solo nome di premiato, non
   c'e' una sola motivazione ufficiale. Anni, premiati, motivazioni e campi di
   ricerca arrivano da Wikidata (interrogazione SPARQL), in diretta, nel
   browser di chi legge. Se li avessi scritti io a memoria, nessuno avrebbe
   potuto distinguere un dato giusto da uno sbagliato: un errore di
   attribuzione non si vede, sta li' e sembra un dato.

   E le spiegazioni non sono legate a un ANNO ne' a una PERSONA: sono legate a
   un ARGOMENTO. Il testo con cui si confrontano le espressioni regolari e'
   la motivazione del premio, quando Wikidata ce l'ha (in inglese, spesso
   assente), PIU' le etichette inglesi dei «campi di lavoro» del premiato
   («algebraic geometry», «number theory», «Ricci flow»...), unite da « | ».
   Se quel testo parla di «perfectoid spaces», compare la spiegazione degli
   spazi perfettoidi — a chiunque e in qualunque anno sia andato il premio.

   Se nessun argomento combacia, non si inventa niente: si mostrano i dati
   di Wikidata e si dice che la spiegazione non c'e'.

   LA REGOLA CHE OGNI VOCE DEVE RISPETTARE

   Niente nomi di persona nel titolo e nel testo, nemmeno dentro un nome di
   teorema o di oggetto (gli eponimi): si descrive l'oggetto invece di
   nominarlo. Le espressioni regolari invece possono contenerli, perche'
   devono riconoscere le etichette inglesi («Langlands program», «Fourier
   analysis»). Niente anni. `tools/banchi/test_articoli.js` lo verifica.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';

  /* Ogni voce:
       re   espressione regolare confrontata con la motivazione e con i campi
            di lavoro (in inglese: le etichette di Wikidata sono in inglese)
       tit  il titolo dell'argomento, in italiano
       sp   la spiegazione
     L'ordine conta: vince la PRIMA che combacia, quindi le voci specifiche
     stanno prima di quelle generiche, e le voci di ripiego per i grandi
     campi («topology», «geometry»...) stanno tutte in fondo. */
  var ARGOMENTI = [

    /* ── Teoria dei numeri e geometria aritmetica ───────────────────────── */
    { re: /fermat|modularity|taniyama|semistable elliptic/i,
      tit: 'L\'ultimo teorema sulle potenze e la modularità',
      sp: 'L\'enunciato si scrive in una riga: per n > 2 l\'equazione <b>aⁿ + bⁿ = cⁿ</b> non ha soluzioni in interi positivi. La dimostrazione passa per una strada lontanissima. A un\'ipotetica soluzione si associa la curva ellittica y² = x(x − aⁿ)(x + bⁿ), così strana da non poter essere <b>modulare</b>, cioè da non poter provenire da una forma modulare. Dimostrare che ogni curva ellittica semistabile sui razionali è modulare chiude la questione. Il metodo — confrontare le deformazioni delle rappresentazioni del gruppo delle simmetrie dei numeri algebrici con algebre di operatori che agiscono sulle forme modulari — è diventato uno degli strumenti centrali della teoria dei numeri.' },

    { re: /sphere packing|packing problem|kissing number|e8 lattice|leech lattice/i,
      tit: 'L\'impacchettamento di sfere',
      sp: 'Quanto spazio possono occupare sfere uguali che non si sovrappongono? In dimensione 3 la risposta è la disposizione a piramide dei fruttivendoli, con densità π/√18 ≈ 0,74; in dimensioni alte le configurazioni ottimali sono quasi tutte ignote. In dimensione 8 e 24 esistono reticoli eccezionali, di simmetria straordinaria, e la loro <b>ottimalità</b> si dimostra costruendo con le forme modulari una funzione «magica»: la sua trasformata in frequenze ha segni controllati e si annulla esattamente sulle distanze del reticolo. Questa funzione dà un <b>limite superiore</b> alla densità che coincide con quella del reticolo. Il problema tocca i codici correttori e la trasmissione dei segnali.' },

    { re: /moonshine|vertex (operator )?algebras?|monster group|monstrous/i,
      tit: 'Il «chiaro di luna mostruoso» e le algebre di vertice',
      sp: 'Il <b>Mostro</b> è il più grande dei gruppi semplici finiti sporadici: circa 8·10⁵³ elementi. La sua più piccola rappresentazione non banale ha dimensione 196 883, e il primo coefficiente non banale della funzione modulare j è 196 884 = 196 883 + 1. Non è una coincidenza: tutti i coefficienti di j si scompongono in dimensioni di rappresentazioni del Mostro. La spiegazione richiede le <b>algebre di vertice</b>, strutture algebriche che formalizzano la teoria dei campi conformi bidimensionali: si costruisce un\'algebra di vertice il cui gruppo di simmetria è il Mostro e la cui funzione di partizione è j. È un ponte inatteso tra gruppi finiti, forme modulari e teoria delle stringhe.' },

    { re: /langlands|fundamental lemma|automorphic|functoriality|trace formula/i,
      tit: 'Il programma di unificazione tra aritmetica e analisi armonica',
      sp: 'È una rete di congetture che collega due mondi. Da una parte le <b>rappresentazioni del gruppo delle simmetrie dei numeri algebrici</b>, che codificano come si fattorizzano i polinomi modulo i primi; dall\'altra le <b>forme automorfe</b>, funzioni molto simmetriche su gruppi di matrici, studiate con l\'analisi armonica. La congettura dice che i due mondi si corrispondono e hanno le stesse funzioni L. Ne esistono una versione aritmetica, una sui campi di funzioni e una geometrica, dove i numeri sono sostituiti da curve e le funzioni da fasci. La formula delle tracce e il «lemma fondamentale», un\'identità tra integrali orbitali, sono tra gli strumenti per dimostrarne casi sempre più ampi.' },

    { re: /perfectoid|prismatic|p-adic (geometry|hodge|analytic|cohomology)|rigid analytic|condensed mathematics/i,
      tit: 'Spazi perfettoidi e geometria p-adica',
      sp: 'Nei numeri p-adici due interi sono vicini se la loro differenza è divisibile per una potenza alta del primo p. Esistono due mondi aritmetici paralleli: la caratteristica zero, dove vivono i p-adici, e la caratteristica p, le serie formali su un campo finito, dove (a + b)ᵖ = aᵖ + bᵖ e molte cose sono più facili. Gli <b>spazi perfettoidi</b> sono oggetti geometrici così «estratti alla radice p-esima infinite volte» che i due mondi diventano equivalenti: si trasporta un problema in caratteristica p, lo si risolve e lo si riporta indietro. Ne sono venuti risultati sulla coomologia p-adica, nuovi casi del programma che collega aritmetica e forme automorfe e una nuova fondazione della <b>geometria analitica</b>.' },

    { re: /weil conjectures|[ée]tale cohomology|l-adic cohomology|zeta functions? of (algebraic )?varieties/i,
      tit: 'Le congetture sulle funzioni zeta delle varietà su campi finiti',
      sp: 'Contare le soluzioni di un sistema di equazioni polinomiali in un campo finito con q elementi, poi con q², q³…, dà una successione di numeri Nₙ. Le congetture affermano che questi conteggi sono governati dalla <b>topologia</b> della varietà complessa definita dalle stesse equazioni: la funzione zeta Z(t) = exp(∑ Nₙ tⁿ/n) è razionale, soddisfa un\'equazione funzionale, e i suoi zeri e poli hanno valori assoluti q^(−i/2), analogo esatto dell\'ipotesi sugli zeri della funzione zeta classica. La dimostrazione richiese una teoria nuova, la <b>coomologia étale</b>, che dà senso ai «buchi» di una varietà su un campo finito. Le stime che ne seguono servono in teoria dei numeri, nei codici e in crittografia.' },

    { re: /primes in arithmetic progressions?|arithmetic progressions? (of|in the) primes|green.?tao/i,
      tit: 'Progressioni aritmetiche di numeri primi',
      sp: 'I numeri primi contengono progressioni aritmetiche arbitrariamente lunghe: per ogni k esistono a e d con a, a + d, a + 2d, …, a + (k−1)d tutti primi (per esempio 5, 11, 17, 23, 29). La difficoltà è che i primi sono <b>rarefatti</b>, con densità circa 1/log N, mentre il teorema classico sulle progressioni vale per insiemi di densità positiva. Si aggira con un <b>principio di trasferimento</b>: i primi stanno dentro un insieme «pseudocasuale» più grande rispetto al quale hanno densità positiva, e il teorema di densità si estende a quel contesto. È un esempio celebre di alleanza tra combinatoria additiva, analisi armonica e teoria analitica dei numeri.' },

    { re: /szemer[eé]di|additive combinatorics|arithmetic combinatorics|regularity lemma|cap set|sum.?product|ergodic ramsey|higher.?order fourier|gowers norms?/i,
      tit: 'Combinatoria additiva e progressioni negli insiemi densi',
      sp: 'Ogni insieme di interi con <b>densità positiva</b> contiene progressioni aritmetiche di qualunque lunghezza. L\'enunciato è elementare, le dimostrazioni no: ce ne sono di combinatorie, con un «lemma di regolarità» che decompone ogni grafo grande in pezzi quasi casuali; ergodiche, che traducono il problema nella ricorrenza di sistemi dinamici; e analitiche, con un\'<b>analisi in frequenze di ordine superiore</b> che misura quanto un insieme è strutturato o pseudocasuale. La dicotomia tra struttura e casualità è il cuore della combinatoria additiva, che studia anche gli insiemi A con A + A piccolo e il fenomeno somma-prodotto: A + A e A·A non possono essere entrambi piccoli.' },

    { re: /additive number theory|waring|circle method|goldbach|sums of primes/i,
      tit: 'Teoria additiva dei numeri',
      sp: 'La teoria additiva chiede quali interi si scrivono come <b>somme</b> di elementi di un insieme speciale: quadrati, cubi, potenze k-esime, primi. Ogni intero positivo è somma di quattro quadrati; per ogni k esiste un numero di potenze k-esime che basta per tutti gli interi (9 cubi, 19 quarte potenze). Il <b>metodo del cerchio</b> scrive il numero di rappresentazioni come integrale su [0, 1] di una somma esponenziale ∑ e^{2πiαnᵏ}, e separa gli archi «maggiori», vicini a frazioni con denominatore piccolo, che danno il termine principale, da quelli «minori», da stimare. Così si dimostra che ogni dispari maggiore di 5 è somma di tre primi; per i pari e due primi il problema è aperto.' },

    { re: /analytic number theory|prime numbers?|\bprimes\b|distribution of primes|bounded gaps|zeta function|riemann hypothesis|sieve|twin primes?|l-functions?/i,
      tit: 'Teoria analitica dei numeri e distribuzione dei primi',
      sp: 'Il numero di primi minori di x è circa x / log x, e la precisione di questa stima dipende dagli zeri della <b>funzione zeta</b> ζ(s) = ∑ n⁻ˢ = ∏ₚ (1 − p⁻ˢ)⁻¹: la congettura che tutti gli zeri non banali stiano sulla retta Re s = 1/2 è uno dei grandi problemi aperti. Gli strumenti sono analitici — integrali complessi, somme esponenziali, il <b>metodo dei crivelli</b> — applicati a domande aritmetiche: quanti primi ci sono in una progressione, quanto possono essere lontani due primi consecutivi, se ci sono infinite coppie di primi a distanza limitata. A quest\'ultima domanda si sa ora rispondere di sì: esiste una distanza finita che si ripete infinite volte.' },

    { re: /complex multiplication|abelian variet|shimura variet|jacobians?/i,
      tit: 'Varietà algebriche che sono gruppi e moltiplicazione complessa',
      sp: 'Una varietà proiettiva che è anche un gruppo è necessariamente <b>commutativa</b>: sui complessi è un toro ℂᵍ/Λ che ammette abbastanza funzioni meromorfe. Le curve ellittiche sono il caso g = 1; ogni curva di genere g ha una varietà di questo tipo associata, che ne raccoglie gli integrali. Quando l\'anello degli endomorfismi è più grande del solito, la varietà ha <b>moltiplicazione complessa</b>, e i suoi punti di torsione generano esplicitamente le estensioni commutative di certi campi di numeri. Gli spazi di moduli di queste varietà sono a loro volta varietà aritmetiche, centrali nel programma che collega forme automorfe e aritmetica.' },

    { re: /elliptic curves?|birch|swinnerton|rank of elliptic|selmer|heegner/i,
      tit: 'Curve ellittiche e la congettura sul rango',
      sp: 'Una curva ellittica è l\'insieme delle soluzioni di y² = x³ + ax + b. I suoi punti razionali formano un <b>gruppo commutativo</b> — si «sommano» tracciando rette — finitamente generato, isomorfo a ℤʳ per una parte finita. Il numero r, il <b>rango</b>, è misterioso: non si conosce un algoritmo che lo calcoli sempre. La congettura principale afferma che r è uguale all\'ordine di annullamento in s = 1 della funzione L della curva, costruita contando i punti modulo ogni primo. È dimostrata nei casi di rango analitico 0 e 1; sono noti anche risultati sul rango medio, che è limitato, e sui gruppi che misurano il fallimento del principio locale-globale.' },

    { re: /diophantine approximation|continued fractions?|metric number theory|littlewood conjecture|badly approximable/i,
      tit: 'Approssimare i numeri reali con frazioni',
      sp: 'Ogni numero irrazionale α ha infinite frazioni p/q con |α − p/q| < 1/q², e le migliori si leggono dalla sua <b>frazione continua</b>. Si può fare meglio? Per quasi ogni α no, e per i numeri algebrici irrazionali vale |α − p/q| > q^{−2−ε} tranne che per un numero finito di frazioni. La teoria metrica conta con la misura: per ψ decrescente, l\'insieme degli α approssimabili con precisione ψ(q)/q infinite volte ha misura piena o nulla secondo che ∑ ψ(q) diverga o converga. I problemi di approssimazione <b>simultanea</b> di più numeri si traducono in dinamica sullo spazio dei reticoli; una congettura sul prodotto delle distanze dagli interi resta aperta.' },

    { re: /transcenden|irrationality|algebraic independence|linear forms in logarithms/i,
      tit: 'Numeri trascendenti',
      sp: 'Un numero è <b>algebrico</b> se è radice di un polinomio a coefficienti interi, altrimenti è trascendente. Quasi tutti i reali sono trascendenti, perché gli algebrici sono numerabili, ma dimostrarlo per un numero specifico è difficilissimo: e e π lo sono, e la trascendenza di π chiude il problema antico della quadratura del cerchio con riga e compasso. Se a e b sono algebrici, a diverso da 0 e 1 e b irrazionale, aᵇ è trascendente. Le stime dal basso per le <b>forme lineari nei logaritmi</b> di numeri algebrici danno limiti espliciti alla grandezza delle soluzioni di molte equazioni in interi. Non si sa ancora se e + π sia irrazionale.' },

    { re: /diophantine|rational points|mordell|faltings|integer solutions|arakelov/i,
      tit: 'Equazioni polinomiali in numeri interi e razionali',
      sp: 'Trovare le soluzioni intere o razionali di un\'equazione polinomiale è il problema più antico dell\'aritmetica. La teoria moderna lo lega alla <b>geometria</b> della curva o della varietà definita dall\'equazione: una curva di genere g ≥ 2, una superficie con almeno due «manici», ha solo un numero <b>finito</b> di punti razionali, mentre in genere 0 e 1 i punti possono essere infiniti. Gli strumenti sono le altezze, che misurano la complessità aritmetica di un punto, la geometria dei fibrati su modelli interi e le stime di approssimazione, che permettono di limitare la grandezza delle soluzioni. Per varietà di dimensione alta, la distribuzione dei punti razionali è prevista da congetture ancora aperte.' },

    { re: /real algebraic|semi.?algebraic|sixteenth problem|positivstellensatz|sums of squares of polynomials/i,
      tit: 'Geometria algebrica reale',
      sp: 'Sui reali le equazioni polinomiali si comportano diversamente: si hanno anche le disuguaglianze, e gli insiemi definiti da equazioni e disuguaglianze polinomiali, i <b>semialgebrici</b>, sono chiusi per proiezione: eliminare una variabile quantificata da un sistema reale dà ancora un sistema reale. Un polinomio non negativo su ℝⁿ non è sempre somma di quadrati di polinomi, ma è sempre somma di quadrati di <b>funzioni razionali</b>. Un problema classico chiede quante componenti connesse può avere una curva piana reale di grado d — al più (d−1)(d−2)/2 + 1 — e come possono disporsi gli ovali l\'uno dentro l\'altro. Queste idee sono alla base dell\'ottimizzazione polinomiale.' },

    { re: /quadratic forms?|geometry of numbers|sums of squares|integral lattices?/i,
      tit: 'Forme quadratiche e geometria dei numeri',
      sp: 'Quali interi si scrivono come x² + y²? Esattamente quelli in cui ogni primo ≡ 3 (mod 4) compare con esponente pari. Lo studio delle <b>forme quadratiche</b> intere, Q(x) = ∑ aᵢⱼxᵢxⱼ, chiede quali numeri rappresentano e in quanti modi. Il principio locale-globale dice che una forma razionale rappresenta zero se e solo se lo fa sui reali e sui p-adici per ogni primo p. Per le forme intere definite positive basta controllare un numero finito di valori (fino a 15 o a 290, secondo la nozione di integralità) per sapere se una forma rappresenta tutti gli interi positivi. La <b>geometria dei numeri</b> usa i corpi convessi: un convesso simmetrico di volume > 2ⁿ contiene un punto intero non nullo.' },

    { re: /class field theory|algebraic number theory|iwasawa|cyclotomic|number fields?|reciprocity laws?/i,
      tit: 'Teoria algebrica dei numeri e leggi di reciprocità',
      sp: 'Negli interi ogni numero si fattorizza in modo unico in primi; nei <b>campi di numeri</b>, come ℚ(√−5), no: 6 = 2·3 = (1 + √−5)(1 − √−5). Il difetto è misurato dal <b>gruppo delle classi</b>, che è finito. La teoria dei campi di classi descrive tutte le estensioni con gruppo di simmetrie commutativo tramite dati interni al campo di partenza, e generalizza la legge di reciprocità quadratica, che lega quando p è un quadrato modulo q a quando q lo è modulo p. La teoria delle torri di estensioni ottenute aggiungendo radici dell\'unità di ordine pⁿ lega la crescita dei gruppi delle classi ai valori speciali delle funzioni L p-adiche.' },

    { re: /modular forms?|theta functions?|mock modular|hecke|modular curves?/i,
      tit: 'Le forme modulari',
      sp: 'Una forma modulare è una funzione olomorfa f sul semipiano superiore che, sotto le trasformazioni z ↦ (az + b)/(cz + d) con a, b, c, d interi e ad − bc = 1, si trasforma come f(z) ↦ (cz + d)ᵏ f(z). Una simmetria così rigida rende lo spazio di queste funzioni di <b>dimensione finita</b>, e da qui escono identità aritmetiche sorprendenti: i coefficienti dello sviluppo in q = e^{2πiz} contano le rappresentazioni di un intero come somma di quadrati, le partizioni, i punti di una curva ellittica modulo p. Le forme modulari sono il prototipo delle <b>forme automorfe</b> e compaiono ovunque, dalla teoria delle stringhe all\'impacchettamento di sfere.' },

    /* ── Geometria algebrica ────────────────────────────────────────────── */
    { re: /combinatorial hodge|log.?concav|matroids?/i,
      tit: 'Strutture geometriche nascoste nella combinatoria',
      sp: 'Molte successioni combinatorie sono <b>log-concave</b>: aₖ² ≥ aₖ₋₁aₖ₊₁, come i coefficienti binomiali. Per i coefficienti del polinomio cromatico di un grafo, o per il numero di insiemi indipendenti di ogni taglia in un <b>matroide</b> — l\'astrazione della nozione di indipendenza lineare — la proprietà era congetturata da tempo. La dimostrazione costruisce per ogni matroide un anello che si comporta come la coomologia di una varietà proiettiva liscia, anche quando nessuna varietà esiste, e ne verifica le proprietà profonde: dualità, un teorema di tipo «sezione iperpiana» e relazioni di segno. La log-concavità segue come la disuguaglianza quadratica che quelle strutture impongono.' },

    { re: /tropical (geometry|algebra|varieties|curves)/i,
      tit: 'Geometria tropicale',
      sp: 'Nella geometria tropicale si sostituiscono somma e prodotto con minimo e somma: a ⊕ b = min(a, b), a ⊙ b = a + b. Un polinomio diventa una funzione lineare a tratti, e la sua «varietà» è il luogo dove il minimo è raggiunto almeno due volte: un complesso di segmenti e facce piatte. Le varietà tropicali sono le <b>ombre</b> delle varietà algebriche viste attraverso un valore assoluto che misura solo gli ordini di grandezza. Molti problemi difficili di geometria enumerativa diventano conteggi combinatori di grafi metrici pesati, con la stessa risposta: è un metodo di <b>degenerazione</b> che trasforma la geometria in combinatoria.' },

    { re: /\btoric\b/i,
      tit: 'Varietà toriche',
      sp: 'Una varietà torica contiene come aperto denso un toro algebrico (ℂ*)ⁿ, la cui azione per moltiplicazione si estende a tutta la varietà. Tutta la geometria è codificata da un oggetto <b>combinatorio</b>: un ventaglio di coni poliedrali o, nel caso proiettivo, un politopo a vertici interi. Liscezza, compattezza, coomologia, fibrati in rette e loro sezioni si leggono dai coni: le sezioni globali di un fibrato corrispondono ai punti interi del politopo. È un laboratorio dove i teoremi generali si verificano a mano, e un ponte nei due sensi: dalla geometria si dimostrano disuguaglianze tra i numeri di facce dei <b>politopi</b>, dai politopi si costruiscono esempi di simmetria speculare.' },

    { re: /mirror symmetry/i,
      tit: 'La simmetria speculare',
      sp: 'Dalla teoria delle stringhe è emersa una previsione strana: le varietà complesse di dimensione 3 con fibrato canonico banale, usate per compattificare le dimensioni extra, vengono a <b>coppie</b> X e X̌ tali che la geometria complessa dell\'una corrisponde alla geometria simplettica dell\'altra. Il numero di curve razionali di ogni grado su un\'ipersuperficie quintica — un problema enumerativo difficilissimo — si calcola con integrali di periodo sul partner, molto più semplici. La versione <b>omologica</b> formula la corrispondenza come equivalenza tra la categoria derivata dei fasci coerenti di una varietà e una categoria costruita dalle sottovarietà di dimensione metà su cui la forma simplettica dell\'altra si annulla.' },

    { re: /enumerative geometry|gromov.?witten|donaldson.?thomas|intersection theory|counting curves|quantum cohomology/i,
      tit: 'Geometria enumerativa: contare curve',
      sp: 'Quante rette incontrano quattro rette generiche nello spazio? Due. Quante coniche sono tangenti a cinque coniche date? 3264. La geometria enumerativa risponde con la <b>teoria dell\'intersezione</b>, che rende rigoroso il conteggio con molteplicità. I problemi moderni contano curve di genere e grado fissati in una varietà: si costruiscono spazi di moduli di mappe da una curva alla varietà, li si dota di una «classe fondamentale virtuale» e vi si integrano classi di coomologia. I numeri ottenuti, gli <b>invarianti</b>, non cambiano per deformazione; sono organizzati in funzioni generatrici con proprietà modulari e collegati tra loro da corrispondenze suggerite dalla fisica.' },

    { re: /hodge|period (maps?|domains?)/i,
      tit: 'La decomposizione della coomologia in tipi e la congettura sui cicli',
      sp: 'Su una varietà proiettiva complessa liscia ogni classe di coomologia di grado k si decompone in pezzi di <b>tipo (p, q)</b>, con p + q = k, a seconda di quante coordinate olomorfe e antiolomorfe usa una forma differenziale che la rappresenta: Hᵏ = ⊕ H^{p,q}, e H^{q,p} è il coniugato di H^{p,q}. Questa struttura varia in modo controllato quando la varietà si deforma — variazioni e mappe dei periodi — e ne registra la geometria fine. La grande <b>congettura</b> aperta chiede che ogni classe razionale di tipo (p, p) sia combinazione di classi di sottovarietà algebriche: cioè che la topologia «riconosca» quali cicli provengono dall\'algebra.' },

    { re: /scheme theory|theory of schemes|\bschemes\b|topos|topoi|\bmotives\b|motivic|grothendieck/i,
      tit: 'Gli schemi e le fondamenta della geometria algebrica',
      sp: 'La geometria algebrica classica studiava i luoghi di zeri di polinomi sui complessi. La teoria degli <b>schemi</b> assegna uno spazio geometrico a <b>ogni</b> anello commutativo: i punti sono gli ideali primi, le funzioni sono gli elementi dell\'anello. Così ℤ diventa una «curva» i cui punti sono i numeri primi, geometria e aritmetica parlano la stessa lingua, e gli elementi nilpotenti tengono traccia di informazioni infinitesimali. Su questa base si costruiscono la coomologia dei fasci, i topoi — generalizzazioni degli spazi topologici fatte di fasci — e i motivi, l\'ipotetica teoria coomologica universale da cui tutte le altre si dedurrebbero.' },

    { re: /billiards?|translation surfaces?|flat surfaces?|interval exchange|abelian differentials?|teichm[uü]ller (dynamics|geodesic flow)|moduli spaces? of riemann surfaces/i,
      tit: 'Superfici piatte, biliardi e dinamica sugli spazi di moduli',
      sp: 'Una pallina su un biliardo poligonale con angoli razionali si studia «srotolando» il tavolo: riflettendolo lungo i lati si ottiene una <b>superficie piatta</b> con punti conici, sulla quale la traiettoria diventa una retta. Le superfici piatte di genere fissato formano uno spazio di moduli su cui agisce il gruppo delle matrici 2×2 reali a determinante 1, deformandone la struttura. Capire le <b>chiusure delle orbite</b> di questa azione — che risultano essere sottovarietà algebriche — dà informazioni su ogni singolo biliardo: quante traiettorie periodiche di lunghezza ≤ L ci sono (crescono come c·L²) e quando il moto è equidistribuito sul tavolo.' },

    { re: /moduli spaces?|moduli of|algebraic stacks?|geometric invariant theory|deformation theory/i,
      tit: 'Gli spazi di moduli',
      sp: 'Uno spazio di moduli è uno spazio i cui <b>punti</b> rappresentano oggetti geometrici a meno di isomorfismo: tutte le curve di genere g, tutti i fibrati vettoriali stabili su una curva, tutte le superfici di un certo tipo. La difficoltà è che gli oggetti con molte simmetrie creano singolarità, e certe famiglie non si possono chiudere: servono la teoria degli invarianti per costruire i quozienti, le <b>compattificazioni</b> ottenute aggiungendo oggetti degeneri, e gli «stack», spazi che ricordano gli automorfismi. Lo spazio delle curve di genere g ≥ 2 ha dimensione 3g − 3; la sua geometria — è razionale? qual è la sua coomologia? — è tuttora oggetto di ricerca.' },

    { re: /birational|minimal model|\bflips?\b|classification of (algebraic )?varieties|fano varieties|canonical (rings?|bundles?)|general type/i,
      tit: 'Geometria birazionale e il programma dei modelli minimi',
      sp: 'Due varietà sono <b>birazionali</b> se coincidono fuori da sottoinsiemi più piccoli: scoppiare un punto, cioè sostituirlo con lo spazio delle direzioni, non cambia la classe birazionale. Il programma dei <b>modelli minimi</b> cerca in ogni classe un rappresentante «più semplice», contraendo una dopo l\'altra le curve su cui il fibrato canonico è negativo. Per le superfici bastano le contrazioni; in dimensione ≥ 3 nascono singolarità e serve un\'operazione nuova, il «flip». Il risultato è una tricotomia che rispecchia curvatura positiva, nulla e negativa: varietà fibrate in pezzi di tipo positivo, varietà con fibrato canonico banale e varietà di tipo generale, il cui anello canonico è finitamente generato.' },

    { re: /resolution of singularities|singularity theory|singularities of (algebraic|maps|varieties)|catastrophe theory/i,
      tit: 'Risoluzione delle singolarità',
      sp: 'Una curva come y² = x³ ha una cuspide nell\'origine; una varietà può avere singolarità molto più complicate. Risolverle significa trovare una varietà <b>liscia</b> e una mappa propria verso l\'originale che sia un isomorfismo fuori dalle singolarità. In caratteristica zero si ottiene in ogni dimensione con una successione di scoppiamenti guidati da un invariante che decresce a ogni passo; in caratteristica p il problema è aperto in dimensione alta. La teoria delle singolarità delle funzioni lisce studia invece i punti critici e le loro forme normali, classificando i modi <b>stabili</b> in cui una famiglia di funzioni può degenerare: le cosiddette catastrofi.' },

    { re: /invariant theory|invariants of (groups|binary forms)|classical invariants/i,
      tit: 'Teoria degli invarianti',
      sp: 'Quando un gruppo agisce sullo spazio dei polinomi, i polinomi <b>invarianti</b> formano un anello: per il gruppo delle permutazioni delle variabili è generato dai polinomi simmetrici elementari. Il teorema di finitezza afferma che per i gruppi riduttivi l\'anello degli invarianti è <b>finitamente generato</b>; la prova, non costruttiva, fu all\'origine dell\'algebra commutativa moderna, e per gruppi non riduttivi la finitezza può fallire. Gli invarianti permettono di costruire quozienti algebrici, base degli spazi di moduli; l\'insieme dove tutti si annullano, il cono nullo, ne controlla la geometria. Decidere se la chiusura di un\'orbita contiene lo zero collega la teoria alla complessità computazionale.' },

    /* ── Topologia ──────────────────────────────────────────────────────── */
    { re: /poincar[eé] conjecture|ricci flow|geometri[sz]ation/i,
      tit: 'La congettura sulla sfera tridimensionale e il flusso della curvatura',
      sp: 'Una varietà tridimensionale compatta senza bordo in cui ogni anello si può contrarre a un punto è <b>omeomorfa alla sfera</b> S³? La risposta è sì, e viene dalla geometria: si fa evolvere la metrica con l\'equazione ∂g/∂t = −2 K(g), dove K(g) è il tensore che media la curvatura sulle direzioni: un <b>flusso</b> che si comporta come l\'equazione del calore e uniforma la curvatura. Il flusso sviluppa singolarità, colli che si strozzano: bisogna classificarle, tagliarle chirurgicamente e ripartire, controllando che il processo termini. Ne segue la congettura di geometrizzazione: ogni 3-varietà si decompone in pezzi, ciascuno dotato di una delle otto geometrie modello, la più ricca delle quali è quella iperbolica.' },

    { re: /mean curvature flow|geometric flows?|harmonic maps?|curve shortening|yamabe/i,
      tit: 'Flussi geometrici e mappe armoniche',
      sp: 'Un flusso geometrico deforma un oggetto nella direzione che riduce più rapidamente un\'energia. Nel flusso per curvatura media ogni punto di una superficie si muove con velocità pari alla curvatura media, ∂ₜx = H·ν: le superfici convesse si arrotondano e si contraggono a un punto, ma in generale si formano <b>singolarità</b> — colli, cilindri — che vanno classificate; i modelli delle singolarità generiche sono sfere e cilindri. Le <b>mappe armoniche</b>, punti critici dell\'energia ∫|∇u|², sono l\'analogo per le applicazioni tra varietà; il flusso del calore associato può concentrare energia in bolle sferiche. Sono strumenti centrali per la topologia e la geometria.' },

    { re: /knot|link (invariants?|homology)|jones polynomial|khovanov|braid groups?|skein/i,
      tit: 'Teoria dei nodi e invarianti quantistici',
      sp: 'Un nodo è una curva chiusa nello spazio, considerata a meno di deformazioni che non la taglino. Per distinguere due nodi servono <b>invarianti</b>, quantità che non cambiano con le deformazioni. Un polinomio che si calcola con regole locali sugli incroci del diagramma, le «relazioni a matassa», scoperto studiando algebre di operatori, ha rivelato che i nodi sono legati alla <b>meccanica statistica</b> e alla teoria quantistica dei campi: è il valore atteso di un anello di campo in una teoria di gauge topologica tridimensionale. Le sue categorificazioni, teorie di omologia la cui somma alternata dei ranghi ridà il polinomio, distinguono più nodi e riconoscono il nodo banale.' },

    { re: /4-manifolds?|four-manifolds?|four-dimensional (manifolds|topology)|gauge theor|yang.?mills|instantons?|seiberg.?witten|donaldson/i,
      tit: 'Varietà di dimensione quattro e teorie di gauge',
      sp: 'La dimensione 4 è anomala: è l\'unica in cui lo spazio piatto ℝ⁴ ammette <b>infinite strutture differenziabili</b> non equivalenti. Lo si scopre usando la fisica: le equazioni delle teorie di gauge — l\'autodualità F = ∗F per una connessione su un fibrato — hanno spazi di soluzioni, gli <b>istantoni</b>, la cui geometria è un invariante della struttura liscia e non solo della topologia. Ne segue che molte forme di intersezione realizzabili topologicamente non lo sono in modo liscio. Equazioni successive, più semplici e con un campo spinoriale, hanno reso gli invarianti molto più calcolabili e dimostrato vecchie congetture sul genere minimo delle superfici immerse.' },

    { re: /3-manifolds?|three-manifolds?|three-dimensional manifolds|low-dimensional topology|geometric topology|hyperbolic (3-)?manifolds?|hyperbolic geometry|virtual(ly)? haken|virtual fibering|mapping class groups?/i,
      tit: 'Topologia geometrica e varietà tridimensionali',
      sp: 'In dimensione 2 ogni superficie ammette una geometria a curvatura costante; in dimensione 3 il ruolo dominante lo ha la <b>geometria iperbolica</b>, a curvatura −1. Per una 3-varietà iperbolica di volume finito la geometria è determinata dalla topologia (rigidità), e il volume diventa un invariante topologico. Le grandi congetture sono state risolte una dopo l\'altra: ogni 3-varietà iperbolica chiusa ha un rivestimento finito che contiene una superficie incompressibile e uno che <b>fibra sulla circonferenza</b>, e il suo gruppo fondamentale è residualmente finito. Strumenti: superfici immerse, complessi cubici a curvatura non positiva, gruppi di trasformazioni delle superfici.' },

    { re: /exotic spheres?|differential topology|surgery theory|h-cobordism|smooth structures?|immersions?|sphere eversion/i,
      tit: 'Topologia differenziale e sfere esotiche',
      sp: 'Esistono varietà <b>omeomorfe</b> alla sfera S⁷ ma non <b>diffeomorfe</b>: si deformano con continuità l\'una nell\'altra, ma non in modo liscio. Le strutture lisce orientate su S⁷ sono 28, e formano un gruppo. La teoria della chirurgia — togliere un pezzo Sᵏ × Dⁿ⁻ᵏ e incollare al suo posto Dᵏ⁺¹ × Sⁿ⁻ᵏ⁻¹ — classifica le varietà di dimensione ≥ 5 riducendo i problemi geometrici a problemi di algebra e di omotopia. Il teorema dell\'h-cobordismo dimostra la congettura sulla sfera in tutte le dimensioni ≥ 5; la dimensione 4 resta la più misteriosa: non si sa se la sfera S⁴ abbia strutture lisce esotiche.' },

    { re: /cobordism|characteristic class(es)?|bordism/i,
      tit: 'Cobordismo e classi caratteristiche',
      sp: 'Due varietà chiuse di dimensione n sono <b>cobordanti</b> se insieme formano il bordo di una varietà di dimensione n + 1. È una relazione molto più grossolana del diffeomorfismo, e proprio per questo calcolabile: le classi di cobordismo formano un anello, e il calcolo si riduce, con la trasversalità, a un problema di omotopia per spazi speciali. Le <b>classi caratteristiche</b> — classi di coomologia associate ai fibrati tangenti, che misurano quanto il fibrato è «torto» — danno numeri invarianti per cobordismo, che decidono se una varietà è un bordo. Il cobordismo è diventato anche il linguaggio delle teorie quantistiche dei campi topologiche.' },

    { re: /index theor|atiyah.?singer|elliptic operators?|spectral geometry|heat kernel|dirac operators?|hear the shape/i,
      tit: 'Il teorema dell\'indice',
      sp: 'Per un operatore differenziale ellittico D su una varietà compatta l\'<b>indice</b>, dim ker D − dim coker D, è un intero che non cambia deformando D. Il teorema dell\'indice lo calcola con una formula puramente <b>topologica</b>, come integrale di classi caratteristiche della varietà e del simbolo dell\'operatore. Contiene come casi particolari la formula che lega curvatura totale e numero di buchi di una superficie, la formula sul numero di funzioni meromorfe con poli prescritti su una curva e il teorema sulla segnatura. È un ponte tra analisi, topologia e fisica, dove conta le anomalie e i modi a energia zero degli operatori che descrivono le particelle di materia.' },

    { re: /k-theory|vector bundles?|bott periodicity/i,
      tit: 'La K-teoria',
      sp: 'La K-teoria costruisce un gruppo a partire dai <b>fibrati vettoriali</b> su uno spazio: si sommano con la somma diretta e si formano le differenze formali [E] − [F]. Ne viene una teoria coomologica straordinaria, con una <b>periodicità</b>: i gruppi si ripetono con periodo 2 nel caso complesso e 8 nel caso reale. Ha risolto il problema di quanti campi di vettori linearmente indipendenti esistono su una sfera, e di quali sfere ammettono una moltiplicazione continua con unità (solo quelle di dimensione 0, 1, 3, 7). La versione algebrica, definita per anelli qualunque, contiene informazioni aritmetiche profonde, legate ai valori speciali delle funzioni zeta.' },

    { re: /morse theory|critical points|calculus of variations in the large|lusternik/i,
      tit: 'Topologia dei punti critici',
      sp: 'Una funzione liscia generica f su una varietà compatta ha punti critici isolati, ciascuno con un <b>indice</b>: il numero di direzioni in cui f decresce. Superando un valore critico di indice k, il sottolivello {f ≤ c} cambia forma per l\'aggiunta di una cella di dimensione k. Ne segue che la topologia controlla il numero di punti critici: se la varietà ha bₖ buchi di dimensione k, ogni funzione generica ha almeno bₖ punti critici di indice k. Applicata al funzionale lunghezza sullo spazio dei cammini, la teoria prova l\'esistenza di <b>geodetiche</b> multiple e ha dato la periodicità dell\'omotopia dei gruppi classici; è l\'antenata delle omologie costruite dai punti critici in geometria simplettica.' },

    { re: /homotopy|spectral sequences?|chromatic|kervaire invariant/i,
      tit: 'La teoria dell\'omotopia',
      sp: 'Due mappe sono <b>omotope</b> se si deformano con continuità l\'una nell\'altra. I gruppi di omotopia πₙ(X) contano le sfere di dimensione n dentro X a meno di deformazione: sono facili da definire e quasi impossibili da calcolare. Già i gruppi πₖ(S²) sono non nulli per infiniti k, e per le sfere non esiste una formula. Le successioni spettrali, metodi di approssimazione successiva, e la <b>teoria stabile</b>, che guarda cosa succede aumentando la dimensione, ne hanno organizzato una grande parte; la visione «cromatica» li ordina per livelli legati alle leggi di gruppo formali. Si è stabilito che le varietà incorniciate con un certo invariante quadratico non nullo esistono solo in poche dimensioni della forma 2ᵏ − 2.' },

    { re: /persistent homology|topological data analysis|applied topology/i,
      tit: 'La topologia dei dati',
      sp: 'Una nuvola di punti in alta dimensione — misure, immagini, sequenze — ha una <b>forma</b>: gruppi separati, anelli, cavità. Per leggerla si fanno crescere palline di raggio r attorno ai punti e si guarda come cambiano i buchi del complesso che ne risulta al variare di r. L\'<b>omologia persistente</b> registra per ogni buco la scala alla quale nasce e quella alla quale muore: le caratteristiche durature sono struttura, quelle effimere sono rumore. Il risultato, un diagramma di intervalli, è stabile rispetto alle perturbazioni dei dati, il che ne fa un invariante affidabile. Si applica a sensori, proteine, reti neurali, immagini mediche.' },

    { re: /foliations?|laminations?/i,
      tit: 'Fogliazioni',
      sp: 'Una fogliazione decompone una varietà in sottovarietà disgiunte della stessa dimensione, le <b>foglie</b>, impilate localmente come le pagine di un libro. Globalmente le foglie possono essere dense, avvolgersi all\'infinito o accumularsi: sul toro, le rette di pendenza irrazionale danno foglie dense. Le domande sono quali varietà ammettono fogliazioni di una data dimensione — ogni varietà chiusa con caratteristica nulla ne ammette di codimensione uno —, quando esistono foglie compatte — ogni fogliazione liscia di codimensione uno della sfera S³ ha un toro come foglia — e come se ne misura la complessità con classi caratteristiche e dinamica. Lo spazio delle foglie è tipicamente singolare e si studia con la <b>geometria non commutativa</b>.' },

    /* ── Geometria ──────────────────────────────────────────────────────── */
    { re: /optimal transport|transportation (problem|theory)|monge.?kantorovich|wasserstein|mass transport/i,
      tit: 'Il trasporto ottimale',
      sp: 'Come spostare un mucchio di sabbia per riempire una buca di forma diversa minimizzando il costo totale ∫ c(x, T(x)) dμ? Il problema, formulato come ricerca di una mappa T e poi rilassato nella ricerca di <b>piani di trasporto</b> (misure sul prodotto), ha una soluzione strutturata: per costo quadratico la mappa ottima è il gradiente di una funzione convessa. La distanza che ne risulta tra misure di probabilità trasforma lo spazio delle misure in uno spazio geometrico, dove l\'equazione del calore diventa un flusso di gradiente dell\'<b>entropia</b>. Ne vengono disuguaglianze funzionali, una nozione di curvatura inferiore per spazi metrici non lisci e applicazioni a statistica, apprendimento automatico ed economia.' },

    { re: /calabi|k[aä]hler|monge.?amp[eè]re|complex geometry|complex manifolds?|k-stability|einstein metrics?|hermitian/i,
      tit: 'Geometria complessa e metriche canoniche',
      sp: 'Su una varietà complessa compatta si cercano metriche «canoniche», compatibili con la struttura complessa e con curvatura il più uniforme possibile. Il problema si riduce a un\'<b>equazione non lineare</b> che prescrive il determinante della matrice delle derivate seconde complesse di un potenziale: det(g + ∂∂̄φ) = e^F det g. Quando il fibrato canonico è banale, esiste sempre una metrica con curvatura media nulla in ogni direzione: sono le varietà usate in teoria delle stringhe per compattificare le dimensioni nascoste. Quando la curvatura deve essere positiva serve una condizione algebrica di <b>stabilità</b>: l\'esistenza della metrica equivale a una proprietà di tutte le degenerazioni della varietà.' },

    { re: /kam theory|kolmogorov.?arnold.?moser|invariant tori|quasi.?periodic|small divisors/i,
      tit: 'Stabilità dei moti quasi periodici',
      sp: 'Un sistema meccanico integrabile — come i pianeti che girano attorno a una stella ignorando le attrazioni reciproche — ha moti <b>quasi periodici</b> su tori invarianti. Che succede perturbandolo un poco? Il teorema afferma che, per perturbazioni piccole e abbastanza regolari, la <b>maggior parte</b> dei tori sopravvive, deformata: quelli con frequenze «abbastanza irrazionali», lontane dalle risonanze, |k·ω| ≥ γ|k|^{−τ}. La dimostrazione supera il problema dei piccoli divisori con un metodo iterativo a convergenza quadratica. Tra i tori sopravvissuti restano zone caotiche sottili; con più di due gradi di libertà le orbite possono lentamente diffondere tra di essi.' },

    { re: /celestial mechanics|n-body|three-body|planetary (motion|systems)/i,
      tit: 'Meccanica celeste e il problema dei molti corpi',
      sp: 'Il moto di due corpi che si attraggono con forza proporzionale a 1/r² è risolubile: le orbite sono coniche. Già con <b>tre corpi</b> non c\'è una soluzione generale in forma chiusa: mancano quantità conservate sufficienti e compaiono orbite caotiche. Si studiano allora le soluzioni speciali — configurazioni centrali, orbite periodiche come quella a otto in cui tre masse uguali si inseguono lungo la stessa curva —, le collisioni e le singolarità senza collisione, in cui un corpo fugge all\'infinito in tempo finito, e la <b>stabilità</b> del sistema planetario su tempi lunghissimi, dove teoria delle perturbazioni e calcolo numerico mostrano un moto caotico ma confinato.' },

    { re: /symplectic|floer|hamiltonian|contact (geometry|topology|structures?)|arnold conjecture|fukaya/i,
      tit: 'Geometria simplettica e omologia dei punti fissi',
      sp: 'La geometria simplettica è la geometria dello <b>spazio delle fasi</b> della meccanica classica: invece di una distanza c\'è una forma ω che misura aree orientate, e i flussi generati da una funzione energia la preservano. Sembra flessibile, ma ha una rigidità sorprendente: una palla di raggio r non entra simpletticamente in un cilindro di raggio minore di r, anche se il volume lo permetterebbe. La rigidità si misura con curve pseudo-olomorfe e con un\'<b>omologia</b> costruita dalle orbite periodiche e dai cilindri che le collegano. Dimostra che un diffeomorfismo generato da un\'energia ha almeno tanti punti fissi quanti ne impone la topologia, più di quanti ne richieda la teoria classica.' },

    { re: /minimal (hyper)?surfaces?|minimal submanifolds?|geometric measure theory|plateau|isoperimetric|varifolds?|area.?minimi[sz]ing|min.?max/i,
      tit: 'Superfici minime e teoria geometrica della misura',
      sp: 'Una lamina di sapone tesa su un filo chiuso assume la forma di <b>area minima</b>: la sua curvatura media è nulla. Dimostrare che per ogni contorno esiste una superficie minimizzante richiede di allargare la nozione di superficie — correnti, varifold, insiemi di perimetro finito — così da avere compattezza, e poi provarne la <b>regolarità</b>: le ipersuperfici minimizzanti sono lisce fuori da un insieme singolare piccolo, vuoto fino alla dimensione 7; in dimensione 8 compare un cono singolare minimizzante. Metodi di min-max hanno mostrato che ogni varietà chiusa contiene infinite ipersuperfici minime, e le superfici minime servono a provare la positività della massa in relatività.' },

    { re: /geometric group theory|hyperbolic groups?|word.?hyperbolic|amenab|quasi.?isometr|growth of groups|polynomial growth|property \(t\)|cat\(0\)/i,
      tit: 'Teoria geometrica dei gruppi',
      sp: 'Un gruppo finitamente generato diventa uno spazio metrico: la distanza tra due elementi è la lunghezza minima della parola nei generatori che porta dall\'uno all\'altro. Il gruppo si studia allora come un oggetto geometrico <b>visto da lontano</b>, a meno di quasi-isometrie. Un gruppo ha crescita polinomiale se e solo se contiene un sottogruppo nilpotente di indice finito. I gruppi <b>iperbolici</b>, nei quali i triangoli geodetici sono sottili come in un albero, sono «generici» tra i gruppi presentati a caso e hanno il problema della parola risolubile in tempo lineare. Questa prospettiva lega algebra, topologia delle varietà a curvatura negativa e dinamica.' },

    { re: /riemannian|comparison geometry|curvature|gromov.?hausdorff|collapsing|systolic/i,
      tit: 'Geometria degli spazi curvi',
      sp: 'Una varietà dotata di una <b>metrica</b> — un prodotto scalare su ogni spazio tangente — ha lunghezze, angoli, geodetiche e curvatura. I teoremi di confronto dicono che una curvatura limitata dal basso controlla volume, diametro e topologia: per esempio, curvatura sezionale ≥ 1 implica diametro ≤ π. Si studiano le <b>successioni</b> di varietà e i loro limiti, che possono essere spazi singolari o di dimensione minore («collasso»), e quali varietà ammettono metriche di curvatura scalare positiva, domanda legata alla teoria dell\'indice e alla relatività. È il linguaggio della relatività generale e di gran parte dell\'analisi geometrica.' },

    { re: /teichm[uü]ller|quasiconformal|riemann surfaces?|kleinian groups?|uniformi[sz]ation/i,
      tit: 'Superfici complesse e le loro deformazioni',
      sp: 'Una superficie compatta orientabile di genere g ammette molte strutture complesse diverse: lo <b>spazio delle deformazioni</b> di queste strutture, per g ≥ 2, ha dimensione complessa 3g − 3 ed è contrattile. Il teorema di uniformizzazione dice che ogni superficie di questo tipo è il quoziente del disco, del piano o della sfera per un gruppo di trasformazioni: per g ≥ 2 è il disco con la sua <b>geometria iperbolica</b>. Le mappe quasiconformi, che distorcono gli angoli in modo limitato, sono lo strumento per confrontare strutture diverse. Il gruppo delle classi di diffeomorfismi della superficie agisce su questo spazio, e la sua dinamica è un tema centrale.' },

    { re: /quasicrystals?|aperiodic|tilings?|tessellations?|einstein tile/i,
      tit: 'Tassellazioni e ordine aperiodico',
      sp: 'Il piano si tassella periodicamente con quadrati, triangoli, esagoni; le rotazioni che preservano una tassellazione periodica possono avere solo ordine 2, 3, 4 o 6 (restrizione cristallografica). Esistono però insiemi finiti di tessere che tassellano il piano solo in modo <b>aperiodico</b>: le loro tassellazioni hanno simmetrie locali di ordine 5, ordine a lungo raggio e diffrazione a punti nitidi, come i quasicristalli. Si ottengono anche proiettando una fetta di un reticolo di dimensione alta. È stata trovata anche una singola tessera che tassella il piano solo aperiodicamente. Decidere se un insieme di tessere tassella il piano è <b>indecidibile</b> in generale.' },

    { re: /convex geometry|convex bod(y|ies)|discrete geometry|polytopes?|incidence geometry|brunn|minkowski/i,
      tit: 'Geometria convessa e discreta',
      sp: 'Un insieme è convesso se contiene il segmento tra due suoi punti qualunque. Da questa definizione elementare nascono risultati profondi: le disuguaglianze tra volumi misti, di cui quella isoperimetrica è un caso particolare, e il fenomeno di <b>concentrazione</b> per cui in alta dimensione quasi tutto il volume di un corpo convesso sta vicino a una sezione. La geometria discreta studia configurazioni finite — punti, rette, poliedri — e domande di conteggio: quante incidenze tra n punti e n rette (al più circa n^{4/3}), quante distanze distinte determinano n punti nel piano. I <b>politopi</b> collegano combinatoria, geometria algebrica e ottimizzazione lineare.' },

    /* ── Analisi ────────────────────────────────────────────────────────── */
    { re: /boltzmann equation|kinetic (theory|equations?)|landau damping|vlasov|mean.?field limits?/i,
      tit: 'Teoria cinetica e smorzamento senza collisioni',
      sp: 'Un gas o un plasma con moltissime particelle si descrive con una densità f(t, x, v) nello spazio di posizioni e velocità. L\'equazione cinetica dei gas con un termine di <b>collisione</b> spiega la crescita dell\'entropia e il ritorno all\'equilibrio, con la distribuzione normale delle velocità; l\'esistenza globale delle soluzioni e la velocità di convergenza sono state problemi lunghi. Per un plasma senza collisioni c\'è un fenomeno paradossale, lo <b>smorzamento</b>: le onde di densità si attenuano anche se la dinamica è reversibile, perché l\'energia si trasferisce a oscillazioni sempre più fini nelle velocità. La dimostrazione non lineare richiede stime analitiche raffinatissime.' },

    { re: /navier.?stokes|euler equations?|fluid (dynamics|mechanics)|hydrodynamics|turbulence|incompressible|onsager/i,
      tit: 'Le equazioni dei fluidi',
      sp: 'Un fluido incomprimibile obbedisce a ∂ₜu + (u·∇)u = −∇p + νΔu, ∇·u = 0, dove u è la velocità, p la pressione e ν la viscosità; con ν = 0 si hanno le equazioni dei fluidi perfetti. In due dimensioni le soluzioni regolari esistono per sempre; in tre dimensioni non si sa se dati iniziali lisci possano sviluppare <b>singolarità</b> in tempo finito, ed è uno dei grandi problemi aperti. Si conoscono soluzioni deboli e, con tecniche di integrazione convessa, soluzioni «selvagge» che dissipano energia, come previsto dalla teoria della <b>turbolenza</b> per velocità con regolarità inferiore a un terzo di derivata. Gran parte della turbolenza resta matematicamente aperta.' },

    { re: /conservation laws|shock waves?|hyperbolic (systems|equations|conservation)|entropy solutions/i,
      tit: 'Leggi di conservazione e onde d\'urto',
      sp: 'Una legge di conservazione ∂ₜu + ∂ₓf(u) = 0 dice che una quantità — massa, quantità di moto, energia — non si crea né si distrugge, ma si trasporta. Anche partendo da dati lisci, le caratteristiche si incrociano e la soluzione sviluppa in tempo finito <b>discontinuità</b>: le onde d\'urto, come in un\'esplosione o in un ingorgo stradale. Le soluzioni deboli non sono uniche: serve un criterio di <b>entropia</b> che selezioni quella fisicamente ammissibile, limite della soluzione con una piccola viscosità. Per un\'equazione scalare la teoria è completa; per i sistemi in una dimensione funziona per dati di piccola variazione totale; in più dimensioni restano problemi aperti fondamentali.' },

    { re: /dispersive|nonlinear (wave|schr[oö]dinger)|wave maps?|wave equations?|soliton resolution|scattering theory/i,
      tit: 'Equazioni dispersive e onde non lineari',
      sp: 'Nell\'equazione delle onde e nell\'equazione d\'onda quantistica le componenti di frequenza diversa viaggiano a velocità diverse: un pacchetto si <b>disperde</b> e la sua ampiezza decresce. Se c\'è una non linearità che tende a concentrare, nasce una competizione tra dispersione e focalizzazione. Le domande: le soluzioni esistono per sempre? Si disperdono come quelle lineari (<b>scattering</b>)? O formano singolarità? Stime che misurano con precisione la dispersione, analisi in frequenza e leggi di conservazione permettono di rispondere anche nei casi a energia critica, e di mostrare che le soluzioni si decompongono in onde solitarie più una parte che si disperde.' },

    { re: /integrable systems?|solitons?|korteweg|kdv|painlev[eé]|inverse scattering|lax pairs?|isomonodromy/i,
      tit: 'Sistemi integrabili e solitoni',
      sp: 'Un\'onda solitaria in un canale poco profondo si propaga senza deformarsi, e due di queste onde si attraversano riemergendo intatte: sono i <b>solitoni</b>, soluzioni di equazioni come uₜ + 6uuₓ + uₓₓₓ = 0. Il motivo è che l\'equazione è <b>integrabile</b>: ha infinite quantità conservate e si risolve con una trasformazione di diffusione inversa, che la linearizza come la trasformata in frequenze linearizza le equazioni lineari a coefficienti costanti. La stessa struttura compare nelle matrici aleatorie, nei modelli di meccanica statistica risolubili esattamente e nelle equazioni differenziali ordinarie non lineari le cui soluzioni non hanno singolarità mobili.' },

    { re: /regularity structures|stochastic partial differential|singular spdes?|\bspdes?\b|\bkpz\b|kardar|rough paths?/i,
      tit: 'Equazioni alle derivate parziali stocastiche',
      sp: 'Molti modelli fisici sono equazioni alle derivate parziali con un termine di <b>rumore</b> che varia in modo casuale in ogni punto dello spazio-tempo: la crescita di un\'interfaccia, la quantizzazione di un campo. Il rumore è così irregolare che i termini non lineari, quadrati di distribuzioni, non hanno senso: l\'equazione è <b>mal posta</b>. Una teoria di «strutture di regolarità» costruisce, al posto degli sviluppi polinomiali locali, sviluppi adattati al rumore stesso, e dimostra che dopo aver sottratto costanti infinite (rinormalizzazione) le soluzioni esistono e sono limiti di approssimazioni regolari. È un analogo rigoroso della rinormalizzazione dei fisici.' },

    { re: /elliptic (partial differential )?equations|regularity theory|regularity of solutions|free boundar|obstacle problem|fully nonlinear|viscosity solutions|de giorgi|nonlocal/i,
      tit: 'Regolarità delle soluzioni e problemi a frontiera libera',
      sp: 'Una soluzione «debole» di un\'equazione alle derivate parziali soddisfa l\'equazione solo in media, contro funzioni test: esiste facilmente, ma è <b>liscia</b>? Per le equazioni ellittiche in forma di divergenza con coefficienti solo misurabili e limitati, la risposta sorprendente è che le soluzioni sono comunque continue, con un modulo di continuità di tipo potenza; ne segue la regolarità dei minimi di molti integrali del calcolo delle variazioni. Nei problemi a <b>frontiera libera</b> — il ghiaccio che si scioglie, una membrana appoggiata su un ostacolo — l\'incognita è anche l\'interfaccia, e si dimostra che è liscia tranne che in un insieme di punti singolari piccolo e strutturato.' },

    { re: /elasticity|materials science|microstructures?|liquid crystals?|continuum mechanics|phase.?field/i,
      tit: 'Matematica dei materiali e dell\'elasticità',
      sp: 'Un corpo elastico deformato da u minimizza un\'energia ∫ W(∇u) dx, con una densità W che non può essere convessa: un materiale non può compenetrarsi, e una rotazione rigida non costa energia. Le leghe a memoria di forma creano <b>microstrutture</b>: fasce alternate di cristalli orientati diversamente, sempre più fini, perché nessuna configurazione liscia raggiunge il minimo. La teoria spiega quali microstrutture sono compatibili e come l\'energia di interfaccia ne fissa la scala. Problemi variazionali non convessi simili descrivono i cristalli liquidi, i <b>difetti</b> topologici, la frattura e il passaggio da teorie tridimensionali a modelli ridotti di piastre e travi.' },

    { re: /calculus of variations|variational (methods|problems|calculus|principles?)|homogeni[sz]ation|gamma.?convergence|direct method/i,
      tit: 'Il calcolo delle variazioni',
      sp: 'Molte leggi della natura sono principi di minimo: la forma di equilibrio rende minima un\'energia E(u) = ∫ F(x, u, ∇u) dx. Il calcolo delle variazioni cerca questi minimi. Con il <b>metodo diretto</b> si prende una successione minimizzante, se ne estrae una sottosuccessione convergente in una topologia debole e si dimostra che il limite è un minimo; per questo servono convessità o sue varianti, come la quasiconvessità per i sistemi. La teoria della <b>convergenza variazionale</b> descrive come i minimi di energie dipendenti da un parametro piccolo — materiali a microstruttura fine, transizioni di fase — convergono ai minimi di un\'energia limite effettiva.' },

    { re: /compressed sensing|compressive sensing|sparse (recovery|signals?|representations?)|sparsity|matrix completion/i,
      tit: 'Ricostruire segnali sparsi da poche misure',
      sp: 'Un segnale di lunghezza N si può ricostruire da molte meno di N misure lineari, purché sia <b>sparso</b>: abbia cioè solo s ≪ N coefficienti non nulli in una base opportuna. Il problema naturale, trovare il vettore con meno entrate non nulle compatibile con le misure, è intrattabile; ma minimizzare la norma ℓ¹, ∑|xᵢ|, che è convessa, dà la <b>stessa soluzione</b> se la matrice delle misure si comporta quasi come un\'isometria sui vettori sparsi. Matrici casuali con circa s·log(N/s) righe hanno questa proprietà con alta probabilità. Le applicazioni vanno dalla risonanza magnetica più rapida al completamento di grandi matrici di dati incomplete.' },

    { re: /wavelets?|time.?frequency|multiresolution|signal processing|image processing/i,
      tit: 'Le ondine e l\'analisi tempo-frequenza',
      sp: 'La scomposizione in sinusoidi descrive bene un segnale stazionario ma male uno che cambia nel tempo, perché ogni sinusoide si estende all\'infinito. Le <b>ondine</b> sono funzioni ψ localizzate sia nel tempo sia in frequenza; dilatandole e traslandole, ψⱼₖ(x) = 2^{j/2} ψ(2ʲx − k), si ottengono basi ortonormali in cui un segnale si descrive scala per scala. Esistono ondine a supporto compatto con regolarità prescritta, costruite con un\'<b>analisi a multirisoluzione</b>. I coefficienti dei segnali regolari a tratti decadono rapidamente, e questo rende le ondine ideali per comprimere immagini, togliere rumore e risolvere equazioni.' },

    { re: /inverse problems?|tomography|calder[oó]n problem|medical imaging/i,
      tit: 'Problemi inversi',
      sp: 'Un problema diretto calcola le misure a partire dalla causa; un <b>problema inverso</b> ricostruisce la causa dalle misure: la struttura interna di un corpo dalle radiografie (tomografia), la conduttività di un tessuto da misure di corrente e tensione al bordo, l\'interno del pianeta dalle onde sismiche. Questi problemi sono spesso <b>mal posti</b>: piccoli errori nei dati producono grandi errori nella soluzione. La teoria stabilisce quando le misure determinano univocamente l\'incognita, con quale stabilità, e come regolarizzare la ricostruzione. Usa analisi armonica, geometria delle geodetiche lungo cui viaggiano i segnali ed equazioni alle derivate parziali.' },

    { re: /harmonic analysis|fourier|singular integrals?|restriction (problem|conjecture|theorem)|kakeya|decoupling|calder[oó]n.?zygmund|littlewood.?paley|carleson/i,
      tit: 'L\'analisi armonica',
      sp: 'L\'analisi armonica scompone le funzioni in <b>frequenze</b>: f̂(ξ) = ∫ f(x) e^{−2πi x·ξ} dx. Le domande difficili riguardano il controllo quantitativo: la serie in frequenze di una funzione a quadrato integrabile converge quasi ovunque (sì); gli operatori integrali singolari, come la trasformata che coniuga le funzioni armoniche, sono limitati sugli spazi Lᵖ; la trasformata ristretta a una superficie curva controlla la funzione. Le stime di <b>disaccoppiamento</b>, nate attorno al problema degli insiemi che contengono un segmento in ogni direzione, hanno risolto problemi di teoria dei numeri sulle somme esponenziali e di equazioni dispersive.' },

    { re: /noncommutative geometry|non-commutative geometry|cyclic (co)?homology|spectral triples?/i,
      tit: 'Geometria non commutativa',
      sp: 'Uno spazio compatto è determinato dall\'algebra commutativa delle sue funzioni continue. La geometria non commutativa prende sul serio il passo inverso: tratta un\'<b>algebra non commutativa</b> qualunque come l\'algebra delle funzioni su uno «spazio quantistico». Così diventano geometrici oggetti mal comportati come lo spazio delle foglie di una fogliazione o il quoziente di un toro per una rotazione irrazionale. Gli strumenti sono la K-teoria delle algebre di operatori, l\'<b>omologia ciclica</b>, che sostituisce le forme differenziali, e le «triple spettrali», che codificano la metrica con un operatore simile a una radice quadrata dell\'operatore di diffusione. Ci sono applicazioni alla fisica delle particelle e alla teoria dei numeri.' },

    { re: /von neumann|operator algebras?|c\*.?algebras?|subfactors?|free probability|type ii/i,
      tit: 'Algebre di operatori',
      sp: 'Le algebre di operatori limitati su uno spazio con prodotto scalare completo, chiuse per l\'aggiunzione e in un\'opportuna topologia, sono il linguaggio della meccanica quantistica. Quelle con centro banale, i <b>fattori</b>, si classificano in tipi; i fattori di tipo II₁ hanno una traccia e una «dimensione» che varia con continuità. L\'<b>indice</b> di un sottofattore può assumere solo i valori 4cos²(π/n), per n ≥ 3, oppure un valore qualunque ≥ 4: una quantizzazione inattesa, da cui sono nati gli invarianti polinomiali dei nodi. La probabilità libera, in cui le variabili non commutano, descrive il comportamento di grandi matrici aleatorie indipendenti.' },

    { re: /banach spaces?|functional analysis|hilbert spaces?|normed spaces|topological vector|invariant subspace/i,
      tit: 'Analisi funzionale e geometria degli spazi normati',
      sp: 'L\'analisi funzionale tratta le funzioni come <b>punti</b> di spazi vettoriali di dimensione infinita, dotati di una norma e completi. In dimensione infinita l\'intuizione fallisce: la palla unitaria non è compatta, non tutti gli operatori hanno autovalori. La teoria geometrica studia la forma di questi spazi: esistono spazi in cui ogni operatore è una piccola perturbazione di un multiplo dell\'identità, spazi che non contengono alcuna successione di base incondizionata, e teoremi di <b>dicotomia</b>: ogni spazio contiene un sottospazio molto simmetrico oppure uno molto rigido. Le nozioni di tipo e cotipo collegano la geometria degli spazi alla probabilità.' },

    { re: /fixed.?point|nonlinear functional analysis|degree theory|topological methods in (analysis|nonlinear)|bifurcation theory/i,
      tit: 'Punti fissi e metodi topologici in analisi non lineare',
      sp: 'Molte equazioni si riscrivono come x = T(x): trovare una soluzione significa trovare un <b>punto fisso</b>. Se T contrae le distanze, l\'iterazione converge all\'unico punto fisso; se T è solo continua e manda un convesso compatto in sé, un punto fisso esiste comunque, per ragioni topologiche, e ci sono versioni in dimensione infinita per operatori compatti. Il <b>grado topologico</b>, che conta con segno le soluzioni di F(x) = y ed è invariante per deformazione, permette di dimostrare l\'esistenza di soluzioni di equazioni non lineari senza calcolarle e di seguire i rami di soluzioni al variare di un parametro (biforcazione). È la cassetta degli attrezzi dell\'analisi non lineare.' },

    { re: /potential theory|harmonic functions|subharmonic|harmonic measure/i,
      tit: 'Teoria del potenziale',
      sp: 'Una funzione è <b>armonica</b> se Δu = 0: è il potenziale elettrostatico nel vuoto, la temperatura all\'equilibrio. Le funzioni armoniche hanno la proprietà della media — il valore al centro di una sfera è la media sul bordo —, il principio del massimo e una rigidità simile a quella delle funzioni olomorfe. La teoria del potenziale studia i problemi al bordo, le <b>capacità</b> degli insiemi, cioè quanta carica possono trattenere e quali insiemi sono trascurabili, e la misura armonica: la probabilità che un cammino aleatorio continuo esca dal dominio da una certa parte del bordo. Il legame con la probabilità è profondo: il problema al bordo si risolve con un valore atteso all\'uscita.' },

    { re: /several complex variables|complex analysis|pluripotential|holomorphic functions|conformal mapping|value distribution|bieberbach/i,
      tit: 'Analisi complessa in una e più variabili',
      sp: 'Le funzioni <b>olomorfe</b>, derivabili in senso complesso, sono rigidissime: sono determinate dai loro valori su un insieme con un punto di accumulazione e soddisfano ∮ f(z) dz = 0 sui cammini chiusi contraibili. In una variabile ogni aperto semplicemente connesso del piano, diverso dal piano stesso, è equivalente al disco. In <b>più variabili</b> cambia tutto: una funzione olomorfa definita su una corona sferica si estende all\'interno, e i domini «naturali» di esistenza, detti pseudoconvessi, sono caratterizzati da una condizione geometrica sul bordo. Le stime in media quadratica per l\'operatore ∂̄ e la teoria delle funzioni plurisubarmoniche sono gli strumenti principali.' },

    { re: /schr[oö]dinger operators?|spectral theory|quantum chaos|semiclassical|anderson localization|stability of matter|quantum unique ergodicity/i,
      tit: 'Teoria spettrale e operatori quantistici',
      sp: 'In meccanica quantistica le energie possibili di un sistema sono lo <b>spettro</b> di un operatore H = −Δ + V. La teoria spettrale studia come lo spettro dipende dal potenziale V: in un mezzo disordinato le funzioni d\'onda possono restare <b>localizzate</b> e il materiale diventa isolante; in un potenziale quasi periodico lo spettro può essere un insieme di tipo frattale. Nel limite semiclassico, le autofunzioni dell\'operatore di diffusione su una varietà a curvatura negativa tendono a distribuirsi uniformemente (ergodicità quantistica), e la questione di quanto uniformemente è aperta. La stabilità della materia ordinaria, che non collassa, è un teorema di questa teoria.' },

    { re: /approximation theory|orthogonal polynomials|special functions|hypergeometric|interpolation|asymptotic analysis/i,
      tit: 'Teoria dell\'approssimazione e funzioni speciali',
      sp: 'Ogni funzione continua su un intervallo si approssima uniformemente con polinomi; la domanda quantitativa è <b>quanto bene</b>, con polinomi di grado n o con funzioni razionali, e la risposta dipende dalla regolarità: più la funzione è liscia, più l\'errore decresce rapidamente. I <b>polinomi ortogonali</b> rispetto a un peso soddisfano una ricorrenza a tre termini, e i loro zeri danno formule di integrazione numerica ottimali; il loro comportamento per n grande si studia con problemi di fattorizzazione di matrici di funzioni. Le funzioni speciali — ipergeometriche, ellittiche, cilindriche — risolvono le equazioni classiche della fisica e hanno identità che uniscono analisi, combinatoria e teoria dei numeri.' },

    /* ── Sistemi dinamici ───────────────────────────────────────────────── */
    { re: /homogeneous dynamics|homogeneous spaces?|unipotent|ratner|oppenheim|measure rigidity|equidistribution/i,
      tit: 'Dinamica sugli spazi omogenei',
      sp: 'Lo spazio dei reticoli di ℝⁿ di covolume 1 è il quoziente SLₙ(ℝ)/SLₙ(ℤ), e i sottogruppi di matrici vi agiscono per moltiplicazione. Per i flussi <b>unipotenti</b>, generati da matrici con tutti gli autovalori uguali a 1, le orbite sono estremamente regolari: ogni chiusura d\'orbita è una sottovarietà omogenea e ogni misura invariante ergodica è algebrica. Ne segue, per esempio, che una forma quadratica indefinita in almeno 3 variabili, non proporzionale a una razionale, assume sugli interi valori <b>densi</b> in ℝ. Per le azioni diagonali si hanno risultati di rigidità e di equidistribuzione, con applicazioni all\'approssimazione dei numeri reali e al conteggio di punti interi.' },

    { re: /superrigidity|rigidity|arithmetic groups?|lattices in (lie|semisimple)|discrete subgroups/i,
      tit: 'Rigidità e sottogruppi discreti',
      sp: 'Un reticolo in un gruppo continuo di simmetrie è un sottogruppo discreto con quoziente di volume finito, come SLₙ(ℤ) dentro SLₙ(ℝ). Nei gruppi semisemplici di rango ≥ 2 i reticoli sono sorprendentemente <b>rigidi</b>: ogni loro rappresentazione lineare si estende essenzialmente al gruppo ambiente, e ne segue che sono tutti <b>aritmetici</b>, cioè costruiti da matrici a coefficienti interi in una forma opportuna. Analogamente, una varietà iperbolica di dimensione ≥ 3 e volume finito è determinata dal suo gruppo fondamentale. Gli strumenti sono teoria ergodica, frontiere all\'infinito e proprietà di punto fisso per azioni su spazi con prodotto scalare: una grande sintesi tra algebra, geometria e dinamica.' },

    { re: /holomorphic dynamics|complex dynamics|mandelbrot|julia sets?|rational maps|iteration of (rational|polynomial)/i,
      tit: 'Dinamica olomorfa e insiemi frattali',
      sp: 'Si itera un polinomio, per esempio z ↦ z² + c. Il piano si divide in due: i punti con orbita stabile e l\'insieme dove la dinamica è <b>caotica</b>, di solito un frattale. L\'insieme dei parametri c per cui quest\'ultimo è connesso — equivalentemente, per cui l\'orbita di 0 resta limitata — è un oggetto di complessità infinita, con copie di sé a ogni scala. La congettura centrale è che sia <b>localmente connesso</b>, il che implicherebbe che i parametri iperbolici, a dinamica semplice, sono densi. Si sa che il suo bordo ha dimensione frattale 2; le mappe quasiconformi e la rinormalizzazione sono gli strumenti principali.' },

    { re: /fractals?|hausdorff dimension|self.?similar|multifractal/i,
      tit: 'Geometria frattale e dimensione',
      sp: 'Un frattale ha struttura a ogni scala: l\'insieme ottenuto togliendo ripetutamente il terzo centrale da [0, 1], o la curva a fiocco di neve, di lunghezza infinita, che racchiude un\'area finita. Per misurarli si usa una <b>dimensione</b> non intera: se un insieme si copre con N(ε) palle di raggio ε e N(ε) ≈ ε^{−d}, la sua dimensione è d; per l\'insieme dei terzi d = log 2 / log 3 ≈ 0,63. Gli insiemi autosimili, unioni di copie ridotte di sé, hanno dimensione calcolabile se i pezzi non si sovrappongono troppo, ma le <b>sovrapposizioni</b> rendono il problema difficile. Le dimensioni di proiezioni, prodotti e sezioni dei frattali sono un campo di ricerca attivo.' },

    /* ── Probabilità e meccanica statistica ─────────────────────────────── */
    { re: /schramm|loewner|\bsle\b|conformal invariance|conformally invariant|scaling limits?/i,
      tit: 'Invarianza conforme dei modelli critici',
      sp: 'Al punto critico, molti modelli su reticolo del piano — percolazione, modelli magnetici, cammini aleatori senza autointersezioni — hanno limiti di scala <b>conformemente invarianti</b>: le interfacce tra regioni diventano curve casuali frattali la cui legge non cambia sotto le mappe che preservano gli angoli. Queste curve si descrivono con un\'equazione differenziale di evoluzione guidata da un moto casuale continuo di velocità √κ: una famiglia a un parametro di <b>curve aleatorie</b>. Il valore di κ identifica il modello e la dimensione frattale, 1 + κ/8. La convergenza del modello discreto si prova costruendo osservabili discrete che nel limite diventano funzioni olomorfe.' },

    { re: /random (planar )?maps|quantum gravity|random geometry|gaussian free field|random surfaces?|random trees?/i,
      tit: 'Geometria aleatoria e superfici casuali',
      sp: 'Si incollano a caso n triangoli lungo i lati fino a ottenere una sfera: una <b>mappa planare aleatoria</b>. Per n → ∞, riscalando le distanze per n^{1/4}, si ottiene uno spazio metrico casuale universale, omeomorfo alla sfera ma di dimensione frattale 4. Una descrizione equivalente parte dal <b>campo libero</b>, la funzione casuale più naturale in due dimensioni, troppo irregolare per essere una vera funzione, e definisce una metrica e^{γh}|dz|² a curvatura «aleatoria»: è il modello di gravità quantistica bidimensionale dei fisici. Le due costruzioni coincidono, e su queste superfici le curve aleatorie conformemente invarianti si muovono in modo esplicitamente calcolabile.' },

    { re: /percolation/i,
      tit: 'La percolazione',
      sp: 'Ogni lato di un reticolo è aperto con probabilità p, indipendentemente dagli altri. Esiste un <b>cluster infinito</b> di lati aperti? C\'è una soglia critica p_c: sotto, quasi certamente no; sopra, quasi certamente sì. Sul reticolo quadrato p_c = 1/2, e la prova usa la dualità tra il reticolo e il suo duale. Il comportamento <b>al punto critico</b> è il problema difficile: in dimensione 2 le probabilità di attraversare un rettangolo diventano invarianti per mappe conformi nel limite, e gli esponenti critici si calcolano esattamente; in dimensione 3 non si sa ancora dimostrare che al punto critico non ci sia un cluster infinito. È il modello più semplice di transizione di fase.' },

    { re: /ising|potts|phase transitions?|lattice models?|critical phenomena|dimers?|spin glass(es)?|gibbs measures?/i,
      tit: 'Transizioni di fase e modelli di spin',
      sp: 'Il modello più semplice di magnete pone uno spin σᵢ = ±1 in ogni punto di un reticolo, con energia H = −∑ σᵢσⱼ sulle coppie vicine; a temperatura T le configurazioni hanno probabilità proporzionale a e^{−H/T}. In dimensione ≥ 2 c\'è una <b>transizione di fase</b>: sotto una temperatura critica il sistema si magnetizza spontaneamente. Matematicamente la questione è l\'unicità o la non unicità delle misure di equilibrio a volume infinito, e il comportamento al punto critico. Si è dimostrato che la transizione è continua in dimensione 3, che il limite di scala è <b>banale</b> (normale) dalla dimensione 4 in su, e si è calcolata l\'energia libera dei vetri di spin.' },

    { re: /interacting particle|hydrodynamic limits?|exclusion process|zero.?range|voter model/i,
      tit: 'Sistemi di particelle interagenti e limiti idrodinamici',
      sp: 'Moltissime particelle si muovono a caso su un reticolo seguendo regole locali: nel processo di esclusione ogni particella tenta di saltare su un sito vicino e ci riesce solo se è vuoto. Nessuna particella «sa» nulla della scala macroscopica, eppure, guardando da lontano e riscalando spazio e tempo, la densità soddisfa un\'<b>equazione deterministica</b>, di diffusione o di trasporto con onde d\'urto. Dimostrare questi <b>limiti idrodinamici</b> è il modo rigoroso di dedurre le equazioni dei continui dalla dinamica microscopica. Le fluttuazioni attorno al limite, nei casi asimmetrici, hanno esponenti 1/3 e le statistiche delle matrici aleatorie.' },

    { re: /random matri|eigenvalue (statistics|distribution)|tracy.?widom|wigner|circular law/i,
      tit: 'Matrici aleatorie',
      sp: 'Si prende una matrice simmetrica N × N con entrate aleatorie indipendenti. Per N grande la distribuzione degli autovalori, opportunamente riscalata, tende a una legge a <b>semicerchio</b>; e le spaziature tra autovalori vicini seguono una legge universale che non dipende dalla distribuzione delle entrate: gli autovalori si <b>respingono</b>. Le stesse statistiche compaiono negli zeri della funzione zeta, nei livelli energetici dei nuclei pesanti, nei sistemi quantistici caotici, nella crescita delle interfacce e nelle permutazioni casuali, nella lunghezza della più lunga sottosuccessione crescente. Dimostrarne l\'universalità ha richiesto metodi dinamici e analitici nuovi.' },

    { re: /large deviations?|concentration of measure|concentration inequalit|rare events/i,
      tit: 'Grandi deviazioni',
      sp: 'La legge dei grandi numeri dice che la media di n variabili indipendenti tende al valore atteso; il teorema del limite centrale descrive fluttuazioni dell\'ordine di 1/√n. Le <b>grandi deviazioni</b> misurano gli eventi rari: la probabilità che la media si discosti di una quantità fissa decade esponenzialmente, P ≈ e^{−n I(x)}, con un <b>funzionale di tasso</b> I calcolabile e legato all\'entropia. La teoria si estende a processi, cammini e misure empiriche, e fornisce un principio variazionale che dice quale sia il modo «meno improbabile» di realizzare un evento raro. È una base matematica della meccanica statistica dell\'equilibrio e di molte stime di rischio in ingegneria.' },

    { re: /probabilistic method|random graphs?|probabilistic combinatorics|local lemma|sharp thresholds?|threshold phenomena/i,
      tit: 'Il metodo probabilistico e i grafi aleatori',
      sp: 'Per dimostrare che esiste un oggetto con certe proprietà basta mostrare che un oggetto <b>scelto a caso</b> le ha con probabilità positiva. Così si prova che esistono grafi con 2^{k/2} vertici senza k vertici tutti collegati né k tutti scollegati, senza saperne esibire uno. Nei <b>grafi aleatori</b>, dove ogni lato c\'è con probabilità p, le proprietà compaiono di colpo: a p = 1/n nasce una componente gigante, e ogni proprietà monotona ha una soglia. Si è dimostrato che la soglia vera è sempre vicina a quella «attesa», calcolata con il conteggio medio, entro un fattore logaritmico. Il metodo è diventato centrale anche in informatica teorica.' },

    { re: /random walks?|markov chains?|mixing times?|branching (processes|random walks?)|self-avoiding/i,
      tit: 'Cammini aleatori e catene senza memoria',
      sp: 'Un cammino aleatorio su ℤᵈ fa a ogni passo un salto casuale verso un vicino. In dimensione 1 e 2 torna all\'origine con probabilità 1, in dimensione ≥ 3 no: è il teorema di <b>ricorrenza</b>, e si dimostra confrontando la somma delle probabilità di ritorno con ∑ n^{−d/2}. Più in generale, le catene in cui il futuro dipende solo dal presente modellano sistemi di ogni tipo; il <b>tempo di mescolamento</b> misura quanti passi servono per avvicinarsi all\'equilibrio, e molte catene esibiscono un passaggio brusco: per mescolare un mazzo di 52 carte bastano circa sette mescolate a ventaglio. I cammini senza autointersezioni modellano i polimeri.' },

    { re: /mathematical finance|financial mathematics|option pricing|quantitative finance|stochastic finance/i,
      tit: 'Matematica finanziaria',
      sp: 'Il prezzo di un titolo si modella come un processo aleatorio continuo con deriva e volatilità. Il risultato fondamentale è che il prezzo equo di un contratto derivato — un\'opzione che paga max(S − K, 0) alla scadenza — non dipende dalle aspettative degli investitori: si costruisce un <b>portafoglio di copertura</b> che ne replica il pagamento, e l\'assenza di arbitraggio impone un unico prezzo, dato da un valore atteso rispetto a una misura «neutrale al rischio». Il prezzo soddisfa un\'equazione parabolica simile a quella del calore. La teoria moderna tratta mercati incompleti, volatilità aleatoria e <b>misure di rischio</b>, con calcolo stocastico e controllo ottimo.' },

    { re: /stochastic (calculus|analysis|differential|integra|processes?)|brownian|wiener|martingales?|diffusion processes?|malliavin|it[oô] calculus/i,
      tit: 'Moto casuale continuo e calcolo stocastico',
      sp: 'Il moto casuale delle particelle sospese in un fluido è modellato da un processo B(t) a traiettorie continue, con incrementi indipendenti e normali di varianza proporzionale al tempo: un <b>cammino aleatorio continuo</b>, limite universale dei cammini discreti. Le sue traiettorie non sono derivabili in nessun punto, quindi ∫ f dB non si definisce come al solito: il <b>calcolo stocastico</b> lo costruisce, con una regola della catena modificata, df(B) = f′(B) dB + ½ f″(B) dt. Le equazioni differenziali stocastiche descrivono diffusioni in fisica, biologia e finanza, e collegano la probabilità alle equazioni paraboliche alle derivate parziali.' },

    { re: /ergodic|measure.?preserving|mixing|entropy of dynamical|recurrence/i,
      tit: 'Teoria ergodica',
      sp: 'Un sistema dinamico che conserva una misura è <b>ergodico</b> se non si spezza in parti invarianti. Il teorema ergodico dice che allora la media temporale di una grandezza lungo quasi ogni orbita coincide con la media spaziale: (1/N)∑ f(Tⁿx) → ∫ f dμ. È la giustificazione matematica di un\'ipotesi fondante della meccanica statistica. L\'<b>entropia</b> misura quanta informazione nuova produce ogni passo e classifica i sistemi più casuali. Grazie ai teoremi di ricorrenza, la teoria ergodica è diventata uno strumento della combinatoria e della teoria dei numeri: risultati sulle progressioni negli insiemi densi si ottengono studiando la ricorrenza multipla.' },

    /* ── Algebra e rappresentazioni ─────────────────────────────────────── */
    { re: /finite simple groups?|classification of finite|sporadic groups?|finite groups?|groups of lie type|odd order/i,
      tit: 'I gruppi semplici finiti',
      sp: 'Ogni gruppo finito si costruisce a partire da <b>gruppi semplici</b>, che non hanno sottogruppi normali propri, come gli interi si costruiscono dai primi. La classificazione dice che un gruppo semplice finito è ciclico di ordine primo, alternante, di uno dei tipi di gruppi di matrici su campi finiti, oppure uno dei <b>26 sporadici</b>, il più grande dei quali, il Mostro, ha circa 8·10⁵³ elementi. La dimostrazione è distribuita in decine di migliaia di pagine; un passo chiave è che ogni gruppo di ordine dispari è risolubile. La classificazione è usata ovunque si incontrino simmetrie finite: grafi, codici, permutazioni, geometrie finite.' },

    { re: /quantum groups?|hopf algebras?|yang.?baxter|quantum (enveloping|affine)|crystal bases?/i,
      tit: 'I gruppi quantistici',
      sp: 'Un gruppo quantistico è una deformazione, dipendente da un parametro q, dell\'algebra che descrive le simmetrie infinitesimali di un gruppo continuo: per q → 1 si ritrova l\'oggetto classico. La struttura che lo rende interessante è una <b>matrice R</b> che soddisfa l\'equazione delle trecce R₁₂R₁₃R₂₃ = R₂₃R₁₃R₁₂, la stessa che garantisce l\'integrabilità di modelli di meccanica statistica bidimensionali. Ne seguono invarianti di nodi e di 3-varietà e, per q radice dell\'unità, categorie di rappresentazioni con proprietà di finitezza. Nel limite q → 0 le basi canoniche diventano oggetti combinatori, i <b>cristalli</b>.' },

    { re: /geometric representation|perverse sheaves|categorification|flag variet|kazhdan.?lusztig|geometric satake|d-modules?|springer correspondence|character sheaves/i,
      tit: 'Teoria geometrica delle rappresentazioni',
      sp: 'Le rappresentazioni di un gruppo algebrico si realizzano <b>geometricamente</b>: come spazi di sezioni di fibrati sulle varietà delle bandiere, come coomologia di varietà associate, come fasci. Un dizionario tra sistemi di equazioni differenziali e fasci «perversi» traduce problemi di algebra in problemi di topologia delle singolarità; così si sono dimostrate formule per le molteplicità nelle rappresentazioni, espresse da polinomi combinatori. La <b>categorificazione</b> solleva identità tra numeri a equivalenze tra categorie: gli interi diventano dimensioni di spazi vettoriali, i polinomi diventano caratteri graduati. È un pilastro della versione geometrica del programma che collega aritmetica e analisi armonica.' },

    { re: /cluster algebras?|quivers?|tilting|representations of finite.?dimensional algebras/i,
      tit: 'Algebre a grappolo e rappresentazioni di grafi orientati',
      sp: 'Un grafo orientato con uno spazio vettoriale in ogni vertice e una mappa lineare su ogni freccia è una rappresentazione di un <b>quiver</b>. Quelli con un numero finito di rappresentazioni indecomponibili sono esattamente i diagrammi di tipo A, D, E: gli stessi che classificano le algebre semplici con radici di lunghezza uguale e le singolarità semplici delle superfici. Le <b>algebre a grappolo</b> sono generate da variabili raggruppate in «grappoli» che si trasformano per mutazione, x·x′ = monomio + monomio; sorprendentemente le formule restano sempre frazioni con soli monomi al denominatore, a coefficienti positivi. Compaiono nei gruppi quantistici, nelle superfici triangolate e nei sistemi integrabili discreti.' },

    { re: /\blie (groups?|algebras?|theory)|algebraic groups?|reductive groups?|kac.?moody|root systems?|semisimple/i,
      tit: 'Gruppi continui di simmetrie e loro algebre',
      sp: 'I gruppi continui di simmetrie — rotazioni, matrici invertibili, trasformazioni che preservano una forma — sono anche varietà lisce, e sono determinati in gran parte dalla loro <b>algebra infinitesimale</b>: lo spazio tangente all\'identità con il commutatore [X, Y] = XY − YX. Le algebre semplici complesse si classificano con i <b>sistemi di radici</b>: quattro famiglie infinite (matrici a traccia nulla, ortogonali, simplettiche) e cinque eccezionali, la più grande di dimensione 248. Le loro rappresentazioni irriducibili sono descritte dai pesi massimi. Questa teoria è ovunque: nella fisica delle particelle, nella geometria degli spazi omogenei, nella teoria dei numeri.' },

    { re: /homological algebra|derived categor|triangulated|sheaf theory|stable categor/i,
      tit: 'Algebra omologica e categorie derivate',
      sp: 'L\'algebra omologica nasce per misurare quanto una costruzione non preserva le successioni esatte: i funtori derivati, come i gruppi di estensione e la coomologia dei fasci, misurano l\'ostruzione. Le <b>categorie derivate</b> fanno un passo in più: l\'oggetto di studio non è più il singolo gruppo di coomologia ma il complesso intero, a meno di quasi-isomorfismi. Due varietà diverse possono avere la stessa categoria derivata, e le equivalenze tra categorie derivate sono diventate un linguaggio per simmetrie profonde, dalla simmetria speculare alla teoria delle rappresentazioni. Le versioni <b>potenziate</b> con strutture omotopiche fondano la geometria algebrica derivata.' },

    { re: /category theory|higher categor|infinity.?categor|∞-categor|categorical|operads?/i,
      tit: 'Teoria delle categorie e categorie superiori',
      sp: 'Una categoria è fatta di oggetti e frecce componibili; i funtori traducono tra categorie, e le trasformazioni naturali confrontano i funtori. Quello che sembra solo un linguaggio ha contenuto: il <b>lemma di rappresentabilità</b> dice che un oggetto è determinato dalle frecce che arrivano in esso, e la nozione di funtori aggiunti spiega costruzioni libere, completamenti e quozienti in ogni area. Le <b>categorie superiori</b>, con frecce tra frecce a ogni livello e composizione definita a meno di omotopia coerente, sono necessarie in topologia e in geometria algebrica derivata, dove le identità valgono solo a meno di deformazioni scelte. Gli operad descrivono operazioni con molti ingressi e le loro leggi.' },

    { re: /commutative algebra|commutative rings?|local cohomology|tight closure|local rings?|syzyg/i,
      tit: 'Algebra commutativa',
      sp: 'L\'algebra commutativa studia gli anelli commutativi e i loro ideali: è l\'algebra che sta sotto la geometria algebrica e la teoria dei numeri. Concetti come <b>dimensione</b>, profondità e regolarità hanno un significato geometrico: un anello locale regolare corrisponde a un punto liscio. Le risoluzioni libere di un modulo, cioè le relazioni tra le relazioni (sizigie), misurano la complessità di un sistema di polinomi, e sono finite esattamente sugli anelli regolari. In caratteristica p l\'endomorfismo x ↦ xᵖ è uno strumento potentissimo, che fornisce <b>chiusure</b> e criteri di singolarità con analoghi profondi in caratteristica zero.' },

    /* ── Combinatoria ───────────────────────────────────────────────────── */
    { re: /ramsey|extremal (combinatorics|graph|set|problems?)|tur[aá]n|hypergraphs?|erd[oő]s/i,
      tit: 'Combinatoria estremale e ordine inevitabile',
      sp: 'In ogni gruppo di sei persone ce ne sono tre che si conoscono a coppie o tre che non si conoscono a coppie. Più in generale, ogni colorazione con due colori dei lati di un grafo completo abbastanza grande contiene un sottografo completo di k vertici <b>monocromatico</b>: il disordine totale è impossibile. Il numero di vertici necessario cresce esponenzialmente in k, tra (√2)ᵏ e 4ᵏ, e abbassare la base 4 è stato un progresso recente. La <b>combinatoria estremale</b> chiede quanti lati può avere un grafo senza contenere una struttura data: per i triangoli la risposta è n²/4, raggiunta dal grafo bipartito completo bilanciato.' },

    { re: /graph theory|graph minors?|perfect graphs?|chromatic number|graph colou?ring|structural graph|four colou?r|expander graphs?|planar graphs?/i,
      tit: 'Teoria dei grafi',
      sp: 'Un grafo è un insieme di vertici collegati da lati: il modello di reti, mappe, molecole, interazioni. Ogni carta geografica piana si colora con <b>quattro colori</b> in modo che regioni confinanti abbiano colori diversi, con una dimostrazione assistita dal calcolatore. La teoria dei <b>minori</b> mostra che in ogni famiglia infinita di grafi uno si ottiene da un altro cancellando e contraendo lati, e quindi ogni proprietà chiusa per minori è caratterizzata da un elenco finito di ostruzioni. I grafi espansori, sparsi ma molto connessi, sono ovunque in informatica e hanno costruzioni esplicite che vengono dalla teoria dei numeri e dalle forme automorfe.' },

    { re: /enumerative combinatorics|algebraic combinatorics|symmetric functions|young tableaux|integer partitions|partition theory|combinatorial (algebra|geometry)/i,
      tit: 'Combinatoria algebrica ed enumerativa',
      sp: 'Quanti modi ci sono di scrivere n come somma di interi positivi, di disporre oggetti, di percorrere un reticolo? La combinatoria <b>enumerativa</b> risponde con le funzioni generatrici: il numero di partizioni p(n) soddisfa ∑ p(n)qⁿ = ∏ (1 − qᵏ)⁻¹ e cresce come e^{π√(2n/3)} / (4n√3). La combinatoria <b>algebrica</b> usa strutture algebriche per contare e, viceversa, numeri combinatori per descrivere strutture: le funzioni simmetriche e le tabelle di numeri disposte a scalini descrivono le rappresentazioni dei gruppi di permutazioni, la coomologia degli spazi di sottospazi e la positività dei coefficienti in molte formule.' },

    /* ── Logica e fondamenti ────────────────────────────────────────────── */
    { re: /forcing|set theory|continuum hypothesis|large cardinals?|independence (results?|proofs?)|axiom of choice|descriptive set/i,
      tit: 'Teoria degli insiemi, indipendenza e forcing',
      sp: 'Gli assiomi usuali della teoria degli insiemi non decidono tutto. L\'ipotesi del continuo — non c\'è una cardinalità strettamente compresa tra quella di ℕ e quella di ℝ — non si può né dimostrare né confutare: un risultato mostra che è coerente con gli assiomi, valendo nell\'universo degli insiemi costruibili; un altro, con il metodo del <b>forcing</b>, costruisce modelli in cui è falsa aggiungendo insiemi «generici». Il forcing è diventato uno strumento generale per provare l\'<b>indipendenza</b>. I grandi cardinali, assiomi d\'infinito sempre più forti, ordinano le teorie per forza di coerenza e decidono molte domande sugli insiemi di reali definibili.' },

    { re: /model theory|o-minimal|stability theory|definab|model-theoretic/i,
      tit: 'Teoria dei modelli',
      sp: 'La teoria dei modelli studia le strutture matematiche attraverso le <b>proprietà definibili</b> con formule del primo ordine. Il teorema di compattezza — se ogni parte finita di una teoria ha un modello, la teoria intera ne ha uno — è sorprendentemente potente. Le teorie si classificano per <b>stabilità</b>, cioè secondo quanti «tipi» di elementi ammettono; nelle teorie addomesticate, come le strutture o-minimali in cui ogni insieme definibile sulla retta è unione finita di intervalli e punti, la geometria è controllata. Ne sono venute applicazioni alla geometria aritmetica, come il conteggio dei punti razionali su insiemi trascendenti, e all\'algebra dei campi valutati.' },

    { re: /computability|recursion theory|recursive functions|decidab|incompleteness|proof theory|hilbert'?s tenth|halting problem|algorithmic randomness/i,
      tit: 'Calcolabilità, decidibilità e teoria della dimostrazione',
      sp: 'Che cosa può calcolare un procedimento meccanico? La risposta è una classe precisa di funzioni, la stessa per tutte le definizioni ragionevoli. Esistono problemi <b>indecidibili</b>: nessun algoritmo decide se un programma qualsiasi termina, e nessun algoritmo decide se un\'equazione polinomiale a coefficienti interi ha soluzioni intere. I teoremi di <b>incompletezza</b> mostrano che ogni teoria coerente e assiomatizzabile in modo calcolabile che contenga l\'aritmetica ha enunciati veri non dimostrabili, tra cui la propria coerenza. La teoria della dimostrazione misura la forza delle teorie con gli ordinali ed estrae contenuto calcolabile dalle dimostrazioni.' },

    /* ── Informatica teorica e matematica applicata ─────────────────────── */
    { re: /cryptograph|zero.?knowledge|public.?key|encryption|secure computation/i,
      tit: 'Le fondamenta della crittografia',
      sp: 'La crittografia moderna trasforma la sicurezza in un enunciato matematico: un sistema è sicuro se ogni algoritmo efficiente che lo attacca ha probabilità di successo trascurabile, <b>assumendo</b> che un problema — fattorizzare, calcolare logaritmi discreti, trovare vettori corti in un reticolo — sia difficile. Funzioni a senso unico, pseudocasualità e prove a <b>conoscenza zero</b>, che convincono qualcuno che un enunciato è vero senza rivelare nulla oltre la sua verità, sono definite rigorosamente e collegate tra loro. La crittografia a chiave pubblica permette a due sconosciuti di accordarsi su un segreto parlando in pubblico.' },

    { re: /quantum (computing|computation|computers?|information|algorithms?|error.?correct|complexity)/i,
      tit: 'Calcolo e informazione quantistica',
      sp: 'Un calcolatore quantistico manipola <b>qubit</b>, vettori unitari in ℂ², e n qubit vivono in uno spazio di dimensione 2ⁿ. Le porte logiche sono matrici unitarie, la lettura è probabilistica. Alcuni problemi diventano molto più facili: fattorizzare un intero si fa in tempo polinomiale trovando il periodo di una funzione con la trasformata in frequenze quantistica, e la ricerca in un elenco non ordinato richiede √N passi invece di N. Il rumore distrugge la coerenza, ma i codici <b>correttori quantistici</b> e un teorema di soglia mostrano che, sotto un tasso di errore costante, un calcolo arbitrariamente lungo è possibile. La teoria studia anche l\'entanglement come risorsa.' },

    { re: /computational complexity|complexity theory|p (vs\.?|versus) np|np.?complete|probabilistically checkable|\bpcp\b|interactive proofs?|derandomi[sz]|pseudorandom|circuit complexity|hardness of approximation/i,
      tit: 'Complessità computazionale',
      sp: 'Non basta che un problema sia risolubile: conta quanto tempo e quanta memoria richiede. La classe P contiene i problemi risolubili in tempo polinomiale; NP quelli in cui una soluzione proposta si <b>verifica</b> in tempo polinomiale. Se P = NP è il problema aperto centrale: migliaia di problemi pratici sono NP-completi, quindi equivalenti tra loro. Le prove <b>verificabili probabilisticamente</b> mostrano che ogni dimostrazione si può riscrivere in modo che basti leggerne pochi bit scelti a caso per controllarla, e da qui seguono limiti precisi all\'approssimabilità. La teoria esplora anche la casualità come risorsa e quando la si può eliminare.' },

    { re: /information theory|coding theory|error.?correcting|channel capacity|source coding|data compression/i,
      tit: 'Teoria dell\'informazione e codici',
      sp: 'L\'informazione si misura: una sorgente che emette simboli con probabilità pᵢ ha <b>entropia</b> H = −∑ pᵢ log₂ pᵢ bit per simbolo, e non si può comprimere sotto questo limite. Un canale rumoroso ha una <b>capacità</b> C: si può trasmettere a qualunque velocità inferiore a C con probabilità d\'errore piccola a piacere, e non oltre. La dimostrazione non è costruttiva, perché usa codici scelti a caso; trovare codici espliciti ed efficienti che si avvicinino alla capacità ha richiesto decenni, e oggi esistono. La teoria dei codici correttori usa l\'algebra sui campi finiti, la geometria algebrica delle curve e i grafi espansori.' },

    { re: /numerical analysis|finite elements?|numerical (methods|solution|linear algebra|simulation)|scientific computing|computational (mathematics|science)|multigrid|fast multipole|discreti[sz]ation/i,
      tit: 'Analisi numerica',
      sp: 'Le equazioni dei modelli reali raramente si risolvono con una formula: si risolvono al calcolatore, sostituendo il continuo con un problema finito. L\'analisi numerica dimostra quando questa approssimazione è affidabile: un metodo converge se è <b>consistente</b> e <b>stabile</b>, e gli errori di arrotondamento non devono amplificarsi. Gli elementi finiti approssimano le soluzioni con funzioni polinomiali a tratti su una maglia; i metodi multigriglia e i metodi rapidi per le interazioni a molti corpi risolvono sistemi con N incognite in un tempo quasi proporzionale a N. Questi algoritmi sono il motore dell\'ingegneria, della meteorologia e della simulazione.' },

    { re: /optimi[sz]ation|linear programming|convex programming|operations research|interior.?point/i,
      tit: 'Ottimizzazione',
      sp: 'Ottimizzare significa minimizzare una funzione f(x) sotto vincoli. Quando f e i vincoli sono <b>convessi</b>, ogni minimo locale è globale e la dualità fornisce certificati di ottimalità: il problema duale dà un limite inferiore che coincide con l\'ottimo. La programmazione lineare si risolve in tempo polinomiale con i <b>metodi a punto interno</b>, che attraversano l\'interno della regione ammissibile invece di percorrerne i vertici; la programmazione semidefinita estende il metodo alle matrici. L\'ottimizzazione combinatoria — cammini, flussi, abbinamenti — e i metodi del gradiente per problemi enormi sono alla base di logistica e apprendimento automatico.' },

    { re: /\balgorithm|analysis of algorithms|design of algorithms/i,
      tit: 'Algoritmi e la loro analisi',
      sp: 'Un algoritmo è una procedura finita e precisa; la sua analisi ne misura il costo in funzione della taglia n dell\'input. La differenza tra n log n e n² operazioni è la differenza tra secondi e anni su dati grandi. La teoria progetta algoritmi con <b>garanzie dimostrate</b>: ordinamento ottimo, cammini minimi, flussi massimi in tempo quasi lineare, test di primalità deterministici in tempo polinomiale, algoritmi <b>randomizzati</b> che sbagliano con probabilità trascurabile, algoritmi di approssimazione con rapporto garantito per i problemi NP-difficili. Gli strumenti vanno dalla combinatoria all\'algebra lineare e alla geometria degli spazi metrici.' },

    { re: /machine learning|learning theory|neural networks?|deep learning|statistical learning/i,
      tit: 'Teoria matematica dell\'apprendimento',
      sp: 'Un algoritmo di apprendimento sceglie, sulla base di esempi, una funzione da una classe di ipotesi. Perché funzioni su dati nuovi, l\'errore sul campione deve essere vicino all\'errore vero: la teoria lo garantisce quando la classe ha <b>capacità</b> finita, misurata da una dimensione combinatoria, con un numero di esempi proporzionale a quella dimensione. Le <b>reti neurali</b> profonde sfidano questo schema: hanno più parametri che dati, interpolano esattamente il campione e tuttavia generalizzano. Spiegarlo richiede di studiare la geometria dell\'ottimizzazione con il gradiente, le regolarità implicite dell\'algoritmo e i limiti di larghezza infinita, dove le reti diventano processi aleatori.' },

    /* ── Fisica matematica ──────────────────────────────────────────────── */
    { re: /string theory|superstring|conformal field theor|topological (quantum )?field theor|supersymmetr|m-theory/i,
      tit: 'Teoria delle stringhe e teorie di campo topologiche',
      sp: 'La teoria delle stringhe sostituisce le particelle puntiformi con piccoli oggetti unidimensionali; la coerenza quantistica richiede dimensioni extra, compattificate su varietà complesse speciali. Per la matematica è stata una fonte di <b>previsioni</b>: numeri di curve su varietà, dualità tra spazi diversi, invarianti di nodi e di varietà. Le <b>teorie di campo topologiche</b> sono funtori che assegnano a una varietà uno spazio vettoriale e a un cobordismo un\'applicazione lineare: formalizzano le parti della fisica che non dipendono dalla metrica e producono invarianti calcolabili. Le teorie di campo conformi bidimensionali hanno una ricca struttura algebrica, le algebre di vertice.' },

    { re: /quantum field theor|constructive field|renormali[sz]ation|path integrals?|quantum electrodynamics/i,
      tit: 'Teoria quantistica dei campi',
      sp: 'La teoria quantistica dei campi descrive le particelle elementari come eccitazioni di campi, e le sue previsioni sono le più precise della fisica. Matematicamente è in gran parte non fondata: gli integrali sui cammini, ∫ e^{iS[φ]} Dφ, non hanno una misura sottostante, e i calcoli perturbativi producono infiniti da sottrarre con la <b>rinormalizzazione</b>. La teoria costruttiva costruisce rigorosamente modelli in dimensione 2 e 3; in dimensione 4 nessuna teoria interagente è stata costruita, e dimostrare l\'esistenza di una teoria di gauge quantistica con un <b>salto di massa</b> è un problema aperto. La struttura algebrica della rinormalizzazione è stata chiarita con algebre di grafi.' },

    { re: /general relativity|einstein (field )?equations?|black holes?|positive (mass|energy)|spacetimes?|lorentzian|cosmic censorship/i,
      tit: 'Matematica della relatività generale',
      sp: 'Nella relatività generale lo spazio-tempo è una varietà quadridimensionale con una metrica di segnatura (−, +, +, +), e le equazioni di campo legano la curvatura alla distribuzione di materia ed energia. Sono un sistema iperbolico non lineare: i dati iniziali determinano l\'evoluzione. Le domande matematiche: lo spazio-tempo vuoto e piatto è <b>stabile</b> per piccole perturbazioni? Sì; per i buchi neri rotanti la questione è oggetto di ricerca intensa. I dati generici producono singolarità nascoste dietro un orizzonte (<b>censura cosmica</b>)? E il teorema della massa positiva: la massa totale di un sistema isolato con densità d\'energia non negativa è ≥ 0, e nulla solo per lo spazio vuoto.' },

    { re: /statistical (mechanics|physics)|thermodynamic limit|exactly solv/i,
      tit: 'Meccanica statistica rigorosa',
      sp: 'La meccanica statistica spiega il comportamento macroscopico — pressione, magnetizzazione, transizioni di fase — a partire da moltissimi costituenti microscopici. Matematicamente, uno stato di equilibrio è una <b>misura di probabilità</b> sulle configurazioni, proporzionale a e^{−βH}, e il problema centrale è il <b>limite termodinamico</b>: che cosa succede quando il volume tende all\'infinito. Si studiano l\'esistenza e l\'unicità dei limiti, le transizioni di fase come punti di non analiticità dell\'energia libera, i modelli risolubili esattamente, e i sistemi fuori equilibrio, il cui comportamento a grande scala è descritto da equazioni idrodinamiche.' },

    /* ── Matematica applicata ai giochi, al controllo, alla vita ────────── */
    { re: /game theory|\bgames\b|mathematical economics|economics|nash equilibri|mechanism design|auction theory|general equilibrium|social choice|bargaining/i,
      tit: 'Teoria dei giochi ed economia matematica',
      sp: 'Un gioco è un modello di decisori razionali le cui scelte interagiscono. Un <b>equilibrio</b> è un profilo di strategie in cui nessuno ha interesse a deviare da solo; con le strategie miste ogni gioco finito ne ha almeno uno, per un teorema di punto fisso. Nei giochi a somma zero tra due giocatori vale il teorema del minimax: max min = min max. La teoria si estende ai giochi ripetuti, ai giochi con informazione incompleta, alla progettazione di <b>meccanismi</b> e aste che inducono a dire la verità, e all\'equilibrio economico generale, la cui esistenza è anch\'essa un teorema di punto fisso. Calcolare un equilibrio, però, è spesso difficile.' },

    { re: /control theory|optimal control|controllability|feedback|stabili[sz]ation|filtering theory|kalman/i,
      tit: 'Teoria del controllo',
      sp: 'Un sistema dx/dt = f(x, u) evolve sotto l\'azione di un <b>controllo</b> u scelto da noi: la spinta di un razzo, l\'apertura di una valvola. Le domande sono se si può portare il sistema da uno stato qualunque a un altro (controllabilità); come farlo minimizzando un costo — il <b>principio del massimo</b> dà condizioni necessarie, la programmazione dinamica un\'equazione per la funzione valore —; e come stabilizzarlo con una retroazione che dipende solo dallo stato osservato. Per sistemi rumorosi si combina con il filtraggio, la stima ottima dello stato da misure imprecise. È la matematica dell\'automazione e dell\'ingegneria aerospaziale.' },

    { re: /mathematical biology|biomathematics|population (dynamics|genetics)|epidemiolog|morphogenesis|neuroscience/i,
      tit: 'Biologia matematica',
      sp: 'La biologia matematica descrive popolazioni, epidemie, geni, cellule e neuroni con equazioni. Nei modelli epidemici a compartimenti il <b>numero di riproduzione</b> R₀ separa due comportamenti: se R₀ < 1 l\'infezione si estingue, se R₀ > 1 cresce e poi si stabilizza. Equazioni di reazione-diffusione spiegano come una sostanza che si attiva e una che la inibisce, diffondendo a velocità diverse, generino spontaneamente macchie e strisce: la <b>morfogenesi</b>. La genetica delle popolazioni usa processi aleatori per descrivere deriva e selezione; le reti di neuroni sono sistemi dinamici di grande dimensione, con soglie e ritardi.' },

    { re: /mathematical statistics|\bstatistics\b|statistical (inference|theory)|bootstrap|estimation|nonparametric/i,
      tit: 'Statistica matematica',
      sp: 'La statistica matematica studia come trarre conclusioni affidabili da dati aleatori. Uno stimatore è una funzione dei dati: si chiede che sia <b>consistente</b>, che la sua varianza sia vicina al limite inferiore teorico, che gli intervalli di confidenza abbiano la copertura dichiarata. In alta dimensione, con più parametri che osservazioni, servono ipotesi di struttura — sparsità, basso rango — e la teoria della <b>concentrazione</b> della misura. Metodi che ricampionano i dati stessi permettono di stimare l\'incertezza senza formule esplicite. La statistica fornisce i fondamenti teorici dell\'inferenza scientifica e dell\'apprendimento automatico.' },

    /* ── Voci di ripiego per i grandi campi ──────────────────────────────
       Stanno in fondo: combaciano con le etichette generiche («topology»,
       «number theory»...) solo se nessuna voce specifica ha combaciato. */
    { re: /dynamical systems?|\bchaos\b|chaotic|strange attractors?|bifurcation|smooth dynamics|hyperbolic dynamics|ordinary differential equations/i,
      tit: 'Sistemi dinamici e caos',
      sp: 'Un sistema dinamico è una regola che fa evolvere uno stato nel tempo: un\'equazione differenziale dx/dt = F(x) o un\'iterazione x ↦ f(x). Anche regole semplici producono comportamento <b>caotico</b>: sensibilità alle condizioni iniziali, con errori che crescono esponenzialmente, e attrattori frattali. Il modello del caos è il «ferro di cavallo», una mappa che stira e ripiega lo spazio e contiene infinite orbite periodiche. I sistemi <b>iperbolici</b>, in cui ogni direzione si contrae o si espande uniformemente, sono strutturalmente stabili e ben compresi; la teoria studia quanto sono tipici, come avvengono le biforcazioni e quali proprietà statistiche hanno le orbite.' },

    { re: /partial differential equations?|\bpdes?\b|differential equations/i,
      tit: 'Equazioni alle derivate parziali',
      sp: 'Quasi tutte le leggi della fisica sono <b>equazioni alle derivate parziali</b>: legano le variazioni di una grandezza nello spazio e nel tempo. Si dividono in tipi: ellittiche, che descrivono l\'equilibrio, come Δu = f; paraboliche, che descrivono la diffusione, come l\'equazione del calore ∂ₜu = Δu; iperboliche, che descrivono la propagazione, come l\'equazione delle onde ∂ₜ²u = Δu. Le domande fondamentali sono se il problema è <b>ben posto</b> — esistenza, unicità e dipendenza continua dai dati — e quanto sono regolari le soluzioni. Per le equazioni non lineari si usano spazi di funzioni con derivate deboli, stime a priori, metodi variazionali e di punto fisso.' },

    { re: /representation theory|representations? of/i,
      tit: 'Teoria delle rappresentazioni',
      sp: 'Rappresentare un gruppo significa farlo agire come <b>matrici</b> su uno spazio vettoriale: ogni elemento diventa una trasformazione lineare, rispettando la moltiplicazione. Così un problema astratto diventa algebra lineare. Ogni rappresentazione complessa di un gruppo finito si scompone in irriducibili, che sono tante quante le classi di coniugio, e sono determinate dai loro <b>caratteri</b>, le tracce delle matrici. Per gruppi infiniti, gruppi continui, algebre e grafi orientati la teoria è molto più ricca e si intreccia con l\'analisi armonica e la geometria. Le rappresentazioni sono il linguaggio delle simmetrie in fisica quantistica, in chimica e in teoria dei numeri.' },

    { re: /arithmetic geometry|arithmetic algebraic geometry|diophantine geometry|number theory[\s\S]*algebraic geometry|algebraic geometry[\s\S]*number theory/i,
      tit: 'Geometria aritmetica',
      sp: 'La geometria aritmetica studia le equazioni polinomiali a coefficienti interi con gli strumenti della geometria algebrica. La stessa equazione definisce una varietà sui complessi, su ogni campo finito e sui numeri p-adici, e queste incarnazioni si parlano: il numero di soluzioni modulo p, la <b>coomologia</b> della varietà complessa e l\'esistenza di soluzioni razionali sono legati da teoremi e congetture profonde. Le <b>funzioni L</b>, che raccolgono i conteggi modulo ogni primo in un\'unica funzione analitica, ne sono l\'oggetto centrale. È il terreno su cui si sono risolti molti dei grandi problemi classici dell\'aritmetica.' },

    { re: /algebraic geometry|algebraic variet|algebraic curves?|algebraic surfaces?|projective variet/i,
      tit: 'Geometria algebrica',
      sp: 'La geometria algebrica studia gli insiemi di soluzioni di sistemi di equazioni polinomiali, le <b>varietà algebriche</b>: curve, superfici e loro analoghi in dimensione qualunque. Il suo punto di forza è il doppio linguaggio: ogni varietà ha un anello di funzioni, e le proprietà geometriche — dimensione, singolarità, irriducibilità — si traducono in proprietà algebriche. Una curva piana proiettiva liscia di grado d ha genere (d−1)(d−2)/2, il numero di buchi della superficie reale associata. Gli strumenti moderni — fasci, coomologia, <b>spazi di moduli</b> — ne fanno un linguaggio comune per teoria dei numeri, topologia e fisica.' },

    { re: /number theory|theory of numbers|\barithmetic\b/i,
      tit: 'Teoria dei numeri',
      sp: 'La teoria dei numeri studia gli interi e le loro generalizzazioni: divisibilità, numeri primi, equazioni da risolvere in interi o razionali. I problemi sono spesso semplici da enunciare e profondissimi da risolvere: ogni intero positivo è somma di quattro quadrati; i primi sono infiniti; ci sono infinite coppie di primi a distanza 2? Gli strumenti moderni vengono da tutta la matematica: l\'<b>analisi</b> per la distribuzione dei primi, l\'<b>algebra</b> per le estensioni dei razionali, la geometria per le equazioni, le forme modulari per le simmetrie nascoste. È anche il fondamento della crittografia che protegge le comunicazioni.' },

    { re: /differential geometry|geometric analysis|global analysis|\bmanifolds?\b/i,
      tit: 'Geometria differenziale',
      sp: 'La geometria differenziale studia le <b>varietà</b>, spazi che localmente somigliano a ℝⁿ, con gli strumenti del calcolo: vettori tangenti, forme differenziali, connessioni, curvatura. Per una superficie, il prodotto delle curvature principali, la curvatura totale, è intrinseco: non cambia piegando la superficie senza stirarla, e il suo integrale su una superficie chiusa vale 2π(2 − 2g), dove g è il numero di buchi. Questa interazione tra <b>locale e globale</b>, tra curvatura e topologia, attraversa tutta la disciplina, dalla relatività generale alle teorie di gauge. L\'analisi geometrica la studia con le equazioni alle derivate parziali.' },

    { re: /algebraic topology|homology|cohomology|fundamental group/i,
      tit: 'Topologia algebrica',
      sp: 'La topologia algebrica associa agli spazi oggetti algebrici <b>invarianti</b> per deformazione: il gruppo fondamentale, che registra gli anelli non contraibili; i gruppi di omologia, che contano i «buchi» di ogni dimensione; la coomologia, che ha in più un prodotto. Se gli invarianti di due spazi differiscono, gli spazi non sono equivalenti. Ne vengono teoremi come quello del punto fisso — ogni mappa continua di un disco in sé ha un punto fisso — o l\'impossibilità di pettinare una sfera senza creare un vortice. La disciplina fornisce strumenti a tutta la matematica, dalla geometria algebrica all\'analisi dei dati.' },

    { re: /\btopology\b|topological/i,
      tit: 'Topologia',
      sp: 'La topologia studia le proprietà che restano invariate sotto deformazioni continue: per un topologo una tazza e una ciambella sono la stessa cosa, perché entrambe hanno <b>un solo buco</b>. Le nozioni di base — aperto, continuità, compattezza, connessione — sono il linguaggio di tutta l\'analisi. La topologia delle <b>varietà</b> classifica gli spazi che localmente somigliano a ℝⁿ: in dimensione 2 basta il genere; in dimensione 3 decide la geometria; in dimensione ≥ 5 l\'algebra e la chirurgia risolvono molto; la dimensione 4 è la più difficile. Gli strumenti spaziano dall\'algebra alla geometria e alla fisica.' },

    { re: /probability|stochastic|\brandom/i,
      tit: 'Teoria della probabilità',
      sp: 'La teoria della probabilità, fondata sulla teoria della misura, descrive il caso con rigore: uno spazio di eventi, una misura di massa totale 1, le variabili aleatorie come funzioni misurabili. I teoremi limite ne sono il cuore: la <b>legge dei grandi numeri</b>, per cui le medie convergono al valore atteso, e il <b>limite centrale</b>, per cui le fluttuazioni riscalate per √n diventano normali qualunque sia la distribuzione di partenza. La probabilità moderna studia processi, cammini aleatori, campi casuali, modelli su reticolo e strutture geometriche aleatorie, e fornisce strumenti all\'analisi, alla combinatoria e alla teoria dei numeri.' },

    { re: /combinatori|discrete mathematics/i,
      tit: 'Combinatoria',
      sp: 'La combinatoria studia le strutture finite — insiemi, grafi, permutazioni, configurazioni — e le domande di esistenza, conteggio e ottimizzazione che le riguardano. Molti problemi si enunciano in una riga e resistono per decenni. Il campo è cambiato quando vi sono entrati strumenti profondi: la <b>probabilità</b>, per dimostrare l\'esistenza scegliendo a caso; l\'algebra lineare e il metodo polinomiale, per cui un polinomio di grado basso non può annullarsi su troppi punti; l\'analisi armonica; la topologia. Viceversa, idee combinatorie sono diventate centrali in teoria dei numeri, in <b>informatica</b> e in geometria.' },

    { re: /\blogic\b|mathematical logic|foundations of mathematics|set-theoretic/i,
      tit: 'Logica matematica',
      sp: 'La logica matematica studia il ragionamento matematico come oggetto matematico: i <b>linguaggi formali</b>, le dimostrazioni come successioni finite di formule, i modelli come strutture in cui le formule sono vere o false. Il teorema di completezza dice che un enunciato del primo ordine è dimostrabile se e solo se è vero in tutti i modelli; i teoremi di incompletezza mostrano i limiti di ogni sistema assiomatico abbastanza ricco. Le sue quattro branche — teoria degli insiemi, dei modelli, della calcolabilità e della dimostrazione — hanno applicazioni in algebra, in geometria e in <b>informatica</b>.' },

    { re: /theoretical computer science|computer science|theory of computation|\bcomputation\b|computing/i,
      tit: 'Informatica teorica',
      sp: 'L\'informatica teorica studia che cosa si può calcolare e a quale costo. Definisce modelli di calcolo, misura le risorse — tempo, memoria, casualità, comunicazione — e classifica i problemi secondo quanto ne richiedono. Ha prodotto algoritmi che sono ovunque, la teoria della <b>complessità</b> con le sue grandi domande aperte, le basi rigorose della crittografia, la teoria dell\'apprendimento e del calcolo distribuito. E ha restituito alla matematica problemi e idee: la pseudocasualità, le <b>prove interattive</b> e verificabili probabilisticamente, i grafi espansori, i metodi algoritmici in combinatoria.' },

    { re: /mathematical physics|theoretical physics|quantum mechanics|\bphysics\b/i,
      tit: 'Fisica matematica',
      sp: 'La fisica matematica dà fondamenta rigorose alle teorie fisiche e ne estrae nuova matematica. Riguarda la meccanica classica, con i sistemi dotati di simmetrie e la stabilità del moto; la <b>meccanica quantistica</b>, con gli operatori sugli spazi di funzioni, gli spettri, la stabilità della materia; la meccanica statistica e le transizioni di fase; la relatività e le teorie di campo. Il flusso va nei due sensi: dalla fisica vengono congetture sorprendenti sui nodi, sui conteggi di curve, sulle forme modulari, che i matematici dimostrano; dalla matematica vengono strumenti, come la <b>geometria</b> dei fibrati che descrive le forze fondamentali.' },

    { re: /applied mathematics|mathematical model(l)?ing|engineering mathematics/i,
      tit: 'Matematica applicata',
      sp: 'La matematica applicata costruisce e analizza modelli di fenomeni reali: fluidi, materiali, popolazioni, epidemie, mercati, segnali, reti. Il ciclo è sempre lo stesso: formulare un modello, spesso fatto di <b>equazioni differenziali</b> o di processi aleatori; analizzarlo — esistenza, stabilità, comportamento asintotico, separazione delle scale —; simularlo al calcolatore e confrontarlo con i dati. Le tecniche asintotiche e perturbative estraggono il comportamento essenziale quando un parametro è piccolo. Molte teorie astratte, dall\'analisi armonica all\'<b>ottimizzazione</b>, sono nate da qui e qui tornano come strumenti.' },

    { re: /mathematical analysis|real analysis|measure theory|integration theory/i,
      tit: 'Analisi matematica',
      sp: 'L\'analisi matematica è lo studio rigoroso del limite: continuità, derivate, integrali, serie, e gli spazi di funzioni in cui questi concetti vivono. La teoria della <b>misura</b> estende l\'integrale a funzioni molto irregolari e rende possibile scambiare limiti e integrali sotto ipotesi semplici. Le sue ramificazioni — equazioni differenziali, analisi armonica, analisi funzionale, analisi complessa — sono il linguaggio della fisica e di gran parte della matematica applicata. Il mestiere dell\'analista è la <b>stima</b>: controllare in modo quantitativo una grandezza difficile con una più semplice, perdendo il meno possibile.' },

    { re: /\balgebras?\b|abstract algebra|group theory|ring theory|galois theory/i,
      tit: 'Algebra',
      sp: 'L\'algebra studia le strutture definite da operazioni e leggi: <b>gruppi</b>, che descrivono le simmetrie; anelli e campi, dove si somma e si moltiplica; moduli e spazi vettoriali. Il punto di vista è assiomatico: un teorema dimostrato per i gruppi vale per ogni gruppo, dalle rotazioni del cubo alle permutazioni di un mazzo di carte. Un risultato classico è che le equazioni polinomiali di grado ≥ 5 non si risolvono in generale per radicali, perché il loro <b>gruppo di simmetrie</b> non è risolubile. L\'algebra moderna fornisce il linguaggio di quasi tutta la matematica, dalla topologia ai gruppi di omologia, fino alla teoria dei numeri.' },

    { re: /geometry|geometric/i,
      tit: 'Geometria',
      sp: 'La geometria studia forme e spazi attraverso le loro <b>simmetrie</b> e i loro invarianti. Dalla geometria del piano si è passati alle geometrie non piatte, sferica e iperbolica; alla geometria differenziale degli spazi curvi; alla geometria algebrica delle soluzioni di polinomi; alla geometria simplettica della meccanica; alle geometrie discrete e combinatorie. L\'idea di classificare le geometrie tramite il loro <b>gruppo di trasformazioni</b> resta una guida: ciò che conta di uno spazio è ciò che le trasformazioni ammesse preservano. La geometria è oggi l\'arena in cui si incontrano quasi tutte le altre discipline matematiche.' }
  ];

  /* ── l'abbinamento ──────────────────────────────────────────────────────
     Si confronta il testo (motivazione + campi di lavoro) con le espressioni
     regolari. La prima che combacia vince, e se nessuna combacia non si
     mostra niente: meglio una spiegazione mancante che una sbagliata. */
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

  globale.BSIPremiMatematicaSpiegazioni = {
    ARGOMENTI: ARGOMENTI,
    perMotivazione: perMotivazione,
    quante: ARGOMENTI.length,
    versione: '1.0'
  };

})(typeof window !== 'undefined' ? window : globalThis);
