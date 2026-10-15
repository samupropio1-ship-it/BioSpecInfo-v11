# 16 · Atomic Protocol — progetto del gioco

> Documento di progetto. Descrive che cosa si costruisce e **perché**, prima di
> costruirlo. Le parti già realizzate sono marcate ✅, quelle in costruzione 🔧.
> Versione 8 (bsi-v215): le mani, la manica del camice e la pistola a capsula dai modelli scelti dall'utente, con le pose fatte dei fotogrammi della loro animazione; prima, nella versione 7, gli ambienti art déco, la mano sinistra-plasmide, trenta registrazioni audio — sempre sulla trama del Protocollo 12.
> Il gioco vive nella sezione **🎮 Atomic Protocol** dell'applicazione e usa i
> dati scientifici che l'applicazione ha già: tavola periodica, spettri,
> reazioni, retrosintesi, amminoacidi, farmaci, sicurezza, costanti, tecniche
> di laboratorio, biomolecole, vie metaboliche.

---

## 0. Che cos'è, in una riga

Un gioco di **esplorazione in prima persona**, in **cento livelli** e
dieci zone, con grafica di **livello PlayStation 2** — il riferimento sono
Metal Gear Solid 2, Final Fantasy X, Resident Evil 4, **senza horror** — in cui
un chimico attraversa un istituto di ricerca sigillato, raccoglie
**elementi**, li **sintetizza** in composti, e usa la chimica — quella vera —
per risolvere enigmi e fermare dieci macchine andate fuori controllo.

**Non è un runner.** Non si corre da soli, non si va «avanti e basta»: si
cammina, ci si guarda intorno, si torna indietro, si apre una paratia che prima
era chiusa perché adesso si ha la risposta giusta.

Quattro file, una casa per funzione: `bsi-atomic-figure.js` (protagonista,
residui, guardiani), `bsi-atomic-grafica.js` (ambienti, materiali, luci),
`bsi-atomic-livelli.js` (dati: livelli, guardiani, ricette, enigmi — il banco
li verifica senza disegnare un fotogramma), `bsi-atomic.js` (il gioco).

---

## 1. Direzione artistica — livello PS2, serio, non horror ✅

### 1.1 Che cosa separa la PS2 dalla PS1, e come si fa qui

| voce | come è fatta | perché si vede |
|---|---|---|
| figure con migliaia di poligoni e superfici lisce | la testa è una sfera da quasi 8000 triangoli deformata a mano; la figura intera ne ha circa 29 000 | le sagome sono curve, non segmenti |
| occhi modellati | bulbo con l'iride dipinta (raggi, pupilla, limbo), palpebra superiore che copre la parte alta | lo sguardo è vivo, non dipinto |
| viso dipinto a sfumature, senza contorni | pelle, rossore, ombra delle orbite, sotto il naso e il labbro, luce su fronte e mento, sopracciglia fatte di peli, barba rasata come un velo | i contorni neri sono quello che fa sembrare un volto un cartone animato |
| mani e vestiti modellati | mani a cinque dita, ognuna in tre falangi; camice con revers estrusi, colletto, tasche, bottoni, cartellino; scarpe da un profilo laterale estruso | le cose che si toccano sono oggetti, non disegni |
| texture ad alta risoluzione con mappe di rilievo | 512 px in alta; le pieghe del camice, la trama dei pantaloni, le giunture e i rivetti dei pannelli sono nella mappa di rilievo | la luce le fa vedere mentre ci si muove |
| bagliori | sprite additivi a gradiente su plafoniere, schermi, LED, fari, nuclei | è il «bloom» di quella generazione, e costa quasi niente |
| materiali fisici, ombre, riflessi | PBR, ombre morbide dal faro che segue il giocatore, riflessi d'ambiente, tone mapping ACES | acciaio, vernice, gomma, vetro e pelle si distinguono |

### 1.2 Il protagonista

Un metro e settantotto con le proporzioni di un adulto: bacino a 95 cm, spalle
a 1,43 m, la testa un ottavo dell'altezza, il torace a sezione ellittica. Camice
bianco chiuso con i revers su camicia azzurra e cravatta, taschino con la penna,
cartellino del direttore, falde separate con le tasche che seguono le gambe;
pantaloni grigio scuro con la piega; guanti di nitrile azzurri; scarpe da
laboratorio. Animazioni smorzate: passo misurato in metri, ginocchia che si
piegano nel verso giusto, bacino e busto in controrotazione, testa
stabilizzata, falde in ritardo, respiro e cambio di peso da fermo.

