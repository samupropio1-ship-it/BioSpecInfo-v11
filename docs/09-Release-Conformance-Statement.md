# Dichiarazione di conformità di rilascio — BioSpecInfo

| Campo | Valore |
|-------|--------|
| **Software** | BioSpecInfo |
| **Versione** | `bsi-v169` |
| **Autore e responsabile del rilascio** | Samuele Pio Provenzano |
| **Repository** | `github.com/samupropio1-ship-it/BioSpecInfo-v11` |
| **Distribuzione** | GitHub Pages — `samupropio1-ship-it.github.io/BioSpecInfo-v11/` |
| **Natura del software** | Progressive Web App client-side, senza backend |

---

## 1. Oggetto della dichiarazione

Il sottoscritto dichiara che la versione `bsi-v169` di BioSpecInfo è stata
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
| **D-01** | 6 farmaci ad alta complessità molecolare senza struttura verificata (elencati in `evidence/deviazioni-note.json`) | Per queste voci non è disponibile la rappresentazione 2D/3D né la predizione spettrale | Voci lasciate **senza SMILES**: i dati farmacologici restano, la struttura non è mostrata. Preferito all'inserimento di una struttura non verificata. |
| **D-02** | 19 voci prive di SMILES per natura (anticorpi monoclonali, peptidi) | Nessuno: per queste molecole la notazione SMILES non è la rappresentazione appropriata | Non è una difformità sostanziale; elencata per completezza |
| **D-03** | Copertura automatica dei requisiti di sicurezza al 50 % | SEC-02 e parte di SEC-03 coperti da ispezione documentale, non da banco | Dichiarato in `docs/08` §6 |
| **D-04** | Password del File Manager presente nella cronologia git antecedente alla rimozione | Il deterrente è noto a chi consulti la cronologia | Documentato; rimedio effettivo: sostituzione della password |
| **D-05** | **276 difetti di contrasto e 40 campi privi di etichetta** in `index.html` | Testo sotto la soglia WCAG AA. Il caso peggiore residuo è 1:1 — testo dello stesso colore dello sfondo | Vedi il riquadro qui sotto: il numero è **registrato** in `evidence/accessibilita-riferimento.json` e il banco fallisce se cresce |
| **D-09** | Conformità WCAG 2.1 AA non verificabile integralmente in modo automatico | Restano fuori il testo negli SVG (6 758 elementi), quello su fondo a gradiente (892) e tutto ciò che richiede giudizio umano | Gli elementi saltati sono **contati** e riportati a ogni esecuzione |

> ### D-05 — come è emerso, e perché il numero è quello che è
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
> Oggi ne restano **276**: una riduzione del **74 %**, ottenuta risalendo alle
> cause comuni invece di ritoccare i colori uno per uno.
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
> I **276 restanti** sono una coda dispersa su 68 cause distinte, la più grande
> delle quali vale 24 difetti. Vanno esaminati uno per uno, e una sostituzione
> in blocco ne romperebbe altri — è già successo in questo progetto, con 997
> nuovi difetti introdotti da una correzione automatica.
>
> Il numero è **registrato come riferimento**. Il banco fallisce se cresce,
> passa se resta uguale, e segnala il miglioramento se scende. Non è
> conformità: è la misura onesta di quanto manca, con la garanzia che non
> peggiori di nascosto.
| **D-06** | Nessuna copertura di codice strumentata | Non è noto quale frazione del codice i 39 banchi eseguano | Dichiarato in `docs/08` §8. Strumentare richiederebbe introdurre una build, che l'applicazione non ha |
| **D-07** | Verifica su Chromium soltanto | Firefox e WebKit sono provati a mano | Dichiarato in `docs/08` §8 |
| **D-08** | Traduzione inglese limitata ai documenti 00-05 | Un valutatore non italofono legge 6 documenti su 16 | Dichiarato qui; i restanti sono disponibili in italiano |

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
_Versione `bsi-v169`._
