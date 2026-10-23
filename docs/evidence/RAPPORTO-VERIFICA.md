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
| **Banchi superati** | 71 |
| **Banchi falliti** | 0 |
| **Durata totale** | 1861 s |
| **Esito** | ✅ **CONFORME** |

---

## 2. Ambiente di esecuzione

| Campo | Valore |
|---|---|
| Istante (UTC) | `2026-10-23T16:30:02.462Z` |
| Commit | `d6be31c1f5ec4acc68a29953f3a685e09636ec29` |
| Ramo | `claude/app-layout-synthesis-features-97UCN` |
| Albero di lavoro pulito | sì (nessuna modifica non registrata) |
| Versione applicazione | `bsi-v234` |
| Node.js | `v22.22.2` |
| Piattaforma | `linux x64` |
| Chromium | `Chromium 141.0.7390.37` |
| playwright-core | `1.62.1` |

### Impronte dei file verificati

Il rapporto si riferisce esattamente a questo contenuto.

| File | Byte | SHA-256 |
|---|---:|---|
| `index.html` | 4.792.621 | `1fe25b51ebf7c3c3d33dfd6e13543ac55eab50efa7e878dd8e53f4b4c3482af9` |
| `bsi-ai-hub.js` | 438.811 | `9979f49378cafa4c1bfb141946cd9dccc6f342ebefc2e946617ddba7a81e57de` |
| `bsi-spettri.js` | 35.565 | `be757f15a70f884e3374d401596e2dfd18bcc852cafbb4584920e2b2d24eb3c9` |
| `sw.js` | 6647 | `8cf3e86696e2dae13ec72c9bd9b511d9fc190325b42e140268772850114d1691` |
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
| `@verifica-farmaci` | ✅ SUPERATO | 5.9 s | ✓ CONFORME |
| `audit_farmaci` | ✅ SUPERATO | 5.9 s | 263 farmaci controllati — nessun errore, 21 avvisi |
| `verifica_farmaci_v187` | ✅ SUPERATO | 6.6 s | 36/36 formule coincidono |
| `test_spettri` | ✅ SUPERATO | 5.4 s | 41 passati |
| `test_spettri_ui` | ✅ SUPERATO | 11.9 s | 16 passati |
| `test_assi` | ✅ SUPERATO | 6.4 s | 13 passati |
| `test_assi_canvas` | ✅ SUPERATO | 9.9 s | 6 passati |
| `test_costanti` | ✅ SUPERATO | 0.1 s | ✓ tutti passati — 45 controlli |
| `audit_dati` | ✅ SUPERATO | 0.1 s | ✓ 29 controlli superati |
| `test_simmetria` | ✅ SUPERATO | 4.0 s | 26 passati |
| `test_cheminfo` | ✅ SUPERATO | 12.8 s | 192 controlli passati |
| `test_farm_ui` | ✅ SUPERATO | 7.6 s | 11 controlli passati |
| `test_datasci` | ✅ SUPERATO | 8.6 s | 23 controlli passati |
| `test_astro` | ✅ SUPERATO | 6.7 s | 13 controlli passati |
| `test_spettrolettore` | ✅ SUPERATO | 59.7 s | 66 controlli passati |
| `test_documento` | ✅ SUPERATO | 21.3 s | 50 controlli passati |
| `test_nmr` | ✅ SUPERATO | 25.3 s | 66 controlli passati |
| `test_nmr2d` | ✅ SUPERATO | 13.3 s | 40 controlli passati |
| `test_geom3d` | ✅ SUPERATO | 8.5 s | 29 controlli passati |
| `test_elucida` | ✅ SUPERATO | 7.6 s | 32 controlli passati |
| `test_digitalizza` | ✅ SUPERATO | 7.8 s | 45 controlli passati |
| `test_fisica` | ✅ SUPERATO | 131.0 s | 92 controlli passati |
| `test_matematica` | ✅ SUPERATO | 121.3 s | 154 controlli passati |
| `test_esami` | ✅ SUPERATO | 134.0 s | 235 controlli passati |
| `test_assistente` | ✅ SUPERATO | 41.1 s | 159 controlli passati |
| `test_grafica3d` | ✅ SUPERATO | 73.7 s | 115 controlli passati |
| `test_laboratori` | ✅ SUPERATO | 157.5 s | 151 controlli passati |

### Agente AI

_L'assistente resta utilizzabile quando il fornitore esterno si guasta._

| Banco | Esito | Durata | Sintesi |
|---|---|---:|---|
| `test_nucleo` | ✅ SUPERATO | 5.0 s | 13 passati |
| `test_ko` | ✅ SUPERATO | 0.1 s | ✓ tutti passati — 35 controlli |
| `test_404` | ✅ SUPERATO | 0.1 s | ✓ tutti passati — 36 controlli |
| `test_503` | ✅ SUPERATO | 0.1 s | ✓ tutti passati — 40 controlli |
| `test_firma` | ✅ SUPERATO | 0.1 s | ✓ tutti passati — 31 controlli |
| `test_attesa` | ✅ SUPERATO | 0.1 s | ✓ tutti passati — 11 controlli |
| `test_attesalunga` | ✅ SUPERATO | 0.1 s | ✓ tutti passati — 14 controlli |
| `test_tetto` | ✅ SUPERATO | 0.1 s | ✓ tutti passati — 32 controlli |
| `browser_ko` | ✅ SUPERATO | 38.2 s | 37 passati |
| `browser_prova` | ✅ SUPERATO | 52.8 s | 29 passati |
| `browser_prov` | ✅ SUPERATO | 5.2 s | 7 passati |
| `test_doppioinvio` | ✅ SUPERATO | 11.6 s | 7 passati |
| `caccia_ai` | ✅ SUPERATO | 64.5 s | 22 passati |

### Stabilita

_L'applicazione regge sessioni lunghe, memoria esaurita e rete degradata._

| Banco | Esito | Durata | Sintesi |
|---|---|---:|---|
| `audit_stabilita` | ✅ SUPERATO | 136.1 s | 29 passati |
| `audit_promesse` | ✅ SUPERATO | 116.7 s | 22 passati |
| `audit_quota` | ✅ SUPERATO | 42.1 s | 10 passati |
| `test_sw` | ✅ SUPERATO | 31.1 s | 22 passati |
| `test_filemanager` | ✅ SUPERATO | 11.0 s | 15 passati |
| `test_visore3d` | ✅ SUPERATO | 9.8 s | 5 passati |

### Interfaccia

_I pannelli e i comandi rispondono come documentato._

| Banco | Esito | Durata | Sintesi |
|---|---|---:|---|
| `browser_reset` | ✅ SUPERATO | 10.8 s | 24 passati |
| `browser_proxy` | ✅ SUPERATO | 9.0 s | 15 passati |
| `browser_proxyui` | ✅ SUPERATO | 12.2 s | 17 passati |
| `browser_rdkit` | ✅ SUPERATO | 5.1 s | 31 passati |
| `browser_lab` | ✅ SUPERATO | 11.1 s | 21 passati |
| `browser_frontiera` | ✅ SUPERATO | 6.9 s | 9 passati |
| `test_aggiorna` | ✅ SUPERATO | 5.9 s | 9 passati |
| `test_guidaproxy` | ✅ SUPERATO | 5.4 s | 12 passati |
| `test_fluidita` | ✅ SUPERATO | 24.7 s | 16 controlli passati |
| `test_lingue` | ✅ SUPERATO | 15.4 s | 64 controlli passati |
| `test_sellingua` | ✅ SUPERATO | 21.9 s | 30 controlli passati |
| `test_mol3d` | ✅ SUPERATO | 12.7 s | 46 controlli passati |
| `test_menu` | ✅ SUPERATO | 26.7 s | 42 controlli passati |

### Sicurezza e accessibilita

_Nessuna credenziale pubblicata; le pagine restano usabili con una tecnologia assistiva._

| Banco | Esito | Durata | Sintesi |
|---|---|---:|---|
| `@verifica-sicurezza` | ✅ SUPERATO | 0.5 s | 10 controlli passati |
| `audit_storia` | ✅ SUPERATO | 14.8 s | 7 controlli passati |
| `audit_rete` | ✅ SUPERATO | 30.5 s | 5 controlli passati |
| `@verifica-accessibilita` | ✅ SUPERATO | 108.5 s | 6 controlli passati |
| `audit_mobile` | ✅ SUPERATO | 38.6 s | 4 controlli passati |

### Coerenza documentazione/codice

_Cio che la documentazione promette esiste davvero nel codice._

| Banco | Esito | Durata | Sintesi |
|---|---|---:|---|
| `verifica_guida` | ✅ SUPERATO | 0.3 s | 71 controlli passati |
| `@verifica-documenti` | ✅ SUPERATO | 0.1 s | 18 controlli passati |
| `@verifica-affermazioni` | ✅ SUPERATO | 11.1 s | 10 controlli passati |
| `audit_copertura` | ✅ SUPERATO | 49.0 s | 4 controlli passati |

### Una sola casa per funzione

_Lo stack React/FastAPI esegue gli STESSI file dell'applicazione, non una copia; e nell'interfaccia nessuna funzione ha due porte d'ingresso._

| Banco | Esito | Durata | Sintesi |
|---|---|---:|---|
| `test_stack` | ✅ SUPERATO | 0.5 s | 9 controlli passati, il resto saltato |
| `test_articoli` | ✅ SUPERATO | 20.4 s | 60 controlli passati |
| `audit_statico` | ✅ SUPERATO | 0.5 s | nessuna delle tre misure e' cresciuta |

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
      (128 sezioni, 128 pulsanti; senza pulsante ma raggiungibili: nessuna)
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
      (175 → 235 nodi)
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

── Le due tabelle IR, e la relazione fra loro ──
  ✓ ogni coppia dichiarata esiste in entrambe le tabelle  → 0
  ✓ l’ombrello delle assegnazioni copre la tabella di riferimento  → 0
      (23 gruppi confrontati · ombrello 27 righe · riferimento 28)
  ✓ e nessun ombrello è arbitrariamente più largo del riferimento  → 0
      (margine concesso: 140 cm⁻¹ oltre il riferimento)
  ✓ il distintivo in intestazione riporta la versione vera  → v233
  ✓ nessun errore JavaScript  → 0

66 controlli passati
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
      caffeina        24 atomi · scarto 0.027 Å · minima 2.33 Å · 77 ms
      ibuprofene      33 atomi · scarto 0.014 Å · minima 1.99 Å · 81 ms
      naprossene      31 atomi · scarto 0.022 Å · minima 2.27 Å · 110 ms
      paracetamolo    20 atomi · scarto 0.011 Å · minima 2.33 Å · 35 ms
      atorvastatina   76 atomi · scarto 0.31 Å · minima 1.63 Å · 523 ms
  ✓ ognuna produce una geometria  → 0
  ✓ il residuo peggiore resta nel valore dichiarato (Å)  → 0.31 (al più 0.4)
  ✓ e nessuna coppia scende sotto 1,5 Å  → 1.63 (almeno 1.5)
  ✓ nessuna impiega più di due secondi  → 523 (al più 2000)

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
<summary><code>test_fisica</code> — SUPERATO (codice di uscita 0)</summary>

```
── Schrödinger ──
  ✓ oscillatore armonico E0 = 0.5  → 0.4999944536 (atteso 0.5 ± 0.0005)
  ✓ oscillatore armonico E1 = 1.5  → 1.499972268 (atteso 1.5 ± 0.0005)
  ✓ oscillatore armonico E2 = 2.5  → 2.499927896 (atteso 2.5 ± 0.0005)
  ✓ oscillatore armonico E3 = 3.5  → 3.499861337 (atteso 3.5 ± 0.0005)
  ✓ oscillatore armonico E4 = 4.5  → 4.49977259 (atteso 4.5 ± 0.0005)
  ✓ pozzo infinito L = 1: E₁ = π²/2  → 4.934799387 (atteso 4.934802200544679 ± 0.0001)
  ✓   · E₂ = 4 E₁  → 19.73916378 (atteso 19.739208802178716 ± 0.001)
  ✓ Morse HCl: fondamentale numerica = esatta (cm⁻¹)  → 2872.305051 (atteso 2872.3379231668528 ± 0.5)
  ✓ Morse CO: fondamentale numerica = esatta (cm⁻¹)  → 2143.722804 (atteso 2143.8543056403787 ± 0.5)
  ✓ Morse CO: vicino allo sperimentale 2143,27 cm⁻¹  → 2143.854306 (atteso 2143.27 ± 2)
  ✓ Crank-Nicolson conserva la norma (400 passi)  → 1 (atteso 1 ± 1e-9)
  ✓ trasmissione esatta per E = V₀ (1/(1 + V₀a²/2))  → 0.5 (atteso 0.5 ± 1e-9)

── Hartree-Fock STO-3G ──
  ✓ H₂ a 1,4 bohr (Szabo-Ostlund −1,116714 Eh)  → -1.116714325 (atteso -1.116714 ± 0.000002)
  ✓ HeH⁺ a 1,4632 bohr (Szabo-Ostlund −2,860662 Eh)  → -2.860658609 (atteso -2.860662 ± 0.00001)
  ✓ H₂O (Crawford −74,942079928 Eh)  → -74.94207993 (atteso -74.942079928192 ± 0.000001)
  ✓ H₂O: repulsione nucleare 8,002367 Eh  → 8.002367062 (atteso 8.002367 ± 0.00001)
  ✓ H₂O: cinque orbitali occupati  → 5
  ✓ H₂O: la somma delle cariche di Mulliken è zero  → -1.165734176e-14 (atteso 0 ± 1e-8)
  ✓ funzione di Boys F₀(0) = 1  → 1 (atteso 1 ± 1e-12)
  ✓ funzione di Boys F₀(1) = 0,746824  → 0.7468241328 (atteso 0.746824132812427 ± 1e-10)

── Rotovibrazionale ──
  ✓ rₑ di HCl dalla costante Bₑ (1,2746 Å)  → 1.274552484 (atteso 1.2746 ± 0.0005)
  ✓ B₀ ricavato dalle righe = B₀ di partenza  → 10.43901209 (atteso 10.439810000000001 ± 0.002)
  ✓ B₁ ricavato dalle righe = B₁ di partenza  → 10.13183209 (atteso 10.13263 ± 0.002)
  ✓ nessuna riga all’origine della banda (ΔJ = 0 proibito)  → 0
  ✓ Raman O₂: solo J dispari  → 0

── Termodinamica statistica (S° NIST-JANAF, 298,15 K, 1 bar) ──
  ✓ S°(Ar) = 154.85 J mol⁻¹ K⁻¹  → 154.8456597 (atteso 154.85 ± 0.3)
  ✓ S°(N2) = 191.61 J mol⁻¹ K⁻¹  → 191.5638821 (atteso 191.61 ± 0.3)
  ✓ S°(O2) = 205.15 J mol⁻¹ K⁻¹  → 205.1281181 (atteso 205.15 ± 0.3)
  ✓ S°(CO) = 197.66 J mol⁻¹ K⁻¹  → 197.6104337 (atteso 197.66 ± 0.3)
  ✓ S°(CO2) = 213.79 J mol⁻¹ K⁻¹  → 213.7617719 (atteso 213.79 ± 0.3)
  ✓ S°(H2O) = 188.84 J mol⁻¹ K⁻¹  → 188.7166871 (atteso 188.84 ± 0.3)
  ✓ S°(CH4) = 186.25 J mol⁻¹ K⁻¹  → 186.3190332 (atteso 186.25 ± 0.3)
  ✓ S°(NH3) = 192.77 J mol⁻¹ K⁻¹  → 193.1494269 (atteso 192.77 ± 0.6)
  ✓ Cp(N₂, 298 K) = 29,12 J mol⁻¹ K⁻¹  → 29.11289905 (atteso 29.12 ± 0.05)

── Dinamica molecolare ──
  ✓ senza termostato l’energia per particella si conserva (scarto relativo)  → 0.0007925765037 (atteso 0 ± 0.002)
  ✓ primo picco di g(r) al minimo del potenziale (2^1/6 σ)  → 1.125 (atteso 1.122462048309373 ± 0.08)
  ✓ il termostato porta la temperatura al valore chiesto (T* 0,8)  → 0.8155698766 (atteso 0.8 ± 0.08)

── Matematica ──
  ✓ Hückel benzene: livelli 2, 1, 1, −1, −1, −2  → 2,1,1,-1,-1,-2
  ✓   · energia di delocalizzazione 2β  → 2 (atteso 2 ± 1e-9)
  ✓ Hückel butadiene: delocalizzazione 0,472β  → 0.472135955 (atteso 0.4721 ± 0.0001)
  ✓ Hückel naftalene: delocalizzazione 3,683β  → 3.683238506 (atteso 3.6832 ± 0.0001)
  ✓ Hückel ciclobutadiene: delocalizzazione 0 (antiaromatico)  → 8.881784197e-16 (atteso 0 ± 1e-9)
  ✓ Hückel anione Cp⁻: delocalizzazione 2,472β  → 2.472135955 (atteso 2.4721 ± 0.0001)
  ✓ FFT: la riga a 100 Hz cade a 100 Hz  → 100.0976563 (atteso 100 ± 0.5)
  ✓ RK4 su A → B → C: scarto da [B] esatta  → 2.299570256e-12 (atteso 0 ± 1e-9)
  ✓ Arrhenius N₂O₅: Eₐ ≈ 103 kJ/mol  → 102.897859 (atteso 103 ± 3)

── Cristallografia (Cu Kα, 1,5406 Å) ──
  ✓ NaCl (200) a 2θ = 31,70°  → 31.70315736 (atteso 31.7 ± 0.02)
  ✓ NaCl (220) a 2θ = 45,45°  → 45.44735665 (atteso 45.45 ± 0.02)
  ✓ Si (111) a 2θ = 28,44°  → 28.44263637 (atteso 28.44 ± 0.02)
  ✓ Cu (111) a 2θ = 43,30°  → 43.31816975 (atteso 43.3 ± 0.05)
  ✓ α-Fe (110) a 2θ = 44,67°  → 44.67163128 (atteso 44.67 ± 0.02)
  ✓ fcc: (100) e (110) estinti  → true
  ✓ bcc: (100) e (111) estinti  → true
  ✓ diamante: (200) estinto, al contrario del NaCl  → true
  ✓ d(111) cubico a = 5,64 Å  → 3.256255518 (atteso 3.2562555182294894 ± 1e-9)

── Nucleare ──
  ✓ ⁹⁹ᵐTc al massimo dopo ln(λ₂/λ₁)/(λ₂ − λ₁) = 22,84 h  → 22.84 (atteso 22.84 ± 0.02)
  ✓ equilibrio secolare ⁹⁰Sr/⁹⁰Y: attività uguali  → 1.000233809 (atteso 1 ± 0.001)
  ✓ ¹⁴C: metà del carbonio = 5730 anni  → 5730 (atteso 5730 ± 0.000001)
  ✓ B/A del ⁵⁶Fe ≈ 8,79 MeV (Weizsäcker)  → 8.846137499 (atteso 8.79 ± 0.1)
  ✓ valle di stabilità: Z ≈ 26 per A = 56  → 25.23024465 (atteso 26 ± 1)

── Nel browser ──
── schermo grande ──
  ✓ la categoria ⚛️ Fisica c’è  → true
  ✓   · e il suo pannello si apre  → flex
  ✓   · con le otto sezioni  → 8
  ✓ sschrod: si apre, ogni scheda disegna  → true
  ✓ shf: si apre, ogni scheda disegna  → true
  ✓ srotovib: si apre, ogni scheda disegna  → true
  ✓ stermostat: si apre, ogni scheda disegna  → true
  ✓ sdinmol: si apre, ogni scheda disegna  → true
  ✓ smatchim: si apre, ogni scheda disegna  → true
  ✓ scristalli: si apre, ogni scheda disegna  → true
  ✓ snucleare: si apre, ogni scheda disegna  → true
  ✓ la dinamica molecolare si ferma a sezione chiusa  → true
  ✓ nessun errore JavaScript  → 0
── telefono ──
  ✓ sschrod: si apre, ogni scheda disegna  → true
  ✓   · a 390 px niente sborda  → 0
  ✓ shf: si apre, ogni scheda disegna  → true
  ✓   · a 390 px niente sborda  → 0
  ✓ srotovib: si apre, ogni scheda disegna  → true
  ✓   · a 390 px niente sborda  → 0
  ✓ stermostat: si apre, ogni scheda disegna  → true
  ✓   · a 390 px niente sborda  → 0
  ✓ sdinmol: si apre, ogni scheda disegna  → true
  ✓   · a 390 px niente sborda  → 0
  ✓ smatchim: si apre, ogni scheda disegna  → true
  ✓   · a 390 px niente sborda  → 0
  ✓ scristalli: si apre, ogni scheda disegna  → true
  ✓   · a 390 px niente sborda  → 0
  ✓ snucleare: si apre, ogni scheda disegna  → true
  ✓   · a 390 px niente sborda  → 0
  ✓ nessun errore JavaScript  → 0
  ✓ in inglese la categoria si chiama «Physics»  → ⚛️ Physics
  ✓   · e la dinamica molecolare «Molecular dynamics»  → 🎱 Molecular dynamics

92 controlli passati
```

