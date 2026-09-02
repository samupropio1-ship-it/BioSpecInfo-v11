# Le chiavi API di Spectra — guida pratica

Spectra non ha un server: parla direttamente con il servizio AI che scegli,
usando **la tua** chiave. La chiave resta nel browser, non passa da nessuna
parte, e la inserisci **una volta sola** per servizio.

> **La cosa più importante di questa guida:** non fermarti alla prima chiave.
> Spectra mette in comune tutte quelle che hai — quando un servizio esaurisce
> il limite, continua da solo sul successivo, senza che tu debba fare niente.
> Tre chiavi gratuite reggono un carico che nessuna delle tre reggerebbe da
> sola.

---

## Due livelli: i gratuiti e la frontiera

Spectra ha **cinque servizi gratuiti** e **cinque a pagamento**. I gratuiti
bastano per studiare; i secondi servono quando un problema è davvero
difficile.

Il banco che conta per quest'app si chiama **GPQA Diamond**: domande di
livello dottorato in fisica, chimica e biologia. Non è il benchmark del
marketing, è esattamente ciò che le chiedi tu.

---

## I cinque servizi gratuiti, e a cosa serve ciascuno

Sono stati scelti uno per uno. Nessuno è lì per fare numero: i servizi
gratuiti che davano modelli piccoli o cataloghi imprevedibili sono stati
**tolti**, perché su un problema di chimica in dieci passaggi non reggono e
peggiorano la risposta invece di migliorarla.

| Servizio | Modelli | A cosa serve davvero | Limite |
|---|---|---|---|
| **Groq** | GPT-OSS 120B, Qwen3 | **Il cavallo da tiro.** 131K di contesto, ~30 richieste/minuto: è quello che userai per l'80% del lavoro | Generoso |
| **Google Gemini** | Gemini Flash | **I documenti enormi.** Fino a 1 milione di token di contesto: PDF interi, dispense, tesi | Generoso |
| **GitHub Models** | GPT-4.1, o4-mini, DeepSeek | **La lama affilata.** La qualità più alta che puoi avere gratis. Tienilo per i problemi difficili | 10/min, 50/giorno |
| **NVIDIA NIM** | DeepSeek R1, Qwen3 235B | **Il ragionamento profondo.** Modelli enormi che pensano prima di rispondere | Crediti a esaurimento |
| **Z.AI GLM** | GLM-4.7-Flash | **Il rincalzo che non scade.** Gratuito senza limite di tempo, forte su ragionamento e codice | Limitato al minuto |

### Se ne fai solo tre

**Groq + Gemini + GitHub Models.** Dieci minuti in tutto, e coprono tutto:
volume, documenti lunghi, qualità sui casi difficili. Gli altri due aggiungili
dopo, come riserva.

---

## 1. Groq — comincia da qui

*30 secondi, nessuna verifica.*

1. Vai su **`console.groq.com`**
2. Accedi con Google o GitHub
3. Menu a sinistra → **API Keys**
4. **Create API Key** → dai un nome qualsiasi (es. `spectra`) → **Submit**
5. Copia la chiave: comincia con **`gsk_`**

> ⚠️ La chiave si vede **una volta sola**. Se chiudi la finestra senza
> copiarla, creane un'altra — sono gratuite.

**Perché è il cavallo da tiro:** 131.000 token di contesto e circa 30
richieste al minuto. Non lo esaurisci studiando.

---

## 2. Google Gemini — per i documenti enormi

*1 minuto.*

1. Vai su **`aistudio.google.com`**
2. Accedi col tuo account Google
3. In alto a sinistra → **Get API key**
4. **Create API key** → scegli un progetto (o lascia che ne crei uno)
5. Copia la chiave: comincia con **`AIza`**

**Quando cambia tutto:** quando alleghi un PDF lungo. Arriva a **1 milione di
token** di contesto — una tesi intera in una sola richiesta. Nessuno degli
altri ci si avvicina.

---

## 3. GitHub Models — la qualità più alta

*2 minuti. Non serve creare nessun account: usi quello di GitHub.*

1. Vai su **`github.com`** e accedi
2. Clicca la tua **foto profilo** in alto a destra → **Settings**
3. Scorri il menu di sinistra fino in fondo → **Developer settings**
4. **Personal access tokens** → **Fine-grained tokens**
5. **Generate new token**
6. Compila:
   - *Token name*: `spectra`
   - *Expiration*: la scadenza che preferisci (un anno va bene)
7. Scendi a **Account permissions** — non a *Repository permissions* —
   e cerca la voce **Models**: mettila su **Read-only**
