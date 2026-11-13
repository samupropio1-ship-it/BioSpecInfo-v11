/* bsi-teoria-e.js — teoria delle sezioni (lotto E). BioSpecInfo · © Samuele Pio Provenzano */
(function (g) {
  'use strict';
  var T = g.BSITeoriaDati = g.BSITeoriaDati || {};

  /* ── smatbasi ─────────────────────────────────────────────────────────── */
  T['smatbasi'] = {
    titolo: "Numeri delle misure, potenze, logaritmi ed equazioni",
    sintesi: "Un numero che viene da una misura porta con sé la propria incertezza, e le cifre significative sono il modo più semplice di dichiararla. Su questi numeri si lavora con potenze e logaritmi, che trasformano prodotti in somme e rendono maneggevoli grandezze che variano su molti ordini di grandezza, come la concentrazione degli ioni idrogeno. Le equazioni, dalla retta al polinomio di grado qualsiasi fino alla generica f(x) = 0, si risolvono in forma chiusa quando si può e numericamente quando non si può.",
    paragrafi: [
      { titolo: "Cifre significative e arrotondamento",
        testo: "Le cifre significative di un numero sono tutte le cifre a partire dalla prima diversa da zero: in 0,00420 sono tre (4, 2 e lo zero finale, che dichiara che la misura è stata letta fino ai centomillesimi), mentre gli zeri iniziali servono solo a posizionare la virgola. Gli zeri finali di un intero senza virgola, come in 1500, sono ambigui: la notazione scientifica 1,5·10³ oppure 1,500·10³ toglie l'ambiguità, ed è per questo che la sezione la segnala. Nei calcoli con le misure valgono due regole pratiche, che sono convenzioni e non teoremi: nei prodotti e nei quozienti il risultato si arrotonda al minor numero di cifre significative dei fattori, nelle somme e nelle differenze al minor numero di decimali. Sono approssimazioni grossolane della propagazione delle incertezze, che si tratta in modo corretto con le derivate parziali; conviene conservare almeno una cifra in più nei passaggi intermedi e arrotondare solo alla fine." },
      { titolo: "Potenze e logaritmi",
        testo: "Per una base a > 0 le potenze soddisfano aˣ·aʸ = aˣ⁺ʸ, (aˣ)ʸ = aˣʸ e a⁻ˣ = 1/aˣ, e per a ≠ 1 la funzione x ↦ aˣ è una biiezione di ℝ su (0, +∞). La sua inversa è il logaritmo in base a: logₐ y è l'unico x con aˣ = y, ed è definito solo per y > 0. Dalle proprietà delle potenze seguono quelle dei logaritmi, log(xy) = log x + log y, log(x/y) = log x − log y, log(xᵏ) = k·log x, valide per x, y positivi, e il cambio di base logₐ x = ln x / ln a. Il logaritmo decimale di un numero in notazione scientifica m·10ⁿ con 1 ≤ m < 10 è n + log m: la parte intera, detta caratteristica, dice solo l'ordine di grandezza, mentre la parte decimale, la mantissa, porta l'informazione sulle cifre di m." },
      { titolo: "Il pH e le cifre del logaritmo",
        testo: "Il pH è definito come −log₁₀ dell'attività degli ioni idrogeno; in soluzioni diluite si approssima con −log₁₀[H⁺], con la concentrazione espressa in mol/L. Poiché la parte intera del logaritmo dipende solo dalla potenza di dieci, le cifre significative della concentrazione diventano i decimali del pH: [H⁺] = 3,2·10⁻⁴ mol/L, con due cifre significative, dà pH = 3,49, con due decimali, e non 3,4949. La regola si giustifica con il differenziale: d(log₁₀ x) = dx/(x·ln 10) ≈ 0,434·dx/x, cioè l'incertezza assoluta del logaritmo è proporzionale all'incertezza relativa del numero, e un'incertezza relativa di qualche per cento si traduce in un'incertezza sul secondo decimale del pH." },
      { titolo: "Equazioni di primo e secondo grado",
        testo: "L'equazione ax + b = 0 con a ≠ 0 ha l'unica soluzione x = −b/a. Per ax² + bx + c = 0 con a ≠ 0, completando il quadrato si ottiene la formula risolutiva con il discriminante Δ = b² − 4ac: due radici reali distinte se Δ > 0, una radice doppia se Δ = 0, due radici complesse coniugate se Δ < 0 e i coefficienti sono reali. In chimica il caso tipico è l'acido debole: con concentrazione analitica C e costante Kₐ, trascurando l'autoprotolisi dell'acqua, la concentrazione x = [H⁺] soddisfa x²/(C − x) = Kₐ, equazione fratta che, moltiplicata per C − x (lecito perché la soluzione fisica ha 0 < x < C), diventa x² + Kₐx − KₐC = 0. Delle due radici si tiene quella positiva; l'approssimazione x ≈ √(KₐC) vale quando x è piccolo rispetto a C." },
      { titolo: "Polinomi di grado qualsiasi e f(x) = 0",
        testo: "Il teorema fondamentale dell'algebra afferma che un polinomio di grado n ≥ 1 a coefficienti complessi ha esattamente n radici in ℂ, contate con la loro molteplicità; se i coefficienti sono reali, le radici non reali compaiono in coppie coniugate. Per n ≥ 5 non esiste in generale una formula per radicali (teorema di Abel–Ruffini), e le radici si calcolano numericamente. La sezione usa il metodo di Durand–Kerner, che aggiorna simultaneamente n approssimazioni con zᵢ ← zᵢ − p(zᵢ)/(aₙ·Πⱼ≠ᵢ(zᵢ − zⱼ)): vicino a radici semplici converge quadraticamente, mentre la convergenza globale da qualunque punto di partenza è osservata in pratica ma non garantita da un teorema generale, e con radici multiple diventa lenta. Per una funzione qualsiasi si ricorre a bisezione o Newton, il cui fondamento è il teorema degli zeri di Bolzano." }
    ],
    formule: [
      ["x₁,₂ = (−b ± √Δ)/(2a),  Δ = b² − 4ac", "radici di ax² + bx + c = 0 con a ≠ 0; reali e distinte se Δ > 0, coincidenti se Δ = 0, complesse coniugate se Δ < 0 con coefficienti reali"],
      ["logₐ(xy) = logₐ x + logₐ y,  logₐ(xᵏ) = k·logₐ x", "proprietà dei logaritmi, per a > 0, a ≠ 1 e x, y > 0"],
      ["logₐ x = ln x / ln a", "cambio di base, per a > 0, a ≠ 1, x > 0"],
      ["pH = −log₁₀ a(H⁺) ≈ −log₁₀[H⁺]", "definizione del pH; l'approssimazione con la concentrazione vale in soluzioni diluite"],
      ["Δ(log₁₀ x) ≈ 0,434·Δx/x", "l'incertezza assoluta del logaritmo è circa 0,434 volte l'incertezza relativa dell'argomento, per Δx piccolo rispetto a x"]
    ],
    ipotesi: [
      "Le regole delle cifre significative sono convenzioni pratiche: non sostituiscono la propagazione delle incertezze.",
      "Il logaritmo reale è definito solo per argomenti strettamente positivi; la base deve essere positiva e diversa da 1.",
      "La formula del secondo grado richiede a ≠ 0; per a = 0 l'equazione è di primo grado.",
      "Il teorema fondamentale dell'algebra vale in ℂ, non in ℝ: un polinomio reale può non avere radici reali.",
      "Il modello dell'acido debole trascura l'autoprotolisi dell'acqua e usa concentrazioni al posto delle attività."
    ],
    errori: [
      "Scrivere pH = 3,4949 da una concentrazione nota a due cifre significative: i decimali del pH devono essere tanti quante le cifre significative della concentrazione.",
      "Applicare log(x + y) = log x + log y: la proprietà riguarda il prodotto, non la somma.",
      "Moltiplicare un'equazione fratta per un'espressione che può annullarsi senza controllare poi che le soluzioni trovate stiano nel dominio.",
      "Tenere tutte le cifre del display della calcolatrice nel risultato finale, dichiarando una precisione che la misura non ha."
    ],
    esempio: {
      testo: "Calcolare [H⁺] e il pH di una soluzione di acido acetico con C = 0,100 mol/L e Kₐ = 1,8·10⁻⁵. Si scrive x²/(0,100 − x) = 1,8·10⁻⁵, cioè x² + 1,8·10⁻⁵·x − 1,8·10⁻⁶ = 0. Il discriminante è Δ = (1,8·10⁻⁵)² + 4·1,8·10⁻⁶ ≈ 7,2·10⁻⁶ e la radice positiva è x = (−1,8·10⁻⁵ + √Δ)/2 ≈ 1,33·10⁻³ mol/L. L'approssimazione √(KₐC) darebbe 1,34·10⁻³, con un errore inferiore all'1 %. Con due cifre significative su Kₐ, il pH va scritto con due decimali.",
      risultato: "[H⁺] ≈ 1,3·10⁻³ mol/L, pH ≈ 2,88"
    },
    fonti: [
      "Harris, Quantitative Chemical Analysis, W. H. Freeman, 9ª ed., cap. 3 (Experimental Error) e cap. 9 (Monoprotic Acid-Base Equilibria)",
      "Bramanti, Pagani, Salsa, Analisi matematica 1, Zanichelli, cap. 1 (numeri reali e complessi) e funzioni elementari",
      "Taylor, An Introduction to Error Analysis, University Science Books, 2ª ed., cap. 2–3",
      "Burden, Faires, Numerical Analysis, Cengage, cap. 2 (Solutions of Equations in One Variable)"
    ],
    collegamenti: ['smatfunz', 'smatnum', 'smatstat', 'spka', 'sbuffer']
  };

  /* ── smatfunz ─────────────────────────────────────────────────────────── */
  T['smatfunz'] = {
    titolo: "Lo studio di funzione e le trasformazioni dei grafici",
    sintesi: "Studiare una funzione reale di variabile reale vuol dire ricostruirne il grafico da poche informazioni rigorose: dominio, zeri e segno, limiti agli estremi e asintoti, intervalli di monotonia dalla derivata prima, concavità e flessi dalla derivata seconda. Le famiglie di funzioni elementari, trasformate con y = a·f(b(x − c)) + d, mostrano come quattro parametri dilatano, riflettono e traslano un grafico noto.",
    paragrafi: [
      { titolo: "Dominio, zeri, segno e limiti",
        testo: "Il primo passo è il dominio naturale, l'insieme dei reali in cui l'espressione ha senso: denominatori diversi da zero, argomenti dei logaritmi positivi, radicandi delle radici di indice pari non negativi. Poi si cercano gli zeri e il segno, che dicono dove il grafico sta sopra o sotto l'asse delle ascisse. I limiti agli estremi del dominio danno gli asintoti. Se in un punto x₀ di accumulazione del dominio almeno uno dei limiti laterali di f è infinito, la retta x = x₀ è un asintoto verticale. Se f(x) → ℓ finito per x → +∞, la retta y = ℓ è un asintoto orizzontale. Se invece f(x)/x → m finito e non nullo e f(x) − mx → q finito, la retta y = mx + q è un asintoto obliquo; le due verifiche vanno fatte separatamente a +∞ e a −∞." },
      { titolo: "Derivata prima e monotonia",
        testo: "Se f è continua su un intervallo I e derivabile nei punti interni, e f′ > 0 all'interno di I, allora f è strettamente crescente su I; con f′ < 0 è strettamente decrescente. È una conseguenza del teorema di Lagrange e vale su intervalli, non su unioni di intervalli: 1/x ha derivata negativa ovunque ma non è decrescente sul suo dominio. Per il teorema di Fermat, se x₀ è un punto interno di estremo locale e f è derivabile in x₀, allora f′(x₀) = 0; il viceversa è falso, come mostra x³ in 0. Per questo i punti critici vanno classificati guardando il segno di f′ a sinistra e a destra, che è ciò che fa la sezione: dal più al meno si ha un massimo, dal meno al più un minimo, senza cambio di segno nessun estremo. Restano da esaminare a parte gli estremi dell'intervallo e i punti in cui f non è derivabile." },
      { titolo: "Derivata seconda, concavità e flessi",
        testo: "Una funzione derivabile su un intervallo è convessa se il suo grafico sta sopra ogni retta tangente; se f è derivabile due volte, la convessità equivale a f″ ≥ 0 sull'intervallo, la concavità a f″ ≤ 0. Un punto di flesso è un punto in cui f è continua, il grafico ha retta tangente e la concavità cambia. La condizione f″(x₀) = 0 è necessaria per un flesso quando f″ esiste ed è continua in x₀, ma non è sufficiente: x⁴ ha f″(0) = 0 e in 0 ha un minimo, non un flesso. Il criterio corretto richiede il cambio di segno di f″. La derivata seconda serve anche a classificare un punto critico: se f′(x₀) = 0 e f″(x₀) > 0 è un minimo locale stretto, se f″(x₀) < 0 un massimo; se f″(x₀) = 0 il test non dice nulla." },
      { titolo: "Il calcolo che fa la sezione",
        testo: "La sezione deriva f in modo simbolico, poi cerca numericamente gli zeri di f, f′ e f″ su una griglia fitta dell'intervallo scelto, affinandoli dove cambiano segno, e stima gli asintoti verticali dove |f| cresce senza limite. È importante capire che cosa questo garantisce e che cosa no. Un campionamento numerico vede solo l'intervallo disegnato e può non accorgersi di zeri doppi, in cui la funzione tocca l'asse senza attraversarlo, o di fenomeni più fini del passo della griglia. Lo studio a mano resta quindi la verifica di riferimento: il grafico al calcolatore è una guida e un controllo, non una dimostrazione. La retta tangente che segue il cursore, y = f(x₀) + f′(x₀)(x − x₀), è l'approssimazione lineare di f vicino a x₀." },
      { titolo: "Famiglie e trasformazioni",
        testo: "Data una funzione nota f, il grafico di y = a·f(b(x − c)) + d si ottiene da quello di f con trasformazioni elementari. Il parametro c trasla orizzontalmente di c, d trasla verticalmente di d; a dilata verticalmente di un fattore |a| e, se a < 0, riflette rispetto all'asse x; b, con b ≠ 0, comprime orizzontalmente di un fattore |b| e, se b < 0, riflette rispetto all'asse y. L'ordine conta: nella forma scritta qui la traslazione c agisce dopo la dilatazione, cioè il punto x₀ del grafico originale va in c + x₀/b. Per una sinusoide a·sin(b(x − c)) + d i parametri sono ampiezza |a|, periodo 2π/|b|, sfasamento c e valore medio d; per la logistica K/(1 + e^(−r(x − x₀))) sono la capacità K, il tasso r e il punto di flesso x₀." }
    ],
    formule: [
      ["m = lim f(x)/x,  q = lim (f(x) − m·x)  per x → ±∞", "coefficienti dell'asintoto obliquo y = mx + q, se entrambi i limiti esistono finiti e m ≠ 0"],
      ["f′(x₀) = 0 e f″(x₀) > 0 ⇒ minimo locale stretto", "test della derivata seconda, con f derivabile due volte in x₀; se f″(x₀) = 0 il test non decide"],
      ["y = f(x₀) + f′(x₀)·(x − x₀)", "retta tangente al grafico in x₀, se f è derivabile in x₀"],
      ["y = a·f(b(x − c)) + d", "trasformazione del grafico di f: dilatazioni a e 1/b, traslazioni c orizzontale e d verticale, riflessioni se a o b sono negativi"]
    ],
    ipotesi: [
      "Il criterio di monotonia dal segno della derivata vale su un intervallo, con f continua sull'intervallo e derivabile all'interno.",
      "Il teorema di Fermat riguarda punti interni in cui f è derivabile: estremi agli estremi dell'intervallo o in punti angolosi sfuggono a f′ = 0.",
      "La caratterizzazione della convessità con f″ ≥ 0 richiede che f sia derivabile due volte sull'intervallo.",
      "Lo studio numerico della sezione è limitato all'intervallo disegnato e alla risoluzione della griglia."
    ],
    errori: [
      "Concludere che f″(x₀) = 0 implica un flesso: serve il cambio di concavità (controesempio x⁴ in 0).",
      "Concludere che f′(x₀) = 0 implica un estremo: x³ in 0 ha derivata nulla e nessun estremo.",
      "Dire che 1/x è decrescente in tutto il dominio perché la derivata è negativa: il dominio non è un intervallo.",
      "Cercare l'asintoto obliquo calcolando solo m: anche il limite di f(x) − mx deve esistere finito."
    ],
    esempio: {
      testo: "Studiare f(x) = x²/(x − 1). Dominio x ≠ 1; unico zero x = 0, f < 0 per x < 1 con x ≠ 0, f > 0 per x > 1. Per x → 1± f → ±∞: asintoto verticale x = 1. Dividendo, f(x) = x + 1 + 1/(x − 1), quindi m = 1, q = 1 e y = x + 1 è asintoto obliquo a ±∞. Si ha f′(x) = (x² − 2x)/(x − 1)², nulla in 0 e 2: f′ passa da + a − in 0 e da − a + in 2. Infine f″(x) = 2/(x − 1)³ non si annulla: concava per x < 1, convessa per x > 1, nessun flesso.",
      risultato: "massimo locale (0, 0), minimo locale (2, 4), asintoti x = 1 e y = x + 1, nessun flesso"
    },
    fonti: [
      "Bramanti, Pagani, Salsa, Analisi matematica 1, Zanichelli, capitoli sul calcolo differenziale e sullo studio del grafico di una funzione",
      "Giusti, Analisi matematica 1, Bollati Boringhieri, capitoli sulle derivate e sulle funzioni convesse",
      "Apostol, Calculus, vol. 1, Wiley, 2ª ed., cap. 4 (Differential calculus) e applicazioni della derivata",
      "Stewart, Calculus: Early Transcendentals, Cengage, cap. 4 (Applications of Differentiation)"
    ],
    collegamenti: ['smatcalc', 'smatbasi', 'smatserie', 'smatnum']
  };

  /* ── smatcalc ─────────────────────────────────────────────────────────── */
  T['smatcalc'] = {
    titolo: "Derivate, integrali, polinomi di Taylor e limiti",
    sintesi: "La derivata misura il tasso di variazione istantaneo ed è il limite del rapporto incrementale; l'integrale definito è il limite delle somme di Riemann. Il teorema fondamentale del calcolo li lega: integrare una derivata restituisce la variazione della funzione. Il polinomio di Taylor approssima una funzione regolare vicino a un punto con un errore controllato, e la stessa idea risolve molte forme indeterminate nei limiti.",
    paragrafi: [
      { titolo: "La derivata e le sue regole",
        testo: "Una funzione f definita in un intorno di x₀ è derivabile in x₀ se esiste finito il limite del rapporto incrementale (f(x₀ + h) − f(x₀))/h per h → 0; il valore è f′(x₀), la pendenza della retta tangente. La derivabilità implica la continuità, non il viceversa: |x| è continua ma non derivabile in 0. Dalla definizione seguono le regole che la sezione elenca a ogni passo: linearità, la regola del prodotto (fg)′ = f′g + fg′, quella del quoziente (f/g)′ = (f′g − fg′)/g² dove g ≠ 0, e la regola della catena (f∘g)′(x) = f′(g(x))·g′(x), valida se g è derivabile in x e f in g(x). Funzioni come xˣ = e^(x ln x), definita per x > 0, si derivano riscrivendole come esponenziali e usando la catena." },
      { titolo: "Integrale di Riemann e somme approssimanti",
        testo: "Sia f limitata su [a, b]. Per una suddivisione a = x₀ < x₁ < … < xₙ = b e punti ξᵢ ∈ [xᵢ₋₁, xᵢ], la somma di Riemann è Σ f(ξᵢ)(xᵢ − xᵢ₋₁). La funzione è integrabile secondo Riemann se le somme inferiore e superiore hanno lo stesso estremo, e allora le somme convergono all'integrale quando l'ampiezza massima degli intervalli tende a zero, qualunque sia la scelta dei ξᵢ. Ogni funzione continua su [a, b] è integrabile, e lo è anche una funzione limitata con un numero finito di discontinuità. Le somme sinistra, destra e del punto medio della sezione corrispondono a scelte diverse di ξᵢ con passo uniforme h; la regola dei trapezi è la media di sinistra e destra. Per f di classe C² l'errore del punto medio e dei trapezi è dell'ordine di h², quello di sinistra e destra solo di h." },
      { titolo: "Il teorema fondamentale del calcolo",
        testo: "Se f è continua su [a, b], la funzione integrale F(x) = ∫ₐˣ f(t) dt è derivabile e F′(x) = f(x) per ogni x in [a, b]. Ne segue che, se G è una qualunque primitiva di f, cioè G′ = f su [a, b], allora ∫ₐᵇ f(x) dx = G(b) − G(a). Il risultato trasforma il calcolo di un limite di somme nella ricerca di una primitiva. Non tutte le funzioni elementari hanno primitive elementari: e^(−x²) e sin(x)/x ne sono gli esempi classici, e per questo la sezione, quando non trova una forma chiusa, calcola l'integrale definito con la regola di Simpson adattiva. Quando invece trova una primitiva la verifica derivandola, che è il controllo più semplice e più sicuro." },
      { titolo: "Il polinomio di Taylor e il resto",
        testo: "Se f è derivabile n volte in x₀, il polinomio di Taylor di grado n è Tₙ(x) = Σₖ₌₀ⁿ f⁽ᵏ⁾(x₀)(x − x₀)ᵏ/k!, l'unico polinomio di grado al più n che ha in x₀ le stesse derivate di f fino all'ordine n. Il resto Rₙ = f − Tₙ è o((x − x₀)ⁿ) per x → x₀ (forma di Peano). Se f è derivabile n + 1 volte in un intervallo che contiene x₀ e x, il resto si scrive nella forma di Lagrange f⁽ⁿ⁺¹⁾(ξ)(x − x₀)ⁿ⁺¹/(n + 1)! per un ξ compreso fra x₀ e x, che consente stime quantitative. La sezione costruisce i coefficienti con l'aritmetica delle serie (prodotti e composizioni di sviluppi noti) e mostra l'errore. Avere tutti i polinomi di Taylor non basta perché la serie converga a f: e^(−1/x²), prolungata con 0 in 0, ha tutte le derivate nulle in 0." },
      { titolo: "Limiti e forme indeterminate",
        testo: "Le forme 0/0, ∞/∞, 0·∞, ∞ − ∞ e quelle esponenziali non hanno un valore a priori: dipende da come numeratore e denominatore tendono a zero o all'infinito. Il metodo degli sviluppi di Taylor è il più trasparente: per esempio sin x = x − x³/6 + o(x³) dà subito (x − sin x)/x³ → 1/6 per x → 0. Il teorema di de l'Hôpital è un'alternativa, con ipotesi precise: f e g derivabili in un intorno bucato del punto, g′ ≠ 0 lì, forma 0/0 o ∞/∞, ed esistenza del limite di f′/g′. La sezione usa le serie per le forme 0/0 e il calcolo numerico negli altri casi, e calcola separatamente i limiti destro e sinistro: il limite esiste solo se i due coincidono, come mostra 1/x in 0." }
    ],
    formule: [
      ["f′(x₀) = lim (f(x₀ + h) − f(x₀))/h  per h → 0", "definizione di derivata, se il limite esiste finito"],
      ["(f∘g)′(x) = f′(g(x))·g′(x)", "regola della catena, con g derivabile in x e f derivabile in g(x)"],
      ["∫ₐᵇ f(x) dx = G(b) − G(a)", "teorema fondamentale del calcolo: f continua su [a, b] e G primitiva di f"],
      ["f(x) = Σₖ₌₀ⁿ f⁽ᵏ⁾(x₀)(x − x₀)ᵏ/k! + f⁽ⁿ⁺¹⁾(ξ)(x − x₀)ⁿ⁺¹/(n + 1)!", "formula di Taylor con resto di Lagrange, per f derivabile n + 1 volte fra x₀ e x, con ξ intermedio"],
      ["|E_trap| ≤ (b − a)·h²·max|f″|/12", "stima dell'errore della regola dei trapezi composta, per f di classe C² su [a, b]"]
    ],
    ipotesi: [
      "Il teorema fondamentale nella forma F′ = f richiede f continua; per f solo integrabile F è continua ma può non essere derivabile.",
      "La regola di de l'Hôpital richiede la forma indeterminata, g′ ≠ 0 vicino al punto e l'esistenza del limite di f′/g′.",
      "La formula di Taylor con resto di Lagrange richiede la derivabilità di ordine n + 1 nell'intervallo fra x₀ e x.",
      "Gli ordini di convergenza delle somme di Riemann (h per sinistra e destra, h² per punto medio e trapezi) presuppongono f abbastanza regolare."
    ],
    errori: [
      "Dimenticare la derivata interna nella regola della catena: la derivata di sin(3x) è 3·cos(3x), non cos(3x).",
      "Applicare de l'Hôpital a un rapporto che non è in forma indeterminata, ottenendo un risultato sbagliato.",
      "Calcolare ∫₋₁¹ dx/x² = −2 con la primitiva −1/x: l'integranda non è limitata in 0 e l'integrale improprio diverge.",
      "Pensare che il polinomio di Taylor approssimi bene la funzione lontano dal punto di sviluppo: la stima del resto peggiora con |x − x₀|."
    ],
    esempio: {
      testo: "Calcolare I = ∫₀¹ x·eˣ dx. Per parti, con u = x e dv = eˣ dx, si ha I = [x·eˣ]₀¹ − ∫₀¹ eˣ dx = e − (e − 1) = 1. Controllo numerico con passo h = 0,5: la regola dei trapezi dà (h/2)·(f(0) + 2f(0,5) + f(1)) = 0,25·(0 + 0,8244·2 + 2,7183) ≈ 1,0918, la regola di Simpson (h/3)·(f(0) + 4f(0,5) + f(1)) ≈ 1,0026, molto più vicina al valore esatto, come prevede il suo ordine più alto.",
      risultato: "I = 1; trapezi (n = 2) ≈ 1,0918; Simpson (n = 2) ≈ 1,0026"
    },
    fonti: [
      "Bramanti, Pagani, Salsa, Analisi matematica 1, Zanichelli, capitoli su calcolo differenziale, formula di Taylor e calcolo integrale",
      "Rudin, Principles of Mathematical Analysis, McGraw-Hill, 3ª ed., cap. 5 (Differentiation) e cap. 6 (The Riemann–Stieltjes Integral)",
      "Apostol, Calculus, vol. 1, Wiley, 2ª ed., cap. 1 (integrale), cap. 5 (teorema fondamentale) e cap. 7 (approssimazione polinomiale)",
      "Burden, Faires, Numerical Analysis, Cengage, cap. 4 (Numerical Differentiation and Integration)"
    ],
    collegamenti: ['smatfunz', 'smatserie', 'smatnum', 'smatode', 'smatmulti']
  };

  /* ── smatlin ──────────────────────────────────────────────────────────── */
  T['smatlin'] = {
    titolo: "Matrici, sistemi lineari, autovalori e bilanciamento delle reazioni",
    sintesi: "Un sistema lineare Ax = b si risolve riducendo la matrice a scala con operazioni elementari sulle righe, che non cambiano l'insieme delle soluzioni. Dalla forma ridotta si leggono rango, nucleo, determinante e inversa, e il teorema di Rouché–Capelli dice se le soluzioni sono una, infinite o nessuna. Gli autovalori descrivono le direzioni che una trasformazione si limita ad allungare. Bilanciare una reazione chimica significa trovare il nucleo della matrice di composizione.",
    paragrafi: [
      { titolo: "Eliminazione di Gauss–Jordan",
        testo: "Le operazioni elementari sulle righe sono tre: scambiare due righe, moltiplicare una riga per uno scalare non nullo, sommare a una riga un multiplo di un'altra. Ciascuna corrisponde alla moltiplicazione a sinistra per una matrice invertibile, quindi non cambia le soluzioni del sistema né il rango. Con queste operazioni ogni matrice si porta alla forma a scala ridotta, che è unica: ogni pivot vale 1 ed è l'unico elemento non nullo della sua colonna. La sezione lavora con frazioni esatte, rappresentate con interi arbitrariamente grandi, così 1/3 resta 1/3 per tutta la riduzione e non si accumulano errori di arrotondamento; solo se compaiono irrazionali passa alla virgola mobile, dove la scelta del pivot di modulo massimo diventa importante per la stabilità numerica." },
      { titolo: "Rango, nucleo e Rouché–Capelli",
        testo: "Il rango di A è il numero di pivot della forma a scala, cioè la dimensione dello spazio generato dalle colonne (e, equivalentemente, dalle righe). Il nucleo è l'insieme dei vettori con Ax = 0, ed è un sottospazio. Per una matrice m × n vale il teorema della dimensione: rango + dim ker A = n. Il teorema di Rouché–Capelli afferma che Ax = b è risolubile se e solo se il rango di A è uguale al rango della matrice completa [A | b]; in tal caso le soluzioni formano un sottospazio affine x₀ + ker A di dimensione n − rango, e quindi la soluzione è unica esattamente quando il rango è n. Le variabili senza pivot diventano parametri liberi, ed è così che la sezione scrive le infinite soluzioni." },
      { titolo: "Determinante e inversa",
        testo: "Per una matrice quadrata n × n il determinante è l'unica funzione delle righe multilineare, alternante e che vale 1 sull'identità. Dalle proprietà seguono le regole della riduzione: lo scambio di due righe cambia il segno, la moltiplicazione di una riga per k moltiplica il determinante per k, la combinazione di righe lo lascia invariato. Quindi il determinante è il prodotto dei pivot corretto per i segni degli scambi. Vale det(AB) = det A · det B, e A è invertibile se e solo se det A ≠ 0, ovvero se e solo se il rango è n. L'inversa si calcola riducendo [A | I] a [I | A⁻¹]. Geometricamente, |det A| è il fattore per cui la trasformazione x ↦ Ax moltiplica le aree o i volumi, e il segno dice se l'orientamento è conservato: è ciò che mostra la griglia deformata della scheda sulle trasformazioni del piano." },
      { titolo: "Autovalori e autovettori",
        testo: "Un numero λ è autovalore di A se esiste v ≠ 0 con Av = λv; v è un autovettore e la sua direzione non viene ruotata, solo dilatata di λ. Gli autovalori sono le radici del polinomio caratteristico p(λ) = det(λI − A), di grado n; in ℂ ce ne sono n contati con molteplicità, la loro somma è la traccia e il prodotto è il determinante. La sezione ottiene i coefficienti di p con l'algoritmo di Faddeev–LeVerrier, che usa solo prodotti di matrici e tracce ed è esatto in aritmetica razionale. Una matrice è diagonalizzabile se e solo se per ogni autovalore la molteplicità geometrica, cioè la dimensione dell'autospazio, uguaglia quella algebrica; [[1, 1], [0, 1]] non lo è. Per il teorema spettrale una matrice reale simmetrica ha autovalori reali e una base ortonormale di autovettori: è il caso delle matrici di Hückel." },
      { titolo: "Il bilanciamento come problema di nucleo",
        testo: "Una reazione con s specie e e elementi si traduce in una matrice di composizione e × s: la colonna di ogni specie contiene il numero di atomi di ciascun elemento, con segno opposto per prodotti e reagenti, e per le specie ioniche si aggiunge una riga per la carica. I coefficienti stechiometrici sono un vettore del nucleo con componenti positive. Se il nucleo ha dimensione 1, la reazione è determinata a meno di un fattore, e si sceglie il multiplo con i più piccoli interi positivi. Se ha dimensione maggiore, la stessa lista di specie ammette più reazioni indipendenti, combinazioni lineari una dell'altra, e il bilanciamento non è unico senza informazioni chimiche aggiuntive; se il nucleo è banale, le specie scelte non possono reagire fra loro in modo bilanciato." }
    ],
    formule: [
      ["rango(A) + dim ker(A) = n", "teorema della dimensione per una matrice A con n colonne"],
      ["Ax = b risolubile ⇔ rango(A) = rango([A | b])", "teorema di Rouché–Capelli; le soluzioni sono x₀ + ker A"],
      ["det(AB) = det(A)·det(B)", "teorema di Binet, per matrici quadrate dello stesso ordine"],
      ["det(λI − A) = 0", "equazione caratteristica: le sue radici sono gli autovalori di A"],
      ["Σλᵢ = tr A,  Πλᵢ = det A", "relazioni fra autovalori (in ℂ, con molteplicità), traccia e determinante"]
    ],
    ipotesi: [
      "Determinante, inversa e autovalori si definiscono solo per matrici quadrate.",
      "Il teorema spettrale con autovalori reali e base ortonormale vale per matrici reali simmetriche (o complesse hermitiane), non per matrici qualsiasi.",
      "In virgola mobile il rango numerico dipende da una soglia di tolleranza; in aritmetica esatta è ben definito.",
      "Il bilanciamento come nucleo presuppone che le specie elencate siano quelle effettivamente coinvolte."
    ],
    errori: [
      "Credere che det(A + B) = det A + det B: il determinante è moltiplicativo, non additivo.",
      "Dimenticare di cambiare segno al determinante dopo uno scambio di righe.",
      "Pensare che ogni matrice quadrata sia diagonalizzabile: le matrici con autovalori ripetuti possono non esserlo.",
      "Concludere che un sistema con più incognite che equazioni ha sempre infinite soluzioni: può essere incompatibile."
    ],
    esempio: {
      testo: "Bilanciare CH₄ + O₂ → CO₂ + H₂O. Con le colonne (CH₄, O₂, CO₂, H₂O) e i prodotti col segno meno, le righe sono C: (1, 0, −1, 0), H: (4, 0, 0, −2), O: (0, 2, −2, −1). Il rango è 3, quindi il nucleo ha dimensione 4 − 3 = 1. Dalla riga di C si ha c = a, da quella di H d = 2a, da quella di O 2b = 2c + d = 4a, cioè b = 2a. Con a = 1 si ottiene il vettore (1, 2, 1, 2).",
      risultato: "CH₄ + 2 O₂ → CO₂ + 2 H₂O"
    },
    fonti: [
      "Strang, Linear Algebra and Its Applications, Cengage, 4ª ed., cap. 1 (eliminazione), cap. 2 (spazi vettoriali e nucleo), cap. 4 (determinanti), cap. 5 (autovalori)",
      "Lang, Introduction to Linear Algebra, Springer, 2ª ed., capitoli su matrici, determinanti e autovalori",
      "Abate, de Fabritiis, Geometria analitica con elementi di algebra lineare, McGraw-Hill, capitoli su sistemi lineari e diagonalizzazione",
      "Householder, The Theory of Matrices in Numerical Analysis, Dover, sezione sul metodo di Leverrier per il polinomio caratteristico"
    ],
    collegamenti: ['smatsvd', 'smatvis', 'smatode', 'smatgeo', 'ssteich']
  };

  /* ── smatode ──────────────────────────────────────────────────────────── */
  T['smatode'] = {
    titolo: "Equazioni differenziali ordinarie: campi, metodi numerici e piano delle fasi",
    sintesi: "Un'equazione differenziale del primo ordine y′ = f(x, y) assegna una pendenza a ogni punto del piano; le soluzioni sono le curve tangenti a quel campo. Il teorema di Cauchy garantisce esistenza e unicità locale sotto ipotesi di regolarità. Quando la soluzione non ha forma chiusa la si approssima con Eulero, Heun o Runge–Kutta, che differiscono per ordine. Per i sistemi autonomi nel piano gli equilibri si classificano con gli autovalori dello jacobiano.",
    paragrafi: [
      { titolo: "Il campo di direzioni e il problema di Cauchy",
        testo: "Il problema di Cauchy chiede una funzione y derivabile con y′(x) = f(x, y(x)) e y(x₀) = y₀. Il teorema di esistenza e unicità locale afferma che, se f è continua in un rettangolo attorno a (x₀, y₀) e lipschitziana in y uniformemente rispetto a x, esiste un intervallo attorno a x₀ su cui la soluzione esiste ed è unica; basta per esempio che ∂f/∂y sia continua. Senza la condizione di Lipschitz l'unicità può cadere: y′ = √|y| con y(0) = 0 ha sia y ≡ 0 sia y = x²/4 per x ≥ 0. La soluzione può anche esistere solo su un intervallo limitato: y′ = y² con y(0) = 1 dà y = 1/(1 − x), che esplode in x = 1. Il campo di direzioni disegna i segmenti di pendenza f(x, y), e l'unicità spiega perché due curve integrali non si possono incrociare." },
      { titolo: "Metodi a un passo e ordine",
        testo: "Con passo h e nodi xₙ = x₀ + nh, il metodo di Eulero esplicito pone yₙ₊₁ = yₙ + h·f(xₙ, yₙ): segue la tangente per un passo. Il metodo di Heun fa un passo di Eulero di prova e poi usa la media delle pendenze all'inizio e alla fine. Il Runge–Kutta classico a quattro stadi combina quattro valutazioni della pendenza con pesi 1, 2, 2, 1 diviso 6. Un metodo ha ordine p se l'errore globale in un punto fissato è dell'ordine di hᵖ per h → 0, purché f sia sufficientemente regolare: Eulero ha ordine 1, Heun 2, RK4 4. Dimezzando il passo l'errore si riduce quindi di circa 2, 4 e 16 volte, ed è esattamente ciò che la sezione mostra su y′ = y, la cui soluzione esatta è eˣ. Il numero di valutazioni di f per passo aumenta, ma l'aumento di precisione è di gran lunga maggiore." },
      { titolo: "Sistemi autonomi e piano delle fasi",
        testo: "Un sistema x′ = f(x, y), y′ = g(x, y) in cui il tempo non compare esplicitamente definisce un campo vettoriale nel piano, e ogni soluzione è una traiettoria tangente al campo. Gli equilibri sono i punti in cui f = g = 0. Vicino a un equilibrio p si linearizza con lo jacobiano J, la matrice delle derivate parziali di (f, g) in p. Se det J < 0 gli autovalori sono reali di segno opposto e l'equilibrio è una sella; se det J > 0 e il discriminante tr² − 4 det è positivo si ha un nodo, se è negativo un fuoco; la stabilità dipende dal segno della traccia, negativa per gli equilibri attrattivi. Se tr J = 0 e det J > 0 il sistema linearizzato ha un centro, con orbite chiuse." },
      { titolo: "Quando la linearizzazione basta",
        testo: "Il teorema di Hartman–Grobman garantisce che, vicino a un equilibrio iperbolico, cioè con autovalori dello jacobiano a parte reale non nulla, il sistema non lineare è topologicamente equivalente al suo linearizzato: selle, nodi e fuochi sono quindi classificati correttamente. Il centro non è iperbolico: per il sistema non lineare può essere un vero centro, come nel modello preda–predatore di Lotka–Volterra, che ha una quantità conservata, oppure un fuoco debole, stabile o instabile, che solo un'analisi di ordine superiore rivela. Per questo la sezione scrive «centro, nel lineare». Lo stesso vale quando det J = 0. Il pendolo, l'oscillatore di Van der Pol con il suo ciclo limite, il Bruxellatore delle reazioni oscillanti e l'epidemia SIR sono esempi in cui la struttura globale delle traiettorie va oltre ciò che dice lo studio locale." }
    ],
    formule: [
      ["yₙ₊₁ = yₙ + h·f(xₙ, yₙ)", "metodo di Eulero esplicito, di ordine 1"],
      ["yₙ₊₁ = yₙ + (h/6)(k₁ + 2k₂ + 2k₃ + k₄)", "Runge–Kutta classico di ordine 4, con k₁ = f(xₙ, yₙ), k₂ = f(xₙ + h/2, yₙ + hk₁/2), k₃ = f(xₙ + h/2, yₙ + hk₂/2), k₄ = f(xₙ + h, yₙ + hk₃)"],
      ["|f(x, y₁) − f(x, y₂)| ≤ L·|y₁ − y₂|", "condizione di Lipschitz in y che, con la continuità di f, garantisce esistenza e unicità locale"],
      ["λ² − (tr J)·λ + det J = 0", "equazione caratteristica dello jacobiano 2 × 2 in un equilibrio; i suoi autovalori classificano sella, nodo, fuoco e centro"]
    ],
    ipotesi: [
      "Esistenza e unicità del problema di Cauchy sono locali e richiedono f continua e lipschitziana in y.",
      "L'ordine dei metodi numerici vale asintoticamente per h → 0 e per f abbastanza regolare.",
      "La classificazione dal linearizzato è affidabile solo per equilibri iperbolici (Hartman–Grobman); centri e casi con det J = 0 richiedono altra analisi.",
      "I metodi espliciti hanno un limite di stabilità sul passo: per problemi rigidi possono divergere anche se il passo sembra piccolo."
    ],
    errori: [
      "Credere che il centro trovato dal linearizzato sia un centro anche per il sistema non lineare.",
      "Pensare che una soluzione esista per tutti gli x solo perché f è definita ovunque: y′ = y² esplode in tempo finito.",
      "Confondere l'errore locale di un passo, dell'ordine di hᵖ⁺¹, con l'errore globale, dell'ordine di hᵖ.",
      "Scegliere il passo solo in base alla precisione, ignorando la stabilità dei metodi espliciti."
    ],
    esempio: {
      testo: "Approssimare y(1) per y′ = y, y(0) = 1, con passo h = 0,5. Ogni passo moltiplica y per un fattore fisso: per Eulero 1 + h = 1,5, quindi y(1) ≈ 1,5² = 2,25; per Heun 1 + h + h²/2 = 1,625, quindi 2,6406; per RK4 1 + h + h²/2 + h³/6 + h⁴/24 = 1,6484375, quindi 2,7173. Il valore esatto è e ≈ 2,7183. Gli errori sono 0,468, 0,078 e 0,00093.",
      risultato: "Eulero 2,25; Heun 2,6406; RK4 2,7173; esatto e ≈ 2,7183"
    },
    fonti: [
      "Boyce, DiPrima, Elementary Differential Equations and Boundary Value Problems, Wiley, cap. 2 (teorema di esistenza e unicità), cap. 8 (metodi numerici), cap. 9 (sistemi non lineari e stabilità)",
      "Strogatz, Nonlinear Dynamics and Chaos, Westview Press, cap. 5–7 (sistemi lineari, piano delle fasi, cicli limite)",
      "Hairer, Nørsett, Wanner, Solving Ordinary Differential Equations I, Springer, cap. II (metodi di Runge–Kutta)",
      "Pagani, Salsa, Analisi matematica 2, Zanichelli, capitolo sulle equazioni differenziali ordinarie"
    ],
    collegamenti: ['smatnum', 'smatlin', 'smatcalc', 'smatedp', 'schicinet']
  };

  /* ── smatmulti ────────────────────────────────────────────────────────── */
  T['smatmulti'] = {
    titolo: "Funzioni di più variabili: derivate parziali, punti critici e funzioni di stato",
    sintesi: "Una funzione z = f(x, y) si rappresenta come superficie o come mappa di curve di livello. Le derivate parziali formano il gradiente, che indica la direzione di massima crescita ed è perpendicolare alle curve di livello. Nei punti critici la matrice hessiana distingue minimi, massimi e selle. In termodinamica le funzioni di stato sono funzioni di più variabili, e le relazioni di Maxwell sono il teorema di Schwarz applicato a un potenziale.",
    paragrafi: [
      { titolo: "Derivate parziali, differenziale e gradiente",
        testo: "La derivata parziale ∂f/∂x in (x₀, y₀) è la derivata della funzione di una variabile x ↦ f(x, y₀). L'esistenza delle derivate parziali non basta a dire molto: esistono funzioni con entrambe le parziali nell'origine che non sono nemmeno continue lì. La nozione giusta è la differenziabilità: f è differenziabile in p se f(p + h) = f(p) + ∇f(p)·h + o(|h|). Il teorema del differenziale totale assicura che, se le derivate parziali esistono in un intorno e sono continue in p, f è differenziabile in p. In tal caso la derivata direzionale lungo il versore u vale ∇f·u, massima quando u è parallelo a ∇f: il gradiente punta dove f cresce più rapidamente, ed è ortogonale alle curve di livello nei punti in cui non si annulla." },
      { titolo: "Punti critici e hessiana",
        testo: "Se f è differenziabile e p è un estremo locale interno, allora ∇f(p) = 0. Per classificare un punto critico di una funzione di classe C² si usa la matrice hessiana H, simmetrica per il teorema di Schwarz. In due variabili, con det H = fₓₓf_yy − fₓᵧ²: se det H > 0 e fₓₓ > 0 il punto è un minimo locale stretto, se det H > 0 e fₓₓ < 0 un massimo locale stretto, se det H < 0 una sella; se det H = 0 il test non decide. La sezione trova i punti critici con il metodo di Newton applicato a ∇f = 0, usando come jacobiano proprio l'hessiana simbolica. Nella doppia buca, modello di una superficie di energia potenziale, i due minimi sono reagente e prodotto e la sella fra loro è lo stato di transizione." },
      { titolo: "Discesa del gradiente",
        testo: "Toccando la mappa parte la discesa del gradiente: xₖ₊₁ = xₖ − η∇f(xₖ). Per η abbastanza piccolo, se ∇f(xₖ) ≠ 0 il valore di f diminuisce a ogni passo, e la successione tende tipicamente a un minimo locale, quello del bacino in cui si è partiti, non necessariamente al minimo globale. Vicino a un minimo con hessiana definita positiva, la convergenza con passo fisso richiede η < 2/λ_max, dove λ_max è il più grande autovalore dell'hessiana; quando gli autovalori sono molto diversi le traiettorie zigzagano lungo le valli strette. In chimica computazionale la stessa idea, con algoritmi più raffinati, serve a ottimizzare le geometrie molecolari." },
      { titolo: "Funzioni di stato e differenziali esatti",
        testo: "Una forma differenziale ω = M dx + N dy è esatta se esiste una funzione F con dF = ω, cioè M = ∂F/∂x e N = ∂F/∂y. Se M e N sono di classe C¹, una condizione necessaria è ∂M/∂y = ∂N/∂x; su un dominio semplicemente connesso, per esempio un rettangolo, è anche sufficiente. Il calore scambiato reversibilmente δq non è esatto, ma δq/T = dS sì: 1/T è un fattore integrante e l'entropia è una funzione di stato. Dall'energia di Helmholtz A(T, V), con dA = −S dT − p dV, il teorema di Schwarz applicato alle derivate seconde miste dà la relazione di Maxwell (∂S/∂V)_T = (∂p/∂T)_V. Per il gas di van der Waals p = RT/(V − b) − a/V² per mole, entrambe valgono R/(V − b), e la sezione lo verifica in modo simbolico." }
    ],
    formule: [
      ["D_u f(p) = ∇f(p)·u", "derivata direzionale lungo il versore u, per f differenziabile in p"],
      ["det H = fₓₓ·f_yy − fₓᵧ²", "determinante dell'hessiana in due variabili: > 0 con fₓₓ > 0 minimo, > 0 con fₓₓ < 0 massimo, < 0 sella, per f di classe C² in un punto critico"],
      ["∂²f/∂x∂y = ∂²f/∂y∂x", "teorema di Schwarz, se le derivate seconde miste sono continue"],
      ["(∂S/∂V)_T = (∂p/∂T)_V", "relazione di Maxwell dall'energia di Helmholtz A(T, V)"],
      ["xₖ₊₁ = xₖ − η·∇f(xₖ)", "discesa del gradiente con passo η; vicino a un minimo con hessiana definita positiva converge se η < 2/λ_max"]
    ],
    ipotesi: [
      "Il test dell'hessiana richiede f di classe C² e ∇f = 0 nel punto; con det H = 0 non decide.",
      "Il teorema di Schwarz richiede la continuità delle derivate seconde miste.",
      "La condizione ∂M/∂y = ∂N/∂x implica l'esattezza solo su domini semplicemente connessi.",
      "La discesa del gradiente trova al più un minimo locale, e solo per passi sufficientemente piccoli."
    ],
    errori: [
      "Concludere che una funzione è differenziabile perché esistono le derivate parziali.",
      "Usare solo il segno di fₓₓ per classificare un punto critico, dimenticando il determinante dell'hessiana.",
      "Trattare δq o δw come differenziali di funzioni di stato: dipendono dal cammino.",
      "Ritenere che la discesa del gradiente trovi il minimo globale."
    ],
    esempio: {
      testo: "Classificare i punti critici di f(x, y) = x³ − 3x + y². Il gradiente è (3x² − 3, 2y), nullo in (1, 0) e (−1, 0). L'hessiana è diagonale con fₓₓ = 6x, f_yy = 2, fₓᵧ = 0. In (1, 0) det H = 12 > 0 e fₓₓ = 6 > 0: minimo locale, con f = −2. In (−1, 0) det H = −12 < 0: sella, con f = 2. Il minimo non è globale, perché f → −∞ per x → −∞.",
      risultato: "(1, 0) minimo locale con f = −2; (−1, 0) punto di sella"
    },
    fonti: [
      "Pagani, Salsa, Analisi matematica 2, Zanichelli, capitoli sul calcolo differenziale in più variabili e sulle forme differenziali",
      "Apostol, Calculus, vol. 2, Wiley, 2ª ed., cap. 8 (calcolo differenziale per campi scalari e vettoriali) e cap. 9",
      "Atkins, de Paula, Physical Chemistry, Oxford University Press, capitolo sulle relazioni termodinamiche e le relazioni di Maxwell",
      "Nocedal, Wright, Numerical Optimization, Springer, 2ª ed., cap. 3 (metodi di ricerca lineare e discesa)"
    ],
    collegamenti: ['smatvett', 'smatcalc', 'smatgrafi', 'sthermoadv', 'smatlin']
  };

  /* ── smatcompl ────────────────────────────────────────────────────────── */
  T['smatcompl'] = {
    titolo: "Numeri complessi, formula di Eulero e serie di Fourier",
    sintesi: "I numeri complessi estendono i reali in modo che ogni polinomio abbia radici, e sul piano di Argand hanno un significato geometrico: la somma è una traslazione, il prodotto una rotazione con dilatazione. La formula di Eulero lega esponenziale e trigonometria. Su di essa poggiano le serie di Fourier, che scrivono una funzione periodica come somma di armoniche, con una convergenza che dipende dalla regolarità della funzione.",
    paragrafi: [
      { titolo: "Il campo complesso e il piano di Argand",
        testo: "Un numero complesso è z = a + ib con a, b reali e i² = −1; con le operazioni usuali ℂ è un campo, ma non è ordinato: scrivere z₁ < z₂ non ha senso. Identificando z con il punto (a, b), la somma corrisponde alla regola del parallelogramma. Il modulo |z| = √(a² + b²) è la distanza dall'origine e il coniugato z̄ = a − ib è il simmetrico rispetto all'asse reale, con z·z̄ = |z|². Ogni z ≠ 0 si scrive in forma trigonometrica z = r(cos θ + i sin θ), con r = |z| e θ argomento, definito a meno di multipli di 2π; l'argomento principale si sceglie di solito in (−π, π]. Nel prodotto i moduli si moltiplicano e gli argomenti si sommano: moltiplicare per un numero di modulo 1 è una rotazione del piano." },
      { titolo: "La formula di Eulero e le radici n-esime",
        testo: "Definendo l'esponenziale complesso con la serie eᶻ = Σ zⁿ/n!, che converge per ogni z, e separando parte reale e parte immaginaria per z = iθ si ottiene e^(iθ) = cos θ + i sin θ: il punto e^(iθ) percorre la circonferenza unitaria, e le sue proiezioni sugli assi sono coseno e seno. Ne segue la formula di de Moivre (cos θ + i sin θ)ⁿ = cos nθ + i sin nθ per n intero. Le radici n-esime di w = ρe^(iφ) ≠ 0 sono esattamente n, zₖ = ρ^(1/n)·e^(i(φ + 2kπ)/n) con k = 0, …, n − 1, vertici di un poligono regolare centrato nell'origine. Le potenze a esponente non intero e il logaritmo complesso sono invece multivoci: sqrt(−4) restituisce il valore principale 2i, ma anche −2i è una radice quadrata di −4." },
      { titolo: "Serie di Fourier",
        testo: "Una funzione f di periodo 2π, integrabile su un periodo, ha coefficienti di Fourier aₙ = (1/π)∫ f(x) cos nx dx e bₙ = (1/π)∫ f(x) sin nx dx, con gli integrali estesi a [−π, π]. La serie di Fourier è a₀/2 + Σ (aₙ cos nx + bₙ sin nx). Che converga a f non è automatico. Il teorema di Dirichlet afferma che, se f è regolare a tratti, cioè con un numero finito di discontinuità di salto e derivata regolare a tratti, la serie converge in ogni punto alla media dei limiti destro e sinistro, quindi a f(x) dove f è continua. La convergenza è uniforme se f è continua, periodica e regolare a tratti. La sezione mostra l'onda quadra, con bₙ = 4/(nπ) per n dispari, il dente di sega, con bₙ = 2(−1)ⁿ⁺¹/(nπ), e l'onda triangolare, con aₙ = 8/(n²π²) per n dispari: più la funzione è liscia, più rapidamente i coefficienti decrescono." },
      { titolo: "Gibbs e Parseval",
        testo: "Vicino a una discontinuità di salto la somma parziale Sₙ supera il valore della funzione di circa il 9 % dell'ampiezza del salto, e questo eccesso non diminuisce al crescere di N: si sposta soltanto verso il salto, restringendosi. È il fenomeno di Gibbs, ed è compatibile con la convergenza puntuale perché in ogni punto fissato il picco prima o poi passa oltre; mostra però che la convergenza non è uniforme. Per l'onda quadra di ampiezza 1 il massimo delle somme parziali tende a circa 1,179. L'uguaglianza di Parseval, valida per f a quadrato integrabile su un periodo, afferma che (1/π)∫ f² dx = a₀²/2 + Σ (aₙ² + bₙ²): l'energia del segnale è la somma delle energie delle armoniche. La sezione mostra quale frazione dell'energia è catturata dalle prime N armoniche." },
      { titolo: "Perché in chimica",
        testo: "La formula di Eulero è il linguaggio naturale delle oscillazioni: un'onda piana si scrive e^(i(kx − ωt)), e la funzione d'onda di una particella libera ha proprio questa forma. Le serie e le trasformate di Fourier sono il cuore della spettroscopia moderna. In risonanza magnetica nucleare il segnale registrato nel tempo, il decadimento libero dell'induzione, è una somma di oscillazioni smorzate, e lo spettro in frequenza si ottiene con la trasformata di Fourier; lo stesso accade negli spettrometri infrarossi a trasformata di Fourier, dove l'interferogramma viene trasformato in spettro. In cristallografia la densità elettronica è una serie di Fourier i cui coefficienti sono i fattori di struttura." }
    ],
    formule: [
      ["e^(iθ) = cos θ + i·sin θ", "formula di Eulero, per ogni θ reale"],
      ["zₖ = ρ^(1/n)·e^(i(φ + 2kπ)/n),  k = 0, …, n − 1", "le n radici n-esime di w = ρe^(iφ) ≠ 0"],
      ["aₙ = (1/π)∫₋π^π f(x) cos nx dx,  bₙ = (1/π)∫₋π^π f(x) sin nx dx", "coefficienti di Fourier di una funzione 2π-periodica integrabile"],
      ["(1/π)∫₋π^π f(x)² dx = a₀²/2 + Σₙ₌₁^∞ (aₙ² + bₙ²)", "uguaglianza di Parseval, per f reale a quadrato integrabile sul periodo"]
    ],
    ipotesi: [
      "Il teorema di Dirichlet richiede f periodica e regolare a tratti; per funzioni solo continue la serie può divergere in qualche punto.",
      "Nei punti di salto la serie converge alla media dei limiti laterali, non al valore di f.",
      "Le potenze a esponente non intero e il logaritmo complesso dipendono dalla scelta del ramo.",
      "L'argomento di un numero complesso è definito a meno di multipli di 2π e non è definito per z = 0."
    ],
    errori: [
      "Scrivere √(a)·√(b) = √(ab) con numeri negativi: √(−1)·√(−1) = −1, non √1 = 1.",
      "Calcolare l'argomento con arctan(b/a) senza guardare il quadrante: per −1 − i si ottiene π/4 invece di −3π/4.",
      "Credere che con abbastanza armoniche il picco di Gibbs sparisca.",
      "Dimenticare che le radici n-esime di un numero complesso non nullo sono n, non una sola."
    ],
    esempio: {
      testo: "Trovare le radici cubiche di −8. Si scrive −8 = 8·e^(iπ), quindi zₖ = 2·e^(i(π + 2kπ)/3) con k = 0, 1, 2. Per k = 0: 2(cos 60° + i sin 60°) = 1 + i√3; per k = 1: 2e^(iπ) = −2; per k = 2: 2(cos 300° + i sin 300°) = 1 − i√3. Sono i vertici di un triangolo equilatero inscritto nel cerchio di raggio 2, e la loro somma è zero.",
      risultato: "1 + i√3, −2, 1 − i√3"
    },
    fonti: [
      "Bramanti, Pagani, Salsa, Analisi matematica 1, Zanichelli, capitolo sui numeri complessi",
      "Stein, Shakarchi, Fourier Analysis: An Introduction, Princeton University Press, cap. 2–3 (serie di Fourier, convergenza, Parseval)",
      "Tolstov, Fourier Series, Dover, capitoli sulla convergenza e sul fenomeno di Gibbs",
      "Ahlfors, Complex Analysis, McGraw-Hill, 3ª ed., cap. 1 (numeri complessi)"
    ],
    collegamenti: ['smatanalcomp', 'smatvis', 'smatedp', 'sfisonde', 'sspec']
  };

  /* ── smatstat ─────────────────────────────────────────────────────────── */
  T['smatstat'] = {
    titolo: "Statistica per il laboratorio: medie, test, incertezze e taratura",
    sintesi: "Misure ripetute fluttuano: media e deviazione standard le riassumono, e la distribuzione t di Student permette di dare un intervallo di confidenza per il valore vero anche con pochi dati. I test di ipotesi confrontano una media con un valore di riferimento o due serie fra loro; quelli per i valori anomali decidono se un dato è sospetto. L'incertezza si propaga attraverso le formule con le derivate parziali, e la retta di taratura lega il segnale alla concentrazione.",
    paragrafi: [
      { titolo: "Media, deviazione standard e intervallo di confidenza",
        testo: "Da n misure x₁, …, xₙ si calcolano la media x̄ = Σxᵢ/n e la deviazione standard campionaria s = √(Σ(xᵢ − x̄)²/(n − 1)); il denominatore n − 1 rende s² uno stimatore non distorto della varianza σ², perché un grado di libertà è stato speso per stimare la media. L'errore standard della media è s/√n. Se le misure sono indipendenti e provengono da una distribuzione normale di media μ, la grandezza (x̄ − μ)/(s/√n) segue una t di Student con n − 1 gradi di libertà, e l'intervallo x̄ ± t·s/√n, con t quantile al 97,5 %, contiene μ con probabilità del 95 % prima di osservare i dati. Non significa che μ abbia il 95 % di probabilità di stare nell'intervallo calcolato: μ è fisso, è l'intervallo a essere aleatorio." },
      { titolo: "Valori anomali: Grubbs e Dixon",
        testo: "Il test di Grubbs calcola G = max|xᵢ − x̄|/s e lo confronta con un valore critico che dipende da n e dal livello α; la sezione lo calcola con la formula Gc = ((n − 1)/√n)·√(t²/(n − 2 + t²)), dove t è il quantile della t di Student con n − 2 gradi di libertà a livello α/(2n). Il test Q di Dixon confronta la distanza del dato sospetto dal suo vicino con l'intervallo totale e usa valori critici tabulati, qui quelli di Rorabacher al 95 % per n da 3 a 10. Entrambi presuppongono dati normali e un solo valore anomalo. Un risultato significativo autorizza a cercare una causa, non a cancellare automaticamente il dato, e i test non andrebbero ripetuti a cascata sullo stesso insieme." },
      { titolo: "Test t e test F",
        testo: "Il test t a un campione confronta la media con un valore certificato μ₀ tramite t = (x̄ − μ₀)/(s/√n). Per due serie indipendenti si controlla prima con il test F se le varianze sono compatibili; se lo sono si usa la t con varianza combinata e n₁ + n₂ − 2 gradi di libertà, altrimenti la t di Welch, con gradi di libertà stimati dalla formula di Welch–Satterthwaite. Se le misure sono appaiate, per esempio due metodi sugli stessi campioni, si applica il test a un campione alle differenze. Il valore p è la probabilità, sotto l'ipotesi nulla, di ottenere una statistica almeno così estrema; la sezione lo calcola esattamente dalla funzione beta incompleta. Un p grande non dimostra l'ipotesi nulla: dice solo che i dati non bastano a respingerla." },
      { titolo: "Propagazione delle incertezze",
        testo: "Se y = f(x₁, …, xₖ) con grandezze indipendenti di incertezze tipo uᵢ, l'approssimazione al primo ordine dà u(y)² = Σ (∂f/∂xᵢ)²·uᵢ², con le derivate valutate nei valori misurati. È la legge di propagazione della Guida all'espressione dell'incertezza di misura (GUM). Per grandezze correlate compaiono termini di covarianza, e se f è fortemente non lineare sulla scala delle incertezze l'approssimazione lineare può fallire. Per questo la sezione controlla il risultato con un Monte Carlo: estrae molte volte gli ingressi dalle loro distribuzioni, calcola f e misura la dispersione dei risultati, che è il metodo raccomandato dal Supplemento 1 della GUM." },
      { titolo: "La retta di taratura",
        testo: "Con gli standard (xᵢ, yᵢ) i minimi quadrati danno la pendenza b = Sₓᵧ/Sₓₓ e l'intercetta a = ȳ − b·x̄, dove Sₓₓ = Σ(xᵢ − x̄)² e Sₓᵧ = Σ(xᵢ − x̄)(yᵢ − ȳ). La dispersione dei punti attorno alla retta è s_y/x = √(Σ residui²/(n − 2)). Da un segnale medio y₀ di m repliche si ricava x₀ = (y₀ − a)/b, con deviazione standard s_x0 = (s_y/x/b)·√(1/m + 1/n + (y₀ − ȳ)²/(b²Sₓₓ)), secondo Miller e Miller: l'incertezza è minima al centro della retta. Il limite di rivelabilità e quello di quantificazione si stimano come 3,3·s_y/x/b e 10·s_y/x/b. Il coefficiente r vicino a 1 non prova la linearità: vanno guardati i residui." }
    ],
    formule: [
      ["s = √(Σ(xᵢ − x̄)²/(n − 1))", "deviazione standard campionaria, con n − 1 gradi di libertà"],
      ["x̄ ± t₀,₉₇₅;ₙ₋₁·s/√n", "intervallo di confidenza al 95 % per la media di dati normali indipendenti"],
      ["u(y)² = Σ (∂f/∂xᵢ)²·uᵢ²", "propagazione delle incertezze al primo ordine, per ingressi indipendenti"],
      ["ν = (s₁²/n₁ + s₂²/n₂)² / [ (s₁²/n₁)²/(n₁ − 1) + (s₂²/n₂)²/(n₂ − 1) ]", "gradi di libertà di Welch–Satterthwaite per il test t con varianze diverse"],
      ["s_x0 = (s_y/x/b)·√(1/m + 1/n + (y₀ − ȳ)²/(b²·Sₓₓ))", "deviazione standard della concentrazione ricavata dalla retta di taratura"]
    ],
    ipotesi: [
      "I test t e gli intervalli con la t di Student presuppongono dati indipendenti e approssimativamente normali.",
      "Grubbs e Dixon assumono dati normali con al più un valore anomalo.",
      "La propagazione al primo ordine richiede incertezze piccole rispetto alla scala su cui f è non lineare, e ingressi indipendenti se si omettono le covarianze.",
      "La regressione ordinaria assume errori solo sulla y, con varianza costante (omoschedasticità)."
    ],
    errori: [
      "Dire che il valore vero ha il 95 % di probabilità di trovarsi nell'intervallo calcolato.",
      "Usare la z della normale invece della t di Student con pochi dati, ottenendo intervalli troppo stretti.",
      "Scartare un dato solo perché «sembra strano», senza test né motivazione sperimentale.",
      "Ritenere che r = 0,999 dimostri che la taratura è lineare."
    ],
    esempio: {
      testo: "Cinque titolazioni danno 10,12; 10,18; 10,05; 10,21; 10,09 mL. La media è 10,13 mL, la deviazione standard s ≈ 0,065 mL, l'errore standard s/√5 ≈ 0,029 mL. Con 4 gradi di libertà il quantile t₀,₉₇₅ vale 2,776, quindi la semiampiezza dell'intervallo al 95 % è 2,776·0,029 ≈ 0,081 mL.",
      risultato: "(10,13 ± 0,08) mL al 95 % di confidenza"
    },
    fonti: [
      "Miller, Miller, Statistics and Chemometrics for Analytical Chemistry, Pearson, 6ª ed., cap. 2–3 (statistica delle misure ripetute, test di significatività) e cap. 5 (taratura)",
      "JCGM 100:2008, Evaluation of measurement data – Guide to the expression of uncertainty in measurement (GUM), e JCGM 101:2008 (Supplemento 1, metodo Monte Carlo)",
      "Rorabacher, Statistical treatment for rejection of deviant values: critical values of Dixon's Q parameter, Analytical Chemistry 63 (1991)",
      "Taylor, An Introduction to Error Analysis, University Science Books, 2ª ed., cap. 3–5"
    ],
    collegamenti: ['smatinfer', 'smatprob', 'staratura', 'smatbasi']
  };

  /* ── smatnum ──────────────────────────────────────────────────────────── */
  T['smatnum'] = {
    titolo: "Metodi numerici: zeri, quadratura, equazioni differenziali, interpolazione",
    sintesi: "Un metodo numerico sostituisce un problema continuo con una successione di calcoli finiti, e si giudica da due cose: quanto rapidamente l'errore diminuisce, cioè l'ordine, e in quali condizioni fallisce. Bisezione, Newton e secanti trovano gli zeri; trapezi, Simpson e Gauss calcolano gli integrali; Eulero e Runge–Kutta integrano le equazioni differenziali; l'interpolazione polinomiale ricostruisce una funzione dai valori nei nodi, con le insidie del fenomeno di Runge.",
    paragrafi: [
      { titolo: "Zeri di funzioni",
        testo: "Se f è continua su [a, b] e f(a)·f(b) < 0, il teorema di Bolzano garantisce uno zero, e la bisezione dimezza l'intervallo a ogni passo: dopo n passi l'errore è al più (b − a)/2ⁿ⁺¹, convergenza lineare ma sicura. Il metodo di Newton xₙ₊₁ = xₙ − f(xₙ)/f′(xₙ) segue la tangente; se f è di classe C², lo zero x* è semplice, cioè f′(x*) ≠ 0, e il punto iniziale è abbastanza vicino, la convergenza è quadratica: l'errore viene circa elevato al quadrato a ogni passo e le cifre corrette raddoppiano. Lontano dallo zero Newton può divergere o oscillare, e con zeri multipli diventa lineare. Il metodo delle secanti sostituisce la derivata con un rapporto incrementale e ha ordine (1 + √5)/2 ≈ 1,618. L'iterazione di punto fisso xₙ₊₁ = g(xₙ) converge localmente se |g′(x*)| < 1." },
      { titolo: "Ordine e come si misura",
        testo: "Una successione converge a x* con ordine p se |eₙ₊₁| ≈ C·|eₙ|ᵖ per n grande, con eₙ = xₙ − x*. Prendendo i logaritmi, log|eₙ₊₁| ≈ log C + p·log|eₙ|, e quando gli errori sono piccoli il rapporto log|eₙ₊₁|/log|eₙ| tende a p, che è la stima mostrata nella tabella delle iterazioni. Per i metodi di quadratura e di integrazione delle equazioni differenziali l'errore si comporta come C·hᵖ al tendere a zero del passo h: in un grafico log-log dell'errore contro il numero di intervalli i punti si allineano su una retta di pendenza −p. È un modo sperimentale, ma molto efficace, di verificare la teoria e di scoprire errori di programmazione; a passi troppo piccoli la retta si piega perché domina l'arrotondamento in virgola mobile." },
      { titolo: "Quadratura",
        testo: "Le formule di Newton–Cotes composte approssimano f con polinomi a tratti. Per f di classe C² su [a, b] l'errore dei trapezi è −(b − a)h²f″(ξ)/12 per un opportuno ξ, quindi di ordine 2; per f di classe C⁴ quello di Simpson, che richiede un numero pari di intervalli, è −(b − a)h⁴f⁽⁴⁾(ξ)/180, di ordine 4. Simpson è esatto per i polinomi di grado fino a 3. La quadratura di Gauss–Legendre con n nodi sceglie nodi e pesi in modo ottimale, i nodi sono gli zeri del polinomio di Legendre Pₙ, ed è esatta per tutti i polinomi di grado fino a 2n − 1, il massimo possibile con n nodi. Se la funzione non è regolare, per esempio ha una derivata infinita in un estremo, gli ordini teorici non si osservano." },
      { titolo: "Equazioni differenziali e rigidezza",
        testo: "Per y′ = f(x, y) i metodi di Eulero, Heun e Runge–Kutta 4 hanno errore globale di ordine 1, 2 e 4. Oltre alla precisione conta la stabilità. Sul problema modello y′ = λy con λ < 0, la cui soluzione decade, Eulero esplicito produce yₙ₊₁ = (1 + hλ)yₙ, che decade solo se |1 + hλ| < 1, cioè h < 2/|λ|. Un problema è rigido quando contiene scale di tempo molto diverse: la componente rapida, ormai estinta, impone comunque un passo minuscolo ai metodi espliciti, che altrimenti esplodono. I metodi impliciti, come Eulero all'indietro, sono stabili per ogni h > 0 sul problema modello e sono la scelta naturale per la cinetica chimica con costanti molto diverse." },
      { titolo: "Interpolazione e fenomeno di Runge",
        testo: "Dati n + 1 nodi distinti esiste un unico polinomio di grado al più n che passa per i valori assegnati, scritto per esempio nella forma di Lagrange. Se f è di classe Cⁿ⁺¹, l'errore è f⁽ⁿ⁺¹⁾(ξ)/(n + 1)!·Π(x − xᵢ). Con nodi equispaziati il prodotto Π(x − xᵢ) diventa enorme vicino agli estremi, e per la funzione di Runge 1/(1 + 25x²) su [−1, 1] l'errore massimo cresce con n invece di diminuire. Con i nodi di Čebyšëv, più fitti agli estremi, il prodotto è minimizzato e per funzioni regolari, come quella di Runge, l'interpolante converge uniformemente. In alternativa si rinuncia al polinomio unico e si usa la spline cubica naturale, polinomi di terzo grado a tratti raccordati con continuità fino alla derivata seconda." }
    ],
    formule: [
      ["xₙ₊₁ = xₙ − f(xₙ)/f′(xₙ)", "metodo di Newton; convergenza quadratica per zeri semplici, f di classe C² e punto iniziale vicino"],
      ["|eₙ₊₁| ≈ C·|eₙ|ᵖ", "definizione di ordine di convergenza p"],
      ["E_Simpson = −(b − a)·h⁴·f⁽⁴⁾(ξ)/180", "errore della regola di Simpson composta, per f di classe C⁴ e numero pari di intervalli"],
      ["f(x) − pₙ(x) = f⁽ⁿ⁺¹⁾(ξ)/(n + 1)!·Π(x − xᵢ)", "errore di interpolazione polinomiale su n + 1 nodi, per f di classe Cⁿ⁺¹"],
      ["|1 + hλ| < 1", "condizione di stabilità di Eulero esplicito sul problema modello y′ = λy"]
    ],
    ipotesi: [
      "La bisezione richiede f continua e un cambio di segno agli estremi.",
      "La convergenza quadratica di Newton è locale e richiede uno zero semplice.",
      "Gli ordini delle formule di quadratura richiedono derivate limitate dell'ordine corrispondente.",
      "La convergenza dell'interpolazione su nodi di Čebyšëv richiede una funzione sufficientemente regolare (per esempio lipschitziana)."
    ],
    errori: [
      "Pensare che aumentare il grado del polinomio interpolante migliori sempre l'approssimazione.",
      "Usare Newton senza controllare il punto di partenza: può divergere o saltare a un altro zero.",
      "Fermare un metodo quando |f(xₙ)| è piccolo senza considerare che f può essere molto piatta vicino allo zero.",
      "Ridurre il passo all'infinito sperando in errori sempre minori: a un certo punto domina l'arrotondamento."
    ],
    esempio: {
      testo: "Calcolare √2 come zero di f(x) = x² − 2 con Newton da x₀ = 1. L'iterazione è xₙ₊₁ = xₙ − (xₙ² − 2)/(2xₙ). Si ottiene x₁ = 1,5 (errore 8,6·10⁻²), x₂ = 1,416667 (errore 2,5·10⁻³), x₃ = 1,4142157 (errore 2,1·10⁻⁶), x₄ = 1,41421356237 (errore 1,6·10⁻¹²). A ogni passo l'errore è circa il quadrato del precedente diviso per 2√2, come prevede la convergenza quadratica.",
      risultato: "x₄ ≈ 1,41421356237, errore ≈ 1,6·10⁻¹²"
    },
    fonti: [
      "Burden, Faires, Numerical Analysis, Cengage, cap. 2 (zeri), cap. 3 (interpolazione e spline), cap. 4 (quadratura), cap. 5 (problemi ai valori iniziali e rigidezza)",
      "Quarteroni, Sacco, Saleri, Matematica numerica, Springer Italia, capitoli su equazioni non lineari, interpolazione e integrazione numerica",
      "Trefethen, Approximation Theory and Approximation Practice, SIAM, capitoli su interpolazione di Čebyšëv e fenomeno di Runge",
      "Süli, Mayers, An Introduction to Numerical Analysis, Cambridge University Press, capitoli su quadratura gaussiana e metodi a un passo"
    ],
    collegamenti: ['smatode', 'smatcalc', 'smatbasi', 'smatedp', 'smatsvd']
  };

  /* ── smatgeo ──────────────────────────────────────────────────────────── */
  T['smatgeo'] = {
    titolo: "Vettori, rette, piani e coniche",
    sintesi: "La geometria analitica traduce punti, rette e piani in coordinate e risolve i problemi geometrici con il calcolo. Prodotto scalare, vettoriale e misto misurano angoli, aree e volumi; con essi si calcolano distanze, intersezioni e posizioni reciproche di rette e piani. Le coniche sono le curve di secondo grado, e gli invarianti della loro matrice le classificano senza bisogno di disegnarle.",
    paragrafi: [
      { titolo: "Prodotto scalare, vettoriale e misto",
        testo: "In ℝ³ con la base ortonormale canonica, il prodotto scalare u·v = u₁v₁ + u₂v₂ + u₃v₃ vale |u||v|cos θ, dove θ ∈ [0, π] è l'angolo fra i vettori: si annulla esattamente per vettori ortogonali e dà la proiezione di u su v, (u·v/|v|²)v. Il prodotto vettoriale u × v è ortogonale a entrambi, ha modulo |u||v|sin θ, uguale all'area del parallelogramma costruito sui due vettori, e verso dato dalla regola della mano destra; è anticommutativo e nullo se e solo se i vettori sono paralleli. Il prodotto misto (u × v)·w è il determinante della matrice che ha u, v, w come righe: il suo valore assoluto è il volume del parallelepipedo, e si annulla se e solo se i tre vettori sono complanari." },
      { titolo: "Rette e piani nello spazio",
        testo: "Un piano è l'insieme dei punti P con n·(P − P₀) = 0, dove n è un vettore normale non nullo: in coordinate ax + by + cz + d = 0 con n = (a, b, c). Per tre punti non allineati A, B, C passa un unico piano, con normale (B − A) × (C − A). Una retta si scrive in forma parametrica P = P₀ + t·v con v vettore direzione. La distanza di un punto Q dal piano è |ax_Q + by_Q + cz_Q + d|/|n|, quella da una retta è |(Q − P₀) × v|/|v|. Due rette nello spazio possono essere incidenti, parallele o sghembe; nel caso sghembo esiste un'unica perpendicolare comune, e la distanza fra le rette è |(P₂ − P₁)·(v₁ × v₂)|/|v₁ × v₂|, nulla esattamente quando le rette sono complanari. L'angolo fra una retta e un piano è il complementare dell'angolo fra la direzione e la normale." },
      { titolo: "Coniche e loro matrice",
        testo: "Una conica è il luogo degli zeri di Ax² + Bxy + Cy² + Dx + Ey + F = 0 con A, B, C non tutti nulli. Si associano la matrice simmetrica 3 × 3 M, con righe (A, B/2, D/2), (B/2, C, E/2), (D/2, E/2, F), e la sottomatrice 2 × 2 dei termini quadratici, Q = [[A, B/2], [B/2, C]]. Il determinante Δ = det M e δ = det Q = AC − B²/4, insieme alla traccia I = A + C, sono invarianti per rototraslazioni. Se Δ = 0 la conica è degenere: due rette, eventualmente coincidenti o immaginarie, oppure un punto. Se Δ ≠ 0 è un'ellisse per δ > 0, che è reale se e solo se Δ·I < 0, un'iperbole per δ < 0 e una parabola per δ = 0. L'ellisse è una circonferenza quando A = C e B = 0." },
      { titolo: "Forma canonica, semiassi e fuochi",
        testo: "Per una conica a centro, con δ ≠ 0, il centro è il punto in cui si annulla il gradiente della forma quadratica completa; traslando l'origine nel centro scompaiono i termini lineari. La rotazione degli assi di un angolo θ con tan 2θ = B/(A − C) elimina il termine misto, e gli autovalori λ₁, λ₂ di Q diventano i coefficienti dei nuovi quadrati: λ₁X² + λ₂Y² + k = 0 con k = Δ/δ, perché il determinante si conserva. Da qui si leggono i semiassi: per l'ellisse X²/a² + Y²/b² = 1 con a ≥ b la distanza dei fuochi dal centro è c = √(a² − b²) e l'eccentricità e = c/a < 1; per l'iperbole X²/a² − Y²/b² = 1 si ha c = √(a² + b²) ed e > 1; la parabola ha e = 1. La sezione disegna la curva campionando il segno del polinomio su una griglia." }
    ],
    formule: [
      ["u·v = |u||v|·cos θ", "prodotto scalare e angolo fra vettori non nulli"],
      ["|u × v| = |u||v|·sin θ", "area del parallelogramma costruito su u e v"],
      ["d(Q, π) = |a·x_Q + b·y_Q + c·z_Q + d| / √(a² + b² + c²)", "distanza di un punto dal piano ax + by + cz + d = 0"],
      ["d(r₁, r₂) = |(P₂ − P₁)·(v₁ × v₂)| / |v₁ × v₂|", "distanza fra due rette non parallele"],
      ["δ = AC − B²/4,  Δ = det M", "invarianti della conica: Δ ≠ 0 e δ > 0 ellisse, δ < 0 iperbole, δ = 0 parabola"]
    ],
    ipotesi: [
      "Le formule componente per componente dei prodotti valgono in una base ortonormale; il prodotto vettoriale richiede inoltre un orientamento destrorso.",
      "La formula della distanza fra rette vale per rette non parallele; per rette parallele si usa la distanza di un punto da una retta.",
      "La classificazione con Δ, δ e I vale per coniche reali con almeno un coefficiente quadratico non nullo.",
      "La formula k = Δ/δ e la forma λ₁X² + λ₂Y² + k = 0 valgono solo per coniche a centro (δ ≠ 0)."
    ],
    errori: [
      "Calcolare l'angolo fra retta e piano con il prodotto scalare fra direzione e normale senza passare al complementare.",
      "Concludere che due rette nello spazio che non si incontrano sono parallele: possono essere sghembe.",
      "Classificare una conica solo con δ, dimenticando che con Δ = 0 è degenere.",
      "Dimenticare il fattore 1/2 sui coefficienti misti e lineari nella matrice della conica."
    ],
    esempio: {
      testo: "Classificare 5x² − 6xy + 5y² − 8 = 0. Si ha δ = 25 − 9 = 16 > 0, I = 10 e M = [[5, −3, 0], [−3, 5, 0], [0, 0, −8]], quindi Δ = −8·16 = −128 e Δ·I < 0: ellisse reale con centro nell'origine. Gli autovalori di Q sono 2 e 8, e k = Δ/δ = −8; la forma canonica è 2X² + 8Y² = 8, cioè X²/4 + Y² = 1. Il semiasse maggiore a = 2 sta lungo l'autovettore (1, 1)/√2 dell'autovalore 2, b = 1, c = √3.",
      risultato: "ellisse con a = 2, b = 1, e = √3/2 ≈ 0,866, fuochi in ±(√6/2, √6/2)"
    },
    fonti: [
      "Abate, de Fabritiis, Geometria analitica con elementi di algebra lineare, McGraw-Hill, capitoli su rette e piani nello spazio e sulle coniche",
      "Sernesi, Geometria 1, Bollati Boringhieri, capitoli sulla geometria affine ed euclidea e sulle coniche",
      "Apostol, Calculus, vol. 1, Wiley, 2ª ed., cap. 13 (algebra vettoriale e geometria analitica)",
      "Strang, Linear Algebra and Its Applications, Cengage, 4ª ed., cap. 6 (forme quadratiche e matrici definite positive)"
    ],
    collegamenti: ['smatvett', 'smatlin', 'smatfrenet', 'sastroorbite']
  };

  /* ── smatvett ─────────────────────────────────────────────────────────── */
  T['smatvett'] = {
    titolo: "Campi vettoriali, divergenza, rotore e teorema di Green",
    sintesi: "Un campo vettoriale nel piano assegna una freccia a ogni punto. La divergenza misura quanto il campo esce da un punto, il rotore quanto vi gira attorno. Il teorema di Green collega queste quantità locali a grandezze globali lungo una curva chiusa: la circuitazione è l'integrale del rotore, il flusso uscente l'integrale della divergenza. Un campo con rotore nullo su un dominio semplicemente connesso è un gradiente, e ammette un potenziale.",
    paragrafi: [
      { titolo: "Divergenza, rotore e laplaciano",
        testo: "Per un campo F = (P, Q) di classe C¹ in un aperto del piano, la divergenza è div F = ∂P/∂x + ∂Q/∂y e il rotore scalare è rot F = ∂Q/∂x − ∂P/∂y, la terza componente del rotore del campo pensato nello spazio. Il significato si legge dal teorema di Green applicato a un piccolo disco: la divergenza è il flusso uscente per unità di area, positivo nelle sorgenti e negativo nei pozzi; il rotore è la circuitazione per unità di area, e misura la tendenza a far ruotare una piccola ruota a pale. Per una funzione scalare f di classe C² il laplaciano Δf = ∂²f/∂x² + ∂²f/∂y² è la divergenza del gradiente; le funzioni con Δf = 0 si chiamano armoniche." },
      { titolo: "Lavoro, flusso e teorema di Green",
        testo: "Sia D un dominio limitato del piano la cui frontiera ∂D è unione finita di curve chiuse regolari a tratti, orientata positivamente, cioè lasciando D a sinistra, e siano P e Q di classe C¹ in un aperto che contiene D e il suo bordo. Allora ∮_∂D (P dx + Q dy) = ∬_D (∂Q/∂x − ∂P/∂y) dx dy: la circuitazione, o lavoro, del campo lungo il bordo uguaglia l'integrale del rotore. Applicando lo stesso teorema al campo ruotato (−Q, P) si ottiene la forma della divergenza: il flusso uscente ∮ F·n ds, con n normale esterna, è uguale a ∬_D div F dx dy. La sezione calcola i due membri in modo indipendente, sulla curva e sulla regione, e li confronta. Il teorema è il caso piano dei teoremi di Stokes e della divergenza." },
      { titolo: "Campi conservativi e potenziale",
        testo: "Un campo F è conservativo in un aperto connesso Ω se esiste f con ∇f = F, e allora il lavoro lungo una curva dipende solo dagli estremi e lungo ogni curva chiusa è nullo. Se F è di classe C¹ e conservativo, il rotore è identicamente nullo, perché le derivate seconde miste di f coincidono. Il viceversa vale se Ω è semplicemente connesso, cioè senza buchi: rotore nullo implica conservativo. Senza questa ipotesi è falso, come mostra il campo (−y, x)/(x² + y²), con rotore nullo nel piano privato dell'origine ma circuitazione 2π lungo ogni cerchio attorno all'origine. Quando il campo è conservativo il potenziale si trova integrando P in x e determinando la funzione di y rimasta con la condizione ∂f/∂y = Q." },
      { titolo: "Gradiente e curve di livello",
        testo: "Per f differenziabile, il gradiente ∇f in un punto in cui non si annulla è ortogonale alla curva di livello che passa di lì e punta nella direzione in cui f cresce più rapidamente, con modulo uguale a quella massima rapidità. La ragione è semplice: lungo una curva di livello γ(t) si ha f(γ(t)) costante, e derivando ∇f·γ′ = 0. In fisica e in chimica questo legame è ovunque: il campo elettrico è −∇V, perpendicolare alle superfici equipotenziali, e il flusso di diffusione nella legge di Fick è proporzionale a −∇c, diretto dalle concentrazioni alte verso le basse. L'equazione di continuità lega poi la divergenza del flusso alla variazione nel tempo della concentrazione." }
    ],
    formule: [
      ["div F = ∂P/∂x + ∂Q/∂y,  rot F = ∂Q/∂x − ∂P/∂y", "divergenza e rotore scalare di un campo piano F = (P, Q) di classe C¹"],
      ["∮_∂D (P dx + Q dy) = ∬_D (∂Q/∂x − ∂P/∂y) dx dy", "teorema di Green, con ∂D regolare a tratti orientata positivamente e P, Q di classe C¹ su D chiuso"],
      ["∮_∂D F·n ds = ∬_D div F dx dy", "forma del flusso del teorema di Green, con n normale esterna"],
      ["∇f·γ′(t) = 0", "il gradiente è ortogonale a ogni curva di livello γ di f"],
      ["Δf = ∂²f/∂x² + ∂²f/∂y²", "laplaciano di una funzione di classe C², divergenza del gradiente"]
    ],
    ipotesi: [
      "Green richiede che P e Q siano di classe C¹ su tutto D, compresi i punti interni: una singolarità dentro D invalida il teorema.",
      "Rotore nullo implica campo conservativo solo su domini semplicemente connessi.",
      "La frontiera deve essere orientata positivamente; con l'orientamento opposto cambia il segno.",
      "Il gradiente è ortogonale alle curve di livello nei punti in cui non si annulla."
    ],
    errori: [
      "Applicare Green a (−y, x)/(x² + y²) su un disco che contiene l'origine e concludere che la circuitazione è zero.",
      "Confondere il flusso attraverso la curva con il lavoro lungo la curva: il primo usa la normale, il secondo la tangente.",
      "Dedurre che un campo è conservativo solo perché il lavoro lungo una particolare curva chiusa è nullo.",
      "Scambiare l'ordine nel rotore scrivendo ∂P/∂y − ∂Q/∂x, che cambia il segno."
    ],
    esempio: {
      testo: "Per F = (−y, x) e D disco unitario, calcolare la circuitazione in due modi. Lungo il bordo r(t) = (cos t, sin t), t ∈ [0, 2π], si ha F·r′ = sin² t + cos² t = 1, quindi ∮ = 2π. Con Green, rot F = 1 − (−1) = 2 e l'area è π, quindi ∬ 2 dA = 2π. Il flusso dello stesso campo è nullo, perché div F = 0; per G = (x, y) invece div G = 2 e il flusso uscente è 2π.",
      risultato: "circuitazione 2π in entrambi i modi; flusso di (x, y) pari a 2π"
    },
    fonti: [
      "Pagani, Salsa, Analisi matematica 2, Zanichelli, capitoli su integrali curvilinei, forme differenziali e formule di Gauss–Green",
      "Apostol, Calculus, vol. 2, Wiley, 2ª ed., cap. 10 (integrali di linea) e cap. 11 (integrali multipli e teorema di Green)",
      "Marsden, Tromba, Vector Calculus, W. H. Freeman, capitoli sui teoremi integrali dell'analisi vettoriale",
      "Griffiths, Introduction to Electrodynamics, Cambridge University Press, cap. 1 (analisi vettoriale)"
    ],
    collegamenti: ['smatmulti', 'smatgeo', 'smatedp', 'sfisem', 'smatanalcomp']
  };

  /* ── smatfrenet ───────────────────────────────────────────────────────── */
  T['smatfrenet'] = {
    titolo: "Curve nello spazio: curvatura, torsione e triedro di Frenet",
    sintesi: "Una curva regolare nello spazio si descrive, a meno di movimenti rigidi, con due funzioni dell'ascissa curvilinea: la curvatura, che misura quanto la direzione cambia, e la torsione, che misura quanto la curva esce dal suo piano osculatore. Il triedro mobile tangente, normale e binormale accompagna la curva, e le formule di Frenet–Serret ne descrivono la variazione. Le formule valgono per qualunque parametrizzazione regolare.",
    paragrafi: [
      { titolo: "Curve regolari e ascissa curvilinea",
        testo: "Una curva parametrizzata r: I → ℝ³ di classe C¹ è regolare se r′(t) ≠ 0 per ogni t; in tal caso ha in ogni punto una retta tangente. La lunghezza dell'arco fra t₀ e t è s(t) = ∫ |r′(u)| du, con l'integrale da t₀ a t, e poiché s′ = |r′| > 0 la funzione s è invertibile: si può riparametrizzare la curva con l'ascissa curvilinea, ottenendo una parametrizzazione a velocità unitaria. Le quantità geometriche come curvatura e torsione non dipendono dalla parametrizzazione scelta, mentre la velocità sì. Nella sezione la lunghezza si calcola con la regola di Simpson, e le derivate di r con differenze centrate su cinque punti, con errore dell'ordine di h⁴, sufficiente a ritrovare i valori esatti noti fino alla sesta cifra." },
      { titolo: "Curvatura e triedro di Frenet",
        testo: "Il versore tangente è T = r′/|r′|. La curvatura κ è il modulo di dT/ds, cioè la rapidità con cui la direzione ruota per unità di lunghezza, e per una parametrizzazione qualsiasi vale κ = |r′ × r″|/|r′|³. Una retta ha κ = 0, una circonferenza di raggio R ha κ = 1/R, e in generale 1/κ è il raggio del cerchio osculatore. Dove κ > 0 si definiscono la normale principale N = (dT/ds)/κ, che punta verso il centro di curvatura, e la binormale B = T × N, che è anche (r′ × r″)/|r′ × r″|. T, N e B formano una base ortonormale destrorsa che si muove con la curva; T e N generano il piano osculatore. Dove r′ × r″ = 0 il triedro non è definito, e la sezione lo segnala invece di disegnare frecce arbitrarie." },
      { titolo: "Torsione e formule di Frenet–Serret",
        testo: "Per una curva di classe C³ con κ > 0, derivando la base ortonormale rispetto a s si ottengono le formule di Frenet–Serret: dT/ds = κN, dN/ds = −κT + τB, dB/ds = −τN. La forma antisimmetrica dei coefficienti viene dall'ortonormalità della base. La torsione τ misura la rapidità con cui il piano osculatore ruota attorno alla tangente; per una parametrizzazione qualsiasi vale τ = (r′ × r″)·r‴/|r′ × r″|². Una curva con κ > 0 ha torsione identicamente nulla se e solo se è piana. A differenza della curvatura, la torsione ha segno, che dipende dal verso di avvolgimento: un'elica destrorsa ha τ > 0, una sinistrorsa τ < 0." },
      { titolo: "Il teorema fondamentale delle curve",
        testo: "Date due funzioni κ(s) > 0 e τ(s), continue su un intervallo, esiste una curva parametrizzata con l'ascissa curvilinea che ha esattamente quella curvatura e quella torsione, ed è unica a meno di un movimento rigido dello spazio, cioè di una rotazione propria seguita da una traslazione. Curvatura e torsione sono quindi un insieme completo di invarianti. L'elica circolare r(t) = (a cos t, a sin t, bt) ha curvatura e torsione costanti, κ = a/(a² + b²) e τ = b/(a² + b²), ed è, insieme a circonferenze e rette come casi limite, l'unica curva con questa proprietà. Le eliche compaiono in chimica come forma delle α-eliche proteiche e della doppia elica del DNA." }
    ],
    formule: [
      ["κ = |r′ × r″| / |r′|³", "curvatura per una parametrizzazione regolare qualsiasi di classe C²"],
      ["τ = (r′ × r″)·r‴ / |r′ × r″|²", "torsione, definita dove r′ × r″ ≠ 0, per curve di classe C³"],
      ["dT/ds = κN,  dN/ds = −κT + τB,  dB/ds = −τN", "formule di Frenet–Serret rispetto all'ascissa curvilinea, per κ > 0"],
      ["s(t) = ∫ₜ₀ᵗ |r′(u)| du", "lunghezza d'arco di una curva regolare"],
      ["κ = a/(a² + b²),  τ = b/(a² + b²)", "curvatura e torsione dell'elica (a cos t, a sin t, bt), con a > 0"]
    ],
    ipotesi: [
      "La curva deve essere regolare (r′ ≠ 0) per definire T e l'ascissa curvilinea.",
      "N, B e τ sono definiti solo dove κ > 0, cioè dove r′ × r″ ≠ 0.",
      "Le formule di Frenet–Serret richiedono una curva di classe C³ con curvatura positiva.",
      "Il teorema fondamentale richiede κ > 0 e funzioni continue; l'unicità è a meno di movimenti rigidi propri."
    ],
    errori: [
      "Calcolare la curvatura come |r″| con una parametrizzazione che non ha velocità unitaria.",
      "Pensare che la normale principale sia definita anche nei tratti rettilinei o nei flessi.",
      "Credere che la torsione sia sempre positiva: il segno dipende dal verso di avvolgimento.",
      "Confondere il piano osculatore, generato da T e N, con il piano normale, generato da N e B."
    ],
    esempio: {
      testo: "Per l'elica r(t) = (cos t, sin t, t) si ha r′ = (−sin t, cos t, 1), con |r′| = √2, r″ = (−cos t, −sin t, 0) e r‴ = (sin t, −cos t, 0). Il prodotto vettoriale è r′ × r″ = (sin t, −cos t, 1), di modulo √2. Quindi κ = √2/(√2)³ = 1/2. Inoltre (r′ × r″)·r‴ = sin² t + cos² t = 1, e τ = 1/2. Un giro completo è lungo 2π√2.",
      risultato: "κ = τ = 1/2 in ogni punto; lunghezza di un giro 2π√2 ≈ 8,886"
    },
    fonti: [
      "do Carmo, Differential Geometry of Curves and Surfaces, Prentice-Hall (2ª ed. Dover), cap. 1 (curve, formule di Frenet, teorema fondamentale)",
      "Abate, Tovena, Curve e superfici, Springer Italia, cap. 1 (curve nello spazio)",
      "Pressley, Elementary Differential Geometry, Springer, 2ª ed., cap. 1–2 (curvatura e torsione)",
      "Apostol, Calculus, vol. 1, Wiley, 2ª ed., cap. 14 (calcolo con funzioni a valori vettoriali)"
    ],
    collegamenti: ['smatgeo', 'smatnoneucl', 'smattopo', 'smatvett', 'smatvariaz']
  };

  /* ── smatprob ─────────────────────────────────────────────────────────── */
  T['smatprob'] = {
    titolo: "Binomiale, legge dei grandi numeri, limite centrale e teorema di Bayes",
    sintesi: "La probabilità descrive fenomeni ripetibili il cui esito singolo è imprevedibile ma il cui comportamento d'insieme è regolare. La macchina di Galton realizza una distribuzione binomiale; la legge dei grandi numeri spiega perché le medie si stabilizzano; il teorema del limite centrale perché la gaussiana compare ovunque. Il metodo Monte Carlo usa il caso per calcolare, e il teorema di Bayes insegna a leggere correttamente un test diagnostico.",
    paragrafi: [
      { titolo: "La macchina di Galton e la binomiale",
        testo: "Una pallina attraversa n file di chiodi e a ogni fila va a destra con probabilità p, indipendentemente dalle altre. Il numero K di deviazioni a destra, che determina la casella finale, segue la distribuzione binomiale: P(K = k) = C(n, k)·pᵏ(1 − p)ⁿ⁻ᵏ per k = 0, …, n, con media np e varianza np(1 − p). Il coefficiente binomiale C(n, k) conta i cammini diversi che portano alla stessa casella, ed è per questo che le caselle centrali si riempiono di più. Il teorema di de Moivre–Laplace afferma che, per p fissato in (0, 1) e n → ∞, la variabile standardizzata (K − np)/√(np(1 − p)) converge in distribuzione alla normale standard: il mucchio di palline assume la forma della campana di Gauss." },
      { titolo: "La legge dei grandi numeri",
        testo: "Siano X₁, X₂, … variabili aleatorie indipendenti e identicamente distribuite con media finita μ, e sia X̄ₙ la media dei primi n valori. La legge debole dei grandi numeri afferma che X̄ₙ converge a μ in probabilità: per ogni ε > 0, P(|X̄ₙ − μ| > ε) → 0. La legge forte afferma di più: con probabilità 1 la successione delle medie converge a μ. Se la varianza σ² è finita, la legge debole segue in una riga dalla disuguaglianza di Čebyšëv, P(|X̄ₙ − μ| ≥ ε) ≤ σ²/(nε²). L'ipotesi di media finita non è un dettaglio: per variabili di Cauchy la media campionaria ha la stessa distribuzione di una singola osservazione e non si stabilizza mai. La legge non dice che dopo una serie di teste «tocca» alla croce: le estrazioni restano indipendenti." },
      { titolo: "Il teorema del limite centrale",
        testo: "Se X₁, X₂, … sono indipendenti e identicamente distribuite con media μ e varianza σ² finita e positiva, allora √n(X̄ₙ − μ)/σ converge in distribuzione alla normale standard. Detto in modo pratico, per n grande la media di n osservazioni è distribuita approssimativamente come N(μ, σ²/n), qualunque sia la distribuzione di partenza: la sezione lo mostra partendo da un dado, da una moneta, da un'uniforme e da un'esponenziale, che è fortemente asimmetrica. Il teorema non dice quanto deve essere grande n: con distribuzioni molto asimmetriche servono campioni più ampi, e la stima di Berry–Esseen quantifica l'errore in termini del momento terzo. La dispersione della media scende come 1/√n, ed è il motivo per cui quadruplicare le misure dimezza soltanto l'incertezza." },
      { titolo: "Il metodo Monte Carlo",
        testo: "Per stimare π si lanciano N punti uniformi nel quadrato [0, 1]²: la probabilità che un punto cada nel quarto di cerchio x² + y² ≤ 1 è π/4, quindi quattro volte la frazione osservata è una stima non distorta di π. Ogni lancio è una variabile di Bernoulli con p = π/4, e la deviazione standard della stima è 4√(p(1 − p)/N) ≈ 1,64/√N. L'errore scende come 1/√N, in accordo con il limite centrale: per guadagnare una cifra decimale servono cento volte più punti. È una convergenza lenta, ma indipendente dalla dimensione del problema, ed è per questo che il Monte Carlo domina negli integrali in molte dimensioni, dalla meccanica statistica alla propagazione delle incertezze. Il generatore della sezione è pseudo-casuale con seme fissato, così ogni prova è riproducibile." },
      { titolo: "Il teorema di Bayes e i test diagnostici",
        testo: "Per eventi M (malattia) e + (test positivo) con P(+) > 0 vale P(M | +) = P(+ | M)·P(M)/P(+), dove P(+) = P(+ | M)P(M) + P(+ | non M)P(non M) per la formula delle probabilità totali. La sensibilità è P(+ | M), la specificità P(− | non M), la prevalenza P(M); il valore predittivo positivo è P(M | +). Il punto controintuitivo è che con una malattia rara anche un test buono produce più falsi positivi che veri positivi, perché i sani sono molto più numerosi. Le frequenze naturali, mille persone disegnate una per una, rendono il calcolo evidente senza formule. Confondere P(+ | M) con P(M | +) è un errore così comune da avere un nome, la fallacia del procuratore." }
    ],
    formule: [
      ["P(K = k) = C(n, k)·pᵏ·(1 − p)ⁿ⁻ᵏ", "distribuzione binomiale, con n prove indipendenti di probabilità p; media np, varianza np(1 − p)"],
      ["P(|X̄ₙ − μ| ≥ ε) ≤ σ²/(n·ε²)", "disuguaglianza di Čebyšëv applicata alla media, da cui la legge debole dei grandi numeri con varianza finita"],
      ["√n·(X̄ₙ − μ)/σ → N(0, 1)", "teorema del limite centrale, per variabili indipendenti e identicamente distribuite con varianza finita e positiva"],
      ["P(M | +) = P(+ | M)·P(M) / [P(+ | M)·P(M) + P(+ | non M)·P(non M)]", "teorema di Bayes per il valore predittivo positivo"]
    ],
    ipotesi: [
      "Binomiale: prove indipendenti con la stessa probabilità di successo.",
      "Legge dei grandi numeri: variabili indipendenti e identicamente distribuite con media finita.",
      "Limite centrale (forma classica): indipendenza, identica distribuzione e varianza finita e positiva; la convergenza è in distribuzione.",
      "Il valore predittivo dipende dalla prevalenza nella popolazione testata, non solo dalle caratteristiche del test."
    ],
    errori: [
      "La fallacia del giocatore: credere che dopo molte teste la croce diventi più probabile.",
      "Confondere sensibilità e valore predittivo positivo, cioè P(+ | M) con P(M | +).",
      "Pensare che il limite centrale renda normali i singoli dati: riguarda la distribuzione delle medie.",
      "Aspettarsi che l'errore del Monte Carlo scenda come 1/N invece che come 1/√N."
    ],
    esempio: {
      testo: "Un test ha sensibilità 90 % e specificità 95 %, e la malattia ha prevalenza 1 %. Su 1000 persone, 10 sono malate e 9 risultano positive; delle 990 sane, il 5 %, cioè 49,5, risultano positive. Il valore predittivo positivo è 9/(9 + 49,5) = 0,154: solo un positivo su sei e mezzo è davvero malato.",
      risultato: "P(M | +) ≈ 0,154, cioè circa 15 %"
    },
    fonti: [
      "Ross, A First Course in Probability, Pearson, cap. 3 (probabilità condizionata e Bayes), cap. 4 (binomiale), cap. 8 (teoremi limite)",
      "Baldi, Calcolo delle probabilità, McGraw-Hill, capitoli sulle leggi dei grandi numeri e sul teorema limite centrale",
      "Feller, An Introduction to Probability Theory and Its Applications, vol. 1, Wiley, 3ª ed., cap. VII (approssimazione normale della binomiale) e cap. X (leggi dei grandi numeri)",
      "Gigerenzer, Hoffrage, How to improve Bayesian reasoning without instruction: frequency formats, Psychological Review 102 (1995)"
    ],
    collegamenti: ['smatinfer', 'smatstat', 'smatmarkov', 'sfisstat']
  };

  /* ── smatvis ──────────────────────────────────────────────────────────── */
  T['smatvis'] = {
    titolo: "Trasformazioni lineari, epicicli di Fourier, frattali e caos",
    sintesi: "Alcune idee matematiche si capiscono meglio guardandole muoversi. Una matrice 2 × 2 deforma il piano e il suo determinante misura le aree; la trasformata di Fourier discreta scompone una figura chiusa in cerchi rotanti; l'iterazione di z ↦ z² + c genera gli insiemi di Mandelbrot e di Julia; la mappa logistica mostra come un sistema semplicissimo passi dall'ordine al caos per raddoppi successivi del periodo.",
    paragrafi: [
      { titolo: "Trasformazioni lineari del piano",
        testo: "Una matrice A di ordine 2 manda il vettore x in Ax, porta rette in rette e conserva l'origine e il parallelismo. Le colonne di A sono le immagini dei vettori della base canonica, quindi il quadrato unitario diventa il parallelogramma generato dalle due colonne, di area |det A|; se det A < 0 l'orientamento si inverte, se det A = 0 il piano collassa su una retta o su un punto. Un autovettore reale v con Av = λv resta sulla propria retta e viene dilatato di λ, ribaltato se λ < 0. Se gli autovalori sono complessi non esiste alcuna direzione invariante e la trasformazione contiene una rotazione. L'animazione interpola dall'identità ad A con (1 − t)I + tA, ed è un'interpolazione fra matrici, non un moto fisico." },
      { titolo: "Epicicli e trasformata di Fourier discreta",
        testo: "Una curva chiusa nel piano si legge come funzione complessa z(t), e campionata in N punti z₀, …, z_{N−1} ha trasformata di Fourier discreta cₖ = (1/N)Σₙ zₙ·e^(−2πikn/N). La formula di inversione zₙ = Σₖ cₖ·e^(2πikn/N) dice che la curva è la somma di N cerchi: il k-esimo ha raggio |cₖ|, fase iniziale arg cₖ e ruota con frequenza intera k. Ordinando i termini per raggio decrescente e tenendone solo alcuni si ottiene un'approssimazione liscia della figura; gli spigoli richiedono molte frequenze alte, perché i coefficienti di una funzione con discontinuità della derivata decrescono lentamente. È la stessa matematica delle serie di Fourier, in versione discreta, e degli epicicli dell'astronomia tolemaica." },
      { titolo: "Gli insiemi di Mandelbrot e di Julia",
        testo: "Fissato c ∈ ℂ, si itera zₙ₊₁ = zₙ² + c. L'insieme di Mandelbrot è l'insieme dei c per cui l'orbita di z₀ = 0 resta limitata. Vale un criterio rigoroso: se per qualche n si ha |zₙ| > 2, l'orbita diverge; quindi il colore di un punto esterno può essere il numero di iterazioni necessarie per superare il raggio 2. Per un dato c, l'insieme di Julia pieno è l'insieme dei punti iniziali z₀ con orbita limitata, e l'insieme di Julia è la sua frontiera. Un risultato classico collega i due oggetti: l'insieme di Julia è connesso se c appartiene all'insieme di Mandelbrot, totalmente sconnesso, una polvere di Cantor, se non vi appartiene. Il programma decide con un numero finito di iterazioni, quindi vicino al bordo l'immagine è un'approssimazione." },
      { titolo: "La mappa logistica e la via verso il caos",
        testo: "La mappa xₙ₊₁ = r·xₙ(1 − xₙ) con r ∈ [0, 4] manda [0, 1] in sé. Per 1 < r < 3 il punto fisso x* = 1 − 1/r è attrattivo, perché la derivata della mappa in x* vale 2 − r e ha modulo minore di 1. A r = 3 il punto fisso perde stabilità e nasce un ciclo di periodo 2, che a sua volta si destabilizza a r = 1 + √6 ≈ 3,449 dando un ciclo di periodo 4, e così via. Gli intervalli fra un raddoppio e il successivo si accorciano in rapporto che tende alla costante di Feigenbaum δ ≈ 4,6692, la stessa per un'ampia classe di mappe unimodali; la cascata si accumula a r ≈ 3,5699, oltre il quale compaiono il caos e le finestre periodiche. Il diagramma a ragnatela visualizza l'iterazione rimbalzando fra il grafico e la bisettrice." }
    ],
    formule: [
      ["Area(A·Q) = |det A|·Area(Q)", "una trasformazione lineare moltiplica le aree per |det A|"],
      ["cₖ = (1/N)·Σₙ₌₀^{N−1} zₙ·e^(−2πikn/N)", "trasformata di Fourier discreta dei campioni di una curva chiusa"],
      ["|zₙ| > 2 ⇒ |zₖ| → ∞", "criterio di fuga per l'iterazione z ↦ z² + c a partire da z₀ = 0, per ogni c"],
      ["x* = 1 − 1/r,  f′(x*) = 2 − r", "punto fisso non banale della mappa logistica, attrattivo per 1 < r < 3"],
      ["δ = lim (rₙ − rₙ₋₁)/(rₙ₊₁ − rₙ) ≈ 4,6692", "costante di Feigenbaum, dai valori rₙ dei raddoppi di periodo"]
    ],
    ipotesi: [
      "La lettura geometrica degli autovettori vale per autovalori reali; quelli complessi indicano una rotazione.",
      "La ricostruzione con la DFT è esatta solo nei punti campionati; fra un campione e l'altro è un'interpolazione trigonometrica.",
      "Il disegno dei frattali usa un numero finito di iterazioni: i punti che fuggono lentamente possono essere colorati come interni.",
      "L'universalità di Feigenbaum vale per mappe unimodali con massimo quadratico."
    ],
    errori: [
      "Credere che det A misuri la dilatazione di ogni lunghezza: misura il fattore delle aree.",
      "Pensare che caotico significhi casuale: la mappa logistica è deterministica, ma sensibile alle condizioni iniziali.",
      "Ritenere che l'insieme di Mandelbrot sia l'unione degli insiemi di Julia: è l'insieme dei parametri c per cui Julia è connesso.",
      "Dimenticare che con N campioni le frequenze sopra N/2 si confondono con quelle negative (aliasing)."
    ],
    esempio: {
      testo: "Studiare la mappa logistica con r = 2,8. Il punto fisso non banale è x* = 1 − 1/2,8 ≈ 0,6429. La derivata f′(x) = r(1 − 2x) in x* vale 2 − r = −0,8, di modulo minore di 1: il punto è attrattivo, e poiché la derivata è negativa le iterazioni vi si avvicinano oscillando da una parte e dall'altra, come mostra la ragnatela.",
      risultato: "x* ≈ 0,6429, attrattivo con convergenza oscillante (f′(x*) = −0,8)"
    },
    fonti: [
      "Strogatz, Nonlinear Dynamics and Chaos, Westview Press, cap. 10 (mappe unidimensionali, mappa logistica, Feigenbaum)",
      "Devaney, An Introduction to Chaotic Dynamical Systems, Westview Press, capitoli sulla mappa quadratica e sugli insiemi di Julia e Mandelbrot",
      "Feigenbaum, Quantitative universality for a class of nonlinear transformations, Journal of Statistical Physics 19 (1978)",
      "Strang, Linear Algebra and Its Applications, Cengage, 4ª ed., cap. 3 (trasformazioni lineari) e cap. 5 (autovalori)"
    ],
    collegamenti: ['smatlin', 'smatcompl', 'smatsvd', 'smatode']
  };

  /* ── smatnumeri ───────────────────────────────────────────────────────── */
  T['smatnumeri'] = {
    titolo: "Numeri primi, aritmetica modulare e crittografia RSA",
    sintesi: "I numeri primi sono i mattoni degli interi: ogni intero maggiore di 1 si scrive in un solo modo come prodotto di primi. L'algoritmo di Euclide calcola il massimo comun divisore e, nella versione estesa, gli inversi modulari. Su queste basi poggia RSA, un sistema a chiave pubblica sicuro finché fattorizzare il prodotto di due grandi primi resta impraticabile. Il teorema dei numeri primi descrive quanto sono frequenti.",
    paragrafi: [
      { titolo: "Primi e crivello di Eratostene",
        testo: "Un intero p > 1 è primo se i suoi soli divisori positivi sono 1 e p. Il teorema fondamentale dell'aritmetica afferma che ogni intero n > 1 è prodotto di primi in modo unico a meno dell'ordine; l'unicità si dimostra con il lemma di Euclide, secondo cui un primo che divide un prodotto divide almeno un fattore. I primi sono infiniti: dato un elenco finito, il prodotto di tutti più 1 non è divisibile per nessuno di essi. Il crivello di Eratostene trova tutti i primi fino a N cancellando i multipli di ogni primo p; si può partire da p², perché i multipli più piccoli hanno un fattore primo minore di p e sono già cancellati, e ci si può fermare a p ≤ √N, perché un numero composto ha un fattore primo non superiore alla propria radice." },
      { titolo: "Euclide, Bézout e l'inverso modulare",
        testo: "L'algoritmo di Euclide si basa su MCD(a, b) = MCD(b, a mod b) e termina perché i resti decrescono; il numero di passi è al più proporzionale al numero di cifre del minore (teorema di Lamé). Ripercorrendo i passi all'indietro, o tenendo traccia dei coefficienti, l'algoritmo esteso trova interi x e y con ax + by = MCD(a, b): è l'identità di Bézout. Se MCD(a, n) = 1, la relazione ax + ny = 1 dice che ax ≡ 1 (mod n), cioè x è l'inverso di a modulo n; se invece MCD(a, n) > 1 l'inverso non esiste. La potenza modulare aᵏ mod n si calcola con il metodo dei quadrati ripetuti, che legge k in binario e richiede un numero di moltiplicazioni proporzionale a log k invece che a k." },
      { titolo: "Aritmetica modulare e teorema di Eulero",
        testo: "Due interi sono congrui modulo n se hanno lo stesso resto nella divisione per n; le classi di resto ℤₙ si sommano e si moltiplicano in modo compatibile. Gli elementi invertibili di ℤₙ sono le classi coprime con n, e sono φ(n), dove φ è la funzione di Eulero; per p primo φ(p) = p − 1, per p e q primi distinti φ(pq) = (p − 1)(q − 1). Il teorema di Eulero afferma che a^φ(n) ≡ 1 (mod n) per ogni a coprimo con n; per n primo è il piccolo teorema di Fermat. Le figure «sull'orologio» della sezione uniscono ogni punto k di un cerchio diviso in n parti al punto mk mod n: per m = 2 e m = 3, con n grande, le corde inviluppano una cardioide e una nefroide." },
      { titolo: "RSA",
        testo: "Si scelgono due primi grandi p e q, si pone n = pq e si sceglie un esponente pubblico e coprimo con φ(n) = (p − 1)(q − 1); con Euclide esteso si calcola d, inverso di e modulo φ(n). La chiave pubblica è (n, e), quella privata d. Un messaggio 0 ≤ m < n si cifra con c = mᵉ mod n e si decifra con m = cᵈ mod n. La correttezza segue dal teorema di Eulero quando m è coprimo con n, e dal teorema cinese del resto negli altri casi. Chi conosce p e q calcola d immediatamente; non si conosce un algoritmo classico efficiente per fattorizzare n, e la sicurezza di RSA si basa su questa difficoltà, che però non è dimostrata. RSA usato così, senza riempimento casuale, è deterministico e insicuro: nella pratica si usano schemi come OAEP." },
      { titolo: "Il teorema dei numeri primi",
        testo: "Sia π(x) il numero di primi non superiori a x. Il teorema dei numeri primi, dimostrato nel 1896 da Hadamard e de la Vallée Poussin, afferma che π(x) è asintotico a x/ln x, cioè che il loro rapporto tende a 1. Un'approssimazione molto migliore è il logaritmo integrale Li(x), l'integrale di dt/ln t a partire da 2: per x = 10⁶ si ha π(x) = 78 498, mentre x/ln x ≈ 72 382 e Li(x) ≈ 78 627. Asintotico non vuol dire vicino in valore assoluto: la differenza π(x) − x/ln x cresce senza limite, solo più lentamente di π(x). Quanto sia piccolo l'errore π(x) − Li(x) è legato all'ipotesi di Riemann, ancora aperta: se è vera, l'errore non supera una costante per √x·ln x." }
    ],
    formule: [
      ["MCD(a, b) = MCD(b, a mod b)", "passo dell'algoritmo di Euclide, per b ≠ 0"],
      ["a·x + b·y = MCD(a, b)", "identità di Bézout: x e y interi esistono sempre e si trovano con Euclide esteso"],
      ["a^φ(n) ≡ 1 (mod n)", "teorema di Eulero, per a coprimo con n"],
      ["c = mᵉ mod n,  m = cᵈ mod n,  e·d ≡ 1 (mod φ(n))", "cifratura e decifratura RSA con n = pq"],
      ["π(x) ~ x/ln x", "teorema dei numeri primi: il rapporto tende a 1 per x → ∞"]
    ],
    ipotesi: [
      "L'inverso modulare di a esiste se e solo se MCD(a, n) = 1.",
      "Il piccolo teorema di Fermat richiede n primo e a non multiplo di n.",
      "La sicurezza di RSA dipende dalla difficoltà, non dimostrata, della fattorizzazione e da un uso corretto con riempimento casuale.",
      "Il teorema dei numeri primi è un risultato asintotico, non una stima con errore esplicito."
    ],
    errori: [
      "Credere che 1 sia primo: escluderlo è ciò che rende unica la fattorizzazione.",
      "Pensare che a^(n−1) ≡ 1 (mod n) dimostri che n è primo: i numeri di Carmichael, come 561, superano il test.",
      "Calcolare d come inverso di e modulo n invece che modulo φ(n).",
      "Leggere π(x) ~ x/ln x come se la differenza fra le due quantità tendesse a zero."
    ],
    esempio: {
      testo: "RSA in miniatura con p = 61 e q = 53. Si ha n = 3233 e φ(n) = 60·52 = 3120. Con e = 17, coprimo con 3120, Euclide esteso dà d = 2753, infatti 17·2753 = 46 801 = 15·3120 + 1. Il messaggio m = 65 si cifra in c = 65¹⁷ mod 3233 = 2790, e 2790²⁷⁵³ mod 3233 restituisce 65.",
      risultato: "chiave pubblica (3233, 17), privata d = 2753; 65 → 2790 → 65"
    },
    fonti: [
      "Hardy, Wright, An Introduction to the Theory of Numbers, Oxford University Press, 6ª ed., cap. 1–2 (primi), cap. 5–6 (congruenze, Fermat ed Eulero), cap. 22 (teorema dei numeri primi)",
      "Rivest, Shamir, Adleman, A method for obtaining digital signatures and public-key cryptosystems, Communications of the ACM 21 (1978)",
      "Cormen, Leiserson, Rivest, Stein, Introduction to Algorithms, MIT Press, 3ª ed., cap. 31 (Number-Theoretic Algorithms)",
      "Koblitz, A Course in Number Theory and Cryptography, Springer, 2ª ed., cap. 1 e cap. 4 (crittografia a chiave pubblica)"
    ],
    collegamenti: ['smatalgebra', 'smatcodici', 'smatlogica']
  };

  /* ── smatgrafi ────────────────────────────────────────────────────────── */
  T['smatgrafi'] = {
    titolo: "Grafi e ottimizzazione: cammini minimi, alberi, gradiente e programmazione lineare",
    sintesi: "Molti problemi di ottimizzazione hanno una struttura discreta, un grafo di nodi e archi pesati, oppure continua, una funzione da minimizzare. Dijkstra trova i cammini minimi e Kruskal l'albero di copertura di peso minimo con strategie golose che si possono dimostrare corrette. La discesa del gradiente minimizza funzioni regolari se il passo è adatto alla curvatura. Nella programmazione lineare l'ottimo, quando esiste, si trova in un vertice della regione ammissibile.",
    paragrafi: [
      { titolo: "Grafi pesati e algoritmo di Dijkstra",
        testo: "Un grafo pesato è un insieme di nodi collegati da archi a cui è associato un costo. Il cammino minimo da una sorgente s a ogni altro nodo si trova con l'algoritmo di Dijkstra, che richiede pesi non negativi. Si mantiene per ogni nodo una distanza provvisoria, inizialmente infinita tranne d(s) = 0; a ogni passo si rende definitivo il nodo non ancora fissato con distanza provvisoria minima, e si rilassano gli archi uscenti: se d(u) + w(u, v) < d(v) si aggiorna d(v) e si ricorda che il predecessore di v è u. La correttezza si dimostra per induzione: quando un nodo viene estratto, ogni altro cammino verso di esso dovrebbe passare per un nodo della frontiera con distanza almeno uguale, e i pesi non negativi impediscono di accorciarlo. Con pesi negativi l'argomento cade e serve l'algoritmo di Bellman–Ford." },
      { titolo: "Albero di copertura minimo e Kruskal",
        testo: "In un grafo connesso non orientato, un albero di copertura è un sottoinsieme di archi che collega tutti i nodi senza cicli; con n nodi ha sempre n − 1 archi. L'algoritmo di Kruskal ordina gli archi per peso crescente e li aggiunge uno alla volta, scartando quelli che chiuderebbero un ciclo; per accorgersene usa una struttura union-find che tiene le componenti connesse già formate. La strategia golosa è corretta per la proprietà del taglio: per ogni partizione dei nodi in due parti, un arco di peso minimo fra quelli che attraversano la partizione appartiene a qualche albero di copertura minimo. Se tutti i pesi sono distinti l'albero minimo è unico. Il tempo è dominato dall'ordinamento, dell'ordine di m log m per m archi." },
      { titolo: "Discesa del gradiente",
        testo: "Per minimizzare una funzione differenziabile f si itera xₖ₊₁ = xₖ − η∇f(xₖ). Il comportamento è chiarissimo sulla quadratica f(x, y) = (a x² + b y²)/2 con a, b > 0: ogni coordinata viene moltiplicata a ogni passo per (1 − ηa) e (1 − ηb), quindi la discesa converge se e solo se η < 2/max(a, b), oscilla quando un fattore è negativo e diverge quando un fattore supera 1 in modulo. Se a e b sono molto diversi, il passo è limitato dalla curvatura maggiore e la direzione piatta procede lentamente, con il classico zigzag; la velocità dipende dal rapporto di condizionamento max/min. Il metodo del momento aggiunge una frazione del passo precedente e smorza lo zigzag. È lo stesso schema, con molte varianti, con cui si adattano i modelli ai dati." },
      { titolo: "Programmazione lineare",
        testo: "Un problema di programmazione lineare chiede di massimizzare o minimizzare una funzione lineare c·x su un insieme definito da disuguaglianze lineari. L'insieme ammissibile è un poliedro convesso, intersezione di semipiani. Il teorema fondamentale afferma che, se il poliedro ha almeno un vertice e l'ottimo esiste finito, allora è raggiunto in un vertice; l'ottimo può anche essere assunto lungo un intero lato, se la funzione obiettivo è parallela a esso, o non esistere, se la regione è vuota o la funzione è illimitata. In due variabili si possono confrontare direttamente i valori nei vertici, come fa la sezione, e vedere le rette di livello dell'obiettivo che scorrono fino all'ultimo punto della regione. In molte variabili il metodo del simplesso percorre i vertici lungo gli spigoli migliorando l'obiettivo." }
    ],
    formule: [
      ["d(v) ← min(d(v), d(u) + w(u, v))", "rilassamento di un arco nell'algoritmo di Dijkstra, con pesi w ≥ 0"],
      ["|E(T)| = n − 1", "numero di archi di un albero di copertura di un grafo connesso con n nodi"],
      ["xₖ₊₁ = xₖ − η·∇f(xₖ)", "discesa del gradiente con passo η"],
      ["η < 2/λ_max", "condizione di convergenza della discesa a passo fisso su una quadratica con hessiana definita positiva di autovalore massimo λ_max"],
      ["max c·x  con  A·x ≤ b, x ≥ 0", "forma di un problema di programmazione lineare; se l'ottimo esiste finito ed esiste un vertice, è raggiunto in un vertice"]
    ],
    ipotesi: [
      "Dijkstra richiede pesi non negativi.",
      "Kruskal richiede un grafo non orientato; se non è connesso produce una foresta di copertura minima.",
      "La convergenza della discesa del gradiente a passo fisso dipende dalla curvatura; per funzioni non convesse si arriva al più a un punto stazionario.",
      "Il teorema del vertice richiede che l'ottimo esista finito e che il poliedro abbia almeno un vertice."
    ],
    errori: [
      "Usare Dijkstra con pesi negativi: il risultato può essere sbagliato senza alcun segnale d'errore.",
      "Pensare che l'albero di copertura minimo contenga il cammino minimo fra due nodi qualsiasi: sono problemi diversi.",
      "Aumentare il passo della discesa per andare più in fretta oltre 2/λ_max: la successione diverge.",
      "Cercare l'ottimo di un problema lineare all'interno della regione: una funzione lineare non costante non ha punti stazionari interni."
    ],
    esempio: {
      testo: "Massimizzare z = 3x + 5y con x ≤ 4, 2y ≤ 12, 3x + 2y ≤ 18, x ≥ 0, y ≥ 0. I vertici della regione sono (0, 0), (4, 0), (4, 3), (2, 6) e (0, 6), dove (4, 3) viene da x = 4 e 3x + 2y = 18, e (2, 6) da y = 6 e 3x + 2y = 18. I valori di z sono 0, 12, 27, 36 e 30.",
      risultato: "ottimo in (2, 6) con z = 36"
    },
    fonti: [
      "Cormen, Leiserson, Rivest, Stein, Introduction to Algorithms, MIT Press, 3ª ed., cap. 23 (Minimum Spanning Trees), cap. 24 (Single-Source Shortest Paths), cap. 29 (Linear Programming)",
      "Hillier, Lieberman, Introduction to Operations Research, McGraw-Hill, capitoli sulla programmazione lineare e il metodo del simplesso",
      "Nocedal, Wright, Numerical Optimization, Springer, 2ª ed., cap. 3 (metodi di discesa e velocità di convergenza)",
      "Dijkstra, A note on two problems in connexion with graphs, Numerische Mathematik 1 (1959)"
    ],
    collegamenti: ['smatmulti', 'smatmarkov', 'smatgiochi', 'smatlin']
  };

  /* ── smatserie ────────────────────────────────────────────────────────── */
  T['smatserie'] = {
    titolo: "Successioni, serie numeriche, riordinamenti e serie di potenze",
    sintesi: "Il limite di una successione si definisce con ε e N, senza ricorrere all'intuizione dell'«avvicinarsi». Una serie è la successione delle sue somme parziali, e i criteri del confronto, del rapporto, della radice, dell'integrale e di Leibniz ne stabiliscono il carattere. Le serie assolutamente convergenti si possono riordinare liberamente; quelle solo condizionatamente convergenti no, per il teorema di Riemann. Le serie di potenze convergono in un disco il cui raggio è fissato dalle singolarità più vicine.",
    paragrafi: [
      { titolo: "Il limite di una successione",
        testo: "Una successione aₙ converge a L se per ogni ε > 0 esiste un indice N tale che |aₙ − L| < ε per ogni n ≥ N. La definizione è un gioco a due: si sceglie la tolleranza ε, e si deve poter rispondere con un N oltre il quale tutti i termini, non solo alcuni, stanno nella fascia [L − ε, L + ε]. N dipende da ε e di solito cresce quando ε diminuisce. Per (−1)ⁿ nessun L funziona: con ε = 1/2 la fascia non può contenere sia 1 sia −1, e la successione non ha limite, pur avendo due sottosuccessioni convergenti. Il limite, se esiste, è unico; ogni successione convergente è limitata; ogni successione monotona e limitata converge, proprietà equivalente alla completezza di ℝ." },
      { titolo: "Serie e criteri di convergenza",
        testo: "La serie Σaₙ converge se converge la successione delle somme parziali Sₙ = a₁ + … + aₙ. Condizione necessaria è aₙ → 0, ma non sufficiente: la serie armonica Σ1/n diverge. Per termini positivi valgono il confronto, il criterio del rapporto, che dà convergenza se lim aₙ₊₁/aₙ < 1 e divergenza se > 1, quello della radice con lim ⁿ√aₙ, e il criterio dell'integrale: se f è positiva, continua e decrescente su [1, ∞) con f(n) = aₙ, la serie e ∫₁^∞ f(x) dx hanno lo stesso carattere. Ne segue che la serie p, Σ1/nᵖ, converge se e solo se p > 1. Quando il limite del rapporto o della radice vale 1, come per tutte le serie p, quei criteri non decidono. Il criterio dell'integrale dà anche stime del resto: ∫_{N+1}^∞ f ≤ Σ_{n>N} aₙ ≤ ∫_N^∞ f." },
      { titolo: "Serie a segni alterni e criterio di Leibniz",
        testo: "Se bₙ ≥ 0 è decrescente e tende a zero, la serie Σ(−1)ⁿ⁺¹bₙ converge, e il resto dopo N termini ha modulo al più b_{N+1} e ha lo stesso segno del primo termine trascurato. È il criterio di Leibniz. L'armonica a segni alterni 1 − 1/2 + 1/3 − … converge così a ln 2, ma Σ|aₙ| è l'armonica, che diverge: la convergenza è solo condizionata. La convergenza assoluta, cioè la convergenza di Σ|aₙ|, implica la convergenza, perché ℝ è completo e le somme parziali formano una successione di Cauchy. La distinzione fra convergenza assoluta e condizionata non è una sottigliezza tecnica, come mostra il paragrafo seguente." },
      { titolo: "Riordinamenti: il teorema di Riemann",
        testo: "Se una serie converge assolutamente, ogni suo riordinamento converge alla stessa somma. Se invece converge solo condizionatamente, il teorema di Riemann afferma che per ogni numero reale S esiste un riordinamento che converge a S, e ne esistono anche di divergenti. L'idea della dimostrazione è l'algoritmo goloso della sezione: i termini positivi e quelli negativi formano due serie entrambe divergenti, con termini che tendono a zero; si prendono positivi finché la somma supera S, poi negativi finché scende sotto, e così via, con oscillazioni sempre più piccole. Applicata a Σ(−1)ⁿ⁺¹/n², che converge assolutamente a π²/12, la stessa permutazione non cambia la somma. La proprietà commutativa della somma, dunque, vale per le serie solo sotto ipotesi." },
      { titolo: "Serie di potenze e raggio di convergenza",
        testo: "Una serie di potenze Σcₙ(z − z₀)ⁿ converge assolutamente nel disco aperto |z − z₀| < R e diverge fuori dal disco chiuso, dove R = 1/limsup ⁿ√|cₙ| è il raggio dato dalla formula di Cauchy–Hadamard, con le convenzioni 1/0 = ∞ e 1/∞ = 0; se il limite di |cₙ/cₙ₊₁| esiste, coincide con R. Sul bordo può accadere di tutto e va studiato caso per caso. Il disco si capisce solo nel piano complesso: 1/(1 + x²) è regolare su tutta la retta reale, eppure la sua serie di Taylor in 0 ha raggio 1, perché la funzione ha poli in ±i. In generale, per una funzione olomorfa il raggio della serie di Taylor è la distanza dalla singolarità più vicina." }
    ],
    formule: [
      ["∀ε > 0 ∃N: n ≥ N ⇒ |aₙ − L| < ε", "definizione di limite di una successione"],
      ["Σ 1/nᵖ converge ⇔ p > 1", "serie p, dal criterio dell'integrale"],
      ["|S − S_N| ≤ b_{N+1}", "stima del resto per una serie a segni alterni che soddisfa le ipotesi di Leibniz"],
      ["1/R = limsup ⁿ√|cₙ|", "formula di Cauchy–Hadamard per il raggio di convergenza di una serie di potenze"],
      ["Σ 1/n² = π²/6,  Σ (−1)ⁿ⁺¹/n = ln 2,  Σ 1/n! = e", "somme note mostrate nella sezione (la terza con n da 0)"]
    ],
    ipotesi: [
      "Il criterio dell'integrale richiede f positiva, continua e decrescente.",
      "Leibniz richiede bₙ decrescente e infinitesima; senza monotonia la serie può divergere.",
      "I criteri del rapporto e della radice non decidono quando il limite vale 1.",
      "L'invarianza della somma per riordinamento vale per le serie assolutamente convergenti."
    ],
    errori: [
      "Concludere che una serie converge perché il termine generale tende a zero (controesempio: l'armonica).",
      "Applicare il criterio del rapporto a Σ1/n² e dedurre la divergenza dal limite uguale a 1.",
      "Raggruppare o riordinare liberamente i termini di una serie solo condizionatamente convergente.",
      "Pensare che il raggio di convergenza di una funzione reale regolare ovunque sia infinito."
    ],
    esempio: {
      testo: "Stimare Σ1/n² con dieci termini. La somma parziale è S₁₀ ≈ 1,549768. Con f(x) = 1/x², il resto R₁₀ soddisfa ∫₁₁^∞ dx/x² = 1/11 ≤ R₁₀ ≤ ∫₁₀^∞ dx/x² = 1/10, quindi la somma sta fra 1,640677 e 1,649768. Il valore vero π²/6 ≈ 1,644934 è dentro l'intervallo, e il resto effettivo vale 0,095166.",
      risultato: "1,6407 ≤ Σ 1/n² ≤ 1,6498; valore esatto π²/6 ≈ 1,6449"
    },
    fonti: [
      "Bramanti, Pagani, Salsa, Analisi matematica 1, Zanichelli, capitoli su successioni e serie numeriche",
      "Rudin, Principles of Mathematical Analysis, McGraw-Hill, 3ª ed., cap. 3 (Numerical Sequences and Series), incluso il teorema di riordinamento di Riemann",
      "Giusti, Analisi matematica 1, Bollati Boringhieri, capitoli su successioni e serie",
      "Ahlfors, Complex Analysis, McGraw-Hill, 3ª ed., cap. 2 (serie di potenze e raggio di convergenza)"
    ],
    collegamenti: ['smatcalc', 'smatanalcomp', 'smatcompl', 'smatfunz']
  };

  /* ── smatvariaz ───────────────────────────────────────────────────────── */
  T['smatvariaz'] = {
    titolo: "Calcolo delle variazioni: brachistocrona, catenaria, catenoide e principio di Fermat",
    sintesi: "Il calcolo delle variazioni cerca la funzione, non il numero, che rende minimo un integrale: il tempo di discesa, l'energia potenziale di una catena, l'area di una pellicola, il tempo di percorrenza della luce. La condizione necessaria è l'equazione di Eulero–Lagrange. Le sue soluzioni sono la cicloide, il coseno iperbolico, il catenoide; ma un'estremale non è sempre un minimo, e a volte non esiste affatto.",
    paragrafi: [
      { titolo: "Funzionali ed equazione di Eulero–Lagrange",
        testo: "Un funzionale assegna un numero a una funzione: J[y] = ∫ₐᵇ F(x, y(x), y′(x)) dx, con y(a) e y(b) fissati. Se y è un minimo di J fra le funzioni di classe C¹ con quegli estremi, perturbandola in y + εη, con η nulla agli estremi, la derivata rispetto a ε in ε = 0 deve annullarsi. Integrando per parti e usando il lemma fondamentale del calcolo delle variazioni, se y e F sono abbastanza regolari, ad esempio y di classe C² e F di classe C², si ottiene l'equazione di Eulero–Lagrange ∂F/∂y − d/dx(∂F/∂y′) = 0. È una condizione necessaria, come f′ = 0 per i minimi delle funzioni: le sue soluzioni, dette estremali, possono essere minimi, massimi o punti di sella del funzionale. Quando F non dipende esplicitamente da x vale l'integrale primo di Beltrami F − y′·∂F/∂y′ = costante." },
      { titolo: "La brachistocrona",
        testo: "Una perlina scivola senza attrito da A a B, più in basso, sotto la gravità. Con l'asse y rivolto verso il basso e partenza da ferma, la conservazione dell'energia dà v = √(2gy), quindi il tempo è T = ∫ ds/v = ∫ √(1 + y′²)/√(2gy) dx. L'integrando non dipende da x, e l'identità di Beltrami porta a y(1 + y′²) = costante, risolta dalla cicloide x = R(θ − sin θ), y = R(1 − cos θ), la curva tracciata da un punto di una ruota che rotola. Imponendo il passaggio per B si ricavano R e l'angolo finale θ_f, e il tempo di discesa ha la forma chiusa T = √(R/g)·θ_f. Nella gara della sezione la cicloide batte il segmento, l'arco di cerchio e la parabola, anche se è più lunga del segmento: scendere ripida all'inizio fa guadagnare velocità presto." },
      { titolo: "Catenaria e catenoide",
        testo: "Una catena omogenea appesa per gli estremi minimizza l'energia potenziale ∫ y ds a lunghezza fissata; il vincolo si tratta con un moltiplicatore di Lagrange, e la soluzione è la catenaria y = a·cosh((x − x₀)/a) + c, con a, x₀ e c fissati dagli estremi e dalla lunghezza. La sezione la ottiene anche in modo discreto, con N maglie rigide che scendono lungo il gradiente dell'energia rispettando i vincoli. Una pellicola di sapone fra due anelli coassiali di raggio R a distanza h minimizza l'area di rotazione 2π∫ r√(1 + r′²) dz, che ha come estremali i catenoidi r = a·cosh(z/a). La condizione a·cosh(h/(2a)) = R ha due soluzioni se h/R < 1,3255, una sola al valore critico e nessuna oltre: allora la pellicola si strappa e restano i due dischi della soluzione di Goldschmidt, di area 2πR². Già da h/R ≈ 1,055 i due dischi hanno area minore e il catenoide stabile è solo un minimo locale." },
      { titolo: "Il principio di Fermat",
        testo: "La luce va da un punto a un altro lungo un cammino che rende stazionario il tempo di percorrenza ∫ n ds/c, dove n è l'indice di rifrazione; il termine esatto è stazionario, non minimo. Con due mezzi omogenei separati da un'interfaccia piana, minimizzare il tempo rispetto al punto di attraversamento dà la legge di Snell n₁ sin θ₁ = n₂ sin θ₂, con gli angoli misurati dalla normale. In un mezzo con indice n(y) che varia con la quota, l'integrando n(y)√(1 + y′²) non dipende da x, e Beltrami fornisce n(y)/√(1 + y′²) = costante, la forma continua della legge di Snell: è il meccanismo dei miraggi. Con n lineare in y l'equazione è la stessa della catena, e la soluzione è un coseno iperbolico. La sezione la trova con il metodo di tiro: si integra l'equazione dal punto di partenza variando l'angolo iniziale fino a colpire il bersaglio." }
    ],
    formule: [
      ["∂F/∂y − d/dx (∂F/∂y′) = 0", "equazione di Eulero–Lagrange per J[y] = ∫ F(x, y, y′) dx con estremi fissati; condizione necessaria per y di classe C²"],
      ["F − y′·∂F/∂y′ = costante", "identità di Beltrami, integrale primo quando F non dipende esplicitamente da x"],
      ["x = R(θ − sin θ),  y = R(1 − cos θ),  T = √(R/g)·θ_f", "cicloide brachistocrona (y verso il basso) e tempo di discesa da fermo"],
      ["y = a·cosh((x − x₀)/a) + c", "catenaria, e profilo del catenoide come superficie minima di rotazione"],
      ["n₁·sin θ₁ = n₂·sin θ₂", "legge di Snell, dal principio di Fermat"]
    ],
    ipotesi: [
      "Eulero–Lagrange è una condizione necessaria, non sufficiente: per un minimo servono condizioni aggiuntive (Legendre, Jacobi) o argomenti di convessità.",
      "La derivazione classica richiede regolarità di F e della soluzione; minimi meno regolari richiedono la forma integrale dell'equazione.",
      "Il catenoide esiste solo per h/R ≤ 1,3255 circa ed è minimo globale solo per h/R ≲ 1,055.",
      "La brachistocrona classica assume partenza da ferma, assenza di attrito e gravità uniforme."
    ],
    errori: [
      "Credere che ogni soluzione dell'equazione di Eulero–Lagrange sia un minimo.",
      "Pensare che la curva più veloce sia la più corta: il segmento è più corto della cicloide ma più lento.",
      "Dimenticare il vincolo di lunghezza nella catenaria: senza di esso il problema non ha una soluzione sensata.",
      "Dire che la luce minimizza sempre il tempo: il cammino è stazionario, e talvolta il tempo è massimo o di sella."
    ],
    esempio: {
      testo: "Una perlina parte da ferma da A = (0, 0) e arriva a B = (πR, 2R) con R = 1 m e g = 9,81 m/s², y verso il basso. B è il punto più basso della cicloide di raggio 1 m, con θ_f = π, quindi T = π·√(1/9,81) ≈ 1,003 s. Lungo il segmento AB, lungo L = √(π² + 4) ≈ 3,724 m e con accelerazione costante g·2/L, il tempo è √(2L²/(2g)) = L/√g ≈ 1,189 s.",
      risultato: "cicloide 1,003 s contro segmento 1,189 s"
    },
    fonti: [
      "Gelfand, Fomin, Calculus of Variations, Prentice-Hall (ristampa Dover), cap. 1 (equazione di Eulero–Lagrange) e cap. 5 (condizioni sufficienti)",
      "Goldstein, Poole, Safko, Classical Mechanics, Addison-Wesley, 3ª ed., cap. 2 (principi variazionali, brachistocrona, superficie minima di rotazione)",
      "Courant, Hilbert, Methods of Mathematical Physics, vol. 1, Wiley, cap. IV (calcolo delle variazioni)",
      "Isenberg, The Science of Soap Films and Soap Bubbles, Dover, capitoli sul catenoide e sulle superfici minime"
    ],
    collegamenti: ['smatode', 'smatfrenet', 'smatmulti', 'sfismecc']
  };

  /* ── smattopo ─────────────────────────────────────────────────────────── */
  T['smattopo'] = {
    titolo: "Caratteristica di Eulero, superfici, poligoni fondamentali e nodi",
    sintesi: "La topologia studia le proprietà che non cambiano per deformazioni continue con inversa continua. La caratteristica di Eulero V − S + F è il primo esempio: vale 2 per ogni poliedro convesso e 0 per una cornice con un buco. Le superfici compatte si classificano completamente con l'orientabilità e la caratteristica, e si costruiscono incollando i lati di un poligono. Per i nodi servono invarianti più fini, come il numero di colorazioni di Fox.",
    paragrafi: [
      { titolo: "La caratteristica di Eulero dei poliedri",
        testo: "Per un poliedro con V vertici, S spigoli e F facce si definisce χ = V − S + F. La formula di Eulero afferma che χ = 2 per ogni poliedro convesso, e più in generale per ogni poliedro la cui superficie è omeomorfa a una sfera: il cubo ha 8 − 12 + 6 = 2, l'icosaedro 12 − 30 + 20 = 2. Il motivo è che χ non dipende dalla suddivisione: si può calcolare per una qualunque triangolazione della superficie e si ottiene sempre lo stesso numero, quindi è un invariante topologico della superficie. Un poliedro a forma di cornice, omeomorfo al toro, ha χ = 0. Per una superficie chiusa orientabile con g «manici», cioè di genere g, vale χ = 2 − 2g. Combinando χ = 2 con il fatto che ogni faccia ha almeno tre lati e ogni vertice almeno tre spigoli si dimostra che i solidi platonici sono esattamente cinque." },
      { titolo: "Superfici e orientabilità",
        testo: "Una superficie è uno spazio che vicino a ogni punto somiglia a un disco del piano, o a un semidisco nei punti del bordo. È orientabile se si può scegliere con continuità un verso della normale, o equivalentemente se nessun cammino chiuso riporta una piccola freccia normale capovolta al punto di partenza; il nastro di Möbius e la bottiglia di Klein non lo sono, ed è ciò che la sezione mostra trasportando la freccia lungo un giro. La bottiglia di Klein non si può immergere in ℝ³ senza autointersezioni, e la sezione ne disegna l'immersione «a otto». Il teorema di classificazione afferma che ogni superficie compatta connessa senza bordo è omeomorfa a una sfera, a una somma connessa di g tori, con χ = 2 − 2g, oppure a una somma connessa di k piani proiettivi, con χ = 2 − k: orientabilità e χ la determinano completamente. Con il bordo serve anche il numero delle componenti del bordo." },
      { titolo: "Poligoni fondamentali",
        testo: "Ogni superficie compatta si ottiene da un poligono incollando i lati a coppie secondo una parola: nel quadrato, aba⁻¹b⁻¹ dà il toro, abab⁻¹ la bottiglia di Klein, abab il piano proiettivo, abb⁻¹a⁻¹ la sfera. Dopo l'incollamento i vertici si raggruppano in classi, i lati sono le coppie identificate e la faccia è una sola, quindi χ = (classi di vertici) − (coppie di lati) + 1. La superficie è non orientabile se e solo se qualche lettera compare due volte con lo stesso esponente, perché quel lato viene incollato con un mezzo giro. Nel toro tutti e quattro i vertici del quadrato diventano un solo punto e χ = 1 − 2 + 1 = 0; nel piano proiettivo restano due classi di vertici e χ = 2 − 2 + 1 = 1. La sezione calcola tutto questo per una parola qualsiasi." },
      { titolo: "Nodi e colorazioni di Fox",
        testo: "Un nodo è una curva chiusa semplice nello spazio, e due nodi sono equivalenti se uno si deforma nell'altro senza tagli né autointersezioni. Per distinguerli servono invarianti, quantità che non cambiano per le mosse di Reidemeister sui diagrammi piani. Una colorazione di Fox modulo p assegna a ogni arco del diagramma un elemento di ℤₚ in modo che a ogni incrocio valga 2·(arco sopra) ≡ (arco sotto entrante) + (arco sotto uscente). Il numero di colorazioni è un invariante; per p primo è una potenza di p, perché le colorazioni formano il nucleo di un sistema lineare su ℤₚ, che la sezione risolve con l'eliminazione di Gauss. Il nodo banale ha solo le 3 colorazioni costanti modulo 3, il trifoglio ne ha 9: quindi il trifoglio non si può sciogliere. Un invariante uguale non prova l'equivalenza; per esempio il nodo a otto ha 3 tricolorazioni come il banale, ma 25 colorazioni modulo 5." }
    ],
    formule: [
      ["χ = V − S + F", "caratteristica di Eulero di un poliedro o di una superficie triangolata"],
      ["χ = 2 − 2g", "superficie chiusa orientabile di genere g (sfera g = 0, toro g = 1)"],
      ["χ = 2 − k", "somma connessa di k piani proiettivi, superficie chiusa non orientabile"],
      ["2·a ≡ b + c (mod p)", "condizione di Fox a ogni incrocio, con a arco sopra e b, c archi sotto"]
    ],
    ipotesi: [
      "χ = 2 vale per poliedri la cui superficie è omeomorfa a una sfera, per esempio quelli convessi; poliedri con buchi hanno χ diverso.",
      "Il teorema di classificazione riguarda superfici compatte e connesse; senza compattezza vale una teoria diversa.",
      "Un invariante diverso prova che due nodi sono diversi; un invariante uguale non prova che siano uguali.",
      "Il conteggio delle colorazioni come potenza di p richiede p primo, perché serve un campo per l'algebra lineare."
    ],
    errori: [
      "Credere che χ = V − S + F valga 2 per ogni poliedro: la cornice toroidale ha χ = 0.",
      "Pensare che il nastro di Möbius abbia due facce: ha una sola faccia e un solo bordo.",
      "Confondere omeomorfismo e immersione: la bottiglia di Klein non ha autointersezioni, le ha solo il suo disegno in ℝ³.",
      "Dedurre che due nodi sono equivalenti perché hanno lo stesso numero di tricolorazioni."
    ],
    esempio: {
      testo: "Identificare la superficie data dalla parola abab⁻¹ sul quadrato. I quattro vertici, seguendo le identificazioni dei lati a e b, formano un'unica classe; i lati sono due coppie e la faccia è una, quindi χ = 1 − 2 + 1 = 0. La lettera a compare due volte con lo stesso esponente, quindi la superficie non è orientabile. Una superficie chiusa non orientabile con χ = 0 è la somma di due piani proiettivi, k = 2.",
      risultato: "bottiglia di Klein: χ = 0, non orientabile"
    },
    fonti: [
      "Munkres, Topology, Prentice Hall, 2ª ed., cap. 12 (Classification of Surfaces)",
      "Massey, A Basic Course in Algebraic Topology, Springer, cap. 1 (superfici bidimensionali e loro classificazione)",
      "Adams, The Knot Book, American Mathematical Society, cap. 1 (tricolorabilità) e capitoli sugli invarianti",
      "Lickorish, An Introduction to Knot Theory, Springer, cap. 1 (diagrammi, mosse di Reidemeister e colorazioni)"
    ],
    collegamenti: ['smatnoneucl', 'smatfrenet', 'smatalgebra', 'smatlin']
  };

  /* ── smatalgebra ──────────────────────────────────────────────────────── */
  T['smatalgebra'] = {
    titolo: "Gruppi, permutazioni, anelli e campi finiti",
    sintesi: "Un gruppo è un insieme con un'operazione associativa, un elemento neutro e gli inversi: le simmetrie di un poligono, le permutazioni, gli interi modulo n con la somma. Il teorema di Lagrange vincola le dimensioni dei sottogruppi, la parità delle permutazioni spiega il gioco del quindici. Gli anelli aggiungono una seconda operazione; ℤₙ è un campo esattamente quando n è primo, e i campi finiti GF(pⁿ) si costruiscono con polinomi irriducibili.",
    paragrafi: [
      { titolo: "Gruppi e simmetrie dei poligoni",
        testo: "Un gruppo è un insieme G con un'operazione associativa che ha un elemento neutro e in cui ogni elemento ha un inverso; non si richiede la commutatività. Le simmetrie di un n-agono regolare formano il gruppo diedrale Dₙ, di ordine 2n: n rotazioni, multipli di 2π/n, e n riflessioni. Indicando con r la rotazione elementare e con s una riflessione, valgono rⁿ = e, s² = e e srs = r⁻¹, quindi rs ≠ sr per n ≥ 3 e il gruppo non è commutativo. La sezione costruisce la tavola di Cayley componendo davvero le permutazioni dei vertici; in ogni riga e colonna della tavola ogni elemento compare una sola volta. L'ordine di un elemento g è il più piccolo k ≥ 1 con gᵏ = e: le riflessioni hanno ordine 2, la rotazione elementare ordine n." },
      { titolo: "Lagrange e classi laterali",
        testo: "Se H è un sottogruppo di un gruppo finito G, le classi laterali sinistre gH sono disgiunte, hanno tutte |H| elementi e ricoprono G: quindi |H| divide |G|. È il teorema di Lagrange, e ne segue che l'ordine di ogni elemento divide l'ordine del gruppo. Il viceversa è falso: il gruppo alterno A₄, di ordine 12, non ha sottogruppi di ordine 6. Le classi sinistre gH e destre Hg coincidono per ogni g se e solo se H è normale; in questo caso le classi formano a loro volta un gruppo, il quoziente G/H. In Dₙ il sottogruppo delle rotazioni, di indice 2, è normale, mentre il sottogruppo {e, s} generato da una riflessione non lo è per n ≥ 3." },
      { titolo: "Permutazioni, segno e gioco del quindici",
        testo: "Ogni permutazione di un insieme finito si scrive in modo unico, a meno dell'ordine, come prodotto di cicli disgiunti, e il suo ordine è il minimo comune multiplo delle lunghezze dei cicli. Ogni permutazione è anche prodotto di trasposizioni, non in modo unico, ma la parità del loro numero è determinata: il segno vale +1 o −1 ed è moltiplicativo. Un ciclo di lunghezza k ha segno (−1)ᵏ⁻¹. Nel gioco del quindici ogni mossa è una trasposizione fra la casella vuota e una tessera adiacente; la parità della permutazione delle sedici caselle, combinata con la parità della distanza della casella vuota dalla sua posizione finale, non cambia mai. Ne segue che esattamente metà delle disposizioni sono raggiungibili da quella ordinata: per esempio, scambiare soltanto 14 e 15 è impossibile." },
      { titolo: "Anelli ℤₙ e campi finiti",
        testo: "In ℤₙ, con somma e prodotto modulo n, un elemento a è invertibile se e solo se MCD(a, n) = 1; se n non è primo esistono divisori dello zero, elementi non nulli con prodotto nullo, come 2·3 = 0 in ℤ₆. Quindi ℤₙ è un campo se e solo se n è primo. In ℤₚ il gruppo moltiplicativo degli elementi non nulli è ciclico, e un suo generatore si chiama radice primitiva: ogni elemento non nullo è una sua potenza, e l'esponente è il logaritmo discreto, facile da verificare e difficile da calcolare per p grande. Per ogni primo p e ogni n ≥ 1 esiste un campo con pⁿ elementi, unico a meno di isomorfismi, che si costruisce come GF(p)[x]/(f) con f irriducibile di grado n: GF(4) usa x² + x + 1 su GF(2). GF(4) non è ℤ₄, che non è nemmeno un campo." }
    ],
    formule: [
      ["|G| = [G : H]·|H|", "teorema di Lagrange per un sottogruppo H di un gruppo finito G"],
      ["|Dₙ| = 2n,  rⁿ = sₖ² = e,  s·r·s = r⁻¹", "gruppo diedrale delle simmetrie dell'n-agono regolare"],
      ["ord(σ) = mcm(ℓ₁, …, ℓₘ)", "ordine di una permutazione con cicli disgiunti di lunghezze ℓᵢ"],
      ["sgn(σ) = Π (−1)^(ℓᵢ − 1)", "segno di una permutazione dalla decomposizione in cicli"],
      ["GF(pⁿ) ≅ GF(p)[x]/(f(x))", "campo finito con pⁿ elementi, con f irriducibile di grado n su GF(p)"]
    ],
    ipotesi: [
      "Il teorema di Lagrange vale per gruppi finiti; non garantisce l'esistenza di sottogruppi di ogni ordine divisore.",
      "ℤₙ è un campo se e solo se n è primo.",
      "Il quoziente G/H è un gruppo solo se H è normale.",
      "La costruzione di GF(pⁿ) richiede un polinomio irriducibile; con uno riducibile il quoziente ha divisori dello zero."
    ],
    errori: [
      "Supporre che ogni gruppo sia commutativo: in Dₙ con n ≥ 3 rotazioni e riflessioni non commutano.",
      "Credere al viceversa di Lagrange: A₄ non ha sottogruppi di ordine 6.",
      "Identificare GF(4) con ℤ₄: in ℤ₄ l'elemento 2 non ha inverso.",
      "Calcolare l'ordine di una permutazione sommando le lunghezze dei cicli invece di prenderne il minimo comune multiplo."
    ],
    esempio: {
      testo: "Studiare σ = (1 2 3)(4 5) in S₅ e la radice primitiva 3 modulo 7. L'ordine di σ è mcm(3, 2) = 6 e il segno è (+1)·(−1) = −1, quindi σ è dispari. Le potenze di 3 modulo 7 sono 3, 2, 6, 4, 5, 1: compaiono tutti gli elementi non nulli, quindi 3 è radice primitiva e, per esempio, il logaritmo discreto di 6 in base 3 è 3.",
      risultato: "ord σ = 6, sgn σ = −1; 3 genera ℤ₇*, log₃ 6 = 3 mod 7"
    },
    fonti: [
      "Herstein, Topics in Algebra, Wiley, 2ª ed., cap. 2 (gruppi, Lagrange, permutazioni) e cap. 7 (campi finiti)",
      "Artin, Algebra, Pearson, 2ª ed., capitoli su gruppi, simmetrie e campi finiti",
      "Gallian, Contemporary Abstract Algebra, Cengage, capitoli sui gruppi diedrali, sulle permutazioni e sui campi finiti",
      "Piacentini Cattaneo, Algebra: un approccio algoritmico, Zanichelli, capitoli su gruppi e anelli"
    ],
    collegamenti: ['smatnumeri', 'smatcodici', 'smattopo', 'ssimm']
  };

  /* ── smatgiochi ───────────────────────────────────────────────────────── */
  T['smatgiochi'] = {
    titolo: "Teoria dei giochi: equilibri di Nash, dilemma ripetuto, minimax e Nim",
    sintesi: "La teoria dei giochi studia decisioni interdipendenti: il risultato di ciascuno dipende anche dalle scelte degli altri. In un equilibrio di Nash nessuno guadagna cambiando strategia da solo; nei giochi finiti un equilibrio esiste sempre, eventualmente in strategie miste. Il dilemma del prigioniero mostra che l'equilibrio può essere inefficiente, e la sua ripetizione apre la strada alla cooperazione. Nei giochi a turni con informazione perfetta il minimax e la somma-nim danno strategie ottimali.",
    paragrafi: [
      { titolo: "Giochi in forma normale ed equilibrio di Nash",
        testo: "Un gioco a due giocatori in forma normale è dato dagli insiemi di strategie e da due matrici di pagamenti, A per il giocatore di riga e B per quello di colonna. Una coppia di strategie è un equilibrio di Nash se ciascuna è una miglior risposta all'altra, cioè nessun giocatore può aumentare il proprio pagamento deviando unilateralmente. Una strategia mista è una distribuzione di probabilità sulle strategie pure, e il pagamento è il valore atteso. Il teorema di Nash afferma che ogni gioco con un numero finito di giocatori e di strategie pure ha almeno un equilibrio in strategie miste; la dimostrazione usa un teorema di punto fisso, di Brouwer o di Kakutani. Gli equilibri in strategie pure possono invece mancare, come in testa o croce, o essere più di uno, come nella caccia al cervo." },
      { titolo: "Equilibri misti e migliori risposte",
        testo: "In un gioco 2 × 2, sia p la probabilità con cui la riga gioca la prima strategia e q quella della colonna. In un equilibrio completamente misto ciascun giocatore è indifferente fra le proprie strategie pure, altrimenti metterebbe tutta la probabilità sulla migliore; quindi p si ricava imponendo che la colonna sia indifferente, e q imponendo che lo sia la riga. È un punto controintuitivo: la probabilità di un giocatore è fissata dai pagamenti dell'altro. Le migliori risposte, disegnate nel quadrato [0, 1]², sono spezzate a gradino; i loro punti di intersezione sono esattamente gli equilibri di Nash, puri nei vertici e misti all'interno. Nella battaglia dei sessi si trovano due equilibri puri e uno misto, con pagamento atteso più basso di entrambi i puri." },
      { titolo: "Il dilemma del prigioniero ripetuto",
        testo: "Nel dilemma del prigioniero, con i pagamenti tipici T = 5 > R = 3 > P = 1 > S = 0, tradire è una strategia strettamente dominante per entrambi: l'unico equilibrio è il tradimento reciproco, con pagamento 1 a testa, anche se la cooperazione darebbe 3. Se il gioco si ripete un numero indefinito di volte, con probabilità di continuare abbastanza alta, la cooperazione può essere sostenuta da strategie che puniscono i tradimenti: è il contenuto dei teoremi «folk». Nei tornei di Axelrod, strategie semplici e reciproche come colpo su colpo ottennero ottimi risultati, ma l'esito dipende dalla popolazione di avversari e dal rumore: con errori di esecuzione colpo su colpo cade in cicli di ritorsione, e varianti generose o Pavlov fanno meglio. La dinamica del replicatore fa crescere le strategie con pagamento medio superiore alla media." },
      { titolo: "Minimax, alfa-beta e Nim",
        testo: "Nei giochi finiti a somma zero con informazione perfetta e senza caso, come il tris, il teorema di Zermelo garantisce che uno dei giocatori ha una strategia vincente o entrambi possono garantirsi il pareggio. Il valore si calcola con il minimax sull'albero delle mosse: ogni giocatore sceglie la mossa che massimizza il proprio risultato supponendo che l'avversario faccia lo stesso; il tris giocato perfettamente finisce in parità. La potatura alfa-beta evita di esplorare rami che non possono cambiare la decisione e dà lo stesso valore del minimax completo, esplorando molti meno nodi. Nel Nim, con più mucchi da cui si toglie a turno un numero qualsiasi di oggetti da un solo mucchio e vince chi prende l'ultimo, il teorema di Bouton afferma che la posizione è perdente per chi muove se e solo se lo XOR delle dimensioni dei mucchi, la somma-nim, è zero." }
    ],
    formule: [
      ["uᵢ(sᵢ*, s₋ᵢ*) ≥ uᵢ(sᵢ, s₋ᵢ*) ∀sᵢ, ∀i", "definizione di equilibrio di Nash: nessuna deviazione unilaterale conviene"],
      ["p = (B₂₂ − B₂₁)/(B₁₁ − B₂₁ − B₁₂ + B₂₂)", "probabilità della prima riga nell'equilibrio misto di un gioco 2 × 2, dall'indifferenza della colonna; valida se cade in (0, 1)"],
      ["q = (A₂₂ − A₁₂)/(A₁₁ − A₁₂ − A₂₁ + A₂₂)", "probabilità della prima colonna, dall'indifferenza della riga"],
      ["n₁ ⊕ n₂ ⊕ … ⊕ nₖ = 0", "condizione di Bouton: posizione perdente per chi muove nel Nim normale"]
    ],
    ipotesi: [
      "Il teorema di Nash garantisce l'esistenza in giochi finiti e in strategie miste, non in strategie pure.",
      "Le formule dell'equilibrio misto 2 × 2 valgono quando i denominatori non sono nulli e le probabilità cadono strettamente fra 0 e 1.",
      "Il minimax presuppone avversari razionali e un gioco a somma zero con informazione perfetta.",
      "Il teorema di Bouton riguarda il Nim in versione normale, in cui vince chi prende l'ultimo oggetto."
    ],
    errori: [
      "Credere che un equilibrio di Nash sia il risultato migliore per tutti: nel dilemma del prigioniero è inefficiente.",
      "Calcolare la probabilità mista di un giocatore usando i suoi stessi pagamenti invece di quelli dell'avversario.",
      "Pensare che colpo su colpo sia la strategia migliore in assoluto: dipende dagli avversari e dal rumore.",
      "Confondere la somma-nim con la somma ordinaria delle dimensioni dei mucchi."
    ],
    esempio: {
      testo: "Battaglia dei sessi con A = [[2, 0], [0, 1]] e B = [[1, 0], [0, 2]]. Gli equilibri puri sono (1, 1) e (2, 2). Per l'equilibrio misto, l'indifferenza della colonna dà p·1 = (1 − p)·2, cioè p = 2/3; quella della riga dà q·2 = (1 − q)·1, cioè q = 1/3. Il pagamento atteso di entrambi è 2·(2/3)(1/3) + 1·(1/3)(2/3) = 2/3, minore di quello dei due equilibri puri.",
      risultato: "equilibri puri (1, 1) e (2, 2); misto p = 2/3, q = 1/3 con pagamento 2/3 per entrambi"
    },
    fonti: [
      "Osborne, Rubinstein, A Course in Game Theory, MIT Press, cap. 2–3 (equilibrio di Nash e strategie miste) e cap. 8 (giochi ripetuti)",
      "Nash, Non-cooperative games, Annals of Mathematics 54 (1951)",
      "Axelrod, The Evolution of Cooperation, Basic Books",
      "Berlekamp, Conway, Guy, Winning Ways for Your Mathematical Plays, A K Peters, capitoli sul Nim e sulla somma-nim",
      "Russell, Norvig, Artificial Intelligence: A Modern Approach, Pearson, capitolo sulla ricerca con avversari (minimax e alfa-beta)"
    ],
    collegamenti: ['smatgrafi', 'smatlogica', 'smatprob', 'smatmarkov']
  };

  /* ── smatlogica ───────────────────────────────────────────────────────── */
  T['smatlogica'] = {
    titolo: "Logica proposizionale, circuiti, macchine di Turing e insiemi",
    sintesi: "La logica proposizionale studia come la verità di una formula dipende da quella delle sue variabili, e le tavole di verità lo decidono in modo meccanico. Le stesse funzioni booleane, realizzate con porte logiche, fanno le somme nei calcolatori. La macchina di Turing formalizza che cosa significa calcolare, e mostra che esistono problemi ben posti che nessun algoritmo risolve. L'algebra degli insiemi segue le stesse leggi della logica.",
    paragrafi: [
      { titolo: "Formule, tavole di verità e forme normali",
        testo: "Le formule si costruiscono dalle variabili p, q, r, s con i connettivi ¬, ∧, ∨, → e ↔. Un'assegnazione di verità alle variabili determina il valore di ogni sottoformula, e la tavola di verità elenca tutte le 2ⁿ assegnazioni per n variabili. Una formula è una tautologia se è vera in tutte, una contraddizione se è falsa in tutte, soddisfacibile se è vera in almeno una. Il condizionale p → q è falso solo quando p è vero e q falso, e quindi è vero quando la premessa è falsa. Ogni funzione booleana si esprime in forma normale disgiuntiva, la disgiunzione delle congiunzioni corrispondenti alle righe vere, e in forma normale congiuntiva, la congiunzione delle disgiunzioni che escludono le righe false; ne segue che {¬, ∧, ∨} è un insieme completo di connettivi." },
      { titolo: "Dalla logica ai circuiti",
        testo: "Le porte logiche AND, OR, NOT e XOR realizzano fisicamente i connettivi. Sommare due bit a e b produce la cifra s = a ⊕ b e il riporto c = a ∧ b: è il semiaddizionatore. L'addizionatore completo somma anche un riporto in ingresso cᵢₙ, con s = a ⊕ b ⊕ cᵢₙ e riporto in uscita (a ∧ b) ∨ (cᵢₙ ∧ (a ⊕ b)). Mettendone quattro in cascata, ciascuno passa il riporto al successivo e si ottiene un sommatore a 4 bit a propagazione di riporto, semplice ma lento, perché nel caso peggiore il riporto attraversa tutti gli stadi; i sommatori con anticipo del riporto calcolano i riporti in parallelo. Le leggi dell'algebra di Boole, come quelle di De Morgan, servono a semplificare i circuiti e a costruirli con un solo tipo di porta, perché NAND da sola è un insieme completo." },
      { titolo: "Macchine di Turing e calcolabilità",
        testo: "Una macchina di Turing ha un nastro infinito diviso in celle, una testina che legge e scrive un simbolo per volta, un insieme finito di stati e una tavola di transizioni: dato lo stato e il simbolo letto, scrive un simbolo, si sposta a destra o a sinistra e cambia stato. Nonostante la semplicità, la tesi di Church–Turing, che è una tesi e non un teorema, afferma che ogni procedimento effettivo di calcolo si può eseguire con una macchina di Turing. Turing dimostrò che il problema della fermata è indecidibile: non esiste una macchina che, data la descrizione di una qualunque macchina e il suo ingresso, decida se si fermerà. La dimostrazione è un argomento diagonale, della stessa famiglia di quello di Cantor e dei teoremi di incompletezza di Gödel." },
      { titolo: "I castori indaffarati",
        testo: "Fra le macchine a n stati e due simboli che, partendo dal nastro vuoto, prima o poi si fermano, Σ(n) è il massimo numero di uni lasciati sul nastro e S(n) il massimo numero di passi. I primi valori sono noti: Σ(2) = 4 con S(2) = 6, Σ(3) = 6 con S(3) = 21, e la macchina che fa più passi a 3 stati non è quella che scrive più uni. Le funzioni Σ e S sono ben definite, perché le macchine a n stati sono in numero finito, ma non calcolabili: crescono più rapidamente di qualunque funzione calcolabile, nel senso che ne superano ogni esempio da un certo n in poi. Se S fosse calcolabile si potrebbe decidere la fermata di una macchina a n stati simulandola per S(n) passi, contro il teorema di Turing." },
      { titolo: "Insiemi e inclusione-esclusione",
        testo: "Le operazioni fra insiemi corrispondono ai connettivi: l'unione all'oppure, l'intersezione all'e, il complementare alla negazione, e le leggi di De Morgan valgono in entrambe le forme. Un diagramma di Venn a tre insiemi ha otto regioni, tante quante le righe di una tavola di verità in tre variabili, e colorare le regioni che soddisfano un'espressione equivale a calcolarne la tavola. Per insiemi finiti il principio di inclusione-esclusione dà la cardinalità dell'unione: |A ∪ B ∪ C| = |A| + |B| + |C| − |A ∩ B| − |A ∩ C| − |B ∩ C| + |A ∩ B ∩ C|. Gli elementi delle intersezioni sono contati più volte nella prima somma, e i termini successivi correggono il conteggio a segni alterni." }
    ],
    formule: [
      ["p → q ≡ ¬p ∨ q", "il condizionale materiale è falso solo con p vero e q falso"],
      ["¬(p ∧ q) ≡ ¬p ∨ ¬q,  ¬(p ∨ q) ≡ ¬p ∧ ¬q", "leggi di De Morgan, valide anche per insiemi con complementare, intersezione e unione"],
      ["s = a ⊕ b ⊕ cᵢₙ,  cₒᵤₜ = (a ∧ b) ∨ (cᵢₙ ∧ (a ⊕ b))", "addizionatore completo a un bit"],
      ["|A ∪ B ∪ C| = Σ|A| − Σ|A ∩ B| + |A ∩ B ∩ C|", "principio di inclusione-esclusione per tre insiemi finiti"]
    ],
    ipotesi: [
      "Le tavole di verità decidono la logica proposizionale, non quella del primo ordine con i quantificatori, che è indecidibile.",
      "La tesi di Church–Turing è una tesi sul concetto intuitivo di calcolo, non un teorema dimostrabile.",
      "I valori Σ(n) e S(n) riguardano macchine a due simboli che si fermano partendo dal nastro vuoto.",
      "Inclusione-esclusione nella forma scritta vale per insiemi finiti."
    ],
    errori: [
      "Credere che p → q sia falso quando p è falso: un condizionale con premessa falsa è vero.",
      "Confondere p → q con il suo inverso q → p; equivalente è solo il contronominale ¬q → ¬p.",
      "Pensare che il problema della fermata sia solo «difficile»: è impossibile da risolvere in generale con qualunque algoritmo.",
      "Sommare le cardinalità di insiemi non disgiunti senza sottrarre le intersezioni."
    ],
    esempio: {
      testo: "Scrivere le forme normali di p → q. La tavola di verità è vera nelle righe (p, q) = (F, F), (F, V), (V, V) e falsa solo in (V, F). La forma normale disgiuntiva è (¬p ∧ ¬q) ∨ (¬p ∧ q) ∨ (p ∧ q); la congiuntiva ha una sola clausola, quella che esclude la riga falsa, ¬p ∨ q. La formula è soddisfacibile ma non è una tautologia.",
      risultato: "FND: (¬p ∧ ¬q) ∨ (¬p ∧ q) ∨ (p ∧ q); FNC: ¬p ∨ q"
    },
    fonti: [
      "Enderton, A Mathematical Introduction to Logic, Academic Press, 2ª ed., cap. 1 (logica enunciativa)",
      "Sipser, Introduction to the Theory of Computation, Cengage, 3ª ed., cap. 3 (tesi di Church–Turing) e cap. 4 (decidibilità e problema della fermata)",
      "Radó, On non-computable functions, Bell System Technical Journal 41 (1962)",
      "Mendelson, Introduction to Mathematical Logic, CRC Press, cap. 1 (calcolo proposizionale)",
      "Patterson, Hennessy, Computer Organization and Design, Morgan Kaufmann, appendice sui circuiti logici e sui sommatori"
    ],
    collegamenti: ['smatgiochi', 'smatnumeri', 'smatalgebra', 'smatprob']
  };

  /* ── smatinfer ────────────────────────────────────────────────────────── */
  T['smatinfer'] = {
    titolo: "La logica dell'inferenza: intervalli, test, regressione e bootstrap",
    sintesi: "Le procedure dell'inferenza statistica si giudicano dal loro comportamento a lungo andare: un intervallo al 95 % è un metodo che cattura il parametro vero nel 95 % delle ripetizioni dell'esperimento. Simulare molte volte lo stesso esperimento rende visibili copertura, errori di primo e secondo tipo, potenza e distribuzione dei valori p. La regressione e il bootstrap completano il quadro, con i loro limiti.",
    paragrafi: [
      { titolo: "Che cosa significa confidenza",
        testo: "Si estraggono n osservazioni indipendenti da una popolazione normale di media μ e deviazione standard σ ignota. L'intervallo x̄ ± t·s/√n, con t quantile 0,975 della t di Student con n − 1 gradi di libertà, contiene μ con probabilità 0,95, dove la probabilità riguarda il campione, non μ, che è fisso. Ripetendo l'esperimento cento volte si ottengono cento intervalli diversi, e circa cinque mancheranno il valore vero: è ciò che la sezione mostra colorandoli. Se al posto di t si usa 1,96, il quantile della normale, insieme alla s del campione, la copertura reale è minore del 95 %, tanto più quanto n è piccolo, perché si ignora la variabilità di s. I quantili della t si ottengono invertendo numericamente la funzione di ripartizione, espressa con la funzione beta incompleta." },
      { titolo: "Test di ipotesi, errori e potenza",
        testo: "Un test confronta un'ipotesi nulla H₀ con un'alternativa H₁ e rifiuta H₀ se la statistica cade nella regione di rifiuto, costruita in modo che la probabilità di rifiutare H₀ quando è vera, l'errore di primo tipo, sia α. L'errore di secondo tipo, accettare H₀ quando è vera H₁, ha probabilità β, e la potenza è 1 − β. Per un test sulla media con varianza nota la potenza dipende dall'effetto standardizzato δ = (μ₁ − μ₀)/σ e dalla numerosità attraverso δ√n: raddoppiare l'effetto equivale a quadruplicare i dati. Il valore p è la probabilità, calcolata sotto H₀, di una statistica almeno così estrema come quella osservata; se H₀ è vera e la statistica è continua, p è distribuito uniformemente in [0, 1], e quindi un p minore di 0,05 capita per caso una volta su venti." },
      { titolo: "Regressione lineare e quartetto di Anscombe",
        testo: "La retta dei minimi quadrati y = a + bx minimizza la somma dei quadrati dei residui verticali, con b = Sₓᵧ/Sₓₓ e a = ȳ − b·x̄. Il coefficiente di correlazione r = Sₓᵧ/√(SₓₓSᵧᵧ) misura la sola associazione lineare, e R² = r² è la frazione della varianza di y spiegata dalla retta. La banda di confidenza per la retta media si allarga lontano da x̄, perché l'incertezza della pendenza pesa di più. Il quartetto di Anscombe consiste in quattro insiemi di undici punti con medie, varianze, correlazione e retta di regressione praticamente identiche, ma con forme diversissime: una relazione lineare con rumore, una curva, una retta con un punto anomalo, e una nuvola verticale resa «lineare» da un solo punto lontano. La lezione è che le statistiche riassuntive non sostituiscono il grafico dei dati e dei residui." },
      { titolo: "Il bootstrap",
        testo: "Spesso non si conosce la distribuzione campionaria di una stima, per esempio della mediana. Il bootstrap di Efron la approssima ricampionando con reinserimento il campione osservato: si generano molti campioni della stessa ampiezza, si calcola la statistica su ciascuno, e la dispersione dei valori ottenuti stima l'errore standard. L'intervallo percentile prende i quantili 2,5 % e 97,5 % di questa distribuzione. Il metodo funziona perché la distribuzione empirica approssima quella vera quando n è grande, ma non fa miracoli: con campioni piccoli o molto asimmetrici la copertura reale dell'intervallo percentile può essere sensibilmente inferiore a quella nominale, e per statistiche come il massimo il bootstrap semplice non è consistente. Esistono varianti corrette, come l'intervallo BCa." }
    ],
    formule: [
      ["P(x̄ − t·s/√n ≤ μ ≤ x̄ + t·s/√n) = 1 − α", "intervallo di confidenza per la media di una popolazione normale, con t = t₁₋α/₂;ₙ₋₁"],
      ["α = P(rifiuto H₀ | H₀),  β = P(accetto H₀ | H₁)", "errori di primo e secondo tipo; la potenza è 1 − β"],
      ["potenza ≈ Φ(δ√n − z₁₋α)", "potenza di un test z unilaterale sulla media con varianza nota, effetto standardizzato δ > 0"],
      ["r = Sₓᵧ/√(Sₓₓ·Sᵧᵧ),  R² = r²", "coefficiente di correlazione e coefficiente di determinazione della regressione semplice"]
    ],
    ipotesi: [
      "L'intervallo con la t di Student presuppone dati normali e indipendenti; per n grande è robusto grazie al limite centrale.",
      "L'uniformità dei valori p sotto H₀ richiede una statistica continua e un modello corretto.",
      "La regressione ordinaria assume relazione lineare, errori indipendenti con varianza costante, e per gli intervalli errori normali.",
      "Il bootstrap è giustificato asintoticamente e richiede osservazioni indipendenti e identicamente distribuite."
    ],
    errori: [
      "Interpretare il valore p come la probabilità che H₀ sia vera.",
      "Concludere che non c'è effetto perché il test non è significativo, senza considerare la potenza.",
      "Usare z = 1,96 con la deviazione standard di un campione piccolo.",
      "Giudicare un modello dal solo R² senza guardare i dati e i residui."
    ],
    esempio: {
      testo: "Qual è la copertura vera dell'intervallo x̄ ± 1,96·s/√n con n = 5 da una popolazione normale? La quantità (x̄ − μ)/(s/√5) segue una t con 4 gradi di libertà, quindi la copertura è P(|T₄| ≤ 1,96). Integrando numericamente la densità della t si ottiene circa 0,878, lontano dal 95 % dichiarato; con n = 10 si sale a 0,918. Per avere davvero il 95 % con n = 5 serve t₀,₉₇₅;₄ = 2,776.",
      risultato: "copertura reale ≈ 87,8 % invece del 95 % nominale"
    },
    fonti: [
      "Casella, Berger, Statistical Inference, Duxbury, 2ª ed., cap. 8 (test di ipotesi), cap. 9 (stima intervallare), cap. 11 (regressione)",
      "Efron, Tibshirani, An Introduction to the Bootstrap, Chapman & Hall, capitoli sull'errore standard bootstrap e sugli intervalli percentile",
      "Anscombe, Graphs in statistical analysis, The American Statistician 27 (1973)",
      "Ross, Introduction to Probability and Statistics for Engineers and Scientists, Academic Press, capitoli su stima, test e regressione"
    ],
    collegamenti: ['smatstat', 'smatprob', 'smatsvd', 'staratura']
  };

  /* ── smatnoneucl ──────────────────────────────────────────────────────── */
  T['smatnoneucl'] = {
    titolo: "Geometrie non euclidee: sfera, disco di Poincaré e curvatura",
    sintesi: "Negando il quinto postulato di Euclide si ottengono geometrie coerenti quanto quella euclidea. Sulla sfera le rette sono cerchi massimi e la somma degli angoli di un triangolo supera π; nel piano iperbolico per un punto passano infinite parallele a una retta data e la somma è minore di π. In entrambi i casi l'eccesso o il difetto angolare è proporzionale all'area, e la costante di proporzionalità è la curvatura gaussiana.",
    paragrafi: [
      { titolo: "Il quinto postulato",
        testo: "Il quinto postulato di Euclide, nella forma di Playfair, afferma che per un punto esterno a una retta passa una e una sola parallela. Per secoli si tentò di dedurlo dagli altri, finché Lobačevskij, Bolyai e Gauss compresero che la sua negazione dà una geometria coerente; Beltrami e poi Klein e Poincaré ne costruirono modelli dentro la geometria euclidea, dimostrando che la geometria iperbolica è coerente se lo è quella euclidea. Molti enunciati familiari dipendono dal postulato: la somma degli angoli di un triangolo uguale a π, l'esistenza di triangoli simili non congruenti, il teorema di Pitagora. Nella geometria sferica le rette, i cerchi massimi, si incontrano sempre, quindi non esistono parallele; per ottenere un modello degli assiomi di incidenza si identificano i punti antipodali, il piano ellittico." },
      { titolo: "Geometria sferica e teorema di Girard",
        testo: "Su una sfera di raggio R la distanza fra due punti è la lunghezza dell'arco minore di cerchio massimo che li unisce, R·θ con θ angolo al centro. Un triangolo sferico ha lati che sono archi di cerchio massimo, e i suoi angoli sono quelli fra i piani dei cerchi, ovvero fra i vettori tangenti nei vertici. Il teorema di Girard afferma che α + β + γ − π = A/R², dove A è l'area: l'eccesso angolare è proporzionale all'area. Il triangolo con vertici nel polo nord e in due punti dell'equatore a 90° di longitudine ha tre angoli retti e occupa un ottavo della sfera. La legge sferica dei coseni, cos c = cos a cos b + sin a sin b cos γ con i lati misurati come angoli al centro, sostituisce il teorema di Carnot; per le distanze fra città si usa la formula dell'emisenoverso, numericamente stabile anche per punti vicini." },
      { titolo: "Il disco di Poincaré",
        testo: "Nel modello di Poincaré il piano iperbolico è il disco unitario aperto, con la metrica ds = 2|dz|/(1 − |z|²). Le rette, cioè le geodetiche, sono i diametri e gli archi di cerchio ortogonali al bordo; gli angoli coincidono con quelli euclidei, perché il modello è conforme, mentre le distanze crescono senza limite avvicinandosi al bordo, che è a distanza infinita. Data una retta e un punto esterno, passano per il punto infinite rette che non la incontrano. Un triangolo ha somma degli angoli minore di π e, in questa metrica di curvatura −1, area π − (α + β + γ): l'area di ogni triangolo è minore di π. Le isometrie sono generate dalle inversioni nei cerchi ortogonali al bordo, e riflettendo ripetutamente un poligono si costruiscono le tassellazioni regolari {p, q}, che esistono nel piano iperbolico quando (p − 2)(q − 2) > 4, come {7, 3} e {5, 4}." },
      { titolo: "Curvatura gaussiana e trasporto parallelo",
        testo: "La curvatura gaussiana K di una superficie in un punto è il prodotto delle curvature principali: 1/R² per la sfera, 0 per il piano e per il cilindro, negativa per una sella e costante −1/a² per la pseudosfera. Il Theorema Egregium di Gauss afferma che K dipende solo dalla metrica della superficie, cioè da misure fatte restando su di essa. Un modo di misurarla è la circonferenza dei cerchi geodetici: C(r) = 2πr − (π/3)K r³ + o(r³), formula di Bertrand–Diguet–Puiseux. Un altro è il trasporto parallelo: portando un vettore tangente lungo il bordo di una regione geodeticamente semplice, al ritorno risulta ruotato di un angolo pari all'integrale di K sulla regione, che per un triangolo sferico vale A/R², proprio l'eccesso di Girard. È un caso del teorema di Gauss–Bonnet." }
    ],
    formule: [
      ["α + β + γ − π = A/R²", "teorema di Girard per un triangolo sferico su una sfera di raggio R"],
      ["A = π − (α + β + γ)", "area di un triangolo iperbolico in curvatura −1"],
      ["ds = 2|dz|/(1 − |z|²)", "metrica del disco di Poincaré, di curvatura −1"],
      ["C(r) = 2πr − (π/3)·K·r³ + o(r³)", "circonferenza di un cerchio geodetico di raggio r piccolo, formula di Bertrand–Diguet–Puiseux"],
      ["d = 2R·arcsin √(sin²(Δφ/2) + cos φ₁ cos φ₂ sin²(Δλ/2))", "formula dell'emisenoverso per la distanza fra due punti di latitudine φ e longitudine λ"]
    ],
    ipotesi: [
      "Il teorema di Girard vale per triangoli sferici con lati archi di cerchio massimo minori di un semicerchio.",
      "La formula dell'area iperbolica π − (α + β + γ) assume curvatura −1; per curvatura −k² va divisa per k².",
      "La formula di Bertrand–Diguet–Puiseux è uno sviluppo per r piccolo, su una superficie regolare.",
      "La Terra non è una sfera perfetta: la formula dell'emisenoverso con R = 6371 km ha errori dell'ordine dello 0,5 %."
    ],
    errori: [
      "Pensare che la rotta più breve fra due città sia quella a rotta costante disegnata come retta sulla carta di Mercatore.",
      "Credere che nel disco di Poincaré le rette iperboliche siano le corde euclidee: lo sono nel modello di Klein, non in quello di Poincaré.",
      "Confondere la curvatura gaussiana con la curvatura di una curva: il cilindro è curvo come oggetto nello spazio ma ha K = 0.",
      "Ritenere che la geometria non euclidea sia meno rigorosa di quella euclidea: sono ugualmente coerenti."
    ],
    esempio: {
      testo: "Sulla Terra (R = 6371 km) il triangolo con vertici nel polo nord, in (0°, 0°) e in (0°, 90° E) ha tre angoli retti. Per Girard l'area è R²·(3·π/2 − π) = (π/2)R² ≈ 6,38·10⁷ km², cioè un ottavo della superficie 4πR². Con l'emisenoverso, la distanza fra Roma (41,90° N, 12,50° E) e Milano (45,46° N, 9,19° E) risulta circa 477 km.",
      risultato: "area (π/2)R² ≈ 6,38·10⁷ km²; Roma–Milano ≈ 477 km"
    },
    fonti: [
      "do Carmo, Differential Geometry of Curves and Surfaces, Prentice-Hall (2ª ed. Dover), cap. 4 (Theorema Egregium, trasporto parallelo, Gauss–Bonnet)",
      "Greenberg, Euclidean and Non-Euclidean Geometries: Development and History, W. H. Freeman, capitoli sul postulato delle parallele e sui modelli iperbolici",
      "Anderson, Hyperbolic Geometry, Springer, capitoli sul disco di Poincaré e sull'area dei triangoli",
      "Stillwell, Geometry of Surfaces, Springer, capitoli sulla geometria sferica e iperbolica e sulle tassellazioni"
    ],
    collegamenti: ['smatfrenet', 'smattopo', 'smatgeo', 'sfisgrav', 'sastrocielo']
  };

  /* ── smatedp ──────────────────────────────────────────────────────────── */
  T['smatedp'] = {
    titolo: "Equazioni alle derivate parziali: onde, calore, Laplace, trasporto",
    sintesi: "Le equazioni alle derivate parziali descrivono grandezze che dipendono da più variabili, come lo spazio e il tempo. L'equazione delle onde propaga i segnali a velocità finita, quella del calore li smorza e li regolarizza, quella di Laplace descrive gli stati di equilibrio, quella del trasporto e di Burgers lo spostamento lungo le caratteristiche fino alla formazione di urti. Ogni equazione si risolve sia con la separazione delle variabili sia con un metodo numerico, e il confronto rivela i pregi e i limiti di ciascuno.",
    paragrafi: [
      { titolo: "La corda vibrante",
        testo: "Una corda di lunghezza L fissata agli estremi soddisfa u_tt = c²u_xx con u(0, t) = u(L, t) = 0, posizione e velocità iniziali assegnate. La formula di d'Alembert scrive la soluzione come somma di due onde che viaggiano in versi opposti, u = [f(x − ct) + f(x + ct)]/2 più un termine dovuto alla velocità iniziale, dove f è il profilo iniziale esteso in modo dispari rispetto agli estremi e periodico di periodo 2L: l'estensione dispari realizza le condizioni al bordo, cioè le riflessioni con inversione. La separazione delle variabili dà invece la serie dei modi normali Σ bₙ sin(nπx/L) cos(nπct/L), con frequenze multiple della fondamentale: lo spettro della corda è armonico. L'energia, somma della cinetica ∫ u_t²/2 e della potenziale ∫ c²u_x²/2, resta costante, mentre le due parti si scambiano." },
      { titolo: "La membrana e le figure di Chladni",
        testo: "Per una membrana fissata al bordo, u_tt = c²Δu. Nel quadrato di lato 1 i modi sono sin(mπx)·sin(nπy) con frequenze proporzionali a √(m² + n²); nel disco di raggio 1 sono J_m(j_mn·r)·cos(mθ), dove J_m è la funzione di Bessel di ordine m e j_mn il suo n-esimo zero positivo, con frequenze proporzionali a j_mn: j₀₁ ≈ 2,4048, j₁₁ ≈ 3,8317, j₂₁ ≈ 5,1356. Questi rapporti non sono interi, e per questo il tamburo, a differenza della corda, non ha un timbro armonico e non suona una nota netta. Le linee nodali, dove la membrana resta ferma, sono rette nel quadrato e cerchi e diametri nel disco; sono le figure che la sabbia disegna nelle esperienze di Chladni. Modi diversi con la stessa frequenza, come (1, 2) e (2, 1) nel quadrato, si possono sovrapporre e generano linee nodali di forma diversa." },
      { titolo: "Il calore e la stabilità",
        testo: "L'equazione del calore u_t = α u_xx su [0, L] con estremi a temperatura zero si risolve con la serie Σ bₙ e^(−α(nπ/L)²t) sin(nπx/L): ogni modo decade con un esponenziale il cui tasso cresce con n², quindi i dettagli fini scompaiono per primi e la soluzione diventa liscia per ogni t > 0, anche se il dato iniziale ha salti. Il metodo esplicito alle differenze finite FTCS sostituisce la derivata temporale con una differenza in avanti e quella spaziale con una differenza centrata. L'analisi di von Neumann mostra che è stabile se e solo se r = αΔt/Δx² ≤ 1/2: oltre questo limite i modi di frequenza più alta vengono amplificati a ogni passo e la soluzione numerica esplode con oscillazioni a dente di sega. Il vincolo lega il passo temporale al quadrato di quello spaziale, ed è il motivo per cui si usano spesso schemi impliciti come Crank–Nicolson." },
      { titolo: "Laplace e i metodi iterativi",
        testo: "L'equazione di Laplace Δu = 0 descrive gli stati stazionari, per esempio la temperatura di una lastra con i bordi a temperature fisse. Per il principio del massimo una funzione armonica assume massimo e minimo sul bordo, il che implica l'unicità della soluzione del problema di Dirichlet. Sul quadrato la soluzione con un lato non nullo è una serie di seni moltiplicati per seni iperbolici. Discretizzando con passo h = 1/(N + 1) si ottiene un grande sistema lineare, che si risolve per iterazione: per il problema modello il raggio spettrale di Jacobi è cos πh, quello di Gauss–Seidel cos²πh e quello di SOR con il parametro ottimo ω_ott = 2/(1 + sin πh) vale ω_ott − 1. Il numero di iterazioni per ridurre l'errore di un fattore fissato è inversamente proporzionale a −ln ρ: dell'ordine di 1/h² per Jacobi e Gauss–Seidel, di 1/h per SOR ottimale." },
      { titolo: "Trasporto, Burgers e urti",
        testo: "L'equazione del trasporto u_t + a u_x = 0 trasla il dato iniziale con velocità a, u(x, t) = u₀(x − at): la soluzione è costante lungo le caratteristiche, le rette x − at = costante. Lo schema upwind, che usa la differenza dal lato da cui arriva l'informazione, è stabile se |a|Δt/Δx ≤ 1 (condizione CFL) ma introduce una diffusione numerica che smussa i fronti. Nell'equazione di Burgers non viscosa u_t + u u_x = 0 la velocità è la soluzione stessa, e le caratteristiche partono con pendenze diverse; se u₀ ha tratti decrescenti si incrociano, e la soluzione regolare cessa di esistere all'istante t* = −1/min u₀′. Da lì si forma un urto, una discontinuità che si muove con la velocità di Rankine–Hugoniot (u_s + u_d)/2, media dei valori a sinistra e a destra. Il metodo di Godunov, conservativo, la cattura correttamente." }
    ],
    formule: [
      ["u(x, t) = [f(x − ct) + f(x + ct)]/2 + (1/2c)∫ g(s) ds  (da x − ct a x + ct)", "formula di d'Alembert, con f e g posizione e velocità iniziali estese in modo dispari e 2L-periodico"],
      ["u(x, t) = Σ bₙ·e^(−α(nπ/L)²t)·sin(nπx/L)", "soluzione dell'equazione del calore con estremi a temperatura zero, bₙ coefficienti di Fourier del dato iniziale"],
      ["r = α·Δt/Δx² ≤ 1/2", "condizione di stabilità dello schema esplicito FTCS per l'equazione del calore"],
      ["ω_ott = 2/(1 + sin πh),  ρ_J = cos πh,  ρ_GS = cos²πh", "raggi spettrali dei metodi iterativi per il laplaciano discreto su un quadrato con passo h"],
      ["t* = −1/min u₀′,  s = (u_s + u_d)/2", "istante di rottura e velocità dell'urto per l'equazione di Burgers non viscosa"]
    ],
    ipotesi: [
      "La serie di Fourier rappresenta il dato iniziale nel senso delle serie di Fourier: con salti la convergenza non è uniforme.",
      "La condizione r ≤ 1/2 riguarda lo schema esplicito FTCS; altri schemi hanno condizioni diverse o sono incondizionatamente stabili.",
      "I raggi spettrali citati valgono per il problema modello di Dirichlet sul quadrato con griglia uniforme.",
      "La formula del tempo di rottura richiede u₀ regolare con min u₀′ < 0; dopo t* serve la nozione di soluzione debole con la condizione di entropia."
    ],
    errori: [
      "Ridurre Δx in uno schema esplicito senza ridurre Δt in proporzione al quadrato, ottenendo un'esplosione numerica.",
      "Pensare che il tamburo abbia armoniche intere come la corda.",
      "Scambiare la diffusione numerica dello schema upwind per un fenomeno fisico.",
      "Continuare a usare la soluzione per caratteristiche dopo il loro incrocio, ottenendo una funzione a più valori."
    ],
    esempio: {
      testo: "Laplace sul quadrato con N = 19 nodi interni per lato, quindi h = 1/20. Il raggio di Jacobi è cos(π/20) ≈ 0,98769, quello di Gauss–Seidel ≈ 0,97553; il parametro ottimo è ω_ott = 2/(1 + sin(π/20)) ≈ 1,7295, con raggio ω_ott − 1 ≈ 0,7295. Per ridurre l'errore di un fattore 10⁶ servono circa ln(10⁻⁶)/ln ρ iterazioni.",
      risultato: "Jacobi ≈ 1115, Gauss–Seidel ≈ 558, SOR ottimale ≈ 44 iterazioni"
    },
    fonti: [
      "Evans, Partial Differential Equations, American Mathematical Society, 2ª ed., cap. 2 (trasporto, Laplace, calore, onde) e cap. 3 (leggi di conservazione e urti)",
      "Salsa, Equazioni a derivate parziali: metodi, modelli e applicazioni, Springer Italia, capitoli su diffusione, onde e leggi di conservazione",
      "Strauss, Partial Differential Equations: An Introduction, Wiley, capitoli su d'Alembert, separazione delle variabili e funzioni di Bessel",
      "LeVeque, Finite Volume Methods for Hyperbolic Problems, Cambridge University Press, capitoli su upwind, Godunov e Burgers",
      "Saad, Iterative Methods for Sparse Linear Systems, SIAM, 2ª ed., cap. 4 (Jacobi, Gauss–Seidel, SOR)"
    ],
    collegamenti: ['smatcompl', 'smatode', 'smatnum', 'smatvett', 'sfisonde']
  };

  /* ── smatanalcomp ─────────────────────────────────────────────────────── */
  T['smatanalcomp'] = {
    titolo: "Analisi complessa: olomorfia, mappe conformi, residui",
    sintesi: "Una funzione di variabile complessa derivabile in senso complesso, cioè olomorfa, è molto più rigida di una funzione reale derivabile: soddisfa le equazioni di Cauchy–Riemann, è infinitamente derivabile, conserva gli angoli dove la derivata non si annulla, e il suo integrale lungo un cammino chiuso dipende solo dalle singolarità racchiuse. Il teorema dei residui trasforma così integrali difficili, anche reali, in somme finite.",
    paragrafi: [
      { titolo: "Olomorfia e Cauchy–Riemann",
        testo: "Una funzione f = u + iv definita in un aperto di ℂ è olomorfa se in ogni punto esiste il limite del rapporto incrementale (f(z + h) − f(z))/h per h → 0 complesso, da qualunque direzione. Ne seguono le equazioni di Cauchy–Riemann, u_x = v_y e u_y = −v_x; viceversa, se u e v sono di classe C¹ e le soddisfano, f è olomorfa. Funzioni come z̄ o |z|² non lo sono, pur essendo regolarissime come funzioni di due variabili reali. Una funzione olomorfa ha derivate di ogni ordine e coincide localmente con la propria serie di Taylor, e parte reale e immaginaria sono armoniche. La colorazione del dominio mostra arg f come tinta e |f| come luminosità: attorno a uno zero di ordine k la tinta compie k giri in un verso, attorno a un polo di ordine k nel verso opposto." },
      { titolo: "Mappe conformi e Joukowski",
        testo: "Se f è olomorfa e f′(z₀) ≠ 0, vicino a z₀ la mappa agisce come una rotazione di arg f′(z₀) composta con una dilatazione di |f′(z₀)|, quindi conserva gli angoli fra le curve, con il loro verso: è conforme. Nei punti in cui f′ si annulla gli angoli vengono moltiplicati: se f′(z₀) = 0 ma f″(z₀) ≠ 0 si raddoppiano, come fa z² nell'origine. La trasformazione di Joukowski w = z + 1/z manda un cerchio che passa per z = 1 e racchiude z = −1 in un profilo alare con il bordo d'uscita aguzzo. Poiché le funzioni armoniche restano armoniche per composizione con mappe conformi, il flusso potenziale attorno a un cilindro, noto in forma chiusa, diventa il flusso attorno all'ala. La condizione di Kutta fissa la circolazione Γ in modo che il fluido lasci il bordo d'uscita in modo regolare, e il teorema di Kutta–Joukowski dà la portanza per unità di apertura, L = ρU∞Γ." },
      { titolo: "Teorema di Cauchy e residui",
        testo: "Se f è olomorfa in un aperto semplicemente connesso, il suo integrale lungo ogni cammino chiuso regolare a tratti è nullo: è il teorema di Cauchy. Se f è olomorfa in un aperto tranne che in singolarità isolate, e γ è una curva chiusa semplice percorsa in verso antiorario che non passa per nessuna di esse, allora ∮_γ f dz = 2πi Σ Res(f, zₖ), con la somma estesa alle singolarità interne. Il residuo è il coefficiente di 1/(z − z₀) nello sviluppo di Laurent; per un polo semplice vale lim (z − z₀)f(z), e per f = g/h con h(z₀) = 0 e h′(z₀) ≠ 0 vale g(z₀)/h′(z₀). Il principio dell'argomento ne è una conseguenza: per f meromorfa, (1/2πi)∮ f′/f dz è il numero di zeri meno il numero di poli interni, contati con molteplicità, ed è il numero di giri della curva immagine f(γ) attorno all'origine." },
      { titolo: "Integrali reali con i residui",
        testo: "Per calcolare ∫ R(x) dx su tutta la retta, con R razionale senza poli reali e grado del denominatore che supera di almeno due quello del numeratore, si chiude il segmento [−ρ, ρ] con la semicirconferenza superiore di raggio ρ. Il contributo dell'arco è al più πρ·max|R| sull'arco, che tende a zero, e resta 2πi per la somma dei residui nel semipiano superiore. Così ∫ dx/(1 + x²) = π, ∫ dx/(1 + x⁴) = π/√2 e ∫ dx/(x² + x + 1) = 2π/√3. Per integrali con e^(ix), come ∫ cos x/(1 + x²) dx = π/e, il lemma di Jordan assicura che l'arco dia contributo nullo anche quando la funzione decade solo come 1/x. Altri contorni, come un settore circolare, danno ∫₀^∞ dx/(1 + x³) = 2π/(3√3). La sezione confronta ogni risultato con una quadratura numerica indipendente." }
    ],
    formule: [
      ["u_x = v_y,  u_y = −v_x", "equazioni di Cauchy–Riemann per f = u + iv olomorfa"],
      ["∮_γ f(z) dz = 2πi·Σ Res(f, zₖ)", "teorema dei residui, con γ chiusa semplice antioraria e f olomorfa dentro e su γ tranne in singolarità isolate interne"],
      ["Res(g/h, z₀) = g(z₀)/h′(z₀)", "residuo in un polo semplice, se g(z₀) ≠ 0, h(z₀) = 0 e h′(z₀) ≠ 0"],
      ["(1/2πi)∮_γ f′/f dz = Z − P", "principio dell'argomento: zeri meno poli interni a γ, con molteplicità"],
      ["L = ρ·U∞·Γ", "teorema di Kutta–Joukowski: portanza per unità di apertura in un flusso potenziale bidimensionale"]
    ],
    ipotesi: [
      "Il teorema di Cauchy richiede f olomorfa in un dominio semplicemente connesso che contiene il cammino.",
      "Il teorema dei residui richiede singolarità isolate e nessuna singolarità sul cammino.",
      "Il metodo della semicirconferenza richiede un decadimento sufficiente: grado del denominatore maggiore di almeno due, oppure il lemma di Jordan per gli integrandi con e^(ix).",
      "La conformità vale dove f′ ≠ 0."
    ],
    errori: [
      "Credere che basti la derivabilità di u e v per avere una funzione olomorfa: servono le equazioni di Cauchy–Riemann.",
      "Sommare anche i residui dei poli nel semipiano inferiore quando si chiude il contorno in alto.",
      "Dimenticare che ∮ dz/z = 2πi e non 0: la funzione 1/z non è olomorfa nell'origine.",
      "Usare il logaritmo complesso senza specificare il taglio, ottenendo salti di 2πi."
    ],
    esempio: {
      testo: "Calcolare ∫ dx/(1 + x⁴) su ℝ. I poli nel semipiano superiore sono z₁ = e^(iπ/4) e z₂ = e^(3iπ/4). Per la formula g/h′ il residuo in zₖ è 1/(4zₖ³) = −zₖ/4, perché zₖ⁴ = −1. La somma è −(z₁ + z₂)/4 = −(i√2)/4. Moltiplicando per 2πi si ottiene 2π√2/4 = π/√2, e l'arco dà contributo nullo perché l'integrando decade come 1/ρ⁴.",
      risultato: "∫ dx/(1 + x⁴) = π/√2 ≈ 2,2214"
    },
    fonti: [
      "Ahlfors, Complex Analysis, McGraw-Hill, 3ª ed., cap. 2–4 (funzioni analitiche, mappe conformi, teorema di Cauchy, residui)",
      "Stein, Shakarchi, Complex Analysis, Princeton University Press, cap. 1–3 (olomorfia, Cauchy, residui e principio dell'argomento)",
      "Needham, Visual Complex Analysis, Oxford University Press, capitoli sulle mappe conformi e sulla visualizzazione delle funzioni complesse",
      "Batchelor, An Introduction to Fluid Dynamics, Cambridge University Press, cap. 6 (flussi potenziali, Joukowski e portanza)"
    ],
    collegamenti: ['smatcompl', 'smatserie', 'smatvett', 'sfisfluidi']
  };

  /* ── smatmarkov ───────────────────────────────────────────────────────── */
  T['smatmarkov'] = {
    titolo: "Catene di Markov, passeggiate aleatorie e code",
    sintesi: "Una catena di Markov è un processo in cui il futuro dipende dal passato solo attraverso il presente. Con pochi stati è descritta da una matrice stocastica, e sotto ipotesi di irriducibilità e aperiodicità converge a un'unica distribuzione stazionaria, alla velocità fissata dal secondo autovalore. Da qui vengono PageRank, la rovina del giocatore, le passeggiate aleatorie con il teorema di Pólya, il processo di Poisson e la teoria delle code.",
    paragrafi: [
      { titolo: "Matrice di transizione e distribuzione stazionaria",
        testo: "Una catena di Markov omogenea su un insieme finito di stati è descritta dalla matrice P con Pᵢⱼ = probabilità di passare da i a j in un passo; le righe hanno somma 1. Se la distribuzione al tempo n è il vettore riga μₙ, allora μₙ₊₁ = μₙP. Una distribuzione π è stazionaria se π = πP, cioè se è un autovettore sinistro di autovalore 1; la sezione la calcola con il metodo delle potenze e risolvendo π(P − I) = 0 con Σπᵢ = 1. Se la catena è irriducibile, cioè ogni stato raggiunge ogni altro, la stazionaria esiste ed è unica, con tutte le componenti positive, e il teorema di Kac dà il tempo medio di ritorno nello stato i come 1/πᵢ. Per il teorema ergodico la frazione di tempo passata in i tende a πᵢ, che è ciò che le frequenze empiriche del camminatore mostrano." },
      { titolo: "Convergenza, periodicità e autovalori",
        testo: "Se la catena finita è irriducibile e aperiodica, μₙ converge a π qualunque sia la distribuzione iniziale. Se è periodica, per esempio due stati che si scambiano a ogni passo, la stazionaria esiste ma μₙ oscilla e non converge. Gli autovalori di P hanno modulo al più 1; per una catena irriducibile l'autovalore 1 è semplice, e la catena è aperiodica se e solo se nessun altro autovalore ha modulo 1. Quando P è diagonalizzabile, la distanza da π decresce come |λ₂|ⁿ, dove λ₂ è l'autovalore di modulo massimo dopo 1: più |λ₂| è piccolo, più rapidamente la catena dimentica lo stato iniziale. La sezione calcola gli autovalori con Faddeev–LeVerrier e Durand–Kerner. PageRank è la stazionaria della catena del navigatore che segue un link con probabilità d = 0,85 e salta a una pagina a caso con 0,15: il salto rende la catena irriducibile e aperiodica." },
      { titolo: "La rovina del giocatore",
        testo: "Un giocatore con capitale i vince o perde un'unità a ogni partita, con probabilità p e q = 1 − p, finché arriva a 0 o a N. La probabilità hᵢ di arrivare a N soddisfa la ricorrenza hᵢ = p·hᵢ₊₁ + q·hᵢ₋₁ con h₀ = 0 e h_N = 1, un sistema lineare tridiagonale, risolto dall'algoritmo di Thomas o in forma chiusa: hᵢ = (1 − (q/p)ⁱ)/(1 − (q/p)ᴺ) se p ≠ q, e hᵢ = i/N nel gioco equo. Anche la durata media soddisfa una ricorrenza, e nel gioco equo vale i(N − i). Con p appena minore di 1/2, come alla roulette, la probabilità di vincere contro un banco con capitale molto maggiore è praticamente nulla: è la ragione matematica del vantaggio del banco." },
      { titolo: "Passeggiate aleatorie e teorema di Pólya",
        testo: "Nella passeggiata aleatoria semplice su ℤᵈ, a ogni passo ci si sposta di un'unità in una delle 2d direzioni con uguale probabilità. Lo spostamento quadratico medio dopo n passi è n in ogni dimensione, perché i passi sono indipendenti e di media nulla, e per il limite centrale la posizione riscalata di √n diventa gaussiana: è il modello microscopico della diffusione. Il teorema di Pólya afferma che la passeggiata è ricorrente, cioè torna all'origine con probabilità 1, in dimensione 1 e 2, ed è transiente in dimensione 3 e superiore: in 3D la probabilità di tornare almeno una volta è circa 0,3405. Il motivo è che la probabilità di trovarsi nell'origine al tempo 2n decresce come n^(−d/2), e la serie di questi termini diverge solo per d ≤ 2." },
      { titolo: "Processo di Poisson e coda M/M/1",
        testo: "Nel processo di Poisson di intensità λ il numero di eventi in un intervallo di durata t segue la distribuzione di Poisson di media λt, i conteggi in intervalli disgiunti sono indipendenti, e i tempi fra un evento e il successivo sono esponenziali di media 1/λ. Nella coda M/M/1 i clienti arrivano secondo un processo di Poisson di intensità λ e un solo servente li serve in tempi esponenziali di media 1/μ. Se ρ = λ/μ < 1 la coda è stabile, il numero di clienti nel sistema ha distribuzione stazionaria geometrica con media L = ρ/(1 − ρ), e il tempo medio di permanenza è W = 1/(μ − λ). La legge di Little, L = λW, vale in condizioni molto più generali, per quasi ogni sistema stazionario. Avvicinandosi a ρ = 1 le attese crescono senza limite: una coda quasi satura è sempre lunga." }
    ],
    formule: [
      ["π = π·P,  Σπᵢ = 1", "distribuzione stazionaria di una catena con matrice di transizione P"],
      ["E[Tᵢ] = 1/πᵢ", "teorema di Kac: tempo medio di ritorno nello stato i, per catene irriducibili a stati finiti"],
      ["hᵢ = (1 − (q/p)ⁱ)/(1 − (q/p)ᴺ)", "probabilità di raggiungere N partendo da i nella rovina del giocatore, con p ≠ q"],
      ["L = ρ/(1 − ρ),  W = 1/(μ − λ),  L = λW", "coda M/M/1 stabile (ρ = λ/μ < 1) e legge di Little"],
      ["(I − d·Mᵀ)·r = (1 − d)/n·𝟏", "sistema lineare di PageRank con fattore di smorzamento d, matrice dei link M a righe stocastiche e n pagine"]
    ],
    ipotesi: [
      "Unicità della stazionaria: catena irriducibile; convergenza da ogni stato iniziale: irriducibile e aperiodica (a stati finiti).",
      "La velocità |λ₂|ⁿ presuppone P diagonalizzabile; in generale compaiono fattori polinomiali in n.",
      "Il teorema di Pólya riguarda la passeggiata semplice sul reticolo ℤᵈ.",
      "Le formule M/M/1 valgono in regime stazionario e solo se ρ < 1."
    ],
    errori: [
      "Pensare che ogni catena converga alla stazionaria: le catene periodiche oscillano.",
      "Usare la colonna invece della riga: con la convenzione μP, π è un autovettore sinistro di P.",
      "Credere che in un gioco equo ripetuto si finisca in pari: con capitale finito la rovina è certa contro un avversario infinitamente ricco.",
      "Applicare le formule della coda con ρ ≥ 1, dove la coda cresce senza limite."
    ],
    esempio: {
      testo: "Catena a due stati con P = [[0,9; 0,1], [0,5; 0,5]]. La stazionaria soddisfa π₁·0,1 = π₂·0,5 e π₁ + π₂ = 1, quindi π = (5/6, 1/6). Gli autovalori sono 1 e tr P − 1 = 0,4, quindi la distanza da π si riduce di un fattore 0,4 a ogni passo. Per Kac il tempo medio di ritorno nello stato 2 è 1/π₂ = 6 passi.",
      risultato: "π = (5/6, 1/6), λ₂ = 0,4, tempo medio di ritorno nello stato 2 pari a 6"
    },
    fonti: [
      "Norris, Markov Chains, Cambridge University Press, cap. 1 (catene a tempo discreto, ricorrenza, stazionarietà) e cap. 2–3 (processo di Poisson e code)",
      "Ross, Introduction to Probability Models, Academic Press, capitoli su catene di Markov, processo di Poisson e teoria delle code",
      "Feller, An Introduction to Probability Theory and Its Applications, vol. 1, Wiley, 3ª ed., cap. XIV (rovina del giocatore) e cap. XV (catene di Markov)",
      "Levin, Peres, Wilmer, Markov Chains and Mixing Times, American Mathematical Society, capitoli su convergenza e autovalori",
      "Brin, Page, The anatomy of a large-scale hypertextual Web search engine, Computer Networks and ISDN Systems 30 (1998)"
    ],
    collegamenti: ['smatprob', 'smatlin', 'smatgrafi', 'sfisstat', 'schicinet']
  };

  /* ── smatsvd ──────────────────────────────────────────────────────────── */
  T['smatsvd'] = {
    titolo: "Decomposizione ai valori singolari e algebra lineare applicata",
    sintesi: "Ogni matrice reale A, anche rettangolare, si scrive come A = UΣVᵀ con U e V ortogonali e Σ diagonale non negativa: una rotazione o riflessione, uno stiramento lungo assi perpendicolari e un'altra rotazione o riflessione. I valori singolari misurano gli stiramenti, danno la migliore approssimazione di rango basso (Eckart–Young), gli assi principali di una nuvola di dati (PCA) e il numero di condizionamento, che spiega perché le equazioni normali sono pericolose nei minimi quadrati.",
    paragrafi: [
      { titolo: "Il teorema della SVD",
        testo: "Per ogni matrice reale A di dimensioni m × n esistono matrici ortogonali U (m × m) e V (n × n) e una matrice Σ (m × n) con elementi diagonali σ₁ ≥ σ₂ ≥ … ≥ 0 e zeri altrove, tali che A = UΣVᵀ. I valori singolari σᵢ sono le radici quadrate degli autovalori di AᵀA, che è simmetrica semidefinita positiva; le colonne di V, i vettori singolari destri, ne sono gli autovettori, e quelle di U soddisfano Avᵢ = σᵢuᵢ. Il numero di valori singolari non nulli è il rango. I valori singolari sono univocamente determinati, i vettori singolari solo a meno di segni o, con valori ripetuti, di rotazioni nel sottospazio. Geometricamente, A manda la sfera unitaria in un ellissoide, eventualmente degenere, con semiassi σᵢuᵢ; se A è quadrata, |det A| = σ₁σ₂⋯σₙ, e il segno del determinante dice se nella fattorizzazione compare una riflessione." },
      { titolo: "Come si calcola",
        testo: "Formare AᵀA e calcolarne gli autovalori è il modo più diretto di definire la SVD, ma numericamente non il migliore, perché eleva al quadrato i valori singolari e perde precisione su quelli piccoli. La sezione usa il metodo di Jacobi a un lato di Hestenes: si applicano a coppie di colonne di A rotazioni piane scelte in modo da renderle ortogonali, e si ripete il giro su tutte le coppie finché ogni coppia è ortogonale entro la tolleranza. A quel punto le norme delle colonne sono i valori singolari, le colonne normalizzate formano U e il prodotto delle rotazioni forma V. Il metodo converge, quadraticamente nella fase finale, ed è molto accurato anche per i valori singolari piccoli. Come controllo indipendente la sezione calcola gli autovalori di AᵀA con il metodo di Jacobi simmetrico." },
      { titolo: "Approssimazione di rango basso e PCA",
        testo: "Troncando la somma A = Σσᵢuᵢvᵢᵀ ai primi k termini si ottiene Aₖ, di rango k. Il teorema di Eckart–Young–Mirsky afferma che Aₖ è la migliore approssimazione di rango al più k sia nella norma spettrale, con errore σₖ₊₁, sia nella norma di Frobenius, con errore √(σ²ₖ₊₁ + … + σ²ᵣ): nessun'altra matrice di rango k fa meglio. Un'immagine in scala di grigi è una matrice, e se i valori singolari decrescono in fretta pochi termini ne catturano la struttura, con una memoria proporzionale a k(m + n) invece che a mn. Per una nuvola di N punti, centrati sottraendo la media, la SVD della matrice dei dati fornisce le direzioni principali vᵢ, autovettori della matrice di covarianza, e le varianze σᵢ²/(N − 1); la frazione di varianza spiegata dalle prime componenti dice quanto bene un piano, o una retta, descrive i dati." },
      { titolo: "Minimi quadrati e condizionamento",
        testo: "Il problema min |Ax − b| con A di rango pieno per colonne ha un'unica soluzione, che soddisfa le equazioni normali AᵀAx = Aᵀb. Il numero di condizionamento κ₂(A) = σ_max/σ_min misura quanto errori relativi sui dati possono amplificarsi nella soluzione. Poiché κ₂(AᵀA) = κ₂(A)², risolvere le equazioni normali, per esempio con Cholesky, può perdere il doppio delle cifre rispetto al necessario. La fattorizzazione QR con le riflessioni di Householder lavora invece direttamente su A, A = QR con Q ortogonale, e riduce il problema al sistema triangolare Rx = Qᵀb, con una sensibilità governata da κ₂(A). La matrice di Hilbert, Hᵢⱼ = 1/(i + j − 1), è il caso di scuola: è simmetrica definita positiva e invertibile, con inversa a elementi interi, ma già κ₂(H₅) ≈ 4,77·10⁵ e il condizionamento cresce esponenzialmente con l'ordine." }
    ],
    formule: [
      ["A = U·Σ·Vᵀ = Σᵢ σᵢ·uᵢ·vᵢᵀ", "decomposizione ai valori singolari di una matrice reale qualsiasi, con U e V ortogonali e σ₁ ≥ σ₂ ≥ … ≥ 0"],
      ["σᵢ(A) = √λᵢ(AᵀA)", "i valori singolari sono le radici degli autovalori di AᵀA"],
      ["min_{rango B ≤ k} ‖A − B‖_F = √(σ²ₖ₊₁ + … + σ²ᵣ)", "teorema di Eckart–Young–Mirsky, minimo raggiunto dalla SVD troncata Aₖ"],
      ["κ₂(A) = σ_max/σ_min,  κ₂(AᵀA) = κ₂(A)²", "numero di condizionamento in norma 2 di una matrice di rango pieno per colonne"],
      ["A = Q·R ⇒ R·x = Qᵀ·b", "minimi quadrati con la fattorizzazione QR, con Q a colonne ortonormali e R triangolare superiore invertibile"]
    ],
    ipotesi: [
      "La SVD esiste per ogni matrice reale o complessa; i vettori singolari non sono unici quando ci sono valori singolari ripetuti o nulli.",
      "L'unicità della soluzione dei minimi quadrati richiede A di rango pieno per colonne; altrimenti si sceglie la soluzione di norma minima con la pseudoinversa.",
      "La PCA richiede dati centrati, e i risultati dipendono dalle unità di misura delle variabili.",
      "Eckart–Young vale per norme unitariamente invarianti come la spettrale e quella di Frobenius."
    ],
    errori: [
      "Confondere valori singolari e autovalori: coincidono in modulo solo per matrici normali, per esempio simmetriche.",
      "Calcolare i minimi quadrati sempre con le equazioni normali, anche quando A è mal condizionata.",
      "Fare la PCA senza centrare i dati, ottenendo come prima componente la direzione della media.",
      "Credere che un determinante piccolo indichi una matrice mal condizionata: conta il rapporto fra i valori singolari."
    ],
    esempio: {
      testo: "Trovare i valori singolari di A = [[3, 0], [4, 5]]. Si ha AᵀA = [[25, 20], [20, 25]], con autovalori 45 e 5, quindi σ₁ = √45 = 3√5 ≈ 6,708 e σ₂ = √5 ≈ 2,236. Il controllo con il determinante funziona: σ₁σ₂ = 15 = |det A|. Il condizionamento è κ₂ = 3, mentre quello di AᵀA è 9. Gli autovalori di A sono invece 3 e 5, diversi dai valori singolari perché A non è simmetrica.",
      risultato: "σ₁ = 3√5 ≈ 6,708, σ₂ = √5 ≈ 2,236, κ₂(A) = 3"
    },
    fonti: [
      "Trefethen, Bau, Numerical Linear Algebra, SIAM, lezioni 4–5 (SVD), 10–11 (Householder e minimi quadrati), 12–19 (condizionamento e stabilità)",
      "Golub, Van Loan, Matrix Computations, Johns Hopkins University Press, 4ª ed., cap. 2 (SVD), cap. 5 (minimi quadrati), cap. 8 (metodi di Jacobi)",
      "Strang, Linear Algebra and Its Applications, Cengage, 4ª ed., cap. 6 (SVD) e appendice sulla pseudoinversa",
      "Eckart, Young, The approximation of one matrix by another of lower rank, Psychometrika 1 (1936)"
    ],
    collegamenti: ['smatlin', 'smatvis', 'smatinfer', 'smatnum', 'staratura']
  };

  /* ── smatcodici ───────────────────────────────────────────────────────── */
  T['smatcodici'] = {
    titolo: "Codici correttori, cifre di controllo e curve ellittiche",
    sintesi: "Per proteggere i dati dagli errori si aggiunge ridondanza strutturata: il codice di Hamming (7,4) corregge un errore singolo, il CRC rileva errori a raffica, le cifre di controllo di ISBN e Luhn intercettano gli errori di battitura più comuni. Per proteggerli dagli sguardi indiscreti si usano gruppi in cui il logaritmo discreto è difficile, come i punti di una curva ellittica su un campo finito, alla base dello scambio di chiavi ECDH.",
    paragrafi: [
      { titolo: "Codici lineari e Hamming (7,4)",
        testo: "Un codice lineare binario [n, k] è un sottospazio di dimensione k di GF(2)ⁿ: k bit di informazione diventano n bit trasmessi. La distanza di Hamming fra due parole è il numero di posizioni in cui differiscono, e la distanza minima d del codice decide che cosa si può fare: rilevare fino a d − 1 errori o correggerne fino a ⌊(d − 1)/2⌋. Il codice di Hamming (7,4) ha d = 3 e corregge un errore singolo. Con la numerazione classica delle posizioni da 1 a 7, i bit di parità stanno in 1, 2 e 4 e ciascuno controlla le posizioni il cui numero binario contiene quella potenza di due; ricalcolando i tre controlli in ricezione si ottiene la sindrome, che letta in binario è proprio la posizione del bit sbagliato, e zero se non ci sono errori rilevabili. Il codice è perfetto: le 16 sfere di raggio 1 attorno alle parole di codice, di 8 elementi ciascuna, riempiono esattamente i 128 vettori." },
      { titolo: "CRC e cifre di controllo",
        testo: "Un controllo a ridondanza ciclica tratta il messaggio come un polinomio a coefficienti in GF(2) e vi accoda il resto della divisione per un polinomio generatore fissato; il ricevente ripete la divisione e segnala un errore se il resto non torna. Con un generatore di grado r con termine noto non nullo, ogni raffica di errori di lunghezza al più r viene rilevata. Il CRC-32 usa il polinomio 0x04C11DB7 in forma riflessa, con valore iniziale e complemento finale; il vettore di prova standard è la stringa «123456789», che dà 0xCBF43926. Il CRC rileva errori accidentali ma non protegge da modifiche intenzionali. Le cifre di controllo decimali sono più semplici: l'ISBN-13 pesa le cifre alternativamente 1 e 3 e impone che la somma sia multipla di 10, la formula di Luhn raddoppia una cifra sì e una no. Entrambe rilevano ogni errore su una sola cifra, ma non tutti gli scambi di cifre adiacenti: l'ISBN-13 manca gli scambi di cifre che differiscono di 5, Luhn lo scambio 09 ↔ 90." },
      { titolo: "Curve ellittiche e legge di gruppo",
        testo: "Una curva ellittica in forma di Weierstrass è l'insieme dei punti con y² = x³ + ax + b, con discriminante 4a³ + 27b² ≠ 0 affinché la curva sia liscia, più un punto all'infinito O. I punti formano un gruppo commutativo con O come elemento neutro: per sommare P e Q si traccia la retta per i due punti, che taglia la curva in un terzo punto R, e P + Q è il simmetrico di R rispetto all'asse x; per raddoppiare P si usa la tangente. In coordinate, con pendenza λ = (y_Q − y_P)/(x_Q − x_P), oppure λ = (3x_P² + a)/(2y_P) per il raddoppio, si ha x₃ = λ² − x_P − x_Q e y₃ = λ(x_P − x₃) − y_P. L'associatività non è evidente dalla costruzione e richiede una dimostrazione vera e propria. Le stesse formule hanno senso su un campo finito F_p con p primo maggiore di 3, dove la curva è un insieme finito di punti." },
      { titolo: "Curve su F_p, Hasse e logaritmo discreto",
        testo: "Il numero di punti #E di una curva su F_p, punto all'infinito compreso, si conta enumerando le x e chiedendosi se x³ + ax + b è un quadrato modulo p; il simbolo di Legendre dà il conteggio in forma compatta, #E = p + 1 + Σ (x³ + ax + b | p). Il teorema di Hasse afferma che |#E − (p + 1)| ≤ 2√p. Nello scambio di chiavi ECDH le parti concordano una curva e un punto G di ordine primo q; Alice sceglie un segreto a e pubblica aG, Bob sceglie b e pubblica bG, ed entrambi calcolano abG. Il multiplo aG si calcola con raddoppia-e-somma in un numero di operazioni proporzionale a log a, mentre ricavare a da aG, il logaritmo discreto, richiede con i migliori algoritmi generici, come passo-piccolo passo-gigante o rho di Pollard, circa √q operazioni: con q di 256 bit sono circa 2¹²⁸, un numero fuori dalla portata di qualunque calcolatore classico." }
    ],
    formule: [
      ["t = ⌊(d − 1)/2⌋", "numero di errori correggibili da un codice di distanza minima d"],
      ["2ᵏ·Σᵢ₌₀ᵗ C(n, i) ≤ 2ⁿ", "limite di Hamming (sphere packing); Hamming (7,4) lo raggiunge con uguaglianza: 16·8 = 128"],
      ["y² = x³ + a·x + b,  4a³ + 27b² ≠ 0", "curva ellittica in forma di Weierstrass corta, su un campo di caratteristica diversa da 2 e 3"],
      ["x₃ = λ² − x₁ − x₂,  y₃ = λ(x₁ − x₃) − y₁", "somma di punti, con λ pendenza della corda o della tangente"],
      ["|#E(F_p) − (p + 1)| ≤ 2√p", "teorema di Hasse sul numero di punti di una curva ellittica su F_p"]
    ],
    ipotesi: [
      "Hamming (7,4) corregge un solo errore per parola: con due errori la sindrome indica una posizione sbagliata.",
      "CRC e cifre di controllo rilevano errori casuali, non manipolazioni intenzionali.",
      "La legge di gruppo richiede una curva non singolare (4a³ + 27b² ≠ 0).",
      "La sicurezza di ECDH presuppone curve e parametri scelti bene e la difficoltà del logaritmo discreto, che non è dimostrata e cadrebbe con un calcolatore quantistico abbastanza grande."
    ],
    errori: [
      "Credere che una sindrome nulla garantisca l'assenza di errori: tre errori possono trasformare una parola di codice in un'altra.",
      "Sommare i punti di una curva ellittica sommando le coordinate.",
      "Dimenticare il punto all'infinito nel conteggio di #E.",
      "Pensare che con l'ISBN o con Luhn si rilevi qualunque scambio di cifre adiacenti."
    ],
    esempio: {
      testo: "Sulla curva y² = x³ + 2x + 2 su F₁₇ raddoppiare P = (5, 1). La pendenza della tangente è λ = (3·25 + 2)/(2·1) = 77/2; modulo 17 si ha 77 ≡ 9 e 2⁻¹ ≡ 9, quindi λ ≡ 81 ≡ 13. Allora x₃ = 13² − 2·5 = 159 ≡ 6 e y₃ = 13·(5 − 6) − 1 = −14 ≡ 3. La curva ha 19 punti, compreso O, in accordo con Hasse: |19 − 18| = 1 ≤ 2√17 ≈ 8,2.",
      risultato: "2P = (6, 3); #E(F₁₇) = 19"
    },
    fonti: [
      "MacWilliams, Sloane, The Theory of Error-Correcting Codes, North-Holland, cap. 1 (codici lineari e codici di Hamming) e capitoli sui codici ciclici",
      "Silverman, Tate, Rational Points on Elliptic Curves, Springer, cap. 1 (legge di gruppo) e cap. 4 (curve su campi finiti)",
      "Washington, Elliptic Curves: Number Theory and Cryptography, Chapman & Hall/CRC, 2ª ed., cap. 2 (legge di gruppo), cap. 4 (teorema di Hasse), cap. 5–6 (logaritmo discreto e crittografia)",
      "Koblitz, A Course in Number Theory and Cryptography, Springer, 2ª ed., cap. 6 (curve ellittiche)",
      "Hamming, Error detecting and error correcting codes, Bell System Technical Journal 29 (1950)"
    ],
    collegamenti: ['smatnumeri', 'smatalgebra', 'smatlin', 'smatlogica']
  };

  /* FINE */
})(typeof window !== 'undefined' ? window : globalThis);
