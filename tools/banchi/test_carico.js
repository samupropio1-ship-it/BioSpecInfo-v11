/* Budget della richiesta, ritentativo sui 429 e riserva fra fornitori:
   le tre cose che fanno reggere un carico vero alle chiavi gratuite. */
const fs=require('fs');
let src=fs.readFileSync('/home/user/BioSpecInfo-v11/bsi-ai-hub.js','utf8');
src = src.replace('window.bsiDati = ',
  'window.__t = { stimaToken:stimaToken, selezionaStrumenti:selezionaStrumenti,'+
  ' tagliaCronologia:tagliaCronologia, adattaAlBudget:adattaAlBudget, attesaDaRisposta:attesaDaRisposta,'+
  ' providerUtilizzabili:providerUtilizzabili, rilevanzaStrumento:rilevanzaStrumento,'+
  ' get TENTATIVI_TEMPORANEO(){return TENTATIVI_TEMPORANEO},'+
  ' PAROLE_STRUMENTO:PAROLE_STRUMENTO, get TOOLS(){return TOOLS}, get BASE_SYSTEM(){return BASE_SYSTEM} };\nwindow.bsiDati = ');
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

const T=global.__t, P=global.BSI_AI_PROVIDERS;
// Nessun fornitore attuale ha un tetto stretto in ingresso: si prova il
// codice del budget con una configurazione sintetica, invece di attribuire a
// un servizio vero un limite che non ha.
const STRETTO = Object.assign({}, P.groq, { id:'stretto', maxInput:8000 });
let ok=0,ko=0;
const att=(d,a,v)=>{ if(String(a)===String(v)){ok++;console.log('  ✓ '+d+'  → '+v);} else {ko++;console.log('  ✗ '+d+'\n      atteso: '+a+'\n      avuto:  '+v);} };
const SCHEMA = T.TOOLS.map(t=>({name:t.name,description:t.description,parameters:t.parameters}));

console.log('\n1) Il problema che risolviamo');
const costoTools = T.stimaToken(SCHEMA), costoSys = T.stimaToken(T.BASE_SYSTEM);
console.log('   32 strumenti: '+costoTools+' token · prompt di sistema: '+costoSys+' token');
att('senza budget si sfora un tetto da 8000', true, costoTools+costoSys > 8000);

console.log('\n2) Col budget la richiesta ci sta');
const msgs=[{role:'user',content:'Calcola il pH di una soluzione di acido acetico 0,1 M'}];
const ad = T.adattaAlBudget(STRETTO, msgs, T.BASE_SYSTEM, SCHEMA);
const totale = costoSys + T.stimaToken(ad.tools) + T.stimaToken(ad.messages);
console.log('   strumenti scelti: '+ad.tools.length+'/'+SCHEMA.length+' ('+T.stimaToken(ad.tools)+' token) · totale '+totale);
att('sta sotto 8000', true, totale < 8000);
att('ha segnalato il taglio', true, ad.tagliato);
att('restano abbastanza strumenti da lavorare', true, ad.tools.length >= 8);

console.log('\n3) Gli strumenti scelti sono quelli PERTINENTI');
const nomi = ad.tools.map(t=>t.name);
att('tiene equilibrio_acido_base', true, nomi.indexOf('equilibrio_acido_base')>=0);
att('tiene calcola (sempre)', true, nomi.indexOf('calcola')>=0);
att('tiene naviga_sezione (sempre)', true, nomi.indexOf('naviga_sezione')>=0);
const astro = T.adattaAlBudget(STRETTO,
  [{role:'user',content:'Qual è la temperatura di una nebulosa e la riga H-alfa?'}], T.BASE_SYSTEM, SCHEMA);
att('domanda astro → tiene astrofisica', true, astro.tools.map(t=>t.name).indexOf('astrofisica')>=0);
att('domanda astro → scarta farmacocinetica', false, astro.tools.map(t=>t.name).indexOf('farmacocinetica')>=0);

console.log('\n4) I provider senza tetto non vengono toccati');
const largo = T.adattaAlBudget(P.groq, msgs, T.BASE_SYSTEM, SCHEMA);
att('tutti e 32 gli strumenti', SCHEMA.length, largo.tools.length);
att('nessun taglio', false, largo.tagliato);

