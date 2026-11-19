/* =====================================================================
   SPECTRA PROXY — Cloudflare Worker
   ---------------------------------------------------------------------
   Tiene le chiavi API sul server, così la pagina non ne contiene nessuna
   e chi apre BioSpecInfo usa Spectra senza inserire niente.

   GitHub Pages serve file statici: qualunque chiave messa nella pagina
   sarebbe leggibile con Ctrl+U e revocata dal fornitore nel giro di ore.
   Questo Worker è l'unico posto dove una chiave può stare al sicuro
   restando tutto gratuito.

   Cosa fa:
     · inoltra la richiesta al fornitore vero, iniettando la chiave
     · piu' chiavi per fornitore, con passaggio automatico alla successiva
       quando una finisce la quota (429) o viene revocata (401/403)
     · lascia passare lo streaming SSE senza bufferizzarlo, altrimenti
       Spectra mostrerebbe la risposta tutta insieme alla fine
     · limita le richieste per IP e ha un tetto giornaliero complessivo
     · accetta solo le origini dichiarate in ORIGINI

   Deploy: vedi proxy/README.md (circa 10 minuti, piano gratuito).
   ===================================================================== */
'use strict';

/* --- Fornitori ------------------------------------------------------ */
/* Ogni voce dice dove inoltrare e come infilare la chiave. Il segreto e'
   una LISTA separata da virgole: piu' chiavi = piu' quota. */
var FORNITORI = {
  anthropic:  { base: 'https://api.anthropic.com',                 segreto: 'ANTHROPIC_KEYS',  modo: 'header-x-api-key' },
  gemini:     { base: 'https://generativelanguage.googleapis.com', segreto: 'GEMINI_KEYS',     modo: 'query-key' },
  groq:       { base: 'https://api.groq.com',                      segreto: 'GROQ_KEYS',       modo: 'bearer' },
  xai:        { base: 'https://api.x.ai',                          segreto: 'XAI_KEYS',        modo: 'bearer' },
  // NVIDIA e' stata tolta dalla tendina dell'app perche' dal browser non
  // risponde (non manda gli header CORS). QUI resta apposta: il Worker non
  // e' un browser, quindi da qui funziona. Serve a chi vuole rimetterla
  // usando il proxy — basta riaggiungere la voce in PROVIDERS.
  nvidia:     { base: 'https://integrate.api.nvidia.com',          segreto: 'NVIDIA_KEYS',     modo: 'bearer' },
  zai:        { base: 'https://api.z.ai',                          segreto: 'ZAI_KEYS',        modo: 'bearer' },
  openai:     { base: 'https://api.openai.com',                    segreto: 'OPENAI_KEYS',     modo: 'bearer' },
  deepseek:   { base: 'https://api.deepseek.com',                  segreto: 'DEEPSEEK_KEYS',   modo: 'bearer' }
};

/* --- Limiti (sovrascrivibili da variabili d'ambiente) --------------- */
var LIMITE_IP_DEFAULT    = 20;      // richieste per IP nella finestra
var FINESTRA_MS          = 60000;   // finestra scorrevole: 1 minuto
var TETTO_GIORNO_DEFAULT = 2000;    // richieste totali al giorno

/* Contatori in memoria. Cloudflare gira su molte istanze indipendenti,
   quindi il conteggio e' per istanza: frena l'abuso, non lo azzera. Per un
   limite esatto serve KV o Durable Objects (vedi README, "Limiti veri"). */
var _ip = new Map();
var _giorno = { data: '', n: 0 };

function oggi(){ return new Date().toISOString().slice(0, 10); }

function tropoRichieste(ip, limiteIp, tettoGiorno){
  var ora = Date.now();
  var g = oggi();
  if(_giorno.data !== g){ _giorno.data = g; _giorno.n = 0; }
  if(_giorno.n >= tettoGiorno) return 'Tetto giornaliero del proxy raggiunto. Riprova domani.';
  var arr = (_ip.get(ip) || []).filter(function(t){ return ora - t < FINESTRA_MS; });
  if(arr.length >= limiteIp) return 'Troppe richieste. Aspetta un minuto e riprova.';
  arr.push(ora);
  _ip.set(ip, arr);
  _giorno.n++;
  // Pulizia: senza, la mappa cresce finche' l'istanza non viene riciclata.
  if(_ip.size > 5000){
    _ip.forEach(function(v, k){
      if(!v.length || ora - v[v.length - 1] > FINESTRA_MS) _ip.delete(k);
    });
  }
  return null;
}

