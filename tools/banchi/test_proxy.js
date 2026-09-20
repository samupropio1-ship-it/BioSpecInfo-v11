/* Verifica del percorso "senza chiave": Spectra deve instradare al proxy,
   NON mandare nessuna chiave, e continuare a funzionare in diretta quando
   il proxy non copre un fornitore. */
const fs = require('fs');
let src = fs.readFileSync('/home/user/BioSpecInfo-v11/bsi-ai-hub.js', 'utf8');

const store = {};
global.localStorage = {
  getItem: k => (k in store ? store[k] : null),
  setItem: (k,v) => { store[k] = String(v); },
  removeItem: k => { delete store[k]; }
};
function el(){ return { style:{}, classList:{add(){},remove(){},contains(){return false}},
  appendChild(){}, addEventListener(){}, setAttribute(){}, removeAttribute(){},
  querySelector(){return null}, querySelectorAll(){return []}, remove(){},
  insertAdjacentHTML(){}, focus(){}, scrollIntoView(){}, textContent:'', innerHTML:'',
  dataset:{}, children:[] }; }
global.document = { createElement: el, createElementNS: el, getElementById: () => null,
  querySelector: () => null, querySelectorAll: () => [], addEventListener(){},
  body: el(), head: el(), documentElement: el(), readyState:'complete' };
global.window = global;
global.location = { href:'https://test/', hostname:'test', search:'', pathname:'/' };
global.navigator = { userAgent:'node', language:'it-IT' };
global.AbortController = class { constructor(){ this.signal={aborted:false,addEventListener(){}}; } abort(){} };
global.TextDecoder = class { decode(){ return ''; } };
global.CustomEvent = class {};
global.requestAnimationFrame = f => setTimeout(f,0);
global.matchMedia = () => ({ matches:false, addListener(){}, addEventListener(){} });
global.fetch = async () => { throw new Error('non mockato'); };

try { eval(src); } catch(e){ console.error('CARICAMENTO FALLITO:', e.message); process.exit(1); }

let ok=0, ko=0;
function att(d, atteso, avuto){
  if(String(atteso)===String(avuto)){ ok++; console.log('  ✓ '+d+'  → '+avuto); }
  else { ko++; console.log('  ✗ '+d+'\n      atteso: '+atteso+'\n      avuto:  '+avuto); }
}

const PROXY = 'https://spectra-proxy.esempio.workers.dev';

// Finto Worker: /stato dice quali fornitori copre; le rotte registrano
// URL e intestazioni ricevute.
let visti = [];
function montaProxy(fornitori){
  global.fetch = async (u, o) => {
    u = String(u);
    if(u.endsWith('/stato')) return { ok:true, json: async()=>({ fornitori }) };
    if(u.indexOf(PROXY) === 0){
      visti.push({ url:u, headers:(o&&o.headers)||{}, body:(o&&o.body)||'' });
      if(/\/anthropic\/v1\/models$/.test(u))
        return { ok:true, json: async()=>({ data:[{id:'claude-opus-5'}] }) };
      if(/\/groq\/openai\/v1\/models$/.test(u))
        return { ok:true, json: async()=>({ data:[{id:'openai/gpt-oss-120b'}] }) };
      if(/\/gemini\/v1beta\/models\?/.test(u))
        return { ok:true, json: async()=>({ models:[{ name:'models/gemini-2.5-flash',
          supportedGenerationMethods:['generateContent','streamGenerateContent'] }] }) };
      return { ok:false, status:400, text: async()=>'{"error":{"message":"stop"}}' };
    }
    visti.push({ url:u, headers:(o&&o.headers)||{}, diretto:true });
    return { ok:false, status:400, text: async()=>'{"error":{"message":"diretto"}}' };
  };
}

