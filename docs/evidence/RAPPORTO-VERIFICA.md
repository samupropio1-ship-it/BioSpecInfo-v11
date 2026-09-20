# Rapporto di verifica — evidenza di esecuzione

**BioSpecInfo** · documento generato automaticamente da `tools/genera-evidenza.js`.

> Questo rapporto non contiene affermazioni redatte a mano: riporta l'uscita
> testuale di ogni banco di prova, l'ambiente in cui è stata prodotta, il commit
> esatto del codice e le impronte SHA-256 dei file verificati. Chiunque disponga
> del repository può rieseguire la procedura descritta al §5 e confrontare.

---

## 1. Esito complessivo

| | |
|---|---|
| **Banchi superati** | 35 |
| **Banchi falliti** | 0 |
| **Durata totale** | 517 s |
| **Esito** | ✅ **CONFORME** |

---

## 2. Ambiente di esecuzione

| Campo | Valore |
|---|---|
| Istante (UTC) | `2026-09-20T17:37:47.059Z` |
| Commit | `ca9e6e5a1e1fbb9edbade744ec90d4af29850a70` |
| Ramo | `claude/app-layout-synthesis-features-97UCN` |
| Albero di lavoro pulito | sì (nessuna modifica non registrata) |
| Versione applicazione | `bsi-v165` |
| Node.js | `v22.22.2` |
| Piattaforma | `linux x64` |
| Chromium | `Chromium 141.0.7390.37` |
| playwright-core | `1.62.1` |

### Impronte dei file verificati

Il rapporto si riferisce esattamente a questo contenuto.

| File | Byte | SHA-256 |
|---|---:|---|
| `index.html` | 4.510.090 | `aadb28e85e42aaabd0d5d039252c1dc46e3293c3eff7205224b6eb4be906b936` |
| `bsi-ai-hub.js` | 429.208 | `3cbd068dc5e3a9045b7f39e819f174f7edb732771c3e3f25b1474fae777d3640` |
| `bsi-spettri.js` | 33.021 | `6f6d13824b593c92edfdf51cd976de4cb72479c9c6586c5158c56dab615a779b` |
| `sw.js` | 5261 | `52bbea24c611611ef55a79d35cc559f6a6b8913e4a5c338da0d630a4574ddd92` |
| `rdkit_lab.html` | 262.799 | `ecd1ac77e85f165f25fb61a5240c45a21e0a9e2e59a1f9d90d0914d24501cb14` |
| `astro.html` | 2.729.922 | `349f0b8b6d89431c00eaa6675acceeaaf93cc6f98c478bc1b904a86023a09a0f` |
| `chimorga.html` | 198.834 | `66b1fff055589cfc219c02ced0d72e9afdf9cc86a86194ea7d7e162cefd73009` |

---

## 3. Esiti per famiglia

### Dati scientifici

_I dati chimici mostrati sono verificati contro una fonte indipendente._

| Banco | Esito | Durata | Sintesi |
|---|---|---:|---|
| `@verifica-farmaci` | ✅ SUPERATO | 4.4 s | ✓ CONFORME |
| `test_spettri` | ✅ SUPERATO | 4.2 s | 36 passati |
| `test_spettri_ui` | ✅ SUPERATO | 10.8 s | 16 passati |
| `test_assi` | ✅ SUPERATO | 5.9 s | 13 passati |
| `test_assi_canvas` | ✅ SUPERATO | 8.9 s | 6 passati |
| `test_costanti` | ✅ SUPERATO | 0.0 s | ✓ tutti passati — 45 controlli |
| `audit_dati` | ✅ SUPERATO | 0.1 s | ✓ 29 controlli superati |

### Agente AI

_L'assistente resta utilizzabile quando il fornitore esterno si guasta._

| Banco | Esito | Durata | Sintesi |
|---|---|---:|---|
| `test_nucleo` | ✅ SUPERATO | 5.3 s | 13 passati |
| `test_ko` | ✅ SUPERATO | 0.0 s | ✓ tutti passati — 35 controlli |
| `test_404` | ✅ SUPERATO | 0.0 s | ✓ tutti passati — 36 controlli |
| `test_503` | ✅ SUPERATO | 0.1 s | ✓ tutti passati — 40 controlli |
| `test_firma` | ✅ SUPERATO | 0.1 s | ✓ tutti passati — 31 controlli |
| `test_attesa` | ✅ SUPERATO | 0.1 s | ✓ tutti passati — 11 controlli |
| `test_attesalunga` | ✅ SUPERATO | 0.1 s | ✓ tutti passati — 14 controlli |
| `test_tetto` | ✅ SUPERATO | 0.1 s | ✓ tutti passati — 32 controlli |
| `browser_ko` | ✅ SUPERATO | 38.0 s | 37 passati |
| `browser_prova` | ✅ SUPERATO | 51.6 s | 29 passati |
| `browser_prov` | ✅ SUPERATO | 4.8 s | 7 passati |
| `test_doppioinvio` | ✅ SUPERATO | 11.4 s | 7 passati |

### Stabilita

_L'applicazione regge sessioni lunghe, memoria esaurita e rete degradata._

| Banco | Esito | Durata | Sintesi |
|---|---|---:|---|
| `audit_stabilita` | ✅ SUPERATO | 104.0 s | 29 passati |
| `audit_promesse` | ✅ SUPERATO | 116.6 s | 22 passati |
| `audit_quota` | ✅ SUPERATO | 41.1 s | 10 passati |
| `test_sw` | ✅ SUPERATO | 28.4 s | 22 passati |
| `test_filemanager` | ✅ SUPERATO | 10.8 s | 15 passati |
| `test_visore3d` | ✅ SUPERATO | 8.9 s | 5 passati |

### Interfaccia

_I pannelli e i comandi rispondono come documentato._

| Banco | Esito | Durata | Sintesi |
|---|---|---:|---|
| `browser_reset` | ✅ SUPERATO | 9.9 s | 24 passati |
| `browser_proxy` | ✅ SUPERATO | 8.5 s | 15 passati |
| `browser_proxyui` | ✅ SUPERATO | 11.7 s | 17 passati |
| `browser_rdkit` | ✅ SUPERATO | 4.1 s | 31 passati |
| `browser_lab` | ✅ SUPERATO | 10.8 s | 21 passati |
| `browser_frontiera` | ✅ SUPERATO | 6.0 s | 9 passati |
| `test_aggiorna` | ✅ SUPERATO | 5.6 s | 9 passati |
| `test_guidaproxy` | ✅ SUPERATO | 5.2 s | 12 passati |

### Coerenza documentazione/codice

_Cio che la documentazione promette esiste davvero nel codice._

| Banco | Esito | Durata | Sintesi |
|---|---|---:|---|
| `verifica_guida` | ✅ SUPERATO | 0.1 s | 71 controlli passati |
| `@verifica-documenti` | ✅ SUPERATO | 0.1 s | 11 controlli passati |

---

## 4. Uscita integrale dei banchi

Trascrizione non filtrata, nell'ordine di esecuzione.

<details>
<summary><code>@verifica-farmaci</code> — SUPERATO (codice di uscita 0)</summary>

```
Verifica della banca dati farmacologica
Metodo: peso ricalcolato da RDKit sulla struttura ⟷ peso dichiarato
Tolleranza: 0.6 u

Voci esaminate: 178  (con struttura: 153)

── Difetti ──
  ✓ nessuno

── Deviazioni dichiarate e accettate ──
  ▪ [D-01] Digossina                         glicoside cardioattivo con tre unita' di digitossosio: ogni struttura provata si discosta di 14-30 u dal peso di letteratura (780,94)
  ▪ [D-02] Semaglutide                       analogo peptidico del GLP-1: 31 residui piu' catena lipidica, non rappresentabile in SMILES
  ▪ [D-02] Insulina (umana ricombinante)     proteina, 51 residui
  ▪ [D-02] Ciclosporina A                    undecapeptide ciclico
  ▪ [D-02] Sacubitril/Valsartan (Entresto)   complesso supramolecolare di due principi attivi
  ▪ [D-02] Trastuzumab (Herceptin)           anticorpo monoclonale
  ▪ [D-02] Pembrolizumab (Keytruda)          anticorpo monoclonale
  ▪ [D-02] Rituximab (MabThera)              anticorpo monoclonale
  ▪ [D-02] Natalizumab (Tysabri)             anticorpo monoclonale
  ▪ [D-02] Liraglutide (Victoza/Saxenda)     analogo peptidico del GLP-1
  ▪ [D-02] Octreotide                        octapeptide ciclico
  ▪ [D-01] Artemetere/Lumefantrina (Coartem) associazione di due principi attivi: una singola notazione SMILES non rappresenta la voce
  ▪ [D-01] Ivermectina                       lattone macrociclico a 16 termini con due unita' di oleandrosio: le strutture provate non sono risultate interpretabili da RDKit
  ▪ [D-02] Adalimumab (Humira)               anticorpo monoclonale
  ▪ [D-02] Infliximab (Remicade)             anticorpo monoclonale chimerico
  ▪ [D-02] Secukinumab (Cosentyx)            anticorpo monoclonale
  ▪ [D-02] Dupilumab (Dupixent)              anticorpo monoclonale
  ▪ [D-02] Caspofungina                      lipopeptide echinocandinico
  ▪ [D-01] Tacrolimus topico (Protopic)      macrolide a 23 termini; scarto residuo di 82 u sulla struttura provata
  ▪ [D-02] Tocilizumab (Actemra)             anticorpo monoclonale
  ▪ [D-01] Tacrolimus sistemico (Prograf)    stessa molecola della voce topica, stessa deviazione
  ▪ [D-02] Palivizumab (Synagis)             anticorpo monoclonale
  ▪ [D-02] Eculizumab (Soliris)              anticorpo monoclonale
  ▪ [D-02] Benralizumab (Fasenra)            anticorpo monoclonale
  ▪ [D-01] Vincristina                       alcaloide bisindolico: lo scarto residuo di 130 u indica un frammento dimerico non risolto

178 voci · 0 difetti · 25 deviazioni dichiarate · 0 non registrate
✓ CONFORME
```

