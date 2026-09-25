const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  const ctx = await b.newContext(); const pg = await ctx.newPage();
  const err=[]; pg.on('pageerror',e=>err.push(e.message));
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
  await pg.goto('http://127.0.0.1:8899/index.html',{waitUntil:'load',timeout:60000});
  await pg.waitForTimeout(2500);
  await pg.evaluate(()=>{ const f=document.getElementById('bsi-spectra-fab'); if(f) f.click(); });
  await pg.waitForTimeout(1200);
  let ok=0,ko=0;
  const att=(d,a,v)=>{ if(String(a)===String(v)){ok++;console.log('  ✓ '+d+'  → '+v);} else {ko++;console.log('  ✗ '+d+'\n      atteso: '+a+'\n      avuto:  '+v);} };
  const voci = await pg.evaluate(()=>Array.from(document.getElementById('bsi-hub-provsel').options).map(o=>o.textContent));
  console.log('\nTendina completa:'); voci.forEach((v,i)=>console.log('  '+String(i+1).padStart(2)+'. '+v));
  att('10 configurazioni', 10, voci.length);
  att('3 gratuite', 3, voci.filter(v=>/gratis/.test(v)).length);
  att('c\'e\' GPT-5.6', true, voci.some(v=>/GPT-5\.6/.test(v)));
  att('c\'e\' Gemini 3 Pro', true, voci.some(v=>/Gemini 3 Pro/.test(v)));
  att('c\'e\' DeepSeek', true, voci.some(v=>/DeepSeek V4/.test(v)));

  console.log('\nChiave condivisa nella UI');
  const cond = await pg.evaluate(async ()=>{
    const sel=document.getElementById('bsi-hub-provsel');
    // salva la chiave su Fable
    sel.value='claude_fable'; sel.dispatchEvent(new Event('change'));
    await new Promise(r=>setTimeout(r,200));
    document.getElementById('bsi-hub-keyinput').value='sk-ant-PROVA';
    document.getElementById('bsi-hub-savekey').click();
    await new Promise(r=>setTimeout(r,300));
    // passa a Sonnet: il riquadro NON deve ricomparire
    sel.value='claude_sonnet'; sel.dispatchEvent(new Event('change'));
    await new Promise(r=>setTimeout(r,300));
    const kb=getComputedStyle(document.getElementById('bsi-hub-keybox')).display;
    // e su Groq invece SI'
    sel.value='groq'; sel.dispatchEvent(new Event('change'));
    await new Promise(r=>setTimeout(r,300));
    const kb2=getComputedStyle(document.getElementById('bsi-hub-keybox')).display;
    return { sonnet: kb, groq: kb2, salvate: Object.keys(JSON.parse(localStorage.getItem('bsi_api_keys')||'{}')) };
  });
  att('su Sonnet non richiede la chiave', 'none', cond.sonnet);
  att('su Groq la richiede', 'block', cond.groq);
  att('una sola voce salvata', 'claude_fable', cond.salvate.join(','));
  att('nessun errore JS', 0, err.length);
  err.slice(0,3).forEach(e=>console.log('     ! '+e.slice(0,180)));
  await b.close();
  console.log('\n' + (ko?'✗ '+ko+' FALLITI, ':'') + ok + ' passati');
  process.exit(ko?1:0);
})();