</details>

<details>
<summary><code>test_matematica</code> — SUPERATO (codice di uscita 0)</summary>

```
── Motore simbolico: forma canonica ──
  ✓ termini simili raccolti  → 2x² + 2x + 1
  ✓ √2·√2 = 2  → 2
  ✓ frazioni esatte: 0,1 + 0,2 = 3/10  → 3/10
  ✓ ∛8 = 2  → 2
  ✓ ln(eˣ) = x  → x
  ✓ −(x + 1) si distribuisce  → −x − 1
  ✓ espansione di (x + 1)³  → x³ + 3x² + 3x + 1
  ✓ espansione di (x − 1)(x + 1)  → x² − 1
  ✓ sintassi italiana: sen, tg, √, ², ·  → true

── Derivate ──
  ✓ (x³)′  → 3x²
  ✓ sin(x²)′ (catena)  → 2x·cos(x²)
  ✓ (xˣ)′  → x^x·(ln(x) + 1)
  ✓ atan(x)′  → 1/(x² + 1)
  ✓ ln(x² + 1)′  → 2x/(x² + 1)
  ✓ il registro dei passi riconosce il quoziente  → true
  ✓ derivata simbolica = differenze finite (funzione complicata)  → 5.433813399e-10 (atteso 0 ± 0.000001)

── Primitive (verificate derivando) ──
  ✓ ∫ x·eˣ  → x·e^x − e^x
  ✓ ∫ 1/(1 + x²)  → atan(x)
  ✓ ∫ ln x  → x·ln(x) − x
  ✓ ∫ 2x·cos(x²) (sostituzione)  → sin(x²)
  ✓ ∫ x²·sin x (per parti due volte)  → true
  ✓ ∫ sin(x)·cos(x)  → −cos(x)²/2
  ✓ e^(−x²) non ha primitiva elementare  → null
  ✓ ∫ e^(−x²) su ℝ = √π (Simpson adattivo)  → 1.772453851 (atteso 1.7724538509055159 ± 1e-9)
  ✓ ∫₀^π sin x = 2  → 2 (atteso 2 ± 1e-10)

── Serie e limiti ──
  ✓ sin x: coefficiente di x⁵ = 1/120  → 1/120
  ✓ tan x: coefficiente di x⁷ = 17/315  → 17/315
  ✓ Σ 1/k! (serie di eˣ in 1) = e  → 2.718281828 (atteso 2.718281828459045 ± 1e-12)
  ✓ ln(1 + x): coefficienti 1, −1/2, 1/3, −1/4  → 1,−1/2,1/3,−1/4
  ✓ lim sin x / x = 1 (con le serie)  → 1 serie
  ✓ lim (1 − cos x)/x² = 1/2  → 0.5
  ✓ lim (1 + 1/x)ˣ per x → ∞ = e  → 2.718281828 (atteso 2.718281828459045 ± 1e-7)
  ✓ |x|/x in 0: sinistro −1, destro 1, il limite non esiste  → -1 1 NaN
  ✓ lim 1/x² = +∞  → Infinity
  ✓ lim x·ln x per x → 0⁺ = 0  → 0
  ✓ lim ln x per x → 0⁺ = −∞  → -Infinity
  ✓ radici di x³ − 6x² + 11x − 6  → 1,2,3
  ✓ radici di x² + 1: ±i  → 0-1,01

── Basi ──
  ✓ 0,004050 ha 4 cifre significative  → 4
  ✓ 1200 è ambiguo  → true
  ✓ 1,20e3 ha 3 cifre significative  → 3
  ✓ 12,11 × 0,0150 → 3 cifre: 0.182  → 0.182
  ✓ 12,11 + 18,0 → 1 decimale: 30.1  → 30.1
  ✓ pH di 2,5·10⁻⁴ M = 3.60 (2 decimali per 2 cifre)  → 3.60
  ✓ acido acetico 0,1 M: [H⁺] dalla formula risolutiva  → 0.001332670973 (atteso 0.001332670973077975 ± 1e-12)
  ✓ eˣ = 3 − x → x = 3 − W(e³)  → 0.7920599684 (atteso 0.7920599684306769 ± 1e-9)
  ✓ x² + 2x + 5 = 0 → −1 ± 2i  → -1-2,-12
  ✓ 2° grado: Δ  → 1
  ✓ allenamento «cifre»: la risposta giusta è accettata  → true
  ✓ allenamento «scientifica»: la risposta giusta è accettata  → true
  ✓ allenamento «ph»: la risposta giusta è accettata  → true
  ✓ allenamento «logaritmo»: la risposta giusta è accettata  → true
  ✓ allenamento «secondo»: la risposta giusta è accettata  → true
  ✓ allenamento «derivata»: la risposta giusta è accettata  → true
  ✓ allenamento: una risposta sbagliata è respinta  → true

── Studio di funzione ──
  ✓ x³ − 3x: massimo in −1, minimo in 1  → max-1,min1
  ✓   · flesso in 0, funzione dispari  → 0 dispari
  ✓ (x² − 1)/(x − 2): asintoto verticale x = 2  → 2
  ✓   · asintoto obliquo y = x + 2  → obliquo 1 2
  ✓ x·e^(−x): massimo in 1, flesso in 2, y = 0 a +∞  → max1 2 orizzontale0
  ✓ ln(x)/x: massimo in x = e  → 2.718281828 (atteso 2.718281828459045 ± 1e-8)

── Derivate, integrali e serie (sezione) ──
  ✓ Riemann punto medio di x² su [0, 1], n = 10  → 0.3325 (atteso 0.3325 ± 1e-12)
  ✓ trapezi, n = 10  → 0.335 (atteso 0.335 ± 1e-12)
  ✓ Taylor di sin x al 7° grado  → x − (1/6)·x³ + (1/120)·x⁵ − (1/5040)·x⁷

── Algebra lineare ──
  ✓ sistema 3×3: x = 2, y = 3, z = −1  → unica 2,3,−1
  ✓ sistema con infinite soluzioni  → infinite
  ✓ sistema impossibile  → impossibile
  ✓ inversa della matrice di Hilbert 3×3 (intera)  → 9 −36 30 −36 192 −180 30 −180 180
  ✓ det di Hilbert 3×3 = 1/2160  → 1/2160
  ✓ det 4×4 (rifatto a parte in frazioni: 86)  → 86
  ✓ autovalori di tridiag(−1, 2, −1): 2 − √2, 2, 2 + √2  → 0.5857864376,2.0000000000,3.4142135624
  ✓ [2 1; 0 2]: λ = 2 doppio con un solo autovettore  → 2 2 1
  ✓ rotazione di 90°: autovalori ±i  → 0,-1 0,1
  ✓ polinomio caratteristico di [4 1; 2 3] = λ² − 7λ + 10  → 10,−7,1
  ✓ C₃H₈ + O₂ → CO₂ + H₂O  → 1 5 3 4
  ✓ KMnO₄ + HCl → KCl + MnCl₂ + H₂O + Cl₂  → 2 16 2 2 8 5
  ✓ redox con cariche: MnO₄⁻ + Fe²⁺ + H⁺  → 1 5 8 1 5 4
  ✓ processo Wöhler: Ca₃(PO₄)₂ + SiO₂ + C  → 2 6 10 6 1 10
  ✓ idrato CuSO₄·5H₂O  → 1 1 5
  ✓ H₂ + O₂ → H₂O + H₂O₂: nucleo di dimensione 2, non unica  → dim 2

── Equazioni differenziali ──
  ✓ Eulero: dimezzando h l’errore cala di ~2 (ordine 1)  → 1.897834383 (atteso 2 ± 0.12)
  ✓ Heun: cala di ~4 (ordine 2)  → 3.814823833 (atteso 4 ± 0.25)
  ✓ RK4: cala di ~16 (ordine 4)  → 15.18976506 (atteso 16 ± 1)
  ✓ Lotka-Volterra: equilibrio (c/d, a/b) = (4; 2,75), centro  → 4 2.75 centro
  ✓ oscillatore smorzato: fuoco stabile  → fuoco stabile
  ✓ pendolo: sella in θ = π  → sella
  ✓ Bruxellatore (A = 1, B = 3 > 1 + A²): (1, 3) fuoco instabile  → 1 3 fuoco instabile
  ✓ SIR: una curva di equilibri (I = 0)  → curva

── Più variabili ──
  ✓ x² − y²: sella  → sella
  ✓ x·y·e^(−(x²+y²)/2): 2 massimi, 2 minimi, 1 sella  → massimo,massimo,minimo,minimo,sella
  ✓ doppia buca: due minimi e uno stato di transizione  → minimo,minimo,sella
  ✓ Rosenbrock: minimo in (1, 1)  → 1 1
  ✓ Maxwell (van der Waals): (∂S/∂V)_T = (∂p/∂T)_V = R/(V − b)  → R/(V − b) R/(V − b) true
  ✓ δq = Cv dT + (RT/V) dV non è esatto  → false
  ✓ δq/T è esatto e il potenziale è S = Cv ln T + R ln V  → true
  ✓ discesa del gradiente su x² + y²: arriva all’origine  → 4.780842753e-7 (atteso 0 ± 0.0001)

── Complessi e Fourier ──
  ✓ e^(iπ) = −1  → −1
  ✓ (1 + i)⁸ = 16  → 16
  ✓ iⁱ = e^(−π/2)  → 0.2078795764 (atteso 0.20787957635076193 ± 1e-14)
  ✓ (3 + 4i)/(1 − 2i) = −1 + 2i  → −1 + 2i
  ✓ le radici cubiche dell’unità sommano a 0  → 3.140184917e-16 (atteso 0 ± 1e-14)
  ✓ fenomeno di Gibbs: massimo della somma dell’onda quadra → 1,1790  → 1.17895689 (atteso 1.178979744 ± 0.001)
  ✓ onda quadra: b₁ numerico = 4/π  → 1.273239545 (atteso 1.2732395447351628 ± 1e-8)
  ✓ f = x²: aₙ = 4(−1)ⁿ/n²  → -4,1,-0.444444
  ✓ Parseval per l’onda quadra: Σ bₙ² = (1/π)∫f² = 2  → 1.999959476 (atteso 2 ± 0.0001)

── Statistica di laboratorio ──
  ✓ t(0,975; 9) = 2,262  → 2.262157163 (atteso 2.262 ± 0.0005)
  ✓ t(0,975; 4) = 2,776  → 2.776445105 (atteso 2.776 ± 0.0005)
  ✓ t(0,975; 1) = 12,706  → 12.70620474 (atteso 12.706 ± 0.001)
  ✓ F(0,975; 4, 4) = 9,605  → 9.604529885 (atteso 9.605 ± 0.001)
  ✓ Grubbs critico n = 10 (95 %, due code) = 2,290  → 2.289954084 (atteso 2.29 ± 0.001)
  ✓ Grubbs critico n = 5 = 1,715  → 1.715037312 (atteso 1.715 ± 0.001)
  ✓ Grubbs e Dixon segnalano 10,48  → 10.48 10.48
  ✓ Miller & Miller: pendenza 1,93  → 1.930357143 (atteso 1.9304 ± 0.0001)
  ✓   · intercetta 1,52  → 1.517857143 (atteso 1.5179 ± 0.0001)
  ✓   · s_y/x 0,4329  → 0.4328477132 (atteso 0.4329 ± 0.0001)
  ✓   · r 0,9989  → 0.9988795653 (atteso 0.9989 ± 0.0001)
  ✓   · y₀ = 2,9 → x₀ = 0,72  → 0.7160037003 (atteso 0.716 ± 0.001)
  ✓   · s(x₀) = 0,26  → 0.264569771 (atteso 0.265 ± 0.002)
  ✓   · y₀ = 13,5 → x₀ = 6,21 ± 0,24  → 0.2397542227 (atteso 0.24 ± 0.002)
  ✓ propagazione: molarità 0,04005 M  → 0.04005484282 (atteso 0.040055 ± 0.000001)
  ✓   · u dalle derivate = u del Monte Carlo (entro il 5 %)  → 1.013863448 (atteso 1 ± 0.05)
  ✓ t a un campione: 98,7 contro 100 è significativo (p < 0,05)  → true

── Nel browser ──
── schermo grande ──
  ✓ la categoria 📐 Matematica c’è  → true
  ✓   · e il suo pannello si apre  → flex
  ✓   · con le otto sezioni  → 8
  ✓ scrivendo x³·ln x la sezione dà f′ = 3x²·ln(x) + x²  → true
  ✓ smatbasi: si apre, ogni scheda disegna, nessun avviso  → true
  ✓ smatfunz: si apre, ogni scheda disegna, nessun avviso  → true
  ✓ smatcalc: si apre, ogni scheda disegna, nessun avviso  → true
  ✓ smatlin: si apre, ogni scheda disegna, nessun avviso  → true
  ✓ smatode: si apre, ogni scheda disegna, nessun avviso  → true
  ✓ smatmulti: si apre, ogni scheda disegna, nessun avviso  → true
  ✓ smatcompl: si apre, ogni scheda disegna, nessun avviso  → true
  ✓ smatstat: si apre, ogni scheda disegna, nessun avviso  → true
  ✓ nessun errore JavaScript  → 0
── telefono ──
  ✓ smatbasi: si apre, ogni scheda disegna, nessun avviso  → true
  ✓   · a 390 px niente sborda  → 0
  ✓ smatfunz: si apre, ogni scheda disegna, nessun avviso  → true
  ✓   · a 390 px niente sborda  → 0
  ✓ smatcalc: si apre, ogni scheda disegna, nessun avviso  → true
  ✓   · a 390 px niente sborda  → 0
  ✓ smatlin: si apre, ogni scheda disegna, nessun avviso  → true
  ✓   · a 390 px niente sborda  → 0
  ✓ smatode: si apre, ogni scheda disegna, nessun avviso  → true
  ✓   · a 390 px niente sborda  → 0
  ✓ smatmulti: si apre, ogni scheda disegna, nessun avviso  → true
  ✓   · a 390 px niente sborda  → 0
  ✓ smatcompl: si apre, ogni scheda disegna, nessun avviso  → true
  ✓   · a 390 px niente sborda  → 0
  ✓ smatstat: si apre, ogni scheda disegna, nessun avviso  → true
  ✓   · a 390 px niente sborda  → 0
  ✓ nessun errore JavaScript  → 0
  ✓ in inglese la categoria si chiama «Mathematics»  → 📐 Mathematics
  ✓   · e la statistica «Laboratory statistics»  → 📏 Laboratory statistics

154 controlli passati
```

