/* Ogni ciclo di animazione dovrebbe fermare il LAVORO quando cio' che
   disegna non e' a schermo. Ieri ne ho trovato uno senza guardia in
   astro.html: qui cerco la CLASSE, non il caso. */
const fs=require('fs'), path=require('path');
const R='/home/user/BioSpecInfo-v11';
const file=fs.readdirSync(R).filter(f=>/\.(html|js)$/.test(f) && !/three|3Dmol|gltf|smiles|sql-wasm/.test(f));
let tot=0, senza=[];
file.forEach(function(f){
  const righe=fs.readFileSync(path.join(R,f),'utf8').split('\n');
  righe.forEach(function(l,i){
    if(l.length>500) return;                       // librerie minificate
    if(!/requestAnimationFrame\s*\(/.test(l)) return;
    // il ciclo e' tale se richiede se stesso: cerco il nome della funzione
    const m = /requestAnimationFrame\s*\(\s*([A-Za-z_$][\w$]*)\s*\)/.exec(l);
    if(!m) return;
    const nome = m[1];
    tot++;
    // la guardia sta nelle 8 righe successive alla richiesta
    const dopo = righe.slice(i, i+9).join(' ');
    const haGuardia = /document\.hidden|offsetParent\s*===?\s*null|clientWidth\s*<|clientHeight\s*<|\.checkVisibility|!.*classList\.contains\(['"]active/.test(dopo);
    if(!haGuardia) senza.push({f, riga:i+1, nome, testo:l.trim().slice(0,90)});
  });
});
console.log('cicli di animazione trovati: '+tot);
console.log('SENZA guardia di visibilita\': '+senza.length+'\n');
const perFile={};
senza.forEach(s=>{ (perFile[s.f]=perFile[s.f]||[]).push(s); });
Object.keys(perFile).forEach(function(f){
  console.log('### '+f+'  ('+perFile[f].length+')');
  perFile[f].forEach(s=>console.log('   riga '+String(s.riga).padStart(5)+'  '+s.nome+'()   '+s.testo));
});
