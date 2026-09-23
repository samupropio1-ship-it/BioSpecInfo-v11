# Changelog — BioSpecInfo

Tutte le modifiche rilevanti di questo progetto.

Il formato segue [Keep a Changelog](https://keepachangelog.com/it/1.1.0/).
La versione dell'applicazione coincide con la versione della cache del Service
Worker (`bsi-vNNN`) ed è visibile nell'app: menu ✨ → **Aggiornamenti**.

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
