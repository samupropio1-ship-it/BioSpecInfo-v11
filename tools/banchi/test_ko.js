/* Memoria dei fornitori irraggiungibili: deve imparare dal campo, non
   cancellare nessuno per sempre, e riprovare dopo 24 ore. */
const fs = require('fs');
let src = fs.readFileSync('/home/user/BioSpecInfo-v11/bsi-ai-hub.js','utf8');
// providerUtilizzabili non e' esposto di proposito: lo prendo iniettando,
// come fa test_carico.js, invece di allargare la superficie pubblica.
src = src.replace('window.bsiDati = ',
  'window.__t = { providerUtilizzabili:providerUtilizzabili, PROVIDERS:PROVIDERS };\nwindow.bsiDati = ');
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

const KO = global.bsiIrraggiungibili;
const PROV = global.bsiProviders || null;
let ok=0,ko=0;
const att=(d,a,v)=>{ if(String(a)===String(v)){ok++;console.log('  ✓ '+d+'  → '+v);} else {ko++;console.log('  ✗ '+d+'\n      atteso: '+a+'\n      avuto:  '+v);} };

console.log('\n1) Annotazione e conteggio');
store = {};
att('all\'inizio nessuno e\' marcato', false, KO.recente('zai'));
att('volte = 0', 0, KO.volte('zai'));
KO.segna('zai');
att('dopo un fallimento e\' marcato', true, KO.recente('zai'));
att('volte = 1', 1, KO.volte('zai'));
KO.segna('zai'); KO.segna('zai');
att('volte = 3 dopo tre fallimenti', 3, KO.volte('zai'));
att('un altro fornitore resta pulito', false, KO.recente('groq'));

console.log('\n2) Una risposta qualsiasi cancella l\'annotazione');
KO.ok('zai');
att('non piu\' marcato', false, KO.recente('zai'));
att('volte azzerate', 0, KO.volte('zai'));
att('la chiave sparisce da localStorage quando e\' vuota', undefined, store.bsi_prov_ko);
KO.ok('groq');   // non deve esplodere su uno mai annotato
att('cancellare un fornitore mai annotato non crea nulla', undefined, store.bsi_prov_ko);

console.log('\n3) Dopo 24 ore si ritenta, e il conteggio riparte');
store = {};
KO.segna('zai'); KO.segna('zai');
att('volte = 2', 2, KO.volte('zai'));
// invecchio l'annotazione di 25 ore
let m = JSON.parse(store.bsi_prov_ko);
m.zai.t = Date.now() - 25*60*60*1000;
store.bsi_prov_ko = JSON.stringify(m);
att('scaduta: non piu\' marcato', false, KO.recente('zai'));
att('scaduta: volte = 0', 0, KO.volte('zai'));
KO.segna('zai');
att('il conteggio riparte da 1, non da 3', 1, KO.volte('zai'));

console.log('\n4) Dato corrotto in localStorage non blocca nulla');
store.bsi_prov_ko = 'non-json{{{';
att('recente() sopravvive', false, KO.recente('zai'));
att('volte() sopravvive', 0, KO.volte('zai'));
store.bsi_prov_ko = '"una stringa"';
att('JSON valido ma non oggetto', false, KO.recente('zai'));
store.bsi_prov_ko = '{"zai":"vecchio-formato"}';
att('voce senza timestamp', false, KO.recente('zai'));
KO.segna('zai');
att('e viene riscritta bene', 1, KO.volte('zai'));
store = {};
KO.segna('fornitore-inesistente');
att('un id sconosciuto non viene annotato', undefined, store.bsi_prov_ko);

console.log('\n5) L\'ordine di riserva mette i marcati in fondo');
// due chiavi gratuite salvate: groq e gemini
store = { bsi_api_keys: JSON.stringify({ groq:'gsk_x', gemini:'AIza_x' }) };
let lista = global.__t.providerUtilizzabili('groq');
att('senza annotazioni il preferito e\' primo', 'groq', lista[0]);
att('gemini c\'e\'', true, lista.indexOf('gemini') >= 0);
KO.segna('groq');
lista = global.__t.providerUtilizzabili('groq');
att('groq marcato scende in fondo', 'gemini', lista[0]);
att('ma NON sparisce', true, lista.indexOf('groq') >= 0);
att('lunghezza invariata', 2, lista.length);
KO.segna('gemini');
lista = global.__t.providerUtilizzabili('groq');
att('se tutti sono marcati si prova lo stesso il preferito', 'groq', lista[0]);
att('e restano tutti e due', 2, lista.length);

console.log('\n6) Modalita\' Nucleo non sceglie un fornitore che non risponde');
store = { bsi_api_keys: JSON.stringify({ groq:'gsk_x', gemini:'AIza_x' }) };
let migliore = global.bsiNucleo.migliore();
const primoScelto = migliore;
console.log('    (il piu\' capace fra groq e gemini e\': ' + primoScelto + ')');
KO.segna(primoScelto);
let dopo = global.bsiNucleo.migliore();
att('cambia scelta', true, dopo !== primoScelto);
att('e ne sceglie uno valido', true, dopo === 'groq' || dopo === 'gemini');
KO.segna(dopo);
att('con entrambi marcati sceglie comunque qualcuno', true, !!global.bsiNucleo.migliore());
store = {};
att('senza nessuna chiave restituisce null', null, global.bsiNucleo.migliore());

console.log('\n7) Il reset "ricomincia da capo" azzera anche questa memoria');
store = { bsi_prov_ko: '{"zai":{"t":' + Date.now() + ',"n":3}}',
          bsi_api_keys: '{"groq":"x"}', bsi_pro_license: 'LICENZA' };
att('il gruppo chiavi la include', true,
    global.bsiDati.gruppi.chiavi.chiavi.indexOf('bsi_prov_ko') >= 0);
global.bsiDati.cancella(['chiavi']);
att('dopo il reset e\' sparita', undefined, store.bsi_prov_ko);
att('la licenza non e\' stata toccata', 'LICENZA', store.bsi_pro_license);

console.log('\n8) Cancellare le chat NON cancella cio\' che si e\' imparato');
store = { bsi_prov_ko: '{"zai":{"t":' + Date.now() + ',"n":3}}', bsi_ai_threads: '[]' };
global.bsiDati.cancella(['chat']);
att('la memoria dei ko resta', true, store.bsi_prov_ko !== undefined);

console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '✓ tutti passati — ') + ok + ' controlli');
process.exit(ko ? 1 : 0);