/* --- CORS ----------------------------------------------------------- */
function origineAmmessa(origin, env){
  var lista = (env.ORIGINI || '').split(',').map(function(s){ return s.trim(); }).filter(Boolean);
  if(!lista.length) return true;              // nessuna lista = tutte (sconsigliato)
  if(!origin) return false;
  return lista.some(function(a){
    if(a === '*') return true;
    if(a === origin) return true;
    // "*.esempio.com" copre i sottodomini
    if(a.indexOf('*.') === 0){
      try{ return new URL(origin).hostname.endsWith(a.slice(1)); }catch(e){ return false; }
    }
    return false;
  });
}
function intestazioniCors(origin){
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, anthropic-version, anthropic-beta',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}
function errore(msg, stato, origin){
  return new Response(JSON.stringify({ error: { message: msg } }),
    { status: stato, headers: Object.assign({ 'Content-Type': 'application/json' }, intestazioniCors(origin)) });
}

/* --- Chiavi --------------------------------------------------------- */
function chiaviDi(env, nomeSegreto){
  return String(env[nomeSegreto] || '')
    .split(',').map(function(s){ return s.trim(); }).filter(Boolean);
}

/* Applica la chiave alla richiesta in uscita, nel modo che il fornitore
   si aspetta: intestazione, Bearer o parametro nell'URL. */
function conChiave(modo, url, headers, chiave){
  if(modo === 'query-key'){ url.searchParams.set('key', chiave); }
  else if(modo === 'header-x-api-key'){ headers.set('x-api-key', chiave); }
  else { headers.set('Authorization', 'Bearer ' + chiave); }
}

/* Una risposta che vale la pena ritentare con la chiave successiva:
   quota esaurita, chiave revocata o non autorizzata. Un 400 no — quello
   e' un errore nella richiesta e si ripeterebbe identico. */
function daRitentare(stato){
  return stato === 401 || stato === 403 || stato === 429;
}

/* --- La voce di Spectra (ElevenLabs) -------------------------------- */
/* POST /voce non è un inoltro generico verso ElevenLabs: con la chiave del
   proprietario chiunque potrebbe clonare o cancellare voci. Il client manda
   SOLO il testo e lo stile; voce, chiave, modelli ammessi e limiti stanno qui.
   Segreti:   ELEVENLABS_KEYS (lista separata da virgole), SPECTRA_VOICE_ID
   Variabili: VOCE_TESTO_MAX (caratteri per richiesta, 1000),
              VOCE_CARATTERI_GIORNO (tetto giornaliero per istanza, 20000)    */
var VOCE_PRESET = {
  ultron:     { stability: 0.60, similarity_boost: 0.85, style: 0.25, use_speaker_boost: true, speed: 0.93 },
  minaccioso: { stability: 0.48, similarity_boost: 0.85, style: 0.42, use_speaker_boost: true, speed: 0.88 },
  chiaro:     { stability: 0.72, similarity_boost: 0.80, style: 0.10, use_speaker_boost: true, speed: 1.00 }
};
var VOCE_MODELLI = ['eleven_multilingual_v2', 'eleven_turbo_v2_5', 'eleven_flash_v2_5', 'eleven_v3'];
var VOCE_LIMITI = { stability: [0, 1], similarity_boost: [0, 1], style: [0, 1], speed: [0.7, 1.2] };
var _voceGiorno = { data: '', caratteri: 0 };
function stringi(v, lim){ v = +v; return isFinite(v) ? Math.max(lim[0], Math.min(lim[1], v)) : null; }
function impostazioniVoce(dati){
  var base = VOCE_PRESET[dati && dati.preset] || VOCE_PRESET.ultron, chieste = (dati && dati.voice_settings) || {}, s = {};
  ['stability', 'similarity_boost', 'style', 'speed'].forEach(function(k){
    var v = stringi(chieste[k] != null ? chieste[k] : base[k], VOCE_LIMITI[k]); if(v !== null) s[k] = v;
  });
  s.use_speaker_boost = chieste.use_speaker_boost === false ? false : true;
  return s;
}
async function voce(request, env, origin){
  var chiavi = chiaviDi(env, 'ELEVENLABS_KEYS'), idVoce = String(env.SPECTRA_VOICE_ID || '').trim();
  if(!chiavi.length || !idVoce) return errore('La voce non è configurata sul proxy: wrangler secret put ELEVENLABS_KEYS e SPECTRA_VOICE_ID.', 503, origin);
  var dati;
  try{ dati = await request.json(); }catch(e){ return errore('Corpo JSON non valido.', 400, origin); }
  var testo = String((dati && dati.text) || '').trim(), max = parseInt(env.VOCE_TESTO_MAX, 10) || 1000;
  if(!testo) return errore('Testo vuoto.', 400, origin);
  if(testo.length > max) return errore('Testo troppo lungo: al massimo ' + max + ' caratteri per richiesta (il client lo spezza da sé).', 413, origin);
  var g = oggi(), tetto = parseInt(env.VOCE_CARATTERI_GIORNO, 10) || 20000;
  if(_voceGiorno.data !== g){ _voceGiorno.data = g; _voceGiorno.caratteri = 0; }
  if(_voceGiorno.caratteri + testo.length > tetto) return errore('Tetto giornaliero di caratteri della voce raggiunto. Riprova domani.', 429, origin);
  var modello = VOCE_MODELLI.indexOf(dati.model_id) >= 0 ? dati.model_id : 'eleven_multilingual_v2';
  var corpo = { text: testo, model_id: modello, voice_settings: impostazioniVoce(dati) };
  ['previous_text', 'next_text'].forEach(function(k){ if(typeof dati[k] === 'string' && dati[k].trim()) corpo[k] = dati[k].slice(0, max); });
  if(typeof dati.language_code === 'string' && /^[a-z]{2}$/.test(dati.language_code) && /v2_5$/.test(modello)) corpo.language_code = dati.language_code;
  var dest = 'https://api.elevenlabs.io/v1/text-to-speech/' + encodeURIComponent(idVoce) + '?output_format=mp3_44100_128';
  var ultima = null;
  for(var i = 0; i < chiavi.length; i++){
    var r;
    try{
      r = await fetch(dest, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'audio/mpeg', 'xi-api-key': chiavi[i] }, body: JSON.stringify(corpo) });
    }catch(e){ ultima = errore('Impossibile contattare ElevenLabs: ' + e.message, 502, origin); continue; }
    if(r.ok){
      _voceGiorno.caratteri += testo.length;
      var out = new Headers(intestazioniCors(origin));
      out.set('Content-Type', r.headers.get('Content-Type') || 'audio/mpeg'); out.set('Cache-Control', 'no-store');
      return new Response(r.body, { status: 200, headers: out });
    }
    var t = ''; try{ t = await r.text(); }catch(e){}
    /* il messaggio del servizio passa, la chiave mai */
    ultima = new Response(t.split(chiavi[i]).join('***') || JSON.stringify({ error: { message: 'HTTP ' + r.status } }), { status: r.status, headers: Object.assign({ 'Content-Type': 'application/json' }, intestazioniCors(origin)) });
    if(!daRitentare(r.status)) return ultima;
  }
  return ultima || errore('Nessuna chiave ElevenLabs utilizzabile.', 503, origin);
}

