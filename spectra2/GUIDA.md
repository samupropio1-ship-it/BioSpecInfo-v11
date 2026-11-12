# Costruire Spectra, passo per passo

Per chi non sa programmare. Ogni passo dice **che cosa fare**, **che cosa devi
vedere** se è andato bene, e **che cosa fare se non va**. Non serve scrivere
codice: solo copiare comandi.

Un avviso onesto: questa guida è scritta sul codice, che è provato (60 prove
automatiche), ma i passi **non sono stati eseguiti su una tua macchina** e
nessun turno è stato ancora fatto con un modello vero. Se un passo non dà ciò
che è scritto, fermati lì e riporta il messaggio esatto: è il modo più rapido
per sistemarlo (vedi `PROMEMORIA.md`).

I comandi sono per **Windows**. Su Mac e Linux cambiano due cose: `py` diventa
`python3`, e le variabili si impostano con `export NOME="valore"` invece di
`setx`.

---

## Che cosa ti serve

| | |
|---|---|
| Una macchina che resta accesa | il tuo PC va bene per cominciare. Spectra «esiste» solo mentre questa macchina è accesa: per averlo sempre, più avanti, un mini-PC o un Raspberry Pi lasciato acceso a casa |
| Una chiave di un fornitore di modelli | quella di Gemini che usi già in BioSpecInfo va bene per cominciare. Se ne hai più di una, Spectra passa alla successiva quando una non risponde |
| Un account Tailscale (gratuito per uso personale) | serve a raggiungere Spectra dal telefono fuori casa, senza esporlo a Internet |
| Mezz'ora | per i passi 1–5 |

---

## Fase 1 — Accendere il cervello (passi 1–5)

### Passo 1. Installa Python

Vai su python.org → Downloads → scarica la versione 3.11 o successiva e
installala. **Nella prima schermata spunta «Add python.exe to PATH».**

Controllo: apri il menu Start, scrivi `cmd`, premi Invio. Nella finestra nera
scrivi:

```
py --version
```

Devi vedere `Python 3.11` o un numero più alto. Se dice che il comando non
esiste, reinstalla Python spuntando la casella del PATH.

### Passo 2. Scarica Spectra

Dalla pagina del repository BioSpecInfo su GitHub: pulsante verde **Code** →
**Download ZIP**. Estrai lo zip dove vuoi, per esempio in `C:\Spectra`.
Dentro c'è la cartella `spectra2`: è quella che conta.

### Passo 3. Controlla che sia tutto a posto

Nella finestra nera:

```
cd C:\Spectra\BioSpecInfo-v11-main\spectra2
py -m unittest discover -s prove
```

