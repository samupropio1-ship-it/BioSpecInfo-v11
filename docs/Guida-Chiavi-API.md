# Le chiavi API di Spectra — guida passo passo

Spectra non ha un server: parla direttamente con il servizio AI che scegli,
usando **la tua** chiave. La chiave resta nel browser, non passa da nessuna
parte, e la inserisci **una volta sola** per servizio.

> **La cosa più importante di questa guida:** non fermarti alla prima chiave.
> Spectra mette in comune tutte quelle che hai — quando un servizio esaurisce
> il limite o non risponde, continua da solo sul successivo, senza che tu
> debba fare niente. Tre chiavi gratuite reggono un carico che nessuna delle
> tre reggerebbe da sola.

---

## Da dove cominciare — in due minuti

Se leggi solo questo riquadro, fai questo:

1. Vai su **`console.groq.com`** → accedi con Google → **API Keys** →
   **Create API Key** → copia
2. Apri BioSpecInfo → pulsante **Spectra** → incolla nella casella 🔑 → **Salva**
3. Scrivi qualcosa. Funziona.

Poi, quando hai altri cinque minuti, aggiungi **Gemini** (§2): serve per i
riassunti di documenti lunghi, e Groq da solo non ci arriva.

---

## L'elenco completo

Undici configurazioni, otto fornitori, **tutti verificati attivi a settembre
2026**. Nessuno è lì per fare numero.

### Gratuiti

| # | Servizio | Modelli | A cosa serve | Limite |
|---|---|---|---|---|
| 1 | **Groq** | GPT-OSS 120B, Qwen3 | Il cavallo da tiro: l'80% del lavoro | ~30 richieste/min |
| 2 | **Google Gemini** | Gemini Flash | Documenti lunghi e **riassunti** (1M di contesto) | Generoso |
| 3 | **NVIDIA NIM** | DeepSeek R1, Qwen3 235B | Ragionamento profondo | Crediti a esaurimento |
| 4 | **Z.AI GLM** | GLM-4.7-Flash | Rincalzo che non scade mai | Limitato al minuto |

### A pagamento — la frontiera

| # | Servizio | Perché | Costo indicativo |
|---|---|---|---|
| 5 | **OpenAI GPT-5.6** | **94,6% su GPQA Diamond**: il primo al mondo sulle domande scientifiche di livello dottorato | ~4 $/M in ingresso |
| 6 | **Grok 4.6** (xAI) | Primo sul *tool calling agentico* e minor tasso di allucinazione | ~2 $/M |
| 7 | **Google Gemini 3 Pro** | Oltre 1M di contesto. **Stessa chiave** del Gemini gratuito | ~2 $/M |
| 8 | **DeepSeek V4** | Ragionamento di fascia alta al prezzo più basso | ~0,66 $/M |
| 9–11 | **Claude** Fable 5.1 · Opus 5 · Sonnet 5 | Gli unici con il **sandbox Python** in Modalità Nucleo. **Una chiave per tutti e tre** | 2–10 $/M |

---

# Parte 1 — i quattro gratuiti

## 1. Groq — comincia da qui

**Tempo: 30 secondi. Nessuna verifica, nessuna carta.**

1. Apri **`console.groq.com`**
2. **Sign in** → scegli Google o GitHub
3. Nel menu di sinistra clicca **API Keys**
4. Pulsante **Create API Key**
5. Nel campo *Name* scrivi `spectra` → **Submit**
6. Clicca l'icona **copia** accanto alla chiave

La chiave comincia con **`gsk_`**.

> ⚠️ **Si vede una volta sola.** Se chiudi la finestra senza copiarla non c'è
> modo di rivederla: creane un'altra, sono gratuite e illimitate.

**Perché è il cavallo da tiro:** 131.000 token di contesto e circa 30
richieste al minuto. Studiando non lo esaurisci.

---

## 2. Google Gemini — per i documenti lunghi

**Tempo: 1 minuto.**

