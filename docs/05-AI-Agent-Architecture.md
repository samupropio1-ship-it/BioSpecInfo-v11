# Architettura dell'Agente AI "Spectra" — BioSpecInfo

| Campo | Valore |
|-------|--------|
| **Progetto** | BioSpecInfo — componente Spectra (copilota AI agentico) |
| **Autore** | Samuele Pio Provenzano |
| **Relatore tesi** | Prof. Savino Longo — Università degli Studi di Bari Aldo Moro |
| **Componente** | `bsi-ai-hub.js` — 5.486 righe, nessuna dipendenza runtime |
| **Tipo** | Agente conversazionale multi-provider con esecuzione di strumenti lato client |
| **Repository** | `samupropio1-ship-it/BioSpecInfo-v11` |
| **Versione documentata** | Service Worker `bsi-v138` |

---

## 1. Sintesi esecutiva

Spectra è un **agente** — non un semplice wrapper su un modello linguistico.
La differenza è misurabile: il modello non risponde a memoria sui dati
quantitativi, ma **invoca strumenti deterministici** che calcolano il risultato,
e il ciclo di controllo gli permette di **concatenare fino a 10 chiamate**
verificando ogni passaggio prima di rispondere.

L'architettura affronta tre problemi che distinguono un agente utilizzabile da
una demo:

1. **Fondatezza (*grounding*)** — un dato chimico inventato può essere
   pericoloso. 32 strumenti coprono calcolo, banche dati pubbliche e i dataset
   interni dell'applicazione; il prompt di sistema vieta esplicitamente di
   citare valori numerici a memoria.
2. **Trasparenza** — il ragionamento del modello è mostrato in tempo reale e
   conservato accanto alla risposta, insieme all'elenco degli strumenti
   effettivamente invocati. L'operato dell'agente è verificabile a posteriori.
3. **Portabilità fra fornitori** — un unico registro di strumenti viene
   tradotto nei tre formati di *function calling* oggi in uso (OpenAI-compatibile,
   Anthropic, Gemini), così l'agente funziona identico su otto configurazioni
   di modello, incluse tre gratuite.

---

## 2. Architettura

### 2.1 Vista d'insieme

```
┌──────────────────────── browser dell'utente ────────────────────────┐
│                                                                     │
│   UI chat ── pannello ragionamento ── note strumenti                │
│        │                                                            │
│   ciclo agentico  (max 10 giri)                                     │
│        │                                                            │
│        ├── adattatore provider ──► API del modello (HTTPS diretto)  │
│        │      · OpenAI-compatibile (Groq, OpenRouter, xAI)          │
│        │      · Anthropic (Fable 5.1 · Opus 5 · Sonnet 5 · Haiku)   │
│        │      · Gemini                                              │
│        │                                                            │
│        └── esecutore strumenti (32, tutti locali salvo 3 di rete)   │
│               ├── motore di calcolo (parser proprio, no eval)       │
│               ├── risolutori di dominio (13 aree scientifiche)      │
│               ├── dataset interni dell'app (9 basi dati)            │
│               ├── rete: PubChem · PubMed · ricerca web              │
│               └── memoria persistente (localStorage)                │
└─────────────────────────────────────────────────────────────────────┘
```

Non esiste un backend. Le chiavi API restano nel `localStorage` del browser e
viaggiano solo verso il fornitore scelto: nessun dato transita da server di
BioSpecInfo, che non esistono.

### 2.2 Ciclo agentico

Ad ogni giro il ciclo: invia la cronologia (ultimi 40 turni) più il prompt di
sistema e lo schema dei 32 strumenti → riceve la risposta in *streaming* →
se contiene chiamate a strumenti le esegue **tutte** → ricostruisce il turno
assistente nel formato nativo del fornitore → ripete.

Tre condizioni di uscita: nessuna chiamata a strumenti (risposta finale),
`MAX_ROUNDS = 10` esaurito, o interruzione dell'utente.

### 2.3 Registro strumenti neutrale rispetto al fornitore

Gli strumenti sono definiti una sola volta in JSON-Schema e tradotti a runtime:

| Famiglia | Formato richiesto |
|---|---|
| Anthropic | `{name, description, input_schema}` |
| Gemini | `[{functionDeclarations: [...]}]` |
| OpenAI-compatibile | `{type:"function", function:{...}}` |

