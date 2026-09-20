(async()=>{
/* "R" restituiva Avogadro perche' la ricerca era per sottostringa e
   "avogadro" contiene una "r". Un numero sbagliato dato con sicurezza. */
const fs=require('fs');
let src=fs.readFileSync('/home/user/BioSpecInfo-v11/bsi-ai-hub.js','utf8')
  .replace('window.bsiDati = ','window.__t={TOOLS:TOOLS,PHYS_CONST:PHYS_CONST};\nwindow.bsiDati = ');
let store={};
global.localStorage={getItem:()=>null,setItem(){},removeItem(){},length:0,key:()=>null};
function el(){return{style:{},classList:{add(){},remove(){},contains(){return false}},appendChild(){},addEventListener(){},setAttribute(){},removeAttribute(){},querySelector(){return null},querySelectorAll(){return[]},remove(){},insertAdjacentHTML(){},focus(){},scrollIntoView(){},textContent:'',innerHTML:'',dataset:{},children:[]};}
global.document={createElement:el,createElementNS:el,getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},body:el(),head:el(),documentElement:el(),readyState:'complete'};
global.window=global; global.location={href:'https://t/',hostname:'t',search:'',pathname:'/'};
global.navigator={userAgent:'node'}; global.AbortController=class{constructor(){this.signal={}}abort(){}};
global.TextDecoder=class{decode(){return''}}; global.CustomEvent=class{}; global.requestAnimationFrame=f=>0;
global.matchMedia=()=>({matches:false,addListener(){},addEventListener(){}}); global.fetch=async()=>{throw 0};
eval(src);
const cf = global.__t.TOOLS.find(t=>t.name==='costante_fisica');
let ok=0,ko=0;
const att=(d,a,v)=>{ if(String(a)===String(v)){ok++;console.log('  ✓ '+d+'  → '+v);} else {ko++;console.log('  ✗ '+d+'\n      atteso: '+a+'\n      avuto:  '+v);} };
const chiedi = async q => await cf.execute({ nome:q });

console.log('\n1) I simboli danno la costante GIUSTA');
for(const [sim,atteso] of [['R','costante dei gas'],['k','costante di boltzmann'],
  ['h','costante di planck'],['c','velocita della luce'],['e','carica elementare'],
  ['F','costante di faraday'],['NA','costante di avogadro'],['N_A','costante di avogadro'],
  ['me','massa elettrone'],['mp','massa protone'],['kB','costante di boltzmann']]){
  const r = await chiedi(sim);
  att('"'+sim+'"', atteso, r && r.costante);
}

console.log('\n2) I valori sono quelli CODATA');
for(const [q,val] of [['R','8.314462618'],['k','1.380649e-23'],['e','1.602176634e-19'],
  ['NA','6.02214076e23'],['c','299792458']]){
  const r = await chiedi(q);
  att('valore di '+q, val, r && r.valore);
}

console.log('\n3) Il nome per esteso continua a funzionare');
for(const q of ['costante dei gas','costante di Avogadro','carica elementare',
  'velocita della luce','massa elettrone','zero assoluto','volume molare gas']){
  const r = await chiedi(q);
  att('"'+q+'"', true, !!(r && r.ok));
}
const ap = await chiedi("massa dell'elettrone");
att('con apostrofo e articolo', 'massa elettrone', ap && ap.costante);

console.log('\n4) In caso di dubbio RIFIUTA invece di indovinare');
for(const q of ['x','z','q','ab']){
  const r = await chiedi(q);
  att('"'+q+'" non inventa una risposta', false, !!(r && r.ok));
}
const amb = await chiedi('costante');
att('"costante" è ambiguo → non sceglie a caso', false, !!(amb && amb.ok));
att('e lo dice', true, /ambiguo|non trovata|troppo corto/.test((amb&&amb.error)||''));

console.log('\n5) Il caso che ha originato tutto');
const r1 = await chiedi('R');
att('R NON è più Avogadro', false, /avogadro/.test((r1&&r1.costante)||''));
att('R è la costante dei gas', 'costante dei gas', r1 && r1.costante);
const r2 = await chiedi('k');
att('k NON è più Planck', false, /planck/.test((r2&&r2.costante)||''));

console.log('\n6) Ogni costante in tabella è raggiungibile col suo nome');
Object.keys(global.__t.PHYS_CONST).forEach(async k=>{});
for(const k of Object.keys(global.__t.PHYS_CONST)){
  const r = await chiedi(k);
  att(k, k, r && r.costante);
}

console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '✓ tutti passati — ') + ok + ' controlli');
process.exit(ko?1:0);
})();
