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
| **Menu delle sezioni** | Barra di navigazione | Le 92 sezioni, raggruppate per materia |
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

### Leggere uno spettro che hai misurato tu

La sezione **Lettore spettri** fa il contrario di quella sopra: non prevede uno
spettro dalla struttura, legge quello che hai già.

C'è **un solo bottone**: `📂 Apri un file`. Non filtra niente — qualunque cosa
hai in cartella, aprila. Sotto il bottone compare una riga che **ti dice che
cosa ha deciso di essere** il file che hai aperto:

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

_Guida aggiornata alla versione `bsi-v196`._