(il nome della cartella dopo `C:\Spectra\` è quello che vedi dopo aver estratto
lo zip). Dopo mezzo minuto devi vedere una riga che finisce con **`OK`**.
Qualche prova può comparire come «skipped»: va bene, sono quelle che chiedono
programmi che non hai installato.

### Passo 4. Dai a Spectra le chiavi

Servono due segreti. **Non scriverli mai in un file della cartella e non
mandarli a nessuno.**

1. **Il gettone**: la parola d'ordine che i tuoi dispositivi useranno per
   parlare con Spectra. Inventala lunga (una frase di almeno cinque parole,
   senza spazi alla fine).
2. **La chiave del modello.**

Nella finestra nera, una riga alla volta, con i tuoi valori fra le virgolette:

```
setx SPECTRA_GETTONE "la-tua-frase-lunga-e-solo-tua"
setx GEMINI_API_KEY "la-tua-chiave-di-gemini"
```

Altre chiavi, se le hai (ne basta una): `ANTHROPIC_API_KEY` (richiede anche
`py -m pip install anthropic`), `GROQ_API_KEY`, `OPENROUTER_API_KEY`,
`XAI_API_KEY`.

**Chiudi la finestra nera e riaprine una nuova**: `setx` vale solo per le
finestre aperte dopo.

### Passo 5. Accendilo e fai il primo turno

```
cd C:\Spectra\BioSpecInfo-v11-main\spectra2
py -m spectra.servizio
```

Devi vedere: `Spectra in ascolto su 0.0.0.0:8787`. Se Windows chiede se
permettere l'accesso alla rete, scegli **reti private**. Lascia questa finestra
aperta: finché è aperta, Spectra è acceso.

Ora apri il browser sullo stesso computer e vai a:

```
http://localhost:8787
```

Compare la pagina di Spectra. Tocca ⚙︎, scrivi il gettone nel campo «Gettone»,
premi **Collega**. Devi leggere «Collegato. Ricordi: 0 …». Scrivi: *«Ciao.
Sono Samuele, studio chimica.»*

**Questo è il momento della verità**: è il primo turno con un modello vero.

- Se risponde: Spectra esiste. Chiudi il browser, riaprilo dopo un'ora e
  chiedigli *«Che cosa sai di me?»*: deve ricordarselo.
- Se compare «Non riesco a raggiungere Spectra»: guarda la finestra nera, copia
  l'ultimo messaggio d'errore e riportalo.
- Se dice «nessun fornitore configurato»: la chiave del passo 4 non è stata
  letta. Hai riaperto la finestra nera?

Dove sta la memoria: nel file `memoria.db` dentro la cartella `.spectra` della
tua cartella utente. **Quel file è Spectra.** Copiarlo è fare una copia di
sicurezza; cancellarlo è farlo ricominciare da zero.

---

## Fase 2 — Averlo su tutti i dispositivi (passi 6–8)

### Passo 6. La rete privata

1. Su tailscale.com crea un account e installa Tailscale sul computer dove gira
   Spectra. Accedi.
2. Installa l'app Tailscale sul telefono (Android o iPhone) e accedi con lo
   stesso account.
3. Nella pagina di amministrazione di Tailscale, sezione DNS, attiva
   **MagicDNS** e **HTTPS Certificates**.
4. Sul computer, in una **seconda** finestra nera:

```
tailscale serve --bg 8787
```

Il comando stampa un indirizzo che comincia con `https://` e finisce con
`.ts.net`. **È l'indirizzo di Spectra**: funziona da tutti i tuoi dispositivi
con Tailscale acceso, e da nessun altro.

Perché questo passo: il microfono nel browser funziona solo su indirizzi
`https`. Senza, potresti scrivergli dal telefono ma non parlargli. (Se il
comando è cambiato, la guida di Tailscale alla voce «serve» dà quello attuale.)

### Passo 7. Il telefono

- **Android**: apri Chrome, vai all'indirizzo `https://….ts.net`, inserisci il
  gettone. Poi menu ⋮ → **Aggiungi a schermata Home**: Spectra diventa un'icona
  come un'app.
- **iPhone**: apri **Safari** (non Chrome), stesso indirizzo, stesso gettone.
  Poi il tasto Condividi → **Aggiungi alla schermata Home**.

Prova: scrivi qualcosa dal telefono mentre la pagina è aperta anche sul
computer. La domanda e la risposta devono comparire su tutti e due.

### Passo 8. Parlargli, e chiamarlo per nome

- **🎙**: tieni la pagina aperta, tocca il microfono, parla. La prima volta il
  browser chiede il permesso: consentilo.
- **👂 Ascolto continuo**: la pagina resta in ascolto e risponde quando dici
  **«Spectra, …»**. Se dici solo «Spectra», risponde «Sì» e aspetta la domanda.

Che cosa aspettarti, senza sorprese:

- funziona finché la pagina è aperta e in primo piano. Con lo schermo spento o
  il telefono in tasca il browser smette di ascoltare: è una regola di Android
  e iOS;
- sul computer è il modo più comodo: lasci la pagina aperta e lo chiami;
- sull'iPhone l'ascolto continuo si interrompe spesso: usa il tasto 🎙;
- la voce è quella del dispositivo, resa bassa e lenta. Se non senti nulla:
  volume dei **contenuti multimediali** alzato e telefono non in silenzioso.

Prova i promemoria: *«Spectra, ricordami fra due minuti di bere.»* Dopo due
minuti lo dice da solo, sul dispositivo che hai usato per ultimo.

---

## Fase 3 — La sua voce vera (passo 9)

Fin qui parla la voce del dispositivo. Per una voce sua, uguale ovunque e
indispensabile per gli occhiali, serve la sintesi sul computer di Spectra:

1. installa **FFmpeg** (ffmpeg.org) e **Piper** (il progetto «piper» di
   Rhasspy, su GitHub: scarica la versione per Windows ed estraila);
2. scarica una voce italiana maschile di Piper (un file `.onnx` e il suo
   `.json`, nella stessa cartella);
3. fai in modo che `piper` e `ffmpeg` si possano chiamare dalla finestra nera
   (le loro cartelle vanno aggiunte al PATH di Windows);
4. `setx SPECTRA_PIPER_MODELLO "C:\percorso\della\voce.onnx"`, poi riavvia
   Spectra.

Il timbro (tono, eco, modulazione) si regola in `spectra/voce.py`. Va tarato a
orecchio: è un lavoro da fare insieme, ascoltando.

---

## Fase 4 — Farlo partire da solo

Perché Spectra si accenda con il computer: Start → **Utilità di pianificazione**
→ Crea attività di base → «All'avvio del computer» → Avvia programma →
programma `py`, argomenti `-m spectra.servizio`, «Da» la cartella `spectra2`.

Quando passerai a un mini-PC o a un Raspberry Pi: stessi passi 1–5 su quella
macchina, e copi il file `memoria.db`. Spectra si sposta con la sua memoria.

---

## Fase 5 — BioSpecInfo

Il collegamento è già scritto (`ponte/biospecinfo-strumenti.js`) ma **non è
ancora dentro l'app**. Va aggiunto in una prossima versione: una casella
«Spectra 2.0» nelle impostazioni con indirizzo e gettone. Da quel momento
Spectra potrà aprire le sezioni dell'app, risolvere gli esercizi e leggere lo
schermo su tua richiesta.

---

## Fase 6 — Gli occhiali Ray-Ban Meta

È la parte che richiede più lavoro e che **non si può fare senza programmare**:
serve un'app Android compilata. Il progetto è scritto
(`ponte/android/PonteOcchiali.kt`) ma non è mai stato compilato.

Che cosa serve:

1. l'accesso al **Wearables Device Access Toolkit** di Meta (ci si registra sul
   sito per sviluppatori di Meta; è in anteprima, e la disponibilità dipende dal
   paese e dal modello di occhiali);
