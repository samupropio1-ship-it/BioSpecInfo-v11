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
  github:     { base: 'https://models.github.ai',                  segreto: 'GITHUB_KEYS',     modo: 'bearer' },
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
      return new Response(JSON.stringify({ fornitori: attivi }),
        { headers: Object.assign({ 'Content-Type': 'application/json' }, intestazioniCors(origin)) });
    }

    // GET serve quanto POST: la risoluzione del modello Gemini interroga
    // ListModels in GET, e senza chiave nel browser deve passare di qui.
    if(request.method !== 'POST' && request.method !== 'GET'){
      return errore('Metodo non consentito.', 405, origin);
    }
    if(!origineAmmessa(origin, env)) return errore('Origine non ammessa da questo proxy.', 403, '');

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
