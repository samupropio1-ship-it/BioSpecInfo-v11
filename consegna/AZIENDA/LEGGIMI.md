# BioSpecInfo — Dossier per valutazione aziendale

**Architettura, verifica, conformità, licenze e rischio.**

| | |
|---|---|
| Autore | Samuele Pio Provenzano |
| Versione | `bsi-v168` |
| Commit | `630705e` |
| Preparato il | 2026-09-20 |
| Applicazione | https://samupropio1-ship-it.github.io/BioSpecInfo-v11/ |
| Repository | github.com/samupropio1-ship-it/BioSpecInfo-v11 |

---

## Perché questo pacchetto

Chi valuta in azienda deve poter rispondere a tre domande: come è fatto, come si dimostra che funziona, e che cosa comporta adottarlo. Tutto il resto è rumore.

---

## In che ordine leggerlo

| # | Documento | Perché | Tempo |
|---|---|---|---|
| 1 | [`09-Release-Conformance-Statement.md`](09-Release-Conformance-Statement.md) | Che cosa è e che cosa NON è. Le esclusioni sono parte della dichiarazione. | 8 min |
| 2 | [`evidence/RAPPORTO-VERIFICA.md`](evidence/RAPPORTO-VERIFICA.md) | L'evidenza: uscita integrale dei banchi, ambiente, commit, impronte. | 10 min |
| 3 | [`00-Technical-Dossier.md`](00-Technical-Dossier.md) | La sintesi tecnica. | 8 min |
| 4 | [`08-Traceability-Matrix.md`](08-Traceability-Matrix.md) | Copertura dei requisiti, con le lacune dichiarate. | 7 min |
| 5 | [`07-SBOM.md`](07-SBOM.md) | Componenti, licenze, compatibilità. | 5 min |
| 6 | [`03-Security-Privacy-Compliance.md`](03-Security-Privacy-Compliance.md) | Modello di riservatezza e superficie d'attacco. | 7 min |

**Totale del percorso consigliato: circa 45 minuti.**

---

## Contenuto

| Documento | Contenuto |
|---|---|
| [`00-Technical-Dossier.md`](00-Technical-Dossier.md) | Sintesi, factsheet, capacità, stack |
| [`01-Software-Architecture-Document.md`](01-Software-Architecture-Document.md) | Architettura, componenti, flussi dati |
| [`02-Verification-Validation-Report.md`](02-Verification-Validation-Report.md) | Metodo di verifica e batteria di prova |
| [`03-Security-Privacy-Compliance.md`](03-Security-Privacy-Compliance.md) | Local-first, OWASP, GDPR, GAMP 5 |
| [`04-Open-Source-Licenses.md`](04-Open-Source-Licenses.md) | Matrice delle dipendenze |
| [`07-SBOM.md`](07-SBOM.md) | Distinta dei componenti con impronte SHA-256 |
| [`08-Traceability-Matrix.md`](08-Traceability-Matrix.md) | Requisito → implementazione → banco di verifica |
| [`09-Release-Conformance-Statement.md`](09-Release-Conformance-Statement.md) | Destinazione d'uso, esclusioni, difformità note |
| [`10-API-Reference.md`](10-API-Reference.md) | Interfacce HTTP e API consumate |
| [`11-Data-Model.md`](11-Data-Model.md) | Dove risiedono i dati e con quale ciclo di vita |
| [`12-Deploy-Guide.md`](12-Deploy-Guide.md) | Pubblicazione, ripristino, emergenze |
| [`15-Test-Documentation.md`](15-Test-Documentation.md) | Come rieseguire le prove |

### In PDF

La cartella `pdf/` contiene gli stessi documenti già impaginati, pronti da allegare a un'email o da stampare. Ogni piè di pagina riporta versione e commit, così un allegato non può essere scambiato per una versione diversa da quella che descrive.

- **`pdf/BioSpecInfo-Dossier-Completo.it.pdf`** — tutti i documenti in un unico file con indice. È l'allegato da mandare se se ne manda uno solo.
- Gli altri file `pdf/NN-*.pdf` sono i singoli documenti.

Sono **generati** dai Markdown di questo stesso pacchetto (`node tools/genera-pdf.js`): testo e PDF non possono divergere.


### Evidenza (generata automaticamente)

| File | Contenuto |
|---|---|
| [`evidence/RAPPORTO-VERIFICA.md`](evidence/RAPPORTO-VERIFICA.md) | Uscita integrale di ogni banco, ambiente, commit, impronte SHA-256 |
| [`evidence/deviazioni-note.json`](evidence/deviazioni-note.json) | Registro delle deviazioni accettate, con il motivo |
| [`evidence/sbom.cdx.json`](evidence/sbom.cdx.json) | SBOM in formato CycloneDX 1.5 |

### Strumenti di verifica

Nella cartella `strumenti/`. Sono gli stessi che hanno prodotto l'evidenza: chiunque può rieseguirli.

```bash
git clone https://github.com/samupropio1-ship-it/BioSpecInfo-v11
cd BioSpecInfo-v11 && npm install
python3 -m http.server 8899 &
node tools/genera-evidenza.js
```

---

## Nota

La dichiarazione di conformità (09) è firmata dall'autore e dichiara esplicitamente di **non** essere una certificazione di terza parte. Attesta che esiste una procedura riproducibile e che i risultati riportati sono quelli realmente ottenuti — compresi i fallimenti.

---

_Pacchetto **AZIENDA** · versione `bsi-v168` · commit `630705e`._
