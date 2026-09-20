/* Risoluzione del modello per Groq / Z.AI / xAI / DeepSeek. */
const fs = require('fs');
let src = fs.readFileSync('/home/user/BioSpecInfo-v11/bsi-ai-hub.js','utf8');
const store = {};
global.localStorage = { getItem:k=>(k in store?store[k]:null), setItem:(k,v)=>{store[k]=String(v);}, removeItem:k=>{delete store[k];} };
function el(){ return { style:{}, classList:{add(){},remove(){},contains(){return false}}, appendChild(){},
  addEventListener(){}, setAttribute(){}, removeAttribute(){}, querySelector(){return null},
  querySelectorAll(){return []}, remove(){}, insertAdjacentHTML(){}, focus(){}, scrollIntoView(){},
  textContent:'', innerHTML:'', dataset:{}, children:[] }; }
global.document = { createElement:el, createElementNS:el, getElementById:()=>null, querySelector:()=>null,
  querySelectorAll:()=>[], addEventListener(){}, body:el(), head:el(), documentElement:el(), readyState:'complete' };
global.window = global;
global.location = { href:'https://test/', hostname:'test', search:'', pathname:'/' };
global.navigator = { userAgent:'node', language:'it-IT' };
global.AbortController = class { constructor(){ this.signal={aborted:false,addEventListener(){}}; } abort(){} };
global.TextDecoder = class { decode(){ return ''; } };
global.CustomEvent = class {};
global.requestAnimationFrame = f=>setTimeout(f,0);
global.matchMedia = ()=>({matches:false,addListener(){},addEventListener(){}});
global.fetch = async()=>{ throw new Error('non mockato'); };
try{ eval(src); }catch(e){ console.error('CARICAMENTO FALLITO:', e.message); process.exit(1); }

const P = global.BSI_AI_PROVIDERS, risolvi = global.bsiRisolviModello, reset = global.bsiGeminiReset;
let ok=0, ko=0, chiamate=[];
const att=(d,a,v)=>{ if(String(a)===String(v)){ok++;console.log('  ✓ '+d+'  → '+v);} else {ko++;console.log('  ✗ '+d+'\n      atteso: '+a+'\n      avuto:  '+v);} };

function monta(catalogo, opts){
  opts = opts||{};
  global.fetch = async (u,o) => {
    u=String(u); chiamate.push({url:u, h:(o&&o.headers)||{}});
    if(/\/models$/.test(u)){
      if(opts.fallisce) return { ok:false, status:opts.fallisce, json:async()=>({}) };
      return { ok:true, json: async()=>({ data: catalogo.map(id=>({id})) }) };
    }
    return { ok:false, status:400, text:async()=>'{"error":{"message":"stop"}}' };
  };
}

// Il catalogo Groq dopo il ritiro del 17/06/2026
const GROQ_2026 = ['openai/gpt-oss-120b','openai/gpt-oss-20b','qwen/qwen3.6-27b',
  'llama-3.1-8b-instant','whisper-large-v3','meta-llama/llama-guard-4-12b',
  'playai-tts','meta-llama/llama-4-scout-17b-16e-instruct'];

