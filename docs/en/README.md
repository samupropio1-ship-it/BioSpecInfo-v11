# BioSpecInfo — Technical Documentation

Official documentation for the **BioSpecInfo** platform, intended for technical
evaluation by companies, research centres and audits.

| # | Document | Content |
|---|----------|---------|
| 01 | [Software Architecture Document (SAD)](01-Software-Architecture-Document.md) | Architecture, components, technologies, data flows |
| 02 | [Verification & Validation & Benchmark Report](02-Verification-Validation-Report.md) | Test method, spectral benchmarks, performance, declared limitations |
| 03 | [Security, Privacy & Compliance](03-Security-Privacy-Compliance.md) | Local-first privacy model, OWASP/XSS, GDPR and GAMP 5 alignment |
| 04 | [Open-Source Licensing & IP Matrix](04-Open-Source-Licenses.md) | Dependency matrix, licenses, intellectual property |

## At a glance

- **Author:** Samuele Pio Provenzano
- **Type:** Progressive Web App (PWA) — *client-side, local-first, offline-first*
- **Stack:** HTML5 / ES6 · WebAssembly (RDKit MinimalLib, sql.js) · WebGL (three.js, 3Dmol.js) · Service Worker
- **Backend:** none. The only network calls are **optional** requests to public APIs (PubChem PUG-REST, NASA/ESA, spectral databases) that merely enrich data; the app works fully offline.

> ⚠️ **Transparency note.** This documentation describes **what is actually
> implemented** in the repository code. Features still to be built are listed
> explicitly in the *Roadmap* sections and must not be read as already present.

_Generated together with the code._