</details>

<details>
<summary><code>test_esami</code> — SUPERATO (codice di uscita 0)</summary>

```
── Matematica I ──
  ✓ dominio √(4 − x²)  → [−2, 2]
  ✓ dominio ln(x² − 1)  → (−∞, −1) ∪ (1, +∞)
  ✓ dominio 1/(x² − 3x + 2)  → (−∞, 1) ∪ (1, 2) ∪ (2, +∞)
  ✓ dominio √((x − 1)/(x + 2))  → (−∞, −2) ∪ [1, +∞)
  ✓ dominio arcsin(2x − 1)  → [0, 1]
  ✓ dominio ln(ln x)  → (1, +∞)
  ✓ dominio x·e^(−x): ℝ (il trabocco numerico per x → −∞ non toglie punti)  → ℝ
  ✓ dominio eˣ/x  → (−∞, 0) ∪ (0, +∞)
  ✓ dominio x^(1/3)/(x − 1): la radice cubica esiste anche per x < 0  → (−∞, 1) ∪ (1, +∞)
  ✓ dominio x·ln x  → (0, +∞)
  ✓ lim (x³ + 1)/(x + 1) in −1 (0/0)  → 3
  ✓ lim (1 − cos x)/x²  → 1/2
  ✓ lim (sin x − x)/x³ (SymPy: −1/6)  → −1/6
  ✓ lim (eˣ − 1 − x)/x²  → 1/2
  ✓ lim (1 + 2/x)ˣ a +∞ (SymPy: e²)  → e²
  ✓ lim (2x² + 1)/(3x² − x) a ∞  → 2/3
  ✓ lim x·ln x in 0⁺  → 0
  ✓ lim 1/(x − 2) in 2: non esiste, −∞ e +∞  → true
  ✓ il limite 0/0 mostra gli sviluppi di Taylor  → true
  ✓ studio (x² + 1)/(x² − 1): asintoti verticali ±1 e orizzontale 1  → true
  ✓   · massimo relativo in (0, −1)  → true
  ✓   · f′ in forma razionale −4x/(x² − 1)²  → true
  ✓ studio x·e^(−x): massimo in x = 1, flesso in x = 2  → true
  ✓ ∫ (x + 3)/(x² − x − 2) (SymPy)  → 5·ln(|x − 2|)/3 − 2·ln(|x + 1|)/3 + c
  ✓ ∫ (2x + 1)/(x² + 2x + 5) (SymPy)  → −atan(x/2 + 1/2)/2 + ln(x² + 2x + 5) + c
  ✓ ∫ 1/((x − 1)²(x + 1)): radice doppia  → −1/(2(x − 1)) − ln(|x − 1|)/4 + ln(|x + 1|)/4 + c
  ✓ ∫ x·arctg x (SymPy)  → x²·atan(x)/2 − x/2 + atan(x)/2 + c
  ✓ ∫ eˣ cos x (ciclico, SymPy)  → e^x·(cos(x) + sin(x))/2 + c
  ✓ ∫ ln² x  → x·ln(x)² − 2x·ln(x) + 2x + c
  ✓ ∫ x²eˣ: lo svolgimento nomina l’integrazione per parti  → true
  ✓ ∫ 2x·cos(x²): lo svolgimento nomina la sostituzione u = x²  → true
  ✓ ∫ fratti: lo svolgimento mostra A = −2/3, B = 5/3  → true
  ✓ ∫ e^(−x²) dx: nessuna primitiva elementare  → null
  ✓ ∫₀^∞ x e^(−x) dx (SymPy: 1)  → 1
  ✓ ∫₀¹ ln x dx (SymPy: −1)  → −1
  ✓ ∫₋∞^∞ 1/(1 + x²) dx = π  → π
  ✓ ∫₀¹ 1/√x dx = 2  → 2
  ✓ ∫₁^∞ 1/x dx diverge  → true
  ✓ Taylor di eˣ sin x al 5° ordine (SymPy)  → x + x² + (1/3)·x³ − (1/30)·x⁵
  ✓ Taylor di ln x in 1  → (x − 1) − (1/2)·(x − 1)² + (1/3)·(x − 1)³ − (1/4)·(x − 1)⁴
  ✓ complessi: z³ = 8i  → √3 + i; −√3 + i; −2i
  ✓ complessi: (1 + i)⁸ = 16  → 16
  ✓ complessi: z² + 2z + 5 = 0  → −1 − 2i; −1 + 2i

── Matematica II ──
  ✓ Σ n!/nⁿ converge (rapporto 1/e)  → converge
  ✓ Σ 2ⁿ/n! converge  → converge
  ✓ Σ 1/n diverge  → diverge
  ✓ Σ 1/n² converge  → converge
  ✓ Σ (−1)ⁿ/n converge semplicemente  → semplice
  ✓ Σ (−1)ⁿ/n² converge assolutamente  → assoluta
  ✓ Σ 1/(n ln n) diverge (caso critico)  → diverge
  ✓ Σ (2n)!/((n!)²4ⁿ) ~ 1/√(πn) diverge  → diverge
  ✓ Σ (n/(n + 1))ⁿ: aₙ → 1/e, diverge  → diverge
  ✓ Σ cos n/n² converge assolutamente  → assoluta
  ✓ Σ (2/3)ⁿ da 1: somma geometrica 2  → 2 (atteso 2 ± 1e-12)
  ✓ Σ xⁿ/n: [−1, 1)  → [−1, 1)
  ✓ Σ xⁿ/(n3ⁿ): [−3, 3)  → [−3, 3)
  ✓ Σ xⁿ/n²: [−1, 1]  → [−1, 1]
  ✓ Σ n2ⁿxⁿ: (−1/2, 1/2)  → (−1/2, 1/2)
  ✓ x³ − 3xy + y³: sella in (0,0), minimo in (1,1)  → sella (0, 0); minimo (1, 1)
  ✓   · derivata direzionale in (1,2) lungo (3,4) = (−3·3 + 9·4)/5  → 5.4 (atteso 5.4 ± 1e-12)
  ✓ max/min di x² + y² − 2x su [0,2]×[−1,1]  → max 1, min −1
  ✓ max/min di xy sul disco unitario  → max 1/2, min −1/2
  ✓ max/min di x² − xy + y sul triangolo (0,0),(2,0),(0,2)  → max 4, min 0
  ✓ ∬ xy, x² ≤ y ≤ x (SymPy: 1/24)  → 1/24
  ✓ ∬ (x² + y²) sul disco unitario in polari = π/2  → π/2
  ✓ ∬ (x + y), y ≤ x ≤ 1 (normale rispetto a y)  → 1/2
  ✓ ω = (2xy + 1)dx + (x² + 3y²)dy è chiusa, ∫ = U(1,1) − U(0,0) = 3  → true
  ✓ −y dx + x dy non è chiusa, sul cerchio ∫ = 2π  → true
  ✓ y′ + 2y = eˣ, y(0) = 1 (SymPy)  → 2·e^(−2x)/3 + e^x/3
  ✓ y′ + y/x = x², y(1) = 0 (SymPy)  → x³/4 − 1/(4x)
  ✓ y′ = xy, y(0) = 2  → y = 2·e^(x²/2)
  ✓ y′ = y², y(0) = 1  → y = −1/(x − 1)
  ✓ y′ = 2x(1 + y²), y(0) = 0  → y = tan(x²)
  ✓ y″ − 3y′ + 2y = eˣ, Cauchy (SymPy, risonanza)  → −x·e^x + 2·e^(2x) − 2·e^x
  ✓ y″ + 4y = sin 2x, Cauchy (SymPy, risonanza)  → −x·cos(2x)/4 + sin(2x)/8
  ✓ y″ + 2y′ + y = x²: soluzione particolare x² − 4x + 6  → true
  ✓ y″ − 2y′ + y = eˣ: radice doppia, y_p = x²eˣ/2  → true
  ✓ y″ + 2y′ + 5y = 0, y(0) = 1, y′(0) = 0  → cos(2x)·e^(−x) + e^(−x)·sin(2x)/2
  ✓ tutti gli esercizi degli appelli svolti di Matematica hanno uno svolgimento  → 64
  ✓   · e sono almeno 60  → true

── Fisica ──
  ✓ proiettile da terra: R = v₀² sin 2θ/g  → 62.74259385 (atteso 62.742593846343524 ± 1e-9)
  ✓ caduta: velocità d’impatto √(v₀² + 2gh)  → 22.19008788 (atteso 22.190087877248256 ± 1e-9)
  ✓ piano inclinato: a = g(sin θ − μ cos θ)  → 2.356287237 (atteso 2.3562872366623964 ± 1e-9)
  ✓ piano inclinato a 25° con μs = 0,5: resta fermo  → 0
  ✓ Atwood: a = (m₂ − m₁)g/(m₁ + m₂)  → 1.962 (atteso 1.9620000000000002 ± 1e-12)
  ✓ urto elastico: energia cinetica conservata  → 18 (atteso 18 ± 1e-9)
  ✓ urto anelastico: quantità di moto conservata  → 3.5 (atteso 3.5 ± 1e-12)
  ✓ orbita geostazionaria: periodo ≈ giorno siderale (86164 s)  → 86166.72261 (atteso 86164 ± 30)
  ✓ rotolamento della sfera: v = √(10gh/7)  → 4.584913148 (atteso 4.584913147642883 ± 1e-12)
  ✓ giro della morte: h = 5R/2  → 5 (atteso 5 ± 1e-12)
  ✓ Torricelli: v = √(2gh)  → 6.264183905 (atteso 6.26418390534633 ± 1e-12)
  ✓ Venturi: la portata si conserva (A₂v₂ = A₁v₁)  → 0.02 (atteso 0.02 ± 1e-12)
  ✓ isoterma: L = nRT ln 3  → 2740.311242 (atteso 2740.311241741927 ± 1e-9)
  ✓ isobara: Q − L = ΔU (primo principio)  → 4157.231309 (atteso 4157.231309 ± 1e-9)
  ✓ adiabatica: T V^(γ−1) costante (γ = 7/5)  → 62.73837316 (atteso 62.73837315547639 ± 1e-9)
  ✓ Carnot fra 500 e 300 K: η = 0,4  → 0.4 (atteso 0.4 ± 1e-12)
  ✓ calorimetria: acqua 0,2 kg a 80 °C + 0,3 kg a 20 °C → 44 °C  → 317 (atteso 317 ± 1e-9)
  ✓   · ΔS del mescolamento > 0  → true
  ✓ ghiaccio: 50 g in 300 g a 40 °C → 22,9 °C (bilancio a mano)  → 22.90423862 (atteso 22.904238618524335 ± 1e-9)
  ✓ Coulomb: 3 μC e −5 μC a 20 cm → 3,37 N  → 3.370331922 (atteso 3.3703319221124994 ± 0.001)
  ✓ Gauss: sfera uniforme dentro, E = kQr/R³  → 561.721987 (atteso 561.7219870187499 ± 0.001)
  ✓ condensatore piano: C = ε₀A/d  → 1.770837563e-10 (atteso 1.77083756256e-10 ± 1e-20)
  ✓ Kirchhoff: I₁ con la regola di Cramer  → 1.363636364 (atteso 1.3636363636363635 ± 1e-12)
  ✓   · nodo: I₃ = I₁ + I₂  → 1.090909091 (atteso 1.0909090909090908 ± 1e-12)
  ✓ RC: dopo τ la carica è Cℰ(1 − 1/e)  → 0.0005689085029 (atteso 0.0005689085029457019 ± 1e-12)
  ✓ protone in 0,5 T a 2·10⁶ m/s: r = mv/qB  → 0.04177278402 (atteso 0.041772784019975036 ± 1e-12)
  ✓ filo: B = μ₀I/(2πd) = 2·10⁻⁷·I/d  → 0.00004 (atteso 0.000039999999999999996 ± 1e-15)
  ✓ barretta: P meccanica = ℰ²/R  → 0.18 (atteso 0.18 ± 1e-12)
  ✓ RL: dopo τ la corrente è (ℰ/R)(1 − 1/e)  → 0.7585446706 (atteso 0.7585446705942692 ± 1e-12)
  ✓ Snell: angolo limite vetro-aria arcsin(1/1,5)  → 41.8103149 (atteso 41.810314895778596 ± 1e-9)
  ✓ lente: f = 10, p = 15 → q = 30 cm  → 30 (atteso 30 ± 1e-9)
  ✓ Malus: 100 W/m² non polarizzati, 60° → 12,5  → 12.5 (atteso 12.5 ± 1e-12)
  ✓ tutte le prove svolte di Fisica hanno uno svolgimento  → 36
  ✓ ogni modello del risolutore funziona con i dati predefiniti  → 85
  ✓   · i modelli sono almeno 45  → true

── Matematica avanzata ──
  ✓ autovalori di tridiag(−1, 2, −1): 2, 2 ∓ √2  → 2, 2 − √2, 2 + √2
  ✓ [2 1; 0 2] non è diagonalizzabile  → false
  ✓ x′ = x + 2y, y′ = 2x + y, X(0) = (1, 0): x = (e^(3t) + e^(−t))/2  → true
  ✓ sistema con autovalori −1 ± 2i: fuoco stabile, x = e^(−t)cos 2t  → true
  ✓ autovalore doppio −1: x = (1 + t)e^(−t)  → true
  ✓ Fourier di x: bₙ = 2(−1)ⁿ⁺¹/n  → true
  ✓ Fourier di |x|: a₁ = −4/π, a₂ = 0  → true
  ✓ ℒ{t e^(−t)} = 1/(s + 1)²  → 1/(s + 1)²
  ✓ ℒ{e^(−t) sin 2t} = 2/(s² + 2s + 5)  → 2/(s² + 2s + 5)
  ✓ ℒ{cos t} = s/(s² + 1)  → s/(s² + 1)
  ✓ volume della sfera unitaria in sferiche: 4π/3  → 4π/3
  ✓ ∭ r² sulla sfera unitaria = 4π/5  → 4π/5
  ✓ ∭ xyz sul parallelepipedo [0,1]×[0,2]×[0,3] = 9/2  → 9/2
  ✓ gli appelli avanzati di matematica hanno tutti uno svolgimento  → 16

── Fisica avanzata ──
  ✓ oscillatore forzato: ampiezza (F₀/m)/√((ω₀² − ω²)² + (2γω)²)  → 0.019104018 (atteso 0.019104017997521754 ± 1e-12)
  ✓ corda: f₁ = √(T/μ)/(2L)  → 97.30085108 (atteso 97.30085108210397 ± 1e-9)
  ✓ fotoelettrico: soglia hc/W con W = 4,3 eV ≈ 288,3 nm  → 288.3353442 (atteso 288.3353441860465 ± 0.000001)
  ✓ Compton a 90°: Δλ = λ_C = 2,426 pm  → 2.42631 (atteso 2.42631 ± 0.00001)
  ✓ relatività a 0,8c: γ = 5/3  → 1.666666667 (atteso 1.6666666666666667 ± 1e-12)
  ✓ Wien: Sole a 5778 K, λ_max ≈ 501,5 nm  → 501.5181646 (atteso 501.5 ± 0.1)
  ✓ scatola di 1 nm: E₁ = 0,376 eV  → 0.3760460023 (atteso 0.376 ± 0.001)
  ✓ tunnel 5 eV contro 10 eV, 0,5 nm: T ≈ 4,24·10⁻⁵  → 0.00004235275923 (atteso 0.000042353 ± 1e-8)
  ✓ le prove avanzate di fisica hanno tutte uno svolgimento  → 9

── Chimica ──
  ✓ massa molare di Ca₃(PO₄)₂ = 310,18 g/mol  → 310.174 (atteso 310.18 ± 0.01)
  ✓ formula minima e molecolare del glucosio da C 40,0 H 6,71 O 53,29  → formula minima CH₂O|formula molecolare C₆H₁₂O₆
  ✓ 2Al + 3Cl₂ → 2AlCl₃ con 10 g Al e 30 g Cl₂: limitante Cl₂  → true
  ✓   · massa teorica di AlCl₃ = (30/70,90)·(2/3)·133,33  → 37.6112835 (atteso 37.61071932299012 ± 0.01)
  ✓ equilibrio A + B ⇌ 2C, K = 49, 0,5 M: [C] = 7/9 M  → 0.7777777778 (atteso 0.7777777777777778 ± 0.000001)
  ✓ pH di acido acetico 0,1 M (formula risolutiva)  → 2.875277062 (atteso 2.8752770615501357 ± 1e-9)
  ✓ pH di HCl 10⁻⁸ M: 6,98 (non 8!)  → 6.978294314 (atteso 6.978 ± 0.001)
  ✓ tampone acetato equimolare: pH = pK_a  → 4.76 (atteso 4.76 ± 1e-12)
  ✓ solubilità di AgCl: √K_sp  → 0.00001341640786 (atteso 0.000013416407864998738 ± 1e-15)
  ✓ Ag₂CrO₄: s = (K_sp/4)^(1/3)  → 0.00006502957234 (atteso 0.00006502957234256938 ± 1e-15)
  ✓ pila Daniell: E° = 1,10 V  → 1.1 (atteso 1.1 ± 1e-12)
  ✓ elettrolisi: 2 A per 30 min depositano 1,186 g di Cu  → 1.185494183 (atteso 1.1854941832789745 ± 1e-9)
  ✓ riga Hα (3 → 2): 656 nm  → 656.1122824 (atteso 656.1 ± 0.2)
  ✓ ΔH° di combustione del metano = −890,3 kJ/mol (Hess)  → -890.3 (atteso -890.3 ± 1e-9)
  ✓ titolazione: alla semi-equivalenza pH = pK_a  → 4.745196013 (atteso 4.7447274948966935 ± 0.002)
  ✓   · pH al punto equivalente ≈ 8,72  → 8.72182586 (atteso 8.72 ± 0.01)
  ✓ H₃PO₄ 0,1 M, bilancio di carica: pH ≈ 1,62  → 1.621752175 (atteso 1.62 ± 0.01)
  ✓ gravimetria: 0,4668 g di BaSO₄ → S 6,41 %  → 6.412384633 (atteso 6.412549490101981 ± 0.01)
  ✓ rotore HCl: B ≈ 10,59 cm⁻¹  → 10.58418271 (atteso 10.59 ± 0.02)
  ✓ Sackur-Tetrode: S°(Ar) = 154,8 J/(mol·K)  → 154.8456597 (atteso 154.8 ± 0.2)
  ✓ Pourbaix: E(O₂) a pH 0 e 1 bar = 1,229 V  → 1.229 (atteso 1.229 ± 1e-9)
  ✓ Debye-Hückel: forza ionica di NaCl 0,05 + MgSO₄ 0,01 = 0,09 M  → 0.09 (atteso 0.09 ± 1e-12)
  ✓ tutte le prove svolte di chimica hanno uno svolgimento  → 37
  ✓ ogni modello di chimica funziona con i dati predefiniti  → 53
  ✓   · su quattro livelli, almeno 40 modelli  → true

── Astrofisica, nucleare, quantistica, dottorato ──
  ✓ Sirio A: L ≈ 25,7 L☉ da R = 1,71 R☉, T = 9940 K  → 25.71765918 (atteso 25.7 ± 0.3)
  ✓ Proxima: 768,5 mas → 1,301 pc  → 1.301236174 (atteso 1.3012 ± 0.001)
  ✓ Keplero: 1 anno a 1 UA → 1 massa solare  → 1.988574364e+30 (atteso 1.989e+30 ± 5e+27)
  ✓ Keplero: Giove (11,86 anni, 5,2 UA) → 1 M☉  → 1.987170474e+30 (atteso 1.989e+30 ± 2e+28)
  ✓ Schwarzschild: 10 M☉ → 29,5 km  → 29532.06634 (atteso 29532 ± 10)
  ✓ Terra senza effetto serra: 255 K  → 254.5857729 (atteso 254.6 ± 0.5)
  ✓ Hubble: Hα a 689,2 nm → z = 0,0502  → 0.05016151643 (atteso 0.05016 ± 0.0001)
  ✓ ⁵⁶Fe: B/A = 8,790 MeV dal difetto di massa  → 8.790349804 (atteso 8.79 ± 0.002)
  ✓ ²³⁵U: B/A = 7,591 MeV  → 7.590909205 (atteso 7.591 ± 0.002)
  ✓ D + T → ⁴He + n: Q = 17,59 MeV  → 17.58940309 (atteso 17.59 ± 0.01)
  ✓ ¹³¹I, 1 μg: A₀ = 4,6·10⁹ Bq  → 4598508113 (atteso 4600000000 ± 20000000)
  ✓ ¹⁴C al 25 %: due tempi di dimezzamento = 11460 anni  → 11460 (atteso 11460 ± 0.000001)
  ✓ nucleo: densità ≈ 2,3·10¹⁷ kg/m³ (indipendente da A)  → 229412327000000000 (atteso 229412326950166620 ± 10000000000)
  ✓ idrogeno 2p: ⟨r⟩ = 5a₀ = 264,6 pm  → 264.5885 (atteso 264.59 ± 0.01)
  ✓ idrogeno n = 2: E = −3,40 eV  → -3.40142325 (atteso -3.4014 ± 0.001)
  ✓ Larmor: 9,4 T → 400,2 MHz per ¹H  → 400.2282932 (atteso 400.23 ± 0.01)
  ✓ scatola 1D stato fondamentale: ΔxΔp/ħ = 0,568  → 0.5678618084 (atteso 0.5679 ± 0.001)
  ✓ elio variazionale: ζ = 27/16, E = −77,49 eV  → -77.48867341 (atteso -77.49 ± 0.01)
  ✓ perturbazione al secondo ordine = spostamento esatto −q²E²/2k  → -0.0001602176634 (atteso -0.00016021766340000001 ± 1e-12)
  ✓ tutte le prove di astrofisica, nucleare e quantistica hanno uno svolgimento  → 21
  ✓ Marcus: ΔG‡ = (λ + ΔG°)²/4λ = 0,0625 eV  → 0.0625 (atteso 0.0625 ± 1e-12)
  ✓ KIE C–H/C–D ≈ 6,4 a 298 K  → 6.424178838 (atteso 6.4 ± 0.2)
  ✓ DBE dell’aspirina C₉H₈O₄ = 6  → 6 (atteso 6 ± 1e-12)
  ✓ punto isoelettrico della lisina = 9,74  → 9.74 (atteso 9.74 ± 1e-9)
  ✓ estrazione: 4 × 25 mL con K_D = 4 lascia il 6,25 %  → 0.0625 (atteso 0.0625 ± 1e-12)
  ✓ Cl₂: rapporto M+2/M = 2·0,2424/0,7576  → 0.6399155227 (atteso 0.6399155227032735 ± 1e-9)
  ✓ ∫ 1/(x⁴ + 1) con i residui = π/√2  → √2/2·π
  ✓ ∫ 1/((x² + 1)(x² + 4)) = π/6  → 1/6·π
  ✓ equazione del calore con u(x,0) = sin x: u = e^(−αt) sin x  → 0.6050112923 (atteso 0.6050112922850016 ± 1e-8)
  ✓ equazione del calore con u(x,0) = x(π − x): bₙ = 8/(πn³) per n dispari  → 2.546479089 (atteso 2.5464790894703255 ± 1e-8)
  ✓ i percorsi coprono quattro livelli per chimica, fisica e matematica  → true

── Chimica fisica ──
  ✓ Tafel: α anodico ritrovato (0,4)  → 0.4004668771 (atteso 0.4 ± 0.002)
  ✓ Tafel: i₀ ritrovata (2·10⁻⁶)  → 0.000001990145913 (atteso 0.000002 ± 2e-8)
  ✓ Tafel: pendenza anodica 2,303RT/(αF) = 147,8 mV/dec  → 147.7259496 (atteso 147.89836824116156 ± 0.5)
  ✓ Eyring: ΔH‡ ritrovato (70 kJ/mol)  → 70000 (atteso 70000 ± 0.000001)
  ✓ Eyring: ΔS‡ ritrovato (−50 J/(mol·K))  → -50 (atteso -50 ± 1e-8)
  ✓ Eyring: Eₐ = ΔH‡ + RT medio  → 72558.50616 (atteso 72577.48341158 ± 60)
  ✓ Eyring: k(80 kJ/mol, 298 K) = 0,05996 s⁻¹  → 0.05996094109 (atteso 0.05996 ± 0.0001)
  ✓ BET: n_m ritrovato (1,000 mmol/g)  → 0.9997678896 (atteso 1 ± 0.002)
  ✓ BET: c ritrovato (100)  → 100.1635669 (atteso 100 ± 1)
  ✓ BET: area = n_m N_A σ = 97,6 m²/g  → 97.53603593 (atteso 97.558680312 ± 0.3)
  ✓ BET usa solo 0,05 ≤ P/P₀ ≤ 0,35  → 7
  ✓ Langmuir: n_m = 1,6  → 1.59977616 (atteso 1.6 ± 0.002)
  ✓ Langmuir: K = 0,05 kPa⁻¹  → 0.05001363435 (atteso 0.05 ± 0.0002)
  ✓ Mn a mano = 320000/11  → 29090.90909 (atteso 29090.909090909092 ± 0.000001)
  ✓ Mw a mano = 1,06·10¹⁰/320000  → 33125 (atteso 33125 ± 0.000001)
  ✓ Carothers p = 0,99: X̄n = 100, Đ = 1,99  → 100 (atteso 100 ± 1e-9)
  ✓ fotofisica: le rese da S₁ sommano a 1  → 1 (atteso 1 ± 1e-12)
  ✓ Stern-Volmer: K_SV dai dati ≈ 101,7 M⁻¹  → 101.7142857 (atteso 101.714 ± 0.01)

── Nel browser ──
── schermo grande ──
  ✓ selettrodi: ogni scheda ha contenuto, nessun avviso, le tele disegnano  → true
  ✓ sfotosup: ogni scheda ha contenuto, nessun avviso, le tele disegnano  → true
  ✓ sfisesame: ogni scheda ha contenuto, nessun avviso, le tele disegnano  → true
  ✓ smatesame: ogni scheda ha contenuto, nessun avviso, le tele disegnano  → true
  ✓ schiesame: ogni scheda ha contenuto, nessun avviso, le tele disegnano  → true
  ✓ spercorsi: ogni scheda ha contenuto, nessun avviso, le tele disegnano  → true
  ✓ un appello di matematica mostra lo svolgimento  → true
  ✓ il risolutore di fisica rifà i conti con il dato nuovo  → true
  ✓ nessun errore JavaScript  → 0
── telefono ──
  ✓ selettrodi: ogni scheda ha contenuto, nessun avviso, le tele disegnano  → true
  ✓   · a 390 px niente sborda  → 0
  ✓ sfotosup: ogni scheda ha contenuto, nessun avviso, le tele disegnano  → true
  ✓   · a 390 px niente sborda  → 0
  ✓ sfisesame: ogni scheda ha contenuto, nessun avviso, le tele disegnano  → true
  ✓   · a 390 px niente sborda  → 0
  ✓ smatesame: ogni scheda ha contenuto, nessun avviso, le tele disegnano  → true
  ✓   · a 390 px niente sborda  → 0
  ✓ schiesame: ogni scheda ha contenuto, nessun avviso, le tele disegnano  → true
  ✓   · a 390 px niente sborda  → 0
  ✓ spercorsi: ogni scheda ha contenuto, nessun avviso, le tele disegnano  → true
  ✓   · a 390 px niente sborda  → 0
  ✓ nessun errore JavaScript  → 0
  ✓ in inglese: «Chemistry exam», «Mathematics exam», «Physics exam», «Electrodes and transition state»  → 🎓 Chemistry exam (UniBA)|🎓 Mathematics exam (UniBA)|🎓 Physics exam (UniBA)|⚡ Electrodes and transition state

235 controlli passati
```

