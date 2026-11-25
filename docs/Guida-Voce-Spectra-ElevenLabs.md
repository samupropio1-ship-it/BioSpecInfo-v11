# La voce di Spectra con ElevenLabs

| | |
|---|---|
| **Versione descritta** | `bsi-v271` (prima versione con la voce ElevenLabs) |
| **File** | `bsi-spectra-elevenlabs.js` (client), `proxy/spectra-proxy.js` (route `POST /voce`), `tools/spectra-voce-design.mjs` (Voice Design) |
| **Banchi** | `test_voce_elevenlabs` (24 controlli, nella batteria), `tools/banchi/test_worker.mjs` (sezione 14, route `/voce`) |

Spectra può parlare con una voce progettata su ElevenLabs: maschile, sui 35 anni, fredda, calma,
precisa, con un'aria di superiorità controllata. È un **personaggio**, non l'imitazione di un attore:
riprodurre la voce di una persona reale senza il suo consenso è vietato dalle regole d'uso di
ElevenLabs. La descrizione qui sotto dà il carattere, non la persona.

---

## 1. Il prompt di Voice Design

Si incolla nella pagina **Voice Design** di ElevenLabs (oppure lo usa da solo `tools/spectra-voce-design.mjs`).
In inglese, perché il modello di progettazione segue meglio le descrizioni inglesi; 707 caratteri
(il limite è 20–1000).

**Descrizione della voce**

```text
A male voice in his mid-thirties for an advanced artificial intelligence: cold, calm and calculating.
Deep-to-mid baritone, smooth and controlled, with a quiet, effortless authority and a faint air of
superiority, as if he is always three steps ahead. Precise diction with crisp consonants, measured
unhurried pacing, deliberate pauses before key words; he never raises his voice. Dry, understated
irony; polite on the surface, unsettling underneath. Neutral, clear General American accent.
Subtly synthetic sheen: very clean, almost too perfect, no breathiness, but still natural and
human-sounding, not robotic. Close-mic studio recording, dry room, no reverb, no background noise,
broadcast quality.
```

**Testo delle anteprime** (100–1000 caratteri): deve far sentire il carattere, non un elenco di parole.

```text
I've read every paper you saved, and every note you forgot you wrote. You were close, closer than you
think. The answer was never hidden; you simply weren't looking at it the right way. Shall we begin?
I promise this will be... illuminating.
```

**Come si sceglie.** Si generano tre anteprime e si ascoltano in cuffia. Si scarta quella che respira o
ha riverbero, e quella troppo metallica. Si tiene quella con le pause più nette prima delle parole
importanti. Se tutte sono troppo «umane», si aggiunge *slightly processed, with a faint digital
precision*; se sono troppo robotiche, si toglie *Subtly synthetic sheen…*.

**L'italiano.** BioSpecInfo parla soprattutto italiano. Una voce progettata con accento americano,
fatta parlare in italiano con `eleven_multilingual_v2`, conserva una leggera inflessione straniera: per
un'IA va bene, anzi rafforza il carattere. Se la si vuole neutra, si sostituisce *Neutral, clear General
American accent* con *Neutral, clear standard Italian accent* e si usa un testo di prova in italiano.

---

## 2. I parametri

ElevenLabs espone quattro regolazioni (più il *speaker boost*). Questi sono i tre stili dell'app:

| Stile | stability | similarity_boost | style | speed | speaker boost | Quando |
|---|---|---|---|---|---|---|
| **ultron** (predefinito) | **0,60** | **0,85** | **0,25** | **0,93** | sì | la voce di Spectra |
| minaccioso | 0,48 | 0,85 | 0,42 | 0,88 | sì | frasi brevi, effetto |
| chiaro | 0,72 | 0,80 | 0,10 | 1,00 | sì | spiegazioni lunghe |

Perché questi valori:

- **stability 0,60**: alta abbastanza da tenere il tono piatto e controllato (la freddezza viene da qui);
  sopra 0,75 diventa monotona come un risponditore, sotto 0,45 la voce si mette a «recitare».
- **similarity_boost 0,85**: resta vicina alla voce progettata, compresa la sua patina sintetica; sopra
  0,9 si portano dietro anche i difetti dell'anteprima.
- **style 0,25**: un po' di esagerazione del carattere (l'ironia, la superiorità). Più alto è più
  teatrale ma meno stabile e più lento da generare: 0,4 al massimo, e solo per frasi brevi.
- **speed 0,93**: un filo più lento del naturale, che dà autorità; l'intervallo accettato è 0,7–1,2.
- **use_speaker_boost**: rafforza la somiglianza alla voce; costa un po' di latenza, qui conviene.

I valori fuori dai limiti vengono **stretti** prima della richiesta (nel client e nel proxy), così un
errore di battitura non spende caratteri.

**Il modello**

| Modello | Quando |
|---|---|
| `eleven_multilingual_v2` (predefinito) | la qualità migliore in italiano |
| `eleven_turbo_v2_5` | più rapido, ottima qualità |
| `eleven_flash_v2_5` | latenza minima, per risposte brevi in conversazione |
| `eleven_v3` | il più espressivo; accetta indicazioni come `[calmly]`, `[whispers]` nel testo |

---

## 3. Le tre strade

### a) Dentro BioSpecInfo (già fatto)

