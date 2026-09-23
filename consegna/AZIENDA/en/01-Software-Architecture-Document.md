# Software Architecture Document (SAD) — BioSpecInfo

| Field | Value |
|-------|-------|
| **Project** | BioSpecInfo |
| **Author** | Samuele Pio Provenzano |
| **Thesis advisor** | Prof. Savino Longo — University of Bari Aldo Moro |
| **Type** | Progressive Web App (PWA), client-side, local-first, offline-first |
| **Platform** | Modern browsers (Chromium, Firefox, Safari/WebKit) · Desktop and Mobile |
| **Repository** | `samupropio1-ship-it/BioSpecInfo-v11` |

---

## 1. System overview

BioSpecInfo is a **monolithic yet modular** web platform that runs all of its
application logic inside the client browser, with no application server. It is
distributed as an installable **Progressive Web App** (`display: standalone`)
and works **offline** thanks to a Service Worker that precaches the heavy assets.

**Architectural pattern:** Single-Page/Single-File Application + satellite
sub-apps in iframes, with a WebAssembly-based cheminformatics *core* decoupled
from the presentation logic.

### 1.1 Guiding principles
- **Local-First:** data and computations live on the device; no mandatory
  transmission to third parties.
- **Zero-backend:** no server database, no dynamic hosting cost (deployable on
  static hosting, e.g. GitHub Pages).
- **Progressive enhancement:** online features (PubChem search, real 3D models,
  astronomical imagery) degrade gracefully when offline.

---

## 2. File structure

| File | Role |
|------|------|
| `index.html` | Main application (chemistry core, Spectra Centre, Data Science, ✨ menu). ~4.5 MB, over 43,000 lines. |
| `chimorga.html` | Organic Chemistry course (25 modules). |
| `astro.html` | 3D Astrochemistry (three.js). |
| `pro.html`, `rdkit_lab.html`, `accademia.html`, `simulazioni.html`, `guidaret.html`, `file_manager.html`, `Biochimica_Guida_Definitiva.html`, `sr_completo.html`, `sr_essenziale.html`, `download.html`, `changelog_tesi.html` | Thematic sub-apps loaded in iframes with `?v=timestamp` cache-busting. |
| `manifest.json` | PWA configuration (icons, theme, standalone). |
| `sw.js` | Service Worker: *network-first* strategy with cache fallback; precache of heavy libraries/assets; cache version bumped on every release. |
| `RDKit_minimal.js` / `RDKit_minimal.wasm` | Cheminformatics engine (RDKit MinimalLib). |
| `3Dmol-min.js` | 3D viewer for molecules/macromolecules. |
| `three.min.js`, `three_bloom.js`, `gltf_loader.js` | WebGL 3D rendering (anatomy, astrochemistry, mechanisms). |
| `smiles-drawer.min.js` | 2D depiction of SMILES. |
| `lib/sql-wasm.js` / `lib/sql-wasm.wasm` | SQLite in WebAssembly (SQL playground). |
| `models/`, `textures/` | 3D assets (organs, écorché, planets) and textures. |

---

## 3. Component architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                          BROWSER (client)                         │
│                                                                   │
│  ┌───────────────┐   ┌──────────────────────────────────────────┐ │
│  │  UI / Router  │   │            CHEMISTRY CORE                 │ │
│  │  (sections,   │──▶│  RDKit MinimalLib (WASM):                 │ │
│  │   ✨ menu,     │   │   SMILES/InChI/InChIKey/SMARTS/mol block, │ │
│  │   nav, iframe)│   │   descriptors, fingerprints, substructure │ │
│  └───────────────┘   └──────────────────────────────────────────┘ │
│         │                                                          │
│         ▼                                                          │
│  ┌───────────────┐   ┌──────────────────┐   ┌───────────────────┐  │
│  │ 2D rendering  │   │  3D rendering     │   │  Local storage    │  │
│  │ SVG / Canvas  │   │  three.js (WebGL) │   │  localStorage /   │  │
│  │ smiles-drawer │   │  3Dmol.js (WebGL) │   │  sql.js (SQLite)  │  │
│  └───────────────┘   └──────────────────┘   └───────────────────┘  │
│         │                                                          │
│         ▼                                                          │
│  ┌───────────────────────────────────────────────────────────────┐│
│  │ Service Worker (offline-first, precache, network-first fetch)  ││
│  └───────────────────────────────────────────────────────────────┘│
└───────────────────────────────────────────────────────────────────┘
             │ (online features only, optional)
             ▼
   Public APIs: PubChem PUG-REST · NASA/ESA · links to spectral databases
