# Distinta dei componenti software (SBOM)

**BioSpecInfo** · documento generato da `tools/genera-sbom.js`.

| | |
|---|---|
| Versione applicazione | `bsi-v269` |
| Commit | `7f4da6bcd2894f59f3c1bcb65474282d4c5f5a19` |
| Generato (UTC) | `2026-11-25T06:36:58.733Z` |
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
| `index.html` | 4727 kB | Applicazione principale: interfaccia, sezioni didattiche, dati chimici. |
| `bsi-ai-hub.js` | 450 kB | Agente AI «Spectra»: ciclo agentico, strumenti, gestione dei fornitori. |
| `bsi-spettri.js` | 36 kB | Motore di predizione spettrale IR/NMR su grafo molecolare. |
| `bsi-cheminfo.js` | 125 kB | Motore di chemioinformatica: standardizzazione, impronte, raggruppamento, PCA, modelli QSAR con modello nullo. |
| `bsi-pretsch.js` | 37 kB | Le tabelle di stima NMR trascritte intere da Pretsch–Bühlmann–Badertscher, 4ª ed.: benzeni ¹³C e ¹H, etileni, alcani, alchini, alifatici ¹³C, correzioni steriche, ¹J(C,H). Solo numeri, nessun codice. |
| `bsi-nmr.js` | 57 kB | Predizione NMR ¹H e ¹³C assegnata per atomo: applica le tabelle di bsi-pretsch.js camminando l'anello e misurando le distanze, con composto di riferimento ciclico ed equivalenza chimica per codice d'intorno. |
| `bsi-geom3d.js` | 46 kB | Coordinate 3D da uno SMILES per geometria delle distanze, con gli stessi indici del predittore NMR: è la condizione del collegamento picco↔atomo↔3D. |
| `bsi-fisica-comune.js` | 33 kB | La casa comune delle sezioni di fisica: intestazione, schede, cursori, grafici su tela, lingua. |
| `bsi-fis-schrodinger.js` | 38 kB | Equazione di Schrödinger 1D: differenze finite, bisezione di Sturm, iterazione inversa, Crank-Nicolson, Morse delle molecole reali. |
| `bsi-fis-hartreefock.js` | 48 kB | Hartree-Fock ristretto con base STO-3G: integrali di McMurchie-Davidson, funzione di Boys, SCF con DIIS, orbitali molecolari. |
| `bsi-fis-rotovib.js` | 34 kB | Spettri rotovibrazionali IR e Raman delle biatomiche dalle costanti molecolari; differenze di combinazione. |
| `bsi-fis-termostat.js` | 11 kB | Termodinamica statistica: funzioni di partizione, entropia, capacità termica, popolazioni di Boltzmann. |
| `bsi-fis-dinamica.js` | 26 kB | Dinamica molecolare di Lennard-Jones 2D: velocity Verlet, termostato, viriale, distribuzione radiale. |
| `bsi-fis-matematica.js` | 24 kB | Matematica per la chimica: FFT del FID, Hückel, Runge-Kutta per le cinetiche, minimi quadrati con gli errori. |
| `bsi-fis-cristalli.js` | 44 kB | Cristallografia: reticoli di Bravais, indici di Miller, diffrattogramma di polvere con fattore di struttura ed estinzioni. |
| `bsi-fis-nucleare.js` | 14 kB | Radiochimica: equazioni di Bateman, datazione radiometrica, formula semiempirica di Weizsäcker. |
| `bsi-mat-cas.js` | 67 kB | Motore di calcolo simbolico: analizzatore, frazioni esatte, forma canonica, derivate, primitive verificate, serie troncate, limiti. |
| `bsi-mat-basi.js` | 26 kB | Basi di matematica: cifre significative, logaritmi e pH, equazioni con i passaggi, allenamento. |
| `bsi-mat-funzioni.js` | 17 kB | Studio di funzione: dominio, zeri, estremi, flessi, asintoti; famiglie e trasformazioni. |
| `bsi-mat-calcolo.js` | 34 kB | Derivate con le regole, integrali e somme di Riemann, polinomi di Taylor, limiti. |
| `bsi-mat-lineare.js` | 54 kB | Algebra lineare in frazioni esatte: Gauss-Jordan con i passi, determinante, inversa, autovalori, bilanciamento come nucleo. |
| `bsi-mat-ode.js` | 38 kB | Equazioni differenziali: campo di direzioni, Eulero/Heun/RK4, piano delle fasi ed equilibri dallo jacobiano. |
| `bsi-mat-multi.js` | 38 kB | Funzioni di più variabili: superfici, punti critici con l'hessiano, relazioni di Maxwell, differenziali esatti. |
| `bsi-mat-complessi.js` | 37 kB | Numeri complessi (piano di Argand, radici, Eulero) e serie di Fourier. |
| `bsi-mat-risolutore.js` | 110 kB | Risolutore d’esame di matematica: svolgimento passo per passo di 16 tipi di esercizio. |
| `bsi-mat-esame.js` | 56 kB | Esame di Istituzioni di Matematiche I e II: programma, risolutore, appelli svolti, simulazione. |
| `bsi-fis-esame.js` | 135 kB | Esame di Fisica Generale I e II: programma, 48 modelli di problema, prove svolte. |
| `bsi-percorsi.js` | 9 kB | Percorsi di studio dalle superiori al dottorato per chimica, fisica e matematica. |
| `bsi-mat-probabilita.js` | 34 kB | Probabilità in movimento: Galton, limite centrale, Monte Carlo, Bayes. |
| `bsi-mat-visiva.js` | 24 kB | Matematica visiva: trasformazioni lineari, epicicli di Fourier, frattali, mappa logistica. |
| `bsi-fis-em.js` | 44 kB | Elettromagnetismo in movimento: cariche, induzione, generatore, onde EM. |
| `bsi-fis-suono.js` | 18 kB | Suono e acustica con Web Audio: armoniche, timbro, Doppler, decibel. |
| `bsi-fis-solido.js` | 33 kB | Semiconduttori: Fermi-Dirac, drogaggio, giunzione p-n, LED. |
| `bsi-chi-distillazione.js` | 17 kB | Distillazione: Antoine, van Laar, McCabe-Thiele, Rayleigh. |
| `bsi-chi-voltammetria.js` | 12 kB | Voltammetria ciclica simulata: diffusione e Butler-Volmer. |
| `bsi-mat-numeri.js` | 16 kB | Numeri e crittografia: crivello, Euclide, aritmetica modulare, RSA, distribuzione dei primi. |
| `bsi-mat-grafi.js` | 22 kB | Grafi e ottimizzazione: Dijkstra, Kruskal, discesa del gradiente, programmazione lineare. |
| `bsi-mat-serie.js` | 32 kB | Successioni e serie: limite ε–N, criteri, riordino, raggio di convergenza. |
| `bsi-mat-variazioni.js` | 51 kB | Calcolo delle variazioni: brachistocrona, catenaria, catenoide, Fermat. |
| `bsi-mat-topologia.js` | 57 kB | Topologia: caratteristica di Eulero, superfici, poligoni fondamentali, nodi. |
| `bsi-mat-algebra.js` | 45 kB | Strutture algebriche: gruppi diedrali, permutazioni, campi finiti, Lagrange. |
| `bsi-mat-giochi.js` | 36 kB | Teoria dei giochi: Nash, dilemma ripetuto, minimax, Nim. |
| `bsi-mat-logica.js` | 46 kB | Logica e calcolabilità: tavole di verità, circuiti, macchina di Turing, insiemi. |
| `bsi-mat-inferenza.js` | 39 kB | Statistica inferenziale: intervalli, test e potenza, regressione, bootstrap. |
| `bsi-mat-noneuclidea.js` | 66 kB | Geometrie non euclidee: sfera, disco di Poincaré, curvatura e trasporto parallelo. |
| `bsi-fis-gravita.js` | 35 kB | Gravitazione: N corpi con Verlet, punti di Lagrange, fionda gravitazionale. |
| `bsi-fis-calore.js` | 17 kB | Calore e diffusione: equazione del calore 1D e 2D, Newton, pareti. |
| `bsi-fis-ising.js` | 26 kB | Modello di Ising: Metropolis, transizione di fase, isteresi. |
| `bsi-fis-particelle.js` | 59 kB | Fisica delle particelle: Modello Standard, conservazione, massa invariante, vite medie. |
| `bsi-fis-analitica.js` | 40 kB | Meccanica analitica: spazio delle fasi, doppio pendolo, Noether, Liouville. |
| `bsi-fis-laser.js` | 35 kB | Laser e ottica quantistica: soglia, modi della cavità, Rabi, Mach–Zehnder. |
| `bsi-fis-clima.js` | 34 kB | Fisica del clima: bilancio radiativo, forzante della CO2, ghiaccio-albedo, Coriolis. |
| `bsi-chi-fasi.js` | 38 kB | Diagrammi di fase: acqua e CO2 (IAPWS, Span-Wagner), eutettico, Clapeyron. |
| `bsi-chi-pes.js` | 33 kB | Superficie di energia potenziale LEPS di H + H2 e traiettorie. |
| `bsi-articoli-nobel-fisica.js` | 118 kB | Spiegazioni per argomento dei Nobel per la fisica (nessun dato). |
| `bsi-articoli-premi-matematica.js` | 123 kB | Spiegazioni per argomento dei premi Abel e Fields (nessun dato). |
| `bsi-materie.js` | 15 kB | Pulsanti per cambiare materia: chimica, fisica, matematica. |
| `bsi-fis-astro.js` | 42 kB | Astrofisica: diagramma H-R, corpo nero, sistema solare, esopianeti, cosmologia. |
| `bsi-fis-relativita.js` | 30 kB | Relatività ristretta: Minkowski, gemelli, dinamica. |
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
| `bsi-astro-wormhole.js` | 33 kB | Spaziotempo curvo e wormhole: curvatura e maree, metrica di Morris–Thorne, materia esotica, Casimir, dilatazione del tempo. |
| `bsi-orbitali.js` | 39 kB | Laboratorio degli orbitali: funzioni d'onda idrogenoidi esatte, isosuperficie al 90 %, fase come colore, sovrapposizioni nel tempo, corrente di probabilità, H₂⁺ LCAO. |
| `bsi-elementi3d.js` | 36 kB | Gli elementi in 3D: nuvola elettronica di Slater per sottoguscio, nucleo con protoni e neutroni, configurazioni della tabella, righe di emissione NIST, tavola periodica e sequenza. |
| `bsi-astro-materiaoscura.js` | 53 kB | Materia oscura e lenti gravitazionali: rete cosmica 3D, lente calcolata per pixel sulla GPU, rete neurale addestrata nel browser con fit fisico, curve di rotazione. |
| `bsi-astro-materiaoscura-fisica.js` | 17 kB | Calcolo della materia oscura: cosmologia ΛCDM (Planck 2018), spettro BBKS con σ₈, FFT 3D, rete cosmica di Zel'dovich, lenti puntiforme, SIS, SIE e NFW, curve critiche e caustiche, curve di rotazione. |
| `bsi-astro-viaggio.js` | 41 kB | Dal Sole alla Galassia: zoom logaritmico continuo con posizioni vere, flusso di Rankine, nube di Oort, Via Lattea, bolle di Fermi ed eROSITA. |
| `bsi-orbitali-cinema.js` | 27 kB | Onde di fase e correnti: isosuperficie a reticolo per rotazione del contorno, scie della corrente di probabilità, onda di fase, anello di de Broglie. |
| `bsi-ar.js` | 33 kB | Realtà aumentata unificata: esportatori GLB e USDZ, WebXR su Android, Quick Look su iPhone, pulsante AR nelle scene 3D. |
| `bsi-astro-eliosfera.js` | 37 kB | L'eliosfera: spirale di Parker, shock di terminazione, eliopausa di Rankine, gas interstellare, nastro di IBEX, Voyager. |
| `bsi-med-fisiologia.js` | 26 kB | Fisiologia come sistema: ciclo cardiaco a elastanza variabile, acido–base con i compensi, modello minimo di Bergman, scambi gassosi. |
| `bsi-farm-quantitativa.js` | 22 kB | Farmacologia quantitativa: due compartimenti, dosi ripetute, farmacodinamica di Hill, indice terapeutico, interazioni di Rowland–Matin. |
| `bsi-mat-mappa.js` | 19 kB | Mappa dei prerequisiti di matematica: 41 argomenti su quattro livelli, percorso per ordinamento topologico. |
| `bsi-fis-scene3d.js` | 35 kB | Scene fisiche 3D: H₂ nella curva di Morse con moto esatto e nuvola σg, magnetosfera di Dungey con magnetopausa di Shue e ovali aurorali calcolati, reticolo elastico di Kelvin. |
| `bsi-spectra-ponte.js` | 21 kB | Ponte WebSocket con Spectra Prime (spectra_core): telemetria della scena 3D, comandi load/update/toggle_layer/focus, risposte e direttive all'avatar. |
| `bsi-spectra-nucleo.js` | 44 kB | Spectra come nucleo olografico a forma di particella: nucleoni, nuvola elettronica dagli orbitali dell'idrogeno, elettroni, guscio esagonale, anelli HUD, stati con transizioni morbide, HUD in DOM, versione 2D. |
| `bsi-spectra-cervello.js` | 16 kB | La rete neurale di Spectra disegnata come un cervello: regioni con i ricordi veri, quote, sinapsi, stato interno. |
| `bsi-cosmo-core.js` | 16 kB | Simulazioni cosmiche: motore comune (timeline cinematica, HUD, didascalie, 9:16, registrazione webm). |
| `bsi-cosmo-h2.js` | 16 kB | H₂: Morse sui dati misurati, moto esatto, nuvola LCAO campionata esattamente, legame che si rompe. |
| `bsi-cosmo-geodetiche.js` | 14 kB | Geodetiche nulle di Schwarzschild con RK4, ΔE/E calcolato, cielo deformato dall'equazione della lente. |
| `bsi-cosmo-galassia.js` | 20 kB | Galassia a particelle test: Hernquist + Freeman + NFW, leapfrog, curva di rotazione misurata, con e senza materia oscura. |
| `bsi-cosmo-reticolo.js` | 10 kB | Reticolo 3D deformato dalla massa (visualizzazione), rilassamento con oscillatori smorzati, satellite kepleriano. |
| `bsi-cosmo-telo.js` | 11 kB | Telo di gomma (analogia) con orbite N corpi Velocity Verlet e lancio di un corpo. |
| `bsi-cosmo-eliosfera.js` | 15 kB | Eliosfera dal modello adattato alle Voyager, vento solare, eliche dei pianeti, Galassia schematica. |
| `bsi-cosmo-vialattea.js` | 9 kB | Via Lattea sul telo con il profilo del potenziale vero (Hernquist + Freeman + NFW). |
| `bsi-cosmo-scala.js` | 18 kB | Simulazione cosmica 3: il Sole come pallina da tennis, scala 1 : 20,8 miliardi, le stelle vicine e il vuoto calcolato. |
| `bsi-cosmo-sole.js` | 14 kB | Simulazione cosmica 1: foglio di corrente eliosferico, magnetosfera di Dungey e Shue, ovale aurorale calcolato, tende aurorali. |
| `bsi-astro-spaccato-scenari.js` | 36 kB | Dati degli Spaccati stellari: stadi, composizioni, reazioni bilanciate, fonti (WHW02, Sackmann 1993, Nadyozhin 1994, Kasen 2017, PDG). |
| `bsi-astro-spaccato-eventi.js` | 59 kB | Quattordici eventi cosmici in più per gli Spaccati stellari (nascita di una stella, nane brune e rosse, Cefeidi, novae, lampi X, pulsar e magnetar, distruzioni mareali, lampi gamma, instabilità di coppia, GW150914, quasar, cristallizzazione delle nane bianche, ricombinazione) con i numeri calcolati e le fonti. |
| `bsi-chim-meccanismi3d.js` | 53 kB | Meccanismi 3D: otto reazioni organiche come film (atomi, legami parziali, frecce degli elettroni, cariche, profilo energetico vivo). |
| `bsi-mat-animazioni.js` | 37 kB | Animazioni matematiche: Fourier, Riemann, Taylor, derivata, Eulero, Galton, Buffon, Fibonacci, e, con i numeri calcolati. |
| `bsi-spectra-elevenlabs.js` | 30 kB | La voce di Spectra con ElevenLabs: coda, interruzione, testi lunghi a pezzi, cache, errori e ripiego; diretta o tramite il proxy (POST /voce). |
| `bsi-bio-lab3d-dati.js` | 105 kB | Biochimica 3D Lab, i dati: sette vie passo per passo con i carboni seguiti, i 12 capitoli della dispensa d'esame, Michaelis–Menten e inibitori, ossigrafo e rotore dell'ATP sintasi. |
| `bsi-bio-lab3d.js` | 98 kB | Biochimica 3D Lab: ATP sintasi rotante con l'ossigrafo, enzimi e cinetica, vie metaboliche in 3D con i carboni colorati, teoria d'esame e quiz. |
| `bsi-risoluzione.js` | 6 kB | La risoluzione di tutte le animazioni: 4K supercampionata, nativa o risparmio, con il limite di 3840 px; aggiorna al volo i renderer three.js e le tele 2D; foto PNG in 4K. |
| `bsi-quantum-studio-dati.js` | 53 kB | Quantum Studio, i dati e i modelli: 13 aree, 16 moduli, Morse, NMR, dose–risposta, PCA, Van Deemter, PES, Hodgkin–Huxley, Rabi, n-cubi, Calabi–Yau, Gibbs. |
| `bsi-quantum-studio.js` | 10 kB | Quantum Studio, la base: stile, testi 3D, kit di disegno, registro dei motori. |
| `bsi-quantum-studio-motori.js` | 26 kB | Quantum Studio, i motori 1–7: ATP sintasi, enzimi, orbitali, SN2, NMR, recettore, PCA. |
| `bsi-quantum-studio-motori2.js` | 28 kB | Quantum Studio, i motori 8–16: CRISPR, paracetamolo, HPLC, PES, Hodgkin–Huxley, qubit, n-cubi, Calabi–Yau, Gibbs. |
| `bsi-quantum-studio-pagina.js` | 18 kB | Quantum Studio, la pagina: sezione squantum, palco 3D con grafico, cursori, teoria, ponte SPECTRA_3D_BRIDGE e strumento quantum_studio. |
| `bsi-spectra-voce-live.js` | 32 kB | Spectra Prime: assistente vocale full-duplex collegato al Quantum Studio (SPECTRA_3D_BRIDGE). AudioWorklet 16 kHz, riproduzione 24 kHz, VAD e barge-in, HUD olografico, tre strumenti vocali, riconnessione. |
| `bsi-inorganica-quantum-dati.js` | 23 kB | Inorganica quantistica, i solutori: regole di Slater, metodo di Hückel (determinante secolare, Jacobi), SALC con soglia energetica, complessi in tripla teoria VBT+CFT+LFT. |
| `bsi-inorganica-quantum.js` | 31 kB | Inorganica quantistica, la pagina 3D: quattro schede (Slater, Hückel, SALC, complessi) con modello 3D e report calcolato; strumento inorganica_quantica. |
| `bsi-arrowlab.js` | 44 kB | Arrow Lab e Retrosintesi: lavagna SVG per le frecce curve dei meccanismi (propanone+NaBH₄, SN2) con verifica passo per passo, e pianificatore retrosintetico con percorsi, chimica verde e inventario; strumento arrow_lab. Offline. |
| `bsi-astro-spaccato.js` | 113 kB | Motore degli Spaccati stellari: corpo tagliato a spicchio, strati a cipolla, ciambella della composizione, orologio, evento finale; strumento per Spectra. |
| `bsi-cosmo-sezione.js` | 1 kB | La sezione «Simulazioni cosmiche» con le schede-anteprima. |
| `bsi-costruttore.js` | 45 kB | Costruttore molecolare 3D e AR: atomi legati al tocco, valenze e cariche, VSEPR, campo di forze con raggi covalenti di Cordero, anelli aromatici, esportazione MOL/XYZ e realtà aumentata. |
| `bsi-fis-motore.js` | 17 kB | Il motore in spaccato: ciclo Otto ad aria standard con manovellismo, flussi proporzionali, bilancio e dettaglio p–V. |
| `bsi-fis-spaccati.js` | 38 kB | Gli spaccati tecnici di fisica: circuito a due maglie con Kirchhoff e deriva nel rame, laser Nd:YAG con bilancio di potenza e quattro livelli, giunzione p–n con il campo integrato da Poisson. |
| `bsi-teoria-a.js` | 174 kB | Dati della teoria per sezione: chimica, spettroscopia, farmacologia. |
| `bsi-teoria-b.js` | 138 kB | Dati della teoria per sezione: biochimica e chimica fisica. |
| `bsi-teoria-c.js` | 174 kB | Dati della teoria per sezione: fisica. |
| `bsi-teoria-d.js` | 188 kB | Dati della teoria per sezione: fisica moderna e astrofisica. |
| `bsi-teoria-e.js` | 206 kB | Dati della teoria per sezione: matematica. |
| `bsi-teoria-f.js` | 134 kB | Dati della teoria per sezione: chimica fisica e analitica. |
| `bsi-teoria-g.js` | 12 kB | Dati della teoria per sezione: spaziotempo e wormhole. |
| `bsi-teoria-h.js` | 90 kB | Dati della teoria per sezione: orbitali, eliosfera, materia oscura, fisiologia, farmacologia quantitativa, mappa dei prerequisiti. |
| `bsi-teoria.js` | 19 kB | Teoria di ogni sezione: pulsante, scheda di lettura, indice e ricerca, strumento leggi_teoria per Spectra. |
| `bsi-chim-hammett.js` | 19 kB | Equazione di Hammett: costanti σ (Hansch, Leo, Taft 1991), cinque reazioni con ρ, previsioni di k/k₀ e pKa, ρ ricavato dai dati. |
| `bsi-fis-foucault.js` | 15 kB | Pendolo di Foucault (Runge–Kutta nel riferimento terrestre), precessione per latitudine, deviazione di Coriolis. |
| `bsi-mat-frenet.js` | 23 kB | Curve nello spazio: curvatura, torsione, triedro di Frenet, cerchio osculatore, lunghezza d'arco; curve scritte dall'utente. |
| `bsi-astro-chimica.js` | 29 kB | Chimica di una nube interstellare (formazione e fotodissociazione di H₂ e CO) e equazione di Saha con le classi spettrali. |
| `bsi-chem-mappe.js` | 47 kB | Mappa dello spazio chimico (t-SNE esatto sulle distanze di Tanimoto) e deconvoluzione di picchi (Levenberg–Marquardt). |
| `bsi-fis-spin.js` | 55 kB | Spin, qubit ed entanglement: Stern-Gerlach, sfera di Bloch, CHSH, BB84. |
| `bsi-fis-statistica.js` | 47 kB | Meccanica statistica: Schottky, Maxwell-Boltzmann, Fermi e Bose, Einstein e Debye. |
| `bsi-fis-nuclei.js` | 49 kB | Nuclei e reazioni: valle di stabilità, valori Q, tunnel, nucleo 3D, reattore. |
| `bsi-fis-materiali.js` | 48 kB | Elasticità e materiali: trazione, travi, Eulero, suono nei solidi. |
| `bsi-fis-elettronica.js` | 48 kB | Elettronica: raddrizzatori, diodi e Zener, emettitore comune, operazionali, ADC e DAC. |
| `bsi-mat-edp.js` | 75 kB | Equazioni alle derivate parziali: corda, membrana, calore, Laplace, Burgers. |
| `bsi-mat-analisicomplessa.js` | 70 kB | Analisi complessa: colorazione del dominio, mappe conformi, Joukowski, residui. |
| `bsi-mat-markov.js` | 65 kB | Catene di Markov e processi stocastici: PageRank, rovina del giocatore, passeggiate, code. |
| `bsi-mat-svd.js` | 58 kB | SVD e algebra lineare applicata: SVD 2×2 e 3×3, compressione, PCA, minimi quadrati. |
| `bsi-mat-codici.js` | 60 kB | Codici e curve ellittiche: Hamming, CRC, curve su ℝ e F_p, ECDH. |
| `bsi-spectra-live.js` | 126 kB | Spectra Live: console vocale, comandi locali, lettura dello schermo, nove strumenti dell'agente. |
| `bsi-spectra-androide.js` | 45 kB | Volto di Spectra sul modello «Noir»: testa e bocca animate, 17 emozioni da 11 campi espressivi. |
| `bsi-spectra-mente.js` | 17 kB | Mente di Spectra: memoria locale, stato interno, pensieri (simulazione di comportamento). |
| `bsi-spectra-agenda.js` | 36 kB | Agenda di Spectra: promemoria, compiti, eventi, date dette a parole, continuità per il modello, memoria esportabile. |
| `bsi-spectra-risveglio.js` | 64 kB | Risveglio di Spectra: sequenza di avvio, meteo (Open-Meteo), punto alle 8 e alle 20, batteria, rete neurale della memoria. |
| `bsi-spectra-memoria.js` | 27 kB | Memoria di Spectra a cinque livelli (IndexedDB): recupero a sei segnali, consolidamento giornaliero, procedure, diario, strumento cerca_nella_memoria. |
| `bsi-spectra-robot.js` | 20 kB | Volto di ripiego: testa di androide costruita in three.js. |
| `bsi-spectra-volto.js` | 16 kB | Volto di ultimo ripiego: ritratto vettoriale SVG. |
| `bsi-lezione.js` | 33 kB | Lezione guidata con Spectra per ogni sezione: capitoli dalle schede, comandi mostrati al lavoro, riflettore, verifica dal kit di studio. |
| `bsi-spectra-voce.js` | 20 kB | Voce di Spectra: audio TTS (con chiave OpenAI) in una catena Web Audio (bassi, metallo, stanza) e labiale dall'audio; ripiego sulla sintesi del browser. |
| `bsi-spectra-corpo.js` | 49 kB | Driver del corpo di Spectra per qualunque avatar umanoide (ossa, blendshape ARKit, capelli neri, sguardo, gesti, passo, seduta) e manichino riggato di prova. |
| `bsi-spectra-olointerattivo.js` | 76 kB | Ologramma interattivo di Spectra: spettri IR/¹H/¹³C/massa/UV di molecole di riferimento o della traccia scritta, con attribuzione di ogni segnale; universo con dati NASA, Keplero e vis-viva; matematica e fisica con lo svolgimento dell'assistente; ogni passaggio spiegato a voce e per iscritto. |
| `bsi-spectra-esplora.js` | 42 kB | «⚡ Esplora con Spectra»: una sezione per materia nello stile delle lezioni esplorabili, dieci capitoli dalle superiori al PhD avanzato con previsione, cursore che ricalcola, visione dal vivo nell'ologramma e spiegazione completa. |
| `bsi-spectra-spiega.js` | 36 kB | «🧠 Spiega»: la spiegazione completa ed esaustiva di chimica, fisica e matematica dalle superiori al PhD avanzato, anche di ciò che è sullo schermo (testo, valori, tabelle e immagine di spettri, grafici e scene 3D); senza modello mostra ciò che l'app sa da sola. |
| `bsi-spectra-figura.js` | 63 kB | Spectra col corpo in un modulo solo: il controllore del corpo (incorporato nell'app e impacchettato, rig, viso «Noir» allineato) usato dallo studio e la figura nelle sezioni dell'AI, che pensa, parla e gesticola con le risposte. |
| `bsi-spectra-rig.js` | 35 kB | Rig automatico nel browser per le figure umanoidi senza scheletro: misura, scheletro con nomi Mixamo, pesi della pelle (distanza, normale, geodetica), testa tolta col cappuccio, ricolorazione in blu notte. |
| `bsi-spectra-studio-lezioni.js` | 34 kB | Lezioni dello studio di Spectra (predici → testa → dimostra → rivela): caduta, forma dell'acqua, problema di Basilea, con calcoli verificati. |
| `bsi-spectra-creatore.js` | 11 kB | Spectra riconosce il suo creatore: prova con la frase segreta confrontata come impronta SHA-256 (deterrente, non controllo d'accesso). |
| `bsi-aggiorna.js` | 5 kB | «Controlla aggiornamenti»: versione in uso dal service worker, versione pubblicata da sw.js. |
| `bsi-fis-fluidi.js` | 31 kB | Fluidi: Venturi e Bernoulli, viscosità e Stokes, capillarità. |
| `bsi-mat-vettoriale.js` | 43 kB | Calcolo vettoriale: campi, Green, gradiente. |
| `bsi-chi-cinetica.js` | 31 kB | Cinetica complessa: reazioni composte, oscillanti, strutture di Turing. |
| `bsi-fis-meccanica.js` | 37 kB | Meccanica in movimento: proiettile con l’aria, urti, pendolo vero, oscillatori accoppiati. |
| `bsi-fis-onde.js` | 33 kB | Onde e ottica: sovrapposizione, lenti e specchi, diffrazione. |
| `bsi-fis-circuiti.js` | 17 kB | Circuiti: transitori RLC, corrente alternata, filtri e Bode. |
| `bsi-fis-termo.js` | 44 kB | Termodinamica in movimento: cicli, gas di particelle, moto browniano. |
| `bsi-mat-numerici.js` | 24 kB | Metodi numerici: zeri, integrazione, EDO, interpolazione con gli ordini misurati. |
| `bsi-mat-geometria.js` | 24 kB | Geometria analitica e vettori: vettori, rette e piani in 3D, coniche. |
| `bsi-chi-equilibrio.js` | 27 kB | Equilibrio chimico e Le Chatelier: simulatore cinetico e K(T). |
| `bsi-lab3d.js` | 70 kB | Laboratorio 3D: superfici, orbitali |ψ|², moti nello spazio, strutture cristalline e piani di Miller, linee di campo (three.js). |
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
| `bsi-lingue.js` | 279 kB | Motore di internazionalizzazione: quattordici lingue, verso di scrittura compreso. |
| `bsi-molingue.js` | 54 kB | Linguaggi chimici: venticinque uscite da SMILES, con nomenclatura IUPAC su una classe dichiarata. |
| `bsi-pannelli-lingua.js` | 66 kB | Pannelli delle lingue e dei linguaggi chimici. |
| `sw.js` | 11 kB | Service Worker: funzionamento offline e strategia di rete. |
| `rdkit_lab.html` | 260 kB | Laboratorio di chemioinformatica. |
| `astro.html` | 2661 kB | Modulo di astrochimica. |
| `chimorga.html` | 195 kB | Modulo di chimica organica. |
| `proxy/spectra-proxy.js` | 15 kB | Proxy opzionale (Cloudflare Worker) per le chiamate all'AI. |

### Impronte

| File | SHA-256 |
|---|---|
| `index.html` | `3b569c479e68a1e0c4b1d5f7c6c34d5d0c02a298cfd7bdc04126b38e738207bd` |
| `bsi-ai-hub.js` | `84f74de7a3db60c3912cdd088945185dfebbbfc6c38a072c653a4ee2a5027b7d` |
| `bsi-spettri.js` | `36911b64fd173917f9151c8ef82fc1c6f903eb93205fc851f20534a46d958921` |
| `bsi-cheminfo.js` | `59a3111b3b9436add5376fde1be6f90ded3dc08c095cebdc04da50c7f8268bbc` |
| `bsi-pretsch.js` | `27f727240363579fba3dba50ab3b567fbcdb26a8a9a06c0e43968b195c479db3` |
| `bsi-nmr.js` | `881917dbb141dfcbab9a25b9c518eaa4a8c1c52dc1020cbac90985a1cf859b72` |
| `bsi-geom3d.js` | `a616b91efa8f790388c99f22cc9f2d48630cb760d4f7fa87f92b99b9db106054` |
| `bsi-fisica-comune.js` | `44760cd853891e01013d21747c85fbb957e523270a6872cdfce8de6366c36e18` |
| `bsi-fis-schrodinger.js` | `9954f7b14d9c84a2539480c2e61b468f2c37c72d03b3a6147d414c9870480d9b` |
| `bsi-fis-hartreefock.js` | `14ed82aa2b49f594be17309fdcd3c64fafac2906de952a5e04b474e3b444710d` |
| `bsi-fis-rotovib.js` | `0ce3ad61451a86506e9e653776d73b9e2cd21986c84a00e65db0fb6290ebbdde` |
| `bsi-fis-termostat.js` | `0bb9f04d7d5b144791764fa4efd9f8e658be5b5d78b40f94e18752c2366589a9` |
| `bsi-fis-dinamica.js` | `21d875c1ec03df186b800561bb6d03d64d25ba6a17df2954ee63cd018d04a290` |
| `bsi-fis-matematica.js` | `d798151cd43cf8a10e6a661b2d80044e45eadf200a943aa53d61a6bd48bd3533` |
| `bsi-fis-cristalli.js` | `bece779514a8fcfd912ce5008cfacea4dfd522b79f8cb0ddd95b543ca464c9e2` |
| `bsi-fis-nucleare.js` | `8ae148a2f37a40f6902faa4148e44468b4d659b6c7d1230378de92c2703a5874` |
| `bsi-mat-cas.js` | `eea3a1eef74d31d3fde78b7e4a2795169e8af0f357edc10050eb98d8eaf386ac` |
| `bsi-mat-basi.js` | `db30e16c58bde3638f13de5c3311a00598628676b7b418dc023b175efa77c214` |
| `bsi-mat-funzioni.js` | `68f8780d4fb4fcda6f028e4749adef333253efbf270d0caab47def5bdf30c66c` |
| `bsi-mat-calcolo.js` | `3d5cff0520cf385dfe35af1b3f916a66c5afb4ff60d880f04123ac5fe73a9279` |
| `bsi-mat-lineare.js` | `a84ca3fb6720da50f474633152b84e03e1d2287e3271cdadca790b735c69d686` |
| `bsi-mat-ode.js` | `bfbb1528e5d025d7492c69503115dc0dfb1c50fbbd6735133306ad1327830163` |
| `bsi-mat-multi.js` | `5a025543a12c66994e8ac08a2705da5761eac8bbcc5a5be471536372762b2e37` |
| `bsi-mat-complessi.js` | `8ad8fff97934e7224d97523decec29bb3b4bc4631dc20cc6ea78a0caec69320b` |
| `bsi-mat-risolutore.js` | `709349e1d81f03506c02b9b05a060d8d3801dc37183c0e3894cc93c0aafe9f0c` |
| `bsi-mat-esame.js` | `de4af253244bd7d610b1a3607297d1678a529504afa23d7123aebe042e1f2c27` |
| `bsi-fis-esame.js` | `c9ffb883e94a07b7cda3777b34d6141bd4c47bb3c9857218a9a37f65f8728947` |
| `bsi-percorsi.js` | `950c686202f2934009827bc300c787063b325528b7d5ab5385a8ab3b6706345c` |
| `bsi-mat-probabilita.js` | `adc628789ec90772c14ce0e61aed74981cf60b261ac15ff6076d1d4b3e8d0bec` |
| `bsi-mat-visiva.js` | `8b95de6d41dc7c363d562c372b35ec8b61620c5af7bceb8884cf8b011a2ed57e` |
| `bsi-fis-em.js` | `1c45fb608ccda1e500ab3038998cee4cb9c27b091c0b1d1b4f7af0137bf9a6ab` |
| `bsi-fis-suono.js` | `fead9e5dde961fc56c3a649cce6e8eed23046f327c8392dbfd8de5024cf0a1bf` |
| `bsi-fis-solido.js` | `bd2fa03fccfe2198757c0828e53edf50a2cf97636e28e69e419662085fa9b223` |
| `bsi-chi-distillazione.js` | `5bcf3c3064bb8b7dd66be3f34f15deb8cf4b08fe12ce92133d0db1622a16b0e7` |
| `bsi-chi-voltammetria.js` | `4db1a71e0ac3569b821f6cc5280470453f3a4df5c62b9695a3339367c5aa3e41` |
| `bsi-mat-numeri.js` | `f30d041cd9963342aa476e128e4b29d543e113d3483253377ea486de3d46484f` |
| `bsi-mat-grafi.js` | `2b9c4c377ae6702dd2101927e5d0470759566e40549145e4786be504e965bf18` |
| `bsi-mat-serie.js` | `722b1a1b7397b7710689af555d1fd60de73ee405f5061819d9e59d7f4631d060` |
| `bsi-mat-variazioni.js` | `ccb7379618067a0412d27fe95cb19d5823e0c0b739a371afc7cc69f162a5ca7a` |
| `bsi-mat-topologia.js` | `87a8df768b8fa968608b52462df4340484ccaeb7ed3e6a987987a62603ceb8fa` |
| `bsi-mat-algebra.js` | `59d66b5c6be431f49e5808e5c78758a7ca3cc33fba6155e56457f13dec14e237` |
| `bsi-mat-giochi.js` | `d1ae8048acab5a518f1ca9c9ef31e4c9346459c7a0d83ec935733a57465c4b72` |
| `bsi-mat-logica.js` | `26cfc591156a6c232dd40938252ce238374a6a678f08557d3bcfa899a5d0785e` |
| `bsi-mat-inferenza.js` | `4dadc036537e3833e396ab5dfa9968f0ccab398ccc18959ab474e6652d27e43c` |
| `bsi-mat-noneuclidea.js` | `a687dbe43e91cacc5b2287af6e135188363e49644cd870b48db9b4a66d555119` |
| `bsi-fis-gravita.js` | `195d35280eb3484f0374b9e51801e96634c797ba21209fce1bdb7b8aed867e33` |
| `bsi-fis-calore.js` | `81b9c1c60c7ba5a022f2f95e36ac17274ed1e2027d0ba36bcc24f8d6243ad3b8` |
| `bsi-fis-ising.js` | `8ccd29082a4388ce63bdc1e39d9aa5fa92322e378384df0951d98bde6fe79b8c` |
| `bsi-fis-particelle.js` | `4dce551cb464150e0faae0bcddcea8340596921873104503bd6a2dd10b41140c` |
| `bsi-fis-analitica.js` | `579eb7e744d6011f35b5751ac091ea5b896c17d4d1812165893be4c355bf62c2` |
| `bsi-fis-laser.js` | `dd11045b8e99d4f34e2204b6b6a8b354738eb05d2741426560ac8b938bdc1fd4` |
| `bsi-fis-clima.js` | `8e136c02f7559cd22d57ccd857d06f8d6a6a89b2f38790d2782e6a45a7f2c822` |
| `bsi-chi-fasi.js` | `99854760b11db89cf853bb4c2be08d00f018fb510fd6a56aff1c3006e68ed1af` |
| `bsi-chi-pes.js` | `c4e74b909e7987275930b05c0c25cdc0968bcf338ea78a144bc7ff949a821e36` |
| `bsi-articoli-nobel-fisica.js` | `afc22b073e64168605b3d792cd83bcdf7d838e0c80548a0a58caae98456d7d30` |
| `bsi-articoli-premi-matematica.js` | `d62f01d66783d7fb558684959abd1cda2f81ee6885c8cdc0879559f2b64cbf43` |
| `bsi-materie.js` | `077f0f39435df36bcf9180d689ab8b23059ef0d684d51881692adee881778967` |
| `bsi-fis-astro.js` | `4c905bafddaa31d69cf9c70186ff84c45a95a029d108d1a51aec1015307be12e` |
| `bsi-fis-relativita.js` | `d90cb347a69e668fde69df4805815938f8da8b9a5f288ce7a16914aa0fec32bd` |
| `bsi-materie-app.js` | `a9d57912a69bf7c599a6c4d16be815be4e654ab424daeca0e12f02c00904911f` |
| `bsi-attrezzi.js` | `dedf9939e96c9544239f5769b68f0547604aff78e3ee3f47906afddcf1e20a38` |
| `bsi-studio.js` | `aa1c97df67465affd4f7d0c96240b0d0ae6dd9d8c8dd6bf3c93abe9cef49e377` |
| `bsi-studio-fisica.js` | `973bab09dad47980f0d411aef35ff0378f2266030c3fcb14e1cefe64eb63531b` |
| `bsi-studio-matematica.js` | `3a2d88a7f9cea52bc5c46bf86018904b2d032320726988759b3e0fb84110c5c7` |
| `bsi-risorse-materie.js` | `03e2fa89af1157985cdab1a08c60153ed57d8c648a5f7b67cd3f5d910c43e417` |
| `bsi-astro-sistemasolare.js` | `d59c52b7135d020d67a8163e9bc4d0cecea2446df93aa66389f0477a2a908ef7` |
| `bsi-astro-orbite.js` | `32c8123ac5a7b39a9a4a816713d0305a9d90ddb8fb714614fcbba3eb3e834c4b` |
| `bsi-astro-matcelesti.js` | `b2ee40c8a53fb25baf42020693539d91dc5278a14436115c69643470d57cda56` |
| `bsi-astro-stelle.js` | `84064a5bdf8fdc1111011201cf97a11a47396acbd3c7442d52e2c5ba74a388a3` |
| `bsi-astro-buchineri.js` | `25180d5dad3142dc823c67781930a061749e6f6d8777b3619e24713b1bce6e38` |
| `bsi-astro-ondegrav.js` | `dcbc8ea2e45f55a463ea344c26e0de8e0aa6a14f6adc73d6b2a2e43aee9736db` |
| `bsi-astro-galassie.js` | `893eee603ec4af64ceaf440f3a22da3dab77a55333911e80e06212459e5f7125` |
| `bsi-astro-cosmo.js` | `356152c5251593c68e8dd66b1182f5ee3f7c5f4f1cb26c722bdd384f8fe66d47` |
| `bsi-astro-cielo.js` | `26b3e33cefe7d1606d0abf8d47be6d7d9b412891ab193d386835d4e40f9fdcf6` |
| `bsi-astro-esopianeti.js` | `5a540d026927fc13f0081f3ba4cbfcb6de4c44056530571c77574e71f9003a49` |
| `bsi-astro-wormhole.js` | `8a3501b1cda54586eb626d760dbf6f095c302851f0cd8d045b51a2287114bfb9` |
| `bsi-orbitali.js` | `52cdd6a8ed949ea7b5d9849e0606bdbaa67700b856bbf5655c3f5219e34d42be` |
| `bsi-elementi3d.js` | `7a5a8bc2ded2b503e8e3aa1fe1b13b1c2fc99f2969b4db30da544a33bac25cda` |
| `bsi-astro-materiaoscura.js` | `c2afb8668ef5f9a219c975285ce3530432fb06fbadd1ed5d90282fe88d09d24e` |
| `bsi-astro-materiaoscura-fisica.js` | `cf2aafd6a31d157487da6c810be87a3da455a3e57e691cdebeb79ccf2df35f59` |
| `bsi-astro-viaggio.js` | `ffe4571f8ddc703748d04bba1d72f8453964c2ffeb89b92c4716204947287a1a` |
| `bsi-orbitali-cinema.js` | `49ef811dd19c742cce558abbe60937d60716e1d2502ccace42fcbb46c7fbc3d8` |
| `bsi-ar.js` | `d271fdbcf9ef0cfe0c92f34eeb4cb61a749340e10f6beaff1b584e60e13240e0` |
| `bsi-astro-eliosfera.js` | `9f1eef05b2f55b5305bf1e8f0e387e73a3345af08a392ec07d5b9ab0c73edb1e` |
| `bsi-med-fisiologia.js` | `cb0ad121cb2cc7171ae94a37a59a0308514332fd2e5394314c60654e4da2f7f4` |
| `bsi-farm-quantitativa.js` | `a32733c0abbe6010eba25d5ddd1d4c942f9ff75c51a5d4a7676bd251fb90a7ca` |
| `bsi-mat-mappa.js` | `46d113d070be7ccd09d8c70f9d7564a300e44206b53974bf9bb2cf0083658842` |
| `bsi-fis-scene3d.js` | `80c94966971b487609012a9c329194cb46316af5f80fbdd12c21a07dd082e69d` |
| `bsi-spectra-ponte.js` | `9d5d10e17383625b199eeb0c4b22748cf96b19ca87b470a0e00eea4287ebd206` |
| `bsi-spectra-nucleo.js` | `edf6e8b86124d23b3eb857795dbe72f238a864d87cbf34422a58df5b6213d942` |
| `bsi-spectra-cervello.js` | `63256150f3f8d592b3e807dfbd49f204ede84946cad1d768c0ad895503df0ba7` |
| `bsi-cosmo-core.js` | `47894f1a6f592477196878a3122fef69a58cc72695b60e874392a828da1368b3` |
| `bsi-cosmo-h2.js` | `e4b6605e11026675df475965a527631a45b21873037acaae88428e058c802334` |
| `bsi-cosmo-geodetiche.js` | `7f4d7c28d7b885bfbc4f975204a8e1fde25725831fe6e49e1ab00dc4736dcaee` |
| `bsi-cosmo-galassia.js` | `710507b978cfbfda6c47e0d4c5e17e243f8e17c57187e6c28afaf796883716de` |
| `bsi-cosmo-reticolo.js` | `ddfbd1b57fb6006d3769d666ac49e242ca8cc30bb9b3d7fb28bd46a904f0e605` |
| `bsi-cosmo-telo.js` | `de06734502cfdb87690a42e50703a83a7cc27937809b9941871d3949d4e30829` |
| `bsi-cosmo-eliosfera.js` | `e465be9eb3f90e104cde6d61df459a2b3f64e5341de6889f6fdf7c4fe4cd975d` |
| `bsi-cosmo-vialattea.js` | `8779043478333f22f11cc6f7dd3b221a8c25ac965abd1743a78ac60e3895e1ca` |
| `bsi-cosmo-scala.js` | `dafa8333109408c5c3c27602e2c072188d1c96bfbc9a2e160ee112d94abb5438` |
| `bsi-cosmo-sole.js` | `914cd12a6b11a5fa65a1f77ba1e3e2de0f788d04d9bc3f7198940b1db186fce9` |
| `bsi-astro-spaccato-scenari.js` | `a4022dcc6b6ea9aaec48c0438757ea918399acf2e6c7bb833567342d0471e18b` |
| `bsi-astro-spaccato-eventi.js` | `17874d4997fe2d2f29dac8e7d0d3d0f8daa20656f0eb94a51a32225e0e141b50` |
| `bsi-chim-meccanismi3d.js` | `1fdbfcff7e3bd69446c3ef91b0c316a79d3f497eb3b54a817a4988669a708eb0` |
| `bsi-mat-animazioni.js` | `a87daee0bee2a87f72d81807d244fe69cef42ec2f5921cc95442b6edf1d2cf24` |
| `bsi-spectra-elevenlabs.js` | `8f2ea8d10773f33ca514c2fc3831639e21efa039f1d9ba9d9e2e7aa26f27ca54` |
| `bsi-bio-lab3d-dati.js` | `672a11a6d5f19ce174f78cb870023b238050026325a6ea3aab758ce8a5e296f2` |
| `bsi-bio-lab3d.js` | `f2017a270a7504150bb9ed866ebee8de7f6bd6edcac86e51d19e04f7900c6503` |
| `bsi-risoluzione.js` | `7b7595c2e794fe0c438c987de54f50311976a6e341a7346e03854bcd77770b58` |
| `bsi-quantum-studio-dati.js` | `8fda6aa46d3c26a7cc894f7310250158628508932d78cf9c8b8f615ef04fa1ab` |
| `bsi-quantum-studio.js` | `bd40c1c222ce166e94b046d64f28bbae9e2fb233297d445598cc1baa5e6b59a5` |
| `bsi-quantum-studio-motori.js` | `0ea37761f590008c0fce248c6426752c459f6279c792a31cabe20a770a8c31c1` |
| `bsi-quantum-studio-motori2.js` | `aa1fbf91017bd55ef17207caeafa1bab0cf4f43f716582fabeacc78ce4f689a2` |
| `bsi-quantum-studio-pagina.js` | `d1fa018d390a0d7582fe77af285bdfa94e4b34c64327989d959233833927a77a` |
| `bsi-spectra-voce-live.js` | `61864bd0a6d23b8b931c46eb793cac4126901dad114bb313040381c2f7847253` |
| `bsi-inorganica-quantum-dati.js` | `5b2dc4e8eec36c63e93c27af1d9bab71f1765a3ceafca17166d5f96229353f1b` |
| `bsi-inorganica-quantum.js` | `6841a0dd90fb24d8b4c83ace2d23114e966696741285bfa82cc89723cfb4ec0a` |
| `bsi-arrowlab.js` | `a0bd203a9c827db5e22ef379530744f6835184c91d60d74595cbf65ae43f0bee` |
| `bsi-astro-spaccato.js` | `84996d27c77c0aaf2cf2774914d62787b318467a1ce543f0be877046ffdff88e` |
| `bsi-cosmo-sezione.js` | `41ff5ee439c53082972eb3ddf8cce1aa0cec6eff84ea909a922fedcce0c5021a` |
| `bsi-costruttore.js` | `69425b32b8041e94e4d031bde46b648a163b2258894083892fcbd9d6dad251e3` |
| `bsi-fis-motore.js` | `ea1fc78972b6bb1fe95c784b3876cdc45bce32d43f5765bb6de6114fa7342ac3` |
| `bsi-fis-spaccati.js` | `d844ebe26d182fa193e1c6cf7f531241ee4d0d6038ac11bae570ea75d0c758b3` |
| `bsi-teoria-a.js` | `0ba0332aeffec0436d33cf12c9e27954ac214233efc1c50068f06eaabb208e84` |
| `bsi-teoria-b.js` | `90d286234ee20a7196d12716bab1b33d636af950051dfbf93ee859285124396e` |
| `bsi-teoria-c.js` | `727e6d0c7df27adc70a0230a9f9d8fe24c576ebcccf359aea06572ec166259c6` |
| `bsi-teoria-d.js` | `a073487caee19010fb362621d14124caa63e66f04a4f89e5d29057657752abc4` |
| `bsi-teoria-e.js` | `cbdd56af03008bb1b14d25693e924dcc5fd3d4d8b2d866ce80ca9ce02bf89735` |
| `bsi-teoria-f.js` | `82de383a52f65b6f897139e36c26e4df0aac9ef7e73180e9192cafdb63fc0678` |
| `bsi-teoria-g.js` | `e1a573f57fdaac6fdfedb8b1ee4d5059a11f0178a75317b4d50c6b220231d2cd` |
| `bsi-teoria-h.js` | `7a5a813417a2445d28217f2550422e0a93b1c11e6ae90a2c7bb64623688b1a68` |
| `bsi-teoria.js` | `cf049a56873408a35f0ca1854dc841454477cb8fe8f12ba59719c7085437ec61` |
| `bsi-chim-hammett.js` | `2a2a7077ed6d6e8026d10c68a69b7227835c857e697f650d5d83567701e3b351` |
| `bsi-fis-foucault.js` | `c4ddd93939cf0756de4506b898ce6d4f9142c3d41b5e263580f5f010db3e3f85` |
| `bsi-mat-frenet.js` | `105d3c64787c01b8eae79983c53f943207de6c3c84f4a9d5821f43d0e8d2b9bd` |
| `bsi-astro-chimica.js` | `28d88175973c82e3736e24e231efa1a2b67db0c6bd4b52e358f189b3d4b4c464` |
| `bsi-chem-mappe.js` | `594d53b5a6675791d66df42d0d3dead84e670b4672f962392f9241c5ce8b8add` |
| `bsi-fis-spin.js` | `a24dc05385fbff4826a02f95315ae1d8c57c8ee555da868a08620f24127fe3ad` |
| `bsi-fis-statistica.js` | `b4fd532901c0ed72d0d104c85d686d534cc90b59eacd8eaaed98255cfea553b2` |
| `bsi-fis-nuclei.js` | `bcbc7d29175e7d69b9743decb36d021680fd53a892fd9959d7d808d54d396914` |
| `bsi-fis-materiali.js` | `b2869b83fa17200da5f3900abf6959214df0dd6f88c4d8d02be88d5a6d832269` |
| `bsi-fis-elettronica.js` | `8620e8ba116f1d3edb3a487a7bf2aab869fbf1afc2230462e251062e7a2bf61d` |
| `bsi-mat-edp.js` | `525fae4f04fcc0ec7884ebba30e47d013c972a5ff77b1088ab4bca41bd04a50b` |
| `bsi-mat-analisicomplessa.js` | `0eb6e5181471af7e85eb3ee42012daddbe1fdac932c0c4c28cf67135875302d8` |
| `bsi-mat-markov.js` | `0e122fac691f1faa2e464214a7d24c9a687b16491c5964b760e0df191b13a35b` |
| `bsi-mat-svd.js` | `ce6d77e921c469c532f9f6de2689f7b2a8c8de656f18ee32b1fc4e1977538931` |
| `bsi-mat-codici.js` | `9aaf44beb1922a95239285067941899e6ae4424024546c8b38dc2663e5f091b2` |
| `bsi-spectra-live.js` | `b13e893460758540b5baa30b978df2a94415eddd836a0075bd2f5cd247bd5e48` |
| `bsi-spectra-androide.js` | `cb20786c198a6f172b396edd0b5b6d4ac0ec80bc3cb2cc916d2b2dad8392cfec` |
| `bsi-spectra-mente.js` | `29a9666fb7278adcd8747060927f29403b53b47ab00e5d2b5dc6e9ccff311436` |
| `bsi-spectra-agenda.js` | `cbe3490cc58c8612279f84b63bf1c8be9162404829f2ae866ef7ed831b39af7c` |
| `bsi-spectra-risveglio.js` | `a31c753d468eb92d7c639b0b7600d08c3dbce57b2a9c821d5951928e8b361b5b` |
| `bsi-spectra-memoria.js` | `02ad82dced9bb4b176734d96408153150cd35b7d0e2919f3db48aed6789bc8e3` |
| `bsi-spectra-robot.js` | `aad16296bfe21f1298ba8eb6bcc6fc59dd67afa859519f06bb75c64c48c370e3` |
| `bsi-spectra-volto.js` | `7061605f2d7e124d2a80ec2f19531b7fa32fed843b60ca3d07843f4926105bf6` |
| `bsi-lezione.js` | `9d254c1cfaaf0c9ea5ec33086e71c665941f352378a14c874e27b3cb7e8f861a` |
| `bsi-spectra-voce.js` | `939b04d4e3bb4b1c22b83fce5f121ffc948473ba9224de58c7e343159ceb869b` |
| `bsi-spectra-corpo.js` | `ae8e5ea95d2a8946b7318d5ac4f4e3646297a4ebeeb30924d8f8c1bd0110a04f` |
| `bsi-spectra-olointerattivo.js` | `ba6124d18d5899c81d43aab328e6373b60cf944666fb73fee83d0e4b20fd92b7` |
| `bsi-spectra-esplora.js` | `abca4cd053689e2499c90a0937b300d4c1abea3635cf6bcd6b1c117f1fa97d76` |
| `bsi-spectra-spiega.js` | `789b3560c1372da180a86a486e9ce26f1d471768d39bd39fe1c6f55b85dc8b95` |
| `bsi-spectra-figura.js` | `a5b6a07017272f03242211486cacb144f04a74b41870ef698b06b599046126b7` |
| `bsi-spectra-rig.js` | `fcdd67c468f543a6e98f682d49c45b26173bb987c1aa529cb63d4e3e2a40918b` |
| `bsi-spectra-studio-lezioni.js` | `a7344a2b7a62986827dff100a44676d10daa841d76af97b056b796657a991a9c` |
| `bsi-spectra-creatore.js` | `73954030d3fac2a5b12fd26c92f61a1c8bb986813941d33fb6b154e8cf89bee2` |
| `bsi-aggiorna.js` | `5950d90103a7d603175e4b577e2394bb9a6d006a4ff22e48d4a1cc70661f1b8e` |
| `bsi-fis-fluidi.js` | `33b66d5c555b28b0b65224aef0d23b1f113fdc402ef58e00de4e2c630e38fc7f` |
| `bsi-mat-vettoriale.js` | `ced5e1917ee286455c37ca008c9154b74118ef40021c7df6b97561437c544fdb` |
| `bsi-chi-cinetica.js` | `e1a42d19404deb16f0c9cf9ac19de6b0970c955ec7b4427c4838ca97705bf3b4` |
| `bsi-fis-meccanica.js` | `a73522108a4fdcd7b99719157b87111af8520f219c3a086d6d73eee6fefed569` |
| `bsi-fis-onde.js` | `83ac1416df79f6fde4057382143fce24f9c6bb178f10fd44d44c96c0ffe6660a` |
| `bsi-fis-circuiti.js` | `bf675ed0ae24b8f6584f7b34597fa41d1443c017abb1b324b532ffc90d0c0b4c` |
| `bsi-fis-termo.js` | `726263e95238d76240599d285f0d3fb4bcc5a54c018586b08077a7d5209d12cb` |
| `bsi-mat-numerici.js` | `8656bdf657dcc3468f78951ed3d8e1056d953b147e04595c6bfaad647fa8ca93` |
| `bsi-mat-geometria.js` | `609bf6c951d438aa0b0639fd2e736a52b340a363294ee564acfe9510966334be` |
| `bsi-chi-equilibrio.js` | `15d9d99c63c1db49dc3834b7b1db83f5ad2e03d1b9cc1b2f69cdb8ba6cffcefd` |
| `bsi-lab3d.js` | `28dd9e987c2b2982a4888ba6f90fd95aef8af461ac1fa81f24f63dc0e78bb4f7` |
| `bsi-vista-molecole.js` | `4a7eb7cd7d8a0033ad0381d936d8e36b2b2e6b75af04988ecc5e9f4e8022cbc4` |
| `bsi-assistente.js` | `103375186ee638e89e324a0d737be266c8464df20d763bb85edafe0e6af4daef` |
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
| `bsi-lingue.js` | `34ecc0245295fd350aa6efb2ac47e735aa059a6688ad5221fdeac6b25222949e` |
| `bsi-molingue.js` | `e45fec1ee20e3e7b9a7bea3d6e20aa4e33e74ec43578bfa7bfb94646b7bc53fb` |
| `bsi-pannelli-lingua.js` | `9437192c6a3995425b3ef305ab86c70685011d40d789c2cc45736880a7369186` |
| `sw.js` | `67c85cb222405640c41f3168c5db3fbbe96074b4803dd291e86390f29ce56b55` |
| `rdkit_lab.html` | `6235e377c110c2a772d499fcad7f803af61b85ad25185d1957aca6de501159f7` |
| `astro.html` | `c5e7cd6a133c6e1dc4e3014086980c99bbb24dff5149a2881f8d6f26aa513b43` |
| `chimorga.html` | `1b9044805736ea03a8b2f80afe2a002b2b652e9861a06bfdce788c39789371b0` |
| `proxy/spectra-proxy.js` | `d8d65875a19da8357180c4ac079ce36835b95c2c993c8aec9d97b3f88690b499` |

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
| Open-Meteo (dalla v251) | il meteo di Spectra: riceve solo il nome della città chiesta e le sue coordinate, senza chiave | Spectra dice che il servizio non risponde e non inventa |
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
> (vedi [`LICENSE`](LICENSE)): visibile e valutabile, ma copia, riuso e uso
> commerciale richiedono autorizzazione scritta dell'Autore. Le licenze
> permissive elencate sopra riguardano **soltanto** le librerie di terze parti
> incluse, e non si estendono all'applicazione.

_Generato il 2026-11-25T06:36:58.733Z._
