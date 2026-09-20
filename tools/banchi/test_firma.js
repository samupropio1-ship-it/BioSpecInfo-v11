(async()=>{
/* "HTTP 400 — Function call is missing a thought_signature in functionCall
   parts." I modelli Gemini che ragionano allegano a ogni parte una firma
   opaca e la rivogliono IDENTICA nel turno successivo. Buttandola via, il
   primo giro di strumenti funziona e il secondo no: il modo piu'
   confondente di fallire. */
const fs = require('fs');
let src = fs.readFileSync('/home/user/BioSpecInfo-v11/bsi-ai-hub.js','utf8');
src = src.replace('window.bsiDati = ',
  'window.__t = { appendAgentTurn:appendAgentTurn, parseSSE:(typeof parseSSE!=="undefined"?parseSSE:null) };\nwindow.bsiDati = ');
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

const FIRMA_A = 'CtcBAdHtim9xQk9zZXJ2YXRvcmVGaXJtYUE=';
const FIRMA_B = 'CtcBAdHtim9xQk9zZXJ2YXRvcmVGaXJtYUI=';
const FIRMA_T = 'CtcBAdHtim9xVEVTVE9GaXJtYQ==';

// Corpi inviati a Gemini, per ispezionarli
let inviati = [], giro = 0;
function sse(righe){
  const testo = righe.map(o=>'data: '+JSON.stringify(o)).join('\n\n')+'\n\n';
  const buf = Buffer.from(testo,'utf8');
  let dato = false;
  return { getReader(){ return { read(){ if(dato) return Promise.resolve({done:true});
    dato = true; return Promise.resolve({ done:false, value:new Uint8Array(buf) }); } }; } };
}
global.fetch = async (url, opz) => {
  url = String(url);
  if(!(opz && opz.method === 'POST'))
    return { ok:true, status:200, json: async()=>({ models:[{ name:'models/gemini-3.6-flash',
      supportedGenerationMethods:['generateContent','streamGenerateContent'] }] }) };
  inviati.push(JSON.parse(opz.body));
  giro++;
  if(giro === 1) return { ok:true, status:200, body: sse([
    { candidates:[{ content:{ parts:[
      { text:'Verifico.', thoughtSignature: FIRMA_T },
      { functionCall:{ name:'analizza_molecola', args:{ nome:'toluene' } }, thoughtSignature: FIRMA_A }
    ] } }] }
  ]) };
  if(giro === 2) return { ok:true, status:200, body: sse([
    { candidates:[{ content:{ parts:[
      // seconda firma con la grafia proto, per provare entrambe
      { functionCall:{ name:'massa_molecolare', args:{ formula:'C7H8' } }, thought_signature: FIRMA_B }
    ] } }] }
  ]) };
  return { ok:true, status:200, body: sse([
    { candidates:[{ content:{ parts:[{ text:'Ecco lo spettro: il metile a 2.36 ppm.' }] } }] }
  ]) };
};
try{ eval(src); }catch(e){ console.error('CARICAMENTO FALLITO:', e.message); process.exit(1); }

let ok=0,ko=0;
const att=(d,a,v)=>{ if(String(a)===String(v)){ok++;console.log('  ✓ '+d+'  → '+v);} else {ko++;console.log('  ✗ '+d+'\n      atteso: '+a+'\n      avuto:  '+v);} };
const CB = { onToken(){}, onDone(){}, onToolUse(){}, onThinking(){}, onServerTool(){},
             onAttesa(){}, onRiserva(){}, onBudget(){}, onModello(){} };

console.log('\n1) Il turno a piu\' giri arriva in fondo');
store = { bsi_api_keys: JSON.stringify({ gemini:'AIza' }) };
const r = await global.bsiRunAgentTurn('gemini','AIza',[{role:'user',content:'Verifica lo spettro NMR del toluene'}],'', CB);
att('il turno RIESCE', true, !!(r && r.text));
att('tre chiamate a Gemini', 3, inviati.length);
att('la risposta finale arriva', true, /2\.36/.test((r&&r.text)||''));

console.log('\n2) La firma torna indietro, sulla parte giusta');
// il 2° invio contiene il turno 'model' del 1° giro
const t2 = inviati[1].contents.filter(c=>c.role==='model');
const partiModel = t2.length ? t2[t2.length-1].parts : [];
console.log('   parti rimandate:', JSON.stringify(partiModel).slice(0,220));
const pFun = partiModel.filter(p=>p.functionCall)[0];
const pTxt = partiModel.filter(p=>p.text)[0];
att('la functionCall è stata rimandata', true, !!pFun);
att('CON la sua firma', FIRMA_A, pFun && pFun.thoughtSignature);
att('e la parte di testo con la sua', FIRMA_T, pTxt && pTxt.thoughtSignature);

console.log('\n3) Anche la grafia snake_case viene raccolta');
const t3 = inviati[2].contents.filter(c=>c.role==='model');
const p3 = t3[t3.length-1].parts.filter(p=>p.functionCall)[0];
att('firma del 2° giro rimandata', FIRMA_B, p3 && p3.thoughtSignature);

console.log('\n4) Un modello che NON firma non manda campi vuoti');
inviati = []; giro = 0;
global.fetch = async (url, opz) => {
  if(!(opz && opz.method === 'POST'))
    return { ok:true, status:200, json: async()=>({ models:[{ name:'models/gemini-3.6-flash',
      supportedGenerationMethods:['generateContent','streamGenerateContent'] }] }) };
  inviati.push(JSON.parse(opz.body)); giro++;
  if(giro === 1) return { ok:true, status:200, body: sse([
    { candidates:[{ content:{ parts:[{ functionCall:{ name:'massa_molecolare', args:{ formula:'H2O' } } }] } }] } ]) };
  return { ok:true, status:200, body: sse([{ candidates:[{ content:{ parts:[{ text:'18 g/mol.' }] } }] }]) };
};
const r2 = await global.bsiRunAgentTurn('gemini','AIza',[{role:'user',content:'massa acqua'}],'', CB);
att('funziona lo stesso', true, !!(r2 && r2.text));
const pm = inviati[1].contents.filter(c=>c.role==='model').pop().parts.filter(p=>p.functionCall)[0];
att('nessun campo firma inventato', undefined, pm && pm.thoughtSignature);
att('e nessun null di troppo', false, pm && ('thoughtSignature' in pm));

console.log('\n5) Rete di sicurezza: rifiuto al SECONDO giro, non solo al primo');
// e' il caso reale: il 1o giro passa, il 2o viene rifiutato per la firma.
inviati = []; giro = 0;
let senzaStrumenti = [];
const CB2 = Object.assign({}, CB, { onSenzaStrumenti(n){ senzaStrumenti.push(n); } });
global.fetch = async (url, opz) => {
  if(!(opz && opz.method === 'POST'))
    return { ok:true, status:200, json: async()=>({ models:[{ name:'models/gemini-3.6-flash',
      supportedGenerationMethods:['generateContent','streamGenerateContent'] }] }) };
  const corpo = JSON.parse(opz.body); inviati.push(corpo); giro++;
  const conStrumenti = !!(corpo.tools && corpo.tools.length);
  if(giro === 1) return { ok:true, status:200, body: sse([
    { candidates:[{ content:{ parts:[{ functionCall:{ name:'massa_molecolare', args:{ formula:'C7H8' } } }] } }] } ]) };
  if(giro === 2 && conStrumenti) return { ok:false, status:400, headers:{ get:()=>null },
    text: async()=>JSON.stringify({ error:{ message:'Function call is missing a thought_signature in functionCall parts.' } }) };
  return { ok:true, status:200, body: sse([{ candidates:[{ content:{ parts:[{ text:'Il metile cade a 2.36 ppm.' }] } }] }]) };
};
const r5 = await global.bsiRunAgentTurn('gemini','AIza',[{role:'user',content:'nmr toluene'}],'', CB2);
att('l\'utente riceve comunque una risposta', true, /2\.36/.test((r5&&r5.text)||''));
// Da quando c'e' il recupero col marcatore, questo caso si risolve PRIMA e
// MEGLIO: il turno riesce conservando gli strumenti, senza degradare.
att('senza dover rinunciare agli strumenti', 0, senzaStrumenti.length);
const ultimo = inviati[inviati.length-1];
att('gli strumenti sono ancora attivi', true, !!(ultimo.tools && ultimo.tools.length));
att('e riparte dalla domanda originale, non dal turno rifiutato',
    1, ultimo.contents.filter(c=>c.role==='user').length);

console.log('\n5b) Se anche il marcatore viene rifiutato, la rete regge');
inviati = []; giro = 0; senzaStrumenti = [];
global.fetch = async (url, opz) => {
  if(!(opz && opz.method === 'POST'))
    return { ok:true, status:200, json: async()=>({ models:[{ name:'models/gemini-3.6-flash',
      supportedGenerationMethods:['generateContent','streamGenerateContent'] }] }) };
  const corpo = JSON.parse(opz.body); inviati.push(corpo); giro++;
  const conStrumenti = !!(corpo.tools && corpo.tools.length);
  if(!conStrumenti) return { ok:true, status:200, body: sse([
    { candidates:[{ content:{ parts:[{ text:'Rispondo a memoria: 2.36 ppm.' }] } }] } ]) };
  const mod = corpo.contents.filter(c=>c.role==='model').pop();
  if(!mod) return { ok:true, status:200, body: sse([
    { candidates:[{ content:{ parts:[{ functionCall:{ name:'massa_molecolare', args:{ formula:'C7H8' } } }] } }] } ]) };
  // ogni turno che riporta indietro una functionCall viene rifiutato, marcatore compreso
  return { ok:false, status:400, headers:{ get:()=>null },
    text: async()=>JSON.stringify({ error:{ message:'Function call is missing a thought_signature in functionCall parts.' } }) };
};
const r5b = await global.bsiRunAgentTurn('gemini','AIza',[{role:'user',content:'nmr toluene'}],'', CB2);
att('l\'utente riceve comunque una risposta', true, /2\.36/.test((r5b&&r5b.text)||''));
att('e gli viene DETTO che è senza strumenti', 1, senzaStrumenti.length);
att('l\'ultima chiamata è davvero senza strumenti', undefined, inviati[inviati.length-1].tools);
att('e non cicla', true, inviati.length <= 6);

console.log('\n6) Un errore NON di formato non fa perdere gli strumenti');
inviati = []; giro = 0; senzaStrumenti = [];
global.fetch = async (url, opz) => {
  if(!(opz && opz.method === 'POST'))
    return { ok:true, status:200, json: async()=>({ models:[{ name:'models/gemini-3.6-flash',
      supportedGenerationMethods:['generateContent','streamGenerateContent'] }] }) };
  inviati.push(JSON.parse(opz.body)); giro++;
  return { ok:false, status:401, headers:{ get:()=>null },
    text: async()=>JSON.stringify({ error:{ message:'API key not valid.' } }) };
};
let e6 = null;
try{ await global.bsiRunAgentTurn('gemini','AIza',[{role:'user',content:'x'}],'', CB2); }catch(e){ e6 = e; }
att('fallisce', true, !!e6);
att('senza ritentare a vuoto', 1, inviati.length);
att('e senza spegnere gli strumenti', 0, senzaStrumenti.length);

console.log('\n7) Lo stream ripete la stessa parte: lo strumento gira UNA volta');
inviati = []; giro = 0;
let eseguiti = [];
const CB3 = Object.assign({}, CB, { onToolUse(l){ eseguiti.push(l); } });
global.fetch = async (url, opz) => {
  if(!(opz && opz.method === 'POST'))
    return { ok:true, status:200, json: async()=>({ models:[{ name:'models/gemini-3.6-flash',
      supportedGenerationMethods:['generateContent','streamGenerateContent'] }] }) };
  inviati.push(JSON.parse(opz.body)); giro++;
  if(giro === 1) return { ok:true, status:200, body: sse([
    // stessa functionCall in due chunk consecutivi (artefatto dello stream)
    { candidates:[{ content:{ parts:[{ functionCall:{ name:'massa_molecolare', args:{ formula:'C7H8' } } }] } }] },
    { candidates:[{ content:{ parts:[{ functionCall:{ name:'massa_molecolare', args:{ formula:'C7H8' } } }] } }] }
  ]) };
  return { ok:true, status:200, body: sse([{ candidates:[{ content:{ parts:[{ text:'92.14 g/mol.' }] } }] }]) };
};
await global.bsiRunAgentTurn('gemini','AIza',[{role:'user',content:'massa toluene'}],'', CB3);
att('lo strumento è stato eseguito una volta sola', 1, eseguiti.length);
const pmod = inviati[1].contents.filter(c=>c.role==='model').pop().parts.filter(p=>p.functionCall);
att('e una sola functionCall rimandata', 1, pmod.length);

console.log('\n8) Ma due chiamate DIVERSE in chunk separati restano due');
inviati = []; giro = 0; eseguiti = [];
global.fetch = async (url, opz) => {
  if(!(opz && opz.method === 'POST'))
    return { ok:true, status:200, json: async()=>({ models:[{ name:'models/gemini-3.6-flash',
      supportedGenerationMethods:['generateContent','streamGenerateContent'] }] }) };
  inviati.push(JSON.parse(opz.body)); giro++;
  if(giro === 1) return { ok:true, status:200, body: sse([
    { candidates:[{ content:{ parts:[{ functionCall:{ name:'massa_molecolare', args:{ formula:'C7H8' } } }] } }] },
    { candidates:[{ content:{ parts:[{ functionCall:{ name:'massa_molecolare', args:{ formula:'H2O' } } }] } }] }
  ]) };
  return { ok:true, status:200, body: sse([{ candidates:[{ content:{ parts:[{ text:'fatto.' }] } }] }]) };
};
await global.bsiRunAgentTurn('gemini','AIza',[{role:'user',content:'due masse'}],'', CB3);
att('due strumenti eseguiti', 2, eseguiti.length);

console.log('\n9) functionResponse: la risposta viaggia sempre come oggetto');
const ris = inviati[1].contents.filter(c=>c.role==='user').pop().parts;
att('e\' una parte functionResponse', true, !!(ris[0] && ris[0].functionResponse));
att('e response e\' un oggetto', 'object', typeof ris[0].functionResponse.response);
att('non un array', false, Array.isArray(ris[0].functionResponse.response));

console.log('\n10) Il marcatore di salto NON parte a priori, solo dopo il rifiuto');
inviati = []; giro = 0;
let senza = [];
const CB4 = Object.assign({}, CB, { onSenzaStrumenti(n){ senza.push(n); } });
global.fetch = async (url, opz) => {
  if(!(opz && opz.method === 'POST'))
    return { ok:true, status:200, json: async()=>({ models:[{ name:'models/gemini-3.6-flash',
      supportedGenerationMethods:['generateContent','streamGenerateContent'] }] }) };
  const corpo = JSON.parse(opz.body); inviati.push(corpo); giro++;
  const mod = corpo.contents.filter(c=>c.role==='model').pop();
  const fc = mod && mod.parts.filter(p=>p.functionCall)[0];
  if(giro === 1) return { ok:true, status:200, body: sse([
    { candidates:[{ content:{ parts:[{ functionCall:{ name:'massa_molecolare', args:{ formula:'C7H8' } } }] } }] } ]) };
  // il 2o invio NON ha firma: lo rifiuto. Il 3o deve avere il marcatore.
  if(giro === 2) return { ok:false, status:400, headers:{ get:()=>null },
    text: async()=>JSON.stringify({ error:{ message:'Function call is missing a thought_signature in functionCall parts.' } }) };
  if(giro === 3) return { ok:true, status:200, body: sse([
    { candidates:[{ content:{ parts:[{ functionCall:{ name:'massa_molecolare', args:{ formula:'C7H8' } } }] } }] } ]) };
  return { ok:true, status:200, body: sse([{ candidates:[{ content:{ parts:[{ text:'92.14 g/mol, il metile a 2.36.' }] } }] }]) };
};
const r10 = await global.bsiRunAgentTurn('gemini','AIza',[{role:'user',content:'toluene'}],'', CB4);
const primoModel = inviati[1].contents.filter(c=>c.role==='model').pop().parts.filter(p=>p.functionCall)[0];
att('al primo giro NESSUN marcatore inventato', undefined, primoModel.thoughtSignature);
const dopoRifiuto = inviati[3].contents.filter(c=>c.role==='model').pop().parts.filter(p=>p.functionCall)[0];
att('dopo il rifiuto sì', 'skip_thought_signature_validator', dopoRifiuto && dopoRifiuto.thoughtSignature);
att('e l\'utente ottiene la risposta CON gli strumenti', true, /2\.36/.test((r10&&r10.text)||''));
att('senza dover rinunciare agli strumenti', 0, senza.length);

console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '✓ tutti passati — ') + ok + ' controlli');
process.exit(ko ? 1 : 0);
})();