</details>

<details>
<summary><code>test_assistente</code> — SUPERATO (codice di uscita 0)</summary>

```
── Il motore simbolico: le aggiunte (ogni primitiva e' verificata derivando) ──
  ✓ ∫ sin(x)^2 dx: esiste e la sua derivata ridà la funzione  → true
  ✓ ∫ cos(3x)^2 dx: esiste e la sua derivata ridà la funzione  → true
  ✓ ∫ sin(x)^4 dx: esiste e la sua derivata ridà la funzione  → true
  ✓ ∫ sin(x)^3 dx: esiste e la sua derivata ridà la funzione  → true
  ✓ ∫ cos(x)^5 dx: esiste e la sua derivata ridà la funzione  → true
  ✓ ∫ sin(3x)*cos(2x) dx: esiste e la sua derivata ridà la funzione  → true
  ✓ ∫ sin(x)*sin(2x) dx: esiste e la sua derivata ridà la funzione  → true
  ✓ ∫ cos(x)*cos(4x) dx: esiste e la sua derivata ridà la funzione  → true
  ✓ ∫ sin(x)^2*cos(x)^2 dx: esiste e la sua derivata ridà la funzione  → true
  ✓ ∫ x*sin(x)^2 dx: esiste e la sua derivata ridà la funzione  → true
  ✓ ∫ sin(2x)^2*cos(x) dx: esiste e la sua derivata ridà la funzione  → true
  ✓ ∫ sin²x dx = x/2 − sin(2x)/4  → x/2 − sin(2x)/4
  ✓ ∫ sin³x dx = cos³x/3 − cos x  → cos(x)³/3 − cos(x)
  ✓ e^(−ln x) = 1/x  → 1/x
  ✓ e^(2 ln x + x) = x²·eˣ  → x²·e^x
  ✓ e^(ln(x)/2) = √x  → √x

── Matematica: domande in linguaggio naturale ──
  ✓ «studia la funzione…» → studio di funzione  → studio
  ✓ ∫₀¹ x·eˣ dx = 1  → integraleDefinito|1
  ✓ ∫₀³ x² dx = 9  → 9
  ✓ in inglese: ∫ e^(−x²) su ℝ ≈ √π = 1,7724538509  → true
  ✓ ∫ sin²x dx (bisezione)  → x/2 − sin(2x)/4 + c
  ✓ ∫ 1/(x² − 1) dx (fratti semplici)  → ln(|x − 1|)/2 − ln(|x + 1|)/2 + c
  ✓ lim (sin x − x)/x³ = −1/6 (SymPy)  → −1/6
  ✓ «limite per x che tende a 0 di …» (ordine invertito)  → limite|1
  ✓ lim (1 + 1/x)^x per x → ∞ = e  → e
  ✓ d/dx x²·sin 3x  → 3x²·cos(3x) + 2x·sin(3x)
  ✓ d/dx ln(x² + 1)  → 2x/(x² + 1)
  ✓ in inglese: d/dx sin x cos x  → cos(x)² − sin(x)²
  ✓ y″ − 3y′ + 2y = eˣ, y(0)=0, y′(0)=1 (SymPy: 2e^{2x} − 2eˣ − x eˣ)  → −x·e^x + 2·e^(2x) − 2·e^x
  ✓ y″ + 4y = 0 → cos 2x  → cos(2x)
  ✓ termini sparsi nei due membri: 2y″ + 8y = sin x → particolare sin x/6  → c1·cos(2x) + c2·sin(2x) + sin(x)/6
  ✓ y′ + 2y = 4, y(0) = 0 → 2 − 2e^(−2x)  → −2·e^(−2x) + 2
  ✓ x·y′ = y + x² (lineare, fattore e^(−ln x) = 1/x)  → x² + c·x
  ✓ y′ = xy, y(0) = 1 → e^(x²/2)  → separabile|y = e^(x²/2)
  ✓ dy/dx = y² (separabile)  → y = −1/(c + x)
  ✓ «risolvi l'equazione y″ − y = x»: riconosciuta come EDO  → secondoOrdine
  ✓ Σ n!/nⁿ converge (rapporto → 1/e)  → converge
  ✓ Σ 1/n² converge  → converge
  ✓ Σ xⁿ/n: insieme di convergenza [−1, 1)  → seriePotenze|[−1, 1)
  ✓ autovalori di [[2,1],[1,2]] (la virgola separa, non è decimale)  → 1, 3
  ✓ autovalori di [[4,1],[2,3]]  → 2, 5
  ✓ x³ − 6x² + 11x − 6 = 0  → 1; 2; 3
  ✓ z³ = 8: tre radici  → 2; −1 + √3i; −1 − √3i
  ✓ Taylor di eˣ sin x al quinto ordine (SymPy)  → x + x² + (1/3)·x³ − (1/30)·x⁵
  ✓ ∫ 1/(x⁴ + 1) su ℝ = π/√2 con i residui  → √2/2·π
  ✓ L{t e^{2t}} = 1/(s − 2)²  → 1/(s − 2)²
  ✓ dominio √(4 − x²)/ln x  → [0, 1) ∪ (1, 2]
  ✓ (x² − 1)/(x − 1) = x + 1 (MCD di Euclide)  → x + 1
  ✓ (x² − 1)/(x − 1)² = (x + 1)/(x − 1)  → (x + 1)/(x − 1)
  ✓ un numero: 2¹⁰  → 1024

── Fisica: modello scelto, dati letti, risultato rifatto per altra via ──
  ✓ proiettile  → proiettile
  ✓ gittata = v₀² sin 2θ / g  → 62.74259385 (atteso 62.74259385 ± 0.000001)
  ✓ in inglese: «a ball is launched…» → proiettile  → proiettile
  ✓ gittata a 45°: v₀²/g  → 91.74311927 (atteso 91.74311927 ± 0.000001)
  ✓ «frena»: accelerazione negativa e tempo fino all'arresto  → mua|-5|5
  ✓ 90 km/h = 25 m/s; spazio di arresto v²/2a = 62,5 m  → 62.5 (atteso 62.5 ± 1e-9)
  ✓ «cade»: velocità iniziale nulla  → 0
  ✓ tempo di caduta √(2h/g)  → 3.028912664 (atteso 3.028912664 ± 1e-9)
  ✓ piano inclinato  → piano
  ✓ a = g(sin θ − μ_d cos θ)  → 2.356287237 (atteso 2.356287237 ± 1e-9)
  ✓ pendolo  → pendolo
  ✓ T ≈ 2π√(L/g) (piccole oscillazioni, 10° di ampiezza: +0,19 %)  → 2.837006707 (atteso 2.837006707 ± 0.01)
  ✓ molla: T = 2π√(m/k)  → 0.3141592654 (atteso 0.3141592654 ± 1e-9)
  ✓ orbita  → orbita
  ✓ v = √(GM/r)  → 7672.317978 (atteso 7672.490413 ± 1)
  ✓ isobara, gas biatomico  → isobara|bi
  ✓ Q = n·(7/2)R·ΔT  → 5820.123833 (atteso 5820.123833 ± 0.5)
  ✓ Carnot: η = 1 − T₂/T₁  → 0.5 (atteso 0.5 ± 1e-12)
  ✓ μC convertiti nei nC del modello  → 3000|-5000
  ✓ due resistenze in parallelo: la terza non c'è  → parallelo
  ✓ R_eq = R₁R₂/(R₁ + R₂)  → 66.66666667 (atteso 66.66666667 ± 1e-9)
  ✓ «un elettrone»: carica e massa dell'elettrone  → lorentz|9.1093837e-31
  ✓ r = mv/(qB)  → 0.0005685630103 (atteso 0.0005685630103 ± 1e-9)
  ✓ lente: 1/q = 1/f − 1/p → 15 cm  → 15 (atteso 15 ± 1e-9)
  ✓ Young  → young
  ✓ interfrangia λL/d = 12 mm  → 0.012 (atteso 0.012 ± 1e-12)
  ✓ K = hc/λ − W  → 0.65936792 (atteso 0.65936792 ± 0.0001)
  ✓ f′ = f·v/(v − v_s)  → 547.9233227 (atteso 547.9233227 ± 0.000001)
  ✓ «0,8c» → relatività, β = 0,8  → relativita|0.8
  ✓ γ = 1/√(1 − β²) = 5/3  → 1.666666667 (atteso 1.666666667 ± 1e-12)
  ✓ «carbonio 14» non è un dato; 30 % → 0,3  → datazione|0.3
  ✓ t = t½·log₂(1/0,3)  → 9952.812855 (atteso 9952.812855 ± 0.000001)
  ✓ «10 masse solari»  → schwarzschild|10
  ✓ R_s = 2GM/c²  → 29532.06634 (atteso 29540.07736 ± 30)
  ✓ Sirio A: L/L☉ = (R/R☉)²(T/T☉)⁴ ≈ 25,7  → 25.71765918 (atteso 25.7 ± 0.3)
  ✓ ⁵⁶Fe: B/A = 8,79 MeV  → 8.790349804 (atteso 8.79 ± 0.002)
  ✓ elettrone in 1 nm: E₁ = h²/(8mL²) = 0,376 eV  → 0.3760460023 (atteso 0.37603 ± 0.001)

── Chimica ──
  ✓ «0,1 M» è una concentrazione (non 0,1 metri)  → acidodebole|0.1
  ✓ pH dall'equazione di secondo grado  → 2.875277062 (atteso 2.875277062 ± 0.001)
  ✓ acido forte  → phforte
  ✓ pH = 2  → 2 (atteso 2 ± 1e-9)
  ✓ base debole  → basedebole
  ✓ pOH dalla Kb, pH = 14 − pOH  → 11.27609122 (atteso 11.27609122 ± 0.002)
  ✓ tampone: le concentrazioni diventano moli su 1 L  → tampone|0.1|0.15
  ✓ Henderson-Hasselbalch  → 4.936091259 (atteso 4.936091259 ± 1e-9)
  ✓ reazione e masse lette dal testo  → Al + Cl2 -> AlCl3|Al: 10, Cl2: 30|AlCl3
  ✓ 2Al + 3Cl₂ → 2AlCl₃: limitante il cloro, AlCl₃ teorico = 30/70,906·(2/3)·133,34  → 37.6112835 (atteso 37.61035737 ± 0.05)
  ✓ M(Ca₃(PO₄)₂) = 310,17 g/mol  → 310.174 (atteso 310.17 ± 0.01)
  ✓ s = √Ksp  → 0.00001341640786 (atteso 0.00001341640786 ± 1e-12)
  ✓ E° = 0,34 − (−0,76) = 1,10 V  → 1.1 (atteso 1.1 ± 1e-12)
  ✓ tutti e cinque i dati dal testo  → titolazione|5
  ✓ a metà titolazione pH = pKa  → 4.745196013 (atteso 4.744727495 ± 0.002)
  ✓ la lista dei pKa letta per intero  → 2.19, 9.67, 4.25
  ✓ acido glutammico: pI = (2,19 + 4,25)/2  → 3.22 (atteso 3.22 ± 1e-9)
  ✓ paracetamolo: DBE = 5  → 5 (atteso 5 ± 1e-12)
  ✓ t½ = ln 2/k  → 13.86294361 (atteso 13.86294361 ± 1e-9)
  ✓ Eₐ = R ln(k₂/k₁)/(1/T₁ − 1/T₂)  → 64.23173452 (atteso 64.23173452 ± 0.01)
  ✓ combustione del metano: ΔH° = −890,3 kJ/mol  → -890.3 (atteso -890.3 ± 0.05)
  ✓ Beer-Lambert  → beer
  ✓ c = A/(εl)  → 0.00003333333333 (atteso 0.00003333333333 ± 1e-12)
  ✓ «2 A» è una corrente, «30 min» un tempo  → 2|30
  ✓ m = I·t·M/(nF)  → 1.185494183 (atteso 1.185494183 ± 0.001)
  ✓ n iniziale e finale da due «n =»  → 3|2
  ✓ Hα = 656 nm  → 656.1122824 (atteso 656.1 ± 0.3)
  ✓ glucosio: unità CH₂O = 30,03  → 30.026 (atteso 30.026 ± 0.01)
  ✓ resa = prodotto delle rese  → 32.844 (atteso 32.844 ± 1e-9)

── Il problema inverso ──
  ✓ si risolve per la massa del soluto  → soluzioni|calcolato
  ✓ m = c·V·M = 0,5·0,25·58,44  → 7.305 (atteso 7.305 ± 0.01)
  ✓ si risolve per la pressione  → calcolato
  ✓ p = nRT/V  → 4.92344196 (atteso 4.923444 ± 0.001)
  ✓ lo svolgimento dichiara il problema inverso  → true

── Unità e lettura dei numeri ──
  ✓ km/h, mL, μC, nm, eV  → v:25 V:0.000025 Q:0.000003 L:5e-7 eV:2.5
  ✓ M maiuscola = molare, m minuscola = metri  → c:0.1 L:0.1
  ✓ notazione scientifica: 1,8·10⁻⁵ e 6,02x10^23  → 0.000018|6.02e+23
  ✓ una domanda vuota non dà risposta  → true
  ✓ una domanda senza senso non inventa un modello  → true

── Nel browser ──
── schermo grande ──
  ✓ sareachim: c'è, è in testa alla sua categoria, ha tre schede  → true
  ✓ sareachim: l'assistente risponde con lo svolgimento  → true
  ✓ sareachim: il catalogo raccoglie gli strumenti della materia (81)  → true
  ✓ sareachim: la ricerca filtra (1)  → true
  ✓ sareachim: quattro livelli, dalle superiori al dottorato  → 4
  ✓ sareachim: i livelli portano alle sezioni (35 pulsanti)  → true
  ✓ sareafis: c'è, è in testa alla sua categoria, ha tre schede  → true
  ✓ sareafis: l'assistente risponde con lo svolgimento  → true
  ✓ sareafis: il catalogo raccoglie gli strumenti della materia (21)  → true
  ✓ sareafis: la ricerca filtra (1)  → true
  ✓ sareafis: quattro livelli, dalle superiori al dottorato  → 4
  ✓ sareafis: i livelli portano alle sezioni (22 pulsanti)  → true
  ✓ sareamat: c'è, è in testa alla sua categoria, ha tre schede  → true
  ✓ sareamat: l'assistente risponde con lo svolgimento  → true
  ✓ sareamat: il catalogo raccoglie gli strumenti della materia (20)  → true
  ✓ sareamat: la ricerca filtra (1)  → true
  ✓ sareamat: quattro livelli, dalle superiori al dottorato  → 4
  ✓ sareamat: i livelli portano alle sezioni (20 pulsanti)  → true
  ✓ un pulsante del catalogo apre la sezione  → true
  ✓ Spectra ha i tre strumenti nuovi (38 in tutto)  → 38
  ✓ risolvi_matematica: lim (1 − cos x)/x² = 1/2 con lo svolgimento  → true
  ✓ risolvi_fisica con modello e dati espliciti: gittata v₀²/g  → true
  ✓ risolvi_chimica risolve il problema inverso (7,3 g di NaCl)  → true
  ✓ un modello inesistente dà un errore con l'elenco dei modelli  → true
  ✓ nessun errore JavaScript  → 0
── telefono ──
  ✓ sareachim: c'è, è in testa alla sua categoria, ha tre schede  → true
  ✓ sareachim: a 390 px niente sborda  → 0
  ✓ sareafis: c'è, è in testa alla sua categoria, ha tre schede  → true
  ✓ sareafis: a 390 px niente sborda  → 0
  ✓ sareamat: c'è, è in testa alla sua categoria, ha tre schede  → true
  ✓ sareamat: a 390 px niente sborda  → 0
  ✓ nessun errore JavaScript  → 0
  ✓ in inglese: le tre aree  → ⚗️ Chemistry area · assistant|⚛️ Physics area · assistant|📐 Mathematics area · assistant

159 controlli passati
```

