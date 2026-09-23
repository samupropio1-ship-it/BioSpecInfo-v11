# BioSpecInfo

**Piattaforma di chemioinformatica interattiva che esegue l'intera logica
scientifica nel browser: analisi molecolare, predizione spettrale, modellistica
2D/3D e un agente AI — senza alcun server, installabile e funzionante offline.**

[![Versione](https://img.shields.io/badge/versione-bsi--v170-0e655c)](CHANGELOG.md)
[![Verifica](https://img.shields.io/badge/banchi-40%20superati%2C%200%20falliti-2e7d32)](docs/evidence/RAPPORTO-VERIFICA.md)
[![Licenza](https://img.shields.io/badge/licenza-proprietaria-b3372c)](LICENSE)

👉 **[Provala](https://samupropio1-ship-it.github.io/BioSpecInfo-v11/)** ·
📚 **[Documentazione completa](DOCUMENTATION.md)** ·
📖 **[Guida per chi studia](14-User-Manual.md)**

---

## Che cos'è

Uno strumento di studio per chimica, biochimica, farmacologia e astrochimica,
rivolto a studenti universitari. **87 sezioni** fra calcolatori, visualizzatori,
banche dati e quiz, più un assistente AI che può interrogare l'applicazione
stessa.

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
| **Farmacologia** | 178 farmaci, atlante 3D dei bersagli, interazioni, farmacocinetica, casi clinici |
| **Astrochimica** | Molecole interstellari, esopianeti JWST, nebulose, spettri stellari, nucleosintesi |
| **Studio** | Ripetizione spaziata (SM-2), quiz, percorsi, note, File Manager personale |
| **Spectra** | Agente AI con 35 strumenti, dieci fornitori, ricaduta automatica sui guasti |

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
node tools/genera-evidenza.js    # 40 banchi, rapporto di verifica completo
```

| Comando | Cosa fa |
|---|---|
| `python3 -m http.server 8899` | Avvia l'applicazione in locale |
| `node tools/genera-evidenza.js` | Esegue tutta la batteria e produce il rapporto di verifica |
| `node tools/genera-evidenza.js --veloce` | Come sopra, saltando i banchi con browser |
| `node tools/verifica-farmaci.js` | Verifica struttura ⟷ peso molecolare sui 178 farmaci |
| `node tools/verifica-sicurezza.js` | Credenziali, password in chiaro, script esterni |
| `node tools/verifica-accessibilita.js` | Contrasto WCAG AA e nomi accessibili, sezione per sezione |
| `node tools/verifica-documenti.js` | Collegamenti, versioni, coerenza della matrice |
| `node tools/genera-sbom.js` | Rigenera la distinta dei componenti |
| `node tools/genera-pdf.js` | Rigenera i 26 PDF da `docs/*.md` |
| `node tools/genera-pacchetti.js` | Costruisce i tre pacchetti di consegna in `consegna/` |

I 40 banchi stanno in [`tools/banchi/`](https://github.com/samupropio1-ship-it/BioSpecInfo-v11/tree/main/tools/banchi) e sono versionati:
non è una comodità, è la condizione perché *«chiunque può rieseguirli»* sia
vero. Un banco assente rende l'esito **NON CONFORME**, perché un banco che non
c'è non è un banco superato.

---

## Struttura del progetto

```
BioSpecInfo-v11/
├── index.html              Applicazione principale — 87 sezioni, dati chimici
├── bsi-ai-hub.js           Agente «Spectra»: ciclo agentico, 35 strumenti
├── bsi-spettri.js          Motore di predizione spettrale IR/NMR
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
├── models/  textures/      Modelli 3D e texture
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
