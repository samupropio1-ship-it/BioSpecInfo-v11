# Guida per chi la usa — BioSpecInfo

_Questa guida è scritta per chi studia, non per chi programma. Non serve sapere
nulla di informatica._

---

## Che cos'è

BioSpecInfo è un'applicazione per studiare chimica, biochimica, farmacologia e
astrochimica. Si apre come un sito, ma si può **installare** sul telefono o sul
computer e funziona anche **senza internet**.

Tre cose da sapere subito:

- **Non serve registrarsi.** Nessun account, nessuna email, nessuna password.
- **Non costa nulla.**
- **I tuoi dati restano tuoi.** Appunti, file e conversazioni non escono dal tuo
  dispositivo: non c'è nessun server a cui possano arrivare.

👉 **[samupropio1-ship-it.github.io/BioSpecInfo-v11](https://samupropio1-ship-it.github.io/BioSpecInfo-v11/)**

---

## Installarla (facoltativo, ma conviene)

Installandola ottieni un'icona sullo schermo, l'apertura a schermo intero e il
funzionamento offline.

| Dispositivo | Come si fa |
|---|---|
| **Android / Chrome** | Menu ⋮ → *Installa app* (o *Aggiungi a schermata Home*) |
| **iPhone / iPad** | Pulsante Condividi → *Aggiungi a Home* |
| **Computer** | Icona di installazione nella barra degli indirizzi, a destra |

Dopo l'installazione, apri l'app una volta con la rete attiva: scaricherà tutto
quello che le serve. Da quel momento funziona anche senza campo.

---

## Muoversi nell'app

| Elemento | Dove si trova | A cosa serve |
|---|---|---|
| **🔍 Cerca** | In alto | Cerca in tutta l'app. Scorciatoia: `Ctrl+K` |
| **Menu delle sezioni** | Barra di navigazione | Le 128 sezioni, raggruppate per materia |
| **✨** | In basso a destra | Strumenti, impostazioni e aggiornamenti |
| **Spectra** | In basso a destra | L'assistente che risponde alle domande |

---

## Le cose che farai più spesso

### Analizzare una molecola

1. Apri **Centro spettroscopico**
2. Scrivi la molecola nella casella. Puoi usare:
   - il **nome** — `aspirina`, `caffeina`
   - la **formula SMILES** — `CC(=O)Oc1ccccc1C(=O)O`
   - oppure **disegnarla** con l'editor
3. Premi Invio

Ottieni la struttura in 2D e 3D, i gruppi funzionali, il peso molecolare, gli
spettri previsti (IR, NMR, massa, UV-Vis) e le proprietà farmacologiche.

> **Se sei senza rete:** la ricerca per *nome* non funziona, perché deve
> consultare una banca dati esterna. La formula SMILES invece funziona sempre.

### Leggere uno spettro IR

Lo spettro è disegnato come su uno strumento vero: la scala in basso va da 4000
a 400 cm⁻¹ (**da sinistra a destra i numeri calano**) e le bande puntano verso
il **basso**.

La zona colorata sotto i 1500 cm⁻¹ è l'**impronta digitale**: è lì che si
riconosce la molecola specifica, non solo la sua classe. Sotto il grafico trovi
l'elenco delle bande con la loro assegnazione.

> Gli spettri sono **previsti** dalla struttura, non misurati in laboratorio.
> Servono a riconoscere i gruppi funzionali e a capire il legame fra struttura e
> spettro. Per un dato sperimentale, l'app ti rimanda ai database ufficiali.

### Tutto sugli spettri, in un posto solo

Le cose che si fanno con uno spettro stavano in **nove sezioni** sparse su due
menù diversi. Ora c'è **🔬 Centro spettri**, una sezione sola con dieci schede:

| scheda | a che serve |
|---|---|
| **Leggi il tuo spettro** | un file, una fotografia, un PDF |
| **Prevedi NMR** | ¹H e ¹³C assegnati per atomo |
| **NMR 2D e NOE** | COSY, HSQC, HMBC |
| **Massa** | frammentazione e perdite neutre |
| **IR** | bande e gruppi funzionali |
| **UV-Vis** | cromofori e λmax |
| **Tabelle di riferimento** | ¹H, ¹³C, IR, costanti J |
| **Tutto su una molecola** | editor, spettri, gruppi, confronto |
| **Elucida una struttura** | dai dati a una proposta |
| **Allenati** | riconosci il gruppo dallo spettro |

I pannelli sono gli stessi di prima: sono stati **spostati**, non copiati — non
esiste una seconda copia di niente. I vecchi collegamenti continuano a
funzionare: se qualcosa nell'applicazione ti mandava a «Spettro MS», ora ti
porta al Centro spettri aperto sulla scheda **Massa**.

> **Due tabelle delle costanti J, con numeri diversi.** Ce n'erano due: una
> dava il ³J orto aromatico a 6–9 Hz, l'altra a 7–10. Chi cercava quel numero
> otteneva una risposta diversa a seconda di dove entrava. Ne resta **una**,
> quella dentro il Centro spettri, che sta nella sezione con la sua lista di
> riferimenti.

### Cambiare lingua: il tondo in alto a destra

All'altezza del titolo, all'estremo destro, c'è un **pulsante tondo** con la
bandiera della lingua in uso. Si apre in un **disco**: le quattordici bandiere
disposte su due gusci — sei dentro, come un anello benzenico, e otto fuori — e
al centro compare il nome della lingua su cui stai passando e **quanto è
tradotta**. Quella percentuale non è scritta a mano: è misurata applicando il
dizionario e contando quello che resta in italiano.

Tocca una bandiera e l'interfaccia cambia subito. `Esc` chiude il disco.

> La sezione **🌍 Lingua** resta, e fa un'altra cosa: spiega le lingue, mostra
> la copertura di ognuna e dice che l'arabo porta con sé il verso di scrittura.
> Quella **informa**, questo **agisce**.

### ⚛️ Fisica: otto sezioni calcolate

Nella categoria **⚛️ Fisica** della barra ci sono otto sezioni in cui la fisica
che sta sotto la chimica si **calcola**, non si racconta. Ogni numero che vedi è
confrontato dal banco con un valore indipendente della letteratura.

| sezione | che cosa fai |
|---|---|
| 🌊 **Schrödinger** | scegli un potenziale (pozzo, oscillatore armonico, Morse, doppia buca) e vedi livelli e funzioni d'onda con la soluzione esatta accanto; lanci un pacchetto d'onda contro una barriera (effetto tunnel); vedi le vibrazioni di HCl, H₂, CO e N₂ in cm⁻¹ |
| 🧮 **Hartree-Fock** | un calcolo ab initio vero (RHF/STO-3G) su otto molecole: energia, orbitali con le loro energie, cariche di Mulliken, la mappa dell'orbitale scelto, la curva di dissociazione |
| 🎻 **Rotovibrazionale** | lo spettro IR di una biatomica gassosa con i rami P e R: cambia temperatura, risoluzione, isotopo; il Raman rotazionale di N₂, O₂, H₂, CO₂; dalle righe alla lunghezza di legame |
| 🎲 **Termodinamica statistica** | entropia e capacità termica di nove gas calcolate dalle costanti molecolari, contributo per contributo, e le popolazioni rotazionali e vibrazionali |
| 🎱 **Dinamica molecolare** | particelle di Lennard-Jones dal vivo: scaldi, comprimi e vedi gas, liquido e cristallo, con la distribuzione delle velocità e la g(r) |
| ∑ **Matematica per la chimica** | dal FID allo spettro con la trasformata di Fourier; Hückel su dodici sistemi π; cinetiche con Runge-Kutta; la retta di Arrhenius con gli errori dai tuoi dati |
| 💎 **Cristallografia** | i 14 reticoli di Bravais da ruotare, i piani di Miller, il diffrattogramma di polvere di undici cristalli con le estinzioni |
| ☢️ **Radiochimica** | le catene di decadimento (il generatore di tecnezio degli ospedali), la datazione con ¹⁴C, K-Ar e U-Pb, l'energia di legame dei nuclei |

### 📐 Matematica: dalla base all'avanzata

Nella categoria **📐 Matematica** ci sono otto sezioni che lavorano su un vero
motore di calcolo simbolico: scrivi le espressioni come le scriveresti a mano
(`2x² + sin(3x)`, `√(x+1)`, `e^(-k*t)`, `ln(x)/x`, anche `sen` e `tg`) e i
risultati sono **esatti** — 1/3 resta 1/3. Le primitive compaiono solo se,
derivandole, si riottiene la funzione di partenza.

| sezione | che cosa fai |
|---|---|
| 🔢 **Basi di matematica** | conti le cifre significative e applichi le regole delle misure; logaritmi e pH; risolvi equazioni con i passaggi, dal primo grado ai polinomi (anche radici complesse) e alle equazioni fratte dell'equilibrio (acido debole); ti alleni con esercizi sempre nuovi e la correzione |
| 📈 **Studio di funzione** | scrivi f(x): dominio, simmetria, zeri, derivate esatte, massimi, minimi, flessi, asintoti verticali, orizzontali e obliqui, la tangente che si sposta; e le famiglie di funzioni con a·f(b(x−c))+d |
| ∫ **Derivate, integrali e serie** | la derivata con l'elenco delle regole usate; la primitiva e l'integrale definito con le somme di Riemann; il polinomio di Taylor di grado n; i limiti, destro e sinistro |
| 🔲 **Algebra lineare** | sistemi, determinante, inversa, rango, nucleo, autovalori, in frazioni esatte e con ogni passaggio di Gauss-Jordan; le trasformazioni del piano; il bilanciamento di una reazione (anche redox con le cariche) come nucleo della matrice di composizione |
| 🌀 **Equazioni differenziali** | il campo di direzioni di y′ = f(x, y) con le soluzioni che partono dove tocchi; Eulero, Heun e RK4 a confronto; il piano delle fasi di preda-predatore, pendolo, Van der Pol, Bruxellatore, SIR, con gli equilibri classificati |
| 🗻 **Funzioni di più variabili** | superfici 3D da ruotare e mappe a curve di livello, gradiente, hessiano, minimi, massimi e selle (lo stato di transizione), discesa del gradiente; funzioni di stato, relazione di Maxwell, differenziali esatti |
| ℂ **Complessi e Fourier** | numeri complessi sul piano di Argand, radici n-esime, la formula di Eulero, le serie di Fourier con il fenomeno di Gibbs |
| 📏 **Statistica di laboratorio** | media, deviazione standard, intervallo di confidenza; Grubbs e Dixon per gli anomali; test t e F con il valore p; propagazione delle incertezze; retta di taratura con LOD, LOQ e l'incertezza del campione |

### 🎓 Esami UniBA: Chimica, Matematica e Fisica, dalla base all'avanzatissimo

**🎓 Esame di Chimica** (categoria 🔬 Chimica) ha 40 problemi tipo su quattro livelli: base (moli, stechiometria, gas, soluzioni, termochimica, cinetica, equilibri, acidi e basi, solubilità, elettrochimica, atomo), intermedio (analitica: titolazioni, Lambert-Beer, gravimetria, EDTA, acidi poliprotici), avanzato (chimica fisica: van ’t Hoff, Clausius-Clapeyron, polieni, rotore e oscillatore, Michaelis-Menten) e avanzatissimo (Sackur-Tetrode, Debye-Hückel, Pourbaix). Le reazioni si bilanciano da sole. In Matematica e Fisica il livello **A** porta oltre i due corsi: autovalori, sistemi di EDO, Fourier, Laplace, integrali tripli; onde, fisica moderna e quantistica.


**🎓 Esame di Matematica** (categoria 📐) e **🎓 Esame di Fisica** (categoria ⚛️) seguono i programmi del corso di laurea in Chimica dell'Università di Bari. In ciascuna: il **programma** spiegato argomento per argomento con il metodo; il **risolutore**, che scrive lo svolgimento passo per passo con i tuoi dati; le **prove svolte** nello stile dello scritto (costruite sui programmi: non sono i testi ufficiali). In Matematica c'è anche una **simulazione d'esame** a tempo. In ⚛️ Fisica ci sono inoltre **⚡ Elettrodi e stato di transizione** e **🌟 Fotochimica, superfici e polimeri**.

### 🎯 I laboratori in movimento

Nella categoria **⚛️ Fisica** ci sono **🎯 Meccanica in movimento**, **〰️ Onde e ottica**, **🔌 Circuiti** e **🔥 Termodinamica in movimento**; nella categoria **📐 Matematica** ci sono **🧮 Metodi numerici** e **📐 Geometria analitica e vettori**; nella categoria **⚗️ Chimica Fisica** c'è **⚖️ Equilibrio e Le Chatelier**. Ogni scheda ha i cursori a sinistra e la simulazione a destra, con i numeri che la descrivono sotto i comandi. Nel simulatore dell'equilibrio i pulsanti aggiungono o tolgono una specie, cambiano il volume o la temperatura: le concentrazioni si muovono finché Q torna uguale a K, e la nota dice da che parte va la reazione.

### 🧊 Laboratorio 3D, grafici e viste molecolari

Nella categoria **⚛️ Fisica** il **🧊 Laboratorio 3D** mostra in tre dimensioni superfici, orbitali atomici, moti nello spazio, strutture cristalline e linee di campo. Si ruota trascinando con un dito o con il mouse e si ingrandisce con due dita o con la rotellina. I pulsanti in alto a destra avviano la rotazione automatica (⟳), tornano alla vista iniziale (⌖), salvano un'immagine (📷) e passano a schermo intero (⛶). Passando con il dito o con il mouse su un grafico di qualunque sezione compare un mirino con il valore di ogni curva in quel punto. Le viste molecolari 3D hanno la stessa barra, più il pulsante ✦ che sceglie la qualità: automatica, alta (con occlusione ambientale), media o bassa per i telefoni lenti. Chi ha attivato «riduci movimento» nel sistema operativo non vede animazioni.

### ⚗️ ⚛️ 📐 Le tre macro-aree e l'assistente

In testa alle categorie **🔬 Chimica**, **⚛️ Fisica** e **📐 Matematica** c'è l'area della materia. Nella scheda **🤖 Assistente** si scrive il problema come lo si scriverebbe al professore, per esempio «un'auto a 90 km/h frena con 5 m/s²», «quanti grammi di NaCl servono per 250 mL di soluzione 0,5 M» o «y'' + 4y = sin(x), y(0)=0, y'(0)=1», e si preme **Risolvi e spiega**. La risposta dice che cosa è stato capito; la tabella **Dati usati** mostra in verde i dati letti dal testo, in giallo quelli dedotti e in rosso quelli supposti, da controllare. Se il modello scelto non è quello giusto, i pulsanti **Intendevi…?** propongono gli altri, e **Correggi i dati nel risolutore** apre il problema con i suoi campi. La scheda **🗂️ Tutti gli strumenti** raccoglie le sezioni della materia, con la ricerca; **🧭 Livelli** le ordina dalle superiori al dottorato.

### 🧭 Dalle superiori al dottorato

Nella categoria **📚 Studio** la sezione **🧭 Dalle superiori al dottorato** dice, per chimica, fisica e matematica, che cosa si deve saper fare a ogni livello e apre con un clic gli strumenti giusti. Nell'**Esame di Fisica** ci sono anche astrofisica, fisica nucleare e fisica quantistica (fino al metodo variazionale e alle perturbazioni); nell'**Esame di Chimica** organica, spettroscopia, biochimica e un livello di dottorato (Marcus, effetto isotopico, tunnelling); nell'**Esame di Matematica** i residui e l'equazione del calore.

### Dove si trovano le cose

Le sezioni stanno nella **barra di navigazione**, raggruppate per materia, con
**🛠️ Utility** fra loro: laboratorio, GHS, mappa concettuale, confronto
molecole, ricerca molecole, atlante, risorse, materiali, note, file manager,
statistiche, data science, pomodoro, calcolatrice di laboratorio, **articoli**,
e le due della lingua.

Il menù **✨** tiene soltanto quello che *non* è una sezione: gli editor, i
laboratori in sovrapposizione, e le azioni come esportare una figura, stampare,
condividere, aggiornare. La regola è semplice e vale sempre: **se una cosa è
nella barra, non è anche nel menù**. Prima non era così, e nel menù comparivano
due «Data Science», due «File Manager», due «Articoli» e due «Aggiornamenti».

Due eccezioni, e hanno un motivo:

- **Spectra** non è nella barra: ha il suo pulsante dedicato, quello che pulsa
  in basso. Tre strade per il copilota erano troppe.
- Il **lettore spettri** non è nella barra: è una scheda del Centro spettri.

> **Due File Manager, e sono due cose diverse.** Nella barra, **📁 File
> Manager** serve a caricare e ordinare i tuoi appunti (PDF, immagini, Word).
> Nel menù ✨, **🔒 File Manager protetto** è una pagina a parte con la
> password, per la galleria e le sezioni personalizzate. Avevano lo stesso
> nome e sembravano un doppione: ora si chiamano per quello che fanno.

### Gli articoli e i Nobel

**📰 Articoli** (dal menù ✨) ha due schede.

**Ultimi articoli** mostra quello che è uscito negli ultimi due mesi, per
argomento: spettroscopia, sintesi, catalisi, farmaci, materiali, biochimica,
computazionale. Non è un elenco scritto a mano — sarebbe vecchio domani: arriva
da **Crossref**, la banca dati dei DOI, nel momento in cui apri la scheda. Ogni
titolo porta al suo **DOI**, che è un indirizzo permanente, e accanto c'è il
collegamento per **leggerlo in italiano**.

**Nobel per la chimica** elenca tutti i premi. Anni, premiati e motivazioni
vengono dalla **Fondazione Nobel**, in diretta: non sono scritti dentro
l'applicazione. La **spiegazione** in italiano invece sì — ed è abbinata
all'*argomento* della motivazione ufficiale, non all'anno, così nessuna
attribuzione viene da qui. Per ogni premio trovi la pagina ufficiale, il
materiale scientifico e quello divulgativo della Fondazione, la versione
tradotta in italiano e una ricerca su Wikipedia italiana — tutti indirizzi
**costruiti** dall'anno, non scritti.

> **Se un premio non ha la spiegazione, te lo dico.** Preferisco scrivere «per
> questo premio non ho una spiegazione» e lasciarti la motivazione ufficiale e
> il materiale della Fondazione, che è la fonte, piuttosto che inventare.

> **Serve la rete.** Senza, non vedi una lista vecchia spacciata per nuova:
> vedi che cosa ho chiesto, a chi, e perché non è arrivato — con l'indirizzo
> della richiesta, che puoi aprire a mano.

### Leggere uno spettro che hai misurato tu

La sezione **Lettore spettri** fa il contrario di quella sopra: non prevede uno
spettro dalla struttura, legge quello che hai già.

Ci sono **due bottoni**, e non sono un doppione.

`📂 Apri un file` non filtra niente: qualunque cosa hai in cartella, aprila.
`📷 Foto o immagine di uno spettro` apre invece la **galleria del telefono** e
ti lascia anche scattare la foto sul momento — su un telefono sono due
selettori diversi del sistema, non due filtri dello stesso, e senza il secondo
non c'è modo di dare una fotografia.

Sotto i bottoni compare una riga che **ti dice che cosa ha deciso di essere** il
file che hai aperto:

| Quello che apri | Che cosa succede |
|---|---|
| un **PDF**, un **Word**, un OpenDocument, un foglio di calcolo | si apre, te lo mostra per intero e **svolge** quello che contiene |
| una **fotografia** (`.png`, `.jpg`, …) | tutte e due le cose: ne estrae la **traccia** e la mostra anche come pagina, perché può essere la foto di uno spettro o di un foglio |
| un **JCAMP-DX** (`.jdx`, `.dx`), anche compresso | è uno spettro: lo dichiara il formato stesso |
| un **testo** o un **`.csv`** | si decide **dal contenuto**: se ci sono dei numeri che formano una curva è uno spettro, altrimenti è il **testo di un quesito** e lo svolge |

Se preferisci, puoi **incollare** i dati o il testo del quesito nella casella e
premere **Leggi e svolgi**: fa lo stesso ragionamento.

> Prima c'erano due schede, e quella degli spettri lasciava scegliere solo
> `.jdx` e `.csv`. Su un telefono quel filtro non restringeva, **nascondeva**:
> chi ci arrivava con il PDF di un compito vedeva una cartella vuota. Ora la
> porta è una e non filtra niente.

Se non hai un file sotto mano, i tre pulsanti **esempio IR**, **esempio MS** ed
**esempio NMR** caricano uno spettro di prova, e **esempio: un quesito d'esame**
carica una traccia completa.

Dentro la sezione c'è **📖 Come si usa — guida completa**: sette capitoletti
che spiegano passo per passo i due bottoni, la taratura, che cosa fa il
programma da solo, che cosa non può fare, come riconoscere un risultato storto
dal sintomo che vedi, e come portare via i numeri.

### Uno spettro che hai solo come figura

La traccia viene estratta dai **pixel**, e il grafico compare subito. Poi va
**tarata**, perché i numeri degli assi non stanno nell'immagine:

| campo | che cosa ci scrivi |
|---|---|
| **x a sinistra** / **x a destra** | i valori ai due estremi del grafico — per un IR tipicamente 4000 e 400 **in quest'ordine**, perché l'IR si scrive con i numeri d'onda che decrescono |
| **y in basso** / **y in alto** | i valori dell'asse verticale; per una figura in %T, 0 in basso e 100 in alto |
| **unità y** | `%T`, `T`, `A` o intensità. Scegliendo `%T` l'assorbanza si ricava con **A = −log₁₀T**, che è la definizione |
| **x/y logaritmica** | se un asse è logaritmico, dillo: applicargli una mappa lineare non dà un errore, dà numeri sbagliati dall'aspetto giusto |
| **cornice** | normalmente la trovo io; «tutta la figura» serve quando la figura è già ritagliata al solo grafico |

Cambi un campo e il grafico si rifà da sé: non c'è niente da confermare. Sotto
compare la **diagnosi** — quante colonne, se la cornice è stata trovata e su
quali lati, sfondo e soglia, quante colonne erano griglia — perché un numero
senza il suo come non si può contestare.

Che cosa faccio da solo: trovo la **cornice degli assi** e digitalizzo solo
quello che c'è dentro (i numeri scritti sugli assi sono pixel scuri come la
traccia); **sopravvivo alla griglia**, scegliendo in ogni colonna il tratto
vicino a dove la traccia stava un pixel prima e abbastanza scuro da essere
traccia; leggo a **subpixel**, perché il centro di una linea spessa due pixel
sta in mezzo.

