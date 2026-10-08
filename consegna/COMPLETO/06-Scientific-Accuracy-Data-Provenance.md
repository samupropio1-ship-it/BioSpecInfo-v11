# Accuratezza scientifica e provenienza dei dati — BioSpecInfo

| Campo | Valore |
|-------|--------|
| **Software** | BioSpecInfo |
| **Autore** | Samuele Pio Provenzano |
| **Versione descritta** | `bsi-v194` |
| **Scopo** | Documentare come vengono generati i dati scientifici mostrati dall'applicazione, con quale metodo sono verificati, e quali sono i limiti dichiarati. |

> **Perché questo documento esiste.** Un'applicazione didattica di chimica può
> essere ineccepibile dal punto di vista informatico e sbagliata dal punto di
> vista scientifico, e l'utente non ha modo di accorgersene: un peso molecolare
> plausibile, uno spettro dall'aspetto convincente e una struttura sbagliata si
> presentano tutti allo stesso modo. Questo documento descrive i controlli che
> rendono quell'errore **visibile e automatico**, e dichiara ciò che resta
> fuori dalla loro portata.

---

## 1. Principio: ogni dato scientifico deve poter essere contraddetto

Il criterio adottato in tutta l'applicazione è che un dato scientifico non si
consideri verificato perché *sembra* giusto, ma perché **esiste un secondo dato
indipendente che lo confermerebbe o lo smentirebbe**. Dove questo secondo dato
non esiste, il limite viene dichiarato invece di essere colmato con una stima
presentata come misura.

Tre applicazioni concrete di questo principio:

| Ambito | Prima affermazione | Seconda affermazione indipendente | Controllo |
|---|---|---|---|
| Banca dati farmaci | struttura (SMILES) | peso molecolare di letteratura | il peso ricalcolato dalla struttura deve coincidere |
| Spettri IR / NMR | gruppi funzionali riconosciuti | struttura molecolare via RDKit | i gruppi si cercano sul grafo, non sul testo dello SMILES |
| Costanti fisiche | valore tabulato | simbolo e unità di misura | la ricerca rifiuta le corrispondenze ambigue invece di sceglierne una |

---

## 2. Banca dati farmacologica — 263 voci

### 2.1 Il metodo di verifica

Ogni voce dichiara **due** proprietà della stessa molecola: la struttura, in
notazione SMILES, e il peso molecolare. Sono affermazioni indipendenti — la
prima descrive la connettività atomica, la seconda è un numero preso dalla
letteratura — e quindi confrontabili:

```
peso calcolato da RDKit sulla struttura   ⟷   peso dichiarato in tabella
```

Uno scarto superiore a **0,6 u** (tolleranza che copre gli arrotondamenti e le
piccole differenze fra tabelle di masse atomiche, ma non un errore reale, che
vale decine di unità) indica che almeno una delle due affermazioni è sbagliata.

Il controllo è automatizzato (`tools/verifica-farmaci.js`, eseguibile da chiunque
disponga del repository) e non richiede giudizio umano:
non chiede di fidarsi di nessuna fonte, confronta due numeri.

### 2.2 Cosa ha trovato

Applicato alle 143 voci preesistenti, il controllo ha individuato **89 errori**.
La distribuzione è significativa: i **pesi molecolari erano corretti** — presi
dalla letteratura — mentre le **strutture erano sbagliate**.

| Farmaco | Struttura dichiarata |
|---|---|
| Ketamina | un pirrolidinone non correlato |
| Morfina | struttura non corrispondente (in due voci distinte) |
| Lorazepam | privo dell'ossidrile in posizione 3, che ne definisce l'identità |
| Atorvastatina | privo del gruppo anilidico |
| Testosterone | privo del doppio legame Δ⁴ dell'anello A |

Più **7 farmaci duplicati** in categorie diverse, con dati talvolta divergenti
fra le due copie.

### 2.3 Lo scarto come strumento diagnostico

Il valore numerico della differenza non è solo un allarme: indica **quale**
frammento manca o è di troppo.

| Δ (u) | Interpretazione | Caso reale |
|---|---|---|
| 28,05 | C₂H₄ | ketamina, fentanil, morfina |
| 16,00 | un atomo di ossigeno | tetraciclina (un ossidrile in più) |
| 14,02 | un gruppo CH₂ | doxiciclina |
| 2,02 | un doppio legame mancante | testosterone (Δ⁴) |
| 0,98 | citosina ⟷ uracile | **sofosbuvir** |

L'ultimo caso merita una nota: lo scarto di 0,98 u corrisponde esattamente alla
sostituzione di un gruppo −NH con un atomo di ossigeno, cioè alla differenza fra
citosina e uracile. Il sofosbuvir è un analogo dell'**uridina**, e la struttura
proposta conteneva la base sbagliata. Il numero ha indicato dove guardare.

### 2.4 Stato attuale e limiti dichiarati

| | |
|---|---|
| Farmaci in banca dati | **263** (erano 233) |
| Con struttura leggibile | **242** |
| Con provenienza esterna verificata | **36** |
| Difetti | **0** |
| Voci senza struttura, con ragione dichiarata | **21** |

La verifica è **conforme**: nessuna voce presenta una struttura che contraddica
il proprio peso molecolare. Le 21 deviazioni sono voci **prive di struttura**,
ciascuna registrata con il proprio motivo in
[`evidence/deviazioni-note.json`](evidence/deviazioni-note.json) e riportata nel
rapporto di verifica.

**Difetto contro deviazione.** Il controllo distingue due situazioni che non
vanno confuse:

- una struttura che **contraddice** il proprio peso è un difetto, e fa fallire
  la verifica;
- una struttura **assente** può essere una deviazione accettabile — ma solo se
  registrata esplicitamente, con il motivo. Una voce priva di struttura e **non**
  registrata fa fallire la verifica come qualunque altro difetto.

Registrare una deviazione è quindi una decisione consapevole, tracciata in git e
visibile nel rapporto, non un modo per silenziare un controllo.

E va anche **revocata** quando non serve più. Dalla versione `bsi-v188` il banco
fallisce anche nel caso opposto: una voce elencata nel registro che **ha** una
struttura verificata è un permesso rimasto acceso a vuoto, e domani coprirebbe
in silenzio una struttura sbagliata messa al suo posto.

### 2.4-bis Quattro voci uscite dal registro

Delle sei voci senza struttura, quattro sono state chiuse riprendendo la
struttura da **ChEMBL** — una fonte indipendente da questo progetto — e
verificandola con lo stesso confronto struttura ⟷ peso molecolare che vale per
tutte le altre.

| Voce | ChEMBL | Formula | Peso dichiarato | Peso calcolato |
|---|---|---|---:|---:|
| Digossina | `CHEMBL1751` | C₄₁H₆₄O₁₄ | 780,94 | 780,95 |
| Vincristina | `CHEMBL90555` | C₄₆H₅₆N₄O₁₀ | 824,96 | 824,97 |
| Tacrolimus topico (Protopic) | `CHEMBL269732` | C₄₄H₆₉NO₁₂ | 804,02 | 804,03 |
| Tacrolimus sistemico (Prograf) | `CHEMBL269732` | C₄₄H₆₉NO₁₂ | 804,02 | 804,03 |

