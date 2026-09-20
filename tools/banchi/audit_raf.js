const { chromium } = require('playwright-core');
const TABS = ['catalog','cosmo','gallery','mol','exo','neb','spec','nuc','theory','phenomena',
              'extreme','reactions','missions','timeline','resources','calc','com','quiz'];
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  const ctx = await b.newContext({ viewport:{width:412,height:900}, serviceWorkers:'block' });
  const pg = await ctx.newPage();
  await pg.addInitScript(()=>{
    window.__raf=0; window.__chi={};
    const s=window.requestAnimationFrame;
    window.requestAnimationFrame=function(f){
      window.__raf++;
      const n=(f && f.name) || 'anonima';
      window.__chi[n]=(window.__chi[n]||0)+1;
      return s.apply(this,arguments);
    };
  });
  const err=[]; pg.on('pageerror',e=>err.push(e.message));
  await pg.goto('http://127.0.0.1:8899/astro.html',{waitUntil:'load',timeout:60000});
  await pg.waitForTimeout(2500);
  async function misura(et){
    await pg.evaluate(()=>{ window.__raf=0; window.__chi={}; });
    await pg.waitForTimeout(3000);
    const d=await pg.evaluate(()=>({ n:window.__raf, chi:window.__chi }));
    const r=d.n/3;
    console.log('  '+et.padEnd(40)+r.toFixed(1).padStart(7)+' fps  '+
      Object.entries(d.chi).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([k,v])=>k+':'+Math.round(v/3)).join('  '));
    return r;
  }
  const base = await misura('apertura (tab catalog)');
  for(const t of TABS){ await pg.evaluate(k=>{ if(typeof ST==='function') ST(k); }, t); await pg.waitForTimeout(500); }
  const dopo = await misura('dopo tutti i 18 tab');
  await pg.evaluate(()=>{ if(typeof ST==='function') ST('catalog'); });
  await pg.waitForTimeout(800);
  const ritorno = await misura('tornato su catalog');
  console.log('\n  errori JS durante il giro: '+err.length);
  err.slice(0,3).forEach(e=>console.log('    ! '+e.slice(0,120)));
  console.log('  crescita dopo 18 tab: '+(base>0?(dopo/base).toFixed(2)+'×':'n/d'));
  console.log(dopo > base*1.6 ? '  ⚠ I CICLI SI ACCUMULANO' : '  ✓ i cicli NON si accumulano');
  await b.close();
})();
