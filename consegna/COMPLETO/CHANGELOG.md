# Changelog — BioSpecInfo

Tutte le modifiche rilevanti di questo progetto.

Il formato segue [Keep a Changelog](https://keepachangelog.com/it/1.1.0/).
La versione dell'applicazione coincide con la versione della cache del Service
Worker (`bsi-vNNN`) ed è visibile nell'app: menu ✨ → **Aggiornamenti**.

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