</details>

<details>
<summary><code>test_spettri</code> — SUPERATO (codice di uscita 0)</summary>

```

1) Aspirina — estere E acido carbossilico insieme
    gruppi: acidoCarbossilico, estere, etere, aromatico, chSp3, ch3, chAr, arMono, arOrto, acidoConiug, estereArilico, __protoni
  ✓ riconosce l'acido carbossilico  → 1
  ✓ riconosce anche l'estere  → 1
  ✓ e l'anello aromatico  → true
  ✓ O–H largo dell'acido presente (~3000)  → true
  ✓ C=O estere presente (~1735, coniugato)  → true
  ✓ C=O acido presente (~1710, coniugato)  → true
  ✓ C–O acido presente (~1280)  → true
  ✓ anello orto-disostituito riconosciuto  → true

2) Etanolo — O–H largo, C–O, nessun carbonile
  ✓ O–H alcol largo (~3340)  → true
  ✓ C–O alcol primario (~1050)  → true
  ✓ NESSUN carbonile  → undefined
  ✓ C–H presenti  → true

3) Acetone — un solo C=O, a 1715
  ✓ riconosce il chetone  → 1
  ✓ C=O chetone a ~1715  → true
  ✓ nessun O–H  → undefined
  ✓ nessun estere  → undefined

4) Benzaldeide — doppietto di Fermi 2820/2720
  ✓ riconosce l'aldeide  → 1
  ✓ prima banda di Fermi (2820)  → true
  ✓ seconda banda di Fermi (2720)  → true
  ✓ C=O abbassato dalla coniugazione (<1715)  → true
  ✓ anello monosostituito  → true

5) Acetammide — banda ammide I e II
  ✓ riconosce l'ammide primaria  → 1
  ✓ banda ammide I (~1655)  → true
  ✓ banda ammide II (~1550)  → true
  ✓ due N–H (asim. e sim.)  → 2

6) Nitrobenzene — nitro asimmetrica e simmetrica
  ✓ riconosce il gruppo nitro  → true
  ✓ N=O asimmetrica (~1520)  → true
  ✓ N=O simmetrica (~1345)  → true

7) La sostituzione dell'anello si legge sotto 900 cm⁻¹
  ✓ toluene: monosostituito  → true
  ✓ p-xilene: para-disostituito  → true
  ✓ m-xilene: meta-disostituito  → true

8) Lo stesso spettro, disegnato due volte, dev'essere identico
  ✓ due disegni identici  → true
    · 24738 caratteri di SVG

9) Convenzione: trasmittanza, non assorbanza
  ✓ l'asse Y e' la trasmittanza  → true
  ✓ e non l'assorbanza  → false
  ✓ la regione dell'impronta digitale e' segnata  → true
  ✓ nessun errore JS in tutto il banco  → 0

36 passati
```

</details>

<details>
<summary><code>test_spettri_ui</code> — SUPERATO (codice di uscita 0)</summary>

```

1) L'innesto e' avvenuto
  ✓ il motore spettri e' caricato  → true
  ✓ irBandList/makeIRsvg sono state sostituite  → true
  ✓ e il disegno esce in trasmittanza  → true

2) Anche il percorso di ripiego usa la convenzione giusta
  ✓ le bande vecchie hanno davvero la forma fw/h (prova valida)  → true
  ✓ trasmittanza anche col ripiego  → true
  ✓ mai assorbanza  → false
  ✓ nessun NaN nel disegno  → false
  ✓ e la traccia ha punti veri  → true

3) Niente rumore casuale: due disegni identici
  ✓ lo stesso spettro e' sempre lo stesso  → true

4) Dal centro di analisi: l'aspirina mostra le bande giuste
  ✓ RDKit ha analizzato la molecola  → true
  ✓ lo spettro c'e'  → true
  ✓ in trasmittanza  → true
  ✓ la legenda nomina l'acido carbossilico  → true
  ✓ e anche l'estere (prima ne mostrava uno solo)  → true
  ✓ e riconosce l'anello orto-disostituito  → true
  ✓ nessun errore JS  → 0

16 passati
```

</details>

<details>
<summary><code>test_assi</code> — SUPERATO (codice di uscita 0)</summary>

```

1) IR — il numero d'onda cala da sinistra a destra
    · da 4000 a 500 (8 tacche)
  ✓ asse IR decrescente  → decrescente
  ✓ parte da 4000  → 4000
  ✓ arriva a 500 o meno  → true
  ✓ e l'ordinata e' la trasmittanza  → true

2) ¹H NMR — δ cala da sinistra a destra, TMS a destra
    · da 14 a 0 (8 tacche)
  ✓ asse NMR decrescente  → decrescente
  ✓ il riferimento TMS c'e'  → true
  ✓ nessun residuo di lavorazione ("v20")  → false
  ✓ l'etichetta dell'asse spiega il verso  → true

3) Nessuno spettro cambia se lo ridisegni
  ✓ ¹H NMR riproducibile (era con rumore casuale)  → true

4) Il predittore NMR disegna intervalli, non altezze inventate
    · _nmrSvg non e' esposta: si controlla sul sorgente
  ✓ nessuna altezza casuale nel disegno NMR  → false
  ✓ e la fascia dell'intervallo viene disegnata  → true
  ✓ e si legge l'intervallo, non solo il primo numero  → true

5) UV-Vis e MS: qui l'asse va nel verso NORMALE
    · UV-Vis: nessun grafico da misurare qui
    · MS: nessun grafico da misurare qui
  ✓ nessun errore JS  → 0

13 passati
```

</details>

<details>
<summary><code>test_assi_canvas</code> — SUPERATO (codice di uscita 0)</summary>

```

1) IR su canvas (sezione "IR & Vis") — deve calare, 4000 → 400
    · {"n":13,"primo":4000,"ultimo":400,"verso":"decrescente"}
  ✓ asse decrescente come vuole la convenzione IR  → decrescente
  ✓ parte da un numero d'onda alto  → true

2) MS (spettro di massa) — m/z deve CRESCERE
    · {"n":6,"primo":0,"ultimo":100,"verso":"crescente"}
  ✓ asse m/z crescente  → crescente

3) UV-Vis — la lunghezza d'onda deve CRESCERE
    · {"n":5,"primo":200,"ultimo":400,"verso":"crescente"}
  ✓ asse λ crescente  → crescente
  ✓ parte da ~200 nm  → true
  ✓ nessun errore JS  → 0

6 passati
```

</details>

<details>
<summary><code>test_costanti</code> — SUPERATO (codice di uscita 0)</summary>

```
BioSpecInfo — Spectra v2 caricato (copilota agentico, chat multi-provider, esame orale, ripasso SM-2, generatore guide) ✔

1) I simboli danno la costante GIUSTA
  ✓ "R"  → costante dei gas
  ✓ "k"  → costante di boltzmann
  ✓ "h"  → costante di planck
  ✓ "c"  → velocita della luce
  ✓ "e"  → carica elementare
  ✓ "F"  → costante di faraday
  ✓ "NA"  → costante di avogadro
  ✓ "N_A"  → costante di avogadro
  ✓ "me"  → massa elettrone
  ✓ "mp"  → massa protone
  ✓ "kB"  → costante di boltzmann

2) I valori sono quelli CODATA
  ✓ valore di R  → 8.314462618
  ✓ valore di k  → 1.380649e-23
  ✓ valore di e  → 1.602176634e-19
  ✓ valore di NA  → 6.02214076e23
  ✓ valore di c  → 299792458

3) Il nome per esteso continua a funzionare
  ✓ "costante dei gas"  → true
  ✓ "costante di Avogadro"  → true
  ✓ "carica elementare"  → true
  ✓ "velocita della luce"  → true
  ✓ "massa elettrone"  → true
  ✓ "zero assoluto"  → true
  ✓ "volume molare gas"  → true
  ✓ con apostrofo e articolo  → massa elettrone

4) In caso di dubbio RIFIUTA invece di indovinare
  ✓ "x" non inventa una risposta  → false
  ✓ "z" non inventa una risposta  → false
  ✓ "q" non inventa una risposta  → false
  ✓ "ab" non inventa una risposta  → false
  ✓ "costante" è ambiguo → non sceglie a caso  → false
  ✓ e lo dice  → true

5) Il caso che ha originato tutto
  ✓ R NON è più Avogadro  → false
  ✓ R è la costante dei gas  → costante dei gas
  ✓ k NON è più Planck  → false

6) Ogni costante in tabella è raggiungibile col suo nome
  ✓ costante di avogadro  → costante di avogadro
  ✓ costante di planck  → costante di planck
  ✓ costante di boltzmann  → costante di boltzmann
  ✓ costante dei gas  → costante dei gas
  ✓ carica elementare  → carica elementare
  ✓ velocita della luce  → velocita della luce
  ✓ costante di faraday  → costante di faraday
  ✓ massa elettrone  → massa elettrone
  ✓ massa protone  → massa protone
  ✓ costante di rydberg  → costante di rydberg
  ✓ zero assoluto  → zero assoluto
  ✓ volume molare gas  → volume molare gas

✓ tutti passati — 45 controlli
```

