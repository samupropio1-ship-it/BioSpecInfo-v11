/* La memoria dei fornitori irraggiungibili, vista dall'utente:
   il ⚠ nella tendina, l'avviso col suggerimento, e il ripristino
   quando il fornitore torna a rispondere. */
const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  let ok=0,ko=0;
  const att=(d,a,v)=>{ if(String(a)===String(v)){ok++;console.log('  ✓ '+d+'  → '+v);} else {ko++;console.log('  ✗ '+d+'\n      atteso: '+a+'\n      avuto:  '+v);} };

  async function apri(seed){
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
    await pg.addInitScript(seed);
    await pg.goto('http://127.0.0.1:8899/index.html',{waitUntil:'load',timeout:60000});
    await pg.waitForTimeout(2500);
    await pg.evaluate(()=>{ const f=document.getElementById('bsi-spectra-fab'); if(f) f.click(); });
    await pg.waitForTimeout(1200);
    return { pg, err };
  }
  const stato = pg => pg.evaluate(()=>{
    const s = document.getElementById('bsi-hub-provsel');
    const kb = document.getElementById('bsi-hub-kobadge');
    return {
      scelto: s ? s.value : null,
      voci: s ? Array.from(s.options).map(o=>o.textContent) : [],
      // il gruppo conta quanto l'etichetta: un fornitore guasto ora si
      // riconosce dal fatto che e' finito nell'optgroup in fondo
      gruppi: s ? Array.from(s.options).map(o=>o.parentNode.tagName==='OPTGROUP'?o.parentNode.label:'') : [],
      badgeVisibile: !!(kb && kb.style.display !== 'none'),
      badgeTesto: kb ? kb.textContent : ''
    };
  });

  // ── A. un fornitore che non risponde (era NVIDIA, ora rimossa: il
  //       meccanismo e' lo stesso per chiunque) ──
  console.log('\nA) Z.AI annotato come irraggiungibile');
  var a = await apri(()=>{ try{
    localStorage.setItem('bsi_ai_provider','zai');
    localStorage.setItem('bsi_api_keys', JSON.stringify({ zai:'zkey-X', groq:'gsk_X' }));
    localStorage.setItem('bsi_prov_ko', JSON.stringify({ zai:{ t: Date.now(), n: 3 } }));
  }catch(e){} });
  var s = await stato(a.pg);
  att('resta selezionato: la scelta e\' dell\'utente', 'zai', s.scelto);
  // Il ⚠ davanti al nome non bastava: il fornitore restava in mezzo agli
  // altri e lo si sceglieva lo stesso. Ora deve finire nel gruppo a parte.
  att('Z.AI e\' finita nel gruppo dei non raggiungibili', true,
    s.voci.some((v,i)=>/Z\.AI/.test(v) && /Non hanno risposto/.test(s.gruppi[i])));
  att('e l\'etichetta lo dice', true, s.voci.some(v=>/Z\.AI.*non risponde/.test(v)));
  att('gli altri restano nell\'elenco normale', 1, s.gruppi.filter(g=>g).length);
  att('l\'avviso e\' visibile', true, s.badgeVisibile);
  att('dice quante volte', true, /3 volte/.test(s.badgeTesto));
  att('nomina il fornitore', true, /Z.AI/.test(s.badgeTesto));
  att('propone un\'alternativa per cui c\'e\' una chiave', true, /Groq/.test(s.badgeTesto));
  att('dice che ci riprovera\' da solo', true, /24 ore/.test(s.badgeTesto));
  att('nessun errore JS', 0, a.err.length);
  a.err.slice(0,3).forEach(e=>console.log('     ! '+e.slice(0,180)));
  await a.pg.close();

  // ── B. senza alternative si indica il pulsante 🔌, non un nome inventato ──
  console.log('\nB) Nessuna alternativa configurata');
  var c = await apri(()=>{ try{
    localStorage.setItem('bsi_ai_provider','zai');
    localStorage.setItem('bsi_api_keys', JSON.stringify({ zai:'zkey-X' }));
    localStorage.setItem('bsi_prov_ko', JSON.stringify({ zai:{ t: Date.now(), n: 1 } }));
  }catch(e){} });
  var s2 = await stato(c.pg);
  att('avviso visibile', true, s2.badgeVisibile);
  att('al primo fallimento dice "poco fa"', true, /poco fa/.test(s2.badgeTesto));
  // Il consiglio dev'essere una cosa FATTIBILE da questa schermata: su un
  // telefono, rimandare a un file del repository non e' un consiglio.
  att('indica il pulsante che c\'e\' a video', true, /🔌 Prova/.test(s2.badgeTesto));
  att('e spiega che non serve una chiave per saperlo', true, /senza|non serve creare/.test(s2.badgeTesto));
  att('non inventa un\'alternativa', false, /Alternativa/.test(s2.badgeTesto));
  att('nessun errore JS', 0, c.err.length);
  await c.pg.close();

  // ── C. annotazione scaduta: si riparte puliti ──
  console.log('\nC) Annotazione di due giorni fa');
  var d = await apri(()=>{ try{
    localStorage.setItem('bsi_ai_provider','zai');
    localStorage.setItem('bsi_api_keys', JSON.stringify({ zai:'zkey-X', groq:'gsk_X' }));
    localStorage.setItem('bsi_prov_ko', JSON.stringify({ zai:{ t: Date.now() - 48*3600*1000, n: 9 } }));
  }catch(e){} });
  var s3 = await stato(d.pg);
  att('nessun fornitore nel gruppo dei guasti', 0, s3.gruppi.filter(g=>g).length);
  att('nessun avviso', false, s3.badgeVisibile);
  att('nessun errore JS', 0, d.err.length);
  await d.pg.close();

  // ── D. il pulsante 🗑 azzera anche questo ──
  console.log('\nD) Reset "ricomincia da capo"');
  var e2 = await apri(()=>{ try{
    localStorage.setItem('bsi_ai_provider','zai');
    localStorage.setItem('bsi_api_keys', JSON.stringify({ zai:'zkey-X' }));
    localStorage.setItem('bsi_prov_ko', JSON.stringify({ zai:{ t: Date.now(), n: 4 } }));
  }catch(e){} });
  var res = await e2.pg.evaluate(()=>{
    var prima = localStorage.getItem('bsi_prov_ko');
    window.bsiCancellaDati(['chiavi']);
    return { prima: !!prima, dopo: localStorage.getItem('bsi_prov_ko') };
  });
  att('c\'era', true, res.prima);
  att('e non c\'e\' piu\'', null, res.dopo);
  att('nessun errore JS', 0, e2.err.length);
  await e2.pg.close();

  // ── E. stato pulito: nessuna regressione visiva ──
  console.log('\nE) Utente normale, niente annotazioni');
  var f = await apri(()=>{ try{
    localStorage.setItem('bsi_api_keys', JSON.stringify({ groq:'gsk_X' }));
  }catch(e){} });
  var s5 = await stato(f.pg);
  att('nessun fornitore nel gruppo dei guasti', 0, s5.gruppi.filter(g=>g).length);
  att('nessun avviso', false, s5.badgeVisibile);
  att('la tendina e\' completa', 10, s5.voci.length);
  att('nessun errore JS', 0, f.err.length);
  await f.pg.close();

  // ── F. il collegamento vero: un turno che fallisce DEVE annotare ──
  // Le prove qui sopra verificano la memoria e la UI; questa verifica che
  // qualcuno le colleghi davvero. Senza, tutto il resto sarebbe decorazione.
  console.log('\nF) Un turno con la rete negata annota il fornitore');
  var g = await apri(()=>{ try{
    localStorage.setItem('bsi_ai_provider','zai');
    localStorage.setItem('bsi_api_keys', JSON.stringify({ zai:'zkey-X' }));
  }catch(e){} });
  await g.pg.route('**://api.z.ai/**', r => r.abort('failed'));
  await g.pg.evaluate(()=>{
    var i = document.getElementById('bsi-hub-input');
    i.value = 'ciao';
    document.getElementById('bsi-hub-send').click();
  });
  await g.pg.waitForTimeout(4000);
  var f1 = await g.pg.evaluate(()=>({
    ko: localStorage.getItem('bsi_prov_ko'),
    voci: Array.from(document.getElementById('bsi-hub-provsel').options).map(o=>o.textContent),
    gruppi: Array.from(document.getElementById('bsi-hub-provsel').options).map(o=>o.parentNode.tagName==='OPTGROUP'?o.parentNode.label:''),
    badge: (function(){ var k=document.getElementById('bsi-hub-kobadge');
                        return k && k.style.display !== 'none'; })(),
    msg: document.getElementById('bsi-hub-msgs').textContent
  }));
  att('annotato in localStorage', true, /zai/.test(f1.ko || ''));
  att('conteggio a 1', true, /"n":1/.test(f1.ko || ''));
  att('si sposta nel gruppo dei guasti subito, senza ricaricare', true,
    f1.voci.some((v,i)=>/Z\.AI/.test(v) && /Non hanno risposto/.test(f1.gruppi[i])));
  att('e l\'avviso pure', true, f1.badge);
  att('in chat il messaggio spiega il caso', true, /non accetta chiamate/.test(f1.msg));

  console.log('\nG) Alla seconda volta il messaggio cambia');
  await g.pg.evaluate(()=>{
    var i = document.getElementById('bsi-hub-input');
    i.value = 'ancora';
    document.getElementById('bsi-hub-send').click();
  });
  await g.pg.waitForTimeout(4000);
  var f2 = await g.pg.evaluate(()=>({
    ko: localStorage.getItem('bsi_prov_ko'),
    msg: document.getElementById('bsi-hub-msgs').textContent
  }));
  att('conteggio a 2', true, /"n":2/.test(f2.ko || ''));
  att('smette di dire "puo\' essere la rete" e basta', true, /2ª volta oggi/.test(f2.msg));
  att('e dice cosa fare', true, /altro fornitore|proxy/.test(f2.msg));

  console.log('\nH) Quando il servizio torna a rispondere l\'annotazione sparisce');
  // Un 401 basta: dimostra che il browser al server ci arriva.
  await g.pg.unroute('**://api.z.ai/**');
  await g.pg.route('**://api.z.ai/**', r => r.fulfill({
    status: 401, contentType: 'application/json', body: '{"error":"chiave non valida"}',
    headers: { 'access-control-allow-origin': '*' }
  }));
  await g.pg.evaluate(()=>{
    var i = document.getElementById('bsi-hub-input');
    i.value = 'terza';
    document.getElementById('bsi-hub-send').click();
  });
  await g.pg.waitForTimeout(4000);
  var f3 = await g.pg.evaluate(()=>({
    ko: localStorage.getItem('bsi_prov_ko'),
    voci: Array.from(document.getElementById('bsi-hub-provsel').options).map(o=>o.textContent),
    gruppi: Array.from(document.getElementById('bsi-hub-provsel').options).map(o=>o.parentNode.tagName==='OPTGROUP'?o.parentNode.label:''),
    badge: (function(){ var k=document.getElementById('bsi-hub-kobadge');
                        return k && k.style.display !== 'none'; })()
  }));
  att('annotazione rimossa da un 401', null, f3.ko);
  att('torna nell\'elenco normale', 0, f3.gruppi.filter(g=>g).length);
  att('e l\'avviso pure', false, f3.badge);
  await g.pg.close();

  await b.close();
  console.log('\n' + (ko?'✗ '+ko+' FALLITI, ':'') + ok + ' passati');
  process.exit(ko?1:0);
})();