2. **Android Studio** su un computer, e un telefono Android;
3. qualcuno che completi i tre punti segnati «DA VERIFICARE» nella classe
   `OcchialiMeta`, con il riferimento della versione del toolkit installata.
   Si può fare insieme, in una conversazione dedicata, un punto alla volta:
   prima con gli occhiali finti (`OcchialiFinti`), poi con il simulatore di
   Meta, poi con gli occhiali veri.

Che cosa otterrai: tocchi la stanghetta (o, in «modalità Spectra», dici
**«Spectra, …»**), parli, e la risposta arriva negli altoparlanti degli
occhiali con la sua voce. «Spectra, che cos'è questo?» scatta una foto di ciò
che guardi.

Che cosa **non** otterrai: sostituire «Hey Meta» dentro gli occhiali (Meta non
lo permette), né una fotocamera sempre accesa.

Nel frattempo c'è una scorciatoia che funziona subito: gli occhiali sono anche
cuffie Bluetooth. Con il client web aperto sul telefono e l'ascolto continuo
acceso, senti Spectra negli occhiali e gli parli dal loro microfono, senza
nessuna app da compilare. Manca solo la fotocamera, e lo schermo del telefono
deve restare acceso.

---

## Se qualcosa non va

| Che cosa vedi | Che cosa fare |
|---|---|
| «Gettone non valido» | il gettone nella pagina (⚙︎) non è quello del passo 4; attenzione agli spazi |
| «Non raggiungibile» dal telefono | Tailscale è acceso su tutti e due? La finestra nera di Spectra è ancora aperta? |
| Risponde, ma non parla | ⚙︎ → «Spectra parla su questo dispositivo»; volume multimediale; telefono non in silenzioso |
| Il microfono non parte | l'indirizzo comincia con `https://`? Il permesso del microfono è concesso alla pagina? |
| Risposte lente | il fornitore è sovraccarico: aggiungi una seconda chiave (passo 4), Spectra userà quella quando la prima non risponde |
| Vuoi ricominciare da zero | spegni Spectra e rinomina `memoria.db` (non cancellarlo: è la sua storia) |

## Sicurezza, in quattro righe

- Il gettone è la chiave di casa: chi lo ha, parla con Spectra e legge la sua
  memoria. Non condividerlo.
- Non aprire la porta 8787 sul router. Si entra solo dalla rete privata.
- Le chiavi dei modelli non vanno in nessun file della cartella.
- Fai ogni tanto una copia di `memoria.db` su una chiavetta.
