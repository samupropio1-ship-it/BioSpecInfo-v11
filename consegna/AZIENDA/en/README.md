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
| 07 | [Software Bill of Materials (SBOM)](07-SBOM.md) | Distributed components, licences, SHA-256 digests, CycloneDX 1.5 |
| 08 | [Traceability Matrix](08-Traceability-Matrix.md) | Every requirement, its implementation and the bench that verifies it; declared coverage gaps |
| 09 | [Release Conformance Statement](09-Release-Conformance-Statement.md) | Intended use, exclusions, known deviations, acceptance criteria, signature |
| 15 | [Test Documentation](15-Test-Documentation.md) | How the 41 benches are organised and run, what they cover, where they leave gaps |

> **Documents 06 and 10–14 are available in Italian only** (`docs/`). The ten
> translated here cover the whole due-diligence path; the remaining six are the
> data model, the API reference, the deploy guide, the functional
> specifications, the user manual and the scientific-provenance report.

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
