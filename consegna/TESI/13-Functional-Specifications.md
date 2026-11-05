# Specifiche funzionali — BioSpecInfo

| Campo | Valore |
|-------|--------|
| **Software** | BioSpecInfo |
| **Versione descritta** | `bsi-v244` |
| **Scopo** | Descrivere cosa fa il prodotto, per chi, con quali regole e con quali limiti. |

---

## 1. Descrizione del prodotto

BioSpecInfo è una piattaforma di **chemioinformatica interattiva** per lo studio
universitario di chimica, biochimica, farmacologia e astrochimica.

L'intera logica scientifica — interpretazione delle strutture molecolari,
predizione spettrale, calcoli, visualizzazione 2D e 3D — viene eseguita **nel
browser dello studente**. Non esiste un server: l'applicazione si installa come
app, funziona senza rete e non trasmette dati.

### 1.1 Obiettivi

| Obiettivo | Come viene perseguito |
|---|---|
| **Accessibilità totale** | Nessuna registrazione, nessun costo, nessun server. Chi apre il collegamento la sta già usando. |
| **Indipendenza dalla rete** | Tutto il necessario è incluso e messo in cache: funziona in aula, in treno, in biblioteca senza campo. |
| **Correttezza verificabile** | I dati scientifici sono sottoposti a controlli automatici; i limiti dei modelli sono dichiarati anziché nascosti. |
| **Riservatezza per costruzione** | Non esiste un backend che possa raccogliere dati: l'assenza di raccolta non è una promessa, è una conseguenza dell'architettura. |

### 1.2 Cosa il prodotto non è

| | |
|---|---|
| **Non è un dispositivo medico** | Non supporta diagnosi, prescrizione né dosaggio (Reg. UE 2017/745) |
| **Non è uno strumento analitico certificato** | Gli spettri sono predizioni, non misure |
| **Non è una piattaforma collaborativa** | Nessun account, nessuna condivisione, nessuna sincronizzazione fra dispositivi |

---

## 2. Attori

| Attore | Descrizione | Cosa può fare |
|---|---|---|
| **Studente** | Utente principale. Studia per un esame universitario. | Tutte le funzioni: consultazione, calcolo, quiz, ripetizione spaziata, assistente AI |
| **Docente** | Usa l'app come supporto alla didattica | Le stesse funzioni; caricamento di materiale proprio nel File Manager |
| **Valutatore tecnico** | Azienda o commissione che esamina il lavoro | Consultazione della documentazione e riesecuzione dei banchi di verifica |

Non esistono ruoli tecnici: non c'è autenticazione, quindi non c'è distinzione
di permessi. Il File Manager ha una protezione locale che è un **deterrente**,
non un controllo d'accesso (vedi §6).

---

## 3. Aree funzionali

L'applicazione conta **197 sezioni**, raggruppate per area di studio.

### 3.1 Spettroscopia

