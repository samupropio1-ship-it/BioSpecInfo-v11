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
    name: 'Groq — Llama 3.3 70B', family: 'openai', free: true,
    model: 'llama-3.3-70b-versatile',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    authHeader: function(k){ return { Authorization: 'Bearer ' + k }; },
    keyLink: 'console.groq.com → API Keys', placeholder: 'gsk_...'
  },
  gemini: {
    name: 'Google Gemini 1.5 Flash', family: 'gemini', free: true,
    model: 'gemini-1.5-flash',
    urlBase: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash',
    keyLink: 'aistudio.google.com → Get API key', placeholder: 'AIza...'
  },
  openrouter: {
    name: 'OpenRouter — Mistral 7B', family: 'openai', free: true,
    model: 'mistralai/mistral-7b-instruct:free',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    authHeader: function(k){ return { Authorization: 'Bearer ' + k, 'HTTP-Referer': (location && location.href) || 'https://biospecinfo', 'X-Title': 'BioSpecInfo' }; },
    keyLink: 'openrouter.ai → Keys', placeholder: 'sk-or-v1-...'
  },
  claude: {
    name: 'Claude Opus 5 (Anthropic)', family: 'anthropic', free: false,
    model: 'claude-opus-5',
    // Opus 5 ragiona di suo (adaptive thinking sempre attivo): e' il modello
    // piu' capace nell'incatenare strumenti, quindi il migliore per il Copilota.
    // display:'summarized' e' voluto — con il valore predefinito ('omitted') il
    // modello pensa in silenzio e l'utente vede solo una lunga pausa.
    thinking: { type: 'adaptive', display: 'summarized' },
    maxTokens: 16000,
    url: 'https://api.anthropic.com/v1/messages',
    authHeader: function(k){ return { 'x-api-key': k, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }; },
    keyLink: 'console.anthropic.com → API Keys', placeholder: 'sk-ant-...',
    note: 'A pagamento e separato dall\'abbonamento di claude.ai: serve credito API su console.anthropic.com.'
  },
  claude_haiku: {
    name: 'Claude Haiku 4.5 (economico)', family: 'anthropic', free: false,
    model: 'claude-haiku-4-5',
    maxTokens: 8000,
    url: 'https://api.anthropic.com/v1/messages',
    authHeader: function(k){ return { 'x-api-key': k, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }; },
    keyLink: 'console.anthropic.com → API Keys', placeholder: 'sk-ant-...',
    note: 'Stessa chiave di Claude Opus 5, ma molto piu\' economico.'
  },
  grok: {
    name: 'Grok (xAI)', family: 'openai', free: false,
    model: 'grok-3-mini',
    url: 'https://api.x.ai/v1/chat/completions',
    authHeader: function(k){ return { Authorization: 'Bearer ' + k }; },
    keyLink: 'console.x.ai → API Keys', placeholder: 'xai-...',
    note: 'Alcuni provider bloccano le chiamate dirette dal browser: se Grok non risponde, prova Claude, Gemini o Groq.'
  }
};
window.BSI_AI_PROVIDERS = PROVIDERS;

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
    return {
      url: p.urlBase + ':streamGenerateContent?alt=sse&key=' + encodeURIComponent(apiKey),
      headers: { 'Content-Type': 'application/json' },
      body: body
    };
  }
  if(p.family === 'anthropic'){
    var h = Object.assign({ 'Content-Type': 'application/json' }, p.authHeader(apiKey));
    var aBody = {
      model: p.model, max_tokens: p.maxTokens || 4000, stream: true, system: systemPrompt,
      messages: messages.map(anthropicMsg)
    };
    // NB: sui modelli recenti (Opus 5 e famiglia 4.6+) temperature/top_p sono
    // stati rimossi e farebbero fallire la richiesta con un 400: non inviarli.
    if(p.thinking) aBody.thinking = p.thinking;
    var aTools = toolsForFamily('anthropic', tools);
    if(aTools) aBody.tools = aTools;
    return { url: p.url, headers: h, body: aBody };
  }
  // famiglia 'openai'-compatibile: groq, openrouter, grok
  var h2 = Object.assign({ 'Content-Type': 'application/json' }, p.authHeader(apiKey));
  var oBody = {
    model: p.model, stream: true, temperature: 0.6,
    messages: [{ role: 'system', content: systemPrompt }].concat(messages.map(openaiMsg))
  };
  var oTools = toolsForFamily('openai', tools);
  if(oTools) oBody.tools = oTools;
  return { url: p.url, headers: h2, body: oBody };
}

