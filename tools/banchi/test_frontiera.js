/* I servizi di frontiera e la chiave condivisa fra configurazioni gemelle. */
const fs=require('fs');
let src=fs.readFileSync('/home/user/BioSpecInfo-v11/bsi-ai-hub.js','utf8');
src = src.replace('window.bsiDati = ',
  'window.__f = { risolviModello:risolviModello, chiaveCanonica:chiaveCanonica,'+
  ' getSavedKey:getSavedKey, setSavedKey:setSavedKey, clearSavedKey:clearSavedKey };\nwindow.bsiDati = ');
let store={};
global.localStorage={getItem:k=>(k in store?store[k]:null),setItem:(k,v)=>{store[k]=String(v);},removeItem:k=>{delete store[k];},get length(){return Object.keys(store).length;},key:i=>Object.keys(store)[i]};
function el(){return{style:{},classList:{add(){},remove(){},contains(){return false}},appendChild(){},addEventListener(){},setAttribute(){},removeAttribute(){},querySelector(){return null},querySelectorAll(){return[]},remove(){},insertAdjacentHTML(){},focus(){},scrollIntoView(){},textContent:'',innerHTML:'',dataset:{},children:[]};}
global.document={createElement:el,createElementNS:el,getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},body:el(),head:el(),documentElement:el(),readyState:'complete'};
global.window=global; global.location={href:'https://t/',hostname:'t',search:'',pathname:'/'};
global.navigator={userAgent:'node',language:'it-IT'};
global.AbortController=class{constructor(){this.signal={aborted:false,addEventListener(){}}}abort(){}};
global.TextDecoder=class{decode(){return''}}; global.CustomEvent=class{};
global.requestAnimationFrame=f=>setTimeout(f,0); global.matchMedia=()=>({matches:false,addListener(){},addEventListener(){}});
global.fetch=async()=>{throw new Error('non mockato')};
try{ eval(src); }catch(e){ console.error('CARICAMENTO FALLITO:', e.message); process.exit(1); }

const F=global.__f, P=global.BSI_AI_PROVIDERS, reset=global.bsiGeminiReset;
let ok=0,ko=0,chiamate=[];
const att=(d,a,v)=>{ if(String(a)===String(v)){ok++;console.log('  ✓ '+d+'  → '+v);} else {ko++;console.log('  ✗ '+d+'\n      atteso: '+a+'\n      avuto:  '+v);} };
function montaOpenai(cat){ global.fetch=async(u,o)=>{ u=String(u); chiamate.push({url:u,h:(o&&o.headers)||{}});
  if(/\/models$/.test(u)) return {ok:true,json:async()=>({data:cat.map(id=>({id}))})};
  return {ok:false,status:400,text:async()=>'{}'}; }; }
function montaGemini(cat){ global.fetch=async(u)=>{ u=String(u); chiamate.push({url:u});
  if(/generativelanguage.*\/models\?/.test(u)) return {ok:true,json:async()=>({models:cat.map(n=>
    ({name:'models/'+n,supportedGenerationMethods:['generateContent','streamGenerateContent']}))})};
  return {ok:false,status:400,text:async()=>'{}'}; }; }

