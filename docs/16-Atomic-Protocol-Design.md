# 16 · Atomic Protocol — progetto del gioco

> Documento di progetto. Descrive che cosa si costruisce e **perché**, prima di
> costruirlo. Le parti già realizzate sono marcate ✅, quelle in costruzione 🔧.
> Versione 2 (bsi-v209): grafica realistica e venti livelli.
> Il gioco vive nella sezione **🎮 Atomic Protocol** dell'applicazione e usa i
> dati scientifici che l'applicazione ha già: tavola periodica, spettri,
> reazioni, retrosintesi, amminoacidi, farmaci, sicurezza, costanti, tecniche
> di laboratorio, biomolecole, vie metaboliche.

---

## 0. Che cos'è, in una riga

Un gioco di **esplorazione in terza o prima persona**, in **venti livelli** e
cinque ali, con **grafica realistica** (e lo stile PlayStation 1 come scelta),
in cui un chimico attraversa un istituto di ricerca sigillato, raccoglie
**elementi**, li **sintetizza** in composti, e usa la chimica — quella vera —
per risolvere enigmi e fermare cinque guardiani.

**Non è un runner.** Non si corre da soli, non si va «avanti e basta»: si
cammina, ci si guarda intorno, si torna indietro, si apre una paratia che prima
era chiusa perché adesso si ha la risposta giusta.

Tre file, una casa per funzione: `bsi-atomic-grafica.js` (modelli, materiali,
luci), `bsi-atomic-livelli.js` (dati: livelli, guardiani, ricette, enigmi — il
banco li verifica senza disegnare un fotogramma), `bsi-atomic.js` (il gioco).

---

## 1. Direzione artistica — realistica di serie ✅, PS1 a scelta ✅

### 1.1 Realistica: che cosa vuol dire, misurato

«Realistico» non è un aggettivo: è un elenco di tecniche, e ognuna si vede.

| tecnica | come è fatta | perché si vede |
|---|---|---|
| materiali fisici (PBR) | `MeshStandardMaterial` / `MeshPhysicalMaterial` con colore, **rugosità** e **metallicità** per ogni superficie | l'acciaio luccica, il camice no, la resina del banco riflette |
| texture procedurali | rumore frattale (fbm) disegnato su tela: piastrelle con le fughe e lo sporco, pannelli verniciati, intonaco, acciaio spazzolato, ruggine | niente superfici a tinta unita, e niente immagini da scaricare: funziona offline |
| mappe di rilievo e di ruvidità | calcolate dalla stessa altezza del rumore con un filtro di Sobel | le fughe hanno profondità, la ruggine ha grana, senza aggiungere un poligono |
| riflessi d'ambiente | una stanza luminosa fotografata una volta (PMREM) | i metalli riflettono qualcosa invece di diventare neri |
| ombre morbide | un faro con l'ombra (PCF morbido) che segue il giocatore | il chimico e gli arredi poggiano sul pavimento |
| tone mapping ACES, sRGB | la curva del cinema, esposizione 0,78 | le luci forti non bruciano, i bui non diventano fango |
| geometria arrotondata | profili ruotati (`LatheGeometry`), tubi lungo curve, scatole con lo smusso estruso | **nessuna scatola**: fusti con le nervature, vetreria, il personaggio |
| vignettatura e smorzamento | gradiente ai bordi, telecamera che insegue invece di essere incollata | si guarda al centro, i movimenti sono morbidi |

Il chimico è alto un metro e settantacinque, con testa ovale, capelli,
occhiali di protezione con lenti di vetro, camice che si apre sotto la vita,
guanti di nitrile azzurri, scarpe; gli snodi — spalle, gomiti, anche,
ginocchia, collo — sono animati: cammina piegando le ginocchia, respira da
fermo e ogni tanto si guarda intorno.

### 1.2 Quello che costa, e come si paga

* **Si disegnano solo la stanza in cui si è e quelle attaccate alle sue
  porte.** Le stanze sono scatole chiuse: dalle altre non si vede niente, e un
  livello di dodici stanze costa come una e mezza.
* **Le luci sono sempre cinque** — quattro lampade e un faro con l'ombra — e si
  **spostano** sulle plafoniere più vicine. In Three il numero di luci è
  scritto negli shader: cambiarlo ricompila ogni materiale e il gioco si
  pianta per un secondo.
* **Tre livelli di grafica**: *alta* (ombre, vetro trasparente, antialias,
  risoluzione fino a 1,5× lo schermo), *media* (stessi modelli, niente ombre,
  risoluzione 1×), *PS1*. Su un telefono con pochi processori si parte da
  «media».
