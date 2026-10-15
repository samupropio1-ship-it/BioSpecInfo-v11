# 16 · Atomic Protocol — progetto del gioco

> Documento di progetto. Descrive che cosa si costruisce e **perché**, prima di
> costruirlo. Le parti già realizzate sono marcate ✅, quelle in costruzione 🔧.
> Il gioco vive nella sezione **🎮 Atomic Protocol** dell'applicazione e usa i
> dati scientifici che l'applicazione ha già: tavola periodica, spettri,
> reazioni, retrosintesi, amminoacidi, farmaci, sicurezza, costanti, tecniche
> di laboratorio, biomolecole, vie metaboliche.

---

## 0. Che cos'è, in una riga

Un gioco di **esplorazione in terza o prima persona**, grafica **3D low-poly in
stile PlayStation 1**, in cui un chimico attraversa i reparti di un istituto di
ricerca sigillato, raccoglie **elementi**, li **sintetizza** in composti, e usa
la chimica — quella vera — per risolvere enigmi e abbattere i guardiani.

**Non è un runner.** Non si corre da soli, non si va «avanti e basta»: si
cammina, ci si guarda intorno, si torna indietro, si apre una porta che prima
era chiusa perché adesso si ha l'acido giusto.

---

## 1. Direzione artistica — PS1, non «retro generico»

Lo stile PlayStation 1 non è «pixelloso»: è una **somma di limiti tecnici
precisi**, e sono quei limiti a dargli il carattere. Si riproducono tutti,
apposta:

| limite dell'hardware vero | come si riproduce qui | perché si vede |
|---|---|---|
| risoluzione interna 320×240 | la scena si disegna a **320×240** e poi si ingrandisce a schermo intero con `image-rendering: pixelated` | i bordi sono scalettati, i pixel sono quadrati e grossi |
| niente filtro bilineare | ogni texture usa `NearestFilter` | le texture sono nette e «sgranate», mai sfocate |
| vertici a coordinate intere | **vertex snapping** nello shader: la posizione proiettata viene arrotondata a una griglia | i poligoni *tremano* quando ci si muove: è il tremolio tipico della PS1 |
| niente correzione prospettica sulle texture | texture a bassissima risoluzione (32–64 px) e poligoni grandi | le superfici «nuotano» leggermente |
| poca memoria, pochi poligoni | personaggi da 200–400 triangoli, scenari a blocchi | silhouette spigolose, mani senza dita |
| niente luci dinamiche | **vertex lighting** (luce calcolata sui vertici) + nebbia densa | ombre dure, fondali che spariscono nel buio |
| palette ridotta | leggero **dithering** e pochi colori per reparto | bande di colore visibili, come sui CRT |

**Riferimenti dichiarati**: Resident Evil 1 (corridoi stretti, porte come
passaggi, paura dello spazio), Silent Hill 1 (nebbia che nasconde il poco
disegnato e diventa atmosfera), Tomb Raider 1 (esplorazione a blocchi,
piattaforme leggibili), Final Fantasy VII (stanze come quadri, oggetti che
brillano).

> **Perché la nebbia è una scelta e non un ripiego.** Sulla PS1 serviva a non
> disegnare quello che era lontano. Qui serve alla stessa cosa — meno poligoni,
> gira anche su un telefono — e in più fa quello che faceva allora: rende
> minaccioso un corridoio vuoto.

---

## 2. Menu e impostazioni ✅ (progetto) 🔧 (codice)

### 2.1 Schermata iniziale

```
            ATOMIC PROTOCOL
     ── protocollo di contenimento ──

              ▸ NUOVA PARTITA
                CONTINUA
                IMPOSTAZIONI
                CODEX
```

Il titolo è disegnato con il font a pixel del progetto; sotto, un rendering
3D della prima stanza che ruota lentamente (come la schermata di Resident
Evil). «CONTINUA» appare solo se c'è una partita salvata.

### 2.2 Impostazioni