> **Quanto sbaglio.** Misurato su sette figure costruite di cui si conoscono i
> centri delle bande: scarto **medio 2,2 cm⁻¹**, **peggiore 7,3**. Una colonna
> di una figura larga 900 pixel su 3600 cm⁻¹ vale circa 4 cm⁻¹: sotto quel
> valore non c'è niente da guadagnare, è il limite della figura.

> **Se la taratura è sbagliata**, i picchi escono a numeri sbagliati pur stando
> nel punto giusto della figura: la forma si recupera dai pixel, la taratura
> no. E una foto presa di sbieco porta una deformazione che non raddrizzo —
> inquadra la figura di fronte.

Con **scarica CSV** e **scarica JCAMP-DX** i numeri escono da qui: il JCAMP lo
apre qualunque programma di spettroscopia, e questo stesso lettore lo rilegge
identico. Dentro c'è scritto che la taratura è stata data a mano.

Sotto il grafico trovi i picchi trovati con il loro rapporto segnale-rumore, e
per ogni banda **tutte** le assegnazioni compatibili. Se a 1715 cm⁻¹ leggi due
righe, non è un difetto: a quel numero d'onda un chetone e un acido
carbossilico sono entrambi possibili, e dirne uno solo sarebbe inventare.

### Aprire un quesito e fartelo svolgere

