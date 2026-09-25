# Dichiarazione di conformità di rilascio — BioSpecInfo

| Campo | Valore |
|-------|--------|
| **Software** | BioSpecInfo |
| **Versione** | `bsi-v174` |
| **Autore e responsabile del rilascio** | Samuele Pio Provenzano |
| **Repository** | `github.com/samupropio1-ship-it/BioSpecInfo-v11` |
| **Distribuzione** | GitHub Pages — `samupropio1-ship-it.github.io/BioSpecInfo-v11/` |
| **Natura del software** | Progressive Web App client-side, senza backend |

---

## 1. Oggetto della dichiarazione

Il sottoscritto dichiara che la versione `bsi-v174` di BioSpecInfo è stata
sottoposta alla procedura di verifica descritta in
[`02-Verification-Validation-Report.md`](02-Verification-Validation-Report.md)
e che gli esiti sono quelli riportati, senza selezione, in
[`evidence/RAPPORTO-VERIFICA.md`](evidence/RAPPORTO-VERIFICA.md) — documento
generato automaticamente da `tools/genera-evidenza.js`, che trascrive l'uscita
dei banchi senza intervento manuale.

Questa dichiarazione **non** attesta l'assenza di difetti. Attesta che:

1. esiste una procedura di verifica automatizzata e riproducibile da terzi;
2. l'esito riportato è quello realmente prodotto, compresi i fallimenti;
3. i limiti noti sono dichiarati in modo esplicito e non presentati come
   funzionalità.

---

## 2. Destinazione d'uso e limitazioni

### 2.1 Destinazione dichiarata

BioSpecInfo è uno strumento **didattico e di supporto allo studio** per chimica,
biochimica, farmacologia e astrochimica. È progettato per studenti universitari
e per la preparazione di esami.

### 2.2 Ciò per cui il software NON è destinato

Queste esclusioni sono parte integrante della dichiarazione.

| Ambito | Esclusione |
|---|---|
| **Uso clinico** | Non è un dispositivo medico ai sensi del Regolamento (UE) 2017/745. Non supporta diagnosi, prescrizione, dosaggio né decisioni terapeutiche. I dati farmacologici hanno finalità esclusivamente didattica e l'applicazione lo dichiara in apertura della sezione. |
| **Uso analitico certificato** | Gli spettri sono **predizioni** da tabelle di gruppi funzionali, non misure né simulazioni quantomeccaniche. Non sostituiscono un database sperimentale (SDBS, NIST) né una determinazione strumentale, e non sono utilizzabili per identificazione formale di sostanze. |
| **Ambiente regolamentato GxP** | Non è validato per uso in ambiente GLP/GMP. L'allineamento a GAMP 5 descritto in `docs/03` è metodologico, non una qualifica formale. |
| **Controllo di accesso** | Il File Manager protegge i contenuti con un deterrente lato client. Su un sito statico non esiste controllo di accesso effettivo: chi legge il sorgente lo aggira. Non va usato per materiale riservato. |

---

## 3. Sintesi degli esiti di verifica

Gli esiti integrali, con l'uscita testuale di ogni banco, l'ambiente di
esecuzione, il commit e le impronte SHA-256, sono in
[`evidence/RAPPORTO-VERIFICA.md`](evidence/RAPPORTO-VERIFICA.md).

| Famiglia | Cosa dimostra |
|---|---|
| Dati scientifici | I dati chimici sono verificati contro una fonte indipendente |
| Agente AI | L'assistente resta utilizzabile quando il fornitore esterno si guasta |
| Stabilità | L'app regge sessioni lunghe, memoria esaurita, rete degradata |
| Interfaccia | I pannelli rispondono come documentato |
| Coerenza documentazione/codice | Ciò che la documentazione promette esiste nel codice |

---

## 4. Difformità note alla data del rilascio

Elencate per esteso. Nessuna è stata rimossa dalla verifica per farla passare.