| Funzione | Descrizione |
|---|---|
| **Centro spettroscopico** | Si inserisce una molecola (SMILES, nome, formula) e si ottengono IR, ¹H/¹³C NMR, MS, UV-Vis, Raman, struttura 2D e 3D, gruppi funzionali |
| **Spettri IR visivi** | Bande caratteristiche per classe di composti |
| **Spettro di massa** | Schemi di frammentazione e regole diagnostiche |
| **UV-Vis** | Cromofori, λmax, regole di Woodward |
| **Predizione NMR assegnata per atomo** | Si disegna o si scrive una struttura e si ottengono ¹H e ¹³C con l'indicazione di QUALI atomi producono ogni segnale; spettro interrogabile (zoom, intensità, clic sul picco), tabella di assegnazione, cronologia SMILES/InChI, uscite CSV/JCAMP-DX/PNG |
| **NMR bidimensionale** | COSY, HSQC editato e HMBC costruiti camminando il grafo; cliccando una macchia si illuminano gli atomi che la producono. Non è una simulazione dell'esperimento, e il pannello lo dichiara |
| **Apri un file qualunque, e il programma decide** | Un solo ingresso, senza filtro di estensione: si apre quello che si ha e il programma **dichiara che cosa ha deciso che sia**. Un documento (PDF, fotografia, Word, OpenDocument, PowerPoint, Excel, testo) si apre, se ne vede **tutto** il contenuto (ogni pagina disegnata, tutto il testo), i dati spettroscopici riconosciuti compaiono in tabella **con la loro provenienza**, e lo svolgimento procede passo per passo; un JCAMP-DX o due colonne di numeri diventano uno spettro misurato; un'immagine fa entrambe le cose. Quello che non si è potuto leggere è dichiarato |
| **Cambio lingua in intestazione** | Un pulsante tondo in alto a destra, all'altezza del titolo, con la bandiera della lingua in uso; si apre in un disco con le quattordici bandiere su due gusci e, al centro, il nome della lingua e **quanto è tradotta, misurata**. Il cambio vero resta nel modulo delle lingue: questo è solo il modo di chiamarlo |
| **Spettro da una figura (digitalizzazione)** | Dalla fotografia di un registratore, dal ritaglio di un articolo o dallo schermo dello strumento si estrae la traccia dai **pixel**: la cornice degli assi viene riconosciuta e digitalizzata solo la parte interna, la posizione della linea è il **baricentro pesato sulla scurezza** (subpixel), la griglia viene aggirata per continuità e scurezza, i due assi si tarano in lineare o in logaritmica, la %T si converte in assorbanza con A = −log₁₀T. Il grafico, i picchi e le assegnazioni compaiono da sé e si rifanno a ogni modifica della taratura; una diagnosi dice che cosa è stato deciso e perché. Uscite CSV e JCAMP-DX. Scarto misurato: medio 2,2 cm⁻¹, peggiore 7,3 su sette figure costruite |
| **Modello 3D dalla struttura disegnata** | Coordinate costruite dal grafo, con gli stessi indici del predittore: un picco cliccato illumina l'atomo anche in tre dimensioni |
| **⚛️ Fisica: otto sezioni calcolate** | **Laboratorio di Schrödinger** (stati stazionari di pozzi, oscillatori, Morse e doppia buca; pacchetto d'onda e effetto tunnel con Crank-Nicolson; vibrazioni di HCl, H₂, CO, N₂ in cm⁻¹ confrontate con l'esperimento); **Hartree-Fock in diretta** (RHF/STO-3G nel browser, otto molecole, orbitali disegnati, curve di dissociazione); **spettroscopia rotovibrazionale** (rami P e R con temperatura e isotopi, Raman con la statistica degli spin, lunghezza di legame dalle righe); **termodinamica statistica** (funzioni di partizione, S° e Cp contro NIST-JANAF, popolazioni); **dinamica molecolare** di Lennard-Jones dal vivo; **matematica per la chimica** (FID → spettro con la FFT, Hückel, cinetiche con Runge-Kutta, minimi quadrati di Arrhenius); **cristallografia** (14 reticoli di Bravais, indici di Miller, diffrattogramma di polvere con estinzioni); **radiochimica** (Bateman, datazione, Weizsäcker). Ogni numero è verificato da `test_fisica` contro la letteratura |
| **📐 Matematica: otto sezioni su un motore simbolico** | Un motore di calcolo simbolico scritto per l'app (`bsi-mat-cas.js`: frazioni esatte, forma canonica, derivate con le regole, primitive verificate derivandole, serie di Taylor con l'aritmetica delle serie troncate, limiti) su cui poggiano: **basi** (cifre significative e regole delle misure, logaritmi e pH, equazioni dal primo grado ai polinomi e alle fratte dell'equilibrio, allenamento con correzione); **studio di funzione** (dominio, zeri, estremi, flessi, asintoti, tangente; famiglie e trasformazioni); **derivate, integrali e serie** (regole usate, Riemann, Simpson adattivo, Taylor, limiti destri e sinistri); **algebra lineare** in frazioni esatte con i passaggi di Gauss-Jordan, autovalori, trasformazioni del piano e bilanciamento delle reazioni come nucleo; **equazioni differenziali** (campo di direzioni, ordine dei metodi, piano delle fasi con equilibri classificati dallo jacobiano); **più variabili** (superfici 3D, punti critici, relazioni di Maxwell, differenziali esatti); **complessi e Fourier**; **statistica di laboratorio** (t, F, Grubbs, Dixon, propagazione delle incertezze, retta di taratura con LOD/LOQ) |
| **🎓 Esami UniBA e chimica fisica avanzata** | **Esame di Matematica**: programmi di Istituzioni di Matematiche I e II spiegati, risolutore passo per passo per 16 tipi di esercizio, 16 appelli svolti (64 esercizi), simulazione a tempo. **Esame di Fisica**: programmi di Fisica Generale I e II, 48 problemi tipo risolti con i dati dell'utente (leggi, sostituzioni, unità), 12 prove svolte. **Elettrodi e stato di transizione** (Butler-Volmer, Tafel, Eyring) e **fotochimica, superfici e polimeri** (Jablonski, Stern-Volmer, Langmuir/Freundlich/BET, Mn/Mw, Carothers). **Esame di Chimica** (categoria 🔬): 40 problemi tipo su quattro livelli — base (Chimica Generale e Inorganica), intermedio (Analitica), avanzato (Chimica Fisica), avanzatissimo (Sackur-Tetrode, Debye-Hückel, Pourbaix) — e 7 prove svolte. Matematica e Fisica hanno anche un livello **avanzato e avanzatissimo** (autovalori, sistemi di EDO, Fourier, Laplace, integrali tripli; oscillazioni forzate, onde, Doppler, fotoelettrico, Compton, relatività, corpo nero, particella nella scatola, effetto tunnel). Le tracce sono costruite sui programmi, non sono i testi ufficiali |
| **🧭 Dalle superiori al dottorato** | Mappa di chimica, fisica e matematica su quattro livelli (superiori, triennale, magistrale, dottorato) con i collegamenti agli strumenti. Nuovi risolutori: **astrofisica** (10 modelli), **fisica nucleare** (9), **fisica quantistica** (11, con variazionale e perturbazioni), **chimica organica, spettroscopia e biochimica** (10), **dottorato** (Marcus, effetto isotopico, Wigner; residui, equazione del calore) |
| **🔐 🕸️ ♾️ 🎢 🍩 🔣 ♟️ 🧠 📊 🌐 Matematica: approfondimenti** | **Numeri e crittografia** (crivello, Euclide e Bézout, orologio modulare, RSA vero, π(x) contro Li(x)); **Grafi e ottimizzazione** (Dijkstra, Kruskal, discesa del gradiente, programmazione lineare); **Successioni e serie** (limite ε–N, criteri di convergenza, riordino delle serie, raggio di convergenza); **Calcolo delle variazioni** (brachistocrona, catenaria, catenoide, Fermat); **Topologia** (V − S + F, superfici e orientabilità, poligoni fondamentali, nodi e colorazioni); **Strutture algebriche** (gruppi diedrali, permutazioni, anelli e campi finiti, Lagrange); **Teoria dei giochi** (equilibri di Nash, dilemma ripetuto e replicatore, tris con minimax, Nim); **Logica e calcolabilità** (tavole di verità e forme normali, circuiti sommatori, macchina di Turing, insiemi); **Statistica inferenziale** (intervalli di confidenza, test e potenza, regressione con il quartetto di Anscombe, bootstrap); **Geometrie non euclidee** (sfera e Girard, disco di Poincaré e tassellature, curvatura e trasporto parallelo) |
| **🪐 🔥 🧲 ⚛️ 🎡 🔦 🌍 Fisica: approfondimenti** | **Gravitazione** (N corpi, punti di Lagrange, fionda); **Calore e diffusione**; **Modello di Ising**; **Particelle** (Modello Standard, leggi di conservazione, massa invariante della Z, vite medie dei muoni); **Meccanica analitica** (spazio delle fasi e integrale ellittico, doppio pendolo caotico, perlina sull'anello e Noether, Liouville); **Laser e ottica quantistica** (equazioni di bilancio e soglia, modi della cavità e mode locking, Rabi e Bloch, fotoni nel Mach–Zehnder); **Fisica del clima** (bilancio radiativo e strati, forzante della CO₂, ghiaccio–albedo con isteresi, Coriolis) |
| **🧊 🏔️ Chimica fisica: approfondimenti** | **Diagrammi di fase** (acqua e CO₂ con le curve IAPWS e Span–Wagner, eutettico e leva, Clapeyron e Gibbs); **Superficie di energia potenziale** (LEPS di H + H₂, traiettorie, cammino di reazione, Polanyi) |
| **🧪 ⚛️ 📐 Materie e Articoli** | Due pulsanti sopra Spectra e ✨ cambiano materia: la barra mostra solo i gruppi di chimica, di fisica o di matematica, più Studio e Utility. La sezione **Articoli** ha le stesse due schede per le tre materie: ultimi articoli (Crossref) e premi con spiegazione per argomento — Nobel per la chimica e per la fisica, Premio Abel e Medaglia Fields per la matematica (Wikidata) |
| **🔭 Astrofisica: un gruppo di dodici sezioni** | Il gruppo **🔭 Astrofisica** della barra raccoglie 🔭 Astrofisica e 🪐 Gravitazione (prima nel gruppo della fisica) e dieci sezioni in 3D: **Sistema solare 3D** (posizioni alla data dagli elementi kepleriani JPL di Standish, validi 1800–2050; Terra, Luna ed eclissi con la teoria di Meeus troncata; Giove e Saturno); **Meccanica orbitale 3D** (elementi ↔ stato, manovre di Hohmann e bi-ellittiche, satelliti terrestri, Lambert e porkchop); **Matematica celeste** (equazione di Keplero con tre metodi, sfera celeste e quaternioni, integratori a N corpi, periodogrammi di Lomb–Scargle e BLS); **Vita delle stelle 3D** (stella in sezione, Lane–Emden, evoluzione, nucleosintesi); **Buchi neri e relatività generale** (tracciamento dei raggi di Schwarzschild nello shader, geodetiche, curvatura, deflessione e GPS, radiazione di Hawking); **Onde gravitazionali** (spirale, chirp, rivelatore, pulsar di Hulse–Taylor); **Galassie 3D** (tipi di Hubble, curve di rotazione, collisione, Gruppo Locale); **Cosmologia 3D** (espansione di Friedmann–Lemaître, distanze, CMB, storia termica); **Planetario 3D** (circa 170 stelle e 28 costellazioni da un luogo e un'ora qualsiasi, coordinate, precessione, analemma); **Esopianeti 3D** (zona abitabile, transito, velocità radiale, immagine diretta e popolazione) |
| **🌀 🎲 ☢️ 🧱 🔌 Fisica: cinque laboratori** | **Spin, qubit ed entanglement** (Stern–Gerlach, sfera di Bloch, Bell e CHSH, BB84); **Meccanica statistica** (livelli e anomalia di Schottky, Maxwell–Boltzmann, Fermi e Bose, solidi di Einstein e Debye); **Nuclei e reazioni** (valle di stabilità, valori Q, barriera e tunnel, nucleo 3D, reattore); **Elasticità e materiali** (trazione, travi, carico di Eulero, suono nei solidi); **Elettronica** (raddrizzatori, diodi e Zener, emettitore comune, operazionali, ADC, DAC e contatori) |
| **🌊 🌀 🔗 🧩 📡 Matematica: cinque laboratori** | **Equazioni alle derivate parziali** (corda, membrana 3D, calore 1D e 2D, Laplace 3D, trasporto e Burgers); **Analisi complessa** (colorazione del dominio, paesaggio di \|f\| in 3D, mappe conformi, Joukowski, residui, integrali reali); **Catene di Markov e processi stocastici** (catena, PageRank, rovina del giocatore, passeggiate in 1, 2 e 3 dimensioni, Poisson e code); **SVD e algebra lineare applicata** (SVD 2×2 e 3×3, compressione di immagini, PCA 3D, minimi quadrati); **Codici e curve ellittiche** (Hamming(7,4), CRC e cifre di controllo, curve su ℝ e su F_p, ECDH) |
| **🧪 ⚛️ 📐 Tre app in una** | La materia scelta decide anche il **menu ✨**, **Spectra**, **Studio** e **Utility** (`bsi-materie-app.js`). In fisica e matematica il blocco delle funzioni chimiche del menu ✨ lascia il posto agli **strumenti rapidi** (`bsi-attrezzi.js`), aperti in una finestra sopra la pagina: 🧮 calcolatrice esatta, ∂ derivata e ∫ primitiva, 📈 grafico, 🔢 costante CODATA, 🔁 convertitore di unità, 📐 formula, 📖 glossario e ⚡ quiz lampo presi dal kit di studio della materia. Spectra riceve un'istruzione di sistema, i suggerimenti e il saluto della materia |
| **🧊 Schede 3D nelle sezioni (v238)** | Ventinove sezioni (4 di chimica, 15 di fisica, 10 di matematica) hanno in coda una scheda 3D costruita sul modello della sezione: superficie LEPS con la traiettoria, superficie P–V–T con la cupola, urti molecolari in una scatola, equilibrio molecola per molecola, celle elementari con i piani di Miller, nuvola \|ψ\|², orbitali RHF, molecola che ruota e vibra, fluido di Lennard-Jones, lancio con vento, campi e forza di Lorentz, ondoscopio, pozzo di potenziale con i punti di Lagrange, cono di luce, flusso attorno a un ostacolo, superficie p-V-T, zona di Brillouin, Ising 3D, rivelatore di particelle; piano tangente, campo e divergenza, solidi di rotazione, trasformazioni dello spazio, caos nello spazio delle fasi, normale bivariata, superfici con χ e orientabilità, sfera e iperboloide, sfera di Riemann, pellicola di sapone. Testo e comandi si costruiscono al clic, la scena subito dopo. Ogni scheda ha uno script di verifica (`15-Test-Documentation.md` §3.1-ter). Le tele senza nome prendono quello della scheda e della sezione |
| **🎓 Lezione guidata in ogni sezione (v239)** | Sotto il titolo di ogni sezione il pulsante «🎓 Lezione guidata con Spectra» avvia una lezione in capitoli costruita dalla sezione stessa (`bsi-lezione.js`): apertura con titolo e sottotitolo; un capitolo per scheda, in cui la scheda si apre, la spiegazione si legge a pezzi, tele e scene 3D vengono illuminate, ogni cursore scorre dal minimo al massimo e torna dov'era, ogni scelta passa le sue opzioni e torna com'era; una domanda di verifica dal kit di studio della materia con la spiegazione dopo la risposta; un riepilogo. Le sezioni senza schede si leggono per titoli e paragrafi. Il lettore sta a destra sullo schermo grande (la pagina si sposta a sinistra) e in basso sul telefono; ha ◀ ▶, pausa, voce di Spectra e un riflettore che oscura il resto della pagina. Durante la lezione i pulsanti flottanti sono nascosti. Alla stesura: 194 sezioni con la lezione, 99 con schede, 79 con una domanda di verifica |
| **🌌 Spectra Studio (v239)** | Una pagina a sé (`spectra-studio.html`), aperta dal navigatore 🧭 della console: un laboratorio 3D con Spectra in piedi accanto a un banco olografico. Tre lezioni con il metodo predici → testa → dimostra → rivela: 🪂 la caduta (lasciata o lanciata, tocca terra insieme: 2,019 s da 20 m, gittata 12,12 m), 💧 la forma dell'acqua (VSEPR come minimo di energia: tetraedro 109,47°, acqua 104,4°, ammoniaca prevista 106,7°), ∑ il problema di Basilea (somme parziali, coda, Fourier di x², coprimi → 6/π²). Ogni opzione è spiegata; esercizi su quattro livelli con quello consigliato dalla memoria delle previsioni (`bsi-spectra-studio-v1`). Il corpo è quello scelto dall'autore, **sempre presente** (dalla v241 incorporato nell'app, `models/spectra-corpo.bsi`), riggato, con il volto «Noir» sul colletto; mentre arriva «Spectra sta arrivando…», nessun sostituto; la voce si spegne con 🔊/🔇 e la scelta si ricorda; il pannello contiene tutto il testo e la lezione si segue anche senza WebGL. Progetto in [`docs/spectra/`](https://github.com/samupropio1-ship-it/BioSpecInfo-v11/blob/main/docs/spectra/01-Analisi-modello-e-piano.md) |
| **🎲 🎞️ ⚡ 🔊 💡 🌡️ 🔋 Esplorazioni** | **Probabilità in movimento** (Galton, limite centrale, Monte Carlo, Bayes); **Matematica visiva** (trasformazioni lineari animate, epicicli di Fourier anche da un disegno a mano, Mandelbrot e Julia con lo zoom, mappa logistica e biforcazioni); **Elettromagnetismo in movimento** (cariche da trascinare con equipotenziali e linee di campo, induzione, generatore, onde EM e polarizzazione); **Suono e acustica** con l'audio (armoniche, timbro, battimenti, Doppler e cono di Mach, decibel); **Semiconduttori** (Fermi-Dirac, n_i, drogaggio, giunzione p-n, LED); **Distillazione** (T-x-y con Antoine e van Laar, azeotropo, McCabe-Thiele, Rayleigh); **Voltammetria ciclica** simulata (diffusione e Butler-Volmer, Randles-Ševčík, analisi con la velocità di scansione) |
| **🔭 ⏱️ 🌊 ∇ 🌀 Astrofisica, relatività, fluidi, calcolo vettoriale, cinetica complessa** | **Astrofisica**: diagramma H-R con stelle vere e la sequenza principale per massa, corpo nero e colore delle stelle, sistema solare animato con Keplero e Hohmann, transiti di esopianeti con curva di luce e velocità radiale, cosmologia di Friedmann con età dell'universo e galassie che si allontanano. **Relatività ristretta**: Minkowski, gemelli, dinamica e Doppler. **Fluidi**: Venturi, Poiseuille, Reynolds, Stokes e centrifuga, capillarità. **Calcolo vettoriale**: campi con particelle, divergenza e rotore, potenziale, teorema di Green verificato, gradiente. **Cinetica complessa**: reazioni consecutive, parallele e reversibili, Brusselator e biforcazione di Hopf, strutture di Turing. Tutte le animazioni dell'app hanno pausa, ricomincia e velocità, si fermano fuori schermo e rispettano «riduci movimento» |
| **🎯 〰️ 🔌 🔥 🧮 📐 ⚖️ Laboratori in movimento** | Sette sezioni: **Meccanica in movimento** (proiettile con l'aria e angolo ottimo, urti con coefficiente di restituzione, pendolo vero con lo spazio delle fasi, oscillatori accoppiati e modi normali); **Onde e ottica** (battimenti, onde stazionarie, velocità di gruppo; lenti e specchi con i raggi principali; diffrazione da N fenditure nel colore della luce); **Circuiti** (transitori RC, RL, RLC con i tre regimi; corrente alternata con i fasori e la risonanza; filtri con il diagramma di Bode); **Termodinamica in movimento** (cicli di Carnot, Otto, Diesel e Stirling nei piani p-V e T-S con i bilanci; gas di particelle che arriva a Maxwell-Boltzmann; moto browniano); **Metodi numerici** (zeri, integrazione, EDO, interpolazione, con gli ordini di convergenza misurati); **Geometria analitica e vettori** (vettori e rette e piani in 3D, coniche con gli invarianti); **Equilibrio e Le Chatelier** (una reazione che si sposta quando la si disturba, K in funzione di T) |
| **🧊 Laboratorio 3D e grafici animati** | Sezione nuova nella categoria Fisica: **superfici** z = f(x, y) con curve di livello e punti critici, **orbitali** idrogenoidi come nuvola |ψ|² colorata per segno (n ≤ 4, Z da 1 a 6, taglio per vedere i nodi), **moti nello spazio** (elica di una carica in B, orbita di Keplero inclinata, attrattore di Lorenz, curva parametrica), **strutture cristalline** reali con contenuto della cella, coordinazione, impacchettamento e piani di Miller con l'angolo di Bragg, **linee di campo** di cariche e di una spira. Si ruota con dito o mouse, zoom con due dita o rotellina, rotazione automatica, foto PNG, schermo intero. Tutti i grafici delle sezioni entrano con un'animazione, scivolano ai nuovi valori e mostrano un **mirino** con i valori; le viste molecolari 3D hanno qualità regolabile (occlusione ambientale) e una barra di comandi |
| **⚗️ ⚛️ 📐 Le tre macro-aree** | In testa alle categorie Chimica, Fisica e Matematica. Ognuna ha un **assistente** a cui si scrive il problema in linguaggio naturale (anche in inglese): riconosce il tipo di esercizio o il modello, legge numeri con le unità, formule, reazioni e liste, dice che cosa ha capito e da dove viene ogni dato, risolve anche il **problema inverso** e mostra lo svolgimento; il **catalogo** di tutti gli strumenti della materia con la ricerca; i **livelli** dalle superiori al dottorato. Spectra ha gli stessi risolutori come strumenti |
| **NOE e NMR 2D (tabelle)** | Valori di riferimento per le correlazioni spaziali |
| **Tabelle di riferimento** | Valori tabulati per la consultazione rapida |
| **Quiz spettri** | Riconoscimento del gruppo funzionale da uno spettro |

### 3.2 Chimica generale e fisica

Tavola periodica interattiva · calcolatore chimico · bilanciamento di reazioni ·
gradi di insaturazione · diagrammi di distribuzione · VSEPR · orbitali
molecolari · termodinamica avanzata · elettrochimica (Nernst) · pKa e tamponi ·
calcolatore di laboratorio · costanti e formule.

### 3.2-bis Separazione — cromatografia

Sezione **Cromatografia**: cromatogramma calcolato dai parametri (piatti
teorici, fattore di ritenzione, selettività, tempo morto) con vista d'insieme
e vista espansa della coppia di picchi; curva di **van Deemter** con i tre
termini separati e il minimo calcolato in forma chiusa; calcolatore
dell'**indice di ritenzione di Kováts**; tabella delle grandezze con gli
intervalli d'uso; confronto GC/HPLC; guida ai rivelatori; diagnostica dei
difetti di forma dei picchi.

> **Regola applicata.** Il cromatogramma non è un'illustrazione: le gaussiane
> hanno σ = t<sub>R</sub>/√N e la risoluzione mostrata è quella che si
> misurerebbe su quei picchi. La sezione dichiara esplicitamente ciò che
> **non** fa — prevedere il tempo di ritenzione di una molecola a partire
> dalla struttura, che richiederebbe parametri sperimentali della fase
> stazionaria non ricavabili dal solo SMILES.

### 3.2-ter Taratura e incertezza

Sezione **Taratura**: regressione ordinaria ai minimi quadrati su dati
incollabili da un foglio di calcolo, con pendenza e intercetta **corredate
dalla loro deviazione standard**; grafico della retta con banda di confidenza
al 95 % e **grafico dei residui**; concentrazione dell'incognito con
intervallo di confidenza completo (le tre sorgenti 1/M, 1/N e distanza dal
baricentro sono mostrate separate); **LOD e LOQ** secondo ICH Q2(R1);
propagazione dell'incertezza con indicazione di quale contributo domina;
regole delle cifre significative.

Due diagnostiche che un r² non fornisce:

| Diagnostica | Metodo | Perché non basta l'r² |
|---|---|---|
| **Non linearità** | Test F fra retta e parabola sugli stessi dati | Un r² di 0,984 accompagna una curva di saturazione evidente: l'r² misura quanta varianza la retta spiega, non se la retta sia il modello giusto |
| **Punto anomalo** | Residuo **cancellato**: la retta di giudizio è ricostruita senza il punto giudicato | Il criterio ingenuo `|residuo| > 3 s(y/x)` non funziona — il punto anomalo gonfia `s(y/x)` e finisce sotto la propria soglia. Misurato: residuo 0,0747 contro soglia 0,1337 |

> **La seconda riga è una trappola incontrata scrivendo la sezione**, non un
> caso di scuola: il criterio a 3 σ era già scritto, e l'esempio che doveva
> dimostrarlo non veniva segnalato. Il controllo passava senza vedere nulla.

### 3.2-quater Chemioinformatica e QSAR

Sezione **Chemioinformatica**: un banco di lavoro che va dall'insieme grezzo
al verdetto sul modello, interamente nel browser. Si incollano SMILES — con
nome e attività, se ci sono — e si ottiene in sei pannelli ciò che un gruppo
di chemioinformatica produce in una giornata.

| Pannello | Cosa fa |
|---|---|
| **Descrittori** | Standardizzazione (frammento maggiore, SMILES canonico, deduplicazione), 43 descrittori RDKit, regola dei 5 di Lipinski, filtro di Veber, indice QED ricalcolato — MinimalLib non lo espone |
| **Similarità e gruppi** | Impronte Morgan/ECFP4, RDKit, pattern e MACCS; Tanimoto e Dice; matrice di similarità; vicini più simili; **raggruppamento di Butina** e selezione **MaxMin** per la diversità |
| **Spazio chimico** | PCA sui descrittori standardizzati, con varianza spiegata per componente e i **carichi** che dicono quale descrittore muove quale asse; scheletri di **Bemis–Murcko** con il conteggio delle molecole per scheletro |
| **Modello QSAR** | Regressione kernel (kernel di Tanimoto), kNN su Tanimoto o regressione logistica; **divisione per scheletro**; **validazione incrociata raggruppata** a 3, 5 o 10 pieghe; **confronto fra modelli sulle stesse pieghe** con il riferimento banale in cima; iperparametri scelti per **validazione annidata**; **intervalli di predizione conformi**; **curva di apprendimento**; dominio di applicabilità |
| **Ricerca** | Ricerca per sottostruttura su tutto l'insieme con `SubstructLibrary` di RDKit, query SMARTS o SMILES, conteggio delle occorrenze, otto query pronte |
| **Tabella SAR** | Decomposizione in gruppi R attorno a un nucleo: una riga per molecola, una colonna per posizione di sostituzione, con l'attività mediana di ogni sostituente. Le molecole senza il nucleo sono **escluse**, non mostrate con celle vuote |
| **Coppie corrispondenti** | Coppie che differiscono per **una sola** sostituzione, raggruppate per trasformazione con mediana, intervallo e **numero di coppie concordanti** |
| **Salti di attività** | Coppie strutturalmente vicine con attività lontane, ordinate per **SALI**: sono le coppie su cui ogni modello sbaglia, ed è onesto mostrarle |
| **Allarmi strutturali** | PAINS e Brenk, con il frammento evidenziato e il motivo per cui è segnalato |

Tre scelte che distinguono un banco di lavoro da una dimostrazione:

| Scelta | Metodo | Perché |
|---|---|---|
| **Divisione per scheletro** | L'insieme di prova contiene **soltanto scheletri mai visti** in addestramento | La divisione casuale mette analoghi stretti da entrambe le parti: il modello riconosce, non predice, e l'R² che ne esce non sopravvive alla prima molecola nuova |
| **Modello nullo per rimescolamento** | Lo stesso modello viene riaddestrato su **etichette mescolate**, otto volte; il verdetto è il confronto | Un R² di 0,4 può nascere dal caso quando le molecole sono poche. Se i sosia casuali arrivano allo stesso punteggio, il modello non ha imparato niente — e il pannello **lo dice**, invece di mostrare solo il numero buono |
| **Deduplicazione sul canonico** | `OC(=O)C` e `CC(=O)O` sono la stessa molecola | La stessa molecola in addestramento e in prova è una fuga di informazione, e la stringa scritta non basta a vederla |

> **Il verdetto è scritto a parole, non lasciato al lettore.** Il pannello QSAR
> non si ferma alle metriche: dichiara se il modello ha battuto tutti i suoi
> sosia casuali e di quanto. Misurato sull'esempio dei 28 inibitori: R² 0,861
> contro un massimo di 0,574 fra gli otto sosia — margine 0,287. Sulle stesse
> molecole con etichette casuali il modello **non** batte i sosia, e il pannello
> lo dichiara allo stesso modo.

### I risultati si portano via

Due esportazioni, entrambe formate in memoria dal browser: non c'è nessuna
richiesta di rete, ed è la ragione per cui la nota accanto ai pulsanti può dire
che nessun dato esce dal dispositivo senza chiedere di crederci sulla parola.

| Esportazione | Contenuto |
|---|---|
| **Tabella CSV** | Una riga per molecola: nome, SMILES canonico e originale, attività, scheletro, nove descrittori, QED, violazioni di Lipinski, esito di Veber, allarmi trovati. Con la validazione incrociata attiva si aggiungono **previsto** e **residuo** — e solo allora, perché la validazione incrociata è l'unica che dia a ogni molecola una predizione da un modello che non l'aveva vista |
| **SDF** | Le strutture con **coordinate 2D generate**, il nome nella prima riga di ogni blocco e i campi dati attaccati: è il formato con cui si scambiano insiemi fra gruppi e programmi. Verificato col round-trip |
| **Rapporto di metodo (.md)** | Ciò che serve a **rifare** la stessa analisi: versione di RDKit, fingerprint, tipo di divisione, numero di molecole e scheletri, **il seme**, le metriche, il verdetto del controllo nullo, le pieghe una per una, e i limiti dichiarati |

> **Perché il seme è nel rapporto.** Senza di esso «divisione casuale» e
> «etichette rimescolate» non significano niente: due esecuzioni darebbero
> numeri diversi e nessuno potrebbe dire quale sia quello giusto. Il generatore
> è un mulberry32 seminato, e lo stesso seme dà le stesse pieghe.

### Una misura che nessun altro banco poteva fare

`verifica-accessibilita` percorre le 194 sezioni e misura ciò che è **visibile**.
I sei pannelli di questa sezione stanno dentro un contenitore che resta
`display:none` finché l'analisi non è stata eseguita: quel banco non li ha mai
visti, e il suo «contrasto 0» non parlava di loro.

`test_cheminfo` esegue l'analisi per davvero, apre i sei pannelli a turno e
misura il contrasto WCAG su ogni testo che vi compare — **460 elementi, 0
difetti**. Le formule sono riscritte dentro il banco e non prese
dall'applicazione: un banco che chiedesse al codice sotto esame quanto vale il
proprio contrasto non misurerebbe niente.

Il motore sta in `bsi-cheminfo.js`, è esposto come `window.BSIChem` ed è
verificato dal banco `test_cheminfo` (189 controlli) contro valori calcolabili a
mano.

### 3.3 Chimica organica

Retrosintesi (98 esercizi) · sintesi e meccanismi con frecce elettroniche ·
meccanismi animati · editor di strutture · modulo *Chimica Organica 1+2* con 25
moduli.

### 3.4 Biochimica

Amminoacidi · biomolecole · vie metaboliche animate · cinetica enzimatica
(Michaelis-Menten) · macromolecole 3D · strutture biologiche interattive ·
guida di biochimica · biochimica d'esame.

La **guida di biochimica** è un documento a sé (`Biochimica_Guida_Definitiva.html`,
8,2 MB) caricato in un riquadro dalla sezione: 12 capitoli più l'indice, 78
sottosezioni, 98 figure incorporate, e due capitoli dedicati all'esame — «Guida
all'orale» e «Domande d'esame reali e risposte corrette». Non contiene **nessuno
script e nessuna richiesta di rete**: non può generare errori JavaScript, e il
testo alternativo delle 98 figure viene dalle didascalie scritte dall'autore,
non da descrizioni inventate (vedi `docs/06` §3-ter).

Chiude il documento una sezione di **autoverifica con 12 domande a risposta
multipla**, recuperata dalla guida precedente — dove era un quiz in
JavaScript — e riscritta **senza un rigo di codice**: le quattro opzioni sono
in chiaro, la soluzione sta in un `<details>` nativo che si apre con un clic.
In stampa il `<details>` sparisce e compare una copia dedicata della soluzione,
così la copia cartacea non perde le spiegazioni.

### 3.5 Farmacologia

| Funzione | Descrizione |
|---|---|
| **Atlante 3D** | Si sceglie zona del corpo, malattia e farmaco: il modello evidenzia l'organo bersaglio |
| **Banca dati** | **263 farmaci** con struttura, peso molecolare, meccanismo, indicazioni, effetti avversi, classe. Per **36** la voce porta l'identificativo ChEMBL e la formula del record, e la formula viene ricostruita dal grafo e confrontata (§5.1) |
| **Interazioni** | Verifica delle interazioni fra principi attivi |
| **Farmacocinetica** | Calcolatore di emivita, clearance, volume di distribuzione |
| **Casi clinici** | Percorsi diagnosi-terapia a scopo didattico |

### 3.6 Astrochimica

Molecole del mezzo interstellare · esopianeti e dati JWST · nebulose · spettri
stellari · nucleosintesi · chimica cometaria · quiz.

### 3.6-bis Lettore di spettri

Si carica un file dal proprio strumento, o si incolla un testo, e viene letto.

| Funzione | Descrizione |
|---|---|
| **Formati** | **JCAMP-DX** (`.jdx`, `.dx`) con compressione **ASDF** completa — PMAI per le cifre, DIF per le differenze, DUP per le ripetizioni — oppure due colonne di numeri separate da spazi, virgole o tabulazioni |
| **Controllo di integrità** | Il formato JCAMP prevede che, dopo una serie di differenze, il valore scritto per intero coincida con quello calcolato. Qui viene verificato |
| **Ricerca dei picchi** | Per **prominenza**, con il rumore stimato dalla deviazione assoluta mediana (MAD × 1,4826) e non dalla deviazione standard, che un picco alto gonfia |
| **Assegnazione IR** | Per ogni banda vengono elencate **tutte** le assegnazioni compatibili fra 24 intervalli, non la prima |
| **Spettri di massa** | La lista di picchi viene riconosciuta come tale; le differenze fra ioni sono confrontate con 17 **perdite neutre** |
| **NMR** | Integrazione delle aree per regione di spostamento chimico |
| **Disegno** | L'IR con i numeri d'onda **decrescenti**, come lo si guarda |

**Quello che non fa, ed è scritto nella sezione:** non deduce la struttura. Un
insieme di bande è compatibile con molte molecole, e un programma che da tre
picchi producesse un nome farebbe un'affermazione che i dati non reggono.

### 3.6-ter Lingue e linguaggi chimici

| Funzione | Descrizione |
|---|---|
| **Lingua dell'interfaccia** | **14 lingue** con selettore e campo di ricerca: italiano, inglese, spagnolo, francese, tedesco, portoghese, olandese, polacco, romeno, greco, russo, cinese, giapponese, arabo. La copertura di ciascuna è **misurata**, non dichiarata |
| **Verso di scrittura** | L'arabo porta con sé `dir="rtl"`; tutte le altre `ltr`, anche al ritorno |
| **Linguaggi chimici** | **25 uscite** da uno SMILES: formula e composizione in massa, SMILES canonico/piano/con idrogeni, CXSMILES, InChI e chiave InChI, scheletro della chiave, scaffold di Murcko, tag stereochimici CIP, SMARTS e CXSMARTS, molfile V2000 (anche aromatico) e V3000, XYZ, PDB, CML, JSON, e le **sei impronte** (Morgan, MACCS, RDKit, coppie di atomi, torsioni topologiche, pattern) |
| **Nomenclatura IUPAC** | Su una **classe dichiarata** (aciclici, neutri, C H O N F Cl Br I, un solo tipo di gruppo principale, sostituenti lineari). Fuori da quella classe **rifiuta** invece di tentare |

### 3.7 Strumenti di studio

| Funzione | Descrizione |
|---|---|
| **Ripetizione spaziata** | Algoritmo SM-2 su schede generate dai contenuti |
| **Quiz** | Per materia, con punteggio e storico |
| **Percorso di studio** | Sequenza guidata di argomenti |
| **Note** | Globali e per sezione |
| **Pomodoro** | Timer di studio |
| **File Manager** | Archivio personale di foto, documenti e pagine HTML |
| **Kit di studio di fisica e matematica** | Cinque sezioni per materia (`bsi-studio.js`): 🗺️ riassunti con «segna come studiato» e progressi; ❓ quiz per argomento e livello, con risposte mescolate, ripasso degli errori e storico; 🃏 flashcard con il metodo di Leitner a cinque scatole; 📐 formulario; 📖 glossario. Fisica: 69 riassunti, 325 domande, 273 flashcard, 227 formule, 273 voci. Matematica: 66 riassunti, 346 domande, 266 flashcard, 224 formule, 279 voci |
| **Risorse e bibliografia** | Per fisica, matematica e chimica (`bsi-risorse-materie.js`): risorse web per categoria, bibliografia per livello senza anni né ISBN (i link di ricerca si calcolano dal titolo e dall'autore), citazioni da un DOI letto in diretta da Crossref in APA 7, IEEE, ISO 690 e BibTeX; senza rete, un modulo da compilare a mano |
| **🔢 Costanti e unità**, **📚 Tavole matematiche** | Costanti CODATA 2018 con quelle esatte del SI segnate; un convertitore che controlla le dimensioni. Tavole di derivate, integrali, serie, identità, trasformate di Laplace e di Fourier e costanti: ogni voce numerica porta una funzione di prova che il banco esegue |

### 3.8 Assistente «Spectra»

Agente AI con **47 strumenti** che può interrogare l'applicazione stessa:
calcolare descrittori, generare spettri, cercare costanti, bilanciare reazioni,
aprire sezioni, leggere la scheda aperta e agire sui suoi controlli. Supporta
dieci fornitori, e resta utilizzabile quando uno di essi si guasta (§5.2).

**Spectra Live** (`bsi-spectra-live.js`) è la sua console vocale a tutto
schermo: conversazione a mani libere con il riconoscimento e la sintesi
vocale del browser, comandi locali che funzionano senza rete e senza chiave
(aprire sezioni, cambiare materia, calcolare, derivare, convertire, cercare
costanti e definizioni, fare grafici, interrogare, muovere cursori, cambiare
scheda), e il contesto dello schermo aggiunto alle domande che vanno al
modello. Nella console Spectra ha il **volto** dell'androide «Noir» (modello
di Skyfox13, CC BY 4.0), con la bocca che segue il testo pronunciato e 17
emozioni; e una **mente** (`bsi-spectra-mente.js`) che ricorda localmente
episodi e tempo di studio e tiene uno stato interno di cinque grandezze. È una
simulazione di comportamento, non una coscienza: vedi
[`05-AI-Agent-Architecture.md`](05-AI-Agent-Architecture.md) §4.10–4.12.

La console è il punto d'ingresso principale. Dalla v239 Spectra ha **un solo
pulsante**, il volto in un cerchio, presente in ogni schermata al posto della
pillola «Spectra»: apre la console, e dalla console 💬 apre la chat. Il
cerchio mostra subito un volto disegnato e, a pagina caricata, il ritratto. Sul telefono a schermo intero rispetta i margini della barra di
stato e dei tasti di Android (almeno 34 e 46 px quando il sistema non li
comunica) e dispone volto, stato, dialogo e comandi senza sovrapposizioni. Il
navigatore 🧭 elenca per materia ogni sezione, gli strumenti rapidi e le frasi
riconosciute; le scorciatoie di contesto (Spiegami questa sezione, Guidami,
Cosa vedo?, Interrogami, Ripassa, e dalla v239 🎓 Lezione) cambiano con lo
schermo; 💬 apre la chat. «Fammi lezione» avvia la lezione guidata della
sezione aperta.
La **difficoltà** di una domanda parte dal livello di studio della sezione
aperta nei percorsi (scuola superiore, triennale, magistrale, dottorato) e
cresce con parole da corso avanzato, simboli e lunghezza; diventa la
**concentrazione** del volto (occhi socchiusi e più accesi). Il volto (v3.0)
ha palpebre, tinta degli occhi per emozione, molle muscolari, micro-espressioni
e un sonno dopo due minuti senza contatto. Con la console in silenzio da più di
un minuto Spectra può dire da sé un pensiero importante della mente.

**Il creatore** (`bsi-spectra-creatore.js`). Spectra sa di essere stato creato
da Samuele Pio Provenzano. Il riconoscimento richiede la frase segreta del File
Manager, confrontata come impronta SHA-256 e mai conservata; riconosciuto,
l'autore è salutato per nome e il modello lo sa. È un deterrente, non un
controllo d'accesso (§6).

**La voce di qualità** (`bsi-spectra-voce.js`, v239). Con una chiave OpenAI
salvata nell'app, Spectra parla nella console, nella lezione guidata e in
Spectra Studio con una voce profonda e metallica: il testo va a OpenAI
(`gpt-4o-mini-tts`), l'audio torna e passa in una catena di effetti, e la bocca
segue l'audio. Senza chiave resta la sintesi vocale del browser. Il testo
pronunciato esce dal dispositivo solo in questo caso
([`03-Security-Privacy-Compliance.md`](https://github.com/samupropio1-ship-it/BioSpecInfo-v11/blob/main/docs/03-Security-Privacy-Compliance.md) §1.2).

**Il corpo** (`bsi-spectra-corpo.js`, v239). Un driver generico per avatar
umanoidi (ossa, blendshape ARKit, capelli neri, sguardo, gesti, passo, seduta),
usato da `bsi-spectra-figura.js` (v240) in Spectra Studio e nelle sezioni
dell'AI. Il corpo scelto dall'autore (il «Bounty Hunter», gratuito su
CGTrader, licenza Royalty Free) dalla v241 **c'è sempre, per tutti, senza
caricarlo**: è incorporato nell'app come blocco impacchettato
(`models/spectra-corpo.bsi`), che solo il codice dell'app riapre, perché la
licenza permette di usare il modello dentro il prodotto ma non di offrirlo come
file `.glb` a sé. Mentre arriva compare «Spectra sta arrivando…»; se al primo
avvio non c'è rete, «Spectra non è arrivato: serve la rete la prima volta» con
«↻ Riprova»; dopo il primo caricamento resta nella cache e funziona senza rete.
Non c'è più il pulsante «🧍 Corpo» né l'invito a caricarlo; nessun sostituto
(§6).

**Spectra col corpo nelle sezioni dell'AI** (`bsi-spectra-figura.js`, v240).
In Spectra AI e nelle tre aree con l'assistente, sotto il titolo, un riquadro
da laboratorio mostra Spectra in piedi: pensa mentre il modello lavora, spiega
con le mani e il labiale quando arriva la risposta, parla con Spectra Live e
spiega lo svolgimento quando l'assistente locale risolve un esercizio; pulsanti
«🎙️ Parla con me», «🧠 Spiega», «🎓 Studio». Una figura sola per
tutta l'app. L'icona di Spectra è solo il volto. I pulsanti stanno in una barra
sotto la scena.

**Spectra col corpo nella console Spectra Live** (`bsi-spectra-figura.js`,
v242). Richiesta dell'autore, guardando la console: «Esce ancora così (il
busto)». Quando la console è aperta, al posto del busto solo volto c'è Spectra
col corpo e l'ologramma (la stessa figura, spostata nella console, fra la
telemetria e il dialogo; sullo schermo grande a destra). Lo stato della
console guida la figura: mentre ascolta è curioso, mentre elabora è
concentrato con la mano al mento, poi parla. Chiusa la console, la figura
torna nella sezione da cui era venuta.

**L'ologramma** (`bsi-spectra-figura.js`, v240). Alla destra di Spectra (la
destra di chi guarda) uno schermo olografico mostra scene vive, calcolate e
non registrate: quattro pianeti su orbite di Keplero (equazione di Keplero
risolta a ogni fotogramma, più veloci al perielio), il benzene con la nube π,
uno spettro IR che si disegna da sé, la superficie z = sin(r − t)/r, l'orbitale
3d_z² che ruota, un pacchetto d'onda di Schrödinger che si allarga; oppure la
sezione aperta dietro la finestra di Spectra, dal vivo. La scena segue
l'argomento della domanda e della risposta (orbite → pianeti, spettro → IR,
orbitale → 3d_z²…); con «📺 Includi lo schermo» mostra la sezione aperta; a
riposo le scene si alternano ogni 14 s. L'etichetta in alto a destra («🪐 Orbite
di Keplero · apri ›»…) apre con un tocco la sezione corrispondente **senza
togliere la figura di Spectra**: non si lascia la sezione dell'AI, si apre la
finestra di Spectra su «🧠 Spiega» (se non è già aperta) e la sezione dietro di
essa, così Spectra resta visibile davanti e la sezione si vede dal vivo
nell'ologramma. Chiusa la finestra, se Spectra ha aperto altre sezioni (il
catalogo, «🎞️ Mostrami tutto», una domanda che nomina un argomento,
l'etichetta), l'app torna alla sezione dell'AI da cui si era partiti, dove c'è
la figura, e il giro si ferma. Quando
risponde, Spectra indica prima l'ologramma e poi spiega con le mani. **Ogni
sezione è mostrabile**: una sezione senza grafici (testo, tabelle, comandi) si
proietta come una scheda disegnata nell'ologramma (titolo, scheda aperta, fino
a sei comandi con i loro valori, testo visibile), invece di tornare ai pianeti.

**«🧠 Spiega»** (`bsi-spectra-spiega.js`, v240). Nella finestra di Spectra la
scheda **«🧠 Spiega»** è la seconda, dopo «💬 Chat» (poi Esame Orale, Ripassa
Oggi, Genera Guida). Dà una **spiegazione esaustiva** di qualunque domanda di
chimica, fisica o matematica, a uno dei cinque livelli (Scuola superiore,
Triennale, Magistrale, Dottorato (PhD), PhD avanzato · frontiera), senza
semplificare sotto il livello scelto e senza tralasciare nulla di rilevante.
La risposta ha una struttura obbligatoria: in sintesi; che cosa stai guardando
(con lo schermo: la lettura quantitativa del grafico — per uno spettro NMR
ogni segnale con δ, molteplicità, J, integrale e attribuzione, per IR, MS e
UV-Vis bande, frammenti e transizioni; per una scena 3D geometria, simmetria,
nodi, punti critici e isosuperfici; per un grafico matematico dominio,
asintoti, estremi, flessi, convergenza); fondamenti teorici; formalismo e
derivazione completa; esempi numerici calcolati; casi limite, approssimazioni
ed errori comuni; collegamenti fra le tre materie; applicazioni e frontiera
della ricerca; tre domande per verificarsi, con risposta. Con **«📺 Includi lo
schermo»** la spiegazione riguarda ciò che è aperto: al modello vanno il testo
della sezione (comandi con i valori, tabelle, testo) e un'immagine dei grafici
e delle scene 3D. Domande rapide: «📈 Spiegami questo grafico», «🧪 Lo spettro,
picco per picco», «🧊 La scena 3D», «∴ Dimostrazione completa», «🔭 Frontiera
della ricerca»; «↺ Nuova spiegazione» ricomincia. Serve un fornitore di IA
configurato: senza, la scheda lo dice e mostra ciò che l'app sa da sola
(l'assistente locale per gli esercizi numerici, i capitoli della lezione
guidata della sezione, i dati dello schermo). Spectra col corpo si sposta
nella scheda, pensa mentre il modello scrive e poi spiega a voce e a gesti.

**Il catalogo: tutte le sezioni nell'ologramma** (`bsi-spectra-spiega.js`,
v240). Richiesta dell'autore: «ogni sezione della chimica, della fisica e della
matematica deve esserci, non deve mancare nulla in questo ologramma: deve
esserci tutto spiegabile e mostrabile». Il catalogo non è scritto a mano: si
legge dalla barra dell'app (ogni pulsante di sezione, con il suo gruppo —
Chimica, Spettroscopia, Biochimica, Farmacologia, Chimica Fisica, Studio,
Utility, Fisica, Matematica, Astrofisica — e la sua materia): 197 sezioni
(chimica 76, fisica 61, matematica 31, comuni 29, dalla v242); una sezione nuova compare da
sola. Nella scheda «🧠 Spiega» il riquadro apribile **«🗂️ Tutte le sezioni
nell'ologramma»** le elenca per gruppo, con una casella di ricerca e un filtro
per materia; un tocco apre la sezione dietro la finestra di Spectra
(cambiando materia se serve), l'ologramma la mostra dal vivo e «📺 Includi lo
schermo» si spunta, così la spiegazione usa i suoi dati. **«🎞️ Mostrami
tutto»** fa scorrere nell'ologramma ogni sezione della materia scelta (o
tutte), una ogni 7 s, con il contatore «n/N · nome»; si può fermare. **Una
domanda che nomina un argomento trova la sua sezione** (le parole
significative dei nomi delle sezioni cercate nella domanda, anche per radice;
le sigle MS, IR, UV, NMR, MO… pesano di più; sinonimi come «spettro di massa» →
MS, «infrarosso» → IR, «risonanza magnetica» → NMR, «orbitali molecolari» →
MO; a parità vince il nome più corto): chiedendo in «🧠 Spiega» senza lo
schermo incluso, la sezione nominata si apre dietro la finestra, si mostra
nell'ologramma e la spiegazione comprende i dati del suo schermo. **La spunta
tolta dall'utente si rispetta**: se l'utente ha tolto «📺 Includi lo schermo»,
la sezione nominata o scelta dal catalogo si apre e si mostra lo stesso, ma la
casella resta spenta e al modello va solo la domanda, senza testo né immagine
dello schermo; le domande rapide sullo schermo rimettono la spunta (scelta
esplicita). Esempi:
titolazioni → Titolazione, Schrödinger → l'equazione di Schrödinger,
integrali per parti → «Derivate, integrali e serie», spettro di massa →
Spettro MS, spettro infrarosso → IR Visivi, meccanica orbitale → la meccanica
orbitale 3D; «ciao come stai» → nessuna.

