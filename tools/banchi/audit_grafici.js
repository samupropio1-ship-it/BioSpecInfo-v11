/* Correttezza dei grafici, SEZIONE PER SEZIONE (i canvas vivono dentro schede
   che vanno aperte: controllarli tutti insieme alla fine ne mostra uno solo).
   Si guarda: canvas vuoto, sfocato su schermo ad alta densita', stirato,
   che straborda dal contenitore. */
const { chromium } = require('playwright-core');
const SEZ = `s3dpro saa sai sanimmech sbio sbiochimx sbiosyn sbuffer scalc scalcav scentro sclinical
scompare sconst scustomflash sdashboard sdbe sdiagrammi sdint sdistr senergia serrori sexam sfarm
sform sghs sglyc sinorg sinorgx sirvis skin slab slabcalc smacro3d smap smateriali smm smo smol
smolprop smorb sms snernst snmrpred snoe snotes sphase spka spkcalc spomo spt spubchem squiz
squizmet squizspec sretro srisorse srxnbal sspec sstats ssteich sstruct sstudypath ssyn stheory
sthermoadv stitr suvvis svsepr`.split(/\s+/).filter(Boolean);
const TAB_ASTRO = ['catalog','cosmo','gallery','mol','exo','neb','spec','nuc','theory','phenomena',
                   'extreme','reactions','missions','timeline','resources','calc','com','quiz'];
const PAN_RDKIT = ['p-desc','p-mol','p-sim','p-speclive'];

const ISPEZIONA = ()=>{
  const out=[];
  // c.width puo' essere ombreggiato da bsiNitido per riportare le misure
  // logiche: la nitidezza vera si legge dal getter nativo.
  const natW=Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype,'width').get;
  const natH=Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype,'height').get;
  document.querySelectorAll('canvas').forEach(function(cv){
    const box = cv.getBoundingClientRect();
    if(!(box.width>1 && box.height>1 && cv.offsetParent!==null)) return;
    let disegnato=null, err=null;
    try{
      const c = cv.getContext('2d');
      if(c){
        /* Si campiona TUTTO il buffer, non l'angolo: molti disegni sono
           centrati e guardando solo in alto a sinistra risultavano vuoti.
           Il buffer vero puo' essere 3x quello logico, quindi si usa il
           getter nativo. */
        const bw=natW.call(cv), bh=natH.call(cv);
        const d=c.getImageData(0,0,bw,bh).data;
        let n=0; for(let i=3;i<d.length;i+=4){ if(d[i]>0){ n++; if(n>200) break; } }
        disegnato = n>200;
      } else disegnato='webgl';
    }catch(e){ err=e.message.slice(0,36); }
    out.push({ id: cv.id||cv.className||'(anonimo)',
      cssW:Math.round(box.width), cssH:Math.round(box.height), intW:natW.call(cv), intH:natH.call(cv),
      nitidezza: box.width ? +(natW.call(cv)/box.width).toFixed(2) : 0,
      stirato: (box.width&&box.height&&natW.call(cv)&&natH.call(cv))
        ? Math.abs((natW.call(cv)/natH.call(cv))/(box.width/box.height)-1) > 0.03 : false,
      straborda: cv.parentElement ? box.width > cv.parentElement.getBoundingClientRect().width+2 : false,
      disegnato, err });
  });
  return out;
};

(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  const visti = new Map();
  async function raccogli(pag, apri){
    const ctx = await b.newContext({ viewport:{width:412,height:900}, deviceScaleFactor:3, serviceWorkers:'block' });
    const pg = await ctx.newPage();
    await pg.goto('http://127.0.0.1:8899/'+pag,{waitUntil:'load',timeout:60000});
    await pg.waitForTimeout(2600);
    const passi = apri || [null];
    for(const p of passi){
      if(p) { try{ await p(pg); }catch(e){} await pg.waitForTimeout(450); }
      const r = await pg.evaluate(ISPEZIONA);
      r.forEach(c=>{ const k=pag+'|'+c.id; if(!visti.has(k)) visti.set(k,{pag,...c}); });
    }
    await ctx.close();
  }
  await raccogli('index.html', SEZ.map(s=>pg=>pg.evaluate(k=>{ if(typeof goSection==='function') goSection(k); }, s)));
  await raccogli('astro.html', TAB_ASTRO.map(t=>pg=>pg.evaluate(k=>{ if(typeof ST==='function') ST(k); }, t)));
  await raccogli('rdkit_lab.html', PAN_RDKIT.map(p=>pg=>pg.evaluate(k=>{ if(typeof showPanelById==='function') showPanelById(k); }, p)));
  for(const p of ['simulazioni.html','sr_completo.html','pro.html','chimorga.html','accademia.html'])
    await raccogli(p, [null, pg=>pg.evaluate(async()=>{ for(const e of Array.from(document.querySelectorAll('button,.tab')).slice(0,25)){ try{e.click();}catch(_){} await new Promise(r=>setTimeout(r,120)); } })]);
  await b.close();

  let guasti=0;
  const perPag={};
  visti.forEach(c=>{ (perPag[c.pag]=perPag[c.pag]||[]).push(c); });
  Object.keys(perPag).forEach(function(p){
    console.log('\n### '+p);
    perPag[p].forEach(function(c){
      const g=[];
      if(c.disegnato===false) g.push('VUOTO');
      if(c.nitidezza && c.nitidezza < 1.5) g.push('sfocato ('+c.nitidezza+'× su 3×)');
      if(c.stirato) g.push('STIRATO');
      if(c.straborda) g.push('straborda');
      if(c.err) g.push(c.err);
      if(g.length) guasti++;
      console.log('   '+(g.length?'⚠':'✓')+' '+String(c.id).slice(0,24).padEnd(25)+
        String(c.cssW+'×'+c.cssH).padStart(9)+' css / '+String(c.intW+'×'+c.intH).padStart(10)+' px'+
        (g.length?'   → '+g.join(', '):''));
    });
  });
  console.log('\nCANVAS VISIBILI ESAMINATI: '+visti.size+'   CON PROBLEMI: '+guasti);
})();