### 1.2b Nello spirito di BioShock, sulla trama del Protocollo 12

BioShock è il riferimento per **atmosfera, mani, dinamiche e misteri** — non per
la storia, che resta quella del Protocollo 12. Le due si incontrano in un punto
preciso: anche qui c'è una **frase-comando** («riprendere comunque») e un
protagonista che obbedisce senza ricordare.

* **Gli ambienti** sono art déco: l'Istituto è stato costruito come monumento al
  suo finanziatore. Marmo a scacchi crema e verde con il filetto d'ottone,
  zoccolo in noce a riquadri con il corrimano d'ottone, carta da parati verde
  petrolio con colonne e ventagli d'oro, cornice di marmo in alto, lesene
  scanalate con capitello e base d'ottone, applique a ventaglio dalla luce
  calda, plafoniere di vetro smerigliato con l'anello d'ottone, soffitto a
  cassettoni, portali d'ottone a gradini sui vani, targhe verdi con le lettere
  d'oro. **Manifesti** dell'Istituto («Il progresso non chiede permesso») e del
  **Consorzio Albedo** («Il futuro ha un fornitore»); **scritte a gesso** sui muri
  («Chi ha firmato?», «Non obbedire»); il soffitto che perde e le gocce nelle
  pozze. Luce ambra, poca luce d'ambiente, nebbia: pozze di luce e ombra.
* **Le mani**: la destra impugna il dispensatore (i composti), la sinistra
  evoca gli **elementi** come un plasmide — scintille con l'arco elettrico per i
  metalli, fiamma che sale per i combustibili, vapore che gira per i gas, luce
  per il resto — con una luce vera dal palmo che illumina il guanto; usandoli,
  la mano spinge in avanti e lancia la scarica.
* **I misteri**: trenta **registrazioni** su magnetofoni déco, tre per zona
  (livelli 2, 5, 8), con sette voci — Sarti, il Custode, Lenzi, Vela, Moro,
  l'avv. Ferri del Consorzio Albedo, e il Direttore. Si ascoltano mentre si
  gioca, con la sintesi vocale del dispositivo (un tono e una velocità per
  voce) e i sottotitoli su una targa d'ottone; finiscono nel Codex. Raccontano,
  in ordine: il Custode che sigilla l'Istituto; il Consorzio che finanzia e
  pretende; Sarti che scopre la frase-comando e il condizionamento
  farmacologico; il Direttore che si lascia messaggi e trova la propria firma
  sotto il contratto; le prove nascoste nel ghiaccio, nella carta e nel DNA; il
  Custode che non tiene prigioniero il Direttore ma lo protegge da chi direbbe
  la frase; l'ultima voce di Ferri alla radio, «riprendere comunque», e la
  risposta finale del Direttore: un'equazione bilanciata.
* **L'HUD** è déco: la salute a tacche rosse e il reagente in mano in blu, in
  cornici d'ottone; i nomi delle stanze in un carattere con le grazie.

### 1.3 La prima persona

Si gioca in prima persona: quello che si vede di sé sono le braccia, per tutta
la partita, e sono la cosa più curata del gioco.

* **Le braccia** stanno in una scena loro, con una telecamera loro (campo
  visivo più stretto), disegnate dopo il mondo e dopo aver cancellato la
  profondità: non entrano mai nei muri, come in ogni gioco in prima persona.
  Hanno luci proprie e i riflessi d'ambiente del livello.
