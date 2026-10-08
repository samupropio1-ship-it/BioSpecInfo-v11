# Distinta dei componenti software (SBOM)

**BioSpecInfo** · documento generato da `tools/genera-sbom.js`.

| | |
|---|---|
| Versione applicazione | `bsi-v196` |
| Commit | `f168eed862ff523a01d999a60874efb4dede63bb` |
| Generato (UTC) | `2026-10-08T11:39:30.119Z` |
| Formato macchina | [`evidence/sbom.cdx.json`](evidence/sbom.cdx.json) — CycloneDX 1.5 |

> Le impronte SHA-256 si riferiscono ai file effettivamente distribuiti in
> questo commit. Un revisore può ricalcolarle con `sha256sum <file>` e
> confrontarle, verificando di avere sotto mano lo stesso artefatto descritto.

---

## 1. Componenti di terze parti distribuiti con l'applicazione

Tutti i componenti sono **inclusi nel repository** e serviti dallo stesso
dominio: l'applicazione non carica codice da CDN esterne in fase di
esecuzione. È la condizione che le rende utilizzabile offline e che elimina
la dipendenza dalla disponibilità di terzi.

| Componente | Versione/File | Licenza | Dimensione | Ruolo |
|---|---|---|---:|---|
| **RDKit MinimalLib (JS glue)**<br><sub>RDKit / Greg Landrum</sub> | `RDKit_minimal.js` | BSD-3-Clause | 125 kB | Chemioinformatica: interpretazione SMILES, SMARTS, descrittori, disegno 2D. |
| **RDKit MinimalLib (WebAssembly)**<br><sub>RDKit / Greg Landrum</sub> | `RDKit_minimal.wasm` | BSD-3-Clause | 6753 kB | Binario WebAssembly del motore chemioinformatico. |
| **three.js**<br><sub>mrdoob e collaboratori</sub> | `three.min.js` | MIT | 589 kB | Motore di rendering WebGL per le scene 3D. |
| **three.js — UnrealBloomPass**<br><sub>mrdoob e collaboratori</sub> | `three_bloom.js` | MIT | 25 kB | Effetto di post-produzione per le visualizzazioni astronomiche. |
| **three.js — GLTFLoader**<br><sub>mrdoob e collaboratori</sub> | `gltf_loader.js` | MIT | 94 kB | Caricamento dei modelli anatomici e molecolari in formato glTF. |
| **3Dmol.js**<br><sub>University of Pittsburgh / David Koes</sub> | `3Dmol-min.js` | BSD-3-Clause | 502 kB | Visualizzazione molecolare 3D (PDB, SDF, superfici). |
| **SmilesDrawer**<br><sub>Daniel Probst</sub> | `smiles-drawer.min.js` | MIT | 246 kB | Disegno 2D delle strutture a partire da SMILES. |
| **PDF.js (build legacy)**<br><sub>Mozilla Foundation</sub> | `vendor/pdfjs/pdf.min.mjs` | Apache-2.0 | 511 kB | Apertura dei documenti PDF nel lettore di spettri: ogni pagina disegnata e il suo strato di testo. E' la build legacy, perche' quella predefinita usa funzioni di linguaggio recentissime e si rompe sui browser che non le hanno ancora. |
| **PDF.js — worker**<br><sub>Mozilla Foundation</sub> | `vendor/pdfjs/pdf.worker.min.mjs` | Apache-2.0 | 1290 kB | Il lavoro di decodifica di un PDF, fuori dal filo principale: una pagina complessa non blocca l'interfaccia. |
| **sql.js (JS glue)**<br><sub>sql.js / SQLite</sub> | `lib/sql-wasm.js` | MIT | 45 kB | Database SQLite in-browser per le esercitazioni sui dati. |
| **SQLite (WebAssembly)**<br><sub>SQLite Consortium</sub> | `lib/sql-wasm.wasm` | Public Domain | 644 kB | Motore SQLite compilato in WebAssembly. |
| **Dataset dimuoni (CERN Open Data)**<br><sub>CERN Open Data Portal</sub> | `lib/dimuon.js` | CC0-1.0 | 48 kB | Dati sperimentali per l'esercitazione di fisica delle particelle. |

### Impronte