(async () => {
  const P = global.BSI_AI_PROVIDERS;

  console.log('\n1) Senza proxy configurato non cambia nulla');
  att('proxy non attivo', '', global.bsiProxy.url());
  att('non copre gemini', false, global.bsiProxy.copre('gemini'));

  console.log('\n2) Proxy che copre groq + gemini');
  store['bsi_proxy_url'] = PROXY;
  montaProxy(['groq','gemini']);
  const forn = await global.bsiProxy.stato();
  att('fornitori annunciati', 'groq,gemini', forn.join(','));
  att('copre gemini', true, global.bsiProxy.copre('gemini'));
  att('copre groq', true, global.bsiProxy.copre('groq'));
  att('NON copre claude', false, global.bsiProxy.copre('claude'));
  att('NON copre grok', false, global.bsiProxy.copre('grok'));

  console.log('\n3) Gemini via proxy: nessuna chiave nell\'URL');
  global.bsiGeminiReset(); visti = [];
  try{ await global.bsiStreamChat('gemini','',[{role:'user',content:'ciao'}],'sys',{onToken(){},onDone(){}}); }catch(e){}
  const gen = visti.find(v => v.url.indexOf(':streamGenerateContent') >= 0);
  att('passa dal proxy', true, !!gen && gen.url.indexOf(PROXY + '/gemini/v1beta/models/') === 0);
  att('modello risolto via proxy', true, !!gen && /gemini-2\.5-flash/.test(gen.url));
  att('nessun parametro key=', false, !!gen && /[?&]key=/.test(gen.url));
  att('ListModels passato dal proxy', true, visti.some(v => v.url === PROXY + '/gemini/v1beta/models?pageSize=200'));

  console.log('\n4) Groq via proxy: nessuna intestazione Authorization');
  visti = [];
  try{ await global.bsiStreamChat('groq','',[{role:'user',content:'ciao'}],'sys',{onToken(){},onDone(){}}); }catch(e){}
  // Anche Groq ora risolve il modello: la prima richiesta e' /models.
  const gMod = visti.find(v => /\/models$/.test(v.url));
  const g = visti.find(v => /chat\/completions$/.test(v.url));
  att('elenco modelli dal proxy', PROXY + '/groq/openai/v1/models', gMod && gMod.url);
  att('elenco senza Authorization', undefined, gMod && gMod.headers.Authorization);
  att('rotta della chat corretta', PROXY + '/groq/openai/v1/chat/completions', g && g.url);
  att('niente Authorization', undefined, g && g.headers.Authorization);

  console.log('\n5) Claude NON coperto: resta diretto, con la sua chiave');
  store['bsi_api_keys'] = JSON.stringify({ claude: 'sk-ant-PROVA' });
  visti = [];
  try{ await global.bsiStreamChat('claude','sk-ant-PROVA',[{role:'user',content:'ciao'}],'sys',{onToken(){},onDone(){}}); }catch(e){}
  // come per gli altri fornitori, la prima richiesta e' l'elenco dei modelli
  const c = visti.find(v => /v1\/messages$/.test(v.url));
  att('chiamata diretta ad Anthropic', 'https://api.anthropic.com/v1/messages', c && c.url);
  att('la chiave viaggia normalmente', 'sk-ant-PROVA', c && c.headers['x-api-key']);

  console.log('\n6) Claude coperto dal proxy: chiave assente, versione presente');
  montaProxy(['anthropic']);
  await global.bsiProxy.ricarica();
  visti = [];
  try{ await global.bsiStreamChat('claude','',[{role:'user',content:'ciao'}],'sys',{onToken(){},onDone(){}}); }catch(e){}
  const c2 = visti.find(v => /v1\/messages$/.test(v.url));
  att('rotta proxy', PROXY + '/anthropic/v1/messages', c2 && c2.url);
  att('niente x-api-key', undefined, c2 && c2.headers['x-api-key']);
  att('anthropic-version presente', '2023-06-01', c2 && c2.headers['anthropic-version']);

  console.log('\n7) Il segnaposto non finisce mai in una richiesta');
  const tutto = JSON.stringify(visti);
  att('segnaposto assente', false, tutto.indexOf('(sul server)') >= 0);

  console.log('\n8) Spectra e\' utilizzabile senza chiavi salvate');
  delete store['bsi_api_keys'];
  att('hasAnySavedKey col proxy', true, global.bsiHasAnySavedKey());

  console.log('\n' + (ko ? '✗ '+ko+' FALLITI, ' : '') + ok + ' passati');
  process.exit(ko ? 1 : 0);
})();