</details>

<details>
<summary><code>audit_dati</code> — SUPERATO (codice di uscita 0)</summary>

```
BioSpecInfo — Spectra v2 caricato (copilota agentico, chat multi-provider, esame orale, ripasso SM-2, generatore guide) ✔

1) Costanti fisiche (CODATA) — coi nomi che lo schema dichiara
  ✓ velocita della luce  → 299792458
  ✓ costante di Planck  → 6.62607015e-34
  ✓ costante di Avogadro  → 6.02214076e+23
  ✓ costante dei gas  → 8.314462618
  ✓ costante di Boltzmann  → 1.380649e-23
  ✓ carica elementare  → 1.602176634e-19
  ✓ costante di Faraday  → 96485.332
  ✓ massa dell elettrone  → 9.1093837015e-31

1b) Un nome AMBIGUO non deve dare un numero sbagliato con sicurezza
   "R" → costante dei gas  (8.314462618)
   "k" → costante di boltzmann  (1.380649e-23)
   "e" → carica elementare  (1.602176634e-19)
   "pippo" → rifiuta

2) Masse molecolari (confronto con IUPAC)
  ✓ MM H2O  → 18.015
  ✓ MM CO2  → 44.009
  ✓ MM C6H12O6  → 180.156
  ✓ MM NaCl  → 58.44
  ✓ MM H2SO4  → 98.072
  ✓ MM C9H8O4  → 180.159
  ✓ MM Ca3(PO4)2  → 310.174
  ✓ MM K4[Fe(CN)6]  → 368.345
  ✓ MM C8H10N4O2  → 194.194

3) Risolutori contro valori di letteratura
  ✓ pH acido acetico 0,1 M (2,875)  → 2.875
  ✓ Ea da due costanti (92 kJ/mol)  → 91.895
  ✓ riga H-alfa (656,3 nm)  → 656.112
  ✓ ⁵⁶Fe energia per nucleone (8,79 MeV)  → 8.7903
  ✓ t fra due campioni distanti 5 (|t| = 5)  → 5
  ✓ Beer-Lambert A = 15000·2e-5·1 = 0,30  → 0.3
  ✓ dopo 2 emivite resta il 25%  → 25

4) I risolutori sanno dire "non lo so"
  ✓ bilancia_equazione (non bilanciabile) → rifiuta  → true
  ✓ massa_molecolare (parentesi sbilanciate) → rifiuta  → true
  ✓ calcola (iniezione) → rifiuta  → true
  ✓ calcola (divisione per zero) → rifiuta  → true
  ✓ quantistica_e_spettroscopia (lunghezza d'onda zero) → rifiuta  → true

5) Coerenza della banca dati molecole
   molecole tabulate: 20
  ✓ tutte le voci complete e con massa coerente con la formula

✓ 29 controlli superati
```

</details>

<details>
<summary><code>test_nucleo</code> — SUPERATO (codice di uscita 0)</summary>

```

1) Il nucleo c'è e non esce dal suo riquadro
  ✓ presente  → true
  ✓ 36px  → 36
  ✓ non si sovrappone al nome  → false

2) Il campo di scrittura non taglia più il testo
  ✓ a tutta larghezza  → true
  ✓ nessun testo tagliato  → false

3) Gli stati del nucleo
  ✓ stato iniziale a riposo  → pronto

4) Modalità Nucleo
  ✓ parte spenta  → false
  ✓ si accende  → true
  ✓ resta salvata  → 1
  ✓ passa al più capace fra le chiavi (Groq 50 > Z.AI 45)  → groq
  ✓ lo dice in chat  → true
  ✓ si rispegne  → false
  ✓ nessun errore JS  → 0

13 passati
```

</details>

<details>
<summary><code>test_ko</code> — SUPERATO (codice di uscita 0)</summary>

```
BioSpecInfo — Spectra v2 caricato (copilota agentico, chat multi-provider, esame orale, ripasso SM-2, generatore guide) ✔

1) Annotazione e conteggio
  ✓ all'inizio nessuno e' marcato  → false
  ✓ volte = 0  → 0
  ✓ dopo un fallimento e' marcato  → true
  ✓ volte = 1  → 1
  ✓ volte = 3 dopo tre fallimenti  → 3
  ✓ un altro fornitore resta pulito  → false

2) Una risposta qualsiasi cancella l'annotazione
  ✓ non piu' marcato  → false
  ✓ volte azzerate  → 0
  ✓ la chiave sparisce da localStorage quando e' vuota  → undefined
  ✓ cancellare un fornitore mai annotato non crea nulla  → undefined

3) Dopo 24 ore si ritenta, e il conteggio riparte
  ✓ volte = 2  → 2
  ✓ scaduta: non piu' marcato  → false
  ✓ scaduta: volte = 0  → 0
  ✓ il conteggio riparte da 1, non da 3  → 1

4) Dato corrotto in localStorage non blocca nulla
  ✓ recente() sopravvive  → false
  ✓ volte() sopravvive  → 0
  ✓ JSON valido ma non oggetto  → false
  ✓ voce senza timestamp  → false
  ✓ e viene riscritta bene  → 1
  ✓ un id sconosciuto non viene annotato  → undefined

5) L'ordine di riserva mette i marcati in fondo
  ✓ senza annotazioni il preferito e' primo  → groq
  ✓ gemini c'e'  → true
  ✓ groq marcato scende in fondo  → gemini
  ✓ ma NON sparisce  → true
  ✓ lunghezza invariata  → 2
  ✓ se tutti sono marcati si prova lo stesso il preferito  → groq
  ✓ e restano tutti e due  → 2

6) Modalita' Nucleo non sceglie un fornitore che non risponde
    (il piu' capace fra groq e gemini e': gemini_pro)
  ✓ cambia scelta  → true
  ✓ e ne sceglie uno valido  → true
  ✓ con entrambi marcati sceglie comunque qualcuno  → true
  ✓ senza nessuna chiave restituisce null  → null

7) Il reset "ricomincia da capo" azzera anche questa memoria
  ✓ il gruppo chiavi la include  → true
  ✓ dopo il reset e' sparita  → undefined
  ✓ la licenza non e' stata toccata  → LICENZA

8) Cancellare le chat NON cancella cio' che si e' imparato
  ✓ la memoria dei ko resta  → true

✓ tutti passati — 35 controlli
```

</details>

<details>
<summary><code>test_404</code> — SUPERATO (codice di uscita 0)</summary>

```
BioSpecInfo — Spectra v2 caricato (copilota agentico, chat multi-provider, esame orale, ripasso SM-2, generatore guide) ✔

1) Il messaggio del fornitore dice quale modello usare
  ✓ estrae dal caso reale  → gemini-3.6-flash
  ✓ "use `x` instead"  → gpt-5.6
  ✓ "use X instead"  → grok-4.6
  ✓ "switch to X"  → glm-4.7-flash
  ✓ "replaced by X"  → deepseek-v4
  ✓ non scambia "the Interactions API" per un modello  → null
  ✓ non prende una parola senza cifre ne' trattini  → null
  ✓ messaggio vuoto  → null
  ✓ messaggio senza suggerimenti  → null

2) Un modello bocciato non viene piu' scelto
  ✓ all'inizio non e' bocciato  → false
  ✓ ora lo e'  → true
  ✓ ma solo per QUELLA chiave  → false
  ✓ e solo per QUEL fornitore  → false
  ✓ dopo 7 giorni si riprova  → false

3) Il catalogo elenca un modello che NON si puo' generare
  ✓ sceglie il piu' recente  → gemini-3.6-flash

4) Il caso vero: il catalogo NON contiene il sostituto
  ✓ la risoluzione sceglie l'unico che vede  → gemini-2.5-flash
  ✓ il turno RIESCE invece di fermarsi  → true
  ✓ ha provato prima il vecchio  → gemini-2.5-flash
  ✓ poi quello suggerito dal fornitore  → gemini-3.6-flash
  ✓ due tentativi in tutto  → 2
  ✓ il modello morto resta bocciato  → true
  ✓ e il nuovo e' in cache per la prossima volta  → true

5) Il secondo messaggio non ripete l'errore
  ✓ va diritto al modello giusto  → gemini-3.6-flash
  ✓ un solo tentativo  → 1

6) Nessun ciclo infinito se NIENTE funziona
  ✓ si ferma con un errore  → true
  ✓ e riporta il 404 vero  → true
  ✓ tentativi limitati  → true
  ✓ ogni tentativo e' stato DIVERSO  → 5

7) Anche i fornitori OpenAI-compatibili escludono i bocciati
  ✓ senza bocciature prende il preferito  → openai/gpt-oss-120b
  ✓ bocciato: scala al successivo  → qwen/qwen3.6-27b
  ✓ bocciati tutti: non ne restituisce uno gia' fallito  → false

8) Elenco irraggiungibile: la riserva salta i bocciati
  ✓ primo candidato: l'alias  → gemini-flash-latest
  ✓ bocciato l'alias: passa al 3.6  → gemini-3.6-flash

9) Il reset azzera anche le bocciature
  ✓ e' nel gruppo chiavi  → true
  ✓ sparita  → undefined
  ✓ licenza intatta  → LICENZA

✓ tutti passati — 36 controlli
```