* I residui si deformano a ogni fotogramma (una sfera suddivisa i cui vertici
  si spostano col rumore), ma **solo quelli della stanza in cui si è**, e un
  fotogramma sì e uno no.

### 1.3 PS1, come scelta: i limiti rifatti

Lo stile PlayStation 1 non è «pixelloso»: è una **somma di limiti tecnici
precisi**, e chi lo sceglie li ha tutti:

| limite dell'hardware vero | come si riproduce qui | perché si vede |
|---|---|---|
| risoluzione interna 320×240 | la scena si disegna a **320×240** (o 480, 640) e si ingrandisce con `image-rendering: pixelated` | i bordi sono scalettati, i pixel sono quadrati e grossi |
| vertici a coordinate intere | **vertex snapping** nello shader: la posizione proiettata viene arrotondata a una griglia | i poligoni *tremano* quando ci si muove |
| poca memoria, pochi poligoni | gli stessi modelli con meno segmenti | silhouette spigolose |
| niente luci dinamiche | luce calcolata sui vertici (`MeshLambertMaterial`, `flatShading`) + nebbia densa | ombre dure, fondali che spariscono nel buio |

**Riferimenti dichiarati**: Resident Evil (porte come passaggi, paura dello
spazio), Silent Hill (nebbia come atmosfera), Half-Life (un laboratorio di
ricerca credibile, cartelli e attrezzature veri), Control (architettura
istituzionale che diventa ostile).

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

## 6. I venti livelli ✅

### 6.1 Come si genera un livello

Le stanze stanno su una **griglia** di colonne e righe di larghezza variabile
(6 m i corridoi, 10–15 m le sale). Due stanze in celle vicine **condividono un
muro**, e la porta è al centro di quel muro: per costruzione le porte
combaciano sempre, e non esiste un corridoio che finisce nel vuoto.

1. Il **percorso principale** è una passeggiata che non torna sui suoi passi e
   preferisce andare avanti; la sua lunghezza cresce col livello (da 4 a 9
   stanze).
2. Le **stanze laterali** sono appese al percorso: tengono elementi e schede.
3. Gli **arredi** stanno lungo i muri, dove li metterebbe chiunque, e mai
   davanti a una porta: scaffali di reagenti, fusti con l'etichetta di
   pericolo, cappe aspiranti.
4. Il **banco di sintesi** sta in una sala grande del percorso; il
   **terminale** nella penultima stanza; l'ultima porta è una **paratia** che
   il terminale apre.
5. Gli **elementi** sono quelli dell'ala, due dosi ciascuno — e prima di un
   guardiano **ci sono sempre gli elementi per batterlo**: un guardiano
   invincibile perché il livello non ha messo il sodio è un gioco rotto, non
   difficile.
6. I **residui** crescono col livello (da 1 a 10), mai nella stanza di
   partenza.

Il seme è il numero del livello: lo stesso livello è sempre lo stesso, su ogni
motore JavaScript (il caso si estrae prima di ordinare, mai dentro il
comparatore).

### 6.2 Le cinque ali

| livelli | ala | elementi | ricette dell'ala | guardiano |
|---|---|---|---|---|
| 1–4 | Ovest · Stoccaggio reagenti | H, Cl, Na, O | HCl, H₂O₂ | **POMPA 7** |
| 5–8 | Nord · Sintesi organica | C, N, S, O, H | H₂SO₄, NH₃, CO₂ | **IL POLIMERO** |
| 9–12 | Est · Spettroscopia | F, Fe, Mg, C, O, H | acido ascorbico, MgO | **LO SPETTRO** |
| 13–16 | Sud · Biochimica | P, K, Ca, Na, O, H | NaHCO₃ | **ELICA** |
| 17–20 | Il Nucleo | Ar, Au, Pb, Na, C, O, H | — | **PROTOCOLLO 12** |

### 6.3 Gli enigmi per ala

| ala | i tre passi del terminale |
|---|---|
| 1 | gruppo funzionale cerchiato · nome IUPAC · costruire la catena |
| 2 | nome IUPAC · bilanciare · costruire |
| 3 | domanda dal sito · bilanciare · nome IUPAC |
| 4 | DNA complementare · domanda dal sito · gruppo funzionale |
| 5 | bilanciare · DNA complementare · domanda dal sito |

Le «domande dal sito» arrivano dai 28 generatori di `bsi-gioco-domande.js`:
spettri, farmaci, GHS, costanti, tecniche di laboratorio, vie metaboliche.

### 6.4 Il tono

