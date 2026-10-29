# Distinta dei componenti software (SBOM)

**BioSpecInfo** · documento generato da `tools/genera-sbom.js`.

| | |
|---|---|
| Versione applicazione | `bsi-v237` |
| Commit | `7dc3f011df8f8c0646f9eda186923f345f1ca23b` |
| Generato (UTC) | `2026-10-29T08:48:29.952Z` |
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
| **Modello 3D «Noir» (Skyfox13, Sketchfab)**<br><sub>Skyfox13 — https://sketchfab.com/podderkuntal25</sub> | `models/spectra-noir.glb` | CC-BY-4.0 | 8154 kB | Volto di Spectra nella console Spectra Live. Modificato: texture ricompresse, tangenti tolte, viso in metallo grigio scuro, bocca e testa animate. Attribuzione nella console. |

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
| `models/spectra-noir.glb` | `b781b54819d1d2aabf751788a813d8da830dabaddb913085352b572140903479` |

---

## 2. Codice proprio del progetto

| File | Dimensione | Ruolo |
|---|---:|---|
| `index.html` | 4700 kB | Applicazione principale: interfaccia, sezioni didattiche, dati chimici. |
| `bsi-ai-hub.js` | 432 kB | Agente AI «Spectra»: ciclo agentico, strumenti, gestione dei fornitori. |
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
| `bsi-mat-numeri.js` | 16 kB | Numeri e crittografia: crivello, Euclide, aritmetica modulare, RSA, distribuzione dei primi. |
| `bsi-mat-grafi.js` | 22 kB | Grafi e ottimizzazione: Dijkstra, Kruskal, discesa del gradiente, programmazione lineare. |
| `bsi-mat-serie.js` | 32 kB | Successioni e serie: limite ε–N, criteri, riordino, raggio di convergenza. |
| `bsi-mat-variazioni.js` | 38 kB | Calcolo delle variazioni: brachistocrona, catenaria, catenoide, Fermat. |
| `bsi-mat-topologia.js` | 43 kB | Topologia: caratteristica di Eulero, superfici, poligoni fondamentali, nodi. |
| `bsi-mat-algebra.js` | 45 kB | Strutture algebriche: gruppi diedrali, permutazioni, campi finiti, Lagrange. |
| `bsi-mat-giochi.js` | 36 kB | Teoria dei giochi: Nash, dilemma ripetuto, minimax, Nim. |
| `bsi-mat-logica.js` | 46 kB | Logica e calcolabilità: tavole di verità, circuiti, macchina di Turing, insiemi. |
| `bsi-mat-inferenza.js` | 39 kB | Statistica inferenziale: intervalli, test e potenza, regressione, bootstrap. |
| `bsi-mat-noneuclidea.js` | 48 kB | Geometrie non euclidee: sfera, disco di Poincaré, curvatura e trasporto parallelo. |
| `bsi-fis-gravita.js` | 18 kB | Gravitazione: N corpi con Verlet, punti di Lagrange, fionda gravitazionale. |
| `bsi-fis-calore.js` | 17 kB | Calore e diffusione: equazione del calore 1D e 2D, Newton, pareti. |
| `bsi-fis-ising.js` | 14 kB | Modello di Ising: Metropolis, transizione di fase, isteresi. |
| `bsi-fis-particelle.js` | 40 kB | Fisica delle particelle: Modello Standard, conservazione, massa invariante, vite medie. |
| `bsi-fis-analitica.js` | 40 kB | Meccanica analitica: spazio delle fasi, doppio pendolo, Noether, Liouville. |
| `bsi-fis-laser.js` | 34 kB | Laser e ottica quantistica: soglia, modi della cavità, Rabi, Mach–Zehnder. |
| `bsi-fis-clima.js` | 34 kB | Fisica del clima: bilancio radiativo, forzante della CO2, ghiaccio-albedo, Coriolis. |
| `bsi-chi-fasi.js` | 20 kB | Diagrammi di fase: acqua e CO2 (IAPWS, Span-Wagner), eutettico, Clapeyron. |
| `bsi-chi-pes.js` | 17 kB | Superficie di energia potenziale LEPS di H + H2 e traiettorie. |
| `bsi-articoli-nobel-fisica.js` | 118 kB | Spiegazioni per argomento dei Nobel per la fisica (nessun dato). |
| `bsi-articoli-premi-matematica.js` | 123 kB | Spiegazioni per argomento dei premi Abel e Fields (nessun dato). |
| `bsi-materie.js` | 11 kB | Pulsanti per cambiare materia: chimica, fisica, matematica. |
| `bsi-fis-astro.js` | 36 kB | Astrofisica: diagramma H-R, corpo nero, sistema solare, esopianeti, cosmologia. |
| `bsi-fis-relativita.js` | 15 kB | Relatività ristretta: Minkowski, gemelli, dinamica. |
| `bsi-materie-app.js` | 15 kB | Tre app in una: la materia scelta adatta menu ✨, Spectra, Studio e Utility. |
| `bsi-attrezzi.js` | 23 kB | Strumenti rapidi del menu ✨ per fisica e matematica: calcolatrice, derivata, grafico, costante, unità, formula, glossario, quiz. |
| `bsi-studio.js` | 66 kB | Motore dei kit di studio: riassunti, quiz, flashcard di Leitner, formulario, glossario. |
| `bsi-studio-fisica.js` | 306 kB | Dati del kit di studio di fisica (nessun codice). |
| `bsi-studio-matematica.js` | 290 kB | Dati del kit di studio di matematica (nessun codice). |
| `bsi-risorse-materie.js` | 149 kB | Risorse web, bibliografia e citazioni per le tre materie; costanti CODATA e unità; tavole matematiche con le prove. |
| `bsi-astro-sistemasolare.js` | 110 kB | Sistema solare 3D alla data: elementi JPL di Standish, Keplero, Terra, Luna ed eclissi, Giove e Saturno. |
| `bsi-astro-orbite.js` | 69 kB | Meccanica orbitale 3D: elementi e stato, manovre, satelliti, Lambert. |
| `bsi-astro-matcelesti.js` | 60 kB | Matematica celeste: equazione di Keplero, rotazioni e quaternioni, integratori a N corpi, periodogrammi. |
| `bsi-astro-stelle.js` | 63 kB | Vita delle stelle 3D: Lane-Emden, evoluzione, nucleosintesi. |
| `bsi-astro-buchineri.js` | 72 kB | Buchi neri e relatività generale: ray tracing di Schwarzschild, geodetiche, curvatura, Hawking. |
| `bsi-astro-ondegrav.js` | 55 kB | Onde gravitazionali: spirale, chirp, rivelatore, pulsar di Hulse-Taylor. |
| `bsi-astro-galassie.js` | 70 kB | Galassie 3D: tipi di Hubble, curve di rotazione, collisione, Gruppo Locale. |
| `bsi-astro-cosmo.js` | 70 kB | Cosmologia 3D: Friedmann-Lemaître, distanze, CMB, storia termica. |
| `bsi-astro-cielo.js` | 75 kB | Planetario 3D: cielo da un luogo e un'ora, coordinate, precessione, analemma. |
| `bsi-astro-esopianeti.js` | 57 kB | Esopianeti 3D: zona abitabile, transito, velocità radiale, immagine diretta. |
| `bsi-fis-spin.js` | 55 kB | Spin, qubit ed entanglement: Stern-Gerlach, sfera di Bloch, CHSH, BB84. |
| `bsi-fis-statistica.js` | 47 kB | Meccanica statistica: Schottky, Maxwell-Boltzmann, Fermi e Bose, Einstein e Debye. |
| `bsi-fis-nuclei.js` | 49 kB | Nuclei e reazioni: valle di stabilità, valori Q, tunnel, nucleo 3D, reattore. |
| `bsi-fis-materiali.js` | 48 kB | Elasticità e materiali: trazione, travi, Eulero, suono nei solidi. |
| `bsi-fis-elettronica.js` | 48 kB | Elettronica: raddrizzatori, diodi e Zener, emettitore comune, operazionali, ADC e DAC. |
| `bsi-mat-edp.js` | 75 kB | Equazioni alle derivate parziali: corda, membrana, calore, Laplace, Burgers. |
| `bsi-mat-analisicomplessa.js` | 70 kB | Analisi complessa: colorazione del dominio, mappe conformi, Joukowski, residui. |
| `bsi-mat-markov.js` | 65 kB | Catene di Markov e processi stocastici: PageRank, rovina del giocatore, passeggiate, code. |
| `bsi-mat-svd.js` | 58 kB | SVD e algebra lineare applicata: SVD 2×2 e 3×3, compressione, PCA, minimi quadrati. |
| `bsi-mat-codici.js` | 59 kB | Codici e curve ellittiche: Hamming, CRC, curve su ℝ e F_p, ECDH. |
| `bsi-spectra-live.js` | 71 kB | Spectra Live: console vocale, comandi locali, lettura dello schermo, nove strumenti dell'agente. |
| `bsi-spectra-androide.js` | 33 kB | Volto di Spectra sul modello «Noir»: testa e bocca animate, 17 emozioni da 11 campi espressivi. |
| `bsi-spectra-mente.js` | 17 kB | Mente di Spectra: memoria locale, stato interno, pensieri (simulazione di comportamento). |
| `bsi-spectra-robot.js` | 20 kB | Volto di ripiego: testa di androide costruita in three.js. |
| `bsi-spectra-volto.js` | 16 kB | Volto di ultimo ripiego: ritratto vettoriale SVG. |
| `bsi-aggiorna.js` | 5 kB | «Controlla aggiornamenti»: versione in uso dal service worker, versione pubblicata da sw.js. |
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
| `bsi-lab3d.js` | 63 kB | Laboratorio 3D: superfici, orbitali |ψ|², moti nello spazio, strutture cristalline e piani di Miller, linee di campo (three.js). |
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
| `bsi-lingue.js` | 255 kB | Motore di internazionalizzazione: quattordici lingue, verso di scrittura compreso. |
| `bsi-molingue.js` | 54 kB | Linguaggi chimici: venticinque uscite da SMILES, con nomenclatura IUPAC su una classe dichiarata. |
| `bsi-pannelli-lingua.js` | 66 kB | Pannelli delle lingue e dei linguaggi chimici. |
| `sw.js` | 9 kB | Service Worker: funzionamento offline e strategia di rete. |
| `rdkit_lab.html` | 260 kB | Laboratorio di chemioinformatica. |
| `astro.html` | 2660 kB | Modulo di astrochimica. |
| `chimorga.html` | 194 kB | Modulo di chimica organica. |
| `proxy/spectra-proxy.js` | 10 kB | Proxy opzionale (Cloudflare Worker) per le chiamate all'AI. |