</details>

<details>
<summary><code>test_503</code> — SUPERATO (codice di uscita 0)</summary>

```
BioSpecInfo — Spectra v2 caricato (copilota agentico, chat multi-provider, esame orale, ripasso SM-2, generatore guide) ✔

1) Quali stati sono temporanei
  ✓ HTTP 429  → true
  ✓ HTTP 500  → true
  ✓ HTTP 502  → true
  ✓ HTTP 503  → true
  ✓ HTTP 504  → true
  ✓ HTTP 529  → true
  ✓ HTTP 400  → false
  ✓ HTTP 401  → false
  ✓ HTTP 403  → false
  ✓ HTTP 404  → false
  ✓ HTTP 402  → false
  ✓ HTTP 200  → false

2) Un 503 passeggero viene superato da solo
  ✓ il turno RIESCE  → true
  ✓ tre chiamate: 503, 503, ok  → 3
  ✓ ha aspettato due volte  → 2
  ✓ e lo ha detto col motivo giusto  → 503

3) La nota NON dice "limite al minuto" per un 503
  ✓ su un 429 il motivo è 429  → 429

4) Sovraccarico che non passa: si cambia fornitore
  ✓ il turno RIESCE lo stesso  → true
  ✓ è passato a un altro fornitore  → 1
  ✓ e ha detto perché  → true
  ✓ ed e' la ragione precisa: l'attesa  → attesa:12
  ✓ la risposta è arrivata da groq  → groq

5) Con una sola chiave: messaggio utile, non "HTTP 503"
  ✓ fallisce  → true
  ✓ dice che è sovraccarico, non un codice nudo  → true
  ✓ dice che NON è colpa della chiave  → true
  ✓ e suggerisce cosa fare  → true
  ✓ conserva il codice vero per la diagnosi  → true
  ✓ è marcato come sovraccarico  → true
  ✓ tentativi limitati  → true

6) Un errore NON temporaneo non viene ritentato
  ✓ fallisce subito  → true
  ✓ una sola chiamata  → 1
  ✓ nessuna attesa  → 0
  ✓ non è marcato sovraccarico  → undefined

6b) Un 503 che contiene la parola "model" NON è un modello sparito
  ✓ nessun modello bocciato  → undefined
  ✓ ha solo aspettato e riprovato  → 1

7) Una chiave sbagliata non manda in giro la domanda
  ✓ fallisce  → true
  ✓ NON prova gli altri fornitori  → 0
  ✓ perché si ripeterebbe identico ovunque  → 1

8) L'attesa parte più alta per un sovraccarico che per un 429
  ✓ il sovraccarico aspetta di più  → true
  ✓ ma il Retry-After del fornitore vince su tutto  → 7000

✓ tutti passati — 40 controlli
```

</details>

<details>
<summary><code>test_firma</code> — SUPERATO (codice di uscita 0)</summary>

```
BioSpecInfo — Spectra v2 caricato (copilota agentico, chat multi-provider, esame orale, ripasso SM-2, generatore guide) ✔

1) Il turno a piu' giri arriva in fondo
  ✓ il turno RIESCE  → true
  ✓ tre chiamate a Gemini  → 3
  ✓ la risposta finale arriva  → true

2) La firma torna indietro, sulla parte giusta
   parti rimandate: [{"text":"Verifico.","thoughtSignature":"CtcBAdHtim9xVEVTVE9GaXJtYQ=="},{"functionCall":{"name":"analizza_molecola","args":{"nome":"toluene"}},"thoughtSignature":"CtcBAdHtim9xQk9zZXJ2YXRvcmVGaXJtYUE="}]
  ✓ la functionCall è stata rimandata  → true
  ✓ CON la sua firma  → CtcBAdHtim9xQk9zZXJ2YXRvcmVGaXJtYUE=
  ✓ e la parte di testo con la sua  → CtcBAdHtim9xVEVTVE9GaXJtYQ==

3) Anche la grafia snake_case viene raccolta
  ✓ firma del 2° giro rimandata  → CtcBAdHtim9xQk9zZXJ2YXRvcmVGaXJtYUI=

4) Un modello che NON firma non manda campi vuoti
  ✓ funziona lo stesso  → true
  ✓ nessun campo firma inventato  → undefined
  ✓ e nessun null di troppo  → false

5) Rete di sicurezza: rifiuto al SECONDO giro, non solo al primo
  ✓ l'utente riceve comunque una risposta  → true
  ✓ senza dover rinunciare agli strumenti  → 0
  ✓ gli strumenti sono ancora attivi  → true
  ✓ e riparte dalla domanda originale, non dal turno rifiutato  → 1

5b) Se anche il marcatore viene rifiutato, la rete regge
  ✓ l'utente riceve comunque una risposta  → true
  ✓ e gli viene DETTO che è senza strumenti  → 1
  ✓ l'ultima chiamata è davvero senza strumenti  → undefined
  ✓ e non cicla  → true

6) Un errore NON di formato non fa perdere gli strumenti
  ✓ fallisce  → true
  ✓ senza ritentare a vuoto  → 1
  ✓ e senza spegnere gli strumenti  → 0

7) Lo stream ripete la stessa parte: lo strumento gira UNA volta
  ✓ lo strumento è stato eseguito una volta sola  → 1
  ✓ e una sola functionCall rimandata  → 1

8) Ma due chiamate DIVERSE in chunk separati restano due
  ✓ due strumenti eseguiti  → 2

9) functionResponse: la risposta viaggia sempre come oggetto
  ✓ e' una parte functionResponse  → true
  ✓ e response e' un oggetto  → object
  ✓ non un array  → false

10) Il marcatore di salto NON parte a priori, solo dopo il rifiuto
  ✓ al primo giro NESSUN marcatore inventato  → undefined
  ✓ dopo il rifiuto sì  → skip_thought_signature_validator
  ✓ e l'utente ottiene la risposta CON gli strumenti  → true
  ✓ senza dover rinunciare agli strumenti  → 0

✓ tutti passati — 31 controlli
```

</details>

<details>
<summary><code>test_attesa</code> — SUPERATO (codice di uscita 0)</summary>

```
BioSpecInfo — Spectra v2 caricato (copilota agentico, chat multi-provider, esame orale, ripasso SM-2, generatore guide) ✔

1) 45 s di silenzio NON troncano più il turno
  ✓ a 46 s è ancora in ascolto  → false

2) Ma dopo 20 s dice che sta ragionando
  ✓ nota mostrata  → 1
  ✓ e dice quanto aspetta  → 180

3) A 3 minuti si arrende, spiegando
  ✓ adesso ha rinunciato  → true
  ✓ è un timeout  → true
  ✓ dice 180 s, non 45  → true
  ✓ e suggerisce di spegnere il Nucleo  → true
  ✓ è marcato irraggiungibile (fa scattare la riserva)  → true

4) In Modalità Nucleo la finestra è più larga
  ✓ la nota dice 5 minuti  → 300
  ✓ a 3,5 minuti sta ancora aspettando  → false
  ✓ a 5,5 minuti si ferma  → true

✓ tutti passati — 11 controlli
```

</details>

<details>
<summary><code>test_attesalunga</code> — SUPERATO (codice di uscita 0)</summary>

```
BioSpecInfo — Spectra v2 caricato (copilota agentico, chat multi-provider, esame orale, ripasso SM-2, generatore guide) ✔

1) La soglia
  ✓ dieci secondi  → 10000

2) IL CASO REALE: Gemini Pro chiede 37s, Groq e' pronto
  ✓ la risposta arriva  → true
  ✓ NON ha aspettato  → 0
  ✓ ha cambiato fornitore  → 1
  ✓ e ha detto che era per l'attesa  → true
  ✓ dicendo quanti secondi  → attesa:37
  ✓ la risposta viene da groq  → groq

3) Senza alternative si aspetta davvero (meglio 37s di un errore)
  ✓ la risposta arriva lo stesso  → true
  ✓ stavolta ha aspettato  → 1
  ✓ e lo ha detto  → 37000
  ✓ nessun cambio di fornitore  → 0

4) Un'attesa BREVE non fa cambiare fornitore
  ✓ risponde  → true
  ✓ ha aspettato i 3 secondi  → 3000
  ✓ senza cambiare fornitore  → 0

✓ tutti passati — 14 controlli
```

</details>

<details>
<summary><code>test_tetto</code> — SUPERATO (codice di uscita 0)</summary>

