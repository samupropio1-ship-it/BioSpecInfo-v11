/* Capacita' Anthropic: cache del prompt, strumenti lato server, e il vincolo
   che ricerca web e sandbox non convivono. */
const fs=require('fs');
let src=fs.readFileSync('/home/user/BioSpecInfo-v11/bsi-ai-hub.js','utf8');
src = src.replace('window.bsiDati = ',
  'window.__a = { buildRequest:buildRequest, partiSistema:partiSistema, testoSistema:testoSistema,'+
  ' get BASE_SYSTEM(){return BASE_SYSTEM}, get TOOLS(){return TOOLS} };\nwindow.bsiDati = ');
let store={};
global.localStorage={getItem:k=>(k in store?store[k]:null),setItem:(k,v)=>{store[k]=String(v);},removeItem:k=>{delete store[k];},get length(){return Object.keys(store).length;},key:i=>Object.keys(store)[i]};
function el(){return{style:{},classList:{add(){},remove(){},contains(){return false}},appendChild(){},addEventListener(){},setAttribute(){},removeAttribute(){},querySelector(){return null},querySelectorAll(){return[]},remove(){},insertAdjacentHTML(){},focus(){},scrollIntoView(){},textContent:'',innerHTML:'',dataset:{},children:[]};}
global.document={createElement:el,createElementNS:el,getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},body:el(),head:el(),documentElement:el(),readyState:'complete'};
global.window=global; global.location={href:'https://t/',hostname:'t',search:'',pathname:'/'};
global.navigator={userAgent:'node',language:'it-IT'};
global.AbortController=class{constructor(){this.signal={aborted:false,addEventListener(){}}}abort(){}};
global.TextDecoder=class{decode(){return''}}; global.CustomEvent=class{};
global.requestAnimationFrame=f=>setTimeout(f,0); global.matchMedia=()=>({matches:false,addListener(){},addEventListener(){}});
global.fetch=async()=>{throw new Error('x')};
try{ eval(src); }catch(e){ console.error('CARICAMENTO FALLITO:', e.message); process.exit(1); }

const A=global.__a, P=global.BSI_AI_PROVIDERS;
let ok=0,ko=0;
const att=(d,a,v)=>{ if(String(a)===String(v)){ok++;console.log('  ✓ '+d+'  → '+v);} else {ko++;console.log('  ✗ '+d+'\n      atteso: '+a+'\n      avuto:  '+v);} };
const SCHEMA = A.TOOLS.map(t=>({name:t.name,description:t.description,parameters:t.parameters}));
const msgs = [{role:'user',content:'ciao'}];
const sysDue = ['PARTE STABILE lunga ' + 'x'.repeat(400), 'parte volatile che cambia'];

console.log('\n1) Il prompt di sistema viaggia in due blocchi');
store={};
let r = A.buildRequest(P.claude,'k',msgs,sysDue,SCHEMA);
att('system e\' un array', true, Array.isArray(r.body.system));
att('due blocchi', 2, r.body.system.length);
att('il primo e\' marcato per la cache', 'ephemeral', r.body.system[0].cache_control.type);
att('il secondo NON e\' in cache', undefined, r.body.system[1].cache_control);
att('la parte stabile e\' la prima', true, /PARTE STABILE/.test(r.body.system[0].text));
att('la volatile e\' la seconda', 'parte volatile che cambia', r.body.system[1].text);

console.log('\n2) Anche gli strumenti entrano in cache');
const ult = r.body.tools[r.body.tools.length-1];
att('marcatore sull\'ultimo strumento', 'ephemeral', ult.cache_control.type);
att('uno solo marcato', 1, r.body.tools.filter(t=>t.cache_control).length);

console.log('\n3) Fuori da Nucleo: ricerca web + lettura pagine, NIENTE sandbox');
const tipi = r.body.tools.map(t=>t.type).filter(Boolean);
att('c\'e\' web_search', true, tipi.indexOf('web_search_20260209')>=0);
att('c\'e\' web_fetch', true, tipi.indexOf('web_fetch_20260209')>=0);
att('NIENTE code_execution', false, tipi.some(t=>/code_execution/.test(t)));

console.log('\n4) In Modalità Nucleo: sandbox Python, NIENTE ricerca web');
store['bsi_nucleo']='1';
r = A.buildRequest(P.claude,'k',msgs,sysDue,SCHEMA);
const tipi2 = r.body.tools.map(t=>t.type).filter(Boolean);
att('c\'e\' code_execution', 'code_execution_20260521', tipi2.find(t=>/code_execution/.test(t)));
att('NIENTE web_search', false, tipi2.indexOf('web_search_20260209')>=0);
att('NIENTE web_fetch', false, tipi2.indexOf('web_fetch_20260209')>=0);
att('mai due ambienti insieme', true,
    !(tipi2.some(t=>/code_execution/.test(t)) && tipi2.some(t=>/web_/.test(t))));
att('effort al massimo', 'xhigh', r.body.output_config.effort);

console.log('\n5) Un modello senza effort ne\' strumenti server resta gestito');
// Haiku 4.5 e' stato tolto (dominato da Sonnet 5), ma la guardia deve
// restare: il prossimo modello senza quei campi non deve riceverli.
const SEMPLICE = Object.assign({}, P.claude, { effort: undefined, webSearch: false, thinking: undefined });
const rh = A.buildRequest(SEMPLICE,'k',msgs,sysDue,SCHEMA);
att('nessun output_config', undefined, rh.body.output_config);
att('nessun thinking', undefined, rh.body.thinking);
const th = rh.body.tools.map(t=>t.type).filter(Boolean);
att('nessuno strumento lato server', 0, th.length);
att('ma la cache c\'e\' lo stesso', 'ephemeral', rh.body.system[0].cache_control.type);

console.log('\n6) Fable 5.1 tiene i fallback sui rifiuti');
const rf = A.buildRequest(P.claude_fable,'k',msgs,sysDue,SCHEMA);
att('intestazione beta', 'server-side-fallback-2026-07-01', rf.headers['anthropic-beta']);
att('campo nel corpo', 'default', rf.body.fallbacks);
att('nessun budget_tokens (400 sui recenti)', undefined, rf.body.thinking.budget_tokens);
att('nessuna temperature (400 sui recenti)', undefined, rf.body.temperature);

console.log('\n7) Le altre famiglie ricevono una stringa sola');
store={};
const rg = A.buildRequest(P.gemini,'k',msgs,sysDue,SCHEMA);
att('gemini: stringa unita', true,
    /PARTE STABILE/.test(rg.body.systemInstruction.parts[0].text) &&
    /parte volatile/.test(rg.body.systemInstruction.parts[0].text));
const ro = A.buildRequest(P.groq,'k',msgs,sysDue,SCHEMA);
att('groq: stringa unita', true, /parte volatile/.test(ro.body.messages[0].content));

console.log('\n8) Un prompt passato come semplice stringa continua a funzionare');
const rs = A.buildRequest(P.claude,'k',msgs,'tutto in una stringa',SCHEMA);
att('un blocco solo', 1, rs.body.system.length);
att('in cache lo stesso', 'ephemeral', rs.body.system[0].cache_control.type);

console.log('\n' + (ko?'✗ '+ko+' FALLITI, ':'') + ok + ' passati');
process.exit(ko?1:0);
