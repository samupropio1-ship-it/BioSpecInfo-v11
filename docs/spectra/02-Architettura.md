# Spectra incarnato — 2. Architettura tecnica

*BioSpecInfo · documento di progetto · v239 · © Samuele Pio Provenzano*

## 1. La decisione sullo stack

**Richiesta:** Three.js + React Three Fiber + WebGPU.
**Decisione per v239:** three.js (r128, già nell'app, locale) in JavaScript senza build. React Three Fiber e WebGPU stanno nel percorso di migrazione, al §6.

Il team ha discusso la scelta così.

- **L'app è una PWA che funziona offline**, con circa 200 moduli in JavaScript puro, senza build, e un service worker che li mette in cache uno per uno. Introdurre React + R3F vuol dire un bundler, un secondo modello di stato e circa 150 KB in più. Vorrebbe anche dire riscrivere l'integrazione con la console di Spectra, con la mente e con gli 82 banchi. Oggi il costo non compra nulla che l'utente veda.
- **WebGPU** in three.js richiede la serie r16x con `WebGPURenderer` e TSL al posto di `onBeforeCompile`. È disponibile in Chrome ed Edge, parziale in Safari e Firefox. La migrazione da r128 tocca ogni modulo 3D: almeno 60 scene e tutti gli shader modificati.
- **Quello che serve davvero adesso** non dipende dallo stack: scheletro e blendshape, labiale sull'audio, gesti, voce, lezioni. Tutto questo funziona in r128 su qualunque telefono, anche senza GPU moderna, con WebGL 1/2.

Il driver del corpo e lo studio sono scritti in modo da passare a r16x/WebGPU senza riprogettare. Le dipendenze da three.js stanno in un solo punto per modulo, e la logica (comportamento, emozioni, lezioni) è separata dal disegno.

## 2. I moduli

```
┌────────────────────────── spectra-studio.html ───────────────────────────┐
│  Scena 3D immersiva (laboratorio)          Pannello lezione (accessibile) │
│  ├─ ambiente: pavimento a griglia,          ├─ fase: predici/testa/       │
│  │  luci al neon, nebbia, oleogrammi        │   dimostra/rivela            │
│  ├─ Spectra (bsi-spectra-corpo.js)          ├─ testo, formule, scelte      │
│  └─ oggetti della lezione (per concetto)    └─ esercizi per livello        │
└──────────────┬───────────────────────────────────────────┬───────────────┘
               │                                           │
   ┌───────────▼────────────┐   ┌──────────────────────────▼───────────────┐
   │ bsi-spectra-corpo.js   │   │ bsi-spectra-studio-lezioni.js            │
   │ driver avatar generico │   │ i concetti: modello, simulazione,        │
   │ · scheletro, blendshape│   │ derivazione, connessioni, esercizi       │
   │ · emozioni → pesi      │   └──────────────────────────────────────────┘
   │ · visemi, sguardo,     │
   │   respiro, gesti,      │   ┌──────────────────────────────────────────┐
   │   passo, seduta        │   │ bsi-spectra-voce.js                      │
   │ · capelli neri         │◄──┤ TTS audio (OpenAI) → catena Web Audio    │
   └──▲────────┬────────────┘   │ (bassi, presenza, anello, riverbero)     │
      │        │                │ → energia e tempo per il labiale         │
      │        │                └──────────────────────────────────────────┘
      │        │                ┌──────────────────────────────────────────┐
      │        │                │ bsi-spectra-rig.js (v239)                │
      └────────┼────────────────┤ rig automatico per figure senza scheletro│
               │                │ · misura → scheletro Mixamo (27 ossa)    │
               │                │ · pesi: normale, geodetica, asse testa   │
               │                │ · cappuccio rigido, foro nello shader    │
               │                │ · ricolorazione blu notte, luce #00c9b7  │
               │                │ · tassellazione di Phong, rilievo        │
               │                └──────────────────────────────────────────┘
   ┌───────────▼────────────┐
   │ bsi-spectra-mente.js   │   ┌──────────────────────────────────────────┐
   │ memoria episodica,     │◄──┤ bsi-spectra-studio-memoria (nello studio)│
   │ umore, legame, creatore│   │ memoria semantica: padronanza per        │
   └───────────┬────────────┘   │ concetto, previsioni giuste/sbagliate,   │
               │                │ livello adattivo                         │
   ┌───────────▼────────────┐   └──────────────────────────────────────────┘
   │ bsi-ai-hub.js          │  il modello linguistico scelto dall'utente
   │ (Spectra che ragiona)  │  (con il quadro della mente e dello schermo)
   └────────────────────────┘
```

### 2.1 Il corpo nello studio

`spectra-studio.html` sceglie il corpo in quest'ordine:

0. **Il corpo caricato dal dispositivo** con il pulsante «🧍 Corpo» (campo file nascosto, `.glb`, al massimo 60 MB), conservato solo nell'IndexedDB del browser (database `bsi-spectra-modelli`, archivio `file`, chiave `corpo`). Viene trattato come il punto 1. Caricato dal pulsante, sostituisce sempre qualunque altro corpo e ricrea il volto «Noir» se un modello completo lo aveva tolto; un file che non è un umanoide utilizzabile è rifiutato con un messaggio.
1. **`models/spectra-corpo.glb`** (solo in sviluppo, escluso da git), il corpo «Bounty Hunter» fornito dall'autore: una mesh statica, senza scheletro. `BSISpectraRig.rigga()` la misura, le dà uno scheletro con i nomi Mixamo e i pesi della pelle, allarga il cappuccio e lo rende rigido con la testa, apre il foro del viso nello shader, tassella la mesh (Phong, `suddividi: 1`), aggiunge una mappa di rilievo dalla luminanza della texture e ricolora in blu notte. Sotto il cappuccio resta la visiera nera lucida del modello, come ha chiesto l'autore (l'opzione `visiera: false`, che la rende ombra opaca, esiste ma lo studio non la usa; neanche l'opzione `testa`, scala della testa). Del volto «Noir» (`bsi-spectra-androide.js`) restano visibili solo maschera, occhi e dettagli, avanzati di 6,5 cm e in scala 0,96, su un supporto allineato al colletto; il volto è **«solidale»**: la testa la muove il corpo, e il volto fa solo espressioni, occhi e bocca, senza il proprio respiro dentro il cappuccio. Il renderer dello studio arriva a un rapporto di pixel 3 (schermi ad alta densità e 4K).
2. Se manca, **`models/spectra-cyberpunk.glb`**, un avatar già riggato.
3. Se manca anche questo, il **manichino riggato** di `BSISpectraCorpo.manichino()` con il volto «Noir» incarnato.

**Nessuno dei due file `.glb` è nel repository.** Il corpo viene da CGTrader: la licenza Royalty Free permette di usarlo in un prodotto solo se terzi non possono recuperarne il file, quindi non può stare nel repository pubblico né essere servito dall'app ([documento 1](01-Analisi-modello-e-piano.md) §7.4–7.5). L'app pubblicata mostra il manichino finché l'utente non carica la propria copia dal pulsante; nulla viene ridistribuito. Sul telefono in verticale la telecamera si centra fra Spectra e il banco e arretra (bersaglio x = −0,12, distanza almeno 4,4).

## 3. Lo stato

| Dove | Che cosa | Persistenza |
|---|---|---|
| `bsi-spectra-mente-v1` | episodi (domande), tempi di studio, umore, legame | localStorage |
| `bsi-spectra-studio-v1` | per ogni concetto: previsioni (giuste/sbagliate), fasi completate, livello raggiunto negli esercizi | localStorage |
| `bsi-spectra-creatore-v1` | riconoscimento dell'autore | localStorage |
| `bsi-spectra-modelli` (archivio `file`, chiave `corpo`) | il corpo `.glb` caricato dal dispositivo con «🧍 Corpo» | IndexedDB, solo su quel dispositivo; cancellato con «Cancella dati → Progressi del resto dell'app» |
| driver del corpo | pose, pesi dei blendshape, molle | memoria (per fotogramma) |

**Memoria episodica** = che cosa è successo: le domande, le previsioni sbagliate, quando.
**Memoria semantica** = che cosa l'utente sa: padronanza per concetto, da 0 a 1. Sale con le previsioni giuste e con gli esercizi risolti, scende con il tempo (ripasso), e decide il livello della prossima spiegazione.
**Auto-miglioramento del percorso**: un concetto dove la previsione è stata sbagliata viene riproposto in un'altra forma (analogia diversa, oggetto 3D diverso) e collegato a quelli già padroneggiati.

## 4. Il ciclo di una lezione: predici → testa → dimostra → rivela

1. **Predici.** Spectra mette in scena il fenomeno, fermo, e chiede che cosa succederà. Le scelte sono le idee sbagliate più comuni della letteratura didattica, più quella giusta. Viso: curioso, sopracciglio alzato.
2. **Testa.** La simulazione gira davanti all'utente: modello fisico vero, integrato o calcolato, e numeri misurati in scena. Viso: concentrato, sguardo sull'oggetto, gesto di indicazione.
3. **Dimostra.** La derivazione rigorosa, passo per passo, con le formule. Ogni passaggio illumina la parte della scena a cui si riferisce. Viso: determinato.
4. **Rivela.** Perché la previsione giusta è giusta e quella sbagliata è sbagliata. Poi i collegamenti fra discipline e gli esercizi su quattro livelli: scuola superiore, triennale, magistrale, ricerca. Viso: stupore se la previsione era sbagliata (con empatia), fierezza se era giusta.

## 5. Accessibilità e ripieghi

- Ogni lezione esiste anche **solo testo**: il pannello contiene tutto, la scena 3D è un di più. Ha nome per i lettori di schermo e si naviga con la tastiera.
- **Senza WebGL**: lo studio mostra solo il pannello: la lezione intera, con le misure calcolate senza scena.
- **Senza chiave per la voce**: sintesi del browser. Senza sintesi: solo testo.
- **«Riduci movimento»**: niente camminate né oscillazioni; i passaggi sono a scatti brevi.

## 6. Percorso di migrazione (quando conviene)

1. three.js r128 → r16x: GLTFLoader, PMREM, colori (`outputColorSpace`) e materiali con `onBeforeCompile` → TSL.
2. `WebGPURenderer` con ripiego automatico a WebGL2.
3. Lo studio, che è una pagina a sé, è il primo candidato per R3F. Si fa se e quando il numero di oggetti interattivi lo giustifica.

## 7. Qualità e prove

| Banco | Che cosa controlla |
|---|---|
| `test_spectra_studio` (parte «corpo») | driver sul manichino: riconoscimento di ossa e blendshape; emozioni → pesi; labiale; battito; gesto di indicazione verso un punto; passo che sposta il corpo; capelli neri (luminanza e saturazione) |
| `test_spectra_studio` (parte «lezioni») | le tre lezioni: quattro fasi; le simulazioni danno i numeri attesi (tempo di caduta indipendente da v₀; angolo HOH ≈ 104,5° dal modello a repulsione; somme parziali → π²/6); memoria delle previsioni; versione solo testo; 390 e 1280 px; nessun errore |
| `test_spectra_studio` (parte «corpo riggato») | solo con `models/spectra-corpo.glb` in locale, a 1280 e 390 px: sincronia viso–cappuccio in 24 pose mentre Spectra cammina e gesticola (soglia 1 mm; misurati 0,0 mm); del volto «Noir» si vedono solo maschera, occhi e dettagli; volto «solidale»; mento sul colletto (osso del collo + 4,5 cm). Senza il file si saltano |
| `test_spectra_studio` (parte «corpo dal dispositivo») | a 1280 e 390 px: il pulsante «🧍 Corpo» c'è e accetta i `.glb`; il corpo fa andata e ritorno nell'IndexedDB; un file che non è un modello viene rifiutato senza errori |
| `test_spectra_rig` (30 controlli) | il rig automatico su un umanoide sintetico in posa ad A costruito nel codice: nomi Mixamo e riconoscimento da parte del driver, locomozione; pesi con somma 1, la mano alla mano e all'avambraccio, il fianco accanto alla mano pendente senza peso del braccio, gambe che non si incrociano; gesto «spiega» che muove la mano e non il fianco; camminata; triangoli della testa tolti o conservati; cappuccio col solo viso (nessun triangolo tolto, ellisse nello shader, doppia faccia, cappuccio rigido con la testa; l'opzione `visiera: false` rende il casco ombra opaca); blu notte e luce verde acqua; la definizione (tassellazione ×4, pesi normalizzati sui vertici nuovi, pelle chiusa); nessun errore |
| `test_spectra_studio` (parte «voce») | catena costruita su un buffer sintetico in un contesto audio offline: il filtro dei bassi alza davvero lo spettro sotto 140 Hz; il riverbero allunga la coda |
