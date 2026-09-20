/* Audit profondo: non basta che la pagina carichi. Si percorrono tutte le
   sezioni e tutti i tab CLICCANDOLI, perche' il codice che si rompe e'
   quasi sempre quello che gira solo quando l'utente tocca qualcosa. */
const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  let tot=0;
  async function apri(url){
    const ctx = await b.newContext({ viewport:{width:412,height:900}, serviceWorkers:'block' });
    const pg = await ctx.newPage();
    const err=[];
    pg.on('pageerror', e=>err.push(e.message));
    pg.on('console', m=>{ if(m.type()==='error' && !/Failed to load resource/.test(m.text())) err.push(m.text()); });
    await pg.goto(url,{waitUntil:'load',timeout:60000});
    await pg.waitForTimeout(2600);
    return { pg, ctx, err };
  }

  console.log('\n=== index.html: tutte le sezioni ===');
  { const {pg,ctx,err} = await apri('http://127.0.0.1:8899/index.html');
    const sezioni = await pg.evaluate(()=>{
      if(typeof window.SECTIONS === 'object' && window.SECTIONS) return Object.keys(window.SECTIONS);
      return Array.from(document.querySelectorAll('[data-sec],[data-section]'))
        .map(e=>e.getAttribute('data-sec')||e.getAttribute('data-section')).filter(Boolean);
    });
    console.log('   sezioni trovate: ' + sezioni.length);
    let visitate=0;
    for(const s of sezioni){
      try{ await pg.evaluate(k=>{ if(typeof window.goSection==='function') window.goSection(k); }, s);
           await pg.waitForTimeout(90); visitate++; }catch(e){ err.push('goSection('+s+'): '+e.message); }
    }
    console.log('   visitate: ' + visitate + '  errori: ' + err.length);
    err.slice(0,6).forEach(e=>console.log('     ! '+e.slice(0,150)));
    tot+=err.length; await ctx.close(); }

  console.log('\n=== astro.html: tutti i tab ===');
  { const {pg,ctx,err} = await apri('http://127.0.0.1:8899/astro.html');
    const tabs = await pg.evaluate(()=>Array.from(document.querySelectorAll('[data-tab]'))
      .map(e=>e.getAttribute('data-tab')));
    console.log('   tab trovati: ' + tabs.length);
    for(const t of tabs){
      try{ await pg.evaluate(k=>{ const el=document.querySelector('[data-tab="'+k+'"]'); if(el) el.click(); }, t);
           await pg.waitForTimeout(320); }catch(e){ err.push('tab '+t+': '+e.message); }
    }
    console.log('   errori: ' + err.length);
    err.slice(0,6).forEach(e=>console.log('     ! '+e.slice(0,150)));
    tot+=err.length; await ctx.close(); }

  console.log('\n=== pro.html / rdkit_lab.html: tutti i pannelli ===');
  for(const p of ['pro.html','rdkit_lab.html']){
    const {pg,ctx,err} = await apri('http://127.0.0.1:8899/'+p);
    const n = await pg.evaluate(async ()=>{
      const t=document.querySelectorAll('.tab,[data-panel]');
      for(const e of t){ try{ e.click(); }catch(_){ } await new Promise(r=>setTimeout(r,180)); }
      return t.length;
    });
    await pg.waitForTimeout(900);
    console.log('   '+p+': '+n+' pannelli, errori: '+err.length);
    err.slice(0,5).forEach(e=>console.log('     ! '+e.slice(0,150)));
    tot+=err.length; await ctx.close();
  }

  console.log('\n=== ogni pulsante di ogni pagina (clic reale) ===');
  for(const p of ['simulazioni.html','chimorga.html','accademia.html','guidaret.html','sr_completo.html']){
    const {pg,ctx,err} = await apri('http://127.0.0.1:8899/'+p);
    const n = await pg.evaluate(async ()=>{
      const bs=Array.from(document.querySelectorAll('button,[role="button"],.tab')).slice(0,60);
      for(const e of bs){ try{ e.click(); }catch(_){ } await new Promise(r=>setTimeout(r,70)); }
      return bs.length;
    });
    await pg.waitForTimeout(800);
    console.log('   '+p+': '+n+' pulsanti premuti, errori: '+err.length);
    err.slice(0,5).forEach(e=>console.log('     ! '+e.slice(0,150)));
    tot+=err.length; await ctx.close();
  }
  await b.close();
  console.log('\nERRORI TOTALI NELL\'AUDIT PROFONDO: ' + tot);
})();
