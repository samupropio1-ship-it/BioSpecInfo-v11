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

- **`bsi-spectra-corpo.js`**: il driver generico, provato su un **manichino riggato costruito nel codice**. Il manichino ha ossa con nomi Mixamo e blendshape con nomi ARKit, quindi il driver è verificato prima che arrivi il modello vero.
- **`bsi-spectra-voce.js`**: la voce con la catena di effetti e il labiale sull'audio.
- **`spectra-studio.html`**: lo studio immersivo. Un laboratorio 3D dove Spectra insegna con il metodo *predici → testa → dimostra → rivela*. Parte con tre lezioni complete: fisica, chimica, matematica.
- **`bsi-spectra-rig.js`**: il rig automatico per le figure senza scheletro (§7).
- **Modello di Spectra nello studio**, in quest'ordine:
  1. `models/spectra-corpo.glb`, il corpo «Bounty Hunter»: riggato in automatico, ricolorato in blu notte, con il cappuccio e il solo viso «Noir» (§7);
  2. se manca, `models/spectra-cyberpunk.glb`, caricato al posto del manichino (il driver ne riconosce ossa, blendshape e capelli e li rende neri);
  3. se manca anche questo, il manichino riggato con il volto «Noir» incarnato.

  Nel repository non c'è nessuno dei due file: **l'app pubblicata mostra il manichino**.

## 5. Che cosa manca e perché

- **Il corpo vero nell'app pubblicata**: il file c'è, ma resta fuori da git finché la licenza non è confermata (§7.4).
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

### 7.4 Licenza: il file resta fuori da git
**`models/spectra-corpo.glb` non è nel repository.** Il corpo viene da **CGTrader**; il tipo di licenza non è ancora stato indicato dall'autore. Le licenze royalty-free di CGTrader, in generale, non permettono di ridistribuire il file del modello così com'è, e senza una conferma il modello non si ridistribuisce (§2, prima riga). Il volto «Noir», invece, è di Sketchfab con licenza CC BY 4.0 ed è già attribuito in `models/CREDITS.md`. I due file sono esclusi in `.gitignore`. Lo stesso vale per `models/spectra-cyberpunk.glb`. Le conseguenze, dette chiaramente:

- **l'app pubblicata mostra il manichino riggato**, non il corpo «Bounty Hunter»;
- il banco `test_spectra_rig` prova il rig su un **umanoide sintetico** costruito nel codice, non sul modello vero;
- i controlli di `test_spectra_studio` sul corpo riggato (sincronia viso–cappuccio, del volto solo maschera, occhi e dettagli visibili, volto solidale) girano solo dove il file è presente in locale, e altrove si saltano.

Confermata la licenza, basta aggiungere il file a `models/` e la sua riga in `models/CREDITS.md`: lo studio lo carica senza altre modifiche.