**L'ologramma interattivo, «⛶ Interagisci»** (`bsi-spectra-olointerattivo.js`,
v242). Richiesta dell'autore: selezionare l'ologramma e interagire, con ogni
passaggio spiegato a voce da Spectra e per iscritto. Il pulsante
**«⛶ Interagisci»** sta sull'ologramma ovunque ci sia la figura (sezioni
dell'AI, sezioni Esplora, finestra «🧠 Spiega», console Spectra Live) e apre una
finestra a tutto schermo con Spectra col corpo, l'ologramma grande e il
pannello dei passaggi; i pulsanti flottanti dell'app si nascondono. La
modalità parte da ciò che l'ologramma mostrava:

| Modalità | Che cosa si fa | Che cosa spiegano i passaggi |
|---|---|---|
| 🧪 Spettri | IR, ¹H-NMR (campo 60–600 MHz, con il multipletto scelto ingrandito), ¹³C-NMR, massa (EI), UV-Vis; una delle sei molecole di riferimento (acetone, etanolo, acido acetico, benzene, toluene, acetato di etile) oppure una traccia scritta («1715 s, 2950 m, 3300 br», «2.17 s 6H; 1.2 t 3H J=7», «58 30, 43 100», «254 200»), ridisegnata mentre si scrive | Per ogni segnale posizione, forma, attribuzione e perché (frequenze di gruppo, spostamenti chimici, perdite neutre; una banda stretta non è mai un O–H carbossilico); per le molecole formula, massa molare, grado di insaturazione |
| 🪐 Universo | Gli otto pianeti in 3D (dati NASA, orbite di Keplero, distanze compresse come √a); si tocca un pianeta, o si scrive un'orbita («a=2 e=0,6») | Terza legge di Keplero, perielio e afelio, velocità dalla vis-viva e rapporto (1+e)/(1−e), gravità in superficie, velocità di fuga |
| 📐 Matematica, ⚛️ Fisica e chimica | Si scrive la domanda; la risolve l'assistente dell'app (`bsi-assistente.js`, `bsi-mat-cas.js`) e il grafico segue: funzione e derivata con zeri e punti stazionari; traiettoria del proiettile; pendolo che oscilla | I passaggi calcolati dall'assistente, non scritti da un modello |