```
BioSpecInfo — Spectra v2 caricato (copilota agentico, chat multi-provider, esame orale, ripasso SM-2, generatore guide) ✔

1) Il numero si legge dal messaggio del fornitore
  ✓ caso reale Groq  → 8000
  ✓ "maximum context length is 4096"  → 4096
  ✓ "tokens per minute: 6000"  → 6000
  ✓ nessun numero → null  → null
  ✓ un numero assurdamente piccolo si scarta  → null
  ✓ e uno assurdamente grande pure  → null
  ✓ messaggio vuoto  → null

2) Il costo fisso di Spectra supera davvero 8000
   prompt + 35 strumenti = 8782 token
  ✓ senza budget non ci si sta  → true

3) Col tetto imparato la richiesta si stringe
  ✓ senza tetto non taglia niente  → false
   con tetto 8000: 18/35 strumenti, totale 5072
  ✓ ora ci sta  → true
  ✓ e lo dichiara  → true
  ✓ gli strumenti giusti restano  → true

4) Il turno vero: 413, impara, riprova, riesce
  ✓ il turno RIESCE  → true
  ✓ il primo invio era troppo grande  → 413
  ✓ ha imparato il tetto  → 8000
  ✓ e lo ha detto all'utente  → 1
  ✓ due invii: quello grosso e quello stretto  → 2
  ✓ il secondo ha meno strumenti  → true
  ✓ il tetto è in memoria  → 8000

5) La volta dopo parte già stretta
  ✓ riesce  → true
  ✓ un solo invio, senza sbattere sul 413  → 1
  ✓ e non ripete l'avviso  → 0

5b) Il margine: si punta sotto il tetto dichiarato
  ✓ il tetto salvato è quello vero del fornitore  → 8000
  ✓ ma si lavora al 70%  → 5600
  ✓ perché la nostra stima sottovaluta del ~30%  → true

6) Il tetto è della CHIAVE, non del fornitore
  ✓ con un'altra chiave non vale  → null
  ✓ e nemmeno per un altro fornitore  → null

7) Il 🗑 azzera anche i tetti
  ✓ è nel gruppo chiavi  → true
  ✓ sparito  → undefined

8) Se anche col tetto non ci sta, l'errore arriva (niente ciclo)
  ✓ fallisce  → true
  ✓ col messaggio vero del fornitore  → true
  ✓ senza ciclare  → true

✓ tutti passati — 32 controlli
```

</details>

<details>
<summary><code>browser_ko</code> — SUPERATO (codice di uscita 0)</summary>

```

A) Z.AI annotato come irraggiungibile
  ✓ resta selezionato: la scelta e' dell'utente  → zai
  ✓ Z.AI e' finita nel gruppo dei non raggiungibili  → true
  ✓ e l'etichetta lo dice  → true
  ✓ gli altri restano nell'elenco normale  → 1
  ✓ l'avviso e' visibile  → true
  ✓ dice quante volte  → true
  ✓ nomina il fornitore  → true
  ✓ propone un'alternativa per cui c'e' una chiave  → true
  ✓ dice che ci riprovera' da solo  → true
  ✓ nessun errore JS  → 0

B) Nessuna alternativa configurata
  ✓ avviso visibile  → true
  ✓ al primo fallimento dice "poco fa"  → true
  ✓ indica il pulsante che c'e' a video  → true
  ✓ e spiega che non serve una chiave per saperlo  → true
  ✓ non inventa un'alternativa  → false
  ✓ nessun errore JS  → 0

C) Annotazione di due giorni fa
  ✓ nessun fornitore nel gruppo dei guasti  → 0
  ✓ nessun avviso  → false
  ✓ nessun errore JS  → 0

D) Reset "ricomincia da capo"
  ✓ c'era  → true
  ✓ e non c'e' piu'  → null
  ✓ nessun errore JS  → 0

E) Utente normale, niente annotazioni
  ✓ nessun fornitore nel gruppo dei guasti  → 0
  ✓ nessun avviso  → false
  ✓ la tendina e' completa  → 10
  ✓ nessun errore JS  → 0

F) Un turno con la rete negata annota il fornitore
  ✓ annotato in localStorage  → true
  ✓ conteggio a 1  → true
  ✓ si sposta nel gruppo dei guasti subito, senza ricaricare  → true
  ✓ e l'avviso pure  → true
  ✓ in chat il messaggio spiega il caso  → true

G) Alla seconda volta il messaggio cambia
  ✓ conteggio a 2  → true
  ✓ smette di dire "puo' essere la rete" e basta  → true
  ✓ e dice cosa fare  → true

H) Quando il servizio torna a rispondere l'annotazione sparisce
  ✓ annotazione rimossa da un 401  → null
  ✓ torna nell'elenco normale  → 0
  ✓ e l'avviso pure  → false

37 passati
```

</details>

<details>
<summary><code>browser_prova</code> — SUPERATO (codice di uscita 0)</summary>

```

A) Un fornitore bloccato, nessun'altra chiave
  ✓ il pannello si apre  → true
  ✓ Z.AI risulta non contattabile  → true
  ✓ Groq invece risponde  → true
  ✓ la riga senza chiave resta asciutta  → false
  ✓ e la misura funziona comunque senza chiave  → true
  ✓ la conclusione e' incoraggiante, non un vicolo cieco  → esito buono
  ✓ nomina i gratuiti raggiungibili  → true
  ✓ e dice cosa fare  → true
  ✓ nessun errore JS  → 0

B) La prova aggiorna cio' che l'app sa, subito
  ✓ Z.AI annotata  → true
  ✓ Groq NON annotato  → false
  ✓ un solo fornitore finisce fra i non raggiungibili  → 1
  ✓ ed e' proprio Z.AI  → true

C) Con una chiave che funziona
  ✓ dice che puoi usarlo subito  → true
  ✓ e nomina Groq  → true
  ✓ la chiave di Groq risulta a posto  → true
  ✓ nessun errore JS  → 0

D) Chiave sbagliata ≠ fornitore irraggiungibile
  ✓ lo dice esplicitamente  → true
  ✓ e NON marca il fornitore come irraggiungibile  → null
  ✓ nessun errore JS  → 0

D2) La conclusione DEVE dire quali costano
   conclusione: ✅ Puoi usare subito, gratis: Google Gemini Flash. Scegline uno dal menù qui sopra.Rispondono anche Google Gemini 3 Pro, ma sono a pagamento: consumano credito, e senza fatturazione attiva in
  ✓ separa il gratis dal pagamento  → true
  ✓ nomina il Flash come gratuito  → true
  ✓ e AVVERTE che il 3 Pro si paga  → true
  ✓ spiegando cosa comporta  → true
  ✓ nessun errore JS  → 0

E) Nessuno raggiungibile
  ✓ la conclusione avverte  → esito brutto
  ✓ ipotizza la rete bloccata  → true
  ✓ e propone il proxy come soluzione definitiva  → true
  ✓ nessun errore JS  → 0

29 passati
```

</details>

<details>
<summary><code>browser_prov</code> — SUPERATO (codice di uscita 0)</summary>

```

A) Chi aveva Mistral selezionato deve poter aprire Spectra
  ✓ Spectra si apre lo stesso  → true
  ✓ ripiega su un servizio valido  → true
  ✓ nessun errore JS  → 0

B) La tendina contiene solo i servizi tenuti
     · Groq — velocissimo · gratis
     · Google Gemini Flash · gratis
     · Z.AI GLM-4.7-Flash · gratis
     · OpenAI GPT-5.6 — record su GPQA
     · Google Gemini 3 Pro
     · DeepSeek V4 — potenza a poco
     · Claude Fable 5.1 — il massimo
     · Claude Opus 5 (Anthropic)
     · Claude Sonnet 5 — equilibrato
     · Grok 4.6 (xAI) — il migliore sugli agenti
  ✓ tre gratuiti  → 3
  ✓ niente Mistral  → false
  ✓ niente OpenRouter  → false
  ✓ c'e' Z.AI  → true

7 passati
```

</details>

<details>
<summary><code>test_doppioinvio</code> — SUPERATO (codice di uscita 0)</summary>

```

Due Invio di fila, a mezzo secondo di distanza
    · ruoli salvati: user,assistant
    · testi:         prima domanda | risposta
  ✓ nessun doppio turno "user" consecutivo  → 0
  ✓ la cronologia resta alternata e pulita  → user,assistant
  ✓ il secondo testo non e' andato perso  → seconda domanda
  ✓ non resta nessuna bolla in attesa  → 0
  ✓ il pulsante Invia e' di nuovo visibile  → true
  ✓ il pulsante Stop e' sparito  → none
  ✓ nessun errore JS  → 0

7 passati
```

</details>

<details>
<summary><code>audit_stabilita</code> — SUPERATO (codice di uscita 0)</summary>

