/* Audit statico: le classi di bug che questo progetto ha gia' avuto, cercate
   in TUTTI i file invece che nel punto dove si sono manifestate. */
const fs=require('fs'), path=require('path');
const R='/home/user/BioSpecInfo-v11';
const pagine=fs.readdirSync(R).filter(f=>f.endsWith('.html'));
let problemi=[];
function seg(f,riga,cosa,testo){ problemi.push({f,riga,cosa,testo}); }

pagine.forEach(function(f){
  const t=fs.readFileSync(path.join(R,f),'utf8'), righe=t.split('\n');

  righe.forEach(function(l,i){
    const n=i+1;
    // 1) calc() senza spazi attorno a + e - : il browser SCARTA la regola
    let m=/calc\([^)]*[a-z0-9)]\s*[+\-]\s*[a-z0-9(]/gi.exec(l);
    if(m && /calc\([^)]*[a-z0-9)][+\-][a-z0-9(]/i.test(l)) seg(f,n,'calc() senza spazi',l.trim().slice(0,110));
    // 2) == invece di === su confronti con null/undefined non intenzionali: rumoroso, salto
    // 3) console.log dimenticati con dati sensibili
    if(/console\.log\([^)]*(apiKey|api_key|password|token|chiave)/i.test(l)) seg(f,n,'log di un segreto',l.trim().slice(0,110));
    // 4) chiavi API vere finite nel codice
    if(/(sk-ant-[A-Za-z0-9\-_]{20,}|sk-proj-[A-Za-z0-9]{20,}|AIza[A-Za-z0-9_\-]{30,}|gsk_[A-Za-z0-9]{40,}|xai-[A-Za-z0-9]{40,})/.test(l))
      seg(f,n,'CHIAVE API NEL CODICE',l.trim().slice(0,80));
    // 5) password in chiaro
    if(/password\s*[:=]\s*['"][^'"]{3,}['"]/i.test(l) && !/hash|sha|===\s*['"]\s*['"]/i.test(l))
      seg(f,n,'password in chiaro',l.trim().slice(0,110));
    // 6) innerHTML con concatenazione di variabile non escapata (campione)
    // troppo rumoroso su 44k righe: si controlla altrove
    // 7) setInterval senza clearInterval nella stessa pagina: candidato a consumo batteria
    // 8) target="_blank" senza rel=noopener
    if(/target=["']_blank["']/.test(l) && !/rel=["'][^"']*noopener/.test(l)) seg(f,n,'_blank senza noopener',l.trim().slice(0,110));
  });

  // 9) id duplicati nel markup statico
  const ids={}, dup=[];
  let m2, re=/\sid=["']([^"']+)["']/g;
  while((m2=re.exec(t))) { ids[m2[1]]=(ids[m2[1]]||0)+1; }
  Object.keys(ids).forEach(k=>{ if(ids[k]>1) dup.push(k+'×'+ids[k]); });
  if(dup.length) seg(f,0,'id duplicati ('+dup.length+')',dup.slice(0,6).join(', '));

  // 10) tag <script> non chiusi / sbilanciati
  const ap=(t.match(/<script\b/g)||[]).length, ch=(t.match(/<\/script>/g)||[]).length;
  if(ap!==ch) seg(f,0,'script sbilanciati','aperti '+ap+' chiusi '+ch);
});

const perTipo={};
problemi.forEach(p=>{ (perTipo[p.cosa]=perTipo[p.cosa]||[]).push(p); });
Object.keys(perTipo).sort().forEach(function(k){
  console.log('\n### ' + k + '  (' + perTipo[k].length + ')');
  perTipo[k].slice(0,8).forEach(p=>console.log('   ' + p.f + (p.riga?':'+p.riga:'') + '  ' + p.testo));
  if(perTipo[k].length>8) console.log('   … e altri ' + (perTipo[k].length-8));
});
if(!problemi.length) console.log('nessun problema nelle classi cercate');
