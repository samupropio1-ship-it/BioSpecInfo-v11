# Software Architecture Document (SAD) — BioSpecInfo

| Campo | Valore |
|-------|--------|
| **Progetto** | BioSpecInfo |
| **Autore** | Samuele Pio Provenzano |
| **Relatore tesi** | Prof. Savino Longo — Università degli Studi di Bari Aldo Moro |
| **Tipo** | Progressive Web App (PWA) client-side, local-first, offline-first |
| **Piattaforma** | Browser moderni (Chromium, Firefox, Safari/WebKit) · Desktop e Mobile |
| **Repository** | `samupropio1-ship-it/BioSpecInfo-v11` |

---

## 1. Panoramica del sistema

BioSpecInfo è una piattaforma web **monolitica e modulare** che esegue l'intera
logica applicativa nel browser del client, senza alcun server applicativo. È
distribuita come **Progressive Web App** installabile (manifest `display:
standalone`) e funziona **offline** grazie a un Service Worker con precache
delle risorse pesanti.

**Pattern architetturale:** Single-Page/Single-File Application + Sub-App
satellite in iframe, con un *core* chemioinformatico basato su WebAssembly
disaccoppiato dalla logica di presentazione.

### 1.1 Principi guida
- **Local-First:** dati e calcoli risiedono sul dispositivo; nessuna
  trasmissione obbligatoria verso terzi.
- **Zero-backend:** nessun database server, nessun costo di hosting dinamico
  (pubblicabile su hosting statico, es. GitHub Pages).
- **Progressive enhancement:** le funzioni online (ricerca PubChem, modelli 3D
  reali, immagini astronomiche) degradano con eleganza in assenza di rete.

---

## 2. Struttura dei file

| File | Ruolo |
|------|-------|
| `index.html` | Applicazione principale (core chimico, Centro Spettri, Data Science, menu ✨). ~4,5 MB, oltre 43.000 righe. |
| `chimorga.html` | Corso di Chimica Organica (25 moduli). |
| `astro.html` | Astrochimica 3D (three.js). |
| `pro.html`, `rdkit_lab.html`, `accademia.html`, `simulazioni.html`, `guidaret.html`, `file_manager.html`, `Biochimica_Guida_Definitiva.html`, `sr_completo.html`, `sr_essenziale.html`, `download.html`, `changelog_tesi.html` | Sotto-applicazioni tematiche caricate in iframe con cache-busting `?v=timestamp`. |
| `manifest.json` | Configurazione PWA (icone, tema, standalone). |
| `sw.js` | Service Worker: strategia *network-first* con fallback su cache; precache delle librerie e degli asset pesanti; versione cache incrementata a ogni release. |
| `RDKit_minimal.js` / `RDKit_minimal.wasm` | Motore chemioinformatico (RDKit MinimalLib). |
| `3Dmol-min.js` | Viewer 3D di macromolecole/molecole. |
| `three.min.js`, `three_bloom.js`, `gltf_loader.js` | Rendering 3D WebGL (anatomia, astrochimica, meccanismi). |
| `smiles-drawer.min.js` | Depiction 2D di SMILES. |
| `lib/sql-wasm.js` / `lib/sql-wasm.wasm` | SQLite in WebAssembly (playground SQL). |
| `models/`, `textures/` | Asset 3D (organi, ecorché, pianeti) e texture. |

---

## 3. Architettura a componenti

```
┌───────────────────────────────────────────────────────────────────┐
│                         BROWSER (client)                          │
│                                                                   │
│  ┌───────────────┐   ┌──────────────────────────────────────────┐ │
│  │  UI / Router  │   │           CORE CHEMICO                    │ │
│  │  (sezioni,    │──▶│  RDKit MinimalLib (WASM):                 │ │
│  │   menu ✨,    │   │   SMILES/InChI/InChIKey/SMARTS/mol block, │ │
│  │   nav, iframe)│   │   descrittori, fingerprint, substructure  │ │
│  └───────────────┘   └──────────────────────────────────────────┘ │
│         │                                                          │
│         ▼                                                          │
│  ┌───────────────┐   ┌──────────────────┐   ┌───────────────────┐  │
│  │ Rendering 2D  │   │  Rendering 3D     │   │  Storage locale   │  │
│  │ SVG / Canvas  │   │  three.js (WebGL) │   │  localStorage /   │  │
│  │ smiles-drawer │   │  3Dmol.js (WebGL) │   │  sql.js (SQLite)  │  │
│  └───────────────┘   └──────────────────┘   └───────────────────┘  │
│         │                                                          │
│         ▼                                                          │
│  ┌───────────────────────────────────────────────────────────────┐│
│  │ Service Worker (offline-first, precache, network-first fetch)  ││
│  └───────────────────────────────────────────────────────────────┘│
└───────────────────────────────────────────────────────────────────┘
             │ (solo funzioni online, opzionali)
             ▼
   API pubbliche: PubChem PUG-REST · NASA/ESA · link a database spettrali
```

### 3.1 Module Router / UI
Navigazione tra sezioni tramite classi CSS (`.section.on`) e un menu ✨ (FAB)
che apre gli strumenti speciali (Centro Spettri, Retrosintesi, Lab Quantistico,
Data Science, ecc.). Le sotto-app sono isolate in `iframe` con versionamento.

### 3.2 WebAssembly Engine (RDKit MinimalLib)
Caricato on-demand (`window.bsiLoadRDKit`) con `locateFile` sui file `.wasm`
locali e CDN come sola riserva. Espone:
- **Identificatori:** SMILES canonico/isomerico, CXSMILES, InChI, InChIKey,
  SMARTS, mol block MDL V2000.