Lo stesso bottone, `📂 Apri un file`. Accetta il PDF della prova, la
fotografia del foglio, un file Word, un testo — e ti mostra **tutto** quello
che c'è dentro: ogni pagina disegnata (cliccala per ingrandirla) e il testo per
intero.

Poi, se nel testo ci sono dati spettroscopici, li riconosce e li mette in
tabella **con scritto accanto da dove li ha presi**. Quella tabella sta sopra
lo svolgimento apposta: guardala prima. Se ha scambiato una massa per una
banda IR, lo svolgimento che segue sarà impeccabile e la risposta sbagliata, e
te ne accorgi lì.

Lo svolgimento elenca i passaggi con la **prova** di ognuno e quanto è certo:
i gradi di insaturazione sono aritmetica, il numero di carboni dal picco M+1 è
una stima con un margine, una banda IR è *compatibile con* più cose.

> **Non ti dà la struttura.** Un insieme di dati spettroscopici è compatibile
> con più di una molecola, e un programma che ne sputasse fuori una sola
> darebbe una certezza che i dati non contengono. Quello che puoi fare è il
> contrario: scrivi tu una struttura e il programma la **confronta**, segnale
> per segnale, dicendo dove casca.

> **Se il documento è una scansione**, il testo non si legge: una pagina
> scansionata contiene pixel, non lettere, e non c'è riconoscimento ottico dei
> caratteri. L'app te lo dice invece di far finta che il foglio fosse vuoto.
> Le pagine restano visibili, e se una è la fotografia di uno spettro la
> traccia si estrae con **Apri un'immagine**.