</details>

<details>
<summary><code>test_grafica3d</code> — SUPERATO (codice di uscita 0)</summary>

```
── Orbitali: funzioni speciali e nodi ──
  ✓ L₁⁽³⁾(2) = 1 + a − x = 2  → 2 (atteso 2 ± 1e-12)
  ✓ L₂⁽¹⁾(1,7) = (x² − 6x + 6)/2  → -0.655 (atteso -0.655 ± 1e-12)
  ✓ L₃⁽⁰⁾(0,8) = (−x³ + 9x² − 18x + 6)/6  → -0.52533333 (atteso -0.52533333 ± 1e-12)
  ✓ P₂⁰(0,3) = (3x² − 1)/2  → -0.365 (atteso -0.365 ± 1e-12)
  ✓ P₂¹(0,3) = 3x√(1 − x²)  → 0.85854528 (atteso 0.85854528 ± 1e-12)
  ✓ P₃²(0,4) = 15x(1 − x²)  → 5.04 (atteso 5.04 ± 1e-12)
  ✓ nodo radiale del 2s a r = 2a₀  → 0 (atteso 0 ± 1e-12)
  ✓ nodi del 3s a r = (9 − 3√3)/2 a₀  → 1.1779004e-16 (atteso 0 ± 1e-12)
  ✓ nodi del 3s a r = (9 + 3√3)/2 a₀  → 6.2518666e-17 (atteso 0 ± 1e-12)
  ✓ 2p_z si annulla sul piano xy  → 0 (atteso 0 ± 1e-12)
  ✓ 3d_z² si annulla sul cono cos²θ = 1/3  → -4.1550756e-17 (atteso 0 ± 1e-12)
  ✓ 2p_x si annulla sul piano yz  → 2.4815251e-17 (atteso 0 ± 1e-12)
  ✓ 3d_xy si annulla sul piano xz  → 0 (atteso 0 ± 1e-12)
  ✓ 2p_z cambia segno attraversando il piano xy  → true

── Orbitali: la nuvola campionata ha il raggio medio esatto ⟨r⟩ = (3n² − l(l+1))/(2Z) ──
  ✓ ⟨r⟩ di n=1 l=0 m=0 Z=1 = 1.5 a₀  → 1.4947559 (atteso 1.5 ± 0.03)
  ✓ ⟨r⟩ di n=2 l=0 m=0 Z=1 = 6 a₀  → 5.986848 (atteso 6 ± 0.12)
  ✓ ⟨r⟩ di n=2 l=1 m=0 Z=1 = 5 a₀  → 4.9744839 (atteso 5 ± 0.1)
  ✓ ⟨r⟩ di n=3 l=2 m=0 Z=1 = 10.5 a₀  → 10.471969 (atteso 10.5 ± 0.21)
  ✓ ⟨r⟩ di n=3 l=1 m=1 Z=1 = 12.5 a₀  → 12.431901 (atteso 12.5 ± 0.25)
  ✓ ⟨r⟩ di n=4 l=3 m=0 Z=1 = 18 a₀  → 17.921652 (atteso 18 ± 0.36)
  ✓ ⟨r⟩ di n=1 l=0 m=0 Z=2 = 0.75 a₀  → 0.74737796 (atteso 0.75 ± 0.015)
  ✓ ⟨r⟩ di n=2 l=1 m=-1 Z=3 = 1.6666666666666667 a₀  → 1.6578966 (atteso 1.6666667 ± 0.03333333333333333)
  ✓ 1s: la funzione d'onda ha un solo segno  → 5000
  ✓ 2p_z: metà dei punti positivi, metà negativi  → 0.5053 (atteso 0.5 ± 0.02)
  ✓ 3d_z²: la frazione nei lobi (ψ > 0) è quella dell'integrale di |Y₂₀|²  → 0.6153 (atteso 0.61509982 ± 0.015)

── Moti ──
  ✓ Keplero M = E − e sin E per M = 0.3, e = 0  → 0.3 (atteso 0.3 ± 1e-12)
  ✓ Keplero M = E − e sin E per M = 1.2, e = 0.5  → 1.2 (atteso 1.2 ± 1e-12)
  ✓ Keplero M = E − e sin E per M = 3, e = 0.9  → 3 (atteso 3 ± 1e-12)
  ✓ Keplero M = E − e sin E per M = 5.5, e = 0.7  → 5.5 (atteso 5.5 ± 1e-12)
  ✓ Lorenz ρ = 10: x → √(β(ρ−1)) = 4.8990  → 4.8989795 (atteso 4.8989795 ± 0.0001)
  ✓ Lorenz ρ = 10: z → ρ − 1 = 9  → 9 (atteso 9 ± 0.0001)
  ✓ Lorenz ρ = 28: due traiettorie a 0,001 si separano più di mille volte (caos)  → true

── Cristalli ──
  ✓ NaCl: 4 Na e 4 Cl per cella  → Cl4 Na4
  ✓ CsCl: 1 Cs e 1 Cl  → Cl1 Cs1
  ✓ CaF₂: 4 Ca e 8 F  → Ca4 F8
  ✓ SrTiO₃: 1 Sr, 1 Ti, 3 O  → O3 Sr1 Ti1
  ✓ diamante: 8 atomi  → C8
  ✓ fcc 4, bcc 2, cubica semplice 1  → 4 2 1
  ✓ fcc: 4 sfere di raggio a√2/4  → 0.74048049 (atteso 0.74048049 ± 1e-12)
  ✓ bcc: 2 sfere di raggio a√3/4  → 0.68017476 (atteso 0.68017476 ± 1e-12)
  ✓ cubica semplice: 1 sfera di raggio a/2  → 0.52359878 (atteso 0.52359878 ± 1e-12)
  ✓ diamante: 8 sfere di raggio a√3/8  → 0.34008738 (atteso 0.34008738 ± 1e-12)
  ✓ esagonale compatta = fcc (stesso impacchettamento)  → 0.74048049 (atteso 0.74048049 ± 1e-12)
  ✓ Mg: c/a vicino all'ideale √(8/3) = 1,633  → 1.623053 (atteso 1.6329932 ± 0.01)
  ✓ diamante: legame C–C = a√3/4 = 1,545 Å  → 1.545 (atteso 1.5445563 ± 0.002)
  ✓ (100): quadrato di 4 vertici  → 4
  ✓ (100): area 1  → 1 (atteso 1 ± 1e-12)
  ✓ (110): rettangolo di 4 vertici  → 4
  ✓ (110): area √2  → 1.4142136 (atteso 1.4142136 ± 1e-12)
  ✓ (111): triangolo  → 3
  ✓ (111): area √3/2  → 0.8660254 (atteso 0.8660254 ± 1e-12)
  ✓ (200): piano parallelo a (100)  → true
  ✓ (000) non è un piano  → 0
  ✓ NaCl (200) con Cu Kα: 2θ ≈ 31,7° (picco più intenso del salgemma)  → 31.704311 (atteso 31.7 ± 0.1)

── Campi ──
  ✓ dipolo sull'asse a x = 20: somma esatta 1/21² − 1/19²  → -0.00050250941 (atteso -0.00050250941 ± 1e-15)
  ✓ dipolo lontano ≈ 2p/r³ (p = 2, verso −x)  → -0.00050250941 (atteso -0.0005 ± 0.00003)
  ✓ Gauss: due cariche +1 dentro la sfera → flusso 8π  → 25.132741 (atteso 25.132741 ± 0.01)
  ✓ Gauss: dipolo dentro la sfera → flusso 0  → -0.000002383035 (atteso 0 ± 0.01)
  ✓ Gauss: +2 e due −1 → flusso 0  → 1.2743245e-8 (atteso 0 ± 0.01)
  ✓ spira R = 1,5: al centro |B| = 2π/R (unità μ₀I/4π)  → 4.1880426 (atteso 4.1887902 ± 0.002)
  ✓ spira sull'asse a z = 2: |B| = 2πR²/(R² + z²)^(3/2)  → 0.9046172 (atteso 0.90477868 ± 0.001)
  ✓ spira: sull'asse B non ha componenti trasverse  → 7.9345897e-17 (atteso 0 ± 1e-9)
  ✓ una linea che parte dalla carica + arriva alla − (a x = 1)  → 0.10453588 (atteso 0 ± 0.13)

── Superfici ──
  ✓ curva di livello 1 di x² + y²: tutti i punti a distanza 1 dall'origine (±1 %)  → true
  ✓ una variabile diversa da x e y viene rifiutata con un messaggio  → true

── Nel browser: Laboratorio 3D ──
── schermo grande ──
  ✓ cinque schede  → 5
  ✓ superfici: la scena disegna (10203 pixel non di sfondo)  → true
  ✓ superfici: la tela ha un nome accessibile («z = x⁴ + y⁴ − 4x·y»)  → true
  ✓ superfici: trascinando ruota, con la rotellina si allontana  → true
  ✓ superfici: i pulsanti hanno un nome  → true
  ✓ orbitali: la scena disegna (9447 pixel non di sfondo)  → true
  ✓ orbitali: la tela ha un nome accessibile («3d_z² · Z = 1 · ψ > 0ψ < 0»)  → true
  ✓ orbitali: trascinando ruota, con la rotellina si allontana  → true
  ✓ orbitali: i pulsanti hanno un nome  → true
  ✓ moti: la scena disegna (737 pixel non di sfondo)  → true
  ✓ moti: la tela ha un nome accessibile («B ∥ z · elettrone»)  → true
  ✓ moti: trascinando ruota, con la rotellina si allontana  → true
  ✓ moti: i pulsanti hanno un nome  → true
  ✓ cristalli: la scena disegna (9892 pixel non di sfondo)  → true
  ✓ cristalli: la tela ha un nome accessibile («Salgemma NaCl»)  → true
  ✓ cristalli: trascinando ruota, con la rotellina si allontana  → true
  ✓ cristalli: i pulsanti hanno un nome  → true
  ✓ campi: la scena disegna (917 pixel non di sfondo)  → true
  ✓ campi: la tela ha un nome accessibile («Linee del campo elettrico»)  → true
  ✓ campi: trascinando ruota, con la rotellina si allontana  → true
  ✓ campi: i pulsanti hanno un nome  → true
  ✓ superfici: trovati due minimi e una sella di x⁴ + y⁴ − 4xy  → true
  ✓ cristalli: NaCl mostra Z = 4 e coordinazione 6 : 6  → true
  ✓ la rotazione automatica fa avanzare la vista  → true
  ✓ nessun errore JavaScript  → 0
── telefono ──
  ✓ cinque schede  → 5
  ✓ superfici: la scena disegna (2527 pixel non di sfondo)  → true
  ✓ orbitali: la scena disegna (2856 pixel non di sfondo)  → true
  ✓ moti: la scena disegna (314 pixel non di sfondo)  → true
  ✓ cristalli: la scena disegna (2369 pixel non di sfondo)  → true
  ✓ campi: la scena disegna (391 pixel non di sfondo)  → true
  ✓ a 390 px niente sborda  → 0
  ✓ nessun errore JavaScript  → 0

── Nel browser: i grafici delle sezioni ──
  ✓ un grafico entra con l'animazione la prima volta  → true
  ✓ cambiando un dato, la curva scivola dal valore vecchio al nuovo  → true
  ✓ l'animazione finisce entro 0,6 s  → true
  ✓ alla fine l'immagine è identica al disegno diretto (sovrapposizioni del modulo comprese)  → true
  ✓ il mirino compare sopra il grafico  → true
  ✓ uscendo, il grafico torna com'era  → true
  ✓ a raffica (cursore trascinato) si disegna subito, senza inseguire  → true
  ✓ nessun errore JavaScript  → 0
  ✓ con «riduci movimento» nel sistema: nessuna entrata e nessuna transizione  → true

── Nel browser: viste molecolari 3Dmol ──
  ✓ ogni visore riceve la barra con cinque comandi  → 5
  ✓ i comandi hanno un nome accessibile  → true
  ✓ la qualità scelta (alta) viene applicata  → alta
  ✓ il visore disegna ed esporta un PNG  → true
  ✓ il resto della libreria 3Dmol funziona come prima  → true
  ✓ il pulsante qualità passa al livello successivo  → alta→media
  ✓ nessun errore JavaScript  → 0
  ✓ in inglese: «3D Laboratory»  → 🧊 3D Laboratory

115 controlli passati
```

