/* Banco di prova per la risoluzione del modello Gemini.
   Carica bsi-ai-hub.js in un finto DOM minimale e sostituisce fetch. */
const fs = require('fs');
const path = '/home/user/BioSpecInfo-v11/bsi-ai-hub.js';
let src = fs.readFileSync(path, 'utf8');

// ---- ambiente finto ---------------------------------------------------
const store = {};
global.localStorage = {
  getItem: k => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: k => { delete store[k]; }
};
function el(){ return { style:{}, classList:{add(){},remove(){},contains(){return false}},
  appendChild(){}, addEventListener(){}, setAttribute(){}, removeAttribute(){},
  querySelector(){return null}, querySelectorAll(){return []}, remove(){},
  insertAdjacentHTML(){}, focus(){}, scrollIntoView(){}, get textContent(){return ''}, set textContent(v){},
  get innerHTML(){return ''}, set innerHTML(v){}, dataset:{}, children:[] }; }
global.document = {
  createElement: el, createElementNS: el, getElementById: () => null,
  querySelector: () => null, querySelectorAll: () => [],
  addEventListener(){}, body: el(), head: el(), documentElement: el(),
  readyState: 'complete'
};
global.window = global;
global.location = { href: 'https://test/', hostname: 'test', search: '', pathname: '/' };
global.navigator = { userAgent: 'node', language: 'it-IT' };
global.AbortController = class { constructor(){ this.signal = { aborted:false, addEventListener(){} }; } abort(){ this.signal.aborted = true; } };
global.TextDecoder = class { decode(){ return ''; } };
global.CustomEvent = class {};
global.requestAnimationFrame = f => setTimeout(f, 0);
global.matchMedia = () => ({ matches:false, addListener(){}, addEventListener(){} });
global.speechSynthesis = undefined;
global.fetch = async () => { throw new Error('fetch non mockato'); };

try { eval(src); } catch(e){ console.error('CARICAMENTO FALLITO:', e.message); process.exit(1); }

const risolvi = global.bsiGeminiRisolvi, reset = global.bsiGeminiReset;
if(typeof risolvi !== 'function'){ console.error('risolviModelloGemini non esposto'); process.exit(1); }

// ---- catalogo realistico ---------------------------------------------
function mod(n, meth){ return { name:'models/'+n, supportedGenerationMethods: meth || ['generateContent','streamGenerateContent'] }; }
const CATALOGO_2026 = [
  mod('embedding-001', ['embedContent']),
  mod('gemini-embedding-001', ['embedContent']),
  mod('gemini-1.5-flash'),
  mod('gemini-1.5-flash-8b'),
  mod('gemini-1.5-pro'),
  mod('gemini-2.0-flash'),
  mod('gemini-2.0-flash-lite'),
  mod('gemini-2.5-flash'),
  mod('gemini-2.5-flash-lite'),
  mod('gemini-2.5-flash-preview-09-2025'),
  mod('gemini-2.5-pro'),
  mod('gemini-flash-latest'),
  mod('gemini-live-2.5-flash-preview', ['bidiGenerateContent']),
  mod('gemini-2.5-flash-native-audio-preview'),
  mod('gemini-2.5-flash-image'),
  mod('imagen-4.0-generate-001', ['predict']),
  mod('veo-3.0-generate-001', ['predictLongRunning']),
  mod('gemma-3-27b-it'),
  mod('aqa', ['generateAnswer'])
];

let chiamate = [];
function mockList(catalogo, opts){
  opts = opts || {};
  global.fetch = async (url) => {
    chiamate.push(url);
    if(url.indexOf('/models?') >= 0){
      if(opts.listFallisce) return { ok:false, status: opts.listFallisce, json: async()=>({}) , text: async()=>'' };
      if(opts.paginato){
        const tok = /pageToken=([^&]*)/.exec(url);
        if(!tok) return { ok:true, json: async()=>({ models: catalogo.slice(0,5), nextPageToken:'P2' }) };
        return { ok:true, json: async()=>({ models: catalogo.slice(5) }) };
      }
      return { ok:true, json: async()=>({ models: catalogo }) };
    }
    // GET metadati singolo modello
    const m = /\/models\/([^?]+)\?/.exec(url);
    const nome = m ? decodeURIComponent(m[1]) : '';
    const trovato = catalogo.some(x => x.name === 'models/'+nome);
    return { ok: trovato, status: trovato?200:404, json: async()=>({}), text: async()=>'' };
  };
}