```

═══ 1. SESSIONE LUNGA: aprire e chiudere ogni scheda 5 volte ═══
    · schede trovate: 84 (sdashboard, smol, spt, ssyn, sretro, sanimmech…)
    · nodi DOM per giro: 6620 → 34421 → 34421 → 34421 → 34421 → 34421
    · canvas   per giro: 24 → 37 → 37 → 37 → 37 → 37
    · setInterval vivi (creati-cancellati): -3
    · costruzione (giro 1): +27801 nodi
    · dopo la costruzione (giri 2-5): +0 nodi  (0/giro)
  ✓ il DOM smette di crescere a costruzione finita (< 150/giro)  → true
  ✓ i canvas non si moltiplicano dopo il primo giro  → true
  ✓ gli intervalli non si accumulano (< 25 vivi)  → true
  ✓ nessun errore JS in 5 giri completi  → 0

═══ 2. localStorage PIENO: la app deve sopravvivere ═══
  ✓ lo spazio e' davvero esaurito (la prova e' valida)  → true
  ✓ la app si disegna lo stesso  → true
  ✓ nessun errore JS con la memoria piena  → 0
  ✓ Spectra si apre comunque  → true

═══ 3. CLIC RIPETUTI: doppio invio e pulsanti impazziti ═══
  ✓ nessuna eccezione dalla raffica di clic  → 0
  ✓ non restano due pannelli sovrapposti  → true
  ✓ nessun errore JS  → 0

═══ 4. DATI SALVATI CORROTTI: JSON.parse su spazzatura ═══
  ✓ la app parte comunque  → true
  ✓ Spectra si apre con i dati corrotti  → true
  ✓ nessuna eccezione  → 
  ✓ nessun errore JS  → 0

═══ 5. OGNI PAGINA SI APRE PULITA ═══
  ✓ index — nessun errore all'avvio (6569 nodi)  → 0
  ✓ astro — nessun errore all'avvio (6335 nodi)  → 0
  ✓ chimorga — nessun errore all'avvio (3309 nodi)  → 0
  ✓ accademia — nessun errore all'avvio (181 nodi)  → 0
  ✓ rdkit_lab — nessun errore all'avvio (1522 nodi)  → 0
  ✓ simulazioni — nessun errore all'avvio (208 nodi)  → 0
  ✓ pro — nessun errore all'avvio (825 nodi)  → 0
  ✓ sr_completo — nessun errore all'avvio (5942 nodi)  → 0
  ✓ sr_essenziale — nessun errore all'avvio (1419 nodi)  → 0
  ✓ file_manager — nessun errore all'avvio (99 nodi)  → 0
  ✓ changelog_tesi — nessun errore all'avvio (252 nodi)  → 0
  ✓ guidaret — nessun errore all'avvio (11 nodi)  → 0
  ✓ download — nessun errore all'avvio (48 nodi)  → 0
  ✓ Biochimica_Guida_Definitiva — nessun errore all'avvio (7041 nodi)  → 0

29 passati
```

</details>

<details>
<summary><code>audit_promesse</code> — SUPERATO (codice di uscita 0)</summary>

```

═══ Rete a posto ═══
  ✓ index — nessuna promessa rifiutata e abbandonata
  ✓ astro — nessuna promessa rifiutata e abbandonata
  ✓ chimorga — nessuna promessa rifiutata e abbandonata
  ✓ accademia — nessuna promessa rifiutata e abbandonata
  ✓ rdkit_lab — nessuna promessa rifiutata e abbandonata
  ✓ simulazioni — nessuna promessa rifiutata e abbandonata
  ✓ pro — nessuna promessa rifiutata e abbandonata
  ✓ sr_completo — nessuna promessa rifiutata e abbandonata
  ✓ sr_essenziale — nessuna promessa rifiutata e abbandonata
  ✓ file_manager — nessuna promessa rifiutata e abbandonata
  ✓ Biochimica_Guida_Definitiva — nessuna promessa rifiutata e abbandonata

═══ Rete morta (ogni fetch verso l'esterno fallisce) ═══
  ✓ index — nessuna promessa rifiutata e abbandonata
  ✓ astro — nessuna promessa rifiutata e abbandonata
  ✓ chimorga — nessuna promessa rifiutata e abbandonata
  ✓ accademia — nessuna promessa rifiutata e abbandonata
  ✓ rdkit_lab — nessuna promessa rifiutata e abbandonata
  ✓ simulazioni — nessuna promessa rifiutata e abbandonata
  ✓ pro — nessuna promessa rifiutata e abbandonata
  ✓ sr_completo — nessuna promessa rifiutata e abbandonata
  ✓ sr_essenziale — nessuna promessa rifiutata e abbandonata
  ✓ file_manager — nessuna promessa rifiutata e abbandonata
  ✓ Biochimica_Guida_Definitiva — nessuna promessa rifiutata e abbandonata

22 passati
```

</details>

<details>
<summary><code>audit_quota</code> — SUPERATO (codice di uscita 0)</summary>

```
  ✓ index.html sopravvive a una memoria esaurita
  ✓ astro.html sopravvive a una memoria esaurita
  ✓ chimorga.html sopravvive a una memoria esaurita
  ✓ accademia.html sopravvive a una memoria esaurita
  ✓ rdkit_lab.html sopravvive a una memoria esaurita
  ✓ sr_completo.html sopravvive a una memoria esaurita
  ✓ sr_essenziale.html sopravvive a una memoria esaurita
  ✓ pro.html sopravvive a una memoria esaurita
  ✓ simulazioni.html sopravvive a una memoria esaurita
  ✓ file_manager.html sopravvive a una memoria esaurita

10 passati
```

</details>

<details>
<summary><code>test_sw</code> — SUPERATO (codice di uscita 0)</summary>

```

1) Installazione e precarico
  ✓ una sola cache, quella corrente  → 1
  ✓ il nome e' quello della versione  → true
    · cache: bsi-v165 con 36 voci
  ✓ il precarico ha messo dentro le pagine  → true
  ✓ nessun errore JS  → 0

2) Offline completo
  ✓ la app si apre senza rete  → true
    · 5995 nodi in 395 ms — "BioSpecInfo · v8"
  ✓ nessun errore JS offline  → 0

3) Rete pessima (risposte a 20 secondi)
    · caricata in 7375 ms con 6055 nodi — rete bloccata 5 volte
  ✓ la rete e' stata bloccata davvero (misura valida)  → true
  ✓ non si aspettano i 20 secondi della rete  → true
  ✓ la app viene servita dalla cache  → true
  ✓ nessun errore JS  → 0

3-bis) La gara col cronometro, misurata sul singolo fetch
  ✓ la pagina e' davvero governata dal service worker  → true
    · risposta in 3511 ms (stato 200, 603445 byte) — rete bloccata 1 volte
  ✓ la rete e' stata bloccata davvero (misura valida)  → true
  ✓ la copia in cache arriva senza aspettare la rete morta  → true
  ✓ ma il cronometro e' stato aspettato, non scavalcato  → true
  ✓ ed e' il file vero, non una risposta vuota  → true

4) Nuova versione: NON deve buttare via il lavoro aperto
   B) con del lavoro aperto
  ✓ col lavoro aperto NON si ricarica di nascosto  → true
  ✓ mostra invece la barra di aggiornamento  → true
  ✓ con "Aggiorna ora" e "Più tardi"  → 2
  ✓ e la nota e' ancora li', intatta  → true
    · barra: 🔄 Nuova versione disponibile. Hai del lavoro aperto: aggior
   A) senza niente in corso
  ✓ senza lavoro aperto si ricarica da sola  → false
  ✓ e non disturba con nessuna barra  → false
  ✓ nessun errore JS  → 0

22 passati
```

</details>

<details>
<summary><code>test_filemanager</code> — SUPERATO (codice di uscita 0)</summary>

```

1) Si clicca PRIMA che l'archivio sia aperto
  ✓ nessuna funzione esplode sul database non ancora aperto  → 0
  ✓ nessun errore JS  → 0

2) IndexedDB non disponibile (navigazione privata)
  ✓ nessuna funzione esplode  → 0
  ✓ compare l'avviso che nulla verra' conservato  → true
    · avviso: ⚠️ Archivio non disponibileIl browser non permette di salvare i file (accesso ne
  ✓ salvare una nota NON dice "salvata"  → false
  ✓ e dice invece che non e' stata salvata  → true
    · messaggio: ❌ Nota NON salvata: accesso negato
  ✓ nessun errore JS  → 0

3) Spazio esaurito: le scritture vengono rifiutate
  ✓ nessuna eccezione sfugge  → 0
  ✓ dice che la nota non e' stata salvata  → true
    · messaggio: ❌ Nota NON salvata: spazio esaurito sul dispositivo
  ✓ la barra di avanzamento NON resta bloccata accesa  → none
  ✓ nessun errore JS  → 0

4) Il caso normale non e' stato rotto dalle protezioni
  ✓ conferma il salvataggio  → true
  ✓ e la nota c'e' davvero nell'archivio  → nota vera
  ✓ nessun avviso di guasto quando tutto va bene  → false
  ✓ nessun errore JS  → 0

15 passati
```

</details>

<details>
<summary><code>test_visore3d</code> — SUPERATO (codice di uscita 0)</summary>

```
    · all'avvio: 0 contesti WebGL, 0 tele create

Si sfogliano 10 molecole diverse nel visore 3D
    · sfogliando: 0 contesti WebGL, 1 tele create per 10 molecole
    · canvas rimasti nel riquadro: 1
    · ultima molecola disegnata: CCCCO
  ✓ sfogliare molecole non apre un contesto WebGL per ciascuna  → true
  ✓ e non costruisce un visore nuovo per ogni molecola  → true
  ✓ e nel riquadro resta una sola tela  → 1
  ✓ il visore ha comunque disegnato qualcosa  → true
  ✓ nessun errore JS  → 0

5 passati
```