Il motivo registrato per la digossina diceva «ogni struttura provata si discosta
di 14-30 u dal peso di letteratura»: il peso dichiarato era giusto, erano le
strutture provate a essere sbagliate. Che il confronto sia reale e non
compiacente si vede aggiungendo un solo carbonio alla struttura corretta — il
banco segnala **Δ 14,04** e fallisce.

**Le due che restano non sono molecole singole**, e nessuna notazione SMILES le
rappresenta:

- **Ivermectina** è una miscela di omologhi: almeno 80 % di B1a (C₄₈H₇₄O₁₄) e non
  più del 20 % di B1b (C₄₇H₇₂O₁₄). Il peso dichiarato, 875,10, è quello del solo
  componente B1a. Mostrarne la struttura farebbe passare l'omologo maggioritario
  per l'intero farmaco.
- **Artemetere/Lumefantrina (Coartem)** è l'associazione di due principi attivi
  distinti.

In entrambi i casi non manca una struttura: non ce n'è una sola da mostrare.

### 2.4-ter Trentasei voci con la provenienza scritta nel dato (bsi-v188)

Il confronto struttura ⟷ peso è necessario ma non sufficiente, e si è visto
dove cede. Le trentasei voci aggiunte in `bsi-v188` portano nel dato stesso
l'identificativo ChEMBL e la formula del record (`chembl:`, `formula:`), e per
ognuna la formula viene **ricostruita contando gli atomi del grafo** che RDKit
legge dallo SMILES — idrogeni impliciti compresi — e confrontata con quella
dichiarata da ChEMBL: **36 su 36 coincidono**. I dati grezzi stanno in
[`tools/dati/farmaci_v187.json`](https://github.com/samupropio1-ship-it/BioSpecInfo-v11/blob/main/tools/dati/farmaci_v187.json).

**Dove il peso non vedeva.** Sei di quelle voci esistevano già, scritte prima
che la provenienza esterna fosse un requisito. Confrontando le due versioni con
la **chiave InChI** che ChEMBL dichiara, tre si sono rivelate una molecola
diversa:

| Voce | chiave della versione precedente | chiave dichiarata da ChEMBL |
|---|---|---|
| Lenalidomide | `XKAYAFBLGLCWSY` | `GOTYRUGSSMKFNF` |
| Palbociclib | `PSRAOXPOEYRNJN` | `AHJRHEGDXFFMBM` |
| Aripiprazolo | `ZGXTVHHDFYTYTL` | `CEUORZQYGODEFX` |

Erano **isomeri**: stessa formula bruta, stesso peso molecolare, posizione
diversa di un azoto o di un carbonile. Il controllo struttura ⟷ peso — che
esisteva, girava a ogni rilascio e passava — non poteva vederlo, perché un
isomero pesa esattamente uguale. Serviva un testimone che guardasse la
**connettività**, non la massa. Le tre voci sono state rimosse e sostituite da
quelle verificate; le altre tre differivano solo nella scrittura canonica dello
SMILES e descrivevano la stessa molecola.

**Due strutture rifiutate.** Nella stessa raccolta, l'**ivermectina** ha
`structure_type NONE` nel proprio record ChEMBL — conferma esterna del limite
già dichiarato in §2.4-bis — e la **semaglutide** è registrata come proteina,
`structure_type SEQ`. Entrambe si sarebbero potute scrivere a memoria. È
esattamente ciò che non si fa: una struttura senza fonte entra nel sito
indistinguibile da una verificata, e da lì in poi nessun controllo le
distingue.

**Due nomi tenuti con il nome del record.** La ricerca per nome di ChEMBL è a
corrispondenza parziale: «morphine» ha restituito l'**apomorfina** e
«levothyroxine» la **liotironina** (T3), trovata fra i sinonimi. Le voci sono
state tenute con il nome che il record porta, non con quello della domanda:
il contrario avrebbe messo una scheda clinica sbagliata sopra una struttura
giusta — l'errore più difficile da trovare, perché ogni controllo automatico
sulla struttura continuerebbe a passare.

| Gruppo | Voci | Natura |
|---|---:|---|
| **D-01** — non sono molecole singole | 2 | ivermectina (miscela di omologhi B1a/B1b) e artemetere/lumefantrina (associazione di due principi attivi). Erano sei: le altre quattro sono state chiuse con la struttura da ChEMBL, vedi §2.4-bis. |
| **D-02** — non rappresentabili in SMILES | 19 | anticorpi monoclonali, proteine e peptidi (trastuzumab, pembrolizumab, insulina, semaglutide, ciclosporina A…). L'assenza è corretta, non una lacuna. |

> La scelta è deliberata: un dato sbagliato sostituito da un altro dato
> sbagliato non è un progresso, e l'assenza dichiarata è preferibile a una
> presenza non verificata.

---

## 3. Predizione spettrale

### 3.1 Riconoscimento strutturale, non testuale

I gruppi funzionali sono individuati con **pattern SMARTS applicati al grafo
molecolare** tramite RDKit (`bsi-spettri.js`), non con espressioni regolari
applicate alla stringa SMILES.

La differenza non è stilistica. Il metodo testuale precedente presentava due
difetti strutturali:

1. **Esclusività.** I controlli erano organizzati in catene `else if`, per cui
   veniva riconosciuto **un solo gruppo funzionale per molecola**.
2. **Cecità alla struttura.** Una regex legge caratteri, non legami.

Il caso emblematico è l'**acido acetilsalicilico** (`CC(=O)Oc1ccccc1C(=O)O`),
che contiene sia un estere sia un acido carbossilico. Il riconoscimento testuale
identificava solo l'estere; lo spettro IR risultante era privo della banda O–H
allargata a ~3000 cm⁻¹ e del C=O acido a ~1690 cm⁻¹ — le due bande che
identificano la molecola — e lo spettro ¹H NMR era privo del segnale del
protone carbossilico a 11,6 ppm.

Il riconoscimento su grafo è **additivo per costruzione**: una molecola può
presentare tutti i gruppi che possiede.

### 3.2 Convenzioni di rappresentazione

Le convenzioni degli assi non sono uniformi fra le tecniche, e sono verificate
automaticamente (`test_assi.js`, `test_assi_canvas.js`) estraendo le etichette
delle tacche dal disegno prodotto:

| Tecnica | Ascissa | Verso | Ordinata |
|---|---|---|---|
| IR | numero d'onda (cm⁻¹) | decrescente, 4000 → 400 | **trasmittanza %**, bande verso il basso |
| ¹H NMR | δ (ppm) | decrescente, 14 → 0 | intensità, riferimento TMS a 0 |
| UV-Vis | λ (nm) | crescente, 200 → 400 | assorbanza |
| MS | m/z | crescente | abbondanza relativa |

### 3.3 Determinismo

Nessuno spettro contiene componenti casuali. Le versioni precedenti aggiungevano
rumore pseudo-casuale alla traccia a ogni ridisegno, con la conseguenza che la
stessa molecola produceva ogni volta uno spettro diverso e due spettri non
erano confrontabili. Un profilo calcolato deve essere **riproducibile**: dove
serve un fondo realistico si usa una funzione deterministica del numero d'onda.

Analogamente, nel predittore NMR le altezze dei picchi erano generate
casualmente. In uno spettro ¹H l'altezza **è** l'informazione quantitativa —
l'integrazione — e inventarla è peggio che ometterla. Attualmente:

- dove il numero di protoni è noto, l'altezza è l'integrazione reale e
  l'etichetta la riporta (es. `7,26 (4H)`);
- dove la predizione è un **intervallo** (es. «6,5–8,5 ppm»), si disegna la
  fascia dell'intervallo con un segno sul valore tipico e altezza uniforme: il
  grafico indica *dove* cade il segnale senza affermare quanto sia intenso.

### 3.4 Effetti chimici modellati

| Effetto | Implementazione |
|---|---|
| Coniugazione del carbonile | abbassamento di ~25 cm⁻¹ applicato **al singolo carbonile**, non globalmente |
| Estere fenolico | innalzamento a ~1760 cm⁻¹ |
| Intensità C–H | proporzionale al numero di gruppi CH₂/CH₃ presenti |
| Sostituzione dell'anello aromatico | bande "fuori dal piano" 900–690 cm⁻¹ distinte per orto/meta/para/mono |
| Doppietto di Fermi delle aldeidi | bande a 2820 e 2720 cm⁻¹ |
| Bande ammidiche I e II | 1655 e 1550 cm⁻¹ |

Verifica: l'acido acetilsalicilico produce estere arilico a 1760 cm⁻¹ e acido
coniugato a 1690 cm⁻¹ — i due valori che lo identificano — mentre acetofenone
(chetone coniugato, 1690) e acetato di etile (estere non coniugato, 1735)
confermano che l'effetto è applicato in modo selettivo e non indiscriminato.

### 3.5 Limiti dichiarati

> Gli spettri prodotti sono **predizioni basate su tabelle di gruppi
> funzionali**, non spettri misurati né simulazioni quantomeccaniche. Indicano
> dove cadono le bande dei gruppi presenti, con posizioni e intensità
> tabulate. **Non sostituiscono un database sperimentale** (SDBS, NIST) né una
> misura strumentale, e il grafico lo dichiara.

In particolare non sono modellati: accoppiamenti spin-spin del secondo ordine,
effetti di solvente e concentrazione, bande di combinazione e sovratoni,
polimorfismo allo stato solido.

---

## 3-bis. Chemioinformatica e modelli QSAR

### 3-bis.1 Da dove vengono i metodi

Nessuno dei metodi della sezione **Chemioinformatica** è inventato per
l'occasione. Sono quelli in uso, con i riferimenti che li definiscono.

| Metodo | Riferimento | Come è implementato qui |
|---|---|---|
| **Coefficiente di Tanimoto** | Rogers & Tanimoto, 1960 | Bit in comune su bit in unione, con la convenzione 0/0 = 1 dichiarata nel codice |
| **Impronte di Morgan / ECFP** | Rogers & Hahn, *J. Chem. Inf. Model.* 50 (2010) 742 | Da RDKit MinimalLib, raggio 2, 2048 bit |
| **Chiavi MACCS** | Durant *et al.*, *J. Chem. Inf. Comput. Sci.* 42 (2002) 1273 | Da RDKit MinimalLib, 166 chiavi |
| **Regola dei 5** | Lipinski *et al.*, *Adv. Drug Deliv. Rev.* 23 (1997) 3 | Sui descrittori RDKit, con il conteggio delle violazioni |
| **Filtro di Veber** | Veber *et al.*, *J. Med. Chem.* 45 (2002) 2615 | Legami ruotabili ≤ 10, TPSA ≤ 140 Å² |
| **QED** | Bickerton *et al.*, *Nat. Chem.* 4 (2012) 90 | **Ricalcolato**: MinimalLib espone 43 descrittori ma non il QED. I parametri delle funzioni desiderabilità sono quelli dell'articolo |
| **Raggruppamento di Butina** | Butina, *J. Chem. Inf. Comput. Sci.* 39 (1999) 747 | Soglia sulla distanza di Tanimoto, capifila scelti per numero di vicini |
| **Scheletri di Bemis–Murcko** | Bemis & Murcko, *J. Med. Chem.* 39 (1996) 2887 | Sistemi ad anello più i legami che li collegano |
| **PAINS** | Baell & Holloway, *J. Med. Chem.* 53 (2010) 2719 | Sottoinsieme dei pattern SMARTS, con il motivo della segnalazione |
| **Allarmi di Brenk** | Brenk *et al.*, *ChemMedChem* 3 (2008) 435 | Idem |
| **SALI** | Guha & Van Drie, *J. Chem. Inf. Model.* 48 (2008) 646 | Δattività / (1 − Tanimoto), sulle coppie sopra la soglia di similarità |

### 3-bis.2 Le quattro cose che rendono un QSAR onesto

Un modello QSAR è facilissimo da far sembrare buono. Le quattro precauzioni qui
sotto sono quelle che distinguono un numero da una misura, e sono tutte
verificate dal banco `test_cheminfo`.

**Divisione per scheletro.** Con una divisione casuale, analoghi stretti della
stessa serie finiscono da entrambe le parti: il modello ritrova ciò che ha già
visto. La divisione per scheletro raggruppa le molecole per scheletro di
Bemis–Murcko e assegna **scheletri interi** a una sola parte. L'R² che ne esce
è più basso — ed è quello che sopravvive alla molecola nuova.

**Modello nullo per rimescolamento.** Lo stesso modello viene riaddestrato otto
volte su etichette mescolate. Se il punteggio vero non supera il migliore dei
sosia, il modello non ha imparato nulla di trasferibile, e il pannello lo
dichiara con quelle parole. È il controllo che manca più spesso: senza di esso,
un R² di 0,4 su trenta molecole è indistinguibile dal caso.

**Dominio di applicabilità.** Una predizione su una molecola lontana da tutto
ciò che il modello ha visto è un'estrapolazione, non una predizione. La
distanza dal vicino più prossimo nell'insieme di addestramento è mostrata
accanto a ogni valore predetto.

**Validazione incrociata raggruppata per scheletro.** Una divisione sola, su un
insieme piccolo, è un numero rumoroso: su 28 molecole al 25 % l'insieme di
prova ne contiene sette, e spostarne una muove l'R² di decimi. Le pieghe
raggruppano per scheletro — nessuno scheletro sta in due pieghe — e il
risultato viene dato come **media ± deviazione**, non come cifra singola.

> **Quanto conti, misurato sull'esempio dei 28 inibitori.** La divisione
> singola dà R² **0,861**. La validazione a cinque pieghe dà **0,605 ± 0,452**,
> con le singole pieghe a 0,861 · 0,538 · 0,795 · **−0,150** · 0,980. La
> divisione singola aveva pescato la piega fortunata. Le due cifre insieme
> dicono quello che nessuna delle due dice da sola: il modello funziona, ma
> dipende sensibilmente da quali molecole gli capitano in addestramento —
> e su un insieme di ventotto molecole è esattamente ciò che ci si deve
> aspettare.

### 3-bis.3 Limiti dichiarati

| Limite | Conseguenza |
|---|---|
| Gli insiemi di esempio sono **piccoli** (28 e 40 molecole) | Servono a mostrare il metodo, non a produrre un modello utilizzabile. Su insiemi così, il modello nullo è la sola difesa seria — ed è il motivo per cui c'è |
| Il modello è **lineare nel kernel** (kernel ridge, kernel di Tanimoto) o logistico | Nessuna rete neurale, nessun gradient boosting: sono metodi che su poche centinaia di molecole non danno un vantaggio dimostrabile, e il costo sarebbe un modello che non si può ispezionare |
| I **PAINS non sono una condanna** | Un pattern PAINS segnala che il composto è stato spesso un falso positivo in saggi di fluorescenza, non che sia inattivo. Il pannello lo scrive accanto a ogni segnalazione |
| La **PCA è sui descrittori**, non sulle impronte | Sulle impronte binarie la PCA è poco informativa; i carichi sui descrittori si leggono, e sono mostrati |
| Non c'è **ricerca di sottostruttura su larga scala** | Il banco di lavoro è dimensionato per gli insiemi che si incollano a mano, non per una libreria da milioni di composti |

---

### 3-bis.4 Due superfici, due ruoli — e un numero che era falso

L'applicazione ha **due** luoghi in cui si fa chemioinformatica, e servono a
cose diverse. La distinzione è scritta qui perché un valutatore che apra prima
la pagina sbagliata si farebbe l'idea sbagliata.

| | `rdkit_lab.html` — «RDKit Lab» | Sezione **Chemioinformatica** |
|---|---|---|
| **A chi serve** | Chi studia: una molecola alla volta, per vedere cosa RDKit sa dirne | Chi lavora: un insieme di molecole, per ricavarne un modello difendibile |
| **Ingresso** | Uno SMILES | Un insieme incollato, con l'attività misurata |
| **QSAR** | Stime **empiriche** dai descrittori, dichiarate tali nel pannello | Modello **addestrato** sui dati forniti, con divisione per scheletro, validazione incrociata e controllo nullo |
| **Uscita** | Quello che si vede a schermo | CSV e rapporto di metodo |

> **Un numero che era falso, e come se n'è accorto il banco.** Il pannello
> «Pharma Pro» del laboratorio confrontava la molecola con otto farmaci di
> riferimento e mostrava una percentuale di similarità. Quella percentuale non
> veniva da un fingerprint: veniva da **otto bit di descrittori a soglia** —
> «ha anelli aromatici», «HBA > 4», «peso fra 200 e 500» — di cui si calcolava
> il Tanimoto. Misurato: **caffeina contro metformina dava 0,75**, mentre su
> fingerprint di Morgan vale **0,024**. Due molecole senza frammenti in comune,
> mostrate al 75 %, su una pagina che si chiama «RDKit Lab» e dove RDKit era
> già caricato.
>
> Accanto a quello, tre delle otto impronte di riferimento erano **scritte a
> mano** e avevano il bit «aromatico» sbagliato (caffeina, che ha due anelli
> aromatici, morfina e amoxicillina che ne hanno uno), e lo **SMILES
> dell'omeprazolo non era omeprazolo**: `COc1ccc2[nH]c(=S)cc2c1OC` è una
> struttura che RDKit rifiuta.
>
> Corretto tutto: il confronto usa il fingerprint di Morgan con il Tanimoto del
> motore condiviso, le impronte si calcolano invece di essere battute a
> tastiera, e l'omeprazolo è l'omeprazolo (massa monoisotopica 345,11, tre
> anelli aromatici — verificate). Le due funzioni della similarità finta sono
> state **rimosse**, non scavalcate: lasciarle in giro le avrebbe rimesse in
> uso alla prima modifica, e il banco controlla che non esistano più.

**Una sola implementazione di Tanimoto.** Il laboratorio ne aveva una propria,
che concordava con quella del motore sui casi normali ma rispondeva 0 dove il
motore risponde 1 (il caso di due impronte vuote). Ora la pagina carica
`bsi-cheminfo.js` e chiama quello: `test_cheminfo` confronta le due strade su
tutte e 28 le coppie di riferimento e pretende scarto **esattamente zero**.

---

## 3-ter. Il testo alternativo delle figure non si inventa

La guida di biochimica porta **98 figure**. Sostituendola, il banco di
accessibilità l'ha bocciata: nessuna aveva un attributo `alt`.

La via comoda era `alt=""`, e il banco l'avrebbe accettata — il commento nel
suo codice dice, correttamente, che per un'immagine **decorativa** è la cosa
giusta: dice allo screen reader di saltarla. Ma queste sono figure di
biochimica, cioè informazione. Marcarle come decorative avrebbe fatto passare
il controllo dicendo a chi usa uno screen reader di ignorare 98 diagrammi: un
verde vuoto, della stessa famiglia del «contrasto 0» che non copriva i pannelli
nuovi (§3-bis) e del 100 % di copertura che sommava gli intervalli sbagliati.

La via onesta era a disposizione: ogni immagine sta dentro un `<figure>` con la
sua `<figcaption>`, e **le didascalie le ha scritte l'autore del documento**.

| | |
|---|---|
| Figure | 62, per 98 immagini |
| Figure con una sola immagine | 26 — l'alt è la didascalia, meno l'etichetta «Figura N.» |
| Figure con due pannelli | 36 |
| Didascalie di coppia divise fra i due pannelli | **33 su 36** |
| Coppie con didascalia condivisa | 3 — non si dividono in modo inequivocabile |

Le 36 didascalie di coppia distinguono tutte i due pannelli con «a sinistra» e
«a destra»: dove la divisione è inequivocabile, ogni immagine riceve la propria
metà della frase. Dove non lo è, le due immagini condividono la didascalia
intera — verboso da ascoltare, ma **non può essere sbagliato**, e una
descrizione sbagliata di una figura è peggio di una verbosa.

> **Perché non tentare una divisione più aggressiva.** Si potevano spremere
> anche le 3 restanti con espressioni regolari più elastiche. Una divisione che
> sbaglia produce la frase «questa immagine mostra X» accanto a un'immagine che
> mostra Y, e lo screen reader la legge con la stessa sicurezza di quelle
> giuste. Il ripiego è rumoroso; l'errore è invisibile.

Misurato dopo l'intervento: **98 su 98 con testo alternativo, nessuno vuoto**,
contrasto **0** su 1 897 elementi di testo.

---

## 3-quater. Da prototipo a strumento di lavoro

Le funzioni descritte in §3-bis bastavano a dire qualcosa di difendibile su un
insieme di molecole. Non bastavano a **lavorarci**: un gruppo di
chemioinformatica, il primo giorno, chiede di cercare una sottostruttura su
tutto l'insieme, di vedere la tabella SAR, e di sapere che cosa succede
all'attività se sostituisce un cloro con un metile.

### 3-quater.1 Che cosa la libreria aveva, e che cosa non ha

Prima di progettare si è **sondata** MinimalLib 2025.03.4 all'esecuzione,
invece di assumere. Sondare per primo ha cambiato il progetto: tre delle
capacità qui sotto non erano state usate perché non si sapeva che ci fossero.

| C'è | A cosa serve |
|---|---|
| `SubstructLibrary` | Ricerca per sottostruttura con pattern fingerprint: scarta in blocco le molecole che non possono corrispondere, invece di provare l'isomorfismo su ognuna |
| `get_rxn` · `Reaction.run_reactants` | Trasformazioni chimiche. È ciò che permette di **tagliare** un legame, e da lì vengono coppie corrispondenti e tabella SAR |
| `generate_aligned_coords` | Allineare le molecole a un nucleo comune |
| `get_molblock` · `get_v3Kmolblock` | Esportazione **SDF**, il formato con cui si scambiano insiemi fra gruppi e programmi |

| Non c'è | Conseguenza dichiarata |
|---|---|
| `cleanup`, `neutralize` | La standardizzazione si ferma al frammento maggiore e allo SMILES canonico: **le cariche non vengono neutralizzate** |
| `canonical_tautomer` | Due tautomeri scritti in modo diverso restano due voci distinte |
| `FragmentOnBonds`, `RWMol` | Nessuna modifica diretta delle molecole: il taglio passa per una reazione |
| Sottostruttura massima comune (MCS) | Il nucleo di una tabella SAR va **fornito**, non viene dedotto. Il pannello offre otto nuclei pronti e il campo libero |

### 3-quater.2 Il taglio, e perché ne servono due regole

Una reazione SMARTS spezza un legame e marca i due capi con un atomo fittizio.
Verificato all'esecuzione: `CCOc1ccccc1` dà tre tagli con la regola fine
(CH₃–CH₂, CH₂–O, O–arile) e due con quella grossa; il benzene e il metano non
ne danno nessuno.

| Regola | Taglia | Quando serve |
|---|---|---|
| **fine** (predefinita) | Qualunque legame singolo aciclico, **compresi i sostituenti terminali** Cl, CH₃, OH, F | Tabella SAR e trasformazioni fini (Cl → CH₃) |
| **grossa** (stile BRICS) | Esclude gli atomi terminali | Insiemi grandi, dove i tagli fini sono troppi; produce parti variabili più grandi («clorofenile → fenile») |

> **La regola fine è nata da un difetto.** La prima stesura usava solo quella
> grossa, e la tabella SAR della serie di prova **perdeva il cloro
> sull'anello**: trovava il sostituente sull'azoto e mancava proprio la colonna
> che interessa, perché il cloro è terminale. La regola fine è un soprainsieme
> della grossa: ogni taglio che la grossa trova, lo trova anche la fine.

### 3-quater.3 Coppie molecolari corrispondenti

Due molecole formano una coppia quando, tagliando un legame in ciascuna,
restano con lo **stesso contesto** e due parti variabili diverse. La differenza
di attività è attribuita a quella sostituzione e a nient'altro — ed è il motivo
per cui questa lettura batte una correlazione su tutto l'insieme, che media su
molecole diverse per dieci cose.

Verificata su una serie **costruita con effetti noti**: se l'analisi non li
ritrova non è utilizzabile su dati veri.

| Trasformazione | Attesa | Trovata | Coppie concordanti |
|---|---:|---:|---|
| clorofenile → fenile | −1,0 | **−1,0** | 2 su 2 |
| metilfenile → fenile | −0,5 | **−0,5** | 2 su 2 |
| metile → cloro | +0,5 | **+0,5** | 2 su 2 |
| etilammide → propilammide | +0,2 | **+0,2** | 3 su 3 |

Sui 28 inibitori dell'esempio, presi da ChEMBL: **449 coppie, 98
trasformazioni** viste almeno due volte, 199 viste una sola, in 133 ms. In
cima alla lista **CF₃ → SO₂NH₂ con Δ mediano −2,65** su due coppie concordanti.

Due scelte dichiarate:

- la **direzione è normalizzata** sull'ordine alfabetico delle due parti.
  Senza di essa lo stesso effetto comparirebbe due volte, con mediane opposte,
  e nessuna delle due avrebbe il numero di coppie giusto;
- le trasformazioni viste **meno di due volte** sono escluse dalla tabella e
  contate a parte. Una trasformazione vista una volta con Δ = +3 non è una
  scoperta: è un aneddoto, e metterla in cima farebbe prendere decisioni su di
  essa.

> **La colonna «concordi» è quella che decide se fidarsi.** Una mediana di
> +1,0 su tre coppie di cui una a −2,0 non è la stessa cosa di +1,0 su tre
> coppie tutte positive, e la mediana da sola non lo dice.

### 3-quater.4 La tabella SAR, e come si trova la posizione

Il punto difficile non è trovare i sostituenti: è sapere in quale **posizione**
sta ognuno. Senza MCS e senza modifica delle molecole, la soluzione sfrutta una
proprietà del taglio: **il frammento che contiene il nucleo porta l'atomo
fittizio esattamente nel punto di attacco**. Facendo corrispondere il nucleo a
quel frammento si scopre su quale suo atomo è appeso il fittizio, e quindi quale
posizione occupa il sostituente.

Ne viene anche un filtro necessario e gratuito: se il fittizio **non** è
attaccato a un atomo del nucleo, il taglio è avvenuto dentro un sostituente e
quel pezzo non è il sostituente intero. Si scarta.

Sui 28 inibitori, con nucleo benzamidico: **20 molecole con il nucleo, 2
posizioni, 8 escluse**. Le escluse non compaiono in tabella: metterle con le
celle vuote le farebbe sembrare parte della serie con sostituenti non trovati.

> **Un difetto di denominazione, e come si è manifestato.**
> `scaffoldMurcko()` restituiva il suo risultato in un campo chiamato
> `smiles`, ma quel valore **non è uno SMILES**: è un'impronta canonica dello
> scheletro, costruita perché due molecole con lo stesso scheletro producano la
> stessa stringa. Serve a raggruppare — pieghe, divisione per scaffold — non a
> interrogare. Il pannello SAR lo ha preso per uno SMILES e proponeva
> `6,6,6,6,7,…|0-13:1,…` come nucleo; la decomposizione rispondeva «nucleo non
> interpretabile».
>
> Il campo si chiama ora `chiave` e dichiara `eUnoSmiles: false`; `smiles`
> resta come alias. Il banco fissa che due scheletri uguali diano la stessa
> chiave, che scheletri diversi diano chiavi diverse, e che la chiave **non si
> rilegga come SMILES**. Il nome sbagliato di un campo è un difetto come un
> altro.

### 3-quater.5 Il rigore che un valutatore pretende

Cinque cose che un gruppo di modellistica mette in ogni rapporto, e la cui
assenza è la prima obiezione in riunione.

| | Metodo | Perché |
|---|---|---|
| **Confronto fra modelli** | Riferimento banale (predire la media), kNN su Tanimoto, regressione kernel — tutti sulle **stesse pieghe** raggruppate per scheletro | Confrontare un modello valutato su una divisione con un altro valutato su un'altra non è un confronto. E il riferimento banale sta in cima all'elenco, perché è il numero che ogni altro deve battere |
| **Validazione annidata** | Gli iperparametri (k, lambda) si scelgono su pieghe **interne all'addestramento** | Provarne dieci sull'insieme di prova e riportare il migliore gonfia il punteggio: quel numero non è una predizione, è il massimo di dieci tentativi |
| **Intervalli conformi** | Split-conformal, quantile ⌈(n+1)(1−α)⌉ dei residui assoluti su una porzione di calibrazione **divisa per scaffold** | «7,2» e «7,2 ± 0,3» sono due informazioni diverse, e solo la seconda dice se vale la pena sintetizzare. Una calibrazione su analoghi dell'addestramento darebbe intervalli troppo stretti proprio sulle molecole nuove |
| **Arricchimento** | EF a 1 %, 5 %, 10 % con il **massimo possibile** accanto; BEDROC (Truchon & Bayly, *J. Chem. Inf. Model.* 47 (2007) 488) | In uno screening non si guarda tutta la lista. Un ROC-AUC di 0,80 può nascondere una testa di lista senza un solo attivo, perché l'AUC premia anche l'ordine nella coda, che nessuno comprerà |
| **Curva di apprendimento** | Punteggio al variare della dimensione dell'addestramento, con l'insieme di prova **intero** a ogni punto | Risponde alla sola domanda che conta quando il modello è mediocre: serve più chimica o più dati? |

**Il verdetto del confronto è provato nei due versi**, come il modello nullo.
Su un segnale vero — attività proporzionale al numero di alogeni, su dieci
nuclei distinti — la regressione kernel arriva a R² 0,943 con margine 0,943
contro una dispersione di 0,035, e il verdetto è *supera*. Sulle **stesse
molecole con etichette casuali** il migliore si ferma a −0,265, margine −0,034,
e il verdetto è *non supera*. Una guardia che non scatta mai e una che scatta
sempre sono lo stesso difetto.

L'arricchimento è verificato sui tre casi in cui il valore giusto si calcola a
mano:

| Ordinamento (2 attivi su 10) | AUC | EF@20 % | BEDROC |
|---|---:|---:|---:|
| Perfetto: i due attivi in testa | 1 | **5** — ed è il massimo possibile | **1** |
| Pessimo: i due attivi in coda | 0 | 0 | **0**, non un negativo |
| Attivi ai ranghi 2 e 5 | **0,75** = 12/16 | **2,5** = 1/0,4 | 0,119 |

Il caso pessimo è quello che conta: senza di esso non si saprebbe se BEDROC
tocca lo zero o scende sotto, e un BEDROC negativo è il segno che manca il
termine additivo della formula.

### 3-quater.6 Limiti di questo blocco

| Limite | Conseguenza |
|---|---|
| Le coppie crescono col **quadrato** delle molecole | Misurato: 6 molecole 45 ms, 40 molecole 227 ms con 1 255 coppie. Oltre 300 molecole il pannello rifiuta di partire e lo dice, invece di bloccare la pagina |
| Il taglio è **singolo** | Una coppia che differisce per due sostituzioni insieme non viene trovata. È il limite dello schema a taglio singolo, condiviso con gli strumenti standard |
| La stessa trasformazione compare in **più forme** | Tagli in posizioni diverse danno contesti diversi per la stessa modifica chimica (`*CC>>*CCC`, `*NCC>>*NCCC`, `*C(=O)NCC>>*C(=O)NCCC`). È ridondanza attesa nello schema a taglio singolo, non un errore |
| Le cariche **non** sono neutralizzate e i tautomeri non canonizzati | MinimalLib non lo permette (§3-quater.1). Un insieme che mescola forme neutre e ioniche della stessa molecola le conta come voci distinte |
| Il nucleo della tabella SAR va **fornito** | Nessun MCS disponibile. Il pannello non propone nulla automaticamente, perché una proposta sbagliata è peggio di nessuna proposta |

### 3.6 Predizione NMR per atomo: la fonte e lo scarto misurato

Il predittore ¹H/¹³C che assegna ogni segnale a un ATOMO (`bsi-nmr.js`) non
contiene numeri. Le tabelle di stima stanno in **`bsi-pretsch.js`**, trascritte
riga per riga da:

> E. Pretsch, P. Bühlmann, M. Badertscher, *Structure Determination of Organic
> Compounds — Tables of Spectral Data*, 4ª ed., Springer.
> §4.1 pp. 82-84 · §4.5 pp. 100-102 · §5.1 p. 170 · §5.2 pp. 178-179 ·
> §5.3 p. 182 · §5.5 pp. 188-189

Stanno in un file separato perché si possano **controllare contro la pagina
stampata** senza leggere il codice che le usa, e perché una riga sbagliata si
corregga in un posto solo.

| schema | formula | righe |
|---|---|---|
| benzeni monosostituiti, ¹³C | δ = 128,5 + Σ Zi | 91 |
| benzeni monosostituiti, ¹H | δ = 7,34 + Σ Zi | 66 |
| etileni sostituiti, ¹H | δ = 5,25 + Zgem + Zcis + Ztrans | 42 |
| alcani sostituiti, ¹H | δ = base(CH₃/CH₂/CH) + ΣZα + ΣZβ | 31 |
| alchini terminali, ¹H | valore diretto per sostituente | 30 |
| alifatici, ¹³C | δ = −2,3 + Σ Zi + Σ Sj | 24 |
| correzioni steriche Sj | per grado del C osservato e dell'atomo α | 4×4 |

**Lo scarto è misurato, su molecole che non hanno scelto i parametri.** Le
molecole di prova sono divise in due insiemi: *taratura*, usate per scegliere
valori e regole, e *validazione*, mai usate per quello. Il numero dichiarato nel
pannello dell'applicazione è quello della validazione.

| | scarto medio misurato |
|---|---|
| ¹³C, taratura (9 molecole) | 0,71 ppm |
| **¹³C, validazione (22 molecole)** | **0,92 ppm** |
| ¹³C, caso peggiore | 4,9 ppm (cicloesanone) |
| ¹H (14 molecole) | 0,06 ppm |
| ¹H, soli aromatici | 0,03 ppm |

Il banco (`test_nmr`, 56 controlli) pretende anche che la validazione resti
**peggiore** della taratura: se diventassero uguali vorrebbe dire che una
molecola è stata spostata da un insieme all'altro, e il numero non direbbe più
niente.

**Quello che resta sbagliato non è stato corretto a posteriori.** Il difenile
sbaglia il carbonio ipso di 4,6 ppm, perché l'incremento del fenile della
tabella (Z₁ = 8,1) non lo descrive. Quel numero **non è stato ritoccato**:
cambiare un valore trascritto perché una molecola di validazione non torna è
esattamente il modo di rendere falso lo 0,92 ppm dichiarato sopra.

**Limiti dichiarati.** Non è un calcolo quantistico: non prevede gli effetti del
solvente, non distingue conformeri (le correzioni conformazionali K della fonte
sono trascritte ma valgono 0, perché la conformazione da uno SMILES non si
ricava) e non fa NMR bidimensionale. Le costanti di accoppiamento vengono da una
tabella di valori **tipici** per relazione geometrica, non calcolate. Gli
**eteroaromatici sostituiti** non hanno, in questa fonte, una tabella di
incrementi per posizione come l'hanno i benzeni: restano la previsione meno
affidabile del modulo, e lo strumento di elucidazione lo dichiara abbassando la
fiducia quando ne incontra uno.

### 3.7 NMR bidimensionale: COSY, HSQC, HMBC

`bsi-nmr2d.js` non contiene spostamenti: li chiede al predittore per atomo e
costruisce le correlazioni **camminando il grafo**. È per questo che si poteva
fare solo dopo l'arrivo delle tabelle di Pretsch: servono lo spostamento di *ogni* protone e di
*ogni* carbonio, più l'indice dell'atomo che li porta.

| mappa | regola topologica |
|---|---|
| HSQC | protone e carbonio a **un** legame (¹J); segno invertito sui CH₂ |
| COSY | due protoni a **tre** legami (H–C–C–H), escluso fra equivalenti |
| HMBC | protone e carboni a **due o tre** legami (²J, ³J) |

Gli idrogeni **scambiabili** (O–H, N–H) non danno macchie fuori diagonale: si
scambiano col solvente troppo in fretta perché l'accoppiamento si veda. Sulla
diagonale del COSY ci sono, perché sono protoni come gli altri.

**Verificato contando i cammini** (`test_nmr2d`, 40 controlli), nei due versi:
l'esafluorobenzene non dà macchie HSQC, il benzene non ne dà fuori diagonale
nel COSY, il metano non ne dà in HMBC.

**Limiti dichiarati.** Non è una simulazione dell'esperimento: non ci sono
intensità calcolate, artefatti, accoppiamento residuo né dipendenza dal tempo
di miscelamento. In un HMBC vero alcune correlazioni a due legami non si
vedono; qui ci sono tutte. Gli spostamenti ereditano l'incertezza misurata del
predittore (0,9 ppm sul ¹³C, 0,06 sul ¹H).

### 3.8 Geometria 3D: costruita dal grafo, non scaricata

`bsi-geom3d.js` costruisce le coordinate con la **geometria delle distanze**:
una matrice di limiti da legami, angoli di valenza, diagonali d'anello e
contatti di van der Waals; posizioni iniziali casuali ma **riproducibili**,
perché il generatore è seminato dallo SMILES; correzione iterativa delle
violazioni. I sistemi aromatici si proiettano sul loro piano e le terne lineari
si raddrizzano ruotando i rami come corpi rigidi, perché quelle due cose una
distanza da sola non le impone.

**Gli indici sono quelli del predittore NMR**, e gli idrogeni si aggiungono in
coda: è la condizione senza la quale il collegamento picco↔atomo↔3D
illuminerebbe l'atomo sbagliato. Il visore 3D che pesca da PubChem non poteva
essere usato per questo — la numerazione di un SDF non ha nessun rapporto con
quella di RDKit.

Misurato contro i valori noti (`test_geom3d`, 29 controlli): C–C 1,54 Å, C=C
1,34, C≡C 1,20, aromatico 1,39, C–H 1,09; angolo tetraedrico 109,5°, aromatico
120,0°, alchino 180,0°. **Nei due versi**: benzene piano (0,00 Å), cicloesano
**non** piano (0,34). Su molecole vere il residuo resta sotto 0,03 Å fino a una
trentina di atomi e arriva a 0,31 Å su una molecola di 76.

**Limiti dichiarati.** Non è un campo di forze e non minimizza un'energia:
minimizza violazioni geometriche. Non sceglie il conformero più stabile e non
tratta la stereochimica — un centro R e il suo enantiomero escono uguali.

### 3.9 Dal documento allo svolgimento: che cosa è dedotto e che cosa è letto

`bsi-documento.js` apre il file; `bsi-quesito.js` riconosce i dati nel testo;
`bsi-elucida.js` svolge. Sono tre passi separati **di proposito**, perché
sbagliano in modi diversi e confonderli nasconde l'errore: se il
riconoscimento legge «1715» come banda IR quando era una massa, lo
svolgimento che segue è impeccabile e la conclusione è sbagliata. Per questo
il pannello mostra **la tabella dei dati letti sopra lo svolgimento**, con
scritto accanto a ognuno da dove viene.

**Il riconoscimento è per sezione, non per numero.** Una banda IR a 1738 e una
massa a 150 sono entrambe numeri: distinguerli dal solo valore è impossibile.
Si cerca l'etichetta della tecnica (IR, MS, ¹H NMR, ¹³C NMR) e si legge quello
che viene dopo, fino alla fine del capoverso o all'etichetta successiva.

**Quello che non fa.** Non c'è nessun modello linguistico: ci sono espressioni
regolari e un motore di regole spettroscopiche. Se il testo scrive i dati in
una forma non prevista, i dati **non** vengono letti — e il modulo lo dichiara
invece di svolgere a metà. Lo svolgimento arriva fino a dove arrivano le
regole: gruppi funzionali compatibili, frammenti, conteggi. **La struttura
finale non viene proposta**, perché proporla vorrebbe dire indovinare; una
struttura la si può scrivere e il programma la **confronta** con i dati,
dicendo quali segnali tornano e quali no.

**Non c'è riconoscimento ottico dei caratteri.** Una pagina scansionata
contiene pixel, non lettere: il testo non si legge, e il modulo lo dichiara
invece di restituire una stringa vuota come se il documento fosse vuoto. Le
pagine restano visibili, e da lì passa l'estrazione della traccia dai pixel.

### 3.10 I due punti in cui il predittore cede, misurati

Dichiarare «scarto medio 1,0 ppm» e fermarsi lì nasconde la cosa che serve
davvero sapere: *dove* sbaglia. Sono due posti, e si conoscono per misura.

#### a) Gli eteroaromatici sostituiti — manca la tabella, non il metodo

Per i benzeni la fonte dà gli incrementi di sostituente per posizione; per
furano, tiofene, pirrolo e piridina **non li dà**. Un eteroaromatico
sostituito riceve quindi i valori del composto *non* sostituito, e i suoi
carboni β risultano tutti uguali quando nella realtà non lo sono.

Misurato sul quesito del 23/04/2024 (struttura `O=CC(=Cc1ccco1)CSC`):

| osservato | previsto | scarto | che carbonio è |
|---:|---:|---:|---|
| 192,04 | 192,0 | 0,04 | CHO |
| 150,77 | 150,0 | 0,77 | C α del furano, sostituito |
| 146,05 | 142,7 | **3,35** | C α del furano |
| 135,55 | 135,0 | 0,55 | =C |
| 135,05 | 135,0 | 0,05 | =C |
| 118,55 | 109,6 | **8,95** | C β del furano |
| 112,97 | 109,6 | **3,37** | C β del furano |
| 26,67 | 34,0 | **7,33** | CH₂ fra C=C e S |
| 15,72 | 15,6 | 0,12 | S–CH₃ |

I due carboni β escono **identici** (109,6) perché senza incrementi di
posizione non c'è niente che li distingua. **Si è provato** a trasferire gli
incrementi del benzene all'anello eteroaromatico: sul carbonio *ipso*
funziona (151,6 contro 150,77 misurato), ma sui β **peggiora** — il C3
passerebbe da 3,4 a 5,7 ppm di scarto. Non è stato fatto: una
generalizzazione che peggiora dove il problema sta non è una
generalizzazione.

#### b) Un carbonio sp³ con DUE sostituenti in α

Gli incrementi sono ricavati da composti **mono**-sostituiti. Sommandone due
sullo stesso carbonio si conta due volte un effetto che in realtà satura, e
la previsione esce alta. Misurato due volte, stessa entità e stesso verso:

| molecola | carbonio | osservato | previsto | scarto |
|---|---|---:|---:|---:|
| acetato di benzile | OCH₂ (O estereo + anello) | 66,3 | 73,8 | **7,5** |
| il quesito qui sopra | CH₂ (C=C + S) | 26,7 | 34,0 | **7,3** |

È il caso peggiore dichiarato del modulo, e l'acetato di benzile è entrato
nell'insieme di validazione proprio per tenerlo misurato.

**Lo strumento di confronto lo dice.** Quando una struttura proposta contiene
un carbonio del genere, la fiducia scende da «alta» a «media» e compare il
motivo: *un segnale che non torna su quel carbonio può essere un limite del
predittore, non una prova contro la struttura*. Senza quell'avviso, un
punteggio basso su una struttura **giusta** verrebbe letto come una
smentita — ed è esattamente quello che succedeva all'acetato di benzile, che
prende 42 su 100 pur essendo la risposta.

### 3.11 Che cosa si è potuto consultare, e che cosa no

Una tabella di incrementi per gli eteroaromatici sostituiti chiuderebbe il
punto debole descritto sopra. **Dalla macchina in cui questo progetto si
compila non è raggiungibile nessuna fonte primaria**, e la cosa è stata
verificata, non supposta:

| via | esito |
|---|---|
| `curl` verso qualunque dominio | la politica di rete consente **solo** i registri di pacchetti (npm, PyPI, crates, Go) — lo dichiara il proxy stesso |
| NIST WebBook, SDBS (AIST), PubChem, SpectraBase | **403**, bloccati |
| CSIRO, RSC, ACS, Springer, Wikipedia, LibreTexts | **403**, bloccati |
| le tabelle di Hans Reich (`organicchemistrydata.org`, `chem.wisc.edu`) | **403**, bloccati |
| NMRShiftDB2 (`nmrshiftdb.nmr.uni-koeln.de`) | **403**, bloccato |
| PubMed (via il suo servizio) | nessun risultato: indicizza il biomedico, non la chimica pura |
| npm e PyPI | nessun pacchetto ridistribuisce una banca dati NMR di riferimento: `nmr-predictor` la **scarica** da GitHub, che è bloccato; `nmr-processing` non la contiene |

**Quello che la ricerca testuale ha potuto accertare** è *dove* sta il dato,
e questo è un risultato utile anche senza averlo in mano:

> M. T. W. Hearn, «Carbon-13 chemical shifts in some substituted furans and
> thiophens», *Australian Journal of Chemistry* **29**(1), 107–113 (1976).
> DOI [10.1071/CH9760107](https://doi.org/10.1071/CH9760107)

L'abstract dichiara che «gli effetti dei sostituenti in questi eterocicli
**assomigliano** a quelli riportati per i benzeni sostituiti». *Assomigliano*
non vuol dire *coincidono*: trasferire gli incrementi del benzene è stato
provato (§3.10 a) e sui carboni β peggiora. La tabella vera serve ancora.

**Perché non è stata scritta a memoria.** Sarebbe stato facile: quei numeri
sono noti. Ma un valore che nessuno può risalire a una fonte è esattamente
ciò che questo documento esiste per impedire, e metterlo in una tabella
accanto a novantuno righe trascritte da una pagina stampata renderebbe meno
credibili anche quelle. **Il buco dichiarato vale più di un buco tappato male.**

#### Una riga di validazione con provenienza più debole

Per onestà va detto anche questo: l'acetato di benzile, entrato nell'insieme
di validazione perché mostra il punto debole dei due sostituenti in α, porta
valori **non verificati contro una fonte primaria** da questo ambiente. Il
fenomeno che mostra è confermato in modo indipendente dal quesito d'esame del
23/04/2024 — dato di provenienza vera — ma il **caso peggiore dichiarato
(7,5 ppm) poggia su quella riga**, ed è scritto nel banco a chiare lettere.

---

## 4. Costanti fisiche e dati tabulati

La ricerca delle costanti fisiche procede per livelli di specificità
decrescente (corrispondenza esatta → simbolo → parole significative →
sottostringa di almeno 4 caratteri) e **raccoglie tutte le candidate**: se ne
restano più d'una, la richiesta viene rifiutata con l'elenco delle possibilità
anziché restituire arbitrariamente la prima. Un valore fisico sbagliato
restituito con sicurezza è peggio di una domanda di chiarimento.

Le molecole d'esame (`MOLECOLE_ESAME`) sono tabulate con valori verificati; il
riconoscimento dei gruppi da SMILES usa un campo `consuma`, così che ogni gruppo
rimuova la porzione di struttura che ha spiegato e non si producano conteggi
sovrapposti.

---

## 5. Automazione della verifica

Tutti i controlli descritti sono eseguibili e ripetibili. Al momento della
stesura la batteria comprende, fra gli altri:

| Banco | Oggetto | Controlli |
|---|---|---|
| `audit_farmaci` | struttura ⟷ peso, duplicati, formula ricostruita contro ChEMBL, deviazioni registrate con la loro ragione | 263 voci |
| `test_spettri` | riconoscimento gruppi su molecole di riferimento | 36 |
| `test_assi` / `test_assi_canvas` | convenzioni degli assi (SVG e canvas) | 19 |
| `test_costanti` | ricerca delle costanti fisiche e rifiuto delle ambiguità | 45 |
| `audit_dati` | coerenza dei dati tabulati | 29 |
| `verifica_guida` | corrispondenza fra ciò che la documentazione promette e ciò che il codice fa | 71 |

L'ultimo banco merita una menzione: verifica che le affermazioni contenute nella
documentazione utente corrispondano al comportamento reale del codice. Una
promessa non mantenuta dalla documentazione è un difetto al pari di un errore di
calcolo, e viene trattata come tale.

---

## 6. Dichiarazione di trasparenza

Questo documento descrive controlli **effettivamente implementati ed
eseguibili**, con i risultati realmente ottenuti e i limiti dei predittori. Alla versione
`bsi-v188` gli errori residui sulla banca dati farmaci sono **zero**: le 21
deviazioni che restano sono voci senza struttura, ciascuna con il proprio
motivo registrato, non errori taciuti. Le percentuali di copertura e i conteggi riportati sono
prodotti dagli strumenti citati e riproducibili eseguendoli.

Dove un dato non è verificabile con gli strumenti a disposizione, lo si dichiara
anziché presentarlo come verificato.

---

_Documento aggiornato alla versione `bsi-v194`._
