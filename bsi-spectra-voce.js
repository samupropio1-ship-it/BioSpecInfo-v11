/* ═══════════════════════════════════════════════════════════════════════════
   bsi-spectra-voce.js — la voce di Spectra: profonda, robotica, calda ma metallica
   BioSpecInfo · © Samuele Pio Provenzano

   PERCHE' ESISTE
   La voce richiesta: «profonda, robotica, maschile, calda ma metallica, con
   riverbero cyberpunk controllato, labiale preciso». La sintesi del browser
   (speechSynthesis) non lascia toccare l'audio: niente effetti, niente
   sincronia vera con la bocca. Serve un servizio che restituisca AUDIO. Se
   l'utente ha una chiave OpenAI (la stessa che usa per Spectra), la voce passa
   da gpt-4o-mini-tts (voce «onyx», con istruzioni sul timbro); l'audio entra
   in una catena Web Audio costruita qui.

   LA CATENA (in ordine)
   · bassi: mensola sotto 140 Hz, +5 dB — il corpo;
   · fango: −3 dB a 350 Hz — toglie l'effetto «scatola»;
   · presenza: +3 dB a 2,8 kHz — l'intelligibilita';
   · metallo: modulatore ad anello (portante a 55 Hz) miscelato al 12 %, con un
     filtro a pettine corto (ritardo 4,3 ms, retroazione 0,35) che da' il
     timbro di voce attraverso un elmo;
   · calore: saturazione morbida (tanh, pochissima);
   · stanza: riverbero di una sala di 1,4 s generato nel codice (rumore con
     decadimento esponenziale, piu' corto sugli acuti), al 16 %;
   · compressore in uscita.
   Ogni parametro e' nell'oggetto TIMBRO e si puo' regolare.

   IL LABIALE
   Mentre l'audio suona, un analizzatore legge l'energia (RMS) e il centroide
   spettrale: l'energia apre la mandibola, il centroide distingue vocali chiuse
   (u, o: centroide basso → labbra arrotondate) da aperte o larghe (a, e, i).
   La posizione nel testo segue il tempo di riproduzione (frazione del tempo
   totale), cosi' le espressioni legate alle frasi arrivano al momento giusto.

   RIPIEGHI
   · senza chiave o senza rete: speechSynthesis, voce maschile piu' grave
     disponibile, intonazione bassa (nessun effetto possibile);
   · senza sintesi: solo testo.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var TIMBRO = {
    bassiHz: 140, bassiDb: 5, fangoHz: 350, fangoDb: -3, presenzaHz: 2800, presenzaDb: 3,
    anelloHz: 55, anello: 0.12, pettineMs: 4.3, pettineRetro: 0.35, pettine: 0.18, calore: 1.6,
    stanzaS: 1.4, stanza: 0.16, volume: 0.95
  };
  var ISTRUZIONI = 'Voice: a deep, resonant male voice, warm but slightly metallic, like a calm scientist android. Pace: measured, confident. Tone: kind, precise, quietly enthusiastic about science. Language: same as the text.';
  var ac = null, cache = {}, corrente = null;

  function chiaveOpenAI() {
    try { var k = JSON.parse(localStorage.getItem('bsi_api_keys') || '{}'); return k && k.openai ? String(k.openai) : null; } catch (e) { return null; }
  }
  function contesto() {
    if (ac) return ac;
    var AC = globale.AudioContext || globale.webkitAudioContext; if (!AC) return null;
    ac = new AC(); return ac;
  }

  /* il riverbero: risposta all'impulso sintetica (stereo, decadimento piu' rapido sugli acuti) */
  function impulso(a, secondi) {
    var sr = a.sampleRate, n = Math.max(1, Math.floor(sr * secondi)), b = a.createBuffer(2, n, sr);
    for (var c = 0; c < 2; c++) {
      var d = b.getChannelData(c), lp = 0;
      for (var i = 0; i < n; i++) {
        var t = i / sr, inv = Math.exp(-t * 6.9 / secondi), r = (Math.random() * 2 - 1) * inv;
        lp += (r - lp) * (0.25 + 0.6 * inv);   /* coda via via piu' scura */
        d[i] = lp * (i < sr * 0.012 ? i / (sr * 0.012) : 1);
      }
    }
    return b;
  }
  /* la catena: restituisce { ingresso, uscita, analizzatore, ferma } */
  function catena(a, P) {
    P = P || TIMBRO;
    var ing = a.createGain();
    var bassi = a.createBiquadFilter(); bassi.type = 'lowshelf'; bassi.frequency.value = P.bassiHz; bassi.gain.value = P.bassiDb;
    var fango = a.createBiquadFilter(); fango.type = 'peaking'; fango.frequency.value = P.fangoHz; fango.Q.value = 1.1; fango.gain.value = P.fangoDb;
    var pres = a.createBiquadFilter(); pres.type = 'peaking'; pres.frequency.value = P.presenzaHz; pres.Q.value = 0.9; pres.gain.value = P.presenzaDb;
    ing.connect(bassi); bassi.connect(fango); fango.connect(pres);
    /* metallo: anello + pettine, in parallelo al segnale pulito */
    var secco = a.createGain(); secco.gain.value = 1 - P.anello;
    var anelloG = a.createGain(); anelloG.gain.value = 0; var anelloMix = a.createGain(); anelloMix.gain.value = P.anello;
    var osc = a.createOscillator(); osc.frequency.value = P.anelloHz; osc.connect(anelloG.gain); osc.start();
    pres.connect(secco); pres.connect(anelloG); anelloG.connect(anelloMix);
    var pett = a.createDelay(0.05); pett.delayTime.value = P.pettineMs / 1000; var retro = a.createGain(); retro.gain.value = P.pettineRetro; var pettMix = a.createGain(); pettMix.gain.value = P.pettine;
    pres.connect(pett); pett.connect(retro); retro.connect(pett); pett.connect(pettMix);
    var somma = a.createGain(); secco.connect(somma); anelloMix.connect(somma); pettMix.connect(somma);
    /* calore: saturazione morbida */
    var sat = a.createWaveShaper(), curva = new Float32Array(1024); for (var i = 0; i < 1024; i++) { var x = i / 511.5 - 1; curva[i] = Math.tanh(P.calore * x) / Math.tanh(P.calore); } sat.curve = curva; sat.oversample = '2x';
    somma.connect(sat);
    /* stanza */
    var conv = a.createConvolver(); conv.buffer = impulso(a, P.stanzaS); var umido = a.createGain(); umido.gain.value = P.stanza; var asciutto = a.createGain(); asciutto.gain.value = 1;
    sat.connect(asciutto); sat.connect(conv); conv.connect(umido);
    var comp = a.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3.5; comp.attack.value = 0.004; comp.release.value = 0.18;
    var out = a.createGain(); out.gain.value = P.volume;
    asciutto.connect(comp); umido.connect(comp); comp.connect(out);
    var an = a.createAnalyser(); an.fftSize = 1024; an.smoothingTimeConstant = 0.55; out.connect(an);
    return { ingresso: ing, uscita: out, analizzatore: an, ferma: function () { try { osc.stop(); } catch (e) {} } };
  }

  /* l'audio dal servizio (con cache: la stessa frase non si paga due volte) */
  function sintetizza(testo) {
    var k = chiaveOpenAI(); if (!k) return Promise.reject(new Error('nessuna chiave'));
    if (cache[testo]) return Promise.resolve(cache[testo]);
    var corpo = function (modello) { var b = { model: modello, voice: 'onyx', input: String(testo).slice(0, 3800), response_format: 'mp3' }; if (modello !== 'tts-1') b.instructions = ISTRUZIONI; return JSON.stringify(b); };
    var chiedi = function (modello) {
      return fetch('https://api.openai.com/v1/audio/speech', { method: 'POST', headers: { 'Authorization': 'Bearer ' + k, 'Content-Type': 'application/json' }, body: corpo(modello) })
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); });
    };
    return chiedi('gpt-4o-mini-tts').catch(function () { return chiedi('tts-1'); }).then(function (buf) {
      var a = contesto(); return new Promise(function (ok, ko) { a.decodeAudioData(buf, ok, ko); });
    }).then(function (audio) { cache[testo] = audio; return audio; });
  }

  /* il labiale dall'audio: energia → apertura, centroide → forma (arrotondata o larga) */
  function leggiBocca(an, dati) {
    an.getByteFrequencyData(dati);
    var s = 0, sp = 0, sw = 0, n = dati.length, hz = (ac ? ac.sampleRate : 48000) / 2 / n;
    for (var i = 2; i < n * 0.5; i++) { var v = dati[i] / 255; s += v * v; sp += v * i * hz; sw += v; }
    var energia = Math.min(1, Math.sqrt(s / (n * 0.5)) * 3.2), centro = sw ? sp / sw : 0;
    return { energia: energia, centroide: centro, apertura: Math.min(1, energia * 1.15), rotondo: centro > 0 && centro < 900 ? Math.min(1, (900 - centro) / 500) * energia : 0, largo: centro > 1700 ? Math.min(1, (centro - 1700) / 1200) * energia : 0 };
  }

  /* parla: restituisce una promessa che si risolve alla fine; opz.suBocca(stato) a ogni fotogramma */
  function parla(testo, opz) {
    opz = opz || {};
    ferma();
    var mio = corrente = { annullato: false };
    var a = contesto();
    if (a && chiaveOpenAI() && navigator.onLine !== false && !opz.soloSistema) {
      if (a.state === 'suspended') try { a.resume(); } catch (e) {}
      return sintetizza(testo).then(function (audio) {
        if (mio.annullato) return { annullato: true };
        var src = a.createBufferSource(); src.buffer = audio;
        var C = catena(a, opz.timbro); src.connect(C.ingresso); C.uscita.connect(a.destination);
        var dati = new Uint8Array(C.analizzatore.frequencyBinCount), t0 = a.currentTime;
        mio.src = src; mio.chain = C;
        return new Promise(function (fine) {
          (function giro() {
            if (mio.annullato) { fine({ annullato: true }); return; }
            var b = leggiBocca(C.analizzatore, dati); b.frazione = Math.min(1, (a.currentTime - t0) / audio.duration);
            if (opz.suBocca) try { opz.suBocca(b); } catch (e) {}
            if (b.frazione < 1) mio.raf = requestAnimationFrame(giro);
          })();
          src.onended = function () { C.ferma(); if (opz.suBocca) try { opz.suBocca({ energia: 0, apertura: 0, rotondo: 0, largo: 0, frazione: 1 }); } catch (e) {} fine({ ok: true, motore: 'audio', durata: audio.duration }); };
          src.start();
        });
      }).catch(function () { return mio.annullato ? { annullato: true } : sistema(testo, opz, mio); });
    }
    return sistema(testo, opz, mio);
  }
  /* il ripiego: la sintesi del sistema, voce maschile piu' grave */
  function sistema(testo, opz, mio) {
    if (!('speechSynthesis' in globale)) return Promise.resolve({ ok: false, motore: 'nessuno' });
    return new Promise(function (fine) {
      var u = new SpeechSynthesisUtterance(testo), L = speechSynthesis.getVoices(), lg = (globale.BSILingue && BSILingue.corrente && BSILingue.corrente() === 'en') ? 'en' : 'it';
      var v = L.filter(function (x) { return (x.lang || '').toLowerCase().indexOf(lg) === 0; }).sort(function (a, b) { return punteggio(b) - punteggio(a); })[0];
      if (v) u.voice = v; u.lang = v ? v.lang : (lg === 'en' ? 'en-GB' : 'it-IT'); u.rate = 0.93; u.pitch = 0.6; u.volume = 1;
      u.onboundary = function (ev) { if (opz.suBocca && ev.charIndex != null) opz.suBocca({ energia: 0.7, apertura: 0.6, rotondo: 0, largo: 0, frazione: ev.charIndex / Math.max(1, testo.length) }); };
      u.onend = u.onerror = function () { if (opz.suBocca) opz.suBocca({ energia: 0, apertura: 0, rotondo: 0, largo: 0, frazione: 1 }); fine({ ok: true, motore: 'sistema' }); };
      mio.u = u; try { speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) { fine({ ok: false }); }
    });
  }
  function punteggio(v) { var n = (v.name || '').toLowerCase(); return (/male|uomo|diego|luca|giorgio|cosimo|paolo|daniel|george|arthur|onyx/.test(n) ? 3 : 0) + (/female|donna|alice|elsa|federica|samantha|google/.test(n) ? -2 : 0) + (v.localService ? 0.5 : 0); }
  function ferma() {
    if (corrente) { corrente.annullato = true; try { if (corrente.src) corrente.src.stop(); } catch (e) {} if (corrente.chain) corrente.chain.ferma(); if (corrente.raf) cancelAnimationFrame(corrente.raf); }
    try { if ('speechSynthesis' in globale) speechSynthesis.cancel(); } catch (e) {}
  }
  function qualita() { return chiaveOpenAI() && (globale.AudioContext || globale.webkitAudioContext) ? 'audio' : ('speechSynthesis' in globale ? 'sistema' : 'testo'); }

  globale.BSISpectraVoce = { parla: parla, ferma: ferma, qualita: qualita, catena: catena, impulso: impulso, leggiBocca: leggiBocca, TIMBRO: TIMBRO, versione: '1.0' };
})(typeof window !== 'undefined' ? window : globalThis);
