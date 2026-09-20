/* Il numero di fotogrammi richiesti NON e' il lavoro fatto: un ciclo con la
   guardia chiede il fotogramma e poi esce subito. Qui si misura il LAVORO —
   disegni su canvas e scritture di innerHTML — che e' cio' che consuma
   batteria. */
const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  const ctx = await b.newContext({ viewport:{width:412,height:900}, serviceWorkers:'block' });
  const pg = await ctx.newPage();
  await pg.addInitScript(()=>{
    window.__w = { stroke:0, fillText:0, html:0, render:0 };
    const p = CanvasRenderingContext2D.prototype;
    ['stroke','fillText','fill'].forEach(function(m){
      const o = p[m];
      p[m] = function(){ window.__w[m==='fill'?'stroke':m]++; return o.apply(this, arguments); };
    });
    const d = Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML');
    Object.defineProperty(Element.prototype,'innerHTML',{
      get:d.get, configurable:true,
      set:function(v){ window.__w.html++; return d.set.call(this,v); }
    });
  });
  await pg.goto('http://127.0.0.1:8899/astro.html',{waitUntil:'load',timeout:60000});
  await pg.waitForTimeout(2500);
  async function lavoro(et){
    await pg.evaluate(()=>{ window.__w={stroke:0,fillText:0,html:0,render:0}; });
    await pg.waitForTimeout(3000);
    const w = await pg.evaluate(()=>({...window.__w}));
    console.log('  '+et.padEnd(46)+' disegni/s:'+String(Math.round((w.stroke+w.fillText)/3)).padStart(5)+
                '   innerHTML/s:'+String(Math.round(w.html/3)).padStart(4));
    return (w.stroke+w.fillText)/3 + w.html/3;
  }
  const prima = await lavoro('sul catalogo, PRIMA di aprire Calcolatori');
  await pg.evaluate(()=>{ if(typeof ST==='function') ST('calc'); });
  await pg.waitForTimeout(1500);
  await lavoro('mentre guardo Calcolatori (deve lavorare)');
  await pg.evaluate(()=>{ if(typeof ST==='function') ST('catalog'); });
  await pg.waitForTimeout(1200);
  const dopo = await lavoro('tornato sul catalogo (NON deve piu\' lavorare)');
  console.log('\n  lavoro a vuoto dopo aver chiuso la scheda: ' + Math.round(dopo) + '/s');
  console.log(dopo <= prima + 3 ? '  ✓ il simulatore si ferma quando non lo guardi'
                                : '  ⚠ continua a lavorare a vuoto');
  await b.close();
})();
