# BioSpecInfo — Documentazione Tecnica

Documentazione ufficiale della piattaforma **BioSpecInfo**, pensata per la
valutazione tecnica da parte di aziende, centri di ricerca e audit.

## 📨 Da inviare ai colloqui

Per le candidature allega **un solo file**:

- 🇮🇹 **[`docs/pdf/BioSpecInfo-Dossier-Completo.it.pdf`](pdf/BioSpecInfo-Dossier-Completo.it.pdf)** — dossier completo (copertina + SAD + Validazione + Sicurezza + Licenze), 19 pagine.
- 🇬🇧 **[`docs/pdf/BioSpecInfo-Full-Dossier.en.pdf`](pdf/BioSpecInfo-Full-Dossier.en.pdf)** — stesso dossier in inglese.

In alternativa la sola copertina di sintesi: [`00-Dossier.it.pdf`](pdf/00-Dossier.it.pdf) / [`00-Dossier.en.pdf`](pdf/00-Dossier.en.pdf).

**🧑‍💼 Kit candidatura** (CV + lettera di presentazione, IT/EN, con PDF): cartella
[`docs/candidatura/`](candidatura/) — completa i campi tra `[…]` prima di inviare.

**🤖 Scheda progetto Spectra** (agente AI, pronta per il colloquio):
[`docs/candidatura/pdf/Progetto-Spectra-Colloquio.pdf`](candidatura/pdf/Progetto-Spectra-Colloquio.pdf) — 3 pagine.

---

| # | Documento | Contenuto |
|---|-----------|-----------|
| 00 | [Dossier Tecnico (copertina & sintesi)](00-Technical-Dossier.md) | Executive summary, factsheet, capacità, stack, dichiarazione dell'autore |
| 01 | [Software Architecture Document (SAD)](01-Software-Architecture-Document.md) | Architettura, componenti, tecnologie, flussi dati |
| 02 | [Verification & Validation & Benchmark Report](02-Verification-Validation-Report.md) | Metodo di test, benchmark spettrali, prestazioni, limiti dichiarati |
| 03 | [Security, Privacy & Compliance](03-Security-Privacy-Compliance.md) | Modello privacy local-first, OWASP/XSS, allineamento GDPR e GAMP 5 |
| 04 | [Open-Source Licensing & IP Matrix](04-Open-Source-Licenses.md) | Matrice dipendenze, licenze, proprietà intellettuale |
| 05 | [Architettura dell'Agente AI "Spectra"](05-AI-Agent-Architecture.md) | Ciclo agentico, 35 strumenti, decisioni ingegneristiche, verifica numerica |
| 06 | [Accuratezza scientifica e provenienza dei dati](06-Scientific-Accuracy-Data-Provenance.md) | Come sono verificati i dati chimici, metodo struttura⟷peso molecolare, limiti dichiarati dei predittori |
| 07 | [Distinta dei componenti software (SBOM)](07-SBOM.md) | Componenti, licenze, impronte SHA-256; CycloneDX 1.5 in `evidence/` |
| 08 | [Matrice di tracciabilità](08-Traceability-Matrix.md) | Requisito → implementazione → banco di verifica, con le lacune dichiarate |
| 09 | [Dichiarazione di conformità di rilascio](09-Release-Conformance-Statement.md) | Destinazione d'uso, esclusioni, difformità note, criteri di accettazione |

### 🔍 Evidenza di verifica

| Documento | Contenuto |
|---|---|
| [`evidence/RAPPORTO-VERIFICA.md`](evidence/RAPPORTO-VERIFICA.md) | **Generato automaticamente**: uscita integrale di ogni banco, ambiente, commit, impronte SHA-256, procedura di riproduzione |
| [`evidence/deviazioni-note.json`](evidence/deviazioni-note.json) | Registro delle deviazioni accettate, con il motivo di ciascuna |
| [`evidence/sbom.cdx.json`](evidence/sbom.cdx.json) | SBOM in formato CycloneDX 1.5 |

Gli strumenti che li producono sono in [`tools/`](../tools/) e sono eseguibili da chiunque disponga del repository.

**🌍 English version:** [`docs/en/`](en/README.md) — the same documents in English.
**📑 PDF (IT + EN):** [`docs/pdf/`](pdf/) — pronti da allegare a CV, email e audit.

## In sintesi

- **Autore:** Samuele Pio Provenzano
- **Tipo:** Progressive Web App (PWA) *client-side, local-first, offline-first*
- **Stack:** HTML5 / ES6 · WebAssembly (RDKit MinimalLib, sql.js) · WebGL (three.js, 3Dmol.js) · Service Worker
- **Backend:** nessuno. Le uniche chiamate di rete sono **opzionali** verso API pubbliche (PubChem PUG-REST, NASA/ESA, database spettrali) e servono solo ad arricchire i dati; l'app funziona completamente offline.

> ⚠️ **Nota di trasparenza.** Questa documentazione descrive **ciò che è
> effettivamente implementato** nel codice del repository. Le funzionalità
> ancora da realizzare sono elencate esplicitamente nelle sezioni *Roadmap* e
> non vanno intese come già presenti.

_Ultimo aggiornamento generato automaticamente insieme al codice._
