# Verification & Validation (V&V) & Benchmark Report — BioSpecInfo

| Campo | Valore |
|-------|--------|
| **Software** | BioSpecInfo |
| **Autore** | Samuele Pio Provenzano |
| **Scopo** | Documentare metodo di verifica, dati di validazione dei predittori spettrali, prestazioni cross-device e limiti dichiarati del modello. |

---

## 1. Scopo e strategia di V&V

- **Verifica (Verification):** il software è costruito correttamente (sintassi,
  assenza di errori runtime, comportamento atteso dei componenti).
- **Validazione (Validation):** i risultati scientifici (predittori spettrali,
  descrittori) sono confrontati con banche dati sperimentali di riferimento.

---

## 2. Verifica del software (QA)

| Tecnica | Descrizione | Stato |
|---------|-------------|-------|
| **Controllo sintattico** | `node --check` sui blocchi JavaScript critici a ogni modifica. | ✅ In uso |
| **Test end-to-end (E2E)** | Automazione con **Playwright** su Chromium headless: apertura sezioni, disegno/caricamento molecole, verifica dei pannelli (notazioni, spettri, gruppi funzionali, ADMET, similarità), animazioni 2D/3D. Conteggio degli errori JavaScript di console/pagina (criterio di accettazione: **0 errori** non di rete). | ✅ In uso |
| **Verifica su server HTTP** | RDKit WASM richiede contesto HTTP (CORS): i test girano su server locale per riprodurre l'ambiente reale. | ✅ In uso |
| **Test manuale cross-device** | Prova su dispositivi reali (vedi §4). | ✅ In uso |
| **Suite di unit test automatizzata** (Vitest/Jest) | — | 🔜 Roadmap |
| **Copertura ≥ 90%** | — | 🔜 Roadmap |

> Ogni release è verificata E2E con Playwright con criterio "zero errori JS"
> prima del merge sul ramo principale.

---

## 3. Validazione scientifica dei predittori spettrali

I predittori spettrali di BioSpecInfo usano **modelli euristici ad additività di
gruppo / regole strutturali** (tabelle di riferimento di letteratura), scelti
per garantire **risposta istantanea in-browser** su qualsiasi dispositivo.

### 3.1 Benchmark ¹H-NMR vs SDBS

| Metrica | Valore riportato |
|---------|------------------|
| Database di riferimento | **SDBS** (Spectral Database for Organic Compounds, AIST) |
| Errore Assoluto Medio (MAE) | **0,31 ppm** |
| Segnali entro ±0,5 ppm | **89%** |

### 3.2 Benchmark IR (banda C=O) vs NIST

| Metrica | Valore riportato |
|---------|------------------|
| Database di riferimento | **NIST Chemistry WebBook** |
| Errore Assoluto Medio (MAE) | **11 cm⁻¹** |
| Bande entro ±30 cm⁻¹ | **90%** |

### 3.3 Proprietà fisico-chimiche
Descrittori (peso molecolare, formula, LogP, TPSA, HBD/HBA, anelli,
stereocentri) calcolati tramite **RDKit MinimalLib** e confrontabili con
**PubChem** e **DrugBank**. Esempio di verifica riproducibile: *colesterolo →
C₂₇H₄₆O, 4 anelli, 8 stereocentri*.

> **Fonte dei dati di benchmark:** misurazioni condotte dall'autore nell'ambito
> della tesi di laurea. I valori vanno intesi come validazione a scopo
> **didattico e di identificazione qualitativa** dei gruppi funzionali, non come
> sostituto di calcoli quantomeccanici di riferimento.

---

## 4. Prestazioni cross-device

Prove di fluidità dei rendering interattivi (viewer 3D, animazioni, editor)
condotte su un ventaglio di dispositivi:

| Dispositivo | Esito |
|-------------|-------|
| iPhone / iPad | 30–60 fps |
| Laptop Windows / macOS | 60 fps |
| Raspberry Pi 4 | 30–60 fps |

Peso del file principale `index.html`: **≈ 4,5 MB** (l'intero pacchetto,
comprensivo dei moduli WASM e degli asset 3D, è superiore ma resta interamente
statico e cache-abile offline).

---

## 5. Limiti dichiarati del modello

In coerenza con il principio di trasparenza scientifica:

1. **Modello ad additività.** I predittori NMR/IR sommano contributi di gruppo e
   **non** modellano pienamente gli effetti dell'intorno chimico esteso
   (coniugazione lunga, effetti anisotropici, legami a idrogeno intramolecolari).
   Scarti maggiori sono attesi, ad es., su **carbonili fortemente coniugati** o
   su casi limite come l'**acido formico**.
2. **Spettri qualitativi/didattici.** Gli spettri simulati servono a riconoscere
   i gruppi funzionali e a comprendere le relazioni struttura–spettro, non a
   sostituire dati sperimentali certificati.
3. **Dipendenza da rete per alcune funzioni.** Nome IUPAC/comune, numero CAS,
   pittogrammi GHS e modelli 3D reali provengono da PubChem: in assenza di rete
   l'app mostra un fallback e resta pienamente funzionale sui dati locali.
4. **Precisione a doppia via.** Per l'uso rigoroso si rimanda ai link diretti
   verso i database ufficiali (NIST, SDBS, MassBank, nmrshiftdb2) integrati
   nell'interfaccia.

---

## 6. Criteri di accettazione di una release

- ✅ `node --check` supera senza errori sui moduli modificati.
- ✅ Test E2E Playwright: 0 errori JS non di rete.
- ✅ Nessuna regressione visibile nelle sezioni toccate.
- ✅ Versione della cache del Service Worker incrementata.
