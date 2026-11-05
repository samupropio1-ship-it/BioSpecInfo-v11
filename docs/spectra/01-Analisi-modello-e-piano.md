# Spectra incarnato — 1. Analisi del modello e piano di modifica

*BioSpecInfo · documento di progetto · v239 · © Samuele Pio Provenzano*

## 1. Il punto di partenza, detto con onestà

**Il modello richiesto** è «CHARACTER CYBERPUNK MEN BY Oscar Creativo» (Sketchfab, `https://skfb.ly/psvAD`). In questa sessione **non è stato possibile aprirlo**. La rete dell'ambiente cloud blocca `skfb.ly` e `sketchfab.com`, e Sketchfab consente di scaricare un modello solo dopo l'accesso con un account. Per questo il documento:

- **non descrive il modello**: non l'abbiamo visto, e inventarne topologia, rig o licenza sarebbe peggio che non dire niente;
- **fissa le condizioni** che il modello deve soddisfare e **cosa fa il sistema in ciascun caso**;
- **prepara tutto il resto** in modo che il modello, quando arriva, si colleghi senza riscrivere nulla. Il driver del corpo è generico: riconosce lo scheletro e le espressioni di qualunque GLB umanoide.

**Aggiornamento.** In seguito l'autore ha fornito direttamente i file: prima «I-HOMO 08», poi il corpo «Bounty Hunter», che è quello scelto per Spectra. Il corpo è una **mesh statica senza scheletro**: per muoverlo è nato il rig automatico (§7). Nessuno dei due file è nel repository finché l'autore non conferma licenza e fonte (§7.4).

**«Senziente».** Spectra *simula* in modo convincente:

- attenzione, emozioni, memoria, iniziativa;
- stanchezza e sonno;
- concentrazione proporzionale alla difficoltà.

Non è cosciente. Nessun sistema attuale lo è, e nella documentazione lo diciamo così.

## 2. Che cosa serve dal modello (verifica all'arrivo del file)

| Requisito | Perché | Se manca |
|---|---|---|
| **Licenza** che permetta la ridistribuzione modificata (CC BY, CC BY-SA, CC0 o licenza commerciale acquistata) | L'app è pubblica: il modello viaggia con lei | Non si pubblica; si usa solo in locale |
| **Formato GLB/glTF 2.0** | three.js lo carica nativamente; un solo file con texture | Conversione da FBX/OBJ con Blender (istruzioni al §6) |
| **Scheletro umanoide** (anche, colonna, collo, testa, spalle, braccia, mani, gambe) | Camminare, sedersi, indicare, respirare | Avatar a busto: testa e spalle animate, niente locomozione |
| **Blendshape del viso**: ideali i 52 ARKit (`jawOpen`, `mouthSmileLeft`, `eyeBlinkLeft`, `browInnerUp`…) o i visemi Oculus (`viseme_aa`, `viseme_O`…) | Labiale al fonema, micro-espressioni di qualità cinematografica | Si usano le ossa (mandibola, occhi) e, se non ci sono, le deformazioni procedurali già usate per «Noir» (campi espressivi fusi sulla CPU) |
| **Occhi separati** (mesh o ossa) | Sguardo e saccadi credibili | Sguardo con la sola testa |
| **Capelli come mesh o materiale distinto** | Ricolorarli in nero | Ricolorazione per texture (maschera di colore), meno pulita |
| **Poligoni ≤ ~100 000, texture ≤ 2K** | Fluidità su telefono | Riduzione con `gltf-transform` (come già fatto per «Noir»: da 18 a 8 MB) |

## 3. Il piano di modifica

