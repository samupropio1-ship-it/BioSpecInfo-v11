# BioSpecInfo — Dossier per la discussione di tesi

**Metodo scientifico, validazione, limiti dichiarati.**

| | |
|---|---|
| Autore | Samuele Pio Provenzano |
| Versione | `bsi-v174` |
| Commit | `de935fb` |
| Preparato il | 2026-09-25 |
| Applicazione | https://samupropio1-ship-it.github.io/BioSpecInfo-v11/ |
| Repository | github.com/samupropio1-ship-it/BioSpecInfo-v11 |

---

## Perché questo pacchetto

Una commissione non valuta quante funzioni ci sono, ma se ciò che l'applicazione afferma è vero e come lo si dimostra. Il centro di questo pacchetto è il metodo: come un dato scientifico viene verificato, e che cosa succede quando non si riesce a verificarlo.

---

## In che ordine leggerlo

| # | Documento | Perché | Tempo |
|---|---|---|---|
| 1 | [`06-Scientific-Accuracy-Data-Provenance.md`](06-Scientific-Accuracy-Data-Provenance.md) | Il principio: ogni dato deve poter essere contraddetto da un secondo dato indipendente. | 15 min |
| 2 | [`02-Verification-Validation-Report.md`](02-Verification-Validation-Report.md) | Benchmark contro SDBS e NIST; la batteria di verifica e le note di metodo. | 12 min |
| 3 | [`00-Technical-Dossier.md`](00-Technical-Dossier.md) | Inquadramento. | 8 min |
| 4 | [`05-AI-Agent-Architecture.md`](05-AI-Agent-Architecture.md) | Le decisioni ingegneristiche dell'agente, con la loro motivazione. | 20 min |
| 5 | [`13-Functional-Specifications.md`](13-Functional-Specifications.md) | Regole di business e limitazioni dichiarate. | 10 min |

**Totale del percorso consigliato: circa 65 minuti.**

---

## Contenuto

| Documento | Contenuto |
|---|---|
| [`00-Technical-Dossier.md`](00-Technical-Dossier.md) | Inquadramento del lavoro |
| [`06-Scientific-Accuracy-Data-Provenance.md`](06-Scientific-Accuracy-Data-Provenance.md) | Il cuore: come sono verificati i dati chimici |
| [`02-Verification-Validation-Report.md`](02-Verification-Validation-Report.md) | Validazione dei predittori, benchmark SDBS/NIST |
| [`01-Software-Architecture-Document.md`](01-Software-Architecture-Document.md) | Scelte architetturali e loro motivazione |
| [`05-AI-Agent-Architecture.md`](05-AI-Agent-Architecture.md) | L'agente: ciclo, strumenti, decisioni |
| [`13-Functional-Specifications.md`](13-Functional-Specifications.md) | Obiettivi, regole, limitazioni |
| [`08-Traceability-Matrix.md`](08-Traceability-Matrix.md) | Requisiti e loro verifica |
| [`15-Test-Documentation.md`](15-Test-Documentation.md) | Metodo sperimentale della verifica |

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

Il documento 06 contiene il risultato più difendibile del lavoro: un controllo che ha trovato **89 errori strutturali** su 143 voci preesistenti, e il ragionamento per cui lo scarto di massa non è solo un allarme ma una diagnosi (Δ 0,98 u = citosina ⟷ uracile, sul sofosbuvir). I 25 casi non verificabili sono dichiarati, non nascosti.

---

_Pacchetto **TESI** · versione `bsi-v174` · commit `de935fb`._
