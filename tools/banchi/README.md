# Banchi di prova — BioSpecInfo

Questa cartella contiene i banchi di prova end-to-end citati nel
[rapporto di evidenza](../../docs/evidence/RAPPORTO-VERIFICA.md). Sono script
Node che guidano un Chromium headless contro un server locale e verificano
il comportamento reale dell'applicazione.

## Come eseguirli

```bash
# dalla radice del repository
npm install                      # installa playwright-core
python3 -m http.server 8899 &    # RDKit e SQLite sono WASM: serve HTTP

node tools/genera-evidenza.js    # tutta la batteria, con rapporto
```

Un banco singolo:

```bash
cd tools/banchi && node test_simmetria.js
```

Variabili d'ambiente riconosciute:

| Variabile | Predefinito | A cosa serve |
|---|---|---|
| `BSI_URL_BASE` | `http://127.0.0.1:8899/` | Dove gira il server |
| `BSI_CHROME` | il Chromium di Playwright | Un altro eseguibile |
| `BSI_BANCHI` | questa cartella | Banchi tenuti altrove |

## Perché stanno nel repository

Fino alla versione `bsi-v168` non c'erano: vivevano nell'area di lavoro della
sessione in cui erano stati scritti, e `genera-evidenza.js` andava a cercarli
lì. Dei 39 banchi citati nel rapporto di evidenza, **7 erano nel repository e
32 no**.

La conseguenza non era un fastidio organizzativo: rendeva falsa la frase su cui
poggia tutta la documentazione di verifica — *«chiunque può rieseguirli»*. Chi
clonava il repository e lanciava il comando documentato ne trovava sette su
trentanove, e non riceveva alcun avviso, perché un banco assente veniva contato
ma non faceva fallire la batteria.

Oggi **un banco assente rende l'esito NON CONFORME**. Un banco che non c'è non
è un banco superato.

## Regola che vale per tutti i banchi

Un banco che simula una condizione deve **contare quante volte la simulazione
è davvero scattata** e fallire se è zero. Un banco che non misura nulla passa,
e un banco che passa senza misurare è peggio di un banco assente: il primo dà
una rassicurazione falsa, il secondo almeno si nota.

Diversi banchi qui dentro stampano quel conteggio accanto all'esito — quante
richieste sono state intercettate, quante sezioni percorse, quante volte
l'errore simulato è stato consegnato. È lì apposta.
