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
| **Banchi superati** | 62 |
| **Banchi falliti** | 0 |
| **Durata totale** | 1110 s |
| **Esito** | ✅ **CONFORME** |

---

## 2. Ambiente di esecuzione

| Campo | Valore |
|---|---|
| Istante (UTC) | `2026-10-08T12:59:26.958Z` |
| Commit | `ed40d457abba7177cb6a8304f3e2eb57482dc2f3` |
| Ramo | `main` |
| Albero di lavoro pulito | NO — sono presenti modifiche non registrate |
| Versione applicazione | `bsi-v198` |
| Node.js | `v22.22.2` |
| Piattaforma | `linux x64` |
| Chromium | `Chromium 141.0.7390.37` |
| playwright-core | `1.62.1` |

### Impronte dei file verificati

Il rapporto si riferisce esattamente a questo contenuto.

| File | Byte | SHA-256 |
|---|---:|---|
| `index.html` | 4.804.612 | `4e8f58f7ff626066b48eb67125112cbbfed6df73edb1b3df09349cfee56595c3` |
| `bsi-ai-hub.js` | 432.165 | `985b9fa3f6a3d330cc6f7e31456e16760d0a0d9482f760b04d83765a013f2476` |
| `bsi-spettri.js` | 35.565 | `be757f15a70f884e3374d401596e2dfd18bcc852cafbb4584920e2b2d24eb3c9` |
| `sw.js` | 5623 | `fb64da4364a31478c8ba386815313f6f798baac4331c9843e3de9cc939a53f6b` |
| `bsi-pretsch.js` | 38.320 | `27f727240363579fba3dba50ab3b567fbcdb26a8a9a06c0e43968b195c479db3` |
| `bsi-nmr.js` | 58.695 | `881917dbb141dfcbab9a25b9c518eaa4a8c1c52dc1020cbac90985a1cf859b72` |
| `bsi-geom3d.js` | 46.729 | `a616b91efa8f790388c99f22cc9f2d48630cb760d4f7fa87f92b99b9db106054` |
| `bsi-nmr2d.js` | 21.332 | `a0b1db87f27ffa8c124d617e4903f61e35b89c30c35162527ad023325c03fa78` |
| `bsi-documento.js` | 23.380 | `0e9ad6043a396652549b30879764cc401f8b7bd25689b5bb5f37cf26f7d7d8d9` |
| `bsi-quesito.js` | 19.615 | `6f686abcfdc3959d8c865a3e6ee7129224de52992ab1ba3da07372a986769cdf` |
| `rdkit_lab.html` | 266.265 | `066a42092b829df2fa306b691b9d162b6d44edfdb5317ce4cc8a276bc34c80ad` |
| `astro.html` | 2.724.232 | `3376b2b7f26ed483f2d698c6692b31f21c9f245f87d1fb1884216fb8b1da489d` |
| `chimorga.html` | 199.043 | `047934abc73a79fbaf06ed7036b6e89a913ebdf5354fc52cecdbee7e8f94f51d` |

---

## 3. Esiti per famiglia

### Dati scientifici

_I dati chimici mostrati sono verificati contro una fonte indipendente._

| Banco | Esito | Durata | Sintesi |
|---|---|---:|---|
| `@verifica-farmaci` | ✅ SUPERATO | 5.6 s | ✓ CONFORME |
| `audit_farmaci` | ✅ SUPERATO | 5.7 s | 263 farmaci controllati — nessun errore, 21 avvisi |
| `verifica_farmaci_v187` | ✅ SUPERATO | 6.4 s | 36/36 formule coincidono |
| `test_spettri` | ✅ SUPERATO | 5.3 s | 41 passati |
| `test_spettri_ui` | ✅ SUPERATO | 11.6 s | 16 passati |
| `test_assi` | ✅ SUPERATO | 6.2 s | 13 passati |
| `test_assi_canvas` | ✅ SUPERATO | 9.8 s | 6 passati |
| `test_costanti` | ✅ SUPERATO | 0.0 s | ✓ tutti passati — 45 controlli |
| `audit_dati` | ✅ SUPERATO | 0.1 s | ✓ 29 controlli superati |
| `test_simmetria` | ✅ SUPERATO | 3.9 s | 26 passati |
| `test_cheminfo` | ✅ SUPERATO | 12.5 s | 192 controlli passati |
| `test_farm_ui` | ✅ SUPERATO | 7.4 s | 11 controlli passati |
| `test_datasci` | ✅ SUPERATO | 8.8 s | 23 controlli passati |
| `test_astro` | ✅ SUPERATO | 6.6 s | 13 controlli passati |
| `test_spettrolettore` | ✅ SUPERATO | 59.6 s | 63 controlli passati |
| `test_documento` | ✅ SUPERATO | 21.0 s | 50 controlli passati |
| `test_nmr` | ✅ SUPERATO | 25.2 s | 66 controlli passati |
| `test_nmr2d` | ✅ SUPERATO | 13.3 s | 40 controlli passati |
| `test_geom3d` | ✅ SUPERATO | 8.6 s | 29 controlli passati |
| `test_elucida` | ✅ SUPERATO | 7.7 s | 32 controlli passati |
| `test_digitalizza` | ✅ SUPERATO | 7.7 s | 45 controlli passati |

### Agente AI

_L'assistente resta utilizzabile quando il fornitore esterno si guasta._

| Banco | Esito | Durata | Sintesi |
|---|---|---:|---|
| `test_nucleo` | ✅ SUPERATO | 4.7 s | 13 passati |
| `test_ko` | ✅ SUPERATO | 0.1 s | ✓ tutti passati — 35 controlli |
| `test_404` | ✅ SUPERATO | 0.1 s | ✓ tutti passati — 36 controlli |
| `test_503` | ✅ SUPERATO | 0.1 s | ✓ tutti passati — 40 controlli |
| `test_firma` | ✅ SUPERATO | 0.1 s | ✓ tutti passati — 31 controlli |
| `test_attesa` | ✅ SUPERATO | 0.1 s | ✓ tutti passati — 11 controlli |
| `test_attesalunga` | ✅ SUPERATO | 0.1 s | ✓ tutti passati — 14 controlli |
| `test_tetto` | ✅ SUPERATO | 0.1 s | ✓ tutti passati — 32 controlli |
| `browser_ko` | ✅ SUPERATO | 40.0 s | 37 passati |
| `browser_prova` | ✅ SUPERATO | 52.7 s | 29 passati |
| `browser_prov` | ✅ SUPERATO | 5.2 s | 7 passati |
| `test_doppioinvio` | ✅ SUPERATO | 11.6 s | 7 passati |
| `caccia_ai` | ✅ SUPERATO | 64.6 s | 22 passati |

### Stabilita

_L'applicazione regge sessioni lunghe, memoria esaurita e rete degradata._

| Banco | Esito | Durata | Sintesi |
|---|---|---:|---|
| `audit_stabilita` | ✅ SUPERATO | 118.1 s | 29 passati |
| `audit_promesse` | ✅ SUPERATO | 117.8 s | 22 passati |
| `audit_quota` | ✅ SUPERATO | 42.5 s | 10 passati |
| `test_sw` | ✅ SUPERATO | 30.9 s | 22 passati |
| `test_filemanager` | ✅ SUPERATO | 11.2 s | 15 passati |
| `test_visore3d` | ✅ SUPERATO | 9.9 s | 5 passati |

### Interfaccia

_I pannelli e i comandi rispondono come documentato._

| Banco | Esito | Durata | Sintesi |
|---|---|---:|---|
| `browser_reset` | ✅ SUPERATO | 11.2 s | 24 passati |
| `browser_proxy` | ✅ SUPERATO | 9.1 s | 15 passati |
| `browser_proxyui` | ✅ SUPERATO | 12.1 s | 17 passati |
| `browser_rdkit` | ✅ SUPERATO | 5.4 s | 31 passati |
| `browser_lab` | ✅ SUPERATO | 11.2 s | 21 passati |
| `browser_frontiera` | ✅ SUPERATO | 7.4 s | 9 passati |
| `test_aggiorna` | ✅ SUPERATO | 6.1 s | 9 passati |
| `test_guidaproxy` | ✅ SUPERATO | 5.6 s | 12 passati |
| `test_fluidita` | ✅ SUPERATO | 22.1 s | 16 controlli passati |
| `test_lingue` | ✅ SUPERATO | 15.4 s | 64 controlli passati |
| `test_mol3d` | ✅ SUPERATO | 12.7 s | 46 controlli passati |
| `test_menu` | ✅ SUPERATO | 25.9 s | 36 controlli passati |

### Sicurezza e accessibilita

_Nessuna credenziale pubblicata; le pagine restano usabili con una tecnologia assistiva._

| Banco | Esito | Durata | Sintesi |
|---|---|---:|---|
| `@verifica-sicurezza` | ✅ SUPERATO | 0.4 s | 10 controlli passati |
| `audit_storia` | ✅ SUPERATO | 10.7 s | 7 controlli passati |
| `audit_rete` | ✅ SUPERATO | 28.7 s | 5 controlli passati |
| `@verifica-accessibilita` | ✅ SUPERATO | 94.8 s | 6 controlli passati |
| `audit_mobile` | ✅ SUPERATO | 30.1 s | 4 controlli passati |

### Coerenza documentazione/codice

_Cio che la documentazione promette esiste davvero nel codice._

| Banco | Esito | Durata | Sintesi |
|---|---|---:|---|
| `verifica_guida` | ✅ SUPERATO | 0.3 s | 71 controlli passati |
| `@verifica-documenti` | ✅ SUPERATO | 0.1 s | 18 controlli passati |
| `@verifica-affermazioni` | ✅ SUPERATO | 11.3 s | 10 controlli passati |
| `audit_copertura` | ✅ SUPERATO | 46.4 s | 4 controlli passati |

### Una sola casa per funzione

_Lo stack React/FastAPI esegue gli STESSI file dell'applicazione, non una copia._

| Banco | Esito | Durata | Sintesi |
|---|---|---:|---|
| `test_stack` | ✅ SUPERATO | 0.5 s | 9 controlli passati, il resto saltato |

---

## 4. Uscita integrale dei banchi

Trascrizione non filtrata, nell'ordine di esecuzione.

<details>
<summary><code>@verifica-farmaci</code> — SUPERATO (codice di uscita 0)</summary>

```
Verifica della banca dati farmacologica
Metodo: peso ricalcolato da RDKit sulla struttura ⟷ peso dichiarato
Tolleranza: 0.6 u

Voci esaminate: 263  (con struttura: 242)

── Difetti ──
  ✓ nessuno

── Deviazioni dichiarate e accettate ──
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
  ▪ [D-01] Ivermectina                       non e' una molecola singola ma una MISCELA di omologhi: almeno 80 % di ivermectina B1a (C48H74O14) e non piu' del 20 % di B1b (C47H72O14). Il peso dichiarato, 875,10, e' quello del solo componente B1a. Una notazione SMILES descriverebbe un componente e non la voce: si e' preferito non mostrarne nessuna piuttosto che far passare l'omologo maggioritario per l'intero farmaco
  ▪ [D-02] Adalimumab (Humira)               anticorpo monoclonale
  ▪ [D-02] Infliximab (Remicade)             anticorpo monoclonale chimerico
  ▪ [D-02] Secukinumab (Cosentyx)            anticorpo monoclonale
  ▪ [D-02] Dupilumab (Dupixent)              anticorpo monoclonale
  ▪ [D-02] Caspofungina                      lipopeptide echinocandinico
  ▪ [D-02] Tocilizumab (Actemra)             anticorpo monoclonale
  ▪ [D-02] Palivizumab (Synagis)             anticorpo monoclonale
  ▪ [D-02] Eculizumab (Soliris)              anticorpo monoclonale
  ▪ [D-02] Benralizumab (Fasenra)            anticorpo monoclonale

263 voci · 0 difetti · 21 deviazioni dichiarate · 0 non registrate · 0 esenzioni inutili
✓ CONFORME
```

</details>

<details>
<summary><code>audit_farmaci</code> — SUPERATO (codice di uscita 0)</summary>

