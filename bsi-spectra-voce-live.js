/* ═══════════════════════════════════════════════════════════════════════
   bsi-spectra-voce-live.js — 🎙️ Spectra Prime: voce full-duplex (v267)
   BioSpecInfo · © Samuele Pio Provenzano

   Un assistente vocale a bassa latenza, collegato al BioSpec Quantum Studio
   (window.SPECTRA_3D_BRIDGE): si parla e Spectra risponde a voce mentre
   pilota il laboratorio 3D. Tutto in locale, senza moduli ES né CDN.

   · PIPELINE AUDIO: microfono 16 kHz mono (con cancellazione d'eco,
     soppressione del rumore e guadagno automatico) catturato da un
     AudioWorklet creato al volo (Blob, zero file in più) che converte in
     PCM Int16 e misura l'energia RMS; se l'AudioWorklet non c'è, ripiega
     su ScriptProcessor. L'audio in arrivo (PCM 24 kHz) si riproduce con
     scheduling continuo (nextPlayTime) senza click né buchi.
   · BARGE-IN: appena l'utente parla sopra la voce (RMS oltre la soglia
     VAD, adattiva), tronca subito l'audio in uscita, azzera la coda e
     avvisa il modello: nessuna sovrapposizione.
   · CONTROLLO 3D A VOCE: espone al modello tre strumenti
     (apri_sezione, imposta_parametro, cambia_vista) che pilotano le 13
     aree del Quantum Studio tramite il ponte.
   · HUD OLOGRAFICO: un orb che pulsa con lo spettro (60 fps), lo stato
     (STANDBY, ASCOLTO, PENSA, PARLA, BARGE-IN), interruttori per barge-in,
     soglia VAD, voce, mani libere / premi-per-parlare e il registro dei
     comandi 3D eseguiti.
   · RETE: WebSocket all'API «Live» (diretta con la chiave dell'utente, o
     meglio tramite il proxy se configurato), con riconnessione automatica
     a tentativi crescenti.

   SICUREZZA: la chiave è solo quella salvata dall'utente su questo
   dispositivo (bsi_api_keys), e con il proxy non viaggia affatto. In
   modalità diretta la chiave resta nel browser dell'utente (come per gli
   altri fornitori). Nessuna chiave è scritta nel codice.
   ═══════════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  var D = g.document, F = g.BSIFisica;
  function t(it, en) { return (g.BSILingue && g.BSILingue.corrente && g.BSILingue.corrente() === 'en') ? en : it; }

  /* ═══ 1 · strumenti puri (verificabili senza browser) ═══════════════════ */
  function floatToInt16(f32) { var n = f32.length, o = new Int16Array(n); for (var i = 0; i < n; i++) { var s = Math.max(-1, Math.min(1, f32[i])); o[i] = s < 0 ? s * 0x8000 : s * 0x7FFF; } return o; }
  function int16ToFloat(i16) { var n = i16.length, o = new Float32Array(n); for (var i = 0; i < n; i++) o[i] = i16[i] / 32768; return o; }
  function rms(f32) { var s = 0, n = f32.length; for (var i = 0; i < n; i++) s += f32[i] * f32[i]; return Math.sqrt(s / (n || 1)); }
  function abToB64(buf) { var b = new Uint8Array(buf), s = '', step = 0x8000; for (var i = 0; i < b.length; i += step) s += String.fromCharCode.apply(null, b.subarray(i, i + step)); return g.btoa ? g.btoa(s) : Buffer.from(s, 'binary').toString('base64'); }
  function b64ToAb(b64) { var bin = g.atob ? g.atob(b64) : Buffer.from(b64, 'base64').toString('binary'), n = bin.length, u = new Uint8Array(n); for (var i = 0; i < n; i++) u[i] = bin.charCodeAt(i); return u.buffer; }
  /** il codice dell'AudioWorklet, come stringa: converte Float32 → Int16 e misura l'RMS */
  function codiceWorklet() {
    return 'class PCM16 extends AudioWorkletProcessor{process(e){var i=e[0];if(i&&i[0]){var f=i[0],n=f.length,o=new Int16Array(n),s=0;for(var k=0;k<n;k++){var x=Math.max(-1,Math.min(1,f[k]));s+=x*x;o[k]=x<0?x*0x8000:x*0x7FFF;}this.port.postMessage({pcm:o.buffer,rms:Math.sqrt(s/n)},[o.buffer]);}return true;}}registerProcessor("bsi-pcm16",PCM16);';
  }

  /* ═══ 2 · le aree e gli strumenti vocali ════════════════════════════════ */
  /* i nomi della proposta originale → le aree reali del Quantum Studio */
  var ALIAS = { biologia_molecolare: 'biomol', chimica_computazionale: 'insilico', biofisica_membrana: 'biofisica', spazi_iperdimensionali: 'quantistica', termodinamica_cinetica: 'termodinamica', laboratorio_3d: 'laboratorio', spettroscopia: 'spettroscopia', datascience: 'datascience' };
  function areeValide() { try { return g.BSIQuantumDati ? g.BSIQuantumDati.AREE.map(function (a) { return a.id; }) : []; } catch (e) { return []; } }
  function moduliValidi() { try { return g.BSIQuantumDati ? g.BSIQuantumDati.moduli().map(function (m) { return m.id; }) : []; } catch (e) { return []; } }
  /** risolve una chiave (area, alias o id di modulo) in {area, modulo?} per il ponte */
  function mapSezione(chiave) {
    if (!chiave) return null; chiave = String(chiave);
    if (moduliValidi().indexOf(chiave) >= 0) return { modulo: chiave };
    var a = ALIAS[chiave] || chiave;
    if (areeValide().indexOf(a) >= 0) return { area: a };
    /* per parola chiave: cerca nel titolo o nel nome dell'area */
    try { var low = chiave.toLowerCase(), m = g.BSIQuantumDati.moduli().filter(function (x) { return F.tt(x.titolo).toLowerCase().indexOf(low) >= 0; })[0]; if (m) return { modulo: m.id }; } catch (e) { }
    return null;
  }
  /** assembled/cutaway/exploded → una rappresentazione del modulo attivo */
  function mapVista(mode, rappr) {
    rappr = rappr || ['atomi']; var ha = function (r) { return rappr.indexOf(r) >= 0; };
    if (mode === 'cutaway') return ha('schema') ? 'schema' : ha('densita') ? 'densita' : rappr[0];
    if (mode === 'exploded') return ha('proiezione') ? 'proiezione' : ha('orbitale') ? 'orbitale' : rappr[rappr.length - 1];
    return ha('atomi') ? 'atomi' : ha('densita') ? 'densita' : rappr[0];   /* assembled */
  }
  var STRUMENTI = [
    { name: 'apri_sezione', description: 'Apre una delle 13 aree scientifiche del Quantum Studio (o un modulo preciso) e la mostra in 3D.', parameters: { type: 'object', properties: { sezione: { type: 'string', description: 'id dell\'area (biochimica, chimica, organica, spettroscopia, farmacologia, datascience, biomol, tossicologia, laboratorio, insilico, biofisica, quantistica, termodinamica) o di un modulo (es. bio_atp, qm_qubit, hyper_ncubo).' }, modulo: { type: 'integer', description: 'indice del modulo nell\'area (0 di default).' } }, required: ['sezione'] } },
    { name: 'imposta_parametro', description: 'Cambia in tempo reale un parametro della simulazione attiva (es. drive, uncoupler, substrate, inhibitor, b0, logDose, dimN, focalD, tempK, kOut, naCond, rabi, detuning).', parameters: { type: 'object', properties: { chiave: { type: 'string' }, valore: { type: 'number' } }, required: ['chiave', 'valore'] } },
    { name: 'cambia_vista', description: 'Cambia la rappresentazione del modello (assembled = intero/atomi, cutaway = schema/densità, exploded = proiezione) ed eventualmente mette in pausa o riavvia.', parameters: { type: 'object', properties: { modo: { type: 'string', enum: ['assembled', 'cutaway', 'exploded'] }, pausa: { type: 'boolean' } }, required: ['modo'] } },
    { name: 'inorganica', description: 'Apre il risolutore di Inorganica quantistica e calcola: scheda slater (regole di Slater per un elemento, con elemento: B, C, N, O, F, Na, Si, P, S, Cl, Se, Br, I, Xe), huckel (sistema π, con sistema: allile, ciclopropenile, butadiene, ciclobutadiene, benzene, LiH), salc (molecola ipervalente, con molecola: XeOF4, IOF5, XeF4, SF4, BrF3, SO2, SO3, I3, e soglia ΔE in eV), complessi (con complesso: FeCl4-, MnF6-4, IrCl6-2, Ni(NH3)6-2, Ni(CN)4-2, Pd(CN)4-2, Ni(CO)4, Ag(CN)2-).', parameters: { type: 'object', properties: { scheda: { type: 'string', enum: ['slater', 'huckel', 'salc', 'complessi'] }, elemento: { type: 'string' }, sistema: { type: 'string' }, molecola: { type: 'string' }, complesso: { type: 'string' }, soglia: { type: 'number' } }, required: ['scheda'] } }
  ];
  /* nel formato «function calling» di Gemini Live */
  function strumentiGemini() { return [{ functionDeclarations: STRUMENTI.map(function (s) { return { name: s.name, description: s.description, parameters: maiuscolo(s.parameters) }; }) }]; }
  function maiuscolo(sch) { if (!sch || typeof sch !== 'object') return sch; var o = {}; Object.keys(sch).forEach(function (k) { var v = sch[k]; if (k === 'type' && typeof v === 'string') o[k] = v.toUpperCase(); else if (k === 'properties') { o[k] = {}; Object.keys(v).forEach(function (p) { o[k][p] = maiuscolo(v[p]); }); } else o[k] = v; }); return o; }
  var PROMPT = 'Sei Spectra Prime, l\'intelligenza scientifica vocale di BioSpecInfo. Parli in modo naturale, chiaro e conciso, con ritmo da conversazione: niente elenchi lunghissimi né simboli illeggibili ad alta voce (pronuncia «ATP sintasi», «NADH», «delta G»). Quando l\'utente chiede di vedere, esplorare, modificare o simulare qualcosa (per esempio «mostrami l\'ATP sintasi», «aumenta il disaccoppiante al settanta per cento», «fammi vedere un tesseratto a sei dimensioni», «apri il qubit»), chiama SUBITO apri_sezione, imposta_parametro o cambia_vista mentre spieghi ciò che appare sul modello 3D. Rispondi breve e incisivo, poi approfondisci se te lo chiedono. Rispondi nella stessa lingua dell\'utente.';

  /* ═══ 3 · il motore ═════════════════════════════════════════════════════ */
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function Motore(opz) {
    opz = opz || {};
    this.opz = opz;
    this.mountId = opz.mountId || 'bsiVL-hud';
    this.WS = opz.WebSocket || g.WebSocket;
    this.AC = opz.AudioContext || g.AudioContext || g.webkitAudioContext;
    this.getUserMedia = opz.getUserMedia || (g.navigator && g.navigator.mediaDevices && g.navigator.mediaDevices.getUserMedia.bind(g.navigator.mediaDevices));
    this.model = opz.model || this._modelloSalvato();
    this.voce = opz.voce || 'Aoede';
    this.s = { stato: 'standby', connesso: false, ascolta: false, parla: false, bargeIn: true, maniLibere: true, soglia: 0.028, micLivello: 0, aiLivello: 0, tentativi: 0, risvegli: 0, comandi: 0 };
    this.coda = new Set(); this.prossimo = 0; this.vivo = true; this.log = [];
    if (!opz.noHUD) this._hud();
    if (!opz.noVisual) this._visualizza();
  }
  Motore.prototype._modelloSalvato = function () { try { return g.localStorage.getItem('bsi-voce-live-modello') || 'gemini-live-2.5'; } catch (e) { return 'gemini-live-2.5'; } };
  Motore.prototype._chiave = function () { if (this.opz.apiKey) return this.opz.apiKey; try { var k = JSON.parse(g.localStorage.getItem('bsi_api_keys') || '{}'); return k.gemini || k.google || ''; } catch (e) { return ''; } };
  Motore.prototype._endpoint = function () {
    if (this.opz.wsUrl) return this.opz.wsUrl;
    try { var px = g.localStorage.getItem('bsi_proxy_url') || g.BSI_PROXY_URL; if (px) return px.replace(/^http/, 'ws').replace(/\/+$/, '') + '/live'; } catch (e) { }
    var k = this._chiave();
    return 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent' + (k ? '?key=' + encodeURIComponent(k) : '');
  };

  /* ── HUD ── */
  Motore.prototype._hud = function () {
    var self = this, c = D.getElementById(this.mountId); if (!c) { c = D.createElement('div'); c.id = this.mountId; (D.body || D.documentElement).appendChild(c); }
    stile();
    c.innerHTML = '<div class="bsiVL">' +
      '<div class="bsiVL-top"><canvas class="bsiVL-orb" width="72" height="72" aria-hidden="true"></canvas>' +
      '<div class="bsiVL-tit"><span class="bsiVL-nome">SPECTRA PRIME</span><span class="bsiVL-pill" role="status">' + t('STANDBY', 'STANDBY') + '</span>' +
      '<div class="bsiVL-sub">' + t('Voce full-duplex · ponte 3D attivo', 'Full-duplex voice · 3D bridge active') + '</div></div>' +
      '<div class="bsiVL-az"><button type="button" class="bsiVL-conn">' + t('🎙 Attiva voce', '🎙 Start voice') + '</button><button type="button" class="bsiVL-mute" disabled>Mic ON</button></div></div>' +
      '<div class="bsiVL-ctrl">' +
      '<label><input type="checkbox" class="bsiVL-barge" checked> ' + t('Barge-in (interrompi parlando)', 'Barge-in (interrupt by speaking)') + '</label>' +
      '<label>' + t('Soglia VAD', 'VAD threshold') + ' <input type="range" class="bsiVL-vad" min="5" max="80" value="28"></label>' +
      '<label>' + t('Modo', 'Mode') + ' <select class="bsiVL-ptt"><option value="libere">' + t('Mani libere', 'Hands-free') + '</option><option value="premi">' + t('Premi per parlare', 'Push-to-talk') + '</option></select></label>' +
      '<label><input type="checkbox" class="bsiVL-wake"> ' + t('Attiva dicendo «Spectra»', 'Wake on «Spectra»') + '</label>' +
      '<label>' + t('Voce', 'Voice') + ' <select class="bsiVL-voce"><option value="Aoede">Aoede</option><option value="Kore">Kore</option><option value="Puck">Puck</option><option value="Charon">Charon</option></select></label>' +
      '</div>' +
      '<div class="bsiVL-log" aria-live="polite"><div style="color:#64748b">[' + t('Sistema', 'System') + '] ' + t('Pronto. «Attiva voce» per parlare e pilotare il laboratorio 3D.', 'Ready. «Start voice» to talk and drive the 3D lab.') + '</div></div>' +
      '<div class="bsiFX-nota" style="margin-top:8px">' + t('Serve una chiave di un fornitore con API vocale «Live» (salvata su questo dispositivo in Spectra → chiavi) oppure un proxy. In modalità diretta la chiave resta nel tuo browser. La parola di attivazione è una soglia d\'energia locale, non un riconoscitore: parla e Spectra ascolta.', 'Needs a provider key with a «Live» voice API (saved on this device in Spectra → keys) or a proxy. In direct mode the key stays in your browser. The wake word is a local energy gate, not a recogniser: speak and Spectra listens.') + '</div></div>';
    this.orb = c.querySelector('.bsiVL-orb'); this.orbCtx = this.orb.getContext('2d'); this.pill = c.querySelector('.bsiVL-pill'); this.logEl = c.querySelector('.bsiVL-log');
    var q = function (s) { return c.querySelector(s); };
    q('.bsiVL-conn').addEventListener('click', function () { if (self.s.connesso) self.disconnetti(); else self.connetti(); });
    this.muteBtn = q('.bsiVL-mute'); this.muteBtn.addEventListener('click', function () { self.s.ascolta = !self.s.ascolta; this.textContent = self.s.ascolta ? 'Mic ON' : 'Mic MUTO'; this.style.borderColor = self.s.ascolta ? '#38bdf8' : '#f43f5e'; });
    q('.bsiVL-barge').addEventListener('change', function () { self.s.bargeIn = this.checked; });
    q('.bsiVL-vad').addEventListener('input', function () { self.s.soglia = +this.value / 1000; });
    q('.bsiVL-ptt').addEventListener('change', function () { self.s.maniLibere = this.value === 'libere'; });
    q('.bsiVL-wake').addEventListener('change', function () { self.s.wake = this.checked; });
    q('.bsiVL-voce').addEventListener('change', function () { self.voce = this.value; });
    this.connBtn = q('.bsiVL-conn');
  };
  Motore.prototype._nota = function (tag, msg, col) { this.log.push({ tag: tag, msg: msg }); if (!this.logEl) return; var r = D.createElement('div'); r.innerHTML = '<span style="color:' + (col || '#38bdf8') + ';font-weight:700">[' + tag + ']</span> ' + msg; this.logEl.appendChild(r); this.logEl.scrollTop = this.logEl.scrollHeight; while (this.logEl.children.length > 60) this.logEl.removeChild(this.logEl.firstChild); };
  Motore.prototype._stato = function (txt, col) { this.s.stato = txt; if (this.pill) { this.pill.textContent = txt; this.pill.style.background = col || '#1e293b'; this.pill.style.color = '#fff'; } };

  /* ── connessione ── */
  Motore.prototype.connetti = function () {
    var self = this;
    this._stato(t('CONNESSIONE…', 'CONNECTING…'), '#d97706');
    return Promise.resolve(this.opz.noAudio ? null : this._initAudio()).then(function () {
      if (!self.WS) { self._nota('Rete', t('WebSocket non disponibile.', 'WebSocket not available.'), '#f87171'); self._stato(t('NON DISPONIBILE', 'UNAVAILABLE'), '#be123c'); return; }
      var ws = self.ws = new self.WS(self._endpoint());
      ws.onopen = function () {
        self.s.connesso = true; self.s.ascolta = true; self.s.tentativi = 0;
        if (self.connBtn) { self.connBtn.textContent = t('Disconnetti', 'Disconnect'); self.connBtn.style.background = '#be123c'; }
        if (self.muteBtn) self.muteBtn.disabled = false;
        self._stato(t('IN ASCOLTO', 'LISTENING'), '#0284c7'); self._nota('Live', t('Canale full-duplex connesso.', 'Full-duplex channel connected.'), '#4ade80');
        try { ws.send(JSON.stringify(self._setup())); } catch (e) { }
      };
      ws.onmessage = function (ev) { var d = ev.data; if (d && d.text && typeof d.text === 'function') { d.text().then(function (s) { self._messaggio(s); }); } else self._messaggio(d); };
      ws.onerror = function () { self._nota('Errore', t('Errore di rete sul canale vocale.', 'Network error on the voice channel.'), '#f87171'); };
      ws.onclose = function () { var era = self.s.connesso; self.disconnetti(false); if (era && self.s.tentativi < 3) { self.s.tentativi++; self._nota(t('Riconnessione', 'Reconnect'), t('Tentativo ', 'Attempt ') + self.s.tentativi + '/3…', '#fbbf24'); self._timerRic = setTimeout(function () { if (self.vivo) self.connetti(); }, self.backoff(self.s.tentativi)); } };
      return ws;
    }).catch(function (e) { self._stato(t('ERRORE MIC', 'MIC ERROR'), '#be123c'); self._nota(t('Audio', 'Audio'), e.message || String(e), '#f87171'); });
  };
  Motore.prototype.backoff = function (n) { return 1200 * n; };
  Motore.prototype._setup = function () {
    return { setup: { model: this.model.indexOf('/') >= 0 ? this.model : ('models/' + this.model), generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: this.voce } } } }, systemInstruction: { parts: [{ text: PROMPT }] }, tools: strumentiGemini() } };
  };
  Motore.prototype.disconnetti = function (reset) {
    this.s.connesso = false; this.s.ascolta = false; this.fermaRiproduzione();
    if (this.ws) { try { this.ws.close(); } catch (e) { } this.ws = null; }
    if (this.worklet) { try { this.worklet.disconnect(); } catch (e) { } this.worklet = null; }
    if (this.micStream) { try { this.micStream.getTracks().forEach(function (x) { x.stop(); }); } catch (e) { } this.micStream = null; }
    if (reset !== false) { if (this.connBtn) { this.connBtn.textContent = t('🎙 Attiva voce', '🎙 Start voice'); this.connBtn.style.background = '#0284c7'; } if (this.muteBtn) this.muteBtn.disabled = true; this._stato(t('STANDBY', 'STANDBY'), '#1e293b'); }
  };
  Motore.prototype.distruggi = function () { this.vivo = false; clearTimeout(this._timerRic); this.disconnetti(true); try { if (this.acIn) this.acIn.close(); if (this.acOut) this.acOut.close(); } catch (e) { } };

  /* ── audio ── */
  Motore.prototype._initAudio = function () {
    var self = this; if (!this.AC || !this.getUserMedia) return Promise.reject(new Error(t('Microfono o audio non disponibili.', 'Microphone or audio not available.')));
    this.acIn = new this.AC({ sampleRate: 16000 });
    return this.getUserMedia({ audio: { channelCount: 1, sampleRate: 16000, echoCancellation: true, noiseSuppression: true, autoGainControl: true } }).then(function (stream) {
      self.micStream = stream; var src = self.acIn.createMediaStreamSource(stream);
      self.analyserIn = self.acIn.createAnalyser(); self.analyserIn.fftSize = 256; src.connect(self.analyserIn);
      function collega(nodo, prendi) { self.worklet = nodo; prendi(nodo); src.connect(nodo); try { nodo.connect(self.acIn.destination); } catch (e) { } }
      function onDati(pcm, livello) { self.s.micLivello = livello;
        if (self.s.bargeIn && self.s.parla && livello > self.s.soglia) { self.fermaRiproduzione(); self._stato(t('BARGE-IN · ASCOLTO', 'BARGE-IN · LISTENING'), '#0284c7'); try { self.ws && self.ws.send(JSON.stringify({ realtimeInput: { activityStart: {} } })); } catch (e) { } }
        var cancello = self.s.maniLibere ? true : (self.s.premuto === true);
        if (self.s.wake && !self._sveglio) { if (livello > self.s.soglia) { self._sveglio = true; self.s.risvegli++; self._stato(t('IN ASCOLTO', 'LISTENING'), '#0284c7'); } else cancello = false; }
        if (cancello && self.s.connesso && self.s.ascolta && self.ws && self.ws.readyState === 1) {
          try { self.ws.send(JSON.stringify({ realtimeInput: { mediaChunks: [{ mimeType: 'audio/pcm;rate=16000', data: abToB64(pcm) }] } })); } catch (e) { }
        }
      }
      if (self.acIn.audioWorklet && g.AudioWorkletNode) {
        var url = URL.createObjectURL(new Blob([codiceWorklet()], { type: 'application/javascript' }));
        return self.acIn.audioWorklet.addModule(url).then(function () {
          var nodo = new g.AudioWorkletNode(self.acIn, 'bsi-pcm16'); nodo.port.onmessage = function (e) { onDati(e.data.pcm, e.data.rms); };
          collega(nodo, function () { }); try { URL.revokeObjectURL(url); } catch (e) { }
        });
      }
      /* ripiego: ScriptProcessor */
      var sp = self.acIn.createScriptProcessor ? self.acIn.createScriptProcessor(2048, 1, 1) : null;
      if (sp) { sp.onaudioprocess = function (ev) { var f = ev.inputBuffer.getChannelData(0); onDati(floatToInt16(f).buffer, rms(f)); }; collega(sp, function () { }); }
    }).then(function () {
      self.acOut = new self.AC({ sampleRate: 24000 }); self.analyserOut = self.acOut.createAnalyser(); self.analyserOut.fftSize = 256; self.analyserOut.connect(self.acOut.destination); self.prossimo = self.acOut.currentTime;
    });
  };
  Motore.prototype.fermaRiproduzione = function () { this.coda.forEach(function (s) { try { s.stop(); } catch (e) { } }); this.coda.clear(); if (this.acOut) this.prossimo = this.acOut.currentTime; this.s.parla = false; };
  Motore.prototype._suona = function (b64) {
    if (!this.acOut) return; if (this.acOut.state === 'suspended') try { this.acOut.resume(); } catch (e) { }
    var f32 = int16ToFloat(new Int16Array(b64ToAb(b64))), buf = this.acOut.createBuffer(1, f32.length, 24000); buf.copyToChannel(f32, 0);
    var src = this.acOut.createBufferSource(); src.buffer = buf; src.connect(this.analyserOut);
    var quando = Math.max(this.acOut.currentTime, this.prossimo); src.start(quando); this.prossimo = quando + buf.duration;
    this.s.parla = true; this._stato(t('SPECTRA PARLA', 'SPECTRA SPEAKS'), '#7c3aed'); this.coda.add(src);
    var self = this; src.onended = function () { self.coda.delete(src); if (!self.coda.size) { self.s.parla = false; if (self.s.connesso) self._stato(t('IN ASCOLTO', 'LISTENING'), '#0284c7'); } };
  };

  /* ── messaggi dal server e strumenti ── */
  Motore.prototype._messaggio = function (raw) {
    var msg; try { msg = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch (e) { return; }
    if (msg.serverContent) {
      if (msg.serverContent.interrupted) { this.fermaRiproduzione(); return; }
      var parti = (msg.serverContent.modelTurn && msg.serverContent.modelTurn.parts) || [];
      for (var i = 0; i < parti.length; i++) { var p = parti[i];
        if (p.inlineData && /^audio\/pcm/.test(p.inlineData.mimeType || '')) this._suona(p.inlineData.data);
        if (p.text) this._nota('Spectra', p.text, '#a78bfa');
      }
    }
    if (msg.toolCall && msg.toolCall.functionCalls) {
      var self = this, risposte = msg.toolCall.functionCalls.map(function (c) { return { id: c.id, name: c.name, response: { result: self.eseguiStrumento(c.name, c.args || {}) } }; });
      try { this.ws && this.ws.send(JSON.stringify({ toolResponse: { functionResponses: risposte } })); } catch (e) { }
    }
  };
  Motore.prototype.eseguiStrumento = function (nome, args) {
    var B = g.SPECTRA_3D_BRIDGE; this.s.comandi++;
    if (nome === 'apri_sezione' || nome === 'biospec_open_section') {
      var k = args.sezione || args.sectionKey, m = mapSezione(k), i = args.modulo != null ? args.modulo : (args.moduleIndex || 0);
      if (!m) { this._nota('3D', t('Sezione sconosciuta: ', 'Unknown section: ') + k, '#f87171'); return { status: 'sezione_sconosciuta', sezione: k }; }
      if (B) { if (m.modulo) B.apri(m.modulo); else B.openSection(m.area, i); }
      this._nota('3D', t('Apro ', 'Opening ') + (m.modulo || m.area), '#34d399'); return { status: 'ok', aperto: m.modulo || m.area };
    }
    if (nome === 'imposta_parametro' || nome === 'biospec_set_parameter') {
      var ch = args.chiave || args.key, v = args.valore != null ? args.valore : args.value;
      if (B && B.imposta) B.imposta(ch, +v); this._nota('3D', ch + ' = ' + v, '#fbbf24'); return { status: 'ok', chiave: ch, valore: +v };
    }
    if (nome === 'cambia_vista' || nome === 'biospec_set_view_mode') {
      var modo = args.modo || args.mode, st = B && B.stato && B.stato(); var rappr = this.opz.rappr || ['atomi', 'densita', 'schema'];
      try { var cur = g.BSIQuantumDati && st && st.modulo && g.BSIQuantumDati.perId(st.modulo); if (cur) rappr = cur.modulo.rappr || rappr; } catch (e) { }
      if (B && B.rappresentazione) B.rappresentazione(mapVista(modo, rappr));
      if (B && B.pausa && typeof args.pausa === 'boolean') B.pausa(args.pausa);
      this._nota('3D', t('Vista ', 'View ') + modo, '#38bdf8'); return { status: 'ok', vista: modo };
    }
    if (nome === 'inorganica') {
      var T2 = (g.BSI_AI_TOOLS || []).filter(function (x) { return x.name === 'inorganica_quantica'; })[0];
      if (T2) { try { T2.execute(args); } catch (e) { } this._nota('⚗️', (args.scheda || '') + ' ' + (args.elemento || args.sistema || args.molecola || args.complesso || ''), '#f5c451'); return { status: 'ok', scheda: args.scheda }; }
      return { status: 'non_disponibile' };
    }
    return { status: 'strumento_sconosciuto' };
  };

  /* ── orb olografico (60 fps) ── */
  Motore.prototype._visualizza = function () {
    var self = this, freq = new Uint8Array(128);
    (function giro(tm) {
      if (!self.vivo) return; g.requestAnimationFrame ? g.requestAnimationFrame(giro) : 0; var ctx = self.orbCtx; if (!ctx) return;
      var e = self.s.micLivello * 4.5;
      if (self.s.parla && self.analyserOut) { self.analyserOut.getByteFrequencyData(freq); var s = 0; for (var i = 0; i < 32; i++) s += freq[i]; e = Math.max(e, s / 32 / 140); }
      self.s.aiLivello = e; ctx.clearRect(0, 0, 72, 72); var cx = 36, cy = 36, R = 15 + Math.min(13, e * 15);
      var gr = ctx.createRadialGradient(cx, cy, 2, cx, cy, R + 12);
      if (self.s.parla) { gr.addColorStop(0, '#e9d5ff'); gr.addColorStop(0.5, '#8b5cf6'); gr.addColorStop(1, 'rgba(139,92,246,0)'); }
      else if (self.s.connesso) { gr.addColorStop(0, '#e0f2fe'); gr.addColorStop(0.5, '#0ea5e9'); gr.addColorStop(1, 'rgba(14,165,233,0)'); }
      else { gr.addColorStop(0, '#94a3b8'); gr.addColorStop(1, 'rgba(30,41,59,0)'); }
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cx, cy, R + 9, 0, 2 * Math.PI); ctx.fill();
      ctx.strokeStyle = self.s.parla ? '#c084fc' : '#38bdf8'; ctx.lineWidth = 1.7; ctx.beginPath();
      for (var a = 0; a <= 2 * Math.PI + 0.1; a += 0.2) { var r = R + Math.sin(a * 4 + tm * 0.006) * (2 + e * 5), x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; if (a === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
      ctx.stroke();
    })(0);
  };

  /* ═══ stile ═════════════════════════════════════════════════════════════ */
  function stile() {
    if (D.getElementById('bsiVL-stile')) return; var s = D.createElement('style'); s.id = 'bsiVL-stile';
    s.textContent = '.bsiVL{background:linear-gradient(145deg,#060b16,#0b1324);border:1px solid #1e293b;border-radius:16px;padding:14px 16px;color:#f8fafc;font-family:system-ui,sans-serif;display:flex;flex-direction:column;gap:12px}' +
      '.bsiVL-top{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}.bsiVL-orb{width:72px;height:72px;border-radius:50%;background:#030712;border:1px solid #38bdf8;flex:none}' +
      '.bsiVL-tit{flex:1;min-width:150px}.bsiVL-nome{font-weight:800;font-size:15px;letter-spacing:.03em;color:#38bdf8}.bsiVL-pill{margin-left:8px;font-size:10px;font-weight:700;padding:2px 8px;border-radius:99px;background:#1e293b;color:#94a3b8}.bsiVL-sub{font-size:12px;color:#94a3b8;margin-top:3px}' +
      '.bsiVL-az{display:flex;gap:8px}.bsiVL-az button,.bsiVL-conn{min-height:40px;padding:8px 15px;border-radius:10px;border:1px solid #38bdf8;background:#0284c7;color:#fff;font-weight:700;font-size:12.5px;cursor:pointer}.bsiVL-mute{border-color:#334155;background:#0f172a;color:#cbd5e1;font-weight:600}' +
      '.bsiVL-ctrl{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px 12px;background:#050914;padding:10px 12px;border-radius:10px;border:1px solid #1e293b;font-size:11.5px;color:#cbd5e1}.bsiVL-ctrl label{display:flex;align-items:center;gap:6px}.bsiVL-ctrl input[type=range]{flex:1;accent-color:#38bdf8}.bsiVL-ctrl select{background:#0f172a;color:#f8fafc;border:1px solid #334155;border-radius:6px;padding:3px 6px;min-height:32px}.bsiVL-ctrl input[type=checkbox]{accent-color:#38bdf8}' +
      '.bsiVL-log{max-height:120px;overflow-y:auto;background:#04070f;border:1px solid #1e293b;border-radius:8px;padding:8px 10px;font-family:ui-monospace,Menlo,monospace;font-size:11.5px;color:#cbd5e1;line-height:1.5}';
    D.head.appendChild(s);
  }

  /* ═══ la sezione ════════════════════════════════════════════════════════ */
  if (F && F.sezione) {
    F.sezione('svocelive', {
      titolo: ['🎙️ Spectra Prime — voce dal vivo', '🎙️ Spectra Prime — live voice'],
      sotto: ['Parla e Spectra ti risponde a voce mentre pilota il Quantum Studio in 3D: «apri l\'ATP sintasi», «porta il disaccoppiante al settanta per cento», «mostrami un tesseratto a sei dimensioni». Conversazione full-duplex: puoi interromperla in qualsiasi momento (barge-in). Serve una chiave con API vocale «Live» salvata su questo dispositivo, o un proxy.', 'Speak and Spectra answers aloud while driving the Quantum Studio in 3D: «open ATP synthase», «raise the uncoupler to seventy percent», «show me a six-dimensional tesseract». Full-duplex conversation: interrupt it anytime (barge-in). Needs a provider key with a «Live» voice API saved on this device, or a proxy.'],
      schede: [{ nome: ['🎙️ La console', '🎙️ The console'], costruisci: function (div) {
        if (div._vl) try { div._vl.distruggi(); } catch (e) { }
        var mount = F.el('div', { id: 'bsiVL-hud-' + Math.random().toString(36).slice(2, 8) }); div.appendChild(mount);
        try { div._vl = new Motore({ mountId: mount.id }); } catch (e) { mount.textContent = '⚠ ' + (e && e.message || e); }
        var g2 = g.BSISpectraVoceLive; if (g2) g2._istanza = div._vl;
      } }]
    });
  }

  /* ═══ lo strumento per Spectra (apre la console) ════════════════════════ */
  var STRUMENTO = { name: 'voce_dal_vivo', description: 'Apre la console vocale full-duplex «Spectra Prime — voce dal vivo», con cui l\'utente parla e Spectra risponde a voce pilotando il Quantum Studio in 3D. Usalo quando l\'utente chiede di «parlare con Spectra», «attivare la voce dal vivo» o «la conversazione vocale».',
    parameters: { type: 'object', properties: {}, required: [] },
    execute: function () { if (typeof g.goSection === 'function') g.goSection('svocelive'); return Promise.resolve({ ok: true, aperto: 'svocelive' }); } };
  function registra() { var Ts = g.BSI_AI_TOOLS; if (!Ts || !Ts.push) return false; if (!Ts.some(function (x) { return x.name === STRUMENTO.name; })) Ts.push(STRUMENTO); return true; }
  if (!registra()) { var kk = 0, ti = setInterval(function () { if (registra() || ++kk > 40) clearInterval(ti); }, 500); }

  g.BSISpectraVoceLive = { Motore: Motore, STRUMENTI: STRUMENTI, strumentiGemini: strumentiGemini, PROMPT: PROMPT, ALIAS: ALIAS, mapSezione: mapSezione, mapVista: mapVista, codiceWorklet: codiceWorklet,
    util: { floatToInt16: floatToInt16, int16ToFloat: int16ToFloat, rms: rms, abToB64: abToB64, b64ToAb: b64ToAb, clamp: clamp },
    _istanza: null, apri: function (opz) { if (!this._istanza) this._istanza = new Motore(opz || {}); if (typeof g.goSection === 'function') g.goSection('svocelive'); return this._istanza; } };
})(typeof window !== 'undefined' ? window : globalThis);