console.log('\n5) La cronologia si taglia dal fondo, mai l\'ultimo messaggio');
const lunga=[]; for(let i=0;i<60;i++) lunga.push({role:i%2?'assistant':'user',content:'messaggio numero '+i+' '+'x'.repeat(400)});
const tagliata = T.tagliaCronologia(lunga, 2000);
att('accorciata', true, tagliata.length < lunga.length);
att('entra nel budget', true, T.stimaToken(tagliata) <= 2000 || tagliata.length===1);
att('ultimo messaggio conservato', 'messaggio numero 59', tagliata[tagliata.length-1].content.slice(0,19));

console.log('\n6) Non si spezza mai una coppia chiamata/risultato');
const conTool=[
  {role:'user',content:'x'.repeat(3000)},
  {role:'assistant',content:'chiamo uno strumento',_native:{openai:{role:'assistant',tool_calls:[{id:'c1'}]}}},
  {role:'tool',content:'{"ok":true}',_native:{openai:{role:'tool',tool_call_id:'c1'}}},
  {role:'user',content:'e adesso?'}
];
const t6 = T.tagliaCronologia(conTool, 200);
att('nessun risultato orfano in testa', false, t6[0].role==='tool');
att('ultimo messaggio conservato', 'e adesso?', t6[t6.length-1].content);

console.log('\n7) Attesa dopo un 429');
const hdr = v => ({ headers:{ get:n=> n==='Retry-After'?v:null } });
att('Retry-After in secondi', 7000, T.attesaDaRisposta(hdr('7'),'',0));
att('Retry-After assente → esponenziale', true, T.attesaDaRisposta(hdr(null),'',0) >= 1500);
att('cresce col tentativo', true, T.attesaDaRisposta(hdr(null),'',2) > T.attesaDaRisposta(hdr(null),'',0));
att('testo Groq "try again in 7.5s"', 7500, T.attesaDaRisposta(hdr(null),'Please try again in 7.5s',0));
att('attesa assurda → non aspetta', null, T.attesaDaRisposta(hdr('3600'),'',0));
att('mai sotto mezzo secondo', true, T.attesaDaRisposta(hdr('0.01'),'',0) >= 500);

console.log('\n8) Elenco dei fornitori di riserva');
// zai NON ha chiave qui, di proposito: serve a provare che un GRATUITO
// senza chiave resta fuori (prima il ruolo lo faceva nvidia, ora rimossa).
store={}; store['bsi_api_keys']=JSON.stringify({groq:'g',gemini:'x',claude:'sk-ant'});
const lista = T.providerUtilizzabili('groq');
att('il preferito e\' il primo', 'groq', lista[0]);
att('include gli altri gratuiti con chiave', true, lista.indexOf('gemini')>=0);
att('NON include Claude (a pagamento)', false, lista.indexOf('claude')>=0);
att('NON include un gratuito senza chiave', false, lista.indexOf('zai')>=0);

console.log('\n9) Anche partendo da un provider a pagamento la riserva e\' gratuita');
const daPagamento = T.providerUtilizzabili('claude');
att('Claude resta primo', 'claude', daPagamento[0]);
att('riserve tutte gratuite', true, daPagamento.slice(1).every(id=>P[id].free));

console.log('\n10) Senza nessuna chiave, nessuna riserva');
store={};
att('solo il preferito', 1, T.providerUtilizzabili('groq').length);

