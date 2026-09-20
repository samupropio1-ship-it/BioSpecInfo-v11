const { chromium } = require('playwright-core');
(async()=>{
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  const pg = await (await b.newContext({serviceWorkers:'block'})).newPage();
  const err=[]; pg.on('pageerror',e=>err.push(e.message));
  pg.on('console',m=>{ if(m.type()==='error'&&!/Failed to load resource|favicon/.test(m.text())) err.push('console: '+m.text()); });
  await pg.goto('http://127.0.0.1:8899/index.html',{waitUntil:'load'});
  await pg.waitForTimeout(3000);
  await pg.evaluate(()=>window.goSection && window.goSection('sfarm'));
  await pg.waitForTimeout(2000);
  const r = await pg.evaluate(()=>{
    const sec=document.getElementById('sfarm');
    // conta le schede farmaco visibili e le categorie senza voci
    const cats={}; (typeof FARM_DATA!=='undefined'?FARM_DATA:[]).forEach(f=>cats[f.cat]=(cats[f.cat]||0)+1);
    return { visibile: sec?getComputedStyle(sec).display:'?',
             nodi: sec?sec.getElementsByTagName('*').length:0,
             farmaci: typeof FARM_DATA!=='undefined'?FARM_DATA.length:0,
             categorie: Object.keys(cats).length,
             vuote: Object.keys(cats).filter(k=>!cats[k]).length,
             conStruttura: (FARM_DATA||[]).filter(f=>f.smi).length };
  });
  console.log(JSON.stringify(r,null,1));
  console.log('errori JS:', err.length); err.slice(0,5).forEach(e=>console.log('  ! '+e.slice(0,160)));
  await b.close();
  process.exit(err.length?1:0);
})();