Lo stesso vale per i messaggi: i turni con chiamate a strumenti vengono
serializzati nella forma nativa di ciascun fornitore e conservati in un campo
`_native`, così una conversazione resta coerente anche cambiando modello.

### 2.4 Nessun nome di modello cablato

Un nome di modello scritto nel codice è una bomba a orologeria: funziona
finché il fornitore non ritira quel modello, e allora l'applicazione si ferma
con un 404 che l'utente non può risolvere. È successo due volte in questo
progetto:

| Fornitore | Errore | Quando |
|---|---|---|
| Google | `models/gemini-1.5-flash is not found for API version v1beta` | ritiro da `v1beta` |
| Groq | `The model llama-3.3-70b-versatile does not exist or you do not have access to it` | deprecato il 17/06/2026 |

Su OpenRouter il problema è strutturale: gli id dei modelli gratuiti cambiano
di continuo, per costruzione.

La correzione non è scrivere il nome nuovo — sarebbe la stessa bomba con la
miccia più lunga — ma **togliere il nome** e chiederlo all'API, che sa quali
modelli esistono *per quella chiave*. Il che risolve anche l'ambiguità del
messaggio di Groq: «non esiste» **oppure** «non ci hai accesso» sono casi
diversi, e un elenco per chiave li distingue.

Ogni configurazione con `modelliCandidati` parte da `model: null` e viene
risolta a runtime. Le due famiglie hanno strategie diverse perché i loro nomi
lo sono:

**Gemini — punteggio per versione.** I nomi seguono uno schema regolare
(`gemini-<major>.<minor>-<famiglia>`), quindi si può ordinare: versione più
recente, famiglia `flash`, con penalità per varianti sperimentali, `preview` e
`-lite`; scartati i modelli senza `streamGenerateContent` e quelli non
conversazionali (embedding, immagini, audio nativo, Live API). Quando uscirà
Gemini 3.0 verrà scelto da solo.

**Famiglia OpenAI — i candidati in ordine di preferenza.** Qui i nomi non sono
confrontabili fra loro (`openai/gpt-oss-120b` contro `qwen/qwen3.6-27b`), e un
punteggio automatico sceglierebbe male. Si interroga `GET /models` e si prende
**il primo candidato ancora esistente**: l'ordine della lista *è* la
preferenza, e l'elenco serve a saltare quelli spariti. Solo se nessun
candidato sopravvive si ricorre a un punteggio generico sui modelli
disponibili — che scarta trascrizione, sintesi vocale, embedding e
classificatori, e a parità d'altro preferisce il modello più grande.

Tre livelli di riserva in entrambi i casi: elenco dei modelli → sonda dei
candidati → primo candidato, lasciando parlare l'errore vero della chiamata di
generazione invece di inventarne uno.

La scelta resta in cache sette giorni per fornitore, legata a un'impronta
FNV-1a a 32 bit della chiave (chiavi diverse vedono cataloghi diversi; la
chiave in chiaro non viene mai duplicata). Se il modello viene ritirato
*mentre* è in cache, il `404` — o un `400` il cui testo parla di modello, come
fa OpenRouter — invalida la cache, ririsolve e ritenta **una volta sola**: un
flag impedisce il ciclo infinito quando anche il modello nuovo fallisce.

Anthropic resta l'eccezione voluta: i suoi modelli sono a pagamento, scelti
esplicitamente dall'utente e con deprecazioni annunciate con largo anticipo.

### 2.5 Il proxy opzionale — Spectra senza chiave

La chiave API vive nel browser dell'utente: senza backend non c'e' alternativa,
ed e' il limite dichiarato apertamente in fondo a questo documento. Ogni
visitatore deve procurarsi la propria chiave gratuita e incollarla.

`proxy/spectra-proxy.js` e' la via d'uscita, e sta **fuori** dalla pagina: un
Worker Cloudflare (piano gratuito) che tiene le chiavi come segreti lato
server. Quando e' configurato, il browser non contiene nessuna chiave e chi
apre BioSpecInfo usa Spectra senza inserire niente.

Non e' un semplice inoltro:

- **Il percorso passa tale e quale.** La rotta e' `/<fornitore>/<percorso>`, e
  il resto viene inoltrato come arriva: il proxy non conosce i formati delle
  API e continua a funzionare quando Spectra cambia modello o parametri.