| voce | valori | predefinito | dove si salva |
|---|---|---|---|
| **Visuale** | terza persona · prima persona | terza persona | `localStorage` → `bsi-ap-visuale` |
| **Difficoltà** | Facile · Normale · Difficile · Esperimento | Normale | `bsi-ap-difficolta` |
| **Filtro PS1** | pieno · ridotto · spento | pieno | `bsi-ap-ps1` |
| **Risoluzione interna** | 320×240 · 480×360 · 640×480 | 320×240 | `bsi-ap-risoluzione` |
| **Suono** | acceso · spento | acceso | `bsi-ap-suono` |
| **Lingua** | le quattordici dell'applicazione | quella in uso | `BSILingue` |
| **Comandi** | mostra la mappatura | — | — |

La scelta della **visuale si applica subito**, senza ricaricare: la telecamera
passa da dietro le spalle (terza) a dentro la testa (prima), e in prima persona
il corpo del chimico non si disegna ma le **mani sì**, perché una prima persona
senza mani è una telecamera che vola.

> **Perché «Filtro PS1» si può spegnere.** Il tremolio dei vertici e la bassa
> risoluzione sono il punto del gioco, ma a qualcuno danno fastidio: si può
> ridurre (solo bassa risoluzione) o togliere (3D pulito). Una scelta estetica
> forte deve restare una scelta.

### 2.3 Difficoltà — che cosa cambia davvero

| | Facile | Normale | Difficile | Esperimento |
|---|---|---|---|---|
| vite / resistenza | 5 | 3 | 2 | 1 |
| danno dei nemici | ×0,6 | ×1 | ×1,4 | ×2 |
| tempo per gli enigmi | infinito | infinito | 90 s | 45 s |
| sintesi rapida in combattimento | sempre | sempre | 2 per scontro | **vietata** |
| suggerimento della debolezza | esplicito | dopo 2 errori | mai | mai |
| ricette | tutte leggibili nel Codex | come Facile | servono i reagenti esatti | serve anche **bilanciare** la reazione |
| enigmi | a scelta multipla | a scelta multipla | costruzione | costruzione + IUPAC |

«Esperimento» non è «Difficile con più danno»: è il gioco **senza rete di
sicurezza chimica** — niente sintesi al volo, niente aiuti, e le reazioni vanno
bilanciate.

---

## 3. Inventario degli elementi 🔧

### 3.1 Che cosa contiene una scheda

Ogni elemento raccolto occupa uno **slot** e porta con sé:

```
┌─────────────────────────────────────────────┐
│  ⬢ Na   SODIO                     Z 11      │
│  massa 22,99 u · gruppo 1 · periodo 3       │
│  χ 0,93 · Eion 5,14 eV · r 186 pm           │
│                                             │
│  POTERE · «Reazione violenta»               │
│  Con l'acqua reagisce liberando idrogeno     │
│  e calore: apre le paratie bloccate          │
│                                             │
│  PADRONANZA  ▰▰▰▱▱  3/5                     │
│  usato 12 volte · 2 sintesi riuscite         │
│                                             │
│  [ USA ]  [ SINTESI ]  [ CODEX ▸ ]          │
└─────────────────────────────────────────────┘
```

I numeri (massa, gruppo, periodo, elettronegatività, energia di ionizzazione,
raggio) **non sono riscritti nel gioco**: si leggono da `ELEMENTS`, la tavola
periodica dell'applicazione. Se la tavola cambia, cambia il gioco.

### 3.2 Padronanza

Ogni elemento ha un **livello di padronanza da 1 a 5**. Sale usandolo: ogni uso
riuscito, ogni sintesi in cui compare, ogni enigma risolto con lui.

| livello | che cosa sblocca |
|---|---|
| 1 | il potere base |
| 2 | durata del potere +50 % |
| 3 | si può usare in **sintesi rapida** durante i combattimenti |
| 4 | il potere ha un effetto ad area |
| 5 | **non si consuma** quando lo usi in una sintesi |

La padronanza è il modo per premiare chi *capisce* un elemento invece di
raccoglierli tutti: con il sodio a 5 si apre una strada che con dodici elementi
a livello 1 resta chiusa.

### 3.3 Capienza

Otto slot all'inizio, dodici dopo la Zona 2, sedici dopo la Zona 4. Quando è
pieno si sceglie che cosa lasciare: **gli zaini infiniti tolgono le decisioni**.

---

## 4. Laboratorio di sintesi 🔧

### 4.1 Dove e come

