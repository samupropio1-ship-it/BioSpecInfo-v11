# BioSpecInfo — Technical Documentation

Official documentation for the **BioSpecInfo** platform, intended for technical
evaluation by companies, research centres and audits.

## 📨 To send for job applications

Attach **a single file**:

- 🇬🇧 **[`docs/pdf/BioSpecInfo-Full-Dossier.en.pdf`](../pdf/BioSpecInfo-Full-Dossier.en.pdf)** — full dossier: cover, SAD, V&V, security, licensing, AI agent, SBOM, traceability matrix, conformance statement and test documentation.
- 🇮🇹 **[`docs/pdf/BioSpecInfo-Dossier-Completo.it.pdf`](../pdf/BioSpecInfo-Dossier-Completo.it.pdf)** — same dossier in Italian.

Or the summary cover only: [`00-Technical-Dossier.en.pdf`](../pdf/00-Technical-Dossier.en.pdf).

---

| # | Document | Content |
|---|----------|---------|
| 00 | [Technical Dossier (cover & summary)](00-Technical-Dossier.md) | Executive summary, factsheet, capabilities, stack, author's declaration |
| 01 | [Software Architecture Document (SAD)](01-Software-Architecture-Document.md) | Architecture, components, technologies, data flows |
| 02 | [Verification & Validation & Benchmark Report](02-Verification-Validation-Report.md) | Test method, spectral benchmarks, performance, declared limitations |
| 03 | [Security, Privacy & Compliance](03-Security-Privacy-Compliance.md) | Local-first privacy model, OWASP/XSS, GDPR and GAMP 5 alignment |
| 04 | [Open-Source Licensing & IP Matrix](04-Open-Source-Licenses.md) | Dependency matrix, licenses, intellectual property |
| 05 | [AI Agent Architecture "Spectra"](https://github.com/samupropio1-ship-it/BioSpecInfo-v11/blob/main/docs/en/05-AI-Agent-Architecture.md) | Agentic loop, 35 tools, engineering decisions, numeric verification |
| 06 | [Scientific Accuracy and Data Provenance](https://github.com/samupropio1-ship-it/BioSpecInfo-v11/blob/main/docs/en/06-Scientific-Accuracy-Data-Provenance.md) | How the chemical data are verified, the structure ⟷ molecular weight method, declared limits of the predictors |
| 07 | [Software Bill of Materials (SBOM)](07-SBOM.md) | Distributed components, licences, SHA-256 digests, CycloneDX 1.5 |
| 08 | [Traceability Matrix](08-Traceability-Matrix.md) | Every requirement, its implementation and the bench that verifies it; declared coverage gaps |
| 09 | [Release Conformance Statement](09-Release-Conformance-Statement.md) | Intended use, exclusions, known deviations, acceptance criteria, signature |
| 10 | [Interface Reference](10-API-Reference.md) | The optional proxy with its OpenAPI spec, the external APIs consumed, the internal JavaScript APIs |
| 11 | [Data Model](11-Data-Model.md) | Where the data live, with what structure and what lifecycle; there is no server database |
| 12 | [Deploy Guide](12-Deploy-Guide.md) | Publishing, updating, rolling back; the two version lines |
| 13 | [Functional Specifications](https://github.com/samupropio1-ship-it/BioSpecInfo-v11/blob/main/docs/en/13-Functional-Specifications.md) | What the product does, for whom, under which rules, with which limits |
| 14 | [User Manual](https://github.com/samupropio1-ship-it/BioSpecInfo-v11/blob/main/docs/en/14-User-Manual.md) | A guide for the people who study, not for the people who program |
| 15 | [Test Documentation](15-Test-Documentation.md) | How the 44 benches are organised and run, what they cover, where they leave gaps |

> **All sixteen documents are now available in English.** The numbers declared
> in the English set are compared against the running application by the same
> bench that checks the Italian one, and a disagreement between the two
> languages fails the battery.

## At a glance

- **Author:** Samuele Pio Provenzano
- **Type:** Progressive Web App (PWA) — *client-side, local-first, offline-first*
- **Stack:** HTML5 / ES6 · WebAssembly (RDKit MinimalLib, sql.js) · WebGL (three.js, 3Dmol.js) · Service Worker
- **Backend:** none. The only network calls are **optional** requests to public APIs (PubChem PUG-REST, NASA/ESA, spectral databases) that merely enrich data; the app works fully offline.

> ⚠️ **Transparency note.** This documentation describes **what is actually
> implemented** in the repository code. Features still to be built are listed
> explicitly in the *Roadmap* sections and must not be read as already present.

_The SBOM is generated from the same source as its Italian counterpart; the
other documents are translated and kept aligned by
`tools/verifica-affermazioni.js` and `tools/verifica-documenti.js`, which
compare the English set against the running application and against the Italian
documents, and fail on any disagreement._
