# 16 · Atomic Protocol — progetto del gioco

> Documento di progetto. Descrive che cosa si costruisce e **perché**, prima di
> costruirlo. Le parti già realizzate sono marcate ✅, quelle in costruzione 🔧.
> Versione 3 (bsi-v210): figure rifatte nel realismo grezzo PS1, cento livelli.
> Il gioco vive nella sezione **🎮 Atomic Protocol** dell'applicazione e usa i
> dati scientifici che l'applicazione ha già: tavola periodica, spettri,
> reazioni, retrosintesi, amminoacidi, farmaci, sicurezza, costanti, tecniche
> di laboratorio, biomolecole, vie metaboliche.

---

## 0. Che cos'è, in una riga

Un gioco di **esplorazione in terza o prima persona**, in **cento livelli** e
dieci zone, nello **stile PlayStation 1** — il realismo grezzo di Resident
Evil, Silent Hill, Metal Gear Solid, Parasite Eve — in cui un chimico
attraversa un istituto di ricerca sigillato, raccoglie **elementi**, li
**sintetizza** in composti, e usa la chimica — quella vera — per risolvere
enigmi e fermare dieci guardiani.

**Non è un runner.** Non si corre da soli, non si va «avanti e basta»: si
cammina, ci si guarda intorno, si torna indietro, si apre una paratia che prima
era chiusa perché adesso si ha la risposta giusta.

Quattro file, una casa per funzione: `bsi-atomic-figure.js` (protagonista,
residui, guardiani), `bsi-atomic-grafica.js` (ambienti, materiali, luci),
`bsi-atomic-livelli.js` (dati: livelli, guardiani, ricette, enigmi — il banco
li verifica senza disegnare un fotogramma), `bsi-atomic.js` (il gioco).

---

## 1. Direzione artistica — PS1, realismo grezzo ✅

### 1.1 Il trucco dei migliori titoli PS1: pochi poligoni, texture dipinte

Il viso di un personaggio di Resident Evil sono una ventina di triangoli; quello
che lo rende un uomo è un'immagine di 64 pixel con gli occhi, le sopracciglia,
l'ombra del naso e la barba. Qui si fa lo stesso, e le texture sono **dipinte
da codice** — niente immagini da scaricare, funziona offline.

| limite o tecnica della PS1 | come si rifà qui | perché si vede |
|---|---|---|
| luce calcolata sui vertici, sfumata fra un vertice e l'altro (Gouraud) | `MeshLambertMaterial` **senza** facce piatte; i pavimenti suddivisi perché la luce abbia vertici su cui cadere | le figure sono modellate dalla luce, le stanze sono illuminate a chiazze |
| vertici a coordinate intere | **vertex snapping** nello shader: la posizione proiettata arrotondata a una griglia | i poligoni tremano quando ci si muove |
| colore a 15 bit (5 per canale) con retinatura | nello shader il colore scende a 31 livelli per canale con la **retinatura ordinata di Bayer** 4×4 | il grano fine su ogni sfumatura |
| risoluzione bassa, pixel netti | 480×360 di partenza (320 e 640 a scelta), `image-rendering: pixelated`, texture senza filtro | bordi scalettati, texture nette |
| niente ombre proiettate | **ombre a macchia** sotto le figure | le figure poggiano sul pavimento |
| nebbia densa | nebbia lineare da 4 a 22 m, del colore della zona | i corridoi diventano minacciosi |

### 1.2 Il protagonista

Un metro e settantotto, con le proporzioni di un adulto vero: bacino a 95 cm,
spalle a 1,43 m, la testa un ottavo dell'altezza, il torace a sezione
ellittica, le braccia che arrivano a metà coscia, le mani con il pollice.

* **La testa** è una sfera deformata — mandibola che si stringe, mento,
  zigomi, arcata sopraccigliare, naso, nuca — con una **proiezione piana**:
  metà texture è la faccia vista di fronte, metà la nuca. Il viso è dipinto:
  occhi con le palpebre, occhiaie, sopracciglia folte, ombra del naso, narici,
  bocca seria, pieghe naso-labiali, barba di un giorno, una cicatrice.
* **Il camice** è in tre pezzi: il busto dipinto con i revers aperti sulla
  camicia e la cravatta, l'abbottonatura, il taschino con la penna e il
  dosimetro, il cartellino con la foto, una bruciatura d'acido; le **falde**,
  due pannelli separati che seguono le gambe; le maniche con le grinze al
  gomito. Pieghe, sporco in fondo e aloni di reagente sono nella texture.
* **L'attrezzatura** di chi lavora davvero con i reagenti: guanti di butile
  lunghi, stivali di sicurezza con la suola, semimaschera al collo con i due
  filtri P100, occhiali di protezione alzati sulla fronte, torcia, cintura con
  il marsupio.

### 1.3 Le animazioni

Ogni giunto ha un bersaglio calcolato dal passo e ci va **per gradi**: è lo
smorzamento che toglie la rigidità. Il passo è misurato in metri percorsi
(i piedi non scivolano); il ginocchio si piega mentre la gamba avanza; il
bacino sale e scende due volte per ciclo e ruota con le anche, il busto ruota
al contrario, la testa compensa e resta sull'orizzonte; le falde del camice
seguono le cosce in ritardo; di corsa il busto si inclina e i gomiti si
piegano; in curva ci si inclina; da fermo si respira, il peso passa da una
gamba all'altra e ogni tanto ci si guarda intorno.