| # | Difformità | Impatto | Trattamento |
|---|---|---|---|
| **D-01** | **2 voci** (erano 6) che non sono molecole singole: Ivermectina, miscela di omologhi B1a/B1b, e Coartem, associazione di due principi attivi | Per queste due non è disponibile la rappresentazione 2D/3D né la predizione spettrale | Voci lasciate **senza SMILES**: i dati farmacologici restano, la struttura non è mostrata. Per Digossina, Vincristina e Tacrolimus (topico e sistemico) la struttura è stata ripresa da **ChEMBL** e supera il confronto col peso molecolare dichiarato: le quattro voci sono uscite dal registro. Le due che restano non hanno una struttura da mostrare, non una struttura mancante. |
| **D-02** | 19 voci prive di SMILES per natura (anticorpi monoclonali, peptidi) | Nessuno: per queste molecole la notazione SMILES non è la rappresentazione appropriata | Non è una difformità sostanziale; elencata per completezza |
| **D-03** | ~~SEC-02 verificato solo per interposta proprietà~~ — **sanata**: vedi S-10 | — | `audit_rete` osserva il traffico durante un uso reale, con un valore spia seminato nei dati dell'utente |
| **D-04** | ~~Password del File Manager nella cronologia git~~ — **sanata**: vedi S-12 | — | La password è stata **cambiata** alla versione `bsi-v174`. Quella vecchia resta leggibile nella cronologia e non apre più niente |
| **D-06** | Copertura di codice **misurata ma parziale**: 49,79 % di istruzioni, non di rami | È la copertura del percorso più ampio che un banco compie (88 sezioni più le altre pagine), non della batteria intera; e un `if` entrato da un solo lato conta come coperto | `audit_copertura` la misura con il profilatore di Chromium, senza build e senza riscrivere il sorgente. Il valore è **registrato**: se scende, la batteria fallisce |
| **D-07** | Verifica su Chromium soltanto | Firefox e WebKit sono provati a mano | Dichiarato in `docs/08` §8. Nell'ambiente di verifica il motivo è verificabile: la CDN da cui `playwright-core` scarica gli altri motori risponde **403** alla politica di rete, quindi Firefox e WebKit non sono installabili lì |
| **D-08** | ~~Traduzione inglese parziale~~ — **sanata**: vedi S-13 | — | Tutti e **16 i documenti** sono in inglese. `verifica-documenti` e `verifica-affermazioni` leggono `docs/en/` come l'italiano: un disaccordo fra le due lingue fa fallire la batteria |
| **D-09** | Conformità WCAG 2.1 AA non verificabile integralmente in modo automatico | Restano fuori il testo dentro gli SVG (8 888 elementi), quello su una vera **immagine** di sfondo (108) e tutto ciò che richiede giudizio umano. Il testo su **gradiente** è entrato nella misura: 591 elementi, valutati sulla tappa peggiore del gradiente | Gli elementi saltati sono **contati** e riportati a ogni esecuzione |

