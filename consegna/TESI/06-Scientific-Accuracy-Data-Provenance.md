# Accuratezza scientifica e provenienza dei dati — BioSpecInfo

| Campo | Valore |
|-------|--------|
| **Software** | BioSpecInfo |
| **Autore** | Samuele Pio Provenzano |
| **Versione descritta** | `bsi-v174` |
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

## 2. Banca dati farmacologica — 178 voci

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
| Farmaci in banca dati | **178** (erano 143) |
| Con struttura verificata | **157** (erano 153) |
| Difetti | **0** |
| Deviazioni dichiarate e accettate | **21** (erano 25) |

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

E va anche **revocata** quando non serve più. Dalla versione `bsi-v174` il banco
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

### 3-bis.2 Le tre cose che rendono un QSAR onesto

Un modello QSAR è facilissimo da far sembrare buono. Le tre precauzioni qui
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

### 3-bis.3 Limiti dichiarati

| Limite | Conseguenza |
|---|---|
| Gli insiemi di esempio sono **piccoli** (28 e 40 molecole) | Servono a mostrare il metodo, non a produrre un modello utilizzabile. Su insiemi così, il modello nullo è la sola difesa seria — ed è il motivo per cui c'è |
| Il modello è **lineare nel kernel** (kernel ridge, kernel di Tanimoto) o logistico | Nessuna rete neurale, nessun gradient boosting: sono metodi che su poche centinaia di molecole non danno un vantaggio dimostrabile, e il costo sarebbe un modello che non si può ispezionare |
| I **PAINS non sono una condanna** | Un pattern PAINS segnala che il composto è stato spesso un falso positivo in saggi di fluorescenza, non che sia inattivo. Il pannello lo scrive accanto a ogni segnalazione |
| La **PCA è sui descrittori**, non sulle impronte | Sulle impronte binarie la PCA è poco informativa; i carichi sui descrittori si leggono, e sono mostrati |
| Non c'è **ricerca di sottostruttura su larga scala** | Il banco di lavoro è dimensionato per gli insiemi che si incollano a mano, non per una libreria da milioni di composti |

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
| `tools/verifica-farmaci.js` | struttura ⟷ peso molecolare, duplicati, deviazioni registrate | 178 voci |
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
`bsi-v174` gli errori residui sulla banca dati farmaci sono **zero**: le 21
deviazioni che restano sono voci senza struttura, ciascuna con il proprio
motivo registrato, non errori taciuti. Le percentuali di copertura e i conteggi riportati sono
prodotti dagli strumenti citati e riproducibili eseguendoli.

Dove un dato non è verificabile con gli strumenti a disposizione, lo si dichiara
anziché presentarlo come verificato.

---

_Documento aggiornato alla versione `bsi-v174`._
