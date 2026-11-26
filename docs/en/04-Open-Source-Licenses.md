# Open-Source Licensing & IP Compliance Matrix — BioSpecInfo

| Field | Value |
|-------|-------|
| **Software** | BioSpecInfo |
| **Author / owner of proprietary code** | Samuele Pio Provenzano |

---

## 1. Third-party dependency matrix

Almost all bundled third-party libraries are **open-source under permissive
licenses** (MIT / BSD-3-Clause / Apache-2.0). The **exception is the built-in
offline voice** (meSpeak/eSpeak, `vendor/mespeak/`), under **GPL-3.0** — a strong
copyleft license. The GPL applies **to that component only**, used as a separate
library through its public interface: it does not extend the GPL to the rest of
the application (see §3).

| Component | Repo file | Use | License |
|-----------|-----------|-----|---------|
| **RDKit** (MinimalLib / rdkit-js) | `RDKit_minimal.js`, `RDKit_minimal.wasm` | Cheminformatics engine (SMILES/InChI/InChIKey/SMARTS, descriptors, fingerprints, 2D depiction) | **BSD-3-Clause** |
| **3Dmol.js** | `3Dmol-min.js` | 3D viewer for molecules/macromolecules (WebGL) | **BSD-3-Clause** |
| **three.js** | `three.min.js`, `three_bloom.js`, `gltf_loader.js` | WebGL 3D rendering (anatomy, astrochemistry, mechanisms) | **MIT** |
| **SmilesDrawer** | `smiles-drawer.min.js` | 2D depiction of SMILES strings | **MIT** |
| **sql.js** (SQLite compiled to WASM) | `lib/sql-wasm.js`, `lib/sql-wasm.wasm` | Client-side SQL playground | **MIT** |
| **PDF.js** | `vendor/pdfjs/` | Opening PDF documents in the spectrum reader: every page drawn and its text layer | **Apache-2.0** |
| **meSpeak.js + eSpeak** | `vendor/mespeak/` | Spectra's built-in offline voice: a formant TTS engine compiled to JavaScript, fallback when the device has no system voices | **GPL-3.0** |

> The exact versions are those of the files included in the repository. Each
> permissive license requires preserving the original copyright notice (collected
> in [`THIRD_PARTY_NOTICES.md`](../../THIRD_PARTY_NOTICES.md)). For the built-in
> voice, the full GPL text is in
> [`vendor/mespeak/COPYING-GPL-3.0.txt`](../../vendor/mespeak/COPYING-GPL-3.0.txt)
> and the component note in [`vendor/mespeak/NOTICE.md`](../../vendor/mespeak/NOTICE.md).

---

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
- **No copyleft-licensed code is embedded IN the proprietary source**: the
  author's code neither derives from nor incorporates eSpeak. The built-in voice
  (meSpeak/eSpeak, GPL-3.0) is a **separate** component, loaded as a standalone
  library and invoked only through its public interface (`meSpeak.loadConfig` /
  `loadVoice` / `speak`). It stays under the GPL (its source is included, in the
  distributed form); anyone redistributing the application must keep it under the
  GPL. The author retains full licensing freedom over their **own** code, which is
  not a work derived from that component.

### 3.1 Project license
The repository includes a **proprietary — "All rights reserved"**
[`LICENSE`](../../LICENSE) file: the code is viewable and assessable (personal
study and professional/academic evaluation), but **copying, modification,
redistribution and commercial use require the Author's written permission**.
This choice protects the project from unauthorised reuse while keeping it
presentable to recruiters and companies. Third-party components remain governed
by their permissive licenses.

---

## 4. Compliance summary

| Item | Result |
|------|--------|
| Strong copyleft dependencies (GPL/AGPL) | **One**: the built-in offline voice (meSpeak/eSpeak, GPL-3.0), used as a separate library |
| Dependency licenses | Permissive (MIT / BSD-3-Clause / Apache-2.0), except the built-in voice (GPL-3.0) |
| Obligation to keep copyright notices | Yes (in library files / `THIRD_PARTY_NOTICES.md`) |
| Obligation for the built-in voice | Keep it under GPL-3.0 and retain its source (included in `vendor/mespeak/`) |
| Licensing freedom over proprietary code | Full (not a work derived from the built-in voice) |
| Project `LICENSE` file | ✅ Present — proprietary "All rights reserved" |