Chat di Spectra → **🎙️ Voce** → chiave API, Voice ID, stile, modello → **🔊 Prova**. Da quel momento
console, chat («🔊 Ascolta», lettura automatica) e figura di Spectra parlano con questa voce. La chiave
resta in `localStorage` (`bsi_api_keys.elevenlabs`), come le altre; non entra mai nel codice.

### b) Sicura, con il proxy (per chi non deve vedere la chiave)

Il Worker `proxy/spectra-proxy.js` ha una route **dedicata**, `POST /voce`. Non è un inoltro generico
verso ElevenLabs: con la chiave del proprietario chiunque potrebbe clonare o cancellare voci. Il
client manda **solo** testo, stile e contesto; voce, chiave, modelli ammessi e limiti stanno sul server.

```bash
cd proxy
npx wrangler secret put ELEVENLABS_KEYS     # una o più chiavi, separate da virgole
npx wrangler secret put SPECTRA_VOICE_ID    # il Voice ID della voce progettata
npx wrangler deploy
```

In `wrangler.toml`: `VOCE_TESTO_MAX` (caratteri per richiesta, 1000) e `VOCE_CARATTERI_GIORNO` (20000:
ElevenLabs si paga a caratteri). Più chiavi = rotazione automatica su 401/403/429. Il messaggio d'errore
del servizio passa al client, la chiave mai. Nell'app: indirizzo del proxy nelle impostazioni di Spectra,
poi **🎙️ Voce** → «Passa dal proxy».

### c) In un'altra PWA (il modulo da solo)

`bsi-spectra-elevenlabs.js` funziona anche fuori da BioSpecInfo: espone `BSISpectraElevenLabs.VoceSpectra`.

```html
<script src="bsi-spectra-elevenlabs.js"></script>
<button id="parla">Parla</button>
<button id="zitto">Ferma</button>
<script>
  const { VoceSpectra } = window.BSISpectraElevenLabs;
  // Versione sicura: la chiave sta sul server.
  const spectra = new VoceSpectra({
    modalita: 'proxy',
    endpoint: 'https://spectra-proxy.<tuo-account>.workers.dev/voce',
    preset: 'ultron',                       // 'ultron' | 'minaccioso' | 'chiaro'
    modelId: 'eleven_multilingual_v2',
    onInizio: (t) => console.log('parla:', t),
    onFine: (esito) => console.log('fine:', esito),     // { ok, motore: 'elevenlabs' | 'sistema', annullato }
    onErrore: (e) => console.warn(e.tipo, e.message),   // chiave, voce, testo, quota, servizio, rete, tempo, audio
    onEnergia: (e) => document.body.style.setProperty('--voce', e)  // 0…1, per animare una bocca o un'onda
  });

  // I telefoni sbloccano l'audio solo dentro un gesto: la prima volta si chiama sblocca() in un tocco.
  document.getElementById('parla').addEventListener('click', async () => {
    spectra.sblocca();
    await spectra.parla('Ho completato l’analisi. Il risultato era prevedibile.');
    // In coda: parte quando finisce la precedente.
    spectra.parla('Vuoi che proceda?');
    // Interrompe tutto e dice subito questa.
    // spectra.parla('Fermati.', { interrompi: true });
  });
  document.getElementById('zitto').addEventListener('click', () => spectra.ferma());
</script>
```

Versione diretta (sviluppo, o l'utente che usa la **sua** chiave sul suo dispositivo):

```js
const spectra = new VoceSpectra({ modalita: 'diretta', apiKey: chiaveDellUtente, voiceId: 'IL_TUO_VOICE_ID' });
```

**Service worker.** Non mettere in cache le risposte di `api.elevenlabs.io` né di `/voce`: sono audio
generati, diversi a ogni testo. Il modulo ha già una sua cache in memoria (40 pezzi) per non ripagare
le frasi ripetute. Offline la voce passa al ripiego (sintesi del sistema).

---

## 4. Che cosa fa il client

- **Coda**: le frasi chieste mentre parla aspettano; `{ interrompi: true }` taglia quella in corso;
  `ferma()` svuota tutto (le promesse si risolvono con `annullato: true`, non restano appese).
- **Testi lunghi**: spezzati per frasi in pezzi da 600 caratteri; il pezzo successivo si scarica mentre
  suona il precedente, e porta `previous_text` / `next_text` per un'intonazione continua.
- **Errori**: 401 chiave, 403 permesso, 404 voce, 400/422 testo, 429 quota, 5xx servizio, rete, tempo
  scaduto (25 s), audio illeggibile. 429, 5xx, rete e tempo si ritentano due volte con attesa crescente
  (0,6 s, 1,2 s, più un po' di caso). Se tutto fallisce parla la voce del sistema, salvo `ripiego: false`.
- **Audio**: Web Audio (con l'analizzatore che dà `onEnergia` per il labiale), altrimenti un elemento `<audio>`.
- **Microfono**: prima di parlare libera la sentinella «Spectra…» (su Android, accesa, ammutolisce l'audio)
  e la restituisce alla fine.
- **Voice Design dal codice**: `progettaVoce(descrizione, testo)` e `salvaVoce(nome, descrizione, id)`; se
  l'endpoint attuale risponde 404 provano quello precedente.

## 5. Che cosa resta da verificare con una chiave vera

Il banco usa un server ElevenLabs simulato con audio vero: verifica le richieste, la coda, gli errori e il
proxy, non la voce. Da provare con un account: la resa delle anteprime, la pronuncia italiana della voce
scelta, la latenza sul telefono (multilingual v2 contro flash v2.5), il consumo di caratteri.