(async () => {
  console.log('\n1) Groq: llama-3.3-70b non c\'e\' piu\' → primo candidato vivo');
  reset(); chiamate=[]; monta(GROQ_2026);
  att('sceglie gpt-oss-120b', 'openai/gpt-oss-120b', await risolvi(P.groq,'gsk_X',true));
  att('endpoint /models corretto', 'https://api.groq.com/openai/v1/models', chiamate[0].url);
  att('con la chiave', 'Bearer gsk_X', chiamate[0].h.Authorization);

  console.log('\n2) Cache: la seconda volta non tocca la rete');
  chiamate=[];
  att('stesso modello', 'openai/gpt-oss-120b', await risolvi(P.groq,'gsk_X',false));
  att('zero richieste', 0, chiamate.length);

  console.log('\n3) Chiave diversa = cache diversa');
  chiamate=[];
  await risolvi(P.groq,'gsk_ALTRA',false);
  att('ha interrogato la rete', true, chiamate.length>0);

  console.log('\n4) Se gpt-oss-120b sparisce, scala al candidato dopo');
  reset(); monta(GROQ_2026.filter(m=>m!=='openai/gpt-oss-120b'));
  att('passa a qwen3.6-27b', 'qwen/qwen3.6-27b', await risolvi(P.groq,'gsk_Y',true));

  console.log('\n5) Nessun candidato sopravvive → sceglie fra i disponibili');
  reset(); monta(['whisper-large-v3','playai-tts','meta-llama/llama-guard-4-12b',
                  'mistral-saba-24b','llama-4-maverick-70b-instruct']);
  const s5 = await risolvi(P.groq,'gsk_Z',true);
  att('scarta whisper/tts/guard', true, !/whisper|tts|guard/.test(s5));
  att('preferisce il piu\' grande', 'llama-4-maverick-70b-instruct', s5);

  console.log('\n5b) Modello valido ma senza taglia nel nome: va preso lo stesso');
  reset(); monta(['whisper-large-v3','gpt-4o']);
  att('non lo scarta', 'gpt-4o', await risolvi(P.groq,'gsk_Q',true));

  console.log('\n6) Solo modelli non conversazionali → riserva statica');
  reset(); monta(['whisper-large-v3','playai-tts','text-embedding-3']);
  att('primo candidato', 'openai/gpt-oss-120b', await risolvi(P.groq,'gsk_W',true));

  console.log('\n7) /models non raggiungibile (401) → riserva statica');
  reset(); monta([], { fallisce:401 });
  att('primo candidato', 'openai/gpt-oss-120b', await risolvi(P.groq,'gsk_V',true));
  att('non mette in cache un ripiego cieco', null, store['bsi_modello_groq']||null);

  console.log('\n8) Z.AI: preferisce la 4.7-flash');
  reset(); monta(['glm-4.5-flash','glm-4.7-flash','glm-4-plus','embedding-3']);
  att('sceglie glm-4.7-flash', 'glm-4.7-flash', await risolvi(P.zai,'zk-1',true));

  console.log('\n9) Z.AI: se la 4.7 non c\'e\', scala alla 4.5');
  reset(); monta(['glm-4.5-flash','glm-4-plus']);
  att('scala a glm-4.5-flash', 'glm-4.5-flash', await risolvi(P.zai,'zk-2',true));

  console.log('\n10) xAI: primo candidato esistente');
  reset(); monta(['grok-4.6','grok-4.3','grok-2-image']);
  att('grok-4.6', 'grok-4.6', await risolvi(P.grok,'xai-1',true));
  reset(); monta(['grok-4.5','grok-2']);
  att('scala a grok-4.5', 'grok-4.5', await risolvi(P.grok,'xai-2',true));

  console.log('\n10b) urlModelli: catalogo su un percorso DIVERSO dalla chat');
  // Nessun fornitore attuale ne ha bisogno (serviva a GitHub Models, ritirato
  // il 30/07/2026), ma il meccanismo resta: il prossimo che non segue la
  // convenzione OpenAI lo trova gia' pronto. Si prova con una configurazione
  // sintetica, e con una lista NUDA invece di {data:[...]}.
  const ALTROVE = Object.assign({}, P.groq, { id:'altrove',
    url:'https://esempio.test/inference/chat/completions',
    urlModelli:'https://esempio.test/catalog/models',
    modelliCandidati:['modello-a','modello-b'] });
  reset(); chiamate=[];
  global.fetch = async (u,o) => {
    u=String(u); chiamate.push({url:u, h:(o&&o.headers)||{}});
    if(/catalog\/models$/.test(u))
      return { ok:true, json: async()=>([{id:'modello-b'},{id:'altro'}]) };
    return { ok:false, status:400, text:async()=>'{}' };
  };
  att('legge una lista nuda', 'modello-b', await risolvi(ALTROVE,'k',true));
  att('interroga urlModelli, non /models derivato',
      'https://esempio.test/catalog/models', chiamate[0].url);

  console.log('\n10c) DeepSeek: endpoint OpenAI standard, e scarta i non conversazionali');
  reset(); chiamate=[];
  monta(['deepseek-v4-pro','deepseek-chat','deepseek-embed-2']);
  att('sceglie il candidato preferito', 'deepseek-v4-pro', await risolvi(P.deepseek,'sk-X',true));
  att('endpoint standard', 'https://api.deepseek.com/v1/models', chiamate[0].url);

  console.log('\n10d) Z.AI: endpoint OpenAI standard');
  reset(); chiamate=[]; monta(['glm-4.7-flash']);
  await risolvi(P.zai,'zk-3',true);
  att('endpoint', 'https://api.z.ai/api/paas/v4/models', chiamate[0].url);

  console.log('\n10e) Tutti i gratuiti hanno nome, chiave e nota');
  ['groq','gemini','zai'].forEach(function(id){
    const q = P[id];
    att(id+': completo', true, !!(q.name && q.keyLink && q.placeholder && q.note && q.modelliCandidati.length));
    att(id+': dichiarato gratuito', true, q.free === true);
    att(id+': nessun modello cablato', null, q.model);
  });

  console.log('\n11) Anthropic ha la riserva come tutti gli altri');
  reset(); monta(['claude-opus-5','claude-opus-4-8','claude-sonnet-5']);
  att('sceglie Opus 5', 'claude-opus-5', await risolvi(P.claude,'sk-ant',true));
  att('candidati dichiarati', 3, P.claude.modelliCandidati.length);
  att('Opus 4.8 e\' la riserva', true, P.claude.modelliCandidati.indexOf('claude-opus-4-8') > 0);

  console.log('\n12) Il corpo della richiesta porta il modello risolto');
  reset(); monta(GROQ_2026);
  let inviato = null;
  global.fetch = async (u,o) => {
    u=String(u);
    if(/\/models$/.test(u)) return { ok:true, json:async()=>({ data: GROQ_2026.map(id=>({id})) }) };
    inviato = JSON.parse(o.body);
    return { ok:false, status:400, text:async()=>'{"error":{"message":"stop"}}' };
  };
  try{ await global.bsiStreamChat('groq','gsk_B',[{role:'user',content:'ciao'}],'sys',{onToken(){},onDone(){}}); }catch(e){}
  att('modello nel corpo', 'openai/gpt-oss-120b', inviato && inviato.model);
  att('mai null', true, !!(inviato && inviato.model));

  console.log('\n13) Ritiro a caldo: 404 → ririsolve e ritenta una volta');
  reset();
  // prima si mette in cache un modello che poi sparisce
  monta(['llama-3.3-70b-versatile']);
  P.groq.modelliCandidati.push('llama-3.3-70b-versatile');
  await risolvi(P.groq,'gsk_C',true);
  att('cache iniziale', 'llama-3.3-70b-versatile', store['bsi_modello_groq'] && JSON.parse(store['bsi_modello_groq']).model);
  let tent=[];
  global.fetch = async (u,o) => {
    u=String(u);
    if(/\/models$/.test(u)) return { ok:true, json:async()=>({ data:[{id:'openai/gpt-oss-120b'}] }) };
    tent.push(JSON.parse(o.body).model);
    if(tent[tent.length-1]==='llama-3.3-70b-versatile')
      return { ok:false, status:404, text:async()=>'{"error":{"message":"The model `llama-3.3-70b-versatile` does not exist or you do not have access to it."}}' };
    return { ok:false, status:400, text:async()=>'{"error":{"message":"arrivato al modello nuovo"}}' };
  };
  let e13='';
  try{ await global.bsiStreamChat('groq','gsk_C',[{role:'user',content:'ciao'}],'sys',{onToken(){},onDone(){}}); }catch(e){ e13=e.message; }
  att('ritenta', true, tent.length >= 2);
  att('il secondo col modello nuovo', 'openai/gpt-oss-120b', tent[1]);
  att('errore finale quello vero', true, /arrivato al modello nuovo/.test(e13));

  console.log('\n14) 404 persistente: si ferma, non cicla');
  reset(); tent=[];
  global.fetch = async (u,o) => {
    u=String(u);
    if(/\/models$/.test(u)) return { ok:true, json:async()=>({ data:[{id:'openai/gpt-oss-120b'}] }) };
    tent.push(JSON.parse(o.body).model);
    return { ok:false, status:404, text:async()=>'{"error":{"message":"non trovato"}}' };
  };
  let e14='';
  try{ await global.bsiStreamChat('groq','gsk_D',[{role:'user',content:'ciao'}],'sys',{onToken(){},onDone(){}}); }catch(e){ e14=e.message; }
  // come su Gemini: ora scende lungo i candidati invece di arrendersi al
  // primo 404. Deve TERMINARE e non ripetere lo stesso modello.
  att('termina, con tentativi limitati', true, tent.length <= 5);
  att('ogni tentativo con un modello diverso', tent.length, new Set(tent).size);
  att('404 riportato', true, /HTTP 404/.test(e14));

  console.log('\n15) Gemini continua a funzionare come prima');
  reset();
  global.fetch = async (u) => {
    u=String(u);
    if(/generativelanguage.*\/models\?/.test(u))
      return { ok:true, json:async()=>({ models:[{name:'models/gemini-2.5-flash',
        supportedGenerationMethods:['generateContent','streamGenerateContent']}] }) };
    return { ok:false, status:400, text:async()=>'{}' };
  };
  att('gemini risolto', 'gemini-2.5-flash', await risolvi(P.gemini,'AIza',true));

  console.log('\n' + (ko ? '✗ '+ko+' FALLITI, ' : '') + ok + ' passati');
  process.exit(ko?1:0);
})();
