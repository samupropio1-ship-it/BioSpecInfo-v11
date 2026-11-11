/* ═══════════════════════════════════════════════════════════════════════════
   biospecinfo-strumenti.js — BioSpecInfo come client privilegiato di Spectra 2.0

   CHE COSA FA
   Dichiara gli strumenti che l'app offre a un agente (aprire una sezione,
   cercarla, risolvere un esercizio con lo svolgimento, calcolare uno spettro,
   leggere cio' che c'e' sullo schermo) UNA volta, e li espone su due strade:

   1. WebMCP — lo standard in bozza con cui una pagina web dichiara i propri
      strumenti a un agente che gira NEL BROWSER (registerTool con nome,
      descrizione, schema degli argomenti e funzione). E' un'anteprima: al
      momento in cui questo file e' scritto serve Chrome 146 o successivo con
      l'opzione «WebMCP for testing», e l'oggetto si trova su
      `navigator.modelContext` oppure su `document.modelContext` a seconda
      della versione. Qui si provano entrambi; se non c'e', non succede nulla.

   2. IL RELE' DI SPECTRA — il cervello di Spectra gira su un'altra macchina e
      non puo' chiamare WebMCP da remoto (WebMCP vive dentro il browser).
      Percio' l'app si collega al servizio, DICHIARA gli stessi strumenti
      (POST /strumenti/registra) e resta in attesa (GET /strumenti/attesa):
      quando il modello ne chiama uno, l'app lo esegue qui, sullo schermo
      dell'utente, e manda l'esito (POST /strumenti/esito).

   Gli strumenti sono gli stessi per le due strade: una sola definizione.

   SICUREZZA
   · Nessuno strumento cancella dati, spende, o manda qualcosa fuori dal
     dispositivo: aprono, cercano, calcolano, leggono. Quelli che cambiano cio'
     che l'utente vede (aprire una sezione) lo dichiarano (`sola_lettura: false`).
   · Il gettone del servizio si legge da localStorage (lo inserisce l'utente
     nelle impostazioni), non sta in questo file.
   · L'esito di uno strumento e' testo breve: niente HTML, niente dati personali.

   USO
     <script src="./biospecinfo-strumenti.js" defer></script>
     BSISpectra2.collega({ url: 'https://spectra.casa.example', gettone: '…' })   // il rele'
     // WebMCP si registra da solo al caricamento, se il browser lo offre
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var D = globale.document;

  function testo(html) { var e = D.createElement('div'); e.innerHTML = String(html || ''); return (e.textContent || '').replace(/\s+/g, ' ').trim(); }
  function norma(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function catalogo() { var S = globale.BSISpiega; try { return S && S.catalogo ? S.catalogo() : []; } catch (e) { return []; } }
  function oggetto(prop, req) { return { type: 'object', additionalProperties: false, properties: prop, required: req || [] }; }

  /* ── gli strumenti: nome, descrizione, schema, funzione, sola lettura? ── */
  var STRUMENTI = [
    {
      nome: 'cerca_sezione',
      descrizione: 'Cerca fra le sezioni di BioSpecInfo (chimica, fisica, matematica) per nome o argomento. Restituisce al piu\' otto sezioni con il loro identificativo, da usare con apri_sezione.',
      schema: oggetto({ domanda: { type: 'string', description: 'parole da cercare, es. «titolazione», «orbite», «integrali»' }, materia: { type: 'string', enum: ['chimica', 'fisica', 'matematica', 'comune'] } }, ['domanda']),
      sola_lettura: true,
      esegui: function (a) {
        var q = norma(a.domanda).split(/\s+/).filter(Boolean);
        var trovate = catalogo().filter(function (x) { if (a.materia && x.materia !== a.materia) return false; var dove = norma(x.nome + ' ' + x.gruppo); return q.every(function (w) { return dove.indexOf(w) >= 0; }); }).slice(0, 8);
        return trovate.length ? trovate.map(function (x) { return x.id + ' — ' + x.nome + ' (' + x.materia + ')'; }).join('\n') : 'nessuna sezione trovata per «' + a.domanda + '»';
      }
    },
    {
      nome: 'apri_sezione',
      descrizione: 'Apre una sezione di BioSpecInfo sullo schermo dell\'utente. Serve l\'identificativo esatto (da cerca_sezione).',
      schema: oggetto({ id: { type: 'string' } }, ['id']),
      sola_lettura: false,
      esegui: function (a) {
        var L = globale.BSISpectraLive, r = L && L.calcolo && L.calcolo.apriSezione ? L.calcolo.apriSezione(a.id) : null;
        return r && r.ok ? 'aperta: ' + r.nome : 'sezione non trovata: ' + a.id;
      }
    },
    {
      nome: 'risolvi_esercizio',
      descrizione: 'Risolve un esercizio di chimica, fisica o matematica con il risolutore locale dell\'app (calcolo vero, non stima) e restituisce i passaggi e i risultati con le unita\'. Usalo quando serve un numero esatto.',
      schema: oggetto({ testo: { type: 'string', description: 'il testo dell\'esercizio, in italiano' }, materia: { type: 'string', enum: ['chimica', 'fisica', 'matematica'] } }, ['testo']),
      sola_lettura: true,
      esegui: function (a) {
        var A = globale.BSIAssistente, r = null;
        try { r = A && A.rispondi ? A.rispondi(a.testo, a.materia || null) : null; } catch (e) { r = null; }
        if (!r || r.errore || !r.titolo) return 'il risolutore locale non ha riconosciuto l\'esercizio';
        var righe = [r.titolo];
        (r.passi || []).slice(0, 12).forEach(function (p, i) { righe.push((i + 1) + '. ' + (p.titolo || '') + ': ' + testo(p.html).slice(0, 300)); });
        (r.risultati || []).forEach(function (x) { righe.push('RISULTATO ' + x.nome + ' = ' + x.v + ' ' + (x.u || '')); });
        return righe.join('\n');
      }
    },
    {
      nome: 'spettro_di_riferimento',
      descrizione: 'Restituisce i segnali di uno spettro di riferimento (IR, 1H-NMR, 13C-NMR, massa, UV) per una delle molecole didattiche dell\'app, con le attribuzioni. I valori sono tipici di letteratura, non misure.',
      schema: oggetto({ molecola: { type: 'string', enum: ['acetone', 'etanolo', 'acetico', 'benzene', 'toluene', 'etile'] }, tipo: { type: 'string', enum: ['ir', 'h1', 'c13', 'ms', 'uv'] } }, ['molecola', 'tipo']),
      sola_lettura: true,
      esegui: function (a) {
        var I = globale.BSIOloInterattivo, S = null;
        try { S = I && I.spettro ? I.spettro(a.tipo, a.molecola, { MHz: 400 }) : null; } catch (e) { S = null; }
        if (!S || !S.passi) return 'spettro non disponibile';
        return S.passi.slice(0, 14).map(function (p) { return p.tit + ' — ' + testo(p.html).slice(0, 220); }).join('\n');
      }
    },
    {
      nome: 'leggi_schermo',
      descrizione: 'Dice che cosa l\'utente ha sullo schermo in questo momento in BioSpecInfo: la sezione aperta, la scheda, i valori dei comandi. Usalo prima di spiegare «questo grafico» o «questa sezione».',
      schema: oggetto({}, []),
      sola_lettura: true,
      esegui: function () {
        var L = globale.BSISpectraLive, s = null;
        try { s = L && L.schermo ? L.schermo() : null; } catch (e) { s = null; }
        if (!s) return 'nessuna sezione aperta';
        var c = ''; try { c = L.contesto ? String(L.contesto()).slice(0, 1500) : ''; } catch (e) { c = ''; }
        return 'sezione: ' + (s.titolo || s.sezione) + ' (' + (s.materia || '') + ')' + (c ? '\n' + c : '');
      }
    },
    {
      nome: 'stato_dello_studio',
      descrizione: 'Quante schede sono da ripassare oggi e quanti errori recenti ha l\'utente nella materia indicata (dal kit di studio dell\'app).',
      schema: oggetto({ materia: { type: 'string', enum: ['chimica', 'fisica', 'matematica'] } }, ['materia']),
      sola_lettura: true,
      esegui: function (a) {
        var L = globale.BSISpectraLive, r = null;
        try { r = L && L.studio ? L.studio(a.materia) : null; } catch (e) { r = null; }
        return r ? a.materia + ': ' + r.daRipassare + ' schede da ripassare, ' + r.errori + ' errori recenti, ' + r.studiati + ' argomenti studiati' : 'dati di studio non disponibili';
      }
    }
  ];
  function perNome(n) { for (var i = 0; i < STRUMENTI.length; i++) if (STRUMENTI[i].nome === n) return STRUMENTI[i]; return null; }
  /* il controllo minimo degli argomenti: i campi richiesti e le scelte ammesse */
  function valida(s, a) {
    if (!a || typeof a !== 'object') return 'gli argomenti non sono un oggetto';
    var req = s.schema.required || [];
    for (var i = 0; i < req.length; i++) if (a[req[i]] === undefined || a[req[i]] === '') return 'manca «' + req[i] + '»';
    for (var k in a) { var p = s.schema.properties[k]; if (!p) return 'campo sconosciuto «' + k + '»'; if (p.enum && p.enum.indexOf(a[k]) < 0) return '«' + k + '» deve essere uno fra ' + p.enum.join(', '); if (p.type === 'string' && typeof a[k] !== 'string') return '«' + k + '» deve essere testo'; }
    return null;
  }
  function esegui(nome, argomenti) {
    var s = perNome(nome); if (!s) return Promise.resolve('strumento sconosciuto: ' + nome);
    var err = valida(s, argomenti || {}); if (err) return Promise.resolve('argomenti non validi: ' + err);
    try { return Promise.resolve(s.esegui(argomenti || {})).then(function (r) { return String(r == null ? '' : r).slice(0, 8000); }, function (e) { return 'errore: ' + (e && e.message || e); }); }
    catch (e) { return Promise.resolve('errore: ' + (e && e.message || e)); }
  }

  /* ═══ strada 1: WebMCP ═══════════════════════════════════════════════ */
  function contestoWebMCP() {
    var n = globale.navigator;
    if (n && n.modelContext && typeof n.modelContext.registerTool === 'function') return n.modelContext;
    if (D && D.modelContext && typeof D.modelContext.registerTool === 'function') return D.modelContext;
    return null;
  }
  function registraWebMCP() {
    var mc = contestoWebMCP(); if (!mc) return 0;
    var n = 0;
    STRUMENTI.forEach(function (s) {
      try {
        mc.registerTool({
          name: s.nome, description: s.descrizione, inputSchema: s.schema,
          annotations: { readOnlyHint: !!s.sola_lettura },
          /* la bozza chiede un risultato nel formato dei contenuti MCP: un elenco di blocchi di testo */
          execute: function (args) { return esegui(s.nome, args).then(function (t) { return { content: [{ type: 'text', text: t }] }; }); }
        });
        n++;
      } catch (e) { /* gia' registrato, o la forma e' cambiata in questa versione del browser: si prosegue */ }
    });
    return n;
  }

  /* ═══ strada 2: il rele' di Spectra ══════════════════════════════════ */
  var RELE = { attivo: false, url: '', gettone: '', client: 'app', errori: 0 };
  function chiama(metodo, strada, corpo) {
    return globale.fetch(RELE.url + strada, { method: metodo, headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + RELE.gettone }, body: corpo ? JSON.stringify(corpo) : undefined })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  }
  function registraRele() {
    return chiama('POST', '/strumenti/registra', { client: RELE.client, strumenti: STRUMENTI.map(function (s) { return { nome: s.nome, descrizione: s.descrizione, schema: s.schema }; }) });
  }
  function giro() {
    if (!RELE.attivo) return;
    chiama('GET', '/strumenti/attesa?client=' + encodeURIComponent(RELE.client) + '&attesa=20')
      .then(function (d) {
        RELE.errori = 0;
        if (!d || !d.chiamata) return;
        return esegui(d.chiamata.nome, d.chiamata.argomenti).then(function (esito) { return chiama('POST', '/strumenti/esito', { id: d.chiamata.id, esito: esito }); });
      })
      .catch(function () { RELE.errori++; })
      .then(function () {
        /* se il servizio non risponde si riprova sempre piu' di rado (fino a un minuto), e ci si ri-registra quando torna */
        var pausa = RELE.errori ? Math.min(60000, 1000 * Math.pow(2, RELE.errori)) : 50;
        globale.setTimeout(function () { if (RELE.errori === 1) registraRele().catch(function () {}); giro(); }, pausa);
      });
  }
  function collega(opz) {
    opz = opz || {};
    var url = opz.url, gettone = opz.gettone;
    try { url = url || globale.localStorage.getItem('bsi-spectra2-url'); gettone = gettone || globale.localStorage.getItem('bsi-spectra2-gettone'); } catch (e) {}
    if (!url || !gettone) return Promise.resolve(false);
    RELE.url = String(url).replace(/\/+$/, ''); RELE.gettone = gettone; RELE.client = opz.client || 'app';
    return registraRele().then(function () { if (!RELE.attivo) { RELE.attivo = true; giro(); } return true; }, function () { return false; });
  }
  function scollega() { RELE.attivo = false; }

  /* un turno di conversazione con il cervello (testo o voce): lo usa l'interfaccia dell'app */
  function turno(testoUtente, opz) {
    opz = opz || {};
    return chiama('POST', '/turno', { testo: testoUtente, sessione: opz.sessione || 'biospecinfo', canale: opz.canale || 'testo', contesto: opz.contesto || null, immagini: opz.immagini || [] });
  }

  globale.BSISpectra2 = { STRUMENTI: STRUMENTI, esegui: esegui, valida: valida, registraWebMCP: registraWebMCP, contestoWebMCP: contestoWebMCP,
    collega: collega, scollega: scollega, turno: turno, stato: function () { return { rele: RELE.attivo, errori: RELE.errori, webmcp: !!contestoWebMCP() }; } };

  if (D) {
    var avvia = function () { registraWebMCP(); collega(); };
    if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', avvia); else avvia();
  }
})(typeof window !== 'undefined' ? window : globalThis);