Ogni zona ha **un banco di sintesi** (un modello 3D con cui si interagisce) e
dalla Zona 2 si sblocca il **kit portatile**, che apre la stessa interfaccia
ovunque ma con metà delle ricette.

```
┌────────── LABORATORIO DI SINTESI ─────────────┐
│                                               │
│   REAGENTI            PRODOTTO                │
│  ┌────┐ ┌────┐       ┌──────────────┐         │
│  │ H  │ │ Cl │   →   │  HCl         │         │
│  └────┘ └────┘       │  acido forte │         │
│  ┌────┐ ┌────┐       │  ▰▰▰▱▱ resa  │         │
│  │    │ │    │       └──────────────┘         │
│  └────┘ └────┘                                │
│                                               │
│  RICETTE CONOSCIUTE (4/21)        [CODEX ▸]   │
│   • HCl    acido forte                        │
│   • NaOH   base forte                         │
│   • H₂O₂   ossidante                          │
│   • ???    (trovata in Zona 1, non capita)    │
│                                               │
│  [ SINTETIZZA ]        [ BILANCIA ]           │
└───────────────────────────────────────────────┘
```

### 4.2 Che cosa si può fare

| categoria | esempi | a che serve |
|---|---|---|
| **miscele** | salamoia, acqua regia, miscela solfocromica | sciogliere, corrodere, pulire |
| **acidi e basi** | HCl, H₂SO₄, NaOH, NH₃ | attaccare metalli, neutralizzare, aprire paratie |
| **catalizzatori** | Pd/C, MnO₂, enzima | rendono possibili reazioni altrimenti lente |
| **armi temporanee** | bomba a ossigeno, dardo al fluoro, nebbia di cloro | durano 30–60 secondi |
| **antidoti e scudi** | chelante (EDTA), tampone fosfato, strato passivante | annullano un tipo di danno |

### 4.3 Le regole della sintesi

1. **Le ricette si sbloccano**: esplorando (fogli, terminali), risolvendo enigmi,
   abbattendo guardiani. Si leggono nel Codex.
2. **I reagenti si consumano** (tranne gli elementi a padronanza 5).
3. **La resa** dipende dalla padronanza media dei reagenti: una resa bassa
   produce meno dosi.
4. **Sintesi rapida**: durante un combattimento si può sintetizzare solo con
   elementi a padronanza ≥ 3, costa tempo reale (il gioco **non** si mette in
   pausa) e a «Esperimento» è vietata.
5. **Bilanciare**: a Difficile ed Esperimento la ricetta chiede i coefficienti
   stechiometrici giusti prima di produrre.

> **Perché la sintesi è il cuore e non un contorno.** Un gioco in cui raccogli
> poteri e li usi è un gioco di oggetti. Un gioco in cui **combini** quello che
> hai per fare quello che ti serve è un gioco di chimica: la differenza è che
> qui devi sapere che cosa stai facendo.

---

## 5. Combattimento e guardiani 🔧

### 5.1 Il principio

**Non si vince picchiando.** Ogni guardiano ha una **natura chimica** e una
**via di attacco** che discende da quella natura. Colpirlo con la cosa sbagliata
non fa quasi niente — e a volte lo rafforza.

Lo scontro ha tre tempi:

1. **Analisi** — con `✦` si fa una *lettura spettrale* del guardiano: compare
   nel Codex la sua composizione (es. «lega ferrosa, ossidata in superficie»).
   A Facile la debolezza è scritta; a Normale si deducono da due indizi; a
   Difficile e Esperimento si deduce e basta.
2. **Preparazione** — si sceglie o si sintetizza quello che serve. Chi è
   arrivato preparato ha vantaggio; chi non lo è deve sintetizzare *mentre*
   schiva.
3. **Esecuzione** — si applica il composto nel punto giusto, al momento giusto.

### 5.2 Gli archetipi

