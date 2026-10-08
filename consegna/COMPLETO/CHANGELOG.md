# Changelog — BioSpecInfo

Tutte le modifiche rilevanti di questo progetto.

Il formato segue [Keep a Changelog](https://keepachangelog.com/it/1.1.0/).
La versione dell'applicazione coincide con la versione della cache del Service
Worker (`bsi-vNNN`) ed è visibile nell'app: menu ✨ → **Aggiornamenti**.

---
## [bsi-v197] — 2026-10-08

**Tre tabelle finivano fuori dallo schermo del telefono, e il contenuto non
era tagliato a metà: era irraggiungibile.**

### Che cosa succedeva

`audit_mobile` misurava — bene, e con un argomento scritto — una cosa sola: se
il **documento** scorre in orizzontale. È il difetto che l'utente vede, e
segnalare ogni elemento più largo dello schermo avrebbe riempito l'uscita di
rumore, perché una tabella larga dentro un contenitore che scorre è corretta.

Solo che esiste un secondo caso, e non lo vedeva nessuno: una sezione che
**ritaglia** il contenuto invece di far scorrere la pagina. Non compare nessuna
barra. Si vede una tabella che finisce, e non c'è modo di sapere che l'ultima
colonna esiste: non è tagliata a metà, è **irraggiungibile**, perché non c'è
niente da scorrere.

Tre casi veri, trovati così:

| sezione | tabella | quanto |
|---|---|---|
| Tabelle spettroscopiche | ¹H / ¹³C / IR / costanti J, 4 colonne | 425 px in 370 — la colonna **Note** |
| VSEPR | formula, geometria, angolo, esempi, ibridazione | 473 px in 390 — la colonna **Ibridazione** |
| Chimica inorganica | serie spettrochimica dei ligandi | 394 px in 390 — là `overflow:hidden` serviva solo ad arrotondare gli angoli, e ritagliava |

### Che cosa è cambiato

- Le tre tabelle stanno ora dentro un contenitore con `overflow-x:auto` — lo
  stesso schema già usato altrove nel file per le tabelle larghe. Dove serviva
  l'angolo tondo, `overflow-x:auto` con `overflow-y:hidden`: scorre in
  orizzontale e resta ritagliato in verticale.
- Alla tabella spettroscopica è stato dato un `min-width`, perché il browser
  non schiacci quattro colonne in fettine illeggibili invece di far scorrere.

### Il controllo che mancava

`audit_mobile` ora fa **due misure distinte** su tutte le 92 sezioni: lo
`scrollWidth` del documento (come prima) **e** gli elementi più larghi della
loro sezione **senza un antenato scorrevole**. La distinzione è tutta lì, e
tiene in piedi l'argomento originale del banco: una tabella larga dentro un
contenitore che scorre **non** viene segnalata, perché si legge scorrendola.

Provato nei due versi: togliendo il contenitore a una delle tre tabelle il
banco la nomina e fallisce; rimettendolo, le 92 sezioni passano pulite — con
dentro parecchie tabelle larghe, correttamente non segnalate.

---
## [bsi-v196] — 2026-10-08

**Una sola porta d'ingresso al lettore spettri.** Dalla fotografia di un
telefono: la scheda «Carica uno spettro» non lasciava scegliere un PDF, e
mostrava solo formati che nessuno ha in cartella.

### Che cosa succedeva

Il selettore di file dichiarava:

```html
<input type="file" accept=".jdx,.dx,.txt,.csv,.jcamp">
```

Su un telefono un `accept` **non restringe: nasconde**. Chi apriva «carica uno
spettro» con in mano il PDF di un compito vedeva una cartella vuota e
concludeva che l'applicazione fosse rotta. Lo era, di fatto: `.jdx` e `.dx`
escono dagli spettrofotometri, non li ha nessuno; il PDF e la fotografia ce li
hanno tutti, ed erano esattamente i due formati che quella scheda rifiutava.

C'erano poi **due schede** per la stessa domanda — «ho un file, cosa ci
faccio?» — una per gli spettri e una per i documenti. Chi arrivava col file
sbagliato nella scheda sbagliata non riceveva un errore: riceveva niente.

### Che cosa è cambiato

- **Una scheda sola, un bottone solo, nessun filtro.** `📂 Apri un file`
  accetta qualunque cosa, e **il programma decide che cos'è dicendolo** in una
  riga sotto il bottone. Niente instradamenti silenziosi: un instradamento
  silenzioso che sbaglia non si distingue da un programma che non fa nulla.
- **Le decisioni.** Un'immagine fa *entrambe* le cose (si estrae la traccia e
  si mostra come pagina, perché può essere la foto di uno spettro o di un
  foglio). Un `.jdx` è uno spettro per dichiarazione del formato. Un testo o un
  `.csv` si decide **dal contenuto**: se ci sono almeno cinque punti è uno
  spettro, altrimenti è il testo di un quesito e si svolge. Tutto il resto —
  PDF, Word, OpenDocument, fogli di calcolo — è un documento: si apre, si
  mostra per intero e si svolge quello che contiene.
- **Un binario travestito da `.txt`** non finisce più riversato nella casella
  di testo come byte illeggibili: la decodifica si controlla (byte nulli,
  frazione di `U+FFFD`) e il file passa al lettore di documenti, che sa dire
  che non è testo.
- **L'ingresso nascosto `#bsiSP-doc` forza il lettore di documenti** invece di
  ripassare dall'instradamento automatico. Si chiama «doc»: deve aprire un
  documento.

### Il distintivo di versione mentiva da ottanta versioni

L'intestazione scriveva **`v13l`**: una stringa fissa nell'HTML, mai
aggiornata, mentre l'applicazione era a `bsi-v195`. Nessun controllo la
guardava. Ora il distintivo si riempie da `BSI_APP_VERSION`, e **un controllo
confronta i due** — se tornano a divergere la batteria se ne accorge.

### Verifiche

- `test_spettrolettore` passa da 45 a **61 controlli**: un solo bottone
  visibile, `accept` **vuoto** (la direzione che conta: un `accept` non vuoto
  qui *è* il guasto), e l'instradamento provato su PDF, `.docx`, `.txt`,
  `.jdx`, due colonne `.csv`, un binario travestito e un `.png` — pretendendo
  per ognuno che la decisione annunciata sia quella giusta.
- Provato anche nell'ambiente che somiglia al telefono: sottocartella,
  **`.mjs` servito come `application/octet-stream` come fa GitHub Pages**,
  service worker attivo, finestra 390×844.

### Due bugie silenziose nei pacchetti di consegna

L'ordine suggerito dagli strumenti era `genera-pacchetti && genera-pdf`, e
`genera-evidenza` veniva per ultimo. Ma i pacchetti **imbustano** i PDF e il
rapporto di verifica: costruiti prima, portavano dentro **l'impaginato e
l'evidenza della versione precedente**, accanto al testo nuovo, senza che
nulla lo dicesse. Chi avesse letto il PDF avrebbe letto la versione di prima.

- `genera-pacchetti` ora **confronta le date**: un PDF più vecchio del
  documento da cui viene ferma la generazione e viene nominato.
- E **legge la versione dichiarata dal rapporto di verifica**: se non è
  questa, si ferma — un'evidenza che riguarda altro codice non è evidenza.
- L'ordine suggerito è stato corretto in `porta-versione.js` e nella guida al
  rilascio: SBOM → evidenza → **PDF** → **pacchetti**.

Entrambi i controlli sono stati provati **nei due versi**: toccando un
documento perché il suo PDF risultasse vecchio (si ferma, esce con 1) e
riportando il rapporto a `bsi-v195` (si ferma); rigenerando, passa.

---
## [bsi-v195] — 2026-10-08

**I PDF non si aprivano sul sito pubblicato.** I banchi passavano, qui
funzionava tutto, e lì non si apriva niente: il guasto stava nell'unica cosa
che la prova non riproduceva — **il server**.

### Che cosa succedeva

Un modulo JavaScript si carica con `import()`, e il browser pretende che il
server dichiari il tipo giusto, `text/javascript`. Non è una formalità, è una
regola di sicurezza, e Chrome la applica senza eccezioni:

> Failed to load module script: Expected a JavaScript-or-Wasm module script
> but the server responded with a MIME type of `application/octet-stream`.
> Strict MIME type checking is enforced for module scripts.

**GitHub Pages serve i file `.mjs` con il tipo sbagliato.** PDF.js, dalla
versione 6, è distribuito **solo** come modulo `.mjs`. Il server di prova dei
banchi — `python3 -m http.server` — li serve giusti. Quindi: banchi verdi,
PDF che si aprivano in prova, e sul sito vero il nulla.

### La riparazione: non dipendere dal tipo che dichiara il server

Si prova `import()` diretto, che è la strada giusta dove il server è
configurato bene. Se fallisce, il file si scarica come **testo** — `fetch` non
fa nessun controllo sul tipo — e si reimporta da un **Blob** che porta il tipo
corretto, creato qui. Il modulo è byte per byte lo stesso: cambia solo chi
dichiara che cos'è. Lo stesso trattamento vale per il worker.

### Il difetto era nel banco prima che nel codice

Il banco girava su un server che serve i `.mjs` correttamente: non poteva
vedere il guasto. Ora **impone il tipo sbagliato** e pretende che il PDF si
apra lo stesso.

E con un dettaglio che mi ha fatto riscrivere la prova: PDF.js **si ricorda**
di essersi caricato. Messa dopo l'apertura normale, la prova riusava il modulo
già in memoria e non provava niente. Ora la pagina si **ricarica** in mezzo,
così la strada diretta e quella di riserva vengono esercitate tutt'e due
davvero.

### E un messaggio che mentiva

Con un guasto, la riga di stato diceva **«aperto: documento.pdf · 0 parole»**.
«Aperto» accanto a un conteggio a zero fa credere che il file fosse vuoto,
mentre non si era aperto affatto. Ora il guasto compare in rosso lì, sotto il
bottone appena premuto, non solo più in basso in mezzo al resto.

### Riprodotto prima di correggere

La riparazione non è una congettura: il guasto è stato **riprodotto** in
locale servendo i `.mjs` come `application/octet-stream`, da una sottocartella
come fa GitHub Pages, con il service worker attivo e su schermo di telefono.
Prima: «Questo PDF non si è aperto». Dopo: una pagina, ottanta parole, lo
svolgimento completo. Anche il pulsante delle immagini è stato verificato
nello stesso ambiente.

---
## [bsi-v194] — 2026-10-08

Cercando fonti online per chiudere il punto debole, è saltato fuori un difetto
**nello strumento che spiega i numeri** — e quello sì che si poteva chiudere.

### La spiegazione non ricostruiva il numero

Il predittore mostra, per ogni carbonio alifatico, i contributi che lo hanno
prodotto. Per l'OCH₂ dell'acetato di benzile diceva:

> α arile + α OCO-

che fanno 22,1 + 56,5 = 78,6 sulla base di −2,3, cioè **76,3**. Il valore
mostrato accanto era **73,8**. Mancava il termine dei carboni semplici — un
γ a −2,5 — che la somma usava e la spiegazione taceva.

In uno strumento che si regge sul dire DA DOVE viene ogni numero, una lista di
contributi che non ricostruisce il numero è **peggio di nessuna lista**:
sembra una verifica e non lo è. Chi la leggeva per controllare il conto
trovava una differenza e non sapeva se sbagliava lui.

Ora ogni voce porta **il proprio valore con il segno**, i carboni semplici
sono dichiarati raggruppati per distanza, la correzione sterica e il cambio di
composto di riferimento ciclico compaiono con il loro contributo:

```
73,8 = base −2,3 · α arile +22,1 · α OCO- +56,5 · 1 C in γ −2,5
34,0 = base −2,3 · γ arile −2,6 · β CHO −0,6 · α S- +10,6 · α C=C +19,5 · 1 C in β +9,4
```

E il banco **rifà la somma**: per ogni carbonio alifatico di tutte le molecole
dei due insiemi ripesca i numeri dalla lista, li risomma e pretende che
tornino al millesimo. **48 carboni controllati.** Finché quella prova passa, la
spiegazione non può scollarsi dal calcolo senza che qualcuno se ne accorga.

Come effetto collaterale, i due «punti deboli» dichiarati nella versione
precedente risultano **verificati**: 73,8 e 34,0 sono esattamente ciò che lo
schema pubblicato prescrive, riga per riga. Non erano un difetto
dell'implementazione.

### Le fonti online: cercate, e il risultato è negativo — con la prova

Dalla macchina in cui questo progetto si compila **non è raggiungibile nessuna
fonte primaria**. Verificato, non supposto: `curl` passa solo verso i registri
di pacchetti (lo dichiara il proxy stesso); NIST, SDBS, PubChem, SpectraBase,
CSIRO, RSC, ACS, Springer, Wikipedia, LibreTexts, le tabelle di Hans Reich e
NMRShiftDB2 rispondono tutti **403**; PubMed non indicizza la chimica pura; e
nessun pacchetto npm o PyPI ridistribuisce una banca dati NMR di riferimento
(`nmr-predictor` la **scarica** da GitHub, che è bloccato).

Quello che la ricerca testuale ha potuto accertare è **dove sta il dato**:

> M. T. W. Hearn, «Carbon-13 chemical shifts in some substituted furans and
> thiophens», *Aust. J. Chem.* **29**(1), 107–113 (1976), DOI 10.1071/CH9760107

Il suo abstract dice che gli effetti dei sostituenti in questi eterocicli
*assomigliano* a quelli dei benzeni sostituiti. **Assomigliano non è
coincidono**: il trasferimento degli incrementi del benzene era già stato
provato e sui carboni β peggiora.

**Non ho scritto quella tabella a memoria.** Sarebbe stato facile. Ma un valore
che nessuno può risalire a una fonte è esattamente ciò che questo progetto
esiste per impedire, e metterlo accanto a novantuno righe trascritte da una
pagina stampata renderebbe meno credibili anche quelle.

### Una riga di validazione con provenienza più debole, dichiarata

L'acetato di benzile, entrato in validazione perché mostra il punto debole dei
due sostituenti in α, porta valori che **non ho potuto verificare** contro una
fonte primaria da qui. Il fenomeno è confermato in modo indipendente dal
quesito d'esame del 23/04/2024 — dato di provenienza vera — ma il **caso
peggiore dichiarato (7,5 ppm) poggia su quella riga**, ed è scritto sia nel
banco sia nel documento 06. Se quei sei numeri fossero sbagliati, è
quell'affermazione a cadere.

---
## [bsi-v193] — 2026-10-08

I problemi rimasti, affrontati uno per uno: due chiusi, uno **misurato invece
che asserito**, e due bloccati dall'ambiente — con la prova di oggi.

### Il secondo punto in cui il predittore cede, trovato misurando

Finora era dichiarato un solo punto debole: gli eteroaromatici sostituiti.
Misurando il quesito del furano carbonio per carbonio ne è saltato fuori un
altro, che **non c'entra niente con gli eteroaromatici**:

| molecola | carbonio | osservato | previsto | scarto |
|---|---|---:|---:|---:|
| acetato di benzile | OCH₂ (O estereo + anello) | 66,3 | 73,8 | **7,5** |
| il quesito del furano | CH₂ (C=C + S) | 26,7 | 34,0 | **7,3** |

Un carbonio sp³ con **due sostituenti in α**. Gli incrementi sono ricavati da
composti *mono*-sostituiti: sommandone due si conta due volte un effetto che
in realtà satura. Due misure indipendenti, stessa entità e stesso verso.

**Perché conta, e non è solo una curiosità.** In un confronto struttura↔dati
quel carbonio risulta «senza corrispondenza» e fa **perdere punti a una
struttura giusta**: l'acetato di benzile, che *è* la risposta, prende 42 su
100. Senza spiegazione, quel punteggio si legge come una smentita.

Ora lo strumento lo dice: la fiducia scende da «alta» a «media» e compare il
motivo — *un segnale che non torna su quel carbonio può essere un limite del
predittore, non una prova contro la struttura*. Provato nei due versi: avvisa
su tre strutture che hanno quel carbonio, e **tace** su sei che non ce
l'hanno, perché un avviso che compare dappertutto è rumore e si impara a
ignorarlo.

### Gli eteroaromatici: la scorciatoia è stata provata, e peggiora

La tabella degli incrementi di posizione per furano, tiofene, pirrolo e
piridina **non esiste** nella fonte, e non è stata trovata altrove: NIST è
irraggiungibile da qui e SpectraBase è dietro un accesso. Costruirla a memoria
sarebbe stato il contrario di tutto il resto di questo progetto.

La scorciatoia ovvia — **trasferire gli incrementi del benzene** all'anello
eteroaromatico — è stata provata sul caso che abbiamo: sul carbonio *ipso*
funziona (151,6 contro 150,77 misurato), ma sui carboni β **peggiora**, da 3,4
a 5,7 ppm di scarto. Non è stata adottata. Una generalizzazione che peggiora
proprio dove sta il problema non è una generalizzazione.

Quello che c'è ora è la **misura**, carbonio per carbonio, nel documento 06: i
due β del furano escono identici (109,6) contro 118,55 e 112,97, e si vede
perché. «Fiducia bassa» smette di essere un'affermazione e diventa un numero.

### Un dato sbagliato nel mio stesso banco

Il 4-metossiacetofenone ha **sette** carboni distinti e nella lista di
riferimento ne figuravano sei: mancava il C1 dell'anello, a 130,3. Il banco
stampava «segnali 7/6» a ogni esecuzione — un conteggio che non torna, dentro
un banco che serve a far tornare i conteggi — e nessuno ci faceva caso.

### D-07 e D-10: riverificati oggi, entrambi bloccati

Non per inerzia: riprovati, e il registro delle difformità lo dice con la
prova di oggi.

- **D-07** (verifica solo su Chromium): `npx playwright install firefox`
  fallisce con «Download failure», e `cdn.playwright.dev` risponde ancora
  **403** al tunnel. Vincolo dell'ambiente, non una scelta.
- **D-10** (il tag `bsi-v181`): riprovato con il client GitHub della sessione,
  che usa una credenziale **diversa** da quella che aveva fallito.
  `PATCH /git/refs/tags/bsi-v181` risponde **403 «Write access to this GitHub
  API path is not permitted through this proxy»**. È un secondo blocco,
  indipendente dal primo: anche senza la regola sui file di workflow, la
  scrittura sui riferimenti git non passa.

---
## [bsi-v192] — 2026-10-07

Nel lettore di spettri si apre **qualunque documento** — un PDF, la fotografia
di un foglio, un file Word — se ne vede **tutto** il contenuto, e il quesito
che contiene viene **svolto passo per passo**.

### Aprire il file: `bsi-documento.js`

| formato | che cosa se ne ricava |
|---|---|
| **PDF** | ogni pagina disegnata e il suo strato di testo (PDF.js) |
| **immagini** | la pagina si vede; il testo **no**, e lo dice |
| **testo, CSV, JCAMP-DX, XML, JSON** | il contenuto |
| **Word `.docx`, OpenDocument, PowerPoint, Excel** | il testo del documento |

Gli archivi Office si aprono **senza nessuna libreria**: sono ZIP, e il browser
sa già scompattare un flusso deflate con `DecompressionStream`. La direttrice
centrale dello ZIP si legge a mano, un centinaio di righe.

Il testo di un PDF arriva a frammenti con le loro coordinate, non a righe:
incollarli di fila farebbe una riga sola, e **una tabella di spostamenti
chimici diventerebbe illeggibile**. I frammenti si raggruppano per ordinata e
si ordinano per ascissa.

**PDF.js sta nel repository**, non su una CDN: l'applicazione funziona offline
e deve continuare a farlo. Si carica solo quando serve davvero — sono due
megabyte e mezzo, e chi apre il Centro spettroscopico per guardare uno spettro
non deve pagarli. È la build **legacy**: quella predefinita usa funzioni di
linguaggio recentissime (`Map.prototype.getOrInsertComputed`) e si rompe sui
browser che non le hanno ancora, incluso quello su cui gira la batteria.

### Leggere il quesito e svolgerlo: `bsi-quesito.js`

Riconosce nel testo la formula molecolare, le bande IR, i picchi di massa con
le loro intensità, i segnali ¹H con integrazione, molteplicità e J, i segnali
¹³C — e di ognuno dice **da dove l'ha preso**. Poi passa tutto a
`bsi-elucida.js`, che svolge.

**Il riconoscimento è per sezione, non per numero.** Una banda IR a 1738 e una
massa a 150 sono entrambe numeri: distinguerli dal solo valore è impossibile.
Si cerca l'etichetta della tecnica e si legge quello che viene dopo, fino alla
fine del capoverso.

**Riconoscimento e svolgimento restano separati, e si vedono in quest'ordine.**
Se il riconoscimento legge «1715» come banda IR quando era una massa, lo
svolgimento che segue è impeccabile e la conclusione è sbagliata. La tabella
dei dati letti sta **sopra** lo svolgimento apposta: così l'errore si vede
prima della risposta.

### Quello che non fa, e lo dice in faccia

- **Non c'è riconoscimento ottico dei caratteri.** Una scansione contiene
  pixel, non lettere. Il modulo dichiara quante pagine non hanno uno strato di
  testo, invece di restituire poco e far credere che il documento fosse vuoto.
- **Non c'è nessun modello linguistico**: espressioni regolari e un motore di
  regole. Se i dati sono scritti in una forma non prevista, **non** vengono
  letti — e lo svolgimento dichiara che cosa gli manca.
- **La struttura finale non viene proposta.** Proporla vorrebbe dire
  indovinare. Si può fare il contrario: scrivere una struttura e farla
  **confrontare** con i dati, segnale per segnale.

### Il banco, `test_documento` — 47 controlli nei due versi

Apre davvero un PDF, un `.docx` e un testo, e ne verifica il contenuto. E poi,
nel verso opposto: un'immagine dichiara che non c'è riconoscimento ottico e
**non** produce svolgimento; un formato sconosciuto viene rifiutato invece che
indovinato; un file binario chiamato `.txt` viene riconosciuto come binario;
CDCl₃ non diventa la formula del composto; una banda fuori da 400-4000 non è
una banda; senza etichetta MS non ci sono masse; un capoverso nuovo chiude la
sezione; un testo senza spettri non produce dati.