// ── prove d'insieme: il comportamento vero, non solo i pezzi ──────────
(async () => {
console.log('\n10b) Provider salvato che non esiste piu\': non deve rompere');
// e' il guasto che si introduce togliendo un servizio dall'elenco: chi lo
// aveva selezionato si ritroverebbe PROVIDERS[undefined] e Spectra non si
// aprirebbe piu'.
store={}; store['bsi_ai_provider']='mistral';   // servizio rimosso
let scelto=null;
try{ scelto = global.bsiProviderSalvato(); }catch(e){ scelto = 'ECCEZIONE: '+e.message; }
att('ripiega su un provider esistente', true, !!(scelto && P[scelto]));
att('non lancia eccezioni', false, /ECCEZIONE/.test(String(scelto)));
store['bsi_ai_provider']='gemini';
att('un provider valido resta rispettato', 'gemini', global.bsiProviderSalvato());
store={};
att('senza niente salvato usa il predefinito', 'groq', global.bsiProviderSalvato());

console.log('\n11) 429 con Retry-After: aspetta e riprova, non fallisce');
store={}; store['bsi_api_keys']=JSON.stringify({groq:'g'});
let tent=0;
global.fetch = async (u,o) => {
  u=String(u);
  if(/\/models$/.test(u)) return { ok:true, json:async()=>({data:[{id:'openai/gpt-oss-120b'}]}) };
  tent++;
  if(tent===1) return { ok:false, status:429, headers:{get:n=>n==='Retry-After'?'0.5':null},
                        text:async()=>'{"error":{"message":"rate limit"}}' };
  return { ok:false, status:400, headers:{get:()=>null}, text:async()=>'{"error":{"message":"passato oltre"}}' };
};
let atteso=null, e11='';
try{ await global.bsiStreamChat('groq','g',[{role:'user',content:'ciao'}],'sys',
  {onToken(){},onDone(){},onAttesa:(ms,n)=>{atteso={ms:ms,n:n};}}); }catch(e){ e11=e.message; }
att('due tentativi di generazione', 2, tent);
att('ha avvisato dell\'attesa', 500, atteso && atteso.ms);
att('errore finale quello vero', true, /passato oltre/.test(e11));

console.log('\n12) 429 ostinato: si arrende dopo 3 tentativi, non all\'infinito');
tent=0;
global.fetch = async (u,o) => {
  u=String(u);
  if(/\/models$/.test(u)) return { ok:true, json:async()=>({data:[{id:'openai/gpt-oss-120b'}]}) };
  tent++;
  return { ok:false, status:429, headers:{get:n=>n==='Retry-After'?'0.5':null},
           text:async()=>'{"error":{"message":"rate limit"}}' };
};
let e12=null;
try{ await global.bsiStreamChat('groq','g',[{role:'user',content:'ciao'}],'sys',{onToken(){},onDone(){}}); }
catch(e){ e12=e; }
// legato alla costante invece che al numero: cosi' cambiare il budget dei
// ritentativi non fa fallire un test che verifica tutt'altro (che TERMINI).
att('si ferma a 1 + TENTATIVI_TEMPORANEO chiamate', T.TENTATIVI_TEMPORANEO + 1, tent);
att('marcato come esaurito', true, !!(e12 && e12.esaurito));

console.log('\n13) Riserva: Groq esaurito → il turno continua su Gemini');
store['bsi_api_keys']=JSON.stringify({groq:'g',gemini:'x'});
let usati=[];
global.fetch = async (u,o) => {
  u=String(u);
  if(/\/models$/.test(u)) return { ok:true, json:async()=>({data:[{id:'openai/gpt-oss-120b'}]}) };
  if(/generativelanguage.*\/models\?/.test(u))
    return { ok:true, json:async()=>({models:[{name:'models/gemini-2.5-flash',
      supportedGenerationMethods:['generateContent','streamGenerateContent']}]}) };
  if(u.indexOf('groq')>=0){ usati.push('groq');
    return { ok:false, status:429, headers:{get:n=>n==='Retry-After'?'0.5':null},
             text:async()=>'{"error":{"message":"quota"}}' }; }
  if(u.indexOf('generativelanguage')>=0){ usati.push('gemini');
    return { ok:true, headers:{get:()=>null}, body:null,
             text:async()=>JSON.stringify({candidates:[{content:{parts:[{text:'Risposta da Gemini'}]}}]}) }; }
  return { ok:false, status:500, headers:{get:()=>null}, text:async()=>'{}' };
};
let riserva=null, risposta='';
try{
  const r = await global.bsiRunAgentTurn('groq','g',[{role:'user',content:'ciao'}],'sys',
    {onToken(){},onDone(t){risposta=t;},onToolUse(){},onRiserva:(a,b)=>{riserva={da:a,a:b};}});
  risposta = r.text || risposta;
}catch(e){ risposta='ERRORE: '+e.message; }
att('ha provato Groq per primo', 'groq', usati[0]);
att('e\' passato a Gemini', true, usati.indexOf('gemini')>=0);
att('ha avvisato del passaggio', true, !!(riserva && /Gemini/.test(riserva.a)));
att('la risposta arriva', 'Risposta da Gemini', risposta);

console.log('\n13b) Fornitore IRRAGGIUNGIBILE: il turno continua altrove');
// e' il caso vero: GitHub Models ritirato il 30/07/2026 — ogni richiesta
// falliva prima di ricevere una risposta, e Spectra si fermava li'.
store['bsi_api_keys']=JSON.stringify({groq:'g',gemini:'x'});
let visti13=[], riserva13=null, risp13='';
global.fetch = async (u,o) => {
  u=String(u);
  if(/\/models$/.test(u)) return { ok:true, json:async()=>({data:[{id:'openai/gpt-oss-120b'}]}) };
  if(/generativelanguage.*\/models\?/.test(u))
    return { ok:true, json:async()=>({models:[{name:'models/gemini-2.5-flash',
      supportedGenerationMethods:['generateContent','streamGenerateContent']}]}) };
  if(u.indexOf('groq')>=0){ visti13.push('groq'); throw new TypeError('Failed to fetch'); }
  if(u.indexOf('generativelanguage')>=0){ visti13.push('gemini');
    return { ok:true, headers:{get:()=>null}, body:null,
             text:async()=>JSON.stringify({candidates:[{content:{parts:[{text:'Risposta da Gemini'}]}}]}) }; }
  return { ok:false, status:500, headers:{get:()=>null}, text:async()=>'{}' };
};
try{
  const r = await global.bsiRunAgentTurn('groq','g',[{role:'user',content:'ciao'}],'sys',
    {onToken(){},onDone(t){risp13=t;},onToolUse(){},onRiserva:(a,b,m)=>{riserva13={da:a,a:b,motivo:m};}});
  risp13 = r.text || risp13;
}catch(e){ risp13='ERRORE: '+e.message; }
att('ha provato Groq', 'groq', visti13[0]);
att('e\' passato a Gemini', true, visti13.indexOf('gemini')>=0);
att('motivo: irraggiungibile', 'irraggiungibile', riserva13 && riserva13.motivo);
att('la risposta arriva lo stesso', 'Risposta da Gemini', risp13);

console.log('\n13c) Se NESSUNO risponde, lo dice chiaramente');
global.fetch = async (u) => {
  u=String(u);
  if(/\/models$/.test(u)||/\/models\?/.test(u)) return { ok:true, json:async()=>({data:[],models:[]}) };
  throw new TypeError('Failed to fetch');
};
let e13c='';
try{ await global.bsiRunAgentTurn('groq','g',[{role:'user',content:'ciao'}],'sys',
  {onToken(){},onDone(){},onToolUse(){}}); }catch(e){ e13c=e.message; }
att('spiega che puo\' essere CORS', true, /chiamate dirette dal browser/.test(e13c));

console.log('\n14) Un errore NON di quota non fa girare tutti i fornitori');
usati=[];
global.fetch = async (u,o) => {
  u=String(u);
  if(/\/models$/.test(u)) return { ok:true, json:async()=>({data:[{id:'x'}]}) };
  if(/generativelanguage.*\/models\?/.test(u)) return { ok:true, json:async()=>({models:[]}) };
  if(u.indexOf('groq')>=0){ usati.push('groq');
    return { ok:false, status:401, headers:{get:()=>null},
             text:async()=>'{"error":{"message":"Invalid API Key"}}' }; }
  usati.push('altro');
  return { ok:false, status:500, headers:{get:()=>null}, text:async()=>'{}' };
};
let e14='';
try{ await global.bsiRunAgentTurn('groq','g',[{role:'user',content:'ciao'}],'sys',
  {onToken(){},onDone(){},onToolUse(){}}); }catch(e){ e14=e.message; }
att('solo Groq provato', 'groq', usati.join(','));
att('errore riportato subito', true, /Invalid API Key/.test(e14));

console.log('\n' + (ko?'✗ '+ko+' FALLITI, ':'') + ok + ' passati');
process.exit(ko?1:0);
})();
