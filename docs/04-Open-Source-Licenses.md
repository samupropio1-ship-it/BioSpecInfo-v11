# Open-Source Licensing & IP Compliance Matrix — BioSpecInfo

| Campo | Valore |
|-------|--------|
| **Software** | BioSpecInfo |
| **Autore / titolare del codice proprietario** | Samuele Pio Provenzano |

---

## 1. Matrice delle dipendenze di terze parti

Tutte le librerie di terze parti incluse sono **open-source con licenze
permissive** (MIT / BSD-3-Clause). **Nessuna dipendenza copyleft virale
(GPL / AGPL / LGPL)** è utilizzata, quindi non vi sono obblighi di
ridistribuzione del codice proprietario.

| Componente | File nel repo | Uso | Licenza |
|-----------|---------------|-----|---------|
| **RDKit** (MinimalLib / rdkit-js) | `RDKit_minimal.js`, `RDKit_minimal.wasm` | Motore chemioinformatico (SMILES/InChI/InChIKey/SMARTS, descrittori, fingerprint, depiction 2D) | **BSD-3-Clause** |
| **3Dmol.js** | `3Dmol-min.js` | Viewer 3D di molecole/macromolecole (WebGL) | **BSD-3-Clause** |
| **three.js** | `three.min.js`, `three_bloom.js`, `gltf_loader.js` | Rendering 3D WebGL (anatomia, astrochimica, meccanismi) | **MIT** |
| **SmilesDrawer** | `smiles-drawer.min.js` | Depiction 2D di stringhe SMILES | **MIT** |
| **sql.js** (SQLite compilato in WASM) | `lib/sql-wasm.js`, `lib/sql-wasm.wasm` | Playground SQL client-side | **MIT** |

> Le versioni esatte sono quelle dei file inclusi nel repository. Ogni licenza
> permissiva richiede la conservazione dell'avviso di copyright originale, che va
> mantenuto nei file di libreria o in un file `THIRD_PARTY_NOTICES`.

---

## 2. Servizi/API esterni (non ridistribuiti)

Questi servizi sono interpellati via rete a runtime (dati non inclusi nel
pacchetto): il loro uso è soggetto ai rispettivi termini.

| Servizio | Uso |
|----------|-----|
| **PubChem PUG-REST** (NIH/NCBI) | Nome IUPAC/comune, CAS, formula, modelli 3D SDF, pittogrammi GHS/CLP |
| **NIST WebBook · SDBS · MassBank · nmrshiftdb2 · SpectraBase** | Link a spettri sperimentali di riferimento |
| **NASA / ESA** | Immagini e dati astronomici (sezione Astrochimica) |

---

## 3. Proprietà intellettuale del codice proprietario

- Il codice applicativo di BioSpecInfo (logica dell'interfaccia, engine
  vettoriale SVG dei meccanismi, viewer stereochimico CIP in Canvas, predittori
  spettrali euristici, contenuti didattici, database interni) è **opera
  originale dell'autore**, salvo le librerie di terze parti sopra elencate.
- **Nessun codice sotto licenza copyleft** è incorporato nel sorgente
  proprietario: l'autore mantiene piena libertà di licenza sul proprio codice.

### 3.1 Licenza del progetto
Il repository include un file [`LICENSE`](../LICENSE) **proprietario — "All
rights reserved"**: il codice è visibile e valutabile (studio personale e
valutazione professionale/accademica), ma **copia, modifica, ridistribuzione e
uso commerciale richiedono l'autorizzazione scritta dell'Autore**. Questa scelta
protegge il progetto da riusi non autorizzati pur mantenendolo mostrabile a
recruiter e aziende. I componenti di terze parti restano soggetti alle loro
licenze permissive.

---

## 4. Riepilogo compliance

| Voce | Esito |
|------|-------|
| Dipendenze copyleft virali (GPL/AGPL) | **Assenti** |
| Licenze delle dipendenze | Permissive (MIT / BSD-3-Clause) |
| Obbligo di conservare gli avvisi di copyright | Sì (nei file di libreria / NOTICES) |
| Libertà di licenza sul codice proprietario | Piena |
| File `LICENSE` del progetto | ✅ Presente — proprietaria «All rights reserved» |
