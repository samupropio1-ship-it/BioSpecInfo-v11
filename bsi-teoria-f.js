/* bsi-teoria-f.js — teoria delle sezioni (lotto F). BioSpecInfo · © Samuele Pio Provenzano */
(function (g) {
  'use strict';
  var T = g.BSITeoriaDati = g.BSITeoriaDati || {};

  T['stitr'] = {
    titolo: "Titolazioni acido-base e curve di pH",
    sintesi: "Una titolazione acido-base aggiunge una quantità nota di acido o base forte fino a consumare l'analita. La curva pH contro volume ha tre regioni leggibili: la soluzione iniziale, la zona tampone in cui pH ≈ pKa + log(base/acido), e il salto al punto equivalente, oltre il quale comanda l'eccesso di titolante. Da essa si ricavano la concentrazione dell'analita, il pKa e il criterio per scegliere l'indicatore.",
    paragrafi: [
      { titolo: "Il punto equivalente è un fatto stechiometrico",
        testo: "Il punto equivalente è l'istante in cui le moli di titolante aggiunte eguagliano, secondo la stechiometria, le moli di analita: per un acido monoprotico titolato con NaOH vale Cb·Veq = Ca·Va. Il volume equivalente non dipende dalla forza dell'acido né dal suo pKa; dipende solo da concentrazioni e volumi. Il punto finale è invece ciò che si osserva sperimentalmente, il viraggio di un indicatore o il massimo della derivata della curva potenziometrica, e la differenza fra i due è l'errore di titolazione. Nel simulatore la linea rossa segna Veq calcolato dalla stechiometria." },
      { titolo: "Le quattro regioni della curva di un acido debole",
        testo: "Prima di ogni aggiunta il pH è quello di un acido debole in acqua, [H₃O⁺] ≈ √(Ka·Ca) se la dissociazione è piccola. Fra lo 0 e il 100 % della titolazione in soluzione convivono HA e A⁻: è un tampone, e l'equazione di Henderson–Hasselbalch dà pH ≈ pKa + log(nNaOH/(nHA,0 − nNaOH)). A metà titolazione le due forme sono uguali e pH = pKa, il modo più semplice di misurare un pKa. Al punto equivalente resta solo la base coniugata A⁻, che idrolizza: il pH è basico e vale circa 7 + ½pKa + ½log C, dove C è la concentrazione di A⁻ dopo la diluizione. Oltre l'equivalenza il pH è fissato dall'eccesso di OH⁻ e la curva coincide con quella di un acido forte." },
      { titolo: "Acidi forti, basi deboli e forma del salto",
        testo: "Per un acido forte titolato con base forte la curva parte dal pH di Ca, sale lentamente e salta attorno a pH 7, perché al punto equivalente restano solo ioni spettatori. Per una base debole titolata con acido forte la curva è speculare: parte basica, attraversa una zona tampone in cui pH ≈ pKa(BH⁺) + log([B]/[BH⁺]), cioè il pH scende man mano che si forma BH⁺, e al punto equivalente è acida per idrolisi di BH⁺. L'ampiezza del salto diminuisce quando l'analita è più debole o più diluito; come regola pratica una titolazione con indicatore resta netta se Ka·Ca è almeno dell'ordine di 10⁻⁸." },
      { titolo: "Il trattamento esatto: bilancio di carica",
        testo: "Le formule per regioni sono approssimazioni che falliscono vicino all'inizio, al punto equivalente e quando il pKa è molto basso, come nel caso del primo protone dell'acido fosforico (pKa₁ ≈ 2,15), che a 0,1 M è dissociato per circa un quarto già prima di titolare. Il calcolo rigoroso parte dal bilancio di carica [H₃O⁺] + [Na⁺] = [A⁻] + [OH⁻], in cui [Na⁺] = Cb·Vb/(Va + Vb) e [A⁻] = α₁·Ca·Va/(Va + Vb) con α₁ = Ka/(Ka + [H₃O⁺]). Risolvendo per [H₃O⁺] a ogni volume si ottiene un'unica curva continua, senza giunzioni fra regioni, ed è il modo in cui lavorano i programmi di simulazione seri." },
      { titolo: "Scegliere l'indicatore",
        testo: "Un indicatore è a sua volta una coppia acido-base colorata, HIn ⇌ In⁻, che vira in un intervallo di circa pKIn ± 1. Va scelto in modo che questo intervallo cada dentro il salto verticale della curva: fenolftaleina (viraggio circa 8–10) per acido debole con base forte, rosso metile (circa 4,4–6,2) per base debole con acido forte, quasi qualunque indicatore fra 4 e 10 per acido forte con base forte a 0,1 M. Quando il salto è troppo piccolo si ricorre alla titolazione potenziometrica e si individua il punto finale dal massimo di dpH/dV o con il metodo di Gran." }
    ],
    formule: [
      ["Ca·Va = Cb·Veq", "condizione stechiometrica di equivalenza per un acido monoprotico; C in mol/L, V in mL o L purché coerenti"],
      ["pH = pKa + log([A⁻]/[HA])", "Henderson–Hasselbalch nella zona tampone; vale con concentrazioni analitiche quando la dissociazione è trascurabile rispetto a esse"],
      ["pH(PE) ≈ 7 + ½·pKa + ½·log C(A⁻)", "pH al punto equivalente di un acido debole titolato con base forte a 25 °C (pKw = 14), C in mol/L dopo la diluizione"],
      ["[H₃O⁺] + [Na⁺] = [A⁻] + [OH⁻]", "bilancio di carica da cui si ottiene la curva esatta, senza approssimazioni per regioni"]
    ],
    ipotesi: [
      "Si usano concentrazioni al posto delle attività e pKw = 14,00 (25 °C); a forza ionica elevata pKa e pKw apparenti cambiano.",
      "Henderson–Hasselbalch è attendibile fra circa il 10 % e il 90 % della titolazione e per pKa fra 3 e 11 a concentrazioni attorno a 0,1 M; fuori di qui serve il bilancio di carica.",
      "Per gli acidi poliprotici le regioni si separano solo se i pKa distano almeno 3–4 unità."
    ],
    errori: [
      "Pensare che al punto equivalente il pH sia sempre 7: lo è solo per acido forte con base forte; con un acido debole è basico, con una base debole è acido.",
      "Confondere punto equivalente e punto finale: il primo è stechiometrico, il secondo è quello che l'indicatore mostra.",
      "Applicare Henderson–Hasselbalch a Vb = 0 o al punto equivalente, dove uno dei due termini del rapporto è nullo e la formula diverge.",
      "Credere che un acido più debole richieda più titolante: il volume equivalente dipende solo dalle moli di acido."
    ],
    esempio: {
      testo: "25,00 mL di acido acetico 0,1000 M (pKa = 4,76) sono titolati con NaOH 0,1000 M. Veq = 0,1000·25,00/0,1000 = 25,00 mL. pH iniziale: [H₃O⁺] = √(10⁻⁴·⁷⁶·0,100) = 1,32·10⁻³ M, pH = 2,88. A 12,50 mL (metà) pH = pKa = 4,76. Al punto equivalente C(A⁻) = 2,500 mmol/50,00 mL = 0,0500 M; Kb = 10⁻¹⁴/10⁻⁴·⁷⁶ = 5,75·10⁻¹⁰, [OH⁻] = √(Kb·0,0500) = 5,36·10⁻⁶ M, pH = 8,73. A 26,00 mL l'eccesso di OH⁻ è 0,100 mmol in 51,00 mL: [OH⁻] = 1,96·10⁻³ M, pH = 11,29.",
      risultato: "pH = 2,88 → 4,76 (½ eq.) → 8,73 (PE, 25,00 mL) → 11,29 a 26,00 mL"
    },
    fonti: [
      "D. C. Harris, Quantitative Chemical Analysis, W. H. Freeman, 9ª ed., capitoli sugli equilibri acido-base monoprotici e sulle titolazioni acido-base",
      "D. A. Skoog, D. M. West, F. J. Holler, S. R. Crouch, Fundamentals of Analytical Chemistry, Cengage, 9ª ed., capitoli sulle curve di titolazione di neutralizzazione",
      "R. de Levie, Principles of Quantitative Chemical Analysis, McGraw-Hill, 1997, trattamento delle curve di titolazione mediante bilancio di carica"
    ],
    collegamenti: ['sbuffer', 'sdistr', 'spka', 'scfgraf', 'schiequil']
  };

  T['skin'] = {
    titolo: "Leggi cinetiche integrate e ordine di reazione",
    sintesi: "La velocità di una reazione dipende dalle concentrazioni secondo una legge cinetica, spesso della forma v = k[A]ⁿ. Integrando questa equazione differenziale si ottiene come [A] varia nel tempo: retta in [A] per l'ordine zero, in ln[A] per il primo, in 1/[A] per il secondo. Il grafico che diventa una retta rivela l'ordine; la pendenza dà la costante k e il tempo di dimezzamento ne è una conseguenza diretta.",
    paragrafi: [
      { titolo: "Velocità e legge cinetica",
        testo: "Per una reazione aA → prodotti la velocità si definisce v = −(1/a)·d[A]/dt, così che sia la stessa qualunque specie si segua. La legge cinetica v = k[A]ⁿ è un risultato sperimentale: l'ordine n non si ricava dai coefficienti stechiometrici, salvo che per uno stadio elementare, e può essere frazionario o nullo. La costante k ha unità che dipendono dall'ordine, mol L⁻¹ s⁻¹ per l'ordine zero, s⁻¹ per il primo, L mol⁻¹ s⁻¹ per il secondo, ed è questo il primo controllo da fare su un risultato. Nel simulatore la convenzione è v = −d[A]/dt = k[A]ⁿ, cioè a = 1." },
      { titolo: "Le tre leggi integrate",
        testo: "Per l'ordine zero −d[A]/dt = k integra in [A] = [A]₀ − kt: la concentrazione cala linearmente fino a esaurirsi, come accade per una reazione su una superficie catalitica satura o per un enzima a substrato saturante. Per il primo ordine −d[A]/dt = k[A] dà ln[A] = ln[A]₀ − kt, cioè un decadimento esponenziale, tipico del decadimento radioattivo e delle isomerizzazioni unimolecolari. Per il secondo ordine con un solo reagente −d[A]/dt = k[A]² dà 1/[A] = 1/[A]₀ + kt, una curva che si avvicina a zero molto più lentamente dell'esponenziale. Le tre curve partono dallo stesso punto ma hanno code diverse, ed è proprio la coda che le distingue." },
      { titolo: "Il tempo di dimezzamento come impronta dell'ordine",
        testo: "Il tempo di dimezzamento t½ è il tempo in cui [A] si riduce alla metà. Per l'ordine zero t½ = [A]₀/(2k) cresce con la concentrazione iniziale; per il primo ordine t½ = ln 2/k non dipende da [A]₀, e ogni dimezzamento successivo dura lo stesso tempo; per il secondo ordine t½ = 1/(k[A]₀) si allunga a ogni dimezzamento, perché la concentrazione da cui si parte è sempre più bassa. Misurare due tempi di dimezzamento consecutivi è quindi un test rapido: se sono uguali, la reazione è del primo ordine." },
      { titolo: "Come si determina l'ordine dai dati",
        testo: "Il metodo grafico consiste nel riportare [A], ln[A] e 1/[A] contro t e vedere quale grafico è rettilineo, che è quello che mostrano i tre pannelli della sezione. Il metodo è sensibile solo se la reazione è seguita abbastanza a lungo, almeno due o tre tempi di dimezzamento: nei primi istanti tutte le curve sono quasi rette. Con più reagenti si usa il metodo dell'isolamento, mettendo tutti in largo eccesso tranne uno per ottenere una legge di pseudo-primo ordine, oppure il metodo delle velocità iniziali, confrontando v₀ al variare di una sola concentrazione: log v₀ contro log[A]₀ ha pendenza n." },
      { titolo: "Dal comportamento macroscopico al meccanismo",
        testo: "Una legge cinetica semplice non prova un meccanismo semplice. Una reazione complessa può mostrare un ordine apparente intero in certe condizioni e cambiarlo in altre: la cinetica di Michaelis–Menten è di primo ordine in substrato a basse concentrazioni e di ordine zero a concentrazioni saturanti. Il valore di k dipende inoltre fortemente dalla temperatura secondo la legge di Arrhenius, per cui ogni costante cinetica va sempre riportata insieme alla temperatura a cui è stata misurata." }
    ],
    formule: [
      ["[A] = [A]₀ − k·t", "ordine zero: k in mol L⁻¹ s⁻¹, valida finché [A] > 0; t½ = [A]₀/(2k)"],
      ["ln[A] = ln[A]₀ − k·t", "primo ordine: k in s⁻¹; t½ = ln 2/k ≈ 0,693/k, indipendente da [A]₀"],
      ["1/[A] = 1/[A]₀ + k·t", "secondo ordine in un solo reagente con v = k[A]²: k in L mol⁻¹ s⁻¹; t½ = 1/(k[A]₀)"],
      ["v₀ = k·[A]₀ⁿ  ⇒  log v₀ = log k + n·log[A]₀", "metodo delle velocità iniziali: la pendenza del grafico bilogaritmico è l'ordine n"]
    ],
    ipotesi: [
      "Temperatura e volume costanti, reazione irreversibile (la reazione inversa è trascurata) e assenza di intermedi accumulati.",
      "Per il secondo ordine la forma 1/[A] vale per v = k[A]²; per v = k[A][B] con [A]₀ ≠ [B]₀ la legge integrata è diversa e contiene ln([B][A]₀/([A][B]₀)).",
      "Se la velocità si definisce come −d[A]/dt per 2A → prodotti, la k ottenuta è doppia di quella IUPAC: va sempre dichiarata la convenzione."
    ],
    errori: [
      "Ricavare l'ordine dai coefficienti dell'equazione bilanciata: vale solo per gli stadi elementari.",
      "Concludere che ln[A] contro t è lineare dopo aver seguito la reazione per una frazione piccola di t½: in quell'intervallo tutte le leggi sembrano rette.",
      "Dimenticare che le unità di k cambiano con l'ordine e confrontare costanti di ordini diversi."
    ],
    esempio: {
      testo: "Una reazione del primo ordine ha k = 0,100 s⁻¹ e [A]₀ = 1,00 M. Il tempo di dimezzamento è t½ = ln 2/0,100 = 6,93 s. Dopo 30,0 s, cioè 4,33 tempi di dimezzamento, [A] = 1,00·e^(−0,100·30,0) = e^(−3,00) = 0,0498 M. Se la stessa specie seguisse invece una cinetica di secondo ordine con k = 0,200 L mol⁻¹ s⁻¹, il primo dimezzamento richiederebbe t½ = 1/(0,200·1,00) = 5,00 s, il secondo altri 10,0 s.",
      risultato: "t½ = 6,93 s; [A](30 s) = 0,0498 M (primo ordine)"
    },
    fonti: [
      "P. Atkins, J. de Paula, J. Keeler, Physical Chemistry, Oxford University Press, 11ª ed., Focus 17 (cinetica chimica: leggi cinetiche e loro integrazione)",
      "K. J. Laidler, Chemical Kinetics, Harper & Row, 3ª ed., capitoli sulle reazioni semplici e sull'analisi dei dati cinetici",
      "IUPAC, Quantities, Units and Symbols in Physical Chemistry (Green Book), 3ª ed., sezione sulla cinetica chimica (definizione di velocità di reazione)"
    ],
    collegamenti: ['schicinet', 'senergia', 'scfgraf', 'sthermoadv']
  };

  T['sbuffer'] = {
    titolo: "Soluzioni tampone ed equazione di Henderson–Hasselbalch",
    sintesi: "Un tampone è una soluzione di un acido debole e della sua base coniugata in quantità confrontabili: aggiunte moderate di acido o base forte cambiano poco il pH perché vengono consumate dalla coppia. Il pH si stima con Henderson–Hasselbalch, pH = pKa + log([A⁻]/[HA]); la capacità di resistere alle aggiunte, il potere tampone β, è massima quando pH = pKa e cresce con la concentrazione totale.",
    paragrafi: [
      { titolo: "Perché un tampone resiste",
        testo: "In una soluzione che contiene HA e A⁻ un acido forte aggiunto reagisce con A⁻ formando HA, una base forte aggiunta reagisce con HA formando A⁻. Entrambe le reazioni sono praticamente complete, perciò l'effetto netto di un'aggiunta è solo spostare il rapporto [A⁻]/[HA], e il pH dipende dal logaritmo di quel rapporto. Se il rapporto passa da 1 a 1,2 il pH cambia di log 1,2 = 0,08 unità, mentre la stessa aggiunta in acqua pura avrebbe spostato il pH di diverse unità." },
      { titolo: "Da dove viene l'equazione",
        testo: "Dalla costante acida Ka = [H₃O⁺][A⁻]/[HA] si ricava, prendendo il logaritmo negativo, pH = pKa + log([A⁻]/[HA]): fin qui è un'identità esatta in termini di concentrazioni di equilibrio, o meglio di attività. L'approssimazione di Henderson–Hasselbalch consiste nel sostituire le concentrazioni di equilibrio con quelle analitiche, cioè con le quantità pesate o mescolate. È lecita quando la dissociazione di HA e l'idrolisi di A⁻ sono trascurabili rispetto alle concentrazioni messe in soluzione, condizione che vale per tamponi non troppo diluiti con pKa compreso circa fra 3 e 11." },
      { titolo: "Il potere tampone β",
        testo: "Il potere tampone si definisce β = dCb/dpH, le moli per litro di base forte necessarie a innalzare il pH di un'unità. Per un tampone monoprotico di concentrazione totale C, trascurando il contributo dell'acqua, vale β = 2,303·C·Ka·[H₃O⁺]/(Ka + [H₃O⁺])². Questa funzione ha un massimo esattamente a pH = pKa, dove vale 0,576·C, e scende a circa un terzo del massimo a pH = pKa ± 1: è la curva a campana disegnata nella sezione. Per questo si sceglie una coppia con pKa entro un'unità dal pH desiderato e si aumenta C, non il rapporto, quando serve più capacità." },
      { titolo: "Tamponi reali: temperatura e forza ionica",
        testo: "Il pKa di una coppia dipende dalla temperatura e dalla forza ionica. Il Tris ha dpKa/dT ≈ −0,028 K⁻¹, per cui un tampone preparato a 25 °C ha a 4 °C un pH più alto di circa 0,6 unità; i tamponi di Good come HEPES o MOPS sono stati scelti anche per una dipendenza minore. Con la forza ionica i coefficienti di attività scendono sotto 1 e il pKa apparente cambia, in modo tanto più marcato quanto maggiore è la carica delle specie coinvolte, come nel caso fosfato: per questo il pH di un tampone si misura sempre con l'elettrodo dopo la preparazione e non si affida al solo calcolo." }
    ],
    formule: [
      ["pH = pKa + log([A⁻]/[HA])", "Henderson–Hasselbalch; rapporto di concentrazioni analitiche di base coniugata e acido, adimensionale"],
      ["β = dCb/dpH = 2,303·C·Ka·[H₃O⁺]/(Ka + [H₃O⁺])²", "potere tampone di una coppia monoprotica di concentrazione totale C (mol/L); β in mol L⁻¹ per unità di pH"],
      ["β(max) = 2,303·C/4 ≈ 0,576·C a pH = pKa", "massimo del potere tampone, raggiunto quando [HA] = [A⁻]"],
      ["[A⁻]/[HA] = 10^(pH − pKa)", "rapporto necessario per preparare un tampone a un dato pH"]
    ],
    ipotesi: [
      "Concentrazioni analitiche al posto di quelle di equilibrio: errore trascurabile per C ≳ 10⁻² M e 3 ≲ pKa ≲ 11.",
      "Attività approssimate con concentrazioni; a forza ionica di 0,1 M o più il pKa apparente si sposta di alcuni decimi per coppie di carica elevata.",
      "L'espressione di β trascura il contributo di H₃O⁺ e OH⁻ dell'acqua, importante solo a pH < 3 o > 11."
    ],
    errori: [
      "Credere che un tampone tenga il pH costante qualunque cosa si aggiunga: quando l'acido o la base aggiunti superano le moli della forma che li consuma, la capacità è esaurita.",
      "Pensare che diluire un tampone non cambi nulla: il rapporto e quindi il pH restano quasi uguali, ma β diminuisce in proporzione.",
      "Usare la coppia sbagliata, per esempio acetato (pKa 4,76) per un tampone a pH 7,4: il rapporto richiesto sarebbe circa 440 e la capacità minima."
    ],
    esempio: {
      testo: "Un tampone contiene acido acetico 0,10 M e acetato di sodio 0,15 M (pKa = 4,76). pH = 4,76 + log(0,15/0,10) = 4,94. Si aggiungono 0,010 mol/L di HCl: l'acetato scende a 0,14 M e l'acido sale a 0,11 M, pH = 4,76 + log(0,14/0,11) = 4,86, una variazione di sole 0,07 unità. In acqua pura la stessa aggiunta porterebbe il pH da 7 a 2. Il potere tampone a pH 4,94 con C = 0,25 M è β = 2,303·0,25·Ka·[H₃O⁺]/(Ka + [H₃O⁺])² = 0,138 mol L⁻¹ pH⁻¹.",
      risultato: "pH = 4,94 → 4,86 dopo l'aggiunta; β ≈ 0,14 mol L⁻¹ per unità di pH"
    },
    fonti: [
      "D. C. Harris, Quantitative Chemical Analysis, W. H. Freeman, 9ª ed., capitolo sui tamponi (equilibri acido-base monoprotici)",
      "D. A. Skoog, D. M. West, F. J. Holler, S. R. Crouch, Fundamentals of Analytical Chemistry, Cengage, 9ª ed., capitolo sulle soluzioni tampone e la capacità tamponante",
      "N. E. Good et al., Hydrogen ion buffers for biological research, Biochemistry 5 (1966)"
    ],
    collegamenti: ['stitr', 'sdistr', 'spka', 'scalcav']
  };

  T['sdistr'] = {
    titolo: "Diagrammi di distribuzione delle specie",
    sintesi: "Un diagramma di distribuzione riporta la frazione α di ciascuna forma di un acido poliprotico in funzione del pH, o di ciascun complesso di un metallo in funzione di pL = −log[L]. Le frazioni dipendono solo dalle costanti di equilibrio e dalla variabile in ascissa, non dalla concentrazione totale; le curve si incrociano a pH = pKa e permettono di leggere a colpo d'occhio quale specie domina in qualunque condizione.",
    paragrafi: [
      { titolo: "Frazioni molari di un acido poliprotico",
        testo: "Per un acido HₙA con costanti Ka₁ … Kaₙ, la frazione della specie che ha perso i protoni è αᵢ = βᵢ·[H⁺]ⁿ⁻ⁱ/D, dove βᵢ = Ka₁·Ka₂·…·Kaᵢ (con β₀ = 1) e D è la somma di tutti i numeratori. Per un acido diprotico questo dà α(H₂A) = [H⁺]²/D, α(HA⁻) = Ka₁[H⁺]/D e α(A²⁻) = Ka₁Ka₂/D, con D = [H⁺]² + Ka₁[H⁺] + Ka₁Ka₂. Sono le formule calcolate dalla sezione per ogni punto dell'asse del pH. La somma delle frazioni è sempre 1, e la concentrazione di ogni specie si ottiene moltiplicando la sua α per la concentrazione analitica." },
      { titolo: "Come si legge il diagramma",
        testo: "Dove due curve adiacenti si incrociano le due specie sono in uguale quantità e il pH coincide con il pKa corrispondente, purché i pKa siano abbastanza distanti. A pH lontani più di due unità da un pKa la specie meno favorita è sotto l'1 %. Fra due pKa la specie intermedia raggiunge un massimo al pH medio ½(pKa₁ + pKa₂), che per un amminoacido senza catena laterale ionizzabile è il punto isoelettrico. La scala logaritmica è utile per vedere le specie minoritarie, perché in log α il ramo lontano da un pKa diventa una retta di pendenza intera, come in un diagramma di Sillén." },
      { titolo: "Il caso dei complessi metallici",
        testo: "Lo stesso formalismo descrive i complessi successivi M + L ⇌ ML, ML + L ⇌ ML₂ e così via, con costanti cumulative βᵢ = [MLᵢ]/([M][L]ⁱ). La frazione del metallo presente come MLᵢ è αᵢ = βᵢ[L]ⁱ/Σβⱼ[L]ʲ, e in ascissa si mette pL = −log[L] libero. In questo diagramma i complessi più ricchi di legante stanno a sinistra, dove [L] è alto. Per Cu²⁺ con NH₃ si vede che le specie intermedie non dominano mai in modo netto, perché le costanti successive sono vicine: è un esempio del perché le titolazioni complessometriche usano leganti chelanti come l'EDTA, che formano un solo complesso 1:1." },
      { titolo: "Le applicazioni",
        testo: "Il diagramma di distribuzione risponde a domande pratiche: quale forma di un farmaco è presente nel plasma a pH 7,4 e quindi quanto attraversa le membrane; a che pH il fosfato è soprattutto H₂PO₄⁻ e HPO₄²⁻, che è il motivo per cui il tampone fosfato si usa attorno a pH 7; quale frazione dell'EDTA è nella forma Y⁴⁻ attiva, che determina la costante condizionale di formazione nelle titolazioni complessometriche. Le stesse frazioni α compaiono nei bilanci di carica e di massa di qualunque calcolo di equilibrio." }
    ],
    formule: [
      ["αᵢ = (Ka₁·…·Kaᵢ)·[H⁺]ⁿ⁻ⁱ / Σⱼ (Ka₁·…·Kaⱼ)·[H⁺]ⁿ⁻ʲ", "frazione della specie che ha perso i protoni in un acido HₙA; adimensionale, Σαᵢ = 1"],
      ["α(HA) = [H⁺]/([H⁺] + Ka)  e  α(A⁻) = Ka/([H⁺] + Ka)", "caso monoprotico; le due frazioni si incrociano a 0,5 per pH = pKa"],
      ["αᵢ = βᵢ·[L]ⁱ / Σⱼ βⱼ·[L]ʲ", "frazione del metallo come complesso MLᵢ; βᵢ costante cumulativa, [L] concentrazione del legante libero in mol/L"],
      ["[specie i] = αᵢ·C(tot)", "concentrazione di equilibrio di una specie dalla concentrazione analitica totale"]
    ],
    ipotesi: [
      "Le costanti sono costanti di concentrazione valide alla forza ionica e alla temperatura a cui sono tabulate; i valori di pKa e logβ cambiano da una fonte all'altra di qualche decimo.",
      "Per i complessi l'ascissa è la concentrazione del legante libero, non quella totale: per passare al totale serve un bilancio di massa.",
      "Si trascurano equilibri paralleli (idrolisi del metallo, protonazione del legante, specie polinucleari)."
    ],
    errori: [
      "Attribuire alle specie di un amminoacido le cariche dell'acido generico HₙA: per la glicina H₂A corrisponde al catione H₃N⁺CH₂COOH, HA⁻ allo zwitterione neutro.",
      "Credere che il massimo della specie intermedia sia sempre vicino a 1: se i pKa distano meno di circa 3 unità il massimo è nettamente inferiore.",
      "Leggere in ascissa la concentrazione totale di legante invece di quella libera."
    ],
    esempio: {
      testo: "Si calcoli la distribuzione dell'acido fosforico a pH 7,00 con pKa₁ = 2,15, pKa₂ = 7,20, pKa₃ = 12,35. Con [H⁺] = 1,0·10⁻⁷ M i quattro numeratori sono [H⁺]³ = 1,0·10⁻²¹, Ka₁[H⁺]² = 7,08·10⁻¹⁷, Ka₁Ka₂[H⁺] = 4,47·10⁻¹⁷, Ka₁Ka₂Ka₃ = 1,99·10⁻²²; la somma è 1,155·10⁻¹⁶. Le frazioni sono α(H₃PO₄) = 8,7·10⁻⁶, α(H₂PO₄⁻) = 0,613, α(HPO₄²⁻) = 0,387, α(PO₄³⁻) = 1,7·10⁻⁶.",
      risultato: "a pH 7,00: 61,3 % H₂PO₄⁻, 38,7 % HPO₄²⁻, le altre specie sotto 10⁻⁵"
    },
    fonti: [
      "D. C. Harris, Quantitative Chemical Analysis, W. H. Freeman, 9ª ed., capitoli sugli acidi poliprotici (composizione frazionaria) e sulle titolazioni con EDTA",
      "D. A. Skoog, D. M. West, F. J. Holler, S. R. Crouch, Fundamentals of Analytical Chemistry, Cengage, 9ª ed., capitolo sui sistemi acido-base complessi e i valori di alfa",
      "A. E. Martell, R. M. Smith, Critical Stability Constants, Plenum Press, voll. 1–6 (costanti di protonazione e di complessazione)"
    ],
    collegamenti: ['stitr', 'sbuffer', 'spka', 'schiequil']
  };

  T['ssteich'] = {
    titolo: "Stechiometria: mole, concentrazioni e reagente limitante",
    sintesi: "La stechiometria traduce un'equazione chimica bilanciata in rapporti fra quantità di sostanza. La mole collega la scala atomica a quella del laboratorio attraverso la costante di Avogadro e la massa molare; le concentrazioni esprimono quanta sostanza c'è in un volume o in una massa; il reagente limitante decide quanto prodotto si può ottenere, e la resa percentuale misura quanto ci si è avvicinati a quel massimo.",
    paragrafi: [
      { titolo: "La mole e la massa molare",
        testo: "Dal 20 maggio 2019 la mole è definita fissando il valore esatto della costante di Avogadro, NA = 6,022 140 76·10²³ mol⁻¹: una mole contiene esattamente quel numero di entità specificate. La massa molare M di una sostanza, in g/mol, è numericamente uguale alla sua massa molecolare relativa ed è la somma delle masse atomiche medie degli elementi, pesate sulle abbondanze isotopiche naturali. La relazione n = m/M è il passaggio più frequente di tutta la chimica di laboratorio: dalla bilancia, che dà grammi, alla quantità di sostanza, che è ciò che compare nelle equazioni." },
      { titolo: "Modi diversi di esprimere la concentrazione",
        testo: "La molarità c = n/V è riferita al volume di soluzione e dipende quindi dalla temperatura, perché il volume si dilata. La molalità b = n(soluto)/m(solvente), in mol/kg, non dipende dalla temperatura ed è quella usata nelle proprietà colligative. La frazione molare x = nᵢ/Σn è adimensionale e serve nelle miscele e nella legge di Raoult. Le percentuali in massa e in volume e le parti per milione sono comode in analisi e in campo ambientale; per soluzioni acquose diluite 1 ppm in massa corrisponde a circa 1 mg/L, ma l'equivalenza è solo approssimata perché presuppone densità 1 g/mL." },
      { titolo: "Diluizioni e conservazione della quantità",
        testo: "Quando una soluzione si diluisce aggiungendo solvente la quantità di soluto non cambia, perciò c₁V₁ = c₂V₂. La relazione si usa per calcolare il volume di soluzione madre da prelevare, che si misura con una pipetta tarata e si porta a volume in un matraccio. È valida per qualunque unità di concentrazione basata sul volume, purché V₁ e V₂ siano nella stessa unità. Non vale se durante la diluizione avviene una reazione o se i volumi non sono additivi in modo da cambiare la definizione stessa di concentrazione, come nel mescolamento di etanolo e acqua." },
      { titolo: "Bilanciamento, rapporti molari e reagente limitante",
        testo: "Un'equazione bilanciata conserva il numero di atomi di ogni elemento e la carica totale; i suoi coefficienti sono rapporti fra quantità di sostanza, non fra masse. Data una reazione aA + bB → cC, il reagente limitante è quello con il valore minore di n/coefficiente: si esaurisce per primo e fissa l'avanzamento massimo ξ(max) = min(nA/a, nB/b). La resa teorica di C è c·ξ(max) moli; la resa percentuale è il rapporto fra la quantità ottenuta e quella teorica per cento. Una resa reale inferiore al 100 % nasce da reazioni incomplete o all'equilibrio, reazioni secondarie e perdite di isolamento." },
      { titolo: "Gas ideali e volume molare",
        testo: "Per i gas la quantità di sostanza si ricava da pressione, volume e temperatura con l'equazione di stato pV = nRT, con R = 8,314 J mol⁻¹ K⁻¹ = 0,082 06 L atm mol⁻¹ K⁻¹. A 0 °C e 1 atm il volume molare di un gas ideale è 22,414 L/mol; con la convenzione IUPAC attuale per le condizioni standard di temperatura e pressione, 0 °C e 1 bar, vale 22,711 L/mol. Conviene sempre dichiarare a quali condizioni ci si riferisce, perché i testi usano entrambe le definizioni." }
    ],
    formule: [
      ["n = m/M", "quantità di sostanza in mol da massa m (g) e massa molare M (g/mol)"],
      ["c = n/V ;  b = n(soluto)/m(solvente)", "molarità in mol/L e molalità in mol/kg"],
      ["c₁·V₁ = c₂·V₂", "diluizione: conservazione delle moli di soluto"],
      ["ξ(max) = min(nA/a, nB/b) ;  resa % = n(ottenuto)/(c·ξ(max))·100", "avanzamento massimo fissato dal reagente limitante e resa percentuale"],
      ["pV = nRT", "gas ideale: p in Pa, V in m³, T in K, R = 8,314 J mol⁻¹ K⁻¹"]
    ],
    ipotesi: [
      "Le masse molari usano masse atomiche standard IUPAC, che per alcuni elementi (H, C, O, S…) sono intervalli dipendenti dall'origine del campione; i valori convenzionali bastano per i calcoli di laboratorio.",
      "c₁V₁ = c₂V₂ presuppone che il soluto non reagisca e che il volume finale sia misurato, non calcolato sommando i volumi.",
      "pV = nRT è un modello: per gas a pressioni elevate o vicini alla condensazione servono equazioni di stato reali."
    ],
    errori: [
      "Confrontare le masse dei reagenti invece delle moli divise per i coefficienti per trovare il limitante.",
      "Usare i coefficienti stechiometrici come rapporti di massa.",
      "Confondere molarità e molalità, o usare la molarità a temperature diverse da quella di preparazione senza correzione.",
      "Applicare 22,4 L/mol a qualunque temperatura e pressione."
    ],
    esempio: {
      testo: "Si bruciano 4,00 g di CH₄ con 12,0 g di O₂: CH₄ + 2 O₂ → CO₂ + 2 H₂O. M(CH₄) = 16,043 g/mol, quindi n(CH₄) = 0,2493 mol; M(O₂) = 31,998 g/mol, quindi n(O₂) = 0,3750 mol. I rapporti n/coefficiente sono 0,2493 per CH₄ e 0,3750/2 = 0,1875 per O₂: l'ossigeno è limitante e ξ(max) = 0,1875 mol. Si formano al massimo 0,1875 mol di CO₂, cioè 0,1875·44,009 = 8,25 g, e restano 0,2493 − 0,1875 = 0,0618 mol di metano non reagito.",
      risultato: "O₂ limitante; resa teorica 8,25 g di CO₂; avanzano 0,062 mol di CH₄"
    },
    fonti: [
      "IUPAC, Quantities, Units and Symbols in Physical Chemistry (Green Book), 3ª ed., sezioni su quantità di sostanza e concentrazioni",
      "BIPM, The International System of Units (SI Brochure), 9ª ed., 2019, definizione della mole",
      "D. C. Harris, Quantitative Chemical Analysis, W. H. Freeman, 9ª ed., capitolo sulle misure chimiche (concentrazioni e preparazione di soluzioni)",
      "P. Atkins, J. de Paula, J. Keeler, Physical Chemistry, Oxford University Press, 11ª ed., Focus 1 (proprietà dei gas)"
    ],
    collegamenti: ['scalc', 'stitr', 'smm', 'srxnbal']
  };

  T['scalc'] = {
    titolo: "Calcoli di base: massa molare, insaturazioni, diluizioni, pH",
    sintesi: "Il calcolatore raccoglie quattro conti che ricorrono ogni giorno: la massa molare da una formula bruta, il grado di insaturazione che ne deriva, la diluizione c₁V₁ = c₂V₂ e il pH di un tampone con Henderson–Hasselbalch, più il filtro di Lipinski per la somiglianza a un farmaco orale. Ognuno è semplice, ma ognuno poggia su ipotesi precise che conviene conoscere per non usarlo fuori dal suo campo.",
    paragrafi: [
      { titolo: "Massa molare da una formula bruta",
        testo: "La massa molare è la somma delle masse atomiche standard moltiplicate per il numero di atomi di ciascun elemento: per l'aspirina C₉H₈O₄ vale 9·12,011 + 8·1,008 + 4·15,999 = 180,16 g/mol. Le masse atomiche standard sono medie pesate sulle abbondanze isotopiche naturali e la IUPAC le aggiorna periodicamente; per alcuni elementi oggi le pubblica come intervalli, perché la composizione isotopica varia con l'origine del campione, e per i calcoli correnti si usano valori convenzionali. Questa massa media non coincide con la massa monoisotopica che si osserva in spettrometria di massa ad alta risoluzione, che usa solo l'isotopo più abbondante di ogni elemento." },
      { titolo: "Grado di insaturazione",
        testo: "Il grado di insaturazione, o numero di doppi legami equivalenti, conta quanti anelli e legami π contiene una molecola. Per una formula CcHhNnOoXx vale DBE = (2c + 2 + n − h − x)/2: ossigeno e zolfo bivalenti non contribuiscono, gli alogeni contano come idrogeni, l'azoto trivalente aggiunge mezzo grado. Un doppio legame o un anello valgono 1, un triplo legame 2, un anello benzenico 4. Il risultato deve essere un intero non negativo per una molecola neutra a guscio chiuso; un valore semintero segnala un errore nella formula, un radicale o uno ione." },
      { titolo: "Diluizioni",
        testo: "In una diluizione la quantità di soluto si conserva, quindi c₁V₁ = c₂V₂. Lo strumento risolve l'equazione per il termine lasciato vuoto. Volumi e concentrazioni devono essere espressi in unità coerenti fra i due membri, ma non necessariamente in unità SI: mL con mL e mol/L con mol/L vanno bene. Il volume finale è quello del matraccio portato a segno, non la somma dei volumi di soluzione madre e di solvente, che non sono sempre additivi." },
      { titolo: "pH di un tampone e regola di Lipinski",
        testo: "Il pannello del pH applica pH = pKa + log([A⁻]/[HA]) con le concentrazioni analitiche inserite: è una buona stima per tamponi non troppo diluiti con pKa fra 3 e 11, mentre per soluzioni molto diluite o rapporti estremi serve il trattamento completo con bilanci di massa e di carica. La regola del cinque di Lipinski segnala come a rischio di scarso assorbimento orale le molecole con più di una violazione fra massa molare oltre 500, logP oltre 5, più di 5 donatori e più di 10 accettori di legame a idrogeno. È una regola empirica ricavata da farmaci assorbiti per diffusione passiva: non predice la biodisponibilità, ed esclude a torto i substrati di trasportatori e molti prodotti naturali." }
    ],
    formule: [
      ["M = Σ νᵢ·Aᵣ(i) g/mol", "massa molare come somma delle masse atomiche relative Aᵣ moltiplicate per il numero νᵢ di atomi di ogni elemento"],
      ["DBE = (2C + 2 + N − H − X)/2", "doppi legami equivalenti: C, N, H, X numeri di atomi di carbonio, azoto, idrogeno, alogeni; O e S non compaiono"],
      ["c₁·V₁ = c₂·V₂", "diluizione con conservazione delle moli di soluto"],
      ["pH = pKa + log([A⁻]/[HA])", "Henderson–Hasselbalch con concentrazioni analitiche"]
    ],
    ipotesi: [
      "La DBE presuppone valenze standard (C 4, N 3, O 2, H e alogeni 1); fosforo pentavalente, zolfo ossidato o ioni richiedono correzioni.",
      "Henderson–Hasselbalch trascura dissociazione e idrolisi rispetto alle concentrazioni analitiche e confonde attività con concentrazione.",
      "La regola di Lipinski riguarda l'assorbimento orale passivo e si considera violata con almeno due criteri fuori soglia nella formulazione originale."
    ],
    errori: [
      "Contare l'ossigeno nella formula della DBE.",
      "Usare la massa molare media per interpretare un picco molecolare in spettrometria di massa, dove conta la massa monoisotopica.",
      "Interpretare una sola violazione di Lipinski come esclusione: nella formulazione originale l'allarme scatta con due violazioni."
    ],
    esempio: {
      testo: "Per l'aspirina C₉H₈O₄: M = 9·12,011 + 8·1,008 + 4·15,999 = 108,099 + 8,064 + 63,996 = 180,159 g/mol. DBE = (2·9 + 2 − 8)/2 = 6, cioè anello benzenico (4) più due carbonili (C=O dell'estere e dell'acido). Volendo 250,0 mL di soluzione 0,0200 M a partire da una 0,500 M servono V₁ = 0,0200·250,0/0,500 = 10,0 mL di soluzione madre.",
      risultato: "M = 180,16 g/mol; DBE = 6; V₁ = 10,0 mL"
    },
    fonti: [
      "IUPAC Commission on Isotopic Abundances and Atomic Weights, Standard atomic weights of the elements (tabelle aggiornate, Pure and Applied Chemistry)",
      "R. M. Silverstein, F. X. Webster, D. J. Kiemle, Spectrometric Identification of Organic Compounds, Wiley, 7ª ed., capitolo 1 (formula molecolare e indice di deficienza di idrogeno)",
      "C. A. Lipinski, F. Lombardo, B. W. Dominy, P. J. Feeney, Experimental and computational approaches to estimate solubility and permeability in drug discovery and development settings, Advanced Drug Delivery Reviews 23 (1997)"
    ],
    collegamenti: ['ssteich', 'sdbe', 'smm', 'sbuffer', 'smolprop']
  };

  T['scalcav'] = {
    titolo: "Calcolatore avanzato: pI, Michaelis–Menten, ΔG°, van der Waals, isotopi, tamponi",
    sintesi: "Il calcolatore avanzato riunisce sei strumenti che collegano termodinamica, cinetica e analisi: il punto isoelettrico degli amminoacidi, i parametri di Michaelis–Menten dal grafico dei doppi reciproci, ΔG° dalla costante di equilibrio, la pressione di un gas reale con van der Waals, il profilo isotopico in spettrometria di massa e la composizione di un tampone. Ognuno ha un modello sottostante con limiti precisi.",
    paragrafi: [
      { titolo: "Punto isoelettrico",
        testo: "Il punto isoelettrico è il pH a cui la carica netta media di un amminoacido è zero. Per un amminoacido con catena laterale non ionizzabile la forma neutra è lo zwitterione, compreso fra la perdita del protone carbossilico (pKa₁) e quella dell'ammonio (pKa₂), e pI = (pKa₁ + pKa₂)/2. Con una catena ionizzabile si prende la media dei due pKa che delimitano la specie a carica zero: per gli amminoacidi acidi (Asp, Glu) e per quelli il cui gruppo laterale perde un protone neutro diventando anionico (Cys, Tyr) sono pKa₁ e pKaR; per quelli basici (Lys, Arg, His) sono pKaR e pKa₂. La regola corretta dipende quindi dalla carica della catena laterale, non dal valore numerico di pKaR: l'istidina, con pKaR ≈ 6, è basica e ha pI ≈ 7,6." },
      { titolo: "Michaelis–Menten e doppi reciproci",
        testo: "Per un enzima che segue v = Vmax[S]/(KM + [S]) il grafico di Lineweaver–Burk 1/v contro 1/[S] è una retta di pendenza KM/Vmax, intercetta 1/Vmax sull'asse y e −1/KM sull'asse x. È didatticamente chiaro ma statisticamente debole: il reciproco amplifica gli errori dei punti a [S] bassa, che finiscono lontani a destra e pesano molto nella regressione. Oggi i parametri si stimano con la regressione non lineare direttamente sull'iperbole; il doppio reciproco resta utile per riconoscere a colpo d'occhio il tipo di inibizione." },
      { titolo: "ΔG° e costante di equilibrio",
        testo: "La relazione ΔrG° = −RT ln K collega l'energia di Gibbs standard di reazione alla costante termodinamica, che è un rapporto di attività ed è adimensionale. A 25 °C ogni fattore 10 su K corrisponde a 5,71 kJ/mol. Il segno di ΔrG° dice se K è maggiore o minore di 1, non se una miscela qualsiasi reagisce spontaneamente: quello lo decide ΔrG = ΔrG° + RT ln Q, che dipende dalla composizione. Per costanti come Ka o Ksp vale la stessa relazione, con i rispettivi stati standard." },
      { titolo: "Van der Waals e gas reali",
        testo: "L'equazione (p + an²/V²)(V − nb) = nRT corregge il gas ideale in due modi: b, il covolume, sottrae il volume escluso dalle molecole stesse; a riduce la pressione per effetto delle attrazioni, che frenano le molecole dirette contro le pareti. A volumi molari grandi le due correzioni sono piccole e il gas è quasi ideale; a pressioni elevate prevale b e il gas è meno comprimibile dell'ideale, a temperature basse e volumi intermedi prevale a. I parametri tabulati differiscono leggermente fra le fonti e vanno usati con le unità dichiarate, qui L² atm mol⁻² e L mol⁻¹." },
      { titolo: "Profili isotopici e preparazione di tamponi",
        testo: "Ogni elemento con più isotopi stabili produce uno spettro di massa con picchi a M, M+1, M+2: la distribuzione si ottiene convolvendo le abbondanze di ogni atomo, che equivale a sviluppare un multinomio. Cloro (³⁵Cl:³⁷Cl ≈ 3:1) e bromo (⁷⁹Br:⁸¹Br ≈ 1:1) danno firme riconoscibili, e n atomi di Cl o Br producono picchi distanziati di 2 u con intensità date dal binomio. Per il tampone lo strumento calcola dalle frazioni α le concentrazioni di acido e base coniugata necessarie a una concentrazione totale e a un pH dati." }
    ],
    formule: [
      ["pI = (pKa₁ + pKa₂)/2", "amminoacido senza catena ionizzabile; per gli altri si usano i due pKa adiacenti alla specie a carica zero"],
      ["1/v = (KM/Vmax)·(1/[S]) + 1/Vmax", "linearizzazione di Lineweaver–Burk; KM nelle unità di [S], Vmax in quelle di v"],
      ["ΔrG° = −RT·ln K", "R = 8,314 J mol⁻¹ K⁻¹, T in K; K adimensionale riferita agli stati standard"],
      ["p = nRT/(V − nb) − a·n²/V²", "van der Waals: a in L² atm mol⁻², b in L mol⁻¹, R = 0,082 06 L atm mol⁻¹ K⁻¹"],
      ["I(M+2k)/I(M) per Clₙ: C(n,k)·(0,2424/0,7576)ᵏ", "intensità relative dei picchi isotopici dovuti a n atomi di cloro, dalle abbondanze ³⁵Cl 75,76 % e ³⁷Cl 24,24 %"]
    ],
    ipotesi: [
      "I pKa degli amminoacidi liberi sono valori tabulati a 25 °C e bassa forza ionica; nelle proteine i pKa dei residui possono spostarsi di diverse unità.",
      "Michaelis–Menten presuppone stato stazionario, [E] ≪ [S] e velocità iniziali; la linearizzazione distorce gli errori.",
      "Van der Waals è un modello qualitativo: descrive l'andamento ma sbaglia di molto vicino al punto critico e non predice bene Zc."
    ],
    errori: [
      "Scegliere i pKa per il pI in base al valore di pKaR (minore o maggiore di 7) invece che in base alla carica della catena laterale: si sbaglia il pI di istidina, cisteina e tirosina.",
      "Leggere ΔrG° > 0 come «la reazione non avviene»: avviene finché Q < K.",
      "Stimare KM e Vmax dal doppio reciproco con pochi punti a [S] bassa e fidarsi delle cifre decimali."
    ],
    esempio: {
      testo: "Per K = 100 a 25,0 °C: ΔrG° = −8,314·298,15·ln 100 = −11,42 kJ/mol. Per 1,000 mol di CO₂ in 22,40 L a 25,0 °C (a = 3,658 L² atm mol⁻², b = 0,042 86 L mol⁻¹) il gas ideale darebbe p = 0,082 057·298,15/22,40 = 1,0922 atm; van der Waals dà p = 0,082 057·298,15/(22,40 − 0,042 86) − 3,658/22,40² = 1,0943 − 0,0073 = 1,0870 atm, lo 0,48 % in meno: a questa densità domina l'attrazione.",
      risultato: "ΔrG° = −11,42 kJ/mol; p(vdW) = 1,087 atm contro 1,092 atm ideale"
    },
    fonti: [
      "D. L. Nelson, M. M. Cox, Lehninger Principles of Biochemistry, W. H. Freeman, 7ª ed., capitoli su amminoacidi (curve di titolazione e pI) ed enzimi (cinetica di Michaelis–Menten)",
      "P. Atkins, J. de Paula, J. Keeler, Physical Chemistry, Oxford University Press, 11ª ed., Focus 1 (gas reali, equazione di van der Waals) e Focus 6 (equilibrio chimico)",
      "J. H. Gross, Mass Spectrometry: A Textbook, Springer, 3ª ed., capitolo sugli isotopi e i profili isotopici"
    ],
    collegamenti: ['sthermoadv', 'sbuffer', 'sms', 'saa', 'scfgraf']
  };

  T['sthermoadv'] = {
    titolo: "Termodinamica avanzata: potenziali, relazioni di Maxwell, gas reali",
    sintesi: "La termodinamica classica si costruisce su tre principi e su poche funzioni di stato. Scegliendo le variabili controllate si passa dall'energia interna all'entalpia, all'energia di Helmholtz e a quella di Gibbs, ciascuna minima all'equilibrio nelle sue condizioni. Le derivate miste di questi potenziali danno le relazioni di Maxwell; il potenziale chimico governa equilibri di fase e di reazione; van 't Hoff e Clausius–Clapeyron descrivono come gli equilibri si spostano con la temperatura.",
    paragrafi: [
      { titolo: "I tre principi",
        testo: "Il primo principio afferma che l'energia interna è una funzione di stato e che dU = δq + δw, con la convenzione per cui il lavoro fatto sul sistema è positivo. Il secondo introduce l'entropia attraverso la disuguaglianza di Clausius dS ≥ δq/T, con l'uguaglianza solo per i processi reversibili; per un sistema isolato dS ≥ 0. Il terzo, nella forma di Planck, fissa a zero l'entropia di un cristallo perfetto a 0 K e permette di calcolare entropie assolute integrando Cp/T dalle basse temperature, aggiungendo ΔH/T a ogni transizione. Combinando primo e secondo principio per un sistema chiuso con solo lavoro di volume si ottiene l'equazione fondamentale dU = T dS − p dV." },
      { titolo: "Potenziali termodinamici e variabili naturali",
        testo: "Le trasformate di Legendre di U cambiano le variabili naturali: H = U + pV con dH = T dS + V dp; A = U − TS con dA = −S dT − p dV; G = H − TS con dG = −S dT + V dp. Ognuno è il criterio di equilibrio nelle condizioni corrispondenti: a T e V costanti un processo spontaneo diminuisce A, a T e p costanti diminuisce G. Il calo di A misura il lavoro massimo totale ottenibile a temperatura costante, il calo di G il lavoro massimo diverso da quello di volume, per esempio elettrico in una pila. Dalla forma dei differenziali si leggono subito le derivate: (∂G/∂T)p = −S, (∂G/∂p)T = V, da cui l'equazione di Gibbs–Helmholtz (∂(G/T)/∂T)p = −H/T²." },
      { titolo: "Le relazioni di Maxwell",
        testo: "Poiché i potenziali sono funzioni di stato, i loro differenziali sono esatti e le derivate seconde miste coincidono. Da dA = −S dT − p dV segue (∂S/∂V)T = (∂p/∂T)V, da dG segue (∂S/∂p)T = −(∂V/∂T)p. Queste uguaglianze trasformano grandezze non misurabili direttamente, come la variazione di entropia con il volume, in grandezze ricavabili dall'equazione di stato. Un esempio importante è Cp − CV = TVα²/κT, con α coefficiente di dilatazione e κT compressibilità isoterma: per un gas ideale si riduce a nR, per i liquidi è piccola ma non nulla." },
      { titolo: "Potenziale chimico ed equilibrio",
        testo: "Per un sistema aperto dG = −S dT + V dp + Σ μᵢ dnᵢ, e μᵢ = (∂G/∂nᵢ)T,p,nⱼ è il potenziale chimico. Per un gas ideale μ = μ° + RT ln(p/p°), in soluzione μ = μ° + RT ln a. All'equilibrio di fase il potenziale chimico di ogni componente è uguale in tutte le fasi; all'equilibrio di reazione Σ νᵢμᵢ = 0, da cui ΔrG° = −RT ln K. Il grado di avanzamento ξ, con nᵢ = nᵢ,₀ + νᵢξ, descrive la composizione durante la reazione con una sola variabile: G(ξ) ha un minimo e lì si trova l'equilibrio." },
      { titolo: "Dipendenza dalla temperatura e transizioni di fase",
        testo: "L'equazione di van 't Hoff d ln K/dT = ΔrH°/RT² mostra che K cresce con T per le reazioni endotermiche e cala per quelle esotermiche; se ΔrH° è circa costante, ln K contro 1/T è una retta di pendenza −ΔrH°/R. L'equazione di Clapeyron dp/dT = ΔtrsH/(T ΔtrsV) descrive le curve di coesistenza; per gli equilibri con un vapore ideale, trascurando il volume della fase condensata, diventa Clausius–Clapeyron. Nella classificazione di Ehrenfest le transizioni del primo ordine hanno discontinuità in S e V e quindi calore latente; quelle continue mostrano anomalie solo nelle derivate seconde, come Cp." }
    ],
    formule: [
      ["dU = T dS − p dV ;  dG = −S dT + V dp + Σ μᵢ dnᵢ", "equazioni fondamentali in variabili naturali per sistemi chiusi e aperti"],
      ["(∂S/∂V)T = (∂p/∂T)V ;  (∂S/∂p)T = −(∂V/∂T)p", "due relazioni di Maxwell, da A e da G"],
      ["w = −nRT·ln(V₂/V₁)", "lavoro nell'espansione isoterma reversibile di un gas ideale (J); ΔU = 0, q = −w"],
      ["ln(K₂/K₁) = −(ΔrH°/R)·(1/T₂ − 1/T₁)", "van 't Hoff integrata con ΔrH° costante; T in K"],
      ["ln(p₂/p₁) = −(ΔvapH/R)·(1/T₂ − 1/T₁)", "Clausius–Clapeyron: vapore ideale, volume del liquido trascurabile, ΔvapH costante"],
      ["Z = pVm/RT = 1 + B/Vm + C/Vm² + …", "sviluppo del viriale: B e C coefficienti dipendenti da T"]
    ],
    ipotesi: [
      "Le equazioni con differenziali esatti valgono per stati di equilibrio e trasformazioni reversibili; per i processi irreversibili valgono solo i bilanci fra stati iniziale e finale.",
      "Van 't Hoff e Clausius–Clapeyron integrate presuppongono entalpie costanti nell'intervallo di temperatura: su intervalli ampi l'errore è di qualche per cento o più.",
      "La classificazione di Ehrenfest non descrive bene le transizioni continue reali, in cui Cp spesso diverge invece di saltare."
    ],
    errori: [
      "Usare ΔG < 0 come criterio di spontaneità a volume costante: lì il criterio è ΔA < 0.",
      "Confondere ΔrG° (stati standard, fisso a una data T) con ΔrG (composizione attuale).",
      "Dimenticare il segno del lavoro: nella convenzione IUPAC un'espansione ha w < 0.",
      "Applicare Clausius–Clapeyron alla fusione, dove il volume della fase condensata non è trascurabile: serve Clapeyron."
    ],
    esempio: {
      testo: "Una mole di gas ideale si espande in modo isotermo e reversibile a 298,15 K da 10,0 a 20,0 L. Il lavoro è w = −nRT ln(V₂/V₁) = −1·8,314·298,15·ln 2 = −1718 J; poiché l'energia interna di un gas ideale dipende solo da T, ΔU = 0 e q = +1718 J. La variazione di entropia del gas è ΔS = q(rev)/T = nR ln 2 = +5,76 J/K. Se la stessa espansione avvenisse liberamente nel vuoto, w = q = 0 ma ΔS del gas resterebbe +5,76 J/K, perché S è una funzione di stato.",
      risultato: "w = −1,72 kJ; q = +1,72 kJ; ΔU = 0; ΔS = +5,76 J/K"
    },
    fonti: [
      "P. Atkins, J. de Paula, J. Keeler, Physical Chemistry, Oxford University Press, 11ª ed., Focus 2 e 3 (primo, secondo e terzo principio; relazioni di Maxwell) e Focus 4–6",
      "D. A. McQuarrie, J. D. Simon, Physical Chemistry: A Molecular Approach, University Science Books, 1997, capitoli sulle funzioni di Helmholtz e di Gibbs e sugli equilibri di fase",
      "H. B. Callen, Thermodynamics and an Introduction to Thermostatistics, Wiley, 2ª ed., capitoli sulle trasformate di Legendre e sulle relazioni di Maxwell"
    ],
    collegamenti: ['sphase', 'schifasi', 'schiequil', 'scalcav', 'sfistermo', 'sfisstat']
  };

  T['senergia'] = {
    titolo: "Profili energetici di reazione",
    sintesi: "Un profilo energetico rappresenta l'energia di un sistema che reagisce lungo la coordinata di reazione. I minimi sono reagenti, intermedi e prodotti; i massimi sono stati di transizione. La differenza fra reagenti e prodotti decide la termodinamica, l'altezza della barriera decide la cinetica. Leggere questi diagrammi permette di riconoscere lo stadio lento, il ruolo di un catalizzatore e la differenza fra controllo cinetico e termodinamico.",
    paragrafi: [
      { titolo: "Coordinata di reazione e stato di transizione",
        testo: "La coordinata di reazione è un percorso sulla superficie di energia potenziale che collega i reagenti ai prodotti seguendo il cammino di minima energia. Lo stato di transizione è il punto più alto di questo cammino ma un minimo in tutte le altre direzioni: un punto di sella, che non si può isolare e vive per il tempo di una vibrazione molecolare. Un intermedio è invece un minimo locale, una specie reale che in linea di principio si può osservare o intrappolare, come il carbocatione nella SN1. Un profilo con un solo massimo descrive una reazione concertata, uno con n massimi una reazione in n stadi elementari." },
      { titolo: "Energia di attivazione, entalpia e energia di Gibbs",
        testo: "Sui diagrammi didattici l'asse verticale è spesso chiamato genericamente energia, ma conviene sapere che cosa si rappresenta. L'energia di attivazione di Arrhenius Ea è una grandezza empirica ricavata dalla pendenza di ln k contro 1/T. Nella teoria dello stato di transizione la costante cinetica è k = (kBT/h)·e^(−Δ‡G°/RT), e la barriera rilevante è l'energia di Gibbs di attivazione Δ‡G°, che contiene un termine entropico. Per una reazione unimolecolare in soluzione Ea ≈ Δ‡H° + RT. Analogamente la differenza fra i livelli di reagenti e prodotti è ΔrG°, che decide l'equilibrio, oppure ΔrH°, che decide se la reazione libera calore: esoergonica ed esotermica non sono sinonimi." },
      { titolo: "Lo stadio che determina la velocità",
        testo: "In un meccanismo a più stadi la velocità complessiva è controllata, in prima approssimazione, dallo stadio con lo stato di transizione più alto rispetto al punto di partenza, non semplicemente da quello con la barriera locale più grande. Nella SN1 la ionizzazione a carbocatione ha la barriera più alta e lo stadio successivo, l'attacco del nucleofilo, è rapido: la velocità dipende solo dal substrato. Il postulato di Hammond aggiunge una regola qualitativa: lo stato di transizione somiglia alla specie stabile a cui è più vicino in energia, per cui in uno stadio endoergonico assomiglia ai prodotti di quello stadio." },
      { titolo: "Catalizzatori",
        testo: "Un catalizzatore offre un cammino diverso con barriere più basse e viene rigenerato; non cambia i livelli di reagenti e prodotti, quindi non cambia K, e accelera nella stessa misura reazione diretta e inversa. Poiché k dipende esponenzialmente dalla barriera, abbassarla di 10 kJ/mol a 25 °C moltiplica la costante per circa 57, abbassarla di 60 kJ/mol per circa 3·10¹⁰, se il fattore preesponenziale resta invariato. È l'ordine di grandezza dell'accelerazione prodotta da molti enzimi." },
      { titolo: "Controllo cinetico e termodinamico",
        testo: "Quando due prodotti si formano da uno stesso reagente con barriere diverse, a bassa temperatura e tempi brevi prevale quello con la barriera più bassa, il prodotto cinetico; se le reazioni sono reversibili e si lascia il tempo di equilibrare, prevale il prodotto più stabile, quello termodinamico. Esempi classici sono l'addizione di HBr al butadiene, 1,2 a freddo e 1,4 a caldo, e la formazione di enolati cinetici o termodinamici. Nel profilo energetico si riconoscono confrontando le altezze delle barriere con le profondità dei minimi finali." }
    ],
    formule: [
      ["k = A·e^(−Ea/RT)", "legge di Arrhenius: A fattore preesponenziale nelle unità di k, Ea in J/mol, T in K"],
      ["k = (kB·T/h)·e^(−Δ‡G°/RT)", "equazione di Eyring (teoria dello stato di transizione) per una reazione unimolecolare; kB/h = 2,084·10¹⁰ K⁻¹ s⁻¹"],
      ["k(cat)/k(non cat) = e^(ΔEa/RT)", "accelerazione dovuta a un abbassamento ΔEa della barriera, a parità di fattore preesponenziale"],
      ["ΔrG° = −RT·ln K", "il dislivello fra reagenti e prodotti in energia di Gibbs standard fissa la costante di equilibrio"]
    ],
    ipotesi: [
      "Un profilo unidimensionale è una proiezione: la superficie reale ha 3N − 6 dimensioni e il cammino di reazione può essere curvo.",
      "Il confronto fra barriere tramite esponenziali presuppone fattori preesponenziali simili; se l'entropia di attivazione cambia molto la conclusione può cambiare.",
      "I valori numerici dei profili della sezione sono illustrativi e dipendono da substrato, solvente e temperatura."
    ],
    errori: [
      "Confondere un intermedio con uno stato di transizione: il primo è un minimo, il secondo una sella.",
      "Credere che un catalizzatore sposti l'equilibrio verso i prodotti.",
      "Usare «endotermico» per ΔG > 0: endotermico si riferisce a ΔH > 0, endoergonico a ΔG > 0.",
      "Identificare lo stadio lento con quello dalla barriera locale più alta invece che con lo stato di transizione più alto in assoluto."
    ],
    esempio: {
      testo: "Un catalizzatore abbassa l'energia di attivazione di una reazione da 140 a 80 kJ/mol a 25 °C, lasciando invariato A. Il rapporto delle costanti è k(cat)/k = exp(60 000/(8,314·298,15)) = exp(24,20) = 3,2·10¹⁰. Un abbassamento di soli 10 kJ/mol darebbe exp(4,03) = 56. La costante di equilibrio non cambia, perché ΔrG° (qui −40 kJ/mol) non dipende dal cammino.",
      risultato: "accelerazione ≈ 3·10¹⁰ per ΔEa = 60 kJ/mol; K invariata"
    },
    fonti: [
      "E. V. Anslyn, D. A. Dougherty, Modern Physical Organic Chemistry, University Science Books, 2006, capitolo sugli esperimenti cinetici e i diagrammi energetici (postulato di Hammond, controllo cinetico e termodinamico)",
      "P. Atkins, J. de Paula, J. Keeler, Physical Chemistry, Oxford University Press, 11ª ed., Focus 17 e 18 (Arrhenius, teoria dello stato di transizione)",
      "IUPAC Gold Book, voci «transition state», «reaction coordinate», «rate-controlling step»"
    ],
    collegamenti: ['skin', 'schipes', 'schicinet', 'sanimmech', 'scfgraf']
  };

  T['sphase'] = {
    titolo: "Diagrammi di fase delle sostanze pure",
    sintesi: "Il diagramma di fase pressione-temperatura di una sostanza pura mostra in quali condizioni è stabile il solido, il liquido o il vapore. Le curve di coesistenza separano le regioni e si incontrano nel punto triplo; la curva liquido-vapore termina nel punto critico, oltre il quale esiste un solo fluido. La regola delle fasi di Gibbs conta i gradi di libertà, l'equazione di Clapeyron dà la pendenza delle curve.",
    paragrafi: [
      { titolo: "Regioni, curve e punti notevoli",
        testo: "Dentro una regione esiste una sola fase e temperatura e pressione si possono variare indipendentemente. Lungo una curva coesistono due fasi in equilibrio: la curva di tensione di vapore fra liquido e gas, quella di sublimazione fra solido e gas, quella di fusione fra solido e liquido. Il punto triplo è l'unico punto in cui le tre fasi coesistono: per l'acqua 273,16 K e 611,657 Pa, per la CO₂ 216,59 K e 518 kPa. Il punto critico, per l'acqua 647,096 K e 22,064 MPa, per la CO₂ 304,13 K e 7,377 MPa, chiude la curva liquido-vapore: lì densità del liquido e del vapore diventano uguali e la superficie di separazione scompare." },
      { titolo: "La regola delle fasi",
        testo: "La regola delle fasi di Gibbs F = C − P + 2 dà il numero di variabili intensive indipendenti, con C numero di componenti e P numero di fasi. Per una sostanza pura C = 1 e F = 3 − P: due variabili libere in una regione, una lungo una curva, nessuna al punto triplo. È per questo che la temperatura di ebollizione dell'acqua è fissata una volta scelta la pressione, e che il punto triplo dell'acqua è stato usato come riferimento della scala kelvin fino al 2019: è riproducibile senza dover controllare alcuna variabile." },
      { titolo: "Le pendenze: Clapeyron",
        testo: "Lungo una curva di coesistenza il potenziale chimico delle due fasi è uguale, e da questa condizione segue l'equazione di Clapeyron dp/dT = ΔtrsH/(T·ΔtrsV). Per l'evaporazione e la sublimazione ΔH e ΔV sono entrambi positivi e le curve salgono. Per la fusione della maggior parte delle sostanze il liquido è meno denso del solido e la curva ha pendenza positiva e ripidissima; l'acqua è un'eccezione, perché il ghiaccio Ih è meno denso dell'acqua liquida, ΔfusV < 0 e la curva di fusione pende a sinistra. Nella CO₂ la pressione del punto triplo supera 1 atm: a pressione ambiente il ghiaccio secco sublima a −78,5 °C senza fondere." },
      { titolo: "Clausius–Clapeyron e tensione di vapore",
        testo: "Per gli equilibri con il vapore si può trascurare il volume della fase condensata e trattare il vapore come ideale: si ottiene d ln p/dT = ΔvapH/RT², che integrata con ΔvapH costante dà ln(p₂/p₁) = −(ΔvapH/R)(1/T₂ − 1/T₁). Il grafico di ln p contro 1/T è quasi rettilineo e la pendenza dà l'entalpia di vaporizzazione. L'approssimazione peggiora su intervalli ampi, perché ΔvapH diminuisce con la temperatura fino ad annullarsi al punto critico; per questo i dati di riferimento si descrivono con equazioni empiriche come quella di Antoine o le correlazioni IAPWS." },
      { titolo: "Fluido supercritico",
        testo: "Oltre la temperatura e la pressione critiche non c'è più distinzione fra liquido e gas: comprimendo, la densità aumenta in modo continuo senza condensazione. Il fluido supercritico ha densità vicina a quella di un liquido e viscosità e diffusività vicine a quelle di un gas. La CO₂ supercritica, accessibile già a 31 °C e 74 bar, si usa per estrarre la caffeina dal caffè, oli essenziali e principi attivi, e come fase mobile nella cromatografia a fluido supercritico." }
    ],
    formule: [
      ["F = C − P + 2", "regola delle fasi di Gibbs: F gradi di libertà, C componenti, P fasi in equilibrio"],
      ["dp/dT = ΔtrsH/(T·ΔtrsV)", "equazione di Clapeyron, esatta per qualunque transizione del primo ordine; ΔH in J/mol, ΔV in m³/mol"],
      ["ln(p₂/p₁) = −(ΔvapH/R)·(1/T₂ − 1/T₁)", "Clausius–Clapeyron integrata: vapore ideale, volume del liquido trascurabile, ΔvapH costante"]
    ],
    ipotesi: [
      "Il diagramma riguarda una sostanza pura all'equilibrio; fasi metastabili come il liquido sottoraffreddato non vi compaiono.",
      "Le curve disegnate nella sezione sono schematiche; i valori dei punti tripli e critici sono quelli di riferimento.",
      "Ad alte pressioni il ghiaccio presenta molte altre forme cristalline (II, III, V, VI…) non rappresentate."
    ],
    errori: [
      "Spiegare il pattinaggio con la sola fusione per pressione: il calo della temperatura di fusione sotto una lama è di pochi decimi di grado per decine di bar, insufficiente; contano soprattutto lo strato quasi liquido superficiale e il riscaldamento per attrito.",
      "Pensare che al punto critico il liquido «bolla»: semplicemente le due fasi diventano indistinguibili.",
      "Usare Clausius–Clapeyron per la curva di fusione."
    ],
    esempio: {
      testo: "Si stimi la tensione di vapore dell'acqua a 25,0 °C sapendo che bolle a 100,0 °C sotto 101 325 Pa e che ΔvapH = 40,66 kJ/mol. ln(p₂/101 325) = −(40 660/8,314)·(1/298,15 − 1/373,15) = −3,297, quindi p₂ = 101 325·e^(−3,297) = 3,75 kPa. Il valore sperimentale è 3,17 kPa: l'errore del 18 % nasce dall'aver tenuto costante ΔvapH, che a 25 °C vale in realtà circa 44,0 kJ/mol.",
      risultato: "p(25 °C) ≈ 3,7 kPa stimata contro 3,17 kPa sperimentale"
    },
    fonti: [
      "P. Atkins, J. de Paula, J. Keeler, Physical Chemistry, Oxford University Press, 11ª ed., Focus 4 (trasformazioni fisiche delle sostanze pure)",
      "W. Wagner, A. Pruß, The IAPWS formulation 1995 for the thermodynamic properties of ordinary water substance, Journal of Physical and Chemical Reference Data 31 (2002)",
      "R. Span, W. Wagner, A new equation of state for carbon dioxide, Journal of Physical and Chemical Reference Data 25 (1996)"
    ],
    collegamenti: ['schifasi', 'sthermoadv', 'schidist', 'scroma']
  };

  T['scroma'] = {
    titolo: "Cromatografia: ritenzione, efficienza e risoluzione",
    sintesi: "In cromatografia i componenti di una miscela si separano perché si ripartiscono in modo diverso fra una fase mobile e una stazionaria. Tre grandezze descrivono il risultato: il fattore di ritenzione k, quanto a lungo una sostanza è trattenuta; la selettività α, quanto la colonna distingue due sostanze; il numero di piatti N, quanto stretti restano i picchi. La risoluzione dipende da tutte e tre secondo l'equazione di Purnell, e l'equazione di van Deemter spiega come la velocità del flusso allarga le bande.",
    paragrafi: [
      { titolo: "Ritenzione: tM, tR e k",
        testo: "Il tempo morto tM è il tempo impiegato da una specie non trattenuta, che viaggia alla velocità della fase mobile. Un analita esce al tempo di ritenzione tR, più tardi perché passa una parte del tempo nella fase stazionaria. Il fattore di ritenzione k = (tR − tM)/tM è il rapporto fra il tempo trascorso nella fase stazionaria e quello nella mobile, e coincide con il rapporto fra le quantità di analita nelle due fasi all'equilibrio: k = K·Vs/Vm, con K costante di ripartizione. Non dipende dalla lunghezza della colonna né dal flusso, ed è perciò la grandezza che si confronta fra metodi. Valori fra circa 1 e 10 sono un buon compromesso fra separazione e durata dell'analisi." },
      { titolo: "Selettività ed efficienza",
        testo: "La selettività α = k₂/k₁ ≥ 1 misura quanto diversamente la fase stazionaria trattiene due sostanze: se α = 1 nessuna colonna, per quanto lunga, potrà separarle. L'efficienza si esprime con il numero di piatti teorici N, ricavato dalla larghezza dei picchi: per un picco gaussiano N = (tR/σ)² = 16(tR/W)² = 5,54(tR/W½)², con W larghezza alla base fra le tangenti e W½ larghezza a metà altezza. L'altezza equivalente a un piatto teorico H = L/N misura l'allargamento per unità di lunghezza ed è la grandezza da minimizzare." },
      { titolo: "La risoluzione e l'equazione di Purnell",
        testo: "La risoluzione Rs = ΔtR/[(W₁ + W₂)/2] confronta la distanza fra due picchi con la loro larghezza. Rs = 1,5 corrisponde, per picchi gaussiani di area simile, a una separazione praticamente alla linea di base, con sovrapposizione dell'ordine dello 0,1 %; Rs = 1,0 lascia ancora qualche per cento di sovrapposizione. Esprimendo tutto con N, α e k si ottiene l'equazione di Purnell Rs = (√N/4)·((α − 1)/α)·(k₂/(1 + k₂)). I tre fattori sono indipendenti: raddoppiare Rs agendo solo su N richiede di quadruplicare i piatti, cioè colonna, tempo e contropressione quattro volte maggiori, mentre portare α da 1,05 a 1,10 quasi raddoppia il termine di selettività. Il termine k/(1 + k) satura invece rapidamente: oltre k ≈ 10 non conviene aumentare la ritenzione." },
      { titolo: "Perché i picchi si allargano: van Deemter",
        testo: "L'equazione di van Deemter H = A + B/u + C·u descrive H in funzione della velocità lineare u della fase mobile. Il termine A, diffusione per cammini multipli, nasce dai percorsi di lunghezza diversa fra le particelle di riempimento, non dipende da u e diminuisce con particelle piccole e uniformi; nelle colonne capillari aperte manca, e si parla di equazione di Golay. Il termine B/u è la diffusione longitudinale, dominante a basse velocità e importante soprattutto in gascromatografia perché nei gas i coefficienti di diffusione sono circa 10⁴ volte maggiori che nei liquidi. Il termine C·u è il trasferimento di massa fra le fasi, che domina ad alte velocità. La curva ha un minimo a u(opt) = √(B/C), dove H(min) = A + 2√(BC)." },
      { titolo: "GC, HPLC e indici di ritenzione",
        testo: "In gascromatografia la fase mobile è un gas inerte che non partecipa alla separazione, la leva principale è la temperatura e l'analita deve essere volatile e termicamente stabile; le molecole polari si rendono volatili per derivatizzazione, per esempio sililando i gruppi OH, COOH e NH. In HPLC la fase mobile liquida interagisce con gli analiti e la leva principale è la sua composizione. Poiché tR dipende da strumento e condizioni, in GC si usa l'indice di Kováts, che interpola il tempo ridotto t′ = tR − tM fra quelli di due n-alcani consecutivi in scala logaritmica, assegnando per definizione 100 volte il numero di atomi di carbonio agli alcani lineari." }
    ],
    formule: [
      ["k = (tR − tM)/tM ;  α = k₂/k₁", "fattore di ritenzione e selettività, adimensionali"],
      ["N = 16·(tR/W)² = 5,54·(tR/W½)² ;  H = L/N", "piatti teorici da un picco gaussiano; H nella stessa unità di lunghezza L della colonna"],
      ["Rs = ΔtR/[(W₁ + W₂)/2] = (√N/4)·((α − 1)/α)·(k₂/(1 + k₂))", "risoluzione per definizione e secondo Purnell (N uguale per i due picchi)"],
      ["H = A + B/u + C·u ;  u(opt) = √(B/C)", "van Deemter: u velocità lineare (mm/s), A in mm, B in mm²/s, C in s"],
      ["I = 100·[n + (log t′x − log t′n)/(log t′n+1 − log t′n)]", "indice di ritenzione di Kováts in condizioni isoterme; t′ tempi ridotti"]
    ],
    ipotesi: [
      "Picchi gaussiani e isoterma di ripartizione lineare (colonna non sovraccarica); il fronte e la coda violano queste ipotesi.",
      "L'equazione di Purnell assume N uguale per i due picchi e α vicino a 1; per α grandi è comunque una buona stima.",
      "La forma di Kováts con i logaritmi vale in isoterma; in programmata di temperatura si usa l'indice lineare di van den Dool e Kratz."
    ],
    errori: [
      "Usare tR invece di k per confrontare due colonne di lunghezza diversa.",
      "Cercare di risolvere una coppia con α = 1,00 aumentando N.",
      "Credere che andare più veloci migliori sempre: oltre u(opt) il termine C·u allarga i picchi.",
      "Calcolare N da picchi con coda e usare il risultato come se fossero gaussiani."
    ],
    esempio: {
      testo: "In una colonna con N = 5000 e tM = 1,20 min due analiti hanno k₁ = 2,50 e α = 1,080, quindi k₂ = 2,70. Purnell dà Rs = (√5000/4)·(0,080/1,080)·(2,70/3,70) = 17,68·0,0741·0,730 = 0,96. I tempi sono tR1 = 1,20·3,50 = 4,20 min e tR2 = 1,20·3,70 = 4,44 min; con W = 4tR/√N le basi sono 0,238 e 0,251 min, e dalla definizione Rs = 0,24/0,2445 = 0,98. Per arrivare a Rs = 1,5 agendo solo sui piatti servirebbe N = 5000·(1,5/0,956)² ≈ 1,23·10⁴, una colonna circa 2,5 volte più lunga.",
      risultato: "Rs ≈ 0,96 (Purnell) – 0,98 (definizione); servono circa 12 300 piatti per Rs = 1,5"
    },
    fonti: [
      "D. C. Harris, Quantitative Chemical Analysis, W. H. Freeman, 9ª ed., capitoli sull'introduzione alle separazioni analitiche, la gascromatografia e la cromatografia liquida ad alte prestazioni",
      "D. A. Skoog, D. M. West, F. J. Holler, S. R. Crouch, Fundamentals of Analytical Chemistry, Cengage, 9ª ed., capitoli sulla cromatografia",
      "J. J. van Deemter, F. J. Zuiderweg, A. Klinkenberg, Longitudinal diffusion and resistance to mass transfer as causes of nonideality in chromatography, Chemical Engineering Science 5 (1956)",
      "E. Kováts, Gas-chromatographische Charakterisierung organischer Verbindungen, Helvetica Chimica Acta 41 (1958)"
    ],
    collegamenti: ['staratura', 'sms', 'sdeconv', 'sphase']
  };

  T['staratura'] = {
    titolo: "Retta di taratura, incertezza e limiti di rivelabilità",
    sintesi: "Uno strumento misura un segnale; la concentrazione si ottiene invertendo una retta di taratura costruita con standard noti. La regressione ai minimi quadrati fornisce pendenza, intercetta e deviazione standard dei residui, da cui si ricavano l'incertezza sulla concentrazione dell'incognito e i limiti di rivelabilità e di quantificazione. L'incertezza cresce allontanandosi dal centro della taratura, e r² da solo non dimostra la linearità.",
    paragrafi: [
      { titolo: "La regressione ai minimi quadrati",
        testo: "Con N coppie (xᵢ, yᵢ), dove x è la concentrazione degli standard e y il segnale, la retta y = mx + b che minimizza la somma dei quadrati degli scarti verticali ha pendenza m = Sxy/Sxx e intercetta b = ȳ − m·x̄, con Sxx = Σ(xᵢ − x̄)² e Sxy = Σ(xᵢ − x̄)(yᵢ − ȳ). La dispersione dei punti attorno alla retta si misura con s(y/x) = √[Σ(yᵢ − ŷᵢ)²/(N − 2)], dove N − 2 sono i gradi di libertà, perché due parametri sono stati stimati dai dati. Da s(y/x) seguono le deviazioni standard di pendenza e intercetta, s(m) = s(y/x)/√Sxx e s(b) = s(y/x)·√(Σxᵢ²/(N·Sxx))." },
      { titolo: "La concentrazione dell'incognito e la sua incertezza",
        testo: "Se M repliche dell'incognito danno un segnale medio ȳ₀, la concentrazione è x₀ = (ȳ₀ − b)/m e la sua deviazione standard è s(x₀) = (s(y/x)/m)·√[1/M + 1/N + (ȳ₀ − ȳ)²/(m²·Sxx)]. I tre termini sotto radice hanno origini diverse: 1/M diminuisce ripetendo la misura dell'incognito, 1/N si fissa progettando la taratura, il terzo cresce con il quadrato della distanza dal baricentro della retta ed è il motivo per cui non si estrapola. L'intervallo di confidenza si ottiene moltiplicando per il t di Student con N − 2 gradi di libertà al livello scelto. Un campione che cade a un estremo conviene diluirlo o concentrarlo per portarlo al centro." },
      { titolo: "r², residui e linearità",
        testo: "Il coefficiente di determinazione r² misura la frazione della varianza di y spiegata dalla retta; in una taratura analitica è quasi sempre maggiore di 0,99 anche quando la risposta è visibilmente curva, perché la variazione lungo la retta è molto più grande della curvatura. Per verificare la linearità si guarda il grafico dei residui: devono distribuirsi a caso attorno allo zero. Residui a forma di U indicano curvatura, che si tratta restringendo l'intervallo o usando un modello quadratico; residui a imbuto indicano varianza che cresce con la concentrazione, eteroschedasticità, che richiede la regressione pesata." },
      { titolo: "Limiti di rivelabilità e di quantificazione",
        testo: "Il limite di rivelabilità è la concentrazione minima che produce un segnale distinguibile dal bianco con una probabilità stabilita; il limite di quantificazione è la minima concentrazione misurabile con precisione accettabile. La linea guida ICH Q2 propone LOD = 3,3σ/S e LOQ = 10σ/S, con S pendenza e σ stimata dalla deviazione standard del bianco, dei residui o dell'intercetta. Il fattore 3,3 nasce dalla somma di 1,645 + 1,645, cioè dal controllo simultaneo dei falsi positivi e dei falsi negativi al 5 %. Sotto il LOD si scrive «non rivelato», mai zero; fra LOD e LOQ l'analita è presente ma non quantificabile con l'incertezza richiesta." },
      { titolo: "Propagazione dell'incertezza e cifre significative",
        testo: "Per contributi indipendenti, in una somma o differenza si sommano in quadratura le incertezze assolute, in un prodotto o quoziente quelle relative: s(y)/y = √[(s(a)/a)² + (s(b)/b)²]. Due contributi uguali aumentano l'incertezza di un fattore √2, non 2, e ridurre il contributo più piccolo serve poco. Il risultato si arrotonda in modo coerente con la sua incertezza: in genere l'incertezza si dà con una o due cifre e il valore si arrotonda alla stessa posizione decimale." }
    ],
    formule: [
      ["m = Sxy/Sxx ;  b = ȳ − m·x̄", "pendenza e intercetta della retta ai minimi quadrati"],
      ["s(y/x) = √[Σ(yᵢ − ŷᵢ)²/(N − 2)]", "deviazione standard dei residui, nelle unità del segnale"],
      ["s(x₀) = (s(y/x)/m)·√[1/M + 1/N + (ȳ₀ − ȳ)²/(m²·Sxx)]", "deviazione standard della concentrazione ricavata da M repliche dell'incognito"],
      ["LOD = 3,3·σ/S ;  LOQ = 10·σ/S", "limiti di rivelabilità e quantificazione secondo ICH Q2; S pendenza, σ deviazione standard della risposta"],
      ["s(y)/y = √[(s(a)/a)² + (s(b)/b)²]", "propagazione per prodotti e quozienti di grandezze indipendenti"]
    ],
    ipotesi: [
      "Regressione ordinaria: errore solo sulla y, varianza costante lungo la retta, errori indipendenti e distribuiti normalmente.",
      "Gli standard devono avere la stessa matrice dei campioni; altrimenti servono il metodo delle aggiunte standard o lo standard interno.",
      "La formula di s(x₀) è un'approssimazione valida quando la retta è ben determinata (parametro g di Fieller piccolo)."
    ],
    errori: [
      "Considerare r² = 0,999 una prova di linearità.",
      "Estrapolare la retta oltre l'ultimo standard.",
      "Dividere per N invece che per N − 2 nel calcolo di s(y/x).",
      "Riportare un risultato con più cifre di quelle giustificate dalla sua incertezza, oppure scrivere zero sotto il LOD."
    ],
    esempio: {
      testo: "Standard a 0, 2, 4, 6, 8, 10 mg/L danno assorbanze 0,003; 0,127; 0,251; 0,382; 0,501; 0,632. La regressione dà m = 0,062 83 L/mg, b = 0,0019, s(y/x) = 0,0028, s(b) = 0,0020 e r² = 0,9999. Un incognito misurato tre volte con media ȳ₀ = 0,300 ha x₀ = (0,300 − 0,0019)/0,062 83 = 4,745 mg/L. Con ȳ = 0,316 e Sxx = 70, s(x₀) = (0,0028/0,062 83)·√(1/3 + 1/6 + 0,000 25/0,2763) = 0,032 mg/L; con t(4 gdl, 95 %) = 2,776 l'intervallo è ±0,088 mg/L. Infine LOD = 3,3·0,0020/0,062 83 = 0,11 mg/L e LOQ = 0,33 mg/L.",
      risultato: "x₀ = 4,75 ± 0,09 mg/L (95 %); LOD ≈ 0,11 mg/L, LOQ ≈ 0,33 mg/L"
    },
    fonti: [
      "J. N. Miller, J. C. Miller, Statistics and Chemometrics for Analytical Chemistry, Pearson, 6ª ed., capitolo 5 (metodi di taratura nell'analisi strumentale: regressione e correlazione)",
      "D. C. Harris, Quantitative Chemical Analysis, W. H. Freeman, 9ª ed., capitoli sulla statistica e sui metodi di taratura",
      "ICH, Validation of Analytical Procedures Q2(R2), 2023 (che sostituisce Q2(R1) del 2005)",
      "JCGM 100:2008, Evaluation of measurement data – Guide to the expression of uncertainty in measurement (GUM)"
    ],
    collegamenti: ['scroma', 'smatstat', 'smatinfer', 'sfisanalitica', 'suvvis']
  };

  T['scheminfo'] = {
    titolo: "Chemioinformatica: descrittori, similarità e modelli QSAR",
    sintesi: "La chemioinformatica rappresenta le molecole come vettori di numeri, descrittori fisico-chimici e impronte strutturali, per confrontarle, raggrupparle e costruire modelli che legano struttura e attività. La similarità si misura di solito con il coefficiente di Tanimoto su impronte di Morgan; i gruppi si formano con l'algoritmo di Butina; un modello QSAR vale solo se supera la validazione esterna con divisione per scaffold e il confronto con etichette rimescolate.",
    paragrafi: [
      { titolo: "Descrittori e regole empiriche",
        testo: "Un descrittore è un numero calcolato dalla struttura: massa molare, coefficiente di ripartizione ottanolo-acqua stimato (clogP, per esempio con il metodo atomico di Wildman e Crippen), area polare superficiale topologica (TPSA, somma di contributi di N, O e degli H legati), numero di donatori e accettori di legame a idrogeno, legami ruotabili. Le regole di Lipinski, Veber, Egan e Ghose usano soglie su questi descrittori per segnalare molecole a rischio di scarsa biodisponibilità orale. Sono filtri statistici ricavati da farmaci esistenti, utili per ordinare grandi librerie, non leggi: diversi farmaci orali importanti le violano." },
      { titolo: "Impronte molecolari e similarità",
        testo: "Un'impronta è un vettore di bit che codifica la presenza di frammenti. Le impronte di Morgan, equivalenti alle ECFP, assegnano a ogni atomo un identificatore che viene aggiornato iterativamente includendo l'intorno fino a un raggio scelto, di solito 2 legami, e trasformano gli identificatori in posizioni di un vettore di lunghezza fissa, per esempio 2048 bit. Il coefficiente di Tanimoto T = c/(a + b − c), con a e b bit accesi nelle due molecole e c bit in comune, va da 0 a 1; il coefficiente di Dice 2c/(a + b) è un'alternativa. Il principio di similarità afferma che molecole simili tendono ad avere proprietà simili; le soglie di T dipendono dal tipo di impronta e non sono trasferibili." },
      { titolo: "Raggruppamento e spazio chimico",
        testo: "L'algoritmo di Butina sceglie come centri le molecole con più vicini sopra una soglia di similarità, assegna a ciascun centro i suoi vicini e ripete sulle molecole rimaste: ne risultano gruppi compatti e non sovrapposti. Lo scaffold di Bemis–Murcko, l'insieme di anelli e catene che li collegano, raggruppa invece per scheletro. Per visualizzare lo spazio chimico si proiettano i descrittori o le impronte in due dimensioni con l'analisi delle componenti principali o con metodi non lineari come il t-SNE." },
      { titolo: "Modelli QSAR e la loro validazione",
        testo: "Un modello QSAR stima un'attività, per esempio pIC₅₀ = −log₁₀(IC₅₀/M), da descrittori o impronte, con regressione lineare, ridge, kNN, foreste casuali o regressione kernel. Con migliaia di variabili e decine di molecole qualunque modello si adatta bene ai dati di addestramento, perciò la qualità si misura su molecole non viste. La divisione casuale fra addestramento e prova sovrastima le prestazioni perché nei dati medicinali le molecole vengono in serie analoghe; dividere per scaffold è più severo e più realistico. Il test di y-scrambling ripete l'addestramento con le attività rimescolate: se il modello vero non fa nettamente meglio, sta imparando il rumore. Ogni previsione va accompagnata dal dominio di applicabilità, cioè dalla distanza della molecola da quelle su cui il modello è stato costruito." },
      { titolo: "Salti di attività e allarmi strutturali",
        testo: "Coppie di molecole molto simili con attività molto diverse sono scogliere di attività: l'indice SALI = |Aᵢ − Aⱼ|/(1 − simᵢⱼ) le mette in evidenza, e sono proprio i casi in cui il principio di similarità fallisce e i modelli sbagliano. L'analisi delle coppie corrispondenti confronta molecole che differiscono per una sola trasformazione e stima l'effetto medio di quel cambio. Gli allarmi strutturali come i filtri PAINS segnalano sottostrutture che nei saggi danno spesso falsi positivi per reattività, aggregazione o interferenza ottica." }
    ],
    formule: [
      ["T(A,B) = c/(a + b − c)", "coefficiente di Tanimoto fra due impronte binarie: a, b bit accesi in A e in B, c bit comuni"],
      ["pIC₅₀ = −log₁₀(IC₅₀ / 1 M)", "attività espressa in scala logaritmica: un'unità corrisponde a un fattore 10 di potenza"],
      ["Q² = 1 − Σ(yᵢ − ŷᵢ)²/Σ(yᵢ − ȳ)²", "coefficiente di determinazione calcolato sulle previsioni per molecole non usate nell'addestramento"],
      ["SALI(i,j) = |Aᵢ − Aⱼ| / (1 − sim(i,j))", "indice di paesaggio struttura-attività; grande per coppie simili con attività diverse"],
      ["logS = 0,16 − 0,63·clogP − 0,0062·M + 0,066·RB − 0,74·AP", "stima ESOL della solubilità acquosa (mol/L) di Delaney; M massa molare, RB legami ruotabili, AP frazione di atomi aromatici"]
    ],
    ipotesi: [
      "Il principio di similarità è statistico, non universale: le scogliere di attività ne sono le eccezioni.",
      "Tanimoto su impronte di Morgan dipende da raggio e lunghezza del vettore; le collisioni di bit nella piegatura introducono similarità spurie.",
      "Un modello QSAR è affidabile solo dentro il suo dominio di applicabilità e per il saggio e il bersaglio su cui è stato costruito."
    ],
    errori: [
      "Giudicare un modello dal solo R² di addestramento.",
      "Usare una divisione casuale e riportarne le prestazioni come capacità di prevedere nuove serie chimiche.",
      "Trattare le regole di Lipinski come criterio di esclusione assoluto.",
      "Confrontare valori di Tanimoto calcolati con impronte diverse."
    ],
    esempio: {
      testo: "Due molecole hanno impronte di Morgan (raggio 2, 2048 bit) con 40 e 35 bit accesi e 28 bit in comune. Il coefficiente di Tanimoto è T = 28/(40 + 35 − 28) = 28/47 = 0,60, quello di Dice 2·28/75 = 0,75. Se le loro pIC₅₀ sono 7,2 e 5,1, l'indice SALI vale |7,2 − 5,1|/(1 − 0,60) = 5,2: una coppia moderatamente simile con una differenza di attività di oltre due ordini di grandezza, candidata a scogliera.",
      risultato: "Tanimoto = 0,60; Dice = 0,75; SALI ≈ 5,2"
    },
    fonti: [
      "A. R. Leach, V. J. Gillet, An Introduction to Chemoinformatics, Springer, ed. riveduta 2007, capitoli su descrittori, similarità, raggruppamento e QSAR",
      "D. Rogers, M. Hahn, Extended-connectivity fingerprints, Journal of Chemical Information and Modeling 50 (2010)",
      "D. Butina, Unsupervised data base clustering based on Daylight's fingerprint and Tanimoto similarity, Journal of Chemical Information and Computer Sciences 39 (1999)",
      "A. Tropsha, Best practices for QSAR model development, validation, and exploitation, Molecular Informatics 29 (2010)",
      "J. S. Delaney, ESOL: estimating aqueous solubility directly from molecular structure, Journal of Chemical Information and Computer Sciences 44 (2004)"
    ],
    collegamenti: ['sspaziochim', 'smolprop', 'smol', 'smatsvd', 'smatinfer']
  };

  T['sspaziochim'] = {
    titolo: "Mappe dello spazio chimico: PCA e t-SNE",
    sintesi: "Una collezione di molecole descritte da impronte di migliaia di bit vive in uno spazio ad altissima dimensione. Per vederla si proietta su un piano. La PCA è una rotazione lineare che conserva le direzioni di massima varianza e quindi le distanze grandi; il t-SNE è un metodo non lineare che conserva i vicinati, a scapito delle distanze fra gruppi lontani. La frazione di vicini conservati misura quanto ci si può fidare della mappa.",
    paragrafi: [
      { titolo: "Distanze fra molecole",
        testo: "Prima di proiettare bisogna stabilire quando due molecole sono vicine. Con le impronte di Morgan la scelta naturale è la distanza di Tanimoto d = 1 − T, che vale 0 per impronte identiche e 1 per impronte senza bit in comune; con descrittori continui si usa la distanza euclidea su variabili standardizzate, altrimenti la massa molare, che vale centinaia, domina il logP, che vale qualche unità. Tutto ciò che la mappa mostra dipende da questa scelta: una mappa non scopre somiglianze che la rappresentazione non contiene." },
      { titolo: "Analisi delle componenti principali",
        testo: "La PCA cerca le direzioni ortogonali lungo cui i dati, centrati, hanno varianza massima: sono gli autovettori della matrice di covarianza, ordinati per autovalore decrescente, e si ottengono anche dalla decomposizione ai valori singolari della matrice dei dati. Proiettare sulle prime due componenti conserva la massima varianza possibile in un piano, e la frazione di varianza spiegata dice quanto della struttura originale si vede. Su impronte binarie sparse, con migliaia di bit quasi sempre spenti, le prime due componenti spiegano spesso pochi punti percentuali e i gruppi si sovrappongono. Se si dispone solo di una matrice di distanze, lo scalamento multidimensionale classico dà una proiezione equivalente alla PCA." },
      { titolo: "Il t-SNE",
        testo: "Il t-SNE di van der Maaten e Hinton converte le distanze in probabilità di essere vicini. Nello spazio originale pⱼ|ᵢ è proporzionale a exp(−d²ᵢⱼ/2σᵢ²), con σᵢ scelta per ogni punto in modo che la distribuzione abbia una perplessità prefissata, interpretabile come numero efficace di vicini; le probabilità si simmetrizzano in pᵢⱼ. Nel piano le somiglianze qᵢⱼ seguono una distribuzione t di Student a un grado di libertà, con code pesanti che lasciano spazio fra i gruppi. Le posizioni si ottengono minimizzando la divergenza di Kullback–Leibler KL(P‖Q) con la discesa del gradiente." },
      { titolo: "Come si legge, e come no",
        testo: "Una mappa t-SNE conserva chi sta vicino a chi, ma le distanze fra gruppi lontani, le dimensioni dei gruppi e la densità apparente non hanno significato quantitativo, e gli assi non hanno unità. Il risultato cambia con la perplessità: bassa, i gruppi si frammentano; alta, la mappa somiglia di più alla PCA. Cambia anche con il punto di partenza casuale, per cui la sezione usa un seme fisso. Un controllo onesto è la frazione dei k vicini più prossimi nello spazio originale che restano fra i k più prossimi nel piano: vale 1 per una mappa perfetta e circa k/(n − 1) per una disposizione casuale." }
    ],
    formule: [
      ["d(A,B) = 1 − T(A,B)", "distanza di Tanimoto fra due impronte, fra 0 e 1"],
      ["pⱼ|ᵢ = exp(−d²ᵢⱼ/2σᵢ²) / Σₖ≠ᵢ exp(−d²ᵢₖ/2σᵢ²) ;  pᵢⱼ = (pⱼ|ᵢ + pᵢ|ⱼ)/2n", "probabilità di vicinato nello spazio originale, simmetrizzate"],
      ["qᵢⱼ = (1 + |yᵢ − yⱼ|²)⁻¹ / Σₖ≠ₗ (1 + |yₖ − yₗ|²)⁻¹", "somiglianze nel piano con una t di Student a un grado di libertà"],
      ["Perp(Pᵢ) = 2^H(Pᵢ),  H = −Σⱼ pⱼ|ᵢ log₂ pⱼ|ᵢ", "perplessità: numero efficace di vicini considerati per il punto i"],
      ["C = KL(P‖Q) = Σ pᵢⱼ·log(pᵢⱼ/qᵢⱼ)", "funzione costo minimizzata dal t-SNE"]
    ],
    ipotesi: [
      "La qualità della mappa dipende dalla rappresentazione delle molecole (tipo e lunghezza dell'impronta) e dalla metrica di distanza.",
      "Il t-SNE esatto ha costo proporzionale a n² per iterazione: adatto a centinaia di molecole; per decine di migliaia servono approssimazioni come Barnes–Hut o metodi come UMAP.",
      "La PCA è lineare: strutture curve nello spazio originale vengono appiattite e sovrapposte."
    ],
    errori: [
      "Interpretare la distanza fra due gruppi su una mappa t-SNE come misura della loro dissimilarità.",
      "Dare un significato chimico agli assi del t-SNE.",
      "Concludere da una sola mappa con una sola perplessità che esistono gruppi distinti.",
      "Fare una PCA su descrittori non standardizzati."
    ],
    esempio: {
      testo: "Una collezione di 40 molecole viene proiettata con t-SNE e si misura la conservazione dei 5 vicini più prossimi. Una disposizione casuale conserverebbe in media 5/39 = 0,128, cioè il 13 % dei vicini. Se la mappa ne conserva il 72 % e la PCA sulle stesse impronte il 35 %, il t-SNE rappresenta molto meglio i vicinati locali. Per due molecole con Tanimoto 0,60 la distanza di partenza è 1 − 0,60 = 0,40.",
      risultato: "riferimento casuale 13 %; d = 0,40 per T = 0,60"
    },
    fonti: [
      "L. van der Maaten, G. Hinton, Visualizing data using t-SNE, Journal of Machine Learning Research 9 (2008)",
      "I. T. Jolliffe, Principal Component Analysis, Springer, 2ª ed., 2002, capitoli introduttivi sulla definizione e il calcolo delle componenti principali",
      "A. R. Leach, V. J. Gillet, An Introduction to Chemoinformatics, Springer, ed. riveduta 2007, capitolo sullo spazio chimico e la selezione di diversità",
      "M. Wattenberg, F. Viégas, I. Johnson, How to use t-SNE effectively, Distill (2016)"
    ],
    collegamenti: ['scheminfo', 'smatsvd', 'smatlin', 'smatstat']
  };

  T['scfgraf'] = {
    titolo: "Modelli fondamentali di chimica fisica in forma grafica",
    sintesi: "La sezione riunisce otto modelli che ricorrono in tutta la chimica fisica: Michaelis–Menten con inibizione, Arrhenius, van der Waals, la distribuzione delle velocità di Maxwell–Boltzmann, le leggi cinetiche integrate, la titolazione acido-base, il rilassamento verso l'equilibrio e l'equazione di Nernst. Ciascuno è un'equazione semplice con un significato fisico preciso, e muovere i parametri mostra quali variabili contano davvero.",
    paragrafi: [
      { titolo: "Cinetica enzimatica e inibizione",
        testo: "L'equazione di Michaelis–Menten v = Vmax[S]/(KM + [S]) descrive una velocità che cresce linearmente a [S] bassa e satura a Vmax; KM è la concentrazione a cui v = Vmax/2. Un inibitore competitivo, che si lega al sito attivo, moltiplica KM apparente per (1 + [I]/Ki) senza cambiare Vmax; uno incompetitivo, che si lega solo al complesso ES, divide per lo stesso fattore sia Vmax sia KM, lasciando costante il loro rapporto; uno non competitivo puro, con la stessa affinità per E ed ES, riduce Vmax e lascia KM invariata." },
      { titolo: "Arrhenius e Maxwell–Boltzmann",
        testo: "La legge di Arrhenius k = A·e^(−Ea/RT) lega la costante cinetica alla temperatura; il grafico di ln k contro 1/T è una retta di pendenza −Ea/R. L'origine molecolare si vede nella distribuzione di Maxwell–Boltzmann delle velocità f(v) = 4π(M/2πRT)^(3/2)·v²·e^(−Mv²/2RT): alzando la temperatura la curva si allarga e si sposta verso velocità maggiori, e la frazione di molecole con energia sopra una soglia cresce come un fattore di Boltzmann. Dalla distribuzione si ricavano la velocità più probabile √(2RT/M), la media √(8RT/πM) e la quadratica media √(3RT/M), sempre in quest'ordine crescente." },
      { titolo: "Gas reali secondo van der Waals",
        testo: "Le isoterme di van der Waals p = RT/(Vm − b) − a/Vm² coincidono con quelle ideali a grandi volumi, ma sotto la temperatura critica Tc = 8a/27Rb presentano un'oscillazione in cui la pressione cresce con il volume, una regione meccanicamente instabile. Nella realtà quel tratto è sostituito da un segmento orizzontale di coesistenza liquido-vapore, posto dalla costruzione di Maxwell a aree uguali. Il punto critico dell'equazione cade a Vc = 3b e pc = a/27b², con un fattore di compressibilità critico universale Zc = 3/8, più alto dei valori reali, tipicamente 0,23–0,31." },
      { titolo: "Cinetica, titolazione ed equilibrio",
        testo: "Le leggi integrate di ordine 0, 1 e 2 mostrano decadimenti diversi a parità di k nominale, e per il primo ordine il tempo di dimezzamento ln 2/k è indipendente dalla concentrazione iniziale. La curva di titolazione di un acido debole mostra la zona tampone con pH = pKa a metà equivalenza e un punto equivalente basico. Il pannello di Le Chatelier risolve A ⇌ B come rilassamento esponenziale verso l'equilibrio con costante kf + kr: la composizione finale dipende solo da K = kf/kr, e un catalizzatore, accelerando allo stesso modo le due direzioni, cambia solo il tempo necessario per arrivarci." },
      { titolo: "Elettrochimica: l'equazione di Nernst",
        testo: "Il potenziale di una cella dipende dalla composizione secondo E = E° − (RT/nF)·ln Q. A 25 °C il termine vale 59,16/n mV per ogni fattore 10 del quoziente di reazione. Quando la cella raggiunge l'equilibrio E = 0 e Q = K, quindi ln K = nFE°/RT, cioè log K = nE°/(0,059 16 V) a 25 °C. Il legame con la termodinamica è ΔrG° = −nFE°: un E° positivo corrisponde a una reazione con K > 1." }
    ],
    formule: [
      ["v = Vmax·[S]/(KM + [S])", "Michaelis–Menten; con inibitore competitivo KM(app) = KM·(1 + [I]/Ki)"],
      ["k = A·e^(−Ea/RT)", "Arrhenius: Ea in J/mol, R = 8,314 J mol⁻¹ K⁻¹"],
      ["v(p) = √(2RT/M) ;  ⟨v⟩ = √(8RT/πM) ;  v(rms) = √(3RT/M)", "velocità caratteristiche di Maxwell–Boltzmann; M in kg/mol, v in m/s"],
      ["Tc = 8a/(27Rb) ;  pc = a/(27b²) ;  Vc = 3b", "punto critico dell'equazione di van der Waals"],
      ["E = E° − (RT/nF)·ln Q ;  ln K = nFE°/RT", "equazione di Nernst e relazione fra potenziale standard e costante di equilibrio"]
    ],
    ipotesi: [
      "Michaelis–Menten presuppone stato stazionario, un solo substrato e velocità iniziali.",
      "Arrhenius con A ed Ea costanti è un'approssimazione: su ampi intervalli di T compaiono curvature.",
      "Maxwell–Boltzmann vale per un gas ideale all'equilibrio termico; Nernst con concentrazioni invece di attività è una stima per soluzioni diluite."
    ],
    errori: [
      "Credere che un inibitore non competitivo cambi KM: nel caso puro cambia solo Vmax.",
      "Confondere velocità media e velocità quadratica media: differiscono di circa l'8–9 %.",
      "Contare due volte n nel calcolo di K da E°: se il fattore RT/nF contiene già n, log K = E°/(2,303RT/nF).",
      "Pensare che il tratto oscillante delle isoterme di van der Waals sia fisico."
    ],
    esempio: {
      testo: "Per l'azoto (M = 0,028 013 kg/mol) a 300 K: v(p) = √(2·8,314·300/0,028 013) = 422 m/s, ⟨v⟩ = √(8·8,314·300/(π·0,028 013)) = 476 m/s, v(rms) = √(3·8,314·300/0,028 013) = 517 m/s. Per una pila con E° = 1,10 V e n = 2 a 25 °C, log K = 2·1,10/0,059 16 = 37,2, cioè K ≈ 10³⁷.",
      risultato: "N₂ a 300 K: 422, 476, 517 m/s; K ≈ 10³⁷ per E° = 1,10 V, n = 2"
    },
    fonti: [
      "P. Atkins, J. de Paula, J. Keeler, Physical Chemistry, Oxford University Press, 11ª ed., Focus 1 (teoria cinetica, gas reali), Focus 6 (elettrochimica all'equilibrio), Focus 17 (cinetica ed enzimi)",
      "D. A. McQuarrie, J. D. Simon, Physical Chemistry: A Molecular Approach, University Science Books, 1997, capitoli sulla teoria cinetica dei gas e sulle equazioni di stato",
      "A. Cornish-Bowden, Fundamentals of Enzyme Kinetics, Wiley-Blackwell, 4ª ed., capitoli sulla cinetica di Michaelis–Menten e sull'inibizione"
    ],
    collegamenti: ['skin', 'stitr', 'schiequil', 'snernst', 'scalcav', 'sfisstat']
  };

  T['schiequil'] = {
    titolo: "Equilibrio chimico, principio di Le Chatelier e dipendenza da T",
    sintesi: "L'equilibrio chimico è uno stato dinamico in cui le velocità delle reazioni diretta e inversa si uguagliano e il quoziente di reazione Q raggiunge la costante K. K è fissata da ΔrG° = −RT ln K e dipende solo dalla temperatura; aggiunte di specie, variazioni di volume e di temperatura spostano la composizione nel verso che riporta Q a K, come prevede qualitativamente il principio di Le Chatelier e quantitativamente la termodinamica.",
    paragrafi: [
      { titolo: "Equilibrio come uguaglianza di velocità",
        testo: "Se la reazione aA + bB ⇌ cC + dD avviene in stadi elementari, la velocità diretta è kf[A]ᵃ[B]ᵇ e quella inversa kr[C]ᶜ[D]ᵈ. Partendo dai soli reagenti la prima prevale, poi le due si avvicinano finché si uguagliano: da quel momento la composizione non cambia più, anche se le singole molecole continuano a reagire nei due versi. All'equilibrio kf/kr = [C]ᶜ[D]ᵈ/([A]ᵃ[B]ᵇ) = Kc, ed è questo il legame fra cinetica e termodinamica che il simulatore usa per far evolvere le concentrazioni nel tempo. A livello molecolare, come mostra la scatola con l'algoritmo di Gillespie, i numeri di molecole fluttuano attorno ai valori medi, e sono le medie a soddisfare K." },
      { titolo: "La costante termodinamica",
        testo: "La costante termodinamica K = Π aᵢ^νᵢ è un prodotto di attività elevate ai coefficienti stechiometrici, positivi per i prodotti e negativi per i reagenti, ed è adimensionale. Per gas ideali aᵢ = pᵢ/p° e si parla di Kp; per soluti diluiti aᵢ ≈ cᵢ/c° e si parla di Kc. Le due sono legate da Kc = Kp·(RT/p°)^(−Δn) quando Kc si riferisce a c° = 1 mol/L, con Δn variazione delle moli gassose e R espressa in modo coerente (0,083 14 L bar mol⁻¹ K⁻¹ con p° = 1 bar). Da ΔrG° = ΔrH° − TΔrS° = −RT ln K si calcola K a qualunque temperatura conoscendo entalpia ed entropia standard di reazione." },
      { titolo: "Q contro K: il verso dello spostamento",
        testo: "Il quoziente di reazione Q ha la stessa forma di K ma usa la composizione attuale. Poiché ΔrG = RT ln(Q/K), se Q < K la reazione procede verso i prodotti, se Q > K verso i reagenti. Aggiungere un reagente abbassa Q e sposta l'equilibrio a destra; togliere un prodotto ha lo stesso effetto, ed è la strategia per spingere a completezza esterificazioni e condensazioni rimuovendo l'acqua. Comprimere una miscela gassosa a temperatura costante moltiplica tutte le concentrazioni per lo stesso fattore e quindi moltiplica Qc per quel fattore elevato a Δn: se Δn < 0, come nella sintesi dell'ammoniaca, Q diminuisce e l'equilibrio si sposta verso il lato con meno moli di gas. Se Δn = 0 la pressione non ha effetto." },
      { titolo: "La temperatura cambia K",
        testo: "Aggiunte e variazioni di volume cambiano Q lasciando invariata K; la temperatura invece cambia K stessa. L'equazione di van 't Hoff d ln K/dT = ΔrH°/RT² dice che per una reazione esotermica K diminuisce scaldando, per una endotermica aumenta. La sintesi dell'ammoniaca è esotermica, quindi termodinamicamente favorita a bassa temperatura, ma a bassa temperatura è troppo lenta: il processo Haber–Bosch lavora a circa 400–500 °C e 150–300 bar con un catalizzatore a base di ferro, un compromesso fra resa all'equilibrio e velocità. La temperatura a cui K = 1 è T = ΔrH°/ΔrS° se le due grandezze hanno lo stesso segno." },
      { titolo: "Limiti del principio di Le Chatelier",
        testo: "Il principio di Le Chatelier è una regola qualitativa e in alcuni casi fallisce: aggiungere un reagente gassoso a pressione totale costante può spostare l'equilibrio verso i reagenti quando la sua frazione molare è già elevata, perché aumenta il volume e diluisce gli altri componenti; aggiungere un gas inerte a volume costante non cambia nulla, a pressione costante agisce come una diluizione. Le previsioni affidabili vengono sempre dal confronto fra Q e K." }
    ],
    formule: [
      ["ΔrG° = −RT·ln K ;  ΔrG = ΔrG° + RT·ln Q", "costante termodinamica ed energia di Gibbs di reazione alla composizione attuale"],
      ["Kc = Kp·(RT/p°)^(−Δn)", "conversione fra costanti in pressione e in concentrazione; Δn = Σν dei gas, R = 0,083 14 L bar mol⁻¹ K⁻¹, p° = 1 bar"],
      ["ln(K₂/K₁) = −(ΔrH°/R)·(1/T₂ − 1/T₁)", "van 't Hoff con ΔrH° indipendente da T"],
      ["K = kf/kr", "per una reazione elementare la costante di equilibrio è il rapporto delle costanti cinetiche"]
    ],
    ipotesi: [
      "Attività approssimate con pressioni parziali (gas ideali) o concentrazioni (soluzioni diluite).",
      "ΔrH° e ΔrS° considerati indipendenti dalla temperatura; su intervalli ampi serve la correzione con ΔrCp°.",
      "Il simulatore usa leggi cinetiche di azione di massa: la loro forma determina la velocità di avvicinamento ma non la composizione finale."
    ],
    errori: [
      "Credere che all'equilibrio le reazioni si fermino.",
      "Credere che aggiungere reagente cambi K.",
      "Pensare che aumentare la pressione aggiungendo un gas inerte a volume costante sposti l'equilibrio.",
      "Usare Kp e Kc come se fossero uguali quando Δn ≠ 0."
    ],
    esempio: {
      testo: "Per N₂ + 3 H₂ ⇌ 2 NH₃ con ΔrH° = −92,2 kJ/mol e ΔrS° = −198,7 J mol⁻¹ K⁻¹, considerati costanti, a 700 K si ha ΔrG° = −92 200 + 700·198,7 = +46,9 kJ/mol. Quindi Kp = exp(−46 890/(8,314·700)) = 3,2·10⁻⁴. Con Δn = −2, Kc = Kp·(0,083 14·700)² = 3,2·10⁻⁴·3,39·10³ = 1,07. A 298 K invece ΔrG° = −33,0 kJ/mol e Kp ≈ 6·10⁵: la resa all'equilibrio è molto maggiore a freddo, ma la reazione è troppo lenta.",
      risultato: "a 700 K: ΔrG° = +46,9 kJ/mol, Kp ≈ 3,2·10⁻⁴, Kc ≈ 1,1"
    },
    fonti: [
      "P. Atkins, J. de Paula, J. Keeler, Physical Chemistry, Oxford University Press, 11ª ed., Focus 6 (equilibrio chimico: costante di equilibrio, risposta alle condizioni)",
      "D. A. McQuarrie, J. D. Simon, Physical Chemistry: A Molecular Approach, University Science Books, 1997, capitolo sull'equilibrio chimico",
      "D. T. Gillespie, Exact stochastic simulation of coupled chemical reactions, Journal of Physical Chemistry 81 (1977)"
    ],
    collegamenti: ['sthermoadv', 'schicinet', 'scfgraf', 'sdistr', 'skin']
  };

  T['schicinet'] = {
    titolo: "Cinetica complessa: reazioni composte, oscillazioni e strutture di Turing",
    sintesi: "Le reazioni reali procedono quasi sempre in più stadi. Reazioni consecutive, parallele e reversibili si risolvono esattamente come sistemi di equazioni differenziali lineari; l'approssimazione dello stato stazionario semplifica i meccanismi più complessi. Quando il meccanismo contiene retroazioni autocatalitiche lontano dall'equilibrio possono nascere oscillazioni e, con la diffusione, strutture spaziali. Infine la teoria delle collisioni spiega da dove viene il fattore di Arrhenius.",
    paragrafi: [
      { titolo: "Reazioni consecutive",
        testo: "Per A → B → C con costanti k₁ e k₂, [A] decade esponenzialmente, mentre l'intermedio sale, raggiunge un massimo e poi scende: [B] = [A]₀·k₁/(k₂ − k₁)·(e^(−k₁t) − e^(−k₂t)). Il massimo cade a t(max) = ln(k₁/k₂)/(k₁ − k₂) e vale [B](max) = [A]₀·(k₂/k₁)^(k₂/(k₁ − k₂)). Il prodotto C compare con un periodo di induzione, una curva a S. Se k₂ ≫ k₁, B non si accumula e la velocità di formazione di C è controllata da k₁, lo stadio lento; se k₁ ≫ k₂ conviene isolare B, ed è la logica della sintesi di intermedi e del decadimento radioattivo in serie." },
      { titolo: "Stato stazionario, reazioni parallele e reversibili",
        testo: "L'approssimazione dello stato stazionario pone d[B]/dt ≈ 0 per un intermedio reattivo, quindi [B] ≈ (k₁/k₂)[A]. Funziona quando l'intermedio è consumato molto più rapidamente di quanto si formi, cioè k₂ ≫ k₁, e fallisce nel caso opposto, come mostra il confronto grafico nella sezione. Nelle reazioni parallele A → B e A → C, A decade con k₁ + k₂ e il rapporto [B]/[C] = k₁/k₂ è costante in ogni istante: è il controllo cinetico della selettività. Nella reazione reversibile A ⇌ B lo scostamento dall'equilibrio decade con costante k₁ + k₂, non k₁, e l'equilibrio raggiunto ha K = k₁/k₂: è il principio dei metodi di rilassamento come il salto di temperatura." },
      { titolo: "Reazioni oscillanti",
        testo: "Un sistema chiuso tende monotonamente all'equilibrio; un sistema aperto mantenuto lontano dall'equilibrio da un flusso di reagenti può invece oscillare se il meccanismo contiene una retroazione autocatalitica. Il Brusselator di Prigogine e Lefever è il modello minimo: con le concentrazioni adimensionali x e y, dx/dt = A + x²y − (B + 1)x e dy/dt = Bx − x²y. Il punto stazionario è x = A, y = B/A; diventa instabile per B > 1 + A², attraverso una biforcazione di Hopf, e attorno a esso nasce un ciclo limite, un'oscillazione di ampiezza e periodo fissati dai parametri e non dalle condizioni iniziali. La reazione di Belousov–Žabotinskij, ossidazione dell'acido malonico con bromato catalizzata da cerio o ferroina, è l'esempio sperimentale classico." },
      { titolo: "Reazione e diffusione: strutture spaziali",
        testo: "Turing mostrò nel 1952 che due specie che reagiscono e diffondono con coefficienti diversi possono rendere instabile uno stato omogeneo e far nascere strutture periodiche stazionarie: un attivatore che diffonde lentamente e un inibitore che diffonde velocemente. Il modello di Gray–Scott, u + 2v → 3v e v → P con alimentazione F di u e rimozione k di v, produce al variare di F e k macchie, strisce, labirinti e macchie che si dividono. Non tutte queste strutture sono strettamente di Turing, cioè nate da un'instabilità lineare dello stato omogeneo, ma condividono il meccanismo di base della competizione fra reazione locale e diffusione." },
      { titolo: "Collisioni e fattore di Arrhenius",
        testo: "Nella teoria delle collisioni la costante bimolecolare è il prodotto del numero di urti per unità di tempo, della frazione di urti energeticamente efficaci e di un fattore sterico. Se conta solo la componente dell'energia relativa lungo la congiungente dei centri, la frazione di urti che supera la soglia E₀ è esattamente e^(−E₀/RT): il fattore esponenziale di Arrhenius nasce dalla statistica di Boltzmann applicata agli urti. Il fattore preesponenziale teorico σ·√(8kBT/πμ)·NA dipende debolmente dalla temperatura, e i valori sperimentali sono spesso più piccoli, ciò che il fattore sterico P riassume senza spiegarlo." }
    ],
    formule: [
      ["[B] = [A]₀·k₁/(k₂ − k₁)·(e^(−k₁t) − e^(−k₂t))", "intermedio di due reazioni consecutive del primo ordine (k₁ ≠ k₂)"],
      ["t(max) = ln(k₁/k₂)/(k₁ − k₂) ;  [B](max) = [A]₀·(k₂/k₁)^(k₂/(k₁ − k₂))", "tempo e altezza del massimo dell'intermedio"],
      ["[A] − [A]eq ∝ e^(−(k₁ + k₂)t)", "rilassamento di A ⇌ B verso l'equilibrio con K = k₁/k₂"],
      ["dx/dt = A + x²y − (B + 1)x ;  dy/dt = Bx − x²y", "Brusselator; instabilità di Hopf per B > 1 + A²"],
      ["k = P·σ·√(8kBT/πμ)·NA·e^(−E₀/RT)", "teoria delle collisioni: σ sezione d'urto, μ massa ridotta, P fattore sterico"]
    ],
    ipotesi: [
      "Le soluzioni esatte riguardano stadi del primo ordine (o pseudo-primo ordine) a volume e temperatura costanti.",
      "Le oscillazioni persistenti richiedono un sistema aperto; in un sistema chiuso si osservano solo oscillazioni transitorie mentre i reagenti si consumano.",
      "La teoria delle collisioni tratta le molecole come sfere rigide e ignora la struttura interna."
    ],
    errori: [
      "Applicare lo stato stazionario a un intermedio che si accumula (k₂ < k₁).",
      "Credere che le reazioni oscillanti violino il secondo principio: avvengono lontano dall'equilibrio e dissipano energia libera, e Gibbs del sistema chiuso continua a diminuire.",
      "Scrivere che A ⇌ B si rilassa con costante k₁.",
      "Interpretare il fattore sterico come una misura geometrica precisa."
    ],
    esempio: {
      testo: "Per A → B → C con k₁ = 0,50 s⁻¹, k₂ = 0,10 s⁻¹ e [A]₀ = 1,00 M, il massimo di B cade a t(max) = ln(0,50/0,10)/(0,50 − 0,10) = 1,609/0,40 = 4,02 s e vale [B](max) = (0,10/0,50)^(0,10/0,40) = 0,2^0,25 = 0,669 M. Qui k₂ < k₁: l'intermedio si accumula fino a due terzi della quantità iniziale, e lo stato stazionario, che prevedrebbe [B] = 5[A], sarebbe completamente sbagliato.",
      risultato: "t(max) = 4,02 s; [B](max) = 0,669 M"
    },
    fonti: [
      "P. Atkins, J. de Paula, J. Keeler, Physical Chemistry, Oxford University Press, 11ª ed., Focus 17 (reazioni consecutive, stato stazionario, rilassamento) e Focus 18 (teoria delle collisioni)",
      "P. L. Houston, Chemical Kinetics and Reaction Dynamics, McGraw-Hill, 2001 (rist. Dover), capitoli sulle reazioni complesse",
      "I. Prigogine, R. Lefever, Symmetry breaking instabilities in dissipative systems II, Journal of Chemical Physics 48 (1968)",
      "J. E. Pearson, Complex patterns in a simple system, Science 261 (1993)",
      "I. R. Epstein, J. A. Pojman, An Introduction to Nonlinear Chemical Dynamics, Oxford University Press, 1998"
    ],
    collegamenti: ['skin', 'schiequil', 'senergia', 'schipes', 'smatode']
  };

  T['schidist'] = {
    titolo: "Equilibrio liquido-vapore e distillazione",
    sintesi: "La distillazione separa i componenti di una miscela liquida sfruttando il fatto che il vapore in equilibrio è più ricco del componente più volatile. Per miscele ideali le composizioni seguono la legge di Raoult; per miscele reali servono i coefficienti di attività, che spiegano gli azeotropi. Una colonna di rettifica ripete molti equilibri successivi: il metodo di McCabe–Thiele ne conta gli stadi teorici, Fenske e Underwood danno i limiti a riflusso totale e minimo.",
    paragrafi: [
      { titolo: "Tensione di vapore e legge di Raoult",
        testo: "La tensione di vapore di un liquido puro cresce con la temperatura in modo quasi esponenziale e si descrive con l'equazione empirica di Antoine log₁₀ p = A − B/(C + T), con costanti valide in un intervallo dichiarato. In una miscela ideale ogni componente contribuisce in proporzione alla sua frazione molare nel liquido: pᵢ = xᵢ·pᵢ*, legge di Raoult. La composizione del vapore segue dalla legge di Dalton, yᵢ = pᵢ/p. Benzene e toluene, molecole simili per dimensione e interazioni, sono quasi ideali; a 1 atm bollono a 80,1 e 110,6 °C." },
      { titolo: "Diagrammi T-x-y e volatilità relativa",
        testo: "A pressione fissata, per ogni composizione del liquido si cerca la temperatura di bolla a cui Σ xᵢγᵢpᵢ*(T) = p; la composizione del vapore corrispondente dà la curva di rugiada. Fra le due curve c'è la regione bifasica, e la regola della leva dà le quantità relative di liquido e vapore. La volatilità relativa α = (y₁/x₁)/(y₂/x₂), che per una miscela ideale vale p₁*/p₂*, misura la facilità di separazione: per benzene-toluene è circa 2,4–2,6 e cambia poco con la temperatura, per coppie con α vicino a 1 la separazione richiede molti stadi." },
      { titolo: "Miscele reali e azeotropi",
        testo: "Quando le interazioni fra molecole diverse sono più deboli di quelle fra molecole uguali i coefficienti di attività γ sono maggiori di 1, la miscela ha deviazioni positive dalla legge di Raoult e può presentare un massimo nella tensione di vapore, cioè un azeotropo di minima temperatura di ebollizione. È il caso di etanolo e acqua: a 1 atm l'azeotropo bolle a 78,2 °C con circa il 95,6 % in massa di etanolo, e nessuna distillazione semplice o frazionata supera quella composizione. I coefficienti di attività si descrivono con modelli empirici come van Laar, Margules, Wilson o NRTL, con parametri ricavati da dati sperimentali. Le deviazioni negative danno azeotropi di massima temperatura di ebollizione, come acqua e acido cloridrico." },
      { titolo: "La colonna e il metodo di McCabe–Thiele",
        testo: "Una colonna di rettifica è una sequenza di stadi in cui il vapore che sale e il liquido che scende si scambiano componenti; uno stadio teorico è uno stadio in cui escono in equilibrio. Con le ipotesi di flusso molare costante i bilanci di materia danno rette di lavoro: nella sezione di arricchimento y = R/(R + 1)·x + xD/(R + 1), con R rapporto di riflusso. Partendo dalla composizione di testa si alternano passi orizzontali fino alla curva di equilibrio e verticali fino alla retta di lavoro: ogni gradino è uno stadio teorico. A riflusso totale il numero di stadi è minimo ed è dato dall'equazione di Fenske; al riflusso minimo le rette toccano la curva di equilibrio, i gradini diventano infiniti e si ha il punto di pinch. In pratica si lavora a 1,2–1,5 volte il riflusso minimo." },
      { titolo: "Distillazione semplice: l'equazione di Rayleigh",
        testo: "In una distillazione semplice discontinua il vapore viene rimosso man mano che si forma, e il residuo si impoverisce del componente volatile. Il bilancio differenziale porta all'equazione di Rayleigh ln(W/F) = −∫ dx/(y − x), fra la composizione iniziale e quella del residuo. Il distillato raccolto è più ricco del liquido iniziale, ma un solo stadio separa poco: per benzene e toluene, distillare metà di una miscela equimolare dà un distillato attorno al 65–70 % di benzene, molto lontano dalla purezza ottenibile con una colonna." }
    ],
    formule: [
      ["log₁₀ p* = A − B/(C + T)", "equazione di Antoine; p in mmHg e T in °C con le costanti usate nella sezione"],
      ["yᵢ·p = xᵢ·γᵢ·pᵢ*", "Raoult modificata; γᵢ = 1 per miscele ideali"],
      ["α₁₂ = (y₁/x₁)/(y₂/x₂) ;  y = αx/(1 + (α − 1)x)", "volatilità relativa e curva di equilibrio a α costante"],
      ["N(min) = ln[(xD/(1 − xD))·((1 − xB)/xB)] / ln α", "equazione di Fenske: stadi teorici minimi a riflusso totale (incluso il ribollitore)"],
      ["R(min) = [xD/zF − α(1 − xD)/(1 − zF)]/(α − 1)", "riflusso minimo di Underwood per una miscela binaria con alimentazione liquida satura"],
      ["ln(W/F) = −∫ dx/(y − x), integrale da xW a xF", "equazione di Rayleigh per la distillazione semplice"]
    ],
    ipotesi: [
      "Vapore ideale e pressione costante; equilibrio raggiunto in ogni stadio teorico.",
      "McCabe–Thiele assume flusso molare costante (entalpie di vaporizzazione molari simili) e alimentazione liquida satura (q = 1) nella sezione.",
      "Fenske e Underwood in forma chiusa usano una volatilità relativa media costante, che per etanolo-acqua non è accettabile."
    ],
    errori: [
      "Credere che con abbastanza piatti si possa superare l'azeotropo etanolo-acqua a 1 atm.",
      "Confondere stadi teorici con piatti reali: l'efficienza dei piatti reali è inferiore a 1.",
      "Pensare che il vapore sia ricco del componente presente in maggiore quantità invece che di quello più volatile.",
      "Chiamare azeotropo di massimo quello di etanolo-acqua senza specificare: è di massimo di tensione di vapore ma di minimo della temperatura di ebollizione."
    ],
    esempio: {
      testo: "Per benzene-toluene a 1 atm, con le costanti di Antoine della sezione, la volatilità relativa media vale α ≈ 2,47. Una miscela equimolare comincia a bollire a 92,1 °C con un vapore al 71,4 % di benzene. Per ottenere un distillato con xD = 0,95 e un residuo con xB = 0,05, Fenske dà N(min) = ln(19·19)/ln 2,47 = 5,89/0,904 = 6,5 stadi teorici; con alimentazione zF = 0,50 liquida satura, Underwood dà R(min) = (1,90 − 2,47·0,10)/1,47 = 1,12.",
      risultato: "N(min) ≈ 6,5 stadi; R(min) ≈ 1,1; bolla a 92,1 °C con y = 0,71"
    },
    fonti: [
      "J. M. Smith, H. C. Van Ness, M. M. Abbott, Introduction to Chemical Engineering Thermodynamics, McGraw-Hill, 7ª ed., capitoli sull'equilibrio liquido-vapore e sui coefficienti di attività",
      "W. L. McCabe, J. C. Smith, P. Harriott, Unit Operations of Chemical Engineering, McGraw-Hill, 7ª ed., capitolo sulla distillazione (McCabe–Thiele, Fenske, riflusso minimo)",
      "P. Atkins, J. de Paula, J. Keeler, Physical Chemistry, Oxford University Press, 11ª ed., Focus 5 (miscele semplici, diagrammi di fase di miscele liquide, azeotropi)"
    ],
    collegamenti: ['schifasi', 'sphase', 'sthermoadv', 'scroma']
  };

  T['schivolt'] = {
    titolo: "Voltammetria ciclica",
    sintesi: "Nella voltammetria ciclica il potenziale di un elettrodo viene scansionato linearmente avanti e indietro e si registra la corrente. Per una coppia redox in soluzione la corrente nasce dalla competizione fra il trasferimento elettronico all'elettrodo, descritto da Butler–Volmer, e il trasporto per diffusione. Una coppia reversibile dà picchi separati di circa 57–59/n mV con corrente proporzionale alla radice della velocità di scansione (Randles–Ševčík); un trasferimento lento allontana i picchi.",
    paragrafi: [
      { titolo: "L'esperimento",
        testo: "Si usa una cella a tre elettrodi: lavoro, riferimento e controelettrodo. Il potenziale dell'elettrodo di lavoro, misurato rispetto al riferimento, varia nel tempo con velocità v (V/s) da un valore iniziale a un potenziale di inversione e ritorno. Partendo da una soluzione che contiene solo la forma ossidata O, quando E si avvicina a E°′ la specie O comincia a ridursi a R alla superficie; la corrente cresce, poi cala perché lo strato vicino all'elettrodo si impoverisce e la diffusione non riesce a rifornirlo. Invertita la scansione, la R accumulata vicino all'elettrodo si riossida e compare un picco di segno opposto. Nella convenzione IUPAC, usata dalla sezione, le correnti di riduzione sono negative." },
      { titolo: "Cinetica all'elettrodo: Butler–Volmer",
        testo: "Per O + n e⁻ ⇌ R la densità di flusso netto di riduzione alla superficie è J = k⁰[C_O(0,t)·e^(−αnf(E − E°′)) − C_R(0,t)·e^((1−α)nf(E − E°′))], con f = F/RT, k⁰ costante standard di trasferimento eterogeneo in cm/s e α coefficiente di trasferimento, di solito vicino a 0,5. Se k⁰ è grande rispetto alla velocità con cui la diffusione rifornisce l'elettrodo, all'interfaccia vale in ogni istante l'equazione di Nernst, C_O(0)/C_R(0) = e^(nf(E − E°′)): il sistema è reversibile. Se k⁰ è piccolo serve un sovrapotenziale per far passare corrente e il sistema è quasi reversibile o irreversibile." },
      { titolo: "Trasporto per diffusione",
        testo: "In una soluzione non agitata con elettrolita di supporto in eccesso, la migrazione e la convezione sono trascurabili e O e R si muovono solo per diffusione, ∂C/∂t = D·∂²C/∂x², la seconda legge di Fick per un elettrodo planare. Il simulatore risolve questa equazione alle differenze finite e impone all'elettrodo il flusso di Butler–Volmer: i profili di concentrazione che si vedono sotto il voltammogramma mostrano lo strato di diffusione che si allarga, di spessore dell'ordine di √(D·t)." },
      { titolo: "La coppia reversibile: Randles–Ševčík",
        testo: "Per un processo reversibile controllato dalla diffusione la corrente di picco è ip = 0,4463·nFAC·√(nFvD/RT), che a 25 °C diventa ip = 2,69·10⁵·n^(3/2)·A·D^(1/2)·C·v^(1/2) con ip in A, A in cm², D in cm²/s, C in mol/cm³ e v in V/s. La separazione fra i potenziali dei picchi è circa 2,22RT/nF, cioè 57/n mV a 25 °C se il potenziale di inversione è abbastanza lontano (si cita spesso 59/n mV), indipendente da v; il potenziale medio (Epa + Epc)/2 approssima E½ ≈ E°′, e |ipa/ipc| = 1. Una retta di ip contro √v passante per l'origine indica controllo diffusivo, e dalla pendenza si ricava D." },
      { titolo: "Trasferimento lento: il criterio di Matsuda e Ayabe",
        testo: "Se k⁰ non è grande, la separazione dei picchi cresce con v perché la scansione diventa più rapida del trasferimento elettronico. Il parametro adimensionale Λ = k⁰/√(DnFv/RT) confronta le due scale: per Λ ≥ 15 il comportamento è reversibile, per Λ ≤ 10^(−2(1+α)) è irreversibile, in mezzo è quasi reversibile. Nicholson ha tabulato ΔEp in funzione di un parametro equivalente, ψ = k⁰/√(πDnFv/RT) per DO = DR, e misurare ΔEp a diverse velocità permette di stimare k⁰. Per un processo irreversibile la corrente di picco resta proporzionale a √v ma dipende da α, e il picco si sposta di circa 30/(αn) mV per ogni decade di v a 25 °C." }
    ],
    formule: [
      ["J = k⁰·[C_O(0)·e^(−αnf(E − E°′)) − C_R(0)·e^((1−α)nf(E − E°′))]", "Butler–Volmer per il flusso di riduzione; f = F/RT, k⁰ in cm/s, C in mol/cm³"],
      ["∂C/∂t = D·∂²C/∂x²", "seconda legge di Fick per diffusione lineare semi-infinita"],
      ["ip = 0,4463·n·F·A·C·√(nFvD/RT)", "Randles–Ševčík per una coppia reversibile; a 25 °C ip = 2,69·10⁵·n^(3/2)·A·√D·C·√v"],
      ["ΔEp = Epa − Epc ≈ 2,22·RT/nF ≈ 57/n mV (25 °C)", "separazione dei picchi di una coppia reversibile"],
      ["Λ = k⁰ / √(D·n·F·v/RT)", "parametro di Matsuda–Ayabe: reversibile per Λ ≥ 15"]
    ],
    ipotesi: [
      "Diffusione lineare semi-infinita verso un elettrodo planare, coefficienti di diffusione di O e R uguali, nessuna reazione chimica accoppiata.",
      "Elettrolita di supporto in eccesso (niente migrazione), resistenza non compensata e corrente capacitiva trascurate.",
      "T = 298,15 K; il simulatore usa n fino a 2 e α fra 0,3 e 0,7."
    ],
    errori: [
      "Interpretare ΔEp > 59/n mV sempre come trasferimento lento: anche la resistenza non compensata allarga la separazione.",
      "Aspettarsi ip proporzionale a v: è proporzionale a √v per specie in soluzione, a v solo per specie adsorbite.",
      "Dimenticare che n compare elevato a 3/2 nella corrente di picco.",
      "Confondere le convenzioni di segno IUPAC e americana quando si confrontano voltammogrammi di fonti diverse."
    ],
    esempio: {
      testo: "Una coppia reversibile con n = 1, A = 1,00 cm², C = 1,00 mM = 1,00·10⁻⁶ mol/cm³ e D = 1,0·10⁻⁵ cm²/s viene scansionata a v = 0,100 V/s a 25 °C. ip = 0,4463·96 485·1,00·1,00·10⁻⁶·√(96 485·0,100·1,0·10⁻⁵/(8,314·298,15)) = 2,69·10⁻⁴ A = 0,269 mA. Quadruplicando v a 0,400 V/s la corrente di picco raddoppia, 0,537 mA, e ΔEp resta circa 57 mV.",
      risultato: "ip ≈ 0,27 mA a 0,1 V/s; ΔEp ≈ 57 mV"
    },
    fonti: [
      "A. J. Bard, L. R. Faulkner, Electrochemical Methods: Fundamentals and Applications, Wiley, 2ª ed., capitolo 3 (cinetica degli elettrodi) e capitolo 6 (metodi a scansione di potenziale)",
      "R. S. Nicholson, Theory and application of cyclic voltammetry for measurement of electrode reaction kinetics, Analytical Chemistry 37 (1965)",
      "R. G. Compton, C. E. Banks, Understanding Voltammetry, World Scientific, 3ª ed., capitoli sulla voltammetria ciclica",
      "N. Elgrishi et al., A practical beginner's guide to cyclic voltammetry, Journal of Chemical Education 95 (2018)"
    ],
    collegamenti: ['snernst', 'selettrodi', 'scfgraf', 'smatedp']
  };

  T['schifasi'] = {
    titolo: "Diagrammi di fase: sostanze pure, eutettici e superficie P–V–T",
    sintesi: "I diagrammi di fase descrivono quali fasi sono stabili al variare di temperatura, pressione e composizione. Per una sostanza pura le curve di coesistenza seguono l'equazione di Clapeyron; per due componenti miscibili da liquidi e immiscibili da solidi il diagramma è un eutettico, con le curve del liquidus date dall'equazione di Schröder–van Laar. Un'equazione di stato cubica come Peng–Robinson collega tutto in una superficie P–V–T con la cupola liquido-vapore.",
    paragrafi: [
      { titolo: "Sostanza pura e dati di riferimento",
        testo: "Per acqua e anidride carbonica le curve di coesistenza sono note con grande precisione e descritte da correlazioni di riferimento: per l'acqua la formulazione IAPWS, con l'equazione di Wagner e Pruß per la tensione di vapore e le correlazioni per sublimazione e fusione del ghiaccio Ih; per la CO₂ l'equazione di Span e Wagner. Un punto (T, p) cade in una regione monofasica oppure su una curva; la pendenza locale di ln p contro 1/T lungo la curva di vapore restituisce, tramite Clausius–Clapeyron, l'entalpia di vaporizzazione apparente a quella temperatura, che diminuisce avvicinandosi al punto critico." },
      { titolo: "Clapeyron e la regola delle fasi",
        testo: "Sulla curva fra due fasi α e β i potenziali chimici sono uguali; differenziando l'uguaglianza si ottiene dp/dT = ΔtrsS/ΔtrsV = ΔtrsH/(T·ΔtrsV), esatta per transizioni del primo ordine. Per il ghiaccio Ih il volume molare del solido, circa 19,65 cm³/mol, supera quello del liquido, circa 18,02 cm³/mol, e la curva di fusione ha pendenza negativa e molto ripida, circa −135 bar/K. La regola delle fasi F = C − P + 2 dice quante variabili si possono scegliere: per un sistema binario a pressione fissata, F = 2 − P + 1, e l'eutettico, con due solidi e un liquido, è invariante." },
      { titolo: "Il diagramma eutettico",
        testo: "Se due componenti sono completamente miscibili allo stato liquido e immiscibili allo stato solido, aggiungere B ad A abbassa la temperatura a cui A puro cristallizza. Per una soluzione liquida ideale l'equilibrio fra A solido puro e A in soluzione dà l'equazione di Schröder–van Laar, ln xA = −(ΔfusH(A)/R)·(1/T − 1/Tfus(A)), una curva del liquidus per ciascun componente. Le due curve si incontrano nel punto eutettico, la temperatura più bassa a cui esiste liquido. Raffreddando una miscela di composizione generica cristallizza prima il componente in eccesso, il liquido si arricchisce dell'altro fino alla composizione eutettica, e lì la temperatura resta costante finché tutto il liquido solidifica: è la sosta eutettica della curva di raffreddamento. La regola della leva dà a ogni temperatura le quantità relative di solido e liquido." },
      { titolo: "La superficie P–V–T e l'equazione di Peng–Robinson",
        testo: "Le equazioni di stato cubiche descrivono con una sola espressione gas e liquido. Quella di Peng–Robinson, p = RT/(Vm − b) − a·α(T)/(Vm² + 2bVm − b²), usa a e b ricavati da Tc e pc e una funzione α(T) che dipende dal fattore acentrico ω; dà un fattore di compressibilità critico Zc = 0,307, più vicino ai valori reali di quello di van der Waals. Sotto Tc le isoterme presentano un'ondulazione non fisica: la pressione di saturazione è quella a cui liquido e vapore hanno uguale fugacità, equivalente alla costruzione di Maxwell ad aree uguali, e fra i due volumi di saturazione l'isoterma reale è orizzontale. L'insieme dei volumi di saturazione forma la cupola che si chiude nel punto critico." }
    ],
    formule: [
      ["dp/dT = ΔtrsH/(T·ΔtrsV)", "equazione di Clapeyron per una transizione del primo ordine"],
      ["ln xA = −(ΔfusH/R)·(1/T − 1/Tfus)", "Schröder–van Laar: liquidus ideale del componente A, con xA frazione molare in soluzione"],
      ["n(liquido)/n(solido) = (x(solido) − x)/(x − x(liquido))", "regola della leva: rapporto delle quantità dalle distanze lungo la linea di collegamento"],
      ["p = RT/(Vm − b) − a·α(T)/(Vm² + 2bVm − b²)", "equazione di stato di Peng–Robinson; a = 0,457 24·R²Tc²/pc, b = 0,077 80·RTc/pc"],
      ["F = C − P + 2", "regola delle fasi; a pressione fissata il termine 2 diventa 1"]
    ],
    ipotesi: [
      "L'eutettico calcolato presuppone soluzione liquida ideale, solidi puri senza soluzioni solide e ΔfusH costante; per coppie chimicamente simili (benzene-naftalene) l'accordo è buono, per metalli e soluzioni acquose di urea meno.",
      "Peng–Robinson descrive bene le tensioni di vapore ma meno bene i volumi molari del liquido; non modella la fase solida.",
      "Le transizioni rappresentate sono di equilibrio; sovraraffreddamento e metastabilità non compaiono."
    ],
    errori: [
      "Pensare che all'eutettico cristallizzi un composto: si separano due solidi distinti finemente mescolati.",
      "Applicare Clausius–Clapeyron alla fusione.",
      "Leggere la regola della leva al contrario: la fase più vicina al punto della miscela è quella più abbondante.",
      "Credere che l'ondulazione dell'isoterma cubica sotto Tc descriva stati reali di equilibrio."
    ],
    esempio: {
      testo: "Per benzene (Tfus = 278,68 K, ΔfusH = 9,87 kJ/mol) e naftalene (Tfus = 353,4 K, ΔfusH = 19,0 kJ/mol) l'intersezione delle due curve di Schröder–van Laar cade a x(naftalene) = 0,134 e T = 269,6 K, in ottimo accordo con l'eutettico sperimentale (0,13; 269,6 K). Per la fusione del ghiaccio, con ΔfusH = 6,01 kJ/mol e ΔfusV = 18,02 − 19,65 = −1,63 cm³/mol a 273,15 K, dp/dT = 6010/(273,15·(−1,634·10⁻⁶)) = −1,35·10⁷ Pa/K, cioè −135 bar/K.",
      risultato: "eutettico ideale x = 0,134, T = 269,6 K; dp/dT(fusione ghiaccio) ≈ −135 bar/K"
    },
    fonti: [
      "P. Atkins, J. de Paula, J. Keeler, Physical Chemistry, Oxford University Press, 11ª ed., Focus 4 (sostanze pure) e Focus 5 (diagrammi di fase di sistemi binari, eutettici, regola della leva)",
      "D.-Y. Peng, D. B. Robinson, A new two-constant equation of state, Industrial & Engineering Chemistry Fundamentals 15 (1976)",
      "W. Wagner, A. Pruß, The IAPWS formulation 1995 for the thermodynamic properties of ordinary water substance, Journal of Physical and Chemical Reference Data 31 (2002)",
      "J. M. Smith, H. C. Van Ness, M. M. Abbott, Introduction to Chemical Engineering Thermodynamics, McGraw-Hill, 7ª ed., capitolo sulle equazioni di stato cubiche"
    ],
    collegamenti: ['sphase', 'schidist', 'sthermoadv', 'scristalli']
  };

  T['schipes'] = {
    titolo: "Superficie di energia potenziale e dinamica di reazione",
    sintesi: "Nell'approssimazione di Born–Oppenheimer l'energia elettronica, in funzione delle posizioni dei nuclei, definisce una superficie di energia potenziale su cui i nuclei si muovono. Per la reazione collineare H + H₂ → H₂ + H la superficie LEPS mostra due valli separate da un punto di sella, lo stato di transizione. Il cammino di minima energia dà il profilo di reazione; le traiettorie classiche e le regole di Polanyi spiegano come energia traslazionale e vibrazionale favoriscono la reazione.",
    paragrafi: [
      { titolo: "Born–Oppenheimer e la superficie",
        testo: "Poiché i nuclei sono migliaia di volte più pesanti degli elettroni, si può risolvere il problema elettronico a nuclei fermi e ottenere un'energia V(R) che dipende dalle coordinate nucleari: la superficie di energia potenziale. Per tre atomi in linea retta bastano due distanze, r(AB) e r(BC), e la superficie si rappresenta come mappa a curve di livello. Le valli a r(AB) grande e r(BC) grande sono rispettivamente i reagenti A + BC e i prodotti AB + C; il plateau con entrambe le distanze grandi corrisponde ai tre atomi separati, a un'energia superiore di De, l'energia di dissociazione di H₂." },
      { titolo: "La superficie LEPS",
        testo: "La superficie London–Eyring–Polanyi–Sato è una costruzione semiempirica. Ogni coppia di atomi contribuisce con un integrale coulombiano Q e uno di scambio J, ricavati dalla curva di Morse dello stato di singoletto di H₂, E = De[(1 − e^(−β(r − re)))² − 1], e da una curva anti-Morse per lo stato di tripletto; il parametro di Sato k regola la forma della barriera. L'energia è V = Q(AB) + Q(BC) + Q(AC) − √{½[(J(AB) − J(BC))² + (J(BC) − J(AC))² + (J(AC) − J(AB))²]}. Con i parametri di H₂ (De = 4,747 eV, β = 1,943 Å⁻¹, re = 0,7416 Å) e k = 0,135 la sella cade a r(AB) = r(BC) ≈ 0,93 Å con una barriera classica di circa 0,42 eV, vicina al valore dei calcoli ab initio accurati." },
      { titolo: "Punto di sella e cammino di minima energia",
        testo: "Lo stato di transizione è un punto stazionario della superficie con un solo autovalore negativo dell'hessiana: un massimo lungo la coordinata di reazione e un minimo nelle direzioni perpendicolari. Analizzando le vibrazioni con la matrice G di Wilson, che contiene le masse, si ottiene una frequenza immaginaria, associata al moto lungo la coordinata di reazione, e frequenze reali per gli altri modi. Il cammino di minima energia si ottiene scendendo dalla sella lungo il gradiente verso le due valli; il profilo di energia lungo di esso è il diagramma energetico di reazione. La barriera effettiva va corretta per l'energia di punto zero: H₂ ha ħω ≈ 0,545 eV, cioè circa 4400 cm⁻¹, e un'energia di punto zero di circa 0,27 eV, mentre allo stato di transizione il modo di stiramento lungo la reazione non ha punto zero." },
      { titolo: "Traiettorie e regole di Polanyi",
        testo: "Una traiettoria classica integra le equazioni del moto dei nuclei sulla superficie, qui con l'algoritmo di Verlet, partendo da un'energia di collisione e da uno stato vibrazionale del reagente. Una traiettoria è reattiva se termina nella valle dei prodotti. Le regole di Polanyi riassumono l'esito di molti studi: se la barriera è precoce, situata nella valle d'ingresso, l'energia traslazionale è più efficace; se la barriera è tardiva, nella valle d'uscita, conta di più l'energia vibrazionale del reagente, che porta il sistema a curvare verso i prodotti. Per H + H₂ la barriera è simmetrica e centrale, e le due forme di energia hanno efficacia confrontabile ma non identica." }
    ],
    formule: [
      ["V(r) = De·[(1 − e^(−β(r − re)))² − 1]", "potenziale di Morse di H₂ rispetto agli atomi separati; De = 4,747 eV, β = 1,943 Å⁻¹, re = 0,7416 Å"],
      ["V = ΣQ − √{½[(J₁ − J₂)² + (J₂ − J₃)² + (J₃ − J₁)²]}", "energia LEPS dai contributi coulombiani Q e di scambio J delle tre coppie"],
      ["ω = β·√(2De/μ) ;  E(v) = ħω(v + ½) − [ħω(v + ½)]²/(4De)", "frequenza armonica e livelli vibrazionali di Morse; μ massa ridotta"],
      ["∂V/∂q = 0 con un solo autovalore negativo dell'hessiana", "condizione di punto di sella di primo ordine (stato di transizione)"]
    ],
    ipotesi: [
      "Approssimazione di Born–Oppenheimer e geometria collineare; nella reazione reale anche l'angolo conta, sebbene per H + H₂ la sella più bassa sia collineare.",
      "La LEPS è semiempirica: il parametro di Sato è scelto per riprodurre la barriera, non calcolato.",
      "Le traiettorie sono classiche: effetti quantistici come tunnel e quantizzazione allo stato di transizione sono trascurati."
    ],
    errori: [
      "Confondere la barriera classica con l'energia di attivazione sperimentale, che include punti zero e media termica.",
      "Considerare lo stato di transizione un minimo o un intermedio isolabile.",
      "Pensare che l'energia vibrazionale sia sempre più efficace di quella traslazionale: dipende dalla posizione della barriera.",
      "Leggere il plateau degli atomi separati come un minimo della superficie."
    ],
    esempio: {
      testo: "Con i parametri della sezione la sella LEPS cade a r(AB) = r(BC) = 0,931 Å, dove V = −4,326 eV rispetto agli atomi separati; poiché H₂ all'equilibrio ha V = −4,747 eV, la barriera classica è 4,747 − 4,326 = 0,420 eV, cioè 40,5 kJ/mol. La frequenza armonica di H₂ è ħω = 0,545 eV (4400 cm⁻¹) e l'energia di punto zero vale circa 0,269 eV: confrontare 0,42 eV di barriera con 0,27 eV di punto zero mostra perché in H + H₂ gli effetti quantistici non sono trascurabili.",
      risultato: "barriera classica ≈ 0,42 eV (40,5 kJ/mol) a r ≈ 0,93 Å"
    },
    fonti: [
      "P. Atkins, J. de Paula, J. Keeler, Physical Chemistry, Oxford University Press, 11ª ed., Focus 18 (dinamica delle reazioni: superfici di energia potenziale, traiettorie)",
      "R. D. Levine, Molecular Reaction Dynamics, Cambridge University Press, 2005, capitoli sulle superfici di energia potenziale e sulla dinamica di H + H₂",
      "S. Sato, Potential energy surface of the system of three atoms, Journal of Chemical Physics 23 (1955)",
      "J. C. Polanyi, Some concepts in reaction dynamics, Science 236 (1987), lezione Nobel"
    ],
    collegamenti: ['senergia', 'schicinet', 'smo', 'shf', 'srotovib', 'sdinmol']
  };

})(typeof window !== 'undefined' ? window : globalThis);
