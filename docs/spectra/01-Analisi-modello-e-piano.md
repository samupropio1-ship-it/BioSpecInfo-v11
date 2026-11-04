# Spectra incarnato — 1. Analisi del modello e piano di modifica

*BioSpecInfo · documento di progetto · v239 · © Samuele Pio Provenzano*

## 1. Il punto di partenza, detto con onestà

**Il modello richiesto** è «CHARACTER CYBERPUNK MEN BY Oscar Creativo» (Sketchfab, `https://skfb.ly/psvAD`). In questa sessione **non è stato possibile aprirlo**. La rete dell'ambiente cloud blocca `skfb.ly` e `sketchfab.com`, e Sketchfab consente di scaricare un modello solo dopo l'accesso con un account. Per questo il documento:

- **non descrive il modello**: non l'abbiamo visto, e inventarne topologia, rig o licenza sarebbe peggio che non dire niente;
- **fissa le condizioni** che il modello deve soddisfare e **cosa fa il sistema in ciascun caso**;
- **prepara tutto il resto** in modo che il modello, quando arriva, si colleghi senza riscrivere nulla. Il driver del corpo è generico: riconosce lo scheletro e le espressioni di qualunque GLB umanoide.

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
- **Modello di Spectra nello studio**: se esiste `models/spectra-cyberpunk.glb` è quello; altrimenti il manichino, con capelli neri procedurali, al posto del corpo.

## 5. Che cosa manca e perché

- **Il modello cyberpunk vero**: serve il file (vedi §6).
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
