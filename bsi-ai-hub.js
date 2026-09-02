/* =====================================================================
   SPECTRA — il copilota AI di BioSpecInfo (v2)
   Non solo una chat: un assistente agentico che conosce e OPERA
   davvero l'app — naviga sezioni, apre strumenti, cerca molecole —
   oltre a Chat, Esame Orale, Ripassa Oggi (spaced repetition SM-2
   vero) e Genera Guida.
   Un solo punto d'accesso dal menu ✨ (chiave 'aihub'), niente doppioni.
   File separato (non minificato) per restare leggibile e riusabile.
   ===================================================================== */
(function(){
'use strict';

/* ---------------------------------------------------------------------
   0. Storage helpers (usa le guardie già presenti in index.html se ci
      sono; altrimenti fallback locale sicuro)
--------------------------------------------------------------------- */
function loadJSON(key, fallback){
  try{
    if(typeof window.bsiLoadJSON === 'function') return window.bsiLoadJSON(key, fallback);
    var raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  }catch(e){ return fallback; }
}
function saveJSON(key, val){
  try{
    if(typeof window.bsiSaveJSON === 'function') return window.bsiSaveJSON(key, val);
    localStorage.setItem(key, JSON.stringify(val));
    return true;
  }catch(e){ return false; }
}

/* ---------------------------------------------------------------------
   1. Provider engine — 5 servizi, tutti chiamati direttamente dal
      browser con la chiave dell'utente (nessun server BioSpecInfo nel
      mezzo). Formati di richiesta/streaming diversi per famiglia.
--------------------------------------------------------------------- */
var PROVIDERS = {
  groq: {
    name: 'Groq — velocissimo', family: 'openai', free: true,
    // Nome NON cablato: Groq ha ritirato llama-3.3-70b-versatile il 17/06/2026
    // e l'app rispondeva "The model does not exist or you do not have access
    // to it". I candidati sono solo un ripiego: il modello vero lo sceglie
    // risolviModelloOpenai() interrogando GET /models.
    model: null,
    modelliCandidati: ['openai/gpt-oss-120b', 'qwen/qwen3.6-27b', 'openai/gpt-oss-20b',
                       'llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
    url: 'https://api.groq.com/openai/v1/chat/completions',
    authHeader: function(k){ return { Authorization: 'Bearer ' + k }; },
    keyLink: 'console.groq.com → API Keys', placeholder: 'gsk_...',
    note: 'Il modello viene scelto da solo fra quelli che la tua chiave vede davvero.'
  },
  gemini: {
    name: 'Google Gemini Flash', family: 'gemini', free: true,
    // Il nome del modello NON e' cablato. Google ritira i modelli dall'endpoint
    // e un nome fisso prima o poi restituisce 404 ("models/gemini-1.5-flash is
    // not found for API version v1beta"): e' esattamente cio' che e' successo.
    // Viene risolto a runtime interrogando ListModels (vedi
    // risolviModelloGemini), con una cascata statica di riserva.
    model: null,
    modelliCandidati: ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest',
                       'gemini-2.5-flash-lite', 'gemini-1.5-flash'],
    keyLink: 'aistudio.google.com → Get API key', placeholder: 'AIza...',
    note: 'Il modello viene scelto da solo fra quelli che la tua chiave vede davvero: se Google ne ritira uno, Spectra passa al successivo senza che tu debba fare niente.'
  },
  // ── Gratuiti "seri": modelli di fascia alta senza pagare nulla ──────────
  // Groq e OpenRouter free danno modelli piccoli; questi tre no. In cambio
  // hanno tetti di richieste piu' bassi, dichiarati nelle note.
  github: {
    name: 'GitHub Models — GPT-4.1, o4-mini, DeepSeek', family: 'openai', free: true,
    model: null,
    modelliCandidati: ['openai/gpt-4.1', 'openai/o4-mini', 'deepseek/DeepSeek-V3-0324',
                       'meta/Llama-4-Maverick-17B-128E-Instruct-FP8', 'openai/gpt-4o'],
    preferisci: /^(openai|deepseek)\//,
    url: 'https://models.github.ai/inference/chat/completions',
    // Il catalogo NON sta sotto /inference: e' l'unico caso finora in cui
    // l'elenco dei modelli non si ricava dall'endpoint della chat.
    urlModelli: 'https://models.github.ai/catalog/models',
    // Tetto del piano gratuito: 8.000 token IN INGRESSO per richiesta. Il
    // costo fisso di Spectra (prompt + 32 strumenti) e' ~8.150, quindi senza
    // budget questo servizio non partirebbe nemmeno. Vedi adattaAlBudget().
    maxInput: 8000,
    authHeader: function(k){ return { Authorization: 'Bearer ' + k }; },
    keyLink: 'github.com → Settings → Developer settings → Personal access tokens (permesso "Models: read")',
    placeholder: 'github_pat_... oppure ghp_...',
    note: 'Il più potente fra i gratuiti e non serve un account nuovo: basta un token del tuo GitHub. In cambio il tetto è basso — 10 richieste al minuto e 50 al giorno — quindi tienilo per le domande difficili.'
  },
  nvidia: {
    name: 'NVIDIA NIM — DeepSeek R1, Llama 4, Qwen', family: 'openai', free: true,
    model: null,
    modelliCandidati: ['deepseek-ai/deepseek-r1', 'qwen/qwen3-235b-a22b',
                       'meta/llama-4-maverick-17b-128e-instruct',
                       'nvidia/llama-3.3-nemotron-super-49b-v1', 'meta/llama-3.3-70b-instruct'],
    preferisci: /deepseek|qwen3|llama-4|nemotron/,
    url: 'https://integrate.api.nvidia.com/v1/chat/completions',
    authHeader: function(k){ return { Authorization: 'Bearer ' + k }; },
    keyLink: 'build.nvidia.com → Get API Key (programma sviluppatori, senza carta)',
    placeholder: 'nvapi-...',
    note: 'Oltre 100 modelli, compresi quelli enormi che ragionano (DeepSeek R1). I crediti gratuiti sono a esaurimento, non si rinnovano da soli.'
  },
  mistral: {
    name: 'Mistral — Large e Medium', family: 'openai', free: true,
    model: null,
    modelliCandidati: ['mistral-large-latest', 'mistral-medium-latest',
                       'mistral-small-latest', 'open-mistral-nemo'],
    preferisci: /large|medium/,
    maxInput: 28000,
    url: 'https://api.mistral.ai/v1/chat/completions',
    authHeader: function(k){ return { Authorization: 'Bearer ' + k }; },
    keyLink: 'console.mistral.ai → API Keys (piano "Experiment")',
    placeholder: 'chiave alfanumerica',
    note: 'Circa un miliardo di token al mese, Mistral Large incluso. Attenzione: il piano gratuito richiede la verifica del telefono e il consenso all\'uso dei tuoi dati per l\'addestramento — se il contenuto è sensibile, usa un altro servizio.'
  },
  openrouter: {
    name: 'OpenRouter', family: 'openai', free: true,
    // Su OpenRouter gli id dei modelli gratuiti cambiano di continuo, quindi
    // cablarne uno e' garanzia di rottura. 'openrouter/free' e' un instradatore
    // che sceglie da solo fra i gratuiti e filtra quelli che sanno usare gli
    // strumenti: e' il candidato giusto per un agente come Spectra.
    model: null,
    modelliCandidati: ['openrouter/free', 'openrouter/auto'],
    // Preferenza usata quando nessun candidato esiste piu': fra i modelli
    // gratuiti disponibili si sceglie in base a questa regola.
    preferisci: /:free$/,
    url: 'https://openrouter.ai/api/v1/chat/completions',
    authHeader: function(k){ return { Authorization: 'Bearer ' + k, 'HTTP-Referer': (location && location.href) || 'https://biospecinfo', 'X-Title': 'BioSpecInfo' }; },
    keyLink: 'openrouter.ai → Keys', placeholder: 'sk-or-v1-...',
    note: 'Sceglie da solo un modello gratuito che sappia usare gli strumenti.'
  },
  // ── Gamma Claude, dal massimo all'economico ──────────────────────────────
  // Ogni modello ha vincoli API diversi: mandare a uno un parametro che non
  // supporta significa 400 secco. In particolare Haiku 4.5 NON accetta
  // output_config.effort e non ha la ricerca web di nuova generazione.
  claude_fable: {
    name: 'Claude Fable 5.1 — il massimo', family: 'anthropic', free: false,
    model: 'claude-fable-5-1',
    // Su Fable il ragionamento e' sempre attivo: si controlla solo la profondita'.
    thinking: { type: 'adaptive', display: 'summarized' },
    effort: 'xhigh',                 // il livello consigliato per il lavoro agentico
    webSearch: true, webSearchMaxUses: 8,
    // I classificatori di sicurezza possono declinare una richiesta (HTTP 200 con
    // stop_reason "refusal"). Con i fallback la stessa richiesta viene ripresa da
    // un altro modello nella stessa chiamata, invece di interrompersi e basta.
    fallbacks: 'default', beta: 'server-side-fallback-2026-07-01',
    maxTokens: 32000,
    url: 'https://api.anthropic.com/v1/messages',
    authHeader: function(k){ return { 'x-api-key': k, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }; },
    keyLink: 'console.anthropic.com → API Keys', placeholder: 'sk-ant-...',
    note: 'Il modello più capace, per i problemi più difficili. Anche il più costoso.'
  },
  claude: {
    name: 'Claude Opus 5 (Anthropic)', family: 'anthropic', free: false,
    model: 'claude-opus-5',
    // Opus 5 ragiona di suo (adaptive thinking sempre attivo): e' il modello
    // piu' capace nell'incatenare strumenti, quindi il migliore per il Copilota.
    // display:'summarized' e' voluto — con il valore predefinito ('omitted') il
    // modello pensa in silenzio e l'utente vede solo una lunga pausa.
    thinking: { type: 'adaptive', display: 'summarized' },
    effort: 'high',
    webSearch: true, webSearchMaxUses: 6,
    maxTokens: 16000,
    url: 'https://api.anthropic.com/v1/messages',
    authHeader: function(k){ return { 'x-api-key': k, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }; },
    keyLink: 'console.anthropic.com → API Keys', placeholder: 'sk-ant-...',
    note: 'A pagamento e separato dall\'abbonamento di claude.ai: serve credito API su console.anthropic.com.'
  },
  claude_sonnet: {
    name: 'Claude Sonnet 5 — equilibrato', family: 'anthropic', free: false,
    model: 'claude-sonnet-5',
    thinking: { type: 'adaptive', display: 'summarized' },
    effort: 'high',
    webSearch: true, webSearchMaxUses: 5,
    maxTokens: 16000,
    url: 'https://api.anthropic.com/v1/messages',
    authHeader: function(k){ return { 'x-api-key': k, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }; },
    keyLink: 'console.anthropic.com → API Keys', placeholder: 'sk-ant-...',
    note: 'Quasi la qualità di Opus a meno della metà del costo: la scelta di tutti i giorni.'
  },
  claude_haiku: {
    name: 'Claude Haiku 4.5 (economico)', family: 'anthropic', free: false,
    model: 'claude-haiku-4-5',
    // NIENTE effort e NIENTE web_search di nuova generazione: su Haiku 4.5
    // non sono supportati e la richiesta verrebbe rifiutata.
    maxTokens: 8000,
    url: 'https://api.anthropic.com/v1/messages',
    authHeader: function(k){ return { 'x-api-key': k, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }; },
    keyLink: 'console.anthropic.com → API Keys', placeholder: 'sk-ant-...',
    note: 'Stessa chiave di Claude Opus 5, ma molto più economico.'
  },
  grok: {
    name: 'Grok (xAI)', family: 'openai', free: false,
    model: null,
    modelliCandidati: ['grok-4-fast', 'grok-4', 'grok-3-mini', 'grok-3'],
    preferisci: /^grok-/,
    url: 'https://api.x.ai/v1/chat/completions',
    authHeader: function(k){ return { Authorization: 'Bearer ' + k }; },
    keyLink: 'console.x.ai → API Keys', placeholder: 'xai-...',
    note: 'Alcuni provider bloccano le chiamate dirette dal browser: se Grok non risponde, prova Claude, Gemini o Groq.'
  }
};
// Ogni configurazione porta la propria chiave di registro: serve a sapere,
// dato il solo oggetto provider, verso quale fornitore reale instradare.
Object.keys(PROVIDERS).forEach(function(k){ PROVIDERS[k].id = k; });
window.BSI_AI_PROVIDERS = PROVIDERS;

/* ---------------------------------------------------------------------
   1a-bis. PROXY OPZIONALE — Spectra senza chiave
   Se PROXY_URL punta a un Worker (vedi proxy/spectra-proxy.js), le chiavi
   stanno sul server e il browser non ne vede nessuna: chi apre il sito usa
   Spectra e basta. Se non e' configurato, tutto funziona come prima, con la
   chiave dell'utente salvata in locale — le due strade convivono.
   L'indirizzo del proxy NON e' un segreto: e' solo un URL. Il segreto e' la
   chiave, e quella resta su Cloudflare.
--------------------------------------------------------------------- */
var PROXY_URL = '';   // <-- incolla qui l'indirizzo del Worker dopo il deploy
                      //     es. 'https://spectra-proxy.tuonome.workers.dev'

// Da quale fornitore reale dipende ciascuna configurazione di modello.
var UPSTREAM = {
  groq: 'groq', gemini: 'gemini', openrouter: 'openrouter', grok: 'xai',
  github: 'github', nvidia: 'nvidia', mistral: 'mistral',
  claude_fable: 'anthropic', claude: 'anthropic',
  claude_sonnet: 'anthropic', claude_haiku: 'anthropic'
};

function proxyUrl(){
  var u = '';
  // L'override locale serve a provare un proxy senza ripubblicare il sito.
  try{ u = localStorage.getItem('bsi_proxy_url') || ''; }catch(e){}
  if(!u) u = window.BSI_PROXY_URL || PROXY_URL || '';
  return String(u).replace(/\/+$/, '');
}

/* Quali fornitori il proxy copre davvero. Lo dice lui stesso da /stato: cosi'
   Spectra non offre come "senza chiave" un modello per cui il proxy non ha
   una chiave, che fallirebbe solo al primo messaggio. In attesa della
   risposta si assume nessuno, e la UI chiede la chiave come sempre. */
var _proxyFornitori = null;
var _proxyAtteso = null;
function proxyStato(){
  if(_proxyAtteso) return _proxyAtteso;
  var base = proxyUrl();
  if(!base){ _proxyFornitori = []; return Promise.resolve([]); }
  _proxyAtteso = fetch(base + '/stato', { method: 'GET' })
    .then(function(r){ return r.ok ? r.json() : { fornitori: [] }; })
    .then(function(j){ _proxyFornitori = (j && j.fornitori) || []; return _proxyFornitori; })
    .catch(function(){ _proxyFornitori = []; return []; });
  return _proxyAtteso;
}
// Sincrona: usata dove non si puo' aspettare (costruzione richiesta, UI).
// Vale solo dopo che proxyStato() ha risposto almeno una volta.
function proxyCopre(providerId){
  if(!proxyUrl() || !_proxyFornitori) return false;
  return _proxyFornitori.indexOf(UPSTREAM[providerId]) >= 0;
}
// Rotta verso il proxy per un percorso del fornitore, oppure null se il
// proxy non e' attivo per questo provider (allora si chiama diretto).
function viaProxy(providerId, percorso){
  if(!proxyCopre(providerId)) return null;
  return proxyUrl() + '/' + UPSTREAM[providerId] + percorso;
}
/* Rilegge lo stato del proxy. Serve quando l'indirizzo cambia a pagina gia'
   aperta (override in localStorage): senza, resterebbe valido l'elenco di
   fornitori del proxy precedente. */
function proxyRicarica(){ _proxyAtteso = null; _proxyFornitori = null; return proxyStato(); }
window.bsiProxy = { url: proxyUrl, stato: proxyStato, copre: proxyCopre, ricarica: proxyRicarica };

/* ---------------------------------------------------------------------
   1a. RISOLUZIONE DEL MODELLO — nessun nome cablato, per NESSUN fornitore
   I fornitori ritirano i modelli senza preavviso e l'app si ferma con un
   404. E' successo due volte:
     · Google: "models/gemini-1.5-flash is not found for API version v1beta"
     · Groq:   "The model llama-3.3-70b-versatile does not exist or you do
                not have access to it" (ritirato il 17/06/2026)
   Su OpenRouter e' anche peggio: gli id dei modelli gratuiti cambiano di
   continuo per costruzione.
   La correzione non e' scrivere il nome nuovo — sarebbe la stessa bomba a
   orologeria con la miccia piu' lunga — ma togliere il nome e chiederlo
   all'API, che sa quali modelli esistono per QUELLA chiave. (Il che risolve
   anche l'ambiguita' del messaggio di Groq: "non esiste" OPPURE "non ci hai
   accesso" sono casi diversi, e l'elenco per chiave li distingue.)
   La scelta va in cache una settimana, legata all'impronta della chiave.
--------------------------------------------------------------------- */
var GEMINI_ROOT = 'https://generativelanguage.googleapis.com/v1beta';
var MODELLO_CACHE_TTL = 7 * 24 * 3600 * 1000;
var GEMINI_META_TIMEOUT = 12000;

// Impronta a 32 bit (FNV-1a) della chiave: serve solo a non riusare la cache
// di una chiave per un'altra. La chiave in chiaro non viene mai duplicata qui.
function _improntaChiave(k){
  var h = 0x811c9dc5;
  for(var i = 0; i < k.length; i++){
    h ^= k.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(16);
}

function _cacheKey(provId){ return 'bsi_modello_' + provId; }
function modelloCacheLeggi(provId, apiKey){
  var c = loadJSON(_cacheKey(provId), null);
  if(!c || !c.model || c.k !== _improntaChiave(apiKey || '')) return null;
  if(!c.ts || (Date.now() - c.ts) > MODELLO_CACHE_TTL) return null;
  return c.model;
}
function modelloCacheScrivi(provId, apiKey, model){
  saveJSON(_cacheKey(provId), { model: model, k: _improntaChiave(apiKey || ''), ts: Date.now() });
}
function modelloCacheInvalida(provId){
  try{
    if(provId) localStorage.removeItem(_cacheKey(provId));
    else Object.keys(PROVIDERS).forEach(function(k){ localStorage.removeItem(_cacheKey(k)); });
  }catch(e){}
}
// nomi storici, mantenuti per non toccare i richiami esistenti
function geminiCacheLeggi(apiKey){ return modelloCacheLeggi('gemini', apiKey); }
function geminiCacheScrivi(apiKey, model){ modelloCacheScrivi('gemini', apiKey, model); }
function geminiCacheInvalida(){ modelloCacheInvalida('gemini'); }

// GET con timeout: senza, una richiesta appesa bloccherebbe l'invio del
// messaggio per sempre, prima ancora che parta il timeout di inattivita'.
async function _getConTimeout(url){
  var ctrl = (typeof AbortController === 'function') ? new AbortController() : null;
  var t = ctrl ? setTimeout(function(){ try{ ctrl.abort(); }catch(e){} }, GEMINI_META_TIMEOUT) : null;
  try{
    return await fetch(url, ctrl ? { method: 'GET', signal: ctrl.signal } : { method: 'GET' });
  } finally { if(t) clearTimeout(t); }
}

/* Percorso dei metadati Gemini: via proxy quando c'e' (nessuna chiave nel
   browser), altrimenti diretto con la chiave dell'utente. */
function geminiMetaUrl(percorso, apiKey){
  var p = viaProxy('gemini', '/v1beta' + percorso);
  if(p) return p;
  return GEMINI_ROOT + percorso +
         (percorso.indexOf('?') >= 0 ? '&' : '?') + 'key=' + encodeURIComponent(apiKey);
}

async function geminiListModels(apiKey){
  var out = [], token = '', giri = 0;
  while(giri++ < 5){
    var u = geminiMetaUrl('/models?pageSize=200' +
            (token ? '&pageToken=' + encodeURIComponent(token) : ''), apiKey);
    var r = await _getConTimeout(u);
    if(!r.ok) throw new Error('ListModels HTTP ' + r.status);
    var j = await r.json();
    if(j && j.models && j.models.length) out = out.concat(j.models);
    token = (j && j.nextPageToken) || '';
    if(!token) break;
  }
  return out;
}

async function geminiEsiste(apiKey, nome){
  try{
    var r = await _getConTimeout(geminiMetaUrl('/models/' + encodeURIComponent(nome), apiKey));
    return !!(r && r.ok);
  }catch(e){ return false; }
}

/* Punteggio di un modello restituito da ListModels. -1 = da scartare.
   Criteri, in ordine di peso: versione piu' recente, famiglia flash
   (gratuita e veloce), niente varianti sperimentali o specializzate. */
function punteggioGemini(m){
  if(!m || !m.name) return -1;
  var n = String(m.name).replace(/^models\//, '');
  if(!/^gemini-/.test(n)) return -1;
  var meth = m.supportedGenerationMethods || [];
  // Spectra parla solo in streaming: un modello che non lo espone e' inutile.
  if(meth.indexOf('streamGenerateContent') < 0) return -1;
  // Modelli non conversazionali o con protocollo diverso (audio nativo, Live
  // API, generazione di immagini/video): risponderebbero, ma non a noi.
  if(/embedding|aqa|imagen|veo|tts|image-generation|native-audio|live-|learnlm|gemma/.test(n)) return -1;
  var s = 0;
  var v = n.match(/^gemini-(\d+)\.(\d+)/);
  if(v) s += parseInt(v[1], 10) * 100 + parseInt(v[2], 10) * 10;
  else s += 150;                       // alias tipo 'gemini-flash-latest'
  if(/flash/.test(n)) s += 40;
  else if(/pro/.test(n)) s += 10;
  if(/-lite/.test(n)) s -= 15;
  if(/(exp|preview|-\d{3,})/.test(n)) s -= 30;
  if(/thinking/.test(n)) s -= 5;
  if(/-8b/.test(n)) s -= 20;
  return s;
}

async function risolviModelloGemini(apiKey, forzaRefresh){
  var riserva = PROVIDERS.gemini.modelliCandidati;
  // Col proxy la chiave non c'e' (sta sul server) ma la risoluzione funziona
  // lo stesso, passando di li'. Senza ne' chiave ne' proxy non c'e' niente da
  // interrogare: si torna subito la riserva.
  if(!apiKey && !proxyCopre('gemini')) return riserva[0];
  if(!forzaRefresh){
    var c = geminiCacheLeggi(apiKey);
    if(c) return c;
  }
  var scelto = null;
  try{
    var lista = await geminiListModels(apiKey);
    var best = null, bestS = -1;
    for(var i = 0; i < lista.length; i++){
      var s = punteggioGemini(lista[i]);
      if(s > bestS){ bestS = s; best = lista[i]; }
    }
    if(best && bestS >= 0) scelto = String(best.name).replace(/^models\//, '');
  }catch(e){ /* ListModels non raggiungibile: si passa alla cascata */ }

  if(!scelto){
    for(var j = 0; j < riserva.length; j++){
      if(await geminiEsiste(apiKey, riserva[j])){ scelto = riserva[j]; break; }
    }
  }
  // Se anche le sonde falliscono (rete giu', chiave non valida) si usa il primo
  // candidato: meglio l'errore vero della chiamata di generazione — "API key
  // not valid" — di un errore inventato qui che nasconde la causa.
  if(!scelto) return riserva[0];
  geminiCacheScrivi(apiKey, scelto);
  return scelto;
}
/* --- Fornitori OpenAI-compatibili (Groq, OpenRouter, xAI) ------------
   Tutti espongono GET <base>/models con l'elenco di cio' che la chiave
   vede. Qui i candidati contano di piu' che su Gemini: i nomi non seguono
   uno schema di versione confrontabile ("openai/gpt-oss-120b" contro
   "qwen/qwen3.6-27b"), quindi l'ordine dei candidati E' la preferenza, e
   l'elenco serve a saltare quelli spariti. */

// L'endpoint dei modelli si ricava da quello della chat, quando seguono la
// convenzione OpenAI. Chi non la segue (GitHub Models tiene il catalogo su un
// percorso diverso dall'inferenza) lo dichiara con urlModelli.
function urlModelliOpenai(p){
  var diretto = p.urlModelli || p.url.replace(/\/chat\/completions$/, '/models');
  try{
    var viaP = viaProxy(p.id, new URL(diretto).pathname);
    if(viaP) return viaP;
  }catch(e){}
  return diretto;
}

async function listaModelliOpenai(p, apiKey){
  var h = {};
  // Col proxy l'autenticazione la mette il Worker: non va aggiunta qui.
  if(!proxyCopre(p.id)) h = p.authHeader(apiKey);
  var ctrl = (typeof AbortController === 'function') ? new AbortController() : null;
  var t = ctrl ? setTimeout(function(){ try{ ctrl.abort(); }catch(e){} }, GEMINI_META_TIMEOUT) : null;
  var r;
  try{
    var opz = { method: 'GET', headers: h };
    if(ctrl) opz.signal = ctrl.signal;
    r = await fetch(urlModelliOpenai(p), opz);
  } finally { if(t) clearTimeout(t); }
  if(!r.ok) throw new Error('models HTTP ' + r.status);
  var j = await r.json();
  // Tre forme in circolazione: {data:[...]} (OpenAI), {models:[...]} e la
  // lista nuda (il catalogo di GitHub Models).
  var dati = Array.isArray(j) ? j : ((j && (j.data || j.models)) || []);
  return dati.map(function(m){
    if(typeof m === 'string') return m;
    return (m && (m.id || m.name)) || '';
  }).filter(Boolean);
}

/* Usato solo quando NESSUN candidato esiste piu': fra i modelli disponibili
   se ne sceglie uno plausibile per una chat con strumenti. */
function punteggioOpenai(id, p){
  var n = String(id).toLowerCase();
  // Modelli che non servono a una conversazione: trascrizione, sintesi vocale,
  // classificatori di sicurezza, embedding, immagini.
  if(/whisper|tts|audio|embed|guard|moderat|rerank|image|vision-only|dall-e|sdxl|flux/.test(n)) return -1;
  var s = 0;
  if(p.preferisci && p.preferisci.test(id)) s += 100;
  // A parita' d'altro un modello piu' grande ragiona meglio: 120b > 70b > 8b.
  var b = n.match(/(\d+(?:\.\d+)?)\s*b(?![a-z0-9])/);
  if(b) s += Math.min(parseFloat(b[1]), 200) / 2;
  if(/instruct|chat|-it\b/.test(n)) s += 10;
  if(/preview|alpha|beta|experimental|-exp/.test(n)) s -= 20;
  return s;
}

async function risolviModelloOpenai(p, apiKey, forzaRefresh){
  var riserva = p.modelliCandidati || [p.model];
  if(!apiKey && !proxyCopre(p.id)) return riserva[0];
  if(!forzaRefresh){
    var c = modelloCacheLeggi(p.id, apiKey);
    if(c) return c;
  }
  var scelto = null;
  try{
    var disponibili = await listaModelliOpenai(p, apiKey);
    var insieme = {};
    disponibili.forEach(function(id){ insieme[id] = true; });
    // 1. il primo candidato ancora esistente
    for(var i = 0; i < riserva.length && !scelto; i++){
      if(insieme[riserva[i]]) scelto = riserva[i];
    }
    // 2. nessun candidato sopravvissuto: si sceglie fra cio' che c'e'
    if(!scelto){
      // bestS parte da -1, non da 0: solo -1 significa "da scartare". Un
      // modello valido ma senza indizi nel nome (nessuna taglia, nessun
      // "instruct") vale 0, e va comunque preso se e' l'unico rimasto.
      var best = null, bestS = -1;
      for(var j = 0; j < disponibili.length; j++){
        var s = punteggioOpenai(disponibili[j], p);
        if(s > bestS){ bestS = s; best = disponibili[j]; }
      }
      scelto = best;
    }
  }catch(e){ /* elenco non raggiungibile: si usa la riserva */ }
  // 3. si lascia parlare l'errore vero della chiamata di generazione, invece
  //    di inventarne uno qui che nasconderebbe la causa.
  if(!scelto) return riserva[0];
  modelloCacheScrivi(p.id, apiKey, scelto);
  return scelto;
}

/* Punto unico: dato un provider, restituisce il modello da usare. Per
   Anthropic i nomi sono stabili e scelti esplicitamente dall'utente
   (sono a pagamento), quindi restano come sono. */
async function risolviModello(p, apiKey, forzaRefresh){
  if(!p.modelliCandidati) return p.model;
  if(p.family === 'gemini') return risolviModelloGemini(apiKey, forzaRefresh);
  return risolviModelloOpenai(p, apiKey, forzaRefresh);
}

// esposti per i test e per un eventuale "ricontrolla i modelli" dalla UI
window.bsiGeminiRisolvi = risolviModelloGemini;
window.bsiRisolviModello = risolviModello;
window.bsiGeminiReset = function(provId){ modelloCacheInvalida(provId); };

/* ---------------------------------------------------------------------
   1c. BUDGET DELLA RICHIESTA
   Alcuni gratuiti hanno un tetto di token IN INGRESSO molto basso: GitHub
   Models ne accetta 8.000 per richiesta. Il costo fisso di Spectra e' gia'
   circa 8.150 — 2.000 di prompt di sistema piu' 6.128 di definizioni dei
   32 strumenti — quindi senza budget quel servizio fallirebbe al primo
   messaggio, prima ancora che l'utente scriva.
   Con il budget si spende dove serve: si mandano gli strumenti PERTINENTI
   alla domanda invece di tutti e 32, e si taglia la cronologia piu' vecchia.
   Sui provider senza tetto stretto non cambia niente.
--------------------------------------------------------------------- */

// Stima, non conteggio: circa 4 caratteri per token. Basta per decidere cosa
// tagliare, e non richiede un tokenizzatore da 300 KB nella pagina.
function stimaToken(x){
  if(x == null) return 0;
  var s = (typeof x === 'string') ? x : JSON.stringify(x);
  return Math.ceil(s.length / 4);
}

// Strumenti che restano SEMPRE, anche col budget piu' stretto: senza questi
// Spectra smette di essere un copilota e torna a essere una chat.
var STRUMENTI_SEMPRE = ['calcola', 'naviga_sezione', 'cerca_nel_database'];

/* Parole con cui la gente CHIEDE una cosa, che non sono quelle con cui lo
   strumento e' documentato. La descrizione di 'astrofisica' parla di Wien e
   Stefan-Boltzmann; l'utente scrive "che temperatura ha questa nebulosa".
   Confrontare la domanda con la sola descrizione non trova nulla — misurato:
   su una domanda di astrochimica veniva scelta 'farmacocinetica'.
   Questa mappa sta FUORI dal registro TOOLS di proposito: non deve finire
   nello schema mandato al modello, che descrive gli strumenti, non come si
   chiedono. */
var PAROLE_STRUMENTO = {
  naviga_sezione: 'apri vai mostra sezione pagina schermata portami',
  apri_strumento: 'apri avvia lancia strumento laboratorio simulatore visualizzatore',
  cerca_molecola: 'molecola composto sostanza struttura formula smiles cerca trova',
  calcola: 'calcola quanto risultato conto espressione numero valore',
  risolvi_equazione: 'risolvi equazione incognita sistema radici grado',
  analisi_dati: 'dati serie media deviazione regressione correlazione grafico tabella',
  spettroscopia: 'spettro spettri infrarosso segnale picco banda assorbimento risonanza chimico',
  biochimica: 'proteina enzima amminoacido dna rna peptide metabolismo glicolisi krebs cellula',
  farmacocinetica: 'farmaco dose posologia clearance emivita plasma somministrazione paziente terapia',
  termodinamica: 'entalpia entropia energia gibbs calore lavoro spontaneo reazione temperatura',
  equilibrio_acido_base: 'acido base tampone titolazione neutro alcalino idrolisi dissociazione',
  cinetica: 'velocita ordine reazione costante arrhenius attivazione catalisi meccanismo',
  gas_e_soluzioni: 'gas pressione volume mole ideale molarita concentrazione diluizione osmotica solubilita',
  quantistica_e_spettroscopia: 'orbitale elettrone onda fotone livello energia atomo quantico idrogeno bohr planck',
  elettrochimica: 'pila cella elettrodo potenziale redox nernst corrente elettrolisi ossidazione riduzione',
  astrofisica: 'stella stellare nebulosa galassia cosmo universo pianeta astro spaziale luminosita temperatura corpo nero interstellare cometa',
  nucleare: 'nucleo radioattivo decadimento isotopo fissione fusione neutrone protone becquerel legame nucleone',
  statistica_inferenziale: 'test ipotesi significativo campione media confronto student chi quadro intervallo confidenza',
  cristallografia: 'cristallo reticolo cella diffrazione bragg miller simmetria solido raggi',
  bilancia_equazione: 'bilancia bilanciare equazione reazione coefficiente reagente prodotto',
  stechiometria: 'quanti grammi resa reagente limitante moli prodotto reazione quantita',
  cerca_pubchem: 'pubchem banca dati proprieta composto cerca scheda',
  massa_molecolare: 'massa molecolare peso formula bruta molare grammi mole',
  valuta_druglikeness: 'farmaco druglike lipinski assorbimento orale biodisponibile candidato',
  converti_unita: 'converti conversione unita misura equivale trasforma',
  costante_fisica: 'costante avogadro planck boltzmann gas universale valore',
  cerca_letteratura: 'articolo paper studio ricerca letteratura pubmed pubblicazione bibliografia fonte',
  ricorda: 'ricorda segna memorizza appunta nota tieni presente',
  ricordi: 'ricordi sai cosa avevo detto memoria precedente',
  cerca_nel_database: 'database interno app dataset elenco scheda archivio biospecinfo',
  apri_animazione: 'animazione video meccanismo mostrami visualizza movimento',
  stato_app: 'dove sono adesso schermata corrente stato apertura'
};

/* Radice di una parola: i primi 5 caratteri. Serve perche' l'italiano
   flette — "nebulosa" e "nebulose", "temperatura" e "temperature" devono
   contare come la stessa cosa, e un confronto esatto le mancherebbe. */
function _radice(w){ return w.slice(0, 5); }
function _radici(testo){
  var out = {};
  (String(testo).toLowerCase().match(/[a-zàèéìòùç]{4,}/g) || []).forEach(function(w){
    out[_radice(w)] = 1;
  });
  return out;
}

/* Quanto uno strumento c'entra con quello che si sta dicendo. Pesa di piu'
   le parole con cui lo si chiede, di meno quelle con cui e' documentato.
   Tutto locale: nessun giro in piu' al modello per scegliere gli strumenti. */
function rilevanzaStrumento(t, radiciTesto){
  var punti = 0;
  var chiavi = PAROLE_STRUMENTO[t.name] || '';
  var viste = {};
  (chiavi.match(/[a-zàèéìòùç]{4,}/g) || []).forEach(function(w){
    var r = _radice(w);
    if(viste[r]) return; viste[r] = 1;
    if(radiciTesto[r]) punti += 3;                 // come si chiede: peso pieno
  });
  var desc = (t.name.replace(/_/g, ' ') + ' ' + (t.description || '')).toLowerCase();
  (desc.match(/[a-zàèéìòùç]{5,}/g) || []).forEach(function(w){
    var r = _radice(w);
    if(viste[r]) return; viste[r] = 1;
    if(radiciTesto[r]) punti += 1;                 // come e' documentato: peso ridotto
  });
  return punti;
}

/* Sceglie gli strumenti che stanno nel budget, i piu' pertinenti prima.
   Restituisce l'elenco completo quando il budget basta per tutti. */
function selezionaStrumenti(tools, testo, budget){
  if(!tools || !tools.length) return tools;
  var costoTotale = stimaToken(tools);
  if(!budget || costoTotale <= budget) return tools;

  var radici = _radici(testo);
  var ordinati = tools.map(function(t, i){
    return { t: t, i: i, costo: stimaToken(t),
             sempre: STRUMENTI_SEMPRE.indexOf(t.name) >= 0,
             punti: rilevanzaStrumento(t, radici) };
  }).sort(function(a, b){
    if(a.sempre !== b.sempre) return a.sempre ? -1 : 1;
    if(b.punti !== a.punti) return b.punti - a.punti;
    return a.costo - b.costo;          // a pari merito, prima i piu' economici
  });

  var scelti = [], speso = 0;
  for(var k = 0; k < ordinati.length; k++){
    var o = ordinati[k];
    // I "sempre" entrano anche se sforano: senza, il copilota si spegne.
    if(!o.sempre && speso + o.costo > budget) continue;
    scelti.push(o);
    speso += o.costo;
  }
  // Rimessi nell'ordine originale: l'ordine del registro e' quello in cui
  // sono documentati, e cambiarlo ad ogni turno confonderebbe la cache del
  // prompt lato fornitore.
  return scelti.sort(function(a, b){ return a.i - b.i; }).map(function(o){ return o.t; });
}

/* Taglia la cronologia dal fondo (i messaggi piu' vecchi) finche' non entra
   nel budget. L'ULTIMO messaggio non si tocca mai: e' la domanda a cui si
   deve rispondere. Un turno con chiamate a strumenti e il suo risultato
   vengono tolti insieme — separarli fa rifiutare la richiesta dall'API. */
function tagliaCronologia(messages, budget){
  if(!messages || !messages.length) return messages;
  var msgs = messages.slice();
  if(!budget || stimaToken(msgs) <= budget) return msgs;

  while(msgs.length > 1 && stimaToken(msgs) > budget){
    msgs.shift();
    // Se in testa e' rimasto un risultato di strumento orfano (il turno che
    // lo aveva richiesto se n'e' andato), si toglie anche quello.
    while(msgs.length > 1 && messaggioOrfano(msgs[0])) msgs.shift();
  }
  return msgs;
}
// Un messaggio che ha senso solo insieme a quello che lo precede.
function messaggioOrfano(m){
  if(!m) return false;
  if(m.role === 'tool') return true;
  if(m.content === '[risultati strumenti]') return true;
  if(m._native){
    var g = m._native.gemini;
    if(g && g.parts && g.parts.some(function(p){ return p.functionResponse; })) return true;
    var a = m._native.anthropic;
    if(Array.isArray(a) && a.some(function(b){ return b.type === 'tool_result'; })) return true;
  }
  return false;
}

/* Applica il budget del provider. Ordine voluto: prima si tagliano gli
   strumenti, poi la cronologia. Gli strumenti sono un costo fisso ripetuto
   ad ogni turno, la cronologia e' il contenuto della conversazione: fra i
   due, e' il costo fisso a doversi stringere per primo. */
function adattaAlBudget(p, messages, systemPrompt, tools){
  if(!p.maxInput) return { messages: messages, tools: tools, tagliato: false };
  var fisso = stimaToken(systemPrompt);
  var disponibile = p.maxInput - fisso - 400;   // margine per la risposta attesa
  if(disponibile < 500) disponibile = 500;

  // Agli strumenti al massimo il 55% di cio' che resta: oltre, non rimarrebbe
  // spazio per una conversazione di piu' di due battute.
  var tools2 = selezionaStrumenti(tools, testoRecente(messages), Math.floor(disponibile * 0.55));
  var perChat = disponibile - stimaToken(tools2);
  var messages2 = tagliaCronologia(messages, perChat);
  return {
    messages: messages2, tools: tools2,
    tagliato: (tools2 && tools && tools2.length < tools.length) || messages2.length < messages.length
  };
}

// Il testo su cui si misura la pertinenza: gli ultimi turni, non tutta la
// conversazione — altrimenti uno strumento nominato mezz'ora fa peserebbe
// quanto la domanda di adesso.
function testoRecente(messages){
  return (messages || []).slice(-4).map(function(m){
    return typeof m.content === 'string' ? m.content : '';
  }).join(' ');
}

// Converte il registro TOOLS (comune) nel formato richiesto da ciascuna famiglia
function toolsForFamily(family, tools){
  if(!tools || !tools.length) return undefined;
  if(family === 'anthropic'){
    return tools.map(function(t){ return { name: t.name, description: t.description, input_schema: t.parameters }; });
  }
  if(family === 'gemini'){
    return [{ functionDeclarations: tools.map(function(t){ return { name: t.name, description: t.description, parameters: t.parameters }; }) }];
  }
  // openai-compatibile
  return tools.map(function(t){ return { type: 'function', function: { name: t.name, description: t.description, parameters: t.parameters } }; });
}

function buildRequest(p, apiKey, messages, systemPrompt, tools){
  if(p.family === 'gemini'){
    var body = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: messages.map(geminiMsg),
      generationConfig: { temperature: 0.6 }
    };
    var gTools = toolsForFamily('gemini', tools);
    if(gTools) body.tools = gTools;
    // p.model e' stato risolto da streamChat; il fallback copre le chiamate
    // diverse (test, uso diretto) in cui la risoluzione non e' passata.
    var gMod = p.model || p.modelliCandidati[0];
    var gCoda = '/models/' + encodeURIComponent(gMod) + ':streamGenerateContent?alt=sse';
    return {
      // Col proxy la chiave non compare: la mette il server.
      url: viaProxy('gemini', '/v1beta' + gCoda) ||
           (GEMINI_ROOT + gCoda + '&key=' + encodeURIComponent(apiKey)),
      headers: { 'Content-Type': 'application/json' },
      body: body
    };
  }
  if(p.family === 'anthropic'){
    var aUrl = viaProxy(p.id, '/v1/messages');
    // anthropic-version resta obbligatoria anche via proxy (il Worker la
    // inoltra); x-api-key invece la aggiunge il Worker, non il browser.
    var h = aUrl
      ? { 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01' }
      : Object.assign({ 'Content-Type': 'application/json' }, p.authHeader(apiKey));
    var aBody = {
      model: p.model, max_tokens: p.maxTokens || 4000, stream: true, system: systemPrompt,
      messages: messages.map(anthropicMsg)
    };
    // NB: sui modelli recenti (Opus 5 e famiglia 4.6+) temperature/top_p sono
    // stati rimossi e farebbero fallire la richiesta con un 400: non inviarli.
    if(p.thinking) aBody.thinking = p.thinking;
    // Profondita' di ragionamento: e' la leva che separa una risposta rapida da
    // una ragionata. 'high' e' il punto di equilibrio fra qualita' e costo.
    if(p.effort) aBody.output_config = { effort: p.effort };
    var aTools = toolsForFamily('anthropic', tools);
    if(aTools) aBody.tools = aTools;
    // Ricerca web nativa di Anthropic: gira sui loro server, quindi non
    // richiede una chiave in piu' ne' espone nulla dal browser. E' cio' che
    // permette a Spectra di consultare fonti aggiornate oltre PubChem/PubMed.
    if(p.webSearch){
      aBody.tools = (aBody.tools || []).concat([{
        type: 'web_search_20260209', name: 'web_search', max_uses: p.webSearchMaxUses || 5
      }]);
    }
    // Fallback in caso di rifiuto: richiedono sia l'intestazione beta sia il
    // campo nel corpo. Mandarne solo uno dei due produce un 400.
    if(p.fallbacks && p.beta){ h['anthropic-beta'] = p.beta; aBody.fallbacks = p.fallbacks; }
    return { url: aUrl || p.url, headers: h, body: aBody };
  }
  // famiglia 'openai'-compatibile: groq, openrouter, grok
  var oUrl = null;
  try{ oUrl = viaProxy(p.id, new URL(p.url).pathname); }catch(e){}
  var h2 = oUrl
    ? { 'Content-Type': 'application/json' }
    : Object.assign({ 'Content-Type': 'application/json' }, p.authHeader(apiKey));
  var oBody = {
    // come per Gemini: p.model e' stato risolto da streamChat; il ripiego
    // copre le chiamate diverse in cui la risoluzione non e' passata.
    model: p.model || (p.modelliCandidati && p.modelliCandidati[0]),
    stream: true, temperature: 0.6,
    messages: [{ role: 'system', content: systemPrompt }].concat(messages.map(openaiMsg))
  };
  var oTools = toolsForFamily('openai', tools);
  if(oTools) oBody.tools = oTools;
  return { url: oUrl || p.url, headers: h2, body: oBody };
}

// Conversione messaggi: per turni semplici {role,content:string} il passthrough
// è quasi identico; per i turni interni dell'agente (tool_use/tool_result) i
// messaggi arrivano già nella forma nativa del provider (oggetto _native) e
// vengono passati così come sono.
// ── Allegati ────────────────────────────────────────────────────────────────
// Un messaggio puo' portare file (m.files): immagini, PDF o testo. Ogni
// famiglia di provider li vuole in una forma diversa, e non tutte supportano
// tutto: i PDF nativi valgono solo per Anthropic e Gemini, altrove il file
// viene descritto a parole invece di essere silenziosamente ignorato.
function filesToAnthropic(files){
  var out = [];
  (files || []).forEach(function(f){
    if(f.kind === 'image') out.push({ type:'image', source:{ type:'base64', media_type:f.mime, data:f.data } });
    else if(f.kind === 'pdf') out.push({ type:'document', source:{ type:'base64', media_type:'application/pdf', data:f.data } });
    else if(f.kind === 'text') out.push({ type:'text', text:'--- contenuto di ' + f.name + ' ---\n' + f.text });
  });
  return out;
}
function filesToGemini(files){
  var out = [];
  (files || []).forEach(function(f){
    if(f.kind === 'image' || f.kind === 'pdf') out.push({ inline_data:{ mime_type:f.mime, data:f.data } });
    else if(f.kind === 'text') out.push({ text:'--- contenuto di ' + f.name + ' ---\n' + f.text });
  });
  return out;
}
function filesToOpenai(files){
  var out = [];
  (files || []).forEach(function(f){
    if(f.kind === 'image') out.push({ type:'image_url', image_url:{ url:'data:' + f.mime + ';base64,' + f.data } });
    else if(f.kind === 'text') out.push({ type:'text', text:'--- contenuto di ' + f.name + ' ---\n' + f.text });
    else out.push({ type:'text', text:'[allegato "' + f.name + '" non leggibile da questo provider: i PDF sono supportati solo da Claude e Gemini]' });
  });
  return out;
}

function openaiMsg(m){
  if(m._native && m._native.openai) return m._native.openai;
  if(m.files && m.files.length)
    return { role:m.role, content: filesToOpenai(m.files).concat([{ type:'text', text:m.content || '' }]) };
  return { role: m.role, content: m.content };
}
function anthropicMsg(m){
  if(m._native && m._native.anthropic) return m._native.anthropic;
  var role = m.role === 'assistant' ? 'assistant' : 'user';
  if(m.files && m.files.length)
    return { role:role, content: filesToAnthropic(m.files).concat([{ type:'text', text:m.content || '' }]) };
  return { role: role, content: m.content };
}
function geminiMsg(m){
  if(m._native && m._native.gemini) return m._native.gemini;
  var role = m.role === 'assistant' ? 'model' : 'user';
  if(m.files && m.files.length)
    return { role:role, parts: filesToGemini(m.files).concat([{ text:m.content || '' }]) };
  return { role: role, parts: [{ text: m.content }] };
}

function extractToken(family, json){
  try{
    if(family === 'openai'){
      return (json.choices && json.choices[0] && json.choices[0].delta && json.choices[0].delta.content) || '';
    }
    if(family === 'anthropic'){
      if(json.type === 'content_block_delta' && json.delta && json.delta.type === 'text_delta') return json.delta.text || '';
      return '';
    }
    if(family === 'gemini'){
      var c = json.candidates && json.candidates[0];
      var parts = c && c.content && c.content.parts;
      if(parts && parts[0] && parts[0].text) return parts[0].text;
      return '';
    }
  }catch(e){}
  return '';
}

/* Accumula eventuali tool-call presenti in un chunk SSE dentro `state`.
   state = { toolCalls: { [index]: {id,name,argsStr} }, geminiCalls: [...] } */
function accumulateToolCall(family, json, state){
  try{
    if(family === 'openai'){
      var delta = json.choices && json.choices[0] && json.choices[0].delta;
      var tcs = delta && delta.tool_calls;
      if(tcs){
        tcs.forEach(function(tc){
          var idx = tc.index || 0;
          if(!state.toolCalls[idx]) state.toolCalls[idx] = { id: tc.id || ('call_' + idx), name: '', argsStr: '' };
          if(tc.id) state.toolCalls[idx].id = tc.id;
          if(tc.function && tc.function.name) state.toolCalls[idx].name += tc.function.name;
          if(tc.function && tc.function.arguments) state.toolCalls[idx].argsStr += tc.function.arguments;
        });
      }
    } else if(family === 'anthropic'){
      if(json.type === 'content_block_start' && json.content_block && json.content_block.type === 'tool_use'){
        state.toolCalls[json.index] = { id: json.content_block.id, name: json.content_block.name, argsStr: '' };
      } else if(json.type === 'content_block_start' && json.content_block &&
                (json.content_block.type === 'thinking' || json.content_block.type === 'redacted_thinking')){
        // Sui modelli che ragionano (Opus 5 e famiglia 4.6+) i blocchi di
        // pensiero fanno parte del turno assistant e vanno rimandati indietro
        // TALI E QUALI nel giro successivo di tool-use, firma inclusa:
        // scartarli fa rifiutare la richiesta.
        state.thinking = state.thinking || {};
        state.thinking[json.index] = Object.assign({}, json.content_block);
        if(json.content_block.type === 'thinking' && state.thinking[json.index].thinking === undefined){
          state.thinking[json.index].thinking = '';
        }
      } else if(json.type === 'content_block_delta' && json.delta && json.delta.type === 'input_json_delta'){
        var slot = state.toolCalls[json.index];
        if(slot) slot.argsStr += (json.delta.partial_json || '');
      } else if(json.type === 'content_block_delta' && json.delta &&
                (json.delta.type === 'thinking_delta' || json.delta.type === 'signature_delta')){
        var th = state.thinking && state.thinking[json.index];
        if(th){
          if(json.delta.type === 'thinking_delta'){
            th.thinking = (th.thinking || '') + (json.delta.thinking || '');
            // il ragionamento non deve restare nascosto: lo mando alla UI mentre arriva
            if(state.onThinking) state.onThinking(json.delta.thinking || '');
          }
          else th.signature = (th.signature || '') + (json.delta.signature || '');
        }
      }
      // ── Ricerca web (strumento lato server di Anthropic) ──────────────────
      // Gira sui server di Anthropic: non riceve tool_result da noi, ma i suoi
      // blocchi fanno parte del turno assistant e vanno conservati per poter
      // riprendere un turno messo in pausa (stop_reason "pause_turn").
      if(json.type === 'content_block_start' && json.content_block &&
         json.content_block.type === 'server_tool_use'){
        state.server = state.server || {};
        state.server[json.index] = Object.assign({}, json.content_block, { _argsStr: '' });
        if(state.onServerTool) state.onServerTool('search-start', json.content_block);
      }
      if(json.type === 'content_block_delta' && json.delta && json.delta.type === 'input_json_delta'){
        var sv = state.server && state.server[json.index];
        if(sv) sv._argsStr += (json.delta.partial_json || '');
      }
      if(json.type === 'content_block_start' && json.content_block &&
         json.content_block.type === 'web_search_tool_result'){
        // arriva gia' completo: nessun delta da accumulare
        state.server = state.server || {};
        state.server[json.index] = Object.assign({}, json.content_block);
        // La query non e' nota all'apertura del blocco (arriva dopo, nei delta):
        // la recupero ora dal server_tool_use con lo stesso id, cosi' l'utente
        // vede cosa e' stato cercato davvero e non un generico "cerco…".
        var q = '';
        try{
          for(var ik in state.server){
            var sb = state.server[ik];
            if(sb && sb.type === 'server_tool_use' && sb.id === json.content_block.tool_use_id){
              q = JSON.parse(sb._argsStr || '{}').query || ''; break;
            }
          }
        }catch(e){}
        if(state.onServerTool) state.onServerTool('search-result', json.content_block, q);
      }
      if(json.type === 'message_delta' && json.delta && json.delta.stop_reason){
        state.stopReason = json.delta.stop_reason;
      }
    } else if(family === 'gemini'){
      var cand = json.candidates && json.candidates[0];
      var parts = cand && cand.content && cand.content.parts;
      if(parts){
        parts.forEach(function(part){
          if(part.functionCall){
            state.geminiCalls = state.geminiCalls || [];
            state.geminiCalls.push({ id: 'call_' + state.geminiCalls.length, name: part.functionCall.name, args: part.functionCall.args || {} });
          }
        });
      }
    }
  }catch(e){}
}

function finalizeToolCalls(family, state){
  if(family === 'gemini') return state.geminiCalls || [];
  return Object.keys(state.toolCalls).map(function(k){
    var c = state.toolCalls[k];
    var args = {};
    try{ args = c.argsStr ? JSON.parse(c.argsStr) : {}; }catch(e){}
    return { id: c.id, name: c.name, args: args };
  });
}

// Legge un body di errore provando a estrarne un messaggio leggibile
async function readErrorBody(res){
  var txt = '';
  try{ txt = await res.text(); }catch(e){}
  try{
    var j = JSON.parse(txt);
    var msg = (j.error && (j.error.message || j.error)) || j.message || txt;
    return typeof msg === 'string' ? msg : JSON.stringify(msg);
  }catch(e){ return txt.slice(0, 300); }
}

/* streamChat: chiama il provider e invoca callbacks.onToken(str) man
   mano che arrivano pezzi di risposta, poi callbacks.onDone(fullText).
   Se lo stream non è leggibile (browser/rete), fa fallback a lettura
   intera della risposta. */
/* Quanto aspettare dopo un 429. Retry-After puo' essere in secondi o una
   data; alcuni fornitori (Groq, Gemini) mettono l'attesa nel testo
   dell'errore. Se l'attesa e' assurda non si aspetta affatto: meglio dire
   "quota finita" che lasciare l'utente davanti a una clessidra per un'ora. */
var ATTESA_MAX_MS = 60000;
function attesaDaRisposta(res, testo, tentativo){
  var s = null;
  try{ s = res.headers && res.headers.get && res.headers.get('Retry-After'); }catch(e){}
  var ms = null;
  if(s){
    if(/^\d+(\.\d+)?$/.test(s.trim())) ms = parseFloat(s) * 1000;
    else { var d = Date.parse(s); if(!isNaN(d)) ms = d - Date.now(); }
  }
  if(ms === null && testo){
    // "Please try again in 7.5s" (Groq) / "retry after 23 seconds"
    var m = testo.match(/(?:in|after)\s+(\d+(?:\.\d+)?)\s*(ms|s|sec|seconds|secondi|m|min|minutes)/i);
    if(m){
      var v = parseFloat(m[1]), u = m[2].toLowerCase();
      ms = u === 'ms' ? v : (u[0] === 'm' && u !== 'ms' ? v * 60000 : v * 1000);
    }
  }
  // Nessuna indicazione: crescita esponenziale, con un pizzico di casualita'
  // per non far ripartire tutte le schede aperte nello stesso istante.
  if(ms === null) ms = Math.pow(2, tentativo) * 1500 + Math.random() * 500;
  if(ms > ATTESA_MAX_MS) return null;
  return Math.max(500, Math.round(ms));
}
function pausa(ms, abortSignal){
  return new Promise(function(risolvi, rifiuta){
    var t = setTimeout(risolvi, ms);
    if(abortSignal){
      abortSignal.addEventListener('abort', function(){
        clearTimeout(t);
        var e = new Error('Interrotto'); e.name = 'AbortError'; rifiuta(e);
      }, { once: true });
    }
  });
}

async function streamChat(providerId, apiKey, messages, systemPrompt, callbacks, tools, abortSignal, _giaRiprovato, _tentativi){
  var p = PROVIDERS[providerId];
  if(!p) throw new Error('Provider sconosciuto: ' + providerId);
  // Gemini: il nome del modello si decide adesso, non e' scritto nel codice.
  // Il nome del modello si decide adesso: non e' scritto nel codice per
  // nessun fornitore che ne abbia dei candidati (vedi sezione 1a).
  if(p.modelliCandidati) p.model = await risolviModello(p, apiKey, false);
  // Sui provider con un tetto stretto in ingresso si stringono strumenti e
  // cronologia PRIMA di partire, invece di farsi rifiutare la richiesta.
  var ad = adattaAlBudget(p, messages, systemPrompt, tools);
  messages = ad.messages; tools = ad.tools;
  if(ad.tagliato && callbacks && callbacks.onBudget) callbacks.onBudget(ad);
  var req = buildRequest(p, apiKey, messages, systemPrompt, tools);

  // Timeout di INATTIVITÀ (non sul totale della risposta): si azzera ad ogni
  // byte ricevuto, così una risposta lunga ma attiva non viene mai troncata,
  // mentre una connessione che non risponde più (provider giù, CORS bloccato
  // in silenzio, rete instabile) viene segnalata subito con un messaggio
  // chiaro invece di lasciare per sempre i tre puntini "…" a video — prima
  // sembrava che "Spectra non risponde" senza alcun modo per capire perché.
  var IDLE_TIMEOUT_MS = 45000;
  var idleCtrl = (typeof AbortController === 'function') ? new AbortController() : null;
  var idleTimer = null;
  var timedOut = false;
  function bumpIdle(){
    if(!idleCtrl) return;
    if(idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(function(){ timedOut = true; try{ idleCtrl.abort(); }catch(e){} }, IDLE_TIMEOUT_MS);
  }
  function stopIdle(){ if(idleTimer){ clearTimeout(idleTimer); idleTimer = null; } }
  var signal = idleCtrl ? idleCtrl.signal : abortSignal;
  if(idleCtrl && abortSignal){
    if(abortSignal.aborted) idleCtrl.abort();
    else abortSignal.addEventListener('abort', function(){ try{ idleCtrl.abort(); }catch(e){} });
  }
  bumpIdle();

  var fetchOpts = { method: 'POST', headers: req.headers, body: JSON.stringify(req.body) };
  if(signal) fetchOpts.signal = signal;
  var res;
  try{
    res = await fetch(req.url, fetchOpts);
  }catch(networkErr){
    stopIdle();
    if(timedOut) throw new Error('⏱ ' + p.name + ' non ha risposto entro ' + (IDLE_TIMEOUT_MS/1000) + 's. Riprova o scegli un altro provider.');
    if(networkErr && networkErr.name === 'AbortError') throw networkErr;
    throw new Error('Impossibile contattare ' + p.name + '. Controlla la connessione oppure prova un altro provider (alcuni non permettono chiamate dirette dal browser).');
  }
  if(!res.ok){
    stopIdle();
    var errMsg = await readErrorBody(res);
    // Il modello e' stato ritirato mentre era in cache: si ririsolve e si
    // ritenta UNA volta sola (il flag impedisce il ciclo infinito).
    // Groq risponde 404, Gemini 404, OpenRouter a volte 400 dicendo che il
    // modello non e' valido: si guarda anche il testo, non solo il codice.
    var modelloSparito = res.status === 404 ||
      (res.status === 400 && /model|not found|does not exist|not a valid/i.test(errMsg || ''));
    if(p.modelliCandidati && modelloSparito && !_giaRiprovato){
      var vecchio = p.model;
      modelloCacheInvalida(providerId);
      var nuovo = await risolviModello(p, apiKey, true);
      if(nuovo && nuovo !== vecchio){
        return streamChat(providerId, apiKey, messages, systemPrompt, callbacks, tools, abortSignal, true);
      }
    }
    // ── Limite di frequenza ────────────────────────────────────────────────
    // Sui piani gratuiti il 429 e' quasi sempre il limite AL MINUTO, non la
    // quota esaurita: aspettare qualche secondo lo risolve. Il fornitore lo
    // dice con Retry-After; quando non lo dice si usa una crescita esponenziale.
    if(res.status === 429 && (_tentativi || 0) < 3){
      var attesa = attesaDaRisposta(res, errMsg, _tentativi || 0);
      if(attesa !== null){
        if(callbacks && callbacks.onAttesa) callbacks.onAttesa(attesa, p.name);
        await pausa(attesa, abortSignal);
        return streamChat(providerId, apiKey, messages, systemPrompt, callbacks, tools,
                          abortSignal, _giaRiprovato, (_tentativi || 0) + 1);
      }
    }
    var e = new Error('HTTP ' + res.status + ' — ' + errMsg);
    e.stato = res.status;
    // Marca gli esaurimenti veri, cosi' chi chiama puo' passare a un altro
    // fornitore invece di arrendersi (vedi conProviderDiRiserva).
    e.esaurito = res.status === 429 || res.status === 402 ||
                 (res.status === 403 && /quota|limit|exceed/i.test(errMsg || ''));
    throw e;
  }
  var full = '';
  var tcState = { toolCalls: {}, geminiCalls: [], onThinking: callbacks && callbacks.onThinking,
                  onServerTool: callbacks && callbacks.onServerTool };
  if(res.body && typeof res.body.getReader === 'function'){
    var reader = res.body.getReader();
    var decoder = new TextDecoder();
    var buf = '';
    while(true){
      var chunk;
      try{
        chunk = await reader.read();
      }catch(readErr){
        stopIdle();
        if(timedOut) throw new Error('⏱ ' + p.name + ' si è interrotto (nessun dato per ' + (IDLE_TIMEOUT_MS/1000) + 's). Riprova.');
        throw readErr;
      }
      bumpIdle();
      if(chunk.done) break;
      buf += decoder.decode(chunk.value, { stream: true });
      var lines = buf.split('\n');
      buf = lines.pop();
      for(var i = 0; i < lines.length; i++){
        var line = lines[i].trim();
        if(line.indexOf('data:') !== 0) continue;
        var data = line.slice(5).trim();
        if(data === '[DONE]') continue;
        var json;
        try{ json = JSON.parse(data); }catch(e){ continue; }
        var tok = extractToken(p.family, json);
        if(tok){ full += tok; callbacks.onToken(tok, full); }
        accumulateToolCall(p.family, json, tcState);
      }
    }
  } else {
    // fallback: niente streaming, leggo tutto e provo a estrarre il testo
    var text = await res.text();
    try{
      var j2 = JSON.parse(text);
      if(p.family === 'openai') full = (j2.choices && j2.choices[0].message && j2.choices[0].message.content) || '';
      else if(p.family === 'anthropic') full = (j2.content && j2.content[0] && j2.content[0].text) || '';
      else if(p.family === 'gemini') full = (j2.candidates && j2.candidates[0].content.parts[0].text) || '';
    }catch(e){ full = text; }
    if(full) callbacks.onToken(full, full);
  }
  stopIdle();
  var toolCalls = finalizeToolCalls(p.family, tcState);
  callbacks.onDone(full, toolCalls);
  // i blocchi di pensiero servono a ricostruire il turno assistant nel giro dopo
  var thinkingBlocks = tcState.thinking
    ? Object.keys(tcState.thinking).sort(function(a,b){ return a - b; })
        .map(function(k){ return tcState.thinking[k]; })
    : [];
  // Blocchi degli strumenti lato server (ricerca web), nell'ordine in cui sono
  // arrivati: servono tali e quali per riprendere un turno in pausa.
  var serverBlocks = tcState.server
    ? Object.keys(tcState.server).sort(function(a,b){ return a - b; })
        .map(function(k){
          var b = Object.assign({}, tcState.server[k]);
          if(b._argsStr !== undefined){
            try{ b.input = b._argsStr ? JSON.parse(b._argsStr) : {}; }catch(e){ b.input = {}; }
            delete b._argsStr;
          }
          return b;
        })
    : [];
  return { text: full, toolCalls: toolCalls, thinking: thinkingBlocks,
           server: serverBlocks, stopReason: tcState.stopReason };
}
window.bsiStreamChat = function(providerId, apiKey, messages, systemPrompt, callbacks){
  // wrapper retro-compatibile: ignora eventuali tool-call e restituisce solo il testo,
  // come si aspettano le tab Chat/Esame/Guida già esistenti.
  return streamChat(providerId, apiKey, messages, systemPrompt, callbacks).then(function(r){ return r.text; });
};

/* ---------------------------------------------------------------------
   1b. TOOL-CALLING — il "Copilota": l'AI puo' davvero azionare l'app
       (navigare sezioni, aprire strumenti, cercare molecole) invece di
       limitarsi a descriverla. Registro comune -> convertito per
       ciascuna famiglia da toolsForFamily() sopra; esecuzione locale,
       niente dati mandati a nessun server BioSpecInfo.
--------------------------------------------------------------------- */
var NAV_SECTIONS = {
  'sdashboard': '🏠 Dashboard',
  'smol': '🔍 Molecola',
  'spt': '⬡ Tavola Periodica',
  'ssyn': '🧪 Sintesi Org.',
  'sretro': '🔄 Retrosintesi',
  'sanimmech': '🎬 Meccanismi',
  'smolprop': '🧮 Proprietà Mol.',
  'sform': '📐 Formule',
  'sconst': '⚛️ Costanti',
  'sinorg': '⚗️ Inorganica',
  'scft': '🔶 Campo Cristallino',
  'sdistrib': '📊 Distribuzioni & Statistica',
  'sqm': '🌌 Meccanica Quantistica',
  'srxnbal': '⚖️ Bilancia Rz.',
  'sdbe': '📐 Insaturazioni (DBE)',
  'sspec': '📊 Spettri Ref.',
  'sirvis': '📈 IR Visivi',
  'sms': '⚗️ Spettro MS',
  'snoe': '🔗 NMR 2D/NOE',
  'suvvis': '🌈 UV-Vis',
  'snmrpred': '📡 NMR Pred.',
  'squizspec': '🎯 Quiz Spettri',
  'selucid': '🧩 Elucidazione Strutturale',
  'saa': '🧬 Amminoacidi',
  'sbio': '🧫 Biomolecole',
  'sbiosyn': '🔬 Biosintesi',
  'sstruct': '🧬 Strutture 3D',
  's3dpro': '🧬 Viewer 3D PRO',
  'sglyc': '⚡ Metabolismo',
  'squizmet': '🧬 Quiz Vie Metab.',
  'smacro3d': '🧬 Macromolecole 3D',
  'sguidabio': '📚 Guida Biochimica',
  'sglic': '🔄 Glicolisi Animata',
  'skrebs': '♻️ Ciclo di Krebs',
  'setc': '⚡ Catena Respiratoria',
  'sbeta': '🔥 β-ossidazione',
  'sppp': '🔀 Pentosi Fosfati',
  'surea': '💧 Ciclo dell\'Urea',
  'sgluco': '🔄 Gluconeogenesi',
  'sfarm': '💊 Farmaci',
  'sdint': '⚠️ Interazioni',
  'spkcalc': '📐 Farmacocin.',
  'spkcurve': '📉 Curve PK',
  'sclinical': '🏥 Casi Clinici',
  'smorb': '🏥 Patologie',
  'smo': '🔵 Orbitali MO',
  'spka': '🧪 pKa/Tamponi',
  'smm': '⚗️ Cinetica Enz.',
  'snernst': '⚡ Elettrochimica',
  'svsepr': '🔷 VSEPR',
  'stitr': '🧪 Titolazione',
  'skin': '⏱️ Cinetica',
  'sphase': '📊 Fasi',
  'senergia': '⚡ Diagrammi E.',
  'ssteich': '⚗️ Stechiometria',
  'scalcav': '🧮 Calc. Avanz.',
  'scalc': '🔢 Calcolatore',
  'sdistr': '📊 Diagrammi Distribuz.',
  'sbuffer': '📉 Henderson & Tamponi',
  'sthermoadv': '🌡️ Termodinamica Avanz.',
  'scfgraf': '📈 Grafici Interattivi',
  'serrori': '🗺️ Riassunti',
  'squiz': '❓ Quiz',
  'sexam': '🎓 Esame UniBA',
  'sstudypath': '📚 Percorsi',
  'stheory': '📖 Teoria',
  'scustomflash': '🃏 Flashcard',
  'sguida': '📖 Guida all\'uso',
  'sbiochimx': '🎓 Biochimica d\'esame',
  'sinorgx': '⚗️ Inorganica d\'esame',
  'sai': '🤖 AI Chat',
  'slab': '🔬 Laboratorio',
  'sghs': '⚠️ GHS',
  'smap': '🗺️ Mappa Concett.',
  'scompare': '⚖️ Confronto Mol.',
  'spubchem': '🔬 Cerca Molecole',
  'sdiagrammi': '📖 Atlante Studio',
  'srisorse': '🌐 Risorse Web',
  'smateriali': '📁 Materiali',
  'snotes': '📝 Note',
  'sfilemanager': '📁 File Manager',
  'sstats': '📊 Statistiche',
  'spomo': '🍅 Pomodoro',
  'slabcalc': '🧪 Calc. Laboratorio'
};

// Strumenti principali richiamabili dal FAB (già verificati come window.openXXX)
var FAB_TOOLS = {
  sr:            { label: '📖 Studio Ragionato', exec: function(){ if(typeof window.openSR === 'function') window.openSR(); } },
  guidaret:      { label: '📖 Atlante Studio',    exec: function(){ if(typeof window.openGuidaRet === 'function') window.openGuidaRet(); } },
  accademia:     { label: '🎓 Accademia',         exec: function(){ if(typeof window.openAccademia === 'function') window.openAccademia(); } },
  chimorga:      { label: '🧪 ChimOrga',          exec: function(){ if(typeof window.openChimOrga === 'function') window.openChimOrga(); } },
  rdkitlab:      { label: '🔬 RDKit Lab',         exec: function(){ if(typeof window.openRDKitLab === 'function') window.openRDKitLab(); } },
  chemdraw:      { label: '✏️ ChemDraw',          exec: function(){ if(typeof window.openChemDraw === 'function') window.openChemDraw(); } },
  astro:         { label: '🌌 Astrochimica',      exec: function(){ if(typeof window.openAstro === 'function') window.openAstro(); } },
  pro:           { label: '⭐ Modalità Pro',       exec: function(){ if(typeof window.openPro === 'function') window.openPro(); } },
  filemanager:   { label: '📁 File Manager',      exec: function(){ if(typeof window.openFileManager === 'function') window.openFileManager(); } },
  qlab:          { label: '🌌 Quantum Lab',       exec: function(){ if(typeof window.openQuantumLab === 'function') window.openQuantumLab(); } },
  simulazioni:   { label: '⚗️ Simulazioni',        exec: function(){ if(typeof window.openSimulazioni === 'function') window.openSimulazioni(); } },
  mechanim:      { label: '🎬 Meccanismi Animati', exec: function(){ if(typeof window.openMechAnim === 'function') window.openMechAnim(); } }
};

// Registro strumenti in formato JSON-Schema comune (poi convertito per famiglia)
var TOOLS = [
  {
    name: 'naviga_sezione',
    description: "Apre/scorre a una sezione specifica dell'app BioSpecInfo per l'utente (es. Tavola Periodica, Glicolisi Animata, Quiz). Usalo quando l'utente chiede di vedere/aprire/andare a un argomento presente nell'app invece di limitarti a spiegarlo a parole.",
    parameters: {
      type: 'object',
      properties: {
        sezione: { type: 'string', enum: Object.keys(NAV_SECTIONS), description: "L'id della sezione da aprire." }
      },
      required: ['sezione']
    },
    execute: function(args){
      var id = args && args.sezione;
      if(!id || !NAV_SECTIONS[id]) return { ok: false, error: 'sezione sconosciuta' };
      try{ closeHub(); }catch(e){}
      if(typeof window.goSection === 'function') window.goSection(id);
      return { ok: true, label: NAV_SECTIONS[id] };
    }
  },
  {
    name: 'apri_strumento',
    description: "Apre uno degli strumenti/laboratori avanzati di BioSpecInfo (es. RDKit Lab, ChemDraw, Astrochimica, Simulazioni).",
    parameters: {
      type: 'object',
      properties: {
        strumento: { type: 'string', enum: Object.keys(FAB_TOOLS), description: 'La chiave dello strumento da aprire.' }
      },
      required: ['strumento']
    },
    execute: function(args){
      var key = args && args.strumento;
      var tool = FAB_TOOLS[key];
      if(!tool) return { ok: false, error: 'strumento sconosciuto' };
      try{ closeHub(); }catch(e){}
      tool.exec();
      return { ok: true, label: tool.label };
    }
  },
  {
    name: 'cerca_molecola',
    description: "Cerca una molecola per nome nel database di BioSpecInfo e apre la relativa scheda (proprietà, spettri, struttura).",
    parameters: {
      type: 'object',
      properties: {
        nome: { type: 'string', description: 'Nome della molecola da cercare, es. "etanolo", "acido acetilsalicilico".' }
      },
      required: ['nome']
    },
    execute: function(args){
      var nome = args && args.nome;
      if(!nome) return { ok: false, error: 'nome mancante' };
      try{ closeHub(); }catch(e){}
      if(typeof window.goSection === 'function') window.goSection('smol');
      // La sezione può metterci un attimo a comparire nel DOM: aspettiamo
      // davvero che #qi/#goBtn esistano (fino a ~1.5s) invece di sperare
      // che 150ms bastino, e riportiamo un fallimento vero se non compaiono.
      return new Promise(function(resolve){
        var tries = 0;
        (function poll(){
          var inp = document.getElementById('qi');
          var btn = document.getElementById('goBtn');
          if(inp && btn){
            inp.value = nome; inp.dispatchEvent(new Event('input', { bubbles: true }));
            btn.click();
            resolve({ ok: true, label: nome });
            return;
          }
          tries++;
          if(tries > 15){ resolve({ ok: false, error: 'sezione molecola non trovata', label: nome }); return; }
          setTimeout(poll, 100);
        })();
      });
    }
  }
];

// ═══════════════════════════════════════════════════════════════════════════
// STRUMENTI CONOSCITIVI
// I tre strumenti qui sopra sanno solo APRIRE cose: restituiscono {ok:true} e
// basta, quindi il modello non impara mai nulla da cio' che apre. Quelli qui
// sotto RESTITUISCONO DATI, e sono la differenza fra un navigatore e un
// assistente che ragiona: puo' cercare valori reali, calcolarli e poi
// commentarli, invece di inventarli.
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// DISEGNO DELLE MAPPE CONCETTUALI
// Renderer di grafi scritto qui dentro invece di caricare Mermaid da un CDN:
// l'app e' offline-first e una mappa deve potersi disegnare anche senza rete.
// Copre il sottoinsieme che serve davvero — graph/flowchart TD|LR, nodi con
// forme, archi orientati con etichetta — non l'intera sintassi Mermaid.
// ═══════════════════════════════════════════════════════════════════════════

function _formaNodo(sfx){
  if(!sfx) return { forma:'rect', testo:null };
  if(/^\(\(.*\)\)$/.test(sfx)) return { forma:'cerchio', testo:sfx.slice(2, -2) };
  if(/^\[.*\]$/.test(sfx))     return { forma:'rect',    testo:sfx.slice(1, -1) };
  if(/^\(.*\)$/.test(sfx))     return { forma:'tondo',   testo:sfx.slice(1, -1) };
  if(/^\{.*\}$/.test(sfx))     return { forma:'rombo',   testo:sfx.slice(1, -1) };
  return { forma:'rect', testo:null };
}

function parseGrafo(src){
  var dir = 'TD', nodi = {}, ordine = [], archi = [];
  function reg(txt){
    txt = String(txt).trim();
    var m = txt.match(/^([A-Za-z0-9_.-]+)\s*(\(\(.*\)\)|\[.*\]|\(.*\)|\{.*\})?\s*$/);
    if(!m) return null;
    var id = m[1], f = _formaNodo(m[2]);
    if(!nodi[id]){ nodi[id] = { id:id, et:f.testo || id, forma:f.forma }; ordine.push(id); }
    else if(f.testo){ nodi[id].et = f.testo; nodi[id].forma = f.forma; }
    return id;
  }
  // Accetto solo graph/flowchart: le altre sintassi Mermaid (sequenceDiagram,
  // classDiagram, gantt...) non sono coperte e vanno lasciate come codice.
  if(!/^\s*(?:graph|flowchart)\s+(?:TD|TB|LR|RL|BT)\b/i.test(String(src))) return null;

  String(src).split('\n').forEach(function(r){
    r = r.trim();
    if(!r || r.indexOf('%%') === 0) return;
    var d = r.match(/^(?:graph|flowchart)\s+(TD|TB|LR|RL|BT)\b/i);
    if(d){ dir = d[1].toUpperCase(); return; }
    if(/^(?:graph|flowchart)\b/i.test(r)) return;
    r = r.replace(/;\s*$/, '');

    // Catene su una riga: "A --> B --> C" va spezzata in piu' archi, altrimenti
    // solo il primo e l'ultimo nodo verrebbero registrati.
    var OP = /(-\.->|-\.-|==>|-->|---)\s*(?:\|([^|]*)\|)?\s*/g;
    var pezzi = [], ops = [], ultimo = 0, m2;
    while((m2 = OP.exec(r)) !== null){
      pezzi.push(r.slice(ultimo, m2.index));
      ops.push({ op:m2[1], et:(m2[2] || '').trim() });
      ultimo = OP.lastIndex;
    }
    pezzi.push(r.slice(ultimo));

    if(!ops.length){ reg(r); return; }
    var ids = pezzi.map(function(p){ return reg(p); });
    for(var i = 0; i < ops.length; i++){
      if(ids[i] && ids[i + 1])
        archi.push({ da:ids[i], a:ids[i + 1], et:ops[i].et,
                     tratteggio:/-\./.test(ops[i].op), freccia:/>/.test(ops[i].op) });
    }
  });
  return { dir:dir, nodi:nodi, ordine:ordine, archi:archi };
}

// Testo a capo su piu' righe: la larghezza e' stimata dai caratteri, senza
// misurare nel DOM, perche' l'SVG viene costruito come stringa.
function _aCapo(t, maxCar){
  // Le parole troppo lunghe per stare su una riga (una stringa SMILES, un URL)
  // vengono spezzate a forza: senza, il nodo si allargherebbe a dismisura
  // trascinandosi dietro l'intero diagramma.
  var par = [];
  String(t).split(/\s+/).forEach(function(p){
    while(p.length > maxCar){ par.push(p.slice(0, maxCar - 1) + '-'); p = p.slice(maxCar - 1); }
    if(p) par.push(p);
  });
  var righe = [], cur = '';
  par.forEach(function(p){
    if(!cur) cur = p;
    else if((cur + ' ' + p).length <= maxCar) cur += ' ' + p;
    else { righe.push(cur); cur = p; }
  });
  if(cur) righe.push(cur);
  // un nodo con decine di righe sbilancia il disegno: taglio con i puntini
  if(righe.length > 6) righe = righe.slice(0, 6).concat(['…']);
  return righe.length ? righe : [''];
}

// Assegna i livelli con il cammino piu' lungo dalle radici. I cicli vengono
// spezzati tenendo traccia del percorso corrente: senza, un ciclo manderebbe
// la ricorsione in stallo.
function _livelli(g){
  var entranti = {};
  g.ordine.forEach(function(id){ entranti[id] = 0; });
  g.archi.forEach(function(a){ if(entranti[a.a] !== undefined) entranti[a.a]++; });
  var liv = {}, inCorso = {};
  function calc(id){
    if(liv[id] !== undefined) return liv[id];
    if(inCorso[id]) return 0;             // ciclo: interrompo qui
    inCorso[id] = true;
    var max = 0;
    g.archi.forEach(function(a){ if(a.a === id) max = Math.max(max, calc(a.da) + 1); });
    inCorso[id] = false;
    liv[id] = max;
    return max;
  }
  g.ordine.forEach(calc);
  return liv;
}

function grafoToSvg(src){
  var g = parseGrafo(src);
  if(!g || !g.ordine.length) return null;
  var orizzontale = (g.dir === 'LR' || g.dir === 'RL');
  var liv = _livelli(g);

  // raggruppo per livello, mantenendo l'ordine di apparizione
  var perLiv = {};
  g.ordine.forEach(function(id){ (perLiv[liv[id]] = perLiv[liv[id]] || []).push(id); });
  var livelli = Object.keys(perLiv).map(Number).sort(function(a, b){ return a - b; });

  // Riordino dentro ogni livello con il baricentro dei predecessori: riduce
  // sensibilmente gli incroci rispetto all'ordine di dichiarazione.
  for(var pass = 0; pass < 3; pass++){
    livelli.forEach(function(L){
      if(L === livelli[0]) return;
      var prec = perLiv[L - 1] || [];
      perLiv[L].sort(function(x, y){
        function bar(n){
          var pos = [], i;
          g.archi.forEach(function(a){
            if(a.a === n){ i = prec.indexOf(a.da); if(i >= 0) pos.push(i); }
          });
          return pos.length ? pos.reduce(function(p, q){ return p + q; }, 0) / pos.length : 1e9;
        }
        return bar(x) - bar(y);
      });
    });
  }

  // geometria dei nodi
  var CAR = 6.4, ALT_RIGA = 15, PADX = 14, PADY = 10, MAXCAR = 20;
  var GAP_LIV = 78, GAP_NODO = 22;
  var box = {};
  g.ordine.forEach(function(id){
    var righe = _aCapo(g.nodi[id].et, MAXCAR);
    var w = Math.max(64, Math.round(Math.max.apply(null, righe.map(function(r){ return r.length; })) * CAR) + PADX * 2);
    var h = righe.length * ALT_RIGA + PADY * 2;
    if(g.nodi[id].forma === 'rombo'){ w += 22; h += 10; }
    if(g.nodi[id].forma === 'cerchio'){ w = h = Math.max(w, h); }
    box[id] = { w:w, h:h, righe:righe };
  });

  // posizione: i livelli scorrono lungo un asse, i nodi lungo l'altro
  var cursore = 40, estensione = 0;
  livelli.forEach(function(L){
    var ids = perLiv[L];
    var tot = ids.reduce(function(s, id){ return s + (orizzontale ? box[id].h : box[id].w) + GAP_NODO; }, -GAP_NODO);
    var p = Math.max(30, (0 - tot) / 2) + 30;
    var maxTrasv = 0;
    ids.forEach(function(id){
      var b = box[id];
      if(orizzontale){ b.x = cursore; b.y = p; p += b.h + GAP_NODO; maxTrasv = Math.max(maxTrasv, b.w); }
      else { b.x = p; b.y = cursore; p += b.w + GAP_NODO; maxTrasv = Math.max(maxTrasv, b.h); }
    });
    estensione = Math.max(estensione, p);
    cursore += maxTrasv + GAP_LIV;
  });
  var W = Math.ceil(orizzontale ? cursore : estensione) + 30;
  var H = Math.ceil(orizzontale ? estensione : cursore) + 20;

  // centro ogni livello rispetto all'estensione totale
  livelli.forEach(function(L){
    var ids = perLiv[L];
    var tot = ids.reduce(function(s, id){ return s + (orizzontale ? box[id].h : box[id].w) + GAP_NODO; }, -GAP_NODO);
    var off = ((orizzontale ? H : W) - tot) / 2;
    var p = off;
    ids.forEach(function(id){
      var b = box[id];
      if(orizzontale){ b.y = p; p += b.h + GAP_NODO; }
      else { b.x = p; p += b.w + GAP_NODO; }
    });
  });

  var esc = function(s){ return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
  var out = [];
  out.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img">');
  out.push('<defs><marker id="bsiArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">' +
           '<path d="M0 0 L10 5 L0 10 z" fill="#0f766e"/></marker></defs>');

  // archi sotto ai nodi
  var etichette = [];
  g.archi.forEach(function(a){
    var A = box[a.da], B = box[a.a];
    if(!A || !B) return;
    var x1, y1, x2, y2;
    if(orizzontale){ x1 = A.x + A.w; y1 = A.y + A.h / 2; x2 = B.x; y2 = B.y + B.h / 2; }
    else { x1 = A.x + A.w / 2; y1 = A.y + A.h; x2 = B.x + B.w / 2; y2 = B.y; }
    var d = orizzontale
      ? 'M' + x1 + ' ' + y1 + ' C' + (x1 + 34) + ' ' + y1 + ' ' + (x2 - 34) + ' ' + y2 + ' ' + x2 + ' ' + y2
      : 'M' + x1 + ' ' + y1 + ' C' + x1 + ' ' + (y1 + 34) + ' ' + x2 + ' ' + (y2 - 34) + ' ' + x2 + ' ' + y2;
    out.push('<path d="' + d + '" fill="none" stroke="#0f766e" stroke-width="1.6"' +
             (a.tratteggio ? ' stroke-dasharray="5 4"' : '') +
             (a.freccia ? ' marker-end="url(#bsiArrow)"' : '') + '/>');
    if(a.et){
      // L'etichetta va al 62% dell'arco, non a meta': su un bivio i rami sono
      // ancora quasi sovrapposti a meta' strada e le scritte si accavallerebbero.
      var t = 0.62;
      etichette.push({ x:x1 + (x2 - x1) * t, y:y1 + (y2 - y1) * t,
                       w:a.et.length * 5.6 + 10, testo:a.et });
    }
  });

  // Se due etichette si sovrappongono comunque, le allontano lungo l'asse
  // trasversale finche' non si liberano.
  etichette.sort(function(p, q){ return orizzontale ? p.y - q.y : p.x - q.x; });
  for(var it = 0; it < 4; it++){
    for(var i1 = 0; i1 < etichette.length; i1++){
      for(var j1 = i1 + 1; j1 < etichette.length; j1++){
        var A1 = etichette[i1], B1 = etichette[j1];
        var dx = Math.abs(A1.x - B1.x), dy = Math.abs(A1.y - B1.y);
        var minx = (A1.w + B1.w) / 2 + 6;
        if(dx < minx && dy < 18){
          var spinta = (minx - dx) / 2 + 1;
          if(A1.x <= B1.x){ A1.x -= spinta; B1.x += spinta; }
          else { A1.x += spinta; B1.x -= spinta; }
        }
      }
    }
  }
  etichette.forEach(function(L){
    out.push('<rect x="' + (L.x - L.w / 2) + '" y="' + (L.y - 8) + '" width="' + L.w + '" height="16" rx="4" fill="#ffffff" stroke="#cfe3e0"/>');
    out.push('<text x="' + L.x + '" y="' + (L.y + 4) + '" text-anchor="middle" font-size="9.5" fill="#125c55" font-family="system-ui,sans-serif">' + esc(L.testo) + '</text>');
  });

  // nodi
  g.ordine.forEach(function(id){
    var b = box[id], n = g.nodi[id];
    var cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    if(n.forma === 'rombo'){
      out.push('<polygon points="' + cx + ',' + b.y + ' ' + (b.x + b.w) + ',' + cy + ' ' + cx + ',' + (b.y + b.h) + ' ' + b.x + ',' + cy +
               '" fill="#e6fffb" stroke="#0f766e" stroke-width="1.6"/>');
    } else if(n.forma === 'cerchio'){
      out.push('<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + (b.w / 2) + '" ry="' + (b.h / 2) + '" fill="#e6fffb" stroke="#0f766e" stroke-width="1.6"/>');
    } else {
      var rx = n.forma === 'tondo' ? b.h / 2 : 8;
      out.push('<rect x="' + b.x + '" y="' + b.y + '" width="' + b.w + '" height="' + b.h + '" rx="' + rx + '" fill="#e6fffb" stroke="#0f766e" stroke-width="1.6"/>');
    }
    var y0 = cy - (b.righe.length - 1) * ALT_RIGA / 2 + 4;
    b.righe.forEach(function(r, i){
      out.push('<text x="' + cx + '" y="' + (y0 + i * ALT_RIGA) + '" text-anchor="middle" font-size="11.5" fill="#0b3a45" ' +
               'font-family="system-ui,sans-serif" font-weight="600">' + esc(r) + '</text>');
    });
  });
  out.push('</svg>');
  return out.join('');
}
window.bsiGrafoToSvg = grafoToSvg;

// ── Lettura degli allegati ─────────────────────────────────────────────────
// Le immagini vengono ridimensionate prima dell'invio: una foto da telefono
// e' spesso 4000px e in base64 supererebbe i limiti di richiesta, oltre a
// costare molto in token. 1600px sul lato lungo bastano ampiamente per leggere
// appunti, uno spettro o una lavagna.
// 2000px sul lato lungo: 1600 bastavano per una lavagna, ma su una pagina di
// appunti a mano fitti la scrittura piccola diventava illeggibile.
var MAX_LATO_IMG = 2000;
// Il limite della richiesta e' 32 MB, ma il base64 gonfia di 4/3: un file
// grezzo da 30 MB ne produrrebbe 40 e verrebbe rifiutato dall'API. Il grezzo
// deve quindi stare sotto 24 MB; 22 lascia margine per il resto del messaggio.
var MAX_FILE_MB = 22;

// Il tetto di pagine dipende dalla finestra di contesto del modello: 600 per
// quelli da 1M (Opus 5, Sonnet 5, Fable 5.1), 100 per Haiku 4.5 che ne ha 200K.
// Applicare 100 a tutti, com'era prima, rifiutava documenti che i modelli
// grandi avrebbero gestito benissimo.
var PAGINE_PDF = { claude_fable:600, claude:600, claude_sonnet:600, claude_haiku:100, gemini:300 };
var PAGINE_PDF_DEFAULT = 100;

function limitePagine(provId){
  var p = PAGINE_PDF[provId || (typeof getSavedProvider === 'function' ? getSavedProvider() : '')];
  return p || PAGINE_PDF_DEFAULT;
}
// Cerca il provider che regge piu' pagine fra quelli capaci di N.
function _migliorePer(n){
  var best = null;
  Object.keys(PAGINE_PDF).forEach(function(k){
    if(PAGINE_PDF[k] >= n && (!best || PAGINE_PDF[k] > PAGINE_PDF[best])) best = k;
  });
  return best;
}
function provinciaAdatta(n){
  var k = _migliorePer(n);
  return k && PROVIDERS[k] ? PROVIDERS[k].name : null;
}
function provinciaMax(n){
  var k = _migliorePer(n);
  return k ? PAGINE_PDF[k] : PAGINE_PDF_DEFAULT;
}

// Conta le pagine leggendo gli oggetti /Type /Page nel PDF, senza librerie.
// E' una stima: alcuni PDF compressi (object streams) espongono meno oggetti
// in chiaro, quindi il valore puo' risultare piu' basso del reale.
function contaPaginePdf(buf){
  try{
    var txt = new TextDecoder('latin1').decode(new Uint8Array(buf));
    var m = txt.match(/\/Count\s+(\d+)/g);
    var perCount = 0;
    if(m) m.forEach(function(c){ perCount = Math.max(perCount, parseInt(c.replace(/\D/g, ''), 10) || 0); });
    var perTipo = (txt.match(/\/Type\s*\/Page[^s]/g) || []).length;
    return Math.max(perCount, perTipo) || null;
  }catch(e){ return null; }
}

function leggiAllegato(file){
  return new Promise(function(resolve, reject){
    if(file.size > MAX_FILE_MB * 1024 * 1024){
      reject(new Error('"' + file.name + '" supera ' + MAX_FILE_MB + ' MB'));
      return;
    }
    var mime = file.type || '';
    // testo: lo mando come testo, non come immagine
    if(/^text\/|application\/(json|xml|csv)/.test(mime) || /\.(txt|md|csv|json|xml|smi|mol|sdf)$/i.test(file.name)){
      var rt = new FileReader();
      rt.onload = function(){ resolve({ kind:'text', name:file.name, mime:mime || 'text/plain',
                                        text:String(rt.result).slice(0, 200000), size:file.size }); };
      rt.onerror = function(){ reject(new Error('non riesco a leggere "' + file.name + '"')); };
      rt.readAsText(file);
      return;
    }
    if(mime === 'application/pdf' || /\.pdf$/i.test(file.name)){
      var rb = new FileReader();
      rb.onload = function(){
        var pagine = contaPaginePdf(rb.result);
        var tetto = limitePagine();
        if(pagine && pagine > tetto){
          // se un altro modello reggerebbe il documento, dillo invece di
          // limitarsi a rifiutarlo: spesso basta cambiare provider
          var alt = provinciaAdatta(pagine);
          reject(new Error('"' + file.name + '" ha circa ' + pagine + ' pagine, oltre il limite di ' + tetto +
            ' del modello selezionato.' +
            (alt ? ' Passa a ' + alt + ', che arriva a ' + provinciaMax(pagine) + ' pagine.'
                 : ' Allega il capitolo che ti serve, oppure dividi il file.')));
          return;
        }
        var rp = new FileReader();
        rp.onload = function(){
          resolve({ kind:'pdf', name:file.name, mime:'application/pdf',
                    data:String(rp.result).split(',')[1], size:file.size, pagine:pagine });
        };
        rp.onerror = function(){ reject(new Error('non riesco a leggere "' + file.name + '"')); };
        rp.readAsDataURL(file);
      };
      rb.onerror = function(){ reject(new Error('non riesco a leggere "' + file.name + '"')); };
      rb.readAsArrayBuffer(file);
      return;
    }
    if(/^image\//.test(mime)){
      var ri = new FileReader();
      ri.onload = function(){
        var img = new Image();
        img.onload = function(){
          try{
            var w = img.width, h = img.height, scala = Math.min(1, MAX_LATO_IMG / Math.max(w, h));
            var cv = document.createElement('canvas');
            cv.width = Math.round(w * scala); cv.height = Math.round(h * scala);
            cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
            // JPEG per le foto: molto piu' leggero del PNG a parita' di leggibilita'
            var url = cv.toDataURL('image/jpeg', 0.85);
            // Miniatura separata e minuscola per la cronologia. Salvare
            // l'immagine grande (circa 440 KB l'una) riempirebbe localStorage in
            // una decina di foto, e a quota piena OGNI scrittura successiva
            // fallisce in silenzio, compreso il salvataggio della chiave API.
            var mini = url;
            try{
              var sm = Math.min(1, 160 / Math.max(cv.width, cv.height));
              var tc = document.createElement('canvas');
              tc.width = Math.max(1, Math.round(cv.width * sm));
              tc.height = Math.max(1, Math.round(cv.height * sm));
              tc.getContext('2d').drawImage(cv, 0, 0, tc.width, tc.height);
              mini = tc.toDataURL('image/jpeg', 0.7);
            }catch(e){}
            resolve({ kind:'image', name:file.name, mime:'image/jpeg',
                      data:url.split(',')[1], anteprima:url, miniatura:mini,
                      size:file.size, dimensioni:cv.width + '×' + cv.height });
          }catch(e){
            // se il canvas fallisce (immagine enorme, memoria) uso l'originale
            resolve({ kind:'image', name:file.name, mime:mime,
                      data:String(ri.result).split(',')[1], anteprima:String(ri.result), size:file.size });
          }
        };
        img.onerror = function(){ reject(new Error('"' + file.name + '" non e\' un\'immagine leggibile')); };
        img.src = String(ri.result);
      };
      ri.onerror = function(){ reject(new Error('non riesco a leggere "' + file.name + '"')); };
      ri.readAsDataURL(file);
      return;
    }
    reject(new Error('tipo non supportato: "' + file.name + '" (usa immagini, PDF o file di testo)'));
  });
}
window.bsiLeggiAllegato = leggiAllegato;

// ── Memoria persistente ────────────────────────────────────────────────────
// Un assistente che riparte da zero ad ogni sessione non e' un agente: questi
// fatti vengono riletti e iniettati nel prompt di sistema ad ogni turno, cosi'
// Spectra sa con chi sta parlando e a che punto e' il suo studio.
var MAX_MEMORIE = 40;
function loadMemory(){
  var m = loadJSON('bsi_ai_memory', null);
  return Array.isArray(m) ? m : [];
}
function saveMemory(m){ saveJSON('bsi_ai_memory', m); }
function memoryPrompt(){
  var m = loadMemory();
  if(!m.length) return '';
  return '\n\nCOSA SAI GIA\' DI QUESTO UTENTE (da sessioni precedenti, usalo senza rinfacciarlo):\n' +
    m.map(function(x){ return '- [' + x.categoria + '] ' + x.fatto; }).join('\n');
}
window.bsiMemory = { load: loadMemory, save: saveMemory };

// Masse atomiche standard IUPAC (u). Servono per calcolare la massa molecolare
// da formula in modo esatto, invece di stimarla.
var ATOMIC_MASS = {
  H:1.008, He:4.0026, Li:6.94, Be:9.0122, B:10.81, C:12.011, N:14.007, O:15.999,
  F:18.998, Ne:20.180, Na:22.990, Mg:24.305, Al:26.982, Si:28.085, P:30.974,
  S:32.06, Cl:35.45, Ar:39.948, K:39.098, Ca:40.078, Sc:44.956, Ti:47.867,
  V:50.942, Cr:51.996, Mn:54.938, Fe:55.845, Co:58.933, Ni:58.693, Cu:63.546,
  Zn:65.38, Ga:69.723, Ge:72.630, As:74.922, Se:78.971, Br:79.904, Kr:83.798,
  Rb:85.468, Sr:87.62, Y:88.906, Zr:91.224, Nb:92.906, Mo:95.95, Ag:107.87,
  Cd:112.41, In:114.82, Sn:118.71, Sb:121.76, Te:127.60, I:126.90, Xe:131.29,
  Cs:132.91, Ba:137.33, La:138.91, Ce:140.12, W:183.84, Pt:195.08, Au:196.97,
  Hg:200.59, Tl:204.38, Pb:207.2, Bi:208.98, Ra:226.03, Th:232.04, U:238.03
};

// Analizza una formula bruta con parentesi e idrati, es. "C9H8O4",
// "Ca3(PO4)2", "CuSO4.5H2O".
// Pila di mappe: ogni parentesi aperta crea un nuovo livello, alla chiusura il
// gruppo viene moltiplicato per il suo pedice e fuso nel livello sottostante.
// Gestisce anche l'annidamento, es. K4[Fe(CN)6].
function parseSegment(seg){
  var stack = [{}];
  var i = 0;
  while(i < seg.length){
    var ch = seg[i];
    if(ch === '(' || ch === '['){ stack.push({}); i++; continue; }
    if(ch === ')' || ch === ']'){
      if(stack.length < 2) return null;                 // parentesi chiusa senza apertura
      var grp = stack.pop();
      var m = seg.slice(i + 1).match(/^(\d+)/);
      var k = m ? parseInt(m[1], 10) : 1;
      var top = stack[stack.length - 1];
      for(var e in grp) top[e] = (top[e] || 0) + grp[e] * k;
      i += 1 + (m ? m[1].length : 0);
      continue;
    }
    var el = seg.slice(i).match(/^([A-Z][a-z]?)(\d*)/);
    if(!el || !el[1] || !ATOMIC_MASS[el[1]]) return null;
    var cur = stack[stack.length - 1];
    cur[el[1]] = (cur[el[1]] || 0) + (el[2] ? parseInt(el[2], 10) : 1);
    i += el[0].length;
  }
  if(stack.length !== 1) return null;                   // parentesi non bilanciate
  return stack[0];
}

function parseFormula(f){
  var counts = {};
  var segments = String(f).split(/[.·]/);   // idrati: le parti si sommano
  for(var s = 0; s < segments.length; s++){
    var seg = segments[s].trim();
    if(!seg) continue;
    var lead = seg.match(/^(\d+)/);          // es. "5H2O" -> 5 unita'
    var segMult = 1;
    if(lead){ segMult = parseInt(lead[1], 10); seg = seg.slice(lead[1].length); }
    var part = parseSegment(seg);
    if(!part) return null;
    for(var e in part) counts[e] = (counts[e] || 0) + part[e] * segMult;
  }
  return Object.keys(counts).length ? counts : null;
}

var PHYS_CONST = {
  'costante di avogadro': { v: '6.02214076e23', u: 'mol⁻¹', note: 'esatta per definizione (SI 2019)' },
  'costante di planck':   { v: '6.62607015e-34', u: 'J·s', note: 'esatta per definizione' },
  'costante di boltzmann':{ v: '1.380649e-23', u: 'J/K', note: 'esatta per definizione' },
  'costante dei gas':     { v: '8.314462618', u: 'J/(mol·K)', note: 'R = N_A · k_B' },
  'carica elementare':    { v: '1.602176634e-19', u: 'C', note: 'esatta per definizione' },
  'velocita della luce':  { v: '299792458', u: 'm/s', note: 'esatta per definizione' },
  'costante di faraday':  { v: '96485.332', u: 'C/mol', note: 'F = N_A · e' },
  'massa elettrone':      { v: '9.1093837015e-31', u: 'kg', note: '' },
  'massa protone':        { v: '1.67262192369e-27', u: 'kg', note: '' },
  'costante di rydberg':  { v: '1.0973731568160e7', u: 'm⁻¹', note: '' },
  'zero assoluto':        { v: '-273.15', u: '°C', note: '0 K' },
  'volume molare gas':    { v: '22.414', u: 'L/mol', note: 'a 0 °C e 1 atm' }
};

// Fattori verso un'unita' di riferimento per ciascuna famiglia.
var UNIT_FAMILIES = {
  energia:     { ref:'J',   u:{ 'J':1, 'kJ':1e3, 'cal':4.184, 'kcal':4184, 'eV':1.602176634e-19,
                                'kJ/mol':1/6.02214076e20, 'kcal/mol':4184/6.02214076e23, 'cm-1':1.98644586e-23 } },
  lunghezza:   { ref:'m',   u:{ 'm':1, 'cm':1e-2, 'mm':1e-3, 'um':1e-6, 'nm':1e-9, 'pm':1e-12, 'A':1e-10 } },
  massa:       { ref:'g',   u:{ 'g':1, 'kg':1e3, 'mg':1e-3, 'ug':1e-6, 'u':1.66053906660e-24 } },
  pressione:   { ref:'Pa',  u:{ 'Pa':1, 'kPa':1e3, 'bar':1e5, 'atm':101325, 'mmHg':133.322, 'torr':133.322, 'psi':6894.76 } },
  volume:      { ref:'L',   u:{ 'L':1, 'mL':1e-3, 'uL':1e-6, 'm3':1e3, 'cm3':1e-3 } },
  temperatura: { ref:'K',   u:{ 'K':1, 'C':1, 'F':1 } }   // gestita a parte (offset)
};

// ── Aritmetica razionale esatta ────────────────────────────────────────────
// Il bilanciamento si risolve con l'eliminazione di Gauss; farla in virgola
// mobile produce coefficienti tipo 2.0000000000000004 e falsi "non bilanciabile".
// Con le frazioni il risultato e' esatto o non e' niente.
function _gcd(a, b){ a = Math.abs(a); b = Math.abs(b); while(b){ var t = b; b = a % b; a = t; } return a || 1; }
function _fr(n, d){
  d = (d === undefined) ? 1 : d;
  if(d < 0){ n = -n; d = -d; }
  var g = _gcd(n, d);
  return [n / g, d / g];
}
function _frAdd(a, b){ return _fr(a[0] * b[1] + b[0] * a[1], a[1] * b[1]); }
function _frMul(a, b){ return _fr(a[0] * b[0], a[1] * b[1]); }
function _frSub(a, b){ return _frAdd(a, [-b[0], b[1]]); }
function _frDiv(a, b){ return _fr(a[0] * b[1], a[1] * b[0]); }
function _frZero(a){ return a[0] === 0; }

// Risolve A·x = 0 restituendo il vettore di interi positivi piu' piccolo.
function _nullSpaceIntegers(rows, ncols){
  var M = rows.map(function(r){ return r.map(function(v){ return _fr(v, 1); }); });
  var pivots = [], r = 0, c;
  for(c = 0; c < ncols && r < M.length; c++){
    var p = -1;
    for(var i = r; i < M.length; i++) if(!_frZero(M[i][c])){ p = i; break; }
    if(p < 0) continue;
    var tmp = M[r]; M[r] = M[p]; M[p] = tmp;
    var pv = M[r][c];
    for(var j = 0; j < ncols; j++) M[r][j] = _frDiv(M[r][j], pv);
    for(var k = 0; k < M.length; k++){
      if(k === r || _frZero(M[k][c])) continue;
      var f = M[k][c];
      for(var j2 = 0; j2 < ncols; j2++) M[k][j2] = _frSub(M[k][j2], _frMul(f, M[r][j2]));
    }
    pivots.push(c); r++;
  }
  var free = [];
  for(c = 0; c < ncols; c++) if(pivots.indexOf(c) < 0) free.push(c);
  // Una sola variabile libera = soluzione unica a meno di un fattore di scala.
  // Zero variabili libere significa che l'unica soluzione e' quella nulla.
  if(free.length !== 1) return null;
  var x = new Array(ncols);
  for(c = 0; c < ncols; c++) x[c] = _fr(0, 1);
  x[free[0]] = _fr(1, 1);
  for(var pi = 0; pi < pivots.length; pi++){
    var pc = pivots[pi];
    var acc = _fr(0, 1);
    for(var cc = 0; cc < ncols; cc++){
      if(cc === pc) continue;
      acc = _frAdd(acc, _frMul(M[pi][cc], x[cc]));
    }
    x[pc] = [-acc[0], acc[1]];
  }
  var lcm = 1;
  for(c = 0; c < ncols; c++) lcm = lcm / _gcd(lcm, x[c][1]) * x[c][1];
  var ints = x.map(function(v){ return v[0] * (lcm / v[1]); });
  var g = 0;
  for(c = 0; c < ncols; c++) g = _gcd(g, ints[c]);
  if(g) ints = ints.map(function(v){ return v / g; });
  if(ints.some(function(v){ return v < 0; })) ints = ints.map(function(v){ return -v; });
  if(ints.some(function(v){ return v <= 0; })) return null;
  return ints;
}

// ═══════════════════════════════════════════════════════════════════════════
// MOTORE DI CALCOLO
// Non si puo' prevedere uno strumento per ogni problema di chimica fisica o di
// matematica: serve un valutatore generale. NON uso eval(): il modello legge
// dati esterni (PubChem, PubMed) e un'iniezione in quei contenuti potrebbe
// far eseguire codice arbitrario nella pagina, dove vive anche la chiave API.
// Questo e' un parser a discesa ricorsiva con un insieme chiuso di funzioni:
// puo' solo fare matematica, non puo' toccare nulla del resto.
// ═══════════════════════════════════════════════════════════════════════════
var MATH_FN = {
  sin: Math.sin, cos: Math.cos, tan: Math.tan,
  asin: Math.asin, acos: Math.acos, atan: Math.atan, atan2: Math.atan2,
  sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
  exp: Math.exp, sqrt: Math.sqrt, cbrt: Math.cbrt, abs: Math.abs,
  ln: Math.log, log: function(x){ return Math.log10(x); },
  log10: Math.log10, log2: Math.log2,
  floor: Math.floor, ceil: Math.ceil, round: Math.round, sign: Math.sign,
  min: Math.min, max: Math.max, pow: Math.pow,
  fact: function(n){ if(n < 0 || n !== Math.floor(n)) return NaN; var r = 1; for(var i = 2; i <= n; i++) r *= i; return r; }
};
var MATH_CONST = {
  pi: Math.PI, PI: Math.PI, e: Math.E,
  R: 8.314462618, NA: 6.02214076e23, kB: 1.380649e-23, h: 6.62607015e-34,
  c: 299792458, F: 96485.332, me: 9.1093837015e-31, qe: 1.602176634e-19
};

function mathEval(expr, vars){
  vars = vars || {};
  var s = String(expr), i = 0;

  function ws(){ while(i < s.length && /\s/.test(s[i])) i++; }
  function fail(m){ throw new Error(m + ' (posizione ' + i + ')'); }

  function parseExpr(){
    var v = parseTerm();
    for(;;){
      ws();
      if(s[i] === '+'){ i++; v += parseTerm(); }
      else if(s[i] === '-'){ i++; v -= parseTerm(); }
      else return v;
    }
  }
  function parseTerm(){
    var v = parseUnary();
    for(;;){
      ws();
      if(s[i] === '*'){ i++; v *= parseUnary(); }
      else if(s[i] === '/'){ i++; v /= parseUnary(); }
      else if(s[i] === '%'){ i++; v %= parseUnary(); }
      // moltiplicazione implicita: 2pi, 3(x+1), 2sin(x)
      else if(/[A-Za-z(]/.test(s[i] || '')) v *= parseUnary();
      else return v;
    }
  }
  function parseUnary(){
    ws();
    if(s[i] === '-'){ i++; return -parseUnary(); }
    if(s[i] === '+'){ i++; return parseUnary(); }
    return parsePower();
  }
  function parsePower(){
    var base = parseAtom();
    ws();
    if(s[i] === '^' || (s[i] === '*' && s[i + 1] === '*')){
      i += (s[i] === '^') ? 1 : 2;
      return Math.pow(base, parseUnary());   // associativo a destra
    }
    return base;
  }
  function parseAtom(){
    ws();
    if(s[i] === '('){
      i++; var v = parseExpr(); ws();
      if(s[i] !== ')') fail('manca una parentesi chiusa');
      i++; return v;
    }
    // numero, con notazione scientifica
    var m = /^\d+(\.\d+)?([eE][+-]?\d+)?|^\.\d+([eE][+-]?\d+)?/.exec(s.slice(i));
    if(m){ i += m[0].length; return parseFloat(m[0]); }
    // identificatore: funzione, costante o variabile
    var id = /^[A-Za-z_][A-Za-z_0-9]*/.exec(s.slice(i));
    if(id){
      var name = id[0];
      i += name.length; ws();
      if(s[i] === '('){
        if(!Object.prototype.hasOwnProperty.call(MATH_FN, name)) fail('funzione sconosciuta: ' + name);
        i++;
        var args = [];
        ws();
        if(s[i] !== ')'){
          for(;;){ args.push(parseExpr()); ws(); if(s[i] === ','){ i++; continue; } break; }
        }
        if(s[i] !== ')') fail('manca una parentesi chiusa in ' + name + '()');
        i++;
        return MATH_FN[name].apply(null, args);
      }
      if(Object.prototype.hasOwnProperty.call(vars, name)) return Number(vars[name]);
      if(Object.prototype.hasOwnProperty.call(MATH_CONST, name)) return MATH_CONST[name];
      fail('simbolo sconosciuto: ' + name);
    }
    fail('espressione non valida');
  }

  var out = parseExpr();
  ws();
  if(i < s.length) fail('carattere inatteso: "' + s[i] + '"');
  return out;
}

// Cerca uno zero di f(x) nell'intervallo dato: prima campiona per trovare un
// cambio di segno, poi bisezione (robusta, non diverge come Newton).
function findRoots(fn, lo, hi, want){
  var roots = [], N = 2000, prev = null, prevX = lo;
  for(var k = 0; k <= N; k++){
    var x = lo + (hi - lo) * k / N, y;
    try{ y = fn(x); }catch(e){ y = NaN; }
    if(!isFinite(y)){ prev = null; prevX = x; continue; }
    if(Math.abs(y) < 1e-12){
      if(!roots.some(function(r){ return Math.abs(r - x) < (hi - lo) * 1e-6; })) roots.push(x);
    } else if(prev !== null && prev * y < 0){
      var a = prevX, b = x, fa = prev;
      for(var it = 0; it < 200; it++){
        var mid = (a + b) / 2, fm = fn(mid);
        if(fa * fm <= 0) b = mid; else { a = mid; fa = fm; }
      }
      var r0 = (a + b) / 2;
      if(!roots.some(function(r){ return Math.abs(r - r0) < (hi - lo) * 1e-6; })) roots.push(r0);
    }
    prev = y; prevX = x;
    if(want && roots.length >= want) break;
  }
  return roots;
}

TOOLS.push(
  {
    name: 'calcola',
    description: "Valuta un'espressione matematica qualsiasi con precisione numerica. Supporta + - * / ^ , parentesi, notazione scientifica (1.5e-3), funzioni (sin cos tan asin acos atan sinh cosh tanh exp ln log log10 log2 sqrt cbrt abs min max pow fact floor ceil round sign) e costanti (pi, e, R, NA, kB, h, c, F, me, qe). Puoi definire variabili. USA SEMPRE questo strumento per qualunque calcolo numerico, anche semplice: e' esatto, la tua stima no.",
    parameters: {
      type: 'object',
      properties: {
        espressione: { type: 'string', description: 'Es. "(-1.2e3)/(8.314*298)" oppure "exp(-Ea/(R*T))".' },
        variabili: { type: 'object', description: 'Valori delle variabili usate, es. {"Ea": 50000, "T": 298}.' }
      },
      required: ['espressione']
    },
    execute: function(a){
      try{
        var v = mathEval(a.espressione, a.variabili || {});
        if(!isFinite(v)) return { ok:false, error:'risultato non finito (divisione per zero o dominio non valido)', espressione:a.espressione };
        return { ok:true, espressione:a.espressione, variabili:a.variabili || {}, risultato:v,
                 notazione_scientifica: (Math.abs(v) !== 0 && (Math.abs(v) < 1e-3 || Math.abs(v) >= 1e6)) ? v.toExponential(6) : null };
      }catch(e){ return { ok:false, error:e.message, espressione:a.espressione }; }
    }
  },
  {
    name: 'risolvi_equazione',
    description: "Risolve numericamente un'equazione in una incognita, anche non lineare (polinomi di grado qualsiasi, equazioni trascendenti, equilibri chimici). Scrivi l'equazione come espressione da azzerare, oppure con '='.",
    parameters: {
      type: 'object',
      properties: {
        equazione: { type: 'string', description: 'Es. "x^2 - 5*x + 6" oppure "x^2 = 5*x - 6". Incognita di default: x.' },
        incognita: { type: 'string', description: 'Nome dell\'incognita (default "x").' },
        min: { type: 'number', description: 'Estremo inferiore di ricerca (default -1000).' },
        max: { type: 'number', description: 'Estremo superiore (default 1000).' },
        variabili: { type: 'object', description: 'Eventuali altri parametri noti.' }
      },
      required: ['equazione']
    },
    execute: function(a){
      var v = (a && a.incognita) || 'x';
      var eq = String(a.equazione || '');
      var parts = eq.split('=');
      var expr = parts.length === 2 ? '(' + parts[0] + ') - (' + parts[1] + ')' : eq;
      var lo = (a.min !== undefined) ? a.min : -1000, hi = (a.max !== undefined) ? a.max : 1000;
      var base = a.variabili || {};
      var f = function(x){ var vars = {}; for(var k in base) vars[k] = base[k]; vars[v] = x; return mathEval(expr, vars); };
      try{ f((lo + hi) / 2); }catch(e){ return { ok:false, error:e.message }; }
      var roots = findRoots(f, lo, hi);
      if(!roots.length) return { ok:true, soluzioni:[], nota:'nessuna soluzione reale trovata fra ' + lo + ' e ' + hi + ': prova ad allargare l\'intervallo' };
      return { ok:true, incognita:v, equazione:eq, intervallo:[lo, hi],
               soluzioni: roots.map(function(r){ return +r.toPrecision(10); }),
               verifica: roots.map(function(r){ return { x:+r.toPrecision(10), residuo:+Math.abs(f(r)).toExponential(2) }; }) };
    }
  },
  {
    name: 'analisi_dati',
    description: 'Statistica descrittiva e regressione lineare su una serie di dati: media, deviazione standard, retta dei minimi quadrati con R². Utile per cinetica (ln[A] vs t), Beer-Lambert, tarature.',
    parameters: {
      type: 'object',
      properties: {
        x: { type: 'array', items: { type: 'number' }, description: 'Valori della variabile indipendente (per la regressione).' },
        y: { type: 'array', items: { type: 'number' }, description: 'Valori della variabile dipendente. Se ometti x, calcolo solo la statistica di y.' }
      },
      required: ['y']
    },
    execute: function(a){
      var y = (a && a.y || []).map(Number).filter(isFinite);
      if(y.length < 2) return { ok:false, error:'servono almeno 2 valori' };
      var n = y.length, sum = y.reduce(function(p, q){ return p + q; }, 0), mean = sum / n;
      var varc = y.reduce(function(p, q){ return p + (q - mean) * (q - mean); }, 0) / (n - 1);
      var out = { ok:true, n:n, media:+mean.toPrecision(8), deviazione_standard:+Math.sqrt(varc).toPrecision(8),
                  minimo:Math.min.apply(null, y), massimo:Math.max.apply(null, y), somma:+sum.toPrecision(8) };
      var x = a.x && a.x.map(Number);
      if(x && x.length === n){
        var mx = x.reduce(function(p, q){ return p + q; }, 0) / n;
        var sxy = 0, sxx = 0, syy = 0;
        for(var i = 0; i < n; i++){ sxy += (x[i] - mx) * (y[i] - mean); sxx += (x[i] - mx) * (x[i] - mx); syy += (y[i] - mean) * (y[i] - mean); }
        if(sxx === 0) return out;
        var m = sxy / sxx, q0 = mean - m * mx, r2 = syy === 0 ? 1 : (sxy * sxy) / (sxx * syy);
        out.regressione = { pendenza:+m.toPrecision(8), intercetta:+q0.toPrecision(8), R2:+r2.toPrecision(6),
                            equazione:'y = ' + m.toPrecision(6) + '·x + ' + q0.toPrecision(6) };
      }
      return out;
    }
  },
  {
    name: 'spettroscopia',
    description: "Interpretazione spettroscopica: gradi di insaturazione (DBE) da formula, pattern isotopico in massa (Cl, Br, S, C-13), tabelle di assorbimento IR, spostamenti chimici NMR ¹H e ¹³C tipici, e regole di Woodward-Fieser per UV-Vis. E' il cuore di BioSpecInfo: usalo ogni volta che si parla di spettri.",
    parameters: {
      type: 'object',
      properties: {
        calcolo: { type: 'string', description: '"dbe", "isotopi_ms", "ir", "nmr", "uv_woodward".' },
        formula: { type: 'string', description: 'Formula bruta, per dbe e isotopi_ms. Es. "C7H7ClO".' },
        gruppo: { type: 'string', description: 'Gruppo funzionale o tipo di protone/carbonio da cercare nelle tabelle IR/NMR.' },
        nucleo: { type: 'string', description: 'Per nmr: "1H" oppure "13C" (default 1H).' },
        base: { type: 'string', description: 'Per uv_woodward: "diene_aciclico", "diene_eteroanulare", "diene_omoanulare", "enone".' },
        sostituenti: { type: 'number', description: 'Per uv_woodward: numero di sostituenti alchilici.' },
        doppi_legami_coniugati: { type: 'number', description: 'Per uv_woodward: doppi legami che estendono la coniugazione.' }
      },
      required: ['calcolo']
    },
    execute: function(a){
      a = a || {}; var c = String(a.calcolo || '').toLowerCase();
      if(c === 'dbe'){
        var cnt = parseFormula(a.formula || '');
        if(!cnt) return { ok:false, error:'formula non interpretabile: ' + a.formula };
        var C = cnt.C || 0, H = cnt.H || 0, N = cnt.N || 0;
        var X = (cnt.F || 0) + (cnt.Cl || 0) + (cnt.Br || 0) + (cnt.I || 0);
        var dbe = (2 * C + 2 + N - H - X) / 2;
        return { ok:true, formula:a.formula, DBE:dbe,
                 formula_usata:'DBE = (2C + 2 + N − H − alogeni)/2',
                 conteggi:{ C:C, H:H, N:N, alogeni:X, O:(cnt.O || 0), S:(cnt.S || 0) },
                 interpretazione: dbe < 0 ? 'valore negativo: la formula non e\' valida'
                   : dbe === 0 ? 'nessun anello ne\' insaturazione: composto saturo aciclico'
                   : dbe >= 4 ? dbe + ' insaturazioni: compatibile con un anello aromatico (4 DBE) piu\' altre insaturazioni'
                   : dbe + ' insaturazioni: anelli e/o doppi legami (un triplo legame ne vale 2)',
                 nota:'ossigeno e zolfo non entrano nel conteggio' };
      }
      if(c === 'isotopi_ms'){
        var m = parseFormula(a.formula || '');
        if(!m) return { ok:false, error:'formula non interpretabile: ' + a.formula };
        var nCl = m.Cl || 0, nBr = m.Br || 0, nC = m.C || 0, nS = m.S || 0;
        var pattern = [{ picco:'M', intensita:100 }];
        var note = [];
        if(nCl === 1){ pattern.push({ picco:'M+2', intensita:32.0 }); note.push('1 Cl: M:M+2 ≈ 3:1'); }
        else if(nCl === 2){ pattern.push({ picco:'M+2', intensita:65.0 }, { picco:'M+4', intensita:10.6 }); note.push('2 Cl: M:M+2:M+4 ≈ 9:6:1'); }
        else if(nCl === 3){ pattern.push({ picco:'M+2', intensita:98 }, { picco:'M+4', intensita:32 }, { picco:'M+6', intensita:3.5 }); note.push('3 Cl: 27:27:9:1'); }
        if(nBr === 1){ pattern.push({ picco:'M+2', intensita:97.3 }); note.push('1 Br: M:M+2 ≈ 1:1 (firma inconfondibile)'); }
        else if(nBr === 2){ pattern.push({ picco:'M+2', intensita:195 }, { picco:'M+4', intensita:95 }); note.push('2 Br: 1:2:1'); }
        if(nS) note.push(nS + ' S: contributo M+2 di circa ' + (4.4 * nS).toFixed(1) + '%');
        if(nC) note.push(nC + ' C: picco M+1 di circa ' + (1.1 * nC).toFixed(1) + '% per il ¹³C');
        if(nC) pattern.push({ picco:'M+1', intensita:+(1.1 * nC).toFixed(1) });
        return { ok:true, formula:a.formula, pattern_isotopico:pattern, note:note,
                 alogeni:{ Cl:nCl, Br:nBr }, nota_generale:'intensita\' relative con M = 100' };
      }
      if(c === 'ir'){
        var IR = [
          { gruppo:'O–H alcol (legato)', range:'3200–3600', forma:'larga, intensa' },
          { gruppo:'O–H acido carbossilico', range:'2500–3300', forma:'molto larga' },
          { gruppo:'N–H ammina/ammide', range:'3300–3500', forma:'media; 2 bande se primaria' },
          { gruppo:'C–H alchino terminale', range:'3300', forma:'stretta, intensa' },
          { gruppo:'C–H aromatico/vinilico', range:'3000–3100', forma:'media' },
          { gruppo:'C–H alifatico', range:'2850–3000', forma:'intensa' },
          { gruppo:'C≡N nitrile', range:'2220–2260', forma:'stretta, media' },
          { gruppo:'C≡C alchino', range:'2100–2260', forma:'debole' },
          { gruppo:'C=O aldeide', range:'1720–1740', forma:'intensa (+ 2 bande C–H a 2720 e 2820)' },
          { gruppo:'C=O chetone', range:'1705–1725', forma:'intensa' },
          { gruppo:'C=O acido carbossilico', range:'1700–1725', forma:'intensa' },
          { gruppo:'C=O estere', range:'1735–1750', forma:'intensa' },
          { gruppo:'C=O ammide', range:'1630–1690', forma:'intensa' },
          { gruppo:'C=O anidride', range:'1750 e 1820', forma:'due bande' },
          { gruppo:'C=C alchene', range:'1620–1680', forma:'variabile' },
          { gruppo:'C=C aromatico', range:'1450–1600', forma:'media, piu\' bande' },
          { gruppo:'N–O nitro', range:'1350 e 1550', forma:'due bande intense' },
          { gruppo:'C–O alcol/etere/estere', range:'1000–1300', forma:'intensa' }
        ];
        var q = (a.gruppo || '').toLowerCase();
        var sel = q ? IR.filter(function(x){ return x.gruppo.toLowerCase().indexOf(q) >= 0; }) : IR;
        return { ok:true, unita:'cm⁻¹', bande: sel.length ? sel : IR,
                 nota: sel.length ? undefined : 'nessuna corrispondenza per "' + a.gruppo + '": restituita la tabella completa' };
      }
      if(c === 'nmr'){
        var H1 = [
          { tipo:'TMS (riferimento)', shift:'0' }, { tipo:'CH₃ alifatico', shift:'0.9' },
          { tipo:'CH₂ alifatico', shift:'1.3' }, { tipo:'CH alifatico', shift:'1.5' },
          { tipo:'CH₃ vicino a C=O', shift:'2.1–2.6' }, { tipo:'CH vicino ad aromatico (benzilico)', shift:'2.3–2.7' },
          { tipo:'CH₃ vicino a N', shift:'2.2–2.9' }, { tipo:'CH vicino a O (etere/alcol)', shift:'3.3–4.0' },
          { tipo:'CH₂ di estere (O–CH₂)', shift:'4.1–4.3' }, { tipo:'O–H alcol', shift:'1–5 (variabile, scambiabile)' },
          { tipo:'alchene (=CH)', shift:'4.5–6.5' }, { tipo:'aromatico', shift:'6.5–8.0' },
          { tipo:'aldeide (CHO)', shift:'9.5–10.1' }, { tipo:'acido carbossilico (COOH)', shift:'10–13' }
        ];
        var C13 = [
          { tipo:'CH₃/CH₂/CH alifatici', shift:'0–50' }, { tipo:'C vicino a N', shift:'30–65' },
          { tipo:'C vicino a O (alcol/etere)', shift:'50–90' }, { tipo:'alchino', shift:'65–90' },
          { tipo:'alchene', shift:'100–150' }, { tipo:'aromatico', shift:'110–160' },
          { tipo:'nitrile', shift:'115–125' }, { tipo:'estere/ammide (C=O)', shift:'160–185' },
          { tipo:'acido carbossilico (C=O)', shift:'165–185' }, { tipo:'aldeide/chetone (C=O)', shift:'190–220' }
        ];
        var nuc = (a.nucleo || '1H').toUpperCase().replace('-', '');
        var tab = nuc.indexOf('13') >= 0 ? C13 : H1;
        var q2 = (a.gruppo || '').toLowerCase();
        var sel2 = q2 ? tab.filter(function(x){ return x.tipo.toLowerCase().indexOf(q2) >= 0; }) : tab;
        return { ok:true, nucleo: nuc.indexOf('13') >= 0 ? '¹³C' : '¹H', unita:'ppm (δ)',
                 riferimento:'TMS = 0 ppm', valori: sel2.length ? sel2 : tab,
                 regola_molteplicita:'n idrogeni sul carbonio adiacente danno n+1 picchi (regola n+1)' };
      }
      if(c === 'uv_woodward'){
        var basi = { diene_aciclico:217, diene_eteroanulare:214, diene_omoanulare:253, enone:215 };
        var b = basi[String(a.base || '').toLowerCase()];
        if(b === undefined) return { ok:false, error:'base non riconosciuta', disponibili:Object.keys(basi) };
        var lam = b, dett = ['base ' + a.base + ': ' + b + ' nm'];
        if(a.sostituenti){ lam += 5 * a.sostituenti; dett.push('+5 nm × ' + a.sostituenti + ' sostituenti alchilici = +' + (5 * a.sostituenti)); }
        if(a.doppi_legami_coniugati){ lam += 30 * a.doppi_legami_coniugati; dett.push('+30 nm × ' + a.doppi_legami_coniugati + ' doppi legami coniugati = +' + (30 * a.doppi_legami_coniugati)); }
        return { ok:true, lambda_max_stimata_nm:lam, dettaglio:dett,
                 nota:'regole di Woodward-Fieser: stima empirica, non un calcolo quantistico' };
      }
      return { ok:false, error:'calcolo non riconosciuto', disponibili:['dbe','isotopi_ms','ir','nmr','uv_woodward'] };
    }
  },
  {
    name: 'biochimica',
    description: "Biochimica quantitativa: cinetica enzimatica di Michaelis-Menten (v, Km, Vmax, Lineweaver-Burk, inibizione competitiva/non competitiva), massa e punto isoelettrico di un peptide dalla sequenza, e resa energetica delle vie metaboliche.",
    parameters: {
      type: 'object',
      properties: {
        calcolo: { type: 'string', description: '"michaelis_menten", "peptide", "resa_atp".' },
        Vmax: { type: 'number', description: 'Velocita\' massima.' },
        Km: { type: 'number', description: 'Costante di Michaelis.' },
        S: { type: 'number', description: 'Concentrazione di substrato.' },
        I: { type: 'number', description: 'Concentrazione di inibitore.' },
        Ki: { type: 'number', description: 'Costante di inibizione.' },
        tipo_inibizione: { type: 'string', description: '"competitiva", "non_competitiva", "incompetitiva".' },
        sequenza: { type: 'string', description: 'Sequenza peptidica a lettera singola, es. "MAKVIL".' },
        via: { type: 'string', description: 'Per resa_atp: "glicolisi", "krebs", "beta_ossidazione", "completa".' },
        n_carboni: { type: 'number', description: 'Per beta_ossidazione: numero di carboni dell\'acido grasso.' }
      },
      required: ['calcolo']
    },
    execute: function(a){
      a = a || {}; var c = String(a.calcolo || '').toLowerCase();
      if(c === 'michaelis_menten'){
        if(a.Vmax === undefined || a.Km === undefined) return { ok:false, error:'servono Vmax e Km' };
        var Km = a.Km, Vmax = a.Vmax, out = { ok:true, Vmax:Vmax, Km:Km, equazione:'v = Vmax·[S]/(Km + [S])' };
        if(a.I !== undefined && a.Ki !== undefined){
          var alpha = 1 + a.I / a.Ki, ti = String(a.tipo_inibizione || 'competitiva').toLowerCase();
          if(ti === 'competitiva'){ Km = a.Km * alpha; out.effetto = 'Km apparente aumenta (×' + alpha.toFixed(3) + '), Vmax invariata'; }
          else if(ti === 'non_competitiva'){ Vmax = a.Vmax / alpha; out.effetto = 'Vmax diminuisce (÷' + alpha.toFixed(3) + '), Km invariata'; }
          else { Km = a.Km / alpha; Vmax = a.Vmax / alpha; out.effetto = 'Km e Vmax diminuiscono entrambe (÷' + alpha.toFixed(3) + ')'; }
          out.inibizione = ti; out.alpha = +alpha.toFixed(4);
          out.Km_apparente = +Km.toPrecision(6); out.Vmax_apparente = +Vmax.toPrecision(6);
        }
        if(a.S !== undefined){
          var v = Vmax * a.S / (Km + a.S);
          out.S = a.S; out.v = +v.toPrecision(6);
          out.percento_di_Vmax = +(100 * v / a.Vmax).toPrecision(4);
          out.nota_S_vs_Km = a.S < Km / 10 ? 'S ≪ Km: regime di primo ordine, v ≈ (Vmax/Km)·S'
                            : a.S > 10 * Km ? 'S ≫ Km: enzima saturo, regime di ordine zero'
                            : 'S confrontabile con Km: regione di transizione';
        }
        out.efficienza_catalitica = 'kcat/Km si ottiene dividendo Vmax per [E]totale e poi per Km';
        out.lineweaver_burk = '1/v = (Km/Vmax)·(1/[S]) + 1/Vmax — intercetta 1/Vmax, pendenza Km/Vmax';
        return out;
      }
      if(c === 'peptide'){
        var seq = String(a.sequenza || '').toUpperCase().replace(/[^A-Z]/g, '');
        if(!seq) return { ok:false, error:'sequenza mancante' };
        // massa media dei residui (Da) e pKa dei gruppi ionizzabili
        var RES = { A:71.08, R:156.19, N:114.10, D:115.09, C:103.14, E:129.12, Q:128.13, G:57.05,
                    H:137.14, I:113.16, L:113.16, K:128.17, M:131.19, F:147.18, P:97.12, S:87.08,
                    T:101.10, W:186.21, Y:163.18, V:99.13 };
        var mass = 18.015, bad = [];
        for(var i = 0; i < seq.length; i++){
          if(RES[seq[i]] === undefined) bad.push(seq[i]);
          else mass += RES[seq[i]];
        }
        if(bad.length) return { ok:false, error:'lettere non valide nella sequenza: ' + bad.join(', ') };
        // pI per bisezione sulla carica netta
        var pKaC = 3.65, pKaN = 8.2;
        var SIDE = { D:[3.9,-1], E:[4.07,-1], C:[8.18,-1], Y:[10.46,-1], H:[6.04,1], K:[10.54,1], R:[12.48,1] };
        function carica(pH){
          var q = 1 / (1 + Math.pow(10, pH - pKaN)) - 1 / (1 + Math.pow(10, pKaC - pH));
          for(var j = 0; j < seq.length; j++){
            var s = SIDE[seq[j]];
            if(!s) continue;
            if(s[1] > 0) q += 1 / (1 + Math.pow(10, pH - s[0]));
            else q -= 1 / (1 + Math.pow(10, s[0] - pH));
          }
          return q;
        }
        var lo = 0, hi = 14;
        for(var it = 0; it < 100; it++){ var mid = (lo + hi) / 2; if(carica(mid) > 0) lo = mid; else hi = mid; }
        var pI = (lo + hi) / 2;
        var comp = {};
        for(var k2 = 0; k2 < seq.length; k2++) comp[seq[k2]] = (comp[seq[k2]] || 0) + 1;
        return { ok:true, sequenza:seq, lunghezza:seq.length,
                 massa_media_Da:+mass.toFixed(2), pI:+pI.toFixed(2),
                 carica_a_pH7:+carica(7).toFixed(2),
                 composizione:comp,
                 nota:'massa media (non monoisotopica); pI calcolato per bisezione sulla carica netta' };
      }
      if(c === 'resa_atp'){
        var v2 = String(a.via || 'completa').toLowerCase();
        var vie = {
          glicolisi:{ ATP_netti:2, NADH:2, resa_totale_con_ossigeno:'circa 7 ATP (2 diretti + 2 NADH citosolici)',
                      nota:'glucosio -> 2 piruvato; 2 ATP consumati e 4 prodotti' },
          krebs:{ per_giro:{ ATP_GTP:1, NADH:3, FADH2:1 }, per_glucosio:{ giri:2, ATP_GTP:2, NADH:6, FADH2:2 },
                  nota:'il ciclo parte da acetil-CoA: 2 giri per glucosio' },
          beta_ossidazione:{ nota:'ogni ciclo accorcia di 2 carboni e produce 1 FADH₂, 1 NADH e 1 acetil-CoA' },
          completa:{ ossidazione_glucosio:'circa 30-32 ATP',
                     dettaglio:'glicolisi 2 ATP + 2 NADH; decarbossilazione 2 NADH; Krebs 2 GTP + 6 NADH + 2 FADH₂',
                     stechiometria:'1 NADH ≈ 2.5 ATP, 1 FADH₂ ≈ 1.5 ATP (rapporti P/O moderni)',
                     nota:'il vecchio valore di 36-38 ATP usava rapporti P/O interi, oggi superati' }
        };
        var r2 = vie[v2];
        if(!r2) return { ok:false, error:'via non riconosciuta', disponibili:Object.keys(vie) };
        var res = { ok:true, via:v2 };
        for(var kk in r2) res[kk] = r2[kk];
        if(v2 === 'beta_ossidazione' && a.n_carboni){
          var n = a.n_carboni, cicli = n / 2 - 1;
          res.cicli = cicli; res.acetil_CoA = n / 2;
          res.FADH2 = cicli; res.NADH = cicli;
          res.ATP_stimati = +(cicli * 1.5 + cicli * 2.5 + (n / 2) * 10 - 2).toFixed(1);
          res.dettaglio_calcolo = cicli + ' cicli × (1.5 + 2.5) + ' + (n / 2) + ' acetil-CoA × 10 − 2 di attivazione';
        }
        return res;
      }
      return { ok:false, error:'calcolo non riconosciuto', disponibili:['michaelis_menten','peptide','resa_atp'] };
    }
  },
  {
    name: 'farmacocinetica',
    description: "Farmacocinetica: volume di distribuzione, clearance, emivita, dose di carico e di mantenimento, accumulo allo stato stazionario, biodisponibilita' e concentrazione nel tempo.",
    parameters: {
      type: 'object',
      properties: {
        dose_mg: { type: 'number', description: 'Dose somministrata in mg.' },
        Vd_L: { type: 'number', description: 'Volume di distribuzione in L.' },
        CL_L_h: { type: 'number', description: 'Clearance in L/h.' },
        t_mezza_h: { type: 'number', description: 'Emivita in ore.' },
        C0_mg_L: { type: 'number', description: 'Concentrazione iniziale in mg/L.' },
        C_target_mg_L: { type: 'number', description: 'Concentrazione bersaglio in mg/L.' },
        intervallo_h: { type: 'number', description: 'Intervallo fra le dosi in ore.' },
        F: { type: 'number', description: 'Biodisponibilita\' (0-1, default 1).' },
        tempo_h: { type: 'number', description: 'Tempo per il calcolo della concentrazione.' }
      }
    },
    execute: function(a){
      a = a || {}; var out = { ok:true }, F = a.F !== undefined ? a.F : 1;
      var Vd = a.Vd_L, CL = a.CL_L_h, t12 = a.t_mezza_h;
      // le tre grandezze sono legate: t½ = ln2·Vd/CL
      if(t12 === undefined && Vd !== undefined && CL !== undefined) t12 = Math.LN2 * Vd / CL;
      if(CL === undefined && Vd !== undefined && t12 !== undefined) CL = Math.LN2 * Vd / t12;
      if(Vd === undefined && CL !== undefined && t12 !== undefined) Vd = CL * t12 / Math.LN2;
      if(Vd === undefined && a.dose_mg !== undefined && a.C0_mg_L !== undefined) Vd = F * a.dose_mg / a.C0_mg_L;
      if(Vd !== undefined) out.Vd_L = +Vd.toPrecision(6);
      if(CL !== undefined) out.CL_L_h = +CL.toPrecision(6);
      if(t12 !== undefined){
        out.t_mezza_h = +t12.toPrecision(6);
        out.k_eliminazione_h = +(Math.LN2 / t12).toPrecision(6);
        out.tempo_stato_stazionario_h = +(4.32 * t12).toPrecision(4);   // ~95% in 4.32 emivite
        out.nota_steady_state = 'circa il 95% dello stato stazionario dopo 4-5 emivite';
      }
      if(a.dose_mg !== undefined && Vd !== undefined && out.C0_mg_L === undefined)
        out.C0_mg_L = +(F * a.dose_mg / Vd).toPrecision(6);
      if(a.tempo_h !== undefined && t12 !== undefined){
        var C0 = out.C0_mg_L !== undefined ? out.C0_mg_L : a.C0_mg_L;
        if(C0 !== undefined){
          out.C_al_tempo_mg_L = +(C0 * Math.exp(-Math.LN2 / t12 * a.tempo_h)).toPrecision(6);
          out.emivite_trascorse = +(a.tempo_h / t12).toPrecision(4);
          out.frazione_residua_percento = +(100 * Math.pow(0.5, a.tempo_h / t12)).toPrecision(4);
        }
      }
      if(a.C_target_mg_L !== undefined){
        if(Vd !== undefined) out.dose_di_carico_mg = +(a.C_target_mg_L * Vd / F).toPrecision(6);
        if(CL !== undefined){
          out.velocita_infusione_mg_h = +(a.C_target_mg_L * CL / F).toPrecision(6);
          if(a.intervallo_h !== undefined)
            out.dose_mantenimento_mg = +(a.C_target_mg_L * CL * a.intervallo_h / F).toPrecision(6);
        }
      }
      if(a.intervallo_h !== undefined && t12 !== undefined){
        var R = 1 / (1 - Math.pow(0.5, a.intervallo_h / t12));
        out.fattore_accumulo = +R.toPrecision(5);
        out.nota_accumulo = 'con intervallo ' + a.intervallo_h + ' h ed emivita ' + t12.toFixed(2) + ' h il farmaco si accumula di ' + R.toFixed(2) + '×';
      }
      out.formule = 't½ = ln2·Vd/CL ; C₀ = F·D/Vd ; dose carico = C·Vd/F ; mantenimento = C·CL·τ/F';
      if(Object.keys(out).length <= 2) return { ok:false, error:'dati insufficienti: servono almeno due fra Vd, CL ed emivita, oppure dose e concentrazione' };
      return out;
    }
  },
  {
    name: 'termodinamica',
    description: "Risolve problemi di termodinamica chimica: energia libera di Gibbs (ΔG = ΔH − TΔS), costante di equilibrio da ΔG° (ΔG° = −RT·lnK) e viceversa, equazione di van 't Hoff (K a due temperature), spontaneita' e temperatura di inversione.",
    parameters: {
      type: 'object',
      properties: {
        dH: { type: 'number', description: 'ΔH in kJ/mol.' },
        dS: { type: 'number', description: 'ΔS in J/(mol·K).' },
        dG: { type: 'number', description: 'ΔG in kJ/mol (se noto).' },
        T: { type: 'number', description: 'Temperatura in K (default 298.15).' },
        K: { type: 'number', description: 'Costante di equilibrio (se nota).' },
        T2: { type: 'number', description: 'Seconda temperatura in K, per van \'t Hoff.' }
      }
    },
    execute: function(a){
      a = a || {};
      var R = 8.314462618, T = (a.T !== undefined) ? a.T : 298.15, out = { ok:true, T_K:T };
      var dG = a.dG;
      if(dG === undefined && a.dH !== undefined && a.dS !== undefined){
        dG = a.dH - T * a.dS / 1000;                       // dS in J -> kJ
        out.dG_kJ_mol = +dG.toFixed(4);
        out.formula = 'ΔG = ΔH − TΔS = ' + a.dH + ' − ' + T + '·(' + a.dS + '/1000)';
      }
      if(dG === undefined && a.K !== undefined){
        dG = -R * T * Math.log(a.K) / 1000;
        out.dG_kJ_mol = +dG.toFixed(4);
        out.formula = 'ΔG° = −RT·lnK';
      }
      if(dG !== undefined){
        out.dG_kJ_mol = +Number(dG).toFixed(4);
        out.spontanea = dG < 0;
        out.giudizio = dG < 0 ? 'spontanea nelle condizioni date (ΔG < 0)'
                     : dG > 0 ? 'non spontanea nelle condizioni date (ΔG > 0)'
                              : 'sistema all\'equilibrio (ΔG = 0)';
        if(a.K === undefined){
          var K = Math.exp(-dG * 1000 / (R * T));
          out.K_equilibrio = (K < 1e-4 || K > 1e4) ? K.toExponential(4) : +K.toPrecision(6);
        }
      }
      if(a.K !== undefined) out.K_equilibrio = a.K;
      // temperatura oltre la quale il segno di ΔG si inverte
      if(a.dH !== undefined && a.dS !== undefined && a.dS !== 0){
        var Tinv = a.dH * 1000 / a.dS;
        if(Tinv > 0){
          out.T_inversione_K = +Tinv.toFixed(2);
          out.nota_inversione = (a.dH > 0 && a.dS > 0) ? 'spontanea sopra ' + Tinv.toFixed(1) + ' K'
                             : (a.dH < 0 && a.dS < 0) ? 'spontanea sotto ' + Tinv.toFixed(1) + ' K'
                             : 'segno di ΔG indipendente da T in questo caso';
        } else {
          out.nota_inversione = (a.dH < 0 && a.dS > 0) ? 'spontanea a ogni temperatura'
                                                       : 'non spontanea a ogni temperatura';
        }
      }
      // van 't Hoff: K a una seconda temperatura
      if(a.T2 !== undefined && a.dH !== undefined && out.K_equilibrio !== undefined){
        var K1 = Number(out.K_equilibrio);
        var lnRatio = -(a.dH * 1000 / R) * (1 / a.T2 - 1 / T);
        var K2 = K1 * Math.exp(lnRatio);
        out.vant_Hoff = { T2_K: a.T2, K2: (K2 < 1e-4 || K2 > 1e4) ? K2.toExponential(4) : +K2.toPrecision(6),
                          formula: 'ln(K2/K1) = −ΔH/R · (1/T2 − 1/T1)' };
      }
      if(Object.keys(out).length <= 2) return { ok:false, error:'servono almeno ΔH e ΔS, oppure ΔG, oppure K' };
      return out;
    }
  },
  {
    name: 'equilibrio_acido_base',
    description: "Calcola pH, pOH e concentrazioni all'equilibrio per acidi/basi forti e deboli e per soluzioni tampone. Per gli acidi deboli risolve l'equazione di secondo grado esatta, non l'approssimazione.",
    parameters: {
      type: 'object',
      properties: {
        tipo: { type: 'string', description: '"acido_forte", "base_forte", "acido_debole", "base_debole", "tampone".' },
        concentrazione: { type: 'number', description: 'Concentrazione analitica in mol/L.' },
        Ka: { type: 'number', description: 'Costante di dissociazione acida (per acido debole o tampone).' },
        Kb: { type: 'number', description: 'Costante di dissociazione basica (per base debole).' },
        pKa: { type: 'number', description: 'In alternativa a Ka.' },
        c_acido: { type: 'number', description: 'Tampone: concentrazione della forma acida.' },
        c_base: { type: 'number', description: 'Tampone: concentrazione della base coniugata.' }
      },
      required: ['tipo']
    },
    execute: function(a){
      a = a || {};
      var Kw = 1e-14, t = String(a.tipo || '').toLowerCase();
      var Ka = a.Ka !== undefined ? a.Ka : (a.pKa !== undefined ? Math.pow(10, -a.pKa) : undefined);
      var C = a.concentrazione, H = null, out = { ok:true, tipo:t };
      if(t === 'acido_forte'){
        if(C === undefined) return { ok:false, error:'serve la concentrazione' };
        H = C; out.metodo = 'dissociazione completa: [H⁺] = C';
      } else if(t === 'base_forte'){
        if(C === undefined) return { ok:false, error:'serve la concentrazione' };
        H = Kw / C; out.OH = C; out.metodo = 'dissociazione completa: [OH⁻] = C';
      } else if(t === 'acido_debole'){
        if(C === undefined || Ka === undefined) return { ok:false, error:'servono concentrazione e Ka (o pKa)' };
        // x² + Ka·x − Ka·C = 0 risolta esattamente
        H = (-Ka + Math.sqrt(Ka * Ka + 4 * Ka * C)) / 2;
        out.metodo = 'ICE esatta: x² + Ka·x − Ka·C = 0';
        out.approssimazione_semplificata = +Math.sqrt(Ka * C).toExponential(4);
        out.grado_dissociazione_percento = +(100 * H / C).toPrecision(4);
        out.approssimazione_valida = (H / C) < 0.05;
      } else if(t === 'base_debole'){
        var Kb = a.Kb !== undefined ? a.Kb : (Ka !== undefined ? Kw / Ka : undefined);
        if(C === undefined || Kb === undefined) return { ok:false, error:'servono concentrazione e Kb (o Ka)' };
        var OH = (-Kb + Math.sqrt(Kb * Kb + 4 * Kb * C)) / 2;
        H = Kw / OH; out.OH = +OH.toExponential(4); out.Kb = Kb;
        out.metodo = 'ICE esatta sulla base: x² + Kb·x − Kb·C = 0';
      } else if(t === 'tampone'){
        if(Ka === undefined || a.c_acido === undefined || a.c_base === undefined)
          return { ok:false, error:'servono Ka (o pKa), c_acido e c_base' };
        H = Ka * a.c_acido / a.c_base;
        out.metodo = 'Henderson–Hasselbalch: pH = pKa + log([base]/[acido])';
        out.rapporto_base_acido = +(a.c_base / a.c_acido).toPrecision(6);
      } else {
        return { ok:false, error:'tipo non riconosciuto', tipi:['acido_forte','base_forte','acido_debole','base_debole','tampone'] };
      }
      out.H_molL = +H.toExponential(4);
      out.pH = +(-Math.log10(H)).toFixed(3);
      out.pOH = +(14 + Math.log10(H)).toFixed(3);
      if(out.OH === undefined) out.OH = +(Kw / H).toExponential(4);
      if(Ka !== undefined){ out.Ka = Ka; out.pKa = +(-Math.log10(Ka)).toFixed(3); }
      out.carattere = out.pH < 7 ? 'acida' : out.pH > 7 ? 'basica' : 'neutra';
      return out;
    }
  },
  {
    name: 'cinetica',
    description: "Cinetica chimica: ordine 0, 1 e 2 (concentrazione nel tempo, tempo di dimezzamento), equazione di Arrhenius (k da Ea e T, oppure Ea da due k), e fattore di accelerazione fra due temperature.",
    parameters: {
      type: 'object',
      properties: {
        ordine: { type: 'number', description: 'Ordine di reazione: 0, 1 oppure 2.' },
        k: { type: 'number', description: 'Costante cinetica.' },
        C0: { type: 'number', description: 'Concentrazione iniziale.' },
        t: { type: 'number', description: 'Tempo trascorso.' },
        Ea: { type: 'number', description: 'Energia di attivazione in kJ/mol (per Arrhenius).' },
        A: { type: 'number', description: 'Fattore pre-esponenziale.' },
        T: { type: 'number', description: 'Temperatura in K.' },
        T2: { type: 'number', description: 'Seconda temperatura in K.' },
        k2: { type: 'number', description: 'Costante alla seconda temperatura (per ricavare Ea).' }
      }
    },
    execute: function(a){
      a = a || {}; var R = 8.314462618, out = { ok:true };
      if(a.ordine !== undefined && a.k !== undefined && a.C0 !== undefined){
        var n = a.ordine, k = a.k, C0 = a.C0, t = a.t;
        out.ordine = n;
        out.tempo_dimezzamento = n === 0 ? C0 / (2 * k) : n === 1 ? Math.LN2 / k : n === 2 ? 1 / (k * C0) : null;
        out.legge_integrata = n === 0 ? '[A] = [A]₀ − kt' : n === 1 ? 'ln[A] = ln[A]₀ − kt' : '1/[A] = 1/[A]₀ + kt';
        if(t !== undefined){
          var C = n === 0 ? Math.max(0, C0 - k * t) : n === 1 ? C0 * Math.exp(-k * t) : C0 / (1 + k * C0 * t);
          out.concentrazione_a_t = +C.toPrecision(6);
          out.frazione_residua = +(C / C0).toPrecision(6);
          out.conversione_percento = +(100 * (1 - C / C0)).toPrecision(4);
        }
        if(out.tempo_dimezzamento !== null) out.tempo_dimezzamento = +out.tempo_dimezzamento.toPrecision(6);
      }
      // Arrhenius
      if(a.Ea !== undefined && a.T !== undefined && a.A !== undefined){
        out.arrhenius_k = +(a.A * Math.exp(-a.Ea * 1000 / (R * a.T))).toExponential(6);
        out.formula = 'k = A·exp(−Ea/RT)';
      }
      if(a.k !== undefined && a.k2 !== undefined && a.T !== undefined && a.T2 !== undefined){
        var Ea = R * Math.log(a.k2 / a.k) / (1 / a.T - 1 / a.T2) / 1000;
        out.Ea_kJ_mol = +Ea.toFixed(3);
        out.formula_Ea = 'ln(k2/k1) = −Ea/R · (1/T2 − 1/T1)';
      }
      if(a.Ea !== undefined && a.T !== undefined && a.T2 !== undefined && a.k2 === undefined){
        var rap = Math.exp(-a.Ea * 1000 / R * (1 / a.T2 - 1 / a.T));
        out.rapporto_k2_su_k1 = +rap.toPrecision(6);
        out.nota = 'passando da ' + a.T + ' K a ' + a.T2 + ' K la reazione va ' + rap.toPrecision(4) + '× ' + (rap > 1 ? 'piu\' veloce' : 'piu\' lenta');
      }
      if(Object.keys(out).length === 1) return { ok:false, error:'dati insufficienti: servono (ordine, k, C0) oppure parametri di Arrhenius' };
      return out;
    }
  },
  {
    name: 'gas_e_soluzioni',
    description: "Gas ideali (PV = nRT), gas reali di van der Waals, e proprieta' colligative (innalzamento ebullioscopico, abbassamento crioscopico, pressione osmotica, diluizione).",
    parameters: {
      type: 'object',
      properties: {
        calcolo: { type: 'string', description: '"ideale", "vanderwaals", "colligative", "diluizione".' },
        P: { type: 'number', description: 'Pressione in atm.' },
        V: { type: 'number', description: 'Volume in L.' },
        n: { type: 'number', description: 'Moli.' },
        T: { type: 'number', description: 'Temperatura in K.' },
        a: { type: 'number', description: 'van der Waals a (L²·atm/mol²).' },
        b: { type: 'number', description: 'van der Waals b (L/mol).' },
        molalita: { type: 'number', description: 'Colligative: molalita\' (mol/kg).' },
        i: { type: 'number', description: 'Colligative: fattore di van \'t Hoff (default 1).' },
        Kb_eb: { type: 'number', description: 'Costante ebullioscopica (acqua: 0.512).' },
        Kf_cr: { type: 'number', description: 'Costante crioscopica (acqua: 1.86).' },
        M1: { type: 'number', description: 'Diluizione: concentrazione iniziale.' },
        V1: { type: 'number', description: 'Diluizione: volume iniziale.' },
        M2: { type: 'number', description: 'Diluizione: concentrazione finale.' },
        V2: { type: 'number', description: 'Diluizione: volume finale.' }
      },
      required: ['calcolo']
    },
    execute: function(a){
      a = a || {}; var Ratm = 0.082057366, c = String(a.calcolo || '').toLowerCase();
      if(c === 'ideale'){
        var known = ['P','V','n','T'].filter(function(k){ return a[k] !== undefined; });
        if(known.length !== 3) return { ok:false, error:'per PV=nRT servono esattamente 3 valori fra P, V, n, T (ne hai ' + known.length + ')' };
        var r = { ok:true, legge:'PV = nRT', R:'0.082057 L·atm/(mol·K)' };
        if(a.P === undefined) r.P_atm = +(a.n * Ratm * a.T / a.V).toPrecision(6);
        else if(a.V === undefined) r.V_L = +(a.n * Ratm * a.T / a.P).toPrecision(6);
        else if(a.n === undefined) r.n_mol = +(a.P * a.V / (Ratm * a.T)).toPrecision(6);
        else r.T_K = +(a.P * a.V / (a.n * Ratm)).toPrecision(6);
        return r;
      }
      if(c === 'vanderwaals'){
        if(a.n === undefined || a.V === undefined || a.T === undefined || a.a === undefined || a.b === undefined)
          return { ok:false, error:'servono n, V, T, a, b' };
        var Pvdw = a.n * Ratm * a.T / (a.V - a.n * a.b) - a.a * a.n * a.n / (a.V * a.V);
        var Pid = a.n * Ratm * a.T / a.V;
        return { ok:true, legge:'(P + an²/V²)(V − nb) = nRT',
                 P_vanderwaals_atm:+Pvdw.toPrecision(6), P_ideale_atm:+Pid.toPrecision(6),
                 scostamento_percento:+(100 * (Pvdw - Pid) / Pid).toPrecision(4),
                 nota: Pvdw < Pid ? 'le attrazioni intermolecolari abbassano la pressione' : 'il volume escluso alza la pressione' };
      }
      if(c === 'colligative'){
        if(a.molalita === undefined) return { ok:false, error:'serve la molalita\'' };
        var i = a.i !== undefined ? a.i : 1, m = a.molalita, o = { ok:true, molalita:m, fattore_vant_Hoff:i };
        if(a.Kb_eb !== undefined) o.innalzamento_ebullioscopico_C = +(i * a.Kb_eb * m).toPrecision(6);
        if(a.Kf_cr !== undefined) o.abbassamento_crioscopico_C = +(i * a.Kf_cr * m).toPrecision(6);
        if(a.T !== undefined) o.pressione_osmotica_atm = +(i * m * Ratm * a.T).toPrecision(6);
        o.formule = 'ΔTeb = i·Kb·m ; ΔTcr = i·Kf·m ; π = i·M·R·T';
        return o;
      }
      if(c === 'diluizione'){
        var v = ['M1','V1','M2','V2'].filter(function(k){ return a[k] !== undefined; });
        if(v.length !== 3) return { ok:false, error:'per M1V1 = M2V2 servono esattamente 3 valori' };
        var res = { ok:true, legge:'M₁V₁ = M₂V₂' };
        if(a.M1 === undefined) res.M1 = +(a.M2 * a.V2 / a.V1).toPrecision(6);
        else if(a.V1 === undefined) res.V1 = +(a.M2 * a.V2 / a.M1).toPrecision(6);
        else if(a.M2 === undefined) res.M2 = +(a.M1 * a.V1 / a.V2).toPrecision(6);
        else res.V2 = +(a.M1 * a.V1 / a.M2).toPrecision(6);
        return res;
      }
      return { ok:false, error:'calcolo non riconosciuto', disponibili:['ideale','vanderwaals','colligative','diluizione'] };
    }
  },
  {
    name: 'quantistica_e_spettroscopia',
    description: "Meccanica quantistica e spettroscopia: energia del fotone da lunghezza d'onda (e viceversa), lunghezza d'onda di de Broglie, particella nella scatola, atomo di idrogeno (Rydberg/Bohr), e legge di Lambert–Beer.",
    parameters: {
      type: 'object',
      properties: {
        calcolo: { type: 'string', description: '"fotone", "debroglie", "particella_scatola", "idrogeno", "beer_lambert".' },
        lambda_nm: { type: 'number', description: 'Lunghezza d\'onda in nm.' },
        energia_J: { type: 'number', description: 'Energia in J.' },
        massa_kg: { type: 'number', description: 'Massa in kg (de Broglie).' },
        velocita: { type: 'number', description: 'Velocita\' in m/s (de Broglie).' },
        n: { type: 'number', description: 'Numero quantico (scatola) o livello iniziale (idrogeno).' },
        n2: { type: 'number', description: 'Livello finale per la transizione dell\'idrogeno.' },
        L_nm: { type: 'number', description: 'Larghezza della buca in nm.' },
        A: { type: 'number', description: 'Assorbanza.' },
        epsilon: { type: 'number', description: 'Coefficiente di estinzione molare (L/(mol·cm)).' },
        cammino_cm: { type: 'number', description: 'Cammino ottico in cm (default 1).' },
        concentrazione: { type: 'number', description: 'Concentrazione in mol/L.' }
      },
      required: ['calcolo']
    },
    execute: function(a){
      a = a || {};
      var h = 6.62607015e-34, c = 299792458, me = 9.1093837015e-31, NA = 6.02214076e23;
      var t = String(a.calcolo || '').toLowerCase();
      if(t === 'fotone'){
        var E, lam;
        if(a.lambda_nm !== undefined){ lam = a.lambda_nm * 1e-9; E = h * c / lam; }
        else if(a.energia_J !== undefined){ E = a.energia_J; lam = h * c / E; }
        else return { ok:false, error:'serve lambda_nm oppure energia_J' };
        return { ok:true, lambda_nm:+(lam * 1e9).toPrecision(6), energia_J:+E.toExponential(6),
                 energia_eV:+(E / 1.602176634e-19).toPrecision(6),
                 energia_kJ_mol:+(E * NA / 1000).toPrecision(6),
                 frequenza_Hz:+(c / lam).toExponential(6),
                 numero_onda_cm1:+(1 / (lam * 100)).toPrecision(6),
                 formula:'E = hc/λ' };
      }
      if(t === 'debroglie'){
        var m = a.massa_kg !== undefined ? a.massa_kg : me;
        if(a.velocita === undefined) return { ok:false, error:'serve la velocita\'' };
        var l = h / (m * a.velocita);
        return { ok:true, lambda_m:+l.toExponential(6), lambda_nm:+(l * 1e9).toPrecision(6),
                 massa_kg:m, velocita_m_s:a.velocita, formula:'λ = h/(mv)' };
      }
      if(t === 'particella_scatola'){
        if(a.L_nm === undefined) return { ok:false, error:'serve L_nm' };
        var n = a.n || 1, L = a.L_nm * 1e-9, mm = a.massa_kg !== undefined ? a.massa_kg : me;
        var En = n * n * h * h / (8 * mm * L * L);
        var E1 = h * h / (8 * mm * L * L);
        return { ok:true, n:n, L_nm:a.L_nm, E_J:+En.toExponential(6), E_eV:+(En / 1.602176634e-19).toPrecision(6),
                 E_livello_fondamentale_eV:+(E1 / 1.602176634e-19).toPrecision(6),
                 salto_n_a_n1_eV:+(((n + 1) * (n + 1) - n * n) * E1 / 1.602176634e-19).toPrecision(6),
                 formula:'Eₙ = n²h²/(8mL²)' };
      }
      if(t === 'idrogeno'){
        if(a.n === undefined || a.n2 === undefined) return { ok:false, error:'servono n (iniziale) e n2 (finale)' };
        var Eev = -13.605693 * (1 / (a.n2 * a.n2) - 1 / (a.n * a.n));
        var dE = Math.abs(Eev) * 1.602176634e-19;
        var lamH = h * c / dE;
        var serie = { 1:'Lyman (UV)', 2:'Balmer (visibile)', 3:'Paschen (IR)', 4:'Brackett (IR)', 5:'Pfund (IR)' };
        return { ok:true, transizione:'n=' + a.n + ' → n=' + a.n2,
                 E_livello_n_eV:+(-13.605693 / (a.n * a.n)).toPrecision(6),
                 E_livello_n2_eV:+(-13.605693 / (a.n2 * a.n2)).toPrecision(6),
                 delta_E_eV:+Eev.toPrecision(6),
                 lambda_nm:+(lamH * 1e9).toPrecision(6),
                 tipo: a.n > a.n2 ? 'emissione' : 'assorbimento',
                 serie: serie[Math.min(a.n, a.n2)] || null,
                 formula:'Eₙ = −13.6 eV/n²' };
      }
      if(t === 'beer_lambert'){
        var l2 = a.cammino_cm !== undefined ? a.cammino_cm : 1;
        var known = ['A','epsilon','concentrazione'].filter(function(k){ return a[k] !== undefined; });
        if(known.length < 2) return { ok:false, error:'servono almeno 2 fra A, epsilon e concentrazione' };
        var o2 = { ok:true, legge:'A = ε·l·c', cammino_cm:l2 };
        if(a.A === undefined) o2.assorbanza = +(a.epsilon * l2 * a.concentrazione).toPrecision(6);
        else if(a.concentrazione === undefined) o2.concentrazione_molL = +(a.A / (a.epsilon * l2)).toExponential(6);
        else o2.epsilon = +(a.A / (l2 * a.concentrazione)).toPrecision(6);
        var Aval = a.A !== undefined ? a.A : o2.assorbanza;
        o2.trasmittanza_percento = +(100 * Math.pow(10, -Aval)).toPrecision(4);
        return o2;
      }
      return { ok:false, error:'calcolo non riconosciuto', disponibili:['fotone','debroglie','particella_scatola','idrogeno','beer_lambert'] };
    }
  },
  {
    name: 'elettrochimica',
    description: "Elettrochimica: potenziale di cella, equazione di Nernst a condizioni non standard, relazione ΔG° = −nFE°, costante di equilibrio da E°, e legge di Faraday per l'elettrolisi.",
    parameters: {
      type: 'object',
      properties: {
        E0: { type: 'number', description: 'Potenziale standard di cella in V.' },
        n: { type: 'number', description: 'Numero di elettroni scambiati.' },
        Q: { type: 'number', description: 'Quoziente di reazione (per Nernst).' },
        T: { type: 'number', description: 'Temperatura in K (default 298.15).' },
        corrente_A: { type: 'number', description: 'Corrente in ampere (Faraday).' },
        tempo_s: { type: 'number', description: 'Tempo in secondi (Faraday).' },
        massa_molare: { type: 'number', description: 'Massa molare della specie depositata (g/mol).' }
      }
    },
    execute: function(a){
      a = a || {};
      var R = 8.314462618, F = 96485.332, T = a.T !== undefined ? a.T : 298.15, out = { ok:true, T_K:T };
      if(a.E0 !== undefined && a.n !== undefined){
        out.E0_V = a.E0; out.n_elettroni = a.n;
        out.dG0_kJ_mol = +(-a.n * F * a.E0 / 1000).toFixed(3);
        out.spontanea = a.E0 > 0;
        var K = Math.exp(a.n * F * a.E0 / (R * T));
        out.K_equilibrio = (K < 1e-4 || K > 1e4) ? K.toExponential(4) : +K.toPrecision(6);
        out.formule = 'ΔG° = −nFE° ; lnK = nFE°/RT';
        if(a.Q !== undefined){
          out.E_nernst_V = +(a.E0 - (R * T / (a.n * F)) * Math.log(a.Q)).toFixed(5);
          out.Q = a.Q;
          out.formula_nernst = 'E = E° − (RT/nF)·lnQ';
        }
      }
      if(a.corrente_A !== undefined && a.tempo_s !== undefined && a.n !== undefined){
        var q = a.corrente_A * a.tempo_s, mol = q / (a.n * F);
        out.faraday = { carica_C:+q.toPrecision(6), moli_depositate:+mol.toExponential(6) };
        if(a.massa_molare !== undefined) out.faraday.massa_g = +(mol * a.massa_molare).toPrecision(6);
        out.faraday.formula = 'm = (I·t·M)/(n·F)';
      }
      if(Object.keys(out).length <= 2) return { ok:false, error:'servono E0 e n, oppure corrente, tempo e n' };
      return out;
    }
  },
  {
    name: 'astrofisica',
    description: "Astrofisica e astrochimica quantitativa, a supporto della sezione Astrochimica 3D: legge di Wien, Stefan-Boltzmann, luminosita' stellare, redshift e velocita' radiale, velocita' di fuga, legge di Hubble, terza legge di Keplero e zona abitabile.",
    parameters: {
      type: 'object',
      properties: {
        calcolo: { type: 'string', description: '"wien", "stefan_boltzmann", "luminosita", "redshift", "fuga", "hubble", "keplero", "zona_abitabile".' },
        T_K: { type: 'number', description: 'Temperatura in kelvin.' },
        lambda_max_nm: { type: 'number', description: 'Picco di emissione in nm.' },
        raggio_m: { type: 'number', description: 'Raggio in metri (o raggi solari se raggio_solari).' },
        raggio_solari: { type: 'number', description: 'Raggio in raggi solari.' },
        massa_kg: { type: 'number', description: 'Massa in kg.' },
        massa_solari: { type: 'number', description: 'Massa in masse solari.' },
        lambda_osservata: { type: 'number', description: 'Lunghezza d\'onda osservata.' },
        lambda_riposo: { type: 'number', description: 'Lunghezza d\'onda a riposo.' },
        distanza_Mpc: { type: 'number', description: 'Distanza in megaparsec (Hubble).' },
        semiasse_UA: { type: 'number', description: 'Semiasse maggiore in unita\' astronomiche.' },
        luminosita_solari: { type: 'number', description: 'Luminosita\' in luminosita\' solari.' }
      },
      required: ['calcolo']
    },
    execute: function(a){
      a = a || {};
      var c = 299792458, sigma = 5.670374419e-8, G = 6.67430e-11, b = 2.897771955e-3;
      var Msun = 1.98892e30, Rsun = 6.957e8, Lsun = 3.828e26, H0 = 70;
      var t = String(a.calcolo || '').toLowerCase();
      if(t === 'wien'){
        if(a.T_K !== undefined){
          var lam = b / a.T_K;
          return { ok:true, T_K:a.T_K, lambda_max_nm:+(lam * 1e9).toPrecision(6),
                   formula:'λmax·T = 2.898×10⁻³ m·K',
                   regione: lam * 1e9 < 400 ? 'ultravioletto' : lam * 1e9 > 700 ? 'infrarosso' : 'visibile',
                   colore_apparente: a.T_K > 10000 ? 'blu' : a.T_K > 7500 ? 'bianco-azzurro' : a.T_K > 6000 ? 'bianco' : a.T_K > 5000 ? 'giallo' : a.T_K > 3500 ? 'arancione' : 'rosso' };
        }
        if(a.lambda_max_nm !== undefined)
          return { ok:true, lambda_max_nm:a.lambda_max_nm, T_K:+(b / (a.lambda_max_nm * 1e-9)).toPrecision(6), formula:'T = 2.898×10⁻³/λmax' };
        return { ok:false, error:'serve T_K oppure lambda_max_nm' };
      }
      if(t === 'stefan_boltzmann'){
        if(a.T_K === undefined) return { ok:false, error:'serve T_K' };
        return { ok:true, T_K:a.T_K, flusso_W_m2:+(sigma * Math.pow(a.T_K, 4)).toExponential(6),
                 formula:'j = σT⁴, σ = 5.670×10⁻⁸ W/(m²·K⁴)' };
      }
      if(t === 'luminosita'){
        var R = a.raggio_m !== undefined ? a.raggio_m : (a.raggio_solari !== undefined ? a.raggio_solari * Rsun : undefined);
        if(R === undefined || a.T_K === undefined) return { ok:false, error:'servono T_K e raggio (in metri o solari)' };
        var L = 4 * Math.PI * R * R * sigma * Math.pow(a.T_K, 4);
        return { ok:true, T_K:a.T_K, raggio_m:+R.toExponential(4), raggio_solari:+(R / Rsun).toPrecision(5),
                 luminosita_W:+L.toExponential(6), luminosita_solari:+(L / Lsun).toPrecision(6),
                 formula:'L = 4πR²σT⁴' };
      }
      if(t === 'redshift'){
        if(a.lambda_osservata === undefined || a.lambda_riposo === undefined)
          return { ok:false, error:'servono lambda_osservata e lambda_riposo' };
        var z = (a.lambda_osservata - a.lambda_riposo) / a.lambda_riposo;
        var vNR = z * c;
        // per z non piccoli serve la formula relativistica
        var vRel = c * ((Math.pow(1 + z, 2) - 1) / (Math.pow(1 + z, 2) + 1));
        return { ok:true, z:+z.toPrecision(6),
                 tipo: z > 0 ? 'redshift: la sorgente si allontana' : 'blueshift: la sorgente si avvicina',
                 velocita_classica_km_s:+(vNR / 1000).toPrecision(6),
                 velocita_relativistica_km_s:+(vRel / 1000).toPrecision(6),
                 distanza_stimata_Mpc:z > 0 ? +(z * c / 1000 / H0).toPrecision(5) : null,
                 nota: Math.abs(z) > 0.1 ? 'z elevato: usa il valore relativistico' : 'z piccolo: le due formule coincidono',
                 formule:'z = Δλ/λ₀ ; v ≈ cz (piccoli z) ; d = v/H₀ con H₀ = 70 km/s/Mpc' };
      }
      if(t === 'fuga'){
        var M = a.massa_kg !== undefined ? a.massa_kg : (a.massa_solari !== undefined ? a.massa_solari * Msun : undefined);
        var Rf = a.raggio_m !== undefined ? a.raggio_m : (a.raggio_solari !== undefined ? a.raggio_solari * Rsun : undefined);
        if(M === undefined || Rf === undefined) return { ok:false, error:'servono massa e raggio' };
        var v = Math.sqrt(2 * G * M / Rf);
        var rs = 2 * G * M / (c * c);
        return { ok:true, velocita_fuga_km_s:+(v / 1000).toPrecision(6),
                 frazione_di_c:+(v / c).toPrecision(5),
                 raggio_Schwarzschild_km:+(rs / 1000).toPrecision(6),
                 buco_nero: Rf <= rs,
                 formula:'v = √(2GM/R) ; rs = 2GM/c²' };
      }
      if(t === 'hubble'){
        if(a.distanza_Mpc === undefined) return { ok:false, error:'serve distanza_Mpc' };
        return { ok:true, distanza_Mpc:a.distanza_Mpc, H0_km_s_Mpc:H0,
                 velocita_recessione_km_s:+(H0 * a.distanza_Mpc).toPrecision(6),
                 z_stimato:+(H0 * a.distanza_Mpc * 1000 / c).toPrecision(5),
                 formula:'v = H₀·d' };
      }
      if(t === 'keplero'){
        if(a.semiasse_UA === undefined) return { ok:false, error:'serve semiasse_UA' };
        var Ms = a.massa_solari !== undefined ? a.massa_solari : 1;
        var P = Math.sqrt(Math.pow(a.semiasse_UA, 3) / Ms);
        return { ok:true, semiasse_UA:a.semiasse_UA, massa_stella_solari:Ms,
                 periodo_anni:+P.toPrecision(6), periodo_giorni:+(P * 365.25).toPrecision(6),
                 formula:'P² = a³/M (P in anni, a in UA, M in masse solari)' };
      }
      if(t === 'zona_abitabile'){
        var L2 = a.luminosita_solari !== undefined ? a.luminosita_solari : 1;
        return { ok:true, luminosita_solari:L2,
                 bordo_interno_UA:+(0.95 * Math.sqrt(L2)).toPrecision(5),
                 bordo_esterno_UA:+(1.67 * Math.sqrt(L2)).toPrecision(5),
                 centro_UA:+(Math.sqrt(L2)).toPrecision(5),
                 formula:'d = √(L/L☉) scalato sui bordi conservativi (Kopparapu)',
                 nota:'intervallo in cui l\'acqua puo\' restare liquida in superficie' };
      }
      return { ok:false, error:'calcolo non riconosciuto',
               disponibili:['wien','stefan_boltzmann','luminosita','redshift','fuga','hubble','keplero','zona_abitabile'] };
    }
  },
  {
    name: 'nucleare',
    description: "Chimica nucleare e radioattivita': decadimento, attivita', datazione radiometrica (carbonio-14 e altri), difetto di massa ed energia di legame, dose residua.",
    parameters: {
      type: 'object',
      properties: {
        calcolo: { type: 'string', description: '"decadimento", "datazione", "energia_legame".' },
        t_mezza: { type: 'number', description: 'Tempo di dimezzamento (nella stessa unita\' del tempo).' },
        N0: { type: 'number', description: 'Quantita\' o attivita\' iniziale.' },
        N: { type: 'number', description: 'Quantita\' o attivita\' residua.' },
        tempo: { type: 'number', description: 'Tempo trascorso.' },
        massa_atomica: { type: 'number', description: 'Massa atomica misurata in u.' },
        Z: { type: 'number', description: 'Numero di protoni.' },
        Nn: { type: 'number', description: 'Numero di neutroni.' }
      },
      required: ['calcolo']
    },
    execute: function(a){
      a = a || {}; var c = String(a.calcolo || '').toLowerCase();
      if(c === 'decadimento'){
        if(a.t_mezza === undefined) return { ok:false, error:'serve t_mezza' };
        var lam = Math.LN2 / a.t_mezza, out = { ok:true, t_mezza:a.t_mezza,
          costante_decadimento:+lam.toPrecision(6), vita_media:+(1 / lam).toPrecision(6),
          formule:'N = N₀·e^(−λt), λ = ln2/t½, A = λN' };
        if(a.N0 !== undefined && a.tempo !== undefined){
          out.N_residuo = +(a.N0 * Math.exp(-lam * a.tempo)).toPrecision(6);
          out.frazione_residua = +Math.pow(0.5, a.tempo / a.t_mezza).toPrecision(6);
          out.percento_decaduto = +(100 * (1 - Math.pow(0.5, a.tempo / a.t_mezza))).toPrecision(5);
          out.emivite_trascorse = +(a.tempo / a.t_mezza).toPrecision(5);
        }
        return out;
      }
      if(c === 'datazione'){
        var th = a.t_mezza !== undefined ? a.t_mezza : 5730;   // C-14
        if(a.N0 === undefined || a.N === undefined) return { ok:false, error:'servono N0 e N (attivita\' o quantita\')' };
        if(a.N <= 0 || a.N0 <= 0) return { ok:false, error:'i valori devono essere positivi' };
        var eta = (th / Math.LN2) * Math.log(a.N0 / a.N);
        return { ok:true, t_mezza_usata:th, rapporto_N_su_N0:+(a.N / a.N0).toPrecision(6),
                 eta:+eta.toPrecision(6), unita:'stesse unita\' del tempo di dimezzamento',
                 emivite_trascorse:+(eta / th).toPrecision(4),
                 formula:'t = (t½/ln2)·ln(N₀/N)',
                 nota: th === 5730 ? 'usato il ¹⁴C (t½ = 5730 anni): affidabile fino a circa 50.000 anni' : undefined };
      }
      if(c === 'energia_legame'){
        if(a.massa_atomica === undefined || a.Z === undefined || a.Nn === undefined)
          return { ok:false, error:'servono massa_atomica (u), Z e Nn' };
        var mp = 1.00727646688, mn = 1.00866491595, me = 0.000548579909;
        var attesa = a.Z * (mp + me) + a.Nn * mn;
        var difetto = attesa - a.massa_atomica;
        var E = difetto * 931.494;                       // MeV per u
        var A = a.Z + a.Nn;
        return { ok:true, A:A, Z:a.Z, N:a.Nn,
                 massa_attesa_u:+attesa.toFixed(6), massa_misurata_u:a.massa_atomica,
                 difetto_di_massa_u:+difetto.toFixed(6),
                 energia_legame_MeV:+E.toFixed(4),
                 energia_per_nucleone_MeV:+(E / A).toFixed(4),
                 formula:'E = Δm·931.494 MeV/u',
                 nota:'il massimo di energia per nucleone e\' intorno al ⁵⁶Fe (circa 8.8 MeV)' };
      }
      return { ok:false, error:'calcolo non riconosciuto', disponibili:['decadimento','datazione','energia_legame'] };
    }
  },
  {
    name: 'statistica_inferenziale',
    description: "Statistica inferenziale con p-value esatti: test t di Student (a campioni indipendenti con correzione di Welch, o appaiati), test chi-quadro, e intervalli di confidenza. Usalo per dire se una differenza sperimentale e' significativa.",
    parameters: {
      type: 'object',
      properties: {
        test: { type: 'string', description: '"t_indipendenti", "t_appaiati", "chi_quadro", "intervallo_confidenza".' },
        gruppo1: { type: 'array', items: { type: 'number' }, description: 'Primo campione.' },
        gruppo2: { type: 'array', items: { type: 'number' }, description: 'Secondo campione.' },
        osservati: { type: 'array', items: { type: 'number' }, description: 'Frequenze osservate (chi-quadro).' },
        attesi: { type: 'array', items: { type: 'number' }, description: 'Frequenze attese (chi-quadro).' },
        confidenza: { type: 'number', description: 'Livello di confidenza (default 0.95).' }
      },
      required: ['test']
    },
    execute: function(a){
      a = a || {};
      function gammaln(x){
        var g = [76.18009172947146,-86.50532032941677,24.01409824083091,-1.231739572450155,0.1208650973866179e-2,-0.5395239384953e-5];
        var y = x, tmp = x + 5.5;
        tmp -= (x + 0.5) * Math.log(tmp);
        var ser = 1.000000000190015;
        for(var j = 0; j < 6; j++) ser += g[j] / ++y;
        return -tmp + Math.log(2.5066282746310005 * ser / x);
      }
      function betacf(p, q, x){
        var MAX = 300, EPS = 3e-12, FPMIN = 1e-300;
        var qab = p + q, qap = p + 1, qam = p - 1, cc = 1, d = 1 - qab * x / qap;
        if(Math.abs(d) < FPMIN) d = FPMIN;
        d = 1 / d; var h = d;
        for(var m = 1; m <= MAX; m++){
          var m2 = 2 * m;
          var aa = m * (q - m) * x / ((qam + m2) * (p + m2));
          d = 1 + aa * d; if(Math.abs(d) < FPMIN) d = FPMIN;
          cc = 1 + aa / cc; if(Math.abs(cc) < FPMIN) cc = FPMIN;
          d = 1 / d; h *= d * cc;
          aa = -(p + m) * (qab + m) * x / ((p + m2) * (qap + m2));
          d = 1 + aa * d; if(Math.abs(d) < FPMIN) d = FPMIN;
          cc = 1 + aa / cc; if(Math.abs(cc) < FPMIN) cc = FPMIN;
          d = 1 / d; var del = d * cc; h *= del;
          if(Math.abs(del - 1) < EPS) break;
        }
        return h;
      }
      function betai(p, q, x){   // beta incompleta regolarizzata
        if(x <= 0) return 0; if(x >= 1) return 1;
        var bt = Math.exp(gammaln(p + q) - gammaln(p) - gammaln(q) + p * Math.log(x) + q * Math.log(1 - x));
        return (x < (p + 1) / (p + q + 2)) ? bt * betacf(p, q, x) / p : 1 - bt * betacf(q, p, 1 - x) / q;
      }
      function pFromT(t, df){ return betai(df / 2, 0.5, df / (df + t * t)); }   // bilaterale
      function gammap(s, x){    // gamma incompleta regolarizzata inferiore
        if(x <= 0) return 0;
        if(x < s + 1){
          var ap = s, sum = 1 / s, del = sum;
          for(var n = 1; n < 500; n++){ ap++; del *= x / ap; sum += del; if(Math.abs(del) < Math.abs(sum) * 1e-14) break; }
          return sum * Math.exp(-x + s * Math.log(x) - gammaln(s));
        }
        var b = x + 1 - s, c2 = 1e300, d2 = 1 / b, h = d2;
        for(var i = 1; i < 500; i++){
          var an = -i * (i - s);
          b += 2; d2 = an * d2 + b; if(Math.abs(d2) < 1e-300) d2 = 1e-300;
          c2 = b + an / c2; if(Math.abs(c2) < 1e-300) c2 = 1e-300;
          d2 = 1 / d2; var de = d2 * c2; h *= de;
          if(Math.abs(de - 1) < 1e-14) break;
        }
        return 1 - Math.exp(-x + s * Math.log(x) - gammaln(s)) * h;
      }
      function stats(v){
        var n = v.length, m = v.reduce(function(p, q){ return p + q; }, 0) / n;
        var s2 = v.reduce(function(p, q){ return p + (q - m) * (q - m); }, 0) / (n - 1);
        return { n:n, media:m, var:s2, sd:Math.sqrt(s2) };
      }
      var test = String(a.test || '').toLowerCase();
      var giudizio = function(p){
        return p < 0.001 ? 'differenza altamente significativa (p < 0.001)'
             : p < 0.01 ? 'differenza molto significativa (p < 0.01)'
             : p < 0.05 ? 'differenza significativa (p < 0.05)'
             : 'differenza NON significativa (p ≥ 0.05): i dati non permettono di rifiutare l\'ipotesi nulla';
      };
      if(test === 't_indipendenti'){
        var g1 = (a.gruppo1 || []).map(Number), g2 = (a.gruppo2 || []).map(Number);
        if(g1.length < 2 || g2.length < 2) return { ok:false, error:'servono almeno 2 valori per gruppo' };
        var s1 = stats(g1), s2b = stats(g2);
        var se = Math.sqrt(s1.var / s1.n + s2b.var / s2b.n);
        if(se === 0) return { ok:false, error:'varianza nulla in entrambi i gruppi' };
        var t = (s1.media - s2b.media) / se;
        // gradi di liberta' di Welch-Satterthwaite
        var df = Math.pow(s1.var / s1.n + s2b.var / s2b.n, 2) /
                 (Math.pow(s1.var / s1.n, 2) / (s1.n - 1) + Math.pow(s2b.var / s2b.n, 2) / (s2b.n - 1));
        var p = pFromT(t, df);
        var sp = Math.sqrt(((s1.n - 1) * s1.var + (s2b.n - 1) * s2b.var) / (s1.n + s2b.n - 2));
        return { ok:true, test:'t di Welch (campioni indipendenti, varianze non assunte uguali)',
                 gruppo1:{ n:s1.n, media:+s1.media.toPrecision(6), sd:+s1.sd.toPrecision(6) },
                 gruppo2:{ n:s2b.n, media:+s2b.media.toPrecision(6), sd:+s2b.sd.toPrecision(6) },
                 differenza_medie:+(s1.media - s2b.media).toPrecision(6),
                 t:+t.toFixed(4), gradi_liberta:+df.toFixed(3), p_value:+p.toPrecision(5),
                 cohen_d: sp ? +((s1.media - s2b.media) / sp).toFixed(4) : null,
                 significativo: p < 0.05, giudizio: giudizio(p) };
      }
      if(test === 't_appaiati'){
        var p1 = (a.gruppo1 || []).map(Number), p2 = (a.gruppo2 || []).map(Number);
        if(p1.length !== p2.length || p1.length < 2) return { ok:false, error:'i due gruppi devono avere la stessa lunghezza (>= 2)' };
        var d = p1.map(function(v, i){ return v - p2[i]; }), sd = stats(d);
        if(sd.sd === 0) return { ok:false, error:'le differenze sono tutte identiche' };
        var tp = sd.media / (sd.sd / Math.sqrt(sd.n)), dfp = sd.n - 1, pp = pFromT(tp, dfp);
        return { ok:true, test:'t per campioni appaiati', n_coppie:sd.n,
                 differenza_media:+sd.media.toPrecision(6), sd_differenze:+sd.sd.toPrecision(6),
                 t:+tp.toFixed(4), gradi_liberta:dfp, p_value:+pp.toPrecision(5),
                 significativo: pp < 0.05, giudizio: giudizio(pp) };
      }
      if(test === 'chi_quadro'){
        var o = (a.osservati || []).map(Number), e = (a.attesi || []).map(Number);
        if(o.length < 2 || o.length !== e.length) return { ok:false, error:'osservati e attesi devono avere la stessa lunghezza (>= 2)' };
        if(e.some(function(v){ return v <= 0; })) return { ok:false, error:'le frequenze attese devono essere positive' };
        var x2 = 0;
        for(var i2 = 0; i2 < o.length; i2++) x2 += Math.pow(o[i2] - e[i2], 2) / e[i2];
        var dfc = o.length - 1, pc = 1 - gammap(dfc / 2, x2 / 2);
        return { ok:true, test:'chi-quadro di bonta\' di adattamento',
                 chi_quadro:+x2.toFixed(4), gradi_liberta:dfc, p_value:+pc.toPrecision(5),
                 significativo: pc < 0.05,
                 giudizio: pc < 0.05 ? 'gli osservati si discostano significativamente dagli attesi'
                                     : 'nessuno scostamento significativo dagli attesi',
                 avviso: e.some(function(v){ return v < 5; }) ? 'attenzione: alcune frequenze attese sono < 5, il test perde affidabilita\'' : undefined };
      }
      if(test === 'intervallo_confidenza'){
        var v2 = (a.gruppo1 || []).map(Number);
        if(v2.length < 2) return { ok:false, error:'servono almeno 2 valori in gruppo1' };
        var st = stats(v2), conf = a.confidenza !== undefined ? a.confidenza : 0.95;
        // t critico per bisezione sulla CDF
        var lo = 0, hi = 100, target = 1 - conf;
        for(var k = 0; k < 200; k++){ var mid = (lo + hi) / 2; if(pFromT(mid, st.n - 1) > target) lo = mid; else hi = mid; }
        var tc = (lo + hi) / 2, err = tc * st.sd / Math.sqrt(st.n);
        return { ok:true, n:st.n, media:+st.media.toPrecision(6), sd:+st.sd.toPrecision(6),
                 errore_standard:+(st.sd / Math.sqrt(st.n)).toPrecision(6),
                 confidenza:conf, t_critico:+tc.toFixed(4),
                 margine_errore:+err.toPrecision(6),
                 intervallo:[+(st.media - err).toPrecision(6), +(st.media + err).toPrecision(6)],
                 interpretazione:'con probabilita\' del ' + (conf * 100) + '% la media vera cade in questo intervallo' };
      }
      return { ok:false, error:'test non riconosciuto', disponibili:['t_indipendenti','t_appaiati','chi_quadro','intervallo_confidenza'] };
    }
  },
  {
    name: 'cristallografia',
    description: "Cristallografia e stato solido: legge di Bragg, densita' da cella elementare, fattore di impacchettamento, e relazione fra parametro di cella e raggio atomico per le celle cubiche.",
    parameters: {
      type: 'object',
      properties: {
        calcolo: { type: 'string', description: '"bragg", "densita_cella", "impacchettamento".' },
        lambda_pm: { type: 'number', description: 'Lunghezza d\'onda dei raggi X in pm (Cu Kα = 154.18).' },
        d_pm: { type: 'number', description: 'Distanza interplanare in pm.' },
        theta_gradi: { type: 'number', description: 'Angolo di Bragg in gradi.' },
        n: { type: 'number', description: 'Ordine di diffrazione (default 1).' },
        tipo_cella: { type: 'string', description: '"sc" (semplice), "bcc" (corpo centrato), "fcc" (facce centrate).' },
        a_pm: { type: 'number', description: 'Parametro di cella in pm.' },
        massa_molare: { type: 'number', description: 'Massa molare in g/mol.' }
      },
      required: ['calcolo']
    },
    execute: function(a){
      a = a || {}; var c = String(a.calcolo || '').toLowerCase(), NA = 6.02214076e23;
      var ATOMI = { sc:1, bcc:2, fcc:4 };
      if(c === 'bragg'){
        var n = a.n || 1;
        if(a.lambda_pm !== undefined && a.d_pm !== undefined){
          var sin = n * a.lambda_pm / (2 * a.d_pm);
          if(Math.abs(sin) > 1) return { ok:false, error:'nessuna riflessione possibile: sinθ = ' + sin.toFixed(3) + ' > 1' };
          return { ok:true, n:n, lambda_pm:a.lambda_pm, d_pm:a.d_pm,
                   theta_gradi:+(Math.asin(sin) * 180 / Math.PI).toFixed(4),
                   due_theta_gradi:+(2 * Math.asin(sin) * 180 / Math.PI).toFixed(4),
                   formula:'nλ = 2d·sinθ' };
        }
        if(a.lambda_pm !== undefined && a.theta_gradi !== undefined){
          var d = n * a.lambda_pm / (2 * Math.sin(a.theta_gradi * Math.PI / 180));
          return { ok:true, n:n, d_pm:+d.toFixed(3), formula:'d = nλ/(2·sinθ)' };
        }
        return { ok:false, error:'servono lambda_pm piu\' d_pm oppure theta_gradi' };
      }
      if(c === 'densita_cella'){
        var Z = ATOMI[String(a.tipo_cella || '').toLowerCase()];
        if(!Z || a.a_pm === undefined || a.massa_molare === undefined)
          return { ok:false, error:'servono tipo_cella (sc/bcc/fcc), a_pm e massa_molare' };
        var aCm = a.a_pm * 1e-10, V = Math.pow(aCm, 3);
        var rho = Z * a.massa_molare / (NA * V);
        return { ok:true, tipo_cella:a.tipo_cella, atomi_per_cella:Z,
                 a_pm:a.a_pm, volume_cella_cm3:+V.toExponential(5),
                 densita_g_cm3:+rho.toPrecision(6),
                 formula:'ρ = Z·M/(N_A·a³)' };
      }
      if(c === 'impacchettamento'){
        var tc = String(a.tipo_cella || '').toLowerCase();
        var dati = {
          sc:{ atomi:1, APF:0.5236, relazione:'a = 2r', numero_coordinazione:6 },
          bcc:{ atomi:2, APF:0.6802, relazione:'a = 4r/√3', numero_coordinazione:8 },
          fcc:{ atomi:4, APF:0.7405, relazione:'a = 4r/√2 = 2√2·r', numero_coordinazione:12 }
        };
        var dd = dati[tc];
        if(!dd) return { ok:false, error:'tipo_cella non riconosciuto', disponibili:Object.keys(dati) };
        var out = { ok:true, tipo_cella:tc, atomi_per_cella:dd.atomi,
                    fattore_impacchettamento:dd.APF, percento_spazio_occupato:+(dd.APF * 100).toFixed(2),
                    relazione_a_r:dd.relazione, numero_coordinazione:dd.numero_coordinazione };
        if(a.a_pm !== undefined){
          out.raggio_atomico_pm = tc === 'sc' ? +(a.a_pm / 2).toFixed(2)
            : tc === 'bcc' ? +(a.a_pm * Math.sqrt(3) / 4).toFixed(2)
            : +(a.a_pm * Math.sqrt(2) / 4).toFixed(2);
        }
        return out;
      }
      return { ok:false, error:'calcolo non riconosciuto', disponibili:['bragg','densita_cella','impacchettamento'] };
    }
  },
  {
    name: 'bilancia_equazione',
    description: "Bilancia un'equazione chimica calcolando i coefficienti stechiometrici esatti. Usalo SEMPRE per bilanciare, non farlo a mente. Esempio di input: \"C3H8 + O2 -> CO2 + H2O\".",
    parameters: {
      type: 'object',
      properties: {
        equazione: { type: 'string', description: 'Equazione non bilanciata, con "+" fra le specie e "->" (oppure "=") fra reagenti e prodotti.' }
      },
      required: ['equazione']
    },
    execute: function(a){
      var eq = (a && a.equazione || '').trim();
      var sides = eq.split(/->|=>|→|=/);
      if(sides.length !== 2) return { ok:false, error:'serve una freccia fra reagenti e prodotti, es. "H2 + O2 -> H2O"' };
      var split = function(s){ return s.split('+').map(function(x){ return x.trim(); }).filter(Boolean); };
      var L = split(sides[0]), R = split(sides[1]);
      if(!L.length || !R.length) return { ok:false, error:'reagenti o prodotti mancanti' };
      var species = L.concat(R), counts = [], elements = {};
      for(var i = 0; i < species.length; i++){
        // tolgo un eventuale coefficiente gia' presente: lo ricalcolo io
        var f = species[i].replace(/^\s*\d+\s*/, '');
        var c = parseFormula(f);
        if(!c) return { ok:false, error:'formula non interpretabile: ' + species[i] };
        counts.push(c);
        for(var e in c) elements[e] = true;
      }
      var els = Object.keys(elements);
      var rows = els.map(function(el){
        return species.map(function(_, idx){
          var n = counts[idx][el] || 0;
          return idx < L.length ? n : -n;      // prodotti col segno opposto
        });
      });
      var x = _nullSpaceIntegers(rows, species.length);
      if(!x) return { ok:false, error:'equazione non bilanciabile con queste specie (controlla le formule o se ne manca una)' };
      var fmt = function(off, arr){
        return arr.map(function(s, i){
          var k = x[off + i];
          return (k === 1 ? '' : k + ' ') + s.replace(/^\s*\d+\s*/, '');
        }).join(' + ');
      };
      var bilanciata = fmt(0, L) + ' → ' + fmt(L.length, R);
      // verifica: ogni elemento deve tornare da entrambe le parti
      var verifica = {};
      els.forEach(function(el){
        var sx = 0, dx = 0;
        for(var i2 = 0; i2 < species.length; i2++){
          var n2 = (counts[i2][el] || 0) * x[i2];
          if(i2 < L.length) sx += n2; else dx += n2;
        }
        verifica[el] = { reagenti: sx, prodotti: dx, ok: sx === dx };
      });
      return {
        ok: true, equazione_bilanciata: bilanciata,
        coefficienti: species.map(function(s, i){ return { specie: s.replace(/^\s*\d+\s*/, ''), coefficiente: x[i] }; }),
        verifica_atomi: verifica
      };
    }
  },
  {
    name: 'stechiometria',
    description: "Risolve un problema stechiometrico: da una quantita' di un reagente calcola quella di un prodotto, usando i coefficienti di un'equazione bilanciata. Bilancia prima con bilancia_equazione.",
    parameters: {
      type: 'object',
      properties: {
        equazione: { type: 'string', description: 'Equazione (verra\' bilanciata automaticamente).' },
        specie_nota: { type: 'string', description: 'Formula della specie di cui conosci la quantita\', es. "C3H8".' },
        quantita: { type: 'number', description: 'Quantita\' nota.' },
        unita: { type: 'string', description: '"mol" oppure "g".' },
        specie_richiesta: { type: 'string', description: 'Formula della specie da calcolare, es. "CO2".' }
      },
      required: ['equazione', 'specie_nota', 'quantita', 'specie_richiesta']
    },
    execute: function(a){
      a = a || {};
      var bal = toolByName('bilancia_equazione').execute({ equazione: a.equazione });
      if(!bal.ok) return bal;
      var find = function(f){
        var norm = String(f).replace(/\s/g, '');
        for(var i = 0; i < bal.coefficienti.length; i++)
          if(bal.coefficienti[i].specie.replace(/\s/g, '') === norm) return bal.coefficienti[i];
        return null;
      };
      var A = find(a.specie_nota), B = find(a.specie_richiesta);
      if(!A) return { ok:false, error:'specie non presente nell\'equazione: ' + a.specie_nota };
      if(!B) return { ok:false, error:'specie non presente nell\'equazione: ' + a.specie_richiesta };
      var mmA = null, mmB = null;
      var cA = parseFormula(A.specie), cB = parseFormula(B.specie), k;
      if(cA){ mmA = 0; for(k in cA) mmA += ATOMIC_MASS[k] * cA[k]; }
      if(cB){ mmB = 0; for(k in cB) mmB += ATOMIC_MASS[k] * cB[k]; }
      var unita = (a.unita || 'mol').toLowerCase();
      var molA = unita === 'g' ? (mmA ? a.quantita / mmA : null) : a.quantita;
      if(molA === null) return { ok:false, error:'non riesco a calcolare la massa molare di ' + A.specie };
      var molB = molA * (B.coefficiente / A.coefficiente);
      return {
        ok: true,
        equazione_bilanciata: bal.equazione_bilanciata,
        rapporto_molare: B.coefficiente + ':' + A.coefficiente + ' (' + B.specie + ':' + A.specie + ')',
        moli_note: +molA.toFixed(6), moli_richieste: +molB.toFixed(6),
        massa_richiesta_g: mmB ? +(molB * mmB).toFixed(4) : null,
        massa_molare_nota: mmA ? +mmA.toFixed(4) : null,
        massa_molare_richiesta: mmB ? +mmB.toFixed(4) : null
      };
    }
  },
  {
    name: 'cerca_pubchem',
    description: "Recupera i DATI REALI di un composto dal database PubChem (NIH): formula, massa molecolare, SMILES, nome IUPAC, XLogP, TPSA, donatori/accettori di legame idrogeno, legami ruotabili. USA SEMPRE questo strumento prima di citare proprieta' numeriche di una molecola, invece di andare a memoria.",
    parameters: {
      type: 'object',
      properties: {
        nome: { type: 'string', description: 'Nome del composto (italiano o inglese) oppure formula, es. "caffeina", "aspirin", "C9H8O4".' }
      },
      required: ['nome']
    },
    execute: function(args){
      var nome = (args && args.nome || '').trim();
      if(!nome) return Promise.resolve({ ok:false, error:'nome mancante' });
      var DESC = 'MolecularFormula,MolecularWeight,IUPACName,XLogP,TPSA,HBondDonorCount,HBondAcceptorCount,RotatableBondCount,Charge';
      // PubChem ha rinominato CanonicalSMILES in SMILES: provo prima il nome
      // nuovo, poi quello storico, e solo come ultima spiaggia rinuncio allo
      // SMILES — cosi' i descrittori (XLogP, TPSA, HBD/HBA) non si perdono per
      // colpa di un singolo campo rinominato.
      var TENTATIVI = ['SMILES,' + DESC, 'CanonicalSMILES,' + DESC, DESC];
      var base = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/' + encodeURIComponent(nome) + '/property/';
      function ask(list){
        return fetch(base + list + '/JSON').then(function(r){
          if(!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        });
      }
      function tryFrom(i){
        return ask(TENTATIVI[i]).catch(function(e){
          if(i + 1 < TENTATIVI.length) return tryFrom(i + 1);
          throw e;
        });
      }
      return tryFrom(0)
        .then(function(j){
          var p = j && j.PropertyTable && j.PropertyTable.Properties && j.PropertyTable.Properties[0];
          if(!p) return { ok:false, error:'composto non trovato su PubChem: ' + nome };
          return {
            ok: true, fonte: 'PubChem (NIH)', query: nome, cid: p.CID,
            formula: p.MolecularFormula, massa_molecolare: p.MolecularWeight,
            smiles: p.CanonicalSMILES || p.SMILES || null, nome_iupac: p.IUPACName || null,
            xlogp: (p.XLogP !== undefined ? p.XLogP : null), tpsa: (p.TPSA !== undefined ? p.TPSA : null),
            donatori_H: (p.HBondDonorCount !== undefined ? p.HBondDonorCount : null),
            accettori_H: (p.HBondAcceptorCount !== undefined ? p.HBondAcceptorCount : null),
            legami_ruotabili: (p.RotatableBondCount !== undefined ? p.RotatableBondCount : null),
            carica: (p.Charge !== undefined ? p.Charge : null)
          };
        })
        .catch(function(e){ return { ok:false, error:'PubChem non raggiungibile: ' + (e && e.message) }; });
    }
  },
  {
    name: 'massa_molecolare',
    description: 'Calcola la massa molecolare esatta da una formula bruta, con composizione percentuale per elemento. Gestisce parentesi e idrati, es. "C9H8O4", "Ca3(PO4)2", "CuSO4.5H2O".',
    parameters: {
      type: 'object',
      properties: { formula: { type: 'string', description: 'Formula bruta del composto.' } },
      required: ['formula']
    },
    execute: function(args){
      var f = (args && args.formula || '').trim();
      var c = parseFormula(f);
      if(!c) return { ok:false, error:'formula non interpretabile (o elemento sconosciuto): ' + f };
      var mm = 0, k;
      for(k in c) mm += ATOMIC_MASS[k] * c[k];
      var comp = {};
      for(k in c) comp[k] = { atomi: c[k], percento_massa: +(100 * ATOMIC_MASS[k] * c[k] / mm).toFixed(2) };
      return { ok:true, formula:f, massa_molecolare:+mm.toFixed(4), unita:'g/mol', composizione:comp };
    }
  },
  {
    name: 'valuta_druglikeness',
    description: "Applica le regole di Lipinski (Rule of Five) e Veber a valori numerici gia' noti, per dire se un composto e' drug-like. Recupera prima i valori con cerca_pubchem, poi passali qui.",
    parameters: {
      type: 'object',
      properties: {
        massa_molecolare: { type: 'number', description: 'MW in g/mol' },
        logp: { type: 'number', description: 'LogP / XLogP' },
        donatori_H: { type: 'number', description: 'Donatori di legame idrogeno' },
        accettori_H: { type: 'number', description: 'Accettori di legame idrogeno' },
        tpsa: { type: 'number', description: 'Area polare topologica in Å²' },
        legami_ruotabili: { type: 'number', description: 'Numero di legami ruotabili' }
      },
      required: ['massa_molecolare']
    },
    execute: function(a){
      a = a || {};
      var v = [], lip = [];
      function chk(cond, txt){ if(cond !== null) { lip.push({ regola: txt, rispettata: cond }); if(!cond) v.push(txt); } }
      chk(a.massa_molecolare != null ? a.massa_molecolare <= 500 : null, 'MW ≤ 500');
      chk(a.logp != null ? a.logp <= 5 : null, 'LogP ≤ 5');
      chk(a.donatori_H != null ? a.donatori_H <= 5 : null, 'donatori H ≤ 5');
      chk(a.accettori_H != null ? a.accettori_H <= 10 : null, 'accettori H ≤ 10');
      var veber = [];
      if(a.tpsa != null) veber.push({ regola: 'TPSA ≤ 140 Å²', rispettata: a.tpsa <= 140 });
      if(a.legami_ruotabili != null) veber.push({ regola: 'legami ruotabili ≤ 10', rispettata: a.legami_ruotabili <= 10 });
      return {
        ok: true, lipinski: lip, violazioni_lipinski: v.length, dettaglio_violazioni: v,
        veber: veber,
        verdetto: v.length === 0 ? 'drug-like: nessuna violazione di Lipinski'
                : v.length === 1 ? 'accettabile: 1 violazione (Lipinski ne tollera 1)'
                : 'non drug-like per via orale: ' + v.length + ' violazioni',
        nota: 'Regole empiriche per la biodisponibilita\' orale, non una previsione di attivita\'.'
      };
    }
  },
  {
    name: 'converti_unita',
    description: 'Converte un valore fra unita\' di misura (energia, lunghezza, massa, pressione, volume, temperatura). Usalo invece di fare la conversione a mente.',
    parameters: {
      type: 'object',
      properties: {
        valore: { type: 'number', description: 'Il valore numerico da convertire.' },
        da: { type: 'string', description: 'Unita\' di partenza, es. "kcal/mol", "nm", "atm", "C".' },
        a:  { type: 'string', description: 'Unita\' di arrivo, es. "kJ/mol", "A", "Pa", "K".' }
      },
      required: ['valore', 'da', 'a']
    },
    execute: function(a){
      var val = Number(a && a.valore), da = (a && a.da || '').trim(), to = (a && a.a || '').trim();
      if(!isFinite(val)) return { ok:false, error:'valore non numerico' };
      var norm = function(u){ return u.replace(/µ/g,'u').replace(/Å/gi,'A').replace(/°/g,'').replace(/\^/g,''); };
      da = norm(da); to = norm(to);
      if(['K','C','F'].indexOf(da) >= 0 && ['K','C','F'].indexOf(to) >= 0){
        var kelvin = da === 'K' ? val : da === 'C' ? val + 273.15 : (val - 32) * 5/9 + 273.15;
        var out = to === 'K' ? kelvin : to === 'C' ? kelvin - 273.15 : (kelvin - 273.15) * 9/5 + 32;
        return { ok:true, valore:val, da:da, a:to, risultato:+out.toFixed(6), famiglia:'temperatura' };
      }
      for(var fam in UNIT_FAMILIES){
        var u = UNIT_FAMILIES[fam].u;
        if(u[da] !== undefined && u[to] !== undefined){
          var res = val * u[da] / u[to];
          return { ok:true, valore:val, da:da, a:to, risultato:res, famiglia:fam };
        }
      }
      return { ok:false, error:'unita\' non riconosciute o di famiglie diverse: ' + da + ' -> ' + to,
               famiglie_disponibili: Object.keys(UNIT_FAMILIES) };
    }
  },
  {
    name: 'costante_fisica',
    description: 'Restituisce il valore ufficiale di una costante fisica o chimica fondamentale (CODATA/SI).',
    parameters: {
      type: 'object',
      properties: { nome: { type: 'string', description: 'es. "costante di Avogadro", "costante dei gas", "carica elementare".' } },
      required: ['nome']
    },
    execute: function(a){
      var q = (a && a.nome || '').toLowerCase().replace(/[àá]/g,'a').replace(/[èé]/g,'e').trim();
      for(var k in PHYS_CONST){
        if(k.indexOf(q) >= 0 || q.indexOf(k) >= 0 || k.split(' ').pop() === q)
          return { ok:true, costante:k, valore:PHYS_CONST[k].v, unita:PHYS_CONST[k].u, nota:PHYS_CONST[k].note };
      }
      return { ok:false, error:'costante non trovata', disponibili:Object.keys(PHYS_CONST) };
    }
  },
  {
    name: 'cerca_letteratura',
    description: "Cerca articoli scientifici reali su PubMed (NIH) e restituisce titolo, rivista, anno, autori e PMID. Usalo quando serve una fonte, quando l'utente chiede 'cosa dice la letteratura', o per verificare un'affermazione prima di darla per buona.",
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Termini di ricerca, meglio se in inglese, es. "aspirin COX-1 inhibition mechanism".' },
        max: { type: 'number', description: 'Quanti articoli restituire (1-8, default 5).' }
      },
      required: ['query']
    },
    execute: function(a){
      var q = (a && a.query || '').trim();
      if(!q) return Promise.resolve({ ok:false, error:'query mancante' });
      var n = Math.max(1, Math.min(8, a.max || 5));
      var E = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/';
      return fetch(E + 'esearch.fcgi?db=pubmed&retmode=json&retmax=' + n + '&term=' + encodeURIComponent(q))
        .then(function(r){ if(!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function(j){
          var ids = j && j.esearchresult && j.esearchresult.idlist || [];
          if(!ids.length) return { ok:true, query:q, totale:0, articoli:[], nota:'nessun articolo trovato su PubMed' };
          return fetch(E + 'esummary.fcgi?db=pubmed&retmode=json&id=' + ids.join(','))
            .then(function(r2){ if(!r2.ok) throw new Error('HTTP ' + r2.status); return r2.json(); })
            .then(function(s){
              var res = s && s.result || {};
              var arts = ids.map(function(id){
                var d = res[id] || {};
                var au = (d.authors || []).slice(0, 3).map(function(x){ return x.name; });
                if((d.authors || []).length > 3) au.push('et al.');
                return {
                  pmid: id, titolo: d.title || null, autori: au.join(', ') || null,
                  rivista: d.fulljournalname || d.source || null,
                  anno: (d.pubdate || '').slice(0, 4) || null,
                  doi: (d.elocationid || '').replace(/^doi:\s*/i, '') || null,
                  url: 'https://pubmed.ncbi.nlm.nih.gov/' + id + '/'
                };
              });
              return { ok:true, fonte:'PubMed (NIH)', query:q,
                       totale: parseInt((j.esearchresult && j.esearchresult.count) || arts.length, 10),
                       articoli: arts };
            });
        })
        .catch(function(e){ return { ok:false, error:'PubMed non raggiungibile: ' + (e && e.message) }; });
    }
  },
  {
    name: 'ricorda',
    description: "Salva in modo permanente un fatto sull'utente o sul suo percorso di studio (es. 'sta preparando l'esame di Chimica Organica 2', 'fatica con i meccanismi SN1/SN2', 'preferisce spiegazioni brevi'). Usalo di tua iniziativa quando emerge qualcosa di utile da ricordare nelle sessioni future. Non salvare dati sensibili.",
    parameters: {
      type: 'object',
      properties: {
        fatto: { type: 'string', description: 'Il fatto da ricordare, in una frase breve.' },
        categoria: { type: 'string', description: 'Es. "esame", "difficolta", "preferenza", "obiettivo".' }
      },
      required: ['fatto']
    },
    execute: function(a){
      var f = (a && a.fatto || '').trim();
      if(!f) return { ok:false, error:'fatto mancante' };
      var mem = loadMemory();
      // evito di riscrivere lo stesso fatto ad ogni sessione
      var dup = mem.filter(function(m){ return m.fatto.toLowerCase() === f.toLowerCase(); });
      if(dup.length) return { ok:true, gia_presente:true, fatto:f, totale_ricordi:mem.length };
      mem.push({ fatto: f, categoria: (a.categoria || 'generale'), quando: new Date().toISOString().slice(0, 10) });
      if(mem.length > MAX_MEMORIE) mem = mem.slice(-MAX_MEMORIE);
      saveMemory(mem);
      return { ok:true, salvato:f, totale_ricordi:mem.length };
    }
  },
  {
    name: 'ricordi',
    description: "Elenca cio' che hai gia' memorizzato sull'utente. Serve anche per dimenticare: passa 'dimentica' con il testo del ricordo da rimuovere.",
    parameters: {
      type: 'object',
      properties: { dimentica: { type: 'string', description: 'Testo (anche parziale) del ricordo da eliminare.' } }
    },
    execute: function(a){
      var mem = loadMemory();
      if(a && a.dimentica){
        var q = a.dimentica.toLowerCase();
        var prima = mem.length;
        mem = mem.filter(function(m){ return m.fatto.toLowerCase().indexOf(q) < 0; });
        saveMemory(mem);
        return { ok:true, rimossi: prima - mem.length, ricordi: mem };
      }
      return { ok:true, totale: mem.length, ricordi: mem };
    }
  },
  {
    name: 'cerca_nel_database',
    description: "Interroga i database interni di BioSpecInfo: 297 reazioni di sintesi, 118 elementi, 67 amminoacidi, 143 farmaci, 36 interazioni farmacologiche, 29 potenziali redox, 39 strategie retrosintetiche, 29 vie metaboliche e 63 patologie. Sono i dati veri dell'app, curati dall'autore: usali PRIMA di rispondere a memoria su reazioni, elementi, amminoacidi o farmaci, e cita che vengono da BioSpecInfo.",
    parameters: {
      type: 'object',
      properties: {
        tipo: { type: 'string',
                enum: ['reazione','elemento','amminoacido','farmaco','interazione','redox','retrosintesi','via_metabolica','patologia'],
                description: 'Quale database interrogare.' },
        query: { type: 'string', description: 'Testo da cercare: nome, simbolo, categoria o parola chiave. Lascia vuoto per avere l\'elenco completo (troncato).' },
        max: { type: 'number', description: 'Numero massimo di risultati (default 8, massimo 25).' }
      },
      required: ['tipo']
    },
    execute: function(a){
      a = a || {};
      var tipo = String(a.tipo || '').toLowerCase();
      var q = String(a.query || '').toLowerCase().trim();
      var max = Math.max(1, Math.min(25, a.max || 8));
      // I dataset vivono nello scope globale di index.html. Se Spectra gira in
      // un'altra pagina non ci sono: lo dico invece di restituire un vuoto muto.
      function G(n){ try{ return window[n]; }catch(e){ return undefined; } }
      function match(hay){ return !q || String(hay).toLowerCase().indexOf(q) >= 0; }
      // Ordina per pertinenza: la corrispondenza esatta prima di quella parziale.
      // Senza questo, cercare "oro" restituiva "Boro" prima di "Oro".
      function perTinenza(arr, campi){
        if(!q) return arr;
        var score = function(x){
          var best = 3;
          for(var i = 0; i < campi.length; i++){
            var v = String(campi[i](x) || '').toLowerCase();
            if(!v) continue;
            if(v === q) best = Math.min(best, 0);                    // uguale
            else if(v.indexOf(q) === 0) best = Math.min(best, 1);     // inizia con
            else if(v.indexOf(q) >= 0) best = Math.min(best, 2);      // contiene
          }
          return best;
        };
        return arr.slice().sort(function(x, y){ return score(x) - score(y); });
      }
      function taglia(arr, tot, mapper){
        return { ok:true, fonte:'database interno di BioSpecInfo', tipo:tipo, query:a.query || '(tutti)',
                 trovati:arr.length, totale_nel_database:tot,
                 risultati:arr.slice(0, max).map(mapper),
                 nota: arr.length > max ? 'mostrati i primi ' + max + ' di ' + arr.length + ': restringi la ricerca per vederne altri' : undefined };
      }
      if(tipo === 'reazione'){
        var RX = G('RXN');
        if(!RX) return { ok:false, error:'database reazioni non disponibile in questa pagina' };
        var CAT = { cc:'formazione C–C', ox:'ossidazione', red:'riduzione', sub:'sostituzione',
                    add:'addizione', eli:'eliminazione', ar:'aromatica', rear:'trasposizione',
                    prot:'gruppi protettori', het:'eterocicli', cat:'catalisi', pol:'polimerizzazione' };
        var rr = RX.filter(function(x){ return match(x.t) || match(x.it) || match(x.d) || match(CAT[x.c] || x.c); });
        rr = perTinenza(rr, [function(x){return x.t;}, function(x){return x.it;}]);
        return taglia(rr, RX.length, function(x){
          return { nome:x.t, categoria:CAT[x.c] || x.c, descrizione:x.d, condizioni:x.cond };
        });
      }
      if(tipo === 'elemento'){
        var EL = G('ELEMENTS');
        if(!EL) return { ok:false, error:'tavola periodica non disponibile in questa pagina' };
        var ee = EL.filter(function(x){
          return !q || String(x[1]).toLowerCase() === q || match(x[2]) || String(x[0]) === q;
        });
        ee = perTinenza(ee, [function(x){return x[1];}, function(x){return x[2];}]);
        return taglia(ee, EL.length, function(x){
          return { numero_atomico:x[0], simbolo:x[1], nome:x[2], massa_atomica:x[3],
                   periodo:x[4], gruppo:x[5], stati_ossidazione:x[7],
                   configurazione_elettronica:x[8], elettronegativita_pauling:x[9],
                   raggio_atomico_pm:x[10], energia_ionizzazione_eV:x[11],
                   punto_fusione_C:x[12], note:x[13] };
        });
      }
      if(tipo === 'amminoacido'){
        var AA = G('AA_DATA');
        if(!AA) return { ok:false, error:'database amminoacidi non disponibile in questa pagina' };
        var aa = AA.filter(function(x){
          return !q || match(x.name) || String(x.code1).toLowerCase() === q ||
                 String(x.code3).toLowerCase() === q || match(x.cat) || match(x.desc);
        });
        aa = perTinenza(aa, [function(x){return x.code1;}, function(x){return x.code3;}, function(x){return x.name;}]);
        return taglia(aa, AA.length, function(x){
          return { nome:x.name, codice_3:x.code3, codice_1:x.code1, categoria:x.cat,
                   massa:x.mw, pKa_COOH:x.pKa1, pKa_NH3:x.pKa2, pKa_catena_laterale:x.pKaR,
                   smiles:x.smi, carica:x.charge, proprieta:x.prop, descrizione:x.desc };
        });
      }
      if(tipo === 'farmaco'){
        var FD = G('FARM_DATA');
        if(!FD) return { ok:false, error:'database farmaci non disponibile in questa pagina' };
        var ff = FD.filter(function(x){ return match(x.name) || match(x.cat) || match(x.classe) || match(x.indicaz) || match(x.moa); });
        ff = perTinenza(ff, [function(x){return x.name;}, function(x){return x.classe;}, function(x){return x.cat;}]);
        return taglia(ff, FD.length, function(x){
          return { nome:x.name, categoria:x.cat, classe:x.classe, massa_molecolare:x.mw, smiles:x.smi,
                   meccanismo_azione:x.moa, indicazioni:x.indicaz, effetti_avversi:x.effetti };
        });
      }
      if(tipo === 'interazione'){
        var DI = G('DI_DB');
        if(!DI) return { ok:false, error:'database interazioni non disponibile in questa pagina' };
        var ii = DI.filter(function(x){ return match(x.d1) || match(x.d2) || match(x.sev) || match(x.effetto); });
        return taglia(ii, DI.length, function(x){
          return { farmaco_1:x.d1, farmaco_2:x.d2, gravita:x.sev, meccanismo:x.mecco, effetto:x.effetto };
        });
      }
      if(tipo === 'redox'){
        var RD = G('REDOX_DATA');
        if(!RD) return { ok:false, error:'tabella redox non disponibile in questa pagina' };
        var dd = RD.filter(function(x){ return match(x.reaction) || match(x.cat); });
        return taglia(dd, RD.length, function(x){
          return { semireazione:x.reaction, E_standard_V:x.E, carattere:x.cat };
        });
      }
      if(tipo === 'retrosintesi'){
        var RS = G('RETRO_STRATEGIES');
        if(!RS) return { ok:false, error:'strategie retrosintetiche non disponibili in questa pagina' };
        var ss = RS.filter(function(x){ return match(x.name) || match(x.cat) || match(x.target) || match(x.disconnection); });
        return taglia(ss, RS.length, function(x){
          return { strategia:x.name, categoria:x.cat, target:x.target, disconnessione:x.disconnection,
                   sintoni:x.synthons, reagenti:x.reagents, esempio:x.example };
        });
      }
      if(tipo === 'via_metabolica'){
        var BS = G('BIO_SYN');
        if(!BS) return { ok:false, error:'vie metaboliche non disponibili in questa pagina' };
        var bb = BS.filter(function(x){ return match(x.n) || match(x.d) || match(x.c) || match(x.refs); });
        return taglia(bb, BS.length, function(x){
          return { via:x.n, categoria:x.c, descrizione:x.d, condizioni:x.cond, note_regolazione:x.refs };
        });
      }
      if(tipo === 'patologia'){
        var MD = G('MED_DB');
        if(!MD) return { ok:false, error:'database patologie non disponibile in questa pagina' };
        var mm = MD.filter(function(x){ return match(x.n) || match(x.organ) || match(x.region) || match(x.desc) || match(x.type); });
        return taglia(mm, MD.length, function(x){
          return { patologia:x.n, organo:x.organ, regione:x.region, tipo:x.type, descrizione:x.desc,
                   farmaci:(x.drugs || []).map(function(d){ return d.n + ' (' + d.cls + '): ' + d.mech; }) };
        });
      }
      return { ok:false, error:'tipo non riconosciuto',
               disponibili:['reazione','elemento','amminoacido','farmaco','interazione','redox','retrosintesi','via_metabolica','patologia'] };
    }
  },
  {
    name: 'apri_animazione',
    description: "Apre l'animazione passo-passo di un meccanismo di reazione dentro BioSpecInfo: si vedono gli elettroni spostarsi, gli intermedi e lo stato di transizione. Usalo quando spieghi uno di questi meccanismi — vedere il movimento vale piu' di una descrizione.",
    parameters: {
      type: 'object',
      properties: {
        meccanismo: { type: 'string',
                      enum: ['sn2','sn1','e2','markovnikov','diels_alder','aldol'],
                      description: 'sn2 = sostituzione nucleofila SN2; sn1 = SN1; e2 = eliminazione E2; markovnikov = addizione di HBr; diels_alder = cicloaddizione [4+2]; aldol = condensazione aldolica.' }
      },
      required: ['meccanismo']
    },
    execute: function(a){
      var NOMI = { sn2:'Sostituzione Nucleofila SN2', sn1:'Sostituzione Nucleofila SN1',
                   e2:'Eliminazione E2 (Bimolecolare)', markovnikov:'Addizione di HBr: regola di Markovnikov',
                   diels_alder:'Diels-Alder [4+2]', aldol:'Condensazione Aldolica' };
      var id = a && a.meccanismo;
      if(!NOMI[id]) return { ok:false, error:'meccanismo non disponibile', disponibili:Object.keys(NOMI) };
      if(typeof window.showMechanism !== 'function')
        return { ok:false, error:'le animazioni sono disponibili solo dalla pagina principale dell\'app' };
      try{ closeHub(); }catch(e){}
      try{ window.showMechanism(id); }catch(e){ return { ok:false, error:'non riesco ad avviare l\'animazione' }; }
      return { ok:true, label:NOMI[id], animazione:id,
               nota:'animazione avviata: descrivi all\'utente cosa sta guardando, passo per passo' };
    }
  },
  {
    name: 'stato_app',
    description: "Dice dove si trova l'utente adesso nell'app e quali sezioni e laboratori sono disponibili. Usalo quando devi decidere dove portarlo o quando l'utente dice 'qui', 'questa sezione', 'quello che sto guardando'.",
    parameters: { type: 'object', properties: {} },
    execute: function(){
      var active = null;
      try{
        var el = document.querySelector('.section.on');
        if(el) active = { id: el.id, titolo: (el.querySelector('.section-title') || {}).textContent || null };
      }catch(e){}
      return {
        ok: true,
        sezione_attiva: active,
        sezioni_navigabili: Object.keys(NAV_SECTIONS).length,
        laboratori: Object.keys(FAB_TOOLS),
        nota: 'Per aprire una sezione usa naviga_sezione; per un laboratorio usa apri_strumento.'
      };
    }
  }
);

window.BSI_AI_TOOLS = TOOLS;

function toolByName(name){
  for(var i = 0; i < TOOLS.length; i++) if(TOOLS[i].name === name) return TOOLS[i];
  return null;
}

// Esegue localmente le tool-call ricevute e restituisce i risultati con
// gli id/nome originali (servono per ricostruire il turno "tool result").
// async: alcuni strumenti (es. cerca_molecola) restituiscono una Promise
// perché devono aspettare che l'app finisca di renderizzare una sezione
// prima di sapere se sono davvero riusciti.
// Rete di sicurezza sui risultati numerici.
// Un input a zero (lunghezza d'onda 0, volume 0, emivita 0...) fa divergere le
// formule e il risolutore restituiva ok:true con Infinity o NaN dentro. E' il
// guasto peggiore possibile qui: il modello lo riporterebbe come un valore
// valido — "λmax = Infinity nm" — e chi studia potrebbe crederci.
// Il controllo sta in un punto solo, cosi' vale anche per gli strumenti futuri.
function validaNumeri(nome, r){
  if(!r || r.ok !== true) return r;
  var guasti = [];
  (function scava(o, path){
    if(o === null || o === undefined || guasti.length > 6) return;
    if(typeof o === 'number'){ if(!isFinite(o)) guasti.push((path || 'risultato') + ' = ' + o); }
    else if(typeof o === 'object'){ for(var k in o) scava(o[k], path ? path + '.' + k : k); }
  })(r, '');
  if(!guasti.length) return r;
  return {
    ok: false,
    error: 'Il calcolo non ha un risultato finito: ' + guasti.join(', ') +
           '. Di solito significa una divisione per zero — controlla i dati di partenza ' +
           '(un volume, una concentrazione, una lunghezza d\'onda o un tempo di dimezzamento pari a zero).',
    strumento: nome, valori_non_finiti: guasti
  };
}

async function runToolCalls(toolCalls){
  var out = [];
  for(var i = 0; i < toolCalls.length; i++){
    var tc = toolCalls[i];
    var tool = toolByName(tc.name);
    var result;
    try{
      result = tool ? await tool.execute(tc.args || {}) : { ok: false, error: 'tool sconosciuto: ' + tc.name };
    }catch(e){ result = { ok: false, error: e.message }; }
    out.push({ id: tc.id, name: tc.name, args: tc.args, result: validaNumeri(tc.name, result) });
  }
  return out;
}
window.bsiValidaNumeri = validaNumeri;

// Costruisce, per famiglia, il messaggio "assistant" (che contiene le
// tool-call) e il messaggio "tool result" da riaggiungere alla history,
// nella forma nativa richiesta da quel provider.
function appendAgentTurn(family, history, assistantText, toolCalls, execResults, thinkingBlocks, serverBlocks){
  if(family === 'anthropic'){
    var contentBlocks = [];
    // I blocchi di pensiero vanno per primi e identici a come sono arrivati
    // (firma compresa), altrimenti il modello rifiuta il turno successivo.
    if(thinkingBlocks && thinkingBlocks.length) contentBlocks = contentBlocks.concat(thinkingBlocks);
    if(assistantText) contentBlocks.push({ type: 'text', text: assistantText });
    // se nello stesso turno c'e' stata una ricerca web, i suoi blocchi vanno
    // rimandati indietro insieme al resto o il turno risulta incoerente
    if(serverBlocks && serverBlocks.length) contentBlocks = contentBlocks.concat(serverBlocks);
    toolCalls.forEach(function(tc){ contentBlocks.push({ type: 'tool_use', id: tc.id, name: tc.name, input: tc.args || {} }); });
    history.push({ role: 'assistant', content: assistantText, _native: { anthropic: { role: 'assistant', content: contentBlocks } } });
    var resultBlocks = execResults.map(function(r){
      return { type: 'tool_result', tool_use_id: r.id, content: JSON.stringify(r.result) };
    });
    history.push({ role: 'user', content: '[risultati strumenti]', _native: { anthropic: { role: 'user', content: resultBlocks } } });
    return;
  }
  if(family === 'gemini'){
    var parts = [];
    if(assistantText) parts.push({ text: assistantText });
    toolCalls.forEach(function(tc){ parts.push({ functionCall: { name: tc.name, args: tc.args || {} } }); });
    history.push({ role: 'assistant', content: assistantText, _native: { gemini: { role: 'model', parts: parts } } });
    var respParts = execResults.map(function(r){
      return { functionResponse: { name: r.name, response: r.result } };
    });
    history.push({ role: 'user', content: '[risultati strumenti]', _native: { gemini: { role: 'user', parts: respParts } } });
    return;
  }
  // openai-compatibile (groq, openrouter, grok)
  var oaToolCalls = toolCalls.map(function(tc){
    return { id: tc.id, type: 'function', function: { name: tc.name, arguments: JSON.stringify(tc.args || {}) } };
  });
  history.push({ role: 'assistant', content: assistantText || null,
    _native: { openai: { role: 'assistant', content: assistantText || null, tool_calls: oaToolCalls } } });
  execResults.forEach(function(r){
    history.push({ role: 'tool', content: JSON.stringify(r.result),
      _native: { openai: { role: 'tool', tool_call_id: r.id, content: JSON.stringify(r.result) } } });
  });
}

/* runAgentTurn: come streamChat, ma con i "poteri" del Copilota — se il
   modello chiede di usare uno strumento, lo esegue davvero in locale e
   rimanda il risultato al modello, per un massimo di qualche round,
   fino a una risposta finale in linguaggio naturale.
   callbacks: { onToken(tok, full), onToolUse(label), onDone(full) } */
async function runAgentTurn(providerId, apiKey, messages, systemPrompt, callbacks, abortSignal){
  return conProviderDiRiserva(providerId, apiKey, messages, systemPrompt, callbacks, abortSignal);
}

/* I fornitori utilizzabili adesso, il preferito per primo.
   Solo quelli GRATUITI vanno in riserva: passare da solo a un servizio a
   pagamento spenderebbe i soldi dell'utente senza che li abbia stanziati.
   Se il preferito e' a pagamento resta comunque il primo della lista. */
function providerUtilizzabili(preferito){
  var lista = [];
  if(preferito && PROVIDERS[preferito]) lista.push(preferito);
  Object.keys(PROVIDERS).forEach(function(id){
    if(id === preferito) return;
    if(!PROVIDERS[id].free) return;              // mai a pagamento in automatico
    if(!chiaveDaUsare(id)) return;               // niente chiave e niente proxy
    lista.push(id);
  });
  return lista;
}

/* Esegue il turno; se il fornitore esaurisce la quota, lo rifa' da capo su un
   altro fra quelli per cui l'utente ha una chiave. E' il motivo per cui piu'
   chiavi gratuite messe insieme reggono un carico che nessuna reggerebbe da
   sola: quando Groq finisce il minuto, si continua su Gemini.
   Si riparte dai messaggi ORIGINALI, non dalla cronologia a meta': i turni
   con chiamate a strumenti sono salvati nel formato nativo del fornitore
   precedente e non si possono passare a un altro. Si perde il lavoro del
   turno, si guadagna una risposta giusta. */
async function conProviderDiRiserva(providerId, apiKey, messages, systemPrompt, callbacks, abortSignal){
  var candidati = providerUtilizzabili(providerId);
  var ultimo = null;
  for(var i = 0; i < candidati.length; i++){
    var id = candidati[i];
    var chiave = (i === 0) ? apiKey : chiaveDaUsare(id);
    if(i > 0 && callbacks && callbacks.onRiserva){
      callbacks.onRiserva(PROVIDERS[candidati[i - 1]].name, PROVIDERS[id].name);
    }
    try{
      return await _unTurno(id, chiave, messages, systemPrompt, callbacks, abortSignal);
    }catch(err){
      if(err && err.name === 'AbortError') throw err;
      // Si passa oltre SOLO per quota esaurita. Un errore di richiesta o una
      // chiave sbagliata si ripeterebbero identici su ogni fornitore: meglio
      // dirlo subito che provarli tutti e riportare l'ultimo errore a caso.
      if(!err || !err.esaurito || i === candidati.length - 1) throw err;
      ultimo = err;
    }
  }
  throw ultimo || new Error('Nessun fornitore disponibile.');
}

async function _unTurno(providerId, apiKey, messages, systemPrompt, callbacks, abortSignal){
  var p = PROVIDERS[providerId];
  if(!p) throw new Error('Provider sconosciuto: ' + providerId);
  var history = messages.slice();
  var totalText = '';
  // Con soli 4 giri l'agente non riusciva a incatenare piu' di un paio di
  // strumenti: cercare un composto, valutarlo e poi aprirne la scheda esauriva
  // il budget. Ora ha spazio per una vera catena di ragionamento.
  var MAX_ROUNDS = 10;
  var toolsDisabled = false;
  var TOOL_SCHEMA = TOOLS.map(function(t){ return { name: t.name, description: t.description, parameters: t.parameters }; });
  for(var round = 0; round < MAX_ROUNDS; round++){
    var roundText = '';
    var r;
    try{
      r = await streamChat(providerId, apiKey, history, systemPrompt, {
        onToken: function(tok, full){ roundText = full; totalText += tok; callbacks.onToken(tok, totalText); },
        onThinking: callbacks.onThinking,
        onAttesa: callbacks.onAttesa,
        onBudget: callbacks.onBudget,
        onServerTool: function(fase, blk, query){
          if(!callbacks.onToolUse) return;
          if(fase === 'search-start'){ callbacks.onToolUse('🌐 Cerco sul web…'); return; }
          if(fase === 'search-result'){
            var n = 0;
            try{ n = Array.isArray(blk.content) ? blk.content.length : 0; }catch(e){}
            callbacks.onToolUse('🌐 Web' + (query ? ' « ' + query + ' »' : '') + ': ' +
                                (n ? n + ' risultati' : 'nessun risultato'));
          }
        },
        onDone: function(){}
      }, toolsDisabled ? undefined : TOOL_SCHEMA, abortSignal);
    }catch(err){
      // Alcuni modelli gratuiti/leggeri (es. Mistral 7B free su OpenRouter)
      // non gestiscono bene il function-calling e rispondono con un errore
      // invece di una risposta normale: invece di far fallire tutta la
      // richiesta (percepito come "Spectra non risponde"), riprovo UNA
      // volta in modalità solo-testo, senza strumenti.
      var errMsg = ((err && err.message) || '').toLowerCase();
      var looksToolRelated = !toolsDisabled && /tool|function.?call|function_call|strument/.test(errMsg);
      if(looksToolRelated && round === 0){
        toolsDisabled = true;
        round--;
        continue;
      }
      throw err;
    }
    // Turno messo in pausa dal ciclo lato server (la ricerca web ha esaurito
    // le sue iterazioni). Si riprende rimandando indietro il turno assistant
    // COSI' COM'E', senza aggiungere un messaggio utente: il server riconosce
    // il blocco server_tool_use in coda e riparte da li'.
    if(r.stopReason === 'pause_turn' && p.family === 'anthropic'){
      var pausedBlocks = (r.thinking || []).concat(
        r.text ? [{ type: 'text', text: r.text }] : []
      ).concat(r.server || []);
      if(pausedBlocks.length){
        history.push({ role: 'assistant', content: r.text || '',
                       _native: { anthropic: { role: 'assistant', content: pausedBlocks } } });
        if(callbacks.onToolUse) callbacks.onToolUse('🌐 Continuo la ricerca…');
        continue;
      }
    }
    // Rifiuto dei classificatori di sicurezza: arriva come HTTP 200, quindi
    // senza questo controllo l'utente vedrebbe una risposta vuota e non
    // capirebbe perche'.
    if(r.stopReason === 'refusal'){
      callbacks.onDone(totalText || '');
      throw new Error('La richiesta e\' stata declinata dai filtri di sicurezza del modello. Riformulala, oppure prova un altro provider.');
    }
    if(!r.toolCalls || !r.toolCalls.length){
      callbacks.onDone(totalText);
      return { text: totalText };
    }
    // Se l'utente ha premuto Stop mentre arrivava questa risposta, non
    // eseguiamo le azioni richieste (potrebbero navigare l'app o aprire
    // strumenti) e ci fermiamo qui con il testo accumulato finora.
    if(abortSignal && abortSignal.aborted){
      callbacks.onDone(totalText);
      return { text: totalText };
    }
    var execResults = await runToolCalls(r.toolCalls);
    execResults.forEach(function(er){
      if(!callbacks.onToolUse) return;
      var res = er.result || {};
      // Gli strumenti di navigazione hanno una "label"; quelli conoscitivi
      // restituiscono dati, quindi mostro cosa hanno trovato invece del nome.
      if(res.ok === false){ callbacks.onToolUse('⚠️ ' + er.name + ': ' + (res.error || 'non riuscito')); return; }
      var msg;
      switch(er.name){
        case 'cerca_pubchem':      msg = '🔍 PubChem: ' + (res.formula || '?') + ' · MM ' + (res.massa_molecolare || '?') + ' g/mol'; break;
        case 'massa_molecolare':   msg = '⚖️ ' + (res.formula || '') + ' = ' + res.massa_molecolare + ' g/mol'; break;
        case 'valuta_druglikeness':msg = '💊 ' + (res.verdetto || 'valutazione completata'); break;
        case 'converti_unita':     msg = '🔁 ' + res.valore + ' ' + res.da + ' = ' + res.risultato + ' ' + res.a; break;
        case 'costante_fisica':    msg = '📐 ' + res.costante + ' = ' + res.valore + ' ' + res.unita; break;
        case 'calcola':            msg = '🔢 ' + res.espressione + ' = ' + (res.notazione_scientifica || res.risultato); break;
        case 'risolvi_equazione':  msg = '🧩 ' + (res.soluzioni && res.soluzioni.length ? res.incognita + ' = ' + res.soluzioni.join(' , ') : 'nessuna soluzione reale'); break;
        case 'analisi_dati':       msg = '📈 ' + (res.regressione ? res.regressione.equazione + ' (R²=' + res.regressione.R2 + ')' : 'media ' + res.media + ' ± ' + res.deviazione_standard); break;
        case 'termodinamica':      msg = '🔥 ΔG = ' + res.dG_kJ_mol + ' kJ/mol' + (res.K_equilibrio !== undefined ? ' · K = ' + res.K_equilibrio : ''); break;
        case 'equilibrio_acido_base': msg = '🧪 pH = ' + res.pH + ' (' + res.carattere + ')'; break;
        case 'cinetica':           msg = '⏱️ ' + (res.tempo_dimezzamento !== undefined ? 't½ = ' + res.tempo_dimezzamento : res.Ea_kJ_mol !== undefined ? 'Ea = ' + res.Ea_kJ_mol + ' kJ/mol' : 'cinetica calcolata'); break;
        case 'gas_e_soluzioni':    msg = '💨 ' + (res.V_L !== undefined ? 'V = ' + res.V_L + ' L' : res.P_atm !== undefined ? 'P = ' + res.P_atm + ' atm' : res.P_vanderwaals_atm !== undefined ? 'P(vdW) = ' + res.P_vanderwaals_atm + ' atm' : 'calcolato'); break;
        case 'quantistica_e_spettroscopia': msg = '⚛️ ' + (res.lambda_nm !== undefined ? 'λ = ' + res.lambda_nm + ' nm' : res.assorbanza !== undefined ? 'A = ' + res.assorbanza : 'calcolato'); break;
        case 'elettrochimica':     msg = '🔋 ' + (res.E_nernst_V !== undefined ? 'E = ' + res.E_nernst_V + ' V' : res.dG0_kJ_mol !== undefined ? 'ΔG° = ' + res.dG0_kJ_mol + ' kJ/mol' : 'calcolato'); break;
        case 'spettroscopia':      msg = '📡 ' + (res.DBE !== undefined ? 'DBE = ' + res.DBE : res.pattern_isotopico ? 'pattern isotopico calcolato' : res.lambda_max_stimata_nm ? 'λmax ≈ ' + res.lambda_max_stimata_nm + ' nm' : 'tabella spettroscopica'); break;
        case 'biochimica':         msg = '🧬 ' + (res.v !== undefined ? 'v = ' + res.v : res.pI !== undefined ? 'MM ' + res.massa_media_Da + ' Da · pI ' + res.pI : res.ATP_stimati !== undefined ? res.ATP_stimati + ' ATP' : 'calcolato'); break;
        case 'farmacocinetica':    msg = '💊 ' + (res.t_mezza_h !== undefined ? 't½ = ' + res.t_mezza_h + ' h' : 'PK calcolata') + (res.dose_di_carico_mg !== undefined ? ' · carico ' + res.dose_di_carico_mg + ' mg' : ''); break;
        case 'astrofisica':        msg = '🔭 ' + (res.lambda_max_nm !== undefined ? 'λmax = ' + res.lambda_max_nm + ' nm' : res.z !== undefined ? 'z = ' + res.z : res.velocita_fuga_km_s !== undefined ? 'v fuga = ' + res.velocita_fuga_km_s + ' km/s' : res.periodo_anni !== undefined ? 'P = ' + res.periodo_anni + ' anni' : 'calcolato'); break;
        case 'nucleare':           msg = '☢️ ' + (res.eta !== undefined ? 'eta = ' + res.eta : res.energia_per_nucleone_MeV !== undefined ? res.energia_per_nucleone_MeV + ' MeV/nucleone' : 'decadimento calcolato'); break;
        case 'statistica_inferenziale': msg = '📊 ' + (res.p_value !== undefined ? 'p = ' + res.p_value + (res.significativo ? ' (significativo)' : ' (non significativo)') : 'IC ' + (res.intervallo ? '[' + res.intervallo.join(', ') + ']' : '')); break;
        case 'cristallografia':    msg = '💎 ' + (res.theta_gradi !== undefined ? 'θ = ' + res.theta_gradi + '°' : res.densita_g_cm3 !== undefined ? 'ρ = ' + res.densita_g_cm3 + ' g/cm³' : res.fattore_impacchettamento !== undefined ? 'APF = ' + res.fattore_impacchettamento : 'calcolato'); break;
        case 'bilancia_equazione': msg = '⚗️ ' + res.equazione_bilanciata; break;
        case 'stechiometria':      msg = '🧮 ' + res.moli_richieste + ' mol' + (res.massa_richiesta_g ? ' (' + res.massa_richiesta_g + ' g)' : ''); break;
        case 'cerca_letteratura':  msg = '📚 PubMed: ' + (res.articoli || []).length + ' articoli su ' + (res.totale || 0); break;
        case 'ricorda':            msg = res.gia_presente ? '🧠 (lo sapevo gia\')' : '🧠 Ricordero\': ' + res.salvato; break;
        case 'ricordi':            msg = res.rimossi !== undefined ? '🧠 Dimenticati: ' + res.rimossi : '🧠 ' + res.totale + ' ricordi'; break;
        case 'cerca_nel_database': msg = '📚 BioSpecInfo · ' + res.tipo + ': ' + res.trovati + ' risultati su ' + res.totale_nel_database; break;
        case 'apri_animazione':   msg = '🎬 Animazione: ' + res.label; break;
        case 'stato_app':          msg = '🧭 Ho controllato dove ti trovi nell\'app'; break;
        default:                   msg = '🧭 Ho eseguito: ' + (res.label || er.name);
      }
      callbacks.onToolUse(msg);
    });
    appendAgentTurn(p.family, history, roundText, r.toolCalls, execResults, r.thinking, r.server);
  }
  callbacks.onDone(totalText || '(limite di passaggi strumenti raggiunto)');
  return { text: totalText };
}
window.bsiRunAgentTurn = runAgentTurn;

/* ---------------------------------------------------------------------
   2. Markdown → HTML minimale e sicuro (escape prima, poi trasforma)
--------------------------------------------------------------------- */
function escapeHtml(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function mdToHtml(src){
  var s = escapeHtml(src == null ? '' : String(src));
  // blocchi di codice ```...```
  var codeBlocks = [];
  s = s.replace(/```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g, function(_, lang, code){
    var idx = codeBlocks.length;
    codeBlocks.push('<pre class="bsi-md-code"><code>' + code.replace(/\n$/,'') + '</code></pre>');
    return '\u0000CODEBLOCK' + idx + '\u0000';
  });
  // codice inline `x`
  s = s.replace(/`([^`\n]+)`/g, '<code class="bsi-md-inline">$1</code>');
  // Tabelle: riassunti comparativi e flashcard escono quasi sempre in questa
  // forma, e senza il supporto restavano righe di pipe illeggibili. Le estraggo
  // come i blocchi di codice, prima che la formattazione dei paragrafi le rompa.
  var tabelle = [];
  s = s.replace(/(^|\n)((?:[^\n]*\|[^\n]*\n)(?:[ \t]*\|?[ \t:*-]*\|[ \t:|*-]*\n)(?:[^\n]*\|[^\n]*(?:\n|$))+)/g,
    function(tutto, pre, blocco){
      var righe = blocco.trim().split('\n');
      var cella = function(r){
        return r.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map(function(c){ return c.trim(); });
      };
      var intest = cella(righe[0]);
      var corpo = righe.slice(2).map(cella);
      // se le colonne non tornano non e' una tabella: lascio il testo com'e'
      if(intest.length < 2) return tutto;
      var html = '<table class="bsi-md-table"><thead><tr>' +
        intest.map(function(h){ return '<th>' + h + '</th>'; }).join('') + '</tr></thead><tbody>' +
        corpo.map(function(r){
          while(r.length < intest.length) r.push('');
          return '<tr>' + r.slice(0, intest.length).map(function(c){ return '<td>' + c + '</td>'; }).join('') + '</tr>';
        }).join('') + '</tbody></table>';
      tabelle.push(html);
      return pre + '\u0000TABELLA' + (tabelle.length - 1) + '\u0000';
    });
  // titoli
  s = s.replace(/^###\s+(.+)$/gm, '<h4 class="bsi-md-h">$1</h4>');
  s = s.replace(/^##\s+(.+)$/gm, '<h3 class="bsi-md-h">$1</h3>');
  s = s.replace(/^#\s+(.+)$/gm, '<h2 class="bsi-md-h">$1</h2>');
  // grassetto/corsivo
  s = s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<i>$2</i>');
  // link [testo](url)
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  // liste puntate/numerate (righe consecutive)
  s = s.replace(/(^|\n)((?:[-*]\s+.+(?:\n|$))+)/g, function(_, pre, block){
    var items = block.trim().split(/\n/).map(function(l){ return '<li>' + l.replace(/^[-*]\s+/, '') + '</li>'; }).join('');
    return pre + '<ul class="bsi-md-ul">' + items + '</ul>';
  });
  s = s.replace(/(^|\n)((?:\d+\.\s+.+(?:\n|$))+)/g, function(_, pre, block){
    var items = block.trim().split(/\n/).map(function(l){ return '<li>' + l.replace(/^\d+\.\s+/, '') + '</li>'; }).join('');
    return pre + '<ol class="bsi-md-ol">' + items + '</ol>';
  });
  // paragrafi: doppio a-capo -> nuovo paragrafo, singolo -> <br>
  s = s.split(/\n{2,}/).map(function(p){
    if(/^<(h2|h3|h4|ul|ol|pre)/.test(p.trim())) return p;
    return '<p class="bsi-md-p">' + p.replace(/\n/g,'<br>') + '</p>';
  }).join('');
  // reinserisco i blocchi di codice e le tabelle
  s = s.replace(/\u0000CODEBLOCK(\d+)\u0000/g, function(_, idx){ return codeBlocks[+idx]; });
  s = s.replace(/(?:<p class="bsi-md-p">)?\u0000TABELLA(\d+)\u0000(?:<\/p>)?/g,
                function(_, idx){ return tabelle[+idx]; });
  return s;
}
window.bsiMarkdownToHtml = mdToHtml;

/* ---------------------------------------------------------------------
   3. RAG leggero: se il messaggio dell'utente nomina una molecola già
      presente nei database locali dell'app (window._DB, window.MOL),
      alleghiamo quei dati REALI al prompt invece di lasciare che l'AI
      "indovini". Fallback silenzioso se le variabili non esistono.
--------------------------------------------------------------------- */
function buildGrounding(userText){
  var hits = [];
  try{
    var lower = (userText || '').toLowerCase();
    [window._DB, window.DRUG_CLINICAL_DB].forEach(function(db){
      if(db && typeof db === 'object'){
        Object.keys(db).forEach(function(key){
          if(lower.indexOf(key.toLowerCase()) > -1){
            var entry = db[key];
            var snippet;
            try{ snippet = JSON.stringify(entry).slice(0, 700); }catch(e){ snippet = ''; }
            if(snippet) hits.push('• ' + key + ': ' + snippet);
          }
        });
      }
    });
  }catch(e){}
  if(!hits.length) return '';
  return '\n\n[DATI REALI DA BIOSPECINFO — usa questi al posto di dati inventati]\n' + hits.slice(0,4).join('\n');
}

/* ---------------------------------------------------------------------
   4. System prompt di base (riprende quello storico dell'app)
--------------------------------------------------------------------- */
var BASE_SYSTEM = "Ti chiami Spectra, il copilota AI integrato in BioSpecInfo, una piattaforma web di chimica e " +
"biochimica open-access sviluppata da Samuele come progetto di tesi universitaria presso l'Università di Bari " +
"Aldo Moro (relatore: Prof. Savino Longo). A differenza di una chat qualunque, quando è attivo il Copilota puoi " +
"davvero navigare l'app per l'utente (aprire sezioni, strumenti, cercare molecole) invece di limitarti a " +
"descriverla: usa questi strumenti con sicurezza quando aiutano l'utente, non solo se te lo chiede esplicitamente. " +
"Rispondi sempre in italiano, in modo preciso, scientifico e didattico, con formule e simboli chimici quando " +
"utile.\n\n" +
"MATERIALI DELL'UTENTE: puo' allegarti foto di appunti o della lavagna, pagine di libro, PDF di " +
"dispense, spettri, strutture e file di testo, anche molti insieme. Leggili con attenzione e " +
"lavoraci sopra: riassunti strutturati, schemi gerarchici, mappe concettuali, flashcard, domande " +
"d'esame, trascrizioni, spiegazioni passo passo.\n\n" +
"APPUNTI SCRITTI A MANO: leggili davvero, non limitarti a descriverli. Se la grafia e' incerta su " +
"una parola scrivi [illeggibile] invece di inventare: un termine chimico sbagliato e' peggio di " +
"una lacuna dichiarata. Quando trovi formule, strutture o spettri interpretali esplicitamente. Se " +
"ricevi piu' immagini, trattale come pagine consecutive di un unico documento e mantieni l'ordine.\n\n" +
"PDF LUNGHI: puoi ricevere documenti fino a 600 pagine. Se il documento e' esteso, dichiara prima " +
"come lo affronti (per esempio 'lo divido in " +
"quattro blocchi tematici'), poi procedi in modo ordinato senza saltare sezioni. Se qualcosa e' " +
"fuori dalla parte che hai potuto leggere, dillo apertamente.\n\n" +
"ANIMAZIONI: per SN1, SN2, E2, addizione di Markovnikov, Diels-Alder e condensazione aldolica " +
"esiste un'animazione passo-passo: chiamala con apri_animazione e poi commenta cosa si vede " +
"mentre scorre. Vedere gli elettroni muoversi insegna piu' di una descrizione.\n\n" +
"TRADUZIONI: quando ti viene chiesto di tradurre, usa la terminologia scientifica in uso nella " +
"lingua di arrivo, non una traduzione letterale; lascia invariati formule, sigle consolidate e " +
"nomi propri, e conserva la struttura del documento.\n\n" +
"MAPPE CONCETTUALI: rispondi con un diagramma Mermaid dentro un blocco ```mermaid usando graph TD " +
"(o graph LR se la struttura e' sequenziale), con le relazioni etichettate sugli archi: l'app lo " +
"disegna davvero. Sono supportati nodi [rettangolari], (arrotondati), {a rombo} e ((circolari)).\n\n" +
"CONOSCI QUESTA APP DALL'INTERNO: cerca_nel_database interroga i dati veri di BioSpecInfo — 297 " +
"reazioni di sintesi con condizioni operative, 118 elementi, 67 amminoacidi con pKa e SMILES, 143 " +
"farmaci con meccanismo d'azione ed effetti avversi, 36 interazioni farmacologiche, 29 potenziali " +
"redox, 39 strategie retrosintetiche, 29 vie metaboliche e 63 patologie. Sono materiale curato " +
"dall'autore dell'app: consultalo PRIMA di rispondere a memoria su una reazione, un elemento, un " +
"amminoacido o un farmaco, e di' che viene da BioSpecInfo. Se il database e la tua memoria non " +
"concordano, segnala la discrepanza invece di nasconderla.\n\n" +
"REGOLA FONDAMENTALE SUI NUMERI: non citare mai a memoria una proprieta' numerica di un composto " +
"(massa molecolare, logP, TPSA, donatori/accettori di legame idrogeno, formula, nome IUPAC). " +
"Chiamai prima cerca_pubchem e riporta i valori che ti restituisce, citando PubChem come fonte. " +
"Per la massa molecolare da una formula bruta usa massa_molecolare; per qualsiasi conversione di " +
"unita' usa converti_unita; per una costante fisica usa costante_fisica. Sono strumenti esatti: " +
"usarli e' sempre meglio che stimare. Se uno strumento fallisce, dillo apertamente invece di " +
"rimpiazzarne il risultato con un valore inventato.\n\n" +
"AUTONOMIA: incatena piu' strumenti di tua iniziativa per arrivare a una risposta completa. " +
"Esempio: se ti chiedono se un farmaco e' drug-like, chiama cerca_pubchem per i descrittori, poi " +
"valuta_druglikeness sui valori ottenuti, e infine commenta il risultato. Se l'utente dice 'qui' " +
"o 'questa sezione', chiama stato_app per capire dove si trova prima di rispondere. Non chiedere " +
"il permesso di usare uno strumento: usalo e poi spiega cosa hai trovato.\n\n" +
"COME LAVORI (in quest'ordine):\n" +
"1. CAPISCI cosa serve davvero. Se la domanda e' ambigua su un punto che cambia la risposta, " +
"chiedi; altrimenti procedi con l'interpretazione piu' sensata e dichiarala.\n" +
"2. PIANIFICA: per una richiesta in piu' passaggi, decidi la sequenza di strumenti prima di partire.\n" +
"3. ESEGUI usando gli strumenti, mai la memoria, per qualunque numero.\n" +
"4. VERIFICA prima di rispondere: i conti tornano? l'ordine di grandezza e' plausibile? " +
"il risultato risponde davvero alla domanda posta? Se uno strumento contraddice quello che stavi " +
"per dire, vince lo strumento.\n" +
"5. RISPONDI in modo compatto e ragionato: prima la conclusione, poi il perche', citando le fonti " +
"(PubChem, PubMed) quando le hai usate.\n\n" +
"BILANCIAMENTO E STECHIOMETRIA: usa sempre bilancia_equazione e stechiometria. Sono risolutori " +
"esatti e non sbagliano; bilanciare a occhio sì.\n\n" +
"CALCOLO: hai un motore di calcolo completo. Per QUALUNQUE conto, anche una moltiplicazione, usa " +
"calcola: e' esatto e mostra il passaggio. Per equazioni in una incognita (anche non lineari, " +
"trascendenti, o equilibri con ICE) usa risolvi_equazione. Per medie, deviazioni standard e " +
"regressioni lineari (cinetica ln[A] vs t, rette di taratura, Lambert-Beer) usa analisi_dati.\n\n" +
"CHIMICA FISICA: non limitarti a citare la formula, RISOLVI il problema con lo strumento giusto — " +
"termodinamica (ΔG, K, van 't Hoff, temperatura di inversione), equilibrio_acido_base (pH di acidi " +
"e basi forti/deboli e tamponi, con l'equazione di secondo grado esatta), cinetica (ordini 0/1/2, " +
"tempi di dimezzamento, Arrhenius), gas_e_soluzioni (gas ideali e di van der Waals, proprieta' " +
"colligative, diluizioni), quantistica_e_spettroscopia (fotoni, de Broglie, particella nella " +
"scatola, atomo di idrogeno, Lambert-Beer), elettrochimica (Nernst, ΔG = −nFE°, Faraday).\n\n" +
"ALTRI AMBITI, tutti coperti da uno strumento: spettroscopia (gradi di insaturazione, pattern " +
"isotopico in massa, tabelle IR e NMR, Woodward-Fieser) — e' il cuore di BioSpecInfo, usala ogni " +
"volta che si parla di spettri; biochimica (Michaelis-Menten con inibizioni, massa e pI di un " +
"peptide dalla sequenza, rese in ATP delle vie metaboliche); farmacocinetica (Vd, clearance, " +
"emivita, dosi di carico e mantenimento, accumulo); astrofisica (Wien, Stefan-Boltzmann, " +
"luminosita', redshift, velocita' di fuga, Keplero, zona abitabile) a supporto della sezione " +
"Astrochimica; nucleare (decadimento, datazione, energia di legame); statistica_inferenziale " +
"(test t di Welch e appaiato, chi-quadro, intervalli di confidenza, con p-value ESATTI: non " +
"stimare mai una significativita' a occhio); cristallografia (Bragg, densita' da cella, " +
"impacchettamento).\n\n" +
"Se un problema e' composto, scomponilo: piu' chiamate in sequenza, ognuna verificata, e poi la " +
"sintesi. Dichiara sempre le unita' di misura e controlla che siano coerenti prima di concludere.\n\n" +
"FONTI: se l'utente chiede prove, o se stai per affermare qualcosa di clinicamente o " +
"sperimentalmente rilevante, chiama cerca_letteratura e cita PMID e rivista. Distingui sempre " +
"cio' che e' consolidato da cio' che e' ancora dibattuto.\n\n" +
"RICERCA WEB: con Claude hai la ricerca web integrata. Usala quando serve qualcosa di aggiornato " +
"o fuori dalla chimica pura (linee guida recenti, notizie scientifiche, dati di missioni spaziali, " +
"normative), e cita sempre le fonti con il loro link. Per le proprieta' molecolari resta " +
"preferibile PubChem, e per la letteratura biomedica PubMed: sono banche dati specializzate e " +
"piu' affidabili di una ricerca generica.\n\n" +
"MEMORIA: quando emerge qualcosa di duraturo sull'utente (esame che prepara, argomenti su cui " +
"fatica, come preferisce le spiegazioni) chiama ricorda. Non annunciarlo ogni volta: fallo e basta.\n\n" +
"ONESTA': se non sai, dillo. Se uno strumento fallisce, dillo e spiega cosa manca, invece di " +
"riempire il buco con un valore verosimile. Un dato inventato in chimica puo' essere pericoloso.";

/* ---------------------------------------------------------------------
   4b. RIPARTIRE DA CAPO — cancellazione completa
   Un "cancella cronologia" che lascia in giro le chiavi vecchie non fa
   ripartire da capo: alla riapertura si ritrova lo stesso stato. Peggio,
   cancellare bsi_api_keys senza cancellare bsi_api_key (il formato vecchio,
   a chiave singola) fa RIAPPARIRE la chiave: getKeysMap() la rimigra al
   primo accesso. Per questo l'elenco di cio' che l'app scrive sta qui, in
   un punto solo — aggiungendo una voce ci si ricorda di pulirla.
--------------------------------------------------------------------- */
var DATI_CANCELLABILI = {
  chat: {
    etichetta: 'Chat e cronologia',
    dettaglio: 'tutte le conversazioni salvate e le domande passate',
    chiavi: ['bsi_ai_threads', 'bsi_ai_history']
  },
  chiavi: {
    etichetta: 'Chiavi API e provider',
    dettaglio: 'le chiavi salvate di tutti i servizi, comprese quelle vecchie',
    // bsi_api_key e' il formato a chiave singola delle versioni precedenti:
    // va tolto qui, altrimenti torna da solo. bsi_modello_* sono le scelte
    // di modello in cache, che senza chiave non hanno piu' senso.
    chiavi: ['bsi_api_keys', 'bsi_api_key', 'bsi_ai_provider', 'bsi_proxy_url'],
    prefissi: ['bsi_modello_', 'bsi_gemini_']
  },
  memoria: {
    etichetta: 'Memoria persistente',
    dettaglio: 'ciò che Spectra ha imparato su di te fra una sessione e l\'altra',
    chiavi: ['bsi_ai_memory']
  },
  ripasso: {
    etichetta: 'Ripasso programmato',
    dettaglio: 'le schede di "Ripassa Oggi" e le date di ripetizione',
    chiavi: ['bsi_srs', 'bsi_sm2']
  },
  app: {
    etichetta: 'Progressi del resto dell\'app',
    dettaglio: 'quiz, appunti, percorso di studio, progetti di data science',
    // NON compaiono qui, di proposito: bsi_pro_license e bsi_trial_start
    // (una licenza non si cancella per sbaglio), bsi_device_id e
    // bsi_user_email (identita' del dispositivo).
    chiavi: ['bsi_quiz_history', 'bsi_quiz_progress', 'bsi_studypath', 'bsi_notes',
             'bsi_ds_prog', 'bsi_ds_proj', 'bsi_guide_v3', 'bsi_section'],
    prefissi: ['bsi_note_']
  }
};

// Espande i prefissi leggendo cio' che c'e' davvero in localStorage.
function chiaviDelGruppo(g){
  var out = (g.chiavi || []).slice();
  (g.prefissi || []).forEach(function(pre){
    try{
      for(var i = 0; i < localStorage.length; i++){
        var k = localStorage.key(i);
        if(k && k.indexOf(pre) === 0 && out.indexOf(k) < 0) out.push(k);
      }
    }catch(e){}
  });
  return out;
}

// Quante voci esistono davvero per un gruppo: serve a non promettere di
// cancellare cose che non ci sono.
function contaGruppo(nome){
  var g = DATI_CANCELLABILI[nome];
  if(!g) return 0;
  var n = 0;
  chiaviDelGruppo(g).forEach(function(k){
    try{ if(localStorage.getItem(k) !== null) n++; }catch(e){}
  });
  return n;
}

/* Cancella i gruppi indicati. Le chiavi si raccolgono PRIMA di rimuoverle:
   rimuovere durante un ciclo su localStorage.key(i) fa saltare voci. */
function cancellaDati(nomi){
  var daTogliere = [];
  (nomi || []).forEach(function(n){
    var g = DATI_CANCELLABILI[n];
    if(g) chiaviDelGruppo(g).forEach(function(k){
      if(daTogliere.indexOf(k) < 0) daTogliere.push(k);
    });
  });
  var tolte = 0;
  daTogliere.forEach(function(k){
    try{
      if(localStorage.getItem(k) !== null){ localStorage.removeItem(k); tolte++; }
    }catch(e){}
  });
  // Anche la memoria del processo va azzerata, altrimenti l'elenco dei
  // fornitori del proxy o il modello risolto resterebbero validi fino al
  // prossimo caricamento della pagina.
  if((nomi || []).indexOf('chiavi') >= 0){
    try{
      _proxyAtteso = null; _proxyFornitori = null;
      Object.keys(PROVIDERS).forEach(function(k){
        if(PROVIDERS[k].modelliCandidati) PROVIDERS[k].model = null;
      });
    }catch(e){}
  }
  return tolte;
}
window.bsiDati = { gruppi: DATI_CANCELLABILI, conta: contaGruppo, cancella: cancellaDati };
window.bsiCancellaDati = cancellaDati;

/* ---------------------------------------------------------------------
   5. Thread di chat (multipli, con cronologia) — bsi_ai_threads
--------------------------------------------------------------------- */
function loadThreads(){
  var d = loadJSON('bsi_ai_threads', null);
  if(!d || !Array.isArray(d.threads)){
    d = { threads: [{ id: 't' + Date.now(), title: 'Nuova chat', messages: [], createdAt: Date.now() }], activeId: null };
    d.activeId = d.threads[0].id;
  }
  return d;
}
// Senza un limite, lo storico chat cresce all'infinito in localStorage:
// prima o poi si supera la quota del browser (in genere 5-10MB) e OGNI
// scrittura successiva — incluso il salvataggio della chiave API — fallisce
// in silenzio (era la causa più probabile di "la chiave non si salva").
// Teniamo al massimo le ultime chat/messaggi, ben oltre il necessario per
// l'uso normale, e riproviamo in modo sempre più aggressivo se anche così
// il salvataggio fallisse (storage quasi pieno per altri motivi).
var MAX_THREADS = 30;
var MAX_MSGS_PER_THREAD = 100;
function saveThreads(d){
  try{
    if(d && Array.isArray(d.threads)){
      if(d.threads.length > MAX_THREADS) d.threads = d.threads.slice(0, MAX_THREADS);
      d.threads.forEach(function(t){
        if(t && Array.isArray(t.messages) && t.messages.length > MAX_MSGS_PER_THREAD){
          t.messages = t.messages.slice(-MAX_MSGS_PER_THREAD);
        }
      });
    }
  }catch(e){}
  var ok = saveJSON('bsi_ai_threads', d);
  if(!ok){
    // Fallback estremo: la scrittura è comunque fallita (storage quasi
    // pieno). Tengo solo la chat attiva, ridotta ai 15 messaggi più
    // recenti, per liberare spazio senza far perdere l'ultima conversazione.
    try{
      var t2 = getActiveThread(d);
      if(t2){
        var slim = { threads: [{ id: t2.id, title: t2.title, messages: (t2.messages||[]).slice(-15), createdAt: t2.createdAt }], activeId: t2.id };
        ok = saveJSON('bsi_ai_threads', slim);
      }
    }catch(e){}
  }
  return ok;
}
// Libera spazio riducendo drasticamente lo storico chat salvato: usato come
// ultima risorsa quando anche salvare la chiave API fallisce per storage
// pieno (la chiave, piccolissima, non deve MAI perdersi per colpa della
// cronologia chat).
function pruneThreadsForSpace(){
  try{
    var d = loadThreads();
    d.threads = d.threads.slice(0, 3).map(function(t){
      return { id: t.id, title: t.title, messages: (t.messages||[]).slice(-10), createdAt: t.createdAt };
    });
    saveJSON('bsi_ai_threads', d);
  }catch(e){}
}
function getActiveThread(d){
  var t = d.threads.find(function(x){ return x.id === d.activeId; });
  if(!t){ t = d.threads[0]; d.activeId = t ? t.id : null; }
  return t;
}

/* ---------------------------------------------------------------------
   6. SM-2 — ripetizione dilazionata vera (bsi_srs)
--------------------------------------------------------------------- */
function srsLoad(){ return loadJSON('bsi_srs', { cards: {} }); }
function srsSave(s){ saveJSON('bsi_srs', s); }
function srsUpsertCard(id, front, back, tag){
  var s = srsLoad();
  if(!s.cards[id]){
    s.cards[id] = { id: id, front: front, back: back || '', tag: tag || 'generale',
      ef: 2.5, interval: 0, repetitions: 0, due: Date.now(), lastReview: null, createdAt: Date.now() };
    srsSave(s);
  }
  return s.cards[id];
}
function sm2Grade(card, quality){
  // quality: 0=di nuovo, 3=difficile, 4=buono, 5=facile
  card.ef = card.ef || 2.5;
  card.interval = card.interval || 0;
  card.repetitions = card.repetitions || 0;
  // Il fattore di facilità si ricalcola SEMPRE, anche quando la risposta è
  // sbagliata (SM-2 vero): altrimenti una carta fallita più volte manterrebbe
  // un EF troppo alto e otterrebbe intervalli troppo lunghi appena superata.
  var newEf = card.ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  card.ef = Math.max(1.3, newEf);
  if(quality < 3){
    card.repetitions = 0;
    card.interval = 1;
  } else {
    card.repetitions += 1;
    if(card.repetitions === 1) card.interval = 1;
    else if(card.repetitions === 2) card.interval = 6;
    else card.interval = Math.round(card.interval * card.ef);
  }
  card.due = Date.now() + card.interval * 86400000;
  card.lastReview = Date.now();
  return card;
}
window.bsiSRS = { load: srsLoad, save: srsSave, upsert: srsUpsertCard, grade: sm2Grade };

function srsDueCards(){
  var s = srsLoad();
  var now = Date.now();
  return Object.keys(s.cards).map(function(k){ return s.cards[k]; }).filter(function(c){ return c.due <= now; })
    .sort(function(a,b){ return a.due - b.due; });
}
function srsSeedFromQuiz(){
  // Se l'Accademia ha già segnato domande sbagliate/storico, le trasformo in carte
  var s = srsLoad();
  var added = 0;
  try{
    var hist = loadJSON('bsi_quiz_history', null);
    if(hist && Array.isArray(hist)){
      hist.forEach(function(h, i){
        if(h && h.wrong && h.question && !s.cards['quiz_' + i]){
          srsUpsertCard('quiz_' + i, h.question, h.answer || h.correct || '', h.subject || 'quiz');
          added++;
        }
      });
    }
  }catch(e){}
  return added;
}
window.bsiSRSSeed = srsSeedFromQuiz;

/* ======================================================================
   7. UI — shell con tab, iniettata una sola volta
====================================================================== */
var CSS = [
'#bsi-hub-ov{position:fixed;inset:0;z-index:2147483645;display:none;background:#050b14;}',
'#bsi-hub-ov.open{display:flex;flex-direction:column;}',
'#bsi-hub-top{display:flex;align-items:center;gap:0;background:#071221;border-bottom:2px solid #1a3050;height:50px;padding:0 8px 0 14px;flex-shrink:0;}',
'#bsi-hub-top .ttl{color:#00c9b7;font-weight:800;font-size:.98rem;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
'#bsi-hub-close{background:#0f1e2e;border:1px solid rgba(255,107,107,.35);color:#ff6b6b;border-radius:8px;padding:6px 12px;font-size:.85rem;font-weight:700;cursor:pointer;}',
'#bsi-hub-tabs{display:flex;background:#061019;border-bottom:1px solid #14283c;overflow-x:auto;flex-shrink:0;}',
'.bsi-hub-tab{flex:1;min-width:92px;text-align:center;padding:10px 8px;color:#5a7a94;font-size:.78rem;font-weight:700;cursor:pointer;border-bottom:2px solid transparent;white-space:nowrap;}',
'.bsi-hub-tab.on{color:#00c9b7;border-bottom-color:#00c9b7;}',
'#bsi-hub-body{flex:1;overflow-y:auto;position:relative;background:#0a1420;}',
'.bsi-hub-pane{display:none;height:100%;flex-direction:column;}',
'.bsi-hub-pane.on{display:flex;}',
/* chat */
'#bsi-hub-msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;}',
'.bsi-msg{max-width:88%;padding:10px 13px;border-radius:12px;font-size:.9rem;line-height:1.55;}',
'.bsi-msg.user{align-self:flex-end;background:#0d3b52;color:#e8f4ff;border-bottom-right-radius:3px;}',
'.bsi-msg.assistant{align-self:flex-start;background:#101f30;color:#dbe7f3;border:1px solid #17293c;border-bottom-left-radius:3px;display:flex;gap:9px;align-items:flex-start;padding-left:11px;}',
'.bsi-msg-ava{flex-shrink:0;margin-top:2px;}',
'.bsi-msg-ava.pulse{animation:bsiSpPulse 1.4s ease-in-out infinite;}',
'@keyframes bsiSpPulse{0%,100%{opacity:.55;transform:scale(.92)}50%{opacity:1;transform:scale(1.08)}}',
'.bsi-msg-body{flex:1;min-width:0;}',
'.bsi-typing{color:#5a7a94;letter-spacing:2px;}',
'.bsi-msg.system-note{align-self:center;background:transparent;color:#4d6c86;font-size:.78rem;}',
'.bsi-md-p{margin:0 0 8px;}',
'.bsi-md-p:last-child{margin-bottom:0;}',
'.bsi-md-h{margin:10px 0 6px;color:#5eead4;}',
'.bsi-md-ul,.bsi-md-ol{margin:4px 0 8px;padding-left:20px;}',
'.bsi-md-code{background:#050d16;border:1px solid #1a3050;border-radius:8px;padding:10px;overflow-x:auto;font-size:.82rem;margin:6px 0;}',
'.bsi-md-inline{background:#0d1b2e;border:1px solid #1a3050;border-radius:4px;padding:1px 5px;font-size:.85em;}',
'.bsi-msg-actions{display:flex;gap:8px;margin-top:6px;}',
'.bsi-msg-actions button{background:none;border:none;color:#3d6280;font-size:.72rem;cursor:pointer;padding:2px 4px;}',
'.bsi-msg-actions button:hover{color:#00c9b7;}',
/* pannello del ragionamento in diretta */
'.bsi-think{align-self:flex-start;max-width:88%;background:#0b1622;border:1px solid #17324a;',
'border-left:2px solid #5eead4;border-radius:10px;padding:7px 10px;margin:2px 0;}',
'.bsi-think-h{display:flex;align-items:center;gap:7px;}',
'.bsi-think-dot{width:7px;height:7px;border-radius:50%;background:#5eead4;flex-shrink:0;',
'animation:bsiThinkPulse 1.2s ease-in-out infinite;}',
'@keyframes bsiThinkPulse{0%,100%{opacity:.35;transform:scale(.8)}50%{opacity:1;transform:scale(1.15)}}',
'.bsi-think-t{color:#5eead4;font-size:.78rem;font-weight:700;flex:1;}',
'.bsi-think-x{background:none;border:none;color:#3d6280;font-size:.72rem;cursor:pointer;padding:2px 4px;}',
'.bsi-think-x:hover{color:#5eead4;}',
/* chiuso di default: il ragionamento e' disponibile ma non invade la lettura */
'.bsi-think-b{display:none;margin-top:6px;max-height:190px;overflow-y:auto;color:#93b0c8;',
'font-size:.79rem;line-height:1.5;white-space:pre-wrap;border-top:1px solid #17324a;padding-top:6px;}',
'.bsi-think.open .bsi-think-b{display:block;}',
'.bsi-think.done .bsi-think-dot{animation:none;opacity:.5;}',
'.bsi-turn{display:flex;flex-direction:column;gap:4px;align-items:flex-start;width:100%;}',
/* allegati */
'#bsi-hub-attrow{display:flex;flex-wrap:wrap;gap:6px;padding:0 12px;}',
'#bsi-hub-attrow:not(:empty){padding:8px 12px 0;}',
'.bsi-att{display:flex;align-items:center;gap:6px;background:#0d1b2e;border:1px solid #1a3550;',
'border-radius:9px;padding:4px 6px 4px 4px;max-width:190px;}',
'.bsi-att img{width:30px;height:30px;object-fit:cover;border-radius:5px;flex-shrink:0;}',
'.bsi-att-ic{width:30px;height:30px;display:flex;align-items:center;justify-content:center;',
'background:#122437;border-radius:5px;font-size:15px;flex-shrink:0;}',
'.bsi-att-n{font-size:.74rem;color:#9fb8cf;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
'.bsi-att-x{background:none;border:none;color:#5b7d99;cursor:pointer;font-size:.8rem;padding:0 2px;flex-shrink:0;}',
'.bsi-att-x:hover{color:#ff8a9a;}',
'.bsi-att.err{background:#2a1520;border-color:#5c2436;color:#ffb3c0;font-size:.76rem;padding:6px 9px;max-width:none;}',
'#bsi-hub-msgs.drop{outline:2px dashed #5eead4;outline-offset:-8px;background:#08202a;}',
/* azioni rapide sugli allegati */
'#bsi-hub-actions{display:none;flex-wrap:wrap;gap:6px;align-items:center;padding:8px 12px 0;}',
'.bsi-act-lbl{font-size:.74rem;color:#5b7d99;margin-right:2px;}',
'.bsi-act{background:#0e2a3a;border:1px solid #1d4a5e;color:#7fe3d6;border-radius:14px;',
'padding:5px 11px;font-size:.76rem;font-weight:600;cursor:pointer;font-family:inherit;}',
'.bsi-act:hover{background:#12384c;border-color:#5eead4;}',
/* miniature degli allegati dentro il messaggio inviato */
'.bsi-msg-att{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:6px;}',
'.bsi-msg-att img{width:56px;height:56px;object-fit:cover;border-radius:6px;border:1px solid #2a4a63;}',
'.bsi-msg-att .f{background:#0d2036;border:1px solid #2a4a63;border-radius:6px;padding:5px 8px;',
'font-size:.72rem;color:#9fb8cf;display:flex;align-items:center;gap:5px;}',
/* mappe concettuali */
'.bsi-mermaid{background:#f7fbfa;border:1px solid #1a3550;border-radius:10px;padding:10px;margin:8px 0;overflow-x:auto;}',
'.bsi-mermaid svg{max-width:100%;height:auto;}',
'.bsi-mermaid details{margin-top:8px;font-size:.72rem;color:#5b7d99;}',
'.bsi-mermaid details summary{cursor:pointer;}',
/* tabelle nelle risposte */
'.bsi-md-table{border-collapse:collapse;width:100%;margin:8px 0;font-size:.82rem;display:block;overflow-x:auto;}',
'.bsi-md-table th{background:#0e2a3a;color:#7fe3d6;text-align:left;padding:6px 8px;border:1px solid #1d4a5e;font-weight:700;}',
'.bsi-md-table td{padding:6px 8px;border:1px solid #17324a;color:#cfe0ee;vertical-align:top;}',
'.bsi-md-table tr:nth-child(even) td{background:#0c1b2a;}',
/* ascolto continuo */
'.bsi-wake.on{background:#0e3a34!important;border-color:#5eead4!important;color:#5eead4!important;'
+'animation:bsiWakePulse 1.6s ease-in-out infinite;}',
'@keyframes bsiWakePulse{0%,100%{box-shadow:0 0 0 0 rgba(94,234,212,.45)}50%{box-shadow:0 0 0 6px rgba(94,234,212,0)}}',
'@media (prefers-reduced-motion:reduce){.bsi-wake.on{animation:none;}}',
'@media (prefers-reduced-motion:reduce){.bsi-think-dot{animation:none;}}',
'#bsi-hub-inputrow{display:flex;gap:8px;padding:10px 12px;border-top:1px solid #14283c;background:#071120;flex-shrink:0;align-items:flex-end;}',
'#bsi-hub-input{flex:1;resize:none;max-height:120px;padding:10px 12px;background:#0d1b2e;border:1px solid #1a3550;border-radius:10px;color:#e8f4ff;font-size:.9rem;font-family:inherit;outline:none;}',
'#bsi-hub-input:focus{border-color:#00c9b7;}',
'.bsi-hub-btn{padding:10px 14px;border-radius:10px;border:none;font-weight:700;cursor:pointer;font-size:.85rem;}',
'.bsi-hub-btn.primary{background:linear-gradient(135deg,#1fd39a,#1aa97a);color:#04241a;}',
'.bsi-hub-btn.ghost{background:#0f1e2e;color:#9fb8d0;border:1px solid #1a3550;}',
'.bsi-hub-btn:disabled{opacity:.5;cursor:not-allowed;}',
'#bsi-hub-topbar2{display:flex;gap:8px;padding:8px 12px;align-items:center;border-bottom:1px solid #101f30;flex-wrap:wrap;}',
'#bsi-hub-provsel{background:#0d1b2e;color:#cdd9e6;border:1px solid #1a3550;border-radius:8px;padding:6px 8px;font-size:.8rem;}',
'.bsi-copilot-toggle{display:flex;align-items:center;gap:6px;padding:6px 10px;background:#0f1e2e;border:1px solid #1a3550;border-radius:20px;font-size:.76rem;color:#9fb8d0;user-select:none;white-space:nowrap;}',
'.bsi-copilot-toggle.on{background:linear-gradient(135deg,#1fd39a33,#1aa97a33);border-color:#1fd39a;color:#5eead4;}',
'.bsi-copilot-toggle .dot{width:8px;height:8px;border-radius:50%;background:#3d6280;flex-shrink:0;}',
'.bsi-copilot-toggle.on .dot{background:#1fd39a;box-shadow:0 0 6px #1fd39a;}',
'.bsi-msg.tool-note{align-self:center;background:#0f2a24;color:#5eead4;font-size:.76rem;padding:6px 12px;border-radius:20px;border:1px solid #17453a;}',
'.bsi-suggest-wrap{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;padding:4px 8px 12px;}',
'.bsi-suggest-chip{background:#0f1e2e;border:1px solid #1a3550;color:#9fb8d0;font-size:.8rem;padding:8px 13px;border-radius:16px;cursor:pointer;transition:border-color .15s,color .15s;}',
'.bsi-suggest-chip:hover{border-color:#00c9b7;color:#5eead4;}',
'#bsi-hub-threadsel{background:#0d1b2e;color:#cdd9e6;border:1px solid #1a3550;border-radius:8px;padding:6px 8px;font-size:.8rem;flex:1;min-width:0;}',
'.bsi-hub-mic{background:#0f1e2e;border:1px solid #1a3550;color:#9fb8d0;border-radius:10px;padding:9px 12px;cursor:pointer;}',
'.bsi-hub-mic.rec{background:#3a1e1e;border-color:#ff6b6b;color:#ff6b6b;}',
'#bsi-hub-keybox{margin:12px;padding:14px;background:#0f1e2e;border:1px solid #1a3550;border-radius:12px;}',
'#bsi-hub-proxybadge{margin:12px 12px 0;padding:9px 12px;background:#08251f;border:1px solid #14614f;border-radius:10px;color:#5eead4;font-size:.78rem;font-weight:600;}',
'#bsi-hub-resetbox{margin:12px;padding:14px;background:#1e1015;border:1px solid #5c2733;border-radius:12px;}',
'#bsi-hub-resetbox .tit{color:#ff9d9d;font-weight:700;font-size:.88rem;margin-bottom:6px;}',
'#bsi-hub-resetbox label{display:flex;gap:9px;align-items:flex-start;padding:7px 0;cursor:pointer;font-size:.82rem;color:#e8f4ff;border-top:1px solid #3a1c24;}',
'#bsi-hub-resetbox label:first-of-type{border-top:none;}',
'#bsi-hub-resetbox label.vuoto{opacity:.45;cursor:default;}',
'#bsi-hub-resetbox input[type=checkbox]{margin-top:2px;flex-shrink:0;width:16px;height:16px;accent-color:#ff6b6b;}',
'#bsi-hub-resetbox .det{display:block;color:#9fb3c8;font-size:.74rem;font-weight:400;margin-top:1px;}',
'#bsi-hub-resetbox .btn-danger{background:#8f2436;border:1px solid #b8354a;color:#fff;}',
'#bsi-hub-resetbox .btn-danger:disabled{opacity:.4;cursor:not-allowed;}',
'#bsi-hub-keybox input{width:100%;box-sizing:border-box;padding:9px 10px;background:#0d1b2e;border:1px solid #1a3550;border-radius:8px;color:#e8f4ff;font-size:.85rem;margin-top:8px;}',
'.bsi-hub-note{color:#3d6280;font-size:.76rem;margin-top:8px;line-height:1.5;}',
/* srs */
'.bsi-srs-wrap{padding:16px;overflow-y:auto;}',
'.bsi-srs-count{font-size:2.2rem;font-weight:800;color:#1fd39a;}',
'.bsi-srs-card{background:#101f30;border:1px solid #17293c;border-radius:14px;padding:18px;margin-top:14px;}',
'.bsi-srs-grades{display:flex;gap:8px;margin-top:14px;}',
'.bsi-srs-grades button{flex:1;padding:11px 4px;border-radius:10px;border:none;font-weight:700;font-size:.78rem;cursor:pointer;}',
/* guide gen */
'.bsi-guide-wrap{padding:16px;overflow-y:auto;}',
'.bsi-topic-chip{display:inline-block;margin:4px;padding:7px 12px;border-radius:16px;background:#0f1e2e;border:1px solid #1a3550;color:#9fb8d0;font-size:.82rem;cursor:pointer;}',
'.bsi-topic-chip.on{background:linear-gradient(135deg,#1fd39a,#1aa97a);color:#04241a;border-color:transparent;}',
'.bsi-guide-log{background:#050d16;border:1px solid #1a3050;border-radius:10px;padding:12px;margin-top:14px;font-size:.82rem;color:#8aadcc;max-height:180px;overflow-y:auto;white-space:pre-wrap;}',
].join('\n');

function ensureStyle(){
  if(document.getElementById('bsi-hub-style')) return;
  var st = document.createElement('style'); st.id = 'bsi-hub-style'; st.textContent = CSS;
  document.head.appendChild(st);
}

function el(tag, attrs, html){
  var e = document.createElement(tag);
  if(attrs) Object.keys(attrs).forEach(function(k){ e.setAttribute(k, attrs[k]); });
  if(html != null) e.innerHTML = html;
  return e;
}

/* Icona di Spectra: un "atomo" (chimica) con una scintilla al centro (AI) —
   riconoscibile a colpo d'occhio in qualunque punto dell'app la si usi,
   piccola o grande. SVG inline, nessuna immagine da scaricare.
   Ogni istanza usa un id-gradiente UNIVOCO: con tanti messaggi di chat
   creati/distrutti di continuo, un id duplicato può finire dentro un
   nodo rimosso dal DOM e "rompere" silenziosamente il gradiente anche
   nelle altre copie (bug reale osservato in Chrome). */
var _spectraIconSeq = 0;
function spectraIcon(size, opts){
  opts = opts || {};
  var cls = opts.cls ? (' class="' + opts.cls + '"') : '';
  var style = 'vertical-align:middle;flex-shrink:0' + (opts.style ? (';' + opts.style) : '');
  var gid = 'spGrad' + (_spectraIconSeq++);
  return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 48 48" style="' + style + '"' + cls + ' aria-hidden="true">' +
    '<defs><linearGradient id="' + gid + '" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">' +
    '<stop offset="0" stop-color="#5eead4"/><stop offset="1" stop-color="#00c9b7"/></linearGradient></defs>' +
    '<ellipse cx="24" cy="24" rx="20" ry="7.5" fill="none" stroke="url(#' + gid + ')" stroke-width="2.6"/>' +
    '<ellipse cx="24" cy="24" rx="20" ry="7.5" fill="none" stroke="url(#' + gid + ')" stroke-width="2.6" transform="rotate(60 24 24)"/>' +
    '<ellipse cx="24" cy="24" rx="20" ry="7.5" fill="none" stroke="url(#' + gid + ')" stroke-width="2.6" transform="rotate(120 24 24)"/>' +
    '<path d="M24 16.5 L26.6 21.4 L31.5 24 L26.6 26.6 L24 31.5 L21.4 26.6 L16.5 24 L21.4 21.4 Z" fill="url(#' + gid + ')"/>' +
    '<circle cx="42.5" cy="24" r="2.6" fill="#5eead4"/>' +
    '</svg>';
}
window.bsiSpectraIcon = spectraIcon;

var STATE = { currentTab: 'chat', srsQueue: [], srsIdx: 0, activeRecognitions: [] };

function buildShell(){
  if(document.getElementById('bsi-hub-ov')) return;
  ensureStyle();
  var ov = el('div', { id: 'bsi-hub-ov' });
  ov.innerHTML =
    '<div id="bsi-hub-top"><span class="ttl">' + spectraIcon(21, { style: 'margin-right:7px' }) + 'Spectra — il copilota AI di BioSpecInfo</span><button id="bsi-hub-close">✕ Chiudi</button></div>' +
    '<div id="bsi-hub-tabs">' +
      '<div class="bsi-hub-tab" data-tab="chat">💬 Chat</div>' +
      '<div class="bsi-hub-tab" data-tab="exam">🎓 Esame Orale</div>' +
      '<div class="bsi-hub-tab" data-tab="srs">🔁 Ripassa Oggi</div>' +
      '<div class="bsi-hub-tab" data-tab="guide">📘 Genera Guida</div>' +
    '</div>' +
    '<div id="bsi-hub-body">' +
      '<div class="bsi-hub-pane" id="bsi-pane-chat"></div>' +
      '<div class="bsi-hub-pane" id="bsi-pane-exam"></div>' +
      '<div class="bsi-hub-pane" id="bsi-pane-srs"></div>' +
      '<div class="bsi-hub-pane" id="bsi-pane-guide"></div>' +
    '</div>';
  document.body.appendChild(ov);
  document.getElementById('bsi-hub-close').onclick = closeHub;
  ov.querySelectorAll('.bsi-hub-tab').forEach(function(t){
    t.onclick = function(){ selectTab(t.getAttribute('data-tab')); };
  });
  buildChatPane();
  buildExamPane();
  buildSrsPane();
  buildGuidePane();
}

function selectTab(name){
  STATE.currentTab = name;
  document.querySelectorAll('.bsi-hub-tab').forEach(function(t){ t.classList.toggle('on', t.getAttribute('data-tab') === name); });
  document.querySelectorAll('.bsi-hub-pane').forEach(function(p){ p.classList.remove('on'); });
  var pane = document.getElementById('bsi-pane-' + name);
  if(pane) pane.classList.add('on');
  if(name === 'srs') refreshSrsPane();
}

function closeHub(){
  var ov = document.getElementById('bsi-hub-ov');
  if(ov) ov.classList.remove('open');
  STATE.activeRecognitions.slice().forEach(function(rec){ try{ rec.stop(); }catch(e){} });
}

window.bsiOpenAIHub = function(tab){
  buildShell();
  document.getElementById('bsi-hub-ov').classList.add('open');
  // Difensivo: se la chiave è stata salvata/rimossa da un'altra scheda o
  // dalle Impostazioni mentre l'hub era già stato costruito in questa
  // pagina, il riquadro chiave potrebbe mostrare uno stato non aggiornato
  // alla riapertura. buildShell() è un no-op dopo la prima chiamata, quindi
  // risincronizziamo esplicitamente qui.
  if(window._bsiHubChatInternal && typeof window._bsiHubChatInternal.refreshKeyBox === 'function'){
    try{ window._bsiHubChatInternal.refreshKeyBox(); }catch(e){}
  }
  selectTab(tab || STATE.currentTab || 'chat');
};

/* --------------------------- helpers comuni --------------------------- */
/* Chiavi salvate UNA per provider (bsi_api_keys = {groq:'...', claude:'...', ...}):
   una volta inserita la chiave di un servizio non viene mai più richiesta,
   anche cambiando provider dal menu a tendina — tutto resta salvato in
   locale, per sempre, finché non lo cancelli tu. Migra in automatico
   l'eventuale vecchia chiave singola salvata da versioni precedenti. */
function getKeysMap(){
  var map = loadJSON('bsi_api_keys', null);
  if(!map || typeof map !== 'object') map = {};
  try{
    var legacyKey = localStorage.getItem('bsi_api_key');
    var legacyProv = localStorage.getItem('bsi_ai_provider');
    if(legacyKey && legacyProv && !map[legacyProv]){
      map[legacyProv] = legacyKey;
      saveJSON('bsi_api_keys', map);
    }
  }catch(e){}
  return map;
}
function getSavedProvider(){ try{ return localStorage.getItem('bsi_ai_provider') || 'groq'; }catch(e){ return 'groq'; } }
function setSavedProvider(p){ try{ localStorage.setItem('bsi_ai_provider', p); }catch(e){} }
function getSavedKey(providerId){
  var prov = providerId || getSavedProvider();
  var map = getKeysMap();
  return map[prov] || '';
}
function setSavedKey(k, providerId){
  var prov = providerId || getSavedProvider();
  var map = getKeysMap();
  map[prov] = k;
  var ok = saveJSON('bsi_api_keys', map);
  if(!ok){
    // La chiave API pesa pochi byte: se il salvataggio fallisce è quasi
    // sempre perché lo storage del browser è pieno per colpa di altri dati
    // (tipicamente lo storico chat di Spectra). Libero spazio e riprovo:
    // la chiave non deve MAI andare persa in silenzio.
    try{ pruneThreadsForSpace(); }catch(e){}
    ok = saveJSON('bsi_api_keys', map);
  }
  return ok;
}
function clearSavedKey(providerId){
  var prov = providerId || getSavedProvider();
  var map = getKeysMap();
  delete map[prov];
  saveJSON('bsi_api_keys', map);
}
function hasAnySavedKey(){
  // Col proxy Spectra e' utilizzabile anche senza nessuna chiave salvata.
  if(_proxyFornitori && _proxyFornitori.length) return true;
  var map = getKeysMap();
  return Object.keys(map).some(function(k){ return !!map[k]; });
}

/* La chiave da usare per un provider. Col proxy attivo non ne serve nessuna:
   la mette il server. Qui basta un segnaposto perche' i controlli "manca la
   chiave" non blocchino l'invio. Il segnaposto NON viaggia mai: quando la
   richiesta passa dal proxy, buildRequest omette del tutto l'intestazione di
   autenticazione e non infila la chiave nell'URL. */
var CHIAVE_VIA_PROXY = '(sul server)';
function chiaveDaUsare(providerId){
  if(proxyCopre(providerId)) return CHIAVE_VIA_PROXY;
  return getSavedKey(providerId);
}
function serveChiave(providerId){ return !proxyCopre(providerId) && !getSavedKey(providerId); }
window.bsiHasAnySavedKey = hasAnySavedKey;

function providerSelectHtml(selected){
  return Object.keys(PROVIDERS).map(function(id){
    var p = PROVIDERS[id];
    return '<option value="' + id + '"' + (id === selected ? ' selected' : '') + '>' + p.name + (p.free ? ' · gratis' : '') + '</option>';
  }).join('');
}

function speak(text){
  try{
    if(!('speechSynthesis' in window)) return;
    var u = new SpeechSynthesisUtterance(text.replace(/[*_#`]/g,'').slice(0, 600));
    u.lang = 'it-IT';
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }catch(e){}
}

// Distingue italiano e inglese contando le parole grammaticali tipiche di
// ciascuna lingua. Cercare solo gli accenti non bastava: una frase come
// "La costante di Michaelis rappresenta la concentrazione di substrato" non ne
// contiene nemmeno uno e veniva scambiata per inglese.
var _PAROLE_IT = ['che','non','della','degli','delle','nella','nel','sono','viene','vengono',
                  'questo','questa','come','anche','per','con','una','gli','dei','dal','alla',
                  'essere','quindi','inoltre','ogni','piu','molto','stato','sua','suo'];
var _PAROLE_EN = ['the','of','and','is','are','to','in','with','that','this','from','by',
                  'for','as','it','be','which','can','has','have','was','were','on','an'];
function rilevaLingua(t){
  var s = ' ' + String(t).toLowerCase().replace(/[^a-zàèéìòù\s]/g, ' ').replace(/\s+/g, ' ') + ' ';
  var conta = function(lista){
    var n = 0;
    lista.forEach(function(p){
      var i = 0;
      while((i = s.indexOf(' ' + p + ' ', i)) !== -1){ n++; i += p.length; }
    });
    return n;
  };
  var it = conta(_PAROLE_IT) + (/[àèéìòù]/.test(t) ? 2 : 0);
  var en = conta(_PAROLE_EN);
  if(it !== en) return it > en ? 'it' : 'en';
  // Pareggio: nelle frasi tecniche corte le parole grammaticali possono
  // mancare del tutto. Ricado sulla morfologia — in italiano quasi tutte le
  // parole finiscono per vocale, in inglese circa una su tre.
  var parole = s.trim().split(' ').filter(function(p){ return p.length > 2; });
  if(!parole.length) return 'it';
  var vocale = parole.filter(function(p){ return /[aeiouàèéìòù]$/.test(p); }).length;
  return (vocale / parole.length) >= 0.6 ? 'it' : 'en';
}
window.bsiRilevaLingua = rilevaLingua;

// ── Comando vocale "Hey Spectra" ────────────────────────────────────────────
// Ascolto continuo con parola di attivazione. Il riconoscimento del browser si
// ferma da solo dopo qualche secondo di silenzio, quindi va riavviato: senza
// il riavvio automatico l'ascolto morirebbe dopo la prima pausa.
var _wake = { rec:null, attivo:false, btn:null, ferma:false };

function normalizzaWake(t){
  return String(t).toLowerCase()
    .replace(/[àá]/g, 'a').replace(/[èé]/g, 'e').replace(/[ìí]/g, 'i')
    .replace(/[òó]/g, 'o').replace(/[ùú]/g, 'u')
    .replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

// Riconosce la parola di attivazione e restituisce il comando che segue.
// Accetta le storpiature piu' comuni: il riconoscimento vocale italiano
// trascrive "Spectra" in molti modi diversi.
function estraiComando(testo){
  var t = normalizzaWake(testo);
  var m = t.match(/\b(?:hey|ehi|ei|ok|hei)\s+(?:spectra|spettra|spekt(?:r)?a|spectre|specra|spetra|spectrum)\b[\s,]*(.*)$/);
  if(m) return m[1].trim();
  // pronunciato senza "hey"
  var m2 = t.match(/^(?:spectra|spettra|spekt(?:r)?a|spetra)\b[\s,]*(.+)$/);
  if(m2) return m2[1].trim();
  return null;
}
window.bsiEstraiComando = estraiComando;

function avviaWake(onComando){
  var Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!Rec) return false;
  if(_wake.rec){ try{ _wake.rec.stop(); }catch(e){} }
  var rec = new Rec();
  rec.lang = 'it-IT'; rec.continuous = true; rec.interimResults = false; rec.maxAlternatives = 2;
  rec.onresult = function(e){
    for(var i = e.resultIndex; i < e.results.length; i++){
      if(!e.results[i].isFinal) continue;
      // provo tutte le alternative: la parola di attivazione puo' finire
      // nella seconda trascrizione anche quando la prima non la contiene
      for(var k = 0; k < e.results[i].length; k++){
        var cmd = estraiComando(e.results[i][k].transcript);
        if(cmd){ onComando(cmd); return; }
      }
    }
  };
  rec.onend = function(){
    // riavvio finche' l'utente non spegne: il browser interrompe da solo
    if(!_wake.ferma && _wake.attivo){ try{ rec.start(); }catch(e){} }
    else { _wake.attivo = false; if(_wake.btn) _wake.btn.classList.remove('on'); }
  };
  rec.onerror = function(ev){
    // "not-allowed" significa microfono negato: inutile insistere
    if(ev && (ev.error === 'not-allowed' || ev.error === 'service-not-allowed')){
      _wake.ferma = true; _wake.attivo = false;
      if(_wake.btn){ _wake.btn.classList.remove('on'); _wake.btn.title = 'Microfono negato dal browser'; }
    }
  };
  _wake.rec = rec; _wake.ferma = false; _wake.attivo = true;
  try{ rec.start(); }catch(e){ _wake.attivo = false; return false; }
  return true;
}

function fermaWake(){
  _wake.ferma = true; _wake.attivo = false;
  if(_wake.rec){ try{ _wake.rec.stop(); }catch(e){} }
  if(_wake.btn) _wake.btn.classList.remove('on');
}

function makeWakeButton(onComando){
  var btn = el('button', { class:'bsi-hub-mic bsi-wake', type:'button',
                           title:'Ascolto continuo: di\' "Hey Spectra" seguito dal comando' }, '👂');
  var Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!Rec){ btn.disabled = true; btn.title = 'Riconoscimento vocale non supportato su questo browser'; return btn; }
  _wake.btn = btn;
  btn.onclick = function(){
    if(_wake.attivo){ fermaWake(); return; }
    if(avviaWake(onComando)) btn.classList.add('on');
  };
  return btn;
}

function makeMicButton(onResult){
  var btn = el('button', { class: 'bsi-hub-mic', type: 'button', title: 'Parla' }, '🎤');
  var Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!Rec){ btn.disabled = true; btn.title = 'Riconoscimento vocale non supportato su questo browser'; return btn; }
  var rec = new Rec();
  // Stato di ascolto LOCALE a questa istanza (non condiviso su STATE):
  // Chat ed Esame hanno ciascuno il proprio microfono/pulsante, e uno stato
  // globale condiviso li faceva desincronizzare se entrambi venivano usati
  // nella stessa sessione (uno finiva di ascoltare e resettava lo stato
  // anche per l'altro, ancora attivo).
  var listening = false;
  function untrack(){ var i = STATE.activeRecognitions.indexOf(rec); if(i > -1) STATE.activeRecognitions.splice(i, 1); }
  rec.lang = 'it-IT'; rec.interimResults = false; rec.maxAlternatives = 1;
  rec.onresult = function(e){ onResult(e.results[0][0].transcript); };
  rec.onend = function(){ btn.classList.remove('rec'); listening = false; untrack(); };
  rec.onerror = function(){ btn.classList.remove('rec'); listening = false; untrack(); };
  btn.onclick = function(){
    if(listening){ rec.stop(); return; }
    try{ rec.start(); listening = true; btn.classList.add('rec'); STATE.activeRecognitions.push(rec); }catch(e){}
  };
  return btn;
}

/* ============================ TAB: CHAT ============================ */
// ── Allegati: interfaccia ───────────────────────────────────────────────────
var _allegati = [];   // in attesa di essere inviati con il prossimo messaggio

// Azioni rapide: trasformano un allegato in un prodotto di studio con un tocco.
// Ognuna e' solo un prompt ben scritto, ma toglie all'utente il peso di doverlo
// formulare ogni volta.
var AZIONI_STUDIO = [
  { ic:'📝', nm:'Riassunto', p:'Riassumi il materiale allegato in modo strutturato: titolo, 5-8 punti chiave con le definizioni essenziali, e una riga finale di sintesi. Mantieni la terminologia scientifica esatta.' },
  { ic:'🗺️', nm:'Mappa concettuale', p:'Costruisci una mappa concettuale del materiale allegato. Rispondi con un diagramma Mermaid in un blocco di codice ```mermaid usando "graph TD", con i concetti come nodi e relazioni etichettate sugli archi. Dopo il diagramma aggiungi due righe che spiegano la logica della mappa.' },
  { ic:'📊', nm:'Schema', p:'Trasforma il materiale allegato in uno schema gerarchico a punti e sottopunti, pronto da studiare. Usa il grassetto per i concetti portanti e mantieni le formule esatte.' },
  { ic:'🃏', nm:'Flashcard', p:'Genera 10 flashcard dal materiale allegato, in formato tabella con due colonne: Domanda e Risposta. Le domande devono verificare la comprensione, non la memoria letterale.' },
  { ic:'🎓', nm:'Domande d\'esame', p:'Formula 6 domande d\'esame universitario sul materiale allegato, di difficolta\' crescente, e per ciascuna indica in due righe cosa dovrebbe contenere una risposta completa.' },
  { ic:'🔍', nm:'Spiega',  p:'Analizza il materiale allegato e spiegamelo passo per passo come farebbe un docente, partendo dai prerequisiti. Se contiene formule, strutture o spettri, interpretali esplicitamente.' },
  { ic:'✍️', nm:'Trascrivi', p:'Trascrivi fedelmente il contenuto del materiale allegato, comprese le parti scritte a mano, rispettando la struttura originale (titoli, elenchi, formule). Riporta le formule chimiche e matematiche in forma corretta. Se una parola o un simbolo non e\' leggibile con certezza, scrivi [illeggibile] invece di indovinare, e alla fine elenca i punti dubbi.' },
  { ic:'🇮🇹', nm:'In italiano', p:'Traduci integralmente in italiano il materiale allegato, mantenendo la struttura originale (titoli, elenchi, tabelle, formule). Usa la terminologia scientifica italiana corretta: non tradurre alla lettera i termini tecnici, usa quelli in uso nella letteratura italiana. Lascia invariati nomi propri, sigle riconosciute (DNA, NMR, ATP) e le formule chimiche. Dove un termine inglese non ha un equivalente consolidato, riportalo fra parentesi dopo la traduzione.' },
  { ic:'🇬🇧', nm:'In inglese', p:'Translate the attached material into English in full, keeping the original structure (headings, lists, tables, formulas). Use correct scientific English terminology as used in the international literature, not a literal translation. Leave proper nouns, established acronyms and chemical formulas unchanged. Where an Italian term has no standard English equivalent, give the closest term and add the original in brackets.' },
  { ic:'🔗', nm:'Collega all\'app', p:'Analizza il materiale allegato e collegalo a BioSpecInfo. Nello specifico: (1) indica quali sezioni dell\'app trattano questi argomenti, chiamando stato_app se serve per orientarti, e per ognuna spiega in una riga cosa ci trovera\'; (2) cerca nei database interni con cerca_nel_database le reazioni, gli amminoacidi, i farmaci o le vie metaboliche citati nel materiale, e riporta i dati trovati; (3) cerca con cerca_letteratura 3-4 articoli scientifici reali e pertinenti, citando PMID, rivista e anno. Chiudi con un percorso di studio ordinato che unisca le tre cose.' }
];

function buildAttachUI(inputRow){
  var inp = el('input', { type:'file', multiple:'multiple', style:'display:none',
                          accept:'image/*,application/pdf,text/*,.md,.csv,.json,.mol,.sdf,.smi' });
  var btn = el('button', { class:'bsi-hub-btn ghost', id:'bsi-hub-attach', title:'Allega foto, PDF o appunti' }, '📎');
  btn.onclick = function(e){ e.preventDefault(); inp.click(); };
  inp.onchange = function(){ aggiungiAllegati(inp.files); inp.value = ''; };
  inputRow.insertBefore(btn, document.getElementById('bsi-hub-input'));
  inputRow.appendChild(inp);

  // Trascinamento sull'intera area della chat: e' il gesto piu' naturale su desktop
  var zona = document.getElementById('bsi-hub-msgs');
  if(zona){
    ['dragenter','dragover'].forEach(function(ev){
      zona.addEventListener(ev, function(e){ e.preventDefault(); zona.classList.add('drop'); });
    });
    ['dragleave','drop'].forEach(function(ev){
      zona.addEventListener(ev, function(e){ e.preventDefault(); zona.classList.remove('drop'); });
    });
    zona.addEventListener('drop', function(e){
      if(e.dataTransfer && e.dataTransfer.files) aggiungiAllegati(e.dataTransfer.files);
    });
  }
  // Incolla direttamente uno screenshot dagli appunti
  var ta = document.getElementById('bsi-hub-input');
  if(ta) ta.addEventListener('paste', function(e){
    var it = (e.clipboardData && e.clipboardData.items) || [];
    var imgs = [];
    for(var i = 0; i < it.length; i++) if(it[i].type && it[i].type.indexOf('image/') === 0){
      var f = it[i].getAsFile(); if(f) imgs.push(f);
    }
    if(imgs.length){ e.preventDefault(); aggiungiAllegati(imgs); }
  });
  renderAzioni();
}

function aggiungiAllegati(fileList){
  var arr = Array.prototype.slice.call(fileList || []);
  arr.forEach(function(f){
    leggiAllegato(f).then(function(a){
      _allegati.push(a);
      renderAllegati(); renderAzioni();
    }).catch(function(err){
      var row = document.getElementById('bsi-hub-attrow');
      if(row){
        var e2 = el('div', { class:'bsi-att err' }, '⚠️ ' + escapeHtml(err.message));
        row.appendChild(e2);
        setTimeout(function(){ if(e2.parentNode) e2.parentNode.removeChild(e2); }, 6000);
      }
    });
  });
}

function renderAllegati(){
  var row = document.getElementById('bsi-hub-attrow');
  if(!row) return;
  row.innerHTML = '';
  _allegati.forEach(function(a, i){
    var chip = el('div', { class:'bsi-att' });
    var icona = a.kind === 'image' ? '' : (a.kind === 'pdf' ? '📄' : '📃');
    chip.innerHTML =
      (a.anteprima ? '<img src="' + a.anteprima + '" alt="">' : '<span class="bsi-att-ic">' + icona + '</span>') +
      '<span class="bsi-att-n">' + escapeHtml(a.name.length > 22 ? a.name.slice(0, 20) + '…' : a.name) + '</span>' +
      '<button class="bsi-att-x" title="Rimuovi">✕</button>';
    chip.querySelector('.bsi-att-x').onclick = function(){
      _allegati.splice(i, 1); renderAllegati(); renderAzioni();
    };
    row.appendChild(chip);
  });
}

function renderAzioni(){
  var box = document.getElementById('bsi-hub-actions');
  if(!box) return;
  // le azioni compaiono solo quando c'e' qualcosa da elaborare
  if(!_allegati.length){ box.innerHTML = ''; box.style.display = 'none'; return; }
  box.style.display = 'flex';
  box.innerHTML = '<span class="bsi-act-lbl">Cosa ne faccio?</span>';
  AZIONI_STUDIO.forEach(function(a){
    var c = el('button', { class:'bsi-act' }, a.ic + ' ' + a.nm);
    c.onclick = function(){
      var t = document.getElementById('bsi-hub-input');
      t.value = a.p;
      var s = document.getElementById('bsi-hub-send');
      if(s) s.click();
    };
    box.appendChild(c);
  });
}

function buildChatPane(){
  var pane = document.getElementById('bsi-pane-chat');
  pane.innerHTML =
    '<div id="bsi-hub-topbar2">' +
      '<select id="bsi-hub-threadsel"></select>' +
      '<button class="bsi-hub-btn ghost" id="bsi-hub-newchat">＋ Nuova</button>' +
      '<select id="bsi-hub-provsel">' + providerSelectHtml(getSavedProvider()) + '</select>' +
      '<div class="bsi-copilot-toggle on" id="bsi-copilot-toggle" title="Spectra puo\' sempre aprire sezioni, strumenti e cercare molecole per te — nessuna attivazione necessaria"><span class="dot"></span><span>🧭 Copilota attivo</span></div>' +
      '<button class="bsi-hub-btn ghost" id="bsi-hub-reset" title="Cancella chat, cronologia e chiavi API salvate">🗑 Cancella tutto</button>' +
    '</div>' +
    '<div id="bsi-hub-resetbox" style="display:none"></div>' +
    '<div id="bsi-hub-keybox" style="display:none">' +
      '<div style="color:#00d4aa;font-weight:700;font-size:.85rem">🔑 Configura ' + '<span id="bsi-hub-provname"></span></div>' +
      '<div class="bsi-hub-note" id="bsi-hub-keylink"></div>' +
      '<input type="password" id="bsi-hub-keyinput" placeholder="Incolla qui la tua API key…"/>' +
      '<div style="display:flex;gap:8px;margin-top:8px">' +
        '<button class="bsi-hub-btn primary" id="bsi-hub-savekey">Salva</button>' +
        '<button class="bsi-hub-btn ghost" id="bsi-hub-clearkey">Rimuovi chiave salvata</button>' +
      '</div>' +
      '<div class="bsi-hub-note">La chiave resta solo in questo browser (localStorage): non viene mai inviata a server di BioSpecInfo, solo al provider scelto.</div>' +
    '</div>' +
    '<div id="bsi-hub-proxybadge" style="display:none"></div>' +
    '<div id="bsi-hub-msgs"></div>' +
    '<div id="bsi-hub-attrow"></div>' +
    '<div id="bsi-hub-actions"></div>' +
    '<div id="bsi-hub-inputrow">' +
      '<textarea id="bsi-hub-input" rows="1" placeholder="Chiedi qualsiasi cosa, oppure allega foto, appunti o un PDF…"></textarea>' +
    '</div>';

  var provSel = document.getElementById('bsi-hub-provsel');
  var keyBox = document.getElementById('bsi-hub-keybox');
  var inputRow = document.getElementById('bsi-hub-inputrow');
  inputRow.insertBefore(makeMicButton(function(text){
    var inp = document.getElementById('bsi-hub-input');
    inp.value = (inp.value ? inp.value + ' ' : '') + text;
  }), document.getElementById('bsi-hub-input'));
  buildAttachUI(inputRow);
  // "Hey Spectra ..." — il comando riconosciuto viene mostrato e inviato da solo
  inputRow.insertBefore(makeWakeButton(function(comando){
    var inp = document.getElementById('bsi-hub-input');
    if(!inp || !comando) return;
    inp.value = comando;
    var box = document.getElementById('bsi-hub-msgs');
    if(box){
      var n = el('div', { class:'bsi-msg system-note' }, '👂 « ' + escapeHtml(comando) + ' »');
      box.appendChild(n); box.scrollTop = box.scrollHeight;
    }
    var s = document.getElementById('bsi-hub-send');
    if(s) s.click();
  }), document.getElementById('bsi-hub-input'));
  var sendBtn = el('button', { class: 'bsi-hub-btn primary', id: 'bsi-hub-send' }, 'Invia →');
  inputRow.appendChild(sendBtn);
  var stopBtn = el('button', { class: 'bsi-hub-btn ghost', id: 'bsi-hub-stop', style: 'display:none' }, '■ Stop');
  inputRow.appendChild(stopBtn);

  // Ogni provider ricorda la propria chiave per sempre (bsi_api_keys):
  // una volta salvata non viene più richiesta, anche cambiando provider.
  function refreshKeyBox(){
    var prov = provSel.value;
    // Col proxy la chiave sta sul server: non va chiesta, e dirlo evita che
    // l'utente pensi di doverne inserire una comunque.
    var viaServer = proxyCopre(prov);
    keyBox.style.display = (viaServer || getSavedKey(prov)) ? 'none' : 'block';
    var badge = document.getElementById('bsi-hub-proxybadge');
    if(badge){
      badge.style.display = viaServer ? 'block' : 'none';
      badge.textContent = '🔓 ' + PROVIDERS[prov].name + ' — nessuna chiave necessaria: la mette il server.';
    }
    document.getElementById('bsi-hub-provname').textContent = PROVIDERS[prov].name;
    document.getElementById('bsi-hub-keylink').textContent = 'Ottieni una chiave gratuita su ' + PROVIDERS[prov].keyLink + (PROVIDERS[prov].note ? ' — ' + PROVIDERS[prov].note : '');
    document.getElementById('bsi-hub-keyinput').placeholder = PROVIDERS[prov].placeholder;
  }
  provSel.value = getSavedProvider();
  refreshKeyBox();
  // Il proxy risponde in un attimo, ma non subito: quando si sa quali
  // fornitori copre, il riquadro si aggiorna da solo.
  proxyStato().then(function(){ try{ refreshKeyBox(); }catch(e){} });
  provSel.onchange = function(){ setSavedProvider(provSel.value); refreshKeyBox(); };

  document.getElementById('bsi-hub-savekey').onclick = function(){
    var v = document.getElementById('bsi-hub-keyinput').value.trim();
    if(!v) return;
    var savedOk = setSavedKey(v, provSel.value); setSavedProvider(provSel.value);
    document.getElementById('bsi-hub-keyinput').value = '';
    refreshKeyBox();
    if(!savedOk){
      // Non nascondo un fallimento: senza questo avviso l'utente crede di
      // aver salvato la chiave e si ritrova a doverla reinserire ogni volta.
      var note = document.getElementById('bsi-hub-keybox');
      if(note){
        var warn = document.createElement('div');
        warn.className = 'bsi-hub-note';
        warn.style.color = '#ff9d9d';
        warn.textContent = '⚠ Impossibile salvare la chiave: la memoria del browser è piena. Prova a liberare spazio (Impostazioni → Esporta/Cancella dati) o usa una scheda di navigazione normale (non in incognito).';
        note.appendChild(warn);
      }
    }
  };
  document.getElementById('bsi-hub-clearkey').onclick = function(){ clearSavedKey(provSel.value); refreshKeyBox(); };

  // thread select
  function refreshThreadSel(){
    var d = loadThreads();
    var sel = document.getElementById('bsi-hub-threadsel');
    sel.innerHTML = d.threads.map(function(t){
      var label = t.title || 'Chat';
      return '<option value="' + t.id + '"' + (t.id === d.activeId ? ' selected' : '') + '>' + escapeHtml(label) + '</option>';
    }).join('');
  }
  refreshThreadSel();
  document.getElementById('bsi-hub-threadsel').onchange = function(e){
    var d = loadThreads(); d.activeId = e.target.value; saveThreads(d); renderMessages();
  };
  document.getElementById('bsi-hub-newchat').onclick = function(){
    var d = loadThreads();
    var t = { id: 't' + Date.now(), title: 'Nuova chat', messages: [], createdAt: Date.now() };
    d.threads.unshift(t); d.activeId = t.id; saveThreads(d);
    refreshThreadSel(); renderMessages();
  };

  /* --- Cancella tutto ------------------------------------------------
     E' irreversibile e non c'e' copia da nessuna parte, quindi: si mostra
     PRIMA cosa verra' tolto (e cosa no), le voci vuote sono disattivate, e
     serve un secondo clic esplicito. Le prime tre voci sono quelle chieste
     — chat, cronologia, chiavi — e sono spuntate di partenza; le altre due
     restano da spuntare a mano perche' cancellano lavoro che non c'entra
     con il "ricominciare da capo" della chat. */
  var resetBox = document.getElementById('bsi-hub-resetbox');
  var PREDEFINITI = ['chat', 'chiavi'];
  function disegnaReset(){
    var righe = Object.keys(DATI_CANCELLABILI).map(function(nome){
      var g = DATI_CANCELLABILI[nome];
      var n = contaGruppo(nome);
      var vuoto = n === 0;
      return '<label class="' + (vuoto ? 'vuoto' : '') + '">' +
        '<input type="checkbox" data-g="' + nome + '"' +
          (vuoto ? ' disabled' : (PREDEFINITI.indexOf(nome) >= 0 ? ' checked' : '')) + '>' +
        '<span><b>' + escapeHtml(g.etichetta) + '</b>' +
          (vuoto ? ' <span style="color:#6b8299">(già vuoto)</span>' : '') +
          '<span class="det">' + escapeHtml(g.dettaglio) + '</span></span></label>';
    }).join('');
    resetBox.innerHTML =
      '<div class="tit">🗑 Cancellare e ricominciare da capo?</div>' +
      '<div class="bsi-hub-note" style="margin-bottom:8px">Scegli cosa togliere. ' +
        'L\'operazione è <b>definitiva</b>: questi dati stanno solo in questo browser e non esiste una copia.</div>' +
      righe +
      '<div class="bsi-hub-note" style="margin-top:9px">Non vengono toccati: la licenza PRO, ' +
        'il periodo di prova e l\'identità del dispositivo.</div>' +
      '<div style="display:flex;gap:8px;margin-top:11px">' +
        '<button class="bsi-hub-btn btn-danger" id="bsi-reset-vai">Sì, cancella</button>' +
        '<button class="bsi-hub-btn ghost" id="bsi-reset-annulla">Annulla</button>' +
      '</div>';

    var vai = document.getElementById('bsi-reset-vai');
    function aggiornaVai(){
      vai.disabled = !resetBox.querySelector('input[type=checkbox]:checked');
    }
    Array.prototype.forEach.call(resetBox.querySelectorAll('input[type=checkbox]'),
      function(c){ c.onchange = aggiornaVai; });
    aggiornaVai();

    document.getElementById('bsi-reset-annulla').onclick = function(){
      resetBox.style.display = 'none';
    };
    vai.onclick = function(){
      var scelti = Array.prototype.map.call(
        resetBox.querySelectorAll('input[type=checkbox]:checked'),
        function(c){ return c.getAttribute('data-g'); });
      var tolte = cancellaDati(scelti);
      resetBox.style.display = 'none';
      // Lo stato a video va ricostruito subito: senza, resterebbero a
      // schermo chat che non esistono piu' in memoria.
      refreshThreadSel(); renderMessages(); refreshKeyBox();
      provSel.value = getSavedProvider();
      proxyStato().then(function(){ try{ refreshKeyBox(); }catch(e){} });
      var box = document.getElementById('bsi-hub-msgs');
      if(box){
        box.appendChild(el('div', { class: 'bsi-msg system-note' },
          '🗑 Fatto: ' + tolte + (tolte === 1 ? ' voce rimossa' : ' voci rimosse') +
          '. Spectra riparte da capo.'));
        box.scrollTop = box.scrollHeight;
      }
    };
  }
  document.getElementById('bsi-hub-reset').onclick = function(){
    if(resetBox.style.display === 'block'){ resetBox.style.display = 'none'; return; }
    disegnaReset();                 // ridisegnato ogni volta: i conteggi cambiano
    resetBox.style.display = 'block';
    if(resetBox.scrollIntoView) resetBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  var SUGGESTED_PROMPTS = [
    { icon: '💬', text: 'Spiega la glicolisi passo per passo' },
    { icon: '🧭', text: 'Aprimi la tavola periodica' },
    { icon: '🔍', text: 'Cercami la caffeina' },
    { icon: '🎓', text: 'Interrogami su biochimica' }
  ];
  function renderMessages(){
    var d = loadThreads();
    var t = getActiveThread(d);
    var box = document.getElementById('bsi-hub-msgs');
    box.innerHTML = '';
    if(!t.messages.length){
      var intro = el('div', { class: 'bsi-msg system-note' },
        'Ciao, sono <b style="color:#5eead4">Spectra</b> — il copilota AI di BioSpecInfo. Posso navigare l\'app per te, non solo parlartene. Prova:');
      box.appendChild(intro);
      var chipsWrap = el('div', { class: 'bsi-suggest-wrap' });
      SUGGESTED_PROMPTS.forEach(function(sp){
        var chip = el('div', { class: 'bsi-suggest-chip' }, sp.icon + ' ' + escapeHtml(sp.text));
        chip.onclick = function(){
          var inp = document.getElementById('bsi-hub-input');
          inp.value = sp.text;
          inp.focus();
        };
        chipsWrap.appendChild(chip);
      });
      box.appendChild(chipsWrap);
    }
    t.messages.forEach(function(m, idx){ box.appendChild(renderMsgNode(m, idx, t)); });
    box.scrollTop = box.scrollHeight;
  }

  // Ricostruisce il pannello del ragionamento a partire dal testo salvato.
  // Serve perche' a fine turno renderMessages() ricostruisce tutta la chat dai
  // messaggi memorizzati: senza questo, il ragionamento mostrato in diretta
  // sparirebbe appena finita la risposta.
  function thinkNodeFor(text){
    var n = el('div', { class: 'bsi-think done' });
    n.innerHTML = '<div class="bsi-think-h"><span class="bsi-think-dot"></span>' +
      '<span class="bsi-think-t">Ragionamento</span>' +
      '<button class="bsi-think-x" type="button">mostra</button></div>' +
      '<div class="bsi-think-b"></div>';
    n.querySelector('.bsi-think-b').textContent = text;
    var tog = n.querySelector('.bsi-think-x');
    tog.onclick = function(){
      var open = n.classList.toggle('open');
      tog.textContent = open ? 'nascondi' : 'mostra';
    };
    return n;
  }

  // Disegna i blocchi ```mermaid come diagrammi, con il renderer interno.
  // Nessun CDN: funziona anche senza rete, coerentemente con l'app offline-first.
  // Se il diagramma usa una sintassi non coperta, il blocco resta come codice
  // leggibile invece di sparire.
  function renderMermaid(root){
    if(!root) return;
    [].slice.call(root.querySelectorAll('pre code'))
      .filter(function(c){ return /^\s*(graph|flowchart)\s+(TD|TB|LR|RL|BT)\b/i.test(c.textContent); })
      .forEach(function(code){
        var pre = code.parentNode;
        if(!pre || pre.dataset.reso) return;
        var svg;
        try{ svg = grafoToSvg(code.textContent); }catch(e){ svg = null; }
        if(!svg) return;
        pre.dataset.reso = '1';
        var box = document.createElement('div');
        box.className = 'bsi-mermaid';
        box.innerHTML = svg;
        // il codice resta consultabile, ripiegato sotto al disegno
        var det = document.createElement('details');
        det.innerHTML = '<summary>codice della mappa</summary>';
        det.appendChild(pre.cloneNode(true));
        box.appendChild(det);
        pre.parentNode.replaceChild(box, pre);
      });
  }

  // Esporta una risposta in PDF aprendo una finestra impaginata e chiamando la
  // stampa del browser: da li' si sceglie "Salva come PDF". E' lo stesso
  // meccanismo gia' usato altrove nell'app, funziona su desktop e su mobile e
  // non richiede alcuna libreria.
  function esportaPdf(testo, domanda, nodoReso){
    var corpo = nodoReso ? nodoReso.cloneNode(true) : null;
    if(corpo){
      // tolgo i pulsanti e apro le mappe ripiegate: in stampa devono vedersi
      var az = corpo.querySelector('.bsi-msg-actions');
      if(az) az.remove();
      [].slice.call(corpo.querySelectorAll('details')).forEach(function(d){ d.remove(); });
    }
    var html = corpo ? corpo.innerHTML : escapeHtml(testo).replace(/\n/g, '<br>');
    var data = new Date().toLocaleDateString('it-IT', { day:'2-digit', month:'long', year:'numeric' });
    var w = window.open('', '_blank');
    if(!w){ alert('Il browser ha bloccato la finestra. Consenti i popup per esportare in PDF.'); return; }
    w.document.write(
      '<!doctype html><html lang="it"><head><meta charset="utf-8">' +
      '<title>' + escapeHtml((domanda || 'Spectra').slice(0, 60)) + '</title><style>' +
      '@page{size:A4;margin:18mm 16mm}' +
      'body{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;font-size:11pt;line-height:1.6;color:#16232e;margin:0}' +
      '.tit{font-size:16pt;font-weight:800;color:#0b5f57;border-bottom:2px solid #00c9b7;padding-bottom:6px;margin-bottom:4px}' +
      '.meta{font-size:8.5pt;color:#7b93a4;margin-bottom:16px}' +
      'h1,h2,h3{color:#0b5f57;margin:14px 0 6px} h1{font-size:15pt} h2{font-size:13pt} h3{font-size:11.5pt}' +
      'table{border-collapse:collapse;width:100%;margin:10px 0;font-size:10pt;page-break-inside:avoid}' +
      'th{background:#e8f6f4;color:#0b5f57;text-align:left;padding:5px 7px;border:1px solid #bfe0dc}' +
      'td{padding:5px 7px;border:1px solid #d8e4e2;vertical-align:top}' +
      'code{background:#f0f4f6;padding:1px 4px;border-radius:3px;font-size:9.5pt}' +
      'pre{background:#f4f7f8;border:1px solid #dde7ea;padding:9px;border-radius:6px;font-size:9pt;white-space:pre-wrap}' +
      'ul,ol{margin:6px 0 6px 20px} li{margin:3px 0}' +
      'svg{max-width:100%;height:auto;page-break-inside:avoid}' +
      '.bsi-mermaid{border:1px solid #cfe3e0;border-radius:8px;padding:8px;margin:10px 0;background:#f7fbfa}' +
      '.foot{margin-top:22px;padding-top:8px;border-top:1px solid #dde7ea;font-size:8pt;color:#8aa3b2}' +
      '</style></head><body>' +
      (domanda ? '<div class="tit">' + escapeHtml(domanda.slice(0, 120)) + '</div>' : '<div class="tit">Spectra</div>') +
      '<div class="meta">BioSpecInfo · Spectra — ' + data + '</div>' +
      html +
      '<div class="foot">Generato da Spectra, il copilota AI di BioSpecInfo. ' +
      'Verifica sempre i contenuti prima di usarli per uno studio formale.</div>' +
      '</body></html>');
    w.document.close();
    // il ritardo lascia impaginare il contenuto (e disegnare gli SVG) prima della stampa
    setTimeout(function(){ try{ w.focus(); w.print(); }catch(e){} }, 350);
  }

  function renderMsgNode(m, idx, thread){
    if(m.role === 'assistant' && (m.thinking || (m.tools && m.tools.length))){
      // avvolgo ragionamento + strumenti usati + risposta, cosi' restano associati
      var wrap = el('div', { class: 'bsi-turn' });
      if(m.thinking) wrap.appendChild(thinkNodeFor(m.thinking));
      (m.tools || []).forEach(function(lbl){
        wrap.appendChild(el('div', { class: 'bsi-msg tool-note' }, escapeHtml(lbl)));
      });
      wrap.appendChild(renderMsgNode({ role: m.role, content: m.content }, idx, thread));
      return wrap;
    }
    var node = el('div', { class: 'bsi-msg ' + m.role });
    if(m.role === 'assistant'){
      node.appendChild(el('div', { class: 'bsi-msg-ava' }, spectraIcon(16)));
      var body = el('div', { class: 'bsi-msg-body' }, mdToHtml(m.content));
      if(m.content){
        var actions = el('div', { class: 'bsi-msg-actions' });
        var copyBtn = el('button', {}, '📋 Copia');
        copyBtn.onclick = function(){ try{ navigator.clipboard.writeText(m.content); }catch(e){} };
        var speakBtn = el('button', {}, '🔊 Ascolta');
        speakBtn.onclick = function(){ speak(m.content); };
        var pinBtn = el('button', {}, '📌 Ripassa');
        pinBtn.onclick = function(){
          var q = (thread.messages[idx-1] && thread.messages[idx-1].role === 'user') ? thread.messages[idx-1].content : 'Domanda';
          srsUpsertCard('chat_' + thread.id + '_' + idx, q, m.content, 'chat');
          pinBtn.textContent = '✓ Aggiunta';
        };
        var pdfBtn = el('button', {}, '📄 PDF');
        pdfBtn.title = 'Apri una versione stampabile: dal dialogo scegli "Salva come PDF"';
        pdfBtn.onclick = function(){
          var domanda = (thread.messages[idx - 1] && thread.messages[idx - 1].role === 'user')
            ? thread.messages[idx - 1].content : '';
          esportaPdf(m.content, domanda, body);
        };
        // traduce la risposta gia' ricevuta, senza doverla riscrivere a mano
        var trBtn = el('button', {}, '🌍 Traduci');
        trBtn.title = 'Traduci questa risposta in italiano o in inglese';
        trBtn.onclick = function(){
          var verso = (rilevaLingua(m.content) === 'it') ? 'inglese' : 'italiano';
          var inp = document.getElementById('bsi-hub-input');
          if(!inp) return;
          inp.value = (verso === 'inglese'
            ? 'Translate your previous answer into English in full, keeping the structure, tables and formulas. Use correct scientific terminology.'
            : 'Traduci integralmente in italiano la tua risposta precedente, mantenendo struttura, tabelle e formule. Usa la terminologia scientifica italiana corretta.');
          var s = document.getElementById('bsi-hub-send');
          if(s) s.click();
        };
        actions.appendChild(copyBtn); actions.appendChild(speakBtn); actions.appendChild(pinBtn);
        actions.appendChild(trBtn); actions.appendChild(pdfBtn);
        body.appendChild(actions);
      }
      node.appendChild(body);
      renderMermaid(body);
    } else {
      // miniature degli allegati sopra il testo del messaggio inviato
      if(m.allegati && m.allegati.length){
        var att = el('div', { class:'bsi-msg-att' });
        m.allegati.forEach(function(a){
          if(a.anteprima) att.appendChild(el('img', { src:a.anteprima, alt:escapeHtml(a.name) }));
          else att.appendChild(el('div', { class:'f' }, (a.kind === 'pdf' ? '📄 ' : '📃 ') + escapeHtml(a.name)));
        });
        node.appendChild(att);
        node.appendChild(el('div', {}, escapeHtml(m.content)));
        return node;
      }
      node.textContent = m.content;
    }
    return node;
  }

  // Copilota: SEMPRE attivo, nessuna attivazione manuale — Spectra puo'
  // sempre navigare l'app (naviga_sezione/apri_strumento/cerca_molecola)
  // invece di limitarsi a descriverla a parole. Il badge in alto è solo
  // uno stato informativo, non un interruttore.

  var abortFlag = { stop: false };
  async function send(){
    var input = document.getElementById('bsi-hub-input');
    var text = input.value.trim();
    if(!text) return;
    var provId = provSel.value;
    var apiKey = chiaveDaUsare(provId);
    if(!apiKey){
      // Prima: usciva senza dire nulla — sembrava che Spectra "non
      // rispondesse", mentre in realtà mancava solo la chiave API (magari
      // il riquadro era scomparso dalla vista sullo schermo). Ora lo
      // segnaliamo chiaramente, sia riaprendo il riquadro sia con un
      // messaggio in chat.
      refreshKeyBox();
      var keyBoxEl = document.getElementById('bsi-hub-keybox');
      if(keyBoxEl && keyBoxEl.scrollIntoView) keyBoxEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      var msgsBox0 = document.getElementById('bsi-hub-msgs');
      if(msgsBox0){
        var warnNode = el('div', { class: 'bsi-msg system-note' },
          '⚠ Inserisci prima la tua API key di <b>' + escapeHtml(PROVIDERS[provId].name) + '</b> qui sopra: senza chiave Spectra non può rispondere.');
        msgsBox0.appendChild(warnNode);
        msgsBox0.scrollTop = msgsBox0.scrollHeight;
      }
      return;
    }
    input.value = '';
    var d = loadThreads();
    var t = getActiveThread(d);
    if(t.title === 'Nuova chat') t.title = text.slice(0, 40);
    // gli allegati in attesa partono con questo messaggio e poi la barra si svuota
    var allegatiInvio = _allegati.slice();
    // Il tetto di pagine dipende dal modello: se e' stato cambiato DOPO aver
    // allegato, un PDF prima valido puo' non esserlo piu'. Meglio dirlo qui che
    // lasciar fallire la richiesta con un errore dell'API.
    var tettoOra = limitePagine(provId);
    var troppoLungo = allegatiInvio.filter(function(a){ return a.kind === 'pdf' && a.pagine && a.pagine > tettoOra; });
    if(troppoLungo.length){
      var alt2 = provinciaAdatta(troppoLungo[0].pagine);
      var box0 = document.getElementById('bsi-hub-msgs');
      if(box0){
        box0.appendChild(el('div', { class:'bsi-msg system-note' },
          '⚠ "' + escapeHtml(troppoLungo[0].name) + '" ha ' + troppoLungo[0].pagine + ' pagine: ' +
          escapeHtml(PROVIDERS[provId].name) + ' ne regge ' + tettoOra + '.' +
          (alt2 ? ' Passa a <b>' + escapeHtml(alt2) + '</b> per inviarlo.' : '')));
        box0.scrollTop = box0.scrollHeight;
      }
      input.value = text;   // non perdo quello che aveva scritto
      return;
    }
    var msgUtente = { role: 'user', content: text };
    if(allegatiInvio.length){
      // nella cronologia salvo solo i metadati: le immagini in base64
      // riempirebbero localStorage in pochi messaggi
      msgUtente.allegati = allegatiInvio.map(function(a){
        // nella cronologia va la MINIATURA, non l'immagine inviata al modello
        return { name:a.name, kind:a.kind, anteprima:a.kind === 'image' ? (a.miniatura || a.anteprima) : null };
      });
    }
    t.messages.push(msgUtente);
    saveThreads(d);
    _allegati = []; renderAllegati(); renderAzioni();
    renderMessages();

    var box = document.getElementById('bsi-hub-msgs');
    var liveNode = el('div', { class: 'bsi-msg assistant' });
    liveNode.appendChild(el('div', { class: 'bsi-msg-ava pulse' }, spectraIcon(16)));
    var liveBody = el('div', { class: 'bsi-msg-body' }, '<span class="bsi-typing">…</span>');
    liveNode.appendChild(liveBody);
    box.appendChild(liveNode); box.scrollTop = box.scrollHeight;

    sendBtn.disabled = true; sendBtn.style.display = 'none'; stopBtn.style.display = 'inline-block';
    abortFlag.stop = false;
    var abortCtrl = (typeof AbortController === 'function') ? new AbortController() : null;

    var sys = BASE_SYSTEM + memoryPrompt() + buildGrounding(text);
    // 12 messaggi erano pochi: in una conversazione tecnica il contesto si perdeva
    // a meta' discorso. Opus 5 ha 1M di finestra, 40 turni non sono un problema.
    var history = t.messages.slice(-40).map(function(m){ return { role: m.role, content: m.content }; });
    // I file completi vengono allegati solo all'ultimo messaggio: rimandare le
    // immagini ad ogni turno moltiplicherebbe i costi senza aggiungere nulla.
    if(allegatiInvio.length && history.length) history[history.length - 1].files = allegatiInvio;

    stopBtn.onclick = function(){ abortFlag.stop = true; if(abortCtrl) abortCtrl.abort(); };

    try{
      var acc = '';
      var thinkNode = null, thinkAcc = '', toolLog = [], _budgetDetto = false;
      await runAgentTurn(provId, apiKey, history, sys, {
        onToken: function(tok, full){
          if(abortFlag.stop) return;
          acc = full;
          liveBody.innerHTML = mdToHtml(acc);
          box.scrollTop = box.scrollHeight;
        },
        onThinking: function(chunk){
          if(abortFlag.stop || !chunk) return;
          // Pannello del ragionamento: compare al primo token di pensiero e si
          // riempie in diretta. Senza, con un modello che ragiona l'utente vede
          // solo una lunga pausa e sembra che Spectra sia bloccato.
          if(!thinkNode){
            thinkNode = el('div', { class: 'bsi-think' });
            thinkNode.innerHTML =
              '<div class="bsi-think-h"><span class="bsi-think-dot"></span>' +
              '<span class="bsi-think-t">Sto ragionando…</span>' +
              '<button class="bsi-think-x" type="button">mostra</button></div>' +
              '<div class="bsi-think-b"></div>';
            var body = thinkNode.querySelector('.bsi-think-b');
            var tog = thinkNode.querySelector('.bsi-think-x');
            tog.onclick = function(){
              var open = thinkNode.classList.toggle('open');
              tog.textContent = open ? 'nascondi' : 'mostra';
              if(open) body.scrollTop = body.scrollHeight;
            };
            box.insertBefore(thinkNode, liveNode);
          }
          thinkAcc += chunk;
          var b = thinkNode.querySelector('.bsi-think-b');
          b.textContent = thinkAcc;
          b.scrollTop = b.scrollHeight;
          box.scrollTop = box.scrollHeight;
        },
        onToolUse: function(label){
          if(abortFlag.stop) return;
          toolLog.push(label);
          var note = el('div', { class: 'bsi-msg tool-note' }, escapeHtml(label));
          box.insertBefore(note, liveNode);
          box.scrollTop = box.scrollHeight;
        },
        // Le tre note qui sotto raccontano cosa sta facendo Spectra quando
        // non sta scrivendo: senza, l'utente vede solo una pausa e pensa
        // che si sia bloccato.
        onAttesa: function(ms, nome){
          if(abortFlag.stop) return;
          box.insertBefore(el('div', { class: 'bsi-msg tool-note' },
            '⏳ ' + escapeHtml(nome) + ' ha raggiunto il limite al minuto: aspetto ' +
            (ms / 1000).toFixed(1).replace('.0', '') + 's e riprovo'), liveNode);
          box.scrollTop = box.scrollHeight;
        },
        onRiserva: function(da, a){
          if(abortFlag.stop) return;
          box.insertBefore(el('div', { class: 'bsi-msg tool-note' },
            '🔄 ' + escapeHtml(da) + ' ha esaurito la quota: continuo su ' +
            escapeHtml(a)), liveNode);
          box.scrollTop = box.scrollHeight;
        },
        onBudget: function(ad){
          if(abortFlag.stop || _budgetDetto) return;
          _budgetDetto = true;    // una volta per turno, non ad ogni giro
          box.insertBefore(el('div', { class: 'bsi-msg tool-note' },
            '📐 Questo modello accetta richieste piccole: uso i ' + ad.tools.length +
            ' strumenti più adatti alla domanda invece di tutti e ' + TOOLS.length), liveNode);
          box.scrollTop = box.scrollHeight;
        },
        onDone: function(full){}
      }, abortCtrl ? abortCtrl.signal : undefined);
      var d2 = loadThreads(); var t2 = getActiveThread(d2);
      var msg2 = { role: 'assistant', content: acc || '(nessuna risposta)' };
      // conservo il ragionamento accanto alla risposta: resta consultabile dopo
      if(thinkAcc) msg2.thinking = thinkAcc.slice(0, 4000);
      if(toolLog.length) msg2.tools = toolLog.slice(0, 20);
      t2.messages.push(msg2);
      saveThreads(d2);
      renderMessages();
      refreshThreadSel();
    }catch(err){
      var wasStopped = abortFlag.stop || (err && err.name === 'AbortError');
      liveNode.className = wasStopped ? 'bsi-msg assistant' : 'bsi-msg system-note';
      if(!wasStopped){
        liveNode.innerHTML = '';
        liveNode.textContent = '⚠ ' + (err && err.message ? err.message : 'Errore di rete');
      }
      // Registriamo comunque un turno "assistant" nella cronologia salvata
      // (anche se l'utente ha premuto Stop): senza, il prossimo invio si
      // troverebbe due 'user' consecutivi, il che alcuni provider (Claude)
      // rifiutano con un errore ad ogni turno successivo finché non si
      // apre una chat nuova.
      try{
        var d3 = loadThreads(); var t3 = getActiveThread(d3);
        var savedContent = wasStopped ? (acc || '(interrotto)') : ('⚠ (errore, riprova) ' + (err && err.message ? err.message : 'Errore di rete'));
        t3.messages.push({ role: 'assistant', content: savedContent });
        saveThreads(d3);
        refreshThreadSel();
      }catch(e2){}
    } finally {
      sendBtn.disabled = false; sendBtn.style.display = 'inline-block'; stopBtn.style.display = 'none';
    }
  }
  sendBtn.onclick = send;
  document.getElementById('bsi-hub-input').addEventListener('keydown', function(e){
    if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); send(); }
  });

  renderMessages();
  window._bsiHubChatInternal = { renderMessages: renderMessages, refreshThreadSel: refreshThreadSel, send: send, refreshKeyBox: refreshKeyBox };
}

/* ========================= TAB: ESAME ORALE ========================= */
var EXAM_SUBJECTS = ['Chimica organica', 'Biochimica', 'Chimica fisica', 'Spettroscopia', 'Farmacologia', 'Chimica generale/inorganica'];

function buildExamPane(){
  var pane = document.getElementById('bsi-pane-exam');
  pane.innerHTML =
    '<div id="bsi-hub-topbar2">' +
      '<select id="bsi-exam-subj">' + EXAM_SUBJECTS.map(function(s){ return '<option>' + s + '</option>'; }).join('') + '</select>' +
      '<input id="bsi-exam-topics" placeholder="Argomenti specifici (opzionale): es. glicolisi, ciclo di Krebs…" style="flex:1;min-width:0;padding:7px 10px;background:#0d1b2e;border:1px solid #1a3550;border-radius:8px;color:#e8f4ff;font-size:.82rem">' +
      '<button class="bsi-hub-btn primary" id="bsi-exam-start">Inizia esame</button>' +
    '</div>' +
    '<div id="bsi-exam-msgs" style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px"></div>' +
    '<div id="bsi-exam-inputrow" style="display:none" class="bsi-hub-note"></div>';

  var msgsBox = document.getElementById('bsi-exam-msgs');
  var examState = { active: false, history: [] };

  function examSystem(subject, topics){
    return "Sei un professore universitario italiano d'esame orale di " + subject + ". " +
      (topics ? ('Concentrati su questi argomenti: ' + topics + '. ') : '') +
      "Fai UNA domanda alla volta, di livello universitario, precisa e specifica (mai generica tipo 'parlami di...'). " +
      "Aspetta la risposta dello studente. Poi valuta con onestà se è corretta, parzialmente corretta o sbagliata, " +
      "correggi con precisione scientifica gli eventuali errori, e SOLO DOPO fai una domanda di approfondimento " +
      "collegata oppure passa a un nuovo argomento. Sii esigente ma corretto, come un vero esaminatore. " +
      "Rispondi sempre in italiano. Non spezzare mai la domanda in più messaggi.";
  }

  function addExamMsg(role, text){
    var node = el('div', { class: 'bsi-msg ' + role });
    if(role === 'assistant'){
      node.appendChild(el('div', { class: 'bsi-msg-ava' }, spectraIcon(16)));
      var body = el('div', { class: 'bsi-msg-body' }, mdToHtml(text));
      node.appendChild(body);
      node._body = body;
    } else {
      node.textContent = text;
    }
    msgsBox.appendChild(node); msgsBox.scrollTop = msgsBox.scrollHeight;
    return node;
  }

  document.getElementById('bsi-exam-start').onclick = async function(){
    var examProvId = document.getElementById('bsi-hub-provsel') ? document.getElementById('bsi-hub-provsel').value : getSavedProvider();
    var apiKey = chiaveDaUsare(examProvId);
    if(!apiKey){ selectTab('chat'); return; }
    var subject = document.getElementById('bsi-exam-subj').value;
    var topics = document.getElementById('bsi-exam-topics').value.trim();
    msgsBox.innerHTML = '';
    examState = { active: true, history: [], system: examSystem(subject, topics) };
    var inputRow = document.getElementById('bsi-exam-inputrow');
    inputRow.style.display = 'none';
    buildExamInputRow();
    addExamMsg('system-note', '📋 Esame iniziato — ' + subject + (topics ? (' · ' + topics) : ''));
    await examTurn('Inizia l\'esame con la prima domanda.');
  };

  function buildExamInputRow(){
    var wrap = document.getElementById('bsi-exam-inputrow');
    wrap.className = '';
    wrap.style.cssText = 'display:flex;gap:8px;padding:10px 12px;border-top:1px solid #14283c;background:#071120;';
    wrap.innerHTML = '<textarea id="bsi-exam-answer" rows="1" placeholder="Scrivi (o detta) la tua risposta…" style="flex:1;resize:none;padding:10px;background:#0d1b2e;border:1px solid #1a3550;border-radius:10px;color:#e8f4ff;font-size:.9rem"></textarea>';
    wrap.appendChild(makeMicButton(function(text){
      var a = document.getElementById('bsi-exam-answer'); a.value = (a.value ? a.value + ' ' : '') + text;
    }));
    var send = el('button', { class: 'bsi-hub-btn primary' }, 'Rispondi →');
    send.onclick = function(){
      var a = document.getElementById('bsi-exam-answer');
      var v = a.value.trim(); if(!v) return;
      a.value = '';
      examTurn(v);
    };
    wrap.appendChild(send);
  }

  async function examTurn(userText){
    var provId = document.getElementById('bsi-hub-provsel') ? document.getElementById('bsi-hub-provsel').value : getSavedProvider();
    var apiKey = chiaveDaUsare(provId);
    if(userText !== "Inizia l'esame con la prima domanda.") { addExamMsg('user', userText); }
    examState.history.push({ role: 'user', content: userText });
    var live = addExamMsg('assistant', '…');
    try{
      var acc = '';
      await streamChat(provId, apiKey, examState.history.slice(-16), examState.system, {
        onToken: function(tok, full){ acc = full; live._body.innerHTML = mdToHtml(acc); msgsBox.scrollTop = msgsBox.scrollHeight; },
        onDone: function(){}
      });
      examState.history.push({ role: 'assistant', content: acc });
    }catch(err){
      live.className = 'bsi-msg system-note';
      live.textContent = '⚠ ' + (err && err.message ? err.message : 'Errore di rete');
      // Manteniamo l'alternanza user/assistant nella history anche in caso di
      // errore, altrimenti il prossimo turno avrebbe due 'user' consecutivi
      // e Claude rifiuterebbe la richiesta ad ogni tentativo successivo.
      examState.history.push({ role: 'assistant', content: '⚠ (errore, riprova) ' + (err && err.message ? err.message : 'Errore di rete') });
    }
  }
}

/* ========================= TAB: RIPASSA OGGI ========================= */
function buildSrsPane(){
  var pane = document.getElementById('bsi-pane-srs');
  pane.innerHTML = '<div class="bsi-srs-wrap" id="bsi-srs-wrap"></div>';
}

function refreshSrsPane(){
  var wrap = document.getElementById('bsi-srs-wrap');
  var seeded = srsSeedFromQuiz();
  var due = srsDueCards();
  STATE.srsQueue = due; STATE.srsIdx = 0;
  renderSrsCard(wrap);
}

function renderSrsCard(wrap){
  var due = STATE.srsQueue;
  if(!due.length){
    wrap.innerHTML =
      '<div class="bsi-srs-count">0</div>' +
      '<div style="color:#9fb8d0;margin-top:6px">Nessuna carta da ripassare oggi 🎉</div>' +
      '<div class="bsi-hub-note" style="margin-top:10px">Le carte si creano da sole quando sbagli una domanda nell\'Accademia, o premendo "📌 Ripassa" su una risposta della Chat. Ogni carta torna quando serve davvero (algoritmo SM-2), non a caso.</div>';
    return;
  }
  if(STATE.srsIdx >= due.length){
    wrap.innerHTML = '<div class="bsi-srs-count">✓</div><div style="color:#9fb8d0;margin-top:6px">Ripasso di oggi completato — ' + due.length + ' carte riviste.</div>';
    return;
  }
  var card = due[STATE.srsIdx];
  wrap.innerHTML =
    '<div style="color:#5a7a94;font-size:.8rem">Carta ' + (STATE.srsIdx + 1) + ' di ' + due.length + ' · ' + escapeHtml(card.tag || '') + '</div>' +
    '<div class="bsi-srs-card">' +
      '<div style="color:#e8f4ff;font-weight:700;margin-bottom:10px">' + escapeHtml(card.front) + '</div>' +
      '<div id="bsi-srs-answer" style="display:none;color:#9fb8d0;border-top:1px solid #1a3550;padding-top:10px;margin-top:10px">' + mdToHtml(card.back || '(nessuna risposta salvata — prova a ricordarla e poi verifica altrove)') + '</div>' +
      '<button class="bsi-hub-btn ghost" id="bsi-srs-reveal" style="margin-top:12px;width:100%">Mostra risposta</button>' +
    '</div>' +
    '<div class="bsi-srs-grades" id="bsi-srs-grades" style="display:none">' +
      '<button style="background:#3a1e1e;color:#ff9d9d" data-q="0">Di nuovo</button>' +
      '<button style="background:#3a2e1e;color:#ffd28a" data-q="3">Difficile</button>' +
      '<button style="background:#163a2a;color:#5eead4" data-q="4">Buono</button>' +
      '<button style="background:#0f2a3a;color:#7fd4ff" data-q="5">Facile</button>' +
    '</div>';
  document.getElementById('bsi-srs-reveal').onclick = function(){
    document.getElementById('bsi-srs-answer').style.display = 'block';
    document.getElementById('bsi-srs-grades').style.display = 'flex';
    this.style.display = 'none';
  };
  wrap.querySelectorAll('#bsi-srs-grades button').forEach(function(b){
    b.onclick = function(){
      var s = srsLoad();
      var c = s.cards[card.id];
      if(c){ sm2Grade(c, +b.getAttribute('data-q')); srsSave(s); }
      STATE.srsIdx++;
      renderSrsCard(wrap);
    };
  });
}

/* ========================= TAB: GENERA GUIDA ========================= */
var GUIDE_TOPICS = [
  'Glicolisi', 'Ciclo di Krebs', 'Fosforilazione ossidativa', 'β-ossidazione degli acidi grassi',
  'Gluconeogenesi', 'Meccanismi SN1/SN2', 'Sostituzione elettrofila aromatica', 'Reazioni pericicliche',
  'Retrosintesi — gruppi funzionali', 'Spettroscopia NMR — regole base', 'Spettrometria di massa — frammentazione',
  'Termodinamica chimica', 'Cinetica chimica', 'Orbitali molecolari', 'Farmacocinetica di base'
];

function buildGuidePane(){
  var pane = document.getElementById('bsi-pane-guide');
  pane.innerHTML =
    '<div class="bsi-guide-wrap">' +
      '<div style="color:#e8f4ff;font-weight:700;margin-bottom:6px">Scegli gli argomenti (o scrivi i tuoi)</div>' +
      '<div id="bsi-guide-chips">' + GUIDE_TOPICS.map(function(t){ return '<span class="bsi-topic-chip" data-t="' + escapeHtml(t) + '">' + escapeHtml(t) + '</span>'; }).join('') + '</div>' +
      '<input id="bsi-guide-custom" placeholder="Aggiungi un argomento personalizzato e premi Invio" style="width:100%;box-sizing:border-box;margin-top:10px;padding:9px 10px;background:#0d1b2e;border:1px solid #1a3550;border-radius:8px;color:#e8f4ff;font-size:.85rem">' +
      '<div style="display:flex;gap:8px;margin-top:14px;align-items:center">' +
        '<button class="bsi-hub-btn primary" id="bsi-guide-gen">📘 Genera guida</button>' +
        '<span class="bsi-hub-note" id="bsi-guide-status" style="margin:0"></span>' +
      '</div>' +
      '<div class="bsi-guide-log" id="bsi-guide-log" style="display:none"></div>' +
    '</div>';

  var selected = [];
  pane.querySelectorAll('.bsi-topic-chip').forEach(function(chip){
    chip.onclick = function(){
      var t = chip.getAttribute('data-t');
      var i = selected.indexOf(t);
      if(i > -1){ selected.splice(i,1); chip.classList.remove('on'); }
      else { selected.push(t); chip.classList.add('on'); }
    };
  });
  document.getElementById('bsi-guide-custom').addEventListener('keydown', function(e){
    if(e.key === 'Enter' && this.value.trim()){
      var t = this.value.trim();
      selected.push(t);
      var chip = el('span', { class: 'bsi-topic-chip on', 'data-t': t }, escapeHtml(t));
      document.getElementById('bsi-guide-chips').appendChild(chip);
      this.value = '';
    }
  });

  document.getElementById('bsi-guide-gen').onclick = async function(){
    var provId = document.getElementById('bsi-hub-provsel') ? document.getElementById('bsi-hub-provsel').value : getSavedProvider();
    var apiKey = chiaveDaUsare(provId);
    if(!apiKey){ selectTab('chat'); return; }
    if(!selected.length){ document.getElementById('bsi-guide-status').textContent = 'Scegli almeno un argomento.'; return; }
    var log = document.getElementById('bsi-guide-log'); log.style.display = 'block'; log.textContent = '';
    var statusEl = document.getElementById('bsi-guide-status');
    var btn = this; btn.disabled = true;
    var sections = [];
    for(var i = 0; i < selected.length; i++){
      var topic = selected[i];
      statusEl.textContent = 'Genero: ' + topic + ' (' + (i+1) + '/' + selected.length + ')…';
      log.textContent += '→ ' + topic + '\n';
      var sys = BASE_SYSTEM + ' Scrivi una scheda di studio sintetica (180-250 parole) sull\'argomento richiesto, ' +
        'in stile guida universitaria per esame orale: definizione, punti chiave, un esempio concreto se pertinente. ' +
        'Usa markdown semplice (titoletti con **, elenchi puntati con -).';
      try{
        var text = '';
        await streamChat(provId, apiKey, [{ role: 'user', content: 'Argomento: ' + topic }], sys, {
          onToken: function(tok, full){ text = full; },
          onDone: function(){}
        });
        sections.push({ title: topic, html: mdToHtml(text) });
      }catch(err){
        sections.push({ title: topic, html: '<p class="bsi-md-p">⚠ Non generato: ' + escapeHtml(err.message || 'errore') + '</p>' });
        log.textContent += '  ⚠ errore su questo argomento\n';
      }
    }
    statusEl.textContent = 'Pronta.';
    btn.disabled = false;
    downloadGuide(sections);
  };
}

function downloadGuide(sections){
  var body = sections.map(function(s){
    return '<div class="sec"><h2>' + escapeHtml(s.title) + '</h2>' + s.html + '</div>';
  }).join('\n');
  var html = '<!doctype html><html lang="it"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>Guida BioSpecInfo — ' + new Date().toLocaleDateString('it-IT') + '</title>' +
    '<style>*{box-sizing:border-box}body{margin:0;background:#0a1b2e;color:#e9eef6;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;padding:24px;max-width:760px;margin:0 auto}' +
    'h1{color:#00c9b7}h2{color:#5eead4;border-bottom:1px solid #1a3050;padding-bottom:6px;margin-top:34px}' +
    '.sec{margin-bottom:10px}b{color:#e8f4ff}ul{padding-left:20px}code{background:#0d1b2e;border:1px solid #1a3050;border-radius:4px;padding:1px 5px}' +
    '@media print{body{background:#fff;color:#111}h2{color:#0a5a4a}}</style></head><body>' +
    '<h1>📘 Guida di studio — BioSpecInfo</h1>' +
    '<div style="color:#5a7a94;font-size:.85rem">Generata il ' + new Date().toLocaleDateString('it-IT') + ' · contenuti creati con AI, da verificare sulle fonti primarie prima dell\'esame.</div>' +
    body + '</body></html>';
  var blob = new Blob([html], { type: 'text/html' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = 'guida_biospecinfo_' + Date.now() + '.html';
  document.body.appendChild(a); a.click(); a.remove();
  window.open(url, '_blank');
  setTimeout(function(){ URL.revokeObjectURL(url); }, 4000);
}

/* ---------------------------------------------------------------------
   8. Compatibilità: la vecchia sezione "sai" (AI Chat semplice) e le
      vecchie funzioni globali diventano un lancio del nuovo hub, così
      non restano due implementazioni diverse in giro.
--------------------------------------------------------------------- */
window.saveAIKey = function(){
  var inp = document.getElementById('aiKeyInput');
  if(inp && inp.value.trim()) setSavedKey(inp.value.trim());
  window.bsiOpenAIHub('chat');
};
window.clearAIKey = function(){ clearSavedKey(); };
window.setAIProvider = function(p){ setSavedProvider(p); };
window.aiSuggest = function(node){ window.bsiOpenAIHub('chat'); };
window.sendAI = function(){ window.bsiOpenAIHub('chat'); };

console.log('BioSpecInfo — Spectra v2 caricato (copilota agentico, chat multi-provider, esame orale, ripasso SM-2, generatore guide) ✔');
})();
