/* Cancellazione dati: deve togliere TUTTO quello che promette e NIENTE altro. */
const fs = require('fs');
let src = fs.readFileSync('/home/user/BioSpecInfo-v11/bsi-ai-hub.js','utf8');
let store = {};
global.localStorage = {
  getItem:k=>(k in store?store[k]:null),
  setItem:(k,v)=>{store[k]=String(v);},
  removeItem:k=>{delete store[k];},
  get length(){ return Object.keys(store).length; },
  key:i=>Object.keys(store)[i]
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
global.fetch = async()=>{ throw new Error('non mockato'); };
try{ eval(src); }catch(e){ console.error('CARICAMENTO FALLITO:', e.message); process.exit(1); }

const cancella = global.bsiDati.cancella, GRUPPI = global.bsiDati.gruppi, conta = global.bsiDati.conta;
let ok=0,ko=0;
const att=(d,a,v)=>{ if(String(a)===String(v)){ok++;console.log('  ✓ '+d+'  → '+v);} else {ko++;console.log('  ✗ '+d+'\n      atteso: '+a+'\n      avuto:  '+v);} };

// Stato realistico: un utente che ha usato l'app parecchio
function popola(){
  store = {
    bsi_ai_threads: '[{"id":"t1"}]', bsi_ai_history: '[]', bsi_ai_memory: '["x"]',
    bsi_api_keys: '{"groq":"gsk_VECCHIA"}', bsi_api_key: 'gsk_ANCORA_PIU_VECCHIA',
    bsi_ai_provider: 'groq', bsi_proxy_url: 'https://p.test',
    bsi_modello_groq: '{"model":"llama-3.3-70b-versatile"}',
    bsi_modello_gemini: '{"model":"gemini-1.5-flash"}',
    bsi_gemini_modello: '{"model":"vecchio-formato"}',
    bsi_srs: '{"cards":{}}', bsi_sm2: '{}',
    bsi_quiz_history: '[]', bsi_quiz_progress: '{}', bsi_notes: '[]',
    bsi_note_1: 'appunto', bsi_note_2: 'altro appunto',
    bsi_studypath: '{}', bsi_ds_prog: '{}', bsi_ds_proj: '{}', bsi_guide_v3:'{}', bsi_section:'smol',
    // da NON toccare mai
    bsi_pro_license: 'LICENZA-VERA', bsi_trial_start: '123456', bsi_device_id: 'dev-1',
    bsi_user_email: 'samu@example.com', bsi_rdkit_lib2: 'cdn'
  };
}
const INTOCCABILI = ['bsi_pro_license','bsi_trial_start','bsi_device_id','bsi_user_email'];
function intoccabiliIntatti(){ return INTOCCABILI.every(k => store[k] !== undefined); }

console.log('\n1) Solo chat: cronologia via, chiavi intatte');
popola();
cancella(['chat']);
att('thread rimossi', undefined, store.bsi_ai_threads);
att('cronologia rimossa', undefined, store.bsi_ai_history);
att('chiavi ancora lì', '{"groq":"gsk_VECCHIA"}', store.bsi_api_keys);
att('memoria ancora lì', '["x"]', store.bsi_ai_memory);
att('intoccabili intatti', true, intoccabiliIntatti());

console.log('\n2) Chiavi: anche il formato VECCHIO a chiave singola');
popola();
cancella(['chiavi']);
att('mappa chiavi rimossa', undefined, store.bsi_api_keys);
att('chiave singola vecchia rimossa', undefined, store.bsi_api_key);
att('provider rimosso', undefined, store.bsi_ai_provider);
att('override proxy rimosso', undefined, store.bsi_proxy_url);
att('cache modello groq rimossa', undefined, store.bsi_modello_groq);
att('cache modello gemini rimossa', undefined, store.bsi_modello_gemini);
att('cache in formato vecchio rimossa', undefined, store.bsi_gemini_modello);
att('le chat restano', '[{"id":"t1"}]', store.bsi_ai_threads);

console.log('\n3) La chiave vecchia NON deve tornare da sola');
// getKeysMap() rimigra bsi_api_key in bsi_api_keys: se il reset non
// togliesse entrambe, la chiave riapparirebbe al primo accesso.
popola();
cancella(['chiavi']);
// bsiHasAnySavedKey() chiama getKeysMap(), che e' proprio il punto in cui
// la migrazione dal formato vecchio potrebbe far risorgere la chiave.
global.bsiHasAnySavedKey();
att('nessuna chiave risorge', undefined, store.bsi_api_keys);
att('nessuna chiave utilizzabile', false, global.bsiHasAnySavedKey());

console.log('\n4) Il predefinito del pulsante: chat + chiavi');
popola();
const atteso4 = conta('chat') + conta('chiavi');   // calcolato, non scritto a mano
const tolte = cancella(['chat','chiavi']);
att('conteggio coerente col conteggio dei gruppi', atteso4, tolte);
att('memoria preservata', '["x"]', store.bsi_ai_memory);
att('ripasso preservato', '{"cards":{}}', store.bsi_srs);
att('quiz preservati', '[]', store.bsi_quiz_history);
att('appunti preservati', 'appunto', store.bsi_note_1);
att('intoccabili intatti', true, intoccabiliIntatti());

console.log('\n5) Tutto: anche i prefissi bsi_note_*');
popola();
cancella(['chat','chiavi','memoria','ripasso','app']);
att('appunto 1 via', undefined, store.bsi_note_1);
att('appunto 2 via', undefined, store.bsi_note_2);
att('ripasso via', undefined, store.bsi_srs);
att('quiz via', undefined, store.bsi_quiz_history);
att('LICENZA SALVA', 'LICENZA-VERA', store.bsi_pro_license);
att('prova salva', '123456', store.bsi_trial_start);
att('identità dispositivo salva', 'dev-1', store.bsi_device_id);
att('email salva', 'samu@example.com', store.bsi_user_email);

console.log('\n6) Cancellare due volte non esplode');
popola(); cancella(['chat','chiavi']);
att('seconda passata: 0 voci', 0, cancella(['chat','chiavi']));

console.log('\n7) Elenco vuoto: non tocca niente');
popola();
const prima7 = Object.keys(store).length;
att('niente rimosso', 0, cancella([]));
att('storage intatto', prima7, Object.keys(store).length);

console.log('\n8) Gruppo inesistente ignorato');
popola();
att('nessun errore', 0, cancella(['inventato']));

console.log('\n9) I contatori dicono il vero');
popola();
att('chat: 2 voci', 2, conta('chat'));
att('chiavi: 7 voci', 7, conta('chiavi'));
cancella(['chat']);
att('chat: 0 dopo la cancellazione', 0, conta('chat'));

console.log('\n10) Lo stato in memoria si azzera con le chiavi');
popola();
global.BSI_AI_PROVIDERS.groq.model = 'llama-3.3-70b-versatile';
cancella(['chiavi']);
att('modello risolto azzerato', null, global.BSI_AI_PROVIDERS.groq.model);
att('azzerato anche per Claude, che ora ha la riserva', null, global.BSI_AI_PROVIDERS.claude.model);

console.log('\n11) Ogni gruppo dichiara etichetta e dettaglio');
let manca = Object.keys(GRUPPI).filter(k => !GRUPPI[k].etichetta || !GRUPPI[k].dettaglio);
att('nessun gruppo incompleto', 0, manca.length);

console.log('\n' + (ko?'✗ '+ko+' FALLITI, ':'') + ok + ' passati');
process.exit(ko?1:0);
