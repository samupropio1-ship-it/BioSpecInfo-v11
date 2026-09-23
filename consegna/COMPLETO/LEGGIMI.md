# BioSpecInfo — Documentazione completa

**Tutto: i documenti, l'evidenza, gli strumenti e le note di lavorazione.**

| | |
|---|---|
| Autore | Samuele Pio Provenzano |
| Versione | `bsi-v170` |
| Commit | `693ec66` |
| Preparato il | 2026-09-23 |
| Applicazione | https://samupropio1-ship-it.github.io/BioSpecInfo-v11/ |
| Repository | github.com/samupropio1-ship-it/BioSpecInfo-v11 |

---

## Perché questo pacchetto

Questo pacchetto è per chi sviluppa l'applicazione. Contiene anche ciò che agli altri due destinatari non serve: il manuale utente, le guide pratiche, e le note di sessione con le trappole in cui si è già caduti — che sono la parte più difficile da ricostruire.

---

## In che ordine leggerlo

| # | Documento | Perché | Tempo |
|---|---|---|---|
| 1 | [`DOCUMENTATION.md`](DOCUMENTATION.md) | L'indice generale, con i percorsi per ogni tipo di lettore. | 3 min |
| 2 | [`15-Test-Documentation.md`](15-Test-Documentation.md) | Come si esegue la batteria e come si aggiunge un banco. | 12 min |
| 3 | [`12-Deploy-Guide.md`](12-Deploy-Guide.md) | Come si pubblica, e le due righe della versione. | 10 min |
| 4 | [`06-Scientific-Accuracy-Data-Provenance.md`](06-Scientific-Accuracy-Data-Provenance.md) | Le regole che i dati devono rispettare. | 15 min |
| 5 | [`NOTE-DI-LAVORAZIONE.txt`](NOTE-DI-LAVORAZIONE.txt) | Le trappole già incontrate. Leggerle evita di ripeterle. | 25 min |

**Totale del percorso consigliato: circa 65 minuti.**

---

## Contenuto

Tutti i documenti del repository, più il manuale utente, le guide pratiche e le note di lavorazione.

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

Le note di lavorazione non sono documentazione formale: sono il registro di che cosa è andato storto e perché. Contengono, fra le altre, la regola che vale più di tutte le altre messe insieme — *un banco di prova che non misura nulla passa*.

---

_Pacchetto **COMPLETO** · versione `bsi-v170` · commit `693ec66`._