8. In fondo → **Generate token**
9. Copia il token: comincia con **`github_pat_`**

> Il permesso da dare è **Models: Read-only** e sta fra i permessi
> dell'*account*, non del repository. È il passaggio dove è facile sbagliare.

**Il compromesso, detto chiaro:** 10 richieste al minuto, 50 al giorno, e
accetta al massimo 8.000 token per richiesta. Sono i limiti più stretti di
tutti — ma sono le risposte migliori che puoi avere gratis. Spectra lo sa e si
adatta da solo: su questo servizio manda gli strumenti pertinenti alla domanda
invece di tutti e 32, così la richiesta ci sta. **Usalo per i problemi
difficili, non per il lavoro di volume.**

---

## 4. NVIDIA NIM — i modelli che ragionano

*3 minuti, senza carta di credito.*

1. Vai su **`build.nvidia.com`**
2. **Sign in** → crea un account NVIDIA se non ce l'hai (Developer Program,
   gratuito)
3. Apri un modello qualsiasi dall'elenco (per esempio *DeepSeek R1*)
4. Nel pannello a destra → **Get API Key** → **Generate Key**
5. Copia la chiave: comincia con **`nvapi-`**

> I crediti gratuiti sono **a esaurimento**: non si rinnovano ogni mese.
> Tienilo per quando serve un modello che ragiona a fondo su un problema
> lungo.

---

## 5. Z.AI GLM — il rincalzo che non scade

*2 minuti.*

1. Vai su **`z.ai`** e registrati con l'email
2. Apri il menu del **profilo** → **API Keys**
3. **Create new key** → copia la chiave

**Perché c'è:** è gratuito **senza scadenza** — non crediti a esaurimento, non
una prova a tempo. GLM-4.7-Flash è forte su ragionamento e codice. È la
riserva che trovi ancora lì fra sei mesi, quando i crediti NVIDIA saranno
finiti.

---

---

# La frontiera — quando serve il massimo

Questi si pagano a consumo, e non poco. Ma sono un'altra categoria: su un
problema di chimica fisica in dieci passaggi la differenza si vede.

## GPT-5.6 — il più forte sulle domande scientifiche

**È il numero uno su GPQA Diamond: 94,6%.** Sul banco che misura esattamente
il tipo di domande che fai tu, oggi non c'è niente di meglio.

1. Vai su **`platform.openai.com`** → accedi
2. **API keys** → **Create new secret key**
3. Copia la chiave: comincia con **`sk-proj-`**
4. Serve credito sul conto (**Billing** → aggiungi un importo, anche 5 $)

Circa **4 $ per milione di token** in ingresso. Una conversazione di studio
costa centesimi.

> Il modello di punta (*Sol*) è ad accesso limitato e la tua chiave potrebbe
> non vederlo. Non è un problema: Spectra chiede all'API cosa può usare e
> scala da solo a *Terra* e poi a *Luna*, senza che tu debba saperlo.

## Gemini 3 Pro — la finestra più ampia

**Stessa chiave del Gemini gratuito**: la incolli una volta e vale per
entrambi. Cambia solo che serve la fatturazione attiva sul progetto Google.

1. **`aistudio.google.com`** → la chiave che hai già
2. Attiva la fatturazione sul progetto (Google Cloud → Billing)

Oltre **1 milione di token** di contesto: una tesi intera in una sola
richiesta. Circa 2 $ per milione in ingresso.

## DeepSeek V4 — il miglior rapporto qualità/prezzo

Ragionamento di fascia alta a **una frazione** del costo: circa **0,66 $ per
milione** di token in ingresso fuori dalle ore di punta — sei volte meno di
GPT-5.6.

1. **`platform.deepseek.com`** → registrati
2. **API keys** → **Create API key** → copia (comincia con `sk-`)
3. Ricarica un piccolo credito

**Se paghi di tasca tua e vuoi spendere poco, comincia da qui.**

## Grok 4 — 2 milioni di token

La finestra più ampia in circolazione e un ottimo rapporto prezzo/GPQA.

1. **`console.x.ai`** → **API Keys** → crea (comincia con `xai-`)

## Claude — Fable 5.1, Opus 5, Sonnet 5, Haiku 4.5

1. **`console.anthropic.com`** → **API Keys** → **Create Key**
2. Copia (comincia con `sk-ant-`) e aggiungi credito

**Una chiave sola per tutti e quattro:** la incolli su uno qualsiasi dei
modelli Claude e vale automaticamente per gli altri tre.

> È separato dall'abbonamento di claude.ai: quello non dà accesso all'API.

---

## Quale scegliere, in pratica