// Conversione messaggi: per turni semplici {role,content:string} il passthrough
// è quasi identico; per i turni interni dell'agente (tool_use/tool_result) i
// messaggi arrivano già nella forma nativa del provider (oggetto _native) e
// vengono passati così come sono.
function openaiMsg(m){ return m._native && m._native.openai ? m._native.openai : { role: m.role, content: m.content }; }
function anthropicMsg(m){ return m._native && m._native.anthropic ? m._native.anthropic : { role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }; }
function geminiMsg(m){ return m._native && m._native.gemini ? m._native.gemini : { role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }; }

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
          if(json.delta.type === 'thinking_delta') th.thinking = (th.thinking || '') + (json.delta.thinking || '');
          else th.signature = (th.signature || '') + (json.delta.signature || '');
        }
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
async function streamChat(providerId, apiKey, messages, systemPrompt, callbacks, tools, abortSignal){
  var p = PROVIDERS[providerId];
  if(!p) throw new Error('Provider sconosciuto: ' + providerId);
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
    throw new Error('HTTP ' + res.status + ' — ' + errMsg);
  }
  var full = '';
  var tcState = { toolCalls: {}, geminiCalls: [] };
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
  return { text: full, toolCalls: toolCalls, thinking: thinkingBlocks };
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

TOOLS.push(
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
async function runToolCalls(toolCalls){
  var out = [];
  for(var i = 0; i < toolCalls.length; i++){
    var tc = toolCalls[i];
    var tool = toolByName(tc.name);
    var result;
    try{
      result = tool ? await tool.execute(tc.args || {}) : { ok: false, error: 'tool sconosciuto: ' + tc.name };
    }catch(e){ result = { ok: false, error: e.message }; }
    out.push({ id: tc.id, name: tc.name, args: tc.args, result: result });
  }
  return out;
}

// Costruisce, per famiglia, il messaggio "assistant" (che contiene le
// tool-call) e il messaggio "tool result" da riaggiungere alla history,
// nella forma nativa richiesta da quel provider.
function appendAgentTurn(family, history, assistantText, toolCalls, execResults, thinkingBlocks){
  if(family === 'anthropic'){
    var contentBlocks = [];
    // I blocchi di pensiero vanno per primi e identici a come sono arrivati
    // (firma compresa), altrimenti il modello rifiuta il turno successivo.
    if(thinkingBlocks && thinkingBlocks.length) contentBlocks = contentBlocks.concat(thinkingBlocks);
    if(assistantText) contentBlocks.push({ type: 'text', text: assistantText });
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
        case 'stato_app':          msg = '🧭 Ho controllato dove ti trovi nell\'app'; break;
        default:                   msg = '🧭 Ho eseguito: ' + (res.label || er.name);
      }
      callbacks.onToolUse(msg);
    });
    appendAgentTurn(p.family, history, roundText, r.toolCalls, execResults, r.thinking);
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
  // reinserisco i blocchi di codice
  s = s.replace(/\u0000CODEBLOCK(\d+)\u0000/g, function(_, idx){ return codeBlocks[+idx]; });
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
"il permesso di usare uno strumento: usalo e poi spiega cosa hai trovato.";

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
  var map = getKeysMap();
  return Object.keys(map).some(function(k){ return !!map[k]; });
}
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
function buildChatPane(){
  var pane = document.getElementById('bsi-pane-chat');
  pane.innerHTML =
    '<div id="bsi-hub-topbar2">' +
      '<select id="bsi-hub-threadsel"></select>' +
      '<button class="bsi-hub-btn ghost" id="bsi-hub-newchat">＋ Nuova</button>' +
      '<select id="bsi-hub-provsel">' + providerSelectHtml(getSavedProvider()) + '</select>' +
      '<div class="bsi-copilot-toggle on" id="bsi-copilot-toggle" title="Spectra puo\' sempre aprire sezioni, strumenti e cercare molecole per te — nessuna attivazione necessaria"><span class="dot"></span><span>🧭 Copilota attivo</span></div>' +
    '</div>' +
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
    '<div id="bsi-hub-msgs"></div>' +
    '<div id="bsi-hub-inputrow">' +
      '<textarea id="bsi-hub-input" rows="1" placeholder="Chiedi qualsiasi cosa di chimica, biochimica, spettroscopia…"></textarea>' +
    '</div>';

  var provSel = document.getElementById('bsi-hub-provsel');
  var keyBox = document.getElementById('bsi-hub-keybox');
  var inputRow = document.getElementById('bsi-hub-inputrow');
  inputRow.insertBefore(makeMicButton(function(text){
    var inp = document.getElementById('bsi-hub-input');
    inp.value = (inp.value ? inp.value + ' ' : '') + text;
  }), document.getElementById('bsi-hub-input'));
  var sendBtn = el('button', { class: 'bsi-hub-btn primary', id: 'bsi-hub-send' }, 'Invia →');
  inputRow.appendChild(sendBtn);
  var stopBtn = el('button', { class: 'bsi-hub-btn ghost', id: 'bsi-hub-stop', style: 'display:none' }, '■ Stop');
  inputRow.appendChild(stopBtn);

  // Ogni provider ricorda la propria chiave per sempre (bsi_api_keys):
  // una volta salvata non viene più richiesta, anche cambiando provider.
  function refreshKeyBox(){
    var prov = provSel.value;
    var hasKey = !!getSavedKey(prov);
    keyBox.style.display = hasKey ? 'none' : 'block';
    document.getElementById('bsi-hub-provname').textContent = PROVIDERS[prov].name;
    document.getElementById('bsi-hub-keylink').textContent = 'Ottieni una chiave gratuita su ' + PROVIDERS[prov].keyLink + (PROVIDERS[prov].note ? ' — ' + PROVIDERS[prov].note : '');
    document.getElementById('bsi-hub-keyinput').placeholder = PROVIDERS[prov].placeholder;
  }
  provSel.value = getSavedProvider();
  refreshKeyBox();
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

  function renderMsgNode(m, idx, thread){
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
        actions.appendChild(copyBtn); actions.appendChild(speakBtn); actions.appendChild(pinBtn);
        body.appendChild(actions);
      }
      node.appendChild(body);
    } else {
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
    var apiKey = getSavedKey(provId);
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
    t.messages.push({ role: 'user', content: text });
    saveThreads(d);
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

    var sys = BASE_SYSTEM + buildGrounding(text);
    var history = t.messages.slice(-12).map(function(m){ return { role: m.role, content: m.content }; });

    stopBtn.onclick = function(){ abortFlag.stop = true; if(abortCtrl) abortCtrl.abort(); };

    try{
      var acc = '';
      await runAgentTurn(provId, apiKey, history, sys, {
        onToken: function(tok, full){
          if(abortFlag.stop) return;
          acc = full;
          liveBody.innerHTML = mdToHtml(acc);
          box.scrollTop = box.scrollHeight;
        },
        onToolUse: function(label){
          if(abortFlag.stop) return;
          var note = el('div', { class: 'bsi-msg tool-note' }, escapeHtml(label));
          box.insertBefore(note, liveNode);
          box.scrollTop = box.scrollHeight;
        },
        onDone: function(full){}
      }, abortCtrl ? abortCtrl.signal : undefined);
      var d2 = loadThreads(); var t2 = getActiveThread(d2);
      t2.messages.push({ role: 'assistant', content: acc || '(nessuna risposta)' });
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
    var apiKey = getSavedKey(examProvId);
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
    var apiKey = getSavedKey(provId);
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
    var apiKey = getSavedKey(provId);
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