* **I modelli** (dalla v215): le braccia sono fatte con tre modelli forniti
  dall'utente, in `models/` e preparati da `tools/prepara-modelli.js` (crediti
  in `models/CREDITS.md` e nel Codex). Le **mani** sono un modello con lo
  scheletro (23 ossa per mano) e una clip di 21 secondi: il gioco la campiona
  (le sole ossa delle dita, 15 fotogrammi al secondo) e costruisce ogni posa
  fondendo i fotogrammi dito per dito — aperta, pugno, la flessione della
  clip — per cui la presa, il dito sul grilletto, il palmo del potere e il
  gesto d'attesa sono pose di quella mano. La pelle diventa **nitrile**
  ricolorando la texture dalla sua luminosità, così nocche, unghie e pieghe
  si leggono sotto la gomma; la mappa delle normali resta quella del modello.
  Ogni mano si allinea da sola alla manica (polso, asse dell'avambraccio,
  verso del palmo) e la piega del polso la fa l'osso del polso, così
  l'avambraccio resta dentro la manica; la sinistra del modello è la destra
  specchiata, e lì la piega cambia verso. La **manica** è l'avambraccio
  ritagliato da una scansione di uno scienziato in camice, con l'orlo e il
  polsino azzurro della camicia: il lato verso il busto nella scansione era
  fuso col corpo, quindi sta in basso, dove non si vede, con la manica
  procedurale dentro come fodera. La **pistola a capsula** prende il posto
  del dispensatore: la sua impugnatura si allinea all'anello delle dita
  chiuse e al palmo, poi il polso devia (al massimo 0,6 rad, quanto un polso
  vero) perché la canna guardi avanti; il resto lo fa la pistola che ruota
  nella presa. La capsula prende il colore del composto, il grilletto segue
  l'indice, lo spruzzo parte dalla punta della canna. Finché i modelli non
  arrivano (offline al primo avvio) restano le braccia procedurali qui sotto.
* **Le maniche** del camice sono tubi aperti con il polsino cucito, l'interno
  in ombra e il bordo del guanto che esce. **Le mani** sono anatomiche: ogni
  dito è un unico tubo che segue le tre falangi lungo una curva, si
  assottiglia verso la punta, si gonfia appena sulle nocche e finisce con il
  polpastrello; il palmo è un volume solo, con il dorso piatto, il rilievo
  delle nocche, l'eminenza del pollice e il polso che si stringe. La destra
  avvolge l'impugnatura, la sinistra è rilassata.
* **Il dispensatore**, nella destra: corpo in polimero con gli anelli cromati,
  impugnatura in gomma, la fiala di vetro con il liquido del colore del
  composto, lo schermo sul fondo con la formula e le dosi, l'ugello con il LED
  e il bagliore. Cambiando quello che si ha in mano lo strumento si abbassa e
  risale, e lo schermo si aggiorna quando è giù.
* **Il movimento**: le braccia oscillano col passo (un otto, più ampio di
  corsa), restano indietro quando ci si gira e recuperano, respirano da ferme,
  affondano all'atterraggio, rinculano spruzzando — con una nuvola di
  goccioline del colore del composto — e la sinistra si allunga a prendere e a
  toccare. La testa sale e scende col passo e si inclina appena spostandosi
  di lato.
* **Lo sguardo**: sul computer si clicca sulla scena e il mouse muove lo
  sguardo (puntatore bloccato, Esc lo libera); sul telefono si trascina il
  dito sulla scena. Lo sguardo verticale si ferma dove si ferma una testa. Il
  mirino si allarga quando si guarda qualcosa che si può toccare.

La terza persona resta come scelta, con il chimico intero.

### 1.4 Grafica alta, media, PS1

*Alta* di partenza; *media* — stessi modelli, texture a metà risoluzione, senza
ombre proiettate — sui telefoni con pochi processori; *PS1 retrò* a scelta:
pochi segmenti, texture piccole senza filtro, luce sui vertici sfumata,
vertici agganciati alla griglia, colore a 15 bit con la retinatura di Bayer,
480×360 a pixel quadrati. Cambiarla non perde la partita.

Il costo si paga disegnando solo la stanza in cui si è e quelle attaccate alle
sue porte, tenendo le luci sempre in numero fisso (spostate sulle plafoniere
vicine) e liberando la memoria della scheda video a ogni cambio di livello.

---

## 2. Menu e impostazioni ✅ (progetto) 🔧 (codice)

### 2.1 Schermata iniziale

```
            ATOMIC PROTOCOL
     ── protocollo di contenimento ──

              ▸ CONTINUA · livello N
                NUOVA PARTITA
                SCEGLI LIVELLO (N/100)
                IMPOSTAZIONI
                COME SI GIOCA
                CODEX
```

«CONTINUA» appare solo se c'è una partita salvata; «SCEGLI LIVELLO» apre i
livelli già raggiunti, divisi per zona, con i guardiani segnati.

