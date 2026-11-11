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

Lo studio e le sezioni dell'AI usano lo stesso controllore, `BSISpectraFigura.Spectra()` in `bsi-spectra-figura.js` (§2.2). **Dalla v241 il corpo è sempre presente, incorporato nell'app** (richiesta dell'autore: «la sezione Corpo non la voglio: vorrei che fosse sempre presente»):

1. **`models/spectra-corpo.bsi`** (4,40 MB), il corpo «Bounty Hunter» (gratuito su CGTrader, licenza Royalty Free) impacchettato da `tools/impacchetta-corpo.js`: firma «BSIC» (4 byte) · versione (1 byte) · lunghezza (4 byte, little endian) · i byte del `.glb` mescolati con un flusso xorshift32 da un seme fisso. `Spectra.carica()` lo scarica, la funzione `apri` lo rimette in ordine e `daBuffer` lo passa al rig. È una mesh statica, senza scheletro. `BSISpectraRig.rigga()` la misura, le dà uno scheletro con i nomi Mixamo e i pesi della pelle, allarga il cappuccio e lo rende rigido con la testa, apre il foro del viso nello shader, tassella la mesh (Phong, `suddividi: 1`), aggiunge una mappa di rilievo dalla luminanza della texture e ricolora in blu notte. Sotto il cappuccio resta la visiera nera lucida del modello, come ha chiesto l'autore (l'opzione `visiera: false`, che la rende ombra opaca, esiste ma lo studio non la usa; neanche l'opzione `testa`, scala della testa). Del volto «Noir» (`bsi-spectra-androide.js`) restano visibili solo maschera, occhi e dettagli, avanzati di 6,5 cm e in scala 0,96, su un supporto allineato al colletto; il volto è **«solidale»**: la testa la muove il corpo, e il volto fa solo espressioni, occhi e bocca, senza il proprio respiro dentro il cappuccio. Il renderer dello studio arriva a un rapporto di pixel 3 (schermi ad alta densità e 4K).
2. Solo nello **studio, in sviluppo**, se il blocco manca: `models/spectra-corpo.glb` (escluso da git). Nell'app (`opz.soloDispositivo`, attivo per la figura di `monta`) nessun file di sviluppo si chiede, niente 404.
3. Mentre il blocco arriva, lo studio e la figura mostrano «Spectra sta arrivando…»; se non arriva (nessuna rete al primo avvio), «Spectra non è arrivato: serve la rete la prima volta» con «↻ Riprova». Dopo il primo caricamento il service worker (prima la rete) lo tiene in cache. Nessun sostituto: il manichino di `BSISpectraCorpo.manichino()` resta solo per il banco del driver (`opz.manichino === true`).

**Tolti nella v241**: il pulsante «🧍 Corpo», il campo file, l'invito a caricare il corpo, `Spectra.daFile`, la conservazione del corpo nell'IndexedDB (un vecchio corpo in `bsi-spectra-modelli` si cancella all'avvio) e il ripiego `models/spectra-cyberpunk.glb`.

**Il `.glb` non è nel repository; il blocco sì.** La licenza Royalty Free di CGTrader permette di usare il modello dentro un prodotto, non di offrirlo come file a sé ([documento 1](01-Analisi-modello-e-piano.md) §7.4 e §9): il file pubblicato è un blocco che solo il codice dell'app riapre, come fanno giochi e app con i modelli che incorporano. Non è una protezione assoluta (nessun modello mostrato su uno schermo lo è), ma non è un `.glb` scaricabile e riutilizzabile. Sul telefono in verticale la telecamera si centra fra Spectra e il banco e arretra (bersaglio x = −0,12, distanza almeno 4,4).

### 2.2 Spectra nelle sezioni dell'AI (`bsi-spectra-figura.js`, v240)

```
 eventi dell'app                        bsi-spectra-figura.js
 ───────────────                        ─────────────────────────────────────────
 bsi-spectra-stato   (bsi-ai-hub.js) ─► monta(contenitore): riquadro da laboratorio
   pensa/strumenti/scrive → concentrato    · pavimento a griglia, pannelli olografici,
 bsi-spectra-risposta (bsi-ai-hub.js) ─►     pedana, luci da studio
   spiega, labiale, emozione; errore →     · HUD «SPECTRA · IN ASCOLTO/PENSA/PARLA»
   dubbio                                  · «🎙️ Parla con me» «🧠 Spiega» «🎓 Studio»
 bsi-spectra-dice ───────────────────────►  Spectra(T, scena, renderer): il corpo
   (parla() di bsi-spectra-live.js,          (rig, viso «Noir» solidale, gesti)
    bsi-assistente.js)                    sezioni(['sai','sareachim','sareafis','sareamat'])
                                            · UNA figura, spostata nella sezione aperta
```

- **Una figura sola** (un contesto WebGL, anche su telefono), spostata nella sezione dell'AI aperta: dopo il titolo, il pulsante «Lezione guidata» e la descrizione, prima delle schede. Sul telefono i suoi pulsanti stanno a sinistra, in colonna, per non coprire i pulsanti flottanti.
- **Costo contenuto**: si disegna solo quando è visibile e la pagina è in primo piano; i file 3D si caricano la prima volta che si apre una sezione dell'AI; rapporto di pixel fino a 2,5.
- **Lo studio** usa lo stesso controllore (`S.spectra`; `S.corpo`, `S.volto`, `S.rig`, `S.allinea`… sono letture dal controllore; `S.usaScena` per i banchi); l'avviso «Spectra sta arrivando…» è `#invito`.
- **L'icona** di Spectra resta il volto in un cerchio; la pillola «Spectra» è nascosta.

- **L'ologramma** (`Ologramma`, `SCENE_OLO`, `sceneDi`), su richiesta dell'autore («alla mia destra di Spectra appaiano le immagini dei grafici e dei movimenti delle sezioni… deve essere mastodontica questa AI»): nella scena della figura, alla destra di Spectra (destra di chi guarda), uno schermo di vetro con i bordi luminosi, la base del proiettore e il fascio di luce. Spectra sta a sinistra del centro sulla pedana; l'inquadratura contiene Spectra intera e l'ologramma (2,55 m × 2,2 m). Sei scene **calcolate a ogni fotogramma**: pianeti (equazione di Keplero M = E − e sin E risolta con Newton, T ∝ a^1,5, più veloci al perielio), molecola (benzene con la nube π), spettro (IR a bande gaussiane a 3400, 2925, 1715, 1405, 1130 cm⁻¹, con un cursore), superficie (z = sin(r − t)/r), orbitale (3d_z² con le due fasi), onda (pacchetto gaussiano con la dispersione di Schrödinger libera: Re ψ, Im ψ, |ψ|²); più **«schermo»**, la sezione aperta dietro la finestra di Spectra, ridisegnata con `BSISpectraLive.cattura` e copiata nell'ologramma 5 volte al secondo; una sezione senza grafici (testo, tabelle, comandi) si proietta come una scheda disegnata (titolo, scheda, fino a 6 comandi con i valori, testo visibile), così ogni sezione è mostrabile. **Il soggetto segue la conversazione**: l'evento `bsi-spectra-tema` (da «🧠 Spiega», con la domanda) e il testo della risposta passano da `sceneDi`; con «Includi lo schermo» si mostra la sezione dal vivo; a riposo le scene si alternano ogni 14 s, dopo un argomento l'alternanza riprende dopo 60 s. Un'etichetta in alto a destra apre con un tocco la sezione della scena (Sistema solare 3D, Strutture 3D, IR Visivi, Funzioni di più variabili, Orbitali MO, Schrödinger) senza togliere la figura: apre la finestra di Spectra su «🧠 Spiega» e la sezione dietro (`BSISpiega.mostraSezione`), così Spectra resta davanti e la sezione si vede nell'ologramma; chiusa la finestra, se Spectra ha aperto altre sezioni (catalogo, «Mostrami tutto», domanda, etichetta), l'app torna alla sezione dell'AI di partenza (`sai`, `sareachim`, `sareafis`, `sareamat`) e il giro si ferma. Alla risposta Spectra **indica** prima l'ologramma (circa 2,5 s), poi accompagna con «spiega».
- **Il corpo nell'app** è solo quello incorporato (`opz.soloDispositivo`, attivo per la figura di `monta`): il file di sviluppo `models/spectra-corpo.glb` non si chiede, quindi nell'app pubblicata niente 404; lo studio lo prova ancora, in sviluppo.
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
- **Il catalogo** (richiesta dell'autore: «non deve mancare nulla in questo ologramma: deve esserci tutto spiegabile e mostrabile»): `catalogo()` legge ogni pulsante di sezione della barra (`.nav-group-panel [data-s]`) con l'etichetta del gruppo (Chimica, Spettroscopia, Biochimica, Farmacologia, Chimica Fisica, Studio, Utility, Fisica, Matematica, Astrofisica) e la materia (`BSIMaterie.materiaDi`): 201 sezioni dalla v242 (chimica 78, fisica 63, matematica 31, comuni 29), senza un elenco scritto a mano. Il riquadro «🗂️ Tutte le sezioni nell'ologramma» le mostra per gruppo, con ricerca e filtro per materia; `mostraSezione(id)` apre la sezione dietro la finestra (`BSISpectraLive.calcolo.apriSezione`, che cambia materia se serve), l'ologramma la mostra dal vivo e «Includi lo schermo» si spunta, se l'utente non l'ha tolta. `giro(materia)` («🎞️ Mostrami tutto») le mostra a turno ogni 7 s con il contatore «n/N · nome»; `giroFerma()` lo ferma.
- **La domanda che nomina un argomento** (`sezioneDi(testo)`): le parole significative dei nomi delle sezioni cercate nella domanda, anche per radice; le sigle (MS, IR, UV, NMR, MO…) pesano di più; sinonimi («spettro di massa» → MS, «infrarosso» → IR, «risonanza magnetica» → NMR, «orbitali molecolari» → MO); a parità vince il nome più corto. Senza lo schermo incluso, `chiedi()` apre la sezione nominata, la mostra nell'ologramma e spiega con il suo schermo; se però l'utente ha tolto la spunta (`ST.schermoNo`), la sezione si apre e si mostra ma al modello va solo la domanda, senza testo né immagine dello schermo (le domande rapide sullo schermo rimettono la spunta). Esempi verificati: titolazioni → `stitr`, Schrödinger → `sschrod`, integrali per parti → `smatcalc`, spettro di massa → `sms`, spettro infrarosso → `sirvis`, meccanica orbitale → `sastroorbite`, «ciao come stai» → nessuna.
- **La figura** ha la precedenza nella scheda rispetto alle sezioni dell'AI.
- **Niente memoria persistente**: la conversazione resta in memoria per la sessione; «↺ Nuova spiegazione» la azzera.

### 2.4 La console Spectra Live col corpo (v242)

```
 console Spectra Live (bsi-spectra-live.js)          bsi-spectra-figura.js
 aperta (#bsiJV.aperto)  ───────────────────────►  sezioni(): la console ha la precedenza
                                                     figura → #bsiJV-figura, #bsiJV.con-figura
                                                     (il busto #bsiJV-volto nascosto)
 stato(s): attesa/ascolta/pensa/parla
   └─► bsi-spectra-stato { stato, daLive: true } ─►  pensa → concentrato, mano al mento
       (la console ignora gli eventi con daLive)      ascolta → curioso, «TI ASCOLTA»
 chiusa  ───────────────────────────────────────►  la figura torna nella sezione
```

- La figura è la stessa, una sola (un contesto WebGL): quando la console è aperta ha la precedenza su tutto; sul telefono sta fra la telemetria e il dialogo, sullo schermo grande a destra (46 % della larghezza); i pulsanti della figura nella console sono nascosti.
- **La firma `daLive`**: la console ascolta `bsi-spectra-stato` per gli altri moduli (la chat che pensa, gli strumenti) e dalla v242 lo emette anche lei per la figura. Senza la firma l'evento della console tornava alla console, che lo riemetteva: una ricorsione infinita, trovata da `test_spectra_figura`.

### 2.5 «⚡ Esplora con Spectra» (`bsi-spectra-esplora.js`, v242)

```
 barra della materia → sesplchim / sesplfis / sesplmat   (BSIFisica.sezione, scheda «⚡ Esplora»)
        │
        ├─► figura condivisa nella sezione, classe bsiEX-palco: position sticky
        │   sotto la testata (--bsiEX-top misurata); sul telefono 220–280 px
        │
        └─► costruisci(materia): 10 capitoli (CAPITOLI, livelli 0→4)
              scorrimento ─► capitolo che attraversa il centro dello spazio libero
                             sotto la figura = «attivo» ─► bsi-spectra-dice (racconta)
                                                        └► olo.mostra(scena)
              🔮 Prevedi ─► rivelazione (perché di ogni risposta) ─► bsi-spectra-dice
                            (gioia / sorpresa), bsi-esplora-v1, barra n/10
              🧪 Prova   ─► calcola(id, v) (19 capitoli)
              📺 Dal vivo ─► bsiOpenAIHub('spiega') + BSISpiega.mostraSezione(sez)
                             → ologramma «schermo»; chiusa la finestra si torna qui
              🧠 Tutto   ─► BSISpiega.chiedi(…, { schermo, livello })
              🔊 Ascolta ─► BSISpectraLive.parla
```

- **Il metodo è quello dello studio** (§4): predici, testa, dimostra (qui «Spiegamelo tutto») e rivela; ma dentro l'app, una pagina per materia, con la sezione vera da guardare dal vivo invece di una scena costruita apposta.
- **Il capitolo attivo** non si sceglie con una soglia di visibilità (che per un capitolo più alto dello schermo non scatterebbe mai), ma con la linea a metà dello spazio libero fra il fondo della figura e il fondo della finestra.
- **I numeri** sono funzioni pure (`calcola`, `gibbsMax`), caricabili in node: il banco li confronta con le formule senza browser.

### 2.6 L'ologramma interattivo, «⛶ Interagisci» (`bsi-spectra-olointerattivo.js`, v242)

```
 ologramma della figura (bsi-spectra-figura.js) ── «⛶ Interagisci» ──► BSIOloInterattivo.apri(modo)
   modo dalla scena: pianeti→universo · spettro/molecola→spettri ·            │
   superficie/orbitale→matematica · onda→fisica · schermo→dalla sezione       ▼
                                             #bsi-olo-ov (a tutto schermo; _bsiSyncFabs nasconde i flottanti)
                                             ├─ #bsiOI-figura ◄── la figura condivisa (sezioni(): precedenza)
                                             ├─ tela: lo spettro, la scena 3D dei pianeti, il grafico
                                             └─ pannello dei passaggi
 🧪 spettri   SPETTRI (6 molecole) | leggiTraccia(tipo, testo) ─► spettro(tipo, chi, {MHz}) ─► curva + passaggi
 🪐 universo  PIANETI (scheda NASA) | «a=… e=…» ─► pianeta() ─► Keplero, vis-viva, g, fuga; orbite 3D
 📐 ⚛️        domanda ─► bsi-assistente.js + bsi-mat-cas.js ─► svolgimento = passaggi; risultato ─► grafico
 🔊           passaggi ─► BSISpectraLive.parla, uno per uno; scegli(i) li evidenzia
 🧠           «Approfondisci» ─► BSISpiega con i dati dell'ologramma
 chiudi()     ─► bsi-olo-interattivo {aperto:false}; la figura torna nella sezione
```

- **Calcolato, non generato**: nessun passaggio di questa finestra viene da un modello. Gli spettri delle molecole sono valori tipici di letteratura (per la didattica, non misurati); quelli scritti dall'utente sono interpretati con le tabelle (frequenze di gruppo, spostamenti chimici, perdite neutre) e la forma della banda conta: una banda stretta non diventa mai un O–H carbossilico. Sono attribuzioni candidate, non la determinazione di una struttura.
- **L'¹H-NMR al campo scelto**: le costanti di accoppiamento restano in Hz e si convertono in ppm dividendo per il campo, quindi a 60 MHz un multipletto è dieci volte più largo che a 600 MHz; un riquadro ingrandisce il multipletto scelto, così si vedono la struttura n+1 e J/ν₀.
- **I pianeti**: l'equazione di Keplero si risolve a ogni fotogramma come nell'ologramma piccolo; le distanze sono compresse come √a perché Mercurio e Nettuno stiano nella stessa scena.

## 3. Lo stato

| Dove | Che cosa | Persistenza |
|---|---|---|
| `bsi-spectra-mente-v1` | episodi (domande), tempi di studio, umore, legame | localStorage |
| `bsi-spectra-studio-v1` | per ogni concetto: previsioni (giuste/sbagliate), fasi completate, livello raggiunto negli esercizi | localStorage |
| `bsi-spectra-creatore-v1` | riconoscimento dell'autore | localStorage |
| `bsi-esplora-v1` | per ogni capitolo di «⚡ Esplora con Spectra»: l'ultima previsione (giusta/sbagliata) e quando | localStorage; cancellato con «Cancella dati → Memoria persistente» |
| `bsi-spectra-modelli` (archivio `file`, chiave `corpo`) | fino alla v240 il corpo `.glb` caricato con «🧍 Corpo»; dalla v241 non si scrive più (un vecchio corpo si cancella all'avvio) | IndexedDB; cancellato anche con «Cancella dati → Progressi del resto dell'app» |
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
| `test_spectra_studio` (parte «corpo riggato», 87 controlli in tutto) | a 1280 e 390 px, sul **corpo vero incorporato**: sincronia viso–cappuccio in 24 pose mentre Spectra cammina e gesticola (soglia 1 mm; misurati 0,0 mm); del volto «Noir» si vedono solo maschera, occhi e dettagli; volto «solidale»; mento sul colletto (osso del collo + 4,5 cm) |
| `test_spectra_studio` (parte «corpo incorporato») | a 1280 e 390 px: il corpo di Spectra c'è sempre, senza caricarlo, e l'avviso «sta arrivando» è sparito; nessun pulsante «🧍 Corpo» né scelta di file; il file pubblicato è un blocco impacchettato (BSIC), non un `.glb` riutilizzabile; un blocco che non è un modello viene rifiutato, senza errori |
| `test_spectra_figura` (111 controlli) | a 412 e 1280 px: icona solo volto; nella console Spectra Live la figura col corpo al posto del busto, lo stato della console → mano al mento, ritorno alla sezione alla chiusura; nelle quattro sezioni dell'AI la figura dentro la sezione sotto il titolo, una sola in tutta l'app; niente spazio vuoto sopra le sezioni fuori da `#main`; il corpo c'è sempre, senza caricarlo (incorporato, ossa 20/23); nessun pulsante «🧍 Corpo» né scelta di file; sul corpo vero viso sul colletto e solo il viso; pensa, spiega col labiale, dubbio sull'errore, parla con Spectra Live, spiega lo svolgimento dell'assistente; pulsanti che non coprono quelli flottanti; l'ologramma (alla destra di Spectra, sei scene vive, Keplero con il rapporto delle velocità (1+e)/(1−e) entro l'8 %, soggetto che segue la conversazione, etichetta e tocco che aprono la sezione dietro la finestra «🧠 Spiega» con Spectra davanti, ritorno alla sezione di Spectra alla chiusura, la scena 3D dietro «🧠 Spiega» dal vivo, Spectra che indica e poi spiega); «🧠 Spiega» (seconda scheda, figura nella scheda, lettura dello schermo con uno spettro aperto e con una scena 3D, immagine al modello, cinque livelli fino al PhD avanzato, richiesta esaustiva con la struttura obbligatoria, domanda successiva senza rimandare l'immagine, senza modello non finge; privacy: tolta la spunta, la sezione nominata si apre ma al modello va solo la domanda; risposte del modello simulate); il catalogo (201/201 sezioni della barra dalla v242, la domanda che nomina un argomento trova la sua sezione, le titolazioni aperte, mostrate e spiegate con i loro dati, la Tavola Periodica proiettata come scheda, «🎞️ Mostrami tutto»); nessun errore |
| `test_spectra_esplora` (75 controlli) | in node: dieci capitoli per materia, livelli 0→4 in ordine, previsioni ben formate, identificativi unici; 22 numeri dei cursori contro le formule (pH 6,978 di HCl 10⁻⁸ M, Marcus λ/4 a −2λ, pendolo 2,006 s, γ 31,63, Gibbs ≈ 1,179…). A 412 e 1280 px: le tre sezioni nella barra della loro materia; Spectra nella sezione, sticky, in vista dopo lo scorrimento; capitolo attivo e scena nell'ologramma; previsione con il perché di ogni risposta e Spectra che reagisce; memoria e barra 1/10; il cursore ricalcola; niente sborda; «Guardalo dal vivo» dietro la finestra di Spectra e ritorno alla sezione Esplora; nessun errore |
| `test_spectra_olo` (69 controlli) | in node: sei molecole con i cinque spettri, massa molare e insaturazione, il multipletto 2J/ν₀ e la sua larghezza da 60 a 600 MHz, le attribuzioni di una traccia IR (stretta/larga) e MS (M⁺, M − 15), Terra e Marte con Keplero, vis-viva, gravità e fuga, un'orbita scritta. A 412 e 1280 px: il pulsante apre la finestra in «spettri», la figura ci si sposta, i pulsanti flottanti spariscono; tipo e traccia ridisegnano e rifanno i passaggi; il picco toccato sceglie il suo passaggio e Spectra lo dice; Marte in 3D; f(x) = x³ − 3x con zeri e punti stazionari; proiettile e pendolo dall'assistente; la voce dice tutti i passaggi; «🧠 Approfondisci» apre Spiega; ritorno alla sezione; niente sborda; nessun errore |
| `test_spectra_rig` (30 controlli) | il rig automatico su un umanoide sintetico in posa ad A costruito nel codice: nomi Mixamo e riconoscimento da parte del driver, locomozione; pesi con somma 1, la mano alla mano e all'avambraccio, il fianco accanto alla mano pendente senza peso del braccio, gambe che non si incrociano; gesto «spiega» che muove la mano e non il fianco; camminata; triangoli della testa tolti o conservati; cappuccio col solo viso (nessun triangolo tolto, ellisse nello shader, doppia faccia, cappuccio rigido con la testa; l'opzione `visiera: false` rende il casco ombra opaca); blu notte e luce verde acqua; la definizione (tassellazione ×4, pesi normalizzati sui vertici nuovi, pelle chiusa); nessun errore |
| `test_spectra_studio` (parte «voce») | catena costruita su un buffer sintetico in un contesto audio offline: il filtro dei bassi alza davvero lo spettro sotto 140 Hz; il riverbero allunga la coda |