- **Piu' chiavi per fornitore, con subentro automatico.** Ogni segreto e' una
  lista separata da virgole; su `429` (quota) o `401/403` (chiave revocata) si
  passa alla successiva nella stessa richiesta. Su `400` no: e' un errore
  nella richiesta e si ripeterebbe identico.
- **Lo streaming non viene bufferizzato**: il corpo della risposta passa
  direttamente, altrimenti le risposte comparirebbero tutte insieme alla fine.
- **Non e' un relay aperto.** Credenziali che arrivano dal client
  (`Authorization`, `x-api-key`, `?key=`) vengono scartate e sostituite:
  nessuno puo' usare il proxy per far viaggiare una chiave propria.
- **Tre freni** contro l'abuso: elenco di origini ammesse, limite per IP e
  tetto giornaliero.

Lato Spectra l'innesto e' in un punto solo. `GET /stato` dice quali fornitori
il proxy copre davvero, cosi' non viene offerto come "senza chiave" un modello
per cui manca il segreto; `buildRequest` instrada al proxy **e omette del tutto
l'autenticazione**; `chiaveDaUsare()` restituisce un segnaposto perche' i
controlli "manca la chiave" non blocchino l'invio — segnaposto che non lascia
mai il browser.

Le due strade convivono: senza `PROXY_URL` tutto funziona come prima, e per i
fornitori non coperti dal proxy Spectra continua a usare la chiave locale.

### 2.6 Ricominciare da capo

Tutto ciò che Spectra ricorda vive in `localStorage`: chat, cronologia, chiavi
API, memoria persistente, schede di ripasso. Un pulsante "cancella cronologia"
che togliesse solo le conversazioni non farebbe ripartire da capo — alla
riapertura si ritroverebbe lo stesso stato.

Il punto delicato è che le chiavi hanno **due formati**: la mappa attuale
(`bsi_api_keys`, una chiave per fornitore) e il formato singolo delle versioni
precedenti (`bsi_api_key`). `getKeysMap()` migra automaticamente il secondo nel
primo, quindi cancellare solo la mappa **fa riapparire la chiave vecchia** al
primo accesso successivo. Vanno tolti entrambi — e con loro le cache dei
modelli risolti, che senza chiave non hanno più significato.

Per questo l'elenco di ciò che l'applicazione scrive sta in un punto solo,
`DATI_CANCELLABILI`, diviso in cinque gruppi con etichetta e descrizione. Il
pannello di conferma si costruisce da lì: mostra quante voci esistono davvero
per ciascun gruppo, disattiva quelli già vuoti e richiede un secondo clic
esplicito. Spuntati di partenza solo chat e chiavi; memoria, ripasso e
progressi del resto dell'app restano da scegliere a mano, perché cancellano
lavoro che non c'entra con il ripartire da capo della conversazione.

Restano fuori di proposito la licenza PRO, il periodo di prova e l'identità del
dispositivo: sono dati che l'utente non si aspetta di perdere svuotando una
chat, e una licenza non si cancella per sbaglio. Il pannello lo dichiara.

Dopo la cancellazione viene azzerato anche lo stato in memoria del processo —
elenco dei fornitori coperti dal proxy, modello risolto per ciascun provider —
altrimenti resterebbe valido fino al ricaricamento della pagina, e Spectra
continuerebbe a usare un modello scelto con una chiave che non esiste più.

---

## 3. I 32 strumenti

| Area | Strumenti |
|---|---|
| **Calcolo generale** | `calcola`, `risolvi_equazione`, `analisi_dati` |
| **Chimica generale** | `bilancia_equazione`, `stechiometria`, `massa_molecolare`, `converti_unita`, `costante_fisica` |
| **Chimica fisica** | `termodinamica`, `equilibrio_acido_base`, `cinetica`, `gas_e_soluzioni`, `elettrochimica` |
| **Struttura e spettri** | `spettroscopia`, `quantistica_e_spettroscopia`, `cristallografia` |
| **Scienze della vita** | `biochimica`, `farmacocinetica`, `valuta_druglikeness` |
| **Fisica** | `astrofisica`, `nucleare`, `statistica_inferenziale` |
| **Banche dati esterne** | `cerca_pubchem` (NIH), `cerca_letteratura` (PubMed), ricerca web |
| **Dati interni** | `cerca_nel_database` (9 dataset), `cerca_molecola` |
| **Controllo app** | `naviga_sezione` (84 sezioni), `apri_strumento` (12 laboratori), `stato_app` |
| **Memoria** | `ricorda`, `ricordi` |
| **Animazioni** | `apri_animazione` (6 meccanismi di reazione) |