Il gioco si apre da un **pulsante flottante** in basso a destra, sopra Spectra
e il menu ✨: una pillola viola e arancio con l'icona propria — l'esagono del
benzene come scudo di contenimento, la beuta con il liquido luminoso,
l'elettrone che le gira intorno. Nella barra delle sezioni non c'è più: vi
resta un pulsante nascosto, quello che il sito usa per cambiare sezione.
Mentre la sezione del gioco è aperta i pulsanti flottanti si tolgono di
mezzo, perché coprivano la scena.

### 2.2 Impostazioni

| voce | valori | predefinito | dove si salva |
|---|---|---|---|
| **Visuale** | prima persona · terza persona | prima persona | `localStorage` → `bsi-ap-visuale` |
| **Difficoltà** | Facile · Normale · Difficile · Esperimento | Normale | `bsi-ap-difficolta` |
| **Grafica** | alta (PS2) · media · PS1 retrò | alta (media sui telefoni con pochi processori) | `bsi-ap-grafica` |
| **Risoluzione PS1** | 320×240 · 480×360 · 640×480 | 480×360 | `bsi-ap-risoluzione` |
| **Suono** | acceso · spento | acceso | `bsi-ap-suono` |
| **Lingua** | italiano · inglese (le altre dal selettore dell'applicazione) | quella in uso | `BSILingue` |
| **Come si gioca** | obiettivo, regole e comandi | — | — |

La scelta della **visuale si applica subito**, senza ricaricare: la telecamera
passa da dietro le spalle (terza) a dentro la testa (prima), e in prima persona
il corpo del chimico non si disegna ma le **mani sì**, perché una prima persona
senza mani è una telecamera che vola.

> **Perché la grafica si può cambiare.** L'alta chiede una scheda video
> discreta; la media regge su un telefono; il PS1 è per chi ama lo stile
> retrò. Gli stessi modelli si costruiscono con più o meno segmenti e texture
> più o meno grandi. Cambiarla non perde la partita.

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

## 6. I cento livelli ✅

### 6.1 Come si genera un livello

Le stanze stanno su una **griglia** di colonne e righe di larghezza variabile
(6 m i corridoi, 10–15 m le sale). Due stanze in celle vicine **condividono un
muro**, e la porta è al centro di quel muro: per costruzione le porte
combaciano sempre, e non esiste un corridoio che finisce nel vuoto.

1. Il **percorso principale** è una passeggiata che non torna sui suoi passi e
   preferisce andare avanti; la sua lunghezza cresce dentro la zona e da una zona all'altra (da 4 a 10
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
6. I **residui** crescono dentro la zona e con la zona (fino a 10), mai nella stanza di
   partenza.

Il seme è il numero del livello: lo stesso livello è sempre lo stesso, su ogni
motore JavaScript (il caso si estrae prima di ordinare, mai dentro il
comparatore).

### 6.2 Le dieci zone

Dieci livelli per zona: dentro una zona i livelli crescono (più stanze, più
residui) fino al guardiano, e ogni zona parte un po' più dura della
precedente. Per arrivare a 150 o 200 livelli basta aggiungere zone e
guardiani: il generatore non ha altri numeri scritti dentro.

| livelli | zona | elementi | ricette nuove | guardiano |
|---|---|---|---|---|
| 1–10 | Ala Ovest · Stoccaggio reagenti | H, Cl, Na, O | HCl, H₂O₂ | **POMPA 7** |
| 11–20 | Ala Nord · Sintesi organica | C, N, S, O, H | H₂SO₄, NH₃, CO₂ | **IL POLIMERO** |
| 21–30 | Ala Est · Spettroscopia | F, Fe, Mg, C, O, H | acido ascorbico, MgO | **LO SPETTRO** |
| 31–40 | Ala Sud · Biochimica | P, K, Ca, Na, O, H | NaHCO₃ | **ELICA** |
| 41–50 | Sotterraneo · Elettrochimica | Cu, Zn, N, O, H, S | HNO₃ | **LA CELLA** |
| 51–60 | Celle frigorifere · Criogenia | N, Ar, Ca, Mg, O, H | CaO | **IL GELO** |
| 61–70 | Reparto farmaci · Farmacologia | C, N, O, H, S, Cl, Na | — | **LA DOSE** |
| 71–80 | Bunker · Radiochimica | Pb, U, Ba, O, H, C | — | **IL DECADIMENTO** |
| 81–90 | Impianto · Depurazione | Fe, Al, Ca, Cl, O, H, S | — | **LA MELMA** |
| 91–100 | Il Nucleo | Ar, Au, Pb, Na, C, O, H | — | **PROTOCOLLO 12** |

L'arena di un guardiano è larga almeno 14 m per lato: si allargano la
colonna e la riga della sua cella, e le porte continuano a combaciare.

### 6.3 Gli enigmi per zona

| zona | i tre passi del terminale |
|---|---|
| 1 | gruppo funzionale cerchiato · nome IUPAC · costruire la catena |
| 2 | nome IUPAC · bilanciare · costruire |
| 3 | domanda dal sito · bilanciare · nome IUPAC |
| 4 | DNA complementare · domanda dal sito · gruppo funzionale |
| 5 | bilanciare · domanda dal sito · nome IUPAC |
| 6 | costruire · bilanciare · domanda dal sito |
| 7 | gruppo funzionale · domanda dal sito · nome IUPAC |
| 8 | bilanciare · DNA complementare · domanda dal sito |
| 9 | domanda dal sito · gruppo funzionale · bilanciare |
| 10 | bilanciare · DNA complementare · domanda dal sito |

Le «domande dal sito» arrivano dai 28 generatori di `bsi-gioco-domande.js`:
spettri, farmaci, GHS, costanti, tecniche di laboratorio, vie metaboliche.

### 6.4 Il tono

Le plafoniere al neon, la luce rossa di emergenza che pulsa durante gli scontri,
cartelli con il nome del locale e i pittogrammi di pericolo, estintori, tubi
che corrono sotto il soffitto. Ogni ala ha la sua nebbia e il colore delle
sue lampade.

### 6.5 La trama

Dieci capitoli, uno nel primo livello di ogni zona, e il finale: il verbale
del Custode («riprendere comunque», con una calligrafia familiare); il diario
della dott.ssa Sarti (il Protocollo 12 è una sintesi che si alimenta da sola);
il registro dello spettrometro (la firma è quella del tuo badge); la nota
nascosta nel DNA (i vapori cancellano le ultime ore); il quadro elettrico (la
corrente deviata sul reattore, autorizzata da te); le celle frigorifere (un
campione di due anni fa, con la tua firma: lo stai rifacendo); il fascicolo del
farmaco (chi respira i vapori dimentica); le telecamere del bunker (il
direttore sei tu); l'ultima registrazione di Sarti (è rimasta dentro a chiudere
le fogne); e il Nucleo, dove il Custode parla per la prima volta.

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

