# Distinta dei componenti software (SBOM)

**BioSpecInfo** · documento generato da `tools/genera-sbom.js`.

| | |
|---|---|
| Versione applicazione | `bsi-v221` |
| Commit | `784d87bfb90ba5015cc3136b419f5447d5cb7145` |
| Generato (UTC) | `2026-10-16T12:22:25.158Z` |
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
| **three.js — SkeletonUtils**<br><sub>mrdoob e collaboratori</sub> | `skeleton_utils.js` | MIT | 12 kB | Copie dei nemici animati con il loro scheletro (ATOMIC PROTOCOL). |
| **three.js — GLTFLoader**<br><sub>mrdoob e collaboratori</sub> | `gltf_loader.js` | MIT | 94 kB | Caricamento dei modelli anatomici e molecolari in formato glTF. |
| **3Dmol.js**<br><sub>University of Pittsburgh / David Koes</sub> | `3Dmol-min.js` | BSD-3-Clause | 502 kB | Visualizzazione molecolare 3D (PDB, SDF, superfici). |
| **SmilesDrawer**<br><sub>Daniel Probst</sub> | `smiles-drawer.min.js` | MIT | 246 kB | Disegno 2D delle strutture a partire da SMILES. |
| **PDF.js (build legacy)**<br><sub>Mozilla Foundation</sub> | `vendor/pdfjs/pdf.min.mjs` | Apache-2.0 | 511 kB | Apertura dei documenti PDF nel lettore di spettri: ogni pagina disegnata e il suo strato di testo. E' la build legacy, perche' quella predefinita usa funzioni di linguaggio recentissime e si rompe sui browser che non le hanno ancora. |
| **PDF.js — worker**<br><sub>Mozilla Foundation</sub> | `vendor/pdfjs/pdf.worker.min.mjs` | Apache-2.0 | 1290 kB | Il lavoro di decodifica di un PDF, fuori dal filo principale: una pagina complessa non blocca l'interfaccia. |
| **sql.js (JS glue)**<br><sub>sql.js / SQLite</sub> | `lib/sql-wasm.js` | MIT | 45 kB | Database SQLite in-browser per le esercitazioni sui dati. |
| **SQLite (WebAssembly)**<br><sub>SQLite Consortium</sub> | `lib/sql-wasm.wasm` | Public Domain | 644 kB | Motore SQLite compilato in WebAssembly. |
| **Dataset dimuoni (CERN Open Data)**<br><sub>CERN Open Data Portal</sub> | `lib/dimuon.js` | CC0-1.0 | 48 kB | Dati sperimentali per l'esercitazione di fisica delle particelle. |
| **Fists (2023) | First Person Animations (adattato)**<br><sub>1Matzh (Sketchfab)</sub> | `models/braccia-atomic.glb` | CC-BY-4.0 | 6530 kB | Le braccia della prima persona con lo scheletro e le otto animazioni (passo, corsa, colpi, ispezione, estrazione). |
| **Robotic Hand (modello 3D)**<br><sub>SeanNicolas (Sketchfab)</sub> | `models/mano-robotica-atomic.glb` | CC-BY-4.0 | 838 kB | La mano sinistra robotica, sopra cui si accende il potere degli elementi. |
| **Small Lab (adattato)**<br><sub>Biohazard Rooms (Sketchfab)</sub> | `models/mappe/small.glb` | CC-BY-4.0 | 1506 kB | ATOMIC PROTOCOL — laboratorio (ali 1, 6). |
| **Sci-fi lab (adattato)**<br><sub>Agata Wilczek (Sketchfab)</sub> | `models/mappe/scifi1.glb` | CC-BY-4.0 | 6683 kB | ATOMIC PROTOCOL — laboratorio (ali 2, 7). |
| **Flynn's Secret Lab [Tron Legacy] (adattato)**<br><sub>jvouillon (Sketchfab)</sub> | `models/mappe/flynn.glb` | CC-BY-4.0 | 2319 kB | ATOMIC PROTOCOL — laboratorio (ali 3, 8). |
| **Location underground laboratory (adattato)**<br><sub>bazz4r (Sketchfab)</sub> | `models/mappe/underground.glb` | CC-BY-4.0 | 10512 kB | ATOMIC PROTOCOL — laboratorio (ali 4, 9). |
| **Overgrown Laboratory (adattato)**<br><sub>MichalTroye (Sketchfab)</sub> | `models/mappe/overgrown.glb` | CC-BY-4.0 | 6227 kB | ATOMIC PROTOCOL — laboratorio (ali 5, 10). |
| **Quantum_Laboratory_X_Alpha (adattato)**<br><sub>-X-ScornGames (Sketchfab)</sub> | `models/mappe/reattore.glb` | CC-BY-4.0 | 3269 kB | ATOMIC PROTOCOL — apparecchio (il reattore). |
| **Sci Fi lab (adattato)**<br><sub>IrisProcess (Sketchfab)</sub> | `models/mappe/capsula.glb` | CC-BY-4.0 | 6548 kB | ATOMIC PROTOCOL — apparecchio (la capsula). |
| **Worm Monster (adattato)**<br><sub>CR!STALLL (Sketchfab)</sub> | `models/nemici/verme.glb` | CC-BY-4.0 | 626 kB | ATOMIC PROTOCOL — nemico: il verme di scarico. |
| **Scary Monster (adattato)**<br><sub>L. (Sketchfab)</sub> | `models/nemici/curvo.glb` | LicenseRef-Sketchfab-Standard | 1145 kB | ATOMIC PROTOCOL — nemico: il rampicante. |
| **SWAMP MONSTER (adattato)**<br><sub>alexalbinyana (Sketchfab)</sub> | `models/nemici/palude.glb` | CC-BY-4.0 | 1803 kB | ATOMIC PROTOCOL — nemico: la fanghiglia. |
| **The Human Deer (adattato)**<br><sub>ceeleste (Sketchfab)</sub> | `models/nemici/cervo.glb` | CC-BY-4.0 | 6854 kB | ATOMIC PROTOCOL — nemico: il cervo. |
| **6- Stylized- Monster (adattato)**<br><sub>Lex Wild (Sketchfab)</sub> | `models/nemici/abissale.glb` | CC-BY-4.0 | 3470 kB | ATOMIC PROTOCOL — nemico: l’abissale. |
| **Monster (adattato)**<br><sub>itszyx123456789 (Sketchfab)</sub> | `models/nemici/mostro.glb` | CC-BY-4.0 | 2108 kB | ATOMIC PROTOCOL — nemico: il cristallino. |
| **CREATURE MONSTER 3D BY Oscar Creativo (adattato)**<br><sub>OSCAR CREATIVO (Sketchfab)</sub> | `models/nemici/bruto.glb` | CC-BY-4.0 | 5305 kB | ATOMIC PROTOCOL — nemico: il bruto. |
| **hands animation (modello 3D, adattato)**<br><sub>hugo colauto (Sketchfab)</sub> | `models/mani-atomic.glb` | LicenseRef-Sketchfab-Standard | 2059 kB | Le mani della prima persona, con lo scheletro e l'animazione da cui il gioco ricava le pose. |
| **Modern Scientist in a Lab Coat (ritaglio)**<br><sub>restore50 (Sketchfab)</sub> | `models/manica-atomic.glb` | CC-BY-4.0 | 275 kB | La manica del camice della prima persona, ritagliata dalla scansione. |
| **Capsule Gun (modello 3D)**<br><sub>sc8di (Sketchfab)</sub> | `models/pistola-atomic.glb` | CC-BY-4.0 | 1366 kB | La pistola a capsula impugnata nella prima persona. |

