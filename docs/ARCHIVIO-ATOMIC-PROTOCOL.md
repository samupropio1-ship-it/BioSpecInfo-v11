# ATOMIC PROTOCOL — archivio del gioco

| | |
|---|---|
| **Stato** | **Sospeso** (v226): il gioco è fuori dall’applicazione e dal ramo principale |
| **Ultima versione giocabile** | v225 (più le correzioni del fuoco e degli effetti vicini alla telecamera) |
| **Archivio completo** | ramo Git **`archivio/atomic-protocol`** (commit `30700d6`) |
| **Autore** | Samuele Pio Provenzano |

Il gioco è stato tolto dall'applicazione su richiesta dell'autore, **senza
perdere niente**. Dall'applicazione pubblicata sono usciti i suoi file, i
modelli 3D, gli strumenti e il banco; **tutto** il lavoro resta:

1. **Nel ramo Git `archivio/atomic-protocol`** (su GitHub): la fotografia
   completa dell'ultimo stato giocabile — codice, modelli, mappe, strumenti,
   banco, documento di progetto — con tutta la sua storia, commit per commit.
2. **Nella storia del ramo principale**: ogni commit fino alla v226 contiene
   ancora il gioco; il registro delle modifiche (`CHANGELOG.md`, versioni
   v209–v226) dice che cosa è cambiato in ognuna.
3. **In questo documento**: che cosa c'era, come riattivarlo, da dove
   ripartire.

---

## Come riattivarlo

Si riportano i file dal ramo d'archivio nel ramo di lavoro:

```sh
git fetch origin archivio/atomic-protocol
git checkout origin/archivio/atomic-protocol -- \
  bsi-atomic.js bsi-atomic-livelli.js bsi-atomic-figure.js bsi-atomic-grafica.js \
  bsi-atomic-degrado.js bsi-gioco-domande.js skeleton_utils.js \
  models/mappe models/nemici models/mani-atomic.glb models/manica-atomic.glb \
  models/pistola-atomic.glb models/braccia-atomic.glb models/mano-robotica-atomic.glb \
  tools/banchi/test_atomic.js tools/prepara-mappe.js tools/prepara-modelli.js \
  tools/usd-in-glb.py docs/16-Atomic-Protocol-Design.md
```

poi, in `index.html`, dopo `bsi-sellingua.js`, i sei script in quest'ordine:

```html
<script src="./bsi-gioco-domande.js" defer></script>
<script src="./bsi-atomic-livelli.js" defer></script>
<script src="./bsi-atomic-figure.js" defer></script>
<script src="./bsi-atomic-degrado.js" defer></script>
<script src="./bsi-atomic-grafica.js" defer></script>
<script src="./bsi-atomic.js" defer></script>
```

gli stessi file (più `skeleton_utils.js`) nell'elenco della cache di `sw.js`,
`test_atomic` nella batteria (`tools/genera-evidenza.js`, con 40 minuti per
banco), e dal ramo d'archivio le voci dei modelli in `tools/genera-sbom.js`,
`models/CREDITS.md` e `docs/04-Open-Source-Licenses.md`. Poi
`node tools/porta-versione.js bsi-vNNN` e la batteria come sempre.

---

## Che cosa c'è

### I file del gioco

| file | che cosa fa |
|---|---|
| `bsi-atomic.js` | il gioco: motore, ciclo a passo fisso con interpolazione, prima persona, combattimento, mosse, nemici, orde, laboratori, effetti, suono, salvataggi |
| `bsi-atomic-livelli.js` | i dati: 300 livelli in tre atti e dieci zone, 30 guardiani, ricette, enigmi, punti di salvataggio, trama |
| `bsi-atomic-figure.js` | le figure: braccia e mani in prima persona (rig «Fists»), pistola, sfera dell'elemento, residui, guardiani |
| `bsi-atomic-grafica.js` | gli ambienti art déco, i materiali PBR procedurali, le luci |
| `bsi-atomic-degrado.js` | l'istituto abbandonato: fogli, sedie, cavi, sporco, muffa, sangue |
| `bsi-gioco-domande.js` | i generatori di domande dalle tabelle dell'applicazione |

### I modelli (in `models/`, crediti in `models/CREDITS.md`)

- `mani-atomic.glb`, `manica-atomic.glb`, `pistola-atomic.glb`,
  `braccia-atomic.glb`, `mano-robotica-atomic.glb` — prima persona;
- `nemici/` — verme, curvo (rampicante), palude (fanghiglia), cervo,
  abissale, mostro (cristallino), bruto;
- `mappe/` — i cinque laboratori (small, scifi1, flynn, underground,
  overgrown) con le loro griglie di cammino `.json`, il reattore e la
  capsula.

### Gli strumenti

- `tools/prepara-modelli.js` — dai modelli forniti ai GLB della prima persona;
- `tools/prepara-mappe.js` — dalle mappe (GLB e USDZ) ai laboratori con la
  griglia di cammino, e i nemici;
- `tools/usd-in-glb.py` — da USD/USDZ a GLB;
- `tools/banchi/test_atomic.js` — il banco (316 controlli).

### Le funzioni, versione per versione

| versione | che cosa ha portato |
|---|---|
| v215–v219 | mani GLB con guanti di nitrile, camice, pistola a capsula; rig «Fists» con otto animazioni; sfera dell'elemento sul palmo; i sette laboratori come mappe percorribili |
| v220 | combattimento: pistola, poteri per famiglia di elementi con energia, barra dei poteri, zoom, schermo intero, inerzia e interpolazione; le sette creature fornite come nemici con i loro attacchi; il pugno |
| v221 | mani uguali; 300 livelli in tre atti; guardiani MK II e Ω; varianti delle creature per atto ed élite; punti di salvataggio |
| v222 | le mosse (schivata, combinazione di tre colpi, potere caricato, esecuzioni al rallentatore); un attacco speciale per creatura; il rig procedurale nello shader; torcia; passata finale (aberrazione, sangue sullo schermo); suono sintetizzato; fluidità (interpolazione dei nemici, geometria fusa, risoluzione dinamica) |
| v223 | le reazioni chimiche (frantumazione, combustione, conduzione); luce di contorno, coni di luce, polvere |
| v224 | le creature non entrano nel giocatore; avvisi a terra leggibili; combustione provata dal banco |
| v225 | i laboratori come arene a ondate con la porta che si chiude; le orde nei livelli; l'istituto abbandonato; luce da horror e raggi di luce; sangue che resta e brandelli; fuoco e fulmini veri; impostazioni «Istituto» e «Sangue» |
| dopo v225 | gli effetti vicini alla telecamera non accecano più; il fuoco tende all'arancione |

---

## Da dove ripartire

Le note dell'ultima sessione di lavoro, per chi riprende:

- **Il salto grafico che manca** sono i materiali fotografici (PBR) per
  pavimenti, muri e arredi delle stanze generate: le librerie CC0 (Poly
  Haven, ambientCG) erano bloccate dalla rete dell'ambiente di lavoro. Con
  la rete aperta a `polyhaven.com`, `api.polyhaven.com`, `dl.polyhaven.org`
  e `ambientcg.com`, oppure con i file forniti a mano, si sostituiscono le
  texture procedurali di `bsi-atomic-grafica.js`.
- **I laboratori** (le mappe fornite) sono la parte più credibile: farli
  diventare l'ambiente principale dei livelli è la strada più breve verso
  il realismo.
- Il pacchetto npm `@pmndrs/assets` (CC0) contiene mappe d'ambiente HDR
  («lab», «warehouse») utilizzabili per i riflessi.