// ---- casi -------------------------------------------------------------
let ok = 0, ko = 0;
function att(desc, atteso, avuto){
  if(String(atteso) === String(avuto)){ ok++; console.log('  ✓ ' + desc + '  → ' + avuto); }
  else { ko++; console.log('  ✗ ' + desc + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); }
}

(async () => {
  console.log('\n1) ListModels disponibile — sceglie il migliore stabile');
  reset(); chiamate = []; mockList(CATALOGO_2026);
  att('catalogo 2026', 'gemini-2.5-flash', await risolvi('AIzaTEST_KEY_1', true));

  console.log('\n2) Cache — la seconda chiamata non tocca la rete');
  chiamate = [];
  att('stesso modello dalla cache', 'gemini-2.5-flash', await risolvi('AIzaTEST_KEY_1', false));
  att('nessuna chiamata di rete', 0, chiamate.length);

  console.log('\n3) Chiave diversa = cache diversa');
  chiamate = [];
  await risolvi('AIzaALTRA_CHIAVE', false);
  att('ha interrogato la rete', true, chiamate.length > 0);

  console.log('\n4) Auto-aggiornamento: se esce Gemini 3 lo preferisce');
  reset(); mockList(CATALOGO_2026.concat([mod('gemini-3.0-flash'), mod('gemini-3.0-pro')]));
  att('sceglie la versione nuova', 'gemini-3.0-flash', await risolvi('AIzaK3', true));

  console.log('\n5) Catalogo impoverito: resta solo pro');
  reset(); mockList([mod('gemini-2.5-pro'), mod('embedding-001', ['embedContent'])]);
  att('ripiega su pro', 'gemini-2.5-pro', await risolvi('AIzaK4', true));

  console.log('\n6) Solo modelli non conversazionali → cascata sui candidati');
  reset(); mockList([mod('imagen-4.0-generate-001', ['predict']), mod('gemini-2.0-flash')]);
  att('scarta imagen, tiene 2.0-flash', 'gemini-2.0-flash', await risolvi('AIzaK5', true));

  console.log('\n7) ListModels vietato (403) → sonda i candidati');
  reset(); mockList([mod('gemini-2.0-flash'), mod('gemini-flash-latest')], { listFallisce: 403 });
  // 'gemini-flash-latest' e' il PRIMO candidato: e' un alias, e un alias non
  // viene ritirato. Sta li' apposta (vedi il commento in PROVIDERS.gemini).
  att('primo candidato esistente', 'gemini-flash-latest', await risolvi('AIzaK6', true));

  console.log('\n8) ListModels 403 e primo candidato assente → passa al successivo');
  reset(); mockList([mod('gemini-flash-latest')], { listFallisce: 403 });
  att('salta i mancanti', 'gemini-flash-latest', await risolvi('AIzaK7', true));

  console.log('\n9) Rete completamente giù → primo candidato, nessun crash');
  reset(); global.fetch = async () => { throw new Error('offline'); };
  att('riserva statica: l\'alias', 'gemini-flash-latest', await risolvi('AIzaK8', true));
  att('non mette in cache un ripiego cieco', null, store['bsi_gemini_modello'] || null);

  console.log('\n10) Paginazione di ListModels');
  reset(); mockList(CATALOGO_2026, { paginato: true });
  att('unisce le pagine', 'gemini-2.5-flash', await risolvi('AIzaK9', true));

  console.log('\n11) Chiave assente → nessuna chiamata di rete');
  chiamate = [];
  att('riserva immediata: l\'alias', 'gemini-flash-latest', await risolvi('', false));
  att('zero chiamate', 0, chiamate.length);

  console.log('\n12) URL costruito da buildRequest');
  reset(); mockList(CATALOGO_2026);
  const P = global.BSI_AI_PROVIDERS;
  P.gemini.model = await risolvi('AIzaURL', true);
  let urlVisto = null;
  global.fetch = async (u) => { urlVisto = u; return { ok:false, status:400, text: async()=>'{"error":{"message":"stop"}}' }; };
  try{ await global.bsiStreamChat('gemini','AIzaURL',[{role:'user',content:'ciao'}],'sys',{onToken(){},onDone(){}}); }catch(e){}
  att('endpoint corretto', true, /generativelanguage\.googleapis\.com\/v1beta\/models\/gemini-2\.5-flash:streamGenerateContent\?alt=sse&key=AIzaURL$/.test(urlVisto||''));
  att('niente "null" nell\'URL', false, /null/.test(urlVisto||''));

  console.log('\n13) 404 in corsa → ririsolve e ritenta una volta sola');
  reset(); chiamate = [];
  store['bsi_gemini_modello'] = JSON.stringify({ model:'gemini-1.5-flash', k: null, ts: Date.now() });
  // cache con impronta sbagliata: verrà ignorata. Simuliamo invece il ritiro
  // forzando la cache corretta tramite una prima risoluzione su catalogo vecchio.
  mockList([mod('gemini-1.5-flash')]);
  P.gemini.model = await risolvi('AIza404', true);
  att('cache iniziale', 'gemini-1.5-flash', P.gemini.model);
  // ora Google lo ritira: generazione dà 404, ListModels espone solo il 2.5
  let tentativi = [];
  global.fetch = async (u) => {
    if(u.indexOf(':streamGenerateContent') >= 0){
      tentativi.push(u);
      if(u.indexOf('gemini-1.5-flash') >= 0)
        return { ok:false, status:404, text: async()=>'{"error":{"message":"models/gemini-1.5-flash is not found"}}' };
      return { ok:false, status:400, text: async()=>'{"error":{"message":"ok, arrivato al modello nuovo"}}' };
    }
    if(u.indexOf('/models?') >= 0) return { ok:true, json: async()=>({ models:[mod('gemini-2.5-flash')] }) };
    return { ok:false, status:404, text: async()=>'' };
  };
  let errFinale = '';
  try{ await global.bsiStreamChat('gemini','AIza404',[{role:'user',content:'ciao'}],'sys',{onToken(){},onDone(){}}); }
  catch(e){ errFinale = e.message; }
  att('ritenta', true, tentativi.length >= 2);
  att('il secondo usa il modello nuovo', true, /gemini-2\.5-flash/.test(tentativi[1]||''));
  att('non cicla: l\'errore finale è quello vero', true, /arrivato al modello nuovo/.test(errFinale));

  console.log('\n14) 404 persistente → si ferma, non entra in ciclo');
  reset(); tentativi = [];
  global.fetch = async (u) => {
    if(u.indexOf(':streamGenerateContent') >= 0){ tentativi.push(u);
      return { ok:false, status:404, text: async()=>'{"error":{"message":"non trovato"}}' }; }
    if(u.indexOf('/models?') >= 0) return { ok:true, json: async()=>({ models:[mod('gemini-2.5-flash')] }) };
    return { ok:false, status:404, text: async()=>'' };
  };
  P.gemini.model = null; let e14='';
  try{ await global.bsiStreamChat('gemini','AIzaLoop',[{role:'user',content:'ciao'}],'sys',{onToken(){},onDone(){}}); }
  catch(e){ e14 = e.message; }
  // Non piu' "un tentativo solo": ora prova modelli DIVERSI finche' non
  // finiscono. Cio' che deve restare vero e' che TERMINA e che non
  // ripete due volte lo stesso nome (sarebbe un ciclo mascherato).
  att('termina, con tentativi limitati', true, tentativi.length <= 5);
  const nomi14 = tentativi.map(u=>(/models\/([^:]+):/.exec(u)||[])[1]);
  att('ogni tentativo con un modello diverso', nomi14.length, new Set(nomi14).size);
  att('errore riportato', true, /HTTP 404/.test(e14));

  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' passati');
  process.exit(ko ? 1 : 0);
})();