### 3.1 Capelli neri (jet black)
Il driver (`bsi-spectra-corpo.js`) cerca le mesh e i materiali con nome `hair`, `capell`, `hairstyle`, `bangs`, `fringe`. Su quelle mesh:
- **colore base** `#0a0a0c`, nero con un filo di blu;
- **rugosità** 0,45–0,55;
- **riflessi speculari** grazie alla mappa d'ambiente, che dà il lucido dei capelli neri veri;
- **mappa dei colori originale**: se il modello ha capelli rossi dipinti nella texture, la si **desatura e scurisce nel shader**, cioè si moltiplica la luminanza per 0,08 conservando le variazioni locali che fanno le ciocche.

Il rosso non resta da nessuna parte. Il **banco** controlla che la luminanza media dei pixel dei capelli sia sotto 0,06 e la saturazione sotto 0,1.

### 3.2 Viso: senzienza facciale
Il motore del comportamento esiste già (v238) e lavora su **campi espressivi** astratti: sorriso, sopracciglia, labbra strette, palpebre, sguardo, molle muscolari, micro-espressioni, concentrazione, sonno. Con un modello dotato di blendshape la stessa logica pilota i blendshape veri, con una tabella di corrispondenza:

| Campo / emozione | Blendshape ARKit |
|---|---|
| sorriso | `mouthSmileLeft/Right`, `cheekSquintLeft/Right` |
| sopracciglia su | `browInnerUp`, `browOuterUpLeft/Right` |
| accigliato | `browDownLeft/Right` |
| tristezza | `mouthFrownLeft/Right`, `browInnerUp` |
| labbra strette | `mouthPressLeft/Right` |
| naso arricciato | `noseSneerLeft/Right` |
| palpebre (battito, sonno, gioia) | `eyeBlinkLeft/Right`, `eyeSquintLeft/Right` |
| spalancati (sorpresa) | `eyeWideLeft/Right` |
| visemi (labiale) | `jawOpen`, `mouthFunnel`, `mouthPucker`, `mouthStretchLeft/Right`, `mouthClose` |

### 3.3 Corpo: postura, gesti, spazio
Scheletro riconosciuto per nome. Sono supportate le convenzioni Mixamo (`mixamorig:Hips`…), Ready Player Me, VRM, Unreal e i nomi generici. Su quello scheletro:

- **respiro**: torace e spalle, frequenza legata a stato ed emozione;
- **peso**: lo spostamento lento delle anche;
- **sguardo**: occhi e testa che seguono l'utente, l'oggetto di cui si parla o il pensiero;
- **gesti contestuali**: indicare un oggetto della lezione, mani aperte quando spiega, mano al mento quando pensa, braccia conserte quando aspetta, pugno chiuso quando conclude una dimostrazione;
- **locomozione**: camminare verso un punto, con le animazioni del file se ci sono, altrimenti un ciclo di passo procedurale;
- **sedersi e alzarsi**: con le clip del file se ci sono, altrimenti una postura procedurale.

### 3.4 Voce
Profonda, robotica, maschile, calda ma metallica, con riverbero cyberpunk controllato. La sintesi del browser non permette di elaborare l'audio, quindi la voce di qualità passa da un servizio che restituisce **audio vero**: `gpt-4o-mini-tts`, se l'utente ha una chiave OpenAI. Sull'audio lavora una catena Web Audio:

- **corpo basso**: una mensola sotto 140 Hz, +5 dB;
- **presenza**: un picco a 2,8 kHz;
- **metallo**: un modulatore ad anello a 55 Hz, miscelato al 12 %;
- **saturazione** leggera;
- **riverbero**: una stanza di 1,4 s generata dal codice, al 16 %;
- **compressore** in uscita.

Il **labiale** si sincronizza sull'audio reale: la posizione nel testo segue il tempo di riproduzione e l'apertura della bocca segue l'energia. Senza chiave resta la voce del sistema, la più grave disponibile, senza effetti.

## 4. Che cosa c'è nel primo prototipo (v239)