| File | SHA-256 |
|---|---|
| `RDKit_minimal.js` | `58d3c996ade7e0b0137d4f9363ff6c204b545689428fa0898eeaed579ef788d9` |
| `RDKit_minimal.wasm` | `e0967d44fed59e44a2d07bfc08f3a86821c54a14c95bb7e6e392fe867333b8c8` |
| `three.min.js` | `9274bbcec8d96168626c732b5d31c775aa8cfb7eaa0599bec0c175908a2c1ce2` |
| `three_bloom.js` | `42e0ff40b00ea1ba4fe53baeb3726834a3ac3db46e9cfb80856baebf01611090` |
| `gltf_loader.js` | `5c15967ba830918a9caea6338712c994c354bccd4edc4569bde411c3ec06a3e6` |
| `3Dmol-min.js` | `06b6d2fc7d418e8bef62a32cca44373ff21b2b787bd377613dd4039394a4e9ff` |
| `smiles-drawer.min.js` | `955285fac52a7017b3c3658e2cb84bef7f1f76732f3f7cd565d1bb0903232dc2` |
| `vendor/pdfjs/pdf.min.mjs` | `bccc24ea711db8e44503629519904a5292d73b9daaa214bbe7cdcc282b0f4259` |
| `vendor/pdfjs/pdf.worker.min.mjs` | `145d2dd3ab0c86151011dba95acfa2d5336e2accd59388ea43dbee0efddaaec6` |
| `lib/sql-wasm.js` | `77d6435bac506af0e3c59636dce9d22b1b14156348bc327f41a1577f3212360f` |
| `lib/sql-wasm.wasm` | `438c88f666dc054ce4e9395f80fe9db4218b1a3c379960454880f048a7898aed` |
| `lib/dimuon.js` | `61190d7bbec3ce4ea3add2503b9513ac27b227a3878dd229560a6cd29aabc36d` |

---

## 2. Codice proprio del progetto

| File | Dimensione | Ruolo |
|---|---:|---|
| `index.html` | 4691 kB | Applicazione principale: interfaccia, sezioni didattiche, dati chimici. |
| `bsi-ai-hub.js` | 422 kB | Agente AI «Spectra»: ciclo agentico, strumenti, gestione dei fornitori. |
| `bsi-spettri.js` | 35 kB | Motore di predizione spettrale IR/NMR su grafo molecolare. |
| `bsi-cheminfo.js` | 125 kB | Motore di chemioinformatica: standardizzazione, impronte, raggruppamento, PCA, modelli QSAR con modello nullo. |
| `bsi-pretsch.js` | 37 kB | Le tabelle di stima NMR trascritte intere da Pretsch–Bühlmann–Badertscher, 4ª ed.: benzeni ¹³C e ¹H, etileni, alcani, alchini, alifatici ¹³C, correzioni steriche, ¹J(C,H). Solo numeri, nessun codice. |
| `bsi-nmr.js` | 57 kB | Predizione NMR ¹H e ¹³C assegnata per atomo: applica le tabelle di bsi-pretsch.js camminando l'anello e misurando le distanze, con composto di riferimento ciclico ed equivalenza chimica per codice d'intorno. |
| `bsi-geom3d.js` | 46 kB | Coordinate 3D da uno SMILES per geometria delle distanze, con gli stessi indici del predittore NMR: è la condizione del collegamento picco↔atomo↔3D. |
| `bsi-nmr2d.js` | 21 kB | NMR bidimensionale: COSY, HSQC editato e HMBC, costruiti camminando il grafo sulle due predizioni per atomo. |
| `bsi-moldraw.js` | 44 kB | Spettro NMR interattivo: zoom, tabella di assegnazione, collegamento picco↔atomo, cronologia SMILES/InChI, uscite CSV/JCAMP-DX/PNG. |
| `bsi-documento.js` | 23 kB | Apertura di qualunque documento — PDF, immagini, testo, Word, OpenDocument, PowerPoint, Excel — con l'elenco esplicito di cio' che NON si e' potuto leggere. |
| `bsi-quesito.js` | 19 kB | Riconoscimento dei dati spettroscopici nel testo di un quesito, con la provenienza di ogni dato, e svolgimento passo per passo tramite bsi-elucida.js. |
| `bsi-spettrolettore.js` | 79 kB | Lettore di spettri: JCAMP-DX con compressione ASDF, ricerca dei picchi per prominenza, assegnazione delle bande IR, perdite neutre, apertura di documenti. |
| `bsi-mol3d.js` | 42 kB | Visore 3D delle molecole: animazione di formazione, selezione degli atomi, misura di angoli, lunghezze e diedri. |
| `bsi-lingue.js` | 159 kB | Motore di internazionalizzazione: quattordici lingue, verso di scrittura compreso. |
| `bsi-molingue.js` | 54 kB | Linguaggi chimici: venticinque uscite da SMILES, con nomenclatura IUPAC su una classe dichiarata. |
| `bsi-pannelli-lingua.js` | 66 kB | Pannelli delle lingue e dei linguaggi chimici. |
| `sw.js` | 5 kB | Service Worker: funzionamento offline e strategia di rete. |
| `rdkit_lab.html` | 260 kB | Laboratorio di chemioinformatica. |
| `astro.html` | 2660 kB | Modulo di astrochimica. |
| `chimorga.html` | 194 kB | Modulo di chimica organica. |
| `proxy/spectra-proxy.js` | 10 kB | Proxy opzionale (Cloudflare Worker) per le chiamate all'AI. |

### Impronte