> ### Il contrasto, da 1 069 difetti a zero — come è emerso e come è stato chiuso
>
> Fino alla versione `bsi-v168` questo documento dichiarava la conformità WCAG
> «verificata a campione» e il banco riportava **0 difetti**. Erano due
> affermazioni vere e insieme prive di significato: il banco ispezionava solo
> gli elementi **visibili**, e `index.html` mostra una sezione alla volta.
> Su 19 751 elementi di testo ne stava guardando **41**.
>
> Percorrendo tutte e 87 le sezioni sono emersi **1 069** difetti di contrasto.
> Non erano comparsi: c'erano sempre stati.
>
> Oggi sono **zero**, misurati con lo stesso banco su tutte le sezioni — che
> oggi sono 88. Non per sostituzione in blocco — quella strada, tentata una volta, aveva
> introdotto 997 difetti nuovi — ma risalendo ogni volta alla **causa comune** e
> rimisurando dopo ogni modifica. I **40 campi privi di etichetta** sono
> anch'essi scesi a **zero**.
>
> Le cause più gravi non erano colori sbagliati, ma **token del tema che
> valevano lo stesso dello sfondo**:
>
> | Difetto strutturale | Effetto misurato |
> |---|---|
> | `--g800` vale `#0d1522`, **identico a `--bg`** — e la regola `a { color: var(--g800) }` lo applicava a ogni link | Ogni link senza colore proprio era a contrasto **1:1**: invisibile |
> | `--g700` vale `#16263d`, quasi identico a `--white` (`#16273e`) | Testo a **1,01:1** |
> | Pulsanti che cambiavano **sfondo** senza cambiare **colore del testo** | Lo stato selezionato (o quello deselezionato, a seconda del pannello) diventava illeggibile: **1,39:1** |
> | `lightenColor(hex,pct){ return hex; }` | Una funzione chiamata «schiarisci» che restituiva il colore **invariato**: uno stub mai finito, probabilmente nato proprio per questo problema |
> | Pannello di risposta del quiz: fondo chiaro, testo chiaro | Lo studente **non poteva leggere la risposta corretta** |
>
> Il rimedio strutturale è stato un token esplicito — `--testo-forte` — per il
> testo in evidenza su superficie scura, applicato ai soli usi come *colore
> del testo*: `--g800` e `--g700` restano dove servono come sfondo o bordo.
>
> | Causa | Difetti | Rimedio |
> |---|---:|---|
> | Rete di sicurezza del tema scuro con specificità superiore a quella dei componenti: il testo destinato alle schede **bianche** veniva forzato a `#d4dce6`, contrasto 1,38:1 | 159 | Riscritta con `:where()` (specificità zero): protegge il testo senza colore proprio e smette di combattere quello che ce l'ha |
> | Accento per categoria usato come **testo** su intestazione scura, con ripiego `#0d1522` (quasi nero): 1,13:1 | ~400 | `bsiAccentoLeggibile()` conserva la tinta e alza la luminosità quanto basta. Applicata nei 14 punti in cui l'accento viene scelto — non nei dati, così vale anche per le voci future |
> | Due tinte usate solo su fondo scuro, sotto soglia per poco (3,75:1 e 3,04:1) | 139 | Sostituite dopo aver **verificato** che non comparissero mai su fondo chiaro |
> | Zebratura di tabella bianco/scurissimo con testo sempre chiaro: le righe bianche erano illeggibili | 57 | Due toni scuri, coerenti col tema |
> | Celle della tavola periodica appena sotto soglia (4,46:1 e 3,88:1) | 43 | Testo a `#eceff4`, verificato su tutte e nove le categorie |
> | `"#var(--text)"` — un `#` di troppo rende il colore invalido: in SVG ripiega sul nero, in canvas l'assegnazione viene **ignorata** e resta il colore precedente | 8 punti | Sostituito col valore reale |
>
> **Il verso della correzione dipende dalla superficie, non dal colore.** Il
> primo tentativo schiariva sempre: ha tolto trenta difetti sull'intestazione
> scura e ne ha messi diciotto sul riquadro chiaro che usa lo stesso accento.
> La funzione ora scurisce sui fondi chiari e schiarisce su quelli scuri.
>
> **La coda finale: 80 → 0.** Gli ultimi ottanta erano dispersi su 33 cause
> distinte e sembravano lavoro di rifinitura. Non lo erano: sotto ce n'erano
> ancora tre strutturali.
>
> | Causa finale | Rimedio |
> |---|---|
> | **Il «correttore automatico di contrasto» produceva difetti invece di toglierli.** Usava la luminosità *percepita* al posto della luminanza WCAG, quindi le sue soglie non corrispondevano a nessun rapporto reale; **ignorava l'alfa**, così `rgba(255,180,84,.08)` su fondo scuro gli sembrava «fondo chiaro» e scuriva il testo a `#16273e` — creando un difetto a 1,21:1 sopra un sorgente che era già corretto; e guardava solo gli elementi con uno sfondo **proprio**, cioè mai il caso più comune | Riscritto: risale agli antenati **componendo l'alfa** per ottenere il fondo effettivo, misura il rapporto WCAG vero, e delega la correzione a `bsiAccentoLeggibile()` |
> | `--g900` vale `#0d1522` — **lo stesso di `--bg`**, esattamente come `--g800`: l'eredità di una scala di grigi nata per il tema *chiaro*, dove `--g900` era «il testo più scuro». Capovolto il tema, quel ruolo non esiste più | Gli usi come **colore del testo** (oggi 30 regole) passano a `--testo-forte`; i 16 usi come **sfondo** restano dove sono |
> | Un colore scelto dai dati usato come **sfondo** con il testo fissato a `#fff` nel codice: funziona finché la tinta è scura e smette appena qualcuno aggiunge `#e65100` | `bsiEtichettaLeggibile()` — il duale della funzione precedente: sceglie il testo guardando il fondo e, se nessuno dei due estremi basta, **scurisce il fondo conservando la tinta**, perché un'etichetta deve restare riconoscibile per colore |
>
> I passaggi misurati col banco ufficiale, non stimati: **80 → 27 → 26 → 10 → 4 → 0**.
> Ogni scalino è una rimisura completa su tutte le sezioni dopo un gruppo di
> modifiche; nessuna cifra qui sopra è attribuita a una causa singola, perché
> le cause non sono state misurate una per una.
>
> Il numero resta **registrato come riferimento** in
> `evidence/accessibilita-riferimento.json`. Zero non è un traguardo da
> archiviare: è il valore che il banco difende. Se una modifica futura ne
> reintroduce anche uno solo, la batteria **fallisce**.
>
> Resta fuori ciò che l'automatismo non può giudicare: il testo dentro gli SVG
> e quello su fondo a gradiente (D-09). Quegli elementi sono **contati** e
> riportati a ogni esecuzione, non taciuti.