### Il caso peggiore dichiarato sale da 4,9 a 7,5 ppm

Non per un peggioramento: perché **questo banco ha trovato una molecola che il
predittore sbaglia più di tutte quelle che c'erano**. Nel quesito del
benzilacetato il confronto struttura↔dati segnalava che l'OCH₂ a 66,3 ppm non
trovava corrispondenza: il predittore ne dà 73,8. Un carbonio con **due**
sostituenti in α — un ossigeno estereo e un anello aromatico — è il punto in
cui uno schema additivo cede di più.

La molecola è entrata nell'insieme di validazione (ora 23), lo scarto medio
resta 1,0 ppm, e il caso peggiore **dichiarato nel pannello** è salito a 7,5.
Alzare una soglia dopo aver trovato un caso peggiore è onesto solo se lo si
dichiara anche a chi usa lo strumento, e lì sta scritto.

### Un difetto del mio stesso strumento, al primo uso vero

`tools/porta-versione.js`, scritto nella versione precedente per non riscrivere
più le frasi storiche, ha **rotto il distintivo del README**: shields.io scrive
un trattino letterale come `--`, e la sostituzione sceglieva la forma giusta
guardando il testo della propria espressione regolare — un controllo che non
corrispondeva mai. È uscito `versione-bsi-v192`, che shields.io non riconosce,
e il distintivo è sparito.

L'ha trovato `verifica-affermazioni`, che confronta il distintivo con il
codice: è esattamente il motivo per cui quel controllo esiste. Ora ogni schema
porta con sé la **propria** sostituzione, invece di una sola scelta al volo.

### E quarantasette fallimenti che non erano del codice

Durante una delle esecuzioni il server locale è caduto a metà batteria. I
banchi che restavano hanno fallito **tutti**, in meno di un secondo l'uno, con
lo stesso errore di connessione — e il rapporto è uscito con 47 fallimenti
mentre l'applicazione stava benissimo.

Un banco che fallisce per la ragione sbagliata insegna a ignorare il banco.
`genera-evidenza.js` ora **guarda prima** se il server risponde, e se non c'è
non comincia nemmeno: dice che cosa manca e il comando per avviarlo. E se il
server cade **durante** la batteria, il rapporto lo dichiara invece di
attribuire al codice dei fallimenti che sono suoi.

---
## [bsi-v191] — 2026-10-07

NMR **bidimensionale** — COSY, HSQC, HMBC — e uno **stack React + FastAPI**
che esegue gli stessi file, non una copia.

### NMR bidimensionale

Nuovo modulo `bsi-nmr2d.js`. Si poteva fare solo adesso: uno spettro 2D non è
un disegno più complicato, è una mappa di **correlazioni**, e per costruirla
servono lo spostamento di *ogni* protone e di *ogni* carbonio più l'**indice
dell'atomo** che li porta. Il predittore per atomo le dà entrambe; da lì le
tre mappe escono dalla topologia della molecola, senza inventare niente.

| mappa | che cosa collega | a che serve |
|---|---|---|
| **HSQC** | un protone e il carbonio a cui è legato (¹J) | assegna: ogni macchia dice «questo H sta su questo C» |
| **COSY** | due protoni a tre legami (H–C–C–H) | collega: seguendo le macchie si ricostruisce la catena |
| **HMBC** | un protone e i carboni a due o tre legami | attraversa i quaternari: un carbonile si vede dai protoni vicini |

L'HSQC è **editato**: i CH₂ hanno segno opposto a CH e CH₃, ed è così che si
contano i CH₂ di una catena senza dedurli dalle integrazioni.

Cliccando una macchia si illuminano gli atomi che la producono — nella
struttura piatta e nel modello 3D. Uscita in **CSV**.

**Si verifica contando i cammini** (`test_nmr2d`, **40 controlli**), e le prove
stanno nei due versi, perché una mappa che collegasse tutto con tutto
passerebbe qualunque prova scritta in un verso solo:

- l'acetato di etile dà **tre** macchie HSQC, una per carbonio protonato;
  l'esafluorobenzene, che non ha idrogeni, **nessuna**;
- il COSY del benzene ha la diagonale e **zero** macchie fuori: i sei protoni
  sono lo stesso segnale, e due protoni equivalenti non si accoppiano in modo
  osservabile. Il toluene invece ne ha quattro;
- il metano, che non ha un secondo carbonio, non dà **nessuna** macchia HMBC
  pur avendo quattro protoni.

**Quello che non è:** non simula l'esperimento. Niente intensità calcolate,
artefatti o dipendenza dal tempo di miscelamento. In un HMBC vero alcune
correlazioni a due legami non si vedono — qui ci sono tutte. Sta scritto nel
pannello.

### Due difetti, trovati contando

- **L'HSQC contava gli atomi invece dei segnali.** I sei carboni del benzene
  davano sei macchie sovrapposte nello stesso punto: sei correlazioni
  dichiarate dove ce n'è una. Il toluene ne dava sei invece di quattro.
- **La diagonale del COSY perdeva gli scambiabili.** L'O–H di un alcol non dà
  macchie *fuori* diagonale, ma sulla diagonale c'è: è un protone come gli
  altri. Escluderlo da entrambe faceva sparire un segnale — l'etanolo ne
  mostrava due invece di tre.

### Lo stack React + TypeScript + FastAPI

In `stack/`. Serve a chiamare la predizione **da un programma** e a servire
un'interfaccia separata. Non sostituisce la PWA, che resta il prodotto: gira
offline, non ha un server da pagare, e continua a essere ciò che si pubblica.

**La decisione che conta: nessun motore in Python.** La strada ovvia sarebbe
riscrivere il predittore in Python. È anche la strada sbagliata — diventano
due programmi che fanno la stessa cosa, uno riceve le correzioni e l'altro no,
e dopo sei mesi danno due numeri diversi per la stessa molecola.

RDKit ha una compilazione WebAssembly che gira **anche in Node**. Quindi un
processo Node carica gli **stessi quattro file** che l'applicazione serve ai
suoi utenti — `bsi-pretsch.js`, `bsi-nmr.js`, `bsi-geom3d.js`, `bsi-nmr2d.js` —
e risponde a FastAPI. Una correzione arriva a tutti e due nello stesso istante,
perché i file *sono gli stessi file*.

**E lo si verifica, non lo si promette.** `GET /salute` restituisce l'impronta
SHA-256 di ogni modulo caricato, e il banco `test_stack` la confronta con
quella dei file nel repository: se qualcuno ne copiasse una versione dentro
`stack/`, la prova fallirebbe il giorno stesso. Lo stesso banco controlla che
nel front end **non ci sia chimica**: nessun `.ts`/`.tsx` può contenere una
tabella di spostamenti, perché è lì che nascerebbe il secondo motore.

Sei rotte (`/salute`, `/identita`, `/nmr`, `/nmr2d`, `/geometria`,
`/struttura`), **18 controlli** pytest, front end React 19 + TypeScript in
modalità `strict`. Gli errori dicono di chi è la colpa: **422** se non è una
struttura leggibile, **503** se il motore non c'è — trattarli allo stesso modo
farebbe dire «SMILES sbagliato» a chi ha solo il server spento.

**Non è pronto per il pubblico**, e il README lo dice: niente autenticazione,
niente limiti di frequenza, niente cache.

### Undici frasi storiche riscritte da una sostituzione cieca

Alzare la versione sembra l'operazione più innocua del mondo: si cerca
`bsi-v<NNN>` e si scrive `bsi-v<NNN+1>`. **Per tre rilasci di fila è stato
fatto così**, e ogni volta ha riscritto anche delle frasi che raccontano un
fatto accaduto a una versione *passata*. Quello che ne era uscito stava dentro
una dichiarazione di conformità firmata:

- la password del File Manager risultava cambiata alla versione corrente,
  mentre era stata cambiata alla `bsi-v188` — e la frase sta in una
  difformità di **sicurezza**;
- l'incidente del tag `bsi-v181` risultava avvenuto alla versione corrente,
  mesi dopo il fatto;
- trentasei voci della banca dati farmaci risultavano aggiunte alla versione
  corrente;
- l'istruzione «incrementa `CACHE`» mostrava **lo stesso numero da entrambe
  le parti** — un esempio uguale a se stesso, rimasto così per tre versioni.

Undici righe in nove documenti, in italiano e in inglese. Nessun controllo
poteva accorgersene: ogni riga citava una versione che **esiste**, nel
documento che descrive quella versione. Il difetto non era nei documenti, era
nel **modo** di aggiornarli.

**`tools/porta-versione.js`** — il cambio di versione non si fa più a mano.
Tocca solo le righe che *dichiarano* la versione, riconosciute da uno schema
esplicito, e tutto il resto lo **elenca** perché lo si legga. Con `--prova` non
scrive niente. È stato lui, alla prima esecuzione a vuoto, a trovare le ultime
quattro righe sbagliate e due schemi inglesi che gli mancavano.

**Due controlli nuovi** in `verifica-documenti`, provati nei due versi
reinserendo i difetti veri e guardandoli fallire: nessuna frase al passato può
nominare la versione corrente, e nessun esempio di aggiornamento può mostrare
la stessa versione da entrambe le parti.

I due controlli sono dovuti condividere **una sola** definizione di «frase
storica» con quello che cercava le versioni rimaste indietro: tenendone due
elenchi si contraddicevano — uno pretendeva che la frase nominasse una versione
vecchia, l'altro la segnalava come dimenticata.

---
## [bsi-v190] — 2026-10-07

Un picco cliccato illumina l'atomo **anche in tre dimensioni** — e l'atomo è
quello giusto, il che è tutto il problema.

### Perché non bastava il visore 3D che c'era

Il visore 3D dell'applicazione **disegna** coordinate, non le costruisce: le
riceve da un file SDF scaricato da PubChem. Due conseguenze:

1. Una molecola **disegnata** dall'utente non ha un file su PubChem, quindi non
   si poteva vedere in tre dimensioni. Si vedeva solo ciò che qualcun altro
   aveva già depositato.
2. La numerazione degli atomi di un SDF di PubChem non ha **niente** a che
   vedere con quella di RDKit, che è quella del predittore NMR. Collegare un
   picco a un atomo del visore avrebbe illuminato l'atomo sbagliato — e un
   atomo sbagliato che sembra giusto è peggio di nessun atomo.

### `bsi-geom3d.js`: le coordinate dal grafo

Nuovo modulo che costruisce le coordinate **partendo dallo stesso grafo** del
predittore, con la garanzia per costruzione che l'atomo `i` qui sia l'atomo `i`
là. Gli idrogeni si aggiungono **in coda**, così gli indici degli atomi pesanti
non slittano.

Il metodo è la **geometria delle distanze**, in piccolo: si scrive una matrice
di limiti (legami, angoli di valenza, diagonali d'anello, contatti di van der
Waals), si parte da posizioni casuali ma riproducibili — il generatore è
seminato dallo SMILES, quindi la stessa molecola dà sempre la stessa forma — e
si correggono le violazioni finché non resta quasi niente. Gli anelli aromatici
si proiettano sul loro piano e le terne lineari si raddrizzano ruotando i rami
come corpi rigidi, perché quelle due cose una distanza da sola non sa dirle.

Misurato contro i valori che la chimica conosce (`test_geom3d`, **29
controlli**): C–C 1,54 Å, C=C 1,34, C≡C 1,20, aromatico 1,39, C–O 1,43, C–H
1,09; angolo tetraedrico 109,5°, aromatico 120,0°, alchino 180,0°, C–O–H
104,4°. E **nei due versi**: il benzene esce piano (0,00 Å dal piano) e il
cicloesano **non** piano (0,34), perché un banco che chiedesse solo la
planarità passerebbe anche a un programma che appiattisce tutto.

Su molecole vere: caffeina 0,027 Å di residuo in 89 ms, ibuprofene 0,014,
naprossene 0,022, paracetamolo 0,011, atorvastatina (76 atomi) 0,31 in 0,9 s.
Il residuo dell'ultima è dichiarato, nel modulo e nel pannello.

### La sincronia, e la prova che è lecita

Nel pannello NMR c'è ora un bottone **3D**. Cliccando un picco o una riga della
tabella, gli atomi si illuminano nella struttura piatta **e** nel modello
tridimensionale. Il banco non si limita a contare quanti se ne illuminano:
verifica che siano **esattamente** quelli del segnale, confrontando le due
liste di indici.

### Quattro difetti del generatore, tutti trovati misurando

- **Gli idrogeni contati due volte.** Aggiunti come atomi, il conteggio dei
  partner continuava a sommare anche quelli impliciti: il metano risultava con
  otto partner invece di quattro e usciva con angoli di 122°.
- **La tolleranza data sulla distanza invece che sull'angolo.** Vicino a 180°
  il coseno è piatto, e un ±6 % sulla distanza vale ±45° sull'angolo: il
  propino usciva piegato a 134° come un alchene.
- **Gli intervalli al posto dei valori.** Un intervallo lascia la soluzione
  appoggiata a un bordo: il metano si fermava a 115° rispettando ogni limite.
  Un legame e un angolo di valenza sono rigidi — non sono intervalli.
- **La correzione applicata a un atomo invece che al suo ramo.** Raddrizzare un
  alchino spostando il solo atomo terminale lascia indietro i suoi idrogeni, i
  legami si allungano, il passo dopo li riaccorcia tirando indietro il
  carbonio, e l'angolo torna piegato: il propino *peggiorava*, da 173° a 155°,
  con i legami stirati del 7 %. Un ramo va ruotato tutto insieme.

E uno di conflitto fra regole: in un anello aromatico a **cinque** termini
l'angolo interno vale 108°, non i 120° dell'sp². Imponendo 120 a un pentagono
si chiede una cosa impossibile — la caffeina non scendeva sotto un decimo di
ångström. Lo stesso per un carbonio di **giunzione**, che riceveva 108 + 120 +
120 = 348° invece di 360: gli angoli di un atomo piano ora si distribuiscono,
invece di essere imposti uno per uno.

---
## [bsi-v189] — 2026-10-07

Le tabelle di stima **intere**, al posto del riassunto che c'era.

### Il problema: un riassunto che non diceva di esserlo

`bsi-nmr.js` conteneva venticinque incrementi benzenici scelti a mano,
venticinque «valori di classe» per i carboni sp3, tredici incrementi β/γ e
quattro correzioni steriche su sedici. Erano un **riassunto** di tabelle molto
più grandi, e il riassunto funzionava finché la molecola somigliava a quelle su
cui era stato scritto. Dove non arrivava, il predittore non lo diceva: restituiva
il valore del composto nudo e basta.

In concreto: **ogni H aromatico usciva a 7,26 ppm** — che l'anello portasse un
nitro o un metossile. Ogni H vinilico a 5,35. Il nitrobenzene e l'anisolo, che
in uno spettro vero si distinguono a colpo d'occhio (8,22/7,70/7,55 contro
6,89/7,27/6,93), uscivano identici.

### Che cosa c'è ora

Nuovo modulo **`bsi-pretsch.js`**: solo numeri, trascritti riga per riga da
Pretsch–Bühlmann–Badertscher, *Structure Determination of Organic Compounds*,
4ª ed., Springer — §4.1 (pp. 82-84), §4.5 (pp. 100-102), §5.1 (p. 170),
§5.2 (pp. 178-179), §5.3 (p. 182), §5.5 (pp. 188-189).

| tabella | righe | formula |
|---|---|---|
| ¹³C benzeni monosostituiti | 91 | δ = 128,5 + Σ Zi |
| ¹H benzeni monosostituiti | 66 | δ = 7,34 + Σ Zi |
| ¹H etileni sostituiti | 42 | δ = 5,25 + Zgem + Zcis + Ztrans |
| ¹H alcani sostituiti | 31 | δ = base(CH₃/CH₂/CH) + ΣZα + ΣZβ |
| ¹H alchini terminali | 30 | valore diretto per sostituente |
| ¹³C alifatici | 24 | δ = −2,3 + Σ Zi + Σ Sj |
| correzioni steriche Sj | 4×4 | per grado del C osservato e dell'atomo α |
| ¹J(C,H) | 24 | J = 125,0 + Σ Zi |

Sta in un file suo perché si possa **controllare contro la pagina stampata**
senza leggere il codice che lo usa; `bsi-nmr.js` non contiene più numeri, solo
il ragionamento che li applica.

### Tre capacità che prima non c'erano

**Gli H aromatici si spostano.** δ = 7,34 + Σ Zi, con la posizione ricavata
camminando l'anello. Misurato: anisolo 6,90/7,29/6,94 contro 6,89/7,27/6,93;
fenolo 6,83/7,24/6,93 contro 6,84/7,24/6,94; benzaldeide 7,88/7,53/7,63 contro
7,88/7,52/7,60.

**Un =CH₂ terminale dà due segnali.** I suoi due protoni non sono equivalenti:
uno è *cis* e uno *trans* al sostituente dell'altro carbonio. Nello stirene
stanno a 5,74 e 5,23 — mezzo ppm — e darne uno solo vuol dire sbagliarne almeno
uno. Escono come due voci sullo stesso atomo, etichettate. Previsti 5,61 e 5,18.
L'etilene, che non ha niente di fronte, continua a darne **uno**.

**I cicloalcani diventano composti di riferimento.** È il metodo che la fonte
stessa descrive (p. 83): si parte dallo spostamento misurato del parente e si
aggiunge solo ciò che è cambiato. Prima c'era un valore fisso per dimensione
d'anello, e funzionava finché l'anello era nudo.

### Lo scarto, misurato di nuovo

| | prima (v188) | ora |
|---|---|---|
| ¹³C, taratura (9 molecole) | 1,47 ppm | **0,71 ppm** |
| **¹³C, validazione (22 molecole)** | **1,56 ppm** | **0,92 ppm** |
| ¹³C, caso peggiore | 15,0 ppm (cicloesanone) | **4,9 ppm** |
| ¹H (14 molecole) | 0,10 ppm | **0,06 ppm** |
| ¹H, soli aromatici | — | **0,03 ppm** |

Le soglie del banco si stringono con il predittore: 2,0 → 1,3 ppm per il ¹³C,
0,5 → 0,15 ppm per il ¹H, più una soglia nuova sul caso peggiore (6,0 ppm) e una
sui soli aromatici ¹H, perché la media generale — tirata dagli alifatici, che
erano già buoni — li nasconderebbe.

**Quello che resta sbagliato è dichiarato.** Il difenile sbaglia l'ipso di
4,6 ppm: l'incremento del fenile della tabella (Z₁ = 8,1) non lo descrive, e
**non è stato ritoccato** per farlo tornare — ritoccare un numero trascritto
perché una molecola di validazione non torna è esattamente il modo di rendere
quel 0,92 una bugia. Gli eterocicli saturi (THF, piperidina) non hanno un
composto di riferimento in tabella e restano la previsione meno affidabile.

### La cronologia delle molecole

Chi usa questo strumento prova una struttura, poi un'altra, poi torna alla prima
per confrontare gli spettri. Senza cronologia bisogna ridisegnarla, e il
confronto — che è il motivo per cui si prevede uno spettro — diventa un lavoro
di memoria.

Sotto la barra del pannello NMR c'è ora una striscia di pastiglie: ogni molecola
che ha prodotto uno spettro ci finisce dentro, un clic la riporta sul tavolo.
Di ognuna si tiene lo **SMILES canonico**, l'**InChI** e la sua **chiave**, e il
confronto per riconoscere i doppioni si fa sulla chiave: `OCC` e `CCO` sono
l'etanolo entrambi, e senza una forma canonica indipendente dalla scrittura la
cronologia si riempirebbe di doppioni. Una struttura che il predittore non sa
leggere **non entra**: non è una molecola su cui si tornerà.

Sta in `localStorage` dentro un `try/catch`, perché in navigazione privata la
scrittura lancia — e una cronologia che non si salva è un fastidio, non un
guasto.

### Cinque difetti trovati misurando

Nessuno di questi era visibile leggendo il codice: li ha trovati il banco.

- **L'ossidrile dell'acido contato due volte.** La riga del carbossile era
  scritta `[CX3;$(...)]=[OX1]` e lasciava fuori l'OH: quell'ossigeno restava
  libero, la riga generica dell'etere se lo prendeva, e il CH₂ dell'acido
  propanoico riceveva l'incremento α del COOH (+20,1) **più** quello β di un
  etere (+10,1). Usciva a 37,0 contro i 27,6 misurati. Una riga troppo stretta
  sbaglia quanto una troppo larga.
- **L'estere visto da un lato solo.** Dal lato alcolico vale 56,5 in α, dal lato
  acilico 22,6: trentaquattro ppm di differenza per lo stesso gruppo di tre
  atomi. L'OCH₂ dell'acetato di etile usciva a 29,4 invece di 60,4. Ora il lato
  si sceglie in base a quale atomo del gruppo è più vicino.
- **Le corrispondenze rese uniche per insieme di atomi.** `get_substruct_matches`
  restituisce *una* orientazione per ogni insieme: per `[CX3]=[CX3]` sullo
  stirene il capo era un carbonio solo, e l'altro non risultava mai capo dello
  schema. Lo stirene perdeva l'incremento del vinile su tutti e cinque gli H
  aromatici. Gli schemi si chiedono ora in forma ricorsiva, `[$(...)]`, che
  prova ogni atomo per conto suo.
- **Le righe «X–fenile» pescavano nell'anello che stavano sostituendo.** `[OX2][c]`
  descrive un ossigeno legato a un aromatico — e l'anello da sostituire *è*
  aromatico, quindi l'OCH₃ dell'anisolo veniva classificato come O–fenile.
  Ortho e para sbagliavano di 0,15 ppm ciascuno. Ora quelle righe pretendono
  **due** vicini aromatici.
