/* Il campo del proxy: deve essere raggiungibile ANCHE con una chiave
   salvata (il riquadro 🔑 sparisce, quello no), e non deve accettare un
   indirizzo che non risponde. */
const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  let ok=0,ko=0;
  const att=(d,a,v)=>{ if(String(a)===String(v)){ok++;console.log('  ✓ '+d+'  → '+v);} else {ko++;console.log('  ✗ '+d+'\n      atteso: '+a+'\n      avuto:  '+v);} };
  async function apri(seed){
    const ctx = await b.newContext(); const pg = await ctx.newPage(); const err=[];
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
    pg.on('console', m=>{ if(m.type()==='error' && !/Failed to load resource/.test(m.text()) && !WASM_RICADUTA.test(m.text())) err.push('console: '+m.text()); });
    if(seed) await pg.addInitScript(seed);
    await pg.goto('http://127.0.0.1:8899/index.html',{waitUntil:'load',timeout:60000});
    await pg.waitForTimeout(2500);
    await pg.evaluate(()=>{ const f=document.getElementById('bsi-spectra-fab'); if(f) f.click(); });
    await pg.waitForTimeout(1200);
    return { pg, err };
  }
  const st = pg => pg.evaluate(()=>({
    keybox: (document.getElementById('bsi-hub-keybox')||{style:{}}).style.display,
    proxybox: !!document.getElementById('bsi-hub-proxybox'),
    sommario: (document.getElementById('bsi-hub-proxysum')||{}).textContent,
    corpo: (document.getElementById('bsi-hub-proxybody')||{style:{}}).style.display,
    esito: (document.getElementById('bsi-hub-proxyesito')||{}).textContent,
    salvato: localStorage.getItem('bsi_proxy_url')
  }));

  console.log('\nA) Con una chiave salvata il riquadro 🔑 sparisce, il proxy no');
  var a = await apri(()=>{ try{ localStorage.setItem('bsi_api_keys', JSON.stringify({groq:'gsk_X'})); }catch(e){} });
  var s = await st(a.pg);
  att('riquadro chiave nascosto', 'none', s.keybox);
  att('ma il blocco proxy c\'è', true, s.proxybox);
  att('ed è ripiegato su una riga', 'none', s.corpo);
  att('che dice già cosa fa', true, /Senza chiavi/.test(s.sommario));
  att('nessun errore JS', 0, a.err.length);
  a.err.slice(0,3).forEach(e=>console.log('     ! '+e.slice(0,200)));

  console.log('\nB) Si apre al tocco');
  await a.pg.evaluate(()=>document.getElementById('bsi-hub-proxyhead').click());
  var s2 = await st(a.pg);
  att('corpo aperto', 'block', s2.corpo);

  console.log('\nC) Un indirizzo non https viene respinto senza salvare');
  await a.pg.evaluate(()=>{ document.getElementById('bsi-hub-proxyinput').value='pippo'; 
                            document.getElementById('bsi-hub-saveproxy').click(); });
  await a.pg.waitForTimeout(600);
  var s3 = await st(a.pg);
  att('lo dice', true, /indirizzo https completo/.test(s3.esito));
  att('e NON lo salva', null, s3.salvato);

  console.log('\nD) Un proxy che non risponde non resta impostato');
  await a.pg.route('**://proxy-finto.test/**', r=>r.abort('failed'));
  await a.pg.evaluate(()=>{ document.getElementById('bsi-hub-proxyinput').value='https://proxy-finto.test';
                            document.getElementById('bsi-hub-saveproxy').click(); });
  await a.pg.waitForTimeout(2500);
  var s4 = await st(a.pg);
  att('lo dice', true, /Non risponde/.test(s4.esito));
  att('e ripristina lo stato di prima', null, s4.salvato);

  console.log('\nE) Un proxy che risponde viene collegato e riassunto');
  await a.pg.route('**://proxy-vero.test/**', r=>r.fulfill({ status:200,
    contentType:'application/json', body:'{"fornitori":["groq","gemini"]}',
    headers:{'access-control-allow-origin':'*'} }));
  await a.pg.evaluate(()=>{ document.getElementById('bsi-hub-proxyinput').value='https://proxy-vero.test';
                            document.getElementById('bsi-hub-saveproxy').click(); });
  await a.pg.waitForTimeout(2500);
  var s5 = await st(a.pg);
  att('collegato', true, /Collegato/.test(s5.esito));
  att('elenca cosa copre', true, /groq/.test(s5.esito));
  att('salvato', 'https://proxy-vero.test', s5.salvato);
  att('la riga chiusa lo dice senza doverla aprire', true, /Proxy collegato/.test(s5.sommario));

  console.log('\nF) Scollegare torna alle chiavi');
  await a.pg.evaluate(()=>document.getElementById('bsi-hub-clearproxy').click());
  await a.pg.waitForTimeout(1200);
  var s6 = await st(a.pg);
  att('rimosso', null, s6.salvato);
  att('e il sommario torna com\'era', true, /Senza chiavi/.test(s6.sommario));
  att('nessun errore JS in tutto il giro', 0, a.err.length);
  a.err.slice(0,3).forEach(e=>console.log('     ! '+e.slice(0,200)));
  await a.pg.close();
  await b.close();
  console.log('\n' + (ko?'✗ '+ko+' FALLITI, ':'') + ok + ' passati');
  process.exit(ko?1:0);
})();
