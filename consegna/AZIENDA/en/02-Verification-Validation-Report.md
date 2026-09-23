# Verification & Validation (V&V) & Benchmark Report — BioSpecInfo

| Field | Value |
|-------|-------|
| **Software** | BioSpecInfo |
| **Author** | Samuele Pio Provenzano |
| **Purpose** | Document the verification method, validation data for the spectral predictors, cross-device performance and declared model limitations. |

---

## 1. Scope and V&V strategy

- **Verification:** the software is built correctly (syntax, no runtime errors,
  expected component behaviour).
- **Validation:** the scientific results (spectral predictors, descriptors) are
  compared against reference experimental databases.

---

## 2. Software verification (QA)

| Technique | Description | Status |
|-----------|-------------|--------|
| **Syntax checking** | `node --check` on the critical JavaScript blocks on every change. | ✅ In use |
| **End-to-end (E2E) testing** | Automation with **Playwright** on headless Chromium: open sections, draw/load molecules, verify panels (notations, spectra, functional groups, ADMET, similarity), 2D/3D animations. Counting of console/page JavaScript errors (acceptance criterion: **0 non-network errors**). | ✅ In use |
| **HTTP-server verification** | RDKit WASM requires an HTTP context (CORS): tests run on a local server to reproduce the real environment. | ✅ In use |
| **Manual cross-device testing** | Testing on real devices (see §4). | ✅ In use |
| **Automated unit-test suite** (Vitest/Jest) | — | 🔜 Roadmap |
| **Coverage ≥ 90%** | — | 🔜 Roadmap |

> Every release is verified E2E with Playwright under a "zero JS errors"
> criterion before merging to the main branch.

---

## 3. Scientific validation of the spectral predictors

BioSpecInfo's spectral predictors use **heuristic group-additivity / structural
rule** models (literature reference tables), chosen to guarantee **instant
in-browser response** on any device.

### 3.1 ¹H-NMR benchmark vs SDBS

| Metric | Reported value |
|--------|----------------|
| Reference database | **SDBS** (Spectral Database for Organic Compounds, AIST) |
| Mean Absolute Error (MAE) | **0.31 ppm** |
| Signals within ±0.5 ppm | **89%** |

### 3.2 IR benchmark (C=O band) vs NIST

| Metric | Reported value |
|--------|----------------|
| Reference database | **NIST Chemistry WebBook** |
| Mean Absolute Error (MAE) | **11 cm⁻¹** |
| Bands within ±30 cm⁻¹ | **90%** |

### 3.3 Physicochemical properties
Descriptors (molecular weight, formula, LogP, TPSA, HBD/HBA, rings, stereocentres)
are computed with **RDKit MinimalLib** and comparable with **PubChem** and
**DrugBank**. Reproducible verification example: *cholesterol → C₂₇H₄₆O, 4 rings,
8 stereocentres*.

> **Benchmark data source:** measurements carried out by the author as part of
> the undergraduate thesis. The values are to be understood as validation for
> **educational and qualitative functional-group identification** purposes, not
> as a substitute for reference quantum-mechanical calculations.

---

## 4. Cross-device performance

Smoothness tests of the interactive renderers (3D viewers, animations, editor)
across a range of devices:

| Device | Result |
|--------|--------|
| iPhone / iPad | 30–60 fps |
| Windows / macOS laptop | 60 fps |
| Raspberry Pi 4 | 30–60 fps |

Size of the main `index.html` file: **≈ 4.5 MB** (the full package, including
WASM modules and 3D assets, is larger but remains entirely static and cacheable
offline).

---

## 5. Declared model limitations

In line with the principle of scientific transparency:

1. **Additivity model.** The NMR/IR predictors sum group contributions and do
   **not** fully model extended chemical-environment effects (long conjugation,
   anisotropic effects, intramolecular hydrogen bonds). Larger deviations are
   expected e.g. for **strongly conjugated carbonyls** or edge cases such as
   **formic acid**.