### Impronte

| File | SHA-256 |
|---|---|
| `RDKit_minimal.js` | `58d3c996ade7e0b0137d4f9363ff6c204b545689428fa0898eeaed579ef788d9` |
| `RDKit_minimal.wasm` | `e0967d44fed59e44a2d07bfc08f3a86821c54a14c95bb7e6e392fe867333b8c8` |
| `three.min.js` | `9274bbcec8d96168626c732b5d31c775aa8cfb7eaa0599bec0c175908a2c1ce2` |
| `three_bloom.js` | `42e0ff40b00ea1ba4fe53baeb3726834a3ac3db46e9cfb80856baebf01611090` |
| `skeleton_utils.js` | `cc2e2e1a3183ab55169d185565f86f43f80c6dfafe73610d991e741ea990ac1a` |
| `gltf_loader.js` | `5c15967ba830918a9caea6338712c994c354bccd4edc4569bde411c3ec06a3e6` |
| `3Dmol-min.js` | `06b6d2fc7d418e8bef62a32cca44373ff21b2b787bd377613dd4039394a4e9ff` |
| `smiles-drawer.min.js` | `955285fac52a7017b3c3658e2cb84bef7f1f76732f3f7cd565d1bb0903232dc2` |
| `vendor/pdfjs/pdf.min.mjs` | `bccc24ea711db8e44503629519904a5292d73b9daaa214bbe7cdcc282b0f4259` |
| `vendor/pdfjs/pdf.worker.min.mjs` | `145d2dd3ab0c86151011dba95acfa2d5336e2accd59388ea43dbee0efddaaec6` |
| `lib/sql-wasm.js` | `77d6435bac506af0e3c59636dce9d22b1b14156348bc327f41a1577f3212360f` |
| `lib/sql-wasm.wasm` | `438c88f666dc054ce4e9395f80fe9db4218b1a3c379960454880f048a7898aed` |
| `lib/dimuon.js` | `61190d7bbec3ce4ea3add2503b9513ac27b227a3878dd229560a6cd29aabc36d` |
| `models/braccia-atomic.glb` | `3e72b0067366ba4906e8cb3d9077e3b800656705bfcdef5b0bb41339c0b765ff` |
| `models/mano-robotica-atomic.glb` | `3cadfde4777f5f609fb9fea7990f35ddc8f82d19fad4c60b8fc18a563ba7e5c6` |
| `models/mappe/small.glb` | `932e21a12c772ef3c36290fac8974a30b37b62e2000f7f1f26cb812a0572a7ab` |
| `models/mappe/scifi1.glb` | `f3e4434820cda4a2ebec5804749cd0a6278aa0cda6a19b74ec14623affb3dc5e` |
| `models/mappe/flynn.glb` | `d9c32659b5a75db09e88e97aeef645f46d30caee24522fc3a18b5048fa56911a` |
| `models/mappe/underground.glb` | `8cae8085cae16d6b496fe93a00eef7d687349492e3d74c7af1aaab407085fa75` |
| `models/mappe/overgrown.glb` | `c521f06e1da35eda66d585a0e6ab5b87a4da504d4b4fb09048518bf11683f403` |
| `models/mappe/reattore.glb` | `58f200ac13b072d40ee45bdd6c725ddd06591502e53825d60699862fc79a3e01` |
| `models/mappe/capsula.glb` | `be1ae03a8aa0c8cd160d517620985f83a515a2f05fc3d062aab4303496befb02` |
| `models/nemici/verme.glb` | `4b35e41fd47e554733f593f671b35b51765367ef2f7522bda4316ddef0ee02d8` |
| `models/nemici/curvo.glb` | `a1fb198ba5806fd97feb45ec4ca5d42a065420ce2bdb0c331699609845218577` |
| `models/nemici/palude.glb` | `83668a9192e57d1183f9086ac974b4e87af8ecdc57b57c13015ec90d2f5da533` |
| `models/nemici/cervo.glb` | `ecece2366754baf17c400ac4265d65ad7daa166a40fc911eece6d3641403291d` |
| `models/nemici/abissale.glb` | `81b701fba1f0a59ce10f57c45128b172aeb1d6f759a51b9b6903f548c14eee2e` |
| `models/nemici/mostro.glb` | `c669349d5562013e251a76fdb48d0e180e3f997e95c07d1064c8697368d0d4e3` |
| `models/nemici/bruto.glb` | `a995a10428f05dd0074570980a72c9a5f04606deb90a58382a8f3e5e3d301ae1` |
| `models/mani-atomic.glb` | `d27b4ea1689e677e9406944abaecd95d524ca7693b2e4b62aec6c906f46ece56` |
| `models/manica-atomic.glb` | `0034162e3fc772d3afb11c2df1a66222ae681ad7f404bcec59977d6557f14b98` |
| `models/pistola-atomic.glb` | `4e109a4ab7e2794b139a5c9414151b376b7a237baab5d9f183f98d8e9ac65f7f` |