```

### 3.1 Module Router / UI
Navigation between sections via CSS classes (`.section.on`) and a ✨ menu (FAB)
that opens the special tools (Spectra Centre, Retrosynthesis, Quantum Lab, Data
Science, etc.). Sub-apps are isolated in versioned `iframe`s.

### 3.2 WebAssembly Engine (RDKit MinimalLib)
Loaded on demand (`window.bsiLoadRDKit`) with `locateFile` pointing to the local
`.wasm` files and a CDN as a last-resort fallback. It exposes:
- **Identifiers:** canonical/isomeric SMILES, CXSMILES, InChI, InChIKey, SMARTS,
  MDL V2000 mol block.
- **Descriptors:** molecular weight, monoisotopic exact mass, LogP
  (Wildman–Crippen), TPSA, HBD/HBA, rotatable bonds, aromatic/aliphatic rings,
  Fsp³, molar refractivity, stereocentres.
- **Fingerprints & similarity:** Morgan ECFP4 (1024 bit) and the Tanimoto index.
- **Substructure matching** via SMARTS (`get_qmol` + `get_substruct_matches`).
- **2D depiction** (`get_svg`, `get_svg_with_highlights`) and 2D coordinate
  generation (mol block) re-importable into the editor.

### 3.3 Rendering
- **2D:** proprietary SVG (reaction mechanisms with Bézier arrows), Canvas 2D
  (molecule editor, CIP stereochemistry viewer), smiles-drawer.
- **3D:** `three.js` (WebGL) for anatomy (Drug Atlas), astrochemistry and 3D
  mechanisms; `3Dmol.js` for molecular models from PubChem SDF.

### 3.4 Storage Layer
- `localStorage` (with a **safety guard** and in-memory fallback for incognito /
  blocked-storage scenarios).
- `sql.js` (SQLite compiled to WASM) for the Data Science SQL playground.

---

## 4. Implemented features (current state)

### 4.1 Spectra Centre (molecular editor & analysis)
Draw from scratch (full periodic table, ring/group templates, drag-to-bond with
snapping) or load via SMILES / library (63 molecules) → full analysis:
- **All chemical notations** (formula, canonical SMILES, CXSMILES, SMARTS, InChI,
  InChIKey, mol block, common/IUPAC name, CAS) with one-click copy.
- **Predicted spectra** as sub-panels: IR, ¹H-NMR, ¹³C-NMR, MS with **isotope
  pattern** (IUPAC abundances) and **adduct masses** ([M+H]⁺, [M+Na]⁺…), UV-Vis,
  Raman — each with a bibliographic source.
- **Functional groups** (~30, via SMARTS) and **properties** (H donors/acceptors,
  aromatic, rotatable, stereocentres) **highlightable on the 2D and 3D structure**.
- **Drug-likeness / ADMET:** Lipinski, Veber, Egan, Ghose, Muegge rules;
  estimated ESOL solubility; QED (when exposed by the engine); **Brenk/PAINS
  structural alerts**; physicochemical radar profile.
- **Elemental analysis** (weight %) and **Tanimoto similarity** against the library.
- **3D models** (ball & stick, spacefill, wireframe) from PubChem; SVG/PNG/MOL export.

### 4.2 Synthesis & Retrosynthesis
46 disconnection strategies with an **animated mechanism player** in **2D and
3D**: curved *electron-pushing* arrows, reaction intermediates, and a
retrosynthesis mode showing **synthon formation**.

### 4.3 Organic Chemistry (`chimorga.html`)
25 modules: fundamentals, stereochemistry, alkenes/alkynes, aromatics & EAS,
SN/E, carbonyls, amines, carbohydrates, amino acids, lipids, nucleotides,
animated syntheses, named reactions, heterocycles, pericyclic & Woodward–Hoffmann,
organometallics & cross-coupling, radicals, spectroscopy, retrosynthesis &
protecting groups.

### 4.4 Data Science
3D Drug Atlas (13 body regions, 63 diseases of which 23 tumours, 3D organ models,
PubMed links), interactive ML labs, SQL playground (sql.js), course roadmap.

### 4.5 Other sections
3D astrochemistry, Quantum Lab, Academy (gamified quizzes with SM-2 spaced
repetition), interactive simulations, guides, databases of elements/drugs/
biomolecules.

---

## 5. Architectural roadmap (NOT yet implemented)

The following items belong to the *enterprise/HPC* vision and require external
binaries, models or build pipelines that cannot be hosted inside a single-file PWA:

- HPC parallelism via Web Workers + `SharedArrayBuffer`/`Atomics`.
- WebGPU acceleration for dense/sparse algebra and GNN inference.
- ML predictors in ONNX Runtime WebGPU (GNN for NMR such as ShiftML2/DeepNMR;
  hERG, BBB, CYP450, LogS).
- In-browser molecular docking (AutoDock Vina/Webina, PDBQT format).
- Semi-empirical quantum chemistry (xTB/GFN2-xTB in WASM).
- Rule-based computational retrosynthesis engine (SMIRKS).
- SQLite-WASM database at the 1,000,000-structure scale and SDF batch processing
  via Web Workers.
- Immersive WebXR (VR/AR) visualisation.
- Native packaging (Android TWA, iOS, Electron/Tauri) and CI/CD pipelines.

---

## 6. Requirements and constraints

- **Browser:** WebAssembly and WebGL support; JavaScript enabled.
- **Network:** not required for the core; recommended for PubChem search and real
  3D models.
- **Performance:** target 30–60 fps for interactive rendering; heavy computations
  are delegated to RDKit WASM and kept responsive.
