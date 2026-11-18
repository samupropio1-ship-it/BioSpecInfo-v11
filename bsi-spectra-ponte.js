/* ═══════════════════════════════════════════════════════════════════════
   bsi-spectra-ponte.js — il ponte WebSocket fra BioSpecInfo e Spectra Prime (v257)
   BioSpecInfo · © Samuele Pio Provenzano

   PERCHE' ESISTE
   Spectra Prime (spectra_core/, FastAPI + LangGraph, sette agenti) deve «vedere»
   la scena 3D aperta e poterla comandare. Questo modulo è il lato browser del
   WebSocket /ws/spectra/{sessione}:
   · manda la TELEMETRIA della scena (sezione, scheda, camera, cursori, caselle),
     ogni mezzo secondo ma solo quando cambia (più un battito ogni 5 s);
   · esegue i comandi SPECTRA_3D_BRIDGE con le stesse azioni del motore 3D
     descritto nel progetto: load, update, toggle_layer, focus;
   · inoltra SPECTRA_EMBODIMENT e SPECTRA_RESPONSE come eventi del documento
     (bsi-spectra-embodiment, bsi-spectra-risposta), che l'avatar e la console
     possono ascoltare, e può leggere la risposta ad alta voce.

   SICUREZZA
   Il collegamento è solo su richiesta (un indirizzo scritto dall'utente, che si
   ricorda), solo wss:// (ws:// soltanto verso il proprio computer). Il server è
   trattato come esterno: le azioni sono quelle quattro, i valori si controllano
   (numeri finiti, stringhe corte, cursori tenuti fra min e max), una scena si
   apre solo se esiste nella barra dell'app. Nessuna chiave passa di qui: le
   chiavi dei modelli restano sul server.

   IL MOTORE (window.BSIMotore3D)
   Un adattatore sulle scene esistenti (BSILab3D): getSimulationTelemetry,
   loadSimulation, updateParameters, toggleLayer, setCameraFocus. Lo stesso
   oggetto serve anche alla console locale di Spectra.
   ═══════════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  var D = g.document;
  if (!D) return;
  var CHIAVE_URL = 'bsi-spectra-prime-url', CHIAVE_SESS = 'bsi-spectra-prime-sessione', CHIAVE_UTENTE = 'bsi-spectra-prime-utente';
  function t(it, en) { return (g.BSILingue && g.BSILingue.corrente && g.BSILingue.corrente() === 'en') ? en : it; }
  function leggi(k) { try { return g.localStorage.getItem(k) || ''; } catch (e) { return ''; } }
  function scrivi(k, v) { try { if (v) g.localStorage.setItem(k, v); else g.localStorage.removeItem(k); } catch (e) { } }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim(); }
  function pausa(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* ═══ 1. IL MOTORE: le scene 3D dell'app viste come un unico motore ═══════ */
  var SCENE = {
    orbitale: 'sorbitali', eliosfera: 'sastroelio', materia_oscura: 'sastrooscura', galassia: 'sastrogal', spaziotempo: 'sastrowh',
    buco_nero: 'sastrobh', onde_gravitazionali: 'sastrogw', cosmo: 'sastrocosmo', sistema_solare: 'sastrosole', molecola: 'scostruttore',
    laboratorio_3d: 'slab3d', spaccato_stellare: 'sastrospaccato', supernova: 'sastrospaccato', morse_h2: 'sfisscene', magnetosfera: 'sfisscene', reticolo: 'sfisscene'
  };
  /* le tre scene nuove stanno in una sezione sola, ognuna nella sua scheda */
  var SCHEDA_DI = { morse_h2: 'morse', magnetosfera: 'magnetosfera', reticolo: 'reticolo' };
  function sezioneAperta() { return D.querySelector('.section.on'); }
  function visibile(el) { return !!(el && el.offsetParent !== null && el.getClientRects().length); }
  function scenaAttiva() {
    var L = g.BSILab3D, sez = sezioneAperta(); if (!L || !L.scene) return null;
    var tutte = L.scene().filter(function (s) { return s && s.box && visibile(s.box) && (!sez || sez.contains(s.box)); });
    return tutte[0] || null;
  }
  function controlli(sez, tipo) {
    if (!sez) return [];
    return [].slice.call(sez.querySelectorAll(tipo === 'casella' ? 'input[type=checkbox]' : tipo === 'scelta' ? 'select' : 'input[type=range]')).filter(visibile);
  }
  function nomeDi(inp) {
    var a = inp.getAttribute('aria-label'); if (a) return a;
    var l = inp.closest('label'); if (l) return l.textContent.trim();
    var c = inp.closest('.bsiFX-cursore'); return c ? c.textContent.trim() : '';
  }
  function trova(lista, chiave) {
    var k = norm(chiave); if (!k) return null;
    var esatti = lista.filter(function (x) { return norm(nomeDi(x)) === k; }); if (esatti.length) return esatti[0];
    var parz = lista.filter(function (x) { return norm(nomeDi(x)).indexOf(k) >= 0; });
    return parz.length === 1 ? parz[0] : (parz[0] || null);
  }
  function schedaAttiva(sez) {
    if (!sez) return '';
    var b = sez.querySelector('.bsiFX-schede button[aria-selected="true"], .bsiFX-schede button.on, .bsiFX-schede button[aria-pressed="true"]');
    return b ? b.textContent.trim() : '';
  }
  var Motore = {
    get simType() { var s = sezioneAperta(); return s ? s.id : ''; },
    SCENE: SCENE,
    getSimulationTelemetry: function () {
      var sez = sezioneAperta(), S = scenaAttiva(), o = { sezione: sez ? sez.id : '', titolo: '', scheda: schedaAttiva(sez), scena: null, cursori: [], caselle: [], scelte: [] };
      if (sez) { var tt = sez.querySelector('.bsiFX-titolo, .section-title, h2'); o.titolo = tt ? tt.textContent.trim().slice(0, 120) : ''; }
      if (S) o.scena = { didascalia: (S.didascalia && S.didascalia.textContent || '').slice(0, 240), camera: { r: +S.vista.r.toFixed(3), th: +S.vista.th.toFixed(3), ph: +S.vista.ph.toFixed(3) }, bersaglio: [S.vista.bersaglio.x, S.vista.bersaglio.y, S.vista.bersaglio.z].map(function (v) { return +v.toFixed(3); }), gira: !!S.gira };
      controlli(sez, 'cursore').slice(0, 24).forEach(function (x) { o.cursori.push({ nome: nomeDi(x).slice(0, 80), valore: +x.value, min: +x.min, max: +x.max }); });
      controlli(sez, 'casella').slice(0, 24).forEach(function (x) { o.caselle.push({ nome: nomeDi(x).slice(0, 80), attiva: x.checked }); });
      controlli(sez, 'scelta').slice(0, 12).forEach(function (x) { o.scelte.push({ nome: nomeDi(x).slice(0, 80), valore: x.value, voci: [].slice.call(x.options, 0, 30).map(function (op) { return op.value; }) }); });
      return o;
    },
    /** apre la sezione della scena (e la scheda), poi applica i parametri; restituisce un resoconto */
    loadSimulation: async function (sceneType, params) {
      var id = SCENE[sceneType] || (typeof sceneType === 'string' && /^s[a-z0-9]{2,30}$/.test(sceneType) ? sceneType : '');
      if (!id || !D.querySelector('.nav-btn[data-s="' + id + '"]')) return { ok: false, errore: t('scena sconosciuta: ', 'unknown scene: ') + sceneType };
      var L = g.BSISpectraLive;
      if (L && L.calcolo && L.calcolo.apriSezione) L.calcolo.apriSezione(id); else if (typeof g.goSection === 'function') g.goSection(id);
      await pausa(500);
      var sch = (params && params.scheda) || SCHEDA_DI[sceneType];
      if (sch) { var sez = D.getElementById(id), k = norm(sch), b = sez && [].slice.call(sez.querySelectorAll('.bsiFX-schede button')).filter(function (x) { return norm(x.textContent).indexOf(k) >= 0; })[0]; if (b) { b.click(); await pausa(500); } }
      var resto = {}; Object.keys(params || {}).forEach(function (k2) { if (k2 !== 'scheda') resto[k2] = params[k2]; });
      var r = Motore.updateParameters(resto);
      return { ok: true, sezione: id, applicati: r.applicati, ignorati: r.ignorati };
    },
    /** chiave = (parte dell')etichetta di un cursore o di un menu; valore = numero o voce */
    updateParameters: function (params) {
      var sez = sezioneAperta(), out = { applicati: [], ignorati: [] };
      Object.keys(params || {}).slice(0, 20).forEach(function (k) {
        var v = params[k], c = trova(controlli(sez, 'cursore'), k);
        if (c && typeof v === 'number' && isFinite(v)) {
          var x = Math.max(+c.min, Math.min(+c.max, v)); c.value = x; c.dispatchEvent(new Event('input', { bubbles: true })); out.applicati.push(k + '=' + c.value); return;
        }
        var s = trova(controlli(sez, 'scelta'), k);
        if (s && (typeof v === 'string' || typeof v === 'number') && String(v).length < 80) {
          var op = [].slice.call(s.options).filter(function (o) { return o.value === String(v) || norm(o.textContent) === norm(v); })[0];
          if (op) { s.value = op.value; s.dispatchEvent(new Event('change', { bubbles: true })); out.applicati.push(k + '=' + op.value); return; }
        }
        out.ignorati.push(k);
      });
      return out;
    },
    toggleLayer: function (nome, visibile2) {
      var c = trova(controlli(sezioneAperta(), 'casella'), nome);
      if (!c) return { ok: false, errore: t('strato non trovato: ', 'layer not found: ') + nome };
      if (c.checked !== !!visibile2) c.click();
      return { ok: true, strato: nomeDi(c), attivo: c.checked };
    },
    /** porta la camera in pos guardando target (coordinate della scena, asse z in alto) */
    setCameraFocus: function (pos, target) {
      var S = scenaAttiva(); if (!S) return { ok: false, errore: t('nessuna scena 3D aperta', 'no 3D scene open') };
      function terna(a) { return Array.isArray(a) && a.length === 3 && a.every(function (v) { return typeof v === 'number' && isFinite(v) && Math.abs(v) < 1e6; }); }
      target = target || [0, 0, 0]; if (!terna(pos) || !terna(target)) return { ok: false, errore: t('pos e target sono terne di numeri', 'pos and target are number triples') };
      var dx = pos[0] - target[0], dy = pos[1] - target[1], dz = pos[2] - target[2], r = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (r < 1e-6) return { ok: false, errore: t('pos coincide con target', 'pos equals target') };
      S.vista.bersaglio.set(target[0], target[1], target[2]); S.vista.r = Math.max(0.5, Math.min(500, r)); S.vista.th = Math.atan2(dy, dx); S.vista.ph = Math.max(0.05, Math.min(Math.PI - 0.05, Math.acos(dz / r)));
      S.sporca = true; S.avvia(); return { ok: true, camera: { r: S.vista.r, th: S.vista.th, ph: S.vista.ph } };
    }
  };

  /* ═══ 2. IL COLLEGAMENTO ═════════════════════════════════════════════════ */
  var ws = null, stato = 'spento', tentativi = 0, timerRic = 0, timerTel = 0, ultimaTel = '', ultimoInvio = 0, voluto = false, ascoltatori = [], registro = [];
  function annota(tipo, x) { registro.push({ t: Date.now(), tipo: tipo, x: x }); if (registro.length > 60) registro.shift(); }
  function urlValido(u) {
    try { var x = new URL(u); if (x.protocol === 'wss:') return true; return x.protocol === 'ws:' && /^(localhost|127\.0\.0\.1|\[::1\])$/.test(x.hostname); } catch (e) { return false; }
  }
  function sessione() { var s = leggi(CHIAVE_SESS); if (!s) { s = 'bsi-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36); scrivi(CHIAVE_SESS, s); } return s; }
  function cambiaStato(s, dettaglio) { stato = s; annota('stato', s); try { D.dispatchEvent(new CustomEvent('bsi-spectra-prime-stato', { detail: { stato: s, dettaglio: dettaglio || '' } })); } catch (e) { } }
  function manda(o) { if (ws && ws.readyState === 1) { ws.send(JSON.stringify(o)); return true; } return false; }
  function telemetria(forza) {
    if (!ws || ws.readyState !== 1) return;
    var p; try { p = JSON.stringify(Motore.getSimulationTelemetry()); } catch (e) { return; }
    if (!forza && p === ultimaTel && Date.now() - ultimoInvio < 5000) return;
    ultimaTel = p; ultimoInvio = Date.now();
    ws.send('{"type":"TELEMETRY_UPDATE","user_id":' + JSON.stringify(utente()) + ',"payload":' + p + '}');
  }
  function utente() { return leggi(CHIAVE_UTENTE) || 'default_partner'; }
  async function esegui(p) {
    if (!p || typeof p !== 'object') return { ok: false, errore: 'comando vuoto' };
    var a = p.action;
    if (a === 'load' && typeof p.sceneType === 'string' && p.sceneType.length < 40) return Motore.loadSimulation(p.sceneType, p.params && typeof p.params === 'object' ? p.params : {});
    if (a === 'update' && p.params && typeof p.params === 'object') return Motore.updateParameters(p.params);
    if (a === 'toggle_layer' && typeof p.layerName === 'string' && p.layerName.length < 80) return Motore.toggleLayer(p.layerName, !!p.visible);
    if (a === 'focus') return Motore.setCameraFocus(p.pos, p.target);
    return { ok: false, errore: 'azione non ammessa: ' + a };
  }
  function ricevi(ev) {
    var m; try { m = JSON.parse(ev.data); } catch (e) { return; }
    if (!m || typeof m !== 'object') return;
    annota('ricevuto', m.channel);
    if (m.channel === 'SPECTRA_3D_BRIDGE') {
      esegui(m.payload).then(function (r) { annota('eseguito', r); try { D.dispatchEvent(new CustomEvent('bsi-spectra-3d', { detail: { comando: m.payload, esito: r } })); } catch (e) { } setTimeout(function () { telemetria(true); }, 300); });
    } else if (m.channel === 'SPECTRA_EMBODIMENT') {
      try { D.dispatchEvent(new CustomEvent('bsi-spectra-embodiment', { detail: m.payload || {} })); } catch (e) { }
    } else if (m.channel === 'SPECTRA_RESPONSE' || m.channel === 'SPECTRA_ERROR' || m.channel === 'SPECTRA_CONFIRMED') {
      ascoltatori.forEach(function (f) { try { f(m); } catch (e) { } });
      try { D.dispatchEvent(new CustomEvent('bsi-spectra-risposta', { detail: m })); } catch (e) { }
      if (m.channel === 'SPECTRA_RESPONSE' && Ponte.voce && g.BSISpectraLive && g.BSISpectraLive.parla && m.content) try { g.BSISpectraLive.parla(String(m.content).slice(0, 1500)); } catch (e) { }
    }
  }
  function apri() {
    var base = leggi(CHIAVE_URL); if (!base || !urlValido(base)) { cambiaStato('spento'); return; }
    clearTimeout(timerRic);
    try { ws = new g.WebSocket(base.replace(/\/+$/, '') + '/' + encodeURIComponent(sessione())); } catch (e) { cambiaStato('errore', e.message); programma(); return; }
    cambiaStato('collego');
    ws.onopen = function () { tentativi = 0; cambiaStato('collegato'); ultimaTel = ''; telemetria(true); clearInterval(timerTel); timerTel = setInterval(function () { if (!D.hidden) telemetria(false); }, 500); };
    ws.onmessage = ricevi;
    ws.onclose = function () { clearInterval(timerTel); ws = null; if (voluto) { cambiaStato('scollegato'); programma(); } else cambiaStato('spento'); };
    ws.onerror = function () { annota('errore', 'websocket'); };
  }
  function programma() { var att = [1, 2, 4, 8, 15][Math.min(tentativi, 4)] * 1000; tentativi++; clearTimeout(timerRic); timerRic = setTimeout(function () { if (voluto) apri(); }, att); }

  var Ponte = {
    voce: false,
    /** url = wss://host/ws/spectra (la sessione si aggiunge da sé). Restituisce false se l'indirizzo non è ammesso. */
    connetti: function (url, opz) {
      if (url != null) { if (!urlValido(url)) return false; scrivi(CHIAVE_URL, url); }
      if (opz && opz.utente) scrivi(CHIAVE_UTENTE, String(opz.utente).slice(0, 120));
      if (opz && 'voce' in opz) Ponte.voce = !!opz.voce;
      voluto = true; tentativi = 0; if (ws) { try { ws.close(); } catch (e) { } } apri(); return true;
    },
    disconnetti: function (dimentica) { voluto = false; clearTimeout(timerRic); clearInterval(timerTel); if (ws) try { ws.close(); } catch (e) { } ws = null; if (dimentica) scrivi(CHIAVE_URL, ''); cambiaStato('spento'); },
    invia: function (testo) { testo = String(testo || '').trim(); if (!testo) return false; return manda({ type: 'USER_MESSAGE', user_id: utente(), content: testo.slice(0, 4000) }); },
    conferma: function (strumento) { return manda({ type: 'CONFIRM', tool: String(strumento).slice(0, 60) }); },
    suRisposta: function (f) { if (typeof f === 'function') ascoltatori.push(f); },
    stato: function () { return { stato: stato, url: leggi(CHIAVE_URL), sessione: leggi(CHIAVE_SESS), registro: registro.slice(-20) }; },
    urlValido: urlValido, motore: Motore, esegui: esegui, telemetria: function () { telemetria(true); },
    /** il riquadro di collegamento, dentro la guida «Occhiali e dispositivi» */
    pannello: function (padre) {
      var box = D.createElement('div'); box.className = 'bsiSP-box';
      box.innerHTML = '<h3>🧠 ' + t('Spectra Prime (server)', 'Spectra Prime (server)') + '</h3><p class="bsiSP-n">' + t('Il cervello a sette agenti gira su un server tuo (spectra_core): qui scrivi il suo indirizzo, BioSpecInfo gli mostra la scena 3D aperta e ne esegue i comandi. Le chiavi dei modelli restano sul server.', 'The seven-agent brain runs on your own server (spectra_core): write its address here, BioSpecInfo shows it the open 3D scene and carries out its commands. Model keys stay on the server.') + '</p>';
      var inp = D.createElement('input'); inp.type = 'url'; inp.placeholder = 'wss://…/ws/spectra'; inp.value = leggi(CHIAVE_URL); inp.setAttribute('aria-label', t('Indirizzo di Spectra Prime', 'Spectra Prime address'));
      var bc = D.createElement('button'), bs = D.createElement('button'), st = D.createElement('div'); bc.type = bs.type = 'button';
      bc.textContent = t('Collega', 'Connect'); bs.textContent = t('Scollega', 'Disconnect'); st.className = 'bsiSP-st'; st.setAttribute('role', 'status');
      var dom = D.createElement('input'); dom.type = 'text'; dom.placeholder = t('Chiedi a Spectra Prime…', 'Ask Spectra Prime…'); dom.setAttribute('aria-label', t('Domanda per Spectra Prime', 'Question for Spectra Prime'));
      var bi = D.createElement('button'); bi.type = 'button'; bi.textContent = t('Invia', 'Send');
      var risp = D.createElement('div'); risp.className = 'bsiSP-r'; risp.setAttribute('aria-live', 'polite');
      function aggiorna() { var s = Ponte.stato().stato; st.textContent = { spento: t('Non collegato', 'Not connected'), collego: t('Collegamento…', 'Connecting…'), collegato: t('Collegato: Spectra Prime vede la scena 3D', 'Connected: Spectra Prime sees the 3D scene'), scollegato: t('Collegamento perso, riprovo…', 'Connection lost, retrying…'), errore: t('Errore di collegamento', 'Connection error') }[s] || s; st.dataset.stato = s; }
      bc.onclick = function () { if (!Ponte.connetti(inp.value.trim())) { st.textContent = t('Indirizzo non ammesso: serve wss:// (ws:// solo verso questo computer).', 'Address not allowed: wss:// is required (ws:// only to this computer).'); st.dataset.stato = 'errore'; } else aggiorna(); };
      bs.onclick = function () { Ponte.disconnetti(); aggiorna(); };
      bi.onclick = function () { if (!Ponte.invia(dom.value)) { risp.textContent = t('Prima collega Spectra Prime.', 'Connect Spectra Prime first.'); return; } risp.textContent = t('Spectra Prime ragiona…', 'Spectra Prime is thinking…'); dom.value = ''; };
      Ponte.suRisposta(function (m) { if (!box.isConnected) return; if (m.channel === 'SPECTRA_RESPONSE') { risp.textContent = m.content || ''; if ((m.verdict === 'blocked') && m.actions && m.actions.length) { var b = D.createElement('button'); b.type = 'button'; var nome = m.actions.filter(function (a) { return a.output && a.output.status === 'blocked_awaiting_confirm'; }).map(function (a) { return a.tool; })[0]; if (nome) { b.textContent = t('Conferma «', 'Confirm «') + nome + '»'; b.onclick = function () { Ponte.conferma(nome); b.remove(); }; risp.appendChild(D.createElement('br')); risp.appendChild(b); } } } else if (m.channel === 'SPECTRA_ERROR') risp.textContent = '⚠ ' + (m.error || ''); else if (m.channel === 'SPECTRA_CONFIRMED') risp.textContent = t('Confermato: ', 'Confirmed: ') + m.tool + t('. Ripeti la richiesta.', '. Repeat the request.'); });
      D.addEventListener('bsi-spectra-prime-stato', function () { if (box.isConnected) aggiorna(); });
      var r1 = D.createElement('div'), r2 = D.createElement('div'); r1.className = r2.className = 'bsiSP-riga';
      r1.appendChild(inp); r1.appendChild(bc); r1.appendChild(bs); r2.appendChild(dom); r2.appendChild(bi);
      box.appendChild(r1); box.appendChild(st); box.appendChild(r2); box.appendChild(risp); aggiorna();
      if (!D.getElementById('bsiSP-stile')) { var s = D.createElement('style'); s.id = 'bsiSP-stile'; s.textContent = '.bsiSP-box{margin-top:12px;padding:10px 12px;border:1px solid #1d6e94;border-radius:12px;background:#05202f}.bsiSP-box h3{margin:0 0 4px;font:700 .95rem system-ui,sans-serif;color:#7fe7ff}.bsiSP-n{margin:0 0 8px;font:400 .82rem/1.45 system-ui,sans-serif;color:#cfe3f7}.bsiSP-riga{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}.bsiSP-riga input{flex:1 1 180px;min-width:0;min-height:40px;border-radius:9px;border:1px solid #2a8fbf;background:#031621;color:#e8fbff;padding:6px 10px;font:500 .9rem system-ui,sans-serif}.bsiSP-st{font:600 .84rem system-ui,sans-serif;color:#9fb3c8}.bsiSP-st[data-stato="collegato"]{color:#5eead4}.bsiSP-st[data-stato="errore"]{color:#ffb86b}.bsiSP-r{font:400 .9rem/1.5 system-ui,sans-serif;color:#e8fbff;white-space:pre-wrap;overflow-wrap:anywhere}'; D.head.appendChild(s); }
      (padre || D.body).appendChild(box); return box;
    }
  };
  g.BSIMotore3D = Motore;
  g.BSISpectraPonte = Ponte;
  /* chi si era collegato si ricollega da sé alla prossima apertura */
  if (leggi(CHIAVE_URL) && urlValido(leggi(CHIAVE_URL))) setTimeout(function () { Ponte.connetti(null); }, 1500);
  D.addEventListener('visibilitychange', function () { if (!D.hidden && voluto && !ws) apri(); });
})(typeof window !== 'undefined' ? window : globalThis);
