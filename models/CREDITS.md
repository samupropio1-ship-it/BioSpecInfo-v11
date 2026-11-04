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

## Corpo di Spectra nello studio (**Spectra Studio**)

| File | Contenuto | Origine | Licenza |
|---|---|---|---|
| `spectra-corpo.glb` | corpo «Bounty Hunter», mesh senza scheletro riggata nel browser da `bsi-spectra-rig.js` | CGTrader (download gratuito) | Royalty Free di CGTrader |

**Il file non è nel repository** (escluso in `.gitignore`) e l'app pubblicata
non lo serve: la licenza Royalty Free di CGTrader permette di usare il
modello dentro un prodotto solo se terzi non possono recuperarne il file.
Senza il file l'app pubblicata, nello studio e nelle sezioni dell'AI, mostra
l'invito a caricarlo e nessun corpo sostitutivo.

**Come caricarlo**: chi possiede il file (scaricato con il proprio account
CGTrader ed esportato in `.glb`) preme **«🧍 Corpo»** nella testata del
pannello di Spectra Studio (o nel riquadro di Spectra in una sezione dell'AI) e lo sceglie. Il file resta solo nell'IndexedDB
di quel browser (database `bsi-spectra-modelli`) e a ogni apertura lo studio
lo riprende da lì; non va su nessun server. In sviluppo può stare anche in
`models/spectra-corpo.glb`. Il volto «Noir» che lo studio mette nel
cappuccio è quello della tabella qui sopra (CC BY 4.0).
