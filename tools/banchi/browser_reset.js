const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  const ctx = await b.newContext();
  const pg = await ctx.newPage();
  const err=[];
  pg.on('pageerror', e=>err.push(e.message));
  /* Emscripten compila il .wasm in streaming; se il corpo della risposta
     viene troncato — succede quando la batteria fa girare piu' browser insieme
     sullo stesso server locale — scrive due righe in console e RICADE
     sull'istanziazione da ArrayBuffer, che riesce. Contarle come errori
     rendeva il banco incostante: passava da solo e falliva nella batteria, che
     e' il modo peggiore di fallire, perche' insegna a rilanciare finche' non
     diventa verde. Se anche la ricaduta fallisse, l'errore che ne segue non
     corrisponde a questo filtro e resta contato. */
  const WASM_RICADUTA = /wasm streaming compile failed|falling back to ArrayBuffer instantiation/;
  pg.on('console', m=>{ if(m.type()==='error' && !WASM_RICADUTA.test(m.text())) err.push('console: '+m.text()); });
  // stato di partenza: utente con chat, chiavi vecchie, appunti, licenza
  await pg.addInitScript(() => {
    try{
      localStorage.setItem('bsi_ai_threads', JSON.stringify({threads:[
        {id:'t1',title:'Glicolisi',messages:[{role:'user',content:'ciao'}],createdAt:1},
        {id:'t2',title:'Spettri',messages:[],createdAt:2}],activeId:'t1'}));
      localStorage.setItem('bsi_api_keys', JSON.stringify({groq:'gsk_VECCHIA'}));
      localStorage.setItem('bsi_api_key', 'gsk_ANTICA');
      localStorage.setItem('bsi_ai_provider', 'groq');
      localStorage.setItem('bsi_modello_groq', '{"model":"llama-3.3-70b-versatile"}');
      localStorage.setItem('bsi_ai_memory', '["studia biochimica"]');
      localStorage.setItem('bsi_note_1', 'appunto importante');
      localStorage.setItem('bsi_pro_license', 'LICENZA-VERA');
    }catch(e){}
  });
  await pg.goto('http://127.0.0.1:8899/index.html', { waitUntil:'load', timeout:60000 });
  await pg.waitForTimeout(2500);

  let ok=0,ko=0;
  const att=(d,a,v)=>{ if(String(a)===String(v)){ok++;console.log('  ✓ '+d+'  → '+v);} else {ko++;console.log('  ✗ '+d+'\n      atteso: '+a+'\n      avuto:  '+v);} };

  // apri Spectra
  await pg.evaluate(() => { const f=document.getElementById('bsi-spectra-fab'); if(f) f.click(); });
  await pg.waitForTimeout(1200);

  console.log('\n1) Il pulsante esiste ed è nella barra');
  att('pulsante presente', true, await pg.evaluate(()=>!!document.getElementById('bsi-hub-reset')));
  att('pannello inizialmente chiuso', 'none',
      await pg.evaluate(()=>getComputedStyle(document.getElementById('bsi-hub-resetbox')).display));

  console.log('\n2) Un clic apre il pannello, non cancella niente');
  await pg.click('#bsi-hub-reset'); await pg.waitForTimeout(400);
  att('pannello aperto', 'block',
      await pg.evaluate(()=>getComputedStyle(document.getElementById('bsi-hub-resetbox')).display));
  att('chat ancora salvate', true, await pg.evaluate(()=>!!localStorage.getItem('bsi_ai_threads')));
  att('chiavi ancora salvate', true, await pg.evaluate(()=>!!localStorage.getItem('bsi_api_keys')));

  console.log('\n3) Le caselle predefinite sono chat + chiavi');
  const caselle = await pg.evaluate(()=>Array.from(
    document.querySelectorAll('#bsi-hub-resetbox input[type=checkbox]'))
    .map(c=>({g:c.getAttribute('data-g'), spuntata:c.checked, spenta:c.disabled})));
  att('cinque gruppi offerti', 5, caselle.length);
  att('spuntati di partenza', 'chat,chiavi',
      caselle.filter(c=>c.spuntata).map(c=>c.g).join(','));
  att('memoria NON spuntata', false, caselle.find(c=>c.g==='memoria').spuntata);
  att('ripasso disattivato perché vuoto', true, caselle.find(c=>c.g==='ripasso').spenta);

  console.log('\n4) Annulla non cancella');
  await pg.click('#bsi-reset-annulla'); await pg.waitForTimeout(300);
  att('pannello chiuso', 'none',
      await pg.evaluate(()=>getComputedStyle(document.getElementById('bsi-hub-resetbox')).display));
  att('chat intatte', true, await pg.evaluate(()=>!!localStorage.getItem('bsi_ai_threads')));

  console.log('\n5) Conferma: cancella chat e chiavi, non il resto');
  await pg.click('#bsi-hub-reset'); await pg.waitForTimeout(400);
  await pg.click('#bsi-reset-vai'); await pg.waitForTimeout(800);
  const dopo = await pg.evaluate(()=>({
    threads: localStorage.getItem('bsi_ai_threads'),
    keys: localStorage.getItem('bsi_api_keys'),
    keyVecchia: localStorage.getItem('bsi_api_key'),
    modello: localStorage.getItem('bsi_modello_groq'),
    memoria: localStorage.getItem('bsi_ai_memory'),
    appunto: localStorage.getItem('bsi_note_1'),
    licenza: localStorage.getItem('bsi_pro_license')
  }));
  att('chat cancellate', null, dopo.threads);
  att('chiavi cancellate', null, dopo.keys);
  att('chiave VECCHIA cancellata', null, dopo.keyVecchia);
  att('cache modello cancellata', null, dopo.modello);
  att('memoria preservata (non spuntata)', '["studia biochimica"]', dopo.memoria);
  att('appunto preservato', 'appunto importante', dopo.appunto);
  att('LICENZA preservata', 'LICENZA-VERA', dopo.licenza);

  console.log('\n6) La UI riparte davvero da capo');
  const ui = await pg.evaluate(()=>({
    chat: document.getElementById('bsi-hub-threadsel').options.length,
    keybox: getComputedStyle(document.getElementById('bsi-hub-keybox')).display,
    msgs: document.getElementById('bsi-hub-msgs').textContent
  }));
  att('una sola chat vuota', 1, ui.chat);
  att('richiede di nuovo la chiave', 'block', ui.keybox);
  att('conferma a schermo', true, /Fatto/.test(ui.msgs));

  console.log('\n7) Dopo un ricaricamento la chiave vecchia non risorge');
  // Scheda NUOVA nello stesso contesto: addInitScript e' legato alla pagina
  // di prima e su un reload riscriverebbe le chiavi, falsando la verifica.
  const pg2 = await ctx.newPage();
  await pg2.goto('http://127.0.0.1:8899/index.html', { waitUntil:'load', timeout:60000 });
  await pg2.waitForTimeout(2500);
  const risorta = await pg2.evaluate(()=>({
    keys: localStorage.getItem('bsi_api_keys'),
    vecchia: localStorage.getItem('bsi_api_key')
  }));
  att('nessuna mappa chiavi', null, risorta.keys);
  att('nessuna chiave vecchia', null, risorta.vecchia);

  att('nessun errore JS', 0, err.length);
  err.slice(0,5).forEach(e=>console.log('     ! '+e.slice(0,200)));

  await b.close();
  console.log('\n' + (ko?'✗ '+ko+' FALLITI, ':'') + ok + ' passati');
  process.exit(ko?1:0);
})();