### 3.1 Dataset interni esposti

297 reazioni di sintesi · 118 elementi · 67 amminoacidi · 143 farmaci ·
63 patologie · 39 strategie retrosintetiche · 36 interazioni farmacologiche ·
29 vie metaboliche · 29 potenziali redox.

Sono i dati curati dall'autore per l'applicazione: l'agente li consulta come
fonte primaria e ha istruzione di **segnalare le discrepanze** fra database e
propria memoria invece di appianarle silenziosamente.

---

## 4. Decisioni ingegneristiche rilevanti

Questa sezione documenta le scelte non ovvie e il motivo per cui sono state
prese. È la parte del documento che descrive il ragionamento progettuale.

### 4.1 Motore di calcolo senza `eval()`

**Problema.** Servire calcoli arbitrari di chimica fisica richiede un
valutatore di espressioni. `eval()` lo risolverebbe in poche righe.

**Perché è stato escluso.** L'agente legge contenuti esterni non fidati
(risultati PubChem, abstract PubMed, pagine web). Un'iniezione in quei
contenuti potrebbe indurre il modello a emettere un'espressione ostile; con
`eval()` quella stringa verrebbe eseguita nel contesto della pagina, **dove
risiede la chiave API dell'utente**.

**Soluzione.** Parser a discesa ricorsiva con insieme *chiuso* di 27 funzioni e
costanti. Non ha accesso all'ambito globale: può solo fare aritmetica.
Verificato con 10 tentativi di evasione (`window.localStorage`, `constructor`,
`this`, `fetch(...)`, chiamate a funzioni non in whitelist), tutti respinti,
anche eseguendo il test in un browser reale.

### 4.2 Conservazione dei blocchi di ragionamento

Sui modelli con ragionamento adattivo i blocchi `thinking` fanno parte del
turno assistente e devono essere **rimandati indietro identici, firma
crittografica inclusa**, nel giro successivo di *tool use*. Scartarli fa
rifiutare la richiesta.

L'implementazione accumula `thinking_delta` e `signature_delta` dallo stream e
li reinserisce **in testa** al turno ricostruito. Verificato in test
d'integrazione: firma preservata, ordine corretto.

### 4.3 Ripresa dei turni sospesi (`pause_turn`)

La ricerca web è uno strumento eseguito sui server del fornitore. Quando il suo
ciclo interno esaurisce le iterazioni disponibili, la risposta termina con
`stop_reason: "pause_turn"`.

Il turno va ripreso **rimandando indietro il turno assistente così com'è, senza
aggiungere alcun messaggio utente**: è il server a riconoscere il blocco
`server_tool_use` in coda e a riprendere da lì. Aggiungere un "continua"
spezzerebbe il meccanismo.

### 4.4 Configurazione per modello, non globale

I quattro livelli Claude non accettano gli stessi parametri:

| Modello | `effort` | Ricerca web | Note |
|---|---|---|---|
| Fable 5.1 | `xhigh` | sì (8) | fallback su rifiuto; ragionamento sempre attivo |
| Opus 5 | `high` | sì (6) | predefinito |
| Sonnet 5 | `high` | sì (5) | |
| Haiku 4.5 | **non supportato** | **non supportata** | inviarli produce HTTP 400 |

Su tutti i modelli recenti `temperature`, `top_p` e `budget_tokens` sono stati
rimossi dall'API e la loro presenza causa un errore: nessuno dei quattro li
invia. Ogni parametro è quindi condizionato al fornitore, non impostato
globalmente.

### 4.5 Ingresso multimodale e lettura dei materiali

L'agente accetta immagini, PDF e file di testo, anche molti insieme, trattati
come pagine consecutive di un unico documento. Tre vincoli hanno guidato
l'implementazione:

- **Le immagini vengono ridimensionate a 2000 px** e ricompresse in JPEG prima
  dell'invio. Una foto da telefono passa da circa 1 MB a 440 KB: senza questo
  passaggio una singola immagine avvicinerebbe il tetto di richiesta e
  moltiplicherebbe il costo in token. 2000 px sono il minimo per leggere una
  grafia minuta — a 1600 px la scrittura piccola diventava illeggibile.
