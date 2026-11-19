/* ═══════════════════════════════════════════════════════════════════════
   bsi-spectra-elevenlabs.js — la voce di Spectra con ElevenLabs (v263)
   BioSpecInfo · © Samuele Pio Provenzano

   Una voce maschile fredda, calma e precisa (il personaggio: un'intelligenza
   artificiale controllata e un po' superiore), generata con ElevenLabs.
   Funziona in due modi:
     · «diretta»: il browser chiama api.elevenlabs.io con la chiave che
       l'utente ha inserito sul SUO dispositivo (localStorage, mai nel codice);
     · «proxy»: il browser chiama il Worker di BioSpecInfo (POST /voce), che
       tiene la chiave come segreto Cloudflare e la voce fissata sul server.
       È la versione da usare quando l'app la usano altre persone.

   COSA FA
   · coda: le frasi chieste mentre parla aspettano il loro turno; con
     { interrompi: true } la nuova frase taglia quella in corso;
   · testi lunghi spezzati per frasi (≤ 600 caratteri): il pezzo successivo si
     scarica MENTRE suona il precedente (nessuna pausa fra i pezzi) e porta
     previous_text / next_text, così l'intonazione resta continua;
   · audio con Web Audio (decodeAudioData) e, se manca, con un elemento
     <audio>; un analizzatore fornisce l'energia per il labiale (onEnergia);
   · cache dei pezzi già sintetizzati (si pagano i caratteri: la stessa frase
     non si ripaga);
   · errori classificati (chiave, voce, testo, quota, rete, tempo scaduto);
     429 e 5xx si ritentano con attesa crescente; se tutto fallisce, la voce
     del sistema (speechSynthesis) dice il testo, salvo { ripiego: false };
   · prima di parlare libera il microfono della sentinella «Spectra…» (su
     Android, acceso, ammutolisce l'audio) e lo restituisce alla fine.

   NIENTE CHIAVI NEL CODICE: il banco verifica-sicurezza lo controlla.
   ═══════════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';

  /* ═══ impostazioni ═══════════════════════════════════════════════════════ */
  var API = 'https://api.elevenlabs.io';
  /** I tre stili. «ultron»: freddo e controllato; «minaccioso»: più lento, più teatrale; «chiaro»: per spiegazioni lunghe. */
  var PRESET = {
    ultron:     { stability: 0.60, similarity_boost: 0.85, style: 0.25, use_speaker_boost: true, speed: 0.93 },
    minaccioso: { stability: 0.48, similarity_boost: 0.85, style: 0.42, use_speaker_boost: true, speed: 0.88 },
    chiaro:     { stability: 0.72, similarity_boost: 0.80, style: 0.10, use_speaker_boost: true, speed: 1.00 }
  };
  /** Limiti dei parametri accettati da ElevenLabs: si stringono qui, prima di spendere una richiesta. */
  var LIMITI = { stability: [0, 1], similarity_boost: [0, 1], style: [0, 1], speed: [0.7, 1.2] };
  var MODELLI = {
    eleven_multilingual_v2: 'Multilingual v2 — la qualità migliore in italiano (consigliato)',
    eleven_turbo_v2_5: 'Turbo v2.5 — più rapido, ottima qualità',
    eleven_flash_v2_5: 'Flash v2.5 — latenza minima (≈ 75 ms), qualità un po\' più bassa',
    eleven_v3: 'v3 — il più espressivo, accetta i tag come [calmly] o [whispers]'
  };
  /* (v266) qualità dell'audio: il bitrate del file restituito. 128 è il predefinito, 192 il più nitido. */
  var FORMATI = {
    mp3_44100_128: 'MP3 44,1 kHz · 128 kbps (predefinito)',
    mp3_44100_192: 'MP3 44,1 kHz · 192 kbps (più nitido, serve il piano adatto)',
    mp3_22050_32: 'MP3 22 kHz · 32 kbps (leggero, per reti lente)'
  };
  var CHIAVE_IMPOSTAZIONI = 'bsi-spectra-voce-11';
  var MAX_PEZZO = 600, MAX_CACHE = 40, TEMPO_MAX_MS = 25000, TENTATIVI = 2;

  function cl(v, lim) { v = +v; return isFinite(v) ? Math.max(lim[0], Math.min(lim[1], v)) : null; }
  /** voice_settings pulite: solo i campi noti, dentro i limiti */
  function impostazioniVoce(base, extra) {
    var s = {}, src = Object.assign({}, base || PRESET.ultron, extra || {});
    ['stability', 'similarity_boost', 'style', 'speed'].forEach(function (k) { var v = cl(src[k], LIMITI[k]); if (v !== null) s[k] = v; });
    s.use_speaker_boost = src.use_speaker_boost !== false;
    return s;
  }

  /* ═══ testo: pulizia e pezzi ═════════════════════════════════════════════ */
  /** il testo scritto per gli occhi diventa testo da dire (niente markdown, niente link) */
  function pulisci(t) {
    var L = g.BSISpectraLive;
    try { if (L && L.calcolo && L.calcolo.perLaVoce) return L.calcolo.perLaVoce(t); } catch (e) { }
    return String(t || '').replace(/```[\s\S]*?```/g, ' ').replace(/`([^`]*)`/g, '$1').replace(/\[(.*?)\]\([^)]*\)/g, '$1').replace(/[*_#>|]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  /** pezzi di al massimo n caratteri, tagliati alla fine di una frase (o di una parola, se una frase è troppo lunga) */
  function pezzi(t, n) {
    n = n || MAX_PEZZO; var frasi = String(t).match(/[^.!?;:\n]+[.!?;:]*\s*/g) || [String(t)], out = [], cur = '';
    frasi.forEach(function (f) {
      if ((cur + f).length <= n) { cur += f; return; }
      if (cur.trim()) out.push(cur.trim()); cur = '';
      while (f.length > n) { var i = f.lastIndexOf(' ', n); if (i < n * 0.5) i = n; out.push(f.slice(0, i).trim()); f = f.slice(i); }
      cur = f;
    });
    if (cur.trim()) out.push(cur.trim());
    return out.filter(Boolean);
  }
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }

  /* ═══ errori ═════════════════════════════════════════════════════════════ */
  function ErroreVoce(tipo, messaggio, stato) { var e = new Error(messaggio); e.name = 'ErroreVoce'; e.tipo = tipo; e.stato = stato || 0; return e; }
  var MESSAGGI = {
    chiave: 'La chiave ElevenLabs non è valida o è scaduta (401).',
    permesso: 'La chiave non ha il permesso per questa operazione o la voce non è tua (403).',
    voce: 'Voce non trovata: controlla il Voice ID (404).',
    testo: 'Il servizio ha rifiutato il testo o i parametri (422).',
    quota: 'Quota o richieste contemporanee esaurite (429): riprovo tra poco.',
    servizio: 'ElevenLabs non risponde correttamente (5xx).',
    rete: 'Nessuna connessione con il servizio della voce.',
    tempo: 'La voce non è arrivata in tempo.',
    audio: 'L\'audio ricevuto non si riesce a riprodurre.',
    configurazione: 'Voce non configurata: inserisci la chiave e il Voice ID, oppure l\'indirizzo del proxy.'
  };
  function tipoDaStato(s) { return s === 401 ? 'chiave' : s === 403 ? 'permesso' : s === 404 ? 'voce' : s === 400 || s === 422 ? 'testo' : s === 429 ? 'quota' : s >= 500 ? 'servizio' : 'servizio'; }
  function attendi(ms, segnale) { return new Promise(function (ok, ko) { var t = setTimeout(ok, ms); if (segnale) segnale.addEventListener('abort', function () { clearTimeout(t); ko(ErroreVoce('annullato', 'annullato')); }, { once: true }); }); }

  /* ═══ la classe ══════════════════════════════════════════════════════════ */
  /**
   * @param {object} opz
   *   modalita: 'diretta' | 'proxy'          · apiKey, voiceId (diretta)
   *   endpoint: URL del proxy (…/voce)        · modelId, preset, voiceSettings, outputFormat, lingua
   *   ripiego: true (voce di sistema se ElevenLabs fallisce) · cache: true · fetch: per le prove
   *   onInizio(testo), onFine(esito), onErrore(err), onEnergia(0…1), onPezzo(i, n)
   */
  function VoceSpectra(opz) {
    this.opz = Object.assign({ modalita: 'diretta', modelId: 'eleven_multilingual_v2', preset: 'ultron', outputFormat: 'mp3_44100_128', ripiego: true, cache: true, lingua: 'it' }, opz || {});
    this.coda = []; this.corrente = null; this.cache = new Map(); this.ac = null; this.analizzatore = null; this.volume = 1;
  }
  VoceSpectra.PRESET = PRESET; VoceSpectra.MODELLI = MODELLI;

  /** pronta a parlare con ElevenLabs? (altrimenti si userebbe solo il ripiego) */
  VoceSpectra.prototype.configurata = function () {
    var o = this.opz; return o.modalita === 'proxy' ? !!o.endpoint : !!(o.apiKey && o.voiceId);
  };
  VoceSpectra.prototype.impostazioni = function (extra) { return impostazioniVoce(PRESET[this.opz.preset] || PRESET.ultron, Object.assign({}, this.opz.voiceSettings || {}, extra || {})); };

  /** il contesto audio nasce o riprende DENTRO un gesto dell'utente (lo chiedono i browser dei telefoni) */
  VoceSpectra.prototype.sblocca = function () {
    var AC = g.AudioContext || g.webkitAudioContext; if (!AC) return 'nessuno';
    if (!this.ac) { this.ac = new AC(); this.uscita = this.ac.createGain(); this.analizzatore = this.ac.createAnalyser(); this.analizzatore.fftSize = 512; this.uscita.connect(this.analizzatore); this.analizzatore.connect(this.ac.destination); }
    if (this.ac.state === 'suspended') try { this.ac.resume(); } catch (e) { }
    return this.ac.state;
  };

  /**
   * Fa parlare Spectra. Restituisce una promessa che si risolve quando ha finito
   * ({ ok, motore: 'elevenlabs' | 'sistema', annullato }), anche se è stata interrotta.
   * opzioni: { interrompi, preset, voiceSettings, modelId, priorita }
   */
  VoceSpectra.prototype.parla = function (testo, opzioni) {
    var self = this, o = opzioni || {}, t = pulisci(testo);
    if (!t) return Promise.resolve({ ok: false, motivo: 'vuoto' });
    if (o.interrompi) this.ferma();
    return new Promise(function (risolvi) {
      var lavoro = { testo: t, opz: o, risolvi: risolvi };
      if (o.priorita) self.coda.unshift(lavoro); else self.coda.push(lavoro);
      self._prossimo();
    });
  };
  /** ferma la voce in corso e svuota la coda (le promesse in attesa si risolvono con annullato: true) */
  VoceSpectra.prototype.ferma = function () {
    var c = this.coda.splice(0); c.forEach(function (l) { l.risolvi({ ok: false, annullato: true }); });
    if (this.corrente) { var cur = this.corrente; cur.annullato = true; try { cur.abort.abort(); } catch (e) { } try { if (cur.sorgente) cur.sorgente.stop(); } catch (e) { } try { if (cur.audio) { cur.audio.pause(); cur.audio.src = ''; } } catch (e) { } }
    try { if (g.speechSynthesis && (speechSynthesis.speaking || speechSynthesis.pending)) speechSynthesis.cancel(); } catch (e) { }
  };
  VoceSpectra.prototype.staParlando = function () { return !!this.corrente; };

  VoceSpectra.prototype._prossimo = function () {
    var self = this; if (this.corrente || !this.coda.length) return;
    var lavoro = this.coda.shift(), cur = this.corrente = { annullato: false, abort: new AbortController(), lavoro: lavoro };
    var liberato = false, attesaMic = 0;
    try { if (g.bsiPrimaDiParlare) { attesaMic = g.bsiPrimaDiParlare() || 0; liberato = true; } } catch (e) { }
    if (this.opz.onInizio) try { this.opz.onInizio(lavoro.testo); } catch (e) { }
    var esito;
    attendi(attesaMic, cur.abort.signal).then(function () { return self._diciTutto(lavoro, cur); }).then(function (r) { esito = r; }, function (err) {
      if (cur.annullato || (err && err.tipo === 'annullato')) { esito = { ok: false, annullato: true }; return; }
      if (self.opz.onErrore) try { self.opz.onErrore(err); } catch (e) { }
      if (self.opz.ripiego !== false && lavoro.opz.ripiego !== false) return self._sistema(lavoro.testo, cur).then(function (r) { esito = Object.assign({ errore: err.tipo || 'sconosciuto', messaggio: err.message }, r); });
      esito = { ok: false, errore: err.tipo || 'sconosciuto', messaggio: err.message };
    }).then(function () {
      if (liberato && g.bsiDopoAverParlato) try { g.bsiDopoAverParlato(); } catch (e) { }
      if (self.opz.onEnergia) try { self.opz.onEnergia(0); } catch (e) { }
      if (self.opz.onFine) try { self.opz.onFine(esito); } catch (e) { }
      self.corrente = null; lavoro.risolvi(esito); self._prossimo();
    });
  };

  /** tutti i pezzi di un testo: il successivo si scarica mentre suona il precedente */
  VoceSpectra.prototype._diciTutto = function (lavoro, cur) {
    var self = this;
    if (!this.configurata()) return Promise.reject(ErroreVoce('configurazione', MESSAGGI.configurazione));
    var P = pezzi(lavoro.testo), scarica = function (i) { return self._sintetizza(P[i], { previous_text: P.slice(Math.max(0, i - 1), i).join(' ') || undefined, next_text: P[i + 1] || undefined, opz: lavoro.opz }, cur.abort.signal); };
    var prossimo = scarica(0);
    return P.reduce(function (catena, _, i) {
      return catena.then(function () {
        if (cur.annullato) throw ErroreVoce('annullato', 'annullato');
        var questo = prossimo; if (i + 1 < P.length) prossimo = scarica(i + 1);
        if (self.opz.onPezzo) try { self.opz.onPezzo(i, P.length); } catch (e) { }
        return questo.then(function (audio) { return self._suona(audio, cur); }).then(function () { if (cur.annullato) throw ErroreVoce('annullato', 'annullato'); });
      });
    }, Promise.resolve()).then(function () { return { ok: true, motore: 'elevenlabs', pezzi: P.length }; });
  };

  /** una richiesta di sintesi (con cache, tempo massimo e tentativi su 429/5xx) → ArrayBuffer mp3 */
  VoceSpectra.prototype._sintetizza = function (testo, extra, segnale) {
    var self = this, o = this.opz, imp = this.impostazioni(Object.assign({}, PRESET[extra.opz.preset] || {}, extra.opz.voiceSettings || {})), modello = extra.opz.modelId || o.modelId;
    var corpo = { text: testo, model_id: modello, voice_settings: imp };
    if (extra.previous_text) corpo.previous_text = extra.previous_text;
    if (extra.next_text) corpo.next_text = extra.next_text;
    if (o.lingua && /flash_v2_5|turbo_v2_5/.test(modello)) corpo.language_code = o.lingua;   /* i modelli v2.5 accettano la lingua imposta */
    var chiaveCache = hash(JSON.stringify([o.voiceId || 'proxy', modello, imp, testo]));
    if (o.cache && this.cache.has(chiaveCache)) { var b = this.cache.get(chiaveCache); this.cache.delete(chiaveCache); this.cache.set(chiaveCache, b); return Promise.resolve(b.slice(0)); }
    var url, headers = { 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' };
    if (o.modalita === 'proxy') { url = o.endpoint; }
    else { url = API + '/v1/text-to-speech/' + encodeURIComponent(o.voiceId) + '?output_format=' + encodeURIComponent(o.outputFormat); headers['xi-api-key'] = o.apiKey; }
    var F = o.fetch || g.fetch.bind(g);
    function prova(n) {
      var timer, abortT = new AbortController(), unisci = function () { abortT.abort(); };
      if (segnale) { if (segnale.aborted) return Promise.reject(ErroreVoce('annullato', 'annullato')); segnale.addEventListener('abort', unisci, { once: true }); }
      timer = setTimeout(function () { abortT.timeout = true; abortT.abort(); }, TEMPO_MAX_MS);
      return F(url, { method: 'POST', headers: headers, body: JSON.stringify(corpo), signal: abortT.signal }).then(function (r) {
        if (r.ok) return r.arrayBuffer();
        return r.text().catch(function () { return ''; }).then(function (txt) {
          var dett = ''; try { var j = JSON.parse(txt); dett = (j.detail && (j.detail.message || j.detail.status || (typeof j.detail === 'string' ? j.detail : ''))) || (j.error && j.error.message) || ''; } catch (e) { dett = txt.slice(0, 160); }
          var tipo = tipoDaStato(r.status); throw ErroreVoce(tipo, MESSAGGI[tipo] + (dett ? ' — ' + dett : ''), r.status);
        });
      }, function (e) {
        if (segnale && segnale.aborted) throw ErroreVoce('annullato', 'annullato');
        if (abortT.timeout) throw ErroreVoce('tempo', MESSAGGI.tempo);
        throw ErroreVoce('rete', MESSAGGI.rete + ' (' + e.message + ')');
      }).then(function (buf) {
        clearTimeout(timer); if (segnale) segnale.removeEventListener('abort', unisci);
        if (!buf || buf.byteLength < 64) throw ErroreVoce('audio', MESSAGGI.audio);
        if (o.cache) { self.cache.set(chiaveCache, buf.slice(0)); if (self.cache.size > MAX_CACHE) self.cache.delete(self.cache.keys().next().value); }
        return buf;
      }, function (err) {
        clearTimeout(timer); if (segnale) segnale.removeEventListener('abort', unisci);
        var ritenta = (err.tipo === 'quota' || err.tipo === 'servizio' || err.tipo === 'rete' || err.tipo === 'tempo') && n < TENTATIVI;
        if (!ritenta) throw err;
        return attendi(600 * Math.pow(2, n) + Math.random() * 250, segnale).then(function () { return prova(n + 1); });
      });
    }
    return prova(0);
  };

  /** suona un pezzo: Web Audio con l'analizzatore (labiale), altrimenti <audio> */
  VoceSpectra.prototype._suona = function (buf, cur) {
    var self = this; this.sblocca();
    if (this.ac && this.ac.state === 'running') {
      return this.ac.decodeAudioData(buf.slice(0)).then(function (audio) {
        if (cur.annullato) throw ErroreVoce('annullato', 'annullato');
        return new Promise(function (fine) {
          var src = self.ac.createBufferSource(); src.buffer = audio; src.connect(self.uscita); self.uscita.gain.value = self.volume; cur.sorgente = src;
          var dati = new Uint8Array(self.analizzatore.frequencyBinCount), raf = 0;
          (function giro() { if (cur.annullato || !self.opz.onEnergia) return; self.analizzatore.getByteTimeDomainData(dati); var s = 0; for (var i = 0; i < dati.length; i++) { var v = (dati[i] - 128) / 128; s += v * v; } try { self.opz.onEnergia(Math.min(1, Math.sqrt(s / dati.length) * 4)); } catch (e) { } raf = (g.requestAnimationFrame || setTimeout)(giro, 16); })();
          src.onended = function () { (g.cancelAnimationFrame || clearTimeout)(raf); cur.sorgente = null; fine(); };
          src.start();
        });
      }, function () { return self._suonaElemento(buf, cur); });
    }
    return this._suonaElemento(buf, cur);
  };
  VoceSpectra.prototype._suonaElemento = function (buf, cur) {
    return new Promise(function (fine, ko) {
      var url = URL.createObjectURL(new Blob([buf], { type: 'audio/mpeg' })), a = new Audio(url); cur.audio = a;
      var chiudi = function () { URL.revokeObjectURL(url); cur.audio = null; };
      a.onended = function () { chiudi(); fine(); }; a.onerror = function () { chiudi(); ko(ErroreVoce('audio', MESSAGGI.audio)); };
      var p = a.play(); if (p && p.catch) p.catch(function (e) { chiudi(); ko(ErroreVoce('audio', MESSAGGI.audio + ' (' + e.message + ')')); });
    });
  };

  /** il ripiego: la voce del sistema, frase per frase (su Android le frasi lunghe a volte tacciono) */
  VoceSpectra.prototype._sistema = function (testo, cur) {
    if (!g.speechSynthesis || !g.SpeechSynthesisUtterance) return Promise.resolve({ ok: false, motore: 'nessuno' });
    var frasi = pezzi(testo, 220), k = 0, lingua = this.opz.lingua === 'en' ? 'en-US' : 'it-IT';
    return new Promise(function (fine) {
      (function via() {
        if (cur.annullato) { fine({ ok: false, annullato: true, motore: 'sistema' }); return; }
        if (k >= frasi.length) { fine({ ok: true, motore: 'sistema' }); return; }
        var u = new SpeechSynthesisUtterance(frasi[k++]); u.lang = lingua; u.rate = 0.9; u.pitch = 0.6; var fatto = false, avanti = function () { if (!fatto) { fatto = true; via(); } };
        u.onend = avanti; u.onerror = avanti; try { speechSynthesis.speak(u); } catch (e) { avanti(); }
      })();
    });
  };

  /* ═══ Voice Design (solo diretta, con la propria chiave) ═════════════════ */
  /**
   * Genera anteprime di una voce da una descrizione. Restituisce [{ generated_voice_id, audio_base_64, … }].
   * Prova l'endpoint attuale (/v1/text-to-voice/design) e, se risponde 404, quello precedente (/create-previews).
   */
  VoceSpectra.prototype.progettaVoce = function (descrizione, testoProva, extra) {
    var o = this.opz, F = o.fetch || g.fetch.bind(g), h = { 'Content-Type': 'application/json', 'xi-api-key': o.apiKey };
    if (!o.apiKey) return Promise.reject(ErroreVoce('configurazione', MESSAGGI.configurazione));
    var corpo = Object.assign({ voice_description: descrizione }, testoProva ? { text: testoProva } : { auto_generate_text: true }, extra || {});
    function leggi(r) { return r.ok ? r.json() : r.text().then(function (t) { throw ErroreVoce(tipoDaStato(r.status), MESSAGGI[tipoDaStato(r.status)] + ' — ' + t.slice(0, 200), r.status); }); }
    return F(API + '/v1/text-to-voice/design', { method: 'POST', headers: h, body: JSON.stringify(corpo) }).then(function (r) {
      if (r.status === 404) return F(API + '/v1/text-to-voice/create-previews', { method: 'POST', headers: h, body: JSON.stringify(corpo) }).then(leggi);
      return leggi(r);
    }).then(function (j) { return j.previews || []; });
  };
  /** salva un'anteprima come voce del proprio account; restituisce il voice_id */
  VoceSpectra.prototype.salvaVoce = function (nome, descrizione, generatedVoiceId) {
    var o = this.opz, F = o.fetch || g.fetch.bind(g), h = { 'Content-Type': 'application/json', 'xi-api-key': o.apiKey }, corpo = JSON.stringify({ voice_name: nome, voice_description: descrizione, generated_voice_id: generatedVoiceId });
    return F(API + '/v1/text-to-voice', { method: 'POST', headers: h, body: corpo }).then(function (r) {
      if (r.status === 404) return F(API + '/v1/text-to-voice/create-voice-from-preview', { method: 'POST', headers: h, body: corpo });
      return r;
    }).then(function (r) { return r.ok ? r.json() : r.text().then(function (t) { throw ErroreVoce(tipoDaStato(r.status), t.slice(0, 200), r.status); }); }).then(function (j) { return j.voice_id; });
  };

  /* ═══ dentro BioSpecInfo: impostazioni salvate sul dispositivo ═══════════ */
  function leggiImpostazioni() {
    var s = {}; try { s = JSON.parse(g.localStorage.getItem(CHIAVE_IMPOSTAZIONI) || '{}') || {}; } catch (e) { }
    var chiave = null; try { var k = JSON.parse(g.localStorage.getItem('bsi_api_keys') || '{}'); chiave = k && k.elevenlabs ? String(k.elevenlabs) : null; } catch (e) { }
    var proxy = ''; try { proxy = g.localStorage.getItem('bsi_proxy_url') || g.BSI_PROXY_URL || ''; } catch (e) { }
    return { attiva: s.attiva !== false, voiceId: s.voiceId || '', preset: PRESET[s.preset] ? s.preset : 'ultron', modelId: MODELLI[s.modelId] ? s.modelId : 'eleven_multilingual_v2', qualita: FORMATI[s.qualita] ? s.qualita : 'mp3_44100_128', viaProxy: !!s.viaProxy, apiKey: chiave, proxy: proxy.replace(/\/+$/, '') };
  }
  function salvaImpostazioni(nuove) {
    var s = {}; try { s = JSON.parse(g.localStorage.getItem(CHIAVE_IMPOSTAZIONI) || '{}') || {}; } catch (e) { }
    Object.keys(nuove || {}).forEach(function (k) { if (k !== 'apiKey') s[k] = nuove[k]; });
    try { g.localStorage.setItem(CHIAVE_IMPOSTAZIONI, JSON.stringify(s)); } catch (e) { }
    if (nuove && 'apiKey' in nuove) { try { var k = JSON.parse(g.localStorage.getItem('bsi_api_keys') || '{}') || {}; if (nuove.apiKey) k.elevenlabs = String(nuove.apiKey).trim(); else delete k.elevenlabs; g.localStorage.setItem('bsi_api_keys', JSON.stringify(k)); } catch (e) { } }
    istanza = null;
  }
  var istanza = null;
  /** la voce dell'app, costruita dalle impostazioni (si ricostruisce quando cambiano) */
  function voceApp() {
    if (istanza) return istanza;
    var s = leggiImpostazioni(), lingua = (g.BSILingue && g.BSILingue.corrente && g.BSILingue.corrente() === 'en') ? 'en' : 'it';
    istanza = new VoceSpectra(s.viaProxy && s.proxy ? { modalita: 'proxy', endpoint: s.proxy + '/voce', preset: s.preset, modelId: s.modelId, outputFormat: s.qualita, lingua: lingua } : { modalita: 'diretta', apiKey: s.apiKey, voiceId: s.voiceId, preset: s.preset, modelId: s.modelId, outputFormat: s.qualita, lingua: lingua });
    istanza.attiva = s.attiva;
    return istanza;
  }
  /** ElevenLabs è la voce di Spectra in questo momento? */
  function attiva() { var v = voceApp(); return !!(v.attiva && v.configurata()); }

  /* ═══ il pannello delle impostazioni (dentro l'app) ═══════════════════════ */
  var FRASE_PROVA = 'Sono Spectra. Ho analizzato i tuoi dati: la risposta era più semplice di quanto pensassi.';
  function apriImpostazioni() {
    var D = g.document; if (!D) return null;
    var vecchio = D.getElementById('bsiEL-pannello'); if (vecchio) vecchio.remove();
    if (!D.getElementById('bsiEL-stile')) { var st = D.createElement('style'); st.id = 'bsiEL-stile';
      st.textContent = '#bsiEL-pannello{position:fixed;inset:0;z-index:2147483600;background:rgba(2,6,14,.72);display:flex;align-items:center;justify-content:center;padding:14px}#bsiEL-pannello .box{width:min(520px,100%);max-height:92vh;overflow:auto;background:#081426;border:1px solid #1d3a5c;border-radius:14px;padding:16px;color:#dfe8f2;font:500 14px/1.5 system-ui,sans-serif}' +
        '#bsiEL-pannello h3{margin:0 0 6px;color:#5fe3d6;font:800 17px system-ui}#bsiEL-pannello label{display:block;margin:10px 0 4px;color:#9fb3c8;font-size:12.5px}#bsiEL-pannello input[type=text],#bsiEL-pannello input[type=password],#bsiEL-pannello select{width:100%;box-sizing:border-box;min-height:40px;border-radius:9px;border:1px solid #2a4a6e;background:#0a1b2e;color:#e6f2ff;padding:6px 10px;font:inherit}' +
        '#bsiEL-pannello .riga{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}#bsiEL-pannello button{min-height:40px;border-radius:9px;border:1px solid #2a4a6e;background:#0a1b2e;color:#e6f2ff;font:600 14px system-ui;padding:6px 14px;cursor:pointer}#bsiEL-pannello button.si{background:#00c9b7;color:#04121c;border-color:#00c9b7}#bsiEL-pannello .stato{margin-top:10px;min-height:20px;color:#ffd24a;font-size:13px}#bsiEL-pannello .nota{color:#9fb3c8;font-size:12px}';
      D.head.appendChild(st); }
    var s = leggiImpostazioni(), P = D.createElement('div'); P.id = 'bsiEL-pannello'; P.setAttribute('role', 'dialog'); P.setAttribute('aria-modal', 'true'); P.setAttribute('aria-label', 'Voce di Spectra con ElevenLabs');
    var opzP = Object.keys(PRESET).map(function (k) { return '<option value="' + k + '"' + (k === s.preset ? ' selected' : '') + '>' + { ultron: 'Fredda e controllata (consigliata)', minaccioso: 'Più lenta e teatrale', chiaro: 'Chiara, per spiegazioni lunghe' }[k] + '</option>'; }).join('');
    var opzM = Object.keys(MODELLI).map(function (k) { return '<option value="' + k + '"' + (k === s.modelId ? ' selected' : '') + '>' + MODELLI[k] + '</option>'; }).join('');
    P.innerHTML = '<div class="box"><h3>🎙️ La voce di Spectra (ElevenLabs)</h3><div class="nota">Una voce progettata su ElevenLabs al posto della sintesi del telefono. La chiave resta solo su questo dispositivo, oppure sul proxy.</div>' +
      '<label><input type="checkbox" id="bsiEL-attiva"' + (s.attiva ? ' checked' : '') + '> Usa la voce ElevenLabs</label>' +
      '<label><input type="checkbox" id="bsiEL-proxy"' + (s.viaProxy ? ' checked' : '') + (s.proxy ? '' : ' disabled') + '> Passa dal proxy (chiave e voce sul server)' + (s.proxy ? '' : ' — nessun proxy configurato') + '</label>' +
      '<label for="bsiEL-chiave">Chiave API ElevenLabs (diretta)</label><input type="password" id="bsiEL-chiave" autocomplete="off" placeholder="' + (s.apiKey ? 'salvata: lasciala vuota per tenerla' : 'sk_…') + '">' +
      '<label for="bsiEL-id">Voice ID (diretta)</label><input type="text" id="bsiEL-id" autocomplete="off" value="' + String(s.voiceId).replace(/"/g, '') + '" placeholder="per esempio 21m00Tcm4TlvDq8ikWAM">' +
      '<label for="bsiEL-stile2">Stile</label><select id="bsiEL-stile2">' + opzP + '</select><label for="bsiEL-modello">Modello</label><select id="bsiEL-modello">' + opzM + '</select>' +
      '<label for="bsiEL-qualita">Qualità audio</label><select id="bsiEL-qualita">' + Object.keys(FORMATI).map(function (k) { return '<option value="' + k + '"' + (k === s.qualita ? ' selected' : '') + '>' + FORMATI[k] + '</option>'; }).join('') + '</select>' +
      '<div class="riga"><button type="button" class="si" id="bsiEL-salva">Salva</button><button type="button" id="bsiEL-prova">🔊 Prova</button><button type="button" id="bsiEL-togli">Rimuovi la chiave</button><button type="button" id="bsiEL-chiudi">Chiudi</button></div><div class="stato" id="bsiEL-stato" aria-live="polite"></div></div>';
    D.body.appendChild(P);
    var $ = function (id) { return D.getElementById(id); }, stato = function (t) { $('bsiEL-stato').textContent = t; };
    function salva() { var c = $('bsiEL-chiave').value.trim(), n = { attiva: $('bsiEL-attiva').checked, viaProxy: $('bsiEL-proxy').checked, voiceId: $('bsiEL-id').value.trim(), preset: $('bsiEL-stile2').value, modelId: $('bsiEL-modello').value, qualita: $('bsiEL-qualita') ? $('bsiEL-qualita').value : undefined }; if (c) n.apiKey = c; salvaImpostazioni(n); $('bsiEL-chiave').value = ''; }
    $('bsiEL-salva').onclick = function () { salva(); stato(attiva() ? 'Salvato: Spectra ora parla con ElevenLabs.' : 'Salvato, ma manca qualcosa: serve la chiave e il Voice ID (o il proxy).'); };
    $('bsiEL-prova').onclick = function () { salva(); var v = voceApp(); v.sblocca(); if (!v.configurata()) { stato(MESSAGGI.configurazione); return; } stato('Sto chiedendo la voce…');
      v.parla(FRASE_PROVA, { interrompi: true, ripiego: false }).then(function (r) { stato(r.ok ? 'Funziona: hai sentito la voce di Spectra.' : r.annullato ? 'Interrotta.' : '⚠ ' + (r.messaggio || r.errore)); }); };
    $('bsiEL-togli').onclick = function () { salvaImpostazioni({ apiKey: '' }); $('bsiEL-chiave').placeholder = 'sk_…'; stato('Chiave rimossa da questo dispositivo.'); };
    $('bsiEL-chiudi').onclick = function () { P.remove(); };
    P.addEventListener('click', function (e) { if (e.target === P) P.remove(); });
    return P;
  }

  g.BSISpectraElevenLabs = { apriImpostazioni: apriImpostazioni, FRASE_PROVA: FRASE_PROVA, VoceSpectra: VoceSpectra, PRESET: PRESET, MODELLI: MODELLI, FORMATI: FORMATI, LIMITI: LIMITI, impostazioniVoce: impostazioniVoce, pezzi: pezzi, pulisci: pulisci, leggiImpostazioni: leggiImpostazioni, salvaImpostazioni: salvaImpostazioni, voce: voceApp, attiva: attiva, MESSAGGI: MESSAGGI };
  if (typeof module !== 'undefined' && module.exports) module.exports = g.BSISpectraElevenLabs;
})(typeof window !== 'undefined' ? window : globalThis);