- **`bsi-spectra-corpo.js`**: il driver generico, provato su un **manichino riggato costruito nel codice**. Il manichino ha ossa con nomi Mixamo e blendshape con nomi ARKit, quindi il driver è verificato prima che arrivi il modello vero. Dalla v240 il manichino serve **solo al banco del driver**: non è più Spectra da nessuna parte (§8).
- **`bsi-spectra-voce.js`**: la voce con la catena di effetti e il labiale sull'audio.
- **`spectra-studio.html`**: lo studio immersivo. Un laboratorio 3D dove Spectra insegna con il metodo *predici → testa → dimostra → rivela*. Parte con tre lezioni complete: fisica, chimica, matematica.
- **`bsi-spectra-rig.js`**: il rig automatico per le figure senza scheletro (§7).
- **Modello di Spectra** (dalla v241, §9): il corpo «Bounty Hunter» **incorporato nell'app** come blocco impacchettato `models/spectra-corpo.bsi`, riggato in automatico, ricolorato in blu notte, con il cappuccio e il solo viso «Noir» (§7). C'è sempre, per tutti, senza caricarlo; nessun sostituto. Solo nello studio, in sviluppo, se il blocco manca si prova `models/spectra-corpo.glb` (fuori da git). Il pulsante «🧍 Corpo» (v239–v240) e il ripiego `models/spectra-cyberpunk.glb` sono stati tolti.

## 5. Che cosa manca e perché

- ~~Il corpo vero nell'app pubblicata~~ — risolto nella v241: il corpo è incorporato come blocco impacchettato (§9); il `.glb` resta fuori da git (§7.4).
- **WebGPU e React Three Fiber**: la scelta e il percorso sono motivati nel documento 2 (architettura).
- **Gesti di qualità «motion capture»**: richiedono clip registrate. Con il modello arrivano quelle che contiene; altre si possono prendere da Mixamo (gratuito, con account Adobe) e aggiungere al GLB.

## 6. Come darci il modello

1. Accedere a Sketchfab e aprire il modello.
2. Leggere la **licenza** nella pagina: se non permette la ridistribuzione, dircelo.
3. **Download 3D Model → glTF** (oppure GLB).
4. Caricare il file qui nella conversazione, come è stato fatto con «Noir».

In alternativa si possono aggiungere `sketchfab.com` e `skfb.ly` ai domini consentiti dell'ambiente: menu dell'ambiente nella barra del titolo → *Edit* → *Network access*.

All'arrivo del file, il lavoro è:

- **ottimizzazione**: lo script `ottimizza-glb`, già usato per «Noir»;
- **verifica dei requisiti** del §2, automatica con il driver;
- **capelli neri** e **tabella dei blendshape**;
- **banco visivo**: foto delle emozioni, del labiale, della camminata.

## 7. I modelli forniti e il rig automatico

### 7.1 Che cosa è arrivato
L'autore ha fornito i modelli direttamente nella conversazione: prima «I-HOMO 08», poi il corpo **«Bounty Hunter»**, scelto per Spectra. Il corpo è bello ma **immobile**: una mesh sola, statica, **senza scheletro** e senza blendshape. Il driver del corpo (§3.3) non ha ossa da riconoscere, quindi così com'è sarebbe una statua.

### 7.2 Il rig automatico (`bsi-spectra-rig.js`)
Invece di riggare il modello a mano in Blender, il rig si fa **nel browser**, al caricamento:

1. **Misura** la figura in piedi (posa a T o ad A, rivolta verso +z): altezza, asse del corpo, profondità del busto, centri delle gambe a varie altezze, mani (i vertici più esterni sopra le anche), spalle. I punti che non si possono misurare, come vertebre e collo, seguono le proporzioni del canone umano (anche al 41 % dell'altezza, collo all'81 %…).
2. **Costruisce uno scheletro con i nomi Mixamo** (`Hips`, `Spine`…, `LeftArm`, `LeftForeArm`, `LeftHand`, `LeftUpLeg`…): 20 ossa che pesano e 7 punte, 27 in tutto. Il driver lo riconosce da solo.
3. **Calcola i pesi della pelle**: per ogni vertice la distanza da ogni osso, con un cancello per regione (una coscia non muove l'altra), peso ∝ 1/d⁴, i quattro maggiori, poi tre passate di levigatura sui vicini perché gomiti, ginocchia e ascelle si pieghino morbidi. I pesi del braccio passano **tre filtri**: la normale (la pelle sta davanti all'osso), la **distanza geodetica dalla mano** (il braccio è un tubo: il fianco del busto, vicino in linea d'aria, è lontano camminando sulla pelle) e l'asse della testa (cappuccio e colletto non seguono mai il braccio). La mano non prende peso dal bacino. Così alzare un braccio non strappa il busto.

### 7.3 Il cappuccio, il viso, i colori
- **Cappuccio col solo viso.** Il cappuccio del modello si allarga quanto basta ad avvolgere il volto «Noir», in modo graduale dal colletto, diventa **rigido con l'osso della testa** e si apre davanti con un'**ellisse calcolata nello shader**, al pixel: il bordo è liscio e segue la testa in ogni movimento, e non si tolgono triangoli.
- **La visiera nera resta.** Sotto il cappuccio si vede la visiera nera lucida del modello, attorno al viso. Per un periodo è stata resa ombra opaca; l'autore ha chiesto di tornare alla visiera lucida. Il rig conserva l'opzione `visiera: false` (il casco reso ombra opaca) e l'opzione `testa` (scala della testa), ma lo studio non le usa.
- **Il volto «Noir».** Del modello «Noir» restano visibili solo maschera, occhi e dettagli (`Object_2`, `Object_3`, `Object_4`), avanzati di 6,5 cm e in scala 0,96, su un supporto allineato in modo che il mento poggi sul colletto. Il volto è **«solidale»**: i movimenti della testa li fa il corpo, il volto fa solo espressioni, occhi e bocca, e non fa il proprio respiro dentro il cappuccio. Misurata in 24 pose mentre Spectra cammina e gesticola, la posizione del viso rispetto alla testa non si sposta (0,0 mm; il banco pretende meno di 1 mm).
- **Blu notte.** La texture è ricolorata nei colori dell'app, come ha chiesto l'autore: ombre quasi nere `#03050c`, mezzitoni `#0d162e`–`#162448`, luci `#2a3c6c`, bianchi appena azzurri. I dettagli turchesi del modello diventano luce propria verde acqua `#00c9b7`. Il disegno della texture (cuciture, piastre, pieghe) resta tutto.

### 7.3-bis La definizione («4K»)
- **Renderer**: il rapporto di pixel dello studio arriva fino a 3 (era 2), per gli schermi ad alta densità e 4K.
- **Tassellazione di Phong** (Boubekeur e Alexa, 2008; opzione `suddividi`, un livello): ogni triangolo ne diventa quattro, sul corpo dell'autore da 13 592 a 54 368 triangoli, e il rig resta pronto in circa 0,5–1 s. I punti medi si calcolano su posizioni e normali saldate, così le cuciture restano chiuse; i pesi si calcolano sulla mesh già tassellata.
- **Mappa di rilievo** ricavata dalla luminanza della texture originale, appena sfocata (`bumpScale` 0,016): bordi delle piastre, cuciture, tessuto e pieghe dei guanti prendono la luce vera.
- **Filtraggio anisotropo** della texture al massimo della GPU.

Detto con onestà: la texture di partenza è 2048×2048 e **nessun dettaglio nuovo viene inventato**. «4K» si riferisce alla risoluzione di disegno, non alla texture.

### 7.4 Licenza: il `.glb` resta fuori da git, il corpo è incorporato impacchettato
**`models/spectra-corpo.glb` non è nel repository.** Il corpo viene da **CGTrader**, dove si scarica gratis. La licenza Royalty Free di CGTrader permette di usare un modello dentro un prodotto, **non di offrirlo come file a sé**. Il repository è pubblico e l'app pubblicata serve i suoi file a chiunque: pubblicare il `.glb` vorrebbe dire offrirlo come file (§2, prima riga). Il volto «Noir», invece, è di Sketchfab con licenza CC BY 4.0 ed è già attribuito in `models/CREDITS.md`. Il `.glb` resta escluso in `.gitignore`.

Dalla v241 il corpo è **incorporato** come blocco impacchettato `models/spectra-corpo.bsi` (§9), come giochi e app incorporano i modelli acquistati: il file pubblicato non è un `.glb` riutilizzabile, e solo il codice dell'app lo riapre. Detto con onestà: non è una protezione assoluta, perché nessun modello mostrato su uno schermo lo è. Le conseguenze:

- l'app pubblicata mostra **sempre** Spectra col corpo «Bounty Hunter», senza che l'utente carichi niente;
- i controlli di `test_spectra_studio` e di `test_spectra_figura` sul corpo riggato (viso sul colletto, sincronia viso–cappuccio, del volto solo maschera, occhi e dettagli visibili, volto solidale) girano sul **corpo vero**;
- il banco `test_spectra_rig` continua a provare il rig su un **umanoide sintetico** costruito nel codice, dove i casi difficili (la mano pendente accanto al fianco) sono messi apposta.

### 7.5 ~~Come caricare il corpo dal proprio dispositivo~~ (v239–v240, tolto nella v241)
Fino alla v240 ognuno caricava la propria copia con il pulsante «🧍 Corpo», e il file restava nell'IndexedDB del browser (`bsi-spectra-modelli`). L'autore non lo voleva («la sezione Corpo non la voglio»): nella v241 il pulsante, il campo file e la conservazione nell'IndexedDB sono stati tolti. All'avvio un vecchio corpo conservato lì, se c'è, si cancella per liberare spazio; «Cancella i miei dati → Progressi del resto dell'app» continua a cancellare quel database.

## 8. Spectra col corpo in ogni sezione dell'AI, e nient'altro (v240)

Le richieste dell'autore: «l'icona di Spectra solo col volto, e la versione di Spectra col corpo in ogni sezione dell'AI»; e, guardando la schermata della lezione nello studio, «questo è quello che voglio per Spectra e non altro». Le conseguenze:

- **L'icona è solo il volto.** Il pulsante flottante rotondo con il volto «Noir» resta l'unico modo di aprire Spectra Live; la pillola «Spectra» è nascosta.
- **Spectra col corpo nelle sezioni dell'AI.** In Spectra AI e nelle tre aree con l'assistente (Chimica, Fisica, Matematica), sotto il titolo, un riquadro mostra Spectra in piedi, intero, nello stile del laboratorio della lezione. Pensa quando il modello lavora (mano al mento), spiega con le mani e con il labiale di corpo e viso quando arriva la risposta, parla con Spectra Live e spiega lo svolgimento quando l'assistente locale risolve un esercizio. Il modulo è `bsi-spectra-figura.js` ([documento 2](02-Architettura.md) §2.2).
- **Nessun sostituto.** Il manichino non è più Spectra, né nelle sezioni né nello studio. Nella v240 senza il corpo dell'autore sul dispositivo compariva l'invito a caricarlo; dalla v241 il corpo è incorporato e c'è sempre (§9).
- **Un'AI che spiega tutto: «🧠 Spiega».** L'autore ha chiesto che l'AI non facesse lezioni ma «una spiegazione perfetta, completa e completamente esaustiva su tutto ciò che riguarda queste 3 materie… deve spiegare grafici in 3D e tutto, dai grafici degli spettri a chimica, fisica e matematica, a un livello avanzatissimo». Nella finestra di Spectra la scheda **«🧠 Spiega»** (`bsi-spectra-spiega.js`), la seconda dopo «💬 Chat», risponde a qualunque domanda delle tre materie a cinque livelli, dalla scuola superiore al PhD avanzato, con una struttura obbligatoria che va dalla sintesi alla derivazione completa, agli esempi calcolati, ai collegamenti e alla frontiera della ricerca. Con «📺 Includi lo schermo» la spiegazione riguarda ciò che è aperto: al modello vanno il testo della sezione e un'immagine dei grafici, degli spettri e delle scene 3D, e la risposta comincia con la lettura quantitativa di ciò che si vede (per uno spettro NMR, segnale per segnale). Spectra col corpo si sposta nella scheda e spiega. Detto con onestà: la spiegazione la scrive il modello configurato, e la sua qualità dipende da quel modello; senza modello la scheda non finge e mostra solo ciò che l'app sa da sola; il banco controlla che cosa si manda al modello e come si mostra la risposta (con risposte simulate), non il contenuto di una spiegazione vera.
- **Tutto mostrabile e spiegabile: il catalogo.** L'autore ha chiesto: «ogni sezione della chimica, della fisica e della matematica deve esserci, non deve mancare nulla in questo ologramma: deve esserci tutto spiegabile e mostrabile». Nella scheda «🧠 Spiega» il riquadro **«🗂️ Tutte le sezioni nell'ologramma»** elenca per gruppo tutte le sezioni dell'app (194 nella v240; 197 dalla v242: chimica 76, fisica 61, matematica 31, comuni 29), lette dalla barra e non scritte a mano, quindi una sezione nuova c'è da sola; con ricerca e filtro per materia, un tocco apre la sezione dietro la finestra, l'ologramma la mostra dal vivo e la spiegazione usa i suoi dati. **«🎞️ Mostrami tutto»** le fa scorrere nell'ologramma, una ogni 7 s. Una domanda che nomina un argomento («spiegami le titolazioni») apre da sola la sua sezione. Le sezioni senza grafici (testo, tabelle, comandi) si proiettano come una scheda, invece di lasciare i pianeti ([documento 2](02-Architettura.md) §2.3).

## 9. Il corpo sempre presente, incorporato (v241)

La richiesta dell'autore: «la sezione Corpo non la voglio: vorrei che fosse sempre presente e non dover sempre mettere il corpo di Spectra». Le conseguenze:

- **Il corpo è incorporato nell'app**: `models/spectra-corpo.bsi` (4,40 MB), prodotto da `tools/impacchetta-corpo.js` a partire dal `.glb`. Formato «BSIC»: 4 byte di firma · 1 byte di versione · 4 byte di lunghezza (little endian) · i byte del `.glb` mescolati con un flusso xorshift32 da un seme fisso. Il programma verifica che il blocco si riapra identico; in `bsi-spectra-figura.js` la funzione `apri` lo rimette in ordine.
- **Si carica da sé**: `Spectra.carica()` scarica il blocco, lo riapre e lo rigga come prima. Mentre arriva, «Spectra sta arrivando…»; senza rete al primo avvio, «Spectra non è arrivato: serve la rete la prima volta» con «↻ Riprova». Poi il service worker lo tiene in cache e Spectra compare anche senza rete.
- **Tolto**: il pulsante «🧍 Corpo» (nella testata dello studio e nella barra della figura), il campo file, l'invito a caricare il corpo, `Spectra.daFile` e la conservazione del corpo nell'IndexedDB. I pulsanti della figura sono «🎙️ Parla con me», «🧠 Spiega», «🎓 Studio».
- **Detto con onestà**: l'impacchettamento non è una protezione assoluta (chi legge il codice può rimettere in ordine i byte); è il modo in cui giochi e app incorporano i modelli acquistati, e il file pubblicato non è un `.glb` scaricabile e riutilizzabile. Il `.glb` originale resta fuori da git.

## 10. «⚡ Esplora con Spectra», l'ologramma interattivo e la console col corpo (v242)

La richiesta dell'autore, guardando la console Spectra Live: «Esce ancora così (il busto) e soprattutto non c'è la sezione richiesta per ogni materia come every-joule». Le conseguenze:

- **Nella console Spectra Live, Spectra col corpo.** Al posto del busto col solo volto, la console mostra la figura condivisa — Spectra in piedi con l'ologramma — fra la telemetria e il dialogo (sullo schermo grande a destra). Lo stato della console la guida: mentre ascolta è curioso, mentre elabora si porta la mano al mento, poi parla e gesticola. Chiusa la console, la figura torna nella sezione. Il banco ha trovato una ricorsione infinita (la console emetteva l'evento di stato e lo ascoltava a sua volta): l'evento della console porta ora una firma (`daLive`) e la console ignora i propri eventi ([documento 2](02-Architettura.md) §2.4).
- **Una sezione per materia nello stile di every-joule.** «⚡ Esplora la chimica con Spectra», «⚡ Esplora la fisica con Spectra», «⚡ Esplora la matematica con Spectra» (`bsi-spectra-esplora.js`), nella barra di ogni materia subito dopo l'area con l'assistente. Una pagina da scorrere: Spectra resta in scena in alto, l'ologramma segue il capitolo che si ha davanti e Spectra lo racconta. Dieci capitoli per materia, dalla scuola superiore al PhD avanzato · frontiera (chimica: dall'energia di ionizzazione all'errore di delocalizzazione della DFT; fisica: dalla caduta dei gravi alle onde gravitazionali di GW150914; matematica: dalla derivata come pendenza all'ipotesi di Riemann). Ogni capitolo riprende il metodo dello studio (§4 del documento 2): **prevedi** (quattro risposte, fra cui le idee sbagliate più comuni, e il perché di ciascuna), **prova** (in 19 capitoli un cursore che ricalcola la grandezza vera), poi **guardalo dal vivo** nella sezione dell'app, proiettata nell'ologramma, e **spiegamelo tutto** con «🧠 Spiega» al livello del capitolo.
- **L'ologramma interattivo, «⛶ Interagisci».** Poi l'autore ha chiesto di «selezionare l'ologramma e, una volta fatto, interagire»: negli spettri cambiarli con la traccia e i dati scritti, nei pianeti e nell'universo tutto ciò che li riguarda, in matematica e fisica l'ologramma che cambia in tempo reale, e tutto spiegato da Spectra a voce e per iscritto, passaggio per passaggio. Il pulsante «⛶ Interagisci» sull'ologramma apre una finestra a tutto schermo (`bsi-spectra-olointerattivo.js`) con Spectra col corpo accanto all'ologramma grande e al pannello dei passaggi: 🧪 spettri (IR, ¹H-NMR con il campo da 60 a 600 MHz, ¹³C-NMR, massa, UV-Vis; sei molecole o la traccia scritta), 🪐 universo (gli otto pianeti in 3D, Keplero e vis-viva), 📐 matematica e ⚛️ fisica (risolte dall'assistente dell'app, con il grafico che segue). «🔊 Spectra spiega i passaggi» li legge uno per uno ([documento 2](02-Architettura.md) §2.6).
- **Detto con onestà**: i numeri dei cursori sono calcolati e il banco `test_spectra_esplora` li confronta con le formule (22 controlli); i testi dei capitoli sono scritti a mano e la loro qualità didattica va giudicata leggendo; la spiegazione completa la scrive il modello configurato. Nell'ologramma interattivo i passaggi sono calcolati dall'app (`test_spectra_olo`, 52 controlli), ma gli spettri delle sei molecole sono valori tipici di letteratura per la didattica, non spettri misurati, e dalla traccia scritta si ottengono attribuzioni candidate prese dalle tabelle, non la struttura della molecola.
