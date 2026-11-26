# Voce integrata di Spectra — meSpeak / eSpeak (nota di licenza)

Questa cartella contiene il motore di sintesi vocale **offline** usato da
BioSpecInfo per dare a Spectra una voce propria quando il dispositivo non ha
nessuna voce di sistema, senza installare pacchetti vocali e senza servizi
esterni.

## Componenti

- **meSpeak.js** — wrapper JavaScript di eSpeak, di **Norbert Landsteiner**
  (masswerk.at). Progetto: http://www.masswerk.at/mespeak/
- **eSpeak** — motore text-to-speech a formanti, compilato in JavaScript/asm.js
  tramite Emscripten. Progetto originale: https://espeak.sourceforge.net/
  (successore attuale: eSpeak NG, https://github.com/espeak-ng/espeak-ng)
- Il pacchetto npm `mespeak` (v2.0.2) da cui questi file derivano:
  https://www.npmjs.com/package/mespeak

File in questa cartella:

- `mespeak-bundle.js` — motore (`ESpeak.js`) e wrapper (`mespeak.js`) uniti in un
  unico file che espone `window.meSpeak`, caricabile come `<script>` normale.
- `mespeak_config.json` — dati di configurazione di eSpeak (fonemi, intonazioni).
- `voices/*.json` — moduli voce per lingua (it, en, es, fr, de, pt-pt, el, zh,
  nl, pl, ro).

## Licenza

eSpeak e meSpeak sono distribuiti sotto **GNU General Public License (GPL)**.
Il testo completo della GPL versione 3 è incluso qui accanto in
`COPYING-GPL-3.0.txt`.

Di conseguenza:

- Questi componenti (il motore vocale e i suoi dati) **restano** sotto licenza
  GPL: chiunque ridistribuisca l'applicazione deve mantenerli sotto GPL e
  rendere disponibile il loro codice sorgente.
- Il **codice sorgente** di questi componenti, nella forma in cui vengono
  distribuiti, è `mespeak-bundle.js` in questa cartella (JavaScript leggibile);
  il sorgente originale in C di eSpeak è reperibile ai progetti indicati sopra.
- Sono usati come **libreria separata**, attraverso la loro interfaccia pubblica
  (`meSpeak.loadConfig`, `meSpeak.loadVoice`, `meSpeak.speak`). Il resto di
  BioSpecInfo resta sotto la licenza propria dell'applicazione (vedi
  `../../LICENSE`): la GPL si applica a questi componenti vocali, non all'intera
  opera.

Nessuna modifica è stata apportata al codice di eSpeak o di meSpeak: i due file
CommonJS originali (`ESpeak.js` e `mespeak.js`) sono solo stati concatenati, così
come sono, dentro `mespeak-bundle.js` per poterli caricare come singolo script.
