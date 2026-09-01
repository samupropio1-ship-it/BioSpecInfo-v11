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