| Se… | Usa |
|---|---|
| Studio quotidiano, tante domande | **Groq** (gratis) |
| Un PDF lungo da leggere | **Gemini** (gratis) o **Gemini 3 Pro** |
| Una domanda difficile, poche volte al giorno | **GitHub Models** (gratis) |
| Un problema scientifico davvero tosto | **GPT-5.6** |
| Vuoi potenza ma spendere poco | **DeepSeek V4** |

---

## Come inserirle in Spectra

1. Apri BioSpecInfo → pulsante **Spectra** (il simbolo dell'atomo)
2. Nella tendina in alto scegli il servizio
3. Compare il riquadro **🔑 Configura** → incolla la chiave → **Salva**
4. Ripeti per ogni servizio che hai

La chiave sparisce dalla vista e **non te la richiede più**: resta salvata in
questo browser finché non la togli tu.

> **Le chiavi condivise.** I quattro modelli Claude usano un solo account
> Anthropic, e Gemini Flash e Gemini 3 Pro una sola chiave di AI Studio:
> incollala su uno qualsiasi e vale per i gemelli. Non devi ripeterla.

### Toglierle o ricominciare da capo

Pulsante **🗑 Cancella tutto** nella barra di Spectra. Ti fa scegliere cosa
togliere — chat, chiavi, memoria — prima di cancellare davvero.

---

## Cosa succede quando finisci una quota

Niente di drammatico, e soprattutto: **non devi fare niente**.

- **Limite al minuto** (capita con GitHub Models): Spectra legge quanto deve
  aspettare, te lo dice — *«⏳ ha raggiunto il limite al minuto: aspetto 7s»* —
  e riprova da solo. Fino a tre volte.
- **Quota finita davvero**: passa a un altro servizio per cui hai una chiave e
  **rifà la domanda da lì**, dicendotelo — *«🔄 Groq ha esaurito la quota:
  continuo su Google Gemini»*.
- **Richiesta troppo grande** per il servizio scelto: riduce gli strumenti a
  quelli pertinenti e accorcia la cronologia più vecchia, invece di farsi
  rifiutare — *«📐 uso i 19 strumenti più adatti invece di tutti e 32»*.
- **Mai a pagamento senza chiedertelo.** La riserva automatica usa solo
  servizi gratuiti. Se hai messo anche una chiave Claude o Grok, Spectra non
  ci passa da solo: quelli li scegli tu.

Ecco perché conviene metterne più di una: da sole hanno limiti bassi, insieme
diventano una riserva sola.

---

## Se qualcosa non va

| Messaggio | Cosa significa | Cosa fare |
|---|---|---|
| `401` / `Invalid API Key` | Chiave sbagliata o incollata a metà | Ricreala e reincollala per intero |
| `403` con *Models* | Token GitHub senza il permesso giusto | Rifallo con **Models: Read-only** fra i permessi *account* |
| `429` | Limite al minuto | Non fare niente: Spectra aspetta e riprova da solo |
| `404 model not found` | Il servizio ha ritirato quel modello | Non fare niente: Spectra ne trova un altro da solo |
| Spectra non risponde | Spesso è la chiave non salvata | Controlla che il riquadro 🔑 sia sparito dopo il Salva |

---

## Perché alcuni servizi non ci sono

Non è una dimenticanza: sono stati provati e scartati.

- **Mistral** — qualità media, e il piano gratuito richiede la verifica del
  telefono **e il consenso all'uso dei tuoi dati per l'addestramento**. Per
  materiale di tesi non pubblicato è un prezzo che non vale la pena pagare
  quando esistono cinque alternative senza quella clausola.
- **OpenRouter** — i modelli gratuiti sono piccoli e i loro nomi cambiano di
  continuo. Come rincalzo occasionale andava; per un agente che deve
  concatenare dieci chiamate a strumenti, no.
- **Cerebras** — sarebbe stato il candidato ovvio per velocità, ma da agosto
  2026 il piano senza carta non esiste più e il gratuito limita il contesto a
  **8K token**: Spectra manda 32 definizioni di strumenti oltre alla
  cronologia, non ci sta.
- **Qwen / Alibaba** — la quota gratuita è una **prova a tempo** (circa 90
  giorni), non un piano permanente.

---

## Una cosa da non fare

**Non incollare mai una chiave dentro il codice del sito.** GitHub Pages serve
file statici: finirebbe visibile a chiunque apra la pagina, e i bot che
scandagliano GitHub la troverebbero in poche ore, facendotela revocare.

Se vuoi che il sito funzioni **per chiunque lo apra**, senza che nessuno debba
inserire niente, la strada c'è ed è un'altra: `proxy/README.md`.
