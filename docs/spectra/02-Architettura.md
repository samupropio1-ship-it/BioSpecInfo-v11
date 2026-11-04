# Spectra incarnato — 2. Architettura tecnica

*BioSpecInfo · documento di progetto · v239 · © Samuele Pio Provenzano*

## 1. La decisione sullo stack

**Richiesta:** Three.js + React Three Fiber + WebGPU.
**Decisione per v239:** three.js (r128, già nell'app, locale) in JavaScript senza build. React Three Fiber e WebGPU stanno nel percorso di migrazione, al §6.

Il team ha discusso la scelta così.

- **L'app è una PWA che funziona offline**, con circa 200 moduli in JavaScript puro, senza build, e un service worker che li mette in cache uno per uno. Introdurre React + R3F vuol dire un bundler, un secondo modello di stato e circa 150 KB in più. Vorrebbe anche dire riscrivere l'integrazione con la console di Spectra, con la mente e con gli 83 banchi. Oggi il costo non compra nulla che l'utente veda.
- **WebGPU** in three.js richiede la serie r16x con `WebGPURenderer` e TSL al posto di `onBeforeCompile`. È disponibile in Chrome ed Edge, parziale in Safari e Firefox. La migrazione da r128 tocca ogni modulo 3D: almeno 60 scene e tutti gli shader modificati.
- **Quello che serve davvero adesso** non dipende dallo stack: scheletro e blendshape, labiale sull'audio, gesti, voce, lezioni. Tutto questo funziona in r128 su qualunque telefono, anche senza GPU moderna, con WebGL 1/2.

Il driver del corpo e lo studio sono scritti in modo da passare a r16x/WebGPU senza riprogettare. Le dipendenze da three.js stanno in un solo punto per modulo, e la logica (comportamento, emozioni, lezioni) è separata dal disegno.

## 2. I moduli

```
┌────────────────────────── spectra-studio.html ───────────────────────────┐
│  Scena 3D immersiva (laboratorio)          Pannello lezione (accessibile) │
│  ├─ ambiente: pavimento a griglia,          ├─ fase: predici/testa/       │
│  │  luci al neon, nebbia, oleogrammi        │   dimostra/rivela            │
│  ├─ Spectra (bsi-spectra-figura.js)         ├─ testo, formule, scelte      │
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

### 2.1 Il corpo di Spectra

Lo studio e le sezioni dell'AI usano lo stesso controllore, `BSISpectraFigura.Spectra()` in `bsi-spectra-figura.js` (§2.2), che sceglie il corpo in quest'ordine:

0. **Il corpo caricato dal dispositivo** con il pulsante «🧍 Corpo» (campo file nascosto, `.glb`, al massimo 60 MB), conservato solo nell'IndexedDB del browser (database `bsi-spectra-modelli`, archivio `file`, chiave `corpo`). Viene trattato come il punto 1. Caricato dal pulsante, sostituisce sempre qualunque altro corpo e ricrea il volto «Noir» se un modello completo lo aveva tolto; un file che non è un umanoide utilizzabile è rifiutato con un messaggio.
1. **`models/spectra-corpo.glb`** (solo in sviluppo, escluso da git), il corpo «Bounty Hunter» fornito dall'autore: una mesh statica, senza scheletro. `BSISpectraRig.rigga()` la misura, le dà uno scheletro con i nomi Mixamo e i pesi della pelle, allarga il cappuccio e lo rende rigido con la testa, apre il foro del viso nello shader, tassella la mesh (Phong, `suddividi: 1`), aggiunge una mappa di rilievo dalla luminanza della texture e ricolora in blu notte. Sotto il cappuccio resta la visiera nera lucida del modello, come ha chiesto l'autore (l'opzione `visiera: false`, che la rende ombra opaca, esiste ma lo studio non la usa; neanche l'opzione `testa`, scala della testa). Del volto «Noir» (`bsi-spectra-androide.js`) restano visibili solo maschera, occhi e dettagli, avanzati di 6,5 cm e in scala 0,96, su un supporto allineato al colletto; il volto è **«solidale»**: la testa la muove il corpo, e il volto fa solo espressioni, occhi e bocca, senza il proprio respiro dentro il cappuccio. Il renderer dello studio arriva a un rapporto di pixel 3 (schermi ad alta densità e 4K).
2. Se manca, **`models/spectra-cyberpunk.glb`**, un avatar già riggato.
3. Se manca anche questo, **nessun corpo**: lo studio e le sezioni mostrano l'invito «Spectra non è ancora su questo dispositivo — carica una volta il suo corpo (.glb)» con il pulsante, e nessun sostituto. Il manichino di `BSISpectraCorpo.manichino()` resta solo per il banco del driver (`opz.manichino === true`).

**Nessuno dei due file `.glb` è nel repository.** Il corpo viene da CGTrader: la licenza Royalty Free permette di usarlo in un prodotto solo se terzi non possono recuperarne il file, quindi non può stare nel repository pubblico né essere servito dall'app ([documento 1](01-Analisi-modello-e-piano.md) §7.4–7.5). L'app pubblicata mostra l'invito finché l'utente non carica la propria copia dal pulsante; nulla viene ridistribuito. Sul telefono in verticale la telecamera si centra fra Spectra e il banco e arretra (bersaglio x = −0,12, distanza almeno 4,4).

### 2.2 Spectra nelle sezioni dell'AI (`bsi-spectra-figura.js`, v240)

```
 eventi dell'app                        bsi-spectra-figura.js
 ───────────────                        ─────────────────────────────────────────
 bsi-spectra-stato   (bsi-ai-hub.js) ─► monta(contenitore): riquadro da laboratorio
   pensa/strumenti/scrive → concentrato    · pavimento a griglia, pannelli olografici,
 bsi-spectra-risposta (bsi-ai-hub.js) ─►     pedana, luci da studio
   spiega, labiale, emozione; errore →     · HUD «SPECTRA · IN ASCOLTO/PENSA/PARLA»
   dubbio                                  · «🧍 Corpo» «🎙️ Parla con me» «🎓 Studio»
 bsi-spectra-dice ───────────────────────►  Spectra(T, scena, renderer): il corpo
   (parla() di bsi-spectra-live.js,          (rig, viso «Noir» solidale, gesti)
    bsi-assistente.js)                    sezioni(['sai','sareachim','sareafis','sareamat'])
                                            · UNA figura, spostata nella sezione aperta
```

- **Una figura sola** (un contesto WebGL, anche su telefono), spostata nella sezione dell'AI aperta: dopo il titolo, il pulsante «Lezione guidata» e la descrizione, prima delle schede. Sul telefono i suoi pulsanti stanno a sinistra, in colonna, per non coprire i pulsanti flottanti.
- **Costo contenuto**: si disegna solo quando è visibile e la pagina è in primo piano; i file 3D si caricano la prima volta che si apre una sezione dell'AI; rapporto di pixel fino a 2,5.
- **Lo studio** usa lo stesso controllore (`S.spectra`; `S.corpo`, `S.volto`, `S.rig`, `S.allinea`… sono letture dal controllore; `S.usaScena` per i banchi); l'invito è `#invito`.
- **L'icona** di Spectra resta il volto in un cerchio; la pillola «Spectra» è nascosta.

- **L'ologramma** (`Ologramma`, `SCENE_OLO`, `sceneDi`), su richiesta dell'autore («alla mia destra di Spectra appaiano le immagini dei grafici e dei movimenti delle sezioni… deve essere mastodontica questa AI»): nella scena della figura, alla destra di Spectra (destra di chi guarda), uno schermo di vetro con i bordi luminosi, la base del proiettore e il fascio di luce. Spectra sta a sinistra del centro sulla pedana; l'inquadratura contiene Spectra intera e l'ologramma (2,55 m × 2,2 m). Sei scene **calcolate a ogni fotogramma**: pianeti (equazione di Keplero M = E − e sin E risolta con Newton, T ∝ a^1,5, più veloci al perielio), molecola (benzene con la nube π), spettro (IR a bande gaussiane a 3400, 2925, 1715, 1405, 1130 cm⁻¹, con un cursore), superficie (z = sin(r − t)/r), orbitale (3d_z² con le due fasi), onda (pacchetto gaussiano con la dispersione di Schrödinger libera: Re ψ, Im ψ, |ψ|²); più **«schermo»**, la sezione aperta dietro la finestra di Spectra, ridisegnata con `BSISpectraLive.cattura` e copiata nell'ologramma 5 volte al secondo. **Il soggetto segue la conversazione**: l'evento `bsi-spectra-tema` (da «🧠 Spiega», con la domanda) e il testo della risposta passano da `sceneDi`; con «Includi lo schermo» si mostra la sezione dal vivo; a riposo le scene si alternano ogni 14 s, dopo un argomento l'alternanza riprende dopo 60 s. Un'etichetta in alto a destra apre con un tocco la sezione della scena (Sistema solare 3D, Strutture 3D, IR Visivi, Funzioni di più variabili, Orbitali MO, Schrödinger) e chiude la finestra di Spectra se è aperta. Alla risposta Spectra **indica** prima l'ologramma (circa 2,5 s), poi accompagna con «spiega».
- **I pulsanti** della figura stanno in una barra sotto la scena, così non coprono Spectra né l'ologramma; sul telefono la barra lascia spazio a destra per i pulsanti flottanti.

### 2.3 «🧠 Spiega»: l'AI che spiega tutto (`bsi-spectra-spiega.js`, v240)

```
 finestra di Spectra (bsi-ai-hub.js)            bsi-spectra-spiega.js
 schede: 💬 Chat · 🧠 Spiega · Esame Orale ·  ──► costruisci(pannello), chiedi(domanda, {schermo, livello})
         Ripassa Oggi · Genera Guida
                                                 sistema(livello, materia):
 sezione aperta dietro la finestra                 PROFONDITA (5 livelli) + struttura obbligatoria
   │  «📺 Includi lo schermo»                      in 9 parti + rigore (unità, assunzioni)
   ├─► schermo(): sezione, scheda, comandi       con un modello (window.bsiLLM):
   │   con valore e intervallo, tabelle,           testo + domanda (+ immagine al 1° turno)
   │   testo visibile, numero dei grafici          → bsiStreamChat, conversazione in memoria
   └─► immagine(): tele (scene BSILab3D          senza modello: lo dice, e mostra ciò che
       ridisegnate) + SVG → JPEG ≤ 1400 px          l'app sa (assistente, lezione guidata,
                                                     dati dello schermo)
            │
            └─► figura condivisa (bsi-spectra-figura.js) nella scheda: pensa → parla e gesticola
```

- La scheda «🧠 Spiega» è la **seconda** della finestra di Spectra; il riquadro di Spectra nelle sezioni ha un pulsante «🧠 Spiega» che la apre.
- **Cinque livelli**: Scuola superiore, Triennale, Magistrale, Dottorato (PhD), PhD avanzato · frontiera; il prompt dice per ognuno che cosa ci si aspetta (`PROFONDITA`) e «Non semplificare sotto questo livello e non tralasciare nulla di rilevante».
- **Struttura obbligatoria** (titoli `##`): in sintesi; che cosa stai guardando (solo con lo schermo: lettura quantitativa — spettri NMR segnale per segnale con δ, molteplicità, J, integrale e attribuzione; IR, MS, UV-Vis; scene 3D con geometria, simmetria, nodi, punti critici, isosuperfici; grafici matematici con dominio, asintoti, estremi, flessi, convergenza); fondamenti teorici; formalismo e derivazione completa; esempi numerici calcolati; casi limite, approssimazioni, errori comuni; collegamenti fra le tre materie; applicazioni e frontiera (letteratura solo se certa); tre domande di verifica con risposta.
- **Lo schermo**: testo sempre (se la casella è attiva), immagine ai modelli che accettano immagini, con la conversione per fornitore della chat, solo al primo turno. Domande rapide: «📈 Spiegami questo grafico», «🧪 Lo spettro, picco per picco», «🧊 La scena 3D», «∴ Dimostrazione completa», «🔭 Frontiera della ricerca».
- **Senza modello non si finge**: la scheda dice che per la spiegazione completa serve un modello e mostra il riconoscimento dell'assistente locale, i capitoli della lezione guidata della sezione (`bsi-lezione.js`) e i dati dello schermo come testo.
- **La figura** ha la precedenza nella scheda rispetto alle sezioni dell'AI.
- **Niente memoria persistente**: la conversazione resta in memoria per la sessione; «↺ Nuova spiegazione» la azzera.

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
| `test_spectra_studio` (parte «corpo riggato») | sempre, a 1280 e 390 px: senza corpo l'invito e nessun sostituto; poi il banco carica un umanoide sintetico con `S.usaScena` e l'invito sparisce; sincronia viso–cappuccio in 24 pose mentre Spectra cammina e gesticola (soglia 1 mm; misurati 0,0 mm); del volto «Noir» si vedono solo maschera, occhi e dettagli; volto «solidale»; mento sul colletto (osso del collo + 4,5 cm) |
| `test_spectra_studio` (parte «corpo dal dispositivo») | a 1280 e 390 px: il pulsante «🧍 Corpo» c'è e accetta i `.glb`; il corpo fa andata e ritorno nell'IndexedDB; un file che non è un modello viene rifiutato senza errori |
| `test_spectra_figura` (89 controlli) | a 412 e 1280 px: icona solo volto; nelle quattro sezioni dell'AI la figura dentro la sezione sotto il titolo, una sola in tutta l'app; niente spazio vuoto sopra le sezioni fuori da `#main`; senza corpo l'invito e nessun sostituto; con l'umanoide sintetico viso sul colletto e solo il viso; pensa, spiega col labiale, dubbio sull'errore, parla con Spectra Live, spiega lo svolgimento dell'assistente; pulsanti che non coprono quelli flottanti; l'ologramma (alla destra di Spectra, sei scene vive, Keplero con il rapporto delle velocità (1+e)/(1−e) entro l'8 %, soggetto che segue la conversazione, etichetta e tocco che aprono la sezione, la scena 3D dietro «🧠 Spiega» dal vivo, Spectra che indica e poi spiega); «🧠 Spiega» (seconda scheda, figura nella scheda, lettura dello schermo con uno spettro aperto e con una scena 3D, immagine al modello, cinque livelli fino al PhD avanzato, richiesta esaustiva con la struttura obbligatoria, domanda successiva senza rimandare l'immagine, senza modello non finge; risposte del modello simulate); nessun errore |
| `test_spectra_rig` (30 controlli) | il rig automatico su un umanoide sintetico in posa ad A costruito nel codice: nomi Mixamo e riconoscimento da parte del driver, locomozione; pesi con somma 1, la mano alla mano e all'avambraccio, il fianco accanto alla mano pendente senza peso del braccio, gambe che non si incrociano; gesto «spiega» che muove la mano e non il fianco; camminata; triangoli della testa tolti o conservati; cappuccio col solo viso (nessun triangolo tolto, ellisse nello shader, doppia faccia, cappuccio rigido con la testa; l'opzione `visiera: false` rende il casco ombra opaca); blu notte e luce verde acqua; la definizione (tassellazione ×4, pesi normalizzati sui vertici nuovi, pelle chiusa); nessun errore |
| `test_spectra_studio` (parte «voce») | catena costruita su un buffer sintetico in un contesto audio offline: il filtro dei bassi alza davvero lo spettro sotto 140 Hz; il riverbero allunga la coda |
