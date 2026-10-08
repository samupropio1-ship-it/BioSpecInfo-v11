# Specifiche funzionali — BioSpecInfo

| Campo | Valore |
|-------|--------|
| **Software** | BioSpecInfo |
| **Versione descritta** | `bsi-v198` |
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

L'applicazione conta **92 sezioni**, raggruppate per area di studio.

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
| **Spettro da una figura (digitalizzazione)** | Dalla fotografia di un registratore, dal ritaglio di un articolo o dallo schermo dello strumento si estrae la traccia dai **pixel**: la cornice degli assi viene riconosciuta e digitalizzata solo la parte interna, la posizione della linea è il **baricentro pesato sulla scurezza** (subpixel), la griglia viene aggirata per continuità e scurezza, i due assi si tarano in lineare o in logaritmica, la %T si converte in assorbanza con A = −log₁₀T. Il grafico, i picchi e le assegnazioni compaiono da sé e si rifanno a ogni modifica della taratura; una diagnosi dice che cosa è stato deciso e perché. Uscite CSV e JCAMP-DX. Scarto misurato: medio 2,2 cm⁻¹, peggiore 7,3 su sette figure costruite |
| **Modello 3D dalla struttura disegnata** | Coordinate costruite dal grafo, con gli stessi indici del predittore: un picco cliccato illumina l'atomo anche in tre dimensioni |
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

`verifica-accessibilita` percorre le 92 sezioni e misura ciò che è **visibile**.
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

### 3.8 Assistente «Spectra»

Agente AI con **35 strumenti** che può interrogare l'applicazione stessa:
calcolare descrittori, generare spettri, cercare costanti, bilanciare reazioni,
aprire sezioni. Supporta dieci fornitori, e resta utilizzabile quando uno di
essi si guasta (§5.2).

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
1. Si tocca il pulsante «Spectra»
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
[`09-Release-Conformance-Statement.md`](09-Release-Conformance-Statement.md) §4.

| # | Limitazione | Conseguenza pratica |
|---|---|---|
| 1 | **2 voci senza struttura da mostrare** (erano 6) | Ivermectina è una miscela di omologhi B1a/B1b e Coartem un'associazione di due principi attivi: una sola notazione SMILES non le rappresenta, e per queste due mancano 2D/3D e spettri previsti. Digossina, vincristina e tacrolimus (topico e sistemico) hanno ora la struttura, ripresa da ChEMBL e verificata contro il peso molecolare |
| 2 | **Spettri predetti, non misurati** | Utili per riconoscere i gruppi funzionali; non per identificazione formale |
| 3 | **Nessuna sincronizzazione** | I dati non passano da un dispositivo all'altro, e non esistono copie sul server |
| 4 | **File Manager: deterrente, non sicurezza** | Su un sito statico chi legge il sorgente aggira qualunque controllo lato pagina. Nel sorgente c'è solo l'impronta SHA-256 della password, mai la password |
| 5 | **Funzioni che richiedono rete** | Nome IUPAC, CAS, GHS, conformeri 3D, assistente AI |
| 6 | **Accessibilità automatizzata, non completa** | Contrasto, nomi accessibili, etichette, gerarchia dei titoli su 13 pagine e tutte le 92 sezioni: **0 difetti**, compreso il testo su gradiente (valutato sulla tappa peggiore). Restano fuori il testo dentro gli SVG e quello su una vera immagine di sfondo, contati a ogni esecuzione, e tutto ciò che richiede giudizio umano |
| 7 | **Cromatografia: nessuna previsione di ritenzione** | La sezione calcola risoluzione, efficienza e indici **dati** k, α e N; non prevede k da una struttura, che richiederebbe parametri sperimentali della fase stazionaria |
| 8 | **Copertura di codice parziale** | Misurata: **49,89 %** di istruzioni sul percorso più ampio che un banco compie. Non è la copertura dell'intera batteria, ed è di istruzioni, non di rami; vedi `08-Traceability-Matrix.md` §8 |
| 9 | **Verifica su Chromium soltanto** | Firefox e WebKit sono provati a mano, non da banco |

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

_Documento aggiornato alla versione `bsi-v198`._