| guardiano | natura | che cosa lo abbatte | perché (chimica vera) |
|---|---|---|---|
| **metallico** | lega di ferro ossidata | acidi (HCl), o leghe/chelanti | gli acidi attaccano i metalli liberando H₂; il chelante lega gli ioni |
| **organico** | catena carboniosa | ossidanti forti (H₂O₂, O₃), rottura di legami | l'ossidazione spezza le catene; il doppio legame è il punto debole |
| **acido/corrosivo** | pozza a pH 1 | basi (NaOH, NH₃), tamponi | neutralizzazione acido-base |
| **radicalico** | specie con elettrone spaiato | antiossidanti, donatori di H | il radicale si spegne chiudendo la catena |
| **DNA/RNA** | doppia elica | **basi azotate corrette** (A-T, G-C) | l'appaiamento complementare è l'unica chiave |
| **inerte/nobile** | gas nobile schermante | non si attacca: si **sposta** (pressione, temperatura) | un gas nobile non reagisce: inutile insistere |

### 5.3 Esempi di meccaniche di scontro

* **Bilanciamento in tempo reale**: il guardiano mostra una reazione incompleta
  sopra di sé; finché non la bilanci, il suo scudo regge.
* **Scelta della miscela**: tre vasche, un solo reagente giusto; sbagliare
  libera un gas tossico.
* **Finestra di reattività**: il guardiano si scopre per 4 secondi dopo ogni
  attacco — è lì che l'acido va applicato.

---

## 6. Zona 1 — «Ala Ovest · Stoccaggio Reagenti» 🔧

### 6.1 Pianta

```
        ┌──────────┐        ┌───────────────┐
        │ ARCHIVIO │────────│  CORRIDOIO A  │
        └────┬─────┘        └───────┬───────┘
             │                      │
    ┌────────┴────────┐     ┌───────┴────────┐      ┌─────────────┐
    │  BANCO SINTESI  │     │  STOCCAGGIO 1  │──────│ STOCCAGGIO 2│
    └─────────────────┘     └───────┬────────┘      └──────┬──────┘
                                    │                      │
                            ┌───────┴────────┐     ┌───────┴────────┐
                            │  TERMINALE 1   │     │   PARATIA 1    │
                            │  (enigma)      │     │  (chiusa)      │
                            └────────────────┘     └───────┬────────┘
                                                           │
                                                   ┌───────┴────────┐
                                                   │  SALA POMPE    │
                                                   │  ⚠ GUARDIANO   │
                                                   └────────────────┘
```

Sette ambienti, tutti **a blocchi** come la geometria dell'epoca: pareti a pannelli,
scaffali di bidoni, tubi che corrono sul soffitto, una luce rossa di emergenza
che pulsa, nebbia a sei metri.

### 6.2 Che cosa si trova

| dove | cosa | nota |
|---|---|---|
| Stoccaggio 1 | **H** (idrogeno) | primo elemento, insegna a raccogliere |
| Stoccaggio 1 | foglio: ricetta **HCl** | insegna a leggere il Codex |
| Stoccaggio 2 | **Cl** (cloro) | dentro un armadio da aprire |
| Archivio | **Na** (sodio) + nota del Custode | la nota è il primo pezzo di trama |
| Corridoio A | 2 nemici «residui corrosivi» | insegnano a schivare |
| Banco sintesi | il banco | qui si fa HCl |
| Terminale 1 | **enigma molecolare** | apre la Paratia 1 |
| Sala pompe | **guardiano** | il primo scontro |

### 6.3 Il tono

Nessuna musica: ronzio dei neon, gocciolio, il respiro del chimico quando corre.
I nemici si sentono prima di vederli. Le porte sono **schermate di passaggio**
(come Resident Evil): coprono il caricamento e danno ritmo.

---

## 7. Il primo enigma — «la molecola nel terminale» 🔧

Il Terminale 1 mostra una **struttura disegnata** (linee e vertici, stile
formula di struttura) e chiede tre cose in sequenza, crescenti:

1. **Riconoscere** — «Che gruppo funzionale è cerchiato?» → quattro risposte con
   le strutture disegnate, non i nomi.
2. **Nominare** — «Qual è il nome IUPAC di questa molecola?» → la struttura è
   disegnata, le risposte sono nomi.
3. **Costruire** — si trascinano atomi e legami su una griglia per **costruire**
   l'etanolo. Il terminale accetta solo la struttura giusta (si confronta la
   formula e la connettività, non il disegno).

A Facile i passi 1 e 2 sono a scelta multipla e il 3 è guidato; a Esperimento il
3 è libero e c'è il tempo.