</details>

<details>
<summary><code>browser_reset</code> — SUPERATO (codice di uscita 0)</summary>

```

1) Il pulsante esiste ed è nella barra
  ✓ pulsante presente  → true
  ✓ pannello inizialmente chiuso  → none

2) Un clic apre il pannello, non cancella niente
  ✓ pannello aperto  → block
  ✓ chat ancora salvate  → true
  ✓ chiavi ancora salvate  → true

3) Le caselle predefinite sono chat + chiavi
  ✓ cinque gruppi offerti  → 5
  ✓ spuntati di partenza  → chat,chiavi
  ✓ memoria NON spuntata  → false
  ✓ ripasso disattivato perché vuoto  → true

4) Annulla non cancella
  ✓ pannello chiuso  → none
  ✓ chat intatte  → true

5) Conferma: cancella chat e chiavi, non il resto
  ✓ chat cancellate  → null
  ✓ chiavi cancellate  → null
  ✓ chiave VECCHIA cancellata  → null
  ✓ cache modello cancellata  → null
  ✓ memoria preservata (non spuntata)  → ["studia biochimica"]
  ✓ appunto preservato  → appunto importante
  ✓ LICENZA preservata  → LICENZA-VERA

6) La UI riparte davvero da capo
  ✓ una sola chat vuota  → 1
  ✓ richiede di nuovo la chiave  → block
  ✓ conferma a schermo  → true

7) Dopo un ricaricamento la chiave vecchia non risorge
  ✓ nessuna mappa chiavi  → null
  ✓ nessuna chiave vecchia  → null
  ✓ nessun errore JS  → 0

24 passati
```

</details>

<details>
<summary><code>browser_proxy</code> — SUPERATO (codice di uscita 0)</summary>

```

A) Senza PROXY_URL (stato del deploy)
  ✓ nessun errore JS  → 0
  ✓ proxy non attivo  → 
  ✓ nessuna richiesta a /stato  → 0
  ✓ non copre nulla  → false

B) Con un proxy che copre groq e gemini
  ✓ proxy attivo  → https://proxy.finto.test
  ✓ copre groq  → true
  ✓ copre gemini  → true
  ✓ NON copre claude  → false
  ✓ utilizzabile senza chiavi salvate  → true
  ✓ instradata al proxy  → https://proxy.finto.test/groq/openai/v1/chat/completions
  ✓ senza Authorization  → undefined
  ✓ nessun errore JS  → 0
  ✓ riquadro chiave nascosto  → none
  ✓ badge mostrato  → block
  ✓ badge spiega perché  → true

15 passati
```

</details>

<details>
<summary><code>browser_proxyui</code> — SUPERATO (codice di uscita 0)</summary>

```

A) Con una chiave salvata il riquadro 🔑 sparisce, il proxy no
  ✓ riquadro chiave nascosto  → none
  ✓ ma il blocco proxy c'è  → true
  ✓ ed è ripiegato su una riga  → none
  ✓ che dice già cosa fa  → true
  ✓ nessun errore JS  → 0

B) Si apre al tocco
  ✓ corpo aperto  → block

C) Un indirizzo non https viene respinto senza salvare
  ✓ lo dice  → true
  ✓ e NON lo salva  → null

D) Un proxy che non risponde non resta impostato
  ✓ lo dice  → true
  ✓ e ripristina lo stato di prima  → null

E) Un proxy che risponde viene collegato e riassunto
  ✓ collegato  → true
  ✓ elenca cosa copre  → true
  ✓ salvato  → https://proxy-vero.test
  ✓ la riga chiusa lo dice senza doverla aprire  → true

F) Scollegare torna alle chiavi
  ✓ rimosso  → null
  ✓ e il sommario torna com'era  → true
  ✓ nessun errore JS in tutto il giro  → 0

17 passati
```

</details>

<details>
<summary><code>browser_rdkit</code> — SUPERATO (codice di uscita 0)</summary>

```

1) Gli strumenti esistono e sono ben formati
  ✓ Spectra caricato  → function

2) analizza_molecola: dati tabulati
  ✓ trova l'aspirina  → tabulato
  ✓ formula giusta  → C9H8O4
  ✓ due bande C=O (estere + acido)  → true
  ✓ insensibile alle maiuscole  → tabulato
  ✓ trova per sinonimo  → aspirina
  ✓ trova per SMILES  → aspirina
  ✓ dichiara che i valori dipendono dal solvente  → true
   fuori elenco → ["estere"]
  ✓ fuori elenco: dice che è dedotto  → dedotto dai gruppi funzionali
  ✓ e riconosce l'estere  → true
  ✓ e AVVERTE che non è misurato  → true
  ✓ un estere NON viene dato anche per alcol  → false
  ✓ nessuna banda O–H fantasma  → false
  ✓ un alcol vero però lo riconosce  → true
   ammide+fenolo → ["ammide","aromatico","alcol o fenolo"]
  ✓ ammide riconosciuta  → true
  ✓ e il fenolo che resta pure  → true
  ✓ nome inventato: fallisce onestamente  → false
  ✓ e spiega cosa fare  → true

3) disegna_molecola: apre il lab e carica lo SMILES
  ✓ lo strumento riesce  → true
  ✓ il lab è aperto e ha l'API  → object
  ✓ lo SMILES è arrivato nel campo  → CC(=O)Oc1ccccc1C(O)=O
  ✓ è sul pannello molecola  → p-mol

4) mostra_spettri: cambia pannello e tipo
  ✓ lo strumento riesce  → true
  ✓ siamo sul pannello spettri  → p-speclive
  ✓ il tipo richiesto è attivo  → ir
  ✓ lo SMILES è nel campo spettri  → CC(=O)Oc1ccccc1C(O)=O
  ✓ dice che si vede un tipo per volta  → true

5) Un tipo non valido non rompe niente
  ✓ ripiega su nmr  → nmr
  ✓ senza fallire  → true

6) Il lab non obbedisce a una pagina qualsiasi
  ✓ messaggio senza mittente valido: ignorato  → CCO

7) Nessun errore JS in tutto il giro
  ✓ errori  → 0

31 passati
```

</details>

<details>
<summary><code>browser_lab</code> — SUPERATO (codice di uscita 0)</summary>

```

1) La chimica: il benzene NON ha CH₂ né CH₃
   IR benzene: ["=C-H (Ar)C=C Ar=C-H oop","=C-H (Ar)","C=C Ar","=C-H oop"]
   ¹H benzene: ["ArH","ArH"]
  ✓ IR: niente CH₂ str  → false
  ✓ IR: niente CH₂ bend  → false
  ✓ IR: niente CH₃ bend  → false
  ✓ IR: niente C-H alifatico  → false
  ✓ IR: c'è =C-H aromatico  → true
  ✓ IR: c'è C=C aromatico  → true
  ✓ ¹H: nessun metile a 0,9  → false

2) Il toluene invece il metile ce l'ha — ma a 2,3 non a 0,9
   ¹H toluene: ["ArHAr-CH₃","ArH","Ar-CH₃"]
  ✓ IR: CH₃ bend c'è  → true
  ✓ IR: CH₂ NON c'è (il toluene non ne ha)  → false
  ✓ ¹H: il metile è marcato come aromatico  → true
  ✓ e NON compare un metile alifatico a 0,9  → false

3) Il cicloesano ha CH₂ ma nessun CH₃
  ✓ CH₂ sì  → true
  ✓ CH₃ no  → false

4) Un solo pulsante "Indietro"
  ✓ quello dell'overlay c'è  → 1
  ✓ e il lab non ne aggiunge un secondo  → 0

5) I pulsanti flottanti non coprono i comandi del lab
  ✓ l'app sa che c'è un overlay  → true
  ✓ FAB Spectra nascosto  → none
  ✓ FAB strumenti nascosto  → none

6) Chiudendo l'overlay tornano
  ✓ l'app sa che è chiuso  → false
  ✓ FAB di nuovo visibile  → true

7) Nessun errore JS
  ✓ errori  → 0

21 passati
```

</details>

<details>
<summary><code>browser_frontiera</code> — SUPERATO (codice di uscita 0)</summary>

```

Tendina completa:
   1. Groq — velocissimo · gratis
   2. Google Gemini Flash · gratis
   3. Z.AI GLM-4.7-Flash · gratis
   4. OpenAI GPT-5.6 — record su GPQA
   5. Google Gemini 3 Pro
   6. DeepSeek V4 — potenza a poco
   7. Claude Fable 5.1 — il massimo
   8. Claude Opus 5 (Anthropic)
   9. Claude Sonnet 5 — equilibrato
  10. Grok 4.6 (xAI) — il migliore sugli agenti
  ✓ 10 configurazioni  → 10
  ✓ 3 gratuite  → 3
  ✓ c'e' GPT-5.6  → true
  ✓ c'e' Gemini 3 Pro  → true
  ✓ c'e' DeepSeek  → true

Chiave condivisa nella UI
  ✓ su Sonnet non richiede la chiave  → none
  ✓ su Groq la richiede  → block
  ✓ una sola voce salvata  → claude_fable
  ✓ nessun errore JS  → 0

9 passati
```

</details>

