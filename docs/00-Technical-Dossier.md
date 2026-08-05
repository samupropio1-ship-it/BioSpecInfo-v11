# BioSpecInfo — Dossier Tecnico

**Piattaforma web open-access per la chimica computazionale e la fruizione
interattiva di dati chimici su qualsiasi dispositivo.**

| | |
|---|---|
| **Autore** | Samuele Pio Provenzano |
| **Relatore tesi** | Prof. Savino Longo — Università degli Studi di Bari Aldo Moro |
| **Profilo** | Cheminformatics Engineer / Scientific Software Developer |
| **Tipo software** | Progressive Web App (PWA) client-side, local-first, offline-first |
| **Demo live** | https://samupropio1-ship-it.github.io/BioSpecInfo-v11/ |
| **Repository** | github.com/samupropio1-ship-it/BioSpecInfo-v11 |

> Questo dossier riassume l'applicazione ed è la copertina della documentazione
> tecnica completa (SAD, Validation & Benchmark, Security & Compliance, Licensing)
> allegata di seguito.

---

## 1. Executive summary

BioSpecInfo è una piattaforma di **chemioinformatica interattiva** che esegue
l'intera logica scientifica **nel browser del client**, senza alcun server:
analisi molecolare, predizione spettrale, modellistica 2D/3D e strumenti
didattici, il tutto **gratuito, installabile come app e funzionante offline**.

Il valore distintivo è la **rara combinazione tra chimica avanzata e ingegneria
del software moderna** (WebAssembly, WebGL, PWA), con predittori spettrali
**validati quantitativamente** contro i database ufficiali SDBS e NIST.

---

## 2. Product factsheet

**Value proposition** — Una piattaforma web da **≈4,5 MB** (file principale) che
esegue analisi molecolari, predizioni spettrali e visualizzazioni 3D **a costo
server zero** e **100% offline-ready**.

| Architettura tecnica | Contenuti & capacità |
|----------------------|----------------------|
| Client-side / Local-First (nessun backend) | Motore chemioinformatico **RDKit** (WebAssembly) |
| Single-file HTML5 / ES6, installabile come **PWA** | **Centro Spettri**: IR, ¹H/¹³C-NMR, MS + pattern isotopico, UV-Vis, Raman |
| Rendering **2D** (SVG/Canvas) e **3D** (three.js, 3Dmol.js) | **Chimica Organica**: 25 moduli interattivi |
| **Service Worker** offline-first, versionato | **Retrosintesi**: 46 strategie + meccanismi animati 2D/3D |
| Zero dipendenze copyleft (solo MIT/BSD-3) | **Atlante Farmaci 3D**: 63 malattie (23 tumori), organi 3D, PubMed |
| Storage locale (localStorage, SQLite via sql.js) | Astrochimica 3D, Lab Quantistico, Accademia (quiz SM-2) |

**Validazione quantitativa (benchmark di tesi)**
- **¹H-NMR** vs SDBS → **MAE 0,31 ppm** (89% dei segnali entro ±0,5 ppm)
- **IR (banda C=O)** vs NIST WebBook → **MAE 11 cm⁻¹** (90% entro ±30 cm⁻¹)
- Prestazioni interattive **30–60 fps** da iPhone/iPad a Raspberry Pi 4

---

## 3. Capacità verificate (stato attuale del codice)

**Centro Spettri (editor & analisi molecolare)** — disegno da zero (tavola
periodica completa, template, drag-to-bond) o caricamento via SMILES/libreria →
- Tutte le notazioni chimiche: formula, SMILES canonico, CXSMILES, SMARTS,
  InChI, InChIKey, mol block, nome comune/IUPAC, CAS (con copia rapida).
- Spettri predetti con fonti bibliografiche; **pattern isotopico** (abbondanze
  IUPAC) e **masse degli addotti** MS.
- Gruppi funzionali e proprietà (donatori/accettori H, aromatici, rotabili,
  stereocentri) **evidenziabili su struttura 2D e 3D**.
- Drug-likeness: **Lipinski, Veber, Egan, Ghose, Muegge**, solubilità ESOL,
  **QED**, **alert strutturali Brenk/PAINS**, radar fisico-chimico.
- Similarità di **Tanimoto** (fingerprint Morgan ECFP4), analisi elementare,
  ricerca per sottostruttura SMARTS, export SVG/PNG/MOL.

**Sintesi & Retrosintesi** — 46 strategie con **player animato del meccanismo**
in **2D e 3D**: frecce di *electron pushing*, intermedi di reazione, e modalità
retrosintesi con **formazione dei sintoni**.

**Chimica Organica** — 25 moduli (fondamenti → eterocicli, pericicliche &
Woodward–Hoffmann, organometallici & cross-coupling, radicali, spettroscopia,
retrosintesi & gruppi protettivi).

**Data Science** — Atlante 3D dei Farmaci (13 zone del corpo, 63 malattie di cui
23 tumori, modelli 3D degli organi, link PubMed), laboratori ML, playground SQL.

**Altro** — Astrochimica 3D, Lab Quantistico, Accademia con ripetizione spaziata
(SM-2), simulazioni interattive, database di elementi/farmaci/biomolecole.

> Metriche complessive dichiarate nella tesi (patrimonio dati storico): 324
> reazioni organiche in grafica vettoriale SVG, 26 vie biosintetiche, 140+
> farmaci, 80+ biomolecole, 118 elementi, 10 simulatori quantistici.

---

## 4. Stack tecnologico

`HTML5` · `ES6/ESNext` · `WebAssembly` (RDKit MinimalLib, sql.js/SQLite) ·
`WebGL` (three.js, 3Dmol.js) · `SVG`/`Canvas 2D` · `Service Worker` / `PWA` ·
integrazione API pubbliche (PubChem PUG-REST, NIST, SDBS, MassBank, nmrshiftdb2,
NASA/ESA).

---

## 5. Dichiarazione dell'autore (self-attestation)

Il sottoscritto **Samuele Pio Provenzano** dichiara che:
1. Il software **BioSpecInfo** è **opera originale** dell'autore, ad eccezione
   delle librerie open-source di terze parti (RDKit, 3Dmol.js, three.js,
   SmilesDrawer, sql.js) utilizzate secondo le rispettive licenze permissive e
   documentate nella *Open-Source Licensing & IP Matrix*.
2. I dati di validazione riportati (MAE 0,31 ppm per ¹H-NMR vs SDBS; MAE 11 cm⁻¹
   per la banda IR C=O vs NIST) sono stati misurati dall'autore nell'ambito del
   lavoro di tesi; i predittori sono **euristici ad additività di gruppo**,
   idonei all'uso didattico e all'identificazione qualitativa dei gruppi
   funzionali, con i limiti dichiarati nel *Validation Report*.
3. L'architettura è **local-first**: nessun dato personale dell'utente è
   trasmesso a server dell'autore (allineamento ai principi GDPR).

> Questa è una **dichiarazione dell'autore**, non una certificazione rilasciata
> da un ente terzo.

---

## 6. Documentazione allegata

1. **Software Architecture Document (SAD)** — architettura, componenti, tecnologie.
2. **Verification & Validation & Benchmark Report** — metodo di test, benchmark, limiti.
3. **Security, Privacy & Compliance** — local-first, GDPR, OWASP, GAMP 5 (allineamento).
4. **Open-Source Licensing & IP Matrix** — dipendenze, licenze, proprietà intellettuale.

_Licenza del software: proprietaria — "All rights reserved" (vedi `LICENSE`)._
