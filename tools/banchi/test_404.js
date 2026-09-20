(async()=>{
/* Il caso reale: "models/gemini-2.5-flash is no longer available to new
   users. Please update your code to use models/gemini-3.6-flash".
   Il modello ESISTE nel catalogo e le sonde lo trovano: solo la chiamata
   vera dice che non si puo' usare. Prima l'app si arrendeva, perche' la
   ri-risoluzione ridava lo stesso nome. */
const fs = require('fs');
let src = fs.readFileSync('/home/user/BioSpecInfo-v11/bsi-ai-hub.js','utf8');
src = src.replace('window.bsiDati = ',
  'window.__t = { risolviModelloGemini:risolviModelloGemini, risolviModelloOpenai:risolviModelloOpenai,\n' +
  '  PROVIDERS:PROVIDERS, bocciaModello:bocciaModello, modelloBocciato:modelloBocciato,\n' +
  '  bocciatiDi:bocciatiDi, modelloSuggeritoDaErrore:modelloSuggeritoDaErrore };\nwindow.bsiDati = ');
let store = {};
global.localStorage = {
  getItem:k=>(k in store?store[k]:null), setItem:(k,v)=>{store[k]=String(v);},
  removeItem:k=>{delete store[k];},
  get length(){ return Object.keys(store).length; }, key:i=>Object.keys(store)[i]
};
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

// ── rete simulata ────────────────────────────────────────────────────────
let catalogo = [], generabili = new Set(), chiamateGen = [], listFallisce = false;
const ERRORE_GOOGLE = 'This model models/gemini-2.5-flash is no longer available to ' +
  'new users. Please update your code to use models/gemini-3.6-flash for the latest ' +
  'features and improvements. We recommend you to use the Interactions API.';

global.fetch = async (url, opz) => {
  url = String(url);
  const post = opz && opz.method === 'POST';
  if(!post && /\/models\?|\/v1beta\/models$/.test(url)){
    if(listFallisce) throw new TypeError('Failed to fetch');
    return { ok:true, status:200, json: async()=>({ models: catalogo }) };
  }
  if(!post && /\/models\//.test(url)){                 // sonda sui metadati
    const nome = url.split('/models/')[1].split('?')[0];
    // ESISTE anche se non e' generabile: e' esattamente il caso di Google
    const c = catalogo.some(m=>m.name === 'models/'+nome);
    return { ok:c, status: c?200:404, json: async()=>({}) };
  }
  if(post){                                            // generazione
    const m = /\/models\/([^:]+):/.exec(url);
    const nome = m ? m[1] : '?';
    chiamateGen.push(nome);
    if(generabili.has(nome)){
      return { ok:true, status:200, body:null, text: async()=>'ok',
               json: async()=>({ candidates:[] }) };
    }
    return { ok:false, status:404, headers:{ get:()=>null },
             text: async()=>JSON.stringify({ error:{ message: ERRORE_GOOGLE } }),
             json: async()=>({ error:{ message: ERRORE_GOOGLE } }) };
  }
  throw new TypeError('Failed to fetch');
};
try{ eval(src); }catch(e){ console.error('CARICAMENTO FALLITO:', e.message); process.exit(1); }
const T = global.__t, P = T.PROVIDERS;

let ok=0,ko=0;
const att=(d,a,v)=>{ if(String(a)===String(v)){ok++;console.log('  ✓ '+d+'  → '+v);} else {ko++;console.log('  ✗ '+d+'\n      atteso: '+a+'\n      avuto:  '+v);} };
const CB = { onToken(){}, onDone(){}, onToolUse(){}, onThinking(){}, onServerTool(){},
             onAttesa(){}, onRiserva(){}, onBudget(){}, onModello(){} };
const mod = (n,extra) => Object.assign({ name:'models/'+n,
  supportedGenerationMethods:['generateContent','streamGenerateContent'] }, extra||{});
function reset(){ store={}; chiamateGen=[]; listFallisce=false; P.gemini.model=null; }

console.log('\n1) Il messaggio del fornitore dice quale modello usare');
att('estrae dal caso reale', 'gemini-3.6-flash', T.modelloSuggeritoDaErrore(ERRORE_GOOGLE));
att('"use `x` instead"', 'gpt-5.6', T.modelloSuggeritoDaErrore('Please use `gpt-5.6` instead.'));
att('"use X instead"', 'grok-4.6', T.modelloSuggeritoDaErrore('Model retired, use grok-4.6 instead'));
att('"switch to X"', 'glm-4.7-flash', T.modelloSuggeritoDaErrore('Deprecated: switch to glm-4.7-flash'));
att('"replaced by X"', 'deepseek-v4', T.modelloSuggeritoDaErrore('replaced by deepseek-v4.'));
// il filtro che evita di scambiare una frase per un modello
att('non scambia "the Interactions API" per un modello', null,
    T.modelloSuggeritoDaErrore('We recommend you to use the Interactions API'));
att('non prende una parola senza cifre ne\' trattini', null,
    T.modelloSuggeritoDaErrore('please use something instead'));
att('messaggio vuoto', null, T.modelloSuggeritoDaErrore(''));
att('messaggio senza suggerimenti', null, T.modelloSuggeritoDaErrore('HTTP 500 internal error'));

console.log('\n2) Un modello bocciato non viene piu\' scelto');
reset();
att('all\'inizio non e\' bocciato', false, T.modelloBocciato('gemini','K','gemini-2.5-flash'));
T.bocciaModello('gemini','K','gemini-2.5-flash');
att('ora lo e\'', true, T.modelloBocciato('gemini','K','gemini-2.5-flash'));
att('ma solo per QUELLA chiave', false, T.modelloBocciato('gemini','ALTRA','gemini-2.5-flash'));
att('e solo per QUEL fornitore', false, T.modelloBocciato('groq','K','gemini-2.5-flash'));
// scadenza a 7 giorni: un modello puo' tornare
let b = JSON.parse(store.bsi_modelli_ko);
b.gemini.m['gemini-2.5-flash'] = Date.now() - 8*24*3600*1000;
store.bsi_modelli_ko = JSON.stringify(b);
att('dopo 7 giorni si riprova', false, T.modelloBocciato('gemini','K','gemini-2.5-flash'));

console.log('\n3) Il catalogo elenca un modello che NON si puo\' generare');
reset();
catalogo = [mod('gemini-2.5-flash'), mod('gemini-3.6-flash')];
generabili = new Set(['gemini-3.6-flash']);
// senza bocciature il punteggio sceglie gia' il 3.6 (piu' recente)
att('sceglie il piu\' recente', 'gemini-3.6-flash', await T.risolviModelloGemini(P.gemini,'K',true));

console.log('\n4) Il caso vero: il catalogo NON contiene il sostituto');
reset();
// Google elenca solo il vecchio per questa chiave, ma generare da' 404
catalogo = [mod('gemini-2.5-flash')];
generabili = new Set(['gemini-3.6-flash']);
att('la risoluzione sceglie l\'unico che vede', 'gemini-2.5-flash',
    await T.risolviModelloGemini(P.gemini,'K',true));
// ...e ora la prova che conta: il turno vero
reset();
catalogo = [mod('gemini-2.5-flash')];
generabili = new Set(['gemini-3.6-flash']);
let r = await global.bsiStreamChat('gemini','K',[{role:'user',content:'ciao'}],'', CB);
att('il turno RIESCE invece di fermarsi', true, !!r);
att('ha provato prima il vecchio', 'gemini-2.5-flash', chiamateGen[0]);
att('poi quello suggerito dal fornitore', 'gemini-3.6-flash', chiamateGen[1]);
att('due tentativi in tutto', 2, chiamateGen.length);
att('il modello morto resta bocciato', true, T.modelloBocciato('gemini','K','gemini-2.5-flash'));
att('e il nuovo e\' in cache per la prossima volta', true,
    /gemini-3\.6-flash/.test(store.bsi_modello_gemini || ''));

console.log('\n5) Il secondo messaggio non ripete l\'errore');
chiamateGen = [];
await global.bsiStreamChat('gemini','K',[{role:'user',content:'ancora'}],'', CB);
att('va diritto al modello giusto', 'gemini-3.6-flash', chiamateGen[0]);
att('un solo tentativo', 1, chiamateGen.length);

console.log('\n6) Nessun ciclo infinito se NIENTE funziona');
reset();
catalogo = [mod('gemini-2.5-flash'), mod('gemini-2.0-flash')];
generabili = new Set();          // nessuno generabile
let errore = null;
try{ await global.bsiStreamChat('gemini','K',[{role:'user',content:'x'}],'', CB); }
catch(e){ errore = e; }
att('si ferma con un errore', true, !!errore);
att('e riporta il 404 vero', true, /404/.test(errore.message));
att('tentativi limitati', true, chiamateGen.length <= 5);
att('ogni tentativo e\' stato DIVERSO', chiamateGen.length, new Set(chiamateGen).size);

console.log('\n7) Anche i fornitori OpenAI-compatibili escludono i bocciati');
reset();
global.fetch = async (url, opz) => {
  if(opz && opz.method === 'POST') throw new Error('non usato qui');
  return { ok:true, status:200, json: async()=>({ data:[{id:'openai/gpt-oss-120b'},{id:'qwen/qwen3.6-27b'}] }) };
};
att('senza bocciature prende il preferito', 'openai/gpt-oss-120b',
    await T.risolviModelloOpenai(P.groq,'gsk',true));
T.bocciaModello('groq','gsk','openai/gpt-oss-120b');
att('bocciato: scala al successivo', 'qwen/qwen3.6-27b',
    await T.risolviModelloOpenai(P.groq,'gsk',true));
T.bocciaModello('groq','gsk','qwen/qwen3.6-27b');
const ultimo = await T.risolviModelloOpenai(P.groq,'gsk',true);
att('bocciati tutti: non ne restituisce uno gia\' fallito', false,
    T.modelloBocciato('groq','gsk',ultimo));

console.log('\n8) Elenco irraggiungibile: la riserva salta i bocciati');
reset();
listFallisce = true;
catalogo = [];
generabili = new Set();
global.fetch = async (url, opz) => {
  url = String(url);
  if(opz && opz.method === 'POST') throw new Error('non usato qui');
  if(/\/v1beta\/models$/.test(url) || /\/models\?/.test(url)) throw new TypeError('Failed to fetch');
  const nome = url.split('/models/')[1].split('?')[0];
  return { ok:true, status:200, json: async()=>({}) };   // tutte le sonde passano
};
att('primo candidato: l\'alias', 'gemini-flash-latest', await T.risolviModelloGemini(P.gemini,'K',true));
T.bocciaModello('gemini','K','gemini-flash-latest');
att('bocciato l\'alias: passa al 3.6', 'gemini-3.6-flash', await T.risolviModelloGemini(P.gemini,'K',true));

console.log('\n9) Il reset azzera anche le bocciature');
store = { bsi_modelli_ko:'{"gemini":{"k":"x","m":{"a":1}}}', bsi_pro_license:'LICENZA' };
att('e\' nel gruppo chiavi', true,
    global.bsiDati.gruppi.chiavi.chiavi.indexOf('bsi_modelli_ko') >= 0);
global.bsiDati.cancella(['chiavi']);
att('sparita', undefined, store.bsi_modelli_ko);
att('licenza intatta', 'LICENZA', store.bsi_pro_license);

console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '✓ tutti passati — ') + ok + ' controlli');
process.exit(ko ? 1 : 0);
})();
