/* Audit a runtime su TUTTE le pagine: errori JS, 404, id duplicati nel DOM
   vivo (non nel sorgente: quelli dentro un template non contano), gestori
   onclick che puntano a funzioni inesistenti. */
const { chromium } = require('playwright-core');
const PAGINE = ['index.html','astro.html','pro.html','rdkit_lab.html','sr_completo.html',
  'sr_essenziale.html','chimorga.html','accademia.html','Biochimica_Guida_Definitiva.html',
  'simulazioni.html','file_manager.html','guidaret.html','changelog_tesi.html','download.html'];
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  let totErr=0, totDup=0, totRotti=0, tot404=0;
  for(const p of PAGINE){
    const ctx = await b.newContext({ viewport:{width:412,height:900}, serviceWorkers:'block' });
    const pg = await ctx.newPage();
    const err=[], quattro=[];
    pg.on('pageerror', e=>err.push(e.message));
    pg.on('console', m=>{ if(m.type()==='error' && !/Failed to load resource/.test(m.text())) err.push(m.text()); });
    pg.on('response', r=>{ if(r.status()===404) quattro.push(r.url().split('/').pop()); });
    try{ await pg.goto('http://127.0.0.1:8899/'+p,{waitUntil:'load',timeout:60000}); }
    catch(e){ console.log('✗ '+p+' NON CARICA: '+e.message.slice(0,60)); await ctx.close(); continue; }
    await pg.waitForTimeout(2600);

    const d = await pg.evaluate(()=>{
      // id duplicati DAVVERO presenti nel documento
      const c={}, dup=[];
      document.querySelectorAll('[id]').forEach(e=>{ c[e.id]=(c[e.id]||0)+1; });
      Object.keys(c).forEach(k=>{ if(c[k]>1) dup.push(k+'×'+c[k]); });
      // gestori inline che chiamano funzioni che non esistono
      const rotti=new Set();
      document.querySelectorAll('[onclick],[oninput],[onchange]').forEach(e=>{
        ['onclick','oninput','onchange'].forEach(a=>{
          const v=e.getAttribute(a); if(!v) return;
          // primo identificatore chiamato: nome(
          const m=v.match(/^\s*([A-Za-z_$][\w$.]*)\s*\(/);
          if(!m) return;
          const nome=m[1];
          if(nome.indexOf('.')>=0) return;              // metodi di oggetto: si saltano
          if(['if','return','this','window','alert','console'].indexOf(nome)>=0) return;
          try{ if(typeof window[nome] !== 'function') rotti.add(nome); }catch(_){}
        });
      });
      return { dup, rotti:[...rotti] };
    });
    totErr+=err.length; totDup+=d.dup.length; totRotti+=d.rotti.length; tot404+=quattro.length;
    const stato = (err.length||d.dup.length||d.rotti.length||quattro.length) ? '⚠' : '✓';
    console.log(stato+' '+p.padEnd(34)+' err:'+err.length+'  404:'+quattro.length+
                '  idDup:'+d.dup.length+'  handlerRotti:'+d.rotti.length);
    if(err.length) err.slice(0,3).forEach(e=>console.log('      ! '+e.slice(0,130)));
    if(quattro.length) console.log('      404: '+[...new Set(quattro)].slice(0,5).join(', '));
    if(d.dup.length) console.log('      id: '+d.dup.slice(0,8).join(', '));
    if(d.rotti.length) console.log('      funzioni assenti: '+d.rotti.slice(0,8).join(', '));
    await ctx.close();
  }
  await b.close();
  console.log('\nTOTALI  erroriJS:'+totErr+'  404:'+tot404+'  idDuplicati:'+totDup+'  handlerRotti:'+totRotti);
})();