1. Apri **`aistudio.google.com`**
2. Accedi con il tuo account Google
3. In alto a sinistra, pulsante **Get API key**
4. **Create API key**
5. Ti chiede un progetto: scegline uno o lascia che ne crei uno nuovo
6. Copia la chiave

La chiave comincia con **`AIza`**.

> **Quando cambia tutto:** quando alleghi un PDF lungo o chiedi un riassunto.
> Arriva a **1 milione di token** — centinaia di pagine in una richiesta sola.
> Gli altri gratuiti si fermano molto prima e ti danno il riassunto della
> prima parte *senza dirti* che il resto non l'hanno letto.

---

## 3. NVIDIA NIM — i modelli che ragionano

**Tempo: 3 minuti. Nessuna carta di credito.**

1. Apri **`build.nvidia.com`**
2. **Sign in** in alto a destra → crea un account NVIDIA se non ce l'hai
   (è il Developer Program, gratuito)
3. Dall'elenco dei modelli aprine uno qualsiasi — per esempio **DeepSeek R1**
4. Nel pannello a destra cerca **Get API Key**
5. **Generate Key** → copia

La chiave comincia con **`nvapi-`**.

> I crediti gratuiti sono **a esaurimento**, non si rinnovano ogni mese.
> Tienilo per quando serve un modello che ragiona a fondo su un problema
> lungo, non per il lavoro di tutti i giorni.

---

## 4. Z.AI GLM — il rincalzo che non scade

**Tempo: 2 minuti.**

1. Apri **`z.ai`** e registrati con la tua email
2. Clicca sul tuo **profilo** in alto a destra
3. **API Keys** → **Create new key**
4. Copia

**Perché c'è:** è gratuito **senza scadenza** — non crediti che finiscono, non
una prova a tempo. GLM-4.7-Flash è forte su ragionamento e codice. È la
riserva che troverai ancora lì fra sei mesi, quando i crediti NVIDIA saranno
esauriti.

---

# Parte 2 — la frontiera

Questi si pagano a consumo. Ma su un problema di chimica fisica in dieci
passaggi la differenza si vede, e una sessione di studio costa centesimi.

## 5. OpenAI GPT-5.6 — il primo sulle domande scientifiche

**Tempo: 3 minuti. Serve una carta.**

1. Apri **`platform.openai.com`** e accedi
2. Menu di sinistra → **API keys**
3. **Create new secret key** → dai un nome → **Create**
4. Copia subito: comincia con **`sk-proj-`** e non si rivede
5. Vai su **Billing** → **Add payment method** → aggiungi un credito
   (bastano 5 $)

**È il numero uno su GPQA Diamond: 94,6%.** Su domande di chimica, fisica e
biologia di livello dottorato — cioè esattamente quello che chiedi tu — oggi
non c'è niente di meglio.

> Il modello di punta (*Sol*) è ad accesso limitato e la tua chiave potrebbe
> non vederlo. Non devi fare niente: Spectra chiede all'API cosa può usare e
> scala da solo a *Terra*, poi a *Luna*.

---

## 6. Grok 4.6 (xAI) — il migliore sugli agenti

**Tempo: 3 minuti. Serve una carta.**

1. Apri **`console.x.ai`** e accedi (serve un account X/xAI)
2. Sezione **API Keys**
3. **Create API Key** → dai un nome → conferma
4. Copia: comincia con **`xai-`**
5. Aggiungi un credito dalla sezione **Billing**

Uscito il 12 agosto 2026. È **primo su tool calling agentico** — cioè
esattamente quello che fa Spectra quando concatena dieci strumenti per
risolvere un problema — e ha il **tasso di allucinazione più basso** in
circolazione. Circa 2 $ per milione: meno della metà di GPT-5.6.

Se la 4.6 non è disponibile sulla tua chiave, Spectra scala da sola alle
versioni precedenti, che arrivano a 1–2 milioni di token di contesto.

---