---

## 4-bis. Difformità sanate con questa versione

Sono elencate perché riguardavano **l'apparato di verifica stesso**, e una
dichiarazione di conformità che taccia sui difetti della propria evidenza non
vale la carta su cui è scritta.

| # | Difformità sanata | Perché contava |
|---|---|---|
| **S-01** | 32 dei 39 banchi non erano nel repository: stavano nell'area di lavoro della sessione in cui erano stati scritti | Rendeva **falsa** la frase su cui poggia questo documento — «chiunque può rieseguirli». Chi clonava ne trovava 7 su 39. Ora stanno in `tools/banchi/` |
| **S-02** | Un banco assente veniva contato ma non faceva fallire la batteria | Una batteria in cui mancavano *tutti* i banchi avrebbe dichiarato «CONFORME» con zero fallimenti. Ora un banco assente rende l'esito **NON CONFORME** |
| **S-03** | `package.json` e `package-lock.json` erano esclusi dal repository | `npm install`, comando documentato per riprodurre l'evidenza, non installava nulla: la batteria falliva al primo banco con *Cannot find module* |
| **S-04** | La verifica di accessibilità ispezionava la sola sezione visibile | Su `index.html` significava una sezione su 87. Il «0 difetti» valeva per la Dashboard, non per l'applicazione |
| **S-05** | `SCI-10` era definito due volte nella matrice, e i totali di copertura erano errati (36 dichiarati su 37 definiti) | Il numero che un valutatore legge per primo era sbagliato. Un banco ora lo verifica |
| **S-06** | 50 collegamenti rotti su 127 nei pacchetti di consegna | Documentazione consegnata a terzi con riferimenti che non portavano da nessuna parte |
| **S-07** | 15 PDF allegabili fermi ai documenti 00-05 e a una versione precedente | Un allegato obsoleto afferma cose false con l'aria di essere autorevole |
| **S-08** | Il banco sulle affermazioni numeriche guardava **solo i documenti italiani** | La serie inglese derivava indisturbata: `docs/en/05` dichiarava «84 sections» con 87 sezioni nell'app, ed è rimasto fermo alla versione `bsi-v146` mentre il codice era alla 171. Ora l'insieme inglese è confrontato con la misura come quello italiano, e un disaccordo fra le due lingue fa fallire il banco |
| **S-13** | La traduzione inglese si fermava a 10 documenti su 16 | Un valutatore non italofono leggeva meno di due terzi della documentazione, e la parte mancante era quella operativa: modello dei dati, interfacce, deploy, specifiche funzionali, manuale. Tradotti tutti: l'insieme inglese è ora completo quanto l'italiano, e i due banchi sulla coerenza lo controllano allo stesso modo |
| **S-12** | La password del File Manager era rimasta in chiaro nella cronologia git | Toglierla dai file non la toglie dalla storia: `git log -p` la restituisce a chiunque, e finché quella password è in uso il deterrente non deterre nessuno. L'unico rimedio è **cambiarla**, ed è stato fatto: nel sorgente c'è solo la nuova impronta SHA-256, la vecchia password resta nella cronologia e non apre più niente. Verificato nel browser: la nuova apre, la vecchia no |
| **S-10** | SEC-02 — «nessun dato personale lascia il dispositivo» — era verificato controllando i due *meccanismi* di uscita, non l'uscita | Un controllo sui meccanismi dice «non vedo come potrebbe uscire», che non è «non è uscito». `audit_rete` semina un valore irripetibile in 71 depositi dei dati dell'utente, poi **usa** l'applicazione e ispeziona URL, intestazioni e corpo di ogni richiesta. Provato all'inverso con `BSI_PROVA_FUGA=1`, che provoca una fuga di proposito: il banco deve fallire, e fallisce |
| **S-11** | Il registro delle deviazioni non aveva la guardia opposta: una voce dichiarata che **non devia più** restava | Un'esenzione che nessuno revoca è un permesso acceso a vuoto, e domani coprirebbe in silenzio una struttura sbagliata messa al suo posto. Il banco ora fallisce anche per questo — verificato rimettendo una voce sanata |
| **S-09** | Il «correttore automatico di contrasto» **creava** i difetti che avrebbe dovuto togliere | Ignorava l'alfa: un fondo `rgba(255,180,84,.08)` su superficie scura gli sembrava chiaro, e scuriva con `!important` un testo che nel sorgente era già corretto. Uno strumento di rimedio che peggiora la cosa da rimediare è il difetto più difficile da vedere, perché si presenta come la soluzione |