> Il lettore **non ti dice che molecola è**. Un insieme di bande è compatibile
> con molte molecole diverse: il passo dallo spettro alla struttura lo fai tu,
> con il resto di quello che sai sul campione.

### Scegliere la lingua

Nella sezione **Lingue** ci sono **quattordici** lingue, con un campo di ricerca
per trovarle in fretta: italiano, inglese, spagnolo, francese, tedesco,
portoghese, olandese, polacco, romeno, greco, russo, cinese, giapponese e arabo.
Scegliendo l'arabo cambia anche il **verso** della pagina, da destra a sinistra.

Accanto c'è **Linguaggi**, che è un'altra cosa: converte una molecola fra le
venticinque notazioni con cui la chimica la scrive — SMILES, InChI, SMARTS,
molfile, XYZ, PDB, CML, le impronte digitali — e, per una classe dichiarata di
molecole semplici, ne scrive il **nome IUPAC**. Fuori da quella classe lo dice,
invece di tentare un nome sbagliato.

### Studiare con le schede

1. Apri la sezione di studio
2. Genera un mazzo di schede
3. Per ogni scheda, dopo aver risposto, dichiara quanto la ricordavi

L'app calcola **quando** riproportela: le cose che sai bene tornano di rado,
quelle incerte tornano presto. Riaprendo trovi solo le schede in scadenza.

