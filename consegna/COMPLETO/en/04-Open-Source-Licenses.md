# Open-Source Licensing & IP Compliance Matrix — BioSpecInfo

| Field | Value |
|-------|-------|
| **Software** | BioSpecInfo |
| **Author / owner of proprietary code** | Samuele Pio Provenzano |

---

## 1. Third-party dependency matrix

All bundled third-party libraries are **open-source under permissive licenses**
(MIT / BSD-3-Clause). **No viral copyleft dependency (GPL / AGPL / LGPL)** is
used, so there are no obligations to redistribute the proprietary code.

| Component | Repo file | Use | License |
|-----------|-----------|-----|---------|
| **RDKit** (MinimalLib / rdkit-js) | `RDKit_minimal.js`, `RDKit_minimal.wasm` | Cheminformatics engine (SMILES/InChI/InChIKey/SMARTS, descriptors, fingerprints, 2D depiction) | **BSD-3-Clause** |
| **3Dmol.js** | `3Dmol-min.js` | 3D viewer for molecules/macromolecules (WebGL) | **BSD-3-Clause** |
| **three.js** | `three.min.js`, `three_bloom.js`, `gltf_loader.js` | WebGL 3D rendering (anatomy, astrochemistry, mechanisms) | **MIT** |
| **SmilesDrawer** | `smiles-drawer.min.js` | 2D depiction of SMILES strings | **MIT** |
| **sql.js** (SQLite compiled to WASM) | `lib/sql-wasm.js`, `lib/sql-wasm.wasm` | Client-side SQL playground | **MIT** |
| **PDF.js** | `vendor/pdfjs/` | Opening PDF documents in the spectrum reader: every page drawn and its text layer | **Apache-2.0** |

> The exact versions are those of the files included in the repository. Each
> permissive license requires preserving the original copyright notice, which
> must be kept in the library files or in a `THIRD_PARTY_NOTICES` file.

---

### 1.1 Third-party 3D models (ATOMIC PROTOCOL, first person)

| File | Work | Author | Licence | Obligations |
|------|------|--------|---------|-------------|
| `models/mani-atomic.glb` | hands animation | hugo colauto (Sketchfab) | Sketchfab Standard | use within the work; do not redistribute the model on its own — to be checked with the author before publication |
| `models/manica-atomic.glb` | Modern Scientist in a Lab Coat (crop) | restore50 (Sketchfab) | CC-BY 4.0 | attribution and notice of changes: in the game's Codex and in `models/CREDITS.md` |
| `models/pistola-atomic.glb` | Capsule Gun | sc8di (Sketchfab) | CC-BY 4.0 | attribution and notice of changes: in the game's Codex and in `models/CREDITS.md` |

The derivatives are produced by `tools/prepara-modelli.js`; the entries with their SHA-256 digests are in the SBOM (`docs/07`).

## 2. External services/APIs (not redistributed)

These services are queried over the network at runtime (their data is not part of
the package); their use is subject to the respective terms.

| Service | Use |
|---------|-----|
| **PubChem PUG-REST** (NIH/NCBI) | IUPAC/common name, CAS, formula, 3D SDF models, GHS/CLP pictograms |
| **NIST WebBook · SDBS · MassBank · nmrshiftdb2 · SpectraBase** | Links to reference experimental spectra |
| **NASA / ESA** | Astronomical images and data (Astrochemistry section) |

---

## 3. Intellectual property of the proprietary code

- BioSpecInfo's application code (UI logic, the proprietary SVG mechanism engine,
  the CIP stereochemistry viewer in Canvas, the heuristic spectral predictors,
  the educational content, the internal databases) is the **author's original
  work**, except for the third-party libraries listed above.
- **No copyleft-licensed code** is embedded in the proprietary source: the author
  retains full licensing freedom over their own code.

### 3.1 Project license
The repository includes a **proprietary — "All rights reserved"**
[`LICENSE`](../LICENSE) file: the code is viewable and assessable (personal
study and professional/academic evaluation), but **copying, modification,
redistribution and commercial use require the Author's written permission**.
This choice protects the project from unauthorised reuse while keeping it
presentable to recruiters and companies. Third-party components remain governed
by their permissive licenses.

---

## 4. Compliance summary

| Item | Result |
|------|--------|
| Viral copyleft dependencies (GPL/AGPL) | **None** |
| Dependency licenses | Permissive (MIT / BSD-3-Clause) |
| Obligation to keep copyright notices | Yes (in library files / NOTICES) |
| Licensing freedom over proprietary code | Full |
| Project `LICENSE` file | ✅ Present — proprietary "All rights reserved" |
