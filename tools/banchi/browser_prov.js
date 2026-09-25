const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  let ok=0,ko=0;
  const att=(d,a,v)=>{ if(String(a)===String(v)){ok++;console.log('  ✓ '+d+'  → '+v);} else {ko++;console.log('  ✗ '+d+'\n      atteso: '+a+'\n      avuto:  '+v);} };

  // ── A. utente che aveva selezionato un servizio ORA RIMOSSO ──
  console.log('\nA) Chi aveva Mistral selezionato deve poter aprire Spectra');
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
  await pg.addInitScript(()=>{ try{
    localStorage.setItem('bsi_ai_provider','mistral');
    localStorage.setItem('bsi_api_keys', JSON.stringify({mistral:'vecchia', groq:'gsk_X'}));
  }catch(e){} });
  await pg.goto('http://127.0.0.1:8899/index.html',{waitUntil:'load',timeout:60000});
  await pg.waitForTimeout(2500);
  await pg.evaluate(()=>{ const f=document.getElementById('bsi-spectra-fab'); if(f) f.click(); });
  await pg.waitForTimeout(1200);
  const st = await pg.evaluate(()=>({
    aperto: !!document.getElementById('bsi-hub-provsel'),
    scelto: document.getElementById('bsi-hub-provsel') ? document.getElementById('bsi-hub-provsel').value : null,
    voci: document.getElementById('bsi-hub-provsel') ?
          Array.from(document.getElementById('bsi-hub-provsel').options).map(o=>o.textContent) : []
  }));
  att('Spectra si apre lo stesso', true, st.aperto);
  att('ripiega su un servizio valido', true, ['groq','gemini','zai'].indexOf(st.scelto)>=0);
  att('nessun errore JS', 0, err.length);
  err.slice(0,3).forEach(e=>console.log('     ! '+e.slice(0,180)));

  console.log('\nB) La tendina contiene solo i servizi tenuti');
  st.voci.forEach(v=>console.log('     · '+v));
  att('tre gratuiti', 3, st.voci.filter(v=>/gratis/.test(v)).length);
  att('niente Mistral', false, st.voci.some(v=>/Mistral/.test(v)));
  att('niente OpenRouter', false, st.voci.some(v=>/OpenRouter/.test(v)));
  att('c\'e\' Z.AI', true, st.voci.some(v=>/Z\.AI|GLM/.test(v)));
  await pg.close();
  await b.close();
  console.log('\n' + (ko?'✗ '+ko+' FALLITI, ':'') + ok + ' passati');
  process.exit(ko?1:0);
})();