### Impronte

| File | SHA-256 |
|---|---|
| `index.html` | `edfc0bb143be1e408a037c80f3f46fe01d49c78f0aad79210d5677f295926165` |
| `bsi-ai-hub.js` | `1bc2fd5a625b8ea2f8fa488a2ed79e7fa52e2d969998a732e408ca30dd3a10c8` |
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
| `bsi-percorsi.js` | `950c686202f2934009827bc300c787063b325528b7d5ab5385a8ab3b6706345c` |
| `bsi-mat-probabilita.js` | `4518252496dfee0770f9e939ef2de831ac463d2d994d96d40776c59f10cd417b` |
| `bsi-mat-visiva.js` | `cb624f3e1e6c6df94c287f961d0f21a9d8ec852e8245ff5aeed09a083f2c5b14` |
| `bsi-fis-em.js` | `b20c7103f1253c76691c7cf91eae6c83491148f0aeb0928a78495a3dba270c7c` |
| `bsi-fis-suono.js` | `fead9e5dde961fc56c3a649cce6e8eed23046f327c8392dbfd8de5024cf0a1bf` |
| `bsi-fis-solido.js` | `5b6a023a84434f6fd52167e1de7a025342915d7d3287173db89901b503641cd4` |
| `bsi-chi-distillazione.js` | `8d13592cf7523c1dd159d3e954947a4956e44539308312dc97cd3588207fcfc0` |
| `bsi-chi-voltammetria.js` | `4db1a71e0ac3569b821f6cc5280470453f3a4df5c62b9695a3339367c5aa3e41` |
| `bsi-mat-numeri.js` | `f30d041cd9963342aa476e128e4b29d543e113d3483253377ea486de3d46484f` |
| `bsi-mat-grafi.js` | `4670e67bd25b97d4c7d2b8e72b03ed8ed4f6e6aa5c1c43dd74c56b437c1c8c33` |
| `bsi-mat-serie.js` | `722b1a1b7397b7710689af555d1fd60de73ee405f5061819d9e59d7f4631d060` |
| `bsi-mat-variazioni.js` | `067d676d0c04d00704b6b9feea4291629feec132d78270569327fe5afb3bb29a` |
| `bsi-mat-topologia.js` | `6690c261fc8b584c399c7af58f6ea2f96a1e9c56da97a0afdc281e7cc69ff14e` |
| `bsi-mat-algebra.js` | `59d66b5c6be431f49e5808e5c78758a7ca3cc33fba6155e56457f13dec14e237` |
| `bsi-mat-giochi.js` | `d1ae8048acab5a518f1ca9c9ef31e4c9346459c7a0d83ec935733a57465c4b72` |
| `bsi-mat-logica.js` | `26cfc591156a6c232dd40938252ce238374a6a678f08557d3bcfa899a5d0785e` |
| `bsi-mat-inferenza.js` | `4dadc036537e3833e396ab5dfa9968f0ccab398ccc18959ab474e6652d27e43c` |
| `bsi-mat-noneuclidea.js` | `4f5751bc0fbd2a1813797656f752fa16760e30032dbbdc4e1695596ec2ea8849` |
| `bsi-fis-gravita.js` | `8ebd280a63f5b80370cc6a9330787ae1bf3058082713f7340f17ac5bc4e4d5d5` |
| `bsi-fis-calore.js` | `81b9c1c60c7ba5a022f2f95e36ac17274ed1e2027d0ba36bcc24f8d6243ad3b8` |
| `bsi-fis-ising.js` | `6ff592edd42ca364589ec0ab1670fa9e502c445042959898e994073a6d6b7161` |
| `bsi-fis-particelle.js` | `0ea36a93387c4000b08ca834a6bdd82f7b232009e84b1b9c9b6ab99726dcdb63` |
| `bsi-fis-analitica.js` | `01b4178998372c6db7d18a312c5a5ed1c8c26267bd0b72ae63ad6fbf92ba2895` |
| `bsi-fis-laser.js` | `8f876f1552b50b22643526a2d16a4a8b0c0bbf5b8d9161d325f38efd16c917fa` |
| `bsi-fis-clima.js` | `8e136c02f7559cd22d57ccd857d06f8d6a6a89b2f38790d2782e6a45a7f2c822` |
| `bsi-chi-fasi.js` | `afa26d00f28caa1d462c5a8cfd74ca33e4595b5cf0b8214ece3d6ddc12140f21` |
| `bsi-chi-pes.js` | `528b9e19a40cdbe601f45d29fb38e71dfdb8a00ccd8360a0abfd320d1a1d01f4` |
| `bsi-articoli-nobel-fisica.js` | `afc22b073e64168605b3d792cd83bcdf7d838e0c80548a0a58caae98456d7d30` |
| `bsi-articoli-premi-matematica.js` | `d62f01d66783d7fb558684959abd1cda2f81ee6885c8cdc0879559f2b64cbf43` |
| `bsi-materie.js` | `763063fb3d3c1e43da8066c6febab6309f889a6550e7da1f45ce1d001c27c314` |
| `bsi-fis-astro.js` | `64901258a641c54ee99a862990a7e5d86acc5c2367408bb38db9371a39c7363e` |
| `bsi-fis-relativita.js` | `276d4e4c2df5b416fc4af4b29fa10e8670cb1b7ff8279e192abba7c1015b18ce` |
| `bsi-materie-app.js` | `a9d57912a69bf7c599a6c4d16be815be4e654ab424daeca0e12f02c00904911f` |
| `bsi-attrezzi.js` | `dedf9939e96c9544239f5769b68f0547604aff78e3ee3f47906afddcf1e20a38` |
| `bsi-studio.js` | `62d001d311fa5a54df8807734bd1c2b389c730b8e6c8a6eb0f29a04d8982f410` |
| `bsi-studio-fisica.js` | `973bab09dad47980f0d411aef35ff0378f2266030c3fcb14e1cefe64eb63531b` |
| `bsi-studio-matematica.js` | `3a2d88a7f9cea52bc5c46bf86018904b2d032320726988759b3e0fb84110c5c7` |
| `bsi-risorse-materie.js` | `03e2fa89af1157985cdab1a08c60153ed57d8c648a5f7b67cd3f5d910c43e417` |
| `bsi-astro-sistemasolare.js` | `d59c52b7135d020d67a8163e9bc4d0cecea2446df93aa66389f0477a2a908ef7` |
| `bsi-astro-orbite.js` | `32c8123ac5a7b39a9a4a816713d0305a9d90ddb8fb714614fcbba3eb3e834c4b` |
| `bsi-astro-matcelesti.js` | `b2ee40c8a53fb25baf42020693539d91dc5278a14436115c69643470d57cda56` |
| `bsi-astro-stelle.js` | `84064a5bdf8fdc1111011201cf97a11a47396acbd3c7442d52e2c5ba74a388a3` |
| `bsi-astro-buchineri.js` | `c75a84cba9be45c5fec1b4f77f4ca79f9d898067006a3c309d951147ddde083c` |
| `bsi-astro-ondegrav.js` | `dcbc8ea2e45f55a463ea344c26e0de8e0aa6a14f6adc73d6b2a2e43aee9736db` |
| `bsi-astro-galassie.js` | `893eee603ec4af64ceaf440f3a22da3dab77a55333911e80e06212459e5f7125` |
| `bsi-astro-cosmo.js` | `356152c5251593c68e8dd66b1182f5ee3f7c5f4f1cb26c722bdd384f8fe66d47` |
| `bsi-astro-cielo.js` | `26b3e33cefe7d1606d0abf8d47be6d7d9b412891ab193d386835d4e40f9fdcf6` |
| `bsi-astro-esopianeti.js` | `5a540d026927fc13f0081f3ba4cbfcb6de4c44056530571c77574e71f9003a49` |
| `bsi-fis-spin.js` | `a24dc05385fbff4826a02f95315ae1d8c57c8ee555da868a08620f24127fe3ad` |
| `bsi-fis-statistica.js` | `b4fd532901c0ed72d0d104c85d686d534cc90b59eacd8eaaed98255cfea553b2` |
| `bsi-fis-nuclei.js` | `3f393cf853d4171beb53153fa2d03da2f526ba40af2b9ad1ce4c4e426678d4db` |
| `bsi-fis-materiali.js` | `b2869b83fa17200da5f3900abf6959214df0dd6f88c4d8d02be88d5a6d832269` |
| `bsi-fis-elettronica.js` | `8620e8ba116f1d3edb3a487a7bf2aab869fbf1afc2230462e251062e7a2bf61d` |
| `bsi-mat-edp.js` | `525fae4f04fcc0ec7884ebba30e47d013c972a5ff77b1088ab4bca41bd04a50b` |
| `bsi-mat-analisicomplessa.js` | `0eb6e5181471af7e85eb3ee42012daddbe1fdac932c0c4c28cf67135875302d8` |
| `bsi-mat-markov.js` | `0e122fac691f1faa2e464214a7d24c9a687b16491c5964b760e0df191b13a35b` |
| `bsi-mat-svd.js` | `ce6d77e921c469c532f9f6de2689f7b2a8c8de656f18ee32b1fc4e1977538931` |
| `bsi-mat-codici.js` | `1be8fa29332df98115db6402881d621c1806599129aa279ee5678ef586445795` |
| `bsi-spectra-live.js` | `1ea2fe073f0b0e8ea5690c2802e26198c83ac8539eaa609754dd18895e56a464` |
| `bsi-spectra-androide.js` | `90ee017923c2899233cd1950e9d63c22dcd8d9daf0fcfc711e3482aa5b6dfcdf` |
| `bsi-spectra-mente.js` | `bd2bd20245ee552520fdc3af471a5850aec2a72c40e0d6d807211c2464e0cf34` |
| `bsi-spectra-robot.js` | `227944042a092f360a6f27e2d8221686101fa6f29514c4e56eb4401d7de5b1b7` |
| `bsi-spectra-volto.js` | `7061605f2d7e124d2a80ec2f19531b7fa32fed843b60ca3d07843f4926105bf6` |
| `bsi-aggiorna.js` | `5950d90103a7d603175e4b577e2394bb9a6d006a4ff22e48d4a1cc70661f1b8e` |
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
| `bsi-lab3d.js` | `9b1424f3ad744cc2abd42be04f9db0907578452ecb66156e2c809a5c774a1604` |
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
| `bsi-lingue.js` | `f08f2a9bd754d9212d69a2a1f8169c0a24ee992ec2af1bcaf54c4ca37b10d229` |
| `bsi-molingue.js` | `e45fec1ee20e3e7b9a7bea3d6e20aa4e33e74ec43578bfa7bfb94646b7bc53fb` |
| `bsi-pannelli-lingua.js` | `4af94d70ef104cf21be18ff7fbc7a2248c56e376e2ae48e8cac83878f4554f93` |
| `sw.js` | `6dc41fca07ff8e6d16ade0ec93989f6e3890378717702f87a677da09fea1e998` |
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

Tutte le licenze dei componenti distribuiti (MIT, BSD-3-Clause, CC0, CC BY 4.0,
Public Domain) sono **permissive** e reciprocamente compatibili. Nessun componente è
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

_Generato il 2026-10-29T08:48:29.952Z._
