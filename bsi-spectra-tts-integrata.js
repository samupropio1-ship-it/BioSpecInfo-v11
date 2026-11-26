/* BioSpecInfo v277 — Voce integrata di Spectra (offline, senza installazioni)
   ---------------------------------------------------------------------------
   Problema risolto: su molti telefoni/PC il browser non ha NESSUNA voce di
   sistema (speechSynthesis.getVoices() = 0) e quindi Spectra resta muta anche
   se il "bip" di prova si sente. Qui l'app porta la PROPRIA voce dentro di sé
   (meSpeak = eSpeak compilato in JavaScript), genera un file WAV e lo suona con
   la Web Audio API — lo stesso canale del bip, quello che sul tuo dispositivo
   funziona. Niente pacchetti vocali da scaricare a mano, niente servizi esterni.

   Questo modulo NON duplica la catena vocale esistente: viene usato come ultimo
   ripiego da BSISpectraVoce.sistema() quando mancano le voci di sistema, e dal
   pulsante "Prova voce". Il motore (5 MB) si scarica una sola volta, solo quando
   serve davvero (caricamento pigro), e poi resta nella cache del service worker.

   Il motore eSpeak è sotto licenza GNU GPL (vedi vendor/mespeak/). */
(function (globale) {
  'use strict';
  if (globale.BSISpectraTTSIntegrata) return;

  /* base: cartella di questo script, così vendor/ si risolve anche se l'app
     è pubblicata in una sottocartella (es. GitHub Pages). */
  var BASE = (function () {
    try {
      var s = document.currentScript && document.currentScript.src;
      if (s) return s.replace(/[^/]*$/, '');
    } catch (e) {}
    try { return (globale.location.href || '').replace(/[^/]*$/, ''); } catch (e) {}
    return '';
  })();
  var DIR = BASE + 'vendor/mespeak/';

  /* lingua app -> { file: nome JSON in voices/, id: voice_id interno } */
  var VOCI = {
    it: { file: 'it', id: 'it' },
    en: { file: 'en', id: 'en/en' },
    es: { file: 'es', id: 'es' },
    fr: { file: 'fr', id: 'fr' },
    de: { file: 'de', id: 'de' },
    pt: { file: 'pt-pt', id: 'pt-pt' },
    el: { file: 'el', id: 'el' },
    zh: { file: 'zh', id: 'zh' },
    nl: { file: 'nl', id: 'nl' },
    pl: { file: 'pl', id: 'pl' },
    ro: { file: 'ro', id: 'ro' }
    /* il russo (ru) non è incluso in meSpeak: ripiega sull'inglese (vedi risolviLingua) */
  };
  function risolviLingua(lang) {
    lang = (lang || 'it').toLowerCase().split(/[-_]/)[0];
    if (VOCI[lang]) return lang;
    return 'en'; /* ripiego sicuro: meglio una lettura in inglese che il silenzio */
  }

  var motorePronto = false;      /* bundle + config caricati */
  var caricamentoMotore = null;  /* Promise del caricamento in corso */
  var vociCaricate = {};         /* voice_id già inseriti nel motore */
  var caricamentoVoce = {};      /* Promise per voce in corso */
  var corrente = null;           /* sorgente audio in riproduzione */

  function AC() { return globale.AudioContext || globale.webkitAudioContext || null; }
  function supportata() { return !!AC(); }
  function disponibilePer(lang) { return !!VOCI[risolviLingua(lang)]; }

  function caricaScript(src) {
    return new Promise(function (ok, no) {
      var s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = function () { ok(); };
      s.onerror = function () { no(new Error('impossibile caricare ' + src)); };
      (document.head || document.documentElement).appendChild(s);
    });
  }

  function preparaMotore() {
    if (motorePronto) return Promise.resolve();
    if (caricamentoMotore) return caricamentoMotore;
    caricamentoMotore = caricaScript(DIR + 'mespeak-bundle.js')
      .then(function () {
        if (!globale.meSpeak) throw new Error('meSpeak non disponibile');
        return fetch(DIR + 'mespeak_config.json').then(function (r) {
          if (!r.ok) throw new Error('config HTTP ' + r.status); return r.json();
        });
      })
      .then(function (cfg) {
        globale.meSpeak.loadConfig(cfg);
        motorePronto = true;
      })
      .catch(function (e) { caricamentoMotore = null; throw e; });
    return caricamentoMotore;
  }

  function caricaVoce(lang) {
    var L = risolviLingua(lang), v = VOCI[L];
    if (vociCaricate[v.id]) return Promise.resolve(v);
    if (caricamentoVoce[v.id]) return caricamentoVoce[v.id];
    caricamentoVoce[v.id] = fetch(DIR + 'voices/' + v.file + '.json')
      .then(function (r) { if (!r.ok) throw new Error('voce HTTP ' + r.status); return r.json(); })
      .then(function (dati) {
        return new Promise(function (ok) {
          globale.meSpeak.loadVoice(dati, function () { vociCaricate[v.id] = true; ok(v); });
        });
      })
      .catch(function (e) { caricamentoVoce[v.id] = null; throw e; });
    return caricamentoVoce[v.id];
  }

  function prepara(lang) {
    return preparaMotore().then(function () { return caricaVoce(lang); });
  }
  function pronta(lang) {
    var v = VOCI[risolviLingua(lang)];
    return motorePronto && !!(v && vociCaricate[v.id]);
  }

  /* contesto Web Audio: si riusa quello già sbloccato dal bip (BSISpectraLive),
     così la voce suona anche nell'auto-lettura (fuori da un gesto utente). */
  function contesto() {
    try {
      if (globale.BSISpectraLive && globale.BSISpectraLive.ctxAudio) {
        var c = globale.BSISpectraLive.ctxAudio();
        if (c) return c;
      }
    } catch (e) {}
    var A = AC(); if (!A) return null;
    if (!contesto._c) contesto._c = new A();
    if (contesto._c.state === 'suspended') { try { contesto._c.resume(); } catch (e) {} }
    return contesto._c;
  }

  function ferma() {
    if (corrente) {
      corrente.annullato = true;
      try { if (corrente.src) corrente.src.stop(); } catch (e) {}
      corrente = null;
    }
  }

  /* parla: ritorna una Promise che si risolve a fine riproduzione.
     opz.suBocca(stato) riceve fotogrammi per l'animazione della bocca;
     opz.speed/pitch/amplitude/variant sovrascrivono i parametri di default;
     opz.token (oggetto con .annullato) permette l'annullamento esterno. */
  function parla(testo, lang, opz) {
    opz = opz || {};
    testo = String(testo == null ? '' : testo).trim();
    if (!testo) return Promise.resolve({ ok: true, motore: 'integrata', vuoto: true });
    if (!supportata()) return Promise.resolve({ ok: false, motore: 'nessuno' });
    ferma();
    var mio = corrente = { annullato: false, src: null, token: opz.token || null };
    return prepara(lang).then(function (v) {
      if (mio.annullato || (mio.token && mio.token.annullato)) return { annullato: true };
      var wav;
      try {
        wav = globale.meSpeak.speak(testo, {
          rawdata: 'array',
          voice: v.id,
          speed: opz.speed != null ? opz.speed : 162,
          pitch: opz.pitch != null ? opz.pitch : 52,
          amplitude: opz.amplitude != null ? opz.amplitude : 110,
          variant: opz.variant != null ? opz.variant : 'm3'
        });
      } catch (e) { wav = null; }
      if (!wav || !wav.length) return { ok: false, motore: 'integrata', errore: 'sintesi vuota' };
      var ctx = contesto();
      if (!ctx) return { ok: false, motore: 'nessuno' };
      var u8 = new Uint8Array(wav);
      var ab = u8.buffer.slice(0);
      return new Promise(function (fine) {
        ctx.decodeAudioData(ab, function (buf) {
          if (mio.annullato || (mio.token && mio.token.annullato)) { fine({ annullato: true }); return; }
          if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
          var src = ctx.createBufferSource(); src.buffer = buf;
          var gain = ctx.createGain(); gain.gain.value = 1;
          src.connect(gain); gain.connect(ctx.destination);
          mio.src = src;
          var t0 = ctx.currentTime, dur = buf.duration, raf = 0;
          (function giro() {
            if (mio.annullato || (mio.token && mio.token.annullato)) { try { src.stop(); } catch (e) {} return; }
            var fr = Math.min(1, (ctx.currentTime - t0) / Math.max(0.001, dur));
            if (opz.suBocca) try { opz.suBocca({ energia: 0.6 + 0.2 * Math.sin(ctx.currentTime * 22), apertura: 0.55, rotondo: 0, largo: 0, frazione: fr }); } catch (e) {}
            if (fr < 1) raf = requestAnimationFrame(giro);
          })();
          src.onended = function () {
            if (raf) cancelAnimationFrame(raf);
            if (opz.suBocca) try { opz.suBocca({ energia: 0, apertura: 0, rotondo: 0, largo: 0, frazione: 1 }); } catch (e) {}
            if (corrente === mio) corrente = null;
            fine({ ok: true, motore: 'integrata', durata: dur });
          };
          try { src.start(); } catch (e) { fine({ ok: false, motore: 'integrata', errore: String(e) }); }
        }, function (e) { fine({ ok: false, motore: 'integrata', errore: 'decode: ' + e }); });
      });
    }).catch(function (e) {
      return (mio.annullato) ? { annullato: true } : { ok: false, motore: 'integrata', errore: String(e && e.message || e) };
    });
  }

  globale.BSISpectraTTSIntegrata = {
    supportata: supportata,
    disponibilePer: disponibilePer,
    prepara: prepara,
    pronta: pronta,
    parla: parla,
    ferma: ferma,
    lingue: function () { return Object.keys(VOCI); },
    versione: '1.0'
  };
})(typeof window !== 'undefined' ? window : globalThis);
