# Modelli 3D — crediti e licenze

## Atlante 3D (sezione **Farmaci ▸ Atlante 3D**)

I modelli 3D realistici nella sezione **Farmaci ▸ Atlante 3D** sono file `.glb`
forniti dall'utente e provenienti da **Sketchfab**:

| File            | Contenuto                     |
|-----------------|-------------------------------|
| `ecorche.glb`   | Écorché — corpo intero (muscoli) |
| `anatomy.glb`   | Anatomia umana                |
| `skeleton.glb`  | Scheletro completo            |
| `skull.glb`     | Cranio (dettaglio)            |

**Attribuzione**: ogni modello resta soggetto alla licenza del rispettivo
autore su Sketchfab (tipicamente Creative Commons, es. CC-BY). Prima della
pubblicazione/consegna della tesi, verificare sulla pagina Sketchfab di
ciascun modello la licenza e inserire qui il **nome dell'autore** e il
**link** al modello, come richiesto dalla licenza.

## Volto di Spectra (console **Spectra Live**)

| File | Contenuto | Autore | Licenza |
|---|---|---|---|
| `spectra-noir.glb` | «Noir», busto di androide — [pagina del modello](https://sketchfab.com/3d-models/noir-8edf174437494f0080b4cd5aa0f0509c) | [Skyfox13](https://sketchfab.com/podderkuntal25) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |

**Modifiche**: texture ricompresse, tangenti tolte, viso reso in metallo
grigio scuro, testa staccata dal collo e bocca animate dal codice
(`bsi-spectra-androide.js`). L'attribuzione compare anche nella console di
Spectra Live.

## Corpo di Spectra (studio e sezioni dell'AI)

| File | Contenuto | Origine | Licenza |
|---|---|---|---|
| `spectra-corpo.bsi` | corpo «Bounty Hunter», incorporato come blocco impacchettato; mesh senza scheletro riggata nel browser da `bsi-spectra-rig.js` | CGTrader (download gratuito) | Royalty Free di CGTrader |

**Dalla v241 il corpo è sempre presente, per tutti**: è incorporato nell'app
come blocco impacchettato `spectra-corpo.bsi` (4,40 MB), prodotto da
`tools/impacchetta-corpo.js` a partire dal `.glb` (formato «BSIC»: firma,
versione, lunghezza, poi i byte del `.glb` mescolati con un flusso
pseudocasuale da un seme fisso). Solo il codice dell'app
(`bsi-spectra-figura.js`, funzione `apri`) lo riapre. La licenza Royalty Free
di CGTrader permette di usare il modello dentro un prodotto, non di offrirlo
come file a sé: per questo **il file pubblicato non è un `.glb`
riutilizzabile**. Non è una protezione assoluta (nessun modello mostrato su
uno schermo lo è): è il modo in cui giochi e app incorporano i modelli
acquistati. Il `.glb` originale (`spectra-corpo.glb`) resta fuori dal
repository (escluso in `.gitignore`); in sviluppo lo studio lo usa se il
blocco manca.

Il nome dell'autore del modello su CGTrader non è presente nel file.
Il volto «Noir» che va nel cappuccio è quello della tabella qui sopra
(CC BY 4.0).

**Rigenerare il blocco**: `node tools/impacchetta-corpo.js <corpo.glb>
models/spectra-corpo.bsi` (il programma verifica che il blocco si riapra
identico al `.glb`).