(async()=>{
console.log('\n1) OpenAI: prende Sol se la chiave lo vede');
reset(); chiamate=[]; montaOpenai(['gpt-5.6-sol','gpt-5.6-terra','gpt-4o','whisper-1']);
att('sceglie Sol','gpt-5.6-sol', await F.risolviModello(P.openai,'sk-proj-1',true));
att('endpoint','https://api.openai.com/v1/models', chiamate[0].url);

console.log('\n2) OpenAI: Sol e\' ad accesso limitato → scala a Terra');
reset(); montaOpenai(['gpt-5.6-terra','gpt-5.6-luna','gpt-4o']);
att('scala a Terra','gpt-5.6-terra', await F.risolviModello(P.openai,'sk-proj-2',true));
reset(); montaOpenai(['gpt-5.5','gpt-4o']);
att('scala ancora a 5.5','gpt-5.5', await F.risolviModello(P.openai,'sk-proj-3',true));

console.log('\n3) DeepSeek: preferisce Pro, poi il reasoner');
reset(); montaOpenai(['deepseek-chat','deepseek-v4-pro','deepseek-v4-flash']);
att('sceglie Pro','deepseek-v4-pro', await F.risolviModello(P.deepseek,'sk-d1',true));
reset(); montaOpenai(['deepseek-chat','deepseek-reasoner']);
att('poi il reasoner','deepseek-reasoner', await F.risolviModello(P.deepseek,'sk-d2',true));

console.log('\n4) I due Gemini condividono famiglia ma NON il modello');
reset(); montaGemini(['gemini-2.5-flash','gemini-3-pro','gemini-2.5-pro']);
// NIENTE reset in mezzo: e' proprio la coesistenza che si vuole verificare.
const flash = await F.risolviModello(P.gemini,'AIza',true);
const pro = await F.risolviModello(P.gemini_pro,'AIza',true);
att('il gratuito prende un flash', true, /flash/.test(flash));
att('il Pro prende un pro', true, /pro/.test(pro));
att('sono diversi', true, flash !== pro);

console.log('\n5) Cache separata: non si sovrascrivono a vicenda');
att('due voci di cache distinte', true,
    !!store['bsi_modello_gemini'] && !!store['bsi_modello_gemini_pro']);
att('la cache del gratuito tiene il flash', true,
    /flash/.test(JSON.parse(store['bsi_modello_gemini']).model));
att('la cache del Pro tiene il pro', true,
    /pro/.test(JSON.parse(store['bsi_modello_gemini_pro']).model));
// e riletti dalla cache restano diversi
att('riletti dalla cache: gratuito', flash, await F.risolviModello(P.gemini,'AIza',false));
att('riletti dalla cache: Pro', pro, await F.risolviModello(P.gemini_pro,'AIza',false));

console.log('\n5b) La generazione nuova vince, anche senza numero minore');
// Google dai modelli di terza generazione ha tolto il ".0" dal nome:
// "gemini-3-pro", non "gemini-3.0-pro". Se il punteggio pretende il punto,
// il modello PIU' NUOVO vale quanto un alias e perde contro il vecchio.
reset(); montaGemini(['gemini-2.5-flash','gemini-3-flash','gemini-1.5-flash']);
att('il gratuito sale a gemini-3-flash','gemini-3-flash', await F.risolviModello(P.gemini,'AIzaN1',true));
reset(); montaGemini(['gemini-2.5-pro','gemini-3-pro']);
att('il Pro sale a gemini-3-pro','gemini-3-pro', await F.risolviModello(P.gemini_pro,'AIzaN2',true));
reset(); montaGemini(['gemini-3-flash','gemini-4-flash','gemini-2.5-flash']);
att('e continuera\' a salire (gemini-4)','gemini-4-flash', await F.risolviModello(P.gemini,'AIzaN3',true));
// il rischio opposto: una generazione nuova ma a pagamento non deve essere
// scelta da una configurazione gratuita.
reset(); montaGemini(['gemini-2.5-flash','gemini-3-pro','gemini-4-pro']);
att('la gratuita NON prende un modello a pagamento','gemini-2.5-flash',
    await F.risolviModello(P.gemini,'AIzaN5',true));
reset(); montaGemini(['gemini-flash-latest','gemini-2.5-flash']);
att('un alias resta sotto a una versione vera','gemini-2.5-flash', await F.risolviModello(P.gemini,'AIzaN4',true));

console.log('\n6) Chiave condivisa: si incolla una volta sola');
store={}; F.setSavedKey('sk-ant-VERA','claude_fable');
att('vale per Opus 5','sk-ant-VERA', F.getSavedKey('claude'));
att('vale per Sonnet','sk-ant-VERA', F.getSavedKey('claude_sonnet'));
att('vale per Gemini 3 Pro dalla chiave Gemini', true, F.chiaveCanonica('gemini_pro')==='gemini');
att('NON vale per Groq','', F.getSavedKey('groq'));

console.log('\n7) Salvata da un gemello, vale per tutti');
store={}; F.setSavedKey('sk-ant-DA-SONNET','claude_sonnet');
att('salvata sotto la canonica','claude_fable', F.chiaveCanonica('claude_sonnet'));
att('vale per Fable','sk-ant-DA-SONNET', F.getSavedKey('claude_fable'));
att('una sola voce salvata', 1, Object.keys(JSON.parse(store['bsi_api_keys'])).length);

console.log('\n8) Gemini gratuito e Gemini 3 Pro: una chiave sola');
store={}; F.setSavedKey('AIzaMIA','gemini');
att('vale anche per il Pro','AIzaMIA', F.getSavedKey('gemini_pro'));

console.log('\n9) Toglierla la toglie a tutti i gemelli');
F.clearSavedKey('gemini_pro');
att('via dal Pro','', F.getSavedKey('gemini_pro'));
att('via anche dal gratuito','', F.getSavedKey('gemini'));

console.log('\n10) Le schede dei nuovi sono complete');
['openai','gemini_pro','deepseek'].forEach(id=>{
  const q=P[id];
  att(id+': completa', true, !!(q.name && q.keyLink && q.placeholder && q.note && q.modelliCandidati.length));
  att(id+': a pagamento, dichiarato', false, q.free === true);
  att(id+': nessun modello cablato', null, q.model);
});

console.log('\n10f) Anthropic ora ha la riserva come tutti gli altri');
// era l'unico fornitore col nome cablato: nessuna rete di sicurezza se il
// modello sparisce o la chiave non lo vede.
reset(); chiamate=[]; montaOpenai(['claude-opus-5','claude-opus-4-8','claude-sonnet-5']);
att('sceglie Opus 5', 'claude-opus-5', await F.risolviModello(P.claude,'sk-ant-1',true));
att('interroga /v1/models', 'https://api.anthropic.com/v1/models', chiamate[0].url);

reset(); montaOpenai(['claude-opus-4-8','claude-sonnet-5','claude-haiku-4-5']);
att('se Opus 5 sparisce ripiega su 4.8', 'claude-opus-4-8', await F.risolviModello(P.claude,'sk-ant-2',true));
reset(); montaOpenai(['claude-opus-4-7','claude-sonnet-5']);
att('poi su 4.7', 'claude-opus-4-7', await F.risolviModello(P.claude,'sk-ant-3',true));

console.log('\n10g) Ogni Claude resta nella SUA famiglia');
reset(); montaOpenai(['claude-fable-5-1','claude-opus-5','claude-sonnet-5']);
att('Fable prende un fable', 'claude-fable-5-1', await F.risolviModello(P.claude_fable,'sk-a',true));
att('Opus prende un opus', 'claude-opus-5', await F.risolviModello(P.claude,'sk-b',true));
att('Sonnet prende un sonnet', 'claude-sonnet-5', await F.risolviModello(P.claude_sonnet,'sk-c',true));
// il caso che romperebbe tutto: l'Opus che sceglie un Sonnet perche' costa meno
reset(); montaOpenai(['claude-sonnet-5','claude-opus-4-8']);
att('Opus NON ripiega su un Sonnet', 'claude-opus-4-8', await F.risolviModello(P.claude,'sk-d',true));

console.log('\n11) La riserva automatica NON tocca i nuovi (sono a pagamento)');
store['bsi_api_keys']=JSON.stringify({groq:'g',openai:'o',deepseek:'d',gemini_pro:'x'});
const lista = global.__t ? null : null;
const util = (function(){ // providerUtilizzabili non e' esposto qui: si verifica via free
  return Object.keys(P).filter(id=>P[id].free);
})();
att('i tre nuovi non sono gratuiti', true,
    ['openai','gemini_pro','deepseek'].every(id=>util.indexOf(id)<0));

console.log('\n' + (ko?'✗ '+ko+' FALLITI, ':'') + ok + ' passati');
process.exit(ko?1:0);
})();