## 7. Google Gemini 3 Pro — la finestra più ampia

**Tempo: 2 minuti se hai già fatto il §2.**

**Usa la stessa chiave del Gemini gratuito.** La incolli una volta e vale per
entrambi: cambia solo che serve la fatturazione attiva.

1. Apri **`console.cloud.google.com`** → **Fatturazione**
2. Collega un account di fatturazione al progetto che hai usato al §2
3. Torna in Spectra e scegli **Google Gemini 3 Pro** dalla tendina — la chiave
   c'è già

Oltre **1 milione di token** di contesto: una tesi intera in una richiesta.

---

## 8. DeepSeek V4 — potenza al prezzo più basso

**Tempo: 3 minuti.**

1. Apri **`platform.deepseek.com`** e registrati
2. **API keys** → **Create API key** → dai un nome
3. Copia: comincia con **`sk-`**
4. **Top up** → ricarica un credito piccolo (bastano 2 $)

Ragionamento di fascia alta a circa **0,66 $ per milione** fuori dalle ore di
punta: **sei volte meno di GPT-5.6**.

> **Se paghi di tasca tua e vuoi spendere poco, comincia da qui.** È il
> miglior rapporto qualità/prezzo dell'intero elenco.

---

## 9–11. Claude — Fable 5.1, Opus 5, Sonnet 5

**Tempo: 3 minuti. Una chiave sola per tutti e tre.**

1. Apri **`console.anthropic.com`** e accedi
2. **Settings** → **API Keys** → **Create Key**
3. Dai un nome → **Create Key** → copia (comincia con **`sk-ant-`**)
4. **Plans & Billing** → aggiungi un credito

**La incolli su uno qualsiasi dei tre modelli Claude e vale automaticamente
per gli altri due.**

Sono gli unici che, in **⚛ Modalità Nucleo**, ottengono il **sandbox Python**
— sympy, numpy, scipy, matplotlib. Il modello scrive ed esegue codice vero
per integrare, diagonalizzare matrici, fare algebra simbolica: cose che i 32
risolutori non coprono perché non si possono prevedere tutte.

> ⚠️ È **separato** dall'abbonamento di claude.ai. Pagare quello non dà
> accesso all'API: serve credito su `console.anthropic.com`.

> **Non devi scegliere fra le versioni.** Se un giorno Opus 5 non fosse
> disponibile sulla tua chiave, Spectra passa da sola a Opus 4.8 e poi a 4.7 —
> costano uguale e sono la stessa fascia. Per questo non li trovi in tendina:
> sceglierli a mano non darebbe mai un vantaggio.

---

# Parte 3 — usarle

## Inserire una chiave