</details>

<details>
<summary><code>test_laboratori</code> — SUPERATO (codice di uscita 0)</summary>

```
── Meccanica ──
  ✓ gittata nel vuoto = v₀² sin 2θ / g  → 91.774397 (atteso 91.774459 ± 0.001)
  ✓ tempo di volo = 2 v₀ sin θ / g  → 4.3262866 (atteso 4.3262895 ± 0.0001)
  ✓ quota massima = v₀² sin²θ / 2g  → 22.943608 (atteso 22.943615 ± 0.001)
  ✓ lancio da 10 m: gittata = v₀ cos θ · t_volo  → 48.05567 (atteso 48.055688 ± 0.001)
  ✓ nel vuoto da terra l'angolo ottimo è 45°  → 45.018787 (atteso 45 ± 0.05)
  ✓ con l'aria l'angolo ottimo scende sotto 45° (41.21°)  → true
  ✓ con l'aria la gittata è minore  → true
  ✓ urto elastico: quantità di moto conservata  → 5 (atteso 5 ± 1e-12)
  ✓ urto elastico: energia conservata  → 9.5 (atteso 9.5 ± 1e-12)
  ✓ masse uguali, urto elastico: le velocità si scambiano  → 0 2
  ✓ anelastico: velocità comune = P/M  → 1.6666667 (atteso 1.6666667 ± 1e-12)
  ✓ energia persa = ½μ(1 − e²)v_rel²  → 5.3333333 (atteso 5.3333333 ± 1e-12)
  ✓ e = 0,5: energia persa = ½μ(1 − e²)v_rel²  → 4 (atteso 4 ± 1e-12)
  ✓ K(0) = π/2  → 1.5707963 (atteso 1.5707963 ± 1e-15)
  ✓ pendolo a 90°: T/T₀ = 1,18034  → 1.1803406 (atteso 1.1803406 ± 1e-7)
  ✓ pendolo a 10°: T/T₀ ≈ 1 + θ₀²/16  → 1.0019072 (atteso 1.0019039 ± 0.00001)
  ✓ pendolo senza attrito: energia conservata dopo 20 s (RK4)  → -4.903325 (atteso -4.903325 ± 0.000001)
  ✓ modo in fase ω₁ = √(k/m)  → 3.1622777 (atteso 3.1622777 ± 1e-12)
  ✓ modo in opposizione ω₂ = √((k + 2k_c)/m)  → 3.4641016 (atteso 3.4641016 ± 1e-12)
  ✓ battimento: dopo π/(ω₂ − ω₁) tutta l'energia è nella seconda massa  → -1.831868e-15 (atteso 0 ± 0.15)

── Onde e ottica ──
  ✓ lente f = 10, p = 25: q = 50/3  → 16.666667 (atteso 16.666667 ± 1e-12)
  ✓ immagine reale e capovolta  → true false
  ✓ dentro il fuoco: q = −10 (virtuale)  → -10 (atteso -10 ± 1e-12)
  ✓ ingrandimento 2  → 2 (atteso 2 ± 1e-12)
  ✓ lente divergente: virtuale e dritta  → false true
  ✓ p = 2f: q = 2f e M = −1  → -1 (atteso -1 ± 1e-12)
  ✓ N fenditure al centro: I = 1  → 1 (atteso 1 ± 1e-12)
  ✓ primo ordine: inviluppo (sin β/β)² con β = π a/d  → 0.81056947 (atteso 0.81056947 ± 1e-9)
  ✓ minimo di diffrazione a sin θ = λ/a  → 1.5195744e-33 (atteso 0 ± 1e-12)
  ✓ fra due massimi principali, a sin(Nα) = 0, l'intensità è zero (N = 4)  → 1.8507314e-33 (atteso 0 ± 1e-12)
  ✓ 530 nm è verde, 680 nm rosso  → true

── Circuiti ──
  ✓ RLC sotto: Kirchhoff L di/dt + Ri + v_C = E  → 2.0474822e-10 (atteso 0 ± 0.000001)
  ✓ RLC sotto: i = C dv_C/dt  → -2.2459257e-12 (atteso 0 ± 1e-8)
  ✓ RLC sotto: parte da v_C = 0 e i = 0  → 0 (atteso 0 ± 1e-12)
  ✓ regime riconosciuto: sotto  → sotto
  ✓ RLC sovra: Kirchhoff L di/dt + Ri + v_C = E  → -2.5863756e-11 (atteso 0 ± 0.000001)
  ✓ RLC sovra: i = C dv_C/dt  → 1.4809119e-11 (atteso 0 ± 1e-8)
  ✓ RLC sovra: parte da v_C = 0 e i = 0  → 0 (atteso 0 ± 1e-12)
  ✓ regime riconosciuto: sovra  → sovra
  ✓ RLC critico: Kirchhoff L di/dt + Ri + v_C = E  → -1.1018209e-10 (atteso 0 ± 0.000001)
  ✓ RLC critico: i = C dv_C/dt  → 1.5398682e-11 (atteso 0 ± 1e-8)
  ✓ RLC critico: parte da v_C = 0 e i = 0  → 0 (atteso 0 ± 1e-12)
  ✓ regime riconosciuto: critico  → critico
  ✓ sovraelongazione = e^(−πζ/√(1−ζ²))  → 0.35091974 (atteso 0.35091981 ± 0.0001)
  ✓ RC: dopo τ al 63,2 %  → 0.63212056 (atteso 0.63212056 ± 1e-12)
  ✓ passa-basso al taglio: −3,01 dB  → -3.0103 (atteso -3.0103 ± 1e-9)
  ✓ passa-basso al taglio: −45°  → -45 (atteso -45 ± 1e-9)
  ✓ una decade sopra: circa −20 dB  → -20.043214 (atteso -20.04 ± 0.01)
  ✓ passa-alto al taglio: +45°  → 45 (atteso 45 ± 1e-9)
  ✓ passa-banda alla risonanza: 0 dB  → 0 (atteso 0 ± 1e-9)
  ✓ alla risonanza |Z| = R  → 50 (atteso 50 ± 1e-9)

── Termodinamica ──
  ✓ carnot: ΔU del ciclo = 0  → 0 (atteso 0 ± 0.000001)
  ✓ carnot: ΔS del ciclo = 0  → 0 (atteso 0 ± 1e-9)
  ✓ carnot: rendimento dal bilancio = formula  → 0.8 (atteso 0.8 ± 1e-9)
  ✓ otto: ΔU del ciclo = 0  → -2.7284841e-12 (atteso 0 ± 0.000001)
  ✓ otto: ΔS del ciclo = 0  → -3.5527137e-15 (atteso 0 ± 1e-9)
  ✓ otto: rendimento dal bilancio = formula  → 0.56472472 (atteso 0.56472472 ± 1e-9)
  ✓ diesel: ΔU del ciclo = 0  → 1.8189894e-12 (atteso 0 ± 0.000001)
  ✓ diesel: ΔS del ciclo = 0  → -3.5527137e-15 (atteso 0 ± 1e-9)
  ✓ diesel: rendimento dal bilancio = formula  → 0.49041209 (atteso 0.49041209 ± 1e-9)
  ✓ stirling: ΔU del ciclo = 0  → 0 (atteso 0 ± 0.000001)
  ✓ stirling: ΔS del ciclo = 0  → 0 (atteso 0 ± 1e-9)
  ✓ stirling: rendimento dal bilancio = formula  → 0.8 (atteso 0.8 ± 1e-9)
  ✓ Otto r = 8, γ = 1,4: η = 1 − 8^(−0,4) = 56,5 %  → 0.56472472 (atteso 0.56472472 ± 1e-9)
  ✓ Otto: se la combustione partisse sotto la fine compressione, la temperatura viene alzata e segnalata  → true
  ✓ Diesel con lo stesso r rende meno di Otto  → true
  ✓ gas di dischi: energia conservata negli urti  → 40000 (atteso 40000 ± 0.000001)
  ✓ velocità media = √(πkT/2) (Maxwell-Boltzmann 2D)  → 17.757429 (atteso 17.724539 ± 0.5327228767007768)
  ✓ pressione: gas di dischi duri N kT/A (1 + 2η + 2,78η²)  → 4.731241 (atteso 4.8149391 ± 0.2000000000000001)
  ✓ la distribuzione 2D è normalizzata  → 1.0000056 (atteso 1 ± 0.001)

── Metodi numerici ──
  ✓ Newton trova la radice di x³ − 2x − 5 (Wallis)  → 2.0945515 (atteso 2.0945515 ± 1e-14)
  ✓ ordine di Newton ≈ 2  → 1.9992441 (atteso 2 ± 0.1)
  ✓ ordine delle secanti ≈ 1,618 (sezione aurea)  → 1.5000064 (atteso 1.618 ± 0.15)
  ✓ punto fisso x = ∛(2x + 5): ordine 1  → 1.000255 (atteso 1 ± 0.05)
  ✓ bisezione senza cambio di segno: errore spiegato  → true
  ✓ trapezi: ordine 2  → 1.9886493 (atteso 2 ± 0.1)
  ✓ Simpson: ordine 4  → 3.9975849 (atteso 4 ± 0.1)
  ✓ rettangoli (punto medio): ordine 2  → 1.980037 (atteso 2 ± 0.1)
  ✓ Gauss a 3 punti su 1 intervallo integra x⁵ esattamente  → 0.16666667 (atteso 0.16666667 ± 1e-15)
  ✓ Eulero: ordine 1  → 1.0138818 (atteso 1 ± 0.1)
  ✓ Heun: ordine 2  → 2.112842 (atteso 2 ± 0.2)
  ✓ RK4: ordine 4  → 4.1210537 (atteso 4 ± 0.25)
  ✓ equazione rigida: Eulero con h = 0,05 > 2/50 esplode, con h = 0,01 no  → true
  ✓ Runge, 11 nodi equispaziati: errore ≈ 1,92  → 1.9156431 (atteso 1.9156 ± 0.01)
  ✓ nodi di Čebyšëv e spline correggono Runge (errori 0.109, 0.022)  → true
  ✓ la spline passa per i nodi  → 2.220446e-16 (atteso 0 ± 1e-14)

── Geometria analitica ──
  ✓ 5x² + 4xy + 2y² = 6 è un'ellisse  → ellisse
  ✓ semiasse maggiore √6  → 2.4494897 (atteso 2.4494897 ± 1e-12)
  ✓ semiasse minore 1  → 1 (atteso 1 ± 1e-12)
  ✓ fuoco in (1, −2) o (−1, 2): |F| = √5  → 2.236068 (atteso 2.236068 ± 1e-12)
  ✓ il fuoco sta sulla retta y = −2x (asse maggiore)  → true
  ✓ x² + y² − 2x − 4y − 4 = 0: circonferenza  → circonferenza
  ✓ centro (1, 2) e raggio 3  → 1 2 3
  ✓ xy = ½: iperbole  → iperbole
  ✓ eccentricità √2 (equilatera)  → 1.4142136 (atteso 1.4142136 ± 1e-12)
  ✓ fuoco in (1, 1)  → 2.220446e-16 (atteso 0 ± 1e-12)
  ✓ x² + 2xy + y² − 4x + 4y = 0: parabola  → parabola
  ✓ parametro p = √2  → 1.4142136 (atteso 1.4142136 ± 1e-12)
  ✓ x² − y² = 0: coppia di rette (Δ = 0)  → rette incidenti
  ✓ x² + y² + 1 = 0: ellisse immaginaria  → ellisse immaginaria
  ✓ piano per (1,0,0), (0,2,0), (0,0,3): 6x + 3y + 2z − 6 = 0  → 6 3 2 -6
  ✓ distanza dell'origine dal piano = 6/7  → 0.85714286 (atteso 0.85714286 ± 1e-12)
  ✓ la retta x = y = z incontra il piano in (6/11, 6/11, 6/11)  → 0.54545455 (atteso 0.54545455 ± 1e-12)
  ✓ due rette sghembe  → sghembe
  ✓ distanza 1  → 1 (atteso 1 ± 1e-12)
  ✓ rette parallele riconosciute  → parallele
  ✓ u × v = (1, −2, 5)  → 1 -2 5
  ✓ prodotto misto = det[u; v; w]  → 8 (atteso 8 ± 1e-12)
  ✓ vettori complanari: prodotto misto nullo  → true

── Equilibrio chimico ──
  ✓ N₂ + 3 H₂ ⇌ 2 NH₃: all'equilibrio calcolato Q = K  → 1 (atteso 1 ± 1e-9)
  ✓ N₂ + 3 H₂ ⇌ 2 NH₃: la cinetica arriva allo stesso equilibrio  → 3.3972825e-14 (atteso 0 ± 0.000001)
  ✓ H₂ + I₂ ⇌ 2 HI: all'equilibrio calcolato Q = K  → 1 (atteso 1 ± 1e-9)
  ✓ H₂ + I₂ ⇌ 2 HI: la cinetica arriva allo stesso equilibrio  → 3.3306691e-14 (atteso 0 ± 0.000001)
  ✓ N₂O₄ ⇌ 2 NO₂: all'equilibrio calcolato Q = K  → 1 (atteso 1 ± 1e-9)
  ✓ N₂O₄ ⇌ 2 NO₂: la cinetica arriva allo stesso equilibrio  → 4.4408921e-16 (atteso 0 ± 0.000001)
  ✓ CH₃COOH + C₂H₅OH ⇌ CH₃COOC₂H₅ + H₂O: all'equilibrio calcolato Q = K  → 1 (atteso 1 ± 1e-9)
  ✓ CH₃COOH + C₂H₅OH ⇌ CH₃COOC₂H₅ + H₂O: la cinetica arriva allo stesso equilibrio  → 5.884182e-15 (atteso 0 ± 0.000001)
  ✓ CO + H₂O ⇌ CO₂ + H₂: all'equilibrio calcolato Q = K  → 1 (atteso 1 ± 1e-9)
  ✓ CO + H₂O ⇌ CO₂ + H₂: la cinetica arriva allo stesso equilibrio  → 4.773959e-15 (atteso 0 ± 0.000001)
  ✓ esterificazione con K = 4, 1:1: estere 2/3  → 0.66666667 (atteso 0.66666667 ± 1e-12)
  ✓ Haber, volume dimezzato: la frazione di NH₃ aumenta (Le Chatelier, Δn = −2)  → true
  ✓ Haber, aggiungendo N₂: NH₃ aumenta  → true
  ✓ reazione esotermica (Haber): scaldando K diminuisce  → true
  ✓ reazione endotermica (N₂O₄ ⇌ 2NO₂): scaldando K aumenta  → true
  ✓ Haber: ΔG° = 0 a T = ΔH°/ΔS° = 464 K  → 1 (atteso 1 ± 1e-9)

── Nel browser ──
── schermo grande ──
  ✓ sfismecc: 4 schede piene, nessun avviso, le tele disegnano  → true
  ✓ sfismecc: ogni tela ha un nome accessibile  → true
  ✓ sfisonde: 3 schede piene, nessun avviso, le tele disegnano  → true
  ✓ sfisonde: ogni tela ha un nome accessibile  → true
  ✓ sfiscirc: 3 schede piene, nessun avviso, le tele disegnano  → true
  ✓ sfiscirc: ogni tela ha un nome accessibile  → true
  ✓ sfistermo: 3 schede piene, nessun avviso, le tele disegnano  → true
  ✓ sfistermo: ogni tela ha un nome accessibile  → true
  ✓ smatnum: 4 schede piene, nessun avviso, le tele disegnano  → true
  ✓ smatnum: ogni tela ha un nome accessibile  → true
  ✓ smatgeo: 3 schede piene, nessun avviso, le tele disegnano  → true
  ✓ smatgeo: ogni tela ha un nome accessibile  → true
  ✓ schiequil: 2 schede piene, nessun avviso, le tele disegnano  → true
  ✓ schiequil: ogni tela ha un nome accessibile  → true
  ✓ Le Chatelier nella pagina: aggiungendo N₂ la concentrazione di NH₃ sale (1.097 → 1.225 M)  → true
  ✓ nessun errore JavaScript  → 0
── telefono ──
  ✓ sfismecc: 4 schede piene, nessun avviso, le tele disegnano  → true
  ✓ sfisonde: 3 schede piene, nessun avviso, le tele disegnano  → true
  ✓ sfiscirc: 3 schede piene, nessun avviso, le tele disegnano  → true
  ✓ sfistermo: 3 schede piene, nessun avviso, le tele disegnano  → true
  ✓ smatnum: 4 schede piene, nessun avviso, le tele disegnano  → true
  ✓ smatgeo: 3 schede piene, nessun avviso, le tele disegnano  → true
  ✓ schiequil: 2 schede piene, nessun avviso, le tele disegnano  → true
  ✓ a 390 px niente sborda  → 0
  ✓ nessun errore JavaScript  → 0
  ✓ in inglese: i nomi delle sezioni  → 🎯 Mechanics in motion|🧮 Numerical methods|⚖️ Equilibrium and Le Chatelier

151 controlli passati
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
   prompt + 38 strumenti = 9429 token
  ✓ senza budget non ci si sta  → true

3) Col tetto imparato la richiesta si stringe
  ✓ senza tetto non taglia niente  → false
   con tetto 8000: 18/38 strumenti, totale 5159
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
    · schede trovate: 128 (sdashboard, sarticoli, sareachim, smol, spt, ssyn…)
    · nodi DOM per giro: 7756 → 44526 → 44538 → 44538 → 44538 → 44538
    · canvas   per giro: 24 → 67 → 67 → 67 → 67 → 67
    · setInterval vivi (creati-cancellati): -3
    · costruzione (giro 1): +36770 nodi
    · dopo la costruzione (giri 2-5): +12 nodi  (3/giro)
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
  ✓ index — nessun errore all'avvio (7700 nodi)  → 0
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
    · cache: bsi-v233 con 91 voci
  ✓ il precarico ha messo dentro le pagine  → true
  ✓ nessun errore JS  → 0

2) Offline completo
  ✓ la app si apre senza rete  → true
    · 7159 nodi in 852 ms — "BioSpecInfo · v8"
  ✓ nessun errore JS offline  → 0

3) Rete pessima (risposte a 20 secondi)
    · caricata in 7662 ms con 7196 nodi — rete bloccata 59 volte
  ✓ la rete e' stata bloccata davvero (misura valida)  → true
  ✓ non si aspettano i 20 secondi della rete  → true
  ✓ la app viene servita dalla cache  → true
  ✓ nessun errore JS  → 0

3-bis) La gara col cronometro, misurata sul singolo fetch
  ✓ la pagina e' davvero governata dal service worker  → true
    · risposta in 3507 ms (stato 200, 603445 byte) — rete bloccata 1 volte
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
    · sfogliando: 1 contesti WebGL, 2 tele create per 10 molecole
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
    · app: bsi-v233   ·  sw.js: bsi-v233
  ✓ BSI_APP_VERSION coincide con la cache del service worker  → bsi-v233
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
    · 🔄AggiornamentiVersione installata: bsi-v233Premi “Controlla” per verificare se è disponib
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
  ✓ e il gestore resta sotto il tetto grossolano (ms)  → 16 (limite 400)
  ✓ il viewer si costruisce comunque: la tela WebGL esiste  → true
  ✓ e i comandi del pannello ci sono  → true
      (47 nodi, 1 tela, 31 comandi)

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
  ✓ il cambio di sezione mediano (ms)  → 10 (limite 40)
  ✓ il cambio di sezione peggiore (ms)  → 53 (limite 260)
  ✓ quante sezioni superano i 100 ms  → 0 (limite 2)
      (128 sezioni; le più lente: smatmulti 53ms, sfismecc 45ms, sdatasci 44ms, sretro 39ms)
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
      · en  210/210  (174 testi cambiati)
      · es  210/210  (170 testi cambiati)
      · fr  210/210  (175 testi cambiati)
      · de  210/210  (174 testi cambiati)
      · pt  210/210  (171 testi cambiati)
      · nl  210/210  (179 testi cambiati)
      · pl  210/210  (179 testi cambiati)
      · ro  210/210  (179 testi cambiati)
      · el  210/210  (180 testi cambiati)
      · ru  210/210  (181 testi cambiati)
      · zh  210/210  (181 testi cambiati)
      · ja  210/210  (181 testi cambiati)
      · ar  210/210  (181 testi cambiati)
  ✓ lo scheletro misurato è tutto (≥160 elementi)  → true
  ✓ nessun elemento dello scheletro resta senza traduzione  → 0
  ✓ i pulsanti di navigazione tradotti sono tutti  → 128
  ✓ i titoli di sezione tradotti sono tutti  → 57
  ✓ passando all’inglese il testo cambia davvero  → true
  ✓ tornando all’italiano il testo è identico a prima  → 0
  ✓ in arabo la pagina scorre da destra a sinistra  → rtl
  ✓ in giapponese no  → ltr
  ✓ e tornando all’italiano nemmeno  → ltr
  ✓ le categorie della barra sono nove (con 📐 Matematica, dalla v228)  → 9
  ✓ e cambiano tutte con la lingua  → 9
  ✓ anche il segnaposto della ricerca cambia  → true
  ✓ e torna quello di prima in italiano  → true
      (in tedesco: «🔬 Chemie» · «🔍 Abschnitt suchen...»)
      (210/210 elementi, 174 testi cambiati passando a «en»)

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
<summary><code>test_sellingua</code> — SUPERATO (codice di uscita 0)</summary>

```
Il cambio lingua, tondo, in alto a destra