Le plafoniere al neon, la luce rossa di emergenza che pulsa durante gli scontri,
cartelli con il nome del locale e i pittogrammi di pericolo, estintori, tubi
che corrono sotto il soffitto. Ogni ala ha la sua nebbia e il colore delle
sue lampade.

### 6.5 La trama

Un appunto nel primo livello di ogni ala, e il finale: il verbale del Custode
(«riprendere comunque», con una calligrafia familiare), il diario della
dott.ssa Sarti (il Protocollo 12 è una sintesi che si alimenta da sola), il
registro dello spettrometro (la firma è quella del tuo badge), l'ultima nota
di Sarti (i vapori cancellano le ultime ore: sei tu che l'hai ripreso), e il
Nucleo, dove il Custode parla per la prima volta. Il Codex conserva gli
appunti ritrovati.

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

**Ricompensa**: la ricetta **NaOH**, e l'ascensore verso l'Ala Nord.

### 8.1 Gli altri quattro guardiani

| livello | guardiano | natura | fasi |
|---|---|---|---|
| 8 | IL POLIMERO | catena organica reticolata | **H₂O₂** ossida e spezza le catene → **H₂SO₄** disidrata e carbonizza il reticolo → il nucleo scoperto |
| 12 | LO SPETTRO | specie radicalica | **acido ascorbico** cede un idrogeno e chiude la catena → **CO₂** soffoca la fiamma → il cristallo |
| 16 | ELICA | doppia elica di acido nucleico | **appaiare le basi** (si risponde: la risposta sbagliata costa una vita) → **NaOH** rompe i legami a idrogeno → lo scheletro |
| 20 | PROTOCOLLO 12 | la reazione stessa | **bilanciare** l'equazione (si risponde) → **NaHCO₃** tampona gli spruzzi acidi → **argon** toglie l'ossigeno al nucleo → il nucleo, quattro colpi |

Ogni guardiano attacca a ondate che **si vedono arrivare** — la sua luce rossa
si accende e la stanza lampeggia — e sono più fitte con la difficoltà e col
livello. L'ultima fase si richiude se non la si colpisce in tempo.

---

## 9. Comandi ✅

| azione | tastiera | a schermo |
|---|---|---|
| muoversi | `W S` avanti e indietro, `A D` girarsi, o le frecce | ▲ ▼ ◀ ▶ |
| spostarsi di lato | `Q` / `E` | ⇤ ⇥ |
| correre | `Shift` | — |
| saltare | `Spazio` | ⤒ |
| interagire (raccogliere, leggere, banco, terminale, ascensore, rispondere al guardiano) | `F` | ✋ |
| usare quello che si ha in mano | `X` | ✦ |
| cambiare quello che si ha in mano | `R` | ⟳ |
| inventario (e sintesi rapida contro un guardiano) | `I` | 🎒 |
| codex | `C` | dalla pausa |
| cambiare visuale | `V` | impostazioni |
| pausa | `Esc` o `P` | ❚❚ |

Il bersaglio di ✋ è quello che si ha **davanti e vicino**: fra due fiale
vicine si prende quella che si guarda. L'interfaccia è HTML sopra la scena:
quadro con vite, livello, stanza e punti; barra del guardiano con la fase e
la debolezza; **mappa** delle stanze già viste; mirino in prima persona.

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

## 11. Struttura completa ✅

Venti livelli in cinque ali (tabella al §6.2). Ogni livello: esplorazione →
elementi e schede → sintesi → terminale (tre enigmi) → paratia → ascensore.
Ogni quarto livello l'ascensore sta nell'arena di un guardiano e si sblocca
quando il guardiano è fermo.

**Salvataggio**: a ogni livello si salvano inventario, composti, ricette,
codex e punti; il livello più alto raggiunto sblocca la **scelta del
livello** dal titolo. Chi comincia da un livello avanzato riceve le ricette
che avrebbe già (quelle delle ali precedenti, i premi dei guardiani passati e
quelle che servono al guardiano di quell'ala). Le vite si ricaricano a ogni
livello.

---

## 12. Che cosa resta dell'applicazione sotto il gioco

* le **domande** arrivano dai 28 generatori di `bsi-gioco-domande.js`, che
  leggono le tabelle vere del sito;
* gli **elementi** arrivano da `ELEMENTS`;
* le **strutture molecolari** degli enigmi sono descritte come dati (atomi con le coordinate, legami con l'ordine) e disegnate da una funzione sola;
* il **cambio lingua** è quello dell'applicazione;
* tutto **funziona offline**: Three.js è già nel repository e in cache.
