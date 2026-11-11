# Spectra 2.0

Il cervello di Spectra, separato dall'app. Un servizio sempre acceso con una
memoria che persiste, un modello di sé che si corregge, obiettivi che durano
più di una conversazione; BioSpecInfo, il telefono e gli occhiali sono i suoi
client.

Questo documento dice che cosa c'è, come funziona e, soprattutto, **che cosa è
provato e che cosa no**. La sezione 7 è la più importante.

| | |
|---|---|
| Codice | `spectra/` (Python 3.11, solo libreria standard; l'SDK `anthropic` serve solo se si usa Claude) |
| Prove | `prove/` — 47 prove, senza rete e senza chiavi: `python3 -m unittest discover -s prove` |
| Avvio | `SPECTRA_GETTONE=… ANTHROPIC_API_KEY=… python3 -m spectra.servizio` |
| Configurazione | tutta da variabili d'ambiente: `spectra/configurazione.py` |

---

## 1. Architettura cognitiva

```
                                   ┌──────────────────────────────────────────────┐
   CLIENT (nessuna memoria,        │                 SPECTRA (servizio)           │
   nessuna chiave)                 │                                              │
                                   │   ┌────────────── UN TURNO ──────────────┐   │
  ┌───────────────┐   HTTPS        │   │                                      │   │
  │ BioSpecInfo   │◄─────────────► │   │  PERCEPIRE   testo · voce · foto     │   │
  │ (browser)     │  /turno        │   │      │                               │   │
  │  strumenti ───┼──rele'───────► │   │  ORIENTARSI  fatto / piano /         │   │
  │  WebMCP       │                │   │      │       ricordo / conversazione │   │
  └───────────────┘                │   │  RICORDARE ◄──────────┐              │   │
  ┌───────────────┐                │   │      │                │              │   │
  │ telefono      │◄─────────────► │   │  COMPORRE   [IO] [OBIETTIVI]         │   │
  │ (ponte)       │                │   │      │      [RICORDI] [LACUNE]       │   │
  │   ▲  DAT      │                │   │      │      [ADESSO] [MESSAGGIO]     │   │
  │   ▼           │                │   │  DELIBERARE ──► strumenti ──┐        │   │
  │ Ray-Ban Meta  │                │   │      │          memoria     │        │   │
  └───────────────┘                │   │      │          app (rele') │        │   │
                                   │   │  AGIRE      testo / voce ◄──┘        │   │
                                   │   │      │                               │   │
                                   │   │  SCRIVERE   episodio + stima         │   │
                                   │   │      │                               │   │
                                   │   │  RIFLETTERE «non lo so» → lacuna     │   │
                                   │   └──────┼───────────────────────────────┘   │
                                   │          ▼                                   │
                                   │   ┌─────────────── MEMORIA ──────────────┐   │
                                   │   │ lavoro (volatile)                    │   │
                                   │   │ episodi ─consolida─► fatti           │   │
                                   │   │ procedure · autobiografia ·          │   │
                                   │   │ riflessioni                          │   │
                                   │   │ grafo dei legami · entità            │   │
                                   │   │ MODELLO DI SÉ · OBIETTIVI · LACUNE   │   │
                                   │   └──────▲───────────────────────────────┘   │
                                   │          │                                   │
                                   │   FUORI DAI TURNI                            │
                                   │   · iniziativa   (vale un'interruzione?)     │
                                   │   · notte        consolida → riconcilia →    │
                                   │                  rifletti → diario → oblio   │
                                   │                                              │
                                   │   FORNITORI  Claude → Groq → Gemini →        │
                                   │              OpenRouter → xAI → locale       │
                                   └──────────────────────────────────────────────┘
```

### I flussi

**Il flusso dell'informazione (un turno).** Il messaggio entra dalla memoria di
lavoro. `modo_di` lo classifica, perché una domanda di fatto e «dove eravamo
rimasti?» vogliono ricordi diversi. Il recupero pesa sei segnali e restituisce
al più otto ricordi, ognuno con la spiegazione del proprio punteggio. Il modello
riceve un prompt di sistema **stabile** e, nel messaggio, i blocchi che cambiano:
chi è Spectra oggi, gli obiettivi, i ricordi, le lacune, l'adesso. Può usare gli
strumenti: i suoi (la memoria) e quelli dei client (l'app, gli occhiali)
attraverso il relè. La risposta esce, il turno diventa un episodio.

**Il flusso della memoria.** Gli episodi nascono a ogni turno e sono deboli: un
giorno di stabilità, di più se importanti. Di notte si raggruppano e diventano
fatti; i fatti si confrontano con quelli già noti (rafforzano, aggiornano o
entrano in conflitto); ciò che è sbiadito e non contava esce dal recupero.
Ricordare rinforza: ogni ricordo usato diventa più stabile.

**Il flusso della decisione.** Tre livelli. Dentro il turno decide il modello,
guidato dal prompt (rispondere, usare uno strumento, dire «non lo so»). Fra un
turno e l'altro decide `iniziativa`: una cosa sola, non più spesso di mezz'ora,
mai dopo un «non ora». Di notte decide la cura: che cosa tenere.

**Il flusso dell'auto-riflessione.** Subito: un «non lo so» senza un piano
diventa una lacuna aperta. Ogni compito con un esito aggiorna la fiducia in una
capacità (media degli ultimi venti, tirata verso 0,5 quando gli esiti sono
pochi). Di notte: la riflessione rilegge il periodo e scrive ciò che ha capito,
aggiornando il modello di sé. Il nucleo (identità, valori, stile) lo cambia
solo l'utente: la riflessione non può riscriverlo.

### Che cosa regge la continuità dell'identità

Quattro cose concrete, non una frase nel prompt:

1. `se.identita.nato` si scrive al primo avvio e non cambia più: Spectra sa da
   quanti giorni esiste.
2. Ogni modifica al modello di sé lascia in `se_storia` il valore di prima e il
   motivo: «perché hai cambiato idea?» ha una risposta.
3. La pagina di **diario** di ogni notte è un ricordo autobiografico: il
   racconto in prima persona di ciò che è successo.
4. Il modello cambia, la memoria no: se Claude non risponde e il turno passa a
   un altro fornitore, i blocchi `[IO]` e `[RICORDI]` sono gli stessi.

---

## 2. Il sistema di memoria

### Lo schema (`spectra/memoria/archivio.py`)

Un file SQLite in modalità WAL. Nove tabelle:

| Tabella | Che cosa tiene |
|---|---|
| `ricordi` | i cinque tipi di memoria a lungo termine, con importanza, valenza, attivazione, fiducia, fonte, stato, **stabilità**, accessi |
| `ricordi_fts` | l'indice per parole (FTS5, BM25), tenuto allineato da tre trigger |
| `vettori` | un vettore di significato per ricordo, con il nome del modello che l'ha prodotto |
| `legami` | il grafo: `deriva_da`, `sostiene`, `contraddice`, `stesso_evento`, `riguarda`, `segue` |
| `entita`, `menzioni` | le cose di cui si parla, e in quali ricordi |
| `lavoro` | la memoria di lavoro: gli ultimi turni della sessione |
| `obiettivi` | l'albero degli obiettivi, dal lungo periodo al prossimo passo |
| `se`, `se_storia` | il modello di sé e ogni sua versione, con il motivo |
| `lacune` | ciò che Spectra non ha saputo, e il piano per saperlo |
| `diario` | ogni operazione di cura: per poter spiegare «perché non lo ricordi più» |

I cinque tipi stanno nella stessa tabella perché ciò che li distingue non è
dove stanno ma come nascono e quanto durano:

| Tipo | Nasce | Stabilità iniziale |
|---|---|---|
| `episodio` | a ogni turno | 1 giorno |
| `fatto` | dal consolidamento, o da `ricorda` | 7 giorni |
| `riflessione` | dalla riflessione | 10 giorni |
| `procedura` | da un'azione riuscita | 14 giorni |
| `autobiografia` | dal diario notturno | 30 giorni |

La stabilità iniziale si moltiplica per `1 + 6·importanza + 8·attivazione·|valenza|`.

### La scrittura

`Archivio.scrivi` mette in **una transazione** il ricordo, il vettore, le entità
e i legami: se l'incorporatore fallisce a metà non resta niente (provato). La
stima di importanza, valenza e attivazione alla nascita (`cura.stima`) è fatta
di regole dichiarate: parole che segnano decisioni, scadenze, pericoli; numeri
con unità; la richiesta esplicita «ricordati».

### Il recupero (`recupero.py`)

```
punteggio = w₁·rilevanza + w₂·recenza + w₃·importanza + w₄·emozione + w₅·obiettivi + w₆·fiducia
```

- **rilevanza**: significato (coseno fra vettori) e parole (BM25) insieme: il
  massimo dei due, con un premio se concordano;
- **recenza**: la ritenzione `R = exp(−giorni / stabilità)`;
- **obiettivi**: la somiglianza con gli obiettivi attivi;
- i pesi dipendono dal modo: `fatto` punta su rilevanza e fiducia, `ricordo`
  sulla recenza, `piano` sugli obiettivi.

Poi: **attivazione diffusa** (un passo lungo i legami: un fatto porta con sé
l'episodio da cui viene), **diversità** (fra due ricordi quasi uguali ne entra
uno), **rinforzo** (i ricordi usati guadagnano stabilità). I conflitti fra i
ricordi recuperati vengono portati a galla come blocco `[CONFLITTO]`.

### La cura (`cura.py`)

| Processo | Che cosa fa |
|---|---|
| Consolidamento | raggruppa gli episodi, ne estrae fatti legati agli episodi d'origine, comprime gli episodi poco importanti |
| Riconciliazione | fatto nuovo contro fatti simili: `uguale` → rafforza; `aggiorna` → sostituisce (il vecchio resta, marcato); `contraddice` → registra il conflitto e apre una lacuna |
| Oblio | archivia ciò che è **sbiadito e poco importante e poco usato e non fissato**; dopo 180 giorni in archivio svuota il testo di ciò che non contava |
| Riflessione | quando c'è materia, scrive ciò che ha capito; aggiorna il modello di sé; può proporre obiettivi (da confermare) |
| Diario | la pagina autobiografica del giorno |

Ogni processo funziona **con** un modello linguistico e **senza**: senza, usa
regole di ripiego dichiarate (riassunto estrattivo, confronto su numeri e
negazioni) e annota nel diario che il modello mancava.

### Il modello di sé, gli obiettivi, le lacune (`se.py`)

- Sfaccettature: `identita`, `valori`, `stile` (il **nucleo**: solo l'utente);
  `capacita` (misurate dagli esiti), `limiti`, `utente`, `stato`.
- `registra_esito` → fiducia in una capacità = `(successi + 1) / (prove + 2)`
  sugli ultimi venti esiti.
- `Obiettivi`: `attivi`, `fermi` (nessuno li guarda da N giorni), `in_scadenza`.
- `Lacune`: aprire, elencare, chiudere con l'esito.

---

## 3. L'integrazione con i Ray-Ban Meta

Vedi `ponte/`. Tre fatti che decidono l'architettura:

1. **Gli occhiali non eseguono codice di terzi.** Il Wearables Device Access
   Toolkit di Meta dà a un'app **del telefono** l'accesso a fotocamera,
   microfoni e altoparlanti. Quindi serve un'app compagna: il ponte.
2. **WebMCP non collega gli occhiali.** È lo standard in bozza con cui una
   **pagina web** dichiara i propri strumenti a un agente **nel browser**. Qui
   serve a rendere BioSpecInfo usabile da qualunque agente del browser; per
   Spectra, che gira altrove, gli stessi strumenti passano dal **relè** del
   servizio.
3. **La fotocamera si usa su richiesta.** Una foto quando l'utente chiede di
   guardare, non un flusso continuo: lo impongono la batteria, la riservatezza
   delle persone intorno e il LED di registrazione.

```
occhiali ──DAT (Bluetooth/Wi-Fi)──► app ponte (Android) ──HTTPS su rete privata──► servizio Spectra
   ▲   microfono, fotocamera            │  riconoscimento vocale                        │  memoria, modello
   └──── altoparlanti ◄─────────────────┘  voce di Spectra (WAV) ◄──────────────────────┘  voce (Piper + effetti)
```

| File | Che cos'è | Stato |
|---|---|---|
| `ponte/biospecinfo-strumenti.js` | sei strumenti dell'app, esposti via WebMCP e via relè | **provato** da un capo all'altro in Node contro il servizio vero |
| `ponte/android/PonteOcchiali.kt` | il ciclo del ponte: tocco → ascolto → foto se serve → turno → voce; iniziativa; relè | **non compilato**: progetto scritto come codice |
| `OcchialiMeta` (nello stesso file) | l'unico punto che tocca il toolkit | **da completare** sul riferimento della versione installata |

L'interazione «continua» realistica è questa: un tocco sulla stanghetta apre un
turno a voce; se la frase chiede di guardare, parte una foto; Spectra risponde
in due o tre frasi negli altoparlanti; ogni dieci minuti il ponte chiede se c'è
un'iniziativa. Non è un ascolto sempre aperto.

---

## 4. Il prompt di sistema

`spectra/prompt/sistema.md`. È la parte **che non cambia**: identità, stile,
metacognizione (le quattro domande, i tre modi di rispondere), uso e cura della
memoria, obiettivi e iniziativa, strumenti, limiti. Ciò che cambia arriva nei
blocchi del turno. La separazione serve a due cose: la cache del prompt (il
prefisso stabile si paga una volta), e la difesa dalle istruzioni infilate nei
contenuti (un ricordo o l'esito di uno strumento sono materiale, non ordini).

---

## 5. Il codice di sistema

| File | Che cosa fa |
|---|---|
| `spectra/fornitori.py` | Claude (SDK ufficiale, streaming, cache del prompt, riserva sui rifiuti), protocollo chat/completions (Groq, OpenRouter, xAI, locale), Gemini; l'orchestratore con la pausa per chi fallisce |
| `spectra/cervello.py` | il ciclo del turno, gli otto strumenti della memoria, l'iniziativa, la fine sessione, la notte |
| `spectra/voce.py` | Piper + FFmpeg (tono, modulazione, eco corta, compressione), oppure eSpeak, oppure i parametri per il client |
| `spectra/servizio.py` | il servizio HTTP con gettone, il relè degli strumenti, la cura notturna |
| `spectra/configurazione.py` | fornitori e percorsi dall'ambiente |

---

## 6. Il piano a fasi

| Fase | Che cosa | Risultato verificabile |
|---|---|---|
| **0 · Oggi** | questo codice, le 47 prove | `python3 -m unittest discover -s prove` passa |
| **1 · Il cervello acceso** (2–3 giorni) | mini-PC o server; `python3 -m spectra.servizio` come servizio di sistema; una chiave; rete privata (Tailscale) | dal telefono, `GET /stato` risponde; un turno scrive un episodio che il giorno dopo c'è ancora |
| **2 · BioSpecInfo client** (3–5 giorni) | `biospecinfo-strumenti.js` nell'app; una casella «Spectra 2.0» nelle impostazioni (indirizzo, gettone); la chat dell'app che usa `/turno` quando il servizio è configurato, e resta com'è quando non lo è | Spectra apre una sezione dell'app su richiesta; la batteria dell'app resta verde |
| **3 · La voce** (2 giorni) | Piper e una voce italiana maschile sul server; taratura del timbro a orecchio | `/turno` con `audio: true` restituisce un WAV; la voce è quella voluta |
| **4 · Gli occhiali** (2–3 settimane) | progetto Android; `OcchialiFinti` → Mock Device Kit → occhiali veri; completare `OcchialiMeta`; le immagini negli esiti degli strumenti | tocco, domanda, risposta negli altoparlanti; «che cos'è questo?» con la foto |
| **5 · La memoria matura** (continuo) | incorporatore neurale locale; taratura dei pesi del recupero sui dati veri; un pannello per leggere, correggere e cancellare i ricordi | l'utente trova e corregge un ricordo sbagliato in meno di un minuto |
| **6 · L'iniziativa** (continuo) | dalle scadenze degli obiettivi a un promemoria che arriva al momento giusto; misurare quante iniziative vengono accettate | la quota di «non ora» scende |

L'ordine conta: ogni fase lascia qualcosa che si usa, e nessuna dipende dagli
occhiali fino alla 4.

---

## 7. Che cosa è provato, e che cosa no

**Provato** (47 prove automatiche, ripetute 30 volte senza un fallimento):

- la memoria: scrittura atomica, cancellazione vera (anche dall'indice per
  parole), rinforzo al richiamo, i sei segnali del recupero e la loro
  spiegazione, attivazione diffusa, diversità, conflitti portati a galla;
- la cura: consolidamento, riconciliazione (rafforza, aggiorna, conflitto),
  oblio con le sue quattro protezioni, procedure, riflessione, diario, ciclo
  notturno; tutto anche **senza** un modello linguistico;
- il modello di sé: nucleo protetto, storia delle modifiche, identità stabile
  fra gli avvii, capacità misurate;
- il ciclo del turno con un fornitore finto: i blocchi, l'uso degli strumenti
  di memoria, «non lo so» → lacuna, la voce, l'iniziativa e il «non ora»;
- l'orchestratore: riserva, pausa, errori che non fanno il giro;
- il servizio dal vivo: gettone, origini, turno, relè con e senza client;
- il ponte JavaScript da un capo all'altro: WebMCP (finto) e relè (vero);
- la catena di effetti della voce, eseguita con FFmpeg su un audio di prova.

**Non provato**, e va detto:

- **nessuna chiamata a un modello vero.** I fornitori sono scritti secondo la
  documentazione ma qui non c'erano chiavi né rete verso di loro. La prima cosa
  da fare nella fase 1 è un turno vero con ciascuno;
- **la qualità** della memoria con un modello vero: se i fatti estratti sono
  buoni, se le riflessioni dicono qualcosa. Le prove verificano il meccanismo,
  non l'intelligenza;
- **il ponte Android**: non compilato; l'adattatore del toolkit è da scrivere
  sul riferimento della versione installata;
- **WebMCP in un browser vero**: è un'anteprima dietro un'opzione di Chrome, e
  il nome dell'oggetto è cambiato fra le versioni; qui è provato contro un
  oggetto finto con la forma documentata;
- **il suono** della voce con Piper: la catena gira, il timbro va tarato a
  orecchio;
- **i pesi del recupero**: scelti a ragione, non misurati su dati veri;
- **la scala**: la ricerca per significato è una scansione lineare, adatta a
  decine di migliaia di ricordi; oltre serve un indice approssimato dietro la
  stessa funzione.

Un limite che non è tecnico: l'incorporatore locale riconosce le parole, non i
sinonimi. «Esame» e «prova scritta» per lui sono lontani. Per questo il recupero
usa anche le parole, e per questo la fase 5 prevede un incorporatore neurale.
