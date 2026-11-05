/* ════════════════════════════════════════════════════════════════════════
   BioSpecInfo · bsi-spectra-esplora.js  (v242)
   © Samuele Pio Provenzano

   «⚡ ESPLORA CON SPECTRA»: UNA SEZIONE PER MATERIA, NELLO STILE «EVERY JOULE».
   Richiesta dell'autore: per ogni materia una sezione come la lezione esplorabile
   di every-joule (una pagina che si scorre, in cui il fenomeno si prevede, si
   tocca con mano e si capisce). Tre sezioni: Esplora la chimica, la fisica, la
   matematica. In ciascuna:

   · SPECTRA COL CORPO resta in scena (la figura condivisa di bsi-spectra-figura.js,
     ferma in alto mentre si scorre); l'ologramma alla sua destra cambia con il
     capitolo che si ha davanti, e Spectra lo racconta (labiale e gesti);
   · DIECI CAPITOLI, dalla scuola superiore al PhD avanzato. Ogni capitolo:
       1. il fenomeno, in poche righe esatte;
       2. PREVEDI: una domanda con quattro risposte (fra cui le idee sbagliate
          piu' comuni); scelta la risposta, la rivelazione: giusta o no, e perche'
          ciascuna risposta e' giusta o sbagliata;
       3. PROVA: un cursore che ricalcola davvero la grandezza (pH con
          l'autoprotolisi dell'acqua, Henderson–Hasselbalch, tempo di dimezzamento,
          teoria di Marcus, caduta, gittata, pendolo, Carnot, particella in una
          scatola, effetto tunnel, dilatazione del tempo, limite di e, serie,
          fenomeno di Gibbs, equazione del calore, autovalori di una rotazione…);
       4. «📺 Guardalo dal vivo»: la sezione dell'app che lo mostra si apre dietro
          la finestra di Spectra e l'ologramma la proietta;
          «🧠 Spiegamelo tutto»: la spiegazione esaustiva (bsi-spectra-spiega.js)
          al livello del capitolo;
   · LA MEMORIA: le previsioni fatte (giuste/sbagliate) e la barra dei progressi
     (bsi-esplora-v1, cancellabile da «Cancella dati → Memoria persistente»).

   I numeri dei cursori sono calcolati con le formule scritte accanto; il banco
   test_spectra_esplora li confronta con i valori attesi.

   API: BSIEsplora.CAPITOLI, BSIEsplora.calcola(id, v), BSIEsplora.costruisci(materia, pannello)
   ════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var D = globale.document;
  function t(it, en) { return (globale.BSILingue && globale.BSILingue.corrente && globale.BSILingue.corrente() !== 'it') ? en : it; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function f(n, d) { return Number(n).toFixed(d).replace('.', ','); }
  function annuncia(tipo, d) { try { D.dispatchEvent(new CustomEvent(tipo, { detail: d })); } catch (e) {} }
  var LIV = ['Scuola superiore', 'Triennale', 'Magistrale', 'Dottorato (PhD)', 'PhD avanzato · frontiera'];
  var LN2 = Math.LN2, G = 9.81;

  /* ── i capitoli: [id, livello, titolo, sezione dell'app, scena dell'ologramma, testo, previsione, prova] ── */
  var CAPITOLI = {
    chimica: [
      { id: 'c-ionizz', liv: 0, tit: 'L\'atomo e l\'energia di ionizzazione', sez: 'spt', scena: 'orbitale',
        testo: 'Strappare un elettrone costa energia: la prima energia di ionizzazione. Cresce lungo un periodo (la carica nucleare efficace aumenta) e cala lungo un gruppo (l\'elettrone è più lontano). Il record è dei gas nobili, e di uno in particolare.',
        pred: { d: 'Quale elemento ha la prima energia di ionizzazione più alta di tutta la tavola?', o: ['Idrogeno', 'Elio', 'Neon', 'Fluoro'], g: 1,
          p: ['13,6 eV: alta, ma l\'elio fa di più.', '24,6 eV: due protoni e il guscio 1s pieno, piccolissimo raggio. È il record.', '21,6 eV: il neon ha più protoni, ma il suo elettrone 2p è più lontano dal nucleo.', '17,4 eV: alto, ma il fluoro non ha ancora il guscio completo.'] } },
      { id: 'c-vsepr', liv: 0, tit: 'La forma delle molecole (VSEPR)', sez: 'svsepr', scena: 'molecola',
        testo: 'I domini elettronici attorno a un atomo centrale si respingono e si dispongono il più lontano possibile. I doppietti solitari occupano più spazio dei legami e stringono gli angoli.',
        pred: { d: 'Quanto vale l\'angolo H–O–H nella molecola d\'acqua?', o: ['180°', '120°', '109,5°', '104,5°'], g: 3,
          p: ['Sarebbe lineare con due soli domini: l\'ossigeno ne ha quattro.', 'È l\'angolo di tre domini su un piano: non è il caso.', 'Il tetraedro perfetto (CH₄): i doppietti dell\'ossigeno stringono l\'angolo.', 'Quattro domini quasi tetraedrici; i due doppietti, più ingombranti, chiudono l\'angolo a 104,5°.'] } },
      { id: 'c-ph', liv: 0, tit: 'Il pH di un acido forte molto diluito', sez: 'stitr', scena: 'molecola',
        testo: 'Per un acido forte [H⁺] ≈ C, quindi pH = −log C. Ma quando C è vicina a 10⁻⁷ M conta anche l\'acqua, che si autoprotolizza (Kw = 10⁻¹⁴): [H⁺] = (C + √(C² + 4Kw))/2.',
        pred: { d: 'Qual è il pH di una soluzione di HCl 10⁻⁸ M?', o: ['8,0', '7,00 esatto', 'circa 6,98', '6,0'], g: 2,
          p: ['Un acido non può rendere basica l\'acqua: −log C qui è sbagliato.', 'L\'acido aggiunge comunque H⁺: il pH scende un poco sotto 7.', '[H⁺] = (10⁻⁸ + √(10⁻¹⁶ + 4·10⁻¹⁴))/2 ≈ 1,05·10⁻⁷ M → pH ≈ 6,98.', 'Varrebbe per 10⁻⁶ M.'] },
        prova: { et: 'concentrazione C = 10^−x M, x =', min: 1, max: 9, passo: 0.25, val: 8 } },
      { id: 'c-tampone', liv: 1, tit: 'Il tampone e Henderson–Hasselbalch', sez: 'sbuffer', scena: 'molecola',
        testo: 'Un acido debole con la sua base coniugata resiste alle variazioni di pH: pH = pKa + log([A⁻]/[HA]). Conta il RAPPORTO fra le due forme, non le concentrazioni assolute.',
        pred: { d: 'Diluisco dieci volte un tampone acetato (acqua pura aggiunta). Il pH…', o: ['scende di 1', 'sale di 1', 'resta circa uguale', 'va a 7'], g: 2,
          p: ['Si confonde con un acido forte: qui il rapporto non cambia.', 'Diluire non aggiunge base.', 'Il rapporto [A⁻]/[HA] non cambia: il pH resta ≈ pKa + log(rapporto) (finché le concentrazioni non diventano troppo piccole).', 'Solo a diluizione estrema il tampone smette di funzionare.'] },
        prova: { et: 'log([A⁻]/[HA]) =', min: -2, max: 2, passo: 0.1, val: 0 } },
      { id: 'c-cinetica', liv: 1, tit: 'La cinetica del primo ordine', sez: 'skin', scena: 'onda',
        testo: 'In una reazione del primo ordine la velocità è proporzionale alla concentrazione: [A] = [A]₀·e^(−kt). Il tempo di dimezzamento è t½ = ln 2 / k.',
        pred: { d: 'Raddoppio la concentrazione iniziale in una reazione del primo ordine. Il tempo di dimezzamento…', o: ['raddoppia', 'si dimezza', 'resta uguale', 'quadruplica'], g: 2,
          p: ['Varrebbe per l\'ordine zero.', 'Varrebbe per il secondo ordine.', 't½ = ln 2 / k non dipende da [A]₀: è la firma del primo ordine (decadimento radioattivo compreso).', 'Nessun ordine semplice dà questo.'] },
        prova: { et: 'costante k (s⁻¹) =', min: 0.01, max: 1, passo: 0.01, val: 0.1 } },
      { id: 'c-ir', liv: 1, tit: 'La spettroscopia IR', sez: 'sirvis', scena: 'spettro',
        testo: 'Un legame vibra come una molla: ν̃ = (1/2πc)·√(k/μ). Legami più forti e atomi più leggeri vibrano a numeri d\'onda più alti. Ogni gruppo funzionale lascia la sua firma.',
        pred: { d: 'Dove assorbe lo stretching C=O di un chetone?', o: ['circa 3300 cm⁻¹', 'circa 2950 cm⁻¹', 'circa 1715 cm⁻¹', 'circa 1100 cm⁻¹'], g: 2,
          p: ['È la zona O–H / N–H, larga.', 'È lo stretching C–H alifatico.', 'Il carbonile: banda intensa e stretta attorno a 1715 cm⁻¹.', 'È la zona C–O (alcoli, eteri).'] } },
      { id: 'c-nmr', liv: 2, tit: 'L\'¹H-NMR e l\'accoppiamento spin–spin', sez: 'sspec', scena: 'spettro',
        testo: 'Un protone accoppiato con n protoni equivalenti vicini si divide in n + 1 righe (regola n+1), con intensità dal triangolo di Pascal; la distanza fra le righe è la costante J (Hz).',
        pred: { d: 'Nell\'¹H-NMR dell\'etanolo (CH₃CH₂OH, OH in scambio rapido) il segnale del CH₃ è un…', o: ['singoletto', 'doppietto', 'tripletto', 'quartetto'], g: 2,
          p: ['Lo sarebbe senza vicini.', 'Avrebbe un solo H vicino.', 'Il CH₃ vede i 2 H del CH₂: 2 + 1 = 3 righe (1:2:1), J ≈ 7 Hz.', 'È il segnale del CH₂, che vede i 3 H del CH₃.'] } },
      { id: 'c-mo', liv: 2, tit: 'Gli orbitali molecolari: perché O₂ è magnetico', sez: 'smo', scena: 'orbitale',
        testo: 'Nella teoria MO gli elettroni occupano orbitali di tutta la molecola. Per O₂ gli ultimi due elettroni vanno nei due π* degeneri, uno per orbitale e con spin paralleli (regola di Hund).',
        pred: { d: 'L\'ossigeno molecolare O₂ è…', o: ['diamagnetico, tutti gli elettroni appaiati', 'paramagnetico, con due elettroni spaiati', 'paramagnetico, con un elettrone spaiato', 'non ha legame'], g: 1,
          p: ['È quello che prevede la struttura di Lewis O=O: e sbaglia.', 'Due elettroni nei π* degeneri, spin paralleli: stato di tripletto. L\'ossigeno liquido resta attaccato a un magnete.', 'Vale per lo ione O₂⁺ o O₂⁻.', 'L\'ordine di legame è 2: c\'è un doppio legame.'] } },
      { id: 'c-marcus', liv: 3, tit: 'La teoria di Marcus e la regione invertita', sez: 'schicinet', scena: 'superficie',
        testo: 'Per il trasferimento elettronico, Marcus: ΔG‡ = (λ + ΔG°)² / 4λ, con λ l\'energia di riorganizzazione. La barriera si annulla per −ΔG° = λ, e poi torna a crescere.',
        pred: { d: 'Rendo la reazione sempre più favorita (−ΔG° oltre λ). La velocità…', o: ['continua ad aumentare', 'resta costante', 'diminuisce', 'diventa infinita'], g: 2,
          p: ['L\'intuizione classica: smentita (e il Nobel 1992 è anche per questo).', 'Non c\'è saturazione nella formula.', 'Regione invertita: ΔG‡ = (λ + ΔG°)²/4λ torna a crescere. Osservata sperimentalmente da Miller, Calcaterra e Closs (1984).', 'La barriera minima è zero, non negativa.'] },
        prova: { et: 'ΔG° (eV), con λ = 1 eV, 298 K:', min: -2, max: 0, passo: 0.05, val: -0.5 } },
      { id: 'c-dft', liv: 4, tit: 'La frontiera: l\'errore di delocalizzazione della DFT', sez: 'schipes', scena: 'superficie',
        testo: 'La teoria del funzionale della densità è il cavallo di battaglia della chimica computazionale, ma i funzionali approssimati (LDA, GGA) non annullano esattamente l\'autointerazione di un elettrone con sé stesso. Le conseguenze sono note e ancora studiate.',
        pred: { d: 'Con un funzionale GGA, H₂⁺ portato a grande distanza (un elettrone diviso fra due protoni) ha un\'energia…', o: ['esatta', 'troppo bassa', 'troppo alta', 'indefinita'], g: 1,
          p: ['Per un elettrone solo la DFT esatta sarebbe esatta, ma i funzionali approssimati no.', 'L\'errore di autointerazione favorisce la carica frazionaria delocalizzata: l\'energia di dissociazione è sottostimata, e di molto (errore di delocalizzazione; Cohen, Mori-Sánchez, Yang, Science 2008).', 'È l\'errore opposto, tipico di Hartree–Fock (localizzazione).', 'Il calcolo converge a un valore, sbagliato.'] } }
    ],
    fisica: [
      { id: 'f-caduta', liv: 0, tit: 'La caduta dei gravi', sez: 'sfismecc', scena: 'pianeti',
        testo: 'Senz\'aria tutti i corpi cadono con la stessa accelerazione g ≈ 9,81 m/s²: h = ½gt², quindi t = √(2h/g). Lo intuì Galileo; lo mostrò l\'astronauta Scott sulla Luna con un martello e una piuma.',
        pred: { d: 'Senz\'aria, una palla da 10 kg e una da 1 kg lasciate dalla stessa altezza…', o: ['la pesante arriva molto prima', 'arrivano insieme', 'la leggera arriva prima', 'dipende dalla forma'], g: 1,
          p: ['L\'idea aristotelica: smentita.', 'Accelerazione g per ogni massa: la massa inerziale e quella gravitazionale coincidono.', 'Nessun meccanismo lo prevede.', 'Senz\'aria la forma non conta.'] },
        prova: { et: 'altezza h (m) =', min: 1, max: 100, passo: 1, val: 20 } },
      { id: 'f-gittata', liv: 0, tit: 'Il moto del proiettile', sez: 'sfismecc', scena: 'pianeti',
        testo: 'I moti orizzontale e verticale sono indipendenti: x = v₀cosθ·t, y = v₀sinθ·t − ½gt². Da terra a terra la gittata è R = v₀² sin 2θ / g.',
        pred: { d: 'Senz\'aria, con quale angolo di lancio si arriva più lontano?', o: ['30°', '45°', '60°', '90°'], g: 1,
          p: ['Dà la stessa gittata di 60°, minore del massimo.', 'sin 2θ è massimo a 2θ = 90°: θ = 45°.', 'Uguale a 30° (angoli complementari).', 'Va su e torna nello stesso punto: gittata zero.'] },
        prova: { et: 'angolo θ (°), v₀ = 20 m/s:', min: 5, max: 85, passo: 1, val: 30 } },
      { id: 'f-keplero', liv: 0, tit: 'Le leggi di Keplero', sez: 'sastroorbite', scena: 'pianeti',
        testo: 'I pianeti percorrono ellissi con il Sole in un fuoco; il raggio vettore spazza aree uguali in tempi uguali; T² ∝ a³. Sono conseguenze della gravitazione 1/r² e della conservazione del momento angolare.',
        pred: { d: 'Un pianeta su un\'orbita ellittica è più veloce…', o: ['all\'afelio', 'al perielio', 'sempre uguale', 'a metà strada'], g: 1,
          p: ['Lì è più lontano e più lento.', 'Seconda legge (aree uguali): vicino al Sole deve correre di più. Il rapporto è (1+e)/(1−e).', 'Solo se l\'orbita è circolare.', 'Non c\'è nulla di speciale lì.'] } },
      { id: 'f-pendolo', liv: 1, tit: 'Il pendolo', sez: 'sfismecc', scena: 'onda',
        testo: 'Per piccole oscillazioni il pendolo semplice è un oscillatore armonico: T = 2π√(L/g), indipendente dalla massa e (in prima approssimazione) dall\'ampiezza: l\'isocronismo di Galileo.',
        pred: { d: 'Quadruplico la lunghezza del pendolo. Il periodo…', o: ['quadruplica', 'raddoppia', 'resta uguale', 'si dimezza'], g: 1,
          p: ['T va come √L, non come L.', '√4 = 2: il periodo raddoppia.', 'Cambia, perché L è sotto radice.', 'Andrebbe al contrario.'] },
        prova: { et: 'lunghezza L (m) =', min: 0.1, max: 5, passo: 0.05, val: 1 } },
      { id: 'f-carnot', liv: 1, tit: 'Il rendimento di Carnot', sez: 'sfistermo', scena: 'onda',
        testo: 'Nessuna macchina termica fra due serbatoi a Tc e Th può avere rendimento maggiore di η = 1 − Tc/Th (temperature in kelvin): è il secondo principio della termodinamica.',
        pred: { d: 'Una macchina ideale lavora fra 600 K e 300 K. Il rendimento massimo è…', o: ['100%', '75%', '50%', '25%'], g: 2,
          p: ['Il secondo principio lo vieta.', 'Errore comune: si confonde con 1 − 150/600.', '1 − 300/600 = 0,5.', 'Sottostima: questo sarebbe 1 − 450/600.'] },
        prova: { et: 'temperatura calda Th (K), Tc = 300 K:', min: 310, max: 1500, passo: 10, val: 600 } },
      { id: 'f-interf', liv: 1, tit: 'L\'interferenza da due fenditure', sez: 'sfisonde', scena: 'onda',
        testo: 'Le onde da due fenditure si sommano: frange chiare dove la differenza di cammino è un multiplo di λ. Sullo schermo lontano la distanza fra le frange è Δy = λL/d.',
        pred: { d: 'Raddoppio la lunghezza d\'onda della luce. La distanza fra le frange…', o: ['si dimezza', 'raddoppia', 'resta uguale', 'quadruplica'], g: 1,
          p: ['È l\'effetto di raddoppiare d.', 'Δy = λL/d: proporzionale a λ.', 'Dipende da λ.', 'Non c\'è un quadrato.'] } },
      { id: 'f-scatola', liv: 2, tit: 'La particella in una scatola', sez: 'sschrod', scena: 'onda',
        testo: 'Un elettrone confinato in una scatola di lato L ha solo energie discrete: Eₙ = n²h²/(8mL²). Per L = 1 nm, E₁ ≈ 0,376 eV. È il cuore dei punti quantici, il cui colore dipende dalla dimensione.',
        pred: { d: 'Dimezzo la larghezza della scatola. L\'energia dello stato fondamentale…', o: ['si dimezza', 'raddoppia', 'quadruplica', 'resta uguale'], g: 2,
          p: ['Andrebbe al contrario.', 'Dimentica il quadrato.', 'E ∝ 1/L²: (1/2)⁻² = 4. I punti quantici piccoli emettono nel blu.', 'Il confinamento cambia tutto.'] },
        prova: { et: 'larghezza L (nm) =', min: 0.2, max: 5, passo: 0.05, val: 1 } },
      { id: 'f-tunnel', liv: 2, tit: 'L\'effetto tunnel', sez: 'sschrod', scena: 'onda',
        testo: 'Una particella può attraversare una barriera più alta della sua energia: la trasmissione cala come T ≈ e^(−2κa), con κ = √(2m(V−E))/ħ. Per un elettrone con V − E = 1 eV, κ ≈ 5,12 nm⁻¹. Il microscopio a effetto tunnel vede i singoli atomi grazie a questo.',
        pred: { d: 'Raddoppio lo spessore della barriera. La probabilità di attraversarla…', o: ['si dimezza', 'resta uguale', 'diventa circa il suo quadrato', 'raddoppia'], g: 2,
          p: ['La dipendenza è esponenziale, non inversa.', 'Dipende dallo spessore.', 'e^(−2κ·2a) = (e^(−2κa))²: se era 10⁻³ diventa 10⁻⁶.', 'Più spessa, più difficile.'] },
        prova: { et: 'spessore a (nm), V − E = 1 eV:', min: 0.05, max: 1.5, passo: 0.05, val: 0.5 } },
      { id: 'f-relat', liv: 3, tit: 'La dilatazione del tempo e i muoni', sez: 'sfisrel', scena: 'onda',
        testo: 'Un orologio in moto scorre più lento di un fattore γ = 1/√(1 − v²/c²). I muoni creati dai raggi cosmici a 10–15 km di quota vivono τ ≈ 2,2 μs: senza relatività percorrerebbero in media ~660 m.',
        pred: { d: 'Perché tanti muoni dei raggi cosmici arrivano al livello del mare?', o: ['vanno più veloci della luce', 'per loro il tempo scorre più lento (visto da noi)', 'vengono creati vicino al suolo', 'non decadono'], g: 1,
          p: ['Nessuna particella con massa raggiunge c.', 'Con v ≈ 0,9995c, γ ≈ 32: il percorso medio diventa γβcτ ≈ 20 km. Nel loro riferimento, è l\'atmosfera a essere contratta.', 'Nascono nell\'alta atmosfera.', 'Decadono, con vita media 2,2 μs.'] },
        prova: { et: 'velocità v/c =', min: 0, max: 0.9999, passo: 0.0001, val: 0.995 } },
      { id: 'f-gw', liv: 4, tit: 'La frontiera: le onde gravitazionali', sez: 'sastrogw', scena: 'superficie',
        testo: 'Due buchi neri che si fondono increspano lo spaziotempo. Il 14 settembre 2015 LIGO ha misurato GW150914: due buchi neri da circa 36 e 29 masse solari, a circa 400 Mpc. Gli interferometri misurano lo strain h = ΔL/L.',
        pred: { d: 'Di che ordine era lo strain di GW150914 arrivato sulla Terra?', o: ['10⁻⁶', '10⁻¹²', '10⁻¹⁵', '10⁻²¹'], g: 3,
          p: ['Sarebbe visibile a occhio con un righello.', 'Molto più grande del vero.', 'Ancora mille milioni di volte troppo grande.', 'Picco ≈ 10⁻²¹: su bracci di 4 km, ΔL ≈ 4·10⁻¹⁸ m, circa 1/400 del diametro di un protone.'] } }
    ],
    matematica: [
      { id: 'm-deriv', liv: 0, tit: 'La derivata come pendenza', sez: 'smatfunz', scena: 'superficie',
        testo: 'La derivata f′(x₀) è la pendenza della retta tangente: il limite del rapporto incrementale. Per f(x) = xⁿ vale f′(x) = n·xⁿ⁻¹.',
        pred: { d: 'Quanto vale la derivata di f(x) = x³ in x = 2?', o: ['6', '8', '12', '24'], g: 2,
          p: ['È 3·x senza il quadrato.', 'È f(2), non f′(2).', 'f′(x) = 3x² → 3·4 = 12.', 'Doppio del giusto.'] },
        prova: { et: 'punto x₀, f(x) = x³:', min: -3, max: 3, passo: 0.1, val: 2 } },
      { id: 'm-e', liv: 0, tit: 'Il numero e', sez: 'smatserie', scena: 'superficie',
        testo: 'Il capitale con interesse composto n volte all\'anno al 100% diventa (1 + 1/n)ⁿ. Per n → ∞ tende a e ≈ 2,71828: la base naturale della crescita continua.',
        pred: { d: 'Quanto vale (1 + 1/n)ⁿ per n molto grande?', o: ['cresce senza limite', 'tende a 1', 'tende a e ≈ 2,718', 'tende a 2'], g: 2,
          p: ['Cresce, ma sempre più lentamente: ha un limite.', '1ⁿ = 1, ma la base non è esattamente 1.', 'È la definizione di e (Bernoulli, Eulero).', 'Vale solo per n = 1.'] },
        prova: { et: 'n = 10^x, x =', min: 0, max: 6, passo: 0.25, val: 2 } },
      { id: 'm-int', liv: 1, tit: 'L\'integrale e il logaritmo', sez: 'smatcalc', scena: 'superficie',
        testo: 'L\'integrale definito misura l\'area con segno sotto una curva. ∫₁ᵇ dx/x = ln b: il logaritmo naturale è proprio quest\'area.',
        pred: { d: 'Quanto vale ∫₁ᵉ dx/x?', o: ['e', '1', '0', 'e − 1'], g: 1,
          p: ['Confonde l\'estremo con il valore.', 'ln e − ln 1 = 1.', 'Sarebbe ∫₁¹.', 'È ∫₁ᵉ dx, non dx/x.'] },
        prova: { et: 'estremo superiore b =', min: 1, max: 10, passo: 0.1, val: 2.718 } },
      { id: 'm-basilea', liv: 1, tit: 'La serie di Basilea', sez: 'smatserie', scena: 'superficie',
        testo: 'Eulero (1734) dimostrò che 1 + 1/4 + 1/9 + 1/16 + … = π²/6 ≈ 1,6449. Le somme parziali si avvicinano lentamente: la coda dopo N vale fra 1/(N+1) e 1/N.',
        pred: { d: 'A che cosa converge Σ 1/n²?', o: ['diverge', '2', 'π²/6', 'e'], g: 2,
          p: ['Diverge Σ 1/n, non Σ 1/n².', 'È il valore di Σ 1/2ⁿ⁻¹, un\'altra serie.', 'Il problema di Basilea: π²/6.', 'Nessun legame con e.'] },
        prova: { et: 'termini sommati N = 10^x, x =', min: 1, max: 5, passo: 0.25, val: 2 } },
      { id: 'm-armonica', liv: 1, tit: 'La serie armonica', sez: 'smatserie', scena: 'superficie',
        testo: 'I termini 1/n tendono a zero, eppure la somma 1 + 1/2 + 1/3 + … cresce senza limite, come ln N + γ (γ ≈ 0,5772, la costante di Eulero–Mascheroni).',
        pred: { d: 'La serie 1 + 1/2 + 1/3 + 1/4 + …', o: ['converge a 2', 'converge a ln 2', 'diverge', 'converge a e'], g: 2,
          p: ['Errore tipico: i termini decrescono, ma non basta.', 'ln 2 è la somma della serie a segni alterni.', 'Oresme (XIV secolo): raggruppando i termini si superano ½ infinite volte. H_N ≈ ln N + γ.', 'Nessuna relazione.'] },
        prova: { et: 'termini N = 10^x, x =', min: 1, max: 7, passo: 0.25, val: 3 } },
      { id: 'm-autoval', liv: 2, tit: 'Autovalori: la rotazione del piano', sez: 'smatlin', scena: 'superficie',
        testo: 'Un autovettore non cambia direzione sotto la trasformazione: Av = λv. Una rotazione del piano di un angolo θ non lascia ferma nessuna direzione reale (se θ non è 0 o π).',
        pred: { d: 'Gli autovalori della rotazione del piano di 90° sono…', o: ['1 e −1', '0 e 1', '±i', 'non ne ha'], g: 2,
          p: ['Sono quelli di una riflessione.', 'Nessuna direzione resta ferma.', 'Polinomio caratteristico λ² + 1 = 0: λ = e^(±iθ) = ±i. Reali non ce ne sono, complessi sì.', 'Ne ha due, complessi.'] },
        prova: { et: 'angolo θ (°):', min: 0, max: 180, passo: 1, val: 90 } },
      { id: 'm-gibbs', liv: 2, tit: 'La serie di Fourier e il fenomeno di Gibbs', sez: 'smatcompl', scena: 'onda',
        testo: 'Un\'onda quadra si scrive come somma di seni: (4/π)·Σ sin(kx)/k sui k dispari. Vicino al salto le somme parziali superano il valore 1, e il picco non si abbassa aggiungendo termini: si stringe soltanto.',
        pred: { d: 'Aggiungendo sempre più termini, il picco vicino al salto…', o: ['scompare', 'tende a circa il 9% del salto oltre il valore', 'cresce senza limite', 'si sposta lontano'], g: 1,
          p: ['L\'intuizione naturale: smentita (Gibbs 1899, Wilbraham 1848).', 'Il massimo tende a ≈ 1,179 per un salto da −1 a 1: un eccesso di circa l\'8,95% del salto. La convergenza è puntuale, non uniforme.', 'Resta limitato.', 'Si avvicina al salto.'] },
        prova: { et: 'termini (k dispari ≤) N =', min: 1, max: 201, passo: 2, val: 9 } },
      { id: 'm-residui', liv: 3, tit: 'L\'analisi complessa e i residui', sez: 'smatanalcomp', scena: 'superficie',
        testo: 'Un integrale reale difficile diventa facile chiudendo il cammino nel piano complesso: ∮ f dz = 2πi·Σ residui. Per 1/(1+x²) basta il polo in z = i.',
        pred: { d: 'Quanto vale ∫ da −∞ a +∞ di dx/(1 + x²)?', o: ['1', 'π/2', 'π', '2π'], g: 2,
          p: ['Sottostima di un fattore π.', 'È l\'integrale da 0 a +∞.', 'Residuo in z = i: 1/(2i); 2πi · 1/(2i) = π. Coincide con [arctan x] da −∞ a +∞.', 'Doppio del giusto.'] } },
      { id: 'm-calore', liv: 3, tit: 'L\'equazione del calore', sez: 'smatedp', scena: 'onda',
        testo: 'u_t = u_xx smussa ogni profilo: ogni modo sin(kx) decade come e^(−k²t). Le oscillazioni rapide spariscono per prime. È anche il motivo per cui risolverla all\'indietro nel tempo è un problema mal posto.',
        pred: { d: 'Un modo con frequenza spaziale doppia, nell\'equazione del calore, decade…', o: ['alla stessa velocità', 'due volte più in fretta', 'quattro volte più in fretta (nell\'esponente)', 'più lentamente'], g: 2,
          p: ['Il decadimento dipende da k.', 'Dimentica il quadrato.', 'L\'esponente è −k²t: raddoppiare k quadruplica il tasso.', 'Il contrario.'] },
        prova: { et: 'frequenza k, a t = 0,1:', min: 1, max: 10, passo: 1, val: 2 } },
      { id: 'm-riemann', liv: 4, tit: 'La frontiera: l\'ipotesi di Riemann', sez: 'smatnumeri', scena: 'superficie',
        testo: 'La funzione zeta ζ(s) = Σ 1/nˢ governa la distribuzione dei numeri primi. Riemann (1859) congetturò che i suoi zeri non banali stiano tutti sulla retta Re(s) = ½. È uno dei problemi del Millennio del Clay Institute, ancora aperto.',
        pred: { d: 'Che cosa si sa oggi degli zeri non banali di ζ?', o: ['ne è stato trovato uno fuori dalla retta', 'trilioni sono stati verificati sulla retta, ma non c\'è una dimostrazione', 'l\'ipotesi è stata dimostrata nel 2018', 'sono in numero finito'], g: 1,
          p: ['Nessuno: sarebbe un controesempio celebre.', 'Verifiche numeriche su oltre 10¹² zeri (Gourdon 2004, poi Platt e Trudgian 2021) e risultati parziali (una frazione positiva sta sulla retta: Selberg, Levinson, Conrey), ma la congettura resta aperta.', 'Annunci non accettati dalla comunità.', 'Sono infiniti (Hardy 1914: infiniti sulla retta).'] } }
    ]
  };

  /* ── le prove: la grandezza calcolata dal cursore ── */
  function gibbsMax(N) { var m = 0; for (var i = 1; i <= 4000; i++) { var x = i / 4000 * (Math.PI / 2), s = 0; for (var k = 1; k <= N; k += 2) s += Math.sin(k * x) / k; s *= 4 / Math.PI; if (s > m) m = s; } return m; }
  function calcola(id, v) {
    switch (id) {
      case 'c-ph': { var C = Math.pow(10, -v), H = (C + Math.sqrt(C * C + 4e-14)) / 2, ph = -Math.log10(H); return { v: ph, testo: 'C = 10^−' + f(v, 2) + ' M → [H⁺] = ' + H.toExponential(2).replace('.', ',') + ' M · pH = ' + f(ph, 2) + ' (solo −log C darebbe ' + f(v, 2) + ')' }; }
      case 'c-tampone': { var ph2 = 4.76 + v; return { v: ph2, testo: '[A⁻]/[HA] = ' + f(Math.pow(10, v), 2) + ' → pH = 4,76 + ' + f(v, 1) + ' = ' + f(ph2, 2) + ' (acido acetico, pKa 4,76)' }; }
      case 'c-cinetica': { var th = LN2 / v; return { v: th, testo: 'k = ' + f(v, 2) + ' s⁻¹ → t½ = ln 2 / k = ' + f(th, 2) + ' s, per qualunque [A]₀' }; }
      case 'c-marcus': { var l = 1, dg = (l + v) * (l + v) / (4 * l), kT = 0.025693, rel = Math.exp(-dg / kT); return { v: dg, testo: 'ΔG° = ' + f(v, 2) + ' eV → ΔG‡ = ' + f(dg, 3) + ' eV · k/k_max = ' + (rel < 1e-3 ? rel.toExponential(1).replace('.', ',') : f(rel, 3)) + (v < -l ? ' (regione invertita)' : v > -l ? ' (regione normale)' : ' (massimo)') }; }
      case 'f-caduta': { var tt = Math.sqrt(2 * v / G), vv = Math.sqrt(2 * G * v); return { v: tt, testo: 'h = ' + f(v, 0) + ' m → t = √(2h/g) = ' + f(tt, 2) + ' s · v = ' + f(vv, 1) + ' m/s (' + f(vv * 3.6, 0) + ' km/h)' }; }
      case 'f-gittata': { var R = 400 * Math.sin(2 * v * Math.PI / 180) / G; return { v: R, testo: 'θ = ' + f(v, 0) + '° → R = v₀² sin 2θ / g = ' + f(R, 2) + ' m (massimo a 45°: ' + f(400 / G, 2) + ' m)' }; }
      case 'f-pendolo': { var T = 2 * Math.PI * Math.sqrt(v / G); return { v: T, testo: 'L = ' + f(v, 2) + ' m → T = 2π√(L/g) = ' + f(T, 3) + ' s' }; }
      case 'f-carnot': { var e = 1 - 300 / v; return { v: e, testo: 'Th = ' + f(v, 0) + ' K → η = 1 − 300/' + f(v, 0) + ' = ' + f(e * 100, 1) + '%' }; }
      case 'f-scatola': { var E = 0.37603 / (v * v); return { v: E, testo: 'L = ' + f(v, 2) + ' nm → E₁ = h²/(8mL²) = ' + f(E, 3) + ' eV · E₂ = ' + f(4 * E, 3) + ' eV' }; }
      case 'f-tunnel': { var Tt = Math.exp(-2 * 5.1232 * v); return { v: Tt, testo: 'a = ' + f(v, 2) + ' nm → T ≈ e^(−2κa) = ' + Tt.toExponential(2).replace('.', ',') + ' (κ = 5,12 nm⁻¹)' }; }
      case 'f-relat': { var g = 1 / Math.sqrt(1 - v * v), d = g * v * 658.6; return { v: g, testo: 'v = ' + f(v, 4) + 'c → γ = ' + f(g, 2) + ' · percorso medio di un muone γβcτ = ' + (d > 2000 ? f(d / 1000, 1) + ' km' : f(d, 0) + ' m') }; }
      case 'm-deriv': { var der = 3 * v * v; return { v: der, testo: 'x₀ = ' + f(v, 1) + ' → f(x₀) = ' + f(v * v * v, 3) + ' · f′(x₀) = 3x₀² = ' + f(der, 2) }; }
      case 'm-e': { var n = Math.round(Math.pow(10, v)), val = Math.pow(1 + 1 / n, n); return { v: val, testo: 'n = ' + n + ' → (1 + 1/n)ⁿ = ' + f(val, 6) + ' · e − valore = ' + (Math.E - val).toExponential(2).replace('.', ',') }; }
      case 'm-int': { var lb = Math.log(v); return { v: lb, testo: '∫₁^' + f(v, 2) + ' dx/x = ln ' + f(v, 2) + ' = ' + f(lb, 4) }; }
      case 'm-basilea': { var N = Math.round(Math.pow(10, v)), S = 0; for (var k = N; k >= 1; k--) S += 1 / (k * k); var L = Math.PI * Math.PI / 6; return { v: S, testo: 'N = ' + N + ' → S_N = ' + f(S, 6) + ' · π²/6 − S_N = ' + f(L - S, 6) + ' (fra ' + f(1 / (N + 1), 6) + ' e ' + f(1 / N, 6) + ')' }; }
      case 'm-armonica': { var N2 = Math.round(Math.pow(10, v)), H2 = 0; if (N2 <= 1e6) { for (var j = N2; j >= 1; j--) H2 += 1 / j; } else H2 = Math.log(N2) + 0.5772156649 + 1 / (2 * N2); return { v: H2, testo: 'N = ' + N2 + ' → H_N = ' + f(H2, 4) + ' · ln N + γ = ' + f(Math.log(N2) + 0.5772156649, 4) }; }
      case 'm-autoval': { var th2 = v * Math.PI / 180, c = Math.cos(th2), s = Math.sin(th2); return { v: s, testo: 'θ = ' + f(v, 0) + '° → λ = cos θ ± i sin θ = ' + f(c, 3) + ' ± ' + f(s, 3) + 'i' + (Math.abs(s) < 1e-9 ? ' (reali)' : '') }; }
      case 'm-gibbs': { var M = gibbsMax(v); return { v: M, testo: 'N = ' + f(v, 0) + ' → massimo della somma parziale = ' + f(M, 4) + ' · eccesso = ' + f((M - 1) / 2 * 100, 2) + '% del salto (limite ≈ 8,95%)' }; }
      case 'm-calore': { var fa = Math.exp(-v * v * 0.1); return { v: fa, testo: 'k = ' + f(v, 0) + ' → ampiezza a t = 0,1: e^(−k²t) = ' + f(fa, 4) }; }
    }
    return null;
  }

  /* ── la memoria delle previsioni ── */
  var MEM = 'bsi-esplora-v1';
  function memoria() { try { return JSON.parse(localStorage.getItem(MEM) || '{}'); } catch (e) { return {}; } }
  function ricorda(id, giusta) { try { var m = memoria(); m[id] = { giusta: !!giusta, quando: Date.now() }; localStorage.setItem(MEM, JSON.stringify(m)); } catch (e) {} }

  /* ── la pagina ── */
  var CSS = '.bsiEX{display:flex;flex-direction:column;gap:14px}' +
    '.bsiEX .barra{height:8px;border-radius:999px;background:rgba(143,176,255,.12);overflow:hidden}.bsiEX .barra i{display:block;height:100%;background:linear-gradient(90deg,#1d4ed8,#0e7490)}' +
    '.bsiEX .cap{background:rgba(13,27,46,.72);border:1px solid #1a3550;border-radius:16px;padding:16px 16px 14px;color:#dbe7f6;font:400 15px/1.6 system-ui;scroll-margin-top:var(--bsiEX-top,220px)}' +
    '.bsiEX .cap.attivo{border-color:#00c9b7;box-shadow:0 0 0 1px rgba(0,201,183,.35)}' +
    '.bsiEX .liv{display:inline-block;font:800 11px system-ui;letter-spacing:.08em;text-transform:uppercase;color:#9fe7ff;background:rgba(14,116,144,.35);border:1px solid rgba(0,201,183,.4);border-radius:999px;padding:3px 9px;margin-bottom:6px}' +
    '.bsiEX h3{margin:4px 0 8px;font:800 18px system-ui;color:#5eead4}.bsiEX .dom{font-weight:700;margin:10px 0 6px}' +
    '.bsiEX .opz{display:grid;gap:8px}.bsiEX .opz button{text-align:left;background:#0d1b2e;border:1px solid #1a3550;color:#e9eef6;border-radius:10px;padding:10px 12px;font:500 14.5px/1.4 system-ui;cursor:pointer;min-height:44px}' +
    '.bsiEX .opz button.giusta{border-color:#1fd39a;background:rgba(31,211,154,.12)}.bsiEX .opz button.sbagliata{border-color:#ff6b9d;background:rgba(255,107,157,.1)}' +
    '.bsiEX .perche{margin-top:8px;font-size:14px;color:#cfe2ff}.bsiEX .perche p{margin:4px 0}' +
    '.bsiEX .prova{margin-top:12px;background:rgba(0,0,0,.2);border:1px solid #1a3550;border-radius:12px;padding:10px 12px}.bsiEX .prova input{width:100%}.bsiEX .misura{font:600 14px ui-monospace,monospace;color:#9fe7ff;margin-top:4px}' +
    '.bsiEX .az{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.bsiEX .az button{background:rgba(16,32,64,.85);border:1px solid #2a4a70;color:#cfe2ff;border-radius:999px;padding:8px 13px;font:700 13px system-ui;cursor:pointer;min-height:38px}' +
    /* Spectra resta in scena mentre si scorre (sotto la testata dell\'app) */
    '.bsiFX .bsiSF.bsiEX-palco{position:sticky;top:var(--bsiEX-top,200px);z-index:6}' +
    '@media (max-width:700px){.bsiFX .bsiSF.bsiEX-palco{height:clamp(220px,32vh,280px);min-height:220px}}';

  function altezzaTesta() {
    var y = 0;
    for (var k = 0; k < 6; k++) {
      var els = D.elementsFromPoint(globale.innerWidth / 2, y + 2), fisso = null;
      for (var i = 0; i < els.length && !fisso; i++) { var a = els[i]; while (a && a !== D.body) { var p = globale.getComputedStyle(a).position; if (p === 'fixed' || p === 'sticky') { fisso = a; break; } a = a.parentElement; } }
      if (!fisso || fisso.classList.contains('bsiSF')) break;
      var b = fisso.getBoundingClientRect().bottom; if (b <= y + 1) break; y = b;
    }
    return Math.round(y);
  }

  function costruisci(materia, pan) {
    if (!D.getElementById('bsiEX-stile')) { var st = D.createElement('style'); st.id = 'bsiEX-stile'; st.textContent = CSS; D.head.appendChild(st); }
    var caps = CAPITOLI[materia] || [], w = D.createElement('div'); w.className = 'bsiEX'; pan.appendChild(w);
    var m = memoria(), fatti = caps.filter(function (c) { return m[c.id]; }).length;
    var testa = D.createElement('div');
    testa.innerHTML = '<div class="nota" style="color:#9fb6dd">' + t('Scorri: Spectra racconta ogni capitolo e l\'ologramma lo mostra. Prevedi, prova con il cursore, poi guardalo dal vivo o fattelo spiegare tutto.', 'Scroll: Spectra tells each chapter and the hologram shows it. Predict, try the slider, then watch it live or get the full explanation.') + '</div>' +
      '<div style="display:flex;justify-content:space-between;font:700 12px system-ui;color:#9fe7ff;margin:8px 0 4px"><span>' + t('Il tuo percorso', 'Your path') + '</span><span class="conta">' + fatti + '/' + caps.length + '</span></div><div class="barra"><i style="width:' + (fatti / Math.max(1, caps.length) * 100) + '%"></i></div>';
    w.appendChild(testa);
    function aggiornaBarra() { var mm = memoria(), n = caps.filter(function (c) { return mm[c.id]; }).length; testa.querySelector('.conta').textContent = n + '/' + caps.length; testa.querySelector('.barra i').style.width = (n / Math.max(1, caps.length) * 100) + '%'; }
    caps.forEach(function (c) {
      var k = D.createElement('section'); k.className = 'cap'; k.id = 'bsiEX-' + c.id; k.setAttribute('aria-labelledby', 'bsiEX-t-' + c.id); k.dataset.cap = c.id;
      k.innerHTML = '<span class="liv">' + LIV[c.liv] + '</span><h3 id="bsiEX-t-' + c.id + '">' + esc(c.tit) + '</h3><p>' + esc(c.testo) + '</p>' +
        '<div class="dom">🔮 ' + t('Prevedi', 'Predict') + ': ' + esc(c.pred.d) + '</div><div class="opz" role="group" aria-label="' + t('Le possibili risposte', 'Possible answers') + '"></div><div class="perche" aria-live="polite"></div>';
      var box = k.querySelector('.opz'), per = k.querySelector('.perche');
      function rivela(i, silenzio) {
        [].forEach.call(box.children, function (b, j) { b.disabled = true; b.classList.add(j === c.pred.g ? 'giusta' : j === i ? 'sbagliata' : 'x'); });
        var giusta = i === c.pred.g;
        per.innerHTML = '<p><b>' + (giusta ? t('✓ Giusto.', '✓ Right.') : t('✗ Era un\'altra: ', '✗ It was another one: ') + esc(c.pred.o[c.pred.g]) + '.') + '</b></p>' + c.pred.o.map(function (o, j) { return '<p>' + (j === c.pred.g ? '✓ ' : j === i ? '✗ ' : '· ') + '<b>' + esc(o) + '</b> — ' + esc(c.pred.p[j]) + '</p>'; }).join('');
        if (!silenzio) { ricorda(c.id, giusta); aggiornaBarra(); annuncia('bsi-spectra-dice', { testo: (giusta ? t('Esatto. ', 'Exactly. ') : t('Non proprio. ', 'Not quite. ')) + c.pred.p[c.pred.g], emo: giusta ? 'gioia' : 'sorpresa' }); }
      }
      c.pred.o.forEach(function (o, i) { var b = D.createElement('button'); b.type = 'button'; b.textContent = String.fromCharCode(65 + i) + '. ' + o; b.onclick = function () { rivela(i); }; box.appendChild(b); });
      if (m[c.id]) { /* gia' fatto: si mostra la rivelazione, senza ripetere la reazione */ per.innerHTML = '<p class="nota" style="color:#9fb6dd">' + t('Già previsto ', 'Already predicted ') + (m[c.id].giusta ? '✓' : '✗') + ' — ' + t('tocca una risposta per rivederlo.', 'tap an answer to see it again.') + '</p>'; [].forEach.call(box.children, function (b, j) { b.onclick = function () { rivela(j, true); }; }); }
      if (c.prova) {
        var P = D.createElement('div'); P.className = 'prova';
        P.innerHTML = '<label>🧪 ' + t('Prova', 'Try') + ' — ' + esc(c.prova.et) + ' <b class="val"></b><input type="range" min="' + c.prova.min + '" max="' + c.prova.max + '" step="' + c.prova.passo + '" value="' + c.prova.val + '"></label><div class="misura" aria-live="polite"></div>';
        var inp = P.querySelector('input'), val = P.querySelector('.val'), mis = P.querySelector('.misura');
        var agg = function () { var r = calcola(c.id, +inp.value); val.textContent = inp.value; mis.textContent = r ? r.testo : ''; };
        inp.oninput = agg; agg(); k.appendChild(P);
      }
      var az = D.createElement('div'); az.className = 'az';
      var b1 = D.createElement('button'); b1.type = 'button'; b1.textContent = '📺 ' + t('Guardalo dal vivo', 'Watch it live');
      b1.onclick = function () { if (globale.bsiOpenAIHub && globale.BSISpiega) { globale.bsiOpenAIHub('spiega'); globale.BSISpiega.mostraSezione(c.sez); } else { var nb = D.querySelector('[data-s="' + c.sez + '"]'); if (nb) nb.click(); } };
      var b2 = D.createElement('button'); b2.type = 'button'; b2.textContent = '🧠 ' + t('Spiegamelo tutto', 'Explain it all');
      b2.onclick = function () { if (!globale.bsiOpenAIHub || !globale.BSISpiega) return; globale.bsiOpenAIHub('spiega'); globale.BSISpiega.mostraSezione(c.sez).then(function () { globale.BSISpiega.chiedi(c.tit + ': ' + c.pred.d, { schermo: true, livello: c.liv, nonAprire: true }); }); };
      var b3 = D.createElement('button'); b3.type = 'button'; b3.textContent = '🔊 ' + t('Ascolta Spectra', 'Listen to Spectra');
      b3.onclick = function () { var L = globale.BSISpectraLive; if (L && L.parla) L.parla(c.tit + '. ' + c.testo); else annuncia('bsi-spectra-dice', { testo: c.testo }); };
      az.appendChild(b1); az.appendChild(b2); az.appendChild(b3); k.appendChild(az);
      w.appendChild(k);
    });
    /* scorrendo: il capitolo che si ha davanti diventa «attivo»; Spectra lo racconta (a gesti e labiale) e l'ologramma cambia scena */
    var attivo = null;
    function attiva(k) {
      if (!k || k === attivo) return; if (attivo) attivo.classList.remove('attivo'); attivo = k; k.classList.add('attivo');
      var c = caps.filter(function (x) { return x.id === k.dataset.cap; })[0]; if (!c) return;
      var F = globale.BSISpectraFigura && globale.BSISpectraFigura.figura;
      if (F && F.olo) { F.olo.auto = false; F.olo.mostra(c.scena); }
      annuncia('bsi-spectra-dice', { testo: c.tit + '. ' + c.testo, emo: 'curiosa' });
    }
    /* il capitolo attivo e' quello che attraversa il centro dello spazio libero sotto il palco di Spectra
       (funziona anche con capitoli piu' alti dello schermo, dove una soglia di visibilita' non scatterebbe mai) */
    var inAttesa = false;
    function guarda() {
      inAttesa = false; if (!w.isConnected || !w.offsetParent) return;
      var top = parseFloat(globale.getComputedStyle(D.documentElement).getPropertyValue('--bsiEX-top')) || 0, palco = w.parentNode && w.parentNode.parentNode ? w.parentNode.parentNode.querySelector('.bsiSF.bsiEX-palco') : null;
      var basso = palco ? Math.max(top, palco.getBoundingClientRect().bottom) : top, y = (basso + globale.innerHeight) / 2;
      var scelto = null; [].forEach.call(w.querySelectorAll('.cap'), function (k) { var r = k.getBoundingClientRect(); if (r.top <= y && r.bottom >= y) scelto = k; });
      if (scelto) attiva(scelto);
    }
    globale.addEventListener('scroll', function () { if (!inAttesa) { inAttesa = true; globale.requestAnimationFrame(guarda); } }, { passive: true });
    setTimeout(guarda, 800);
    /* la testata dell'app e' fissa: il palco di Spectra si ferma subito sotto */
    var mis = function () { var h = altezzaTesta(); D.documentElement.style.setProperty('--bsiEX-top', (h || 0) + 'px'); };
    setTimeout(mis, 300); globale.addEventListener('resize', mis);
    return w;
  }

  /* ── le tre sezioni (framework BSIFisica, come le aree con l'assistente) ── */
  var SEZ = [
    ['sesplchim', 'chimica', ['⚡ Esplora la chimica con Spectra', '⚡ Explore chemistry with Spectra'], ['Una pagina da scorrere, nello stile delle lezioni esplorabili: dieci capitoli dalla scuola superiore al PhD avanzato. In ognuno prevedi che cosa succede, lo provi con un cursore che ricalcola davvero, lo guardi dal vivo nell\'ologramma di Spectra e te lo fai spiegare tutto.', 'A page to scroll, in the style of explorable lessons: ten chapters from high school to advanced PhD.']],
    ['sesplfis', 'fisica', ['⚡ Esplora la fisica con Spectra', '⚡ Explore physics with Spectra'], ['Dieci capitoli, dalla caduta dei gravi alle onde gravitazionali: prevedi, prova, guarda dal vivo, fatti spiegare tutto. Spectra resta in scena e l\'ologramma segue il capitolo.', 'Ten chapters, from falling bodies to gravitational waves.']],
    ['sesplmat', 'matematica', ['⚡ Esplora la matematica con Spectra', '⚡ Explore mathematics with Spectra'], ['Dieci capitoli, dalla derivata all\'ipotesi di Riemann: prevedi, prova con i numeri veri, guarda dal vivo, fatti spiegare tutto. Spectra resta in scena e l\'ologramma segue il capitolo.', 'Ten chapters, from the derivative to the Riemann hypothesis.']]
  ];
  function registra() {
    var F = globale.BSIFisica; if (!F || !F.sezione) return false;
    SEZ.forEach(function (A) {
      F.sezione(A[0], { titolo: A[2], sotto: A[3], schede: [{ nome: ['⚡ Esplora', '⚡ Explore'], costruisci: function (pan) { costruisci(A[1], pan); } }] });
    });
    return true;
  }
  if (!registra() && D) { if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', registra); }

  globale.BSIEsplora = { CAPITOLI: CAPITOLI, calcola: calcola, costruisci: costruisci, gibbsMax: gibbsMax, SEZIONI: SEZ.map(function (a) { return a[0]; }), MEM: MEM };
})(typeof window !== 'undefined' ? window : globalThis);
