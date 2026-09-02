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

## Da quale cominciare

| Se vuoi… | Usa | Perché |
|---|---|---|
| **La qualità più alta** | GitHub Models | GPT-4.1 e o4-mini. Non serve un account nuovo: hai già GitHub |
| **Velocità e nessun pensiero** | Groq | Il più rapido, limiti generosi, chiave in 30 secondi |
| **Documenti e PDF lunghi** | Google Gemini | Finestra di contesto molto ampia |
| **Modelli che ragionano** | NVIDIA NIM | DeepSeek R1, Qwen3 235B |

**Consiglio pratico:** fai **Groq + GitHub Models + Gemini**. Sono dieci
minuti in tutto, coprono tutto, e insieme non li esaurisci facilmente.

---

## 1. Groq — il più veloce da ottenere

*30 secondi, nessuna verifica.*

1. Vai su **`console.groq.com`**
2. Accedi con Google o GitHub
3. Menu a sinistra → **API Keys**
4. **Create API Key** → dai un nome qualsiasi (es. `spectra`) → **Submit**
5. Copia la chiave: comincia con **`gsk_`**

> ⚠️ La chiave si vede **una volta sola**. Se chiudi la finestra senza
> copiarla, devi crearne un'altra — non è un problema, sono gratuite.

---

## 2. GitHub Models — la più potente, e ce l'hai già

*2 minuti. Non serve creare nessun account: usi quello di GitHub.*

1. Vai su **`github.com`** e accedi
2. Clicca la tua **foto profilo** in alto a destra → **Settings**
3. Scorri il menu di sinistra fino in fondo → **Developer settings**
4. **Personal access tokens** → **Fine-grained tokens**
5. **Generate new token**
6. Compila:
   - *Token name*: `spectra`
   - *Expiration*: scegli la scadenza che preferisci (un anno va bene)
7. Scendi a **Account permissions** — non a *Repository permissions* —
   e cerca la voce **Models**: mettila su **Read-only**
8. In fondo → **Generate token**
9. Copia il token: comincia con **`github_pat_`**

> Il permesso da dare è **Models: Read-only** e sta fra i permessi
> dell'*account*, non del repository. È il passaggio dove è facile sbagliare.

**Limiti:** 10 richieste al minuto, 50 al giorno. Pochi, ma sono le richieste
più capaci che hai: tienilo per le domande difficili e lascia il resto a Groq.

---

## 3. Google Gemini — la finestra più ampia

*1 minuto.*

1. Vai su **`aistudio.google.com`**
2. Accedi col tuo account Google
3. In alto a sinistra → **Get API key**
4. **Create API key** → scegli un progetto (o lascia che ne crei uno)
5. Copia la chiave: comincia con **`AIza`**

Utile soprattutto quando alleghi **PDF lunghi**: regge molte più pagine degli
altri gratuiti.

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
> Tienilo per quando serve un modello che ragiona a fondo.

---

## 5. Mistral — tanti token, ma leggi prima

*5 minuti. Richiede il numero di telefono.*

1. Vai su **`console.mistral.ai`** e registrati
2. Ti chiede la **verifica del numero di telefono**
3. Attiva il piano gratuito **Experiment**
4. **API Keys** → **Create new key** → copia la chiave

> ⚠️ **Da sapere prima di attivarlo:** il piano gratuito richiede il consenso
> all'**uso dei tuoi dati per l'addestramento** dei modelli. Se ci lavori
> materiale di tesi non pubblicato, dati di laboratorio o qualunque cosa
> riservata, **usa un altro servizio**. Per lo studio normale non è un
> problema.

---

## 6. OpenRouter — il jolly

*1 minuto.*

1. Vai su **`openrouter.ai`** e accedi
2. **Keys** → **Create Key** → copia
3. Comincia con **`sk-or-v1-`**

Sceglie da solo fra i modelli gratuiti del momento. Comodo come rincalzo,
meno prevedibile degli altri.

---

## Come inserirle in Spectra

1. Apri BioSpecInfo → pulsante **Spectra** (il simbolo dell'atomo)
2. Nella tendina in alto scegli il servizio
3. Compare il riquadro **🔑 Configura** → incolla la chiave → **Salva**
4. Ripeti per ogni servizio che hai

La chiave sparisce dalla vista e **non te la richiede più**: resta salvata in
questo browser finché non la togli tu.

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

## Una cosa da non fare

**Non incollare mai una chiave dentro il codice del sito.** GitHub Pages serve
file statici: finirebbe visibile a chiunque apra la pagina, e i bot che
scandagliano GitHub la troverebbero in poche ore, facendotela revocare.

Se vuoi che il sito funzioni **per chiunque lo apra**, senza che nessuno debba
inserire niente, la strada c'è ed è un'altra: `proxy/README.md`.
