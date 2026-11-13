/* ═══════════════════════════════════════════════════════════════════════════
   bsi-spectra-risveglio.js — «Svegliati, Spectra»
   BioSpecInfo · © Samuele Pio Provenzano

   Ciò che rende Spectra presente anche quando non gli si fa una domanda, nel
   browser, senza installare nulla:

   · IL RISVEGLIO: «svegliati Spectra» (o la scorciatoia dalla Home, o Siri)
     apre la sequenza di avvio: sistemi, rete neurale, cervello, voce, poi il
     punto della situazione: saluto, meteo, impegni di oggi e di domani.
   · IL METEO: Open-Meteo, gratuito e senza chiave. «Che tempo fa a Milano?»,
     «abito a Bari». Il nome della città va a Open-Meteo solo quando si chiede
     il meteo; nient'altro esce dal dispositivo.
   · IL PUNTO ALLE 8 E ALLE 20: dopo il primo risveglio, se l'app è aperta,
     Spectra fa da solo il punto del mattino (meteo e impegni di oggi) e della
     sera (impegni di domani).
   · LA BATTERIA: dove il browser la espone (Chrome su Android e computer, non
     Safari), sotto il 20% e senza caricatore il tema di Spectra passa dal
     ciano al rosso, con un avviso e un suono.
   · LA RETE NEURALE: la memoria di Spectra disegnata come neuroni (ricordi,
     conversazioni, impegni, sezioni) e collegamenti (parole e luoghi in
     comune). Non è decorazione: ogni punto è un ricordo vero, e si tocca per
     leggerlo.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  var D = g.document, CHIAVE = 'bsi-spectra-risveglio-v1';
  var S = { citta: null, lat: null, lon: null, armato: false, briefing: true, fatti: {}, meteo: null, ascolto: false, avvioSveglia: false };

  function adesso() { return Date.now(); }
  function carica() { try { var x = JSON.parse(g.localStorage.getItem(CHIAVE) || 'null'); if (x) for (var k in S) if (k in x) S[k] = x[k]; } catch (e) {} }
  function salva() { try { g.localStorage.setItem(CHIAVE, JSON.stringify(S)); } catch (e) {} }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’`]/g, "'"); }
  function nome() { var C = g.BSISpectraCreatore; try { return C && C.riconosciuto() ? C.NOME_BREVE : ''; } catch (e) { return ''; } }
  function di(testo) { try { var L = g.BSISpectraLive; if (L && L.parla && testo) L.parla(testo); } catch (e) {} }
  function plur(n, uno, molti) { return n + ' ' + (n === 1 ? uno : molti); }
  function giornoChiave(d) { return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }

  /* ── 1. il meteo ─────────────────────────────────────────────────────── */
  var WMO = { 0: 'cielo sereno', 1: 'cielo quasi sereno', 2: 'cielo parzialmente nuvoloso', 3: 'cielo coperto', 45: 'nebbia', 48: 'nebbia con brina',
    51: 'pioviggine debole', 53: 'pioviggine', 55: 'pioviggine fitta', 56: 'pioviggine gelata', 57: 'pioviggine gelata fitta', 61: 'pioggia debole', 63: 'pioggia', 65: 'pioggia forte',
    66: 'pioggia gelata', 67: 'pioggia gelata forte', 71: 'neve debole', 73: 'neve', 75: 'neve forte', 77: 'neve granulosa', 80: 'rovesci deboli', 81: 'rovesci', 82: 'rovesci violenti',
    85: 'rovesci di neve', 86: 'rovesci di neve forti', 95: 'temporale', 96: 'temporale con grandine', 99: 'temporale con grandine forte' };
  function cielo(c) { return WMO[c] || 'condizioni non classificate'; }
  function gradi(x) { return Math.round(x) + (Math.round(x) === 1 || Math.round(x) === -1 ? ' grado' : ' gradi'); }
  function scarica(url) {
    var ctl = typeof AbortController === 'function' ? new AbortController() : null, t = setTimeout(function () { if (ctl) ctl.abort(); }, 9000);
    return fetch(url, ctl ? { signal: ctl.signal } : {}).then(function (r) { clearTimeout(t); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }, function (e) { clearTimeout(t); throw e; });
  }
  /** Le coordinate di una città (Open-Meteo, geocodifica). */
  function trovaCitta(nomeCitta) {
    return scarica('https://geocoding-api.open-meteo.com/v1/search?count=1&language=it&format=json&name=' + encodeURIComponent(nomeCitta)).then(function (d) {
      var r = d && d.results && d.results[0]; if (!r) throw new Error('non trovo la città «' + nomeCitta + '»');
      return { citta: r.name, lat: r.latitude, lon: r.longitude, paese: r.country || '' };
    });
  }
  /** Il meteo di un luogo: adesso, oggi, domani. Tiene una copia per 15 minuti. */
  function meteo(luogo) {
    luogo = luogo || (S.citta ? { citta: S.citta, lat: S.lat, lon: S.lon } : null);
    if (!luogo) return Promise.reject(new Error('senza città'));
    var M = S.meteo;
    if (M && M.citta === luogo.citta && adesso() - M.quando < 15 * 60000) return Promise.resolve(M);
    return scarica('https://api.open-meteo.com/v1/forecast?latitude=' + luogo.lat + '&longitude=' + luogo.lon +
      '&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m' +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=2').then(function (d) {
      if (!d || !d.current || !d.daily) throw new Error('risposta del meteo incompleta');
      var c = d.current, y = d.daily, m = { citta: luogo.citta, quando: adesso(),
        ora: { t: c.temperature_2m, p: c.apparent_temperature, u: c.relative_humidity_2m, pioggia: c.precipitation, codice: c.weather_code, vento: c.wind_speed_10m },
        giorni: [0, 1].map(function (i) { return { codice: y.weather_code[i], max: y.temperature_2m_max[i], min: y.temperature_2m_min[i], pioggia: y.precipitation_probability_max ? y.precipitation_probability_max[i] : null }; }) };
      if (S.citta === luogo.citta) { S.meteo = m; salva(); }
      return m;
    });
  }
  function fraseMeteo(m, quale) {
    if (quale === 'domani') { var d = m.giorni[1]; return 'Domani a ' + m.citta + ': ' + cielo(d.codice) + ', fra ' + gradi(d.min) + ' e ' + gradi(d.max) + (d.pioggia != null && d.pioggia >= 30 ? ', pioggia al ' + d.pioggia + ' per cento' : '') + '.'; }
    var o = m.ora, g0 = m.giorni[0], f = 'A ' + m.citta + ' ci sono ' + gradi(o.t) + ', ' + cielo(o.codice);
    if (Math.abs(o.p - o.t) >= 2) f += ', percepiti ' + gradi(o.p);
    f += '. Oggi fra ' + gradi(g0.min) + ' e ' + gradi(g0.max);
    if (g0.pioggia != null && g0.pioggia >= 30) f += ', pioggia al ' + g0.pioggia + ' per cento';
    if (o.vento >= 30) f += ', vento a ' + Math.round(o.vento) + ' chilometri orari';
    return f + '.';
  }
  function impostaCitta(nomeCitta) {
    return trovaCitta(nomeCitta).then(function (l) { S.citta = l.citta; S.lat = l.lat; S.lon = l.lon; S.meteo = null; salva(); return l; });
  }

  /* ── 2. gli impegni di un giorno ─────────────────────────────────────── */
  function impegniDel(giorno) {
    var A = g.BSISpectraAgenda; if (!A) return [];
    var i0 = new Date(giorno.getFullYear(), giorno.getMonth(), giorno.getDate()).getTime(), i1 = i0 + 86400000;
    return A.aperti().filter(function (v) { return v.quando != null && v.quando >= i0 && v.quando < i1; });
  }
  function hhmm(q) { var d = new Date(q); return d.getHours() + (d.getMinutes() ? ':' + ('0' + d.getMinutes()).slice(-2) : ''); }
  function fraseImpegni(quale, ora) {
    var o = new Date(ora == null ? adesso() : ora), giorno = quale === 'domani' ? new Date(o.getFullYear(), o.getMonth(), o.getDate() + 1) : o;
    var v = impegniDel(giorno), Q = quale === 'domani' ? 'Domani' : 'Oggi';
    if (quale !== 'domani') v = v.filter(function (x) { return x.quando >= o.getTime() - 3600000; });
    if (!v.length) return Q + ' non hai impegni segnati.';
    var parti = v.slice(0, 4).map(function (x) { return x.testo + ' alle ' + hhmm(x.quando); });
    return Q + (v.length === 1 ? ' hai un impegno: ' : ' hai ' + v.length + ' impegni: ') + parti.join('; ') + (v.length > 4 ? '; e altri ' + (v.length - 4) : '') + '.';
  }
  function scaduti(ora) { var A = g.BSISpectraAgenda, o = ora == null ? adesso() : ora; return A ? A.aperti().filter(function (v) { return v.quando != null && v.quando < o - 3600000; }) : []; }

  /* ── 3. il punto della situazione ────────────────────────────────────── */
  function saluto(ora) {
    var h = new Date(ora == null ? adesso() : ora).getHours(), n = nome();
    return (h < 5 ? 'Ancora sveglio' : h < 13 ? 'Buongiorno' : h < 18 ? 'Buon pomeriggio' : 'Buonasera') + (n ? ', ' + n : '') + '.';
  }
  /** Il testo del punto: 'mattina' (meteo e oggi), 'sera' (domani), 'casa' (bentornato), 'risveglio'. Promessa: il meteo può mancare senza bloccare. */
  function punto(tipo, ora) {
    var o = ora == null ? adesso() : ora;
    var conMeteo = S.citta ? meteo().then(function (m) { return m; }, function () { return null; }) : Promise.resolve(null);
    return conMeteo.then(function (m) {
      var p = [];
      if (tipo === 'casa') p.push('Bentornato a casa' + (nome() ? ', ' + nome() : '') + '.');
      else if (tipo === 'sera') p.push('Buonasera' + (nome() ? ', ' + nome() : '') + '. Il punto della sera.');
      else p.push(saluto(o));
      if (tipo === 'sera') {
        p.push(fraseImpegni('domani', o));
        if (m) p.push(fraseMeteo(m, 'domani'));
      } else {
        if (m) p.push('Fuori, ' + fraseMeteo(m).replace(/^A /, 'a '));
        else if (!S.citta) p.push('Per il meteo dimmi dove sei: «abito a Milano».');
        p.push(fraseImpegni('oggi', o));
        if (tipo !== 'mattina') p.push(fraseImpegni('domani', o));
      }
      var sc = scaduti(o); if (sc.length) p.push(sc.length === 1 ? 'Resta in sospeso: ' + sc[0].testo + '.' : 'Restano in sospeso ' + sc.length + ' impegni scaduti.');
      return p.join(' ');
    });
  }

  /* ── 4. la rete neurale: la memoria come grafo ───────────────────────── */
  var VUOTE = /^(della|delle|degli|dello|nella|nelle|sulla|sulle|dalla|dalle|questo|questa|quello|quella|come|cosa|perche|quando|sono|hai|ho|che|per|con|una|uno|gli|del|dei|non|piu|anche|molto|tutto|tutti|spectra|spettra|essere|fare|puoi|potresti|dimmi|spiegami|vorrei)$/;
  function parole(s) { return norm(s).replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(function (p) { return p.length > 4 && !VUOTE.test(p); }); }
  function leggiJSON(k, d) { try { var x = JSON.parse(g.localStorage.getItem(k) || 'null'); return x == null ? d : x; } catch (e) { return d; } }
  function titoloSezione(id) { var b = D.querySelector('.nav-btn[data-s="' + id + '"]'); return b ? b.textContent.replace(/^[^\wÀ-ÿ]+/, '').trim() : id; }
  /** Neuroni e collegamenti dalla memoria vera: ricordi, conversazioni, impegni, sezioni. */
  function grafo() {
    var N = [], mente = leggiJSON('bsi-spectra-mente-v1', {}) || {}, fatti = leggiJSON('bsi_ai_memory', []) || [], A = g.BSISpectraAgenda;
    (Array.isArray(fatti) ? fatti : []).slice(-60).forEach(function (f) { if (f && f.fatto) N.push({ tipo: 'ricordo', testo: f.fatto, p: parole(f.fatto + ' ' + (f.categoria || '')) }); });
    (mente.episodi || []).slice(-80).forEach(function (e) { if (e && e.d) N.push({ tipo: 'conversazione', testo: e.d, p: parole(e.d), s: e.s, m: e.m, t: e.t }); });
    if (A) A.aperti().slice(0, 30).forEach(function (v) { N.push({ tipo: 'impegno', testo: v.testo, p: parole(v.testo), q: v.quando }); });
    var sez = mente.sezioni || {}; Object.keys(sez).filter(function (k) { return sez[k].s >= 30; }).sort(function (a, b) { return sez[b].s - sez[a].s; }).slice(0, 18)
      .forEach(function (k) { var tt = titoloSezione(k); N.push({ tipo: 'sezione', testo: tt + ' (' + Math.round(sez[k].s / 60) + ' min)', p: parole(tt), id: k }); });
    /* (v254) dall'archivio a cinque livelli: ciò che solo lui sa (fatti dedotti, procedure, pagine di diario) */
    try { if (g.BSIMemoria) g.BSIMemoria.elenco().filter(function (r) { return r.tipo === 'procedura' || r.tipo === 'autobiografia' || (r.tipo === 'fatto' && r.fonte === 'dedotto'); }).slice(0, 40).forEach(function (r) { N.push({ tipo: r.tipo === 'fatto' ? 'ricordo' : r.tipo, testo: r.testo, p: parole(r.testo) }); }); } catch (e) {}
    N.forEach(function (n, i) { n.i = i; n.peso = 0; });
    var L = [], visto = {};
    function lega(a, b, forza) { var k = a < b ? a + '-' + b : b + '-' + a; if (a === b || visto[k]) return; visto[k] = 1; L.push({ a: a, b: b, f: forza }); N[a].peso++; N[b].peso++; }
    for (var i = 0; i < N.length; i++) {
      var cand = [];
      for (var j = 0; j < N.length; j++) {
        if (i === j) continue;
        var c = 0; N[i].p.forEach(function (w) { if (N[j].p.indexOf(w) >= 0) c++; });
        if (N[i].s && N[j].tipo === 'sezione' && N[j].id === N[i].s) c += 2;          // una conversazione e la sezione dove è avvenuta
        if (c) cand.push({ j: j, c: c });
      }
      cand.sort(function (x, y) { return y.c - x.c; }).slice(0, 4).forEach(function (x) { lega(i, x.j, x.c); });
    }
    for (var k = 1; k < N.length; k++) if (N[k].tipo === 'conversazione' && N[k - 1].tipo === 'conversazione' && N[k].t && N[k - 1].t && N[k].t - N[k - 1].t < 20 * 60000) lega(k - 1, k, 1);   // il filo di una stessa sessione
    return { neuroni: N, collegamenti: L };
  }

  /* ── 5. la batteria ──────────────────────────────────────────────────── */
  var B = { livello: null, carica: null, bassa: false, avvisata: false };
  function coloreBatteria(l) { return 'hsl(' + Math.round(Math.max(0, Math.min(1, (l - 0.1) / 0.6)) * 120) + ',85%,52%)'; }
  function iconaBatteria(contenitore) {
    if (B.livello == null) { contenitore.style.display = 'none'; return; }
    contenitore.style.display = '';
    contenitore.innerHTML = '<span class="corpo" aria-hidden="true"><span class="liv" style="width:' + Math.round(B.livello * 100) + '%;background:' + coloreBatteria(B.livello) + '"></span></span>' +
      '<span class="num">' + Math.round(B.livello * 100) + '%' + (B.carica ? ' ⚡' : '') + '</span>';
    contenitore.setAttribute('aria-label', 'Batteria al ' + Math.round(B.livello * 100) + ' per cento' + (B.carica ? ', in carica' : ''));
  }
  function bip() {
    try {
      var AC = g.AudioContext || g.webkitAudioContext; if (!AC) return;
      var ac = new AC(), t0 = ac.currentTime;
      [0, 0.22].forEach(function (dt) { var o = ac.createOscillator(), gn = ac.createGain(); o.type = 'square'; o.frequency.value = 880; gn.gain.setValueAtTime(0.0001, t0 + dt); gn.gain.exponentialRampToValueAtTime(0.18, t0 + dt + 0.02); gn.gain.exponentialRampToValueAtTime(0.0001, t0 + dt + 0.16); o.connect(gn); gn.connect(ac.destination); o.start(t0 + dt); o.stop(t0 + dt + 0.18); });
      setTimeout(function () { try { ac.close(); } catch (e) {} }, 900);
    } catch (e) {}
  }
  /** Aggiorna lo stato della batteria (anche per le prove: `batteria(0.15, false)`). */
  function batteria(livello, inCarica) {
    B.livello = livello; B.carica = !!inCarica;
    var bassa = livello != null && livello <= 0.2 && !inCarica;
    if (bassa !== B.bassa) { B.bassa = bassa; D.body.classList.toggle('bsi-batteria-bassa', bassa); }
    if (bassa && !B.avvisata) {
      B.avvisata = true; var f = 'Batteria al ' + Math.round(livello * 100) + ' per cento. Collega il caricatore.';
      var A = g.BSISpectraAgenda; if (A && A.avviso) A.avviso('🔋 ' + f); bip();
      if (D.body.classList.contains('bsiJV-aperto')) di(f);
    }
    if (!bassa && (inCarica || livello > 0.25)) B.avvisata = false;
    [].forEach.call(D.querySelectorAll('.bsiRV-batt'), iconaBatteria);
    return { livello: livello, carica: B.carica, bassa: B.bassa };
  }
  function seguiBatteria() {
    try {
      if (!g.navigator.getBattery) return;
      g.navigator.getBattery().then(function (b) {
        var su = function () { batteria(b.level, b.charging); };
        su(); b.addEventListener('levelchange', su); b.addEventListener('chargingchange', su);
      }).catch(function () {});
    } catch (e) {}
  }

  /* ── 6. lo stile ─────────────────────────────────────────────────────── */
  function stile() {
    if (D.getElementById('bsiRV-stile')) return;
    var s = D.createElement('style'); s.id = 'bsiRV-stile';
    s.textContent =
      'body.bsi-batteria-bassa #bsiJV,body.bsi-batteria-bassa #bsiRV,body.bsi-batteria-bassa #bsiRN{filter:hue-rotate(172deg) saturate(1.5)}' +
      '#bsiRV,#bsiRN{position:fixed;inset:0;z-index:100060;background:radial-gradient(ellipse at center,#06263a 0%,#020a12 70%);color:#bff3ff;font:500 .95rem/1.5 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;' +
      'display:flex;flex-direction:column;align-items:center;justify-content:flex-start;overflow:auto;-webkit-overflow-scrolling:touch;padding:calc(18px + env(safe-area-inset-top,0px)) 16px calc(22px + env(safe-area-inset-bottom,0px))}' +
      '#bsiRV canvas,#bsiRN canvas{display:block}#bsiRV .sfondo{position:fixed;inset:0;width:100%;height:100%;opacity:.35;pointer-events:none}' +
      '#bsiRV .testa,#bsiRN .testa{position:relative;width:min(640px,100%);display:flex;justify-content:space-between;align-items:center;gap:10px}' +
      '#bsiRV h2,#bsiRN h2{margin:0;font:700 1rem/1.2 ui-monospace,Menlo,monospace;letter-spacing:.18em;color:#7fe7ff}' +
      '.bsiRV-batt{display:inline-flex;align-items:center;gap:6px;font-size:.8rem;color:#bff3ff}.bsiRV-batt .corpo{position:relative;width:30px;height:14px;border:2px solid #7fe7ff;border-radius:3px;padding:1px;box-sizing:border-box}' +
      '.bsiRV-batt .corpo:after{content:"";position:absolute;right:-5px;top:3px;width:3px;height:4px;background:#7fe7ff;border-radius:0 2px 2px 0}.bsiRV-batt .liv{display:block;height:100%;border-radius:1px;transition:width .6s,background .6s}' +
      '#bsiRV .reattore{position:relative;width:min(46vw,190px);aspect-ratio:1;margin:22px 0 10px;border-radius:50%;box-shadow:0 0 40px #19c6ff66,inset 0 0 30px #19c6ff55;border:2px solid #39d5ff;display:grid;place-items:center}' +
      '#bsiRV .reattore:before,#bsiRV .reattore:after{content:"";position:absolute;inset:12%;border-radius:50%;border:2px dashed #7fe7ffaa;animation:bsiRVgira 9s linear infinite}#bsiRV .reattore:after{inset:28%;border-style:solid;border-color:#bff3ff55;animation-duration:5s;animation-direction:reverse}' +
      '#bsiRV .nucleo{width:30%;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,#ffffff 0%,#7fe7ff 45%,#0aa6d6 100%);box-shadow:0 0 30px #7fe7ff;animation:bsiRVpulsa 1.6s ease-in-out infinite}' +
      '@keyframes bsiRVgira{to{transform:rotate(360deg)}}@keyframes bsiRVpulsa{50%{transform:scale(.86);opacity:.8}}' +
      '#bsiRV ol.stato{list-style:none;margin:6px 0 12px;padding:0;width:min(640px,100%);position:relative}#bsiRV ol.stato li{opacity:0;transform:translateY(4px);transition:opacity .35s,transform .35s;padding:3px 0;border-bottom:1px solid #0f3a52;display:flex;justify-content:space-between;gap:12px}' +
      '#bsiRV ol.stato li.vis{opacity:1;transform:none}#bsiRV ol.stato li span{min-width:0;overflow-wrap:anywhere}#bsiRV ol.stato li .ok,#bsiRV ol.stato li .no{flex:0 1 62%;text-align:right}#bsiRV ol.stato li .ok{color:#6dffb0}#bsiRV ol.stato li .no{color:#ffb86b}' +
      '#bsiRV .messaggio{position:relative;width:min(640px,100%);min-height:3em;font:500 1.02rem/1.55 system-ui,sans-serif;color:#e8fbff;background:#05202f99;border:1px solid #1d6e94;border-radius:12px;padding:12px 14px;white-space:pre-wrap}' +
      '#bsiRV .azioni,#bsiRN .azioni{position:relative;display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;width:min(640px,100%)}' +
      '#bsiRV button,#bsiRN button{min-height:42px;border-radius:10px;border:1px solid #2a8fbf;background:#082b40;color:#e8fbff;font:600 .9rem system-ui,sans-serif;padding:6px 14px;cursor:pointer}' +
      '#bsiRV button.primo{background:#0b7fb8;border-color:#4cc7ff}#bsiRV button:focus-visible,#bsiRN button:focus-visible{outline:2px solid #bff3ff;outline-offset:2px}' +
      '#bsiRV .scorciatoie{position:relative;width:min(640px,100%);font:400 .88rem/1.5 system-ui,sans-serif;color:#cfefff;background:#041a27;border:1px solid #13506e;border-radius:10px;padding:10px 12px;margin-top:10px}' +
      '#bsiRV .scorciatoie code{overflow-wrap:anywhere;color:#7fe7ff}#bsiRV .tocca{position:relative;margin-top:16px;font-size:1.05rem}' +
      '#bsiRN .tela{position:relative;width:min(900px,100%);height:min(62vh,560px);margin-top:10px;border:1px solid #13506e;border-radius:12px;overflow:hidden;background:#020d16;touch-action:none}' +
      '#bsiRN .tela canvas{width:100%;height:100%}#bsiRN .conta{position:relative;width:min(900px,100%);margin-top:8px;color:#7fe7ff}' +
      '#bsiRN .leggenda{position:relative;width:min(900px,100%);display:flex;flex-wrap:wrap;gap:6px 14px;font:400 .82rem system-ui,sans-serif;margin-top:6px}#bsiRN .leggenda i{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:5px;vertical-align:-1px}' +
      '#bsiRN .scelto{position:relative;width:min(900px,100%);min-height:2.6em;margin-top:8px;font:400 .92rem/1.45 system-ui,sans-serif;color:#e8fbff;background:#05202f;border:1px solid #1d6e94;border-radius:10px;padding:8px 12px;overflow-wrap:anywhere}' +
      '#bsiRD{position:fixed;inset:0;z-index:100060;background:radial-gradient(ellipse at center,#06263a 0%,#020a12 70%);color:#bff3ff;display:flex;flex-direction:column;align-items:center;overflow:auto;-webkit-overflow-scrolling:touch;padding:calc(18px + env(safe-area-inset-top,0px)) 16px calc(22px + env(safe-area-inset-bottom,0px))}' +
      '#bsiRD .testa{width:min(640px,100%);display:flex;justify-content:space-between;align-items:center;gap:10px}#bsiRD h2{margin:0;font:700 1rem/1.2 ui-monospace,Menlo,monospace;letter-spacing:.18em;color:#7fe7ff}' +
      '#bsiRD button,.scorciatoie button{min-height:42px;border-radius:10px;border:1px solid #2a8fbf;background:#082b40;color:#e8fbff;font:600 .9rem system-ui,sans-serif;padding:6px 14px;cursor:pointer}.scorciatoie button.primo{background:#0b7fb8;border-color:#4cc7ff}' +
      '#bsiRD .scorciatoie{width:min(640px,100%);font:400 .92rem/1.5 system-ui,sans-serif;color:#cfefff;background:#041a27;border:1px solid #13506e;border-radius:10px;padding:10px 14px;margin-top:12px}' +
      '.scorciatoie h3{margin:12px 0 4px;font:700 .95rem system-ui,sans-serif;color:#7fe7ff}.scorciatoie h3:first-child{margin-top:2px}.scorciatoie ol{margin:0;padding-left:20px}.scorciatoie li{margin:2px 0}.scorciatoie .nota{font-size:.84rem;color:#9fc3e0;margin:6px 0}' +
      '.scorciatoie code{overflow-wrap:anywhere;color:#7fe7ff}.scorciatoie .interruttori{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}.scorciatoie .esito{min-height:1.3em;margin-top:6px;color:#9fe8c4;font-size:.86rem}' +
      '#bsiRV-chip{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(10px + env(safe-area-inset-bottom,0px));z-index:100055;display:flex;align-items:center;gap:8px;max-width:calc(100vw - 24px);background:#03141f;color:#bff3ff;border:1px solid #2a8fbf;border-radius:999px;padding:4px 6px 4px 14px;font:600 .82rem system-ui,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.4)}' +
      '#bsiRV-chip.on{border-color:#1fb58f}#bsiRV-chip button{min-height:36px;min-width:36px;border-radius:999px;border:1px solid #2a8fbf;background:#082b40;color:#e8fbff;font:inherit;cursor:pointer;padding:4px 10px}#bsiRV-chip.fermo{padding-left:6px;border-color:#ffb86b}' +
      '#bsiRV-novita{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(14px + env(safe-area-inset-bottom,0px));z-index:100058;width:min(560px,calc(100vw - 24px));box-sizing:border-box;background:#04182a;color:#e8fbff;border:1px solid #2fa8e0;border-radius:14px;padding:12px 44px 12px 14px;font:400 .9rem/1.45 system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.5)}' +
      '#bsiRV-novita b{color:#7fe7ff}#bsiRV-novita p{margin:4px 0 8px}#bsiRV-novita .tasti{display:flex;flex-wrap:wrap;gap:6px}#bsiRV-novita button{min-height:40px;border-radius:9px;border:1px solid #2a8fbf;background:#082b40;color:#e8fbff;font:600 .85rem system-ui,sans-serif;padding:4px 10px;cursor:pointer}' +
      '#bsiRV-novita .chiudi{position:absolute;top:6px;right:6px;min-width:36px;min-height:36px;padding:0}' +
      '@media (prefers-reduced-motion:reduce){#bsiRV .reattore:before,#bsiRV .reattore:after,#bsiRV .nucleo{animation:none}}';
    D.head.appendChild(s);
  }
  function el(tag, attr, testo) { var e = D.createElement(tag); for (var k in attr || {}) e.setAttribute(k, attr[k]); if (testo != null) e.textContent = testo; return e; }

  /* ── 7. il disegno della rete ────────────────────────────────────────── */
  var COLORI = { ricordo: '#34d0ff', conversazione: '#ff9f43', impegno: '#ff5d73', sezione: '#7cf29a', procedura: '#c792ff', autobiografia: '#ffd24a' };
  /** Anima la rete in una tela. Restituisce {ferma, scegli(x,y)}. */
  function animaRete(tela, G, opz) {
    opz = opz || {};
    var ctx = tela.getContext('2d'), N = G.neuroni, L = G.collegamenti, W = 0, H = 0, dpr = Math.min(2, g.devicePixelRatio || 1), raf = 0, fermo = false;
    var calmo = g.matchMedia && g.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var semeR = 7; function rnd() { semeR = (semeR * 16807) % 2147483647; return semeR / 2147483647; }
    function misura() { var r = tela.getBoundingClientRect(); W = Math.max(50, r.width); H = Math.max(50, r.height); tela.width = Math.round(W * dpr); tela.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    misura();
    N.forEach(function (n) { n.x = W / 2 + (rnd() - 0.5) * W * 0.7; n.y = H / 2 + (rnd() - 0.5) * H * 0.7; n.vx = 0; n.vy = 0; n.fase = rnd() * 6.28; });
    var scelto = -1, passo = 0;
    function fisica() {
      var k = Math.sqrt(W * H / Math.max(1, N.length)) * 0.55;
      for (var i = 0; i < N.length; i++) for (var j = i + 1; j < N.length; j++) {
        var a = N[i], b = N[j], dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy + 0.01, f = k * k / d2 * 0.02;
        a.vx += dx * f; a.vy += dy * f; b.vx -= dx * f; b.vy -= dy * f;
      }
      L.forEach(function (l) { var a = N[l.a], b = N[l.b], dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy) + 0.01, f = (d - k) * 0.004; a.vx += dx / d * f * d; a.vy += dy / d * f * d; b.vx -= dx / d * f * d; b.vy -= dy / d * f * d; });
      N.forEach(function (n) {
        n.vx += (W / 2 - n.x) * 0.0016; n.vy += (H / 2 - n.y) * 0.0016;
        if (!calmo) { n.fase += 0.02; n.vx += Math.cos(n.fase) * 0.03; n.vy += Math.sin(n.fase * 1.3) * 0.03; }       // fluttuano
        n.vx *= 0.86; n.vy *= 0.86; n.x = Math.max(8, Math.min(W - 8, n.x + n.vx)); n.y = Math.max(8, Math.min(H - 8, n.y + n.vy));
      });
    }
    function disegna() {
      ctx.clearRect(0, 0, W, H);
      L.forEach(function (l) {
        var a = N[l.a], b = N[l.b], acceso = scelto === l.a || scelto === l.b;
        ctx.strokeStyle = acceso ? 'rgba(191,243,255,.85)' : 'rgba(80,190,240,' + Math.min(0.45, 0.12 + 0.08 * l.f) + ')'; ctx.lineWidth = acceso ? 1.6 : 1;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        if (!calmo && !opz.sfondo) { var t = ((passo * 0.01 + l.a * 0.13) % 1); ctx.fillStyle = 'rgba(191,243,255,.7)'; ctx.fillRect(a.x + (b.x - a.x) * t - 1, a.y + (b.y - a.y) * t - 1, 2, 2); }   // il segnale che corre
      });
      N.forEach(function (n, i) {
        var r = 3 + Math.min(6, n.peso * 0.8) + (i === scelto ? 3 : 0);
        ctx.shadowColor = COLORI[n.tipo]; ctx.shadowBlur = i === scelto ? 18 : 8; ctx.fillStyle = COLORI[n.tipo];
        ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 6.2832); ctx.fill(); ctx.shadowBlur = 0;
      });
    }
    function ciclo() { if (fermo) return; passo++; fisica(); disegna(); raf = (calmo && passo > 260) ? 0 : g.requestAnimationFrame(ciclo); if (calmo && passo === 260) disegna(); }
    if (calmo) { for (var q = 0; q < 260; q++) { passo++; fisica(); } disegna(); } else ciclo();
    var suRidim = function () { misura(); disegna(); }; g.addEventListener('resize', suRidim);
    return {
      ferma: function () { fermo = true; if (raf) g.cancelAnimationFrame(raf); g.removeEventListener('resize', suRidim); },
      scegli: function (x, y) { var m = -1, md = 26 * 26; N.forEach(function (n, i) { var d = (n.x - x) * (n.x - x) + (n.y - y) * (n.y - y); if (d < md) { md = d; m = i; } }); scelto = m; disegna(); return m >= 0 ? N[m] : null; }
    };
  }

  var rete = null;
  function apriRete() {
    chiudiRete(); stile();
    var G = grafo(), P = el('div', { id: 'bsiRN', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Rete neurale di Spectra' });
    var testa = el('div', { class: 'testa' }); testa.appendChild(el('h2', {}, 'RETE NEURALE'));
    var dx = el('div', {}); var bt = el('span', { class: 'bsiRV-batt' }); dx.appendChild(bt);
    var x = el('button', { type: 'button' }, 'Chiudi'); x.onclick = chiudiRete; dx.appendChild(x); testa.appendChild(dx); P.appendChild(testa);
    var per = { ricordo: 0, conversazione: 0, impegno: 0, sezione: 0, procedura: 0, autobiografia: 0 }; G.neuroni.forEach(function (n) { per[n.tipo]++; });
    P.appendChild(el('div', { class: 'conta', role: 'status' }, plur(G.neuroni.length, 'neurone', 'neuroni') + ' · ' + plur(G.collegamenti.length, 'collegamento', 'collegamenti')));
    var leg = el('div', { class: 'leggenda' });
    [['ricordo', 'ricordi'], ['conversazione', 'conversazioni'], ['impegno', 'impegni'], ['sezione', 'sezioni studiate'], ['procedura', 'procedure'], ['autobiografia', 'pagine di diario']].filter(function (c) { return c[0] !== 'procedura' && c[0] !== 'autobiografia' || per[c[0]]; }).forEach(function (c) { var s = el('span'); var i = el('i'); i.style.background = COLORI[c[0]]; s.appendChild(i); s.appendChild(D.createTextNode(per[c[0]] + ' ' + c[1])); leg.appendChild(s); });
    P.appendChild(leg);
    var box = el('div', { class: 'tela' }), cv = el('canvas', { role: 'img', 'aria-label': 'La rete della memoria di Spectra: ' + G.neuroni.length + ' neuroni e ' + G.collegamenti.length + ' collegamenti' });
    box.appendChild(cv); P.appendChild(box);
    var info = el('div', { class: 'scelto', 'aria-live': 'polite' }, G.neuroni.length ? 'Tocca un neurone per leggere il ricordo.' : 'La rete è ancora vuota: ogni conversazione, ricordo o impegno aggiunge un neurone.');
    P.appendChild(info);
    D.body.appendChild(P); iconaBatteria(bt);
    var A = animaRete(cv, G);
    cv.addEventListener('pointerdown', function (e) {
      var r = cv.getBoundingClientRect(), n = A.scegli(e.clientX - r.left, e.clientY - r.top);
      info.textContent = n ? ({ ricordo: '🧠 Ricordo', conversazione: '💬 Conversazione', impegno: '🗓️ Impegno', sezione: '📚 Sezione', procedura: '🧭 Procedura', autobiografia: '📔 Diario' }[n.tipo]) + ' — ' + n.testo + (n.peso ? ' · ' + n.peso + (n.peso === 1 ? ' collegamento' : ' collegamenti') : '') : 'Nessun neurone qui.';
    });
    rete = { el: P, anima: A, grafo: G };
    return rete;
  }
  function chiudiRete() { if (rete) { rete.anima.ferma(); if (rete.el.parentNode) rete.el.parentNode.removeChild(rete.el); rete = null; } }

  /* ── 7 bis. la modalità occhiali: Spectra risponde al suo nome ───────────
     Gli occhiali Ray-Ban Meta, per il telefono, sono cuffie Bluetooth: ciò che
     Spectra dice esce dai loro altoparlanti. Con questa modalità la pagina
     resta in ascolto del nome («Spectra, …», «sveglia Spectra»), tiene lo
     schermo acceso (altrimenti il telefono si addormenta e l'ascolto si ferma)
     e lo ricorda: alla prossima apertura riparte da sola. Se il browser non la
     lascia ripartire senza un tocco, compare il pulsante per riprenderla. */
  var wl = null, chip = null;
  function riconoscimento() { return !!(g.SpeechRecognition || g.webkitSpeechRecognition); }
  function tieniSveglio() {
    try { if (!S.ascolto || D.hidden || wl || !g.navigator.wakeLock) return; g.navigator.wakeLock.request('screen').then(function (x) { wl = x; if (x.addEventListener) x.addEventListener('release', function () { wl = null; }); }).catch(function () {}); } catch (e) {}
  }
  function lasciaDormire() { try { if (wl) wl.release(); } catch (e) {} wl = null; }
  function mostraChip(modo) {
    stile();
    if (!chip) { chip = el('div', { id: 'bsiRV-chip', role: 'status' }); D.body.appendChild(chip); }
    chip.textContent = ''; chip.className = modo;
    if (modo === 'on') chip.appendChild(el('span', {}, '👓 In ascolto: di\' «Spectra…»'));
    else { var b = el('button', { type: 'button', class: 'riprendi' }, '👓 Tocca per riprendere l\'ascolto'); b.onclick = function () { occhiali(true); }; chip.appendChild(b); }
    var x = el('button', { type: 'button', 'aria-label': 'Spegni la modalità occhiali' }, '✕'); x.onclick = function () { occhiali(false); }; chip.appendChild(x);
  }
  function togliChip() { if (chip && chip.parentNode) chip.parentNode.removeChild(chip); chip = null; }
  /** Accende o spegne la modalità occhiali. Restituisce {attivo, motivo}. */
  function occhiali(acceso) {
    var L = g.BSISpectraLive, sen = L && L.sentinella;
    if (!acceso) { S.ascolto = false; salva(); if (sen && sen.ferma) sen.ferma(); lasciaDormire(); togliChip(); aggiornaGuida(); return { attivo: false }; }
    if (!riconoscimento() || !sen) { S.ascolto = false; salva(); aggiornaGuida(); return { attivo: false, motivo: 'senza riconoscimento' }; }
    S.ascolto = true; salva();
    var ok = (sen.attiva && sen.attiva()) || sen.avvia();
    if (!ok) { mostraChip('fermo'); aggiornaGuida(); return { attivo: false, motivo: 'bloccato' }; }
    tieniSveglio(); mostraChip('on'); aggiornaGuida();
    return { attivo: true };
  }
  D.addEventListener('bsi-spectra-ascolto-negato', function () { if (S.ascolto) { lasciaDormire(); mostraChip('fermo'); } });
  D.addEventListener('visibilitychange', function () {
    if (D.hidden || !S.ascolto) return;
    tieniSveglio();
    var L = g.BSISpectraLive, sen = L && L.sentinella;
    if (sen && sen.attiva && !sen.attiva()) { if (sen.avvia()) mostraChip('on'); else mostraChip('fermo'); }       // il telefono l'aveva fermata: riparte
  });

  /* la guida: come chiamarlo dagli occhiali e da ogni dispositivo */
  var guide = [];
  function aggiornaGuida() {
    guide.forEach(function (G) {
      G.o.textContent = S.ascolto ? '👓 Modalità occhiali: ACCESA' : '👓 Accendi la modalità occhiali'; G.o.setAttribute('aria-pressed', String(!!S.ascolto));
      G.a.textContent = S.avvioSveglia ? '🌅 Sveglia all\'apertura: SÌ' : '🌅 Sveglia Spectra a ogni apertura'; G.a.setAttribute('aria-pressed', String(!!S.avvioSveglia));
    });
  }
  function guidaDispositivi() {
    stile();
    var sc = el('div', { class: 'scorciatoie' });
    sc.innerHTML =
      '<h3>👓 Dagli occhiali Meta</h3><ol>' +
      '<li>Gli occhiali restano collegati al telefono come sempre (app Meta AI).</li>' +
      '<li>Sul telefono apri BioSpecInfo e tocca <b>Accendi la modalità occhiali</b> qui sotto; consenti il microfono.</li>' +
      '<li>Parla: <b>«Spectra, che tempo fa?»</b>, <b>«Spectra, ricordami alle 18 di…»</b>, <b>«sveglia Spectra»</b>. La risposta arriva negli altoparlanti degli occhiali.</li></ol>' +
      '<p class="nota">Da sapere: «Hey Meta» è dell\'assistente di Meta e non può aprire altre app; per questo Spectra ascolta dal telefono. L\'app deve restare aperta, e lo schermo lo tiene acceso Spectra. Il microfono lo sceglie il telefono: su iPhone di solito è quello degli occhiali, su Android può restare quello del telefono, quindi tienilo vicino.</p>' +
      '<h3>📱 iPhone, iPad e Mac: «Ehi Siri, sveglia Spectra»</h3><ol>' +
      '<li>App <b>Comandi</b> → <b>+</b> → «Apri URL».</li><li>Incolla il link qui sotto (c\'è il pulsante per copiarlo).</li><li>Chiama il comando <b>Sveglia Spectra</b>. Da quel momento basta dirlo a Siri.</li></ol>' +
      '<h3>🤖 Android: «Ok Google, apri BioSpecInfo»</h3><ol>' +
      '<li>Installa l\'app sulla Home (menu ✨ → Aggiungi a Home).</li><li>Accendi qui sotto <b>Sveglia Spectra a ogni apertura</b>.</li><li>«Ok Google, apri BioSpecInfo»: si apre e Spectra si sveglia. In più, tenendo premuta l\'icona compare «Sveglia Spectra».</li></ol>' +
      '<h3>💻 Computer</h3><p>Lascia aperta la scheda con la modalità occhiali accesa: dalla stanza basta «sveglia Spectra» o «Spectra, …». Sul Mac funziona anche il comando di Siri.</p>' +
      '<p class="link">Link: <code></code></p>';
    sc.querySelector('code').textContent = linkScorciatoia();
    var riga = el('div', { class: 'interruttori' });
    var o = el('button', { type: 'button', class: 'primo', 'aria-pressed': 'false' }); o.onclick = function () { var r = occhiali(!S.ascolto); if (r.motivo === 'senza riconoscimento') esito.textContent = 'Questo browser non riconosce la voce in continuo: usa Chrome (Android, computer) o Safari (iPhone).'; else if (r.motivo === 'bloccato') esito.textContent = 'Il browser ha fermato il microfono: tocca «riprendi» in alto, e consenti il microfono a questa pagina.'; else esito.textContent = r.attivo ? 'Sono in ascolto. Di\' «Spectra» e poi la domanda.' : 'Ascolto spento.'; };
    var a = el('button', { type: 'button', 'aria-pressed': 'false' }); a.onclick = function () { S.avvioSveglia = !S.avvioSveglia; salva(); aggiornaGuida(); esito.textContent = S.avvioSveglia ? 'Da ora, ogni volta che apri l\'app, Spectra si sveglia.' : 'All\'apertura Spectra non si sveglierà più da solo.'; };
    var cp = el('button', { type: 'button' }, 'Copia il link'); cp.onclick = function () { try { g.navigator.clipboard.writeText(linkScorciatoia()).then(function () { cp.textContent = 'Copiato ✓'; }, function () { cp.textContent = 'Copia a mano il link sopra'; }); } catch (e) { cp.textContent = 'Copia a mano il link sopra'; } };
    [o, a, cp].forEach(function (b) { riga.appendChild(b); }); sc.appendChild(riga);
    var esito = el('div', { class: 'esito', role: 'status' }); sc.appendChild(esito);
    guide.push({ o: o, a: a }); guide = guide.filter(function (G) { return G.o.isConnected || G.o === o; }); aggiornaGuida();
    return sc;
  }
  var dispositivi = null;
  function apriGuida() {
    chiudiGuida(); stile();
    var P = el('div', { id: 'bsiRD', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Chiama Spectra da occhiali e dispositivi' });
    var testa = el('div', { class: 'testa' }); testa.appendChild(el('h2', {}, 'CHIAMA SPECTRA'));
    var x = el('button', { type: 'button' }, 'Chiudi'); x.onclick = chiudiGuida; testa.appendChild(x); P.appendChild(testa);
    P.appendChild(guidaDispositivi()); D.body.appendChild(P); dispositivi = P; return P;
  }
  function chiudiGuida() { if (dispositivi && dispositivi.parentNode) dispositivi.parentNode.removeChild(dispositivi); dispositivi = null; }

  /* ── 8. la sequenza di risveglio ─────────────────────────────────────── */
  var sv = null;
  function cervello() {
    var k = leggiJSON('bsi_api_keys', {}) || {}, n = Object.keys(k).filter(function (x) { return k[x] && String(k[x]).length > 8; });
    var nomi = { gemini: 'Gemini', groq: 'Groq', anthropic: 'Claude', claude: 'Claude', openai: 'OpenAI', openrouter: 'OpenRouter', xai: 'Grok', mistral: 'Mistral', deepseek: 'DeepSeek', cerebras: 'Cerebras' };
    var proxy = !!(g.bsiProxy && g.bsiProxy.url && g.bsiProxy.url());
    return n.length || proxy ? { ok: true, testo: 'stabilito' + (n.length ? ' (' + n.map(function (x) { return nomi[x] || x; }).slice(0, 3).join(', ') + ')' : '') } : { ok: false, testo: 'in locale: calcoli e comandi dell\'app' };
  }
  function linkScorciatoia() { var u = g.location.href.split('#')[0].split('?')[0]; return u.replace(/[^/]*$/, '') + 'index.html?spectra=sveglia'; }
  function chiudiRisveglio() { if (sv) { if (sv.anima) sv.anima.ferma(); sv.timer.forEach(clearTimeout); if (sv.el.parentNode) sv.el.parentNode.removeChild(sv.el); sv = null; } }

  /** La sequenza: le righe di avvio, poi il punto detto a voce. `opz.tocca`: aspetta un tocco prima di parlare (aperta da una scorciatoia: il browser vuole un gesto per far parlare la pagina). */
  function risveglio(opz) {
    opz = opz || {}; chiudiRisveglio(); stile(); carica();
    if (!S.armato) { S.armato = true; salva(); }               // da ora, il punto delle 8 e delle 20
    var G = grafo(), A = g.BSISpectraAgenda, C = cervello(), voceOk = 'speechSynthesis' in g;
    var memoria = leggiJSON('bsi_ai_memory', []), mente = leggiJSON('bsi-spectra-mente-v1', {}) || {};
    var P = el('div', { id: 'bsiRV', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Risveglio di Spectra' });
    var sf = el('canvas', { class: 'sfondo', 'aria-hidden': 'true' }); P.appendChild(sf);
    var testa = el('div', { class: 'testa' }); testa.appendChild(el('h2', {}, 'S.P.E.C.T.R.A.')); var bt = el('span', { class: 'bsiRV-batt' }); testa.appendChild(bt); P.appendChild(testa);
    var re = el('div', { class: 'reattore', 'aria-hidden': 'true' }); re.appendChild(el('div', { class: 'nucleo' })); P.appendChild(re);
    var righe = [
      ['Inizializzazione dei sistemi', 'completata', true],
      ['Rete neurale', 'online · ' + plur(G.neuroni.length, 'neurone', 'neuroni') + ', ' + plur(G.collegamenti.length, 'collegamento', 'collegamenti'), true],
      ['Collegamento al cervello', C.testo, C.ok],
      ['Memoria', plur(Array.isArray(memoria) ? memoria.length : 0, 'ricordo', 'ricordi') + ' · ' + plur((mente.episodi || []).length, 'conversazione', 'conversazioni') + ' · ' + plur(A ? A.aperti().length : 0, 'impegno', 'impegni'), true],
      ['Meteo', S.citta ? S.citta : 'nessuna città: «abito a …»', !!S.citta],
      ['Sintesi vocale', voceOk ? 'pronta' : 'non disponibile in questo browser', voceOk]
    ];
    var ol = el('ol', { class: 'stato', 'aria-live': 'polite' });
    righe.forEach(function (r) { var li = el('li'); li.appendChild(el('span', {}, r[0])); li.appendChild(el('span', { class: r[2] ? 'ok' : 'no' }, r[1])); ol.appendChild(li); });
    P.appendChild(ol);
    var msg = el('div', { class: 'messaggio', role: 'status' }, '…'); P.appendChild(msg);
    var az = el('div', { class: 'azioni' });
    var bc = el('button', { type: 'button', class: 'primo' }, '🎙️ Parla con Spectra'); bc.onclick = function () { chiudiRisveglio(); var L = g.BSISpectraLive; if (L && L.apri) L.apri({ briefing: false }); };
    var ba = el('button', { type: 'button' }, '🗓️ Agenda'); ba.onclick = function () { chiudiRisveglio(); if (A) A.apri(); };
    var br = el('button', { type: 'button' }, '🧠 Rete neurale'); br.onclick = function () { chiudiRisveglio(); apriRete(); };
    var bs = el('button', { type: 'button', 'aria-expanded': 'false' }, '👓 Occhiali, Siri e altri dispositivi');
    var bx = el('button', { type: 'button' }, 'Chiudi'); bx.onclick = chiudiRisveglio;
    [bc, ba, br, bs, bx].forEach(function (b) { az.appendChild(b); }); P.appendChild(az);
    var sc = guidaDispositivi(); sc.setAttribute('hidden', ''); P.appendChild(sc);
    bs.onclick = function () { var h = sc.hasAttribute('hidden'); if (h) sc.removeAttribute('hidden'); else sc.setAttribute('hidden', ''); bs.setAttribute('aria-expanded', String(h)); };
    D.body.appendChild(P); iconaBatteria(bt);
    sv = { el: P, timer: [], anima: null, testo: null };
    try { sv.anima = animaRete(sf, G, { sfondo: true }); } catch (e) {}
    var lis = ol.querySelectorAll('li'), passo = opz.rapido ? 30 : 420;
    [].forEach.call(lis, function (li, i) { sv.timer.push(setTimeout(function () { li.classList.add('vis'); }, passo * (i + 1))); });
    var intro = 'Inizializzazione dei sistemi completata. Rete neurale online. ' + (C.ok ? 'Collegamento al cervello stabilito. ' : 'Lavoro in locale: nessun fornitore collegato. ') + (voceOk ? 'Sintesi vocale pronta. ' : '');
    var mio = sv;
    return new Promise(function (fine) {
      sv.timer.push(setTimeout(function () {
        punto('risveglio').then(function (p) {
          if (sv !== mio) return fine(null);
          var tutto = intro + p; mio.testo = tutto; msg.textContent = p;
          var vai = function () { di(tutto); fine(tutto); };
          var attivo = !opz.tocca || (g.navigator.userActivation ? g.navigator.userActivation.hasBeenActive : true);
          if (attivo) vai();
          else {
            var t = el('button', { type: 'button', class: 'primo tocca' }, '🔊 Tocca per svegliare Spectra');
            t.onclick = function () { if (t.parentNode) t.parentNode.removeChild(t); vai(); }; P.insertBefore(t, az); try { t.focus({ preventScroll: true }); } catch (e) {}
          }
        });
      }, passo * (lis.length + 1)));
    });
  }
  D.addEventListener('keydown', function (e) { if (e.key !== 'Escape') return; if (sv) chiudiRisveglio(); if (rete) chiudiRete(); if (dispositivi) chiudiGuida(); });

  /* ── 9. il punto alle 8 e alle 20 ────────────────────────────────────── */
  var FASCE = [{ h: 8, tipo: 'mattina', fino: 12 }, { h: 20, tipo: 'sera', fino: 24 }];
  /** Controlla se è ora del punto. Restituisce la promessa del testo, o null. Lo fa una volta per fascia al giorno. */
  function controllaPunto(ora) {
    if (!S.armato || !S.briefing) return null;
    var d = new Date(ora == null ? adesso() : ora), h = d.getHours();
    for (var i = 0; i < FASCE.length; i++) {
      var F = FASCE[i], k = giornoChiave(d) + '-' + F.h;
      if (h >= F.h && h < F.fino && !S.fatti[k]) {
        S.fatti[k] = 1; var tieni = {}; Object.keys(S.fatti).sort().slice(-10).forEach(function (x) { tieni[x] = 1; }); S.fatti = tieni; salva();
        return punto(F.tipo, ora).then(function (p) {
          var A = g.BSISpectraAgenda; if (A && A.avviso) A.avviso((F.tipo === 'sera' ? '🌙 ' : '🌅 ') + p);
          if (A && A.notifica) A.notifica(p);
          di(p);
          try { D.dispatchEvent(new CustomEvent('bsi-spectra-punto', { detail: { tipo: F.tipo, testo: p } })); } catch (e) {}
          return p;
        });
      }
    }
    return null;
  }

  /* ── 10. i comandi ───────────────────────────────────────────────────── */
  function comando(frase) {
    var t = norm(frase).trim().replace(/^(ehi |hey |ok )?(spectra|spettra)[\s,]*/, '').replace(/^(per favore |puoi |potresti )/, '').replace(/[?!.]+$/, '').trim(), m;
    if (/^(svegliati|sveglia|risvegliati|accenditi|inizializza(ti)?|avvia i sistemi|wake up)( spectra| spettra)?$/.test(t) || /^(svegliati|sveglia) (spectra|spettra)$/.test(norm(frase).replace(/[?!.,]+/g, '').trim())) {
      risveglio(); return { testo: 'Sequenza di risveglio avviata.', muto: true };
    }
    if (/^(sono a casa|sono tornato|sono tornata|eccomi|sono qui|papa e a casa|sono rientrato|sono rientrata)$/.test(t)) return { testo: 'Bentornato.', promessa: punto('casa') };
    if (/^(fammi il punto|il punto della situazione|briefing|com'e la situazione|cosa mi sono perso|aggiornami)$/.test(t)) return { testo: 'Faccio il punto…', promessa: punto('risveglio') };
    if ((m = /^(?:abito a|vivo a|sono di|la mia citta e|imposta (?:la )?(?:mia )?citta(?: a)?|cambia citta(?: a)?)\s+(.+)$/.exec(t))) {
      var nc = m[1].replace(/^(a|ad|in)\s+/, '');
      return { testo: 'Cerco ' + nc + '…', promessa: impostaCitta(nc).then(function (l) { return 'Segnato: ' + l.citta + (l.paese ? ', ' + l.paese : '') + '. Ti dirò il meteo da lì.'; }, function (e) { return 'Non trovo «' + nc + '». Prova con il nome della città e basta.'; }) };
    }
    if ((m = /^(?:che tempo fa|com'e il tempo|che tempo c'e|meteo|previsioni(?: del tempo)?|piove|fa freddo|fa caldo)(?:\s+(oggi|domani))?(?:\s+(?:a|ad|in)\s+(.+?))?(?:\s+(oggi|domani))?$/.exec(t))) {
      var quando = m[1] || m[3] || 'oggi', dove = m[2];
      var pr = (dove ? trovaCitta(dove).then(function (l) { return meteo(l); }) : (S.citta ? meteo() : Promise.reject(new Error('senza città'))))
        .then(function (x) { return fraseMeteo(x, quando); }, function (e) { return /senza città/.test(e.message) ? 'Dimmi dove sei: «abito a Milano». Oppure chiedi «che tempo fa a Roma».' : /non trovo/.test(e.message) ? 'Non trovo «' + dove + '».' : 'Il servizio del meteo non risponde: sei collegato a internet?'; });
      return { testo: 'Controllo il meteo…', promessa: pr };
    }
    if (/^(batteria|quanta batteria (ho|hai|c'e)|livello (della )?batteria|come sta la batteria)$/.test(t)) {
      if (B.livello == null) return { testo: 'Questo browser non mi fa vedere la batteria: Safari non la espone, Chrome sì.' };
      return { testo: 'Batteria al ' + Math.round(B.livello * 100) + ' per cento' + (B.carica ? ', in carica.' : B.bassa ? '. Collega il caricatore.' : '.') };
    }
    if (/^(mostrami |fammi vedere |apri )?(la )?(tua )?(rete neurale|il tuo cervello|i tuoi neuroni|la tua mente|il cervello)$/.test(t)) {
      var R = apriRete(); return { testo: 'La mia rete: ' + plur(R.grafo.neuroni.length, 'neurone', 'neuroni') + ' e ' + plur(R.grafo.collegamenti.length, 'collegamento', 'collegamenti') + '. Ogni punto è un ricordo: toccalo per leggerlo.' };
    }
    if (/^(modalita occhiali|attiva (la )?modalita occhiali|accendi (la )?modalita occhiali|ascoltami sempre|resta in ascolto|sempre in ascolto|ascolta sempre)$/.test(t)) {
      var ro = occhiali(true);
      return { testo: ro.attivo ? 'Modalità occhiali accesa: resto in ascolto e tengo lo schermo acceso. Di\' «Spectra» e poi la domanda, oppure «sveglia Spectra».'
        : ro.motivo === 'senza riconoscimento' ? 'Questo browser non riconosce la voce in continuo: usa Chrome su Android o sul computer, Safari su iPhone.' : 'Il browser ha fermato il microfono: tocca «riprendi l\'ascolto» in basso e consenti il microfono.' };
    }
    if (/^(smetti di ascoltare|basta ascoltare|non ascoltare piu|spegni (la )?modalita occhiali|disattiva (la )?modalita occhiali)$/.test(t)) { occhiali(false); return { testo: 'Ascolto spento. Lo schermo può tornare a spegnersi.' }; }
    if (/^(attiva|accendi) (la )?sveglia all'?apertura$/.test(t)) { S.avvioSveglia = true; salva(); aggiornaGuida(); return { testo: 'Da ora, ogni volta che apri l\'app, mi sveglio.' }; }
    if (/^(disattiva|spegni) (la )?sveglia all'?apertura$/.test(t)) { S.avvioSveglia = false; salva(); aggiornaGuida(); return { testo: 'All\'apertura non mi sveglierò più da solo.' }; }
    if (/^(come ti chiamo|come ti chiamo dagli occhiali|collega (gli )?occhiali|collegati agli occhiali|occhiali meta|come ti sveglio)$/.test(t)) { apriGuida(); return { testo: 'Ti mostro come chiamarmi dagli occhiali, con Siri e dagli altri dispositivi.' }; }
    if (/^(disattiva|spegni|niente) (il |i )?(punto|briefing|punti)( delle 8 e delle 20)?$/.test(t)) { S.briefing = false; salva(); return { testo: 'Va bene: niente punto alle 8 e alle 20. Dimmi «attiva il punto» per riaverlo.' }; }
    if (/^(attiva|accendi|riattiva) (il |i )?(punto|briefing|punti)( delle 8 e delle 20)?$/.test(t)) { S.briefing = true; S.armato = true; salva(); return { testo: 'Attivo: alle 8 il punto del mattino, alle 20 quello della sera, quando l\'app è aperta.' }; }
    return null;
  }

  /* ── 11. lo strumento per il modello ─────────────────────────────────── */
  var STRUMENTO = { name: 'meteo',
    description: "Il meteo reale (Open-Meteo, gratuito): adesso, oggi e domani, per una città. Senza città usa quella dell'utente, se l'ha detta. Usalo quando chiede che tempo fa, se piove, se serve l'ombrello, o per organizzare la giornata.",
    parameters: { type: 'object', properties: { citta: { type: 'string', description: 'La città; vuota per quella dell\'utente.' }, giorno: { type: 'string', enum: ['oggi', 'domani'] } } },
    execute: function (a) {
      var dove = a && a.citta;
      return (dove ? trovaCitta(dove).then(meteo) : (S.citta ? meteo() : Promise.reject(new Error('l\'utente non ha detto la sua città: chiedigliela'))))
        .then(function (m) { return { ok: true, citta: m.citta, frase: fraseMeteo(m, a && a.giorno), adesso: { temperatura: m.ora.t, percepita: m.ora.p, umidita: m.ora.u, vento_kmh: m.ora.vento, cielo: cielo(m.ora.codice) }, oggi: { min: m.giorni[0].min, max: m.giorni[0].max, cielo: cielo(m.giorni[0].codice), pioggia_pct: m.giorni[0].pioggia }, domani: { min: m.giorni[1].min, max: m.giorni[1].max, cielo: cielo(m.giorni[1].codice), pioggia_pct: m.giorni[1].pioggia } }; },
          function (e) { return { ok: false, error: e.message }; });
    } };
  function registraStrumento() { var T = g.BSI_AI_TOOLS; if (!T || !T.push) return false; if (!T.some(function (x) { return x.name === 'meteo'; })) T.push(STRUMENTO); return true; }

  /* ── le novità: chi usa già l'app le vede una volta, a portata di dito ─── */
  var NOVITA = 'bsi-spectra-novita-v252';
  function novita(forza) {
    var gia = false; try { gia = !!g.localStorage.getItem(NOVITA); } catch (e) {}
    if (gia && !forza) return null;
    if (!forza) { var M = leggiJSON('bsi-spectra-mente-v1', {}) || {}; if (!M.episodi || M.episodi.length < 3) return null; }      // solo a chi ha già parlato con Spectra
    try { g.localStorage.setItem(NOVITA, '1'); } catch (e) {}
    stile();
    var vecchio = D.getElementById('bsiRV-novita'); if (vecchio) vecchio.parentNode.removeChild(vecchio);
    var P = el('div', { id: 'bsiRV-novita', role: 'dialog', 'aria-label': 'Novità di Spectra' });
    P.appendChild(el('b', {}, 'Novità di Spectra'));
    P.appendChild(el('p', {}, 'Si sveglia e ti dice meteo e impegni, ascolta dagli occhiali Meta, ricorda i promemoria, mostra la sua memoria. Sono anche nel menu ✨, in cima.'));
    var riga = el('div', { class: 'tasti' });
    [['🌅 Sveglia Spectra', function () { risveglio(); }], ['👓 Occhiali e dispositivi', apriGuida], ['🗓️ Agenda', function () { if (g.BSISpectraAgenda) g.BSISpectraAgenda.apri(); }], ['🧠 Rete neurale', apriRete]].forEach(function (x) {
      var b = el('button', { type: 'button' }, x[0]); b.onclick = function () { chiudiN(); x[1](); }; riga.appendChild(b);
    });
    P.appendChild(riga);
    var c = el('button', { type: 'button', class: 'chiudi', 'aria-label': 'Chiudi le novità' }, '✕'); c.onclick = chiudiN; P.appendChild(c);
    function chiudiN() { if (P.parentNode) P.parentNode.removeChild(P); }
    D.body.appendChild(P);
    return P;
  }

  /* ── avvio ───────────────────────────────────────────────────────────── */
  function daUrl() {
    var q = /[?&]spectra=([a-z]+)/.exec(g.location.search || ''); if (!q) return false;
    try { g.history.replaceState(null, '', g.location.pathname + g.location.hash); } catch (e) {}
    setTimeout(function () {
      if (q[1] === 'sveglia') risveglio({ tocca: true });
      else if (q[1] === 'agenda' && g.BSISpectraAgenda) g.BSISpectraAgenda.apri();
      else if (q[1] === 'rete') apriRete();
      else if (q[1] === 'ascolto') occhiali(true);
    }, 900);
    return true;
  }
  function avvia() {
    carica();
    if (!registraStrumento()) { var k = 0, t = setInterval(function () { if (registraStrumento() || ++k > 40) clearInterval(t); }, 500); }
    seguiBatteria();
    var daScorciatoia = daUrl();
    if (!daScorciatoia && S.avvioSveglia) setTimeout(function () { risveglio({ tocca: true }); }, 1200);       // «Ok Google, apri BioSpecInfo» → Spectra si sveglia
    if (S.ascolto) setTimeout(function () { occhiali(true); }, 1500);                                         // la modalità occhiali riparte da sola
    if (!daScorciatoia && !S.avvioSveglia) setTimeout(function () { novita(); }, 2500);
    setTimeout(function () { if (!D.hidden) controllaPunto(); }, 6000);
    setInterval(function () { if (!D.hidden) controllaPunto(); }, 30000);
    D.addEventListener('visibilitychange', function () { if (!D.hidden) controllaPunto(); });
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', avvia); else avvia();

  g.BSISpectraRisveglio = {
    comando: comando, risveglio: risveglio, occhiali: occhiali, novita: novita, apriGuida: apriGuida, chiudiGuida: chiudiGuida, chiudi: chiudiRisveglio, punto: punto, controllaPunto: controllaPunto, meteo: meteo, fraseMeteo: fraseMeteo, trovaCitta: trovaCitta, impostaCitta: impostaCitta,
    cielo: cielo, fraseImpegni: fraseImpegni, grafo: grafo, apriRete: apriRete, chiudiRete: chiudiRete, batteria: batteria, strumento: STRUMENTO, link: linkScorciatoia,
    stato: function () { return JSON.parse(JSON.stringify(S)); }, imposta: function (o) { for (var k in o) if (k in S) S[k] = o[k]; salva(); }, ricarica: carica
  };
})(typeof window !== 'undefined' ? window : globalThis);
