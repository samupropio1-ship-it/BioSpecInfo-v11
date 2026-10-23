# Distinta dei componenti software (SBOM)

**BioSpecInfo** · documento generato da `tools/genera-sbom.js`.

| | |
|---|---|
| Versione applicazione | `bsi-v235` |
| Commit | `e03086579ebe9198e9d4ad90b87efa23b6150a5c` |
| Generato (UTC) | `2026-10-23T20:15:30.481Z` |
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
| `index.html` | 4685 kB | Applicazione principale: interfaccia, sezioni didattiche, dati chimici. |
| `bsi-ai-hub.js` | 429 kB | Agente AI «Spectra»: ciclo agentico, strumenti, gestione dei fornitori. |
| `bsi-spettri.js` | 35 kB | Motore di predizione spettrale IR/NMR su grafo molecolare. |
| `bsi-cheminfo.js` | 125 kB | Motore di chemioinformatica: standardizzazione, impronte, raggruppamento, PCA, modelli QSAR con modello nullo. |
| `bsi-pretsch.js` | 37 kB | Le tabelle di stima NMR trascritte intere da Pretsch–Bühlmann–Badertscher, 4ª ed.: benzeni ¹³C e ¹H, etileni, alcani, alchini, alifatici ¹³C, correzioni steriche, ¹J(C,H). Solo numeri, nessun codice. |
| `bsi-nmr.js` | 57 kB | Predizione NMR ¹H e ¹³C assegnata per atomo: applica le tabelle di bsi-pretsch.js camminando l'anello e misurando le distanze, con composto di riferimento ciclico ed equivalenza chimica per codice d'intorno. |
| `bsi-geom3d.js` | 46 kB | Coordinate 3D da uno SMILES per geometria delle distanze, con gli stessi indici del predittore NMR: è la condizione del collegamento picco↔atomo↔3D. |
| `bsi-fisica-comune.js` | 31 kB | La casa comune delle sezioni di fisica: intestazione, schede, cursori, grafici su tela, lingua. |
| `bsi-fis-schrodinger.js` | 22 kB | Equazione di Schrödinger 1D: differenze finite, bisezione di Sturm, iterazione inversa, Crank-Nicolson, Morse delle molecole reali. |
| `bsi-fis-hartreefock.js` | 29 kB | Hartree-Fock ristretto con base STO-3G: integrali di McMurchie-Davidson, funzione di Boys, SCF con DIIS, orbitali molecolari. |
| `bsi-fis-rotovib.js` | 16 kB | Spettri rotovibrazionali IR e Raman delle biatomiche dalle costanti molecolari; differenze di combinazione. |
| `bsi-fis-termostat.js` | 11 kB | Termodinamica statistica: funzioni di partizione, entropia, capacità termica, popolazioni di Boltzmann. |
| `bsi-fis-dinamica.js` | 12 kB | Dinamica molecolare di Lennard-Jones 2D: velocity Verlet, termostato, viriale, distribuzione radiale. |
| `bsi-fis-matematica.js` | 24 kB | Matematica per la chimica: FFT del FID, Hückel, Runge-Kutta per le cinetiche, minimi quadrati con gli errori. |
| `bsi-fis-cristalli.js` | 20 kB | Cristallografia: reticoli di Bravais, indici di Miller, diffrattogramma di polvere con fattore di struttura ed estinzioni. |
| `bsi-fis-nucleare.js` | 14 kB | Radiochimica: equazioni di Bateman, datazione radiometrica, formula semiempirica di Weizsäcker. |
| `bsi-mat-cas.js` | 67 kB | Motore di calcolo simbolico: analizzatore, frazioni esatte, forma canonica, derivate, primitive verificate, serie troncate, limiti. |
| `bsi-mat-basi.js` | 26 kB | Basi di matematica: cifre significative, logaritmi e pH, equazioni con i passaggi, allenamento. |
| `bsi-mat-funzioni.js` | 17 kB | Studio di funzione: dominio, zeri, estremi, flessi, asintoti; famiglie e trasformazioni. |
| `bsi-mat-calcolo.js` | 21 kB | Derivate con le regole, integrali e somme di Riemann, polinomi di Taylor, limiti. |
| `bsi-mat-lineare.js` | 38 kB | Algebra lineare in frazioni esatte: Gauss-Jordan con i passi, determinante, inversa, autovalori, bilanciamento come nucleo. |
| `bsi-mat-ode.js` | 21 kB | Equazioni differenziali: campo di direzioni, Eulero/Heun/RK4, piano delle fasi ed equilibri dallo jacobiano. |
| `bsi-mat-multi.js` | 22 kB | Funzioni di più variabili: superfici, punti critici con l'hessiano, relazioni di Maxwell, differenziali esatti. |
| `bsi-mat-complessi.js` | 20 kB | Numeri complessi (piano di Argand, radici, Eulero) e serie di Fourier. |
| `bsi-mat-risolutore.js` | 110 kB | Risolutore d’esame di matematica: svolgimento passo per passo di 16 tipi di esercizio. |
| `bsi-mat-esame.js` | 56 kB | Esame di Istituzioni di Matematiche I e II: programma, risolutore, appelli svolti, simulazione. |
| `bsi-fis-esame.js` | 135 kB | Esame di Fisica Generale I e II: programma, 48 modelli di problema, prove svolte. |
| `bsi-percorsi.js` | 9 kB | Percorsi di studio dalle superiori al dottorato per chimica, fisica e matematica. |
| `bsi-mat-probabilita.js` | 18 kB | Probabilità in movimento: Galton, limite centrale, Monte Carlo, Bayes. |
| `bsi-mat-visiva.js` | 24 kB | Matematica visiva: trasformazioni lineari, epicicli di Fourier, frattali, mappa logistica. |
| `bsi-fis-em.js` | 21 kB | Elettromagnetismo in movimento: cariche, induzione, generatore, onde EM. |
| `bsi-fis-suono.js` | 18 kB | Suono e acustica con Web Audio: armoniche, timbro, Doppler, decibel. |
| `bsi-fis-solido.js` | 16 kB | Semiconduttori: Fermi-Dirac, drogaggio, giunzione p-n, LED. |
| `bsi-chi-distillazione.js` | 17 kB | Distillazione: Antoine, van Laar, McCabe-Thiele, Rayleigh. |
| `bsi-chi-voltammetria.js` | 12 kB | Voltammetria ciclica simulata: diffusione e Butler-Volmer. |
| `bsi-fis-astro.js` | 36 kB | Astrofisica: diagramma H-R, corpo nero, sistema solare, esopianeti, cosmologia. |
| `bsi-fis-relativita.js` | 15 kB | Relatività ristretta: Minkowski, gemelli, dinamica. |
| `bsi-fis-fluidi.js` | 15 kB | Fluidi: Venturi e Bernoulli, viscosità e Stokes, capillarità. |
| `bsi-mat-vettoriale.js` | 23 kB | Calcolo vettoriale: campi, Green, gradiente. |
| `bsi-chi-cinetica.js` | 17 kB | Cinetica complessa: reazioni composte, oscillanti, strutture di Turing. |
| `bsi-fis-meccanica.js` | 23 kB | Meccanica in movimento: proiettile con l’aria, urti, pendolo vero, oscillatori accoppiati. |
| `bsi-fis-onde.js` | 20 kB | Onde e ottica: sovrapposizione, lenti e specchi, diffrazione. |
| `bsi-fis-circuiti.js` | 17 kB | Circuiti: transitori RLC, corrente alternata, filtri e Bode. |
| `bsi-fis-termo.js` | 25 kB | Termodinamica in movimento: cicli, gas di particelle, moto browniano. |
| `bsi-mat-numerici.js` | 24 kB | Metodi numerici: zeri, integrazione, EDO, interpolazione con gli ordini misurati. |
| `bsi-mat-geometria.js` | 24 kB | Geometria analitica e vettori: vettori, rette e piani in 3D, coniche. |
| `bsi-chi-equilibrio.js` | 13 kB | Equilibrio chimico e Le Chatelier: simulatore cinetico e K(T). |
| `bsi-lab3d.js` | 62 kB | Laboratorio 3D: superfici, orbitali |ψ|², moti nello spazio, strutture cristalline e piani di Miller, linee di campo (three.js). |
| `bsi-vista-molecole.js` | 8 kB | Qualità e barra dei comandi per tutti i visori molecolari 3Dmol. |
| `bsi-assistente.js` | 71 kB | Le tre macro-aree Chimica, Fisica e Matematica: assistente in linguaggio naturale con svolgimento e problema inverso, catalogo degli strumenti, livelli. |
| `bsi-chi-esame.js` | 98 kB | Esame di chimica dalla base all’avanzatissimo: 40 modelli di problema, prove svolte. |
| `bsi-fis-elettrodi.js` | 14 kB | Cinetica elettrodica (Butler-Volmer, Tafel) e teoria dello stato di transizione (Eyring). |
| `bsi-fis-superfici.js` | 18 kB | Fotofisica (Jablonski, Stern-Volmer), isoterme di adsorbimento (Langmuir, Freundlich, BET), polimeri. |
| `bsi-mat-statistica.js` | 27 kB | Statistica di laboratorio: t, F, Grubbs, Dixon, propagazione delle incertezze, retta di taratura con LOD e LOQ. |
| `bsi-nmr2d.js` | 21 kB | NMR bidimensionale: COSY, HSQC editato e HMBC, costruiti camminando il grafo sulle due predizioni per atomo. |
| `bsi-moldraw.js` | 44 kB | Spettro NMR interattivo: zoom, tabella di assegnazione, collegamento picco↔atomo, cronologia SMILES/InChI, uscite CSV/JCAMP-DX/PNG. |
| `bsi-documento.js` | 23 kB | Apertura di qualunque documento — PDF, immagini, testo, Word, OpenDocument, PowerPoint, Excel — con l'elenco esplicito di cio' che NON si e' potuto leggere. |
| `bsi-quesito.js` | 19 kB | Riconoscimento dei dati spettroscopici nel testo di un quesito, con la provenienza di ogni dato, e svolgimento passo per passo tramite bsi-elucida.js. |
| `bsi-spettrolettore.js` | 104 kB | Lettore di spettri: JCAMP-DX con compressione ASDF, ricerca dei picchi per prominenza, assegnazione delle bande IR, perdite neutre, apertura di documenti. |
| `bsi-mol3d.js` | 42 kB | Visore 3D delle molecole: animazione di formazione, selezione degli atomi, misura di angoli, lunghezze e diedri. |
| `bsi-lingue.js` | 208 kB | Motore di internazionalizzazione: quattordici lingue, verso di scrittura compreso. |
| `bsi-molingue.js` | 54 kB | Linguaggi chimici: venticinque uscite da SMILES, con nomenclatura IUPAC su una classe dichiarata. |
| `bsi-pannelli-lingua.js` | 66 kB | Pannelli delle lingue e dei linguaggi chimici. |
| `sw.js` | 7 kB | Service Worker: funzionamento offline e strategia di rete. |
| `rdkit_lab.html` | 260 kB | Laboratorio di chemioinformatica. |
| `astro.html` | 2660 kB | Modulo di astrochimica. |
| `chimorga.html` | 194 kB | Modulo di chimica organica. |
| `proxy/spectra-proxy.js` | 10 kB | Proxy opzionale (Cloudflare Worker) per le chiamate all'AI. |

