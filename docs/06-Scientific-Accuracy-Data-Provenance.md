# Accuratezza scientifica e provenienza dei dati — BioSpecInfo

| Campo | Valore |
|-------|--------|
| **Software** | BioSpecInfo |
| **Autore** | Samuele Pio Provenzano |
| **Versione descritta** | `bsi-v170` |
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
| Con struttura verificata | **155** |
| Difetti | **0** |
| Deviazioni dichiarate e accettate | **25** |

La verifica è **conforme**: nessuna voce presenta una struttura che contraddica
il proprio peso molecolare. Le 25 deviazioni sono voci **prive di struttura**,
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

| Gruppo | Voci | Natura |
|---|---:|---|
| **D-01** — complessità molecolare | 6 | digossina, vincristina, tacrolimus (topico e sistemico), ivermectina, artemetere/lumefantrina. Per queste non è stato possibile produrre una struttura che superasse il confronto; sono rimaste senza, con i dati farmacologici intatti. |
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
eseguibili**, con i risultati realmente ottenuti, inclusi i 9 errori residui e i
limiti dei predittori. Le percentuali di copertura e i conteggi riportati sono
prodotti dagli strumenti citati e riproducibili eseguendoli.

Dove un dato non è verificabile con gli strumenti a disposizione, lo si dichiara
anziché presentarlo come verificato.

---

_Documento aggiornato alla versione `bsi-v170`._