<details>
<summary><code>test_aggiorna</code> — SUPERATO (codice di uscita 0)</summary>

```

1) La versione dichiarata e' quella vera
    · app: bsi-v165   ·  sw.js: bsi-v165
  ✓ BSI_APP_VERSION coincide con la cache del service worker  → bsi-v165
  ✓ e non e' piu' la vecchia v140  → false

2) Si arriva alla finestra degli aggiornamenti
  ✓ il vecchio 🔄 e' ancora sepolto (il difetto era questo)  → nascosto da hdr-actions
  ✓ il ✨ e' davvero cliccabile  → true
  ✓ il pannello strumenti si apre  → true
  ✓ e contiene la voce Aggiornamenti  → true
    · voce: 🔄AggiornamentiVersione installata e controllo nuove version

3) La voce apre davvero la finestra
  ✓ la finestra si apre  → true
  ✓ e dichiara la versione giusta  → true
    · 🔄AggiornamentiVersione installata: bsi-v165Premi “Controlla” per verificare se è disponib
  ✓ nessun errore JS  → 0

9 passati
```

</details>

<details>
<summary><code>test_guidaproxy</code> — SUPERATO (codice di uscita 0)</summary>

```

1) Si arriva alla guida dal riquadro del proxy
  ✓ il pulsante "come si attiva" esiste  → true
  ✓ e apre la guida  → true
  ✓ con i comandi da eseguire  → 4
  ✓ spiega che le chiavi finiscono sul server  → true
  ✓ e che i fornitori bloccati tornano a rispondere  → true
  ✓ nomina wrangler deploy  → true
  ✓ e il segreto con la chiave  → true

2) I comandi si copiano davvero
  ✓ c'è un pulsante copia  → true
  ✓ e ha copiato il comando giusto  → cd proxy
  ✓ dandone conferma a schermo  → true

3) Chiudendo si richiude, senza rompere nulla
  ✓ la guida si richiude  → true
  ✓ nessun errore JS  → 0

12 passati
```

</details>

<details>
<summary><code>verifica_guida</code> — SUPERATO (codice di uscita 0)</summary>

```

1) Elenco nel codice
  ✓ 10 configurazioni  → 10
  ✓ 3 gratuite  → 3
   groq, gemini, zai, openai, gemini_pro, deepseek, claude_fable, claude, claude_sonnet, grok

2) Ogni fornitore ha una sezione passo passo nella guida
  ✓ groq: indirizzo presente  → true
  ✓ gemini: indirizzo presente  → true
  ✓ zai: indirizzo presente  → true
  ✓ openai: indirizzo presente  → true
  ✓ grok: indirizzo presente  → true
  ✓ deepseek: indirizzo presente  → true
  ✓ claude_fable: indirizzo presente  → true
  ✓ gemini_pro: rimanda alla fatturazione  → true

3) Nessun fornitore rimosso citato come disponibile
  ✓ GitHub Models: non compare fra i disponibili  → false
  ✓ Mistral: non compare fra i disponibili  → false
  ✓ OpenRouter: non compare fra i disponibili  → false
  ✓ Haiku: non compare fra i disponibili  → false
  ✓ NVIDIA: non compare fra i disponibili  → false

4) Codice e proxy allineati
  ✓ ogni rotta del codice esiste nel Worker  → 0
  ✓ nessun fornitore ritirato nel Worker  → false
  ✓ NVIDIA non e' piu' nel registro dell'app  → false
  ✓ ma la rotta del Worker resta, per chi usa il proxy  → true

5) I segreti citati nel README del proxy esistono nel Worker
  ✓ nessun segreto inventato nel README  → 0

6) Modelli dismessi: solo nei commenti, mai come candidati
  ✓ llama-3.3-70b-versatile: non è un candidato  → false
  ✓ llama-3.1-8b-instant: non è un candidato  → false
  ✓ grok-3: non è un candidato  → false
  ✓ gpt-4.1: non è un candidato  → false

7) Ciò che la guida promette sui fornitori irraggiungibili esiste davvero
  ✓ la guida parla del caso  → true
  ✓ la guida dice 24 ore  → true
  ✓ e il codice usa 24 ore  → 24
  ✓ la guida promette il gruppo a parte  → true
  ✓ e il codice lo costruisce davvero  → true
  ✓ con l'etichetta che lo dice  → true
  ✓ l'annotazione si cancella su risposta ricevuta  → true
  ✓ e si scrive sul fallimento di rete  → true
  ✓ bsi_prov_ko e' nel gruppo cancellabile "chiavi"  → true
  ✓ la guida indica il gruppo giusto  → true
  ✓ l'header Claude citato esiste  → true

8) Il pulsante 🔌 Prova promesso dalla guida esiste e fa quello che dice
  ✓ la guida lo documenta  → true
  ✓ il pulsante e' nel codice  → true
  ✓ prova TUTTI i fornitori, non un elenco scritto a mano  → true
  ✓ funziona senza chiave  → true
  ✓ usa buildRequest, non un indirizzo inventato  → true
  ✓ con un corpo minimo  → true
  ✓ e registra l'esito nella memoria  → true

9) Il ritiro di un modello: la guida descrive il meccanismo che c'e'
  ✓ la guida ne parla  → true
  ✓ promette che legge il sostituto dal fornitore  → true
  ✓ e il codice lo fa davvero  → true
  ✓ boccia il modello fallito  → true
  ✓ la guida dice sette giorni  → true
  ✓ e il codice usa 7 giorni  → 7
  ✓ bsi_modelli_ko si cancella col 🗑  → true

10) Il campo del proxy promesso dalla guida
  ✓ la guida lo documenta  → true
  ✓ il campo esiste  → true
  ✓ sta FUORI dal riquadro della chiave  → true
  ✓ non salva un indirizzo che non risponde  → true

11) Il sovraccarico: la guida promette quello che il codice fa
  ✓ la guida ne parla  → true
  ✓ il codice riconosce gli stati temporanei  → true
  ✓ HTTP 429: nel codice  → true
  ✓ HTTP 429: citato nella guida  → true
  ✓ HTTP 500: nel codice  → true
  ✓ HTTP 500: citato nella guida  → true
  ✓ HTTP 502: nel codice  → true
  ✓ HTTP 502: citato nella guida  → true
  ✓ HTTP 503: nel codice  → true
  ✓ HTTP 503: citato nella guida  → true
  ✓ HTTP 504: nel codice  → true
  ✓ HTTP 504: citato nella guida  → true
  ✓ HTTP 529: nel codice  → true
  ✓ HTTP 529: citato nella guida  → true
  ✓ la guida dice quattro volte  → true
  ✓ e il codice ne fa 4  → 4
  ✓ dopo i tentativi passa a un altro fornitore  → true

12) Nessun marcatore di conflitto e' finito nei file
  ✓ file con marcatori di conflitto  → 0
   (78 file di testo controllati)

71 controlli passati
```

</details>

<details>
<summary><code>@verifica-documenti</code> — SUPERATO (codice di uscita 0)</summary>

```
Verifica della documentazione

Versione del codice (sw.js): bsi-v165

── Collegamenti interni ──
  ✓ nessun collegamento interno rotto

── Versione dichiarata nei documenti ──
  ✓ nessun documento cita una versione superata

── Le due righe della versione ──
  ✓ BSI_APP_VERSION coincide con CACHE

── Strumenti citati ──
  ✓ esiste tools/genera-evidenza.js
  ✓ esiste tools/genera-sbom.js
  ✓ esiste tools/verifica-farmaci.js
  ✓ esiste docs/evidence/deviazioni-note.json
  ✓ esiste docs/evidence/sbom.cdx.json
  ✓ esiste docs/evidence/RAPPORTO-VERIFICA.md

── Coerenza dell'indice ──
  ✓ ogni documento numerato è nell'indice
      (16 documenti numerati)

── Registro delle deviazioni ──
  ✓ ogni deviazione porta un motivo scritto
      (25 deviazioni registrate)

11 controlli passati
```

</details>

---

## 5. Come riprodurre questo rapporto

```bash
# 1. dalla radice del repository, al commit indicato al §2
git checkout ca9e6e5a1e1f

# 2. dipendenze di prova (solo Playwright, nessuna dipendenza di runtime)
npm install

# 3. server locale: RDKit WASM richiede contesto HTTP
python3 -m http.server 8899 &

# 4. esecuzione
node tools/genera-evidenza.js
```

I banchi risiedono nella cartella indicata dalla variabile `BSI_BANCHI`
(predefinita: area di lavoro della sessione). L'opzione `--veloce` salta i
banchi che richiedono un browser, utile per un controllo rapido ma **non
sufficiente** per un'attestazione: quelli sono i banchi che misurano il
comportamento reale.

---

## 6. Dichiarazione

Il presente rapporto è prodotto da un programma che esegue i banchi e ne
trascrive l'uscita senza intervento manuale. Un banco fallito compare nel
rapporto con lo stesso rilievo di uno superato, e l'esito complessivo al §1
è calcolato dai codici di uscita, non redatto.

I limiti noti e dichiarati dei predittori scientifici sono documentati in
`docs/06-Scientific-Accuracy-Data-Provenance.md` e non sono trattati come
difetti da questo rapporto.

_Generato il 2026-09-20T17:37:47.059Z._
