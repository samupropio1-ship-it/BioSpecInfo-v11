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

## ATOMIC PROTOCOL — la prima persona

Forniti dall'utente (Sketchfab) e adattati con `tools/prepara-modelli.js`;
i sorgenti non stanno nel repository, solo i derivati. Autore, licenza e link
sono anche dentro ogni file (`asset.extras`) e nel Codex del gioco.

| File | Opera originale | Autore | Licenza | Adattamento |
|------|-----------------|--------|---------|-------------|
| `mani-atomic.glb` | [hands animation](https://sketchfab.com/3d-models/hands-animation-9f63e924253b4179adb79b117a26d385) | [hugo colauto](https://sketchfab.com/hugocolauto) | [Sketchfab Standard](https://sketchfab.com/licenses) | texture ricompresse (3 JPEG condivisi); in gioco il colore della pelle diventa un guanto di nitrile; geometria, scheletro e animazione invariati |
| `manica-atomic.glb` | [Modern Scientist in a Lab Coat](https://sketchfab.com/3d-models/modern-scientist-in-a-lab-coat-e835a3b126a4463583727dbac2fedecc) | [restore50](https://sketchfab.com/restore50) | [CC-BY 4.0](http://creativecommons.org/licenses/by/4.0/) | ritagliato l'avambraccio sinistro (manica, orlo, polsino della camicia), tolta la pelle, texture del colore ridotta |
| `braccia-atomic.glb` | [Fists (2023) \| First Person Animations](https://sketchfab.com/3d-models/fists-2023-first-person-animations-b178e95c4b7f4e95b52a12752aff57d0) | [1Matzh](https://sketchfab.com/1Matzh) | [CC-BY 4.0](http://creativecommons.org/licenses/by/4.0/) | tolti skybox e mappe di emissione; scheletro della pelle ridotto alle 52 ossa pesate e animazioni alle loro tracce; in gioco la divisa diventa il camice e i guanti nitrile |
| `mano-robotica-atomic.glb` | [Robotic Hand](https://sketchfab.com/3d-models/robotic-hand-3e284b06bbb84d858f85f7a246cd65df) | [SeanNicolas](https://sketchfab.com/SeanNicolas) | [CC-BY 4.0](http://creativecommons.org/licenses/by/4.0/) | invariato; in gioco specchiato e agganciato alla mano sinistra |
| `pistola-atomic.glb` | [Capsule Gun](https://sketchfab.com/3d-models/capsule-gun-3639c42106334abab57d0592dae745df) | [sc8di](https://sketchfab.com/sc8di) | [CC-BY 4.0](http://creativecommons.org/licenses/by/4.0/) | texture ricompresse; in gioco la capsula prende il colore del composto |

## ATOMIC PROTOCOL — i laboratori (cartella `mappe/`)

Le mappe dei laboratori, fornite dall'utente (Sketchfab; tre in USDZ) e
adattate con `tools/prepara-mappe.js`, che calcola anche la griglia di cammino
di ognuna (`mappe/<nome>.json`).

| File | Opera originale | Autore | Licenza | Uso e adattamento |
|------|-----------------|--------|---------|-------------------|
| `mappe/small.glb` | [Small Lab](https://sketchfab.com/3d-models/small-lab-8ad8088491d2409eb4b6f06563684d23) | [Biohazard Rooms](https://sketchfab.com/Perriqueso) | [CC-BY 4.0](http://creativecommons.org/licenses/by/4.0/) | laboratorio (ali 1, 6): materiali metal/rough, mesh unite, geometria semplificata, texture ridotte, scala in metri |
| `mappe/scifi1.glb` | [Sci-fi lab](https://sketchfab.com/3d-models/sci-fi-lab-a676e149e343403bb5e57686f3d31da5) | [Agata Wilczek](https://sketchfab.com/a_wilczek) | [CC-BY 4.0](http://creativecommons.org/licenses/by/4.0/) | laboratorio (ali 2, 7): materiali metal/rough, mesh unite, geometria semplificata, texture ridotte, scala in metri; dall’USDZ convertito con `tools/usd-in-glb.py` |
| `mappe/flynn.glb` | [Flynn's Secret Lab [Tron Legacy]](https://sketchfab.com/3d-models/flynns-secret-lab-tron-legacy-0429196769e040bd84e84040daccc40a) | [jvouillon](https://sketchfab.com/jvouillon) | [CC-BY 4.0](http://creativecommons.org/licenses/by/4.0/) | laboratorio (ali 3, 8): materiali metal/rough, mesh unite, geometria semplificata, texture ridotte, scala in metri |
| `mappe/underground.glb` | [Location underground laboratory](https://sketchfab.com/3d-models/location-underground-laboratory-7f70eebd1f044277b91c197fb17c513e) | [bazz4r](https://sketchfab.com/bazz4r) | [CC-BY 4.0](http://creativecommons.org/licenses/by/4.0/) | laboratorio (ali 4, 9): materiali metal/rough, mesh unite, geometria semplificata, texture ridotte, scala in metri |
| `mappe/overgrown.glb` | [Overgrown Laboratory](https://sketchfab.com/3d-models/overgrown-laboratory-51e1307fb6c44fa29dd2c19b79ec893f) | [MichalTroye](https://sketchfab.com/MichalTroye) | [CC-BY 4.0](http://creativecommons.org/licenses/by/4.0/) | laboratorio (ali 5, 10): materiali metal/rough, mesh unite, geometria semplificata, texture ridotte, scala in metri; dall’USDZ convertito con `tools/usd-in-glb.py` |
| `mappe/reattore.glb` | [Quantum_Laboratory_X_Alpha](https://sketchfab.com/3d-models/quantum-laboratory-x-alpha-a8811324c92f45678bbadc4ec71204f4) | [-X-ScornGames](https://sketchfab.com/XX-XX) | [CC-BY 4.0](http://creativecommons.org/licenses/by/4.0/) | apparecchio (il reattore): materiali metal/rough, mesh unite, geometria semplificata, texture ridotte, scala in metri |
| `mappe/capsula.glb` | [Sci Fi lab](https://sketchfab.com/3d-models/sci-fi-lab-f7626acfa80943bab35568b4852b8ab8) | [IrisProcess](https://sketchfab.com/IrisProcess) | [CC-BY 4.0](http://creativecommons.org/licenses/by/4.0/) | apparecchio (la capsula): materiali metal/rough, mesh unite, geometria semplificata, texture ridotte, scala in metri; dall’USDZ convertito con `tools/usd-in-glb.py` |

## ATOMIC PROTOCOL — i nemici (cartella `nemici/`)

Le creature fornite dall'utente (Sketchfab), adattate con `tools/prepara-mappe.js`.
**Escluso**: «monster_eye» (neos_nelia) ha licenza CC-BY-ND 4.0, che non
permette di distribuire versioni modificate (ricolorate o compresse): non e'
nel gioco.

| File | Opera originale | Autore | Licenza | Uso e adattamento |
|------|-----------------|--------|---------|-------------------|
| `nemici/verme.glb` | [Worm Monster](https://sketchfab.com/3d-models/worm-monster-5563066315694125b741901681d387c5) | [CR!STALLL](https://sketchfab.com/CR1STALLL) | CC-BY 4.0 | il verme di scarico: scheletro e animazioni invariati, texture ridotte |
| `nemici/curvo.glb` | [Scary Monster](https://sketchfab.com/3d-models/scary-monster-8da390cb461848e3bbb404e125a17186) | [L.](https://sketchfab.com/A2555) | Sketchfab Standard | il rampicante: geometria semplificata, texture ridotte |
| `nemici/palude.glb` | [SWAMP MONSTER](https://sketchfab.com/3d-models/swamp-monster-6dab8cb402864d9c842d52e4dded1bdf) | [alexalbinyana](https://sketchfab.com/alexalbinyana) | CC-BY 4.0 | la fanghiglia: geometria semplificata, texture ridotte |
| `nemici/cervo.glb` | [The Human Deer](https://sketchfab.com/3d-models/the-human-deer-7644694337404bb18eb68e6b637740a1) | [ceeleste](https://sketchfab.com/ceeleste) | CC-BY 4.0 | il cervo: scheletro e animazioni invariati, texture ridotte |
| `nemici/abissale.glb` | [6- Stylized- Monster](https://sketchfab.com/3d-models/6-stylized-monster-f0aa9258214844a1b6690c03ec473f78) | [Lex Wild](https://sketchfab.com/lexwild) | CC-BY 4.0 | l’abissale: geometria semplificata, texture ridotte |
| `nemici/mostro.glb` | [Monster](https://sketchfab.com/3d-models/monster-6aaab68784f84f5fbc12aaf2bf92d730) | [itszyx123456789](https://sketchfab.com/itszyx123456789) | CC-BY 4.0 | il cristallino: scheletro e animazioni invariati, texture ridotte |
| `nemici/bruto.glb` | [CREATURE MONSTER 3D BY Oscar Creativo](https://sketchfab.com/3d-models/creature-monster-3d-by-oscar-creativo-03bff460ebdc4103b42a14d56131db78) | [OSCAR CREATIVO](https://sketchfab.com/oscar_creativo) | CC-BY 4.0 | il bruto: geometria semplificata, texture ridotte; dall’USDZ convertito con `tools/usd-in-glb.py`, braccia abbassate in gioco |

**Nota sulla licenza Sketchfab Standard** (le mani): consente l'uso del
modello dentro un'opera, non la sua ridistribuzione come modello a sé. Il
file sta in un repository pubblico, da cui si può scaricare: prima di una
pubblicazione o di un uso commerciale va verificato con i termini attuali
della licenza ed eventualmente con l'autore.

> Modelli a scopo esclusivamente didattico/illustrativo.
