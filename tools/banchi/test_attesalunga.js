(async()=>{
/* Il caso reale: Gemini 3 Pro (a pagamento, senza fatturazione) risponde
   "limite al minuto, aspetta 37 secondi" mentre Groq risponde in mezzo
   secondo ed e' li'. Stare fermi 37 secondi e' schermo bloccato per niente. */
const fs=require('fs');
let src=fs.readFileSync('/home/user/BioSpecInfo-v11/bsi-ai-hub.js','utf8')
  .replace('window.bsiDati = ','window.__t={ATTESA_TROPPO_LUNGA_MS:ATTESA_TROPPO_LUNGA_MS};\nwindow.bsiDati = ');
let store={};
global.localStorage={getItem:k=>(k in store?store[k]:null),setItem:(k,v)=>{store[k]=String(v);},removeItem:k=>{delete store[k];},get length(){return Object.keys(store).length;},key:i=>Object.keys(store)[i]};
function el(){return{style:{},classList:{add(){},remove(){},contains(){return false}},appendChild(){},addEventListener(){},setAttribute(){},removeAttribute(){},querySelector(){return null},querySelectorAll(){return[]},remove(){},insertAdjacentHTML(){},focus(){},scrollIntoView(){},textContent:'',innerHTML:'',dataset:{},children:[]};}
global.document={createElement:el,createElementNS:el,getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},body:el(),head:el(),documentElement:el(),readyState:'complete'};
global.window=global; global.location={href:'https://t/',hostname:'t',search:'',pathname:'/'};
global.navigator={userAgent:'node',language:'it-IT'};
global.AbortController=class{constructor(){this.signal={aborted:false,addEventListener(){}}}abort(){}};
global.CustomEvent=class{}; global.requestAnimationFrame=f=>setTimeout(f,0);
global.matchMedia=()=>({matches:false,addListener(){},addEventListener(){}});
global.TextDecoder=class{decode(u){return u?Buffer.from(u).toString('utf8'):''}};

let chiamate=[], attese=[], riserve=[];
function sse(t){const buf=Buffer.from('data: '+JSON.stringify(t)+'\n\ndata: [DONE]\n\n','utf8');let d=false;
  return {getReader(){return{read(){if(d)return Promise.resolve({done:true});d=true;
    return Promise.resolve({done:false,value:new Uint8Array(buf)});}};}};}
function host(u){ return /googleapis/.test(u)?'gemini':/groq/.test(u)?'groq':/z\.ai/.test(u)?'zai':'altro'; }
let piano={};
global.fetch=async(url,opz)=>{
  url=String(url);
  if(!(opz&&opz.method==='POST')) return {ok:true,status:200,json:async()=>({
    models:[{name:'models/gemini-3-pro',supportedGenerationMethods:['generateContent','streamGenerateContent']}],
    data:[{id:'openai/gpt-oss-120b'}]})};
  const h=host(url); const c=piano[h]||[]; const st=c.length?c.shift():200;
  chiamate.push({h,st});
  if(st===200) return {ok:true,status:200,body:sse({choices:[{delta:{content:'La glicolisi comincia con l\'esochinasi.'}}],
    candidates:[{content:{parts:[{text:'La glicolisi comincia con l\'esochinasi.'}]}}]})};
  return {ok:false,status:st,headers:{get:k=>k==='Retry-After'?'37':null},
    text:async()=>JSON.stringify({error:{message:'Quota exceeded, please retry in 37s'}})};
};
try{ eval(src); }catch(e){ console.error('CARICAMENTO FALLITO:',e.message); process.exit(1); }
const T=global.__t;
let ok=0,ko=0;
const att=(d,a,v)=>{ if(String(a)===String(v)){ok++;console.log('  ✓ '+d+'  → '+v);} else {ko++;console.log('  ✗ '+d+'\n      atteso: '+a+'\n      avuto:  '+v);} };
const CB={onToken(){},onDone(){},onToolUse(){},onThinking(){},onServerTool(){},
  onAttesa(ms,n,st){attese.push({ms,n,st});}, onRiserva(da,a,m){riserve.push({da,a,m});},
  onBudget(){},onModello(){},onSenzaStrumenti(){},onPensieroLungo(){},onTetto(){}};
const veroSet=global.setTimeout; global.setTimeout=(f,ms)=>veroSet(f,ms>50?1:ms);
function reset(chiavi){ store=chiavi?{bsi_api_keys:JSON.stringify(chiavi)}:{}; chiamate=[];attese=[];riserve=[];piano={}; }

console.log('\n1) La soglia');
att('dieci secondi', 10000, T.ATTESA_TROPPO_LUNGA_MS);

console.log('\n2) IL CASO REALE: Gemini Pro chiede 37s, Groq e\' pronto');
reset({ gemini:'AIza', groq:'gsk_X' });
piano.gemini=[429]; piano.groq=[200];
const r = await global.bsiRunAgentTurn('gemini_pro','AIza',[{role:'user',content:'glicolisi'}],'',CB);
att('la risposta arriva', true, /esochinasi/.test((r&&r.text)||''));
att('NON ha aspettato', 0, attese.length);
att('ha cambiato fornitore', 1, riserve.length);
att('e ha detto che era per l\'attesa', true, /^attesa:/.test((riserve[0]||{}).m||''));
att('dicendo quanti secondi', 'attesa:37', (riserve[0]||{}).m);
att('la risposta viene da groq', 'groq', chiamate[chiamate.length-1].h);

console.log('\n3) Senza alternative si aspetta davvero (meglio 37s di un errore)');
reset({ gemini:'AIza' });
piano.gemini=[429,200];
const r2 = await global.bsiRunAgentTurn('gemini','AIza',[{role:'user',content:'x'}],'',CB);
att('la risposta arriva lo stesso', true, !!(r2&&r2.text));
att('stavolta ha aspettato', 1, attese.length);
att('e lo ha detto', 37000, (attese[0]||{}).ms);
att('nessun cambio di fornitore', 0, riserve.length);

console.log('\n4) Un\'attesa BREVE non fa cambiare fornitore');
reset({ gemini:'AIza', groq:'gsk_X' });
global.fetch=(function(orig){ return async(url,opz)=>{
  if(!(opz&&opz.method==='POST')) return orig(url,opz);
  const h=host(String(url)); const c=piano[h]||[]; const st=c.length?c.shift():200;
  chiamate.push({h,st});
  if(st===200) return {ok:true,status:200,body:sse({choices:[{delta:{content:'ok breve'}}],
    candidates:[{content:{parts:[{text:'ok breve'}]}}]})};
  return {ok:false,status:st,headers:{get:k=>k==='Retry-After'?'3':null},
    text:async()=>JSON.stringify({error:{message:'rate limited, retry in 3s'}})};
};})(global.fetch);
piano.gemini=[429,200];
const r3 = await global.bsiRunAgentTurn('gemini','AIza',[{role:'user',content:'x'}],'',CB);
att('risponde', true, !!(r3&&r3.text));
att('ha aspettato i 3 secondi', 3000, (attese[0]||{}).ms);
att('senza cambiare fornitore', 0, riserve.length);

console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '✓ tutti passati — ') + ok + ' controlli');
process.exit(ko?1:0);
})();
