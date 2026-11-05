# BioSpecInfo

**Piattaforma di chemioinformatica interattiva che esegue l'intera logica
scientifica nel browser: analisi molecolare, predizione spettrale, modellistica
2D/3D e un agente AI — senza alcun server, installabile e funzionante offline.**

[![Versione](https://img.shields.io/badge/versione-bsi--v242-0e655c)](CHANGELOG.md)
[![Verifica](https://img.shields.io/badge/banchi-85%20superati%2C%200%20falliti-2e7d32)](docs/evidence/RAPPORTO-VERIFICA.md)<!--ESITO-BATTERIA-->
[![Contrasto](https://img.shields.io/badge/contrasto%20WCAG%20AA-0%20difetti%20su%2091%20sezioni-2e7d32)](docs/09-Release-Conformance-Statement.md)
[![Licenza](https://img.shields.io/badge/licenza-proprietaria-b3372c)](LICENSE)

👉 **[Provala](https://samupropio1-ship-it.github.io/BioSpecInfo-v11/)** ·
📚 **[Documentazione completa](DOCUMENTATION.md)** ·
📖 **[Guida per chi studia](14-User-Manual.md)**

---

## Scaricare

| Che cosa | Dimensione | Link |
|---|---:|---|
| **Tutto** — applicazione, codice, documentazione, gli 85 banchi, i pacchetti di consegna e le strutture 3D di `models/` | ~124 MB | **[archivio completo](https://github.com/samupropio1-ship-it/BioSpecInfo-v11/archive/refs/heads/main.zip)** |
| Dossier per una valutazione aziendale — 67 documenti | 5,4 MB | [AZIENDA](https://github.com/samupropio1-ship-it/BioSpecInfo-v11/raw/main/consegna/BioSpecInfo-AZIENDA-bsi-v242.zip) |
| Fascicolo per la commissione di tesi — 33 documenti | 2,4 MB | [TESI](https://github.com/samupropio1-ship-it/BioSpecInfo-v11/raw/main/consegna/BioSpecInfo-TESI-bsi-v242.zip) |
| Tutti i documenti, note operative incluse — 94 | 7,3 MB | [COMPLETO](https://github.com/samupropio1-ship-it/BioSpecInfo-v11/raw/main/consegna/BioSpecInfo-COMPLETO-bsi-v242.zip) |

I tre pacchetti della versione in corso stanno sempre in
[`consegna/`](https://github.com/samupropio1-ship-it/BioSpecInfo-v11/tree/main/consegna); l'archivio completo è generato da GitHub sul
contenuto attuale di `main`, quindi non invecchia. Per usare l'applicazione non
serve scaricare niente: è una PWA, si apre dal link qui sopra e si installa dal
browser.

**Aggiornare l'app installata.** Una PWA installata tiene la sua versione finché
non si aggiorna: per questo un telefono può mostrare ancora una versione
precedente anche dopo la pubblicazione. Si aggiorna dal menu ✨ →
**«🔄 Aggiornamenti»**, che confronta la versione installata con quella
pubblicata e propone «Aggiorna ora».

---

## Che cos'è

Uno strumento di studio per chimica, fisica e matematica — con biochimica,
farmacologia, astrochimica e astrofisica — rivolto a studenti universitari.
**197 sezioni** fra calcolatori, visualizzatori, banche dati e quiz, più un
assistente AI che può interrogare l'applicazione stessa. La materia scelta
(chimica, fisica o matematica) decide la barra, il menu ✨, Spectra, Studio e
Utility: tre app in una.

La caratteristica che lo distingue è dove gira: **tutto nel browser**. Non c'è
backend, non c'è registrazione, non c'è raccolta di dati — non perché sia
promesso, ma perché non esiste un server che possa farlo.

| | |
|---|---|
| **Architettura** | Progressive Web App client-side, local-first, offline-first |
| **Backend** | Nessuno |
| **Registrazione** | Nessuna |
| **Funziona offline** | Sì, dopo la prima apertura |
| **Farmaci in banca dati** | 178, con struttura verificata |

---

## Cosa sa fare

| Area | Contenuto |
|---|---|
| **Spettroscopia** | IR, ¹H/¹³C NMR, MS, UV-Vis, Raman previsti dalla struttura; tabelle di riferimento; quiz di riconoscimento |
| **Chimica generale** | Tavola periodica interattiva, bilanciamento, VSEPR, orbitali molecolari, termodinamica, elettrochimica, pKa e tamponi |
| **Chimica organica** | Retrosintesi (98 esercizi), meccanismi animati con frecce elettroniche, 25 moduli avanzati |
| **Biochimica** | Amminoacidi, vie metaboliche animate, cinetica enzimatica, macromolecole 3D |
| **Farmacologia** | **263 farmaci** (36 con struttura verificata contro ChEMBL), atlante 3D dei bersagli, interazioni, farmacocinetica, casi clinici |
| **Astrochimica** | Molecole interstellari, esopianeti JWST, nebulose, spettri stellari, nucleosintesi |
| **Lettore spettri** | Si carica un file e viene letto: **JCAMP-DX** con compressione ASDF completa (DIF, DUP) o due colonne. Picchi per prominenza con rumore stimato dalla MAD; per ogni banda **tutte** le assegnazioni compatibili, non la prima; perdite neutre per gli spettri di massa |
| **Lingue** | **14 lingue** di interfaccia (compresi giapponese e arabo, con il verso di scrittura) e **25 linguaggi chimici** in uscita: SMILES, InChI, SMARTS, molfile V2000/V3000, XYZ, PDB, CML, JSON e sei impronte digitali |
| **Chemioinformatica** | Banco di lavoro completo: standardizzazione, 43 descrittori, impronte Morgan/MACCS, Tanimoto, raggruppamento di Butina, scheletri di Bemis–Murcko, PCA, QSAR con **divisione per scheletro**, **validazione incrociata raggruppata** e **modello nullo per rimescolamento**, salti di attività, allarmi PAINS e Brenk. I risultati escono in **CSV** e in un **rapporto di metodo** che porta il seme, così l'analisi si rifà |
| **Fisica e matematica** | Laboratori interattivi verificati contro valori noti o un secondo metodo, fra cui spin e qubit, meccanica statistica, nuclei, materiali, elettronica, equazioni alle derivate parziali, analisi complessa, catene di Markov, SVD, codici e curve ellittiche; 29 sezioni di chimica, fisica e matematica hanno anche una scheda 3D costruita sul loro modello e verificata |
| **Astrofisica** | Un gruppo di dodici sezioni, dieci in 3D: sistema solare alla data, meccanica orbitale, matematica celeste, vita delle stelle, buchi neri, onde gravitazionali, galassie, cosmologia, planetario, esopianeti |
| **Studio** | Ripetizione spaziata (SM-2), quiz, percorsi, note, File Manager personale; per fisica e matematica kit di studio (riassunti, quiz, flashcard, formulari, glossari), risorse web, bibliografia e citazioni; in ogni sezione una **lezione guidata con Spectra** che apre le schede, mostra i comandi al lavoro e chiude con una domanda di verifica |
| **Spectra** | Agente AI con 47 strumenti, dieci fornitori, ricaduta automatica sui guasti; console vocale **Spectra Live** con il volto 3D dell'androide, un navigatore di tutte le sezioni e un solo pulsante, il suo volto in un cerchio, presente in ogni schermata; **Spectra Studio**, un laboratorio 3D in cui Spectra, in piedi accanto a un banco olografico, insegna con il metodo *predici → testa → dimostra → rivela* ; in Spectra AI e nelle tre aree con l'assistente (Chimica, Fisica, Matematica) **Spectra col corpo**, in piedi in un riquadro da laboratorio, con alla sua destra un **ologramma** di scene vive calcolate (pianeti su orbite di Keplero, benzene, uno spettro IR, un'onda di Schrödinger, l'orbitale 3d_z², una superficie, o la sezione aperta dal vivo) che segue l'argomento e porta alla sezione con un tocco; pensa mentre il modello lavora, indica l'ologramma e spiega con le mani e il labiale quando risponde; la scheda **«🧠 Spiega»** della finestra di Spectra dà una spiegazione esaustiva di qualunque domanda di chimica, fisica o matematica, a cinque livelli dalla scuola superiore al PhD avanzato, e può leggere lo schermo — spettri picco per picco, grafici, scene 3D — mandandone testo e immagine al modello (serve un fornitore di IA configurato); **ogni sezione dell'app è mostrabile e spiegabile**: il catalogo «🗂️ Tutte le sezioni nell'ologramma» elenca tutte le 197 sezioni della barra (con ricerca e filtro per materia), un tocco la apre e la proietta nell'ologramma (anche quelle senza grafici, come scheda), «🎞️ Mostrami tutto» le fa scorrere una dopo l'altra, e una domanda che nomina un argomento apre da sola la sua sezione; con **«⛶ Interagisci»** l'ologramma si apre a tutto schermo e diventa interattivo: spettri IR, ¹H/¹³C-NMR, massa e UV-Vis di sei molecole di riferimento o dalla traccia che si scrive (ogni segnale attribuito, con il perché), gli otto pianeti in 3D con Keplero e la vis-viva, matematica e fisica risolte passo per passo dall'assistente dell'app con il grafico che segue, e Spectra che legge i passaggi a voce; nella **console Spectra Live** Spectra compare col corpo e l'ologramma al posto del busto, e segue lo stato della console (ascolta, pensa con la mano al mento, parla). Il corpo, quello scelto dall'autore (il «Bounty Hunter», gratuito su CGTrader, licenza Royalty Free), **c'è sempre, per tutti, senza caricarlo**: è incorporato nell'app come blocco impacchettato (`models/spectra-corpo.bsi`, prodotto da `tools/impacchetta-corpo.js`), non come file `.glb` riutilizzabile; la prima volta serve la rete, poi resta in cache (progetto in [`docs/spectra/`](https://github.com/samupropio1-ship-it/BioSpecInfo-v11/tree/main/docs/spectra)) |
| **⚡ Esplora con Spectra** | Una sezione per materia (chimica, fisica, matematica), nella barra subito dopo l'area con l'assistente, nello stile delle lezioni esplorabili: una pagina da scorrere con **dieci capitoli dalla scuola superiore al PhD avanzato · frontiera** (dall'energia di ionizzazione all'errore di delocalizzazione della DFT, dalla caduta dei gravi alle onde gravitazionali, dalla derivata all'ipotesi di Riemann). Spectra col corpo resta in scena in alto mentre si scorre e l'ologramma segue il capitolo; in ogni capitolo **prevedi** (quattro risposte, il perché di ciascuna), **provi** con un cursore che ricalcola la grandezza vera (19 capitoli su 30), **guardi dal vivo** la sezione collegata nell'ologramma e ti fai **spiegare tutto** al livello del capitolo; la memoria tiene le previsioni e la barra dei progressi |

---

## Stack tecnologico

| Strato | Tecnologia | Perché |
|---|---|---|
| Chemioinformatica | **RDKit MinimalLib** (WebAssembly) | SMILES, SMARTS, descrittori, disegno 2D — con la stessa libreria usata nella ricerca |
| Visualizzazione 3D | **three.js**, **3Dmol.js** (WebGL) | Molecole, proteine, scene astronomiche |
| Strutture 2D | **SmilesDrawer** | Disegno rapido da SMILES |
| Dati tabulari | **sql.js** (SQLite in WebAssembly) | Esercitazioni SQL senza server |
| Offline | **Service Worker** | Network-first con attesa limitata a 3,5 s |
| Linguaggio | HTML5, CSS3, JavaScript ES6 — **nessun framework** | Nessuna build, nessuna dipendenza di runtime, nessun invecchiamento del toolchain |

Tutte le librerie sono **incluse nel repository** e servite dallo stesso
dominio: nessuna CDN esterna a runtime. È la condizione che rende possibile il
funzionamento offline.

---

## Prerequisiti

### Per usarla
Un browser moderno. Nient'altro.

### Per svilupparla

| Strumento | Versione | A cosa serve |
|---|---|---|
| Un server HTTP statico | — | `python3 -m http.server` va benissimo |
| **Node.js** | ≥ 18 | Solo per i banchi di prova |
| **Chromium** | — | Solo per i banchi di prova (via Playwright) |

---

## Avvio in locale

```bash
git clone https://github.com/samupropio1-ship-it/BioSpecInfo-v11
cd BioSpecInfo-v11
python3 -m http.server 8899
```

Apri **http://127.0.0.1:8899/index.html**

> **Non aprire `index.html` con un doppio clic.** Con il protocollo `file://` i
> moduli WebAssembly non si caricano: RDKit e SQLite restano inerti e metà
> dell'applicazione non funziona. Serve un server HTTP, anche il più semplice.

---

## Variabili d'ambiente

**L'applicazione non ne usa.** Non c'è build, non c'è runtime server, non c'è
configurazione: i file del repository *sono* l'applicazione.

Le uniche variabili del progetto appartengono al **proxy opzionale**
(Cloudflare Worker) e si impostano come segreti, mai nel file versionato:

| Variabile | Default | Descrizione |
|---|---|---|
| `ORIGINI` | *(vuoto = tutte)* | Origini ammesse, separate da virgola. **Impostarla sempre**: senza, il proxy è utilizzabile da chiunque. |
| `LIMITE_IP` | `20` | Richieste per IP nella finestra |
| `TETTO_GIORNO` | `2000` | Tetto giornaliero complessivo |
| `GROQ_KEYS`, `GEMINI_KEYS`, `ANTHROPIC_KEYS`, … | — | Chiavi API. Più chiavi separate da virgola: esaurita la quota della prima, il proxy passa alla successiva. |

```bash
cd proxy
npx wrangler secret put GROQ_KEYS     # MAI in wrangler.toml: quel file è versionato
```

---

## Comandi disponibili

L'applicazione non ha una build: i file del repository *sono* l'applicazione.
Il `package.json` esiste solo per i banchi di prova, che usano
`playwright-core`.

```bash
git clone https://github.com/samupropio1-ship-it/BioSpecInfo-v11
cd BioSpecInfo-v11
npm install                      # solo playwright-core, per i banchi
python3 -m http.server 8899 &    # RDKit e SQLite sono WASM: serve HTTP
node tools/genera-evidenza.js    # 85 banchi, rapporto di verifica completo
```

| Comando | Cosa fa |
|---|---|
| `python3 -m http.server 8899` | Avvia l'applicazione in locale |
| `node tools/genera-evidenza.js` | Esegue tutta la batteria e produce il rapporto di verifica |
| `node tools/genera-evidenza.js --veloce` | Come sopra, saltando i banchi con browser |
| `node tools/impacchetta-corpo.js <corpo.glb>` | Impacchetta il corpo di Spectra in `models/spectra-corpo.bsi` e verifica che si riapra identico |
| `node tools/banchi/audit_farmaci.js` | Struttura ⟷ peso, duplicati e formula ricostruita contro ChEMBL sui 263 farmaci |
| `node tools/verifica-sicurezza.js` | Credenziali, password in chiaro, script esterni |
| `node tools/verifica-accessibilita.js` | Contrasto WCAG AA e nomi accessibili, sezione per sezione |
| `node tools/verifica-documenti.js` | Collegamenti, versioni, coerenza della matrice |
| `node tools/verifica-affermazioni.js` | Confronta ogni numero dichiarato nei documenti (IT e EN) con quello misurato nell'app viva |
| `node tools/banchi/audit_rete.js` | Semina un valore spia nei dati dell'utente e verifica che non esca in nessuna richiesta |
| `node tools/banchi/audit_mobile.js` | Verifica che a 390 px la pagina non scorra in orizzontale |
| `node tools/banchi/audit_copertura.js` | Misura quanti byte di JavaScript vengono davvero eseguiti |
| `node tools/genera-sbom.js` | Rigenera la distinta dei componenti, in italiano e in inglese |
| `node tools/genera-pdf.js` | Rigenera i PDF allegabili da `docs/*.md` e `docs/en/*.md` |
| `node tools/genera-pacchetti.js` | Costruisce i tre pacchetti di consegna in `consegna/` |

Gli 85 banchi stanno in [`tools/banchi/`](https://github.com/samupropio1-ship-it/BioSpecInfo-v11/tree/main/tools/banchi) e sono versionati:
non è una comodità, è la condizione perché *«chiunque può rieseguirli»* sia
vero. Un banco assente rende l'esito **NON CONFORME**, perché un banco che non
c'è non è un banco superato.

---

## Struttura del progetto

```
BioSpecInfo-v11/
├── index.html              Applicazione principale — 197 sezioni, dati chimici
├── bsi-ai-hub.js           Agente «Spectra»: ciclo agentico, 38 strumenti
├── bsi-spectra-live.js     Spectra Live: console vocale, comandi locali, altri 9 strumenti
├── bsi-spectra-androide.js Volto 3D di Spectra (modello «Noir», CC BY 4.0)
├── bsi-spectra-mente.js    Memoria locale e stato interno di Spectra
├── bsi-spectra-creatore.js Spectra riconosce il suo creatore (prova con impronta SHA-256)
├── bsi-lezione.js          Lezione guidata con Spectra per ogni sezione
├── bsi-spectra-corpo.js    Corpo di Spectra: driver per avatar umanoidi (manichino solo per il suo banco)
├── bsi-spectra-figura.js   Spectra col corpo nelle sezioni dell'AI e nello studio: corpo, viso, reazioni
├── bsi-spectra-spiega.js   «🧠 Spiega»: spiegazione esaustiva, anche di spettri, grafici e scene 3D sullo schermo
├── bsi-spectra-esplora.js  «⚡ Esplora con Spectra»: una sezione per materia, dieci capitoli da scorrere (prevedi, prova, guarda dal vivo)
├── bsi-spectra-olointerattivo.js  «⛶ Interagisci»: l'ologramma interattivo (spettri dalla traccia scritta, universo, matematica e fisica passo per passo)
├── bsi-spectra-rig.js      Rig automatico nel browser per figure umanoidi senza scheletro
├── bsi-spectra-voce.js     Voce di Spectra: audio TTS (con chiave OpenAI) ed effetti
├── bsi-spectra-studio-lezioni.js  Lezioni di Spectra Studio, con i calcoli
├── spectra-studio.html     Spectra Studio: laboratorio 3D con Spectra in piedi (corpo .glb caricabile dal dispositivo)
├── bsi-materie-app.js      Tre app in una: menu ✨, Spectra, Studio e Utility per materia
├── bsi-studio.js           Motore dei kit di studio
├── bsi-aggiorna.js         «Controlla aggiornamenti»
├── bsi-spettri.js          Motore di predizione spettrale IR/NMR
├── bsi-cheminfo.js         Motore di chemioinformatica: impronte, QSAR, modello nullo
├── sw.js                   Service Worker: offline e strategia di rete
│
├── astro.html              Modulo di astrochimica
├── chimorga.html           Chimica organica — 25 moduli
├── rdkit_lab.html          Laboratorio di chemioinformatica
├── accademia.html          Quiz gamificati
├── file_manager.html       Archivio personale (IndexedDB)
├── sr_completo.html        Retrosintesi — 98 esercizi
│   …                       altre pagine tematiche
│
├── lib/                    sql.js, dataset
├── models/  textures/      Modelli 3D e texture (spectra-noir.glb: volto di Spectra; spectra-corpo.bsi: corpo di Spectra, impacchettato)
├── proxy/                  Cloudflare Worker opzionale
│
├── tools/                  Strumenti di verifica ed evidenza
│   ├── genera-evidenza.js
│   ├── genera-sbom.js
│   └── verifica-farmaci.js
│
└── docs/                   Documentazione (vedi DOCUMENTATION.md)
    └── evidence/           Evidenza generata automaticamente
```

---

## Deploy

Sono file statici: qualunque host va bene, purché su **HTTPS** (il Service
Worker lo richiede) e con il tipo MIME `application/wasm` per i `.wasm`.

In produzione: **GitHub Pages** dal ramo `main`, pubblicazione automatica.

> **Prima di pubblicare, incrementa due righe insieme:** `CACHE` in `sw.js` e
> `BSI_APP_VERSION` in `index.html`. Se non lo fai, il Service Worker continua a
> servire i file vecchi e la pubblicazione non raggiunge nessuno.

Procedura completa, alternative e ripristino: [Guida al deploy](12-Deploy-Guide.md).

---

## Contribuire

### Prima di proporre una modifica

```bash
python3 -m http.server 8899 &
node tools/genera-evidenza.js     # deve chiudersi con 0 falliti
```

### Criteri di accettazione

- Nessun errore JavaScript non di rete su tutte le pagine
- `tools/verifica-farmaci.js` senza difetti; ogni deviazione registrata con il motivo
- `verifica_guida`: nessuna promessa della documentazione priva di riscontro
- Versione incrementata, `CACHE` e `BSI_APP_VERSION` allineate
- Rapporto di evidenza rigenerato sul commit che si pubblica

### Due regole che valgono più delle altre

**Un dato scientifico deve poter essere contraddetto.** Ogni farmaco dichiara
struttura *e* peso molecolare: sono affermazioni indipendenti, e il confronto
rivela l'errore senza chiedere di fidarsi di nessuno. Se un dato non supera la
verifica, non entra: si registra la deviazione con il motivo.

**Un banco che non misura nulla passa.** È il modo più insidioso di ottenere una
falsa garanzia. Ogni banco che simula una condizione deve contare quante volte la
simulazione è realmente scattata, e fallire se il conteggio è zero.

Dettagli: [Documentazione dei test](15-Test-Documentation.md).

---

## Licenza

**Codice proprietario — All rights reserved** ([`LICENSE`](LICENSE)).
Visibile e valutabile; copia, riuso e uso commerciale richiedono autorizzazione
scritta dell'Autore.

Le librerie di terze parti restano sotto le rispettive licenze permissive
(MIT, BSD-3-Clause, CC0, Public Domain) — distinta completa con impronte in
[`docs/07-SBOM.md`](07-SBOM.md), attribuzioni in
[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

### Crediti — contenuti di terze parti

| Contenuto | Autore | Licenza | Modifiche |
|---|---|---|---|
| Modello 3D «Noir» ([Sketchfab](https://sketchfab.com/3d-models/noir-8edf174437494f0080b4cd5aa0f0509c)), file `models/spectra-noir.glb`, usato come volto di Spectra | [Skyfox13](https://sketchfab.com/podderkuntal25) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | Texture ricompresse, tangenti tolte, viso reso in metallo grigio scuro, bocca e testa animate. L'attribuzione compare anche nella console di Spectra Live |
| Corpo «Bounty Hunter» (CGTrader, download gratuito), incorporato come blocco impacchettato `models/spectra-corpo.bsi`, usato come corpo di Spectra | Autore su CGTrader (il nome non è nel file) | Royalty Free di CGTrader: uso dentro il prodotto, il modello non si offre come file a sé | Riggato nel browser, cappuccio, ricolorazione blu notte, viso «Noir» sul colletto; impacchettato con `tools/impacchetta-corpo.js` |

La licenza proprietaria del progetto non si estende ai modelli: «Noir» resta
sotto CC BY 4.0, il corpo sotto la licenza Royalty Free di CGTrader.

---

## Autore

**Samuele Pio Provenzano**
Relatore di tesi: Prof. Savino Longo — Università degli Studi di Bari Aldo Moro

---

> ⚕️ **Uso didattico.** BioSpecInfo non è un dispositivo medico e non è uno
> strumento analitico certificato. Gli spettri sono predizioni da tabelle di
> gruppi funzionali, non misure. I dati farmacologici hanno finalità
> esclusivamente didattica. Dettagli in
> [`docs/09-Release-Conformance-Statement.md`](09-Release-Conformance-Statement.md).