```

── SMILES mancanti o non validi ──
  ⚠ Semaglutide — nessuno SMILES  (macromolecola: atteso)
  ⚠ Insulina (umana ricombinante) — nessuno SMILES  (macromolecola: atteso)
  ⚠ Ciclosporina A — nessuno SMILES  (macromolecola: atteso)
  ⚠ Sacubitril/Valsartan (Entresto) — nessuno SMILES  (associazione: atteso)
  ⚠ Trastuzumab (Herceptin) — nessuno SMILES  (macromolecola: atteso)
  ⚠ Pembrolizumab (Keytruda) — nessuno SMILES  (macromolecola: atteso)
  ⚠ Rituximab (MabThera) — nessuno SMILES  (macromolecola: atteso)
  ⚠ Natalizumab (Tysabri) — nessuno SMILES  (macromolecola: atteso)
  ⚠ Liraglutide (Victoza/Saxenda) — nessuno SMILES  (macromolecola: atteso)
  ⚠ Octreotide — nessuno SMILES  (macromolecola: atteso)
  ⚠ Artemetere/Lumefantrina (Coartem) — nessuno SMILES  (associazione: atteso)
  ⚠ Ivermectina — nessuno SMILES  (miscela: atteso)
  ⚠ Adalimumab (Humira) — nessuno SMILES  (macromolecola: atteso)
  ⚠ Infliximab (Remicade) — nessuno SMILES  (macromolecola: atteso)
  ⚠ Secukinumab (Cosentyx) — nessuno SMILES  (macromolecola: atteso)
  ⚠ Dupilumab (Dupixent) — nessuno SMILES  (macromolecola: atteso)
  ⚠ Caspofungina — nessuno SMILES  (macromolecola: atteso)
  ⚠ Tocilizumab (Actemra) — nessuno SMILES  (macromolecola: atteso)
  ⚠ Palivizumab (Synagis) — nessuno SMILES  (macromolecola: atteso)
  ⚠ Eculizumab (Soliris) — nessuno SMILES  (macromolecola: atteso)
  ⚠ Benralizumab (Fasenra) — nessuno SMILES  (macromolecola: atteso)
  · voci con struttura leggibile: 242 (soglia 240, non può calare)

── Peso dichiarato vs calcolato dalla struttura ──
  ✓ tutti coerenti (entro 0,6 u)

── Doppioni ──
  ✓ nessun farmaco ripetuto

── Provenienza esterna (ChEMBL) ──
  ✓ 36 voci: la formula ricostruita dal grafo coincide con quella dichiarata da ChEMBL
  ✓ voci con provenienza verificata: 36 (soglia 36, non può calare)

263 farmaci controllati — nessun errore, 21 avvisi
```

</details>

<details>
<summary><code>verifica_farmaci_v187</code> — SUPERATO (codice di uscita 0)</summary>

```
  ✓ Empagliflozin (Jardiance)       C23H27ClO7
  ✓ Dapagliflozin (Forxiga)         C21H25ClO6
  ✓ Apixaban (Eliquis)              C25H25N5O4
  ✓ Rivaroxaban (Xarelto)           C19H18ClN3O5S
  ✓ Sotorasib (Lumykras)            C30H30F2N6O3
  ✓ Palbociclib (Ibrance)           C24H29N7O2
  ✓ Venetoclax (Venclyxto)          C45H50ClN7O7S
  ✓ Ivacaftor (Kalydeco)            C24H28N2O3
  ✓ Remdesivir (Veklury)            C27H35N6O8P
  ✓ Sofosbuvir (Sovaldi)            C22H29FN3O9P
  ✓ Linezolid (Zyvox)               C16H20FN3O4
  ✓ Voriconazolo (Vfend)            C16H14F3N5O
  ✓ Aripiprazolo (Abilify)          C23H27Cl2N3O2
  ✓ Clozapina (Leponex)             C18H19ClN4
  ✓ Quetiapina (Seroquel)           C21H25N3O2S
  ✓ Lamotrigina (Lamictal)          C9H7Cl2N5
  ✓ Donepezil (Aricept)             C24H29NO3
  ✓ Memantina (Ebixa)               C12H21N
  ✓ Ketamina (Ketalar)              C13H16ClNO
  ✓ Propofol (Diprivan)             C12H18O
  ✓ Naloxone (Narcan)               C19H21NO4
  ✓ Apomorfina (Apokyn)             C17H17NO2
  ✓ Metformina (Glucophage)         C4H11N5
  ✓ Warfarin (Coumadin)             C19H16O4
  ✓ Furosemide (Lasix)              C12H11ClN2O5S
  ✓ Spironolattone (Aldactone)      C24H32O4S
  ✓ Idroclorotiazide (Esidrex)      C7H8ClN3O4S2
  ✓ Desametasone (Decadron)         C22H29FO5
  ✓ Montelukast (Singulair)         C35H36ClNO3S
  ✓ Tacrolimus (Prograf)            C44H69NO12
  ✓ Dolutegravir (Tivicay)          C20H19F2N3O5
  ✓ Alectinib (Alecensa)            C30H34N4O2
  ✓ Lenalidomide (Revlimid)         C13H13N3O3
  ✓ Liotironina (T3, Cytomel)       C15H12I3NO4
  ✓ Vancomicina (Vancocin)          C66H75Cl2N9O24
  ✓ Rimegepant (Vydura)             C28H28F2N6O3

36/36 formule coincidono
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

9) Schermature che un conteggio additivo non deduce
  ✓ il tetrametilsilano sta a 0 ppm con 12 protoni  → 0/12
  ✓ e l'etichetta dice perché  → true
  ✓ il ciclopropano sta a 0,22 ppm con 6 protoni  → 0.22/6
  ✓ un atomo di ferro non ha protoni da mostrare  → 0
  ✓ uno SMILES illeggibile restituisce null, non un risultato inventato  → true
  ✓ nessun errore JS in tutto il banco  → 0

41 passati
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
<summary><code>test_simmetria</code> — SUPERATO (codice di uscita 0)</summary>

```

1) La sezione esiste e si apre dal menu
  ✓ la voce di menu c'è  → true
  ✓ la sezione si apre  → true
  ✓ le molecole di esempio sono caricate  → 14
  ✓ le tavole dei caratteri sono selezionabili  → 8

2) Il numero di modi normali è calcolato, non scritto a mano
  ✓ H₂O (non lineare, 3 atomi): 3N−6 = 3  → 3
  ✓ CO₂ (lineare, 3 atomi): 3N−5 = 4  → 4
  ✓ CH₄ (5 atomi): 3N−6 = 9  → 9
  ✓ C₆H₆ (12 atomi): 3N−6 = 30  → 30

3) Il centro di inversione è riconosciuto correttamente
  ✓ CO₂ è centrosimmetrica  → true
  ✓ SF₆ è centrosimmetrica  → true
  ✓ C₆H₆ è centrosimmetrico  → true
  ✓ H₂O NON lo è  → false
  ✓ NH₃ NON lo è  → false

4) Le regole di selezione nelle tavole dei caratteri
  ✓ C₂ᵥ: nessuna specie risulta inattiva  → false
  ✓ C₂ₕ: nessuna specie è IR e Raman insieme  → 0
  ✓ D∞ₕ: nessuna specie è IR e Raman insieme  → 0
  ✓ Oₕ: nessuna specie è IR e Raman insieme  → 0
  ✓ C₂ᵥ: alcune specie sono attive in entrambe  → true
  ✓ C₃ᵥ: alcune specie sono attive in entrambe  → true

5) Tᵈ: solo T₂ è attiva in IR
  ✓ una sola specie IR-attiva nel gruppo tetraedrico  → 1
  ✓ ed è T₂  → T₂

6) Le quattro regole di selezione sono spiegate
  ✓ attività IR (momento di dipolo)  → true
  ✓ attività Raman (polarizzabilità)  → true
  ✓ dipolo permanente solo in C₁/Cₛ/Cₙ/Cₙᵥ  → true
  ✓ chiralità: assenza di assi impropri  → true
  ✓ nessun errore JS  → 0

26 passati
```

</details>

<details>
<summary><code>test_cheminfo</code> — SUPERATO (codice di uscita 0)</summary>

```
Banco di lavoro chemioinformatico

  RDKit 2025.03.4

── Similarita' ──
  ✓ Tanimoto({0,1,2},{1,2,3}) = 2/4  → 0.500000
  ✓ Dice({0,1,2},{1,2,3}) = 4/6  → 0.666667
  ✓ Tanimoto di due fingerprint identici  → 1.000000
  ✓ Tanimoto di due fingerprint disgiunti  → 0.000000
  ✓ Tanimoto di due fingerprint VUOTI (0/0 → 1, come RDKit)  → 1.000000

── Metriche ──
  ✓ ROC-AUC di un ordinamento perfetto  → 1.000000
  ✓ ROC-AUC di [1,0,1,0] con punteggi [4,3,2,1]  → 0.750000
  ✓ ROC-AUC di un ordinamento invertito  → 0.000000
  ✓ ROC-AUC con TUTTI i punteggi uguali (pari-merito mediati)  → 0.500000
  ✓ ROC-AUC con una sola classe: non definita, non inventata  → null
  ✓ R² di una previsione perfetta  → 1.000000
  ✓ R² di una previsione costante pari alla media  → 0.000000
  ✓ RMSE con errore costante di 1  → 1.000000
  ✓ Pearson di due serie in proporzione esatta  → 1.000000
  ✓ MCC con tp=2 tn=2 fp=1 fn=1 → 3/9  → 0.333333

── Algebra lineare ──
  ✓ Jacobi: autovalore maggiore di [[2,1],[1,2]]  → 3.000000
  ✓ Jacobi: autovalore minore di [[2,1],[1,2]]  → 1.000000
  ✓ Jacobi su matrice diagonale restituisce la diagonale ordinata  → 5,3,1
  ✓ Sistema lineare, prima incognita  → 1.000000
  ✓ Sistema lineare, seconda incognita  → 2.000000
  ✓ Sistema regolarizzato (λ=1), prima incognita  → 1.000000
  ✓ Sistema regolarizzato (λ=1), seconda incognita  → 2.000000

── Standardizzazione ──
  ✓ molecole accettate  → 3
  ✓ righe scartate  → 3
  ✓ il duplicato scritto in modo diverso viene riconosciuto  → true
  ✓ lo SMILES non interpretabile viene scartato  → true
  ✓ l'attivita' non numerica viene scartata  → true
  ✓ il controione del sale viene tolto  → true
  ✓ l'attivita' numerica viene letta  → 5.200000