### 1.4 Grafica moderna, a scelta

Le stesse figure con materiali fisici (PBR), riflessi d'ambiente, ombre
morbide, tone mapping ACES; *alta* con le ombre, *media* senza. Il costo si
paga disegnando solo la stanza in cui si è e quelle attaccate alle sue porte,
e tenendo le luci sempre in numero fisso, spostate sulle plafoniere vicine.

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

### 2.2 Impostazioni

| voce | valori | predefinito | dove si salva |
|---|---|---|---|
| **Visuale** | terza persona · prima persona | terza persona | `localStorage` → `bsi-ap-visuale` |
| **Difficoltà** | Facile · Normale · Difficile · Esperimento | Normale | `bsi-ap-difficolta` |
| **Grafica** | PS1 · moderna alta · moderna media | PS1 | `bsi-ap-grafica` |
| **Risoluzione PS1** | 320×240 · 480×360 · 640×480 | 480×360 | `bsi-ap-risoluzione` |
| **Suono** | acceso · spento | acceso | `bsi-ap-suono` |
| **Lingua** | italiano · inglese (le altre dal selettore dell'applicazione) | quella in uso | `BSILingue` |
| **Come si gioca** | obiettivo, regole e comandi | — | — |

La scelta della **visuale si applica subito**, senza ricaricare: la telecamera
passa da dietro le spalle (terza) a dentro la testa (prima), e in prima persona
il corpo del chimico non si disegna ma le **mani sì**, perché una prima persona
senza mani è una telecamera che vola.

> **Perché la grafica si può cambiare.** Il PS1 è lo stile del gioco, ma il
> tremolio dei vertici e i pixel grossi a qualcuno danno fastidio: la grafica
> moderna usa gli stessi modelli con materiali fisici e ombre. Cambiarla non
> perde la partita.

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

### 8.1 Gli altri nove guardiani

Niente anelli perfetti, cristalli puliti o melme simpatiche: sono quello che
resta di macchine e persone dopo un esperimento andato male. Superfici
deformate dal rumore, texture sporche, silhouette che non sono solidi
geometrici.

| livello | guardiano | com'è fatto | fasi |
|---|---|---|---|
| 20 | IL POLIMERO | colonna di plastica fusa e carne, una maschera antigas fusa nella «testa», fili che pendono fino a terra, vetreria inglobata, un nocciolo di magma in una cavità | **H₂O₂** → **H₂SO₄** → il nucleo |
| 30 | LO SPETTRO | una persona carbonizzata che galleggia: crepe di brace, costole, cranio con la mandibola aperta, braccia ad artiglio, stracci del camice, schegge di vetro dello spettrometro che le girano attorno | **acido ascorbico** → **CO₂** → il corpo |
| 40 | ELICA | una colonna vertebrale avvolta a doppia elica, tenuta insieme da fasci di carne, costole al posto delle basi, radici nel pavimento, un bulbo con una fessura | **basi complementari** (risposta) → **NaOH** → lo scheletro |
| 50 | LA CELLA | vasca elettrolitica arrugginita, elettrodi coperti di verderame, dendriti di rame ramificati, una massa viva al centro, cavi che fanno scintille | **redox bilanciata** (risposta) → **HNO₃** (Cu + 4 HNO₃ → Cu(NO₃)₂ + 2 NO₂ + 2 H₂O) → gli elettrodi |
| 60 | IL GELO | un Dewar spaccato dal di dentro, lastre di ghiaccio irregolari, un braccio congelato che esce dal metallo | **CaO** (CaO + H₂O → Ca(OH)₂, esotermica) → **magnesio** → il nucleo |
| 70 | LA DOSE | un corpo gonfio e accasciato, capsule incastrate nella carne, siringhe piantate, una flebo su un'asta piegata | **principio attivo** (risposta) → **NaOH** (idrolisi degli esteri) → il cuore |
| 80 | IL DECADIMENTO | fusti di scorie ammaccati fusi in una crescita che brilla di verde, squame di piombo, un cartello col trifoglio piegato | **piombo** (schermo) → **bilanciare** (risposta) → i nuclei |
| 90 | LA MELMA | il fango del depuratore alzato: pseudobraccia, una grata, ossa, bolle | **CaO** (pH > 12) → **cloro** → il centro |
| 100 | PROTOCOLLO 12 | il reattore chiodato e ammaccato, uno squarcio da cui si vede il nucleo di magma, crepe incandescenti, carne che sale dalla base, cavi, anelli di raffreddamento spezzati | **bilanciare** (risposta) → **NaHCO₃** → **argon** → il nucleo, quattro colpi |

I **residui** che strisciano nelle stanze non sono gelatine: una massa bassa
che si trascina, un torace che emerge con le costole, un cranio mezzo sciolto,
due appendici che erano braccia e graffiano il pavimento, una scia. Niente
occhi. Un ossidante li scioglie.

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
