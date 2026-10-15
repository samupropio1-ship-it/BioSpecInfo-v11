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
| **Menu delle sezioni** | Barra di navigazione | Le 96 sezioni, raggruppate per materia |
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

### 🎮 ATOMIC PROTOCOL

Un gioco di **esplorazione in tre dimensioni** con grafica di **livello
PlayStation 2**. Si apre dal **pulsante ATOMIC PROTOCOL** in basso a destra, sopra Spectra e il menu ✨ (l'icona con l'esagono, la beuta e l'elettrone che gira); mentre giochi i pulsanti flottanti si tolgono di mezzo. **Cento livelli**,
dieci zone, dieci guardiani.

**La storia.** Sei un chimico chiuso dentro un istituto sigillato: il
Protocollo 12, una sintesi che si alimenta da sola, è ripartito alle tre di
notte. Cammini per le ali, raccogli **elementi**, li **sintetizzi** in
composti al banco, risolvi gli enigmi dei terminali per aprire le paratie e
fermi i guardiani — le macchine dell'istituto andate fuori controllo —
usando la chimica, non i riflessi. Gli appunti sparsi
per le zone — dieci capitoli — raccontano chi ha fatto ripartire il
Protocollo; il Codex li conserva.

**Come si avanza.** In ogni livello si trova il **terminale**: tre enigmi
aprono la paratia, e oltre la paratia c'è l'**ascensore**. Il decimo livello
di ogni zona finisce nell'arena di un guardiano, e l'ascensore si sblocca
solo quando il guardiano è fermo. Il gioco **si salva** a ogni livello: dal
titolo si **continua** o si **sceglie** un livello già raggiunto.

**I misteri.** Nelle stanze laterali dei livelli 2, 5 e 8 di ogni zona c'è un
**magnetofono** con la spia rossa accesa: sono le registrazioni di chi c'era —
Sarti, il Custode, Lenzi della manutenzione, la farmacologa Vela, la tecnica
Moro, l'avvocato Ferri del Consorzio Albedo che finanziava il Protocollo, e il
Direttore, cioè tu, che ti lasciavi messaggi sapendo che li avresti
dimenticati. Si **ascoltano mentre giochi**, con la voce del dispositivo e i
sottotitoli; trenta in tutto, e ricompongono il segreto della frase «riprendere
comunque». Il Codex le conserva, da riascoltare. Sui muri, qua e là, qualcuno ha
lasciato domande a gesso.

**Si gioca in prima persona.** Davanti a te le tue braccia nel camice e, nella
destra — mani in guanti di nitrile, con le nocche e le pieghe che si vedono sotto la gomma — la **pistola a capsula**: la capsula prende il colore del composto che hai in
mano e l'HUD in basso ne mostra la formula e le dosi. Le dita si chiudono sull'impugnatura e l'indice preme il grilletto quando spruzzi; ferma a lungo, la sinistra stira le dita. Le dita si muovono con la loro inerzia: lo spruzzo fa saltare la canna, la sinistra si apre prima di prendere, e se stai fermo a lungo alzi la pistola per guardarla. I crediti dei modelli 3D sono in fondo al Codex. Spruzzando, lo strumento
rincula e lancia una nuvola di goccioline. Se in mano hai un **elemento**, la
mano sinistra si alza e lo tiene vivo sul palmo — scintille per i metalli,
fiamma per i combustibili, vapore per i gas — e usandolo lo lancia; la sinistra
si allunga anche quando prendi o tocchi qualcosa; il mirino si allarga quando guardi qualcosa che puoi
usare. La terza persona si può scegliere nelle impostazioni (tasto `V`).

| comando | tastiera e mouse | a schermo |
|---|---|---|
| guardarsi intorno | clic sulla scena, poi il mouse (`Esc` lo libera) | trascina il dito sulla scena |
| muoversi | `W` / `S`, frecce ▲ ▼ | ▲ ▼ |
| girarsi | mouse, frecce ◀ ▶ | ◀ ▶, o trascina il dito |
| spostarsi di lato | `A` / `D` (o `Q` / `E`) | ⇤ ⇥ |
| correre | `Shift` | — |
| saltare | `Spazio` | ⤒ |
| interagire | `F` | ✋ |
| usare quello che hai in mano | `X` | ✦ |
| cambiare quello che hai in mano | `R` | ⟳ |
| inventario | `I` | 🎒 |
| codex | `C` | dalla pausa |
| pausa | `Esc` o `P` | ❚❚ |
| passare alla terza persona e tornare | `V` | impostazioni |

**Gli ambienti sono art déco**, nello spirito di BioShock: marmo a scacchi con i
filetti d'ottone, noce, carta da parati verde e oro, lesene, applique a
ventaglio, manifesti dell'Istituto e del Consorzio Albedo, luce ambra, gocce
che cadono dal soffitto. L'HUD ha la barra della salute a tacche e quella del
reagente in mano, in cornici d'ottone. **La grafica è di livello PlayStation 2**
— senza horror: il chimico ha migliaia di
poligoni, gli occhi modellati, le mani a cinque dita in guanti di nitrile, il
camice con revers, tasche, bottoni e cartellino; le texture sono ad alta
risoluzione con le mappe di rilievo; le luci, gli schermi e i nuclei hanno il
**bagliore**; i materiali sono fisici, con ombre e riflessi. Nelle impostazioni
(anche dalla pausa, senza perdere la partita): *alta* di partenza, *media* senza
ombre proiettate per i telefoni, e lo stile **PS1 retrò** — pochi poligoni,
luce sui vertici, colore a 15 bit, pixel netti.

**Le quattro difficoltà** non cambiano solo i numeri:

| | Facile | Normale | Difficile | Esperimento |
|---|---|---|---|---|
| vite per livello | 5 | 3 | 2 | **1** |
| danno dei guardiani | ×0,6 | ×1 | ×1,4 | ×2 |
| tempo per gli enigmi | — | — | 90 s | 45 s |
| sintesi rapida contro un guardiano | sempre | sempre | 2 | **vietata** |
| bilanciare la reazione prima di farla | — | — | — | **sì** |

**L'inventario** tiene gli elementi raccolti: simbolo, nome, numero atomico,
massa, gruppo, periodo, elettronegatività ed energia di ionizzazione — letti
dalla **tavola periodica di questa applicazione** — più il potere e il
**livello di padronanza**, che sale usandoli. Toccando un elemento o un
composto lo si prende **in mano**: è quello che usa ✦.

**Il laboratorio di sintesi** (il banco con lo schermo verde) combina fino a
quattro reagenti: HCl, H₂O₂, NaOH, H₂SO₄, NH₃, CO₂, HNO₃, CaO, acido
ascorbico, MgO, NaCl e il bicarbonato, che si fa da **due composti** (NaOH +
CO₂). Ogni
ricetta porta la sua equazione bilanciata e dice a che cosa serve. Le ricette
si sbloccano con le **schede** trovate nelle stanze, ai terminali e fermando
i guardiani.

**Gli enigmi** cambiano con l'ala: gruppo funzionale cerchiato in una
struttura disegnata, nome IUPAC, costruire una catena, bilanciare una
reazione, scrivere il filamento di DNA complementare, e domande da tutto il
resto dell'applicazione. Sbagliando la paratia resta chiusa.

**I guardiani non si abbattono a forza**: ogni fase ha una debolezza chimica,
scritta in alto. Sono le **macchine dell'istituto** che non rispondono più ai
comandi.

| livello | zona | guardiano | che cosa serve |
|---|---|---|---|
| 10 | Stoccaggio | POMPA 7 — la pompa del raffreddamento, con i bracci idraulici | **HCl** sulla ruggine → **sodio** nel vapore → il rotore scoperto |
| 20 | Sintesi organica | IL POLIMERO — l'estrusore dei polimeri | **H₂O₂** spezza le catene → **H₂SO₄** disidrata il reticolo → il nucleo |
| 30 | Spettroscopia | LO SPETTRO — il banco laser in risonanza | **acido ascorbico** chiude la catena radicalica → **CO₂** soffoca la fiamma → la torretta |
| 40 | Biochimica | ELICA — il robot sequenziatore | **appaiare le basi** (rispondendo) → **NaOH** separa i filamenti → lo scheletro |
| 50 | Elettrochimica | LA CELLA — l'impianto di elettrolisi, con i dendriti di rame | **bilanciare** la redox → **HNO₃** scioglie il rame → gli elettrodi |
| 60 | Criogenia | IL GELO — il criostato dei campioni, in perdita d'azoto | **CaO** scalda e scioglie il ghiaccio → **magnesio** brucia anche al freddo → il nucleo |
| 70 | Farmacologia | LA DOSE — il robot della farmacia automatica | **riconoscere** il principio attivo → **NaOH** idrolizza gli esteri → il cuore |
| 80 | Radiochimica | IL DECADIMENTO — la cella calda, con i manipolatori | **piombo** come schermo → **bilanciare** → i nuclei |
| 90 | Depurazione | LA MELMA — il chiarificatore, con il ponte raschiatore | **CaO** stabilizza il fango → **cloro** disinfetta → il centro |
| 100 | Nucleo | PROTOCOLLO 12 — il reattore, in reazione autocatalitica | **bilanciare** → **bicarbonato** tampona → **argon** soffoca il nucleo → il nucleo |

La cosa sbagliata non fa niente; quando la luce rossa si accende, il
guardiano attacca: ci si allontana. I **residui** sono chiazze di solvente
organico che si spostano e fumano: un ossidante (Cl, O, H₂O₂…) le degrada.

**Funziona offline**: Three.js è già nel pacchetto e il Service Worker lo
tiene in cache, insieme ai quattro file del gioco.

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

_Guida aggiornata alla versione `bsi-v216`._
