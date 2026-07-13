# BioSpecInfo — v14 (versione definitiva)

Carica **TUTTI** i file nel repository. Nessuna configurazione necessaria.

---

## Cosa era rotto e cosa e' stato corretto

### 1. RDKit — "dalla sezione Descrittori in poi le sezioni escono vuote"
**Causa reale:** in `rdkit_lab.html` questa riga, NON protetta, veniva eseguita all'avvio:

    var library = JSON.parse(localStorage.getItem('bsi_rdkit_lib2') || '[]');

In **modalita' incognito** (che il vecchio README consigliava!) o con i cookie/dati di sito
bloccati, l'accesso a `localStorage` **lancia un'eccezione** e **interrompe l'intero script
da quel punto in poi**. Risultato: Descrittori, Drug-likeness, QSAR, Similarita', SMARTS,
Confronto, Libreria e Spettri restavano **completamente vuoti**.

Ecco perche' i test passavano ma il telefono no: nei test `localStorage` funziona sempre.

**Correzioni:**
- Guardia `localStorage` (con fallback in memoria) inserita in **tutti** i file HTML.
- La riga incriminata resa sicura.
- Rete di sicurezza: nessun pannello puo' piu' restare vuoto in silenzio; gli errori
  vengono mostrati con un pulsante "Riprova" invece di sparire.

### 2. RDKit — descrittori sbagliati
`computeDesc()` leggeva chiavi **inesistenti** (`RingCount`, `NumChiralCenters`):
anelli e stereocentri risultavano **sempre 0**, la formula bruta sempre vuota.
Ora usa le chiavi vere (`NumRings`, `NumAtomStereoCenters`) e calcola la formula dal molblock.
Verificato: Colesterolo -> 4 anelli, 8 stereocentri, C27H46O.

### 3. `3Dmol-min.js` mancante -> 404
`index.html` caricava `./3Dmol-min.js` **ma il file non era nel repository**: il viewer 3D
delle macromolecole non partiva mai. Il file (v2.4.2) e' ora incluso.

### 4. RDKit in `index.html` caricato dal CDN senza `locateFile`
Cercava il `.wasm` nel posto sbagliato -> 404. Ora usa i **file locali** gia' presenti,
con `locateFile` corretto; il CDN resta solo come ultima riserva.

### 5. Guida Biochimica
Sostituita con `Biochimica_Guida_Definitiva.html`. Era incorporata come stringa da **867 KB**
dentro `index.html`: ora e' un file esterno -> `index.html` e' **867 KB piu' leggero**.

### 6. Duplicati
Nella galleria astro c'erano **6 voci duplicate** (Fiamma, Rosetta, Uovo, Testa di Strega,
Scultore, Grande Nube di Magellano). Ora le 98 immagini sono tutte uniche.

---

## Sezione ASTRO — rifatta

### Nebulose (prima: solo particelle casuali che cambiavano nome da sole)
- **34 nebulose selezionabili** con immagini ufficiali NASA / ESA-Hubble / JWST / ESO
- Ricerca libera + filtri per tipo (emissione, planetaria, oscura, resto di supernova,
  riflessione, protoplanetaria)
- Ogni nebulosa apre 3 schede:
  - **Immagine interattiva** — zoom con pizzico/rotella, trascinamento, doppio tap
  - **Modello 3D** — nebulosa procedurale la cui forma dipende dal tipo reale
    (guscio per le planetarie, filamenti per i resti di supernova, globulo per le oscure...)
  - **Dati & chimica** + link alla scheda ufficiale in alta risoluzione

### Corpi Celesti — "Esploratore" (prima: schede statiche non cliccabili)
**30 corpi** (esopianeti, pianeti, lune, stelle). Ognuno apre 7 schede:

| Scheda | Cosa mostra |
|---|---|
| NASA Eyes (live) | Il visualizzatore **3D ufficiale NASA** incorporato, agganciato a quel corpo (`eyes.nasa.gov/apps/...?embed=true`): orbite, lune, sonde, fasce di radiazione |
| Sistema & orbite | Orbite 3D animate in scala, con **zona abitabile** evidenziata |
| Campo magnetico | Linee di forza dipolari 3D compresse dal vento solare + arco d'urto + dati reali |
| Struttura interna | Spaccato interattivo degli strati |
| Atmosfera | Composizione in volume + dati fisici |
| Satelliti | Lune in orbita animata |
| Fonti ufficiali | NASA, ESA, Exoplanet Archive |

Anche il **Catalogo (1000 corpi)** apre l'Esploratore per i corpi con dati completi.

### Cosmo 3D
Aggiunto lo **zoom a pizzico**, che su telefono mancava del tutto.

---

## Note
- Il visualizzatore NASA richiede **internet**. Se non carica, compare un pulsante per
  aprirlo in una scheda nuova.
- Il Service Worker (`bsi-v14`) **non intercetta piu' le risorse esterne**: prima poteva
  bloccare le immagini ESA/Hubble e l'iframe NASA.
- Ora l'app funziona **anche in incognito**. Se dopo l'aggiornamento vedi ancora la
  versione vecchia, ricarica forzando la pagina.