── schermo grande ──
  ✓ il pulsante del cambio lingua c’è e si vede  → true
  ✓   · è tondo  → true
  ✓   · sta in alto  → true
  ✓   · a destra  → true
  ✓   · e all’altezza del titolo  → true
  ✓   · con un nome accessibile che dice che cosa fa  → true
  ✓ si apre in un disco  → true
  ✓   · con tutte le lingue  → 14
  ✓   · su due gusci  → 2
  ✓   · e il disco sta dentro lo schermo  → true
  ✓ scegliendo una bandiera la lingua cambia davvero  → true
      («🔍 Molecola» → «🔍 Molecule»)
  ✓   · e la bandiera del pulsante segue  → 🇬🇧
  ✓   · e il disco si chiude  → true
  ✓ tornando all’italiano il testo è identico a prima  → 🔍 Molecola
  ✓ nessun errore JavaScript  → 0

── telefono ──
  ✓ il pulsante del cambio lingua c’è e si vede  → true
  ✓   · è tondo  → true
  ✓   · sta in alto  → true
  ✓   · a destra  → true
  ✓   · e all’altezza del titolo  → true
  ✓   · con un nome accessibile che dice che cosa fa  → true
  ✓ si apre in un disco  → true
  ✓   · con tutte le lingue  → 14
  ✓   · su due gusci  → 2
  ✓   · e il disco sta dentro lo schermo  → true
  ✓ scegliendo una bandiera la lingua cambia davvero  → true
      («🔍 Molecola» → «🔍 Molecule»)
  ✓   · e la bandiera del pulsante segue  → 🇬🇧
  ✓   · e il disco si chiude  → true
  ✓ tornando all’italiano il testo è identico a prima  → 🔍 Molecola
  ✓ nessun errore JavaScript  → 0


30 controlli passati
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
      (655 pixel accesi a 130 ms → 2724 a 2,3 s)

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
Utility nel menù principale, e nessuna ripetizione

── schermo grande ──
  ✓ il modulo è caricato  → object
  ✓ la categoria Utility esiste  → true
  ✓   · ed è VISIBILE nella barra  → true
      (🛠️ Utility)
  ✓ tutte le voci di Utility sono raggiungibili dalla barra  → 15
  ✓   · e anche le due delle lingue  → 2
  ✓ «sai» non è nella barra (ha una casa migliore)  → false
  ✓   · ma il suo pulsante è ancora nel documento, per goSection()  → true
  ✓ «sspettrolettore» non è nella barra (ha una casa migliore)  → false
  ✓   · ma il suo pulsante è ancora nel documento, per goSection()  → true
  ✓ il pulsante ✨ c’è ed è visibile  → true
  ✓ e apre il pannello del menù  → true
  ✓ nessuna voce del menù ripete una sezione della barra  → 0
  ✓   · né due voci con la stessa etichetta  → 0
  ✓   · e il modulo non inserisce righe di sezione  → 0
  ✓ il pannello ha le sue voci (strumenti e sovrapposizioni)  → true
      (25 voci nel pannello)
  ✓ cliccando «snotes» nella barra la sezione si apre  → true
  ✓ cliccando «slingua» nella barra la sezione si apre  → true
  ✓ cliccando «slinguaggi» nella barra la sezione si apre  → true
  ✓ cliccando «sarticoli» nella barra la sezione si apre  → true
  ✓ cliccando «sdatasci» nella barra la sezione si apre  → true
  ✓ nessun errore JavaScript  → 0

── telefono ──
  ✓ il modulo è caricato  → object
  ✓ la categoria Utility esiste  → true
  ✓   · ed è VISIBILE nella barra  → true
      (🛠️ Utility)
  ✓ tutte le voci di Utility sono raggiungibili dalla barra  → 15
  ✓   · e anche le due delle lingue  → 2
  ✓ «sai» non è nella barra (ha una casa migliore)  → false
  ✓   · ma il suo pulsante è ancora nel documento, per goSection()  → true
  ✓ «sspettrolettore» non è nella barra (ha una casa migliore)  → false
  ✓   · ma il suo pulsante è ancora nel documento, per goSection()  → true
  ✓ il pulsante ✨ c’è ed è visibile  → true
  ✓ e apre il pannello del menù  → true
  ✓ nessuna voce del menù ripete una sezione della barra  → 0
  ✓   · né due voci con la stessa etichetta  → 0
  ✓   · e il modulo non inserisce righe di sezione  → 0
  ✓ il pannello ha le sue voci (strumenti e sovrapposizioni)  → true
      (25 voci nel pannello)
  ✓ cliccando «snotes» nella barra la sezione si apre  → true
  ✓ cliccando «slingua» nella barra la sezione si apre  → true
  ✓ cliccando «slinguaggi» nella barra la sezione si apre  → true
  ✓ cliccando «sarticoli» nella barra la sezione si apre  → true
  ✓ cliccando «sdatasci» nella barra la sezione si apre  → true
  ✓ nessun errore JavaScript  → 0

42 controlli passati
```

</details>

<details>
<summary><code>@verifica-sicurezza</code> — SUPERATO (codice di uscita 0)</summary>

```
Verifica di sicurezza

File tracciati esaminati: 412

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
      (412 file tracciati, citati in 4 documenti)

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
      (500 commit · 4177 versioni distinte di file di testo)

── La ricerca ──
  ✓ nessuna credenziale in nessuna versione di nessun file  → 
      (4177 versioni esaminate con 9 schemi)
  ✓ le eccezioni dichiarate sono tutte ancora nella storia, nessuna di più  → 1
      · cc1a0ba00 — tools/banchi/audit_storia.js al commit 825ef66 — la prima stesura di QUESTO banco, che scriveva …

7 controlli passati
```

</details>

<details>
<summary><code>audit_rete</code> — SUPERATO (codice di uscita 0)</summary>

```
Nessun dato dell'utente lascia il dispositivo

  valore spia seminato in 71 depositi · 128 sezioni percorse · 86 richieste ispezionate

  ✓ la spia e' stata seminata  → true
  ✓ almeno una richiesta e' stata ispezionata  → true
  ✓ almeno una sezione e' stata percorsa  → true
  ✓ richieste che portano fuori un dato dell'utente  → 0
  ✓ ospiti contattati e non dichiarati nella distinta  → 0

  ospiti contattati: 127.0.0.1, api.crossref.org, pubchem.ncbi.nlm.nih.gov

