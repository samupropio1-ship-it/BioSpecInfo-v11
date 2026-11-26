# Open-Source Licensing & IP Compliance Matrix — BioSpecInfo

| Campo | Valore |
|-------|--------|
| **Software** | BioSpecInfo |
| **Autore / titolare del codice proprietario** | Samuele Pio Provenzano |

---

## 1. Matrice delle dipendenze di terze parti

Quasi tutte le librerie di terze parti incluse sono **open-source con licenze
permissive** (MIT / BSD-3-Clause / Apache-2.0). Fa **eccezione la voce integrata
offline** (meSpeak/eSpeak, `vendor/mespeak/`), sotto **GPL-3.0** — una licenza
copyleft forte. La GPL si applica **soltanto a quel componente**, usato come
libreria separata attraverso la sua interfaccia pubblica: non estende la GPL al
resto dell'applicazione (vedi §3).

| Componente | File nel repo | Uso | Licenza |
|-----------|---------------|-----|---------|
| **RDKit** (MinimalLib / rdkit-js) | `RDKit_minimal.js`, `RDKit_minimal.wasm` | Motore chemioinformatico (SMILES/InChI/InChIKey/SMARTS, descrittori, fingerprint, depiction 2D) | **BSD-3-Clause** |
| **3Dmol.js** | `3Dmol-min.js` | Viewer 3D di molecole/macromolecole (WebGL) | **BSD-3-Clause** |
| **three.js** | `three.min.js`, `three_bloom.js`, `gltf_loader.js` | Rendering 3D WebGL (anatomia, astrochimica, meccanismi) | **MIT** |
| **SmilesDrawer** | `smiles-drawer.min.js` | Depiction 2D di stringhe SMILES | **MIT** |
| **sql.js** (SQLite compilato in WASM) | `lib/sql-wasm.js`, `lib/sql-wasm.wasm` | Playground SQL client-side | **MIT** |
| **PDF.js** | `vendor/pdfjs/` | Apertura dei documenti PDF nel lettore di spettri: ogni pagina disegnata e il suo strato di testo | **Apache-2.0** |
| **meSpeak.js + eSpeak** | `vendor/mespeak/` | Voce integrata offline di Spectra: motore TTS a formanti compilato in JavaScript, ripiego quando il dispositivo non ha voci di sistema | **GPL-3.0** |

> Le versioni esatte sono quelle dei file inclusi nel repository. Ogni licenza
> permissiva richiede la conservazione dell'avviso di copyright originale
> (raccolto in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)). Per la voce
> integrata, il testo completo della GPL è in
> [`vendor/mespeak/COPYING-GPL-3.0.txt`](https://github.com/samupropio1-ship-it/BioSpecInfo-v11/blob/main/vendor/mespeak/COPYING-GPL-3.0.txt) e
> la nota di componente in [`vendor/mespeak/NOTICE.md`](https://github.com/samupropio1-ship-it/BioSpecInfo-v11/blob/main/vendor/mespeak/NOTICE.md).

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
- **Nessun codice sotto licenza copyleft è incorporato NEL sorgente
  proprietario**: il codice dell'autore non deriva da eSpeak né lo ingloba. La
  voce integrata (meSpeak/eSpeak, GPL-3.0) è un componente **separato**, caricato
  come libreria a sé e invocato solo tramite la sua interfaccia pubblica
  (`meSpeak.loadConfig` / `loadVoice` / `speak`). Resta sotto GPL (il suo sorgente
  è incluso, nella forma distribuita); chi ridistribuisce l'applicazione deve
  mantenerlo sotto GPL. L'autore mantiene piena libertà di licenza sul **proprio**
  codice, che non è un'opera derivata di quel componente.

### 3.1 Licenza del progetto
Il repository include un file [`LICENSE`](LICENSE) **proprietario — "All
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
| Dipendenze copyleft forti (GPL/AGPL) | **Una**: la voce integrata offline (meSpeak/eSpeak, GPL-3.0), usata come libreria separata |
| Licenze delle dipendenze | Permissive (MIT / BSD-3-Clause / Apache-2.0), tranne la voce integrata (GPL-3.0) |
| Obbligo di conservare gli avvisi di copyright | Sì (nei file di libreria / `THIRD_PARTY_NOTICES.md`) |
| Obbligo per la voce integrata | Mantenerla sotto GPL-3.0 e conservarne il sorgente (incluso in `vendor/mespeak/`) |
| Libertà di licenza sul codice proprietario | Piena (non è opera derivata della voce integrata) |
| File `LICENSE` del progetto | ✅ Presente — proprietaria «All rights reserved» |