> Le strutture si disegnano con lo stesso motore che l'applicazione usa già per
> le formule: **una sola casa per disegnare una molecola**.

---

## 8. Il primo guardiano — «POMPA 7» 🔧

**Che cos'è**: una pompa industriale incrostata, mezza fusa con il metallo
della paratia. Lega ferrosa, ossidata in superficie. Si muove sui binari del
soffitto e colpisce con sbuffi di vapore caldo.

**Fasi**

1. **Fase 1 — la ruggine.** Lo scudo è l'ossido. Serve un **acido**: `HCl`
   sintetizzato al banco (H + Cl) oppure trovato. Tre applicazioni sciolgono
   l'ossido. Colpirla con l'idrogeno puro non fa niente: l'H₂ non attacca il
   ferro.
2. **Fase 2 — il metallo nudo.** Adesso è vulnerabile, ma chiude le valvole e
   riempie la stanza di vapore: bisogna muoversi. Qui serve **sodio** (reagisce
   con l'acqua del vapore liberando idrogeno e calore) per far saltare le
   valvole.
3. **Fase 3 — il nucleo.** La pompa espone il rotore. Qualunque cosa va bene,
   ma ha 15 secondi prima di richiudersi.

**Se si sbaglia**: usare una **base** sulla ruggine non fa niente; usare sodio
in fase 1 (senza vapore) lo spreca; restare fermi nel vapore toglie resistenza.

**Ricompensa**: la ricetta **NaOH**, lo slot inventario +2, e la nota del
Custode che apre la Zona 2.

---

## 9. Comandi

| azione | tastiera | a schermo |
|---|---|---|
| muoversi | `W A S D` o frecce | levetta sinistra |
| guardarsi intorno | mouse / trascinamento | levetta destra |
| correre | `Shift` | doppio tocco sulla levetta |
| interagire | `E` | tasto ✋ |
| usare il potere | `Spazio` | tasto ✦ |
| inventario | `I` | tasto 🎒 |
| codex | `C` | tasto 📖 |
| laboratorio di sintesi | `L` (al banco) o `Q` (kit portatile) | tasto ⚗ |
| sintesi rapida | `1`…`4` | scorciatoie sulla barra |
| pausa | `Esc` | tasto ❚❚ |

---

## 10. Codex (guida integrata)

Si aggiorna da solo. Cinque sezioni:

* **Elementi** — le schede di quelli raccolti, con i numeri veri.
* **Molecole** — quelle incontrate, con la struttura disegnata.
* **Reazioni** — quelle viste, bilanciate.
* **Sintesi** — le ricette sbloccate, con i reagenti e la resa.
* **IUPAC** — le regole di nomenclatura incontrate negli enigmi.
* **Consigli** — quello che il gioco ha insegnato (es. «gli acidi attaccano i
  metalli, le basi no»).

Il Codex è anche la **rete di sicurezza**: chi non sa la chimica la impara lì,
e il gioco non lo punisce per non saperla già.

---

## 11. Struttura completa

| zona | ambiente | elementi nuovi | guardiano | natura |
|---|---|---|---|---|
| 1 | Stoccaggio reagenti | H, Cl, Na | **POMPA 7** | metallico |
| 2 | Sintesi organica | C, O, N | **IL POLIMERO** | organico |
| 3 | Spettroscopia | F, S, Fe | **LO SPETTRO** | radicalico |
| 4 | Biochimica | P, K, Mg | **ELICA** | DNA/RNA |
| 5 | Camera inerte | He, Ar, Au | **IL VUOTO** | inerte |
| 6 | Nucleo | U, Pb | **PROTOCOLLO** | tutte insieme |

Ogni zona: esplorazione → elementi → ricetta → enigma obbligatorio → guardiano.

---

## 12. Che cosa resta dell'applicazione sotto il gioco

* le **domande** arrivano dai 28 generatori di `bsi-gioco-domande.js`, che
  leggono le tabelle vere del sito;
* gli **elementi** arrivano da `ELEMENTS`;
* le **strutture molecolari** si disegnano con il motore già presente;
* il **cambio lingua** è quello dell'applicazione;
* tutto **funziona offline**: Three.js è già nel repository e in cache.
