/* Audit dei DATI: costanti fisiche, masse atomiche, e i risolutori
   confrontati con valori di riferimento da letteratura. Un numero sbagliato
   che sembra giusto e' il guasto peggiore in un'app che si usa per studiare. */
const fs=require('fs');
let src=fs.readFileSync('/home/user/BioSpecInfo-v11/bsi-ai-hub.js','utf8');
src = src.replace('window.bsiDati = ',
  'window.__t = { TOOLS:TOOLS, MOLECOLE_ESAME:MOLECOLE_ESAME };\nwindow.bsiDati = ');
let store={};
global.localStorage={getItem:k=>(k in store?store[k]:null),setItem:(k,v)=>{store[k]=String(v);},removeItem:k=>{delete store[k];},get length(){return Object.keys(store).length;},key:i=>Object.keys(store)[i]};
function el(){return{style:{},classList:{add(){},remove(){},contains(){return false}},appendChild(){},addEventListener(){},setAttribute(){},removeAttribute(){},querySelector(){return null},querySelectorAll(){return[]},remove(){},insertAdjacentHTML(){},focus(){},scrollIntoView(){},textContent:'',innerHTML:'',dataset:{},children:[]};}
global.document={createElement:el,createElementNS:el,getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},body:el(),head:el(),documentElement:el(),readyState:'complete'};
global.window=global; global.location={href:'https://t/',hostname:'t',search:'',pathname:'/'};
global.navigator={userAgent:'node',language:'it-IT'};
global.AbortController=class{constructor(){this.signal={aborted:false,addEventListener(){}}}abort(){}};
global.TextDecoder=class{decode(){return''}}; global.CustomEvent=class{};
global.requestAnimationFrame=f=>setTimeout(f,0); global.matchMedia=()=>({matches:false,addListener(){},addEventListener(){}});
global.fetch=async()=>{throw new Error('rete non usata in questo audit')};
try{ eval(src); }catch(e){ console.error('CARICAMENTO FALLITO:', e.message); process.exit(1); }
const T=global.__t, tool=n=>T.TOOLS.find(x=>x.name===n);
let ok=0,ko=0;
const vicino=(d,atteso,avuto,tol)=>{
  const v=Number(avuto), diff=Math.abs(v-atteso);
  if(isFinite(v)&&diff<=tol){ok++;console.log('  ✓ '+d+'  → '+v);}
  else{ko++;console.log('  ✗ '+d+'\n      atteso ~'+atteso+' (±'+tol+')\n      avuto  '+avuto);}
};
const uguale=(d,a,v)=>{ if(String(a)===String(v)){ok++;console.log('  ✓ '+d+'  → '+v);} else {ko++;console.log('  ✗ '+d+'\n      atteso: '+a+'\n      avuto:  '+v);} };
(async()=>{

console.log('\n1) Costanti fisiche (CODATA) — coi nomi che lo schema dichiara');
const cf = tool('costante_fisica');
for(const [nome,atteso,tol] of [
  ['velocita della luce',299792458,1],
  ['costante di Planck',6.62607015e-34,1e-42],
  ['costante di Avogadro',6.02214076e23,1e15],
  ['costante dei gas',8.314462618,1e-6],
  ['costante di Boltzmann',1.380649e-23,1e-31],
  ['carica elementare',1.602176634e-19,1e-28],
  ['costante di Faraday',96485.33212,1e-3],
  ['massa dell elettrone',9.1093837015e-31,1e-40]]){
  const r = await cf.execute({ nome });
  if(r && r.ok !== false && r.valore !== undefined) vicino(nome, atteso, r.valore, tol);
  else { ko++; console.log('  ✗ ' + nome + ': ' + JSON.stringify(r).slice(0,80)); }
}

console.log('\n1b) Un nome AMBIGUO non deve dare un numero sbagliato con sicurezza');
for(const q of ['R','k','e','pippo']){
  const r = await cf.execute({ nome:q });
  const esito = (!r || r.ok===false) ? 'rifiuta' : (r.costante || r.nome || '?');
  console.log('   "'+q+'" → '+esito+(r&&r.valore!==undefined?('  ('+r.valore+')'):''));
}

console.log('\n2) Masse molecolari (confronto con IUPAC)');
const mm = tool('massa_molecolare');
for(const [f,atteso] of [['H2O',18.015],['CO2',44.009],['C6H12O6',180.156],
  ['NaCl',58.44],['H2SO4',98.079],['C9H8O4',180.159],['Ca3(PO4)2',310.17],
  ['K4[Fe(CN)6]',368.35],['C8H10N4O2',194.19]]){
  const r = await mm.execute({ formula:f });
  vicino('MM '+f, atteso, r && r.massa_molecolare, 0.1);
}

console.log('\n3) Risolutori contro valori di letteratura');
const ab = await tool('equilibrio_acido_base').execute({ tipo:'acido_debole', Ka:1.8e-5, concentrazione:0.1 });
vicino('pH acido acetico 0,1 M (2,875)', 2.875, ab && ab.pH, 0.01);
// Arrhenius a due temperature: k=1e-3 a 300 K, k=1e-2 a 320 K → Ea ~ 92 kJ/mol
const ci = await tool('cinetica').execute({ k:1e-3, T:300, k2:1e-2, T2:320 });
vicino('Ea da due costanti (92 kJ/mol)', 92, ci && ci.Ea_kJ_mol, 3);
// transizione n=3 → n=2 dell'idrogeno: riga H-alfa, 656,3 nm
const qs = await tool('quantistica_e_spettroscopia').execute({ calcolo:'idrogeno', n:3, n2:2 });
vicino('riga H-alfa (656,3 nm)', 656.3, qs && (qs.lambda_nm||qs.lambda_nm_emissione), 1);
// ferro-56: Z=26, N=30, massa atomica 55,934937 u → 8,79 MeV/nucleone
const nu = await tool('nucleare').execute({ calcolo:'energia_legame', Z:26, Nn:30, massa_atomica:55.934937 });
vicino('⁵⁶Fe energia per nucleone (8,79 MeV)', 8.79, nu && (nu.energia_per_nucleone_MeV||nu.B_per_nucleone_MeV||nu.per_nucleone_MeV), 0.05);
// t di Student su due campioni noti
const st = await tool('statistica_inferenziale').execute({ test:'t_indipendenti', gruppo1:[5,6,7,8,9], gruppo2:[10,11,12,13,14] });
vicino('t fra due campioni distanti 5 (|t| = 5)', 5, st && Math.abs(st.t||st.t_calcolato||0), 0.6);
// Beer-Lambert: A = eps * c * l
const bl = await tool('quantistica_e_spettroscopia').execute({ calcolo:'beer_lambert', epsilon:15000, concentrazione:2e-5, cammino_cm:1 });
vicino('Beer-Lambert A = 15000·2e-5·1 = 0,30', 0.30, bl && (bl.assorbanza||bl.A), 0.005);
// decadimento: dopo 2 emivite resta 1/4
const dec = await tool('nucleare').execute({ calcolo:'decadimento', t_mezza:10, N0:100, tempo:20 });
const resto = dec && (dec.N||dec.N_residua||dec.rimasto||dec.N_finale||dec.quantita_residua||
                      dec.attivita_residua||dec.N_t||dec.N_residuo);
vicino('dopo 2 emivite resta il 25%', 25, resto, 0.2);

console.log('\n4) I risolutori sanno dire "non lo so"');
for(const [nome,args,perche] of [
  ['bilancia_equazione',{equazione:'H2 + O2 -> Au'},'non bilanciabile'],
  ['massa_molecolare',{formula:'C6H12O6)'},'parentesi sbilanciate'],
  ['calcola',{espressione:'window.localStorage'},'iniezione'],
  ['calcola',{espressione:'1/0'},'divisione per zero'],
  ['quantistica_e_spettroscopia',{tipo:'planck',lambda_nm:0},'lunghezza d\'onda zero'] ]){
  const t=tool(nome); if(!t){ console.log('  · '+nome+' assente'); continue; }
  let r; try{ r = await t.execute(args); }catch(e){ r={ok:false,error:e.message}; }
  const fallisce = !r || r.ok === false;
  uguale(nome+' ('+perche+') → rifiuta', true, fallisce);
}

console.log('\n5) Coerenza della banca dati molecole');
const M=T.MOLECOLE_ESAME;
console.log('   molecole tabulate: '+Object.keys(M).length);
Object.keys(M).forEach(function(k){
  const m=M[k], manca=[];
  ['smiles','formula','mw','gruppi','ir','nmr_h','ms'].forEach(c=>{ if(!m[c]||(Array.isArray(m[c])&&!m[c].length)) manca.push(c); });
  if(manca.length){ko++;console.log('  ✗ '+k+': campi vuoti → '+manca.join(', '));}
});
// la massa dichiarata deve tornare con la formula
for(const k of Object.keys(M)){
  const r = await mm.execute({ formula: M[k].formula });
  const calc = r && r.massa_molecolare;
  if(calc && Math.abs(calc - M[k].mw) > 0.35){
    ko++; console.log('  ✗ '+k+': mw dichiarata '+M[k].mw+' ma '+M[k].formula+' fa '+calc);
  }
}
if(!ko) console.log('  ✓ tutte le voci complete e con massa coerente con la formula');

console.log('\n' + (ko ? '✗ ' + ko + ' PROBLEMI, ' : '✓ ') + ok + ' controlli superati');
process.exit(ko?1:0);
})();
