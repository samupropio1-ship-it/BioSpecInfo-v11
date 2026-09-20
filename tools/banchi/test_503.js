(async()=>{
/* "HTTP 503 — This model is currently experiencing high demand. Spikes in
   demand are usually temporary. Please try again later."
   Il fornitore dice cosa fare, e finora lo ignoravamo: solo il 429 veniva
   ritentato, quindi un sovraccarico finiva a video come errore definitivo
   e senza nemmeno provare un altro fornitore. */
const fs = require('fs');
let src = fs.readFileSync('/home/user/BioSpecInfo-v11/bsi-ai-hub.js','utf8');
src = src.replace('window.bsiDati = ',
  'window.__t = { erroreTemporaneo:erroreTemporaneo, attesaDaRisposta:attesaDaRisposta,\n' +
  '  providerUtilizzabili:providerUtilizzabili, PROVIDERS:PROVIDERS,\n' +
  '  TENTATIVI_TEMPORANEO:TENTATIVI_TEMPORANEO };\nwindow.bsiDati = ');
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

const ERR503 = 'This model is currently experiencing high demand. Spikes in demand ' +
               'are usually temporary. Please try again later.';
// stato per la rete finta
let piano = {};          // host -> [stati da restituire, in ordine]
let chiamate = [];       // {host, stato}
function hostDi(u){
  if(u.indexOf('googleapis') >= 0) return 'gemini';
  if(u.indexOf('groq') >= 0) return 'groq';
  if(u.indexOf('z.ai') >= 0) return 'zai';
  return 'altro';
}
global.fetch = async (url, opz) => {
  url = String(url);
  const post = opz && opz.method === 'POST';
  if(!post) return { ok:true, status:200, json: async()=>({
    models:[{ name:'models/gemini-3.6-flash',
              supportedGenerationMethods:['generateContent','streamGenerateContent'] }],
    data:[{id:'openai/gpt-oss-120b'}] }) };
  const h = hostDi(url);
  const coda = piano[h] || [];
  const stato = coda.length ? coda.shift() : 200;
  chiamate.push({ host:h, stato:stato });
  if(stato === 200) return { ok:true, status:200, body:null, text: async()=>'ok',
                             json: async()=>({ candidates:[] }) };
  const msg = stato === 400 ? 'Invalid JSON payload received.'
            : stato === 401 ? 'API key not valid.'
            : ERR503;
  return { ok:false, status:stato, headers:{ get:()=>null },
           text: async()=>JSON.stringify({ error:{ message: msg } }) };
};
try{ eval(src); }catch(e){ console.error('CARICAMENTO FALLITO:', e.message); process.exit(1); }
const T = global.__t;

let ok=0,ko=0;
const att=(d,a,v)=>{ if(String(a)===String(v)){ok++;console.log('  ✓ '+d+'  → '+v);} else {ko++;console.log('  ✗ '+d+'\n      atteso: '+a+'\n      avuto:  '+v);} };
let attese = [], riserve = [];
const CB = { onToken(){}, onDone(){}, onToolUse(){}, onThinking(){}, onServerTool(){},
             onAttesa(ms,nome,stato){ attese.push({ms,nome,stato}); },
             onRiserva(da,a,motivo){ riserve.push({da,a,motivo}); },
             onBudget(){}, onModello(){} };
function reset(chiavi){
  store = chiavi ? { bsi_api_keys: JSON.stringify(chiavi) } : {};
  chiamate = []; attese = []; riserve = []; piano = {};
}
// le attese vere renderebbero il test lunghissimo: le azzero, misuro le
// DECISIONI (quante volte riprova, con che motivo), non il cronometro.
const veroSetTimeout = global.setTimeout;
global.setTimeout = (f, ms) => veroSetTimeout(f, ms > 50 ? 1 : ms);

console.log('\n1) Quali stati sono temporanei');
[[429,true],[500,true],[502,true],[503,true],[504,true],[529,true],
 [400,false],[401,false],[403,false],[404,false],[402,false],[200,false]].forEach(function(c){
  att('HTTP ' + c[0], c[1], T.erroreTemporaneo(c[0]));
});

console.log('\n2) Un 503 passeggero viene superato da solo');
reset({ gemini:'AIza' });
piano.gemini = [503, 503, 200];        // due sovraccarichi, poi passa
let r = await global.bsiStreamChat('gemini','AIza',[{role:'user',content:'ciao'}],'', CB);
att('il turno RIESCE', true, !!r);
att('tre chiamate: 503, 503, ok', 3, chiamate.length);
att('ha aspettato due volte', 2, attese.length);
att('e lo ha detto col motivo giusto', 503, attese[0] && attese[0].stato);

console.log('\n3) La nota NON dice "limite al minuto" per un 503');
// il testo lo compone la UI; qui verifico che il motivo arrivi distinto
reset({ gemini:'AIza' });
piano.gemini = [429, 200];
await global.bsiStreamChat('gemini','AIza',[{role:'user',content:'x'}],'', CB);
att('su un 429 il motivo è 429', 429, attese[0] && attese[0].stato);

console.log('\n4) Sovraccarico che non passa: si cambia fornitore');
reset({ gemini:'AIza', groq:'gsk_X' });
piano.gemini = [503,503,503,503,503];   // sempre giù
piano.groq   = [200];
let r2 = await global.bsiRunAgentTurn('gemini','AIza',[{role:'user',content:'ciao'}],'', CB);
att('il turno RIESCE lo stesso', true, !!r2);
att('è passato a un altro fornitore', 1, riserve.length);
/* Il motivo ora e' "attesa:12" e non piu' "sovraccarico", ed e' un
   MIGLIORAMENTO: la scala esponenziale per un 503 parte da ~12 secondi, e
   da quando c'e' la regola dell'attesa lunga Spectra non sta ferma 12
   secondi se ha un'alternativa che risponde. L'intento del test — cambia
   fornitore e DICE perche' — regge, e la ragione data e' piu' precisa.
   Il caso "aspetta davvero" resta coperto dalla sezione 5, dove non ci
   sono alternative. */
att('e ha detto perché', true, /^(sovraccarico|attesa:\d+)$/.test((riserve[0]||{}).motivo||''));
att('ed e\' la ragione precisa: l\'attesa', 'attesa:12', riserve[0] && riserve[0].motivo);
att('la risposta è arrivata da groq', 'groq', chiamate[chiamate.length-1].host);

console.log('\n5) Con una sola chiave: messaggio utile, non "HTTP 503"');
reset({ gemini:'AIza' });
piano.gemini = [503,503,503,503,503,503,503];
let e5 = null;
try{ await global.bsiRunAgentTurn('gemini','AIza',[{role:'user',content:'ciao'}],'', CB); }
catch(err){ e5 = err; }
att('fallisce', true, !!e5);
att('dice che è sovraccarico, non un codice nudo', true, /sovraccarico/.test(e5.message));
att('dice che NON è colpa della chiave', true, /non è un problema della tua chiave/i.test(e5.message));
att('e suggerisce cosa fare', true, /seconda chiave gratuita/.test(e5.message));
att('conserva il codice vero per la diagnosi', true, /\[503:/.test(e5.message));
att('è marcato come sovraccarico', true, e5.sovraccarico === true);
att('tentativi limitati', true, chiamate.length <= T.TENTATIVI_TEMPORANEO + 1);

console.log('\n6) Un errore NON temporaneo non viene ritentato');
reset({ gemini:'AIza' });
piano.gemini = [400, 200];
let e6 = null;
try{ await global.bsiRunAgentTurn('gemini','AIza',[{role:'user',content:'ciao'}],'', CB); }
catch(err){ e6 = err; }
att('fallisce subito', true, !!e6);
att('una sola chiamata', 1, chiamate.length);
att('nessuna attesa', 0, attese.length);
att('non è marcato sovraccarico', undefined, (e6 && e6.sovraccarico) || undefined);

// il difetto trovato scrivendo questa sezione: con la bocciatura che dura
// 7 giorni, un 400 che nomina "model" di sfuggita escluderebbe un modello
// sano. Ora serve una frase che dica davvero che non c'e'.
console.log('\n6b) Un 503 che contiene la parola "model" NON è un modello sparito');
reset({ gemini:'AIza' });
piano.gemini = [503, 200];
await global.bsiRunAgentTurn('gemini','AIza',[{role:'user',content:'ciao'}],'', CB);
att('nessun modello bocciato', undefined, store.bsi_modelli_ko);
att('ha solo aspettato e riprovato', 1, attese.length);

console.log('\n7) Una chiave sbagliata non manda in giro la domanda');
reset({ gemini:'AIza', groq:'gsk_X' });
piano.gemini = [401];
let e7 = null;
try{ await global.bsiRunAgentTurn('gemini','AIza',[{role:'user',content:'ciao'}],'', CB); }
catch(err){ e7 = err; }
att('fallisce', true, !!e7);
att('NON prova gli altri fornitori', 0, riserve.length);
att('perché si ripeterebbe identico ovunque', 1, chiamate.length);

console.log('\n8) L\'attesa parte più alta per un sovraccarico che per un 429');
const finto = { headers:{ get:()=>null } };
const a429 = T.attesaDaRisposta(finto, '', 0);
const a503 = T.attesaDaRisposta(finto, '', 1);   // il codice usa giro+1 sui non-429
att('il sovraccarico aspetta di più', true, a503 > a429);
att('ma il Retry-After del fornitore vince su tutto', 7000,
    T.attesaDaRisposta({ headers:{ get:(k)=>k==='Retry-After'?'7':null } }, '', 3));

console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '✓ tutti passati — ') + ok + ' controlli');
process.exit(ko ? 1 : 0);
})();
