# Spectra senza chiave — il proxy

Serve a una cosa sola: **far funzionare Spectra a chiunque apra il sito, senza
che nessuno debba inserire una API key.**

Oggi ogni visitatore deve procurarsi la propria chiave gratuita e incollarla.
Con il proxy la chiave la metti **tu, una volta sola, sul server**: la pagina
non ne contiene nessuna e nessuno la vede più.

## Perché non basta mettere la chiave nel codice

GitHub Pages serve file statici. Qualunque chiave scritta in `index.html` o in
`bsi-ai-hub.js` è leggibile da chiunque con `Ctrl+U`, e i bot che scandagliano
GitHub la trovano in poche ore: il fornitore la revoca e resti senza Spectra
**e** senza chiave. Non è una precauzione eccessiva, è come funziona — in una
pagina statica non esiste un posto dove nascondere un segreto.

Il proxy è un programma minuscolo che gira **fuori** dalla pagina, su
Cloudflare. Lì la chiave sta al sicuro, e resta tutto gratuito.

---

## Cosa ti serve

- un account Cloudflare (gratuito, si crea in due minuti su `dash.cloudflare.com`)
- almeno una chiave API gratuita:

| Servizio | Dove | Cosa dà |
|---|---|---|
| **Groq** | `console.groq.com` → API Keys | Il cavallo da tiro: 131K di contesto, ~30 richieste/minuto |
| **Google Gemini** | `aistudio.google.com` → Get API key | Fino a 1M di contesto: PDF e dispense intere |
| **GitHub Models** | `github.com` → Settings → Developer settings → Personal access tokens, permesso *Models: read* | La qualità più alta (GPT-4.1, o4-mini). Tetto basso: 10/min, 50/giorno |
| **NVIDIA NIM** | `build.nvidia.com` → Get API Key | DeepSeek R1, Qwen3 235B. Crediti a esaurimento |
| **Z.AI GLM** | `z.ai` → profilo → API Keys | Gratuito senza scadenza, forte su ragionamento |

Dettagli passo per passo, limiti reali e servizi scartati (con il perché):
`docs/Guida-Chiavi-API.md`.

Non servono carta di credito né dominio.

---

## Deploy — cinque comandi

Dalla cartella `proxy/` di questo repository:

```bash
# 1. entra nella cartella
cd proxy

# 2. accedi a Cloudflare (si apre il browser)
npx wrangler login

# 3. pubblica il Worker
npx wrangler deploy
```

Alla fine `wrangler` stampa l'indirizzo, tipo:

```
https://spectra-proxy.tuonome.workers.dev
```

**Annotalo: serve fra due passi.**

```bash
# 4. metti le chiavi come segreti (una alla volta, le incolli quando chiede)
npx wrangler secret put GROQ_KEYS
npx wrangler secret put GEMINI_KEYS
```

> **Più chiavi = più quota.** Ogni segreto accetta una **lista separata da
> virgole**: `chiave1,chiave2,chiave3`. Quando la prima esaurisce la quota
> (errore 429) o viene revocata, il proxy passa alla successiva da solo, nella
> stessa richiesta. È il modo pratico per avvicinarsi a un uso "senza limiti"
> restando sul piano gratuito.

Segreti disponibili: `GROQ_KEYS`, `GEMINI_KEYS`, `GITHUB_KEYS`, `NVIDIA_KEYS`,
`ZAI_KEYS`, `ANTHROPIC_KEYS`, `XAI_KEYS`. Metti solo quelli che hai — Spectra
mostrerà come "senza chiave" soltanto i modelli davvero coperti.

```bash
# 5. collega Spectra al proxy
```

Apri `bsi-ai-hub.js` e incolla l'indirizzo del passo 3:

```javascript
var PROXY_URL = 'https://spectra-proxy.tuonome.workers.dev';
```

Poi incrementa `CACHE` in `sw.js` (es. `bsi-v139` → `bsi-v140`) e pubblica.

**Fatto.** Chi apre BioSpecInfo trova Spectra già funzionante.

---

## Provarlo prima di pubblicare

Non serve modificare il codice: puoi puntare al proxy dalla console del
browser, solo per il tuo dispositivo.

```javascript
localStorage.setItem('bsi_proxy_url', 'https://spectra-proxy.tuonome.workers.dev');
location.reload();
```

Per tornare indietro: `localStorage.removeItem('bsi_proxy_url')`.

Per verificare che il proxy risponda, apri nel browser:
`https://spectra-proxy.tuonome.workers.dev/stato` — deve elencare i fornitori
per cui hai messo una chiave.

---

## Protezioni già attive

Una volta pubblicato, l'indirizzo del proxy è raggiungibile da chiunque lo
scopra, e consumerebbe **la tua** quota. Per questo il Worker ha tre freni,
regolabili in `wrangler.toml`:

| Variabile | Predefinito | A cosa serve |
|---|---|---|
| `ORIGINI` | il tuo sito GitHub Pages | Accetta solo richieste che arrivano dalle pagine elencate. Lasciarlo **vuoto significa "chiunque"** — sconsigliato. |
| `LIMITE_IP` | 20 | Richieste al minuto da uno stesso visitatore. |
| `TETTO_GIORNO` | 2000 | Richieste totali al giorno, per non svuotare la quota in un pomeriggio. |

Il proxy inoltre **non lascia passare credenziali del client**: se qualcuno
prova a infilare una propria `Authorization` o un `?key=`, vengono scartate e
sostituite dalle tue. Non è un relay aperto verso il fornitore.

### Limiti veri, detti chiaramente

`ORIGINI` ferma l'abuso dal browser, non chi costruisce una richiesta a mano
falsificando l'intestazione `Origin`: è un filtro, non un'autenticazione.

I contatori di `LIMITE_IP` e `TETTO_GIORNO` stanno **in memoria**, e Cloudflare
esegue il Worker su molte istanze indipendenti: il conteggio è per istanza,
quindi i tetti reali sono più alti di quelli scritti. Frenano l'abuso, non lo
azzerano. Per limiti esatti servono Workers KV o Durable Objects — entrambi
possibili, il primo ha un piano gratuito ma con poche scritture al giorno,
troppo poche per contare ogni richiesta.

Se il proxy ti si riempie di traffico non tuo, la risposta più semplice è
cambiare nome al Worker (`name` in `wrangler.toml`, poi `deploy`): il vecchio
indirizzo smette di esistere.

---

## Come funziona

```
browser                    Cloudflare Worker              fornitore
   │                              │                           │
   │  POST /groq/openai/v1/...    │                           │
   │  (nessuna chiave)            │                           │
   ├─────────────────────────────►│                           │
   │                              │  + Authorization: Bearer  │
   │                              ├──────────────────────────►│
   │                              │                           │
   │        streaming SSE         │      streaming SSE        │
   │◄─────────────────────────────┼◄──────────────────────────┤
```

Il percorso dopo il nome del fornitore viene inoltrato tale e quale, quindi il
proxy non deve sapere nulla dei formati delle API: continua a funzionare anche
quando Spectra cambia modello o parametri. Lo streaming passa senza essere
bufferizzato — altrimenti le risposte comparirebbero tutte insieme alla fine
invece di scorrere parola per parola.

## Se non lo pubblichi

Non succede niente: senza `PROXY_URL` Spectra funziona come sempre, chiedendo
a ciascun utente la propria chiave gratuita, salvata nel suo browser. Le due
strade convivono, e per i fornitori non coperti dal proxy Spectra continua a
usare la chiave locale.