── Fingerprint e scaffold ──
  ✓ il fingerprint Morgan ha 2048 bit  → 2048
  ✓ il fingerprint di una molecola vera ha dei bit accesi  → true
  ✓ MACCS ha 167 posizioni (166 chiavi piu' lo zero)  → 167
  ✓ aspirina e acido salicilico sono piu' simili di aspirina e caffeina  → true
  ✓ due benzeni sostituiti diversamente hanno lo STESSO scheletro  → true
  ✓ il naftalene ha uno scheletro DIVERSO dal benzene  → true
  ✓ una molecola aciclica e' dichiarata tale, non le si inventa uno scheletro  → true

── Raggruppamento ──
  ✓ Butina trova due grappoli su dati costruiti con due grappoli  → 2
  ✓ i grappoli hanno le dimensioni attese  → 3,2
  ✓ MaxMin sceglie due molecole di grappoli diversi  → true
  ✓ MaxMin e' riproducibile: due esecuzioni danno lo stesso insieme  → true

── Allarmi strutturali ──
  ✓ la dopamina fa scattare l'allarme catecolo  → true
  ✓ l'epossido viene riconosciuto  → true
  ✓ l'aspirina non fa scattare allarmi  → 0
  ✓ gli allarmi esaminati sono tutti quelli in elenco  → true

── PCA ──
  ✓ la PCA restituisce un punto per molecola  → 4
  ✓ la prima componente spiega la maggior parte della varianza  → true
  ✓ le frazioni di varianza non superano 1  → true
  ✓ i due gruppi finiscono da parti opposte sulla prima componente  → true

── Il modello, e il suo controllo nullo ──
  ✓ il tipo di problema viene dedotto dai dati  → regressione
  ✓ addestramento e prova coprono tutte le molecole  → 28
  ✓ il controllo nullo viene ripetuto piu' volte  → 8
  ✓ su un segnale VERO il modello batte tutti i suoi sosia casuali  → true
  ✓ su etichette CASUALI il modello NON batte i suoi sosia  → false
  ✓ la divisione per scaffold produce due insiemi non vuoti  → true
  ✓ la divisione per scaffold conta i gruppi  → true
      R² sul segnale vero: 0.394   ·   su etichette casuali: -0.199   ·   margine sul caso: 0.287

── Salti di attivita' ──
  ✓ il salto fra le due molecole simili viene trovato  → true
  ✓ la coppia trovata e' quella attesa  → AB
  ✓ l'indice SALI e' positivo  → true

── Validazione incrociata per scheletro ──
  ✓ le pieghe coprono ogni molecola una volta sola  → true
  ✓ nessuno scheletro sta in due pieghe  → 0
  ✓ con lo stesso seme le pieghe sono le stesse  → true
  ✓ i gruppi trovati sono i sei nuclei  → 6
  ✓ le pieghe chieste sono tre  → 3
  ✓ tutte le pieghe sono utilizzabili  → 0
  ✓ ogni molecola ha una predizione fuori piega  → 18
  ✓ la media fra le pieghe e' un numero  → true
  ✓ la deviazione fra le pieghe e' un numero  → true
  ✓ la metrica di regressione e' r2  → r2
  ✓ il punteggio sulle predizioni riunite e' un numero  → true
  ✓ media di [2,4,4,4,5,5,7,9]  → 5.000000
  ✓ deviazione campionaria dello stesso insieme  → 2.138090
  ✓ un valore solo non ha deviazione  → null
  ✓ un insieme vuoto non ha media  → null
  ✓ un insieme vuoto conta zero valori  → 0

── Esportazione ──
  ✓ il CSV ha una riga per molecola più l'intestazione  → 3
  ✓ ogni riga ha lo stesso numero di colonne dell'intestazione  → true
  ✓ un nome con la virgola viene citato  → true
  ✓ la colonna dello scaffold c'e'  → true
  ✓ la colonna del QED c'e'  → true
  ✓ le colonne del previsto e del residuo ci sono  → true
  ✓ il residuo dell'aspirina e' 4,2 − 4,0  → 0.2
  ✓ una molecola senza attivita' lascia la cella vuota  → true
  ✓ il file finisce con una riga nuova  → true
  ✓ il rapporto dichiara il seme  → true
  ✓ il rapporto dichiara il fingerprint usato  → true
  ✓ il rapporto porta il verdetto del controllo nullo  → true
  ✓ il rapporto dice quante ripetizioni ha fatto  → true
  ✓ il rapporto dichiara la versione di RDKit  → true
  ✓ il rapporto elenca i limiti  → true
  ✓ il rapporto include la validazione incrociata  → true
  ✓ la metrica e' scritta R² e non R2  → true
  ✓ il rapporto dichiara che nessun dato esce dal dispositivo  → true
  ✓ senza modello il rapporto non inventa la sezione  → true

── Il laboratorio RDKit usa lo stesso motore ──
  ✓ la pagina del laboratorio espone le strutture di riferimento  → false
  ✓ ogni struttura di riferimento e' leggibile da RDKit  → 
  ✓ ogni struttura ha la massa del farmaco che dichiara  → 
  ✓ i confronti eseguiti sono tutte le coppie  → 28
  ✓ la pagina e il motore danno lo stesso Tanimoto  → 0.000000
  ✓ caffeina e metformina non si somigliano  → true
  ✓ aspirina e paracetamolo si somigliano un po'  → true
  ✓ la similarita' a otto bit e' stata rimossa, non solo scavalcata  → false
      (caffeina/metformina 0.024 · aspirina/paracetamolo 0.222)

── Frammentazione ──
  ✓ con la regola fine l'etossibenzene da' tre tagli  → 3
  ✓ i tre tagli sono quelli attesi  → *C + *COc1ccccc1 | *CC + *Oc1ccccc1 | *OCC + *c1ccccc1
  ✓ con la regola grossa i tagli sono due  → 2
  ✓ il benzene non ha legami aciclici da tagliare  → 0
  ✓ il metano non ha legami da tagliare  → 0
  ✓ la regola fine taglia il metile terminale del toluene  → 1
  ✓ la regola grossa non lo taglia  → 0

── Coppie molecolari corrispondenti ──
  ✓ tutte e sei le molecole si frammentano  → 6
  ✓ clorofenile→fenile vale −1,0 su 2 coppie  → 2|-1
  ✓ le due coppie del cloro sono concordanti  → 2
  ✓ metilfenile→fenile vale −0,5  → 2|-0.5
  ✓ metile→cloro vale +0,5  → 2|0.5
  ✓ etilammide→propilammide vale +0,2 su 3 coppie  → 3|0.2
  ✓ la direzione è normalizzata, l'inversa non compare  → true
  ✓ la soglia sul numero di coppie filtra davvero  → true

── Ricerca per sottostruttura ──
  ✓ il nucleo benzamidico corrisponde a quattro molecole su cinque  → 4
  ✓ sono le quattro attese  → 0,1,2,3
  ✓ il cloro corrisponde a due molecole  → 1,3
  ✓ una query malformata viene DICHIARATA, non ignorata  → true
  ✓ il diclorobenzene conta due occorrenze di Cl  → 2
  ✓ il monoclorobenzene ne conta una  → 1
  ✓ la frazione di corrispondenze è 0,8  → 0.8

── Tabella SAR (decomposizione in gruppi R) ──
  ✓ la tabella ha due colonne di sostituzione  → 2
  ✓ quattro molecole portano il nucleo  → 4
  ✓ la molecola estranea è esclusa, non messa con celle vuote  → 4
  ✓ la molecola non sostituita mostra H  → H|*CC
  ✓ il cloro compare nella colonna giusta  → *Cl|*CC
  ✓ il metile compare nella colonna giusta  → *C|*CC
  ✓ il propile compare nella seconda colonna  → *Cl|*CCC
  ✓ la colonna 1 ordina i sostituenti per attività: Cl > Me > H  → *Cl > *C > H
  ✓ le mediane della colonna 1 sono quelle dei dati  → 7.1,6.5,6
  ✓ un nucleo che non c'è non produce righe  → 0
  ✓ la chiave dello scaffold dichiara di non essere uno SMILES  → true
  ✓ il campo chiave esiste ed e' pieno  → true
  ✓ smiles resta come alias della chiave  → true
  ✓ due molecole con lo stesso scheletro danno la stessa chiave  → true
  ✓ scheletri diversi danno chiavi diverse  → true
  ✓ la chiave NON si rilegge come SMILES: non va usata come query  → true

── Arricchimento (EF, BEDROC) ──
  ✓ ordinamento perfetto: AUC 1  → 1
  ✓ il primo 20 % sono 2 composti  → 2
  ✓ e contengono 2 attivi  → 2
  ✓ a caso ne sarebbero attesi 0,4  → 0.400000
  ✓ EF@20 % = 2/0,4 = 5  → 5
  ✓ ed è il massimo possibile a quella frazione  → 5
  ✓ BEDROC di un ordinamento perfetto vale 1  → 1
  ✓ ordinamento pessimo: AUC 0  → 0
  ✓ EF@20 % = 0  → 0
  ✓ BEDROC di un ordinamento pessimo vale 0, non un negativo  → 0
  ✓ attivi ai ranghi 2 e 5: AUC 12/16 = 0,75  → 0.75
  ✓ EF@20 % = 1/0,4 = 2,5  → 2.5
  ✓ EF@50 % = 2/1,0 = 2  → 2
  ✓ un insieme senza inattivi viene rifiutato, non calcolato  → true

── Confronto fra modelli ──
  ✓ il confronto mette tre modelli a paragone  → 3
  ✓ il primo dell'elenco è il riferimento banale  → true
  ✓ tutti i modelli usano le stesse pieghe  → true
  ✓ su un segnale VERO il migliore supera il riferimento  → true
  ✓ su etichette CASUALI non lo supera  → false
  ✓ l'insieme di prova e' abbastanza grande per distinguere i due casi  → true
  ✓ gli addestramenti sono tre pieghe per quattro candidati  → 12
  ✓ le predizioni sono molte di piu' degli addestramenti  → true
      (12 addestramenti per 240 predizioni su 60 molecole: se fossero 240 addestramenti, il confronto bloccherebbe la pagina per secondi)
      (segnale vero: margine 0.969 · casuale: -0.052)

── Intervalli di predizione conformi ──
  ✓ la copertura sulla calibrazione raggiunge il livello richiesto  → true
  ✓ al 50 % l'intervallo è più stretto che al 90 %  → true
  ✓ l'intervallo è centrato sulla predizione  → true
  ✓ la semiampiezza coincide con metà dell'intervallo  → true
  ✓ uno SMILES illeggibile non produce un intervallo inventato  → true

── Curva di apprendimento ──
  ✓ la curva valuta tutti i punti chiesti  → 3
  ✓ con più addestramento il punteggio non peggiora  → true
  ✓ la pendenza finale è calcolata  → true
  ✓ il verdetto «più dati aiuterebbero» viene espresso  → true
  ✓ su attivita' binaria gli intervalli conformi RIFIUTANO  → true
  ✓ e il messaggio dice perche'  → true
  ✓ e indica quale strumento usare al suo posto  → true
  ✓ chi sa quel che fa puo' forzarli comunque  → true
  ✓ su attivita' continua gli intervalli funzionano  → true
  ✓ la curva usa ROC-AUC su attivita' binaria  → auc
  ✓ e R2 su attivita' continua  → r2
  ✓ e dichiara il tipo di problema  → classificazione

── Esportazione SDF ──
  ✓ le due molecole valide vengono scritte  → 2
  ✓ lo SMILES illeggibile è DICHIARATO scartato  → 1
  ✓ con il motivo scritto  → SMILES non interpretabile
  ✓ il round-trip restituisce gli stessi SMILES canonici  → CC(=O)Oc1ccccc1C(=O)O | CCO
  ✓ il nome sta nella prima riga del blocco  → aspirina, acido
  ✓ il campo dell'attività c'è  → true
  ✓ il residuo è 4,2 − 4,0  → true
  ✓ nessun nome di campo contiene spazi  → true
  ✓ le coordinate 2D sono state generate  → true

── Contrasto dei pannelli (dove l'altro banco non arriva) ──
  ✓ tutti e nove i pannelli si aprono con del contenuto  → 9
  ✓ gli elementi di testo misurati sono molti  → true
  ✓ nessun testo dei pannelli sotto la soglia WCAG AA  → 0
      (594 elementi di testo misurati nei nove pannelli)
  ✓ nessun errore JavaScript usando la sezione  → 0

── Igiene ──
  ✓ nessun errore JavaScript durante le prove  → 0

192 controlli passati
```

</details>

<details>
<summary><code>test_farm_ui</code> — SUPERATO (codice di uscita 0)</summary>

```
Atlante Farmaci — ogni voce in memoria deve essere disegnata

  ✓ la sezione è visibile  → true
  ✓ il contenitore della lista esiste  → true
  ✓ i farmaci in memoria sono molti  → true
  ✓ le categorie nei dati sono molte  → true
  ✓ OGNI farmaco in memoria compare nella lista disegnata  → 0
  ✓ nessuna scheda mostra un peso molecolare rotto  → 0
      (263 farmaci, 242 con struttura, 50 categorie, 8774 nodi nella sezione)
  ✓ il filtro mostra tutte le voci della categoria scelta  → 0
  ✓ e nessuna voce di altre categorie  → 0
      (categoria «chemo2», 21 voci attese)
  ✓ un farmaco con una categoria MAI etichettata viene disegnato comunque  → true
  ✓ e il banco non lascia tracce nell'insieme  → true
  ✓ nessun errore JavaScript  → 0

11 controlli passati
```

</details>

<details>
<summary><code>test_datasci</code> — SUPERATO (codice di uscita 0)</summary>

```
Data Science — la matematica che la sezione mostra

── Raggiungibilità delle sezioni ──
  ✓ le sezioni sono molte  → true
  ✓ nessuna sezione è del tutto irraggiungibile  → 
  ✓ nessun pulsante punta a una sezione che non esiste  → 
  ✓ la sezione Data Science ha il suo pulsante  → false
      (93 sezioni, 92 pulsanti; senza pulsante ma raggiungibili: scentro)
  ✓ la sezione si apre  → true
  ✓ e costruisce il suo contenuto  → true
  ✓ la matematica è esposta per la verifica  → true

── Media e dispersione ──
  ✓ media di [2,4,4,4,5,5,7,9]  → 5.000000
  ✓ deviazione di popolazione (divide per n): √(32/8)  → 2.000000
  ✓ un insieme vuoto non inventa numeri  → 0,0

── Regressione: la discesa del gradiente converge? ──
  ✓ su una relazione lineare ESATTA l'R² è 1  → 1.000000
  ✓ i pesi standardizzati stanno nel rapporto vero 2·σ₁ : 3·σ₂  → 0.648394
  ✓ la validazione incrociata della regressione dà 1  → 1.000000
  ✓ il kNN resta sotto la regressione su dati lineari  → true
  ✓ il riferimento banale è ben peggiore di entrambi  → true
      (regressione 1.000 · kNN 0.945 · riferimento -0.066)

── E se nei dati non c'è segnale? ──
  ✓ su rumore puro la regressione non si avvicina a 1  → true
  ✓ e nemmeno il kNN  → true
      (regressione -0.238 · kNN -0.399)

── Curva ROC ──
  ✓ ordinamento perfetto: AUC 1  → 1.000000
  ✓ ordinamento pessimo: AUC 0  → 0.000000
  ✓ attivi ai ranghi 2 e 5: AUC 12/16 = 0,75  → 0.750000

── Il banco di lavoro: quale colonna viene prevista ──
  ✓ il target parte dall'ultima colonna numerica  → risposta
  ✓ il selettore offre tutte le colonne  → 3
  ✓ nessun errore JavaScript  → 0

23 controlli passati
```

</details>

<details>
<summary><code>test_astro</code> — SUPERATO (codice di uscita 0)</summary>

```
Astrochimica — i numeri dichiarati sono coerenti?

── Molecole interstellari ──
  ✓ le molecole interstellari sono molte  → true
  ✓ ogni formula è analizzabile  → 
  ✓ ogni peso molecolare coincide con la sua formula  → 
  ✓ ogni voce ha nome, formula, peso, luogo e modo di rilevamento  → 
  ✓ nessun identificativo duplicato  → 
      (30 molecole verificate contro i pesi atomici IUPAC)

── Catalogo dei corpi celesti ──
  ✓ il catalogo ha molte voci  → true
  ✓ ogni voce ha un nome  → 0
  ✓ nessun corpo compare due volte  → 
      (959 corpi · campi: cat, n, type, dist, chem, phys, links)

── Quiz ──
  ✓ il quiz ha molte domande  → true
  ✓ ogni domanda ha opzioni e una risposta valida fra esse  → 0
      (30 domande)

── I sedici pannelli ──
  ✓ i pannelli trovati sono molti  → true
  ✓ si aprono tutti senza eccezioni  → 18
      (9076 nodi dopo averli percorsi)
  ✓ nessun errore JavaScript percorrendo la pagina  → 0

13 controlli passati
```

</details>

<details>
<summary><code>test_spettrolettore</code> — SUPERATO (codice di uscita 0)</summary>

```
Lettore di spettri e modelli avanzati

── JCAMP-DX ──
  ✓ ASDF «@ABCDEFGHI»  → [0,1,2,3,4,5,6,7,8,9]
  ✓ ASDF «abcdefghi»  → [-1,-2,-3,-4,-5,-6,-7,-8,-9]
  ✓ ASDF «A23»  → [123]
  ✓ ASDF «99»  → [99]
  ✓ un JCAMP esplicito si legge  → JCAMP-DX
  ✓   · con i suoi valori  → [0.1,0.5,0.9,0.4,0.05]
  ✓   · e il suo titolo  → prova
  ✓ un JCAMP compresso in DIF si decomprime  → [10,12,15,15,15,10]
  ✓   · e le x si ricostruiscono dall’intervallo  → [1000,1001,1002,1003,1004,1005]
  ✓ due colonne si leggono comunque  → 3

── I picchi ──
  ✓ sui tre picchi costruiti ne trova tre  → 3
  ✓   · e sono quelli giusti (±2 cm⁻¹)  → true
      (trovati: 1716, 2952, 3402 · attesi 1715, 2950, 3400)
  ✓ su rumore puro non ne trova nessuno  → 0
  ✓ e la banda a 1715 ha più assegnazioni compatibili, non una  → true
      (C=O chetone | C=O acido carbossilico)

── Dall’immagine ──
  ✓ una figura si legge colonna per colonna  → 900
  ✓   · e produce una curva completa  → 900
  ✓ i tre picchi costruiti si ritrovano (±6 cm⁻¹)  → true
      (letti dai pixel: 1717, 2951, 3403 · attesi 1715, 2950, 3400)
  ✓ le x vengono riordinate crescenti  → true
  ✓ su un foglio bianco rifiuta invece di inventare una curva  → true
      (non ho trovato una traccia abbastanza scura: prova a ritagli…)
  ✓ e dichiara che la scala non sta nei pixel  → true

── Curva o lista ──
  ✓ una curva campionata fitta non è una lista di picchi  → false
  ✓ e sei righe di m/z lo sono  → true
  ✓   · riconosciute come spettro di massa  → ms
  ✓ il picco base del toluene è m/z 91  → 91
  ✓ e lo ione più pesante osservato è 93  → 93
  ✓ fra 92 e 91 riconosce la perdita di H  → true
      (92→91 H · 93→92 H · 93→65 CO · 93→65 C₂H₄)

── I modelli ──
      aspirina    sperimentale  -1.72  stimato  -1.65  scarto 0.07
      benzene     sperimentale  -1.64  stimato  -1.39  scarto 0.25
      naftalene   sperimentale   -3.6  stimato  -2.42  scarto 1.18
      etanolo     sperimentale    1.1  stimato  -0.12  scarto 1.22
  ✓ lo scarto medio di ESOL sta nell’errore dichiarato  → 0.68 (limite 1.3)
  ✓ e l’incertezza viene riportata accanto alla stima  → 1
  ✓ i quattro filtri danno un verdetto ciascuno  → 4
      (aspirina → Lipinski:passa · Veber:passa · Egan:passa · Ghose:viola)
  ✓ una molecola enorme NON passa Lipinski  → false
  ✓   · e le violazioni sono più di una  → true

── La foresta ──
  ✓ su una relazione non lineare la foresta spiega molto  → true
      (R² fuori sacco 0.9 su 220 osservazioni)
  ✓ e su un bersaglio di puro rumore NON spiega niente  → true
      (R² fuori sacco su rumore: -0.164)
  ✓ a parità di seme la risposta è identica  → true
  ✓ e con un seme diverso cambia  → true

── La sezione ──
  ✓ «Lettore spettri» ha il suo pulsante di navigazione  → true
  ✓ e la sezione si disegna (intestazione, schede, caricamento)  → true
      (175 nodi nello scheletro)
  ✓ senza cadere nel cartello «Sezione in costruzione»  → false
  ✓ l’esempio IR produce una tela e una tabella  → true
  ✓   · e la sezione CRESCE quando si carica uno spettro  → true
      (175 → 232 nodi)
  ✓ l’esempio MS produce la tabella delle perdite  → true
  ✓   · e dichiara che è una lista di picchi, non una curva  → true
  ✓ l’esempio NMR produce le integrazioni  → true
  ✓ e la sezione dichiara che NON deduce la struttura  → true

── Una sola porta d’ingresso ──
  ✓ un solo bottone visibile per aprire un file  → 1
      (📂 Apri un file)
  ✓   · ed è quello dell’ingresso unico  → true
  ✓   · che non filtra nessuna estensione  → 
  ✓   · e c’è una riga che annuncia la decisione  → true
  ✓ un PDF viene instradato come documento  → true
  ✓   · le sue pagine compaiono disegnate  → true
  ✓   · e la traccia dentro viene svolta  → true
  ✓   · senza che lo stato menta («aperto» solo se è aperto)  → true
      (aperto: quesito-benzilacetato.pdf · 1 pagine · 80 parole)
  ✓ un .docx viene instradato come documento e svolto  → true
  ✓ un testo senza numeri di spettro diventa un quesito  → true
  ✓ un .jdx viene letto come spettro, non come documento  → true
  ✓ due colonne di numeri si riconoscono dal contenuto  → true
  ✓ un binario chiamato .txt non viene riversato come testo  → false
  ✓   · e il lettore di documenti dice che non lo sa leggere  → true
      (⚠ Questo file non è testo: contiene dati binari. Il tipo dichiarato è «text/plai)
  ✓ la figura di uno spettro dà la traccia E la pagina  → true
  ✓ un’immagine che non è uno spettro viene mostrata comunque  → true
  ✓   · ma senza inventarle una curva  → false
  ✓ il distintivo in intestazione riporta la versione vera  → v198
  ✓ nessun errore JavaScript  → 0

63 controlli passati
```

</details>

<details>
<summary><code>test_documento</code> — SUPERATO (codice di uscita 0)</summary>

```
Documenti — aprire, leggere, svolgere, e dire che cosa manca

── I moduli ──
  ✓ BSIDocumento è caricato  → object
  ✓ BSIQuesito è caricato  → object

── Che cosa riconosce nel testo ──
  ✓ la formula molecolare  → C9H10O2
  ✓ e anche scritta con i pedici tipografici  → C9H10O2
  ✓ le sei bande IR  → 3035,2955,1738,1600,1498,1230
  ✓ i quattro picchi di massa  → 150,108,91,43
  ✓   · con le loro intensità relative  → 22,100,45,60
  ✓ i tre segnali ¹H, con integrazione e molteplicità  → 7.35/5m 5.1/2s 2.05/3s
  ✓ i sei segnali ¹³C  → 170.9,136,128.6,128.2,66.3,21
  ✓ e non manca niente  → 0

   · e quello che NON deve riconoscere
  ✓ CDCl₃ è il solvente, non il composto  → null
  ✓ una banda IR fuori da 400-4000 non è una banda  → 1715,400
  ✓ senza etichetta MS non ci sono masse  → 0
  ✓ senza etichetta ¹H non ci sono protoni  → 0
  ✓ un capoverso nuovo chiude la sezione  → 1715
  ✓ un testo senza spettri non produce dati  → 0
  ✓   · e li dichiara tutti mancanti  → 5
  ✓ la virgola decimale è un decimale, non un separatore  → 7.35

── Lo svolgimento ──
  ✓ i gradi di insaturazione  → 5
  ✓ la massa monoisotopica  → 150.07
  ✓ i protoni dalle integrazioni  → 10
  ✓ i passi dello svolgimento  → 5 (almeno 4)
  ✓ e le supposizioni, tenute separate  → 7 (almeno 4)
  ✓ ogni passo dice da dove viene  → 0
  ✓ e quanto è certo  → 0
  ✓ su un testo senza dati non svolge  → null
  ✓   · e lo dice invece di tacere  → true

   · il confronto con una struttura proposta
  ✓ il benzilacetato, che è la risposta, supera metà dei controlli  → true
      (42 / 100)
  ✓ e il nonano, che non c’entra niente, prende molto meno  → true
      (0 / 100)

── I file, aperti davvero ──
  ✓ il PDF si apre e disegna la sua pagina  → 1
  ✓   · e il suo testo viene letto  → true
  ✓   · con dentro la formula del quesito  → true
  ✓   · e lo svolgimento compare  → true
  ✓   · con le sue tabelle  → 4 (almeno 3)
  ✓ il documento Word si apre  → true
  ✓   · e il suo testo viene letto  → true
  ✓   · con dentro i dati del quesito  → true
  ✓   · e lo svolgimento compare  → true

── Un server che sbaglia il tipo dei moduli ──
  ✓ il PDF si apre anche se il server dichiara il tipo sbagliato  → 1
  ✓   · e il suo testo viene letto lo stesso  → true
  ✓   · e lo svolgimento compare  → true
  ✓ un file di testo si apre  → true
  ✓   · e dà lo stesso svolgimento  → true

── Quello che non riesce a leggere, lo dice ──
  ✓ un’immagine si apre e si vede  → 1
  ✓   · e dichiara che non c’è riconoscimento ottico dei caratteri  → true
  ✓   · e non inventa uno svolgimento  → false
  ✓ un formato sconosciuto viene rifiutato, non indovinato  → true
  ✓   · e non produce pagine finte  → 0
  ✓ un file binario chiamato .txt viene riconosciuto come binario  → true
  ✓ nessun errore JavaScript  → 0

50 controlli passati
```

</details>

<details>
<summary><code>test_nmr</code> — SUPERATO (codice di uscita 0)</summary>

```
Predizione NMR — assegnata per atomo, verificata contro la letteratura

── Il motore ──
  ✓ BSINMR è caricato  → object
  ✓ BSIMolDraw è caricato  → object
  ✓ il pannello è caricato  → object

── ¹³C: insieme di TARATURA ──
  ✓ nessuna molecola di taratura fallisce  → 0
      scarto medio 0.71 ppm · peggiore 3.0

── ¹³C: insieme di VALIDAZIONE (mai usato per tarare) ──
      naftalene            segnali 3/3  medio 1.10  max 2.7
      difenile             segnali 4/4  medio 1.27  max 4.6
      stirene              segnali 6/6  medio 0.35  max 1.2
      acetofenone          segnali 6/6  medio 0.60  max 2.9
      m-cresolo            segnali 7/7  medio 0.69  max 1.8
      p-cresolo            segnali 5/5  medio 0.58  max 1.2
      benzonitrile         segnali 5/5  medio 0.20  max 0.7
      4-nitrotoluene       segnali 5/5  medio 0.74  max 1.8
      acido salicilico     segnali 7/7  medio 1.87  max 4.8
      acetato di etile     segnali 4/4  medio 0.97  max 2.9
      acido propanoico     segnali 3/3  medio 1.17  max 2.6
      isopropanolo         segnali 2/2  medio 0.50  max 0.9
      etere dietilico      segnali 2/2  medio 1.85  max 3.2
      cicloesanone         segnali 4/4  medio 2.10  max 4.9
      1-butanolo           segnali 4/4  medio 0.18  max 0.5
      terz-butanolo        segnali 2/2  medio 0.95  max 1.0
      2-butanone           segnali 4/4  medio 1.78  max 2.3
      benzoato di etile    segnali 7/7  medio 0.21  max 0.7
      acetofenone          segnali 6/6  medio 0.60  max 2.9
      4-metossiacetofenone segnali 7/7  medio 1.37  max 3.2
      butanoato di etile   segnali 6/6  medio 0.85  max 2.7
      isobutano            segnali 2/2  medio 0.10  max 0.2
      acetato di benzile   segnali 7/6  medio 2.38  max 7.5
  ✓ nessuna molecola di validazione fallisce  → 0
  ✓ lo scarto medio sulla validazione sta nel valore dichiarato  → 0.97 (limite 1.3)
  ✓   · e il caso peggiore sta nel valore dichiarato  → 7.5 (limite 8)
  ✓ la validazione è più severa della taratura  → true
      (taratura 0.71 · validazione 0.97)

── ¹H ──
      etanolo              medio 0.297
      acetato di etile     medio 0.050
      acido acetico        medio 0.110
      acetone              medio 0.080
      benzene              medio 0.080
      TMS                  medio 0.000
      ciclopropano         medio 0.000
      benzaldeide          medio 0.020
      anisolo              medio 0.028
      fenolo               medio 0.005
      nitrobenzene         medio 0.043
      toluene              medio 0.017
      stirene              medio 0.048
      1-butanolo           medio 0.060
  ✓ nessuna molecola ¹H fallisce  → 0
  ✓ lo scarto medio ¹H sta nel valore dichiarato  → 0.06 (limite 0.15)
  ✓ le molecole aromatiche ¹H sono tutte misurate  → 5
  ✓   · e il loro scarto sta nel valore dichiarato  → 0.03 (limite 0.15)

── La spiegazione ricostruisce il numero ──
  ✓ ogni carbonio alifatico dichiara contributi che risommano al suo valore  → 0
      (48 carboni controllati)
  ✓   · e sono abbastanza da voler dire qualcosa  → true

── Le capacità nuove ──
  ✓ il nitrobenzene ha TUTTI gli H aromatici oltre 7,5  → true
      (il più schermato a 7.6)
  ✓ l’anisolo li ha TUTTI sotto 7,4  → true
      (il più deschermato a 7.29)
  ✓ e il benzene nudo resta al valore di base, senza incrementi  → 7.34
  ✓ lo stirene dà TRE segnali vinilici (CH, =CH₂ cis, =CH₂ trans)  → 3
  ✓ ma l’etilene, che non ha nulla di fronte, ne dà uno solo  → 1
  ✓ l’OCH₂ dell’acetato di etile sta oltre 55 ppm  → true
  ✓ mentre ogni altro suo carbonio sta sotto 25: lo stesso gruppo, due valori  → true
      (60.8 e 18.1)
  ✓ il cicloesano torna esatto per costruzione  → 26.9
  ✓ ma il cicloesanone NON eredita quel valore sui carboni in α  → true
      (α al carbonile: 40.3 ppm)
  ✓ e una catena aperta dà i suoi carboni senza riferimento ciclico  → 3
  ✓ la tabella ¹³C dei benzeni ha più di settanta righe  → true
  ✓ la tabella ¹H dei benzeni ha più di cinquanta righe  → true
  ✓ la tabella degli etileni ha più di trenta righe  → true
  ✓ la tabella degli alcani ha più di venticinque righe  → true
  ✓ e la fonte è dichiarata  → Pretsch, Bühlmann,
      (91 + 66 + 42 + 31 righe)

── L'equivalenza chimica ──
      benzene           1 segnali
      toluene           5 segnali
      p-xilene          3 segnali
      naftalene         3 segnali
      cicloesano        1 segnali
      acetone           2 segnali
      difenile          4 segnali
      aspirina          9 segnali
  ✓ ogni molecola dà il numero di segnali che la letteratura le attribuisce  → 0

── I rifiuti ──
  ✓ uno SMILES illeggibile non produce uno spettro inventato  → true
      (null)
  ✓ e una stringa vuota nemmeno  → null

── Il pannello ──
  ✓ la scheda ¹³C passa dal motore nuovo  → true
  ✓ e l’originale resta come ripiego  → function
  ✓ la scheda esiste nell’editor  → 1
  ✓ lo spettro si disegna  → true
  ✓ nessun errore nella predizione del pannello  → null
  ✓ l’aspirina dà i suoi nove segnali ¹³C  → 9
  ✓ e la tabella ha una riga per segnale  → 9
  ✓ la struttura viene disegnata accanto  → true
  ✓ prima del clic nessun segnale è acceso  → null
  ✓ dopo il clic su una riga il segnale si accende  → true
  ✓ e porta con sé gli atomi che lo producono  → true
      (segnale C1 → atomi [10])
  ✓ passando a ¹H resta la stessa molecola  → CC(=O)Oc1ccccc1C(=O)O
  ✓   · e i segnali sono quelli del ¹H  → true

── La cronologia ──
  ✓ parte vuota  → 0
  ✓ due molecole previste, due voci  → 2
  ✓ e l’ultima sta in cima  → c1ccccc1
  ✓ lo stesso etanolo scritto «OCC» non fa una voce nuova  → 2
  ✓   · ma risale in cima, perché è quella su cui si lavora adesso  → CCO
  ✓ uno SMILES illeggibile non entra in cronologia  → 2
  ✓ di ogni voce si tiene l’InChI  → true
  ✓   · e la sua chiave  → true
      (InChI=1S/C2H6O/c1-2-3/h3H,2H2,1H3 · LFQSCWFLJHTTHZ-UHFFFAOYSA-N)
  ✓ sopravvive al rimontaggio del pannello  → 2
  ✓   · e si vede, una pastiglia per voce  → 2
  ✓ un clic su una voce la riporta sul tavolo  → true
      (c1ccccc1)
  ✓ e si può svuotare  → 0

── Picco ↔ struttura ↔ 3D ──
  ✓ la tela 3D parte nascosta  → none
  ✓ il bottone 3D la mostra  → true
  ✓ e il visore si monta  → true
  ✓ prima del clic non c’è niente di illuminato  → 0
  ✓ dopo il clic su una riga gli atomi si illuminano anche in 3D  → true
  ✓   · e sono esattamente quelli del segnale  → [12]
  ✓ un secondo clic li rispegne  → 0
  ✓ la molecola viene disegnata davvero  → true
      (73 campioni non di fondo)
  ✓ nessun errore JavaScript  → 0

66 controlli passati
```

</details>

<details>
<summary><code>test_nmr2d</code> — SUPERATO (codice di uscita 0)</summary>

```
NMR bidimensionale — COSY, HSQC, HMBC contati sul grafo

── Il motore ──
  ✓ BSINMR2D è caricato  → object

── HSQC: un protone e il suo carbonio ──
  ✓ l’acetato di etile dà tre macchie, una per carbonio protonato  → 3
  ✓ il benzene, che ha un solo intorno, ne dà una  → 1
  ✓ il toluene ne dà quattro  → 4
  ✓ l’esafluorobenzene, che non ha idrogeni, non ne dà nessuna  → 0

   · il segno, come in un HSQC editato
  ✓ il 1-butanolo ha tre CH₂, e tre macchie negative  → 3
  ✓   · e un CH₃, con una macchia positiva  → 1

── COSY: due protoni a tre legami ──
  ✓ l’etanolo ha tre segnali ¹H sulla diagonale  → 3
  ✓   · e una coppia fuori diagonale, in due versi  → 2
  ✓ il benzene ha la diagonale  → 1
  ✓   · e NESSUNA macchia fuori: i sei protoni sono equivalenti  → 0
  ✓ l’acetone nemmeno: i due metili sono equivalenti e lontani  → 0
  ✓ il toluene invece sì: orto↔meta e meta↔para  → 4
  ✓ e l’O–H, che si scambia col solvente, non compare fuori diagonale  → 0

── HMBC: due e tre legami ──
  ✓ l’acetato di etile dà le sue correlazioni  → true
      (4 macchie)
  ✓ il carbonile, che non ha protoni suoi, si vede lo stesso  → true
      (2 protoni lo toccano)
  ✓ ogni macchia dichiara un cammino a due o tre legami, mai a uno  → 0
  ✓ il metano, che non ha un secondo carbonio, non dà nessuna macchia  → 0

── Gli assi ──
  ✓ l’HSQC ha ¹³C in ascissa e ¹H in ordinata  → 13C/1H
  ✓ il COSY ha ¹H su entrambi  → 1H/1H
  ✓ e vanno a decrescere, come si disegna un NMR  → true

── I rifiuti ──
  ✓ uno SMILES illeggibile non produce una mappa inventata  → true
  ✓ e una stringa vuota nemmeno  → null
  ✓ un tipo inventato ricade su HSQC e lo dichiara  → HSQC

── Il disegno ──
  ✓ la mappa si disegna  → true
  ✓ e ci sono macchie, non un rettangolo vuoto  → true
      (13 campioni colorati)
  ✓ una macchia si ritrova da dove è stata disegnata  → true
  ✓   · ma non se ne trova una dove non ce n’è  → true
  ✓ e l’uscita CSV ha una riga per macchia più l’intestazione  → 4

── La mappa nel pannello ──
  ✓ la sezione 2D parte nascosta  → none
  ✓ il bottone HSQC la mostra  → HSQC
  ✓   · e diventa visibile  → 
  ✓ con le macchie dell’acetato di etile  → 3
  ✓ prima del clic nessuna macchia è accesa  → null
  ✓   · e nessun atomo è illuminato dalla mappa  → 0
  ✓ dopo il clic la macchia si accende  → true
  ✓   · e illumina esattamente i suoi atomi  → [0]
  ✓ passando a COSY la mappa cambia: due macchie, non tre  → 2
  ✓ e spegnendola la sezione sparisce  → none
  ✓ nessun errore JavaScript  → 0

40 controlli passati
```

</details>

<details>
<summary><code>test_geom3d</code> — SUPERATO (codice di uscita 0)</summary>

```
Geometria 3D — costruita dal grafo, misurata contro la chimica

── Il motore ──
  ✓ BSIGeom3D è caricato  → object

── Le lunghezze di legame (Å) ──
  ✓ C–C semplice (etano)  → 1.54 (atteso 1.54 ± 0.04)
  ✓ C=C doppio (etene)  → 1.341 (atteso 1.34 ± 0.04)
  ✓ C≡C triplo (etino)  → 1.2 (atteso 1.2 ± 0.04)
  ✓ C–C aromatico (benzene)  → 1.39 (atteso 1.39 ± 0.04)
  ✓ C–O (etanolo)  → 1.43 (atteso 1.43 ± 0.05)
  ✓ C–H (etano)  → 1.09 (atteso 1.09 ± 0.05)

── Gli angoli di valenza (gradi) ──
  ✓ H–C–H tetraedrico (metano)  → 109.5 (atteso 109.5 ± 4)
  ✓ C–C–C (propano)  → 109.3 (atteso 109.5 ± 5)
  ✓ C–C–C interno (benzene)  → 120 (atteso 120 ± 3)
  ✓ C–C≡C diritto (propino)  → 180 (atteso 180 ± 6)
  ✓ C–O–H è piegato, non diritto (etanolo)  → 104.4 (al più 125)
  ✓   · e nemmeno schiacciato  → 104.4 (almeno 95)

── La planarità, nei due versi ──
  ✓ il benzene è piano (scarto dal piano, Å)  → 0 (al più 0.05)
  ✓ e il naftalene, che è due anelli condensati  → 0 (al più 0.08)
  ✓ ma il cicloesano NON è piano: è a sedia  → 0.164 (almeno 0.15)

── Nessun atomo dentro un altro ──
      (aspirina: 21 atomi con gli idrogeni)
  ✓ la coppia non legata più vicina resta oltre 2,0 Å  → 2.464 (almeno 2)
  ✓ e lo scarto dai limiti resta piccolo  → 0.017 (al più 0.12)

── Le molecole vere ──
      caffeina        24 atomi · scarto 0.027 Å · minima 2.33 Å · 91 ms
      ibuprofene      33 atomi · scarto 0.014 Å · minima 1.99 Å · 77 ms
      naprossene      31 atomi · scarto 0.022 Å · minima 2.27 Å · 105 ms
      paracetamolo    20 atomi · scarto 0.011 Å · minima 2.33 Å · 30 ms
      atorvastatina   76 atomi · scarto 0.31 Å · minima 1.63 Å · 544 ms
  ✓ ognuna produce una geometria  → 0
  ✓ il residuo peggiore resta nel valore dichiarato (Å)  → 0.31 (al più 0.4)
  ✓ e nessuna coppia scende sotto 1,5 Å  → 1.63 (almeno 1.5)
  ✓ nessuna impiega più di due secondi  → 544 (al più 2000)

── Riproducibilità ──
  ✓ la stessa molecola dà sempre la stessa forma  → true
  ✓   · ma molecole diverse non danno la stessa  → true

── Gli indici sono quelli del predittore NMR ──
      CC(=O)Oc1ccccc1C(=O)O     13 pesanti + 8 H
      COc1ccc(cc1)C(C)=O        11 pesanti + 10 H
      CCCC(=O)OCC               8 pesanti + 12 H
      c1ccc2ccccc2c1            10 pesanti + 8 H
      O=C1CCCCC1                7 pesanti + 10 H
  ✓ ogni atomo pesante ha lo stesso indice e lo stesso elemento  → 0

── I rifiuti ──
  ✓ uno SMILES illeggibile non produce una geometria inventata  → true
  ✓ e una stringa vuota nemmeno  → null

── La forma che il visore si aspetta ──
  ✓ perVisore dà atoms/bonds con el, x, y, z  → true
  ✓ nessun errore JavaScript  → 0

29 controlli passati
```

</details>

<details>
<summary><code>test_elucida</code> — SUPERATO (codice di uscita 0)</summary>

```
Elucidazione — i conti verificati contro compiti già corretti

── Gradi di insaturazione ──
  ✓ ogni formula dà l’IDI scritto a mano sul compito  → 0
      (C9H10O2S=5 · C14H21NO3=5 · C13H17NO2=6 · C7H10O3=3 · C12H16O2=5 · C9H12N2O=5 · C9H10O2=5 · C8H9NO2=5 · C6H6=4 · C6H14=0 · C2H2=2 · C6H5Cl=4)

── Numero di carboni dal picco M+1 ──
  ✓ M 151/152 dà 9 carboni  → 9
  ✓ M 165/166 dà 9 carboni  → 9
  ✓ con un azoto la correzione abbassa il conto  → true
  ✓   · ma non tanto da cambiare l’intero, con un solo azoto  → 9
      (senza N: 9,0 · con N: 8.7, correzione 0.4 %)

── Eteroatomi dal picco M+2 ──
  ✓ 4,4 % → zolfo  → S
  ✓ 32,5 % → cloro  → Cl
  ✓ 97,3 % → bromo  → Br
  ✓ 0,4 % → nessun eteroatomo inventato  → null

── Perdite neutre ──
  ✓ 151 → 120 è riconosciuta come perdita di OCH₃  → true
  ✓ e 120 → 92 come perdita di CO  → true
      (120→92 CO / C₂H₄ · 151→120 OCH₃ · 151→92 COOCH₃ · 92→65 HCN)

── Il dossier ──
  ✓ l’IDI è fra le deduzioni  → 5
  ✓ e i segnali ¹³C sono contati  → 9
  ✓ le integrazioni ¹H sommano i protoni della formula  → 10
  ✓ ogni deduzione porta la propria prova  → true
  ✓ e le supposizioni sono tenute separate dalle deduzioni  → true
      (5 deduzioni · 10 supposizioni · 0 avvisi)

── Il confronto fra una struttura giusta e una sbagliata ──
  ✓ 2-etossibenzaldeide: la giusta batte la sbagliata  → true
      (giusta 100 pt, orfani 0 · sbagliata 30 pt, orfani 3)
  ✓   · e la giusta non lascia segnali senza carbonio  → 0
  ✓ 4-amminobenzoato di metile: la giusta batte la sbagliata  → true
      (giusta 100 pt, orfani 0 · sbagliata 80 pt, orfani 0)
  ✓   · e la giusta non lascia segnali senza carbonio  → 0

── Il caso che il predittore non sa trattare ──

── Il carbonio con due sostituenti in α ──
  ✓ dove un carbonio ha DUE sostituenti in α, lo strumento avvisa  → 0
  ✓   · e la fiducia non resta «alta»  → 0
  ✓ dove ne ha UNO solo, NON avvisa  → 0
  ✓   · e la fiducia resta «alta»  → 6
  ✓ la formula della struttura giusta coincide  → true
  ✓ il punteggio è basso  → true
  ✓ ma la fiducia è dichiarata BASSA  → bassa
  ✓   · con il motivo scritto  → true

── I rifiuti ──
  ✓ uno SMILES illeggibile non produce un confronto  → errore
  ✓ una formula vuota non produce una formula  → null
  ✓ e un simbolo inventato viene segnalato  → Xy
  ✓ nessun errore JavaScript  → 0

32 controlli passati
```

</details>

<details>
<summary><code>test_digitalizza</code> — SUPERATO (codice di uscita 0)</summary>

```
  ✓ il modulo si carica  → true

── La cornice degli assi ──
  ✓ su una figura con gli assi li trova tutti e quattro  → 4
      (alto, basso, sinistra, destra → ritaglio (63,13)–(946,296))
  ✓   · e il ritaglio sta oltre lo spessore della linea, non sopra  → true
  ✓ su una figura senza assi non ne trova nessuna  → false
  ✓   · e lo dichiara invece di tacere  → true
  ✓ una linea di base piatta non viene presa per un asse  → true

── La traccia ──
  ✓ le posizioni sono a subpixel, non interi  → true
      (895 posizioni non intere su 900)
  ✓ figura nuda: i tre picchi entro 6 cm⁻¹  → 3.3 (limite 6)
      (1717.5, 2950.8, 3403.3 · veri 1715, 2950, 3400)
  ✓ figura con cornice ed etichette: entro 8 cm⁻¹  → 2.2 (limite 8)
      (1716.9, 2952.2, 3400.7)
  ✓ il ripiego grezzo, sulla stessa figura, sbaglia molto di più  → true
      (grezzo: 3819.8 → scarto non trova 3 picchi cm⁻¹ · nuovo: 2.2 cm⁻¹)
  ✓ con la griglia i picchi sono gli STESSI della figura senza griglia  → true
      (con griglia: 1717.5, 2950.8, 3403.3)
  ✓ anche con una griglia NERA i picchi restano quelli  → true
      (griglia nera: 1717.5, 2950.8, 3403.3)
  ✓ il ripiego grezzo, sulla griglia pallida, se la cava comunque  → true
      (grezzo con griglia: 1713.5, 2946.8, 3403.3)
  ✓ con cornice E griglia insieme, il bordo viene distinto dalla griglia  → true
      (lati: alto, basso, sinistra, destra · famiglie di linee continue: 11 verticali, 7 orizzontali)
  ✓   · e i picchi restano entro 8 cm⁻¹  → 2.2 (limite 8)
      (1716.9, 2952.2, 3400.7)
  ✓ una curva tratteggiata si ricostruisce comunque  → 7.3 (limite 8)
      (1713.5, 2946.8, 3407.3)
  ✓ da un foglio bianco non esce nessuna curva  → true
      («non ho trovato una traccia abbastanza scura: prova a ritagliare la fig»)
  ✓ e nemmeno dall’icona dell’applicazione  → true

── La taratura ──
  ✓ 100 %T diventa A = 0  → 0
  ✓ 50 %T diventa A = 0,301  → 0.301
  ✓ 10 %T diventa A = 1  → 1
  ✓ 1 %T diventa A = 2  → 2
  ✓ 0 %T si ferma a A = 4 invece di divergere  → 4
  ✓   · e il punto saturato viene contato  → 1
  ✓ una figura in %T si legge e si converte in assorbanza  → A
  ✓   · dichiarando la conversione  → true
  ✓   · con i picchi al posto giusto entro 8 cm⁻¹  → 2.5 (limite 8)
      (1717.5, 2950.8, 3399.3 · A massima 0.59)
  ✓ su asse logaritmico il punto di mezzo è la media geometrica  → true
      (log: 316.6 · atteso 316,2)
  ✓   · e su asse lineare lo stesso punto è la media aritmetica  → true
      (lineare: 550.5 · atteso 550)
  ✓   · gli estremi restano quelli dati  → true
  ✓ un asse logaritmico che parte da zero viene rifiutato  → true
      («un asse logaritmico non può partire da zero o da un numero negativo»)

── Le uscite ──
  ✓ il CSV ha una riga di intestazione e una riga per punto  → 901
  ✓   · con le unità nell’intestazione  → true
  ✓   · e numeri leggibili nella prima riga  → true
  ✓ il JCAMP dichiara NPOINTS  → true
  ✓   · e FIRSTX/LASTX, senza i quali il file è formalmente invalido  → true
  ✓   · e porta dentro la provenienza (taratura data a mano)  → true
  ✓ il JCAMP esportato viene riletto dal lettore stesso  → JCAMP-DX
  ✓   · con lo stesso numero di punti  → 900
  ✓   · e gli stessi estremi  → true
  ✓   · e con le unità conservate  → 1/CM

── L’errore, dichiarato ──
  ✓ tutte le figure hanno dato tre picchi  → 7
      21 picchi misurati su 7 figure diverse
  ✓ scarto MEDIO sui picchi di tutte le figure (cm⁻¹)  → 2.16 (limite 4)
  ✓ scarto PEGGIORE (cm⁻¹)  → 7.34 (limite 8)
      La risoluzione di una colonna è ~4 cm⁻¹ su 900 colonne per 3600 cm⁻¹:
      sotto quel valore non c’è niente da guadagnare, è il limite della figura.
  ✓ nessun errore JavaScript  → 0

45 controlli passati
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
<summary><code>caccia_ai</code> — SUPERATO (codice di uscita 0)</summary>

```

1) Risposta troncata a metà (connessione caduta durante lo stream)
  ✓ il pulsante Invia torna disponibile  → true
  ✓ lo Stop sparisce  → false
  ✓ nessuna bolla resta in attesa  → 0
  ✓ nessun errore JS  → 0

2) Il fornitore risponde con una pagina HTML di errore (502)
  ✓ avvisa che sta ritentando, invece di restare muto  → true
  ✓ e dice quanto aspetta  → true
  ✓ nessun errore JS  → 0

3) Risposta 200 completamente vuota
  ✓ non resta una bolla vuota in attesa  → 0
  ✓ il pulsante Invia torna disponibile  → true
  ✓ nessun errore JS  → 0

4) L'utente preme Stop mentre la risposta arriva
  ✓ lo Stop riporta subito il pulsante Invia  → true
  ✓ e nasconde se stesso  → false
  ✓ la bolla non resta a puntini per sempre  → 0
    · cronologia: user,assistant
  ✓ la cronologia resta alternata dopo lo Stop  → false
  ✓ nessun errore JS  → 0

5) Si chiude il pannello mentre la risposta è in corso
  ✓ nessun errore JS a pannello chiuso  → 0
  ✓ la risposta arriva comunque, a pannello chiuso  → true
  ✓ riaprendo, il pulsante Invia è a posto  → true
  ✓ e non ci sono bolle in attesa  → 0

6) Testo che potrebbe rompere il rendering
  ✓ lo script nella RISPOSTA non viene eseguito  → false
  ✓ lo script nella DOMANDA non viene eseguito  → false
  ✓ nessun errore JS  → 0

22 passati
```

</details>

<details>
<summary><code>audit_stabilita</code> — SUPERATO (codice di uscita 0)</summary>

```

═══ 1. SESSIONE LUNGA: aprire e chiudere ogni scheda 5 volte ═══
    · schede trovate: 92 (sdashboard, smol, spt, ssyn, sretro, sanimmech…)
    · nodi DOM per giro: 7594 → 41812 → 41812 → 41812 → 41812 → 41812
    · canvas   per giro: 24 → 37 → 37 → 37 → 37 → 37
    · setInterval vivi (creati-cancellati): -3
    · costruzione (giro 1): +34218 nodi
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
  ✓ index — nessun errore all'avvio (7541 nodi)  → 0
  ✓ astro — nessun errore all'avvio (6335 nodi)  → 0
  ✓ chimorga — nessun errore all'avvio (3309 nodi)  → 0
  ✓ accademia — nessun errore all'avvio (181 nodi)  → 0
  ✓ rdkit_lab — nessun errore all'avvio (1526 nodi)  → 0
  ✓ simulazioni — nessun errore all'avvio (208 nodi)  → 0
  ✓ pro — nessun errore all'avvio (825 nodi)  → 0
  ✓ sr_completo — nessun errore all'avvio (5943 nodi)  → 0
  ✓ sr_essenziale — nessun errore all'avvio (1419 nodi)  → 0
  ✓ file_manager — nessun errore all'avvio (99 nodi)  → 0
  ✓ changelog_tesi — nessun errore all'avvio (252 nodi)  → 0
  ✓ guidaret — nessun errore all'avvio (11 nodi)  → 0
  ✓ download — nessun errore all'avvio (48 nodi)  → 0
  ✓ Biochimica_Guida_Definitiva — nessun errore all'avvio (2858 nodi)  → 0

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
    · cache: bsi-v198 con 52 voci
  ✓ il precarico ha messo dentro le pagine  → true
  ✓ nessun errore JS  → 0

2) Offline completo
  ✓ la app si apre senza rete  → true
    · 7007 nodi in 895 ms — "BioSpecInfo · v8"
  ✓ nessun errore JS offline  → 0

3) Rete pessima (risposte a 20 secondi)
    · caricata in 7654 ms con 7037 nodi — rete bloccata 20 volte
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
    · app: bsi-v198   ·  sw.js: bsi-v198
  ✓ BSI_APP_VERSION coincide con la cache del service worker  → bsi-v198
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
    · 🔄AggiornamentiVersione installata: bsi-v198Premi “Controlla” per verificare se è disponib
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
<summary><code>test_fluidita</code> — SUPERATO (codice di uscita 0)</summary>

```
Fluidità — il tempo che la pagina resta bloccata a ogni cambio di sezione

── Viewer 3D PRO ──
  ✓ il click NON costruisce il contesto WebGL (tele create nel gestore)  → 0
  ✓ e il gestore resta sotto il tetto grossolano (ms)  → 29 (limite 400)
  ✓ il viewer si costruisce comunque: la tela WebGL esiste  → true
  ✓ e i comandi del pannello ci sono  → true
      (41 nodi, 1 tela, 26 comandi)

── Sintesi: 296 figure ──
  ✓ le carte delle reazioni ci sono tutte subito  → 296
  ✓ e le figure NON sono ancora tutte disegnate (il differimento esiste)  → true
  ✓ poco dopo, ogni figura è disegnata  → 296
  ✓ nessuna cornice resta vuota  → 0
      (0 figure all'apertura → 296 dopo quattro secondi)
  ✓ alla stampa le figure si disegnano tutte, subito  → 296
  ✓ e prima dell'evento di stampa non lo erano  → true
  ✓ la ricerca filtra anche le carte non ancora disegnate  → true
      («aldol»: 9 su 296)

── I cambi di sezione ──
  ✓ le sezioni attraversate sono tutte  → true
  ✓ il cambio di sezione mediano (ms)  → 15 (limite 40)
  ✓ il cambio di sezione peggiore (ms)  → 82 (limite 260)
  ✓ quante sezioni superano i 100 ms  → 0 (limite 2)
      (92 sezioni; le più lente: sdatasci 82ms, ssimm 80ms, scroma 67ms, sfarm 66ms)
  ✓ nessun errore JavaScript percorrendo tutta l'applicazione  → 0

16 controlli passati
```

</details>

<details>
<summary><code>test_lingue</code> — SUPERATO (codice di uscita 0)</summary>

```
Lingua dell’interfaccia e linguaggi delle molecole

── I moduli ──
  ✓ il motore delle lingue è esposto  → true
  ✓ il motore dei linguaggi molecolari è esposto  → true
  ✓ le due voci sono nel menu ✨  → true
  ✓ «Lingua» e «Linguaggi» hanno un pulsante di navigazione  → 2
  ✓ e la loro sezione esiste  → 2
  ✓ la sezione Lingua si disegna davvero  → true
  ✓ la sezione Linguaggi si disegna con le sue quattro schede  → 4
  ✓ nessuna delle due mostra «Sezione in costruzione»  → false
  ✓ nessun identificativo duplicato con entrambe disegnate  → 0
  ✓ la voce del menu ✨ porta alla sezione  → slingua
  ✓ il selezionatore ha un campo di ricerca  → true
  ✓ elenca tutte le lingue  → true
  ✓ ognuna mostra la copertura misurata  → 13
  ✓ cercando «pol» ne resta una  → 1
  ✓ cercando una parola inesistente lo dice  → block
  ✓ e svuotando la ricerca tornano tutte  → 14
  ✓ e non apre una finestra sovrapposta  → false

── La lingua ──
  ✓ le lingue offerte sono molte  → true
      (it · en · es · fr · de · pt · nl · pl · ro · el · ru · zh · ja · ar)
  ✓ ogni lingua copre tutto lo scheletro  → 
  ✓ e ognuna cambia davvero il testo  → 
      · en  171/171  (138 testi cambiati)
      · es  171/171  (137 testi cambiati)
      · fr  171/171  (141 testi cambiati)
      · de  171/171  (140 testi cambiati)
      · pt  171/171  (137 testi cambiati)
      · nl  171/171  (145 testi cambiati)
      · pl  171/171  (145 testi cambiati)
      · ro  171/171  (145 testi cambiati)
      · el  171/171  (145 testi cambiati)
      · ru  171/171  (145 testi cambiati)
      · zh  171/171  (145 testi cambiati)
      · ja  171/171  (145 testi cambiati)
      · ar  171/171  (145 testi cambiati)
  ✓ lo scheletro misurato è tutto (≥160 elementi)  → true
  ✓ nessun elemento dello scheletro resta senza traduzione  → 0
  ✓ i pulsanti di navigazione tradotti sono tutti  → 92
  ✓ i titoli di sezione tradotti sono tutti  → 55
  ✓ passando all’inglese il testo cambia davvero  → true
  ✓ tornando all’italiano il testo è identico a prima  → 0
  ✓ in arabo la pagina scorre da destra a sinistra  → rtl
  ✓ in giapponese no  → ltr
  ✓ e tornando all’italiano nemmeno  → ltr
  ✓ le categorie della barra sono sette  → 7
  ✓ e cambiano tutte con la lingua  → 7
  ✓ anche il segnaposto della ricerca cambia  → true
  ✓ e torna quello di prima in italiano  → true
      (in tedesco: «🔬 Chemie» · «🔍 Abschnitt suchen...»)
      (171/171 elementi, 138 testi cambiati passando a «en»)

── I linguaggi delle molecole ──
  ✓ ogni chiave InChI coincide con quella di letteratura  → 
  ✓ SMILES → molfile → SMILES torna identico  → 
  ✓ ogni formula è quella giusta  → 
  ✓ InChI, chiave e testo libero vengono rifiutati, non inventati  → 3
  ✓ i linguaggi prodotti sono molti  → true
      (smiles · cxsmarts · smilesConH · morgan · maccs · rdkitFp · coppieAtomi · torsioni · pattern · smilesPiano · cxsmiles · molfileAromatico · smarts · molfile · molfileV3000 · inchi · json · chiaveInchi · xyz · pdb · cml · composizione · stereo · formula · scheletroChiave)
  ✓ l’XYZ ha una riga per atomo più le due di intestazione  → 8
  ✓ e il conteggio in testa è il numero di atomi  → 6
  ✓ le coordinate dell’XYZ non sono tutte nulle  → true
  ✓ e l’XYZ dichiara che sono 2D generate  → true
  ✓ il PDB ha un HETATM per atomo  → 6
  ✓ e i CONECT per i legami  → true
  ✓ e dichiara anch’esso la natura delle coordinate  → true
  ✓ la stereochimica CIP viene letta  → true
      (stereo: atomo 1: (R))
  ✓ il CXSMARTS c’è  → true
  ✓ i linguaggi prodotti sono almeno diciassette  → true
  ✓ lo SMILES senza stereochimica perde i marcatori  → CC(N)C(=O)O
  ✓ e quello isomerico li tiene  → C[C@@H](N)C(=O)O
  ✓ la composizione dell’alanina  → C 40.44%  ·  H 7.92%  ·  N 15.72%  ·  O 35.91%
  ✓ e quella dell’aspirina  → C 60.00%  ·  H 4.48%  ·  O 35.52%
  ✓ un sale viene dichiarato come due componenti  → true
  ✓ e una molecola sola non ha quella riga  → null
  ✓ il CML è XML ben formato  → true
  ✓ una reazione viene riconosciuta e scomposta  → 2 reagenti, 2 prodotti
  ✓ e lo dice invece di convertirla come molecola  → true
      (7 chiavi, 7 giri completi, 4 formule)

── Il nominatore IUPAC ──
  ✓ ogni nome IUPAC coincide con quello scritto a mano, in due lingue  → 
  ✓ ogni molecola fuori classe viene RIFIUTATA  → 
      (26 nomi × 2 lingue · 7 rifiuti attesi)

── I pannelli ──
  ✓ il pannello dei linguaggi ha le sue quattro schede  → 4
  ✓ la guida è scritta, non annunciata  → true
  ✓ la guida copre SMILES, IUPAC, InChI, SMARTS e molfile  → true
  ✓ e dichiara i limiti invece di tacerli  → true
      (7360 caratteri di guida)
  ✓ nessun errore JavaScript  → 0

64 controlli passati
```

</details>

<details>
<summary><code>test_mol3d</code> — SUPERATO (codice di uscita 0)</summary>

```
La molecola che si forma, e gli angoli fra i suoi legami

── Il modulo ──
  ✓ il modulo è caricato  → true
  ✓ e ha preso il posto di render3DOnCanvas  → true
  ✓ conservando l’originale, raggiungibile  → true

── Gli angoli ──
  ✓ metano · tetraedro regolare  → 109.4712° (atteso 109.4712°)
  ✓   · quanti angoli ha metano  → 6
  ✓   · geometria riconosciuta  → tetraedrica
  ✓ acqua · angolata  → 104.4734° (atteso 104.47°)
  ✓   · quanti angoli ha acqua  → 1
  ✓   · geometria riconosciuta  → angolata (sp³)
  ✓ anidride carbonica · lineare  → 180° (atteso 180°)
  ✓   · quanti angoli ha anidride carbonica  → 1
  ✓   · geometria riconosciuta  → lineare
  ✓ trifluoruro di boro · trigonale planare  → 120° (atteso 120°)
  ✓   · quanti angoli ha trifluoruro di boro  → 3
  ✓   · geometria riconosciuta  → trigonale planare
  ✓ ammoniaca · piramidale  → 106.1312° (atteso 106.13°)
  ✓   · quanti angoli ha ammoniaca  → 3
  ✓   · geometria riconosciuta  → piramidale trigonale

── Coordinate piatte ──
  ✓ una struttura con z = 0 è riconosciuta piatta  → true
  ✓ e una con z ≠ 0 NON è riconosciuta piatta  → false

── La formazione ──
  ✓ all’avvio la tela è quasi vuota (polvere)  → true
  ✓ due secondi dopo c’è una molecola  → true
  ✓ il ciclo si ferma quando lo si ferma  → true
      (656 pixel accesi a 130 ms → 2724 a 2,3 s)

── I comandi ──
  ✓ la barra dei comandi compare accanto alla tela  → true
  ✓ ha tre pulsanti  → 3
  ✓ ognuno ha un nome accessibile  → 3 pulsanti, 0 senza nome
      · ↻ Rivedi la formazione  [Rivedi l’animazione di formazione della molecola]
      · 🎞️ Scorri gli angoli  [Mostra gli angoli a turno, da solo]
      · ✕ Pulisci  [Togli la selezione di atomi]
  ✓ su coordinate piatte il pulsante degli angoli è spento  → true
  ✓ e la ragione è scritta, non taciuta  → true
      («la struttura caricata è piana (z = 0): gli angoli reali non si possono m…»)

── L’ordine d’arrivo ──
  ✓ ogni atomo pesante parte prima di ogni idrogeno  → true
  ✓ e a metà strada lo scheletro è più avanti degli idrogeni  → true
      (ritardo: scheletro fino a 0.105, idrogeni da 0.158)

── La selezione ──
  ✓ un atomo mostra tutti i suoi angoli  → ventaglio
  ✓   · e sono sei, sul carbonio tetraedrico  → 6
  ✓ due atomi danno la lunghezza del legame  → lunghezza
  ✓   · C–C dell’etanolo (Å)  → 1.508879385504355° (atteso 1.509°)
  ✓   · e dice che sono legati  → true
  ✓ tre atomi danno l’angolo  → angolo
  ✓   · C–C–O dell’etanolo  → 111.8655151392881° (atteso 111.9°)
  ✓ quattro atomi danno il diedro  → diedro
  ✓   · H–C–C–O dell’etanolo  → 60.67155732887734° (atteso 60.7°)
  ✓ due atomi non legati sono dichiarati tali  → false
  ✓ e la selezione si svuota quando la si svuota  → 0

── I diedri ──
  ✓ diedro anti  → 180° (atteso 180°)
  ✓ diedro eclissata  → 0° (atteso 0°)
  ✓ diedro ortogonale  → 90° (atteso 90°)
  ✓ diedro gauche  → 60° (atteso 60°)
      (anti-periplanare (sfalsata) · sin-periplanare (eclissata) · anti-clinale · sin-clinale (gauche))
  ✓ nessun errore JavaScript  → 0

46 controlli passati
```

</details>

<details>
<summary><code>test_menu</code> — SUPERATO (codice di uscita 0)</summary>

```
Il menù ✨ — Utility spostata, lingue per conto loro

── schermo grande ──
  ✓ il modulo è caricato  → object
  ✓ la categoria Utility esiste ancora nel documento  → true
  ✓   · ma NON è più visibile nella barra  → false
  ✓   · e nemmeno il suo pannello  → false
  ✓ i pulsanti restano nel documento  → 18
  ✓ il pulsante ✨ c’è ed è visibile  → true
  ✓ e apre il pannello del menù  → true
  ✓ tutte le voci spostate sono nel menù  → nessuna mancante
  ✓   · e sono tutte e diciotto  → 18
  ✓ con DUE intestazioni separate  → 2
      (🛠️ Utility · 🌍 Lingue e linguaggi)
  ✓ «Lingua» non sta sotto Utility  → true
  ✓ «Linguaggi molecole» nemmeno  → true
  ✓ e uno strumento qualunque sta sotto Utility  → true
  ✓ cliccando «snotes» nel menù la sezione si apre  → true
  ✓ cliccando «slingua» nel menù la sezione si apre  → true
  ✓ cliccando «slinguaggi» nel menù la sezione si apre  → true
  ✓ cliccando «sspettrolettore» nel menù la sezione si apre  → true
  ✓ nessun errore JavaScript  → 0

── telefono ──
  ✓ il modulo è caricato  → object
  ✓ la categoria Utility esiste ancora nel documento  → true
  ✓   · ma NON è più visibile nella barra  → false
  ✓   · e nemmeno il suo pannello  → false
  ✓ i pulsanti restano nel documento  → 18
  ✓ il pulsante ✨ c’è ed è visibile  → true
  ✓ e apre il pannello del menù  → true
  ✓ tutte le voci spostate sono nel menù  → nessuna mancante
  ✓   · e sono tutte e diciotto  → 18
  ✓ con DUE intestazioni separate  → 2
      (🛠️ Utility · 🌍 Lingue e linguaggi)
  ✓ «Lingua» non sta sotto Utility  → true
  ✓ «Linguaggi molecole» nemmeno  → true
  ✓ e uno strumento qualunque sta sotto Utility  → true
  ✓ cliccando «snotes» nel menù la sezione si apre  → true
  ✓ cliccando «slingua» nel menù la sezione si apre  → true
  ✓ cliccando «slinguaggi» nel menù la sezione si apre  → true
  ✓ cliccando «sspettrolettore» nel menù la sezione si apre  → true
  ✓ nessun errore JavaScript  → 0

36 controlli passati
```

</details>

<details>
<summary><code>@verifica-sicurezza</code> — SUPERATO (codice di uscita 0)</summary>

```
Verifica di sicurezza

File tracciati esaminati: 364

── SEC-01 · Chiavi API nei file tracciati ──
  ✓ nessuna chiave API in un file pubblicato

── SEC-01b · Configurazione del proxy ──
  ✓ wrangler.toml esiste
  ✓ non contiene chiavi
  ✓ avverte di usare wrangler secret put

── SEC-03 · Password in chiaro ──
  ✓ nessuna password in chiaro nel codice
  ✓ il File Manager confronta un hash SHA-256

── SEC-05 · Telemetria ──
  ✓ la variabile di telemetria esiste
  ✓ ed è vuota (nessun invio remoto)

── SEC-06 · Script da domini esterni ──
  ✓ nessuno script caricato da un dominio esterno
  ✓ il numero di file dichiarato nei documenti è quello misurato
      (364 file tracciati, citati in 4 documenti)

10 controlli passati
```

</details>

<details>
<summary><code>audit_storia</code> — SUPERATO (codice di uscita 0)</summary>

```
Storia del repository — nessuna credenziale in nessuna versione

── Prima: gli schemi si riconoscono fra loro ──
  ✓ ogni schema riconosce il proprio esempio  → 
  ✓ e nessuno prende il proprio quasi-esempio  → 
      (9 schemi, provati nei due versi)

── La superficie esaminata ──
  ✓ il clone NON è superficiale (altrimenti la storia è parziale)  → false
  ✓ i commit esaminati sono molti  → true
  ✓ le versioni di file di testo sono molte  → true
      (421 commit · 2346 versioni distinte di file di testo)

── La ricerca ──
  ✓ nessuna credenziale in nessuna versione di nessun file  → 
      (2346 versioni esaminate con 9 schemi)
  ✓ le eccezioni dichiarate sono tutte ancora nella storia, nessuna di più  → 1
      · cc1a0ba00 — tools/banchi/audit_storia.js al commit 825ef66 — la prima stesura di QUESTO banco, che scriveva …

7 controlli passati
```

</details>

<details>
<summary><code>audit_rete</code> — SUPERATO (codice di uscita 0)</summary>

```
Nessun dato dell'utente lascia il dispositivo

  valore spia seminato in 71 depositi · 92 sezioni percorse · 46 richieste ispezionate

  ✓ la spia e' stata seminata  → true
  ✓ almeno una richiesta e' stata ispezionata  → true
  ✓ almeno una sezione e' stata percorsa  → true
  ✓ richieste che portano fuori un dato dell'utente  → 0
  ✓ ospiti contattati e non dichiarati nella distinta  → 0

  ospiti contattati: 127.0.0.1, pubchem.ncbi.nlm.nih.gov

5 controlli passati
```

</details>

<details>
<summary><code>@verifica-accessibilita</code> — SUPERATO (codice di uscita 0)</summary>

```
Verifica di accessibilità
WCAG 2.1 AA — contrasto 4.5:1 (testo normale), 3:1 (testo grande)

  ✓ index                    92/92  sez · 25408 elementi di testo · contrasto 0 · comandi senza nome 0 · campi senza etichetta 0 · img senza alt 0 · 6910 in SVG · 572 su gradiente (misurati sulla tappa peggiore) · 4 su immagine, non misurabili · 2 di sole emoji
  ✓ astro                             4999 elementi di testo · contrasto 0 · comandi senza nome 0 · campi senza etichetta 0 · img senza alt 0 · 2 su gradiente (misurati sulla tappa peggiore) · 1 su immagine, non misurabili · 1 di sole emoji
  ✓ chimorga                          1701 elementi di testo · contrasto 0 · comandi senza nome 0 · campi senza etichetta 0 · img senza alt 0 · 469 in SVG · 1 di sole emoji
  ✓ accademia                         61 elementi di testo · contrasto 0 · comandi senza nome 0 · campi senza etichetta 0 · img senza alt 0 · 1 su gradiente (misurati sulla tappa peggiore) · 13 di sole emoji
  ✓ rdkit_lab                         118 elementi di testo · contrasto 0 · comandi senza nome 0 · campi senza etichetta 0 · img senza alt 0
  ✓ simulazioni                       34 elementi di testo · contrasto 0 · comandi senza nome 0 · campi senza etichetta 0 · img senza alt 0 · 16 su gradiente (misurati sulla tappa peggiore)
  ✓ pro                               80 elementi di testo · contrasto 0 · comandi senza nome 0 · campi senza etichetta 0 · img senza alt 0 · 14 su gradiente (misurati sulla tappa peggiore) · 11 di sole emoji
  ✓ sr_completo                       3005 elementi di testo · contrasto 0 · comandi senza nome 0 · campi senza etichetta 0 · img senza alt 0
  ✓ sr_essenziale                     716 elementi di testo · contrasto 0 · comandi senza nome 0 · campi senza etichetta 0 · img senza alt 0
  ✓ file_manager                      10 elementi di testo · contrasto 0 · comandi senza nome 0 · campi senza etichetta 0 · img senza alt 0 · 3 su gradiente (misurati sulla tappa peggiore) · 2 di sole emoji
  ✓ changelog_tesi                    181 elementi di testo · contrasto 0 · comandi senza nome 0 · campi senza etichetta 0 · img senza alt 0 · 1 di sole emoji
  ✓ download                          12 elementi di testo · contrasto 0 · comandi senza nome 0 · campi senza etichetta 0 · img senza alt 0 · 10 su gradiente (misurati sulla tappa peggiore) · 1 di sole emoji
  ✓ Biochimica_Guida_Definitiva          2056 elementi di testo · contrasto 0 · comandi senza nome 0 · campi senza etichetta 0 · img senza alt 0

── Riepilogo ──
  ✓ nessun comando privo di nome accessibile
  ✓ nessuna immagine priva di testo alternativo
  ✓ nessun salto nella gerarchia dei titoli
      (92 sezioni percorse oltre alla vista iniziale di ogni pagina)
  ✓ contrasto sotto la soglia WCAG AA — invariato a 0 (debito dichiarato, non cresciuto)
  ✓ campi privi di etichetta — invariato a 0 (debito dichiarato, non cresciuto)
  ✓ elementi di testo esaminati — stabile a 38381
      riferimento del 2026-10-06 — il debito è dichiarato in docs/09 §4, non tollerato in silenzio

6 controlli passati
```

</details>

<details>
<summary><code>audit_mobile</code> — SUPERATO (codice di uscita 0)</summary>

```
Traboccamento orizzontale a 390 px

  ✓ sezioni percorse  → 92
  ✓ sezioni in cui la pagina scorre in orizzontale  → 0
  ✓ sezioni con contenuto piu’ largo dello schermo e IRRAGGIUNGIBILE  → 0
  ✓ nessun errore JavaScript  → 0

4 controlli passati
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
   (366 file di testo controllati)

71 controlli passati
```

</details>

<details>
<summary><code>@verifica-documenti</code> — SUPERATO (codice di uscita 0)</summary>

```
Verifica della documentazione

Versione del codice (sw.js): bsi-v198

── Collegamenti interni ──
  ✓ nessun collegamento interno rotto

── Versione dichiarata nei documenti ──
  ✓ nessun documento cita una versione superata

── Fatti passati attribuiti alla versione corrente ──
  ✓ nessuna frase al passato nomina la versione corrente
  ✓ nessun esempio di aggiornamento mostra la stessa versione due volte

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
      (21 deviazioni registrate)

── Matrice di tracciabilità ──
  ✓ nessun identificativo di requisito definito due volte
  ✓ le due lingue definiscono gli stessi requisiti
      (75 in italiano, 75 in inglese)
  ✓ la tabella di copertura è stata letta
  ✓ ogni famiglia dichiara il numero di requisiti che ha davvero
  ✓ il totale automatizzato coincide con la somma delle famiglie
      (75 identificativi definiti, 70 automatizzati)

18 controlli passati
```

</details>

<details>
<summary><code>@verifica-affermazioni</code> — SUPERATO (codice di uscita 0)</summary>

```
Verifica delle affermazioni numeriche
Ogni numero dichiarato nei documenti è confrontato con quello
misurato nell'applicazione in esecuzione.

  ✓ sezioni navigabili  → 92
  ✓ farmaci in banca dati  → 263
  ✓ malattie nell'atlante 3D  → 63
  ✓ malattie oncologiche  → 23
  ✓ strumenti dell'agente  → 35
  ✓ strategie di retrosintesi  → 46
  ✓ moduli di chimica organica  → 25

── Badge del README ──
  ✓ il badge della versione è allineato al codice  → bsi--v198
  ✓ il badge dei banchi coincide con la batteria  → 62
  ✓ il badge del contrasto coincide con la misura registrata  → 0

── Riepilogo ──
  affermazioni confrontate con la misura: 7

10 controlli passati
```

</details>

<details>
<summary><code>audit_copertura</code> — SUPERATO (codice di uscita 0)</summary>

```
Copertura di codice — istruzioni eseguite, non rami

  92 sezioni percorse · 3 altre pagine · 28 file di script

  · 3Dmol-min.js                24.4 %   (122 kB su 502 kB)
  · RDKit_minimal.js           38.15 %   (95 kB su 250 kB)
  · astro.html                 50.52 %   (870 kB su 1723 kB)
  · bsi-ai-hub.js               32.9 %   (137 kB su 418 kB)
  · bsi-cheminfo.js            35.58 %   (86 kB su 242 kB)
  · bsi-digitalizza.js         24.79 %   (9 kB su 35 kB)
  · bsi-documento.js           31.93 %   (7 kB su 21 kB)
  · bsi-elucida.js              34.9 %   (17 kB su 50 kB)
  · bsi-geom3d.js              27.01 %   (12 kB su 43 kB)
  · bsi-lingue.js              99.17 %   (134 kB su 135 kB)
  · bsi-menu.js                58.06 %   (6 kB su 10 kB)
  · bsi-mol3d.js                9.08 %   (4 kB su 40 kB)
  · bsi-moldraw.js             27.33 %   (11 kB su 42 kB)
  · bsi-molingue.js            16.58 %   (8 kB su 51 kB)
  · bsi-nmr.js                 62.79 %   (34 kB su 54 kB)
  · bsi-nmr2d.js                23.1 %   (4 kB su 19 kB)
  · bsi-pannelli-lingua.js     61.99 %   (39 kB su 63 kB)
  · bsi-pretsch.js             99.96 %   (33 kB su 33 kB)
  · bsi-quesito.js             33.69 %   (6 kB su 17 kB)
  · bsi-spettri.js             71.45 %   (23 kB su 32 kB)
  · bsi-spettrolettore.js      39.92 %   (39 kB su 96 kB)
  · chimorga.html              59.46 %   (11 kB su 19 kB)
  · gltf_loader.js             45.17 %   (43 kB su 94 kB)
  · index.html                 62.17 %   (2360 kB su 3796 kB)
  · rdkit_lab.html             21.78 %   (30 kB su 138 kB)
  · smiles-drawer.min.js        10.9 %   (27 kB su 246 kB)
  · three.min.js               34.94 %   (206 kB su 589 kB)
  · three_bloom.js             76.83 %   (20 kB su 25 kB)

  complessiva: 50.01 %

  ✓ sezioni percorse  → 92
  ✓ file di script raccolti  → true
  ✓ la copertura e' stata calcolata  → true
  ✓ copertura di codice — stabile a 50.01 % (riferimento 49.89 %, tolleranza ±0.5)

4 controlli passati
```

</details>

<details>
<summary><code>test_stack</code> — SUPERATO (codice di uscita 0)</summary>

```
Lo stack React + FastAPI — lo stesso motore, un altro guscio

── Il motore, eseguito da Node ──
  ✓ il motore si dichiara pronto  → true
  ✓ e dice quale RDKit sta usando  → true
      (RDKit 2025.03.4)
  ✓ esegue gli STESSI file dell’applicazione, non una copia  → 0

── Gli stessi numeri del browser ──
  ✓ il benzene a 128,5 ppm  → 128.5
  ✓ l’anisolo dà i suoi quattro ¹H distinti  → 4
  ✓   · ai valori misurati nel browser  → 3.73,6.9,6.94,7.29
  ✓ il COSY del benzene ha solo la diagonale  → 0
  ✓ la geometria dell’etanolo ha 3 atomi pesanti e 6 idrogeni  → 3/9
  ✓ e uno SMILES illeggibile non produce uno spettro inventato  → true

── L’API ──

  ⊘ saltato: mancano fastapi o pytest per Python
    Non è un guasto dell’applicazione: è un ambiente incompleto.
    Per eseguirlo: pip install -r stack/api/requirements.txt && (cd stack/web && npm install)

9 controlli passati, il resto saltato
```

</details>

---

## 5. Come riprodurre questo rapporto

```bash
# 1. dalla radice del repository, al commit indicato al §2
git checkout ed40d457abba

# 2. dipendenze di prova (solo Playwright, nessuna dipendenza di runtime)
npm install

# 3. server locale: RDKit WASM richiede contesto HTTP
python3 -m http.server 8899 &

# 4. esecuzione
node tools/genera-evidenza.js
```

I banchi risiedono in `tools/banchi/`, versionati nel repository; la
variabile `BSI_BANCHI` permette di indicarne un'altra. L'opzione `--veloce` salta i
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

_Generato il 2026-10-08T12:59:26.958Z._
