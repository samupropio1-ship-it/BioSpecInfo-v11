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
  /* (v266) catena più ricca: sub-armonica, due bande di presenza, aria, de-esser,
     allargamento stereo (Haas), limitatore in uscita; ogni numero è regolabile. */
  var TIMBRO = {
    subHz: 70, subDb: 2.5, bassiHz: 140, bassiDb: 5, fangoHz: 350, fangoDb: -3,
    corpoHz: 900, corpoDb: 1.5, presenzaHz: 2800, presenzaDb: 3.5, ariaHz: 10500, ariaDb: 2,
    deessHz: 6800, deessDb: -4, deessQ: 2.2,
    anelloHz: 55, anello: 0.1, pettineMs: 4.3, pettineRetro: 0.33, pettine: 0.15, calore: 1.5,
    larghezzaMs: 12, larghezza: 0.5, stanzaS: 1.5, stanza: 0.15, volume: 0.96, limite: -1.5
  };
  /* tre timbri pronti: 'androide' (predefinito), 'profonda', 'cristallo' */
  var PRESET = {
    androide: TIMBRO,
    profonda: Object.assign({}, TIMBRO, { subDb: 4.5, bassiDb: 6.5, presenzaDb: 2.5, ariaDb: 1, anello: 0.14, calore: 1.9, stanza: 0.2, stanzaS: 1.9 }),
    cristallo: Object.assign({}, TIMBRO, { subDb: 1, bassiDb: 3, presenzaDb: 4.5, ariaDb: 3.5, anello: 0.04, pettine: 0.06, calore: 1.1, stanza: 0.1, deessDb: -6 })
  };
  function timbro(opz) { opz = opz || {}; if (opz.timbro && typeof opz.timbro === 'object') return opz.timbro; return PRESET[opz.preset] || PRESET[presetSalvato()] || TIMBRO; }
  function presetSalvato() { try { return localStorage.getItem('bsi-voce-preset') || 'androide'; } catch (e) { return 'androide'; } }
  var ISTRUZIONI = 'Voice: a deep, resonant, cinematic male voice, warm but subtly metallic, like a calm, highly intelligent scientist android. Delivery: measured and confident, with natural micro-pauses at commas and full stops, a gentle downward inflection at the end of statements, and light emphasis on key terms. Tone: kind, precise, quietly enthusiastic about science; never robotic or monotone. Studio quality, close-mic, no background noise. Language: match the language of the text exactly.';
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
  /* la catena (v266): ingresso → EQ (sub, bassi, fango, corpo, presenza, aria) →
     de-esser → metallo (anello + pettine) → calore → de-ess dinamico → stanza →
     allargamento stereo (Haas) → compressore → limitatore → uscita.
     restituisce { ingresso, uscita, analizzatore, ferma } */
  function catena(a, P) {
    P = P || TIMBRO;
    var ing = a.createGain();
    function shelf(tipo, hz, db, q) { var f = a.createBiquadFilter(); f.type = tipo; f.frequency.value = hz; f.gain.value = db; if (q != null && f.Q) f.Q.value = q; return f; }
    var sub = shelf('lowshelf', P.subHz, P.subDb);
    var bassi = shelf('lowshelf', P.bassiHz, P.bassiDb);
    var fango = shelf('peaking', P.fangoHz, P.fangoDb, 1.1);
    var corpo = shelf('peaking', P.corpoHz || 900, P.corpoDb || 0, 0.8);
    var pres = shelf('peaking', P.presenzaHz, P.presenzaDb, 0.9);
    var aria = shelf('highshelf', P.ariaHz || 10000, P.ariaDb || 0);
    ing.connect(sub); sub.connect(bassi); bassi.connect(fango); fango.connect(corpo); corpo.connect(pres); pres.connect(aria);
    /* de-esser statico: una campana che addolcisce le sibilanti */
    var deess = shelf('peaking', P.deessHz || 6800, P.deessDb || 0, P.deessQ || 2.2); aria.connect(deess);
    /* metallo: anello + pettine, in parallelo al segnale pulito */
    var secco = a.createGain(); secco.gain.value = 1 - P.anello;
    var anelloG = a.createGain(); anelloG.gain.value = 0; var anelloMix = a.createGain(); anelloMix.gain.value = P.anello;
    var osc = a.createOscillator(); osc.frequency.value = P.anelloHz; osc.connect(anelloG.gain); osc.start();
    deess.connect(secco); deess.connect(anelloG); anelloG.connect(anelloMix);
    var pett = a.createDelay(0.05); pett.delayTime.value = P.pettineMs / 1000; var retro = a.createGain(); retro.gain.value = P.pettineRetro; var pettMix = a.createGain(); pettMix.gain.value = P.pettine;
    deess.connect(pett); pett.connect(retro); retro.connect(pett); pett.connect(pettMix);
    var somma = a.createGain(); secco.connect(somma); anelloMix.connect(somma); pettMix.connect(somma);
    /* calore: saturazione morbida */
    var sat = a.createWaveShaper(), curva = new Float32Array(1024); for (var i = 0; i < 1024; i++) { var x = i / 511.5 - 1; curva[i] = Math.tanh(P.calore * x) / Math.tanh(P.calore); } sat.curve = curva; sat.oversample = '4x';
    somma.connect(sat);
    /* stanza */
    var conv = a.createConvolver(); conv.buffer = impulso(a, P.stanzaS); var umido = a.createGain(); umido.gain.value = P.stanza; var asciutto = a.createGain(); asciutto.gain.value = 1;
    sat.connect(asciutto); sat.connect(conv); conv.connect(umido);
    var preMix = a.createGain(); asciutto.connect(preMix); umido.connect(preMix);
    /* allargamento stereo (Haas): un canale ritardato, per una voce più presente e tridimensionale */
    var largo = null, merge = null;
    try {
      if (P.larghezza > 0 && a.createChannelMerger) {
        merge = a.createChannelMerger(2); var ritL = a.createDelay(0.05), gL = a.createGain(), gR = a.createGain();
        ritL.delayTime.value = (P.larghezzaMs || 12) / 1000; gL.gain.value = P.larghezza; gR.gain.value = P.larghezza;
        var cen = a.createGain(); cen.gain.value = 1 - P.larghezza * 0.5;
        preMix.connect(cen); preMix.connect(ritL); ritL.connect(gL); preMix.connect(gR);
        cen.connect(merge, 0, 0); cen.connect(merge, 0, 1); gL.connect(merge, 0, 0); gR.connect(merge, 0, 1); largo = merge;
      }
    } catch (e) { largo = null; }
    var comp = a.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3.5; comp.attack.value = 0.004; comp.release.value = 0.18;
    (largo || preMix).connect(comp);
    /* limitatore in uscita: rapporto alto e soglia alta, perché le bande in più non facciano clipping */
    var lim = a.createDynamicsCompressor(); lim.threshold.value = P.limite != null ? P.limite : -1.5; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.002; lim.release.value = 0.12;
    comp.connect(lim);
    var out = a.createGain(); out.gain.value = P.volume; lim.connect(out);
    var an = a.createAnalyser(); an.fftSize = 1024; an.smoothingTimeConstant = 0.55; out.connect(an);
    return { ingresso: ing, uscita: out, analizzatore: an, ferma: function () { try { osc.stop(); } catch (e) {} } };
  }

  /* l'audio dal servizio (con cache: la stessa frase non si paga due volte) */
  function sintetizza(testo) {
    var k = chiaveOpenAI(); if (!k) return Promise.reject(new Error('nessuna chiave'));
    if (cache[testo]) return Promise.resolve(cache[testo]);
    /* (v266) formato WAV senza perdita verso la catena Web Audio, e un filo più lento per autorevolezza */
    var corpo = function (modello) { var b = { model: modello, voice: 'onyx', input: String(testo).slice(0, 3800), response_format: 'wav', speed: 0.96 }; if (modello !== 'tts-1') b.instructions = ISTRUZIONI; return JSON.stringify(b); };
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
    var eraInCorso = false; try { eraInCorso = 'speechSynthesis' in globale && (speechSynthesis.speaking || speechSynthesis.pending); } catch (e) {}
    ferma();
    /* (v261) il microfono della sentinella si libera prima di parlare (su Android, acceso, ammutolisce la voce) */
    var attesa = 0; try { if (globale.bsiPrimaDiParlare) { attesa = globale.bsiPrimaDiParlare() || 0; opz._libera = true; } } catch (e) {}
    if (eraInCorso) attesa = Math.max(attesa, 160);
    if (attesa && !opz._atteso) { opz._atteso = true; return new Promise(function (ok) { setTimeout(ok, attesa); }).then(function () { return parla2(testo, opz); }).then(fine2(opz), fine2(opz, true)); }
    return parla2(testo, opz).then(fine2(opz), fine2(opz, true));
  }
  function fine2(opz, errore) { return function (r) { if (opz._libera && globale.bsiDopoAverParlato) try { globale.bsiDopoAverParlato(); } catch (e) {} opz._libera = false; if (errore) throw r; return r; }; }
  function parla2(testo, opz) {
    /* (v263) la voce ElevenLabs (stile freddo e controllato), se l'utente l'ha configurata: ha la precedenza */
    var EL = globale.BSISpectraElevenLabs;
    if (EL && EL.attiva() && !opz.soloSistema) {
      var V = EL.voce(), mio2 = corrente = { annullato: false, el: V };
      V.opz.onEnergia = function (e) { if (opz.suBocca) try { opz.suBocca({ energia: e, apertura: Math.min(1, e * 1.15), rotondo: 0, largo: 0 }); } catch (er) { } };
      return V.parla(testo, { interrompi: true }).then(function (r) { if (mio2.annullato) return { annullato: true }; if (opz.suBocca) try { opz.suBocca({ energia: 0, apertura: 0, rotondo: 0, largo: 0, frazione: 1 }); } catch (e) { } return r; });
    }
    var mio = corrente = { annullato: false };
    var a = contesto();
    if (a && chiaveOpenAI() && navigator.onLine !== false && !opz.soloSistema) {
      var ripresa = a.state === 'suspended' && a.resume ? a.resume().catch(function () {}) : null;
      return sintetizza(testo).then(function (audio) {
        if (mio.annullato) return { annullato: true };
        /* (v243) un contesto audio ancora sospeso suonerebbe in silenzio: meglio la voce del sistema.
           (v261) prima si prova a riprenderlo davvero (la ripresa è asincrona: chiederla e controllare subito falliva) */
        return Promise.race([ripresa || Promise.resolve(), new Promise(function (ok) { setTimeout(ok, 700); })]).then(function () {
        if (mio.annullato) return { annullato: true };
        if (a.state !== 'running') return sistema(testo, opz, mio);
        var src = a.createBufferSource(); src.buffer = audio;
        var C = catena(a, timbro(opz)); src.connect(C.ingresso); C.uscita.connect(a.destination);
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
        });
      }).catch(function () { return mio.annullato ? { annullato: true } : sistema(testo, opz, mio); });
    }
    return sistema(testo, opz, mio);
  }
  /* (v277) quante voci di sistema sono realmente disponibili (0 = telefono muto pur col bip) */
  function vociSistemaUsabili() { try { return ('speechSynthesis' in globale) ? speechSynthesis.getVoices().length : 0; } catch (e) { return 0; } }
  /* (v277) router del ripiego: se mancano le voci di sistema (o l'utente sceglie la voce
     integrata), usa la voce offline di Spectra (meSpeak via Web Audio); altrimenti la sintesi
     del sistema. Così "si sente il bip ma non la voce" è risolto senza installare nulla. */
  function sistema(testo, opz, mio) {
    var TI = globale.BSISpectraTTSIntegrata;
    if (TI && TI.supportata() && (opz.integrata || vociSistemaUsabili() === 0)) return integrata(testo, opz, mio);
    return sistemaReale(testo, opz, mio);
  }
  /* (v277) la voce integrata offline; se fallisce davvero (non per annullamento), ripiega
     sulla sintesi di sistema reale per non lasciare mai Spectra senza tentativi. */
  function integrata(testo, opz, mio) {
    var TI = globale.BSISpectraTTSIntegrata;
    var lang = (globale.BSILingue && globale.BSILingue.corrente) ? globale.BSILingue.corrente() : 'it';
    var tk = { annullato: false }; mio.integrata = tk;
    if (mio.annullato) return Promise.resolve({ annullato: true });
    return TI.parla(testo, lang, { suBocca: opz.suBocca, token: tk, speed: opz.speed, pitch: opz.pitch, amplitude: opz.amplitude, variant: opz.variant }).then(function (r) {
      if (r && r.ok === false && !r.vuoto && !mio.annullato && ('speechSynthesis' in globale) && vociSistemaUsabili() > 0) return sistemaReale(testo, opz, mio);
      return r || { ok: true, motore: 'integrata' };
    });
  }
  /* il ripiego: la sintesi del sistema, voce maschile piu' grave */
  function sistemaReale(testo, opz, mio) {
    if (!('speechSynthesis' in globale)) return Promise.resolve({ ok: false, motore: 'nessuno' });
    return new Promise(function (fineOrig) {
      /* (v274) keep-alive anti-freeze: oltre al resume() prima di ogni frase,
         un battito periodico tiene viva la sintesi: su Android/Chrome la voce
         si spegne da sola dopo ~15 s di parlato continuo, e questo lo evita.
         Si spegne appena l'enunciato finisce o viene fermato. */
      var battito = null;
      try { battito = setInterval(function () { try { if (speechSynthesis.speaking && !mio.annullato) speechSynthesis.resume(); else { clearInterval(battito); battito = null; } } catch (e) { clearInterval(battito); battito = null; } }, 5000); } catch (e) {}
      function fine(r) { if (battito) { clearInterval(battito); battito = null; } fineOrig(r); }
      /* (v275) la voce segue la lingua scelta nel selettore, non solo it/en:
         si cerca una voce installata per quella lingua; se il dispositivo non
         ne ha una (es. greco o russo mancanti), si imposta comunque la lingua
         giusta e si lascia scegliere al browser la voce più vicina, senza mai
         bloccare la lettura. */
      var u = new SpeechSynthesisUtterance(testo), L = speechSynthesis.getVoices();
      var lg = (globale.BSILingue && BSILingue.corrente) ? BSILingue.corrente() : 'it';
      var BCP = { it: 'it-IT', en: 'en-US', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', pt: 'pt-PT', nl: 'nl-NL', pl: 'pl-PL', ro: 'ro-RO', el: 'el-GR', ru: 'ru-RU', zh: 'zh-CN', ja: 'ja-JP', ar: 'ar-SA' };
      var bcp = BCP[lg] || (lg + '-' + lg.toUpperCase());
      var v = L.filter(function (x) { return (x.lang || '').toLowerCase().indexOf(lg) === 0; }).sort(function (a, b) { return punteggio(b) - punteggio(a); })[0];
      var andr = /Android/i.test(navigator.userAgent || '');   /* (v248) su Android solo la lingua, non la voce per nome */
      if (v && !andr) u.voice = v; u.lang = v && !andr ? v.lang : bcp; u.rate = 0.88; u.pitch = 0.58; u.volume = 1;
      u.onboundary = function (ev) { if (opz.suBocca && ev.charIndex != null) opz.suBocca({ energia: 0.7, apertura: 0.6, rotondo: 0, largo: 0, frazione: ev.charIndex / Math.max(1, testo.length) }); };
      u.onend = u.onerror = function () { if (opz.suBocca) opz.suBocca({ energia: 0, apertura: 0, rotondo: 0, largo: 0, frazione: 1 }); fine({ ok: true, motore: 'sistema' }); };
      /* (v261) su Android una frase lunga a volte non parte o si tronca: si dice frase per frase, tenendo in vita l'enunciato */
      var pezzi = (String(testo).match(/[^.!?;:\n]+[.!?;:]*/g) || [String(testo)]).map(function (x) { return x.trim(); }).filter(function (x) { return x.length > 1; }), k = 0, fatto = 0;
      function prossimo() {
        if (mio.annullato) { fine({ annullato: true }); return; }
        if (k >= pezzi.length) { if (opz.suBocca) opz.suBocca({ energia: 0, apertura: 0, rotondo: 0, largo: 0, frazione: 1 }); fine({ ok: true, motore: 'sistema' }); return; }
        var w = new SpeechSynthesisUtterance(pezzi[k]), base = fatto; k++; fatto += pezzi[k - 1].length + 1;
        w.voice = u.voice; w.lang = u.lang; w.rate = u.rate; w.pitch = u.pitch; w.volume = 1; mio.u = w;
        w.onboundary = function (ev) { if (opz.suBocca && ev.charIndex != null) opz.suBocca({ energia: 0.7, apertura: 0.6, rotondo: 0, largo: 0, frazione: (base + ev.charIndex) / Math.max(1, testo.length) }); };
        /* (v266) una micro-pausa naturale dopo la punteggiatura: la lettura non è più piatta */
        var fin = pezzi[k - 1], gap = mio.annullato ? 0 : /[.!?…]\s*$/.test(fin) ? 150 : /[;:,]\s*$/.test(fin) ? 80 : 30;
        var andato = false; function via() { if (andato) return; andato = true; if (gap) setTimeout(prossimo, gap); else prossimo(); }
        w.onend = via; w.onerror = function (ev) { if (ev && (ev.error === 'interrupted' || ev.error === 'canceled')) { if (mio.annullato) return; } via(); };
        try { speechSynthesis.resume(); speechSynthesis.speak(w); } catch (e) { via(); }
      }
      prossimo();
    });
  }
  function punteggio(v) { var n = (v.name || '').toLowerCase(); return (/male|uomo|diego|luca|giorgio|cosimo|paolo|daniel|george|arthur|onyx/.test(n) ? 3 : 0) + (/female|donna|alice|elsa|federica|samantha|google/.test(n) ? -2 : 0) + (v.localService ? 0.5 : 0) + (/neural|natural|premium|enhanced|siri|multilingual/.test(n) ? 2 : 0); }
  function ferma() {
    if (corrente && corrente.integrata) { corrente.integrata.annullato = true; try { if (globale.BSISpectraTTSIntegrata) globale.BSISpectraTTSIntegrata.ferma(); } catch (e) {} }
    if (corrente && corrente.el) { corrente.annullato = true; try { corrente.el.ferma(); } catch (e) { } }
    if (corrente) { corrente.annullato = true; try { if (corrente.src) corrente.src.stop(); } catch (e) {} if (corrente.chain) corrente.chain.ferma(); if (corrente.raf) cancelAnimationFrame(corrente.raf); }
    try { if ('speechSynthesis' in globale && (speechSynthesis.speaking || speechSynthesis.pending)) speechSynthesis.cancel(); } catch (e) {}   /* (v261) annullare a vuoto, su Android, fa cadere la frase dopo */
  }
  /* (v243) chiamata al primo tocco: il contesto audio nasce/riprende dentro un gesto, come chiedono i browser dei telefoni */
  function sblocca() { try { if (globale.BSISpectraElevenLabs && globale.BSISpectraElevenLabs.attiva()) globale.BSISpectraElevenLabs.voce().sblocca(); } catch (e) { } var a = contesto(); if (a && a.state === 'suspended') try { a.resume(); } catch (e) {} return a ? a.state : 'nessuno'; }
  /* (v277) 'integrata' = voce offline di Spectra, usata quando non ci sono voci di
     sistema ma la Web Audio funziona (il caso "si sente il bip ma non la voce"). */
  function qualita() {
    if (globale.BSISpectraElevenLabs && globale.BSISpectraElevenLabs.attiva()) return 'audio';
    if (chiaveOpenAI() && (globale.AudioContext || globale.webkitAudioContext)) return 'audio';
    if (('speechSynthesis' in globale) && vociSistemaUsabili() > 0) return 'sistema';
    if (globale.BSISpectraTTSIntegrata && globale.BSISpectraTTSIntegrata.supportata()) return 'integrata';
    return ('speechSynthesis' in globale) ? 'sistema' : 'testo';
  }

  function impostaPreset(nome) { if (!PRESET[nome]) return presetSalvato(); try { localStorage.setItem('bsi-voce-preset', nome); } catch (e) {} return nome; }
  globale.BSISpectraVoce = { sblocca: sblocca, parla: parla, ferma: ferma, qualita: qualita, catena: catena, impulso: impulso, leggiBocca: leggiBocca, TIMBRO: TIMBRO, PRESET: PRESET, timbro: timbro, impostaPreset: impostaPreset, presetSalvato: presetSalvato, ISTRUZIONI: ISTRUZIONI, versione: '2.0' };
})(typeof window !== 'undefined' ? window : globalThis);