1. Apri BioSpecInfo → pulsante **Spectra** (il simbolo dell'atomo)
2. Nella tendina in alto scegli il servizio
3. Compare il riquadro **🔑 Configura** → incolla → **Salva**
4. Il riquadro sparisce: **non te la richiede più**

Ripeti per ogni servizio che hai. Restano salvate in questo browser finché
non le togli tu.

> **Chiavi condivise.** I tre modelli Claude usano un solo account Anthropic,
> e Gemini Flash e Gemini 3 Pro una sola chiave di AI Studio: incollala su uno
> qualsiasi e vale per i gemelli.

## Verificare che funzioni davvero

1. Scrivi: **«Calcola il pH di una soluzione di acido acetico 0,1 M»**
2. Devi vedere una nota **🧪 Equilibrio acido-base** comparire sopra la
   risposta, e il risultato **pH ≈ 2,875**

Se vedi la nota dello strumento, tutto funziona: significa che il modello sta
**invocando i risolutori** invece di rispondere a memoria. È la differenza fra
Spectra e una chat qualunque.

## Toglierle o ricominciare

Pulsante **🗑** nella barra di Spectra. Ti fa scegliere cosa togliere — chat,
chiavi, memoria — prima di cancellare davvero.

---

## Quale usare, in pratica

| Se… | Usa |
|---|---|
| Studio quotidiano, tante domande | **Groq** (gratis) |
| Un PDF lungo, o un riassunto | **Gemini** (gratis) |
| Un problema scientifico davvero tosto | **GPT-5.6** |
| Una catena lunga di strumenti | **Grok 4.6** |
| Calcolo simbolico o numerico vero | **Claude** + ⚛ Modalità Nucleo |
| Potenza spendendo poco | **DeepSeek V4** |

---

## Cosa succede quando qualcosa va storto

**Non devi fare niente.** Spectra gestisce da sola i quattro casi:

| Cosa succede | Cosa fa Spectra |
|---|---|
| Limite al minuto (`429`) | Legge quanto deve aspettare, te lo dice, riprova. Fino a 3 volte |
| Quota finita | Passa a un altro servizio per cui hai una chiave e **rifà la domanda da lì** |
| Servizio non raggiungibile | Stessa cosa: cambia fornitore e continua — **e se lo segna**, vedi qui sotto |
| Modello ritirato dal fornitore | Ne cerca un altro nel catalogo e riprova |

**Mai a pagamento senza chiedertelo.** La riserva automatica usa solo servizi
gratuiti: se hai anche una chiave Claude o GPT, quelle le scegli tu.

## Se un servizio non risponde *dal browser*

C'è un guasto che non dipende né da te né dalla chiave, e vale la pena
capirlo perché è l'unico che una guida non può risolverti in anticipo.

BioSpecInfo è una pagina web. Quando Spectra chiama un fornitore, la chiamata
parte **dal tuo browser**, e il browser la lascia partire solo se il fornitore
risponde «sì, accetto chiamate da altri siti» (si chiama CORS). Alcuni
fornitori lo fanno apposta, altri no, e la scelta può cambiare da un mese
all'altro senza che nessuno lo annunci.

Peggio: quando la chiamata viene bloccata, **il browser non dice perché**. Per
non dare informazioni a chi sonda la rete, rete assente, CORS negato e
servizio spento arrivano tutti come lo stesso identico errore. Nemmeno il
codice dell'app può distinguerli.

Per questo l'elenco «funziona / non funziona» non è scritto qui: sarebbe una
fotografia sbagliata il mese dopo, e comunque dipende anche dalla tua rete e
dalle estensioni installate nel tuo browser.

### Il pulsante 🔌 Prova — la risposta in cinque secondi

Non c'è bisogno di scoprirlo sbagliando. Nella barra in alto di Spectra, il
pulsante **🔌 Prova** chiama tutti e undici i fornitori dal tuo browser e ti
dice in pochi secondi quali risponde:

```
✅ Groq · risponde                              14 ms
✅ Google Gemini Flash · risponde               13 ms
⛔ NVIDIA NIM · il tuo browser non riesce a contattarlo
✅ Z.AI GLM-4.7-Flash · risponde                16 ms
```

**Non serve avere una chiave.** La domanda «il mio browser riesce a
contattare questo server?» ha risposta *sì* anche quando il server rifiuta la
chiave: se la chiamata si conclude in qualunque modo, il vincolo CORS è
passato. Quindi puoi sapere **prima** di aprire un account se quel fornitore
ti servirà a qualcosa.

La prova usa lo stesso indirizzo e le stesse intestazioni della chiamata vera
(proxy compreso, se lo hai configurato), ma un corpo minimo: su una chiave
valida costa un token, non la tua quota.

In fondo trovi la conclusione, che dice cosa fare adesso — quale scegliere,
oppure che il problema è la tua rete e non i fornitori.

### Cosa fa da sola, senza che tu chieda niente



| | |
|---|---|
| Un fornitore non risponde | Viene annotato, e la volta dopo compare **⚠** accanto al nome nella tendina |
| Lo hai selezionato lo stesso | Un avviso ti dice quante volte è successo e ti propone un'alternativa **fra quelle che da qui hanno già risposto** |
| Serve una risposta subito | Nella riserva automatica i marcati passano in fondo: non ti fanno più aspettare |
| Era solo la rete di ieri sera | Dopo 24 ore il fornitore viene ritentato da solo, senza che tu faccia niente |
| Torna a rispondere | L'annotazione sparisce alla prima risposta ricevuta — anche un `401` basta, perché dimostra che al server ci si arriva |

L'annotazione sta solo nel tuo browser e si cancella col pulsante **🗑**
(gruppo *Chiavi API e provider*).

**Se un fornitore ti serve e da qui non risponde**, la soluzione definitiva è
il proxy: la chiamata parte da un server invece che dal browser, e il vincolo
CORS non esiste più. Sta in `proxy/README.md`.

Una nota di merito: **Claude è l'unico dei tre grandi che ha una modalità
browser dichiarata** (l'header `anthropic-dangerous-direct-browser-access`,
che Spectra manda già). Sugli altri la risposta va scoperta provando — ed è
esattamente quello che l'app fa per te.

## Se invece è colpa della chiave

| Messaggio | Significato | Cosa fare |
|---|---|---|
| `401` / `Invalid API Key` | Chiave sbagliata o incollata a metà | Ricreala e reincollala **per intero** |
| `402` / *insufficient credit* | Credito finito | Ricarica sul sito del fornitore |
| Il riquadro 🔑 non sparisce dopo il Salva | La memoria del browser è piena | Usa **🗑** per liberare, oppure esci dalla navigazione in incognito |

---

## Perché alcuni servizi non ci sono

Non è una dimenticanza: sono stati valutati e scartati, uno per uno.

- **GitHub Models** — GitHub lo ha **ritirato del tutto il 30 luglio 2026**.
  Playground, catalogo e API di inferenza spenti per tutti. Qualunque guida
  che lo consigli ancora è più vecchia di quella data.
- **Claude Haiku 4.5** — non è scaduto, è *dominato*: Sonnet 5 costa il doppio
  e dà cinque volte il contesto, il ragionamento esteso e la ricerca web, che
  Haiku non ha.
- **Mistral** — qualità media, e il piano gratuito richiede la verifica del
  telefono **e il consenso all'uso dei tuoi dati per l'addestramento**. Per
  materiale di tesi non pubblicato non vale la pena.
- **OpenRouter** — i modelli gratuiti sono piccoli e i loro id cambiano di
  continuo: inadatti a un agente che concatena dieci chiamate.
- **Cerebras** — da agosto 2026 niente più piano senza carta, e il gratuito
  limita il contesto a 8K token: Spectra manda 32 definizioni di strumenti
  oltre alla cronologia, non ci sta.
- **Moonshot Kimi, MiniMax, Qwen** — sono frontiera veri, ma non superano
  GPT-5.6 su GPQA Diamond (il banco che conta per la chimica) e duplicano
  capacità già coperte da Gemini 3 Pro e DeepSeek. Aggiungerli allungherebbe
  la tendina senza darti una scelta migliore.
- **Qwen / Alibaba** (quota diretta) — la parte gratuita è una **prova a
  tempo** di circa 90 giorni, non un piano permanente. I modelli Qwen restano
  comunque raggiungibili tramite Groq e NVIDIA.

---

## Una cosa da non fare

**Non incollare mai una chiave dentro il codice del sito.** GitHub Pages serve
file statici: finirebbe visibile a chiunque apra la pagina con `Ctrl+U`, e i
bot che scandagliano GitHub la troverebbero in poche ore, facendotela
revocare.

Se vuoi che il sito funzioni **per chiunque lo apra**, senza che nessuno debba
inserire niente, la strada c'è ed è un'altra: `proxy/README.md`.

---

*Verifica dei fornitori: settembre 2026. Se leggi questa guida molto più
tardi, ricontrolla — i servizi chiudono, e un elenco è vecchio dal giorno dopo
che lo scrivi.*
