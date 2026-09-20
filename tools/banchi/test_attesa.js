(async()=>{
/* "⏱ Google Gemini Flash non ha risposto entro 45s." — dopo che TRE
   strumenti erano andati a buon fine. Il modello stava ragionando sulla
   risposta finale: mentre pensa non manda niente, e 45 s valevano sia per
   "aspetto il primo byte" sia per "buco a meta' stream". Due cose diverse. */
const fs = require('fs');
let src = fs.readFileSync('/home/user/BioSpecInfo-v11/bsi-ai-hub.js','utf8');
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
global.CustomEvent = class {};
global.requestAnimationFrame = f=>setTimeout(f,0);
global.matchMedia = ()=>({matches:false,addListener(){},addEventListener(){}});
global.TextDecoder = class { decode(u){ return u ? Buffer.from(u).toString('utf8') : ''; } };
global.AbortController = class {
  constructor(){ this._l=[]; this.signal={ aborted:false, addEventListener:(t,f)=>this._l.push(f) }; }
  abort(){ this.signal.aborted = true; this._l.forEach(f=>f()); }
};

// ── orologio finto: misuro le DECISIONI, non aspetto minuti veri ─────────
let ora = 0, timers = [], idT = 1;
const veroSet = global.setTimeout, veroClear = global.clearTimeout;
global.setTimeout = (f, ms) => { const t = { id: idT++, f, quando: ora + (ms||0) }; timers.push(t); return t.id; };
global.clearTimeout = (id) => { timers = timers.filter(t => t.id !== id); };
function avanza(ms){                      // fa scoccare i timer dovuti
  const fine = ora + ms;
  for(;;){
    const dovuti = timers.filter(t => t.quando <= fine).sort((a,b)=>a.quando-b.quando);
    if(!dovuti.length) break;
    const t = dovuti[0];
    timers = timers.filter(x => x.id !== t.id);
    ora = t.quando;
    t.f();
  }
  ora = fine;
}
const attendi = () => new Promise(r => veroSet(r, 0));

let silenzio = null;   // promessa che non si risolve: simula il modello che pensa
global.fetch = async (url, opz) => {
  if(!(opz && opz.method === 'POST'))
    return { ok:true, status:200, json: async()=>({ models:[{ name:'models/gemini-3.6-flash',
      supportedGenerationMethods:['generateContent','streamGenerateContent'] }] }) };
  const sig = opz.signal;
  return new Promise((risolvi, respingi) => {
    silenzio = { risolvi, respingi };
    if(sig) sig.addEventListener('abort', () => {
      const e = new Error('The operation was aborted'); e.name = 'AbortError'; respingi(e);
    });
  });
};
try{ eval(src); }catch(e){ console.error('CARICAMENTO FALLITO:', e.message); process.exit(1); }

let ok=0,ko=0;
const att=(d,a,v)=>{ if(String(a)===String(v)){ok++;console.log('  ✓ '+d+'  → '+v);} else {ko++;console.log('  ✗ '+d+'\n      atteso: '+a+'\n      avuto:  '+v);} };
let note = [];
const CB = { onToken(){}, onDone(){}, onToolUse(){}, onThinking(){}, onServerTool(){}, onAttesa(){},
             onRiserva(){}, onBudget(){}, onModello(){}, onSenzaStrumenti(){},
             onPensieroLungo(n,s){ note.push({n,s}); } };

console.log('\n1) 45 s di silenzio NON troncano più il turno');
store = { bsi_api_keys: JSON.stringify({ gemini:'AIza' }), bsi_nucleo:'0' };
note = []; timers = []; ora = 0;
let esito = null, finito = false;
global.bsiStreamChat('gemini','AIza',[{role:'user',content:'x'}],'', CB)
  .then(r=>{ esito = r; finito = true; }).catch(e=>{ esito = e; finito = true; });
await attendi();
avanza(46000); await attendi();
att('a 46 s è ancora in ascolto', false, finito);

console.log('\n2) Ma dopo 20 s dice che sta ragionando');
att('nota mostrata', 1, note.length);
att('e dice quanto aspetta', 180, note[0] && note[0].s);

console.log('\n3) A 3 minuti si arrende, spiegando');
avanza(140000); await attendi();
att('adesso ha rinunciato', true, finito);
att('è un timeout', true, /non ha risposto entro/.test((esito&&esito.message)||''));
att('dice 180 s, non 45', true, /180s/.test((esito&&esito.message)||''));
att('e suggerisce di spegnere il Nucleo', true, /Modalità Nucleo/.test((esito&&esito.message)||''));
att('è marcato irraggiungibile (fa scattare la riserva)', true, !!(esito&&esito.irraggiungibile));

console.log('\n4) In Modalità Nucleo la finestra è più larga');
store = { bsi_api_keys: JSON.stringify({ gemini:'AIza' }), bsi_nucleo:'1' };
note = []; timers = []; ora = 0; finito = false; esito = null;
global.bsiStreamChat('gemini','AIza',[{role:'user',content:'x'}],'', CB)
  .then(r=>{ esito=r; finito=true; }).catch(e=>{ esito=e; finito=true; });
await attendi();
avanza(25000); await attendi();
att('la nota dice 5 minuti', 300, note[0] && note[0].s);
avanza(190000); await attendi();
att('a 3,5 minuti sta ancora aspettando', false, finito);
avanza(120000); await attendi();
att('a 5,5 minuti si ferma', true, finito);

console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '✓ tutti passati — ') + ok + ' controlli');
process.exit(ko ? 1 : 0);
})();
