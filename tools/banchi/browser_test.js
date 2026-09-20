const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
                                    args: ['--no-sandbox'] });
  const pg = await b.newPage();
  const errori = [], quattroquattro = [];
  pg.on('pageerror', e => errori.push(e.message));
  pg.on('console', m => { if(m.type() === 'error') errori.push('console: ' + m.text()); });
  pg.on('response', r => { if(r.status() === 404) quattroquattro.push(r.url()); });

  await pg.goto('http://127.0.0.1:8899/index.html', { waitUntil: 'load', timeout: 60000 });
  await pg.waitForTimeout(4000);

  // 1. il motore Spectra è caricato e il resolver è esposto
  const espone = await pg.evaluate(() => ({
    hub: typeof window.bsiStreamChat === 'function',
    risolvi: typeof window.bsiGeminiRisolvi === 'function',
    reset: typeof window.bsiGeminiReset === 'function',
    prov: Object.keys(window.BSI_AI_PROVIDERS || {}),
    geminiHaUrlBase: 'urlBase' in (window.BSI_AI_PROVIDERS || {}).gemini,
    geminiCandidati: ((window.BSI_AI_PROVIDERS||{}).gemini||{}).modelliCandidati
  }));
  console.log('esposizione:', JSON.stringify(espone));

  // 2. l'URL Gemini si costruisce senza "null", con fetch intercettato
  const urlProva = await pg.evaluate(async () => {
    let visto = null;
    const orig = window.fetch;
    window.fetch = async (u, o) => {
      if(String(u).indexOf('generativelanguage') >= 0){
        if(String(u).indexOf('/models?') >= 0)
          return new Response(JSON.stringify({ models: [
            { name:'models/gemini-2.5-flash', supportedGenerationMethods:['generateContent','streamGenerateContent'] },
            { name:'models/gemini-1.5-flash', supportedGenerationMethods:['generateContent','streamGenerateContent'] }
          ]}), { status: 200, headers: { 'Content-Type':'application/json' } });
        visto = String(u);
        return new Response('{"error":{"message":"prova"}}', { status: 400 });
      }
      return orig(u, o);
    };
    window.bsiGeminiReset();
    try{ await window.bsiStreamChat('gemini','AIzaFINTA',[{role:'user',content:'ciao'}],'sys',{onToken(){},onDone(){}}); }catch(e){}
    window.fetch = orig;
    return visto;
  });
  console.log('URL gemini:', urlProva);

  // 3. la chat legacy (sendAI) non lancia più ReferenceError su gemini
  await pg.evaluate(() => {
    const b = document.querySelector('.nav-btn[data-s="sai"]');
    if(b) b.click();
  });
  await pg.waitForTimeout(1500);
  const legacy = await pg.evaluate(async () => {
    if(typeof window.sendAI !== 'function') return 'sendAI assente';
    let visto = null;
    const orig = window.fetch;
    window.fetch = async (u, o) => {
      if(String(u).indexOf('generativelanguage') >= 0){
        if(String(u).indexOf('/models?') >= 0)
          return new Response(JSON.stringify({ models:[{ name:'models/gemini-2.5-flash',
            supportedGenerationMethods:['generateContent','streamGenerateContent'] }]}),
            { status:200, headers:{'Content-Type':'application/json'} });
        visto = String(u);
        return new Response(JSON.stringify({ candidates:[{ content:{ parts:[{ text:'ok' }] } }] }),
          { status:200, headers:{'Content-Type':'application/json'} });
      }
      return orig(u, o);
    };
    try{ localStorage.setItem('bsi_api_key','AIzaFINTA'); localStorage.setItem('bsi_ai_provider','gemini'); }catch(e){}
    try{ window.setAIProvider && window.setAIProvider('gemini'); }catch(e){}
    let lancio = null;
    try{
      const inp = document.getElementById('aiInput');
      if(inp){ inp.value = 'ciao'; window.sendAI(); }
      else return 'campo aiInput assente (UI non montata)';
    }catch(e){ lancio = e.message; }
    await new Promise(r => setTimeout(r, 1500));
    window.fetch = orig;
    return { lancio: lancio, url: visto };
  });
  console.log('legacy sendAI:', JSON.stringify(legacy));

  console.log('\nerrori JS (' + errori.length + '):');
  errori.slice(0,15).forEach(e => console.log('  ! ' + e.slice(0,220)));
  const rilevanti = quattroquattro.filter(u => !/textures|\.wasm|favicon|\.glb/.test(u));
  console.log('404 rilevanti (' + rilevanti.length + '):');
  rilevanti.slice(0,10).forEach(u => console.log('  ! ' + u));

  await b.close();
  process.exit(errori.length ? 1 : 0);
})();