### Impronte

| File | SHA-256 |
|---|---|
| `index.html` | `21f31fe126a9cda00b1aa762670e275b67882b7805baaca51af6087ef745de95` |
| `bsi-ai-hub.js` | `9979f49378cafa4c1bfb141946cd9dccc6f342ebefc2e946617ddba7a81e57de` |
| `bsi-spettri.js` | `be757f15a70f884e3374d401596e2dfd18bcc852cafbb4584920e2b2d24eb3c9` |
| `bsi-cheminfo.js` | `59a3111b3b9436add5376fde1be6f90ded3dc08c095cebdc04da50c7f8268bbc` |
| `bsi-pretsch.js` | `27f727240363579fba3dba50ab3b567fbcdb26a8a9a06c0e43968b195c479db3` |
| `bsi-nmr.js` | `881917dbb141dfcbab9a25b9c518eaa4a8c1c52dc1020cbac90985a1cf859b72` |
| `bsi-geom3d.js` | `a616b91efa8f790388c99f22cc9f2d48630cb760d4f7fa87f92b99b9db106054` |
| `bsi-fisica-comune.js` | `8ec1678339245dcbd3f416807d0840bc8b5caebe6f99c39a510bbffa68353584` |
| `bsi-fis-schrodinger.js` | `b032084511102c7231bcb244b5bb647128a080a18e9e6d706ec4c727ac29d17d` |
| `bsi-fis-hartreefock.js` | `8210d2a1501fe6e3f57c0ce8a0e6d5d78432274792833d50bc2e821fc7566fde` |
| `bsi-fis-rotovib.js` | `428182687a76111f013986127ee49beb7393498387b146bd0694ff16bea7d909` |
| `bsi-fis-termostat.js` | `0bb9f04d7d5b144791764fa4efd9f8e658be5b5d78b40f94e18752c2366589a9` |
| `bsi-fis-dinamica.js` | `f1d76c737ce7f75cdc9c75665194180a4cdf401e47a105583838f31c85c9b906` |
| `bsi-fis-matematica.js` | `616a2d4f338fe1d371f5ba3fd4fe569e94b2d94626a8d323bba8ae58f8550f62` |
| `bsi-fis-cristalli.js` | `f5283d63ff075ddc19f9d200194528366f38294909db5872e7604b46e0a7d7d5` |
| `bsi-fis-nucleare.js` | `8ae148a2f37a40f6902faa4148e44468b4d659b6c7d1230378de92c2703a5874` |
| `bsi-mat-cas.js` | `eea3a1eef74d31d3fde78b7e4a2795169e8af0f357edc10050eb98d8eaf386ac` |
| `bsi-mat-basi.js` | `db30e16c58bde3638f13de5c3311a00598628676b7b418dc023b175efa77c214` |
| `bsi-mat-funzioni.js` | `68f8780d4fb4fcda6f028e4749adef333253efbf270d0caab47def5bdf30c66c` |
| `bsi-mat-calcolo.js` | `c3363448c4d773d29c4f680eddb79e9ad55a5eb87b033a728754df8cbee2a631` |
| `bsi-mat-lineare.js` | `da33ea18f2b14c21c6e630be4a1ccfe2e35e911489bdd4ededd60c0f533ac94f` |
| `bsi-mat-ode.js` | `698725d49dc2bf862161914e41d38c3fafd33069021eae3b11b4973c146b52ce` |
| `bsi-mat-multi.js` | `1040861c3b9d340febe8c4a78d212b168eb42752ee22589facf8566a401234d7` |
| `bsi-mat-complessi.js` | `52a2ac5594a697d3a008d9fd629bee60fcff96ea76aa16c2ccda63eafd43f316` |
| `bsi-mat-risolutore.js` | `709349e1d81f03506c02b9b05a060d8d3801dc37183c0e3894cc93c0aafe9f0c` |
| `bsi-mat-esame.js` | `de4af253244bd7d610b1a3607297d1678a529504afa23d7123aebe042e1f2c27` |
| `bsi-fis-esame.js` | `c9ffb883e94a07b7cda3777b34d6141bd4c47bb3c9857218a9a37f65f8728947` |
| `bsi-percorsi.js` | `0aaec13e42cde2983c83900b3ffe715e785e5a0e6104c365215da4e6ec95705f` |
| `bsi-mat-probabilita.js` | `4518252496dfee0770f9e939ef2de831ac463d2d994d96d40776c59f10cd417b` |
| `bsi-mat-visiva.js` | `cb624f3e1e6c6df94c287f961d0f21a9d8ec852e8245ff5aeed09a083f2c5b14` |
| `bsi-fis-em.js` | `b20c7103f1253c76691c7cf91eae6c83491148f0aeb0928a78495a3dba270c7c` |
| `bsi-fis-suono.js` | `fead9e5dde961fc56c3a649cce6e8eed23046f327c8392dbfd8de5024cf0a1bf` |
| `bsi-fis-solido.js` | `5b6a023a84434f6fd52167e1de7a025342915d7d3287173db89901b503641cd4` |
| `bsi-chi-distillazione.js` | `8d13592cf7523c1dd159d3e954947a4956e44539308312dc97cd3588207fcfc0` |
| `bsi-chi-voltammetria.js` | `4db1a71e0ac3569b821f6cc5280470453f3a4df5c62b9695a3339367c5aa3e41` |
| `bsi-fis-astro.js` | `64901258a641c54ee99a862990a7e5d86acc5c2367408bb38db9371a39c7363e` |
| `bsi-fis-relativita.js` | `276d4e4c2df5b416fc4af4b29fa10e8670cb1b7ff8279e192abba7c1015b18ce` |
| `bsi-fis-fluidi.js` | `65d94ea45133f9537fd3af0feb96b12539a866cde8c12a29cb48c5156b001b9e` |
| `bsi-mat-vettoriale.js` | `fc3116f45b849118cf41c23f13cc2c07f1d9bdd03341baf6cc81b152a5b6225e` |
| `bsi-chi-cinetica.js` | `8ba3ad927e4a1858779ffd8ba798c1211a844475b1ad4b571cd1acfd41ea30b0` |
| `bsi-fis-meccanica.js` | `07d67eb501958079347fa1905a9c212ca2a588c5d1930f615bd0bd07b36a9279` |
| `bsi-fis-onde.js` | `23bc4412088de214ad1f6f2671c2507eadd08ff252f21966f557c31ed6dae073` |
| `bsi-fis-circuiti.js` | `098679cdbb52241b6035e23076c82a25fe3d9a72b6f5bf7d4f880f887223f375` |
| `bsi-fis-termo.js` | `c04fc820b4d874b41b18407b200410d8b8862b3e20f8813660ad009f6af67d3b` |
| `bsi-mat-numerici.js` | `8656bdf657dcc3468f78951ed3d8e1056d953b147e04595c6bfaad647fa8ca93` |
| `bsi-mat-geometria.js` | `609bf6c951d438aa0b0639fd2e736a52b340a363294ee564acfe9510966334be` |
| `bsi-chi-equilibrio.js` | `de2368be8299a4ebdce9401b77c7bea390208f1372460f17f033e27d0ead88af` |
| `bsi-lab3d.js` | `bb6a60e7c7ede603c4d7a3e152a92417ff88e66df068f718320e82de0f51badd` |
| `bsi-vista-molecole.js` | `4a7eb7cd7d8a0033ad0381d936d8e36b2b2e6b75af04988ecc5e9f4e8022cbc4` |
| `bsi-assistente.js` | `00053872ed83218c81b8867b075a5142c6108dbc1f41e7693df1e9aa0897c4f8` |
| `bsi-chi-esame.js` | `ddb5d73fcf887e03770b3f0794fecaa2f8c918f4fae445bf57ff7a637f4643e7` |
| `bsi-fis-elettrodi.js` | `249bb92ac39b78e916eaa0ecf80a2b1aac5d10249bb6b51628f61839c4b64240` |
| `bsi-fis-superfici.js` | `3daec64d2c4755e70279b8ef2f433e4c98d6e90ff7d8c7d9c0689a24f080abd8` |
| `bsi-mat-statistica.js` | `0b0c82afa13173b84308589cf16fbaa8b30c5e575fd8fdee00034b70c34d17fc` |
| `bsi-nmr2d.js` | `a0b1db87f27ffa8c124d617e4903f61e35b89c30c35162527ad023325c03fa78` |
| `bsi-moldraw.js` | `45cacdca20c8091cbfb32e256c179de8c32c71068a5d1008fbef9be005b5df0e` |
| `bsi-documento.js` | `0e9ad6043a396652549b30879764cc401f8b7bd25689b5bb5f37cf26f7d7d8d9` |
| `bsi-quesito.js` | `6f686abcfdc3959d8c865a3e6ee7129224de52992ab1ba3da07372a986769cdf` |
| `bsi-spettrolettore.js` | `14daf41305b0a7271c6ff5f7c9078a4e5f0e0149f32460a9608ed1996f810256` |
| `bsi-mol3d.js` | `93fea4a6811ba4263de450db4e7ae1801d4fde196cf7683d0100846c51751893` |
| `bsi-lingue.js` | `bbbf575cec3d5d498a010b6fb530cda3fb02340c3c0e07e8ca9fcbada9f86933` |
| `bsi-molingue.js` | `e45fec1ee20e3e7b9a7bea3d6e20aa4e33e74ec43578bfa7bfb94646b7bc53fb` |
| `bsi-pannelli-lingua.js` | `4af94d70ef104cf21be18ff7fbc7a2248c56e376e2ae48e8cac83878f4554f93` |
| `sw.js` | `4d8643ce1f3a44859897e02eae8cad03ad188c05beea9e60442004f17fd0c7b0` |
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

_Generato il 2026-10-23T20:15:30.481Z._