## 8. Il primo guardiano — «POMPA 7» ✅

**Che cos'è**: la pompa centrifuga del circuito di raffreddamento — chiocciola
blu con le flange imbullonate, oblò d'ispezione da cui si vede la girante che
gira, motore con le alette, coprigiunto giallo, tubazioni, la valvola rossa —
con i due **bracci idraulici della manutenzione automatica** che non si fermano
più. È coperta di piastre di corrosione; due manometri e un faro rotante
segnalano l'allarme; il quadro di controllo dice «blocco: NEGATO».

**Fasi**

1. **La ruggine.** Le piastre di corrosione la proteggono. Serve un **acido**:
   `HCl` (Fe₂O₃ + 6 HCl → 2 FeCl₃ + 3 H₂O). L'idrogeno puro o una base non fanno
   niente. Sciolta la corrosione, le piastre spariscono.
2. **Il vapore.** Il circuito si apre e la stanza si riempie di vapore: serve
   **sodio**, che con l'acqua libera idrogeno e calore e fa saltare le valvole.
3. **Il rotore.** Scoperto: qualunque cosa va, ma la finestra si richiude se
   non si colpisce in tempo.

**Ricompensa**: la ricetta **NaOH**, e l'ascensore verso l'Ala Nord.

### 8.1 Gli altri nove guardiani — le macchine dell'istituto

Nessuna creatura: sono macchinari di laboratorio veri, con bracci robotici,
carrelli, quadri di controllo, fari rotanti e bagliori, che non rispondono più
ai comandi. Minacciosi come lo è una macchina industriale fuori controllo.