2. **Qualitative/educational spectra.** The simulated spectra serve to recognise
   functional groups and understand structure–spectrum relationships, not to
   replace certified experimental data.
3. **Network dependency for some functions.** IUPAC/common name, CAS number, GHS
   pictograms and real 3D models come from PubChem: without network the app shows
   a fallback and remains fully functional on local data.
4. **Two-way accuracy.** For rigorous use, direct links to the official databases
   (NIST, SDBS, MassBank, nmrshiftdb2) are integrated into the interface.

---

## 6. Release acceptance criteria

- ✅ `node --check` passes without errors on the modified modules.
- ✅ Playwright E2E: 0 non-network JS errors.
- ✅ No visible regression in the touched sections.
- ✅ Service Worker cache version bumped.
- ✅ `tools/verifica-farmaci.js`: no defects; every deviation recorded with its reason.
- ✅ `verifica_guida`: whatever the documentation promises exists in the code.

---

## 7. Verification battery — state at version `bsi-v171`

Verification is no longer only functional end-to-end testing: it includes
benches dedicated to the properties a functional test does not observe
(stability over time, network degradation, data accuracy).

### 7.1 Composition

| Family | Benches | Subject |
|---|---|---|
| **Scientific data** | `verifica-farmaci`, `test_spettri`, `test_assi`, `test_assi_canvas`, `test_costanti`, `audit_dati` | structure vs molecular weight, functional-group recognition, axis conventions, physical constants |
| **AI agent** | `test_ko`, `test_404`, `test_503`, `test_firma`, `test_attesa`, `test_attesalunga`, `test_tetto`, `test_nucleo`, `browser_ko`, `browser_prova` | retired model, CORS, overload, reasoning signatures, token ceiling, long waits, memory of unreachable providers |
| **Stability** | `audit_stabilita`, `audit_promesse`, `audit_quota`, `test_filemanager`, `test_doppioinvio`, `test_sw`, `test_visore3d` | long sessions, rejected promises, exhausted storage, unavailable archive, overlapping submissions, degraded network, WebGL contexts |
| **Interface** | `browser_reset`, `browser_proxy`, `browser_proxyui`, `browser_rdkit`, `browser_lab`, `browser_frontiera`, `test_aggiorna`, `test_guidaproxy` | panels, proxy, RDKit laboratory, updates |
| **Consistency** | `verifica_guida` | documentation ⟷ code correspondence, conflict markers across 58 files |

### 7.2 Properties verified that a functional test does not observe

| Property | Method | Measured result |
|---|---|---|
| Absence of memory leaks | 87 sections opened for 5 rounds, DOM node count per round | construction +26,876 nodes on the first round, **+0 on the four that follow** |
| Survival of exhausted storage | `localStorage.setItem` forced to throw | 10 pages out of 10 stay operational |
| Network degradation (≠ no network) | requests held for 20 s, interception at context level | answer served from cache in **3,507 ms** (threshold 3,500 ms) |
| Spectrum reproducibility | drawn twice, compared byte for byte | identical |
| WebGL contexts | viewer constructions counted across 10 molecules | from 7 down to **1** |

### 7.3 Notes on method

**A bench that measures nothing passes**, and that is the most insidious way to
obtain a false guarantee. While the battery was being built, several cases of
vacuous measurement were found and corrected, among them:

- Playwright's `page.route` does **not** intercept requests originated by the
  Service Worker: `context.route` is required. With the former, the "degraded
  network" test was measuring a perfectly healthy network and concluding in
  16 ms.
- Probing `localStorage` exhaustion with a one-byte write proves nothing: after
  saturation, one byte always finds room.
- The ticks of an axis drawn on `<canvas>` are not readable as text: they must
  be collected by intercepting `fillText`, and the bottom-most line is the axis
  *title*, not a tick.

Hence the rule adopted: **every bench that simulates a condition must count how
many times the simulation actually fired**, and fail if that count is zero.