5 controlli passati
```

</details>

<details>
<summary><code>@verifica-accessibilita</code> — SUPERATO (codice di uscita 0)</summary>

```
Verifica di accessibilità
WCAG 2.1 AA — contrasto 4.5:1 (testo normale), 3:1 (testo grande)

  ✓ index                   128/128 sez · 28442 elementi di testo · contrasto 0 · comandi senza nome 0 · campi senza etichetta 0 · img senza alt 0 · 7005 in SVG · 755 su gradiente (misurati sulla tappa peggiore) · 6 su immagine, non misurabili · 3 di sole emoji
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
      (128 sezioni percorse oltre alla vista iniziale di ogni pagina)
  ✓ contrasto sotto la soglia WCAG AA — invariato a 0 (debito dichiarato, non cresciuto)
  ✓ campi privi di etichetta — invariato a 0 (debito dichiarato, non cresciuto)
  ✓ elementi di testo esaminati — cresciuta: 41415 contro 38408 (+3007). Aggiornare il riferimento con l'opzione --aggiorna-riferimento
      riferimento del 2026-10-06 — il debito è dichiarato in docs/09 §4, non tollerato in silenzio

6 controlli passati
```

</details>

<details>
<summary><code>audit_mobile</code> — SUPERATO (codice di uscita 0)</summary>

```
Traboccamento orizzontale a 390 px

  ✓ sezioni percorse  → 128
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
   (414 file di testo controllati)

71 controlli passati
```

</details>

<details>
<summary><code>@verifica-documenti</code> — SUPERATO (codice di uscita 0)</summary>

```
Verifica della documentazione

Versione del codice (sw.js): bsi-v233

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
      (92 in italiano, 92 in inglese)
  ✓ la tabella di copertura è stata letta
  ✓ ogni famiglia dichiara il numero di requisiti che ha davvero
  ✓ il totale automatizzato coincide con la somma delle famiglie
      (92 identificativi definiti, 87 automatizzati)

18 controlli passati
```

</details>

<details>
<summary><code>@verifica-affermazioni</code> — SUPERATO (codice di uscita 0)</summary>

```
Verifica delle affermazioni numeriche
Ogni numero dichiarato nei documenti è confrontato con quello
misurato nell'applicazione in esecuzione.

  ✓ sezioni navigabili  → 128
  ✓ farmaci in banca dati  → 263
  ✓ malattie nell'atlante 3D  → 63
  ✓ malattie oncologiche  → 23
  ✓ strumenti dell'agente  → 38
  ✓ strategie di retrosintesi  → 46
  ✓ moduli di chimica organica  → 25

── Badge del README ──
  ✓ il badge della versione è allineato al codice  → bsi--v233
  ✓ il badge dei banchi coincide con la batteria  → 71
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

  128 sezioni percorse · 3 altre pagine · 67 file di script

  · 3Dmol-min.js               24.38 %   (122 kB su 502 kB)
  · RDKit_minimal.js           38.15 %   (95 kB su 250 kB)
  · astro.html                 50.52 %   (870 kB su 1723 kB)
  · bsi-ai-hub.js              33.23 %   (141 kB su 424 kB)
  · bsi-articoli-nobel.js      99.38 %   (49 kB su 49 kB)
  · bsi-articoli.js            52.72 %   (17 kB su 32 kB)
  · bsi-assistente.js          34.52 %   (24 kB su 69 kB)
  · bsi-centrospettri.js        89.4 %   (15 kB su 16 kB)
  · bsi-cheminfo.js            35.58 %   (86 kB su 242 kB)
  · bsi-chi-equilibrio.js      64.98 %   (8 kB su 13 kB)
  · bsi-chi-esame.js            34.1 %   (33 kB su 96 kB)
  · bsi-digitalizza.js         24.79 %   (9 kB su 35 kB)
  · bsi-documento.js           31.93 %   (7 kB su 21 kB)
  · bsi-elucida.js              34.9 %   (17 kB su 50 kB)
  · bsi-fis-circuiti.js        33.96 %   (6 kB su 16 kB)
  · bsi-fis-cristalli.js       49.04 %   (10 kB su 19 kB)
  · bsi-fis-dinamica.js        91.34 %   (11 kB su 12 kB)
  · bsi-fis-elettrodi.js       39.92 %   (5 kB su 13 kB)
  · bsi-fis-esame.js           31.32 %   (41 kB su 131 kB)
  · bsi-fis-hartreefock.js     84.67 %   (24 kB su 28 kB)
  · bsi-fis-matematica.js      38.64 %   (9 kB su 23 kB)
  · bsi-fis-meccanica.js       36.74 %   (8 kB su 22 kB)
  · bsi-fis-nucleare.js        47.13 %   (6 kB su 13 kB)
  · bsi-fis-onde.js            35.55 %   (7 kB su 20 kB)
  · bsi-fis-rotovib.js         61.04 %   (9 kB su 15 kB)
  · bsi-fis-schrodinger.js     49.83 %   (11 kB su 21 kB)
  · bsi-fis-superfici.js       39.42 %   (7 kB su 18 kB)
  · bsi-fis-termo.js           39.67 %   (10 kB su 24 kB)
  · bsi-fis-termostat.js       72.53 %   (8 kB su 10 kB)
  · bsi-fisica-comune.js       74.05 %   (18 kB su 24 kB)
  · bsi-geom3d.js              27.01 %   (12 kB su 43 kB)
  · bsi-lab3d.js               39.71 %   (24 kB su 61 kB)
  · bsi-lingue.js              99.33 %   (166 kB su 168 kB)
  · bsi-mat-basi.js            29.53 %   (8 kB su 25 kB)
  · bsi-mat-calcolo.js         33.31 %   (7 kB su 20 kB)
  · bsi-mat-cas.js             42.94 %   (28 kB su 65 kB)
  · bsi-mat-complessi.js       48.24 %   (9 kB su 19 kB)
  · bsi-mat-esame.js           67.94 %   (37 kB su 54 kB)
  · bsi-mat-funzioni.js        77.16 %   (13 kB su 16 kB)
  · bsi-mat-geometria.js       38.07 %   (9 kB su 23 kB)
  · bsi-mat-lineare.js         27.72 %   (10 kB su 38 kB)
  · bsi-mat-multi.js           58.26 %   (12 kB su 21 kB)
  · bsi-mat-numerici.js        40.44 %   (9 kB su 22 kB)
  · bsi-mat-ode.js             44.36 %   (9 kB su 20 kB)
  · bsi-mat-risolutore.js       6.09 %   (6 kB su 104 kB)
  · bsi-mat-statistica.js      37.65 %   (10 kB su 26 kB)
  · bsi-menu.js                61.98 %   (8 kB su 12 kB)
  · bsi-mol3d.js                9.08 %   (4 kB su 40 kB)
  · bsi-moldraw.js             27.33 %   (11 kB su 42 kB)
  · bsi-molingue.js            16.58 %   (8 kB su 51 kB)
  · bsi-nmr.js                 71.22 %   (38 kB su 54 kB)
  · bsi-nmr2d.js                23.1 %   (4 kB su 19 kB)
  · bsi-pannelli-lingua.js     61.99 %   (39 kB su 63 kB)
  · bsi-percorsi.js            94.24 %   (8 kB su 8 kB)
  · bsi-pretsch.js             99.96 %   (33 kB su 33 kB)
  · bsi-quesito.js             33.69 %   (6 kB su 17 kB)
  · bsi-sellingua.js           56.47 %   (9 kB su 16 kB)
  · bsi-spettri.js              72.1 %   (23 kB su 32 kB)
  · bsi-spettrolettore.js      41.46 %   (41 kB su 99 kB)
  · bsi-vista-molecole.js      74.96 %   (5 kB su 7 kB)
  · chimorga.html              59.46 %   (11 kB su 19 kB)
  · gltf_loader.js             45.17 %   (43 kB su 94 kB)
  · index.html                 62.56 %   (2372 kB su 3791 kB)
  · rdkit_lab.html             21.78 %   (30 kB su 138 kB)
  · smiles-drawer.min.js        10.9 %   (27 kB su 246 kB)
  · three.min.js               40.92 %   (241 kB su 589 kB)
  · three_bloom.js             76.83 %   (20 kB su 25 kB)

  complessiva: 50.03 %

  ✓ sezioni percorse  → 128
  ✓ file di script raccolti  → true
  ✓ la copertura e' stata calcolata  → true
  ✓ copertura di codice — stabile a 50.03 % (riferimento 49.89 %, tolleranza ±0.5)

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

<details>
<summary><code>test_articoli</code> — SUPERATO (codice di uscita 0)</summary>

```

── I link si ricostruiscono ──
  ✓ un DOI diventa il suo indirizzo permanente  → https://doi.org/10.1038/s41586-023-06004-9
  ✓   · e il prefisso «doi:» non ci finisce dentro  → https://doi.org/10.1021/jacs.3c01234
  ✓ un anno diventa la pagina ufficiale del premio  → https://www.nobelprize.org/prizes/chemistry/1965/summary/
  ✓   · e il materiale scientifico della Fondazione  → https://www.nobelprize.org/prizes/chemistry/1965/advanced-information/
  ✓   · e la versione divulgativa  → https://www.nobelprize.org/prizes/chemistry/1965/popular-information/
  ✓ la lettura in italiano si costruisce dall’indirizzo  → true
  ✓   · e se l’indirizzo ha già parametri, non ne rompe la sintassi  → true
  ✓ la ricerca su Wikipedia italiana è codificata  → true
  ✓ la richiesta a Crossref porta filtri, ordine e selezione  → true
  ✓   · e si identifica, come Crossref chiede  → true
  ✓ la richiesta alla Fondazione Nobel chiede la categoria chimica  → true
  ✓ lo stesso identificatore dà sempre lo stesso indirizzo  → true
  ✓   · e un identificatore diverso ne dà uno diverso  → true

── Le spiegazioni ──
  ✓ ci sono spiegazioni per molti argomenti  → 66 (minimo 50)
  ✓ ogni motivazione di prova trova la sua spiegazione  → 0
      · Click chemistry e chimica bioortogonale
      · I punti quantici
      · Reticoli metallo-organici (MOF)
      · Le batterie a ioni di litio
  ✓ una motivazione che non riconosce NON produce una spiegazione  → null
  ✓   · e nemmeno una motivazione vuota  → null
  ✓ nessuna spiegazione contiene un anno  → 0
  ✓ nessuna espressione di abbinamento è duplicata  → 0
  ✓ nessuna spiegazione è un abbozzo  → 0

── I dati vengono dalla sorgente ──
  ✓ il nome mostrato è quello che la sorgente ha dichiarato  → true
  ✓   · e così l’anno  → true
  ✓   · e la spiegazione è scelta dalla motivazione ricevuta  → true
  ✓ un anno senza premio viene dichiarato tale  → true
  ✓ i link del premio sono costruiti sull’anno ricevuto  → true
  ✓   · compreso quello per leggerlo in italiano  → true
      (2 premi nell’elenco ufficiale · 1 con spiegazione scrittaAnni, nomi e motivazioni vengono dalla Fondazione Nobel, non da)
  ✓ il titolo mostrato è quello ricevuto  → true
  ✓   · con rivista, autori e sunto  → true
  ✓   · e il link costruito dal DOI ricevuto  → true
  ✓ una voce senza DOI viene scartata e il numero dichiarato  → true
  ✓   · e non compare fra gli articoli  → true

── Quando non arriva, si dice ──
  ✓ se la richiesta fallisce, lo dice e mostra l’indirizzo chiesto  → true
  ✓   · e dichiara di non mostrare una lista vecchia al suo posto  → true
  ✓ una risposta vuota viene detta vuota, non rotta  → true
  ✓ una risposta di forma sbagliata viene detta incompresa, non vuota  → true
  ✓   · e mostra le chiavi che sono arrivate  → true

── Il Centro spettri ──
  ✓ le schede raccolte nel centro  → 10 (minimo 10)
  ✓   · e il centro ha il suo pulsante di navigazione  → true
  ✓ ogni pannello esiste nel documento UNA volta sola  → 0
  ✓ i vecchi pulsanti restano nel documento  → 10
  ✓   · ma nascosti: la barra non li mostra più  → 10
  ✓ goSection() su ogni scheda apre il centro su quella scheda  → 0
  ✓   · e ogni pannello ha contenuto  → 0
      (sspettrolettore:175 · snmrpred:21 · snoe:54 · sms:49 · sirvis:39 · suvvis:114 · sspec:257 · scentro:263 · selucid:97 · squizspec:60)

── Niente cose doppie ──
  ✓ nessun id ripetuto nel documento  → 0
  ✓ nessun pulsante di navigazione doppio  → 0
  ✓ nessuna sezione senza il suo pulsante  → 0
  ✓ nessun pulsante che punta a una sezione inesistente  → 0
  ✓ nessuna voce doppia nel menù ✨  → 0
  ✓ nessuna sezione raggiungibile dal menù E dalla barra visibile  → 0
  ✓ Spectra non è più una voce del menù ✨  → false
  ✓   · e il suo pulsante dedicato c’è  → true
  ✓   · e il pulsante di navigazione non si vede  → false
  ✓ il lettore spettri non è anche fra le utility  → false
  ✓ la sezione Articoli è raggiungibile dalla barra  → true
  ✓   · e aprendola si vede davvero (riquadro non nullo)  → true
  ✓   · e non è annidata dentro un’altra sezione  → false
  ✓   · e NON anche dal menù ✨, che sarebbe la seconda strada  → false
      (128 sezioni navigabili in tutto)
  ✓ «costanti J» porta all’unica tabella che resta  → true
  ✓   · e la tabella ha le sue righe  → 15 (minimo 10)
  ✓ nessun errore JavaScript  → 0

60 controlli passati
```

</details>

<details>
<summary><code>audit_statico</code> — SUPERATO (codice di uscita 0)</summary>

```

### _blank senza noopener  (75)
   astro.html:2596  +'<div style="margin-top:8px"><a href="https://science.nasa.gov/universe/black-holes/" target="_blank" style="
   astro.html:2663  +'<div style="margin-top:8px"><a href="https://science.nasa.gov/universe/quasars/" target="_blank" style="colo
   astro.html:2711  +'<div style="margin-top:8px"><a href="https://science.nasa.gov/universe/stars/neutron-stars/" target="_blank"
   astro.html:2759  +'<div style="margin-top:8px"><a href="https://science.nasa.gov/universe/stars/" target="_blank" style="color:
   astro.html:2796  +'<div style="margin-top:8px"><a href="https://science.nasa.gov/universe/stars/brown-dwarfs/" target="_blank" 
   astro.html:2860  +'<div style="margin-top:8px"><a href="https://science.nasa.gov/mission/hubble/science/science-highlights/kilo
   astro.html:2901  +'<div style="margin-top:8px"><a href="https://science.nasa.gov/mission/hubble/science/science-highlights/meas
   astro.html:2963  +'<div style="margin-top:8px"><a href="https://science.nasa.gov/universe/black-holes/" target="_blank" style="
   … e altri 67

### calc() senza spazi  (24)
   index.html:31239  bar.style.cssText = 'position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));'
   index.html:34710  'body{padding-bottom:calc(env(safe-area-inset-bottom,0px) + 20px)!important}',
   index.html:34711  '#main{padding-bottom:calc(env(safe-area-inset-bottom,0px) + 170px)!important}',
   index.html:34713  '#bsi105-fab{bottom:calc(env(safe-area-inset-bottom,0px) + 80px)!important;',
   index.html:34717  '#bsi105-menu{bottom:calc(env(safe-area-inset-bottom,0px) + 156px)!important;}',
   index.html:35159  '#hdr{padding-top:calc(14px + env(safe-area-inset-top,0px))!important;}',
   index.html:35172  '#bsi-scroll-top{position:fixed;left:18px;bottom:calc(env(safe-area-inset-bottom, 0px) + 80px);',
   index.html:35397  '  bottom:calc(env(safe-area-inset-bottom,0px) + 26px)!important;',
   … e altri 16

### id duplicati (1)  (1)
   astro.html  mn-cv×2

### id duplicati (25)  (1)
   index.html  dsPredOut×2, dsWbCsv×2, dgT×2, vdwN×2, vdwV×2, vdwT×2

### Duplicazioni, con riferimento dichiarato
  ✓ blocchi duplicati verbatim (≥ 25 righe): 0  (riferimento 0)
  ✓ funzioni globali ridefinite: 11  (riferimento 11)
        runCh3D ×2
        initLab ×3
        runNMRPred ×5
        initRetro ×2
        initTheory ×2
        parseSDF ×2
  ✓   · di cui con corpi IDENTICI (pura ridondanza): 0  (riferimento 0)
  nessuna delle tre misure e' cresciuta
```

</details>

---

## 5. Come riprodurre questo rapporto

```bash
# 1. dalla radice del repository, al commit indicato al §2
git checkout d6be31c1f5ec

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

_Generato il 2026-10-23T16:30:02.462Z._