### Consultare un farmaco

Apri **Farmacologia**. Per ognuno dei 263 farmaci trovi struttura, peso
molecolare, meccanismo d'azione, indicazioni, effetti avversi e classe.

> ⚕️ **Solo a scopo didattico.** Queste informazioni non sostituiscono il parere
> di un medico o di un farmacista, e non servono per decidere una terapia.

---

## Spectra, l'assistente

Spectra risponde alle domande di chimica e può usare gli strumenti dell'app:
calcolare, generare spettri, cercare costanti, bilanciare reazioni.

### Farlo funzionare

Spectra si appoggia a un servizio di intelligenza artificiale esterno, e ti
serve una **chiave** gratuita. Due strade:

**La più semplice — una chiave tua**

1. Vai su [console.groq.com](https://console.groq.com/keys) e crea una chiave
   (gratuita, bastano due minuti)
2. Aprila Spectra, incolla la chiave nel riquadro 🔑
3. Fatto

**La definitiva — un proxy**

Se ti capita spesso che i servizi non rispondano, o non vuoi tenere la chiave
sul telefono, puoi pubblicare un *proxy*: un programmino gratuito che tiene la
chiave al sicuro e fa funzionare anche i servizi che dal browser sono bloccati.

Nel riquadro **Proxy** dell'assistente trovi **«Come si attiva, in 4 passi»**,
con i comandi già pronti da copiare.

### Quando Spectra non risponde

Quasi sempre non è colpa dell'app, ma del servizio esterno. Premi **🔌 Prova**
nel pannello di Spectra: in pochi secondi ti dice **quali servizi il tuo
dispositivo riesce davvero a contattare** — e non serve nessuna chiave per
saperlo.

Se un servizio smette di rispondere, Spectra se lo ricorda per 24 ore e lo
sposta in fondo all'elenco, sotto la voce *«Non hanno risposto da questo
dispositivo»*. Non lo cancella: domani potrebbe tornare a funzionare.

---

## Il File Manager

Un archivio personale per foto, documenti e pagine HTML, protetto da una
password.

> ⚠️ **Una cosa che devi sapere.** Questa protezione è un **deterrente**, non
> una vera sicurezza: chi sa dove guardare può aggirarla. Non metterci documenti
> riservati.

I file restano sul tuo dispositivo. **Non esiste una copia da nessun'altra
parte:** se cancelli i dati del browser o cambi telefono, spariscono. Usa
l'esportazione per le cose a cui tieni.

---

## Domande frequenti

**Devo pagare qualcosa?**
No. L'app è gratuita. Se usi Spectra, la chiave gratuita del servizio AI ha dei
limiti giornalieri, ma non si paga nulla.

**Funziona davvero senza internet?**
Sì, dopo la prima apertura. Restano fuori solo le cose che per loro natura
devono chiedere a qualcun altro: la ricerca di molecole per nome, le strutture
3D scaricate al momento, e Spectra.

**I miei appunti vengono salvati da qualche parte?**
Solo sul tuo dispositivo. Non c'è nessun server: nessuno può leggerli, ma
nemmeno recuperarli se li perdi.

**Come cancello i miei dati?**
Menu ✨ → Impostazioni → cancellazione dati. Puoi scegliere **cosa**: solo le
chiavi, solo le conversazioni, solo lo studio, oppure tutto.

**Ho aggiornato ma non vedo niente di nuovo.**
Menu ✨ → **Aggiornamenti** → *Controlla*. Lì vedi anche quale versione stai
usando.

**Posso fidarmi degli spettri per una relazione?**
Per riconoscere i gruppi funzionali e capire la relazione struttura-spettro, sì.
Per un dato da citare come sperimentale, no: sono previsioni. L'app ti rimanda
ai database ufficiali (NIST, SDBS) con collegamenti diretti.

**Ho trovato un errore in un dato chimico.**
Segnalalo: apri una *issue* sul
[repository GitHub](https://github.com/samupropio1-ship-it/BioSpecInfo-v11).
I dati sono sottoposti a controlli automatici, ma nessun controllo trova tutto.

---

## Se qualcosa non va

| Problema | Cosa provare |
|---|---|
| L'app non si apre | Ricaricala. Se persiste, menu ✨ → Aggiornamenti → Controlla |
| Non vedo le novità | La versione è nel menu ✨ → Aggiornamenti |
| Spectra non risponde | Pulsante **🔌 Prova**: ti dice quali servizi raggiungi |
| «Spazio esaurito» | Menu ✨ → Impostazioni → cancella le conversazioni vecchie |
| Una sezione resta vuota | Controlla la rete: alcune sezioni caricano dati da internet |
| I grafici sono sfocati | Ricarica la pagina; i grafici si ridisegnano alla risoluzione dello schermo |

---

## Contatti

**Autore:** Samuele Pio Provenzano
**Repository e segnalazioni:**
[github.com/samupropio1-ship-it/BioSpecInfo-v11](https://github.com/samupropio1-ship-it/BioSpecInfo-v11)

---

_Guida aggiornata alla versione `bsi-v233`._
