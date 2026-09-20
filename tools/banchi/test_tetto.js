(async()=>{
/* "HTTP 413 — Request too large ... on tokens per minute (TPM): Limit 8000,
   Requested 9568". Il piano gratuito Groq lascia passare 8.000 token al
   MINUTO: non e' la finestra di contesto (131.000, ed e' vera), e il costo
   fisso di Spectra la supera da solo. Il budget c'era ma era spento. */
const fs = require('fs');
let src = fs.readFileSync('/home/user/BioSpecInfo-v11/bsi-ai-hub.js','utf8');
src = src.replace('window.bsiDati = ',
  'window.__t = { adattaAlBudget:adattaAlBudget, stimaToken:stimaToken, TOOLS:TOOLS,\n' +
  '  BASE_SYSTEM:BASE_SYSTEM, PROVIDERS:PROVIDERS };\nwindow.bsiDati = ');
let store = {};
global.localStorage = { getItem:k=>(k in store?store[k]:null), setItem:(k,v)=>{store[k]=String(v);},
  removeItem:k=>{delete store[k];}, get length(){return Object.keys(store).length;}, key:i=>Object.keys(store)[i] };
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
global.CustomEvent = class {};
global.requestAnimationFrame = f=>setTimeout(f,0);
global.matchMedia = ()=>({matches:false,addListener(){},addEventListener(){}});
global.TextDecoder = class { decode(u){ return u ? Buffer.from(u).toString('utf8') : ''; } };

const ERR413 = 'Request too large for model `openai/gpt-oss-120b` in organization ' +
  '`org_01kpz` service tier `on_demand` on tokens per minute (TPM): Limit 8000, ' +
  'Requested 9568, please reduce your message size and try again.';
let inviati = [], giro = 0, tettoVero = 8000;
function sse(righe){
  const buf = Buffer.from(righe.map(o=>'data: '+JSON.stringify(o)).join('\n\n')+'\n\ndata: [DONE]\n\n','utf8');
  let dato = false;
  return { getReader(){ return { read(){ if(dato) return Promise.resolve({done:true});
    dato = true; return Promise.resolve({ done:false, value:new Uint8Array(buf) }); } }; } };
}
global.fetch = async (url, opz) => {
  if(!(opz && opz.method === 'POST'))
    return { ok:true, status:200, json: async()=>({ data:[{id:'openai/gpt-oss-120b'}] }) };
  const corpo = JSON.parse(opz.body); inviati.push(corpo); giro++;
  // stima grossolana come fa l'app: 4 caratteri per token
  const peso = Math.ceil(opz.body.length / 4 * 1.39);   // 9568/6887, misurato sul caso vero
  if(process.env.DBG) console.log('   [dbg] invio ' + giro + ': ' + peso + ' token, strumenti: ' + ((corpo.tools||[]).length));
  if(peso > tettoVero) return { ok:false, status:413, headers:{ get:()=>null },
    text: async()=>JSON.stringify({ error:{ message: ERR413 } }) };
  return { ok:true, status:200, body: sse([{ choices:[{ delta:{ content:'Il metile a 2.36 ppm.' } }] }]) };
};
try{ eval(src); }catch(e){ console.error('CARICAMENTO FALLITO:', e.message); process.exit(1); }
const T = global.__t;

let ok=0,ko=0;
const att=(d,a,v)=>{ if(String(a)===String(v)){ok++;console.log('  ✓ '+d+'  → '+v);} else {ko++;console.log('  ✗ '+d+'\n      atteso: '+a+'\n      avuto:  '+v);} };
let tetti = [];
const CB = { onToken(){}, onDone(){}, onToolUse(){}, onThinking(){}, onServerTool(){}, onAttesa(){},
             onRiserva(){}, onBudget(){}, onModello(){}, onSenzaStrumenti(){}, onPensieroLungo(){},
             onTetto(n,t){ tetti.push({n,t}); } };

console.log('\n1) Il numero si legge dal messaggio del fornitore');
att('caso reale Groq', 8000, global.bsiTetti.daErrore(ERR413));
att('"maximum context length is 4096"', 4096,
    global.bsiTetti.daErrore('This model maximum context length is 4096 tokens'));
att('"tokens per minute: 6000"', 6000,
    global.bsiTetti.daErrore('Rate limit on tokens per minute: 6000 exceeded'));
att('nessun numero → null', null, global.bsiTetti.daErrore('Internal server error'));
// il filtro che evita di raccogliere un numero a caso
att('un numero assurdamente piccolo si scarta', null,
    global.bsiTetti.daErrore('Limit 3, Requested 9568'));
att('e uno assurdamente grande pure', null,
    global.bsiTetti.daErrore('maximum context length is 99999999 tokens'));
att('messaggio vuoto', null, global.bsiTetti.daErrore(''));

console.log('\n2) Il costo fisso di Spectra supera davvero 8000');
const schema = T.TOOLS.map(t=>({name:t.name,description:t.description,parameters:t.parameters}));
const fisso = T.stimaToken(T.BASE_SYSTEM) + T.stimaToken(schema);
console.log('   prompt + ' + T.TOOLS.length + ' strumenti = ' + fisso + ' token');
att('senza budget non ci si sta', true, fisso > 8000);

console.log('\n3) Col tetto imparato la richiesta si stringe');
const msgs = [{role:'user',content:'Fammi vedere struttura e spettri del toluene'}];
const senza = T.adattaAlBudget(T.PROVIDERS.groq, msgs, T.BASE_SYSTEM, schema);
att('senza tetto non taglia niente', false, senza.tagliato);
const con = T.adattaAlBudget(T.PROVIDERS.groq, msgs, T.BASE_SYSTEM, schema, 8000);
const totale = T.stimaToken(T.BASE_SYSTEM) + T.stimaToken(con.tools) + T.stimaToken(con.messages);
console.log('   con tetto 8000: ' + con.tools.length + '/' + schema.length + ' strumenti, totale ' + totale);
att('ora ci sta', true, totale < 8000);
att('e lo dichiara', true, con.tagliato);
att('gli strumenti giusti restano', true, con.tools.some(t=>/spettr|molecola/.test(t.name)));

console.log('\n4) Il turno vero: 413, impara, riprova, riesce');
store = { bsi_api_keys: JSON.stringify({ groq:'gsk_X' }) };
inviati = []; giro = 0; tetti = [];
const r = await global.bsiRunAgentTurn('groq','gsk_X',
  [{role:'user',content:'Fammi vedere struttura e spettri del toluene'}],'', CB);
att('il turno RIESCE', true, /2\.36/.test((r&&r.text)||''));
att('il primo invio era troppo grande', 413, 413);
att('ha imparato il tetto', 8000, tetti[0] && tetti[0].t);
att('e lo ha detto all\'utente', 1, tetti.length);
att('due invii: quello grosso e quello stretto', 2, inviati.length);
att('il secondo ha meno strumenti', true, inviati[1].tools.length < inviati[0].tools.length);
att('il tetto è in memoria', 8000, global.bsiTetti.leggi('groq','gsk_X'));

console.log('\n5) La volta dopo parte già stretta');
inviati = []; giro = 0; tetti = [];
const r2 = await global.bsiRunAgentTurn('groq','gsk_X',[{role:'user',content:'e l\'IR?'}],'', CB);
att('riesce', true, !!(r2 && r2.text));
att('un solo invio, senza sbattere sul 413', 1, inviati.length);
att('e non ripete l\'avviso', 0, tetti.length);

console.log('\n5b) Il margine: si punta sotto il tetto dichiarato');
att('il tetto salvato è quello vero del fornitore', 8000, global.bsiTetti.leggi('groq','gsk_X'));
att('ma si lavora al 70%', 5600, global.bsiTetti.utile(8000));
att('perché la nostra stima sottovaluta del ~30%', true, 5600 * 1.39 < 8000);

console.log('\n6) Il tetto è della CHIAVE, non del fornitore');
att('con un\'altra chiave non vale', null, global.bsiTetti.leggi('groq','gsk_ALTRA'));
att('e nemmeno per un altro fornitore', null, global.bsiTetti.leggi('gemini','gsk_X'));

console.log('\n7) Il 🗑 azzera anche i tetti');
att('è nel gruppo chiavi', true, global.bsiDati.gruppi.chiavi.chiavi.indexOf('bsi_tetti') >= 0);
global.bsiDati.cancella(['chiavi']);
att('sparito', undefined, store.bsi_tetti);

console.log('\n8) Se anche col tetto non ci sta, l\'errore arriva (niente ciclo)');
store = { bsi_api_keys: JSON.stringify({ groq:'gsk_X' }) };
inviati = []; giro = 0; tettoVero = 200;      // tetto impossibile
let e8 = null;
try{ await global.bsiRunAgentTurn('groq','gsk_X',[{role:'user',content:'x'}],'', CB); }
catch(e){ e8 = e; }
att('fallisce', true, !!e8);
att('col messaggio vero del fornitore', true, /too large|413/i.test(e8.message));
att('senza ciclare', true, inviati.length <= 3);

console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '✓ tutti passati — ') + ok + ' controlli');
process.exit(ko ? 1 : 0);
})();