- **Descrittori:** peso molecolare, massa esatta monoisotopica, LogP
  (Wildman–Crippen), TPSA, HBD/HBA, legami rotabili, anelli aromatici/alifatici,
  frazione Csp³, rifrattività molare, stereocentri.
- **Fingerprint & similarità:** Morgan ECFP4 (1024 bit) e indice di Tanimoto.
- **Substructure matching** via SMARTS (`get_qmol` + `get_substruct_matches`).
- **Depiction 2D** vettoriale (`get_svg`, `get_svg_with_highlights`) e
  generazione di coordinate 2D (mol block) reimportabili nell'editor.

### 3.3 Rendering
- **2D:** SVG proprietario (meccanismi di reazione con frecce di Bézier),
  Canvas 2D (editor molecolare, viewer stereochimico CIP), smiles-drawer.
- **3D:** `three.js` (WebGL) per anatomia (Atlante Farmaci), astrochimica e
  meccanismi 3D; `3Dmol.js` per i modelli molecolari da SDF PubChem.

### 3.4 Storage Layer
- `localStorage` (con **guardia di sicurezza** e fallback in memoria per
  modalità incognito / storage bloccato).
- `sql.js` (SQLite compilato in WASM) per il playground SQL della sezione Data
  Science.

---

## 4. Funzionalità implementate (stato attuale)

### 4.1 Centro Spettri (editor & analisi molecolare)
Disegno da zero (tavola periodica completa, template di anelli/gruppi,
drag-to-bond con snap) o caricamento via SMILES / libreria (63 molecole) →
analisi completa:
- **Tutte le notazioni chimiche** (formula, SMILES canonico, CXSMILES, SMARTS,
  InChI, InChIKey, mol block, nome comune/IUPAC, CAS) con copia rapida.
- **Spettri predetti** in micro-sezioni: IR, ¹H-NMR, ¹³C-NMR, MS con **pattern
  isotopico** (abbondanze IUPAC) e **masse degli addotti** ([M+H]⁺, [M+Na]⁺…),
  UV-Vis, Raman — ciascuno con fonte bibliografica.
- **Gruppi funzionali** (~30, via SMARTS) e **proprietà** (donatori/accettori H,
  aromatici, rotabili, stereocentri) **evidenziabili su struttura 2D e 3D**.
- **Drug-likeness / ADMET:** regole Lipinski, Veber, Egan, Ghose, Muegge;
  solubilità stimata ESOL; QED (quando esposto dall'engine); **alert
  strutturali Brenk/PAINS**; profilo radar fisico-chimico.
- **Analisi elementare** (% in peso) e **similarità di Tanimoto** con la libreria.
- **Modelli 3D** (ball&stick, spacefill, wireframe) da PubChem; export SVG/PNG/MOL.

### 4.2 Sintesi & Retrosintesi
46 strategie di disconnessione con **player animato del meccanismo** in **2D e
3D**: frecce curve di *electron pushing*, intermedi di reazione, e modalità
retrosintesi con **formazione dei sintoni**.

### 4.3 Chimica Organica (`chimorga.html`)
25 moduli: fondamenti, stereochimica, alcheni/alchini, aromatici e SEA,
SN/E, carbonili, ammine, carboidrati, amminoacidi, lipidi, nucleotidi, sintesi
animate, reazioni nominali, eterocicli, pericicliche & Woodward–Hoffmann,
organometallici & cross-coupling, radicali, spettroscopia, retrosintesi & gruppi
protettivi.

### 4.4 Data Science
Atlante 3D dei Farmaci (13 zone del corpo, 63 malattie di cui 23 tumori, modelli
3D degli organi, link PubMed), laboratori ML interattivi, playground SQL
(sql.js), roadmap corsi.

### 4.5 Altre sezioni
Astrochimica 3D, Lab Quantistico, Accademia (quiz gamificati con ripetizione
spaziata SM-2), simulazioni interattive, guide, database di elementi/farmaci/
biomolecole.

---

## 5. Roadmap architetturale (NON ancora implementata)

Le seguenti voci fanno parte della visione *enterprise/HPC* e richiedono binari,
modelli o pipeline di build esterni non ospitabili in una PWA single-file:

- Parallelismo HPC via Web Workers + `SharedArrayBuffer`/`Atomics`.
- Accelerazione WebGPU per algebra densa/sparsa e inferenza GNN.
- Predittori ML in ONNX Runtime WebGPU (GNN per NMR tipo ShiftML2/DeepNMR;
  hERG, BBB, CYP450, LogS).
- Docking molecolare in-browser (AutoDock Vina/Webina, formato PDBQT).
- Chimica quantistica semi-empirica (xTB/GFN2-xTB in WASM).
- Motore di retrosintesi computazionale basato su regole SMIRKS.
- Database SQLite-WASM su scala 1.000.000 di strutture e batch SDF via Web Worker.
- Visualizzazione immersiva WebXR (VR/AR).
- Packaging nativo (TWA Android, iOS, Electron/Tauri) e pipeline CI/CD.

---

## 6. Requisiti e vincoli

- **Browser:** supporto a WebAssembly e WebGL; JavaScript abilitato.
- **Rete:** non richiesta per il nucleo; consigliata per ricerca PubChem e
  modelli 3D reali.
- **Prestazioni:** target 30–60 fps sui rendering interattivi; i calcoli pesanti
  sono delegati a RDKit WASM e mantenuti reattivi.