---

## 2. Codice proprio del progetto

| File | Dimensione | Ruolo |
|---|---:|---|
| `index.html` | 4671 kB | Applicazione principale: interfaccia, sezioni didattiche, dati chimici. |
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
| `bsi-spettrolettore.js` | 104 kB | Lettore di spettri: JCAMP-DX con compressione ASDF, ricerca dei picchi per prominenza, assegnazione delle bande IR, perdite neutre, apertura di documenti. |
| `bsi-mol3d.js` | 42 kB | Visore 3D delle molecole: animazione di formazione, selezione degli atomi, misura di angoli, lunghezze e diedri. |
| `bsi-lingue.js` | 163 kB | Motore di internazionalizzazione: quattordici lingue, verso di scrittura compreso. |
| `bsi-molingue.js` | 54 kB | Linguaggi chimici: venticinque uscite da SMILES, con nomenclatura IUPAC su una classe dichiarata. |
| `bsi-pannelli-lingua.js` | 66 kB | Pannelli delle lingue e dei linguaggi chimici. |
| `sw.js` | 6 kB | Service Worker: funzionamento offline e strategia di rete. |
| `rdkit_lab.html` | 260 kB | Laboratorio di chemioinformatica. |
| `astro.html` | 2660 kB | Modulo di astrochimica. |
| `chimorga.html` | 194 kB | Modulo di chimica organica. |
| `proxy/spectra-proxy.js` | 10 kB | Proxy opzionale (Cloudflare Worker) per le chiamate all'AI. |