- **Il vicino di un carbonio di giunzione trattato come sostituente.** Il
  criterio «sta in due anelli» protegge i C4a/C8a del naftalene ma non i loro
  vicini: il C8 regalava al C8a l'incremento ipso di un fenile, 147,5 invece di
  133,5. Il criterio giusto è che l'anello di quel vicino **condivida un legame**
  con questo.

E uno trovato guardando l'indice di colonna: l'orto di ogni benzene
monosostituito usciva `NaN`, mentre meta e para si scambiavano fra loro.

### Una promessa che nessun controllo manteneva

Il documento 09 dichiara, alla voce D-08, che «un disaccordo fra le due lingue
fa fallire la batteria». Era un'intenzione: **nessun controllo confrontava i due
documenti**, e la matrice di tracciabilità inglese era rimasta indietro di tre
requisiti — SCI-28 (predizione NMR), SCI-29 (equivalenza chimica) e SCI-30
(lettura di uno spettro da un'immagine), cioè proprio i più recenti. Chi legge
solo l'inglese non li trovava.

Le tre righe sono state scritte, e `verifica-documenti` confronta ora gli
identificativi definiti nelle due matrici, stampando la differenza **nei due
versi**: chi manca all'inglese e chi manca all'italiano. Adesso la frase è vera.

### Un difetto che la cronologia ha fatto emergere

Il pannello NMR si monta in **due** posti — la scheda ¹³C del Centro
spettroscopico e quella dell'editor ChemDraw — e cercava i propri elementi con
`document.getElementById`. Montati entrambi, nella pagina esistono due elementi
con lo stesso `id`, e `getElementById` restituisce il **primo in ordine di
documento**, che non è necessariamente quello che si sta guardando: lo spettro
veniva disegnato nel pannello sbagliato e quello aperto restava fermo. Ora le
ricerche partono dalla **radice del pannello montato per ultimo**.

Non lo si vedeva perché nessun banco aveva mai montato tutti e due i pannelli
nella stessa pagina. Il banco della cronologia lo fa, e la prova è fallita
subito.

---
## [bsi-v188] — 2026-10-07

Si disegna la molecola e si ottiene lo spettro ¹H e ¹³C **assegnato atomo per
atomo**; e uno spettro si legge anche da una **fotografia**.

### Predizione NMR assegnata per atomo

Nuovo motore `bsi-nmr.js`. Quello che c'era prevedeva il ¹H contando GRUPPI con
SMARTS — funziona per disegnare uno spettro, ma non sa DOVE stanno quei protoni:
non c'è un indice di atomo da nessuna parte, e senza quello cliccare un picco e
vedere illuminarsi l'atomo corrispondente è impossibile. Il ¹³C non esisteva
affatto nel motore strutturale: le due schede che lo mostravano — nel Centro
spettroscopico e nell'editor ChemDraw — lo ricavavano con **espressioni
regolari sul testo dello SMILES**, otto bande generiche per qualunque molecola
(«C alifatici 22 ppm», sempre).

Il metodo nuovo è fatto di schemi **pubblicati**, verificabili uno per uno:

- **incrementi di sostituente sull'anello benzenico**, con la posizione
  (ipso/orto/meta/para) ricavata *camminando l'anello*, non indovinata;
- **Grant–Paul** per i carboni sp3 di catena, con gli incrementi β e γ dei
  gruppi funzionali;
- **valori di classe** per carbonili, nitrili, alcheni, alchini, cicloalcani e
  per gli sp3 che portano un gruppo funzionale in α.

#### Lo scarto è misurato, e su molecole che non hanno scelto i parametri

Un predittore non si rompe mai: produce sempre dei numeri. Per sapere se
servono, le molecole sono divise in due insiemi — **taratura** (quelle usate per
scegliere valori e regole) e **validazione** (mai usate per quello). Il numero
dichiarato nel pannello è quello della validazione:

| | scarto medio |
|---|---|
| ¹³C, taratura (9 molecole) | 0,56 ppm |
| **¹³C, validazione (17 molecole)** | **1,93 ppm** |
| ¹H (8 molecole) | 0,10 ppm |

Il banco pretende anche che la validazione resti **peggiore** della taratura: se
diventassero uguali vorrebbe dire che qualcuno ha spostato una molecola da un
insieme all'altro, e il numero non direbbe più niente.

Sul toluene lo scarto massimo è **0,1 ppm** (137,8 / 129,2 / 128,4 / 125,6
contro 137,8 / 129,3 / 128,5 / 125,6). Sul cicloesanone è 15 ppm, ed è
dichiarato: gli sp3 con intorni complicati restano il punto debole.

### L'equivalenza chimica, che fa tornare i conti

Il benzene ha sei carboni e **un** segnale. Gli atomi equivalenti si
riconoscono con un codice d'intorno costruito a gusci concentrici — lo stesso
principio dei codici HOSE. Verificato su otto molecole di cui si sa quanti
segnali danno: benzene 1, toluene 5, p-xilene 3, naftalene 3, difenile 4,
aspirina 9. Tutte giuste.

### Lo spettro si può interrogare

Nella scheda ¹³C dell'editor: rettangolo per ingrandire, rotella per
l'intensità, doppio clic per tornare indietro, **clic su un picco o su una riga
della tabella per illuminare gli atomi che lo producono** nella struttura
disegnata accanto. Tabella di assegnazione con etichetta, ppm, integrazione,
molteplicità (dalla regola n+1 calcolata sul grafo) e costanti di
accoppiamento. Uscite in **CSV**, **JCAMP-DX** e **PNG**.

Il JCAMP prodotto è una `PEAK TABLE`, non una curva: è quello che una lista di
segnali previsti è, e scrivere `XYDATA` darebbe l'impressione di una misura.

### Un editor nuovo scritto e buttato

Il primo tentativo ne scriveva uno: tavolozza, legami, anelli, annulla e
ripeti, menu contestuale. Mille righe, già funzionanti. Sono state buttate,
perché l'applicazione **ne ha già uno** — l'editor ChemDraw, con i template
eterociclici (piridina, pirrolo, furano, tiofene, imidazolo), i gruppi
funzionali pronti, le cariche, il tocco, la cronologia e una libreria di 62
molecole. Due editor per la stessa cosa significa che uno riceve le correzioni
e l'altro no, e chi disegna non sa quale usare. Il progetto ha una regola per
questo: una sola casa per funzione. Quello che mancava non era un posto dove
disegnare, ma uno spettro che si potesse interrogare.

### Uno spettro da una fotografia

Il lettore di spettri accetta ora anche **immagini**: una foto del
registratore, un ritaglio da un articolo, lo schermo dello strumento. La
traccia si estrae dai pixel, colonna per colonna, cercando la riga più scura
rispetto allo sfondo stimato; le colonne vuote si interpolano, così un
tratteggio non spezza la curva.

Verificato su una figura **costruita** con gaussiane a 1715, 2950 e 3400 cm⁻¹:
letti dai soli pixel **1713, 2947 e 3403**. E nei due versi — su un foglio
**bianco** rifiuta invece di inventare una traccia.

**Quello che non può fare è scritto nel pannello:** l'immagine non contiene i
numeri degli assi. La scala la deve dare chi legge, e la funzione la *pretende*
invece di indovinarla. La forma della traccia è recuperata, la taratura no.

### Difetti trovati lungo la strada

- **Il codice d'intorno non era canonico.** Usava una visita in ampiezza con
  l'insieme dei visitati: su un anello, quale cammino arriva prima a un atomo
  dipende dall'ordine dei vicini, e questo rompeva la simmetria — il benzene
  usciva con due segnali, 128,5 su quattro carboni e 128,5 sugli altri due.
  Ora i gusci si costruiscono per distanza.
- **La forma di Kekulé rompeva la simmetria dell'anello.** In un singolo
  Kekulé i due carboni orto del toluene non sono equivalenti — uno è legato
  all'ipso con un doppio, l'altro con un singolo — e il toluene dava sette
  segnali invece di cinque. Un legame fra due atomi aromatici ora si scrive
  «a», e l'aromaticità la decide RDKit.
- **Gli incrementi dell'anello si sommavano.** Un metile corrisponde sia a
  `[CX4H3]` (+9,3 ipso) sia al generico `[CX4]` (+9,0): l'ipso del toluene
  usciva a 146,8 invece di 137,8, esattamente +9 di troppo. Ora ogni
  sostituente riceve **una sola** regola.
- **Gli anelli condensati non sono anelli sostituiti.** Nel naftalene i due
  carboni di condensazione ricevevano l'incremento «ipso fenile» dall'altro
  anello e uscivano a 152,3 invece di 133,5. Correggendolo troppo — saltando
  ogni vicino aromatico — si rompeva il **difenile**, dove il fenile è un
  sostituente vero: tutti e quattro i carboni a 128,5 invece di 141,2 / 128,8 /
  127,3 / 127,2. Il criterio giusto è stare in **due** anelli.
- **Doppio conteggio fra Grant–Paul e gli incrementi α.** Grant–Paul conta il
  carbonio carbonilico come α (+9,1) e poi l'incremento del chetone (+30) lo
  contava di nuovo: l'acetone dava il metile a 46,2 invece di 30,8.
- **Un segno sbagliato.** Il β di un carbossile *scherma*: l'acido propanoico
  ha il CH₃ a 9,0 contro i 15,6 del propano, Δ = −6,6 e non +3.
- **Uno SMARTS che conteneva entrambi i metili.** `[CX4H3][CX3](https://github.com/samupropio1-ship-it/BioSpecInfo-v11/blob/main/=[OX1])[CX4]`
  su un acetone fa **una** corrispondenza, perché l'insieme di atomi è lo
  stesso per i due metili e RDKit lo unifica: solo uno riceveva il valore di
  classe, e il segnale usciva come media fra 30 e 16,2. Tutte le tabelle sono
  state riscritte con l'atomo di interesse come **unico** atomo del pattern,
  usando SMARTS ricorsivi.
- **Un `null` silenzioso.** Quando il predittore lanciava, restituiva `null` e
  il pannello avrebbe mostrato «nessun segnale» senza dire perché. Gli
  aromatici fallivano **tutti** per un `cicli is not defined`, e nessuno lo
  diceva. Ora l'errore torna insieme alla sua pila.
- **Protoni equivalenti non si sdoppiano.** Il benzene usciva «t» e il
  ciclopropano «quint»: due singoletti, nei fatti, dichiarati come
  multipletti.
- **Una stringa vuota non è una molecola.** RDKit la accetta e restituisce un
  grafo senza atomi, da cui usciva uno spettro con zero segnali: un oggetto che
  sembra un risultato e non lo è.

### La categoria Utility passa nel menù ✨

La barra di navigazione aveva sette categorie, e la settima — «🛠️ Utility»
— raccoglieva diciotto voci che con la chimica non c'entrano: l'assistente, il
laboratorio, le note, il File Manager, le statistiche, il Pomodoro. Occupava
una categoria intera accanto a Chimica, Spettroscopia e Farmacologia.

Ora stanno nel menù ✨, in **due blocchi separati**: «🛠️ Utility» con gli
strumenti, e «🌍 Lingue e linguaggi» con la lingua dell'interfaccia e i
linguaggi chimici — che non sono uno strumento fra gli altri, sono il modo in
cui si legge tutto il resto.

**I pulsanti restano nel documento**, nascosti. Cancellarli sarebbe stato più
pulito a vedersi e sbagliato: decine di punti dell'applicazione aprono una
sezione con `document.querySelector('[data-s=...]').click()`, e `goSection()`
fa esattamente quello. Toglierli avrebbe rotto quei collegamenti in silenzio,
uno per uno. E le **etichette si leggono dai pulsanti** invece di essere
riscritte: così non diventano stringhe nuove da tradurre in tredici lingue, e
il menù dice sempre quello che dice la sezione.

#### Il menù giusto non era quello che sembrava

Il primo tentativo agganciava `#bsi105-fab` e `#bsi13-panel`. Esistono ancora
nel documento, ma sono `display:none` su **ogni** schermo — grande e piccolo.
Il menù che si vede davvero è `#bsi14-fab` con `#bsi14-panel`. Il banco
l'ha detto alla prima esecuzione, su entrambe le misure: «il pulsante ✨ c'è
ed è visibile → false». Senza quel controllo la categoria Utility sarebbe
finita in un menù che nessuno può aprire — irraggiungibile, come le due
sezioni delle lingue prima di lei.

Ed è per questo che il banco non si accontenta che il pulsante esista nel DOM:
`test_menu` gira su **schermo grande e su telefono**, pretende che il ✨ sia
visibile, che il pannello si apra, che tutte e diciotto le voci ci siano sotto
l'intestazione giusta, e che cliccandone una la sezione si apra davvero.

### Elucidazione — dai dati alla struttura, senza fare il salto

Nuovo modulo `bsi-elucida.js`, dentro la sezione «Lettore spettri»: si incolla
quello che si ha — formula molecolare, lista dei picchi di massa, bande IR,
segnali ¹³C e ¹H — ed esce un **dossier** in cui le **deduzioni** stanno
separate dalle **supposizioni**.

| deduzione | che cos'è |
|---|---|
| gradi di insaturazione (IDI/DBE) | aritmetica: `1 + Σ nᵢ(vᵢ−2)/2`, vale per qualunque elemento |
| massa monoisotopica attesa per M⁺ | somma degli isotopi più abbondanti |
| numero di segnali ¹³C distinti | e se sono meno dei carboni della formula, **c'è simmetria** |
| protoni dalle integrazioni | con l'avviso se non tornano con la formula |

| supposizione | con quale margine |
|---|---|
| numero di carboni dal picco **M+1** | `I(M+1)/I(M) × 100 / 1,1`, corretto per N, S, Si |
| eteroatomo dal picco **M+2** | Cl 32,5 % · Br 97,3 % · S 4,4 % · Si 3,4 % |
| perdite neutre | 25 voci, da −15 (CH₃) a −59 (COOCH₃) |
| bande IR, classi ¹³C e ¹H | **tutte** le compatibili, non la prima |

#### Perché non propone una struttura

Dedurla da zero — generare gli isomeri compatibili e ordinarli — si chiama
CASE, ed è un problema di ricerca, non una funzione. Per C₉H₁₀O₂S ci sono
migliaia di isomeri, e gli spettri ne escludono molti ma non tutti tranne uno.
Un programma che ne sputasse una sola darebbe una certezza che i dati non
contengono.

Quello che fa è **verificare una proposta**: ne prevede gli spettri e li mette
accanto a quelli osservati, segnale per segnale, dicendo dove casca.

#### I conti verificati contro compiti già corretti

Il banco non usa esempi inventati: usa quesiti di «Metodi Fisici in Chimica
Organica» con i conti che lo studente ha scritto a mano sul foglio.
**Dodici formule, dodici IDI giusti** — C₉H₁₀O₂S = 5, C₁₃H₁₇NO₂ = 6,
C₇H₁₀O₃ = 3, e così via. E il numero di carboni dal M+1: su `M 151 (47,2) ·
M+1 152 (4,7)` dà **9**, come il calcolo a mano.

Sul confronto fra una struttura **giusta** e una **sbagliata con la stessa
formula**: 2-etossibenzaldeide 100 contro 30, 4-amminobenzoato di metile 100
contro 80.

#### Un punteggio basso può voler dire due cose

E confonderle sarebbe il difetto peggiore di uno strumento come questo, perché
farebbe scartare la risposta giusta. Sul quesito del furano la struttura è
**corretta** e il punteggio esce **42**: non perché sia sbagliata, ma perché il
predittore non ha incrementi di posizione per gli **eteroaromatici
sostituiti** — esistono per il benzene, non li ho per furano, tiofene, pirrolo
e piridina, e inventarli sarebbe scrivere numeri senza fonte.

Quindi lo strumento dichiara la **fiducia**: «bassa», con il motivo scritto.
Il banco lo verifica — formula coincidente, punteggio basso, fiducia bassa,
motivo presente.

Aggiunti intanto i valori di classe ¹³C per gli eteroaromatici **non**
sostituiti, che prima non c'erano affatto: furano α 142,7 / β 109,6, tiofene,
pirrolo, piridina. Senza di quelli i carboni del furano uscivano tutti a 128,5.

### Il manuale come fonte: quattro miglioramenti con la pagina accanto

Dal **Manuale di Metodi Fisici in Chimica Organica** sono usciti i numeri che
mi mancavano. Ognuno è preso da una tabella del testo, non dedotto:

- **Correzioni steriche di Grant–Paul** (§4.7). Lo schema senza correzioni
  sbaglia sui carboni ramificati: il metile dell'isobutano usciva 25,6 contro
  i 24,3 sperimentali. Con le quattro correzioni che il manuale enuncia
  — osservatore 1° con vicino 3°/4° → −1,1 e le altre tre — esce
  **24,5**, che è esattamente il valore del suo esempio svolto.
- **Furano sostituito** (§15, caso D). Il manuale dice «furano monosostituito:
  C–O deschermato ∼150», e il quesito del 23/04/2024 lo conferma con 150,77 e
  146,05. Il carbonio α che porta un sostituente va quindi a 150, non ai
  142,7 del furano nudo. Il β non ha un valore dichiarato e **resta quello non
  sostituito**: dove non c'è una fonte non si inventa un numero.
- **Cinque perdite neutre in più** (§7.4): −36 (HCl), −56 (C₄H₈, McLafferty
  degli esteri butilici), −77 (C₆H₅), −81 (HBr), −128 (HI).
- **Costanti J per geometria** (§7.5): dodici righe al posto di sei, con
  l'intervallo accanto al valore tipico — cicloesano ax–ax 8–13, aromatico
  orto 6–10, alchene cis 6–12 contro trans 12–18, J cicliche del furano
  1,5–3,5.

#### E due difetti che il manuale ha fatto emergere

Provando i suoi cinque problemi svolti, due sbagliavano di 8–10 ppm.

Il **CH₂ in α a un estere** stava a 28 come quello di un acido. Non è lo
stesso: l'acido propanoico ha il suo a 27,6, il butanoato di etile a **36,2**
(dal problema svolto). Tenerli insieme sbagliava di 8 ppm sul segnale che dice
dove sta il carbonile.

E gli **incrementi β misuravano la distanza dall'atomo più vicino del gruppo**
invece che dal suo ancoraggio. Il gruppo `[OX2][#6]` di un estere etilico
comprende anche il carbonio OCH₂, legato al metile: la distanza risultava 1
invece di 2, nessun incremento si applicava, e il metile dell'etile usciva a
**4,6 ppm invece di 14,3**.

Correggendolo è emerso un **secondo difetto che il primo nascondeva**:
l'ossigeno di un alcol corrisponde sia a `[OX2H1]` sia a `[OX2][#6]`, e
prendeva **due** incrementi per la stessa ragione — il metile dell'etanolo
saliva a 24,8 invece di 18,2. Le righe ora si escludono a vicenda.

#### Il risultato, misurato

| | prima | ora |
|---|---|---|
| scarto medio su 23 molecole di letteratura | 1,96 ppm | **1,47 ppm** |
| insieme di validazione | 1,93 ppm | **1,56 ppm** |
| conteggi di segnali corretti | 17/18 | **22/23** |
| cricca del banco | 2,5 ppm | **2,0 ppm** |

I cinque problemi svolti del manuale sono entrati nell'insieme di
validazione: sono i casi che lo studente deve saper risolvere, e quindi la
misura giusta su cui farsi giudicare. La soglia si è stretta perché lasciarla
a 2,5 permetterebbe al predittore di tornare indietro senza che nessuno se ne
accorga.

### Banchi

Nuovo `test_elucida` (28 controlli). Nuovo `test_menu` (36 controlli su due viewport). Nuovo `test_nmr` (26 controlli): i due insiemi con i valori di letteratura, il
conteggio dei segnali su otto molecole, i rifiuti, e il pannello provato
nell'applicazione — clic su una riga, atomi illuminati, passaggio fra ¹H e
¹³C sulla stessa molecola. `test_spettrolettore` sale a 45 con la lettura da
immagine. Batteria ufficiale: **55 banchi**.

---
## [bsi-v187] — 2026-10-03

Un lettore di spettri che si porta il file, chemioinformatica che stima la
solubilità e impara da dati, trentasei farmaci nuovi con la struttura presa da
fuori — e tre strutture sbagliate che erano già nel sito.

### Lettore di spettri avanzato

Nuova sezione **Lettore spettri**. Si carica un file o si incolla un testo, e
viene letto: **JCAMP-DX** con la compressione **ASDF** completa (PMAI per le
cifre, DIF per le differenze, DUP per le ripetizioni) oppure due colonne di
numeri. Il formato JCAMP prevede un proprio controllo di integrità — dopo una
serie di differenze il valore successivo scritto per intero deve coincidere con
quello calcolato — e qui viene fatto, cosa che quasi nessun lettore fa.

I picchi si trovano per **prominenza**, con il rumore stimato dalla deviazione
assoluta mediana (MAD × 1,4826) e non dalla deviazione standard, che un picco
alto gonfia. L'IR si disegna con i numeri d'onda **decrescenti**, come lo si
guarda. Per ogni banda vengono elencate **tutte** le assegnazioni compatibili,
non la prima: a 1715 cm⁻¹ un C=O chetonico e un C=O di acido carbossilico sono
entrambi possibili, e dire solo uno dei due sarebbe un'affermazione che i dati
non reggono. La sezione dichiara di non dedurre la struttura.

Spettri di massa: la lista di picchi viene riconosciuta come tale, e le
differenze fra ioni vengono confrontate con una tabella di diciassette
**perdite neutre**. Sul toluene il picco base è m/z 91 e fra 92 e 91 compare la
perdita di H.

Il banco (`tools/banchi/test_spettrolettore.js`, 39 controlli) parte da spettri
**costruiti**: tre gaussiane a 1715, 2950 e 3400 cm⁻¹ sotto rumore, e il
lettore ne trova tre, a 1716, 2952 e 3402. Nei due versi: su **rumore puro non
ne trova nessuno** — senza quello, i tre di sopra non dimostrerebbero niente.

### Chemioinformatica e data science

- **ESOL** (Delaney 2004) per la solubilità in acqua, con l'incertezza
  dichiarata accanto alla stima. Verificata contro valori sperimentali:
  aspirina −1,65 contro −1,72; benzene −1,39 contro −1,64; naftalene −2,42
  contro −3,60; etanolo −0,12 contro +1,10. Scarto medio 0,68 unità
  logaritmiche, entro l'errore che il metodo dichiara. Un modello pubblicato si
  verifica contro il **suo** errore, non contro la perfezione.
- **Quattro filtri di drug-likeness** (Lipinski, Veber, Egan, Ghose), ognuno
  con il proprio verdetto e le proprie violazioni, non un punteggio unico che
  nasconde quale regola è stata violata. Sull'aspirina: Lipinski, Veber ed Egan
  passano, Ghose viola «20 ≤ atomi pesanti ≤ 70» perché l'aspirina ne ha 13.
- **Albero di regressione** e **foresta casuale** con campionamento bootstrap,
  sottoinsieme di variabili per nodo ed errore **fuori sacco**. Deterministica
  a parità di seme: un modello che cambia risposta a ogni esecuzione non si può
  verificare. Su una relazione non lineare costruita apposta R² fuori sacco
  0,90; su un bersaglio di **puro rumore** −0,16 — la guardia opposta, senza la
  quale lo 0,90 non direbbe che il modello impari qualcosa.

### Linguaggi chimici: venticinque uscite

Aggiunte le **sei impronte digitali** (Morgan, MACCS, RDKit, coppie di atomi,
torsioni topologiche, pattern), lo SMILES con gli idrogeni espliciti, lo
scheletro Murcko e il blocco scheletrico della chiave InChI. Ogni impronta
riporta la lunghezza **e il numero di bit accesi**: una stringa di soli zeri
passerebbe inosservata. Sull'aspirina: Morgan 24/2048, MACCS 21/167, RDKit
354/2048, coppie 68/2048, torsioni 18/2048, pattern 173/2048.

### Trentasei farmaci nuovi, e tre strutture che erano sbagliate

263 farmaci in tutto. Le trentasei voci nuove colmano classi che mancavano del
tutto: gliflozine, biguanidi, anticoagulanti diretti e warfarin, diuretici
(dell'ansa, tiazidici, risparmiatori di potassio), inibitore di KRAS G12C,
CDK4/6, BCL-2, modulatore CFTR, antifungino triazolico, glicopeptide,
ossazolidinone, demenze, gepante, glucocorticoide, antileucotrieni,
inibitore della calcineurina.

**Nessuno SMILES scritto a memoria.** Ogni struttura viene dal record ChEMBL e
la formula molecolare è stata **ricostruita contando gli atomi del grafo** che
RDKit legge, poi confrontata con quella che ChEMBL dichiara: 36 su 36
coincidono. Il banco e i dati grezzi con l'identificativo di ogni voce sono in
`tools/banchi/verifica_farmaci_v187.js` e `tools/dati/farmaci_v187.json`.

**Due voci rifiutate**, e vale la pena dire perché: l'**ivermectina** ha
`structure_type NONE` nel record (è una miscela di omologhi) e la
**semaglutide** è una proteina, `structure_type SEQ`. In entrambi i casi la
struttura si sarebbe potuta scrivere a memoria. È esattamente ciò che non si
fa: una struttura senza fonte entra nel sito indistinguibile da una verificata.

**Due nomi sono tornati diversi** da quelli cercati, perché la ricerca per nome
di ChEMBL è a corrispondenza parziale: «morphine» ha restituito l'**apomorfina**
e «levothyroxine» la **liotironina** (T3), trovata come sinonimo. Le voci sono
state tenute con il nome del **record**, non con quello della domanda: il
contrario avrebbe messo una scheda clinica sbagliata sopra una struttura giusta.

#### Il difetto che il peso non vedeva

Sei dei trentasei farmaci esistevano già. Confrontando le due versioni con la
**chiave InChI** che ChEMBL dichiara, tre di quelle preesistenti sono risultate
una **molecola diversa**:

| farmaco | chiave della voce vecchia | chiave dichiarata da ChEMBL |
|---|---|---|
| Lenalidomide | `XKAYAFBLGLCWSY` | `GOTYRUGSSMKFNF` |
| Palbociclib | `PSRAOXPOEYRNJN` | `AHJRHEGDXFFMBM` |
| Aripiprazolo | `ZGXTVHHDFYTYTL` | `CEUORZQYGODEFX` |

Erano **isomeri**: stessa formula, stesso peso, posizione diversa di un azoto o
di un carbonile. Il controllo sul peso dichiarato contro quello calcolato — che
esisteva e passava — non poteva vederlo, perché un isomero pesa uguale. Le tre
voci sbagliate sono state rimosse e sostituite da quelle verificate.

`audit_farmaci` ora ricostruisce la **formula** per ogni voce che dichiara una
provenienza, con due cricche che non possono allentarsi: le voci con
provenienza verificata non possono scendere sotto 36 e quelle con una struttura
leggibile non sotto 240. E le voci legittimamente **senza** struttura non sono
più coperte da un carattere jolly ma da tre ragioni dichiarate —
macromolecola, associazione a dose fissa, miscela di omologhi — perché una
esenzione senza ragione è un posto dove nascondere i difetti.

### Il modulo nuovo aveva spento il motore degli spettri

Il lettore si chiamava `window.BSISpettri`, e quel nome era **già occupato**:
è il motore di predizione spettrale di `bsi-spettri.js`, che si carica prima.
L'assegnazione lo sovrascriveva, e con lui sparivano `gruppi()`,
`irBandListLegacy()` e `nmrPeakListLegacy()` — il riconoscimento dei gruppi
funzionali e il disegno degli spettri previsti.

L'applicazione non diceva niente. **Zero errori JavaScript** su tutte le
quattordici pagine, la pagina si apriva, la sezione nuova funzionava, e perfino
la sezione degli spettri si disegnava, perché passa da un'altra strada. Il
difetto esisteva solo per chi chiamava quelle funzioni per nome.

Tre banchi su quattro lo hanno visto: `test_spettri` (41 controlli),
`test_spettri_ui` (16) e `test_assi` (13) sono caduti tutti sullo stesso
`TypeError`. Il modulo ora si chiama `BSILettoreSpettri`, e la ragione del nome
è scritta nella sua intestazione — perché è il tipo di errore che si rifà
identico sei mesi dopo.

### E la lingua che mancava a una voce sola

Aggiungere «📉 Lettore spettri» alla barra di navigazione senza tradurlo
avrebbe lasciato **una** voce su 171 in italiano in tutte e tredici le altre
lingue: invisibile a occhio in mezzo a novantadue pulsanti. `test_lingue` l'ha
detta per nome — «`navigazione: 📉 Lettore spettri`» — e ha preteso 92
pulsanti tradotti trovandone 91. Tradotta nelle tredici lingue: la copertura
torna **171 su 171** per tutte e quattordici.

### Trenta farmaci in piu' hanno reso «Farmacologia» la sezione piu' lenta

Con 263 voci invece di 233, aprire la sezione teneva la pagina bloccata
**159 ms**, e le sezioni oltre i 100 ms passavano da due a tre — oltre la
cricca che `test_fluidita` difende. La batteria era passata per un soffio la
volta precedente: un limite superato a intermittenza non protegge niente, ed è
peggio di un fallimento netto.

Le carte ora si disegnano **a fette da 8 ms**: la carta vuota entra subito nella
griglia, così l'altezza presunta è giusta e la barra di scorrimento non salta,
e solo il contenuto viene accodato. Da 159 a **55 ms**, sezioni oltre i 100 ms
di nuovo **zero**, e nessuna delle 263 voci perduta.

Le fette **non** sono il comportamento predefinito, e la ragione è precisa:
`test_farm_ui` chiama `showFarm(cat)` e legge il testo di `#farmList` sulla riga
dopo. Reso asincrono di nascosto, quel banco avrebbe smesso di misurare quello
che crede di misurare. Chiamata diretta: sincrona come sempre. Apertura della
sezione e cambio di filtro: a fette. `showFarm` restituisce **quanti lavori ha
accodato**, così il comportamento si misura dall'esterno invece di dedurlo dai
tempi.

#### Un involucro che perdeva gli argomenti

Il primo tentativo non ha avuto effetto, e la funzione modificata sembrava
giusta a leggerla. Mille righe piu' sotto, `showFarm` viene **riassegnata** da
un involucro che corregge le etichette delle categorie — e che chiamava
`_prevShowFarm(cat)`, scartando il secondo argomento e il valore di ritorno.
Il disegno a fette non partiva mai. Un involucro che perde gli argomenti è un
difetto invisibile finché qualcuno non comincia a usarli, e si trova solo
misurando: `showFarm(...)` restituiva `undefined` dove doveva restituire 263.

### Una soglia che misurava la macchina, non il codice

`test_fluidita` pretendeva che aprire il visore 3D costasse meno di **80 ms**.
Con lo **stesso codice pubblicato**, su container diversi, lo stesso click ha
misurato 14, 22, 98, 105 e 192 ms: il costo è la compilazione degli shader di
3Dmol, e qui WebGL è **SwiftShader**, un rasterizzatore software. Una soglia
assoluta in quelle condizioni fallisce dove il codice è identico, e passerebbe
dove è peggiorato. Alzarla a 200 l'avrebbe fatta passare e resa cieca.

Provata come **rapporto** su una calibrazione misurata nella stessa esecuzione:
non funziona. Quando il banco arriva al visore, WebGL è già stato usato dalla
pagina, e la calibrazione misura un costo **a caldo** (2,9 ms) mentre il visore
paga una compilazione **a freddo**. Il rapporto oscillava fra 14× e 36×.

Quello che il controllo deve impedire è **strutturale**: il difetto originario
era il primo `render()` di 3Dmol chiamato dentro il gestore del click. Allora
si afferma quello, nei due versi: subito dopo il ritorno del gestore, nello
stesso task, il contesto WebGL **non deve esistere**; poco dopo **deve**
esistere. Misurato: 0 tele durante il click, 1 dopo. E la misura non è vacua —
al secondo click, quando la tela c'è già, restituisce 1. Resta un tetto
assoluto di 400 ms, dichiarato grossolano: intercetta una catastrofe, non
misura la resa.

### Il difetto nel mio stesso controllo

La prima esecuzione della verifica delle formule ha dato **0 su 36**: ogni
formula risultava `C<n>`, tutti carboni e nessun idrogeno. Il formato
`get_json` di RDKit è **commonchem**, e in commonchem un atomo porta soltanto i
campi che **differiscono** dai valori predefiniti — dove `z` vale 6 e `impHs`
vale 0. Un atomo scritto `{}` è un carbonio. Leggevo `a.element`, che non
esiste, e contavo tutto come carbonio. Erano i dati a sembrare sbagliati;
era il contatore.

---
## [bsi-v186] — 2026-10-03

Giapponese e arabo, altri quattro linguaggi chimici, e la metà di interfaccia
che restava in italiano anche cambiando lingua.

### 日本語 e العربية — e il verso di scrittura

Quattordici lingue. L'arabo però non è solo un dizionario: si scrive **da
destra a sinistra**. Tradurre le etichette e lasciare l'impianto della pagina
al contrario sarebbe una traduzione che sembra fatta e non lo è — e non si
vedrebbe contando le stringhe, solo guardando. La lingua ora porta con sé il
verso: `dir="rtl"` per l'arabo, `ltr` per tutte le altre e al ritorno.

Il banco lo verifica nei due versi: `rtl` in arabo, `ltr` in giapponese. Con
`rtl` su tutte, il verso non significherebbe niente.

### Mezza interfaccia restava in italiano

Guardando la pagina in arabo si vedeva il difetto che nessun conteggio aveva
segnalato: le **sette categorie** della barra (Chimica, Spettroscopia,
Biochimica, Farmacologia, Chimica Fisica, Studio, Utility) e il **campo di
ricerca** restavano in italiano. Metà interfaccia tradotta è peggio di nessuna,
perché sembra un errore invece di una scelta.

Le categorie sono entrate nello scheletro. Il segnaposto della ricerca ha
richiesto un trattamento a parte: vive in un **attributo**, non nel testo, e
nessun conteggio su `textContent` se ne sarebbe mai accorto.

Lo scheletro passa da 162 a **170 elementi**, e tutte e tredici le lingue lo
coprono per intero.

### Diciassette linguaggi chimici

Ai tredici si aggiungono quattro uscite vere:

| | |
|---|---|
| **SMILES senza stereochimica** | ciò che si confronta quando si cerca «la stessa molecola a meno di configurazione» |
| **componenti** | un sale o un solvato sono *più* molecole, e dirlo evita di ragionare su una molecola che non esiste |
| **composizione in massa** | il conto che si fa a mano all'esame, con i pesi IUPAC scritti nel modulo |
| **CML** | Chemical Markup Language: XML, quindi leggibile da qualunque strumento |

La composizione è verificata contro il calcolo a mano: alanina C₃H₇NO₂,
M = 89,094 → **C 40,44% · H 7,92% · N 15,72% · O 35,91%**; aspirina C₉H₈O₄,
M = 180,159 → **C 60,00% · H 4,48% · O 35,52%**. La riga «componenti» compare
solo quando i componenti sono più d'uno — il banco pretende anche questo.

### Le molecole: verificato nella sezione vera

L'animazione di formazione e la selezione degli angoli erano state provate su
una tela costruita dal banco. Ora sono state provate **dove vivono davvero**:
nel visualizzatore 3D della sezione Molecola, che si apre in un popup.
Funzionano: la tela passa da 877 a 3 344 pixel accesi, la barra con i tre
comandi è presente e **dentro** il popup (misurata: 93 × 518 px, bordo
inferiore a 691 contro i 725 del contenitore), e la selezione dà
`C–C–O 111,7° · tetraedrica · ideale 109,5°`.

### Verifica

**51 banchi, 0 falliti.** `test_lingue` passa da 49 a **64 controlli**.

---
## [bsi-v185] — 2026-10-03

Un vero selezionatore di lingue, e tutti i linguaggi chimici che il motore sa
davvero produrre.

### Dodici lingue, con la copertura misurata accanto a ciascuna

Italiano, **English, Español, Français, Deutsch, Português, Nederlands,
Polski, Română, Ελληνικά, Русский, 中文**. Il pannello non è più un elenco di
pulsanti: ha un **campo di ricerca** e, accanto a ogni lingua, la copertura
**162/162 · 100%**.

Quella percentuale non è scritta a mano: `coperturaPerLingua()` applica
davvero ogni dizionario, conta gli elementi tradotti e rimette la lingua di
prima. È una misura, e cadrà da sola il giorno in cui qualcuno aggiunga una
voce di menu dimenticando una lingua.

**Non sono «tutte le lingue del mondo», e non lo dico.** Ogni lingua elencata è
completa e scritta a mano: nessuna è riempita a macchina, nessuna è parziale.
Aggiungerne una è un dizionario e una riga — `BSILingue.registra(codice, voci)`
è pubblica e documentata.

### Otto linguaggi chimici, non sei

Alle conversioni si aggiungono quattro uscite vere:

| | |
|---|---|
| **XYZ** | tre numeri per atomo: lo legge qualunque programma di calcolo |
| **PDB** | HETATM più CONECT, per aprirla in un visualizzatore |
| **CXSMARTS** | lo SMARTS esteso |
| **stereochimica CIP** | i descrittori *R*/*S* ed *E*/*Z* come li assegna il motore |

RDKit non scrive né XYZ né PDB: li scrivo io dalle coordinate del molfile. E
una **reazione** `reagenti>>prodotti` ora viene riconosciuta e scomposta —
2 reagenti, 2 prodotti — invece di essere trattata come una molecola sola, che
darebbe un risultato dall'aria giusta e sbagliato.

### Corretto — XYZ e PDB uscivano con tutti gli atomi nell'origine

Il mio lettore di molfile era nato per il nominatore IUPAC, a cui serve solo la
connettività: **non leggeva affatto le coordinate**. Appena si sono aggiunti
XYZ e PDB, i file uscivano con ogni atomo a (0, 0, 0) — numeri che sembrano
dati e non lo sono, esattamente il difetto che questo progetto insegue.

Ora le coordinate si leggono (colonne 0-10, 10-20, 20-30 del blocco atomi) e si
**dichiarano per quello che sono**: quelle che RDKit calcola da uno SMILES sono
**2D** (z = 0), servono a disegnare e non a misurare, e il file lo scrive nella
sua intestazione. Se sono tutte nulle, XYZ e PDB non vengono prodotti affatto.

Il banco lo verifica nei due versi: le coordinate non devono essere nulle **e**
devono essere dichiarate 2D.

### Verifica

**51 banchi, 0 falliti.** `test_lingue` passa da 31 a **49 controlli**.

---
## [bsi-v184] — 2026-10-03

Due funzioni che c'erano ma non si trovavano, e la lingua che non è più una
scelta fra due.

### Erano irraggiungibili dove l'app si usa di più

«Lingua» e «Linguaggi delle molecole» vivevano come voci del menu ✨. Ma su
telefono quel menu è **nascosto** — `#bsi105-menu{display:none!important}` — e
sostituito da un pannello a scomparsa con una lista propria, cablata. Le due
voci nuove non ci arrivavano: una funzione raggiungibile solo da lì è una
funzione che non c'è, proprio dove l'applicazione si usa di più.

Ora sono **due sezioni come tutte le altre**, con il loro pulsante nella
navigazione (🌍 Lingua, 🔤 Linguaggi molecole), presenti anche nel pannello
mobile. La voce del menu ✨ **porta** alla sezione invece di aprire una
finestra.

### Sei lingue, non due

Italiano, **English, Español, Français, Deutsch, Português**. Ogni lingua copre
**162 elementi su 162** dello scheletro — e il banco pretende sia la copertura
piena sia che il testo cambi davvero: un dizionario vuoto passerebbe «tutto
tradotto» senza muovere una lettera.

| | tradotti | testi cambiati |
|---|---|---|
| English | 162/162 | 137 |
| Español | 162/162 | 136 |
| Français | 162/162 | 140 |
| Deutsch | 162/162 | 139 |
| Português | 162/162 | 136 |

Il ritorno all'italiano resta esatto, carattere per carattere.

### Corretto — una trappola che c'era già, e in cui sono caduto

Montando le viste in due posti (finestra e sezione) con gli stessi
identificativi, avevo svuotato l'uno quando si apriva l'altro. In fondo
all'applicazione c'è però un **ripiego per le sezioni vuote** che, 800 ms dopo
un click, sostituisce qualunque sezione vuota con «🚧 Sezione in costruzione».
La sezione svuotata diventava un cartello di lavori in corso.

La risposta non è un terzo accorgimento: è togliere il doppione. La finestra
non c'è più — **una sola casa per funzione**, niente identificativi doppi,
niente da svuotare. Il banco ora pretende che nessuna delle due sezioni mostri
quel cartello.

### Corretto — i titoli che si traducevano due volte

I titoli delle due sezioni nuove finivano nel conteggio dello scheletro, ma
quei pannelli si ridisegnano già da soli nella lingua scelta. Al primo
passaggio il motore avrebbe memorizzato come «originale italiano» un testo che
poteva essere già inglese, e il ritorno all'italiano avrebbe riscritto
l'inglese: un difetto visibile solo cambiando lingua due volte. Ora sono
esclusi, con il motivo scritto accanto.

### Verifica

**51 banchi, 0 falliti.** `test_lingue` passa da 20 a **31 controlli**.

---
## [bsi-v183] — 2026-10-03

La sezione Molecola, ripresa dove la v182 l'aveva lasciata: la formazione è
molto più elaborata, e **l'angolo lo scegli tu**.

### L'angolo lo sceglie chi guarda

Un carosello che mostra gli angoli a turno risponde alla domanda sbagliata: chi
studia vuole sapere quanto vale *quell'* angolo, non scorrerli tutti. Ora si
clicca sugli atomi:

| Atomi cliccati | Che cosa mostra |
|---|---|
| **1** | tutti gli angoli che insistono su quell'atomo, insieme, con la geometria e la media |
| **2** | la lunghezza del legame — e se i due atomi *non* sono legati lo dice: una distanza non è un legame |
| **3** | l'angolo A–B–C, con il vertice nel secondo cliccato |
| **4** | l'**angolo diedro** A–B–C–D, con i due piani disegnati e il nome della conformazione |

Il diedro è la novità che conta di più: è il numero che distingue *anti* da
*gauche*, e nessuna formula piana lo contiene. Sull'etanolo, `H–C–C–O 60,7° ·
sin-clinale (gauche)`.

Gli atomi scelti portano un numero d'ordine, il resto della molecola si spegne,
e una riga sotto la tela dice sempre che cosa si sta misurando. Si distingue il
clic dal trascinamento contando i pixel percorsi: senza, ogni rotazione
finirebbe per selezionare un atomo. Il carosello resta come comando a parte,
per chi vuole solo guardare.

Verificato sull'etanolo: C–C **1,509 Å**, C–C–O **111,9°**, H–C–C–O **60,7°**,
e i diedri su quattro conformazioni costruite a mano (0°, 60°, 90°, 180°).

### La formazione, molto più particolare

Non più «atomi che scivolano al loro posto»:

- la **polvere ha un bersaglio**: ogni granello è assegnato a un atomo e gli
  spirala dentro finché viene assorbito — la materia non svanisce, diventa
  l'atomo;
- gli atomi **non arrivano tutti insieme**: prima lo scheletro pesante, poi gli
  idrogeni, perché è l'ordine con cui si legge una struttura. Si vede la catena
  formarsi e poi vestirsi;
- ogni atomo che si posa manda un **anello d'urto**;
- ogni legame, quando i suoi due atomi sono arrivati, si chiude con una
  **scintilla** che lo percorre da un capo all'altro;
- l'arrivo ha un **rimbalzo elastico**: un punto che si ferma di colpo sembra
  disegnato, uno che oltrepassa di poco e torna sembra arrivato.

### Corretto — tre difetti, tutti trovati misurando

- **Il rimbalzo non c'era, e l'ordine non reggeva.** La curva elastica serviva
  sia da posizione sia da avanzamento, e veniva tagliata al primo superamento
  di 1: così il rimbalzo spariva e — peggio — un atomo partito prima poteva
  risultare «meno arrivato» di uno partito dopo, perché quella curva oscilla.
  Trovato dal controllo che pretende lo scheletro davanti agli idrogeni a metà
  formazione. Ora le due grandezze sono separate.
- **Le etichette si pestavano.** Su un carbonio tetraedrico i sei angoli hanno
  i vertici vicinissimi, e uscivano numeri sovrapposti che sembrano un errore
  di calcolo e sono un errore di impaginazione. Ogni etichetta ora tiene
  memoria del rettangolo che occupa, si sposta se il posto è preso e rinuncia a
  scriversi se non c'è spazio: meglio un arco muto che due numeri illeggibili.
- **Le etichette finivano sotto gli atomi**, che si disegnano dopo. Ora si
  accodano e si stampano per ultime.

E un quarto l'ha trovato la tavola di prova, e l'errore era mio e non del
programma: con le coordinate che avevo scelto per il caso «gauche» il diedro
vale 120° e non 60°, perché guardando lungo il legame centrale il vettore
proiettato sta a (−0,5; 0,866).

### Verifica

**51 banchi, 0 falliti.** `test_mol3d` passa da 29 a **46 controlli**.

---
## [bsi-v182] — 2026-10-03

Due funzioni nuove nel menu ✨: **cambiare lingua** all'applicazione, e
**convertire una molecola fra tutti i linguaggi con cui la si può scrivere**,
con la guida che insegna a scriverli.

### 🌍 Lingua — e che cosa resta in italiano

L'applicazione è 48 000 righe di italiano, con i testi scientifici dentro il
codice. Tradurla tutta non è un interruttore: è un lavoro di contenuto, e
prometterlo con un menu a tendina sarebbe una bugia comoda.

Si traduce lo **scheletro** — i 89 pulsanti di navigazione, i 55 titoli di
sezione, le 16 voci del menu ✨ — e il pannello mostra la copertura
**misurata adesso sulla pagina aperta**, non una percentuale scritta a mano:
**160 elementi, 160 tradotti, 0 rimasti**. I contenuti dentro le sezioni
restano in italiano, e il pannello lo dice in prima riga.

Il ritorno all'italiano non è una ri-traduzione al contrario: ogni elemento si
porta via l'originale in `dataset.bsiIt` al primo passaggio, e tornare indietro
riscrive quello. Le chiavi del dizionario sono i testi italiani, scelta
deliberata: se un'etichetta cambia, la sua traduzione non si trova più e
l'elemento **resta in italiano** — visibile, con la copertura che scende. Il
guasto opposto, una traduzione vecchia incollata su un testo nuovo, non si
vedrebbe.

La lingua vale anche per la nomenclatura: `propan-2-olo` / `propan-2-ol`,
`acido butanoico` / `butanoic acid`.

### 🔤 Linguaggi delle molecole

Una molecola si scrive in molti modi. Il pannello converte fra quelli che il
motore sa trattare — **misurati, non supposti**:

| | ingresso | uscita |
|---|---|---|
| SMILES · CXSMILES · SMARTS | ✓ | ✓ |
| molfile V2000 / V3000 | ✓ | ✓ |
| formula · JSON RDKit | | ✓ |
| InChI | **no** | ✓ |
| chiave InChI | **no** | ✓ |

E dichiara i tre «no» con la loro ragione, che non è la stessa:

- **InChI in ingresso** — si genera ma questa build di RDKit non lo rilegge:
  `get_mol(InChI)` torna nullo. È un limite della build.
- **chiave InChI in ingresso** — è un digest di 27 caratteri: dalla chiave non
  si risale alla struttura **per costruzione**, non per limite del programma.
- **SMILES di Kekulé** — misurato: con `kekuleSmiles`, `kekulize` o entrambe
  RDKit torna sempre la forma aromatica. Il *molfile*, però, è già kekulizzato
  — sul benzene gli ordini di legame sono 2,1,2,1,2,1. La riga che mostrava la
  forma aromatica sotto l'etichetta «Kekulé» è stata tolta: un'etichetta che
  dice una cosa falsa è peggio di una riga assente.

Le chiavi InChI prodotte sono state confrontate con quelle di letteratura:
aspirina `BSYNRYMUTXBXSQ-UHFFFAOYSA-N`, caffeina `RYYVLZVUVIJVGH-UHFFFAOYSA-N`,
benzene `UHOVQNZJYSORNB-UHFFFAOYSA-N`. Coincidono. E il molfile **fa il giro
completo**: undici molecole su undici, taxolo con undici centri stereogenici
compreso, tornano al SMILES canonico di partenza.

### Il nominatore IUPAC — nomina solo ciò che può dimostrare

RDKit non genera nomi IUPAC, e non è una mancanza della build: la nomenclatura
non è un calcolo sul grafo ma un corpo di regole con eccezioni. Qui il nome
arriva per tre strade, e la **provenienza è sempre dichiarata**: nominatore
locale, archivio dei nomi comuni dell'app, oppure PubChem con la rete.

Il nominatore locale copre una classe **ristretta e scritta**: molecole
aperte, neutre, di soli C H O N F Cl Br I, con un solo tipo di gruppo
principale fra acido, aldeide, chetone, ammina primaria e alcol, e sostituenti
solo alogeni o catene alchiliche non ramificate. Applica le regole nell'ordine
giusto — catena principale, suffisso, numerazione, prefissi alfabetici — e
omette i locanti quando non distinguono: `cloroetano` e non `1-cloroetano`,
`triclorometano` e non `1,1,1-tricloro…`.

Fuori da quella classe **rifiuta e dice quale condizione è caduta**. Verificato
su 26 nomi scritti a mano in due lingue e 7 molecole che devono essere
rifiutate.

### Corretto — tre difetti miei, trovati misurando

- **Il nominatore accorciava la catena.** Su `CCCC(C(C)C)CCC` —
  4-isopropileptano — la catena di sette veniva scartata perché il sostituente
  è ramificato, e il programma ripiegava su una di sei producendo
  `2-metil-3-propilesano`: un nome che non è quello giusto. Ora la lunghezza
  massima si decide **prima**, fra tutte le catene che portano il gruppo
  principale, e se nessuna di quelle è trattabile si rifiuta invece di
  accorciare.
- **`trim()` distruggeva i molfile.** Un molfile comincia con una riga di
  titolo che può essere vuota: ripulendo il testo in ingresso la riga sparisce,
  tutte le altre salgono di uno e la riga di conteggio finisce al posto
  sbagliato. Trovato dal banco facendo il giro SMILES → molfile → SMILES.
- **Il benzene scambiato per un nome.** Il riconoscitore decideva con
  un'espressione regolare, e `c1ccccc1` è fatto di sole lettere e cifre e
  comincia in minuscolo. Ora la differenza fra SMILES e nome **non si indovina**:
  la decide il motore chimico, che è l'unico che sappia leggere uno SMILES.

Un quarto l'ha trovato la tavola di prova dentro il banco, e l'errore era mio e
non del programma: su `CC(Br)C(Cl)C` i locanti {2,3} si ottengono da entrambi i
capi, e la regola dà il numero più basso al sostituente primo in ordine
alfabetico. Il nome giusto è `2-bromo-3-clorobutano`, come diceva il codice.

### La guida

Quattro schede nel pannello: **Convertitore**, **Nome**, **Guida ai
linguaggi** e **Quale usare**. La guida — 7 400 caratteri, italiano e inglese —
copre come si scrive uno SMILES (atomi, legami, rami, anelli, cariche,
isotopi, stereochimica `@`/`@@` e `/`·`\`), come si costruisce un nome IUPAC
nelle sue quattro mosse, gli strati dell'InChI, i tre blocchi della chiave,
SMARTS come linguaggio di domanda, molfile e SDF, CXSMILES e JSON. Con, per
ciascuno, i tre errori che fanno perdere tempo.

### 🧬 La molecola che si forma — e gli angoli fra i suoi legami

Nella sezione Molecola la struttura compariva già fatta. Ora **arriva**: gli
atomi partono sparpagliati, come polvere sospesa, e convergono al loro posto in
1,6 secondi; i legami si chiudono **dopo**, quando i due atomi che li reggono
sono arrivati, crescendo dai due capi verso il centro. Non è decorazione: è la
differenza fra «ecco un disegno» e «ecco come sta insieme». Un pulsante
↻ rivede la formazione quante volte si vuole.

E mancava la cosa che una formula piana non dice mai: **quanto vale l'angolo**.
Il pulsante *Angoli di legame* li mostra uno per volta — l'arco disegnato fra i
due legami, il valore in gradi, il nome della geometria locale e l'angolo
ideale del modello VSEPR accanto a quello misurato. Sull'etanolo:
`C–C–O 111,9° · tetraedrica · ideale 109,5°`, e si scorre fra tutti e tredici.

**Gli angoli non sono tabulati**: si calcolano con il prodotto scalare sui
vettori di legame, dalle coordinate 3D della struttura caricata. Verificato su
geometrie di cui il valore è noto per costruzione — tetraedro regolare
**109,4712°**, acqua 104,47°, CO₂ 180°, BF₃ 120°, ammoniaca 106,13° — con
tolleranza 0,05°.

E su una struttura **piatta** il pulsante è spento, con la ragione scritta: su
coordinate con z = 0 un angolo di legame non è un angolo di legame, e mostrarlo
sarebbe l'errore peggiore dei due, perché somiglia a un dato.

Il modulo sostituisce `render3DOnCanvas` mantenendone il contratto — stessa
firma, stesso `{stop}` — e conserva l'originale raggiungibile: le altre sezioni
che lo usano non se ne accorgono. La barra dei comandi è fatta di pulsanti
veri, con il loro nome accessibile, non di rettangoli disegnati sulla tela.

### Corretto — due difetti nei banchi, non nel codice

- **`audit_storia` segnalava una chiave privata: la propria.** La prima stesura
  scriveva per intero l'esempio di chiave privata PEM (`-----BEGIN …`), che finiva
  nel repository come qualunque altra riga; alla prima esecuzione dopo il
  commit il banco lo trovava nella storia. Uno scanner che inciampa nelle
  proprie definizioni rende «contaminato» ogni repository che lo contenga, e il
  difetto si traveste da ritrovamento. Ora l'esempio si **compone** invece di
  scriverlo, e il blob vecchio — che resta nella storia, perché la storia non
  si riscrive — è un'**eccezione dichiarata** con il suo motivo, mostrata a ogni
  esecuzione. Un ritrovamento spiegato non si fa sparire allargando lo schema.

  Lo stesso inciampo si è ripetuto un piano più su: raccontandolo qui avevo
  scritto per intero la stessa stringa, e `verifica-sicurezza` l'ha trovata nel
  CHANGELOG. Anche questa riga, ora, è troncata.
- **`test_mol3d` passava su un insieme vuoto.** Leggeva la barra dei comandi
  dopo aver fermato il ciclo, che la rimuove: trovava zero pulsanti e poi
  dichiarava «ognuno ha un nome accessibile». Un controllo che passa perché non
  ha niente da guardare è il difetto che questo progetto insegue da sempre.

### Aggiunto

- Nuovi banchi **`test_lingue`** (20 controlli) e **`test_mol3d`** (29) —
  batteria da 49 a **51**.
- Requisiti **UI-10**, **UI-11**, **SCI-22** e **SCI-23** nella matrice.
- Quattro file nuovi: `bsi-lingue.js`, `bsi-molingue.js`,
  `bsi-pannelli-lingua.js` e `bsi-mol3d.js`, tutti nella cache del Service
  Worker: le funzioni nuove lavorano offline come il resto.

### Verifica

**51 banchi, 0 falliti.**

---
## [bsi-v181] — 2026-10-02

> **Avviso sul tag di questa versione.** Il 7 ottobre 2026 il workflow di
> pubblicazione è stato avviato senza compilare il campo della versione, e ha
> usato il proprio valore predefinito — che era `bsi-v181`. Essendo
> rieseguibile per progetto, ha **spostato il tag `bsi-v181`** dal commit
> originario `cb0cf03` al commit della `bsi-v187`, e le ha allegato i tre
> pacchetti della v187 accanto ai suoi. I pacchetti estranei sono stati
> rimossi.
>
> **Il tag non è stato possibile riportarlo indietro.** GitHub non permette a
> un'app di scrivere un ref che punti a un commit il cui
> `.github/workflows/*` differisce da quello corrente, e a `cb0cf03` quel file
> differisce di 319 righe. Sono state provate tre strade, tutte dalla stessa
> regola:
>
> | strada | esito |
> |---|---|
> | `git push --force origin refs/tags/bsi-v181` | «refusing to allow a GitHub App to create or update workflow `.github/workflows/release.yml` without `workflows` permission» |
> | `PATCH /git/refs/tags/bsi-v181` con `force` | 403 «Resource not accessible by integration» |
> | cancella e ricrea (`DELETE` + `POST /git/refs`) | 403 anche sulla **creazione** di un tag di prova sullo stesso commit, perciò il tag vero non è stato toccato |
>
> `GITHUB_TOKEN` non può ottenere il permesso `workflows`, e aggirare la regola
> rinominando i file di workflow sarebbe circonvenire una protezione, non
> ripararla.
>
> **Che cosa vale, allora, di questa release:**
>
> - i **tre pacchetti allegati** sono quelli della `bsi-v181`, corretti;
> - l'archivio «*Source code (zip)*» che GitHub genera dal tag contiene
>   invece il codice della `bsi-v187`, e va **ignorato**;
> - il codice della `bsi-v181` si scarica dal suo commit:
>   <https://github.com/samupropio1-ship-it/BioSpecInfo-v11/archive/cb0cf03e52f15d5f57c28626c75adc817d726788.zip>
>
> Il tag si rimette a posto con le credenziali di una persona, non di un'app:
>
> ```
> git push --force origin cb0cf03e52f15d5f57c28626c75adc817d726788:refs/tags/bsi-v181
> ```
>
> Perché non ricapiti: il valore predefinito è stato togliato dal workflow, e la
> versione da pubblicare deve ora coincidere con quella dichiarata da `sw.js`
> **e** con il nome dei pacchetti — altrimenti il workflow si ferma. Provato
> nei due versi: passa con `bsi-v187`, rifiuta con `bsi-v181`.

## [bsi-v180] — 2026-10-02

Due blocchi: la **fluidità** di tutta l'applicazione, misurata e corretta, e la
banca dati farmacologica che passa da **178 a 233 voci**.

### Fluidità — la causa non era il JavaScript

Misurato il cambio di sezione su tutte e 88: mediano 15 ms, ma cinque sezioni
oltre i 50 ms in riapertura e due oltre il secondo e mezzo alla prima apertura.

Scomposto il gestore del clic, la causa non era quella che sembrava: il ciclo
su tutte le sezioni costa **2 ms**, rendere visibile la sezione **0 ms**, e
tutto il tempo è il browser che **impagina** il DOM appena mostrato — 251 ms
per le sintesi, che sono 13 482 nodi di cui l'utente vede una schermata.

`content-visibility:auto` sulle carte, con `contain-intrinsic-size:auto` perché
la barra di scorrimento non salti:

| | riapertura | prima apertura |
|---|---|---|
| `ssyn` | 281 → **54 ms** | 1 272 → **199 ms** |
| `sretro` | 112 → **40 ms** | 180 → 70 ms |
| `sfarm` | 89 → **4 ms** | 293 → 141 ms |
| Sezioni oltre 50 ms | 5 → **1** | |
| Compito più lungo | | 1 374 → **651 ms** |

### Corretto — il prezzo nascosto di quella velocità

Gli elementi esaminati dal banco di accessibilità sono **scesi da 20 326 a
20 031**: uno per carta, perché un elemento di cui il browser non calcola il
layout ha rettangolo nullo e l'ispezione lo salta. Il banco continuava a dire
«contrasto 0» — **su meno superficie**, che è lo stesso difetto già incontrato
col 100 % di copertura e col contrasto dei pannelli nascosti.

Due correzioni: il banco ora **scorre** ogni sezione (20 338 elementi, più di
prima), e il riferimento registra `elementiEsaminati` con la **guardia
opposta** — fallisce se la copertura scende oltre l'1 %. Provata alzando il
riferimento: «COPERTURA SCESA: un "0 difetti" misurato su meno superficie non
è un "0 difetti"».

### Corretto — il modello si riaddestrava per OGNI predizione

`scegliIperparametro` prendeva una funzione che predice una query e la chiamava
dentro `prova.map(...)`: per la regressione kernel costruiva la matrice e
risolveva il sistema una volta per **ogni molecola da predire**. Oltre duemila
addestramenti dove ne servivano sessanta.

| Molecole | Prima | Dopo |
|---|---|---|
| 50 | 214 ms | 104 ms |
| 150 | 3 030 ms | **369 ms** |
| 200 | 7 279 ms | **535 ms** |

A risultati **identici byte per byte**. Il guardiano conta gli addestramenti
invece di cronometrare: dodici per 240 predizioni, e non dipende da quante
molecole ci sono.

### Farmaci — da 178 a 233, ogni struttura da ChEMBL

Cinquantacinque voci nuove sui buchi veri: inibitori di tirosin-chinasi,
antiretrovirali moderni, nirmatrelvir, sartani e antitrombotici, antiepilettici
di nuova generazione, carbapenemici, daptomicina, incretine, e la parte
respiratoria, reumatologica e urologica che mancava.

**Nessuno SMILES e nessun peso scritto a memoria**: la struttura viene dal
record ChEMBL e il peso è quello che ChEMBL dichiara. Un controllo ha
verificato che RDKit legga ogni struttura e che la **formula molecolare**
ricostruita dal grafo coincida con quella dichiarata — **55 su 55**.

Serviva una fonte esterna: lo SMILES sbagliato dell'omeprazolo era
*autoconsistente*, e un peso coerente con una struttura sbagliata passa
qualunque controllo interno. Intercettata anche una sostituzione silenziosa —
cercando «formoterol» ChEMBL restituisce l'**arformoterolo**, il solo
enantiomero (R,R) — registrata col nome giusto.

### Corretto — 115 farmaci su 233 erano invisibili

Cercando se le voci nuove comparissero è emerso un difetto che c'era già:

```js
var cats = cat==="all" ? Object.keys(catName) : [cat];
```

Le categorie da disegnare venivano dalla mappa delle **etichette**, non dai
dati: 47 categorie nei dati, 19 etichettate, e i farmaci delle altre 28 non
venivano **mai** disegnati. **115 voci su 233 invisibili — e 60 su 178 anche
prima di queste aggiunte.** L'applicazione ne teneva in memoria centinaia e ne
mostrava una parte.

Scritte le etichette per tutte e 47 le categorie, e `cats` ricavato dai dati.
I nodi della sezione passano da 4 038 a 7 805 — quasi il doppio — e la
riapertura resta a **4 ms**, perché il contenimento del layout fatto nello
stesso giro rende sostenibile mostrare il doppio del contenuto.

### Il 45° banco — `test_farm_ui`, riscritto

Un file con quel nome esisteva già: stampava sei numeri, non verificava niente
e **non era registrato nella batteria**. Mentre taceva, la sezione mostrava 118
farmaci su 233.

Ora pretende che **ogni** farmaco in memoria compaia nella lista disegnata, che
il filtro mostri le voci della categoria e nessun'altra, e che nessuna scheda
mostri un peso rotto. Il controllo che conta è l'ultimo: il banco **inserisce**
un farmaco con una categoria mai etichettata e pretende che venga disegnato,
poi lo rimuove senza lasciare tracce. Un controllo sui farmaci esistenti non
l'avrebbe scoperto, perché con le etichette a posto anche la riga difettosa
disegna tutto — verificato nei due versi.

Batteria: **45 banchi, 0 falliti**.

---

## [bsi-v179] — 2026-10-02

Caccia ai problemi prima di pubblicare su `main`, sui percorsi meno battuti.
Il più sospetto era il **caso classificazione**: implementato nel motore, ma
l'interfaccia era sempre stata provata su dati di regressione. Due difetti veri.

### Corretto — un intervallo di predizione che mentiva con sicurezza

Su un'attività **binaria** (0/1) gli intervalli conformi costruivano una
regressione sui valori binari e restituivano, misurato:

```
0,122  [−0,017,  0,261]
```

Un limite inferiore **negativo** per una grandezza che vale 0 oppure 1,
mostrato dal pannello con la stessa sicurezza di un valore buono. La predizione
conforme per la classificazione esiste, ma non è un intervallo: è un **insieme**
di etichette possibili, e si costruisce in un altro modo.

Finché non c'è, la risposta onesta è **rifiutare**: ora la funzione si ferma,
spiega che l'attività è binaria, e indica quale strumento usare al suo posto
(le metriche di arricchimento). Chi sa quel che fa può forzarla con
`forzaRegressione: true`.

### Corretto — la curva di apprendimento riportava un R² su etichette 0/1

Usava `metricheRegressione` senza guardare il tipo di problema. Ora su attività
binaria usa **ROC-AUC**, e in ogni caso **dichiara quale metrica** sta
mostrando: un punto «0,82» senza il nome della metrica non si può confrontare
con niente.

### Aggiunto — l'arricchimento aveva una capacità e nessuna porta

`arricchimento()` esisteva nel motore ed era verificato dal banco, ma
**nessun pannello lo raggiungeva**: una capacità che nessuno può usare è come
se non ci fosse. Ora c'è il pulsante, e il pannello mostra EF a 1, 5, 10 e 25 %
con l'**EF massimo possibile** accanto, più ROC-AUC e BEDROC.

Due scelte dichiarate nel pannello:

- l'ordinamento viene dalle predizioni **fuori piega** del modello migliore.
  Ordinare con le predizioni di un modello che ha già visto la molecola darebbe
  un arricchimento finto;
- con attività **continua** non esistono «attivi»: il quarto superiore viene
  preso come tale e **la soglia è scritta**, perché l'arricchimento cambia con
  essa.

### Verificato — quattordici pagine, nessun problema

Prima di unire su `main`: tutte le pagine dell'applicazione aperte e misurate.
**Zero errori JavaScript, zero risposte 4xx, zero identificatori duplicati.**

Banco a **189 controlli**. Batteria: 44 banchi, 0 falliti.

---

## [bsi-v178] — 2026-10-02

La chemioinformatica passa da **prototipo verificato** a **strumento di
lavoro**. Il motore cresce da 1 450 a oltre 2 450 righe, il banco da 106 a
**181 controlli**, e ogni capacità nuova è verificata contro valori calcolabili
a mano — come negli spettri.

### Sondata la libreria prima di progettare

MinimalLib 2025.03.4 è stata interrogata all'esecuzione, non assunta. Tre
capacità esistevano e non erano usate: **`SubstructLibrary`** (screening vero
con pattern fingerprint), **`get_rxn`/`Reaction`** (trasformazioni, cioè la
possibilità di tagliare un legame), **`generate_aligned_coords`**. Non ci sono
`cleanup`, `neutralize`, `canonical_tautomer`, `FragmentOnBonds`, né la
sottostruttura massima comune: dichiarato in `docs/06` §3-quater.1 con le
conseguenze.

### Aggiunto — frammentazione, con due regole

Una reazione SMARTS spezza un legame marcando i capi con un atomo fittizio.
Regola **fine** (predefinita, comprende i sostituenti terminali Cl, CH₃, OH) e
**grossa** in stile BRICS. Verificato: l'etossibenzene dà tre tagli con la
fine e due con la grossa, benzene e metano nessuno.

### Aggiunto — coppie molecolari corrispondenti

L'analisi con cui si legge una serie chimica: due molecole che differiscono per
**una cosa sola**, e la differenza di attività attribuita a quella. Verificata
su una serie costruita con effetti noti, che ritrova tutti:

| Trasformazione | Attesa | Trovata |
|---|---:|---:|
| clorofenile → fenile | −1,0 | **−1,0** su 2 coppie concordanti |
| metilfenile → fenile | −0,5 | **−0,5** |
| metile → cloro | +0,5 | **+0,5** |
| etilammide → propilammide | +0,2 | **+0,2** su 3 |

Sui 28 inibitori ChEMBL: 449 coppie, 98 trasformazioni solide, 133 ms; in cima
**CF₃ → SO₂NH₂ con Δ mediano −2,65**. La colonna «concordi» è quella che decide
se fidarsi, e le trasformazioni viste una volta sola sono contate a parte: non
sono scoperte, sono aneddoti.

### Aggiunto — ricerca per sottostruttura e tabella SAR

Ricerca con `SubstructLibrary`, query SMARTS o SMILES, conteggio delle
occorrenze. Una query malformata viene **dichiarata**, non ignorata.

La tabella SAR risolve il problema difficile — **in quale posizione** sta ogni
sostituente — sfruttando il fatto che il frammento col nucleo porta l'atomo
fittizio nel punto di attacco. Sui dati veri: 20 molecole col nucleo
benzamidico, 2 posizioni, 8 escluse. Le escluse non compaiono: mostrarle con
celle vuote le farebbe sembrare parte della serie.

### Aggiunto — il rigore che un valutatore pretende

Confronto fra modelli sulle **stesse pieghe** col riferimento banale in cima;
iperparametri per **validazione annidata**; **intervalli conformi**
(split-conformal, quantile ⌈(n+1)(1−α)⌉); **EF e BEDROC** per lo screening;
**curva di apprendimento**.

Il verdetto del confronto è provato **nei due versi**: su segnale vero margine
1,002 contro dispersione 0,676 → supera; sulle stesse molecole con etichette
casuali → non supera.

L'arricchimento è verificato sui tre casi calcolabili a mano: perfetto (AUC 1,
EF@20 % = 5 che è il massimo, BEDROC 1), pessimo (tutto 0, e **BEDROC zero e
non un negativo**), attivi ai ranghi 2 e 5 (AUC 12/16 = 0,75, EF 2,5).

### Aggiunto — esportazione SDF

Strutture con coordinate 2D generate, nome nella prima riga, campi dati.
Verificata col **round-trip**: il blocco prodotto si rilegge e dà lo stesso
SMILES canonico.

### Corretto — due difetti miei, trovati misurando

Il taglio escludeva gli atomi terminali, e la tabella SAR **perdeva il cloro
sull'anello**: trovava il sostituente sull'azoto e mancava la colonna che
interessa. Da lì nasce la regola fine.

`scaffoldMurcko().smiles` **non è uno SMILES**: è una chiave canonica di
raggruppamento, e il commento del codice lo diceva. Il pannello SAR la
proponeva come nucleo e la decomposizione rispondeva «nucleo non
interpretabile». Il campo si chiama ora `chiave` e dichiara
`eUnoSmiles: false`; il banco fissa che serva a raggruppare e **non si rilegga
come SMILES**. Il pannello non propone più niente: offre otto nuclei pronti e
il campo libero, perché una proposta sbagliata è peggio di nessuna proposta.

### Interfaccia e misure

Tre schede nuove: Ricerca, Tabella SAR, Coppie corrispondenti. Il contrasto dei
pannelli è ora misurato su **nove** invece di sei — **593 elementi di testo,
0 difetti** — e il banco pretende che siano tutti e nove ad aprirsi.

---

## [bsi-v177] — 2026-10-02

### Recuperato — le 12 domande del quiz, senza rimettere uno script

Sostituendo la guida di biochimica si era perso un quiz interattivo di 12
domande, che viveva in uno script della versione precedente. Rimetterlo com'era
avrebbe disfatto la ragione per cui la sostituzione valeva la pena: il documento
nuovo non ha **nessuno** script, e da lì viene la stabilità.

Le domande sono state riscritte come HTML statico: le quattro opzioni in chiaro,
la soluzione dentro un `<details>` nativo che si apre con un clic. **Zero righe
di JavaScript**, e il documento resta a 0 script.

### Corretto — una mia affermazione che era falsa

La prima versione della sezione diceva che la soluzione «resta chiusa sullo
schermo e **aperta in stampa**». Verificandolo con l'emulazione del mezzo di
stampa, era falso: Chromium non rende il contenuto di un `<details>` chiuso, e
il CSS non può forzarlo — `display:block!important` dentro `@media print` non
ha alcun effetto. Una copia cartacea avrebbe perso tutte e dodici le soluzioni,
mentre il testo accanto prometteva il contrario.

Risolto con due copie della soluzione, ciascuna visibile in **un solo mezzo**:
quella dentro il `<details>` per lo schermo, una dedicata per la stampa, con il
`<details>` nascosto in stampa e la copia dedicata nascosta sullo schermo.

Misurato nei due mezzi:

| | Domande | Opzioni | Soluzioni visibili |
|---|---:|---:|---:|
| Schermo (chiuso) | 12 | 48 | **0** |
| Schermo, dopo un clic | 12 | 48 | **1** |
| Stampa | 12 | 48 | **12** |

> **Perché vale la pena raccontarlo.** L'affermazione sbagliata non era nel
> codice: era nella frase che descriveva il codice, e nessun banco la
> controllava. L'ho trovata solo perché ho verificato una cosa che avevo
> appena scritto io, invece di fidarmene.

### Misure sulla guida, dopo l'aggiunta

Contrasto **0** su 2 056 elementi di testo (erano 1 897), testo alternativo
**98 su 98**, nessuno scorrimento orizzontale a 390, 360 e 320 px, **0** script,
**0** errori all'avvio.

---

## [bsi-v176] — 2026-10-01

### Sostituita — la guida di biochimica

Il documento passa da **1 MB a 8,2 MB** e cambia natura: da una pagina con un
capitolo e 34 sottosezioni a **12 capitoli più l'indice**, 78 sottosezioni e
**98 figure incorporate**, compresi due capitoli nuovi — «Guida all'orale» e
«Domande d'esame reali e risposte corrette».

Il file arriva **senza un solo script** e senza una sola richiesta di rete: non
può generare errori JavaScript, e non ha bisogno della guardia su
`localStorage` che serviva alla versione precedente (un accesso in modalità
privata lanciava `SecurityError` e interrompeva l'intero script della pagina).
È da lì che viene la stabilità in più.

Nome del file invariato, `Biochimica_Guida_Definitiva.html`: lo citano `sw.js`,
`index.html` e quattro banchi, e cambiarlo avrebbe significato toccare sei
punti senza guadagnare niente.

**Cosa si perde, dichiarato:** la guida precedente conteneva un quiz
interattivo di **12 domande**, e il documento nuovo non ne ha. Il capitolo
«Domande d'esame reali e risposte corrette» copre lo stesso bisogno in forma di
testo, e l'app ha il proprio apparato di quiz altrove.

### Corretto — 98 figure senza testo alternativo

Il banco di accessibilità ha bocciato la sostituzione: **98 immagini prive di
`alt`**. La via comoda era `alt=""`, che il banco accetta — il commento nel
codice dice, giustamente, che per un'immagine *decorativa* è la cosa corretta.
Ma queste sono figure di biochimica: marcarle come decorative avrebbe fatto
passare il controllo dicendo agli screen reader di saltare 98 diagrammi. Un
verde vuoto.

Ogni immagine sta dentro un `<figure>` con la sua `<figcaption>`, e le
didascalie le ha scritte l'autore. Da lì viene il testo alternativo, senza
inventare niente: 62 figure, di cui 36 contengono due pannelli. **Trentatré
delle 36 didascalie di coppia distinguono i pannelli** con «a sinistra» e «a
destra», e sono state divise per dare a ciascuna immagine la propria
descrizione; le 3 che non si dividono in modo inequivocabile condividono la
didascalia intera — verboso, ma non può essere sbagliato.

Risultato misurato: **98 su 98 con `alt`, nessuno vuoto**, contrasto che resta
a **0** su 1 897 elementi di testo.

### Corretto — la copertina faceva scorrere la pagina sul telefono

A 390 px — la larghezza che il progetto dichiara come requisito — il documento
era pulito. A **360 px**, larghezza comunissima, la pagina scorreva in
orizzontale, mentre la guida precedente no: una regressione introdotta dalla
sostituzione.

Il sospetto erano le tabelle a quattro colonne, che chiedono 416 px. Sbagliato:
l'autore aveva già messo `table.t{display:block;overflow-x:auto}`, e le tabelle
contenevano il proprio scorrimento. Nascondendo i figli del corpo uno a uno, il
colpevole è risultato il **titolo di copertina**: «Biochimica» a 46 pt è una
parola sola, non può andare a capo, e misura circa 390 px.

Reso fluido con `clamp(26pt,12vw,46pt)` **dentro `@media screen`**, così in
stampa il formato A4 resta quello voluto. Verificato: nessuno scorrimento
orizzontale a 390, 360 e 320 px.

### Copertura di codice: 49,89 %

Il riferimento portava `Biochimica_Guida_Definitiva.html: 81,24 %`, misura di
un file che ora non ha più codice da eseguire. Rigenerato: la voce è sparita e
la complessiva è **49,89 %**, in linea con la precedente. Un riferimento che
dichiara una percentuale per un file senza script afferma qualcosa che non si
può più verificare.

---

## [bsi-v175] — 2026-09-30

Il banco di lavoro chemioinformatico diventa uno strumento da cui i risultati
escono, e con loro il metodo che li ha prodotti.

### Aggiunto — validazione incrociata raggruppata per scheletro

Una divisione sola, su un insieme piccolo, è un numero rumoroso: su 28 molecole
al 25 % l'insieme di prova ne contiene sette, e spostarne una muove l'R² di
decimi. Ora si può chiedere una validazione a 3, 5 o 10 pieghe, e le pieghe
raggruppano **per scheletro**: nessuno scheletro sta in due pieghe, perché un
analogo della stessa serie in addestramento e in prova falsa la piega
esattamente come falsava la divisione singola.

Il risultato che ne esce è la ragione per cui vale la pena averla. Sui 28
inibitori dell'esempio:

| | |
|---|---|
| Divisione singola | R² **0,861** |
| Cinque pieghe | **0,605 ± 0,452** — le singole: 0,861 · 0,538 · 0,795 · **−0,150** · 0,980 |

La divisione singola aveva pescato la piega fortunata. Il pannello ora mostra
entrambe le cifre e dice, a parole, se distano più di una deviazione: quando
succede, il modello dipende sensibilmente da quali molecole gli capitano in
addestramento.

### Aggiunto — i risultati si portano via

Un banco di lavoro da cui i risultati non possono uscire è una dimostrazione,
non uno strumento. Due esportazioni:

- **tabella CSV** — nome, SMILES canonico e originale, attività, scheletro,
  nove descrittori, QED, violazioni di Lipinski, esito di Veber, allarmi. Con
  la validazione incrociata attiva si aggiungono *previsto* e *residuo*, e
  **solo allora**: è l'unico schema che dia a ogni molecola una predizione da
  un modello che non l'aveva vista;
- **rapporto di metodo (.md)** — versione di RDKit, fingerprint, tipo di
  divisione, molecole e scheletri, **il seme**, le metriche, il verdetto del
  controllo nullo, le pieghe una per una, i limiti dichiarati.

Entrambi si formano in memoria nel browser: non c'è nessuna richiesta di rete,
ed è la ragione per cui la nota accanto ai pulsanti può dire che nessun dato
esce dal dispositivo senza chiedere di crederci sulla parola.

### Corretto — un «contrasto 0» che non copriva la superficie nuova

`verifica-accessibilita` misura ciò che è **visibile**, e i sei pannelli della
sezione Chemioinformatica restano `display:none` finché l'analisi non è stata
eseguita: quel banco non li aveva mai visti, e il suo zero non parlava di loro.
Un numero perfetto che non copre la superficie nuova è esattamente il caso già
incontrato una volta in questo progetto.

Ora `test_cheminfo` esegue l'analisi per davvero, apre i sei pannelli a turno e
misura il contrasto WCAG su ogni testo che vi compare: **460 elementi, 0
difetti**. Le formule sono riscritte dentro il banco e non prese
dall'applicazione — chiedere al codice sotto esame quanto vale il proprio
contrasto non è misurare. E il banco pretende di averne misurati più di 250: se
i pannelli non si aprissero, lo zero sarebbe vuoto e il controllo fallirebbe.

Una nota della barra di esportazione era `#64798f` su `#101f33`, cioè 3,69:1.
Il correttore di contrasto dell'app l'aveva già alzata da sé a `#74889e`
(4,54:1) — era il correttore che funziona. È stata comunque riscritta
conforme all'origine, così resta leggibile anche se un giorno il correttore non
passasse di lì.

### Corretto — una similarità che non era similarità

Il pannello «Pharma Pro» di `rdkit_lab.html` confrontava la molecola con otto
farmaci di riferimento e mostrava una percentuale con la barra. Quella
percentuale non veniva da un fingerprint: veniva da **otto bit di descrittori a
soglia** — «ha anelli aromatici», «HBA > 4», «peso fra 200 e 500» — di cui si
calcolava il Tanimoto.

Misurato, non supposto:

| Coppia | A otto bit | Su Morgan vero |
|---|---:|---:|
| Caffeina · Metformina | **0,75** | **0,024** |
| Paracetamolo · Amoxicillina | 0,60 | 0,218 |
| Paracetamolo · Aspirina | 0,50 | 0,222 |

Caffeina e metformina non hanno frammenti in comune, e il pannello le mostrava
al 75 % — su una pagina che si chiama «RDKit Lab», con RDKit già caricato e in
grado di calcolare il fingerprint vero.

Accanto a quello, due difetti dello stesso genere:

- tre delle otto impronte di riferimento erano **scritte a mano** e avevano il
  bit «aromatico» sbagliato: caffeina (due anelli aromatici) segnata 0,
  morfina e amoxicillina (uno ciascuna) segnate 0;
- lo **SMILES dell'omeprazolo non era omeprazolo**: `COc1ccc2[nH]c(=S)cc2c1OC`
  è una struttura che RDKit rifiuta, e stava in un elenco di farmaci di
  riferimento.

Corretto tutto. Il confronto usa il fingerprint di Morgan; le impronte si
calcolano invece di essere battute a tastiera; l'omeprazolo è l'omeprazolo
(massa monoisotopica 345,11, tre anelli aromatici, entrambe verificate). Le due
funzioni della similarità finta sono state **rimosse**, non scavalcate —
lasciarle in giro le avrebbe rimesse in uso alla prima modifica — e il banco
controlla che non esistano più.

### Corretto — due Tanimoto dove ne bastava uno

Il laboratorio aveva la sua copia di Tanimoto. Concordava con quella del motore
sui casi normali — verificato: scarto **esattamente 0** su tutte e 28 le coppie
di riferimento — ma sul caso di due impronte vuote rispondeva 0 dove il motore
risponde 1. Due implementazioni che nessuno confronta prima o poi divergono sul
serio.

Ora `rdkit_lab.html` carica `bsi-cheminfo.js` e chiama quello. Dove il motore
non fosse disponibile la funzione restituisce **null**, non zero: uno zero
verrebbe mostrato come «0 % — strutturalmente distinte», che è
un'affermazione sbagliata detta con sicurezza.

### Corretto — la copertura di codice puniva il codice nuovo invece di misurarlo

Caricare `bsi-cheminfo.js` anche sul laboratorio ha fatto **scendere** la
copertura complessiva da 49,79 % a 49,26 %, e il banco l'ha bloccato — la
guardia che funziona. Ma la causa non era codice morto: era che il percorso
della copertura apriva la sezione Chemioinformatica **senza mai premere
«Analizza»**, e il motore parte solo allora. Centoventisette kilobyte contati
come non eseguiti, cioè una misura che puniva l'aggiunta di codice verificato
altrove.

Ora il percorso carica l'esempio, preme, apre i sei pannelli e addestra il
modello con tre pieghe: è quello che fa un utente. `bsi-cheminfo.js` passa dal
**26,64 % al 49,89 %** di istruzioni eseguite, e la complessiva risale a
**49,81 %**. Il riferimento è stato stretto a quel valore: una guardia che non
si stringe mai scende da sola col tempo.

### Il banco passa da 59 a 106 controlli

Oltre a quanto sopra: la massa monoisotopica di ogni farmaco di riferimento —
è il modo di accorgersi che sotto il nome giusto c'è la molecola sbagliata, un
nome non si può confrontare con niente e una massa sì — media e deviazione
campionaria verificate su
`[2,4,4,4,5,5,7,9]` — media 5, deviazione √(32/7) — le colonne del CSV contate
una per una, un nome con la virgola che deve risultare citato, e la metrica
scritta `R²` e non `R2`, perché «R2» è il nome di una variabile, non di una
metrica.

---

## [bsi-v174] — 2026-09-25

Una sezione nuova: **Chemioinformatica**. Non un laboratorio dimostrativo — ce
n'era già uno, e usava RDKit in superficie — ma il banco di lavoro che serve
per dire qualcosa di difendibile su un insieme di molecole.


### Aggiunto — `bsi-cheminfo.js`, il motore

Un modulo autonomo, esposto come `window.BSIChem`, che copre il percorso
intero: standardizzazione (frammento maggiore, SMILES canonico, deduplicazione
sul canonico), 43 descrittori RDKit, regola dei 5 e filtro di Veber, **QED
ricalcolato** perché MinimalLib non lo espone, impronte Morgan/RDKit/pattern/
MACCS, Tanimoto e Dice, raggruppamento di **Butina**, selezione **MaxMin**,
scheletri di **Bemis–Murcko**, PCA con i carichi, **regressione kernel** e
logistica, **salti di attività** per SALI, allarmi **PAINS** e **Brenk**,
dominio di applicabilità.

L'algebra è scritta qui dentro — Jacobi per gli autovalori, eliminazione
gaussiana per il sistema — perché una dipendenza in più per due funzioni non
vale il peso, e perché un banco può verificare entrambe contro valori
calcolabili a mano.

### Aggiunto — la sezione, sei pannelli

Descrittori · Similarità e gruppi · Spazio chimico · Modello QSAR · Salti di
attività · Allarmi strutturali. Due insiemi di esempio già pronti (28
inibitori con pIC₅₀, 40 farmaci presi dalla banca dati dell'app).

### Le tre precauzioni che distinguono una misura da un numero

- **Divisione per scheletro.** L'insieme di prova contiene soltanto scheletri
  mai visti in addestramento. La divisione casuale mette analoghi stretti da
  entrambe le parti: il modello riconosce invece di predire.
- **Modello nullo per rimescolamento.** Lo stesso modello viene riaddestrato
  otto volte su etichette mescolate, e il pannello **dichiara a parole** se il
  punteggio vero ha battuto tutti i sosia e di quanto. Sui 28 inibitori:
  R² 0,861 contro un massimo di 0,574, margine 0,287.
- **Dominio di applicabilità.** La distanza dal vicino più prossimo
  nell'insieme di addestramento, accanto a ogni valore predetto.

### Aggiunto — il 44° banco

`test_cheminfo`, 59 controlli contro valori calcolabili a mano. Verifica il
modello nullo **nei due versi**: su un segnale apprendibile R² 0,394 batte
tutti e otto i sosia; su etichette casuali R² −0,199 **non** li batte. Un
controllo che verificasse solo il primo caso passerebbe anche con la guardia
cablata su «vero». Il banco pretende inoltre di aver eseguito almeno 45
controlli: una suite saltata in silenzio fallisce.

### Corretto — RDKit non si caricava nella sezione nuova

Il modulo cercava `window.RDKit`, ma l'applicazione principale mette l'istanza
in `window.__rdkit` — è il suo caricatore `bsiLoadRDKit` a deciderlo. Su una
pagina dove RDKit era già pronto, la sezione diceva «RDKit si sta caricando»
per sempre. Ora si guardano tutti e tre i nomi in uso.

### Corretto — un banco incostante, che è il modo peggiore di fallire

`test_nucleo` passava lanciato da solo e falliva dentro la batteria. Il motivo:
Emscripten compila il `.wasm` di RDKit in streaming e, se il corpo della
risposta viene troncato — succede quando la batteria fa girare più browser
insieme sullo stesso server locale — scrive due righe in console e **ricade**
sull'istanziazione da `ArrayBuffer`, che riesce. Il banco contava quelle due
righe come errori JavaScript.

Un banco che dipende dal carico della macchina insegna a rilanciarlo finché non
diventa verde, e da quel momento non misura più niente. Le due righe della
ricaduta sono ora escluse — solo quelle, in dieci banchi che guardano la
console — e se la ricaduta stessa fallisse l'errore che ne segue non
corrisponde al filtro e resta contato.

### Verificato — i due zeri non si sono rotti

La sezione nuova è stata rimisurata con gli stessi banchi: contrasto WCAG AA
**0 difetti** su 88 sezioni, traboccamento orizzontale a 390 px **0 sezioni**,
campi privi di etichetta **0**, errori JavaScript **0**.

### Documentazione

Tracciabilità: quattro requisiti nuovi (SCI-14…17), totale dichiarato da 44 a
48, automatizzati da 39 a 43. `docs/06` §3-bis elenca i riferimenti
bibliografici di ogni metodo e i limiti dichiarati. `docs/13` §3.2-quater
descrive i sei pannelli. `docs/15` registra il banco. Tutto in italiano e in
inglese.

Batteria: **44 banchi, 0 falliti**.

---

## [bsi-v173] — 2026-09-23

Chiuse le ultime due difformità che restavano aperte per scelta o per lavoro:
**D-04** (password nella cronologia) e **D-08** (traduzione inglese parziale).

### Sicurezza — la password del File Manager è stata cambiata

La difformità **D-04** diceva: la password precedente è rimasta in chiaro nella
cronologia git, da prima che venisse tolta dal sorgente. Toglierla dai file non
la toglie dalla storia — `git log -p` la restituisce a chiunque — e finché
quella password è in uso il deterrente non deterre nessuno. L'unico rimedio
effettivo è **cambiarla**.

Cambiata. Nel sorgente c'è soltanto la nuova impronta SHA-256, mai la password;
verificato nel browser che la nuova apra e la vecchia no. Quella vecchia resta
leggibile nella cronologia e ora non apre più niente.

> Resta vero ciò che il documento ha sempre detto: su un sito statico questa è
> **una serratura contro chi passa, non contro chi vuole entrare davvero**. Chi
> conosce l'impronta può provarla offline quanto vuole. Non va usato per
> materiale riservato.

### Documentazione — l'inglese passa da 10 a **16 documenti su 16**

La difformità **D-08** dichiarava che un valutatore non italofono leggeva meno
di due terzi della documentazione. La parte mancante era proprio quella
operativa: chi deve capire *come funziona* e *come si manda in produzione*
restava fuori.

Tradotti gli ultimi sei: `06-Scientific-Accuracy-Data-Provenance`,
`10-API-Reference`, `11-Data-Model`, `12-Deploy-Guide`,
`13-Functional-Specifications`, `14-User-Manual`.

Tre scelte di traduzione, dichiarate perché sono decisioni e non sviste:

- **I nomi nel codice restano in italiano.** Il diagramma delle entità di
  `docs/11`, le variabili del proxy (`ORIGINI`, `LIMITE_IP`) e le chiavi di
  `localStorage` sono quello che sono nel codice: tradurle documenterebbe un
  sistema che non esiste.
- **I messaggi d'errore del proxy restano in italiano** negli esempi OpenAPI,
  perché è ciò che il proxy risponde davvero.
- **`verifica-affermazioni` controlla anche i documenti nuovi**: «87 sections»,
  «178 drugs», «35 tools» e «25 modules» nell'insieme inglese sono confrontati
  con la misura sull'app viva, e un disaccordo fra le due lingue fa fallire la
  batteria.

### Corretto — voci ormai false nei documenti italiani

Le correzioni di ieri avevano lasciato indietro tre affermazioni:

- `docs/06` §6 diceva «inclusi i 9 errori residui» mentre il banco ne riporta
  **zero**;
- `docs/06` aveva ancora la tabella con **sei** voci D-01, comprese le quattro
  chiuse con ChEMBL;
- `docs/13` §6 dichiarava l'accessibilità «verificata a campione» e la copertura
  di codice «non misurata», entrambe superate.

### Aggiunto alla lista di controllo del deploy

«La copertura di codice **non è scesa**» — `audit_copertura` fallisce se lo è, e
la lista che si legge prima di pubblicare deve dirlo.

---

## [bsi-v172] — 2026-09-23

Questa versione chiude difformità che erano **dichiarate**, non risolte. Ogni
chiusura è una misura che prima non veniva presa.

### Aggiunto — `audit_rete`: la verifica diretta che nessun dato esce

SEC-02 dice «nessun dato personale lascia il dispositivo». Era verificato
controllando i due *meccanismi* di uscita — variabile di telemetria vuota,
nessuno script da dominio esterno — e la difformità **D-03** lo dichiarava come
evidenza indiretta. Un controllo sui meccanismi dice «non vedo come potrebbe
uscire», che non è «non è uscito».

Il banco nuovo semina un **valore spia** irripetibile in 71 depositi dei dati
dell'utente (note, chat, chiavi API, impostazioni, progressi), poi **usa**
l'applicazione — 6 pagine, 87 sezioni, pannello dell'assistente — e ispeziona
URL, intestazioni e corpo di **ogni** richiesta che esce. Controlla anche gli
ospiti contattati: uno non dichiarato nella distinta è un difetto anche a mani
vuote, perché il solo contatto rivela che quell'utente sta usando l'app.

Porta con sé la prova di funzionare: `BSI_PROVA_FUGA=1` gli fa provocare una
fuga di proposito, verso un ospite **dichiarato** — contattarlo è lecito,
mandargli i dati no. Se in quel caso non fallisce, è lo strumento a essere
guasto. Provato: fallisce, e nomina la richiesta.

Misurato: 29 richieste ispezionate, **0 fughe**, ospiti contattati `127.0.0.1` e
`pubchem.ncbi.nlm.nih.gov`. **D-03 è sanata.**

### Corretto — il testo su gradiente non era «non misurabile»

La difformità **D-09** dichiarava fuori misura 892 elementi «su fondo a
gradiente», col motivo che «il contrasto varia lungo la superficie e servirebbe
leggere i pixel». Era vero a metà: un gradiente non ha *un* colore — inventarne
uno medio sarebbe peggio che non misurare — ma ha delle **tappe**, e quelle sono
note. Un testo leggibile su tutto il gradiente è un testo che supera la soglia su
**ogni** tappa: è la condizione più severa fra quelle vere, e non richiede di
leggere un solo pixel.

Entrando nella misura sono emersi **27 difetti mai visti prima**. Dieci erano un
falso positivo del banco appena scritto: con `background-clip:text` il gradiente
dipinge i **glifi**, non lo sfondo, e confrontarlo col colore del testo dava il
colore contro se stesso — 1:1. Corretto: in quel caso sono le tappe a essere i
colori del testo, e lo sfondo è quello dell'antenato. Vale anche per i
discendenti, perché lo `<span>` della versione dentro `.logo-name` è dipinto
dallo stesso gradiente.

I 17 difetti reali erano distintivi e pulsanti con testo bianco su gradienti che
a un'estremità sono chiari:

- `.badge-pro`, `.pc-badge`, `.login-btn` — bianco su `#00c9b7`: **2,09:1**.
  Testo a `#06141f`: passa su entrambe le estremità (4,94 e 8,90).
- `#level-badge` di accademia — il gradiente andava da `#b794f6` a `#7c5cbf`, un
  salto tale che **nessun** colore di testo passa su entrambi gli estremi:
  bianco 2,45 sul chiaro, scuro 3,67 sullo scuro. Si è stretta la corsa del
  gradiente conservando la tinta.
- I due pulsanti «Anima meccanismo» prendevano una tappa dai dati e potevano
  risultare a **1,03:1**: ora la tappa passa da `bsiAccentoLeggibile()`.

Aggiunta anche l'esclusione del testo fatto di **sole emoji**: il glifo porta i
propri colori e `color` non lo tocca, quindi misurarlo è come misurare un SVG
leggendo `color` — l'errore che aveva già prodotto 48 falsi difetti. Sono 32
elementi, contati e dichiarati.

Gli elementi di testo esaminati passano da 19 751 a **33 642**. Restano fuori il
testo dentro gli SVG (8 888) e quello su una vera immagine di sfondo (108),
contati a ogni esecuzione. Il contrasto resta a **0 difetti**, ora su una
superficie di misura molto più larga.

### Corretto — quattro delle sei voci senza struttura ne hanno una, verificata

La difformità **D-01** elencava sei farmaci «ad alta complessità molecolare
senza struttura verificata». Per quattro la struttura esiste e si trova in
**ChEMBL**, fonte indipendente da questo progetto:

| Voce | ChEMBL | Peso dichiarato | Peso calcolato |
|---|---|---:|---:|
| Digossina | `CHEMBL1751` | 780,94 | 780,95 |
| Vincristina | `CHEMBL90555` | 824,96 | 824,97 |
| Tacrolimus topico (Protopic) | `CHEMBL269732` | 804,02 | 804,03 |
| Tacrolimus sistemico (Prograf) | `CHEMBL269732` | 804,02 | 804,03 |

Il motivo registrato per la digossina diceva «ogni struttura provata si discosta
di 14-30 u dal peso di letteratura»: il peso dichiarato era giusto, erano le
strutture provate a essere sbagliate. Le voci con struttura passano da 153 a
**157**.

Una trappola evitata scrivendole: in una stringa JavaScript `"\C"` vale `"C"`.
Le barre rovesciate dello SMILES del tacrolimus — che sono **stereochimica** —
sarebbero sparite cambiando la molecola in silenzio. Vanno raddoppiate.

Che il confronto sia reale si vede aggiungendo un carbonio alla struttura
corretta della digossina: il banco segnala **Δ 14,04** e fallisce.

**Le due che restano non sono molecole singole**: Ivermectina è una miscela di
omologhi (≥80 % B1a, ≤20 % B1b; il peso dichiarato è quello del solo B1a) e
Coartem un'associazione di due principi attivi. Non manca una struttura: non ce
n'è **una** da mostrare. Il motivo registrato lo dice ora in questi termini.

### Aggiunto — la guardia opposta sul registro delle deviazioni

Il registro esiste per non far fallire la verifica su una voce di cui si è
deciso di non mostrare la struttura. Mancava il caso contrario: una voce che
**ha** una struttura verificata e resta comunque elencata è un permesso che
nessuno ha revocato, e domani coprirebbe in silenzio una struttura sbagliata
messa al suo posto. Ora fa fallire il banco — verificato rimettendo una delle
quattro voci sanate.

### Aggiunto — `audit_copertura`: la copertura di codice esiste, ed è 49,79 %

La difformità **D-06** diceva «nessuna copertura di codice strumentata», con
questa motivazione: strumentare richiederebbe introdurre una build, che
l'applicazione non ha. Era vero per `c8` e `istanbul`, che riscrivono il
sorgente prima di eseguirlo — e falso per il problema: **Chromium la raccoglie
da solo**, dentro il motore, senza toccare un byte del file servito
(`Profiler.startPreciseCoverage`, che Playwright espone come
`page.coverage.startJSCoverage()`). Il vincolo apparteneva agli strumenti
scelti, non alla cosa da misurare.

**Il primo risultato è stato 100 % su ogni file**, compresi 3,6 MB di
`index.html`: il banco che non misura niente nella forma più insidiosa, un
numero perfetto. V8 emette per ogni funzione un intervallo esterno col
conteggio degli ingressi, e dentro quello gli intervalli a `count: 0` per ciò
che **non** è stato eseguito; sommando i positivi si somma l'intero file. Si fa
il contrario: si parte dal totale e si sottrae l'unione dei vuoti.

Il numero vero: **49,79 %** complessivo — `index.html` 61,35 %, `bsi-ai-hub.js`
32,90 %, `bsi-spettri.js` 71,82 %. È copertura di **istruzioni**, non di rami, e
del percorso più ampio che un banco compie, non dell'intera batteria: entrambe
le cose sono dichiarate. Il valore è registrato e regge lo stesso patto del
debito di accessibilità — se scende, la batteria fallisce. Fra due esecuzioni
consecutive oscilla di 0,01 punti.

### Dichiarato meglio — D-07 ha ora un motivo verificabile

«Verifica su Chromium soltanto» restava vero ma vago. Nell'ambiente di verifica
il motivo si può controllare: la CDN da cui `playwright-core` scarica Firefox e
WebKit risponde **403** alla politica di rete. Non è una scelta, è un vincolo
dell'ambiente, e ora il documento lo dice così.

### Una regressione intercettata da un banco, non da me

Correggendo i due pulsanti «Anima meccanismo» ho lasciato due virgolette
sfuggite dove non servivano: `bsiAccentoLeggibile(col,\'#04121e\',4.5)` in un
punto che era già contesto di espressione, non di stringa. Risultato: *Invalid
or unexpected token*, e l'intera sezione Retrosintesi non disegnava più niente.

Non l'ho visto guardando il codice. L'ha detto `verifica-affermazioni`, che
misura le strategie di retrosintesi **nell'applicazione viva** e ha riportato
«dichiarato 46, misurato 0». È il motivo per cui quel banco esiste: un numero
che scende a zero è una funzione che non c'è più.

### Modificato

I banchi passano da 41 a **43**.

---

## [bsi-v171] — 2026-09-23

### Corretto — accessibilità: dagli 80 difetti di contrasto residui a **zero**

Gli ultimi ottanta sembravano rifinitura. Non lo erano: sotto ce n'erano
ancora tre cause strutturali.

- **Il «correttore automatico di contrasto» produceva difetti invece di
  toglierli.** Tre errori insieme:
  usava la **luminosità percepita** (`0.299R+0.587G+0.114B`) al posto della
  luminanza relativa WCAG, che è gamma-corretta, quindi le sue soglie — 115,
  140, 190, 150 — non corrispondevano a nessun rapporto di contrasto;
  **ignorava l'alfa**, così il distintivo con `background:rgba(255,180,84,.08)`
  su superficie scura gli sembrava «fondo chiaro» e ne scuriva il testo a
  `#16273e` con `!important`, **creando** un difetto a 1,21:1 sopra un sorgente
  che era già corretto (`#ffb454`);
  e guardava **solo gli elementi con uno sfondo proprio**, cioè mai il caso più
  comune, che è testo scuro il quale eredita il fondo scuro del pannello.
  Riscritto: risale agli antenati **componendo l'alfa** per ottenere il fondo
  effettivo, rinuncia (invece di indovinare) sopra immagini e gradienti, misura
  il rapporto WCAG vero e delega la correzione a `bsiAccentoLeggibile()`, che
  conserva la tinta e sceglie il verso guardando la superficie.
- **`--g900` vale `#0d1522`, lo stesso di `--bg`** — esattamente come `--g800`.
  È l'eredità di una scala di grigi nata per il tema **chiaro**, dove `--g900`
  era «il testo più scuro»; capovolto il tema, quel ruolo non esiste più. Le
  regole che lo usavano come colore del testo scrivevano testo del colore dello
  sfondo: `.rxn-fp button.on`, `.tb.on`, `.nav-btn.on` e altre, a **1,21:1**.
  Gli usi come colore del testo (30 regole) passano a `--testo-forte`; i 16 usi
  come **sfondo** restano dove sono.
- **Sfondo dai dati, testo fissato nel codice.** Distintivi e intestazioni
  prendevano la tinta dai dati e scrivevano `color:#fff`: funziona finché la
  tinta è scura, e smette appena qualcuno aggiunge `#e65100` (bianco sopra:
  3,79:1) o `#00897b` (4,32:1). Aggiunta `bsiEtichettaLeggibile()`, il duale di
  `bsiAccentoLeggibile()`: sceglie il testo guardando il fondo e, se nessuno dei
  due estremi basta, **scurisce il fondo conservando la tinta** — un'etichetta
  deve restare riconoscibile per colore.
- L'invariante è imposta **dove il colore viene scelto**, non nei dati: la
  funzione `section()` delle schede biomolecola, il generatore dei distintivi
  dei database, i colori per anno di corso, i chip dei gruppi funzionali. Così
  vale anche per le voci aggiunte domani.
- Tinte residue corrette dopo averne **verificata la superficie reale**:
  `controindicata` da `#ef4444` a `#ff5c5c` (4,00 → 4,98:1), la spontaneità di
  reazione da `#0d1522` (invisibile) a `#4ade80`, i pulsanti menta `#1fd39a`
  con testo `#06141f` anziché `#e9eef6` (1,66 → oltre 9:1).

Misurato col banco ufficiale sulle stesse 87 sezioni a ogni passo:
**80 → 27 → 26 → 10 → 4 → 0**. Riferimento in
`docs/evidence/accessibilita-riferimento.json` aggiornato a **0**: da qui in
avanti anche un solo difetto reintrodotto fa **fallire** la batteria.

Restano fuori dall'automatismo il testo dentro gli SVG e quello su fondo a
gradiente, che il banco **conta e riporta** a ogni esecuzione: `docs/09` D-09.

### Aggiunto — `audit_mobile`, il 41º banco: la pagina non deve scorrere in orizzontale

UI-03 dice «l'app deve funzionare a 390 px», e la matrice lo dava per verificato
da `audit_stabilita` — che in viewport telefono guarda però gli **errori
JavaScript**. Una pagina può non averne uno solo e uscire lo stesso dallo
schermo: il requisito era dichiarato coperto e non era misurato.

Misurandolo, una sezione su 87 faceva scorrere il documento: `squiz`, di **163
pixel**. Una griglia `1fr 1fr` con schede a contenuto non comprimibile — icona a
larghezza fissa, distintivo «N da ripassare» che non si restringe — portava il
documento a 553 px su 390. Corretta con `auto-fit` e `min-width:0` sui tre punti
che impedivano la compressione: rimettendo solo la griglia il difetto **non**
torna, servono tutti e tre.

Il banco misura `scrollWidth` del documento, non «un elemento più largo dello
schermo»: una tabella dentro un contenitore fatto per scorrere è corretta, e
segnalarla riempirebbe l'uscita di rumore finché nessuno la legge più. Conta
anche le sezioni percorse e fallisce se sono zero, perché un banco che non
misura nulla passa. Verificato reintroducendo il difetto: fallisce, e nomina la
sezione e i 163 pixel.

I banchi passano da 40 a **41**.

### Aggiunto — un badge sul contrasto, controllato come gli altri

Il README porta ora `contrasto WCAG AA — 0 difetti su 87 sezioni`. È
un'affermazione forte messa nel primo pixel della pagina, quindi
`verifica-affermazioni` la confronta con
`docs/evidence/accessibilita-riferimento.json`: se il debito risale, il badge
diventa falso e il banco lo dice. Verificato alterando di proposito il
riferimento.

Corretto anche l'ordine degli argomenti nei tre controlli sui badge: stampavano
«dichiarato» sul valore vero e «misurato» sul badge, cioè il contrario.

### Aggiunto — la documentazione inglese passa da 6 a 10 documenti su 16

La serie inglese si fermava a `docs/en/00-05`, e quei sei erano **derivati**: mai
più ricontrollati. Cercando i numeri per questa versione ne sono usciti due
fermi da tre rilasci — `docs/en/05` dichiarava «84 sections» mentre l'app ne ha
87, e si diceva descritto dalla versione `bsi-v146` mentre siamo alla 171.

- Tradotti **`07-SBOM`, `08-Traceability-Matrix`, `09-Release-Conformance-Statement`
  e `15-Test-Documentation`**: insieme ai sei già presenti coprono l'intero
  percorso che un revisore straniero segue in sede di due diligence — dossier,
  architettura, V&V, sicurezza, licenze, agente AI, distinta dei componenti,
  tracciabilità, dichiarazione di conformità e documentazione di prova.
- **L'SBOM inglese non è tradotto a mano: è generato.** `tools/genera-sbom.js`
  emette ora `docs/07-SBOM.md` e `docs/en/07-SBOM.md` dalla stessa sorgente, con
  impronte, dimensioni e licenze calcolate una volta sola. Una distinta dei
  componenti tradotta a mano diverge al primo aggiornamento di una libreria.
- **`tools/verifica-affermazioni.js` legge anche l'insieme inglese.** Un
  documento inglese che dichiara un numero diverso dall'italiano fa fallire il
  banco con la stessa severità di due documenti italiani in disaccordo —
  verificato reintroducendo di proposito una divergenza.
- **Anche `tools/verifica-documenti.js` guarda ora `docs/en/`**, che era
  escluso per nome: è per questo che la traduzione ha potuto restare indietro
  senza che niente lo dicesse. Estendendolo sono usciti subito tre difetti veri:
  un collegamento rotto nell'indice inglese (`00-Dossier.en.pdf`, file che non
  esiste: si chiama `00-Technical-Dossier.en.pdf`) e due versioni storiche
  citate in una forma che l'esenzione non riconosceva. L'esenzione per i
  riferimenti al passato accetta ora anche le formule inglesi e tollera il `> `
  di una citazione andata a capo, ma resta stretta: un'intestazione
  «Version described» rimasta indietro continua a far fallire il banco —
  verificato.

### Corretto — numeri dichiarati che non corrispondevano più alla misura

Tutti trovati confrontando con l'applicazione in esecuzione, non con il sorgente.

- **`docs/05` dichiarava «32 strumenti» mentre l'agente ne espone 35**, e tre —
  `analizza_molecola`, `disegna_molecola`, `mostra_spettri` — non comparivano
  nell'elenco. Corretti elenco e conteggio in italiano e in inglese, e aggiunta
  l'affermazione al banco: da qui in avanti il numero è **misurato** su
  `window.BSI_AI_TOOLS`.
- **La ricerca web era contata fra gli strumenti dell'applicazione.** Non lo è:
  `web_search` e `web_fetch` sono eseguiti **dal fornitore**, e solo su quelli
  che li offrono. Contarli insieme agli altri li faceva sembrare sempre
  disponibili. Ora sono distinti.
- **`docs/05` §3.1** dichiarava 143 farmaci e 39 strategie: sono 178 e 46.
- **`docs/08`** dichiarava 137 file tracciati dal banco di sicurezza: sono 235.
- **`docs/08` §7** scriveva nel testo «37 requisiti verificati su 42» mentre la
  tabella sopra diceva 39 su 44. Il banco controllava la tabella, non la prosa.

### Corretto — la copertura di SEC-02 era dichiarata in tre modi diversi

`docs/09` D-03 diceva «copertura al 50 %», `docs/15` §6 «2 requisiti su 4»,
`docs/08` §5 lo dava per coperto da banco. Eseguendo `verifica-sicurezza` si
vede che sono 9 controlli su 235 file, e che SEC-02 — «nessun dato personale
lascia il dispositivo» — è verificato **per interposta proprietà**: il banco
controlla che la variabile di telemetria sia vuota e che nessuno script venga da
un dominio esterno, cioè i due meccanismi attraverso cui un dato potrebbe
uscire. È evidenza automatica ma indiretta, e ora i tre documenti lo dicono allo
stesso modo. La verifica diretta richiederebbe l'osservazione del traffico
durante un uso reale, ed è dichiarata come tale.

### Aggiunto — i pacchetti di consegna portano anche la documentazione inglese

`consegna/AZIENDA/` e `consegna/COMPLETO/` includono ora una cartella `en/` con
la traduzione dei documenti che il pacchetto contiene **davvero** — allegare la
versione inglese di un documento assente rimetterebbe dentro l'incoerenza appena
tolta — e i corrispondenti `pdf/*.en.pdf`, più
`BioSpecInfo-Full-Dossier.en.pdf`. Il pacchetto aziendale passa da 40 a 60 file.

### Corretto — la riscrittura dei riferimenti sbagliava nelle sottocartelle

I valori della mappa dei pacchetti sono percorsi relativi alla **radice** del
pacchetto, ma un collegamento Markdown si risolve rispetto alla cartella del
file che lo contiene. Finché ogni documento stava nella radice le due cose
coincidevano; con `en/` non più, e `[LICENSE](LICENSE)` dentro `en/07-SBOM.md`
puntava a `en/LICENSE`. Sono usciti **24 collegamenti rotti** alla prima
costruzione — trovati dal controllo che era stato scritto proprio per questo, e
che ha fatto fallire la generazione invece di consegnare un pacchetto rotto.
Ora sono **192 collegamenti verificati, nessuno rotto**.

### Corretto — la tabella delle difformità era spezzata a metà

In `docs/09` §4 il riquadro su D-05 stava **fra due righe della tabella**: in
Markdown questo chiude la tabella, e D-06, D-07 e D-08 venivano impaginate come
una seconda tabella senza intestazione. Righe riunite e riordinate, riquadro
spostato dopo.

---

## [bsi-v170] — 2026-09-21

### Corretto — accessibilità: da 276 difetti a 80, campi senza etichetta a zero

Le cause peggiori non erano colori sbagliati ma **token del tema che
valevano lo stesso dello sfondo**.

- **Ogni link senza colore proprio era invisibile.** `--g800` vale
  `#0d1522`, **identico a `--bg`**, e la regola `a { color: var(--g800) }`
  lo applicava a tutti i collegamenti: contrasto **1:1**, misurato nel DOM.
  Stessa storia per `--g700` (`#16263d`), quasi identico a `--white`: 1,01:1.
  Introdotto `--testo-forte`, applicato ai **soli** usi come colore del
  testo — come sfondo e bordo quei token restano dove servono.
- **Pulsanti che cambiavano sfondo senza cambiare il testo.** Lo stato
  selezionato (o quello deselezionato, secondo il pannello) diventava
  illeggibile: **1,39:1**. Tre punti corretti; sfondo e colore ora si
  decidono insieme.
- **`lightenColor(hex,pct){ return hex; }`** — una funzione chiamata
  «schiarisci» che restituiva il colore **invariato**. Uno stub mai finito,
  con ogni probabilità nato proprio per questo problema. Ora fa quello che
  il nome dice.
- **Il pannello di risposta del quiz aveva fondo chiaro e testo chiaro**:
  lo studente non poteva leggere la risposta corretta né il suggerimento.
- **Tabella dei campi cristallini**: tre righe su quattro hanno fondo
  chiaro, ma il testo era sempre chiaro. Il colore ora segue lo sfondo
  della riga.
- **40 campi privi di etichetta → 0.** Le etichette esistevano già come
  testo visibile accanto al campo, solo non erano associate. Dove c'era un
  `<label>` gli è stato dato il `for` (così resta cliccabile), altrove un
  `aria-label` che **contiene il testo visibile** — WCAG 2.5.3 chiede che
  il nome accessibile includa ciò che si legge, altrimenti il comando
  vocale non trova il campo.

### Aggiunto — `tools/verifica-affermazioni.js`

Confronta ogni numero dichiarato nei documenti con quello **misurato
nell'applicazione in esecuzione**: sezioni, farmaci, malattie, tumori,
strategie, moduli, più i badge del README.

I numeri del dossier — «63 malattie (23 tumori)», «46 strategie», «25
moduli» — sono la prima cosa che legge chi valuta, e nessuno li
controllava. Sono risultati **tutti esatti**, ma:

- `chimorga.html` dichiarava «25 moduli» in cima e **«17 moduli»** più
  sotto: due affermazioni sullo stesso oggetto, nello stesso file;
- `sr_completo.html` diceva «98 esercizi» e **«87 esercizi»**. Ora il
  totale si **conta** invece di essere ricordato;
- i **badge del README** — la prima cosa che si vede su GitHub — erano
  fermi a `bsi-v165` e «34 banchi» con versione 169 e 40 banchi.

> **Una lezione pagata.** Avevo già concluso che «63 malattie» fosse falso:
> nel sorgente avevo trovato un array `DISEASES` con 12 voci e stavo per
> «correggere» il documento. Misurando nel DOM il menu ne elenca davvero
> 63 — l'array era un altro, più piccolo. **Un conteggio sul sorgente non è
> una misura: è un indizio.**


## [bsi-v168] — 2026-09-20

### Aggiunto
- **Sezione Cromatografia** (85ª sezione). Cromatogramma **calcolato** dai
  parametri — le gaussiane hanno σ = t<sub>R</sub>/√N e la risoluzione mostrata
  è quella che si misurerebbe su quei picchi — in doppia vista (corsa intera e
  vista espansa della coppia, come su uno strumento). Curva di **van Deemter**
  con i tre termini separati e minimo in forma chiusa (u = √(B/C),
  H<sub>min</sub> = A + 2√(BC)). Calcolatore dell'**indice di Kováts**, che
  rifiuta i tempi minori del tempo morto e distingue interpolazione da
  estrapolazione. Tabella delle grandezze, confronto GC/HPLC, guida ai
  rivelatori, diagnostica dei difetti di forma dei picchi.
- **Sezione Taratura e incertezza** (86ª sezione). Regressione ordinaria ai
  minimi quadrati con pendenza e intercetta corredate dalla loro deviazione
  standard; banda di confidenza al 95 % e **grafico dei residui**;
  concentrazione dell'incognito con intervallo di confidenza completo;
  **LOD e LOQ** secondo ICH Q2(R1); propagazione dell'incertezza che indica
  quale contributo domina; regole delle cifre significative.
  Due diagnostiche che l'r² non dà: **test F** retta contro parabola per la
  non linearità, e **residuo cancellato** per i punti anomali — il criterio
  ingenuo a 3 s<sub>y/x</sub> era già scritto, e non segnalava l'esempio che
  doveva dimostrarlo (residuo 0,0747 contro soglia 0,1337): il punto anomalo
  entra nel calcolo di s<sub>y/x</sub>, lo gonfia e si nasconde da solo.
- **`tools/genera-pdf.js`** — i documenti diventano PDF impaginati, con
  versione e commit in ogni piè di pagina. Genera anche il **dossier unico**
  (italiano e inglese) e **cancella** i PDF che non rigenera.
- **`tools/genera-pacchetti.js`** — i tre pacchetti di consegna (AZIENDA,
  TESI, COMPLETO), ciascuno con copertina, percorso di lettura, evidenza,
  strumenti e PDF.
- **`package.json`**, che mancava: `npm install` non installava nulla, e la
  procedura di riproduzione documentata non funzionava per chi la seguiva.
- Nuovi controlli in `verifica-documenti.js`: identificativi di requisito non
  duplicati e totali di copertura pari agli identificativi realmente definiti.
- `docs/08` §8: le **lacune di copertura** dichiarate per nome (nessuna
  copertura di codice, solo Chromium, nessuna regressione visiva, 6 strutture
  non verificate, prestazioni su hardware lento).

### Corretto
- **32 dei 39 banchi di prova non erano nel repository.** Vivevano solo
  nell'area di lavoro della sessione in cui erano stati scritti, e la cartella
  predefinita di `genera-evidenza.js` puntava lì. La frase su cui poggia tutto
  il resto del lavoro — «chiunque può rieseguirli» — era quindi falsa: un
  terzo che clonava il repository ne trovava sette su trentanove, senza alcun
  messaggio che glielo dicesse. Ora stanno in **`tools/banchi/`**, versionati.
- **Un banco assente non faceva fallire la batteria.** Veniva contato e
  stampato, ma l'esito complessivo guardava solo i falliti: una batteria in
  cui mancavano *tutti* i banchi avrebbe stampato «CONFORME» con zero
  fallimenti. È la forma più pura del difetto che questo lavoro cerca di
  evitare — un controllo che non misura nulla passa — applicata non a un
  singolo banco ma all'apparato che li governa.
- **La verifica di accessibilità ispezionava una sezione su 87.** Salta
  giustamente gli elementi non visibili, ma `index.html` ne mostra una alla
  volta: su 19 751 elementi di testo ne stava guardando **41**, e riportava
  «0 difetti». Ora percorre tutte le sezioni e **stampa quante ne ha
  percorse** — il primo tentativo ne percorreva zero (il clic di Playwright
  aspetta la visibilità, e i pulsanti stanno in gruppi richiusi) e il
  controllo l'ha detto invece di stampare un altro zero rassicurante.
- **1 069 difetti di contrasto emersi, 793 corretti, 276 registrati** (−74 %).
  Non ritoccando i colori uno per uno, ma risalendo alle cause comuni:
  - **159** — una rete di sicurezza del tema scuro, iniettata a runtime, con
    specificità sufficiente a scavalcare il colore dei componenti: il testo
    pensato per le schede **bianche** finiva a `#d4dce6`, contrasto **1,38:1**.
    Riscritta con `:where()` (specificità zero).
  - **~400** — l'accento per categoria usato come *testo* sull'intestazione
    scura, col ripiego `#0d1522` (quasi nero): **1,13:1**. Introdotta
    `bsiAccentoLeggibile()`, che conserva la tinta e alza la luminosità quanto
    basta, applicata nei **14 punti in cui l'accento viene scelto** — non nei
    dati, così vale anche per le voci aggiunte in futuro.
  - **139** — due tinte sotto soglia per poco, sostituite **dopo aver
    verificato** che non comparissero mai su fondo chiaro.
  - **57** — una zebratura di tabella bianco/scurissimo con testo sempre
    chiaro: le righe bianche erano illeggibili.
  - **43** — celle della tavola periodica appena sotto soglia.
  - **8 punti** con `"#var(--text)"`: un `#` di troppo rende il colore
    invalido. In SVG ripiega sul nero, in canvas l'assegnazione viene
    **ignorata** e il disegno continua col colore precedente.

  **Il verso della correzione dipende dalla superficie, non dal colore.** Il
  primo tentativo schiariva sempre: trenta difetti tolti sull'intestazione
  scura, diciotto messi sul riquadro chiaro che usa lo stesso accento. La
  funzione ora scurisce sui fondi chiari e schiarisce su quelli scuri.

  I 276 restanti sono una coda dispersa su 68 cause, la maggiore da 24
  difetti; sono **registrati** e il banco fallisce se crescono.
- **L'aggiornamento automatico non sarebbe più scattato su nessun dispositivo.**
  `_bsiPaginaOccupata()` considera «lavoro aperto» qualunque area di testo con
  più di 20 caratteri; la nuova sezione Taratura ne porta una **già piena** di
  dati d'esempio. Di conseguenza la pagina risultava sempre occupata e ogni
  versione nuova avrebbe chiesto il permesso invece di applicarsi — per sempre.
  Ora conta solo il testo che l'utente ha davvero cambiato (`value !==
  defaultValue`). È una regressione introdotta in questa stessa versione e
  intercettata da `test_sw` §4A: a occhio non si sarebbe notata, perché la
  barra funziona benissimo — fa solo la cosa sbagliata.
- **L'agente non sapeva aprire Simmetria e Cromatografia.** L'elenco delle
  sezioni navigabili era una copia scritta a mano, ferma a 84 voci mentre
  l'app ne aveva 87; la documentazione dichiarava che le raggiungeva tutte.
  Ora l'elenco si sincronizza con i pulsanti realmente presenti nella pagina.
- **`SCI-10` era definito due volte** nella matrice di tracciabilità: una come
  requisito verificato al 100 %, una come requisito dichiarato *non* verificato.
  Il secondo è ora `SCI-11`.
- **La tabella di copertura sommava 36 requisiti** dichiarandone 9 scientifici
  quando nel documento ne erano definiti 10. I totali reali sono 37
  automatizzati su 42 dichiarati — l'88 %, non il 100 %.
- **50 collegamenti rotti su 127** nei pacchetti di consegna alla prima
  generazione: un documento estratto porta con sé i riferimenti alla posizione
  che aveva nel repository. Ora vengono riscritti, e ciò che non è nel
  pacchetto rimanda al repository pubblico.
- **`docs/README.md` veniva cancellato** dal `README.md` della radice nel
  pacchetto COMPLETO, in silenzio, per omonimia.
- **15 PDF obsoleti** in `docs/pdf/`: fermi ai documenti 00-05 e a una versione
  di mesi prima. Un allegato vecchio afferma cose false con l'aria di essere
  autorevole.
- I PDF delle traduzioni inglesi puntavano a nomi di file non più esistenti.

---

## [bsi-v165] — 2026-09-20

### Aggiunto
- **Strumenti di verifica nel repository** (`tools/`), eseguibili da terzi:
  - `genera-evidenza.js` — esegue tutta la batteria e ne trascrive l'uscita
    integrale, con ambiente, commit e impronte SHA-256
  - `genera-sbom.js` — distinta dei componenti dai file reali, in Markdown e
    CycloneDX 1.5
  - `verifica-farmaci.js` — confronto struttura ⟷ peso molecolare, spostato
    dall'area di lavoro al repository perché un revisore possa rieseguirlo
- **Registro delle deviazioni** (`docs/evidence/deviazioni-note.json`): le voci
  prive di struttura devono essere registrate con il motivo, altrimenti la
  verifica fallisce
- Documenti 07–15: SBOM, tracciabilità, conformità di rilascio, riferimento
  delle interfacce, modello dei dati, guida al deploy, specifiche funzionali,
  manuale utente, documentazione dei test
- Verificate e aggiunte le strutture di vancomicina, rifampicina, venetoclax

### Modificato
- Il controllo dei farmaci distingue ora **difetti** (struttura che contraddice
  il proprio peso) da **deviazioni dichiarate** (struttura assente e registrata)

### Corretto
- La SBOM dichiarava licenza MIT per l'**applicazione**, che è invece
  proprietaria. In un documento consegnato a un cliente avrebbe comunicato
  diritti d'uso inesistenti.
- Digossina e semaglutide, le cui strutture non superavano la verifica, sono
  rimaste senza struttura anziché con una non verificata

---

## [bsi-v164] — 2026-09-20

### Aggiunto
- **42 farmaci**, ognuno con struttura verificata: losartan, atenololo,
  carvedilolo, diltiazem, verapamil, clopidogrel, rivaroxaban,
  idroclorotiazide, quetiapina, olanzapina, risperidone, venlafaxina,
  duloxetina, bupropione, paroxetina, amitriptilina, lamotrigina,
  levetiracetam, topiramato, fenitoina, clonazepam, midazolam, zolpidem,
  rivastigmina, lansoprazolo, ondansetron, loratadina, cetirizina, budesonide,
  doxiciclina, claritromicina, doxorubicina, ciclofosfamide, 5-fluorouracile,
  gemcitabina, etoposide, anastrozolo, bicalutamide, sildenafil, finasteride,
  ossicodone, prednisone
- Guida al proxy **dentro l'applicazione**, con i comandi pronti da copiare

### Corretto
- **89 errori nelle strutture molecolari** su 143 voci. I pesi molecolari erano
  corretti; le strutture no: la ketamina era un pirrolidinone non correlato, la
  morfina non era morfina (in due voci), il lorazepam era privo dell'ossidrile
  che lo definisce, l'atorvastatina del gruppo anilidico, il testosterone del
  doppio legame Δ⁴
- 7 farmaci duplicati in categorie diverse
- Il sofosbuvir conteneva citosina invece di uracile: è un analogo dell'uridina

---

## [bsi-v163] — 2026-09-20

### Corretto
- **Altezze casuali nel predittore NMR.** I picchi erano disegnati con
  `0.55 + Math.random()*0.38`: in uno spettro ¹H l'altezza *è* l'informazione
  quantitativa, e inventarla è peggio che ometterla
- Le predizioni NMR sono **intervalli** (`"6,5–8,5 ppm"`) e veniva usato solo il
  primo numero: ora si disegna la fascia con un segno sul valore tipico
- Rumore casuale rimosso anche da `makeNMRsvg`
- Aggiunto il riferimento TMS a 0 ppm; rimosso un residuo di lavorazione («v20»)
  stampato in un angolo dello spettro

### Verificato
- Convenzioni degli assi misurate su tutti e cinque i grafici (IR in due
  versioni, NMR, UV-Vis, MS): nessuno era invertito

---

## [bsi-v162] — 2026-09-20

### Aggiunto
- **`bsi-spettri.js`** — motore di predizione spettrale che riconosce i gruppi
  funzionali con SMARTS sul grafo molecolare via RDKit
- Voce **Aggiornamenti** nel pannello ✨

### Corretto
- I gruppi funzionali erano riconosciuti con espressioni regolari sulla stringa
  SMILES, dentro catene `else if`: passava **un solo gruppo per molecola**.
  L'aspirina — estere *e* acido — usciva senza l'O–H allargato, senza il C=O
  acido a 1690 cm⁻¹ e senza il protone del COOH a 11,6 ppm
- Gli spettri IR erano disegnati in assorbanza verso l'alto anziché in
  trasmittanza verso il basso
- Rumore casuale rimosso dalle tracce IR
- Coniugazione applicata al **singolo** carbonile
- La finestra degli aggiornamenti esisteva ma il suo unico pulsante era in un
  contenitore nascosto: nessun modo di aprirla
- `BSI_APP_VERSION` era ferma a `v140-2026-06` mentre il Service Worker era alla
  v161
- I fornitori AI irraggiungibili ora finiscono in un gruppo separato in fondo
  all'elenco, non più solo marcati con un ⚠

---

## [bsi-v161] — 2026-09-10

### Corretto
- **File Manager**: `db.transaction` su un database non ancora aperto. In Safari
  in navigazione privata il database non si apre mai e l'errore era definitivo
- Scritture che fallivano in silenzio: «✅ Nota salvata!» veniva mostrato senza
  sapere se il salvataggio fosse riuscito
- **Spectra**: due `Invio` ravvicinati facevano partire due turni sovrapposti,
  producendo una cronologia `user,user,assistant,assistant` che Claude rifiuta
- Il Service Worker ricaricava d'ufficio le schede aperte, distruggendo il
  lavoro in corso: ora avvisa e decide la pagina
- Rete degradata trattata come rete assente: attesa limitata a 3,5 s quando una
  copia in cache è disponibile
- Un visore 3D costruito per ogni molecola: da 7 costruzioni a 1 su 10 molecole

---

## [bsi-v160] — 2026-09-10

### Corretto
- Il pannello di prova consigliava Gemini 3 Pro come «utilizzabile subito»
  senza segnalare che è a consumo
- Un'attesa imposta di 37 s con un fornitore alternativo disponibile: ora oltre
  i 10 s si cambia fornitore

---

## [bsi-v159] e precedenti — 2026-09

Lavoro sull'agente **Spectra** e sulla resilienza ai guasti dei fornitori
esterni:

- Memoria dei fornitori irraggiungibili (`bsi_prov_ko`, 24 ore)
- Lista nera dei modelli ritirati, appresa dai messaggi d'errore (7 giorni)
- Tetto di token appreso dall'errore anziché codificato
- Firme di ragionamento (Anthropic e Gemini) catturate e restituite
- Nuovi tentativi sui guasti temporanei (429, 5xx)
- Doppia finestra di timeout: primo byte e byte successivi
- Audit grafico: 13 canvas sfocati su schermi ad alta densità
- Rimozione di NVIDIA dalla scelta diretta (non raggiungibile dal browser)

---

## Versioni storiche

Il progetto ha una storia più lunga di quella riportata qui, ricostruibile dai
commit e dalle pull request del repository. Alcune tappe:

| Riferimento | Contenuto |
|---|---|
| `#114`–`#118` | Documentazione tecnica per aziende, versione inglese, PDF, licenza proprietaria |
| `#100`–`#113` | Centro Spettri: editor, ADMET, similarità, alert strutturali, evidenziazione dei gruppi |
| `#89`–`#99` | Potenziamento delle sezioni: catalogo di 296 reazioni animate, laboratorio quantistico, astrochimica, data science |

---

## Come si numerano le versioni

La versione è quella della cache del Service Worker (`bsi-vNNN`), incrementata a
ogni pubblicazione. Non segue il versionamento semantico: non esiste un'API
pubblica di cui garantire la compatibilità, e ogni pubblicazione è una
distribuzione completa dell'applicazione.

`CACHE` in `sw.js` e `BSI_APP_VERSION` in `index.html` **devono sempre
coincidere** — sono due righe che vanno cambiate insieme.
