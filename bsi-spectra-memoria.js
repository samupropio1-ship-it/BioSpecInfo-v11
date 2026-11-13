/* ═══════════════════════════════════════════════════════════════════════════
   bsi-spectra-memoria.js — la memoria di Spectra in cinque livelli, nell'app
   BioSpecInfo · © Samuele Pio Provenzano

   PERCHE' ESISTE (v254, fase 1 del progetto: progetto/PROGETTO-BIOSPECINFO-SPECTRA.md §2)
   Prima la memoria dell'app era in tre posti che non si parlavano: i fatti
   salvati dal modello (bsi_ai_memory, al massimo 40, tutti nel prompt), la mente
   (episodi e tempo per sezione) e l'agenda. Ora c'è un archivio solo, con lo
   schema del servizio Spectra 2.0, e cinque livelli:

     lavoro          la conversazione in corso (resta della Chat e della console)
     episodio        che cosa è successo: una domanda, un errore, una sezione studiata
     fatto           che cosa è vero di lui e dei suoi concetti (semantica)
     procedura       come preferisce studiare ed essere aiutato
     autobiografia   la storia del rapporto: una pagina al giorno, un capitolo al mese

   · IL RECUPERO: per ogni domanda il modello riceve i pochi ricordi pertinenti,
     scelti con sei segnali (significato, parole in comune, recenza con oblio
     R = e^(−Δt/S), importanza, sezione aperta, obiettivi) più la diffusione ai
     ricordi collegati e la diversità. Non tutta la memoria: quella che serve.
   · LA CURA: alla prima apertura del giorno Spectra consolida (dagli episodi ai
     fatti), impara le procedure, archivia ciò che è sbiadito e non conta, scrive
     la pagina di diario del giorno prima e, a mese nuovo, il capitolo del mese.
     Senza modello linguistico: regole dichiarate e verificabili.
   · LA PERSISTENZA: IndexedDB, con una copia in memoria per rispondere subito.
     Viaggia con «esporta la memoria». Ogni ricordo porta il dispositivo e un
     orologio, pronti per la sincronizzazione con il servizio (fase 6).

   ONESTA'
   · L'incorporamento è locale (parole e sillabe, nessun modello): riconosce le
     parole, non i sinonimi. Per questo il recupero usa anche le parole in comune.
   · Le procedure dedotte partono con fiducia bassa e salgono solo se il
     comportamento si ripete; quelle dette dall'utente partono alte.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  var D = g.document, DB = 'bsi-spectra-memoria', VER = 1, STORE = 'ricordi', STATO = 'bsi-spectra-memoria-stato';
  var TIPI = ['episodio', 'fatto', 'procedura', 'autobiografia', 'riflessione'];
  var cache = [], pronta = false, attesi = [], db = null, dispositivo = '', contatore = 0;

  function adesso() { return Date.now(); }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function leggiJSON(k, d) { try { var x = JSON.parse(g.localStorage.getItem(k) || 'null'); return x == null ? d : x; } catch (e) { return d; } }
  function scriviJSON(k, v) { try { g.localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function giorno(t) { var d = new Date(t); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }

  /* ── 1. le parole e l'incorporamento locale ── */
  var VUOTE = /^(della|delle|degli|dello|nella|nelle|sulla|sulle|dalla|dalle|questo|questa|quello|quella|come|cosa|perche|quando|sono|hai|che|per|con|una|uno|gli|del|dei|non|piu|anche|molto|tutto|tutti|spectra|spettra|essere|fare|puoi|potresti|dimmi|spiegami|vorrei|calcola|quanto|quale|quali|dove|allora|ciao|grazie|sempre|ancora|ogni|fra|tra|mio|mia|suo|sua|loro|ecco|cioe|ricorda|ricordami)$/;
  function radice(p) { return p.length > 6 ? p.slice(0, p.length - 2) : p.length > 4 ? p.slice(0, p.length - 1) : p; }
  function parole(s) { return norm(s).replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(function (p) { return p.length > 2 && !VUOTE.test(p); }); }
  var DIM = 256;
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  /** Vettore di 256 componenti da parole (radici) e trigrammi di lettere, normalizzato. */
  function incorpora(testo) {
    var v = new Float32Array(DIM), ps = parole(testo);
    ps.forEach(function (p) { var r = radice(p); v[hash('w:' + r) % DIM] += 1; var q = '#' + r + '#'; for (var i = 0; i + 3 <= q.length; i++) v[hash('t:' + q.substr(i, 3)) % DIM] += 0.35; });
    var n = 0; for (var k = 0; k < DIM; k++) n += v[k] * v[k]; n = Math.sqrt(n) || 1;
    var out = []; for (var j = 0; j < DIM; j++) out.push(+(v[j] / n).toFixed(4));
    return out;
  }
  function coseno(a, b) { if (!a || !b) return 0; var s = 0; for (var i = 0; i < a.length; i++) s += a[i] * b[i]; return s; }

  /* ── 2. l'archivio ── */
  function apri() {
    return new Promise(function (ok) {
      try {
        if (!g.indexedDB) return ok(null);
        var r = g.indexedDB.open(DB, VER);
        r.onupgradeneeded = function () { var d = r.result; if (!d.objectStoreNames.contains(STORE)) { var s = d.createObjectStore(STORE, { keyPath: 'id' }); s.createIndex('tipo', 'tipo'); s.createIndex('creato', 'creato'); } };
        r.onsuccess = function () { ok(r.result); };
        r.onerror = function () { ok(null); };
      } catch (e) { ok(null); }
    });
  }
  function tutti(d) {
    return new Promise(function (ok) {
      if (!d) return ok(leggiJSON(DB + '-riserva', []));                 /* senza IndexedDB (navigazione privata): riserva in localStorage */
      try { var r = d.transaction(STORE, 'readonly').objectStore(STORE).getAll(); r.onsuccess = function () { ok(r.result || []); }; r.onerror = function () { ok([]); }; } catch (e) { ok([]); }
    });
  }
  function salva(rec) {
    if (!db) { scriviJSON(DB + '-riserva', cache.slice(-2000)); return; }
    try { db.transaction(STORE, 'readwrite').objectStore(STORE).put(rec); } catch (e) {}
  }
  function togli(id) {
    if (!db) { scriviJSON(DB + '-riserva', cache); return; }
    try { db.transaction(STORE, 'readwrite').objectStore(STORE).delete(id); } catch (e) {}
  }
  function quandoPronta() { return pronta ? Promise.resolve() : new Promise(function (ok) { attesi.push(ok); }); }

  /** Scrive un ricordo. Se esiste già un ricordo dello stesso tipo con la stessa chiave, lo rafforza invece di duplicarlo. */
  function scrivi(tipo, testo, opz) {
    opz = opz || {}; testo = String(testo || '').trim(); if (!testo || TIPI.indexOf(tipo) < 0) return null;
    var t = opz.creato || adesso(), chiave = opz.chiave || null;
    var gia = cache.filter(function (r) { return r.tipo === tipo && !r.archiviato && ((chiave && r.chiave === chiave) || norm(r.testo) === norm(testo)); })[0];
    if (gia) {
      gia.testo = testo; gia.ultimo_accesso = t; gia.accessi++; gia.stabilita = Math.min(3650, gia.stabilita * 1.5);
      gia.fiducia = Math.min(0.99, Math.max(gia.fiducia, opz.fiducia || 0) + 0.05); if (opz.importanza) gia.importanza = Math.max(gia.importanza, opz.importanza);
      gia.vettore = incorpora(testo + ' ' + (opz.concetti || []).join(' ')); gia.orologio = t; salva(gia); return gia;
    }
    var r = { id: dispositivo + '-' + t.toString(36) + '-' + (++contatore), tipo: tipo, testo: testo.slice(0, 600), chiave: chiave,
      creato: t, ultimo_accesso: t, accessi: 0, importanza: opz.importanza != null ? opz.importanza : 0.5, fiducia: opz.fiducia != null ? opz.fiducia : 0.6,
      stabilita: opz.stabilita || ({ episodio: 7, fatto: 60, procedura: 90, autobiografia: 3650, riflessione: 30 }[tipo]),
      fonte: opz.fonte || 'app', sezione: opz.sezione || null, concetti: (opz.concetti || parole(testo).slice(0, 6)).slice(0, 8),
      legami: opz.legami || [], dispositivo: dispositivo, orologio: t, fissato: !!opz.fissato, archiviato: false };
    r.vettore = incorpora(testo + ' ' + r.concetti.join(' '));
    cache.push(r); salva(r);
    return r;
  }
  function elenco(tipo, tuttiAnche) { return cache.filter(function (r) { return (!tipo || r.tipo === tipo) && (tuttiAnche || !r.archiviato); }).sort(function (a, b) { return b.creato - a.creato; }); }
  /** Cancella davvero i ricordi che contengono tutte le parole indicate. Restituisce quanti. */
  function dimentica(cosa) {
    var p = parole(cosa); if (!p.length) return 0;
    var via = cache.filter(function (r) { var t = norm(r.testo); return p.every(function (w) { return t.indexOf(w) >= 0; }); });
    via.forEach(function (r) { togli(r.id); }); cache = cache.filter(function (r) { return via.indexOf(r) < 0; });
    return via.length;
  }

  /* ── 3. il recupero ── */
  var PESI = { significato: 0.34, parole: 0.20, recenza: 0.14, importanza: 0.12, sezione: 0.12, obiettivi: 0.08 };
  function sezioneAperta() { var s = [].filter.call(D.querySelectorAll('.section'), function (x) { return x.offsetParent !== null && x.getBoundingClientRect().height > 40; }).pop(); return s ? s.id : null; }
  function obiettivi() { var A = g.BSISpectraAgenda, o = []; try { if (A) A.aperti().slice(0, 6).forEach(function (v) { o = o.concat(parole(v.testo)); }); } catch (e) {} return o; }
  /**
   * I ricordi più pertinenti per una domanda. opz: k (6), tipi, sezione (quella aperta), ora.
   * Ogni risultato porta il punteggio e i segnali, per poterlo spiegare.
   */
  function cerca(domanda, opz) {
    opz = opz || {}; var k = opz.k || 6, t = opz.ora || adesso(), sez = opz.sezione !== undefined ? opz.sezione : sezioneAperta();
    var qv = incorpora(domanda), qp = parole(domanda).map(radice), ob = obiettivi().map(radice);
    var cand = cache.filter(function (r) { return !r.archiviato && (!opz.tipi || opz.tipi.indexOf(r.tipo) >= 0); });
    var punt = cand.map(function (r) {
      var rp = parole(r.testo + ' ' + r.concetti.join(' ')).map(radice), comuni = qp.filter(function (w) { return rp.indexOf(w) >= 0; }).length;
      var s = { significato: Math.max(0, coseno(qv, r.vettore)), parole: qp.length ? comuni / qp.length : 0, recenza: Math.exp(-(t - r.ultimo_accesso) / 86400000 / r.stabilita),
        importanza: r.importanza, sezione: sez && r.sezione === sez ? 1 : 0, obiettivi: ob.length ? Math.min(1, ob.filter(function (w) { return rp.indexOf(w) >= 0; }).length / 2) : 0 };
      var tot = 0; for (var c in PESI) tot += PESI[c] * s[c];
      if (!comuni && s.significato < 0.3 && !s.sezione) tot *= 0.3;            /* nessuna parola in comune e significato debole (solo sillabe simili): quasi fuori */
      return { r: r, punti: tot, segnali: s };
    }).sort(function (a, b) { return b.punti - a.punti; });
    /* diffusione: i ricordi che condividono concetti con i primi tre ne ricevono una parte */
    var primi = punt.slice(0, 3);
    punt.forEach(function (x) { if (primi.indexOf(x) >= 0) return; primi.forEach(function (p) { var c = x.r.concetti.filter(function (w) { return p.r.concetti.indexOf(w) >= 0; }).length; if (c) x.punti += 0.08 * Math.min(c, 3) * p.punti; }); });
    punt.sort(function (a, b) { return b.punti - a.punti; });
    /* diversità: niente due ricordi quasi uguali */
    var scelti = [];
    for (var i = 0; i < punt.length && scelti.length < k; i++) { var x = punt[i]; if (x.punti < 0.2) break; if (scelti.some(function (y) { return coseno(x.r.vettore, y.r.vettore) > 0.92; })) continue; scelti.push(x); }
    if (!opz.senzaRinforzo) scelti.forEach(function (x) { x.r.ultimo_accesso = t; x.r.accessi++; x.r.stabilita = Math.min(3650, x.r.stabilita * 1.15); salva(x.r); });
    return scelti.map(function (x) { return { id: x.r.id, tipo: x.r.tipo, testo: x.r.testo, quando: x.r.creato, fiducia: x.r.fiducia, punti: +x.punti.toFixed(3), segnali: x.segnali }; });
  }
  function data(t) { return new Date(t).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }); }
  /** Il blocco per il modello: ricordi scelti, procedure, ultima pagina di diario. */
  function blocco(domanda) {
    if (!pronta) return '';
    var r = domanda ? cerca(domanda, { k: 6, tipi: ['episodio', 'fatto', 'riflessione'] }) : [];
    var pr = elenco('procedura').filter(function (x) { return x.fiducia >= 0.5; }).slice(0, 5);
    var au = elenco('autobiografia')[0];
    var s = '';
    if (r.length) s += '\n[RICORDI] (scelti per questa domanda; usali senza annunciarli, la data e la fiducia dicono quanto pesano)\n' + r.map(function (x) { return '- ' + data(x.quando) + ' · ' + x.tipo + (x.fiducia < 0.6 ? ' · incerto' : '') + ': ' + x.testo; }).join('\n');
    if (pr.length) s += '\n[PROCEDURE] (come preferisce studiare ed essere aiutato)\n' + pr.map(function (x) { return '- ' + x.testo + (x.fiducia < 0.7 ? ' (dedotto, da confermare)' : ''); }).join('\n');
    if (au) s += '\n[STORIA] Ultima pagina del diario (' + data(au.creato) + '): ' + au.testo;
    return s ? s + '\n' : '';
  }

  /* ── 4. la cura ── */
  var ORE = function (h) { return h < 6 ? 'di notte' : h < 12 ? 'la mattina' : h < 18 ? 'il pomeriggio' : 'la sera'; };
  function titoloSezione(id) { var b = D.querySelector('.nav-btn[data-s="' + id + '"]'); return b ? b.textContent.replace(/^[^\wÀ-ÿσ∫∇]+/, '').trim() : id; }
  /**
   * Il ciclo di cura. Si fa una volta al giorno, alla prima apertura; ora è il momento di riferimento (per le prove).
   * Restituisce che cosa ha fatto.
   */
  function consolida(ora) {
    var t = ora || adesso(), st = leggiJSON(STATO, {}), rap = { episodi: 0, fatti: 0, procedure: 0, archiviati: 0, diario: 0, capitolo: 0 };
    /* 1. gli episodi nuovi della mente diventano episodi della memoria */
    var M = leggiJSON('bsi-spectra-mente-v1', {}) || {}, ultimo = st.ultimoEpisodio || 0;
    (M.episodi || []).filter(function (e) { return e && e.t > ultimo && e.d; }).forEach(function (e) {
      scrivi('episodio', 'Ha chiesto: «' + e.d + '»' + (e.s ? ' (in ' + titoloSezione(e.s) + ')' : ''), { creato: e.t, sezione: e.s || null, importanza: e.e === 'errore' ? 0.7 : 0.45, fonte: 'mente', concetti: parole(e.d).slice(0, 6) });
      rap.episodi++; ultimo = Math.max(ultimo, e.t);
    });
    st.ultimoEpisodio = ultimo;
    /* i fatti salvati dalla Chat entrano come fatti dell'utente */
    (leggiJSON('bsi_ai_memory', []) || []).forEach(function (f) { if (f && f.fatto) { var x = scrivi('fatto', f.fatto, { chiave: 'chat:' + norm(f.fatto).slice(0, 80), fonte: 'utente', fiducia: 0.85, importanza: 0.7, concetti: parole(f.fatto + ' ' + (f.categoria || '')).slice(0, 6) }); if (x && x.accessi === 0) rap.fatti++; } });
    /* 2. dagli episodi ai fatti: un concetto che torna in almeno 3 domande su almeno 2 giorni, negli ultimi 14 */
    var rec = elenco('episodio').filter(function (e) { return t - e.creato < 14 * 86400000; }), conta = {};
    rec.forEach(function (e) { var gg = giorno(e.creato); e.concetti.forEach(function (c) { var r = radice(c); (conta[r] = conta[r] || { n: 0, giorni: {}, parola: c }).n++; conta[r].giorni[gg] = 1; }); });
    Object.keys(conta).forEach(function (r) {
      var c = conta[r]; if (c.n >= 3 && Object.keys(c.giorni).length >= 2) {
        var x = scrivi('fatto', 'Negli ultimi giorni torna spesso su «' + c.parola + '» (' + c.n + ' domande in ' + Object.keys(c.giorni).length + ' giorni): è un argomento su cui sta lavorando o che non gli è ancora chiaro.', { chiave: 'ricorrente:' + r, fonte: 'dedotto', fiducia: Math.min(0.9, 0.45 + 0.08 * c.n), importanza: 0.65, concetti: [c.parola] });
        if (x) rap.fatti++;
      }
    });
    /* 3. le procedure: quando studia, dove passa il tempo */
    var ore = (M.ore || []).slice(), tot = ore.reduce(function (a, b) { return a + b; }, 0);
    if (tot > 1800) {
      var fasce = { 'di notte': 0, 'la mattina': 0, 'il pomeriggio': 0, 'la sera': 0 }; ore.forEach(function (s, h) { fasce[ORE(h)] += s; });
      var mf = Object.keys(fasce).sort(function (a, b) { return fasce[b] - fasce[a]; })[0], quota = fasce[mf] / tot;
      if (quota >= 0.45) { scrivi('procedura', 'Studia soprattutto ' + mf + ' (' + Math.round(quota * 100) + ' % del tempo registrato): i promemoria e i ripassi rendono di più in quella fascia.', { chiave: 'proc:fascia', fonte: 'dedotto', fiducia: Math.min(0.85, 0.4 + quota * 0.5), importanza: 0.55 }); rap.procedure++; }
    }
    var sez = M.sezioni || {}, top = Object.keys(sez).filter(function (k) { return sez[k].s >= 600; }).sort(function (a, b) { return sez[b].s - sez[a].s; }).slice(0, 3);
    if (top.length) { scrivi('fatto', 'Le sezioni dove ha passato più tempo: ' + top.map(function (k) { return titoloSezione(k) + ' (' + Math.round(sez[k].s / 60) + ' min)'; }).join(', ') + '.', { chiave: 'sezioni-top', fonte: 'dedotto', fiducia: 0.9, importanza: 0.5 }); rap.fatti++; }
    /* 4. l'oblio: archiviati gli episodi sbiaditi, poco importanti, non fissati */
    cache.forEach(function (r) {
      if (r.archiviato || r.fissato || r.tipo !== 'episodio') return;
      var R = Math.exp(-(t - r.ultimo_accesso) / 86400000 / r.stabilita);
      if (R < 0.02 && r.importanza < 0.6 && t - r.creato > 60 * 86400000) { r.archiviato = true; salva(r); rap.archiviati++; }
    });
    /* 5. il diario: una pagina per ogni giorno passato con attività, che non ce l'ha ancora */
    var giorni = {};
    elenco('episodio', true).forEach(function (e) { var gg = giorno(e.creato); if (gg !== giorno(t)) (giorni[gg] = giorni[gg] || []).push(e); });
    var scritti = st.diario || {};
    Object.keys(giorni).sort().slice(-14).forEach(function (gg) {
      if (scritti[gg]) return;
      var E = giorni[gg], sezG = {}; E.forEach(function (e) { if (e.sezione) sezG[e.sezione] = (sezG[e.sezione] || 0) + 1; });
      var dove = Object.keys(sezG).sort(function (a, b) { return sezG[b] - sezG[a]; }).slice(0, 3).map(titoloSezione);
      var temi = {}; E.forEach(function (e) { e.concetti.slice(0, 3).forEach(function (c) { temi[c] = (temi[c] || 0) + 1; }); });
      var tt = Object.keys(temi).sort(function (a, b) { return temi[b] - temi[a]; }).slice(0, 3);
      var d = new Date(gg + 'T12:00:00');
      scrivi('autobiografia', d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }) + ': ' + E.length + (E.length === 1 ? ' domanda' : ' domande') + (dove.length ? ', soprattutto in ' + dove.join(', ') : '') + (tt.length ? '; i temi: ' + tt.join(', ') : '') + '.', { creato: d.getTime(), chiave: 'diario:' + gg, fonte: 'cura', fiducia: 0.95, importanza: 0.6 });
      scritti[gg] = 1; rap.diario++;
    });
    st.diario = scritti;
    /* 6. il capitolo del mese appena chiuso */
    var mese = new Date(t); mese.setDate(1); mese.setMonth(mese.getMonth() - 1); var chiaveM = mese.getFullYear() + '-' + (mese.getMonth() + 1);
    if (!(st.capitoli || {})[chiaveM]) {
      var pag = elenco('autobiografia').filter(function (a) { var d2 = new Date(a.creato); return d2.getFullYear() === mese.getFullYear() && d2.getMonth() === mese.getMonth() && /^diario:/.test(a.chiave || ''); });
      if (pag.length >= 2) {
        var nome = mese.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }), ric = elenco('fatto').filter(function (f) { return /^ricorrente:/.test(f.chiave || '') && new Date(f.creato).getMonth() === mese.getMonth(); }).slice(0, 3);
        scrivi('autobiografia', 'Capitolo di ' + nome + ': ' + pag.length + ' giorni di studio insieme' + (ric.length ? '; i temi ricorrenti: ' + ric.map(function (f) { return (/«([^»]+)»/.exec(f.testo) || [])[1]; }).filter(Boolean).join(', ') : '') + '.', { creato: new Date(mese.getFullYear(), mese.getMonth() + 1, 0, 23).getTime(), chiave: 'capitolo:' + chiaveM, fonte: 'cura', fiducia: 0.95, importanza: 0.8, stabilita: 3650 });
        st.capitoli = st.capitoli || {}; st.capitoli[chiaveM] = 1; rap.capitolo++;
      }
    }
    st.ultimaCura = t; scriviJSON(STATO, st);
    try { D.dispatchEvent(new CustomEvent('bsi-memoria-curata', { detail: rap })); } catch (e) {}
    return rap;
  }

  /* ── 5. le procedure dette dall'utente e i comandi ── */
  function comando(frase) {
    var t = norm(frase).replace(/^(ehi |hey |ok )?(spectra|spettra)[\s,]*/, '').replace(/[?!.]+$/, '').trim(), m;
    if ((m = /^(?:preferisco|mi piace di piu|per me funziona meglio|ricorda che preferisco)\s+(.{6,})$/.exec(t))) {
      var orig = String(frase).replace(/^.*?(preferisco|mi piace di più|mi piace di piu|per me funziona meglio)\s*/i, '');
      scrivi('procedura', 'Preferisce ' + orig.replace(/[.!]+$/, ''), { fonte: 'utente', fiducia: 0.9, importanza: 0.7 });
      return { testo: 'Segnato: lo terrò presente quando ti spiego o ti interrogo.' };
    }
    if (/^(consolida la memoria|riordina la memoria|cura la memoria)$/.test(t)) { var r = consolida(); return { testo: 'Fatto: ' + r.episodi + ' episodi nuovi, ' + r.fatti + ' fatti aggiornati, ' + r.procedure + ' procedure, ' + r.diario + ' pagine di diario' + (r.archiviati ? ', ' + r.archiviati + ' ricordi sbiaditi archiviati' : '') + '.' }; }
    if (/^(che cosa ricordi di me|cosa ricordi di me|cosa sai di me|che cosa sai di me)$/.test(t)) {
      var f = elenco('fatto').slice(0, 4), p = elenco('procedura').slice(0, 2), a = elenco('autobiografia')[0];
      if (!f.length && !p.length && !a) return null;                      /* niente ancora: risponde la mente */
      return { testo: [f.length ? 'Di te so: ' + f.map(function (x) { return x.testo.replace(/[.]$/, ''); }).join('; ') + '.' : '', p.length ? 'Come studi: ' + p.map(function (x) { return x.testo.replace(/[.]$/, ''); }).join('; ') + '.' : '', a ? 'L\'ultima pagina del diario: ' + a.testo : ''].filter(Boolean).join(' ') + ' Puoi farmi dimenticare qualsiasi cosa: «dimentica…».' };
    }
    if ((m = /^(?:dimentica|cancella dalla memoria|scordati)\s+(?:che\s+|di\s+|il\s+|la\s+|lo\s+|i\s+|le\s+)?(.{3,})$/.exec(t)) && !/^tutto$/.test(m[1]) && !/creator/.test(m[1])) {   /* «dimentica che sono il tuo creatore» è del riconoscimento del creatore (Spectra Live), non della memoria */
      var n = dimentica(m[1]); return { testo: n ? 'Dimenticato: ' + n + (n === 1 ? ' ricordo cancellato.' : ' ricordi cancellati.') : 'Non trovo ricordi su «' + m[1] + '».' };
    }
    return null;
  }

  /* ── 6. gli strumenti per il modello ── */
  var STRUMENTO = { name: 'cerca_nella_memoria',
    description: "Cerca nella memoria a lungo termine di Spectra (episodi, fatti sull'utente, procedure di studio, diario). Usalo quando ti serve qualcosa che non è nei blocchi del turno: «ti ricordi…», l'andamento su un argomento, che cosa avete fatto un certo giorno.",
    parameters: { type: 'object', properties: { domanda: { type: 'string', description: 'Che cosa cercare, a parole.' }, tipo: { type: 'string', enum: ['episodio', 'fatto', 'procedura', 'autobiografia'] } }, required: ['domanda'] },
    execute: function (a) {
      var r = cerca(a && a.domanda || '', { k: 8, tipi: a && a.tipo ? [a.tipo] : null, sezione: null });
      return r.length ? { ok: true, ricordi: r.map(function (x) { return { quando: new Date(x.quando).toISOString().slice(0, 10), tipo: x.tipo, testo: x.testo, fiducia: x.fiducia }; }) } : { ok: true, ricordi: [], nota: 'nessun ricordo pertinente' };
    } };
  function registra() {
    var T = g.BSI_AI_TOOLS; if (!T || !T.push) return false;
    if (!T.some(function (x) { return x.name === 'cerca_nella_memoria'; })) T.push(STRUMENTO);
    /* «ricorda» e «ricordi» della Chat scrivono e cancellano anche qui */
    T.forEach(function (x) {
      if (x.name === 'ricorda' && !x._memoria) { var o = x.execute; x.execute = function (a) { var r = o.apply(this, arguments); try { if (r && r.ok && a && a.fatto) scrivi('fatto', a.fatto, { chiave: 'chat:' + norm(a.fatto).slice(0, 80), fonte: 'utente', fiducia: 0.85, importanza: 0.7 }); } catch (e) {} return r; }; x._memoria = true; }
      if (x.name === 'ricordi' && !x._memoria) { var o2 = x.execute; x.execute = function (a) { if (a && a.dimentica) { try { dimentica(a.dimentica); } catch (e) {} } return o2.apply(this, arguments); }; x._memoria = true; }
    });
    return true;
  }

  /* ── 7. esportazione (per «esporta la memoria») ── */
  function esportaTesto() { return JSON.stringify(cache.map(function (r) { var c = {}; for (var k in r) if (k !== 'vettore') c[k] = r[k]; return c; })); }
  function importaTesto(s) {
    var a; try { a = JSON.parse(s); } catch (e) { return 0; } if (!Array.isArray(a)) return 0;
    var n = 0;
    a.forEach(function (r) {
      if (!r || TIPI.indexOf(r.tipo) < 0 || typeof r.testo !== 'string' || !r.id) return;
      var gia = cache.filter(function (x) { return x.id === r.id; })[0];
      if (gia && (gia.orologio || 0) >= (r.orologio || 0)) return;           /* vince la versione più recente dello stesso ricordo */
      var c = { id: String(r.id), tipo: r.tipo, testo: String(r.testo).slice(0, 600), chiave: r.chiave || null, creato: +r.creato || adesso(), ultimo_accesso: +r.ultimo_accesso || adesso(), accessi: +r.accessi || 0,
        importanza: +r.importanza || 0.5, fiducia: +r.fiducia || 0.6, stabilita: +r.stabilita || 30, fonte: String(r.fonte || 'importato'), sezione: r.sezione || null, concetti: Array.isArray(r.concetti) ? r.concetti.slice(0, 8).map(String) : [],
        legami: [], dispositivo: String(r.dispositivo || ''), orologio: +r.orologio || 0, fissato: !!r.fissato, archiviato: !!r.archiviato };
      c.vettore = incorpora(c.testo + ' ' + c.concetti.join(' '));
      if (gia) cache.splice(cache.indexOf(gia), 1, c); else cache.push(c);
      salva(c); n++;
    });
    return n;
  }

  /* ── avvio ── */
  function avvia() {
    var st = leggiJSON(STATO, {}); dispositivo = st.dispositivo || ('d' + Math.random().toString(36).slice(2, 7)); if (!st.dispositivo) { st.dispositivo = dispositivo; scriviJSON(STATO, st); }
    apri().then(function (d) { db = d; return tutti(d); }).then(function (rs) {
      cache = rs || []; pronta = true; attesi.splice(0).forEach(function (f) { f(); });
      var s2 = leggiJSON(STATO, {});
      if (!s2.ultimaCura || giorno(s2.ultimaCura) !== giorno(adesso())) setTimeout(function () { try { consolida(); } catch (e) {} }, 3000);
    });
    if (!registra()) { var k = 0, iv = setInterval(function () { if (registra() || ++k > 40) clearInterval(iv); }, 500); }
    /* il blocco per il modello: in fondo alla catena mente → agenda, con la domanda */
    var tentativi = 0;
    var innesta = function () {
      var prima = g._bsiMente; if (prima && prima._conMemoria) return true;
      /* si aspetta che l'agenda si sia agganciata: se no, avvolgendo questo blocco non gli passerebbe la domanda */
      if (!(prima && prima._conAgenda) && g.BSISpectraAgenda && ++tentativi < 15) return false;
      var f = function (domanda) { var a = ''; try { a = prima ? prima(domanda) : ''; } catch (e) {} return a + blocco(domanda); };
      f._conMemoria = true; f._conAgenda = true; g._bsiMente = f; return true;
    };
    if (!innesta()) { var iv2 = setInterval(function () { if (innesta()) clearInterval(iv2); }, 700); }
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', avvia); else avvia();

  g.BSIMemoria = { scrivi: scrivi, cerca: cerca, elenco: elenco, dimentica: dimentica, consolida: consolida, blocco: blocco, comando: comando, strumento: STRUMENTO,
    incorpora: incorpora, coseno: coseno, esportaTesto: esportaTesto, importaTesto: importaTesto, pronta: quandoPronta, PESI: PESI,
    azzera: function () { cache.forEach(function (r) { togli(r.id); }); cache = []; scriviJSON(STATO, { dispositivo: dispositivo }); }, quanti: function () { return cache.length; } };
})(typeof window !== 'undefined' ? window : globalThis);