- **Il tetto di pagine dei PDF dipende dal modello**, non è una costante: 600
  pagine per i modelli con finestra da 1M, 100 per quelli da 200K. Il conteggio
  avviene leggendo gli oggetti `/Type /Page` nei byte del file, senza librerie.
- **Nella cronologia va una miniatura da 160 px**, non l'immagine inviata.
  Salvare quella grande (440 KB l'una) riempiva `localStorage` in una decina di
  foto, e a quota piena ogni scrittura successiva fallisce in silenzio.

Sei azioni rapide trasformano il materiale in un prodotto di studio (riassunto,
mappa concettuale, schema, flashcard, domande d'esame, trascrizione) e due lo
traducono. Per le trascrizioni l'agente ha istruzione di scrivere
`[illeggibile]` invece di indovinare: un termine chimico inventato è peggio di
una lacuna dichiarata.

### 4.6 Renderer di grafi proprio, senza CDN

Le mappe concettuali sono prodotte dal modello come diagrammi Mermaid e
disegnate da un renderer scritto nell'applicazione (~190 righe): livelli per
cammino più lungo dalle radici con interruzione dei cicli, riordino per
baricentro dei predecessori su tre passate per ridurre gli incroci, output SVG
con archi di Bézier.

La scelta di non caricare Mermaid da CDN nasce dalla natura offline-first
dell'app: una mappa deve potersi disegnare anche senza rete. Le sintassi non
coperte vengono riconosciute e lasciate come blocco di codice leggibile,
invece di essere disegnate male.

### 4.7 Comando vocale con parola di attivazione

Ascolto continuo attivabile dall'utente: la frase «Hey Spectra» seguita dal
comando lo invia automaticamente. Due dettagli non ovvi:

- il riconoscimento vocale del browser **termina da solo** dopo qualche secondo
  di silenzio e va riavviato, altrimenti l'ascolto muore alla prima pausa;
- vengono esaminate **tutte le alternative di trascrizione**, non solo la
  prima, e sono accettate le varianti fonetiche più comuni: il riconoscimento
  italiano rende "Spectra" in molti modi diversi.

Il rifiuto del permesso al microfono interrompe il ciclo invece di ritentare
all'infinito. Il termine "spettroscopia", frequentissimo in questo dominio, è
stato verificato come non attivante.

### 4.8 Guardia sui risultati non finiti

Un audit sistematico ha rivelato che, con input degeneri legittimi (lunghezza
d'onda nulla, volume nullo, emivita nulla, transizione fra livelli identici),
otto risolutori restituivano `ok: true` con `Infinity` o `NaN` fra i campi.

È il guasto più insidioso in questo contesto: un'eccezione si nota, un valore
formalmente valido ma privo di senso viene riportato all'utente come corretto.
La correzione è un controllo unico nel punto in cui transitano tutti i
risultati: se un campo numerico non è finito, il risultato diventa un errore
esplicito che nomina i campi e indica la causa probabile. Vale anche per gli
strumenti aggiunti in futuro.

### 4.9 Degradazione controllata

- **Modelli senza *function calling* affidabile** (alcuni gratuiti): al primo
  errore riconducibile agli strumenti, la richiesta viene ripetuta una volta in
  modalità solo testo, invece di fallire.
- **Timeout di inattività (45 s)**, azzerato ad ogni byte ricevuto: una risposta
  lunga non viene troncata, ma una connessione morta viene segnalata subito con
  un messaggio esplicito.
- **Quota di `localStorage`**: lo storico è limitato (30 conversazioni, 100
  messaggi) con potatura progressiva. Senza questo limite il superamento della
  quota faceva fallire *in silenzio* ogni scrittura successiva, **compreso il
  salvataggio della chiave API**.
- **Rifiuto dei classificatori** (`stop_reason: "refusal"`, HTTP 200): rilevato
  e comunicato, invece di presentarsi come risposta vuota.

---

## 5. Verifica

La verifica è stata condotta su tre livelli, con esiti registrati.

### 5.1 Correttezza numerica — confronto con valori di riferimento

| Ambito | Caso | Atteso | Ottenuto |
|---|---|---|---|
| Bilanciamento | `KMnO₄ + HCl → …` | 2:16:2:2:8:5 | ✓ esatto |
| Massa molecolare | `K₄[Fe(CN)₆]` (annidata) | 368,35 | 368,345 |
| Massa molecolare | `CuSO₄·5H₂O` (idrato) | 249,68 | 249,677 |
| Equilibrio | acido acetico 0,1 M, Kₐ 1,8·10⁻⁵ | pH 2,874 | 2,875 |
| Termodinamica | ΔG (N₂O₄/NO₂) a 298 K | +4,79 kJ/mol | ✓ |
| Cinetica | Eₐ da k(300 K) e k(320 K) | 55,3 kJ/mol | 55,33 |
| Gas reali | van der Waals CO₂ | scostamento −10 % | −10,13 % |
| Spettroscopia | M+2 del bromo | 97,3 % | ✓ |
| Biochimica | glicilglicina | 132,12 Da | ✓ |
| Farmacocinetica | t½ da V_d 50 L, Cl 5 L/h | 6,93 h | ✓ |
| Astrofisica | picco di emissione solare (Wien) | 501,5 nm | 501,52 |
| Astrofisica | velocità di fuga terrestre | 11,19 km/s | 11,186 |
| Nucleare | energia di legame ⁵⁶Fe | 8,79 MeV/nucleone | 8,790 |
| Statistica | t critico, 95 %, df = 4 | 2,7764 | ✓ |
| Cristallografia | densità del rame (fcc) | 8,96 g/cm³ | 8,935 |

I p-value non sono tabulati: sono calcolati con la funzione beta incompleta
regolarizzata (frazione continua di Lentz) e la gamma incompleta.

### 5.2 Robustezza — casi che devono fallire

Verificato che vengano **respinti**: equazioni non bilanciabili, formule con
parentesi non bilanciate o elementi inesistenti, specie assenti
dall'equazione, tipi di database non validi, e i 10 tentativi di iniezione
nel motore di calcolo.

### 5.3 Integrazione — browser reale

Test automatizzati con Chromium *headless* su tutte le 14 pagine
dell'applicazione: nessun errore JavaScript, nessuna risorsa mancante.
Percorse una per una le 84 sezioni di `index.html` e i 18 tab della sezione
Astrochimica. Ispezionato il corpo delle richieste per i quattro livelli
Claude, e simulato un ciclo completo con ricerca web, sospensione e ripresa
del turno.

---

## 6. Riepilogo quantitativo

| Metrica | Valore |
|---|---|
| Righe del componente | 5.486 |
| Strumenti | 32 |
| Configurazioni di modello | 8 (di cui 3 gratuite) |
| Aree scientifiche coperte | 13 |
| Record nei dataset interni esposti | oltre 800 |
| Giri massimi del ciclo agentico | 10 |
| Cronologia inviata al modello | 40 turni |
| Dipendenze runtime | nessuna |

---

## 7. Limiti dichiarati

Documentati per onestà tecnica; sono scelte consapevoli, non omissioni.

- **La chiave API risiede nel browser** — a meno di pubblicare il proxy.
  Nella configurazione predefinita la chiave non lascia il dispositivo, ma è
  accessibile a chi ha accesso a quel browser, e ogni utente deve procurarsi la
  propria. Il Worker della sezione 2.5 toglie questo limite spostando le chiavi
  su un server, al prezzo di un componente da mantenere fuori dalla pagina: è
  una scelta di distribuzione, non un requisito.
- **Gli strumenti di rete dipendono dalla disponibilità dei servizi.** PubChem
  e PubMed sono interrogati direttamente dal browser; in caso di
  irraggiungibilità lo strumento restituisce un errore esplicito e l'agente ha
  istruzione di dichiararlo, non di sostituirlo con una stima.
- **I risolutori applicano modelli semplificati** dove la letteratura ne
  prevede di più raffinati (per esempio Woodward–Fieser per l'UV, o le rese in
  ATP con rapporti P/O medi). Ogni strumento dichiara il metodo usato nel
  proprio risultato.
- **La verifica è funzionale e numerica**, non formale: non esiste prova di
  correttezza dei risolutori, ma un insieme di casi di riferimento tratti dalla
  letteratura didattica.

---

*Documento redatto a corredo del dossier tecnico BioSpecInfo.
Vedi anche: `01-Software-Architecture-Document.md`,
`02-Verification-Validation-Report.md`, `03-Security-Privacy-Compliance.md`.*