| livello | guardiano | com'è fatto | fasi |
|---|---|---|---|
| 20 | IL POLIMERO | l'estrusore: reattore cromato con l'oblò sulla resina, cilindro con le fasce riscaldanti incandescenti, tramoggia, testa da cui cola il polimero ambrato, braccio robotico | **H₂O₂** → **H₂SO₄** → il nucleo |
| 30 | LO SPETTRO | il banco laser su tavolo ottico in granito: torretta con tre emettitori che ruota e spazza la stanza con i fasci, prismi, specchi orientabili | **acido ascorbico** → **CO₂** → la torretta |
| 40 | ELICA | il robot sequenziatore: portale con il carrello delle pipette che corre avanti e indietro, camera di vetro con il modello della doppia elica che ruota | **basi complementari** (risposta) → **NaOH** → il carrello |
| 50 | LA CELLA | l'impianto di elettrolisi: due vasche, elettrodi e sbarre di rame, dendriti di rame cresciuti fuori dal liquido, raddrizzatore, scintille | **redox bilanciata** (risposta) → **HNO₃** (Cu + 4 HNO₃ → Cu(NO₃)₂ + 2 NO₂ + 2 H₂O) → gli elettrodi |
| 60 | IL GELO | il criostato: tre Dewar d'acciaio con la brina alla base, sfiati che buttano vapore d'azoto, braccio che carica le provette | **CaO** (esotermica con l'acqua) → **magnesio** → il braccio |
| 70 | LA DOSE | la farmacia automatica: parete di cassetti, prelevatore sul binario, nastro con i flaconi, tramoggia di vetro piena di capsule | **principio attivo** (risposta) → **NaOH** (idrolisi degli esteri) → il prelevatore |
| 80 | IL DECADIMENTO | la cella calda: parete di schermo con la finestra al piombo, manipolatori a pinza, piscina con la luce blu di Čerenkov, fusti gialli col trifoglio | **piombo** (schermo) → **bilanciare** (risposta) → i manipolatori |
| 90 | LA MELMA | il chiarificatore: vasca circolare, fango lucido con le bolle, ponte raschiatore che gira, pompa dei fanghi | **CaO** (pH > 12) → **cloro** → il ponte |
| 100 | PROTOCOLLO 12 | il reattore: recipiente in pressione con la calotta imbullonata, oblò sul nucleo incandescente, barre di controllo che salgono e scendono, anelli magnetici con le bobine di rame che girano, tubazioni | **bilanciare** (risposta) → **NaHCO₃** → **argon** → il nucleo, quattro colpi |

I **residui** che si muovono nelle stanze sono chiazze di solvente organico:
una pozza lucida e irregolare che scivola sul pavimento, con le bolle che si
gonfiano e i vapori che salgono. Un ossidante la degrada.

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

Cento livelli in dieci zone (tabella al §6.2). Ogni livello: esplorazione →
elementi e schede → sintesi → terminale (tre enigmi) → paratia → ascensore.
Il decimo livello di ogni zona finisce nell'arena del suo guardiano, e
l'ascensore si sblocca quando il guardiano è fermo.

**Salvataggio**: a ogni livello si salvano inventario, composti, ricette,
codex e punti; il livello più alto raggiunto sblocca la **scelta del
livello** dal titolo. Chi comincia da un livello avanzato riceve le ricette
che avrebbe già. Le vite si ricaricano a ogni livello.

**Stabilità**: passando da un livello all'altro si liberano le geometrie e
le texture del livello precedente — togliere un gruppo dalla scena non libera
la memoria della scheda video, e su cento livelli la differenza è fra un gioco
che regge e uno che si pianta. Il banco lo misura attraversando dieci livelli
con quattro guardiani.

---

## 12. Che cosa resta dell'applicazione sotto il gioco

* le **domande** arrivano dai 28 generatori di `bsi-gioco-domande.js`, che
  leggono le tabelle vere del sito;
* gli **elementi** arrivano da `ELEMENTS`;
* le **strutture molecolari** degli enigmi sono descritte come dati (atomi con le coordinate, legami con l'ordine) e disegnate da una funzione sola;
* il **cambio lingua** è quello dell'applicazione;
* tutto **funziona offline**: Three.js è già nel repository e in cache.