| File | SHA-256 |
|---|---|
| `index.html` | `0971486c09364781a101589bf23eda242a6b5b6f8f805c35258ad3eb79ab038a` |
| `bsi-ai-hub.js` | `985b9fa3f6a3d330cc6f7e31456e16760d0a0d9482f760b04d83765a013f2476` |
| `bsi-spettri.js` | `be757f15a70f884e3374d401596e2dfd18bcc852cafbb4584920e2b2d24eb3c9` |
| `bsi-cheminfo.js` | `59a3111b3b9436add5376fde1be6f90ded3dc08c095cebdc04da50c7f8268bbc` |
| `bsi-pretsch.js` | `27f727240363579fba3dba50ab3b567fbcdb26a8a9a06c0e43968b195c479db3` |
| `bsi-nmr.js` | `881917dbb141dfcbab9a25b9c518eaa4a8c1c52dc1020cbac90985a1cf859b72` |
| `bsi-geom3d.js` | `a616b91efa8f790388c99f22cc9f2d48630cb760d4f7fa87f92b99b9db106054` |
| `bsi-nmr2d.js` | `a0b1db87f27ffa8c124d617e4903f61e35b89c30c35162527ad023325c03fa78` |
| `bsi-moldraw.js` | `45cacdca20c8091cbfb32e256c179de8c32c71068a5d1008fbef9be005b5df0e` |
| `bsi-documento.js` | `0e9ad6043a396652549b30879764cc401f8b7bd25689b5bb5f37cf26f7d7d8d9` |
| `bsi-quesito.js` | `6f686abcfdc3959d8c865a3e6ee7129224de52992ab1ba3da07372a986769cdf` |
| `bsi-spettrolettore.js` | `cd19768291586d099acf0fefeed06d34417644a83b1b952d0943ae3a16c491f4` |
| `bsi-mol3d.js` | `93fea4a6811ba4263de450db4e7ae1801d4fde196cf7683d0100846c51751893` |
| `bsi-lingue.js` | `588beac68e5ea9fcfdc430a3b56290eb61df509a41c507aa24ba8c146a809431` |
| `bsi-molingue.js` | `e45fec1ee20e3e7b9a7bea3d6e20aa4e33e74ec43578bfa7bfb94646b7bc53fb` |
| `bsi-pannelli-lingua.js` | `4af94d70ef104cf21be18ff7fbc7a2248c56e376e2ae48e8cac83878f4554f93` |
| `sw.js` | `1e12bdef2195e928e55a3c47340165db34f7a78b80d799218915a697c79cee69` |
| `rdkit_lab.html` | `066a42092b829df2fa306b691b9d162b6d44edfdb5317ce4cc8a276bc34c80ad` |
| `astro.html` | `3376b2b7f26ed483f2d698c6692b31f21c9f245f87d1fb1884216fb8b1da489d` |
| `chimorga.html` | `047934abc73a79fbaf06ed7036b6e89a913ebdf5354fc52cecdbee7e8f94f51d` |
| `proxy/spectra-proxy.js` | `808c0a12891ae9c6f45cf0c676b033075089e064df9047be844f03badf940962` |

---

## 3. Dipendenze di sviluppo

Usate **solo** per l'esecuzione dei banchi di prova. Non vengono distribuite
con l'applicazione e non sono presenti in produzione.

| Pacchetto | Versione | Licenza |
|---|---|---|
| `playwright-core` | 1.62.1 | Apache-2.0 |

---

## 4. Dipendenze di esecuzione

**Nessuna.** L'applicazione non ha backend, non installa pacchetti a runtime e
non carica script da domini esterni. Le uniche chiamate di rete sono opzionali
e dirette a servizi pubblici documentati:

| Servizio | Scopo | Se non raggiungibile |
|---|---|---|
| PubChem PUG-REST | nome IUPAC, CAS, pittogrammi GHS, conformeri 3D | l'app usa i dati locali e lo dichiara |
| NASA / ESA | immagini e dati astronomici | il modulo mostra i dati tabulati |
| Fornitori AI (a scelta dell'utente) | risposte dell'assistente | l'assistente lo segnala e propone alternative |

Nessun dato personale viene trasmesso: le chiavi API, se inserite, restano nel
`localStorage` del dispositivo, oppure sul proxy dell'utente (vedi `proxy/`).

---

## 5. Compatibilità delle licenze

Tutte le licenze dei componenti distribuiti (MIT, BSD-3-Clause, CC0, Public
Domain) sono **permissive** e reciprocamente compatibili. Nessun componente è
soggetto a licenza copyleft forte (GPL/AGPL): non esistono vincoli di
ridistribuzione del codice proprio del progetto.

Gli obblighi residui sono di **attribuzione**: le note di licenza dei progetti a
monte sono riportate in `THIRD_PARTY_NOTICES.md`.

> **La licenza dell'applicazione è distinta da quelle dei componenti.**
> Il codice proprio di BioSpecInfo è **proprietario** — *All rights reserved*
> (vedi [`LICENSE`](LICENSE)): visibile e valutabile, ma copia, riuso e uso
> commerciale richiedono autorizzazione scritta dell'Autore. Le licenze
> permissive elencate sopra riguardano **soltanto** le librerie di terze parti
> incluse, e non si estendono all'applicazione.

_Generato il 2026-10-08T11:39:30.119Z._
