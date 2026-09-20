const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  let ok=0, ko=0;
  const att=(d,a,v)=>{ if(String(a)===String(v)){ok++;console.log('  ✓ '+d+'  → '+v);} else {ko++;console.log('  ✗ '+d+'\n      atteso: '+a+'\n      avuto:  '+v);} };

  // ---- A. deploy così com'è: nessun proxy ----
  console.log('\nA) Senza PROXY_URL (stato del deploy)');
  let pg = await b.newPage();
  const err=[], rete=[];
  pg.on('pageerror', e=>err.push(e.message));
  pg.on('console', m=>{ if(m.type()==='error') err.push('console: '+m.text()); });
  pg.on('request', r=>rete.push(r.url()));
  await pg.goto('http://127.0.0.1:8899/index.html', { waitUntil:'load', timeout:60000 });
  await pg.waitForTimeout(3000);
  att('nessun errore JS', 0, err.length);
  att('proxy non attivo', '', await pg.evaluate(()=>window.bsiProxy.url()));
  att('nessuna richiesta a /stato', 0, rete.filter(u=>/\/stato$/.test(u)).length);
  att('non copre nulla', false, await pg.evaluate(()=>window.bsiProxy.copre('groq')));
  await pg.close();

  // ---- B. proxy simulato ----
  console.log('\nB) Con un proxy che copre groq e gemini');
  pg = await b.newPage();
  const err2=[];
  pg.on('pageerror', e=>err2.push(e.message));
  // intercetta il finto Worker
  await pg.route('https://proxy.finto.test/**', async route => {
    const u = route.request().url();
    if(u.endsWith('/stato'))
      return route.fulfill({ status:200, contentType:'application/json',
        headers:{'Access-Control-Allow-Origin':'*'}, body: JSON.stringify({fornitori:['groq','gemini']}) });
    if(/\/gemini\/v1beta\/models\?/.test(u))
      return route.fulfill({ status:200, contentType:'application/json',
        headers:{'Access-Control-Allow-Origin':'*'},
        body: JSON.stringify({models:[{name:'models/gemini-2.5-flash',
          supportedGenerationMethods:['generateContent','streamGenerateContent']}]}) });
    return route.fulfill({ status:400, contentType:'application/json',
      headers:{'Access-Control-Allow-Origin':'*'}, body:'{"error":{"message":"finto"}}' });
  });
  await pg.addInitScript(() => { try{ localStorage.setItem('bsi_proxy_url','https://proxy.finto.test'); }catch(e){} });
  await pg.goto('http://127.0.0.1:8899/index.html', { waitUntil:'load', timeout:60000 });
  await pg.waitForTimeout(2500);
  const st = await pg.evaluate(async () => {
    await window.bsiProxy.ricarica();
    return { url: window.bsiProxy.url(), groq: window.bsiProxy.copre('groq'),
             gemini: window.bsiProxy.copre('gemini'), claude: window.bsiProxy.copre('claude'),
             usabile: window.bsiHasAnySavedKey() };
  });
  att('proxy attivo', 'https://proxy.finto.test', st.url);
  att('copre groq', true, st.groq);
  att('copre gemini', true, st.gemini);
  att('NON copre claude', false, st.claude);
  att('utilizzabile senza chiavi salvate', true, st.usabile);

  // la richiesta reale parte senza chiave?
  const inviata = await pg.evaluate(async () => {
    let vista = null;
    const orig = window.fetch;
    window.fetch = async (u,o) => { if(String(u).indexOf('proxy.finto.test')>=0 && String(u).indexOf('/stato')<0){ vista={url:String(u), h:(o&&o.headers)||{}}; } return orig(u,o); };
    try{ await window.bsiStreamChat('groq','',[{role:'user',content:'ciao'}],'sys',{onToken(){},onDone(){}}); }catch(e){}
    window.fetch = orig;
    return vista;
  });
  att('instradata al proxy', 'https://proxy.finto.test/groq/openai/v1/chat/completions', inviata && inviata.url);
  att('senza Authorization', undefined, inviata && inviata.h.Authorization);
  att('nessun errore JS', 0, err2.length);

  // il riquadro della chiave sparisce?
  const ui = await pg.evaluate(async () => {
    const fab = document.getElementById('bsi-spectra-fab');
    if(fab) fab.click();
    await new Promise(r=>setTimeout(r,1200));
    const kb = document.getElementById('bsi-hub-keybox');
    const bd = document.getElementById('bsi-hub-proxybadge');
    return { keybox: kb ? getComputedStyle(kb).display : 'assente',
             badge: bd ? getComputedStyle(bd).display : 'assente',
             testo: bd ? bd.textContent : '' };
  });
  att('riquadro chiave nascosto', 'none', ui.keybox);
  att('badge mostrato', 'block', ui.badge);
  att('badge spiega perché', true, /nessuna chiave/i.test(ui.testo));
  await pg.close();

  await b.close();
  console.log('\n' + (ko ? '✗ '+ko+' FALLITI, ' : '') + ok + ' passati');
  process.exit(ko?1:0);
})();
