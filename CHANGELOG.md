# Changelog — BioSpecInfo

Tutte le modifiche rilevanti di questo progetto.

Il formato segue [Keep a Changelog](https://keepachangelog.com/it/1.1.0/).
La versione dell'applicazione coincide con la versione della cache del Service
Worker (`bsi-vNNN`) ed è visibile nell'app: menu ✨ → **Aggiornamenti**.

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