**«🔊 Spectra spiega i passaggi»** li legge uno per uno, evidenziandoli nel
testo e nell'ologramma; toccando un picco, un pianeta o un passaggio si va lì e
Spectra lo dice; **«🧠 Approfondisci»** apre «🧠 Spiega» con i dati
dell'ologramma. Chiusa la finestra, Spectra torna nella sezione. Gli spettri di
riferimento sono valori tipici di letteratura per la didattica, non spettri
misurati; dalla traccia l'interprete propone attribuzioni candidate prese dalle
tabelle, non determina una struttura.

**⚡ Esplora con Spectra** (`bsi-spectra-esplora.js`, v242). Richiesta
dell'autore: «non c'è la sezione richiesta per ogni materia come every-joule».
Tre sezioni, una per materia, nella barra della loro materia subito dopo il
pulsante «Area … · assistente»: **«⚡ Esplora la chimica con Spectra»**,
**«⚡ Esplora la fisica con Spectra»**, **«⚡ Esplora la matematica con
Spectra»**. Ognuna è una pagina da scorrere, nello stile delle lezioni
esplorabili: Spectra col corpo resta in scena in alto mentre si scorre (subito
sotto la testata dell'app; sul telefono più bassa) e l'ologramma cambia con il
capitolo che si ha davanti. Dieci capitoli per materia, dalla Scuola superiore
al PhD avanzato · frontiera:

| Materia | Capitoli |
|---|---|
| Chimica | l'atomo e l'energia di ionizzazione · la forma delle molecole (VSEPR) · il pH di un acido forte molto diluito · il tampone e Henderson–Hasselbalch · la cinetica del primo ordine · la spettroscopia IR · l'¹H-NMR e l'accoppiamento spin–spin · gli orbitali molecolari: perché O₂ è magnetico · la teoria di Marcus e la regione invertita · la frontiera: l'errore di delocalizzazione della DFT |
| Fisica | la caduta dei gravi · il moto del proiettile · le leggi di Keplero · il pendolo · il rendimento di Carnot · l'interferenza da due fenditure · la particella in una scatola · l'effetto tunnel · la dilatazione del tempo e i muoni · la frontiera: le onde gravitazionali (GW150914) |
| Matematica | la derivata come pendenza · il numero e · l'integrale e il logaritmo · la serie di Basilea · la serie armonica · autovalori: la rotazione del piano · la serie di Fourier e il fenomeno di Gibbs · l'analisi complessa e i residui · l'equazione del calore · la frontiera: l'ipotesi di Riemann |

Ogni capitolo: il fenomeno in poche righe esatte; **🔮 Prevedi**, quattro
risposte fra cui le idee sbagliate più comuni, poi la rivelazione (giusta o no,
e perché ciascuna risposta è giusta o sbagliata) e Spectra reagisce (gioia o
sorpresa); **🧪 Prova**, in 19 capitoli su 30, un cursore che ricalcola la
grandezza vera (pH con l'autoprotolisi dell'acqua, Henderson–Hasselbalch, t½,
ΔG‡ di Marcus e velocità relativa, tempo di caduta, gittata, periodo del
pendolo, Carnot, E₁ della scatola, trasmissione per effetto tunnel, γ e
percorso medio dei muoni, derivata, (1+1/n)ⁿ, ln b, somme di Basilea con la
coda, H_N contro ln N + γ, autovalori della rotazione, massimo di Gibbs
calcolato, decadimento di un modo del calore); **«📺 Guardalo dal vivo»** apre
la sezione collegata dietro la finestra di Spectra (scheda «🧠 Spiega») e
l'ologramma la mostra dal vivo, e chiudendo la finestra si torna alla sezione
Esplora; **«🧠 Spiegamelo tutto»** chiede a «🧠 Spiega» la spiegazione al
livello del capitolo, con lo schermo della sezione (serve un fornitore di IA);
**«🔊 Ascolta Spectra»** legge il capitolo con la voce di Spectra Live.
Scorrendo, il capitolo che attraversa il centro dello spazio libero sotto
Spectra diventa «attivo» (anche se è più alto dello schermo): Spectra lo
racconta, con labiale e gesti, e l'ologramma prende la sua scena. Le previsioni
fatte restano sul dispositivo (`bsi-esplora-v1`) con la barra dei progressi
«n/10», e si cancellano con «Cancella dati → Memoria persistente».

Corpo, volto e mente sono una simulazione di
comportamento, non una coscienza.

---

## 4. Flussi principali

### 4.1 Analizzare una molecola

```
1. Si apre il Centro spettroscopico
2. Si inserisce la molecola:
     · SMILES              → uso diretto
     · nome o formula      → risoluzione via PubChem (richiede rete)
     · disegno nell'editor → SMILES generato
3. L'applicazione mostra: struttura 2D, gruppi funzionali, descrittori,
   spettri previsti (IR, NMR, MS, UV-Vis), drug-likeness
4. La struttura 3D si carica se c'è rete (conformero da PubChem)
```

**Senza rete:** i punti 3 restano completi per gli SMILES inseriti
direttamente; la risoluzione per nome e la struttura 3D non sono disponibili, e
l'applicazione lo dichiara invece di restare in attesa.

### 4.2 Chiedere all'assistente

```
1. Si tocca il volto di Spectra (il cerchio in basso a destra), poi 💬
   per la chat
2. Al primo uso: si sceglie un fornitore e si inserisce una chiave API,
   oppure si collega un proxy (e allora nessuna chiave serve)
3. Si scrive la domanda
4. L'assistente risponde, usando i propri strumenti quando servono:
   ogni strumento usato è mostrato, non nascosto
```

**Se il fornitore non risponde:** l'assistente lo annota, lo retrocede nella
scelta per 24 ore e passa a un altro fornitore configurato. Il pulsante
**🔌 Prova** misura in pochi secondi quali fornitori il dispositivo raggiunge
davvero, **senza bisogno di alcuna chiave**.

### 4.3 Studiare con la ripetizione spaziata

```
1. Si apre la sezione di studio
2. Si genera un mazzo dai contenuti
3. Per ogni scheda si valuta quanto la si ricordava
4. L'algoritmo SM-2 calcola quando riproporla
5. Alla riapertura compaiono solo le schede in scadenza
```

### 4.4 Archiviare materiale proprio

```
1. File Manager → password locale
2. Caricamento di foto, documenti o pagine HTML
3. Il materiale resta NEL DISPOSITIVO (IndexedDB), non viene trasmesso
```

### 4.5 Controllare gli aggiornamenti

```
1. Menu ✨ → 🔄 Aggiornamenti → «Controlla aggiornamenti»
2. L'app chiede al service worker attivo quale versione sta servendo
   (messaggio BSI_VERSIONE) e scarica sw.js dallo stesso sito, senza cache;
   se non ci riesce, prova la copia su GitHub
3. Risponde sempre, in uno di tre modi:
     · stessa versione   → «Hai già l'ultima versione pubblicata», con il numero
     · versione nuova    → la annuncia con le due versioni e offre «Aggiorna ora»
     · sito irraggiungibile → lo dice; l'app continua a funzionare offline
```

### 4.6 Seguire una lezione guidata

```
1. Si apre una sezione e si tocca «🎓 Lezione guidata con Spectra»
   (oppure si dice o si scrive a Spectra «fammi lezione»)
2. La lezione avanza da sola, capitolo per capitolo: apre le schede,
   illumina i grafici, muove i cursori e le scelte e li rimette com'erano
3. ◀ ▶ spostano di un passo, la pausa ferma l'avanzamento, 🔊/🔇 la voce,
   ✕ o Esc chiudono
4. Alla domanda di verifica la lezione aspetta la risposta, poi mostra
   la spiegazione
5. Il riepilogo elenca i capitoli e offre «Ripeti la lezione» e
   «Chiedi a Spectra»
```

### 4.7 Imparare in Spectra Studio

```
1. Console di Spectra → 🧭 → «Spectra Studio» (in cima)
2. Si sceglie una lezione: 🪂 La caduta, 💧 La forma dell'acqua,
   ∑ Il problema di Basilea
3. PREDICI   — si sceglie una risposta; la previsione viene registrata
4. TESTA     — la simulazione gira sul banco olografico, con le misure
5. DIMOSTRA  — la derivazione, un passo per volta (◀ e «Passo successivo ▶»)
6. RIVELA    — perché ogni opzione è giusta o sbagliata, i collegamenti,
               gli esercizi su quattro livelli (uno consigliato)
7. Spectra parla, guarda la scena, indica e gesticola; trascinando si gira
   la telecamera. Senza WebGL resta il pannello con tutto il testo
```

### 4.8 Esplorare una materia con Spectra (v242)

```
1. Barra della materia → «⚡ Esplora la chimica / la fisica / la matematica
   con Spectra» (subito dopo l'area con l'assistente)
2. Si scorre: Spectra resta in alto, il capitolo davanti diventa attivo,
   Spectra lo racconta e l'ologramma prende la sua scena
3. PREVEDI   — si tocca una delle quattro risposte; la rivelazione spiega
               ognuna, Spectra reagisce, la barra «n/10» avanza
4. PROVA     — si muove il cursore: la grandezza si ricalcola
5. «📺 Guardalo dal vivo» — la sezione collegata dietro la finestra di
   Spectra, dal vivo nell'ologramma; chiudendo si torna qui
6. «🧠 Spiegamelo tutto» — la spiegazione completa al livello del capitolo;
   «🔊 Ascolta Spectra» — il capitolo letto a voce
```

### 4.9 Interagire con l'ologramma (v242)

```
1. Sull'ologramma di Spectra → «⛶ Interagisci»: finestra a tutto schermo
2. Si sceglie la modalità: 🧪 Spettri · 🪐 Universo · 📐 Matematica ·
   ⚛️ Fisica e chimica
3. Si cambia tipo di spettro o molecola, si scrive una traccia, si tocca un
   pianeta o si scrive la domanda: l'ologramma si ridisegna e i passaggi si
   rifanno
4. «🔊 Spectra spiega i passaggi» — uno per uno, evidenziati; un tocco su un
   picco, un pianeta o un passaggio va lì
5. «🧠 Approfondisci» — «🧠 Spiega» con i dati dell'ologramma
6. Chiusa la finestra, Spectra torna nella sezione
```

---

## 5. Regole di business

### 5.1 Dati scientifici

| Regola | Motivazione |
|---|---|
| Una struttura molecolare entra in banca dati solo se il peso ricalcolato coincide con quello di letteratura (±0,6 u) | Un dato plausibile ma sbagliato è indistinguibile da uno corretto per l'utente |
| Se una struttura non supera la verifica, la voce resta **senza struttura** | Un dato sbagliato sostituito da un altro sbagliato non è un progresso |
| Ogni assenza deve essere **registrata con il motivo** | Un'eccezione non motivata diventa una scorciatoia |
| Gli spettri sono deterministici | Due spettri della stessa molecola devono essere confrontabili |
| Una costante fisica ambigua non viene risolta a caso | Un valore sbagliato dato con sicurezza è peggio di una domanda di chiarimento |

### 5.2 Assistente AI

| Regola | Comportamento |
|---|---|
| Un fornitore che non risponde viene ricordato **24 ore** | Poi si ritenta: un guasto di oggi non è una condanna |
| Un modello ritirato viene appreso dal messaggio d'errore | Le liste codificate a mano invecchiano |
| Un'attesa imposta superiore a **10 secondi** fa cambiare fornitore, se ce n'è uno pronto | Oltre quella soglia l'utente crede che l'app sia bloccata |
| Un turno alla volta | Due invii sovrapposti corrompono la cronologia |
| I fornitori a pagamento non vengono proposti come gratuiti | Senza fatturazione attiva si sbatte sul limite alla prima domanda |

### 5.3 Dati dell'utente

| Regola | Comportamento |
|---|---|
| Massimo 30 conversazioni, 100 messaggi ciascuna | Oltre, `localStorage` si riempie e **ogni** salvataggio successivo fallisce |
| Immagini fino a 20 MB | Oltre, rifiuto esplicito; le altre proseguono |
| Cancellazione selettiva per gruppi | Azzerare tutto per liberare spazio è una perdita evitabile |
| Una scrittura fallita **deve** essere dichiarata | «✅ Salvato» quando non è vero è peggio di un errore |

---

## 6. Limitazioni attuali

Dichiarate, non nascoste. Il dettaglio è in
[`09-Release-Conformance-Statement.md`](https://github.com/samupropio1-ship-it/BioSpecInfo-v11/blob/main/docs/09-Release-Conformance-Statement.md) §4.

| # | Limitazione | Conseguenza pratica |
|---|---|---|
| 1 | **2 voci senza struttura da mostrare** (erano 6) | Ivermectina è una miscela di omologhi B1a/B1b e Coartem un'associazione di due principi attivi: una sola notazione SMILES non le rappresenta, e per queste due mancano 2D/3D e spettri previsti. Digossina, vincristina e tacrolimus (topico e sistemico) hanno ora la struttura, ripresa da ChEMBL e verificata contro il peso molecolare |
| 2 | **Spettri predetti, non misurati** | Utili per riconoscere i gruppi funzionali; non per identificazione formale |
| 3 | **Nessuna sincronizzazione** | I dati non passano da un dispositivo all'altro, e non esistono copie sul server |
| 4 | **File Manager: deterrente, non sicurezza** | Su un sito statico chi legge il sorgente aggira qualunque controllo lato pagina. Nel sorgente c'è solo l'impronta SHA-256 della password, mai la password |
| 5 | **Funzioni che richiedono rete** | Nome IUPAC, CAS, GHS, conformeri 3D, assistente AI |
| 6 | **Accessibilità automatizzata, non completa** | Contrasto, nomi accessibili, etichette, gerarchia dei titoli su 13 pagine e tutte le 194 sezioni: **0 difetti**, compreso il testo su gradiente (valutato sulla tappa peggiore). Restano fuori il testo dentro gli SVG e quello su una vera immagine di sfondo, contati a ogni esecuzione, e tutto ciò che richiede giudizio umano |
| 7 | **Cromatografia: nessuna previsione di ritenzione** | La sezione calcola risoluzione, efficienza e indici **dati** k, α e N; non prevede k da una struttura, che richiederebbe parametri sperimentali della fase stazionaria |
| 8 | **Copertura di codice parziale** | Misurata: **49,89 %** di istruzioni sul percorso più ampio che un banco compie. Non è la copertura dell'intera batteria, ed è di istruzioni, non di rami; vedi `08-Traceability-Matrix.md` §8 |
| 9 | **Verifica su Chromium soltanto** | Firefox e WebKit sono provati a mano, non da banco |
| 10 | **La mente di Spectra è una simulazione** | Memoria e stato interno sono dati e regole nel browser, non comprensione né sentimenti. Il quadro della mente e il contesto dello schermo vanno al fornitore insieme alla domanda, quando la domanda va al modello |
| 11 | **Alcuni dati di astrofisica sono illustrativi** | La popolazione di esopianeti non è un catalogo; le «osservazioni» delle curve di rotazione sono un modello con rumore; la mappa della CMB è sintetizzata da uno spettro di potenza illustrativo. Le sezioni lo dichiarano |
| 12 | **Spectra Live e gli strumenti rapidi senza banco** | Dalla v238 `test_spectra238` prova impaginazione, navigatore, livello, volto e comandi del creatore, dalla v239 anche il pulsante unico, e `test_lezione` la lezione guidata e «fammi lezione»; la voce, gli altri comandi locali, gli strumenti che agiscono sulla pagina e il menu ✨ per materia sono provati a mano (`08-Traceability-Matrix.md` §6, UI-21 e AI-13) |
| 13 | **Il volto di Spectra pesa circa 8 MB** | `models/spectra-noir.glb` non è nel precarico del service worker: si scarica la prima volta che l'app ricava l'icona di Spectra (pochi secondi dopo il primo avvio, se c'è WebGL) o apre la console. Se non arriva, la console usa il volto di ripiego |
| 14 | **Il riconoscimento del creatore non è un controllo d'accesso** | L'impronta SHA-256 è nel codice e il segno del riconoscimento (`bsi-spectra-creatore-v1`) sta nel `localStorage`: chi ha il dispositivo può scriverlo a mano. Come la password del File Manager, è un deterrente e non protegge dati |
| 15 | **La lezione guidata nasce dalla pagina, non da un autore** | La lezione legge spiegazioni, tele e comandi della sezione: dove una scheda ha poco testo, il capitolo dice poco. La domanda di verifica è scelta per parole in comune con la sezione e può essere solo vicina all'argomento; 115 sezioni su 194 non ne hanno una. La voce non è provata dal banco. Il modello a cui si ispira (la lezione interattiva di Every Joule) non era raggiungibile durante lo sviluppo: la lezione ne è un'interpretazione |
| 16 | **Spectra Studio è un primo prototipo; il corpo serve la rete al primo avvio** | Tre lezioni soltanto. Il corpo scelto dall'autore (licenza Royalty Free di CGTrader) è incorporato nell'app come blocco impacchettato (`models/spectra-corpo.bsi`, 4,40 MB) e si scarica la prima volta: senza rete al primo avvio compare «Spectra non è arrivato: serve la rete la prima volta» con «↻ Riprova»; nessun sostituto. L'impacchettamento non è una protezione assoluta: il file pubblicato non è un `.glb` riutilizzabile, ma chi legge il codice può ricostruirlo. I capelli neri sono garantiti dal driver ma provati solo sul manichino del suo banco. I testi dell'interfaccia dello studio sono in italiano |
| 17 | **Con una chiave OpenAI e la voce accesa il testo pronunciato va a OpenAI** | La voce di qualità invia a OpenAI il testo che Spectra pronuncia, anche quando la chat usa un altro fornitore e senza passare dal proxy. Si evita spegnendo la voce (🔇) nella console, nella lezione guidata o in Spectra Studio, dove la scelta resta ricordata, oppure non salvando una chiave OpenAI |

---

## 7. Sviluppi possibili

Non impegni: direzioni coerenti con l'architettura.

| Area | Proposta | Perché |
|---|---|---|
| Dati | Le 2 voci residue non hanno una struttura da mostrare | Non è una lacuna da chiudere: ivermectina è una miscela, Coartem un'associazione. Semmai si potrebbero mostrare i **componenti**, dichiarandoli tali |
| Spettri | Confronto con database sperimentali (SDBS/NIST) dentro l'app | Renderebbe visibile la distanza fra predizione e misura |
| Accessibilità | Affiancare `axe-core` per le regole che il banco non implementa | Ruoli ARIA, ordine di tabulazione e gestione del fuoco restano fuori dalla misura attuale |
| Esportazione | Esportazione completa dei dati utente | Unico rimedio possibile all'assenza di copie di sicurezza |
| Assistente | Proxy preconfigurato per chi non vuole pubblicarne uno | Toglierebbe l'ultima barriera d'accesso all'AI |

---

_Documento aggiornato alla versione `bsi-v244`._