/* --- Worker --------------------------------------------------------- */
export default {
  async fetch(request, env){
    var origin = request.headers.get('Origin') || '';
    var url = new URL(request.url);

    if(request.method === 'OPTIONS'){
      if(!origineAmmessa(origin, env)) return errore('Origine non ammessa.', 403, '');
      return new Response(null, { status: 204, headers: intestazioniCors(origin) });
    }

    /* GET /stato — dice quali fornitori hanno una chiave configurata, senza
       rivelarne nessuna. Spectra lo usa per mostrare solo i modelli che
       funzionano davvero, invece di farli fallire uno per uno. */
    if(url.pathname === '/stato' || url.pathname === '/stato/'){
      if(!origineAmmessa(origin, env)) return errore('Origine non ammessa.', 403, '');
      var attivi = Object.keys(FORNITORI).filter(function(n){
        return chiaviDi(env, FORNITORI[n].segreto).length > 0;
      });
      if(chiaviDi(env, 'ELEVENLABS_KEYS').length && String(env.SPECTRA_VOICE_ID || '').trim()) attivi.push('voce');
      return new Response(JSON.stringify({ fornitori: attivi }),
        { headers: Object.assign({ 'Content-Type': 'application/json' }, intestazioniCors(origin)) });
    }

    // GET serve quanto POST: la risoluzione del modello Gemini interroga
    // ListModels in GET, e senza chiave nel browser deve passare di qui.
    if(request.method !== 'POST' && request.method !== 'GET'){
      return errore('Metodo non consentito.', 405, origin);
    }
    if(!origineAmmessa(origin, env)) return errore('Origine non ammessa da questo proxy.', 403, '');

    /* POST /voce: la voce di Spectra, con voce e limiti fissati qui */
    if(url.pathname === '/voce' || url.pathname === '/voce/'){
      if(request.method !== 'POST') return errore('Metodo non consentito.', 405, origin);
      var limV = parseInt(env.LIMITE_IP, 10) || LIMITE_IP_DEFAULT, tetV = parseInt(env.TETTO_GIORNO, 10) || TETTO_GIORNO_DEFAULT;
      var stopV = tropoRichieste(request.headers.get('CF-Connecting-IP') || 'ignoto', limV, tetV);
      if(stopV) return errore(stopV, 429, origin);
      return voce(request, env, origin);
    }

    // /<fornitore>/<resto del percorso>
    var pezzi = url.pathname.replace(/^\/+/, '').split('/');
    var nome = pezzi.shift();
    var f = FORNITORI[nome];
    if(!f) return errore('Fornitore sconosciuto: ' + nome, 404, origin);

    var chiavi = chiaviDi(env, f.segreto);
    if(!chiavi.length){
      return errore('Il proxy non ha una chiave per ' + nome +
        '. Impostala con: wrangler secret put ' + f.segreto, 503, origin);
    }

    var limiteIp = parseInt(env.LIMITE_IP, 10) || LIMITE_IP_DEFAULT;
    var tetto = parseInt(env.TETTO_GIORNO, 10) || TETTO_GIORNO_DEFAULT;
    var ip = request.headers.get('CF-Connecting-IP') || 'ignoto';
    var stop = tropoRichieste(ip, limiteIp, tetto);
    if(stop) return errore(stop, 429, origin);

    // Il corpo va letto UNA volta e tenuto: per ritentare con un'altra
    // chiave serve poterlo rimandare, e uno stream si consuma.
    var corpo = null;
    if(request.method === 'POST'){
      try{ corpo = await request.arrayBuffer(); }
      catch(e){ return errore('Corpo della richiesta illeggibile.', 400, origin); }
    }

    var base = new URL(f.base);
    base.pathname = '/' + pezzi.join('/');
    url.searchParams.forEach(function(v, k){
      if(k !== 'key') base.searchParams.set(k, v);   // mai propagare una chiave del client
    });

    var ultima = null;
    for(var i = 0; i < chiavi.length; i++){
      var dest = new URL(base.toString());
      var h = new Headers();
      h.set('Content-Type', request.headers.get('Content-Type') || 'application/json');
      // Solo le intestazioni che i fornitori richiedono davvero. Tutto il
      // resto (comprese eventuali credenziali del client) resta fuori:
      // un proxy che inoltra ciecamente e' un relay aperto.
      var passanti = ['anthropic-version', 'anthropic-beta'];
      passanti.forEach(function(k){
        var v = request.headers.get(k);
        if(v) h.set(k, v);
      });
      conChiave(f.modo, dest, h, chiavi[i]);

      var r;
      try{
        var opz = { method: request.method, headers: h };
        if(corpo !== null) opz.body = corpo;
        r = await fetch(dest.toString(), opz);
      }catch(e){
        ultima = errore('Impossibile contattare ' + nome + ': ' + e.message, 502, origin);
        continue;
      }

      if(r.ok){
        // Streaming: il corpo passa così com'è, senza attese.
        var out = new Headers(intestazioniCors(origin));
        out.set('Content-Type', r.headers.get('Content-Type') || 'application/json');
        out.set('Cache-Control', 'no-store');
        return new Response(r.body, { status: r.status, headers: out });
      }

      var testo = '';
      try{ testo = await r.text(); }catch(e){}
      ultima = new Response(testo || JSON.stringify({ error: { message: 'HTTP ' + r.status } }), {
        status: r.status,
        headers: Object.assign({ 'Content-Type': 'application/json' }, intestazioniCors(origin))
      });
      // Chiave bruciata o quota finita: si passa alla prossima, se c'e'.
      if(!daRitentare(r.status)) return ultima;
    }
    return ultima || errore('Nessuna chiave utilizzabile per ' + nome + '.', 503, origin);
  }
};
