# BioSpecInfo — archivio completo `bsi-v174`

Questo archivio contiene **l'applicazione e tutta la documentazione**, nello
stato esatto del commit pubblicato.

| | |
|---|---|
| **Versione** | `bsi-v174` |
| **Batteria di verifica** | 44 banchi, **0 falliti** — esito CONFORME |
| **Repository** | `github.com/samupropio1-ship-it/BioSpecInfo-v11` |
| **Demo** | `samupropio1-ship-it.github.io/BioSpecInfo-v11/` |

---

## Cosa c'è dentro

| Cartella / file | Contenuto |
|---|---|
| `index.html` | L'applicazione: 88 sezioni, dati chimici, interfaccia |
| `bsi-ai-hub.js` | L'agente «Spectra»: ciclo agentico, 35 strumenti, dieci fornitori |
| `bsi-spettri.js` | Motore di predizione spettrale IR/NMR sul grafo molecolare |
| `bsi-cheminfo.js` | Motore di chemioinformatica: standardizzazione, impronte, raggruppamento, PCA, QSAR con modello nullo |
| `sw.js` | Service Worker: funzionamento offline e strategia di rete |
| `astro.html`, `chimorga.html`, `rdkit_lab.html`, … | I moduli su pagina propria |
| `docs/` | **16 documenti in italiano** + `docs/en/` con i **16 in inglese** |
| `docs/pdf/` | **36 PDF** impaginati, versione e commit in ogni piè di pagina |
| `docs/evidence/` | Rapporto di verifica integrale, SBOM CycloneDX, registri dei debiti misurati |
| `tools/` | Gli strumenti che producono l'evidenza |
| `tools/banchi/` | **I 44 banchi di prova**, versionati: chiunque può rieseguirli |
| `proxy/` | Il proxy opzionale (Cloudflare Worker) |

---

## Cosa NON c'è, e perché

| Escluso | Peso | Motivo |
|---|---:|---|
| `consegna/` | 31 MB | I tre pacchetti di consegna (AZIENDA, TESI, COMPLETO) viaggiano come **zip a parte**: tenerli anche qui dentro raddoppiava il peso dell'archivio senza aggiungere un solo file nuovo. |
| `models/`, `textures/` | 106 MB | I modelli 3D anatomici e molecolari in formato glTF. Escluderli porta l'archivio da 104 MB a 18 MB. Senza di loro l'applicazione funziona per intero **tranne** la visualizzazione 3D degli organi nell'Atlante Farmaci. Si recuperano clonando il repository. |
| `node_modules/` | 14 MB | Si ricrea con `npm install` (una sola dipendenza: `playwright-core`). |
| `.git/` | — | La cronologia sta sul repository pubblico. |

---

## Rimettere in piedi tutto

```bash
# l'applicazione, così com'è
python3 -m http.server 8899
# poi si apre http://127.0.0.1:8899/index.html

# per rieseguire la verifica
npm install                      # solo playwright-core
node tools/genera-evidenza.js    # 44 banchi; deve chiudersi con 0 falliti
```

> **Serve un server anche in locale.** Aprire `index.html` con un doppio clic
> (`file://`) non funziona: RDKit e SQLite sono moduli WebAssembly e richiedono
> un contesto HTTP.

Per riavere anche i modelli 3D:

```bash
git clone https://github.com/samupropio1-ship-it/BioSpecInfo-v11
```

---

## Da dove cominciare a leggere

| Se sei… | Parti da |
|---|---|
| **Un'azienda che valuta** | `LEGGIMI.md` dentro `BioSpecInfo-AZIENDA-bsi-v174.zip` — percorso di lettura ordinato, circa 45 minuti |
| **Una commissione di tesi** | `LEGGIMI.md` dentro `BioSpecInfo-TESI-bsi-v174.zip` |
| **Chi dovrà lavorarci** | `docs/README.md`, poi `docs/15-Test-Documentation.md` |
| **Un revisore non italofono** | `docs/en/README.md` — tutti e sedici i documenti |
| **Chi vuole solo un allegato** | `docs/pdf/BioSpecInfo-Dossier-Completo.it.pdf` (o `.en.pdf`) |

---

## Una nota sul File Manager

La protezione del File Manager è un **deterrente, non un controllo di
sicurezza**. Su un sito statico non esiste controllo d'accesso effettivo: chi
legge il sorgente lo aggira. Nel codice c'è solo l'impronta SHA-256 della
password, mai la password. Non va usato per materiale riservato — e la
documentazione lo dichiara, non lo nasconde.

---

_Archivio prodotto alla versione `bsi-v174`._
