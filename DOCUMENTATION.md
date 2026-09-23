# Documentazione — BioSpecInfo

**Indice generale della documentazione del progetto.**

| | |
|---|---|
| **Software** | BioSpecInfo — piattaforma di chemioinformatica interattiva |
| **Autore** | Samuele Pio Provenzano |
| **Versione documentata** | `bsi-v171` |
| **Demo** | [samupropio1-ship-it.github.io/BioSpecInfo-v11](https://samupropio1-ship-it.github.io/BioSpecInfo-v11/) |
| **Licenza** | Proprietaria — *All rights reserved* ([`LICENSE`](LICENSE)) |

---

## Da dove cominciare

La documentazione è estesa. Questo è il percorso più breve secondo chi sei.

| Se sei… | Leggi nell'ordine | Tempo |
|---|---|---|
| **Uno studente che vuole usarla** | [Guida utente](docs/14-User-Manual.md) | 10 min |
| **Un valutatore tecnico in azienda** | [Dossier](docs/00-Technical-Dossier.md) → [Architettura](docs/01-Software-Architecture-Document.md) → [Evidenza di verifica](docs/evidence/RAPPORTO-VERIFICA.md) → [Conformità](docs/09-Release-Conformance-Statement.md) | 45 min |
| **Una commissione di tesi** | [Dossier](docs/00-Technical-Dossier.md) → [Accuratezza scientifica](docs/06-Scientific-Accuracy-Data-Provenance.md) → [Verifica e validazione](docs/02-Verification-Validation-Report.md) | 40 min |
| **Un auditor / ufficio acquisti** | [Conformità](docs/09-Release-Conformance-Statement.md) → [SBOM](docs/07-SBOM.md) → [Sicurezza](docs/03-Security-Privacy-Compliance.md) → [Licenze](docs/04-Open-Source-Licenses.md) | 30 min |
| **Uno sviluppatore che deve metterci mano** | [README](README.md) → [Architettura](docs/01-Software-Architecture-Document.md) → [Test](docs/15-Test-Documentation.md) → [Interfacce](docs/10-API-Reference.md) | 60 min |

> **Se hai poco tempo e devi valutare la serietà del lavoro**, apri
> [`docs/evidence/RAPPORTO-VERIFICA.md`](docs/evidence/RAPPORTO-VERIFICA.md):
> è generato automaticamente, riporta l'uscita integrale di ogni banco di prova,
> e chiunque può rieseguirlo sul commit indicato e confrontare.

---

## Indice completo

### Panoramica e architettura

| # | Documento | Contenuto |
|---|---|---|
| 00 | [Dossier tecnico](docs/00-Technical-Dossier.md) | Sintesi, factsheet, capacità, stack |
| 01 | [Software Architecture Document](docs/01-Software-Architecture-Document.md) | Architettura, componenti, flussi dati |
| 05 | [Architettura dell'agente «Spectra»](docs/05-AI-Agent-Architecture.md) | Ciclo agentico, 35 strumenti, decisioni ingegneristiche |
| 10 | [Riferimento delle interfacce](docs/10-API-Reference.md) | Proxy (OpenAPI 3.0), API esterne consumate, API interne JS |
| 11 | [Modello dei dati](docs/11-Data-Model.md) | `localStorage`, IndexedDB, dataset — con diagramma ER |

### Qualità e verifica

| # | Documento | Contenuto |
|---|---|---|
| 02 | [Verifica e validazione](docs/02-Verification-Validation-Report.md) | Metodo, benchmark spettrali, batteria di verifica |
| 06 | [Accuratezza scientifica](docs/06-Scientific-Accuracy-Data-Provenance.md) | Come sono verificati i dati chimici, limiti dichiarati |
| 08 | [Matrice di tracciabilità](docs/08-Traceability-Matrix.md) | Requisito → implementazione → banco di verifica |
| 15 | [Documentazione dei test](docs/15-Test-Documentation.md) | Come eseguirli, cosa coprono, lacune dichiarate |

### Conformità, sicurezza, licenze

| # | Documento | Contenuto |
|---|---|---|
| 03 | [Sicurezza, privacy e conformità](docs/03-Security-Privacy-Compliance.md) | Modello local-first, OWASP, GDPR, GAMP 5 |
| 04 | [Licenze open source](docs/04-Open-Source-Licenses.md) | Matrice delle dipendenze e proprietà intellettuale |
| 07 | [Distinta dei componenti (SBOM)](docs/07-SBOM.md) | Componenti, licenze, impronte SHA-256 |
| 09 | [Dichiarazione di conformità](docs/09-Release-Conformance-Statement.md) | Destinazione d'uso, esclusioni, difformità note |

### Prodotto e operatività

| # | Documento | Contenuto |
|---|---|---|
| 12 | [Guida al deploy](docs/12-Deploy-Guide.md) | Ambienti, pubblicazione, ripristino, emergenze |
| 13 | [Specifiche funzionali](docs/13-Functional-Specifications.md) | Obiettivi, attori, funzioni, regole, limiti |
| 14 | [Guida utente](docs/14-User-Manual.md) | Manuale per chi studia, senza gergo tecnico |

### Evidenza (generata automaticamente)

| Documento | Contenuto |
|---|---|
| [`RAPPORTO-VERIFICA.md`](docs/evidence/RAPPORTO-VERIFICA.md) | Uscita integrale dei banchi, ambiente, commit, impronte, procedura di riproduzione |
| [`deviazioni-note.json`](docs/evidence/deviazioni-note.json) | Registro delle deviazioni accettate, con il motivo di ciascuna |
| [`sbom.cdx.json`](docs/evidence/sbom.cdx.json) | SBOM in formato CycloneDX 1.5 |

### Guide pratiche

| Documento | Contenuto |
|---|---|
| [Guida alle chiavi API](docs/Guida-Chiavi-API.md) | Quali servizi AI, come ottenere una chiave, limiti reali |
| [Proxy Spectra](proxy/README.md) | Pubblicazione del Worker opzionale |
| [Changelog](CHANGELOG.md) | Cronologia delle versioni |
| [Guida Data Science](docs/Guida-DataScience-Corsi-Progetti.md) | Percorso formativo collegato |

**🌍 English:** [`docs/en/`](docs/en/README.md) — dieci documenti su sedici in inglese (00–05, 07, 08, 09, 15): l'intero percorso di due diligence.
**📑 PDF:** [`docs/pdf/`](docs/pdf/) — versioni pronte da allegare.

---

## Come è organizzata

Tre principi, applicati in tutta la documentazione.

**1. Si descrive ciò che esiste.**
Le funzioni non ancora realizzate stanno nelle sezioni *Sviluppi possibili*, mai
mescolate a quelle presenti. Dove il progetto non ha una cosa che un lettore si
aspetterebbe — un backend, un database su server, endpoint REST — lo si dice,
invece di produrre documentazione plausibile e falsa.

**2. Le lacune sono dichiarate.**
La matrice di tracciabilità elenca i requisiti **senza** banco di verifica. La
dichiarazione di conformità elenca le difformità note. Il registro delle
deviazioni richiede un motivo scritto per ogni eccezione. Una documentazione che
può solo dire «tutto bene» non è un'attestazione.

**3. L'evidenza è generata, non redatta.**
Il rapporto di verifica, la SBOM e la verifica dei dati chimici sono prodotti da
programmi che eseguono e trascrivono. Un banco fallito vi compare con lo stesso
rilievo di uno superato.

---

## Verificare quanto è scritto

```bash
git clone https://github.com/samupropio1-ship-it/BioSpecInfo-v11
cd BioSpecInfo-v11
npm install
python3 -m http.server 8899 &
node tools/genera-evidenza.js
```

Il rapporto prodotto è confrontabile con quello incluso nel repository. Le
impronte SHA-256 dei file si ricalcolano con `sha256sum`.

---

## Contatti

**Samuele Pio Provenzano** — autore e responsabile del rilascio
**Relatore di tesi:** Prof. Savino Longo, Università degli Studi di Bari Aldo Moro
**Segnalazioni:** [issue del repository](https://github.com/samupropio1-ship-it/BioSpecInfo-v11/issues)

---

_Indice aggiornato alla versione `bsi-v171`._
