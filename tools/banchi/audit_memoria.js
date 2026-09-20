/* Animazioni e memoria: timer che non si fermano, requestAnimationFrame che
   girano a vuoto, listener accumulati. Su un telefono si traducono in
   batteria che si scarica e pagina che scalda. */
const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  for(const p of ['index.html','astro.html','rdkit_lab.html','simulazioni.html']){
    const ctx = await b.newContext({ viewport:{width:412,height:900}, serviceWorkers:'block' });
    const pg = await ctx.newPage();
    await pg.addInitScript(()=>{
      window.__t = { interval:0, timeout:0, raf:0, listener:0 };
      const si=window.setInterval, ci=window.clearInterval;
      window.setInterval=function(){ window.__t.interval++; return si.apply(this,arguments); };
      window.clearInterval=function(){ window.__t.interval--; return ci.apply(this,arguments); };
      const sr=window.requestAnimationFrame;
      window.requestAnimationFrame=function(){ window.__t.raf++; return sr.apply(this,arguments); };
      const ael=EventTarget.prototype.addEventListener;
      EventTarget.prototype.addEventListener=function(){ window.__t.listener++; return ael.apply(this,arguments); };
    });
    await pg.goto('http://127.0.0.1:8899/'+p,{waitUntil:'load',timeout:60000});
    await pg.waitForTimeout(3000);
    const a = await pg.evaluate(()=>({...window.__t}));
    await pg.waitForTimeout(5000);
    const b2 = await pg.evaluate(()=>({...window.__t}));
    const rafRitmo = (b2.raf-a.raf)/5;
    console.log(p.padEnd(20)+
      ' intervalli attivi:'+String(b2.interval).padStart(3)+
      '  rAF/s:'+rafRitmo.toFixed(1).padStart(6)+
      '  listener:'+String(b2.listener).padStart(5)+
      (b2.listener-a.listener > 200 ? '  ⚠ listener che crescono (+'+(b2.listener-a.listener)+')' : '')+
      (b2.interval > 6 ? '  ⚠ molti intervalli' : ''));
    await ctx.close();
  }
  await b.close();
  console.log('\nrAF/s alto e\' NORMALE se c\'e\' un\'animazione a schermo (60/s = un fotogramma');
  console.log('per refresh). Conta che gli INTERVALLI non crescano e che i listener si fermino.');
})();
