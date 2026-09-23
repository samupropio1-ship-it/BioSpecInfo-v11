# BioSpecInfo — Technical Dossier

**Open-access web platform for computational chemistry and the interactive
consultation of chemical data on any device.**

| | |
|---|---|
| **Author** | Samuele Pio Provenzano |
| **Thesis advisor** | Prof. Savino Longo — University of Bari Aldo Moro |
| **Profile** | Cheminformatics Engineer / Scientific Software Developer |
| **Software type** | Progressive Web App (PWA), client-side, local-first, offline-first |
| **Live demo** | https://samupropio1-ship-it.github.io/BioSpecInfo-v11/ |
| **Repository** | github.com/samupropio1-ship-it/BioSpecInfo-v11 |

> This dossier summarises the application and is the cover of the full technical
> documentation (SAD, Validation & Benchmark, Security & Compliance, Licensing)
> attached below.

---

## 1. Executive summary

BioSpecInfo is an **interactive cheminformatics platform** that runs all of its
scientific logic **in the client browser**, with no server: molecular analysis,
spectral prediction, 2D/3D modelling and educational tools — all **free,
installable as an app and working offline**.

Its distinctive value is the **rare combination of advanced chemistry and modern
software engineering** (WebAssembly, WebGL, PWA), with spectral predictors
**quantitatively validated** against the official SDBS and NIST databases.

---

## 2. Product factsheet

**Value proposition** — A **≈4.5 MB** web platform (main file) that runs
molecular analysis, spectral prediction and 3D visualisation at **zero server
cost** and **100% offline-ready**.

| Technical architecture | Content & capabilities |
|------------------------|------------------------|
| Client-side / Local-First (no backend) | **RDKit** cheminformatics engine (WebAssembly) |
| Single-file HTML5 / ES6, installable as **PWA** | **Spectra Centre**: IR, ¹H/¹³C-NMR, MS + isotope pattern, UV-Vis, Raman |
| **2D** (SVG/Canvas) and **3D** (three.js, 3Dmol.js) rendering | **Organic Chemistry**: 25 interactive modules |
| **Service Worker** offline-first, versioned | **Retrosynthesis**: 46 strategies + animated 2D/3D mechanisms |
| Zero copyleft dependencies (MIT/BSD-3 only) | **3D Drug Atlas**: 63 diseases (23 tumours), 3D organs, PubMed |
| Local storage (localStorage, SQLite via sql.js) | 3D astrochemistry, Quantum Lab, Academy (SM-2 quizzes) |

**Quantitative validation (thesis benchmark)**
- **¹H-NMR** vs SDBS → **MAE 0.31 ppm** (89% of signals within ±0.5 ppm)
- **IR (C=O band)** vs NIST WebBook → **MAE 11 cm⁻¹** (90% within ±30 cm⁻¹)
- Interactive performance **30–60 fps** from iPhone/iPad to Raspberry Pi 4

---

## 3. Verified capabilities (current code state)

**Spectra Centre (molecular editor & analysis)** — draw from scratch (full
periodic table, templates, drag-to-bond) or load via SMILES/library →
- All chemical notations: formula, canonical SMILES, CXSMILES, SMARTS, InChI,
  InChIKey, mol block, common/IUPAC name, CAS (one-click copy).
- Predicted spectra with bibliographic sources; **isotope pattern** (IUPAC
  abundances) and MS **adduct masses**.
- Functional groups and properties (H donors/acceptors, aromatic, rotatable,
  stereocentres) **highlightable on the 2D and 3D structure**.
- Drug-likeness: **Lipinski, Veber, Egan, Ghose, Muegge**, ESOL solubility,
  **QED**, **Brenk/PAINS structural alerts**, physicochemical radar.
- **Tanimoto** similarity (Morgan ECFP4 fingerprint), elemental analysis, SMARTS
  substructure search, SVG/PNG/MOL export.

**Synthesis & Retrosynthesis** — 46 strategies with an **animated mechanism
player** in **2D and 3D**: *electron-pushing* arrows, reaction intermediates, and
a retrosynthesis mode showing **synthon formation**.

**Organic Chemistry** — 25 modules (fundamentals → heterocycles, pericyclic &
Woodward–Hoffmann, organometallics & cross-coupling, radicals, spectroscopy,
retrosynthesis & protecting groups).

**Data Science** — 3D Drug Atlas (13 body regions, 63 diseases of which 23
tumours, 3D organ models, PubMed links), ML labs, SQL playground.

**Other** — 3D astrochemistry, Quantum Lab, Academy with spaced repetition
(SM-2), interactive simulations, databases of elements/drugs/biomolecules.

> Overall metrics declared in the thesis (historical data assets): 324 organic
> reactions in vector SVG graphics, 26 biosynthetic pathways, 140+ drugs, 80+
> biomolecules, 118 elements, 10 quantum simulators.

---

## 4. Technology stack

`HTML5` · `ES6/ESNext` · `WebAssembly` (RDKit MinimalLib, sql.js/SQLite) ·
`WebGL` (three.js, 3Dmol.js) · `SVG`/`Canvas 2D` · `Service Worker` / `PWA` ·
public API integration (PubChem PUG-REST, NIST, SDBS, MassBank, nmrshiftdb2,
NASA/ESA).

---

## 5. Author's declaration (self-attestation)

The undersigned **Samuele Pio Provenzano** declares that:
1. The software **BioSpecInfo** is the author's **original work**, except for the
   third-party open-source libraries (RDKit, 3Dmol.js, three.js, SmilesDrawer,
   sql.js) used under their respective permissive licenses and documented in the
   *Open-Source Licensing & IP Matrix*.
2. The reported validation data (MAE 0.31 ppm for ¹H-NMR vs SDBS; MAE 11 cm⁻¹ for
   the IR C=O band vs NIST) were measured by the author as part of the thesis
   work; the predictors are **heuristic group-additivity** models, suitable for
   educational use and qualitative functional-group identification, with the
   limitations stated in the *Validation Report*.
3. The architecture is **local-first**: no user personal data is transmitted to
   author-controlled servers (alignment with GDPR principles).

> This is an **author's declaration**, not a certification issued by a third
> party.

---

## 6. Attached documentation

1. **Software Architecture Document (SAD)** — architecture, components, technologies.
2. **Verification & Validation & Benchmark Report** — test method, benchmarks, limitations.
3. **Security, Privacy & Compliance** — local-first, GDPR, OWASP, GAMP 5 (alignment).
4. **Open-Source Licensing & IP Matrix** — dependencies, licenses, intellectual property.

_Software license: proprietary — "All rights reserved" (see `LICENSE`)._