### Impronte

| File | SHA-256 |
|---|---|
| `index.html` | `50c39157bfb20a753ca2de6535259b8e3ca88b7a8beb0d2e21b969aa1b55f6c8` |
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
| `bsi-spettrolettore.js` | `14daf41305b0a7271c6ff5f7c9078a4e5f0e0149f32460a9608ed1996f810256` |
| `bsi-mol3d.js` | `93fea4a6811ba4263de450db4e7ae1801d4fde196cf7683d0100846c51751893` |
| `bsi-lingue.js` | `5a28570f930be99f9e07c46ed354dab3392805820209adb1eb38e28f2d20f410` |
| `bsi-molingue.js` | `e45fec1ee20e3e7b9a7bea3d6e20aa4e33e74ec43578bfa7bfb94646b7bc53fb` |
| `bsi-pannelli-lingua.js` | `4af94d70ef104cf21be18ff7fbc7a2248c56e376e2ae48e8cac83878f4554f93` |
| `sw.js` | `1cc20757acb2497ff8dcbc6d7aee7aec8089a2d48c1fecb98136cb23b6d1a0d4` |
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
> (vedi [`LICENSE`](../LICENSE)): visibile e valutabile, ma copia, riuso e uso
> commerciale richiedono autorizzazione scritta dell'Autore. Le licenze
> permissive elencate sopra riguardano **soltanto** le librerie di terze parti
> incluse, e non si estendono all'applicazione.

_Generato il 2026-10-16T12:22:25.158Z._