---

## 5. Criteri di accettazione applicati

Una versione è pubblicata solo se **tutti** i criteri seguenti sono soddisfatti.

- [x] Nessun errore JavaScript non di rete su tutte le pagine
- [x] `tools/verifica-farmaci.js` — nessun difetto; ogni deviazione registrata
- [x] `verifica_guida` — nessuna promessa della documentazione priva di riscontro nel codice
- [x] Nessun marcatore di conflitto nei file tracciati
- [x] Versione della cache del Service Worker incrementata e allineata a `BSI_APP_VERSION`
- [x] Difformità note elencate al §4 di questo documento
- [x] Rapporto di evidenza rigenerato sul commit pubblicato
- [x] **Nessun banco assente** — un banco che non c'è non è un banco superato
- [x] `tools/genera-pacchetti.js` chiuso con **0 collegamenti rotti**
- [x] `tools/genera-pdf.js` rieseguito: gli allegati descrivono questa versione

---

## 6. Gestione delle modifiche

| Aspetto | Procedura |
|---|---|
| **Tracciabilità** | Ogni modifica passa da una pull request con descrizione del difetto, della causa e della verifica |
| **Versionamento** | La versione applicativa coincide con la versione della cache del Service Worker (`bsi-vNNN`), incrementata a ogni pubblicazione |
| **Distribuzione** | Automatica da `main` via GitHub Pages; il Service Worker segnala la nuova versione alle sessioni aperte senza interromperle |
| **Regressione** | La batteria completa è rieseguita prima di ogni unione in `main` |
| **Reversibilità** | Ogni versione corrisponde a un commit; il ripristino è un `git revert` |

---

## 7. Proprietà intellettuale e licenze

Tutti i componenti di terze parti sono distribuiti con licenze **permissive**
(MIT, BSD-3-Clause, CC0, Public Domain), reciprocamente compatibili e prive di
vincoli copyleft forti. La distinta completa, con impronte e obblighi residui, è
in [`07-SBOM.md`](07-SBOM.md) e nel formato CycloneDX
[`evidence/sbom.cdx.json`](evidence/sbom.cdx.json).

Il codice proprio del progetto è opera dell'autore.

---

## 8. Trattamento dei dati

L'applicazione è **local-first**: non esiste un backend, non vengono raccolti
dati personali e non è presente alcun identificativo persistente. I dati
generati dall'utente (note, chat, chiavi API, file caricati) restano nel
`localStorage` e nell'IndexedDB del dispositivo e sono cancellabili dalla stessa
interfaccia, in modo selettivo.

Le chiamate di rete sono opzionali e dirette a servizi pubblici documentati
(§4 di `07-SBOM.md`). Se l'utente configura il proxy, le chiavi API risiedono
sul Worker di sua proprietà e non sul dispositivo.

Dettaglio in [`03-Security-Privacy-Compliance.md`](03-Security-Privacy-Compliance.md).

---

## 9. Firma

Il presente documento è redatto dall'autore del software, che ne assume la
responsabilità. Non costituisce certificazione da parte di un organismo terzo, e
non viene presentato come tale.

Chiunque può verificare quanto dichiarato rieseguendo la procedura del §5 di
[`evidence/RAPPORTO-VERIFICA.md`](evidence/RAPPORTO-VERIFICA.md) sul commit
indicato, e confrontando le impronte SHA-256 dei file.

**Samuele Pio Provenzano**
_Versione `bsi-v174`._
