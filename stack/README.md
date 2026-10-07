# Stack React + TypeScript + FastAPI

Un modo **diverso** di raggiungere lo stesso motore. Non sostituisce
l'applicazione e non la duplica.

---

## Che cosa è, e perché non è una seconda applicazione

BioSpecInfo è una PWA: gira interamente nel browser, non ha un server, e
funziona offline. È questo che le permette di stare su GitHub Pages e di
aprirsi in aula senza rete.

Questo stack serve a due cose che lì non si possono fare:

1. **chiamare la predizione da un programma** — uno script, un foglio di
   calcolo, un altro servizio;
2. **servire un'interfaccia separata**, con una catena di strumenti moderna
   (React 19, TypeScript in modalità `strict`, Vite).

### La decisione che conta: nessun motore in Python

La strada ovvia, per dare a un'API in Python la predizione NMR, sarebbe
riscrivere il motore in Python. È anche la strada sbagliata: diventano due
programmi che fanno la stessa cosa, uno riceve le correzioni e l'altro no, e
dopo sei mesi danno due numeri diversi per la stessa molecola. Chi guarda non
sa quale credere, e la risposta onesta è «nessuno dei due».

RDKit ha una compilazione WebAssembly che gira **anche in Node**. Quindi qui
non si riscrive niente: un processo Node carica gli **stessi file** che
l'applicazione serve ai suoi utenti —

```
bsi-pretsch.js   le tabelle di stima, trascritte dalla fonte
bsi-nmr.js       la predizione ¹H/¹³C assegnata per atomo
bsi-geom3d.js    le coordinate 3D con gli indici del predittore
bsi-nmr2d.js     COSY, HSQC, HMBC
```

— e risponde alle richieste che arrivano da FastAPI. Una correzione a quei
file arriva a tutti e due nello stesso istante, perché i file **sono gli
stessi file**.

**E lo si verifica, non lo si promette.** `GET /salute` restituisce
l'impronta SHA-256 di ogni modulo caricato, e il banco `test_stack` la
confronta con quella dei file nel repository. Se qualcuno ne copiasse una
versione qui dentro «per comodità», la prova fallirebbe il giorno stesso
invece che fra sei mesi.

Lo stesso banco controlla che nel front end **non ci sia chimica**: nessun
file `.ts`/`.tsx` può contenere una tabella di spostamenti. È lì che
nascerebbe il secondo motore.

---

## Avviare

Servono **Node 20+** e **Python 3.11+**. La radice del repository va
raggiungibile: il worker legge i moduli da lì.

### L'API

```bash
cd stack/api
pip install -r requirements.txt
uvicorn bsi_api.main:app --reload          # http://127.0.0.1:8000
```

Documentazione interattiva su `http://127.0.0.1:8000/docs`.

Se il repository non è il genitore di `stack/`, si dichiara:

```bash
BSI_RADICE=/percorso/di/BioSpecInfo-v11 uvicorn bsi_api.main:app
```

### Il front end

```bash
cd stack/web
npm install
npm run dev                                 # http://localhost:5173
```

In sviluppo Vite inoltra `/api` a `127.0.0.1:8000`, così il browser vede una
sola origine e non c'è niente da configurare. In produzione si mette l'API
dietro lo stesso dominio, oppure si dichiara `VITE_API`.

---

## Le rotte

| rotta | che cosa dà |
|---|---|
| `GET /salute` | versione, RDKit, **impronte dei moduli caricati** |
| `POST /identita` | SMILES canonico, InChI, chiave, formula, peso, logP, TPSA |
| `POST /nmr` | spettro ¹H o ¹³C, assegnato per atomo, con lo scarto misurato |
| `POST /nmr2d` | mappa COSY, HSQC o HMBC |
| `POST /geometria` | coordinate 3D, **con gli indici del predittore** |
| `POST /struttura` | SVG della struttura, con gli atomi illuminati |

Esempio:

```bash
curl -X POST localhost:8000/nmr \
     -H 'Content-Type: application/json' \
     -d '{"smiles":"COc1ccccc1","nucleo":"1H"}'
```

### Gli errori dicono di chi è la colpa

- **422** — non è una struttura leggibile. La colpa è dello SMILES.
- **503** — il motore non è disponibile. La colpa è del servizio, e riprovare
  ha senso.

Trattarli allo stesso modo farebbe dire «SMILES sbagliato» a chi ha solo il
server spento.

### Ogni risposta dichiara la propria incertezza

Il campo `incertezza` non è decorativo: uno spettro previsto senza lo scarto
misurato accanto è un numero che sembra una misura. Viene dal motore, dove è
il banco a scriverlo.

---

## I banchi

```bash
cd stack/api && python -m pytest -q      # 18 controlli
cd stack/web && npm run build            # TypeScript strict + Vite
node tools/banchi/test_stack.js          # tutti e due, più le impronte
```

`test_stack` fa parte della batteria generale. Se Python, Node o le
dipendenze mancano, **lo dice e si ferma senza fallire**: non è un guasto
dell'applicazione, è un ambiente incompleto — e un banco che fallisce per
quello insegna a ignorarlo.

---

## Che cosa questo stack NON fa

- **Non sostituisce la PWA.** Quella resta il prodotto: gira offline, non ha
  un server da pagare, e continua a essere ciò che si pubblica.
- **Non aggiunge capacità chimiche.** Le stesse di sempre, con gli stessi
  limiti dichiarati: lo scarto misurato (0,9 ppm sul ¹³C, 0,06 sul ¹H), le
  mappe 2D che non sono simulazioni dell'esperimento, la geometria che non
  sceglie il conformero più stabile e non tratta la stereochimica.
- **Non è pronto per il pubblico.** Non ha autenticazione, né limiti di
  frequenza, né cache. L'origine consentita è `localhost:5173`. Esporlo su
  Internet richiede almeno queste tre cose, e non ci sono.
